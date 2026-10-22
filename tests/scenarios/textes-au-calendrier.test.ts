import { describe, expect, it } from "vitest";
import { SCENARIOS, type ScenarioDefinition } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import { tourDOuverture, type SituationDef } from "../../src/config/scenarios/situation-kit";
import { situationDeLaPartie, textesDe } from "../../src/config/scenarios/situation-texte";
import { nomDuMois, trimestreDuTour } from "../../src/config/scenarios/calendrier-mensuel";
import { prolongerLaSaison } from "../../src/config/scenarios/rounds";
import { courrierParCode } from "../../src/config/courriers/registre";
import { courrierALaDuree, textesDuCourrier } from "../../src/config/courriers/texte";
import { isProductAvailable } from "../../src/engine/gamme";
import type { EngineScenarioConfig } from "../../src/engine/types";

/**
 * LES TEXTES D'UNE PARTIE AU MOIS, VRAIS SUR LE CALENDRIER.
 *
 * Les variantes au mois des situations et des courriers avaient été écrites contre
 * l'ancien découpage, où le tour q d'une partie au mois relisait la saison du
 * trimestre q. Sur le calendrier (`calendrier-mensuel.ts`), ce qui est écrit pour le
 * tour q du trimestre s'ouvre au premier mois de ce trimestre, ou au mois 1 si ce
 * trimestre est en cours au départ, sur une saison répartie mois par mois. « Le
 * quatrième mois » d'une situation des fêtes est octobre, ou le premier mois d'une
 * partie commencée en novembre ; « 1,85 fois » était le trimestre des banquets,
 * octobre en fait 1,67.
 *
 * Cette garde compose la partie comme la création (`composerLeScenarioJoue`, monde
 * figé), pour les quinze scénarios, chaque mois de départ et les deux durées (douze et
 * dix-huit mois). Elle rend au mois, pour SA partie, chaque situation à tour fixe au
 * tour où elle s'ouvre, et chaque courrier scripté de la partie à son tour, et
 * vérifie :
 *  · qu'un rang de mois ou de tour écrit en toutes lettres (« le quatrième mois »,
 *    « le dernier tour ») est celui du tour où le texte se lit, et qu'un rang écrit en
 *    chiffres (« au tour 7 ») est l'un de ceux que la garde recalcule sur la partie ;
 *  · qu'un nombre qui ressemble à un coefficient de saison (décimal, sans unité, hors
 *    calcul) est un coefficient de la partie au tour où le texte se lit, tous tableaux
 *    confondus (marché, segments, références), sauf les exceptions nommées ;
 *  · que ce que le récit affirme de la saison du moment est vrai, pour chaque mois de
 *    départ, sur la saison mois par mois de la partie (`AFFIRMATIONS`).
 */

const MOIS_DE_DEPART = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const DUREES = [12, 18] as const;

/**
 * Les niveaux composés : le niveau 7 porte la NOVA Home de la gamme, et n'est composé que
 * pour les situations qui la supposent (`seulementAvec`). Il livre aussi la Studio prête
 * (`REFERENCES_LIVREES_PRETES`) : la R&D que `novag_t1_reprise` chiffre n'y existe à
 * aucune durée, une limite qui ne tient pas au calendrier.
 */
const niveaux = (code: string) => (code === "nova-gamme" ? [6, 7] : [6]);
const aCeNiveau = (level: number) => (def: SituationDef) => level < 7 || def.seulementAvec !== undefined;

const jeu = (scenario: EngineScenarioConfig, moisDeDepart: number, mois: number, level: number) =>
  composerLeScenarioJoue({
    scenario,
    seed: 1,
    variableWorld: false,
    level,
    concurrents: 4,
    investmentStories: true,
    periodicity: "month",
    moisDeDepart,
    roundsCount: mois,
  });

/** Un nombre tel que le texte l'écrit, au centième, en évitant le bruit des flottants. */
const auCentieme = (x: number) => Math.round(Number((x * 100).toFixed(9))) / 100;

/** Tous les tableaux de saison d'un scénario, chacun tel que le moteur le lit (le sien, ou celui de son marché). */
function tableaux(s: EngineScenarioConfig): number[][] {
  return [
    s.market.seasonality,
    ...s.market.segments.map((g) => g.seasonality ?? s.market.seasonality),
    ...(s.products ?? []).flatMap((p) => {
      const marche = p.market.seasonality ?? s.market.seasonality;
      return [marche, ...p.market.segments.map((g) => g.seasonality ?? marche)];
    }),
  ];
}

/** Les coefficients de saison de la partie à ce tour, au centième. */
const coefficientsDuTour = (s: EngineScenarioConfig, tour: number) =>
  new Set(tableaux(s).map((t) => auCentieme(t[tour - 1]!)));

/** Les coefficients que le scénario écrit au trimestre, sur ses tours écrits : ceux qu'un texte d'avant recopiait. */
const coefficientsEcrits = (s: EngineScenarioConfig) => new Set(tableaux(s).flatMap((t) => t.map(auCentieme)));

// ---------------------------------------------------------------------------
// Les coefficients
// ---------------------------------------------------------------------------

