import Link from "next/link";
import { InstallButton } from "@/components/install-button";

export function SiteHeader() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 print:hidden">
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo vectoriel statique */}
        <img src="/brand/logo.svg" alt="Business Arena — Accueil" className="h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-5 text-sm text-slate-400">
        <Link href="/parcours" className="hidden hover:text-slate-200 sm:block">
          Parcours
        </Link>
        <Link href="/guide" className="hidden hover:text-slate-200 sm:block">
          Guide
        </Link>
        <Link href="/concepts" className="hidden hover:text-slate-200 sm:block">
          Concepts
        </Link>
        <Link href="/teacher/login" className="hidden hover:text-slate-200 sm:block">
          Enseignants
        </Link>
        <Link href="/compete" className="hidden hover:text-slate-200 sm:block">
          Concours
        </Link>
        <InstallButton />
      </div>
    </nav>
  );
}
