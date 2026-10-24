import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ecartsDuTrimestre } from "../ecarts";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'ANALYSE DES ÉCARTS (contrôle de gestion, palier 4).
 *
 * La suite du budget de trésorerie : le même prévu (le premier trimestre reconduit), le même
 * réalisé (le deuxième, joué par l'arène), lus cette fois par le contrôleur de gestion.
 * L'élève décompose l'écart sur chiffre d'affaires en un écart sur quantités et un écart sur
 * prix, puis l'écart sur marge en un effet volume et un effet de marge unitaire, et voit
 * pourquoi une vente perdue coûte sa marge, pas son prix. Les données sont dans `ecarts.ts`.
 *
 * Convention du chapitre : un écart est toujours le réalisé moins le prévu. Positif sur un
 * produit ou une marge, il est favorable ; positif sur une charge, défavorable.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const signe = (x: number) => (x > 0 ? "favorable" : x < 0 ? "défavorable" : "nul");

/** Le côté qui pèse le plus dans l'écart sur chiffre d'affaires. */
export function causeDuChiffreDAffaires(c: Cas): "volume" | "prix" {
  const e = ecartsDuTrimestre(c.code).chiffreDAffaires;
  return Math.abs(e.volume) >= Math.abs(e.prix) ? "volume" : "prix";
}

export const ANALYSE_DES_ECARTS: Chapitre = {
  code: "analyse-des-ecarts",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
  ],
  titre: "L'analyse des écarts",
  accroche:
    "Le budget prévoyait, l'arène a joué : décomposer l'écart pour savoir s'il vient des quantités, des prix ou des coûts, et ce qu'il coûte au résultat.",
  objectifs: [
    "Calculer l'écart sur chiffre d'affaires et le décomposer en écart sur quantités et écart sur prix",
    "Décomposer l'écart sur marge en effet volume et effet de marge unitaire",
    "Comprendre pourquoi une vente perdue coûte sa marge et non son prix",
    "Relier l'écart sur résultat aux écarts sur marge et sur charges",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le prévu et le réalisé",
      notions: ["volume_price_variance"],
      texte: (c) => {
        const e = ecartsDuTrimestre(c.code);
        const p = e.prevu;
        const r = e.realise;
        return [
          `Le budget du deuxième trimestre de ${c.entreprise} reconduisait le premier : ${qte(p.quantite)} ${c.unites} à ${eur(p.prix)} en moyenne, ${eur(p.chiffreDAffaires)} de chiffre d'affaires, une marge sur coût variable de ${eur(p.margeUnitaire)} par ${c.unite}.`,
          `L'arène a joué : ${qte(r.quantite)} ${c.unites} à ${eur(r.prix)} en moyenne, ${eur(r.chiffreDAffaires)} de chiffre d'affaires, ${eur(r.margeUnitaire)} de marge par ${c.unite}.`,
          e.chargesFixes === 0
            ? `Les charges fixes, ${eur(p.chargesFixes)}, sont exactement celles du budget : tout l'écart est dans l'activité.`
            : `Les charges fixes font ${eur(r.chargesFixes)} pour ${eur(p.chargesFixes)} prévus.`,
          "Un écart se calcule toujours de la même façon : le réalisé moins le prévu. Sur un produit ou une marge, positif, il est favorable ; sur une charge, positif, il est défavorable.",
        ];
      },
      repere: () =>
        "Écart sur quantités = (quantité réelle − quantité prévue) × prix prévu. Écart sur prix = (prix réel − prix prévu) × quantité réelle. Leur somme fait l'écart sur chiffre d'affaires.",
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "L'écart sur chiffre d'affaires",
      notions: ["volume_price_variance"],
      question: () =>
        "Calculez l'écart sur chiffre d'affaires, puis décomposez-le : l'écart sur quantités (au prix prévu) et l'écart sur prix (sur les quantités réelles). Négatif pour un écart défavorable.",
      champs: (c) => {
        const e = ecartsDuTrimestre(c.code);
        const p = e.prevu;
        const r = e.realise;
        return [
          {
            libelle: "Écart sur chiffre d'affaires",
            attendu: e.chiffreDAffaires.total,
            calcul: `${eur(r.chiffreDAffaires)} − ${eur(p.chiffreDAffaires)} = ${eur(e.chiffreDAffaires.total)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Écart sur quantités",
            attendu: e.chiffreDAffaires.volume,
            calcul: `(${qte(r.quantite)} − ${qte(p.quantite)}) × ${eur(p.prix)} = ${eur(e.chiffreDAffaires.volume)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Écart sur prix",
            attendu: e.chiffreDAffaires.prix,
            calcul: `(${eur(r.prix)} − ${eur(p.prix)}) × ${qte(r.quantite)} = ${eur(e.chiffreDAffaires.prix)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const e = ecartsDuTrimestre(c.code).chiffreDAffaires;
        return [
          `Écart sur quantités ${signe(e.volume)}, écart sur prix ${signe(e.prix)} : à eux deux, ils font l'écart sur chiffre d'affaires, ${eur(e.total)}.`,
        ];
      },
    },
    {
      id: "ce-qui-a-fait-l-ecart",
      type: "choix",
      titre: "Ce qui a fait l'écart",
      notions: ["volume_price_variance"],
      question: (c) => `D'où vient d'abord l'écart sur le chiffre d'affaires de ${c.entreprise} ?`,
      options: (c) => {
        const e = ecartsDuTrimestre(c.code).chiffreDAffaires;
        const cause = causeDuChiffreDAffaires(c);
        return [
          {
            texte: "Des quantités : l'entreprise n'a pas vendu le volume prévu.",
            juste: cause === "volume",
            retour:
              cause === "volume"
                ? `Oui : ${eur(e.volume)} sur les quantités, ${eur(e.prix)} sur les prix. ${e.prix === 0 ? "Le prix n'a pas bougé : l'écart est tout entier dans le volume, c'est le marché (la saison, les concurrents) qui a décidé." : "Le volume pèse le plus."}`
                : `Les quantités pèsent ${eur(e.volume)}, les prix ${eur(e.prix)} : c'est le prix qui pèse le plus.`,
          },
          {
            texte: "Des prix : l'entreprise n'a pas vendu au prix prévu.",
            juste: cause === "prix",
            retour:
              cause === "prix"
                ? `Oui : ${eur(e.prix)} sur les prix, ${eur(e.volume)} sur les quantités. Le prix moyen a bougé, souvent parce que le mélange des clients a changé.`
                : `Les prix pèsent ${eur(e.prix)}, les quantités ${eur(e.volume)} : c'est le volume qui pèse le plus.`,
          },
          {
            texte: "D'aucun des deux : un écart sur chiffre d'affaires ne se décompose pas.",
            juste: false,
            retour: "Il se décompose toujours : c'est même tout l'intérêt de l'analyse, savoir ce qui a bougé pour savoir qui doit agir.",
          },
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "L'écart sur marge",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () =>
        "Faites de même avec la marge sur coût variable : l'écart total, l'effet du volume (à la marge unitaire prévue) et l'effet de la marge unitaire (sur les quantités réelles).",
      champs: (c) => {
        const e = ecartsDuTrimestre(c.code);
        const p = e.prevu;
        const r = e.realise;
        return [
          {
            libelle: "Écart sur marge",
            attendu: e.marge.total,
            calcul: `${qte(r.quantite)} × ${eur(r.margeUnitaire)} − ${qte(p.quantite)} × ${eur(p.margeUnitaire)} = ${eur(e.marge.total)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Effet du volume sur la marge",
            attendu: e.marge.volume,
            calcul: `(${qte(r.quantite)} − ${qte(p.quantite)}) × ${eur(p.margeUnitaire)} = ${eur(e.marge.volume)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Effet de la marge unitaire",
            attendu: e.marge.unitaire,
            calcul: `(${eur(r.margeUnitaire)} − ${eur(p.margeUnitaire)}) × ${qte(r.quantite)} = ${eur(e.marge.unitaire)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const e = ecartsDuTrimestre(c.code);
        return [
          e.marge.unitaire === 0
            ? "La marge unitaire n'a pas bougé : le prix et le coût variable de chaque unité sont ceux du budget."
            : `La marge unitaire a bougé de ${eur(e.realise.margeUnitaire - e.prevu.margeUnitaire)} : le prix, ou le coût variable de chaque unité, n'est plus celui du budget.`,
        ];
      },
    },
    {
      id: "marge-et-prix",
      type: "choix",
      titre: "Une vente perdue coûte sa marge",
      notions: ["contribution_margin"],
      question: (c) => {
        const e = ecartsDuTrimestre(c.code);
        return `Le volume a fait ${eur(e.chiffreDAffaires.volume)} sur le chiffre d'affaires, mais seulement ${eur(e.marge.volume)} sur la marge. Pourquoi ?`;
      },
      options: (c) => {
        const e = ecartsDuTrimestre(c.code);
        return [
          {
            texte: `Parce qu'une unité de plus ou de moins change le chiffre d'affaires de son prix (${eur(e.prevu.prix)}), mais la marge de sa seule marge unitaire (${eur(e.prevu.margeUnitaire)}) : son coût variable part avec elle.`,
            juste: true,
            retour:
              "C'est cela. Une vente perdue n'est pas perdue en entier : on n'a pas eu à payer son coût variable. C'est pourquoi on juge un écart de volume à la marge, jamais au chiffre d'affaires.",
          },
          {
            texte: "Parce que les charges fixes ont absorbé une partie de l'écart.",
            juste: false,
            retour: "Les charges fixes ne bougent pas avec le volume : elles n'entrent pas dans la marge sur coût variable.",
          },
          {
            texte: "C'est une erreur d'arrondi.",
            juste: false,
            retour: "L'écart est bien trop grand pour un arrondi : il vient du coût variable de chaque unité.",
          },
        ];
      },
    },
    {
      id: "resultat",
      type: "choix",
      titre: "Ce que l'écart coûte au résultat",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const e = ecartsDuTrimestre(c.code);
        return e.chargesFixes === 0
          ? "Les charges fixes ont été exactement celles du budget. Quel est l'écart sur le résultat d'exploitation ?"
          : `Les charges fixes ont été de ${eur(e.realise.chargesFixes)} pour ${eur(e.prevu.chargesFixes)} prévus. Quel est l'écart sur le résultat d'exploitation ?`;
      },
      options: (c) => {
        const e = ecartsDuTrimestre(c.code);
        // Deux mauvaises réponses toujours distinctes : l'écart sur chiffre d'affaires, et un résultat inchangé.
        return [
          {
            texte: `${eur(e.resultat)} : l'écart sur marge, moins l'écart sur charges fixes.`,
            juste: true,
            retour: e.chargesFixes
              ? `C'est cela : ${eur(e.marge.total)} − ${eur(e.chargesFixes)} = ${eur(e.resultat)}. Le résultat ne voit du chiffre d'affaires que sa marge.`
              : `C'est cela : les charges fixes n'ayant pas bougé, l'écart sur résultat est l'écart sur marge. Le résultat ne voit du chiffre d'affaires que sa marge.`,
          },
          {
            texte: `${eur(e.chiffreDAffaires.total)} : l'écart sur chiffre d'affaires.`,
            juste: false,
            retour: "Le chiffre d'affaires n'est pas le résultat : chaque unité vendue ou perdue emporte son coût variable.",
          },
          {
            texte: "Aucun : les charges fixes n'ont pas bougé, le résultat non plus.",
            juste: false,
            retour: `Les charges fixes n'ont pas bougé, mais la marge si : ${eur(e.marge.total)}. Le résultat la suit.`,
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["volume_price_variance", "contribution_margin"],
      texte: (c) => {
        const e = ecartsDuTrimestre(c.code);
        return [
          `Vous avez décomposé l'écart du deuxième trimestre de ${c.entreprise} : ${eur(e.chiffreDAffaires.total)} sur le chiffre d'affaires, ${eur(e.marge.total)} sur la marge, ${eur(e.resultat)} sur le résultat d'exploitation.`,
          "Un écart sur quantités interroge le marché et le commercial ; un écart sur prix, la politique de prix ; un écart sur marge unitaire, les achats et la production. Décomposer, c'est savoir à qui poser la question.",
        ];
      },
      repere: () =>
        "Écart = réalisé − prévu. Sur le chiffre d'affaires : quantités au prix prévu, prix sur les quantités réelles. Sur la marge : volume à la marge unitaire prévue, marge unitaire sur les quantités réelles.",
    },
  ],
};
