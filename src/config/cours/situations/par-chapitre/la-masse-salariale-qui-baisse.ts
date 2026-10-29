import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { indicateursSociaux } from "../../chapitres/indicateurs-sociaux";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES, FICHE_RH } from "../../monde/ressources-humaines-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES INDICATEURS SOCIAUX » : LA MASSE SALARIALE QUI BAISSE (Bac STMG,
 * ressources humaines, palier 1).
 *
 * Le directeur financier lit le tableau de bord social de N + 1, celui du chapitre, et s'arrête sur
 * une ligne : la masse salariale est plus basse que prévu. Il veut la présenter comme une économie.
 * L'élève calcule la baisse et celle de l'effectif moyen, puis ce que le départ qui l'explique a
 * coûté (les ventes perdues, le recrutement), pour dire d'où vient la baisse.
 *
 * Le cas est neuf par sa question : le chapitre se méfie du chiffre d'affaires par salarié, le cas se
 * méfie de la masse salariale. Le tableau de bord est celui du chapitre (`indicateursSociaux`), dans
 * le monde du cours, sans rien y ajouter.
 *
 * CE QUI A CHANGÉ. Le cas lisait l'année de l'arène aux salaires baissés ; il se joue chez NOVA :
 * 5 325 € de salaires non versés, pour 27 300 € de marge perdue et 3 000 € de recrutement.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;

/** Le tableau de bord du chapitre, et ce que la masse salariale en dit. */
export function masseQuiBaisse(_c?: Cas) {
  const s = indicateursSociaux();
  const baisse = auCentieme(s.masseDuPlan - s.masse);
  return {
    s,
    baisse,
    evolutionDeLaMasse: auDixieme((s.masse / s.masseDuPlan - 1) * 100),
    effectifDuPlan: FICHE_RH.plan.operateurs,
    evolutionDeLEffectif: auDixieme((s.effectifMoyen / FICHE_RH.plan.operateurs - 1) * 100),
    marge: Math.round((s.margePerdue / s.ventesPerdues) * 100) / 100,
    /** Ce que le départ a coûté, une fois retirés les salaires qu'il n'a pas fallu verser. */
    coutNet: s.coutDuDepart,
  };
}

