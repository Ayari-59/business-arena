import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";
import { DEMO_ACCOUNTS, isDemoSeeded } from "@/services/demo.service";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session) redirect("/teacher");
  const demoSeeded = await isDemoSeeded();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-2 text-3xl font-bold">Espace enseignant</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Créez des parties pour vos classes, suivez les décisions de chaque équipe et
          pilotez la clôture des tours.
        </p>
      </div>
      <TeacherAuthForms />
      {demoSeeded ? (
        <div className="w-full max-w-md rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Comptes de démonstration
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
            <li>
              Admin établissement — {DEMO_ACCOUNTS.orgAdmin.email}
            </li>
            <li>Enseignant — {DEMO_ACCOUNTS.teacher.email}</li>
            <li className="text-slate-400">
              Mot de passe : {DEMO_ACCOUNTS.password}
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Une classe de 3 tours joués et un concours prêt à lancer vous attendent.
          </p>
        </div>
      ) : null}
    </main>
  );
}
