import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ENDETTEMENT_MAXIMAL } from "../financement";
import { financer } from "../chapitres/financer-l-entreprise";
import { fondsDeRoulement } from "../chapitres/fonds-de-roulement-et-tresorerie";
import { rentabilite } from "../chapitres/rentabilite";
import { valeurAjoutee } from "../chapitres/valeur-ajoutee-et-partage";
import type { Situation } from "./types";

/**
 * MISE EN SITUATION : LE RENDEZ-VOUS À LA BANQUE (Bac STMG, gestion et finance, palier 1).
 *
 * L'entreprise veut acheter un second équipement, du même modèle que le premier, et
 * demande un prêt. Avant le rendez-vous, le chargé d'affaires réclame quelques chiffres
 * tirés des comptes de l'année. L'élève a le compte de résultat et le bilan, et rend :
 * la valeur ajoutée, la rentabilité des capitaux propres, la capacité
 * d'autofinancement, le fonds de roulement, le besoin en fonds de roulement et la
 * trésorerie, l'endettement avec le prêt, puis sa réponse au banquier.
 *
 * Aucun cours : les calculs sont ceux des chapitres de gestion et finance, appelés tels
 * quels (`valeurAjoutee`, `rentabilite`, `fondsDeRoulement`, `financer`). L'équipement,
 * son prix et le seuil d'endettement sont ceux du chapitre « Financer l'entreprise ».
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const ratio = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres que le banquier demande, calculés une fois du cas. */
export function dossierDeLaBanque(c: Cas) {
  const v = valeurAjoutee(c);
  const r = rentabilite(c);
  const k = fondsDeRoulement(c);
  const f = financer(c);
  return { v, r, k, f };
}

