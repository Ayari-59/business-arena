import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import type { Cas } from "../cas";
import { rejouerAvec, surLAnnee, type Changement } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DÉCIDER AVEC DES CHIFFRES, COMPARER DEUX CHOIX (seconde, management et gestion,
 * palier 1).
 *
 * Une décision simple, que tout dirigeant prend : faire de la publicité toute l'année, ou s'en
 * passer. Le chapitre suit le raisonnement en trois temps que le programme de seconde demande :
 * PRÉVOIR (ce que chaque choix coûte, et ce que la publicité doit faire gagner pour se payer),
 * CHOISIR (une règle fixée avant de connaître la réponse), CONSTATER (l'arène rejoue l'année avec
 * chaque choix, tout le reste identique, et l'élève lit ce qui s'est passé).
 *
 * Il ne double pas « Décider : prix, fabriquer ou acheter » (palier 4), qui raisonne sur le prix
 * en marge différentielle, volume par volume ; ni « Ce que rapporte la communication » (bac
 * STMG), qui cherche le meilleur de cinq budgets sur un trimestre. Ici, deux choix seulement, sur
 * l'année entière, et la méthode avant le calcul.
 *
 * Les chiffres sont ceux de l'arène : l'année du cours (même réglage, même graine, mêmes
 * concurrents), rejouée par `rejouerAvec` avec le budget de publicité de chaque trimestre
 * multiplié par le facteur du choix. À la boutique, qui vend une gamme, la publicité se décide
 * référence par référence, plus un budget de marque : chacun est multiplié de même.
 *
 * La règle de décision (étape « choisir ») est la même dans toutes les entreprises : garder la
 * publicité si elle fait gagner au moins les ventes qui la paient. Le verdict, lui, se calcule :
 * selon l'entreprise, la publicité a rapporté plus qu'elle n'a coûté, ou moins.
 */

/**
 * LES DEUX CHOIX DU DIRIGEANT, en part du budget de publicité que la gestion équilibrée de
 * l'arène engage chaque trimestre : le garder tel quel, ou ne rien dépenser.
 */
export const AVEC_LA_PUBLICITE = 1;
export const SANS_PUBLICITE = 0;

/**
 * Les entreprises où le chapitre se joue : toutes sauf la boutique en ligne. Sans publicité,
 * elle perd l'essentiel de ses clients et cesse son activité avant la fin de l'année (la garde
 * le vérifie) : il n'y aurait plus deux années complètes à comparer.
 */
export const ENTREPRISES_DU_CHOIX = ENTREPRISES_DU_COURS.filter((c) => c !== "ecommerce");

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ventesEcrites = (n: number) => (n === 0 ? "aucune vente" : Math.abs(n) === 1 ? `${qte(n)} vente` : `${qte(n)} ventes`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le budget de publicité de chaque trimestre multiplié par `facteur`, marque et références comprises. */
const publiciteFois =
  (facteur: number): Changement =>
  (_tour, d) => ({
    ...d,
    marketingBudget: d.marketingBudget * facteur,
    ...(d.brandMarketingBudget !== undefined ? { brandMarketingBudget: d.brandMarketingBudget * facteur } : {}),
    ...(d.products
      ? {
          products: Object.fromEntries(
            Object.entries(d.products).map(([k, p]) => [k, p.marketingBudget !== undefined ? { ...p, marketingBudget: p.marketingBudget * facteur } : p]),
          ),
        }
      : {}),
  });

/** L'année du cours rejouée avec le budget de publicité multiplié par `facteur`. */
export const anneeAvecLaPublicite = (code: string, facteur: number) =>
  rejouerAvec(code, `decider-avec-des-chiffres-publicite-x${facteur}`, publiciteFois(facteur));

/** Une année rejouée, en grandes masses arrondies à l'euro (à l'unité pour les ventes). */
export interface AnneeDuChoix {
  publicite: number;
  ventes: number;
  chiffreDAffaires: number;
  marge: number;
  resultat: number;
  tresorerie: number;
  /** Chaque trimestre a vendu : aucune défaillance dans l'année. */
  active: boolean;
}

export function anneeDuChoix(annee: readonly CompanyRoundResult[]): AnneeDuChoix {
  const somme = (f: (r: CompanyRoundResult) => number) => Math.round(surLAnnee(annee, f));
  return {
    publicite: somme((r) => r.incomeStatement.marketingCost),
    ventes: somme(soldUnits),
    chiffreDAffaires: somme((r) => r.incomeStatement.revenue),
    marge: somme((r) => r.incomeStatement.grossMargin),
    resultat: somme((r) => r.incomeStatement.operatingIncome),
    tresorerie: Math.round(annee.at(-1)!.cashFlow.closing),
    active: annee.every((r) => r.incomeStatement.revenue > 0),
  };
}

export type Verdict = "garder" | "s-en-passer";

/** Les deux choix, ce que la prévision demande, et ce que l'arène a joué. */
export function deuxChoix(c: Cas) {
  const avec = anneeDuChoix(anneeAvecLaPublicite(c.code, AVEC_LA_PUBLICITE));
  const sans = anneeDuChoix(anneeAvecLaPublicite(c.code, SANS_PUBLICITE));
  const budget = avec.publicite - sans.publicite;
  const margeParVente = auCentime(avec.marge / avec.ventes);
  const ventesAGagner = Math.ceil(budget / margeParVente - 1e-9);
  const ventesGagnees = avec.ventes - sans.ventes;
  const margeGagnee = avec.marge - sans.marge;
  const ecartDeResultat = avec.resultat - sans.resultat;
  const verdict: Verdict = ecartDeResultat > 0 ? "garder" : "s-en-passer";
  return {
    avec,
    sans,
    budget,
    margeParVente,
    ventesAGagner,
    ventesGagnees,
    margeGagnee,
    ecartDeResultat,
    margeParVenteGagnee: ventesGagnees > 0 ? auCentime(margeGagnee / ventesGagnees) : null,
    verdict,
    /** La règle de la prévision (assez de ventes gagnées) et le constat (le résultat) disent la même chose. */
    previsionJuste: (ventesGagnees >= ventesAGagner) === (ecartDeResultat > 0),
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = deuxChoix(c);
  return {
    titre: `L'année ${dE(c.entreprise)} dans l'arène, avec sa publicité`,
    colonnes: ["Sur l'année"],
    lignes: [
      { libelle: "Publicité", valeurs: [eur(k.avec.publicite)] },
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avec.ventes)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(k.avec.chiffreDAffaires)] },
      { libelle: "Marge sur les ventes", valeurs: [eur(k.avec.marge)] },
      { libelle: "Résultat de l'activité", valeurs: [eur(k.avec.resultat)] },
    ],
  };
}

