/**
 * L'ATELIER SATURÉ — le modèle de l'atelier de menuiserie sur mesure d'Arvel.
 *
 * Un atelier à Rillieux-la-Pape qui fabrique des fenêtres, des portes
 * d'entrée et des escaliers sur mesure. Tout passe par un seul centre
 * d'usinage à commande numérique : 42 heures d'ouverture par semaine, dont 4
 * de réglages, pour 48 heures de pièces demandées. Le débit, l'assemblage et
 * la finition ont du jeu ; la machine, non. Treize semaines, six décisions.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE FACTEUR RARE. Quand le centre d'usinage est plein, chaque heure
 *     donnée à un produit est retirée à un autre. Ce qui compte n'est plus la
 *     marge sur coût variable d'une pièce, ni son taux de marge, mais la
 *     marge sur coût variable par heure de machine : 810 € pour une fenêtre,
 *     650 € pour une porte, 400 € pour un escalier, qui a pourtant la plus
 *     forte marge unitaire (2 800 €) et le meilleur taux (50 %). Le planning
 *     sert les produits dans l'ordre de la règle choisie ; ce qui ne passe pas
 *     part chez un concurrent.
 *   · LE COÛT D'OPPORTUNITÉ. Une heure de machine vaut ce que rapporte le
 *     produit qu'on refuse pour la libérer : 400 € quand le planning est bien
 *     classé (l'escalier ferme la marche), bien plus quand il est mal classé.
 *     Le prix plancher d'une commande nouvelle est donc son coût variable
 *     PLUS les heures qu'elle prend, valorisées à ce prix ; une panne, un
 *     arrêt de maintenance en journée, se paient de même ; et une heure
 *     ajoutée (deuxième équipe, samedi, réglages raccourcis) vaut ce qu'elle
 *     permet de servir en plus, à comparer à ce qu'elle coûte.
 *   · LA PANNE QUI MENACE. La broche du centre d'usinage vibre : la laisser
 *     tourner est le meilleur pari en moyenne, mais une casse coûte trois
 *     jours de machine au pire moment. La changer un samedi coûte un peu plus
 *     en moyenne et protège des mauvais tirages.
 *
 * Le trimestre est jugé en euros : la marge de l'atelier (marge sur coût
 * variable, moins les frais engagés pour le désaturer et les pertes), en
 * écart à son budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LES PRODUITS : prix de vente moyen HT, coûts variables, heures de centre
 * d'usinage par pièce, et demande hebdomadaire moyenne.
 * ------------------------------------------------------------------------- */
export type CodeProduit = "fenetre" | "porte" | "escalier";

export interface Produit {
  code: CodeProduit;
  nom: string;
  prix: number;
  /** Le détail des coûts variables d'une pièce, en euros. */
  couts: Readonly<Record<string, number>>;
  /** Les heures de centre d'usinage d'une pièce. */
  heures: number;
  /** Pièces demandées par semaine, en moyenne. */
  demande: number;
}

export const PRODUITS: readonly Produit[] = [
  {
    code: "fenetre",
    nom: "Fenêtre",
    prix: 900,
    couts: { bois: 180, vitrage: 190, quincaillerie: 75, finition: 50 },
    heures: 0.5,
    demande: 30,
  },
  {
    code: "porte",
    nom: "Porte d'entrée",
    prix: 3250,
    couts: { bois: 720, panneau: 420, quincaillerie: 510, finition: 300 },
    heures: 2,
    demande: 6,
  },
  {
    code: "escalier",
    nom: "Escalier",
    prix: 5600,
    couts: { bois: 1950, quincaillerie: 230, finition: 380, livraison: 240 },
    heures: 7,
    demande: 3,
  },
];

export const FENETRE = 0;
export const PORTE = 1;
export const ESCALIER = 2;

export const coutVariable = (p: Produit) => Object.values(p.couts).reduce((s, x) => s + x, 0);
export const margeUnitaire = (p: Produit) => p.prix - coutVariable(p);
export const tauxDeMarge = (p: Produit) => margeUnitaire(p) / p.prix;
export const margeParHeure = (p: Produit) => margeUnitaire(p) / p.heures;

/** Les heures d'ouverture du centre d'usinage par semaine, en une équipe. */
export const OUVERTURE = 42;
/** Les réglages et changements de série, pris sur l'ouverture. */
export const REGLAGES = 4;
/** Les heures d'usinage disponibles par semaine. */
export const DISPONIBLES = OUVERTURE - REGLAGES;
/** Les heures demandées par semaine, en moyenne : 48 pour 38 disponibles. */
export const DEMANDEES = PRODUITS.reduce((s, p) => s + p.demande * p.heures, 0);

