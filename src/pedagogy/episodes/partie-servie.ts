/**
 * L'ÉPISODE JOUÉ AU SERVEUR : CE QUE LE NAVIGATEUR VOIT, AU MOMENT OÙ IL LE VOIT
 * (audit du 10 novembre 2026, P1-1 ; décision du propriétaire : « les épisodes payants servis
 * par le serveur après le contrôle de licence, comme les chapitres »).
 *
 * Un épisode est écrit en fonctions (config/episodes/types.ts) : ses messages, ses vérifications,
 * son tableau de bord, sa courbe et son bilan se calculent à partir de la partie. Le composant
 * client les appelait lui-même ; il importait le registre entier, et les 113 épisodes, payants
 * compris, partaient dans le JavaScript public, verdicts et bilans compris. La licence ne
 * protégeait que l'affichage, et un participant pouvait lire le verdict d'un choix avant de le faire.
 *
 * Le jeu se calcule désormais ici. À chaque geste, la route /api/episodes/partie refait le contrôle
 * d'accès puis rejoue la partie à partir de ses seuls faits (le niveau, le tirage, les décisions et
 * les vérifications déjà faites) : tout est pur et déterministe, rien n'est gardé entre deux gestes.
 * Elle renvoie une VUE : des textes déjà rendus, des nombres déjà mis en forme, les options de
 * l'étape suivante sans leur résultat. La conséquence d'une décision ne part qu'après elle, le bilan
 * qu'à la fin. Le navigateur n'affiche que ce qu'il reçoit et n'envoie que des gestes.
 *
 * Chaque calcul reprend, à l'identique, celui que faisait l'écran (components/episode) : le test d'or
 * (tests/episodes/partie-servie.test.ts) rend chaque épisode du registre, sous plusieurs suites de
 * décisions, et compare la page à celle que rendait l'ancien calcul.
 *
 * Ce module est serveur : aucun composant « use client » ne doit l'importer, sauf ses types
 * (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */
import { z } from "zod";
import type {
  Contexte,
  Episode,
  Lecture,
  Message,
  PartieJouee,
  Resultat,
  Semaine,
  Tuile,
} from "@/config/episodes/types";
import {
  NIVEAUX,
  REPERES,
  budgetDEnquete,
  niveauParCode,
  sourcesProposees,
  verificationPossible,
  type CodeNiveau,
  type TempsDeDecision,
} from "@/config/episodes/niveaux";
import { GRAINES_DU_BILAN, moyenne } from "@/engine/episodes/commun";
import { CAS, analyser, type Cas } from "@/pedagogy/episodes/bilan";
import { effetDuChoix } from "@/pedagogy/episodes/retour-immediat";
import { observer } from "@/pedagogy/profil/observations";
import { competencesObservees, phrasesDeRobustesse } from "@/pedagogy/profil/retour";
import { apercuDuProfil, MENTION_DE_L_APERCU } from "@/pedagogy/profil/apercu";
import { SEUILS_DE_CONFIANCE } from "@/pedagogy/profil/profil";

/* ---------------------------------------------------------------------------
 * LES VUES : ce qui part au navigateur. Des données, jamais une fonction.
 * ------------------------------------------------------------------------- */

/** Ce qu'un niveau change à l'écran ; ses règles sont génériques, sans rien d'un épisode. */
export interface NiveauAffiche {
  code: CodeNiveau;
  nom: string;
  resume: string;
  verificationsParDecision: number | null;
  retourImmediat: boolean;
  imprevusSignales: boolean;
  reperes: boolean;
}

export interface ReglagesDesNiveaux {
  niveaux: readonly NiveauAffiche[];
  /** Les repères de méthode du niveau Découverte : génériques, ils ne trahissent aucune réponse. */
  reperes: Readonly<Record<TempsDeDecision, string>>;
}

/**
 * DE QUOI ÉCRIRE UN CHIFFRE QUI MONTE, SANS LA FONCTION. Le verdict d'une conséquence monte jusqu'à
 * sa valeur (components/chiffre-qui-arrive.tsx), chaque image écrite comme la valeur finale. La mise
 * en forme est propre à l'épisode, et une fonction ne traverse pas le réseau : le serveur écrit une
 * échelle de valeurs, la valeur finale comprise, et le navigateur prend pour chaque image l'écriture
 * la plus proche. La valeur finale s'écrit donc à l'identique.
 */
