/**
 * LA NOTE QUI CHUTE — le modèle de L'Escale Chambéry-Gare, de juin à août.
 *
 * Un hôtel 3 étoiles de 72 chambres face à la gare, une clientèle d'affaires
 * en semaine que l'été remplace peu à peu par des clients de loisirs, des
 * travaux de voirie devant la façade, et une note moyenne sur Bookalia et
 * Voyagio passée de 8,7 à 8,1 en trois mois. Treize semaines, six décisions.
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA NOTE FIXE LE PRIX QU'ON PEUT TENIR. À note égale, les voyageurs
 *     paient le prix des concurrents ; chaque dixième de point perdu retire
 *     environ 1 € au prix moyen « tenable » et, par le classement des
 *     plateformes, une vingtaine de nuitées au trimestre. Sous 8,0, l'hôtel
 *     sort du filtre « 8 et plus » que beaucoup de voyageurs cochent. Vendre
 *     au-dessus du prix tenable fait fuir la demande ; vendre en dessous en
 *     amène peu. Le bon prix suit la note, ni plus ni moins.
 *   · LA CAUSE SE LIT DANS LES AVIS PAR THÈME. Les avis les plus vifs parlent
 *     de l'accueil ; la masse des avis négatifs parle de chaleur et de bruit
 *     dans les 40 chambres côté rue : les climatiseurs ne tiennent pas, les
 *     clients ouvrent la fenêtre sur le chantier. Le petit-déjeuner en
 *     rupture après 8 h 30 pèse de plus en plus à mesure que l'été amène des
 *     clients de loisirs, qui déjeunent tard. Réparer la cause relève la note
 *     des séjours suivants ; rien d'autre ne le fait.
 *   · RÉPONDRE COÛTE, ET NE CHANGE PAS LES AVIS DÉJÀ PUBLIÉS. Un geste
 *     commercial par avis négatif ne modifie presque jamais l'avis ; une
 *     réponse sobre, qui dit ce qui est réparé, rassure un peu les lecteurs.
 *     Solliciter les avis accélère la note vers l'expérience du moment :
 *     c'est une bonne affaire quand la cause est réparée, une mauvaise avant.
 *     Relancer des clients longtemps après leur séjour fait surtout écrire
 *     les mécontents. Offrir un avantage contre un avis est interdit par les
 *     plateformes : quand elles le détectent, les avis sont retirés et
 *     l'hôtel déclassé.
 *   · LA NOTE RÉAGIT AVEC RETARD. Elle moyenne les avis des derniers mois, les
 *     plus récents comptant davantage : les avis de mai pèsent encore en
 *     juillet. Une réparation juste ne se voit qu'au bout de plusieurs
 *     semaines, et il faut tenir le cap pendant ce temps.
 *
 * Le trimestre est jugé en euros : le chiffre d'affaires hébergement de juin
 * à août, net des coûts engagés (gestes commerciaux, réparations, renforts,
 * prestataires et locations).
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Groupe, hôtel, personnes, plateformes et chiffres
 * sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAMBRES = 72;
/** Les chambres sur la place de la gare, où passe le chantier, et celles sur la cour. */
export const COTE_RUE = 40;
export const COTE_COUR = 32;
/** Les chambres-nuits offertes par semaine. */
export const CAPACITE = CHAMBRES * 7;
/** Quelques chambres sont toujours hors service : on ne remplit jamais tout à fait. */
export const REMPLISSAGE_MAX = 0.97;

/** La note d'avant, et le prix moyen de la grille d'été, qui lui correspondait. */
export const NOTE_REFERENCE = 8.7;
export const PRIX_GRILLE = 102;
/** Ce qu'un dixième de point de note vaut : en prix moyen tenable, et en nuitées par trimestre. */
export const PRIX_PAR_DIXIEME = 1;
export const NUITEES_PAR_DIXIEME = 20;
/** Sous 8,0, l'hôtel sort du filtre « 8 et plus » des plateformes. */
export const SEUIL_FILTRE = 8;
export const PERTE_FILTRE = 0.06;
/** Au-dessus du prix tenable, la demande fuit vite ; en dessous, elle vient peu. */
export const ELASTICITE_HAUT = 2;
export const ELASTICITE_BAS = 0.6;

