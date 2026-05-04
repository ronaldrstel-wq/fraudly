import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  const links = ["How it works", "Features", "Pricing", "About"];

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="mr-4 inline-flex items-center transition-opacity duration-200 hover:opacity-100 opacity-90">
          <Image
            src="/logo.png"
            alt="Fraudly logo"
            width={120}
            height={40}
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <a key={link} href="#" className="transition hover:text-slate-900">
              {link}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
        >
          Try it free
        </button>
      </div>
    </nav>
  );
}
