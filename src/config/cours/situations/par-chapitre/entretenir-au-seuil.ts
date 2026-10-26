import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { RETABLISSEMENT_PAR_ENTRETIEN } from "../../../../engine/production";
import { soldUnits } from "../../../../engine/simulation/runGame";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { ENTRETENIR_L_OUTIL, entretienDeLOutil, sensibiliteDesRebuts } from "../../chapitres/entretenir-l-outil";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CAS PRATIQUE DU CHAPITRE « ENTRETENIR L'OUTIL » : ENTRETENIR AU SEUIL (BTS GPME, palier 3).
 *
 * Le chapitre a montré qu'un trimestre sans entretien se paie ensuite, et qu'il existe un budget
 * sous lequel l'outil s'use. Le gérant en tire une idée : entretenir juste à ce seuil, toute
 * l'année, au lieu du budget de référence. L'élève calcule le budget au seuil et ce qu'il fait
 * économiser, puis lit ce que l'arène en fait.
 *
 * Le cas est neuf par sa question : le chapitre saute l'entretien d'un trimestre, le cas le réduit
 * chaque trimestre sans descendre sous le seuil. Le seuil est celui du chapitre
 * (`entretienDeLOutil`, `seuilDEntretien` du moteur) ; l'année au seuil est l'année du cours
 * rejouée (`rejouerAvec`), le budget d'entretien au seuil à chaque trimestre.
 */

/**
 * Le budget au seuil se pose à l'euro supérieur : juste au seuil, la disponibilité ne bouge
 * plus ; un euro au-dessus, elle ne peut que remonter, et l'outil déjà à 100 % y reste.
 */
export const budgetAuSeuil = (c: Cas) => Math.ceil(entretienDeLOutil(c).seuil);

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "l-economie-passe-entiere" | "les-rebuts-en-reprennent" | "l-outil-s-use";

/** L'année au seuil : le budget, l'économie, et ce que l'arène en fait. */
export function entretienAuSeuil(c: Cas) {
  const e = entretienDeLOutil(c);
  const budget = budgetAuSeuil(c);
  const reference = anneeDeReference(c.code);
  const auSeuil = rejouerAvec(c.code, "entretenir-l-outil:au-seuil-toute-l-annee", (_t, d) => ({ ...d, maintenanceBudget: budget }));
  const trimestres = auSeuil.length;
  const economieParTrimestre = auCentime(e.budget - budget);
  const economieDeLAnnee = auCentime(economieParTrimestre * trimestres);
  const capacites = auSeuil.map((r) => Math.round(r.production.machineCapacity));
  const capacitesAvec = reference.map((r) => Math.round(r.production.machineCapacity));
  const capacitePerdue = Math.max(...capacitesAvec.map((x, i) => x - capacites[i]!));
  const venduesAvant = Math.round(surLAnnee(reference, soldUnits));
  const venduesApres = Math.round(surLAnnee(auSeuil, soldUnits));
  const resultatAvant = Math.round(surLAnnee(reference, (r) => r.incomeStatement.operatingIncome));
  const resultatApres = Math.round(surLAnnee(auSeuil, (r) => r.incomeStatement.operatingIncome));
  const ecartDeResultat = resultatApres - resultatAvant;
  const verdict: Verdict =
    ecartDeResultat <= 0 ? "l-outil-s-use" : Math.abs(ecartDeResultat - economieDeLAnnee) <= 1 ? "l-economie-passe-entiere" : "les-rebuts-en-reprennent";
  return {
    e,
    budget,
    trimestres,
    economieParTrimestre,
    economieDeLAnnee,
    capacitePlusBasse: Math.min(...capacites),
    capacitePlusBasseAvec: Math.min(...capacitesAvec),
    capacitePerdue,
    venduesAvant,
    venduesApres,
    resultatAvant,
    resultatApres,
    ecartDeResultat,
    reprisParLesRebuts: auCentime(economieDeLAnnee - ecartDeResultat),
    sensibilite: sensibiliteDesRebuts(c.code),
    // Les rebuts se comptent sur la référence du métier, sans l'exigence du parc (src/engine/production).
    referenceDesRebuts: scenarioByCode(c.code).scenario.production.maintenanceReference,
    verdict,
  };
}

