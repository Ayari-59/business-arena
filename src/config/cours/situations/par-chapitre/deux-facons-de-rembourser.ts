import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../../monde/comptes-du-lycee";
import { PRET_BANCAIRE, coutDuFinancement, planDeFinancement } from "../../monde/financement-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FINANCER AUTREMENT » : DEUX FAÇONS DE REMBOURSER (Bac STMG, gestion
 * et finance, palier 1).
 *
 * Les associés n'ont finalement pas d'épargne à prêter, et la plateforme de financement
 * participatif tarde : ce que la subvention laisse de la ligne semi-automatique sera emprunté à
 * la banque. Elle propose deux tableaux pour le même prêt, au même taux et sur la même durée : le
 * capital en parts égales (le prêt du chapitre), ou des échéances constantes. L'élève compare les
 * deux remboursements, comme le chapitre l'a fait pour trois sources : la première année et les
 * intérêts de toute la durée.
 *
 * Le cas est neuf par sa question : le chapitre compare des sources différentes ; le cas compare
 * deux rythmes pour la même source. Le prêt est celui de `planDeFinancement` (le reste à
 * financer, tout à la banque) ; les tableaux sont ceux du modèle d'emprunt du cours
 * (monde/emprunt.ts), une échéance par an.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function deuxFaconsDeRembourser(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const plan = planDeFinancement(f);
  const banque = PRET_BANCAIRE(f);
  const montant = plan.aFinancer;
  const parts = coutDuFinancement(banque, montant);
  const constantes = coutDuFinancement({ ...banque, mode: "echeances-constantes" }, montant);
  return {
    entreprise: f.entreprise,
    equipement: plan.equipement,
    montant,
    taux: banque.taux,
    duree: banque.dureeAns,
    parts,
    constantes,
    capitalDesParts: parts.tableau[0]!.capital,
    interetsDeLaPremiereAnnee: parts.tableau[0]!.interets,
    echeance: constantes.premiereAnnee,
    capitalDeLaPremiereEcheance: constantes.tableau[0]!.capital,
    allegement: auCentime(parts.premiereAnnee - constantes.premiereAnnee),
    surcout: auCentime(constantes.interets - parts.interets),
  };
}

