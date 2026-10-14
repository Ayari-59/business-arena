/**
 * LA MARQUE DU DISTRIBUTEUR — le modèle de l'appel d'offres MDD d'Opaline.
 *
 * Opaline, deuxième client de la Laiterie de Kerbrélan, lance un appel
 * d'offres de deux ans pour le fromage blanc de sa marque propre : 4 200
 * tonnes par an, à un prix cible de 1,56 € le kilo, 22 % sous le prix de
 * cession du fromage blanc Kerbrélan. L'usine de Pontivy a de la capacité
 * libre sur le papier, et le directeur général veut « remplir l'usine ».
 * Naïm Lefeuvre, directeur des grands comptes et des MDD, porte la réponse.
 * Treize semaines (septembre à novembre), six décisions.
 *
 * Un contrat de deux ans se joue sur deux ans ; un épisode dure un trimestre.
 * Le trimestre est donc jugé sur la VALEUR DU DOSSIER ESTIMÉE EN SEMAINE 13,
 * en euros, sur les deux années du contrat (sans actualisation : sur deux ans,
 * elle ne changerait aucun classement) :
 *
 *   valeur = [si le contrat est gagné] marge sur coût variable du contrat
 *            − ce que le prix du lait en reprend, selon la clause de révision
 *            − la cellule MDD (frais fixes que le contrat ajoute vraiment)
 *            − le coût de décembre (renfort de capacité, ou ruptures)
 *            ± les emballages imprimés (économie de série, stock perdu)
 *          − la marge que Kerbrélan perd chez Opaline (le report vers la MDD,
 *            qui a lieu QUE LE CONTRAT SOIT GAGNÉ OU NON) et sa défense
 *          + la MDD de Celtis, si elle est signée
 *          − les dépenses du trimestre (dossier, étude, imprévus, enquête).
 *
 * Le point zéro est la situation d'avant l'appel d'offres. Ne pas répondre
 * n'est pas neutre : la MDD sort de toute façon, fabriquée par le Groupe
 * Nordal, et prend des ventes à Kerbrélan. Chaque semaine, l'estimation est
 * refaite avec ce que le trimestre a révélé : l'attribution (semaine 6), les
 * essais de Pontivy (semaine 5), la réponse d'Opaline sur les emballages
 * (semaine 8), le prix du lait annoncé par l'OP (semaine 10), sa nouvelle
 * charte MDD (semaine 12), le report mesuré (semaine 12 par l'étude, 13 par
 * les sorties de caisse). Ce qui n'est pas encore connu est pris en
 * espérance. Le hasard porte sur ce que le trimestre révèle, jamais sur les
 * règles du calcul.
 *
 * Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA MARGE DES VOLUMES AJOUTÉS, PAS LE COÛT COMPLET. Au prix cible, un
 *     kilo livré rapporte 10 centimes de marge sur coût variable (1,56 €
 *     moins 1,46 € de lait, ferments, emballage, énergie et transport). Le
 *     coût de revient complet (1,71 €) y ajoute 25 centimes de frais fixes de
 *     Pontivy, payés avec ou sans le contrat : refuser « parce qu'on vend sous
 *     le coût » laisse ces frais où ils sont. Mais « remplir l'usine pour
 *     absorber les frais fixes » ne crée rien de plus que la marge sur coût
 *     variable, moins les frais fixes que le contrat AJOUTE (la cellule MDD,
 *     un renfort de décembre, une équipe de nuit).
 *   · LA MDD PREND DES VENTES À KERBRÉLAN, que Kerbrélan la fabrique ou non.
 *     Le report dépend de l'écart de prix en rayon et de la sensibilité des
 *     acheteurs, que seule une étude chiffre. Une défense promotionnelle paie
 *     quand le report est fort, et se perd en effet d'aubaine sinon.
 *   · LE LAIT. Il fait les trois quarts du coût variable. Sans clause de
 *     révision indexée sur son prix, une hausse rend le contrat déficitaire ;
 *     le contrat type d'Opaline n'en révise que la part au-delà de 8 %, une
 *     fois par an.
 *   · LA CAPACITÉ RÉELLE. La capacité libre « affichée » de Pontivy est
 *     calculée à 75 % de TRS. Le TRS réel est de 70 %, et de 65 % en
 *     décembre, quand Kerbrélan est à son pic : au-delà, ruptures et
 *     pénalités. La DLC interdit de produire longtemps d'avance.
 *   · LE GROUPE NORDAL RÉPOND AUSSI. Son prix est tiré dans une fourchette
 *     que les sources permettent d'estimer ; Opaline retient le moins-disant.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La durée du contrat, en années. */
