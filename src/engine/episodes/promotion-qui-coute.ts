/**
 * LA PROMOTION QUI REMPLIT LES CADDIES — le modèle des promotions de la marque Kerbrélan.
 *
 * Les yaourts Kerbrélan dans les trois enseignes de la grande distribution
 * (Celtis, Opaline, Proxival), de mai à juillet : les fruits (le pack de
 * quatre le plus vendu), le Brassé fermier (lancé en mars) et le reste de la
 * gamme. Les opérations « deux achetés, le troisième offert » font bondir les
 * ventes de 180 % ; le directeur commercial veut en doubler le nombre pour
 * reprendre des parts de marché au Groupe Nordal. Six décisions. Cinq
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE PIC N'EST PAS LE GAIN. Chaque pack vendu de plus pendant une
 *     opération vient de quelque part : des autres références de la marque
 *     (la cannibalisation), des achats que les habitués avancent et ne feront
 *     pas les semaines suivantes (le creux), ou de nouveaux acheteurs. Seuls
 *     les derniers ajoutent de la marge, et la remise, financée par la
 *     laiterie, porte aussi sur tout ce qui se serait vendu sans elle. Le
 *     « 2+1 » sur les fruits perd ainsi 27 k€ par opération chez Celtis ; une
 *     remise moins profonde sur le Brassé, qui recrute, peut rapporter. Seule
 *     une mesure qui suit les acheteurs au-delà de l'opération le montre.
 *   · LA FRÉQUENCE HABITUE AU PRIX PROMOTIONNEL. Plus les opérations se
 *     rapprochent dans une enseigne, plus les habitués avancent leurs achats
 *     et moins l'opération recrute ; et au-delà de 20 % du volume annuel vendu
 *     en promotion, les acheteurs attendent la suivante : la disposition à
 *     payer le prix normal baisse pour six mois.
 *   · LES VOLUMES ANNONCÉS À L'USINE. Les commerciaux annoncent leurs
 *     objectifs, pas une prévision : trop sur le « 2+1 », trop peu sur une
 *     mécanique nouvelle. Un produit frais ne se stocke pas (les enseignes
 *     exigent les deux tiers de la DLC à la livraison) : l'excès part en
 *     casse, le manque en rupture, avec des pénalités et des acheteurs perdus.
 *     L'écart réel de chaque opération est tiré au hasard.
 *   · TESTER AVANT DE GÉNÉRALISER. Le Brassé recrute-t-il de nouveaux
 *     acheteurs, ou prend-il surtout aux fruits ? Le hasard en décide (une
 *     fois sur deux), et la hausse visible des ventes est la même dans les
 *     deux cas : seul un test avec des magasins témoins chez Opaline (ou une
 *     étude de panel, plus chère) le dit avant les opérations de juillet.
 *   · LE PLAFOND DE 25 % DU VOLUME ANNUEL. La loi plafonne la remise à 34 %
 *     et le volume vendu en promotion à 25 % du volume annuel prévu à la
 *     convention. Le plan signé l'atteint presque : chaque opération de plus,
 *     ou plus large, en retire une plus tard. Les centrales refusent ce qui
 *     dépasse.
 *
 * Le hasard tire aussi, d'avance : la réponse de Celtis à un changement de
 * prospectus, l'ampleur de l'attaque de Nordal en juillet, une rupture chez
 * Nordal, sa réaction si l'on riposte en prix, la tendance des ventes du
 * Brassé (que Celtis juge à sa revue de gamme), un ou deux imprévus.
 *
 * L'OBJECTIF est la MARGE INCRÉMENTALE du trimestre : la marge sur coût
 * variable gagnée ou perdue par rapport à un trimestre sans promotion — remise,
 * logistique, prospectus, cannibalisation, creux, rachats, casse, ruptures,
 * actions et études comprises —, plus l'effet durable que les sources
 * permettent d'estimer fin juillet : les acheteurs recrutés qui restent, ceux
 * que Nordal garde, la disposition à payer entamée par la fréquence des
 * promotions, un déréférencement du Brassé, la tête de gondole de la rentrée.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LA GAMME ET SES CHIFFRES. Toutes les sources de l'épisode en sont tirées.
 * ------------------------------------------------------------------------- */

export const ENSEIGNES = ["celtis", "opaline", "proxival"] as const;
export type Enseigne = (typeof ENSEIGNES)[number];
export const REFERENCES = ["fruits", "brasse", "reste"] as const;
export type Reference = (typeof REFERENCES)[number];

/** Les ventes hors promotion, en packs de quatre pots par semaine, en mai. */
export const BASE: Record<Enseigne, Record<Reference, number>> = {
  celtis: { fruits: 12000, brasse: 4000, reste: 9000 },
  opaline: { fruits: 8000, brasse: 2700, reste: 6000 },
  proxival: { fruits: 4000, brasse: 1300, reste: 3000 },
};
const somme = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);
export const baseEnseigne = (e: Enseigne) => somme(REFERENCES.map((r) => BASE[e][r]));
/** 50 000 packs par semaine dans les trois enseignes. */
export const BASE_TOTALE = somme(ENSEIGNES.map(baseEnseigne));

/** Les yaourts montent avec l'été : +4 % en juin, +8 % en juillet. */
export const saison = (w: number) => (w <= 4 ? 1 : w <= 8 ? 1.04 : 1.08);

/** Le prix net facturé aux enseignes et le coût variable industriel d'un pack, en euros. */
export const PRIX_NET: Record<Reference, number> = { fruits: 1.3, brasse: 1.6, reste: 1.3 };
export const COUT_VARIABLE: Record<Reference, number> = {
  fruits: 0.65,
  brasse: 0.75,
  reste: 0.65,
};
export const MCV: Record<Reference, number> = {
  fruits: PRIX_NET.fruits - COUT_VARIABLE.fruits,
  brasse: PRIX_NET.brasse - COUT_VARIABLE.brasse,
  reste: PRIX_NET.reste - COUT_VARIABLE.reste,
};
/** La marge des références que l'opération prend aux autres produits de la marque. */
export const MCV_CANNIBALISEE = 0.65;
export const MCV_MOYENNE =
  somme(REFERENCES.map((r) => MCV[r] * BASE.celtis[r])) / baseEnseigne("celtis");
