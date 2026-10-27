import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { ENTREPRISES_A_UN_CATALOGUE, achatsDuTrimestre, choixDuFournisseur } from "../../chapitres/choisir-son-fournisseur";
import { rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CHOISIR SON FOURNISSEUR » : LE FOURNISSEUR ALLONGE SON DÉLAI
 * (BTS GPME, palier 2).
 *
 * L'entreprise a annoncé à son fournisseur habituel qu'elle pensait passer à l'offre la moins
 * chère. Pour la garder, il ne baisse pas ses prix : il lui laisse plus de temps pour payer.
 * La dirigeante veut savoir ce que vaut cette contre-offre face à l'offre la moins chère, en
 * résultat et en trésorerie. L'élève refait les calculs du chapitre (la dette fournisseurs que
 * crée un délai, l'écart de résultat et de trésorerie), puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre compare des offres telles que le scénario les
 * donne ; le cas compare une offre à une contre-offre que le fournisseur fait en négociant, sur
 * le délai plutôt que sur le prix. L'offre la moins chère est celle du chapitre
 * (`choixDuFournisseur`) ; la contre-offre est la même année rejouée, le fournisseur habituel
 * payé plus tard (son `paymentDelayDays` dans le scénario), ses prix inchangés.
 */

/**
 * Les jours de délai que le fournisseur habituel accorde en plus : 30, un mois, ce qu'un
 * fournisseur concède couramment pour garder un client qui regarde ailleurs. Le délai reste
 * sous la durée d'un trimestre dans les huit entreprises du chapitre.
 */
export const JOURS_DE_DELAI_EN_PLUS = 30;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const aDelai = (jours: number) => (jours === 0 ? "comptant" : `à ${jours} jours`);
const nomDe = (o: { nom: string }) => `« ${o.nom} »`;

export type Verdict = "le-prix" | "chacun-son-avantage" | "le-delai";

/** La contre-offre rejouée, à côté de l'offre habituelle et de la moins chère du chapitre. */
export function delaiAllonge(c: Cas) {
  const f = choixDuFournisseur(c);
  const s = scenarioByCode(c.code).scenario;
  const nouveauDelai = f.reference.delai + JOURS_DE_DELAI_EN_PLUS;
  const annee = rejouerAvec(
    c.code,
    "fournisseur-delai-allonge",
    () => undefined,
    (sc) => ({ ...sc, suppliers: sc.suppliers!.map((x) => (x.code === f.reference.code ? { ...x, paymentDelayDays: nouveauDelai } : x)) }),
  );
  const fin = annee.at(-1)!;
  const achatsT4 = auCentime(achatsDuTrimestre(fin));
  const dettesAttendues = auCentime(achatsT4 * (1 + f.tva) * Math.min(1, nouveauDelai / f.jours));
  const allonge = {
    nom: `${f.reference.nom}, délai allongé`,
    delai: nouveauDelai,
    achatsT4,
    dettes: Math.round(fin.balanceSheet.payables),
    resultat: Math.round(surLAnnee(annee, (r) => r.incomeStatement.netIncome)),
    tresorerie: Math.round(fin.functionalBalance.netTreasury),
    affacturageImpose: Math.round(surLAnnee(annee, (r) => r.treasury?.forcedFactored ?? 0)),
  };
  const creditEnPlus = auCentime(dettesAttendues - f.reference.dettes);
  const ecartDeResultat = f.moinsChere.resultat - allonge.resultat;
  const ecartDeTresorerie = f.moinsChere.tresorerie - allonge.tresorerie;
  const verdict: Verdict = ecartDeResultat <= 0 ? "le-delai" : ecartDeTresorerie >= 0 ? "le-prix" : "chacun-son-avantage";
  return { f, s, nouveauDelai, allonge, dettesAttendues, creditEnPlus, ecartDeResultat, ecartDeTresorerie, verdict };
}

export const LE_FOURNISSEUR_ALLONGE_SON_DELAI: Situation = {
  code: "le-fournisseur-allonge-son-delai",
  parcours: "gpme",
  palier: 2,
  blocs: [],
  reprend: ["choisir-son-fournisseur"],
  commanditaire: "La dirigeante",
  titre: "Le fournisseur allonge son délai",
  accroche:
    "Pour garder son client, le fournisseur habituel ne baisse pas ses prix : il laisse plus de temps pour payer. Ce que vaut la contre-offre face à l'offre la moins chère, en résultat et en trésorerie.",
  objectifs: [
    "Calculer la dette fournisseurs que crée un délai allongé",
    "Comparer une baisse de prix et un délai de paiement sur l'année rejouée",
    "Distinguer l'effet sur le résultat et l'effet sur la trésorerie",
    "Répondre à la dirigeante, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_A_UN_CATALOGUE,
    pourquoi:
      "ce cas compare des offres qui valent pour toute la production, et à la boutique chaque référence de la gamme a son propre catalogue de fournisseurs.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La contre-offre du fournisseur",
      texte: (c) => {
        const k = delaiAllonge(c);
        return [
          `« Nous avons dit à ${nomDe(k.f.reference)} que nous pensions passer chez ${nomDe(k.f.moinsChere)}. Il ne baisse pas ses prix, mais il nous laisse ${JOURS_DE_DELAI_EN_PLUS} jours de plus pour le payer : ${k.nouveauDelai} jours au lieu de ${k.f.reference.delai}. Dites-moi ce que chaque solution ferait au résultat de l'année et à la trésorerie de fin d'année, et laquelle prendre. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec la contre-offre, tout le reste identique.",
        ];
      },
      tableau: (c) => {
        const k = delaiAllonge(c);
        return {
          titre: "Les deux solutions, et l'offre d'aujourd'hui",
          colonnes: [`${nomDe(k.f.reference)} aujourd'hui`, `${nomDe(k.f.reference)}, délai allongé`, nomDe(k.f.moinsChere)],
          lignes: [
            { libelle: "Prix d'achat d'une unité", valeurs: [eur(k.f.reference.prixUnitaire), eur(k.f.reference.prixUnitaire), eur(k.f.moinsChere.prixUnitaire)] },
            { libelle: "Délai de paiement (jours)", valeurs: [String(k.f.reference.delai), String(k.nouveauDelai), String(k.f.moinsChere.delai)] },
            { libelle: "Achats du dernier trimestre (hors taxes)", valeurs: [eur(k.f.reference.achatsT4), eur(k.allonge.achatsT4), eur(k.f.moinsChere.achatsT4)] },
            { libelle: "Dettes fournisseurs de fin d'année", valeurs: [eur(k.f.reference.dettes), "à calculer", eur(k.f.moinsChere.dettes)] },
          ],
        };
      },
      repere: () => "À rendre : la dette fournisseurs avec le délai allongé, ce que chaque solution fait au résultat et à la trésorerie, et votre réponse.",
    },
    {
      id: "dette",
      type: "montants",
      titre: "Ce que le délai allongé laisse en caisse",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const k = delaiAllonge(c);
        return `Avec le délai allongé, calculez les dettes fournisseurs au bilan de fin d'année (achats du dernier trimestre${k.f.tva > 0 ? ", TVA comprise," : ""} × délai ÷ ${k.f.jours}), puis le crédit que le fournisseur fait en plus par rapport à aujourd'hui.`;
      },
      champs: (c) => {
        const k = delaiAllonge(c);
        const facteur = k.f.tva > 0 ? ` × ${(1 + k.f.tva).toLocaleString("fr-FR")}` : "";
        return [
          {
            libelle: "Dettes fournisseurs, délai allongé",
            attendu: k.dettesAttendues,
            calcul: `${eur(k.allonge.achatsT4)}${facteur} × ${k.nouveauDelai} ÷ ${k.f.jours} = ${eur(k.dettesAttendues)}`,
            tolerance: 1,
          },
          {
            libelle: "Crédit fournisseur en plus",
            attendu: k.creditEnPlus,
            calcul: `${eur(k.dettesAttendues)} − ${eur(k.f.reference.dettes)} = ${eur(k.creditEnPlus)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const k = delaiAllonge(c);
        return [
          `Le fournisseur laisse ${eur(k.creditEnPlus)} de plus à ${c.entreprise} à la clôture, sans rien changer à ses prix. ${nomDe(k.f.moinsChere)}, payé ${aDelai(k.f.moinsChere.delai)}, en laisse ${eur(k.f.moinsChere.dettes)}.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue les deux solutions",
      notions: ["income_statement", "net_treasury"],
      tableau: (c) => {
        const k = delaiAllonge(c);
        return {
          titre: "L'année jouée avec chaque solution",
          colonnes: [`${nomDe(k.f.reference)} aujourd'hui`, `${nomDe(k.f.reference)}, délai allongé`, nomDe(k.f.moinsChere)],
          lignes: [
            { libelle: "Résultat de l'exercice", valeurs: [eur(k.f.reference.resultat), eur(k.allonge.resultat), eur(k.f.moinsChere.resultat)] },
            { libelle: "Trésorerie nette de fin d'année", valeurs: [eur(k.f.reference.tresorerie), eur(k.allonge.tresorerie), eur(k.f.moinsChere.tresorerie)] },
          ],
        };
      },
      question: (c) => {
        const k = delaiAllonge(c);
        return `Calculez ce que ${nomDe(k.f.moinsChere)} fait de plus, ou de moins, que la contre-offre : l'écart de résultat de l'exercice, puis l'écart de trésorerie nette de fin d'année (offre la moins chère moins délai allongé).`;
      },
      champs: (c) => {
        const k = delaiAllonge(c);
        return [
          {
            libelle: "Écart de résultat, offre la moins chère moins délai allongé",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.f.moinsChere.resultat)} − ${retranche(k.allonge.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de trésorerie, offre la moins chère moins délai allongé",
            attendu: k.ecartDeTresorerie,
            calcul: `${eur(k.f.moinsChere.tresorerie)} − ${retranche(k.allonge.tresorerie)} = ${eur(k.ecartDeTresorerie)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = delaiAllonge(c);
        const ecart = k.allonge.resultat - k.f.reference.resultat;
        const pourquoi =
          ecart === 0
            ? "Le délai allongé ne change rien au résultat : les achats coûtent le même prix, seul leur paiement est repoussé."
            : k.f.reference.affacturageImpose > k.allonge.affacturageImpose
              ? `Le délai allongé ne change pas le prix des achats ; le résultat gagne pourtant ${eur(ecart)}, parce que la trésorerie ainsi gardée évite à la banque de céder d'office des créances, ce qu'elle faisait aujourd'hui.`
              : `Le délai allongé ne change pas le prix des achats ; le résultat de l'année rejouée bouge pourtant de ${eur(ecart)} : l'arène n'y retrouve pas exactement les mêmes ventes.`;
        return [
          pourquoi,
          `L'offre la moins chère, elle, change le coût de chaque unité achetée (${pct((1 - k.f.moinsChere.multiplicateur) * 100)} de moins) : c'est ce qui fait l'écart de résultat de ${eur(k.ecartDeResultat)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la dirigeante",
      notions: ["payment_terms"],
      question: () => "Quelle phrase envoyez-vous à la dirigeante ?",
      options: (c) => {
        const k = delaiAllonge(c);
        const m = nomDe(k.f.moinsChere);
        const chiffres = `${eur(k.ecartDeResultat)} de résultat et ${eur(k.ecartDeTresorerie)} de trésorerie pour ${m}, par rapport à la contre-offre`;
        return [
          {
            texte: "L'offre la moins chère : elle fait mieux en résultat comme en trésorerie",
            juste: k.verdict === "le-prix",
            retour:
              k.verdict === "le-prix"
                ? `Oui : ${chiffres}. Le délai allongé ne rattrape pas une baisse de prix de ${pct((1 - k.f.moinsChere.multiplicateur) * 100)} sur tous les achats.`
                : k.verdict === "le-delai"
                  ? `Non : ${chiffres}. La contre-offre fait mieux en résultat.`
                  : `Non : ${chiffres}. En trésorerie de fin d'année, la contre-offre fait mieux.`,
          },
          {
            texte: "L'offre la moins chère pour le résultat, la contre-offre pour la trésorerie",
            juste: k.verdict === "chacun-son-avantage",
            retour:
              k.verdict === "chacun-son-avantage"
                ? `Oui : ${chiffres}. ${m} se paie ${aDelai(k.f.moinsChere.delai)} : le résultat y gagne, mais la trésorerie de fin d'année reste plus haute avec le délai allongé. Le choix dépend de ce qui manque le plus à l'entreprise.`
                : k.verdict === "le-prix"
                  ? `Non : ${chiffres}. L'offre la moins chère fait mieux aussi en trésorerie.`
                  : `Non : ${chiffres}. La contre-offre fait mieux en résultat.`,
          },
          {
            texte: "La contre-offre : la baisse de prix fait perdre plus qu'elle ne fait gagner",
            juste: k.verdict === "le-delai",
            retour:
              k.verdict === "le-delai"
                ? `Oui : ${chiffres}. Chez ${c.entreprise}, ${m} fait moins bien en résultat que les prix habituels : ce qu'elle économise sur les achats ne paie pas ce qu'elle coûte ailleurs. La contre-offre garde les prix habituels, et le délai allongé en plus${k.ecartDeTresorerie < 0 ? " : elle fait mieux aussi en trésorerie" : ""}.`
                : `Non : ${chiffres}. Un délai de paiement ne baisse pas le coût des achats : il ne change que la date où on les paie.`,
          },
        ];
      },
    },
  ],
};
