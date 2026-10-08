/**
 * LA MAINTENANCE QUI COURT APRÈS LES PANNES — le modèle de la ligne de
 * remplissage des desserts de l'usine de Loudéac (Laiterie de Kerbrélan).
 *
 * Une ligne qui remplit et opercule 18 000 pots de crèmes desserts et de riz
 * au lait à l'heure, en 3×8, 104 heures de fonctionnement par semaine ; douze
 * techniciens de maintenance pour toute l'usine, dont 70 % des heures partent
 * en dépannage ; 19 heures d'arrêt pour panne par mois sur cette ligne. Un
 * trimestre de septembre à novembre, avant le pic des desserts de décembre,
 * six décisions. Cinq mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · L'HISTORIQUE DES PANNES DIT OÙ REGARDER. Sur six mois, trois familles
 *     d'organes — les joints des doseurs, les capteurs de la scelleuse, les
 *     vérins — font 86 % des heures d'arrêt ; les vingt-trois autres organes
 *     de la ligne, le reste. Le temps moyen entre deux pannes (MTBF) se
 *     calcule organe par organe. Les taux de panne du modèle SONT ceux de cet
 *     historique, et les durées de réparation s'en déduisent : la source qui
 *     coûte une journée d'enquête dit vrai.
 *   · LE PRÉVENTIF COÛTE TOUT DE SUITE ET AGIT AVEC RETARD. Chaque organe a
 *     un état, un multiplicateur de son taux de panne : laissé au curatif, il
 *     dérive lentement vers l'usure (les gammes préventives sont en retard) ;
 *     un plan préventif ciblé le ramène, semaine après semaine, vers un état
 *     maîtrisé. Suspendre le préventif le fait remonter plus vite qu'il n'est
 *     descendu : des joints changés en septembre sont en fin de vie en
 *     décembre. Les arrêts planifiés se paient en heures de ligne, beaucoup
 *     moins quand on les cale dans les fenêtres de nettoyage en place (NEP).
 *   · LES PANNES SONT TIRÉES AU HASARD. Chaque semaine, le nombre de pannes
 *     de chaque organe suit une loi de Poisson dont le taux dépend de son état
 *     et des gestes de premier niveau ; chaque panne tombe ou non la nuit
 *     (l'astreinte met une demi-heure à arriver : c'est tout ce qu'un
 *     technicien de nuit retire, à peine plus de deux heures par mois) et
 *     manque ou non de sa pièce (huit heures d'attente en moyenne). Jusqu'à
 *     six heures d'arrêt par semaine se rattrapent le samedi ; au-delà, ce
 *     sont des ventes perdues et des pénalités logistiques. En décembre, rien
 *     ne se rattrape : la ligne tourne six jours sur sept et la DLC interdit
 *     de produire d'avance. Un joint qui casse peut aussi laisser un fragment
 *     dans le produit : le lot est bloqué, trié, détruit.
 *   · LE STOCK DE PIÈCES CRITIQUES RACCOURCIT LES PANNES, ET IMMOBILISE DE
 *     L'ARGENT. Son coût de possession (25 % par an) est compté ; un stock de
 *     toute la liste du constructeur protège aussi des pannes rares des autres
 *     organes, et immobilise plus de huit fois plus.
 *   · LE PREMIER NIVEAU DEMANDE FORMATION ET ACCORD. Nettoyer, inspecter,
 *     serrer : confiés aux conducteurs, ces gestes réduisent les pannes des
 *     organes qu'ils touchent, d'autant plus que les standards visent les
 *     organes de l'historique. Construits avec les équipes, ils sont acceptés
 *     le plus souvent ; imposés sans formation, ils le sont rarement, et un
 *     geste fait sans consignation peut blesser.
 *
 * L'OBJECTIF, en euros, est un coût à réduire, compté en négatif : les arrêts
 * de la ligne pendant le trimestre (rattrapages, ventes perdues et pénalités,
 * lots bloqués, accident), les dépenses de maintenance engagées (pièces,
 * interventions extérieures, recrutement, intérim, formation, coût de
 * possession du stock), PLUS le coût attendu des quatre semaines du pic de
 * décembre, ESTIMÉ à partir de l'état du parc en fin de novembre : les taux de
 * panne que l'état des organes et les pratiques en place à la semaine 13
 * donnent, les durées que le stock et l'organisation de nuit donnent, au prix
 * d'une heure perdue en décembre. L'estimation est une espérance, sans tirage :
 * c'est ce que la direction industrielle peut chiffrer le 30 novembre.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les heures de fonctionnement prévues de la ligne par semaine : 3×8, NEP et changements de format déduits. */
export const HEURES_SEMAINE = 104;
/** La cadence de la ligne, en pots par heure. */
export const CADENCE = 18000;
/** L'historique extrait de la GMAO : six mois, vingt-six semaines. */
export const SEMAINES_HISTO = 26;
export const HEURES_HISTO = HEURES_SEMAINE * SEMAINES_HISTO;

export type CodeOrgane = "doseurs" | "scelleuse" | "verins" | "autres";

export interface Organe {
  code: CodeOrgane;
  nom: string;
  /** Les pannes de l'historique, sur vingt-six semaines. */
  pannes: number;
  /** Les heures d'arrêt de l'historique. */
  heures: number;
  /** La part des pannes qui attendent une pièce absente du magasin. */
  partPiece: number;
}

export const ORGANES: readonly Organe[] = [
  { code: "doseurs", nom: "Joints des doseurs", pannes: 34, heures: 36, partPiece: 0.03 },
  { code: "scelleuse", nom: "Capteurs de la scelleuse", pannes: 38, heures: 41, partPiece: 0.025 },
  { code: "verins", nom: "Vérins", pannes: 12, heures: 21, partPiece: 0.09 },
  { code: "autres", nom: "Les 23 autres organes", pannes: 20, heures: 16, partPiece: 0.05 },
];
export const organe = (code: CodeOrgane) => ORGANES.find((o) => o.code === code)!;

