import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { soldesDeGestion } from "./soldes-intermediaires";

/**
 * CHAPITRE : LE COMPTE DE RÉSULTAT (Bac STMG, gestion et finance, palier 1).
 *
 * Ce que l'année a rapporté : les produits, les charges, et ce qui reste entre les deux. Le
 * chapitre lit le compte de résultat de l'année de l'arène, range les charges selon leur nature
 * (celles de l'activité, celles du financement, l'impôt), calcule le résultat et ce qu'il
 * représente sur cent euros de ventes, puis compare le résultat de l'activité à celui de l'année.
 *
 * Les montants sont ceux de l'année de l'arène, en grandes masses, que les chapitres « La
 * clôture » et « Soldes intermédiaires de gestion » vérifient à l'euro près (`soldesDeGestion`).
 * Aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le compte de résultat de l'année, ses totaux et ses taux. */
export function compteDeResultat(c: Cas) {
  const s = soldesDeGestion(c);
  // La variation de stock s'ajoute aux produits (production stockée) ou retranche des achats (marchandises).
  const produits = auCentime(s.ventes + (s.marchandises ? 0 : s.variation));
  const achatsConsommes = auCentime(s.marchandises ? s.achats - s.variation : s.achats);
  const exploitation = auCentime(achatsConsommes + s.autres + s.commissions + s.publicite + s.entretien + s.loyerEtFrais + s.personnel + s.dotation);
  const charges = auCentime(exploitation + s.interets + s.impot);
  const resultat = auCentime(produits - charges);
  return {
    s,
    produits,
    achatsConsommes,
    exploitation,
    financieres: s.interets,
    impot: s.impot,
    charges,
    resultat,
    resultatExploitation: auCentime(produits - exploitation),
    tauxDeResultat: auDixieme((resultat / s.ventes) * 100),
    partDuPersonnel: auDixieme((s.personnel / charges) * 100),
    benefice: resultat >= 0,
  };
}

