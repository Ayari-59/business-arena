import { arretDeModule, champDeModule, type DecisionDeModule } from "@/config/modules-saisis";
import type { ErreurDeChamp } from "@/config/refus-de-decision";
import type { LeviersDuNiveau } from "@/config/difficulty";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { DECISIONS_DE_MODULE, moduleOuvert } from "@/engine/modules/ouverture";
import { moduleArretable } from "@/engine/modules/arret";
import { formatEuro, formatPercent, MOINS } from "@/lib/format";

/**
 * L'OFFRE DES MODULES : CE QUE LE SCÉNARIO PROPOSE CE TOUR, ET CE QUI TOURNE DÉJÀ.
 *
 * Deux catalogues optionnels restent au jeu : les démarches qualité (un
 * investissement ponctuel à effet durable, à côté du budget qualité) et les
 * programmes de R&D de procédé (des tours de travaux, puis un acquis, à côté
 * du budget R&D). Seize autres ont été retirés : ils redisaient un levier
 * natif (prix, marketing, formation, RSE, entretien, emprunt, assurance…), ou
 * n'avaient aucun effet appliqué. Une partie créée avant garde ces catalogues
 * dans son snapshot : l'offre ne les lit plus.
 *
 *  - seuls les catalogues PRÉSENTS dans le snapshot de la partie paraissent ;
 *  - un module suit le niveau de difficulté, par le levier qui lui ressemble
 *    (règle partagée : `engine/modules/ouverture`) ;
 *  - ce qui est déjà acquis ou en cours se lit à part, ne se relance pas, et
 *    s'ARRÊTE quand le module le permet (`engine/modules/arret`) ;
 *  - le plafond est celui que le moteur appliquera, places déjà prises
 *    déduites (un arrêt du tour en libère une).
 *
 * LES EFFETS ANNONCÉS SONT CEUX QUE LE MOTEUR APPLIQUE, et eux seuls. Un
 * élément dont aucun effet n'est appliqué n'est pas proposé.
 */

export interface ElementDeModule {
  /** L'identifiant du catalogue (ou le code de l'action). */
  id: string;
  /** Le nom du champ de la case : `module.<décision>.<id>`. */
  champ: string;
  /** La valeur envoyée : l'identifiant, ou le niveau pour une démarche qualité. */
  valeur: string;
  libelle: string;
  /** Les coûts, dans l'ordre où ils tombent. */
  couts: { libelle: string; montant: number }[];
  /** Ce que coûte le choix CE TOUR, pour le cumul affiché pendant qu'on coche. */
  coutDuTour: number;
  /** La durée, en clair ; `null` quand elle ne dit rien. */
  duree: string | null;
  /** Les effets que le moteur applique, en clair. Jamais vide. */
  effets: string[];
}

/** Ce qui tourne déjà : son nom, son état, et la case pour l'arrêter si le module le permet. */
export interface EnCoursDeModule {
  libelle: string;
  etat: string;
  /** L'identifiant dans le catalogue (absent : ne s'arrête pas). */
  id?: string;
  /** La case d'arrêt ; `occupe` : il prend une place du plafond, que l'arrêt libère. */
  arret?: { champ: string; occupe: boolean };
}

export interface ModuleOffert {
  decision: DecisionDeModule;
  titre: string;
  /** Une phrase qui dit le mécanisme : quand le coût tombe, quand l'effet vient. */
  aide: string;
  /** Le nombre de cases cochables ce tour ; `null` sans plafond. */
  plafond: number | null;
  /** Le plafond en clair, ou `null`. */
  plafondTexte: string | null;
  elements: ElementDeModule[];
  /** Ce qui est déjà actif ou en cours, et ne se relance pas. */
  enCours: EnCoursDeModule[];
}

export type OffreDesModules = ModuleOffert[];

const tours = (n: number) => `${n} tour${n > 1 ? "s" : ""}`;
const plus = (x: number) => `+${formatPercent(x)}`;
const moins = (x: number) => `${MOINS}${formatPercent(x)}`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

export interface EntreeDeLOffre {
  scenario: EngineScenarioConfig;
  /** L'état d'OUVERTURE du tour à jouer (le dernier état persisté). */
  etat: Partial<CompanyState> | null | undefined;
  /** Le tour à jouer (1..N), celui que le moteur recevra. */
  tour: number;
  /** Les leviers du niveau ; absent : tous ouverts. */
  leviers?: LeviersDuNiveau | null;
}

/** Ce qui s'arrête : le champ de la case d'arrêt, et s'il occupe une place. */
const arretable = (decision: DecisionDeModule, id: string, occupe: boolean) => ({
  id,
  arret: { champ: arretDeModule(decision, id), occupe },
});

