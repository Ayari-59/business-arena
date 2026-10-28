/**
 * LE DIPLÔME QUI COMPTE : le modèle du recrutement des saisonniers de l'été
 * au Groupe Escale.
 *
 * On joue Noa Martin, en alternance au service des ressources humaines du
 * groupe, à Annecy : la personne qui trie les candidatures, propose les
 * affectations, place chacun dans la grille de salaires et répond aux
 * questions des saisonniers. Treize semaines, de juin à août, six décisions,
 * et quatre mécanismes que le joueur doit découvrir, qui sont ceux de la
 * question du programme de seconde : quelles relations entre le diplôme,
 * l'emploi et le salaire ?
 *
 *   · LE DIPLÔME PROTÈGE DU CHÔMAGE : CEUX QUI L'ONT SONT RARES. Les
 *     titulaires d'un CAP de cuisine trouvent presque tous un emploi ; en
 *     juin, il en reste peu sur le marché. Il faut aller les chercher là où
 *     ils sont, et les payer au niveau de leur diplôme.
 *   · LE DIPLÔME DIT UNE QUALIFICATION, QUE LE POSTE DEMANDE OU NON. Un
 *     titulaire du CAP à la plonge s'en va ; un candidat sans diplôme en
 *     cuisine rate des plats. Chacun à sa place, et une formation courte pour
 *     les postes qui n'en demandent pas.
 *   · LE SALAIRE SUIT LA GRILLE : LE DIPLÔME ET L'EXPÉRIENCE. Payer tout le
 *     monde au minimum fait partir les plus qualifiés ; négocier au cas par
 *     cas crée des injustices. L'expérience compte aussi, et peut se faire
 *     reconnaître.
 *   · LE RÉSEAU COMPTE AUSSI. La cooptation remplit vite les postes ; seule,
 *     elle recrute des amis sans la qualification demandée.
 *
 * Le trimestre est jugé en euros : ce que la saison a coûté (salaires, postes
 * vides, plats ratés, départs et remplacements, tensions), moins ce que
 * rapportent les saisonniers qui reviendront l'an prochain, comparé au budget
 * de la saison.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes, données et chiffres sont
 * fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LE TABLEAU DES DIPLÔMES (données fictives, inspirées des enquêtes publiques).
 * ------------------------------------------------------------------------- */
/** Le taux d'emploi trois ans après la sortie de formation, et le salaire net médian à l'embauche. */
export const TABLEAU_DES_DIPLOMES = [
  { diplome: "Sans diplôme", emploi: 0.45, salaire: 1350 },
  { diplome: "CAP ou BEP", emploi: 0.65, salaire: 1450 },
  { diplome: "Baccalauréat", emploi: 0.75, salaire: 1550 },
  { diplome: "Bac + 2 ou plus", emploi: 0.85, salaire: 1750 },
] as const;

/* ---------------------------------------------------------------------------
 * LA GRILLE DE SALAIRES DU GROUPE ESCALE (fictive).
 * ------------------------------------------------------------------------- */
/** Le salaire mensuel brut de chaque niveau : 1 sans diplôme, 2 avec un CAP, 3 avec un CAP et de l'expérience, ou une expérience reconnue. */
export const GRILLE = { niveau1: 1820, niveau2: 2000, niveau3: 2170 } as const;
/** Les cotisations patronales, et les semaines d'un mois. */
export const CHARGES = 1.35;
export const SEMAINES_PAR_MOIS = 4.33;
/** Ce qu'un salarié coûte par semaine, à son niveau. */
export const coutHebdo = (mensuel: number) =>
  (mensuel * CHARGES) / SEMAINES_PAR_MOIS;
export const SALAIRE_N1 = coutHebdo(GRILLE.niveau1);
export const SALAIRE_N2 = coutHebdo(GRILLE.niveau2);
export const SALAIRE_N3 = coutHebdo(GRILLE.niveau3);

/* ---------------------------------------------------------------------------
 * LES POSTES DE LA SAISON.
 * ------------------------------------------------------------------------- */
