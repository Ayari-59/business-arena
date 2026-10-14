/**
 * LES CHAMBRES PAS PRÊTES À 15 H — le modèle des étages de L'Escale Annemasse.
 *
 * Un hôtel 3 étoiles de 78 chambres, une clientèle d'affaires qui travaille à
 * Genève : du lundi au jeudi, l'hôtel est presque plein, les clients partent
 * tôt et les suivants arrivent dès 13 h. Six femmes et valets de chambre aux
 * étages les jours chargés, une gouvernante d'étage, une lingère. Treize
 * semaines de janvier à mars, six décisions.
 *
 * La journée d'un jour chargé est simulée minute par minute, comme un flux :
 * des chambres qui se libèrent, du linge qui arrive, une équipe qui fait les
 * chambres dans un ordre donné, des clients qui arrivent à heure fixe. Quatre
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE GOULOT EST LE LINGE. La Blanchisserie du Fier livre à 11 h ; la
 *     lingère trie et monte les chariots en une demi-heure. Le linge resté
 *     dans les offices le matin ne couvre que 18 départs : passé ce cap, et
 *     une fois faites les recouches déjà libres, l'équipe attend 11 h 30. Ce
 *     temps perdu le matin, c'est exactement ce qui manque à 15 h. Porter le
 *     stock tampon à une journée (une parure de plus par lit chez la
 *     blanchisserie) le supprime pour une fraction du prix d'un renfort.
 *   · L'ORDRE DE NETTOYAGE DÉCIDE QUI ATTEND. Faites dans l'ordre des étages,
 *     les chambres des clients qui arrivent à 13 h sont prêtes au hasard. Faites
 *     d'abord d'après la liste d'arrivées de la réception, elles sont prêtes à
 *     temps, et les chambres encore en cours à 15 h sont celles des clients du
 *     soir, qui n'attendent pas. Faire « tous les départs d'abord » n'aide que
 *     si le linge suit.
 *   · LA RECOUCHE À LA DEMANDE libère du temps, à condition d'être proposée :
 *     offerte à l'arrivée avec une contrepartie, un client sur trois environ la
 *     décline ; imposée par une affichette, elle libère plus de temps et fait
 *     baisser la note.
 *   · L'INTÉRIM AJOUTE DES HEURES PEU PRODUCTIVES. Un intérimaire qui ne connaît
 *     ni les standards ni l'hôtel fait les deux tiers du travail d'une
 *     titulaire, attend le linge comme elle, et oublie quatre fois plus souvent
 *     (le gobelet, le peignoir, le cheveu dans la douche) : la note le paie.
 *     Quand la capacité manque vraiment (le salon de février, pendant les
 *     vacances d'hiver), les heures complémentaires des temps partiels, qui
 *     connaissent les standards, valent mieux.
 *
 * Le trimestre est jugé en euros, en écart au budget de l'hébergement : le
 * coût des étages (heures de l'équipe, heures supplémentaires, intérim, linge)
 * et le coût des attentes et des défauts (gestes commerciaux, clients perdus,
 * nuitées que la note des avis fait perdre, pendant le trimestre et au
 * suivant). Plus haut, mieux c'est.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAMBRES = 78;
/** Les jours chargés de la semaine : les nuits du lundi au jeudi. */
export const JOURS_CHARGES = 4;

/** Une heure de la journée, en minutes depuis minuit. */
export const heure = (h: number, m = 0) => h * 60 + m;

/* ---------------------------------------------------------------------------
 * LA JOURNÉE D'UN JOUR CHARGÉ.
 * ------------------------------------------------------------------------- */

/** Prise de poste à 8 h, chariots prêts à 8 h 15, pause de 12 h à 12 h 30, fin des chambres à 15 h 15. */
export const HORAIRES = {
  debut: heure(8, 15),
  /** Avec une prise de poste à 7 h. */
  debutTot: heure(7, 15),
  pause: [heure(12), heure(12, 30)] as const,
  fin: heure(15, 15),
  /** Le poste dure sept heures payées, pause déduite. */
  heuresPayees: 7,
  /** Au-delà de la fin des chambres, une heure supplémentaire au plus par personne. */
  heuresSupMax: 60,
  /** Après, la gouvernante d'étage et la lingère finissent seules, jusqu'à 22 h. */
  renfortSoir: 1.2,
  finSoir: heure(22),
} as const;

export const QUINZE_HEURES = heure(15);

/** Les temps standards de l'hôtel, en minutes. */
export const TEMPS = { depart: 35, recouche: 20, express: 12 } as const;

/** Le linge : la livraison de 11 h, triée en une demi-heure ; le stock du matin couvre 18 départs. */
export const LINGE = {
  livraison: heure(11),
  tri: 30,
  stockTampon: 18,
  /** Avec une parure de plus par lit, le stock du matin couvre la journée. */
  stockJournee: 80,
  /** La location de 78 parures de plus chez la Blanchisserie du Fier, par semaine. */
  dotation: 140,
  /** Le coût de location-entretien d'une parure complète (draps et éponge) et d'une éponge seule. */
  parDepart: 4.2,
  parRecouche: 1.6,
  /** Le linge des jours calmes, par semaine. */
  joursCalmes: 320,
} as const;
export const LINGE_DISPONIBLE = LINGE.livraison + LINGE.tri;

/** Quand les chambres se libèrent : les départs de 6 h 30 à 10 h, la moitié des recouches à 9 h, l'autre à 11 h 30. */
export const LIBERATION = {
  departsDe: heure(6, 30),
  departsA: heure(10),
  recouchesTot: heure(9),
  recouchesTard: heure(11, 30),
  partRecouchesTot: 0.5,
} as const;

/** Les clients qui arrivent tôt, de 13 h à 15 h ; les autres de 15 h à 19 h. */
export const ARRIVEES = {
  tot: [heure(13), heure(15)] as const,
  tard: [heure(15), heure(19)] as const,
} as const;

