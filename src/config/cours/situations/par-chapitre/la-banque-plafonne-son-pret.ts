import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_FINANCEMENT } from "../../chapitres/emprunt-ou-credit-bail";
import { COMPTE_COURANT } from "../../monde/financement-du-lycee";
import { EMPRUNT_DE_LA_LIGNE, PLAFOND_DE_LA_BANQUE, TAUX_DE_L_IMPOT, planDeFinancementDeLaGamme } from "../../monde/financement-de-la-gamme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PLAN DE FINANCEMENT » : LA BANQUE PLAFONNE SON PRÊT (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le plan de financement de la gamme de
 * monde/financement-de-la-gamme.ts (`planDeFinancementDeLaGamme`), la ligne achetée.
 *
 * HYPOTHÈSE DU CAS (PLAFOND_DE_LA_BANQUE) : la banque ne prête que 60 000 € pour la gamme, à 5 % sur
 * 5 ans. Les associés peuvent compléter en compte courant, aux conditions du chapitre « Financer
 * autrement » (3 %, remboursé en une fois au bout de 5 ans, 40 000 € au plus). L'élève refait le plan
 * de N+1 avec le prêt plafonné, chiffre le compte courant, au millier d'euros, qui l'équilibre, et
 * rend une réponse.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100 + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const enCalcul = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

/** Le plus petit compte courant, au millier d'euros, qui équilibre chaque année du plan avec le prêt plafonné. */
export function compteCourantQuiEquilibre() {
  for (let k = 0; k <= COMPTE_COURANT.plafond!; k += 1_000) if (planDeFinancementDeLaGamme({ emprunt: PLAFOND_DE_LA_BANQUE, compteCourant: k }).equilibre) return k;
  return null;
}

/** Les chiffres du cas, calculés une fois de la fiche. */
export function banquePlafonnee(_c?: Pick<Cas, "code">) {
  const sans = planDeFinancementDeLaGamme({ emprunt: PLAFOND_DE_LA_BANQUE });
  const k = compteCourantQuiEquilibre()!;
  const avec = planDeFinancementDeLaGamme({ emprunt: PLAFOND_DE_LA_BANQUE, compteCourant: k });
  return { sans, avec, k, n1: sans.annees[0]!, a1: avec.annees[0]!, t: TAUX_DE_L_IMPOT };
}

