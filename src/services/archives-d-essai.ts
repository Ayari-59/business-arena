import { isNull, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import {
  aidRequests,
  companyStates,
  customers,
  decisions,
  employees,
  eventOccurrences,
  examenCandidats,
  financialAccounts,
  gameRankings,
  gameRecoveries,
  games,
  inventory,
  kpis,
  ltiLiens,
  markets,
  pairsEvaluations,
  pairsMoments,
  pairsReponses,
  players,
  productionUnits,
  products,
  roundResults,
  rounds,
  scores,
  situationInstances,
  suppliers,
  teams,
  transactions,
} from "@/db/schema";

/*
 * CE QUE LA BASCULE DÉPLACE, CE QU'ELLE LAISSE, ET LES FILTRES DES LECTEURS
 * TRANSVERSAUX. À part du service de la bascule : ce module ne dépend que du schéma.
 * Les services qui lisent plusieurs parties à la fois l'importent sans tirer la
 * création de partie derrière eux, et le test qui recense les tables et les lecteurs
 * (tests/architecture/tour-d-essai.test.ts) le lit sans base. La conception est
 * expliquée en tête de services/tour-d-essai.service.ts.
 */

/** Une table que la bascule déplace : par sa partie, par son équipe, ou les deux. */
export interface TableQuiSuitLEssai {
  table: PgTable;
  partie?: PgColumn;
  equipe?: PgColumn;
  /** L'état moteur porte l'identifiant de son équipe : il suit, lui aussi. */
  etatAvecIdentifiant?: PgColumn;
  raison: string;
}

export const SUIVENT_L_ESSAI: readonly TableQuiSuitLEssai[] = [
  {
    table: rounds,
    partie: rounds.gameId,
    raison: "les tours d'essai, avec leur révélation du classement et leurs fenêtres",
  },
  { table: decisions, equipe: decisions.teamId, raison: "les décisions des tours d'essai" },
  { table: roundResults, equipe: roundResults.teamId, raison: "les résultats des tours d'essai" },
  { table: kpis, equipe: kpis.teamId, raison: "les indicateurs des tours d'essai" },
  { table: scores, equipe: scores.teamId, raison: "les notes de l'IPG des tours d'essai" },
  {
    table: gameRankings,
    partie: gameRankings.gameId,
    equipe: gameRankings.teamId,
    raison: "le classement cumulé de l'essai",
  },
  {
    table: situationInstances,
    equipe: situationInstances.teamId,
    raison: "les situations vécues pendant l'essai, leurs indices et leurs choix de modèle",
  },
  {
    table: companyStates,
    equipe: companyStates.teamId,
    etatAvecIdentifiant: companyStates.state,
    raison: "les états moteur de l'essai, état initial compris : la partie repose le sien",
  },
  { table: inventory, equipe: inventory.teamId, raison: "les stocks de l'essai" },
  { table: financialAccounts, equipe: financialAccounts.teamId, raison: "le bilan requêtable de l'essai" },
  { table: transactions, equipe: transactions.teamId, raison: "le journal des flux de l'essai" },
  {
    table: products,
    partie: products.gameId,
    equipe: products.teamId,
    raison: "les produits de l'essai (table dormante)",
  },
  { table: productionUnits, equipe: productionUnits.teamId, raison: "l'outil de production de l'essai (table dormante)" },
  { table: employees, equipe: employees.teamId, raison: "les effectifs de l'essai (table dormante)" },
  {
    table: eventOccurrences,
    partie: eventOccurrences.gameId,
    equipe: eventOccurrences.teamId,
    raison: "les événements de l'essai (table dormante)",
  },
  {
    table: aidRequests,
    partie: aidRequests.gameId,
    equipe: aidRequests.teamId,
    raison: "les subventions demandées pendant l'essai",
  },
  { table: markets, partie: markets.gameId, raison: "le marché de l'essai (table dormante)" },
  { table: suppliers, partie: suppliers.gameId, raison: "les fournisseurs de l'essai (table dormante)" },
  { table: customers, partie: customers.gameId, raison: "les clients de l'essai (table dormante)" },
];

/** Une table qui pointe vers une partie ou une équipe, et que la bascule laisse en place. */
export const RESTENT_A_LA_PARTIE: readonly { table: PgTable; colonne: PgColumn; raison: string }[] = [
  { table: teams, colonne: teams.gameId, raison: "les équipes restent : la partie repart avec elles" },
  { table: players, colonne: players.teamId, raison: "les élèves restent dans leur équipe" },
  { table: gameRecoveries, colonne: gameRecoveries.gameId, raison: "les codes de reprise restent valables" },
  { table: ltiLiens, colonne: ltiLiens.gameId, raison: "l'activité du cours mène toujours à la partie" },
  {
    table: examenCandidats,
    colonne: examenCandidats.gameId,
    raison: "une copie d'examen est une partie solo, sans essai",
  },
  { table: games, colonne: games.essaiDe, raison: "le lien de l'archive vers sa partie" },
  // L'évaluation entre coéquipiers (migration 0044) : les réglages appartiennent à la
  // partie, et aucun moment n'est atteint pendant l'essai (pairs.service.ts,
  // `momentAtteint`), donc ni publication, ni note d'équipe, ni réponse n'y est écrite.
  { table: pairsEvaluations, colonne: pairsEvaluations.gameId, raison: "les réglages de l'évaluation entre coéquipiers" },
  { table: pairsMoments, colonne: pairsMoments.gameId, raison: "les moments de l'évaluation : aucun pendant l'essai" },
  { table: pairsReponses, colonne: pairsReponses.gameId, raison: "les réponses entre coéquipiers : aucune pendant l'essai" },
  { table: pairsReponses, colonne: pairsReponses.teamId, raison: "les réponses entre coéquipiers : aucune pendant l'essai" },
];


/**
 * LE FILTRE DES LECTEURS TRANSVERSAUX : une archive d'essai n'est pas une partie. Elle
 * ne paraît ni dans la liste de l'enseignant, ni dans son carnet d'usage, ni dans les
 * comptes de l'administration et de la page publique.
 */
export const horsArchivesDEssai: SQL = isNull(games.essaiDe);

/**
 * LE FILTRE DES COMPTEURS (carnet d'usage, page publique) : ni archive, ni partie qui
 * joue encore son essai. Ses tours d'essai ne comptent pas pendant qu'ils se jouent,
 * et partent dans l'archive à la bascule ; la partie compte dès que la vraie commence.
 */
export const partieQuiCompte: SQL = sql`(${games.essaiDe} is null and coalesce(${games.essai}->>'phase', 'fini') = 'fini')`;

/** Le même filtre, pour qui compte des tours sans passer par la table des parties. */
export const tourQuiCompte: SQL = sql`exists (select 1 from ${games} where ${games.id} = ${rounds.gameId} and ${partieQuiCompte})`;

