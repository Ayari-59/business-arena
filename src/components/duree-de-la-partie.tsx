"use client";

import { useEffect, useRef, useState } from "react";
import { planDuFormulaire, seancesEnClair, type EstimationDuScenario } from "@/config/seances";

/**
 * COMBIEN DE SÉANCES LA PARTIE DEMANDERA (séance d'essai, P0-1).
 *
 * Sous « Tours joués » : « 6 tours, environ 3 séances de 55 min ». La partie
 * par défaut demande trois séances, et rien ne le disait au moment de la
 * créer. Le chiffre suit chaque réglage du formulaire (entreprise, niveau,
 * tours, périodicité, questions, tour d'essai) : le composant lit le
 * formulaire qui l'entoure, sans rien lui ajouter.
 */
export function DureeDeLaPartie({
  estimations,
  moisParDefaut,
  sansQuestions,
  codeParDefaut,
  niveauParDefaut,
}: {
  estimations: Record<string, EstimationDuScenario>;
  /** Les tours d'une partie au mois quand « Tours joués » est vide. */
  moisParDefaut: number;
  /** Le code du mode de questions qui n'en pose aucune. */
  sansQuestions: string;
  /** L'entreprise et le niveau que le formulaire propose, pour le premier rendu. */
  codeParDefaut: string;
  niveauParDefaut: number;
}) {
  const ici = useRef<HTMLParagraphElement>(null);
  const [reglages, setReglages] = useState<{
    code: string;
    niveau: number;
    tours: string;
    periodicite: string;
    quiz: string;
    essai: string;
  } | null>(null);

  useEffect(() => {
    const formulaire = ici.current?.closest("form");
    if (!formulaire) return;
    const lire = () => {
      const f = new FormData(formulaire);
      setReglages({
        code: String(f.get("scenarioCode") ?? ""),
        niveau: Number(f.get("level") ?? 3),
        tours: String(f.get("roundsCount") ?? ""),
        periodicite: String(f.get("periodicity") ?? "quarter"),
        quiz: String(f.get("quizMode") ?? ""),
        essai: String(f.get("toursDEssai") ?? ""),
      });
    };
    lire();
    formulaire.addEventListener("input", lire);
    formulaire.addEventListener("change", lire);
    return () => {
      formulaire.removeEventListener("input", lire);
      formulaire.removeEventListener("change", lire);
    };
  }, []);

  const estimation =
    estimations[reglages?.code ?? codeParDefaut] ?? estimations[codeParDefaut] ?? Object.values(estimations)[0];
  if (!estimation) return <p ref={ici} hidden />;

  const demande = reglages ? Number.parseInt(reglages.tours, 10) : Number.NaN;
  const tours = Number.isFinite(demande) && demande > 0
    ? demande
    : reglages?.periodicite === "month"
      ? moisParDefaut
      : estimation.toursEcrits;
  const toursDEssai = reglages ? Number.parseInt(reglages.essai, 10) || 0 : 0;
  const plan = planDuFormulaire(estimation, {
    niveau: reglages?.niveau ?? niveauParDefaut,
    tours,
    avecQuiz: reglages ? reglages.quiz !== sansQuestions : true,
    toursDEssai,
  });

  return (
    <p
      ref={ici}
      data-duree-de-la-partie=""
      aria-live="polite"
      className="mt-2 rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-200"
    >
      <strong className="font-semibold text-slate-100">
        {tours} tour{tours > 1 ? "s" : ""}
        {toursDEssai > 0 ? ` et ${toursDEssai} d'essai` : ""}, {seancesEnClair(plan.seances)}
      </strong>
      {plan.seances > 1 ? ` (${Math.max(...plan.toursParSeance.map((t) => t.length))} tours par séance)` : ""}.{" "}
      <span className="text-slate-400">
        Comptez {plan.premier} min pour le premier tour, {plan.suivant} min pour les suivants. La
        partie attend telle quelle d&apos;une séance à l&apos;autre.
      </span>
    </p>
  );
}
