/**
 * LA RÉCLAMATION QUI ENFLE — le modèle du service qualité et SAV.
 *
 * Un malaxeur de chantier, le MX-160, revient en panne de plus en plus
 * souvent dans les six agences. Treize semaines, six décisions. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE REMPLACEMENT NOURRIT LE FLUX. Les pannes viennent presque toutes d'un
 *     lot de fabrication, le L-2607, dont le pignon de réducteur s'use en
 *     quelques semaines d'usage intensif. Tant que ce lot reste en rayon, les
 *     agences le vendent et s'en servent pour remplacer les appareils cassés :
 *     chaque geste commercial remet en circulation un appareil qui cassera à
 *     son tour. Seule l'analyse par numéro de série permet de couper le flux
 *     à la source, sans retirer tout le produit de la vente.
 *   · UNE PANNE SUR CHANTIER COÛTE PLUS QU'UN ÉCHANGE PRÉVU. Les appareils du
 *     lot déjà vendus casseront ; les échanger avant coûte tout de suite, mais
 *     moins cher qu'une panne sur chantier, un prêt et un client fâché. Encore
 *     faut-il viser : le rappel ciblé sur les usages intensifs paie, le rappel
 *     de tout le lot paie des échanges d'appareils qui auraient tenu, et le
 *     rappel de tous les MX-160 inspecte des appareils sains.
 *   · LA PREUVE ET LA FRANCHISE PAIENT. Un client qu'on informe vite et
 *     honnêtement reste ; le silence le fait partir. Et le fournisseur, qui
 *     nie le défaut, ne paie que devant un dossier par lot et par numéro de
 *     série : sans traçabilité, la meilleure lettre ne vaut rien. Son accord
 *     amiable, acquis d'avance, est le choix le plus sûr ; avec un dossier
 *     tracé, exiger la prise en charge rapporte nettement plus en moyenne.
 *
 * Le trimestre est jugé en euros : l'écart au budget de non-qualité
 * (remplacements, avoirs, rappels, ventes et clients perdus), moins ce que le
 * fournisseur rembourse. Positif : le service est resté sous le budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, produit, marque et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le budget de non-qualité du trimestre pour l'outillage électroportatif. */
export const BUDGET = 55000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux se paie en avoirs à des clients excédés. */
export const PERTE_PAR_JOUR = 1500;

/** Ce que coûte un MX-160 : achat, vente, et ce que chaque mouvement ajoute. */
export const PRIX = {
  achat: 240,
  vente: 349,
  /** La marge perdue sur une vente manquée, une fois sur deux rattrapée par un autre modèle. */
  margePerdue: 55,
  /** Une panne : l'appareil de remplacement, la course en urgence et le diagnostic à l'atelier. */
  panne: 300,
  /** Une panne sur chantier chez un maçon ou un chapiste : le prêt d'un appareil et le dédommagement. */
  chantier: 260,
  /** Un échange planifié : l'appareil neuf et la logistique, sans urgence. */
  echange: 270,
  /** Un modèle haut de gamme d'une autre marque. */
  hautDeGamme: 560,
} as const;

/** MX-160 vendus par semaine dans les six agences. */
export const VENTES = 30;
/** Appareils du lot L-2607 encore en rayon, et appareils des autres lots. */
export const STOCK_LOT = 120;
export const STOCK_SAIN = 80;
/** Appareils du lot déjà vendus : chez des maçons et chapistes, chez d'autres métiers, chez Pélissier. */
export const PARC_INTENSIF = 50;
export const PARC_LEGER = 46;
export const PARC_PELISSIER = 10;
/** Le risque de panne par semaine d'un appareil du lot, selon l'usage. */
export const RISQUE_INTENSIF = 0.09;
export const RISQUE_LEGER = 0.022;
export const RISQUE_PELISSIER = 0.11;
/** Le nouveau lot, s'il est défectueux, casse vite. */
export const RISQUE_NOUVEAU_LOT = 0.15;
/** Les retours ordinaires des autres lots, garantie normale. */
export const RETOURS_NORMAUX = 2;
export const OBJECTIF_RETOURS = 3;
export const OBJECTIF_SATISFACTION = 0.8;
export const RETOURS_DEPART = 9;
export const OUVERTES_DEPART = 16;
export const SATISFACTION_DEPART = 0.68;
export const CONFIANCE_DEPART = 0.45;
/** Pélissier Construction parti, c'est sa marge perdue chaque semaine jusqu'à la fin du trimestre. */
export const MARGE_PELISSIER = 2300;
/** Plus de MX-160 sains en rayon à partir de la semaine 11 : la vente manquée, par semaine. */
export const RUPTURE = 2500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  retours: 0,
  pelissier: 1,
  fournisseur: 2,
  rappel: 3,
  information: 4,
  nouveauLot: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 1, 3] as const;

