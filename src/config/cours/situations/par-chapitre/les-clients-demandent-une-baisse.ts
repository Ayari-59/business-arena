import type { RoundDecisions } from "../../../../engine/types";
import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { decisionsDeLAnneeDuCours } from "../../chapitres/decider-ensemble";
import { partsDeLAnnee, type PartsDeLAnnee } from "../../chapitres/les-acteurs-et-la-valeur";
import { anneeDeReference, rejouerAvec } from "../../gestion-de-la-pme";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ACTEURS DE L'ORGANISATION ET LE PARTAGE DE LA VALEUR » : LES
 * CLIENTS DEMANDENT UNE BAISSE (Bac STMG, management, palier 1).
 *
 * Le chapitre faisait rejouer une demande des salariés ; le cas fait rejouer celle d'un autre
 * acteur, les clients : tous les prix 5 % plus bas, toute l'année. L'élève reprend les calculs du
 * chapitre (la part de chacun dans ce que paient les clients, les écarts d'une année rejouée) et
 * répond à la gérante : qui gagnerait, qui paierait. La question est neuve : une baisse de prix
 * touche plus d'acteurs qu'une hausse de salaire (les clients paient moins chaque unité mais en
 * achètent davantage, les fournisseurs livrent plus), et dans certaines entreprises, les ventes
 * en plus la paient.
 *
 * Les chiffres : l'année du cours (`anneeDeReference`) et la même année rejouée avec le prix de
 * chaque trimestre posé à 95 % de celui de l'année du cours au même trimestre (valeur absolue,
 * référence par référence pour une gamme : `decisionsDeLAnneeDuCours`). Le reste, le gestionnaire
 * le règle dans l'année rejouée, avec les mêmes concurrents. Les parts sont celles du chapitre
 * (`partsDeLAnnee`).
 */

/** La baisse que demandent les clients (hypothèse du cas) : 5 % sur tous les prix. */
export const BAISSE_DEMANDEE = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const baisse = `${Math.round(BAISSE_DEMANDEE * 100)} %`;

/** L'année du cours rejouée avec tous les prix baissés, posés sur ceux de l'année du cours. */
export function anneeAuxPrixBaisses(code: string) {
  const annee = decisionsDeLAnneeDuCours(code);
  const k = 1 - BAISSE_DEMANDEE;
  return rejouerAvec(code, `les-clients-demandent-une-baisse:prix-moins-${BAISSE_DEMANDEE}`, (tour, d): RoundDecisions => {
    const r = annee[tour - 1]!;
    return {
      ...d,
      price: r.price * k,
      ...(d.products
        ? { products: Object.fromEntries(Object.entries(d.products).map(([cle, p]) => [cle, { ...p, price: (r.products?.[cle] ?? p).price * k }])) }
        : {}),
    };
  });
}

export type Verdict = "ils-paient" | "elle-se-paie";

/** La baisse rejouée : ce que chacun reçoit avant et après, et qui la paie. */
export function baisseDemandee(c: Cas) {
  const avant = partsDeLAnnee(c, anneeDeReference(c.code));
  const apres = partsDeLAnnee(c, anneeAuxPrixBaisses(c.code));
  const ecart = (f: (p: PartsDeLAnnee) => number) => f(apres) - f(avant);
  const ecartDeResultat = ecart((p) => p.resultatNet);
  const verdict: Verdict = ecartDeResultat >= 0 ? "elle-se-paie" : "ils-paient";
  return {
    avant,
    apres,
    partDesFournisseurs: auDixieme((avant.fournisseurs / avant.ventes) * 100),
    partDesAssocies: auDixieme((avant.resultatNet / avant.ventes) * 100),
    ecartDeVentes: ecart((p) => p.unitesVendues),
    ecartDeChiffre: ecart((p) => p.ventes),
    ecartFournisseurs: ecart((p) => p.fournisseurs),
    ecartDeSalaires: ecart((p) => p.salaires),
    ecartDInterets: ecart((p) => p.interets),
    ecartDImpot: ecart((p) => p.impot),
    ecartDeResultat,
    verdict,
  };
}

