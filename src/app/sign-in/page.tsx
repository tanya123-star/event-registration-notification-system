import Image from "next/image";

import { SignInForm } from "@/features/auth/components/SignInForm/SignInForm";
import { SwitchAccountPanel } from "@/features/auth/components/SwitchAccountPanel/SwitchAccountPanel";
import { roleLabels } from "@/features/users/constants";
import { auth } from "@/lib/infra/auth";

import styles from "./page.module.css";

function resolveCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function resolveLoginHint(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : undefined;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; loginHint?: string }>;
}) {
  const { callbackUrl, loginHint } = await searchParams;
  const session = await auth();
  const signedInUser = session?.user;
  const displayName = signedInUser?.name ?? signedInUser?.email ?? "your account";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/school-logo.svg"
          alt="School logo"
          width={120}
          height={120}
          className={styles.brandMark}
          priority
        />
        <h1 className={styles.greetings}>Welcome to Event Registration & Notification</h1>
        <p className={styles.description}>
          {signedInUser
            ? "You're already signed in. Sign out to use a different Google account."
            : "Sign in with your school Google account"}
        </p>
        {signedInUser ? (
          <SwitchAccountPanel
            name={displayName}
            email={signedInUser.email ?? ""}
            roleLabel={roleLabels[signedInUser.role]}
          />
        ) : (
          <SignInForm
            callbackUrl={resolveCallbackUrl(callbackUrl)}
            loginHint={resolveLoginHint(loginHint)}
          />
        )}
        {!signedInUser && (
          <p className={styles.note}>Need access? Contact your school administrator</p>
        )}
      </section>
    </main>
  );
}
