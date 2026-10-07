/**
 * L'INTÉRIM QUI FLAMBE — le modèle des remplacements de trois EHPAD de l'Association Solvanne.
 *
 * Chalon-sur-Saône, Beaune et Dijon-Grésilles : 250 places, et l'essentiel de
 * l'intérim de l'association. L'an dernier, Soralis Intérim Santé a facturé
 * 1,9 M€ à Solvanne, 60 % de plus que l'année d'avant, surtout des infirmiers
 * et des week-ends. Le CPOM impose un retour à l'équilibre. Le trimestre va de
 * janvier à mars, en pleine saison des épidémies. Quatre mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · L'INTÉRIM A TROIS CAUSES, QUI NE SE TRAITENT PAS PAREIL. Chaque poste de
 *     12 heures à remplacer vient d'un POSTE VACANT (prévisible des mois à
 *     l'avance), d'une ABSENCE IMPRÉVUE (maladie, enfant malade, la veille pour
 *     le lendemain) ou de CONGÉS (connus, mais posés trop tard sur des plannings
 *     publiés à quinze jours). L'intérim est la réponse par défaut à toutes
 *     les trois : c'est un symptôme. Un poste vacant se pourvoit, une absence
 *     imprévue se couvre par un pool interne, des congés se planifient.
 *   · UN POOL DE REMPLACEMENT NE PAIE QU'AU-DESSUS D'UN SEUIL. Un infirmier du
 *     pool coûte un salaire fixe, qu'il remplace ou non ; il ne paie que s'il
 *     évite assez de postes d'intérim : 60 % de sa capacité. Dimensionné sur le
 *     socle des absences imprévues, il est plein toute l'année ; dimensionné
 *     sur le pic de l'épidémie, il protège en février et reste à moitié vide
 *     d'avril à décembre.
 *   · INTERDIRE L'INTÉRIM LAISSE DES POSTES VIDES. Un plafond décidé par une
 *     note ne supprime pas l'absence : le poste reste vide, ou un agent est
 *     rappelé sur son repos. Les aides-soignants font des gestes d'infirmier
 *     (glissement de tâches), le risque d'événement indésirable grave monte
 *     (il est tiré au hasard, semaine par semaine), les équipes s'épuisent, les
 *     absences augmentent, et des soignants partent.
 *   · UN INTÉRIMAIRE COÛTE DEUX FOIS UN SALARIÉ, ET CONNAÎT MAL LES RÉSIDENTS.
 *     L'heure d'infirmier facturée 60 € contre 30 € chargés. Les remplaçants
 *     réguliers, eux, connaissent les résidents : ils acceptent un CDI, ou un
 *     CDD long, plus souvent quand le planning est publié tôt (tiré au hasard).
 *
 * Le trimestre est jugé en euros : l'écart à l'enveloppe de remplacement que
 * le CPOM fixe pour l'année. Le SURCOÛT DE REMPLACEMENT est ce que coûtent
 * l'intérim, les CDD, les heures majorées et le pool, moins les salaires que
 * les postes vacants ne versent pas (un poste vacant tenu en intérim ne coûte
 * que la différence). L'année est estimée ainsi : le surcoût réel du trimestre,
 * plus celui d'avril à décembre recalculé semaine par semaine avec ce qui est
 * en place en semaine 13 (postes pourvus, pool, plannings, contrats, tension
 * des équipes), sans épidémie et aux saisons ordinaires, plus les événements
 * du trimestre (événements indésirables graves, départs) et ceux qu'on peut
 * attendre ensuite, en espérance.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La durée annuelle du travail d'un temps plein, et un poste de jour en EHPAD. */
export const HEURES_AN = 1607;
export const HEURES_POSTE = 12;
/** Les postes de 12 heures qu'un temps plein tient en une semaine, en moyenne sur l'année. */
export const POSTES_PAR_ETP = HEURES_AN / HEURES_POSTE / 52;

export type Categorie = "ide" | "as";
export const CATEGORIES: readonly Categorie[] = ["ide", "as"];
type ParCategorie = Record<Categorie, number>;

/** L'heure d'un salarié, charges comprises. */
export const SALAIRE_HEURE: Readonly<ParCategorie> = { ide: 30, as: 23 };
/** L'heure facturée par Soralis Intérim Santé, tarif unique, week-ends compris. */
export const INTERIM_HEURE: Readonly<ParCategorie> = { ide: 60, as: 46 };
/** Les heures sur repos et les heures complémentaires des volontaires, majorées de 25 %. */
export const MAJORATION_HEURES = 1.25;
/** Un CDD : la prime de précarité et l'indemnité de congés payés, 10 % chacune. */
export const MAJORATION_CDD = 1.2;

const parPoste = (heure: number) => heure * HEURES_POSTE;
export const SALAIRE_POSTE: Readonly<ParCategorie> = {
  ide: parPoste(SALAIRE_HEURE.ide),
  as: parPoste(SALAIRE_HEURE.as),
};
export const INTERIM_POSTE: Readonly<ParCategorie> = {
  ide: parPoste(INTERIM_HEURE.ide),
  as: parPoste(INTERIM_HEURE.as),
};
export const HEURES_POSTE_COUT: Readonly<ParCategorie> = {
  ide: SALAIRE_POSTE.ide * MAJORATION_HEURES,
  as: SALAIRE_POSTE.as * MAJORATION_HEURES,
};
export const CDD_POSTE: Readonly<ParCategorie> = {
  ide: SALAIRE_POSTE.ide * MAJORATION_CDD,
  as: SALAIRE_POSTE.as * MAJORATION_CDD,
};

