/**
 * LA BRIGADE À BOUT — le modèle de la cuisine de La Table d'Augustin de Chambéry.
 *
 * Neuf personnes en cuisine, un trimestre d'octobre à décembre qui monte vers
 * les fêtes, six décisions. En cuisine, le travail n'arrive pas à plat : il
 * arrive en pics, à heure fixe, et c'est le coup de feu du samedi soir qui fait
 * ou défait la semaine. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · L'ORGANISATION USE PLUS QUE LE VOLUME. Les services coupés (10 h-15 h
 *     puis 18 h 30-23 h 30) et un planning connu la veille usent la brigade
 *     davantage que les heures elles-mêmes. L'usure revient en absences, qui
 *     tombent de préférence le samedi, et en départs.
 *   · LE PIC MAL DIMENSIONNÉ CONCENTRE LES DÉGÂTS. Au-delà de dix-huit
 *     couverts par cuisinier au coup de feu du samedi (20 h-21 h 30), les
 *     retours d'assiettes montent en flèche, le service finit tard (heures
 *     supplémentaires) et les avis font baisser la fréquentation des semaines
 *     suivantes. Un repas de groupe le samedi soir prend la place de clients à
 *     la carte (la salle est déjà pleine) et charge le pic d'un bloc.
 *   · LA POLYVALENCE COÛTE AVANT DE PAYER. Former deux commis à un second
 *     poste prend des heures de doublure en novembre ; en décembre, une absence
 *     ne fait plus tomber un poste, et le passe se rééquilibre pendant le coup
 *     de feu.
 *   · LE SECOND PEUT PARTIR. Sa démission, tirée au hasard en fin de semaine 7,
 *     dépend de l'usure de la brigade et du planning de décembre qu'il voit
 *     venir (les samedis de groupe, le renfort prévu) ; s'il part, il manque
 *     aux fêtes. C'est ce qui oppose espérance et robustesse en semaine 4 :
 *     former deux commis rapporte le plus en moyenne, recruter un saisonnier
 *     coûte plus mais protège le mieux du départ du second.
 *
 * Les deux pics du trimestre : le samedi soir toute l'année, et décembre
 * (repas d'entreprise des semaines 9 à 11, soirs de fêtes des semaines 11 à
 * 13 : le samedi 19, le réveillon, la Saint-Sylvestre), après un novembre
 * creux où l'on peut former.
 *
 * Le trimestre est jugé en euros : la marge du restaurant, chiffre d'affaires
 * moins le coût matière et le coût de la brigade (salaires, heures
 * supplémentaires, extras, recrutement), moins ce que coûtent les assiettes
 * retournées. Organiser le travail autour des pics n'y est pas une vertu,
 * c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const BRIGADE = 9;
/** Les personnes dont l'absence compte : toute la brigade sauf le chef. */
export const EQUIPIERS = 8;
/** Les cuisiniers qui envoient au coup de feu du samedi, aujourd'hui : le second, deux chefs de partie, un commis. */
export const AU_PASSE = 4;
/** Les couverts d'un service, en octobre. */
export const COUVERTS = { midi: 64, soir: 58, samedi: 120 } as const;
/** Midis du mardi au samedi, soirs du mardi au vendredi ; le samedi soir à part. */
export const SERVICES = { midi: 5, soir: 4 } as const;
/** Deux rotations dans une salle de 85 places. */
export const SALLE_SAMEDI = 128;
/** La part des couverts du samedi soir envoyés entre 20 h et 21 h 30. */
export const PART_COUP_DE_FEU = 0.75;
/** Au-delà, les retours d'assiettes montent en flèche. */
export const SEUIL_PIC = 18;
/** Le ticket moyen hors taxes, par service. */
export const TICKET = { midi: 27, soir: 41, samedi: 44, groupe: 49 } as const;
export const RATIO_MATIERE = 0.3;
/** Le ratio matière d'un menu de groupe unique, fixé à l'avance. */
export const RATIO_MENU_GROUPE = 0.27;
/** Les salaires chargés de la brigade, par semaine, contrats de 39 heures. */
export const MASSE_SALARIALE = 6600;
/** Une heure supplémentaire, chargée, majorée de 20 % ou 50 % selon la tranche. */
export const HEURE_SUP = 29;
/** Un extra en cuisine pour une journée de service, chargé. */
export const EXTRA = 230;
/** Un chef de partie en extra, la journée. */
export const CHEF_EXTRA = 290;
/** Les heures supplémentaires de la brigade, par semaine, en septembre. */
export const HEURES_SUP_DEPART = 62;
/** Quarante-huit heures par semaine au plus, pour huit personnes : 72 heures supplémentaires. */
export const HEURES_SUP_MAX = 72;
/** Une heure d'extra, quand la brigade a atteint le plafond légal. */
export const HEURE_EXTRA = 32;
/** Une assiette retournée : le plat refait, le geste commercial, le client qui ne revient pas. */
export const COUT_RETOUR = 38;
export const USURE_DEPART = 0.55;
/** La marge que le groupe attend du restaurant sur le trimestre. */
export const BUDGET = 100000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, c'est un samedi de plus mal tenu. */
export const PERTE_PAR_JOUR = 900;
/** Les repas d'entreprise de décembre : quatorze demandes, de vingt-huit couverts en moyenne. */
export const GROUPE = { couverts: 28, semaine: 9, samedi: 5 } as const;
/** Ce que coûte le départ du second : cabinet et annonce. */
export const RECRUTEMENT_SECOND = 3500;
/** S'il démissionne en semaine 8, le second solde ses congés : il manque à partir de la semaine 10. */
export const SECOND_ABSENT = 10;
export const SAISONNIER = { semaine: 850, recrutement: 800 } as const;
/** Les soirs de fêtes (semaines 11 à 13) : les demandes de réservation. */
export const DEMANDE_FETES = 160;
/** La fréquentation, semaine par semaine : novembre creux, décembre qui monte. */
export const SAISON = [
  0, 1, 1, 0.98, 0.97, 0.93, 0.91, 0.93, 0.96, 1.03, 1.06, 1.08, 1.12, 1.06,
] as const;
/**
 * Ce que le renfort de décembre change au risque que le second parte : un saisonnier sur le
 * planning le rassure, des commis polyvalents un peu, rien du tout l'inquiète.
 */