export const LIRE_LE_COMPTE_DE_RESULTAT: Chapitre = {
  code: "lire-le-compte-de-resultat",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
    "2de MG · Évaluer et évoluer, du pilotage aux développements numériques",
    "2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?",
  ],
  titre: "Le compte de résultat : ce que l'année a rapporté",
  accroche:
    "Les produits d'un côté, les charges de l'autre, et ce qui reste entre les deux : le résultat. Lire l'année d'une entreprise, et dire ce qu'elle gagne sur cent euros de ventes.",
  objectifs: [
    "Distinguer produits et charges",
    "Ranger les charges selon leur nature : activité, financement, impôt",
    "Calculer le résultat de l'année",
    "Calculer et interpréter un taux de résultat",
    "Distinguer le résultat de l'activité et le résultat de l'année",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année d'activité",
      notions: ["income_statement"],
      texte: (c) => {
        const k = compteDeResultat(c);
        return [
          `Le compte de résultat raconte une année : ce que l'entreprise a gagné en vendant (les produits) et ce que cela lui a coûté (les charges). Voici l'année ${dE(c.entreprise)} dans la simulation du cours, en grandes masses.`,
          `Les produits sont surtout les ventes : ${eur(k.s.ventes)}. Les charges sont de trois natures : celles de l'activité (achats, personnel, loyer, usure de l'équipement...), celles du financement (les intérêts de l'emprunt) et l'impôt sur les bénéfices.`,
        ];
      },
      tableau: (c) => {
        const k = compteDeResultat(c);
        const s = k.s;
        const lignes = [{ libelle: s.marchandises ? "Ventes de marchandises" : "Ventes", valeurs: [eur(s.ventes)] }];
        if (!s.marchandises && s.variation !== 0) lignes.push({ libelle: "Production stockée", valeurs: [eur(s.variation)] });
        lignes.push(
          { libelle: s.marchandises ? "Achats de marchandises consommés" : "Achats", valeurs: [eur(k.achatsConsommes)] },
          { libelle: "Autres coûts variables et qualité", valeurs: [eur(s.autres)] },
        );
        if (s.commissions > 0) lignes.push({ libelle: "Commissions", valeurs: [eur(s.commissions)] });
        lignes.push(
          { libelle: "Publicité", valeurs: [eur(s.publicite)] },
          { libelle: "Entretien", valeurs: [eur(s.entretien)] },
          { libelle: "Loyer et frais de structure", valeurs: [eur(s.loyerEtFrais)] },
          { libelle: "Personnel", valeurs: [eur(s.personnel)] },
          { libelle: "Usure de l'équipement (amortissement)", valeurs: [eur(s.dotation)] },
          { libelle: "Intérêts de l'emprunt", valeurs: [eur(s.interets)] },
          { libelle: "Impôt sur les bénéfices", valeurs: [eur(s.impot)] },
        );
        return { titre: `L'année ${dE(c.entreprise)} dans la simulation du cours`, colonnes: ["Montant"], lignes };
      },
      repere: () => "Résultat = produits − charges. Positif, c'est un bénéfice ; négatif, une perte.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "La nature des charges",
      notions: ["income_statement"],
      question: () => "Rangez chaque charge selon sa nature : elle vient de l'activité de l'entreprise, de son financement, ou c'est l'impôt sur les bénéfices.",
      categories: [
        { code: "exploitation", libelle: "Activité" },
        { code: "financiere", libelle: "Financement" },
        { code: "impot", libelle: "Impôt" },
      ],
      elements: (c) => {
        const k = compteDeResultat(c);
        const s = k.s;
        const el = [
          { libelle: s.marchandises ? "Achats de marchandises consommés" : "Achats", montant: k.achatsConsommes, categorie: "exploitation", pourquoi: "Ce qu'il faut acheter pour vendre : c'est l'activité." },
          { libelle: "Personnel", montant: s.personnel, categorie: "exploitation", pourquoi: "Les salaires de l'équipe qui fait tourner l'entreprise." },
          { libelle: "Loyer et frais de structure", montant: s.loyerEtFrais, categorie: "exploitation", pourquoi: "Le lieu et les frais qui permettent l'activité." },
          { libelle: "Usure de l'équipement (amortissement)", montant: s.dotation, categorie: "exploitation", pourquoi: "L'équipement s'use en servant l'activité : sa perte de valeur est une charge de l'activité." },
          { libelle: "Intérêts de l'emprunt", montant: s.interets, categorie: "financiere", pourquoi: "Le prix de l'argent prêté par la banque : c'est le financement, pas l'activité." },
        ];
        if (s.impot > 0) el.push({ libelle: "Impôt sur les bénéfices", montant: s.impot, categorie: "impot", pourquoi: "L'État prélève une part du bénéfice de l'année." });
        return el;
      },
      explication: () => [
        "Les distinguer, c'est savoir d'où vient le résultat : de l'activité elle-même, ou de la façon dont l'entreprise est financée.",
      ],
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat de l'année",
      notions: ["income_statement", "revenue"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Calculez le total des produits, le total des charges (activité ${eur(k.exploitation)}, intérêts ${eur(k.financieres)}, impôt ${eur(k.impot)}), puis le résultat de l'année ${dE(c.entreprise)}.`;
      },
      champs: (c) => {
        const k = compteDeResultat(c);
        return [
          { libelle: "Total des produits", attendu: k.produits, calcul: k.s.marchandises || k.s.variation === 0 ? `${eur(k.s.ventes)}` : `${eur(k.s.ventes)} + ${eur(k.s.variation)} = ${eur(k.produits)}`, tolerance: 1 },
          { libelle: "Total des charges", attendu: k.charges, calcul: `${eur(k.exploitation)} + ${eur(k.financieres)} + ${eur(k.impot)} = ${eur(k.charges)}`, tolerance: 1 },
          { libelle: "Résultat de l'année", attendu: k.resultat, calcul: `${eur(k.produits)} − ${eur(k.charges)} = ${eur(k.resultat)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = compteDeResultat(c);
        return [
          k.benefice
            ? `${c.entreprise} termine l'année sur un bénéfice de ${eur(k.resultat)} : ses produits ont couvert toutes ses charges, et il en reste.`
            : `${c.entreprise} termine l'année sur une perte de ${eur(-k.resultat)} : ses produits n'ont pas couvert toutes ses charges.`,
          `C'est le résultat que la simulation du cours donne pour l'année, à l'euro près : ${eur(k.s.arene.resultatNet)}.`,
        ];
      },
    },
    {
      id: "taux",
      type: "montants",
      titre: "Sur cent euros de ventes",
      notions: ["income_statement", "margin_rates"],
      question: (c) =>
        `Pour comparer des entreprises de tailles différentes, on rapporte le résultat aux ventes. Calculez le taux de résultat ${dE(c.entreprise)} (résultat ÷ ventes × 100), puis la part du personnel dans ses charges, en pourcentage au dixième.`,
      champs: (c) => {
        const k = compteDeResultat(c);
        return [
          { libelle: "Taux de résultat (%)", attendu: k.tauxDeResultat, calcul: `${eur(k.resultat)} ÷ ${eur(k.s.ventes)} × 100 = ${pct(k.tauxDeResultat)}`, tolerance: 0.1 },
          { libelle: "Part du personnel dans les charges (%)", attendu: k.partDuPersonnel, calcul: `${eur(k.s.personnel)} ÷ ${eur(k.charges)} × 100 = ${pct(k.partDuPersonnel)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = compteDeResultat(c);
        return [
          k.benefice
            ? `Sur 100 € de ventes, ${c.entreprise} garde ${pct(k.tauxDeResultat).replace(" %", " €")} de bénéfice. Le reste a payé ses charges, dont le personnel, qui en représente ${pct(k.partDuPersonnel)}.`
            : `Sur 100 € de ventes, ${c.entreprise} perd ${pct(-k.tauxDeResultat).replace(" %", " €")}. Le personnel représente ${pct(k.partDuPersonnel)} de ses charges.`,
        ];
      },
    },
    {
      id: "activite-ou-financement",
      type: "choix",
      titre: "L'activité ou le financement",
      notions: ["income_statement"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Avant les intérêts et l'impôt, l'activité seule ${dE(c.entreprise)} dégage ${eur(k.resultatExploitation)}. Que dit ce chiffre ?`;
      },
      options: (c) => {
        const k = compteDeResultat(c);
        const activiteRentable = k.resultatExploitation > 0;
        return [
          {
            texte: "L'activité est rentable : ce sont les intérêts et l'impôt qui réduisent le résultat",
            juste: activiteRentable,
            retour: activiteRentable
              ? `Oui : l'activité dégage ${eur(k.resultatExploitation)}. Les intérêts (${eur(k.financieres)}) et l'impôt (${eur(k.impot)}) en prennent une part, et il reste ${eur(k.resultat)}.`
              : `Non : l'activité elle-même perd ${eur(-k.resultatExploitation)}, avant même les intérêts et l'impôt.`,
          },
          {
            texte: "L'activité elle-même perd de l'argent : le problème n'est pas le financement",
            juste: !activiteRentable,
            retour: !activiteRentable
              ? `Oui : avant les intérêts, l'activité perd déjà ${eur(-k.resultatExploitation)}. Rembourser l'emprunt plus vite ne changerait presque rien : ce sont les ventes et les charges de l'activité qu'il faut revoir.`
              : `Non : l'activité dégage ${eur(k.resultatExploitation)} avant les intérêts et l'impôt.`,
          },
          {
            texte: "On ne peut rien dire sans le bilan",
            juste: false,
            retour: "Non : le compte de résultat suffit pour séparer ce que gagne l'activité de ce que coûte le financement. Le bilan, lui, dira ce que l'entreprise possède, et ce qu'elle doit.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement"],
      texte: (c) => {
        const k = compteDeResultat(c);
        return [
          `Sur l'année, ${c.entreprise} a réalisé ${eur(k.s.ventes)} de ventes et ${k.benefice ? `un bénéfice de ${eur(k.resultat)}` : `une perte de ${eur(-k.resultat)}`}, soit ${pct(k.tauxDeResultat)} de ses ventes.`,
          "Le compte de résultat dit si l'entreprise gagne de l'argent, et d'où vient ce qu'elle gagne ou perd : de son activité, de son financement, de l'impôt. Il ne dit pas si elle a de l'argent en caisse : c'est la trésorerie, une autre question.",
        ];
      },
      repere: () => "Compte de résultat : produits − charges = résultat. Taux de résultat = résultat ÷ chiffre d'affaires × 100.",
    },
  ],
};