/** Le chiffre que la prévision demande : le surcoût annuel d'un poste d'infirmier tenu en intérim. */
export const SURCOUT_ANNUEL_IDE = (INTERIM_HEURE.ide - SALAIRE_HEURE.ide) * HEURES_AN;

/**
 * LE POOL DE REMPLACEMENT : des salariés en CDI, polyvalents entre les trois
 * EHPAD, qui ne tiennent aucun poste et remplacent les absences imprévues.
 * Leur coût annuel : le salaire, une prime de polyvalence de 150 € par mois et
 * les frais de déplacement. Leur capacité : 120 postes de 12 heures par an,
 * une fois leurs congés et leurs propres absences déduits.
 */
export const POOL_PRIME = 1800;
export const POOL_DEPLACEMENTS: Readonly<ParCategorie> = { ide: 1470, as: 759 };
export const POOL_AN: Readonly<ParCategorie> = {
  ide: SALAIRE_HEURE.ide * HEURES_AN + POOL_PRIME + POOL_DEPLACEMENTS.ide,
  as: SALAIRE_HEURE.as * HEURES_AN + POOL_PRIME + POOL_DEPLACEMENTS.as,
};
export const POOL_CAPACITE_AN = 120;
export const POOL_CAPACITE = POOL_CAPACITE_AN / 52;
/** Le seuil : le nombre de postes d'intérim qu'un membre du pool doit éviter par an pour payer. */
export const SEUIL_POOL: Readonly<ParCategorie> = {
  ide: POOL_AN.ide / INTERIM_POSTE.ide,
  as: POOL_AN.as / INTERIM_POSTE.as,
};
/** Les deux tailles proposées : sur le socle des absences, ou sur le pic de février. */
export const POOLS = {
  aucun: { ide: 0, as: 0 },
  socle: { ide: 3, as: 8 },
  pic: { ide: 6, as: 16 },
} as const;
/** Le pool du socle est opérationnel en semaine 5 ; celui du pic, deux fois plus gros, en semaine 6. */
export const DEBUT_POOL = { socle: 5, pic: 6 } as const;
/** Le renfort d'hiver : autant de remplaçants en plus, en CDD jusqu'à fin mars, à partir de la semaine 6. */
export const RENFORT = { ide: 3, as: 8, debut: 6 } as const;

/** Les besoins de remplacement des trois EHPAD, en postes de 12 heures par semaine. */
export const VACANTS_DEPART: Readonly<ParCategorie> = { ide: 4, as: 3 };
/** Les absences imprévues, hors épidémie : le socle. */
export const ABSENCES_SOCLE: Readonly<ParCategorie> = { ide: 7, as: 18 };
/** L'hiver ajoute 10 % au socle, l'épidémie un pic en février. */
export const HIVER = 1.1;
/** La forme de l'épidémie, semaine par semaine (pic en semaines 8 et 9). */
export const FORME_EPIDEMIE = [0, 0, 0, 0, 0, 0.15, 0.4, 0.75, 1, 1, 0.6, 0.3, 0.1, 0] as const;
export const EPIDEMIES = {
  faible: { nom: "faible", amplitude: 0.35, chance: 0.25 },
  moyenne: { nom: "moyenne", amplitude: 0.65, chance: 0.5 },
  forte: { nom: "forte", amplitude: 1, chance: 0.25 },
} as const;
export type Epidemie = keyof typeof EPIDEMIES;
/** Les congés à remplacer, par trimestre. */
export const CONGES = [
  { ide: 3, as: 7 },
  { ide: 3, as: 8 },
  { ide: 6, as: 15 },
  { ide: 3, as: 7 },
] as const;
/** Les absences imprévues d'avril à décembre, rapportées au socle. */
export const SAISONS = [1, 0.95, 1.1] as const;

/** La part des congés remplacés en interne, plannings à quinze jours ou à huit semaines. */
export const CONGES_INTERNES = { quinzeJours: 0.2, huitSemaines: 0.75, ete: 0.85 } as const;
/** La part des absences restantes que des volontaires couvrent en heures majorées. */
export const VOLONTAIRES = { appels: 0.12, bourse: 0.3 } as const;
/** Le taux de service de Soralis : la part des postes demandés qu'elle pourvoit. */
export const SERVICE = 0.93;
/** Au pic de l'épidémie, tous ses clients appellent en même temps. */
export const SERVICE_PIC = 0.12;
/** La note de la direction générale : l'intérim pour absences et congés, plafonné par semaine. */
export const PLAFOND: Readonly<ParCategorie> = { ide: 5, as: 12 };
/** Au-delà du plafond, ou quand Soralis ne trouve personne, une part est rappelée sur ses repos. */
export const PART_RAPPELEE = { plafond: 0.4, service: 0.3 } as const;
/** La cellule de remplacement du siège : une coordinatrice à mi-temps et la bourse aux remplacements. */
export const COORDINATION = 650;

