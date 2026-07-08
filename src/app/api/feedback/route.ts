import { NextResponse } from "next/server";

const feedbackTo = process.env.FEEDBACK_TO_EMAIL || "support@softweekplanner.com";
const feedbackFrom =
  process.env.FEEDBACK_FROM_EMAIL || "SoftWeek Planner <no-reply@softweekplanner.com>";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        kind?: unknown;
        message?: unknown;
        email?: unknown;
        page?: unknown;
      }
    | null;

  const kind = clean(body?.kind) || "SoftWeek feedback";
  const message = clean(body?.message);
  const email = clean(body?.email);
  const page = clean(body?.page) || "Not listed";

  if (message.length < 4) {
    return NextResponse.json(
      { ok: false, message: "Add a short feedback note first." },
      { status: 400 }
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { ok: false, message: "That note is a little too long. Please shorten it and send again." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The feedback email route is not connected yet. Add RESEND_API_KEY in Vercel, or email support@softweekplanner.com.",
      },
      { status: 503 }
    );
  }

  const text = [
    `Kind: ${kind}`,
    `Page: ${page}`,
    email ? `Reply email: ${email}` : "Reply email: Not provided",
    "",
    message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#24313f;">
      <h2>SoftWeek feedback</h2>
      <p><strong>Kind:</strong> ${escapeHtml(kind)}</p>
      <p><strong>Page:</strong> ${escapeHtml(page)}</p>
      <p><strong>Reply email:</strong> ${email ? escapeHtml(email) : "Not provided"}</p>
      <hr />
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: feedbackFrom,
      to: [feedbackTo],
      subject: `SoftWeek feedback: ${kind}`,
      text,
      html,
      ...(email ? { reply_to: email } : {}),
    }),
  });

  if (!resendResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "The email provider did not accept the message. Please email support@softweekplanner.com for now.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
