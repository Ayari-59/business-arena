import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  HAUSSE_DEMANDEE,
  PAS_DU_PRIX_DES_ACTEURS,
  RESULTAT_VOULU_PAR_LES_ASSOCIES,
  hausseDesSalaires,
  hausseQueLesAssociesAcceptent,
  partsDesActeurs,
  prixQuiPaieLaHausse,
} from "../monde/gestion-et-information";
import { IMPOT_SUR_LES_SOCIETES } from "../monde/exercice-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES ACTEURS DE L'ORGANISATION ET LE PARTAGE DE LA VALEUR (Bac STMG, management,
 * palier 1).
 *
 * Une entreprise ne vit pas seule : des clients la paient, des fournisseurs la livrent, des
 * salariés y travaillent, une banque lui prête, l'État prélève l'impôt, des associés y ont mis leur
 * argent. Chacun reçoit sa part de l'argent que paient les clients, et chacun voudrait que la sienne
 * soit plus grosse. Le chapitre lit ces parts dans le premier exercice de NOVA, puis chiffre une
 * demande des salariés, une hausse générale des salaires : ce que gagnent les salariés, ce que
 * perdent les associés et l'État. Un curseur (la plus forte hausse que les associés acceptent) et un
 * laboratoire (le prix qui ferait payer la hausse aux clients).
 *
 * Il ne double pas « La valeur ajoutée et son partage » (gestion et finance), qui calcule la richesse
 * créée et ses parts ; ni « Rémunération et motivation » (ressources humaines). Ici, l'angle est celui
 * du management : qui sont les acteurs, ce que chacun reçoit, et pourquoi leurs attentes s'opposent.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le premier exercice, clôturé par le
 * modèle du cours (comptes-du-lycee.ts, le même que la comptabilité au centime), lu par
 * monde/gestion-et-information.ts. La hausse et le résultat que veulent garder les associés sont
 * des hypothèses du cours, nommées là-bas. HYPOTHÈSE (celle de comptes-du-lycee.ts) : une hausse des
 * salaires ou du prix ne change pas les enceintes vendues ; le cours ne dit pas ici ce qu'une équipe
 * plus motivée ferait vendre, ni combien de clients un prix plus haut ferait fuir.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène avec des salaires à 105, dans neuf
 * entreprises. Il chiffre maintenant la même hausse sur l'exercice de NOVA : 6 390 € de plus pour
 * les salariés, 4 792 € de moins pour les associés, 1 598 € de moins pour l'État.
 */

/** La hausse demandée par les salariés, en indice de salaire (le marché vaut 100) : 105. */
export const INDICE_DE_LA_HAUSSE = 1 + HAUSSE_DEMANDEE;

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DES_ACTEURS = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_LES_ACTEURS =
  "ce chapitre lit le premier exercice de NOVA, clôturé par le cours : ce que chaque acteur en a reçu, au centime.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const ecartEnPourcent = Math.round(HAUSSE_DEMANDEE * 100);

export type Parts = ReturnType<typeof partsDesActeurs>;

/** Les six acteurs, et ce que chacun reçoit dans une année. */
export function lignesDesActeurs(p: Parts) {
  return [
    { libelle: "Les clients : les ventes qu'ils ont payées", montant: p.ventes },
    { libelle: "Les fournisseurs et prestataires : achats et services", montant: p.fournisseurs },
    { libelle: "Les salariés : salaires et cotisations", montant: p.salaries },
    { libelle: "Les prêteurs : intérêts de l'emprunt", montant: p.preteurs },
    { libelle: "L'État : impôt sur les bénéfices", montant: p.etat },
    { libelle: "Les associés : résultat net", montant: p.associes },
  ];
}

