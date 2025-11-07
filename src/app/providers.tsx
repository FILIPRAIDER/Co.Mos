"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/hooks/useNotification";
import { ErrorBoundary, LogViewer } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <NotificationProvider>
          {children}
          <OfflineIndicator />
          <LogViewer />
        </NotificationProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