export const ANNEES = 2;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier se monte dans l'urgence, analyses et échantillons en express. */
export const PERTE_PAR_JOUR = 1500;
/** La valeur que le directeur général attend du dossier. */
export const OBJECTIF_VALEUR = 300_000;

/** Arrondir au dix-millième : les constantes en euros par kilo se lisent sans bruit de calcul. */
const net = (x: number, n = 4) => Math.round(x * 10 ** n) / 10 ** n;

/** Le prix de cession net du fromage blanc Kerbrélan chez Opaline, en euros par kilo. */
export const PRIX_MARQUE = 2;
export const REMISE_CIBLE = 0.22;
export const PRIX_CIBLE = net(PRIX_MARQUE * (1 - REMISE_CIBLE), 2);

/** Le lait d'un kilo de fromage blanc : litres-équivalents, crème et lactosérum valorisés déduits ; prix des 1 000 litres. */
export const LAIT = { litresParKg: 2.5, prix1000: 460 } as const;
export const COUT_LAIT_KG = net((LAIT.litresParKg * LAIT.prix1000) / 1000);

/** Le coût variable d'un kilo de fromage blanc MDD, poste par poste, en euros. */
export const CV = {
  lait: COUT_LAIT_KG,
  ferments: 0.06,
  emballage: 0.13,
  energie: 0.07,
  transport: 0.05,
} as const;
export const CV_USINE = net(CV.lait + CV.ferments + CV.emballage + CV.energie);
export const CV_LIVRE = net(CV_USINE + CV.transport);
export const MCV_CIBLE = net(PRIX_CIBLE - CV_LIVRE);
/** La prévision de la semaine 1, en centimes d'euro par kilo. */
export const MCV_CIBLE_CENTIMES = net(MCV_CIBLE * 100, 2);

/** Le contrat : tonnes par an ; la cellule MDD (une technicienne qualité, un planificateur, les analyses du plan de contrôle d'Opaline), par an ; le dossier de réponse. */
export const CONTRAT = { volume: 4200, cellule: 80_000, dossier: 18_000 } as const;
export const BESOIN_MOIS = CONTRAT.volume / 12;
/** La marge sur coût variable du contrat au prix cible, par an. */
export const MCV_CONTRAT_AN = net(MCV_CIBLE * CONTRAT.volume * 1000, 0);

/** Pontivy : ses frais fixes annuels (salaires mensualisés, amortissements, maintenance, structure) et son volume. */
export const PONTIVY = { fraisFixes: 9_200_000, volume: 36_800 } as const;
export const PART_FIXE = net(PONTIVY.fraisFixes / (PONTIVY.volume * 1000));
export const COUT_COMPLET = net(CV_LIVRE + PART_FIXE);
/** La « perte » que le contrôle de gestion voit au prix cible, en coût complet, par an. */
export const PERTE_EN_COUT_COMPLET = net((COUT_COMPLET - PRIX_CIBLE) * CONTRAT.volume * 1000, 0);
/** Le coût complet que le directeur général annonce, frais fixes répartis sur un Pontivy « rempli ». */
export const COUT_COMPLET_REMPLI = net(
  CV_LIVRE + PONTIVY.fraisFixes / ((PONTIVY.volume + CONTRAT.volume) * 1000),
);

/** Le fromage blanc Kerbrélan chez Opaline : tonnes par an, et l'emballage de marque. */
export const MARQUE = { volume: 2000, emballage: 0.15 } as const;
export const CV_MARQUE = net(CV.lait + CV.ferments + MARQUE.emballage + CV.energie + CV.transport);
export const MCV_MARQUE = net(PRIX_MARQUE - CV_MARQUE);

/** Le prix du Groupe Nordal, tiré entre ces bornes ; la variante (volumes de décembre plafonnés) pèse 1 % dans la comparaison d'Opaline. */
export const NORDAL = { min: 1.55, max: 1.65 } as const;
export const MALUS_VARIANTE = 0.01;
/** Les baisses du second tour : 4 %, 2 %, rien, rien (on lâche les conditions). */
export const BAISSES = [0.04, 0.02, 0, 0] as const;
export const ATTRIBUTION = 6;

/**
 * LE PRIX DU LAIT SUR LA DURÉE DU CONTRAT, par rapport aux 460 € d'aujourd'hui :
 * l'OP en dit la tendance en semaine 10.
 */
