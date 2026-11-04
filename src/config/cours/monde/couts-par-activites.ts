import { auCentime } from "./amortissement";
import { CHARGES_DE_GESTION, moisDeGestion, type ChargeDeGestion } from "./comptabilite-de-gestion";
import { OPERATEURS } from "./nova-capacite";
import { NOVA_GESTION, VENTES_A_CAMPUSTECH, VENTES_DES_PARTICULIERS } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES COÛTS À BASE D'ACTIVITÉS DE NOVA, EN JANVIER N (le chapitre « Les coûts à
 * base d'activités : la méthode ABC » et son cas ; BTS CG P5 5.2.4, DCG UE11 § 2.3, BUT GEA).
 *
 * LE MOIS EST JANVIER, CELUI DE LA COMPTABILITÉ DE GESTION DE L'EXERCICE (comptabilite-de-gestion.ts,
 * `moisDeGestion(0)`) : un mois sans stock, comme le BTS le demande pour la méthode ABC (les jeux de
 * composants reçus sont tous montés, les enceintes montées toutes livrées). Ses charges indirectes
 * sont celles des centres d'analyse, au centime : le loyer, la paie, l'usure de la ligne, le travail
 * de la gérante (l'assurance ne commence qu'en octobre), 35 383 €. Ses charges directes aussi : 22 €
 * de composants et 16 € d'autres coûts par enceinte (nova-gestion.ts). Le coût de revient par les
 * centres d'analyse est celui de ce mois, 60,25 € par enceinte, quel que soit le client.
 *
 * DEUX PRODUITS, UNE MÊME ENCEINTE. La NOVA One se vend de deux façons : en ligne, aux particuliers
 * (1 270 enceintes en janvier), et à CampusTech (320 enceintes), le client professionnel
 * (nova-gestion.ts). Les centres d'analyse leur donnent le même coût : leurs unités d'œuvre (l'euro
 * d'achat, l'enceinte, l'euro de chiffre d'affaires) ne voient pas la différence. La méthode ABC la
 * voit : 1 270 commandes et 1 270 colis d'un côté, 1 commande et 4 palettes de l'autre.
 *
 * CE QUE CE FICHIER AJOUTE (HYPOTHÈSES DU COURS, nommées ci-dessous) : les 5 activités de NOVA et la
 * part de chaque charge que chacune consomme (ACTIVITES_DE_NOVA), et ce que chaque produit demande
 * de commandes et d'envois (COMMANDES_DE_JANVIER). Les heures de montage d'une enceinte sont celles de
 * nova-capacite.ts (OPERATEURS : un quart d'heure).
 *
 * LES RÈGLES DE CALCUL, celles d'un énoncé : le coût d'une activité est la somme des charges × leurs
 * parts, au centime ; le coût d'un inducteur, le coût de l'activité ÷ le volume de l'inducteur,
 * arrondi au centime ; chaque produit reçoit le volume qu'il consomme × ce coût arrondi, au centime ;
 * l'écart avec le total des activités est une différence d'arrondi.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDActivite = "approvisionner" | "monter" | "expedier" | "commandes" | "administrer";
export type CodeDeProduit = "en-ligne" | "campustech";

/** Ce que mesure un inducteur : des jeux reçus, des heures de montage, des envois, des commandes, ou 100 € de chiffre d'affaires. */
export type NatureDInducteur = "jeux" | "heures" | "envois" | "commandes" | "chiffreDAffaires";

export interface ActiviteDeNova {
  code: CodeDActivite;
  libelle: string;
  inducteur: { libelle: string; nature: NatureDInducteur; unite: string };
  /** Un inducteur de volume suit les enceintes ; les autres suivent les commandes ou les envois, quelle que soit leur taille. */
  volumique: boolean;
  /** La part de chaque charge indirecte que l'activité consomme : chaque charge fait 100 % sur les 5 activités. */
  parts: Readonly<Record<ChargeDeGestion, number>>;
}

/**
 * LES 5 ACTIVITÉS DE NOVA (hypothèse du cours). Les parts du loyer suivent les surfaces (celles des
 * centres d'analyse : l'atelier, la réception, la zone d'expédition, le bureau des commandes, la
 * direction) ; celles de la paie, le temps des 4 opérateurs relevé sur une semaine type ; l'usure va
 * toute au montage ; l'assurance (nulle en janvier) suit le montage et les envois, comme au centre
 * production et au centre distribution ; le travail de la gérante va pour 30 % aux commandes (elle
 * suit elle-même CampusTech, comme au centre distribution) et 70 % à la direction.
 */
export const ACTIVITES_DE_NOVA: readonly ActiviteDeNova[] = [
  {
    code: "approvisionner",
    libelle: "Commander et réceptionner les composants",
    inducteur: { libelle: "jeu de composants reçu", nature: "jeux", unite: "jeux" },
    volumique: true,
    parts: { loyer: 0.15, personnel: 0.1, amortissement: 0, assurance: 0, gerante: 0 },
  },
  {
    code: "monter",
    libelle: "Monter et tester les enceintes",
    inducteur: { libelle: "heure de montage", nature: "heures", unite: "heures" },
    volumique: true,
    parts: { loyer: 0.5, personnel: 0.55, amortissement: 1, assurance: 0.8, gerante: 0 },
  },
  {
    code: "expedier",
    libelle: "Préparer et expédier les envois",
    inducteur: { libelle: "envoi expédié", nature: "envois", unite: "envois" },
    volumique: false,
    parts: { loyer: 0.2, personnel: 0.2, amortissement: 0, assurance: 0.2, gerante: 0 },
  },
  {
    code: "commandes",
    libelle: "Traiter les commandes et le service client",
    inducteur: { libelle: "commande reçue", nature: "commandes", unite: "commandes" },
    volumique: false,
    parts: { loyer: 0.05, personnel: 0.1, amortissement: 0, assurance: 0, gerante: 0.3 },
  },
  {
    code: "administrer",
    libelle: "Diriger et administrer",
    inducteur: { libelle: "100 € de chiffre d'affaires", nature: "chiffreDAffaires", unite: "× 100 €" },
    volumique: true,
    parts: { loyer: 0.1, personnel: 0.05, amortissement: 0, assurance: 0, gerante: 0.7 },
  },
];

/**
 * LES COMMANDES ET LES ENVOIS DE JANVIER (hypothèse du cours). Un particulier commande une enceinte
 * à la fois : 1 270 commandes en ligne, 1 270 colis. CampusTech passe 1 commande par mois, livrée en
 * 4 palettes, une par semaine.
 */
export const COMMANDES_DE_JANVIER: Readonly<Record<CodeDeProduit, { commandes: number; envois: number }>> = {
  "en-ligne": { commandes: VENTES_DES_PARTICULIERS[0], envois: VENTES_DES_PARTICULIERS[0] },
  campustech: { commandes: 1, envois: 4 },
};

export const LIBELLES_DES_PRODUITS: Readonly<Record<CodeDeProduit, string>> = {
  "en-ligne": "L'enceinte vendue en ligne",
  campustech: "L'enceinte vendue à CampusTech",
};

const PRODUITS: readonly CodeDeProduit[] = ["en-ligne", "campustech"];
const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));

