"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { TextField } from "@/components/ui/TextField/TextField";
import { sendNotificationAction } from "@/features/notifications/actions";
import {
  SendNotificationSchema,
  type SendNotificationPayload,
} from "@/features/notifications/schemas";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { createFieldValidator, requiredString } from "@/lib/validation/form-utils";

import styles from "./SendNotificationModal.module.css";

interface SendNotificationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function SendNotificationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: SendNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const reset = () => {
    setTitle("");
    setBody("");
  };

  const { isPending, submitForm, handleCancel } = useModalForm<SendNotificationPayload>({
    submit: sendNotificationAction,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: "Notification sent",
    successDescription: "Everyone can now see the announcement in their feed.",
    failureMessage: "Failed to send notification",
    schema: SendNotificationSchema,
  });

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({
      title: requiredString(title),
      body: requiredString(body),
    });
  }

  return (
    <Modal
      className={styles.modal}
      title="Send Notification"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Title"
            value={title}
            onChange={setTitle}
            validate={createFieldValidator(SendNotificationSchema.shape.title)}
            isDisabled={isPending}
          />
          <TextField
            label="Body"
            value={body}
            onChange={setBody}
            isTextArea
            rows={5}
            validate={createFieldValidator(SendNotificationSchema.shape.body)}
            isDisabled={isPending}
          />
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
              Send
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
