"use client";

import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { SessionUser } from "@/features/auth/types";

import { AppSidebar } from "./app-sidebar";

interface DashboardShellProps {
  user: SessionUser;
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      {/* min-w-0 lets wide content (tables) scroll inside instead of widening the page. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-md font-medium text-muted-foreground">
            Salary Management Platform
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
