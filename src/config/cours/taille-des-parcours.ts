/**
 * LA TAILLE DE CHAQUE PARCOURS QU'UNE CLASSE PEUT CHOISIR, ET LES DIPLÔMES QU'IL SERT.
 *
 * ÉCRIT PAR scripts/compter-les-parcours.ts, JAMAIS À LA MAIN : le calcul est
 * `tailleDesParcours` (config/cours/parcours-de-formation.ts), qui lit le registre du cours. Le devis
 * le lit ici sans charger ce registre ; tests/cours/parcours-de-formation.test.ts recompte et compare.
 * Un chapitre ajouté, retiré ou qui cite un autre bloc : relancer le script.
 */
export const TAILLE_DES_PARCOURS: Readonly<Record<string, { chapitres: number; diplomes: readonly string[] }>> = {
  "comptabilite-generale": { chapitres: 39, diplomes: ["bts-cg", "dcg", "but-gea", "stmg", "but-gaco", "bts-sam"] },
  "controle-de-gestion": { chapitres: 32, diplomes: ["dcg", "but-gea", "bts-cg", "but-gaco", "bts-mhr", "dscg", "stmg"] },
  "mco": { chapitres: 27, diplomes: ["bts-mco", "but-tc", "bts-ndrc", "bts-mhr", "but-gaco"] },
  "ndrc": { chapitres: 15, diplomes: ["bts-ndrc", "but-tc", "but-gaco"] },
  "stmg": { chapitres: 14, diplomes: ["stmg", "but-tc", "but-gaco"] },
  "stmg-gf": { chapitres: 14, diplomes: ["stmg", "but-gaco"] },
  "stmg-rh": { chapitres: 15, diplomes: ["stmg", "bts-sam", "but-gaco", "but-gea"] },
  "gpme": { chapitres: 6, diplomes: ["bts-gpme", "bts-cg"] },
  "strategie": { chapitres: 7, diplomes: ["stmg", "but-gea", "dcg", "dscg", "bts-cg", "but-tc"] },
  "stmg-sig": { chapitres: 13, diplomes: ["stmg"] },
  "mhr": { chapitres: 4, diplomes: ["bts-mhr"] },
  "fiscalite": { chapitres: 5, diplomes: ["bts-cg", "dcg", "but-gea"] },
  "dscg-finance": { chapitres: 4, diplomes: ["dscg", "bts-cg"] },
  "stmg-management": { chapitres: 35, diplomes: ["stmg"] },
  "dcg-comptabilite-approfondie": { chapitres: 5, diplomes: ["dcg", "but-gea", "bts-cg"] },
  "bac-stmg": { chapitres: 100, diplomes: ["stmg"] },
  "bts-cg": { chapitres: 61, diplomes: ["bts-cg"] },
  "bts-sam": { chapitres: 3, diplomes: ["bts-sam"] },
  "bts-mhr": { chapitres: 9, diplomes: ["bts-mhr"] },
  "but-gea": { chapitres: 58, diplomes: ["but-gea"] },
  "but-tc": { chapitres: 17, diplomes: ["but-tc"] },
  "but-gaco": { chapitres: 22, diplomes: ["but-gaco"] },
  "dcg": { chapitres: 74, diplomes: ["dcg"] },
  "dscg": { chapitres: 10, diplomes: ["dscg"] },
};