export const TENSION_DEPART = 0.45;
/** Un événement indésirable grave : déclaration à l'ARS, enquête, mesures correctives, réclamation, admissions qui se tarissent. */
export const COUT_EI = 45000;
/** Un départ : fin de contrat, annonce, intégration du remplaçant ; le poste reste vacant ensuite. */
export const COUT_DEPART = 3000;
/** Les semaines où l'on constate les démissions : la fin des semaines 6 et 10. */
export const CONTROLES_DEPART = [6, 10] as const;
/** Une démission de la semaine w laisse le poste vacant à partir de w + 2 (préavis). */
export const PREAVIS = 2;

/** Les remplaçants réguliers : trois infirmiers de Soralis et deux vacataires, sur les postes vacants. */
export const REGULIERS = 5;
/**
 * La remise se paie en intérimaires : à tarif réduit, Soralis envoie ses réguliers chez les
 * clients qui paient plein tarif, et les trois infirmiers qui connaissent Chalon et
 * Beaune ne reviennent plus. Les nouveaux venus connaissent moins les résidents.
 */
export const REGULIERS_PERDUS = 3;
export const RISQUE_INCONNUS = 3;
export const ACCEPTE = {
  cdi: { base: 0.35, plannings: 0.25 },
  cdd: { base: 0.65, plannings: 0.25 },
} as const;
/** Ils prennent leur poste en CDI en semaine 8, en CDD de huit mois dès la semaine 6. */
export const DEBUT_CDI = 8;
export const DEBUT_CDD = 6;
export const DUREE_CDD = 34;
/** Le cabinet : deux recherches, une chance sur deux chacune, arrivée en semaine 12. */
export const CABINET = {
  recherches: 2,
  chance: 0.5,
  arrivee: 12,
  annonce: 1500,
  honoraires: 4000,
  prime: 5000,
} as const;

/** La négociation du tarif avec Soralis : −8 % une fois sur deux, sinon −5 %, contre l'exclusivité. */
export const REMISE_SORALIS = { chance: 0.5, forte: 0.08, faible: 0.05 } as const;
export const SERVICE_EXCLUSIVITE = { base: 0.03, pic: 0.08 } as const;

/** Le contrat-cadre proposé en mars : −10 % contre un volume minimal facturé d'avril à décembre. */
export const CONTRAT = { remise: 0.1, engagement: 600000, dedit: 0.3, service: 0.97 } as const;
/** Une deuxième agence référencée : la concurrence fait −3 %, et pourvoit un peu mieux. */
export const DEUXIEME_AGENCE = { remise: 0.02, frais: 4000 } as const;
/** Le suivi mensuel des recours par motif : les établissements cherchent d'abord en interne, et justifient chaque demande. */
export const SUIVI = { volontaires: 0.1, evites: 0.08 } as const;
/** La campagne des CDD d'été, en avril. */
export const CAMPAGNE_ETE = 2500;
/** Limiter les congés d'été à deux semaines : 30 % de congés à remplacer en moins l'été. */
export const LIMITE_CONGES = 0.7;
/** Ce que la limite coûte en départs attendus à l'été : des soignants qui partent faute de vraies vacances. */
export const DEPARTS_LIMITE: Readonly<ParCategorie> = { ide: 1, as: 1.5 };

/** L'enveloppe de surcoût de remplacement des trois EHPAD que le CPOM fixe pour l'année. */
export const ENVELOPPE = 1040000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un week-end de plus commandé à Soralis sans pilotage. */
export const PERTE_PAR_JOUR = 2000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  premiere: 0,
  pool: 1,
  vacants: 2,
  pic: 3,
  ete: 4,
  contrat: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 2, 1, 2, 3] as const;

/**
 * LES RECOURS DE L'AN DERNIER, par motif : les postes de 12 heures commandés à Soralis
 * dans une semaine ordinaire, plannings à quinze jours, quelques volontaires appelés,
 * et 93 % des demandes pourvues.
 */
