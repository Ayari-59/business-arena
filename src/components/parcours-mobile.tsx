"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { bouton } from "@/components/bouton";
import { definirProgression, type SegmentDeProgression } from "@/lib/progression-parcours";
import { PHASES, type PhaseDuTour } from "@/config/phases-du-tour";

/**
 * LE TOUR, EN PARCOURS, SUR TÉLÉPHONE.
 *
 * Une application ne présente pas une page découpée en onglets : elle mène d'un
 * écran à l'autre. Ici, le tour est une suite de cartes — le briefing en
 * plusieurs cartes, l'analyse, puis les décisions — avec une barre de progression
 * en haut (celle de la partie) et un seul bouton en bas : « Continuer ».
 *
 * Les trois onglets Situation / Analyser / Décider ont disparu : ils obligeaient à
 * se demander où l'on était et à quel onglet revenir. Le parcours ne laisse qu'une
 * question, la suivante. Ce qu'on a lu se relit par « Retour ».
 *
 * La page serveur fournit les cartes déjà construites : ce composant ne sait rien
 * du jeu, il ordonne. Sur grand écran, c'est SegmentedTabs qui reste (voir la
 * page d'arène).
 *
 * LES DÉCISIONS ONT LEUR PROPRE PIED. Le formulaire garde sa navigation interne
 * (précédent, suivant, valider) : il déclare ici où il en est, pour que la barre
 * de progression reste une seule, et demande « retour » quand on recule depuis sa
 * première carte.
 */
export interface CarteDuParcours {
  cle: string;
  noeud: ReactNode;
  /** Le temps du tour auquel elle appartient : « briefing » par défaut. */
  phase?: "resultats" | "briefing";
  /** Un titre en tête de carte, sous l'amorce du temps du tour. */
  titre?: string;
}

/** Les analyses du tour : leur contenu, et le poids qu'elles ont dans la barre de progression. */
export interface AnalyseDuParcours extends CarteDuParcours {
  etapes: number;
}

interface ContexteDuParcours {
  /** Le formulaire de décision dit où il en est : carte courante, nombre de cartes. */
  rapporterDecision: (courante: number, total: number) => void;
  /** Reculer depuis la première carte de décision : retour à l'analyse. */
  reculerAvantLesDecisions: () => void;
}

const ParcoursContexte = createContext<ContexteDuParcours | null>(null);

/** Nul hors parcours : le formulaire se comporte alors comme sur grand écran. */
export function useParcours(): ContexteDuParcours | null {
  return useContext(ParcoursContexte);
}

