/**
 * LE PROFIL DÉCISIONNEL : ce que des parties jouées disent, compétence par
 * compétence, et avec quelle confiance.
 *
 * Seule la première partie de chaque épisode compte : une partie rejouée se
 * joue en connaissant les conséquences. Une première partie en Découverte ne
 * compte pas non plus : l'effet immédiat de chaque choix aide les suivants.
 *
 * Le SCORE d'une compétence est la moyenne pondérée de ses observations, épisode
 * par épisode ; chaque épisode pèse le total de ses poids, plafonné à 3, pour
 * qu'un épisode riche n'écrase pas les autres. L'INTERVALLE vient de mille
 * rééchantillonnages des épisodes joués : « avec un autre mélange de ces
 * épisodes, le score aurait été entre… ». Le hasard de ce calcul est fixé :
 * le même profil donne toujours le même intervalle.
 *
 * Aucun score sans son niveau de confiance, aucune compétence sans sa preuve.
 * Les phrases décrivent des décisions, jamais une personne. Le résultat
 * obtenu n'entre nulle part.
 *
 * Tout est pur : une liste de parties en entrée, un profil en sortie.
 */
import {
  COMPETENCES,
  ETIQUETTES,
  type CodeCompetence,
  type Competence,
} from "@/config/episodes/competences";
import { DIFFICULTES, PEU_DISCRIMINANTS, type Difficulte } from "@/config/episodes/difficultes";
import { FAMILLES, estUnEpisodeDeDirection } from "@/config/episodes/familles";
import { TRACES } from "@/config/episodes/traces";
import type { Episode } from "@/config/episodes/types";
import type { CodeNiveau } from "@/config/episodes/niveaux";
import { versionDuModele } from "@/config/episodes/versions";
import { moyenne, mulberry32 } from "@/engine/episodes/commun";
import { decisives } from "@/pedagogy/episodes/bilan";
import { SEUIL_QUALITE } from "@/pedagogy/episodes/mesures";
import { EPISODES } from "@/pedagogy/episodes/registre";
import {
  observer,
  valeurDeLaDecision,
  type Observation,
  type PartieObservee,
} from "./observations";
import type { PartieEnregistree } from "./types";

export type NiveauDeConfiance = "aucun" | "indicatif" | "etabli" | "solide";

export const CONFIANCES: Record<NiveauDeConfiance, { nom: string; aide: string }> = {
  aucun: { nom: "Pas encore de score", aide: "trop peu d'observations pour conclure" },
  indicatif: { nom: "Indicatif", aide: "à confirmer par d'autres épisodes" },
  etabli: { nom: "Établi", aide: "observé dans assez d'épisodes et de familles" },
  solide: { nom: "Solide", aide: "observé souvent, dans des contextes variés" },
};

const RANG: Record<NiveauDeConfiance, number> = { aucun: 0, indicatif: 1, etabli: 2, solide: 3 };

/** Les conditions de chaque niveau : des conventions de départ, à recaler sur des parties réelles. */
export const SEUILS_DE_CONFIANCE = {
  indicatif: { episodes: 2, points: 3 },
  etabli: { episodes: 4, familles: 3, points: 6, largeur: 30 },
  solide: { episodes: 6, familles: 4, points: 10, largeur: 20 },
} as const;

export const PLAFOND_PAR_EPISODE = 3;
const TIRAGES_DU_REECHANTILLONNAGE = 1000;
const HASARD_DU_REECHANTILLONNAGE = 2026;

export const MENTION =
  "Ce profil décrit les décisions prises dans des situations simulées, jugées selon les modèles de ces situations. Il ne mesure ni la personnalité, ni le potentiel, ni la performance au poste.";

export interface PartieComptee extends PartieObservee {
  enregistree: PartieEnregistree;
  ep: Episode;
  /** Jouée sous une version du modèle antérieure à l'actuelle. */
  ancienneVersion: boolean;
}