/**
 * Le libellé d'un niveau de démarche qualité : l'action, le niveau, et ce qui
 * se fait concrètement à ce niveau (« Composants N1 : sélection… » donne
 * « sélection… »).
 */
function libelleDuNiveau(action: string, niveau: number, label: string): string {
  const deuxPoints = label.indexOf(" : ");
  const quoi = deuxPoints >= 0 ? label.slice(deuxPoints + 3) : label;
  return `${action} · niveau ${niveau} : ${quoi}`;
}

/** L'offre des modules du tour ; `null` quand le scénario n'en propose aucun à ce niveau. */
export function construireOffreDesModules(e: EntreeDeLOffre): OffreDesModules | null {
  const { scenario: s, tour } = e;
  const etat = e.etat ?? {};
  const ouvert = (d: DecisionDeModule) => moduleOuvert(d, e.leviers);
  const modules: ModuleOffert[] = [];
  const element = (
    decision: DecisionDeModule,
    x: Omit<ElementDeModule, "champ" | "valeur"> & { valeur?: string },
  ): ElementDeModule => ({ ...x, champ: champDeModule(decision, x.id), valeur: x.valeur ?? x.id });

  // ── Démarches qualité : un niveau à la fois, effet immédiat et définitif ──
  if (s.qualityActions && ouvert("qualityActions")) {
    const acquis = etat.qualityActionsCompleted ?? {};
    const elements: ElementDeModule[] = [];
    const enCours: ModuleOffert["enCours"] = [];
    for (const a of s.qualityActions.actions) {
      const niveau = acquis[a.code] ?? 0;
      if (niveau > 0) enCours.push({ libelle: a.label, etat: `niveau ${niveau} atteint` });
      const suivant = a.levels.find((l) => l.level === niveau + 1);
      if (!suivant) continue;
      const f = suivant.effects;
      // Les rebuts et les retours n'existent que dans un scénario qui les compte.
      const nonQualite = s.qualityCosts !== undefined;
      const effets = [
        f.qualityImageBonus ? `Attractivité ${plus(f.qualityImageBonus)}` : null,
        f.productionCostReduction ? `Coût variable de production ${moins(f.productionCostReduction)}` : null,
        nonQualite && f.defectRateReduction ? `Rebuts ${moins(f.defectRateReduction)}` : null,
        nonQualite && f.returnRateReduction ? `Retours clients ${moins(f.returnRateReduction)}` : null,
        f.maintenanceSaving ? `Entretien allégé de ${formatEuro(f.maintenanceSaving)} par tour` : null,
      ].filter((x): x is string => x !== null);
      if (effets.length === 0) continue;
      elements.push(
        element("qualityActions", {
          id: a.code,
          valeur: String(suivant.level),
          libelle: libelleDuNiveau(a.label, suivant.level, suivant.label),
          couts: [{ libelle: "Coût unique", montant: suivant.cost }],
          coutDuTour: suivant.cost,
          duree: "Acquis pour la partie",
          effets,
        }),
      );
    }
    const max = s.qualityActions.maxConcurrentActions ?? 2;
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "qualityActions",
        titre: "Démarches qualité",
        aide:
          "Un niveau acheté s'applique dès ce tour et reste acquis. Chaque niveau ouvre le suivant.",
        plafond: max,
        plafondTexte: `${max} démarche${max > 1 ? "s" : ""} au plus par tour`,
        elements,
        enCours,
      });
  }

  const rd = offreRd({ s, tour, etat, ouvert, element });
  if (rd) modules.push(rd);

  return modules.length > 0 ? modules : null;
}

interface ContexteDOffre {
  s: EngineScenarioConfig;
  tour: number;
  etat: Partial<CompanyState>;
  ouvert: (d: DecisionDeModule) => boolean;
  element: (
    decision: DecisionDeModule,
    x: Omit<ElementDeModule, "champ" | "valeur"> & { valeur?: string },
  ) => ElementDeModule;
}

