import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { MOTIFS } from "../../gazette/banque";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { TRIMESTRES } from "./evaluer-son-activite";
import { fournisseursDuCas } from "./taux-de-marque";

/**
 * CHAPITRE : LE COÛT MATIÈRE ET LE PRIX D'UN PLAT (BTS MHR, palier 2).
 *
 * Le calcul que le chef fait pour chaque plat de sa carte : ce que coûtent ses denrées (le coût
 * matière), la part du prix qu'elles prennent (le ratio coût matière), le coefficient qui passe
 * de l'un à l'autre, et le prix de vente, hors taxes puis toutes taxes comprises, qui garde le
 * ratio quand les denrées augmentent. Puis le ratio de l'année jouée, trimestre par trimestre, et
 * ce qu'il dit de la carte et de la cuisine.
 *
 * IL NE DOUBLE PAS « Taux de marque, taux de marge, coefficient » (BTS MCO), qui compare le prix
 * de vente au prix d'achat d'un article et change de fournisseur, ni « Prix, coût et marge », qui
 * compare le prix à tout le coût variable. Ici, les mots et les ratios de la cuisine : le coût
 * matière ne compte que les denrées, le coefficient se lit comme l'inverse du ratio visé, et le
 * ratio de l'année dit ce que la cuisine a consommé, plats préparés et non servis compris.
 *
 * LES CHIFFRES SONT CEUX DE L'ARÈNE. Le coût matière d'un couvert est celui du scénario (ses
 * denrées, au fournisseur de référence), le ticket moyen celui du cas (`cas.ts`). Le coût matière
 * consommé de chaque trimestre est celui du moteur sur l'année du cours (`anneeJouee`) : son coût
 * variable de production, moins les autres coûts variables des couverts préparés. La hausse des
 * denrées est l'événement que le scénario fait tomber dans l'année ; son récit vient de la
 * gazette de l'arène. Le taux de TVA des repas est celui que le cours applique aux ventes du
 * bistrot dans ses autres chapitres (`metiers.ts`) : le scénario, lui, compte tout hors taxes.
 */

/**
 * La fourchette de ratio que la profession vise, telle que l'arène l'écrit sous son indicateur
 * « Ratio matières » (config/scenarios/sector-kpis.ts). Le test vérifie qu'elle n'en a pas bougé.
 */
export const FOURCHETTE_DE_LA_PROFESSION = { min: 28, max: 32 } as const;

