import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { soldUnits } from "../../../../engine/simulation/runGame";
import type { Cas } from "../../cas";
import {
  ECART_SOUS_LE_MARCHE,
  LE_DEPART_D_UN_SALARIE,
  TRIMESTRE_DE_LA_BAISSE,
  TRIMESTRE_DU_RECRUTEMENT,
  departDUnSalarie,
} from "../../chapitres/le-depart-d-un-salarie";
import { rejouerAvec, surLAnnee } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CAS PRATIQUE DU CHAPITRE « LE DÉPART D'UN SALARIÉ ET SON REMPLACEMENT » : RECRUTER DÈS
 * L'ANNONCE DU DÉPART (BTS GPME, palier 3).
 *
 * Le chapitre a chiffré un départ remplacé au trimestre suivant : le poste reste vide un
 * trimestre. Cette fois, le salarié annonce son départ au trimestre où il démissionne, et la
 * gérante demande s'il faut recruter tout de suite, pour que le remplaçant arrive quand il part.
 * L'élève refait le coût complet du départ pour les deux dates, puis lit ce que l'arène en fait.
 *
 * Le cas est neuf par sa question : le chapitre chiffre un départ, le cas compare deux dates de
 * recrutement pour le même départ. Le départ remplacé au trimestre 2 est celui du chapitre
 * (`departDUnSalarie`) ; le recrutement dès l'annonce est la même année rejouée
 * (`rejouerAvec`), le remplaçant recruté au trimestre de la démission. Dans l'arène, il arrive
 * au trimestre suivant, celui où le salarié part : le poste n'est jamais vide.
 */

/** Le trimestre où la gérante propose de recruter : celui de l'annonce du départ. */
export const TRIMESTRE_DE_L_ANNONCE = TRIMESTRE_DE_LA_BAISSE;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "recruter-tot" | "attendre";

/** L'année rejouée, le remplaçant recruté dès l'annonce. */
export function anneeRemplaceeTot(code: string) {
  return rejouerAvec(code, "le-depart-d-un-salarie:remplace-des-l-annonce", (t, d) =>
    t === TRIMESTRE_DE_L_ANNONCE ? { ...d, hr: { ...d.hr, salaryIndex: 1 - ECART_SOUS_LE_MARCHE, hire: 1 } } : undefined,
  );
}

/** Les deux dates de recrutement : le coût du départ à chacune, et ce que l'arène en fait. */
export function remplacementAnticipe(c: Cas) {
  const r = departDUnSalarie(c);
  const tot = anneeRemplaceeTot(c.code);
  // Recruté dès l'annonce, le remplaçant arrive quand le salarié part : ni marge perdue, ni salaire non versé.
  const coutTot = r.recrutement;
  const gainDuRecrutementTot = r.coutDuDepart - coutTot;
  const venduesTot = Math.round(surLAnnee(tot, soldUnits));
  const resultatTot = Math.round(surLAnnee(tot, (x) => x.incomeStatement.operatingIncome));
  const ecartEntreLesDates = resultatTot - r.resultatApres;
  const verdict: Verdict = ecartEntreLesDates > 0 ? "recruter-tot" : "attendre";
  return {
    r,
    // L'effectif au trimestre où le salarié est parti : le remplaçant est déjà là.
    effectifAuDepart: tot[r.trimestreVide - 1]!.hr?.headcount ?? r.effectif,
    coutTot,
    gainDuRecrutementTot,
    venduesTot,
    resultatTot,
    ecartEntreLesDates,
    verdict,
  };
}

