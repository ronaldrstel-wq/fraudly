"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAYPAL_DONATION_URL = "https://www.paypal.com/donate/?business=Ronald.r.stel%40gmail.com";

const HIDDEN_ROUTE_PREFIXES = ["/sign-in", "/sign-up", "/checkout", "/pricing", "/dashboard", "/payment"];

export function DonationFloatingButton() {
  const pathname = usePathname();

  if (pathname && HIDDEN_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-40 w-[170px] sm:bottom-6 sm:right-6 sm:w-[220px] md:w-[250px]">
      <Link
        href={PAYPAL_DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Fraudly with a PayPal donation"
        className="pointer-events-auto block opacity-95 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:opacity-100 focus-visible:scale-105 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2"
      >
        <Image
          src="/images/buy-us-a-coffee-paypal.png"
          alt="Buy us a coffee with PayPal"
          width={500}
          height={180}
          priority={false}
          sizes="(max-width: 640px) 170px, (max-width: 768px) 220px, 250px"
          className="h-auto w-full drop-shadow-xl"
        />
      </Link>
    </div>
  );
}