export const PANNES_HISTO = ORGANES.reduce((s, o) => s + o.pannes, 0);
export const HEURES_ARRET_HISTO = ORGANES.reduce((s, o) => s + o.heures, 0);
/** Les heures d'arrêt pour panne par mois : 114 heures en six mois. */
export const ARRETS_PAR_MOIS = HEURES_ARRET_HISTO / 6;
/** La part des heures d'arrêt que font les trois familles d'organes critiques. */
export const PART_CRITIQUES = (HEURES_ARRET_HISTO - organe("autres").heures) / HEURES_ARRET_HISTO;
/** Le temps moyen entre deux pannes d'un organe, en heures : la prévision de la semaine 1 pour la scelleuse. */
export const mtbf = (o: Organe) => (HEURES_HISTO - o.heures) / o.pannes;
export const MTBF_SCELLEUSE = mtbf(organe("scelleuse"));
/** Le MTBF de la ligne entière, toutes pannes confondues. */
export const MTBF_LIGNE = (HEURES_HISTO - HEURES_ARRET_HISTO) / PANNES_HISTO;

/** Un quart des pannes tombent la nuit ; l'astreinte met une demi-heure à arriver. */
export const PART_NUIT = 0.25;
export const ATTENTE_ASTREINTE = 0.5;
/** Ce qu'un technicien de nuit ferait gagner, en heures d'arrêt par mois. */
export const GAIN_NUIT_MOIS = (PANNES_HISTO / 6) * PART_NUIT * ATTENTE_ASTREINTE;
/** L'attente d'une pièce absente du magasin : de 4 à 12 heures, 8 en moyenne. */
export const ATTENTE_PIECE = { min: 4, ecart: 8 } as const;
export const ATTENTE_PIECE_MOYENNE = ATTENTE_PIECE.min + ATTENTE_PIECE.ecart / 2;
/** Avec le contrat de livraison express : de 3 à 7 heures. */
export const ATTENTE_EXPRESS = { min: 3, ecart: 4 } as const;
export const ATTENTE_EXPRESS_MOYENNE = ATTENTE_EXPRESS.min + ATTENTE_EXPRESS.ecart / 2;

/** La durée d'une réparation, pièce en main et technicien sur place : ce que l'historique laisse une fois retirées l'astreinte et l'attente des pièces. */
export const reparation = (o: Organe) =>
  o.heures / o.pannes - PART_NUIT * ATTENTE_ASTREINTE - o.partPiece * ATTENTE_PIECE_MOYENNE;

/** Dans les pannes des doseurs, la part qui vient des joints. */
export const PART_JOINTS = 0.6;
/** Six doseurs, un joint chacun : la durée de vie moyenne d'un joint, en heures de fonctionnement. */
export const DOSEURS = 6;
export const VIE_JOINT =
  (DOSEURS * (HEURES_HISTO - organe("doseurs").heures)) / (organe("doseurs").pannes * PART_JOINTS);
/** Le remplacement systématique : aux trois quarts de cette durée de vie. */
export const FREQUENCE_JOINTS = 600;

/* ---------------------------------------------------------------------------
 * CE QUE COÛTE UNE HEURE.
 * ------------------------------------------------------------------------- */
/** Une heure d'arrêt rattrapée le samedi : heures supplémentaires de l'équipe, énergie, NEP de plus, produit jeté au redémarrage. */
export const HEURE_RATTRAPEE = 1500;
/** Les heures d'arrêt qu'un samedi permet de rattraper chaque semaine. */
export const RATTRAPABLE = 6;
/** La marge sur coût variable d'un pot de dessert, et les pénalités logistiques d'une heure de rupture. */
export const MARGE_POT = 0.11;
export const PENALITES_HEURE = 1820;
/** Une heure perdue sans rattrapage : 18 000 pots de marge, et les pénalités des enseignes. */
export const HEURE_PERDUE = CADENCE * MARGE_POT + PENALITES_HEURE;
/** Une heure d'arrêt planifiée à l'automne : rattrapée le samedi, sans produit perdu. */
export const HEURE_PLANIFIEE = 900;
/** Dans les fenêtres de NEP et de changement de format, un arrêt planifié ne prend que 30 % de son temps à la ligne. */
export const PART_HORS_NEP = 0.3;
/** Un lot bloqué pour un fragment de joint : un poste de production trié puis détruit. */
export const LOT_BLOQUE = 24000;
/** Le risque qu'un joint qui casse laisse un fragment dans le produit ; avec des joints détectables, le détecteur écarte les pots. */
export const P_FRAGMENT = 0.03;
export const P_FRAGMENT_DETECTABLE = 0.006;
/** Le tri et la NEP renforcée après un fragment : des heures d'arrêt en plus. */
export const ARRET_FRAGMENT = 2;
/** Le pic de décembre : quatre semaines, la ligne tourne six jours sur sept. */
export const DECEMBRE = { semaines: 4, charge: 1.15 } as const;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, la ligne continue de tomber : des rattrapages. */
export const PERTE_PAR_JOUR = 1500;

/* ---------------------------------------------------------------------------
 * LES ÉTATS DES ORGANES : un multiplicateur du taux de panne de l'historique.
 * ------------------------------------------------------------------------- */