/** La demande de l'été à note 8,7 et au prix de la grille : clients d'affaires et de loisirs. */
export const AFFAIRES = [300, 305, 300, 290, 250, 225, 205, 190, 150, 130, 125, 140, 175] as const;
export const LOISIRS = [100, 105, 115, 125, 160, 185, 205, 215, 235, 240, 235, 215, 180] as const;
export const NUITEES_PREVUES = AFFAIRES.reduce((s, x, i) => s + x + LOISIRS[i]!, 0);
/** Le chiffre d'affaires hébergement que le budget prévoyait, à la note d'avant. */
export const BUDGET = NUITEES_PREVUES * PRIX_GRILLE;
/** Le manque à gagner d'un dixième de point sur le trimestre : prix tenable, et classement. */
export const MANQUE_PAR_DIXIEME =
  PRIX_PAR_DIXIEME * NUITEES_PREVUES + NUITEES_PAR_DIXIEME * PRIX_GRILLE;

/** Les avis : durée moyenne d'un séjour, part des séjours qui laissent un avis, oubli hebdomadaire. */
export const DUREE_SEJOUR = 1.6;
export const TAUX_AVIS = 0.11;
/** Le poids d'un avis est multiplié par ce facteur chaque semaine : la note oublie lentement. */
export const OUBLI = 0.9;

/** L'expérience d'un séjour sans défaut, et ce que coûte chaque défaut à la note du séjour. */
export const NOTE_SANS_DEFAUT = 9.05;
/** Une nuit côté rue, climatiseur défaillant, chaleur d'été et chantier sous la fenêtre. */
export const PENALITE_CLIM = 2;
/** Un client de loisirs qui trouve le buffet vide après 8 h 30. */
export const PENALITE_PDJ = 1.1;
export const PENALITE_ACCUEIL = 0.08;
/** La chaleur de chaque semaine, rapportée à une semaine ordinaire de juillet. */
export const CHALEUR = [0.85, 0.9, 0.95, 1, 1, 1.05, 1.1, 1.1, 1.1, 1.05, 1, 0.95, 0.85] as const;
/** Le chantier de voirie s'arrête à la fin de la semaine 11. */
export const FIN_TRAVAUX = 11;
/** La canicule annoncée : semaines 8 et 9, fin juillet. */
export const CANICULE = [8, 9] as const;

/** Les avis que la réception a relevés en mai, par thème : la part des avis négatifs qui les citent. */
export const THEMES = {
  avisNegatifsMai: 78,
  chaleur: 0.47,
  bruit: 0.32,
  /** Les avis qui citent le bruit et parlent aussi de fenêtre ouverte ou de chaleur. */
  bruitAvecChaleur: 0.8,
  petitDejeuner: 0.21,
  accueil: 0.09,
  prix: 0.12,
} as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux se paie en gestes au comptoir et en clients relogés. */
export const PERTE_PAR_JOUR = 1200;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  cause: 0,
  petitDej: 1,
  prix: 2,
  avis: 3,
  canicule: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 1, 3, 3, 3] as const;

export const COUTS = {
  /** Remise en état des 40 climatiseurs côté rue : fluide, compresseurs, cartes. */
  climatisation: 8400,
  /** Formation de la réception et renfort du soir. */
  reception: 2600,
  /** Un geste commercial sur un avis négatif : avoir ou nuit à moitié prix. */
  gesteAvis: 45,
  /** Un geste au comptoir pour un client qui se plaint de la chaleur. */
  gesteChaleur: 40,
  /** L'extra du petit-déjeuner, de 7 h 30 à 10 h 30, par semaine. */
  extraPdj: 520,
  /** Le petit-déjeuner servi à table : deux serveurs de plus, par semaine. */
  pdjServi: 1500,
  /** Un petit-déjeuner offert. */
  petitDejeuner: 14,
  /** L'agence de réputation : forfait de mise en place, et forfait par semaine. */
  agence: 1500,
  agenceSemaine: 220,
  /** La location de 40 climatiseurs mobiles pour deux semaines. */
  climMobiles: 5400,
  /** Une campagne d'e-mails de relance. */
  relance: 300,
  /** Un client délogé dans un hôtel voisin, taxi et nuit payés. */
  delogement: 130,
} as const;

