import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { games } from "@/db/schema/game";
import { classes } from "@/db/schema/identity";
import { getGameLearningProgress } from "@/services/learning-progress.service";
import { TeacherLearningDashboard } from "@/components/learning-paths/teacher-learning-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Progression pédagogique",
  description: "Suivi de la progression de vos élèves dans les sentiers d'apprentissage",
};

export default async function TeacherLearningPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");

  const me = await getStaffContext(session.userId);

  if (!me) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Authentification requise</h1>
        <p className="max-w-md text-sm text-slate-400">
          Vous devez être connecté en tant qu'enseignant pour accéder à cette page.
        </p>
        <Link
          href="/teacher/login"
          className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          Aller à l'espace enseignant
        </Link>
      </main>
    );
  }

  // Get teacher's classes
  const teacherClasses = await db
    .select({ classId: classes.id })
    .from(classes)
    .where(eq(classes.teacherId, me.userId));

  const classIds = teacherClasses.map((c) => c.classId);

  // Get games for teacher's classes
  const teamsProgress: Array<{
    teamId: string;
    teamName: string;
    completedSteps: string[];
    progressByPath: Array<{
      pathId: string;
      pathName: string;
      completed: number;
      total: number;
    }>;
  }> = [];

  if (classIds.length > 0) {
    const gameRows = await db
      .select({ gameId: games.id })
      .from(games)
      .where(inArray(games.classId, classIds));

    // Get learning progress for all games
    const allProgress = await Promise.all(
      gameRows.map((g) => getGameLearningProgress(g.gameId))
    );
    teamsProgress.push(...allProgress.flat());
  }

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-1 text-3xl font-bold">Progression pédagogique</h1>
        <p className="mt-2 text-sm text-slate-400">
          Suivez la progression de vos élèves à travers les sentiers d'apprentissage.
          Chaque étape complétée renforce leur maîtrise des notions métier.
        </p>
      </header>

      <TeacherLearningDashboard teamsProgress={teamsProgress} />

      <div className="flex gap-3 justify-center pt-6 border-t border-slate-700">
        <Link
          href="/teacher"
          className="text-sm text-slate-400 underline-offset-4 hover:underline"
        >
          ← Retour à l'espace enseignant
        </Link>
        <span className="text-slate-600">·</span>
        <Link
          href="/learning"
          className="text-sm text-slate-400 underline-offset-4 hover:underline"
        >
          Voir vos sentiers →
        </Link>
      </div>
    </main>
  );
}