export function recoursParMotif(c: Categorie) {
  const vacants = VACANTS_DEPART[c] * POSTES_PAR_ETP * SERVICE;
  const absences = ABSENCES_SOCLE[c] * (1 - VOLONTAIRES.appels) * SERVICE;
  const conges = CONGES[0]![c] * (1 - CONGES_INTERNES.quinzeJours) * SERVICE;
  const total = vacants + absences + conges;
  return { vacants, absences, conges, total, euros: total * INTERIM_POSTE[c] };
}
/** L'intérim facturé par semaine l'an dernier, dans les trois EHPAD : le point de départ. */
export const INTERIM_DEPART = recoursParMotif("ide").euros + recoursParMotif("as").euros;
/** L'association entière : 1,9 M€ l'an dernier, 60 % de plus que l'année d'avant. */
export const INTERIM_ASSOCIATION = 1900000;

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
    /** Des postes à remplacer en plus, par semaine. */
    ide?: number;
    as?: number;
    /** Les tarifs de l'intérim, multipliés, jusqu'à la fin de l'année. */
    tarif?: number;
    /** Un poste d'infirmier vacant de plus, deux semaines plus tard. */
    vacanceIde?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gastro",
    titre: "Gastro-entérite à Chalon",
    de: "Sigismond Ravanel",
    role: "Directeur de l'EHPAD de Chalon-sur-Saône",
    texte:
      "Une gastro-entérite touche deux unités de Chalon : résidents isolés en chambre, et des soignants malades à leur tour. Deux postes d'infirmier et six d'aide-soignant de plus à remplacer chaque semaine, pendant deux semaines.",
    duree: 2,
    effet: { ide: 2, as: 6 },
  },
  {
    id: "neige",
    titre: "Neige sur la côte et l'Auxois",
    de: "Adalgise Ansquer",
    role: "Directrice de l'EHPAD de Dijon-Grésilles",
    texte:
      "La neige bloque les routes deux jours : les soignants qui habitent loin ne peuvent pas venir. Trois postes d'infirmier et huit d'aide-soignant à remplacer en plus cette semaine.",
    duree: 1,
    effet: { ide: 3, as: 8 },
  },
  {
    id: "tarif",
    titre: "Soralis revalorise ses tarifs",
    de: "Ilinca Gautheron",
    role: "Responsable de l'agence Soralis Intérim Santé de Dijon",
    texte:
      "Suite à la revalorisation des salaires de la branche de l'intérim, nos tarifs augmentent de 3 % à compter de ce lundi, pour tous nos clients.",
    duree: 99,
    effet: { tarif: 1.03 },
  },
  {
    id: "mutation",
    titre: "Une infirmière de Beaune s'en va",
    de: "Guillemette Bouchardat",
    role: "Infirmière coordinatrice, EHPAD de Beaune",
    texte:
      "Une de nos infirmières suit son conjoint, muté à Besançon. Elle part dans deux semaines : un poste d'infirmier vacant de plus.",
    duree: 1,
    effet: { vacanceIde: 1 },
  },
  {
    id: "carneo",
    titre: "Panne de Carnéo",
    de: "Fulbert Ravignan",
    role: "Responsable des systèmes d'information, siège",
    texte:
      "Carnéo, le dossier de soins informatisé, est tombé deux jours : transmissions et plans de soins sur papier, puis tout à ressaisir. Deux postes d'infirmier de plus cette semaine.",
    duree: 1,
    effet: { ide: 2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des absences, semaine par semaine. */
  semaines: readonly (number | null)[];
  epidemie: Epidemie;
  /** Soralis accorde-t-elle −8 % ou −5 % ? */
  uSoralis: number;
  /** Chaque remplaçant régulier accepte-t-il ? */
  uReguliers: readonly number[];
  uCabinet: readonly number[];
  /** Un événement indésirable grave survient-il cette semaine ? */
  uEI: readonly number[];
  /** Les démissions, à chaque contrôle : un infirmier, un aide-soignant. */
  uDeparts: readonly { ide: number; as: number }[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000907 + 7);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push(Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))));
  }
  const e = r();
  const epidemie: Epidemie = e < 0.25 ? "faible" : e < 0.75 ? "moyenne" : "forte";
  const uSoralis = r();
  const uReguliers = Array.from({ length: REGULIERS }, () => r());
  const uCabinet = Array.from({ length: CABINET.recherches }, () => r());
  const uEI = Array.from({ length: SEMAINES + 1 }, () => r());
  const uDeparts = CONTROLES_DEPART.map(() => ({ ide: r(), as: r() }));
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, epidemie, uSoralis, uReguliers, uCabinet, uEI, uDeparts, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LES RÈGLES.
 * ------------------------------------------------------------------------- */

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La remise que Soralis accorde contre l'exclusivité, selon le hasard du trimestre. */
export const remiseSoralis = (graine: number) =>
  hasard(graine).uSoralis < REMISE_SORALIS.chance ? REMISE_SORALIS.forte : REMISE_SORALIS.faible;

/** La chance qu'un remplaçant régulier accepte : un planning publié tôt est ce qu'ils demandent. */
export function chanceDAccepter(chemin: readonly number[]): number {
  const plannings = chemin[D.premiere] === 2;
  const c = chemin[D.vacants] === 3 ? ACCEPTE.cdd : ACCEPTE.cdi;
  return c.base + (plannings ? c.plannings : 0);
}

/** Combien des cinq remplaçants réguliers acceptent, au plus autant que de postes vacants au départ. */
export function reguliersQuiAcceptent(chemin: readonly number[], graine: number): number {
  const v = chemin[D.vacants];
  if (v !== 0 && v !== 3) return 0;
  const p = chanceDAccepter(chemin);
  const perdus = chemin[D.premiere] === 1 ? REGULIERS_PERDUS : 0;
  const n = hasard(graine)
    .uReguliers.slice(perdus)
    .filter((u) => u < p).length;
  return Math.min(VACANTS_DEPART.ide, n);
}

/** Les recrues du cabinet, arrivées en semaine 12. */
export const recruesDuCabinet = (chemin: readonly number[], graine: number) =>
  chemin[D.vacants] === 1 ? hasard(graine).uCabinet.filter((u) => u < CABINET.chance).length : 0;

/**
 * Le risque hebdomadaire d'un événement indésirable grave dans les trois EHPAD. Un poste
 * vide pèse plus en pleine épidémie : des résidents malades à surveiller, à faire boire.
 */
export const risqueEI = (
  nonPourvusIde: number,
  nonPourvusAs: number,
  interimIde: number,
  epidemie = 0,
) =>
  Math.min(
    0.5,
    0.003 + (0.02 * nonPourvusIde + 0.005 * nonPourvusAs) * (1 + epidemie) + 0.0004 * interimIde,
  );

/** Le risque qu'un soignant épuisé démissionne, à chaque contrôle. */
export const risqueDeDepart = (tension: number) => borne(2.5 * (tension - 0.55), 0, 0.5);