export const RENFORT_DECEMBRE = [0, 0.03, -0.15, 0.08] as const;
/** Les repas de groupe demandés, semaines 9 à 11 : en semaine, et le samedi soir. */
export const GROUPES_SEMAINE = { 9: 3, 10: 3, 11: 3 } as Readonly<Record<number, number>>;
export const GROUPES_SAMEDI = { 9: 2, 10: 2, 11: 1 } as Readonly<Record<number, number>>;

/** Le chiffre que la prévision demande : couverts du coup de feu par cuisinier au passe. */
export const COUP_DE_FEU_DEPART = (COUVERTS.samedi * PART_COUP_DE_FEU) / AU_PASSE;

/** Les couverts d'une semaine d'octobre, groupes à part. */
export const COUVERTS_SEMAINE =
  COUVERTS.midi * SERVICES.midi + COUVERTS.soir * SERVICES.soir + COUVERTS.samedi;
/** Le chiffre d'affaires à la carte d'une semaine d'octobre, hors taxes. */
export const CA_SEMAINE =
  COUVERTS.midi * SERVICES.midi * TICKET.midi +
  COUVERTS.soir * SERVICES.soir * TICKET.soir +
  COUVERTS.samedi * TICKET.samedi;
/** Ce que coûte de plus, chaque semaine, la matière du laboratoire de Seynod : 1,6 point de ratio. */
export const SURCOUT_LABO = 0.016;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  planning: 0,
  miseEnPlace: 1,
  polyvalence: 2,
  groupes: 3,
  carte: 4,
  fetes: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 2, 2] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: {
    demande?: number;
    capacite?: number;
    /** Jours d'absence en plus, par semaine. */
    absences?: number;
    heuresSup?: number;
    /** Une perte ponctuelle, en euros. */
    perte?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chambreFroide",
    titre: "Panne de la chambre froide",
    de: "Lubin Haenni",
    role: "Second de cuisine",
    texte:
      "La chambre froide positive est tombée en panne dans la nuit : 1 600 € de marchandise jetée, et une semaine à travailler avec deux armoires de dépannage.",
    duree: 1,
    effet: { capacite: 0.95, perte: 1600 },
  },
  {
    id: "plonge",
    titre: "Panne du lave-vaisselle",
    de: "Siaka Bamba",
    role: "Plongeur",
    texte:
      "Le lave-vaisselle à capot est en panne jusqu'au passage du technicien : toute la vaisselle à la main pendant une semaine.",
    duree: 1,
    effet: { capacite: 0.95, heuresSup: 15 },
  },
  {
    id: "gastro",
    titre: "Gastro-entérite dans la brigade",
    de: "Marwa Selmi",
    role: "Ressources humaines, siège",
    texte:
      "Une gastro-entérite traverse la brigade : trois jours d'arrêt de plus par semaine pendant deux semaines.",
    duree: 2,
    effet: { absences: 3 },
  },
  {
    id: "congres",
    titre: "Un congrès en ville",
    de: "Gwladys Cottarel",
    role: "Directrice de salle",
    texte:
      "Un congrès de 1 500 médecins se tient à Chambéry cette semaine : la salle est pleine midi et soir.",
    duree: 1,
    effet: { demande: 1.15 },
  },
  {
    id: "neige",
    titre: "Premières neiges",
    de: "Gwladys Cottarel",
    role: "Directrice de salle",
    texte:
      "Les premières neiges bloquent les routes de Maurienne et de Tarentaise : beaucoup d'annulations cette semaine.",
    duree: 1,
    effet: { demande: 0.85 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  absence: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Lubin démissionne-t-il ? Lu en fin de semaine 7. */
  uSecond: number;
  /** Les entreprises acceptent-elles de déplacer leur repas du samedi ? */
  uDeplacement: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000537 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.12, Math.max(0.88, 1 + 0.04 * gauss(r))),
      absence: Math.min(1.8, Math.max(0.4, 1 + 0.3 * gauss(r))),
    });
  }
  const uSecond = r();
  const uDeplacement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uSecond, uDeplacement, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux, trois des cinq entreprises du samedi acceptent un autre soir ; sinon, une seule. */
