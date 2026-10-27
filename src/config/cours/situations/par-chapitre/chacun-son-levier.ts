import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  BAISSE_DE_PRIX_DU_COMMERCIAL,
  COUPE_DU_FINANCIER,
  CRITERES,
  anneeDecidee,
  bilanDeLAnnee,
  decisionDuRole,
  type BilanDeLAnnee,
  type Critere,
} from "../../chapitres/decider-ensemble";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER ENSEMBLE » : CHACUN SON LEVIER (Bac STMG, management,
 * palier 1).
 *
 * Pour éviter les disputes, la directrice propose un partage : le commercial fixe les prix, le
 * financier fixe les budgets, chacun de son côté, sans croiser les écrans. Le cas est neuf par sa
 * question : le chapitre comparait chaque rôle décidant de tout ; ici, les deux rôles décident
 * ensemble, mais chacun son levier. L'élève reprend les calculs du chapitre (les écarts avec
 * l'équipe, la comparaison critère par critère) et répond.
 *
 * Les chiffres : l'année rejouée avec les prix du commercial (10 % sous ceux de l'année du cours)
 * et les budgets du financier (publicité, qualité et entretien de l'année du cours divisés par
 * deux), posés chaque trimestre sur l'année du cours (`decisionDuRole`), face à l'année du cours,
 * celle de l'équipe.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'année du partage : les prix du commercial, puis les budgets du financier, chaque trimestre. */
export function anneeDuPartage(code: string) {
  const commercial = decisionDuRole(code, "commercial");
  const financier = decisionDuRole(code, "financier");
  return rejouerAvec(code, "chacun-son-levier:prix-du-commercial-budgets-du-financier", (tour, d) => {
    const avecLePrix = commercial(tour, d) ?? d;
    return financier(tour, avecLePrix);
  });
}

const NOM_DU_CRITERE: Record<Critere, string> = {
  ventes: "les ventes",
  resultat: "le résultat net",
  tresorerie: "la trésorerie",
  clientsPerdus: "les clients perdus",
};
const SENS: Record<Critere, 1 | -1> = { ventes: 1, resultat: 1, tresorerie: 1, clientsPerdus: -1 };
const liste = (ks: readonly Critere[]) =>
  ks.length === 0 ? "" : ks.length === 1 ? NOM_DU_CRITERE[ks[0]!] : `${ks.slice(0, -1).map((k) => NOM_DU_CRITERE[k]).join(", ")} et ${NOM_DU_CRITERE[ks.at(-1)!]}`;

export type Verdict = "le-partage" | "equipe-partout" | "equipe-au-resultat";

/** Le partage face à l'équipe, critère par critère. */
export function chacunSonLevier(c: Cas) {
  const partage = bilanDeLAnnee(anneeDuPartage(c.code));
  const equipe = bilanDeLAnnee(anneeDecidee(c.code, "equipe"));
  const gagnes = CRITERES.filter((k) => SENS[k] * partage[k] > SENS[k] * equipe[k]);
  const verdict: Verdict = partage.resultat > equipe.resultat ? "le-partage" : gagnes.length === 0 ? "equipe-partout" : "equipe-au-resultat";
  return {
    partage,
    equipe,
    ecartDeVentes: partage.ventes - equipe.ventes,
    ecartDeClientsPerdus: partage.clientsPerdus - equipe.clientsPerdus,
    ecartDeResultat: partage.resultat - equipe.resultat,
    ecartDeTresorerie: partage.tresorerie - equipe.tresorerie,
    /** Les critères où le partage fait mieux que l'équipe. */
    gagnes,
    verdict,
  };
}

function tableauDeLEquipe(c: Cas): TableauDeDonnees {
  const k = chacunSonLevier(c);
  return {
    titre: `L'année ${dE(c.entreprise)}, décidée par l'équipe`,
    colonnes: ["Sur l'année"],
    lignes: [
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.equipe.ventes)] },
      { libelle: "Résultat net", valeurs: [eur(k.equipe.resultat)] },
      { libelle: "Trésorerie de fin d'année", valeurs: [eur(k.equipe.tresorerie)] },
      { libelle: `Clients perdus (${c.unites})`, valeurs: [qte(k.equipe.clientsPerdus)] },
    ],
  };
}