/** Les absences imprévues montent avec la tension des équipes. */
export const effetTension = (tension: number) => 1 + 0.8 * Math.max(0, tension - TENSION_DEPART);

/* ---------------------------------------------------------------------------
 * UNE SEMAINE DE REMPLACEMENTS.
 * ------------------------------------------------------------------------- */

interface Politique {
  pool: ParCategorie;
  /** Ce que le pool coûte par semaine, qu'il remplace ou non. */
  poolCout: ParCategorie;
  volontaires: number;
  congesInternes: number;
  plafond: ParCategorie | null;
  service: number;
  tarif: number;
  /** Les postes de remplaçants réguliers en CDD sur les postes vacants. */
  cddVacants: number;
  /** La part des besoins d'absence allégée : soins non urgents reportés, animations suspendues. */
  allegement: number;
  /** Les intérimaires du pic sont-ils des remplaçants déjà venus ? */
  connus: boolean;
  /** La part des demandes d'intérim pour absences et congés que le suivi fait éviter. */
  evites: number;
}

interface Besoins {
  vacants: ParCategorie;
  absences: ParCategorie;
  conges: ParCategorie;
}

export interface Couverture {
  besoin: number;
  pool: number;
  poolCapacite: number;
  volontaires: number;
  rappels: number;
  cdd: number;
  interim: number;
  nonPourvus: number;
  /** Ce que coûtent intérim, CDD, heures majorées et pool. */
  depense: number;
  interimEuros: number;
  /** Les salaires que les postes vacants ne versent pas. */
  salairesNonVerses: number;
}

function couvrir(c: Categorie, b: Besoins, p: Politique): Couverture {
  const vac = b.vacants[c] * POSTES_PAR_ETP;
  const cdd = c === "ide" ? Math.min(vac, p.cddVacants * POSTES_PAR_ETP) : 0;
  const vacInterim = vac - cdd;
  const abs = b.absences[c] * (1 - p.allegement);
  const poolCapacite = p.pool[c] * POOL_CAPACITE;
  const poolAbs = Math.min(poolCapacite, abs);
  const resteAbs = abs - poolAbs;
  // Ses heures libres servent aux congés.
  const poolConges = Math.min(poolCapacite - poolAbs, b.conges[c]);
  const pool = poolAbs + poolConges;
  const volontaires = resteAbs * p.volontaires;
  const conges = b.conges[c] - poolConges;
  const congesInternes = conges * p.congesInternes;
  let demande = (resteAbs - volontaires + conges - congesInternes) * (1 - p.evites);
  let rappels = 0;
  let nonPourvus = 0;
  if (p.plafond) {
    const deborde = Math.max(0, demande - p.plafond[c]);
    rappels += deborde * PART_RAPPELEE.plafond;
    nonPourvus += deborde * (1 - PART_RAPPELEE.plafond);
    demande -= deborde;
  }
  demande += vacInterim;
  const interim = demande * p.service;
  const manque = demande - interim;
  rappels += manque * PART_RAPPELEE.service;
  nonPourvus += manque * (1 - PART_RAPPELEE.service);
  const interimEuros = interim * INTERIM_POSTE[c] * p.tarif;
  const depense =
    interimEuros +
    (volontaires + rappels) * HEURES_POSTE_COUT[c] +
    (cdd + congesInternes) * CDD_POSTE[c] +
    p.poolCout[c];
  return {
    besoin: vac + abs + b.conges[c],
    pool,
    poolCapacite,
    volontaires,
    rappels,
    cdd: cdd + congesInternes,
    interim,
    nonPourvus,
    depense,
    interimEuros,
    salairesNonVerses: vac * SALAIRE_POSTE[c],
  };
}

/** La tension des équipes : les postes vides et les rappels sur repos l'usent, l'organisation la soulage. */
function nouvelleTension(
  tension: number,
  ide: Couverture,
  as: Couverture,
  soulagement: number,
): number {
  const besoin = ide.besoin + as.besoin;
  const vides = (ide.nonPourvus + as.nonPourvus) / besoin;
  const rappels = (ide.rappels + as.rappels) / besoin;
  const volontaires = (ide.volontaires + as.volontaires) / besoin;
  return borne(
    tension + 0.3 * (vides - 0.04) + 0.45 * rappels + 0.05 * volontaires - 0.01 - soulagement,
    0.25,
    1,
  );
}

export type Semaine = {
  /** Le surcoût de remplacement de la semaine. */
  surcout: number;
  surcoutCumule: number;
  /** Ce que Soralis a facturé cette semaine. */
  interim: number;
  /** Les postes de 12 heures restés sans remplaçant. */
  nonPourvus: number;
  /** Les postes d'absence imprévue à remplacer. */
  absences: number;
  vacantsIde: number;
  /** La part de sa capacité que le pool a remplacée. */
  poolUtilisation: number;
  tension: number;
  rappels: number;
  /** Un événement indésirable grave cette semaine ? */
  ei: number;
  /** Ce que la semaine a coûté : surcoût et événements. */
  cout: number;
};