export const SCENARIOS_LAIT = [
  { id: "detente", nom: "Détente", chance: 0.3, variation: -0.04 },
  { id: "stable", nom: "Stabilité", chance: 0.4, variation: 0.02 },
  { id: "hausse", nom: "Hausse", chance: 0.3, variation: 0.1 },
] as const;
export const REVELATION_LAIT = 10;
/** Le contrat type : révision au 1er janvier, de la seule part de variation au-delà de 8 %. */
export const CLAUSE_TYPE = { tunnel: 0.08, retard: 0.5 } as const;
/** La clause indexée : révision trimestrielle automatique ; un trimestre de retard sur huit. */
export const CLAUSE_INDEXEE = { retard: 0.125 } as const;

/** La part de la variation du prix du lait que le contrat laisse à la laiterie. */
export function exposition(variation: number, indexee: boolean): number {
  if (indexee) return variation * CLAUSE_INDEXEE.retard;
  const auDela = Math.sign(variation) * Math.max(0, Math.abs(variation) - CLAUSE_TYPE.tunnel);
  return variation - auDela * CLAUSE_TYPE.retard;
}

/**
 * DÉCEMBRE À PONTIVY, par mois, en tonnes : la ligne de fromage frais.
 * Le planning compte la capacité à 75 % de TRS et le volume moyen de la marque ;
 * le réel, c'est 70 % en moyenne, 65 % en décembre (tiré autour), et la marque à son pic.
 */
export const LIGNE = {
  theorique: 1000,
  trsAffiche: 0.75,
  trsMoyen: 0.7,
  trsDecembre: 0.65,
  marqueMoyenne: 340,
  marqueDecembre: 430,
} as const;
export const LIBRE_AFFICHE = LIGNE.theorique * LIGNE.trsAffiche - LIGNE.marqueMoyenne;
export const LIBRE_MOYEN = LIGNE.theorique * LIGNE.trsMoyen - LIGNE.marqueMoyenne;
export const LIBRE_DECEMBRE = LIGNE.theorique * LIGNE.trsDecembre - LIGNE.marqueDecembre;
/** Les ventes de la MDD montent de 20 % en décembre ; la variante les plafonne au mois moyen. */
export const PIC_MDD = 1.2;
export const BESOIN_DECEMBRE = BESOIN_MOIS * PIC_MDD;
/** Une tonne qui manque en décembre : la marque servie après le contrat, sa marge perdue, les pénalités logistiques. */
export const RUPTURE = 700;
export const ESSAIS = 5;
/** Produire d'avance : 120 t en novembre ; Opaline exige les deux tiers de la DLC, 60 t seulement partent. */
export const AVANCE = { produit: 120, utile: 60, stockage: 25, recuperation: 0.35 } as const;
export const PERTE_DECLASSE = net(CV_USINE - AVANCE.recuperation);
/** Les mesures de décembre, par option : la capacité ajoutée et ce qu'elle coûte, par mois de décembre. */
export const MESURES = [
  { capacite: 0, cout: 0 },
  {
    capacite: AVANCE.utile,
    cout:
      AVANCE.produit * AVANCE.stockage + (AVANCE.produit - AVANCE.utile) * PERTE_DECLASSE * 1000,
  },
  { capacite: 130, cout: 50_000 },
  { capacite: 300, cout: 95_000 },
] as const;

/**
 * LES EMBALLAGES IMPRIMÉS aux couleurs d'Opaline : des séries plus longues coûtent
 * moins cher, mais si Opaline change sa charte, le stock en main part à la benne.
 */
export const EMBALLAGES = {
  /** Les mois de stock commandés, par option ; l'option 2 en commande six avec une clause de reprise. */
  mois: [6, 2, 6, 12],
  economie: [0.008, 0, 0.008, 0.011],
  chanceCharte: 0.5,
  chanceReprise: 0.75,
  reponse: 8,
  charte: 12,
} as const;
/** Le stock perdu si la charte change : en moyenne, la moitié du stock commandé. */
export const stockPerdu = (mois: number) => (mois / 2) * BESOIN_MOIS * CV.emballage * 1000;
export const economieEmballage = (parKg: number) => parKg * CONTRAT.volume * ANNEES * 1000;

/**
 * LE REPORT DE KERBRÉLAN VERS LA MDD : la part de ses acheteurs qui passe à la
 * MDD, égale à leur sensibilité au prix multipliée par l'écart de prix en rayon.
 * Une défense promotionnelle (opérations en magasin, mise en avant, coopération
 * commerciale) en retient une part d'autant plus grande que la clientèle est
 * sensible au prix ; face à une clientèle fidèle, elle se perd en effet
 * d'aubaine. La cheffe de marque a déjà prévu un plan pour le lancement.
 */
