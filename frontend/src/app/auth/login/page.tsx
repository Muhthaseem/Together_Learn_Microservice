"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const schema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(6),
});

function AuthLogo() {
  const { theme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const src = current === 'dark' ? '/resource/togetherlearn-logo-dark.png' : '/resource/togetherlearn-logo-light.png';
  return (
    <Image src={src} alt="TogetherLearn" width={180} height={54} priority key={current === 'dark' ? 'dark' : 'light'} />
  );
}

const AuthLogoCSR = dynamic(() => Promise.resolve(AuthLogo), { ssr: false });

export default function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await authApi.login(values);
      localStorage.setItem("tl_token", res.token);
      login({ ...res.user, role: res.user.role });
      toast.success("Logged in");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="mx-auto max-w-md w-full">
      <Card>
      <div className="flex justify-center mb-3">
        <AuthLogoCSR />
      </div>
        <h1 className="text-2xl font-semibold mb-1 text-center">Log In</h1>
        <p className="text-sm text-muted mb-4 text-center">Welcome back. Please log in to continue.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Username / Email</label>
            <Input placeholder="Username or email" {...register("email")} />
          </div>
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Password" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          <div className="flex justify-center">
            <Button disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Login"}</Button>
          </div>
        </form>
        <div className="mt-3 text-center text-sm text-muted">
        <Link href="/auth/register" className="underline">Don&apos;t have an account? Register</Link>
        </div>
      </Card>
      </div>
    </div>
  );
}
