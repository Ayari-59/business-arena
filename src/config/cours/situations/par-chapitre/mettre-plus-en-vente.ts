import type { Cas } from "../../cas";
import { L_OFFRE_ET_LA_DEMANDE, TRIMESTRE_LU, dE, rang } from "../../chapitres/l-offre-et-la-demande";
import { marcheAuPrix, offreDuTrimestre } from "../../monde/economie-et-marketing";
import { mercatiqueDe } from "../../monde/mercatique-de-nova";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'OFFRE ET LA DEMANDE SUR UN MARCHÉ » : METTRE PLUS EN VENTE
 * (seconde, sciences économiques et sociales, palier 1).
 *
 * Le directeur commercial croit qu'en mettant plus en vente, NOVA aurait eu plus de clients. Le cas
 * refait le 1er trimestre du monde du cours avec 20 % de plus mis en vente (les 4 778 enceintes de la
 * ligne, plus 20 %, à l'enceinte la plus proche), au même prix : la demande reçue ne bouge pas (la
 * droite de demande ne dépend que du prix). L'élève refait le calcul du chapitre (la quantité
 * échangée, la plus petite de la demande et de l'offre) dans les deux cas, et répond. Le verdict se
 * calcule : NOVA vend plus là où des acheteurs repartaient sans rien, et rien de plus au-delà.
 *
 * Le cas est neuf par sa question : le chapitre fait varier le prix ; ici, c'est l'offre qui change,
 * et l'on constate qu'elle ne fait pas la demande. Il joue dans le monde du cours
 * (monde/economie-et-marketing.ts), chez NOVA seule.
 */