export const REPORT = {
  sensibilites: [0.4, 0.7, 1.1],
  etude: 12_000,
  lancement: 12,
  resultats: 12,
  premiersChiffres: 13,
  /** L'étude dit aussi où le report se fait (magasins, formats) : une défense ciblée retient 8 points de plus. */
  ciblage: 0.08,
} as const;
/** Les défenses de Kerbrélan chez Opaline : renforcée, prévue, aucune ; coût par an, part du report retenue selon la sensibilité. */
export const DEFENSES = [
  { id: "renforcee", cout: 100_000, efficacite: [0.15, 0.55, 0.85] },
  { id: "prevue", cout: 50_000, efficacite: [0.1, 0.45, 0.55] },
  { id: "aucune", cout: 0, efficacite: [0, 0, 0] },
] as const;
/** La défense retenue, par option et par sensibilité : l'étude choisit au vu du report mesuré. */
export function defense(d5: number, sensibilite: number): number {
  if (d5 === 0) return 0;
  if (d5 === 1) return 1;
  if (d5 === 3) return 2;
  return sensibilite === 2 ? 0 : sensibilite === 1 ? 1 : 2;
}
export const ecartEnRayon = (prixMdd: number) => 1 - prixMdd / PRIX_MARQUE;
/** La marge que Kerbrélan perd sur les deux ans, pour une sensibilité et un prix de MDD. */
export const perteMarque = (sensibilite: number, prixMdd: number, retenue = 0) =>
  sensibilite * ecartEnRayon(prixMdd) * (1 - retenue) * MARQUE.volume * MCV_MARQUE * 1000 * ANNEES;

/** Celtis veut aussi sa MDD : tonnes par an, son prix, la contre-proposition, l'équipe de nuit qu'il faudrait si Pontivy produit déjà Opaline. */
export const CELTIS = {
  volume: 2500,
  prix: 1.52,
  contre: 1.62,
  chance: 0.5,
  equipeNuit: 300_000,
} as const;
/** La valeur de la MDD de Celtis sur deux ans, à un prix, selon que Pontivy produit Opaline ou non. */
export const valeurCeltis = (prix: number, avecOpaline: boolean) =>
  ((prix - CV_LIVRE) * CELTIS.volume * 1000 - (avecOpaline ? CELTIS.equipeNuit : CONTRAT.cellule)) *
  ANNEES;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  reponse: 0,
  prix: 1,
  decembre: 2,
  emballages: 3,
  marque: 4,
  celtis: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;