function tableauDesDeux(c: Cas): TableauDeDonnees {
  const k = chacunSonLevier(c);
  const ligne = (libelle: string, v: (x: BilanDeLAnnee) => string) => ({ libelle, valeurs: [v(k.partage), v(k.equipe)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, chacun son levier ou l'équipe`,
    colonnes: ["Chacun son levier", "L'équipe"],
    lignes: [
      ligne("Prix de vente moyen", (x) => eur(x.prixMoyen)),
      ligne("Publicité, qualité et entretien", (x) => eur(x.publicite + x.qualite + x.entretien)),
      ligne(`Ventes (${c.unites})`, (x) => qte(x.ventes)),
      ligne("Résultat net", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin d'année", (x) => eur(x.tresorerie)),
      ligne(`Clients perdus (${c.unites})`, (x) => qte(x.clientsPerdus)),
    ],
  };
}

export const CHACUN_SON_LEVIER: Situation = {
  code: "chacun-son-levier",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["decider-ensemble"],
  commanditaire: "La directrice générale",
  titre: "Chacun son levier ?",
  accroche:
    "Pour éviter les disputes, la directrice propose que le commercial fixe seul les prix et le financier seul les budgets. L'arène rejoue l'année : ce partage vaut-il une décision d'équipe ?",
  objectifs: [
    "Chiffrer les écarts entre deux façons de décider",
    "Comparer deux décisions sur plusieurs critères",
    "Répondre à la directrice, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la directrice",
      tableau: tableauDeLEquipe,
      texte: () => [
        `« Mes deux responsables ne sont jamais d'accord. Je propose un partage : le commercial fixe les prix, ${Math.round(BAISSE_DE_PRIX_DU_COMMERCIAL * 100)} % sous ceux de cette année comme il le souhaite ; le financier fixe les budgets de publicité, de qualité et d'entretien, divisés par ${Math.round(1 / COUPE_DU_FINANCIER)} comme il le souhaite. Chacun son levier, plus de réunion. Dites-moi si ce partage vaut ce que l'équipe a décidé ensemble cette année. »`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec ce partage, les mêmes concurrents et la même façon de gérer le reste.",
      ],
      repere: () => "À rendre : les écarts avec l'année de l'équipe, critère par critère, et votre réponse.",
    },
    {
      id: "ventes",
      type: "montants",
      titre: "Les ventes et les clients perdus",
      notions: ["price_elasticity"],
      tableau: tableauDesDeux,
      question: (c) => `Calculez l'écart de ventes, en ${c.unites}, et l'écart de clients perdus (chacun son levier moins l'équipe).`,
      champs: (c) => {
        const k = chacunSonLevier(c);
        return [
          { libelle: `Écart de ventes (${c.unites})`, attendu: k.ecartDeVentes, calcul: `${qte(k.partage.ventes)} − ${qte(k.equipe.ventes)} = ${qte(k.ecartDeVentes)}`, tolerance: 0 },
          {
            libelle: `Écart de clients perdus (${c.unites})`,
            attendu: k.ecartDeClientsPerdus,
            calcul: `${qte(k.partage.clientsPerdus)} − ${qte(k.equipe.clientsPerdus)} = ${qte(k.ecartDeClientsPerdus)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const k = chacunSonLevier(c);
        return [
          `Le prix plus bas attire des clients, la publicité coupée en fait venir moins : ${
            k.ecartDeVentes > 0 ? `au total, ${qte(k.ecartDeVentes)} ${c.unites} de plus` : k.ecartDeVentes < 0 ? `au total, ${qte(-k.ecartDeVentes)} ${c.unites} de moins` : "au total, autant de ventes"
          }, et ${k.ecartDeClientsPerdus > 0 ? `des clients perdus en hausse de ${qte(k.ecartDeClientsPerdus)} ${c.unites}` : "pas plus de clients perdus"}. Chacun a tiré sur son levier sans regarder ce que faisait l'autre.`,
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat et la trésorerie",
      notions: ["net_treasury", "income_statement"],
      tableau: tableauDesDeux,
      question: () => "Calculez l'écart de résultat net et l'écart de trésorerie de fin d'année (chacun son levier moins l'équipe).",
      champs: (c) => {
        const k = chacunSonLevier(c);
        return [
          { libelle: "Écart de résultat net", attendu: k.ecartDeResultat, calcul: `${eur(k.partage.resultat)} − ${retranche(k.equipe.resultat)} = ${eur(k.ecartDeResultat)}`, tolerance: 1 },
          { libelle: "Écart de trésorerie", attendu: k.ecartDeTresorerie, calcul: `${eur(k.partage.tresorerie)} − ${retranche(k.equipe.tresorerie)} = ${eur(k.ecartDeTresorerie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = chacunSonLevier(c);
        return [
          `${k.ecartDeResultat < 0 ? `Le résultat net est plus bas de ${eur(-k.ecartDeResultat)}` : `Le résultat net est plus haut de ${eur(k.ecartDeResultat)}`}, la trésorerie ${k.ecartDeTresorerie < 0 ? `plus basse de ${eur(-k.ecartDeTresorerie)}` : `plus haute de ${eur(k.ecartDeTresorerie)}`} que dans l'année de l'équipe.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["dashboard"],
      question: () => "Quelle phrase envoyez-vous à la directrice ?",
      options: (c) => {
        const k = chacunSonLevier(c);
        const chiffres = `Écart de ventes : ${qte(k.ecartDeVentes)} ${c.unites} ; de résultat net : ${eur(k.ecartDeResultat)} ; de trésorerie : ${eur(k.ecartDeTresorerie)} ; de clients perdus : ${qte(k.ecartDeClientsPerdus)}.`;
        return [
          {
            texte: "Oui : chacun son levier fait un meilleur résultat net",
            juste: k.verdict === "le-partage",
            retour: k.verdict === "le-partage" ? `Oui, cette année. ${chiffres}` : `Non : le résultat net n'est pas plus haut que celui de l'équipe. ${chiffres}`,
          },
          {
            texte: "Non : l'équipe fait mieux sur tous les critères",
            juste: k.verdict === "equipe-partout",
            retour: k.verdict === "equipe-partout" ? `Oui. ${chiffres}` : `Non : le partage fait mieux sur ${liste(k.gagnes) || "un critère"}. ${chiffres}`,
          },
          {
            texte:
              k.verdict === "equipe-au-resultat"
                ? `Non : le partage l'emporte sur ${liste(k.gagnes)}, l'équipe sur le résultat net`
                : "Non : le partage vend plus, mais l'équipe gagne davantage",
            juste: k.verdict === "equipe-au-resultat",
            retour: k.verdict === "equipe-au-resultat" ? `Oui : un levier tiré seul ne voit pas ce que fait l'autre. ${chiffres}` : `Non. ${chiffres}`,
          },
          {
            texte: "Oui : chacun décide sur ce qu'il connaît le mieux, la décision ne peut être que meilleure",
            juste: false,
            retour: `Non : chacun connaît son levier, mais personne ne regarde ce que les deux font ensemble. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