/** Les postes qualifiés de cuisine (commis, cuisiniers), et les postes sans qualification (plonge, ménage, aide en salle). */
export const POSTES_QUALIFIES = 14;
export const POSTES_SANS_QUALIFICATION = 26;
/** Un poste de cuisine vide : des couverts refusés, des heures supplémentaires pour les autres. */
export const COUT_POSTE_VIDE = 1500;
/** Un candidat sans CAP sur un poste de cuisine : des plats ratés, des retards, un risque d'accident. */
export const COUT_SANS_QUALIFICATION = 300;
/** Remplacer quelqu'un qui part : recruter, accueillir, former. */
export const COUT_REMPLACEMENT = 600;
/** Sur les postes sans qualification, une personne sur vingt part chaque semaine sans formation. */
export const DEPARTS_SANS_FORMATION = 0.05;
export const DEPARTS_AVEC_FORMATION = 0.02;
/** La formation courte d'une demi-journée, pour chaque poste sans qualification. */
export const COUT_FORMATION = 60;

/** Ce que chaque manière de chercher les cuisiniers donne en semaine 2 : CAP en poste, sans CAP en poste, postes vides, surcoût. */
export const RECHERCHE = [
  /** Une seule annonce pour tous les postes, sans diplôme demandé. */
  { cap: 6, sansCap: 6, vides: 2, surcout: 0 },
  /** Des étudiants sans CAP en cuisine, moins chers. */
  { cap: 2, sansCap: 12, vides: 0, surcout: 0 },
  /** Les titulaires du CAP dans les lycées hôteliers et les CFA, avec le salaire de la grille. */
  { cap: 12, sansCap: 1, vides: 1, surcout: 0 },
  /** Une agence d'intérim pour tous les cuisiniers : chaque intérimaire coûte plus cher. */
  { cap: 13, sansCap: 0, vides: 1, surcout: 120 },
] as const;

/** Ce que chaque manière d'affecter fait : CAP déplacés à la plonge, CAP remplacés par des moins chers, formation. */
export const AFFECTATION = [
  /** Le CAP sur les postes de cuisine, les autres sur la plonge et le ménage avec une formation courte. */
  { aLaPlonge: 0, remplaces: 0, formation: true },
  /** Le CAP partout, même à la plonge. */
  { aLaPlonge: 3, remplaces: 0, formation: false },
  /** Les moins chers partout. */
  { aLaPlonge: 0, remplaces: 3, formation: false },
  /** Le premier arrivé, sur le premier poste libre. */
  { aLaPlonge: 2, remplaces: 0, formation: false },
] as const;
/** Un titulaire du CAP à la plonge part au bout de trois semaines. */
export const SEMAINES_AVANT_DEPART = 3;

/** Ce que chaque manière de payer fait : salaire des CAP, départs des CAP par semaine, surcoût, tensions. */
export const SALAIRES = [
  /** Le minimum pour tous, diplôme ou pas. */
  { salaireCap: SALAIRE_N1, departs: 0.1, surcout: 0, tensions: 0 },
  /** Au cas par cas, selon qui insiste. */
  { salaireCap: SALAIRE_N2, departs: 0.03, surcout: 25, tensions: 300 },
  /** Plus pour les candidats recommandés par un salarié. */
  { salaireCap: SALAIRE_N2, departs: 0.03, surcout: 15, tensions: 250 },
  /** Chacun à son niveau dans la grille : le diplôme et l'expérience. */
  { salaireCap: SALAIRE_N2, departs: 0.01, surcout: 0, tensions: 0 },
] as const;

/* ---------------------------------------------------------------------------
 * LE RENFORT DE JUILLET ET LA COOPTATION (décision 4).
 * ------------------------------------------------------------------------- */
/** Les postes de renfort pour juillet et août : trois en cuisine, trois sans qualification. */
export const RENFORT_QUALIFIE = 3;
export const RENFORT_SANS_QUALIFICATION = 3;
export const COUT_POSTE_VIDE_SANS_QUALIFICATION = 900;
/** La prime de cooptation, par recrue. */
export const PRIME_DE_COOPTATION = 300;

