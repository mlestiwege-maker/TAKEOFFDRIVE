import { Link } from "react-router-dom";
import Button from "../../components/Button";
import AuthLayout from "../../layouts/AuthLayout";

export default function Welcome() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Become a TakeOFF driver</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Register in minutes, verify your phone number, and submit your documents to start delivering.
        </p>
        <Link to="/auth/register">
          <Button className="w-full">Sign up</Button>
        </Link>
        <Link to="/auth/login">
          <Button variant="secondary" className="w-full">
            Sign in
          </Button>
        </Link>
        <Link to="/admin/login" className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400">
          Administrator sign in →
        </Link>
      </div>
    </AuthLayout>
  );
}