export const CHANCE_DEPLACEMENT = 0.5;
export const groupesDeplaces = (graine: number) =>
  hasard(graine).uDeplacement < CHANCE_DEPLACEMENT ? 3 : 1;

/** Les retours d'assiettes, en part des couverts, selon la charge du coup de feu. */
export const tauxDeRetour = (charge: number) =>
  Math.min(0.1, 0.012 + 0.0035 * Math.max(0, charge - 16) ** 1.5);

/** Le taux d'absence par jour de travail, selon l'usure de la brigade. */
export const tauxDAbsence = (usure: number) => 0.02 + 0.08 * usure;

/**
 * LUBIN PART-IL ?
 *
 * Le second encaisse tout : les trous du planning, les samedis qui finissent à
 * une heure du matin. Il décide en fin de semaine 7, quand il voit l'usure de
 * la brigade et le planning de décembre ; chaque samedi de groupe qu'il voit
 * venir pèse. Ce qui est prévu pour décembre compte aussi : un saisonnier sur
 * le planning le rassure, des commis polyvalents l'allègent, rien du tout
 * l'inquiète (voir `RENFORT_DECEMBRE`).
 */
export const risqueDeDepart = (usure: number, samedisDeGroupe: number, renfort: number) =>
  Math.min(
    0.85,
    Math.max(
      0.02,
      0.12 + 1.2 * Math.max(0, usure - 0.35) + 0.05 * samedisDeGroupe + RENFORT_DECEMBRE[renfort]!,
    ),
  );

/** Les repas de groupe de décembre, selon la réponse choisie. */
export function groupes(
  choix: number,
  graine: number,
): {
  semaine: Readonly<Record<number, number>>;
  samedi: Readonly<Record<number, number>>;
  menuUnique: boolean;
  extras: boolean;
} {
  if (choix === 0 || choix === 2) {
    return {
      semaine: GROUPES_SEMAINE,
      samedi: GROUPES_SAMEDI,
      menuUnique: choix === 2,
      extras: choix === 2,
    };
  }
  if (choix === 1) {
    const deplaces = groupesDeplaces(graine);
    const semaine =
      deplaces === 3 ? { 9: 4, 10: 4, 11: 4 } : ({ 9: 3, 10: 4, 11: 3 } as Record<number, number>);
    return { semaine, samedi: {}, menuUnique: true, extras: false };
  }
  // Au fil de l'eau : la moitié des entreprises réservent ailleurs, faute de réponse.
  return {
    semaine: { 9: 2, 10: 2, 11: 1 },
    samedi: { 9: 1, 10: 1, 11: 1 },
    menuUnique: false,
    extras: false,
  };
}