/** Ce que chaque manière de recruter le renfort fait : semaine d'arrivée, part sans la qualification demandée, prime. */
export const RENFORT = [
  /** Seulement par cooptation : des amis des salariés. */
  { arrivee: 7, sansQualification: 0.6, prime: false },
  /** Interdire la cooptation. */
  { arrivee: 10, sansQualification: 0.1, prime: false },
  /** La cooptation parmi d'autres sources, avec les mêmes critères et la même grille pour tous. */
  { arrivee: 7, sansQualification: 0.1, prime: false },
  /** Une prime de cooptation sans critère. */
  { arrivee: 7, sansQualification: 0.35, prime: true },
] as const;

/* ---------------------------------------------------------------------------
 * LE CHEF DE PARTIE (décision 5).
 * ------------------------------------------------------------------------- */
/** Un chef de partie sans expérience : des services en retard, des plats renvoyés. */
export const COUT_CHEF_SANS_EXPERIENCE = 800;
/** Ce que chaque choix fait : coût de qualité, salaire en plus, départ, poste vide. */
export const CHEF = [
  /** Toujours le diplômé : Léa, CAP de juin, sans expérience, devient chef de partie. */
  { qualite: COUT_CHEF_SANS_EXPERIENCE, salaire: 0, part: false, vide: false },
  /** Un essai en cuisine pour les deux ; Karim au niveau 3 pour son expérience, la VAE proposée, Léa commis. */
  { qualite: 0, salaire: SALAIRE_N3 - SALAIRE_N1, part: false, vide: false },
  /** Karim, mais payé au niveau 1, comme un débutant sans diplôme. */
  { qualite: 0, salaire: 0, part: true, vide: false },
  /** Ne plus prendre que des expérimentés, et refuser les jeunes diplômés. */
  { qualite: 0, salaire: SALAIRE_N3 - SALAIRE_N1, part: false, vide: true },
] as const;
/** Karim, payé comme un débutant, s'en va en semaine 11. */
export const SEMAINE_DEPART_KARIM = 11;

/* ---------------------------------------------------------------------------
 * EXPLIQUER LE SALAIRE (décision 6), ET LE RETOUR L'AN PROCHAIN.
 * ------------------------------------------------------------------------- */
/** Un saisonnier qui revient l'an prochain : un recrutement et une formation de moins. */
export const VALEUR_D_UN_RETOUR = 800;
export const SAISONNIERS = POSTES_QUALIFIES + POSTES_SANS_QUALIFICATION;
/** Ce que chaque réponse fait : la part des saisonniers qui reviendront, le surcoût, les tensions. */
export const EXPLICATION = [
  /** « C'est comme ça. » */
  { retour: 0.35, surcout: 0, tensions: 200 },
  /** « Votre collègue a mieux négocié. » */
  { retour: 0.4, surcout: 0, tensions: 250 },
  /** Aligner sa paie sur celle du collègue, pour éviter le conflit : les autres demandent la même chose. */
  { retour: 0.5, surcout: 480, tensions: 300 },
  /** Montrer la grille : le niveau dépend du diplôme et de l'expérience ; dire comment progresser. */
  { retour: 0.6, surcout: 0, tensions: 0 },
] as const;

/* ---------------------------------------------------------------------------
 * LE JUGEMENT.
 * ------------------------------------------------------------------------- */
/** Le budget de la saison pour les saisonniers, fixé par la direction des ressources humaines. */
export const BUDGET = 360000;
export const OBJECTIF_VIDES = 2;
/** Au plus un poste de cuisine tenu par quelqu'un sans CAP, en moyenne. */
export const OBJECTIF_SANS_CAP = 1;
/** Les départs de la saison visés, au plus. */
export const OBJECTIF_DEPARTS = 12;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les meilleurs candidats signent ailleurs. */
export const PERTE_PAR_JOUR = 500;
/** Les candidatures reçues, et la part de titulaires du CAP : ce que la prévision demande. */
export const CANDIDATURES = 80;
export const PART_DE_CAP = 0.15;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  recherche: 0,
  affectation: 1,
  salaires: 2,
  renfort: 3,
  chef: 4,
  explication: 5,
} as const;

