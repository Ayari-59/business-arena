import type { CompanyRoundResult } from "../../../../engine/types";
import { soldUnits } from "../../../../engine/simulation/runGame";
import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { RETARD, UNE_INFORMATION_A_TEMPS, anneeDeLEquipe, decisionEnRetard } from "../../chapitres/une-information-a-temps";
import { anneeDeReference, rejouerAvec, type Changement } from "../../gestion-de-la-pme";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « UNE INFORMATION QUI CIRCULE À TEMPS » : LE COMPTE RENDU EN RETARD
 * (Bac STMG, management, palier 1).
 *
 * Une seule fois dans l'année, le compte rendu des ventes du trimestre 3 arrive après la
 * décision du trimestre 4 : le responsable de la production reprend le plan et le prix qu'il
 * avait décidés au trimestre 3. Il demande ce que ce retard a coûté, et ce qui s'est passé.
 *
 * CE QUE LE CAS POSE : le compte rendu en retard, au seul trimestre 4 (`TRIMESTRE_DECIDE`), du
 * même retard que le chapitre (`RETARD`). CE QUE L'ARÈNE CALCULE : l'année du cours rejouée
 * (clé « une-information-a-temps:compte-rendu-du-trimestre-3 ») avec, au trimestre 4 seulement,
 * le plan et le prix que le bon gestionnaire proposait au trimestre 3 (`decisionEnRetard` du
 * chapitre) ; les trimestres 1 à 3 restent ceux de l'année du cours (la garde le vérifie). Le
 * verdict se calcule : des clients repartis, ou une offre restée sans acheteur.
 */

/** Le trimestre décidé sans le compte rendu : le dernier de l'année. */
export const TRIMESTRE_DECIDE = 4;

/** Le trimestre dont le compte rendu arrive en retard : celui d'avant. */
export const TRIMESTRE_DU_COMPTE_RENDU = TRIMESTRE_DECIDE - RETARD;

/** Un écart de résultat de moins d'un euro se lit comme nul : le retard n'a rien coûté. */
export const RESULTAT_INCHANGE = 1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Le plan et le prix du trimestre 3 repris au trimestre 4, et le reste de l'année tel quel. */
function compteRenduEnRetard(): Changement {
  const enRetard = decisionEnRetard(RETARD);
  return (tour, d) => {
    const repris = enRetard(tour, d);
    return tour === TRIMESTRE_DECIDE ? repris : undefined;
  };
}

/** L'année du cours rejouée avec le compte rendu du trimestre 3 arrivé en retard. */
export const anneeDuCompteRendu = (code: string) =>
  rejouerAvec(code, `une-information-a-temps:compte-rendu-du-trimestre-${TRIMESTRE_DU_COMPTE_RENDU}`, compteRenduEnRetard());

export type VerdictDuCompteRendu = "clients-repartis" | "offre-invendue" | "rien";

/** Le trimestre décidé, à jour et repris, et ce que le retard a coûté. */
export function compteRendu(c: Cas) {
  const s = scenarioByCode(c.code);
  const reference = anneeDeReference(c.code);
  const rejouee = anneeDuCompteRendu(c.code);
  const prix = (r: CompanyRoundResult) => auCentime(r.incomeStatement.revenue / soldUnits(r));
  const aJour = anneeDeLEquipe(reference);
  const repris = anneeDeLEquipe(rejouee);
  const k = TRIMESTRE_DECIDE - 1;
  const tj = aJour.trimestres[k]!;
  const tr = repris.trimestres[k]!;
  const coutDuRetard = tj.resultat - tr.resultat;
  const repartisEnPlus = tr.nonServie - tj.nonServie;
  const invendusEnPlus = tr.invendu - tj.invendu;
  const verdict: VerdictDuCompteRendu =
    Math.abs(coutDuRetard) < RESULTAT_INCHANGE ? "rien" : repartisEnPlus >= invendusEnPlus ? "clients-repartis" : "offre-invendue";
  return {
    libellePlan: s.vocabulary.productionPlanLabel,
    perissable: s.scenario.perishable === true,
    aJour: { ...tj, prix: prix(reference[k]!) },
    repris: { ...tr, prix: prix(rejouee[k]!) },
    ecartDePlan: tr.plan - tj.plan,
    ecartDeVentes: tr.ventes - tj.ventes,
    repartisEnPlus,
    invendusEnPlus,
    coutDuRetard,
    resultatDeLAnnee: aJour.resultat,
    partDuResultat: auDixieme((coutDuRetard / aJour.resultat) * 100),
    /** Les trimestres d'avant le compte rendu en retard sont ceux de l'année du cours. */
    memesTrimestresAvant: aJour.trimestres.slice(0, k).every((t, i) => t.resultat === repris.trimestres[i]!.resultat && t.plan === repris.trimestres[i]!.plan),
    verdict,
  };
}