function tableauDesDeuxChoix(c: Cas): TableauDeDonnees {
  const k = deuxChoix(c);
  const ligne = (libelle: string, f: (a: AnneeDuChoix) => string) => ({ libelle, valeurs: [f(k.avec), f(k.sans)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec chaque choix`,
    colonnes: ["Avec la publicité", "Sans publicité"],
    lignes: [
      ligne("Publicité", (a) => eur(a.publicite)),
      ligne(`Ventes (${c.unites})`, (a) => qte(a.ventes)),
      ligne("Chiffre d'affaires", (a) => eur(a.chiffreDAffaires)),
      ligne("Marge sur les ventes", (a) => eur(a.marge)),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
      ligne("Trésorerie de fin d'année", (a) => eur(a.tresorerie)),
    ],
  };
}

/** Ce que la prévision et le constat se disent, en une phrase. */
function previsionEtConstat(k: ReturnType<typeof deuxChoix>) {
  if (k.previsionJuste) {
    return k.ventesGagnees >= k.ventesAGagner
      ? `La prévision avait vu juste : il fallait ${qte(k.ventesAGagner)} ventes de plus pour payer la publicité, elle en a fait gagner ${qte(k.ventesGagnees)}.`
      : `La prévision avait vu juste : il fallait ${qte(k.ventesAGagner)} ventes de plus pour payer la publicité, elle n'en a fait gagner que ${qte(k.ventesGagnees)}.`;
  }
  const parVente = k.margeParVenteGagnee ?? 0;
  return k.ventesGagnees < k.ventesAGagner
    ? `La prévision disait de s'en passer : il fallait ${qte(k.ventesAGagner)} ventes de plus, la publicité n'en a fait gagner que ${qte(k.ventesGagnees)}. Elle a pourtant rapporté plus qu'elle n'a coûté : chaque vente gagnée a laissé ${eur(parVente)} de marge, plus que les ${eur(k.margeParVente)} d'une vente moyenne.`
    : `La prévision disait de la garder : la publicité a fait gagner ${qte(k.ventesGagnees)} ventes, plus que les ${qte(k.ventesAGagner)} qui la payaient. Elle a pourtant coûté plus qu'elle n'a rapporté : chaque vente gagnée n'a laissé que ${eur(parVente)} de marge, moins que les ${eur(k.margeParVente)} d'une vente moyenne.`;
}

export const DECIDER_AVEC_DES_CHIFFRES: Chapitre = {
  code: "decider-avec-des-chiffres",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Organiser et décider, des objectifs à la réalisation"],
  titre: "Décider avec des chiffres : comparer deux choix",
  accroche:
    "Faire de la publicité toute l'année, ou s'en passer ? Prévoir ce que chaque choix coûte et rapporte, choisir avec une règle claire, puis laisser l'arène rejouer l'année pour constater.",
  objectifs: [
    "Chiffrer ce que coûte chacun de deux choix",
    "Calculer ce qu'une dépense doit faire gagner pour se payer",
    "Choisir avec une règle fixée à l'avance",
    "Comparer la prévision à ce qui s'est vraiment passé",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CHOIX,
    pourquoi:
      "sans publicité, la boutique en ligne perd la plupart de ses clients et cesse son activité avant la fin de l'année : il n'y aurait plus deux années complètes à comparer.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Faire de la publicité, ou pas ?",
      notions: ["customer_acquisition_cost", "income_statement"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = deuxChoix(c);
        return [
          `Sur l'année, ${c.entreprise} dépense ${eur(k.budget)} en publicité. Le dirigeant se demande s'il a raison : sans publicité, il garderait cet argent ; avec, il espère vendre davantage. Deux choix, et il faut en prendre un.`,
          "Pour décider avec des chiffres, on avance en trois temps. Prévoir : ce que chaque choix coûte, et ce qu'il doit rapporter. Choisir : avec une règle fixée avant de connaître la réponse. Constater : ici, l'arène rejouera l'année sans publicité, tout le reste identique.",
        ];
      },
      repere: () => "Prévoir, choisir, constater : on chiffre chaque choix avant de décider, puis on vérifie ce que la décision a donné.",
    },
    {
      id: "prevoir",
      type: "montants",
      titre: "Prévoir : ce que la publicité doit rapporter",
      notions: ["contribution_margin", "customer_acquisition_cost"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const k = deuxChoix(c);
        return `La publicité coûte ${eur(k.budget)} sur l'année ; s'en passer ne coûte rien. Une vente de plus ne rapporte pas son prix, mais sa marge : ce qui reste une fois payé ce que la vente elle-même coûte à l'entreprise. Calculez la marge d'une vente (marge sur les ventes ÷ ventes, au centime), puis les ventes que la publicité doit faire gagner pour se payer (son coût ÷ marge d'une vente, arrondi à l'unité supérieure).`;
      },
      champs: (c) => {
        const k = deuxChoix(c);
        return [
          {
            libelle: "Marge d'une vente",
            attendu: k.margeParVente,
            calcul: `${eur(k.avec.marge)} ÷ ${qte(k.avec.ventes)} = ${eur(k.margeParVente)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Ventes que la publicité doit faire gagner",
            attendu: k.ventesAGagner,
            calcul: `${eur(k.budget)} ÷ ${eur(k.margeParVente)} = ${qte(k.ventesAGagner)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = deuxChoix(c);
        return [
          `Avec la publicité, ${c.entreprise} paie ${eur(k.budget)}. Pour que ce soit le bon choix, elle doit faire gagner au moins ${qte(k.ventesAGagner)} ventes dans l'année, à ${eur(k.margeParVente)} de marge chacune. C'est la prévision : on ne sait pas encore ce qu'elle fera vraiment vendre.`,
        ];
      },
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Choisir : la règle de décision",
      notions: ["contribution_margin"],
      question: () => "Avant de rejouer l'année, le dirigeant se fixe une règle de décision. Laquelle est la bonne ?",
      options: (c) => {
        const k = deuxChoix(c);
        return [
          {
            texte: `Garder la publicité si elle fait gagner au moins ${qte(k.ventesAGagner)} ventes`,
            juste: true,
            retour: `Oui : c'est le nombre de ventes dont la marge paie la publicité. En dessous, elle coûte plus qu'elle ne rapporte ; au-dessus, elle rapporte plus qu'elle ne coûte.`,
          },
          {
            texte: "Garder la publicité si elle fait monter le chiffre d'affaires",
            juste: false,
            retour: `Non : le chiffre d'affaires peut monter sans que la publicité soit payée. Une vente de plus ne laisse que sa marge, ${eur(k.margeParVente)} en moyenne, pas son prix.`,
          },
          {
            texte: "Supprimer la publicité, puisque toute dépense fait baisser le résultat",
            juste: false,
            retour: "Non : c'est une dépense, mais elle peut faire vendre davantage. Tout dépend de ce qu'elle rapporte en face de ce qu'elle coûte.",
          },
        ];
      },
    },
    {
      id: "constater",
      type: "montants",
      titre: "Constater : l'arène rejoue l'année",
      notions: ["contribution_margin", "income_statement"],
      tableau: tableauDesDeuxChoix,
      question: (c) =>
        `L'arène a rejoué l'année ${dE(c.entreprise)} sans publicité, tout le reste identique : mêmes prix, mêmes concurrents. Calculez les ventes gagnées grâce à la publicité, la marge qu'elle a fait gagner, puis l'écart de résultat de l'activité (avec moins sans).`,
      champs: (c) => {
        const k = deuxChoix(c);
        return [
          {
            libelle: "Ventes gagnées grâce à la publicité",
            attendu: k.ventesGagnees,
            calcul: `${qte(k.avec.ventes)} − ${qte(k.sans.ventes)} = ${qte(k.ventesGagnees)}`,
            tolerance: 0,
          },
          {
            libelle: "Marge gagnée grâce à la publicité",
            attendu: k.margeGagnee,
            calcul: `${eur(k.avec.marge)} − ${eur(k.sans.marge)} = ${eur(k.margeGagnee)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat de l'activité, avec moins sans",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.avec.resultat)} − ${retranche(k.sans.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = deuxChoix(c);
        return [
          `La publicité a fait gagner ${ventesEcrites(k.ventesGagnees)} et ${eur(k.margeGagnee)} de marge, pour ${eur(k.budget)} de dépense. ${
            k.ecartDeResultat > 0
              ? `Sa marge dépasse son coût : avec elle, le résultat de l'activité est plus haut de ${eur(k.ecartDeResultat)}.`
              : `Sa marge ne couvre pas son coût : sans elle, le résultat de l'activité aurait été plus haut de ${eur(-k.ecartDeResultat)}.`
          }`,
          `L'écart de résultat, c'est la marge gagnée moins le coût de la publicité : ${eur(k.margeGagnee)} − ${eur(k.budget)}, à l'arrondi près.`,
        ];
      },
    },
    {
      id: "le-bon-choix",
      type: "choix",
      titre: "Le bon choix, cette année",
      notions: ["income_statement"],
      tableau: tableauDesDeuxChoix,
      question: (c) => {
        const k = deuxChoix(c);
        return `Avec la publicité, le résultat de l'activité ${dE(c.entreprise)} est de ${eur(k.avec.resultat)} sur l'année ; sans, il aurait été de ${eur(k.sans.resultat)}. Quel était le bon choix ?`;
      },
      options: (c) => {
        const k = deuxChoix(c);
        const garder = k.verdict === "garder";
        return [
          {
            texte: "Garder la publicité : elle a rapporté plus qu'elle n'a coûté",
            juste: garder,
            retour: garder
              ? `Oui : sa marge (${eur(k.margeGagnee)}) dépasse son coût (${eur(k.budget)}), et le résultat est plus haut de ${eur(k.ecartDeResultat)} avec elle.`
              : `Non : elle a fait gagner ${eur(k.margeGagnee)} de marge, pour ${eur(k.budget)} de dépense. Sans elle, le résultat aurait été plus haut de ${eur(-k.ecartDeResultat)}.`,
          },
          {
            texte: "S'en passer : la publicité a coûté plus qu'elle n'a rapporté",
            juste: !garder,
            retour: !garder
              ? `Oui : sa marge (${eur(k.margeGagnee)}) ne couvre pas son coût (${eur(k.budget)}). Sans elle, le résultat aurait été plus haut de ${eur(-k.ecartDeResultat)}.`
              : `Non : elle a fait gagner ${eur(k.margeGagnee)} de marge, pour ${eur(k.budget)} de dépense. Avec elle, le résultat est plus haut de ${eur(k.ecartDeResultat)}.`,
          },
          {
            texte: "On ne peut pas savoir : les concurrents ont pu jouer autrement dans l'année rejouée",
            juste: false,
            retour:
              "Non : l'arène a rejoué l'année avec les mêmes concurrents, les mêmes prix et la même façon de gérer ; seule la publicité a changé au départ. L'écart de résultat en est la conséquence.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Prévoir, choisir, constater",
      notions: ["contribution_margin"],
      texte: (c) => {
        const k = deuxChoix(c);
        return [
          `${previsionEtConstat(k)} Chez ${c.entreprise}, cette année, le bon choix était ${k.verdict === "garder" ? "de garder la publicité" : "de s'en passer"}.`,
          "Une prévision n'est qu'une estimation : c'est pour cela qu'on constate ensuite, et qu'on compare. Décider avec des chiffres, c'est toujours ces trois temps : prévoir ce que chaque choix coûte et doit rapporter, choisir avec une règle fixée à l'avance, puis constater, pour mieux prévoir la fois suivante.",
        ];
      },
      repere: () => "Ventes à gagner pour payer une dépense = coût de la dépense ÷ marge d'une vente.",
    },
  ],
};