/** Préparation, livraisons et palettes de mise en avant, par pack vendu en promotion. */
export const LOGISTIQUE = 0.03;
/** La participation au prospectus et à la mise en avant, par opération. */
export const FRAIS_OP = 3000;

export type Mecanique = "deuxPlusUn" | "deuxiemeMoins40" | "moins34";
/** La remise que la laiterie finance, en part du prix net de chaque pack vendu en promotion. */
export const REMISE: Record<Mecanique, number> = {
  deuxPlusUn: 1 / 3,
  deuxiemeMoins40: 0.2,
  moins34: 0.34,
};
/** La marge d'un pack vendu en promotion. */
export const margePromo = (m: Mecanique, r: Reference) =>
  MCV[r] - REMISE[m] * PRIX_NET[r] - LOGISTIQUE;

/**
 * CE QUE DEVIENT UN PACK DE PLUS. `lift` : la hausse des ventes pendant
 * l'opération, en part des ventes de base ; c, s, i : la part des packs de plus
 * prise aux autres références de la marque, avancée par les habitués (le creux
 * des trois semaines suivantes), achetée par de nouveaux acheteurs ; `rachat` :
 * les packs que chaque nouvel acheteur rachète au prix normal d'ici six
 * semaines ; `durable` : ceux qu'il rachètera ensuite, estimés fin juillet ;
 * `annonce` : la hausse que les commerciaux annoncent à l'usine.
 */
export interface Profil {
  lift: number;
  c: number;
  s: number;
  i: number;
  rachat: number;
  durable: number;
  annonce: number;
}

export const PROFILS = {
  /** Le « 2+1 » sur les fruits : l'opération de mars chez Celtis. */
  deuxPlusUnFruits: { lift: 1.8, c: 0.3, s: 0.45, i: 0.25, rachat: 0, durable: 0, annonce: 2.5 },
  /** Le « 2+1 » sur toute la gamme : moins de packs pris aux autres références, plus de stockage. */
  deuxPlusUnGamme: { lift: 1.6, c: 0.1, s: 0.55, i: 0.35, rachat: 0, durable: 0, annonce: 2.2 },
  /** Le « 2e à −40 % » sur le Brassé, quand il recrute. */
  brasseRecrute: { lift: 2, c: 0.1, s: 0.2, i: 0.7, rachat: 0.6, durable: 0.8, annonce: 1 },
  /** Le même, quand il prend surtout aux fruits : la hausse visible est la même. */
  brasseDeplace: { lift: 2, c: 0.45, s: 0.45, i: 0.1, rachat: 0, durable: 0, annonce: 1 },
  /** Le « 2e à −40 % » sur les fruits. */
  douceFruits: { lift: 0.8, c: 0.3, s: 0.4, i: 0.3, rachat: 0, durable: 0, annonce: 1.2 },
  /** Les −34 % immédiats sur toute la gamme que Celtis propose en fin de trimestre. */
  moins34Gamme: { lift: 1.7, c: 0.1, s: 0.55, i: 0.35, rachat: 0, durable: 0, annonce: 2.4 },
  /** Le « 2+1 » en riposte à Nordal : la hausse est moindre quand le concurrent est aussi en promotion. */
  riposteGamme: { lift: 1, c: 0.1, s: 0.6, i: 0.3, rachat: 0, durable: 0, annonce: 1.6 },
} as const satisfies Record<string, Profil>;

/** Le creux des trois semaines qui suivent une opération, en part des achats avancés. */
export const CREUX = [0.45, 0.35, 0.2] as const;
export const SEMAINES_DE_RACHAT = 6;
/** Chaque opération récente dans la même enseigne (moins de six semaines) : plus de stockage, moins de recrutement. */
export const EFFET_FREQUENCE = 0.05;
export const FENETRE_FREQUENCE = 6;

/* ---------------------------------------------------------------------------
 * LE PLAFOND LÉGAL ET L'HABITUDE DU PRIX PROMOTIONNEL.
 * ------------------------------------------------------------------------- */

export const PLAFOND_LEGAL = 0.25;
export const REMISE_MAXIMALE = 0.34;
export const volumeAnnuel = (e: Enseigne) => baseEnseigne(e) * 52;
/** Le volume vendu en promotion de janvier à avril, et celui que le plan d'août à décembre réserve. */
export const AVANT: Record<Enseigne, number> = { celtis: 128000, opaline: 85000, proxival: 41900 };
export const APRES: Record<Enseigne, number> = { celtis: 55000, opaline: 36600, proxival: 18000 };
/** Ce qui reste sous le plafond pour mai à juillet : 142 000 packs chez Celtis. */
export const placeDuTrimestre = (e: Enseigne) =>
  PLAFOND_LEGAL * volumeAnnuel(e) - AVANT[e] - APRES[e];
/** En deçà de cette part, la centrale refuse l'opération plutôt que de la réduire. */
export const PART_MINIMALE = 0.25;

/** Au-delà de 20 % du volume annuel vendu en promotion, les acheteurs attendent la suivante. */
export const SEUIL_HABITUDE = 0.2;
/** Chaque point de plus fait perdre 0,3 % des ventes au prix normal pendant six mois. */
export const PERTE_PAR_POINT = 0.003;
export const VALEUR_POINT = PERTE_PAR_POINT * BASE_TOTALE * 26 * MCV_MOYENNE;

/* ---------------------------------------------------------------------------
 * L'USINE : CASSE ET RUPTURES.
 * ------------------------------------------------------------------------- */

/** La part d'un excès de production que les commandes suivantes absorbent avant la limite des deux tiers de DLC. */
export const ECOULE = 0.4;
/** Un pack déclassé ou donné : son coût variable, moins le peu qu'en tire le déstockeur. */
export const COUT_CASSE = 0.6;
/** Un pack manquant : pénalités logistiques et ventes perdues ; sur le Brassé, un nouvel acheteur perdu. */
export const COUT_RUPTURE = { profond: 0.4, recrutement: 1.1 } as const;
/** La marge de sécurité de la supply chain quand elle prévoit elle-même. */
export const SECURITE_PIC = 0.04;
export const SERVICE_NORMAL = 0.992;
export const SERVICE_EXIGE = 0.985;
/** Le premier mode de prévision vaut pour les opérations dont la production démarre après la semaine 6. */
export const SEMAINE_PIC = 7;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS ET CE QU'ELLES COÛTENT.
 * ------------------------------------------------------------------------- */

