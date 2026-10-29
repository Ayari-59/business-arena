import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { prudenceDeNova } from "../../chapitres/depreciations-et-provisions";
import { ENTREPRISES_DE_LA_CLOTURE } from "../../chapitres/la-cloture";
import { perteSurCreance } from "../../monde/cloture";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DÉNOUEMENT DES RISQUES : REPRENDRE, SOLDER, CORRIGER »
 * (comptabilité générale, palier 4).
 *
 * Autre dénouement : le liquidateur de Sonora verse `PART_VERSEE_DU_CAS` de la créance, plus que
 * prévu. L'expert-comptable demande ce que N+1 porte alors. L'élève refait le calcul du chapitre
 * (`perteSurCreance`, avec la dépréciation constatée en N) : la perte TTC, la perte HT, la TVA
 * récupérée et la charge nette de N+1, ici négative (un gain).
 */

/** LA PART VERSÉE PAR LE LIQUIDATEUR (hypothèse du cas) : 70 % de la créance TTC. */
export const PART_VERSEE_DU_CAS = 0.7;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export function liquidateurPlusGenereux() {
  const y = prudenceDeNova({ code: "nova" });
  const verse = auCentime(y.creance.ttc * PART_VERSEE_DU_CAS);
  const p = perteSurCreance(y.creance.ttc, verse, y.f.tauxDeTva, y.d.depreciation);
  return { y, verse, p, gain: p.chargeNette < 0 };
}

export const LE_LIQUIDATEUR_VERSE_DAVANTAGE: Situation = {
  code: "le-liquidateur-verse-davantage",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-denouement-des-risques"],
  commanditaire: "L'expert-comptable",
  titre: "Le liquidateur verse davantage",
  accroche: "Le liquidateur paie plus que le mandataire ne le craignait : ce que N+1 porte, et ce qu'on fait de l'exercice N.",
  objectifs: ["Calculer la perte sur une créance irrécouvrable, hors taxes et TVA récupérée", "Chiffrer la charge nette de N+1 face à la dépréciation de N", "Dire ce qu'on fait d'une estimation trop prudente"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_CLOTURE, pourquoi: "ce cas reprend la créance de Sonora et sa dépréciation, celles du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'expert-comptable",
      texte: () => {
        const k = liquidateurPlusGenereux();
        return [
          `« Supposons que le liquidateur verse ${pct(PART_VERSEE_DU_CAS)} de la créance de ${k.y.f.sonora.nom}, soit ${eur(k.verse)} sur ${eur(k.y.creance.ttc)}. La dépréciation de N était de ${eur(k.y.d.depreciation)}. Que porte N+1, et faut-il revenir sur N ? » L'expert-comptable`,
          "Pas de cours cette fois : la perte se calcule TTC, puis hors taxes, et la dépréciation se reprend pour son montant entier.",
        ];
      },
      repere: () => "À rendre : la perte TTC et HT, la TVA récupérée, la charge nette de N+1 (négative pour un gain), et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Un dénouement plus favorable",
      notions: ["payment_terms", "income_statement"],
      question: () => "Calculez la perte toutes taxes comprises, la perte hors taxes, la TVA récupérée, puis la charge nette de N+1 (la perte hors taxes moins la reprise de la dépréciation ; négative pour un gain).",
      champs: () => {
        const { y, verse, p } = liquidateurPlusGenereux();
        return [
          { libelle: "Perte toutes taxes comprises", attendu: p.perteTtc, calcul: `${eur(y.creance.ttc)} − ${eur(verse)} = ${eur(p.perteTtc)}` },
          { libelle: "Perte hors taxes", attendu: p.perteHt, calcul: `${eur(p.perteTtc)} ÷ (1 + ${pct(y.f.tauxDeTva)}) = ${eur(p.perteHt)}` },
          { libelle: "TVA récupérée", attendu: p.tvaRecuperee, calcul: `${eur(p.perteTtc)} − ${eur(p.perteHt)} = ${eur(p.tvaRecuperee)}` },
          { libelle: "Charge nette de N+1", attendu: p.chargeNette, calcul: `${eur(p.perteHt)} − ${eur(y.d.depreciation)} = ${eur(p.chargeNette)}` },
        ];
      },
      explication: () => {
        const { p, y } = liquidateurPlusGenereux();
        return [`La reprise de ${eur(y.d.depreciation)} dépasse la perte de ${eur(p.perteHt)} : N+1 enregistre un gain net de ${eur(-p.chargeNette)}. Sur les deux exercices, la créance coûte toujours sa perte hors taxes, ${eur(p.perteHt)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'expert-comptable",
      question: () => "Que répondez-vous à l'expert-comptable ?",
      options: () => {
        const { p } = liquidateurPlusGenereux();
        return [
          {
            texte: `N+1 gagne ${eur(-p.chargeNette)}, et N ne se corrige pas`,
            juste: p.chargeNette < 0,
            retour: "Oui : l'estimation de N était la meilleure possible au 31 décembre. L'écart est un changement d'estimation : il passe dans N+1, par la reprise de la dépréciation.",
          },
          {
            texte: "Il faut rouvrir l'exercice N et réduire sa dépréciation, puisque la perte est plus faible que prévu",
            juste: false,
            retour: "Non : on ne corrige un exercice clos que pour une erreur. Une estimation prudente, faite avec ce qu'on savait au 31 décembre, n'en est pas une.",
          },
          {
            texte: `N+1 porte une charge de ${eur(p.perteTtc)}, la perte toutes taxes comprises`,
            juste: false,
            retour: "Non : la TVA de la part perdue se récupère auprès de l'État, et la dépréciation de N se reprend en produit.",
          },
        ];
      },
    },
  ],
};
