import Link from "next/link";
import { EN_MESSAGES } from "@/lib/messages.en";

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">{EN_MESSAGES.payment.cancelTitle}</h1>
      <p className="mt-3 text-slate-600">{EN_MESSAGES.payment.cancelBody}</p>
      <Link
        href="/pricing"
        className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-900"
      >
        {EN_MESSAGES.payment.cancelCta}
      </Link>
    </main>
  );
}
