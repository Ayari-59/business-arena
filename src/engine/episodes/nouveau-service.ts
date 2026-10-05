/**
 * LE NOUVEAU SERVICE — le modèle du lancement de la location de matériel.
 *
 * Arvel Distribution veut louer du matériel de chantier — échafaudages
 * roulants, bétonnières, perforateurs, petit outillage — dans ses douze
 * agences de la région lyonnaise. La direction veut les douze agences au
 * trimestre ; un loueur spécialisé, Ferlane Location, tient déjà le marché ;
 * personne n'a vérifié ce que les artisans loueraient vraiment. Treize
 * semaines, six décisions. Trois mécanismes font l'épisode, et le joueur doit
 * les découvrir :
 *
 *   · LA DEMANDE RÉELLE NE SE DEVINE PAS, ELLE SE MESURE. Elle est tirée au
 *     hasard pour chaque trimestre : faible, moyenne ou forte. Un sondage dit
 *     que les artisans « aiment l'idée » ; seul un pilote dit combien ils
 *     louent. Un parc acheté pour douze agences se paie chaque semaine
 *     (amortissement, financement, une demi-journée de comptoir par agence)
 *     et, quand il dort, le contrôle de gestion le ramène à sa valeur de
 *     revente à la clôture. Un petit parc dans deux agences coûte peu, et
 *     achète de l'information. Une étude de marché en achète aussi, mais
 *     huit semaines plus tard, et sans les problèmes du terrain.
 *   · LE TERRAIN RÉVÈLE CE QU'AUCUNE ÉTUDE NE MONTRE. Matériel rendu en
 *     retard, bétonnières rendues avec du béton durci, casse non déclarée :
 *     sans caution, sans contrôle au retour, sans forfait adapté, chaque
 *     location perd une part de sa marge et chaque retard bloque la suivante.
 *     Ajuster l'offre avec les clients du pilote rend la marge que baisser les
 *     prix ou livrer gratuitement ne rendent pas. Et un échafaudage reloué
 *     sans contrôle finit, un jour, par blesser quelqu'un : c'est un tirage,
 *     dont le risque grandit avec chaque location non contrôlée.
 *   · ON N'ÉTEND QUE CE QU'ON A BIEN MESURÉ. Le nombre de demandes de devis
 *     suit la publicité, pas le besoin : il est toujours flatteur. Étendre
 *     « selon les résultats » ne vaut que ce que valent les résultats qu'on
 *     suit — taux d'utilisation du parc, marge par location, clients qui
 *     reviennent. Avec eux, l'extension progressive s'arrête quand la demande
 *     manque et accélère quand elle est là ; avec les devis, elle étend
 *     toujours.
 *
 * Le trimestre est jugé en euros : la marge des locations et des ventes de
 * matériaux qu'elles entraînent, moins les coûts du parc (amortissement,
 * casse, logistique, dépréciation du parc qui dort) et du lancement, en
 * écart au budget du trimestre.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const AGENCES = 12;
/** Ce que la direction attend de chaque agence équipée, par semaine. */
export const PLAN_LOCATIONS = 18;
/** Le budget du trimestre : la contribution que le service devait dégager, lancement compris. */
export const BUDGET = 0;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des artisans repartis chez Ferlane avec leur commande. */
export const PERTE_PAR_JOUR = 1200;

/** Un parc complet : deux échafaudages roulants, quatre bétonnières, perforateurs, outillage. */
export const KIT_PLEIN = 30000;
/** Le parc d'une agence pilote : la moitié des références. */
export const KIT_PILOTE = 14000;
/** Les locations qu'un parc peut assurer par semaine, si tout revient à l'heure. */
export const CAPACITE_PLEIN = 22;
export const CAPACITE_PILOTE = 11;
/** Amortissement sur quatre ans, financement et assurance, par semaine. */
export const COUT_PARC = 0.0065;
/** Une demi-journée de comptoir, l'espace de stockage, par agence et par semaine. */
export const FIXE_PLEIN = 650;
export const FIXE_PILOTE = 400;
/** Signalétique, formation des vendeurs, paramétrage du logiciel, par agence ouverte. */
export const LANCEMENT_AGENCE = 2500;
export const LANCEMENT_PILOTE = 2000;
/** Ce qu'on perd en revendant un parc presque neuf. */
export const DECOTE_REVENTE = 0.1;
/** À la clôture, le parc qui tourne à moins de 50 % est ramené à sa valeur de revente. */
export const SEUIL_UTILISATION = 0.5;
export const DECOTE_CLOTURE = 0.3;

