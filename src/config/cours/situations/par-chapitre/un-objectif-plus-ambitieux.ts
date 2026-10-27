import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_OBJECTIFS, TAUX_DE_CAPACITE_VISE, suiviDesObjectifs, type Verdict } from "../../chapitres/se-fixer-des-objectifs";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SE FIXER DES OBJECTIFS ET LES SUIVRE » : UN OBJECTIF PLUS
 * AMBITIEUX (Stratégie et management, palier 1).
 *
 * Pour l'année qui vient, le directeur commercial veut viser plus haut que l'objectif du
 * chapitre : une part plus grande de la capacité de production, chaque trimestre. Avant de
 * l'annoncer à l'équipe, il demande si cet objectif aurait été tenable sur les chiffres de
 * l'année écoulée : déjà atteint, atteignable à condition de servir tous les clients, ou hors
 * de portée de la demande. L'élève refait les calculs du chapitre (l'objectif tiré de la
 * capacité, l'objectif de l'année, la demande face à lui), puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre suit un objectif posé, le cas éprouve un
 * objectif proposé avant de le poser. Les chiffres sont ceux du chapitre (`suiviDesObjectifs`),
 * avec le taux du directeur.
 */

/**
 * La part de la capacité que le directeur commercial veut viser : 90 %. HYPOTHÈSE DU COURS :
 * presque le plein, l'objectif d'un directeur qui veut « faire mieux » sans avoir regardé la
 * demande. Il est au-dessus du taux du chapitre.
 */
export const TAUX_AMBITIEUX = 0.9;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** L'objectif proposé, éprouvé sur l'année du cours. */
export function objectifAmbitieux(c: Cas) {
  const o = suiviDesObjectifs(c, TAUX_AMBITIEUX);
  const actuel = suiviDesObjectifs(c);
  return {
    o,
    actuel,
    trimestresPossibles: o.trimestres.filter((x) => x.demande >= o.objectif).length,
    verdict: o.verdict as Verdict,
  };
}

