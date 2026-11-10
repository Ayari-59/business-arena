import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { SOUTIEN_AU_HANDBALL, totalDe } from "./haut-verdasse";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";
import { SMIC_HORAIRE_BRUT } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LA STRATÉGIE DU HANDBALL CLUB DU HAUT-VERDASSE (management de première STMG,
 * question 3.3, lot B).
 *
 * L'association du cours (haut-verdasse-handball.ts) ne cherche pas le profit, mais elle ne peut pas se
 * passer de stratégie : son objet social la borne, ses ressources humaines (des bénévoles) et
 * financières (des cotisations, une subvention, des sponsors) sont à pérenniser, et elle rend des
 * comptes à ses adhérents et à ceux qui la financent. Le chapitre se joue chez NOVA, l'entreprise du
 * cas, à qui il oppose cette organisation à but non lucratif ; il lit la fiche du club sans en recopier
 * un chiffre.
 *
 * LA VALEUR DU BÉNÉVOLAT : les heures des bénévoles se valorisent au SMIC horaire brut du cours
 * (ressources-humaines-de-nova.ts), la convention la plus simple pour les contributions volontaires en
 * nature.
 *
 * HYPOTHÈSES DU COURS :
 *   · LE LABORATOIRE : la communauté de communes annonce une subvention réduite de 6 000 € pour la
 *     saison suivante, ses propres charges ayant monté ; les dépenses du club ne changent pas ;
 *   · LE CAS : un garage du territoire propose 6 000 € de parrainage par saison, son nom sur les
 *     maillots de l'équipe senior, et demande en plus à choisir l'entraîneur de cette équipe.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts de la subvention, du bénévolat et des sponsors se
 * donnaient au dixième, elles sont à deux décimales.
 */

export const ENTREPRISES_DE_LA_STRATEGIE_DU_CLUB = ENTREPRISES_DE_LA_DIRECTION;

export const BAISSE_DE_LA_SUBVENTION = 6_000;
export const HAUSSES_ESSAYEES = { min: 0, max: 30, pas: 1 } as const;
export const PARRAINAGE_DU_GARAGE = 6_000;

const club = HAUT_VERDASSE_HANDBALL;
const ligne = (code: string) => club.budget.recettes.find((r) => r.code === code)!.montant;

/** Le budget en argent de la saison : totaux, excédent, part de la subvention. */
export function budgetDuClub() {
  const recettes = totalDe(club.budget.recettes);
  const depenses = totalDe(club.budget.depenses);
  const subvention = ligne("subvention");
  return {
    recettes,
    depenses,
    excedent: recettes - depenses,
    subvention,
    partDeLaSubvention: arrondi2((subvention / recettes) * 100),
    adherents: club.categories.reduce((t, c) => t + c.adherents, 0),
  };
}

/** Les ressources de la saison, en argent et en nature : le gymnase prêté et le temps des bénévoles. */
export function ressourcesEnNature() {
  const b = budgetDuClub();
  const gymnase = totalDe(club.contributionsEnNature);
  const benevolat = auCentime(club.heuresDeBenevolat * SMIC_HORAIRE_BRUT);
  const total = auCentime(b.recettes + gymnase + benevolat);
  return {
    heures: club.heuresDeBenevolat,
    benevoles: club.benevoles,
    smic: SMIC_HORAIRE_BRUT,
    gymnase,
    benevolat,
    argent: b.recettes,
    total,
    partDuBenevolat: arrondi2((benevolat / total) * 100),
  };
}

/** La saison suivante, la subvention réduite, à une hausse de cotisation par adhérent donnée. */
export function saisonSuivante(hausse: number) {
  const b = budgetDuClub();
  const recettes = b.recettes - BAISSE_DE_LA_SUBVENTION + hausse * b.adherents;
  return { hausse, adherents: b.adherents, recettes, depenses: b.depenses, solde: recettes - b.depenses, baisse: BAISSE_DE_LA_SUBVENTION };
}

/** La plus petite hausse de cotisation, à l'euro, qui garde le budget en équilibre. */
export const hausseQuiEquilibre = () => Math.max(0, Math.ceil(-saisonSuivante(0).solde / budgetDuClub().adherents - 1e-9));

/** Le cas : le parrainage du garage. */
export function parrainageDuGarage() {
  const b = budgetDuClub();
  const sponsors = ligne("sponsors");
  const recettes = b.recettes + PARRAINAGE_DU_GARAGE;
  return {
    parrainage: PARRAINAGE_DU_GARAGE,
    sponsorsAvant: sponsors,
    sponsorsApres: sponsors + PARRAINAGE_DU_GARAGE,
    recettesApres: recettes,
    partDesSponsorsAvant: arrondi2((sponsors / b.recettes) * 100),
    partDesSponsorsApres: arrondi2(((sponsors + PARRAINAGE_DU_GARAGE) / recettes) * 100),
    excedentApres: recettes - b.depenses,
  };
}

/** Qui fait quoi au bureau du club, sans le titre de chacun (la garde de NOVA lit les textes de ce chapitre). */
export const BUREAU_DU_CLUB = club.bureau;
export const LE_CLUB = club;
export const SUBVENTION_DU_CLUB = SOUTIEN_AU_HANDBALL.subvention;

export type OrigineDeLaRessource = "privee" | "publique";
export type RessourceAPerenniser = "humaines" | "financieres";