/** Ce que le directeur commercial veut mettre en vente en plus : 20 % (hypothèse du cas). */
export const HAUSSE_DE_LA_MISE_EN_VENTE = 0.2;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${Math.round(t * 100)} %`;

export type Verdict = "vend-plus" | "rien-de-plus";

/** Le 1er trimestre, tel que la ligne l'a fabriqué et avec 20 % de plus mis en vente. */
export function miseEnVenteAugmentee(c: Cas) {
  const f = mercatiqueDe(c);
  const plan = offreDuTrimestre(f);
  const pose = Math.round(plan * (1 + HAUSSE_DE_LA_MISE_EN_VENTE));
  const sans = marcheAuPrix(f);
  const avec = marcheAuPrix(f, { offre: pose });
  const verdict: Verdict = avec.echangee > sans.echangee ? "vend-plus" : "rien-de-plus";
  return { plan, pose, sans, avec, verdict, demandeEnPlus: avec.demande - sans.demande, echangeeEnPlus: avec.echangee - sans.echangee };
}

function tableauDesDeuxTrimestres(c: Cas): TableauDeDonnees {
  const m = miseEnVenteAugmentee(c);
  return {
    titre: `${c.entreprise} au ${rang(TRIMESTRE_LU)} trimestre, en ${c.unites}`,
    colonnes: ["Trimestre fabriqué", `Avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus`],
    lignes: [
      { libelle: "Demande reçue", valeurs: [qte(m.sans.demande), qte(m.avec.demande)] },
      { libelle: "Quantité mise en vente", valeurs: [qte(m.sans.offre), qte(m.avec.offre)] },
    ],
  };
}

export const METTRE_PLUS_EN_VENTE: Situation = {
  code: "mettre-plus-en-vente",
  parcours: "seconde-ses",
  palier: 1,
  blocs: [],
  reprend: [L_OFFRE_ET_LA_DEMANDE.code],
  commanditaire: "Le directeur commercial",
  titre: "Mettre plus en vente",
  accroche:
    "Le directeur commercial en est sûr : avec plus à vendre, il y aurait eu plus de clients. Refaire le trimestre avec 20 % de plus mis en vente, calculer ce qui s'échange, et lui répondre.",
  objectifs: [
    "Calculer la quantité échangée quand l'offre change",
    "Distinguer la demande reçue et la quantité vendue",
    "Répondre au directeur commercial avec les chiffres",
  ],
  libre: false,
  entreprises: L_OFFRE_ET_LA_DEMANDE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du directeur commercial",
      tableau: tableauDesDeuxTrimestres,
      texte: (c) => {
        const m = miseEnVenteAugmentee(c);
        return [
          `« Au ${rang(TRIMESTRE_LU)} trimestre, nous avons mis ${qte(m.sans.offre)} ${c.unites} en vente. Avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus, nous aurions eu plus de clients, j'en suis sûr. Dites-moi si j'ai raison, et ce que nous aurions vendu. »`,
          `Pas de cours cette fois. Le tableau refait le ${rang(TRIMESTRE_LU)} trimestre ${dE(c.entreprise)} avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus mis en vente, soit ${qte(m.pose)} ${c.unites} : seule cette décision change, le prix et les concurrents restent les mêmes.`,
        ];
      },
      repere: () => "À rendre : ce qui s'échange dans les deux cas, ce qui reste, et votre réponse.",
    },
    {
      id: "ce-qui-s-echange",
      type: "montants",
      titre: "Ce qui s'échange, dans les deux cas",
      notions: ["demand_market_share", "stock"],
      tableau: tableauDesDeuxTrimestres,
      question: () => "D'après le tableau, calculez la quantité échangée dans le trimestre fabriqué, puis avec la quantité mise en vente augmentée.",
      champs: (c) => {
        const m = miseEnVenteAugmentee(c);
        return [
          {
            libelle: "Quantité échangée, trimestre fabriqué",
            attendu: m.sans.echangee,
            calcul: `la plus petite de ${qte(m.sans.demande)} et ${qte(m.sans.offre)} : ${qte(m.sans.echangee)}`,
            tolerance: 0,
          },
          {
            libelle: `Quantité échangée, avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus`,
            attendu: m.avec.echangee,
            calcul: `la plus petite de ${qte(m.avec.demande)} et ${qte(m.avec.offre)} : ${qte(m.avec.echangee)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const m = miseEnVenteAugmentee(c);
        return [
          m.demandeEnPlus === 0
            ? `La demande reçue est la même dans les deux cas : ${qte(m.sans.demande)} ${c.unites}. Mettre plus en vente n'a fait venir aucun acheteur de plus.`
            : `La demande reçue passe de ${qte(m.sans.demande)} à ${qte(m.avec.demande)} ${c.unites}.`,
        ];
      },
    },
    {
      id: "ce-qui-reste",
      type: "montants",
      titre: "Ce qui reste, avec plus mis en vente",
      notions: ["stock", "capacity"],
      tableau: tableauDesDeuxTrimestres,
      question: () =>
        "Avec la quantité mise en vente augmentée, calculez la demande non servie, puis l'offre non vendue (zéro s'il n'y en a pas).",
      champs: (c) => {
        const m = miseEnVenteAugmentee(c);
        return [
          {
            libelle: `Demande non servie, avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus`,
            attendu: m.avec.nonServie,
            calcul: `${qte(m.avec.demande)} − ${qte(m.avec.echangee)} = ${qte(m.avec.nonServie)}`,
            tolerance: 0,
          },
          {
            libelle: `Offre non vendue, avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus`,
            attendu: m.avec.nonVendue,
            calcul: `${qte(m.avec.offre)} − ${qte(m.avec.echangee)} = ${qte(m.avec.nonVendue)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const m = miseEnVenteAugmentee(c);
        return [
          m.avec.nonServie > 0
            ? `Même avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus, des acheteurs repartent sans rien : la demande dépassait l'offre de plus que ce qui a été ajouté.`
            : m.sans.nonServie > 0
              ? `Tous les acheteurs sont servis, et il reste ${qte(m.avec.nonVendue)} ${c.unites} sans acheteur : une partie seulement de ce qui a été ajouté a trouvé preneur.`
              : `Tous les acheteurs étaient déjà servis : ce qui a été ajouté reste sans acheteur, avec le reste.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      notions: ["demand_market_share"],
      question: () => "Que répondez-vous au directeur commercial ?",
      options: (c) => {
        const m = miseEnVenteAugmentee(c);
        const faits = `avec ${pct(HAUSSE_DE_LA_MISE_EN_VENTE)} de plus mis en vente, la demande reçue reste ${qte(m.avec.demande)} ${c.unites}, et la quantité échangée ${
          m.echangeeEnPlus === 0 ? `reste ${qte(m.avec.echangee)}` : `passe de ${qte(m.sans.echangee)} à ${qte(m.avec.echangee)}`
        }`;
        const servis = m.avec.nonServie > 0 ? "l'offre ajoutée en sert une partie" : "l'offre ajoutée les sert tous, et le reste demeure sans acheteur";
        return [
          {
            texte: "Elle vend plus, sans attirer un acheteur de plus",
            juste: m.verdict === "vend-plus",
            retour:
              m.verdict === "vend-plus"
                ? `Oui : ${faits}. Des acheteurs repartaient sans rien : ${servis}. Mais elle n'en fait venir aucun.`
                : `Non : ${faits}. Tous les acheteurs étaient déjà servis.`,
          },
          {
            texte: "Elle ne vend rien de plus : la demande était servie",
            juste: m.verdict === "rien-de-plus",
            retour:
              m.verdict === "rien-de-plus"
                ? `Oui : ${faits}. L'offre dépassait déjà la demande : ce qui est ajouté reste sans acheteur.`
                : `Non : ${faits}. Des acheteurs repartaient sans rien : ${servis}.`,
          },
          {
            texte: "Elle attire de nouveaux acheteurs, et vend donc davantage",
            juste: false,
            retour: `Non : ${faits}. La demande dépend du prix, de la qualité, de la publicité et de la saison, pas de ce qui est mis en vente.`,
          },
        ];
      },
    },
  ],
};