/** Les femmes et valets de chambre aux étages un jour chargé ; cinq pendant les vacances d'hiver. */
export const EQUIPE = 6;
export const EQUIPE_VACANCES = 4;
export const VACANCES = [8, 9] as const;
/** Les absences qu'un jour chargé peut coûter, au plus : au-delà, l'encadrement fait des chambres. */
export const ABSENCES_MAX = 1.5;

/** Le lundi de la semaine dernière, que les sources de la semaine 1 décrivent. */
export const LUNDI = { equipe: 6, departs: 44, recouches: 30, tot: 13 } as const;

/** Les taux d'occupation des jours chargés, semaine par semaine : le salon de Genève en semaines 8 et 9. */
export const OCCUPATION = [
  0, 0.86, 0.93, 0.94, 0.94, 0.95, 0.94, 0.94, 1, 1, 0.95, 0.94, 0.95, 0.93,
];
export const SALON = { semaines: [8, 9], departs: 0.65, tot: 0.5 } as const;
export const PART_DEPARTS = 0.6;
export const PART_TOT = 0.3;

/** Chaque heure d'attente par personne le matin rend les oublis de l'après-midi 30 % plus fréquents. */
export const COURSE = 0.3;

/** Ce que fait une personne, rapporté à une titulaire, et ce qu'elle oublie. */
export const RENFORTS = {
  titulaire: { prod: 1, defauts: 0.02 },
  interim: { prod: 0.65, defauts: 0.09 },
  forme: { prod: 0.8, defauts: 0.04 },
} as const;

/** Les coûts horaires chargés. */
export const COUTS = {
  /** Une heure d'intérim facturée par l'agence. */
  interim: 26,
  /** Une heure supplémentaire de titulaire, majorée de 25 %. */
  heureSup: 23.75,
  /** Une heure complémentaire de temps partiel, majorée de 10 %. */
  heureComplementaire: 20.9,
  /** Les heures de l'équipe, de la gouvernante d'étage et de la lingère, par semaine. */
  equipeSemaine: 6360,
  /** Un client qui attend sa chambre : le geste commercial, et la marge des clients qui ne reviennent pas. */
  geste: 15,
  clientele: 20,
  /** Une chambre où le client trouve un oubli : la recouche refaite, le geste. */
  defaut: 20,
} as const;

/** La note des avis (Bookalia, Voyagio), sur 10. */
export const NOTE = {
  depart: 8.3,
  /** Celle que suppose le budget. */
  reference: 8.4,
  plafond: 8.8,
  /** Ce que coûte chaque point de clients en attente, et de chambres avec un oubli. */
  parAttente: 2.2,
  parDefaut: 12,
  /** La note bouge d'un quart de l'écart chaque semaine : les avis s'accumulent. */
  inertie: 0.25,
  /** Un dixième de point = 1,2 % de nuitées vendues. */
  effet: 0.012,
  /** La moitié de l'effet de la note de fin mars porte encore sur le trimestre suivant. */
  suite: 0.5,
} as const;
/** La marge d'une nuitée : prix moyen 105 €, coût variable 21 €. */
export const PRIX_MOYEN = 105;
export const COUT_VARIABLE = 21;
export const MARGE_NUITEE = PRIX_MOYEN - COUT_VARIABLE;
export const OCCUPATION_CALME = 0.42;

/** Le budget de l'hébergement du trimestre : heures, intérim, linge. */
export const BUDGET = 105000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des clients attendent encore leur chambre. */
export const PERTE_PAR_JOUR = 800;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  premier: 0,
  ordre: 1,
  recouche: 2,
  salon: 3,
  controle: 4,
  groupe: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 2, 3, 3, 3] as const;

/** La recouche à la demande (troisième décision). */
export const RECOUCHE = {
  /** Proposée à l'arrivée avec une boisson offerte : de 25 à 45 % des clients en séjour la déclinent. */
  adhesionMin: 0.25,
  adhesionMax: 0.45,
  boisson: 1.2,
  /** Imposée tous les trois jours par une affichette : 55 % de recouches en moins. */
  imposee: 0.55,
  /** Six clients sur cent qui la voient supprimée réclament. */
  reclamations: 0.06,
  malusNote: 0.3,
  /** La recouche express : douze minutes, et des oublis. */
  defautsExpress: 0.07,
} as const;

/** Le salon de février, pendant les vacances d'hiver (quatrième décision). */
export const RENFORT_SALON = {
  interimaires: 2,
  /**
   * Les heures complémentaires et les congés décalés : 1,8 personne de plus par jour chargé si
   * l'équipe joue le jeu ; une demi-personne seulement, quatre fois sur dix, si les congés
   * posés depuis l'automne ne bougent pas.
   */
  complementairesMin: 0.5,
  complementairesMax: 1.8,
  chanceRefus: 0.4,
  primeVolontaires: 300,
  /** Deux journées de binôme en semaine 7 pour les deux intérimaires formés. */
  formation: 2 * 2 * 7 * 26,
} as const;

/** Le contrôle des chambres (cinquième décision). */
export const CONTROLE = [
  /** Tout contrôler : moins d'oublis, mais la gouvernante d'étage ne fait plus de chambres, et elles sont libérées plus tard. */
  { defauts: 0.4, equipe: -0.35, delai: 45, cout: 0 },
  /** Contrôler les arrivées tôt, les fidèles et les nouveaux ; une check-list pour le reste. */
  { defauts: 0.55, equipe: -0.05, delai: 0, cout: 0 },
  /** Une prime au nombre de chambres : plus vite, plus d'oublis. */
  { defauts: 1.5, equipe: 0, delai: 0, cout: 600, vitesse: 1.06 },
  /** Un rappel des standards en réunion. */
  { defauts: 0.92, equipe: 0, delai: 0, cout: 0 },
] as const;