const lignes = (p: PartsDeLAnnee) => [
  { libelle: "Les clients : les ventes qu'ils ont payées", montant: p.ventes },
  { libelle: "Les fournisseurs et prestataires : achats et services", montant: p.fournisseurs },
  { libelle: "Les salariés : salaires et cotisations", montant: p.salaires },
  { libelle: "Les prêteurs : intérêts de l'emprunt", montant: p.interets },
  { libelle: "L'État : impôt sur les bénéfices", montant: p.impot },
  { libelle: "Les associés : résultat net", montant: p.resultatNet },
];

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const k = baisseDemandee(c);
  return {
    titre: `Ce que chaque acteur ${dE(c.entreprise)} a reçu dans l'année, aux prix habituels`,
    colonnes: ["Sur l'année"],
    lignes: [{ libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avant.unitesVendues)] }, ...lignes(k.avant).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] }))],
  };
}

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const k = baisseDemandee(c);
  const apres = lignes(k.apres);
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec des prix ${baisse} plus bas`,
    colonnes: ["Prix habituels", "Prix baissés"],
    lignes: [
      { libelle: `Ventes (${c.unites})`, valeurs: [qte(k.avant.unitesVendues), qte(k.apres.unitesVendues)] },
      ...lignes(k.avant).map((l, i) => ({ libelle: l.libelle, valeurs: [eur(l.montant), eur(apres[i]!.montant)] })),
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
  accroche:
    "Les clients réguliers demandent des prix 5 % plus bas. Avant de répondre, la gérante veut savoir qui y gagnerait et qui la paierait : l'arène rejoue l'année.",
  objectifs: [
    "Calculer la part de chaque acteur dans ce que paient les clients",
    "Chiffrer ce qu'une demande change pour chaque acteur",
    "Dire qui gagne et qui paie, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande des clients",
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = baisseDemandee(c);
        return [
          `« Nos clients réguliers nous demandent de baisser tous nos prix de ${baisse}. Cette année, ils nous ont payé ${eur(k.avant.ventes)}. Je ne veux pas répondre au hasard : dites-moi ce que chacun reçoit aujourd'hui, ce que la baisse changerait pour chacun, et qui la paierait. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. L'arène a rejoué l'année avec des prix plus bas à chaque trimestre, les mêmes concurrents et la même façon de gérer le reste.",
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
      champs: (c) => {
        const k = baisseDemandee(c);
        return [
          { libelle: "Part des fournisseurs et prestataires (%)", attendu: k.partDesFournisseurs, calcul: `${eur(k.avant.fournisseurs)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesFournisseurs)}`, tolerance: 0.1 },
          { libelle: "Part des associés (%)", attendu: k.partDesAssocies, calcul: `${eur(k.avant.resultatNet)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesAssocies)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = baisseDemandee(c);
        return [`Sur 100 € de ventes, ${c.entreprise} en verse ${pct(k.partDesFournisseurs).replace(" %", " €")} à ses fournisseurs et prestataires, et en garde ${pct(k.partDesAssocies).replace(" %", " €")} pour ses associés.`];
      },
    },
    {
      id: "ecarts",
      type: "montants",
      titre: "L'année rejouée, acteur par acteur",
      notions: ["income_statement", "price_elasticity"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        "Calculez, prix baissés moins prix habituels, l'écart de ce que paient les clients, l'écart des achats et services payés aux fournisseurs, l'écart d'impôt et l'écart de résultat net.",
      champs: (c) => {
        const k = baisseDemandee(c);
        return [
          { libelle: "Écart de ce que paient les clients", attendu: k.ecartDeChiffre, calcul: `${eur(k.apres.ventes)} − ${eur(k.avant.ventes)} = ${eur(k.ecartDeChiffre)}`, tolerance: 1 },
          { libelle: "Écart des achats et services", attendu: k.ecartFournisseurs, calcul: `${eur(k.apres.fournisseurs)} − ${eur(k.avant.fournisseurs)} = ${eur(k.ecartFournisseurs)}`, tolerance: 1 },
          { libelle: "Écart d'impôt", attendu: k.ecartDImpot, calcul: `${eur(k.apres.impot)} − ${eur(k.avant.impot)} = ${eur(k.ecartDImpot)}`, tolerance: 1 },
          { libelle: "Écart de résultat net", attendu: k.ecartDeResultat, calcul: `${eur(k.apres.resultatNet)} − ${retranche(k.avant.resultatNet)} = ${eur(k.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = baisseDemandee(c);
        return [
          `Avec des prix ${baisse} plus bas, les clients ${dE(c.entreprise)} achètent ${k.ecartDeVentes >= 0 ? `${qte(k.ecartDeVentes)} ${c.unites} de plus` : `${qte(-k.ecartDeVentes)} ${c.unites} de moins`}, et paient ${k.ecartDeChiffre >= 0 ? `${eur(k.ecartDeChiffre)} de plus` : `${eur(-k.ecartDeChiffre)} de moins`} sur l'année. Les fournisseurs reçoivent ${k.ecartFournisseurs >= 0 ? `${eur(k.ecartFournisseurs)} de plus` : `${eur(-k.ecartFournisseurs)} de moins`}${k.ecartDeSalaires === 0 ? ", les salariés exactement la même chose" : ""}.`,
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
        const k = baisseDemandee(c);
        const chiffres = `Le résultat net varie de ${eur(k.ecartDeResultat)}, l'impôt de ${eur(k.ecartDImpot)}, les achats et services de ${eur(k.ecartFournisseurs)}.`;
        const paient = k.verdict === "ils-paient";
        return [
          {
            texte: "Les associés la paieraient surtout, l'État pour une part",
            juste: paient,
            retour: paient
              ? `Oui : le résultat net baisse de ${eur(-k.ecartDeResultat)}, l'impôt de ${eur(-k.ecartDImpot)}. ${chiffres}`
              : `Non : cette année, le résultat net ne baisse pas. ${chiffres}`,
          },
          {
            texte: "Elle se paierait : les ventes en plus la couvrent",
            juste: !paient,
            retour: !paient
              ? `Oui : les clients achètent ${qte(k.ecartDeVentes)} ${c.unites} de plus, et le résultat net ne baisse pas. ${chiffres}`
              : `Non : ${k.ecartDeVentes > 0 ? `les ${qte(k.ecartDeVentes)} ${c.unites} en plus ne suffisent pas` : "les ventes ne montent pas"}. ${chiffres}`,
          },
          {
            texte: "Les salariés la paieraient, par des salaires plus bas",
            juste: false,
            retour: `Non : les salaires de l'année varient de ${eur(k.ecartDeSalaires)}.${k.ecartDeSalaires === 0 ? " Personne n'a touché à la paie." : ""} ${chiffres}`,
          },
          {
            texte: "Seuls les clients y gagnent, et aucun autre acteur ne voit la différence",
            juste: false,
            retour: `Non : une baisse de prix touche presque tous les acteurs. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
