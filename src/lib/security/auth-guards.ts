import { redirect } from "next/navigation";

import type { OfficerPosition, Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";
import { DeactivatedError, ForbiddenError, UnauthorizedError } from "@/lib/security/errors";
import { canWithPosition, type Permission } from "@/lib/security/rbac";

/** Minimal authenticated-user projection shared by the auth guards. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  officerPosition: OfficerPosition | null;
}

/**
 * Enforces an authenticated session and returns the verified user.
 *
 * @returns The authenticated user projection.
 * @throws {UnauthorizedError} when the session is missing a required field.
 * @throws {DeactivatedError} when the account has been deactivated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email || !user.name || !user.role) throw new UnauthorizedError();
  if (user.isActive === false) throw new DeactivatedError();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    officerPosition: user.officerPosition ?? null,
  };
}

/**
 * Enforces the session and that the user holds at least one of the given
 * permissions, evaluated against the central RBAC matrix
 * (`src/lib/security/rbac.ts`).
 *
 * @param permissions - One or more granular permissions; the caller must be
 *                      granted at least one.
 * @returns The authenticated user when authorized.
 * @throws {UnauthorizedError} when there is no session.
 * @throws {ForbiddenError} when no permission is granted.
 */
export async function requirePermission(...permissions: Permission[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (
    !permissions.some((permission) => canWithPosition(user.role, user.officerPosition, permission))
  )
    throw new ForbiddenError();
  return user;
}

/**
 * Runs a page-level permission check and converts guard failures into
 * user-facing redirects.
 *
 * @param callbackUrl - Path to restore after sign-in, or `null` for the default.
 * @param permissions - One or more granular permissions.
 * @returns The authenticated user when authorized.
 */
async function authorizePage(
  callbackUrl: string | null,
  permissions: Permission[],
): Promise<AuthenticatedUser> {
  try {
    return await requirePermission(...permissions);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect(
        callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in",
      );
    }
    if (error instanceof DeactivatedError) redirect("/deactivated?reason=deactivated");
    if (error instanceof ForbiddenError) redirect("/access-denied");
    throw error;
  }
}

/**
 * Enforces the session and permissions for a route-level Server Component.
 *
 * Unlike {@link requirePermission}, failures redirect to a user-facing notice
 * instead of throwing, so stale client navigation after a role change never
 * reaches the error boundary. Server Actions must keep using
 * {@link requirePermission} and return envelopes.
 *
 * @param permissions - One or more granular permissions; the caller must be
 *                      granted at least one.
 * @returns The authenticated user when authorized.
 */
export async function requirePagePermission(
  ...permissions: Permission[]
): Promise<AuthenticatedUser> {
  return authorizePage(null, permissions);
}

/**
 * Enforces the session and permissions for a route-level Server Component and
 * returns the user to `callbackUrl` after signing in.
 *
 * Use this on entry points reached from a shared link or QR code, where losing
 * the destination after sign-in would drop the user's context.
 *
 * @param callbackUrl - Same-origin path to restore after sign-in.
 * @param permissions - One or more granular permissions; the caller must be
 *                      granted at least one.
 * @returns The authenticated user when authorized.
 */
export async function requirePagePermissionWithCallback(
  callbackUrl: string,
  ...permissions: Permission[]
): Promise<AuthenticatedUser> {
  return authorizePage(callbackUrl, permissions);
}
