import type { Cas } from "../../cas";
import { L_EFFET_DE_LEVIER, auCentieme, dE, enPct, eur, levierDeLEscale, nombre, pct, points, rentabilitesDe } from "../../chapitres/l-effet-de-levier";
import { bilanApres, seuilDeMassue } from "../../monde/finance";
import { TAUX_RELEVE } from "../../monde/projets-et-financement";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EFFET DE LEVIER » : LE LEVIER FACE À LA HAUSSE DU TAUX (DSCG, UE2
 * Finance, palier 4).
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), pas dans
 * l'arène : le bilan de L'ESCALE est celui de la fiche, et l'année au taux relevé est le scénario
 * figé de la fiche (TAUX_RELEVE, refait par bilanApres), à la place du rejeu de l'arène.
 *
 * L'emprunt de l'hôtel est à taux variable, et la banque annonce une hausse. La directrice
 * financière demande si la dette jouera encore pour les associés, combien de résultat
 * d'exploitation l'hôtel pourrait perdre avant qu'elle ne se retourne, et à partir de quel taux.
 * L'élève refait seul les rentabilités au taux relevé, cherche au curseur le seuil de massue au
 * nouveau taux, le croise avec celui du taux actuel (la baisse supportable fond), puis retrouve à
 * rebours le taux limite. La réponse demande un jugement : le levier tient, mais sa marge de
 * sécurité a fondu.
 *
 * LA CONVENTION DES SEUILS, celle du chapitre : à endettement net inchangé, celui du 31 décembre de
 * la fiche. Le seuil de massue au taux relevé est donc les charges financières au taux relevé ×
 * actif économique ÷ endettement net de la fiche.
 */

export type Verdict = "tient" | "s-inverse" | "deja";

/** Les bornes du curseur du résultat d'exploitation, en euros. */
export const RESULTAT_DU_CURSEUR_DU_CAS = { min: 50_000, max: 400_000 } as const;

const auCentime = (x: number) => Math.round(x * 100) / 100 || 0;

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le levier au taux actuel et au taux relevé, ses seuils, et le taux où il s'inverse. */
export function levierFaceALaHausse(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const x = calculer(c);
  calculs.set(c.code, x);
  return x;
}

function calculer(c: Pick<Cas, "code">) {
  const l = levierDeLEscale(c);
  const releve = bilanApres(l.b, { tauxDeLEmprunt: TAUX_RELEVE });
  const r2 = rentabilitesDe(releve);
  const tauxReleve = enPct(TAUX_RELEVE);
  // À endettement net inchangé : les charges financières au taux relevé, sur l'actif et la dette de la fiche.
  const chargesAuTauxReleve = r2.a.chargesFinancieres;
  const seuilAuTauxReleve = seuilDeMassue(chargesAuTauxReleve, l.a.actifEconomique, l.a.endettementNet);
  const baisseAuTauxReleve = enPct((l.b.resultatDExploitation - seuilAuTauxReleve) / l.b.resultatDExploitation);
  const verdict: Verdict = l.a.re <= l.a.i ? "deja" : r2.a.re < r2.a.i ? "s-inverse" : "tient";
  return {
    ...l,
    releve,
    r2,
    tauxReleve,
    chargesAuTauxReleve,
    seuilAuTauxReleve,
    baisseAuTauxReleve,
    margeAuTauxReleve: auCentieme(l.tauxLimite - tauxReleve),
    perteDeRcp: auCentieme(l.r.rcp - r2.rcp),
    verdict,
  };
}

function tableauDesDeuxTaux(c: Cas): TableauDeDonnees {
  const x = levierFaceALaHausse(c);
  const a2 = x.r2.a;
  return {
    titre: `L'année ${dE(x.entreprise)}, au taux actuel et au taux relevé`,
    colonnes: ["Taux actuel", "Taux relevé"],
    lignes: [
      { libelle: "Taux annuel de l'emprunt", valeurs: [pct(x.taux), pct(x.tauxReleve)] },
      { libelle: "Résultat d'exploitation", valeurs: [eur(x.b.resultatDExploitation), eur(x.releve.resultatDExploitation)] },
      { libelle: "Charges financières", valeurs: [eur(x.a.chargesFinancieres), eur(a2.chargesFinancieres)] },
      { libelle: "Résultat net", valeurs: [eur(x.a.resultatNet), eur(a2.resultatNet)] },
      { libelle: "Actif économique au 31 décembre", valeurs: [eur(x.a.actifEconomique), eur(a2.actifEconomique)] },
      { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(x.a.capitauxPropres), eur(a2.capitauxPropres)] },
      { libelle: "Endettement net au 31 décembre", valeurs: [eur(x.a.endettementNet), eur(a2.endettementNet)] },
      { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(x.tPct), pct(x.tPct)] },
    ],
  };
}