/** Prix moyen d'une location (deux jours et demi en moyenne), hors taxes. */
export const PRIX = 95;
/** Préparation, transferts entre agences, entretien courant, par location. */
export const LOGISTIQUE = 22;
/** Casse, nettoyage, matériel rendu incomplet, par location, sans contrôle au retour. */
export const CASSE = 20;
/** La marge des matériaux qu'un artisan achète avec sa location : ciment, sable, forets. */
export const VENTES_ASSOCIEES = 12;
/** La part des clients qui reviennent louer, sans rien faire de particulier. */
export const RETOUR_DEPART = 0.35;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  lancement: 0,
  mesure: 1,
  offre: 2,
  extension: 3,
  ferlane: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision : commander l'étude et attendre. */
export const NEUTRE = [3, 3, 3, 1, 3, 2] as const;

export const COUTS = {
  etude: 16000,
  suivi: 1000,
  ajustement: 1800,
  proximite: 1200,
  relance: 800,
  emailing: 4500,
  incident: 8000,
} as const;

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
  effet: { demande?: number; capacite?: number; parAgence?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "pluie",
    titre: "Dix jours de pluie",
    de: "Service commercial",
    role: "Siège",
    texte:
      "Dix jours de pluie sur la région : les chantiers de gros œuvre sont à l'arrêt, et les artisans ne louent ni bétonnière ni échafaudage.",
    duree: 1,
    effet: { demande: 0.6 },
  },
  {
    id: "salon",
    titre: "Salon de l'artisanat du bâtiment",
    de: "Marketing",
    role: "Siège",
    texte:
      "Le salon régional de l'artisanat du bâtiment se tient à Chassieu : deux semaines de chantiers lancés et d'artisans qui s'équipent.",
    duree: 2,
    effet: { demande: 1.2 },
  },
  {
    id: "logiciel",
    titre: "Panne du logiciel de réservation",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le module de réservation est tombé pour la semaine : contrats sur papier, retours mal suivis, du matériel qu'on croit loué et qui dort au fond du dépôt.",
    duree: 1,
    effet: { capacite: 0.8 },
  },
  {
    id: "transport",
    titre: "Grève chez le transporteur",
    de: "Logistique",
    role: "Dépôt régional",
    texte:
      "Grève chez le transporteur régional : plus aucun transfert de matériel entre agences pendant une semaine. Chaque agence fait avec son parc.",
    duree: 1,
    effet: { capacite: 0.85 },
  },
  {
    id: "verification",
    titre: "Vérification réglementaire des échafaudages",
    de: "Service sécurité",
    role: "Siège",
    texte:
      "L'organisme de contrôle passe vérifier les échafaudages roulants de chaque agence qui loue : 350 € par agence, et deux jours d'immobilisation.",
    duree: 1,
    effet: { capacite: 0.9, parAgence: 350 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La demande réelle : locations par agence équipée et par semaine, au prix prévu. */
  demande: number;
  /** L'erreur de mesure du pilote, ou de l'étude, en écarts types. */
  erreur: number;
  /** Un échafaudage reloué sans contrôle finira-t-il par blesser quelqu'un ? */
  uIncident: number;
  /** Ferlane accepte-t-il un partenariat ? */
  uFerlane: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Les tirages d'une graine, calculés une fois : le bilan en rejoue des centaines. */
export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000183 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({ demande: borne(1 + 0.1 * gauss(r), 0.75, 1.25) });
  }
  const demande = 4 + 15 * r();
  const erreur = borne(gauss(r), -2.5, 2.5);
  const uIncident = r();
  const uFerlane = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, demande, erreur, uIncident, uFerlane, imprevus };
  tirages.set(graine, h);
  return h;
}

/** La demande du trimestre, telle que le bilan la raconte. */
export const niveauDeDemande = (graine: number) => {
  const l = hasard(graine).demande;
  return l < 8 ? "faible" : l < 14 ? "moyenne" : "forte";
};