export interface PlumeServie {
  points: readonly (readonly [number, string])[];
}

export interface IndicateurServi {
  cle: string;
  nom: string;
  /** La valeur déjà écrite, « — » sans valeur. */
  valeur: string;
  /** L'écart à la lecture d'avant la dernière décision ; présent seulement juste après elle. */
  ecart: { signe: "+" | "−"; montant: string; bon: boolean } | null;
  aide: string;
  jauge: { part: number; enRetard: boolean } | null;
}

export interface TableauServi {
  nom: string;
  semaine: number;
  indicateurs: readonly IndicateurServi[];
}

export interface CourbeServie {
  titre: string;
  libelleCible: string;
  cible: number;
  /** Les graduations de l'axe et leur écriture ; l'écran garde celles qui tombent dans le graphique. */
  graduations: readonly { valeur: number; texte: string }[];
  /** Indexées de 1 à `jouees`, les seules semaines jouées : la hauteur de la colonne et l'infobulle. */
  semaines: readonly ({ valeur: number; details: readonly string[] } | null)[];
  jouees: number;
  surbrillance?: readonly [number, number];
  reperes: readonly { semaine: number; nom: string }[];
  /** Les imprévus des semaines jouées seulement. */
  imprevus: readonly { semaine: number; titre: string }[];
}

export interface SourceServie {
  id: string;
  titre: string;
  cout: number;
  /** Ce que la vérification apprend : seulement une fois faite. */
  resultat: string | null;
}

export interface EtapeServie {
  indice: number;
  moment: string;
  titre: string;
  jusqua: number;
  messages: readonly Message[];
  /** Le temps d'enquête de la première décision, à ce niveau ; `null` ailleurs. */
  budget: number | null;
  consigne: string;
  echeance: string;
  joursSansPerte: number;
  /** Ce que l'attente a coûté, aux deux étapes qui ont une enquête. */
  perte: Message | null;
  sources: readonly SourceServie[];
  /** Le diagnostic et sa réévaluation, aux deux premières décisions. */
  diagnostics: readonly { id: string; t: string }[];
  question: string;
  /** Les options, sans leur résultat. */
  options: readonly { t: string; d: string }[];
  prevision: { libelle: string; unite: string; placeholder: string; min: number; max: number; step: number } | null;
}

export interface VerdictServi {
  libelle: string;
  valeur: string;
  nombre: number | null;
  plume: PlumeServie | null;
  ecart: {
    valeur: string;
    mention: string;
    sens: "gain" | "perte" | null;
    nombre: number;
    plume: PlumeServie;
  } | null;
}

export interface ConsequenceServie {
  indice: number;
  moment: string;
  titre: string;
  de: number;
  jusqua: number;
  /** Le libellé de l'option choisie. */
  option: string;
  surtitre: string;
  verdict: VerdictServi;
  /** Le retour immédiat du niveau Découverte ; `null` quand le choix ne change rien, absent hors Découverte. */
  effet?: { rapporte: boolean; montant: string; reference: string } | null;
  recap: readonly (readonly [string, string])[];
  courbe: CourbeServie;
  reactions: readonly Message[];
  /** Les imprévus à part, quand le niveau les signale. */
  imprevus: readonly Message[];
  derniere: boolean;
}

export interface ComparaisonServie {
  memeHasard: boolean;
  tirages: number;
  niveaux: { avant: string; apres: string } | null;
  lignes: readonly { avant: string; apres: string; change: boolean }[];
  resultat: { avant: string; graine: number; apres: string; ecart: string };
  attendu: { avant: string; apres: string; ecart: string };
}

export interface RetourServi {
  robustesse: readonly string[];
  observees: readonly { code: string; nom: string; phrase: string }[];
  apercu: {
    competences: readonly { code: string; nom: string; score: number | null; preuve: string }[];
    robustesse: string;
    risque: string;
  } | null;
  seuilIndicatif: number;
  mention: string;
}