/** Vers où dérive un organe laissé au curatif, et à quelle vitesse (la part de l'écart qui reste chaque semaine). */
export const USURE = { cible: 1.35, vitesse: 0.95, vitesseAutres: 0.97, cibleAutres: 1.2 } as const;
/** Quand le préventif est suspendu, des organes refaits remontent vite vers l'usure. */
export const REBOND = { cible: 1.35, vitesse: 0.8 } as const;
/** Le plan préventif ciblé : l'état visé, et la vitesse d'approche. */
export const PLAN = { doseurs: 0.6, scelleuse: 0.45, verins: 0.5, vitesse: 0.68 } as const;
/** Au pic, sans planificateur, le préventif saute le premier : les organes dérivent vers leur état d'origine. */
export const ALLEGE = { cible: 1.1, vitesse: 0.8 } as const;
/** Une campagne de remplacement sans plan : moins profonde. */
export const CAMPAGNE = { doseurs: 0.85, scelleuse: 0.75, verins: 0.8, vitesse: 0.72 } as const;
/** La révision générale par le constructeur ramène tout à cet état, puis l'usure reprend. */
export const REVISION = { etat: 0.7, semaine: 4, heures: 16, cout: 34000 } as const;
/** La révision de la scelleuse par le constructeur, fin novembre. */
export const REVISION_SCELLEUSE = { etat: 0.45, semaine: 12, heures: 12, cout: 15000 } as const;
/** Les joints des doseurs : remplacement systématique, conditionnel, ou une fois. */
export const JOINTS = {
  systematique: { cible: 0.25, vitesse: 0.55 },
  conditionnel: { cible: 0.3, vitesse: 0.55, sansInspection: 0.9, vitesseSans: 0.9 },
  /** Une semaine sur sept environ, l'inspection laisse passer un joint usé : il tient jusqu'à casser. */
  ratee: { chance: 0.15, facteur: 2.5 },
  uneFois: { etat: 0.35, vitesse: 0.88 },
  debut: 8,
} as const;

/** Les gestes de premier niveau : ce qu'ils retirent au taux de panne de chaque organe. */
export const PREMIER_NIVEAU = {
  cibles: { doseurs: 0.75, scelleuse: 0.67, verins: 0.85, autres: 0.92 },
  /** Des standards écrits sans l'historique : un gain deux fois moindre. */
  generiques: { doseurs: 0.875, scelleuse: 0.835, verins: 0.925, autres: 0.96 },
  /** Imposés sans formation : faits à moitié. */
  imposes: { doseurs: 0.94, scelleuse: 0.9, verins: 0.965, autres: 0.98 },
  /** L'accord des équipes, selon que l'historique a montré quoi regarder. */
  accord: { avecAnalyse: 0.85, sansAnalyse: 0.65 },
  debutAccord: 7,
  debutSansAccord: 10,
  debutImpose: 5,
  /** Un geste fait sans consignation, sur un trimestre. */
  accident: { chance: 0.3, arret: 4, cout: 6500 },
} as const;

/** En décembre, des interventions préparées durent 20 % de moins ; toute l'équipe au dépannage, 10 %. */
export const PREPARATION = 0.8;
export const TOUS_AU_DEPANNAGE = 0.9;

export const COUTS = {
  /** Le technicien de nuit en CDI : cabinet, puis salaire chargé et prime de nuit. */
  cabinet: 4000,
  technicienNuit: 1250,
  arriveeRapide: 7,
  arriveeLente: 11,
  chanceCandidat: 0.5,
  /** Le plan préventif : pièces et arrêts planifiés, d'abord pour rattraper les gammes en retard. */
  piecesRattrapage: 1500,
  piecesPlan: 500,
  heuresRattrapage: 1.5,
  heuresPlan: 0.75,
  finRattrapage: 6,
  /** Le stock de pièces critiques, et la liste complète du constructeur. */
  stockCritique: 14000,
  stockComplet: 120000,
  /** Le coût de possession d'un stock : 25 % par an, compté de septembre à décembre. */
  possession: 0.25 / 3,
  expressMois: 1500,
  /** Les standards de premier niveau : formation des conducteurs, puis un technicien référent. */
  formation: 2600,
  referent: 300,
  tourneesTechniciens: 1100,
  /** Les joints : passage aux joints détectables, puis remplacement à fréquence fixe. */
  jointsDetectables: 1500,
  jointsSystematiques: 380,
  heuresJoints: 0.2,
  jointsConditionnels: 150,
  jointsUneFois: 2800,
  heuresUneFois: 3,
  /** La préparation du pic : kits d'intervention, campagne sans plan. */
  kits: 1500,
  campagne: 3500,
  heuresCampagne: 0.6,
  /** Les desserts produits d'avance qui n'ont plus les deux tiers de leur DLC à la livraison. */
  declassement: 4000,
  /** L'organisation pérennisée : un préparateur-planificateur. */
  planificateur: 600,
  interimNuit: 1600,
  fraisInterim: 900,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  reponse: 0,
  pieces: 1,
  premierNiveau: 2,
  joints: 3,
  pic: 4,
  decembre: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 1, 2] as const;