/** Le prix repris, quand il n'est pas celui que le compte rendu à temps aurait fait pratiquer. */
const prixRepris = (r: ReturnType<typeof compteRendu>) =>
  r.repris.prix === r.aJour.prix
    ? ""
    : ` Le prix aussi vient du trimestre ${TRIMESTRE_DU_COMPTE_RENDU} : le prix moyen de vente est de ${eur(r.repris.prix)}, au lieu de ${eur(r.aJour.prix)}.`;

function tableauDuTrimestre(c: Cas): TableauDeDonnees {
  const r = compteRendu(c);
  const ligne = (libelle: string, f: (t: typeof r.aJour) => string) => ({ libelle, valeurs: [f(r.aJour), f(r.repris)] });
  return {
    titre: `Le trimestre ${TRIMESTRE_DECIDE} rejoué par l'arène`,
    colonnes: ["Avec le compte rendu à temps", `Plan et prix du trimestre ${TRIMESTRE_DU_COMPTE_RENDU} repris`],
    lignes: [
      ligne(`« ${r.libellePlan} » (${c.unites})`, (t) => qte(t.plan)),
      ligne("Prix moyen de vente", (t) => eur(t.prix)),
      ligne(`Ventes (${c.unites})`, (t) => qte(t.ventes)),
      ligne(`Demande non servie (${c.unites})`, (t) => qte(t.nonServie)),
      ligne(`${r.perissable ? "Offre restée sans acheteur" : "Production restée en stock"} (${c.unites})`, (t) => qte(t.invendu)),
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
  accroche:
    "Le compte rendu des ventes du trimestre 3 est arrivé après la décision du trimestre 4 : le responsable de la production a repris son plan et son prix d'avant. Lire le trimestre rejoué par l'arène, chiffrer ce que le retard a coûté, et lui répondre.",
  objectifs: [
    "Lire l'écart entre une décision prise à jour et une décision prise en retard",
    "Chiffrer ce que le retard d'une information coûte au résultat",
    "Dire au responsable ce que le retard a produit",
  ],
  libre: false,
  entreprises: UNE_INFORMATION_A_TEMPS.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du responsable de la production",
      tableau: tableauDuTrimestre,
      texte: (c) => {
        const r = compteRendu(c);
        return [
          `« Le compte rendu des ventes du trimestre ${TRIMESTRE_DU_COMPTE_RENDU} m'est arrivé après la décision du trimestre ${TRIMESTRE_DECIDE}. J'ai donc repris « ${r.libellePlan} » et le prix du trimestre ${TRIMESTRE_DU_COMPTE_RENDU}. Combien ce retard nous a-t-il coûté, et qu'est-ce qui s'est passé ? »`,
          `Pas de cours cette fois. L'arène a rejoué le trimestre ${TRIMESTRE_DECIDE} chez ${c.entreprise} avec le plan et le prix repris, les mêmes concurrents et la même façon de gérer ; les trimestres d'avant ne changent pas.`,
        ];
      },
      repere: () => "À rendre : les écarts du trimestre, ce que le retard a coûté, et votre réponse.",
    },
    {
      id: "les-ecarts",
      type: "montants",
      titre: `Les écarts du trimestre ${TRIMESTRE_DECIDE}`,
      notions: ["capacity"],
      tableau: tableauDuTrimestre,
      question: () =>
        "D'après le tableau, calculez chaque écart, plan repris moins compte rendu à temps (négatif s'il baisse) : le plan, les ventes, puis la demande non servie.",
      champs: (c) => {
        const r = compteRendu(c);
        return [
          { libelle: `Écart de plan (${c.unites})`, attendu: r.ecartDePlan, calcul: `${qte(r.repris.plan)} − ${qte(r.aJour.plan)} = ${qte(r.ecartDePlan)}`, tolerance: 0 },
          { libelle: `Écart de ventes (${c.unites})`, attendu: r.ecartDeVentes, calcul: `${qte(r.repris.ventes)} − ${qte(r.aJour.ventes)} = ${qte(r.ecartDeVentes)}`, tolerance: 0 },
          {
            libelle: `Écart de demande non servie (${c.unites})`,
            attendu: r.repartisEnPlus,
            calcul: `${qte(r.repris.nonServie)} − ${qte(r.aJour.nonServie)} = ${qte(r.repartisEnPlus)}`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const r = compteRendu(c);
        return [
          `Le plan repris est fait pour la demande du trimestre ${TRIMESTRE_DU_COMPTE_RENDU}, pas pour celle du trimestre ${TRIMESTRE_DECIDE} : ${qte(r.repris.plan)} ${c.unites}, au lieu des ${qte(r.aJour.plan)} que le compte rendu à temps aurait fait prévoir.${prixRepris(r)}`,
        ];
      },
    },
    {
      id: "le-cout",
      type: "montants",
      titre: "Ce que le retard a coûté",
      notions: ["income_statement"],
      tableau: tableauDuTrimestre,
      question: (c) => {
        const r = compteRendu(c);
        return `Calculez le résultat de l'activité perdu au trimestre ${TRIMESTRE_DECIDE} (compte rendu à temps moins plan repris), puis ce qu'il représente du résultat de l'année avec le compte rendu à temps, ${eur(r.resultatDeLAnnee)} (en %, au dixième).`;
      },
      champs: (c) => {
        const r = compteRendu(c);
        return [
          {
            libelle: "Résultat perdu au trimestre",
            attendu: r.coutDuRetard,
            calcul: `${eur(r.aJour.resultat)} − ${retranche(r.repris.resultat)} = ${eur(r.coutDuRetard)}`,
            tolerance: 1,
          },
          {
            libelle: "Part du résultat de l'année (%)",
            attendu: r.partDuResultat,
            calcul: `${eur(r.coutDuRetard)} ÷ ${eur(r.resultatDeLAnnee)} × 100 = ${pct(r.partDuResultat)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = compteRendu(c);
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
        const r = compteRendu(c);
        const invendu =
          r.aJour.invendu > 0 || r.repris.invendu > 0
            ? `, ${r.perissable ? "l'offre restée sans acheteur" : "la production restée en stock"} de ${qte(r.aJour.invendu)} à ${qte(r.repris.invendu)}`
            : "";
        const faits = `au trimestre ${TRIMESTRE_DECIDE}, le plan repris vaut ${qte(r.repris.plan)} ${c.unites} au lieu de ${qte(r.aJour.plan)} ; la demande non servie passe de ${qte(r.aJour.nonServie)} à ${qte(r.repris.nonServie)}${invendu}, et le résultat ${r.coutDuRetard >= 0 ? `perd ${eur(r.coutDuRetard)}` : `gagne ${eur(-r.coutDuRetard)}`}.${prixRepris(r)}`;
        return [
          {
            texte: "Des clients sont repartis sans être servis",
            juste: r.verdict === "clients-repartis",
            retour: r.verdict === "clients-repartis" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: "Une partie de l'offre est restée sans acheteur",
            juste: r.verdict === "offre-invendue",
            retour: r.verdict === "offre-invendue" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
          {
            texte: `Rien : le trimestre ${TRIMESTRE_DECIDE} a rapporté autant qu'avec le compte rendu à temps`,
            juste: r.verdict === "rien",
            retour: r.verdict === "rien" ? `Oui : ${faits}` : `Non : ${faits}`,
          },
        ];
      },
    },
  ],
};
