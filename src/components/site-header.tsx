import Link from "next/link";
import { InstallButton } from "@/components/install-button";

export function SiteHeader() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 print:hidden">
      <div className="flex items-center gap-2.5">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo vectoriel statique */}
          <img src="/brand/logo.svg" alt="Business Arena, retour à l'accueil" className="h-8 w-auto" />
        </Link>
        {/* La plateforme évolue vite : le dire évite de faire passer un
            réglage en cours pour un défaut, et invite aux retours. */}
        <span
          title="Version bêta : la plateforme est pleinement utilisable, mais scénarios et contenus évoluent encore. Vos retours sont les bienvenus."
          className="rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300"
        >
          Bêta
        </span>
      </div>
      <div className="flex items-center gap-5 text-sm text-slate-400">
        <Link href="/entreprises" className="hidden hover:text-slate-200 sm:block">
          Entreprises
        </Link>
        <Link href="/ateliers" className="hidden hover:text-slate-200 sm:block">
          Ateliers
        </Link>
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