export const D = {
  plan: 0,
  mesure: 1,
  usine: 2,
  juillet: 3,
  nordal: 4,
  fin: 5,
} as const;

/**
 * Ne rien changer : tenir le plan signé, juger aux sorties de caisse, laisser
 * les commerciaux annoncer, confirmer juillet, ne pas répondre à Nordal,
 * refuser Celtis sans contrepartie.
 */
export const NEUTRE = [1, 1, 3, 0, 3, 3] as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : une opération confirmée par Baptistin qu'il faut décommander. */
export const PERTE_PAR_JOUR = 2500;

export const COUT_TEST = 2500;
export const COUT_PANEL = 14000;
export const COUT_PIC = 2500;
/** Dégustations et tête de gondole au prix normal, par enseigne et par opération. */
export const COUT_ANIMATION = 3000;
/** Pendant une animation, le Brassé vend 25 % de plus, sans remise, à de nouveaux acheteurs. */
export const EFFET_ANIMATION = 0.25;
/** Tenir face à Nordal sans baisser les prix : stocks de sécurité, dégustations dans 40 magasins. */
export const COUT_TENIR = 6000;
/** Les bons de réduction ciblés en caisse sur les acheteurs de Nordal. */
export const COUPONS = { mise: 4000, valeur: 0.5, retour: 0.3 } as const;
export const COUT_DEGUSTATION_CELTIS = 6000;
/** La tête de gondole de la rentrée chez Celtis : trois semaines, +40 % sur les fruits sans remise. */
export const VALEUR_GONDOLE = 0.4 * BASE.celtis.fruits * 3 * MCV.fruits;

/** Une fois sur quatre, Celtis refuse de changer le prospectus de la semaine 3, déjà en maquette. */
export const CHANCE_REFUS_PROSPECTUS = 0.2;
/** Une fois sur deux, le Brassé recrute vraiment. */
export const CHANCE_RECRUTE = 0.5;

/** L'attaque de Nordal : un « 2+1 » chez Celtis et Opaline, semaines 10 à 12. */
export const SEMAINES_NORDAL = [10, 11, 12] as const;
export const ENSEIGNES_NORDAL = ["celtis", "opaline"] as const;
/** Ce que l'attaque prend aux ventes de Kerbrélan : entre 10 et 30 % selon le tirage. */
export const VOL_NORDAL = { min: 0.08, max: 0.24 } as const;
/** La semaine qui suit, Nordal prend encore 40 % de cela : ses acheteurs ont stocké. */
export const TRAINE_NORDAL = 0.4;
/** La part de la marge perdue que Nordal garde durablement : des acheteurs qui ne reviennent pas. */
export const GARDE_NORDAL = 0.15;
export const CHANCE_RUPTURE_NORDAL = 0.5;
/** Quand Nordal rompt en semaines 11 et 12, Kerbrélan récupère 8 % de ventes de plus. */
export const CAPTURE = 0.15;
/** La chance que Nordal prolonge son attaque, selon la réponse de Kerbrélan. */
export const CHANCE_ESCALADE = [0.6, 0.1, 0.25, 0.1] as const;
/** Quand une centrale réattribue les emplacements de juillet à Nordal. */
export const VOL_EMPLACEMENT = 0.15;

/** La revue de gamme de Celtis : le Brassé doit vendre 3 400 packs par semaine en moyenne, semaines 8 à 13. */
export const SEUIL_ROTATION = 4500;
/** Faute de quoi il perd la moitié des magasins pendant six mois. */
export const PERTE_DEREFERENCEMENT = 0.5 * BASE.celtis.brasse * 20 * MCV.brasse;
/** Dans une opération sur les fruits, un quart des packs pris aux autres références l'est au Brassé. */
export const PART_BRASSE_CANNIBALISE = 0.25;

/* ---------------------------------------------------------------------------
 * L'OPÉRATION TYPE : la prévision demandée en semaine 1.
 * ------------------------------------------------------------------------- */

export interface Decomposition {
  base: number;
  enPlus: number;
  cannibalises: number;
  avances: number;
  nouveaux: number;
  volume: number;
  /** La marge des packs vendus en promotion. */
  margeVendue: number;
  /** La marge qu'auraient faite, sans opération, la base, les références cannibalisées et les achats avancés. */
  margeSansOperation: number;
  marge: number;
}

