# Authentication and Access

## Google is the only sign-in method

The application does not store passwords. Every sign-in goes through Google. School accounts use the
`@acdeducation.com` and `@acd.edu.ph` domains. New external Google accounts are accepted only when an administrator has
invited the address and approved external access.

The sign-in page is public and offers one action: **Continue with Google**. After the OAuth round trip, the application
decides whether the person may enter and, for a first-time user, what role (and officer position) they receive.

## How sign-in is decided

1. Google returns a verified email address. Unverified or missing addresses are rejected.
2. If a local account already exists, it must still be active.
3. The address must be allowed: a school address, the configured developer email, an existing privileged account, or an
   invited external address with external access approved.
4. A first-time user is created from their pending invitation. Without one, a school account starts as a student and the
   developer email starts as a developer.
5. The session is issued with the user's current role, officer position, and active status. Those values are refreshed
   from the database rather than frozen at sign-in.

A deactivated account gets the clearer deactivation message before the domain check runs. An unapproved external address
never becomes a user record.

## Invitations

Inviting is an admin capability. The form collects an email, a role, an optional officer position, and an external-email
decision. The role picker offers student, officer, and admin; the developer role is reserved for bootstrap and cannot be
assigned through the UI. The officer position is accepted only for the officer role; inviting an officer with the
President position makes them the single global President on first sign-in.

The invitation is stored as a pending record. It is a decision made before the person arrives, not a user account. The
email is the identity key, so inviting the same address again updates the pending record instead of creating a
duplicate.

### External email

The **Allow external email** checkbox is only meaningful for addresses outside the school domain. The form and the
server schema both reject an external address unless it is enabled. Choosing the admin role shows a stronger warning,
because an external admin receives full administrative access.

### First sign-in and re-invites

The first successful sign-in consumes the invitation. The new account receives the pending role and officer position, the
external approval is copied when relevant, and the pending record is deleted. A pending President replaces a sitting
President in the same transaction.

If the email already belongs to an existing user, a new pending record is not applied. The existing role, position, and
external-email setting stay as they are. Re-inviting an existing user therefore does not change their access; this is a
known limitation.

### Cancelling

An admin can cancel a pending invitation from **People**. This deletes the pending record. If the person has not
signed in yet, they can no longer create an account through that invitation. If they already have an account,
cancelling a newer pending record has no effect on it.

### Invitation email

The invitation email is sent after the pending record is written. If SMTP fails, the action reports an error but the
pending record remains; inviting the same address again is the retry path.

## Access changes during a session

Role changes and deactivations do not require the person to sign out and back in. Session data is refreshed from the
database, so the next protected request sees the current role and active status.

- Deactivation blocks sign-in, existing sessions, and action guards. Reactivation restores access with the same role and
  active-status state. Deactivating a President clears the officer position.
- A role change is visible on the next request. An admin page guard redirects if the new role no longer has access.
- If an admin changes their own role to a non-admin role, the client sends them to a notice page instead of leaving them
  on a page they can no longer use.
- An admin or developer can deactivate themselves only when another active admin remains (a developer is a recovery
  account and does not count as the second admin); the user is then sent to the deactivated notice page.

The system also protects itself from losing its last active admin. The last active admin cannot be demoted or
deactivated. The developer role cannot be assigned or edited through the normal role workflow, and no one may change
their own role in either direction.

There is no user deletion workflow. Deactivation is the supported way to remove access while keeping the account's
history and references intact.

## Notice pages

Access failures land on a page that explains what happened and what to do next:

| Situation                               | What the person sees                                      |
| --------------------------------------- | --------------------------------------------------------- |
| No session on a protected page          | A prompt to sign in.                                      |
| Email domain not allowed                | An explanation that a school account or invite is needed. |
| Account deactivated                     | A message to contact an administrator.                    |
| Signed in but missing a page permission | An access-denied page.                                    |
| Admin removes their own admin access    | A confirmation that the change succeeded.                 |
| Unknown authentication failure          | A generic sign-in error with a way back.                  |

These pages contain no application data. They exist so expected access changes do not end in a generic error boundary.

## Authorization

The central permission matrix is the policy. It grants capabilities by role, and the officer position refines the Officer
column (for example, only the President may create events or tasks). There is no club scoping. The matrix is mirrored in
[RBAC.md](./RBAC.md); a policy change is not complete until both are updated.

Every protected write starts with a server-side guard. Page-level guards perform the same evaluation for reads but
redirect to a notice page on expected failures. Actions throw typed errors that their catch path turns into safe
responses.

Client-side checks are presentation only. The sidebar hides administration links for roles without access, and the
notification feed hides the composer from students. These improve the experience but protect nothing; a hand-crafted
request still meets the server guard.

## Validation and error handling

Actions that accept application data validate it with Zod before doing work. The schemas are shared with the client so
the form can show the same messages, but the server never assumes the client ran them. Inputs are typed payloads rather
than raw form data, and IDs, enums, and cross-field rules are validated instead of cast.

Read actions return data directly and let unexpected failures reach the framework. Write actions catch failures and
return a structured response envelope with a user-facing title and description. Known guard, not-found, conflict, and
unique-constraint errors map to presets; anything unclassified is logged on the server and returned as a generic
failure.

Prisma is imported only in the server-side data layer, the seed script, and the auth adapter. Required secrets are read
through server-only environment access and must never be exposed through public environment variables.

## Google account linking

The Google provider allows an existing local account to be linked when the verified email matches, instead of failing
with an "account not linked" error. The sign-in callback also requires a verified email. In practice, the local account
is only as trustworthy as the verified Google address behind it, so this is worth remembering when changing the auth
configuration.

## Current gaps

The application does not yet have an audit log, application-level rate limiting, a user deletion workflow, or a formal
threat model beyond the boundaries described here. The domain check is an invitation mechanism, not a complete
multi-tenant isolation layer. Admins and developers have broad access by design.

[ROADMAP.md](./ROADMAP.md) covers the product limitations that matter for planning.
