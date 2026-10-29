import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { CREER_DES_RICHESSES, POURQUOI_LA_RICHESSE } from "../../chapitres/creer-des-richesses";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE, FICHE_DU_MARCHE, MARCHE_DE_L_ANNEE_SUIVANTE, richesseDuMarche, type ComptesDUneEnseigne } from "../../monde/gestion-et-information";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CRÉER DES RICHESSES ET LES MESURER » : LE MARCHÉ A-T-IL GRANDI ?
 * (Seconde, sciences économiques et sociales, palier 1).
 *
 * Une journaliste de l'économie locale demande si le marché de NOVA créera plus de richesse l'an
 * prochain, quand il vendra 10 % d'enceintes de plus (CROISSANCE_DU_MARCHE). L'élève reprend les calculs
 * du chapitre (la valeur ajoutée de chaque enseigne, leur somme pour tout le marché) sur les deux
 * années, puis mesure la croissance : le taux de variation de la richesse créée, comme on mesure
 * celle du PIB d'un pays, et le compare à celui des ventes.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur le marché à trois : l'année type et
 * l'année suivante (MARCHE_DE_L_ANNEE_SUIVANTE, l'hypothèse du cas, dans
 * monde/gestion-et-information.ts). Les offres ne changent pas : seul le marché grandit.
 *
 * CE QUI A CHANGÉ. Le cas comparait le premier et le dernier trimestre de l'année de l'arène, dans
 * neuf entreprises. Il compare maintenant deux années du marché à trois : la richesse créée grandit
 * plus vite que la production, parce que le loyer et les budgets ne grandissent pas avec les ventes.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Croissance = "hausse" | "baisse";

/** Le marché cette année et l'année suivante : ce que le cas lit et calcule. */
export function deuxAnnees() {
  const avant = richesseDuMarche(FICHE_DU_MARCHE);
  const apres = richesseDuMarche(FICHE_DU_MARCHE, "milieu", MARCHE_DE_L_ANNEE_SUIVANTE);
  const variationDeLaValeur = auDixieme((apres.valeurAjoutee / avant.valeurAjoutee - 1) * 100);
  const variationDeLaProduction = auDixieme((apres.production / avant.production - 1) * 100);
  const ecarts = avant.enseignes.map((v, i) => ({ nom: v.nom, ecart: Math.round((apres.enseignes[i]!.valeurAjoutee - v.valeurAjoutee) * 100) / 100 }));
  const croissance: Croissance = apres.valeurAjoutee > avant.valeurAjoutee ? "hausse" : "baisse";
  const moteur = ecarts.reduce((g, x) => ((croissance === "hausse" ? x.ecart > g.ecart : x.ecart < g.ecart) ? x : g));
  return {
    debut: avant.enseignes,
    fin: apres.enseignes,
    va: { debut: avant.valeurAjoutee, fin: apres.valeurAjoutee },
    production: { debut: avant.production, fin: apres.production },
    variationDeLaValeur,
    variationDeLaProduction,
    ecarts,
    moteur,
    croissance,
  };
}

