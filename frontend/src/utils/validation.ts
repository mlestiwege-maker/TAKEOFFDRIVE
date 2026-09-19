export function isValidPhone(phone: string): boolean {
  return /^\+?[0-9]{7,15}$/.test(phone.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidOtpCode(code: string): boolean {
  return /^[0-9]{4,8}$/.test(code.trim());
}