export const O = {
  recherche: { annonceUnique: 0, etudiants: 1, lyceesEtCfa: 2, interim: 3 },
  affectation: {
    chacunSaPlace: 0,
    capPartout: 1,
    moinsChers: 2,
    premierArrive: 3,
  },
  salaires: { minimum: 0, casParCas: 1, cooptesPlus: 2, grille: 3 },
  renfort: { cooptationSeule: 0, interdire: 1, parmiDautres: 2, prime: 3 },
  chef: {
    diplome: 0,
    essai: 1,
    experimentePayeDebutant: 2,
    experimentesSeulement: 3,
  },
  explication: { commeCa: 0, collegue: 1, aligner: 2, grille: 3 },
} as const;

/** Faire comme d'habitude, décision par décision. */
export const NEUTRE = [0, 3, 1, 0, 0, 0] as const;

/** La semaine où chaque décision commence à jouer. */
export const DEBUT = [2, 3, 5, 7, 9, 11] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent la saison quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: {
    /** Ajoute des départs de titulaires du CAP. */
    departsCap?: number;
    /** Multiplie le coût des postes vides. */
    vides?: number;
    /** Ajoute un coût, une fois. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "canicule",
    titre: "Canicule",
    de: "Aliénor Duchosal",
    role: "Directrice de L'Escale Annecy",
    texte: "Quarante degrés en cuisine : deux cuisiniers s'arrêtent, épuisés.",
    duree: 1,
    effet: { departsCap: 2 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent recrute",
    de: "Marwa Selmi",
    role: "Chargée de recrutement",
    texte:
      "Un grand hôtel de Megève propose plus cher aux cuisiniers du lac : un des nôtres part.",
    duree: 1,
    effet: { departsCap: 1 },
  },
  {
    id: "affluence",
    titre: "Affluence record",
    de: "Aliénor Duchosal",
    role: "Directrice de L'Escale Annecy",
    texte:
      "Le festival du lac remplit les hôtels : chaque poste vide coûte deux fois plus cher.",
    duree: 1,
    effet: { vides: 2 },
  },
  {
    id: "inspection",
    titre: "Contrôle de l'inspection du travail",
    de: "Mounir Belghazi",
    role: "Directeur des ressources humaines",
    texte:
      "L'inspection du travail contrôle les contrats des saisonniers : il faut reprendre plusieurs dossiers.",
    duree: 1,
    effet: { cout: 1500 },
  },
  {
    id: "logement",
    titre: "Logements des saisonniers",
    de: "Marwa Selmi",
    role: "Chargée de recrutement",
    texte:
      "Un propriétaire reprend un appartement loué aux saisonniers : il faut les reloger à l'hôtel.",
    duree: 1,
    effet: { cout: 2000 },
  },
];

/** Un ou deux imprévus par saison, à égalité de chances, entre la semaine 2 et la semaine 11. */
export const CHANCE_DEUX_IMPREVUS = 0.5;
export const PREMIERE_SEMAINE_IMPREVU = 2;
export const SEMAINES_POSSIBLES_IMPREVU = 10;

/** Le bruit : les titulaires du CAP parmi les candidatures varient de 20 %, la part qui revient de 10 %. */
export const BRUIT = {
  cap: { ecart: 0.2, min: 0.6, max: 1.4 },
  retour: { ecart: 0.1, min: 0.8, max: 1.2 },
} as const;
const bruite = (b: { ecart: number; min: number; max: number }, z: number) =>
  Math.min(b.max, Math.max(b.min, 1 + b.ecart * z));

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les titulaires du CAP parmi les candidatures reçues. */
  candidatsCap: number;
  retour: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 30011 + 67);
  const candidatsCap = Math.round(
    CANDIDATURES * PART_DE_CAP * bruite(BRUIT.cap, gauss(r)),
  );
  const retour = bruite(BRUIT.retour, gauss(r));
  const combien = r() < CHANCE_DEUX_IMPREVUS ? 2 : 1;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({
      imprevu,
      semaine:
        PREMIERE_SEMAINE_IMPREVU + Math.floor(r() * SEMAINES_POSSIBLES_IMPREVU),
    });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { candidatsCap, retour, imprevus };
  tirages.set(graine, h);
  return h;
}

