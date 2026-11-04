import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_PREVISION } from "../../chapitres/la-prevision-des-ventes";
import { ELECTRO_COMPOSANTS } from "../../monde/exercice-de-nova";
import { ajustementLineaire, novaEnN, previsionDeNPlus1 } from "../../monde/prevision-des-ventes";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRÉVOIR LES VENTES : TENDANCE ET SAISONS » : LES JEUX DU PRINTEMPS
 * (contrôle de gestion, palier 4).
 *
 * Électro-Composants Lyon, le fournisseur des jeux de composants (un jeu par enceinte), réserve sa
 * production 3 mois à l'avance : il demande à NOVA combien de jeux lui réserver pour le
 * printemps de N + 1 (le 2e trimestre). L'élève refait la prévision de ce trimestre, sans cours :
 * la tendance du rang 14, le marché prévu, les ventes de NOVA à sa part de N. Puis il voit que la
 * prévision dépasse ce que la ligne peut monter : NOVA ne consommera pas plus de jeux qu'elle ne
 * monte d'enceintes. La réponse est la capacité de la ligne, pas la prévision.
 *
 * HYPOTHÈSE DU CAS : NOVA ne garde pas de jeux en stock d'un trimestre à l'autre, et ne sous-traite
 * rien au printemps ; un jeu réservé et non monté resterait à sa charge.
 */

const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const dec3 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const pct = (p: number) => `${qte(p, 1)} %`;

/** Le trimestre du cas : le printemps de N + 1, le 2e trimestre (rang 14). */
export const TRIMESTRE_DU_CAS = 2;

/** Les chiffres du cas. */
export function jeuxDuPrintemps(_c?: Pick<Cas, "code">) {
  const lin = ajustementLineaire();
  const n = novaEnN();
  const p = previsionDeNPlus1();
  const t = p.trimestres[TRIMESTRE_DU_CAS - 1]!;
  const montees = Math.min(t.nova, p.capacite);
  return { lin, n, p, t, montees, sansEnceinte: t.nova - montees };
}

