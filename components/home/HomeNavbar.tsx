"use client";

import { NavbarView } from "@/components/navbar/NavbarView";
import { useHomeAuth } from "@/components/home/HomeAuthContext";

export function HomeNavbar() {
  const { authReady, signedIn } = useHomeAuth();
  return <NavbarView isSignedIn={signedIn} authReady={authReady} />;
}