/** Le groupe de la semaine 12 : 32 chambres, un car annoncé à 12 h 30 (sixième décision). */
export const GROUPE = {
  semaine: 12,
  chambres: 32,
  arrivee: heure(12, 30),
  /** Une fois sur trois, le car arrive une heure plus tôt. */
  arriveeTot: heure(11, 30),
  chanceTot: 1 / 3,
  /** Sans rooming list préparée, la remise des clés fait attendre une part du groupe au comptoir. */
  file: 0.4,
  /** Le linge commandé en plus pour le mardi. */
  lingeEnPlus: 90,
  interimaires: 3,
  /** Le séjour du groupe : deux nuits à 89 €. */
  nuits: 2,
  prix: 89,
  /** Un café offert à chaque participant qui attend. */
  cafe: 8,
  /** Au-delà de six participants qui attendent, 10 % de remise sur le séjour. */
  remiseAttente: 0.1 * 32 * 2 * 89,
  /** L'accueil à 15 h : un café pour chacun, la bagagerie, et 20 % de remise : l'après-midi de formation est perdu. */
  accueil: 32 * 8 + 0.2 * 32 * 2 * 89,
  /** Les deux sessions de formation qui restent dans l'année, si l'organisateur revient. */
  valeur: 2 * 32 * 2 * MARGE_NUITEE,
} as const;