export interface BilanServi {
  niveau: string;
  graine: number;
  titre: string;
  attendu: string;
  chance: { apporte: boolean; montant: string };
  tirages: number;
  nombreDeDecisions: number;
  tuiles: readonly Tuile[];
  comparaison: ComparaisonServie | null;
  courbe: CourbeServie;
  hasard: readonly { titre: string; texte: string }[];
  barres: readonly { nom: string; valeur: number; texte: string; vous?: true }[];
  noteDesBarres: string;
  cas: Readonly<Record<Cas, { nom: string; aide: string }>>;
  decisions: readonly {
    d: number;
    cas: Cas;
    moment: string;
    choix: string;
    rang: number;
    n: number;
    meilleure: string;
    ecart: string;
    pireCas: string;
  }[];
  enchainement: {
    methode: string;
    ecart: string;
    explique: string;
    reprises: readonly { d: number; gain: string }[];
  } | null;
  constats: readonly { score: number; texte: string }[];
  axe: { titre: string; texte: string };
  retour: RetourServi;
}

/** Ce qu'une page d'épisode ouvert envoie avant le premier geste : l'introduction. */
export interface IntroServie {
  code: string;
  numero: number;
  domaine: string;
  titre: string;
  persona: string;
  mandat: readonly { fort: string; texte: string }[];
  jugement: string;
  duree: string;
  nombreDeDecisions: number;
  nomDuTableau: string;
  /** Le tableau de bord avant la partie, sous le tirage par défaut. */
  tableau: TableauServi;
  tirages: number;
}

export interface VueDeLaPartie {
  graine: number;
  niveau: CodeNiveau;
  decisions: readonly number[];
  consultes: readonly (readonly string[])[];
  /** Les jours d'enquête pris en semaine 1. */
  jours: number;
  tableau: TableauServi;
  consequence: ConsequenceServie | null;
  etape: EtapeServie | null;
  bilan: BilanServi | null;
}

/* ---------------------------------------------------------------------------
 * CE QUE LE NAVIGATEUR ENVOIE : des faits, bornés puis confrontés à l'épisode.
 * ------------------------------------------------------------------------- */

const id = z.string().min(1).max(60);
const niveau = z.enum(["decouverte", "standard", "expert"]);

export const demandeDePartie = z.object({
  code: z.string().min(1).max(80),
  /** commencer, vérifier : l'étape en cours ; valider : la conséquence, et le bilan à la fin. */
  geste: z.enum(["commencer", "verifier", "valider"]),
  niveau,
  graine: z.number().int().min(1).max(2_147_483_647),
  decisions: z.array(z.number().int().min(0).max(20)).max(12),
  consultes: z.array(z.array(id).max(20)).max(12),
  fin: z
    .object({
      diagnostic: id,
      reevaluation: z.object({ choix: z.enum(["maintient", "corrige"]), principal: id.nullable() }),
      prevision: z.number().min(-1e9).max(1e9),
      confiance: z.number().int().min(0).max(100),
    })
    .nullable()
    .optional(),
  precedente: z
    .object({
      graine: z.number().int().min(1).max(2_147_483_647),
      chemin: z.array(z.number().int().min(0).max(20)).max(12),
      jours: z.number().min(0).max(30),
      niveau: niveau.optional(),
    })
    .nullable()
    .optional(),
});

export type DemandeDePartie = z.infer<typeof demandeDePartie>;

/** Une demande qui ne tient pas dans l'épisode : la raison, pour la réponse 400. */
export class PartieIncoherente extends Error {}

const etapeCourante = (d: DemandeDePartie) => d.decisions.length;

/** Les jours d'enquête de la semaine 1 : la somme du temps des vérifications de la première décision. */
function joursDEnquete(ep: Episode, consultes: readonly (readonly string[])[]): number {
  return (consultes[0] ?? []).reduce(
    (j, s) => j + (ep.etapes[0]!.sources.find((x) => x.id === s)?.cout ?? 0),
    0,
  );
}

/**
 * La demande, confrontée à l'épisode : un choix qui n'existe pas, une vérification qui n'est pas
 * proposée à ce niveau, une de trop, du temps d'enquête dépassé, une vérification d'une étape qui
 * n'est pas encore jouée, et la partie est refusée. L'écran ne permet rien de tout cela.
 */
