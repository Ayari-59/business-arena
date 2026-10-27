import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { CUISINES, coutMatiere } from "../../chapitres/le-cout-matiere";
import { MARGE_DE_PREPARATION, trimestreDeCuisine, type TrimestreDeCuisine } from "../../monde/cuisine";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT MATIÈRE ET LE PRIX D'UN PLAT » : MONTER LA CARTE, OU
 * PRÉPARER JUSTE ? (BTS MHR, palier 2).
 *
 * Au trimestre où le ratio coût matière de l'année est le plus haut, le chef propose de monter le
 * ticket au prix qui garde le coefficient de la carte ; la salle pense qu'il suffit de préparer
 * juste. La simulation du cours rejoue le trimestre des deux façons ; l'élève calcule le ratio de
 * chacune, ce que chacune rapporte de plus que le trimestre joué, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit le ratio et le prix qui le garde ; le cas
 * demande si garder le ratio est le bon objectif, et le juge à la marge que chaque façon laisse.
 *
 * Comme son chapitre, le cas se joue dans le monde du cours (monde/cuisine.ts), pas dans l'arène.
 * Chaque façon change une seule chose au trimestre joué :
 *   · la carte montée : le ticket passe au prix qui garde le coefficient, la demande y répond avec
 *     l'élasticité de la fiche, et la cuisine prépare comme d'habitude (la demande plus la marge
 *     de préparation) ;
 *   · préparer juste : le ticket reste celui de l'année, et la cuisine prépare la demande, sans
 *     marge.
 * Les charges fixes du trimestre ne changent pas d'une façon à l'autre : l'écart de marge sur coûts
 * variables est l'écart de résultat.
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
const auCentime = (x: number) => Math.round(x * 100) / 100;
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Facon = "joue" | "carte" | "juste";