export const RECRUTER_DES_L_ANNONCE_DU_DEPART: Situation = {
  code: "recruter-des-l-annonce-du-depart",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: [LE_DEPART_D_UN_SALARIE.code],
  commanditaire: "La gérante",
  titre: "Recruter dès l'annonce du départ",
  accroche:
    "Un salarié annonce qu'il part à la fin du trimestre. La gérante se demande s'il faut recruter son remplaçant tout de suite, ou attendre son départ. Le coût du départ à chaque date, et ce que l'arène en fait.",
  objectifs: [
    "Calculer le coût complet d'un départ selon la date du recrutement",
    "Tenir compte du délai d'arrivée d'un remplaçant",
    "Comparer deux dates de recrutement dans l'année rejouée",
    "Répondre à la gérante, chiffre à l'appui",
  ],
  libre: false,
  entreprises: LE_DEPART_D_UN_SALARIE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: (c) => {
        const e = remplacementAnticipe(c);
        return [
          `« Un de nos salariés vient de m'annoncer qu'il part à la fin du trimestre ${TRIMESTRE_DE_L_ANNONCE}. Si nous attendons son départ pour recruter, au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, le poste restera vide un trimestre. Si ${c.entreprise} recrute dès maintenant, le remplaçant arrivera quand il partira, mais nous paierons son salaire dès son arrivée, au lieu d'économiser un salaire. Dites-moi ce que coûte le départ à chaque date, et ce que je dois faire. »`,
          `Pas de cours cette fois : les chiffres du départ sont ceux du chapitre, et l'arène a rejoué l'année avec les deux dates de recrutement. L'économie de salaire du trimestre ${TRIMESTRE_DE_L_ANNONCE}, ${eur(e.r.economie)}, est la même à chaque date.`,
        ];
      },
      tableau: (c) => {
        const e = remplacementAnticipe(c);
        return {
          titre: `Le départ ${dE(c.entreprise)}, selon la date du recrutement`,
          colonnes: [`Recruté au trimestre ${TRIMESTRE_DE_L_ANNONCE}`, `Recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}`],
          lignes: [
            { libelle: "Coût du recrutement", valeurs: [eur(e.r.recrutement), eur(e.r.recrutement)] },
            { libelle: "Trimestres où le poste est vide", valeurs: ["0", String(TRIMESTRE_DU_RECRUTEMENT + 1 - e.r.trimestreVide)] },
            { libelle: "Marge perdue pendant que le poste est vide", valeurs: [eur(0), eur(e.r.margePerdue)] },
            { libelle: "Salaire non versé pendant que le poste est vide", valeurs: [eur(0), eur(e.r.salaireNonVerse)] },
          ],
        };
      },
      repere: () => "À rendre : le coût du départ à chaque date, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Le coût du départ à chaque date",
      notions: ["staff_turnover", "payroll"],
      question: () =>
        `Calculez le coût complet du départ (marge perdue + recrutement − salaire non versé) pour un remplaçant recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, puis pour un remplaçant recruté dès l'annonce, au trimestre ${TRIMESTRE_DE_L_ANNONCE}. Calculez enfin ce que le recrutement dès l'annonce fait gagner (coût au trimestre ${TRIMESTRE_DU_RECRUTEMENT} moins coût au trimestre ${TRIMESTRE_DE_L_ANNONCE}).`,
      champs: (c) => {
        const e = remplacementAnticipe(c);
        return [
          {
            libelle: `Coût du départ, recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}`,
            attendu: e.r.coutDuDepart,
            tolerance: 1,
            calcul: `${eur(e.r.margePerdue)} + ${eur(e.r.recrutement)} − ${eur(e.r.salaireNonVerse)} = ${eur(e.r.coutDuDepart)}`,
          },
          {
            libelle: `Coût du départ, recruté au trimestre ${TRIMESTRE_DE_L_ANNONCE}`,
            attendu: e.coutTot,
            tolerance: 1,
            calcul: `${eur(0)} + ${eur(e.r.recrutement)} − ${eur(0)} = ${eur(e.coutTot)}`,
          },
          {
            libelle: "Gain du recrutement dès l'annonce",
            attendu: e.gainDuRecrutementTot,
            tolerance: 1,
            calcul: `${eur(e.r.coutDuDepart)} − ${eur(e.coutTot)} = ${eur(e.gainDuRecrutementTot)}`,
          },
        ];
      },
      explication: (c) => {
        const e = remplacementAnticipe(c);
        return [
          e.gainDuRecrutementTot > 0
            ? `Recruter dès l'annonce coûte le même recrutement, et le salaire du trimestre ${e.r.trimestreVide} est versé ; mais aucune vente ne se perd. La marge sauvée (${eur(e.r.margePerdue)}) vaut plus que le salaire versé (${eur(e.r.salaireNonVerse)}) : le départ coûte ${eur(e.gainDuRecrutementTot)} de moins.`
            : `Recruter dès l'annonce sauve ${eur(e.r.margePerdue)} de marge, mais le salaire du trimestre ${e.r.trimestreVide} (${eur(e.r.salaireNonVerse)}) est alors versé, et il pèse plus : le départ coûte ${eur(-e.gainDuRecrutementTot)} de plus.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue les deux dates",
      notions: ["capacity", "staff_turnover"],
      tableau: (c) => {
        const e = remplacementAnticipe(c);
        return {
          titre: "L'année jouée, sans départ et avec le départ à chaque date de recrutement",
          colonnes: ["Sans départ", `Recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}`, `Recruté au trimestre ${TRIMESTRE_DE_L_ANNONCE}`],
          lignes: [
            { libelle: `Effectif au trimestre ${e.r.trimestreVide}`, valeurs: [String(e.r.effectif), String(e.r.effectifVide), String(e.effectifAuDepart)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(e.r.venduesAnnee), qte(e.r.venduesAnneeApres), qte(e.venduesTot)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(e.r.resultatAvant), eur(e.r.resultatApres), eur(e.resultatTot)] },
          ],
        };
      },
      question: (c) =>
        `D'après le tableau, calculez les ventes perdues sur l'année avec le recrutement dès l'annonce (en ${c.unites}, par rapport à l'année sans départ), puis l'écart de résultat entre les deux dates (résultat avec le recrutement au trimestre ${TRIMESTRE_DE_L_ANNONCE} moins résultat avec le recrutement au trimestre ${TRIMESTRE_DU_RECRUTEMENT}).`,
      champs: (c) => {
        const e = remplacementAnticipe(c);
        return [
          {
            libelle: `Ventes perdues, recruté au trimestre ${TRIMESTRE_DE_L_ANNONCE} (${c.unites})`,
            attendu: e.r.venduesAnnee - e.venduesTot,
            tolerance: 1,
            calcul: `${qte(e.r.venduesAnnee)} − ${qte(e.venduesTot)} = ${qte(e.r.venduesAnnee - e.venduesTot)}`,
          },
          {
            libelle: "Écart de résultat entre les deux dates",
            attendu: e.ecartEntreLesDates,
            tolerance: 1,
            calcul: `${eur(e.resultatTot)} − ${retranche(e.r.resultatApres)} = ${eur(e.ecartEntreLesDates)}`,
          },
        ];
      },
      explication: (c) => {
        const e = remplacementAnticipe(c);
        return [
          `Recruté dès l'annonce, le remplaçant arrive au trimestre ${e.r.trimestreVide}, quand le salarié part : l'équipe reste à ${e.effectifAuDepart}, et ${c.entreprise} vend autant que sans départ. L'écart de résultat entre les deux dates, ${eur(e.ecartEntreLesDates)}, est celui que vous avez calculé : la marge sauvée moins le salaire versé.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const e = remplacementAnticipe(c);
        const tot = e.verdict === "recruter-tot";
        return [
          {
            texte: "Recrutons dès maintenant : le poste ne restera pas vide un trimestre",
            juste: tot,
            retour: tot
              ? `Oui : recruté dès l'annonce, le remplaçant arrive quand le salarié part. Le résultat de l'année est meilleur de ${eur(e.ecartEntreLesDates)} : la marge des ventes servies paie largement le salaire versé.`
              : `Non : le poste ne resterait pas vide, mais le salaire versé (${eur(e.r.salaireNonVerse)}) coûte plus que la marge sauvée (${eur(e.r.margePerdue)}). Le résultat de l'année serait moins bon de ${eur(-e.ecartEntreLesDates)}.`,
          },
          {
            texte: "Attendons son départ : le salaire économisé vaut plus que la marge",
            juste: !tot,
            retour: !tot
              ? `Oui, cette année : le salaire non versé (${eur(e.r.salaireNonVerse)}) pèse plus que la marge perdue (${eur(e.r.margePerdue)}), et le résultat est meilleur de ${eur(-e.ecartEntreLesDates)} en attendant. Mais ${c.entreprise} vend ${qte(e.r.ventesPerdues)} ${c.unites} de moins pendant le trimestre vide : des clients qui ne sont pas servis.`
              : `Non : en attendant, ${c.entreprise} perd ${eur(e.r.margePerdue)} de marge, plus que le salaire économisé (${eur(e.r.salaireNonVerse)}). Le résultat de l'année serait moins bon de ${eur(e.ecartEntreLesDates)}.`,
          },
          {
            texte: "La date ne change rien : le remplaçant arrive le jour où on le recrute",
            juste: false,
            retour: `Non : dans l'arène comme dans une PME, un remplaçant recruté n'arrive qu'au trimestre suivant. Recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, il laisse le poste vide tout le trimestre ${e.r.trimestreVide}.`,
          },
        ];
      },
    },
  ],
};