export const LE_RENDEZ_VOUS_A_LA_BANQUE: Situation = {
  code: "le-rendez-vous-a-la-banque",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["valeur-ajoutee-et-partage", "rentabilite", "fonds-de-roulement-et-tresorerie", "financer-l-entreprise"],
  commanditaire: "La banque",
  titre: "Le rendez-vous à la banque",
  accroche:
    "Avant d'étudier une demande de prêt, le banquier veut quelques chiffres tirés des comptes de l'année. Les calculer, et lui répondre.",
  objectifs: [
    "Calculer la valeur ajoutée et le taux de valeur ajoutée",
    "Calculer la rentabilité des capitaux propres",
    "Calculer la capacité d'autofinancement",
    "Calculer le fonds de roulement, le besoin en fonds de roulement et la trésorerie",
    "Mesurer l'endettement avant et après un prêt, et répondre au banquier",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le courriel du banquier",
      texte: (c) => {
        const { f } = dossierDeLaBanque(c);
        return [
          `« Vous nous demandez un prêt pour un nouvel équipement, « ${f.equipement} », à ${eur(f.montant)} hors taxes. Avant notre rendez-vous, j'ai besoin de quelques chiffres tirés de vos comptes de l'année : ce que votre activité crée, ce que rapportent les capitaux de vos associés, ce que votre activité dégage pour rembourser, votre fonds de roulement, votre besoin en fonds de roulement et votre trésorerie. Dites-moi aussi où en serait votre endettement avec ce prêt. » Le chargé d'affaires de la banque`,
          `Vous avez sous les yeux les comptes ${dE(c.entreprise)}. Pas de cours cette fois : les calculs sont ceux que vous connaissez. À vous de les enchaîner.`,
        ];
      },
      tableau: (c) => {
        const { v, k, f } = dossierDeLaBanque(c);
        const s = v.k.s;
        const b = k.f;
        return {
          titre: `Les comptes de l'année · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes de l'année", valeurs: [eur(s.ventes)] },
            // Une entreprise qui produit ajoute à ses ventes la variation de ses en-cours ; un
            // commerce n'a que ses ventes, et la variation de stock corrige ses achats.
            ...(v.k.produits !== s.ventes ? [{ libelle: "Production de l'année (ventes et variation des en-cours)", valeurs: [eur(v.k.produits)] }] : []),
            { libelle: "Consommations venues d'autres entreprises (achats consommés, loyer, publicité, entretien…)", valeurs: [eur(v.consommations)] },
            { libelle: "Charges de personnel", valeurs: [eur(s.personnel)] },
            { libelle: "Dotations aux amortissements", valeurs: [eur(f.dotation)] },
            { libelle: "Intérêts de l'emprunt", valeurs: [eur(s.interets)] },
            { libelle: "Impôt sur les bénéfices", valeurs: [eur(s.impot)] },
            { libelle: "Résultat net de l'année", valeurs: [eur(f.resultatNet)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(b.capitauxPropres)] },
            { libelle: "Emprunts", valeurs: [eur(b.emprunts)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(b.immobilisationsNettes)] },
            { libelle: "Stocks", valeurs: [eur(b.stocks)] },
            { libelle: "Créances sur les clients", valeurs: [eur(b.creances)] },
            ...(b.tva !== 0 ? [{ libelle: b.tva > 0 ? "TVA due à l'État" : "TVA à récupérer", valeurs: [eur(Math.abs(b.tva))] }] : []),
            { libelle: "Dettes envers les fournisseurs", valeurs: [eur(b.fournisseurs)] },
            { libelle: "Banque et placements", valeurs: [eur(k.disponible)] },
            { libelle: "Découvert bancaire", valeurs: [eur(b.decouvert)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la valeur ajoutée, la rentabilité des capitaux propres, la capacité d'autofinancement, le fonds de roulement, le besoin en fonds de roulement, la trésorerie, l'endettement avec le prêt, et votre réponse.",
    },
    {
      id: "valeur-ajoutee",
      type: "montants",
      titre: "Ce que l'activité crée",
      notions: ["income_statement"],
      question: () =>
        "Calculez la valeur ajoutée de l'année (la production, ou les ventes pour un commerce, moins les consommations venues d'autres entreprises), puis le taux de valeur ajoutée (valeur ajoutée ÷ ventes × 100), au dixième.",
      champs: (c) => {
        const { v } = dossierDeLaBanque(c);
        return [
          { libelle: "Valeur ajoutée", attendu: v.va, calcul: `${eur(v.k.produits)} − ${eur(v.consommations)} = ${eur(v.va)}`, tolerance: 1 },
          { libelle: "Taux de valeur ajoutée (%)", attendu: v.tauxDeValeurAjoutee, calcul: `${eur(v.va)} ÷ ${eur(v.k.s.ventes)} × 100 = ${pct(v.tauxDeValeurAjoutee)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const { v } = dossierDeLaBanque(c);
        return [
          `Sur 100 € de ventes, ${c.entreprise} crée ${pct(v.tauxDeValeurAjoutee).replace(" %", " €")} de richesse : le reste payait ce que d'autres entreprises lui ont fourni. C'est avec cette valeur ajoutée qu'elle paie ses salariés, ses intérêts, son impôt, et qu'elle rembourserait le prêt.`,
        ];
      },
    },
    {
      id: "rentabilite",
      type: "montants",
      titre: "Ce que rapportent les capitaux des associés",
      notions: ["profitability_vs_return"],
      question: () =>
        "Calculez la rentabilité financière : le résultat net rapporté aux capitaux propres, en pourcentage, au dixième.",
      champs: (c) => {
        const { r } = dossierDeLaBanque(c);
        return [
          { libelle: "Rentabilité financière (%)", attendu: r.financiere, calcul: `${eur(r.resultatNet)} ÷ ${eur(r.capitauxPropres)} × 100 = ${pct(r.financiere)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const { r } = dossierDeLaBanque(c);
        return [
          r.financiere >= 0
            ? `Pour 100 € laissés par les associés, ${c.entreprise} a gagné ${pct(r.financiere).replace(" %", " €")} cette année. La banque prête à ${pct(r.tauxDeLEmprunt)} : elle compare.`
            : `Pour 100 € laissés par les associés, ${c.entreprise} a perdu ${pct(-r.financiere).replace(" %", " €")} cette année. La banque le verra : une perte entame les capitaux propres qui la rassurent.`,
        ];
      },
    },
    {
      id: "caf",
      type: "montants",
      titre: "Ce que l'activité dégage pour rembourser",
      notions: ["frng", "income_statement"],
      question: () =>
        "Calculez la capacité d'autofinancement : le résultat net, plus les dotations aux amortissements, une charge qui ne fait sortir aucun argent.",
      champs: (c) => {
        const { f } = dossierDeLaBanque(c);
        return [
          { libelle: "Capacité d'autofinancement", attendu: f.caf, calcul: `${eur(f.resultatNet)} + ${eur(f.dotation)} = ${eur(f.caf)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const { f } = dossierDeLaBanque(c);
        return [
          f.caf >= f.montant
            ? `L'activité a dégagé ${eur(f.caf)} dans l'année, plus que le prix de l'équipement : ${c.entreprise} pourrait le payer sans emprunter.`
            : f.caf >= 0
              ? `L'activité a dégagé ${eur(f.caf)} dans l'année, moins que le prix de l'équipement, ${eur(f.montant)} : c'est avec cet argent que les échéances du prêt seraient remboursées.`
              : `La capacité d'autofinancement est négative, ${eur(f.caf)} : l'activité a consommé de l'argent au lieu d'en dégager. Rien ne viendrait de l'activité pour rembourser un prêt.`,
        ];
      },
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "Fonds de roulement, besoin, trésorerie",
      notions: ["frng", "bfr", "net_treasury"],
      question: () =>
        "Calculez le fonds de roulement (capitaux propres et emprunts, moins l'équipement), le besoin en fonds de roulement (stocks, créances et TVA à récupérer, moins les fournisseurs et la TVA due), puis la trésorerie (banque et placements, moins le découvert).",
      champs: (c) => {
        const { k } = dossierDeLaBanque(c);
        return [
          { libelle: "Fonds de roulement", attendu: k.frng, calcul: `${eur(k.ressources)} − ${eur(k.f.immobilisationsNettes)} = ${eur(k.frng)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfr, calcul: `${eur(k.besoins)} − ${eur(k.dettesDuCycle)} = ${eur(k.bfr)}`, tolerance: 1 },
          { libelle: "Trésorerie", attendu: k.tn, calcul: `${eur(k.disponible)} − ${eur(k.f.decouvert)} = ${eur(k.tn)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const { k } = dossierDeLaBanque(c);
        return [
          k.tn >= 0
            ? `Le fonds de roulement couvre le besoin du quotidien, et il reste ${eur(k.tn)} en banque : ${c.entreprise} n'a pas besoin du banquier pour vivre au jour le jour.`
            : `Le fonds de roulement ne couvre pas le besoin du quotidien : la banque avance déjà ${eur(-k.tn)} par le découvert. Le banquier le saura avant vous.`,
          k.bfr < 0
            ? "Le besoin en fonds de roulement est négatif : les fournisseurs et l'État financent plus que ce qui attend chez les clients et dans les stocks."
            : "Fonds de roulement moins besoin en fonds de roulement donne bien la trésorerie, au centime d'arrondi près.",
        ];
      },
    },
    {
      id: "endettement",
      type: "montants",
      titre: "L'endettement avec le prêt",
      notions: ["frng", "balance_sheet"],
      question: (c) => {
        const { f } = dossierDeLaBanque(c);
        return `Calculez l'endettement (emprunts ÷ capitaux propres, au centième) aujourd'hui, puis avec le prêt de ${eur(f.montant)}.`;
      },
      champs: (c) => {
        const { f } = dossierDeLaBanque(c);
        return [
          { libelle: "Endettement aujourd'hui", attendu: f.endettementAvant, calcul: `${eur(f.emprunts)} ÷ ${eur(f.capitauxPropres)} = ${ratio(f.endettementAvant)}`, tolerance: 0.01 },
          { libelle: "Endettement avec le prêt", attendu: f.endettementApres, calcul: `(${eur(f.emprunts)} + ${eur(f.montant)}) ÷ ${eur(f.capitauxPropres)} = ${ratio(f.endettementApres)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const { f } = dossierDeLaBanque(c);
        return [
          f.endettementApres <= ENDETTEMENT_MAXIMAL
            ? `Avec le prêt, les emprunts ${dE(c.entreprise)} resteraient sous ses capitaux propres (${ratio(f.endettementApres)} pour 1) : la règle de prudence de la plupart des banques est tenue.`
            : `Avec le prêt, les emprunts ${dE(c.entreprise)} dépasseraient ses capitaux propres (${ratio(f.endettementApres)} pour 1) : au-delà d'un euro prêté pour un euro apporté, la plupart des banques demandent d'abord un apport des associés.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au banquier",
      question: () => "Quelle conclusion apportez-vous au rendez-vous ?",
      options: (c) => {
        const { f, k } = dossierDeLaBanque(c);
        return [
          {
            texte: "Notre activité dégage assez pour payer l'équipement sans prêt",
            juste: f.choix === "autofinancement",
            retour:
              f.choix === "autofinancement"
                ? `Oui : la capacité d'autofinancement, ${eur(f.caf)}, dépasse le prix de l'équipement, ${eur(f.montant)}. Le prêt reste possible, mais ${c.entreprise} peut s'en passer.`
                : `Non : la capacité d'autofinancement, ${eur(f.caf)}, ne couvre pas les ${eur(f.montant)} de l'équipement.`,
          },
          {
            texte: "Avec le prêt, nos emprunts resteraient sous nos capitaux propres",
            juste: f.choix === "emprunt",
            retour:
              f.choix === "emprunt"
                ? `Oui : l'activité ne suffit pas à payer l'équipement, mais l'endettement passerait à ${ratio(f.endettementApres)} pour 1, sous la limite de ${ratio(ENDETTEMENT_MAXIMAL)}. C'est un dossier que la banque peut accepter.`
                : f.choix === "autofinancement"
                  ? `Ce n'est pas l'essentiel : l'activité dégage ${eur(f.caf)}, assez pour payer l'équipement sans emprunter. Avec le prêt, l'endettement serait de ${ratio(f.endettementApres)} pour 1.`
                  : `Non : l'endettement passerait à ${ratio(f.endettementApres)} pour 1, au-dessus de la limite de ${ratio(ENDETTEMENT_MAXIMAL)}.`,
          },
          {
            texte: "Un apport des associés d'abord : le prêt nous endetterait trop",
            juste: f.choix === "apport",
            retour:
              f.choix === "apport"
                ? `Oui : l'activité ne paie pas l'équipement, et le prêt porterait l'endettement à ${ratio(f.endettementApres)} pour 1, au-dessus de la limite. Un apport des associés d'abord, et la banque suivra plus facilement.`
                : `Non : avec le prêt, l'endettement serait de ${ratio(f.endettementApres)} pour 1, ${f.endettementApres <= ENDETTEMENT_MAXIMAL ? "sous" : "au-dessus de"} la limite de ${ratio(ENDETTEMENT_MAXIMAL)}${f.choix === "autofinancement" ? ", et l'activité paie l'équipement seule" : ""}.`,
          },
          {
            texte: "Nos capitaux propres dorment en banque : le prêt est sans risque",
            juste: false,
            retour: `Non : les capitaux propres ne sont pas de l'argent en banque. Ils ont payé l'équipement et le quotidien. ${k.tn >= 0 ? `Ce qui reste en banque, c'est la trésorerie : ${eur(k.tn)}.` : `La trésorerie est même négative : ${eur(k.tn)}.`}`,
          },
        ];
      },
    },
  ],
};