export interface Projection {
  /** Le surcoût de remplacement estimé d'avril à décembre. */
  surcout: number;
  /** Ce que Soralis facturerait d'avril à décembre. */
  interim: number;
  /** Les événements indésirables et départs attendus, en euros. */
  evenements: number;
  /** Le dédit du contrat-cadre, si le volume minimal n'est pas atteint. */
  dedit: number;
  /** La part de sa capacité que le pool remplacerait, en moyenne. */
  poolUtilisation: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart à l'enveloppe du CPOM sur l'année estimée : positif, l'association tient sa trajectoire. */
  objectif: number;
  surcoutTrimestre: number;
  interimTrimestre: number;
  evenementsTrimestre: number;
  projection: Projection;
  /** Le surcoût de remplacement estimé sur l'année, événements compris. */
  annee: number;
  epidemie: Epidemie;
  ei: number;
  departs: { ide: number; as: number };
  reguliers: number;
  recrues: number;
  remise: number;
  nonPourvus: number;
  vacantsFinal: number;
  tensionFinale: number;
  /** Le chiffre que la prévision de la semaine 1 demande, en k€. */
  surcoutAnnuelIde: number;
}

/** Les politiques de la semaine w, selon les décisions. */
function politique(
  chemin: readonly number[],
  graine: number,
  w: number,
  tarifImprevu: number,
  cddVacants: number,
): Politique {
  const [d1, d2, , d4, d5, d6] = chemin;
  const h = hasard(graine);
  const ep = EPIDEMIES[h.epidemie];
  const pic = w <= SEMAINES ? FORME_EPIDEMIE[w]! * ep.amplitude : 0;
  const auPic = w >= 7 && w <= 10;
  // Le pool.
  let pool: ParCategorie = { ...POOLS.aucun };
  if ((d2 === 1 || d2 === 3) && w >= DEBUT_POOL.socle) pool = { ...POOLS.socle };
  if (d2 === 2 && w >= DEBUT_POOL.pic) pool = { ...POOLS.pic };
  const poolCout: ParCategorie = {
    ide: (pool.ide * POOL_AN.ide) / 52,
    as: (pool.as * POOL_AN.as) / 52,
  };
  if (d2 === 3 && w >= RENFORT.debut && w <= SEMAINES) {
    pool = { ide: pool.ide + RENFORT.ide, as: pool.as + RENFORT.as };
    poolCout.ide += (RENFORT.ide * POOL_AN.ide * MAJORATION_CDD) / 52;
    poolCout.as += (RENFORT.as * POOL_AN.as * MAJORATION_CDD) / 52;
  }
  // Les volontaires et les congés.
  const bourse = d1 === 2 && w >= 2;
  let volontaires: number = bourse ? VOLONTAIRES.bourse : VOLONTAIRES.appels;
  let congesInternes: number =
    d1 === 2 && w >= 3 ? CONGES_INTERNES.huitSemaines : CONGES_INTERNES.quinzeJours;
  if (w > SEMAINES && d5 === 0 && w <= 39) congesInternes = CONGES_INTERNES.ete;
  if (w > SEMAINES && d6 === 1) volontaires += SUIVI.volontaires;
  let allegement = 0;
  let connus = false;
  if (auPic && d4 === 2) {
    volontaires += bourse ? 0.12 : 0.04;
    allegement = 0.08;
    connus = true;
    pool = { ide: pool.ide * 1.15, as: pool.as * 1.15 };
  }
  if (auPic && d4 === 0) allegement = 0.08;
  // Le plafond.
  let plafond: ParCategorie | null = d1 === 0 && w >= 2 ? { ...PLAFOND } : null;
  if (auPic && d4 !== 0) plafond = null;
  if (auPic && d4 === 0) plafond = { ide: 0, as: 0 };
  // Soralis.
  let service = SERVICE - SERVICE_PIC * pic;
  let tarif = tarifImprevu;
  if (d1 === 1 && w >= 3) {
    service -= SERVICE_EXCLUSIVITE.base + SERVICE_EXCLUSIVITE.pic * pic;
    tarif *= 1 - remiseSoralis(graine);
  }
  if (d6 === 0 && w >= 12) {
    tarif *= 1 - CONTRAT.remise;
    if (w > SEMAINES) service = CONTRAT.service;
  }
  if (d6 === 2 && w >= 12) {
    tarif *= 1 - DEUXIEME_AGENCE.remise;
  }
  return {
    pool,
    poolCout,
    volontaires,
    congesInternes,
    plafond,
    service: borne(service, 0.5, 0.99),
    tarif,
    cddVacants,
    allegement,
    connus,
    evites: w > SEMAINES && d6 === 1 ? SUIVI.evites : 0,
  };
}

