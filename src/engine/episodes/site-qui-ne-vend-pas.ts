/**
 * LE SITE QUI NE VEND PAS — le modèle du commerce en ligne pour les artisans.
 *
 * Un site de commande en ligne ouvert depuis six mois, quatorze agences qui le
 * regardent de travers, treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · L'ENTONNOIR SE MULTIPLIE. Une commande, c'est une visite d'artisan, PUIS
 *     un compte ouvert qui montre les prix pro, PUIS un panier, PUIS une
 *     commande validée. Les étapes se multiplient : doubler le taux d'une
 *     étape bloquante double la valeur de TOUTES les visites, quand acheter
 *     des visites n'ajoute que des visiteurs — et ceux que la publicité large
 *     amène sont surtout des particuliers, qui ne peuvent pas commander sur un
 *     site réservé aux professionnels. Corriger les fuites rapporte plus que
 *     remplir l'entonnoir, et rend chaque visite suivante plus rentable.
 *   · CEUX QUI PERDENT À VOTRE SUCCÈS LE FREINENT. Les comptoirs sont payés
 *     sur le chiffre de leur agence : chaque commande en ligne sort de leur
 *     prime. Ils ne recommandent pas le site, et valident lentement les
 *     ouvertures de compte. Une note de la direction n'y change rien ;
 *     attribuer la vente en ligne à l'agence du client change tout — et le
 *     vaut d'autant plus que l'entonnoir convertit ceux qu'elles envoient.
 *     Contourner les agences par une remise achète des commandes qu'elles
 *     auraient faites au comptoir, et les braque.
 *   · TESTER AVANT DE GÉNÉRALISER. Un nouveau tunnel de commande promet
 *     beaucoup et peut casser quelque chose qu'on ne voit pas. Mis en ligne
 *     pour tous, sans groupe témoin, une baisse passe pour la saison et dure ;
 *     testé sur la moitié des visiteurs, il est jugé en deux semaines. Le
 *     test est le meilleur pari ; le petit correctif certain, le plus sûr.
 *
 * Le trimestre est jugé en euros : la marge des ventes en ligne et celle que
 * les retraits ramènent au comptoir, moins la publicité, le développement,
 * les remises et les primes, en écart au budget du canal.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const AGENCES = 14;
/** Les visites qui viennent seules (moteurs de recherche, habitués), par semaine. */
export const VISITES_NATURELLES = 5200;
/** Les visites que des agences convaincues envoient au mieux, par semaine. */
export const VISITES_AGENCES = 2600;
/** La part de professionnels parmi les visites naturelles, envoyées par les agences, payantes. */
export const PART_PRO = { naturelles: 0.65, agences: 0.95, payantes: 0.22, ciblees: 0.8 } as const;
/** Le coût d'une visite payante, en euros. */
export const COUT_VISITE = 0.9;
/** La publicité au départ, par semaine. */
export const PUBLICITE_DEPART = 2000;
/** La publicité ciblée sur les comptes inscrits, par semaine. */
export const PUBLICITE_CIBLEE = 600;
/** Le panier moyen et sa marge. */
export const PANIER = 420;
export const MARGE_COMMANDE = 100;
/** Ce qu'un retrait en agence ramène au comptoir en achats d'appoint, en marge. */
export const MARGE_APPOINT = 55;
/** L'entonnoir au départ : compte ouvert et prix pro visibles, panier, commande validée. */
export const ENTONNOIR_DEPART = { compte: 0.3, panier: 0.1, commande: 0.38 } as const;
/** Ce que l'entonnoir devient quand le compte s'ouvre avec le SIRET et que les prix pro s'affichent. */
export const ENTONNOIR_CORRIGE = { compte: 0.46, panier: 0.108 } as const;
/** L'adhésion des agences au départ : la part qui recommande le site. */
export const ADHESION_DEPART = 0.15;
export const OBJECTIF_CONVERSION = 0.015;
/** Les commandes en ligne par semaine que le budget suppose. */
export const COMMANDES_BUDGET = 130;
/** Le budget de contribution du canal sur le trimestre. */
export const BUDGET = 100000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des commandes de chantier partent ailleurs. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  entonnoir: 0,
  agences: 1,
  tunnel: 2,
  publicite: 3,
  printemps: 4,
  comite: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