// ─────────────────────────────────────────────────────────────────────────────
// LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

/** Une vente : ses enceintes, leur prix hors taxes, ses commandes et ses envois, et ce qu'elle facture en plus (des frais de port). */
export interface VenteDeNova {
  enceintes: number;
  prix: number;
  commandes: number;
  envois: number;
  /** Ce que la vente facture en plus du prix des enceintes, hors taxes (des frais de port par commande × les commandes). */
  autresProduits?: number;
}

/** Le volume de chaque inducteur qu'une vente consomme. */
export function inducteursDe(v: VenteDeNova): Record<NatureDInducteur, number> {
  const chiffreDAffaires = v.enceintes * v.prix + (v.autresProduits ?? 0);
  return { jeux: v.enceintes, heures: v.enceintes * OPERATEURS.heuresParEnceinte, envois: v.envois, commandes: v.commandes, chiffreDAffaires: chiffreDAffaires / 100 };
}

/** Les leviers de janvier : les frais de port facturés par commande en ligne (hors taxes), le prix de CampusTech. */
export interface LeviersDeLaMethodeABC {
  fraisDePort: number;
  prixDeCampustech: number;
}

/** Les ventes de janvier, produit par produit, à des leviers donnés. */
export function ventesDeJanvier(leviers: Partial<LeviersDeLaMethodeABC> = {}): Record<CodeDeProduit, VenteDeNova> {
  const prix = NOVA_GESTION.moisDeReference.prix;
  const k = COMMANDES_DE_JANVIER;
  return {
    "en-ligne": { enceintes: VENTES_DES_PARTICULIERS[0], prix, ...k["en-ligne"], autresProduits: auCentime((leviers.fraisDePort ?? 0) * k["en-ligne"].commandes) },
    campustech: { enceintes: VENTES_A_CAMPUSTECH[0], prix: leviers.prixDeCampustech ?? prix, ...k.campustech },
  };
}

/** Le coût de revient d'une vente par les centres d'analyse de janvier, à leurs coûts d'unité d'œuvre arrondis. */
export function coutParLesCentres(v: VenteDeNova) {
  const m = moisDeGestion(0);
  const f = NOVA_GESTION.moisDeReference;
  const achats = auCentime(v.enceintes * f.coutVariable.composants);
  const chiffreDAffaires = auCentime(v.enceintes * v.prix + (v.autresProduits ?? 0));
  const u = NOVA_GESTION.centres.unitesDOeuvre;
  const approvisionnement = auCentime((achats / u.approvisionnement.assiette) * m.cout.approvisionnement);
  const production = auCentime((v.enceintes / u.production.assiette) * m.cout.production);
  const distribution = auCentime((chiffreDAffaires / u.distribution.assiette) * m.cout.distribution);
  const directes = auCentime(v.enceintes * (f.coutVariable.composants + f.coutVariable.autres));
  const coutDeRevient = somme([directes, approvisionnement, production, distribution]);
  return { achats, chiffreDAffaires, approvisionnement, production, distribution, indirectes: somme([approvisionnement, production, distribution]), directes, coutDeRevient, unitaire: coutDeRevient / v.enceintes, resultat: auCentime(chiffreDAffaires - coutDeRevient) };
}

