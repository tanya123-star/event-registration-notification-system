"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { setOfficerPositionAction } from "@/features/users/actions";
import { officerPositionLabels } from "@/features/users/constants";
import { SetOfficerPositionSchema, type SetOfficerPositionPayload } from "@/features/users/schemas";
import { OfficerPosition } from "@/generated/prisma/browser";
import { useModalForm } from "@/lib/hooks/useModalForm";

import styles from "./SetPositionModal.module.css";

const NO_POSITION = "none";

interface SetPositionModalProps {
  userId: string;
  userLabel: string;
  initialPosition: OfficerPosition | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function SetPositionModal({
  userId,
  userLabel,
  initialPosition,
  isOpen,
  onOpenChange,
  onSuccess,
}: SetPositionModalProps) {
  const [position, setPosition] = useState<OfficerPosition | null>(initialPosition);

  const { isPending, submitForm, handleCancel } = useModalForm<SetOfficerPositionPayload>({
    submit: setOfficerPositionAction,
    onOpenChange,
    onSuccess,
    successMessage: "Position updated",
    successDescription: "The officer's position has been updated.",
    failureMessage: "Failed to update position",
    schema: SetOfficerPositionSchema,
  });

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({ userId, officerPosition: position });
  }

  return (
    <Modal
      className={styles.modal}
      title={`Set position for ${userLabel}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <Select
            label="Position"
            value={position ?? NO_POSITION}
            onChange={(value) =>
              setPosition(
                value == null || value === NO_POSITION ? null : (String(value) as OfficerPosition),
              )
            }
            isDisabled={isPending}
          >
            <SelectItem id={NO_POSITION}>No position</SelectItem>
            <SelectItem id={OfficerPosition.PRESIDENT}>
              {officerPositionLabels[OfficerPosition.PRESIDENT]}
            </SelectItem>
          </Select>
          <div className={styles.actions}>
            <Button
              className={styles.button}
              type="button"
              variant="secondary"
              onPress={handleCancel}
              isDisabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className={styles.button}
              type="submit"
              variant="primary"
              isDisabled={isPending}
              isPending={isPending}
            >
              Save position
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
