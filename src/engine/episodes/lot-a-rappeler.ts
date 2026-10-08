/**
 * LE LOT QU'IL FAUT PEUT-ÊTRE RAPPELER — le modèle d'une alerte sanitaire à la
 * Laiterie de Kerbrélan.
 *
 * Un vendredi à 17 h, l'autocontrôle d'un lot de fromage blanc de la ligne 3
 * de Pontivy revient présomptif positif à Listeria monocytogenes. Les palettes
 * sont parties vers les entrepôts de Celtis et d'Opaline ; la confirmation
 * demande 48 à 72 heures ; le directeur commercial demande d'attendre. Treize
 * semaines, d'octobre à décembre, six décisions. Quatre mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · LE PÉRIMÈTRE SE LIT DANS LES ENREGISTREMENTS DE LA LIGNE. Une
 *     contamination après pasteurisation peut toucher tout ce que la ligne a
 *     rempli entre deux nettoyages en place (NEP) complets ; un rinçage au
 *     changement de format n'est pas un nettoyage. Les enregistrements de la
 *     ligne et des NEP (une source qui coûte une journée) montrent les six
 *     lots, 37 palettes, encadrés par les NEP du lundi et du jeudi : le
 *     périmètre défendable. Le seul lot positif est trop étroit, un mois de
 *     production est trop large.
 *   · LE TEMPS JOUE CONTRE LE CONSOMMATEUR, ET CONTRE L'USINE. Un pot passe
 *     quelques jours en entrepôt et en rayon : deux palettes expédiées sur
 *     trois sont encore récupérables le vendredi soir, quatre sur dix le lundi
 *     soir. Attendre la confirmation laisse partir le produit en caisse ; si le
 *     positif est confirmé, la DDPP, informée tard, impose le périmètre, élargit
 *     parfois le rappel et dresse procès-verbal une fois sur deux ; la presse
 *     et l'enseigne suivent plus souvent. Attendre ne coûte rien quand le
 *     présomptif est un faux positif, une fois sur quatre : c'est ce qui en
 *     fait un piège.
 *   · CE QUI EST LAISSÉ EN RAYON REVIENT EN SECOND RAPPEL. La vérité est tirée
 *     au hasard : faux positif (Listeria innocua), contamination ponctuelle au
 *     changement de format du mardi (les deux lots du mardi), ou souche
 *     installée dans la ligne (le joint d'une vanne de la remplisseuse), qui
 *     touche aussi les lots des intervalles voisins et la production qui
 *     reprend. Les lots contaminés hors du périmètre sont découverts, souvent,
 *     quelques semaines plus tard : second rappel, mise en demeure, presse,
 *     enseigne qui suspend le produit. Les échantillons conservés des lots
 *     voisins et les analyses environnementales disent, pour quelques
 *     milliers d'euros, s'il faut étendre ; étendre à trois semaines ou à un
 *     mois de production détruit des produits sains et paie des frais de
 *     retrait sans protéger davantage.
 *   · LA SOURCE SE CHERCHE, OU ELLE REVIENT. Une niche dans un joint survit
 *     aux NEP. Redémarrer la ligne comme avant remet en rayon des pots
 *     contaminés ; la libération positive les retient à l'usine. Démonter et
 *     écouvillonner la remplisseuse trouve la niche plus souvent quand une
 *     campagne environnementale a dit où chercher ; la réfection complète de
 *     la zone la supprime à coup sûr, pour bien plus cher. Une désinfection
 *     choc sans démonter laisse la niche en place. Une zone humide (le siphon
 *     sous la remplisseuse) entretient, dans tous les cas, un risque
 *     d'événement sporadique, au trimestre et au suivant.
 *
 * Le trimestre est jugé en euros, plus haut = mieux : l'opposé du coût de
 * l'alerte. Ce coût compte ce que le trimestre a payé (produits retirés et
 * détruits, frais de retrait des enseignes, avis de rappel et remboursements,
 * arrêts et nettoyages de la ligne, analyses, ventes perdues) et LES SUITES
 * ATTENDUES qu'on sait estimer en fin de trimestre : l'amende si la DDPP a
 * dressé procès-verbal, les semaines de déréférencement et de presse au-delà
 * de décembre, le risque d'une nouvelle alerte au trimestre suivant et celui
 * d'une non-conformité majeure à l'audit IFS de janvier. La santé des
 * consommateurs n'y est pas un coût de plus : c'est ce qu'on laisse en rayon
 * qui coûte, en rappels, en sanctions, en confiance.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des pots du périmètre passent en caisse, à rembourser. */
export const PERTE_PAR_JOUR = 2000;

/* ---------------------------------------------------------------------------
 * LES LOTS : ce que disent les enregistrements de la ligne 3 et des expéditions.
 * ------------------------------------------------------------------------- */

/** Les six lots remplis entre la NEP complète du lundi 5 h et celle du jeudi 5 h. */
export const LOTS_INTERVALLE = [
  { lot: "L3-278-K", jour: "lundi", produit: "Kerbrélan 500 g", palettes: 7, usine: 0 },
  { lot: "L3-278-C", jour: "lundi", produit: "MDD Celtis 1 kg", palettes: 5, usine: 0 },
  { lot: "L3-279-K", jour: "mardi", produit: "Kerbrélan 500 g", palettes: 7, usine: 0 },
  { lot: "L3-279-O", jour: "mardi", produit: "MDD Opaline 500 g", palettes: 5, usine: 0 },
  { lot: "L3-280-K", jour: "mercredi", produit: "Kerbrélan 500 g", palettes: 7, usine: 0 },
  { lot: "L3-280-C", jour: "mercredi", produit: "MDD Celtis 1 kg", palettes: 6, usine: 6 },
] as const;
/** Le lot de l'autocontrôle présomptif. */
export const LOT_POSITIF = "L3-279-K";
/** Le chiffre que la prévision demande : les palettes des six lots encadrés par les deux NEP. */
export const PALETTES_A_BLOQUER = LOTS_INTERVALLE.reduce((s, l) => s + l.palettes, 0);
export const USINE_INTERVALLE = LOTS_INTERVALLE.reduce((s, l) => s + l.usine, 0);
/** Ce que la ligne 3 remplit en un jour, et en une semaine de cinq jours. */
export const PALETTES_JOUR = 12;
export const PALETTES_SEMAINE = 5 * PALETTES_JOUR;
/** La part des lots contaminés quand une souche est installée dans la remplisseuse. */
export const PART_CONTAMINEE_NICHE = 1 / 3;
/** La DLC du fromage blanc, en jours ; les enseignes exigent les deux tiers à réception. */
export const DLC = 26;