/** Le coût de chaque activité de janvier : les charges indirectes du mois × les parts de l'activité. */
export function activitesDeJanvier() {
  const charges = moisDeGestion(0).repartition.charges;
  const parCharge = ACTIVITES_DE_NOVA.map((a) => ({ ...a, montants: Object.fromEntries(CHARGES_DE_GESTION.map((k) => [k, auCentime(charges[k] * a.parts[k])])) as Record<ChargeDeGestion, number> }));
  return {
    charges,
    total: somme(CHARGES_DE_GESTION.map((k) => charges[k])),
    activites: parCharge.map((a) => ({ ...a, cout: somme(CHARGES_DE_GESTION.map((k) => a.montants[k])) })),
  };
}

/**
 * LA MÉTHODE ABC EN JANVIER : le coût de chaque activité, le volume de son inducteur (les deux
 * produits réunis), le coût d'un inducteur au centime ; puis chaque produit, ce qu'il consomme, ses
 * charges indirectes, ses charges directes, son coût de revient et son résultat ; et, face à lui, son
 * coût par les centres d'analyse.
 */
export function methodeABC(leviers: Partial<LeviersDeLaMethodeABC> = {}) {
  const a = activitesDeJanvier();
  const ventes = ventesDeJanvier(leviers);
  const consomme = Object.fromEntries(PRODUITS.map((p) => [p, inducteursDe(ventes[p])])) as Record<CodeDeProduit, Record<NatureDInducteur, number>>;
  const activites = a.activites.map((x) => {
    const volume = Math.round((consomme["en-ligne"][x.inducteur.nature] + consomme.campustech[x.inducteur.nature]) * 1e6) / 1e6;
    return { ...x, volume, coutDeLInducteur: auCentime(x.cout / volume) };
  });
  const produits = Object.fromEntries(PRODUITS.map((p) => [p, { code: p, libelle: LIBELLES_DES_PRODUITS[p], ...coutDUneVente(ventes[p], activites) }])) as Record<
    CodeDeProduit,
    { code: CodeDeProduit; libelle: string } & ReturnType<typeof coutDUneVente>
  >;
  const imputees = somme(PRODUITS.map((p) => produits[p].indirectes));
  return { leviers, charges: a.charges, total: a.total, activites, produits, imputees, arrondi: auCentime(imputees - a.total) };
}

/** Une activité, avec le coût de son inducteur. */
type ActiviteChiffree = ActiviteDeNova & { cout: number; coutDeLInducteur: number };

/**
 * Le coût d'une vente à des coûts d'inducteurs donnés : ce qu'elle consomme de chaque activité × le
 * coût de l'inducteur, ses charges directes, son coût de revient et son résultat ; et son coût par les
 * centres d'analyse, aux coûts d'unité d'œuvre de janvier.
 */
function coutDUneVente(v: VenteDeNova, activites: readonly ActiviteChiffree[]) {
  const f = NOVA_GESTION.moisDeReference;
  const consomme = inducteursDe(v);
  const imputations = activites.map((x) => ({ code: x.code, libelle: x.libelle, volume: consomme[x.inducteur.nature], coutDeLInducteur: x.coutDeLInducteur, montant: auCentime(consomme[x.inducteur.nature] * x.coutDeLInducteur) }));
  const indirectes = somme(imputations.map((i) => i.montant));
  const directes = auCentime(v.enceintes * (f.coutVariable.composants + f.coutVariable.autres));
  const coutDeRevient = somme([directes, indirectes]);
  const chiffreDAffaires = auCentime(v.enceintes * v.prix + (v.autresProduits ?? 0));
  return { vente: v, imputations, indirectes, directes, coutDeRevient, unitaire: coutDeRevient / v.enceintes, chiffreDAffaires, resultat: auCentime(chiffreDAffaires - coutDeRevient), centres: coutParLesCentres(v) };
}

/**
 * UNE VENTE DE PLUS, CHIFFRÉE AUX COÛTS D'INDUCTEURS DE JANVIER : ce qu'elle consomme de chaque
 * activité au coût de l'inducteur du mois, ses charges directes, son coût de revient et son
 * résultat ; et son coût par les centres d'analyse, aux coûts d'unité d'œuvre du mois.
 */
export const venteAuxCoutsDeJanvier = (v: VenteDeNova) => coutDUneVente(v, methodeABC().activites);