export type Semaine = {
  /** Les titulaires du CAP sur les postes de cuisine. */
  cap: number;
  /** Les candidats sans CAP sur les postes de cuisine. */
  sansCap: number;
  /** Les postes vides, de cuisine et sans qualification. */
  vides: number;
  /** Les départs de la semaine. */
  departs: number;
  /** La masse salariale de la semaine. */
  salaires: number;
  cout: number;
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de la saison : positif, la saison a coûté moins que prévu. */
  objectif: number;
  couts: number;
  candidatsCap: number;
  departs: number;
  videsMoyens: number;
  sansCapMoyens: number;
  retours: number;
}

export function simuler(
  chemin: readonly number[],
  graine: number,
  jours = 0,
): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const joue = (d: number, w: number) => w >= DEBUT[d]!;
  const recherche = RECHERCHE[d1 as 0 | 1 | 2 | 3];
  const affectation = AFFECTATION[d2 as 0 | 1 | 2 | 3];
  const salaires = SALAIRES[d3 as 0 | 1 | 2 | 3];
  const renfort = RENFORT[d4 as 0 | 1 | 2 | 3];
  const chef = CHEF[d5 as 0 | 1 | 2 | 3];
  const explication = EXPLICATION[d6 as 0 | 1 | 2 | 3];

  const semaines: (Semaine | null)[] = [null];
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  // Avant l'arrivée des saisonniers, en semaine 1, les postes de cuisine sont vides.
  let cap = 0;
  let sansCap = 0;
  let vides = POSTES_QUALIFIES;
  let departsTotal = 0;
  let videsCumules = 0;
  let sansCapCumules = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    let cout = w === 1 ? couts : 0;
    let extra = 0;

    // L'arrivée des saisonniers, selon la manière de chercher.
    if (w === DEBUT[D.recherche]) {
      cap = recherche.cap;
      sansCap = recherche.sansCap;
      vides = recherche.vides;
    }
    // L'affectation : des CAP envoyés à la plonge, ou remplacés par des moins chers.
    if (w === DEBUT[D.affectation]) {
      const deplaces = Math.min(
        cap,
        affectation.aLaPlonge + affectation.remplaces,
      );
      cap -= deplaces;
      sansCap += deplaces;
      if (affectation.formation)
        extra += POSTES_SANS_QUALIFICATION * COUT_FORMATION;
    }
    let departs = 0;
    if (w === DEBUT[D.affectation] + SEMAINES_AVANT_DEPART) {
      departs += affectation.aLaPlonge;
      extra +=
        affectation.aLaPlonge *
        (COUT_REMPLACEMENT + COUT_POSTE_VIDE_SANS_QUALIFICATION);
    }

    // Les départs des titulaires du CAP, selon le salaire ; les remplaçants sont souvent sans CAP.
    let departsCap = joue(D.salaires, w)
      ? cap * salaires.departs
      : cap * SALAIRES[O.salaires.grille].departs;
    for (const a of actifs) departsCap += a.imprevu.effet.departsCap ?? 0;
    departsCap = Math.min(cap, departsCap);
    const melange = joue(D.renfort, w)
      ? renfort.sansQualification
      : RENFORT[O.renfort.parmiDautres].sansQualification;
    cap -= departsCap * melange;
    sansCap += departsCap * melange;
    departs += departsCap;
    extra += departsCap * (COUT_REMPLACEMENT + COUT_POSTE_VIDE);

    // Les départs sur les postes sans qualification.
    const formes = joue(D.affectation, w) && affectation.formation;
    const departsN =
      POSTES_SANS_QUALIFICATION *
      (formes ? DEPARTS_AVEC_FORMATION : DEPARTS_SANS_FORMATION);
    departs += departsN;
    extra += departsN * COUT_REMPLACEMENT;

    // Le renfort de juillet.
    let videsRenfort = 0;
    if (w >= DEBUT[D.renfort]) {
      if (w < renfort.arrivee) {
        videsRenfort = RENFORT_QUALIFIE;
        extra +=
          RENFORT_SANS_QUALIFICATION * COUT_POSTE_VIDE_SANS_QUALIFICATION;
      } else {
        if (w === renfort.arrivee && renfort.prime)
          extra +=
            (RENFORT_QUALIFIE + RENFORT_SANS_QUALIFICATION) *
            PRIME_DE_COOPTATION;
        extra +=
          RENFORT_QUALIFIE *
          renfort.sansQualification *
          COUT_SANS_QUALIFICATION;
        extra +=
          RENFORT_QUALIFIE * SALAIRE_N2 +
          RENFORT_SANS_QUALIFICATION * SALAIRE_N1;
      }
    }

    // Le chef de partie.
    if (joue(D.chef, w)) {
      extra += chef.qualite + chef.salaire;
      if (chef.part && w >= SEMAINE_DEPART_KARIM)
        extra += COUT_POSTE_VIDE + COUT_SANS_QUALIFICATION;
      if (chef.part && w === SEMAINE_DEPART_KARIM) extra += COUT_REMPLACEMENT;
      if (chef.vide) extra += COUT_POSTE_VIDE;
    }

    // Les tensions et les surcoûts de salaire.
    if (joue(D.salaires, w))
      extra += salaires.tensions + salaires.surcout * (cap + sansCap);
    if (joue(D.explication, w))
      extra += explication.tensions + explication.surcout;
    for (const a of actifs) extra += a.imprevu.effet.cout ?? 0;

    const salaireCap = joue(D.salaires, w) ? salaires.salaireCap : SALAIRE_N2;
    const masse =
      w >= DEBUT[D.recherche]
        ? cap * (salaireCap + recherche.surcout) +
          sansCap * SALAIRE_N1 +
          POSTES_SANS_QUALIFICATION * SALAIRE_N1
        : 0;
    const videsSemaine = vides + videsRenfort;
    const coutVides =
      videsSemaine *
      COUT_POSTE_VIDE *
      actifs.reduce((x, a) => x * (a.imprevu.effet.vides ?? 1), 1);
    const semaine =
      masse + coutVides + sansCap * COUT_SANS_QUALIFICATION + extra;
    couts += semaine;
    cout += semaine;
    departsTotal += departs;
    videsCumules += videsSemaine;
    sansCapCumules += sansCap;
    semaines.push({
      cap,
      sansCap,
      vides: videsSemaine,
      departs,
      salaires: masse,
      cout,
      couts,
    });
  }

  // Les saisonniers qui reviendront l'an prochain.
  const retours = SAISONNIERS * explication.retour * h.retour;
  return {
    semaines,
    objectif: BUDGET - couts + retours * VALEUR_D_UN_RETOUR,
    couts,
    candidatsCap: h.candidatsCap,
    departs: departsTotal,
    videsMoyens: videsCumules / SEMAINES,
    sansCapMoyens: sansCapCumules / SEMAINES,
    retours,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(
  chemin: readonly number[],
  graine: number,
  de: number,
  a: number,
) {
  const dans = (w: number) => w >= de && w <= a;
  const plonge =
    AFFECTATION[chemin[D.affectation] as 0 | 1 | 2 | 3].aLaPlonge > 0;
  return {
    departsDeLaPlonge:
      plonge && dans(DEBUT[D.affectation] + SEMAINES_AVANT_DEPART),
    departKarim:
      chemin[D.chef] === O.chef.experimentePayeDebutant &&
      dans(SEMAINE_DEPART_KARIM),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDeLaSaison {
  cap: number | null;
  sansCap: number | null;
  vides: number | null;
  departs: number | null;
  couts: number | null;
  budgetADate: number | null;
}

/** Ce que Noa lit à la fin d'une semaine ; les décisions à venir comptent comme « faire comme d'habitude ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDeLaSaison {
  if (semaine === 0) {
    return {
      cap: 0,
      sansCap: 0,
      vides: POSTES_QUALIFIES,
      departs: 0,
      couts: 0,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    cap: s.cap,
    sansCap: s.sansCap,
    vides: s.vides,
    departs: s.departs,
    couts: s.couts,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