export type Groupe = "positif" | "intervalle" | "avant" | "apres" | "precedents" | "anciens";
export type Moment = "s1" | "s2" | "s2v" | "s3" | "tard";

/**
 * Les groupes de lots, et la part des palettes expédiées encore récupérables en
 * entrepôt ou en rayon, selon le moment du retrait : vendredi soir (s1), lundi
 * soir à la confirmation (s2), vendredi de la semaine 2 (s2v), mercredi de la
 * semaine 3 après les analyses (s3), ou un second rappel, des semaines plus tard.
 * `rembourse` : ce qu'un avis de rappel coûte en remboursements, par palette déjà
 * vendue (les pots encore au réfrigérateur ; les plus anciens sont mangés).
 */
export const GROUPES: Record<
  Groupe,
  { palettes: number; usine: number; retirable: Record<Moment, number>; rembourse: number }
> = {
  positif: {
    palettes: 7,
    usine: 0,
    retirable: { s1: 0.65, s2: 0.4, s2v: 0.3, s3: 0.25, tard: 0.05 },
    rembourse: 400,
  },
  intervalle: {
    palettes: PALETTES_A_BLOQUER - 7,
    usine: USINE_INTERVALLE,
    retirable: { s1: 0.65, s2: 0.4, s2v: 0.3, s3: 0.25, tard: 0.05 },
    rembourse: 400,
  },
  /** Les quatre lots du jeudi et du vendredi précédents, avant la NEP du lundi. */
  avant: {
    palettes: 24,
    usine: 0,
    retirable: { s1: 0.3, s2: 0.18, s2v: 0.13, s3: 0.1, tard: 0.02 },
    rembourse: 250,
  },
  /** Les quatre lots du jeudi et du vendredi de la semaine 1, après la NEP du jeudi. */
  apres: {
    palettes: 24,
    usine: 12,
    retirable: { s1: 0.95, s2: 0.7, s2v: 0.55, s3: 0.45, tard: 0.05 },
    rembourse: 400,
  },
  /** Le reste des trois semaines depuis la dernière analyse environnementale négative. */
  precedents: {
    palettes: 95,
    usine: 0,
    retirable: { s1: 0.12, s2: 0.07, s2v: 0.05, s3: 0.04, tard: 0 },
    rembourse: 120,
  },
  /** La quatrième semaine en arrière : un mois de production en tout. */
  anciens: {
    palettes: 60,
    usine: 0,
    retirable: { s1: 0.03, s2: 0.02, s2v: 0.01, s3: 0.01, tard: 0 },
    rembourse: 40,
  },
};
export const GROUPES_ORDRE: readonly Groupe[] = [
  "positif",
  "intervalle",
  "avant",
  "apres",
  "precedents",
  "anciens",
];
/** Les palettes restées à l'usine et non bloquées partent le lundi : ce qui en reste ensuite. */
export const LIVREES_LUNDI: Record<Moment, number> = {
  s1: 1,
  s2: 0.95,
  s2v: 0.75,
  s3: 0.6,
  tard: 0.05,
};
export const MOIS_DE_PRODUCTION = GROUPES_ORDRE.reduce((s, g) => s + GROUPES[g].palettes, 0);
export const TROIS_SEMAINES = MOIS_DE_PRODUCTION - GROUPES.anciens.palettes;

/* ---------------------------------------------------------------------------
 * CE QUE COÛTE CHAQUE GESTE.
 * ------------------------------------------------------------------------- */

/** Une palette expédiée et retirée : l'avoir à l'enseigne au prix de cession, le retour, la destruction. */
export const PRIX_CESSION_PALETTE = 1300;
export const RETRAIT_PALETTE = 1500;
/** Une palette bloquée à l'usine et détruite : son coût de revient industriel, et la destruction. */
export const USINE_PALETTE = 1200;
/** Une palette bloquée puis libérée après des analyses négatives : vendue avec moins de DLC, ou donnée. */
export const LIBEREE_PALETTE = 300;
/**
 * Une palette retirée, encore bloquée en entrepôt quand les analyses reviennent négatives :
 * reprise et déclassée, plutôt que détruite. C'est le cas de six palettes retirées sur dix.
 */
export const LIBEREE_ENTREPOT = 700;
export const PART_EN_ENTREPOT = 0.6;
/** Les frais de retrait des enseignes : 230 magasins Celtis et Opaline, 50 € chacun, par opération. */
export const MAGASINS = 230;
export const FRAIS_PAR_MAGASIN = 50;
export const FRAIS_ENSEIGNES = MAGASINS * FRAIS_PAR_MAGASIN;
/** Un avis de rappel des consommateurs : affichettes, site public des rappels, numéro vert, communiqué. */
export const AVIS_RAPPEL = 9000;

/** Un jour d'arrêt de la ligne 3 : marge perdue, lait écoulé en spot, pénalités de rupture. */
export const ARRET_JOUR = 2800;
export const ARRET_SEMAINE = 5 * ARRET_JOUR;
/** La libération positive : chaque lot gardé trois jours en chambre froide jusqu'aux résultats. */
export const LIBERATION_SEMAINE = 2500;
export const CAMPAGNE_ENVIRONNEMENT = 3500;
export const PRELEVEMENTS_CAMPAGNE = 40;
/** Un échantillon conservé par lot : les cinq autres lots de l'intervalle et les huit lots voisins. */
export const ECHANTILLONS_VOISINS = 13;
export const PRIX_ANALYSE = 180;
export const ANALYSES_VOISINS = ECHANTILLONS_VOISINS * PRIX_ANALYSE;

