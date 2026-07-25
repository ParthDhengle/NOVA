"use client";

import { ReactNode, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

interface AuthGateProps {
  children: ReactNode;
}

function AuthGateContent({ children }: AuthGateProps) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading Nova...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

export default function AuthGate({ children }: AuthGateProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading Nova...
        </div>
      }
    >
      <AuthGateContent>{children}</AuthGateContent>
    </Suspense>
  );
}