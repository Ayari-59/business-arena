import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";
import { DEMO_ACCOUNTS, isDemoSeeded } from "@/services/demo.service";
import { SiteLogo } from "@/components/site-logo";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session) redirect("/teacher");
  const demoSeeded = await isDemoSeeded();
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center text-center">
        <SiteLogo />
        <h1 className="mt-4 text-3xl font-bold">Espace enseignant</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Créez des parties pour vos classes, suivez les décisions de chaque équipe et
          pilotez la clôture des tours.
        </p>
      </div>
      <TeacherAuthForms />
      <Link href="/guide#enseignants" className="text-xs text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline">
        Première fois ? Consultez le guide de prise en main
      </Link>
      {demoSeeded ? (
        <div className="w-full max-w-md rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Comptes de démonstration
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
            <li>
              Admin établissement · {DEMO_ACCOUNTS.orgAdmin.email}
            </li>
            <li>Enseignant · {DEMO_ACCOUNTS.teacher.email}</li>
            <li className="text-slate-400">
              Mot de passe : {DEMO_ACCOUNTS.password}
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            Une classe de 3 tours joués et un concours prêt à lancer vous attendent.
          </p>
        </div>
      ) : null}
    </main>
  );
}
