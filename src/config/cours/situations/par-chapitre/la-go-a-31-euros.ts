import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_COUTS_DE_LA_GAMME, PRIX_DE_LA_GO_APRES_LA_BAISSE, gammeDuMois, referenceDuMois, resultatSans } from "../../monde/couts-de-la-gamme-au-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT COMPLET OU COÛT SPÉCIFIQUE » : LA GO À 31 € (Bac STMG, gestion et
 * finance de terminale, palier 1).
 *
 * Le chapitre jugeait la One ; le cas juge la Go, dont un concurrent a fait baisser le prix : en coût
 * complet, elle perd de l'argent. Hypothèses : monde/couts-de-la-gamme-au-lycee.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export const laGoA31 = () => ({ go: referenceDuMois("go", PRIX_DE_LA_GO_APRES_LA_BAISSE), gamme: gammeDuMois(PRIX_DE_LA_GO_APRES_LA_BAISSE), sans: resultatSans("go", PRIX_DE_LA_GO_APRES_LA_BAISSE) });

export const LA_GO_A_31_EUROS: Situation = {
  code: "la-go-a-31-euros",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["cout-complet-ou-cout-specifique"],
  commanditaire: "Un associé",
  titre: "La Go à 31 € : l'arrêter ?",
  accroche: "Un concurrent a fait baisser le prix de la Go. En coût complet, elle perd de l'argent. Faut-il l'arrêter ?",
  objectifs: ["Calculer le coût complet et le résultat d'un produit", "Calculer sa marge sur coûts spécifiques", "Répondre à l'associé, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_COUTS_DE_LA_GAMME, pourquoi: "le cas reprend le mois en gamme de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'associé",
      tableau: () => {
        const { go } = laGoA31();
        return {
          titre: `La Go à ${eur(PRIX_DE_LA_GO_APRES_LA_BAISSE)}, sur le mois`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: [eur(go.chiffreDAffaires)] },
            { libelle: "Coûts variables", valeurs: [eur(go.variables)] },
            { libelle: "Publicité de la Go", valeurs: [eur(go.publicite)] },
            { libelle: "Charges communes imputées", valeurs: [eur(go.imputees)] },
          ],
        };
      },
      texte: () => [
        `« Depuis la baisse, la Go se vend ${eur(PRIX_DE_LA_GO_APRES_LA_BAISSE)}. Avec sa part du loyer et des salaires, elle nous fait perdre de l'argent. Arrêtons-la. » Un associé`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : le résultat de la Go en coût complet, sa marge sur coûts spécifiques, le résultat du mois sans elle, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Ce que dit chaque méthode",
      question: () => "Calculez le résultat de la Go en coût complet, sa marge sur coûts spécifiques, puis le résultat du mois sans la Go.",
      champs: () => {
        const { go, gamme, sans } = laGoA31();
        return [
          { libelle: "Résultat de la Go en coût complet", attendu: go.resultat, calcul: `${eur(go.chiffreDAffaires)} − (${eur(go.variables)} + ${eur(go.publicite)} + ${eur(go.imputees)}) = ${eur(go.resultat)}` },
          { libelle: "Marge sur coûts spécifiques de la Go", attendu: go.margeSpecifique, calcul: `${eur(go.chiffreDAffaires)} − ${eur(go.variables)} − ${eur(go.publicite)} = ${eur(go.margeSpecifique)}` },
          { libelle: "Résultat du mois sans la Go", attendu: sans, calcul: `${eur(gamme.resultat)} − ${eur(go.margeSpecifique)} = ${eur(sans)}` },
        ];
      },
      explication: () => {
        const { go, gamme, sans } = laGoA31();
        return [`La Go perd ${eur(-go.resultat)} en coût complet, mais elle laisse ${eur(go.margeSpecifique)} pour les charges communes : sans elle, le mois passerait de ${eur(gamme.resultat)} à ${eur(sans)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associé",
      question: () => "Que répondez-vous à l'associé ?",
      options: () => {
        const { go } = laGoA31();
        return [
          {
            texte: `La garder : elle couvre ${eur(go.margeSpecifique)} de charges communes`,
            juste: true,
            retour: "Oui : sa marge sur coûts spécifiques est positive. L'arrêter ferait partir sa marge, pas le loyer ni les salaires. Il faut plutôt chercher à baisser ses coûts ou à mieux la vendre.",
          },
          {
            texte: "L'arrêter, puisque son coût complet dépasse son chiffre d'affaires",
            juste: false,
            retour: "Non : le coût complet compte une part de charges qui resteraient sans la Go. Le mois y perdrait.",
          },
          {
            texte: "Remonter son prix au-dessus du concurrent, pour couvrir son coût complet",
            juste: false,
            retour: "Non : c'est la baisse du concurrent qui a fait baisser le prix. Plus cher que lui, la Go risquerait de ne plus se vendre du tout.",
          },
        ];
      },
    },
  ],
};
