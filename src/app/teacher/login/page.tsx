import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TeacherAuthForms } from "@/components/teacher-auth-forms";

export const dynamic = "force-dynamic";

export default async function TeacherLoginPage() {
  const session = await getSession();
  if (session) redirect("/teacher");
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
    </main>
  );
}