export const COUTS = {
  correctifs: 6000,
  refonteAcompte: 15000,
  refonteSolde: 15000,
  /** La prime des comptoirs sur la vente en ligne attribuée : 2 % du chiffre d'affaires. */
  attribution: 0.02,
  /** La remise de l'e-mailing direct, sur les commandes des clients qui l'ont reçu. */
  remiseDirecte: 0.05,
  emailing: 1500,
  tunnel: 3500,
  test: 4000,
  stock: 2500,
  gestesTunnel: 2000,
  relance: 1500,
  /** La remise de printemps sur toutes les commandes en ligne. */
  remisePrintemps: 0.08,
  /** La livraison offerte, par commande livrée sur chantier. */
  livraison: 22,
  retrait: 2000,
  avoirRetrait: 2500,
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
  effet: { visites?: number; payantes?: number; panier?: number; commande?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "hebergeur",
    titre: "Panne chez l'hébergeur du site",
    de: "Ousmane Diop",
    role: "Chef de projet web",
    texte:
      "L'hébergeur a coupé le site un jour et demi, en pleine semaine : les artisans ont trouvé une page d'erreur.",
    duree: 1,
    effet: { visites: 0.75 },
  },
  {
    id: "mots-cles",
    titre: "Flambée du prix des mots-clés",
    de: "Valentin Chabert",
    role: "Prestataire publicitaire",
    texte:
      "Deux négociants nationaux enchérissent sur les mêmes mots-clés : à budget égal, la publicité amène 40 % de visites en moins pendant deux semaines.",
    duree: 2,
    effet: { payantes: 0.6 },
  },
  {
    id: "tarifs",
    titre: "Erreur dans l'import des tarifs",
    de: "Zoé Bouzid",
    role: "Contrôle de gestion",
    texte:
      "L'import des tarifs d'un fournisseur a doublé le prix de 300 références pendant une semaine. Les artisans ont vidé leurs paniers, et il a fallu rembourser des écarts.",
    duree: 1,
    effet: { panier: 0.8, cout: 2000 },
  },
  {
    id: "pluie",
    titre: "Deux semaines de pluie",
    de: "Direction commerciale",
    role: "Région",
    texte:
      "Deux semaines de pluie sans interruption : les chantiers s'arrêtent, les artisans commandent moins, en ligne comme au comptoir.",
    duree: 2,
    effet: { visites: 0.88 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent offre la livraison",
    de: "Baptiste Lantelme",
    role: "Directeur de l'agence de Vaulx-en-Velin",
    texte:
      "Un négociant concurrent offre la livraison sur chantier pendant deux semaines : une partie des artisans finissent leur panier chez lui.",
    duree: 2,
    effet: { commande: 0.9 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  visites: number;
  conversion: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La refonte est-elle livrée à temps ? */
  uRefonte: number;
  /** Le nouveau tunnel de commande fait-il vendre plus, ou casse-t-il quelque chose ? */
  uTunnel: number;
  /** Une agence contournée se rebiffe-t-elle ? */
  uRebiffe: number;
  /** Le retrait en deux heures tient-il dans les agences ? */
  uRetrait: number;
  /** Le comité, laissé à lui-même, coupe-t-il le budget ? */
  uComite: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000117 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      visites: Math.min(1.2, Math.max(0.82, 1 + 0.07 * gauss(r))),
      conversion: Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))),
    });
  }
  const uRefonte = r();
  const uTunnel = r();
  const uRebiffe = r();
  const uRetrait = r();
  const uComite = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uRefonte, uTunnel, uRebiffe, uRetrait, uComite, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux, l'agence web livre la refonte en semaine 10 ; sinon, après le trimestre. */
export const CHANCE_REFONTE = 0.5;
export const refonteLivree = (chemin: readonly number[], graine: number) =>
  chemin[D.entonnoir] === 2 && hasard(graine).uRefonte < CHANCE_REFONTE;

/**
 * LE NOUVEAU TUNNEL FAIT-IL VENDRE ?
 *
 * Un peu plus d'une fois sur deux, oui : une page au lieu de quatre, le stock de l'agence et
 * la date de retrait affichés. Sinon, le sélecteur de date ne marche pas sur
 * téléphone — là où les artisans commandent, depuis le chantier. Le tirage ne
 * dépend que du hasard du trimestre : c'est la même version, testée ou non.
 */
export const CHANCE_TUNNEL = 0.55;
export const tunnelGagne = (graine: number) => hasard(graine).uTunnel < CHANCE_TUNNEL;

/** Contournée par l'e-mailing direct, l'agence de Vaulx se rebiffe une fois sur deux. */
export const agenceSeRebiffe = (chemin: readonly number[], graine: number) =>
  chemin[D.agences] === 2 && hasard(graine).uRebiffe < 0.5;