/** ── Programmes R&D : des tours de travaux, puis un acquis pour la partie ── */
function offreRd(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.rdActions;
  if (!cfg || !c.ouvert("startedRdActionIds")) return null;
  const enCoursEtat = c.etat.rdActionsInProgress ?? [];
  const acheves = c.etat.completedRdActions ?? [];
  const restent = enCoursEtat.filter((p) => {
    const def = cfg.actions.find((x) => x.id === p.id);
    return def ? p.roundsCompleted + 1 < def.durationRounds : false;
  });
  const enCours = [
    ...enCoursEtat.flatMap((p) => {
      const def = cfg.actions.find((x) => x.id === p.id);
      return def
        ? [
            {
              libelle: def.label,
              etat: `travaux, ${p.roundsCompleted} tour${p.roundsCompleted > 1 ? "s" : ""} sur ${def.durationRounds}`,
              ...arretable("startedRdActionIds", p.id, p.roundsCompleted + 1 < def.durationRounds),
            },
          ]
        : [];
    }),
    ...acheves.flatMap((id) => {
      const def = cfg.actions.find((x) => x.id === id);
      return def ? [{ libelle: def.label, etat: "achevé" }] : [];
    }),
  ];
  const elements = cfg.actions
    .filter((x) => !enCoursEtat.some((p) => p.id === x.id) && !acheves.includes(x.id))
    .flatMap((x) => {
      const f = x.effects;
      const effets = [
        f.costReduction ? `Coût variable unitaire ${moins(f.costReduction)}` : null,
        f.qualityBonus ? `Qualité perçue ${plus(f.qualityBonus)} à terme` : null,
        f.imageBonus ? `Attractivité ${plus(f.imageBonus)}` : null,
      ].filter((v): v is string => v !== null);
      if (effets.length === 0) return [];
      return [
        c.element("startedRdActionIds", {
          id: x.id,
          libelle: x.label,
          couts: [{ libelle: "Par tour de travaux", montant: x.costPerRound }],
          coutDuTour: x.costPerRound,
          duree: `${tours(x.durationRounds)} de travaux`,
          effets: effets.map((v) => `${v} une fois achevé, pour toute la partie`),
        }),
      ];
    });
  const max = Math.max(0, cfg.maxSimultaneousProjects - restent.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "startedRdActionIds",
    titre: "Programmes de R&D",
    aide: "Un programme se paie à chaque tour de travaux, sur la ligne R&D. Ses effets viennent au tour qui suit son achèvement et durent toute la partie. Arrêté en cours, il ne rend pas ce qu'il a coûté.",
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxSimultaneousProjects, "programme")} en même temps au plus`,
    elements,
    enCours,
  };
}

/** Les identifiants choisis pour un module, tels que les décisions les portent. */
export function choixDuModule(decisions: Partial<RoundDecisions>, decision: DecisionDeModule): string[] {
  if (decision === "qualityActions") return (decisions.qualityActions ?? []).map((q) => q.actionCode);
  return decisions[decision] ?? [];
}

/**
 * LES MODULES, JUGÉS PAR LE SERVEUR. La feuille ne propose que l'offre du tour
 * et grise les cases au plafond ; un formulaire périmé ou forgé tombe ici :
 * un choix hors de l'offre (catalogue absent, niveau fermé, déjà en cours), un
 * niveau qualité qui n'est pas le suivant, un arrêt de ce qui ne tourne pas,
 * ou un plafond dépassé (un arrêt du tour libère sa place).
 */
export function refusDesModules(
  decisions: Partial<RoundDecisions>,
  offre: OffreDesModules | null,
): ErreurDeChamp[] {
  const erreurs: ErreurDeChamp[] = [];
  const nonPropose = { champ: null, message: "Ce module n'est pas proposé dans cette partie." };
  // Les arrêts : seulement ce qui tourne, et que le module laisse arrêter.
  const arrets = decisions.stoppedModuleItems ?? [];
  const placesLiberees = new Map<string, number>();
  for (const a of arrets) {
    const vise = offre?.find((m) => m.decision === a.module);
    const enCours = vise?.enCours.find((x) => x.id === a.id && x.arret);
    if (!moduleArretable(a.module) || !vise || !enCours?.arret) {
      erreurs.push({ champ: null, message: "Cet arrêt ne porte sur rien qui tourne ce tour." });
      continue;
    }
    if (enCours.arret.occupe) placesLiberees.set(a.module, (placesLiberees.get(a.module) ?? 0) + 1);
  }
  if (new Set(arrets.map((a) => `${a.module}.${a.id}`)).size !== arrets.length)
    erreurs.push({ champ: null, message: "Un même arrêt ne se coche qu'une fois." });
  for (const decision of DECISIONS_DE_MODULE) {
    const choix = choixDuModule(decisions, decision);
    if (choix.length === 0) continue;
    const offert = offre?.find((m) => m.decision === decision);
    if (!offert) {
      erreurs.push(nonPropose);
      continue;
    }
    for (const id of choix) {
      const el = offert.elements.find((x) => x.id === id);
      const niveauJuste =
        decision !== "qualityActions" ||
        (decisions.qualityActions ?? []).some((q) => q.actionCode === id && String(q.level) === el?.valeur);
      if (!el || !niveauJuste) {
        erreurs.push({
          champ: el?.champ ?? null,
          message: `${offert.titre} : ce choix n'est pas ouvert ce tour.`,
        });
      }
    }
    if (new Set(choix).size !== choix.length) {
      erreurs.push({ champ: null, message: `${offert.titre} : un même choix ne se coche qu'une fois.` });
    }
    const plafond = offert.plafond === null ? null : offert.plafond + (placesLiberees.get(decision) ?? 0);
    if (plafond !== null && choix.length > plafond) {
      const champ = offert.elements.find((x) => x.id === choix[plafond])?.champ ?? null;
      erreurs.push({
        champ,
        message:
          plafond === 0
            ? `${offert.titre} : plus aucune place ce tour.`
            : `${offert.titre} : ${plafond} choix au plus ce tour.`,
      });
    }
  }
  return erreurs;
}

