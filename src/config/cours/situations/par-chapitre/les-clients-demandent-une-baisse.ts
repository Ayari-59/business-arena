import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_ACTEURS, POURQUOI_LES_ACTEURS, lignesDesActeurs, type Parts } from "../../chapitres/les-acteurs-et-la-valeur";
import { partsDesActeurs } from "../../monde/gestion-et-information";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ACTEURS DE L'ORGANISATION ET LE PARTAGE DE LA VALEUR » : LES
 * CLIENTS DEMANDENT UNE BAISSE (Bac STMG, management, palier 1).
 *
 * Le chapitre chiffrait une demande des salariés ; le cas chiffre celle d'un autre acteur, les
 * clients : un prix 5 % plus bas, toute l'année, contre la promesse de commander 5 % d'enceintes de
 * plus. L'élève reprend les calculs du chapitre (la part de chacun dans ce que paient les clients,
 * les écarts d'une année refaite) et répond à la gérante : qui gagnerait, qui paierait. La question
 * est neuve : une baisse de prix touche plus d'acteurs qu'une hausse de salaire (les clients paient
 * moins chaque enceinte mais en achètent davantage, les fournisseurs livrent plus).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : le premier exercice (comptes-du-lycee.ts),
 * refait avec le prix baissé et les enceintes promises (partsDesActeurs, dans
 * monde/gestion-et-information.ts) : les ventes et les coûts variables changent, et l'impôt se
 * recalcule ; rien d'autre ne bouge.
 *
 * CE QUI A CHANGÉ. Le cas rejouait l'année de l'arène, dans neuf entreprises. Il refait maintenant
 * l'exercice de NOVA : la baisse coûte 36 187,90 € de résultat net aux associés.
 */

/** La baisse que demandent les clients (hypothèse du cas) : 5 % sur le prix de l'enceinte. */
export const BAISSE_DEMANDEE = 0.05;

/** Ce que les clients promettent en échange (hypothèse du cas) : 5 % d'enceintes commandées en plus. */
export const VENTES_EN_PLUS_PROMISES = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const baisse = `${Math.round(BAISSE_DEMANDEE * 100)} %`;
const enPlus = `${Math.round(VENTES_EN_PLUS_PROMISES * 100)} %`;

export type Verdict = "ils-paient" | "elle-se-paie";

/** La baisse chiffrée : ce que chacun reçoit avant et après, et qui la paie. */
export function baisseDemandee() {
  const avant = partsDesActeurs();
  const apres = partsDesActeurs(0, auCentime(avant.prix * (1 - BAISSE_DEMANDEE)), Math.round(avant.enceintes * (1 + VENTES_EN_PLUS_PROMISES)));
  const ecart = (f: (p: Parts) => number) => auCentime(f(apres) - f(avant));
  const ecartDeResultat = ecart((p) => p.associes);
  return {
    avant,
    apres,
    partDesFournisseurs: auDixieme((avant.fournisseurs / avant.ventes) * 100),
    partDesAssocies: auDixieme((avant.associes / avant.ventes) * 100),
    ecartDeVentes: apres.enceintes - avant.enceintes,
    ecartDeChiffre: ecart((p) => p.ventes),
    ecartFournisseurs: ecart((p) => p.fournisseurs),
    ecartDeSalaires: ecart((p) => p.salaries),
    ecartDImpot: ecart((p) => p.etat),
    ecartDeResultat,
    verdict: (ecartDeResultat >= 0 ? "elle-se-paie" : "ils-paient") as Verdict,
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = baisseDemandee();
  return {
    titre: `Ce que chaque acteur ${dE(c.entreprise)} a reçu dans l'année, au prix habituel`,
    colonnes: ["Sur l'année"],
    lignes: [{ libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avant.enceintes)] }, ...lignesDesActeurs(k.avant).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] }))],
  };
}

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const k = baisseDemandee();
  const apres = lignesDesActeurs(k.apres);
  return {
    titre: `L'année ${dE(c.entreprise)}, refaite avec un prix ${baisse} plus bas`,
    colonnes: ["Prix habituel", "Prix baissé"],
    lignes: [
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avant.enceintes), qte(k.apres.enceintes)] },
      ...lignesDesActeurs(k.avant).map((l, i) => ({ libelle: l.libelle, valeurs: [eur(l.montant), eur(apres[i]!.montant)] })),
    ],
  };
}

