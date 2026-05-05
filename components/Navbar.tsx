"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

const navLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/about" }
] as const;

export function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="mr-2 inline-flex shrink-0 items-center opacity-90 transition-opacity duration-200 hover:opacity-100">
          <Image
            src="/logo.png"
            alt="Fraudly — scam and fraud checker"
            width={120}
            height={40}
            sizes="120px"
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className="transition hover:text-slate-900">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="transition hover:text-slate-900">
                {link.label}
              </a>
            )
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!isLoaded ? (
            <span className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" aria-hidden />
          ) : isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:px-4"
                >
                  {EN_MESSAGES.auth.loginCta}
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:brightness-110 sm:px-4"
                >
                  {EN_MESSAGES.auth.signUpCta}
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
