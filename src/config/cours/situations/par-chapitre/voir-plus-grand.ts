import type { EquipmentTypeDef } from "../../../../engine/types";
import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { CROITRE_EN_INVESTISSANT, TRIMESTRE_DE_L_ACHAT, investissement, machineDuChapitre } from "../../chapitres/croitre-en-investissant";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** « fait gagner 3 622 € » ou « fait perdre 2 971 € » : un gain négatif se dit comme une perte. */
const faitGagner = (x: number) => (x >= 0 ? `fait gagner ${eur(x)}` : `fait perdre ${eur(-x)}`);
/**
 * CAS PRATIQUE DU CHAPITRE « CROÎTRE EN INVESTISSANT » : VOIR PLUS GRAND (stratégie et
 * management, palier 3).
 *
 * Le chapitre a acheté une machine de plus, la même que le premier équipement du parc. La
 * direction veut voir plus grand : la machine du catalogue qui ajoute le plus de capacité, au
 * même trimestre, payée de la même façon, par un emprunt du même montant. L'élève refait seul
 * les calculs du chapitre sur la grande machine (l'amortissement, les intérêts, la capacité
 * gagnée), puis lit ce que l'arène en fait, face à la petite.
 *
 * Le cas est neuf par sa question : le chapitre jugeait un investissement contre rien, le cas en
 * compare deux tailles. Les chiffres sont ceux du chapitre (`investissement`), appelés sur la
 * grande machine ; l'année rejouée est l'année du cours (`rejouerAvec`), la grande machine
 * achetée au trimestre 1, dans le même scénario que le chapitre.
 */

/** La grande machine : celle du catalogue d'équipements qui ajoute le plus de capacité par trimestre. */
export function plusGrandeMachine(code: string): EquipmentTypeDef {
  return [...scenarioByCode(code).scenario.equipment!.types].sort((a, b) => b.capacityPerUnit - a.capacityPerUnit)[0]!;
}

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "la-grande" | "la-petite" | "aucune";

/** Les deux machines, et ce que l'arène fait de chacune. */
export function voirPlusGrand(c: Cas) {
  const petite = investissement(c, machineDuChapitre(c.code));
  const grande = investissement(c, plusGrandeMachine(c.code));
  const ecart = grande.resultatNetGagne - petite.resultatNetGagne;
  const verdict: Verdict = ecart > 0 && grande.resultatNetGagne > 0 ? "la-grande" : petite.resultatNetGagne > 0 ? "la-petite" : "aucune";
  return { petite, grande, ecart, verdict };
}

const T = TRIMESTRE_DE_L_ACHAT;

