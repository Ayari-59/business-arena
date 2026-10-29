import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { RETARD, UNE_INFORMATION_A_TEMPS } from "../../chapitres/une-information-a-temps";
import { FICHE_DE_CAPACITE, anneeAvecUnRetard, capaciteDuTrimestre, chargesFixesDuMois, trimestreDecide } from "../../monde/gestion-et-information";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « UNE INFORMATION QUI CIRCULE À TEMPS » : LE COMPTE RENDU EN RETARD
 * (Bac STMG, management, palier 1).
 *
 * Une seule fois dans l'année, le compte rendu des ventes du trimestre 3 arrive après la décision du
 * trimestre 4 : le responsable de la production cale le plan du trimestre 4 sur la demande du
 * trimestre 3. Il demande ce que ce retard a coûté, et ce qui s'est passé.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : l'année N à jour du chapitre
 * (anneeAvecUnRetard, sans retard), et le trimestre 4 rejoué avec le plan repris (trimestreDecide,
 * dans monde/gestion-et-information.ts) ; les trimestres 1 à 3 ne changent pas, et l'équipe à jour
 * n'y laisse aucun stock. Le cas rejouait l'année de l'arène, dans huit entreprises.
 */

/** Le trimestre décidé sans le compte rendu : le dernier de l'année. */
export const TRIMESTRE_DECIDE = 4;

/** Le trimestre dont le compte rendu arrive en retard : celui d'avant. */
export const TRIMESTRE_DU_COMPTE_RENDU = TRIMESTRE_DECIDE - RETARD;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type VerdictDuCompteRendu = "clients-repartis" | "offre-invendue" | "rien";

/** Le trimestre décidé, à jour et repris, et ce que le retard a coûté. */
export function compteRendu() {
  const annee = anneeAvecUnRetard(FICHE_DE_CAPACITE, 0);
  const chargesDuTrimestre = auCentime(3 * chargesFixesDuMois());
  const aJour = annee.trimestres[TRIMESTRE_DECIDE - 1]!;
  const t = trimestreDecide(FICHE_DE_CAPACITE, annee.trimestres[TRIMESTRE_DU_COMPTE_RENDU - 1]!.demande);
  const repris = { plan: t.plan, ventes: t.vendues, nonServie: t.manquees, invendu: Math.max(0, Math.min(t.plan, capaciteDuTrimestre(FICHE_DE_CAPACITE).capacite) - t.vendues), resultat: auCentime(t.marge - chargesDuTrimestre) };
  const coutDuRetard = auCentime(aJour.resultat - repris.resultat);
  const repartisEnPlus = repris.nonServie - aJour.nonServie;
  const invendusEnPlus = repris.invendu;
  return {
    aJour: { plan: aJour.plan, ventes: aJour.ventes, nonServie: aJour.nonServie, invendu: 0, resultat: aJour.resultat },
    repris,
    ecartDePlan: repris.plan - aJour.plan,
    ecartDeVentes: repris.ventes - aJour.ventes,
    repartisEnPlus,
    invendusEnPlus,
    coutDuRetard,
    resultatDeLAnnee: annee.resultat,
    partDuResultat: auDixieme((coutDuRetard / annee.resultat) * 100),
    verdict: (Math.abs(coutDuRetard) < 1 ? "rien" : repartisEnPlus >= invendusEnPlus ? "clients-repartis" : "offre-invendue") as VerdictDuCompteRendu,
  };
}

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const r = compteRendu();
  const ligne = (libelle: string, f: (t: typeof r.aJour) => string) => ({ libelle, valeurs: [f(r.aJour), f(r.repris)] });
  return {
    titre: `Le trimestre ${TRIMESTRE_DECIDE} rejoué`,
    colonnes: ["Avec le compte rendu à temps", `Plan calé sur le trimestre ${TRIMESTRE_DU_COMPTE_RENDU}`],
    lignes: [
      ligne(`Plan de production (${c.unites})`, (t) => qte(t.plan)),
      ligne(`Ventes (${c.unites})`, (t) => qte(t.ventes)),
      ligne(`Demande non servie (${c.unites})`, (t) => qte(t.nonServie)),
      ligne("Résultat de l'activité du trimestre", (t) => eur(t.resultat)),
    ],
  };
}