export const LA_MASSE_SALARIALE_QUI_BAISSE: Situation = {
  code: "la-masse-salariale-qui-baisse",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["indicateurs-sociaux"],
  commanditaire: "Le directeur financier",
  titre: "La masse salariale qui baisse",
  accroche: "Le directeur financier veut présenter la baisse de la masse salariale comme une économie. D'où vient-elle : de salariés qui coûtent moins, ou d'un salarié parti ?",
  objectifs: [
    "Calculer l'évolution de la masse salariale et celle de l'effectif",
    "Relier la baisse de la masse salariale à un départ",
    "Calculer ce qu'un départ coûte, salaires non versés déduits",
    "Répondre au directeur financier, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend le tableau de bord social de NOVA en N + 1, celui du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: () => {
        const k = masseQuiBaisse();
        return [
          `« Bonne nouvelle : la masse salariale de l'année est de ${eur(k.s.masse)}, quand nous avions prévu ${eur(k.s.masseDuPlan)}. Je voudrais la présenter aux associés comme une économie de gestion. Vérifiez mes chiffres, et dites-moi d'où vient cette baisse. » Le directeur financier`,
          "Pas de cours cette fois : vous avez le tableau de bord social du chapitre, et sa méthode.",
        ];
      },
      tableau: () => {
        const k = masseQuiBaisse();
        return {
          titre: "Le tableau de bord social de NOVA, N + 1",
          colonnes: ["Prévu", "Réalisé"],
          lignes: [
            { libelle: "Masse salariale de l'année", valeurs: [eur(k.s.masseDuPlan), eur(k.s.masse)] },
            { libelle: "Mois de salaire payés", valeurs: [qte(k.effectifDuPlan * 12), qte(k.s.moisPayes)] },
            { libelle: "Enceintes vendues", valeurs: [qte(k.s.trimestres.reduce((t, x) => t + x.ventesDuPlan, 0)), qte(k.s.trimestres.reduce((t, x) => t + x.ventes, 0))] },
            { libelle: "Départs et arrivées", valeurs: ["0", `${k.s.departs} et ${k.s.arrivees}`] },
            { libelle: "Coût du recrutement du remplaçant", valeurs: [eur(0), eur(k.s.recrutement)] },
          ],
        };
      },
      repere: () => "À rendre : la baisse de la masse salariale et son évolution, l'effectif moyen, ce que le départ a coûté, et votre réponse.",
    },
    {
      id: "la-baisse",
      type: "montants",
      titre: "La masse salariale et l'effectif",
      notions: ["payroll", "dashboard"],
      question: () => "Calculez la baisse de la masse salariale face au prévu, son évolution en pourcentage (au dixième), puis l'effectif moyen de l'année (mois de salaire payés ÷ 12, au centième).",
      champs: () => {
        const k = masseQuiBaisse();
        return [
          { libelle: "Baisse de la masse salariale", attendu: k.baisse, calcul: `${eur(k.s.masseDuPlan)} − ${eur(k.s.masse)} = ${eur(k.baisse)}`, tolerance: 1 },
          { libelle: "Évolution de la masse salariale (%)", attendu: k.evolutionDeLaMasse, calcul: `(${eur(k.s.masse)} − ${eur(k.s.masseDuPlan)}) ÷ ${eur(k.s.masseDuPlan)} × 100 = ${pct(k.evolutionDeLaMasse)}`, tolerance: 0.1 },
          { libelle: "Effectif moyen de l'année", attendu: k.s.effectifMoyenAuCentieme, calcul: `${qte(k.s.moisPayes)} ÷ 12 = ${qte(k.s.effectifMoyenAuCentieme)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const k = masseQuiBaisse();
        return [
          `La masse salariale baisse de ${pct(-k.evolutionDeLaMasse)}, exactement comme l'effectif moyen, passé de ${qte(k.effectifDuPlan)} à ${qte(k.s.effectifMoyenAuCentieme)}. Chaque salarié coûte toujours le même prix : la baisse vient des mois où un poste est resté vide.`,
        ];
      },
    },
    {
      id: "le-cout-du-depart",
      type: "montants",
      titre: "Ce que le départ a coûté",
      notions: ["payroll", "contribution_margin"],
      question: () => {
        const k = masseQuiBaisse();
        return `Le poste vide a fait perdre des ventes : chaque enceinte laisse ${eur(k.marge)} de marge. Calculez la marge perdue, puis ce que le départ a coûté à NOVA (marge perdue plus recrutement, moins la baisse de la masse salariale).`;
      },
      champs: () => {
        const k = masseQuiBaisse();
        return [
          { libelle: "Enceintes perdues", attendu: k.s.ventesPerdues, calcul: `${qte(k.s.trimestres.reduce((t, x) => t + x.ventesDuPlan, 0))} − ${qte(k.s.trimestres.reduce((t, x) => t + x.ventes, 0))} = ${qte(k.s.ventesPerdues)}`, tolerance: 0 },
          { libelle: "Marge perdue", attendu: k.s.margePerdue, calcul: `${qte(k.s.ventesPerdues)} × ${eur(k.marge)} = ${eur(k.s.margePerdue)}`, tolerance: 1 },
          { libelle: "Coût du départ", attendu: k.coutNet, calcul: `${eur(k.s.margePerdue)} + ${eur(k.s.recrutement)} − ${eur(k.baisse)} = ${eur(k.coutNet)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = masseQuiBaisse();
        return [`Les ${eur(k.baisse)} de salaires non versés ne compensent ni la marge perdue, ${eur(k.s.margePerdue)}, ni le recrutement : le départ a coûté ${eur(k.coutNet)} à NOVA.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Que répondez-vous au directeur financier ?",
      options: () => {
        const k = masseQuiBaisse();
        return [
          {
            texte: `Ce n'est pas une économie : le départ a coûté ${eur(k.coutNet)}`,
            juste: true,
            retour: `Oui : la masse salariale baisse de ${eur(k.baisse)} parce qu'un poste est resté vide, et ce poste vide a fait perdre ${eur(k.s.margePerdue)} de marge, sans compter ${eur(k.s.recrutement)} de recrutement. Un indicateur social se lit avec ce qui le fait bouger.`,
          },
          {
            texte: `C'est une économie de ${eur(k.baisse)} : les salaires ont été mieux tenus que prévu`,
            juste: false,
            retour: `Non : aucun salaire n'a baissé. La masse salariale baisse de ${pct(-k.evolutionDeLaMasse)} comme l'effectif moyen : un opérateur est parti, et son poste est resté vide.`,
          },
          {
            texte: "On ne peut rien dire : la masse salariale ne se compare qu'à celle de l'année précédente",
            juste: false,
            retour: "Non : elle se compare aussi à ce qui était prévu. Le tableau de bord dit d'où vient l'écart : un départ, des mois sans salaire, et des ventes perdues.",
          },
        ];
      },
    },
  ],
};