/** Une fois sur deux, Ferlane accepte de reprendre le parc et de faire des agences ses relais. */
export const ferlaneAccepte = (graine: number) => hasard(graine).uFerlane < 0.5;

/**
 * CE QUE LA MESURE DIT DE LA DEMANDE, au moment de décider de l'extension.
 *
 * Le taux d'utilisation, la marge par location et les clients qui reviennent
 * la mesurent à peu près ; le chiffre d'affaires la surestime (il ne voit ni
 * la casse ni les retours) ; les devis la surestiment toujours ; sans tableau,
 * on la lit à l'impression, enthousiaste. Une étude de marché la mesure
 * honnêtement, mais en semaine 9.
 */
export function estimation(chemin: readonly number[], graine: number): number {
  const h = hasard(graine);
  if (chemin[D.lancement] === 3) return h.demande * (1 + 0.15 * h.erreur);
  const [sigma, biais] = (
    [
      [0.08, 0],
      [0.15, 6],
      [0.15, 3.5],
      [0.3, 3],
    ] as const
  )[chemin[D.mesure] ?? 3]!;
  return h.demande * (1 + sigma * h.erreur) + biais;
}

/**
 * LES DOUZE AGENCES ne se valent pas : la demande de chacune, rapportée à la
 * moyenne, dépend des artisans de son secteur (gros œuvre ou second œuvre) et
 * de la distance à une agence Ferlane. Les deux agences pilotes sont dans la
 * moyenne ; la direction ouvrirait d'abord les plus grosses.
 */
export const RESEAU = [
  { nom: "Saint-Priest", facteur: 1.35 },
  { nom: "Villeurbanne", facteur: 1.25 },
  { nom: "Vaulx-en-Velin", facteur: 1.2 },
  { nom: "Décines", facteur: 1.1 },
  { nom: "Bron", facteur: 1.05 },
  { nom: "Vénissieux", facteur: 1 },
  { nom: "Meyzieu", facteur: 1 },
  { nom: "Givors", facteur: 0.95 },
  { nom: "Rillieux", facteur: 0.85 },
  { nom: "Oullins", facteur: 0.8 },
  { nom: "Tassin", facteur: 0.75 },
  { nom: "Villefranche", facteur: 0.7 },
] as const;
export const PILOTES = [5, 6] as const;
/** La demande attendue au-dessus de laquelle une agence vaut d'être équipée en semaine 7. */
export const SEUIL_OUVERTURE = 13;
/** En dessous, une agence perd de l'argent chaque semaine : on la ferme. */
export const SEUIL_FERMETURE = 5;
/** Au-dessus, le petit parc d'une agence pilote refuse trop de locations : on le complète. */
export const SEUIL_COMPLEMENT = 9;

interface Agence {
  rang: number;
  ouverture: number;
  valeur: number;
  capacite: number;
  fixe: number;
  /** La semaine où l'agence cesse de louer ; 14 : elle loue jusqu'au bout. */
  fermeture: number;
  /** Relais de Ferlane : plus de parc, une commission par location. */
  relais: boolean;
  /** Les taux d'utilisation des semaines 10 à 13. */
  fin: number[];
}

