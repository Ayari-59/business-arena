import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { soldUnits } from "../../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../../engine/types";
import { scenarioByCode } from "../../../scenarios/registry";
import { anneeJouee, type Cas } from "../../cas";
import { CUISINES, coutMatiere, cuisineDuTrimestre } from "../../chapitres/le-cout-matiere";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT MATIÈRE ET LE PRIX D'UN PLAT » : MONTER LA CARTE, OU
 * PRÉPARER JUSTE ? (BTS MHR, palier 2).
 *
 * Au trimestre où le ratio coût matière de l'année jouée est le plus haut, le chef propose de monter
 * le ticket au prix qui garde le coefficient de la carte ; la salle pense qu'il suffit de préparer
 * juste. L'arène rejoue le trimestre des deux façons (gestion-de-la-pme.ts : `rejouerAvec`, sous
 * des clés préfixées du code du chapitre) ; l'élève calcule le ratio de chacune, ce que chacune
 * rapporte de plus que le trimestre joué, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit le ratio et le prix qui le garde ; le cas
 * demande si garder le ratio est le bon objectif. Le moteur répond : le prix plus haut fait partir
 * des clients (l'élasticité du scénario), préparer juste supprime les denrées jetées.
 *
 * LA SEULE RÈGLE DU CAS : dans les deux façons, la cuisine prépare de quoi servir chaque client,
 * plats ratés compris, au taux de rebut de base du scénario (`qualityCosts.baseDefectRate`) :
 * couverts à préparer = couverts servis ÷ (1 − taux de rebut), arrondi au-dessus. Au prix monté,
 * les couverts servis sont ceux que l'arène sert à ce prix, rejoué d'abord sans rien changer
 * d'autre.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un écart : le signe plus devant un gain. */
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
/** Retranché, un négatif va entre parenthèses. */
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const coef = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rang = (k: number) => (k === 0 ? "1er" : `${k + 1}e`);

export type Facon = "joue" | "carte" | "juste";

/** Ce que la cuisine prépare pour servir tant de couverts, plats ratés compris. */
export const aPreparer = (servis: number, rebut: number) => Math.ceil(servis / (1 - rebut) - 1e-9);

/** Les trois façons de jouer le trimestre le plus cher en denrées, telles que l'arène les rejoue. */
export function carteOuCuisine(c: Cas) {
  const m = coutMatiere(c);
  const k = m.pire;
  const tour = k + 1;
  const rebut = scenarioByCode(c.code).scenario.qualityCosts?.baseDefectRate ?? 0;
  const joueR = anneeJouee(c.code).partie.rounds[k]!.results["joueur"]!;
  const joue = cuisineDuTrimestre(c, joueR);
  const prixMonte = auCentime(joue.coutDuCouvert * m.coefficient);
  // Le prix monté, d'abord seul : les couverts que l'arène sert à ce prix.
  const auPrixMonte = rejouerAvec(c.code, `le-cout-matiere:prix-${prixMonte}`, (t, d) => (t === tour ? { ...d, price: prixMonte } : undefined))[k]!;
  const prepCarte = aPreparer(Math.round(soldUnits(auPrixMonte)), rebut);
  const carteR = rejouerAvec(c.code, `le-cout-matiere:carte-${prixMonte}-${prepCarte}`, (t, d) =>
    t === tour ? { ...d, price: prixMonte, productionPlan: prepCarte } : undefined,
  )[k]!;
  const prepJuste = aPreparer(joue.servis, rebut);
  const justeR = rejouerAvec(c.code, `le-cout-matiere:juste-${prepJuste}`, (t, d) => (t === tour ? { ...d, productionPlan: prepJuste } : undefined))[k]!;
  const facon = (r: CompanyRoundResult) => ({ ...cuisineDuTrimestre(c, r), prix: auCentime(r.incomeStatement.revenue / soldUnits(r)), resultat: Math.round(r.incomeStatement.operatingIncome) });
  const f = { joue: facon(joueR), carte: facon(carteR), juste: facon(justeR) };
  const ordre: Facon[] = ["joue", "carte", "juste"];
  const meilleure = ordre.reduce((a, b) => (f[b].resultat > f[a].resultat ? b : a));
  return {
    m,
    trimestre: k,
    rebut,
    prixMonte,
    ...f,
    couvertsPerdus: f.joue.servis - f.carte.servis,
    ecartCarte: f.carte.resultat - f.joue.resultat,
    ecartJuste: f.juste.resultat - f.joue.resultat,
    meilleure,
  };
}

export const MONTER_LA_CARTE_OU_PREPARER_JUSTE: Situation = {
  code: "monter-la-carte-ou-preparer-juste",
  parcours: "mhr",
  palier: 2,
  blocs: [],
  reprend: ["le-cout-matiere"],
  commanditaire: "Le chef de cuisine",
  titre: "Monter la carte, ou préparer juste ?",
  accroche:
    "Les denrées ont augmenté et le ratio coût matière s'envole. Le chef veut monter la carte pour garder son coefficient ; la salle pense qu'il suffit de préparer juste. L'arène rejoue le trimestre des deux façons.",
  objectifs: [
    "Calculer le ratio coût matière d'un trimestre rejoué",
    "Comparer deux façons de corriger un ratio qui dérive",
    "Juger une décision à ce qu'elle rapporte, et pas au seul ratio",
  ],
  libre: false,
  entreprises: {
    codes: CUISINES,
    pourquoi: "ce cas suit le coût des denrées d'une cuisine, et elle n'a pas de cuisine.",
  },
  etapes: [
    {
      id: "la-note",
      type: "lecture",
      titre: "La note du chef",
      texte: (c) => {
        const k = carteOuCuisine(c);
        const h = k.m.hausse;
        return [
          `« Au ${rang(k.trimestre)} trimestre, notre ratio coût matière est monté à ${pct(k.joue.ratio)}${h.premier >= 0 && h.premier <= k.trimestre ? `, les denrées ayant augmenté de ${pct(h.taux)}` : ""}. Je propose de monter la carte au prix qui garde notre coefficient de ${coef(k.m.coefficient)} : ${eur(k.prixMonte)} HT le couvert. En salle, on me dit qu'il suffirait de préparer juste, au ticket de ${eur(k.joue.prix)}. Que retenons-nous ? »`,
          `L'arène a rejoué le trimestre des deux façons. Chaque fois, la cuisine prépare de quoi servir chaque client, plats ratés compris : ${pct(k.rebut * 100)} des couverts préparés, le taux de rebut du scénario.`,
        ];
      },
      tableau: (c) => {
        const k = carteOuCuisine(c);
        const ligne = (libelle: string, f: (x: typeof k.joue) => string) => ({ libelle, valeurs: [k.joue, k.carte, k.juste].map(f) });
        return {
          titre: `Le ${rang(k.trimestre)} trimestre de ${c.entreprise}, rejoué`,
          colonnes: ["Trimestre joué", "Carte montée", "Préparer juste"],
          lignes: [
            ligne("Ticket moyen HT", (x) => eur(x.prix)),
            ligne("Couverts préparés", (x) => qte(x.prepares)),
            ligne("Couverts servis", (x) => qte(x.servis)),
            ligne("Coût matière consommé", (x) => eur(x.denrees)),
            ligne("Chiffre d'affaires HT", (x) => eur(x.chiffreDAffaires)),
            ligne("Résultat de l'activité", (x) => eur(x.resultat)),
          ],
        };
      },
      repere: () => "À rendre : le ratio coût matière de chaque façon, ce que chacune rapporte de plus que le trimestre joué, et votre réponse au chef.",
    },
    {
      id: "les-ratios",
      type: "montants",
      titre: "Le ratio de chaque façon",
      notions: ["margin_rates", "variable_costs"],
      question: () => "Calculez le ratio coût matière de chaque façon rejouée : le coût matière consommé divisé par le chiffre d'affaires HT, en pourcentage, au dixième.",
      champs: (c) => {
        const k = carteOuCuisine(c);
        return [
          { libelle: "Ratio, carte montée (%)", attendu: k.carte.ratio, calcul: `${eur(k.carte.denrees)} ÷ ${eur(k.carte.chiffreDAffaires)} × 100 = ${pct(k.carte.ratio)}`, tolerance: 0.1 },
          { libelle: "Ratio, préparer juste (%)", attendu: k.juste.ratio, calcul: `${eur(k.juste.denrees)} ÷ ${eur(k.juste.chiffreDAffaires)} × 100 = ${pct(k.juste.ratio)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = carteOuCuisine(c);
        return [
          `La carte montée ramène le ratio à ${pct(k.carte.ratio)}, préparer juste à ${pct(k.juste.ratio)} : les deux font mieux que les ${pct(k.joue.ratio)} du trimestre joué. Le ratio seul désignerait la carte montée.`,
        ];
      },
    },
    {
      id: "ce-que-ca-rapporte",
      type: "montants",
      titre: "Ce que chaque façon rapporte",
      notions: ["margin_rates", "price_elasticity"],
      question: () =>
        "Calculez les couverts que la carte montée fait perdre, puis l'écart de résultat de chaque façon avec le trimestre joué (positif si elle rapporte plus).",
      champs: (c) => {
        const k = carteOuCuisine(c);
        return [
          { libelle: "Couverts perdus en montant la carte", attendu: k.couvertsPerdus, calcul: `${qte(k.joue.servis)} − ${qte(k.carte.servis)} = ${qte(k.couvertsPerdus)}` },
          { libelle: "Écart de résultat, carte montée", attendu: k.ecartCarte, calcul: `${eur(k.carte.resultat)} − ${retranche(k.joue.resultat)} = ${ecart(k.ecartCarte)}` },
          { libelle: "Écart de résultat, préparer juste", attendu: k.ecartJuste, calcul: `${eur(k.juste.resultat)} − ${retranche(k.joue.resultat)} = ${ecart(k.ecartJuste)}` },
        ];
      },
      explication: (c) => {
        const k = carteOuCuisine(c);
        return [
          `À ${eur(k.prixMonte)} HT, ${qte(k.couvertsPerdus)} clients ne viennent plus : chacun emporte sa marge avec lui. Préparer juste garde tous les clients au même ticket, et ne jette plus les denrées : le coût matière tombe de ${eur(k.joue.denrees)} à ${eur(k.juste.denrees)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au chef",
      notions: ["margin_rates"],
      question: () => "Quelle réponse rendez-vous au chef ?",
      options: (c) => {
        const k = carteOuCuisine(c);
        const dit = (x: Facon) =>
          x === k.meilleure
            ? `Oui : c'est la façon qui rapporte le plus, ${eur(k[x].resultat)} de résultat sur le trimestre.`
            : `Non : ${eur(k[x].resultat)} de résultat, contre ${eur(k[k.meilleure].resultat)} pour la meilleure façon.`;
        return [
          {
            texte: `Monter la carte à ${eur(k.prixMonte)} HT, comme le propose le chef`,
            juste: k.meilleure === "carte",
            retour: `${dit("carte")} Le ratio revient à ${pct(k.carte.ratio)}, mais ${qte(k.couvertsPerdus)} couverts de moins sont servis. Un ratio bas n'est pas un but : c'est un repère.`,
          },
          {
            texte: `Garder ${eur(k.joue.prix)} HT, et préparer juste`,
            juste: k.meilleure === "juste",
            retour: `${dit("juste")} Le ratio reste à ${pct(k.juste.ratio)}, au-dessus de la fiche, parce que les denrées coûtent plus cher ; mais aucun client ne part, et la cuisine ne jette plus que les plats ratés.`,
          },
          {
            texte: "Ne rien changer : préparer comme au trimestre joué",
            juste: k.meilleure === "joue",
            retour: `${dit("joue")} Le trimestre joué a jeté ${qte(k.joue.prepares - k.joue.servis)} couverts préparés et non servis.`,
          },
        ];
      },
    },
  ],
};