/**
 * Le coût complet du service comptable : les charges fixes de l'atelier
 * réparties au prorata des heures de main-d'œuvre. Juste pour un prix de
 * revient, trompeur pour un choix de production : ces charges sont là quoi
 * qu'on fabrique.
 */
export const COUT_COMPLET = { fenetre: 760, porte: 2880, escalier: 4700 } as const;

/** Le pic d'avant les fêtes : les artisans veulent finir leurs chantiers. */
export const PIC = { de: 11, facteur: 1.2 } as const;

/** Le budget de marge de l'atelier pour le trimestre. */
export const BUDGET = 320000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, le planning reste au premier arrivé, premier servi. */
export const PERTE_PAR_JOUR = 500;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  planning: 0,
  bailleur: 1,
  goulot: 2,
  broche: 3,
  pic: 4,
  fin: 5,
} as const;

/** Les règles de priorité du planning (première décision). */
export const REGLE = { margeUnitaire: 0, margeParHeure: 1, tauxDeMarge: 2, arrivee: 3 } as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 0, 3, 2] as const;

/** La commande du bailleur : des portes palières coupe-feu, livrées des semaines 4 à 9. */
export const BAILLEUR = {
  quantite: 30,
  prixPropose: 1350,
  prixContre: 1650,
  coutVariable: 900,
  heures: 1.5,
  de: 4,
  a: 9,
} as const;
/** Six fois sur dix, le bailleur accepte la contre-proposition. */
export const CHANCE_CONTRE = 0.6;

/** Les leviers pour desserrer le goulot (troisième décision). */
export const LEVIERS = {
  /** Les fenêtres achetées à un industriel, revendues en l'état, à partir de la semaine 7. */
  achatFenetre: 790,
  /** L'industriel ne fait pas toutes les cotes : une partie des demandes part ailleurs. */
  demandeIndustriel: 0.85,
  /** La deuxième équipe : quatre soirs de deux heures et demie, à partir de la semaine 8. */
  equipeHeures: 10,
  equipeCout: 1200,
  equipeEmbauche: 1500,
  /** Outils préréglés et gabarits : les réglages passent de 4 à 1 heure, à partir de la semaine 7. */
  reglagesReduits: 1,
  outillage: 4500,
} as const;

/** La broche du centre d'usinage (quatrième décision). */
export const BROCHE = {
  /** Une chance sur cinq qu'elle casse avant Noël si on la laisse tourner. */
  risque: 0.2,
  /** Avec des avances de coupe réduites, le risque tombe… */
  risqueMenage: 0.08,
  /** … mais la machine perd 8 % de ses heures. */
  ralentissement: 0.08,
  /** Une casse immobilise la machine deux jours sur cinq. */
  arret: 0.4,
  reparation: 6500,
  changement: 3900,
  /** Le changement en semaine immobilise la machine une journée et demie : dépose, pose, rodage, recalage. */
  heuresChangement: 12,
  /** Les deux techniciens du constructeur et l'opérateur, majorés le samedi. */
  majorationSamedi: 2000,
  semaine: 8,
} as const;

/** Le pic de fin d'année (cinquième décision), des semaines 10 à 13. */
export const PROMOTION = { remise: 0.1, demande: 1.4 } as const;
export const HAUSSE = { prix: 0.08, demande: 0.8 } as const;
/** Le samedi : l'opérateur et le régleur, huit heures de machine, majorés. */
export const SAMEDI = { heures: 8, cout: 1300 } as const;

/** La commande du promoteur (sixième décision) : quatre escaliers haut de gamme, semaines 12 et 13. */
export const PROMOTEUR = {
  quantite: 4,
  prix: 6800,
  coutVariable: 3000,
  heures: 7,
} as const;

