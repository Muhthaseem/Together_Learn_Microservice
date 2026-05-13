"use client";
import { useEffect, useState } from "react";
import { metaApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { usersApi } from "@/lib/api";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  department: z.enum(["First Year", "CO", "CE", "ME", "EEE"]),
  batch: z.string().min(1, "Batch is required"),
});

export default function OnboardingPage() {
  const { login } = useAuth();
  const [departments, setDepartments] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setValue } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { department: "First Year" },
  });

  const department = watch("department");

  useEffect(() => {
    Promise.all([metaApi.departments(), metaApi.batches()]).then(([d, b]) => {
      setDepartments(d);
      setBatches(b);
      setValue("batch", b[0]);
    }).catch(() => toast.error("Failed loading options"));
  }, [setValue]);

  useEffect(() => {
    metaApi.courses(department).then(setCourses).catch(() => toast.error("Failed loading courses"));
  }, [department]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const userId = crypto.randomUUID();
      await usersApi.upsert({ userId, name: values.name, department: values.department, batch: values.batch, courses });
      login({ userId, name: values.name, department: values.department, batch: values.batch, courses });
      toast.success("Profile created");
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="flex justify-center mb-4">
        <Image src="/resource/togetherlearn-logo.png" alt="TogetherLearn" width={220} height={66} className="h-14 w-auto" />
      </div>
      <h1 className="text-2xl font-semibold mb-4 text-center">Welcome to TogetherLearn</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 text-center">Set up your profile to personalize your experience.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <Input {...register("name")} />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Department</label>
          <Select {...register("department")}>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium">Batch</label>
          <Select {...register("batch")}>
            {batches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
          {errors.batch && <p className="text-sm text-red-600 mt-1">{errors.batch.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Courses (auto-loaded)</label>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {courses.map((c) => (
              <span key={c} className="text-sm rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1">{c}</span>
            ))}
          </div>
        </div>
        <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Continue"}</Button>
      </form>
    </div>
  );
}


