"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/hooks/useNotification";
import { ErrorBoundary, LogViewer } from "@/components/ErrorBoundary";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <NotificationProvider>
          {children}
          <LogViewer />
        </NotificationProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
