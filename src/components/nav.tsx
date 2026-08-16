"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Building2,
  Contact,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/companies", label: "Companies", icon: Building2 },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          Inflate AI <span className="text-muted-foreground font-normal">CRM</span>
        </span>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