export const ENTRETENIR_AU_SEUIL: Situation = {
  code: "entretenir-au-seuil",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: [ENTRETENIR_L_OUTIL.code],
  commanditaire: "Le gérant",
  titre: "Entretenir au seuil",
  accroche:
    "Le gérant veut entretenir l'outil juste au seuil sous lequel il s'use, toute l'année, au lieu du budget de référence. Le budget au seuil, ce qu'il fait économiser, et ce que l'arène en fait.",
  objectifs: [
    "Calculer le budget d'entretien sous lequel l'outil s'use",
    "Calculer l'économie d'un entretien au seuil sur l'année",
    "Vérifier dans l'année rejouée ce que l'outil et le résultat deviennent",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: (c) => [
        `« Nous dépensons le budget de référence chaque trimestre pour entretenir l'outil. Mais si j'ai bien compris, l'outil ne s'use que sous un certain budget. Pourquoi ${c.entreprise} paierait-elle davantage ? Je propose d'entretenir juste à ce seuil, arrondi à l'euro supérieur, toute l'année. Dites-moi ce que nous économiserions, et si l'outil le supporte. »`,
        "Pas de cours cette fois : vous avez les chiffres de l'outil, et le calcul du seuil est celui du chapitre. L'arène a rejoué l'année avec l'entretien au seuil, chaque trimestre.",
      ],
      tableau: (c) => {
        const s = entretienAuSeuil(c);
        return {
          titre: `L'outil ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget d'entretien d'un trimestre (référence du parc)", valeurs: [eur(s.e.budget)] },
            { libelle: "Disponibilité perdue en un trimestre sans entretien", valeurs: [`${s.e.perte.toLocaleString("fr-FR")} %`] },
            { libelle: "Disponibilité regagnée en un trimestre au budget de référence", valeurs: [`${s.e.regain.toLocaleString("fr-FR")} %`] },
            { libelle: "Trimestres de l'année", valeurs: [String(s.trimestres)] },
          ],
        };
      },
      repere: () => "À rendre : le budget au seuil, l'économie de l'année, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "economie",
      type: "montants",
      titre: "Ce que le seuil fait économiser",
      notions: ["capacity", "fixed_costs"],
      question: () =>
        "Calculez le budget d'entretien au seuil (le budget où ce que l'entretien répare égale ce que l'outil perd, arrondi à l'euro supérieur), puis ce qu'il économise par trimestre par rapport à la référence, et sur l'année.",
      champs: (c) => {
        const s = entretienAuSeuil(c);
        return [
          { libelle: "Budget au seuil, à l'euro supérieur", attendu: s.budget, tolerance: 1, calcul: `${eur(s.e.budget)} ÷ ${(1 + RETABLISSEMENT_PAR_ENTRETIEN).toLocaleString("fr-FR")} = ${eur(s.e.seuil)}, soit ${eur(s.budget)}` },
          { libelle: "Économie par trimestre", attendu: s.economieParTrimestre, tolerance: 1, calcul: `${eur(s.e.budget)} − ${eur(s.budget)} = ${eur(s.economieParTrimestre)}` },
          { libelle: "Économie sur l'année", attendu: s.economieDeLAnnee, tolerance: 1, calcul: `${eur(s.economieParTrimestre)} × ${s.trimestres} = ${eur(s.economieDeLAnnee)}` },
        ];
      },
      explication: (c) => {
        const s = entretienAuSeuil(c);
        return [
          `Au seuil, ${c.entreprise} économiserait ${eur(s.economieDeLAnnee)} sur l'année. À ce budget, l'entretien répare exactement ce que l'outil perd : sa disponibilité ne baisse pas.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année au seuil",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const s = entretienAuSeuil(c);
        return {
          titre: "L'année jouée, entretien à la référence et entretien au seuil",
          colonnes: ["À la référence", "Au seuil"],
          lignes: [
            { libelle: `Capacité de l'outil au plus bas de l'année (${c.unites})`, valeurs: [qte(s.capacitePlusBasseAvec), qte(s.capacitePlusBasse)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(s.venduesAvant), qte(s.venduesApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(s.resultatAvant), eur(s.resultatApres)] },
          ],
        };
      },
      question: (c) =>
        `D'après le tableau, calculez la capacité de l'outil perdue au plus bas de l'année (en ${c.unites}), puis l'écart de résultat de l'activité entre l'entretien au seuil et l'entretien à la référence.`,
      champs: (c) => {
        const s = entretienAuSeuil(c);
        return [
          {
            libelle: `Capacité perdue au plus bas (${c.unites})`,
            attendu: s.capacitePlusBasseAvec - s.capacitePlusBasse,
            tolerance: 1,
            calcul: `${qte(s.capacitePlusBasseAvec)} − ${qte(s.capacitePlusBasse)} = ${qte(s.capacitePlusBasseAvec - s.capacitePlusBasse)}`,
          },
          {
            libelle: "Écart de résultat sur l'année",
            attendu: s.ecartDeResultat,
            tolerance: 1,
            calcul: `${eur(s.resultatApres)} − ${retranche(s.resultatAvant)} = ${eur(s.ecartDeResultat)}`,
          },
        ];
      },
      explication: (c) => {
        const s = entretienAuSeuil(c);
        return [
          s.verdict === "l-economie-passe-entiere"
            ? `L'outil garde toute sa capacité, les ventes ne bougent pas, et le résultat monte de ${eur(s.ecartDeResultat)} : l'économie de l'entretien passe entière au résultat.`
            : s.verdict === "les-rebuts-en-reprennent"
              ? `L'outil garde toute sa capacité, mais le résultat ne monte que de ${eur(s.ecartDeResultat)}, pour ${eur(s.economieDeLAnnee)} économisés : chez ${c.entreprise}, un entretien sous ${eur(s.referenceDesRebuts)}, la référence du métier, fait monter les rebuts, et ils reprennent ${eur(s.reprisParLesRebuts)} de l'économie.`
              : `Le résultat baisse de ${eur(-s.ecartDeResultat)} : au seuil, l'économie ne tient pas.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const s = entretienAuSeuil(c);
        return [
          {
            texte: "D'accord : au seuil, l'outil tient, et l'économie passe au résultat",
            juste: s.verdict === "l-economie-passe-entiere",
            retour:
              s.verdict === "l-economie-passe-entiere"
                ? `Oui : dans l'arène, l'outil reste à 100 % toute l'année, et le résultat monte de ${eur(s.ecartDeResultat)}. Le seuil laisse peu de marge : un trimestre en dessous, et l'outil recommence à s'user.`
                : s.verdict === "les-rebuts-en-reprennent"
                  ? `Pas tout à fait : l'outil tient, mais les rebuts montent sous ${eur(s.referenceDesRebuts)}, la référence du métier, et ils reprennent ${eur(s.reprisParLesRebuts)} des ${eur(s.economieDeLAnnee)} économisés.`
                  : `Non : le résultat baisse de ${eur(-s.ecartDeResultat)}.`,
          },
          {
            texte: "D'accord, mais les rebuts reprendront une part de l'économie",
            juste: s.verdict === "les-rebuts-en-reprennent",
            retour:
              s.verdict === "les-rebuts-en-reprennent"
                ? `Oui : l'outil reste à 100 %, et le résultat monte de ${eur(s.ecartDeResultat)}. Mais chez ${c.entreprise}, les rebuts montent dès que l'entretien passe sous ${eur(s.referenceDesRebuts)}, la référence du métier, bien au-dessus du seuil : ils reprennent ${eur(s.reprisParLesRebuts)} de l'économie.`
                : s.sensibilite > 0
                  ? `Non : ici, l'économie passe au résultat, à ${eur(s.economieDeLAnnee - s.ecartDeResultat)} près.`
                  : `Non : chez ${c.entreprise}, l'arène ne fait pas jouer l'entretien sur les rebuts, et l'économie passe entière au résultat.`,
          },
          {
            texte: "Refusons : sous la référence, l'outil s'use dès le trimestre suivant",
            juste: s.verdict === "l-outil-s-use",
            retour:
              s.verdict === "l-outil-s-use"
                ? `Oui : le résultat baisse de ${eur(-s.ecartDeResultat)}.`
                : `Non : l'outil ne s'use que sous le seuil, pas sous la référence. Au seuil, sa capacité au plus bas reste de ${qte(s.capacitePlusBasse)} ${c.unites}, comme à la référence.`,
          },
        ];
      },
    },
  ],
};