/** Ce qui soulage les équipes chaque semaine : des plannings connus, un pool, des congés posés tôt. */
function soulagement(chemin: readonly number[], w: number): number {
  const [d1, d2, , , d5] = chemin;
  let s = 0;
  if (d1 === 2 && w >= 2) s += 0.012;
  if ((d2 === 1 || d2 === 3) && w >= DEBUT_POOL.socle) s += 0.01;
  if (d2 === 2 && w >= DEBUT_POOL.pic) s += 0.01;
  if (d5 === 0 && w >= 9) s += 0.006;
  if (d5 === 1 && w >= 9) s -= 0.008;
  return s;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const ep = EPIDEMIES[h.epidemie];
  const [d1, , d3, , d5, d6] = chemin;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const reguliers = reguliersQuiAcceptent(chemin, graine);
  const recrues = recruesDuCabinet(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const vacants: ParCategorie = { ...VACANTS_DEPART };
  const arrivees: { semaine: number; c: Categorie; n: number }[] = [];
  let tension = TENSION_DEPART;
  let tarif = 1;
  let surcoutCumule = 0;
  let interimTrimestre = 0;
  let evenements = perte;
  let ei = 0;
  let nonPourvusTotal = 0;
  const departs = { ide: 0, as: 0 };

  if (d3 === 0) arrivees.push({ semaine: DEBUT_CDI, c: "ide", n: -reguliers });
  if (d3 === 1) arrivees.push({ semaine: CABINET.arrivee, c: "ide", n: -recrues });
  for (const { imprevu, semaine } of h.imprevus) {
    if (imprevu.effet.vacanceIde) {
      arrivees.push({ semaine: semaine + PREAVIS, c: "ide", n: imprevu.effet.vacanceIde });
    }
  }

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    for (const a of actifs)
      if (a.semaine === w && a.imprevu.effet.tarif) tarif *= a.imprevu.effet.tarif;
    for (const a of arrivees) if (a.semaine === w) vacants[a.c] = Math.max(0, vacants[a.c] + a.n);
    const cddVacants = d3 === 3 && w >= DEBUT_CDD ? reguliers : 0;
    const p = politique(chemin, graine, w, tarif, cddVacants);

    const facteur =
      (HIVER + FORME_EPIDEMIE[w]! * ep.amplitude) * h.semaines[w]! * effetTension(tension);
    const absences: ParCategorie = {
      ide: ABSENCES_SOCLE.ide * facteur,
      as: ABSENCES_SOCLE.as * facteur,
    };
    for (const a of actifs) {
      absences.ide += a.imprevu.effet.ide ?? 0;
      absences.as += a.imprevu.effet.as ?? 0;
    }
    const b: Besoins = { vacants: { ...vacants }, absences, conges: { ...CONGES[0]! } };
    const ide = couvrir("ide", b, p);
    const as = couvrir("as", b, p);

    let cout = w === 1 ? perte : 0;
    let ponctuel = 0;
    if (d1 === 2 && w >= 2) ponctuel += COORDINATION;
    if (d3 === 1 && w === 5) ponctuel += CABINET.annonce;
    if (d3 === 1 && w === CABINET.arrivee)
      ponctuel += recrues * (CABINET.honoraires + CABINET.prime);
    if (d5 === 0 && w === 9) ponctuel += CAMPAGNE_ETE;
    if (d6 === 2 && w === 12) ponctuel += DEUXIEME_AGENCE.frais;
    const surcout =
      ide.depense + as.depense - ide.salairesNonVerses - as.salairesNonVerses + ponctuel;

    // L'événement indésirable grave, tiré au hasard sous le risque de la semaine.
    const risque = risqueEI(
      ide.nonPourvus,
      as.nonPourvus,
      ide.interim * (p.connus ? 0.5 : d1 === 1 && w >= 3 ? RISQUE_INCONNUS : 1),
      FORME_EPIDEMIE[w]! * ep.amplitude,
    );
    const grave = h.uEI[w]! < risque ? 1 : 0;
    ei += grave;
    tension = nouvelleTension(tension, ide, as, soulagement(chemin, w));
    // Les démissions, constatées en fin de semaines 6 et 10.
    const k = CONTROLES_DEPART.indexOf(w as 6 | 10);
    let depart = 0;
    if (k >= 0) {
      const u = h.uDeparts[k]!;
      for (const c of CATEGORIES) {
        if (u[c] < risqueDeDepart(tension)) {
          departs[c] += 1;
          depart += COUT_DEPART;
          arrivees.push({ semaine: w + PREAVIS, c, n: 1 });
        }
      }
    }
    const evenementsSemaine = grave * COUT_EI + depart;
    evenements += evenementsSemaine;
    surcoutCumule += surcout;
    interimTrimestre += ide.interimEuros + as.interimEuros;
    nonPourvusTotal += ide.nonPourvus + as.nonPourvus;
    cout += surcout + evenementsSemaine;
    semaines.push({
      surcout,
      surcoutCumule,
      interim: ide.interimEuros + as.interimEuros,
      nonPourvus: ide.nonPourvus + as.nonPourvus,
      absences: absences.ide + absences.as,
      vacantsIde: vacants.ide,
      poolUtilisation:
        ide.poolCapacite + as.poolCapacite > 0
          ? (ide.pool + as.pool) / (ide.poolCapacite + as.poolCapacite)
          : 0,
      tension,
      rappels: ide.rappels + as.rappels,
      ei: grave,
      cout,
    });
  }
  // Les arrivées et départs annoncés au-delà de la semaine 13 comptent dans l'année.
  for (const a of arrivees)
    if (a.semaine > SEMAINES) vacants[a.c] = Math.max(0, vacants[a.c] + a.n);

  const projection = projeter(chemin, graine, vacants, tension, tarif, reguliers);
  const annee =
    surcoutCumule + evenements + projection.surcout + projection.evenements + projection.dedit;
  return {
    semaines,
    objectif: ENVELOPPE - annee,
    surcoutTrimestre: surcoutCumule,
    interimTrimestre,
    evenementsTrimestre: evenements,
    projection,
    annee,
    epidemie: h.epidemie,
    ei,
    departs,
    reguliers,
    recrues,
    remise: chemin[D.premiere] === 1 ? remiseSoralis(graine) : 0,
    nonPourvus: nonPourvusTotal,
    vacantsFinal: vacants.ide,
    tensionFinale: tension,
    surcoutAnnuelIde: SURCOUT_ANNUEL_IDE / 1000,
  };
}

