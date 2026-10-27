# Setup and Run

Follow these steps to run the project locally from a fresh clone.

## Prerequisites

- Node.js 22 and pnpm 9+ (the Nix flake pins `nodejs_22` and `pnpm`)
- Docker Engine with Docker Compose v2 (for local PostgreSQL and Mailpit)
- Optional: Nix with flakes. The repo includes a dev shell with Node, pnpm, Prisma, Docker, and `just`:

  ```bash
  direnv allow        # if using direnv
  # or
  nix develop
  ```

  The Docker daemon must still be running.

## Steps

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start local services (PostgreSQL and Mailpit):

   ```bash
   docker compose up -d
   ```

3. Create the environment file and fill in the required values:

   ```bash
   cp .env.example .env
   ```

   | Variable                                | Required | Notes                                                                     |
   | --------------------------------------- | -------- | ------------------------------------------------------------------------- |
   | `DATABASE_URL`                          | Yes      | Defaults to the Docker Postgres instance (`kasama` database).             |
   | `AUTH_SECRET`                           | Yes      | Generate with `openssl rand -hex 32`.                                     |
   | `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Yes      | Google OAuth credentials.                                                 |
   | `SMTP_HOST` / `SMTP_PORT`               | No       | `.env.example` points at Mailpit (`localhost:1025`); needed to send mail. |
   | `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | No       | Leave empty for Mailpit.                                                  |
   | `DEV_EMAIL`                             | No       | Bootstraps a `DEV` account on startup and bypasses the domain gate.       |

   For Google OAuth, add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

4. Generate the Prisma client and apply the committed migrations:

   ```bash
   pnpm prisma:generate
   pnpm prisma:deploy
   ```

5. Optional: load sample users, events, and notifications:

   ```bash
   pnpm prisma:seed
   ```

6. Start the app:

   ```bash
   pnpm dev
   ```

   Open <http://localhost:3000>. Sign in with an `@acdeducation.com` or `@acd.edu.ph` Google account, with the email
   configured as `DEV_EMAIL`, or with an external address an administrator invited by enabling **Allow external email**
   in **People**. Emails sent by the app appear in Mailpit at <http://localhost:8025>.

The same startup flow is wrapped by `just`:

```bash
just dev
```

After dependencies and `.env` are in place, `just dev` starts Docker, generates the Prisma client, applies migrations,
and runs `pnpm dev`. It does not seed the database.

## Useful commands

| Command               | What it does                                         |
| --------------------- | ---------------------------------------------------- |
| `pnpm validate`       | Format, lint, and typecheck.                         |
| `pnpm test`           | Run unit tests.                                      |
| `pnpm build`          | Generate the Prisma client and build for production. |
| `pnpm storybook`      | Run the component workshop.                          |
| `docker compose down` | Stop local services (keeps the database volume).     |
| `just clean`          | Stop local services and remove the database volume.  |

If `pnpm prisma:migrate` is used while changing `schema.prisma`, it creates a new migration during development. Use
`pnpm prisma:deploy` to apply existing migrations.
