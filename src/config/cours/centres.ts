/**
 * LES CENTRES D'ANALYSE DU COURS : ce que la simulation ne découpe pas.
 *
 * L'arène connaît les charges de l'entreprise, pas l'endroit où elles naissent. Le chapitre
 * « Coût complet et centres d'analyse » les répartit entre quatre centres, avec des clés
 * de répartition courantes pour une petite entreprise : le loyer selon les surfaces, le
 * personnel selon les effectifs, l'usure de l'équipement selon son emploi. Le centre
 * administration, auxiliaire, se répartit ensuite sur les trois autres.
 *
 * Chaque ligne de clés fait 100 % : un test le vérifie.
 */

export type CodeDeCentre = "administration" | "approvisionnement" | "production" | "distribution";

export const CENTRES: readonly { code: CodeDeCentre; libelle: string }[] = [
  { code: "administration", libelle: "Administration" },
  { code: "approvisionnement", libelle: "Approvisionnement" },
  { code: "production", libelle: "Production" },
  { code: "distribution", libelle: "Distribution" },
];

export type Cles = Record<CodeDeCentre, number>;

/** La répartition primaire : chaque charge indirecte entre les quatre centres. */
export const REPARTITION_PRIMAIRE: { loyer: Cles; personnel: Cles; amortissement: Cles } = {
  loyer: { administration: 0.1, approvisionnement: 0.15, production: 0.55, distribution: 0.2 },
  personnel: { administration: 0.15, approvisionnement: 0.1, production: 0.55, distribution: 0.2 },
  amortissement: { administration: 0.05, approvisionnement: 0.05, production: 0.85, distribution: 0.05 },
};

/** La répartition secondaire : le centre administration, sur les trois centres principaux. */
export const REPARTITION_SECONDAIRE: Omit<Cles, "administration"> = {
  approvisionnement: 0.2,
  production: 0.5,
  distribution: 0.3,
};

/** L'unité d'œuvre de l'approvisionnement : cent euros d'achats. */
export const ASSIETTE_D_APPROVISIONNEMENT = 100;

/** L'unité d'œuvre de la distribution : cent euros de chiffre d'affaires. */
export const ASSIETTE_DE_DISTRIBUTION = 100;
