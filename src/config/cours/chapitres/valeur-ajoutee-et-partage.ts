import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { compteDeResultat } from "./lire-le-compte-de-resultat";

/**
 * CHAPITRE : LA VALEUR AJOUTÉE ET SON PARTAGE (Bac STMG, gestion et finance, palier 1).
 *
 * Ce que l'entreprise crée par son travail : ce qu'elle produit, moins ce qu'elle a acheté à
 * d'autres entreprises pour le produire. Puis le partage de cette richesse entre ceux qui y ont
 * contribué : les salariés, les prêteurs, l'État, et l'entreprise elle-même, qui garde de quoi
 * renouveler son équipement et se développer.
 *
 * Les montants sont ceux de l'année de l'arène (`compteDeResultat`, qui reprend les soldes de
 * gestion vérifiés à l'euro près). L'arène ne verse pas de dividendes : la part des associés
 * reste dans l'entreprise, et le chapitre le dit. Aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La valeur ajoutée de l'année et ses parts. */
export function valeurAjoutee(c: Cas) {
  const k = compteDeResultat(c);
  const s = k.s;
  const consommations = auCentime(k.achatsConsommes + s.autres + s.commissions + s.publicite + s.entretien + s.loyerEtFrais);
  const va = auCentime(k.produits - consommations);
  const entreprise = auCentime(s.dotation + k.resultat);
  const part = (x: number) => auDixieme((x / va) * 100);
  const parts = [
    { code: "salaries", nom: "Les salariés", montant: s.personnel, part: part(s.personnel), quoi: "les salaires et les cotisations" },
    { code: "preteurs", nom: "Les prêteurs", montant: s.interets, part: part(s.interets), quoi: "les intérêts de l'emprunt" },
    { code: "etat", nom: "L'État", montant: s.impot, part: part(s.impot), quoi: "l'impôt sur les bénéfices" },
    { code: "entreprise", nom: "L'entreprise elle-même", montant: entreprise, part: part(entreprise), quoi: "l'usure de l'équipement à remplacer et le résultat de l'année" },
  ];
  return {
    k,
    consommations,
    va,
    tauxDeValeurAjoutee: auDixieme((va / s.ventes) * 100),
    entreprise,
    parts,
    premiere: parts.reduce((a, b) => (b.montant > a.montant ? b : a)),
  };
}