/** Une ligne du bilan des modules d'un tour clos. */
export interface LigneDeModule {
  /** Le module, pour ranger la ligne sous le thème de son étape (`config/etapes-des-modules`). */
  decision: DecisionDeModule;
  titre: string;
  /** Ce qui a été engagé CE tour (libellés du catalogue). */
  engage: string[];
  /** Ce qui a été arrêté CE tour (libellés du catalogue). */
  arrete: string[];
  /** Ce que le module a coûté au tour ; `null` quand il ne coûte rien. */
  cout: number | null;
  /** L'effet principal, en clair ; `null` quand le tour n'en porte pas. */
  effet: string | null;
}

export interface BilanDesModules {
  lignes: LigneDeModule[];
}

/**
 * CE QUE LES MODULES ONT FAIT AU TOUR : ce qui a été engagé ou arrêté, ce que
 * cela a coûté, l'effet principal en vigueur. Lu du résultat du moteur (trace
 * persistée) et des décisions du tour. `null` quand aucun module n'a rien
 * engagé ni coûté : un tour sans module n'a rien à dire. Un tour joué avant le
 * retrait des seize autres modules ne dit que ces deux-là.
 */
export function bilanDesModules(
  result: Pick<CompanyRoundResult, "qualityActions" | "rdActionsCost" | "rdActionsEffects">,
  decisions: Partial<RoundDecisions> | null,
  scenario: EngineScenarioConfig,
): BilanDesModules | null {
  const d = decisions ?? {};
  const s = scenario;
  const lignes: LigneDeModule[] = [];
  const nommer = <T extends { id: string; label: string }>(liste: T[] | undefined, ids: string[] | undefined) =>
    (ids ?? []).map((id) => liste?.find((x) => x.id === id)?.label ?? id);
  const arretes = (module: DecisionDeModule) =>
    nommer(
      module === "startedRdActionIds" ? s.rdActions?.actions : undefined,
      (d.stoppedModuleItems ?? []).filter((a) => a.module === module).map((a) => a.id),
    );
  const pousser = (module: DecisionDeModule, l: Omit<LigneDeModule, "arrete" | "decision">) => {
    const ligne = { ...l, decision: module, arrete: arretes(module) };
    if (ligne.engage.length > 0 || ligne.arrete.length > 0 || (ligne.cout ?? 0) > 0 || ligne.effet) lignes.push(ligne);
  };
  const positif = (x: number | undefined) => (x !== undefined && x > 0 ? x : 0);

  const qa = result.qualityActions;
  pousser("qualityActions", {
    titre: "Démarches qualité",
    engage: (qa?.started ?? []).map((q) => {
      const a = s.qualityActions?.actions.find((x) => x.code === q.actionCode);
      return `${a?.label ?? q.actionCode} · niveau ${q.level}`;
    }),
    cout: qa && qa.started.length > 0 ? qa.started.reduce((t, q) => t + q.cost, 0) : null,
    effet:
      qa && qa.activeEffects.qualityImageBonus > 0
        ? `Attractivité ${plus(qa.activeEffects.qualityImageBonus)}`
        : qa && qa.activeEffects.productionCostReduction > 0
          ? `Coût variable de production ${moins(qa.activeEffects.productionCostReduction)}`
          : null,
  });
  const rd = result.rdActionsEffects;
  pousser("startedRdActionIds", {
    titre: "Programmes de R&D",
    engage: nommer(s.rdActions?.actions, d.startedRdActionIds),
    cout: result.rdActionsCost ?? null,
    effet:
      positif(rd?.costReduction) > 0
        ? `Coût variable unitaire ${moins(rd!.costReduction)}`
        : positif(rd?.imageBonus) > 0
          ? `Attractivité ${plus(rd!.imageBonus)}`
          : positif(rd?.qualityBonus) > 0
            ? `Qualité perçue visée ${plus(rd!.qualityBonus)}`
            : null,
  });
  return lignes.length > 0 ? { lignes } : null;
}
