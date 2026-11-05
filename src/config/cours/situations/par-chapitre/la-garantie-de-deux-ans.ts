import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_DOSSIER } from "../../chapitres/le-dossier-de-revision";
import { ESTIMATIONS_DU_DOSSIER, dossierDeRevision, garantie } from "../../monde/dossier-de-revision";
import { TAUX_NORMAL } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE DOSSIER DE RÉVISION » : LA GARANTIE DE DEUX ANS (comptabilité
 * générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le dossier de révision de N+1
 * (monde/dossier-de-revision.ts), sa provision pour garantie et l'impôt de N+1.
 *
 * HYPOTHÈSE DU CAS (PART_A_VENIR_AVEC_DEUX_ANS) : la présidente a vendu toute l'année N+1 avec une
 * garantie de deux ans. Les défauts livrés de l'année sont les mêmes ; mais au 31 décembre, les trois
 * quarts de leurs retours sont encore à venir, au lieu de la moitié. L'élève refait la provision, en
 * mesure l'effet sur le résultat révisé et sur l'impôt, et répond.
 */

/** La part des retours encore à venir au 31 décembre, avec une garantie de deux ans (hypothèse du cas). */
export const PART_A_VENIR_AVEC_DEUX_ANS = 0.75;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres du cas : le dossier avec la garantie d'un an, puis de deux. */
export function garantieDeDeuxAns(_c: Pick<Cas, "code">) {
  const un = garantie();
  const deux = garantie(PART_A_VENIR_AVEC_DEUX_ANS);
  const avant = dossierDeRevision();
  const apres = dossierDeRevision({ ...ESTIMATIONS_DU_DOSSIER, partDesRetoursAVenir: PART_A_VENIR_AVEC_DEUX_ANS });
  return { un, deux, avant, apres, complement: auCentime(deux.provision - un.provision), impotEnMoins: auCentime(avant.impot - apres.impot) };
}

export const LA_GARANTIE_DE_DEUX_ANS: Situation = {
  code: "la-garantie-de-deux-ans",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-dossier-de-revision"],
  commanditaire: "La présidente",
  titre: "La garantie de deux ans",
  accroche: "Les enceintes de N+1 ont été vendues avec une garantie de deux ans. Que devient la provision du dossier, et combien cela coûte-t-il vraiment cette année ?",
  objectifs: [
    "Reprendre une provision pour garantie avec une estimation nouvelle",
    "Mesurer l'effet d'une provision sur le résultat révisé et sur l'impôt",
    "Distinguer le coût réel d'une garantie de sa provision, et rendre une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DOSSIER,
    pourquoi: "ce cas reprend le chapitre « Le dossier de révision », qui se joue à la clôture de N+1 de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la présidente",
      texte: (c) => {
        const x = garantieDeDeuxAns(c);
        return [
          `« Nous avons vendu toute l'année avec une garantie de deux ans, pas d'un an. Le cabinet a provisionné ${eur(x.un.provision)}. Faut-il changer la provision, et que va me coûter cette garantie cette année ? »`,
          "Pas de cours cette fois : vous avez le dossier de révision, tel que le chapitre l'a mis à jour.",
        ];
      },
      tableau: (c) => {
        const x = garantieDeDeuxAns(c);
        return {
          titre: "Le dossier de révision de N+1, garantie d'un an",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Défauts livrés aux clients dans l'année", valeurs: [qte(x.un.defautsLivres)] },
            { libelle: "Coût d'un retour sous garantie", valeurs: [eur(x.un.coutDUnRetour)] },
            { libelle: "Retours à venir au 31 décembre, garantie d'un an", valeurs: [pct(x.un.part)] },
            { libelle: "Retours à venir au 31 décembre, garantie de deux ans", valeurs: [pct(x.deux.part)] },
            { libelle: "Provision pour garantie du dossier", valeurs: [eur(x.un.provision)] },
            { libelle: "Résultat avant impôt révisé", valeurs: [eur(x.avant.resultatRevise)] },
            { libelle: "Impôt sur les sociétés de N+1", valeurs: [eur(x.avant.impot)] },
          ],
        };
      },
      repere: () => "À rendre : la provision avec deux ans de garantie, son effet sur le résultat et l'impôt, et votre réponse.",
    },
    {
      id: "la-provision",
      type: "montants",
      titre: "La provision avec deux ans",
      notions: ["income_statement"],
      question: () => "Calculez les retours encore à venir avec une garantie de deux ans, la provision qui les couvre, puis le complément à doter par rapport au dossier.",
      champs: (c) => {
        const x = garantieDeDeuxAns(c);
        return [
          { libelle: "Retours encore à venir", attendu: x.deux.retoursAVenir, calcul: `${qte(x.deux.defautsLivres)} × ${pct(x.deux.part)} = ${qte(x.deux.retoursAVenir)}` },
          { libelle: "Provision pour garantie", attendu: x.deux.provision, calcul: `${qte(x.deux.retoursAVenir)} × ${eur(x.deux.coutDUnRetour)} = ${eur(x.deux.provision)}` },
          { libelle: "Complément à doter", attendu: x.complement, calcul: `${eur(x.deux.provision)} − ${eur(x.un.provision)} = ${eur(x.complement)}` },
        ];
      },
      explication: (c) => {
        const x = garantieDeDeuxAns(c);
        return [`La provision suit l'engagement pris envers les clients : plus la garantie dure, plus de retours restent à venir à la clôture. Le complément, ${eur(x.complement)}, se dote au 6815, au crédit du 1512.`];
      },
    },
    {
      id: "l-effet",
      type: "montants",
      titre: "L'effet sur le résultat et l'impôt",
      notions: ["income_statement"],
      question: () => "Calculez le résultat avant impôt révisé avec la nouvelle provision, l'impôt de N+1 qui en découle (mêmes réintégrations, taux réduit), puis l'impôt en moins.",
      champs: (c) => {
        const x = garantieDeDeuxAns(c);
        return [
          { libelle: "Résultat avant impôt révisé", attendu: x.apres.resultatRevise, calcul: `${eur(x.avant.resultatRevise)} − ${eur(x.complement)} = ${eur(x.apres.resultatRevise)}` },
          { libelle: "Impôt de N+1", attendu: x.apres.impot, calcul: `sur un résultat fiscal de ${eur(x.apres.resultatFiscal)} : ${eur(x.apres.impot)}` },
          { libelle: "Impôt en moins", attendu: x.impotEnMoins, calcul: `${eur(x.avant.impot)} − ${eur(x.apres.impot)} = ${eur(x.impotEnMoins)}, ${pct(TAUX_NORMAL)} du complément` },
        ];
      },
      explication: (c) => {
        const x = garantieDeDeuxAns(c);
        return [`Le résultat net ne baisse que de ${eur(auCentime(x.complement - x.impotEnMoins))} : l'impôt prend sa part de la charge, au taux marginal.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la présidente",
      notions: ["income_statement"],
      question: (c) => {
        const x = garantieDeDeuxAns(c);
        return `La provision passe de ${eur(x.un.provision)} à ${eur(x.deux.provision)}. Que répondez-vous à la présidente ?`;
      },
      options: (c) => {
        const x = garantieDeDeuxAns(c);
        return [
          {
            texte: "Oui : la provision suit la garantie promise",
            juste: true,
            retour: `Oui. Le complément de ${eur(x.complement)} est dû à l'engagement pris : il baisse le résultat de cette année et l'impôt de ${eur(x.impotEnMoins)}. Le vrai coût, ce sont les retours, payés quand ils viendront ; la provision les rattache aux ventes qui les ont fait naître.`,
          },
          {
            texte: "Non : garder la provision d'un an, plus favorable au résultat qu'elle présentera aux associés",
            juste: false,
            retour: "Ce serait sous-évaluer un engagement connu : la prudence et l'image fidèle l'interdisent, et le dossier ne pourrait pas justifier l'estimation.",
          },
          {
            texte: `Oui, et la garantie de deux ans fait gagner ${eur(x.impotEnMoins)} à NOVA cette année`,
            juste: false,
            retour: "Non : la provision ne fait rien gagner. Elle avance une charge, et l'impôt avec elle ; la reprise rendra l'un et l'autre.",
          },
        ];
      },
    },
  ],
};