/** Les entreprises du cours qui ont une cuisine. */
export const CUISINES = ["bistrot"] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un écart entre deux ratios : des points, pas des pour cent. */
const points = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} ${Math.abs(t) >= 2 ? "points" : "point"}`;
const coef = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const rang = (k: number) => (k === 0 ? "1er" : `${k + 1}e`);
/** « 3e trimestre », dans une phrase. */
const trimestre = (k: number) => `${rang(k)} trimestre`;

export interface TrimestreDeCuisine {
  servis: number;
  prepares: number;
  /** Le coût matière d'un couvert ce trimestre : les denrées, au prix que le moteur a payé. */
  coutDuCouvert: number;
  /** Le coût matière consommé : les denrées de tous les couverts préparés. */
  denrees: number;
  chiffreDAffaires: number;
  ratio: number;
}

/** Un trimestre de la cuisine, tel que le moteur l'a joué. */
export function cuisineDuTrimestre(c: Cas, r: CompanyRoundResult): TrimestreDeCuisine {
  const autres = c.gestion.autresParUnite;
  // Le coût variable du moteur : les denrées et les autres coûts variables de chaque couvert
  // préparé. Les autres coûts ne bougent pas d'un trimestre à l'autre ; les denrées, si.
  const denrees = Math.round(r.incomeStatement.variableProductionCost - r.production.produced * autres);
  const chiffreDAffaires = Math.round(r.incomeStatement.revenue);
  return {
    servis: Math.round(soldUnits(r)),
    prepares: Math.round(r.production.produced),
    coutDuCouvert: auCentime(r.breakeven.unitVariableCost - autres),
    denrees,
    chiffreDAffaires,
    ratio: auDixieme((denrees / chiffreDAffaires) * 100),
  };
}

/** Les quatre trimestres de la cuisine, tels que le moteur les a joués. */
export const trimestresDeCuisine = (c: Cas): TrimestreDeCuisine[] =>
  anneeJouee(c.code).partie.rounds.map((tour) => cuisineDuTrimestre(c, tour.results["joueur"]!));

/** Le couvert, sa carte, la hausse des denrées de l'année, et le ratio des quatre trimestres. */
export function coutMatiere(c: Cas) {
  const g = c.gestion;
  const matiere = g.matiereParUnite;
  const prix = g.prixMoyen;
  const tauxTva = c.venteComptant.tauxTva;
  const ratio = auDixieme((matiere / prix) * 100);
  const coefficient = auCentieme(100 / ratio);
  const t = trimestresDeCuisine(c);
  // La hausse des denrées : les trimestres où le couvert a coûté plus que sa fiche.
  const touches = t.flatMap((x, k) => (x.coutDuCouvert > matiere + 0.005 ? [k] : []));
  const premier = touches[0] ?? -1;
  const coutHausse = premier >= 0 ? t[premier]!.coutDuCouvert : matiere;
  const evenement = scenarioByCode(c.code).scenario.scriptedEvents?.find((e) => e.round === premier + 1)?.eventCode;
  const prixQuiGarde = auCentime(coutHausse * coefficient);
  const denreesDeLAnnee = t.reduce((s, x) => s + x.denrees, 0);
  const chiffreDeLAnnee = t.reduce((s, x) => s + x.chiffreDAffaires, 0);
  const ratios = t.map((x) => x.ratio);
  const pire = ratios.indexOf(Math.max(...ratios));
  const p = t[pire]!;
  const perdus = p.prepares - p.servis;
  const coutDesPerdus = auCentime(perdus * p.coutDuCouvert);
  const ratioSansPerte = auDixieme(((p.denrees - coutDesPerdus) / p.chiffreDAffaires) * 100);
  return {
    fournisseur: fournisseursDuCas(c).reference.name,
    matiere,
    autres: g.autresParUnite,
    coutVariable: g.coutVariableUnitaire,
    tauxTvaAchat: c.achat.tauxTva,
    matiereTtc: auCentime(matiere * (1 + c.achat.tauxTva)),
    prix,
    tauxTva,
    prixTtc: auCentime(prix * (1 + tauxTva)),
    ratio,
    coefficient,
    dansLaFourchette: ratio >= FOURCHETTE_DE_LA_PROFESSION.min && ratio <= FOURCHETTE_DE_LA_PROFESSION.max,
    hausse: {
      trimestres: touches,
      premier,
      taux: auDixieme((coutHausse / matiere - 1) * 100),
      motif: evenement ? MOTIFS[evenement]?.motif : undefined,
      cout: coutHausse,
      ratio: auDixieme((coutHausse / prix) * 100),
      prixHt: prixQuiGarde,
      prixTtc: auCentime(prixQuiGarde * (1 + tauxTva)),
    },
    trimestres: t,
    denreesDeLAnnee,
    chiffreDeLAnnee,
    ratioDeLAnnee: auDixieme((denreesDeLAnnee / chiffreDeLAnnee) * 100),
    pire,
    perdus,
    coutDesPerdus,
    ratioSansPerte,
  };
}

/** L'année de la cuisine, trimestre par trimestre. */
export function tableauDeLaCuisine(c: Cas): TableauDeDonnees {
  const t = trimestresDeCuisine(c);
  const ligne = (libelle: string, f: (x: TrimestreDeCuisine) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `La cuisine ${dE(c.entreprise)}, trimestre par trimestre`,
    colonnes: TRIMESTRES.slice(0, t.length),
    lignes: [
      ligne("Couverts préparés", (x) => qte(x.prepares)),
      ligne("Couverts servis", (x) => qte(x.servis)),
      ligne("Coût matière d'un couvert", (x) => eur(x.coutDuCouvert)),
      ligne("Coût matière consommé", (x) => eur(x.denrees)),
      ligne("Chiffre d'affaires HT", (x) => eur(x.chiffreDAffaires)),
    ],
  };
}

export const LE_COUT_MATIERE: Chapitre = {
  code: "le-cout-matiere",
  parcours: "mhr",
  palier: 2,
  blocs: [
    "BTS MHR Bloc 1 · Conception et production de services en hôtellerie restauration",
    "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
  ],
  titre: "Le coût matière et le prix d'un plat",
  accroche:
    "Ce que coûtent les denrées d'un couvert, la part du prix qu'elles prennent, le coefficient qui en sort et le prix de la carte. Puis le ratio de l'année, et ce qu'il dit de la cuisine.",
  objectifs: [
    "Dire ce qui entre dans le coût matière d'un plat",
    "Calculer le ratio coût matière et le coefficient multiplicateur",
    "Fixer le prix de vente HT et TTC qui garde le ratio quand les denrées augmentent",
    "Calculer le ratio coût matière d'un trimestre et de l'année",
    "Chiffrer ce que coûtent les plats préparés et non servis",
  ],
  libre: false,
  entreprises: {
    codes: CUISINES,
    pourquoi: "le coût matière est celui des denrées qu'une cuisine transforme en plats, et elle n'a pas de cuisine.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La fiche technique du couvert",
      notions: ["variable_costs", "markup_coefficient"],
      texte: (c) => {
        const m = coutMatiere(c);
        const v = scenarioByCode(c.code).vocabulary;
        return [
          `Chez ${c.entreprise}, la cuisine raisonne au couvert. Les denrées d'un couvert coûtent ${eur(m.matiere)} hors taxes chez le fournisseur de référence, « ${m.fournisseur} ». S'y ajoutent ${eur(m.autres)} d'autres coûts variables (${v.otherVariableLabel.toLowerCase()}). Le client paie en moyenne ${eur(m.prix)} hors taxes : c'est le ticket moyen de l'arène.`,
          "Le coût matière d'un plat, c'est ce que coûtent ses denrées, hors taxes : la fiche technique les additionne, ingrédient par ingrédient, pour une portion. Le restaurateur le compare au prix de vente hors taxes : la part que les denrées prennent, c'est le ratio coût matière.",
        ];
      },
      repere: () =>
        "Ratio coût matière = coût matière ÷ chiffre d'affaires HT × 100. Coefficient multiplicateur = prix de vente HT ÷ coût matière : c'est 100 divisé par le ratio.",
      tableau: (c) => {
        const m = coutMatiere(c);
        const v = scenarioByCode(c.code).vocabulary;
        return {
          titre: `Le couvert ${dE(c.entreprise)}`,
          colonnes: ["Par couvert"],
          lignes: [
            { libelle: v.materialLabel, valeurs: [eur(m.matiere)] },
            { libelle: v.otherVariableLabel, valeurs: [eur(m.autres)] },
            { libelle: "Ticket moyen HT", valeurs: [eur(m.prix)] },
          ],
        };
      },
    },
    {
      id: "ce-qui-entre",
      type: "choix",
      titre: "Ce qui entre dans le coût matière",
      notions: ["variable_costs"],
      question: () => "Pour calculer le ratio coût matière d'un couvert, quel coût le chef retient-il ?",
      options: (c) => {
        const m = coutMatiere(c);
        return [
          {
            texte: `Les denrées seules, hors taxes : ${eur(m.matiere)}`,
            juste: true,
            retour: `Oui. Le coût matière ne compte que les denrées, et hors taxes, comme le prix auquel on le compare. Les ${eur(m.autres)} d'énergie et de commissions sont bien des coûts du couvert, mais pas de la matière.`,
          },
          {
            texte: `Tout le coût variable du couvert : ${eur(m.coutVariable)}`,
            juste: false,
            retour: `Ce sont les denrées et les ${eur(m.autres)} d'énergie et de commissions. Le chapitre « Prix, coût et marge » compare le prix à ce coût-là ; le ratio de la cuisine ne prend que les denrées.`,
          },
          {
            texte: `Les denrées, TVA de ${pct(m.tauxTvaAchat * 100)} comprise : ${eur(m.matiereTtc)}`,
            juste: false,
            retour: "La TVA payée au fournisseur se récupère : elle ne coûte rien au restaurant. Et le prix de vente auquel on compare le coût matière est hors taxes : les deux se comptent hors taxes.",
          },
        ];
      },
    },
    {
      id: "le-ratio-du-couvert",
      type: "montants",
      titre: "Le ratio et le coefficient",
      notions: ["markup_coefficient", "margin_rates"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Le couvert coûte ${eur(m.matiere)} de denrées et se vend ${eur(m.prix)} HT. Calculez son ratio coût matière, en pourcentage, au dixième. Puis le coefficient multiplicateur qui en découle : 100 divisé par le ratio, au centième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        return [
          { libelle: "Ratio coût matière (%)", attendu: m.ratio, calcul: `${eur(m.matiere)} ÷ ${eur(m.prix)} × 100 = ${pct(m.ratio)}`, tolerance: 0.1 },
          { libelle: "Coefficient multiplicateur", attendu: m.coefficient, calcul: `100 ÷ ${pct(m.ratio).replace(" %", "")} = ${coef(m.coefficient)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const f = FOURCHETTE_DE_LA_PROFESSION;
        return [
          `Sur ${eur(m.prix)} de ticket, ${eur(m.matiere)} paient les denrées : ${pct(m.ratio)}. Le coefficient de ${coef(m.coefficient)} dit la même chose dans l'autre sens : le prix hors taxes vaut ${coef(m.coefficient)} fois le coût matière.`,
          m.dansLaFourchette
            ? `Sous son indicateur « Ratio matières », l'arène rappelle que la profession vise ${f.min} à ${f.max} % : la carte ${dE(c.entreprise)} y est.`
            : `Sous son indicateur « Ratio matières », l'arène rappelle que la profession vise ${f.min} à ${f.max} % : la carte ${dE(c.entreprise)} en sort.`,
        ];
      },
    },
    {
      id: "la-hausse",
      type: "montants",
      titre: "Les denrées augmentent",
      notions: ["material_price_variance", "margin_rates"],
      si: (c) => coutMatiere(c).hausse.premier >= 0,
      question: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        const duree =
          h.trimestres.length > 1 ? `Elle dure jusqu'au ${trimestre(h.trimestres[h.trimestres.length - 1]!)} compris.` : "Elle ne dure que ce trimestre.";
        return `Au ${trimestre(h.premier)} de l'année jouée, les denrées augmentent de ${pct(h.taux)}${h.motif ? ` : ${h.motif}` : ""}. ${duree} Calculez le nouveau coût matière d'un couvert, puis son ratio si le ticket reste à ${eur(m.prix)} HT, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          { libelle: "Nouveau coût matière", attendu: h.cout, calcul: `${eur(m.matiere)} × ${coef(1 + h.taux / 100)} = ${eur(h.cout)}` },
          { libelle: "Ratio au même ticket (%)", attendu: h.ratio, calcul: `${eur(h.cout)} ÷ ${eur(m.prix)} × 100 = ${pct(h.ratio)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          `Au même prix, le ratio passe de ${pct(m.ratio)} à ${pct(h.ratio)} : ${points(auDixieme(h.ratio - m.ratio))} de plus. Chaque couvert laisse ${eur(auCentime(h.cout - m.matiere))} de moins pour payer la brigade, la salle et le loyer.`,
        ];
      },
    },
    {
      id: "le-prix-du-plat",
      type: "montants",
      titre: "Le prix qui garde le ratio",
      notions: ["markup_coefficient", "vat_payable"],
      si: (c) => coutMatiere(c).hausse.premier >= 0,
      question: (c) => {
        const m = coutMatiere(c);
        return `Pour garder son ratio, le chef applique le même coefficient, ${coef(m.coefficient)}, au nouveau coût matière de ${eur(m.hausse.cout)}. Calculez le prix de vente HT, puis le prix TTC. L'arène compte tout hors taxes : le cours applique aux repas du bistrot une TVA de ${pct(m.tauxTva * 100)}.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          // Le coefficient arrondi au centième que l'élève a gardé déplace le prix d'un centime.
          { libelle: "Prix de vente HT", attendu: h.prixHt, calcul: `${eur(h.cout)} × ${coef(m.coefficient)} = ${eur(h.prixHt)}`, tolerance: 0.05 },
          { libelle: "Prix de vente TTC", attendu: h.prixTtc, calcul: `${eur(h.prixHt)} × ${coef(1 + m.tauxTva)} = ${eur(h.prixTtc)}`, tolerance: 0.06 },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const h = m.hausse;
        return [
          `Sur la carte, le couvert passerait de ${eur(m.prixTtc)} à ${eur(h.prixTtc)} TTC. Le ratio serait sauf, mais le client paierait ${eur(auCentime(h.prixTtc - m.prixTtc))} de plus : reste à savoir s'il suivra. La TVA ne change rien au ratio : elle n'est pas au restaurant, il la reverse à l'État.`,
        ];
      },
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Le ratio de l'année",
      notions: ["margin_rates", "variable_costs"],
      tableau: tableauDeLaCuisine,
      question: (c) => {
        const m = coutMatiere(c);
        return `Le tableau donne l'année jouée : le coût matière consommé est celui de tous les couverts préparés. Calculez le coût matière consommé de l'année, son ratio (divisé par le chiffre d'affaires HT de l'année), puis le ratio du ${trimestre(m.pire)}, le plus élevé, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire]!;
        return [
          {
            libelle: "Coût matière de l'année",
            attendu: m.denreesDeLAnnee,
            calcul: `${m.trimestres.map((x) => eur(x.denrees)).join(" + ")} = ${eur(m.denreesDeLAnnee)}`,
          },
          {
            libelle: "Ratio de l'année (%)",
            attendu: m.ratioDeLAnnee,
            calcul: `${eur(m.denreesDeLAnnee)} ÷ ${eur(m.chiffreDeLAnnee)} × 100 = ${pct(m.ratioDeLAnnee)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Ratio du ${trimestre(m.pire)} (%)`,
            attendu: p.ratio,
            calcul: `${eur(p.denrees)} ÷ ${eur(p.chiffreDAffaires)} × 100 = ${pct(p.ratio)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        return [
          `Trimestre par trimestre, le ratio a fait ${m.trimestres.map((x) => pct(x.ratio)).join(", ")}. Sur l'année, ${pct(m.ratioDeLAnnee)}, quand la fiche du couvert promettait ${pct(m.ratio)}.`,
        ];
      },
    },
    {
      id: "les-denrees-perdues",
      type: "montants",
      titre: "Les plats préparés et non servis",
      notions: ["variable_costs", "material_price_variance"],
      question: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire]!;
        return `Au ${trimestre(m.pire)}, la cuisine a préparé ${qte(p.prepares)} couverts et en a servi ${qte(p.servis)}. Ce qui n'est pas servi part à la poubelle, et ses denrées sont payées. Calculez les couverts préparés et non servis, le coût de leurs denrées à ${eur(p.coutDuCouvert)} le couvert, puis le ratio du trimestre sans ces pertes, au dixième.`;
      },
      champs: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire]!;
        return [
          { libelle: "Couverts préparés et non servis", attendu: m.perdus, calcul: `${qte(p.prepares)} − ${qte(p.servis)} = ${qte(m.perdus)}` },
          { libelle: "Coût des denrées perdues", attendu: m.coutDesPerdus, calcul: `${qte(m.perdus)} × ${eur(p.coutDuCouvert)} = ${eur(m.coutDesPerdus)}`, tolerance: 1 },
          {
            libelle: "Ratio sans les pertes (%)",
            attendu: m.ratioSansPerte,
            calcul: `(${eur(p.denrees)} − ${eur(m.coutDesPerdus)}) ÷ ${eur(p.chiffreDAffaires)} × 100 = ${pct(m.ratioSansPerte)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = coutMatiere(c);
        const p = m.trimestres[m.pire]!;
        const pertes = auDixieme(p.ratio - m.ratioSansPerte);
        const prixDesDenrees = auDixieme(m.ratioSansPerte - m.ratio);
        return [
          prixDesDenrees > 0
            ? `Le ratio de ${pct(p.ratio)} se lit en trois morceaux : ${pct(m.ratio)} pour la carte telle qu'elle est calculée, ${points(prixDesDenrees)} de plus pour le prix des denrées, et ${points(pertes)} de plus pour les plats préparés et non servis.`
            : `Le ratio de ${pct(p.ratio)} se lit en deux morceaux : ${pct(m.ratioSansPerte)} pour les couverts servis, et ${points(pertes)} de plus pour les plats préparés et non servis.`,
          `Les denrées perdues ont coûté ${eur(m.coutDesPerdus)} sans rien rapporter : c'est le premier poste que la cuisine surveille.`,
        ];
      },
    },
    {
      id: "ce-que-dit-le-ratio",
      type: "choix",
      titre: "Ce que le ratio dit de la carte",
      notions: ["margin_rates", "material_price_variance"],
      question: (c) => {
        const m = coutMatiere(c);
        return `Le ratio de l'année est de ${pct(m.ratioDeLAnnee)}, quand la fiche du couvert en promettait ${pct(m.ratio)}. Que dit cet écart ?`;
      },
      options: (c) => {
        const m = coutMatiere(c);
        return [
          {
            texte: "Le prix n'a pas suivi les denrées, et la cuisine a trop préparé.",
            juste: true,
            retour: `Oui. Le ticket est resté à ${eur(m.prix)} quand les denrées montaient, et une partie des plats est partie à la poubelle. Le ratio ne juge pas seulement la carte : il juge aussi ce que la cuisine prépare.`,
          },
          {
            texte: "Le ticket moyen est trop élevé pour la clientèle du quartier.",
            juste: false,
            retour: `Le ticket n'a pas bougé de l'année. Et un prix plus haut ferait baisser le ratio, pas monter : le coût matière se divise par le prix.`,
          },
          {
            texte: "Le bistrot a servi beaucoup de couverts : il a consommé plus de denrées.",
            juste: false,
            retour: "Le ratio est un rapport : un couvert servi apporte ses denrées et son prix à la fois. Ce sont les couverts préparés sans être servis qui le font monter, et le prix des denrées.",
          },
        ];
      },
    },
  ],
};