export const SOURCE = {
  /** Démonter la remplisseuse et ses vannes, écouvillonner chaque point, refaire le siphon. */
  recherche: { cout: 9000, jours: 2 },
  /** Remplacer tous les joints et vannes, reprendre le sol et les siphons de la zone. */
  refection: { cout: 26000, jours: 5 },
  /** Désinfection choc et NEP renforcée, sans démonter. */
  choc: { cout: 3000, jours: 1 },
} as const;

/** La DDPP dresse procès-verbal : l'amende et les frais attendus, jugés après le trimestre. */
export const SANCTION = 40000;
/** Après un second rappel : mise en demeure, prélèvements officiels aux frais de l'usine. */
export const MISE_EN_DEMEURE = 12000;
/** Un article de presse : des ventes de fromage blanc Kerbrélan perdues pendant sept semaines. */
export const PRESSE_SEMAINE = 5000;
export const PRESSE_DUREE = 7;
/** Le fromage blanc suspendu chez Celtis : six semaines, et deux de reprise après décembre. */
export const DEREF_SEMAINE = 7000;
export const DEREF_DEBUT = 8;
export const DEREF_APRES = 2;
/**
 * Un cas de listériose rattaché à la souche par le centre national de référence :
 * la procédure, l'indemnisation au-delà de l'assurance, la presse nationale, les ventes.
 * Son risque suit les palettes contaminées parties chez les consommateurs.
 */
export const CAS_GRAVE = 150000;
export const RISQUE_PAR_PALETTE = 0.002;
export const SEMAINE_CAS = 6;
/** Une nouvelle alerte au trimestre suivant, au coût moyen d'un retrait bien conduit. */
export const NOUVELLE_ALERTE = 70000;
/** Une non-conformité majeure à l'audit IFS de janvier : audit complémentaire, plan d'actions, enseignes. */
export const NC_IFS = 25000;

export const COUTS = {
  audit: 2500,
  promo: 18000,
  litige: 3000,
  planSemaine: 1200,
  formation: 3000,
  analysesSemaine: 2000,
  liberationSemaine: LIBERATION_SEMAINE,
} as const;

/** Les probabilités que les sources permettent d'estimer. */
export const P = {
  faux: 0.25,
  lot: 0.35,
  /** La DDPP, informée après la confirmation, impose les lots voisins aussi (le rappel élargi). */
  elargi: 0.5,
  /** Procès-verbal pour information tardive : après une attente, et après un retrait du seul lot. */
  sanctionAttente: 0.6,
  sanctionLot: 0.3,
  /** Informée tard d'un retrait du seul lot, la DDPP impose les lots de l'intervalle. */
  imposeIntervalle: 0.6,
  /** Les échantillons conservés d'un lot contaminé reviennent positifs. */
  echantillons: 0.9,
  /** La campagne de 40 prélèvements trouve la souche en zone 1, si elle y est. */
  environnement: 0.9,
  /** Un lot contaminé resté en rayon est découvert dans le trimestre (DDPP, enseigne, signalement). */
  decouverteLot: 0.6,
  decouverteLigne: 0.9,
  /** L'autocontrôle de routine d'une semaine trouve un lot contaminé, souche installée. */
  autocontrole: 0.5,
  /** La recherche de la source trouve la niche, avec ou sans campagne environnementale. */
  sourceAvecCampagne: 0.85,
  sourceSansCampagne: 0.5,
  choc: 0.2,
  /** Le risque d'un événement par semaine, une fois la ligne redémarrée. */
  niche: 0.35,
  zoneHumide: 0.025,
  sipHonRefait: 0.008,
  refection: 0.004,
  /** Le plan environnemental révisé trouve le problème dans l'environnement avant le produit. */
  planAvantProduit: 0.7,
  /** La presse, au premier avis de rappel et au second. */
  presse: 0.15,
  presseTardive: 0.3,
  presseMois: 0.2,
  presseSecond: 0.5,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  alerte: 0,
  ligne: 1,
  perimetre: 2,
  source: 3,
  enseignes: 4,
  plan: 5,
} as const;

/** Ne rien changer, décision par décision : attendre, redémarrer, s'en tenir au périmètre… */
export const NEUTRE = [0, 0, 1, 3, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que l'imprévu coûte, en euros, la semaine où il tombe. */
  cout: number;
  /** Des jours de ligne perdus, qui pèsent sur le taux de service. */
  jours?: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "kerfroid",
    titre: "Grève chez les Transports Kerfroid",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Les chauffeurs des Transports Kerfroid sont en grève deux jours : des tournées reportées, des affrètements de dépannage, et des pénalités logistiques chez Opaline.",
    cout: 6000,
  },
  {
    id: "froid",
    titre: "Panne d'un groupe froid à Pontivy",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le groupe froid de la chambre d'expédition n° 2 a lâché dans la nuit : neuf palettes de crèmes desserts au-dessus de 6 °C pendant trois heures, déclassées et détruites.",
    cout: 9000,
  },
  {
    id: "tempete",
    titre: "Tempête et coupure de courant",
    de: "Fanchon Lozac'h",
    role: "Directrice de l'usine de Pontivy",
    texte:
      "La tempête a coupé le courant six heures à Pontivy : production arrêtée, mix de la journée perdu, chambres froides tenues par le groupe électrogène.",
    cout: 7000,
    jours: 1,
  },
  {
    id: "gastro",
    titre: "Gastro-entérite dans l'équipe de nettoyage",
    de: "Maëwenn Postec",
    role: "Directrice des ressources humaines",
    texte:
      "Quatre agents de l'équipe de nettoyage de nuit sont en arrêt la même semaine : des intérimaires à former aux NEP, des heures supplémentaires pour les autres.",
    cout: 4000,
  },
  {
    id: "lait",
    titre: "Lait refusé à la réception",
    de: "Hoel Quiniou",
    role: "Responsable de la collecte",
    texte:
      "Une citerne de la collecte est refusée à Pontivy : antibiotiques détectés au test rapide. 28 000 litres détruits, à remplacer en lait spot.",
    cout: 5000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export type Scenario = "faux" | "lot" | "ligne";

export interface Hasard {
  /** Ce qu'est vraiment le présomptif. */
  scenario: Scenario;
  uElargi: number;
  uSanction: number;
  uImpose: number;
  uEchantillons: number;
  uEnvironnement: number;
  uDecouverte: number;
  /** La semaine où la contamination laissée en rayon est découverte, si elle l'est. */
  semaineDecouverte: number;
  uSource: number;
  uPresse: number;
  uPresseSecond: number;
  uCeltis: number;
  uCas: number;
  /** Indexées par semaine : l'autocontrôle de routine trouve-t-il un lot contaminé ? */
  autocontrole: readonly number[];
  /** Indexées par semaine : un événement survient-il sur la ligne ? */
  evenement: readonly number[];
  /** Le hasard des ventes de la semaine, qui fait varier un peu les arrêts. */
  ventes: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001051 + 7);
  const u = r();
  const scenario: Scenario = u < P.faux ? "faux" : u < P.faux + P.lot ? "lot" : "ligne";
  const uElargi = r();
  const uSanction = r();
  const uImpose = r();
  const uEchantillons = r();
  const uEnvironnement = r();
  const uDecouverte = r();
  const semaineDecouverte = 5 + Math.floor(r() * 4);
  const uSource = r();
  const uPresse = r();
  const uPresseSecond = r();
  const uCeltis = r();
  const uCas = r();
  const autocontrole: number[] = [0];
  const evenement: number[] = [0];
  const ventes: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) {
    autocontrole.push(r());
    evenement.push(r());
    ventes.push(Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))));
  }
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    scenario,
    uElargi,
    uSanction,
    uImpose,
    uEchantillons,
    uEnvironnement,
    uDecouverte,
    semaineDecouverte,
    uSource,
    uPresse,
    uPresseSecond,
    uCeltis,
    uCas,
    autocontrole,
    evenement,
    ventes,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

