import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE TAUX DE REMPLISSAGE DES VÉHICULES (2de pro GATL, le transport et la logistique,
 * palier 1).
 *
 * Un transporteur vend des places dans ses véhicules. La capacité de la flotte est ce que tous ses
 * véhicules transportent en un trimestre ; le taux de remplissage, ce qu'ils ont transporté divisé
 * par cette capacité. L'élève calcule l'un et l'autre chez ROUTE & CIE, sur le trimestre de l'année
 * du cours où la flotte a été la moins remplie ; il range les charges du trimestre (celles qui
 * suivent les palettes chargées, celles qui restent les mêmes), calcule ce que les charges fixes
 * pèsent sur une palette quand la flotte roule à moitié vide, puis ce que rapporterait de la
 * remplir avec les clients refusés. L'arène rejoue le trimestre, la flotte remplie.
 *
 * Tout vient de l'arène, et se nomme comme l'écran le nomme : la flotte de départ et ce que chaque
 * véhicule transporte (`fleet`, `equipment.types`, « Capacité de la flotte »), les « Palettes à
 * charger » de la feuille de décision (`productionPlan`), le « Taux de remplissage » des
 * indicateurs du métier (sector-kpis.ts : palettes transportées ÷ capacité offerte du trimestre,
 * déjà réduite par la disponibilité), la demande des trois clientèles et ce qu'elles n'ont pas reçu
 * (`demandForCompany`, `lost`), le compte de résultat du trimestre (charges de structure,
 * dotations, coût variable d'une palette). Une place de camion ne se garde pas (`perishable`) :
 * une palette refusée est une vente perdue, une place vide aussi.
 *
 * Il ne double pas « Organiser l'activité » (seconde MG), qui compare la capacité de l'outil à
 * celle de l'équipe au premier trimestre : ici, l'objet est le remplissage d'une flotte, ce que
 * coûte une place vide et ce que rapporte une place remplie.
 */

/** Le chapitre suit une flotte de véhicules : seule ROUTE & CIE en a une. */
export const ENTREPRISES_DU_TRANSPORT: readonly string[] = ["transport"];

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
export const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
export const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
export const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
export const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
export const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/**
 * L'ANNÉE S'ARRÊTE À LA DÉFAILLANCE. Une entreprise défaillante ne vend plus rien les trimestres
 * suivants : ils comptent zéro, et l'année se lit jusqu'au trimestre où elle tombe.
 */
export function jusquALaDefaillance(annee: readonly CompanyRoundResult[]): readonly CompanyRoundResult[] {
  const k = annee.findIndex((r) => r.defaillant === true);
  return k < 0 ? annee : annee.slice(0, k + 1);
}

/**
 * Les palettes transportées d'un trimestre, comme l'indicateur « Taux de remplissage » les compte :
 * les ventes aux clientèles, plus les commandes fermes et la commande exceptionnelle livrées.
 */
export const transportees = (r: CompanyRoundResult) => soldUnits(r) + (r.extraOrders?.delivered ?? 0) + (r.orderOffer?.delivered ?? 0);

/** La demande que les clientèles ont adressée à l'entreprise au trimestre. */
export const demandeDuTrimestre = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);

/** Le prix moyen d'une palette vendue aux clientèles, et son coût variable (gazole, péages, entretien). */
export function prixEtCout(r: CompanyRoundResult) {
  const segments = Object.values(r.market.bySegment);
  const vendues = segments.reduce((t, v) => t + v.sold, 0);
  const prix = auCentime(segments.reduce((t, v) => t + v.revenue, 0) / vendues);
  const coutVariable = auCentime(r.breakeven.unitVariableCost);
  return { prix, coutVariable, marge: auCentime(prix - coutVariable) };
}

/** Le nom court d'une clientèle, sans ce que ses parenthèses précisent : « Bourse de fret ». */
export const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, "");