export const DEUX_FACONS_DE_REMBOURSER: Situation = {
  code: "deux-facons-de-rembourser",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["financer-autrement"],
  commanditaire: "Les associés",
  titre: "Deux façons de rembourser",
  accroche:
    "Le reste de la ligne sera emprunté. La banque propose deux tableaux pour le même prêt : des parts égales de capital, ou des échéances constantes. Lequel choisir ?",
  objectifs: [
    "Calculer la première annuité d'un prêt remboursé en parts égales",
    "Lire la première échéance d'un prêt à échéances constantes et en séparer le capital et les intérêts",
    "Comparer les deux remboursements : la première année et les intérêts de toute la durée",
    "Rédiger une réponse chiffrée aux associés",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend la ligne de la gamme de NOVA et son plan de financement dans la simulation du cours, ceux du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des associés",
      texte: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [
          `« La subvention payée, il reste ${eur(r.montant)} à trouver pour ${r.equipement}, et nous les emprunterons à la banque, à ${pct(r.taux * 100)} sur ${qte(r.duree)} ans. Elle nous propose deux tableaux. Lequel allège le plus la première année, celle du lancement de la gamme ? Et combien d'intérêts paierons-nous en plus ou en moins sur toute la durée ? »`,
          "Pas de cours cette fois : vous avez les deux tableaux, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return {
          titre: `Les deux tableaux de la banque · ${eur(r.montant)} à ${pct(r.taux * 100)}`,
          colonnes: ["Parts égales", "Échéances constantes"],
          lignes: r.parts.tableau.map((l, i) => ({ libelle: `Année ${qte(l.annee)}, ce qui sort`, valeurs: [eur(l.total), eur(r.constantes.tableau[i]!.total)] })),
        };
      },
      repere: () =>
        "À rendre : la première annuité en parts égales, le capital et les intérêts de la première échéance constante, les intérêts de toute la durée de chaque tableau, et votre réponse.",
    },
    {
      id: "les-parts-egales",
      type: "montants",
      titre: "En parts égales",
      notions: ["loan_schedule"],
      question: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return `En parts égales, le capital se rembourse par ${qte(r.duree)} parts identiques, et les intérêts se paient sur ce qui reste dû. Calculez le capital remboursé chaque année, les intérêts de la première année, puis la première annuité.`;
      },
      champs: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [
          { libelle: "Capital remboursé chaque année", attendu: r.capitalDesParts, calcul: `${eur(r.montant)} ÷ ${qte(r.duree)} = ${eur(r.capitalDesParts)}` },
          { libelle: "Intérêts de la première année", attendu: r.interetsDeLaPremiereAnnee, calcul: `${eur(r.montant)} × ${pct(r.taux * 100)} = ${eur(r.interetsDeLaPremiereAnnee)}` },
          { libelle: "Première annuité", attendu: r.parts.premiereAnnee, calcul: `${eur(r.capitalDesParts)} + ${eur(r.interetsDeLaPremiereAnnee)} = ${eur(r.parts.premiereAnnee)}` },
        ];
      },
      explication: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [`La première année est la plus lourde, ${eur(r.parts.premiereAnnee)} ; ensuite, les intérêts baissent avec le capital dû, et chaque annuité est plus légère.`];
      },
    },
    {
      id: "les-echeances-constantes",
      type: "montants",
      titre: "En échéances constantes",
      notions: ["loan_schedule"],
      question: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return `En échéances constantes, NOVA paie ${eur(r.echeance)} chaque année. Les intérêts de la première année sont les mêmes, puisque tout le capital est dû. Calculez-les, puis le capital que la première échéance rembourse.`;
      },
      champs: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [
          { libelle: "Intérêts de la première année", attendu: r.constantes.tableau[0]!.interets, calcul: `${eur(r.montant)} × ${pct(r.taux * 100)} = ${eur(r.constantes.tableau[0]!.interets)}` },
          { libelle: "Capital de la première échéance", attendu: r.capitalDeLaPremiereEcheance, calcul: `${eur(r.echeance)} − ${eur(r.constantes.tableau[0]!.interets)} = ${eur(r.capitalDeLaPremiereEcheance)}` },
        ];
      },
      explication: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [`La première échéance ne rembourse que ${eur(r.capitalDeLaPremiereEcheance)} de capital, au lieu de ${eur(r.capitalDesParts)} : le capital dû baisse moins vite, et les intérêts des années suivantes restent plus hauts.`];
      },
    },
    {
      id: "la-comparaison",
      type: "montants",
      titre: "La comparaison",
      notions: ["loan_schedule", "net_treasury"],
      question: () =>
        "Additionnez les intérêts de chaque tableau (ce qui sort chaque année, moins le capital emprunté). Puis calculez ce que les échéances constantes épargnent la première année, et ce qu'elles coûtent de plus en intérêts sur toute la durée.",
      champs: (c) => {
        const r = deuxFaconsDeRembourser(c);
        const sorti = (t: typeof r.parts) => auCentime(t.tableau.reduce((s, l) => s + l.total, 0));
        return [
          { libelle: "Intérêts, parts égales", attendu: r.parts.interets, calcul: `${eur(sorti(r.parts))} − ${eur(r.montant)} = ${eur(r.parts.interets)}` },
          { libelle: "Intérêts, échéances constantes", attendu: r.constantes.interets, calcul: `${eur(sorti(r.constantes))} − ${eur(r.montant)} = ${eur(r.constantes.interets)}` },
          { libelle: "Épargné la première année", attendu: r.allegement, calcul: `${eur(r.parts.premiereAnnee)} − ${eur(r.echeance)} = ${eur(r.allegement)}` },
          { libelle: "Intérêts en plus sur la durée", attendu: r.surcout, calcul: `${eur(r.constantes.interets)} − ${eur(r.parts.interets)} = ${eur(r.surcout)}` },
        ];
      },
      explication: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [`Les échéances constantes allègent la première année de ${eur(r.allegement)}, et coûtent ${eur(r.surcout)} d'intérêts de plus sur ${qte(r.duree)} ans : le prix d'un capital remboursé plus lentement.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse aux associés",
      question: () => "Quelle phrase envoyez-vous aux associés ?",
      options: (c) => {
        const r = deuxFaconsDeRembourser(c);
        return [
          {
            texte: `Les échéances constantes allègent l'an 1 de ${eur(r.allegement)}, pour ${eur(r.surcout)} d'intérêts de plus`,
            juste: true,
            retour: `Oui : ${eur(r.echeance)} au lieu de ${eur(r.parts.premiereAnnee)} la première année, mais ${eur(r.constantes.interets)} d'intérêts au lieu de ${eur(r.parts.interets)}. À vous de dire si le lancement de la gamme vaut ce surcoût.`,
          },
          {
            texte: "Les deux tableaux reviennent au même : le taux et la durée sont les mêmes, donc les intérêts aussi",
            juste: false,
            retour: `Non : avec les échéances constantes, le capital se rembourse plus lentement, et les intérêts portent plus longtemps sur plus de capital : ${eur(r.surcout)} de plus.`,
          },
          {
            texte: `Les parts égales sont moins chères et plus légères la première année, de ${eur(r.allegement)}`,
            juste: false,
            retour: `Non : moins chères sur la durée, oui ; mais leur première année est la plus lourde, ${eur(r.parts.premiereAnnee)} contre ${eur(r.echeance)}.`,
          },
        ];
      },
    },
  ],
};
