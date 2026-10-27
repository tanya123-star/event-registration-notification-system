"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { updateUserRoleAction } from "@/features/users/actions";
import { assignableRoles, roleLabels, type AssignableRole } from "@/features/users/constants";
import { UpdateUserRoleSchema, type UpdateUserRolePayload } from "@/features/users/schemas";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { createFieldValidator } from "@/lib/validation/form-utils";

import styles from "./EditRoleModal.module.css";

interface EditRoleModalProps {
  userId: string;
  userEmail: string;
  initialRole: AssignableRole;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function EditRoleModal({
  userId,
  userEmail,
  initialRole,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditRoleModalProps) {
  const [role, setRole] = useState<AssignableRole>(initialRole);

  const { isPending, submitForm, handleCancel } = useModalForm<UpdateUserRolePayload>({
    submit: updateUserRoleAction,
    onOpenChange,
    onSuccess,
    successMessage: "Role updated",
    successDescription: "The user's role has been updated.",
    failureMessage: "Failed to update role",
    schema: UpdateUserRoleSchema,
  });

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({ userId, role });
  }

  return (
    <Modal
      className={styles.modal}
      title={`Edit role for ${userEmail}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <Select
            label="Role"
            value={role}
            onChange={(value) => {
              const selectedRole = String(value) as AssignableRole;
              if (assignableRoles.includes(selectedRole)) setRole(selectedRole);
            }}
            validate={createFieldValidator(UpdateUserRoleSchema.shape.role)}
            isDisabled={isPending}
          >
            {assignableRoles.map((item) => (
              <SelectItem key={item} id={item}>
                {roleLabels[item]}
              </SelectItem>
            ))}
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
              Save role
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