/** Ce que changent les réponses et les sollicitations. */
export const AVIS = {
  /** Solliciter chaque client au départ : plus d'avis, et des clients satisfaits qui écrivent aussi. */
  sollicitation: 1.7,
  biaisSollicitation: 0.3,
  /** Les avis « récompensés » : bien plus nombreux, et bien plus flatteurs. */
  incitation: 2,
  biaisIncitation: 0.8,
  /** La chance que les plateformes détectent les avis récompensés, et ce que coûte le déclassement. */
  detection: 0.5,
  declassement: 0.22,
  /** Une relance tardive : combien d'avis elle fait écrire, et combien ils sont plus durs. */
  relanceTardive: 80,
  severiteTardive: 0.4,
  /** Des réponses sobres rassurent les lecteurs : un peu plus de réservations. */
  conversionReponse: 0.02,
  conversionAgence: 0.01,
} as const;

/* ---------------------------------------------------------------------------
 * L'AVANT-TRIMESTRE : les avis de mars à mai, qui pèsent encore sur la note.
 * ------------------------------------------------------------------------- */

/** Les notes moyennes des avis, semaine par semaine, de début mars à fin mai. */
export const HISTORIQUE = [
  8.65, 8.5, 8.4, 8.25, 8.1, 7.95, 7.85, 7.75, 7.65, 7.6, 7.55, 7.5,
] as const;
/** Les avis par semaine avant le trimestre, et le stock des avis plus anciens, à la note d'avant. */
export const AVIS_AVANT = 25;

interface Stock {
  poids: number;
  somme: number;
}

function stockDeDepart(): Stock {
  const ancien = AVIS_AVANT / (1 - OUBLI);
  let poids = ancien;
  let somme = ancien * 8.75;
  for (const r of HISTORIQUE) {
    poids = poids * OUBLI + AVIS_AVANT;
    somme = somme * OUBLI + AVIS_AVANT * r;
  }
  return { poids, somme };
}
const DEPART = stockDeDepart();
/** La note affichée au premier lundi de juin. */
export const NOTE_DEPART = DEPART.somme / DEPART.poids;
/** L'occupation de mai, ce qu'affiche le tableau de bord au premier jour. */
export const OCCUPATION_MAI = 0.74;

/** Le prix moyen que la note permet de tenir, à occupation égale. */
export const prixTenable = (note: number) =>
  PRIX_GRILLE + PRIX_PAR_DIXIEME * 10 * (note - NOTE_REFERENCE);

/** Ce que l'écart entre le prix pratiqué et le prix tenable fait à la demande. */
export function effetPrix(prix: number, tenable: number): number {
  const g = (prix - tenable) / tenable;
  return g > 0 ? Math.exp(-ELASTICITE_HAUT * g) : 1 + ELASTICITE_BAS * -g;
}