/** Le grand compte genevois : seize nuitées par semaine, des voyageurs qui arrivent tôt. */
export const GRAND_COMPTE = { nuitees: 16, semaineDecision: 7 } as const;

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
    absents?: number;
    linge?: number;
    vitesse?: number;
    retard?: number;
    occupation?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "La grippe aux étages",
    de: "Rosine Kabongo",
    role: "Gouvernante d'étage",
    texte:
      "La grippe est passée par l'équipe : une personne de plus absente chaque jour chargé, pendant deux semaines.",
    duree: 2,
    effet: { absents: 1 },
  },
  {
    id: "camion",
    titre: "Le camion de la Blanchisserie du Fier en panne",
    de: "Gervais Tournier",
    role: "Responsable clientèle, Blanchisserie du Fier",
    texte:
      "Notre camion de la tournée du Genevois est immobilisé : toute la semaine, nous livrons avec un véhicule de location, vers 13 h.",
    duree: 1,
    effet: { linge: heure(13) + LINGE.tri },
  },
  {
    id: "monteCharge",
    titre: "Le monte-charge en panne",
    de: "Maintenance",
    role: "L'Escale Annemasse",
    texte:
      "Le monte-charge est arrêté jusqu'à la livraison d'une pièce : chariots et sacs de linge par l'escalier toute la semaine.",
    duree: 1,
    effet: { vitesse: 0.9 },
  },
  {
    id: "neige",
    titre: "La neige sur le Genevois",
    de: "Réception",
    role: "L'Escale Annemasse",
    texte:
      "Routes enneigées et vols retardés à Genève : les clients en départ libèrent leur chambre avec plus d'une heure de retard toute la semaine.",
    duree: 1,
    effet: { retard: 75 },
  },
  {
    id: "congres",
    titre: "Un congrès à Genève",
    de: "Réception",
    role: "L'Escale Annemasse",
    texte:
      "Un congrès médical à Genève remplit l'hôtel du lundi au jeudi, avec des arrivées dès 13 h.",
    duree: 1,
    effet: { occupation: 1 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  occupation: number;
  absents: number;
  note: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La part des clients en séjour qui déclinent la recouche quand on la leur propose. */
  uAdhesion: number;
  /** La part des heures complémentaires que les volontaires acceptent. */
  uComplementaires: number;
  /** Le grand compte part-il si ses voyageurs attendent ? */
  uGrandCompte: number;
  /** Le car du groupe arrive-t-il tôt ? */
  uCar: number;
  /** L'organisateur du groupe s'en va-t-il ? */
  uOrganisateur: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000457 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    semaines.push({
      occupation: Math.min(1.05, Math.max(0.95, 1 + 0.025 * gauss(r))),
      absents: Math.min(1.2, Math.max(0, 0.4 + 0.35 * gauss(r))),
      note: Math.min(0.08, Math.max(-0.08, 0.03 * gauss(r))),
    });
  }
  const uAdhesion = r();
  const uComplementaires = r();
  const uGrandCompte = r();
  const uCar = r();
  const uOrganisateur = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    semaines,
    uAdhesion,
    uComplementaires,
    uGrandCompte,
    uCar,
    uOrganisateur,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La part des clients en séjour qui déclinent la recouche quand on la leur propose bien. */
export const adhesion = (graine: number) =>
  RECOUCHE.adhesionMin + (RECOUCHE.adhesionMax - RECOUCHE.adhesionMin) * hasard(graine).uAdhesion;

/** Les personnes de plus, par jour chargé, que les heures complémentaires donnent pendant le salon. */
export const complementaires = (graine: number) =>
  hasard(graine).uComplementaires < RENFORT_SALON.chanceRefus
    ? RENFORT_SALON.complementairesMin
    : RENFORT_SALON.complementairesMax;

/** Le car du groupe arrive-t-il à 11 h 30 ? */
export const carEnAvance = (graine: number) => hasard(graine).uCar < GROUPE.chanceTot;

/**
 * LE GRAND COMPTE PART-IL ?
 *
 * Helvardis, une société genevoise, loge ses voyageurs à l'hôtel au tarif
 * négocié. Ils arrivent de l'aéroport entre 13 h et 15 h. Fin février, sa
 * responsable des voyages renouvelle ou non l'accord ; elle regarde combien
 * de ses voyageurs ont attendu leur chambre depuis janvier.
 */
export const risqueGrandCompte = (partAttenteTot: number) =>
  Math.min(0.75, Math.max(0, (partAttenteTot - 0.04) * 2.4));

/** L'organisateur du groupe revient-il ? Il regarde combien de participants ont attendu. */
export const risqueOrganisateur = (partAttente: number, accueilDecale: boolean) =>
  Math.min(0.8, Math.max(accueilDecale ? 0.12 : 0, 1.6 * partAttente - 0.05));

/* ---------------------------------------------------------------------------
 * UNE JOURNÉE AUX ÉTAGES : les chambres se libèrent, le linge arrive, l'équipe avance.
 * ------------------------------------------------------------------------- */

export type Ordre = "priorite" | "departs" | "etages";
type Classe = "titulaire" | "interim" | "forme";

export interface Renfort {
  n: number;
  classe: Classe;
  de: number;
  a: number;
}

export interface Journee {
  departs: number;
  recouches: number;
  /** Les clients qui arrivent entre 13 h et 15 h. */
  tot: number;
  /** Les titulaires présentes, absences déduites. */
  equipe: number;
  renforts: readonly Renfort[];
  debut: number;
  stock: number;
  linge: number;
  ordre: Ordre;
  tempsRecouche: number;
  retard: number;
  vitesse: number;
  /** Le temps entre la chambre faite et la chambre libérée à la réception. */
  delai: number;
  /** Un groupe qui arrive d'un coup, et dont les chambres passent en premier ou non. */
  groupe?: { chambres: number; arrivee: number; enPremier: boolean };
}

export interface BilanJournee {
  /** Le temps passé à attendre du linge ou une chambre libre, en minutes de présence. */
  attente: number;
  /** Les départs pas prêts à 15 h. */
  nonPretes: number;
  /** Les clients qui trouvent leur chambre pas prête. */
  clientsAttente: number;
  /** Parmi eux, ceux qui arrivaient entre 13 h et 15 h. */
  totAttente: number;
  /** Parmi eux, ceux du groupe. */
  groupeAttente: number;
  /** Les minutes supplémentaires des titulaires. */
  heuresSup: number;
  /** La part du travail que chaque classe a faite. */
  parts: Readonly<Record<Classe, number>>;
  /** L'heure où la dernière chambre est faite. */
  finDernier: number;
}

interface Tache {
  depart: boolean;
  duree: number;
  libre: number;
  /** L'heure d'arrivée du client, pour une chambre dont on connaît le client ; sinon -1. */
  client: number;
  groupe: boolean;
  fin: number;
}

/** Une suite régulière et sans hasard pour mélanger chambres et étages. */
const melange = (i: number) => (i * 0.6180339887) % 1;

export function journee(j: Journee): BilanJournee {
  const nD = Math.max(0, Math.round(j.departs));
  const nR = Math.max(0, Math.round(j.recouches));
  const g = j.groupe ? Math.min(nD, j.groupe.chambres) : 0;
  const nTot = Math.min(nD - g, Math.max(0, Math.round(j.tot)));
  const fin = j.debut + (HORAIRES.fin - HORAIRES.debut);
  const finSup = fin + HORAIRES.heuresSupMax;
  const [p0, p1] = HORAIRES.pause;

  // Qui travaille, et à quelle vitesse, à chaque instant.
  const tetes = (t: number) => {
    if (t >= p0 && t < p1)
      return { titulaires: 0, renforts: [] as { n: number; classe: Classe }[] };
    const titulaires = t >= j.debut && t < finSup ? j.equipe : 0;
    const renforts = j.renforts
      .filter((x) => t >= x.de && t < x.a && t < fin)
      .map((x) => ({ n: x.n, classe: x.classe }));
    return { titulaires, renforts };
  };
  const vitesse = (t: number) => {
    const q = tetes(t);
    let v = q.titulaires * RENFORTS.titulaire.prod;
    for (const x of q.renforts) v += x.n * RENFORTS[x.classe].prod;
    if (t >= finSup && t < HORAIRES.finSoir) v += HORAIRES.renfortSoir;
    return v * j.vitesse;
  };
  const coupures = [
    j.debut,
    p0,
    p1,
    fin,
    finSup,
    HORAIRES.finSoir,
    ...j.renforts.flatMap((x) => [x.de, x.a]),
  ].sort((a, b) => a - b);
  const suivante = (t: number) => coupures.find((c) => c > t + 1e-9) ?? Infinity;

  const travail: Record<Classe, number> = { titulaire: 0, interim: 0, forme: 0 };
  const noter = (t: number, duree: number) => {
    const q = tetes(t);
    const v = vitesse(t);
    if (v <= 0) return;
    const part = (duree * j.vitesse) / v;
    travail.titulaire += q.titulaires * RENFORTS.titulaire.prod * part;
    for (const x of q.renforts) travail[x.classe] += x.n * RENFORTS[x.classe].prod * part;
  };
  /** Avance l'horloge du temps qu'il faut pour faire `minutes` de travail. */
  const avancer = (t: number, minutes: number) => {
    let reste = minutes;
    while (reste > 1e-9) {
      if (t >= HORAIRES.finSoir) return heure(24);
      const b = suivante(t);
      const v = vitesse(t);
      if (v <= 0) {
        t = b;
        continue;
      }
      const possible = v * (b - t);
      if (possible >= reste) {
        noter(t, reste);
        return t + reste / v;
      }
      noter(t, possible);
      reste -= possible;
      t = b;
    }
    return t;
  };
  const presents = (t: number) => {
    const q = tetes(t);
    return t < fin ? q.titulaires + q.renforts.reduce((s, x) => s + x.n, 0) : 0;
  };

  // Les chambres : quand elles se libèrent, et qui les attend.
  const span = LIBERATION.departsA - LIBERATION.departsDe;
  const departs: Tache[] = Array.from({ length: nD }, (_, i) => ({
    depart: true,
    duree: TEMPS.depart,
    libre: LIBERATION.departsDe + (span * (((i * 29 + 7) % nD) + 0.5)) / nD + j.retard,
    client: -1,
    groupe: false,
    fin: Infinity,
  }));
  const recouches: Tache[] = Array.from({ length: nR }, (_, i) => ({
    depart: false,
    duree: j.tempsRecouche,
    libre:
      i < nR * LIBERATION.partRecouchesTot ? LIBERATION.recouchesTot : LIBERATION.recouchesTard,
    client: -1,
    groupe: false,
    fin: Infinity,
  }));
  // Les arrivées : le groupe, les clients de 13 h à 15 h, ceux du soir.
  const arrivees: { t: number; groupe: boolean }[] = [];
  for (let k = 0; k < g; k += 1) arrivees.push({ t: j.groupe!.arrivee, groupe: true });
  const [a0, a1] = ARRIVEES.tot;
  for (let k = 0; k < nTot; k += 1)
    arrivees.push({ t: a0 + ((a1 - a0) * (k + 0.5)) / nTot, groupe: false });
  const nTard = nD - g - nTot;
  const [b0, b1] = ARRIVEES.tard;
  for (let k = 0; k < nTard; k += 1)
    arrivees.push({ t: b0 + ((b1 - b0) * (k + 0.5)) / nTard, groupe: false });
  arrivees.sort((x, y) => x.t - y.t);

  // L'ordre de passage.
  const parEtage = [...departs, ...recouches]
    .map((x, i) => ({ x, p: melange(i + 1) }))
    .sort((u, v) => u.p - v.p)
    .map((u) => u.x);
  let file: Tache[];
  const connus = j.ordre === "priorite" || (j.groupe?.enPremier ?? false);
  if (j.ordre === "priorite") {
    // La liste d'arrivées : les clients attendus avant 15 h reçoivent les chambres libérées les
    // premières, et leurs chambres passent d'abord ; le reste suit l'ordre des étages. Les clients
    // du soir, dont l'heure d'arrivée est rarement connue, gardent la chambre que Hostéo leur a donnée.
    const parLiberation = [...departs].sort((u, v) => u.libre - v.libre);
    arrivees.slice(0, g + nTot).forEach((a, k) => {
      parLiberation[k]!.client = a.t;
      parLiberation[k]!.groupe = a.groupe;
    });
    const premiers = parLiberation.slice(0, g + nTot);
    const reste = parEtage.filter((x) => !premiers.includes(x));
    file = [...premiers, ...reste];
  } else {
    const base = j.ordre === "departs" ? [...departs, ...recouches] : parEtage;
    if (j.groupe?.enPremier) {
      // Les chambres du groupe sont désignées la veille et passent en premier.
      const parLiberation = [...departs].sort((u, v) => u.libre - v.libre);
      const duGroupe = parLiberation.slice(0, g);
      duGroupe.forEach((x) => {
        x.groupe = true;
        x.client = j.groupe!.arrivee;
      });
      file = [...duGroupe, ...base.filter((x) => !duGroupe.includes(x))];
    } else {
      file = base;
    }
  }

  // La journée.
  let t = j.debut;
  let linge = 0;
  let attente = 0;
  const restantes = [...file];
  while (restantes.length > 0 && t < HORAIRES.finSoir) {
    const dispo = (x: Tache) =>
      x.libre <= t + 1e-9 && (!x.depart || linge < j.stock || t >= j.linge - 1e-9);
    const k = restantes.findIndex(dispo);
    if (k < 0) {
      // Rien à faire : on attend le linge ou une chambre libre.
      const prochaine = Math.min(
        ...restantes.map((x) =>
          x.depart && linge >= j.stock ? Math.max(x.libre, j.linge) : x.libre,
        ),
      );
      const jusqua = Math.max(prochaine, t + 1e-6);
      // Le temps de présence perdu, morceau par morceau.
      let u = t;
      while (u < jusqua - 1e-9) {
        const b = Math.min(jusqua, suivante(u));
        attente += presents(u) * (b - u);
        u = b;
      }
      t = jusqua;
      continue;
    }
    const x = restantes.splice(k, 1)[0]!;
    if (x.depart && t < j.linge - 1e-9) linge += 1;
    t = avancer(t, x.duree);
    x.fin = t + j.delai;
  }

  // Ce que la journée a donné.
  const finies = [...departs, ...recouches].map((x) => x.fin);
  const finDernier = Math.max(...finies, j.debut);
  const pretesA = (h: number) => departs.filter((x) => x.fin <= h).length;
  const nonPretes = nD - pretesA(QUINZE_HEURES);
  let clientsAttente = 0;
  let totAttente = 0;
  let groupeAttente = 0;
  if (connus) {
    // Chaque client a sa chambre : il attend si elle n'est pas prête à son arrivée.
    const assignes = departs.filter((x) => x.client >= 0);
    const libres = departs.filter((x) => x.client < 0);
    for (const x of assignes) {
      if (x.fin > x.client) {
        clientsAttente += 1;
        if (x.groupe) groupeAttente += 1;
        else if (x.client < ARRIVEES.tot[1]) totAttente += 1;
      }
    }
    // Les autres clients ont une chambre pré-affectée sans regarder l'ordre du ménage : ils
    // attendent selon la part des chambres restantes qui n'est pas prête à leur arrivée.
    const sansOrdre =
      j.ordre === "priorite" ? arrivees.slice(g + nTot) : arrivees.filter((x) => !x.groupe);
    for (const a of sansOrdre) {
      const p = libres.length ? libres.filter((x) => x.fin > a.t).length / libres.length : 0;
      clientsAttente += p;
      if (a.t < ARRIVEES.tot[1]) totAttente += p;
    }
  } else {
    // Hostéo pré-affecte les chambres sans regarder l'ordre du ménage : le client attend
    // si la sienne, tirée parmi les départs, n'est pas prête.
    for (const a of arrivees) {
      const p = nD ? departs.filter((x) => x.fin > a.t).length / nD : 0;
      clientsAttente += p;
      if (a.groupe) groupeAttente += p;
      else if (a.t < ARRIVEES.tot[1]) totAttente += p;
    }
  }

  const total = travail.titulaire + travail.interim + travail.forme;
  const parts = {
    titulaire: total > 0 ? travail.titulaire / total : 1,
    interim: total > 0 ? travail.interim / total : 0,
    forme: total > 0 ? travail.forme / total : 0,
  };
  const heuresSup = j.equipe * Math.max(0, Math.min(finSup, finDernier - j.delai) - fin);
  return {
    attente,
    nonPretes,
    clientsAttente,
    totAttente,
    groupeAttente,
    heuresSup,
    parts,
    finDernier,
  };
}

/** Le lundi de la semaine dernière, tel que les sources de la semaine 1 le décrivent. */
export const JOURNEE_LUNDI: Journee = {
  departs: LUNDI.departs,
  recouches: LUNDI.recouches,
  tot: LUNDI.tot,
  equipe: LUNDI.equipe,
  renforts: [],
  debut: HORAIRES.debut,
  stock: LINGE.stockTampon,
  linge: LINGE_DISPONIBLE,
  ordre: "etages",
  tempsRecouche: TEMPS.recouche,
  retard: 0,
  vitesse: 1,
  delai: 0,
};
export const BILAN_LUNDI = journee(JOURNEE_LUNDI);
/** Les heures que l'équipe a passées à attendre le linge ce lundi : ce que la prévision demande. */
export const HEURES_PERDUES_LUNDI = BILAN_LUNDI.attente / 60;

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** Les départs pas prêts à 15 h, par jour chargé. */
  nonPretes: number;
  /** Les clients qui ont trouvé leur chambre pas prête, sur la semaine. */
  clientsAttente: number;
  /** Les heures de présence perdues à attendre, par jour chargé. */
  heuresPerdues: number;
  note: number;
  /** Le coût des étages cumulé depuis le début du trimestre : heures, intérim, linge. */
  coutCumule: number;
  /** Ce que la semaine a coûté : les étages, les gestes, les défauts, la note, les clients perdus. */
  cout: number;
  /** Les chambres avec un oubli, sur la semaine. */
  defauts: number;
  /** Les heures d'intérim et les heures complémentaires de la semaine. */
  heuresRenfort: number;
  heuresSup: number;
  /** Les personnes aux étages un jour chargé, renforts compris. */
  presents: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de l'hébergement, attentes et défauts compris : positif, sous le budget. */
  objectif: number;
  /** Le coût des étages : heures, heures supplémentaires, intérim, linge. */
  cout: number;
  /** Le coût des attentes et des défauts : gestes, clients perdus, note. */
  pertes: number;
  heuresInterim: number;
  clientsAttente: number;
  defauts: number;
  noteFinale: number;
  /** Les départs pas prêts à 15 h, en moyenne par jour chargé. */
  nonPretesMoyen: number;
  /** Les heures perdues à attendre, en moyenne par jour chargé. */
  heuresPerduesMoyen: number;
  grandCompteParti: boolean;
  risqueGrandCompte: number;
  adhesion: number;
  complementaires: number;
  carEnAvance: boolean;
  groupeAttente: number;
  organisateurParti: boolean;
  /** Les heures d'équipe perdues à attendre le linge, le lundi décrit en semaine 1. */
  heuresPerduesLundi: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const taux = adhesion(graine);
  const comp = complementaires(graine);
  const enAvance = carEnAvance(graine);
  const semaines: (Semaine | null)[] = [null];
  let coutCumule = 0;
  let cout = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let pertes = 0;
  let note: number = NOTE.depart;
  let heuresInterim = 0;
  let clientsTotal = 0;
  let defautsTotal = 0;
  let nonPretesTotal = 0;
  let perduesTotal = 0;
  let totAttentes = 0;
  let totArrivees = 0;
  let grandCompteParti = false;
  let risque = 0;
  let groupeAttente = 0;
  let organisateurParti = false;
  let nuiteesTrimestre = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let etages = COUTS.equipeSemaine + LINGE.joursCalmes;
    let perte = w === 1 ? enquete : 0;

    // L'hôtel des jours chargés.
    const salon = (SALON.semaines as readonly number[]).includes(w);
    let occupation = OCCUPATION[w]! * n.occupation;
    for (const a of actifs) if (a.imprevu.effet.occupation) occupation = a.imprevu.effet.occupation;
    occupation = Math.min(1, occupation);
    const occupees = Math.round(CHAMBRES * occupation);
    const departs = Math.round(occupees * (salon ? SALON.departs : PART_DEPARTS));
    const enSejour = occupees - departs;
    const congres = actifs.some((a) => a.imprevu.effet.occupation);
    const tot = Math.round(departs * (salon || congres ? SALON.tot : PART_TOT));

    // La recouche.
    let recouches = enSejour;
    let tempsRecouche: number = TEMPS.recouche;
    let declinees = 0;
    let defautsRecouche = 0;
    let malus = 0;
    if (w >= 5) {
      if (d3 === 0) declinees = enSejour * taux;
      if (d3 === 1) {
        declinees = enSejour * RECOUCHE.imposee;
        malus += RECOUCHE.malusNote;
      }
      if (d3 === 3) {
        tempsRecouche = TEMPS.express;
        defautsRecouche = RECOUCHE.defautsExpress;
      }
    }
    recouches = enSejour - declinees;

    // L'équipe et ses renforts.
    const prevue = (VACANCES as readonly number[]).includes(w) ? EQUIPE_VACANCES : EQUIPE;
    let absents = n.absents;
    for (const a of actifs) absents += a.imprevu.effet.absents ?? 0;
    // Au-delà d'une personne et demie d'absence, Djeneba et Rosine montent elles-mêmes aux étages.
    let equipe = prevue - Math.min(ABSENCES_MAX, absents);
    const debut = d1 === 2 && w >= 2 ? HORAIRES.debutTot : HORAIRES.debut;
    const fin = debut + (HORAIRES.fin - HORAIRES.debut);
    const renforts: Renfort[] = [];
    let heuresRenfort = 0;
    let coutRenfort = 0;
    const journeeComplete = (nb: number, classe: Classe) => {
      renforts.push({ n: nb, classe, de: debut, a: fin });
      heuresRenfort += nb * HORAIRES.heuresPayees * JOURS_CHARGES;
    };
    if (d1 === 0 && w >= 2) journeeComplete(2, "interim");
    if (d2 === 3 && w >= 3) {
      renforts.push({ n: 1, classe: "interim", de: heure(12), a: heure(17) });
      heuresRenfort += 5 * JOURS_CHARGES;
    }
    coutRenfort += heuresRenfort * COUTS.interim;
    heuresInterim += heuresRenfort;
    if (salon && d4 === 0) {
      journeeComplete(RENFORT_SALON.interimaires, "interim");
      const hs = RENFORT_SALON.interimaires * HORAIRES.heuresPayees * JOURS_CHARGES;
      coutRenfort += hs * COUTS.interim;
      heuresInterim += hs;
    }
    if (salon && d4 === 2) {
      journeeComplete(RENFORT_SALON.interimaires, "forme");
      const hs = RENFORT_SALON.interimaires * HORAIRES.heuresPayees * JOURS_CHARGES;
      coutRenfort += hs * COUTS.interim;
      heuresInterim += hs;
    }
    if (w === 7 && d4 === 2) {
      coutRenfort += RENFORT_SALON.formation;
      heuresInterim += RENFORT_SALON.formation / COUTS.interim;
    }
    if (salon && d4 === 1) {
      equipe += comp;
      const hs = comp * HORAIRES.heuresPayees * JOURS_CHARGES;
      heuresRenfort += hs;
      coutRenfort +=
        hs * COUTS.heureComplementaire +
        (w === SALON.semaines[0] ? RENFORT_SALON.primeVolontaires : 0);
    }

    // Le contrôle des chambres.
    const controle = w >= 10 ? CONTROLE[d5!]! : CONTROLE[3]!;
    equipe += controle.equipe;
    let vitesse = "vitesse" in controle ? controle.vitesse : 1;
    for (const a of actifs) vitesse *= a.imprevu.effet.vitesse ?? 1;
    if (w >= 10) etages += controle.cout / 4;

    // Le linge.
    const stock = d1 === 1 && w >= 2 ? LINGE.stockJournee : LINGE.stockTampon;
    let linge: number = LINGE_DISPONIBLE;
    for (const a of actifs) linge = Math.max(linge, a.imprevu.effet.linge ?? 0);
    const retard = actifs.reduce((s, a) => s + (a.imprevu.effet.retard ?? 0), 0);
    if (d1 === 1 && w >= 2) etages += LINGE.dotation;

    const ordre: Ordre =
      w >= 3 ? (d2 === 0 ? "priorite" : d2 === 1 ? "departs" : "etages") : "etages";
    const jour: Journee = {
      departs,
      recouches,
      tot,
      equipe: Math.max(1, equipe),
      renforts,
      debut,
      stock,
      linge,
      ordre,
      tempsRecouche,
      retard,
      vitesse,
      delai: controle.delai,
    };
    const b = journee(jour);
    // Le mardi du groupe remplace un jour chargé ordinaire.
    let bilans = [b, b, b, b];
    if (w === GROUPE.semaine) {
      const enPremier = d6 === 0;
      const accueil = d6 === 2;
      const groupeJour: Journee = {
        ...jour,
        stock: enPremier ? Math.max(stock, GROUPE.chambres + 4) : stock,
        renforts:
          d6 === 1
            ? [...renforts, { n: GROUPE.interimaires, classe: "interim", de: debut, a: fin }]
            : renforts,
        groupe: {
          chambres: GROUPE.chambres,
          arrivee: accueil ? QUINZE_HEURES : enAvance ? GROUPE.arriveeTot : GROUPE.arrivee,
          enPremier,
        },
      };
      const bg = journee(groupeJour);
      bilans = [bg, b, b, b];
      // Sans rooming list, la remise des clés fait attendre une partie du groupe au comptoir.
      const file = enPremier || accueil ? 0 : GROUPE.file * GROUPE.chambres;
      groupeAttente = Math.min(GROUPE.chambres, bg.groupeAttente + file);
      if (d6 === 0) etages += GROUPE.lingeEnPlus;
      if (d6 === 1) {
        const hs = GROUPE.interimaires * HORAIRES.heuresPayees;
        etages += hs * COUTS.interim;
        heuresInterim += hs;
      }
      if (accueil) perte += GROUPE.accueil;
      // Un café pour chacun de ceux qui attendent ; au-delà de six, l'organisateur obtient une remise.
      perte += groupeAttente * GROUPE.cafe + (groupeAttente > 6 ? GROUPE.remiseAttente : 0);
      organisateurParti =
        h.uOrganisateur < risqueOrganisateur(groupeAttente / GROUPE.chambres, accueil);
      if (organisateurParti) perte += GROUPE.valeur;
      // Les clients du groupe qui attendent sont comptés à part : ils ne réservent pas eux-mêmes.
      bilans = [{ ...bg, clientsAttente: bg.clientsAttente - bg.groupeAttente }, b, b, b];
    }

    // Ce que la semaine donne.
    const somme = (f: (x: BilanJournee) => number) => bilans.reduce((s, x) => s + f(x), 0);
    const clients = somme((x) => x.clientsAttente);
    const nonPretes = somme((x) => x.nonPretes) / JOURS_CHARGES;
    const heuresPerdues = somme((x) => x.attente) / 60 / JOURS_CHARGES;
    const heuresSup = somme((x) => x.heuresSup) / 60;
    const chambres = (departs + recouches) * JOURS_CHARGES;
    const tauxDefaut =
      (b.parts.titulaire * RENFORTS.titulaire.defauts +
        b.parts.interim * RENFORTS.interim.defauts +
        b.parts.forme * RENFORTS.forme.defauts) *
        controle.defauts +
      (defautsRecouche * recouches) / Math.max(1, departs + recouches);
    // Les chambres finies dans la course, après une matinée à attendre, sont celles où l'on oublie.
    const tauxCourse = tauxDefaut * (1 + COURSE * (b.attente / 60 / Math.max(1, jour.equipe)));
    const defauts = chambres * tauxCourse;
    totAttentes += somme((x) => x.totAttente);
    totArrivees += tot * JOURS_CHARGES;

    // Le coût des étages.
    etages += coutRenfort + heuresSup * COUTS.heureSup;
    etages += JOURS_CHARGES * (departs * LINGE.parDepart + recouches * LINGE.parRecouche);
    if (w >= 5 && d3 === 0) etages += JOURS_CHARGES * declinees * RECOUCHE.boisson;

    // Le coût des attentes et des défauts.
    perte += clients * (COUTS.geste + COUTS.clientele) + defauts * COUTS.defaut;
    if (w >= 5 && d3 === 1)
      perte += JOURS_CHARGES * declinees * RECOUCHE.reclamations * COUTS.geste;
    const partAttente = clients / Math.max(1, departs * JOURS_CHARGES);
    const cible =
      NOTE.plafond - NOTE.parAttente * partAttente - NOTE.parDefaut * tauxCourse - malus;
    note = borne(note + NOTE.inertie * (cible - note) + n.note, 6, 9.5);
    const nuitees = CHAMBRES * (JOURS_CHARGES * occupation + 3 * OCCUPATION_CALME);
    nuiteesTrimestre += nuitees;
    perte += (NOTE.reference - note) * 10 * NOTE.effet * nuitees * MARGE_NUITEE;

    // Le grand compte décide fin février, sur ce que ses voyageurs ont vécu depuis janvier.
    if (w === GRAND_COMPTE.semaineDecision - 1) {
      risque = risqueGrandCompte(totArrivees > 0 ? totAttentes / totArrivees : 0);
      grandCompteParti = h.uGrandCompte < risque;
    }
    if (grandCompteParti && w >= GRAND_COMPTE.semaineDecision)
      perte += GRAND_COMPTE.nuitees * MARGE_NUITEE;

    coutCumule += etages;
    cout += etages;
    pertes += perte;
    clientsTotal += clients;
    defautsTotal += defauts;
    nonPretesTotal += nonPretes;
    perduesTotal += heuresPerdues;
    semaines.push({
      nonPretes,
      clientsAttente: clients,
      heuresPerdues,
      note,
      coutCumule,
      cout: etages + perte,
      defauts,
      heuresRenfort,
      heuresSup,
      // Les présents du matin : l'intérimaire de l'après-midi n'y est pas.
      presents:
        Math.max(1, equipe) + renforts.filter((x) => x.de === debut).reduce((s, x) => s + x.n, 0),
    });
  }

  // La note de fin mars pèse encore sur le trimestre suivant.
  const suite =
    (NOTE.reference - note) * 10 * NOTE.effet * nuiteesTrimestre * MARGE_NUITEE * NOTE.suite;
  pertes += suite;
  const derniere = semaines[SEMAINES]!;
  semaines[SEMAINES] = { ...derniere, cout: derniere.cout + suite };

  return {
    semaines,
    objectif: BUDGET - cout - pertes,
    cout,
    pertes,
    heuresInterim,
    clientsAttente: clientsTotal,
    defauts: defautsTotal,
    noteFinale: note,
    nonPretesMoyen: nonPretesTotal / SEMAINES,
    heuresPerduesMoyen: perduesTotal / SEMAINES,
    grandCompteParti,
    risqueGrandCompte: risque,
    adhesion: taux,
    complementaires: comp,
    carEnAvance: enAvance,
    groupeAttente,
    organisateurParti,
    heuresPerduesLundi: HEURES_PERDUES_LUNDI,
  };
}