export function verifierLaDemande(ep: Episode, d: DemandeDePartie): void {
  const n = ep.etapes.length;
  const k = etapeCourante(d);
  const niv = niveauParCode(d.niveau);
  if (k > n) throw new PartieIncoherente("Trop de décisions.");
  d.decisions.forEach((o, i) => {
    if (o >= ep.etapes[i]!.options.length) throw new PartieIncoherente("Un choix n'existe pas.");
  });
  if (d.consultes.length > n) throw new PartieIncoherente("Des vérifications en trop.");
  d.consultes.forEach((ids, i) => {
    if (ids.length === 0) return;
    if (i > k) throw new PartieIncoherente("Une vérification d'une étape à venir.");
    const etape = ep.etapes[i]!;
    const proposees = sourcesProposees(niv, etape);
    const budget = i === 0 ? budgetDEnquete(niv, ep, etape) : undefined;
    let jours = 0;
    ids.forEach((s, rang) => {
      const source = proposees.find((x) => x.id === s);
      if (!source) throw new PartieIncoherente("Une vérification n'existe pas.");
      if (ids.indexOf(s) !== rang) throw new PartieIncoherente("Une vérification deux fois.");
      if (!verificationPossible(niv, i, rang)) throw new PartieIncoherente("Une vérification de trop.");
      jours += source.cout;
      if (budget != null && jours > budget + 1e-9) throw new PartieIncoherente("Plus le temps.");
    });
  });
  if (d.fin) {
    const ids = ep.diagnostics.map((x) => x.id);
    if (!ids.includes(d.fin.diagnostic)) throw new PartieIncoherente("Diagnostic inconnu.");
    const p = d.fin.reevaluation.principal;
    if (p != null && !ids.includes(p)) throw new PartieIncoherente("Réévaluation inconnue.");
  }
  if (d.precedente) {
    const c = d.precedente.chemin;
    if (c.length !== n || c.some((o, i) => o >= ep.etapes[i]!.options.length)) {
      throw new PartieIncoherente("La partie précédente ne tient pas dans l'épisode.");
    }
  }
}

/* ---------------------------------------------------------------------------
 * LES CALCULS : ceux que l'écran faisait, à l'identique.
 * ------------------------------------------------------------------------- */

/** « Remise de 5 % » devient « remise de 5 % » ; « Karim », plus loin dans la phrase, reste Karim. */
const enMinuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Les réglages génériques des niveaux, pour l'écran. */
export function reglagesDesNiveaux(): ReglagesDesNiveaux {
  return {
    niveaux: NIVEAUX.map((n) => ({
      code: n.code,
      nom: n.nom,
      resume: n.resume,
      verificationsParDecision: n.verificationsParDecision,
      retourImmediat: n.retourImmediat,
      imprevusSignales: n.imprevusSignales,
      reperes: n.reperes,
    })),
    reperes: REPERES,
  };
}

const jaugeServie = (j: { part: number; enRetard: boolean } | null | undefined) =>
  j ? { part: j.part, enRetard: j.enRetard } : null;

/** Le tableau de bord à la fin d'une semaine, et l'écart à la lecture d'avant s'il y en a une. */
function tableauServi(ep: Episode, semaine: number, lecture: Lecture, avant: Lecture | null): TableauServi {
  return {
    nom: ep.nomDuTableau,
    semaine,
    indicateurs: ep.indicateurs.map((ind) => {
      const v = lecture[ind.cle];
      const a = avant?.[ind.cle];
      let ecart: IndicateurServi["ecart"] = null;
      if (a != null && v != null) {
        const d = v - a;
        if (Math.abs(d) >= 1e-9) {
          ecart = {
            signe: d > 0 ? "+" : "−",
            montant: (ind.formatEcart ?? ind.format)(Math.abs(d)),
            bon: ind.sensBon * d > 0,
          };
        }
      }
      return {
        cle: ind.cle,
        nom: ind.nom,
        valeur: v == null ? "—" : ind.format(v),
        ecart,
        aide: ind.aide(semaine, lecture),
        jauge: jaugeServie(ind.jauge?.(lecture)),
      };
    }),
  };
}

/** Les repères des n premières décisions : chacune se prend à la fin de la fenêtre précédente. */
function reperesDesDecisions(ep: Pick<Episode, "etapes">, n: number) {
  return ep.etapes.slice(0, n).map((_, i) => ({
    semaine: i === 0 ? 1 : ep.etapes[i - 1]!.jusqua,
    nom: `D${i + 1}`,
  }));
}