/**
 * Les nombres d'un texte qui peuvent être un coefficient de saison : décimaux, entre 0
 * et 5, sans unité derrière (heures, euros, pour cent, points), ni signe moins devant
 * (une élasticité), ni dans un calcul (après ÷, ≈, =, ou × précédé d'un nombre).
 */
function coefficientsCites(texte: string): { nombre: string; valeur: number }[] {
  return [...texte.matchAll(/(?<![\d,])(\d+,\d{1,2})(?![\d,])/g)].flatMap((m) => {
    const avant = texte.slice(0, m.index);
    const apres = texte.slice(m.index! + m[0].length);
    const valeur = Number(m[1]!.replace(",", "."));
    if (valeur <= 0 || valeur > 5) return [];
    if (/^\s*(?:h\b|€|%|‰|points?\b)/u.test(apres)) return [];
    if (/[−-]\s*$/u.test(avant) || /\(\s*[−-]?\s*$/u.test(avant) && /[−-]/u.test(avant.slice(-3))) return [];
    if (/[÷≈=]\s*$/u.test(avant) || /(?:\d|€)\s*×\s*$/u.test(avant)) return [];
    // « Taux d'intérêt ×0,6 » : le modificateur d'un événement, collé à son signe.
    if (/×$/u.test(avant)) return [];
    return [{ nombre: m[1]!, valeur }];
  });
}

/**
 * LES NOMBRES DÉCIMAUX QUI NE SONT PAS DES COEFFICIENTS DE SAISON, un par un : où, lequel,
 * pourquoi. La clé est « code de situation : nombre ».
 */
const PAS_UN_COEFFICIENT: Record<string, string> = {
  "bistrot_t2_fournisseur : 0,45": "l'inertie de la réputation, un réglage du moteur, pas une saison",
  "bistrotg_t2_fournisseur : 0,45": "l'inertie de la réputation, un réglage du moteur, pas une saison",
  "bmono_t1_reprise : 0,4": "une option du calcul du coefficient multiplicateur (45 ÷ 18)",
  "bmono_t1_reprise : 1,6": "une option du calcul du coefficient multiplicateur (45 ÷ 18)",
  "bmono_t1_reprise : 2,5": "une option du calcul du coefficient multiplicateur (45 ÷ 18)",
  "fitness_t3_ete : 1,0": "les charges de structure, constantes toute l'année : le contraire d'une saison",
};

// ---------------------------------------------------------------------------
// Les rangs
// ---------------------------------------------------------------------------

const ORDINAUX: Record<string, number> = {
  premier: 1, première: 1, deuxième: 2, second: 2, seconde: 2, troisième: 3, quatrième: 4, cinquième: 5,
  sixième: 6, septième: 7, huitième: 8, neuvième: 9, dixième: 10, onzième: 11, douzième: 12, treizième: 13,
  quatorzième: 14, quinzième: 15, seizième: 16, "dix-septième": 17, "dix-huitième": 18,
};
const RANG_EN_LETTRES = new RegExp(
  `(?<!\\p{L})(${[...Object.keys(ORDINAUX), "dernier", "dernière"].join("|")})\\s+(mois|tour)(?!\\p{L})`,
  "giu",
);
const RANG_EN_CHIFFRES = /(?<!\p{L})(mois|tour)\s+(\d+)(?!\d)/giu;

/** Le premier tour où une référence en développement se vend, financée selon `part`, par la règle du moteur. */
function premiereVente(s: EngineScenarioConfig, code: string, part: (tour: number) => number): number {
  const dev = s.products!.find((p) => p.code === code)!.development!;
  for (let tour = 2; tour <= 60; tour++) {
    if (isProductAvailable({ development: dev }, { invested: dev.cost * part(tour - 1), launched: false, techLevel: 0, demarreAuTour: 1 }, tour)) {
      return tour;
    }
  }
  throw new Error(`${code} ne se vend jamais`);
}

/**
 * LES RANGS EN CHIFFRES qu'une situation peut citer, recalculés sur la partie : le
 * tour où se vend une référence lancée au tour 1, par la règle du moteur.
 */
const RANGS_CALCULES: Record<string, (s: EngineScenarioConfig) => number[]> = {
  novag_t1_reprise: (s) => [premiereVente(s, "nova-studio", () => 1)],
  novag7_t1_home: (s) => [premiereVente(s, "nova-home", (t) => (t >= 2 ? 1 : 1 / 3))],
};

function rangsFaux(ou: string, texte: string, tour: number, mois: number, s: EngineScenarioConfig): string[] {
  const fautes: string[] = [];
  for (const m of texte.matchAll(RANG_EN_LETTRES)) {
    const mot = m[1]!.toLowerCase();
    const rang = mot.startsWith("derni") ? mois : ORDINAUX[mot]!;
    if (rang !== tour) fautes.push(`« ${m[0]} » au tour ${tour} sur ${mois}`);
  }
  for (const m of texte.matchAll(RANG_EN_CHIFFRES)) {
    const permis = RANGS_CALCULES[ou]?.(s) ?? [];
    if (!permis.includes(Number(m[2]))) fautes.push(`« ${m[0]} » (rangs recalculés : ${permis.join(", ") || "aucun"})`);
  }
  return fautes;
}

// ---------------------------------------------------------------------------
// Les textes ouverts à leur tour
// ---------------------------------------------------------------------------

interface Ouvert {
  ou: string;
  tour: number;
  /** Les textes rendus pour la partie, au tour où ils s'ouvrent. */
  textes: string[];
  /** Les mêmes, rendus au mois sans calendrier : le rendu de toujours, sans mois de départ. */
  sansCalendrier: string[];
}

/** Les situations à tour fixe que cette partie ouvre, chacune rendue pour elle, et le tour où elle s'ouvre. */
function situationsOuvertes(
  situations: SituationDef[],
  ecrits: number,
  s: EngineScenarioConfig,
  moisDeDepart: number,
  mois: number,
): Ouvert[] {
  const references = new Set((s.products ?? []).map((p) => p.code));
  return situations.flatMap((def) => {
    const tour = tourDOuverture(def.trigger, mois, ecrits, moisDeDepart);
    if (tour === null || !("round" in def.trigger)) return [];
    // Une condition se lit sur les résultats du tour joué : au premier tour, il n'y en a pas.
    if (def.trigger.requires && tour === 1) return [];
    if (def.seulementAvec && !references.has(def.seulementAvec.reference)) return [];
    if (def.seulementAvec?.auMarche && tour === 1) return [];
    return [
      {
        ou: def.code,
        tour,
        textes: textesDe(situationDeLaPartie(def, 30, moisDeDepart)),
        sansCalendrier: textesDe(situationDeLaPartie(def, 30)),
      },
    ];
  });
}

/** Les courriers que la partie fait tomber à un tour dit (événements scriptés, étapes d'investissement). */
function courriersScriptes(s: EngineScenarioConfig): Ouvert[] {
  return s.scriptedEvents.flatMap((e) => {
    const c = courrierParCode.get(e.eventCode);
    if (!c) return [];
    const textes = textesDuCourrier(courrierALaDuree(c, 30));
    return [{ ou: c.code, tour: e.round, textes, sansCalendrier: textes }];
  });
}

interface Partie {
  def: ScenarioDefinition;
  level: number;
  mois: number;
  moisDeDepart: number;
  s: EngineScenarioConfig;
  ouverts: Ouvert[];
}

/** Chaque partie composée d'un scénario, à ce niveau, chaque durée et chaque mois de départ, et ce qu'elle ouvre. */
function parties(def: ScenarioDefinition, level: number): Partie[] {
  return DUREES.flatMap((mois) =>
    MOIS_DE_DEPART.map((moisDeDepart) => {
      const s = jeu(def.scenario, moisDeDepart, mois, level);
      const ouverts = [
        ...situationsOuvertes(def.situations.filter(aCeNiveau(level)), def.scenario.roundsCount, s, moisDeDepart, mois),
        ...courriersScriptes(s),
      ];
      return { def, level, mois, moisDeDepart, s, ouverts };
    }),
  );
}

const ici = (p: Partie, o: Ouvert) =>
  `${o.ou}, départ en ${nomDuMois(1, p.moisDeDepart)}, ${p.mois} mois, tour ${o.tour} (${nomDuMois(o.tour, p.moisDeDepart)})`;

// ---------------------------------------------------------------------------
// Ce que le récit affirme de la saison du moment
// ---------------------------------------------------------------------------

/** Le tableau de saison qu'une référence ou une clientèle lit (le sien, ou celui de son marché) ; le marché sans code. */
function tableauDe(s: EngineScenarioConfig, code?: string): readonly number[] {
  if (!code) return s.market.seasonality;
  const produit = s.products?.find((p) => p.code === code);
  if (produit) return produit.market.seasonality ?? s.market.seasonality;
  const segment = s.market.segments.find((g) => g.code === code);
  if (segment) return segment.seasonality ?? s.market.seasonality;
  for (const p of s.products ?? []) {
    const g = p.market.segments.find((x) => x.code === code);
    if (g) return g.seasonality ?? p.market.seasonality ?? s.market.seasonality;
  }
  throw new Error(`ni référence ni clientèle « ${code} » dans « ${s.code} »`);
}

/** Ce qu'une affirmation lit pour se vérifier : la partie, le tour où le texte s'ouvre, et sa saison. */
interface Lecture {
  /** La saison du mois où le texte se lit, dans la partie. */
  mois: (code?: string) => number;
  /** La saison du trimestre auquel ce mois appartient, telle que le scénario l'écrit. */
  trimestre: (code?: string, decalage?: number) => number;
  /** Ce trimestre (ou celui à `decalage` de lui) est-il le plus haut, le plus bas, des quatre de son année ? */
  trimestreLePlusHaut: (code?: string, decalage?: number) => boolean;
  trimestreLePlusBas: (code?: string, decalage?: number) => boolean;
  /** La part de ce trimestre dans son année. */
  partDeLAnnee: (code?: string) => number;
  /** Le mois du calendrier (0 = janvier de la première année) où le texte se lit. */
  absolu: number;
  /** Les dix-huit mois du calendrier depuis janvier, tels qu'une partie commencée en janvier les joue. */
  calendrier: (code?: string) => readonly number[];
  /** Le texte s'ouvre-t-il au premier mois de son trimestre ? */
  premierMoisDuTrimestre: boolean;
  /** Une clientèle : sa demande ce mois-ci (taille × saison). */
  demande: (segment: string) => number;
}

function lecture(p: Partie, o: Ouvert, janvier: EngineScenarioConfig): Lecture {
  const absolu = p.moisDeDepart - 1 + (o.tour - 1);
  const q = trimestreDuTour(o.tour, p.moisDeDepart);
  const annee = (code: string | undefined, rang: number) => {
    const ecrit = tableauDe(p.def.scenario, code);
    const debut = 4 * Math.floor((rang - 1) / 4);
    return prolongerLaSaison(ecrit, debut + 4).slice(debut, debut + 4);
  };
  const duTrimestre = (code: string | undefined, rang: number) => annee(code, rang)[(rang - 1) % 4]!;
  return {
    mois: (code) => tableauDe(p.s, code)[o.tour - 1]!,
    trimestre: (code, decalage = 0) => duTrimestre(code, q + decalage),
    trimestreLePlusHaut: (code, decalage = 0) => duTrimestre(code, q + decalage) === Math.max(...annee(code, q + decalage)),
    trimestreLePlusBas: (code, decalage = 0) => duTrimestre(code, q + decalage) === Math.min(...annee(code, q + decalage)),
    partDeLAnnee: (code) => duTrimestre(code, q) / annee(code, q).reduce((a, b) => a + b, 0),
    absolu,
    calendrier: (code) => tableauDe(janvier, code),
    premierMoisDuTrimestre: absolu % 3 === 0,
    demande: (segment) => {
      const g = [...p.s.market.segments, ...(p.s.products ?? []).flatMap((x) => x.market.segments)].find((x) => x.code === segment)!;
      return g.size * tableauDe(p.s, segment)[o.tour - 1]!;
    },
  };
}

/** Le plus haut mois d'une année du calendrier (0 = la première), parmi les dix-huit d'une partie commencée en janvier. */
const moisLePlusHaut = (calendrier: readonly number[], annee: number) => {
  const mois = calendrier.slice(12 * annee, 12 * annee + 12);
  return 12 * annee + mois.indexOf(Math.max(...mois));
};

/**
 * CE QUE LE RÉCIT AFFIRME DE LA SAISON DU MOMENT, au mois sur le calendrier : où, la
 * phrase telle qu'elle se lit, et ce que la partie doit montrer, au mois où elle s'ouvre,
 * pour chaque mois de départ. « La saison » est le trimestre du calendrier auquel ce mois
 * appartient : ses trois mois font ensemble la saison du trimestre (`calendrier-mensuel.ts`).
 */
const AFFIRMATIONS: { ou: string[]; texte: string; vrai: (l: Lecture) => boolean; pourquoi: string }[] = [
  // VOLT FITNESS, juillet à septembre.
  {
    ou: ["fitness_t3_ete"],
    texte: "Saison creuse. Le plateau est vide",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1,
    pourquoi: "le trimestre de l'été est le plus bas de l'année, et chacun de ses mois sous un mois ordinaire",
  },
  {
    ou: ["fitness_t3_ete"],
    texte: "Comment traverser une saison où la demande s'effondre",
    vrai: (l) => l.trimestreLePlusBas() && l.trimestre() <= 0.5,
    pourquoi: "la saison creuse fait la moitié d'une saison ordinaire, ou moins",
  },
  {
    ou: ["fitness_t3_ete"],
    texte: "La demande chute en saison creuse.",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1,
    pourquoi: "le mois est sous un mois ordinaire, dans le trimestre le plus bas",
  },
  {
    ou: ["fitness_t3_ete"],
    texte: "Les inscrits des bonnes résolutions tombent à",
    vrai: (l) => l.mois("resolutions") < 1 && l.mois("reguliers") > l.mois("resolutions"),
    pourquoi: "les inscrits des résolutions sont sous leur niveau, les réguliers au-dessus d'eux (« restent »)",
  },
  // NOVA et sa gamme.
  {
    ou: ["nova_t3_capacity", "novag_t3_facteur_rare"],
    texte: "avant le pic à venir",
    vrai: (l) => moisLePlusHaut(l.calendrier(), Math.floor(l.absolu / 12)) > l.absolu,
    pourquoi: "le plus haut mois de l'année est encore devant",
  },
  {
    ou: ["nova_t4_paradox"],
    texte: "La haute saison s'ouvre et la grosse commande CampusTech gonfle votre chiffre d'affaires",
    vrai: (l) => l.trimestreLePlusHaut() && l.premierMoisDuTrimestre && l.mois("campustech") > 1,
    pourquoi: "le premier mois du plus haut trimestre, CampusTech au-dessus de son niveau ordinaire",
  },
  {
    ou: ["novag_t4_paradoxe"],
    texte: "La haute saison s'ouvre : CampusTech a passé sa grosse commande de One, et la grande distribution remplit ses rayons de Go.",
    vrai: (l) => l.trimestreLePlusHaut() && l.premierMoisDuTrimestre && l.mois("campustech") > 1 && l.mois("gms") > 1,
    pourquoi: "le premier mois du plus haut trimestre ; CampusTech et la grande distribution au-dessus de leur niveau ordinaire",
  },
  {
    ou: ["novag7_home_en_rayon"],
    texte: "Et la haute saison s'ouvre",
    vrai: (l) => l.trimestreLePlusHaut() && l.premierMoisDuTrimestre,
    pourquoi: "le premier mois du plus haut trimestre",
  },
  {
    ou: ["novag7_home_en_rayon"],
    texte: "Faut-il la pousser en haute saison",
    vrai: (l) => l.trimestreLePlusHaut(),
    pourquoi: "le plus haut trimestre",
  },
  {
    ou: ["nova_inv_retournement"],
    texte: "au sortir du pic",
    vrai: (l) => moisLePlusHaut(l.calendrier(), Math.floor((l.absolu - 1) / 12)) === l.absolu - 1,
    pourquoi: "le mois d'avant est le plus haut de son année",
  },
  {
    ou: ["nova_t5_returns", "novag_t5_matieres"],
    texte: "Le contrecoup saisonnier tasse les ventes",
    vrai: (l) => l.mois() < l.calendrier()[l.absolu - 1]! && l.mois() < 1,
    pourquoi: "le mois retombe sous le précédent, et sous un mois ordinaire",
  },
  // MARTEL & FILS, janvier de la deuxième année.
  {
    ou: ["batiment_t5_sous_traiter"],
    texte: "Le carnet de la saison qui s'ouvre déborde",
    vrai: (l) => l.premierMoisDuTrimestre && l.trimestre() > 1,
    pourquoi: "le premier mois d'un trimestre au-dessus d'un trimestre ordinaire",
  },
  // L'ESCALE et sa gamme, juillet à septembre.
  {
    ou: ["hotel_t3_saison", "hotelg_t3_saison"],
    texte: "La haute saison est là : le tourisme de loisirs bondit",
    vrai: (l) => l.trimestreLePlusHaut() && l.mois() > 1 && l.mois("loisirs") > 1.5,
    pourquoi: "le plus haut trimestre, le mois au-dessus d'un mois ordinaire, les loisirs à plus d'une fois et demie",
  },
  {
    ou: ["hotel_t3_saison", "hotelg_t3_saison"],
    texte: "la clientèle affaires recule et les séminaires se font rares",
    vrai: (l) => l.mois("affaires") < 1 && l.mois("groupes") < 0.5,
    pourquoi: "les affaires sous leur niveau ordinaire, les séminaires sous la moitié",
  },
  {
    ou: ["hotelg_t3_saison"],
    texte: "les escapades remplissent les supérieures",
    vrai: (l) => l.mois("escapades") > 1,
    pourquoi: "les escapades au-dessus de leur niveau ordinaire",
  },
  {
    ou: ["hotelg_t3_saison"],
    texte: "Les grandes occasions, elles, font leur saison sur les suites.",
    vrai: (l) => l.mois("occasions") > 1,
    pourquoi: "les grandes occasions au-dessus de leur niveau ordinaire",
  },
  {
    ou: ["hotel_t3_saison", "hotelg_t3_saison"],
    texte: "En haute saison, la clientèle loisirs (élasticité −1,75) domine au lieu des affaires",
    vrai: (l) => l.demande("loisirs") > l.demande("affaires"),
    pourquoi: "les loisirs demandent plus de nuitées que les affaires ce mois-ci",
  },
  {
    ou: ["hotel_t3_saison"],
    texte: "les affaires tombent à",
    vrai: (l) => l.mois("affaires") < 1 && l.mois("groupes") < 1 && l.mois("loisirs") > 1,
    pourquoi: "affaires et séminaires sous leur niveau ordinaire, le tourisme au-dessus (« grimpe »)",
  },
  {
    ou: ["hotelg_t3_saison"],
    texte: "les affaires tombent à",
    vrai: (l) => l.mois("affaires") < 1 && l.mois("loisirs") > 1 && l.mois("occasions") > 1,
    pourquoi: "les affaires sous leur niveau ordinaire, loisirs et grandes occasions au-dessus (« grimpent »)",
  },
  {
    ou: ["hotel_t3_saison", "hotelg_t3_saison"],
    texte: "Décider en pleine saison pour la saison, c'est décider trop tard.",
    vrai: (l) => l.trimestreLePlusHaut(),
    pourquoi: "le plus haut trimestre",
  },
  // LA TABLE D'AUGUSTIN et sa gamme : les denrées en juillet à septembre, les banquets d'octobre à décembre.
  {
    ou: ["bistrot_t3_matieres", "bistrotg_t3_matieres"],
    texte: "Vous êtes en saison creuse : la salle se clairsème",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1 && l.mois("midi_affaires") < 1,
    pourquoi: "le plus bas trimestre, le mois et le midi d'affaires sous leur niveau ordinaire",
  },
  {
    ou: ["bistrotg_t3_matieres"],
    texte: "les banquets attendent leur saison",
    vrai: (l) => l.trimestreLePlusHaut("banquets", 1) && l.trimestreLePlusHaut("groupes", 1),
    pourquoi: "le trimestre qui suit est le plus haut des banquets",
  },
  {
    ou: ["bistrot_t3_matieres", "bistrotg_t3_matieres"],
    texte: "La saison creuse amplifie tout : les déjeuners d'affaires tombent à",
    vrai: (l) => l.trimestreLePlusBas() && l.mois("midi_affaires") < 1 && l.mois("groupes") < 1,
    pourquoi: "le plus bas trimestre ; midi d'affaires et banquets sous leur niveau ordinaire",
  },
  {
    ou: ["bistrotg_t3_matieres"],
    texte: "elle creuse au moins autant que les déjeuners d'affaires",
    vrai: (l) =>
      l.mois("entreprises_traiteur") <= l.mois("midi_affaires") && l.mois("collectivites_traiteur") <= l.mois("midi_affaires"),
    pourquoi: "les deux clientèles du traiteur tombent au moins aussi bas que le midi d'affaires",
  },
  {
    ou: ["bistrot_t3_matieres", "bistrotg_t3_matieres"],
    texte: "en saison creuse, c'est hors d'atteinte.",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1,
    pourquoi: "le plus bas trimestre, le mois sous un mois ordinaire",
  },
  {
    ou: ["bistrot_t3_matieres", "bistrotg_t3_matieres"],
    texte: "En saison creuse, la demande chute",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1,
    pourquoi: "le plus bas trimestre, le mois sous un mois ordinaire",
  },
  {
    ou: ["bistrot_t4_banquets", "bistrotg_t4_banquets"],
    texte: "La saison des banquets est là : les repas d'entreprise et les banquets y dépensent plus qu'en aucune autre saison",
    vrai: (l) => l.trimestreLePlusHaut("groupes") && l.trimestreLePlusHaut() && l.mois("groupes") > 1,
    pourquoi: "le plus haut trimestre du bistrot et des banquets, les banquets au-dessus de leur niveau ce mois-ci",
  },
  {
    ou: ["bistrot_t4_banquets", "bistrotg_t4_banquets"],
    texte: "La demande de la saison des banquets bondit",
    vrai: (l) => l.trimestreLePlusHaut() && l.mois() > 1,
    pourquoi: "le plus haut trimestre, le mois au-dessus d'un mois ordinaire",
  },
  {
    ou: ["bistrot_t4_banquets"],
    texte: "Les banquets grimpent à",
    vrai: (l) => l.mois("groupes") > l.mois() && l.mois() > 1,
    pourquoi: "les banquets au-dessus du global, lui-même au-dessus d'un mois ordinaire (« déjà à »)",
  },
  {
    ou: ["bistrotg_t4_banquets"],
    texte: "la carte du soir monte aussi, la formule du midi à peine",
    vrai: (l) => l.mois("groupes") > l.mois("carte-soir") && l.mois("carte-soir") > l.mois("formule-midi") && l.mois("formule-midi") >= 1,
    pourquoi: "les banquets plus haut que le soir, le soir plus haut que le midi, le midi à peine au-dessus de son niveau",
  },
  // ATLAS CONSEIL et sa gamme, juillet à septembre.
  {
    ou: ["conseil_t3_banc", "conseilg_t3_banc"],
    texte: "La saison creuse : les décideurs lèvent le pied, les marchés publics ne se notifient plus",
    vrai: (l) => l.trimestreLePlusBas() && l.mois() < 1 && l.mois("public") < 1,
    pourquoi: "le plus bas trimestre ; le mois et les marchés publics sous leur niveau ordinaire",
  },
  {
    ou: ["conseilg_t3_banc"],
    texte: "la stratégie et l'audit tournent au ralenti",
    vrai: (l) => l.mois("transformation") < 1 && l.mois("audit") < 1,
    pourquoi: "stratégie et audit sous leur niveau ordinaire",
  },
  {
    ou: ["conseilg_t3_banc"],
    texte: "La saison creuse est aussi le moment où une offre cyber-sécurité, que les DSI continuent d'acheter",
    vrai: (l) => l.trimestreLePlusBas() && l.mois("dsi") > l.mois("public"),
    pourquoi: "le plus bas trimestre ; les DSI achètent plus que le public",
  },
  // PIXEL & CO et MAILLE & CO, octobre à décembre ; la maille aussi en juillet à septembre et en janvier.
  {
    ou: ["ecom_t4_pic", "ecomg_t4_pic", "boutique_t4_noel", "bmono_t4_noel"],
    texte: "La saison qui fait l'année",
    vrai: (l) => l.trimestreLePlusHaut(),
    pourquoi: "le plus haut trimestre du marché",
  },
  {
    ou: ["ecom_t4_pic", "ecomg_t4_pic"],
    texte: "Cette saison pèse plus d'une fois et demie une saison ordinaire",
    vrai: (l) => l.trimestre() > 1.5,
    pourquoi: "le trimestre au-dessus d'une fois et demie",
  },
  {
    ou: ["ecomg_t4_pic"],
    texte: "et les luminaires s'y vendent presque le double",
    vrai: (l) => l.trimestre("luminaires") >= 1.7 && l.trimestre("luminaires") < 2,
    pourquoi: "les luminaires entre 1,7 et 2 sur le trimestre",
  },
  {
    ou: ["boutique_t4_noel"],
    texte: "C'est la saison qui fait la maille : les pulls y partent une fois et demie plus vite, les écharpes et les bonnets plus de deux fois",
    vrai: (l) =>
      Math.abs(l.trimestre("pull-col-rond") - 1.5) < 0.05 && l.trimestre("echarpe") > 2 && l.trimestre("bonnet") > 2,
    pourquoi: "sur le trimestre, le pull à une fois et demie, écharpes et bonnets au-dessus du double",
  },
  {
    ou: ["boutique_t4_noel"],
    texte: "et les comités d'entreprise passent leurs dotations",
    vrai: (l) => l.trimestreLePlusHaut("pull_ce"),
    pourquoi: "le plus haut trimestre des comités d'entreprise",
  },
  {
    ou: ["bmono_t4_noel"],
    texte: "Cette saison pèse près d'une fois et demie une saison ordinaire, et les comités d'entreprise y passent leurs plus grosses commandes.",
    vrai: (l) => l.trimestre() >= 1.4 && l.trimestre() <= 1.5 && l.trimestreLePlusHaut("entreprises"),
    pourquoi: "le trimestre entre 1,4 et 1,5, le plus haut des comités d'entreprise",
  },
  {
    ou: ["boutique_t4_noel"],
    texte: "les accessoires davantage",
    vrai: (l) => l.mois("echarpe") > l.mois("pull-col-rond") && l.mois("bonnet") > l.mois("pull-col-rond"),
    pourquoi: "écharpes et bonnets au-dessus du pull ce mois-ci",
  },
  {
    ou: ["boutique_t4_noel"],
    texte: "les comités d'entreprise concentrent l'essentiel de leur budget sur cette saison",
    vrai: (l) => l.trimestreLePlusHaut("pull_ce") && l.partDeLAnnee("pull_ce") > 0.4,
    pourquoi: "le plus haut trimestre des comités d'entreprise, plus de deux cinquièmes de leur année",
  },
  {
    ou: ["bmono_t4_noel"],
    texte: "les comités d'entreprise concentrent l'essentiel de leur budget sur cette saison",
    vrai: (l) => l.trimestreLePlusHaut("entreprises") && l.partDeLAnnee("entreprises") > 0.4,
    pourquoi: "le plus haut trimestre des comités d'entreprise, plus de deux cinquièmes de leur année",
  },
  {
    ou: ["boutique_t5_coton", "bmono_t5_coton"],
    texte: "La saison forte vient de vider votre trésorerie",
    vrai: (l) => l.trimestreLePlusHaut(undefined, -1) && l.premierMoisDuTrimestre,
    pourquoi: "le trimestre qui vient de se clore est le plus haut",
  },
  {
    ou: ["boutique_t3_soldes"],
    texte: "qui se vendent plus du double dans la saison forte qui suit",
    vrai: (l) => l.trimestreLePlusHaut(undefined, 1) && l.trimestre("echarpe", 1) > 2 && l.trimestre("bonnet", 1) > 2,
    pourquoi: "le trimestre suivant est le plus haut, écharpes et bonnets au-dessus du double",
  },
  {
    ou: ["bmono_t3_soldes"],
    texte: "celle de la saison forte qui suit",
    vrai: (l) => l.trimestreLePlusHaut(undefined, 1),
    pourquoi: "le trimestre suivant est le plus haut",
  },
];

/**
 * LES MOTS QUI DISENT UN COEFFICIENT (« une fois et demie », « le double », « de moitié ») : au
 * mois, chacun est une affirmation vérifiée ci-dessus, ou une exception nommée ici, qui ne
 * parle pas de la saison.
 */
const MOTS_DE_COEFFICIENT = /(?<!\p{L})(?:une fois et demie|deux fois|du double|le double|de moitié|moitié moins)(?!\p{L})/giu;
const PAS_UNE_SAISON: Record<string, string> = {
  "nova_t5_returns : deux fois": "deux fois moins de capitaux engagés : une taille de bilan",
  "novag_t5_matieres : deux fois": "deux fois moins de capitaux engagés : une taille de bilan",
  "bistrot_t6_valeur : deux fois": "deux fois plus de capitaux : une taille de bilan",
  "bistrotg_t6_valeur : deux fois": "deux fois plus de capitaux : une taille de bilan",
  "bistrot_t6_valeur : moitié moins": "le voisin et ses capitaux : une taille de bilan",
  "bistrotg_t6_valeur : moitié moins": "le voisin et ses capitaux : une taille de bilan",
  "boutique_t3_soldes : du double": "vérifiée par l'affirmation de la saison forte qui suit",
  "hotel_t1_reprise : deux fois": "une nuit ne se vend pas deux fois : la capacité qui expire",
  "hotelg_t1_reprise : deux fois": "une nuit ne se vend pas deux fois : la capacité qui expire",
  "bistrot_t4_banquets : deux fois": "sur-préparer coûte deux fois : les denrées et la marge",
  "bistrotg_t4_banquets : deux fois": "sur-préparer coûte deux fois : les denrées et la marge",
  "bistrot_t5_terrasse : deux fois": "compter l'amortissement en plus paierait la verrière deux fois",
  "bistrotg_t5_terrasse : deux fois": "compter l'amortissement en plus paierait la verrière deux fois",
};

for (const def of SCENARIOS) {
  describe(`${def.code} au mois, sur le calendrier`, () => {
    for (const level of niveaux(def.code)) {
      const lesParties = parties(def, level);
      const janvier = jeu(def.scenario, 1, 18, level);

      it(`niveau ${level} : chaque rang et chaque coefficient cité est celui de la partie, pour chaque mois de départ`, () => {
        const ecrits = coefficientsEcrits(def.scenario);
        const fautes: string[] = [];
        for (const p of lesParties) {
          for (const o of p.ouverts) {
            const duTour = coefficientsDuTour(p.s, o.tour);
            for (const t of o.textes) {
              for (const f of rangsFaux(o.ou, t, o.tour, p.mois, p.s)) fautes.push(`${ici(p, o)} : rang ${f} dans « ${t} »`);
              for (const { nombre, valeur } of coefficientsCites(t)) {
                if (PAS_UN_COEFFICIENT[`${o.ou} : ${nombre}`]) continue;
                if (duTour.has(valeur)) continue;
                const origine = ecrits.has(valeur) ? " (un coefficient du trimestre)" : "";
                fautes.push(`${ici(p, o)} : coefficient « ${nombre} »${origine} absent de la partie dans « ${t} »`);
              }
            }
          }
        }
        expect([...new Set(fautes)]).toEqual([]);
      });

      it(`niveau ${level} : ce que le récit affirme de la saison du moment est vrai, pour chaque mois de départ`, () => {
        const fautes: string[] = [];
        for (const p of lesParties) {
          for (let mois = 0; mois < p.mois; mois++) {
            // La partie et le calendrier depuis janvier jouent la même saison, mois pour mois.
            expect(p.s.market.seasonality[mois], `${def.code}, départ ${p.moisDeDepart}`).toBe(
              janvier.market.seasonality[p.moisDeDepart - 1 + mois] ?? p.s.market.seasonality[mois],
            );
          }
          for (const o of p.ouverts) {
            const tout = o.textes.join("\n");
            for (const a of AFFIRMATIONS.filter((x) => x.ou.includes(o.ou))) {
              if (!tout.includes(a.texte)) fautes.push(`${ici(p, o)} : « ${a.texte} » absent`);
              else if (!a.vrai(lecture(p, o, janvier))) fautes.push(`${ici(p, o)} : « ${a.texte} » est faux (${a.pourquoi})`);
            }
            for (const t of o.textes) {
              for (const m of t.matchAll(MOTS_DE_COEFFICIENT)) {
                const mot = m[0].toLowerCase();
                const couvert = AFFIRMATIONS.some((a) => a.ou.includes(o.ou) && a.texte.toLowerCase().includes(mot) && t.includes(a.texte));
                if (!couvert && !PAS_UNE_SAISON[`${o.ou} : ${mot}`]) fautes.push(`${ici(p, o)} : « ${mot} » sans affirmation dans « ${t} »`);
              }
            }
          }
        }
        expect([...new Set(fautes)]).toEqual([]);
      });

      it(`niveau ${level} : au calendrier, seuls les coefficients changent ; les mots sont ceux du mois`, () => {
        const sansNombres = (t: string) => t.replace(/\d+(?:,\d+)?/g, "#");
        for (const p of lesParties) {
          for (const o of p.ouverts) expect(o.textes.map(sansNombres), ici(p, o)).toEqual(o.sansCalendrier.map(sansNombres));
        }
      });
    }

    it("chaque affirmation de ce scénario se lit dans au moins une partie", () => {
      const ouverts = niveaux(def.code).flatMap((level) => parties(def, level).flatMap((p) => p.ouverts));
      for (const a of AFFIRMATIONS.filter((x) => x.ou.some((ou) => def.situations.some((s) => s.code === ou)))) {
        const lu = ouverts.some((o) => a.ou.includes(o.ou) && o.textes.join("\n").includes(a.texte));
        expect(lu, `${a.ou.join(", ")} : « ${a.texte} »`).toBe(true);
      }
    });
  });
}

describe("la garde voit ce qu'elle doit voir", () => {
  it("un coefficient dans un calcul, une élasticité ou une durée n'en est pas un", () => {
    expect(coefficientsCites("10 × 152 ÷ 0,5 = 3 040 couverts, à 0,5 h par couvert")).toEqual([]);
    expect(coefficientsCites("élasticité −1,75, (−0,7), 21,24 × 2,5 = 53,10 €, 2,5 % de commission")).toEqual([]);
    expect(coefficientsCites("Taux d'intérêt ×0,6 pendant 2 tours")).toEqual([]);
    expect(coefficientsCites("Les banquets grimpent à 1,85 fois leur niveau, ventes du tour précédent × 1,45")).toEqual([
      { nombre: "1,85", valeur: 1.85 },
      { nombre: "1,45", valeur: 1.45 },
    ]);
  });
  it("un rang de mois se lit en lettres comme en chiffres", () => {
    const s = SCENARIOS[0]!.scenario;
    expect(rangsFaux("x", "quel coefficient s'applique au quatrième mois ?", 10, 12, s)).toHaveLength(1);
    expect(rangsFaux("x", "un objectif chiffré au premier mois", 1, 12, s)).toEqual([]);
    expect(rangsFaux("x", "Dernier tour : votre conseil attend", 12, 12, s)).toEqual([]);
    expect(rangsFaux("x", "le pic du tour 4 dépassera vos unités", 7, 12, s)).toHaveLength(1);
  });
});