export const COUTS = {
  /** L'avoir accordé à chaque client qui revient avec un appareil cassé. */
  avoirParPanne: 50,
  /** Inventaire et étiquetage du lot bloqué dans les six agences. */
  blocage: 1500,
  /** L'avoir de 10 % sur les achats du trimestre de Pélissier. */
  avoirPelissier: 6000,
  /** L'expertise d'un laboratoire indépendant sur dix appareils. */
  expertise: 1800,
  /** Les ruptures sur les autres références du fournisseur pendant la suspension. */
  suspension: 700,
  /** L'inspection d'un appareil sain rappelé par précaution. */
  inspection: 60,
  /** Les MX-160 des autres lots vendus depuis l'été, qu'un rappel général ferait revenir. */
  parcSain: 150,
  courrier: 600,
  /** Un retour par précaution d'un appareil sain : le contrôle et le renvoi. */
  precaution: 45,
  bonDAchat: 40,
  /** Les clients inquiets qui appellent chaque semaine, une fois le bruit lancé. */
  inquiets: 25,
  controle: 1200,
  referencement: 1800,
} as const;

/** Le fournisseur paie cette part des coûts du lot quand il reconnaît le défaut. */
export const PART_RECONNUE = 0.8;
export const PART_SUSPENSION = 0.5;
/** L'accord amiable : le fournisseur prend en charge 40 % des coûts, sans reconnaître le défaut. */
export const PART_AMIABLE = 0.4;
/** La provision de fin de trimestre couvre les pannes des treize semaines suivantes. */
export const HORIZON_PROVISION = 13;

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
  effet: { ventes?: number; usure?: number; capacite?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gel",
    titre: "Une semaine de gel",
    de: "Patrice Gaillard",
    role: "Chef d'agence, Vénissieux",
    texte:
      "Gel toute la semaine : les chantiers de gros œuvre sont à l'arrêt, on ne coule plus rien. Les malaxeurs restent au dépôt.",
    duree: 1,
    effet: { ventes: 0.6, usure: 0.5 },
  },
  {
    id: "chapes",
    titre: "Une série de chapes à couler",
    de: "Nora Saïdi",
    role: "Cheffe d'agence, Villefranche",
    texte:
      "Trois programmes de logements livrent en même temps : tous les chapistes du secteur tournent à plein, malaxeurs compris.",
    duree: 2,
    effet: { usure: 1.3 },
  },
  {
    id: "logiciel",
    titre: "Panne du logiciel de suivi des retours",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel de suivi des retours est resté en panne trois jours : les dossiers ont été notés sur papier, à ressaisir ensuite.",
    duree: 1,
    effet: { capacite: 0.5 },
  },
  {
    id: "technicien",
    titre: "Un technicien de l'atelier en arrêt",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Damien Royer, technicien SAV, est en arrêt maladie pour deux semaines : l'atelier tourne à deux.",
    duree: 2,
    effet: { capacite: 0.7 },
  },
  {
    id: "promotion",
    titre: "Une promotion du réseau",
    de: "Marketing",
    role: "Siège",
    texte:
      "La promotion de rentrée sur l'outillage de chantier est partie : les ventes de malaxeurs bondissent pendant deux semaines.",
    duree: 2,
    effet: { ventes: 1.35 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Le rythme des chantiers : il fait varier l'usure des appareils. */
  usure: number;
  ventes: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La gravité du défaut en usage léger : on ne la connaît qu'en la voyant. */
  severite: number;
  /** Pélissier part-il s'il a perdu confiance ? */
  uPelissier: number;
  /** Le fournisseur cède-t-il ? */
  uFournisseur: number;
  /** Le lot corrigé l'est-il vraiment ? */
  uLot: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 433494437 + 53);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      usure: borne(1 + 0.15 * gauss(r), 0.6, 1.5),
      ventes: borne(1 + 0.1 * gauss(r), 0.7, 1.3),
    });
  }
  const severite = borne(Math.exp(0.3 * gauss(r)), 0.5, 2.2);
  const uPelissier = r();
  const uFournisseur = r();
  const uLot = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, severite, uPelissier, uFournisseur, uLot, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le lot a-t-il été tracé par numéro de série dès la semaine 1 ? C'est la preuve, ensuite. */