/** Le « 2+1 » de deux semaines sur les fruits chez Celtis, au mois de mai. */
export function operationType(): Decomposition {
  const p = PROFILS.deuxPlusUnFruits;
  const base = 2 * BASE.celtis.fruits;
  const enPlus = p.lift * base;
  const volume = base + enPlus;
  const margeVendue = volume * margePromo("deuxPlusUn", "fruits");
  const margeSansOperation = (base + p.s * enPlus) * MCV.fruits + p.c * enPlus * MCV_CANNIBALISEE;
  return {
    base,
    enPlus,
    cannibalises: p.c * enPlus,
    avances: p.s * enPlus,
    nouveaux: p.i * enPlus,
    volume,
    margeVendue,
    margeSansOperation,
    marge: margeVendue - margeSansOperation - FRAIS_OP,
  };
}

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: { cout?: number; casse?: number; service?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chaleur",
    titre: "Coup de chaleur et groupe froid en panne",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Trois jours à 33 °C, et le groupe froid d'une semi-remorque a lâché entre Loudéac et la plateforme de Celtis : 3 200 packs détruits, la chaîne du froid n'étant plus garantie. Les chambres froides ont tourné à plein : 2 500 € d'énergie en plus.",
    effet: { cout: 2500, casse: 3200, service: 0.006 },
  },
  {
    id: "ligne",
    titre: "Panne d'une ligne de conditionnement",
    de: "Gurvan Kerebel",
    role: "Responsable de production, Loudéac",
    texte:
      "La ligne 4 s'est arrêtée deux jours (un vérin de la thermoformeuse) : production reportée sur les autres lignes, en heures supplémentaires le samedi, 6 000 €. Quelques commandes servies incomplètes.",
    effet: { cout: 6000, service: 0.012 },
  },
  {
    id: "kerfroid",
    titre: "Retards des Transports Kerfroid",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Les Transports Kerfroid manquent de chauffeurs cette semaine : une vingtaine de livraisons hors créneau chez Celtis et Opaline, 2 800 € de pénalités logistiques.",
    effet: { cout: 2800, service: 0.015 },
  },
  {
    id: "opercules",
    titre: "Opercules défectueux",
    de: "Azilis Cozic",
    role: "Responsable emballages et développement",
    texte:
      "Un lot d'opercules mal scellés chez le fournisseur : 4 100 packs bloqués et détruits à l'usine, la ligne arrêtée une demi-journée le temps de changer de lot. Le fournisseur prend à sa charge la moitié de la perte.",
    effet: { cout: 1200, casse: 2050 },
  },
  {
    id: "plateforme",
    titre: "Grève à la plateforme d'Opaline",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Grève de deux jours à la plateforme régionale d'Opaline : les commandes ont été reçues avec retard, 3 600 packs refusés faute des deux tiers de DLC. Ils sont partis à la banque alimentaire.",
    effet: { casse: 3600, service: 0.01 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Les emplacements d'opérations possibles : chacun a son tirage, quelles que soient les décisions. */
export const EMPLACEMENTS = [
  "C1",
  "P1",
  "O1",
  "C1b",
  "O1b",
  "P1b",
  "C2",
  "O2",
  "P2",
  "RC",
  "RO",
  "F",
] as const;
export type Emplacement = (typeof EMPLACEMENTS)[number];

export interface Hasard {
  /** La demande de la semaine, commune aux trois enseignes. */
  demande: readonly number[];
  /** L'écart entre la hausse réelle d'une opération et sa hausse attendue. */
  ecart: Readonly<Record<Emplacement, number>>;
  /** Le Brassé recrute-t-il de nouveaux acheteurs ? */
  recrute: boolean;
  /** La tendance propre des ventes du Brassé d'ici la fin juillet. */
  tendance: number;
  /** Ce que l'attaque de Nordal prend aux ventes de Kerbrélan. */
  volNordal: number;
  uRuptureNordal: number;
  uEscalade: number;
  uProspectus: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001069 + 7);
  const demande = [1];
  for (let w = 1; w <= SEMAINES; w += 1) demande.push(borne(1 + 0.03 * gauss(r), 0.93, 1.07));
  const ecart = {} as Record<Emplacement, number>;
  for (const e of EMPLACEMENTS) ecart[e] = borne(1 + 0.12 * gauss(r), 0.7, 1.3);
  const recrute = r() < CHANCE_RECRUTE;
  const tendance = borne(0.04 * gauss(r), -0.08, 0.08);
  const volNordal = VOL_NORDAL.min + (VOL_NORDAL.max - VOL_NORDAL.min) * r();
  const uRuptureNordal = r();
  const uEscalade = r();
  const uProspectus = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    demande,
    ecart,
    recrute,
    tendance,
    volNordal,
    uRuptureNordal,
    uEscalade,
    uProspectus,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Celtis accepte-t-il de remplacer le « 2+1 » de la semaine 3 par le Brassé ? */
export const prospectusChange = (graine: number) =>
  hasard(graine).uProspectus >= CHANCE_REFUS_PROSPECTUS;

/** La mesure qui sépare les nouveaux acheteurs des achats avancés est-elle connue avant juillet ? */
export const mesureFiable = (chemin: readonly number[]) =>
  chemin[D.mesure] === 0 || chemin[D.mesure] === 2;

/** Nordal prolonge-t-il son attaque ? */
export const nordalProlonge = (chemin: readonly number[], graine: number) =>
  hasard(graine).uEscalade < CHANCE_ESCALADE[chemin[D.nordal] ?? 3]!;

export const nordalRompt = (graine: number) =>
  hasard(graine).uRuptureNordal < CHANCE_RUPTURE_NORDAL;

/** Le profil du Brassé en « 2e à −40 % », selon ce que le hasard a décidé. */
export const profilBrasse = (graine: number): Profil =>
  hasard(graine).recrute ? PROFILS.brasseRecrute : PROFILS.brasseDeplace;

/* ---------------------------------------------------------------------------
 * LES OPÉRATIONS DU TRIMESTRE.
 * ------------------------------------------------------------------------- */

export interface Operation {
  id: Emplacement;
  enseigne: Enseigne;
  debut: number;
  duree: number;
  mecanique: Mecanique;
  portee: readonly Reference[];
  profil: Profil;
  /** Une opération qui recrute : une rupture y coûte un acheteur. */
  recrutement: boolean;
}

export interface Animation {
  enseigne: Enseigne;
  semaines: readonly number[];
  cout: number;
}

const FRUITS: readonly Reference[] = ["fruits"];
const BRASSE: readonly Reference[] = ["brasse"];
const GAMME: readonly Reference[] = REFERENCES;

const op = (
  id: Emplacement,
  enseigne: Enseigne,
  debut: number,
  mecanique: Mecanique,
  portee: readonly Reference[],
  profil: Profil,
  duree = 2,
): Operation => ({
  id,
  enseigne,
  debut,
  duree,
  mecanique,
  portee,
  profil,
  recrutement: portee === BRASSE,
});

/** Les emplacements de juillet du plan signé. */
const JUILLET: readonly { id: Emplacement; enseigne: Enseigne; debut: number }[] = [
  { id: "C2", enseigne: "celtis", debut: 9 },
  { id: "O2", enseigne: "opaline", debut: 11 },
  { id: "P2", enseigne: "proxival", debut: 11 },
];

/** Le Brassé est-il poussé en juillet, plutôt qu'une animation sans remise ? */
export function brasseEnJuillet(chemin: readonly number[], graine: number): boolean {
  if (chemin[D.juillet] !== 1) return false;
  return mesureFiable(chemin) ? hasard(graine).recrute : true;
}

export function operations(chemin: readonly number[], graine: number): Operation[] {
  const [d1, , , d4, d5, d6] = chemin;
  const brasse = profilBrasse(graine);
  const ops: Operation[] = [];
  // Les opérations de mai et juin.
  const vague: readonly { id: Emplacement; enseigne: Enseigne; debut: number }[] = [
    { id: "C1", enseigne: "celtis", debut: 3 },
    { id: "P1", enseigne: "proxival", debut: 5 },
    { id: "O1", enseigne: "opaline", debut: 7 },
  ];
  for (const v of vague) {
    if (d1 === 0)
      ops.push(op(v.id, v.enseigne, v.debut, "deuxPlusUn", GAMME, PROFILS.deuxPlusUnGamme));
    else if (d1 === 1)
      ops.push(op(v.id, v.enseigne, v.debut, "deuxPlusUn", FRUITS, PROFILS.deuxPlusUnFruits));
    else if (d1 === 2) {
      if (v.id === "C1" && !prospectusChange(graine)) {
        ops.push(op(v.id, v.enseigne, v.debut, "deuxPlusUn", FRUITS, PROFILS.deuxPlusUnFruits));
      } else ops.push(op(v.id, v.enseigne, v.debut, "deuxiemeMoins40", BRASSE, brasse));
    } else ops.push(op(v.id, v.enseigne, v.debut, "deuxiemeMoins40", FRUITS, PROFILS.douceFruits));
  }
  if (d1 === 0) {
    ops.push(op("O1b", "opaline", 4, "deuxPlusUn", GAMME, PROFILS.deuxPlusUnGamme));
    ops.push(op("C1b", "celtis", 6, "deuxPlusUn", GAMME, PROFILS.deuxPlusUnGamme));
    ops.push(op("P1b", "proxival", 8, "deuxPlusUn", GAMME, PROFILS.deuxPlusUnGamme));
  }
  // Juillet.
  for (const j of JUILLET) {
    if (d4 === 0) {
      ops.push(
        d1 === 0
          ? op(j.id, j.enseigne, j.debut, "deuxPlusUn", GAMME, PROFILS.deuxPlusUnGamme)
          : op(j.id, j.enseigne, j.debut, "deuxPlusUn", FRUITS, PROFILS.deuxPlusUnFruits),
      );
    } else if (brasseEnJuillet(chemin, graine)) {
      ops.push(op(j.id, j.enseigne, j.debut, "deuxiemeMoins40", BRASSE, brasse));
    }
  }
  // La riposte à Nordal.
  if (d5 === 0) {
    ops.push(op("RC", "celtis", 10, "deuxPlusUn", GAMME, PROFILS.riposteGamme, 3));
    ops.push(op("RO", "opaline", 10, "deuxPlusUn", GAMME, PROFILS.riposteGamme, 3));
  }
  // La proposition de Celtis pour la fin juillet.
  if (d6 === 0) ops.push(op("F", "celtis", 12, "moins34", GAMME, PROFILS.moins34Gamme));
  if (d6 === 1) ops.push(op("F", "celtis", 12, "deuxiemeMoins40", FRUITS, PROFILS.douceFruits));
  return ops.sort((a, b) => a.debut - b.debut);
}

/** Les animations sans remise : dégustations et tête de gondole au prix normal. */
export function animations(chemin: readonly number[], graine: number): Animation[] {
  const a: Animation[] = [];
  const sansRemise =
    chemin[D.juillet] === 2 || (chemin[D.juillet] === 1 && !brasseEnJuillet(chemin, graine));
  if (sansRemise) {
    for (const j of JUILLET) {
      a.push({ enseigne: j.enseigne, semaines: [j.debut, j.debut + 1], cout: COUT_ANIMATION });
    }
  }
  if (chemin[D.fin] === 2) {
    a.push({ enseigne: "celtis", semaines: [12, 13], cout: COUT_DEGUSTATION_CELTIS });
  }
  return a;
}

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** Les ventes de la gamme dans les trois enseignes, en packs. */
  ventes: number;
  /** Dont vendus en promotion. */
  promo: number;
  /** La marge incrémentale de la semaine. */
  marge: number;
  /** Cumulée depuis le début du trimestre. */
  cumul: number;
  service: number;
  /** Les packs déclassés ou détruits depuis le début du trimestre. */
  casse: number;
  /** La part du plafond annuel de Celtis consommée. */
  plafond: number;
  /** Les ventes du Brassé chez Celtis. */
  brasse: number;
  /** Les packs que Nordal a pris dans la semaine. */
  nordal: number;
};

export interface BilanOperation {
  op: Operation;
  /** La part que la centrale accepte, sous le plafond. */
  acceptee: number;
  volume: number;
  enPlus: number;
  marge: number;
  casse: number;
  rupture: number;
  /** La valeur des acheteurs recrutés qui resteront, estimée fin juillet. */
  recrues: number;
}

export interface Trimestre {
  graine: number;
  semaines: readonly (Semaine | null)[];
  /** La marge incrémentale du trimestre, effets durables estimés compris. */
  objectif: number;
  /** La marge incrémentale des treize semaines (et des creux et rachats qui débordent). */
  marge: number;
  durable: {
    recrues: number;
    nordal: number;
    habitude: number;
    dereferencement: number;
    gondole: number;
  };
  ops: readonly BilanOperation[];
  /** La part du volume annuel vendue en promotion, toutes enseignes. */
  partPromo: number;
  plafondDepasse: boolean;
  casse: number;
  rupture: number;
  serviceMoyen: number;
  rotation: number;
  dereference: boolean;
  recrute: boolean;
  prospectusChange: boolean;
  /** Celtis a refusé de remplacer le « 2+1 » de la semaine 3 par le Brassé. */
  prospectusRefuse: boolean;
  nordalProlonge: boolean;
  nordalRompt: boolean;
  volNordal: number;
  /** Ce qui reste sous le plafond légal, enseigne par enseigne, après les opérations acceptées. */
  place: Readonly<Record<Enseigne, number>>;
  /** La prévision : la marge de l'opération type, en euros. */
  operationType: number;
}

const ajouter = (t: number[], w: number, v: number) => {
  const k = Math.min(w, SEMAINES + 1);
  t[k] = (t[k] ?? 0) + v;
};

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, d4, d5, d6] = chemin;
  const N = SEMAINES + 2;
  const zero = () => Array.from({ length: N }, () => 0);
  // Les flux semaine par semaine ; l'indice 14 reçoit ce qui déborde du trimestre.
  const marge = zero();
  const ventes = zero();
  const promo = zero();
  const commande = zero();
  const manque = zero();
  const cassePacks = zero();
  const brasseCeltis = zero();
  const nordalPacks = zero();
  const promoCeltis = zero();
  const prevuCeltis = zero();
  const enPromo = new Set<string>();

  const base = (e: Enseigne, r: Reference, w: number) =>
    BASE[e][r] * saison(w) * (h.demande[w] ?? 1);
  const planifiee = (e: Enseigne, r: Reference, w: number) => BASE[e][r] * saison(w);
  // La tendance du Brassé : il s'installe quand il recrute, il plafonne sinon.
  const tendance = (w: number) =>
    (h.recrute ? 0.06 : -0.02) * (w / SEMAINES) + h.tendance * (w / SEMAINES);

  for (let w = 1; w <= SEMAINES; w += 1) {
    for (const e of ENSEIGNES) {
      for (const r of REFERENCES) {
        const v = base(e, r, w);
        ventes[w]! += v;
        commande[w]! += v;
      }
    }
    brasseCeltis[w]! += base("celtis", "brasse", w) * (1 + tendance(w));
  }

  // Le plafond : chaque centrale accepte ce qui tient dans ce qui reste.
  const reste: Record<Enseigne, number> = {
    celtis: placeDuTrimestre("celtis"),
    opaline: placeDuTrimestre("opaline"),
    proxival: placeDuTrimestre("proxival"),
  };
  const promoQ: Record<Enseigne, number> = { celtis: 0, opaline: 0, proxival: 0 };
  let recrues = 0;
  let casseTotale = 0;
  let ruptureTotale = 0;
  const bilans: BilanOperation[] = [];
  const acceptees: { op: Operation; fin: number }[] = [];

  for (const o of operations(chemin, graine)) {
    const semaines = Array.from({ length: o.duree }, (_, k) => o.debut + k);
    const prevu = somme(
      semaines.flatMap((w) =>
        o.portee.map((r) => (1 + o.profil.lift) * planifiee(o.enseigne, r, w)),
      ),
    );
    let f = Math.min(1, reste[o.enseigne] / prevu);
    if (f < PART_MINIMALE) f = 0;
    reste[o.enseigne] -= f * prevu;
    if (f === 0) {
      bilans.push({
        op: o,
        acceptee: 0,
        volume: 0,
        enPlus: 0,
        marge: 0,
        casse: 0,
        rupture: 0,
        recrues: 0,
      });
      continue;
    }
    // La fréquence : les opérations récentes de la même enseigne font stocker davantage.
    const recentes = acceptees.filter(
      (a) => a.op.enseigne === o.enseigne && a.fin >= o.debut - FENETRE_FREQUENCE,
    ).length;
    const p = o.profil;
    const decale = Math.min(EFFET_FREQUENCE * recentes, p.i - 0.05);
    const s = p.s + decale;
    const i = p.i - decale;
    const ecart = h.ecart[o.id];
    let margeOp = -FRAIS_OP;
    marge[o.debut]! -= FRAIS_OP;
    let demande = 0;
    let enPlusOp = 0;
    let annonce = 0;
    let attendu = 0;
    let recruesOp = 0;
    const fin = o.debut + o.duree - 1;
    for (const w of semaines) {
      for (const r of o.portee) {
        const b = f * base(o.enseigne, r, w);
        const x = p.lift * b * ecart;
        const pm = margePromo(o.mecanique, r);
        const m = (b + x) * pm - b * MCV[r] - p.c * x * MCV_CANNIBALISEE;
        marge[w]! += m;
        margeOp += m;
        const cannibale = o.portee === GAMME ? 0 : p.c * x;
        ventes[w]! += x - cannibale;
        promo[w]! += b + x;
        commande[w]! += x;
        demande += b + x;
        enPlusOp += x;
        if (o.enseigne === "celtis") {
          promoCeltis[w]! += b + x;
          prevuCeltis[w]! += (1 + p.lift) * f * planifiee(o.enseigne, r, w);
        }
        annonce += (1 + p.annonce) * f * planifiee(o.enseigne, r, w);
        attendu += (1 + p.lift) * f * planifiee(o.enseigne, r, w);
        // Le creux : les achats avancés manquent les trois semaines suivantes.
        CREUX.forEach((part, k) => {
          const v = s * x * part;
          ajouter(marge, fin + 1 + k, -v * MCV[r]);
          ajouter(ventes, fin + 1 + k, -v);
          if (o.enseigne === "celtis" && r === "brasse") ajouter(brasseCeltis, fin + 1 + k, -v);
          margeOp -= v * MCV[r];
        });
        // Les rachats des nouveaux acheteurs, au prix normal.
        for (let k = 1; k <= SEMAINES_DE_RACHAT; k += 1) {
          const v = (i * x * p.rachat) / SEMAINES_DE_RACHAT;
          ajouter(marge, fin + k, v * MCV[r]);
          ajouter(ventes, fin + k, v);
          if (o.enseigne === "celtis" && r === "brasse") ajouter(brasseCeltis, fin + k, v);
          margeOp += v * MCV[r];
        }
        recruesOp += i * x * p.durable * MCV[r];
        if (o.enseigne === "celtis") {
          if (r === "brasse") brasseCeltis[w]! += b + x;
          if (r === "fruits") brasseCeltis[w]! -= PART_BRASSE_CANNIBALISE * p.c * x;
        }
        enPromo.add(`${o.enseigne}:${w}`);
      }
    }
    promoQ[o.enseigne] += demande;
    // L'usine : ce qu'on produit, selon qui prévoit.
    const regime = o.debut >= SEMAINE_PIC ? d3 : 3;
    const production =
      regime === 0
        ? attendu * (1 + SECURITE_PIC)
        : regime === 1
          ? annonce * 1.2
          : regime === 2
            ? annonce * 0.9
            : annonce;
    const exces = Math.max(0, production - demande);
    const casse = exces * (1 - ECOULE);
    const rupture = Math.max(0, demande - production);
    const coutRupture = rupture * (o.recrutement ? COUT_RUPTURE.recrutement : COUT_RUPTURE.profond);
    ajouter(marge, fin + 1, -casse * COUT_CASSE);
    ajouter(cassePacks, fin + 1, casse);
    for (const w of semaines) {
      marge[w]! -= coutRupture / o.duree;
      manque[w]! += rupture / o.duree;
      ventes[w]! -= rupture / o.duree;
    }
    margeOp -= casse * COUT_CASSE + coutRupture;
    casseTotale += casse;
    ruptureTotale += rupture;
    recrues += recruesOp;
    bilans.push({
      op: o,
      acceptee: f,
      volume: demande,
      enPlus: enPlusOp,
      marge: margeOp,
      casse,
      rupture,
      recrues: recruesOp,
    });
    acceptees.push({ op: o, fin });
  }

  // Les animations sans remise : le Brassé vend plus, à de nouveaux acheteurs.
  const brasse = profilBrasse(graine);
  for (const a of animations(chemin, graine)) {
    marge[a.semaines[0]!]! -= a.cout;
    for (const w of a.semaines) {
      const x = EFFET_ANIMATION * base(a.enseigne, "brasse", w);
      marge[w]! += x * MCV.brasse;
      ventes[w]! += x;
      commande[w]! += x;
      if (a.enseigne === "celtis") brasseCeltis[w]! += x;
      for (let k = 1; k <= SEMAINES_DE_RACHAT; k += 1) {
        const v = (x * brasse.rachat) / SEMAINES_DE_RACHAT;
        ajouter(marge, w + k, v * MCV.brasse);
        ajouter(ventes, w + k, v);
        if (a.enseigne === "celtis") ajouter(brasseCeltis, w + k, v);
      }
      recrues += x * brasse.durable * MCV.brasse;
    }
  }

  // Nordal : un « 2+1 » chez Celtis et Opaline, semaines 10 à 12.
  const prolonge = nordalProlonge(chemin, graine);
  const rompt = nordalRompt(graine);
  const riposte = (e: Enseigne) =>
    bilans.find((b) => b.op.id === (e === "celtis" ? "RC" : "RO"))?.acceptee ?? 0;
  let perduNordal = 0;
  const semainesNordal = prolonge ? [...SEMAINES_NORDAL, 13, 14, 15] : SEMAINES_NORDAL;
  for (const e of ENSEIGNES_NORDAL) {
    for (const w of [...semainesNordal, ...(prolonge ? [] : [13])]) {
      const traine = !prolonge && w === 13;
      let mod = 1;
      if (d5 === 0) mod = w <= 12 ? 1 - 0.85 * riposte(e) : 1;
      else if (d5 === 1) mod = traine ? 0.8 : 0.6;
      else if (d5 === 2) mod = traine ? 0.7 : 0.55;
      if (enPromo.has(`${e}:${w}`) && d5 !== 0) mod *= 0.6;
      const intensite = h.volNordal * (traine ? TRAINE_NORDAL : 1) * mod;
      const sw = Math.min(w, SEMAINES);
      for (const r of REFERENCES) {
        const v = intensite * base(e, r, sw);
        const m = v * MCV[r];
        ajouter(marge, w, -m);
        perduNordal += m;
        if (w <= SEMAINES) {
          ventes[w]! -= v;
          nordalPacks[w]! += v;
        }
        if (e === "celtis" && r === "brasse") ajouter(brasseCeltis, w, -v);
      }
      if (d5 === 2) {
        const coupons =
          COUPONS.retour *
          h.volNordal *
          (traine ? TRAINE_NORDAL : 1) *
          somme(REFERENCES.map((r) => base(e, r, sw)));
        ajouter(marge, w, -coupons * COUPONS.valeur);
      }
      if (d5 === 1 && rompt && (w === 11 || w === 12)) {
        for (const r of REFERENCES) {
          const v = CAPTURE * base(e, r, w);
          marge[w]! += v * MCV[r];
          ventes[w]! += v;
          if (e === "celtis" && r === "brasse") brasseCeltis[w]! += v;
        }
      }
    }
  }
  if (d5 === 1) marge[10]! -= COUT_TENIR;
  if (d5 === 2) marge[10]! -= COUPONS.mise;
  // Annuler juillet : les centrales donnent les emplacements à Nordal.
  if (d4 === 3) {
    marge[9]! -= FRAIS_OP;
    for (const j of JUILLET) {
      for (const w of [j.debut, j.debut + 1]) {
        for (const r of REFERENCES) {
          const v = VOL_EMPLACEMENT * base(j.enseigne, r, w);
          marge[w]! -= v * MCV[r];
          perduNordal += v * MCV[r];
          ventes[w]! -= v;
          nordalPacks[w]! += v;
          if (j.enseigne === "celtis" && r === "brasse") brasseCeltis[w]! -= v;
        }
      }
    }
  }
  const garde = GARDE_NORDAL * perduNordal * (d5 === 0 || d5 === 2 ? 0.3 : d5 === 1 ? 0.7 : 1);

  // Les études, et la prévision partagée avec l'usine.
  if (d2 === 0) marge[3]! -= COUT_TEST;
  if (d2 === 2) marge[3]! -= COUT_PANEL;
  if (d3 === 0) marge[7]! -= COUT_PIC;
  marge[1]! -= Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  // Les imprévus.
  const serviceImprevu = zero();
  for (const { imprevu, semaine } of h.imprevus) {
    marge[semaine]! -= (imprevu.effet.cout ?? 0) + (imprevu.effet.casse ?? 0) * COUT_CASSE;
    cassePacks[semaine]! += imprevu.effet.casse ?? 0;
    casseTotale += imprevu.effet.casse ?? 0;
    serviceImprevu[semaine]! += imprevu.effet.service ?? 0;
  }

  // La revue de gamme du Brassé chez Celtis.
  const rotation = somme(brasseCeltis.slice(8, SEMAINES + 1)) / 6;
  const dereference = rotation < SEUIL_ROTATION;

  // L'habitude du prix promotionnel, sur l'année.
  const partPromo =
    somme(ENSEIGNES.map((e) => AVANT[e] + promoQ[e] + APRES[e])) /
    somme(ENSEIGNES.map(volumeAnnuel));
  const habitude = -VALEUR_POINT * Math.max(0, 100 * (partPromo - SEUIL_HABITUDE));

  const durable = {
    recrues,
    nordal: -garde,
    habitude,
    dereferencement: dereference ? -PERTE_DEREFERENCEMENT : 0,
    gondole:
      d6 === 3 || (d6 !== 2 && !bilans.some((b) => b.op.id === "F" && b.acceptee > 0))
        ? -VALEUR_GONDOLE
        : 0,
  };

  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let casseCumul = 0;
  let prevuCumulCeltis = 0;
  let services = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    cumul += marge[w]!;
    casseCumul += cassePacks[w]!;
    prevuCumulCeltis += prevuCeltis[w]!;
    const service = SERVICE_NORMAL - manque[w]! / commande[w]! - serviceImprevu[w]!;
    services += service;
    semaines.push({
      ventes: ventes[w]!,
      promo: promo[w]!,
      marge: marge[w]!,
      cumul,
      service,
      casse: casseCumul,
      plafond:
        (AVANT.celtis + prevuCumulCeltis + APRES.celtis) / (PLAFOND_LEGAL * volumeAnnuel("celtis")),
      brasse: brasseCeltis[w]!,
      nordal: nordalPacks[w]!,
    });
  }
  const margeTotale = cumul + marge[SEMAINES + 1]!;
  return {
    graine,
    semaines,
    objectif: margeTotale + somme(Object.values(durable)),
    marge: margeTotale,
    durable,
    ops: bilans,
    partPromo,
    plafondDepasse: bilans.some((b) => b.acceptee < 1),
    casse: casseTotale,
    rupture: ruptureTotale,
    serviceMoyen: services / SEMAINES,
    rotation,
    dereference,
    recrute: h.recrute,
    prospectusChange: prospectusChange(graine),
    prospectusRefuse: chemin[D.plan] === 2 && !prospectusChange(graine),
    nordalProlonge: prolonge,
    nordalRompt: rompt,
    volNordal: h.volNordal,
    place: reste,
    operationType: operationType().marge,
  };
}

