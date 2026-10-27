"use client";

import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaCamera, FaCircleCheck, FaQrcode, FaTriangleExclamation } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import type { AttendanceMethod } from "@/generated/prisma/browser";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";
import { formatDate, formatDateTime } from "@/lib/primitives/date";

import { recordAttendanceAction, verifyAttendanceAction } from "../../actions";
import type {
  AttendanceEventOption,
  AttendanceRecordRow,
  AttendanceStats,
  AttendanceVerification,
} from "../../queries";
import styles from "./AttendanceScanner.module.css";

interface AttendanceScannerProps {
  options: AttendanceEventOption[];
  selectedEvent: AttendanceEventOption;
  stats: AttendanceStats;
  recent: AttendanceRecordRow[];
}

interface RecordedCheckIn {
  studentName: string;
  checkedInAt: Date;
}

const DUPLICATE_SCAN_WINDOW_MS = 3000;

function methodLabel(method: AttendanceMethod): string {
  return method === "QR" ? "QR scan" : "Manual entry";
}

export function AttendanceScanner({
  options,
  selectedEvent,
  stats,
  recent,
}: AttendanceScannerProps) {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualReference, setManualReference] = useState("");
  const [verification, setVerification] = useState<AttendanceVerification | null>(null);
  const [method, setMethod] = useState<AttendanceMethod>("QR");
  const [recorded, setRecorded] = useState<RecordedCheckIn | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const verify = useCallback(
    async (reference: string, entryMethod: AttendanceMethod) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setBusy(true);
      setNotice("");
      setRecorded(null);
      setScanning(false);

      const result = await verifyAttendanceAction({ eventId: selectedEvent.id, reference });

      setBusy(false);
      processingRef.current = false;

      if (!result.success || !result.data) {
        toastActionError(result, "verify attendance");
        setNotice(result.error?.description ?? "The reference could not be verified.");
        return;
      }

      setMethod(entryMethod);
      setVerification(result.data);
    },
    [selectedEvent.id],
  );

  const handleDecoded = useCallback(
    (value: string) => {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last.value === value && now - last.at < DUPLICATE_SCAN_WINDOW_MS) return;
      lastScanRef.current = { value, at: now };
      void verify(value, "QR");
    },
    [verify],
  );

  useEffect(() => {
    if (!scanning) return;
    const video = videoRef.current;
    if (!video) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

    let stopped = false;
    const reader = new BrowserQRCodeReader();

    void reader
      .decodeFromVideoDevice(deviceId, video, (result) => {
        if (!result || stopped) return;
        const value = result.getText().trim();
        if (!value) return;
        handleDecoded(value);
      })
      .then((controls) => {
        if (stopped) controls.stop();
        else controlsRef.current = controls;
      })
      .catch((error: unknown) => {
        setScanning(false);
        setCameraError(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Camera permission was denied. Allow access in your browser settings, then try again."
            : "Camera could not start. Use localhost or HTTPS, and make sure no other app is using the camera.",
        );
      });

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, deviceId, handleDecoded]);

  useEffect(() => {
    if (!scanning) return;
    void BrowserQRCodeReader.listVideoInputDevices().then((list) => {
      setDevices(list);
    });
  }, [scanning]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  function handleEventChange(key: string | null) {
    const option = options.find((candidate) => candidate.id === key);
    if (!option || option.id === selectedEvent.id) return;
    router.push(`/attendance/scanner?event=${option.id}`);
  }

  function handleManualSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = manualReference.trim();
    if (!reference) {
      setNotice("Enter the registration reference printed on the student's ticket.");
      return;
    }
    void verify(reference, "MANUAL");
  }

  async function handleConfirm() {
    if (!verification) return;
    setBusy(true);
    setNotice("");

    const result = await recordAttendanceAction({
      eventId: selectedEvent.id,
      reference: verification.reference,
      method,
    });

    setBusy(false);

    if (!result.success || !result.data) {
      toastActionError(result, "record attendance");
      setNotice(result.error?.description ?? "Attendance could not be recorded.");
      return;
    }

    setRecorded({
      studentName: verification.studentName,
      checkedInAt: result.data.checkedInAt,
    });
    setVerification(null);
    setManualReference("");
    toastSuccess("Attendance recorded", `${verification.studentName} is checked in.`);
    router.refresh();
  }

  function handleDismiss() {
    setVerification(null);
    setNotice("");
    startScanning();
  }

  function handleNextStudent() {
    setRecorded(null);
    setNotice("");
    startScanning();
  }

  function startScanning() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setCameraError("This browser does not support camera access. Use manual entry instead.");
      return;
    }
    setCameraError("");
    setScanning(true);
  }

  function handleToggleScanning() {
    if (scanning) {
      setScanning(false);
      return;
    }
    startScanning();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Officer / Attendance</p>
          <h1 className={styles.title}>Attendance Scanner</h1>
          <p className={styles.subtitle}>
            {selectedEvent.title} · {formatDate(selectedEvent.startAt)} · {selectedEvent.venue}
          </p>
        </div>
        <Select
          aria-label="Select event"
          value={selectedEvent.id}
          onChange={(key) => {
            if (typeof key === "string") handleEventChange(key);
          }}
          className={styles.select}
        >
          {options.map((option) => (
            <SelectItem key={option.id} id={option.id}>
              {option.title} — {formatDate(option.startAt)}
            </SelectItem>
          ))}
        </Select>
      </header>

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.cameraPanel} aria-label="QR code scanner">
            <div className={styles.cameraHeader}>
              <h2 className={styles.panelTitle}>
                <FaQrcode aria-hidden="true" /> Scan student QR
              </h2>
              <span className={styles.cameraStatus}>{scanning ? "Camera on" : "Camera off"}</span>
            </div>

            {scanning ? (
              <div className={styles.cameraViewport}>
                <video
                  ref={videoRef}
                  className={styles.camera}
                  muted
                  playsInline
                  autoPlay
                  aria-label="Live camera preview"
                />
                <span className={styles.scanOverlay} aria-hidden="true" />
              </div>
            ) : (
              <div className={styles.cameraPlaceholder}>
                <FaCamera aria-hidden="true" />
                <p>Start the camera to scan a student&apos;s QR ticket.</p>
              </div>
            )}

            <div className={styles.cameraControls}>
              <Button
                type="button"
                variant={scanning ? "secondary" : "primary"}
                onPress={handleToggleScanning}
              >
                {scanning ? "Stop camera" : "Start camera"}
              </Button>
              {scanning && devices.length > 1 && (
                <Select
                  aria-label="Select camera"
                  value={deviceId ?? "default"}
                  onChange={(key) => {
                    if (key === "default") {
                      setDeviceId(undefined);
                      return;
                    }
                    if (typeof key === "string") setDeviceId(key);
                  }}
                  className={styles.cameraSelect}
                >
                  <SelectItem id="default">Default camera</SelectItem>
                  {devices.map((device, index) => (
                    <SelectItem key={device.deviceId} id={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <p className={styles.cameraHint}>
              Align the student&apos;s QR code inside the frame. The code is verified on the server
              before any attendance is recorded.
            </p>

            {cameraError && (
              <p className={styles.cameraError} role="alert">
                <FaTriangleExclamation aria-hidden="true" /> {cameraError}
              </p>
            )}
          </section>

          <section className={styles.manualPanel} aria-label="Manual attendance reference">
            <h2 className={styles.panelTitle}>Enter reference manually</h2>
            <p className={styles.panelHint}>
              Use this when the camera cannot read the QR code. Manual entry is verified with the
              same server-side rules as scanning.
            </p>
            <form className={styles.manualForm} onSubmit={handleManualSubmit}>
              <TextField
                label="Registration reference"
                placeholder="KASAMA-XXXXXXXXXXXXXXX"
                value={manualReference}
                onChange={setManualReference}
                isRequired
                autoComplete="off"
              />
              <Button type="submit" variant="primary" isDisabled={busy}>
                {busy && method === "MANUAL" ? "Verifying…" : "Verify reference"}
              </Button>
            </form>
          </section>

          {notice && (
            <p className={styles.notice} role="alert">
              <FaTriangleExclamation aria-hidden="true" /> {notice}
            </p>
          )}

          {verification && (
            <section className={styles.confirmPanel} aria-labelledby="verify-title">
              <div className={styles.confirmHeader}>
                <h2 id="verify-title" className={styles.panelTitle}>
                  <FaCircleCheck aria-hidden="true" /> Verified student
                </h2>
                <span className={styles.methodPill}>{methodLabel(method)}</span>
              </div>
              <dl className={styles.details}>
                <div className={styles.detailRow}>
                  <dt>Student</dt>
                  <dd>{verification.studentName}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Student number</dt>
                  <dd>{verification.studentNumber ?? "Not on record"}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Event</dt>
                  <dd>{verification.eventTitle}</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Reference</dt>
                  <dd>
                    <code className={styles.reference}>{verification.reference}</code>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Status</dt>
                  <dd>
                    {verification.alreadyCheckedInAt
                      ? `Already checked in at ${formatDateTime(verification.alreadyCheckedInAt)}`
                      : "Not yet checked in"}
                  </dd>
                </div>
              </dl>
              <div className={styles.confirmActions}>
                <Button variant="secondary" type="button" onPress={handleDismiss} isDisabled={busy}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onPress={() => void handleConfirm()}
                  isDisabled={busy || verification.alreadyCheckedInAt !== null}
                >
                  {busy ? "Recording…" : "Confirm attendance"}
                </Button>
              </div>
            </section>
          )}

          {recorded && (
            <section className={styles.successPanel} role="status" aria-live="polite">
              <h2 className={styles.panelTitle}>
                <FaCircleCheck aria-hidden="true" /> Attendance recorded
              </h2>
              <p className={styles.successText}>
                {recorded.studentName} was checked in at {formatDateTime(recorded.checkedInAt)}.
              </p>
              <Button variant="primary" type="button" onPress={handleNextStudent}>
                Scan next student
              </Button>
            </section>
          )}
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.statCard} aria-label="Attendance summary">
            <h2 className={styles.panelTitle}>{selectedEvent.title}</h2>
            <p className={styles.statMeta}>{formatDate(selectedEvent.startAt)}</p>
            <dl className={styles.statList}>
              <div className={styles.detailRow}>
                <dt>Registered</dt>
                <dd>{stats.registered}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Checked in</dt>
                <dd>{stats.checkedIn}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Not checked in</dt>
                <dd>{stats.notCheckedIn}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Today</dt>
                <dd>{stats.todayCheckIns}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Completion</dt>
                <dd>{stats.completionRate}%</dd>
              </div>
            </dl>
            {stats.registered > 0 && (
              <progress
                className={styles.progress}
                value={stats.checkedIn}
                max={stats.registered}
                aria-label="Attendance completion"
              />
            )}
          </section>

          <section className={styles.recentCard} aria-label="Recent check-ins">
            <h2 className={styles.panelTitle}>Recent check-ins</h2>
            {recent.length > 0 ? (
              <ul className={styles.recentList}>
                {recent.map((row) => (
                  <li key={row.id} className={styles.recentRow}>
                    <span className={styles.recentName}>{row.studentName}</span>
                    <span className={styles.recentMeta}>
                      {methodLabel(row.method)} · {formatDateTime(row.checkedInAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.recentEmpty}>No check-ins yet for this event.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