export const lotTrace = (chemin: readonly number[]) => chemin[D.retours] === 1;

/**
 * LE FOURNISSEUR PAIE-T-IL ?
 *
 * Il nie le défaut. Devant un dossier par lot et par numéro de série, il cède
 * sept fois sur dix ; devant une lettre sans traçabilité, une fois sur
 * cinq. Suspendre les commandes le fait plier trois fois sur dix, pour la
 * moitié seulement. L'accord amiable qu'il propose est acquis : 40 % des
 * coûts, sans discussion. Le tirage est le même quel que soit le choix : c'est
 * la force du dossier qui change.
 */
export function chanceQueLeFournisseurPaie(chemin: readonly number[]): number {
  const d = chemin[D.fournisseur];
  if (d === 0) return lotTrace(chemin) ? 0.7 : 0.2;
  if (d === 1) return 0.3;
  return d === 2 ? 1 : 0;
}
export const fournisseurPaie = (chemin: readonly number[], graine: number) =>
  hasard(graine).uFournisseur < chanceQueLeFournisseurPaie(chemin);
export function partDuFournisseur(chemin: readonly number[], graine: number): number {
  if (!fournisseurPaie(chemin, graine)) return 0;
  return [PART_RECONNUE, PART_SUSPENSION, PART_AMIABLE][chemin[D.fournisseur]!] ?? 0;
}

/** Le risque que Pélissier parte, lu sur sa confiance en fin de semaine 6. */
export const risqueDeDepart = (confiance: number) => borne((0.8 - confiance) * 1.5, 0, 0.9);

/** Une fois sur trois, le lot « corrigé » ne l'est pas. */
export const nouveauLotDefectueux = (graine: number) => hasard(graine).uLot < 0.35;

export type Semaine = {
  /** Appareils revenus en panne dans la semaine. */
  retours: number;
  /** Réclamations en attente de réponse en fin de semaine. */
  ouvertes: number;
  /** La part des clients concernés qui se disent satisfaits de la réponse. */
  satisfaction: number;
  /** Coût de la non-qualité cumulé depuis le début du trimestre, avant remboursement. */
  cout: number;
  /** Ce que le fournisseur a remboursé ou crédité, cumulé. */
  rembourse: number;
  /** Ce que la semaine a coûté, net de ce que le fournisseur a pris en charge. */
  net: number;
  /** La confiance de Pélissier Construction, de 0 à 1. */
  confiance: number;
  /** Appareils du lot encore chez les clients. */
  parc: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de non-qualité, net du remboursement : positif, sous le budget. */
  objectif: number;
  cout: number;
  rembourse: number;
  pelissierPart: boolean;
  fournisseurPaie: boolean;
  nouveauLotDefectueux: boolean;
  /** Le nouveau lot défectueux a-t-il été vendu ? */
  nouveauLotVendu: boolean;
  retoursTotal: number;
  satisfactionMoyenne: number;
  partFournisseur: number;
  retoursFinaux: number;
  /** Appareils du lot encore chez les clients en fin de trimestre. */
  parcFinal: number;
}

