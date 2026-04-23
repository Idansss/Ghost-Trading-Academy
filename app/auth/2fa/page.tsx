"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { toast } from "sonner";

// AUDIT FIX: useSearchParams() requires a Suspense boundary; extract inner component and wrap.
function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingToken = searchParams.get("token");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Two-factor verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Enter your 6-digit authenticator code</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
              />
            </div>
            <Button
              className="w-full"
              disabled={isLoading || !pendingToken}
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch("/api/auth/2fa/verify-login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: pendingToken, code }),
                  });
                  const payload = (await response.json()) as { loginToken?: string; message?: string };
                  if (!response.ok || !payload.loginToken) {
                    throw new Error(payload.message ?? "Invalid code.");
                  }
                  const result = await signIn("credentials", {
                    loginToken: payload.loginToken,
                    redirect: false,
                  });
                  if (result?.error) {
                    throw new Error("Unable to sign in after verification.");
                  }
                  toast.success("Authentication successful.");
                  router.push("/dashboard");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "2FA failed.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              {isLoading ? "Verifying..." : "Verify and continue"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorContent />
    </Suspense>
  );
}
