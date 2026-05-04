import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PaymentSuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/payment/success");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Betaling ontvangen</h1>
      <p className="mt-3 text-slate-600">
        Je betaling is verwerkt. Als Stripe webhook binnen is, staan je credits of Premium actief.
      </p>
      <Link
        href="/#link-check"
        className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 font-semibold text-white"
      >
        Ga verder met checken
      </Link>
    </main>
  );
}