/** La part des appareils du lot encore chez les clients qui casseront le trimestre suivant. */
export const aCasser = (risque: number) => 1 - (1 - Math.min(0.9, risque)) ** HORIZON_PROVISION;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const part = partDuFournisseur(chemin, graine);
  const lotKo = nouveauLotDefectueux(graine);
  const risqueLeger = RISQUE_LEGER * h.severite;
  const semaines: (Semaine | null)[] = [null];
  let intensif: number = PARC_INTENSIF;
  let leger: number = PARC_LEGER;
  let pelissier: number = PARC_PELISSIER;
  let nouveaux = 0;
  let stockLot: number = STOCK_LOT;
  let ouvertes: number = OUVERTES_DEPART;
  let confiance = CONFIANCE_DEPART;
  let pelissierPart = false;
  let cout = 0;
  let rembourse = 0;
  /** Les coûts imputables au lot, que le fournisseur rembourse s'il reconnaît le défaut. */
  let coutsDuLot = 0;
  let retoursTotal = 0;
  let satisfactionTotale = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let usure = n.usure;
    let ventes = VENTES * n.ventes;
    let capaciteImprevu = 1;
    for (const a of actifs) {
      usure *= a.imprevu.effet.usure ?? 1;
      ventes *= a.imprevu.effet.ventes ?? 1;
      capaciteImprevu *= a.imprevu.effet.capacite ?? 1;
    }
    // L'enquête de la semaine 1 : pendant ce temps, des clients excédés obtiennent un avoir.
    let semaine = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    let lot = 0;

    // Ce qui reste en rayon : le lot est bloqué, rappelé, ou vendu avec le reste.
    const retire = d1 === 2 && w >= 2 && w <= 10;
    const bloque = (d1 === 1 && w >= 2) || (d4 !== 2 && w >= 7);
    const enRayon = !retire && !bloque && stockLot > 0 ? stockLot / (stockLot + STOCK_SAIN) : 0;
    if (d1 === 1 && w === 2) semaine += COUTS.blocage;
    if (retire) {
      semaine += ventes * PRIX.margePerdue;
      ventes = 0;
    }

    // Pélissier : ce que la semaine 1 lui a montré, puis la réponse de la semaine 3.
    // Échanger ses appareils sans savoir quel lot est en cause, c'est lui en
    // redonner du même lot.
    if (w === 2) {
      if (d1 === 0) confiance += 0.03;
      if (d1 === 2) confiance -= 0.05;
      if (d1 === 3) confiance -= 0.08;
    }
    if (w === 3) {
      if (d2 === 0) {
        const remplaces = pelissier;
        semaine += remplaces * PRIX.echange;
        lot += remplaces * PRIX.echange;
        pelissier = lotTrace(chemin) ? 0 : remplaces * enRayon;
        confiance += lotTrace(chemin) ? 0.4 : 0.1;
      }
      if (d2 === 1) {
        semaine += COUTS.avoirPelissier;
        confiance += 0.12;
      }
      if (d2 === 2) {
        semaine += PARC_PELISSIER * PRIX.hautDeGamme;
        pelissier = 0;
        confiance += 0.25;
      }
      if (d2 === 3) confiance -= 0.05;
    }

    // Le rappel : les appareils du lot échangés avant de casser.
    let rappeles = 0;
    if (w === 7 && d4 !== 2) {
      rappeles = intensif + pelissier + (d4 === 1 || d4 === 3 ? leger : 0);
      intensif = 0;
      pelissier = 0;
      if (d4 === 1 || d4 === 3) leger = 0;
      if (d4 === 3) semaine += COUTS.parcSain * COUTS.inspection;
    }
    // Le courrier aux acheteurs : ceux qui font travailler dur un appareil du lot viennent l'échanger.
    let precaution = 0;
    if (d5 === 0 && (w === 9 || w === 10)) {
      const venus = 0.5 * (intensif + pelissier) + 0.05 * leger;
      intensif *= 0.5;
      pelissier *= 0.5;
      leger *= 0.95;
      rappeles += venus;
      precaution = 6;
      semaine += precaution * COUTS.precaution + (w === 9 ? COUTS.courrier : 0);
    }
    semaine += rappeles * PRIX.echange;
    lot += rappeles * PRIX.echange;

    // Les pannes de la semaine.
    const pannesIntensif = intensif * RISQUE_INTENSIF * usure;
    const pannesLeger = leger * risqueLeger * usure;
    const pannesPelissier = pelissier * RISQUE_PELISSIER * usure;
    const pannesNouveaux = nouveaux * RISQUE_NOUVEAU_LOT * usure;
    intensif -= pannesIntensif;
    leger -= pannesLeger;
    pelissier -= pannesPelissier;
    nouveaux -= pannesNouveaux;
    const pannes = pannesIntensif + pannesLeger + pannesPelissier + pannesNouveaux;
    const surChantier = pannesIntensif + pannesPelissier + pannesNouveaux;
    const retours = pannes + RETOURS_NORMAUX * n.ventes;
    confiance -= 0.03 * pannesPelissier;

    // Chaque panne remplacée en rayon : du lot, tant que le lot y est.
    if (!retire) {
      intensif += enRayon * pannesIntensif;
      leger += enRayon * pannesLeger;
      pelissier += enRayon * pannesPelissier;
      stockLot -= enRayon * (pannesIntensif + pannesLeger + pannesPelissier);
    }
    // Et chaque vente du lot ajoute un appareil qui cassera.
    const vendusDuLot = ventes * enRayon;
    intensif += vendusDuLot / 2;
    leger += vendusDuLot / 2;
    stockLot = Math.max(0, stockLot - vendusDuLot);

    // Ce que coûte chaque panne : l'appareil, la course, le chantier arrêté, le geste commercial.
    // La garantie du fournisseur couvre l'appareil et la course, jamais les gestes envers nos clients.
    const parPanne = (retire ? PRIX.vente - PRIX.achat : 0) + PRIX.panne;
    semaine += pannes * parPanne + surChantier * PRIX.chantier;
    if (d1 === 0 && w >= 2) semaine += pannes * COUTS.avoirParPanne;
    lot += (pannes - pannesNouveaux) * PRIX.panne;

    // Le nouveau lot, à partir de la semaine 11 : les MX-160 sains sont épuisés.
    if (w >= 11) {
      const vendable = (d6 === 0 && !lotKo) || d6 === 1 || (d6 === 2 && w === SEMAINES);
      if (!vendable) semaine += RUPTURE;
      if (d6 === 0 && w === 11) semaine += COUTS.controle;
      if (d6 === 2 && w === 11) semaine += COUTS.referencement;
      if (d6 === 1 && lotKo) nouveaux += ventes;
      // Vendu sans contrôle, le lot défectueux doit être rappelé, sans recours : il a été accepté.
      if (d6 === 1 && lotKo && w === SEMAINES) {
        semaine += nouveaux * PRIX.echange;
        nouveaux = 0;
      }
    }

    // Les réclamations : ce qui arrive, ce que l'équipe SAV et les agences ferment.
    let capacite = w === 1 ? 10 : [30, 16, 20, w < 5 ? 5 : 12][d1 ?? 3]!;
    capacite *= capaciteImprevu;
    ouvertes += retours;
    ouvertes -= Math.min(ouvertes, capacite);

    // La satisfaction des clients concernés : l'attente, les pannes à répétition, la franchise.
    let satisfaction = 0.84 - 0.004 * ouvertes - 0.25 * enRayon;
    if (d1 === 0 && w >= 2) satisfaction += 0.03;
    if (d4 !== 2 && w >= 7) satisfaction += 0.04;
    if (w >= 9) {
      if (d5 === 0) satisfaction += 0.06;
      if (d5 === 1) satisfaction -= 0.1 + 0.05 * (w - 9);
      if (d5 === 2) satisfaction += 0.02;
      if (d5 === 3) satisfaction -= 0.12 + 0.055 * (w - 9);
    }
    if (d6 === 1 && lotKo && w >= 12) satisfaction -= 0.12;
    satisfaction = borne(satisfaction, 0.35, 0.95);

    // Les bons d'achat : à chaque client qui se manifeste.
    if (d5 === 2 && w >= 9) semaine += COUTS.bonDAchat * (retours + COUTS.inquiets);

    // Les clients perdus : un artisan mécontent, et ceux qui l'entendent, vont chez le concurrent.
    semaine += (pannes + 6) * Math.max(0, 0.9 - satisfaction) * 600;

    // Pélissier décide en fin de semaine 6.
    confiance = borne(confiance, 0, 1);
    if (w === 6 && h.uPelissier < risqueDeDepart(confiance)) pelissierPart = true;
    if (pelissierPart && w >= 7) semaine += MARGE_PELISSIER;

    // En fin de trimestre, la provision pour les appareils du lot encore chez les clients.
    if (w === SEMAINES) {
      const surChantierAVenir =
        intensif * aCasser(RISQUE_INTENSIF) + pelissier * aCasser(RISQUE_PELISSIER);
      const pannesAVenir = surChantierAVenir + leger * aCasser(risqueLeger);
      semaine += pannesAVenir * PRIX.panne + surChantierAVenir * PRIX.chantier;
      lot += pannesAVenir * PRIX.panne;
    }

    // Le fournisseur : la suspension, la remise, et ce qu'il rembourse.
    if (d3 === 0 && w === 5) semaine += COUTS.expertise;
    if (d3 === 1 && w >= 5 && (part === 0 || w <= 6)) semaine += COUTS.suspension;
    coutsDuLot += lot;
    let rendu = 0;
    if (w === 5) rendu = part * coutsDuLot;
    else if (w > 5) rendu = part * lot;

    cout += semaine;
    rembourse += rendu;
    retoursTotal += retours;
    satisfactionTotale += satisfaction;
    semaines.push({
      retours,
      ouvertes,
      satisfaction,
      cout,
      rembourse,
      net: semaine - rendu,
      confiance,
      parc: intensif + leger + pelissier,
    });
  }

  const derniere = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: BUDGET - cout + rembourse,
    cout,
    rembourse,
    pelissierPart,
    fournisseurPaie: part > 0,
    nouveauLotDefectueux: lotKo,
    nouveauLotVendu: d6 === 1 && lotKo,
    retoursTotal,
    satisfactionMoyenne: satisfactionTotale / SEMAINES,
    partFournisseur: cout > 0 ? rembourse / cout : 0,
    retoursFinaux: derniere.retours,
    parcFinal: derniere.parc,
  };
}