function courbeServie(
  ep: Episode,
  semaines: Resultat["semaines"],
  jouees: number,
  options: {
    titre?: string;
    surbrillance?: readonly [number, number];
    reperes: readonly { semaine: number; nom: string }[];
    imprevus: readonly { semaine: number; titre: string }[];
  },
): CourbeServie {
  const { courbe } = ep;
  return {
    titre: options.titre ?? courbe.titre,
    libelleCible: courbe.libelleCible,
    cible: courbe.cible,
    graduations: courbe.graduations.map((g) => ({ valeur: g, texte: courbe.format(g) })),
    semaines: Array.from({ length: jouees + 1 }, (_, w) => {
      const s: Semaine | null | undefined = w === 0 ? null : semaines[w];
      return s ? { valeur: s[courbe.cle] ?? 0, details: courbe.details(s) } : null;
    }),
    jouees,
    ...(options.surbrillance ? { surbrillance: options.surbrillance } : {}),
    reperes: options.reperes,
    imprevus: options.imprevus.filter((i) => i.semaine <= jouees),
  };
}

/** Une échelle de valeurs et leur écriture, de quoi faire monter un chiffre jusqu'à `valeur`. */
const IMAGES_DU_COMPTEUR = 80;
function plume(ecrire: (v: number) => string, valeur: number, bornes: readonly number[]): PlumeServie {
  const bas = Math.min(valeur, ...bornes);
  const haut = Math.max(valeur, ...bornes);
  const points = new Map<number, string>();
  for (let k = 0; k <= IMAGES_DU_COMPTEUR; k += 1) {
    const v = bas + ((haut - bas) * k) / IMAGES_DU_COMPTEUR;
    points.set(v, ecrire(v));
  }
  points.set(valeur, ecrire(valeur));
  return { points: [...points].sort((a, b) => a[0] - b[0]) };
}

/**
 * LE CHIFFRE CLÉ DES SEMAINES JOUÉES, ET SON ÉCART À LA CIBLE (components/episode/episode-joue.tsx,
 * `verdictDesSemaines`, avant le passage au serveur). La grandeur est celle de la courbe, moyennée
 * sur les semaines que la décision a couvertes ; la cible est la cadence que la courbe trace déjà.
 */
function verdictDesSemaines(
  ep: Episode,
  semaines: Resultat["semaines"],
  de: number,
  a: number,
): VerdictServi {
  const { courbe } = ep;
  const valeurs = semaines
    .slice(de, a + 1)
    .map((w) => w?.[courbe.cle])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const nom = courbe.titre.replace(/,?\s*semaine par semaine\s*$/i, "");
  const periode = de === a ? `semaine ${de}` : `moyenne des semaines ${de} à ${a}`;
  if (valeurs.length === 0) {
    return { libelle: `${nom} · ${periode}`, valeur: "—", nombre: null, plume: null, ecart: null };
  }
  const moyenneDesSemaines = valeurs.reduce((x, v) => x + v, 0) / valeurs.length;
  const indicateur = ep.indicateurs.find((ind) => ind.cle === courbe.cle);
  const d = moyenneDesSemaines - courbe.cible;
  const formatEcart = indicateur?.formatEcart ?? courbe.format;
  const ecrireEcart = (n: number) =>
    `${n > 1e-9 ? "+" : n < -1e-9 ? "−" : ""}${formatEcart(Math.abs(n))}`;
  // L'échelle du compteur couvre les semaines jouées jusqu'ici : le chiffre monte depuis zéro, ou
  // depuis le verdict de la décision précédente, qui en est une moyenne.
  const jouees = semaines
    .slice(1, a + 1)
    .map((w) => w?.[courbe.cle])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const bornes = [0, courbe.cible * 1.25, ...jouees];
  const ecart =
    Math.abs(d) < 1e-9 || formatEcart(Math.abs(d)) === formatEcart(0)
      ? null
      : {
          valeur: ecrireEcart(d),
          mention: `face à la cible (${courbe.libelleCible})`,
          sens: indicateur ? (indicateur.sensBon * d > 0 ? ("gain" as const) : ("perte" as const)) : null,
          nombre: d,
          plume: plume(ecrireEcart, d, bornes.map((b) => b - courbe.cible).concat(0)),
        };
  return {
    libelle: `${nom} · ${periode}`,
    valeur: courbe.format(moyenneDesSemaines),
    nombre: moyenneDesSemaines,
    plume: plume(courbe.format, moyenneDesSemaines, bornes),
    ecart,
  };
}

