"use client";

import clsx from "clsx";
import Image from "next/image";
import { toDataURL } from "qrcode";
import { useEffect, useState } from "react";
import { FaCopy } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { toastError, toastSuccess } from "@/lib/hooks/toast-utils";

import styles from "./RegistrationDetails.module.css";

const QR_SIZE = 220;

interface RegistrationDetailsProps {
  reference: string;
  className?: string;
  note?: React.ReactNode;
}

export function RegistrationDetails({ reference, className, note }: RegistrationDetailsProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generateQr() {
      setQrDataUrl(null);
      setQrFailed(false);
      try {
        const dataUrl = await toDataURL(reference, {
          width: QR_SIZE,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#0f2440", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        if (!cancelled) setQrFailed(true);
      }
    }

    void generateQr();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      toastSuccess("Reference copied", "The confirmation reference is on your clipboard.");
    } catch {
      toastError(
        "Could not copy reference",
        "Select the confirmation reference and copy it manually.",
      );
    }
  }

  return (
    <div className={clsx(styles.details, className)}>
      <div
        className={styles.qrPanel}
        aria-busy={!qrDataUrl && !qrFailed}
        data-failed={qrFailed || undefined}
      >
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt={`QR code for confirmation ${reference}`}
            width={QR_SIZE}
            height={QR_SIZE}
            unoptimized
            className={styles.qr}
          />
        ) : qrFailed ? (
          <span className={styles.qrFallback}>QR code unavailable</span>
        ) : (
          <span className={styles.qrPlaceholder} aria-hidden="true" />
        )}
      </div>

      <div className={styles.referenceBlock}>
        <div className={styles.referenceText}>
          <span className={styles.referenceLabel}>Confirmation reference</span>
          <code className={styles.reference}>{reference}</code>
        </div>
        <Button
          variant="ghost"
          className={styles.copyButton}
          aria-label="Copy confirmation reference"
          onPress={handleCopy}
        >
          <FaCopy aria-hidden="true" />
        </Button>
      </div>

      <p className={styles.note}>
        {note ?? "Keep this reference. It stays the same if you cancel and register again."}
      </p>
    </div>
  );
}
