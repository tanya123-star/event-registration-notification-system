"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import { addPendingUserAction } from "@/features/users/actions";
import {
  assignableRoles,
  officerPositionLabels,
  roleLabels,
  type AssignableRole,
} from "@/features/users/constants";
import { AddPendingUserSchema, type AddPendingUserPayload } from "@/features/users/schemas";
import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { useModalForm } from "@/lib/hooks/useModalForm";
import {
  isAllowedEmail,
  SCHOOL_EMAIL_DOMAINS_TEXT,
  SCHOOL_EMAIL_REQUIRED_MESSAGE,
} from "@/lib/security/email-domain";
import { createFieldValidator, requiredString } from "@/lib/validation/form-utils";

import styles from "./AddUserModal.module.css";

const NO_POSITION = "none";
const validateEmailFormat = createFieldValidator(AddPendingUserSchema.shape.email);

interface AddUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
  defaultRole?: AssignableRole;
}

export function AddUserModal({
  isOpen,
  onOpenChange,
  onSuccess,
  defaultRole = Role.STUDENT,
}: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(defaultRole);
  const [officerPosition, setOfficerPosition] = useState<OfficerPosition | null>(null);
  const [allowExternalEmail, setAllowExternalEmail] = useState(false);

  const reset = () => {
    setEmail("");
    setRole(defaultRole);
    setOfficerPosition(null);
    setAllowExternalEmail(false);
  };

  const { isPending, submitForm, handleCancel } = useModalForm<AddPendingUserPayload>({
    submit: addPendingUserAction,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: "User added",
    successDescription: "The invitation has been sent to the provided email address.",
    failureMessage: "Failed to add user",
    schema: AddPendingUserSchema,
  });

  function validateEmail(value: unknown): string | null {
    const formatError = validateEmailFormat(value);
    if (formatError) return formatError;
    if (typeof value === "string" && !isAllowedEmail(value, allowExternalEmail)) {
      return SCHOOL_EMAIL_REQUIRED_MESSAGE;
    }
    return null;
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({
      email: requiredString(email),
      role,
      officerPosition: role === Role.OFFICER ? officerPosition : null,
      allowExternalEmail,
    });
  }

  return (
    <Modal className={styles.modal} title="Add user" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            validate={validateEmail}
            isDisabled={isPending}
          />
          <Checkbox
            isSelected={allowExternalEmail}
            onChange={setAllowExternalEmail}
            isDisabled={isPending}
            description={
              role === Role.ADMIN
                ? `Permit an address outside ${SCHOOL_EMAIL_DOMAINS_TEXT}. External admins get full access, so only use this for verified collaborators.`
                : `Permit an address outside ${SCHOOL_EMAIL_DOMAINS_TEXT}. Only use this for verified external collaborators.`
            }
          >
            Allow external email
          </Checkbox>
          <Select
            label="Role"
            value={role}
            onChange={(value) => {
              const selectedRole = String(value) as AssignableRole;
              if (!assignableRoles.includes(selectedRole)) return;
              setRole(selectedRole);
              if (selectedRole !== Role.OFFICER) setOfficerPosition(null);
            }}
            validate={createFieldValidator(AddPendingUserSchema.shape.role)}
            isDisabled={isPending}
          >
            {assignableRoles.map((item) => (
              <SelectItem key={item} id={item}>
                {roleLabels[item]}
              </SelectItem>
            ))}
          </Select>
          {role === Role.OFFICER && (
            <Select
              label="Position"
              value={officerPosition ?? NO_POSITION}
              onChange={(value) =>
                setOfficerPosition(
                  value == null || value === NO_POSITION
                    ? null
                    : (String(value) as OfficerPosition),
                )
              }
              isDisabled={isPending}
            >
              <SelectItem id={NO_POSITION}>No position</SelectItem>
              <SelectItem id={OfficerPosition.PRESIDENT}>
                {officerPositionLabels[OfficerPosition.PRESIDENT]}
              </SelectItem>
            </Select>
          )}
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
              Add user
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
