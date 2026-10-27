import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult, RoundDecisions } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, type Changement } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CE QUE RAPPORTE UN NOUVEAU CLIENT (Bac pro Métiers du commerce et de la vente,
 * terminale, palier 2).
 *
 * Le vendeur propose une campagne de publicité pour gagner des clients. L'arène rejoue l'année
 * avec la campagne : le chapitre compte les ventes gagnées, ce qu'a coûté chacune, la marge
 * qu'elle rapporte, et dit si la campagne paie. Et pourquoi la campagne d'un trimestre fait
 * encore vendre ensuite : la part de clientèle gagnée compte au trimestre suivant
 * (`loyaltyEffect`), et la gestion prépare davantage pour la demande qu'elle a vue.
 *
 * Il ne double pas « Le coût d'acquisition et la rentabilité d'une campagne » (BTS NDRC, palier
 * 3 : le premier trimestre à cinq budgets, le coût du client en plus, le retour sur
 * investissement), ni « Ce que rapporte la communication » (bac STMG : le meilleur de cinq
 * budgets), ni « Décider avec des chiffres » (seconde : la publicité de toute l'année, gardée ou
 * supprimée). Ici, une seule campagne, d'un trimestre, suivie sur l'année, et des divisions
 * simples.
 *
 * D'OÙ VIENNENT LES CHIFFRES. L'année du cours (`anneeDeReference`) et son rejeu (`rejouerAvec`,
 * clé « un-nouveau-client:… ») : au trimestre de la campagne, le budget de publicité vaut celui
 * de l'année du cours plus la campagne ; aux autres trimestres, celui de l'année du cours. Ce
 * sont des valeurs posées sur l'année du cours, trimestre par trimestre, et non un multiple de la
 * décision reçue : le formulaire reconduit la décision jouée, et un multiple reconduit se
 * composerait (la garde vérifie le budget joué à chaque trimestre). À la boutique, qui vend
 * plusieurs articles, la publicité se décide article par article : chacun suit la même règle.
 *
 * Dans l'arène, on ne compte pas les clients un par un (sauf les abonnés de la salle de sport) :
 * on compte les ventes. Une vente gagnée, c'est un client servi en plus.
 */

/** Le trimestre de la campagne : le premier, en janvier (hypothèse du cours). */
export const TRIMESTRE_DE_LA_CAMPAGNE = 1;

/**
 * LA CAMPAGNE (hypothèse du cours) : elle ajoute au trimestre l'équivalent de son budget de
 * publicité de l'année du cours. La publicité du trimestre double, puis revient à son niveau.
 */
export const HAUSSE_DE_LA_CAMPAGNE = 1;

/**
 * En dessous de 10 ventes gagnées sur l'année, la campagne ne gagne presque aucun client : le
 * chapitre ne s'y joue pas (la garde recompte la liste sur le moteur).
 */
export const VENTES_GAGNEES_MINIMUM = 10;

/**
 * Les entreprises où la campagne fait gagner des ventes sur l'année. Ailleurs, elle n'en gagne
 * presque aucune : le cabinet de conseil et l'entreprise du bâtiment manquent déjà d'équipe ou de
 * chantiers pour servir leurs clients, et la salle de sport est pleine en janvier.
 */
