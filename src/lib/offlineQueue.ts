import type { SupabaseClient } from "@supabase/supabase-js";
import { createId } from "@/lib/utils";

type QueueKind = "upsert" | "update" | "soft_delete";

export type OfflinePlannerMutation = {
  id: string;
  kind: QueueKind;
  familyId: string;
  plannerItemId: string;
  payload: Record<string, unknown>;
  queuedAt: string;
};

const DB_NAME = "softweek-offline";
const STORE_NAME = "planner-mutations";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage could not be opened."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline storage request failed."));
  });
}

export async function enqueuePlannerMutation(input: Omit<OfflinePlannerMutation, "id" | "queuedAt">) {
  if (typeof indexedDB === "undefined") throw new Error("Offline changes are not supported in this browser.");
  const db = await openDatabase();
  const mutation: OfflinePlannerMutation = {
    ...input,
    id: createId("offline"),
    queuedAt: new Date().toISOString(),
  };
  const transaction = db.transaction(STORE_NAME, "readwrite");
  await requestResult(transaction.objectStore(STORE_NAME).put(mutation));
  db.close();
  return mutation;
}

export async function readPlannerQueue(): Promise<OfflinePlannerMutation[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const rows = await requestResult(transaction.objectStore(STORE_NAME).getAll()) as OfflinePlannerMutation[];
  db.close();
  return rows.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

async function removeMutation(id: string) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  await requestResult(transaction.objectStore(STORE_NAME).delete(id));
  db.close();
}

export async function replayPlannerQueue(supabase: SupabaseClient) {
  const queue = await readPlannerQueue();
  let replayed = 0;

  for (const mutation of queue) {
    let error: { message?: string } | null = null;
    if (mutation.kind === "upsert") {
      ({ error } = await supabase.from("planner_items").upsert(mutation.payload, { onConflict: "id" }));
    } else {
      ({ error } = await supabase
        .from("planner_items")
        .update(mutation.payload)
        .eq("id", mutation.plannerItemId)
        .eq("family_id", mutation.familyId));
    }

    if (error) throw new Error(error.message || "An offline change could not be synchronized.");
    await removeMutation(mutation.id);
    replayed += 1;
  }

  return replayed;
}
