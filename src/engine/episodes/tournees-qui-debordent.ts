/**
 * LES TOURNÉES QUI DÉBORDENT — le modèle du transport de la région lyonnaise.
 *
 * Huit chauffeurs salariés, huit porteurs équipés d'une grue, un transporteur
 * sous-traitant, et quelque deux cent cinquante livraisons sur chantier par
 * semaine. Treize semaines, six décisions. Les livraisons arrivent de plus en
 * plus souvent en retard, le coût par livraison monte, les chauffeurs font des
 * heures supplémentaires, et le sous-traitant augmente ses tarifs. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA TOURNÉE SE FAIT AU BUREAU, PAS SUR LA ROUTE. Le coût d'une livraison,
 *     c'est le coût d'une tournée divisé par le nombre d'arrêts qu'elle fait.
 *     Les commerciaux promettent des heures précises à presque tous les
 *     clients : les tournées zigzaguent d'un bout à l'autre de
 *     l'agglomération pour tenir des créneaux, font cinq arrêts au lieu de
 *     sept, et une partie des promesses est intenable dès qu'elle est faite.
 *     Des créneaux réalistes (une demi-journée, sauf vraie contrainte de
 *     chantier) et des livraisons regroupées par chantier et par secteur
 *     rendent à la flotte la capacité qu'elle croit lui manquer.
 *   · UNE LIVRAISON RATÉE COÛTE DEUX FOIS. Un retard fait attendre une équipe
 *     sur le chantier ; une livraison ratée (personne pour réceptionner, grue
 *     du chantier occupée, accès fermé) se refait le lendemain et charge une
 *     tournée de plus. Les retards nourrissent la charge, la charge nourrit
 *     les retards, et un grand compte excédé finit par commander ailleurs.
 *   · LA CAPACITÉ QU'ON ACHÈTE AU MOIS COÛTE PLUS QUE CELLE QU'ON ORGANISE.
 *     Un arrêt de plus dans une tournée existante coûte une dizaine d'euros ;
 *     une livraison sous-traitée en coûte cent, un camion loué trois mille par
 *     semaine. La sous-traitance est faite pour absorber les pics, pas pour
 *     porter un volume permanent ; un camion de plus ne sert à rien tant que
 *     les tournées sont à moitié pleines. Et les heures supplémentaires, bon
 *     marché à l'heure, se paient en fatigue : des retards en fin de journée,
 *     des absences, et un accident qui devient probable.
 *
 * Le trimestre est jugé en euros : l'écart au budget logistique de la région,
 * en comptant ce que coûtent les retards, les livraisons ratées, les chantiers
 * arrêtés et les clients perdus. Positif, la région est sous le budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CHAUFFEURS = 8;
/** Une tournée par camion et par jour ouvré. */
export const TOURNEES_PAR_CAMION = 5;
/** Livraisons commandées par semaine, hors pics et hors relivraisons. */
export const DEMANDE = 244;
/** Arrêts par tournée aujourd'hui, avec des créneaux à l'heure pour presque tous les clients. */
export const ARRETS_DEPART = 5.4;
/** Ce que les tournées faisaient il y a deux ans, avec des créneaux à la demi-journée. */
export const ARRETS_POSSIBLES = 7.2;
/** Le pic des chantiers de printemps. */
export const PIC = { de: 8, a: 10 } as const;
/** Les deux dernières semaines : les chantiers veulent être livrés avant les congés. */
export const FIN = { de: 12, hausse: 0.2 } as const;
export const OBJECTIF_RETARD = 0.08;
/** Le coût logistique par livraison que le budget suppose. */
export const BUDGET_PAR_LIVRAISON = 92;
/** Le budget logistique du trimestre, pertes liées aux retards comprises. */
export const BUDGET = 350000;
/** Les heures supplémentaires que la direction tolère sur le trimestre. */
export const PLAFOND_HEURES_SUP = 600;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les tournées de la semaine partent sans être revues. */
export const PERTE_PAR_JOUR = 1500;