export const ENTREPRISES_DE_LA_CAMPAGNE = ["nova", "boutique", "hotel", "bistrot", "ecommerce", "transport"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const T = (n: number) => `T${n}`;
const ordinal = (n: number) => (n === 1 ? "premier" : n === 2 ? "deuxième" : n === 3 ? "troisième" : "quatrième");

/** Le budget de publicité de l'année du cours au trimestre `t`, multiplié par `k` : marque et articles compris. */
export function changementDeLaCampagne(code: string, trimestre: number, hausse: number): Changement {
  const reference = anneeDeReference(code);
  return (t, d): RoundDecisions | undefined => {
    const r = reference[t - 1];
    if (!r) return undefined;
    const k = t === trimestre ? 1 + hausse : 1;
    if (d.products && r.products) {
      const products = Object.fromEntries(
        Object.entries(d.products).map(([p, x]) => [p, { ...x, marketingBudget: (r.products![p]?.marketingBudget ?? 0) * k }]),
      );
      const articles = Object.values(products).reduce((s, x) => s + (x.marketingBudget ?? 0), 0);
      return { ...d, products, marketingBudget: articles };
    }
    return { ...d, marketingBudget: r.incomeStatement.marketingCost * k };
  };
}

/** L'année rejouée avec la campagne. */
export const anneeAvecLaCampagne = (code: string, trimestre: number, hausse: number) =>
  rejouerAvec(code, `un-nouveau-client:campagne-t${trimestre}-plus-${hausse}`, changementDeLaCampagne(code, trimestre, hausse));

/** Un trimestre, en ventes et en euros arrondis ; zéro après une défaillance. */
export interface TrimestreDeVente {
  trimestre: number;
  publicite: number;
  ventes: number;
  marge: number;
}

/** Les quatre trimestres d'une année : une entreprise défaillante ne vend plus les trimestres suivants. */
export function trimestresDeVente(annee: readonly CompanyRoundResult[]): TrimestreDeVente[] {
  return annee.map((r, i) =>
    annee.slice(0, i).some((x) => x.defaillant)
      ? { trimestre: i + 1, publicite: 0, ventes: 0, marge: 0 }
      : {
          trimestre: i + 1,
          publicite: Math.round(r.incomeStatement.marketingCost),
          ventes: Math.round(soldUnits(r)),
          marge: Math.round(r.incomeStatement.grossMargin),
        },
  );
}

const somme = (a: readonly TrimestreDeVente[], f: (x: TrimestreDeVente) => number) => a.reduce((t, x) => t + f(x), 0);

export type VerdictDeLaCampagne = "paie" | "ne-paie-pas";

/** Une campagne rejouée : les ventes et la marge gagnées, le coût d'une vente gagnée, et le verdict. */
export function campagneRejouee(c: Cas, trimestre: number, hausse: number) {
  const ref = anneeDeReference(c.code);
  const reference = trimestresDeVente(ref);
  const annee = anneeAvecLaCampagne(c.code, trimestre, hausse);
  const avec = trimestresDeVente(annee);
  const k = trimestre - 1;
  const budgetDuTrimestre = reference[k]!.publicite;
  const campagne = somme(avec, (x) => x.publicite) - somme(reference, (x) => x.publicite);
  const ventesSans = somme(reference, (x) => x.ventes);
  const ventesAvec = somme(avec, (x) => x.ventes);
  const ventesGagnees = ventesAvec - ventesSans;
  if (ventesGagnees <= 0) throw new Error(`La campagne ne fait rien vendre de plus chez ${c.entreprise} : le chapitre ne s'y joue pas.`);
  const gagneesAuTrimestre = avec[k]!.ventes - reference[k]!.ventes;
  const margeSans = somme(reference, (x) => x.marge);
  const margeAvec = somme(avec, (x) => x.marge);
  const margeGagnee = margeAvec - margeSans;
  const manquees = (r: CompanyRoundResult) => Math.round(Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0));
  const laisse = margeGagnee - campagne;
  return {
    trimestre,
    hausse,
    budgetDuTrimestre,
    campagne,
    reference,
    avec,
    ventesSans,
    ventesAvec,
    ventesGagnees,
    gagneesAuTrimestre,
    gagneesEnsuite: ventesGagnees - gagneesAuTrimestre,
    /** Les clients repartis sans être servis au trimestre de la campagne, sans et avec elle. */
    manqueesSans: manquees(ref[k]!),
    manqueesAvec: manquees(annee[k]!),
    coutDUneVente: auCentime(campagne / ventesGagnees),
    margeSans,
    margeAvec,
    margeGagnee,
    margeDUneVente: auCentime(margeGagnee / ventesGagnees),
    laisse,
    verdict: (laisse > 0 ? "paie" : "ne-paie-pas") as VerdictDeLaCampagne,
  };
}

/** La campagne du chapitre : la publicité de janvier doublée. */
export const campagneDuChapitre = (c: Cas) => campagneRejouee(c, TRIMESTRE_DE_LA_CAMPAGNE, HAUSSE_DE_LA_CAMPAGNE);

