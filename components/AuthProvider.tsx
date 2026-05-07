"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  );
}
