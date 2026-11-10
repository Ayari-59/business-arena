import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { GAMME_DE_NOVA, PRIX_DE_L_ENCEINTE } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA BASE DE DONNÉES DU SITE DE NOVA (enseignement spécifique de systèmes
 * d'information de gestion de terminale STMG, thème 3, question 3.1, lot F : « La base de données
 * relationnelle » et « Interroger la base en SQL »).
 *
 * CE QUI VIENT DES FICHES : le prix de la NOVA One, 59 € hors taxes, et la gamme Go, One et Studio, avec
 * ses prix (nova-gestion.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · L'EXTRAIT DE LA BASE : 6 clients particuliers et leurs 10 commandes de la première semaine de mai,
 *     toutes de NOVA One ; les noms et les villes sont inventés pour le cours. Les deux tables sont
 *     écrites une fois ci-dessous, et les deux chapitres les lisent ;
 *   · LA TABLE UNIQUE à laquelle on compare le modèle relationnel garde, sur chaque ligne de commande, le
 *     nom et la ville du client : 6 colonnes au lieu de 3 et 4 ;
 *   · LE CAS « RANGER LES AVIS DES CLIENTS » : 5 avis notés de 1 à 5 ;
 *   · LE CAS « OÙ OUVRIR UN POINT DE RETRAIT ? » : NOVA envisage un point de retrait dans la ville où ses
 *     clients commandent le plus d'enceintes.
 */

export const ENTREPRISES_DE_LA_BASE = ENTREPRISES_DE_LA_DIRECTION;

export interface ClientDeLaBase {
  numClient: string;
  nom: string;
  ville: string;
}

export interface CommandeDeLaBase {
  numCommande: number;
  date: string;
  quantite: number;
  numClient: string;
}

export const CLIENTS: readonly ClientDeLaBase[] = [
  { numClient: "C01", nom: "Martin", ville: "Lyon" },
  { numClient: "C02", nom: "Bernard", ville: "Grenoble" },
  { numClient: "C03", nom: "Petit", ville: "Annecy" },
  { numClient: "C04", nom: "Robert", ville: "Lyon" },
  { numClient: "C05", nom: "Durand", ville: "Valence" },
  { numClient: "C06", nom: "Moreau", ville: "Grenoble" },
];

export const COMMANDES: readonly CommandeDeLaBase[] = [
  { numCommande: 101, date: "02/05", quantite: 1, numClient: "C01" },
  { numCommande: 102, date: "02/05", quantite: 2, numClient: "C03" },
  { numCommande: 103, date: "03/05", quantite: 1, numClient: "C02" },
  { numCommande: 104, date: "04/05", quantite: 4, numClient: "C04" },
  { numCommande: 105, date: "05/05", quantite: 1, numClient: "C01" },
  { numCommande: 106, date: "05/05", quantite: 3, numClient: "C06" },
  { numCommande: 107, date: "06/05", quantite: 1, numClient: "C05" },
  { numCommande: 108, date: "07/05", quantite: 2, numClient: "C02" },
  { numCommande: 109, date: "07/05", quantite: 1, numClient: "C04" },
  { numCommande: 110, date: "08/05", quantite: 5, numClient: "C06" },
];

export const PRIX_HT = PRIX_DE_L_ENCEINTE;
export const GAMME = GAMME_DE_NOVA.references;

export const COLONNES = { client: 3, commande: 4, tableUnique: 6 } as const;
export const NOTES_DES_AVIS = [5, 4, 2, 5, 4] as const;

export const clientDe = (numClient: string) => CLIENTS.find((c) => c.numClient === numClient)!;
export const villeDe = (cmd: CommandeDeLaBase) => clientDe(cmd.numClient).ville;

// ─────────────────────────────────────────────────────────────────────────────
// LE MODÈLE RELATIONNEL
// ─────────────────────────────────────────────────────────────────────────────

/** Les cases à écrire : la table unique, et les 2 tables du modèle relationnel, pour n commandes. */
export const casesDeLaTableUnique = (commandes: number) => commandes * COLONNES.tableUnique;
export const casesDesDeuxTables = (commandes: number) => CLIENTS.length * COLONNES.client + commandes * COLONNES.commande;

/** Le plus petit nombre de commandes où les 2 tables écrivent moins de cases que la table unique. */
export function commandesOuLesDeuxTablesGagnent() {
  let n = 0;
  while (casesDesDeuxTables(n) >= casesDeLaTableUnique(n)) n++;
  return n;
}

/** Les commandes d'un client : autant de lignes à corriger dans la table unique s'il déménage. */
export const commandesDe = (numClient: string) => COMMANDES.filter((c) => c.numClient === numClient).length;

// ─────────────────────────────────────────────────────────────────────────────
// LES REQUÊTES
// ─────────────────────────────────────────────────────────────────────────────

/** SELECT … FROM Commande WHERE Quantite >= s : les lignes, les enceintes, le chiffre d'affaires. */
export function commandesDAuMoins(seuil: number) {
  const lignes = COMMANDES.filter((c) => c.quantite >= seuil);
  const enceintes = lignes.reduce((s, c) => s + c.quantite, 0);
  return { lignes: lignes.length, enceintes, chiffre: auCentime(enceintes * PRIX_HT) };
}

/** Le chiffre d'affaires de tout l'extrait. */
export const chiffreDeLExtrait = () => commandesDAuMoins(0).chiffre;

/** Le seuil le plus haut qui garde au moins la moitié du chiffre d'affaires de l'extrait. */
export function seuilDeLaMoitie() {
  const moitie = chiffreDeLExtrait() / 2;
  let s = 1;
  while (commandesDAuMoins(s + 1).chiffre >= moitie) s++;
  return s;
}

/** Les fonctions d'agrégat sur la table Commande. */
export function agregats() {
  const q = COMMANDES.map((c) => c.quantite);
  const somme = q.reduce((s, x) => s + x, 0);
  return { nombre: q.length, somme, moyenne: Math.round((somme / q.length) * 100) / 100, max: Math.max(...q) };
}

/** La jointure des 2 tables, sur les commandes des clients d'une ville. */
export function commandesDeLaVille(ville: string) {
  const lignes = COMMANDES.filter((c) => villeDe(c) === ville);
  return { lignes: lignes.length, enceintes: lignes.reduce((s, c) => s + c.quantite, 0) };
}

/** Les villes, dans l'ordre où elles paraissent dans la table Client. */
export const VILLES = [...new Set(CLIENTS.map((c) => c.ville))];

/** SELECT Ville, SUM(Quantite) … GROUP BY Ville : les enceintes de chaque ville. */
export const enceintesParVille = () => VILLES.map((ville) => ({ ville, enceintes: commandesDeLaVille(ville).enceintes }));

/** La ville où les clients commandent le plus d'enceintes, et son chiffre d'affaires. */
export function villeEnTete() {
  const [premiere] = [...enceintesParVille()].sort((a, b) => b.enceintes - a.enceintes);
  return { ...premiere!, chiffre: auCentime(premiere!.enceintes * PRIX_HT) };
}

/** Le cas des avis : la moyenne des notes. */
export const moyenneDesAvis = () => Math.round((NOTES_DES_AVIS.reduce((s, x) => s + x, 0) / NOTES_DES_AVIS.length) * 10) / 10;