/** L'étape en cours, telle que l'écran la montre : sans le résultat de ses options. */
function etapeServie(
  ep: Episode,
  i: number,
  contexte: Contexte,
  d: DemandeDePartie,
  jours: number,
): EtapeServie {
  const etape = ep.etapes[i]!;
  const niv = niveauParCode(d.niveau);
  const vues = d.consultes[i] ?? [];
  const budget = budgetDEnquete(niv, ep, etape);
  return {
    indice: i,
    moment: etape.moment,
    titre: etape.titre,
    jusqua: etape.jusqua,
    messages: etape.messages(contexte),
    budget: i === 0 && budget != null ? budget : null,
    consigne: i === 0 ? ep.enquete.consigne : "",
    echeance: i === 0 ? (ep.enquete.echeance ?? "le point de vendredi") : "",
    joursSansPerte: i === 0 ? ep.enquete.joursSansPerte : 0,
    perte: i <= 1 ? ep.enquete.perte(jours) : null,
    sources: sourcesProposees(niv, etape).map((s) => ({
      id: s.id,
      titre: s.titre,
      cout: s.cout,
      resultat: vues.includes(s.id)
        ? typeof s.resultat === "function"
          ? s.resultat(contexte)
          : s.resultat
        : null,
    })),
    diagnostics: i <= 1 ? ep.diagnostics.map((x) => ({ id: x.id, t: x.t })) : [],
    question: etape.question,
    options: etape.options.map((o) => ({ t: o.t, d: o.d })),
    prevision: etape.prevision
      ? {
          libelle: ep.prevision.libelle,
          unite: ep.prevision.unite,
          placeholder: ep.prevision.placeholder,
          min: ep.prevision.min,
          max: ep.prevision.max,
          step: ep.prevision.step,
        }
      : null,
  };
}

/** La conséquence de la décision `i`, juste prise. */
function consequenceServie(ep: Episode, d: DemandeDePartie, i: number, jours: number): ConsequenceServie {
  const etape = ep.etapes[i]!;
  const niv = niveauParCode(d.niveau);
  const graine = d.graine;
  const de = i === 0 ? 1 : ep.etapes[i - 1]!.jusqua + 1;
  const chemin = ep.neutre.map((n, k) => d.decisions[k] ?? n);
  const t = ep.simuler(chemin, graine, jours);
  const choix = d.decisions[i]!;
  const arrive = ep.evenements(chemin, graine, de, etape.jusqua);
  const reactions: Message[] = [
    ...(ep.reactions(i, choix, graine) ?? etape.reactions[choix] ?? []),
    ...arrive.lies,
    ...(niv.imprevusSignales ? [] : arrive.imprevus),
  ];
  const kE = ep.bilan.formatObjectif;
  const effet = niv.retourImmediat ? effetDuChoix(ep, d.decisions, i, graine, jours) : undefined;
  return {
    indice: i,
    moment: etape.moment,
    titre: etape.titre,
    de,
    jusqua: etape.jusqua,
    option: etape.options[choix]!.t,
    surtitre: `${ep.nomDuTableau} · conséquence`,
    verdict: verdictDesSemaines(ep, t.semaines, de, etape.jusqua),
    ...(effet === undefined
      ? {}
      : {
          effet: effet
            ? {
                rapporte: effet.ecart >= 0,
                montant: kE(Math.abs(effet.ecart)),
                reference: enMinuscule(etape.options[effet.reference]!.t),
              }
            : null,
        }),
    recap: ep.recap(t, de, etape.jusqua),
    courbe: courbeServie(ep, t.semaines, etape.jusqua, {
      surbrillance: [de, etape.jusqua],
      reperes: reperesDesDecisions(ep, i + 1),
      imprevus: niv.imprevusSignales ? ep.imprevus(graine) : [],
    }),
    reactions,
    imprevus: niv.imprevusSignales ? arrive.imprevus : [],
    derniere: i === ep.etapes.length - 1,
  };
}

