"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import dynamic from "next/dynamic";
import { ChevronDownIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, Bars3Icon, HomeIcon, ChatBubbleLeftRightIcon, UserGroupIcon, AcademicCapIcon, BellIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { notificationsApi } from "@/lib/api";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon },
  { href: "/dashboard/questions", label: "Q&A", Icon: ChatBubbleLeftRightIcon },
  { href: "/dashboard/groups", label: "Group Study", Icon: UserGroupIcon },
  { href: "/dashboard/peer", label: "Peer Classes", Icon: AcademicCapIcon },
] as const;

function BrandLogo() {
  const { theme, systemTheme } = useTheme();
  const current = theme === 'system' ? systemTheme : theme;
  const src = current === 'dark' ? '/resource/togetherlearn-logo-length-dark.png' : '/resource/togetherlearn-logo-length-light.png';
  return <Image src={src} alt="TogetherLearn" width={320} height={48} className="h-10 md:h-12 w-auto max-w-[180px] sm:max-w-none object-contain" priority key={current === 'dark' ? 'dark' : 'light'} />;
}

const BrandLogoCSR = dynamic(() => Promise.resolve(BrandLogo), { ssr: false });

export function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const React = require("react") as any;
  const [mobileOpen, setMobileOpen] = React.useState(false) as [boolean, (v: boolean) => void];
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false) as [boolean, (v: boolean) => void];
  const [unread, setUnread] = React.useState(0) as [number, (v: number) => void];

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const count = await notificationsApi.unreadCount();
        if (mounted) setUnread(count);
      } catch {/* ignore */}
    }
    load();
    const t = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-token bg-[var(--color-surface)] shadow-sm">
      <div className="flex flex-1 items-center gap-2 min-w-0 sm:flex-none">
        <button type="button" aria-label="Open menu" className="sm:hidden p-2 rounded-md hover:bg-[var(--color-accent)]/10" onClick={() => setMobileOpen(true)}>
          <Bars3Icon className="h-6 w-6 text-muted" />
        </button>
        <div className="font-semibold select-none cursor-default flex-shrink" aria-label="TogetherLearn">
        <BrandLogoCSR />
        </div>
      </div>
      <nav className="hidden sm:flex items-center gap-4">
        {links.map((l) => {
          const active = l.href === "/dashboard" ? (pathname === "/dashboard") : pathname?.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={`px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-2 relative ${active
                ? "bg-[var(--color-primary)]/90 text-[var(--color-on-primary)] shadow-sm backdrop-blur animate-pill"
                : "text-muted hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]/15"}`}
            >
              <l.Icon className="h-4 w-4" />
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
        {user?.role === 'ADMIN' && (
          <Link
            href="/dashboard/admin"
            aria-current={pathname?.startsWith('/dashboard/admin') ? 'page' : undefined}
            className={`px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-2 relative ${pathname?.startsWith('/dashboard/admin')
              ? "bg-[var(--color-primary)]/90 text-[var(--color-on-primary)] shadow-sm backdrop-blur animate-pill"
              : "text-muted hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)]/15"}`}
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>
        )}
      </nav>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Desktop: show controls separately */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/dashboard/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-token bg-[var(--color-surface)] shadow-sm hover:bg-[var(--color-accent)]/20 transition-colors" aria-label="Notifications">
            <BellIcon className="h-5 w-5 text-muted" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
          <ThemeToggle />
          {user ? (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex items-center gap-2 rounded-full border border-token bg-[var(--color-surface)] px-3 py-1 text-sm shadow-sm hover:bg-[var(--color-accent)]/20 transition-colors">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="avatar" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <UserCircleIcon className="h-4 w-4" />
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </Menu.Button>
              <Transition as={Fragment}
                enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right rounded-lg border border-token surface shadow-xl ring-1 ring-black/5 focus:outline-none p-3 flex flex-col gap-2 z-50">
                  <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-[var(--color-accent)]/10 text-sm">
                    <UserCircleIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                    <span>Profile</span>
                  </Link>
                  {user && (
                    <button type="button" className="flex items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50 text-sm" onClick={logout}>
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <Link href="/auth/login" className="text-sm rounded border border-token px-3 py-1">Login</Link>
          )}
        </div>
        {/* Mobile: hamburger for sidebar, avatar for profile menu */}
        <div className="sm:hidden flex items-center gap-2">
          <button type="button" aria-label="Open profile menu" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-token bg-[var(--color-surface)] shadow-sm hover:bg-[var(--color-accent)]/20 transition-colors" onClick={() => setProfileMenuOpen(true)}>
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="avatar" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <UserCircleIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {profileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
            <div className="absolute right-2 top-14 w-44 rounded-lg border border-token surface shadow-xl p-3 flex flex-col gap-2 z-50">
              {/* Theme and Notification in a single row with circle buttons, both styled as circles */}
              <div className="flex justify-center gap-3 mb-2">
                <button type="button" title="Notifications" className="h-9 w-9 rounded-full border border-token bg-[var(--color-surface)] shadow-sm flex items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors" onClick={() => { setProfileMenuOpen(false); window.location.href = '/dashboard/notifications'; }}>
                  <BellIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center">{unread > 99 ? '99+' : unread}</span>
                  )}
                </button>
                <div title="Toggle theme" className="h-9 w-9 rounded-full border border-token bg-[var(--color-surface)] shadow-sm flex items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors">
                  <ThemeToggle />
                </div>
              </div>
              <Link href="/dashboard/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-[var(--color-accent)]/10 text-sm">
                <UserCircleIcon className="h-5 w-5 text-[var(--color-secondary)]" />
                <span>Profile</span>
              </Link>
              {user && (
                <button type="button" className="flex items-center gap-2 rounded-md px-3 py-2 text-red-600 hover:bg-red-50 text-sm" onClick={() => { setProfileMenuOpen(false); logout(); }}>
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
    {/* Mobile drawer */}
    {mobileOpen && (
      <div className="fixed inset-0 z-50 sm:hidden" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
        <div className="absolute left-0 top-0 h-full w-72 surface border-r border-token shadow-xl p-4 flex flex-col gap-2">
          <div className="font-semibold mb-2">Menu</div>
          {links.map((l) => {
            const isDashboard = l.href === "/dashboard";
            const active = isDashboard ? pathname === "/dashboard" : pathname?.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2 ${active ? 'bg-[var(--color-accent)]/20' : 'hover:bg-[var(--color-accent)]/10'}`}>
                <l.Icon className="h-5 w-5 text-[var(--color-secondary)]" />
                <span>{l.label}</span>
              </Link>
            );
          })}
          {/* Notifications shortcut in drawer */}
          <Link href="/dashboard/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-[var(--color-accent)]/10">
            <BellIcon className="h-5 w-5 text-[var(--color-secondary)]" />
            <span>Notifications</span>
          </Link>
          {user?.role === 'ADMIN' && (
            <Link href="/dashboard/admin" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2 ${pathname?.startsWith('/dashboard/admin') ? 'bg-[var(--color-accent)]/20' : 'hover:bg-[var(--color-accent)]/10'}`}>
              <ShieldCheckIcon className="h-5 w-5 text-[var(--color-secondary)]" />
              <span>Admin</span>
            </Link>
          )}
        </div>
      </div>
    )}
  </>
  );
}


