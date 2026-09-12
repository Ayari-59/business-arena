import { getProgressionScore } from "@/services/learning-progress.service";

interface TeamLearningProgress {
  teamId: string;
  teamName: string;
  completedSteps: string[];
  progressByPath: Array<{
    pathId: string;
    pathName: string;
    completed: number;
    total: number;
  }>;
}

interface TeacherLearningDashboardProps {
  teamsProgress: TeamLearningProgress[];
}

export async function TeacherLearningDashboard({
  teamsProgress,
}: TeacherLearningDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Progression pédagogique</h2>
        <p className="mt-1 text-sm text-slate-400">
          Suivi de la progression de vos équipes dans les sentiers d'apprentissage
        </p>
      </div>

      <div className="space-y-4">
        {teamsProgress.map((team) => {
          const progressScore = getProgressionScore(team.completedSteps);

          return (
            <div
              key={team.teamId}
              className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-700">
                <h3 className="font-semibold text-slate-50">{team.teamName}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Progression globale</span>
                      <span className="text-xs font-semibold text-amber-300">
                        {progressScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                        style={{ width: `${progressScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                    {team.completedSteps.length} étapes
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-700">
                {team.progressByPath.map((pathProgress) => (
                  <div key={pathProgress.pathId} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-200">
                          {pathProgress.pathName}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex-1 mr-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400"
                              style={{
                                width: `${
                                  pathProgress.total > 0
                                    ? Math.round(
                                        (pathProgress.completed / pathProgress.total) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {pathProgress.completed}/{pathProgress.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {teamsProgress.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
          <p className="text-sm text-slate-400">Aucune équipe en progression pédagogique</p>
        </div>
      )}
    </div>
  );
}