export const LES_CLIENTS_DEMANDENT_UNE_BAISSE: Situation = {
  code: "les-clients-demandent-une-baisse",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["les-acteurs-et-la-valeur"],
  commanditaire: "La gérante",
  titre: "Les clients demandent une baisse",
  accroche: `Les clients demandent un prix ${baisse} plus bas, et promettent de commander plus. Avant de répondre, la gérante veut savoir qui y gagnerait et qui la paierait.`,
  objectifs: [
    "Calculer la part de chaque acteur dans ce que paient les clients",
    "Chiffrer ce qu'une demande change pour chaque acteur",
    "Dire qui gagne et qui paie, chiffres à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_ACTEURS, pourquoi: POURQUOI_LES_ACTEURS },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des clients",
      tableau: tableauDeLAnnee,
      texte: () => {
        const k = baisseDemandee();
        return [
          `« Nos clients nous demandent de baisser le prix de l'enceinte de ${baisse}, de ${eur(k.avant.prix)} à ${eur(k.apres.prix)}. En échange, ils promettent de commander ${enPlus} d'enceintes de plus. Cette année, ils nous ont payé ${eur(k.avant.ventes)}. Dites-moi ce que chacun reçoit aujourd'hui, ce que la baisse changerait pour chacun, et qui la paierait. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. Le tableau de l'étape suivante refait l'année avec le prix baissé et les enceintes promises : les composants et les autres coûts suivent les enceintes, l'impôt suit le bénéfice, le reste ne bouge pas.",
        ];
      },
      repere: () => "À rendre : la part de chacun aujourd'hui, ce que la baisse change pour chacun, et qui la paierait.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "La part de chacun aujourd'hui",
      notions: ["income_statement"],
      question: (c) =>
        `Sur 100 € payés par les clients ${dE(c.entreprise)}, combien vont aux fournisseurs et prestataires, et combien restent aux associés ? Calculez chaque part (montant reçu ÷ ventes × 100), en pourcentage au dixième.`,
      champs: () => {
        const k = baisseDemandee();
        return [
          { libelle: "Part des fournisseurs et prestataires (%)", attendu: k.partDesFournisseurs, calcul: `${eur(k.avant.fournisseurs)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesFournisseurs)}`, tolerance: 0.1 },
          { libelle: "Part des associés (%)", attendu: k.partDesAssocies, calcul: `${eur(k.avant.associes)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesAssocies)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = baisseDemandee();
        return [`Sur 100 € de ventes, ${c.entreprise} en verse ${pct(k.partDesFournisseurs).replace(" %", " €")} à ses fournisseurs et prestataires, et en garde ${pct(k.partDesAssocies).replace(" %", " €")} pour ses associés. Une baisse de ${baisse} du prix, c'est presque autant que ce qui reste aux associés.`];
      },
    },
    {
      id: "ecarts",
      type: "montants",
      titre: "L'année refaite, acteur par acteur",
      notions: ["income_statement", "price_elasticity"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        "Calculez, prix baissé moins prix habituel, l'écart de ce que paient les clients, l'écart des achats et services payés aux fournisseurs, l'écart d'impôt et l'écart de résultat net.",
      champs: () => {
        const k = baisseDemandee();
        return [
          { libelle: "Écart de ce que paient les clients", attendu: k.ecartDeChiffre, calcul: `${eur(k.apres.ventes)} − ${eur(k.avant.ventes)} = ${eur(k.ecartDeChiffre)}` },
          { libelle: "Écart des achats et services", attendu: k.ecartFournisseurs, calcul: `${eur(k.apres.fournisseurs)} − ${eur(k.avant.fournisseurs)} = ${eur(k.ecartFournisseurs)}` },
          { libelle: "Écart d'impôt", attendu: k.ecartDImpot, calcul: `${eur(k.apres.etat)} − ${eur(k.avant.etat)} = ${eur(k.ecartDImpot)}` },
          { libelle: "Écart de résultat net", attendu: k.ecartDeResultat, calcul: `${eur(k.apres.associes)} − ${eur(k.avant.associes)} = ${eur(k.ecartDeResultat)}` },
        ];
      },
      explication: (c) => {
        const k = baisseDemandee();
        return [
          `Avec le prix baissé, les clients ${dE(c.entreprise)} achètent ${qte(k.ecartDeVentes)} ${c.unites} de plus, et paient ${k.ecartDeChiffre >= 0 ? `${eur(k.ecartDeChiffre)} de plus` : `${eur(-k.ecartDeChiffre)} de moins`} sur l'année. Les fournisseurs reçoivent ${eur(k.ecartFournisseurs)} de plus : ils livrent les composants des enceintes en plus.`,
          k.ecartDeResultat < 0 ? `Le résultat net baisse de ${eur(-k.ecartDeResultat)}, l'impôt de ${eur(-k.ecartDImpot)}.` : `Le résultat net ne baisse pas : les enceintes en plus paient la baisse.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      notions: ["income_statement"],
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const k = baisseDemandee();
        const chiffres = `Le résultat net varie de ${eur(k.ecartDeResultat)}, l'impôt de ${eur(k.ecartDImpot)}, les achats et services de ${eur(k.ecartFournisseurs)}.`;
        const paient = k.verdict === "ils-paient";
        return [
          { texte: "Les associés la paieraient surtout, l'État pour une part", juste: paient, retour: paient ? `Oui : le résultat net baisse de ${eur(-k.ecartDeResultat)}, l'impôt de ${eur(-k.ecartDImpot)}. ${chiffres}` : `Non : le résultat net ne baisse pas. ${chiffres}` },
          {
            texte: "Elle se paierait : les ventes en plus la couvrent",
            juste: !paient,
            retour: !paient ? `Oui : les ${qte(k.ecartDeVentes)} ${c.unites} en plus couvrent la baisse. ${chiffres}` : `Non : les ${qte(k.ecartDeVentes)} ${c.unites} en plus ne suffisent pas, parce que chacune coûte ses composants et ses autres coûts. ${chiffres}`,
          },
          { texte: "Les salariés la paieraient, par des salaires plus bas", juste: false, retour: `Non : les salaires de l'année varient de ${eur(k.ecartDeSalaires)}. Personne n'a touché à la paie. ${chiffres}` },
          { texte: "Seuls les clients y gagnent, et aucun autre acteur ne voit la différence", juste: false, retour: `Non : une baisse de prix touche presque tous les acteurs. ${chiffres}` },
        ];
      },
    },
  ],
};
