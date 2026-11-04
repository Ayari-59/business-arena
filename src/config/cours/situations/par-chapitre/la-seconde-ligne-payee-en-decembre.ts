import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_TABLEAU_DE_FINANCEMENT, ficheDe } from "../../chapitres/le-tableau-de-financement";
import { SECONDE_LIGNE_PAYEE_EN_DECEMBRE, tableauDeFinancement } from "../../monde/tableaux-de-flux";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE FINANCEMENT » : LA SECONDE LIGNE PAYÉE EN DÉCEMBRE
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le premier exercice de NOVA, sa clôture
 * (monde/cloture.ts) et le tableau de financement de monde/tableaux-de-flux.ts.
 *
 * HYPOTHÈSE DU CAS (monde/tableaux-de-flux.ts, SECONDE_LIGNE_PAYEE_EN_DECEMBRE) : le fabricant
 * propose de facturer la seconde ligne de N + 1 le 31 décembre, payée comptant TVA comprise, livrée
 * et mise en service le 2 janvier comme prévu. Elle ne s'amortit pas en N : le résultat et la CAF ne
 * bougent pas. L'élève refait seul les deux parties : la partie I (un emploi de plus), la partie II
 * (la TVA de la ligne, une créance hors exploitation ; la trésorerie). La réponse demande un
 * jugement : l'achat se finance sur le fonds de roulement, qui reste largement au-dessus du besoin.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Les chiffres du cas : le tableau de la fiche, et celui avec la seconde ligne payée en décembre. */
export function secondeLigneEnDecembre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const avant = tableauDeFinancement(f);
  const apres = tableauDeFinancement(f, {}, { investissementDeDecembre: SECONDE_LIGNE_PAYEE_EN_DECEMBRE });
  const ligne = SECONDE_LIGNE_PAYEE_EN_DECEMBRE;
  return { f, avant, apres, ligne, ttc: auCentime(ligne.ht + ligne.tva) };
}

