"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { fetchJson } from "@/lib/client-api";
import { registerSchema } from "@/lib/validators";
import type { z } from "zod";

type RegisterValues = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: true,
    },
  });

  const passwordStrength = getPasswordStrength(watch("password"));

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await fetchJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      toast.success("Account created.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
      setIsSubmitting(false);
    }
  });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Card>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Join Ghost VIP</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create your member account. VIP upgrades are managed by admins.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Ghost Trader" {...register("name")} />
                {errors.name ? (
                  <p className="text-xs text-[color:var(--color-red)]">{errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email ? (
                  <p className="text-xs text-[color:var(--color-red)]">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pr-11"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Progress value={passwordStrength} />
                {errors.password ? (
                  <p className="text-xs text-[color:var(--color-red)]">{errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-11"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="text-xs text-[color:var(--color-red)]">
                    {errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={Boolean(watch("terms"))}
                  onCheckedChange={(checked) => setValue("terms", checked === true)}
                />
                I confirm the information above is accurate.
              </label>
              {errors.terms ? (
                <p className="text-xs text-[color:var(--color-red)]">{errors.terms.message}</p>
              ) : null}

              <Button className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