export const confirme = (graine: number) => hasard(graine).scenario !== "faux";

/** Les groupes de lots contaminés, selon ce qu'est vraiment le présomptif. */
export function contamines(s: Scenario): readonly Groupe[] {
  if (s === "faux") return [];
  if (s === "lot") return ["positif", "intervalle"];
  return ["positif", "intervalle", "avant", "apres"];
}

/** La campagne environnementale (ou l'arrêt, qui la comprend) a-t-elle été faite en semaine 2 ? */
export const campagneFaite = (chemin: readonly number[]) =>
  chemin[D.ligne] === 1 || chemin[D.ligne] === 2;

/** La campagne trouve la souche dans la remplisseuse : seulement si elle y est, neuf fois sur dix. */
export const nicheVue = (chemin: readonly number[], graine: number) =>
  campagneFaite(chemin) &&
  hasard(graine).scenario === "ligne" &&
  hasard(graine).uEnvironnement < P.environnement;

/** Les échantillons conservés des lots voisins reviennent positifs : la souche y est, et l'analyse la voit. */
export const echantillonsPositifs = (graine: number) =>
  hasard(graine).scenario !== "faux" && hasard(graine).uEchantillons < P.echantillons;

/** La chance que la recherche de la source trouve la niche, selon ce que la semaine 2 a appris. */
export function chanceDeTrouver(chemin: readonly number[]): number {
  const c = chemin[D.source];
  if (c === 0) return campagneFaite(chemin) ? P.sourceAvecCampagne : P.sourceSansCampagne;
  if (c === 1) return 1;
  if (c === 2) return P.choc;
  return 0;
}

/**
 * CELTIS SUSPEND-ELLE SON FROMAGE BLANC ?
 *
 * Le fromage blanc à marque Celtis porte le nom de l'enseigne : sa direction
 * qualité décide en semaine 7, sur ce qu'elle a vu. Un retrait conservatoire
 * l'inquiète un peu, un rappel confirmé davantage ; une information tardive, un
 * second rappel ou un article de presse la font pencher. L'audit transparent la
 * rassure ; une promotion ne répond pas à sa question ; contester ses frais la
 * braque.
 */
export function chanceDeSuspension(f: {
  retrait: boolean;
  rappel: boolean;
  tardive: boolean;
  second: boolean;
  presse: boolean;
  choix: number;
}): number {
  if (!f.retrait && !f.rappel) return 0;
  let p = f.rappel ? 0.3 : 0.12;
  if (f.tardive) p += 0.25;
  if (f.second) p += 0.3;
  if (f.presse) p += 0.1;
  const facteur = [0.3, 0.85, 1.5, 1][f.choix] ?? 1;
  return Math.min(0.9, p * facteur);
}

export type Echantillons = "non" | "negatifs" | "mardi" | "voisins";

/** Ce que diraient les échantillons conservés : seulement selon ce qu'est vraiment le présomptif. */
export function resultatEchantillons(graine: number): Exclude<Echantillons, "non"> {
  if (!echantillonsPositifs(graine)) return "negatifs";
  return hasard(graine).scenario === "ligne" ? "voisins" : "mardi";
}