/** Huit chauffeurs et huit porteurs : salaires chargés, location longue durée, assurance. */
const FIXE = 12000;
/** Ce que coûte une tournée qui roule : carburant, péages, usure. */
const PAR_TOURNEE = 140;
const PAR_ARRET = 9;
const HEURE_SUP = 42;
/** Un arrêt ajouté en fin de tournée, en heures supplémentaires. */
const HEURES_PAR_ARRET_SUP = 1.5;
/** Le volume que le sous-traitant reçoit chaque semaine, par habitude, quoi qu'il arrive. */
const VOLUME_HABITUEL = 30;
/** Ce que le sous-traitant peut prendre au pied levé, en plus de son volume. */
const SPOT_MAX = 50;
/** Au printemps, tous les négoces ont le même pic : le sous-traitant, saturé, prend peu au pied levé. */
const SPOT_PIC = 25;
/** La capacité réservée d'avance pour le pic, garantie. */
const RESERVE = 45;
export const TARIFS = {
  /** Le sous-traitant, par livraison, avant et après sa hausse de 12 %. */
  avant: 95,
  apres: 106,
  /** Le contrat de pics : volume quotidien repris en interne, capacité garantie dans les pics. */
  pics: 99,
  /** Ce qu'il facture une livraison demandée la veille pour le lendemain. */
  spot: 122,
  /** La réservation de capacité pour le pic, par livraison réservée, payée même si elle ne sert pas. */
  reservation: 25,
} as const;
/** La semaine où la hausse du sous-traitant s'applique. */
export const SEMAINE_HAUSSE = 5;
export const COUTS = {
  analyse: 600,
  /** Les gestes pour les clients qui tenaient à leur heure précise. */
  gestesCreneaux: 150,
  /** Un camion loué avec un chauffeur intérimaire, par semaine. */
  camion: 2900,
  /** Un chauffeur en CDD et un camion loué, par semaine, et le recrutement. */
  cdd: 2700,
  recrutement: 1500,
  secteurs: 1200,
  /** Les artisans qui voulaient être livrés le lendemain et vont ailleurs. */
  ventesPerduesSecteurs: 250,
  frais: 350,
  ventesPerduesMinimum: 450,
  prelivraison: 400,
  /** La prime de pic : 150 € par chauffeur et par semaine. */
  primePic: 1200,
  confirmation: 350,
  ventesPerduesFacturation: 700,
  /** Le samedi : heures majorées et tournées. */
  samedi: 3400,
  calendrier: 300,
} as const;
/** Ce que coûtent les retards, en pertes. */
export const PERTES = {
  /** Une livraison en retard : une équipe qui attend, un geste, un client qui s'en souvient. */
  retard: 40,
  /** Une livraison ratée : le chantier arrêté, en plus de la relivraison. */
  ratee: 160,
  /** Une livraison reportée à la semaine suivante. */
  reportee: 80,
  /** Une commande annulée faute d'être livrée : la marge part chez un concurrent. */
  annulee: 90,
  /** Ce qui reste à livrer à la fin du trimestre. */
  fin: 150,
  accident: 6000,
  /** La marge que Dumontel Bâtiment laissait chaque semaine. */
  grandCompte: 2200,
} as const;
/** Les livraisons de Dumontel Bâtiment, par semaine. */
const LIVRAISONS_GRAND_COMPTE = 14;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  tournees: 0,
  soustraitant: 1,
  regroupement: 2,
  pic: 3,
  ratees: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 3, 3, 3, 3] as const;

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
  effet: { demande?: number; capacite?: number; arrets?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grue",
    titre: "Une grue de camion en panne",
    de: "Atelier poids lourds",
    role: "Prestataire",
    texte:
      "Le vérin de la grue du porteur n° 6 a lâché : le camion est immobilisé deux semaines, le temps de recevoir la pièce.",
    duree: 2,
    effet: { capacite: 0.88 },
  },
  {
    id: "neige",
    titre: "Épisode neigeux",
    de: "Awa Kouyaté",
    role: "Planificatrice transport",
    texte:
      "Neige sur les monts du Lyonnais et verglas le matin : les chantiers en hauteur sont inaccessibles, et chaque tournée perd une heure.",
    duree: 1,
    effet: { capacite: 0.9, arrets: 0.9 },
  },
  {
    id: "rocade",
    titre: "Travaux sur la rocade est",
    de: "Awa Kouyaté",
    role: "Planificatrice transport",
    texte:
      "La rocade est passe sur une voie pour deux semaines de travaux : les tournées de l'est lyonnais rallongent de trois quarts d'heure.",
    duree: 2,
    effet: { arrets: 0.93 },
  },
  {
    id: "ecole",
    titre: "Un chantier de groupe scolaire",
    de: "Hubert Lhermet",
    role: "Directeur commercial",
    texte:
      "On a gagné le lot gros œuvre d'un groupe scolaire à Décines : trente livraisons de plus cette semaine, toutes avec grue.",
    duree: 1,
    effet: { demande: 1.12 },
  },
  {
    id: "gastro",
    titre: "Épidémie de gastro-entérite",
    de: "Ressources humaines",
    role: "Région lyonnaise",
    texte:
      "La gastro-entérite fait le tour du dépôt : deux chauffeurs absents en moyenne pendant deux semaines.",
    duree: 2,
    effet: { capacite: 0.85 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  absence: number;
  /** Un accident arrive-t-il cette semaine ? Comparé à un risque qui suit la fatigue. */
  uAccident: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'ampleur du pic de printemps : de +12 % à +45 % de livraisons, semaines 8 à 10. */
  pic: number;
  /** Les grands chantiers acceptent-ils d'être livrés en avance ? */
  uPrelivraison: number;
  /** Dumontel Bâtiment part-il, excédé par les retards ? */
  uGrandCompte: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000099 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.12, Math.max(0.9, 1 + 0.04 * gauss(r))),
      absence: Math.min(1.6, Math.max(0.5, 1 + 0.2 * gauss(r))),
      uAccident: r(),
    });
  }
  // Un pic le plus souvent moyen, parfois très fort : la queue est à droite.
  const pic = 0.12 + 0.33 * Math.pow(r(), 1.6);
  const uPrelivraison = r();
  const uGrandCompte = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, pic, uPrelivraison, uGrandCompte, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Six fois sur dix, les grands chantiers acceptent d'être livrés une à deux semaines en avance. */
