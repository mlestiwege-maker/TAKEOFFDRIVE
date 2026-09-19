import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Input from "../../components/Input";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import * as authService from "../../services/authService";
import { extractErrorMessage } from "../../services/api";
import { isValidOtpCode } from "../../utils/validation";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const phone = (location.state as { phone?: string } | null)?.phone ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) navigate("/auth/register");
  }, [phone, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidOtpCode(code)) {
      setError("Enter the code sent to your phone.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { access_token, role } = await authService.verifyOtp(phone, code);
      await loginWithToken(access_token, role);
      navigate(role === "ADMIN" ? "/admin/dashboard" : "/driver/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await authService.sendOtp(phone);
      setDebugCode(res.debug_code);
      setNotice("A new code has been sent.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Verify your phone</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We sent a verification code to <span className="font-medium text-slate-700 dark:text-slate-300">{phone}</span>.
        </p>
        {debugCode && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
            Demo mode (no SMS provider configured): your code is <span className="font-bold">{debugCode}</span>
          </div>
        )}
        {notice && <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</div>}
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
        <Input
          label="Verification code"
          placeholder="123456"
          inputMode="numeric"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Verify &amp; continue
        </Button>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-center text-xs font-semibold text-brand-600 hover:underline disabled:text-slate-400"
        >
          {isResending ? "Resending…" : "Resend code"}
        </button>
        <Link to="/auth/register" className="text-center text-xs text-slate-400 dark:text-slate-500">
          ← Use a different number
        </Link>
      </form>
    </AuthLayout>
  );
}
