import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { assortiment } from "../../chapitres/assortiment";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import { gammeDuMois } from "../../gamme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ASSORTIMENT : MARGE ET VOLUME » : RETIRER UNE RÉFÉRENCE ?
 * (BTS MCO, palier 4).
 *
 * La direction veut alléger l'offre en retirant la référence qui laisse le moins de marge.
 * Une partie de ses clients achèteraient autre chose dans la gamme. Elle demande ce que le
 * retrait ferait gagner ou perdre à la marge du mois. L'élève refait seul les calculs du
 * chapitre (la marge de chaque référence), puis chiffre le report des ventes sur les autres.
 *
 * Le cas est neuf par sa question : le chapitre répond qualitativement à « faut-il retirer
 * la dernière ? » ; ici, on chiffre la marge perdue et la marge récupérée par le report.
 * Le piège : compter le chiffre d'affaires de la référence, ou toute sa marge, comme perdus.
 * La gamme est celle du chapitre (`assortiment`, sur `gammeDuMois`).
 */

/**
 * Le taux de report : 30 % des ventes de la référence retirée se reportent sur les autres
 * références de la gamme. C'est l'hypothèse prudente qu'on retient pour une référence sans
 * équivalent direct dans l'offre : la plupart de ses clients vont la chercher ailleurs.
 */
export const TAUX_DE_REPORT = 0.3;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

/** Les chiffres de la réponse, calculés une fois du cas. */
export function retirerUneReference(c: Cas) {
  const a = assortiment(c);
  const d = a.derniere;
  const autres = a.lignes.filter((r) => r.code !== d.code);
  const margeDesAutres = autres.reduce((t, r) => t + r.mcv, 0);
  const quantiteDesAutres = autres.reduce((t, r) => t + r.quantite, 0);
  const margeMoyenneDesAutres = auCentime(margeDesAutres / quantiteDesAutres);
  const unitesReportees = Math.round(d.quantite * TAUX_DE_REPORT);
  const margeRecuperee = Math.round(unitesReportees * margeMoyenneDesAutres);
  const effet = margeRecuperee - d.mcv;
  return {
    ...a,
    d,
    autres,
    margeDesAutres,
    quantiteDesAutres,
    margeMoyenneDesAutres,
    unitesReportees,
    margeRecuperee,
    effet,
    gagnant: effet > 0,
  };
}

const tableauDeLaGamme = (c: Cas) => {
  const g = gammeDuMois(c.code)!;
  return {
    titre: `${c.entreprise} · ${g.libelle}, sur un mois de l'arène`,
    colonnes: ["Vendus", "Prix HT", "Coût variable"],
    lignes: g.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.quantite), eur(r.prix), eur(r.coutVariableUnitaire)] })),
  };
};

