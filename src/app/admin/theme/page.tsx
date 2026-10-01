import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformConfig, getStaffContext } from "@/services/admin.service";
import { etatDesContrastes, paletteDuSite, themeParDefaut } from "@/config/theme-du-site";
import { FormulaireTheme } from "@/components/formulaire-theme";

export const dynamic = "force-dynamic";

export default async function ThemeAdminPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const config = await getPlatformConfig();

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Administration générale
          </p>
          <h1 className="text-2xl font-bold">Thème graphique</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-slate-300">
            ← Plateforme
          </Link>
          <Link href="/" className="hover:text-slate-300">
            Landing
          </Link>
        </nav>
      </header>

      <FormulaireTheme
        initial={etatDesContrastes(config.theme)}
        parDefautInitial={themeParDefaut(config.theme)}
        paletteInitiale={paletteDuSite(config.theme)}
      />
    </main>
  );
}
