import Link from "next/link";
import { isMonetizationEnabled } from "@/lib/monetization";
import { redirect } from "next/navigation";

export default function PaymentCancelPage() {
  if (!isMonetizationEnabled()) {
    redirect("/#link-check");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Action canceled</h1>
      <p className="mt-3 text-slate-600">No changes were made. You can continue checking websites anytime.</p>
      <Link
        href="/#link-check"
        className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-900"
      >
        Back to checker
      </Link>
    </main>
  );
}
