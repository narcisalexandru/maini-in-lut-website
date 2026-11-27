export type UserRole = "CLIENT" | "ARTIST" | "SUPER_ADMIN";

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  county?: string;
  city?: string;
  street?: string;
  postal_code?: string;
  phone?: string;
  picture?: string;
  role?: UserRole;
  is_email_verified?: boolean;
}
