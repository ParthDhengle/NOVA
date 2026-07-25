"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import ProfileSetupForm from "@/components/auth/ProfileSetupForm";

interface ProfileGateProps {
  children: ReactNode;
}

export default function ProfileGate({
  children,
}: ProfileGateProps) {
  const { needsProfileSetup } = useAuth();

  if (needsProfileSetup) {
    return (
      <ProfileSetupForm
        onComplete={() => {
          window.location.reload();
        }}
      />
    );
  }

  return <>{children}</>;
}