function tableauDesDeuxAnnees(): TableauDeDonnees {
  const k = deuxAnnees();
  return {
    titre: "Les comptes des enseignes, cette année et l'année suivante",
    colonnes: ["Cette année", "L'année suivante"],
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
    "Une journaliste veut savoir si le marché créera plus de richesse l'an prochain, quand il vendra plus d'enceintes. Les ventes ne suffisent pas à le dire : mesurer la valeur ajoutée de chaque année, et sa croissance.",
  objectifs: [
    "Calculer la valeur ajoutée d'un marché sur une année",
    "Calculer un taux de croissance de la richesse créée",
    "Distinguer la croissance des ventes et celle de la richesse créée",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LA_RICHESSE },
  etapes: [
    {
      id: "la-question",
      type: "lecture",
      titre: "La question de la journaliste",
      tableau: tableauDesDeuxAnnees,
      texte: () => {
        const k = deuxAnnees();
        const noms = k.debut.map((v) => v.nom);
        return [
          `« J'écris sur l'économie de la ville. ${noms[0]}, ${noms[1]} et ${noms[2]} se partagent le marché des enceintes : ${qte(FICHE_DU_MARCHE.marche.parTrimestre)} par trimestre cette année, ${qte(MARCHE_DE_L_ANNEE_SUIVANTE)} l'an prochain, chacune gardant son offre. Le marché créera-t-il plus de richesse ? Je connais les ventes ; c'est la richesse créée qui m'intéresse. »`,
          "Le tableau donne la production et les consommations intermédiaires de chaque enseigne, les deux années. Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : la valeur ajoutée du marché chaque année, sa croissance, et votre réponse à la journaliste.",
    },
    {
      id: "valeur-de-chaque-annee",
      type: "montants",
      titre: "La valeur ajoutée du marché, chaque année",
      notions: ["income_statement", "revenue"],
      question: () =>
        "Calculez la valeur ajoutée du marché cette année, puis l'année suivante : la valeur ajoutée de chaque enseigne (production − consommations intermédiaires), additionnée pour toutes.",
      champs: () => {
        const k = deuxAnnees();
        const calcul = (vs: readonly ComptesDUneEnseigne[], total: number) => `${vs.map((v) => `(${eur(v.production)} − ${eur(v.consommations)})`).join(" + ")} = ${eur(total)}`;
        return [
          { libelle: "Valeur ajoutée du marché, cette année", attendu: k.va.debut, calcul: calcul(k.debut, k.va.debut) },
          { libelle: "Valeur ajoutée du marché, l'année suivante", attendu: k.va.fin, calcul: calcul(k.fin, k.va.fin) },
        ];
      },
      explication: () => {
        const k = deuxAnnees();
        return [`Le marché crée ${eur(k.va.debut)} de richesse cette année, ${eur(k.va.fin)} l'année suivante.`];
      },
    },
    {
      id: "la-croissance",
      type: "montants",
      titre: "La croissance du marché",
      notions: ["revenue"],
      question: () =>
        "Calculez, d'une année à l'autre, le taux de variation de la production du marché (ses trois chiffres d'affaires réunis), puis celui de sa valeur ajoutée, en pourcentage au dixième.",
      champs: () => {
        const k = deuxAnnees();
        return [
          { libelle: "Variation de la production du marché (%)", attendu: k.variationDeLaProduction, calcul: `(${eur(k.production.fin)} ÷ ${eur(k.production.debut)} − 1) × 100 = ${pct(k.variationDeLaProduction)}`, tolerance: 0.1 },
          { libelle: "Variation de la valeur ajoutée du marché (%)", attendu: k.variationDeLaValeur, calcul: `(${eur(k.va.fin)} ÷ ${eur(k.va.debut)} − 1) × 100 = ${pct(k.variationDeLaValeur)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = deuxAnnees();
        return [
          `La production grandit de ${pct(k.variationDeLaProduction)}, la richesse créée de ${pct(k.variationDeLaValeur)}. ${
            k.variationDeLaValeur > k.variationDeLaProduction
              ? "La richesse créée va plus vite que les ventes : le loyer et les budgets ne grandissent pas avec elles, la part des ventes qui paie d'autres entreprises recule."
              : "La richesse créée ne va pas plus vite que les ventes : la part des ventes qui paie d'autres entreprises ne recule pas."
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la journaliste",
      notions: ["income_statement"],
      question: () => "Que répondez-vous à la journaliste ?",
      options: () => {
        const k = deuxAnnees();
        const faits = `la valeur ajoutée du marché passe de ${eur(k.va.debut)} à ${eur(k.va.fin)}, soit ${pct(k.variationDeLaValeur)}. C'est chez ${k.moteur.nom} qu'elle bouge le plus (${k.moteur.ecart > 0 ? "+" : ""}${eur(k.moteur.ecart)}), la plus grosse enseigne du marché.`;
        return [
          { texte: "Oui, la richesse créée augmentera", juste: k.croissance === "hausse", retour: k.croissance === "hausse" ? `Oui : ${faits}` : `Non : ${faits}` },
          { texte: "Non, la richesse créée baissera", juste: k.croissance === "baisse", retour: k.croissance === "baisse" ? `Oui : ${faits}` : `Non : ${faits}` },
          {
            texte: "Les chiffres d'affaires suffisent pour répondre",
            juste: false,
            retour: `Non : les chiffres d'affaires du marché grandissent de ${pct(k.variationDeLaProduction)}, mais ils comptent aussi ce que d'autres entreprises ont produit. C'est la valeur ajoutée qui mesure la richesse créée : ${pct(k.variationDeLaValeur)}.`,
          },
        ];
      },
    },
  ],
};