export const VOIR_PLUS_GRAND: Situation = {
  code: "voir-plus-grand",
  parcours: "strategie",
  palier: 3,
  blocs: [],
  reprend: [CROITRE_EN_INVESTISSANT.code],
  commanditaire: "La direction",
  titre: "Voir plus grand",
  accroche:
    "La direction veut croître franchement : la plus grande machine du catalogue, plutôt que la petite. Ce qu'elle coûte sur l'année, la capacité qu'elle ajoute, et ce que l'arène en fait face à la petite.",
  objectifs: [
    "Calculer l'amortissement et les intérêts d'un investissement sur l'année",
    "Calculer la capacité qu'il ajoute",
    "Comparer deux tailles d'investissement dans l'année rejouée",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la direction",
      texte: (c) => {
        const v = voirPlusGrand(c);
        return [
          `« Si ${c.entreprise} doit croître, faisons-le franchement. Plutôt qu'une « ${v.petite.machine} » de plus, achetons au trimestre ${T} une « ${v.grande.machine} », celle du catalogue qui ajoute le plus de capacité, avec un emprunt du même montant. Dites-moi ce qu'elle coûtera cette année, et si elle paie mieux que la petite. »`,
          "Pas de cours cette fois : vous avez les deux machines et les conditions de l'emprunt, et les calculs sont ceux du chapitre. L'arène a rejoué l'année avec chacune des deux machines.",
        ];
      },
      tableau: (c) => {
        const v = voirPlusGrand(c);
        return {
          titre: `Les deux machines ${dE(c.entreprise)}`,
          colonnes: ["La petite", "La grande"],
          lignes: [
            { libelle: "Machine", valeurs: [v.petite.machine, v.grande.machine] },
            { libelle: "Prix", valeurs: [eur(v.petite.cout), eur(v.grande.cout)] },
            { libelle: `Capacité ajoutée par trimestre (${c.unites})`, valeurs: [qte(v.petite.capacite), qte(v.grande.capacite)] },
            { libelle: "Durée d'amortissement (trimestres)", valeurs: [qte(v.petite.duree), qte(v.grande.duree)] },
            { libelle: "Taux annuel de l'emprunt", valeurs: [pct(v.petite.taux), pct(v.grande.taux)] },
            { libelle: "Durée de l'emprunt (trimestres)", valeurs: [qte(v.petite.dureeDuPret), qte(v.grande.dureeDuPret)] },
          ],
        };
      },
      repere: () => "À rendre : ce que la grande machine coûte sur l'année, la capacité qu'elle ajoute, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "couts",
      type: "montants",
      titre: "Ce que coûte la grande machine",
      notions: ["depreciation", "loan_schedule", "capacity"],
      question: (c) => {
        const g = voirPlusGrand(c).grande;
        return `La grande machine entre en service au trimestre ${T + 1} et sert ${g.trimestresEnService} trimestres cette année. Calculez son amortissement sur l'année, les intérêts de son emprunt sur l'année (le capital se rembourse par parts égales, les intérêts courent sur ce qui reste dû à partir du trimestre ${T + 1}), et la capacité qu'elle ajoute sur l'année (en ${c.unites}).`;
      },
      champs: (c) => {
        const g = voirPlusGrand(c).grande;
        return [
          {
            libelle: "Amortissement de la grande machine sur l'année",
            attendu: g.amortissement,
            calcul: `${eur(g.cout)} × ${g.trimestresEnService} ÷ ${g.duree} = ${eur(g.amortissement)}`,
            tolerance: 1,
          },
          {
            libelle: "Intérêts de l'emprunt sur l'année",
            attendu: g.interets,
            calcul: `${g.lignes.map((l) => `${eur(l.du)} × ${pct(g.taux)} ÷ 4`).join(" + ")} = ${eur(g.interets)}`,
            tolerance: 1,
          },
          {
            libelle: `Capacité gagnée sur l'année (${c.unites})`,
            attendu: g.capaciteGagnee,
            calcul: `${qte(g.capacite)} × ${g.trimestresEnService} = ${qte(g.capaciteGagnee)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const { petite: p, grande: g } = voirPlusGrand(c);
        return [
          `La grande machine pèse ${eur(Math.round(g.amortissement + g.interets))} sur le résultat de l'année en amortissement et en intérêts, contre ${eur(Math.round(p.amortissement + p.interets))} pour la petite. Elle ajoute ${qte(g.capaciteGagnee)} ${c.unites} de capacité sur l'année, contre ${qte(p.capaciteGagnee)} : il faut que la demande remplisse la différence.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année avec chaque machine",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const { petite: p, grande: g } = voirPlusGrand(c);
        return {
          titre: "L'année jouée, sans machine, avec la petite, avec la grande",
          colonnes: ["Sans machine", "Avec la petite", "Avec la grande"],
          lignes: [
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(p.sans.ventes), qte(p.avec.ventes), qte(g.avec.ventes)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(p.sans.marge), eur(p.avec.marge), eur(g.avec.marge)] },
            { libelle: "Résultat net", valeurs: [eur(p.sans.resultatNet), eur(p.avec.resultatNet), eur(g.avec.resultatNet)] },
          ],
        };
      },
      question: () =>
        "D'après le tableau, calculez le résultat net que la grande machine fait gagner sur l'année, puis l'écart entre ce gain et celui de la petite (la grande moins la petite).",
      champs: (c) => {
        const { petite: p, grande: g, ecart } = voirPlusGrand(c);
        return [
          {
            libelle: "Résultat net gagné avec la grande machine",
            attendu: g.resultatNetGagne,
            calcul: `${eur(g.avec.resultatNet)} − ${retranche(g.sans.resultatNet)} = ${eur(g.resultatNetGagne)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de gain, la grande moins la petite",
            attendu: ecart,
            calcul: `${eur(g.resultatNetGagne)} − ${retranche(p.resultatNetGagne)} = ${eur(ecart)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const { petite: p, grande: g, ecart } = voirPlusGrand(c);
        const ventesEnPlus = g.avec.ventes - p.avec.ventes;
        return [
          ventesEnPlus > 0
            ? `La grande machine fait vendre ${qte(ventesEnPlus)} ${c.unites} de plus que la petite sur l'année, pour ${qte(g.capaciteGagnee - p.capaciteGagnee)} de capacité en plus.`
            : `La grande machine ne fait pas vendre plus que la petite : la capacité en plus ne trouve pas de clients cette année.`,
          ecart > 0
            ? `Le résultat net gagne ${eur(ecart)} de plus qu'avec la petite, charges de la grande machine comprises.`
            : `Le résultat net finit ${eur(-ecart)} plus bas qu'avec la petite : la grande machine coûte plus qu'elle ne rapporte de plus.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const { petite: p, grande: g, ecart, verdict } = voirPlusGrand(c);
        return [
          {
            texte: "Prenons la grande : elle rapporte plus que la petite, charges comprises",
            juste: verdict === "la-grande",
            retour:
              verdict === "la-grande"
                ? `Oui : dans l'arène, la grande machine fait gagner ${eur(g.resultatNetGagne)} de résultat net sur l'année, ${eur(ecart)} de plus que la petite. La demande remplit la capacité en plus, au moins en partie.`
                : ecart > 0
                  ? `Non : elle fait mieux que la petite, mais le résultat net ne gagne rien avec elle (${eur(g.resultatNetGagne)}).`
                  : `Non : la grande machine fait gagner ${eur(-ecart)} de moins que la petite.`,
          },
          {
            texte: "Gardons la petite : la grande coûte plus qu'elle ne fait vendre de plus",
            juste: verdict === "la-petite",
            retour:
              verdict === "la-petite"
                ? `Oui : la petite ${faitGagner(p.resultatNetGagne)} de résultat net, la grande ${faitGagner(g.resultatNetGagne)}. La capacité en plus de la grande ne se vend pas assez pour payer ce qu'elle coûte de plus : l'amortissement et les intérêts d'une machine plus chère.`
                : verdict === "la-grande"
                  ? `Non : la grande fait gagner ${eur(ecart)} de plus que la petite.`
                  : `Non : la petite ne paie pas non plus, elle ${faitGagner(p.resultatNetGagne)} de résultat net.`,
          },
          {
            texte: "Ni l'une ni l'autre : aucune des deux machines ne paie sur cette année",
            juste: verdict === "aucune",
            retour:
              verdict === "aucune"
                ? `Oui : la petite ${faitGagner(p.resultatNetGagne)} de résultat net, la grande ${faitGagner(g.resultatNetGagne)}. Si la petite ne paie pas, la grande ne fait qu'agrandir le pari : avant d'acheter de la capacité, il faut savoir si elle manque.`
                : `Non : ${verdict === "la-grande" ? `la grande fait gagner ${eur(g.resultatNetGagne)}` : `la petite fait gagner ${eur(p.resultatNetGagne)}`} de résultat net sur l'année.`,
          },
        ];
      },
    },
  ],
};