export function tableauDeLAnneeDuCours(c: Cas): TableauDeDonnees {
  const k = campagneDuChapitre(c);
  return {
    titre: `L'année ${dE(c.entreprise)} dans l'arène, sans campagne`,
    colonnes: [...k.reference.map((t) => T(t.trimestre)), "Année"],
    lignes: [
      { libelle: "Publicité", valeurs: [...k.reference.map((t) => eur(t.publicite)), eur(somme(k.reference, (x) => x.publicite))] },
      { libelle: `Ventes (${c.unites})`, valeurs: [...k.reference.map((t) => qte(t.ventes)), qte(k.ventesSans)] },
      { libelle: "Marge sur les ventes", valeurs: [...k.reference.map((t) => eur(t.marge)), eur(k.margeSans)] },
    ],
  };
}

/** Les deux années côte à côte : sans et avec une campagne. */
export function tableauDeLaCampagne(c: Cas, k: ReturnType<typeof campagneRejouee>, nom: string): TableauDeDonnees {
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec ${nom}`,
    colonnes: [...k.reference.map((t) => T(t.trimestre)), "Année"],
    lignes: [
      { libelle: "Publicité, sans campagne", valeurs: [...k.reference.map((t) => eur(t.publicite)), eur(somme(k.reference, (x) => x.publicite))] },
      { libelle: "Publicité, avec la campagne", valeurs: [...k.avec.map((t) => eur(t.publicite)), eur(somme(k.avec, (x) => x.publicite))] },
      { libelle: "Ventes, sans campagne", valeurs: [...k.reference.map((t) => qte(t.ventes)), qte(k.ventesSans)] },
      { libelle: "Ventes, avec la campagne", valeurs: [...k.avec.map((t) => qte(t.ventes)), qte(k.ventesAvec)] },
      { libelle: "Marge, sans campagne", valeurs: [...k.reference.map((t) => eur(t.marge)), eur(k.margeSans)] },
      { libelle: "Marge, avec la campagne", valeurs: [...k.avec.map((t) => eur(t.marge)), eur(k.margeAvec)] },
    ],
  };
}

/** Ce qu'est une vente gagnée, dans les mots de l'entreprise. */
const uneVenteGagnee = (c: Cas) => `une vente gagnée, c'est un client servi en plus, pour ${accord(c, "un")} ${c.unite}`;

/** Ce que la campagne laisse, en une phrase. */
export function ceQueLaCampagneLaisse(k: ReturnType<typeof campagneRejouee>): string {
  return k.laisse > 0
    ? `La campagne a fait gagner ${eur(k.margeGagnee)} de marge pour ${eur(k.campagne)} de dépense : elle laisse ${eur(k.laisse)} une fois payée.`
    : `La campagne a fait gagner ${eur(k.margeGagnee)} de marge pour ${eur(k.campagne)} de dépense : il manque ${eur(-k.laisse)} pour la payer.`;
}

export const UN_NOUVEAU_CLIENT: Chapitre = {
  code: "un-nouveau-client",
  parcours: "vente",
  palier: 2,
  blocs: ["Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale"],
  titre: "Ce que rapporte un nouveau client",
  accroche:
    "Une campagne de publicité amène des clients. Combien en gagne-t-elle, combien coûte chacun, quelle marge rapporte-t-il, et la campagne paie-t-elle ?",
  objectifs: [
    "Compter les ventes qu'une campagne fait gagner",
    "Calculer le coût d'une vente gagnée",
    "Calculer la marge qu'une vente gagnée rapporte",
    "Dire si une campagne paie",
    "Expliquer pourquoi un client gagné revient",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CAMPAGNE,
    pourquoi:
      "ce chapitre compte les clients qu'une campagne fait gagner, et ailleurs l'arène ne lui en fait gagner presque aucun : l'équipe, les chantiers ou les places manquent déjà.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une campagne pour gagner des clients",
      notions: ["customer_acquisition_cost"],
      tableau: tableauDeLAnneeDuCours,
      texte: (c) => {
        const k = campagneDuChapitre(c);
        return [
          `Au ${ordinal(k.trimestre)} trimestre, ${c.entreprise} dépense ${eur(k.budgetDuTrimestre)} en publicité. Le vendeur propose une campagne : ${eur(k.campagne)} de plus ce trimestre-là, puis le budget habituel. La publicité du trimestre double.`,
          "L'arène a rejoué l'année avec cette campagne, avec les mêmes concurrents et la même façon de gérer. Dans l'arène, la publicité rend l'entreprise plus attirante, mais chaque euro de plus attire un peu moins que le précédent.",
          `On ne compte pas les clients un par un : on compte les ventes. Ici, ${uneVenteGagnee(c)}.`,
        ];
      },
      repere: () =>
        "Coût d'une vente gagnée = coût de la campagne ÷ ventes gagnées. Marge d'une vente gagnée = marge gagnée ÷ ventes gagnées. La campagne paie si la marge gagnée dépasse son coût.",
    },
    {
      id: "ventes-gagnees",
      type: "montants",
      titre: "Les ventes gagnées",
      notions: ["customer_acquisition_cost", "revenue"],
      tableau: (c) => tableauDeLaCampagne(c, campagneDuChapitre(c), "la campagne"),
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `D'après le tableau, calculez les ventes gagnées au ${T(k.trimestre)}, le trimestre de la campagne, puis les ventes gagnées sur toute l'année.`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        const t = k.trimestre - 1;
        return [
          {
            libelle: `Ventes gagnées au ${T(k.trimestre)}`,
            attendu: k.gagneesAuTrimestre,
            calcul: `${qte(k.avec[t]!.ventes)} − ${qte(k.reference[t]!.ventes)} = ${qte(k.gagneesAuTrimestre)}`,
            tolerance: 0,
          },
          {
            libelle: "Ventes gagnées sur l'année",
            attendu: k.ventesGagnees,
            calcul: `${qte(k.ventesAvec)} − ${qte(k.ventesSans)} = ${qte(k.ventesGagnees)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        const auTrimestre =
          k.gagneesAuTrimestre > 0
            ? `La campagne fait gagner ${qte(k.gagneesAuTrimestre)} ventes au ${T(k.trimestre)}.`
            : `Au ${T(k.trimestre)}, la campagne ne fait gagner ${k.gagneesAuTrimestre === 0 ? "aucune vente" : "aucune vente de plus"} : ${c.entreprise} n'avait pas préparé de quoi servir plus de clients. Les clients en plus sont repartis sans être servis : ${qte(k.manqueesAvec)} ventes manquées au lieu de ${qte(k.manqueesSans)} sans la campagne.`;
        return [
          `${auTrimestre} Sur l'année, elle en fait gagner ${qte(k.ventesGagnees)}${k.gagneesAuTrimestre === 0 ? ", toutes après le trimestre de la campagne" : k.gagneesEnsuite > 0 && k.gagneesAuTrimestre > 0 ? `, dont ${qte(k.gagneesEnsuite)} après le trimestre de la campagne` : ""}.`,
        ];
      },
    },
    {
      id: "apres-la-campagne",
      type: "choix",
      titre: "Des ventes après la campagne",
      notions: ["demand_market_share"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `La campagne ne dure que le ${ordinal(k.trimestre)} trimestre. Pourtant, ${c.entreprise} fait ${qte(k.gagneesEnsuite)} ${k.gagneesEnsuite > 1 ? "ventes" : "vente"} de plus après. Pourquoi ?`;
      },
      options: (c) => {
        const k = campagneDuChapitre(c);
        return [
          {
            texte: "Les clients attirés comptent encore au trimestre suivant",
            juste: true,
            retour: `Oui. Dans l'arène, la part de clientèle gagnée au ${T(k.trimestre)} rend l'entreprise plus attirante au trimestre suivant : c'est la fidélité. Et la gestion, qui a vu plus de demande, prépare plus pour le trimestre d'après.`,
          },
          {
            texte: "La publicité reste doublée toute l'année",
            juste: false,
            retour: `Non : le tableau le montre, la publicité revient à ${eur(k.reference[k.trimestre]?.publicite ?? k.budgetDuTrimestre)} dès le trimestre suivant.`,
          },
          {
            texte: "Ces ventes n'ont rien à voir avec la campagne",
            juste: false,
            retour: "Non : l'année a été rejouée avec les mêmes concurrents et la même façon de gérer. Seule la publicité du trimestre de la campagne a changé : tout l'écart en vient.",
          },
        ];
      },
      si: (c) => campagneDuChapitre(c).gagneesEnsuite > 0,
    },
    {
      id: "cout-d-une-vente",
      type: "montants",
      titre: "Le coût d'une vente gagnée",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `La campagne a coûté ${eur(k.campagne)} et fait gagner ${qte(k.ventesGagnees)} ventes sur l'année. Calculez le coût d'une vente gagnée (au centime).`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        return [{ libelle: "Coût d'une vente gagnée", attendu: k.coutDUneVente, calcul: `${eur(k.campagne)} ÷ ${qte(k.ventesGagnees)} = ${eur(k.coutDUneVente)}` }];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        return [`Chaque vente gagnée, chaque client servi en plus, a coûté ${eur(k.coutDUneVente)} de publicité. Il reste à savoir ce qu'elle rapporte.`];
      },
    },
    {
      id: "marge-d-une-vente",
      type: "montants",
      titre: "La marge qu'une vente gagnée rapporte",
      notions: ["contribution_margin"],
      tableau: (c) => tableauDeLaCampagne(c, campagneDuChapitre(c), "la campagne"),
      question: () =>
        "Une vente ne rapporte pas son prix, mais sa marge : ce qui reste une fois payé ce que la vente coûte à l'entreprise. D'après le tableau, calculez la marge gagnée sur l'année, puis la marge d'une vente gagnée (au centime).",
      champs: (c) => {
        const k = campagneDuChapitre(c);
        return [
          { libelle: "Marge gagnée sur l'année", attendu: k.margeGagnee, calcul: `${eur(k.margeAvec)} − ${eur(k.margeSans)} = ${eur(k.margeGagnee)}`, tolerance: 1 },
          { libelle: "Marge d'une vente gagnée", attendu: k.margeDUneVente, calcul: `${eur(k.margeGagnee)} ÷ ${qte(k.ventesGagnees)} = ${eur(k.margeDUneVente)}` },
        ];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        return [`Chaque vente gagnée laisse ${eur(k.margeDUneVente)} de marge en moyenne. Elle a coûté ${eur(k.coutDUneVente)} de publicité.`];
      },
    },
    {
      id: "la-campagne-paie",
      type: "choix",
      titre: "La campagne paie-t-elle ?",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `Une vente gagnée a coûté ${eur(k.coutDUneVente)} de publicité et rapporte ${eur(k.margeDUneVente)} de marge. La campagne paie-t-elle ?`;
      },
      options: (c) => {
        const k = campagneDuChapitre(c);
        const paie = k.verdict === "paie";
        const phrase = ceQueLaCampagneLaisse(k);
        return [
          {
            texte: "Oui : une vente gagnée rapporte plus qu'elle n'a coûté",
            juste: paie,
            retour: paie ? `Oui. ${phrase}` : `Non : ${eur(k.margeDUneVente)} de marge pour ${eur(k.coutDUneVente)} de publicité. ${phrase}`,
          },
          {
            texte: "Non : une vente gagnée coûte plus qu'elle ne rapporte",
            juste: !paie,
            retour: !paie ? `Oui. ${phrase}` : `Non : ${eur(k.margeDUneVente)} de marge pour ${eur(k.coutDUneVente)} de publicité. ${phrase}`,
          },
          {
            texte: "Oui, puisque le chiffre d'affaires monte",
            juste: false,
            retour: `Non : une vente gagnée ne rapporte pas son prix, seulement sa marge. ${phrase}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      texte: (c) => {
        const k = campagneDuChapitre(c);
        return [
          `Chez ${c.entreprise}, la campagne de ${eur(k.campagne)} a fait gagner ${qte(k.ventesGagnees)} ventes sur l'année. Chacune a coûté ${eur(k.coutDUneVente)} et rapporte ${eur(k.margeDUneVente)} de marge : ${k.verdict === "paie" ? "la campagne paie" : "la campagne ne paie pas"}. Le résultat de l'année en est ${k.laisse > 0 ? "plus haut" : "plus bas"} de ${eur(Math.abs(k.laisse))}, à l'arrondi près.`,
          "Avant de lancer une campagne, le vendeur compare deux chiffres : ce que coûte un client gagné, et la marge qu'il rapporte. Un client gagné qui revient rapporte encore les trimestres suivants.",
        ];
      },
      repere: () => "Coût d'une vente gagnée = coût de la campagne ÷ ventes gagnées. La campagne paie si la marge d'une vente gagnée dépasse son coût.",
    },
  ],
};