export interface PartieIgnoree {
  enregistree: PartieEnregistree;
  raison: "rejouee" | "decouverte" | "inconnue";
}

export interface LigneDeCompetence {
  competence: Competence;
  /** Sur 100 ; `null` sans score (trop peu d'observations, ou compétence pas encore notée). */
  score: number | null;
  intervalle: readonly [number, number] | null;
  confiance: NiveauDeConfiance;
  episodes: number;
  familles: number;
  points: number;
  observations: readonly Observation[];
  /** Ce que les observations montrent, en une ou deux phrases. */
  preuve: string;
  /** Sans observation : les épisodes qui l'observent le plus. */
  ouLObserver: readonly string[];
}

export interface PointDeProgression {
  code: string;
  numero: number;
  date: string;
  niveau: string;
  qualite: number;
  robustesse: number;
  /** La part des réflexes pris, sur les décisions qui en offraient un ; `null` s'il n'y en avait pas. */
  reflexes: number | null;
}

export type Verdict = "progres" | "recul" | "stable" | "insuffisant";

export interface Comparaison {
  debut: number;
  fin: number;
  verdict: Verdict;
}

export interface Recommandation {
  code: string;
  numero: number;
  titre: string;
  competence: CodeCompetence;
  difficulte: Difficulte;
  raison: string;
}

export interface Profil {
  comptees: readonly PartieComptee[];
  ignorees: readonly PartieIgnoree[];
  competences: readonly LigneDeCompetence[];
  robustesse: { moyenne: number | null; decisions: number; phrase: string };
  risque: { possibles: number; prises: number; phrase: string };
  progression: {
    points: readonly PointDeProgression[];
    qualite: Comparaison;
    competences: readonly { code: CodeCompetence; comparaison: Comparaison }[];
  };
  /** La compétence que la recommandation vise, et pourquoi ; `choisie` : c'est la personne qui l'a choisie. */
  cible: { competence: CodeCompetence; pourquoi: string; choisie: boolean } | null;
  recommandations: readonly Recommandation[];
  /** Le niveau conseillé pour le prochain épisode, et pourquoi. */
  conseil: ConseilDeNiveau;
}

export interface ConseilDeNiveau {
  niveau: CodeNiveau;
  pourquoi: string;
}

/** Les compétences qu'on peut choisir de travailler : celles qui ont un score. */
export const OBJECTIFS_POSSIBLES: readonly CodeCompetence[] = COMPETENCES.filter(
  (c) => c.score,
).map((c) => c.code);

export const estUnObjectif = (code: string | null | undefined): code is CodeCompetence =>
  OBJECTIFS_POSSIBLES.includes(code as CodeCompetence);

/**
 * Au-delà de cette qualité moyenne sur les deux derniers épisodes, on propose
 * l'Expert ; en deçà de la seconde, la Découverte. Des conventions de départ,
 * comme les autres seuils du profil.
 */
export const SEUILS_DU_CONSEIL = { expert: 0.8, decouverte: 0.4 } as const;

/**
 * LE NIVEAU CONSEILLÉ : la difficulté suit ce que la personne réussit.
 *
 * On regarde la qualité moyenne des décisions des deux derniers épisodes qui
 * comptent. Haute, l'Expert met à l'épreuve ce qui est acquis ; basse, la
 * Découverte donne des repères de méthode et l'effet immédiat de chaque
 * choix — au prix de ne pas compter dans le profil, ce que la phrase dit.
 * Le conseil n'oblige à rien : la personne garde le choix du niveau.
 */
