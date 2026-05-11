"use client";

import Image from "next/image";
import Link from "next/link";

const PAYPAL_DONATION_URL = "https://www.paypal.com/donate/?business=Ronald.r.stel%40gmail.com";

export function ResultSupportBox({ className = "" }: { className?: string }) {
  return (
    <aside className={`rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm ${className}`.trim()}>
      <h3 className="text-sm font-medium text-slate-700">Help keep Fraudly free</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Fraudly uses hosting, security checks, and reputation signals to help people spot suspicious websites.
      </p>
      <p className="mt-1 text-xs text-slate-500">Support is optional, but appreciated.</p>
      <Link
        href={PAYPAL_DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Fraudly with a PayPal donation"
        className="mt-3 inline-block rounded-xl transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2"
      >
        <Image
          src="/images/buy-us-a-coffee-paypal.png"
          alt="Buy us a coffee with PayPal"
          width={340}
          height={220}
          sizes="(max-width: 640px) 190px, (max-width: 768px) 220px, 240px"
          className="h-auto w-[190px] drop-shadow-md sm:w-[220px] md:w-[240px]"
        />
      </Link>
    </aside>
  );
}
