import { CircleAlert } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/Auth/LoginForm";
import { TestAuthForm } from "@/components/Auth/TestAuthForm";
import { auth } from "@/lib/auth";
import { isTestMode } from "@/lib/auth/environment";
import { isValidReimbursementInvite } from "@/lib/server/reimbursementInvites/data";
import { redeemReimbursementInvite } from "@/lib/server/reimbursementInvites/redemption";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  params: Promise<{ token: string }>;
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Image src="/AppIcon.png" alt="" width={40} height={40} priority />
          <span className="text-xl font-bold">YBase</span>
        </div>
        {children}
      </div>
    </main>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <InviteShell>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleAlert aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>Einladung nicht verfügbar</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </InviteShell>
  );
}

export default async function ReimbursementInvitePage({ params }: Props) {
  const [{ token }, session] = await Promise.all([params, auth()]);

  if (session?.user) {
    try {
      await redeemReimbursementInvite(token);
    } catch (error) {
      return (
        <InviteError
          message={
            error instanceof Error
              ? error.message
              : "Die Einladung konnte nicht eingelöst werden."
          }
        />
      );
    }
    redirect("/reimbursements/new");
  }

  if (!(await isValidReimbursementInvite(token))) {
    return <InviteError message="Dieser Einladungslink ist ungültig." />;
  }

  const callbackUrl = `/invite/${token}`;
  const loginForm = isTestMode() ? (
    <TestAuthForm callbackUrl={callbackUrl} />
  ) : (
    <LoginForm callbackUrl={callbackUrl} />
  );

  return (
    <div className="flex min-h-svh -mt-24 items-center justify-center p-8">
      <div className="w-full max-w-sm">{loginForm}</div>
    </div>
  );
}
