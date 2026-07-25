"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize Firebase first - importing the module is enough to run its setup.
import "@/lib/firebase";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { AuthProvider } from "@/context/AuthContext";
import { NovaProvider } from "@/context/NovaContext";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AuthProvider>
          <NovaProvider>
            {children}
          </NovaProvider>
        </AuthProvider>

      </TooltipProvider>
    </QueryClientProvider>
  );
}