export type VerdictDuRemplissage = "toute-la-marge" | "une-partie" | "rien";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La flotte, l'année, le trimestre le moins rempli, ses charges, ses clients refusés et le trimestre rejoué. */
export function remplissage(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const v = def.vocabulary;
  const { partie, depart } = anneeJouee(c.code);
  const types = new Map((s.equipment?.types ?? []).map((t) => [t.code, t]));
  const parType = new Map<string, { nom: string; nombre: number; capacite: number }>();
  for (const lot of depart.fleet ?? []) {
    const t = types.get(lot.typeCode)!;
    const avant = parType.get(lot.typeCode) ?? { nom: t.name, nombre: 0, capacite: t.capacityPerUnit };
    parType.set(lot.typeCode, { ...avant, nombre: avant.nombre + lot.count });
  }
  const vehicules = [...parType.values()];
  const capaciteDeLaFlotte = vehicules.reduce((t, x) => t + x.nombre * x.capacite, 0);

  const annee = jusquALaDefaillance(partie.rounds.map((t) => t.results["joueur"]!));
  const trimestres = annee.map((r, k) => {
    const capacite = Math.round(r.production.machineCapacity);
    const charge = Math.round(transportees(r));
    return { numero: k + 1, capacite, transportees: charge, taux: auDixieme((charge / capacite) * 100) };
  });
  // Le trimestre où la flotte a été la moins remplie : le premier, à égalité.
  const moins = trimestres.reduce((m, x) => (x.taux < m.taux ? x : m), trimestres[0]!);
  const t = moins.numero;
  const r = annee[t - 1]!;
  const placesVides = moins.capacite - moins.transportees;

  // Les charges du trimestre : ce que les palettes chargées coûtent, ce que la flotte coûte de toute façon.
  const chargees = r.production.produced;
  const autresParPalette = s.product.otherVariableCostPerUnit;
  const gazoleParPalette = auCentime(r.breakeven.unitVariableCost - autresParPalette);
  const gazole = auCentime(chargees * gazoleParPalette);
  const autres = auCentime(chargees * autresParPalette);
  const structure = auCentime(r.incomeStatement.fixedCosts);
  const amortissements = auCentime(r.incomeStatement.depreciation);
  const chargesFixes = Math.round(structure + amortissements);
  const fixeParPalette = auCentime(chargesFixes / moins.transportees);
  const fixeParPalettePleine = auCentime(chargesFixes / moins.capacite);

  // Les clients du trimestre, clientèle par clientèle.
  const noms = new Map(s.market.segments.map((g) => [g.code, g.name]));
  const clienteles = Object.entries(r.market.bySegment).map(([code, x]) => ({
    code,
    nom: noms.get(code) ?? code,
    demandees: Math.round(x.demandForCompany),
    transportees: Math.round(x.sold),
    refusees: Math.round(x.lost),
  }));
  const demandees = Math.round(demandeDuTrimestre(r));
  const servies = Math.round(soldUnits(r));
  const refusees = Math.max(0, demandees - servies);
  const enPlus = Math.min(refusees, placesVides);
  // Les places vides viennent du chargement décidé quand l'arène a chargé tout ce qui était prévu.
  const limiteeParLeChargement = Math.abs(r.production.produced - r.production.planned) < 0.5 && placesVides > 0;
  const { prix, coutVariable, marge } = prixEtCout(r);
  const margeEnPlus = auCentime(enPlus * marge);

  // Le trimestre rejoué : autant de palettes à charger que la flotte en porte, sans dépasser la demande.
  const planRejoue = Math.min(r.production.machineCapacity, demandeDuTrimestre(r));
  const rejoue = rejouerAvec(c.code, `le-taux-de-remplissage:remplir-le-trimestre-${t}`, (tour, d) =>
    tour === t ? { ...d, productionPlan: planRejoue } : undefined,
  )[t - 1]!;
  const resultatAvant = Math.round(r.incomeStatement.operatingIncome);
  const resultatApres = Math.round(rejoue.incomeStatement.operatingIncome);
  const ecart = resultatApres - resultatAvant;
  // L'arène compte des fractions de palette : une palette d'écart au plus est l'arrondi.
  const verdict: VerdictDuRemplissage = ecart >= margeEnPlus - marge ? "toute-la-marge" : ecart > marge ? "une-partie" : "rien";
  const transporteesApres = Math.round(transportees(rejoue));
  const capaciteApres = Math.round(rejoue.production.machineCapacity);

  return {
    vocabulaire: v,
    vehicules,
    capaciteDeLaFlotte,
    toujoursDisponible: trimestres.every((x) => x.capacite === capaciteDeLaFlotte),
    trimestres,
    t,
    capacite: moins.capacite,
    transportees: moins.transportees,
    taux: moins.taux,
    placesVides,
    gazoleParPalette,
    autresParPalette,
    gazole,
    autres,
    structure,
    amortissements,
    chargesFixes,
    fixeParPalette,
    fixeParPalettePleine,
    clienteles,
    demandees,
    servies,
    refusees,
    enPlus,
    limiteeParLeChargement,
    prix,
    coutVariable,
    marge,
    margeEnPlus,
    planRejoue: Math.round(planRejoue),
    transporteesApres,
    tauxApres: auDixieme((transporteesApres / capaciteApres) * 100),
    resultatAvant,
    resultatApres,
    ecart,
    arrondi: auCentime(Math.abs(margeEnPlus - ecart)),
    verdict,
  };
}