/** Ce qui s'est passé pendant des semaines : centrales, usine, Nordal, revue de gamme, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    t,
    /** Les opérations que le plafond réduit ou fait refuser, la semaine qui précède. */
    reduites: t.ops.filter((b) => b.acceptee < 1 && dans(Math.max(2, b.op.debut - 1))),
    /** Casse ou rupture notables, la semaine qui suit l'opération ; celles de la semaine 3 sont dites en semaine 4. */
    usine: t.ops.filter(
      (b) =>
        b.op.id !== "C1" &&
        b.acceptee > 0 &&
        Math.max(b.casse, b.rupture) >= 1500 &&
        dans(b.op.debut + b.op.duree),
    ),
    emplacements: chemin[D.juillet] === 3 && dans(9),
    capture: chemin[D.nordal] === 1 && t.nordalRompt && dans(11),
    prolonge: t.nordalProlonge && dans(13),
    revue: dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePromo {
  ventes: number | null;
  marge: number | null;
  plafond: number | null;
  service: number | null;
  casse: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  promo: number | null;
  placeCeltis: number | null;
  placeOpaline: number | null;
  casseC1: number | null;
  ruptureC1: number | null;
  margeC1: number | null;
  enPlusC1: number | null;
  brasseC1: number | null;
  /** La hausse annoncée à l'usine et la hausse vendue de l'opération de la semaine 3, en %. */
  annonceC1: number | null;
  liftC1: number | null;
  recrute: number | null;
  rotation: number | null;
  partPromo: number | null;
}

