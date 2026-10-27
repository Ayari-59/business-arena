import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { bilanDeLAnnee, strategie } from "../../chapitres/couts-ou-differenciation";
import { LIRE_LA_STRATEGIE_DES_CONCURRENTS, dE, strategiesDesConcurrents } from "../../chapitres/lire-la-strategie-des-concurrents";
import { anneeDeReference, rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LIRE LA STRATÉGIE DE SES CONCURRENTS » : ALLER DANS L'ESPACE LIBRE
 * (Stratégie et management, palier 2).
 *
 * Le chapitre se termine sur une question qu'il laisse ouverte : une place libre sur la carte,
 * des clients l'attendent-ils, et une offre y paierait-elle ses coûts ? La directrice la pose.
 * L'élève refait les calculs du chapitre (le prix de la place, l'indice de prix, la part de
 * marché), lit l'année rejouée, et répond.
 *
 * LE PRIX DE LA PLACE, selon la règle du cours : celui de l'enseigne qui a laissé sa place en
 * quittant le marché, ou, s'il n'y en a pas, le milieu du plus grand écart de prix entre deux
 * enseignes voisines (la moyenne de leurs deux prix). L'arène rejoue l'année du cours avec ce
 * prix dès le premier trimestre, et rien d'autre de changé : la directrice veut savoir ce que
 * vaut la place elle-même, avant d'y engager des budgets. Le prix de chaque trimestre est celui
 * de la gestion équilibrée, multiplié par le rapport entre le prix de la place et le prix moyen
 * de l'entreprise (en gamme, celui de chaque référence).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const signe = (x: number) => (x > 0 ? `+${pct(x)}` : pct(x));

export type VerdictDeLEspaceLibre = "y-aller" | "rester";

/** La place libre de la carte, son prix, et l'année rejouée à ce prix. */
export function espaceLibre(c: Cas) {
  const k = strategiesDesConcurrents(c);
  const e = k.entreprise;
  const p = k.partie;
  const g = k.plusGrand;
  const prixVise = p ? p.prix : auCentime((g.bas.prix + g.haut.prix) / 2);
  const facteur = prixVise / e.prix;
  const variation = auDixieme((facteur - 1) * 100);
  const indiceVise = Math.round((prixVise / k.prixDuMarche) * 100);
  const avant = bilanDeLAnnee("annee-du-cours", anneeDeReference(c.code));
  const rejouee = rejouerAvec(
    c.code,
    "lire-la-strategie-des-concurrents-espace-libre",
    strategie({ prix: facteur, qualite: 1, marketing: 1, production: 1 }),
  );
  const apres = bilanDeLAnnee("espace-libre", rejouee);
  // UNE ENTREPRISE DÉFAILLANTE NE VEND PLUS : ses trimestres manquants ne pèsent plus sur le
  // résultat de l'année, qui peut alors sembler meilleur. La défaillance tranche avant lui.
  // (Sur l'année du cours, le prix de la place ne mène à la défaillance dans aucune entreprise.)
  const k1 = rejouee.findIndex((r) => r.defaillant === true);
  const defaillance = k1 < 0 ? null : k1 + 1;
  const ecartDeResultat = apres.resultat - avant.resultat;
  const verdict: VerdictDeLEspaceLibre = defaillance === null && ecartDeResultat > 0 ? "y-aller" : "rester";
  return { k, e, p, g, prixVise, facteur, variation, indiceVise, avant, apres, defaillance, ecartDeResultat, verdict };
}

/** Où est la place, dans une phrase. */
const laPlace = (x: ReturnType<typeof espaceLibre>) =>
  x.p ? `la place ${dE(x.p.nom)}, qui a quitté le marché` : `l'écart entre ${x.g.bas.nom} et ${x.g.haut.nom}`;

