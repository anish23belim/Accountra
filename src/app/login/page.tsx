import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">ACCOUNTRA</h1>
          <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