/** Ce que le classement des plateformes fait à la demande, selon la note. */
export function visibilite(note: number): number {
  const parDixieme = NUITEES_PAR_DIXIEME / NUITEES_PREVUES;
  return (
    (1 + parDixieme * 10 * (note - NOTE_REFERENCE)) * (note < SEUIL_FILTRE ? 1 - PERTE_FILTRE : 1)
  );
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
  effet: { demande?: number; note?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "ascenseur",
    titre: "Panne de l'ascenseur",
    de: "Nuno Pessoa",
    role: "Technicien de maintenance",
    texte:
      "L'ascenseur est en panne depuis mardi, la pièce arrive jeudi. Les clients montent leurs valises à pied jusqu'au cinquième.",
    effet: { note: 0.25, cout: 900 },
  },
  {
    id: "greve",
    titre: "Mouvement social sur les lignes ferroviaires",
    de: "Ilias Benchekroun",
    role: "Chef de réception",
    texte:
      "Trois jours de grève sur les trains : les clients d'affaires annulent ou décalent, et la gare est vide le soir.",
    effet: { demande: 0.88 },
  },
  {
    id: "course",
    titre: "Arrivée d'une étape de course cycliste",
    de: "Lucile Fabbri",
    role: "Revenue manager, siège",
    texte:
      "Une étape d'une grande course cycliste arrive à Chambéry : équipes, presse et suiveurs cherchent des chambres pour deux nuits.",
    effet: { demande: 1.1 },
  },
  {
    id: "eau",
    titre: "Coupure d'eau chaude",
    de: "Nuno Pessoa",
    role: "Technicien de maintenance",
    texte:
      "Le ballon d'eau chaude a lâché dans la nuit : douches froides pour tout l'hôtel une matinée, et un dépannage en urgence.",
    effet: { note: 0.3, cout: 1600 },
  },
  {
    id: "salon",
    titre: "Salon professionnel annulé",
    de: "Lucile Fabbri",
    role: "Revenue manager, siège",
    texte:
      "Le salon de l'outillage prévu au parc des expositions est annulé : une quarantaine de chambres-nuits réservées partent en annulation sans frais.",
    effet: { demande: 0.92 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  chaleur: number;
  note: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le frigoriste peut-il venir dès cette semaine ? */
  uFrigoriste: number;
  /** La canicule sera-t-elle forte ? */
  uCanicule: number;
  /** Les climatiseurs remis en état tiendront-ils la canicule ? */
  uTient: number;
  /** Les plateformes détecteront-elles les avis récompensés, et quand ? */
  uDetection: number;
  semaineDetection: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000507 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r))),
      chaleur: Math.min(1.25, Math.max(0.75, 1 + 0.1 * gauss(r))),
      note: Math.min(0.25, Math.max(-0.25, 0.08 * gauss(r))),
    });
  }
  const uFrigoriste = r();
  const uCanicule = r();
  const uTient = r();
  const uDetection = r();
  const semaineDetection = 9 + Math.floor(r() * 3);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uFrigoriste, uCanicule, uTient, uDetection, semaineDetection, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux, le frigoriste vient dès la première semaine ; sinon, la semaine suivante. */
export const frigoristeRapide = (graine: number) => hasard(graine).uFrigoriste < 0.5;
/** Une fois sur deux, la canicule est forte : plusieurs jours au-delà de 35 °C. */
export const caniculeForte = (graine: number) => hasard(graine).uCanicule < 0.5;
export const INTENSITE = { forte: 1.45, moderee: 1.2 } as const;
/**
 * LES CLIMATISEURS RÉPARÉS TIENDRONT-ILS ?
 *
 * Remis en état, ils tiennent une chaleur d'été. Une canicule forte en fait
 * décrocher une partie près d'une fois sur deux, une canicule modérée une fois sur dix.
 */
export const chanceDeLacher = (graine: number) => (caniculeForte(graine) ? 0.45 : 0.1);
export const climLache = (chemin: readonly number[], graine: number) =>
  chemin[D.cause] === 1 && hasard(graine).uTient < chanceDeLacher(graine);
/** Les avis récompensés sont détectés une fois sur deux, entre les semaines 9 et 11. */
export const incitationDetectee = (chemin: readonly number[], graine: number) =>
  chemin[D.avis] === 0 && hasard(graine).uDetection < AVIS.detection;

/** L'état des climatiseurs côté rue : 1, défaillants ; proche de 0, ils refroidissent. */
export const ETAT_REPARE = 0.12;
export const ETAT_LACHE = 0.85;
export const ETAT_MOBILES = 0.2;

