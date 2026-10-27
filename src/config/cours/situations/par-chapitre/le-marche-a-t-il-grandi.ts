import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { CREER_DES_RICHESSES, comptesDuMarche, type ComptesDuVendeur } from "../../chapitres/creer-des-richesses";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CRÉER DES RICHESSES ET LES MESURER » : LE MARCHÉ A-T-IL GRANDI ?
 * (Seconde, sciences économiques et sociales, palier 1).
 *
 * Une journaliste de l'économie locale demande si le marché de l'entreprise a créé plus de
 * richesse au dernier trimestre de l'année qu'au premier. L'élève reprend les calculs du
 * chapitre (la valeur ajoutée de chaque vendeur, leur somme pour tout le marché), sur deux
 * trimestres de l'année du cours, puis mesure la croissance : le taux de variation de la richesse
 * créée, comme on mesure celle du PIB d'un pays, et le compare à celui des ventes.
 *
 * Les chiffres sont ceux du chapitre (`comptesDuMarche`, les comptes des trois entreprises dans
 * l'année du cours), lus sur le premier et le quatrième trimestre. Aucune hypothèse n'est
 * ajoutée. La réponse se calcule : selon le marché, la richesse créée a augmenté ou baissé.
 */

/** Les deux trimestres que la journaliste compare : le premier et le dernier de l'année. */
export const PREMIER_TRIMESTRE = 1;
export const DERNIER_TRIMESTRE = 4;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

export type Croissance = "hausse" | "baisse";

/** Le marché au premier et au dernier trimestre : ce que le cas lit et calcule. */
export function deuxTrimestres(c: Cas) {
  const debut = comptesDuMarche(c, [PREMIER_TRIMESTRE]);
  const fin = comptesDuMarche(c, [DERNIER_TRIMESTRE]);
  const somme = (vs: readonly ComptesDuVendeur[], f: (v: ComptesDuVendeur) => number) => vs.reduce((t, v) => t + f(v), 0);
  const va = { debut: somme(debut, (v) => v.valeurAjoutee), fin: somme(fin, (v) => v.valeurAjoutee) };
  const production = { debut: somme(debut, (v) => v.production), fin: somme(fin, (v) => v.production) };
  const variationDeLaValeur = auDixieme((va.fin / va.debut - 1) * 100);
  const variationDeLaProduction = auDixieme((production.fin / production.debut - 1) * 100);
  // Le vendeur dont la richesse créée a le plus bougé, dans le sens du marché.
  const ecarts = debut.map((v, i) => ({ nom: v.nom, ecart: fin[i]!.valeurAjoutee - v.valeurAjoutee }));
  const croissance: Croissance = va.fin > va.debut ? "hausse" : "baisse";
  const moteur = ecarts.reduce((g, x) => ((croissance === "hausse" ? x.ecart > g.ecart : x.ecart < g.ecart) ? x : g));
  return { debut, fin, va, production, variationDeLaValeur, variationDeLaProduction, ecarts, moteur, croissance };
}

function tableauDesDeuxTrimestres(c: Cas): TableauDeDonnees {
  const k = deuxTrimestres(c);
  return {
    titre: "Les comptes des trois vendeurs, au premier et au dernier trimestre",
    colonnes: [`Trimestre ${PREMIER_TRIMESTRE}`, `Trimestre ${DERNIER_TRIMESTRE}`],
    lignes: k.debut.flatMap((v, i) => [
      { libelle: `Production ${dE(v.nom)}`, valeurs: [eur(v.production), eur(k.fin[i]!.production)] },
      { libelle: `Consommations intermédiaires ${dE(v.nom)}`, valeurs: [eur(v.consommations), eur(k.fin[i]!.consommations)] },
    ]),
  };
}

export const LE_MARCHE_A_T_IL_GRANDI: Situation = {
  code: "le-marche-a-t-il-grandi",
  parcours: "seconde-ses",
  palier: 1,
  blocs: [],
  reprend: [CREER_DES_RICHESSES.code],
  commanditaire: "La journaliste de l'économie locale",
  titre: "Le marché a-t-il grandi ?",
  accroche:
    "Une journaliste veut savoir si le marché a créé plus de richesse en fin d'année qu'au début. Les ventes ne suffisent pas à le dire : mesurer la valeur ajoutée de chaque trimestre, et sa croissance.",
  objectifs: [
    "Calculer la valeur ajoutée d'un marché sur un trimestre",
    "Calculer un taux de croissance de la richesse créée",
    "Distinguer la croissance des ventes et celle de la richesse créée",
  ],
  libre: false,
  etapes: [
    {
      id: "la-question",
      type: "lecture",
      titre: "La question de la journaliste",
      tableau: tableauDesDeuxTrimestres,
      texte: (c) => {
        const k = deuxTrimestres(c);
        const noms = k.debut.map((v) => v.nom);
        return [
          `« J'écris sur l'économie de la ville. ${noms[0]}, ${noms[1]} et ${noms[2]} se partagent le même marché. A-t-il créé plus de richesse au dernier trimestre de l'année qu'au premier ? Je connais leurs ventes ; c'est la richesse créée qui m'intéresse. »`,
          "Le tableau donne la production et les consommations intermédiaires de chaque vendeur, aux deux trimestres. Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la valeur ajoutée du marché à chaque trimestre, sa croissance, et votre réponse à la journaliste.",
    },
    {
      id: "valeur-de-chaque-trimestre",
      type: "montants",
      titre: "La valeur ajoutée du marché, à chaque trimestre",
      notions: ["income_statement", "revenue"],
      question: () =>
        "Calculez la valeur ajoutée du marché au premier trimestre, puis au dernier : la valeur ajoutée de chaque vendeur (production − consommations intermédiaires), additionnée pour les trois.",
      champs: (c) => {
        const k = deuxTrimestres(c);
        const calcul = (vs: readonly ComptesDuVendeur[], total: number) =>
          `${vs.map((v) => `(${eur(v.production)} − ${eur(v.consommations)})`).join(" + ")} = ${eur(total)}`;
        return [
          { libelle: `Valeur ajoutée du marché, trimestre ${PREMIER_TRIMESTRE}`, attendu: k.va.debut, calcul: calcul(k.debut, k.va.debut) },
          { libelle: `Valeur ajoutée du marché, trimestre ${DERNIER_TRIMESTRE}`, attendu: k.va.fin, calcul: calcul(k.fin, k.va.fin) },
        ];
      },
      explication: (c) => {
        const k = deuxTrimestres(c);
        return [`Le marché a créé ${eur(k.va.debut)} de richesse au premier trimestre, ${eur(k.va.fin)} au dernier.`];
      },
    },
    {
      id: "la-croissance",
      type: "montants",
      titre: "La croissance du marché",
      notions: ["revenue", "seasonality"],
      question: () =>
        "Calculez, du premier au dernier trimestre, le taux de variation de la production du marché (ses trois chiffres d'affaires réunis), puis celui de sa valeur ajoutée, en pourcentage au dixième.",
      champs: (c) => {
        const k = deuxTrimestres(c);
        return [
          {
            libelle: "Variation de la production du marché (%)",
            attendu: k.variationDeLaProduction,
            calcul: `(${eur(k.production.fin)} ÷ ${eur(k.production.debut)} − 1) × 100 = ${pct(k.variationDeLaProduction)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Variation de la valeur ajoutée du marché (%)",
            attendu: k.variationDeLaValeur,
            calcul: `(${eur(k.va.fin)} ÷ ${eur(k.va.debut)} − 1) × 100 = ${pct(k.variationDeLaValeur)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = deuxTrimestres(c);
        return [
          `La production évolue de ${pct(k.variationDeLaProduction)}, la richesse créée de ${pct(k.variationDeLaValeur)}. ${
            k.variationDeLaValeur > k.variationDeLaProduction
              ? "La richesse créée va plus vite que les ventes : la part des ventes qui paie d'autres entreprises a reculé."
              : k.variationDeLaValeur < k.variationDeLaProduction
                ? "La richesse créée va moins vite que les ventes : la part des ventes qui paie d'autres entreprises a grandi."
                : "Les deux vont au même pas."
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la journaliste",
      notions: ["income_statement", "seasonality"],
      question: () => "Que répondez-vous à la journaliste ?",
      options: (c) => {
        const k = deuxTrimestres(c);
        const faits = `la valeur ajoutée du marché passe de ${eur(k.va.debut)} à ${eur(k.va.fin)}, soit ${pct(k.variationDeLaValeur)}. C'est chez ${k.moteur.nom} qu'elle a le plus bougé (${k.moteur.ecart > 0 ? "+" : ""}${eur(k.moteur.ecart)}). D'un trimestre à l'autre, la saison compte aussi : un trimestre n'est pas une année.`;
        return [
          {
            texte: "Oui, la richesse créée a augmenté",
            juste: k.croissance === "hausse",
            retour: k.croissance === "hausse" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Non, la richesse créée a baissé",
            juste: k.croissance === "baisse",
            retour: k.croissance === "baisse" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Les chiffres d'affaires suffisent pour répondre",
            juste: false,
            retour: `Non : les chiffres d'affaires du marché évoluent de ${pct(k.variationDeLaProduction)}, mais ils comptent aussi ce que d'autres entreprises ont produit. C'est la valeur ajoutée qui mesure la richesse créée : ${pct(k.variationDeLaValeur)}.`,
          },
        ];
      },
    },
  ],
};
