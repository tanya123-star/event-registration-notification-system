import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

import { OfficerPosition, Role } from "@/generated/prisma/browser";

declare module "next-auth" {
  // Extends the built-in session.user object to include our custom database fields.
  interface Session {
    user: {
      id: string;
      role: Role;
      isActive: boolean;
      officerPosition: OfficerPosition | null;
    } & DefaultSession["user"];
  }

  // Extends the built-in User object returned during authentication hooks.
  interface User extends DefaultUser {
    role?: Role;
    isActive?: boolean;
    officerPosition?: OfficerPosition | null;
  }
}

declare module "next-auth/jwt" {
  // Extends the built-in JWT token interface so TypeScript recognizes custom fields.
  interface JWT extends DefaultJWT {
    id?: string;
    role?: Role;
    isActive?: boolean;
    officerPosition?: OfficerPosition | null;
  }
}