/** L'année, ses parts dans les ventes, la hausse et qui la paie. */
export function acteursEtValeur() {
  const h = hausseDesSalaires();
  const part = (x: number) => auDixieme((x / h.avant.ventes) * 100);
  return {
    ...h,
    partDesSalaries: part(h.avant.salaries),
    partDeLEtatDansLesVentes: part(h.avant.etat),
    partDesAssociesDansLesVentes: part(h.avant.associes),
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  return {
    titre: `Ce que chaque acteur ${dE(c.entreprise)} a reçu dans l'année`,
    colonnes: ["Sur l'année"],
    lignes: lignesDesActeurs(acteursEtValeur().avant).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
  };
}

function tableauDeLaHausse(c: Cas): TableauDeDonnees {
  const k = acteursEtValeur();
  const apres = lignesDesActeurs(k.apres);
  return {
    titre: `L'année ${dE(c.entreprise)}, avec des salaires ${ecartEnPourcent} % plus hauts`,
    colonnes: ["Salaires habituels", `Salaires + ${ecartEnPourcent} %`],
    lignes: lignesDesActeurs(k.avant).map((l, i) => ({ libelle: l.libelle, valeurs: [eur(l.montant), eur(apres[i]!.montant)] })),
  };
}

export const LES_ACTEURS_ET_LA_VALEUR: Chapitre = {
  code: "les-acteurs-et-la-valeur",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Les organisations et les acteurs"],
  titre: "Les acteurs de l'organisation et le partage de la valeur",
  accroche:
    "Clients, fournisseurs, salariés, prêteurs, État, associés : chacun reçoit sa part de ce que l'entreprise encaisse, et chacun en voudrait davantage. Une hausse des salaires, chiffrée : qui gagne, qui perd ?",
  objectifs: [
    "Nommer les acteurs d'une organisation et ce que chacun en reçoit",
    "Calculer la part de chacun dans ce que paient les clients",
    "Repérer des attentes qui s'opposent",
    "Chiffrer qui gagne et qui perd quand une demande est acceptée",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_ACTEURS, pourquoi: POURQUOI_LES_ACTEURS },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ceux qui font vivre l'entreprise",
      notions: ["income_statement", "payroll"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const k = acteursEtValeur();
        return [
          `Dans l'année, les clients ${dE(c.entreprise)} lui ont payé ${eur(k.avant.ventes)} (${qte(k.avant.enceintes)} ${c.unites} à ${eur(k.avant.prix)}). Cet argent ne reste pas dans l'entreprise : il passe aux fournisseurs et prestataires qui l'ont livrée, aux salariés qui ont travaillé, à la banque qui lui a prêté, à l'État. Ce qui reste, le résultat net, revient aux associés.`,
          "Ce sont les acteurs de l'organisation, qu'on appelle aussi ses parties prenantes. Chacun attend quelque chose d'elle : les clients, un bon produit au juste prix ; les fournisseurs, des commandes payées à temps ; les salariés, un salaire et de bonnes conditions de travail ; les prêteurs, des intérêts et le remboursement ; l'État, l'impôt ; les associés, un résultat.",
          `${c.entreprise} ne verse pas de dividende cette année : le résultat net reste chez elle, mais il appartient aux associés. Une part de ce que paient les clients sert aussi à mettre de côté l'usure de la ligne et les risques de l'année : le tableau ne la montre pas.`,
        ];
      },
      repere: () => "Les acteurs d'une organisation (ses parties prenantes) se partagent ce qu'elle encaisse, et leurs attentes ne vont pas toutes dans le même sens.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "Sur 100 € payés par les clients",
      notions: ["income_statement", "payroll"],
      tableau: tableauDeLAnnee,
      question: (c) =>
        `Sur 100 € que les clients ${dE(c.entreprise)} ont payés dans l'année, combien sont allés aux salariés, à l'État et aux associés ? Calculez chaque part (montant reçu ÷ ventes × 100), en pourcentage au dixième.`,
      champs: () => {
        const k = acteursEtValeur();
        return [
          { libelle: "Part des salariés (%)", attendu: k.partDesSalaries, calcul: `${eur(k.avant.salaries)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesSalaries)}`, tolerance: 0.1 },
          { libelle: "Part de l'État (%)", attendu: k.partDeLEtatDansLesVentes, calcul: `${eur(k.avant.etat)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDeLEtatDansLesVentes)}`, tolerance: 0.1 },
          { libelle: "Part des associés (%)", attendu: k.partDesAssociesDansLesVentes, calcul: `${eur(k.avant.associes)} ÷ ${eur(k.avant.ventes)} × 100 = ${pct(k.partDesAssociesDansLesVentes)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = acteursEtValeur();
        return [
          `Sur 100 € payés par les clients, ${c.entreprise} en verse ${pct(k.partDesSalaries).replace(" %", " €")} à ses salariés, ${pct(k.partDeLEtatDansLesVentes).replace(" %", " €")} à l'État, et en garde ${pct(k.partDesAssociesDansLesVentes).replace(" %", " €")} pour ses associés. ${
            k.partDesSalaries > k.partDesAssociesDansLesVentes ? "Les salariés reçoivent plus que les associés : c'est le cas de la plupart des entreprises." : "Les associés reçoivent plus que les salariés : c'est rare."
          } La plus grosse part va aux fournisseurs : une enceinte, ce sont d'abord des composants achetés.`,
          "Ces parts sont liées : à ventes égales, un euro de plus pour les uns est un euro de moins pour les autres.",
        ];
      },
    },
    {
      id: "attentes",
      type: "choix",
      titre: "Des attentes qui s'opposent",
      notions: ["pay_and_motivation"],
      question: (c) => `Les salariés ${dE(c.entreprise)} demandent une hausse de ${ecartEnPourcent} % de tous les salaires, toute l'année. Quel acteur a l'attente qui s'oppose le plus directement à la leur ?`,
      options: () => {
        const k = acteursEtValeur();
        return [
          {
            texte: "Les associés : un salaire en plus est une charge de plus",
            juste: true,
            retour: `Oui : à ventes égales, chaque euro de salaire en plus est un euro de charge, qui fait baisser le résultat net, la part des associés (${eur(k.avant.associes)} cette année).`,
          },
          {
            texte: "Les clients : une hausse des salaires monte forcément les prix",
            juste: false,
            retour: "Non : l'entreprise peut monter ses prix, mais rien ne l'y oblige, et ses clients pourraient alors aller chez les concurrents. Le prix est un choix de gestion, pas une conséquence automatique.",
          },
          { texte: "Les fournisseurs : l'entreprise devra leur acheter moins", juste: false, retour: "Non : ce qu'elle achète dépend de ce qu'elle produit et vend, pas de ce qu'elle paie ses salariés." },
        ];
      },
    },
    {
      id: "hausse",
      type: "montants",
      titre: "La hausse chiffrée",
      notions: ["payroll", "income_statement"],
      tableau: tableauDeLaHausse,
      question: () =>
        `Le tableau refait l'année avec des salaires et des cotisations ${ecartEnPourcent} % plus hauts, les ventes et les achats inchangés. Calculez les écarts de salaires, d'impôt et de résultat net (avec la hausse moins sans), puis la part de la hausse payée par les associés.`,
      champs: () => {
        const k = acteursEtValeur();
        return [
          { libelle: "Écart de salaires", attendu: k.ecartDeSalaires, calcul: `${eur(k.apres.salaries)} − ${eur(k.avant.salaries)} = ${eur(k.ecartDeSalaires)}` },
          { libelle: "Écart d'impôt", attendu: k.ecartDImpot, calcul: `${eur(k.apres.etat)} − ${eur(k.avant.etat)} = ${eur(k.ecartDImpot)}` },
          { libelle: "Écart de résultat net", attendu: k.ecartDeResultat, calcul: `${eur(k.apres.associes)} − ${eur(k.avant.associes)} = ${eur(k.ecartDeResultat)}` },
          { libelle: "Part de la hausse payée par les associés (%)", attendu: k.partDesAssocies, calcul: `${eur(-k.ecartDeResultat)} ÷ ${eur(k.ecartDeSalaires)} × 100 = ${pct(k.partDesAssocies)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = acteursEtValeur();
        return [
          `Les salariés reçoivent ${eur(k.ecartDeSalaires)} de plus dans l'année. Le résultat net baisse de ${eur(-k.ecartDeResultat)} et l'impôt de ${eur(-k.ecartDImpot)} : les associés paient ${pct(k.partDesAssocies)} de la hausse, l'État ${pct(k.partDeLEtat)}.`,
          `L'impôt se calcule sur le bénéfice : au-delà de ${eur(IMPOT_SUR_LES_SOCIETES.plafondDuTauxReduit)}, chaque euro de bénéfice en moins en retire ${pct(IMPOT_SUR_LES_SOCIETES.tauxNormal * 100)} à l'État.`,
        ];
      },
    },
    {
      id: "qui-paie",
      type: "choix",
      titre: "Qui paie la hausse ?",
      notions: ["payroll", "income_statement"],
      tableau: tableauDeLaHausse,
      question: (c) => `Avec la hausse, les salariés ${dE(c.entreprise)} reçoivent ${eur(acteursEtValeur().ecartDeSalaires)} de plus dans l'année. Qui la paie ?`,
      options: () => {
        const k = acteursEtValeur();
        const chiffres = `Le résultat net varie de ${eur(k.ecartDeResultat)}, l'impôt de ${eur(k.ecartDImpot)}, les ventes de ${eur(auCentime(k.apres.ventes - k.avant.ventes))}.`;
        return [
          { texte: "Surtout les associés, et l'État pour une part", juste: k.quiPaie === "associes", retour: k.quiPaie === "associes" ? `Oui : les associés en paient ${pct(k.partDesAssocies)} par un résultat net plus petit, l'État ${pct(k.partDeLEtat)} par un impôt plus petit. ${chiffres}` : `Non. ${chiffres}` },
          { texte: "Surtout l'État, qui perd de l'impôt", juste: k.quiPaie === "etat", retour: k.quiPaie === "etat" ? `Oui : l'impôt baisse plus que le résultat net. ${chiffres}` : `Non : l'État n'en paie que ${pct(k.partDeLEtat)}, par un impôt plus petit. ${chiffres}` },
          { texte: "Les clients, par des prix plus hauts", juste: false, retour: `Non : les clients paient exactement la même chose, ${eur(k.apres.ventes)} dans les deux années. Les prix n'ont pas bougé.` },
        ];
      },
    },
    {
      id: "la-hausse-acceptable",
      type: "curseur",
      titre: "La hausse que les associés acceptent",
      notions: ["payroll", "income_statement"],
      sens: "plus-grande",
      question: (c) =>
        `Les associés ${dE(c.entreprise)} veulent garder au moins ${eur(RESULTAT_VOULU_PAR_LES_ASSOCIES)} de résultat net. Faites varier la hausse des salaires, en pour cent, et placez le curseur sur la plus forte hausse qui leur laisse ce résultat.`,
      grandeur: () => ({ libelle: "Hausse des salaires", unite: "%" }),
      cible: () => ({ attendu: hausseQueLesAssociesAcceptent(), min: 0, max: 20 }),
      zones: ["Les associés gardent leur résultat", "Les associés n'ont plus leur résultat"],
      rates: () => ({
        dessous: "Les associés gardent leur résultat, mais ils accepteraient une hausse plus forte : cherchez la plus forte.",
        dessus: "Avec cette hausse, le résultat net passe sous ce que veulent les associés.",
      }),
      montrer: "Montrer la hausse",
      lecture: (_c, h) => {
        const p = partsDesActeurs(h / 100);
        return [
          { libelle: "Salaires et cotisations", montant: p.salaries },
          { libelle: "Impôt sur les bénéfices", montant: p.etat },
          { libelle: "Résultat net des associés", montant: p.associes, fort: true },
        ];
      },
      droites: () => ({ produit: (h) => partsDesActeurs(h / 100).associes, cout: () => RESULTAT_VOULU_PAR_LES_ASSOCIES, libelles: ["Résultat net", "Résultat voulu par les associés"] }),
      explication: () => {
        const h = hausseQueLesAssociesAcceptent();
        return [
          `Jusqu'à ${qte(h)} %, le résultat net reste au-dessus de ${eur(RESULTAT_VOULU_PAR_LES_ASSOCIES)} : ${eur(partsDesActeurs(h / 100).associes)}. À ${qte(h + 1)} %, il tombe à ${eur(partsDesActeurs((h + 1) / 100).associes)}.`,
          `La hausse demandée, ${ecartEnPourcent} %, est dans ce que les associés acceptent : il y a de la place pour négocier. Arbitrer, c'est chiffrer où est la limite de chacun.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Et si les clients payaient la hausse ?",
      notions: ["payroll", "price_elasticity"],
      question: (c) => {
        const p = partsDesActeurs();
        return `Les salaires montent de ${ecartEnPourcent} %. Pour garder le résultat net de l'année, ${eur(p.associes)}, la direction pourrait monter le prix de l'enceinte. Faites varier le prix, les ${qte(p.enceintes)} ${c.unites} vendues gardées, et regardez qui reçoit quoi.`;
      },
      leviers: () => [{ code: "prix", libelle: "Prix d'une enceinte, hors taxes", unite: "€", min: partsDesActeurs().prix, max: partsDesActeurs().prix + 2, pas: PAS_DU_PRIX_DES_ACTEURS, depart: partsDesActeurs().prix }],
      lecture: (_c, p) => {
        const a = partsDesActeurs(HAUSSE_DEMANDEE, p.prix!);
        const d = partsDesActeurs();
        return [
          { libelle: "Les clients : ce qu'ils paient", montant: a.ventes, reference: d.ventes },
          { libelle: "Les salariés", montant: a.salaries, reference: d.salaries },
          { libelle: "L'État", montant: a.etat, reference: d.etat },
          { libelle: "Les associés : résultat net", montant: a.associes, reference: d.associes, fort: true },
        ];
      },
      defi: () => {
        const juste = prixQuiPaieLaHausse();
        const avant = partsDesActeurs().associes;
        return {
          consigne: `Trouvez le plus petit prix, aux dix centimes, qui rend aux associés au moins leur résultat net de l'année, ${eur(avant)}, malgré la hausse.`,
          atteint: (p) => Math.abs(p.prix! - juste) < 1e-9,
          indice: (p) => {
            const a = partsDesActeurs(HAUSSE_DEMANDEE, p.prix!);
            return a.associes < avant
              ? `Le résultat net est de ${eur(a.associes)} : il manque ${eur(auCentime(avant - a.associes))}. Le prix est encore trop bas.`
              : `Le résultat net atteint ${eur(a.associes)} : un prix un peu plus bas suffirait-il ?`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const a = partsDesActeurs(HAUSSE_DEMANDEE, p.prix!);
        const d = partsDesActeurs();
        return [
          `Défi relevé : à ${eur(p.prix!)}, les clients paient ${eur(auCentime(a.ventes - d.ventes))} de plus dans l'année, et les associés retrouvent ${eur(a.associes)}. L'État y gagne aussi un peu d'impôt.`,
          `Mais le cours a gardé les ventes : si des clients partaient chez les concurrents, la hausse leur coûterait des ventes. Faire payer une demande à un autre acteur, c'est toujours un choix, que ${c.entreprise} doit chiffrer.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "pay_and_motivation"],
      texte: (c) => {
        const k = acteursEtValeur();
        return [
          `Chez ${c.entreprise}, une hausse de ${ecartEnPourcent} % des salaires donne ${eur(k.ecartDeSalaires)} de plus aux salariés. Les associés en paient ${pct(k.partDesAssocies)}, l'État ${pct(k.partDeLEtat)}. Les clients, les fournisseurs et les prêteurs n'y voient rien, tant que le prix ne bouge pas.`,
          "Les attentes des acteurs s'opposent souvent : ce que l'un gagne, un autre le perd. Le rôle du management est d'arbitrer entre elles, en chiffrant ce que chaque choix donne à chacun. Dans l'arène, une hausse des salaires motive aussi l'équipe : regardez ce qu'elle change à ce qu'elle produit.",
        ];
      },
      repere: () => "Accepter une demande d'un acteur, c'est décider qui la paie : le chiffrer, c'est voir qui gagne et qui perd.",
    },
  ],
};