export type Semaine = {
  /** La note affichée sur les plateformes en fin de semaine. */
  note: number;
  /** La note moyenne des avis publiés dans la semaine. */
  noteSemaine: number;
  avis: number;
  /** Part des avis de la semaine à 6 sur 10 ou moins. */
  negatifs: number;
  prixMoyen: number;
  occupation: number;
  revpar: number;
  nuitees: number;
  ca: number;
  couts: number;
  /** Le chiffre d'affaires de la semaine, net des coûts engagés. */
  net: number;
  /** Le même, cumulé depuis le début du trimestre. */
  caNet: number;
  chaleur: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le chiffre d'affaires hébergement du trimestre, net des coûts engagés. */
  objectif: number;
  ca: number;
  couts: number;
  gestes: number;
  /** Les clients délogés dans un hôtel voisin pendant la canicule. */
  delogements: number;
  nuitees: number;
  prixMoyen: number;
  occupation: number;
  noteFinale: number;
  noteMin: number;
  /** Les semaines où la note est restée sous 8,0 : hors du filtre « 8 et plus ». */
  semainesSousFiltre: number;
  climReparee: boolean;
  frigoristeRapide: boolean;
  caniculeForte: boolean;
  climLache: boolean;
  detecte: boolean;
  semaineDetection: number | null;
  /** Le manque à gagner d'un dixième de point, pour la prévision. */
  manqueParDixieme: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Le prix pratiqué une semaine donnée, selon la politique de prix et la note déjà affichée. */
export function prixPratique(chemin: readonly number[], w: number, noteIlYADeux: number): number {
  let prix = PRIX_GRILLE;
  if (w >= 5) {
    const d3 = chemin[D.prix];
    if (d3 === 0) prix = PRIX_GRILLE - 10;
    if (d3 === 2)
      prix = borne(Math.round(prixTenable(noteIlYADeux)), PRIX_GRILLE - 10, PRIX_GRILLE + 2);
    if (d3 === 3) prix = PRIX_GRILLE - 6;
  }
  if (chemin[D.fin] === 2 && w >= 10) prix *= 0.9;
  return prix;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, , d4, d5, d6] = chemin;
  const rapide = frigoristeRapide(graine);
  const forte = caniculeForte(graine);
  const lache = climLache(chemin, graine);
  const detecte = incitationDetectee(chemin, graine);
  const semaineDetection = detecte ? h.semaineDetection : null;

  const semaines: (Semaine | null)[] = [null];
  let poids = DEPART.poids;
  let somme = DEPART.somme;
  /** La part de la somme qui vient des avis récompensés : les plateformes la retirent. */
  let sommeIncitee = 0;
  let poidsIncite = 0;
  const notes: number[] = [NOTE_DEPART, NOTE_DEPART];
  const experiences: number[] = [];
  let caNet = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let caTotal = 0;
  let coutsTotal = -caNet;
  let gestes = 0;
  let nuiteesTotal = 0;
  let delogements = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => i.semaine === w);
    const noteVue = notes[notes.length - 1]!;
    const noteIlYADeux = notes[notes.length - 2]!;
    let couts = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // Le prix, et la demande qu'il trouve à cette note.
    const prix = prixPratique(chemin, w, noteIlYADeux);
    let demande = (AFFAIRES[w - 1]! + LOISIRS[w - 1]!) * n.demande;
    demande *= effetPrix(prix, prixTenable(noteVue)) * visibilite(noteVue);
    if (d1 === 0 && w <= 6) demande *= 1 + AVIS.conversionAgence;
    if (d4 === 1 && w >= 7) demande *= 1 + AVIS.conversionReponse;
    if (d4 === 2 && w >= 7) demande *= 1 + AVIS.conversionAgence;
    if (semaineDetection !== null && w > semaineDetection) demande *= 1 - AVIS.declassement;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;
    const nuitees = Math.min(CAPACITE * REMPLISSAGE_MAX, demande);
    const ca = nuitees * prix;

    // Qui dort côté rue : sans consigne, la réception remplit par étage, rue et cour mêlées.
    let partRue = COTE_RUE / CHAMBRES;
    const enCanicule = w === CANICULE[0] || w === CANICULE[1];
    if (d5 === 1 && enCanicule) {
      partRue = Math.max(0.15, (nuitees - COTE_COUR * 7 * 0.95) / nuitees);
    }
    const partLoisirs = LOISIRS[w - 1]! / (AFFAIRES[w - 1]! + LOISIRS[w - 1]!);

    // L'état des climatiseurs côté rue.
    let etat = 1;
    if (d1 === 1) {
      const fin = rapide ? 3 : 4;
      etat = w >= fin ? ETAT_REPARE : w === fin - 1 ? 0.45 : 1;
      if (enCanicule && lache) etat = ETAT_LACHE;
    }
    if (d5 === 0 && enCanicule) etat = Math.min(etat, ETAT_MOBILES);
    let chaleur = CHALEUR[w - 1]! * n.chaleur;
    if (enCanicule) chaleur *= forte ? INTENSITE.forte : INTENSITE.moderee;
    const travaux = w <= FIN_TRAVAUX ? 1 : 0.6;
    const climRue = PENALITE_CLIM * chaleur * etat * travaux;

    // Le petit-déjeuner : vide après 8 h 30, quand arrivent les clients de loisirs.
    let pdj = 1;
    if (d2 === 0 && w >= 3) pdj = 0.15;
    if (d2 === 1) pdj = 0.9;
    if (d2 === 2 && w >= 3) pdj = 0;

    // L'expérience de la semaine, telle que les clients la noteront.
    let experience = NOTE_SANS_DEFAUT - partRue * climRue - PENALITE_PDJ * partLoisirs * pdj;
    experience -= d1 === 2 && w >= 2 ? -0.04 : PENALITE_ACCUEIL;
    if (d2 === 2 && w >= 3) experience += 0.05;
    if (d4 === 1 && w >= 7) experience += 0.05;
    if (d4 === 2 && w >= 7) experience += 0.02;
    if (d5 === 0 && enCanicule) experience -= partRue * 0.08; // les mobiles sont bruyants
    if (d5 === 2 && enCanicule) experience += partRue * 0.15;
    for (const a of actifs) experience -= a.imprevu.effet.note ?? 0;
    experience = borne(experience + n.note, 5, 9.6);
    experiences.push(experience);

    // Les avis de la semaine : spontanés, sollicités, récompensés.
    let avis = (nuitees / DUREE_SEJOUR) * TAUX_AVIS;
    let note = experience;
    const sollicite = d1 === 0 || (d6 === 1 && w >= 10);
    const incite = d4 === 0 && w >= 7 && (semaineDetection === null || w <= semaineDetection);
    if (incite) {
      avis *= AVIS.incitation;
      note += AVIS.biaisIncitation;
    } else if (sollicite) {
      avis *= AVIS.sollicitation;
      note += AVIS.biaisSollicitation;
    }
    note = Math.min(10, note);
    poids = poids * OUBLI + avis;
    somme = somme * OUBLI + avis * note;
    sommeIncitee *= OUBLI;
    poidsIncite *= OUBLI;
    if (incite) {
      sommeIncitee += avis * note;
      poidsIncite += avis;
    }
    // Les relances tardives : ce sont surtout les mécontents qui répondent.
    if (d1 === 0 && w === 2) {
      const passe = (HISTORIQUE.slice(-5).reduce((s, x) => s + x, 0) + experiences[0]!) / 6;
      poids += AVIS.relanceTardive;
      somme += AVIS.relanceTardive * (passe - AVIS.severiteTardive);
      couts += COUTS.relance;
    }
    if (d6 === 0 && w === 10) {
      const passe = experiences.slice(0, 9).reduce((s, x) => s + x, 0) / 9;
      poids += AVIS.relanceTardive;
      somme += AVIS.relanceTardive * (passe - AVIS.severiteTardive);
      couts += COUTS.relance;
    }
    // Détectés, les avis récompensés sont retirés.
    if (semaineDetection === w) {
      poids -= poidsIncite;
      somme -= sommeIncitee;
      sommeIncitee = 0;
      poidsIncite = 0;
    }
    const affichee = somme / poids;
    notes.push(affichee);

    // Ce que la semaine coûte.
    const negatifs = borne(0.06 + 0.18 * (8.8 - note), 0.04, 0.6);
    const avisNegatifs = avis * negatifs;
    let geste = 0;
    if ((d1 === 0 && w <= 6) || (d4 === 2 && w >= 7)) geste += avisNegatifs * COUTS.gesteAvis;
    const plaintes = nuitees * partRue * 0.1 * Math.max(0, climRue - 0.6);
    geste += plaintes * COUTS.gesteChaleur;
    if (d2 === 1) geste += nuitees * partLoisirs * 0.6 * pdj * 0.25 * COUTS.petitDejeuner;
    if (d5 === 2 && enCanicule) geste += nuitees * partRue * COUTS.petitDejeuner;
    // En canicule, une chambre à 30 °C la nuit ne se négocie plus : il faut déloger.
    const deloges = enCanicule ? nuitees * partRue * 0.25 * Math.max(0, climRue - 1.8) : 0;
    couts += deloges * COUTS.delogement;
    delogements += deloges;
    if (d4 === 0 && incite) geste += avis * 0.3 * 0.1 * PRIX_GRILLE;
    couts += geste;
    gestes += geste;
    if (d1 === 1 && w === 1) couts += COUTS.climatisation;
    if (d1 === 2 && w === 2) couts += COUTS.reception;
    if (d2 === 0 && w >= 3) couts += COUTS.extraPdj;
    if (d2 === 2 && w >= 3) couts += COUTS.pdjServi;
    if ((d4 === 0 || d4 === 2) && w === 7) couts += COUTS.agence;
    if (d4 === 2 && w >= 7) couts += COUTS.agenceSemaine;
    if (d5 === 0 && w === CANICULE[0]) couts += COUTS.climMobiles;
    for (const a of actifs) couts += a.imprevu.effet.cout ?? 0;

    const net = ca - couts;
    caNet += net;
    caTotal += ca;
    coutsTotal += couts;
    nuiteesTotal += nuitees;
    semaines.push({
      note: affichee,
      noteSemaine: note,
      avis,
      negatifs,
      prixMoyen: prix,
      occupation: nuitees / CAPACITE,
      revpar: ca / CAPACITE,
      nuitees,
      ca,
      couts,
      net,
      caNet,
      chaleur,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: caNet,
    ca: caTotal,
    couts: coutsTotal,
    gestes,
    delogements,
    nuitees: nuiteesTotal,
    prixMoyen: caTotal / nuiteesTotal,
    occupation: nuiteesTotal / (CAPACITE * SEMAINES),
    noteFinale: pleines[SEMAINES - 1]!.note,
    noteMin: Math.min(...pleines.map((s) => s.note)),
    semainesSousFiltre: pleines.filter((s) => s.note < SEUIL_FILTRE).length,
    climReparee: d1 === 1,
    frigoristeRapide: rapide,
    caniculeForte: forte,
    climLache: lache,
    detecte,
    semaineDetection,
    manqueParDixieme: MANQUE_PAR_DIXIEME,
  };
}