export type Semaine = {
  /** Couverts par cuisinier au coup de feu du samedi soir. */
  chargePic: number;
  heuresSup: number;
  /** Jours d'absence de la semaine. */
  absences: number;
  /** Part des assiettes retournées. */
  retours: number;
  couverts: number;
  ca: number;
  /** La marge de la semaine : chiffre d'affaires moins matière, brigade, extras et retours. */
  marge: number;
  /** La marge depuis le début du trimestre. */
  margeCumulee: number;
  usure: number;
  /** La fréquentation, rapportée à ce qu'elle serait sans les avis du samedi. */
  reputation: number;
  extras: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge du restaurant sur le trimestre, coût de la brigade et retours compris. */
  objectif: number;
  marge: number;
  ca: number;
  heuresSup: number;
  extras: number;
  retoursMoyens: number;
  chargeSamediMoyenne: number;
  secondPart: boolean;
  risqueSecond: number;
  groupesAcceptes: number;
  groupesSamedi: number;
  deplaces: number;
  usureFinale: number;
  /** Le chiffre que la prévision de la semaine 1 demande. */
  coupDeFeuDepart: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const g = groupes(d4 ?? NEUTRE[D.groupes], graine);
  const samedisAnnonces = Object.values(g.samedi).reduce((s, x) => s + x, 0);
  const semaines: (Semaine | null)[] = [null];
  let usure = USURE_DEPART;
  let reputation = 1;
  let margeCumulee = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let secondPart = false;
  let risqueSecond = 0;
  let totalHS = 0;
  let totalExtras = 0;
  let totalCA = 0;
  let sommeRetours = 0;
  let sommeCharge = 0;
  let groupesAcceptes = 0;
  let groupesSamedi = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let marge = w === 1 ? margeCumulee : 0;
    const planningStable = d1 === 1 && w >= 2;
    const decembre = w >= 9;
    const fetes = w >= 11;
    const polyvalents = d3 === 0 && decembre;
    const saisonnier = d3 === 2 && w >= 8;
    const secondAbsent = secondPart && w >= SECOND_ABSENT;

    // La demande : la saison, les avis des samedis précédents, les imprévus.
    let demande = SAISON[w]! * n.demande * reputation;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;
    const midi = COUVERTS.midi * SERVICES.midi * demande;
    const soir = COUVERTS.soir * SERVICES.soir * demande;
    const gSemaine = g.semaine[w] ?? 0;
    const gSamedi = g.samedi[w] ?? 0;
    groupesAcceptes += gSemaine + gSamedi;
    groupesSamedi += gSamedi;
    const couvertsGroupes = (gSemaine + gSamedi) * GROUPE.couverts;

    // Le samedi soir : la salle a deux rotations ; un groupe y prend la place de clients à la carte.
    let salle = SALLE_SAMEDI;
    let demandeSamedi = COUVERTS.samedi * demande;
    if (fetes) {
      demandeSamedi = DEMANDE_FETES * n.demande * reputation;
      if (d6 === 0) salle = 150;
      if (d6 === 1) salle = 150;
      if (d6 === 3) salle = 144;
    }
    const carteSamedi = Math.min(demandeSamedi, salle - gSamedi * GROUPE.couverts);
    const poidsGroupe = g.menuUnique ? 0.5 : 1;
    const deuxServices = fetes && d6 === 1;
    const pointe =
      (deuxServices ? 0.65 * carteSamedi : PART_COUP_DE_FEU * carteSamedi) +
      gSamedi * GROUPE.couverts * poidsGroupe;

    // Les absences : l'usure, l'hiver, les imprévus.
    let absences = EQUIPIERS * 5 * tauxDAbsence(usure) * n.absence * (decembre ? 1.3 : 1);
    for (const a of actifs) absences += a.imprevu.effet.absences ?? 0;
    // Les absences tombent de préférence le samedi, quand on est à bout.
    const absentsAuPasse = (AU_PASSE * absences * (1 + 0.5 * usure)) / (EQUIPIERS * 5);
    const remplacement = polyvalents
      ? 0.85
      : saisonnier && decembre
        ? 0.75
        : d3 === 1 && decembre
          ? 0.65
          : 0.45;

    // Qui envoie au coup de feu du samedi.
    let passe = AU_PASSE;
    if (w >= 2) passe += d1 === 1 ? 1 : d1 === 2 ? 0.75 : d1 === 0 ? 0.3 : 0;
    if (d3 === 1 && decembre) passe += 0.75;
    if (d3 === 2) passe += w === 8 ? 0.6 : decembre ? 1 : 0;
    if (g.extras && gSamedi > 0) passe += 0.75;
    if (d6 === 3 && fetes) passe += 1.5;
    passe -= absentsAuPasse * (1 - remplacement);
    if (secondAbsent) passe -= polyvalents ? 0.3 : saisonnier ? 0.2 : 0.5;

    // Ce que chacun envoie : la mise en place, la carte, la fatigue.
    let prod = 1;
    if (w >= 3)
      prod *= d2 === 0 ? (planningStable ? 1.05 : 1.01) : d2 === 1 ? 1.02 : d2 === 2 ? 1.04 : 1;
    if (d3 === 0 && (w === 5 || w === 6)) prod *= 0.97;
    if (d3 === 0 && (w === 7 || w === 8)) prod *= 1.02;
    if (polyvalents) prod *= 1.07;
    if (decembre) prod *= d5 === 0 ? 0.92 : d5 === 1 ? (d2 === 0 ? 1.08 : 1.05) : 1;
    prod *= 1 - 0.15 * Math.max(0, usure - 0.5);
    for (const a of actifs) prod *= a.imprevu.effet.capacite ?? 1;
    const chargePic = pointe / (passe * prod);

    // Les assiettes retournées : un samedi débordé, et le reste de la semaine.
    const couvertsSamedi = carteSamedi + gSamedi * GROUPE.couverts;
    const tauxSamedi = tauxDeRetour(chargePic);
    const autres = midi + soir + gSemaine * GROUPE.couverts;
    const retoursSamedi = couvertsSamedi * tauxSamedi;
    const retoursAutres = autres * 0.012 * (decembre && d5 === 0 ? 1.3 : 1);
    const couverts = couvertsSamedi + autres;
    const retours = retoursSamedi + retoursAutres;

    // Les heures supplémentaires.
    let hs = 40;
    if (w >= 2) hs += d1 === 0 ? 32 : d1 === 1 ? -8 : 0;
    if (w >= 3) hs += d2 === 0 ? (planningStable ? -20 : -6) : d2 === 1 ? 10 : d2 === 2 ? -18 : 0;
    if (d3 === 0 && w >= 5 && w <= 7) hs += 6;
    if (saisonnier && decembre) hs -= 6;
    hs += gSemaine * (g.menuUnique ? 3 : 7) + gSamedi * 6;
    if (decembre) hs += d5 === 0 ? 8 : d5 === 1 ? -4 : 0;
    if (fetes) hs += d6 === 0 ? 35 : d6 === 1 ? (d2 === 0 ? 6 : 12) : 0;
    hs += 0.6 * Math.min(8, Math.max(0, chargePic - 16)) * passe;
    const partExtra = polyvalents ? 0.15 : saisonnier && decembre ? 0.2 : 0.6;
    const partAbsorbee = polyvalents ? 0.35 : saisonnier && decembre ? 0.3 : 0.35;
    hs += absences * partAbsorbee * 7;
    if (secondAbsent) hs += saisonnier ? 4 : 10;
    for (const a of actifs) hs += a.imprevu.effet.heuresSup ?? 0;
    // Au-delà de 48 heures par personne, la loi arrête la brigade : le reste se fait en extras.
    const auDela = Math.max(0, hs - HEURES_SUP_MAX);
    hs = Math.max(5, Math.min(HEURES_SUP_MAX, hs));

    // Les extras et les dépenses ponctuelles.
    let extras = absences * partExtra * EXTRA + auDela * HEURE_EXTRA;
    if (d1 === 2 && w >= 2) extras += EXTRA;
    if (d3 === 1 && decembre) extras += 2 * EXTRA;
    if (g.extras) extras += (gSemaine + gSamedi) * EXTRA;
    if (d6 === 3 && fetes) extras += 2 * EXTRA;
    // Le saisonnier, cuisinier confirmé, tient le poste ; sinon il faut un chef de partie en extra.
    if (secondAbsent && !saisonnier) extras += 5 * CHEF_EXTRA;
    let ponctuel = 0;
    if (saisonnier) ponctuel += SAISONNIER.semaine;
    if (d3 === 2 && w === 5) ponctuel += SAISONNIER.recrutement;
    if (secondPart && w === SECOND_ABSENT) ponctuel += RECRUTEMENT_SECOND;
    for (const a of actifs) if (a.semaine === w) ponctuel += a.imprevu.effet.perte ?? 0;

    // Le chiffre d'affaires et la matière.
    let ticketSoir = 0;
    if (decembre) ticketSoir = d5 === 0 ? 3 : d5 === 1 ? 1.5 : 0;
    const caCarte =
      midi * TICKET.midi +
      soir * (TICKET.soir + ticketSoir) +
      carteSamedi * (TICKET.samedi + ticketSoir);
    const caGroupes = couvertsGroupes * TICKET.groupe;
    let ratio = RATIO_MATIERE;
    if (d2 === 2 && w >= 3) ratio += SURCOUT_LABO;
    if (decembre) ratio += d5 === 0 ? 0.025 : d5 === 1 ? -0.01 : 0;
    const matiere =
      caCarte * ratio + caGroupes * (g.menuUnique ? RATIO_MENU_GROUPE : RATIO_MATIERE);
    const ca = caCarte + caGroupes;

    const resultat =
      ca - matiere - MASSE_SALARIALE - hs * HEURE_SUP - extras - ponctuel - retours * COUT_RETOUR;
    marge += resultat;
    margeCumulee += resultat;
    totalHS += hs;
    totalExtras += extras;
    totalCA += ca;
    sommeRetours += retours / couverts;
    sommeCharge += chargePic;

    // L'usure : les coupures et le planning de la veille d'abord, puis les heures et le pic.
    const coupures = planningStable ? 1 : 4;
    let dU =
      0.005 * (coupures - 1) +
      (planningStable ? 0 : 0.012) +
      0.002 * (hs / EQUIPIERS - 4) +
      0.004 * Math.min(6, Math.max(0, chargePic - SEUIL_PIC)) -
      0.03;
    if (d2 === 1 && w >= 3) dU += 0.004;
    if (d3 === 0 && w >= 7) dU -= 0.006;
    if (saisonnier && decembre) dU -= 0.006;
    dU += 0.015 * gSamedi;
    if (d6 === 0 && fetes) dU += 0.02;
    usure = borne(usure + dU, 0.2, 1);

    // Les avis du samedi font la fréquentation des semaines suivantes.
    reputation = borne(reputation - 0.05 * (tauxSamedi - 0.025), 0.9, 1.02);

    // Lubin décide en fin de semaine 7, le planning de décembre sous les yeux.
    if (w === 7) {
      risqueSecond = risqueDeDepart(usure, samedisAnnonces, d3 ?? NEUTRE[D.polyvalence]);
      secondPart = h.uSecond < risqueSecond;
    }

    semaines.push({
      chargePic,
      heuresSup: hs,
      absences,
      retours: retours / couverts,
      couverts,
      ca,
      marge,
      margeCumulee,
      usure,
      reputation,
      extras,
    });
  }

  return {
    semaines,
    objectif: margeCumulee,
    marge: margeCumulee,
    ca: totalCA,
    heuresSup: totalHS,
    extras: totalExtras,
    retoursMoyens: sommeRetours / SEMAINES,
    chargeSamediMoyenne: sommeCharge / SEMAINES,
    secondPart,
    risqueSecond,
    groupesAcceptes,
    groupesSamedi,
    deplaces: d4 === 1 ? groupesDeplaces(graine) : 0,
    usureFinale: usure,
    coupDeFeuDepart: COUP_DE_FEU_DEPART,
  };
}

/** Ce qui s'est passé pendant des semaines : la démission du second, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    secondAnnonce: t.secondPart && dans(8),
    secondPart: t.secondPart && dans(SECOND_ABSENT),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureBrigade {
  margeCumulee: number | null;
  chargePic: number | null;
  heuresSup: number | null;
  absences: number | null;
  retours: number | null;
  budgetADate: number | null;
  /** Lu pour les messages : la démission du second est-elle annoncée ? */
  secondPart: number | null;
}

/** Ce qu'Elio lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureBrigade {
  if (semaine === 0) {
    return {
      margeCumulee: 0,
      chargePic: COUP_DE_FEU_DEPART,
      heuresSup: HEURES_SUP_DEPART,
      absences: 2.75,
      retours: 0.022,
      budgetADate: 0,
      secondPart: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    margeCumulee: s.margeCumulee,
    chargePic: s.chargePic,
    heuresSup: s.heuresSup,
    absences: s.absences,
    retours: s.retours,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    secondPart: t.secondPart && semaine >= 8 ? 1 : 0,
  };
}