/** Le bilan d'une partie terminée (components/episode/bilan-de-l-episode.tsx, avant le serveur). */
export function bilanServi(
  ep: Episode,
  partie: PartieJouee,
  precedente: Pick<PartieJouee, "graine" | "chemin" | "jours" | "niveau"> | null,
  sansLicence: boolean,
): BilanServi {
  const a = analyser(ep, partie);
  const t = a.trimestre;
  const constats = ep.comportements(partie, t);
  const axe = ep.axe(constats);
  const kE = ep.bilan.formatObjectif;
  const chance = t.objectif - a.attendu;
  const signe = (v: number) => `${v >= 0 ? "+" : "−"}${kE(Math.abs(v))}`;

  let comparaison: ComparaisonServie | null = null;
  if (precedente) {
    const lire = (p: Pick<PartieJouee, "graine" | "chemin" | "jours">) => ({
      resultat: ep.simuler(p.chemin, p.graine, p.jours).objectif,
      attendu: moyenne(GRAINES_DU_BILAN.map((g) => ep.simuler(p.chemin, g, p.jours).objectif)),
    });
    const x = lire(precedente);
    const y = lire(partie);
    comparaison = {
      memeHasard: precedente.graine === partie.graine,
      tirages: GRAINES_DU_BILAN.length,
      niveaux:
        (precedente.niveau ?? "standard") !== (partie.niveau ?? "standard")
          ? { avant: niveauParCode(precedente.niveau).nom, apres: niveauParCode(partie.niveau).nom }
          : null,
      lignes: ep.etapes.map((e, k) => ({
        avant: e.options[precedente.chemin[k]!]!.t,
        apres: e.options[partie.chemin[k]!]!.t,
        change: precedente.chemin[k] !== partie.chemin[k],
      })),
      resultat: { avant: kE(x.resultat), graine: precedente.graine, apres: kE(y.resultat), ecart: signe(y.resultat - x.resultat) },
      attendu: { avant: kE(x.attendu), apres: kE(y.attendu), ecart: signe(y.attendu - x.attendu) },
    };
  }

  const { mesures, observations } = observer(ep, partie);
  const apercu = sansLicence && partie.niveau === "decouverte" ? apercuDuProfil(ep, partie) : null;

  return {
    niveau: niveauParCode(partie.niveau).nom,
    graine: partie.graine,
    titre: ep.bilan.titre(t),
    attendu: kE(a.attendu),
    chance: { apporte: chance >= 0, montant: kE(Math.abs(chance)) },
    tirages: GRAINES_DU_BILAN.length,
    nombreDeDecisions: ep.etapes.length,
    tuiles: ep.bilan.tuiles(t).map((u) => ({ nom: u.nom, valeur: u.valeur, aide: u.aide, tenu: u.tenu })),
    comparaison,
    courbe: courbeServie(ep, t.semaines, 13, {
      titre: "Votre trimestre, semaine par semaine",
      reperes: reperesDesDecisions(ep, ep.etapes.length),
      imprevus: ep.imprevus(partie.graine),
    }),
    hasard: ep.bilan.hasard(t, partie.graine).map((h) => ({ titre: h.titre, texte: h.texte })),
    barres: [
      { nom: "Vous", valeur: t.objectif, texte: kE(t.objectif), vous: true as const },
      ...a.references.map((r) => ({ nom: r.nom, valeur: r.valeur, texte: kE(r.valeur) })),
    ],
    noteDesBarres: ep.bilan.noteDesBarres,
    cas: CAS,
    decisions: a.decisions.map((x) => ({
      d: x.d,
      cas: x.cas,
      moment: x.e.moment,
      choix: x.e.options[x.pris.option]!.t,
      rang: x.rang,
      n: x.n,
      meilleure: x.rang === 1 ? "votre choix" : x.e.options[x.meilleur.option]!.t,
      ecart: x.rang === 1 ? "—" : `−${kE(x.meilleur.attendu - x.pris.attendu)}`,
      pireCas: x.plusSur.p10 - x.pris.p10 < 500 ? "le plus sûr" : `−${kE(x.plusSur.p10 - x.pris.p10)}`,
    })),
    enchainement: a.enchainement
      ? {
          methode: a.enchainement.methode,
          ecart: kE(a.enchainement.ecart),
          explique:
            a.enchainement.explique < a.enchainement.ecart
              ? `, et le détail décision par décision n'en explique que ${kE(a.enchainement.explique)}`
              : "",
          reprises: a.enchainement.reprises.map((r) => ({ d: r.d, gain: signe(r.gain) })),
        }
      : null,
    constats: constats.map((c) => ({ score: c.score, texte: c.texte })),
    axe: { titre: axe.titre, texte: axe.texte },
    retour: {
      robustesse: phrasesDeRobustesse(ep, mesures),
      observees: competencesObservees(observations).map((c) => ({ code: c.code, nom: c.nom, phrase: c.phrase })),
      apercu: apercu
        ? {
            competences: apercu.competences.map((l) => ({
              code: l.competence.code,
              nom: l.competence.nom,
              score: l.score,
              preuve: l.preuve,
            })),
            robustesse: apercu.robustesse.phrase,
            risque: apercu.risque.phrase,
          }
        : null,
      seuilIndicatif: SEUILS_DE_CONFIANCE.indicatif.episodes,
      mention: MENTION_DE_L_APERCU,
    },
  };
}