/** Ce qui s'est passé pendant des semaines : réparation, canicule, détection, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const finClim = t.frigoristeRapide ? 2 : 3;
  const sousFiltre = t.semaines.findIndex((s) => s !== null && s.note < SEUIL_FILTRE);
  return {
    climFinie: t.climReparee && dans(finClim) ? finClim : null,
    climLache: t.climLache && dans(CANICULE[0]),
    detection: t.semaineDetection !== null && dans(t.semaineDetection) ? t.semaineDetection : null,
    sousFiltre: sousFiltre > 0 && dans(sousFiltre) ? sousFiltre : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureHotel {
  note: number | null;
  prixMoyen: number | null;
  occupation: number | null;
  revpar: number | null;
  caNet: number | null;
  budgetADate: number | null;
  noteSemaine: number | null;
  /** La moyenne des avis des quatre dernières semaines. */
  noteRecente: number | null;
  avis: number | null;
}

/** Ce que Hadrien lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureHotel {
  if (semaine === 0) {
    const recente = HISTORIQUE.slice(-4).reduce((s, x) => s + x, 0) / 4;
    return {
      note: NOTE_DEPART,
      prixMoyen: PRIX_GRILLE,
      occupation: OCCUPATION_MAI,
      revpar: OCCUPATION_MAI * PRIX_GRILLE,
      caNet: 0,
      budgetADate: 0,
      noteSemaine: HISTORIQUE[HISTORIQUE.length - 1]!,
      noteRecente: recente,
      avis: AVIS_AVANT,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const quatre = t.semaines.slice(Math.max(1, semaine - 3), semaine + 1) as Semaine[];
  const recente =
    quatre.reduce((x, q) => x + q.noteSemaine * q.avis, 0) / quatre.reduce((x, q) => x + q.avis, 0);
  return {
    note: s.note,
    prixMoyen: s.prixMoyen,
    occupation: s.occupation,
    revpar: s.revpar,
    caNet: s.caNet,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    noteSemaine: s.noteSemaine,
    noteRecente: recente,
    avis: s.avis,
  };
}
