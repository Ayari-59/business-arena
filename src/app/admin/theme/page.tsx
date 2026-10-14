import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPlatformConfig, getStaffContext } from "@/services/admin.service";
import { etatDesContrastes, paletteDuSite } from "@/config/theme-du-site";
import { FormulaireTheme } from "@/components/formulaire-theme";
import { EnTeteAdmin } from "@/components/en-tete-admin";

export const dynamic = "force-dynamic";

export default async function ThemeAdminPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const config = await getPlatformConfig();

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <EnTeteAdmin titre="Thème graphique" actif="theme" />

      <FormulaireTheme
        initial={etatDesContrastes(config.theme)}
        paletteInitiale={paletteDuSite(config.theme)}
      />
    </main>
  );
}
