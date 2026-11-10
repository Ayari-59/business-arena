import { LA_TABLE_D_AUGUSTIN } from "./la-table-d-augustin";

/**
 * LE MONDE DU COURS : ÉVALUER LE TRAVAIL À LA TABLE D'AUGUSTIN (enseignement spécifique de ressources
 * humaines et communication de terminale STMG, thème 1, question 1.2, lot E).
 *
 * CE QUI VIENT DES FICHES : le bistrot, son équipe et ses clientèles (la-table-d-augustin.ts : les
 * déjeuners d'affaires et les dîners de la clientèle locale).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA GRILLE D'ÉVALUATION DES SERVEURS : quatre critères notés sur 20 et pondérés, l'accueil et le
 *     conseil (30 %), la rapidité du service (30 %), les ventes additionnelles, desserts et cafés (20 %),
 *     l'entraide dans l'équipe (20 %) ; la responsable de salle considère l'objectif de l'année atteint à
 *     14 sur 20 de note globale ;
 *   · LES NOTES : Sarah, serveuse du soir, obtient 16, 14, 10 et 15 ; Hugo, serveur du midi, 15, 12 et 16
 *     sur les trois premiers critères, sa note d'entraide reste à fixer ;
 *   · LE CAS : sur l'année, Hugo a servi 1 200 couverts au déjeuner et vendu 180 desserts ; Sarah 1 400
 *     couverts au dîner et 420 desserts. Le patron propose une prime au serveur qui vend un dessert à
 *     plus de 25 % de ses couverts.
 */

export const ENTREPRISES_DE_L_EVALUATION = [LA_TABLE_D_AUGUSTIN.code] as const;

export const CRITERES = [
  { code: "accueil", libelle: "Accueil et conseil", poids: 0.3 },
  { code: "rapidite", libelle: "Rapidité du service", poids: 0.3 },
  { code: "ventes", libelle: "Ventes additionnelles", poids: 0.2 },
  { code: "entraide", libelle: "Entraide dans l'équipe", poids: 0.2 },
] as const;

export const NOTE_DE_L_OBJECTIF = 14;
export const NOTE_MAXIMALE = 20;
export const NOTES_DE_SARAH = [16, 14, 10, 15] as const;
export const NOTES_DE_HUGO_SANS_L_ENTRAIDE = [15, 12, 16] as const;

export const DESSERTS = {
  hugo: { prenom: "Hugo", service: "déjeuner", couverts: 1_200, desserts: 180 },
  sarah: { prenom: "Sarah", service: "dîner", couverts: 1_400, desserts: 420 },
  seuil: 0.25,
} as const;

const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** La note globale d'une grille : la somme des notes pondérées, au centième. */
export function noteGlobale(notes: readonly number[]) {
  return auCentieme(notes.reduce((t, n, i) => t + n * CRITERES[i]!.poids, 0));
}

/** La note globale de Sarah, et ses deux sommes partielles. */
export function evaluationDeSarah() {
  const n = NOTES_DE_SARAH;
  return { premiers: auCentieme(n[0] * CRITERES[0].poids + n[1] * CRITERES[1].poids), derniers: auCentieme(n[2] * CRITERES[2].poids + n[3] * CRITERES[3].poids), globale: noteGlobale(n) };
}

/** Les points que Hugo a déjà, sans l'entraide. */
export const pointsDeHugoSansLEntraide = () => noteGlobale(NOTES_DE_HUGO_SANS_L_ENTRAIDE);

/** La plus petite note d'entraide qui porte Hugo à l'objectif. */
export function entraideNecessaire() {
  const poids = CRITERES[3].poids;
  return Math.ceil((NOTE_DE_L_OBJECTIF - pointsDeHugoSansLEntraide()) / poids - 1e-9);
}

/** Le cas : le taux de desserts de chaque serveur. */
export function tauxDesDesserts() {
  const d = DESSERTS;
  const taux = (x: { couverts: number; desserts: number }) => Math.round((x.desserts / x.couverts) * 1000) / 10;
  return { hugo: taux(d.hugo), sarah: taux(d.sarah), seuil: d.seuil * 100 };
}