export type Semaine = {
  /** Ce que la semaine a coûté. */
  cout: number;
  coutCumule: number;
  /** Palettes retirées des entrepôts et des magasins, ou détruites à l'usine, depuis le début. */
  palettes: number;
  /** Les avis de rappel des consommateurs publiés depuis le début. */
  rappels: number;
  /** Jours d'arrêt de la ligne 3, cumulés. */
  arret: number;
  /** Le taux de service du fromage blanc aux enseignes, cette semaine. */
  service: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'opposé du coût de l'alerte, suites attendues comprises : plus haut = mieux. */
  objectif: number;
  coutTotal: number;
  /** Ce que le trimestre a payé. */
  coutTrimestre: number;
  /** Les suites attendues en fin de trimestre. */
  suites: number;
  scenario: Scenario;
  confirme: boolean;
  /** La DDPP a-t-elle été informée dès le vendredi ? */
  ddppATemps: boolean;
  /** Palettes retirées ou détruites, et dont produits sains (rien n'y était contaminé). */
  palettes: number;
  palettesSaines: number;
  /** Les palettes contaminées vendues avant d'être retirées, ou jamais retirées. */
  exposition: number;
  rappels: number;
  /** La semaine d'un second rappel, venu d'un lot laissé en rayon ou d'une récidive ; 0 : aucun. */
  secondRappel: number;
  /** La semaine où l'autocontrôle de routine trouve un lot contaminé après le redémarrage ; 0 : jamais. */
  autocontroleSemaine: number;
  /** La semaine où un lot laissé en rayon est découvert ; 0 : jamais. */
  decouverte: number;
  /** Après cette découverte, la DDPP a imposé trois semaines de production et l'arrêt de la ligne. */
  troisSemaines: boolean;
  /** La DDPP a imposé un rappel élargi. */
  elargi: boolean;
  /** La DDPP a dressé procès-verbal. */
  sanction: boolean;
  /** Un cas de listériose a été rattaché à la souche, et sa probabilité au vu de l'exposition. */
  cas: boolean;
  chanceCas: number;
  /** La semaine d'un article de presse ; 0 : aucun. */
  presse: number;
  /** Celtis a suspendu son fromage blanc. */
  suspendu: boolean;
  chanceSuspension: number;
  /** Les échantillons conservés ont été analysés, et ce qu'ils ont dit : rien, les lots du mardi, les lots voisins. */
  echantillons: Echantillons;
  /** La campagne environnementale de la semaine 2 a vu la souche dans la remplisseuse. */
  nicheVue: boolean;
  /** La niche est-elle éliminée, et quand ? 0 : jamais (ou il n'y en avait pas). */
  nicheEliminee: number;
  /** La semaine d'un événement sur la ligne après le redémarrage ; 0 : aucun. */
  recidive: number;
  /** L'événement a été trouvé dans l'environnement, avant d'atteindre un produit. */
  recidiveEnvironnement: boolean;
  zoneHumide: "en place" | "siphon refait" | "zone refaite";
  arret: number;
  serviceMoyen: number;
  /** Le chiffre que la prévision demande. */
  aBloquer: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

interface EtatGroupe {
  /** Le moment du retrait ; null : jamais retiré. */
  retire: Moment | null;
  /** Les palettes restées à l'usine ont-elles été bloquées le vendredi ? */
  bloquees: boolean;
  rappele: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const s = h.scenario;
  const estConfirme = s !== "faux";
  const conta = contamines(s);
  const couts: number[] = Array.from({ length: SEMAINES + 2 }, () => 0);
  const arretJours: number[] = Array.from({ length: SEMAINES + 2 }, () => 0);
  const palettesSem: number[] = Array.from({ length: SEMAINES + 2 }, () => 0);
  const rappelsSem: number[] = Array.from({ length: SEMAINES + 2 }, () => 0);
  const serviceMoins: number[] = Array.from({ length: SEMAINES + 2 }, () => 0);
  let suites = 0;
  let palettesSaines = 0;
  let exposition = 0;
  let operations = 0;

  const etat: Record<Groupe, EtatGroupe> = {
    positif: { retire: null, bloquees: false, rappele: false },
    intervalle: { retire: null, bloquees: false, rappele: false },
    avant: { retire: null, bloquees: false, rappele: false },
    apres: { retire: null, bloquees: false, rappele: false },
    precedents: { retire: null, bloquees: false, rappele: false },
    anciens: { retire: null, bloquees: false, rappele: false },
  };
  const expediees = (g: Groupe) => GROUPES[g].palettes - GROUPES[g].usine;
  /** Les palettes d'un groupe déjà vendues : au moment de son retrait, ou toutes. */
  const vendues = (g: Groupe) => {
    const G = GROUPES[g];
    const e = etat[g];
    if (!e.retire) return expediees(g) + G.usine;
    const vExp = expediees(g) * (1 - G.retirable[e.retire]);
    const vUsine = e.bloquees || e.retire === "s1" ? 0 : G.usine * (1 - LIVREES_LUNDI[e.retire]);
    return vExp + vUsine;
  };

  /** Retirer des groupes au moment `m`, en semaine `w` : une opération, des frais d'enseignes. */
  const retirer = (groupes: readonly Groupe[], m: Moment, w: number) => {
    const a = groupes.filter((g) => !etat[g].retire);
    if (!a.length) return;
    let cout = FRAIS_ENSEIGNES;
    let n = 0;
    for (const g of a) {
      const G = GROUPES[g];
      etat[g].retire = m;
      const rec = expediees(g) * G.retirable[m];
      let usine = 0;
      let livrees = 0;
      if (m === "s1") {
        etat[g].bloquees = G.usine > 0;
        usine = G.usine;
      } else {
        livrees = G.usine * LIVREES_LUNDI[m];
      }
      cout += (rec + livrees) * RETRAIT_PALETTE + usine * USINE_PALETTE;
      n += rec + livrees + usine;
      if (!conta.includes(g)) palettesSaines += rec + livrees + usine;
    }
    couts[w]! += cout;
    palettesSem[w]! += n;
    operations += 1;
  };
  /** Arrêter la ligne 3 : des jours sans production, qui coûtent. */
  const arreter = (w: number, j: number) => {
    arretJours[w]! += j;
    couts[w]! += j * ARRET_JOUR;
  };
  /** Publier un avis de rappel des consommateurs pour des groupes déjà retirés (ou non). */
  const rappeler = (groupes: readonly Groupe[], w: number) => {
    const a = groupes.filter((g) => !etat[g].rappele);
    if (!a.length) return;
    let cout = AVIS_RAPPEL;
    for (const g of a) {
      etat[g].rappele = true;
      cout += vendues(g) * GROUPES[g].rembourse;
    }
    couts[w]! += cout;
    rappelsSem[w]! += 1;
  };

  // Semaine 1, vendredi : l'enquête, puis la décision.
  couts[1]! += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const tout: readonly Groupe[] = GROUPES_ORDRE;
  if (d1 === 1) retirer(["positif"], "s1", 1);
  if (d1 === 2) retirer(["positif", "intervalle"], "s1", 1);
  if (d1 === 3) {
    retirer(tout, "s1", 1);
    rappeler(tout, 1);
  }
  const ddppATemps = d1 === 2 || d1 === 3;
  const tardive = estConfirme && (d1 === 0 || d1 === 1);

  // Semaine 2, lundi soir : la confirmation tombe.
  let elargi = false;
  let sanction = false;
  if (estConfirme) {
    if (d1 === 0) {
      // Informée tard, la DDPP impose les lots de l'intervalle, et parfois les voisins.
      retirer(["positif", "intervalle"], "s2", 2);
      elargi = h.uElargi < P.elargi;
      if (elargi) retirer(["avant", "apres", "precedents"], "s2", 2);
      rappeler(
        elargi
          ? ["positif", "intervalle", "avant", "apres", "precedents"]
          : ["positif", "intervalle"],
        2,
      );
      sanction = h.uSanction < P.sanctionAttente;
    }
    if (d1 === 1) {
      rappeler(["positif"], 2);
      if (h.uImpose < P.imposeIntervalle) {
        retirer(["intervalle"], "s2", 2);
        rappeler(["intervalle"], 2);
      }
      sanction = h.uSanction < P.sanctionLot;
    }
    if (d1 === 2) rappeler(["positif", "intervalle"], 2);
  }
  // Un premier article, quand l'avis de rappel paraît.
  const pPresse = estConfirme
    ? P.presse + (tardive ? P.presseTardive : 0) + (d1 === 3 ? P.presseMois : 0)
    : d1 === 3
      ? P.presse + P.presseMois
      : 0;
  let presse = h.uPresse < pPresse ? 2 : 0;

  // Semaine 3 : le périmètre, au vu de la confirmation (décidé le vendredi de la semaine 2).
  const voisins: readonly Groupe[] = ["intervalle", "avant", "apres"];
  let echantillons: Echantillons = "non";
  if (d3 === 0) {
    couts[3]! += ANALYSES_VOISINS;
    echantillons = resultatEchantillons(graine);
    if (echantillons !== "negatifs") {
      // Les lots dont les échantillons reviennent positifs : retirés et rappelés, dans la même alerte.
      const touches = voisins.filter((g) => conta.includes(g) && !etat[g].retire);
      retirer(touches, "s3", 3);
      rappeler(
        voisins.filter((g) => conta.includes(g)),
        3,
      );
    }
    if (!estConfirme) {
      // Les palettes bloquées à l'usine, négatives, sont libérées : vendues avec moins de DLC, ou données.
      for (const g of tout) {
        if (etat[g].bloquees) {
          couts[3]! -= GROUPES[g].usine * (USINE_PALETTE - LIBEREE_PALETTE);
          palettesSem[3]! -= GROUPES[g].usine;
          palettesSaines -= GROUPES[g].usine;
        }
        // Les palettes retirées encore en entrepôt sont reprises et déclassées, pas détruites.
        const m = etat[g].retire;
        if (m && m !== "tard") {
          const retirees =
            expediees(g) * GROUPES[g].retirable[m] +
            (m === "s1" ? 0 : GROUPES[g].usine * LIVREES_LUNDI[m]);
          couts[3]! -= retirees * PART_EN_ENTREPOT * (RETRAIT_PALETTE - LIBEREE_ENTREPOT);
        }
      }
    }
  }
  if (d3 === 2) {
    const trois: readonly Groupe[] = ["positif", "intervalle", "avant", "apres", "precedents"];
    retirer(trois, "s2v", 3);
    if (estConfirme) rappeler(trois, 3);
  }
  if (d3 === 3) {
    retirer(["positif", ...voisins], "s2v", 3);
    if (estConfirme) rappeler(["positif", ...voisins], 3);
  }

  // La ligne 3, semaines 2 à 4 : le redémarrage.
  const vue = nicheVue(chemin, graine);
  let niche = s === "ligne";
  let nicheEliminee = 0;
  let productionExposee = 0;
  let secondRappel = 0;
  let autocontroleSemaine = 0;
  let decouverte = 0;
  let troisSemaines = false;
  let suspensionLigne = 0;
  for (let w = 2; w <= 4; w += 1) {
    if (d2 === 2) {
      arreter(w, 5);
      if (w === 2) couts[w]! += CAMPAGNE_ENVIRONNEMENT;
      continue;
    }
    if (d2 === 1 && w === 2) couts[w]! += CAMPAGNE_ENVIRONNEMENT;
    if (d2 === 1 && vue) {
      // La remplisseuse est positive mercredi : la ligne s'arrête jusqu'au traitement de la source.
      if (w === 2) {
        const n = 3 * PALETTES_JOUR * PART_CONTAMINEE_NICHE;
        couts[w]! += LIBERATION_SEMAINE + n * USINE_PALETTE;
        palettesSem[w]! += n;
        arreter(w, 2);
      } else arreter(w, 5);
      continue;
    }
    if (d2 === 1 || d2 === 3) {
      // Libération positive : les lots contaminés sont détruits à l'usine, rien ne part.
      couts[w]! += LIBERATION_SEMAINE;
      serviceMoins[w]! += w === 2 ? 0.02 : 0.005;
      if (niche) {
        const n = PALETTES_SEMAINE * PART_CONTAMINEE_NICHE;
        couts[w]! += n * USINE_PALETTE;
        palettesSem[w]! += n;
      }
      continue;
    }
    // Redémarrage comme avant.
    if (suspensionLigne) {
      arreter(w, 5);
      continue;
    }
    if (niche) {
      if (h.autocontrole[w]! < P.autocontrole) {
        // L'autocontrôle trouve un lot : retrait et rappel de la semaine, et la DDPP suspend la ligne.
        const n = PALETTES_SEMAINE * 0.6;
        couts[w]! +=
          FRAIS_ENSEIGNES +
          AVIS_RAPPEL +
          n * 0.65 * RETRAIT_PALETTE +
          n * 0.35 * GROUPES.positif.rembourse;
        palettesSem[w]! += n * 0.65;
        rappelsSem[w]! += 1;
        exposition += n * 0.35 * PART_CONTAMINEE_NICHE;
        if (!secondRappel) secondRappel = w;
        autocontroleSemaine = w;
        suspensionLigne = w;
      } else {
        productionExposee += PALETTES_SEMAINE * PART_CONTAMINEE_NICHE;
      }
    }
  }

  // Semaine 5 : la source, et le siphon.
  let zone: Trimestre["zoneHumide"] = "en place";
  const choixSource = d4 ?? 3;
  if (choixSource === 0) {
    couts[5]! += SOURCE.recherche.cout;
    arreter(5, SOURCE.recherche.jours);
    zone = "siphon refait";
  }
  if (choixSource === 1) {
    couts[5]! += SOURCE.refection.cout;
    arreter(5, SOURCE.refection.jours);
    zone = "zone refaite";
  }
  if (choixSource === 2) {
    couts[5]! += SOURCE.choc.cout;
    arreter(5, SOURCE.choc.jours);
  }
  if (niche && h.uSource < chanceDeTrouver(chemin)) {
    niche = false;
    nicheEliminee = 5;
  }

  // Les lots contaminés laissés en rayon, et la production partie : découverts, ou non.
  const laisses = conta.filter((g) => !etat[g].retire);
  const pDecouverte = s === "ligne" ? P.decouverteLigne : P.decouverteLot;
  if ((laisses.length || productionExposee > 0) && h.uDecouverte < pDecouverte) {
    const w = h.semaineDecouverte;
    retirer(laisses, "tard", w);
    rappeler(laisses, w);
    if (laisses.length) {
      // La DDPP ne se fie plus au périmètre : trois semaines de production, et la ligne arrêtée.
      retirer(["precedents"], "tard", w);
      rappeler(["precedents"], w);
      arreter(Math.min(SEMAINES, w + 1), 5);
    } else {
      // Seule la production de la semaine 2 à 4 est en cause : un avis, des frais, peu à récupérer.
      couts[w]! += FRAIS_ENSEIGNES + AVIS_RAPPEL + productionExposee * 0.1 * RETRAIT_PALETTE;
      rappelsSem[w]! += 1;
    }
    if (!secondRappel || w < secondRappel) secondRappel = w;
    decouverte = w;
    troisSemaines = laisses.length > 0;
  }
  for (const g of conta) {
    const G = GROUPES[g];
    if (!etat[g].retire) exposition += expediees(g) + G.usine;
    else exposition += vendues(g);
  }
  exposition += productionExposee;

  // Semaines 5 à 13 : la ligne tourne ; une niche ou la zone humide peuvent refaire un positif.
  let recidive = 0;
  let recidiveEnvironnement = false;
  for (let w = 5; w <= SEMAINES; w += 1) {
    if (recidive) break;
    const p = niche
      ? P.niche
      : zone === "en place"
        ? P.zoneHumide
        : zone === "siphon refait"
          ? P.sipHonRefait
          : P.refection;
    if (h.evenement[w]! >= p) continue;
    recidive = w;
    const plan = w >= 10 ? d6 : 3;
    if (plan === 0 && h.evenement[w]! < p * P.planAvantProduit) {
      // Le plan révisé trouve le problème dans l'environnement : nettoyage ciblé, rien en rayon.
      recidiveEnvironnement = true;
      couts[w]! += 2000;
    } else if (plan === 2) {
      // Libération positive : le lot positif est détruit à l'usine.
      couts[w]! += PALETTES_JOUR * 3 * USINE_PALETTE;
      palettesSem[w]! += PALETTES_JOUR * 3;
    } else {
      // L'autocontrôle trouve un lot positif : un nouvel intervalle à retirer et rappeler.
      const recup = plan === 1 ? 0.8 : 0.65;
      const n = PALETTES_JOUR * 3;
      couts[w]! +=
        FRAIS_ENSEIGNES +
        AVIS_RAPPEL +
        n * recup * RETRAIT_PALETTE +
        n * (1 - recup) * GROUPES.positif.rembourse;
      palettesSem[w]! += n * recup;
      rappelsSem[w]! += 1;
      exposition += n * (1 - recup) * PART_CONTAMINEE_NICHE;
      if (!secondRappel) secondRappel = w;
    }
    // Après l'événement, la zone est refaite : la semaine suivante, cinq jours d'arrêt.
    if (niche || zone !== "zone refaite") {
      const apres = Math.min(SEMAINES + 1, w + 1);
      couts[apres]! += SOURCE.refection.cout;
      arreter(apres, SOURCE.refection.jours);
    }
    if (niche) nicheEliminee = w + 1;
    niche = false;
    zone = "zone refaite";
  }

  // Un cas de listériose rattaché à la souche : le risque suit ce qui est parti chez les consommateurs.
  const chanceCas = estConfirme ? Math.min(0.3, exposition * RISQUE_PAR_PALETTE) : 0;
  const cas = h.uCas < chanceCas;
  if (cas) {
    suites += CAS_GRAVE;
    if (!presse) presse = SEMAINE_CAS;
  }

  // Les suites d'un second rappel : mise en demeure, et un second article plus probable.
  if (secondRappel) {
    couts[Math.min(SEMAINES, secondRappel + 1)]! += MISE_EN_DEMEURE;
    if (!presse && h.uPresseSecond < P.presseSecond) presse = secondRappel;
  }
  if (presse) {
    for (let k = 0; k < PRESSE_DUREE; k += 1) {
      const w = presse + k;
      if (w <= SEMAINES) couts[w]! += PRESSE_SEMAINE;
      else suites += PRESSE_SEMAINE;
    }
  }

  // Semaine 7 : Celtis décide.
  const choixEnseignes = d5 ?? 3;
  if (choixEnseignes === 0) couts[7]! += COUTS.audit;
  if (choixEnseignes === 1) couts[8]! += COUTS.promo;
  if (choixEnseignes === 2) couts[7]! += COUTS.litige;
  const chanceSuspension = chanceDeSuspension({
    retrait: operations > 0,
    rappel: rappelsSem.slice(0, 8).some((x) => x > 0),
    tardive,
    second: secondRappel > 0 && secondRappel <= 7,
    presse: presse > 0 && presse <= 7,
    choix: choixEnseignes,
  });
  const suspendu = h.uCeltis < chanceSuspension;
  if (suspendu) {
    for (let w = DEREF_DEBUT; w <= SEMAINES; w += 1) couts[w]! += DEREF_SEMAINE;
    suites += DEREF_APRES * DEREF_SEMAINE;
  }

  // Semaines 10 à 13 : le plan de maîtrise sanitaire.
  const choixPlan = d6 ?? 3;
  for (let w = 10; w <= SEMAINES; w += 1) {
    if (choixPlan === 0) couts[w]! += COUTS.planSemaine + (w === 10 ? COUTS.formation : 0);
    if (choixPlan === 1) couts[w]! += COUTS.analysesSemaine;
    if (choixPlan === 2) {
      couts[w]! += COUTS.liberationSemaine;
      serviceMoins[w]! += w === 10 ? 0.02 : 0.005;
    }
  }

  // Les imprévus.
  for (const { imprevu, semaine } of h.imprevus) {
    couts[semaine]! += imprevu.cout;
    arretJours[semaine]! += imprevu.jours ?? 0;
  }

  // Les suites attendues en fin de trimestre.
  if (sanction) suites += SANCTION;
  const risqueRestant = niche
    ? 0.85
    : zone === "en place"
      ? 0.25
      : zone === "siphon refait"
        ? 0.1
        : 0.05;
  const facteurPlan = [0.4, 0.85, 0.85, 1][choixPlan] ?? 1;
  const risqueAlerte = risqueRestant * facteurPlan;
  suites += risqueAlerte * NOUVELLE_ALERTE;
  const alerteConnue = operations > 0 || rappelsSem.some((x) => x > 0);
  const pIfs = ([0.1, 0.4, 0.35, 0.5][choixPlan] ?? 0.5) * (alerteConnue ? 1 : 0.4);
  suites += pIfs * NC_IFS;

  // Les semaines, telles que le tableau de bord les lit.
  const semaines: (Semaine | null)[] = [null];
  let coutCumule = 0;
  let palettes = 0;
  let rappels = 0;
  let arret = 0;
  let serviceTotal = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const cout = couts[w]! + (w === SEMAINES ? couts[SEMAINES + 1]! : 0);
    const j = Math.min(5, arretJours[w]! + (w === SEMAINES ? arretJours[SEMAINES + 1]! : 0));
    coutCumule += cout;
    palettes += palettesSem[w]!;
    rappels += rappelsSem[w]!;
    arret += j;
    // Loudéac reprend une partie des volumes : un jour d'arrêt retire trois points et demi de service.
    const service = borne(
      0.99 - 0.035 * j * h.ventes[w]! - serviceMoins[w]! - (palettesSem[w]! > 0 ? 0.005 : 0),
      0.7,
      0.995,
    );
    serviceTotal += service;
    semaines.push({ cout, coutCumule, palettes, rappels, arret, service });
  }

  const coutTotal = coutCumule + suites;
  return {
    semaines,
    objectif: -coutTotal,
    coutTotal,
    coutTrimestre: coutCumule,
    suites,
    scenario: s,
    confirme: estConfirme,
    ddppATemps,
    palettes,
    palettesSaines,
    exposition,
    rappels,
    secondRappel,
    autocontroleSemaine,
    decouverte,
    troisSemaines,
    elargi,
    sanction,
    cas,
    chanceCas,
    presse,
    suspendu,
    chanceSuspension,
    echantillons,
    nicheVue: vue,
    nicheEliminee,
    recidive,
    recidiveEnvironnement,
    zoneHumide: zone,
    arret,
    serviceMoyen: serviceTotal / SEMAINES,
    aBloquer: PALETTES_A_BLOQUER,
  };
}

