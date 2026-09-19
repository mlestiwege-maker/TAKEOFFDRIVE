import { api } from "./api";
import type { CurrentUser, SendOTPResponse, TokenResponse } from "../types/auth";

export async function register(phone: string, email: string | undefined, password: string) {
  const { data } = await api.post<CurrentUser>("/api/auth/register", { phone, email, password });
  return data;
}

export async function sendOtp(phone: string) {
  const { data } = await api.post<SendOTPResponse>("/api/auth/send-otp", { phone });
  return data;
}

export async function verifyOtp(phone: string, code: string) {
  const { data } = await api.post<TokenResponse>("/api/auth/verify-otp", { phone, code });
  return data;
}

export async function login(identifier: string, password: string) {
  const { data } = await api.post<TokenResponse>("/api/auth/login", { identifier, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get<CurrentUser>("/api/auth/me");
  return data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}