/** La panne de la semaine 2 : le vérin du distributeur de pots, faute de vérin en stock. */
export const PANNE_SEMAINE_2 = { semaine: 2, heures: 9 } as const;

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
    /** Des heures d'arrêt subies, sans panne. */
    arret?: number;
    /** Plus d'heures de fonctionnement : plus de pannes, et pas de samedi pour rattraper. */
    charge?: number;
    scelleuse?: number;
    /** Des réparations plus longues. */
    reparation?: number;
    /** Le plan préventif marque le pas. */
    gel?: boolean;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "orage",
    titre: "Une coupure de courant pendant un orage",
    de: "Gurvan Kerebel",
    role: "Responsable de production, Loudéac",
    texte:
      "Coupure de courant de quarante minutes pendant l'orage de cette nuit : toute la ligne des desserts vidangée, NEP complète avant de repartir. Cinq heures d'arrêt.",
    duree: 1,
    effet: { arret: 5 },
  },
  {
    id: "celtis",
    titre: "Une opération promotionnelle de Celtis avancée",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Celtis avance de deux semaines son opération sur les crèmes desserts : la ligne tourne aussi le samedi pendant deux semaines. Plus de rattrapage possible.",
    duree: 2,
    effet: { charge: 1.15 },
  },
  {
    id: "technicien",
    titre: "Un technicien arrêté trois semaines",
    de: "Maëwenn Postec",
    role: "Directrice des ressources humaines",
    texte:
      "Un technicien de l'équipe de maintenance est arrêté trois semaines après une opération du genou. Les dépannages seront plus longs.",
    duree: 3,
    effet: { reparation: 1.2 },
  },
  {
    id: "film",
    titre: "Un nouveau film d'operculage",
    de: "Azilis Cozic",
    role: "Responsable emballages et développement",
    texte:
      "Le fournisseur de film d'operculage livre une nouvelle référence, plus fine : la scelleuse se règle mal et ses capteurs se déclenchent pendant deux semaines.",
    duree: 2,
    effet: { scelleuse: 1.6 },
  },
  {
    id: "audit",
    titre: "Un audit d'Opaline sur le site",
    de: "Annaïg Le Dantec",
    role: "Responsable qualité",
    texte:
      "Opaline audite la fabrication de ses desserts sous marque de distributeur : une semaine de préparation et de corrections pour la maintenance, qui met le reste de côté.",
    duree: 1,
    effet: { reparation: 1.1, gel: true },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Une panne possible : chaque emplacement porte ses propres tirages. */
interface Emplacement {
  nuit: number;
  piece: number;
  attente: number;
  duree: number;
  joint: number;
  fragment: number;
}

interface TiragesSemaine {
  /** Le tirage qui fixe le nombre de pannes de chaque organe, par inversion de la loi de Poisson. */
  compte: Record<CodeOrgane, number>;
  emplacements: Record<CodeOrgane, readonly Emplacement[]>;
  /** L'inspection laisse-t-elle passer un joint usé cette semaine ? */
  ratee: number;
}

export interface Hasard {
  semaines: readonly (TiragesSemaine | null)[];
  /** Le cabinet trouve-t-il vite un technicien de nuit ? */
  uCandidat: number;
  /** Les équipes acceptent-elles les standards de premier niveau ? */
  uAccord: number;
  /** Un geste sans consignation tourne-t-il mal, et quand ? */
  uAccident: number;
  semaineAccident: number;
  imprevus: readonly ImprevuTire[];
}

const EMPLACEMENTS = 8;
const CODES: readonly CodeOrgane[] = ["doseurs", "scelleuse", "verins", "autres"];

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001123 + 7);
  const semaines: (TiragesSemaine | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    const compte = {} as Record<CodeOrgane, number>;
    const emplacements = {} as Record<CodeOrgane, Emplacement[]>;
    for (const c of CODES) {
      compte[c] = r();
      emplacements[c] = Array.from({ length: EMPLACEMENTS }, () => ({
        nuit: r(),
        piece: r(),
        attente: r(),
        duree: r(),
        joint: r(),
        fragment: r(),
      }));
    }
    semaines.push({ compte, emplacements, ratee: r() });
  }
  const uCandidat = r();
  const uAccord = r();
  const uAccident = r();
  const semaineAccident = 6 + Math.floor(r() * 5);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uCandidat, uAccord, uAccident, semaineAccident, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le nombre de pannes d'une semaine : l'inverse de la loi de Poisson, pour un même tirage. */