/**
 * D'AVRIL À DÉCEMBRE, EN ESPÉRANCE : les 39 semaines suivantes, recalculées
 * avec ce qui est en place en semaine 13, sans épidémie, aux saisons
 * ordinaires. Les événements indésirables et les départs y comptent pour ce
 * qu'on peut en attendre, pas pour un tirage.
 */
function projeter(
  chemin: readonly number[],
  graine: number,
  vacantsFin: ParCategorie,
  tensionFin: number,
  tarif: number,
  reguliers: number,
): Projection {
  const [, , d3, , d5, d6] = chemin;
  const vacants = { ...vacantsFin };
  let tension = tensionFin;
  let surcout = 0;
  let interim = 0;
  let evenements = 0;
  let pool = 0;
  let capacite = 0;
  for (let w = SEMAINES + 1; w <= 52; w += 1) {
    const q = Math.min(3, Math.floor((w - 1) / 13));
    const cddVacants = d3 === 3 && w < DEBUT_CDD + DUREE_CDD ? reguliers : 0;
    const p = politique(chemin, graine, w, tarif, cddVacants);
    const facteur = SAISONS[q - 1]! * effetTension(tension);
    const conges = { ...CONGES[q]! };
    if (d5 === 1 && q === 2) {
      conges.ide *= LIMITE_CONGES;
      conges.as *= LIMITE_CONGES;
    }
    const b: Besoins = {
      vacants: { ...vacants },
      absences: { ide: ABSENCES_SOCLE.ide * facteur, as: ABSENCES_SOCLE.as * facteur },
      conges,
    };
    if (d5 === 1 && w === 27) {
      for (const c of CATEGORIES) vacants[c] += DEPARTS_LIMITE[c];
      evenements += (DEPARTS_LIMITE.ide + DEPARTS_LIMITE.as) * COUT_DEPART;
    }
    const ide = couvrir("ide", b, p);
    const as = couvrir("as", b, p);
    surcout += ide.depense + as.depense - ide.salairesNonVerses - as.salairesNonVerses;
    interim += ide.interimEuros + as.interimEuros;
    pool += ide.pool + as.pool;
    capacite += ide.poolCapacite + as.poolCapacite;
    evenements += risqueEI(ide.nonPourvus, as.nonPourvus, ide.interim) * COUT_EI;
    tension = nouvelleTension(tension, ide, as, soulagement(chemin, w));
    // Les démissions attendues : le risque d'un contrôle, réparti sur les semaines.
    const departs = risqueDeDepart(tension) / 6.5;
    for (const c of CATEGORIES) vacants[c] += departs;
    evenements += 2 * departs * COUT_DEPART;
  }
  const dedit = d6 === 0 ? Math.max(0, CONTRAT.engagement - interim) * CONTRAT.dedit : 0;
  return {
    surcout,
    interim,
    evenements,
    dedit,
    poolUtilisation: capacite > 0 ? pool / capacite : 0,
  };
}

/** Ce qui s'est passé pendant des semaines : événements indésirables, démissions, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const ei: number[] = [];
  for (let w = de; w <= a && w <= SEMAINES; w += 1) if (t.semaines[w]!.ei) ei.push(w);
  return {
    ei,
    t,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** Les démissions d'un chemin, contrôle par contrôle. */
export function demissions(chemin: readonly number[], graine: number) {
  const h = hasard(graine);
  // On rejoue la tension jusqu'à chaque contrôle : c'est elle qui décide.
  const t = simuler(chemin, graine);
  return CONTROLES_DEPART.map((w, k) => {
    const tension = t.semaines[w]!.tension;
    const u = h.uDeparts[k]!;
    return {
      semaine: w,
      ide: u.ide < risqueDeDepart(tension),
      as: u.as < risqueDeDepart(tension),
    };
  });
}

export interface LectureInterim {
  surcoutCumule: number | null;
  interim: number | null;
  nonPourvus: number | null;
  absences: number | null;
  vacantsIde: number | null;
  budgetADate: number | null;
  /** Lus pour les messages et les sources. */
  tension: number | null;
  poolUtilisation: number | null;
  projectionInterim: number | null;
  epidemie: number | null;
  reguliers: number | null;
}

/** Ce que Cassien lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureInterim {
  if (semaine === 0) {
    return {
      surcoutCumule: 0,
      interim: INTERIM_DEPART,
      nonPourvus: 4,
      absences: (ABSENCES_SOCLE.ide + ABSENCES_SOCLE.as) * HIVER,
      vacantsIde: VACANTS_DEPART.ide,
      budgetADate: 0,
      tension: TENSION_DEPART,
      poolUtilisation: 0,
      projectionInterim: null,
      epidemie: null,
      reguliers: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    surcoutCumule: s.surcoutCumule,
    interim: s.interim,
    nonPourvus: s.nonPourvus,
    absences: s.absences,
    vacantsIde: s.vacantsIde,
    budgetADate: (ENVELOPPE * semaine) / 52,
    tension: s.tension,
    poolUtilisation: s.poolUtilisation,
    projectionInterim: t.projection.interim,
    epidemie: EPIDEMIES[t.epidemie].amplitude,
    reguliers: semaine >= 5 ? t.reguliers : 0,
  };
}