export const LE_LEVIER_FACE_A_LA_HAUSSE_DU_TAUX: Situation = {
  code: "le-levier-face-a-la-hausse-du-taux",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [L_EFFET_DE_LEVIER.code],
  commanditaire: "La directrice financière",
  titre: "Le levier face à la hausse du taux",
  accroche:
    "L'emprunt est à taux variable, et la banque annonce une hausse. La dette jouera-t-elle encore pour les associés, et combien de résultat l'hôtel pourra-t-il perdre avant qu'elle ne se retourne ? Les rentabilités au taux relevé, le seuil de massue qui monte, et le taux limite.",
  objectifs: [
    "Calculer les rentabilités au taux relevé",
    "Chiffrer le seuil de massue au nouveau taux, et la baisse d'activité que la dette supporte encore",
    "Retrouver à rebours le taux d'emprunt à partir duquel le levier s'inverse",
    "Répondre à la directrice financière, chiffre à l'appui",
  ],
  libre: false,
  entreprises: L_EFFET_DE_LEVIER.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice financière",
      tableau: tableauDesDeuxTaux,
      texte: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          `« Notre emprunt est à taux variable, et la banque annonce que son taux passera de ${pct(x.taux)} à ${pct(x.tauxReleve)}. La dette ${dE(x.entreprise)} jouera-t-elle encore pour les associés ? De combien notre résultat d'exploitation pourrait-il baisser, au nouveau taux, avant qu'elle ne se retourne contre eux, et à partir de quel taux se retournerait-elle ? »`,
          "Pas de cours cette fois : la simulation du cours a refait l'année au taux relevé, tout le reste égal, et les calculs sont ceux du chapitre. Comme dans le chapitre, les seuils se calculent à endettement net inchangé, celui du 31 décembre au taux actuel.",
        ];
      },
      repere: () => "À rendre : les rentabilités au taux relevé, le seuil de massue au nouveau taux, le taux limite, et votre réponse.",
    },
    {
      id: "au-taux-releve",
      type: "montants",
      titre: "Les rentabilités au taux relevé",
      notions: ["profitability_vs_return", "loan_schedule"],
      tableau: tableauDesDeuxTaux,
      question: () => "Au taux relevé, calculez la rentabilité économique après impôt, le coût de l'endettement net après impôt et la rentabilité des capitaux propres, en %.",
      champs: (c) => {
        const x = levierFaceALaHausse(c);
        const a2 = x.r2.a;
        return [
          { libelle: "Re au taux relevé (%)", attendu: x.r2.re, calcul: `${eur(a2.resultatDExploitationApresImpot)} ÷ ${eur(a2.actifEconomique)} × 100 = ${pct(x.r2.re)}`, tolerance: 0.01 },
          {
            libelle: "i au taux relevé (%)",
            attendu: x.r2.i,
            calcul: `${eur(a2.chargesFinancieres)} × (1 − ${nombre(x.t)}) = ${eur(a2.chargesFinancieresApresImpot)} ; ${eur(a2.chargesFinancieresApresImpot)} ÷ ${eur(a2.endettementNet)} × 100 = ${pct(x.r2.i)}`,
            tolerance: 0.01,
          },
          { libelle: "Rcp au taux relevé (%)", attendu: x.r2.rcp, calcul: `${eur(a2.resultatNet)} ÷ ${eur(a2.capitauxPropres)} × 100 = ${pct(x.r2.rcp)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          `L'outil rapporte la même chose aux deux taux, ${pct(x.r2.re)} : la hausse ne touche que le financement. Le coût de l'endettement net passe de ${pct(x.r.i)} à ${pct(x.r2.i)}, et la rentabilité des associés perd ${points(x.perteDeRcp)}, de ${pct(x.r.rcp)} à ${pct(x.r2.rcp)}.`,
        ];
      },
    },
    {
      id: "le-seuil-au-curseur",
      type: "curseur",
      titre: "Le seuil de massue au nouveau taux",
      notions: ["profitability_vs_return", "safety_margin"],
      question: (c) => {
        const x = levierFaceALaHausse(c);
        return `Au taux relevé, les charges financières montent à ${eur(x.chargesAuTauxReleve)}. Faites varier le résultat d'exploitation, à endettement net inchangé : une droite donne le résultat net des associés, l'autre ce qu'ils gagneraient sans dette. Placez le curseur sur le plus petit résultat d'exploitation où la dette joue encore pour eux, puis validez.`;
      },
      grandeur: () => ({ libelle: "Résultat d'exploitation de l'année", unite: "€" }),
      cible: (c) => {
        const x = levierFaceALaHausse(c);
        return { attendu: Math.ceil(x.seuilAuTauxReleve - 1e-9), min: RESULTAT_DU_CURSEUR_DU_CAS.min, max: RESULTAT_DU_CURSEUR_DU_CAS.max };
      },
      zones: ["Effet de levier", "Effet de massue"],
      rates: () => ({
        dessous: "À cette position, le résultat net reste sous ce que les associés gagneraient sans dette : la dette joue contre eux.",
        dessus: "Plus bas, la dette joue encore pour les associés : cherchez le plus petit résultat d'exploitation.",
      }),
      montrer: "Montrer le seuil de massue",
      lecture: (c, rex) => {
        const x = levierFaceALaHausse(c);
        const net = auCentime((rex - x.chargesAuTauxReleve) * (1 - x.t));
        const sansDette = auCentime((rex * (1 - x.t) * x.a.capitauxPropres) / x.a.actifEconomique);
        return [
          { libelle: "Résultat net des associés", montant: net },
          { libelle: "Ce qu'ils gagneraient sans dette", montant: sansDette },
          { libelle: "Effet de levier, en euros", montant: auCentime(net - sansDette), fort: true },
        ];
      },
      droites: (c) => {
        const x = levierFaceALaHausse(c);
        return {
          produit: (rex) => (rex - x.chargesAuTauxReleve) * (1 - x.t),
          cout: (rex) => (rex * (1 - x.t) * x.a.capitauxPropres) / x.a.actifEconomique,
          libelles: ["Résultat net des associés", "Ce qu'ils gagneraient sans dette"],
        };
      },
      explication: (c) => {
        const x = levierFaceALaHausse(c);
        return [`Au taux relevé, la dette se retourne sous ${eur(x.seuilAuTauxReleve)} de résultat d'exploitation, au lieu de ${eur(x.a.seuilDeMassue)} au taux actuel : le seuil monte avec les charges financières.`];
      },
    },
    {
      id: "la-marge-de-securite",
      type: "montants",
      titre: "Ce que la hausse coûte en sécurité",
      notions: ["safety_margin", "profitability_vs_return"],
      question: () =>
        "Chiffrez le seuil de massue au taux relevé, puis la baisse du résultat d'exploitation que la dette supporte avant de se retourner, au taux relevé et au taux actuel, en part du résultat d'exploitation de l'année (en %).",
      champs: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          {
            libelle: "Seuil de massue au taux relevé",
            attendu: x.seuilAuTauxReleve,
            calcul: `${eur(x.chargesAuTauxReleve)} × ${eur(x.a.actifEconomique)} ÷ ${eur(x.a.endettementNet)} = ${eur(x.seuilAuTauxReleve)}`,
            tolerance: 1,
          },
          {
            libelle: "Baisse supportable au taux relevé (%)",
            attendu: x.baisseAuTauxReleve,
            calcul: `(${eur(x.b.resultatDExploitation)} − ${eur(x.seuilAuTauxReleve)}) ÷ ${eur(x.b.resultatDExploitation)} × 100 = ${pct(x.baisseAuTauxReleve)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Baisse supportable au taux actuel (%)",
            attendu: x.baisseSupportable,
            calcul: `Le seuil au taux actuel est ${eur(x.a.chargesFinancieres)} × ${eur(x.a.actifEconomique)} ÷ ${eur(x.a.endettementNet)} = ${eur(x.a.seuilDeMassue)} ; (${eur(x.b.resultatDExploitation)} − ${eur(x.a.seuilDeMassue)}) ÷ ${eur(x.b.resultatDExploitation)} × 100 = ${pct(x.baisseSupportable)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          `La rentabilité des associés ne perd que ${points(x.perteDeRcp)}, mais la sécurité fond : au taux actuel, le résultat d'exploitation pouvait baisser de ${pct(x.baisseSupportable)} avant que la dette ne se retourne ; au taux relevé, une baisse de ${pct(x.baisseAuTauxReleve)} suffit.`,
        ];
      },
    },
    {
      id: "taux-limite",
      type: "montants",
      titre: "Le taux où le levier s'inverse",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: () =>
        "Retrouvez à rebours le taux de l'emprunt où le coût de l'endettement net égalerait la rentabilité économique, à endettement net inchangé et à partir du taux actuel (en %), puis la marge qui reste entre ce taux et le taux relevé, en points.",
      champs: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          { libelle: "Coût de l'endettement net au taux actuel, i (%)", attendu: x.r.i, calcul: `${eur(x.a.chargesFinancieresApresImpot)} ÷ ${eur(x.a.endettementNet)} × 100 = ${pct(x.r.i)}`, tolerance: 0.01 },
          { libelle: "Taux de l'emprunt où le levier s'inverse (%)", attendu: x.tauxLimite, calcul: `i suit le taux : ${pct(x.taux)} × ${pct(x.r.re)} ÷ ${pct(x.r.i)} = ${pct(x.tauxLimite)}`, tolerance: 0.02 },
          { libelle: "Marge sous le taux limite, au taux relevé (points)", attendu: x.margeAuTauxReleve, calcul: `${pct(x.tauxLimite)} − ${pct(x.tauxReleve)} = ${points(x.margeAuTauxReleve)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          x.tauxLimite <= x.taux
            ? `Le levier s'inverse dès ${pct(x.tauxLimite)}, sous le taux actuel de ${pct(x.taux)} : la dette coûte déjà plus que l'outil ne rapporte.`
            : x.tauxLimite > x.tauxReleve
              ? `Le levier s'inverserait à ${pct(x.tauxLimite)}, ${points(x.margeAuTauxReleve)} au-dessus des ${pct(x.tauxReleve)} annoncés : la marge se réduit, mais la dette rapporte encore plus qu'elle ne coûte.`
              : `Le levier s'inverse à ${pct(x.tauxLimite)}, sous les ${pct(x.tauxReleve)} annoncés : au nouveau taux, la dette coûtera plus que l'outil ne rapporte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice financière",
      notions: ["profitability_vs_return", "safety_margin"],
      question: () => "Quelle phrase envoyez-vous à la directrice financière ?",
      options: (c) => {
        const x = levierFaceALaHausse(c);
        return [
          {
            texte: `Le levier tient, mais la baisse qu'il supporte passe de ${pct(x.baisseSupportable)} à ${pct(x.baisseAuTauxReleve)}`,
            juste: x.verdict === "tient",
            retour:
              x.verdict === "tient"
                ? `Oui : au taux relevé, l'outil rapporte ${pct(x.r2.re)}, l'endettement net coûte ${pct(x.r2.i)}, et les associés gardent ${pct(x.r2.rcp)}. Mais la dette se retournerait dès que le résultat d'exploitation tomberait sous ${eur(x.seuilAuTauxReleve)}. La hausse ne retourne pas le levier : elle le rend plus fragile.`
                : `Non : au taux relevé, l'endettement net coûte ${pct(x.r2.i)}, et l'outil rapporte ${pct(x.r2.re)}.`,
          },
          {
            texte: "Le levier s'inverse : au nouveau taux, l'endettement net coûtera plus que l'outil ne rapportera",
            juste: x.verdict === "s-inverse",
            retour:
              x.verdict === "s-inverse"
                ? `Oui : le levier s'inverse à ${pct(x.tauxLimite)}, sous les ${pct(x.tauxReleve)} annoncés.`
                : `Non : le levier ne s'inverserait qu'à ${pct(x.tauxLimite)}, au-dessus des ${pct(x.tauxReleve)} annoncés.`,
          },
          {
            texte: `Rien ne change pour les associés : tant que le taux reste sous ${pct(x.tauxLimite)}, la dette joue pour eux`,
            juste: false,
            retour: `Non : la dette joue encore pour eux, mais leur rentabilité perd ${points(x.perteDeRcp)}, et surtout le seuil de massue monte de ${eur(x.a.seuilDeMassue)} à ${eur(x.seuilAuTauxReleve)}. Leur risque a changé.`,
          },
          {
            texte: "Le levier jouait déjà contre les associés : la hausse alourdit la massue",
            juste: x.verdict === "deja",
            retour:
              x.verdict === "deja"
                ? `Oui : au taux actuel, l'endettement net coûte ${pct(x.r.i)} et l'outil ne rapporte que ${pct(x.r.re)}.`
                : `Non : au taux actuel, l'outil rapporte ${pct(x.r.re)}, plus que les ${pct(x.r.i)} que coûte l'endettement net.`,
          },
        ];
      },
    },
  ],
};
