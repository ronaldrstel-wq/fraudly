import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isMonetizationEnabled } from "@/lib/monetization";

export default async function PaymentSuccessPage() {
  if (!isMonetizationEnabled()) {
    redirect("/#link-check");
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/payment/success");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Account ready</h1>
      <p className="mt-3 text-slate-600">You can continue checking websites now.</p>
      <Link
        href="/#link-check"
        className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 font-semibold text-white"
      >
        Continue checking websites
      </Link>
    </main>
  );
}
