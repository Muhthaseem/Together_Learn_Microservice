"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { authApi, metaApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().regex(/^en\d+@foe\.sjp\.ac\.lk$/i, "Use your university email (en…@foe.sjp.ac.lk)"),
  password: z.string().min(6),
  department: z.string().min(1),
  batch: z.string().min(1),
  registrationNumber: z.string().regex(/^EN\d+$/i, "Invalid registration number"),
  indexNumber: z.string().regex(/^\d{2}\/ENG\/\d+$/, "Index number must be YY/ENG/NNN"),
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

export default function RegisterPage() {
  const { login } = useAuth();
  const [departments, setDepartments] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, trigger } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { department: "First Year" } });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordValue = watch("password");
  const emailValue = watch("email");
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    (async () => {
      try {
        const [deps, bats] = await Promise.all([
          metaApi.departments(),
          metaApi.batches(),
        ]);
        setDepartments(deps);
        setBatches(bats);
        if (bats[0]) setValue("batch", bats[0]);
        if (deps[0]) setValue("department", deps[0]);
      } catch {
        // Fallback minimal defaults if API fails
        const DEFAULT_DEPARTMENTS = ["First Year", "CO", "CE", "ME", "EEE"];
        const DEFAULT_BATCHES = ["Batch 1","Batch 2","Batch 3","Batch 4","Batch 5","Batch 6","Batch 7","Batch 8","Batch 9","Batch 10"];
        setDepartments(DEFAULT_DEPARTMENTS);
        setBatches(DEFAULT_BATCHES);
        setValue("batch", DEFAULT_BATCHES[0]);
        setValue("department", DEFAULT_DEPARTMENTS[0]);
      }
    })();
  }, [setValue]);

  useEffect(() => {
    // Auto-fill registration number from email like en102866@foe.sjp.ac.lk
    const m = /^en(\d+)@foe\.sjp\.ac\.lk$/i.exec(emailValue || "");
    if (m) {
      setValue("registrationNumber", `EN${m[1].toUpperCase()}`);
    }
  }, [emailValue, setValue]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const res = await authApi.register(values);
      localStorage.setItem("tl_token", res.token);
      login(res.user);
      toast.success("Registered");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
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
        <h1 className="text-2xl font-semibold mb-1 text-center">Sign up</h1>
        <p className="text-sm text-muted mb-4 text-center">Create your account to get started.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input placeholder="Name" {...register("name")} />
              </div>
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input placeholder="enXXXXX@foe.sjp.ac.lk" {...register("email")} />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number</label>
                <Input placeholder="Registration number" {...register("registrationNumber")} readOnly />
              </div>
              {errors.registrationNumber && <p className="text-sm text-red-600">{errors.registrationNumber.message}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Index Number</label>
                <Input placeholder="YY/ENG/NNN" {...register("indexNumber")} />
              </div>
              {errors.indexNumber && <p className="text-sm text-red-600">{errors.indexNumber.message}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <Select {...register("department")}>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Batch</label>
                <Select {...register("batch")}>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                </Select>
              </div>
              <div className="flex justify-center">
                <Button type="button" onClick={async () => {
                  const ok = await trigger(["name","email","registrationNumber","indexNumber","department","batch"]);
                  if (ok) setStep(2);
                }}>Continue</Button>
              </div>
            </>
          ) : (
            <>
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
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <Input type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute inset-y-0 right-2 flex items-center text-[var(--color-muted)]">
                    {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {confirmPassword && confirmPassword !== passwordValue && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={isSubmitting || (confirmPassword !== passwordValue)}>{isSubmitting ? "Registering..." : "Register"}</Button>
              </div>
            </>
          )}
        </form>
        <div className="mt-3 text-center text-sm text-muted">
        <Link href="/auth/login">Already have an account? Login</Link>       </div>
      </Card>
      </div>
    </div>
  );
}