export const prelivraisonAcceptee = (chemin: readonly number[], graine: number) =>
  chemin[D.pic] === 2 && hasard(graine).uPrelivraison < 0.6;

/**
 * DUMONTEL BÂTIMENT PART-IL ?
 *
 * Le grand compte a prévenu : encore un trimestre comme le dernier, et il
 * change de négoce. Sa décision se lit en fin de semaine 6, sur la part des
 * livraisons arrivées en retard depuis le début du trimestre. Sous 7 %, il
 * reste ; à 20 %, il part plus d'une fois sur deux.
 */
export const risqueGrandCompte = (retardMoyen: number) =>
  Math.min(0.75, Math.max(0, (retardMoyen - 0.07) * 4.5));

/** Le risque d'accident d'une semaine, lu sur la fatigue des chauffeurs. */
export const risqueAccident = (fatigue: number) => 0.1 * Math.max(0, fatigue - 0.45);

export type Semaine = {
  /** Part des livraisons arrivées en retard (ou reportées) dans la semaine. */
  retard: number;
  /** Coût logistique de la semaine rapporté aux livraisons faites. */
  coutLivraison: number;
  arrets: number;
  /** Heures supplémentaires des chauffeurs dans la semaine. */
  heuresSup: number;
  /** Livraisons faites dans la semaine. */
  livraisons: number;
  /** Dont confiées au sous-traitant. */
  sousTraitees: number;
  ratees: number;
  reportees: number;
  /** Coût logistique cumulé depuis le début du trimestre. */
  logistique: number;
  /** Pertes cumulées : retards, livraisons ratées, chantiers arrêtés, clients perdus. */
  pertes: number;
  /** Ce que la semaine a coûté, logistique et pertes. */
  cout: number;
  fatigue: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget logistique, pertes comprises : positif, la région est sous le budget. */
  objectif: number;
  logistique: number;
  pertes: number;
  /** La semaine de l'accident, 0 s'il n'y en a pas eu. */
  semaineAccident: number;
  grandComptePart: boolean;
  prelivraisonAcceptee: boolean;
  pic: number;
  retardMoyen: number;
  coutParLivraison: number;
  heuresSupTotal: number;
  arretsMoyens: number;
  partSousTraitance: number;
  fatigueFinale: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const prelivree = prelivraisonAcceptee(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let fatigue = 0.55;
  let relivraisons = 0;
  let reportees = 0;
  let logistique = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let pertes = 0;
  let semaineAccident = 0;
  let grandComptePart = false;
  let retardsCumul = 0;
  let livraisonsCumul = 0;
  let sousTraiteesCumul = 0;
  let heuresSupTotal = 0;
  let arretsCumul = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const pic = w >= PIC.de && w <= PIC.a;
    const fin = w >= FIN.de;
    let perte = w === 1 ? enquete : 0;
    let depense = FIXE;

    // LES ARRÊTS PAR TOURNÉE : ce que les créneaux et le regroupement permettent.
    let arrets = ARRETS_DEPART;
    if (d1 === 1) arrets += w === 2 ? 0.3 : w >= 3 ? 0.55 : 0;
    if (d3 === 1) arrets += w === 6 ? 0.15 : w >= 7 ? 0.3 : 0;
    if (d3 === 0 && w >= 6) arrets -= 0.1; // L'express promis attire les petites commandes.
    // Avant les congés, les commerciaux promettent une date à chacun : sans calendrier, les tournées zigzaguent.
    if (fin) arrets += d6 === 1 ? 0.3 : -0.4;
    for (const a of actifs) arrets *= a.imprevu.effet.arrets ?? 1;
    arrets = Math.min(ARRETS_POSSIBLES + 0.3, arrets);

    // CE QU'IL Y A À LIVRER : les commandes, les relivraisons, et ce qui attend.
    let demande = DEMANDE * n.demande;
    if (pic) demande *= 1 + h.pic * (prelivree ? 0.6 : 1);
    if (prelivree && (w === 6 || w === 7)) demande += DEMANDE * h.pic * 0.6;
    if (fin) demande *= 1 + FIN.hausse;
    if (d3 === 1) demande *= w === 6 ? 0.98 : w >= 7 ? 0.95 : 1;
    if (d3 === 2 && w >= 6) demande *= 0.965;
    if (d3 === 0 && w >= 6) demande *= 1.015;
    if (grandComptePart && w >= 7) demande -= LIVRAISONS_GRAND_COMPTE;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;
    const aLivrer = demande + relivraisons + reportees;

    // LES TOURNÉES DISPONIBLES : les chauffeurs présents, et ce qu'on a ajouté.
    const presence = 1 - 0.1 * Math.max(0, fatigue - 0.35) * n.absence;
    let propres = CHAUFFEURS * TOURNEES_PAR_CAMION * presence;
    for (const a of actifs) propres *= a.imprevu.effet.capacite ?? 1;
    if (semaineAccident && w > semaineAccident && w <= semaineAccident + 3) {
      propres -= TOURNEES_PAR_CAMION; // Le camion au garage, le chauffeur en arrêt.
    }
    let interim = 0;
    if (d1 === 0 && w >= 2) interim += TOURNEES_PAR_CAMION;
    if (d4 === 0 && pic) interim += 2 * TOURNEES_PAR_CAMION;
    if (d2 === 2 && w >= SEMAINE_HAUSSE) propres += TOURNEES_PAR_CAMION;
    const tournees = propres + interim;
    const capacite = tournees * arrets;

    // LA RÉPARTITION : le sous-traitant d'abord (l'habitude), puis la flotte, puis le reste.
    const tarif = w < SEMAINE_HAUSSE ? TARIFS.avant : d2 === 1 ? TARIFS.pics : TARIFS.apres;
    let habituel = VOLUME_HABITUEL;
    if (w >= SEMAINE_HAUSSE && d2 === 1) habituel = 0;
    if (w >= SEMAINE_HAUSSE && d2 === 2) habituel = 10;
    const base = Math.min(aLivrer, habituel);
    let reste = aLivrer - base;
    const interne = Math.min(reste, capacite);
    reste -= interne;
    let reserve = 0;
    if (d4 === 1 && pic) {
      reserve = Math.min(reste, RESERVE);
      reste -= reserve;
      depense += RESERVE * TARIFS.reservation + reserve * tarif;
    }
    let samedi = 0;
    if (d6 === 0 && fin) {
      samedi = Math.min(reste, CHAUFFEURS * arrets);
      reste -= samedi;
      depense += COUTS.samedi;
    }
    // Les heures supplémentaires : un arrêt de plus en fin de tournée, ou presque.
    let parTournee = pic ? 1.15 : 1;
    if (d1 === 2 && w >= 2) parTournee = 0;
    if (d4 === 3 && pic) parTournee = 1.5;
    if (d5 === 2 && w >= 10) parTournee += 0.4;
    if ((d6 === 1 || d6 === 2) && fin) parTournee = 0;
    const sup = Math.min(reste, parTournee * propres);
    reste -= sup;
    // Au-delà d'un arrêt de plus, la tournée finit dans les bouchons du soir, sur des chantiers fermés.
    const supLongues = Math.max(0, sup - propres);
    // Le sous-traitant, au pied levé : au tarif du jour, ou au contrat quand il y en a un.
    const contrat =
      (d1 === 2 && w >= 2) ||
      ((d6 === 1 || d6 === 2) && fin) ||
      (d2 === 1 && w >= SEMAINE_HAUSSE && (pic || fin));
    const spot = Math.min(reste, pic ? SPOT_PIC : contrat ? 120 : SPOT_MAX);
    reste -= spot;
    const nonLivrees = reste;
    // Quatre commandes sur dix qu'on ne peut pas livrer sont annulées : l'artisan se sert ailleurs.
    const annulees = 0.4 * nonLivrees;
    const sousTraitees = base + reserve + spot;
    const livrees = interne + reserve + samedi + sup + base + spot;

    // LES HEURES SUPPLÉMENTAIRES : les arrêts ajoutés, et l'attente des créneaux intenables.
    let attente = 2.5;
    if (d1 === 1) attente = w === 2 ? 1.8 : w >= 3 ? 1.2 : 2.5;
    if (d3 === 1 && w >= 7) attente -= 0.3;
    if (d3 === 0 && w >= 6) attente += 0.8; // La tournée express de l'après-midi.
    let heuresSup =
      sup * HEURES_PAR_ARRET_SUP + supLongues * 0.7 + CHAUFFEURS * Math.max(0, attente);
    if (samedi > 0) heuresSup += CHAUFFEURS * 8; // Le samedi : les huit chauffeurs, une journée.

    // LES RETARDS : les créneaux intenables, la fatigue, et qui livre.
    let creneaux = 0.1;
    if (d1 === 1) creneaux = w === 2 ? 0.075 : w >= 3 ? 0.06 : 0.1;
    if (d3 === 1 && w >= 7) creneaux -= 0.01;
    if (d3 === 0 && w >= 6) creneaux += 0.005;
    if (fin && d6 !== 1) creneaux += 0.02;
    const rInterne = creneaux + 0.07 * Math.max(0, fatigue - 0.4);
    const rSousTraitant = d2 === 3 && w >= SEMAINE_HAUSSE ? 0.11 : 0.15;
    const partInterim = tournees > 0 ? interim / tournees : 0;
    const retards =
      interne * ((1 - partInterim) * rInterne + partInterim * 0.18) +
      sup * (rInterne + 0.15) +
      supLongues * 0.1 +
      samedi * rInterne +
      base * rSousTraitant +
      reserve * 0.12 +
      spot * (contrat ? rSousTraitant : 0.2) +
      nonLivrees;
    const retard = retards / Math.max(1, livrees + nonLivrees);

    // LES LIVRAISONS RATÉES : elles se refont la semaine suivante.
    let echec = 0.025;
    let parRetard = 0.3;
    if (d5 === 1 && w >= 10) {
      echec = 0.01;
      parRetard = 0.15;
    }
    if (d5 === 0 && w >= 10) echec = 0.018;
    // Le samedi, un chantier sur cinq est fermé : la livraison est à refaire.
    let ratees = (retards - nonLivrees) * parRetard + livrees * echec + samedi * 0.2;
    ratees = Math.max(0, ratees);

    // Ce que la semaine coûte en logistique.
    const roulees = interne / Math.max(0.1, arrets);
    depense += roulees * PAR_TOURNEE + (interne + sup) * PAR_ARRET + heuresSup * HEURE_SUP;
    depense += base * tarif + spot * (contrat ? tarif : TARIFS.spot);
    if (d1 === 0 && w >= 2) depense += COUTS.camion;
    if (d1 === 1 && w === 1) depense += COUTS.analyse;
    if (d2 === 2 && w >= SEMAINE_HAUSSE) depense += COUTS.cdd;
    if (d2 === 2 && w === SEMAINE_HAUSSE - 1) depense += COUTS.recrutement;
    if (d3 === 1 && w === 6) depense += COUTS.secteurs;
    if (d3 === 2 && w >= 6) depense -= COUTS.frais;
    if (d4 === 0 && pic) depense += 2 * COUTS.camion;
    if (d4 === 2 && w === 7) depense += COUTS.prelivraison;
    if (d4 === 3 && pic) depense += COUTS.primePic;
    if (d6 === 1 && w === FIN.de) depense += COUTS.calendrier;
    if (d5 === 1 && w >= 10) depense += COUTS.confirmation;

    // Ce que la semaine coûte en pertes.
    perte += (retards - nonLivrees) * PERTES.retard + nonLivrees * PERTES.reportee;
    perte += annulees * PERTES.annulee;
    perte += ratees * (d5 === 2 && w >= 10 ? 0.65 : 1) * PERTES.ratee;
    if (d1 === 1 && w >= 2) perte += COUTS.gestesCreneaux;
    if (d3 === 1 && w >= 7) perte += COUTS.ventesPerduesSecteurs;
    if (d3 === 2 && w >= 6) perte += COUTS.ventesPerduesMinimum;
    if (d5 === 0 && w >= 10) perte += COUTS.ventesPerduesFacturation - ratees * 90;
    if (grandComptePart && w >= 7) perte += PERTES.grandCompte;

    // LA FATIGUE : les heures supplémentaires, et ce qui la soulage.
    fatigue += 0.0095 * (heuresSup / CHAUFFEURS) - 0.06;
    if ((d6 === 1 || d6 === 2) && w === FIN.de) fatigue -= 0.05;
    fatigue = borne(fatigue, 0.1, 1);
    if (!semaineAccident && w >= 2 && n.uAccident < risqueAccident(fatigue)) {
      semaineAccident = w;
      perte += PERTES.accident;
    }

    retardsCumul += retards;
    livraisonsCumul += livrees;
    sousTraiteesCumul += sousTraitees;
    heuresSupTotal += heuresSup;
    arretsCumul += arrets;
    // Dumontel Bâtiment décide en fin de semaine 6, sur les retards qu'il a vécus.
    if (w === 6 && h.uGrandCompte < risqueGrandCompte(retardsCumul / livraisonsCumul)) {
      grandComptePart = true;
    }
    if (w === SEMAINES) perte += (nonLivrees - annulees + ratees) * PERTES.fin;

    logistique += depense;
    pertes += perte;
    relivraisons = ratees;
    reportees = nonLivrees - annulees;

    semaines.push({
      retard,
      coutLivraison: depense / Math.max(1, livrees),
      arrets,
      heuresSup,
      livraisons: livrees,
      sousTraitees,
      ratees,
      reportees: nonLivrees,
      logistique,
      pertes,
      cout: depense + perte,
      fatigue,
    });
  }

  return {
    semaines,
    objectif: BUDGET - logistique - pertes,
    logistique,
    pertes,
    semaineAccident,
    grandComptePart,
    prelivraisonAcceptee: prelivree,
    pic: h.pic,
    retardMoyen: retardsCumul / livraisonsCumul,
    coutParLivraison: logistique / livraisonsCumul,
    heuresSupTotal,
    arretsMoyens: arretsCumul / SEMAINES,
    partSousTraitance: sousTraiteesCumul / livraisonsCumul,
    fatigueFinale: fatigue,
  };
}