/** Ce qui s'est passé pendant des semaines : le grand compte, le groupe, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    grandCompte: dans(GRAND_COMPTE.semaineDecision),
    grandCompteParti: t.grandCompteParti,
    groupe: dans(GROUPE.semaine),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEtages {
  nonPretes: number | null;
  clientsAttente: number | null;
  heuresPerdues: number | null;
  note: number | null;
  coutCumule: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  budgetADate: number | null;
  defauts: number | null;
  presents: number | null;
}

/** La situation du lundi de la semaine 1, d'après le lundi précédent. */
export const DEPART = {
  nonPretes: BILAN_LUNDI.nonPretes,
  clientsAttente: BILAN_LUNDI.clientsAttente * JOURS_CHARGES,
  heuresPerdues: HEURES_PERDUES_LUNDI,
} as const;

/** Ce que Djeneba lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEtages {
  if (semaine === 0) {
    return {
      nonPretes: DEPART.nonPretes,
      clientsAttente: DEPART.clientsAttente,
      heuresPerdues: DEPART.heuresPerdues,
      note: NOTE.depart,
      coutCumule: 0,
      budgetADate: 0,
      defauts: null,
      presents: EQUIPE,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    nonPretes: s.nonPretes,
    clientsAttente: s.clientsAttente,
    heuresPerdues: s.heuresPerdues,
    note: s.note,
    coutCumule: s.coutCumule,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    defauts: s.defauts,
    presents: s.presents,
  };
}