export const RETIRER_UNE_REFERENCE: Situation = {
  code: "retirer-une-reference",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["assortiment"],
  commanditaire: "La direction",
  titre: "Retirer une référence ?",
  accroche:
    "La direction veut retirer la référence qui laisse le moins de marge. Une partie de ses clients achèteraient autre chose : que gagnerait, ou que perdrait, la marge du mois ?",
  objectifs: [
    "Calculer la marge sur coût variable de chaque référence",
    "Calculer la marge moyenne d'une unité des autres références",
    "Chiffrer la marge récupérée par le report des ventes",
    "Mesurer l'effet net d'un retrait, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas compare les références d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« Je veux alléger l'offre de ${c.entreprise} en retirant la référence qui nous laisse le moins de marge. Ses clients ne sont pas tous perdus : d'après nos études, ${pct(TAUX_DE_REPORT * 100)} de ses ventes se reporteraient sur nos autres références, à leur marge moyenne. Que gagnerait, ou que perdrait, notre marge du mois ? »`,
        "Pas de cours cette fois : vous avez la gamme du mois, référence par référence, et la méthode est celle du chapitre. À vous de trouver la référence et de chiffrer le retrait.",
      ],
      tableau: tableauDeLaGamme,
      repere: () =>
        "À rendre : la marge de la référence visée et celle des autres, la marge moyenne d'une unité des autres références, la marge récupérée par le report, l'effet net du retrait, et votre réponse.",
    },
    {
      id: "les-marges",
      type: "montants",
      titre: "Ce que chaque référence laisse",
      notions: ["contribution_margin", "assortment"],
      tableau: tableauDeLaGamme,
      question: (c) => {
        const r = retirerUneReference(c);
        return `Calculez la marge sur coût variable du mois de chacune des ${qte(r.lignes.length)} références (à l'euro).`;
      },
      champs: (c) =>
        retirerUneReference(c).lignes.map((r) => ({
          libelle: `Marge · ${r.nom}`,
          attendu: r.mcv,
          tolerance: 1,
          calcul: `${qte(r.quantite)} × (${eur(r.prix)} − ${eur(r.coutVariableUnitaire)}) = ${eur(r.mcv)}`,
        })),
      explication: (c) => {
        const r = retirerUneReference(c);
        return [`La plus petite marge est celle de ${r.d.nom} : ${eur(r.d.mcv)} par mois, ${pct(r.d.partDeLaMarge)} de la marge de la gamme. C'est elle que la direction veut retirer. C'est ce que le retrait met en jeu.`];
      },
    },
    {
      id: "le-report",
      type: "montants",
      titre: "Ce que le report rattrape",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const r = retirerUneReference(c);
        return `Sans ${r.d.nom}, ${pct(TAUX_DE_REPORT * 100)} de ses ventes se reportent sur les autres références. Calculez la marge moyenne d'une unité des autres références (leur marge totale divisée par leurs unités vendues, au centime), les unités reportées (à l'unité), la marge qu'elles rapportent (à l'euro), puis l'effet net du retrait sur la marge du mois (négatif s'il en fait perdre).`;
      },
      champs: (c) => {
        const r = retirerUneReference(c);
        return [
          { libelle: "Marge moyenne d'une unité des autres références", attendu: r.margeMoyenneDesAutres, tolerance: 0.01, calcul: `${eur(r.margeDesAutres)} ÷ ${qte(r.quantiteDesAutres)} = ${eur(r.margeMoyenneDesAutres)}` },
          { libelle: "Unités reportées", attendu: r.unitesReportees, tolerance: 1, calcul: `${qte(r.d.quantite)} × ${pct(TAUX_DE_REPORT * 100)} = ${qte(r.unitesReportees)}` },
          { libelle: "Marge récupérée", attendu: r.margeRecuperee, tolerance: 2, calcul: `${qte(r.unitesReportees)} × ${eur(r.margeMoyenneDesAutres)} = ${eur(r.margeRecuperee)}` },
          { libelle: "Effet net sur la marge du mois", attendu: r.effet, tolerance: 2, calcul: `${eur(r.margeRecuperee)} − ${eur(r.d.mcv)} = ${eur(r.effet)}` },
        ];
      },
      explication: (c) => {
        const r = retirerUneReference(c);
        return [
          r.gagnant
            ? `Le report rattrape plus que ce que ${r.d.nom} laissait : les ventes reportées partent vers des références qui margent davantage, et la marge du mois gagne ${eur(r.effet)}.`
            : `Le report rattrape ${eur(r.margeRecuperee)} sur les ${eur(r.d.mcv)} que laissait ${r.d.nom} : la marge du mois y perd ${eur(-r.effet)}, alors que le loyer et l'équipe restent les mêmes.${r.d.mcvUnitaire > r.margeMoyenneDesAutres ? ` Les ventes reportées margent même moins : ${eur(r.margeMoyenneDesAutres)} par unité, contre ${eur(r.d.mcvUnitaire)} pour ${r.d.nom}, qui marge fort par unité.` : ""}`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = retirerUneReference(c);
        return [
          {
            texte: r.gagnant
              ? `Retirer ${r.d.nom} ferait gagner ${eur(r.effet)} de marge par mois`
              : `Retirer ${r.d.nom} coûterait ${eur(-r.effet)} de marge par mois`,
            juste: true,
            retour: `Oui : ${r.d.nom} laisse ${eur(r.d.mcv)} de marge par mois, et le report en rattrape ${eur(r.margeRecuperee)} (${qte(r.unitesReportees)} unités à ${eur(r.margeMoyenneDesAutres)}). Reste à peser ce que le chiffre ne dit pas : la place libérée, le stock, l'image de la gamme.`,
          },
          {
            texte: `Retirer ${r.d.nom} coûterait ${eur(r.d.chiffreDAffaires)} par mois : tout son chiffre d'affaires`,
            juste: false,
            retour: `Non : le chiffre d'affaires d'une référence paie d'abord ses coûts variables. Ce que le retrait met en jeu, c'est sa marge, ${eur(r.d.mcv)}, dont le report rattrape ${eur(r.margeRecuperee)}.`,
          },
          {
            texte: `Retirer ${r.d.nom} coûterait ${eur(r.d.mcv)} par mois : toute sa marge, sans rien en retour`,
            juste: false,
            retour: `Non : ${pct(TAUX_DE_REPORT * 100)} de ses ventes se reportent sur les autres références, et y laissent ${eur(r.margeRecuperee)} de marge. L'effet net est de ${eur(r.effet)}.`,
          },
        ];
      },
    },
  ],
};