export function conseillerUnNiveau(points: readonly PointDeProgression[]): ConseilDeNiveau {
  if (points.length < 2) {
    return {
      niveau: "standard",
      pourquoi:
        "Jouez en Standard : c'est le niveau de référence, et vos premières parties y comptent dans votre profil.",
    };
  }
  const recents = points.slice(-2);
  const q = moyenne(recents.map((p) => p.qualite));
  const lu = `Vos deux derniers épisodes : ${Math.round(q * 100)} % de qualité de décision en moyenne.`;
  if (q >= SEUILS_DU_CONSEIL.expert) {
    return {
      niveau: "expert",
      pourquoi: `${lu} Passez en Expert : moins de temps pour enquêter, pas de conseil, des imprévus mêlés au reste. C'est là que se confirme ce qui est acquis.`,
    };
  }
  if (q <= SEUILS_DU_CONSEIL.decouverte) {
    return {
      niveau: "decouverte",
      pourquoi: `${lu} Un épisode en Découverte, avec des repères de méthode et l'effet immédiat de chaque choix, aide à reprendre pied. C'est un entraînement : ni cette partie ni les suivantes de cet épisode ne compteront dans votre profil.`,
    };
  }
  return {
    niveau: "standard",
    pourquoi: `${lu} Restez en Standard : l'Expert se propose à partir de ${Math.round(SEUILS_DU_CONSEIL.expert * 100)} %.`,
  };
}

/* ---------------------------------------------------------------------------
 * LES PARTIES QUI COMPTENT.
 * ------------------------------------------------------------------------- */

export function trierLesParties(
  parties: readonly PartieEnregistree[],
  episodes: readonly Episode[] = EPISODES,
): { comptees: PartieComptee[]; ignorees: PartieIgnoree[] } {
  const chronologiques = [...parties].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const vus = new Set<string>();
  const comptees: PartieComptee[] = [];
  const ignorees: PartieIgnoree[] = [];
  for (const enregistree of chronologiques) {
    const ep = episodes.find((e) => e.code === enregistree.code);
    if (!ep) {
      ignorees.push({ enregistree, raison: "inconnue" });
      continue;
    }
    if (vus.has(ep.code)) {
      ignorees.push({ enregistree, raison: "rejouee" });
      continue;
    }
    vus.add(ep.code);
    if (enregistree.partie.niveau === "decouverte") {
      ignorees.push({ enregistree, raison: "decouverte" });
      continue;
    }
    comptees.push({
      enregistree,
      ep,
      ancienneVersion: enregistree.versionModele !== versionDuModele(ep.code),
      ...observer(ep, enregistree.partie),
    });
  }
  return { comptees, ignorees };
}

/* ---------------------------------------------------------------------------
 * LE SCORE ET SA CONFIANCE.
 * ------------------------------------------------------------------------- */

export interface ParEpisode {
  code: string;
  famille: string;
  score: number;
  poids: number;
}

function parEpisode(observations: readonly Observation[]): ParEpisode[] {
  const groupes = new Map<string, Observation[]>();
  for (const o of observations) groupes.set(o.code, [...(groupes.get(o.code) ?? []), o]);
  return [...groupes.values()].map((os) => {
    const poids = os.reduce((s, o) => s + o.poids, 0);
    return {
      code: os[0]!.code,
      famille: os[0]!.famille,
      score: os.reduce((s, o) => s + o.valeur * o.poids, 0) / poids,
      poids: Math.min(PLAFOND_PAR_EPISODE, poids),
    };
  });
}

const global = (episodes: readonly ParEpisode[]) =>
  episodes.reduce((s, e) => s + e.score * e.poids, 0) / episodes.reduce((s, e) => s + e.poids, 0);

/** Les 5e et 95e centiles du score, sur mille mélanges des mêmes épisodes tirés avec remise. */
export function intervalle(episodes: readonly ParEpisode[]): readonly [number, number] {
  const r = mulberry32(HASARD_DU_REECHANTILLONNAGE);
  const scores = Array.from({ length: TIRAGES_DU_REECHANTILLONNAGE }, () =>
    global(episodes.map(() => episodes[Math.floor(r() * episodes.length)]!)),
  ).sort((a, b) => a - b);
  const centile = (q: number) => scores[Math.floor(q * (scores.length - 1))]!;
  return [Math.round(centile(0.05) * 100), Math.round(centile(0.95) * 100)];
}