/** L'introduction d'un épisode ouvert : ce que la page montre avant le premier geste. */
export function introServie(ep: Episode): IntroServie {
  return {
    code: ep.code,
    numero: ep.numero,
    domaine: ep.domaine,
    titre: ep.titre,
    persona: ep.persona,
    mandat: ep.mandat.map((m) => ({ fort: m.fort, texte: m.texte })),
    jugement: ep.jugement,
    duree: ep.duree,
    nombreDeDecisions: ep.etapes.length,
    nomDuTableau: ep.nomDuTableau,
    // Avant la partie, l'écran lisait le tableau sous le tirage n° 1.
    tableau: tableauServi(ep, 0, ep.lire([], 1, 0, 0), null),
    tirages: GRAINES_DU_BILAN.length,
  };
}

/**
 * LA PARTIE REJOUÉE À PARTIR DE SES FAITS, ET LA VUE DE CE GESTE. `sansLicence` : aucune licence ne
 * couvre l'épisode (la route le lit, `licencePourLEpisode`) ; le bilan d'une partie en Découverte
 * montre alors l'aperçu du profil.
 */
export function servirLaPartie(
  ep: Episode,
  d: DemandeDePartie,
  { sansLicence }: { sansLicence: boolean },
): VueDeLaPartie {
  verifierLaDemande(ep, d);
  const n = ep.etapes.length;
  const k = etapeCourante(d);
  const jours = joursDEnquete(ep, d.consultes);
  const consultes = ep.etapes.map((_, i) => [...(d.consultes[i] ?? [])]);
  const semaine = k === 0 ? 0 : ep.etapes[k - 1]!.jusqua;
  const lecture = ep.lire(d.decisions, d.graine, jours, semaine);
  // L'écart du tableau de bord se lit juste après une décision : à la lecture d'avant elle.
  const avant =
    d.geste === "valider" && k >= 1
      ? ep.lire(d.decisions.slice(0, k - 1), d.graine, jours, k === 1 ? 0 : ep.etapes[k - 2]!.jusqua)
      : null;
  const contexte = ep.contexte(lecture, d.decisions);
  const fin = k === n && d.geste === "valider" && d.fin ? d.fin : null;
  return {
    graine: d.graine,
    niveau: d.niveau,
    decisions: [...d.decisions],
    consultes,
    jours,
    tableau: tableauServi(ep, semaine, lecture, avant),
    consequence: d.geste === "valider" && k >= 1 ? consequenceServie(ep, d, k - 1, jours) : null,
    etape: k < n ? etapeServie(ep, k, contexte, { ...d, consultes }, jours) : null,
    bilan: fin
      ? bilanServi(
          ep,
          {
            graine: d.graine,
            chemin: ep.neutre.map((x, i) => d.decisions[i] ?? x),
            consultes,
            jours,
            diagnostic: fin.diagnostic,
            reevaluation: { choix: fin.reevaluation.choix, principal: fin.reevaluation.principal },
            prevision: fin.prevision,
            confiance: fin.confiance,
            niveau: d.niveau,
          },
          d.precedente ?? null,
          sansLicence,
        )
      : null,
  };
}