export function poisson(u: number, lambda: number): number {
  let k = 0;
  let p = Math.exp(-lambda);
  let cumul = p;
  while (u > cumul && k < EMPLACEMENTS) {
    k += 1;
    p *= lambda / k;
    cumul += p;
  }
  return k;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La semaine où le technicien de nuit prend son poste : le cabinet trouve vite une fois sur deux. */
export const arriveeTechnicienNuit = (graine: number) =>
  hasard(graine).uCandidat < COUTS.chanceCandidat ? COUTS.arriveeRapide : COUTS.arriveeLente;

/** La chance que les équipes acceptent les standards de premier niveau. */
export const chanceAccord = (chemin: readonly number[]) =>
  chemin[D.reponse] === 1 ? PREMIER_NIVEAU.accord.avecAnalyse : PREMIER_NIVEAU.accord.sansAnalyse;
export const accordDesEquipes = (chemin: readonly number[], graine: number) =>
  chemin[D.premierNiveau] === 0 && hasard(graine).uAccord < chanceAccord(chemin);

/** Imposés sans formation, des gestes faits sans consignation : un accident, trois fois sur dix. */
export const accidentPremierNiveau = (chemin: readonly number[], graine: number) =>
  chemin[D.premierNiveau] === 1 && hasard(graine).uAccident < PREMIER_NIVEAU.accident.chance;

/** La semaine où les gestes de premier niveau commencent ; `null` : jamais. */
export function debutPremierNiveau(chemin: readonly number[], graine: number): number | null {
  const d3 = chemin[D.premierNiveau];
  if (d3 === 0)
    return accordDesEquipes(chemin, graine)
      ? PREMIER_NIVEAU.debutAccord
      : PREMIER_NIVEAU.debutSansAccord;
  if (d3 === 1 || d3 === 2) return PREMIER_NIVEAU.debutImpose;
  return null;
}

/** Les facteurs de premier niveau qui s'appliquent, selon la manière et l'historique. */
function facteursPremierNiveau(chemin: readonly number[]) {
  const d3 = chemin[D.premierNiveau];
  if (d3 === 0) return chemin[D.reponse] === 1 ? PREMIER_NIVEAU.cibles : PREMIER_NIVEAU.generiques;
  if (d3 === 1) return PREMIER_NIVEAU.imposes;
  if (d3 === 2) return PREMIER_NIVEAU.generiques;
  return null;
}

type Etat = Record<"doseurs" | "joints" | "scelleuse" | "verins" | "autres", number>;

const vers = (x: number, cible: number, vitesse: number) => cible + (x - cible) * vitesse;

/** Le régime de maintenance en vigueur une semaine donnée (semaines 14 à 17 : décembre). */
interface Regime {
  plan: boolean;
  campagne: boolean;
  /** En décembre, un préventif qui saute faute d'organisation. */
  allege: boolean;
  suspendu: boolean;
  premierNiveau: boolean;
  techNuit: boolean;
}

function regime(chemin: readonly number[], graine: number, w: number): Regime {
  const [d1, , , , d5, d6] = chemin;
  const decembre = w > SEMAINES;
  const suspendu = (d5 === 2 && w >= 9) || (decembre && d6 === 3);
  const plan = d1 === 1 && w >= 3 && !suspendu;
  // Sans plan, une campagne de remplacement calée dans les NEP, ou lancée pour le pic.
  const campagne = !plan && !suspendu && ((d5 === 0 && w >= 9) || (decembre && d6 === 0));
  // Au pic, sans organisation pérennisée, le préventif saute le premier.
  const allege = decembre && (plan || campagne) && d6 !== 0;
  const debut = debutPremierNiveau(chemin, graine);
  const accident = accidentPremierNiveau(chemin, graine);
  const premierNiveau =
    debut !== null && w >= debut && !(accident && w > hasard(graine).semaineAccident);
  const techNuit =
    (d1 === 0 && w >= arriveeTechnicienNuit(graine)) || (decembre && (d1 === 0 || d6 === 1));
  return { plan, campagne, allege, suspendu, premierNiveau, techNuit };
}

/** L'état des organes, avancé d'une semaine selon le régime. */
function avancer(etat: Etat, chemin: readonly number[], w: number, reg: Regime, gel: boolean) {
  const [d1, , d3, d4, d5, d6] = chemin;
  const decembre = w > SEMAINES;
  // Les techniciens qui font eux-mêmes les tournées de premier niveau manquent au plan.
  const vitessePlan = d3 === 2 ? 0.8 : PLAN.vitesse;
  const pousse = decembre && d6 === 0 ? 0.9 : 1;
  for (const k of ["doseurs", "scelleuse", "verins"] as const) {
    if (gel) continue;
    if (reg.allege) etat[k] = vers(etat[k], ALLEGE.cible, ALLEGE.vitesse);
    else if (reg.plan) etat[k] = vers(etat[k], PLAN[k] * pousse, vitessePlan);
    else if (reg.campagne) etat[k] = vers(etat[k], CAMPAGNE[k], CAMPAGNE.vitesse);
    else if (reg.suspendu) etat[k] = vers(etat[k], REBOND.cible, REBOND.vitesse);
    else etat[k] = vers(etat[k], USURE.cible, USURE.vitesse);
  }
  etat.autres = vers(etat.autres, USURE.cibleAutres, USURE.vitesseAutres);
  // Les joints des doseurs : leur propre politique de remplacement.
  if (reg.suspendu) etat.joints = vers(etat.joints, REBOND.cible, REBOND.vitesse);
  else if (d4 === 0 && w >= JOINTS.debut)
    etat.joints = vers(etat.joints, JOINTS.systematique.cible, JOINTS.systematique.vitesse);
  else if (d4 === 1 && w >= JOINTS.debut) {
    etat.joints = reg.premierNiveau
      ? vers(etat.joints, JOINTS.conditionnel.cible, JOINTS.conditionnel.vitesse)
      : vers(etat.joints, JOINTS.conditionnel.sansInspection, JOINTS.conditionnel.vitesseSans);
  } else if (d4 === 3 && w === 7) etat.joints = JOINTS.uneFois.etat;
  else if (d4 === 3 && w > 7) etat.joints = vers(etat.joints, USURE.cible, JOINTS.uneFois.vitesse);
  else etat.joints = vers(etat.joints, USURE.cible, USURE.vitesse);
  // Les révisions par le constructeur : un état remis à neuf, d'un coup.
  if (d1 === 2 && w === REVISION.semaine) {
    for (const k of ["doseurs", "joints", "scelleuse", "verins", "autres"] as const)
      etat[k] = Math.min(etat[k], REVISION.etat);
  }
  if (d5 === 3 && w === REVISION_SCELLEUSE.semaine)
    etat.scelleuse = Math.min(etat.scelleuse, REVISION_SCELLEUSE.etat);
}

/** Les taux de panne d'une semaine, par organe, selon l'état et le premier niveau. */
function taux(etat: Etat, chemin: readonly number[], reg: Regime): Record<CodeOrgane, number> {
  const f = reg.premierNiveau ? facteursPremierNiveau(chemin) : null;
  const base = (c: CodeOrgane) => organe(c).pannes / SEMAINES_HISTO;
  return {
    doseurs:
      base("doseurs") *
      ((1 - PART_JOINTS) * etat.doseurs + PART_JOINTS * etat.joints) *
      (f?.doseurs ?? 1),
    scelleuse: base("scelleuse") * etat.scelleuse * (f?.scelleuse ?? 1),
    verins: base("verins") * etat.verins * (f?.verins ?? 1),
    autres: base("autres") * etat.autres * (f?.autres ?? 1),
  };
}

/** La part des pannes qui attendent leur pièce, selon le stock tenu. */
function partPiece(chemin: readonly number[], c: CodeOrgane, w: number): number {
  const d2 = chemin[D.pieces];
  const o = organe(c);
  if (d2 === 0 && w >= 4 && c !== "autres") return 0;
  if (d2 === 1 && w >= 6) return c === "autres" ? 0.003 : 0;
  return o.partPiece;
}
const express = (chemin: readonly number[], w: number) => chemin[D.pieces] === 2 && w >= 4;
const attenteMoyenne = (chemin: readonly number[], w: number) =>
  express(chemin, w) ? ATTENTE_EXPRESS_MOYENNE : ATTENTE_PIECE_MOYENNE;

/** Les heures d'arrêt planifiées d'une semaine, avant la part prise dans les NEP. */
function planifiees(chemin: readonly number[], w: number, reg: Regime): number {
  const [d1, , , d4, d5] = chemin;
  let h = 0;
  if (reg.plan) h += w <= COUTS.finRattrapage ? COUTS.heuresRattrapage : COUTS.heuresPlan;
  if (reg.campagne) h += COUTS.heuresCampagne;
  if (reg.allege) h *= 0.5;
  if (d4 === 0 && w >= JOINTS.debut && !reg.suspendu) h += COUTS.heuresJoints;
  // Dans les fenêtres de NEP, à partir de la semaine 9 : une petite part du temps.
  const nep = d5 === 0 && w >= 9;
  h *= nep ? PART_HORS_NEP : 1;
  if (d1 === 2 && w === REVISION.semaine) h += REVISION.heures;
  if (d4 === 3 && w === 7) h += COUTS.heuresUneFois;
  if (d5 === 3 && w === REVISION_SCELLEUSE.semaine) h += REVISION_SCELLEUSE.heures;
  return h;
}

/** Les dépenses de maintenance d'une semaine (semaines 14 à 17 : décembre). */
function depenses(chemin: readonly number[], graine: number, w: number, reg: Regime): number {
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const decembre = w > SEMAINES;
  let x = 0;
  if (d1 === 0) {
    if (w === 2) x += COUTS.cabinet;
    if (reg.techNuit) x += COUTS.technicienNuit;
  }
  if (reg.plan) {
    const pieces = w <= COUTS.finRattrapage ? COUTS.piecesRattrapage : COUTS.piecesPlan;
    x += reg.allege ? pieces / 2 : pieces;
  }
  if (d1 === 2 && w === REVISION.semaine) x += REVISION.cout;
  if (d2 === 0 && w === 4) x += COUTS.stockCritique * COUTS.possession;
  if (d2 === 1 && w === 6) x += COUTS.stockComplet * COUTS.possession;
  if (d2 === 2 && w >= 4) x += (COUTS.expressMois * 12) / 52;
  if (d3 === 0) {
    const debut = debutPremierNiveau(chemin, graine)!;
    if (w === debut - 2) x += COUTS.formation;
    if (w >= debut - 2) x += COUTS.referent;
  }
  if (d3 === 2 && w >= PREMIER_NIVEAU.debutImpose) x += COUTS.tourneesTechniciens;
  if (d4 === 0 && w === JOINTS.debut - 1) x += COUTS.jointsDetectables;
  if (d4 === 0 && w >= JOINTS.debut && !reg.suspendu) x += COUTS.jointsSystematiques;
  if (d4 === 1 && w >= JOINTS.debut && reg.premierNiveau) x += COUTS.jointsConditionnels;
  if (d4 === 3 && w === 7) x += COUTS.jointsUneFois;
  if (d5 === 0 && w === 9) x += reg.plan ? COUTS.kits : COUTS.kits + COUTS.campagne;
  if (reg.campagne && decembre && d5 !== 0 && w === SEMAINES + 1) x += COUTS.campagne;
  if (d5 === 2 && w === SEMAINES) x += COUTS.declassement;
  if (d5 === 3 && w === REVISION_SCELLEUSE.semaine) x += REVISION_SCELLEUSE.cout;
  if (d6 === 0 && w >= 12) x += COUTS.planificateur;
  if (d6 === 1 && decembre) x += COUTS.interimNuit + (w === SEMAINES + 1 ? COUTS.fraisInterim : 0);
  return x;
}

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */
export interface Panne {
  organe: CodeOrgane;
  heures: number;
  nuit: boolean;
  /** La pièce manquait au magasin. */
  piece: boolean;
}

export type Semaine = {
  /** Heures d'arrêt pour panne (et arrêts subis) de la semaine. */
  arrets: number;
  pannes: number;
  /** Le MTBF de la ligne sur les quatre dernières semaines, en heures. */
  mtbf: number;
  /** Heures d'arrêt planifiées prises à la ligne. */
  planifiees: number;
  /** La part des heures de l'équipe de maintenance passées en préventif. */
  preventif: number;
  /** Ce que la semaine a coûté : arrêts, maintenance, incidents. */
  cout: number;
  /** Le coût cumulé depuis le début du trimestre. */
  coutCumule: number;
  /** Le coût du pic de décembre si la ligne y entrait dans l'état de cette semaine. */
  decembre: number;
  /** Les pannes longues de la semaine (une pièce qui manquait). */
  longues: number;
  /** Le taux de panne de la ligne, en pannes par semaine. */
  taux: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Moins le coût des pannes et de la maintenance de septembre à décembre, pic estimé compris. */
  objectif: number;
  coutTrimestre: number;
  /** Le coût attendu du pic de décembre, estimé sur l'état du parc fin novembre. */
  coutDecembre: number;
  /** Les heures d'arrêt attendues en décembre. */
  heuresDecembre: number;
  arretsTotal: number;
  pannesTotal: number;
  /** Les heures d'arrêt pour panne par mois, en moyenne sur le trimestre. */
  arretsParMois: number;
  pannesLongues: number;
  mtbfFinal: number;
  preventifFinal: number;
  /** Les semaines où un lot a été bloqué pour un fragment de joint. */
  lotsBloques: readonly number[];
  accident: boolean;
  semaineAccident: number | null;
  accord: boolean | null;
  arriveeNuit: number | null;
  /** Le MTBF de la scelleuse dans l'historique : la prévision de la semaine 1. */
  mtbfScelleuse: number;
  pannes: readonly (readonly Panne[])[];
}

/** La part des heures de maintenance passées en préventif : 76 h sur 420 au départ. */
function partPreventif(chemin: readonly number[], w: number, reg: Regime, lambda: number) {
  const [d1, , d3, d4] = chemin;
  let prev = 76;
  let cur = 206 + 22 * lambda;
  if (reg.plan) prev += 60;
  if (reg.campagne) prev += 25;
  if (d3 === 2 && w >= PREMIER_NIVEAU.debutImpose) prev += 25;
  if (d4 === 0 && w >= JOINTS.debut && !reg.suspendu) prev += 6;
  if (d1 === 0 && reg.techNuit) cur += 35;
  return prev / (prev + cur + 50);
}

/** Le coût du pic de décembre dans un état donné, sans dérive : « si décembre commençait maintenant ». */
function decembreDansLEtat(
  etat: Etat,
  chemin: readonly number[],
  reg: Regime,
  w: number,
  reparationFacteur = 1,
) {
  const l = taux(etat, chemin, reg);
  let heures = 0;
  for (const c of CODES) {
    const o = organe(c);
    const duree =
      reparation(o) * reparationFacteur +
      (reg.techNuit ? 0 : PART_NUIT * ATTENTE_ASTREINTE) +
      partPiece(chemin, c, w) * attenteMoyenne(chemin, w);
    heures += l[c] * duree;
  }
  return heures * DECEMBRE.charge;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const etat: Etat = { doseurs: 1, joints: 1, scelleuse: 1, verins: 1, autres: 1 };
  const semaines: (Semaine | null)[] = [null];
  const toutes: Panne[][] = [[]];
  const lotsBloques: number[] = [];
  const accident = accidentPremierNiveau(chemin, graine);
  const fenetre: { arrets: number; pannes: number }[] = [];
  let coutCumule = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let arretsTotal = 0;
  let pannesTotal = 0;
  let pannesLongues = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const reg = regime(chemin, graine, w);
    const gel = actifs.some((a) => a.imprevu.effet.gel);
    if (w >= 2) avancer(etat, chemin, w, reg, gel);
    let charge = 1;
    let facteurScelleuse = 1;
    let facteurReparation = 1;
    let subis = 0;
    for (const a of actifs) {
      charge *= a.imprevu.effet.charge ?? 1;
      facteurScelleuse *= a.imprevu.effet.scelleuse ?? 1;
      facteurReparation *= a.imprevu.effet.reparation ?? 1;
      if (a.semaine === w) subis += a.imprevu.effet.arret ?? 0;
    }
    const lambda = taux(etat, chemin, reg);
    lambda.scelleuse *= facteurScelleuse;
    // Une semaine sur huit, l'inspection des joints laisse passer un joint usé.
    if (
      chemin[D.joints] === 1 &&
      reg.premierNiveau &&
      w >= JOINTS.debut &&
      n.ratee < JOINTS.ratee.chance
    )
      lambda.doseurs *= 1 + PART_JOINTS * (JOINTS.ratee.facteur - 1);

    // LES PANNES DE LA SEMAINE.
    const pannes: Panne[] = [];
    let fragment = false;
    const partJ =
      (PART_JOINTS * etat.joints) / ((1 - PART_JOINTS) * etat.doseurs + PART_JOINTS * etat.joints);
    for (const c of CODES) {
      const o = organe(c);
      const k = poisson(n.compte[c], lambda[c] * charge);
      for (let i = 0; i < k; i += 1) {
        const e = n.emplacements[c][i]!;
        const nuit = e.nuit < PART_NUIT;
        const piece = e.piece < partPiece(chemin, c, w);
        const attente = express(chemin, w)
          ? ATTENTE_EXPRESS.min + ATTENTE_EXPRESS.ecart * e.attente
          : ATTENTE_PIECE.min + ATTENTE_PIECE.ecart * e.attente;
        const heures =
          reparation(o) * facteurReparation * (0.6 + 0.8 * e.duree) +
          (nuit && !reg.techNuit ? ATTENTE_ASTREINTE : 0) +
          (piece ? attente : 0);
        pannes.push({ organe: c, heures, nuit, piece });
        if (c === "doseurs" && e.joint < partJ) {
          const p =
            chemin[D.joints] === 0 && w >= JOINTS.debut ? P_FRAGMENT_DETECTABLE : P_FRAGMENT;
          if (e.fragment < p) fragment = true;
        }
      }
    }
    if (w === PANNE_SEMAINE_2.semaine) {
      pannes.push({ organe: "verins", heures: PANNE_SEMAINE_2.heures, nuit: true, piece: true });
    }
    let arrets = pannes.reduce((s, p) => s + p.heures, 0) + subis;
    let incidents = 0;
    if (fragment) {
      lotsBloques.push(w);
      arrets += ARRET_FRAGMENT;
      incidents += LOT_BLOQUE;
    }
    if (accident && w === h.semaineAccident) {
      arrets += PREMIER_NIVEAU.accident.arret;
      incidents += PREMIER_NIVEAU.accident.cout;
    }

    // CE QUE LA SEMAINE COÛTE.
    const rattrapable = charge > 1 ? 0 : RATTRAPABLE;
    const coutArrets =
      Math.min(arrets, rattrapable) * HEURE_RATTRAPEE +
      Math.max(0, arrets - rattrapable) * HEURE_PERDUE;
    const plan = planifiees(chemin, w, reg);
    const cout = coutArrets + plan * HEURE_PLANIFIEE + depenses(chemin, graine, w, reg) + incidents;
    coutCumule += cout;
    arretsTotal += arrets;
    pannesTotal += pannes.length;
    pannesLongues += pannes.filter((p) => p.piece).length;
    fenetre.push({ arrets, pannes: pannes.length });
    if (fenetre.length > 4) fenetre.shift();
    const fa = fenetre.reduce((s, x) => s + x.arrets, 0);
    const fp = fenetre.reduce((s, x) => s + x.pannes, 0);
    const tauxTotal = CODES.reduce((s, c) => s + lambda[c], 0);
    toutes.push(pannes);
    semaines.push({
      arrets,
      pannes: pannes.length,
      mtbf: (fenetre.length * HEURES_SEMAINE - fa) / Math.max(1, fp),
      planifiees: plan,
      preventif: partPreventif(chemin, w, reg, tauxTotal),
      cout,
      coutCumule,
      decembre: decembreDansLEtat(etat, chemin, reg, w) * DECEMBRE.semaines * HEURE_PERDUE,
      longues: pannes.filter((p) => p.piece).length,
      taux: tauxTotal,
    });
  }

  // LE PIC DE DÉCEMBRE, ESTIMÉ : quatre semaines dans le régime de décembre, en espérance.
  let heuresDecembre = 0;
  let coutDecembre = 0;
  for (let k = 1; k <= DECEMBRE.semaines; k += 1) {
    const w = SEMAINES + k;
    const reg = regime(chemin, graine, w);
    avancer(etat, chemin, w, reg, false);
    // Préparées par un planificateur, les interventions vont plus vite ; toute l'équipe au
    // dépannage, chaque panne trouve un technicien un peu plus tôt.
    const facteur =
      chemin[D.decembre] === 0 && (reg.plan || reg.campagne)
        ? PREPARATION
        : chemin[D.decembre] === 3
          ? TOUS_AU_DEPANNAGE
          : 1;
    const heures = decembreDansLEtat(etat, chemin, reg, w, facteur);
    const l = taux(etat, chemin, reg);
    const partJ =
      (PART_JOINTS * etat.joints) / ((1 - PART_JOINTS) * etat.doseurs + PART_JOINTS * etat.joints);
    const p = chemin[D.joints] === 0 ? P_FRAGMENT_DETECTABLE : P_FRAGMENT;
    const fragments = l.doseurs * DECEMBRE.charge * partJ * p;
    heuresDecembre += heures;
    coutDecembre +=
      heures * HEURE_PERDUE +
      planifiees(chemin, w, reg) * HEURE_PERDUE +
      depenses(chemin, graine, w, reg) +
      fragments * LOT_BLOQUE;
  }

  const pleines = semaines.slice(1) as Semaine[];
  const coutTrimestre = coutCumule;
  return {
    semaines,
    objectif: -(coutTrimestre + coutDecembre),
    coutTrimestre,
    coutDecembre,
    heuresDecembre,
    arretsTotal,
    pannesTotal,
    arretsParMois: (arretsTotal / SEMAINES) * (52 / 12),
    pannesLongues,
    mtbfFinal: pleines[SEMAINES - 1]!.mtbf,
    preventifFinal: pleines[SEMAINES - 1]!.preventif,
    lotsBloques,
    accident,
    semaineAccident: accident ? h.semaineAccident : null,
    accord: chemin[D.premierNiveau] === 0 ? accordDesEquipes(chemin, graine) : null,
    arriveeNuit: chemin[D.reponse] === 0 ? arriveeTechnicienNuit(graine) : null,
    mtbfScelleuse: MTBF_SCELLEUSE,
    pannes: toutes,
  };
}

