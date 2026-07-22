import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "soft";
};

export default function Button({
  href,
  children,
  variant = "primary",
}: ButtonProps) {
  const className = `btn btn-${variant}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <button className={className} type="button">{children}</button>;
}