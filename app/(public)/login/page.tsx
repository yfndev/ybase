import { redirect } from "next/navigation";
import { LoginForm } from "@/components/Auth/LoginForm";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-svh -mt-24 items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