/** Ce qui s'est passé pendant des semaines : pannes longues, lots bloqués, accident, accord, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const longues: { semaine: number; organe: CodeOrgane; heures: number }[] = [];
  for (let w = Math.max(3, de); w <= Math.min(a, SEMAINES); w += 1) {
    for (const p of t.pannes[w]!) {
      if (p.piece) longues.push({ semaine: w, organe: p.organe, heures: p.heures });
    }
  }
  return {
    longues,
    lotsBloques: t.lotsBloques.filter(dans),
    accident: t.accident && dans(t.semaineAccident!),
    semaineAccident: t.semaineAccident,
    accord: t.accord !== null && dans(5) ? t.accord : null,
    arriveeNuit: t.arriveeNuit !== null && dans(t.arriveeNuit) ? t.arriveeNuit : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureMaintenance {
  arrets: number | null;
  pannes: number | null;
  mtbf: number | null;
  preventif: number | null;
  coutCumule: number | null;
  decembre: number | null;
  longues: number | null;
  arretsCumules: number | null;
  /** Les pannes attendues par semaine dans l'état du parc. */
  taux: number | null;
  /** Le coût des pannes à date au rythme de l'été. */
  repereADate: number | null;
}

/** Le pic de décembre, si la ligne y entrait dans l'état de départ : le rythme de l'historique. */
export const DECEMBRE_DEPART =
  ORGANES.reduce((s, o) => s + o.heures / SEMAINES_HISTO, 0) *
  DECEMBRE.charge *
  DECEMBRE.semaines *
  HEURE_PERDUE;