/** Ce qui s'est passé pendant des semaines : confirmation, analyses, second rappel, Celtis, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    confirmation: dans(2),
    elargi: t.elargi && dans(2),
    sanction: t.sanction && dans(4),
    presse: t.presse > 0 && dans(t.presse),
    secondRappel: t.secondRappel > 0 && dans(t.secondRappel),
    source: (chemin[D.source] ?? 3) !== 3 && dans(5),
    recidive: t.recidive > 0 && dans(t.recidive),
    suspension: dans(7),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRappel {
  cout: number | null;
  palettes: number | null;
  rappels: number | null;
  arret: number | null;
  service: number | null;
  /** La provision à date, au prorata, pour la jauge. */
  provisionADate: number | null;
  /** Lu pour les messages : la confirmation est-elle tombée, et positive ? */
  confirme: number | null;
  nicheVue: number | null;
  echantillons: number | null;
  secondRappel: number | null;
  suspendu: number | null;
  recidive: number | null;
  sanction: number | null;
}

/** La provision que le directeur financier a passée pour l'alerte. */
export const PROVISION = 150000;

/** Ce qu'Annaïg lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRappel {
  if (semaine === 0) {
    return {
      cout: 0,
      palettes: 0,
      rappels: 0,
      arret: 0,
      service: 0.99,
      provisionADate: 0,
      confirme: 0,
      nicheVue: 0,
      echantillons: 0,
      secondRappel: 0,
      suspendu: 0,
      recidive: 0,
      sanction: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    cout: s.coutCumule,
    palettes: s.palettes,
    rappels: s.rappels,
    arret: s.arret,
    service: s.service,
    provisionADate: (PROVISION * semaine) / SEMAINES,
    confirme: semaine >= 2 ? (t.confirme ? 1 : -1) : 0,
    nicheVue: semaine >= 2 && t.nicheVue ? 1 : 0,
    echantillons:
      semaine >= 3 && t.echantillons !== "non"
        ? t.echantillons === "voisins"
          ? 2
          : t.echantillons === "mardi"
            ? 1
            : -1
        : 0,
    secondRappel: t.secondRappel && semaine >= t.secondRappel ? t.secondRappel : 0,
    suspendu: t.suspendu && semaine >= 7 ? 1 : 0,
    recidive: t.recidive && semaine >= t.recidive ? t.recidive : 0,
    sanction: t.sanction && semaine >= 4 ? 1 : 0,
  };
}