export function niveauDeConfiance(
  episodes: number,
  familles: number,
  points: number,
  largeur: number,
): NiveauDeConfiance {
  const { indicatif, etabli, solide } = SEUILS_DE_CONFIANCE;
  const atteint = (s: { episodes: number; familles: number; points: number; largeur: number }) =>
    episodes >= s.episodes && familles >= s.familles && points >= s.points && largeur <= s.largeur;
  if (atteint(solide)) return "solide";
  if (atteint(etabli)) return "etabli";
  if (episodes >= indicatif.episodes && points >= indicatif.points) return "indicatif";
  return "aucun";
}

/* ---------------------------------------------------------------------------
 * LES PREUVES : des décomptes et des décisions nommées, jamais un adjectif.
 * ------------------------------------------------------------------------- */

const fois = (n: number) => `${n} fois`;
const ref = (o: Observation) => `${o.numero}-D${(o.decision ?? 0) + 1}`;
const decisionsDe = (os: readonly Observation[]) =>
  os.filter((o) => o.source === "principale" || o.source === "secondaire");

function phraseDesDecisions(os: readonly Observation[]): string {
  const decisions = decisionsDe(os);
  if (decisions.length === 0) return "";
  const bonnes = decisions.filter((o) => o.valeur >= SEUIL_QUALITE);
  const phrases = [
    `Bonne option dans ${bonnes.length} décision${bonnes.length > 1 ? "s" : ""} sur ${decisions.length}.`,
  ];
  const exemple = [...bonnes].sort((a, b) => b.poids - a.poids)[0];
  if (exemple?.choix) phrases.push(`Par exemple, ${ref(exemple)} : « ${exemple.choix.prise} ».`);
  const aRevoir = decisions
    .filter((o) => o.valeur < SEUIL_QUALITE && o.choix)
    .sort((a, b) => b.choix!.ecartBrut - a.choix!.ecartBrut)[0];
  if (aRevoir?.choix) {
    phrases.push(
      `À revoir : ${ref(aRevoir)}, « ${aRevoir.choix.prise} », ${aRevoir.choix.ecart} sous « ${aRevoir.choix.meilleure} » en moyenne.`,
    );
  }
  return phrases.join(" ");
}

