"use client";

import { useSearchParams } from "next/navigation";

import { Link } from "@/components/ui/Link/Link";
import { SCHOOL_EMAIL_DOMAINS_TEXT } from "@/lib/security/email-domain";

import styles from "./AuthErrorPage.module.css";

const errorMap: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: "Something went wrong",
    message:
      "We encountered a problem on our end. Please try signing in again. If the issue persists, contact your administrator.",
  },
  AccessDenied: {
    title: "Access denied",
    message:
      "You don't have permission to sign in with this account. Your account may have been deactivated. If this is a mistake, please contact your administrator.",
  },
  Domain: {
    title: "Email domain not allowed",
    message: `Use your school account (${SCHOOL_EMAIL_DOMAINS_TEXT}), or ask an administrator to invite this email.`,
  },
  Deactivated: {
    title: "Account deactivated",
    message: "Your account has been deactivated. Please contact an administrator.",
  },
  Verification: {
    title: "Link expired",
    message: "This sign-in link is no longer valid. Please go back and try signing in again.",
  },
  Default: {
    title: "Sign in failed",
    message:
      "We couldn't complete the sign-in. Please try again or contact your administrator if the issue continues.",
  },
};

export function AuthErrorContent() {
  const error = useSearchParams().get("error");
  const errorInfo = (error && errorMap[error]) || errorMap.Default;

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>{errorInfo.title}</h1>
      <p className={styles.message}>{errorInfo.message}</p>
      <Link href="/sign-in">Back to sign in</Link>
    </div>
  );
}