export const LES_JEUX_DU_PRINTEMPS: Situation = {
  code: "les-jeux-du-printemps",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["la-prevision-des-ventes"],
  commanditaire: "Le fournisseur de composants",
  titre: "Les jeux du printemps",
  accroche: "Électro-Composants réserve sa production 3 mois à l'avance : combien de jeux de composants NOVA doit-elle lui demander pour le printemps de N + 1 ?",
  objectifs: [
    "Prolonger une tendance linéaire jusqu'au trimestre à prévoir",
    "Appliquer un coefficient saisonnier et une part de marché",
    "Confronter une prévision des ventes à la capacité de production",
    "Rendre au fournisseur une quantité justifiée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PREVISION,
    pourquoi: "ce cas reprend le chapitre « Prévoir les ventes : tendance et saisons », qui se calcule sur le marché des enceintes de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du fournisseur",
      texte: () => {
        const { p } = jeuxDuPrintemps();
        return [
          `« Nous réservons nos lignes 3 mois à l'avance. Combien de jeux de composants voulez-vous pour avril, mai et juin N + 1 ? Un jeu réservé est un jeu facturé, ${qte(ELECTRO_COMPOSANTS.prixDuJeu)} € pièce. »`,
          `Pas de cours cette fois : vous avez la tendance du marché, ses coefficients saisonniers et la part de NOVA en N. Une enceinte consomme un jeu ; la ligne monte ${qte(p.capacite)} enceintes par trimestre, et NOVA ne garde pas de jeux en stock d'un trimestre à l'autre.`,
        ];
      },
      tableau: () => {
        const { lin, n, p } = jeuxDuPrintemps();
        return {
          titre: "Ce que NOVA sait de son marché",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Tendance du marché (t : rang du trimestre, 1 au 1er trimestre de N − 2)", valeurs: [`y = ${qte(lin.a)} t + ${qte(lin.b)}`] },
            { libelle: "Coefficient saisonnier du 2e trimestre", valeurs: [dec3(p.coefficients.coefficients[TRIMESTRE_DU_CAS - 1]!)] },
            { libelle: "Ventes de NOVA en N", valeurs: [`${qte(n.total)} enceintes`] },
            { libelle: "Marché des enceintes en N", valeurs: [`${qte(n.marcheTotal)} enceintes`] },
            { libelle: "Capacité de la ligne de montage", valeurs: [`${qte(p.capacite)} enceintes par trimestre`] },
          ],
        };
      },
      repere: () => "À rendre : la tendance du trimestre, le marché prévu, les ventes de NOVA prévues, ce que la ligne pourra monter, et le nombre de jeux à réserver.",
    },
    {
      id: "la-prevision-du-printemps",
      type: "montants",
      titre: "La prévision du printemps",
      notions: ["seasonality", "demand_market_share"],
      question: () => "Prévoyez le 2e trimestre de N + 1 : sa tendance, le marché prévu (à l'enceinte), la part de NOVA en N (au dixième) et ses ventes prévues (à l'enceinte).",
      champs: () => {
        const { lin, n, t } = jeuxDuPrintemps();
        return [
          { libelle: "Tendance du rang 14, en enceintes", attendu: t.tendance, calcul: `${qte(lin.a)} × ${t.rang} + ${qte(lin.b)} = ${qte(t.tendance)}` },
          { libelle: "Marché prévu, en enceintes", attendu: t.marche, tolerance: 1, calcul: `${qte(t.tendance)} × ${dec3(t.coefficient)} = ${qte(t.tendance * t.coefficient)}, soit ${qte(t.marche)}` },
          { libelle: "Part de NOVA en N, en %", attendu: n.part, tolerance: 0.05, calcul: `${qte(n.total)} ÷ ${qte(n.marcheTotal)} = ${pct(n.part)}` },
          { libelle: "Ventes de NOVA prévues, en enceintes", attendu: t.nova, tolerance: 1, calcul: `${qte(t.marche)} × ${pct(n.part)} = ${qte((t.marche * n.part) / 100)}, soit ${qte(t.nova)}` },
        ];
      },
      explication: () => {
        const { t } = jeuxDuPrintemps();
        return [`Les clients devraient demander ${qte(t.nova)} enceintes à NOVA au printemps de N + 1 : c'est la demande, pas encore la production.`];
      },
    },
    {
      id: "ce-que-la-ligne-montera",
      type: "montants",
      titre: "Ce que la ligne montera",
      notions: ["capacity"],
      question: () => "Combien d'enceintes la ligne montera-t-elle au printemps, et combien de demandes resteront sans enceinte ?",
      champs: () => {
        const { t, p, montees, sansEnceinte } = jeuxDuPrintemps();
        return [
          { libelle: "Enceintes montées au printemps", attendu: montees, calcul: `la plus petite de la demande (${qte(t.nova)}) et de la capacité (${qte(p.capacite)}) : ${qte(montees)}` },
          { libelle: "Demandes sans enceinte", attendu: sansEnceinte, calcul: `${qte(t.nova)} − ${qte(montees)} = ${qte(sansEnceinte)}` },
        ];
      },
      explication: () => {
        const { sansEnceinte } = jeuxDuPrintemps();
        return [`La prévision dépasse la ligne de ${qte(sansEnceinte)} enceintes. Sans stock d'enceintes ni sous-traitance, ces demandes seront perdues.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au fournisseur",
      notions: ["seasonality", "capacity"],
      question: () => "Combien de jeux NOVA réserve-t-elle pour le printemps de N + 1 ?",
      options: () => {
        const { t, montees, sansEnceinte, n } = jeuxDuPrintemps();
        return [
          { texte: `${qte(montees)} jeux, ce que la ligne montera`, juste: true, retour: `Oui. La demande prévue est de ${qte(t.nova)} enceintes, mais la ligne n'en montera que ${qte(montees)} : les ${qte(sansEnceinte)} jeux de plus resteraient sur l'étagère, facturés. La prévision sert aussi à cela : voir le goulot avant de commander.` },
          { texte: `${qte(t.nova)} jeux, la demande prévue du trimestre`, juste: false, retour: `Non : NOVA ne consommera pas de jeux pour des enceintes qu'elle ne montera pas. Les ${qte(sansEnceinte)} jeux de trop seraient payés sans servir.` },
          { texte: `${qte(t.plan)} jeux, la prévision arrondie à la centaine`, juste: false, retour: "Non : l'arrondi du plan ne change rien à la limite de la ligne. Au-delà de sa capacité, un jeu ne sert pas." },
          { texte: `${qte(n.ventes[TRIMESTRE_DU_CAS - 1]!)} jeux, comme au printemps de N`, juste: false, retour: "Non : le marché a grandi, et la saison du printemps aussi. Réserver comme en N priverait la ligne de jeux qu'elle peut monter." },
        ];
      },
    },
  ],
};