/**
 * Ce que Morwenna lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». Au lundi de la semaine 1, le plan signé n'a encore
 * rien vendu : on montre les ventes de base et le plafond déjà engagé.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePromo {
  if (semaine === 0) {
    return {
      ventes: BASE_TOTALE,
      marge: 0,
      plafond: (AVANT.celtis + APRES.celtis) / (PLAFOND_LEGAL * volumeAnnuel("celtis")),
      service: SERVICE_NORMAL,
      casse: 0,
      promo: 0,
      placeCeltis: placeDuTrimestre("celtis"),
      placeOpaline: placeDuTrimestre("opaline"),
      casseC1: null,
      ruptureC1: null,
      margeC1: null,
      enPlusC1: null,
      brasseC1: null,
      annonceC1: null,
      liftC1: null,
      recrute: null,
      rotation: null,
      partPromo: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const c1 = t.ops.find((b) => b.op.id === "C1");
  const depuis = Math.max(1, Math.min(8, semaine - 5));
  const vues = t.semaines.slice(depuis, semaine + 1) as Semaine[];
  return {
    ventes: s.ventes,
    marge: s.cumul,
    plafond: s.plafond,
    service: s.service,
    casse: s.casse,
    promo: s.promo,
    placeCeltis: t.place.celtis,
    placeOpaline: t.place.opaline,
    casseC1: c1?.casse ?? 0,
    ruptureC1: c1?.rupture ?? 0,
    margeC1: c1?.marge ?? 0,
    enPlusC1: c1?.enPlus ?? 0,
    brasseC1: c1?.op.recrutement ? 1 : 0,
    annonceC1: c1 ? Math.round(100 * c1.op.profil.annonce) : 0,
    liftC1: c1 && c1.volume > 0 ? Math.round((100 * c1.enPlus) / (c1.volume - c1.enPlus)) : 0,
    recrute: t.recrute ? 1 : 0,
    rotation: somme(vues.map((w) => w.brasse)) / vues.length,
    partPromo: t.partPromo,
  };
}