export type Semaine = {
  agences: number;
  locations: number;
  /** Les demandes de devis : elles suivent la publicité plus que le besoin. */
  devis: number;
  /** Les artisans repartis sans matériel : parc absent, en retard ou plein. */
  refuses: number;
  utilisation: number;
  /** Prix, nettoyage facturé et ventes associées, moins logistique et casse, par location. */
  margeLocation: number;
  retour: number;
  /** La valeur du parc détenu, en euros. */
  parc: number;
  /** Ce que la semaine a dégagé : marges, moins parc, comptoir, lancement, imprévus. */
  contribution: number;
  /** La contribution cumulée depuis le début du trimestre. */
  cumul: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget : positif, le service a fait mieux que prévu. */
  objectif: number;
  contribution: number;
  demandeReelle: number;
  /** Ce que la mesure disait de la demande quand il a fallu décider de l'extension. */
  estime: number;
  agencesMax: number;
  agencesFinal: number;
  locations: number;
  devis: number;
  utilisationFinale: number;
  margeLocation: number;
  retourFinal: number;
  /** La dépréciation du parc qui dort, passée à la clôture. */
  provision: number;
  /** La perte sur les parcs revendus en cours de trimestre. */
  reventes: number;
  parcMax: number;
  incident: number | null;
  /** L'agence où l'échafaudage a cédé. */
  lieuIncident: string;
  partenariat: boolean;
  partenariatRefuse: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const etude = d1 === 3;
  const precipite = d1 === 0;
  const semaineExtension = etude ? 10 : 7;
  const estime = estimation(chemin, graine);
  const partenariat = d5 === 2 && ferlaneAccepte(graine);
  const agences: Agence[] = [];
  const ouvrir = (rang: number, w: number, pilote: boolean) =>
    agences.push({
      rang,
      ouverture: w,
      valeur: pilote ? KIT_PILOTE : KIT_PLEIN,
      capacite: pilote ? CAPACITE_PILOTE : CAPACITE_PLEIN,
      fixe: pilote ? FIXE_PILOTE : FIXE_PLEIN,
      fermeture: 14,
      relais: false,
      fin: [],
    });
  const actives = (w: number) => agences.filter((a) => a.ouverture <= w && a.fermeture > w);

  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let reventes = 0;
  let risque = 0;
  let incident: number | null = null;
  let lieuIncident = "";
  let locationsTotal = 0;
  let devisTotal = 0;
  let agencesMax = 0;
  let parcMax = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const imprevus = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let couts = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // Le lancement : ce que la première décision ouvre, et quand.
    if (w === 4 && d1 === 0) RESEAU.forEach((_, i) => ouvrir(i, 4, false));
    if (w === 4 && d1 === 1) for (let i = 0; i < 6; i += 1) ouvrir(i, 4, false);
    if (w === 2 && d1 === 2) for (const i of PILOTES) ouvrir(i, 2, true);
    if (w === 4 && d1 === 0) couts += AGENCES * LANCEMENT_AGENCE;
    if (w === 4 && d1 === 1) couts += 6 * LANCEMENT_AGENCE;
    if (w === 2 && d1 === 2) couts += PILOTES.length * LANCEMENT_PILOTE;
    if (etude && (w === 2 || w === 9)) couts += COUTS.etude / 2;

    // L'extension : généraliser, rester, ajuster agence par agence, ou arrêter.
    if (w === semaineExtension && (d4 === 0 || d4 === 2 || d4 === 3)) {
      const presentes = actives(w);
      const attendue = (i: number) => estime * RESEAU[i]!.facteur;
      for (const a of presentes) {
        const garder = d4 === 0 || (d4 === 2 && attendue(a.rang) >= SEUIL_FERMETURE);
        if (!garder) {
          a.fermeture = w;
          reventes += a.valeur * DECOTE_REVENTE;
          couts += a.valeur * DECOTE_REVENTE;
        } else if (
          a.capacite < CAPACITE_PLEIN &&
          (d4 === 0 || attendue(a.rang) >= SEUIL_COMPLEMENT)
        ) {
          // Le petit parc de l'agence pilote est complété.
          a.valeur = KIT_PLEIN;
          a.capacite = CAPACITE_PLEIN;
          a.fixe = FIXE_PLEIN;
        }
      }
      RESEAU.forEach((_, i) => {
        if (presentes.some((a) => a.rang === i)) return;
        if (d4 === 0 || (d4 === 2 && attendue(i) >= SEUIL_OUVERTURE)) {
          ouvrir(i, w, false);
          couts += LANCEMENT_AGENCE;
        }
      });
    }

    // Le partenariat : Ferlane reprend le parc, les agences deviennent ses relais.
    if (partenariat && w === 10) {
      for (const a of actives(w)) {
        couts += a.valeur * 0.05;
        reventes += a.valeur * 0.05;
        a.valeur = 0;
        a.relais = true;
        a.fixe = 150;
      }
    }

    // Ce que chaque location rapporte, une fois payés la logistique et la casse.
    const ajuste = d3 === 1 && w >= 5;
    let prix = PRIX;
    if (d3 === 0 && w >= 5) prix *= 0.85;
    if (d5 === 0 && w >= 9) prix *= 0.85;
    let marge = prix - LOGISTIQUE + VENTES_ASSOCIEES;
    marge -= ajuste ? 8 : precipite ? CASSE + 4 : CASSE;
    if (ajuste) marge += 6; // Le nettoyage facturé quand le matériel revient sale.
    if (d3 === 2 && w >= 5) marge -= 18; // La livraison gratuite sur chantier.
    if (d5 === 1 && w >= 9) marge += 6; // Les matériaux chargés avec la location.
    if (d6 === 0 && w >= 11) marge += 8; // Le « pack chantier » : location et matériaux.

    // La part des clients qui reviennent louer.
    let retour = RETOUR_DEPART;
    if (ajuste) retour += 0.12;
    if (d3 === 0 && w >= 5) retour -= 0.03;
    if (d5 === 1 && w >= 9) retour += 0.05;
    if (d6 === 0 && w >= 11) retour += d2 === 0 ? 0.2 : 0.1;
    if (incident !== null && w >= incident) retour -= 0.08;

    // Ce qui pousse ou freine la demande, toutes agences confondues.
    let multiple = n.demande * (1 + 0.8 * (retour - RETOUR_DEPART));
    if (d3 === 0 && w >= 5) multiple *= 1.25;
    if (ajuste) multiple *= 1.1; // Le forfait demi-journée.
    if (d3 === 2 && w >= 5) multiple *= 1.15;
    if (w >= 9) {
      // Ferlane baisse ses prix de 15 % autour des agences qui louent.
      if (d5 === 1) multiple *= 0.95;
      else if (d5 !== 0 && !(partenariat && w >= 10)) multiple *= 0.8;
    }
    if (d6 === 1 && w >= 11) multiple *= 1.08;
    if (incident !== null && w >= incident && w < incident + 3) multiple *= 0.85;
    let capaciteImprevu = 1;
    let parAgence = 0;
    for (const a of imprevus) {
      multiple *= a.imprevu.effet.demande ?? 1;
      capaciteImprevu *= a.imprevu.effet.capacite ?? 1;
      if (a.semaine === w) parAgence += a.imprevu.effet.parAgence ?? 0;
    }
    let devisMultiple = 2.4;
    if (d2 === 1 && w >= 3) devisMultiple *= 1.3; // Les agences relancent les devis.
    if (d3 === 0 && w >= 5) devisMultiple *= 1.4;
    if (d3 === 2 && w >= 5) devisMultiple *= 1.3;
    if (d6 === 1 && w >= 11) devisMultiple *= 2.5;

    // Agence par agence : la demande, ce que le parc peut servir, ce qu'il coûte.
    let locations = 0;
    let devis = 0;
    let refuses = 0;
    let capaciteNominale = 0;
    let parc = 0;
    let margeSemaine = 0;
    let coutsAgences = 0;
    let nonControlees = 0;
    const ouvertes = actives(w);
    for (const a of ouvertes) {
      const anciennete = w - a.ouverture;
      const montee = anciennete === 0 ? 0.5 : anciennete === 1 ? 0.75 : 1;
      const demande = h.demande * RESEAU[a.rang]!.facteur * montee * multiple;
      // Le matériel rendu en retard bloque la location suivante.
      const retards = a.relais ? 1 : ajuste ? 0.95 : precipite ? 0.7 : 0.75;
      const servies = Math.min(demande, a.capacite * retards * capaciteImprevu);
      locations += servies;
      devis += demande * devisMultiple;
      refuses += demande - servies;
      capaciteNominale += a.capacite;
      if (a.relais) {
        margeSemaine += servies * (30 + VENTES_ASSOCIEES);
      } else {
        margeSemaine += servies * marge;
        if (!ajuste) nonControlees += servies;
        if (w >= 10) a.fin.push(servies / a.capacite);
      }
      parc += a.valeur;
      coutsAgences += a.fixe + a.valeur * COUT_PARC + parAgence;
    }
    agencesMax = Math.max(agencesMax, ouvertes.length);
    parcMax = Math.max(parcMax, parc);

    // L'échafaudage reloué sans contrôle : le risque grandit avec chaque location.
    risque += 0.0009 * nonControlees;
    if (incident === null && 1 - Math.exp(-risque) > h.uIncident) {
      // L'accident arrive la semaine suivante ; trop tard, il tombe hors du trimestre.
      incident = w + 1 <= SEMAINES ? w + 1 : null;
      if (incident === null) risque = -Infinity;
      else lieuIncident = RESEAU[ouvertes[0]!.rang]!.nom;
    }
    if (incident === w) couts += COUTS.incident;

    // Les dépenses ponctuelles.
    if (d2 === 0 && w === 3) couts += COUTS.suivi;
    if (d3 === 1 && w === 5) couts += COUTS.ajustement;
    if (d5 === 1 && w === 9) couts += COUTS.proximite;
    if (d6 === 0 && w === 11) couts += COUTS.relance;
    if (d6 === 1 && w === 11) couts += COUTS.emailing;

    const contribution = margeSemaine - coutsAgences - couts;
    cumul += contribution;
    locationsTotal += locations;
    devisTotal += devis;
    semaines.push({
      agences: ouvertes.length,
      locations,
      devis,
      refuses,
      utilisation: capaciteNominale ? locations / capaciteNominale : 0,
      margeLocation: locations ? margeSemaine / locations : ouvertes.length ? marge : 0,
      retour: ouvertes.length ? retour : 0,
      parc,
      contribution,
      cumul,
    });
  }

  // La clôture : le parc qui dort est ramené à sa valeur de revente.
  let provision = 0;
  for (const a of agences) {
    if (a.fermeture <= SEMAINES || a.relais || !a.fin.length) continue;
    const u = a.fin.reduce((x, y) => x + y, 0) / a.fin.length;
    provision += a.valeur * DECOTE_CLOTURE * Math.max(0, 1 - u / SEUIL_UTILISATION);
  }
  const derniere = semaines[SEMAINES]!;
  const fin = { ...derniere, contribution: derniere.contribution - provision };
  fin.cumul = derniere.cumul - provision;
  semaines[SEMAINES] = fin;
  const pleines = semaines.slice(1) as Semaine[];
  const contribution = pleines.reduce((x, s) => x + s.contribution, 0);
  const avecLocations = pleines.filter((s) => s.locations > 0);
  const margeMoyenne =
    avecLocations.reduce((x, s) => x + s.margeLocation * s.locations, 0) /
    Math.max(1, locationsTotal);

  return {
    semaines,
    objectif: contribution - BUDGET,
    contribution,
    demandeReelle: h.demande,
    estime,
    agencesMax,
    agencesFinal: fin.agences,
    locations: locationsTotal,
    devis: devisTotal,
    utilisationFinale: pleines.slice(9).reduce((x, s) => x + s.utilisation, 0) / (SEMAINES - 9),
    margeLocation: margeMoyenne,
    retourFinal: fin.retour,
    provision,
    reventes,
    parcMax,
    incident,
    lieuIncident,
    partenariat,
    partenariatRefuse: d5 === 2 && !partenariat,
  };
}