export const LA_BANQUE_PLAFONNE_SON_PRET: Situation = {
  code: "la-banque-plafonne-son-pret",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-plan-de-financement"],
  commanditaire: "Le dirigeant",
  titre: "La banque plafonne son prêt",
  accroche: "La banque ne prête plus tout ce que le plan demandait. Le plan tient-il encore, et que faut-il demander aux associés ?",
  objectifs: [
    "Refaire le solde d'une année du plan de financement avec un emprunt plus petit",
    "Chiffrer l'apport qui l'équilibre, ses intérêts compris",
    "Rendre une réponse chiffrée au dirigeant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "ce cas reprend le chapitre « Le plan de financement », qui se dresse sur la gamme de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: () => [
        `« La banque a revu son offre : ${eur(PLAFOND_DE_LA_BANQUE)} au plus pour la gamme, toujours à ${pct(EMPRUNT_DE_LA_LIGNE.taux)} sur ${EMPRUNT_DE_LA_LIGNE.dureeAns} ans. Nos associés peuvent prêter en compte courant. Combien faut-il leur demander pour que le plan tienne chaque année ? »`,
        "Pas de cours cette fois : vous avez le plan ébauché du chapitre et les conditions des deux prêteurs.",
      ],
      tableau: () => {
        const b = banquePlafonnee();
        const e = planDeFinancementDeLaGamme().annees[0]!;
        return {
          titre: "N+1, sans emprunt, et les deux prêteurs",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Emplois de N+1, ligne, moules et BFR", valeurs: [eur(e.emplois)] },
            { libelle: "Ressources de N+1, la réserve et la CAF", valeurs: [eur(e.ressources)] },
            { libelle: "Prêt bancaire", valeurs: [`${eur(PLAFOND_DE_LA_BANQUE)} au plus, à ${pct(EMPRUNT_DE_LA_LIGNE.taux)}, capital remboursé en parts égales dès la fin de N+1`] },
            { libelle: "Compte courant des associés", valeurs: [`${eur(COMPTE_COURANT.plafond!)} au plus, à ${pct(COMPTE_COURANT.taux)}, remboursé en une fois au bout de ${COMPTE_COURANT.dureeAns} ans`] },
            { libelle: "Impôt sur les bénéfices", valeurs: [pct(b.t)] },
          ],
        };
      },
      repere: () => "À rendre : le solde de N+1 avec le prêt plafonné, le compte courant qui l'équilibre, au millier d'euros, et votre réponse.",
    },
    {
      id: "le-pret-plafonne",
      type: "montants",
      titre: "Le prêt plafonné",
      notions: ["loan_schedule", "cash_budget"],
      question: () => `Avec ${eur(PLAFOND_DE_LA_BANQUE)} empruntés le 1er janvier N+1, calculez les intérêts de N+1, le capital remboursé fin N+1, la CAF de N+1 ajustée, puis le solde de N+1.`,
      champs: () => {
        const b = banquePlafonnee();
        const e = planDeFinancementDeLaGamme().annees[0]!;
        const a = b.n1;
        return [
          { libelle: "Intérêts de N+1", attendu: a.interets, calcul: `${eur(PLAFOND_DE_LA_BANQUE)} × ${pct(EMPRUNT_DE_LA_LIGNE.taux)} = ${eur(a.interets)}` },
          { libelle: "Capital remboursé fin N+1", attendu: a.remboursements, calcul: `${eur(PLAFOND_DE_LA_BANQUE)} ÷ ${EMPRUNT_DE_LA_LIGNE.dureeAns} = ${eur(a.remboursements)}` },
          { libelle: "CAF de N+1 ajustée", attendu: a.caf, calcul: `${eur(e.caf)} − ${eur(a.interets)} × (1 − ${pct(b.t)}) = ${eur(a.caf)}` },
          { libelle: "Solde de N+1", attendu: a.solde, calcul: `${eur(a.ressources)} de ressources − ${eur(a.emplois)} d'emplois = ${eur(a.solde)}` },
        ];
      },
      explication: () => {
        const b = banquePlafonnee();
        return [`Il manque encore ${eur(-b.n1.solde)} en N+1. Les années suivantes, elles, restent positives : seul le lancement demande un complément.`];
      },
    },
    {
      id: "le-compte-courant",
      type: "montants",
      titre: "Le compte courant",
      notions: ["loan_schedule"],
      question: () =>
        `Un compte courant de C euros apporte C en N+1, mais ses intérêts, ${pct(COMPTE_COURANT.taux)} par an, baissent la CAF de leur montant après impôt. Rien ne se rembourse avant la fin. Calculez le plus petit compte courant, au millier d'euros, qui équilibre N+1, ses intérêts de N+1, puis le nouveau solde de N+1.`,
      champs: () => {
        const b = banquePlafonnee();
        const net = auCentime(1 - COMPTE_COURANT.taux * (1 - b.t));
        const exact = auCentime(-b.n1.solde / net);
        return [
          {
            libelle: "Compte courant, au millier d'euros",
            attendu: b.k,
            calcul: `C × (1 − ${pct(COMPTE_COURANT.taux)} × (1 − ${pct(b.t)})) ≥ ${eur(-b.n1.solde)}, soit C ≥ ${eur(exact)} : ${eur(b.k)} au millier supérieur`,
          },
          { libelle: "Intérêts du compte courant en N+1", attendu: auCentime(b.k * COMPTE_COURANT.taux), calcul: `${eur(b.k)} × ${pct(COMPTE_COURANT.taux)} = ${eur(auCentime(b.k * COMPTE_COURANT.taux))}` },
          { libelle: "Solde de N+1", attendu: b.a1.solde, calcul: `${enCalcul(b.n1.solde)} + ${eur(b.k)} − ${eur(auCentime(b.n1.caf - b.a1.caf))} de CAF en moins = ${eur(b.a1.solde)}` },
        ];
      },
      explication: () => {
        const b = banquePlafonnee();
        return [`Avec ${eur(b.k)} en compte courant, chaque année tient ; le plus petit solde est celui de ${b.avec.plusPetit.annee}, ${eur(b.avec.plusPetit.solde)}. Le remboursement en une fois, en N+5, tombe une année où la gamme dégage assez.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["loan_schedule", "cash_budget"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: () => {
        const b = banquePlafonnee();
        return [
          {
            texte: `Demander ${eur(b.k)} aux associés`,
            juste: true,
            retour: `Oui. ${eur(PLAFOND_DE_LA_BANQUE)} de la banque et ${eur(b.k)} en compte courant équilibrent chaque année ; le compte courant reste sous le plafond de ${eur(COMPTE_COURANT.plafond!)}. Fin N+5, le plan cumule ${eur(b.avec.cumulFinal)}, de quoi le rembourser.`,
          },
          {
            texte: `Demander ${eur(-b.n1.solde)}, le manque exact de N+1`,
            juste: false,
            retour: `Presque : les intérêts du compte courant baissent la CAF, et ${eur(-b.n1.solde)} laisseraient N+1 encore négatif, à ${eur(planDeFinancementDeLaGamme({ emprunt: PLAFOND_DE_LA_BANQUE, compteCourant: -b.n1.solde }).annees[0]!.solde)}. Il faut ${eur(b.k)}.`,
          },
          {
            texte: "Renoncer au lancement : sans le prêt entier, le plan ne tient plus",
            juste: false,
            retour: "Non : un plan s'ajuste. Le manque de N+1 est petit, et les années suivantes dégagent de larges excédents ; un apport modeste suffit.",
          },
        ];
      },
    },
  ],
};