export const UN_OBJECTIF_PLUS_AMBITIEUX: Situation = {
  code: "un-objectif-plus-ambitieux",
  parcours: "strategie",
  palier: 1,
  blocs: [],
  reprend: ["se-fixer-des-objectifs"],
  commanditaire: "Le directeur commercial",
  titre: "Un objectif plus ambitieux",
  accroche:
    "Le directeur commercial veut viser plus haut l'an prochain. Avant de l'annoncer, il demande si cet objectif aurait été tenable sur les chiffres de l'année écoulée.",
  objectifs: [
    "Chiffrer un objectif à partir de la capacité de production",
    "Comparer un objectif à la demande, trimestre après trimestre",
    "Dire si un objectif est réaliste avant de le poser",
    "Répondre au directeur commercial, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_OBJECTIFS,
    pourquoi: "ce cas éprouve un objectif de ventes, et chez VOLT FITNESS les ventes du trimestre comptent d'abord des abonnés gardés.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du directeur commercial",
      texte: (c) => {
        const k = objectifAmbitieux(c);
        return [
          `« Cette année, nous visions ${pct(TAUX_DE_CAPACITE_VISE * 100)} de notre capacité de production chaque trimestre. L'an prochain, je veux viser ${pct(TAUX_AMBITIEUX * 100)}. Avant de l'annoncer à l'équipe, dites-moi si cet objectif aurait été tenable sur les chiffres de cette année. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. La capacité de production retenue est de ${qte(k.o.capacite)} ${c.unites} par trimestre.`,
        ];
      },
      tableau: (c) => {
        const k = objectifAmbitieux(c);
        return {
          titre: `L'année écoulée, en ${c.unites}`,
          colonnes: k.o.trimestres.map((x) => `T${x.numero}`),
          lignes: [
            { libelle: "Demande adressée à l'entreprise", valeurs: k.o.trimestres.map((x) => qte(x.demande)) },
            { libelle: "Ventes réalisées", valeurs: k.o.trimestres.map((x) => qte(x.ventes)) },
          ],
        };
      },
      repere: () => "À rendre : l'objectif proposé, par trimestre et sur l'année, ce que la demande permettait, et votre réponse.",
    },
    {
      id: "objectif",
      type: "montants",
      titre: "L'objectif proposé face à la demande",
      notions: ["capacity", "dashboard"],
      question: () =>
        "Calculez l'objectif proposé par trimestre (à l'unité), l'objectif de l'année, la demande adressée à l'entreprise sur l'année, puis le nombre de trimestres où la demande atteignait l'objectif.",
      champs: (c) => {
        const k = objectifAmbitieux(c);
        const o = k.o;
        return [
          { libelle: "Objectif proposé par trimestre", attendu: o.objectif, calcul: `${qte(o.capacite)} × ${TAUX_AMBITIEUX.toLocaleString("fr-FR")} = ${qte(o.objectif)}`, tolerance: 1 },
          { libelle: "Objectif proposé pour l'année", attendu: o.objectifDeLAnnee, calcul: `${qte(o.objectif)} × ${o.trimestres.length} = ${qte(o.objectifDeLAnnee)}`, tolerance: 4 },
          {
            libelle: "Demande adressée sur l'année",
            attendu: o.demandeDeLAnnee,
            calcul: `${o.trimestres.map((x) => qte(x.demande)).join(" + ")} = ${qte(o.demandeDeLAnnee)}`,
            tolerance: 0,
          },
          {
            libelle: "Trimestres où la demande atteignait l'objectif",
            attendu: k.trimestresPossibles,
            calcul: `${k.trimestresPossibles} sur ${o.trimestres.length} : ${
              o.trimestres
                .filter((x) => x.demande >= o.objectif)
                .map((x) => `T${x.numero}`)
                .join(", ") || "aucun"
            }`,
            tolerance: 0,
          },
        ];
      },
      explication: (c) => {
        const k = objectifAmbitieux(c);
        const o = k.o;
        return [
          o.demandeDeLAnnee >= o.objectifDeLAnnee
            ? `Sur l'année, les clients ont demandé ${qte(o.demandeDeLAnnee)} ${c.unites}, pour un objectif proposé de ${qte(o.objectifDeLAnnee)} : la demande suffisait, à condition de la servir.`
            : `Sur l'année, les clients n'ont demandé que ${qte(o.demandeDeLAnnee)} ${c.unites}, pour un objectif proposé de ${qte(o.objectifDeLAnnee)} : même en les servant tous, l'entreprise n'y arrivait pas.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      notions: ["dashboard"],
      question: () => "Quelle phrase envoyez-vous au directeur commercial ?",
      options: (c) => {
        const k = objectifAmbitieux(c);
        const o = k.o;
        const chiffres = `${qte(o.ventesDeLAnnee)} ${c.unites} ${accordPluriel(c, "vendu")} et ${qte(o.demandeDeLAnnee)} ${accordPluriel(c, "demandé")} cette année, pour un objectif proposé de ${qte(o.objectifDeLAnnee)}`;
        return [
          {
            texte: "Déjà atteint : les ventes de cette année y arrivent",
            juste: k.verdict === "tenu",
            retour: k.verdict === "tenu" ? `Oui : ${chiffres}. L'objectif proposé est déjà tenu.` : `Non : ${chiffres}. Les ventes de cette année restent en dessous.`,
          },
          {
            texte: "Tenable, à condition de produire assez pour servir tous les clients",
            juste: k.verdict === "a-revoir",
            retour:
              k.verdict === "a-revoir"
                ? `Oui : ${chiffres}. La demande permettait l'objectif, mais l'entreprise n'a pas servi tous ses clients. L'objectif est réaliste si la production suit : c'est elle qu'il faut prévoir en même temps.`
                : k.verdict === "tenu"
                  ? `Non : ${chiffres}. Les ventes de cette année l'atteignent déjà.`
                  : `Non : ${chiffres}. Même en servant tous ses clients, l'entreprise n'y arrivait pas.`,
          },
          {
            texte: "Hors de portée : la demande de cette année n'y suffisait pas",
            juste: k.verdict === "mal-pose",
            retour:
              k.verdict === "mal-pose"
                ? `Oui : ${chiffres}. Même en servant tous ses clients, l'entreprise n'atteignait pas l'objectif proposé. Il n'est pas réaliste sans attirer plus de clients : mal posé, il découragerait l'équipe.`
                : `Non : ${chiffres}. La demande de cette année suffisait à l'atteindre.`,
          },
          {
            texte: "Tenable à coup sûr : plus l'objectif est haut, plus l'équipe se dépasse pour l'atteindre",
            juste: false,
            retour: `Non : un objectif se juge sur les chiffres, pas sur l'envie : ${chiffres}.`,
          },
        ];
      },
    },
  ],
};
