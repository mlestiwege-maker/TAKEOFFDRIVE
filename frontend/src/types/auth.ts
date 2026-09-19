export type UserRole = "DRIVER" | "ADMIN";

export interface CurrentUser {
  id: number;
  phone: string;
  email: string | null;
  role: UserRole;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
}

export interface SendOTPResponse {
  message: string;
  expires_in_seconds: number;
  debug_code: string | null;
}