/**
 * LE RETRAIT EN DEUX HEURES TIENT-IL ?
 *
 * Préparer une commande web en deux heures, c'est du travail de comptoir. Des
 * comptoirs qui touchent la vente le font ; des comptoirs à qui elle retire de
 * la prime laissent les commandes au fond du dépôt.
 */
export function risqueRetrait(chemin: readonly number[]): number {
  if (chemin[D.printemps] !== 1) return 0;
  return chemin[D.agences] === 0 ? 0.15 : 0.7;
}
export const retraitRate = (chemin: readonly number[], graine: number) =>
  hasard(graine).uRetrait < risqueRetrait(chemin);

/** Laissé à lui-même, le comité coupe le budget un peu plus d'une fois sur deux. */
export const CHANCE_COUPE = 0.55;
export const comiteCoupe = (chemin: readonly number[], graine: number) =>
  chemin[D.comite] === 0 || (chemin[D.comite] === 3 && hasard(graine).uComite < CHANCE_COUPE);

export type Semaine = {
  visites: number;
  /** Les visites achetées en publicité. */
  payantes: number;
  /** Commandes en ligne de la semaine. */
  commandes: number;
  /** Commandes rapportées aux visites. */
  conversion: number;
  /** Part des paniers qui ne deviennent pas des commandes. */
  abandon: number;
  /** Part des artisans venus qui voient leurs prix pro. */
  compte: number;
  /** Marge de la semaine : ventes en ligne et achats d'appoint au comptoir. */
  marge: number;
  /** Ce que la semaine a coûté : publicité, développement, remises, primes, avoirs. */
  cout: number;
  contribution: number;
  /** La contribution cumulée depuis le début du trimestre. */
  cumul: number;
  publicite: number;
  /** La part des agences qui recommandent le site. */
  adhesion: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de contribution du canal : positif, le site fait mieux que prévu. */
  objectif: number;
  contribution: number;
  marge: number;
  couts: number;
  publicite: number;
  commandes: number;
  refonteLancee: boolean;
  refonteLivree: boolean;
  tunnel: "aucun" | "deploye" | "teste";
  tunnelGagne: boolean;
  rebiffe: boolean;
  retraitLance: boolean;
  retraitRate: boolean;
  comiteConsulte: boolean;
  coupe: boolean;
  conversionMoyenne: number;
  commandesFinales: number;
  adhesionFinale: number;
  coutPubParCommande: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5] = chemin;
  const livree = refonteLivree(chemin, graine);
  const gagne = tunnelGagne(graine);
  const rebiffe = agenceSeRebiffe(chemin, graine);
  const rate = retraitRate(chemin, graine);
  const coupe = comiteCoupe(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let adhesion = ADHESION_DEPART;
  let cumul = 0;
  let marge = 0;
  let couts = 0;
  let publiciteTotale = 0;
  let commandesTotales = 0;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const coupeIci = coupe && w >= 12;
    let cout = w === 1 ? perte : 0;

    // L'adhésion des agences : elle suit ce qu'elles y gagnent, avec retard.
    let cible = ADHESION_DEPART;
    if (d2 === 0 && w >= 4) cible = 0.7;
    if (d2 === 1 && w >= 4) cible = w <= 6 ? 0.3 : 0.18; // La note s'applique, puis s'oublie.
    if (d2 === 2 && w >= 4) cible = rebiffe && w >= 6 ? 0 : 0.05;
    if (d5 === 0 && w >= 10) cible -= 0.08; // La remise vide les comptoirs.
    if (d5 === 1 && w >= 10 && !rate) cible += 0.05;
    if (coupeIci) cible = 0.03;
    adhesion = borne(adhesion + 0.45 * (borne(cible, 0, 0.8) - adhesion), 0, 0.8);

    // La publicité de la semaine.
    let publicite = PUBLICITE_DEPART;
    if (d1 === 0 && w >= 2) publicite = 2 * PUBLICITE_DEPART;
    let ciblee = 0;
    if (w >= 8) {
      if (d4 === 0) publicite = 6000;
      if (d4 === 1) {
        publicite = 0;
        ciblee = PUBLICITE_CIBLEE;
      }
      if (d4 === 2) publicite = 0;
    }
    if (chemin[D.comite] === 1 && w >= 12 && publicite > 0) {
      // Le dossier présenté au comité réalloue la publicité large vers les comptes inscrits.
      publicite = 0;
      ciblee = PUBLICITE_CIBLEE;
    }
    if (chemin[D.comite] === 2 && w >= 12) publicite += 5000;
    if (coupeIci) {
      publicite = 0;
      ciblee = 0;
    }

    // Les visites : celles qui viennent seules, celles que les agences envoient, celles qu'on achète.
    let facteurVisites = n.visites;
    let facteurPayantes = 1;
    let facteurPanier = 1;
    let facteurCommande = n.conversion;
    for (const a of actifs) {
      facteurVisites *= a.imprevu.effet.visites ?? 1;
      facteurPayantes *= a.imprevu.effet.payantes ?? 1;
      facteurPanier *= a.imprevu.effet.panier ?? 1;
      facteurCommande *= a.imprevu.effet.commande ?? 1;
      if (w === a.semaine) cout += a.imprevu.effet.cout ?? 0;
    }
    const naturelles = VISITES_NATURELLES * facteurVisites;
    const parAgences = VISITES_AGENCES * adhesion * facteurVisites;
    // Les rendements de la publicité décroissent : les meilleurs mots-clés sont déjà achetés.
    const payantes =
      (PUBLICITE_DEPART / COUT_VISITE) *
      Math.pow(publicite / PUBLICITE_DEPART, 0.8) *
      facteurPayantes *
      n.visites;
    const ciblees = (ciblee / 0.5) * facteurPayantes;
    const emails = d2 === 2 && w >= 4 && w <= 7 ? 1500 : 0;
    const visites = naturelles + parAgences + payantes + ciblees + emails;
    const pros =
      naturelles * PART_PRO.naturelles +
      parAgences * PART_PRO.agences +
      payantes * PART_PRO.payantes +
      ciblees * PART_PRO.ciblees +
      emails * PART_PRO.agences;

    // L'entonnoir : compte et prix pro, panier, commande validée.
    const corrige = (d1 === 1 && w >= 2) || (livree && w >= 10);
    let compte = corrige
      ? ENTONNOIR_CORRIGE.compte + 0.08 * adhesion
      : ENTONNOIR_DEPART.compte + 0.08 * adhesion; // Des agences convaincues valident vite.
    let panier = (corrige ? ENTONNOIR_CORRIGE.panier : ENTONNOIR_DEPART.panier) * facteurPanier;
    let commande: number = ENTONNOIR_DEPART.commande;
    if (livree && w >= 10) commande += w <= 11 ? -0.03 : 0.04; // Le temps de s'y retrouver.
    // Le tunnel : déployé pour tous, testé sur la moitié, ou le seul stock affiché.
    const effetTunnel = gagne ? 0.12 : -0.12;
    if (d3 === 0 && w >= 6) commande += effetTunnel;
    if (d3 === 1 && w >= 6) {
      if (w <= 7) commande += effetTunnel / 2;
      else if (gagne) commande += effetTunnel;
    }
    if (d3 === 2 && w >= 6) commande += 0.042;
    // Le printemps.
    let livraisons = 0;
    if (d5 === 0 && w >= 10) {
      panier *= 1.15;
      commande += 0.05;
    }
    if (d5 === 1 && w >= 10 && !coupeIci) commande += rate && w <= 11 ? -0.05 : 0.03;
    if (d5 === 2 && w >= 10) commande += 0.04;
    if (coupeIci) {
      // L'annonce fait le tour des comptoirs : on ne passe plus de temps sur un site qui ferme.
      panier *= 0.9;
    }
    commande = borne(commande * facteurCommande, 0.15, 0.75);
    compte = borne(compte, 0.1, 0.8);

    let commandes = pros * compte * panier * commande;
    // La relance des comptes inscrits qui n'ont jamais commandé, par leur agence.
    if (d4 === 1 && w >= 8) commandes += 10 * (0.3 + adhesion);
    if (d5 === 2 && w >= 10) livraisons = commandes * 0.6;
    const conversion = commandes / visites;

    // Ce que la semaine rapporte : la marge en ligne, et les achats d'appoint au comptoir.
    let margeSemaine = commandes * MARGE_COMMANDE;
    if (d5 === 1 && w >= 10 && !coupeIci && !(rate && w <= 11)) {
      margeSemaine += commandes * 0.25 * MARGE_APPOINT;
    }

    // Ce que la semaine coûte.
    let depense = publicite + ciblee;
    if (d1 === 1 && w === 1) depense += COUTS.correctifs;
    if (d1 === 2 && w === 2) depense += COUTS.refonteAcompte;
    if (livree && w === 10) depense += COUTS.refonteSolde;
    if (d2 === 0 && w >= 4) depense += COUTS.attribution * PANIER * commandes;
    if (d2 === 2 && w === 4) depense += COUTS.emailing;
    if (d2 === 2 && w >= 4) depense += COUTS.remiseDirecte * PANIER * commandes * 0.6;
    if (rebiffe && w === 6) depense += 6000; // Un compte de maçonnerie part chez un concurrent.
    if (d3 === 0 && w === 6) depense += COUTS.tunnel;
    if (d3 === 1 && w === 6) depense += COUTS.test;
    if (d3 === 2 && w === 6) depense += COUTS.stock;
    // Déployé pour tous, le tunnel cassé fait échouer des commandes : des gestes pour les rattraper.
    if (d3 === 0 && !gagne && w === 8) depense += COUTS.gestesTunnel;
    if (d4 === 1 && w === 8) depense += COUTS.relance;
    if (d5 === 0 && w >= 10 && w <= 13) {
      // La remise de printemps : sur toutes les commandes, et sur les achats qui quittent le comptoir.
      depense += COUTS.remisePrintemps * PANIER * commandes;
      depense += commandes * 0.25 * MARGE_COMMANDE * 0.5;
    }
    if (d5 === 1 && w === 10) depense += COUTS.retrait;
    if (rate && w === 10) depense += COUTS.avoirRetrait;
    if (d5 === 2 && w >= 10) depense += livraisons * COUTS.livraison;
    cout += depense;

    const contribution = margeSemaine - cout;
    cumul += contribution;
    marge += margeSemaine;
    couts += cout;
    publiciteTotale += publicite + ciblee;
    commandesTotales += commandes;

    semaines.push({
      visites,
      payantes: payantes + ciblees,
      commandes,
      conversion,
      abandon: 1 - commande,
      compte,
      marge: margeSemaine,
      cout,
      contribution,
      cumul,
      publicite: publicite + ciblee,
      adhesion,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: cumul - BUDGET,
    contribution: cumul,
    marge,
    couts,
    publicite: publiciteTotale,
    commandes: commandesTotales,
    refonteLancee: d1 === 2,
    refonteLivree: livree,
    tunnel: d3 === 0 ? "deploye" : d3 === 1 ? "teste" : "aucun",
    tunnelGagne: gagne,
    rebiffe,
    retraitLance: d5 === 1,
    retraitRate: rate,
    comiteConsulte: chemin[D.comite] === 3,
    coupe,
    conversionMoyenne: pleines.reduce((s, x) => s + x.conversion, 0) / SEMAINES,
    commandesFinales: (pleines[SEMAINES - 2]!.commandes + pleines[SEMAINES - 1]!.commandes) / 2,
    adhesionFinale: pleines[SEMAINES - 1]!.adhesion,
    coutPubParCommande: publiciteTotale / Math.max(1, commandesTotales),
  };
}

/** Ce qui s'est passé pendant des semaines : la refonte, le tunnel, les agences, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const d3 = chemin[D.tunnel];
  return {
    /** La refonte : livrée en semaine 10, ou annoncée en retard en semaine 9. */
    refonteLivree: t.refonteLivree && dans(10),
    refonteRetard: t.refonteLancee && !t.refonteLivree && dans(9),
    /** Le test rend son verdict en fin de semaine 7. */
    testGagne: d3 === 1 && t.tunnelGagne && dans(7),
    testPerd: d3 === 1 && !t.tunnelGagne && dans(7),
    /** Déployé pour tous, le tunnel qui casse se voit en semaine 8, sans qu'on sache pourquoi. */
    deploiementCasse: d3 === 0 && !t.tunnelGagne && dans(8),
    rebiffe: t.rebiffe && dans(6),
    retraitRate: t.retraitRate && dans(10),
    coupe: t.coupe && dans(12),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSite {
  visites: number | null;
  payantes: number | null;
  conversion: number | null;
  commandes: number | null;
  abandon: number | null;
  compte: number | null;
  cumul: number | null;
  adhesion: number | null;
  budgetADate: number | null;
}

/** Ce que Pauline lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureSite {
  if (semaine === 0) {
    return {
      visites: 8100,
      payantes: 2200,
      conversion: 0.0074,
      commandes: 60,
      abandon: 0.62,
      compte: 0.35,
      cumul: 0,
      adhesion: ADHESION_DEPART,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    visites: s.visites,
    payantes: s.payantes,
    conversion: s.conversion,
    commandes: s.commandes,
    abandon: s.abandon,
    compte: s.compte,
    cumul: s.cumul,
    adhesion: s.adhesion,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