/** Ce qui s'est passé pendant des semaines : accident, grand compte, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    accident: dans(t.semaineAccident) ? t.semaineAccident : 0,
    grandComptePart: t.grandComptePart && dans(7),
    grandCompteReste: !t.grandComptePart && dans(7),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureTransport {
  retard: number | null;
  coutLivraison: number | null;
  arrets: number | null;
  heuresSup: number | null;
  cout: number | null;
  budgetADate: number | null;
  sousTraitees: number | null;
  ratees: number | null;
  livraisons: number | null;
  /** 1 si Dumontel Bâtiment est parti : le tableau de bord ne l'affiche pas, les messages le lisent. */
  grandCompte: number | null;
}

/** Ce que Farid lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureTransport {
  if (semaine === 0) {
    return {
      retard: 0.13,
      coutLivraison: 98,
      arrets: ARRETS_DEPART,
      heuresSup: 42,
      cout: 0,
      budgetADate: 0,
      sousTraitees: 33,
      ratees: 16,
      livraisons: 255,
      grandCompte: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    retard: s.retard,
    coutLivraison: s.coutLivraison,
    arrets: s.arrets,
    heuresSup: s.heuresSup,
    cout: s.logistique + s.pertes,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    sousTraitees: s.sousTraitees,
    ratees: s.ratees,
    livraisons: s.livraisons,
    grandCompte: t.grandComptePart && semaine >= 7 ? 1 : 0,
  };
}
