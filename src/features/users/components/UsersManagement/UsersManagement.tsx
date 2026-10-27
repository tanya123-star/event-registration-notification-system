"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaBan, FaCrown, FaPencil, FaUserCheck, FaUserMinus } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import type { ColumnDef } from "@/components/ui/DataTable/DataTable";
import { ServerDataTable } from "@/components/ui/ServerDataTable/ServerDataTable";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import type { FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/ui/Tabs/Tabs";
import { Tooltip, TooltipTrigger } from "@/components/ui/Tooltip/Tooltip";
import {
  cancelPendingInvitationAction,
  getUserManagementPageAction,
  setUserActiveAction,
  updateUserRoleAction,
} from "@/features/users/actions";
import { AddUserModal } from "@/features/users/components/AddUserModal/AddUserModal";
import { EditRoleModal } from "@/features/users/components/EditRoleModal/EditRoleModal";
import { SetPositionModal } from "@/features/users/components/SetPositionModal/SetPositionModal";
import { isAssignableRole, officerPositionLabels, roleLabels } from "@/features/users/constants";
import {
  DEFAULT_PEOPLE_TAB,
  getPeopleTabConfig,
  isPeopleTabKey,
  peopleTabKeys,
  type PeopleTabKey,
} from "@/features/users/people-tabs";
import type { UserManagementRow } from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";
import type { FilterValues, PageQuery } from "@/lib/primitives/types";

import styles from "./UsersManagement.module.css";

interface UsersManagementProps {
  initialRows: UserManagementRow[];
  initialCursor: string | null;
  currentUserId: string;
  presidentName: string | null;
}

const statusFilters: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

export function UsersManagement({
  initialRows,
  initialCursor,
  currentUserId,
  presidentName,
}: UsersManagementProps) {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTab, setSelectedTab] = useState<PeopleTabKey>(DEFAULT_PEOPLE_TAB);
  const [hasChangedTab, setHasChangedTab] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [roleRow, setRoleRow] = useState<UserManagementRow | null>(null);
  const [positionRow, setPositionRow] = useState<UserManagementRow | null>(null);
  const [removeOfficerRow, setRemoveOfficerRow] = useState<UserManagementRow | null>(null);
  const [statusRow, setStatusRow] = useState<UserManagementRow | null>(null);
  const [invitationRow, setInvitationRow] = useState<UserManagementRow | null>(null);

  const tabConfig = getPeopleTabConfig(selectedTab);
  const filtersValue: FilterValues =
    selectedStatuses.length > 0 ? { status: selectedStatuses } : {};

  const refresh = () => setRefreshTrigger((trigger) => trigger + 1);

  const fetchAction = (params: PageQuery) => {
    const selected = params.filters?.status ?? [];
    return getUserManagementPageAction({
      ...params,
      filters: {
        ...(tabConfig.role ? { role: tabConfig.role.map(String) } : {}),
        status: selected.length > 0 ? selected : tabConfig.status,
      },
    });
  };

  const columns: ColumnDef<UserManagementRow>[] = [
    { id: "name", name: "Name", isRowHeader: true },
    { id: "email", name: "Email" },
    {
      id: "role",
      name: "Role",
      render: (_value, row) => (
        <span className={styles.roleCell}>
          {roleLabels[row.role]}
          {row.role === Role.OFFICER && row.officerPosition && (
            <StatusBadge variant="accent">{officerPositionLabels[row.officerPosition]}</StatusBadge>
          )}
        </span>
      ),
    },
    {
      id: "isActive",
      name: "Status",
      render: (_value, row) =>
        row.kind === "pending" ? (
          <StatusBadge variant="pending">Pending</StatusBadge>
        ) : row.isActive ? (
          <StatusBadge variant="done">Active</StatusBadge>
        ) : (
          <StatusBadge variant="danger">Inactive</StatusBadge>
        ),
    },
    {
      id: "id",
      name: "Actions",
      render: (_value, row) => {
        const isSelf = row.kind === "user" && row.id === currentUserId;
        const isOfficer = row.kind === "user" && row.role === Role.OFFICER;
        return (
          <div className={styles.actions}>
            {row.kind === "pending" ? (
              <Button variant="ghost" onPress={() => setInvitationRow(row)}>
                Cancel invitation
              </Button>
            ) : (
              <>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    aria-label="Edit role"
                    isDisabled={row.role === Role.DEV || isSelf}
                    onPress={() => setRoleRow(row)}
                  >
                    <FaPencil aria-hidden="true" className={styles.actionIcon} />
                  </Button>
                  <Tooltip>
                    {row.role === Role.DEV
                      ? "Developer role cannot be edited"
                      : isSelf
                        ? "You cannot change your own role"
                        : "Edit role"}
                  </Tooltip>
                </TooltipTrigger>
                {row.role === Role.OFFICER && row.isActive && (
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      aria-label={row.officerPosition ? "Change position" : "Set position"}
                      onPress={() => setPositionRow(row)}
                    >
                      <FaCrown aria-hidden="true" className={styles.actionIcon} />
                    </Button>
                    <Tooltip>{row.officerPosition ? "Change position" : "Set position"}</Tooltip>
                  </TooltipTrigger>
                )}
                {isOfficer && (
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      aria-label="Remove officer"
                      isDisabled={isSelf}
                      onPress={() => setRemoveOfficerRow(row)}
                    >
                      <FaUserMinus aria-hidden="true" className={styles.actionIcon} />
                    </Button>
                    <Tooltip>
                      {isSelf ? "You cannot change your own role" : "Remove officer"}
                    </Tooltip>
                  </TooltipTrigger>
                )}
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    aria-label={row.isActive ? "Deactivate user" : "Reactivate user"}
                    onPress={() => setStatusRow(row)}
                  >
                    {row.isActive ? (
                      <FaBan aria-hidden="true" className={styles.actionIcon} />
                    ) : (
                      <FaUserCheck aria-hidden="true" className={styles.actionIcon} />
                    )}
                  </Button>
                  <Tooltip>{row.isActive ? "Deactivate" : "Reactivate"}</Tooltip>
                </TooltipTrigger>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      {!presidentName && (
        <p className={styles.presidentNotice}>
          No President appointed. Use the crown action on an Officer to appoint one.
        </p>
      )}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          const next = String(key);
          if (!isPeopleTabKey(next) || next === selectedTab) return;
          setSelectedTab(next);
          setHasChangedTab(true);
          setSelectedStatuses([]);
          setAddOpen(false);
        }}
      >
        <TabList aria-label="People">
          {peopleTabKeys.map((tab) => (
            <Tab key={tab} id={tab}>
              {getPeopleTabConfig(tab).label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel id={selectedTab}>
            <ServerDataTable
              key={selectedTab}
              fetchAction={fetchAction}
              columns={columns}
              initialRows={hasChangedTab ? undefined : initialRows}
              initialCursor={hasChangedTab ? null : initialCursor}
              searchPlaceholder={tabConfig.searchPlaceholder}
              searchLabel={`Search ${tabConfig.label.toLowerCase()}`}
              filters={tabConfig.showStatusFilter ? statusFilters : undefined}
              filtersValue={filtersValue}
              onFiltersChange={(next) => setSelectedStatuses(next.status ?? [])}
              selectionMode="none"
              renderAddButton
              addButtonLabel={tabConfig.addLabel}
              onAddButtonPress={() => setAddOpen(true)}
              refreshTrigger={refreshTrigger}
              emptyContent={tabConfig.emptyContent}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <AddUserModal
        key={selectedTab}
        defaultRole={tabConfig.defaultRole}
        isOpen={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={refresh}
      />
      {positionRow && positionRow.kind === "user" && (
        <SetPositionModal
          key={positionRow.id}
          userId={positionRow.id}
          userLabel={positionRow.name ?? positionRow.email}
          initialPosition={positionRow.officerPosition}
          isOpen
          onOpenChange={(open) => {
            if (!open) setPositionRow(null);
          }}
          onSuccess={refresh}
        />
      )}
      {roleRow && isAssignableRole(roleRow.role) && (
        <EditRoleModal
          userId={roleRow.id}
          userEmail={roleRow.email}
          initialRole={roleRow.role}
          isOpen
          onOpenChange={(open) => {
            if (!open) setRoleRow(null);
          }}
          onSuccess={refresh}
        />
      )}
      <ConfirmDialog
        isOpen={!!removeOfficerRow}
        onOpenChange={(open) => {
          if (!open) setRemoveOfficerRow(null);
        }}
        title="Remove officer"
        confirmLabel="Remove officer"
        onConfirm={async () => {
          if (!removeOfficerRow || removeOfficerRow.kind !== "user") return;
          const result = await updateUserRoleAction({
            userId: removeOfficerRow.id,
            role: Role.STUDENT,
          });
          if (!result.success) {
            toastActionError(result, "remove officer");
            return;
          }
          setRemoveOfficerRow(null);
          refresh();
          toastSuccess(
            "Officer removed",
            `${removeOfficerRow.name ?? removeOfficerRow.email} is now a Student.`,
          );
        }}
      >
        Remove the Officer role from{" "}
        <strong>{removeOfficerRow?.name ?? removeOfficerRow?.email}</strong>? They will become a
        Student and their account history will stay.
        {removeOfficerRow?.officerPosition && " Their President position will also be cleared."}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={!!statusRow}
        onOpenChange={(open) => {
          if (!open) setStatusRow(null);
        }}
        title={statusRow?.isActive ? "Deactivate user" : "Reactivate user"}
        confirmLabel={statusRow?.isActive ? "Deactivate" : "Reactivate"}
        onConfirm={async () => {
          if (!statusRow) return;
          const isActive = !statusRow.isActive;
          const result = await setUserActiveAction({ userId: statusRow.id, isActive });
          if (!result.success) {
            toastActionError(result, isActive ? "reactivate user" : "deactivate user");
            return;
          }
          if (result.data?.selfDeactivated) {
            router.push("/deactivated?reason=deactivated");
            return;
          }
          setStatusRow(null);
          refresh();
          toastSuccess(
            isActive ? "User reactivated" : "User deactivated",
            isActive
              ? `The account for ${statusRow.email} can sign in again.`
              : `The account for ${statusRow.email} has been deactivated.`,
          );
        }}
      >
        {statusRow?.isActive ? (
          <>
            Are you sure you want to deactivate <strong>{statusRow.name ?? statusRow.email}</strong>
            ? They won&apos;t be able to sign in.
          </>
        ) : (
          <>
            Are you sure you want to reactivate{" "}
            <strong>{statusRow?.name ?? statusRow?.email}</strong>? They will be able to sign in
            again.
          </>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={!!invitationRow}
        onOpenChange={(open) => {
          if (!open) setInvitationRow(null);
        }}
        title="Cancel invitation"
        confirmLabel="Cancel invitation"
        onConfirm={async () => {
          if (!invitationRow) return;
          const result = await cancelPendingInvitationAction({
            roleAssignmentId: invitationRow.id,
          });
          if (!result.success) {
            toastActionError(result, "cancel invitation");
            return;
          }
          setInvitationRow(null);
          refresh();
          toastSuccess(
            "Invitation cancelled",
            `The invitation for ${invitationRow.email} has been cancelled.`,
          );
        }}
      >
        Are you sure you want to cancel the invitation for <strong>{invitationRow?.email}</strong>?
        They will need to be invited again.
      </ConfirmDialog>
    </div>
  );
}
