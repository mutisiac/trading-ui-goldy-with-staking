import type { UserRole } from "../models/user.model.js";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}
