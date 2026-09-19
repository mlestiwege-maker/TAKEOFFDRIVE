import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Input from "../../components/Input";
import AuthLayout from "../../layouts/AuthLayout";
import * as authService from "../../services/authService";
import { extractErrorMessage } from "../../services/api";
import { isValidEmail, isValidPhone, isStrongPassword } from "../../utils/validation";

export default function Register() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isValidPhone(phone)) next.phone = "Enter a valid phone number, e.g. +263700000001";
    if (email && !isValidEmail(email)) next.email = "Enter a valid email address";
    if (!isStrongPassword(password)) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await authService.register(phone.trim(), email.trim() || undefined, password);
      await authService.sendOtp(phone.trim());
      navigate("/auth/verify-otp", { state: { phone: phone.trim() } });
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create your driver account</h2>
        {serverError && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{serverError}</div>}
        <Input
          label="Phone number"
          placeholder="+263 700 000 001"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
        />
        <Input
          label="Email (optional)"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" className="mt-2 w-full" isLoading={isSubmitting}>
          Continue
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-brand-600">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
