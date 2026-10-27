"use client";

import { FaCircleCheck } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";

import { RegistrationDetails } from "../RegistrationDetails/RegistrationDetails";
import styles from "./RegistrationModal.module.css";

interface RegistrationModalBaseProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  reference: string;
}

type RegistrationModalProps =
  | (RegistrationModalBaseProps & { mode: "success" })
  | (RegistrationModalBaseProps & {
      mode: "manage";
      canCancel: boolean;
      onCancel: () => void;
    });

export function RegistrationModal(props: RegistrationModalProps) {
  const { isOpen, onOpenChange, reference } = props;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className={styles.modal}
      title={
        <span className={styles.titleContent}>
          <span className={styles.check} aria-hidden="true">
            <FaCircleCheck />
          </span>
          You&apos;re registered
        </span>
      }
    >
      {props.mode === "manage" && <p className={styles.subtitle}>Your seat is confirmed.</p>}

      <RegistrationDetails reference={reference} />

      {props.mode === "success" ? (
        <Button variant="primary" className={styles.doneButton} onPress={() => onOpenChange(false)}>
          Done
        </Button>
      ) : (
        <>
          <Button
            variant="secondary"
            className={styles.cancelButton}
            isDisabled={!props.canCancel}
            onPress={props.onCancel}
          >
            Cancel registration
          </Button>

          {!props.canCancel && (
            <p className={styles.reason}>Cancellation is closed because the event has started.</p>
          )}
        </>
      )}
    </Modal>
  );
}
