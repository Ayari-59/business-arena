import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CLIENT QUI PAIE TARD » : ESCOMPTER CHAQUE TRIMESTRE (BTS GPME,
 * palier 2).
 *
 * La banque propose au dirigeant d'escompter ses créances clients à chaque trimestre, autant
 * qu'elle l'accepte : « vous aurez toujours de la trésorerie ». Il demande ce que cela coûterait
 * sur l'année, ce que cela changerait à la trésorerie, et s'il faut signer. L'élève refait les
 * calculs du chapitre (le montant escomptable, le coût de l'escompte) sur les quatre trimestres,
 * puis lit ce que l'arène en fait et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre mobilise les créances une fois, à la clôture ;
 * le cas les mobilise tout au long de l'année, et pose la question de l'habitude plutôt que du
 * coup de pouce. L'année rejouée l'est avec l'escompte demandé à chaque trimestre
 * (`treasury.discount`), le moteur l'arrêtant au plafond du scénario
 * (`treasury.discountMaxShare` des créances du trimestre).
 */

/**
 * Ce que le dirigeant demande à la banque d'escompter chaque trimestre : tout ce qu'elle accepte.
 * La demande n'a pas de limite ; c'est la banque qui plafonne, à sa part du poste clients.
 */
export const ESCOMPTE_DEMANDE = Number.MAX_SAFE_INTEGER;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);

export type Verdict = "evite-le-decouvert" | "inutile";

/** L'année escomptée trimestre après trimestre, à côté de l'année du cours. */
export function escompteChaqueTrimestre(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const outils = s.treasury!;
  const duree = s.roundDays;
  const ref = anneeDeReference(c.code);
  const annee = rejouerAvec(c.code, "escompte-chaque-trimestre", (_t, d) => ({ ...d, treasury: { ...d.treasury, discount: ESCOMPTE_DEMANDE } }));
  const trimestres = annee.map((r, i) => {
    const t = r.treasury;
    const nees = auCentime(r.balanceSheet.receivables + (t?.discounted ?? 0) + (t?.factored ?? 0) + (t?.forcedFactored ?? 0));
    return {
      numero: i + 1,
      creancesNees: nees,
      escompte: auCentime(outils.discountMaxShare * nees),
      escompteDuMoteur: t?.discounted ?? 0,
      tresorerieSans: Math.round(ref[i]!.functionalBalance.netTreasury),
      tresorerieAvec: Math.round(r.functionalBalance.netTreasury),
    };
  });
  const escompteDeLAnnee = auCentime(trimestres.reduce((t, x) => t + x.escompte, 0));
  const coutDeLAnnee = auCentime(escompteDeLAnnee * outils.discountAnnualRate * (duree / 360));
  const lire = (a: typeof ref) => ({
    chargesFinancieres: Math.round(surLAnnee(a, (r) => r.incomeStatement.interest)),
    cedeesDOffice: Math.round(surLAnnee(a, (r) => r.treasury?.forcedFactored ?? 0)),
    resultat: Math.round(surLAnnee(a, (r) => r.incomeStatement.netIncome)),
    tresorerie: Math.round(a.at(-1)!.functionalBalance.netTreasury),
    plusBasse: Math.round(Math.min(...a.map((r) => r.functionalBalance.netTreasury))),
  });
  const sans = lire(ref);
  const avec = lire(annee);
  const verdict: Verdict = sans.plusBasse < 0 ? "evite-le-decouvert" : "inutile";
  return {
    outils,
    duree,
    trimestres,
    escompteDeLAnnee,
    coutDeLAnnee,
    sans,
    avec,
    resultatPerdu: sans.resultat - avec.resultat,
    tresorerieGagnee: avec.tresorerie - sans.tresorerie,
    plusBasseRemontee: avec.plusBasse - sans.plusBasse,
    verdict,
  };
}