export const LE_TAUX_DE_REMPLISSAGE: Chapitre = {
  code: "le-taux-de-remplissage",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion", "2de pro GATL · 2 · Organiser et planifier l'activité"],
  titre: "Le taux de remplissage des véhicules",
  accroche:
    "Ce que la flotte peut transporter, ce qu'elle a vraiment transporté, et ce que coûte un véhicule qui roule à moitié vide. Puis ce que rapporterait de le remplir : l'arène rejoue le trimestre.",
  objectifs: [
    "Calculer la capacité d'une flotte de véhicules",
    "Calculer un taux de remplissage et des places vides",
    "Distinguer les charges qui suivent le chargement de celles qui restent les mêmes",
    "Calculer les charges fixes d'une palette, flotte à moitié vide ou pleine",
    "Chiffrer ce que rapporterait de remplir la flotte",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TRANSPORT,
    pourquoi: "ce chapitre compte le remplissage d'une flotte de véhicules, et seule ROUTE & CIE, le transporteur, en a une.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La flotte de ROUTE & CIE",
      notions: ["capacity"],
      texte: (c) => {
        const k = remplissage(c);
        return [
          `${c.entreprise} est un transporteur : elle charge des ${c.unites} dans ses véhicules et les livre à ses clients. Chaque véhicule transporte un nombre de ${c.unites} par trimestre (voir le tableau). Tous ensemble, ils forment la capacité de la flotte : le plus que l'entreprise peut transporter en un trimestre.`,
          `Sur la feuille de décision, l'entreprise choisit chaque trimestre ses « ${k.vocabulaire.productionPlanLabel} ». Dans les indicateurs du métier, l'arène affiche son « Taux de remplissage » : les ${c.unites} transportées divisées par la capacité de la flotte.`,
          "Une place vide dans un véhicule ne se garde pas pour le trimestre suivant : elle est perdue. Et le véhicule coûte quand même son chauffeur, son assurance et son usure.",
        ];
      },
      tableau: (c) => {
        const k = remplissage(c);
        return {
          titre: `La flotte de ${c.entreprise}`,
          colonnes: ["Nombre", `${majuscule(c.unites)} par trimestre, pour un véhicule`],
          lignes: k.vehicules.map((x) => ({ libelle: x.nom, valeurs: [qte(x.nombre), qte(x.capacite)] })),
        };
      },
      repere: () => "Capacité de la flotte = nombre de véhicules × ce que transporte un véhicule, additionné pour tous les véhicules.",
    },
    {
      id: "capacite",
      type: "montants",
      titre: "La capacité de la flotte",
      notions: ["capacity"],
      question: (c) => `Calculez la capacité de la flotte de ${c.entreprise}, en ${c.unites} par trimestre.`,
      champs: (c) => {
        const k = remplissage(c);
        return [
          {
            libelle: `Capacité de la flotte (${c.unites})`,
            attendu: k.capaciteDeLaFlotte,
            calcul: `${k.vehicules.map((x) => `${qte(x.nombre)} × ${qte(x.capacite)}`).join(" + ")} = ${qte(k.capaciteDeLaFlotte)}`,
          },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        return [
          `La flotte peut transporter ${qte(k.capaciteDeLaFlotte)} ${c.unites} par trimestre : c'est la « ${k.vocabulaire.capacityLabel} » de l'écran.`,
          k.toujoursDisponible
            ? "Un véhicule à l'atelier ne roule pas, et la capacité baisse avec lui. Cette année, la flotte a roulé au complet chaque trimestre."
            : "Un véhicule à l'atelier ne roule pas, et la capacité baisse avec lui : certains trimestres, la flotte n'a pas roulé au complet.",
        ];
      },
    },
    {
      id: "remplissage",
      type: "montants",
      titre: "Le taux de remplissage",
      notions: ["capacity"],
      tableau: (c) => {
        const k = remplissage(c);
        return {
          titre: `L'année de ${c.entreprise} dans l'arène`,
          colonnes: [`Capacité de la flotte (${c.unites})`, `${majuscule(c.unites)} transportées`],
          lignes: k.trimestres.map((x) => ({ libelle: `Trimestre ${x.numero}`, valeurs: [qte(x.capacite), qte(x.transportees)] })),
        };
      },
      question: (c) => {
        const k = remplissage(c);
        return `Au trimestre ${k.t}, la flotte a été la moins remplie de l'année. Calculez son taux de remplissage (${c.unites} transportées ÷ capacité de la flotte × 100, au dixième), puis les places restées vides, en ${c.unites}.`;
      },
      champs: (c) => {
        const k = remplissage(c);
        return [
          {
            libelle: `Taux de remplissage du trimestre ${k.t} (%)`,
            attendu: k.taux,
            calcul: `${qte(k.transportees)} ÷ ${qte(k.capacite)} × 100 = ${pct(k.taux)}`,
            tolerance: 0.1,
          },
          { libelle: `Places vides au trimestre ${k.t} (${c.unites})`, attendu: k.placesVides, calcul: `${qte(k.capacite)} − ${qte(k.transportees)} = ${qte(k.placesVides)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        const autres = k.trimestres.filter((x) => x.numero !== k.t).map((x) => `${pct(x.taux)} au trimestre ${x.numero}`);
        return [
          `Au trimestre ${k.t}, la flotte n'a servi qu'à ${pct(k.taux)} : ${qte(k.placesVides)} places sont restées vides, et elles sont perdues.`,
          autres.length > 0 ? `Les autres trimestres, le taux de remplissage a été de ${autres.join(", ")}.` : "",
        ].filter((x) => x !== "");
      },
    },
    {
      id: "charges",
      type: "tri",
      titre: "Ce qui coûte, plein ou vide",
      notions: ["fixed_costs", "variable_costs"],
      question: (c) => {
        const k = remplissage(c);
        return `Voici les charges de ${c.entreprise} au trimestre ${k.t}. Rangez-les : lesquelles suivent les ${c.unites} chargées, lesquelles restent les mêmes, que les véhicules roulent pleins ou à moitié vides ?`;
      },
      categories: [
        { code: "variable", libelle: "Suit le chargement" },
        { code: "fixe", libelle: "Reste la même, plein ou vide" },
      ],
      elements: (c) => {
        const k = remplissage(c);
        return [
          {
            libelle: k.vocabulaire.materialLabel,
            montant: k.gazole,
            categorie: "variable",
            pourquoi: `Chaque ${c.unite} chargée consomme du gazole et paie sa part de péage : ${eur(k.gazoleParPalette)} par ${c.unite} ce trimestre.`,
          },
          {
            libelle: k.vocabulaire.otherVariableLabel,
            montant: k.autres,
            categorie: "variable",
            pourquoi: `L'usure des pneus, l'entretien courant et les primes de route suivent les ${c.unites} chargées : ${eur(k.autresParPalette)} par ${c.unite}.`,
          },
          {
            libelle: "Charges de structure (chauffeurs, loyers, assurances)",
            montant: k.structure,
            categorie: "fixe",
            pourquoi: "Les salaires des chauffeurs, les loyers, les assurances et la taxe à l'essieu se paient chaque trimestre, même quand les véhicules roulent à moitié vides.",
          },
          {
            libelle: "Dotations aux amortissements des véhicules",
            montant: k.amortissements,
            categorie: "fixe",
            pourquoi: "Un véhicule s'use et perd de sa valeur avec le temps, qu'il roule plein ou vide : l'arène l'amortit chaque trimestre.",
          },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        return [
          `Les charges qui suivent le chargement (${eur(auCentime(k.gazole + k.autres))}) baissent quand la flotte transporte moins. Les autres (${eur(auCentime(k.structure + k.amortissements))}) ne bougent pas : ce sont les charges fixes. Ce sont elles qui pèsent quand un véhicule roule à moitié vide.`,
        ];
      },
    },
    {
      id: "charges-fixes",
      type: "montants",
      titre: "Les charges fixes d'une palette",
      notions: ["fixed_costs"],
      question: (c) => {
        const k = remplissage(c);
        return `Calculez les charges fixes du trimestre ${k.t} (charges de structure + dotations aux amortissements, à l'euro), puis ce qu'elles pèsent sur chaque ${c.unite} transportée ce trimestre, et sur chaque ${c.unite} si la flotte avait été pleine.`;
      },
      champs: (c) => {
        const k = remplissage(c);
        return [
          { libelle: `Charges fixes du trimestre ${k.t}`, attendu: k.chargesFixes, calcul: `${eur(k.structure)} + ${eur(k.amortissements)} = ${eur(k.chargesFixes)}, à l'euro`, tolerance: 1 },
          {
            libelle: `Charges fixes par ${c.unite} transportée`,
            attendu: k.fixeParPalette,
            calcul: `${eur(k.chargesFixes)} ÷ ${qte(k.transportees)} = ${eur(k.fixeParPalette)}`,
          },
          {
            libelle: `Charges fixes par ${c.unite}, flotte pleine`,
            attendu: k.fixeParPalettePleine,
            calcul: `${eur(k.chargesFixes)} ÷ ${qte(k.capacite)} = ${eur(k.fixeParPalettePleine)}`,
          },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        return [
          `Remplie à ${pct(k.taux)}, la flotte fait porter ${eur(auCentime(k.fixeParPalette - k.fixeParPalettePleine))} de charges fixes de plus à chaque ${c.unite} qu'une flotte pleine. Les charges fixes ne baissent pas quand les véhicules sont vides : elles se partagent sur moins de ${c.unites}.`,
        ];
      },
    },
    {
      id: "refusees",
      type: "montants",
      titre: "Les clients refusés",
      notions: ["capacity", "demand_market_share"],
      tableau: (c) => {
        const k = remplissage(c);
        return {
          titre: `Les clients de ${c.entreprise} au trimestre ${k.t}`,
          colonnes: ["Demandées", "Transportées", "Refusées"],
          lignes: [
            ...k.clienteles.map((x) => ({ libelle: x.nom, valeurs: [qte(x.demandees), qte(x.transportees), qte(x.refusees)] })),
            { libelle: "Toutes les clientèles", valeurs: [qte(k.demandees), qte(k.servies), qte(k.refusees)] },
          ],
        };
      },
      question: (c) => {
        const k = remplissage(c);
        return `Au trimestre ${k.t}, les clients ont demandé plus de ${c.unites} que ${c.entreprise} n'en a chargé. D'après le tableau, combien de ${c.unites} ont été refusées ? Combien la flotte pouvait-elle en charger en plus, dans ses ${qte(k.placesVides)} places vides ?`;
      },
      champs: (c) => {
        const k = remplissage(c);
        return [
          { libelle: `${majuscule(c.unites)} refusées au trimestre ${k.t}`, attendu: k.refusees, calcul: `${qte(k.demandees)} − ${qte(k.servies)} = ${qte(k.refusees)}`, tolerance: 1 },
          {
            libelle: `${majuscule(c.unites)} en plus que la flotte pouvait charger`,
            attendu: k.enPlus,
            calcul: `le plus petit des deux nombres : ${qte(k.refusees)} ${c.unites} refusées, ${qte(k.placesVides)} places vides, soit ${qte(k.enPlus)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        return [
          k.refusees > k.placesVides
            ? `Même pleine, la flotte n'aurait pas servi tout le monde : ${qte(k.refusees - k.placesVides)} ${c.unites} seraient restées refusées. Mais ${qte(k.enPlus)} places vides pouvaient partir chargées.`
            : `Toutes les ${c.unites} refusées tenaient dans les places vides : la flotte pouvait servir tous les clients, et il lui serait resté ${qte(k.placesVides - k.refusees)} places.`,
          k.limiteeParLeChargement
            ? `Les véhicules ne manquaient pas : c'est le nombre de « ${k.vocabulaire.productionPlanLabel} » qui était trop bas.`
            : "Les places vides n'ont pas pu servir : il manquait des chauffeurs pour les conduire.",
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que rapporterait de remplir",
      notions: ["contribution_margin", "variable_costs"],
      question: (c) => {
        const k = remplissage(c);
        return `Chaque ${c.unite} en plus rapporte son prix (${eur(k.prix)} en moyenne au trimestre ${k.t}) et coûte son gazole, ses péages et son entretien (${eur(k.coutVariable)}). Les charges fixes, elles, sont déjà payées. Calculez la marge d'une ${c.unite}, puis la marge en plus si les ${qte(k.enPlus)} ${c.unites} partaient.`;
      },
      champs: (c) => {
        const k = remplissage(c);
        return [
          { libelle: `Marge par ${c.unite}`, attendu: k.marge, calcul: `${eur(k.prix)} − ${eur(k.coutVariable)} = ${eur(k.marge)}` },
          { libelle: "Marge en plus, flotte remplie", attendu: k.margeEnPlus, calcul: `${qte(k.enPlus)} × ${eur(k.marge)} = ${eur(k.margeEnPlus)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = remplissage(c);
        return [
          `Remplir la flotte au trimestre ${k.t} rapporterait ${eur(k.margeEnPlus)} de marge en plus, sans un euro de charges fixes en plus. C'est pour cela qu'un transporteur suit son taux de remplissage de près.`,
        ];
      },
    },
    {
      id: "arene",
      type: "choix",
      titre: "L'arène rejoue le trimestre",
      notions: ["contribution_margin", "fixed_costs"],
      tableau: (c) => {
        const k = remplissage(c);
        return {
          titre: `Le trimestre ${k.t} de ${c.entreprise}, rejoué`,
          colonnes: ["Comme dans l'année", "Flotte remplie"],
          lignes: [
            { libelle: `« ${k.vocabulaire.productionPlanLabel} »`, valeurs: [qte(k.transportees), qte(k.planRejoue)] },
            { libelle: `${majuscule(c.unites)} transportées`, valeurs: [qte(k.transportees), qte(k.transporteesApres)] },
            { libelle: "Taux de remplissage", valeurs: [pct(k.taux), pct(k.tauxApres)] },
            { libelle: "Résultat d'exploitation", valeurs: [eur(k.resultatAvant), eur(k.resultatApres)] },
          ],
        };
      },
      question: (c) => {
        const k = remplissage(c);
        return `L'arène a rejoué le trimestre ${k.t} avec ${qte(k.planRejoue)} « ${k.vocabulaire.productionPlanLabel} », les autres décisions du trimestre identiques. Que devient le résultat d'exploitation du trimestre ?`;
      },
      options: (c) => {
        const k = remplissage(c);
        const lu = `Le résultat passe de ${eur(k.resultatAvant)} à ${eur(k.resultatApres)}, soit ${eur(k.ecart)} de plus, pour ${eur(k.margeEnPlus)} de marge en plus calculée.`;
        return [
          {
            texte: "Il monte de toute la marge en plus : les charges fixes ne bougent pas",
            juste: k.verdict === "toute-la-marge",
            retour:
              k.verdict === "toute-la-marge"
                ? `Oui. ${lu}${k.arrondi > 0 ? ` L'écart, ${eur(k.arrondi)}, vient de l'arrondi : l'arène compte des fractions de ${c.unite}.` : ""} Les charges fixes étaient payées de toute façon : chaque place remplie apporte toute sa marge.`
                : `Non. ${lu}`,
          },
          {
            texte: "Il monte moins que la marge : les charges fixes montent aussi",
            juste: k.verdict === "une-partie",
            retour:
              k.verdict === "une-partie"
                ? `Oui. ${lu} Une partie de la marge en plus est partie ailleurs.`
                : `Non. ${lu} Les charges de structure et les amortissements restent les mêmes, que la flotte soit pleine ou non.`,
          },
          {
            texte: `Il ne monte pas : plus de ${c.unites}, c'est autant de charges en plus`,
            juste: k.verdict === "rien",
            retour:
              k.verdict === "rien"
                ? `Oui. ${lu}`
                : `Non. ${lu} Une ${c.unite} de plus ne coûte que son gazole, ses péages et son entretien (${eur(k.coutVariable)}), et elle rapporte ${eur(k.prix)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "fixed_costs"],
      texte: (c) => {
        const k = remplissage(c);
        return [
          `La flotte de ${c.entreprise} transporte ${qte(k.capaciteDeLaFlotte)} ${c.unites} par trimestre. Au trimestre ${k.t}, elle n'a été remplie qu'à ${pct(k.taux)} : chaque ${c.unite} a porté ${eur(k.fixeParPalette)} de charges fixes, contre ${eur(k.fixeParPalettePleine)} dans une flotte pleine, et ${qte(k.enPlus)} ${c.unites} refusées auraient pu partir, pour ${eur(k.margeEnPlus)} de marge en plus.`,
          "Un véhicule coûte presque autant vide que plein : ses charges fixes se paient de toute façon. Remplir les places vides, c'est faire porter ces charges par plus de palettes, et gagner la marge de chaque palette en plus. Mais une flotte remplie jusqu'au bout n'a plus de marge pour un retard ou une panne : c'est l'objet du chapitre sur les délais.",
        ];
      },
      repere: () => "Taux de remplissage = palettes transportées ÷ capacité de la flotte × 100. Places vides = capacité − palettes transportées.",
    },
  ],
};