/** Le coût d'une semaine d'arrêts au rythme de l'été, tous rattrapés : le repère du trimestre. */
export const REPERE_SEMAINE = (ARRETS_PAR_MOIS * 12 * HEURE_RATTRAPEE) / 52;

/** Ce que Klervi lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureMaintenance {
  if (semaine === 0) {
    return {
      arrets: ARRETS_PAR_MOIS * (12 / 52),
      pannes: PANNES_HISTO / SEMAINES_HISTO,
      mtbf: MTBF_LIGNE,
      preventif: 76 / 420,
      coutCumule: 0,
      decembre: DECEMBRE_DEPART,
      longues: 0,
      arretsCumules: 0,
      taux: PANNES_HISTO / SEMAINES_HISTO,
      repereADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    arrets: s.arrets,
    pannes: s.pannes,
    mtbf: s.mtbf,
    preventif: s.preventif,
    coutCumule: s.coutCumule,
    decembre: s.decembre,
    longues: (t.semaines.slice(1, semaine + 1) as Semaine[]).reduce((x, v) => x + v.longues, 0),
    arretsCumules: (t.semaines.slice(1, semaine + 1) as Semaine[]).reduce(
      (x, v) => x + v.arrets,
      0,
    ),
    taux: s.taux,
    repereADate: REPERE_SEMAINE * semaine,
  };
}
