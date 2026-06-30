"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { adminApi, coursesApi, CourseModule, AdminUser } from "@/lib/api";
import toast from "react-hot-toast";
import { ShieldCheckIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/solid";

type Tab = "users" | "courses";

export default function AdminPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Courses state
  const [courses, setCourses] = useState<CourseModule[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseForm, setCourseForm] = useState({
    courseCode: "", title: "", department: "", semester: 1, credits: 3, description: "", preReqs: "",
  });
  const [submittingCourse, setSubmittingCourse] = useState(false);

  useEffect(() => {
    if (ready && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab, usersPage, userSearch]);

  useEffect(() => {
    if (tab === "courses") loadCourses();
  }, [tab]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await adminApi.listUsers(userSearch || undefined, usersPage, 20);
      setUsers(res.items);
      setUsersTotal(res.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      const list = await coursesApi.list();
      setCourses(list);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function toggleRole(u: AdminUser) {
    const newRole = u.role === "ADMIN" ? "STUDENT" : "ADMIN";
    try {
      await adminApi.updateUserRole(u.userId, newRole);
      setUsers(prev => prev.map(x => x.userId === u.userId ? { ...x, role: newRole } : x));
      toast.success(`${u.name} is now ${newRole}`);
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function deleteCourse(courseCode: string) {
    if (!confirm(`Delete course ${courseCode}?`)) return;
    try {
      await coursesApi.remove(courseCode);
      setCourses(prev => prev.filter(c => c.code !== courseCode));
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  }

  async function submitCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!courseForm.courseCode || !courseForm.title || !courseForm.department) {
      toast.error("Course code, title and department are required");
      return;
    }
    setSubmittingCourse(true);
    try {
      await coursesApi.create({
        courseCode: courseForm.courseCode,
        title: courseForm.title,
        description: courseForm.description || undefined,
        department: courseForm.department,
        semester: courseForm.semester,
        credits: courseForm.credits || undefined,
        preReqs: courseForm.preReqs || undefined,
      });
      toast.success("Course created");
      setCourseForm({ courseCode: "", title: "", department: "", semester: 1, credits: 3, description: "", preReqs: "" });
      loadCourses();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create course");
    } finally {
      setSubmittingCourse(false);
    }
  }

  if (!ready || user?.role !== "ADMIN") return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheckIcon className="h-7 w-7 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-token">
        {(["users", "courses"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-muted hover:text-[var(--color-primary)]"}`}
          >
            {t === "users" ? "Users" : "Courses"}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUsersPage(0); }}
              className="flex-1 rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {loadingUsers ? (
            <p className="text-sm text-muted py-8 text-center">Loading users...</p>
          ) : (
            <div className="rounded-xl border border-token overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-accent)]/10">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Name</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Dept / Batch</th>
                    <th className="text-left px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.userId} className="border-t border-token hover:bg-[var(--color-accent)]/5">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <UserCircleIcon className="h-5 w-5 text-muted shrink-0" />
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted hidden md:table-cell">{u.email}</td>
                      <td className="px-4 py-2 text-muted hidden sm:table-cell">{u.department} · {u.batch}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "ADMIN"
                          ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={u.userId === user.userId}
                          title={u.userId === user.userId ? "Cannot change own role" : `Make ${u.role === "ADMIN" ? "Student" : "Admin"}`}
                          className="text-xs px-3 py-1 rounded-full border border-token hover:bg-[var(--color-accent)]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {u.role === "ADMIN" ? "Demote" : "Promote"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {usersTotal > 20 && (
            <div className="flex items-center justify-between text-sm text-muted">
              <span>{usersTotal} users total</span>
              <div className="flex gap-2">
                <button disabled={usersPage === 0} onClick={() => setUsersPage(p => p - 1)}
                  className="px-3 py-1 rounded border border-token disabled:opacity-40">Prev</button>
                <span className="px-2 py-1">Page {usersPage + 1}</span>
                <button disabled={(usersPage + 1) * 20 >= usersTotal} onClick={() => setUsersPage(p => p + 1)}
                  className="px-3 py-1 rounded border border-token disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Courses Tab ── */}
      {tab === "courses" && (
        <div className="space-y-6">
          {/* Add course form */}
          <div className="rounded-xl border border-token p-5 bg-[var(--color-surface)]">
            <h2 className="font-semibold mb-4">Add New Course</h2>
            <form onSubmit={submitCourse} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Course Code *</label>
                <input value={courseForm.courseCode} onChange={e => setCourseForm(f => ({ ...f, courseCode: e.target.value }))}
                  placeholder="e.g. CS3012" className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Title *</label>
                <input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Distributed Systems" className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Department *</label>
                <input value={courseForm.department} onChange={e => setCourseForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. CSE" className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Semester</label>
                  <input type="number" min={1} max={8} value={courseForm.semester} onChange={e => setCourseForm(f => ({ ...f, semester: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Credits</label>
                  <input type="number" min={1} max={6} value={courseForm.credits} onChange={e => setCourseForm(f => ({ ...f, credits: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Optional course description"
                  className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Prerequisites</label>
                <input value={courseForm.preReqs} onChange={e => setCourseForm(f => ({ ...f, preReqs: e.target.value }))}
                  placeholder="e.g. CS2011, CS2012 (optional)" className="w-full rounded-lg border border-token bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button type="submit" disabled={submittingCourse}
                  className="px-5 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {submittingCourse ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>

          {/* Course list */}
          {loadingCourses ? (
            <p className="text-sm text-muted py-8 text-center">Loading courses...</p>
          ) : (
            <div className="rounded-xl border border-token overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-accent)]/10">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Code</th>
                    <th className="text-left px-4 py-2 font-medium">Title</th>
                    <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Dept</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Sem</th>
                    <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Credits</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.code} className="border-t border-token hover:bg-[var(--color-accent)]/5">
                      <td className="px-4 py-2 font-mono text-xs font-semibold">{c.code}</td>
                      <td className="px-4 py-2">{c.title}</td>
                      <td className="px-4 py-2 text-muted hidden sm:table-cell">{c.department}</td>
                      <td className="px-4 py-2 text-muted hidden md:table-cell">{c.semester}</td>
                      <td className="px-4 py-2 text-muted hidden md:table-cell">{c.credits ?? "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => deleteCourse(c.code)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete course">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {courses.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No courses yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