/** Ce qui s'est passé pendant des semaines : l'étude, l'extension, l'incident, Ferlane, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const semaineExtension = chemin[D.lancement] === 3 ? 10 : 7;
  return {
    etude: chemin[D.lancement] === 3 && dans(9),
    extension: chemin[D.extension] === 2 && dans(semaineExtension),
    incident: t.incident !== null && dans(t.incident),
    partenariat: t.partenariat && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
    trimestre: t,
  };
}

export interface LectureService {
  locations: number | null;
  utilisation: number | null;
  margeLocation: number | null;
  retour: number | null;
  cumul: number | null;
  agences: number | null;
  devis: number | null;
  refuses: number | null;
  parc: number | null;
}

/** Ce que Chloé lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureService {
  if (semaine === 0) {
    return {
      locations: 0,
      utilisation: null,
      margeLocation: null,
      retour: null,
      cumul: 0,
      agences: 0,
      devis: 0,
      refuses: 0,
      parc: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  const loue = s.agences > 0;
  return {
    locations: s.locations,
    utilisation: loue ? s.utilisation : null,
    margeLocation: loue ? s.margeLocation : null,
    retour: loue ? s.retour : null,
    cumul: s.cumul,
    agences: s.agences,
    devis: s.devis,
    refuses: s.refuses,
    parc: s.parc,
  };
}
