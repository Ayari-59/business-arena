import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";
import { SiteLogo } from "@/components/site-logo";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session) redirect("/teacher");
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
    </main>
  );
}
