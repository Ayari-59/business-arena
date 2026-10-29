import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { MOIS_DE_L_EXERCICE } from "../monde/exercice-de-nova";
import {
  ARRIVEES_POSSIBLES,
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  FICHE_RH,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  SEUIL_D_ALERTE_DE_L_ABSENTEISME,
  VENTES_PERDUES_ACCEPTEES,
  arriveeSousLeSeuil,
  indicateursDeNPlus1,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES INDICATEURS SOCIAUX (Bac STMG, ressources humaines, palier 1).
 *
 * Le tableau de bord social de l'année N + 1 de NOVA, celle où un opérateur démissionne et où son
 * remplaçant n'arrive que deux mois après son départ. L'effectif mois par mois et l'effectif moyen,
 * le taux de rotation, le taux d'absentéisme, puis un indicateur qui trompe : le chiffre d'affaires
 * par salarié, qui monte au trimestre où l'équipe fond. Le curseur cherche les heures d'absence que
 * le seuil d'alerte de la direction tolère ; le laboratoire, la date d'arrivée du remplaçant qui
 * garde les ventes perdues sous ce que la direction accepte.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le départ, le préavis, le recrutement,
 * l'intégration et les ventes que le poste vide fait perdre sont ceux du chapitre « Le départ d'un
 * salarié » du BTS GPME (capacite.ts, nova-capacite.ts), lus par monde/ressources-humaines-de-nova.ts.
 * Les heures d'absence, le seuil d'alerte de l'absentéisme et les ventes perdues acceptées sont des
 * hypothèses du cours, nommées là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'année que l'arène rejouait aux salaires baissés de 10 %,
 * sans absentéisme ; il lit l'année N + 1 de NOVA : 3,83 salariés en moyenne, 26,1 % de rotation,
 * 3,5 % d'absentéisme.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const mois = (m: number) => MOIS_DE_L_EXERCICE[m - 1]!;
const MOIS_ABREGES = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."] as const;

/** Le tableau de bord social de N + 1 (le cas de la masse salariale le reprend). */
export function indicateursSociaux(_c?: Cas, arrivee?: number) {
  const s = indicateursDeNPlus1(arrivee);
  const [t1, t2] = s.trimestres;
  return {
    ...s,
    effectifMoyenAuCentieme: auCentieme(s.effectifMoyen),
    rotationPct: auDixieme(s.rotation * 100),
    absenteismePct: auDixieme(s.absenteisme * 100),
    t1: t1!,
    t2: t2!,
    caParSalarieT1: Math.round(t1!.caParSalarie),
    caParSalarieT2: Math.round(t2!.caParSalarie),
    evolutionDuCaParSalarie: auDixieme((t2!.caParSalarie / t1!.caParSalarie - 1) * 100),
    evolutionDesVentes: auDixieme((t2!.ventes / t1!.ventes - 1) * 100),
    dernierMois: FICHE_RH.personnel.moisDeLAnnonce + FICHE_RH.personnel.preavisEnMois - 1,
  };
}

export const INDICATEURS_SOCIAUX: Chapitre = {
  code: "indicateurs-sociaux",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
  ],
  titre: "Les indicateurs sociaux",
  accroche:
    "Le tableau de bord social d'une année où un salarié part : l'effectif, la rotation, l'absentéisme, et un indicateur qui peut tromper.",
  objectifs: [
    "Lire un tableau de bord social mois par mois",
    "Calculer l'effectif moyen et le taux de rotation du personnel",
    "Calculer le taux d'absentéisme",
    "Se méfier d'un indicateur qui monte quand l'équipe fond",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le tableau de bord social",
      notions: ["dashboard", "payroll"],
      texte: (c) => {
        const s = indicateursSociaux(c);
        return [
          `En N + 1, un opérateur ${dE(c.entreprise)} démissionne : payé sous le seuil du marché, il a trouvé mieux ailleurs. Il travaille jusqu'à la fin de ${mois(s.dernierMois)} ; le recrutement de son remplaçant commence en ${mois(s.debutDuRecrutement!)}, et le remplaçant arrive le 1er ${mois(s.arrivee!)}.`,
          "Le tableau de bord social suit l'équipe avec quelques chiffres : l'effectif, les départs et les arrivées, les absences, ce que coûte le personnel et ce qu'il fait vendre. Chacun se lit sur une période, et face à un repère.",
          "Ces chiffres se partagent : dès que l'effectif atteint 11 salariés pendant 12 mois de suite, l'entreprise organise l'élection d'un comité social et économique, qui porte auprès de la direction les questions des salariés sur l'emploi et les conditions de travail. Avec si peu de salariés, NOVA n'en a pas, mais rien ne l'empêche de les présenter à l'équipe.",
        ];
      },
      tableau: (c) => {
        const s = indicateursSociaux(c);
        return {
          titre: `L'effectif ${dE(c.entreprise)}, mois par mois, en N + 1`,
          colonnes: [...MOIS_ABREGES],
          lignes: [{ libelle: "Salariés payés", valeurs: s.effectifs.map((n) => String(n)) }],
        };
      },
      repere: () => "Effectif moyen = somme des effectifs de chaque mois ÷ 12. Taux de rotation = (départs + arrivées) ÷ 2 ÷ effectif moyen × 100.",
    },
    {
      id: "rotation",
      type: "montants",
      titre: "L'effectif moyen et la rotation",
      notions: ["dashboard"],
      question: (c) => {
        const s = indicateursSociaux(c);
        return `Calculez l'effectif moyen de l'année (au centième), puis le taux de rotation du personnel (${s.departs} départ et ${s.arrivees} arrivée, en pourcentage au dixième).`;
      },
      champs: (c) => {
        const s = indicateursSociaux(c);
        return [
          { libelle: "Effectif moyen de l'année", attendu: s.effectifMoyenAuCentieme, calcul: `${qte(s.moisPayes)} ÷ 12 = ${qte(s.effectifMoyenAuCentieme)}`, tolerance: 0.01 },
          { libelle: "Taux de rotation (%)", attendu: s.rotationPct, calcul: `(${s.departs} + ${s.arrivees}) ÷ 2 ÷ ${qte(s.effectifMoyenAuCentieme)} × 100 = ${pct(s.rotationPct)}`, tolerance: 0.2 },
        ];
      },
      explication: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Un départ et une arrivée dans une équipe de ${qte(s.effectifMoyenAuCentieme)} salariés en moyenne font un taux de rotation de ${pct(s.rotationPct)} : sur une petite équipe, un seul mouvement pèse lourd. Le taux se compare d'une année à l'autre, ou à celui des entreprises du même métier.`,
        ];
      },
    },
    {
      id: "absenteisme",
      type: "montants",
      titre: "Le taux d'absentéisme",
      notions: ["dashboard"],
      question: (c) => {
        const s = indicateursSociaux(c);
        return `Chaque salarié payé a ${qte(FICHE_RH.operateurs.heuresParMois)} heures de travail prévues par mois. Dans l'année, deux arrêts de maladie ont fait ${qte(s.heuresDAbsence)} heures d'absence. Calculez les heures de travail prévues de l'année (${qte(s.moisPayes)} mois de salaire payés), puis le taux d'absentéisme (absences ÷ heures prévues × 100, au dixième).`;
      },
      champs: (c) => {
        const s = indicateursSociaux(c);
        return [
          { libelle: "Heures de travail prévues", attendu: s.heuresPrevues, calcul: `${qte(s.moisPayes)} × ${qte(FICHE_RH.operateurs.heuresParMois)} = ${qte(s.heuresPrevues)}`, tolerance: 0 },
          { libelle: "Taux d'absentéisme (%)", attendu: s.absenteismePct, calcul: `${qte(s.heuresDAbsence)} ÷ ${qte(s.heuresPrevues)} × 100 = ${pct(s.absenteismePct)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Le taux d'absentéisme est de ${pct(s.absenteismePct)}, ${s.absenteisme > SEUIL_D_ALERTE_DE_L_ABSENTEISME ? "au-dessus" : "en dessous"} du seuil d'alerte de ${pct(SEUIL_D_ALERTE_DE_L_ABSENTEISME * 100)} que la direction s'est fixé. Un taux qui monte se lit avec la rotation : une équipe qui se fatigue s'absente, puis part.`,
        ];
      },
    },
    {
      id: "un-indicateur-qui-trompe",
      type: "choix",
      titre: "Un indicateur qui trompe",
      notions: ["dashboard", "productivity"],
      tableau: (c) => {
        const s = indicateursSociaux(c);
        return {
          titre: `Les deux premiers trimestres ${dE(c.entreprise)}`,
          colonnes: ["T1", "T2"],
          lignes: [
            { libelle: "Effectif moyen du trimestre", valeurs: [qte(auCentieme(s.t1.effectif)), qte(auCentieme(s.t2.effectif))] },
            { libelle: `Enceintes vendues`, valeurs: [qte(s.t1.ventes), qte(s.t2.ventes)] },
            { libelle: "Enceintes que le plan prévoyait", valeurs: [qte(s.t1.ventesDuPlan), qte(s.t2.ventesDuPlan)] },
            { libelle: "Chiffre d'affaires par salarié", valeurs: [eur(s.caParSalarieT1), eur(s.caParSalarieT2)] },
          ],
        };
      },
      question: (c) => {
        const s = indicateursSociaux(c);
        return `Au deuxième trimestre, le chiffre d'affaires par salarié ${dE(c.entreprise)} monte de ${pct(s.evolutionDuCaParSalarie)}. Le directeur y voit une équipe plus efficace. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const s = indicateursSociaux(c);
        const perdues = s.t2.ventesDuPlan - s.t2.ventes;
        return [
          {
            texte: "Il monte parce que l'équipe a fondu, pas parce qu'elle vend mieux",
            juste: true,
            retour: `Oui : le chiffre d'affaires se divise par moins de salariés. Au même moment, ${qte(perdues)} enceintes que le plan prévoyait ne sont pas sorties : chacun a travaillé autant, l'entreprise a vendu moins.`,
          },
          {
            texte: "Il a raison : chaque salarié a fait vendre davantage, c'est la preuve que l'équipe est plus efficace",
            juste: false,
            retour: `Non : un opérateur monte autant chaque mois. Le chiffre d'affaires par salarié monte parce que l'effectif baisse, et les ventes du trimestre restent ${qte(perdues)} enceintes sous le plan.`,
          },
          {
            texte: "Il se trompe : le chiffre d'affaires par salarié ne se calcule pas sur un trimestre, seulement sur l'année",
            juste: false,
            retour: "Non : il se calcule sur n'importe quelle période, tant que le chiffre d'affaires et l'effectif portent sur la même. C'est sa lecture qui trompe ici, pas son calcul.",
          },
        ];
      },
    },
    {
      id: "les-absences-tolerees",
      type: "curseur",
      titre: "Les absences sous le seuil d'alerte",
      notions: ["dashboard"],
      sens: "plus-grande",
      question: (c) => {
        const s = indicateursSociaux(c);
        return `La direction ${dE(c.entreprise)} s'alerte au-delà de ${pct(SEUIL_D_ALERTE_DE_L_ABSENTEISME * 100)} d'absentéisme. Faites varier les heures d'absence de l'année : une droite donne ${pct(SEUIL_D_ALERTE_DE_L_ABSENTEISME * 100)} des ${qte(s.heuresPrevues)} heures prévues, l'autre les heures d'absence. Placez le curseur sur le plus d'heures d'absence, à l'heure, qui reste sous le seuil.`;
      },
      grandeur: () => ({ libelle: "Heures d'absence de l'année", unite: "heures" }),
      cible: () => ({ attendu: indicateursSociaux().absencesMaximales, max: 500 }),
      zones: ["Sous le seuil d'alerte", "Au-delà du seuil d'alerte"],
      rates: () => ({ dessous: "Ces absences restent sous le seuil, mais un peu plus aussi : cherchez le plus d'heures.", dessus: "Ces absences dépassent le seuil d'alerte." }),
      montrer: "Montrer les heures",
      lecture: (_c, h) => {
        const s = indicateursSociaux();
        return [
          { libelle: "Taux d'absentéisme (%)", montant: auDixieme((h / s.heuresPrevues) * 100), fort: true },
          { libelle: "Seuil d'alerte (%)", montant: SEUIL_D_ALERTE_DE_L_ABSENTEISME * 100 },
        ];
      },
      droites: () => {
        const s = indicateursSociaux();
        return { produit: () => s.heuresPrevues * SEUIL_D_ALERTE_DE_L_ABSENTEISME, cout: (h) => h, libelles: ["Seuil d'alerte", "Heures d'absence"] };
      },
      explication: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Jusqu'à ${qte(s.absencesMaximales)} heures d'absence, l'absentéisme reste sous ${pct(SEUIL_D_ALERTE_DE_L_ABSENTEISME * 100)} ; ${s.heuresDAbsence > s.absencesMaximales ? `les ${qte(s.heuresDAbsence)} heures de l'année le dépassent de ${qte(s.heuresDAbsence - s.absencesMaximales)} heures.` : `les ${qte(s.heuresDAbsence)} heures de l'année restent dessous.`}`,
          "Sur une petite équipe, un seul arrêt de maladie fait franchir un seuil : un taux se lit avec les heures qui le font, et avec leurs raisons.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-remplacement",
      type: "simulation",
      titre: "Quand arrive le remplaçant",
      notions: ["dashboard", "capacity"],
      question: (c) =>
        `Le recrutement du remplaçant peut commencer dès l'annonce du départ, en ${mois(FICHE_RH.personnel.moisDeLAnnonce)}, ou plus tard. Faites varier le mois de son arrivée et regardez les indicateurs de l'année : les ventes perdues, l'effectif moyen, la rotation, le chiffre d'affaires par salarié. La direction accepte au plus ${qte(VENTES_PERDUES_ACCEPTEES)} ${c.unites} perdues.`,
      leviers: () => [{ code: "arrivee", libelle: "Mois d'arrivée du remplaçant", unite: "", ...ARRIVEES_POSSIBLES, depart: indicateursSociaux().arrivee! }],
      lecture: (_c, p) => {
        const s = indicateursSociaux(undefined, p.arrivee!);
        const d = indicateursSociaux();
        return [
          { libelle: "Enceintes perdues par le départ", montant: s.ventesPerdues, unite: "enceintes", reference: d.ventesPerdues, fort: true },
          { libelle: "Effectif moyen", montant: auCentieme(s.effectifMoyen), unite: "salariés", reference: auCentieme(d.effectifMoyen) },
          { libelle: "Taux de rotation", montant: auDixieme(s.rotation * 100), unite: "%" },
          { libelle: "Chiffre d'affaires par salarié", montant: Math.round(s.caParSalarie), reference: Math.round(d.caParSalarie) },
        ];
      },
      defi: () => {
        const juste = arriveeSousLeSeuil()!;
        return {
          consigne: `Trouvez le mois d'arrivée qui garde les ventes perdues sous ${qte(VENTES_PERDUES_ACCEPTEES)} enceintes.`,
          atteint: (p) => p.arrivee === juste,
          indice: (p) => `Avec une arrivée le 1er ${mois(p.arrivee!)}, le départ fait perdre ${qte(indicateursSociaux(undefined, p.arrivee!).ventesPerdues)} enceintes : c'est trop.`,
          solution: { arrivee: juste },
        };
      },
      explication: (c, p) => {
        const s = indicateursSociaux(c, p.arrivee!);
        const d = indicateursSociaux(c);
        return [
          `Défi relevé : en recrutant dès l'annonce, le remplaçant arrive le 1er ${mois(p.arrivee!)}, et le départ ne fait perdre que ${qte(s.ventesPerdues)} ${c.unites}, contre ${qte(d.ventesPerdues)} avec une arrivée le 1er ${mois(d.arrivee!)}.`,
          `Regardez le chiffre d'affaires par salarié : plus le remplaçant arrive tard, plus il monte en fin d'année, alors que les ventes perdues grandissent. Un indicateur social se lit toujours avec les ventes et l'effectif qui le font.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const s = indicateursSociaux(c);
        return [
          `Chez ${c.entreprise}, l'année N + 1 compte ${qte(s.effectifMoyenAuCentieme)} salariés en moyenne, un taux de rotation de ${pct(s.rotationPct)} et un absentéisme de ${pct(s.absenteismePct)}. Le départ fait perdre ${qte(s.ventesPerdues)} ${c.unites}, et le chiffre d'affaires par salarié monte au trimestre où l'équipe est la plus petite.`,
          "Un indicateur social ne se lit jamais seul : la masse salariale baisse et le chiffre d'affaires par salarié monte quand l'équipe fond. Ce qui compte, c'est ce qui les fait bouger.",
        ];
      },
      repere: () => "Taux d'absentéisme = heures d'absence ÷ heures de travail prévues × 100.",
    },
  ],
};