/** Ce qui s'est passé pendant des semaines : Pélissier, le fournisseur, le nouveau lot, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const d3 = chemin[D.fournisseur];
  return {
    pelissierPart: t.pelissierPart && dans(7),
    pelissierReste: !t.pelissierPart && chemin[D.pelissier] !== 3 && dans(7),
    fournisseurRepond: (d3 === 0 || d3 === 1) && dans(5),
    fournisseurPaie: t.fournisseurPaie,
    nouveauLotCasse: t.nouveauLotVendu && dans(12),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureQualite {
  retours: number | null;
  ouvertes: number | null;
  satisfaction: number | null;
  cout: number | null;
  /** Le coût cumulé net de ce que le fournisseur a remboursé : ce que le budget mesure. */
  coutNet: number | null;
  partFournisseur: number | null;
  budgetADate: number | null;
  /** Appareils du lot encore chez les clients : non affiché, il nourrit les messages. */
  parc: number | null;
}

/** Ce que Laure lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureQualite {
  if (semaine === 0) {
    return {
      retours: RETOURS_DEPART,
      ouvertes: OUVERTES_DEPART,
      satisfaction: SATISFACTION_DEPART,
      cout: 0,
      coutNet: 0,
      partFournisseur: 0,
      budgetADate: 0,
      parc: PARC_INTENSIF + PARC_LEGER + PARC_PELISSIER,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    retours: s.retours,
    ouvertes: s.ouvertes,
    satisfaction: s.satisfaction,
    cout: s.cout,
    coutNet: s.cout - s.rembourse,
    partFournisseur: s.cout > 0 ? s.rembourse / s.cout : 0,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    parc: s.parc,
  };
}