export const ALLER_DANS_L_ESPACE_LIBRE: Situation = {
  code: "aller-dans-l-espace-libre",
  parcours: "strategie",
  palier: 2,
  blocs: [],
  reprend: [LIRE_LA_STRATEGIE_DES_CONCURRENTS.code],
  commanditaire: "La directrice",
  titre: "Aller dans l'espace libre",
  accroche:
    "La carte du marché montre une place que personne ne tient. La directrice veut savoir si l'entreprise aurait gagné à y placer son prix, et l'arène rejoue l'année pour le dire.",
  objectifs: [
    "Repérer l'espace libre et le prix qui le vise",
    "Calculer un indice de prix et une part de marché",
    "Lire ce qu'un repositionnement change au résultat de l'année",
    "Répondre à la directrice, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: LIRE_LA_STRATEGIE_DES_CONCURRENTS.entreprises!.codes,
    pourquoi: "ce cas lit le prix moyen de chaque enseigne dans ses ventes, et chez VOLT FITNESS le chiffre d'affaires vient d'abord des abonnés gardés.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice",
      texte: (c) => {
        const x = espaceLibre(c);
        return [
          `« Votre carte du marché montre un espace libre : ${laPlace(x)}. Si ${c.entreprise} y avait placé son prix dès le premier trimestre, sans rien changer d'autre, l'année aurait-elle été meilleure ? Je veux le savoir avant d'y engager des budgets. »`,
          x.p
            ? `Pas de cours cette fois : les calculs sont ceux du chapitre. Le prix de la place est le prix moyen ${dE(x.p.nom)}. L'arène a rejoué l'année avec ce prix, tout le reste identique.`
            : "Pas de cours cette fois : les calculs sont ceux du chapitre. Le prix de la place est le milieu de l'écart : la moyenne des prix des deux enseignes voisines. L'arène a rejoué l'année avec ce prix, tout le reste identique.",
        ];
      },
      tableau: (c) => {
        const x = espaceLibre(c);
        return {
          titre: "L'année du cours, enseigne par enseigne",
          colonnes: x.k.enseignes.map((y) => y.nom),
          lignes: [
            { libelle: "Prix moyen", valeurs: x.k.enseignes.map((y) => eur(y.prix)) },
            { libelle: "Indice de prix", valeurs: x.k.enseignes.map((y) => qte(y.indicePrix)) },
            { libelle: "Indice de qualité", valeurs: x.k.enseignes.map((y) => qte(y.indiceQualite)) },
            { libelle: "Part de marché", valeurs: x.k.enseignes.map((y) => pct(y.part)) },
            { libelle: "Toujours sur le marché en fin d'année", valeurs: x.k.enseignes.map((y) => (y.defaillante ? "non" : "oui")) },
          ],
        };
      },
      repere: (c) =>
        `À rendre : le prix de la place, ce qu'il change au prix ${dE(c.entreprise)}, son indice de prix, ce que l'année rejouée vend et gagne, et votre réponse. Le prix moyen du marché de l'année du cours est de ${eur(espaceLibre(c).k.prixDuMarche)}.`,
    },
    {
      id: "prix",
      type: "montants",
      titre: "Le prix de la place",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => {
        const x = espaceLibre(c);
        return x.p
          ? `Le prix de la place est celui ${dE(x.p.nom)}. Relevez-le, puis calculez ce qu'il change au prix moyen ${dE(c.entreprise)} (${eur(x.e.prix)}), en pourcentage au dixième, et l'indice de prix qu'il donnerait, à l'unité, au prix moyen du marché de l'année du cours.`
          : `Le prix de la place est la moyenne des prix ${dE(x.g.bas.nom)} et ${dE(x.g.haut.nom)}. Calculez-le, au centime, puis ce qu'il change au prix moyen ${dE(c.entreprise)} (${eur(x.e.prix)}), en pourcentage au dixième, et l'indice de prix qu'il donnerait, à l'unité, au prix moyen du marché de l'année du cours.`;
      },
      champs: (c) => {
        const x = espaceLibre(c);
        return [
          {
            libelle: "Prix de la place",
            attendu: x.prixVise,
            calcul: x.p ? `Le prix moyen ${dE(x.p.nom)} : ${eur(x.prixVise)}` : `(${eur(x.g.bas.prix)} + ${eur(x.g.haut.prix)}) ÷ 2 = ${eur(x.prixVise)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Variation du prix (%)",
            attendu: x.variation,
            calcul: `(${eur(x.prixVise)} ÷ ${eur(x.e.prix)} − 1) × 100 = ${pct(x.variation)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Indice de prix de la place",
            attendu: x.indiceVise,
            calcul: `${eur(x.prixVise)} ÷ ${eur(x.k.prixDuMarche)} × 100 = ${qte(x.indiceVise)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = espaceLibre(c);
        return [
          `Pour aller dans l'espace libre, ${c.entreprise} change son prix de ${signe(x.variation)} : son indice de prix passerait de ${qte(x.e.indicePrix)} à ${qte(x.indiceVise)}, sans que sa qualité bouge.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'année rejouée dans l'espace libre",
      notions: ["demand_market_share", "income_statement"],
      tableau: (c) => {
        const x = espaceLibre(c);
        const deux = [x.avant, x.apres];
        return {
          titre: "L'année du cours, et l'année rejouée au prix de la place",
          colonnes: ["L'année du cours", "Au prix de la place"],
          lignes: [
            { libelle: "Prix moyen de vente", valeurs: deux.map((y) => eur(y.prixMoyen)) },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: deux.map((y) => qte(y.ventes)) },
            { libelle: `Marché de l'année (${c.unites})`, valeurs: deux.map((y) => qte(y.marche)) },
            { libelle: "Marge sur coût variable", valeurs: deux.map((y) => eur(y.marge)) },
            { libelle: "Résultat de l'exercice", valeurs: deux.map((y) => eur(y.resultat)) },
            { libelle: "Défaillance", valeurs: ["non", x.defaillance === null ? "non" : `à la fin du T${x.defaillance}`] },
          ],
        };
      },
      question: () =>
        "Calculez la part de marché de l'année rejouée au prix de la place, en pourcentage au dixième, puis l'écart de résultat de l'exercice avec l'année du cours.",
      champs: (c) => {
        const x = espaceLibre(c);
        return [
          {
            libelle: "Part de marché au prix de la place (%)",
            attendu: x.apres.part,
            calcul: `${qte(x.apres.ventes)} ÷ ${qte(x.apres.marche)} × 100 = ${pct(x.apres.part)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Écart de résultat, place moins année du cours",
            attendu: x.ecartDeResultat,
            calcul: `${eur(x.apres.resultat)} − ${retranche(x.avant.resultat)} = ${eur(x.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = espaceLibre(c);
        const plusCher = x.variation > 0;
        return [
          ...(x.defaillance !== null
            ? [
                `Attention : au prix de la place, ${c.entreprise} tombe en défaillance à la fin du T${x.defaillance}, et ne vend plus ensuite. Le résultat de l'année ne compte plus les trimestres qui manquent : ${x.ecartDeResultat > 0 ? "s'il paraît meilleur, c'est que l'entreprise a cessé son activité" : "il ne dit même pas tout de la perte"}.`,
              ]
            : []),
          `La part de marché passe de ${pct(x.avant.part)} à ${pct(x.apres.part)}, et la marge sur coût variable de ${eur(x.avant.marge)} à ${eur(x.apres.marge)}. ${
            plusCher
              ? `${c.entreprise} vend moins, plus cher : ${x.apres.marge > x.avant.marge ? "la marge de l'année y gagne" : "la marge de l'année y perd"}.`
              : `${c.entreprise} vend plus, moins cher : ${x.apres.marge > x.avant.marge ? "la marge de l'année y gagne" : "la marge de l'année y perd"}.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["segmentation"],
      question: () => "Quelle phrase envoyez-vous à la directrice ?",
      options: (c) => {
        const x = espaceLibre(c);
        const chiffres = `${eur(x.apres.resultat)} de résultat au prix de la place, contre ${eur(x.avant.resultat)} dans l'année du cours`;
        const chute = x.defaillance !== null ? `au prix de la place, ${c.entreprise} tombe en défaillance à la fin du T${x.defaillance}` : null;
        return [
          {
            texte: "Oui : la place paie, l'année aurait été meilleure",
            juste: x.verdict === "y-aller",
            retour:
              x.verdict === "y-aller"
                ? `Oui : ${chiffres}, soit ${eur(x.ecartDeResultat)} de plus. À ce prix, la place paie mieux que la position d'aujourd'hui. Reste à la tenir : un concurrent peut la viser aussi.`
                : chute
                  ? `Non : ${chute}. Une entreprise qui disparaît n'a pas fait une meilleure année.`
                  : `Non : ${chiffres}. La place est libre, mais l'année y aurait été moins bonne.`,
          },
          {
            texte: "Non : la place est libre, mais l'année aurait été moins bonne",
            juste: x.verdict === "rester",
            retour:
              x.verdict === "rester"
                ? `Oui : ${chute ? `${chute}, et ne vend plus ensuite` : `${chiffres}, soit ${eur(-x.ecartDeResultat)} de moins`}. Une place libre n'est pas toujours une place à prendre${x.p ? ` : ${x.p.nom} y a fini en défaillance` : ""}. ${x.variation > 0 ? "Les clients ne suivent pas un prix plus haut que rien d'autre ne justifie." : "Le volume gagné ne paie pas la marge perdue sur chaque unité."}`
                : `Non : ${chiffres}. L'année aurait été meilleure dans l'espace libre.`,
          },
          {
            texte: "Impossible à dire sans aller sur la place pendant une année entière",
            juste: false,
            retour: `Non : l'arène a rejoué l'année avec le prix de la place : ${chute ?? chiffres}.`,
          },
        ];
      },
    },
  ],
};
