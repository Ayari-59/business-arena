import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { BAISSE_DE_PRIX, POURQUOI_PRIX_COUT_MARGE, prixCoutMarge } from "../chapitres/prix-cout-marge";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE } from "../monde/gestion-et-information";
import type { Situation } from "./types";

/**
 * CAS PRATIQUE : SUIVRE LA BAISSE DU CONCURRENT ? (contrôle de gestion, palier 2).
 *
 * La direction demande, avant de décider, ce que coûterait une baisse de prix de
 * 10 % pour s'aligner sur un concurrent. L'élève a les documents du mois et rend
 * une réponse chiffrée : la marge perdue par unité, les ventes qu'il faudrait pour
 * garder la même marge du mois, le seuil de rentabilité après la baisse, puis la
 * phrase qu'il envoie à la direction.
 *
 * Aucun cours : les notions sont celles des chapitres « Prix, coût et marge » et
 * « Le seuil de rentabilité », que la situation reprend dans un ordre que l'élève
 * doit trouver seul. Les chiffres sont ceux du mois de janvier de NOVA (monde/gestion-et-information.ts), et la
 * baisse étudiée est celle du chapitre « Prix, coût et marge » (BAISSE_DE_PRIX).
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function baisseDuConcurrent(c: Cas) {
  const m = prixCoutMarge(c);
  // Garder la même marge du mois, c'est garder le même résultat : les charges fixes
  // ne bougent pas. La quantité s'arrondit à l'unité supérieure, puisqu'une unité
  // de moins ne suffirait pas.
  const quantiteNecessaire =
    m.margeBaissee > 0 ? Math.ceil(m.margeDuMois / m.margeBaissee - 1e-9) : null;
  const hausse =
    quantiteNecessaire !== null ? auDixieme((quantiteNecessaire / m.quantite - 1) * 100) : null;
  const seuilApres =
    m.margeBaissee > 0 ? Math.ceil(m.chargesFixes / m.margeBaissee - 1e-9) : null;
  return {
    ...m,
    margePerdue: auCentime(m.marge - m.margeBaissee),
    quantiteNecessaire,
    hausse,
    seuilApres,
  };
}

const vendable = (c: Cas) => prixCoutMarge(c).margeBaissee > 0;

export const SUIVRE_LA_BAISSE: Situation = {
  code: "suivre-la-baisse-du-concurrent",
  parcours: "controle-de-gestion",
  palier: 2,
  blocs: [],
  reprend: ["prix-cout-et-marge", "seuil-de-rentabilite"],
  commanditaire: "La direction",
  titre: "Suivre la baisse du concurrent ?",
  accroche:
    "Un concurrent baisse ses prix de 10 %. Avant de décider, la direction vous demande ce que coûterait de le suivre, chiffres à l'appui.",
  objectifs: [
    "Calculer la marge d'une unité et celle du mois à partir des documents",
    "Mesurer ce qu'une baisse de prix retire à la marge d'une unité",
    "Calculer les ventes qu'il faudrait pour garder la même marge du mois",
    "Calculer le seuil de rentabilité après la baisse",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_PRIX_COUT_MARGE },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« Notre principal concurrent vient de baisser ses prix de ${pct(BAISSE_DE_PRIX * 100)}. Avant de décider si ${c.entreprise} le suit, je veux savoir ce que cela nous coûterait, et combien il faudrait vendre en plus pour que ce soit sans perte. Je vous joins les chiffres du mois. Réponse attendue vendredi. »`,
        "Pas de cours cette fois : vous avez les documents, et les calculs sont ceux que vous connaissez. À vous de les enchaîner.",
      ],
      tableau: (c) => {
        const m = prixCoutMarge(c);
        return {
          titre: `Les chiffres du mois · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prix de vente moyen d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(m.prix)] },
            { libelle: "Achats par unité vendue", valeurs: [eur(m.matiere)] },
            { libelle: `Autres coûts par unité (${m.autresCoutsVariables})`, valeurs: [eur(m.autres)] },
            { libelle: "Unités vendues dans le mois", valeurs: [qte(m.quantite)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(m.chargesFixes)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge perdue par unité, les ventes nécessaires pour garder la même marge du mois, le seuil après la baisse, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La marge aujourd'hui",
      notions: ["margin_rates"],
      question: () =>
        "Commencez par la situation d'aujourd'hui : la marge d'une unité, la marge du mois, puis le résultat du mois.",
      champs: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          { libelle: "Marge d'une unité", attendu: m.marge, calcul: `${eur(m.prix)} − (${eur(m.matiere)} + ${eur(m.autres)}) = ${eur(m.marge)}` },
          { libelle: "Marge du mois", attendu: m.margeDuMois, calcul: `${eur(m.marge)} × ${qte(m.quantite)} = ${eur(m.margeDuMois)}`, tolerance: 1 },
          { libelle: "Résultat du mois", attendu: m.resultat, calcul: `${eur(m.margeDuMois)} − ${eur(m.chargesFixes)} = ${eur(m.resultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          m.resultat >= 0
            ? `Aujourd'hui, ${c.entreprise} gagne ${eur(m.resultat)} dans le mois : sa marge paie les charges fixes, et il en reste.`
            : `Aujourd'hui, ${c.entreprise} perd ${eur(-m.resultat)} dans le mois : sa marge ne paie pas toutes les charges fixes. Une baisse de prix part donc d'une situation déjà fragile.`,
        ];
      },
    },
    {
      id: "apres-la-baisse",
      type: "montants",
      titre: "Avec un prix plus bas",
      notions: ["margin_rates"],
      question: () =>
        `Si l'entreprise suit la baisse de ${pct(BAISSE_DE_PRIX * 100)}, que devient le prix d'une unité, et sa marge ? De combien la marge d'une unité baisse-t-elle, en pourcentage, au dixième ?`,
      champs: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          { libelle: "Nouveau prix", attendu: m.prixBaisse, calcul: `${eur(m.prix)} × (1 − ${pct(BAISSE_DE_PRIX * 100)}) = ${eur(m.prixBaisse)}` },
          { libelle: "Nouvelle marge d'une unité", attendu: m.margeBaissee, calcul: `${eur(m.prixBaisse)} − ${eur(m.cout)} = ${eur(m.margeBaissee)}` },
          { libelle: "Baisse de la marge d'une unité (%)", attendu: m.baisseDeLaMarge, calcul: `(${eur(m.marge)} − ${eur(m.margeBaissee)}) ÷ ${eur(m.marge)} × 100 = ${pct(m.baisseDeLaMarge)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          `Le prix baisse de ${pct(BAISSE_DE_PRIX * 100)}, mais la marge d'une unité baisse de ${pct(m.baisseDeLaMarge)} : le coût, lui, ne bouge pas, et toute la baisse se prend sur la marge.`,
        ];
      },
    },
    {
      id: "ventes-necessaires",
      type: "montants",
      titre: "Ce qu'il faudrait vendre",
      notions: ["breakeven"],
      si: vendable,
      question: () =>
        "Pour garder la même marge du mois, donc le même résultat, combien d'unités faudrait-il vendre au nouveau prix (à l'unité supérieure) ? Quelle hausse des ventes cela représente-t-il, en pourcentage, au dixième ?",
      champs: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          { libelle: "Unités à vendre", attendu: m.quantiteNecessaire!, calcul: `${eur(m.margeDuMois)} ÷ ${eur(m.margeBaissee)}, arrondi à l'unité supérieure = ${qte(m.quantiteNecessaire!)}` },
          { libelle: "Hausse des ventes (%)", attendu: m.hausse!, calcul: `(${qte(m.quantiteNecessaire!)} ÷ ${qte(m.quantite)} − 1) × 100 = ${pct(m.hausse!)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          `Une baisse de prix de ${pct(BAISSE_DE_PRIX * 100)} demande ${pct(m.hausse!)} de ventes en plus pour seulement garder la même marge. Tant que les ventes montent moins, ${c.entreprise} perd de l'argent à suivre le concurrent.`,
        ];
      },
    },
    {
      id: "seuil-apres",
      type: "montants",
      titre: "Le seuil après la baisse",
      notions: ["breakeven"],
      si: vendable,
      question: () =>
        "Au nouveau prix, à partir de combien d'unités vendues dans le mois l'entreprise couvre-t-elle ses charges fixes ? Arrondissez à l'unité supérieure.",
      champs: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          { libelle: "Seuil de rentabilité (unités)", attendu: m.seuilApres!, calcul: `${eur(m.chargesFixes)} ÷ ${eur(m.margeBaissee)}, arrondi à l'unité supérieure = ${qte(m.seuilApres!)}` },
        ];
      },
      explication: (c) => {
        const m = baisseDuConcurrent(c);
        return [
          m.quantite >= m.seuilApres!
            ? `Avec les ventes d'aujourd'hui (${qte(m.quantite)}), ${c.entreprise} resterait au-dessus de son seuil : la baisse réduit son résultat sans la mettre en perte.`
            : `Avec les ventes d'aujourd'hui (${qte(m.quantite)}), ${c.entreprise} passerait sous son seuil : sans ventes en plus, la baisse la met en perte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const m = baisseDuConcurrent(c);
        if (m.hausse === null) {
          return [
            { texte: "Le nouveau prix ne couvre même pas le coût d'une unité", juste: true, retour: "Oui : chaque vente ferait perdre de l'argent, quel que soit le volume." },
            { texte: "Il suffirait de vendre 10 % de plus pour compenser", juste: false, retour: "Non : la marge d'une unité devient nulle ou négative, vendre plus aggrave la perte." },
            { texte: "La marge du mois baisserait de 10 %, comme le prix", juste: false, retour: "Non : le coût ne bouge pas, toute la baisse se prend sur la marge." },
          ];
        }
        return [
          {
            texte: `Il faudrait ${pct(m.hausse)} de ventes en plus pour garder notre marge`,
            juste: true,
            retour: `Oui : la marge d'une unité perd ${eur(m.margePerdue)}, et il faut ${qte(m.quantiteNecessaire!)} unités au lieu de ${qte(m.quantite)} pour garder la même marge du mois. La direction peut alors juger si le marché le permet.`,
          },
          {
            texte: "Il suffirait de vendre 10 % de plus, puisque le prix baisse de 10 %",
            juste: false,
            retour: `Non : le prix baisse de 10 %, mais la marge d'une unité baisse de ${pct(m.baisseDeLaMarge)}, et c'est la marge qu'il faut retrouver : ${pct(m.hausse)} de ventes en plus.`,
          },
          {
            texte: "Notre marge du mois baisserait de 10 %, comme le prix",
            juste: false,
            retour: `Non : à ventes égales, la marge du mois baisserait de ${pct(m.baisseDeLaMarge)}, pas de 10 %. Le coût d'une unité ne bouge pas.`,
          },
        ];
      },
    },
  ],
};