export const LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE: Situation = {
  code: "la-seconde-ligne-payee-en-decembre",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["le-tableau-de-financement"],
  commanditaire: "Le dirigeant",
  titre: "La seconde ligne payée en décembre",
  accroche: "Le fabricant propose de facturer la seconde ligne dès le 31 décembre. Que deviendrait le tableau de financement de l'année, et l'équilibre tiendrait-il ?",
  objectifs: [
    "Reprendre la partie I d'un tableau de financement avec une acquisition de plus",
    "Ranger la TVA d'une immobilisation dans la partie II et en tirer la variation de la trésorerie",
    "Juger si un investissement se finance sur le fonds de roulement, et rendre une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_FINANCEMENT,
    pourquoi: "ce cas reprend le chapitre « Le tableau de financement », qui se joue sur le premier exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = secondeLigneEnDecembre(c);
        return [
          `« Le fabricant nous facturerait la seconde ligne le 31 décembre, ${eur(n.ligne.ht)} hors taxes, payée comptant ce jour-là ; elle serait livrée et mise en service le 2 janvier, comme prévu. Je la paierais sur notre trésorerie, sans emprunt. Que deviendrait le tableau de financement de l'année ? Et pouvons-nous nous le permettre ? »`,
          "Pas de cours cette fois : vous avez le tableau de financement de l'exercice, tel que le chapitre l'a dressé.",
        ];
      },
      tableau: (c) => {
        const n = secondeLigneEnDecembre(c);
        const t = n.avant;
        return {
          titre: "Le tableau de financement de l'exercice, sans la seconde ligne",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Total des emplois stables", valeurs: [eur(t.totalDesEmplois)] },
            { libelle: "Total des ressources stables", valeurs: [eur(t.totalDesRessources)] },
            { libelle: "Variation du fonds de roulement", valeurs: [eur(t.variationDuFondsDeRoulement)] },
            { libelle: "Variation du besoin d'exploitation", valeurs: [eur(t.partie2.variationDExploitation)] },
            { libelle: "Variation du besoin hors exploitation", valeurs: [eur(t.partie2.variationHorsExploitation)] },
            { libelle: "Variation de la trésorerie nette", valeurs: [eur(t.partie2.variationDeTresorerie)] },
            { libelle: "Dont le compte courant au 31 décembre", valeurs: [eur(t.compteCourant)] },
            { libelle: "Seconde ligne, hors taxes", valeurs: [eur(n.ligne.ht)] },
            { libelle: "TVA de la seconde ligne, déductible en janvier", valeurs: [eur(n.ligne.tva)] },
          ],
        };
      },
      repere: () => "À rendre : la partie I avec la seconde ligne, la partie II (le hors exploitation et la trésorerie), et votre réponse.",
    },
    {
      id: "la-partie-1",
      type: "montants",
      titre: "La partie I, avec la seconde ligne",
      notions: ["frng"],
      question: () =>
        "La seconde ligne n'est pas en service en N : pas de dotation, le résultat et la capacité d'autofinancement ne bougent pas. Calculez les acquisitions de l'exercice, le total des emplois, puis la variation du fonds de roulement.",
      champs: (c) => {
        const n = secondeLigneEnDecembre(c);
        const a = n.avant;
        const b = n.apres;
        return [
          { libelle: "Acquisitions d'immobilisations", attendu: b.emplois.acquisitions, calcul: `${eur(a.emplois.acquisitions)} + ${eur(n.ligne.ht)} = ${eur(b.emplois.acquisitions)}, hors taxes` },
          { libelle: "Total des emplois", attendu: b.totalDesEmplois, calcul: `${eur(b.emplois.acquisitions)} + ${eur(b.emplois.remboursements)} = ${eur(b.totalDesEmplois)}` },
          { libelle: "Variation du fonds de roulement", attendu: b.variationDuFondsDeRoulement, calcul: `${eur(b.totalDesRessources)} − ${eur(b.totalDesEmplois)} = ${eur(b.variationDuFondsDeRoulement)}` },
        ];
      },
      explication: (c) => {
        const n = secondeLigneEnDecembre(c);
        return [`Les ressources n'ont pas bougé : la ligne se paie sur ce que l'année a déjà dégagé. Le fonds de roulement grandit encore de ${eur(n.apres.variationDuFondsDeRoulement)}, mais de ${eur(n.ligne.ht)} de moins.`];
      },
    },
    {
      id: "la-partie-2",
      type: "montants",
      titre: "La partie II, et la trésorerie",
      notions: ["bfr", "net_treasury", "vat_payable"],
      question: () =>
        "Calculez la variation du besoin hors exploitation (négative pour un dégagement), la variation du besoin en fonds de roulement, la variation de la trésorerie nette, puis le compte courant du 31 décembre.",
      champs: (c) => {
        const n = secondeLigneEnDecembre(c);
        const a = n.avant.partie2;
        const b = n.apres.partie2;
        return [
          { libelle: "Variation du besoin hors exploitation", attendu: b.variationHorsExploitation, calcul: `${eur(n.ligne.tva)} de TVA à récupérer − ${eur(b.autresCrediteurs)} d'impôt et d'intérêts dus = ${signe(b.variationHorsExploitation)}` },
          { libelle: "Variation du besoin en fonds de roulement", attendu: b.variationDuBesoin, calcul: `${eur(b.variationDExploitation)} ${signe(b.variationHorsExploitation)} = ${eur(b.variationDuBesoin)}` },
          { libelle: "Variation de la trésorerie nette", attendu: b.variationDeTresorerie, calcul: `${eur(n.apres.variationDuFondsDeRoulement)} − ${eur(b.variationDuBesoin)} = ${eur(b.variationDeTresorerie)}, soit ${eur(a.variationDeTresorerie)} − ${eur(n.ttc)}` },
          { libelle: "Compte courant au 31 décembre", attendu: n.apres.compteCourant, calcul: `${eur(n.avant.compteCourant)} − ${eur(n.ttc)} = ${eur(n.apres.compteCourant)}` },
        ];
      },
      explication: (c) => {
        const n = secondeLigneEnDecembre(c);
        return [
          `La TVA de la ligne, ${eur(n.ligne.tva)}, ne va pas en partie I : elle se récupère en janvier, c'est une créance hors exploitation. La trésorerie paie la ligne toutes taxes comprises, ${eur(n.ttc)} ; elle en retrouvera ${eur(n.ligne.tva)} sur la déclaration de janvier.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["frng", "net_treasury"],
      question: (c) => {
        const n = secondeLigneEnDecembre(c);
        return `Avec la seconde ligne payée en décembre, le fonds de roulement varie de ${eur(n.apres.variationDuFondsDeRoulement)} et le besoin de ${eur(n.apres.partie2.variationDuBesoin)}. Quelle réponse rendez-vous au dirigeant ?`;
      },
      options: (c) => {
        const n = secondeLigneEnDecembre(c);
        const b = n.apres;
        return [
          {
            texte: "Oui : le fonds de roulement couvre encore le besoin, de loin",
            juste: true,
            retour: `Oui. Une ligne de plus est un emploi stable, financé ici par des ressources stables déjà en place : l'apport, l'emprunt et la CAF. Le fonds de roulement, ${eur(b.fondsDeRoulementDeCloture)} au 31 décembre, couvre toujours le besoin, ${eur(b.partie2.variationDuBesoin)}, et le compte courant garde ${eur(b.compteCourant)}. Mais c'est la réserve de N + 1 qui y passe : un emprunt sur la durée de la ligne la garderait.`,
          },
          {
            texte: "Non : payer un investissement sur la trésorerie est toujours une faute de financement",
            juste: false,
            retour: "Non : la règle est qu'un emploi stable se finance par des ressources stables. Ici, la trésorerie vient précisément de ressources stables (l'apport, l'emprunt, la CAF), restées disponibles.",
          },
          {
            texte: `Non : le compte courant tomberait à ${eur(b.compteCourant)}, sous le seuil de prudence`,
            juste: false,
            retour: `Non : le compte courant reste positif, et la trésorerie nette garde ${eur(b.partie2.variationDeTresorerie)}, compte à terme compris. Aucun seuil n'est franchi.`,
          },
          {
            texte: "Oui : la ligne ne coûte rien cette année, puisqu'elle ne s'amortit pas",
            juste: false,
            retour: `Non : le résultat ne bouge pas, mais la trésorerie paie ${eur(n.ttc)} le 31 décembre. Une immobilisation coûte d'abord de l'argent, avant de coûter des charges.`,
          },
        ];
      },
    },
  ],
};