/** Ne rien changer, décision par décision : ne pas répondre, tenir, tenir le plan, au fil de l'eau, le plan de marque prévu, refuser. */
export const NEUTRE = [1, 2, 0, 1, 1, 1] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: {
    /** Ce que l'imprévu coûte au trimestre, en euros. */
    cout?: number;
    /** Ce qu'il ajoute à la variation du prix du lait sur la durée du contrat. */
    lait?: number;
    /** La part des ventes Kerbrélan de la semaine perdue. */
    ventes?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "froid",
    titre: "Panne d'un compresseur de la chambre froide",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "Un compresseur de la chambre froide de Pontivy a lâché dans la nuit : la température a dépassé la limite pendant trois heures. Par précaution, les deux lots concernés sont bloqués puis détruits. 14 k€ de produits et d'analyses.",
    effet: { cout: 14_000 },
  },
  {
    id: "kerfroid",
    titre: "Grève chez les Transports Kerfroid",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Les chauffeurs des Transports Kerfroid sont en grève depuis mardi : trois jours de livraisons décalées chez Celtis et Opaline, et les pénalités logistiques qui vont avec. 9 k€.",
    effet: { cout: 9_000 },
  },
  {
    id: "spot",
    titre: "Le lait spot s'envole",
    de: "Hoel Quiniou",
    role: "Responsable de la collecte",
    texte:
      "Le prix du lait spot a pris 15 % en trois semaines, tiré par le beurre et la poudre. Les indicateurs de l'OP suivront en partie : comptez un point et demi de plus sur le prix du lait des deux ans à venir, quel que soit le scénario.",
    effet: { lait: 0.015 },
  },
  {
    id: "doseuse",
    titre: "Casse de la doseuse de la ligne de fromage frais",
    de: "Fanchon Lozac'h",
    role: "Directrice de l'usine de Pontivy",
    texte:
      "Le moteur de la doseuse de la ligne de fromage frais a cassé : deux jours d'arrêt, le temps de recevoir la pièce. Kerbrélan a manqué en rayon une partie de la semaine. 16 k€ de marge perdue.",
    effet: { cout: 16_000, ventes: 0.2 },
  },
  {
    id: "ddpp",
    titre: "Contrôle de la DDPP à Pontivy",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "La DDPP a contrôlé Pontivy deux jours : une non-conformité mineure sur l'enregistrement d'un nettoyage en place, corrigée sur-le-champ. Elle demande une campagne d'analyses environnementales supplémentaires : 6 k€.",
    effet: { cout: 6_000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart des ventes Kerbrélan de chaque semaine (indices 1 à 13). */
  bruit: readonly number[];
  /** Le prix du Groupe Nordal, en euros par kilo. */
  nordal: number;
  /** Le scénario du prix du lait : 0 détente, 1 stabilité, 2 hausse. */
  lait: number;
  /** Le TRS de la ligne en décembre. */
  trsDecembre: number;
  /** Opaline change-t-elle sa charte MDD ? Accepte-t-elle la clause de reprise ? */
  uCharte: number;
  uReprise: number;
  /** La sensibilité au prix des acheteurs de Kerbrélan : 0 faible, 1 moyenne, 2 forte. */
  sensibilite: number;
  /** Celtis accepte-t-il la contre-proposition ? */
  uCeltis: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001081 + 7);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.04 * gauss(r), -0.1, 0.1));
  const nordal = NORDAL.min + r() * (NORDAL.max - NORDAL.min);
  const ul = r();
  const [a, b] = [SCENARIOS_LAIT[0].chance, SCENARIOS_LAIT[1].chance];
  const lait = ul < a ? 0 : ul < a + b ? 1 : 2;
  const trsDecembre = borne(LIGNE.trsDecembre + 0.025 * gauss(r), 0.6, 0.7);
  const uCharte = r();
  const uReprise = r();
  const sensibilite = Math.min(2, Math.floor(r() * 3));
  const uCeltis = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((x, y) => x.semaine - y.semaine);
  const h: Hasard = {
    bruit,
    nordal,
    lait,
    trsDecembre,
    uCharte,
    uReprise,
    sensibilite,
    uCeltis,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * L'OFFRE, ET CE QU'OPALINE EN FAIT.
 * ------------------------------------------------------------------------- */

export interface Offre {
  repondu: boolean;
  /** Le prix offert, en euros par kilo. */
  prix: number;
  clause: boolean;
  plafond: boolean;
  /** Le prix tel qu'Opaline le compare à celui de Nordal. */
  compare: number;
}

/** L'offre déposée au second tour, selon les deux premières décisions. */
export function offre(d1: number, d2: number): Offre {
  const repondu = d1 !== 1;
  const base = d1 === 3 ? COUT_COMPLET : PRIX_CIBLE;
  const prix = net(base * (1 - (BAISSES[d2] ?? 0)));
  const conditions = d1 === 2 && d2 !== 3;
  return {
    repondu,
    prix,
    clause: conditions,
    plafond: conditions,
    compare: prix * (conditions ? 1 + MALUS_VARIANTE : 1),
  };
}

/** La chance de gagner, vue avant l'attribution : celle que Nordal soit plus cher. */
export const chanceDeGagner = (o: Offre) =>
  o.repondu ? borne((NORDAL.max - o.compare) / (NORDAL.max - NORDAL.min), 0, 1) : 0;

/** Opaline retient le moins-disant. */
export const gagne = (chemin: readonly number[], graine: number) => {
  const o = offre(chemin[D.reponse]!, chemin[D.prix]!);
  return o.repondu && o.compare <= hasard(graine).nordal;
};

/** Le prix moyen de Nordal quand il l'emporte contre cette offre. */
const nordalQuandIlGagne = (o: Offre) =>
  o.repondu
    ? (NORDAL.min + borne(o.compare, NORDAL.min, NORDAL.max)) / 2
    : (NORDAL.min + NORDAL.max) / 2;

export const repriseAcceptee = (graine: number) =>
  hasard(graine).uReprise < EMBALLAGES.chanceReprise;
export const charteChange = (graine: number) => hasard(graine).uCharte < EMBALLAGES.chanceCharte;
export const celtisAccepte = (graine: number) => hasard(graine).uCeltis < CELTIS.chance;

/* ---------------------------------------------------------------------------
 * LA VALEUR DU DOSSIER, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

/** Ce que vaut le contrat, s'il est gagné, une fois ses aléas connus. */
export interface ValeurContrat {
  mcv: number;
  lait: number;
  cellule: number;
  decembre: number;
  emballages: number;
  total: number;
}

/** La valeur du contrat gagné, pour un prix du lait, un TRS de décembre et une charte donnés. */
export function valeurDuContrat(o: {
  prix: number;
  clause: boolean;
  plafond: boolean;
  variation: number;
  trsDecembre: number;
  mesure: number;
  emballages: number;
  reprise: boolean;
  charte: boolean;
}): ValeurContrat {
  const volume = CONTRAT.volume - (o.plafond ? BESOIN_MOIS * (PIC_MDD - 1) : 0);
  const mcv = (o.prix - CV_LIVRE) * volume * 1000 * ANNEES;
  const lait = -exposition(o.variation, o.clause) * COUT_LAIT_KG * volume * 1000 * ANNEES;
  const cellule = -CONTRAT.cellule * ANNEES;
  const libre = LIGNE.theorique * o.trsDecembre - LIGNE.marqueDecembre;
  const besoin = BESOIN_MOIS * (o.plafond ? 1 : PIC_MDD);
  const m = MESURES[o.mesure]!;
  const manque = Math.max(0, besoin - libre - m.capacite);
  const decembre = -(m.cout + manque * RUPTURE) * ANNEES;
  // Les emballages : la clause de reprise, si Opaline l'accepte ; sinon, deux mois à la fois.
  const k = o.emballages === 2 && !o.reprise ? 1 : o.emballages;
  const protege = o.emballages === 2 && o.reprise;
  const emballages =
    economieEmballage(EMBALLAGES.economie[k]!) -
    (o.charte && !protege ? stockPerdu(EMBALLAGES.mois[k]!) : 0);
  return {
    mcv,
    lait,
    cellule,
    decembre,
    emballages,
    total: mcv + lait + cellule + decembre + emballages,
  };
}

/** Ce qui manque en décembre, en tonnes, pour une offre, un TRS et une mesure. */
export function manqueEnDecembre(plafond: boolean, trs: number, mesure: number): number {
  const libre = LIGNE.theorique * trs - LIGNE.marqueDecembre;
  const besoin = BESOIN_MOIS * (plafond ? 1 : PIC_MDD);
  return Math.max(0, besoin - libre - MESURES[mesure]!.capacite);
}

export interface Estimation {
  total: number;
  /** La valeur du contrat Opaline, pondérée par la chance de le gagner tant qu'elle n'est pas connue. */
  contrat: number;
  /** La marge que Kerbrélan perd chez Opaline, défense comprise. */
  marque: number;
  celtis: number;
  /** Les dépenses du trimestre. */
  depenses: number;
  offre: Offre;
  /** La chance d'avoir le contrat, telle qu'on la voit cette semaine. */
  chance: number;
  /** La marge sur coût variable attendue par kilo, lait compris, en centimes. */
  mcvKg: number;
  /** Ce qui manque en décembre, en tonnes, tel que le planning le voit cette semaine. */
  manque: number;
  /** Le report attendu des acheteurs de Kerbrélan, défense comprise. */
  report: number;
  /** Ce que la défense de Kerbrélan coûte par an (en espérance avant l'étude). */
  promo: number;
}

/** Ce que l'on sait en fin de semaine w ; le reste est pris en espérance. */
export function estimer(
  chemin: readonly number[],
  graine: number,
  w: number,
  jours: number,
): Estimation {
  const h = hasard(graine);
  const opt = (k: number) => (w >= EFFET[k]! ? chemin[k]! : NEUTRE[k]!);
  const [d1, d2, d3, d4, d5, d6] = [0, 1, 2, 3, 4, 5].map(opt) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const o = offre(d1, d2);
  const tombe = (id: string) => h.imprevus.some((i) => i.imprevu.id === id && i.semaine <= w);

  // Les dépenses du trimestre, engagées quoi qu'il arrive.
  let depenses = w >= 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
  if (o.repondu && w >= 2) depenses += CONTRAT.dossier;
  if (d5 === 2) depenses += REPORT.etude;
  for (const i of h.imprevus) if (i.semaine <= w) depenses += i.imprevu.effet.cout ?? 0;

  // L'attribution : une chance avant la semaine 6, un fait ensuite.
  const connu = w >= ATTRIBUTION;
  const chance = connu ? (gagne([d1, d2], graine) ? 1 : 0) : chanceDeGagner(o);

  // Le prix du lait : la tendance de l'OP en semaine 10, l'espérance avant.
  const enPlus = tombe("spot") ? IMPREVUS.find((i) => i.id === "spot")!.effet.lait! : 0;
  const poidsLait =
    w >= REVELATION_LAIT
      ? SCENARIOS_LAIT.map((_, i) => (i === h.lait ? 1 : 0))
      : SCENARIOS_LAIT.map((s) => s.chance);
  const trs = w >= ESSAIS ? h.trsDecembre : LIGNE.trsDecembre;
  const reprise =
    w >= EMBALLAGES.reponse ? (repriseAcceptee(graine) ? 1 : 0) : EMBALLAGES.chanceReprise;
  const charte = w >= EMBALLAGES.charte ? (charteChange(graine) ? 1 : 0) : EMBALLAGES.chanceCharte;

  let contrat = 0;
  let mcvKg = 0;
  if (o.repondu) {
    for (const [i, s] of SCENARIOS_LAIT.entries()) {
      const p = poidsLait[i]!;
      if (p === 0) continue;
      const variation = s.variation + enPlus;
      mcvKg += p * (o.prix - CV_LIVRE - exposition(variation, o.clause) * COUT_LAIT_KG) * 100;
      for (const [rep, pr] of [
        [true, reprise],
        [false, 1 - reprise],
      ] as const) {
        for (const [ch, pc] of [
          [true, charte],
          [false, 1 - charte],
        ] as const) {
          if (pr === 0 || pc === 0) continue;
          contrat +=
            p *
            pr *
            pc *
            valeurDuContrat({
              prix: o.prix,
              clause: o.clause,
              plafond: o.plafond,
              variation,
              trsDecembre: trs,
              mesure: d3,
              emballages: d4,
              reprise: rep,
              charte: ch,
            }).total;
        }
      }
    }
    contrat *= chance;
  } else {
    mcvKg = MCV_CIBLE * 100;
  }

  // Le report : la MDD sort en semaine 12, quel que soit son fabricant.
  const prixGagnant = connu
    ? chance === 1
      ? o.prix
      : h.nordal
    : chance * o.prix + (1 - chance) * nordalQuandIlGagne(o);
  const sConnue =
    w >= REPORT.premiersChiffres || (d5 === 2 && w >= REPORT.resultats) ? h.sensibilite : null;
  const poidsS = REPORT.sensibilites.map((_, i) =>
    sConnue === null ? 1 / REPORT.sensibilites.length : i === sConnue ? 1 : 0,
  );
  let marque = 0;
  let report = 0;
  let promo = 0;
  for (const [i, s] of REPORT.sensibilites.entries()) {
    const p = poidsS[i]!;
    if (p === 0) continue;
    const k = defense(d5, i);
    const def = DEFENSES[k]!;
    const retenue = def.efficacite[i]! + (d5 === 2 && def.cout > 0 ? REPORT.ciblage : 0);
    marque -= p * (perteMarque(s, prixGagnant, retenue) + def.cout * ANNEES);
    report += p * s * ecartEnRayon(prixGagnant) * (1 - retenue);
    promo += p * def.cout;
  }

  // Celtis : la réponse tombe dès la décision ; Pontivy doit-il passer en nuit ?
  let celtis = 0;
  if (d6 === 0)
    celtis =
      chance * valeurCeltis(CELTIS.prix, true) + (1 - chance) * valeurCeltis(CELTIS.prix, false);
  if (d6 === 2 && celtisAccepte(graine)) {
    celtis =
      chance * valeurCeltis(CELTIS.contre, true) +
      (1 - chance) * valeurCeltis(CELTIS.contre, false);
  }

  const manque = o.repondu ? (w >= ESSAIS ? manqueEnDecembre(o.plafond, trs, d3) : 0) : 0;
  return {
    total: contrat + marque + celtis - depenses,
    contrat,
    marque,
    celtis,
    depenses,
    offre: o,
    chance,
    mcvKg,
    manque,
    report,
    promo,
  };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur du dossier estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** La chance d'avoir le contrat : 1 ou 0 après l'attribution. */
  chance: number;
  /** La marge sur coût variable attendue par kilo, lait compris, en centimes. */
  mcvKg: number;
  /** Ce qui manque en décembre, en tonnes. */
  manque: number;
  /** Les ventes Kerbrélan chez Opaline dans la semaine, en tonnes. */
  kerbrelan: number;
  /** Les dépenses du trimestre, cumulées. */
  depenses: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  chemin: readonly number[];
  /** La valeur du dossier estimée en semaine 13, en euros. */
  objectif: number;
  offre: Offre;
  gagne: boolean;
  /** Le prix du Groupe Nordal. */
  nordal: number;
  lait: number;
  trsDecembre: number;
  /** Ce qui manque en décembre, mesure prise, en tonnes. */
  manque: number;
  /** Les composantes de la valeur en semaine 13. */
  contrat: number;
  marque: number;
  celtis: number;
  depenses: number;
  /** Le report mesuré des acheteurs de Kerbrélan, défense comprise. */
  report: number;
  /** La défense de Kerbrélan retenue : 0 renforcée, 1 prévue, 2 aucune. */
  defense: number;
  sensibilite: number;
  repriseAcceptee: boolean;
  charteChange: boolean;
  celtisSigne: boolean;
  /** La marge sur coût variable par kilo, lait compris, en centimes, s'il est gagné. */
  mcvKg: number;
}

/** Les ventes hebdomadaires de Kerbrélan chez Opaline, avant la MDD. */
export const VENTES_SEMAINE = MARQUE.volume / 52;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = estimer(chemin, graine, 0, jours).total;
  let derniere: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    let ventes = VENTES_SEMAINE * (1 + h.bruit[w]!);
    if (w >= REPORT.lancement) ventes *= 1 - e.report;
    for (const i of h.imprevus) if (i.semaine === w) ventes *= 1 - (i.imprevu.effet.ventes ?? 0);
    semaines.push({
      valeur: e.total,
      variation: e.total - avant,
      chance: e.chance,
      mcvKg: e.mcvKg,
      manque: e.manque,
      kerbrelan: ventes,
      depenses: e.depenses,
    });
    avant = e.total;
    derniere = e;
  }
  const e = derniere!;
  const o = e.offre;
  const g = gagne(chemin, graine);
  return {
    semaines,
    chemin,
    objectif: e.total,
    offre: o,
    gagne: g,
    nordal: h.nordal,
    lait: h.lait,
    trsDecembre: h.trsDecembre,
    manque: g ? e.manque : 0,
    contrat: e.contrat,
    marque: e.marque,
    celtis: e.celtis,
    depenses: e.depenses,
    report: e.report,
    defense: defense(chemin[D.marque]!, h.sensibilite),
    sensibilite: h.sensibilite,
    repriseAcceptee: repriseAcceptee(graine),
    charteChange: charteChange(graine),
    celtisSigne: chemin[D.celtis] === 0 || (chemin[D.celtis] === 2 && celtisAccepte(graine)),
    mcvKg: e.mcvKg,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    attribution: t.offre.repondu && dans(ATTRIBUTION) ? (t.gagne ? "gagne" : "perdu") : null,
    attributionSansNous: !t.offre.repondu && dans(ATTRIBUTION),
    reprise: t.gagne && chemin[D.emballages] === 2 && dans(EMBALLAGES.reponse),
    lait: dans(REVELATION_LAIT),
    etude: chemin[D.marque] === 2 && dans(REPORT.resultats),
    charte: t.gagne && dans(EMBALLAGES.charte),
    lancement: dans(REPORT.lancement),
    premiersChiffres: dans(REPORT.premiersChiffres),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/* ---------------------------------------------------------------------------
 * LE TABLEAU DE BORD du dossier.
 * ------------------------------------------------------------------------- */

export interface LectureMdd {
  valeur: number | null;
  chance: number | null;
  mcvKg: number | null;
  manque: number | null;
  kerbrelan: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  repondu: number | null;
  /** 1 gagné, 0 perdu, −1 pas encore connu. */
  gagne: number | null;
  clause: number | null;
  plafond: number | null;
  prixOffre: number | null;
  trsDecembre: number | null;
  /** La capacité libre de décembre, réelle, et le besoin de la MDD, en tonnes. */
  libreDecembre: number | null;
  besoinDecembre: number | null;
  lait: number | null;
  depenses: number | null;
  /** Le prix de la MDD qui sortira chez Opaline : le nôtre si nous l'avons, celui de Nordal sinon. */
  prixMdd: number | null;
}

/** Ce que Naïm lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureMdd {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const h = hasard(graine);
  const o = offre(chemin[D.reponse]!, chemin[D.prix]!);
  const commun = {
    repondu: o.repondu ? 1 : 0,
    clause: o.clause ? 1 : 0,
    plafond: o.plafond ? 1 : 0,
    prixOffre: o.prix,
    trsDecembre: h.trsDecembre,
    libreDecembre: LIGNE.theorique * h.trsDecembre - LIGNE.marqueDecembre,
    besoinDecembre: BESOIN_MOIS * (o.plafond ? 1 : PIC_MDD),
    prixMdd: gagne(chemin, graine) ? o.prix : h.nordal,
  };
  if (semaine === 0) {
    const e = estimer(chemin, graine, 0, jours);
    return {
      valeur: e.total,
      chance: 0,
      mcvKg: MCV_CIBLE * 100,
      manque: 0,
      kerbrelan: VENTES_SEMAINE,
      ...commun,
      gagne: -1,
      lait: -1,
      depenses: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    chance: s.chance,
    mcvKg: s.mcvKg,
    manque: s.manque,
    kerbrelan: s.kerbrelan,
    ...commun,
    gagne: semaine >= ATTRIBUTION && o.repondu ? (t.gagne ? 1 : 0) : o.repondu ? -1 : 0,
    lait: semaine >= REVELATION_LAIT ? h.lait : -1,
    depenses: s.depenses,
  };
}