/** Les trois façons de jouer le trimestre au ratio le plus haut, telles que la simulation du cours les rejoue. */
export function carteOuCuisine(c: Pick<Cas, "code">) {
  const m = coutMatiere(c);
  const f = m.f;
  const n = m.pire;
  const joue = trimestreDeCuisine(f, n);
  const prixMonte = auCentime(joue.coutDuCouvert * m.coefficient);
  const facons: Record<Facon, TrimestreDeCuisine> = {
    joue,
    carte: trimestreDeCuisine(f, n, prixMonte),
    juste: trimestreDeCuisine(f, n, f.prixDeLAnnee, 0),
  };
  const ordre: Facon[] = ["joue", "carte", "juste"];
  const meilleure = ordre.reduce((a, b) => (facons[b].margeSurCoutsVariables > facons[a].margeSurCoutsVariables ? b : a));
  return {
    m,
    f,
    trimestre: n,
    prixMonte,
    ...facons,
    /** Ce que la hausse du ticket rapporte de plus sur chaque couvert servi. */
    gainParCouvert: auCentime(prixMonte - joue.prix),
    clientsPerdus: joue.servis - facons.carte.servis,
    ecartCarte: auCentime(facons.carte.margeSurCoutsVariables - joue.margeSurCoutsVariables),
    ecartJuste: auCentime(facons.juste.margeSurCoutsVariables - joue.margeSurCoutsVariables),
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
    "Les denrées ont augmenté et le ratio coût matière s'envole. Le chef veut monter la carte pour garder son coefficient ; la salle pense qu'il suffit de préparer juste. La simulation du cours rejoue le trimestre des deux façons.",
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
          `« Au ${rang(k.trimestre)} trimestre, notre ratio coût matière est monté à ${pct(k.joue.ratio)}${h.premier > 0 && h.premier <= k.trimestre ? `, les denrées ayant augmenté de ${pct(h.taux)}` : ""}. Je propose de monter la carte au prix qui garde notre coefficient de ${coef(k.m.coefficient)} : ${eur(k.prixMonte)} HT le couvert. En salle, on me dit qu'il suffirait de préparer juste, au ticket de ${eur(k.joue.prix)}. Que retenons-nous ? »`,
          `La simulation du cours rejoue le trimestre des deux façons. Carte montée : le ticket passe à ${eur(k.prixMonte)} HT, la demande y répond (un prix plus haut de 1 % en fait perdre environ ${qte(-k.f.elasticite)} %), et la cuisine prépare comme d'habitude, la demande plus ${pct(MARGE_DE_PREPARATION * 100)}. Préparer juste : le ticket reste à ${eur(k.joue.prix)}, et la cuisine prépare exactement la demande.`,
          "Les charges fixes du trimestre ne changent pas d'une façon à l'autre : ce que chaque façon change au résultat, c'est sa marge sur coûts variables, le chiffre d'affaires moins les denrées et les autres coûts variables.",
        ];
      },
      tableau: (c) => {
        const k = carteOuCuisine(c);
        const ligne = (libelle: string, f: (x: TrimestreDeCuisine) => string) => ({ libelle, valeurs: [k.joue, k.carte, k.juste].map(f) });
        return {
          titre: `Le ${rang(k.trimestre)} trimestre ${dE(k.f.entreprise)}, rejoué`,
          colonnes: ["Trimestre joué", "Carte montée", "Préparer juste"],
          lignes: [
            ligne("Ticket moyen HT", (x) => eur(x.prix)),
            ligne("Couverts préparés", (x) => qte(x.prepares)),
            ligne("Couverts servis", (x) => qte(x.servis)),
            ligne("Coût matière consommé", (x) => eur(x.denrees)),
            ligne("Chiffre d'affaires HT", (x) => eur(x.chiffreDAffaires)),
            ligne("Autres coûts variables", (x) => eur(x.autresCouts)),
            ligne("Marge sur coûts variables", (x) => eur(x.margeSurCoutsVariables)),
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
        const plusBas = k.carte.ratio < k.juste.ratio ? "la carte montée" : "préparer juste";
        return [
          `La carte montée ramène le ratio à ${pct(k.carte.ratio)}, préparer juste à ${pct(k.juste.ratio)} : les deux font mieux que les ${pct(k.joue.ratio)} du trimestre joué. Le ratio seul désignerait ${plusBas} ; reste à voir ce que chacune rapporte.`,
        ];
      },
    },
    {
      id: "ce-que-ca-rapporte",
      type: "montants",
      titre: "Ce que chaque façon rapporte",
      notions: ["margin_rates", "price_elasticity"],
      question: () =>
        "Calculez les clients que la carte montée fait perdre, puis l'écart de marge sur coûts variables de chaque façon avec le trimestre joué (positif si elle rapporte plus).",
      champs: (c) => {
        const k = carteOuCuisine(c);
        return [
          { libelle: "Clients perdus en montant la carte", attendu: k.clientsPerdus, calcul: `${qte(k.joue.servis)} − ${qte(k.carte.servis)} = ${qte(k.clientsPerdus)}` },
          {
            libelle: "Écart de marge, carte montée",
            attendu: k.ecartCarte,
            calcul: `${eur(k.carte.margeSurCoutsVariables)} − ${retranche(k.joue.margeSurCoutsVariables)} = ${ecart(k.ecartCarte)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de marge, préparer juste",
            attendu: k.ecartJuste,
            calcul: `${eur(k.juste.margeSurCoutsVariables)} − ${retranche(k.joue.margeSurCoutsVariables)} = ${ecart(k.ecartJuste)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = carteOuCuisine(c);
        return [
          `À ${eur(k.prixMonte)} HT, ${qte(k.clientsPerdus)} clients ne viennent plus, et chacun emporte sa marge ; chaque couvert servi rapporte ${eur(k.gainParCouvert)} de plus, et la cuisine en prépare moins. ${k.ecartCarte > 0 ? "Au total, la hausse rapporte plus qu'elle ne coûte." : "Au total, les clients perdus coûtent plus que la hausse ne rapporte."}`,
          `Préparer juste garde tous les clients au même ticket, et les ${qte(k.joue.perdus)} couverts que la cuisine jetait ne sont plus préparés : le coût matière tombe de ${eur(k.joue.denrees)} à ${eur(k.juste.denrees)}.`,
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
            ? `Oui : c'est la façon qui rapporte le plus, ${eur(k[x].margeSurCoutsVariables)} de marge sur coûts variables sur le trimestre.`
            : `Non : ${eur(k[x].margeSurCoutsVariables)} de marge sur coûts variables, contre ${eur(k[k.meilleure].margeSurCoutsVariables)} pour la meilleure façon.`;
        const encore = k.meilleure === "carte" && k.carte.perdus > 0 ? ` Rien n'empêche, en plus, de préparer juste : la cuisine jette encore ${qte(k.carte.perdus)} couverts.` : "";
        return [
          {
            texte: `Monter la carte à ${eur(k.prixMonte)} HT`,
            juste: k.meilleure === "carte",
            retour: `${dit("carte")} Le ratio revient à ${pct(k.carte.ratio)}, et les ${eur(k.gainParCouvert)} de plus sur chaque couvert servi ${k.ecartCarte > 0 ? "paient" : "ne paient pas"} les ${qte(k.clientsPerdus)} clients perdus.${encore}${k.meilleure === "carte" ? "" : " Un ratio bas n'est pas un but : c'est un repère."}`,
          },
          {
            texte: `Garder ${eur(k.joue.prix)} HT et préparer juste`,
            juste: k.meilleure === "juste",
            retour:
              k.meilleure === "juste"
                ? `${dit("juste")} Le ratio reste à ${pct(k.juste.ratio)}, au-dessus de la fiche, parce que les denrées coûtent plus cher ; mais aucun client ne part, et la cuisine ne jette plus rien.`
                : `${dit("juste")} Aucun client ne part et la cuisine ne jette plus rien ; mais le ratio reste à ${pct(k.juste.ratio)}, au-dessus de la fiche : préparer juste ne rattrape pas le prix des denrées, que le ticket n'a pas suivi.`,
          },
          {
            texte: "Ne rien changer : préparer comme au trimestre joué",
            juste: k.meilleure === "joue",
            retour: `${dit("joue")} Le trimestre joué a jeté ${qte(k.joue.perdus)} couverts préparés et non servis, et son ticket n'a pas suivi les denrées.`,
          },
        ];
      },
    },
  ],
};