export function ParcoursMobile({
  briefing,
  analyse,
  courrier,
  decisions,
}: {
  briefing: CarteDuParcours[];
  analyse: AnalyseDuParcours[];
  /** Le courrier du tour (solo) : une carte avant les décisions, qui en dépendent. */
  courrier: ReactNode | null;
  decisions: ReactNode;
}) {
  const etapes = useMemo(() => {
    const liste: {
      phase: PhaseDuTour;
      cle: string;
      noeud: ReactNode;
      rang: number;
      sur: number;
      poids: number;
      titre?: string;
    }[] = [];
    // Le rang se compte DANS le temps du tour : « briefing 2 sur 5 », pas 2 sur les 8 cartes
    // qui précèdent les décisions, résultats compris.
    const sur: Record<string, number> = {};
    for (const c of briefing) sur[c.phase ?? "briefing"] = (sur[c.phase ?? "briefing"] ?? 0) + 1;
    const vues: Record<string, number> = {};
    for (const c of briefing) {
      const ph = c.phase ?? "briefing";
      vues[ph] = (vues[ph] ?? 0) + 1;
      liste.push({
        phase: ph,
        cle: c.cle,
        noeud: c.noeud,
        rang: vues[ph],
        sur: sur[ph] ?? 1,
        poids: 1,
        ...(c.titre ? { titre: c.titre } : {}),
      });
    }
    for (const a of analyse)
      liste.push({
        phase: "analyse",
        cle: a.cle,
        noeud: a.noeud,
        rang: 1,
        sur: 1,
        poids: a.etapes,
      });
    if (courrier)
      liste.push({
        phase: "courrier",
        cle: "courrier",
        noeud: courrier,
        rang: 1,
        sur: 1,
        poids: 1,
      });
    liste.push({
      phase: "decision",
      cle: "decision",
      noeud: decisions,
      rang: 1,
      sur: 1,
      poids: 1,
    });
    return liste;
  }, [briefing, analyse, courrier, decisions]);

  const [index, setIndex] = useState(0);
  const [decision, setDecision] = useState({ courante: 0, total: 0 });
  const courante = etapes[Math.min(index, etapes.length - 1)]!;
  const derniere = etapes.length - 1;

  const aller = useCallback((i: number) => {
    setIndex(i);
    window.scrollTo({ top: 0 });
  }, []);

  // Un lien « #decisions » ou « #situation » ailleurs dans la page mène à la bonne
  // carte, comme il le faisait vers le bon onglet.
  useEffect(() => {
    const depuisLeHash = () => {
      const cible = window.location.hash.slice(1);
      if (cible === "decisions") aller(derniere);
      else if (cible === "situation") aller(0);
    };
    depuisLeHash();
    window.addEventListener("hashchange", depuisLeHash);
    return () => window.removeEventListener("hashchange", depuisLeHash);
  }, [aller, derniere]);

  const rapporterDecision = useCallback((c: number, t: number) => {
    setDecision((d) => (d.courante === c && d.total === t ? d : { courante: c, total: t }));
  }, []);
  const reculerAvantLesDecisions = useCallback(
    () => aller(Math.max(0, derniere - 1)),
    [aller, derniere],
  );

  // La progression du tour entier, pour la barre du haut. Une carte de briefing ou
  // de courrier compte pour une ; une analyse, pour ses écrans ; les décisions,
  // pour les leurs. Tant que le formulaire n'a pas dit combien il en compte, on
  // n'en suppose qu'une. Il déclare TOUTES ses cartes, récapitulatif compris : la
  // dernière n'est pas une décision de plus, c'est la relecture.
  const cartesDeDecision = decision.total;
  const enRecapitulatif =
    courante.phase === "decision" && cartesDeDecision > 0 && decision.courante >= cartesDeDecision - 1;
  const decisionsTotal = Math.max(0, cartesDeDecision - 1);
  const poids = useMemo(
    () => etapes.map((e) => (e.phase === "decision" ? Math.max(1, cartesDeDecision) : e.poids)),
    [etapes, cartesDeDecision],
  );
  const total = poids.reduce((a, b) => a + b, 0);
  const avant = poids.slice(0, index).reduce((a, b) => a + b, 0);
  const dedans = courante.phase === "decision" ? decision.courante : 0;
  useEffect(() => {
    const libelle = enRecapitulatif ? "Récapitulatif" : PHASES[courante.phase].libelle;
    const rang =
      courante.phase === "briefing" || courante.phase === "resultats"
        ? courante.sur > 1
          ? `${courante.rang} sur ${courante.sur}`
          : ""
        : courante.phase === "decision" && decisionsTotal > 0 && !enRecapitulatif
          ? `${decision.courante + 1} sur ${decisionsTotal}`
          : "";
    // La barre en segments : un par temps du tour, dans l'ordre, rempli jusqu'à où l'on en est.
    const faites = avant + dedans + 1;
    const segments: SegmentDeProgression[] = [];
    let debut = 0;
    etapes.forEach((e, i) => {
      const p = poids[i] ?? 1;
      const fait = Math.min(1, Math.max(0, (faites - debut) / p));
      const dernier = segments[segments.length - 1];
      if (dernier && dernier.phase === e.phase) {
        // Même temps que la carte précédente : un seul segment, d'un poids cumulé.
        const cumul = dernier.poids + p;
        dernier.fait = (dernier.fait * dernier.poids + fait * p) / cumul;
        dernier.poids = cumul;
      } else {
        segments.push({ phase: e.phase, poids: p, fait });
      }
      debut += p;
    });
    definirProgression({
      phase: courante.phase,
      libelle,
      rang,
      segments,
      fraction: Math.min(1, faites / total),
    });
  }, [
    etapes,
    poids,
    courante.phase,
    courante.rang,
    courante.sur,
    decision.courante,
    decisionsTotal,
    enRecapitulatif,
    avant,
    dedans,
    total,
  ]);
  // Quitter la page efface la progression : la barre n'affiche plus rien.
  useEffect(() => () => definirProgression(null), []);

  const prochaine = etapes[index + 1]?.phase;
  const libelleSuivant =
    prochaine === "decision" ? "Décider" : prochaine === "analyse" ? "Analyser" : "Continuer";

  const contexte = useMemo(
    () => ({ rapporterDecision, reculerAvantLesDecisions }),
    [rapporterDecision, reculerAvantLesDecisions],
  );

  return (
    <ParcoursContexte.Provider value={contexte}>
      <div className="space-y-4">
        {/* Pas de glissement sur les décisions : une transformation, même d'un
            instant, ferait du bloc le repère du pied fixe du formulaire. */}
        <div
          key={courante.cle}
          className={courante.phase === "decision" ? "" : "motion-safe:animate-carte-entre"}
        >
          {courante.phase === "resultats" ||
          courante.phase === "briefing" ||
          courante.phase === "courrier" ? (
            <header className="space-y-2 pb-4">
              {/* L'AMORCE DU TEMPS DU TOUR : son nom, sa teinte — la même que son segment de
                  la barre du haut —, et sa place parmi ses cartes. C'est ce qui dit où l'on est. */}
              <p
                className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] ${PHASES[courante.phase].texte}`}
              >
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 rounded-full ${PHASES[courante.phase].fond}`}
                />
                {PHASES[courante.phase].libelle}
                {courante.sur > 1 ? ` · ${courante.rang} sur ${courante.sur}` : ""}
              </p>
              {courante.titre ? (
                <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-slate-50">
                  {courante.titre}
                </h2>
              ) : null}
            </header>
          ) : null}
          {courante.noeud}
        </div>
      </div>

      {courante.phase !== "decision" ? (
        <>
          {/* La place de la barre : sans elle, la fin de la carte passerait dessous. */}
          <div aria-hidden className="h-[calc(5.5rem+env(safe-area-inset-bottom))]" />
          <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-white/12 bg-slate-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 print:hidden">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => aller(index - 1)}
                className={`${bouton({ variante: "secondaire", taille: "l" })} min-h-12 shrink-0`}
              >
                Retour
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => aller(index + 1)}
              className={`${bouton({ taille: "l" })} min-h-12 flex-1`}
            >
              {libelleSuivant}
              <span aria-hidden>→</span>
            </button>
          </div>
        </>
      ) : null}
    </ParcoursContexte.Provider>
  );
}
