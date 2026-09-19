import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Input from "../../components/Input";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../hooks/useAuth";
import * as authService from "../../services/authService";
import { extractErrorMessage } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { access_token, role } = await authService.login(identifier.trim(), password);
      await loginWithToken(access_token, role);
      navigate(role === "ADMIN" ? "/admin/dashboard" : "/driver/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sign in</h2>
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
        <Input
          label="Phone or email"
          placeholder="+263700000001"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link to="/auth/register" className="font-semibold text-brand-600">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