/** Un artisan qui achète ses fenêtres chez Arvel, et le reste avec : la marge du négoce imputée à l'atelier. */
export const MARGE_CLIENT = 9000;

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
  effet: { heures?: number; cout?: number; demande?: number; escaliers?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "orage",
    titre: "Coupure de courant après un orage",
    de: "Lucien Bouvard",
    role: "Chef d'équipe assemblage",
    texte:
      "L'orage de mardi a fait sauter le transformateur de la zone : une journée sans courant, le centre d'usinage à l'arrêt.",
    duree: 1,
    effet: { heures: 8 },
  },
  {
    id: "operateur",
    titre: "L'opérateur du centre d'usinage en arrêt",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Sékou Traoré est en arrêt deux semaines. Lucien le remplace sur la machine, plus lentement : six heures d'usinage perdues par semaine.",
    duree: 2,
    effet: { heures: 6 },
  },
  {
    id: "cotes",
    titre: "Une série de fenêtres à refaire",
    de: "Lucien Bouvard",
    role: "Chef d'équipe assemblage",
    texte:
      "Une erreur de cote dans un programme : huit châssis à refaire. Quatre heures de machine et 1 400 € de bois et de vitrage perdus.",
    duree: 1,
    effet: { heures: 4, cout: 1400 },
  },
  {
    id: "chene",
    titre: "Livraison de chêne en retard",
    de: "Achats",
    role: "Siège",
    texte:
      "La scierie a décalé sa livraison de chêne d'une semaine : pas de bois pour les limons, les escaliers attendront.",
    duree: 1,
    effet: { escaliers: 0.3 },
  },
  {
    id: "salon",
    titre: "Retombées du salon de l'habitat",
    de: "Alexandre Fourcade",
    role: "Directeur commercial",
    texte:
      "Le salon de l'habitat d'Eurexpo nous a apporté des devis en pagaille : 15 % de demandes en plus pendant deux semaines.",
    duree: 2,
    effet: { demande: 1.15 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** La demande de chaque produit, rapportée à sa moyenne. */
  demande: readonly number[];
  /** Les heures perdues ou gagnées sur la machine : micro-arrêts, séries qui tombent bien. */
  heures: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le bailleur accepte-t-il la contre-proposition ? */
  uBailleur: number;
  /** L'artisan part-il si ses fenêtres ne sont pas servies ? */
  uClient: number;
  /** La broche casse-t-elle ? */
  uBroche: number;
  /** La semaine où elle casserait, de 9 à 13. */
  semaineCasse: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000273 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    const demande = PRODUITS.map(() => Math.min(1.2, Math.max(0.8, 1 + 0.08 * gauss(r))));
    const heures = Math.min(2.5, Math.max(-2.5, 1.2 * gauss(r)));
    semaines.push({ demande, heures });
  }
  const uBailleur = r();
  const uClient = r();
  const uBroche = r();
  const semaineCasse = 9 + Math.floor(r() * 5);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uBailleur, uClient, uBroche, semaineCasse, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Le bailleur signe-t-il ? À son prix, toujours ; à la contre-proposition, six fois sur dix. */
export const bailleurSigne = (chemin: readonly number[], graine: number) =>
  chemin[D.bailleur] === 0 ||
  (chemin[D.bailleur] === 1 && hasard(graine).uBailleur < CHANCE_CONTRE);

/** Le prix auquel le bailleur signe, s'il signe. */
export const prixBailleur = (chemin: readonly number[]) =>
  chemin[D.bailleur] === 1 ? BAILLEUR.prixContre : BAILLEUR.prixPropose;

/**
 * L'ARTISAN PART-IL ?
 *
 * Les Menuiseries Daubrée achètent chez Arvel leurs fenêtres sur mesure, et
 * avec elles leur quincaillerie et leurs panneaux. Quand le délai des
 * fenêtres s'allonge, ils vont voir ailleurs, pour tout. Le risque se lit en
 * semaine 6 sur la part des fenêtres demandées que l'atelier a servies.
 */
export const risqueClient = (fenetresServies: number) =>
  Math.min(0.8, Math.max(0, (0.92 - fenetresServies) * 1.2));

/** La broche casse-t-elle, et quand ? */
export function brocheCasse(chemin: readonly number[], graine: number): number {
  const h = hasard(graine);
  const choix = chemin[D.broche];
  const risque = choix === 0 ? BROCHE.risque : choix === 3 ? BROCHE.risqueMenage : 0;
  return h.uBroche < risque ? h.semaineCasse : 0;
}

/* ---------------------------------------------------------------------------
 * LE PLANNING : qui passe sur la machine, dans quel ordre.
 * ------------------------------------------------------------------------- */
interface Article {
  prix: number;
  cv: number;
  heures: number;
}

/** L'ordre de passage d'une règle : les indices des produits, du premier servi au dernier. */
function ordre(regle: number, articles: readonly Article[]): number[] {
  const cle = (a: Article) => {
    const m = a.prix - a.cv;
    if (regle === REGLE.margeUnitaire) return m;
    if (regle === REGLE.tauxDeMarge) return m / a.prix;
    return a.heures > 0 ? m / a.heures : Infinity;
  };
  return articles.map((_, i) => i).sort((i, j) => cle(articles[j]!) - cle(articles[i]!));
}

/** Les pièces servies, produit par produit, avec les heures disponibles et la règle du planning. */
export function planifier(
  regle: number,
  articles: readonly Article[],
  demandes: readonly number[],
  heures: number,
): number[] {
  const servis = demandes.map(() => 0);
  let reste = Math.max(0, heures);
  // Ce qui ne passe pas par la machine est toujours servi.
  articles.forEach((a, i) => {
    if (a.heures === 0) servis[i] = demandes[i]!;
  });
  if (regle === REGLE.arrivee) {
    // Premier arrivé, premier servi : chaque produit attend autant, et chacun est servi à proportion.
    const besoin = articles.reduce((s, a, i) => s + a.heures * demandes[i]!, 0);
    const part = besoin > 0 ? Math.min(1, reste / besoin) : 1;
    articles.forEach((a, i) => {
      if (a.heures > 0) servis[i] = demandes[i]! * part;
    });
    return servis;
  }
  for (const i of ordre(regle, articles)) {
    const a = articles[i]!;
    if (a.heures === 0) continue;
    const n = Math.min(demandes[i]!, reste / a.heures);
    servis[i] = n;
    reste -= n * a.heures;
  }
  return servis;
}

export type Semaine = {
  /** La marge sur coût variable de la semaine, commandes spéciales comprises. */
  mcv: number;
  /** Ce que la semaine apporte à la marge de l'atelier : la marge, moins les frais et les pertes. */
  contribution: number;
  /** La marge de l'atelier cumulée depuis le début du trimestre. */
  marge: number;
  ca: number;
  /** Le chiffre d'affaires des demandes que l'atelier n'a pas pu servir, cumulé. */
  caPerdu: number;
  heuresDisponibles: number;
  heuresDemandees: number;
  /** Les heures demandées rapportées aux heures disponibles. */
  charge: number;
  /** La marge sur coût variable par heure d'usinage disponible. */
  margeHeure: number;
  tauxMarge: number;
  fenetres: number;
  portes: number;
  escaliers: number;
  /** La part des fenêtres demandées que l'atelier a servies. */
  serviceFenetres: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge de l'atelier en écart à son budget : positif, au-dessus du budget. */
  objectif: number;
  marge: number;
  mcv: number;
  ca: number;
  caPerdu: number;
  /** Ce qu'ont coûté les leviers, la maintenance, les imprévus et l'enquête. */
  frais: number;
  bailleurSigne: boolean;
  /** Ce que la commande du bailleur a rapporté en marge sur coût variable. */
  margeBailleur: number;
  promoteur: boolean;
  clientParti: boolean;
  risqueClient: number;
  casse: number;
  /** La marge sur coût variable par heure de machine disponible, sur le trimestre. */
  margeHeure: number;
  tauxMarge: number;
  serviceFenetres: number;
  /** La marge sur coût variable par heure d'usinage de l'escalier, d'après les fiches de coût. */
  margeHeureEscalier: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  // La réponse au bailleur se lit dans bailleurSigne : elle dépend aussi du hasard.
  const [d1, , d3, d4, d5, d6] = chemin;
  const signe = bailleurSigne(chemin, graine);
  const prixB = prixBailleur(chemin);
  const casse = brocheCasse(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let marge = 0;
  let mcvTotal = 0;
  let caTotal = 0;
  let caPerdu = 0;
  let frais = 0;
  let heuresTotal = 0;
  let margeBailleur = 0;
  let clientParti = false;
  let risque = 0;
  let fenDemandees = 0;
  let fenServies = 0;
  let fenDemandeesTrimestre = 0;
  let fenServiesTrimestre = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = 0;
    if (w === 1) cout += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

    // Les heures de la machine.
    let reglages = REGLAGES;
    if (d3 === 2 && w >= 7) reglages = LEVIERS.reglagesReduits;
    let heures = OUVERTURE - reglages + n.heures;
    if (d3 === 1 && w >= 8) heures += LEVIERS.equipeHeures;
    if (d4 === 1 && w === BROCHE.semaine) heures -= BROCHE.heuresChangement;
    if (d4 === 3 && w >= BROCHE.semaine) heures *= 1 - BROCHE.ralentissement;
    if (d5 === 1 && w >= PIC.de) heures += SAMEDI.heures;
    for (const a of actifs) heures -= a.imprevu.effet.heures ?? 0;
    if (casse && w === casse) heures *= 1 - BROCHE.arret;
    heures = Math.max(0, heures);

    // Les articles de la semaine : prix et coûts, selon les décisions.
    const articles: Article[] = PRODUITS.map((p) => ({
      prix: p.prix,
      cv: coutVariable(p),
      heures: p.heures,
    }));
    const industriel = d3 === 0 && w >= 7;
    if (industriel)
      articles[FENETRE] = { ...articles[FENETRE]!, cv: LEVIERS.achatFenetre, heures: 0 };
    const promo = d5 === 0 && w >= 10;
    const hausse = d5 === 2 && w >= 10;
    if (promo) {
      const e = articles[ESCALIER]!;
      articles[ESCALIER] = { ...e, prix: e.prix * (1 - PROMOTION.remise) };
    }
    if (hausse) {
      const e = articles[ESCALIER]!;
      articles[ESCALIER] = { ...e, prix: e.prix * (1 + HAUSSE.prix) };
    }

    // La demande de la semaine.
    const demandes = PRODUITS.map((p, i) => {
      let x = p.demande * n.demande[i]!;
      if (w >= PIC.de) x *= PIC.facteur;
      for (const a of actifs) x *= a.imprevu.effet.demande ?? 1;
      return x;
    });
    for (const a of actifs)
      demandes[ESCALIER] = demandes[ESCALIER]! * (a.imprevu.effet.escaliers ?? 1);
    if (industriel) demandes[FENETRE] = demandes[FENETRE]! * LEVIERS.demandeIndustriel;
    if (clientParti) demandes[FENETRE] = demandes[FENETRE]! * 0.9;
    if (promo) demandes[ESCALIER] = demandes[ESCALIER]! * PROMOTION.demande;
    if (hausse) demandes[ESCALIER] = demandes[ESCALIER]! * HAUSSE.demande;

    // Les commandes signées passent d'abord : elles ont une date de livraison.
    let mcv = 0;
    let ca = 0;
    let engage = 0;
    if (signe && w >= BAILLEUR.de && w <= BAILLEUR.a) {
      const portes = BAILLEUR.quantite / (BAILLEUR.a - BAILLEUR.de + 1);
      engage += portes * BAILLEUR.heures;
      const m = portes * (prixB - BAILLEUR.coutVariable);
      mcv += m;
      margeBailleur += m;
      ca += portes * prixB;
    }
    const promoteur = d6 === 1 && w >= 12;
    if (promoteur) {
      const esc = PROMOTEUR.quantite / 2;
      engage += esc * PROMOTEUR.heures;
      mcv += esc * (PROMOTEUR.prix - PROMOTEUR.coutVariable);
      ca += esc * PROMOTEUR.prix;
    }

    // Le reste de la machine, selon la règle du planning ; en fin de trimestre, le chiffre d'affaires d'abord.
    const regle = d6 === 0 && w >= 12 ? REGLE.margeUnitaire : d1!;
    const servis = planifier(regle, articles, demandes, heures - engage);
    articles.forEach((a, i) => {
      mcv += servis[i]! * (a.prix - a.cv);
      ca += servis[i]! * a.prix;
      caPerdu += (demandes[i]! - servis[i]!) * a.prix;
    });
    const heuresDemandees = engage + articles.reduce((s, a, i) => s + a.heures * demandes[i]!, 0);

    if (w <= 6) {
      fenDemandees += demandes[FENETRE]!;
      fenServies += servis[FENETRE]!;
    }
    fenDemandeesTrimestre += demandes[FENETRE]!;
    fenServiesTrimestre += servis[FENETRE]!;

    // Les frais des décisions.
    if (d3 === 1 && w === 7) cout += LEVIERS.equipeEmbauche;
    if (d3 === 1 && w >= 8) cout += LEVIERS.equipeCout;
    if (d3 === 2 && w === 6) cout += LEVIERS.outillage;
    if ((d4 === 1 || d4 === 2) && w === BROCHE.semaine) cout += BROCHE.changement;
    if (d4 === 2 && w === BROCHE.semaine) cout += BROCHE.majorationSamedi;
    if (casse && w === casse) cout += BROCHE.reparation;
    if (d5 === 1 && w >= PIC.de) cout += SAMEDI.cout;
    for (const a of actifs) if (a.semaine === w) cout += a.imprevu.effet.cout ?? 0;

    // L'artisan décide en semaine 7, sur ce qu'il a vécu depuis le début du trimestre.
    if (w === 7) {
      risque = risqueClient(fenDemandees > 0 ? fenServies / fenDemandees : 1);
      if (h.uClient < risque) {
        clientParti = true;
        cout += MARGE_CLIENT;
      }
    }

    frais += cout;
    const contribution = mcv - cout;
    marge += contribution;
    mcvTotal += mcv;
    caTotal += ca;
    heuresTotal += heures;
    semaines.push({
      mcv,
      contribution,
      marge,
      ca,
      caPerdu,
      heuresDisponibles: heures,
      heuresDemandees,
      charge: heures > 0 ? heuresDemandees / heures : 2,
      margeHeure: heures > 0 ? mcv / heures : 0,
      tauxMarge: ca > 0 ? mcv / ca : 0,
      fenetres: servis[FENETRE]!,
      portes: servis[PORTE]!,
      escaliers: servis[ESCALIER]!,
      serviceFenetres: demandes[FENETRE]! > 0 ? servis[FENETRE]! / demandes[FENETRE]! : 1,
    });
  }

  return {
    semaines,
    objectif: marge - BUDGET,
    marge,
    mcv: mcvTotal,
    ca: caTotal,
    caPerdu,
    frais,
    bailleurSigne: signe,
    margeBailleur,
    promoteur: d6 === 1,
    clientParti,
    risqueClient: risque,
    casse,
    margeHeure: heuresTotal > 0 ? mcvTotal / heuresTotal : 0,
    tauxMarge: caTotal > 0 ? mcvTotal / caTotal : 0,
    serviceFenetres: fenDemandeesTrimestre > 0 ? fenServiesTrimestre / fenDemandeesTrimestre : 1,
    margeHeureEscalier: margeParHeure(PRODUITS[ESCALIER]!),
  };
}

/** Ce qui s'est passé pendant des semaines : le bailleur, l'artisan, la broche, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    clientParti: t.clientParti && dans(7),
    casse: t.casse > 0 && dans(t.casse),
    equipe: chemin[D.goulot] === 1 && dans(8),
    industriel: chemin[D.goulot] === 0 && dans(8),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAtelier {
  marge: number | null;
  budgetADate: number | null;
  charge: number | null;
  margeHeure: number | null;
  caPerdu: number | null;
  tauxMarge: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  heuresDisponibles: number | null;
  serviceFenetres: number | null;
  escaliers: number | null;
}

/** La situation du lundi de la semaine 1 : le planning au premier arrivé, premier servi. */
export const DEPART = (() => {
  const articles = PRODUITS.map((p) => ({ prix: p.prix, cv: coutVariable(p), heures: p.heures }));
  const demandes = PRODUITS.map((p) => p.demande);
  const servis = planifier(REGLE.arrivee, articles, demandes, DISPONIBLES);
  const mcv = articles.reduce((s, a, i) => s + servis[i]! * (a.prix - a.cv), 0);
  const ca = articles.reduce((s, a, i) => s + servis[i]! * a.prix, 0);
  return {
    mcv,
    margeHeure: mcv / DISPONIBLES,
    tauxMarge: mcv / ca,
    charge: DEMANDEES / DISPONIBLES,
    caPerdu: articles.reduce((s, a, i) => s + (demandes[i]! - servis[i]!) * a.prix, 0),
  };
})();

/** Ce que Florent lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAtelier {
  if (semaine === 0) {
    return {
      marge: 0,
      budgetADate: 0,
      charge: DEPART.charge,
      margeHeure: DEPART.margeHeure,
      caPerdu: 0,
      tauxMarge: DEPART.tauxMarge,
      heuresDisponibles: DISPONIBLES,
      serviceFenetres: DISPONIBLES / DEMANDEES,
      escaliers: PRODUITS[ESCALIER]!.demande * (DISPONIBLES / DEMANDEES),
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    marge: s.marge,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    charge: s.charge,
    margeHeure: s.margeHeure,
    caPerdu: s.caPerdu,
    tauxMarge: s.tauxMarge,
    heuresDisponibles: s.heuresDisponibles,
    serviceFenetres: s.serviceFenetres,
    escaliers: s.escaliers,
  };
}