export const LE_COMPTE_RENDU_EN_RETARD: Situation = {
  code: "le-compte-rendu-en-retard",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: [UNE_INFORMATION_A_TEMPS.code],
  commanditaire: "Le responsable de la production",
  titre: "Le compte rendu en retard",
  accroche: `Le compte rendu des ventes du trimestre ${TRIMESTRE_DU_COMPTE_RENDU} est arrivé après la décision du trimestre ${TRIMESTRE_DECIDE} : le responsable de la production a calé son plan sur les chiffres d'avant. Lire le trimestre rejoué, chiffrer ce que le retard a coûté, et lui répondre.`,
  objectifs: ["Lire l'écart entre une décision prise à jour et une décision prise en retard", "Chiffrer ce que le retard d'une information coûte au résultat", "Dire au responsable ce que le retard a produit"],
  libre: false,
  entreprises: UNE_INFORMATION_A_TEMPS.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable de la production",
      tableau: tableauDuTrimestre,
      texte: (c) => [
        `« Le compte rendu des ventes du trimestre ${TRIMESTRE_DU_COMPTE_RENDU} m'est arrivé après la décision du trimestre ${TRIMESTRE_DECIDE}. J'ai donc calé le plan sur la demande du trimestre ${TRIMESTRE_DU_COMPTE_RENDU}. Combien ce retard nous a-t-il coûté, et qu'est-ce qui s'est passé ? »`,
        `Pas de cours cette fois. Le trimestre ${TRIMESTRE_DECIDE} ${dE(c.entreprise)} a été rejoué avec le plan repris ; les trimestres d'avant ne changent pas.`,
      ],
      repere: () => "À rendre : les écarts du trimestre, ce que le retard a coûté, et votre réponse.",
    },
    {
      id: "les-ecarts",
      type: "montants",
      titre: `Les écarts du trimestre ${TRIMESTRE_DECIDE}`,
      notions: ["capacity"],
      tableau: tableauDuTrimestre,
      question: () => "D'après le tableau, calculez chaque écart, plan repris moins compte rendu à temps (négatif s'il baisse) : le plan, les ventes, puis la demande non servie.",
      champs: (c) => {
        const r = compteRendu();
        return [
          { libelle: `Écart de plan (${c.unites})`, attendu: r.ecartDePlan, calcul: `${qte(r.repris.plan)} − ${qte(r.aJour.plan)} = ${qte(r.ecartDePlan)}` },
          { libelle: `Écart de ventes (${c.unites})`, attendu: r.ecartDeVentes, calcul: `${qte(r.repris.ventes)} − ${qte(r.aJour.ventes)} = ${qte(r.ecartDeVentes)}` },
          { libelle: `Écart de demande non servie (${c.unites})`, attendu: r.repartisEnPlus, calcul: `${qte(r.repris.nonServie)} − ${qte(r.aJour.nonServie)} = ${qte(r.repartisEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = compteRendu();
        return [`Le plan repris est fait pour la demande du trimestre ${TRIMESTRE_DU_COMPTE_RENDU}, pas pour celle du trimestre ${TRIMESTRE_DECIDE} : ${qte(r.repris.plan)} ${c.unites}, au lieu des ${qte(r.aJour.plan)} que le compte rendu à temps aurait fait prévoir.`];
      },
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que le retard a coûté",
      notions: ["income_statement"],
      tableau: tableauDuTrimestre,
      question: () => {
        const r = compteRendu();
        return `Calculez le résultat perdu au trimestre ${TRIMESTRE_DECIDE} (compte rendu à temps moins plan repris), puis ce qu'il représente du résultat de l'année avec le compte rendu à temps, ${eur(r.resultatDeLAnnee)} (en %, au dixième).`;
      },
      champs: () => {
        const r = compteRendu();
        return [
          { libelle: "Résultat perdu au trimestre", attendu: r.coutDuRetard, calcul: `${eur(r.aJour.resultat)} − ${retranche(r.repris.resultat)} = ${eur(r.coutDuRetard)}` },
          { libelle: "Part du résultat de l'année (%)", attendu: r.partDuResultat, calcul: `${eur(r.coutDuRetard)} ÷ ${eur(r.resultatDeLAnnee)} × 100 = ${pct(r.partDuResultat)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const r = compteRendu();
        return [`Un seul compte rendu en retard, et le résultat de l'année perd ${eur(r.coutDuRetard)}, ${pct(r.partDuResultat)} de ce qu'il aurait été.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      notions: ["capacity"],
      question: () => "Que répondez-vous au responsable de la production : qu'est-ce que le retard a produit ?",
      options: (c) => {
        const r = compteRendu();
        const faits = `au trimestre ${TRIMESTRE_DECIDE}, le plan repris vaut ${qte(r.repris.plan)} ${c.unites} au lieu de ${qte(r.aJour.plan)} ; la demande non servie passe de ${qte(r.aJour.nonServie)} à ${qte(r.repris.nonServie)}, et le résultat ${r.coutDuRetard >= 0 ? `perd ${eur(r.coutDuRetard)}` : `gagne ${eur(-r.coutDuRetard)}`}.`;
        return [
          { texte: "Des clients sont repartis sans être servis", juste: r.verdict === "clients-repartis", retour: r.verdict === "clients-repartis" ? `Oui : ${faits} La demande avait monté pour Noël, et le plan ne le savait pas.` : `Non : ${faits}` },
          { texte: "Une partie de la production est restée en stock", juste: r.verdict === "offre-invendue", retour: r.verdict === "offre-invendue" ? `Oui : ${faits}` : `Non : ${faits}` },
          { texte: `Rien : le trimestre ${TRIMESTRE_DECIDE} a rapporté autant qu'avec le compte rendu à temps`, juste: r.verdict === "rien", retour: r.verdict === "rien" ? `Oui : ${faits}` : `Non : ${faits}` },
        ];
      },
    },
  ],
};
