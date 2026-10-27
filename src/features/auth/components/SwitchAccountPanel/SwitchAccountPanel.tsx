"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button/Button";

import styles from "./SwitchAccountPanel.module.css";

interface SwitchAccountPanelProps {
  name: string;
  email: string;
  roleLabel: string;
}

export function SwitchAccountPanel({ name, email, roleLabel }: SwitchAccountPanelProps) {
  const accountMeta = [email, roleLabel].filter(Boolean).join(" · ");

  return (
    <div className={styles.panel}>
      <div className={styles.identity}>
        <p className={styles.name}>{name}</p>
        <p className={styles.meta}>{accountMeta}</p>
      </div>
      <Button
        variant="secondary"
        className={styles.button}
        onPress={() => void signOut({ redirectTo: window.location.href })}
      >
        Sign out
      </Button>
    </div>
  );
}
