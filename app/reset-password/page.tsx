import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-6">
      <div className="w-full max-w-md">
        <p className="micro-label">ACCOUNT</p>
        <h1 className="mt-5 text-5xl font-medium">Reset password.</h1>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