export const VALEUR_AJOUTEE: Chapitre = {
  code: "valeur-ajoutee-et-partage",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
  ],
  titre: "La valeur ajoutée et son partage",
  accroche:
    "Ce que l'entreprise crée vraiment, une fois retiré ce qu'elle a acheté à d'autres. Et qui en profite : les salariés, les prêteurs, l'État, l'entreprise elle-même.",
  objectifs: [
    "Distinguer la production et les consommations venues d'autres entreprises",
    "Calculer la valeur ajoutée et le taux de valeur ajoutée",
    "Calculer le partage de la valeur ajoutée",
    "Interpréter ce partage",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'entreprise crée",
      notions: ["income_statement"],
      texte: (c) => {
        const v = valeurAjoutee(c);
        return [
          `En vendant ${eur(v.k.s.ventes)} dans l'année, ${c.entreprise} n'a pas créé ${eur(v.k.s.ventes)} de richesse : une partie de ce prix paie ce qu'elle a acheté à d'autres entreprises (les marchandises ou les matières, l'énergie, la publicité, le loyer). Cette part, ce sont les consommations ; la richesse que d'autres ont créée.`,
          // La production n'est pas les ventes quand le stock de produits a bougé : la richesse
          // créée se mesure sur ce qui a été produit dans l'année, vendu ou mis en stock.
          ...(v.k.produits !== v.k.s.ventes
            ? [
                `Sa production de l'année, ${eur(v.k.produits)}, n'est pas tout à fait ses ventes : ${v.k.produits > v.k.s.ventes ? "une partie de ce qu'elle a produit attend en stock" : "une partie de ce qu'elle a vendu sortait du stock du début d'année"}. La richesse créée se mesure sur la production de l'année.`,
              ]
            : []),
          "Ce qui reste est la valeur ajoutée : la richesse que l'entreprise a créée elle-même, par le travail de son équipe et l'usage de son équipement.",
        ];
      },
      tableau: (c) => {
        const v = valeurAjoutee(c);
        const s = v.k.s;
        const lignes = [
          {
            libelle: v.k.produits === s.ventes ? "Ventes de l'année" : "Production de l'année (ventes et variation du stock de produits)",
            valeurs: [eur(v.k.produits)],
          },
          { libelle: s.marchandises ? "Marchandises consommées" : "Achats consommés", valeurs: [eur(v.k.achatsConsommes)] },
          { libelle: "Autres coûts variables et qualité", valeurs: [eur(s.autres)] },
        ];
        if (s.commissions > 0) lignes.push({ libelle: "Commissions", valeurs: [eur(s.commissions)] });
        lignes.push(
          { libelle: "Publicité", valeurs: [eur(s.publicite)] },
          { libelle: "Entretien", valeurs: [eur(s.entretien)] },
          { libelle: "Loyer et frais de structure", valeurs: [eur(s.loyerEtFrais)] },
        );
        return { titre: "La production et les consommations de l'année", colonnes: ["Montant"], lignes };
      },
      repere: () => "Valeur ajoutée = production − consommations venues d'autres entreprises.",
    },
    {
      id: "va",
      type: "montants",
      titre: "La valeur ajoutée",
      notions: ["income_statement"],
      question: (c) => `Calculez le total des consommations venues d'autres entreprises, la valeur ajoutée ${dE(c.entreprise)}, puis le taux de valeur ajoutée (valeur ajoutée ÷ ventes × 100), au dixième.`,
      champs: (c) => {
        const v = valeurAjoutee(c);
        return [
          { libelle: "Consommations", attendu: v.consommations, calcul: `somme des consommations = ${eur(v.consommations)}`, tolerance: 1 },
          { libelle: "Valeur ajoutée", attendu: v.va, calcul: `${eur(v.k.produits)} − ${eur(v.consommations)} = ${eur(v.va)}`, tolerance: 2 },
          { libelle: "Taux de valeur ajoutée (%)", attendu: v.tauxDeValeurAjoutee, calcul: `${eur(v.va)} ÷ ${eur(v.k.s.ventes)} × 100 = ${pct(v.tauxDeValeurAjoutee)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const v = valeurAjoutee(c);
        return [
          `Sur 100 € de ventes, ${c.entreprise} crée ${pct(v.tauxDeValeurAjoutee).replace(" %", " €")} de richesse ; le reste paie le travail d'autres entreprises. Un commerçant qui revend a souvent un taux faible ; une entreprise de services, dont la richesse est le travail de son équipe, un taux élevé.`,
        ];
      },
    },
    {
      id: "partage",
      type: "montants",
      titre: "Le partage de la valeur ajoutée",
      notions: ["income_statement"],
      tableau: (c) => {
        const v = valeurAjoutee(c);
        return {
          titre: "Qui reçoit la valeur ajoutée",
          colonnes: ["Montant"],
          lignes: v.parts.map((p) => ({ libelle: `${p.nom} (${p.quoi})`, valeurs: [eur(p.montant)] })),
        };
      },
      question: (c) => {
        const v = valeurAjoutee(c);
        return `La valeur ajoutée de ${eur(v.va)} se partage entre ceux qui ont contribué à la créer. Calculez la part des salariés et celle de l'entreprise elle-même, en pourcentage de la valeur ajoutée, au dixième.`;
      },
      champs: (c) => {
        const v = valeurAjoutee(c);
        const salaries = v.parts[0]!;
        const entreprise = v.parts[3]!;
        return [
          { libelle: "Part des salariés (%)", attendu: salaries.part, calcul: `${eur(salaries.montant)} ÷ ${eur(v.va)} × 100 = ${pct(salaries.part)}`, tolerance: 0.1 },
          { libelle: "Part de l'entreprise (%)", attendu: entreprise.part, calcul: `${eur(entreprise.montant)} ÷ ${eur(v.va)} × 100 = ${pct(entreprise.part)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const v = valeurAjoutee(c);
        const entreprise = v.parts[3]!;
        return [
          entreprise.montant >= 0
            ? `L'entreprise garde ${pct(entreprise.part)} de la richesse qu'elle crée : de quoi remplacer son équipement usé et financer sa croissance. L'arène ne verse pas de dividendes aux associés : leur part reste dans l'entreprise.`
            : `La part de l'entreprise est négative : sa perte de l'année dépasse ce qu'elle met de côté pour l'usure de son équipement. Elle a distribué aux salariés, aux prêteurs et à l'État plus que la richesse qu'elle a créée.`,
        ];
      },
    },
    {
      id: "premiere-part",
      type: "choix",
      titre: "La plus grosse part",
      notions: ["income_statement", "productivity"],
      question: (c) => `Qui reçoit la plus grosse part de la valeur ajoutée ${dE(c.entreprise)} ?`,
      options: (c) => {
        const v = valeurAjoutee(c);
        return v.parts.map((p) => ({
          texte: p.nom,
          juste: p.code === v.premiere.code,
          retour:
            p.code === v.premiere.code
              ? `Oui : ${eur(p.montant)}, soit ${pct(p.part)} de la valeur ajoutée. ${p.code === "salaries" ? "C'est le cas de la plupart des entreprises : la richesse créée paie d'abord le travail qui la crée." : "C'est rare : d'ordinaire, les salariés reçoivent la plus grosse part."}`
              : `Non : ${eur(p.montant)}, soit ${pct(p.part)}, contre ${pct(v.premiere.part)} pour « ${v.premiere.nom} ».`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement"],
      texte: (c) => {
        const v = valeurAjoutee(c);
        return [
          `Sur l'année, ${c.entreprise} crée ${eur(v.va)} de valeur ajoutée, soit ${pct(v.tauxDeValeurAjoutee)} de ses ventes. Les salariés en reçoivent ${pct(v.parts[0]!.part)}, ${v.entreprise >= 0 ? `l'entreprise en garde ${pct(v.parts[3]!.part)}` : `et la part de l'entreprise est négative (${pct(v.parts[3]!.part)}) : elle a distribué plus qu'elle n'a créé`}.`,
          "La valeur ajoutée mesure la richesse créée, pas le profit. Son partage dit qui en profite : un partage où l'entreprise ne garde rien l'empêche d'investir, un partage où elle garde tout se fait au détriment des salariés. C'est un enjeu de gestion, et un enjeu social.",
        ];
      },
      repere: () => "Valeur ajoutée = salariés (personnel) + prêteurs (intérêts) + État (impôt) + entreprise (amortissement et résultat gardé).",
    },
  ],
};