export const ESCOMPTER_CHAQUE_TRIMESTRE: Situation = {
  code: "escompter-chaque-trimestre",
  parcours: "gpme",
  palier: 2,
  blocs: [],
  reprend: ["le-client-qui-paie-tard"],
  commanditaire: "Le dirigeant",
  titre: "Escompter chaque trimestre",
  accroche:
    "La banque propose d'escompter les créances clients à chaque trimestre, autant qu'elle l'accepte. Ce que cela coûte sur l'année, ce que cela change à la trésorerie, et s'il faut signer.",
  objectifs: [
    "Calculer le montant escomptable de chaque trimestre",
    "Calculer le coût de l'escompte sur l'année",
    "Lire ce que l'escompte change au résultat et à la trésorerie",
    "Répondre au dirigeant, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la banque",
      texte: (c) => {
        const k = escompteChaqueTrimestre(c);
        return [
          `« La banque nous propose d'escompter nos créances clients chaque trimestre, autant qu'elle l'accepte : ${pct(k.outils.discountMaxShare * 100)} des créances au plus, à ${pct(k.outils.discountAnnualRate * 100)} par an. Elle dit que nous aurons toujours de la trésorerie. Combien cela coûterait-il sur l'année, qu'est-ce que cela changerait, et faut-il signer ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec l'escompte à chaque trimestre, tout le reste identique.",
        ];
      },
      tableau: (c) => {
        const k = escompteChaqueTrimestre(c);
        return {
          titre: `Les créances ${dE(c.entreprise)}, trimestre par trimestre`,
          colonnes: k.trimestres.map((t) => `${ordinal(t.numero)} trimestre`),
          lignes: [
            { libelle: "Créances clients nées du trimestre", valeurs: k.trimestres.map((t) => eur(t.creancesNees)) },
            { libelle: "Trésorerie nette en fin de trimestre, sans escompte", valeurs: k.trimestres.map((t) => eur(t.tresorerieSans)) },
          ],
        };
      },
      repere: () => "À rendre : ce que la banque escompterait sur l'année et ce que cela coûterait, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûterait l'escompte sur l'année",
      notions: ["receivables_financing"],
      question: (c) => {
        const k = escompteChaqueTrimestre(c);
        return `Calculez le total escompté sur l'année (à chaque trimestre, ${pct(k.outils.discountMaxShare * 100)} des créances nées du trimestre), puis ce que cet escompte coûterait (total × ${pct(k.outils.discountAnnualRate * 100)} × ${k.duree} ÷ 360 : chaque avance dure un trimestre).`;
      },
      champs: (c) => {
        const k = escompteChaqueTrimestre(c);
        return [
          {
            libelle: "Total escompté sur l'année",
            attendu: k.escompteDeLAnnee,
            calcul: `${pct(k.outils.discountMaxShare * 100)} × (${k.trimestres.map((t) => eur(t.creancesNees)).join(" + ")}) = ${eur(k.escompteDeLAnnee)}`,
            tolerance: 2,
          },
          {
            libelle: "Coût de l'escompte sur l'année",
            attendu: k.coutDeLAnnee,
            calcul: `${eur(k.escompteDeLAnnee)} × ${pct(k.outils.discountAnnualRate * 100)} × ${k.duree} ÷ 360 = ${eur(k.coutDeLAnnee)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = escompteChaqueTrimestre(c);
        return [
          `Chaque trimestre, la banque avance une part des créances du trimestre, et les clients la remboursent au trimestre suivant. Sur l'année, elle avancerait ${eur(k.escompteDeLAnnee)}, pour un coût de ${eur(k.coutDeLAnnee)}.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année escomptée",
      notions: ["receivables_financing", "net_treasury"],
      tableau: (c) => {
        const k = escompteChaqueTrimestre(c);
        const avecCessions = k.sans.cedeesDOffice + k.avec.cedeesDOffice > 0;
        return {
          titre: "L'année jouée, sans escompte et avec l'escompte à chaque trimestre",
          colonnes: ["Sans escompte", "Escompte à chaque trimestre"],
          lignes: [
            { libelle: "Charges financières de l'année", valeurs: [eur(k.sans.chargesFinancieres), eur(k.avec.chargesFinancieres)] },
            ...(avecCessions ? [{ libelle: "Créances cédées d'office par la banque", valeurs: [eur(k.sans.cedeesDOffice), eur(k.avec.cedeesDOffice)] }] : []),
            { libelle: "Résultat de l'exercice", valeurs: [eur(k.sans.resultat), eur(k.avec.resultat)] },
            { libelle: "Trésorerie nette de fin d'année", valeurs: [eur(k.sans.tresorerie), eur(k.avec.tresorerie)] },
            { libelle: "Trésorerie nette la plus basse, en fin de trimestre", valeurs: [eur(k.sans.plusBasse), eur(k.avec.plusBasse)] },
          ],
        };
      },
      question: () =>
        "Par rapport à l'année sans escompte, calculez le résultat perdu, la trésorerie de fin d'année gagnée, et de combien remonte la trésorerie la plus basse de l'année.",
      champs: (c) => {
        const k = escompteChaqueTrimestre(c);
        return [
          { libelle: "Résultat perdu", attendu: k.resultatPerdu, calcul: `${eur(k.sans.resultat)} − ${retranche(k.avec.resultat)} = ${eur(k.resultatPerdu)}`, tolerance: 1 },
          { libelle: "Trésorerie de fin d'année gagnée", attendu: k.tresorerieGagnee, calcul: `${eur(k.avec.tresorerie)} − ${retranche(k.sans.tresorerie)} = ${eur(k.tresorerieGagnee)}`, tolerance: 1 },
          { libelle: "Remontée de la trésorerie la plus basse", attendu: k.plusBasseRemontee, calcul: `${eur(k.avec.plusBasse)} − ${retranche(k.sans.plusBasse)} = ${eur(k.plusBasseRemontee)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = escompteChaqueTrimestre(c);
        const dernier = k.trimestres.at(-1)!;
        return [
          `La trésorerie de fin d'année monte surtout de ce que la banque a avancé au dernier trimestre (${eur(dernier.escompte)}) : les avances des trimestres d'avant ont été remboursées par les clients, et il n'en reste que le coût. Le résultat, lui, baisse de ${eur(k.resultatPerdu)}.`,
          ...(k.sans.cedeesDOffice > k.avec.cedeesDOffice
            ? [
                `Sans escompte, la banque cédait d'office ${eur(k.sans.cedeesDOffice - k.avec.cedeesDOffice)} de créances, faute de trésorerie : cet argent rentrait déjà, plus cher. C'est pourquoi la trésorerie de fin d'année gagne moins que la dernière avance.`,
              ]
            : []),
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["receivables_financing"],
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const k = escompteChaqueTrimestre(c);
        const perte = eur(k.resultatPerdu);
        return [
          {
            texte: "Signons, pour éviter le découvert, en sachant ce que cela coûte",
            juste: k.verdict === "evite-le-decouvert",
            retour:
              k.verdict === "evite-le-decouvert"
                ? `Oui : sans escompte, la trésorerie descend à ${eur(k.sans.plusBasse)} ; avec, la plus basse est de ${eur(k.avec.plusBasse)}. Le prix est de ${perte} de résultat sur l'année : c'est une assurance contre le découvert, pas un gain.`
                : `Non : la trésorerie n'a jamais été à découvert cette année (la plus basse : ${eur(k.sans.plusBasse)}). Il n'y avait rien à éviter.`,
          },
          {
            texte: "Ne signons pas : notre trésorerie n'en a pas besoin",
            juste: k.verdict === "inutile",
            retour:
              k.verdict === "inutile"
                ? `Oui : la trésorerie n'a jamais été à découvert cette année (la plus basse : ${eur(k.sans.plusBasse)}). L'escompte coûterait ${perte} de résultat pour avancer de l'argent dont l'entreprise n'a pas besoin.`
                : `Non : sans escompte, la trésorerie descend à ${eur(k.sans.plusBasse)}. L'escompte l'évite, pour ${perte} de résultat.`,
          },
          {
            texte: "Signons : la trésorerie de fin d'année monte, et c'est de l'argent gagné pour nous",
            juste: false,
            retour: `Non : la trésorerie monte de ${eur(k.tresorerieGagnee)}, mais le résultat baisse de ${perte}. L'escompte avance l'argent des clients, il ne le crée pas.`,
          },
        ];
      },
    },
  ],
};
