import { redirect } from "next/navigation";
import { LoginForm } from "@/components/Auth/LoginForm";
import { TestAuthForm } from "@/components/Auth/TestAuthForm";
import { auth } from "@/lib/auth";
import { isTestMode } from "@/lib/auth/environment";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const loginForm = isTestMode() ? (
    <TestAuthForm />
  ) : (
    <LoginForm />
  );

  return (
    <div className="flex min-h-svh -mt-24 items-center justify-center p-8">
      <div className="w-full max-w-sm">{loginForm}</div>
    </div>
  );
}
