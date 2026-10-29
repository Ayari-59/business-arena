import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_DECISION } from "../../chapitres/decider-ensemble";
import { BAISSE_DE_PRIX_DU_COMMERCIAL, COUPE_DU_FINANCIER, LEVIERS_DES_FACONS, anneeDecidee } from "../../monde/direction-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER ENSEMBLE » : CHACUN SON LEVIER (Bac STMG, management, palier 1).
 *
 * Pour éviter les disputes, la directrice de NOVA propose un partage : le commercial fixe le prix, le
 * financier fixe les budgets d'entretien et de prévention, chacun de son côté, sans croiser les
 * écrans. Le cas est neuf par sa question : le chapitre comparait chaque rôle décidant de tout ; ici,
 * les deux rôles décident ensemble, mais chacun son levier. L'élève reprend les calculs du chapitre
 * (les écarts avec l'équipe) et répond.
 *
 * Les chiffres : l'année N + 1 du chapitre (`anneeDecidee`, monde/direction-de-nova.ts), au prix du
 * commercial (10 % sous celui du plan) et aux budgets du financier (divisés par deux), face à celle de
 * l'équipe.
 *
 * CE QUI A CHANGÉ. Le cas rejouait l'année de l'arène dans les neuf entreprises ; il se joue chez
 * NOVA : le partage fait 329 958,48 € de résultat des choix et refuse 6 540 enceintes.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** L'année du partage : le prix du commercial, les budgets du financier. */
export const anneeDuPartage = () => anneeDecidee({ prix: LEVIERS_DES_FACONS.commercial.prix, budgets: LEVIERS_DES_FACONS.financier.budgets });

export type Verdict = "le-partage" | "l-equipe";

/** Le partage face à l'équipe. */
export function chacunSonLevier(_c?: Cas) {
  const p = anneeDuPartage();
  const e = anneeDecidee(LEVIERS_DES_FACONS.equipe);
  const ecartDeResultat = auCentime(p.resultat - e.resultat);
  return {
    p,
    e,
    ecartDeVentes: p.production - e.production,
    ecartDeRefusees: p.refusees - e.refusees,
    ecartDeResultat,
    verdict: (ecartDeResultat > 0 ? "le-partage" : "l-equipe") as Verdict,
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
  accroche: "Pour éviter les disputes, la directrice propose que le commercial fixe seul le prix et le financier seul les budgets. Ce partage vaut-il une décision d'équipe ?",
  objectifs: ["Chiffrer les écarts entre deux façons de décider", "Comparer deux décisions sur plusieurs critères", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DECISION,
    pourquoi: "le cas reprend l'année N + 1 de NOVA du chapitre, sa demande, sa ligne, son entretien et sa qualité.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la directrice",
      texte: () => [
        `« Nos réunions tournent à la dispute. Je propose un partage : le commercial fixe le prix, seul, et il veut le baisser de ${Math.round(BAISSE_DE_PRIX_DU_COMMERCIAL * 100)} % ; le financier fixe les budgets d'entretien et de prévention, seul, et il veut les diviser par ${Math.round(1 / COUPE_DU_FINANCIER)}. Chacun son levier, plus de dispute. Dites-moi ce que ce partage donnerait sur l'année, face à la décision d'équipe. » La directrice générale`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      tableau: () => {
        const k = chacunSonLevier();
        return {
          titre: "L'année N + 1 de NOVA, partagée ou décidée en équipe",
          colonnes: ["Partage", "Équipe"],
          lignes: [
            { libelle: "Prix d'une enceinte", valeurs: [eur(k.p.prix), eur(k.e.prix)] },
            { libelle: "Entretien et prévention de l'année", valeurs: [eur(k.p.entretien + k.p.prevention), eur(k.e.entretien + k.e.prevention)] },
            { libelle: "Enceintes vendues", valeurs: [qte(k.p.production), qte(k.e.production)] },
            { libelle: "Clients refusés", valeurs: [qte(k.p.refusees), qte(k.e.refusees)] },
            { libelle: "Résultat des choix", valeurs: [eur(k.p.resultat), eur(k.e.resultat)] },
          ],
        };
      },
      repere: () => "À rendre : les écarts de ventes, de clients refusés et de résultat des choix face à l'équipe, et votre réponse.",
    },
    {
      id: "les-ecarts",
      type: "montants",
      titre: "Les écarts avec l'équipe",
      notions: ["dashboard", "capacity"],
      question: () => "Calculez l'écart de ventes, l'écart de clients refusés et l'écart de résultat des choix (partage moins équipe).",
      champs: () => {
        const k = chacunSonLevier();
        return [
          { libelle: "Écart de ventes (enceintes)", attendu: k.ecartDeVentes, calcul: `${qte(k.p.production)} − ${qte(k.e.production)} = ${qte(k.ecartDeVentes)}`, tolerance: 0 },
          { libelle: "Écart de clients refusés (enceintes)", attendu: k.ecartDeRefusees, calcul: `${qte(k.p.refusees)} − ${qte(k.e.refusees)} = ${qte(k.ecartDeRefusees)}`, tolerance: 0 },
          { libelle: "Écart de résultat des choix", attendu: k.ecartDeResultat, calcul: `${eur(k.p.resultat)} − ${eur(k.e.resultat)} = ${eur(k.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = chacunSonLevier();
        return [
          `Le prix baissé attire des clients que la ligne ne peut pas servir, et la ligne mal entretenue en sert encore moins : ${qte(k.p.refusees)} clients refusés. Chaque enceinte vendue laisse ${eur(k.p.margeUnitaire)} au lieu de ${eur(k.e.margeUnitaire)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = chacunSonLevier();
        return [
          {
            texte: `Le partage ferait ${eur(-k.ecartDeResultat)} de moins que l'équipe`,
            juste: k.verdict === "l-equipe",
            retour:
              k.verdict === "l-equipe"
                ? `Oui : chacun tire son levier sans voir ce que l'autre en fait, ni ce que l'atelier peut monter. Le partage vend ${qte(k.ecartDeVentes)} enceintes de plus, mais refuse ${qte(k.p.refusees)} clients et fait ${eur(k.p.resultat)} de résultat des choix, contre ${eur(k.e.resultat)}.`
                : `Non : le partage fait mieux, de ${eur(k.ecartDeResultat)}.`,
          },
          {
            texte: "Le partage vaut mieux : chacun décide de ce qu'il connaît le mieux, et les ventes montent",
            juste: k.verdict === "le-partage",
            retour:
              k.verdict === "le-partage"
                ? `Oui : le partage fait ${eur(k.ecartDeResultat)} de plus.`
                : `Non : les ventes montent de ${qte(k.ecartDeVentes)} enceintes, mais à une marge plus faible, et ${qte(k.p.refusees)} clients repartent. Le résultat des choix baisse de ${eur(-k.ecartDeResultat)}.`,
          },
          {
            texte: "Les deux se valent : le prix et les budgets ne se touchent pas, on peut les décider séparément",
            juste: false,
            retour: "Non : le prix fait la demande, l'entretien fait ce que la ligne peut monter. Les deux leviers se rencontrent dans l'atelier : il faut les décider ensemble.",
          },
        ];
      },
    },
  ],
};
