"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { allerAuDebutDEtape } from "@/lib/debut-d-etape";
import { bouton } from "@/components/bouton";
import { useGlisser, vibrer } from "@/lib/glisser";
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

/** Ce qu'un écran du parcours dit de lui-même à la barre du haut. */
export interface EnteteDeCarte {
  titre: string;
  /** Remplace « Temps · rang » quand l'écran sait mieux compter (les analyses rendues). */
  amorce?: string;
}

interface ContexteDuParcours {
  /** Une carte que le parcours ne connaît pas (les analyses, les décisions) donne son titre à la barre. */
  definirEntete: (entete: EnteteDeCarte | null) => void;
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

  // Le parcours lui-même : c'est à son début qu'on revient d'une carte à l'autre.
  const cadre = useRef<HTMLDivElement>(null);
  const aller = useCallback((i: number) => {
    setIndex(i);
    // Au début de la carte, sous la barre et l'ardoise repliée ; le haut de la
    // page rendait l'écran à l'ardoise, et le champ passait sous le pouce.
    allerAuDebutDEtape(cadre.current);
  }, []);
  // UN SEUL BOUTON ORANGE PAR ÉCRAN. Quand la carte porte sa propre action
  // (« Valider mon analyse »), le bouton du bas passe en filet : deux aplats
  // orange côte à côte, c'est une hésitation affichée.
  const [actionPropre, setActionPropre] = useState(false);
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const relire = () => setActionPropre(el.querySelector("[data-action-de-l-etape]") !== null);
    relire();
    const veille = new MutationObserver(relire);
    veille.observe(el, { childList: true, subtree: true });
    return () => veille.disconnect();
  }, [index]);
  // Un geste de l'utilisateur (bouton ou glissement) se sent dans la main ; un lien « #decisions »
  // ne le doit pas, et le navigateur refuserait de vibrer sans toucher.
  const allerAuToucher = useCallback(
    (i: number) => {
      aller(i);
      vibrer(8);
    },
    [aller],
  );
  const glisser = useGlisser({
    // Pas sur les décisions : leur formulaire a ses propres cartes, donc son propre geste.
    actif: courante.phase !== "decision",
    suivant: index < derniere ? () => allerAuToucher(index + 1) : undefined,
    precedent: index > 0 ? () => allerAuToucher(index - 1) : undefined,
  });

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

  const [enteteEnfant, setEnteteEnfant] = useState<EnteteDeCarte | null>(null);
  const definirEntete = useCallback((e: EnteteDeCarte | null) => {
    setEnteteEnfant((cur) =>
      cur === e || (cur && e && cur.titre === e.titre && cur.amorce === e.amorce) ? cur : e,
    );
  }, []);

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
    const libelle = enRecapitulatif ? "Dernière étape" : PHASES[courante.phase].libelle;
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
    // Le titre vient de la carte quand le parcours la connaît (briefing, résultats, courrier),
    // sinon de l'écran lui-même (analyses, décisions) qui le déclare.
    const propre = courante.phase === "analyse" || courante.phase === "decision";
    const titre = propre
      ? (enteteEnfant?.titre ?? "")
      : courante.phase === "courrier"
        ? "Le courrier du tour"
        : (courante.titre ?? "");
    definirProgression({
      phase: courante.phase,
      libelle,
      rang,
      amorce: enteteEnfant?.amorce ?? `${libelle}${rang ? ` · ${rang}` : ""}`,
      titre,
      segments,
      fraction: Math.min(1, faites / total),
    });
  }, [
    etapes,
    poids,
    courante.phase,
    courante.titre,
    courante.rang,
    courante.sur,
    enteteEnfant,
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
    () => ({ rapporterDecision, reculerAvantLesDecisions, definirEntete }),
    [rapporterDecision, reculerAvantLesDecisions, definirEntete],
  );

  return (
    <ParcoursContexte.Provider value={contexte}>
      {/* -mt-3 : la carte se rapproche de la barre, qui porte maintenant le titre de l'étape. */}
      <div
        ref={cadre}
        data-debut-d-etape=""
        // Assez haut pour que le début de la carte remonte sous ce qui colle en
        // haut, l'ardoise passant au-dessus et se repliant.
        className="-mt-3 min-h-[calc(100dvh-var(--haut-collant,8rem))] space-y-4"
        {...glisser}
      >
        {/* Pas de glissement sur les décisions : une transformation, même d'un
            instant, ferait du bloc le repère du pied fixe du formulaire. */}
        <div
          key={courante.cle}
          className={courante.phase === "decision" ? "" : "motion-safe:animate-carte-entre"}
        >
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
                onClick={() => allerAuToucher(index - 1)}
                className={`${bouton({ variante: "secondaire", taille: "l" })} min-h-12 shrink-0 active:scale-[0.98]`}
              >
                Retour
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => allerAuToucher(index + 1)}
              className={`${
                actionPropre
                  ? bouton({ variante: "secondaire", taille: "l" })
                  : bouton({ taille: "l" })
              } min-h-12 flex-1 active:scale-[0.98]`}
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