function preuve(c: CodeCompetence, os: readonly Observation[]): string {
  if (os.length === 0) return "Aucun épisode joué ne l'observe encore.";
  const parSource = (s: Observation["source"]) => os.filter((o) => o.source === s);
  const morceaux: string[] = [];
  if (c === "R1") {
    const info = parSource("information");
    const vues = info.reduce((s, o) => s + (o.sources?.vues ?? 0), 0);
    const sur = info.reduce((s, o) => s + (o.sources?.sur ?? 0), 0);
    if (sur)
      morceaux.push(
        `Vous avez consulté ${vues} des ${sur} informations décisives à votre portée avant de décider.`,
      );
  }
  if (c === "R2") {
    const diag = parSource("diagnostic");
    const justes = diag.filter((o) => o.valeur === 1).length;
    const proches = diag.filter((o) => o.valeur > 0 && o.valeur < 1).length;
    morceaux.push(
      `Diagnostic de la semaine 1 juste ${fois(justes)} sur ${diag.length}${proches ? `, une vraie cause mais pas la principale ${fois(proches)}` : ""}.`,
    );
  }
  if (c === "R3") {
    const rev = parSource("revision");
    const epreuves = rev.filter((o) => o.aLEpreuve);
    const corriges = epreuves.filter((o) => o.valeur === 1).length;
    const maintenus = rev.filter((o) => !o.aLEpreuve && o.valeur === 1).length;
    morceaux.push(
      `${rev.length} réévaluation${rev.length > 1 ? "s" : ""} : diagnostic juste maintenu ${fois(maintenus)}${
        epreuves.length
          ? ` ; sur ${epreuves.length} diagnostic${epreuves.length > 1 ? "s" : ""} d'abord faux, corrigé ${fois(corriges)}`
          : " ; aucun diagnostic d'abord faux, donc aucune révision vraiment à l'épreuve"
      }.`,
    );
  }
  if (c === "R4") {
    const refl = parSource("reflexe");
    const pris = refl.filter((o) => o.valeur === 0);
    morceaux.push(
      `Réponse réflexe évitée ${fois(refl.length - pris.length)} sur ${refl.length} décisions qui en offraient une.`,
    );
    if (pris.length) {
      morceaux.push(
        `Prise : ${pris
          .slice(0, 2)
          .map((o) => `${ref(o)}, « ${o.choix?.prise} »`)
          .join(" ; ")}.`,
      );
    }
  }
  if (c === "R7") {
    const prev = parSource("prevision");
    const justes = prev.filter((o) => o.valeur === 1).length;
    const proches = prev.filter((o) => o.valeur > 0 && o.valeur < 1).length;
    const surs = prev.filter((o) => (o.confiance ?? 0) >= 70);
    morceaux.push(
      `${prev.length} prévision${prev.length > 1 ? "s" : ""} : ${justes} juste${justes > 1 ? "s" : ""}, ${proches} proche${proches > 1 ? "s" : ""}, ${prev.length - justes - proches} loin.`,
    );
    if (surs.length) {
      morceaux.push(
        `Confiance de 70 % ou plus ${fois(surs.length)}, avec une prévision juste ${fois(surs.filter((o) => o.valeur === 1).length)} sur ces ${surs.length}.`,
      );
    }
  }
  const decisions = phraseDesDecisions(os);
  if (decisions) morceaux.push(decisions);
  return morceaux.join(" ");
}

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE ÉPISODE OBSERVE, avant même d'être joué.
 * ------------------------------------------------------------------------- */

export interface CeQuObserveUnEpisode {
  principales: number;
  secondaires: number;
  /** Le poids attendu de la compétence dans une partie de cet épisode. */
  poids: number;
}

export function ceQuObserve(ep: Episode, c: CodeCompetence): CeQuObserveUnEpisode {
  const etiquettes = ETIQUETTES[ep.code] ?? [];
  const principales = etiquettes.filter((e) => e.principale === c).length;
  const secondaires = etiquettes.filter((e) => e.secondaires.includes(c)).length;
  let traces = 0;
  if (c === "R1") traces = 0.5 * decisives(ep).filter((ids) => ids.length > 0).length;
  if (c === "R2" || c === "R3" || c === "R7") traces = 1;
  if (c === "R4") traces = 0.5 * new Set((TRACES[ep.code]?.reflexes ?? []).map(([d]) => d)).size;
  return { principales, secondaires, poids: principales + 0.5 * secondaires + traces };
}

function ouLObserver(
  c: CodeCompetence,
  dejaJoues: ReadonlySet<string>,
  episodes: readonly Episode[],
) {
  return episodes
    .filter((ep) => !dejaJoues.has(ep.code))
    .map((ep) => ({ ep, poids: ceQuObserve(ep, c).poids }))
    .filter((x) => x.poids > 0)
    .sort((a, b) => b.poids - a.poids || a.ep.numero - b.ep.numero)
    .slice(0, 3)
    .map((x) => x.ep.code);
}

/* ---------------------------------------------------------------------------
 * LA PROGRESSION : seulement quand l'écart dépasse le bruit.
 * ------------------------------------------------------------------------- */

/**
 * Les premiers épisodes face aux plus récents (deux ou trois de chaque côté).
 * On ne parle de progrès ou de recul que si les deux groupes ne se recouvrent
 * plus : le plus faible des récents au-dessus du plus fort des premiers.
 */
export function comparer(valeurs: readonly number[]): Comparaison {
  if (valeurs.length < 4) return { debut: NaN, fin: NaN, verdict: "insuffisant" };
  const n = Math.min(3, Math.floor(valeurs.length / 2));
  const [debut, fin] = [valeurs.slice(0, n), valeurs.slice(-n)];
  const verdict: Verdict =
    Math.min(...fin) > Math.max(...debut)
      ? "progres"
      : Math.max(...fin) < Math.min(...debut)
        ? "recul"
        : "stable";
  return { debut: moyenne(debut), fin: moyenne(fin), verdict };
}

/* ---------------------------------------------------------------------------
 * LA RECOMMANDATION : un classement explicable, sans intelligence artificielle.
 * ------------------------------------------------------------------------- */

/** Le bilan d'entrée : deux épisodes faciles qui touchent presque toutes les compétences. */
export const BILAN_D_ENTREE = ["cent-premiers-jours", "client-qui-s-en-va"] as const;

function choisirLaCible(
  lignes: readonly LigneDeCompetence[],
  episodesComptes: number,
): { competence: CodeCompetence; pourquoi: string; choisie: false } | null {
  const notees = lignes.filter((l) => l.competence.score);
  if (episodesComptes === 0 || notees.length === 0) return null;
  const moinsObservee = () =>
    [...notees].sort(
      (a, b) => a.points - b.points || a.competence.code.localeCompare(b.competence.code),
    )[0]!;
  if (episodesComptes < 6) {
    const l = moinsObservee();
    return {
      choisie: false,
      competence: l.competence.code,
      pourquoi: `« ${l.competence.nom} » est la compétence la moins observée de votre profil : il faut d'abord la voir à l'œuvre.`,
    };
  }
  const etablies = notees.filter((l) => RANG[l.confiance] >= RANG.etabli && l.score != null);
  if (etablies.length === 0) {
    const l = moinsObservee();
    return {
      choisie: false,
      competence: l.competence.code,
      pourquoi: `« ${l.competence.nom} » est encore la compétence la moins observée de votre profil.`,
    };
  }
  const l = [...etablies].sort((a, b) => a.score! - b.score!)[0]!;
  return {
    choisie: false,
    competence: l.competence.code,
    pourquoi: `« ${l.competence.nom} » est votre compétence établie au score le plus bas (${l.score}) : c'est là que l'entraînement rapporte le plus.`,
  };
}

const NOMS_DE_DIFFICULTE: Record<Difficulte, string> = {
  facile: "facile",
  moyen: "moyenne",
  difficile: "difficile",
};

function recommander(
  cible: CodeCompetence,
  score: number | null,
  dejaJoues: ReadonlySet<string>,
  famillesJouees: ReadonlyMap<string, number>,
  episodes: readonly Episode[],
): Recommandation[] {
  const competence = COMPETENCES.find((c) => c.code === cible)!;
  const adaptee = (d: Difficulte) =>
    score == null || score < 60
      ? d !== "difficile"
      : score > 80
        ? d === "difficile"
        : d === "moyen";
  // Les épisodes de direction ne s'imposent pas à un manager de proximité :
  // on ne les propose qu'à qui en a déjà joué un, et donc choisi ce terrain.
  const direction = [...dejaJoues].some(estUnEpisodeDeDirection);
  return episodes
    .filter((ep) => !dejaJoues.has(ep.code))
    .filter((ep) => direction || !estUnEpisodeDeDirection(ep.code))
    .map((ep) => {
      const vu = ceQuObserve(ep, cible);
      const famille = FAMILLES.find((f) => f.episodes.includes(ep.code))!;
      const difficulte = DIFFICULTES[ep.code] ?? "moyen";
      const nouvelleFamille = !famillesJouees.has(famille.code);
      const note =
        vu.poids +
        (nouvelleFamille ? 1 : 0) +
        (adaptee(difficulte) ? 0.5 : -0.5) -
        (PEU_DISCRIMINANTS.includes(ep.code) ? 1 : 0);
      const observe = [
        vu.principales
          ? `${vu.principales} décision${vu.principales > 1 ? "s" : ""} où « ${competence.nom} » est en jeu au premier plan`
          : null,
        vu.secondaires ? `${vu.secondaires} en second plan` : null,
        competence.trace && vu.poids > vu.principales + 0.5 * vu.secondaires
          ? TEXTES_DE_TRACE[competence.trace]
          : null,
      ].filter(Boolean);
      const dejaVue = famillesJouees.get(famille.code) ?? 0;
      return {
        note,
        poids: vu.poids,
        r: {
          code: ep.code,
          numero: ep.numero,
          titre: ep.titre,
          competence: cible,
          difficulte,
          raison: `${observe.join(", ")}. Famille « ${famille.titre} », ${
            dejaVue === 0 ? "jamais jouée" : `déjà jouée ${fois(dejaVue)}`
          }. Difficulté ${NOMS_DE_DIFFICULTE[difficulte]}.`,
        },
      };
    })
    .filter((x) => x.poids > 0)
    .sort((a, b) => b.note - a.note || a.r.numero - b.r.numero)
    .slice(0, 3)
    .map((x) => x.r);
}

const TEXTES_DE_TRACE: Record<NonNullable<Competence["trace"]>, string> = {
  information: "des informations décisives à aller chercher avant de décider",
  diagnostic: "le diagnostic de la semaine 1",
  revision: "la réévaluation de ce diagnostic",
  reflexes: "des décisions qui offrent une réponse réflexe",
  calibrage: "une prévision chiffrée",
};

function bilanDEntree(
  dejaJoues: ReadonlySet<string>,
  episodes: readonly Episode[],
): Recommandation[] {
  return BILAN_D_ENTREE.filter((code) => !dejaJoues.has(code)).map((code, i) => {
    const ep = episodes.find((e) => e.code === code)!;
    return {
      code,
      numero: ep.numero,
      titre: ep.titre,
      competence: "R2",
      difficulte: DIFFICULTES[code] ?? "facile",
      raison:
        i === 0
          ? "Le bilan d'entrée : un épisode facile qui observe huit compétences sur dix, pour un premier point de départ."
          : "La suite du bilan d'entrée : avec le premier, il donne un score indicatif à la plupart des compétences.",
    };
  });
}

/* ---------------------------------------------------------------------------
 * LE PROFIL.
 * ------------------------------------------------------------------------- */

export function construireProfil(
  parties: readonly PartieEnregistree[],
  episodes: readonly Episode[] = EPISODES,
  /** La compétence que la personne a choisi de travailler ; elle prime sur celle du profil. */
  options: { objectif?: CodeCompetence | null } = {},
): Profil {
  const { comptees, ignorees } = trierLesParties(parties, episodes);
  const toutes = comptees.flatMap((p) => p.observations);
  const dejaJoues = new Set(parties.map((p) => p.code));

  const lignes = COMPETENCES.map((competence): LigneDeCompetence => {
    const os = toutes.filter((o) => o.competence === competence.code);
    const eps = parEpisode(os);
    const points = os.reduce((s, o) => s + o.poids, 0);
    const familles = new Set(eps.map((e) => e.famille)).size;
    const avecScore = eps.length > 0 && competence.score;
    const iv = avecScore && eps.length >= 2 ? intervalle(eps) : null;
    const confiance = competence.score
      ? niveauDeConfiance(eps.length, familles, points, iv ? iv[1] - iv[0] : Infinity)
      : "aucun";
    return {
      competence,
      score: avecScore && confiance !== "aucun" ? Math.round(global(eps) * 100) : null,
      intervalle: confiance !== "aucun" ? iv : null,
      confiance,
      episodes: eps.length,
      familles,
      points,
      observations: os,
      preuve: preuve(competence.code, os),
      ouLObserver: os.length === 0 ? ouLObserver(competence.code, dejaJoues, episodes) : [],
    };
  }).sort(
    (a, b) =>
      RANG[b.confiance] - RANG[a.confiance] ||
      (b.score ?? -1) - (a.score ?? -1) ||
      b.points - a.points,
  );

  const decisions = comptees.flatMap((p) =>
    p.mesures.decisions.map((m) => ({ m, numero: p.ep.numero, ep: p.ep })),
  );
  const fragile = [...decisions].sort((a, b) => a.m.choisie.robustesse - b.m.choisie.robustesse)[0];
  const robMoy = decisions.length ? moyenne(decisions.map((x) => x.m.choisie.robustesse)) : null;
  const tiennent = decisions.filter((x) => x.m.choisie.robustesse >= 0.7).length;
  const robustesse = {
    moyenne: robMoy,
    decisions: decisions.length,
    phrase:
      robMoy == null
        ? "Aucune décision encore observée."
        : `${tiennent} de vos ${decisions.length} choix tiennent quand le hasard tourne mal.${
            fragile && fragile.m.choisie.robustesse < 0.7
              ? ` Le plus exposé : ${fragile.numero}-D${fragile.m.d + 1}, « ${fragile.ep.etapes[fragile.m.d]!.options[fragile.m.choisie.option]!.t} ».`
              : ""
          }`,
  };
  const possibles = decisions.filter((x) => x.m.securitePossible);
  const prises = possibles.filter((x) => x.m.securiteChoisie).length;
  const risque = {
    possibles: possibles.length,
    prises,
    phrase: possibles.length
      ? `Quand une option plus sûre que la meilleure existait, vous l'avez prise ${fois(prises)} sur ${possibles.length}.`
      : "Aucune décision jouée n'offrait encore une option plus sûre que la meilleure.",
  };

  const points: PointDeProgression[] = comptees.map((p) => {
    const offerts = p.observations.filter((o) => o.source === "reflexe");
    return {
      code: p.ep.code,
      numero: p.ep.numero,
      date: p.enregistree.date,
      niveau: p.enregistree.partie.niveau ?? "standard",
      qualite: moyenne(p.mesures.decisions.map(valeurDeLaDecision)),
      robustesse: moyenne(p.mesures.decisions.map((m) => m.choisie.robustesse)),
      reflexes: offerts.length
        ? offerts.filter((o) => o.valeur === 0).length / offerts.length
        : null,
    };
  });
  const progressionParCompetence = lignes
    .filter((l) => l.competence.score)
    .map((l) => {
      const ordre = comptees.map((p) => p.ep.code);
      const eps = parEpisode(l.observations).sort(
        (a, b) => ordre.indexOf(a.code) - ordre.indexOf(b.code),
      );
      return { code: l.competence.code, comparaison: comparer(eps.map((e) => e.score)) };
    });

  const famillesJouees = new Map<string, number>();
  for (const code of dejaJoues) {
    const f = FAMILLES.find((x) => x.episodes.includes(code))?.code;
    if (f) famillesJouees.set(f, (famillesJouees.get(f) ?? 0) + 1);
  }
  const choisie = estUnObjectif(options.objectif)
    ? lignes.find((l) => l.competence.code === options.objectif)!
    : null;
  const cible = choisie
    ? {
        competence: choisie.competence.code,
        pourquoi: `Vous avez choisi de travailler « ${choisie.competence.nom} »${
          choisie.score != null ? `, à ${choisie.score}/100 aujourd'hui` : ""
        }.`,
        choisie: true,
      }
    : choisirLaCible(lignes, comptees.length);
  const recommandations = cible
    ? recommander(
        cible.competence,
        lignes.find((l) => l.competence.code === cible.competence)!.score,
        dejaJoues,
        famillesJouees,
        episodes,
      )
    : bilanDEntree(dejaJoues, episodes);
  // Le bilan d'entrée déjà joué en Découverte : on passe directement à la recommandation.
  const suite =
    recommandations.length > 0
      ? recommandations
      : recommander("R2", null, dejaJoues, famillesJouees, episodes);

  return {
    comptees,
    ignorees,
    competences: lignes,
    robustesse,
    risque,
    progression: {
      points,
      qualite: comparer(points.map((p) => p.qualite)),
      competences: progressionParCompetence,
    },
    cible,
    recommandations: suite,
    conseil: conseillerUnNiveau(points),
  };
}
