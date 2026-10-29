import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { serviceDuCours, type ServiceDeLAnnee } from "../monde/service";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA PRODUCTIVITÉ DU SERVICE, COUVERTS ET CHAMBRES PAR SALARIÉ (BTS MHR, palier 3).
 *
 * Ce que sert le personnel d'un restaurant ou d'un hôtel, et ce qu'il coûte par client servi :
 * les couverts du bistrot, les nuitées de l'hôtel (une nuitée, c'est une chambre louée pour une
 * nuit), par salarié sur le trimestre et par salarié et par jour, puis le coût du personnel par
 * couvert ou par nuitée vendue. L'élève les calcule au trimestre le plus chargé de l'année et au
 * plus creux, et voit ce que montre l'écart : l'équipe est la même et payée pareil, seule
 * l'activité change ; la productivité suit l'activité, et le coût du personnel par client la suit
 * à l'envers. Puis la productivité la plus haute que la capacité de service permet, et ce qui
 * remplit le trimestre creux.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le bistrot
 * (LA TABLE D'AUGUSTIN) et l'hôtel (L'ESCALE) ont une fiche figée, et le modèle du service
 * (monde/service.ts) en tire l'année au prix de l'année : chaque trimestre, l'établissement sert
 * la demande de ses clientèles, dans la limite de ce que la salle ou les chambres permettent.
 * L'équipe est celle de la fiche : le même effectif, payé pareil chaque trimestre. Une évolution
 * du moteur de l'arène ne change rien ici.
 *
 * Ce que le chapitre ne double pas : « L'équipe et son planning » (BTS MCO) compte le coût d'une
 * heure, le chiffre d'affaires par salarié et la part du personnel sur le mois du cas ;
 * « L'effectif et la masse salariale » (bac STMG), la masse salariale de l'année. Ici, l'unité de
 * mesure est le client servi, et l'objet est sa variation d'un trimestre à l'autre.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, plein, creux (la formule est au repère, la question nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-cout puis
 *     remplir-le-creux-au-curseur (les clients du trimestre creux, face à la part du prix que le
 *     personnel peut prendre) avant ecart ; predire-l-equipe puis l-equipe-au-curseur (l'équipe la
 *     plus grande que le trimestre creux pouvait payer, sans un client de plus) avant l-equipe-du-creux ;
 *   · autonome : ecart, pourquoi, plafond, remplir-le-creux, l-equipe-du-creux (ni formule ni
 *     chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : l-equipe-du-creux (croiser le coût du personnel et la productivité qu'une équipe réduite
 *     demande), le-laboratoire-de-l-equipe (l'effectif et les clients du trimestre creux : retrouver
 *     le coût par client du trimestre le plus chargé sans demander plus à chaque salarié ; le coût par
 *     client ne dépend que de la productivité), une-equipe-de-plus (une variante chiffrée, à rebours :
 *     les clients qu'un salarié de plus doit faire servir sur l'année), juger-l-equipe (une critique
 *     de l'indicateur) ; puis la synthèse.
 */

/** Les deux entreprises du métier : le restaurant et l'hôtel. */
export const ENTREPRISES_DU_SERVICE: readonly string[] = ["bistrot", "hotel"];

/**
 * LA PART DU PRIX QUE LE PERSONNEL PEUT PRENDRE, hypothèse du cours : un repère de gestion, autour de
 * 30 % du chiffre d'affaires en restauration traditionnelle comme dans un hôtel de ville. Le coût du
 * personnel par client ne devrait pas dépasser 30 % du ticket moyen, ou du prix de la nuitée.
 */
export const PART_DU_PRIX_POUR_LE_PERSONNEL = 0.3;

/** LA VARIANTE, hypothèse du cours : un salarié de plus toute l'année, au même coût que les autres. */
export const SALARIES_EN_PLUS = 1;

/** Les mots du service, dans chaque établissement. */
interface Mots {
  servies: string;
  etablissement: string;
  /** Le participe de ce que l'équipe fait d'une unité : « servi », « vendu ». */
  servir: string;
  /** Le même verbe, à l'infinitif puis à l'imparfait. */
  infinitif: string;
  imparfait: string;
  /** Ce qui borne l'activité d'un trimestre, en libellé de tableau puis dans une phrase. */
  capacite: (s: ServiceDeLAnnee) => string;
  plafond: string;
  /** Le prix d'une unité, tel qu'on le dit dans le métier. */
  prix: string;
  votre: string;
}
const MOTS: Record<string, Mots> = {
  bistrot: {
    servies: "couverts servis",
    etablissement: "le bistrot",
    servir: "servi",
    infinitif: "servir",
    imparfait: "servait",
    capacite: (s) => `Couverts servables (${s.parJour.toLocaleString("fr-FR")} par jour)`,
    plafond: "ce que la salle et la cuisine peuvent servir",
    prix: "ticket moyen",
    votre: "votre bistrot",
  },
  hotel: {
    servies: "nuitées vendues",
    etablissement: "l'hôtel",
    servir: "vendu",
    infinitif: "vendre",
    imparfait: "vendait",
    capacite: (s) => `Nuitées offertes (${s.parJour.toLocaleString("fr-FR")} chambres chaque nuit)`,
    plafond: "ce que les chambres peuvent accueillir",
    prix: "prix de la nuitée",
    votre: "votre hôtel",
  },
};

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Le retour d'un pari : il ne corrige pas encore, il renvoie à l'expérience. */
const pari = (juste: boolean) => (juste ? "Bon pari." : "Pari à vérifier.");

/** Un trimestre de l'année du cours, vu par le personnel. */
export interface TrimestreDuService {
  /** Le rang du trimestre dans l'année, à partir de 1. */
  numero: number;
  effectif: number;
  /** Le coût du personnel du trimestre : l'effectif, au coût d'un salarié. */
  personnel: number;
  /** Ce que l'équipe a servi : les couverts servis, ou les nuitées vendues. */
  vendues: number;
  demande: number;
  /** Ce que l'établissement peut servir : couverts servables ou nuitées offertes. */
  capacite: number;
  /** Les clients repartis sans être servis, faute de place. */
  refuses: number;
  parSalarie: number;
  parSalarieEtParJour: number;
  coutParUnite: number;
}

/** L'année du cours, trimestre par trimestre, et ce que le chapitre en tire. */
export function productiviteDuService(c: Pick<Cas, "code">) {
  const s = serviceDuCours(c.code);
  const jours = s.joursParTrimestre;
  const { effectif, coutParSalarieParTrimestre } = s.equipe;
  // La même équipe, payée pareil chaque trimestre : le même coût du personnel toute l'année.
  const personnel = auCentime(effectif * coutParSalarieParTrimestre);
  const trimestres: TrimestreDuService[] = s.trimestres.map((t) => ({
    numero: t.numero,
    effectif,
    personnel,
    vendues: t.servis,
    demande: t.demande,
    capacite: t.capacite,
    refuses: t.refuses,
    parSalarie: auDixieme(t.servis / effectif),
    parSalarieEtParJour: auCentieme(t.servis / (effectif * jours)),
    coutParUnite: auCentime(personnel / t.servis),
  }));
  const plein = trimestres.reduce((a, b) => (b.vendues > a.vendues ? b : a));
  const creux = trimestres.reduce((a, b) => (b.vendues < a.vendues ? b : a));
  const capacite = creux.capacite;
  return {
    s,
    entreprise: s.entreprise,
    /** L'unité, que `accord` accorde : « couvert » ou « nuitée ». */
    unite: s.unite,
    unites: s.unites,
    mots: MOTS[c.code]!,
    jours,
    coutDUnSalarie: coutParSalarieParTrimestre,
    prix: s.prixDeLAnnee,
    trimestres,
    plein,
    creux,
    variationDeLaProductivite: auDixieme((creux.parSalarie / plein.parSalarie - 1) * 100),
    variationDuCout: auDixieme((creux.coutParUnite / plein.coutParUnite - 1) * 100),
    capacite,
    productiviteMaximale: auDixieme(capacite / creux.effectif),
    coutPlancher: auCentime(creux.personnel / capacite),
    remplissageDuPlein: auDixieme((plein.vendues / plein.capacite) * 100),
    remplissageDuCreux: auDixieme((creux.vendues / capacite) * 100),
    /** La place qui restait au trimestre creux, avec la même équipe. */
    placeAuCreux: capacite - creux.vendues,
    partDuPersonnelAuCreux: auDixieme((creux.coutParUnite / s.prixDeLAnnee) * 100),
    ...repereDuPersonnel(s, creux),
  };
}

/**
 * Ce que le chapitre tire de la part du prix que le personnel peut prendre : le coût visé par client,
 * les clients qu'il fallait au trimestre creux avec la même équipe, l'équipe la plus grande qu'il
 * pouvait payer sans un client de plus, et la variante d'un salarié de plus sur l'année.
 */
function repereDuPersonnel(s: ServiceDeLAnnee, creux: TrimestreDuService) {
  const { effectif, coutParSalarieParTrimestre } = s.equipe;
  const coutVise = auCentime(PART_DU_PRIX_POUR_LE_PERSONNEL * s.prixDeLAnnee);
  const clientsVises = Math.ceil(creux.personnel / coutVise - 1e-9);
  const permisAuCreux = auCentime(coutVise * creux.vendues);
  const equipeMax = Math.floor(permisAuCreux / coutParSalarieParTrimestre + 1e-9);
  const personnelReduit = auCentime(equipeMax * coutParSalarieParTrimestre);
  const variante = auCentime((effectif + SALARIES_EN_PLUS) * coutParSalarieParTrimestre * s.trimestres.length);
  const venduesDeLAnnee = s.trimestres.reduce((t, x) => t + x.servis, 0);
  const clientsDeLaVariante = Math.ceil(variante / coutVise - 1e-9);
  return {
    coutVise,
    clientsVises,
    permisAuCreux,
    equipeMax,
    personnelReduit,
    coutParUniteReduit: auCentime(personnelReduit / creux.vendues),
    parJourReduit: auCentieme(creux.vendues / (equipeMax * s.joursParTrimestre)),
    variante: {
      effectif: effectif + SALARIES_EN_PLUS,
      personnel: variante,
      clients: clientsDeLaVariante,
      enPlus: clientsDeLaVariante - venduesDeLAnnee,
      venduesDeLAnnee,
      capaciteDeLAnnee: s.trimestres.reduce((t, x) => t + x.capacite, 0),
      refusesDeLAnnee: s.trimestres.reduce((t, x) => t + x.refuses, 0),
    },
  };
}

export type ProductiviteDuService = ReturnType<typeof productiviteDuService>;

/**
 * LE LABORATOIRE DE L'ÉQUIPE : le trimestre creux, avec un effectif et des clients servis quelconques
 * (de la demande du trimestre creux à la capacité, par dizaine). Le défi : un coût du personnel par
 * client au plus celui du trimestre le plus chargé, sans demander à un salarié plus de clients par jour
 * qu'à ce trimestre-là. Les deux conditions se comparent en nombres entiers, sans arrondi. La solution
 * montrée : le moins de clients qui le relève, et l'équipe qui va avec.
 */
export function laboratoireDeLEquipe(c: Pick<Cas, "code">) {
  const p = productiviteDuService(c);
  const cs = p.coutDUnSalarie;
  const { creux, plein } = p;
  const leviers = {
    effectif: { min: 1, max: 2 * creux.effectif, pas: 1 },
    servis: { min: creux.demande, max: p.capacite, pas: 10 },
  };
  const lire = (effectif: number, servis: number) => {
    const personnel = auCentime(effectif * cs);
    return {
      personnel,
      coutParUnite: auCentime(personnel / servis),
      parJour: auCentieme(servis / (effectif * p.jours)),
      part: auDixieme((personnel / (servis * p.prix)) * 100),
    };
  };
  const atteint = (effectif: number, servis: number) =>
    effectif * cs * plein.vendues <= plein.personnel * servis && servis * plein.effectif <= plein.vendues * effectif;
  let solution: { effectif: number; servis: number } | null = null;
  for (let n = leviers.servis.min; n <= leviers.servis.max && !solution; n += leviers.servis.pas) {
    for (let e = leviers.effectif.min; e <= leviers.effectif.max && !solution; e++) if (atteint(e, n)) solution = { effectif: e, servis: n };
  }
  if (!solution) throw new Error(`${p.entreprise} : le laboratoire de l'équipe n'a pas de solution`);
  return { p, leviers, lire, atteint, depart: { effectif: creux.effectif, servis: creux.vendues }, solution };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const p = productiviteDuService(c);
  return {
    titre: `L'année ${dE(p.entreprise)} dans la simulation du cours`,
    colonnes: p.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      { libelle: majuscule(p.mots.servies), valeurs: p.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Effectif", valeurs: p.trimestres.map((t) => `${qte(t.effectif)} salariés`) },
      { libelle: "Coût du personnel du trimestre", valeurs: p.trimestres.map((t) => eur(t.personnel)) },
    ],
  };
}

/** Les trois champs d'un trimestre : par salarié, par salarié et par jour, et le coût par unité. */
function champsDuTrimestre(p: ProductiviteDuService, t: TrimestreDuService) {
  const u = p.unites;
  return [
    {
      libelle: `${majuscule(u)} par salarié sur le trimestre`,
      attendu: t.parSalarie,
      calcul: `${qte(t.vendues)} ÷ ${qte(t.effectif)} = ${qte(t.parSalarie)}`,
      tolerance: 0.1,
    },
    {
      libelle: `${majuscule(u)} par salarié et par jour`,
      attendu: t.parSalarieEtParJour,
      calcul: `${qte(t.vendues)} ÷ (${qte(t.effectif)} × ${qte(p.jours)}) = ${qte(t.parSalarieEtParJour)}`,
      tolerance: 0.01,
    },
    {
      libelle: `Coût du personnel par ${p.unite}`,
      attendu: t.coutParUnite,
      calcul: `${eur(t.personnel)} ÷ ${qte(t.vendues)} = ${eur(t.coutParUnite)}`,
    },
  ];
}

export const LA_PRODUCTIVITE_DU_SERVICE: Chapitre = {
  code: "la-productivite-du-service",
  parcours: "mhr",
  palier: 3,
  blocs: ["BTS MHR Bloc 3 · Management de la production de services en hôtellerie restauration"],
  titre: "La productivité du service : couverts et chambres par salarié",
  accroche:
    "Combien de couverts ou de chambres louées chaque salarié sert, et ce que le personnel coûte par client, au trimestre le plus chargé et au plus creux : avec une équipe fixe, la productivité suit l'activité.",
  objectifs: [
    "Calculer la productivité du personnel : couverts ou nuitées par salarié, sur le trimestre et par jour",
    "Calculer le coût du personnel par couvert servi ou par nuitée vendue",
    "Comparer un trimestre plein et un trimestre creux, et expliquer l'écart",
    "Calculer la productivité la plus haute que la capacité de service permet",
    "Dire ce qui fait baisser le coût du personnel par client au trimestre creux",
    "Remonter d'un repère de coût aux clients ou à l'équipe qu'il exige, et juger la productivité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SERVICE,
    pourquoi:
      "ce chapitre compte ce que sert le personnel d'un restaurant ou d'un hôtel : des couverts au bistrot, des chambres louées à l'hôtel.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une équipe fixe, une activité qui varie",
      notions: ["productivity", "payroll"],
      tableau: tableauDeLAnnee,
      texte: (c) => {
        const p = productiviteDuService(c);
        return [
          c.code === "hotel"
            ? `Ce chapitre se joue dans la simulation du cours. ${p.entreprise} a ${qte(p.s.parJour)} chambres, toutes en vente chaque nuit : ${qte(p.capacite)} nuitées offertes par trimestre de ${qte(p.jours)} jours. Chaque trimestre, l'hôtel vend les nuitées que ses clients lui demandent au prix de ${eur(p.prix)}, dans cette limite : au-delà, les clients repartent sans chambre.`
            : `Ce chapitre se joue dans la simulation du cours. La salle et la cuisine ${dE(p.entreprise)} peuvent servir ${qte(p.s.parJour)} couverts par jour : ${qte(p.capacite)} par trimestre de ${qte(p.jours)} jours. Chaque trimestre, le bistrot sert les couverts que ses clients lui demandent au ticket moyen de ${eur(p.prix)}, dans cette limite : au-delà, les clients repartent sans être servis.`,
          `L'équipe est la même toute l'année : ${qte(p.creux.effectif)} salariés, qui coûtent chacun ${eur(p.coutDUnSalarie)} par trimestre, salaire et cotisations patronales. Cela fait ${eur(p.creux.personnel)} pour toute l'équipe, que ${p.mots.etablissement} soit plein ou non : dans la simulation, cette paie fait partie des ${eur(p.s.chargesFixesParTrimestre)} de charges fixes du trimestre.`,
          c.code === "hotel"
            ? "À l'hôtel, ce que l'équipe sert se compte en nuitées : une nuitée, c'est une chambre louée pour une nuit. Le tableau donne les nuitées vendues de chaque trimestre de l'année."
            : "Au restaurant, ce que l'équipe sert se compte en couverts : un couvert, c'est un client servi à table. Le tableau donne les couverts servis de chaque trimestre de l'année.",
          `La productivité du personnel rapporte ce qui a été servi à ceux qui l'ont servi. Le coût du personnel par ${p.unite} dit ce que l'équipe pèse sur chaque client.`,
        ];
      },
      repere: (c) => {
        const p = productiviteDuService(c);
        return `Productivité du personnel = ${p.unites} du trimestre ÷ effectif. Coût du personnel par ${p.unite} = coût du personnel du trimestre ÷ ${p.unites} du trimestre.`;
      },
    },
    {
      id: "plein",
      objectifs: [0, 1],
      type: "montants",
      titre: "Le trimestre le plus chargé",
      notions: ["productivity"],
      question: (c) => {
        const p = productiviteDuService(c);
        const t = p.plein;
        return `Au ${rang(t.numero)} trimestre, le plus chargé de l'année, ${p.entreprise} a ${p.mots.servir} ${qte(t.vendues)} ${p.unites} avec ${qte(t.effectif)} salariés, pour ${eur(t.personnel)} de personnel. Calculez les ${p.unites} par salarié sur le trimestre (au dixième), par salarié et par jour (sur les ${qte(p.jours)} jours du trimestre, au centième), puis le coût du personnel par ${p.unite} (au centime).`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return champsDuTrimestre(p, p.plein);
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const t = p.plein;
        return [
          `Au plus fort de l'année, chaque salarié correspond à ${qte(t.parSalarie)} ${p.unites} sur le trimestre, soit ${qte(t.parSalarieEtParJour)} par jour, et le personnel coûte ${eur(t.coutParUnite)} par ${p.unite}, pour un ${p.mots.prix} de ${eur(p.prix)}.`,
        ];
      },
    },
    {
      id: "creux",
      objectifs: [0, 1],
      type: "montants",
      titre: "Le trimestre le plus creux",
      notions: ["productivity"],
      question: (c) => {
        const p = productiviteDuService(c);
        const t = p.creux;
        return `Au ${rang(t.numero)} trimestre, le plus creux de l'année, ${p.entreprise} n'a ${p.mots.servir} que ${qte(t.vendues)} ${p.unites}, avec ${qte(t.effectif)} salariés et ${eur(t.personnel)} de personnel. Faites les mêmes calculs : par salarié sur le trimestre, par salarié et par jour, puis le coût du personnel par ${p.unite}.`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return champsDuTrimestre(p, p.creux);
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const t = p.creux;
        return [
          `Au trimestre creux, chaque salarié ne correspond plus qu'à ${qte(t.parSalarieEtParJour)} ${p.unites} par jour, et le personnel coûte ${eur(t.coutParUnite)} par ${p.unite} : ${pct(p.partDuPersonnelAuCreux)} du ${p.mots.prix}, ${eur(p.prix)}.`,
        ];
      },
    },
    {
      id: "predire-le-cout",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le coût du creux",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const p = productiviteDuService(c);
        const baisse = auDixieme((1 - p.creux.vendues / p.plein.vendues) * 100);
        return `Avant de calculer, pariez. Du ${rang(p.plein.numero)} trimestre au ${rang(p.creux.numero)}, ${p.entreprise} sert ${pct(baisse)} de ${p.unites} de moins, avec la même équipe, payée pareil. Le coût du personnel par ${p.unite} va monter…`;
      },
      options: (c) => {
        const p = productiviteDuService(c);
        const baisse = pct(auDixieme((1 - p.creux.vendues / p.plein.vendues) * 100));
        const voir = "Faites varier les clients du trimestre creux au curseur de l'étape suivante, et regardez ce que coûte chacun.";
        const monte = p.variationDuCout;
        const recule = -p.variationDeLaProductivite;
        return [
          { texte: `D'autant, ${baisse}`, juste: monte === recule, retour: `${pari(monte === recule)} ${voir}` },
          { texte: `De plus de ${baisse}`, juste: monte > recule, retour: `${pari(monte > recule)} ${voir}` },
          { texte: `De moins de ${baisse}`, juste: monte < recule, retour: `${pari(monte < recule)} ${voir}` },
        ];
      },
    },
    {
      id: "remplir-le-creux-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le trimestre creux au curseur",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const p = productiviteDuService(c);
        const min = Math.floor(p.creux.vendues / 1000) * 1000;
        return `Faites varier les ${p.mots.servies} au ${rang(p.creux.numero)} trimestre, de ${qte(min)} à ${qte(p.capacite)}, avec la même équipe. Une droite donne ce que le personnel peut coûter s'il ne prend que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix de chaque client (${eur(p.coutVise)} par ${p.unite}) ; l'autre, ce qu'il coûte, ${eur(p.creux.personnel)}. Placez le curseur sur le moins de ${p.unites} où le personnel ne prend pas plus de ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix, puis validez.`;
      },
      grandeur: (c) => {
        const p = productiviteDuService(c);
        return { libelle: `${majuscule(p.mots.servies)} au trimestre creux`, unite: p.unites };
      },
      cible: (c) => {
        const p = productiviteDuService(c);
        return { attendu: p.clientsVises, min: Math.floor(p.creux.vendues / 1000) * 1000, max: p.capacite };
      },
      zones: ["Le personnel dans le repère", "Le personnel pèse trop"],
      rates: () => ({
        dessous: "Avec si peu de clients, le personnel prend plus que le repère sur chacun.",
        dessus: "Moins de clients suffiraient encore : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de clients",
      lecture: (c, n) => {
        const p = productiviteDuService(c);
        const permis = auCentime(p.coutVise * n);
        return [
          { libelle: "Chiffre d'affaires du trimestre", montant: auCentime(p.prix * n) },
          { libelle: `Ce que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix laissent au personnel`, montant: permis },
          { libelle: "Coût du personnel du trimestre", montant: p.creux.personnel },
          { libelle: `Coût du personnel par ${p.unite}`, montant: auCentime(p.creux.personnel / n) },
          { libelle: "Ce que le repère laisse de plus que le personnel", montant: auCentime(permis - p.creux.personnel), fort: true },
        ];
      },
      droites: (c) => {
        const p = productiviteDuService(c);
        return {
          produit: (n) => p.coutVise * n,
          cout: () => p.creux.personnel,
          libelles: [`Ce que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix laissent au personnel`, "Coût du personnel du trimestre"],
        };
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        return [
          `Il fallait ${qte(p.clientsVises)} ${p.unites} au ${rang(p.creux.numero)} trimestre, ${qte(p.clientsVises - p.creux.vendues)} de plus que les ${qte(p.creux.vendues)} ${p.mots.servies}, pour que le personnel ne coûte que ${eur(p.coutVise)} par ${p.unite}.`,
          `Regardez le coût par ${p.unite} dans le tableau : il ne baisse pas en ligne droite, il se divise par les clients. Une équipe payée pareil coûte d'autant plus cher par client qu'il y en a peu : c'est ce que l'étape suivante chiffre, du trimestre le plus chargé au plus creux.`,
        ];
      },
    },
    {
      id: "ecart",
      objectifs: [2],
      type: "montants",
      titre: "Ce que le creux change",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Du ${rang(p.plein.numero)} trimestre au ${rang(p.creux.numero)}, calculez la variation de la productivité (${p.unites} par salarié sur le trimestre), puis celle du coût du personnel par ${p.unite}, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return [
          {
            libelle: "Variation de la productivité (%)",
            attendu: p.variationDeLaProductivite,
            calcul: `(${qte(p.creux.parSalarie)} ÷ ${qte(p.plein.parSalarie)} − 1) × 100 = ${pct(p.variationDeLaProductivite)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Variation du coût du personnel par ${p.unite} (%)`,
            attendu: p.variationDuCout,
            calcul: `(${eur(p.creux.coutParUnite)} ÷ ${eur(p.plein.coutParUnite)} − 1) × 100 = ${pct(p.variationDuCout)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        return [
          `La productivité baisse de ${pct(Math.abs(p.variationDeLaProductivite))}, et le coût du personnel par ${p.unite} monte de ${pct(p.variationDuCout)} : il monte plus que la productivité ne baisse, parce que le même coût se partage entre moins de clients.`,
        ];
      },
    },
    {
      id: "pourquoi",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi le creux coûte plus cher",
      notions: ["productivity", "fixed_costs"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Au ${rang(p.creux.numero)} trimestre, le personnel coûte ${eur(p.creux.coutParUnite)} par ${p.unite}, contre ${eur(p.plein.coutParUnite)} au ${rang(p.plein.numero)}. D'où vient l'écart ?`;
      },
      // Dans la simulation, l'équipe est celle de la fiche toute l'année : la même, payée pareil.
      options: (c) => {
        const p = productiviteDuService(c);
        const faits = `L'équipe compte ${qte(p.plein.effectif)} salariés au ${rang(p.plein.numero)} comme au ${rang(p.creux.numero)} trimestre, pour ${eur(p.plein.personnel)} de personnel chaque fois ; ${p.mots.etablissement} a ${p.mots.servir} ${qte(p.plein.vendues)} ${p.unites}, puis ${qte(p.creux.vendues)}.`;
        return [
          {
            texte: "La même équipe, payée pareil, pour moins de clients",
            juste: true,
            retour: `Oui. ${faits} Le coût du personnel est une charge fixe : il tombe chaque trimestre, et réparti sur moins de clients, il pèse plus sur chacun.`,
          },
          {
            texte: "Une équipe plus nombreuse au trimestre creux, pour autant de clients",
            juste: false,
            retour: `Non : l'équipe n'a pas changé. ${faits}`,
          },
          {
            texte: "Des salaires plus élevés au trimestre creux",
            juste: false,
            retour: `Non : dans la simulation, un salarié coûte ${eur(p.coutDUnSalarie)} chaque trimestre, quelle que soit la saison. ${faits}`,
          },
        ];
      },
    },
    {
      id: "plafond",
      objectifs: [3],
      type: "montants",
      titre: "La productivité la plus haute",
      notions: ["productivity", "capacity"],
      tableau: (c) => {
        const p = productiviteDuService(c);
        return {
          titre: `Ce que ${p.entreprise} peut ${p.mots.infinitif} au ${rang(p.creux.numero)} trimestre`,
          colonnes: [majuscule(p.unites)],
          lignes: [
            { libelle: p.mots.capacite(p.s), valeurs: [qte(p.capacite)] },
            { libelle: `${majuscule(p.unites)} ${accord(p, "demandé")}s au ${rang(p.creux.numero)} trimestre`, valeurs: [qte(p.creux.demande)] },
            { libelle: `${majuscule(p.mots.servies)} au ${rang(p.creux.numero)} trimestre`, valeurs: [qte(p.creux.vendues)] },
          ],
        };
      },
      question: (c) => {
        const p = productiviteDuService(c);
        return `L'activité d'un trimestre ne peut pas dépasser ${p.mots.plafond} : ${qte(p.capacite)} ${p.unites}. Si ${p.entreprise} ${p.mots.imparfait} autant au ${rang(p.creux.numero)} trimestre, avec la même équipe, quelle serait la productivité par salarié sur le trimestre (au dixième), et le coût du personnel par ${p.unite} (au centime) ?`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return [
          {
            libelle: "Productivité à pleine capacité",
            attendu: p.productiviteMaximale,
            calcul: `${qte(p.capacite)} ÷ ${qte(p.creux.effectif)} = ${qte(p.productiviteMaximale)}`,
            tolerance: 0.1,
          },
          {
            libelle: `Coût du personnel par ${p.unite} à pleine capacité`,
            attendu: p.coutPlancher,
            calcul: `${eur(p.creux.personnel)} ÷ ${qte(p.capacite)} = ${eur(p.coutPlancher)}`,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const plein = p.plein;
        return [
          `À pleine capacité, le personnel ne coûterait que ${eur(p.coutPlancher)} par ${p.unite} : c'est le plus bas que l'équipe puisse atteindre. Le trimestre le plus chargé a servi ${pct(p.remplissageDuPlein)} de cette capacité, le plus creux ${pct(p.remplissageDuCreux)}.`,
          ...(plein.refuses > 0
            ? [
                `Au ${rang(plein.numero)} trimestre, ${p.mots.etablissement} était plein et a refusé ${qte(plein.refuses)} ${p.unites} : sa productivité était déjà la plus haute. C'est au trimestre creux qu'il reste de la place.`,
              ]
            : []),
          c.code === "hotel"
            ? "À l'hôtel, ce rapport des nuitées vendues aux nuitées offertes porte un nom : le taux d'occupation. Avec une équipe fixe, la productivité du personnel monte et descend avec lui."
            : "Au restaurant, c'est le remplissage de la salle : avec une brigade fixe, la productivité du personnel monte et descend avec lui.",
        ];
      },
    },
    {
      id: "remplir-le-creux",
      objectifs: [4],
      type: "choix",
      titre: "Faire baisser le coût du creux",
      notions: ["productivity", "capacity"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Au ${rang(p.creux.numero)} trimestre, ${p.entreprise} a reçu une demande de ${qte(p.creux.demande)} ${p.unites}, et pouvait en ${p.mots.infinitif} ${qte(p.capacite)}. Que faire pour que le personnel coûte moins par ${p.unite} au trimestre creux ?`;
      },
      // Le trimestre creux sert moins que le plus chargé, qui ne dépasse pas la capacité : il reste
      // toujours de la place au creux, et la réponse juste est d'y attirer des clients.
      options: (c) => {
        const p = productiviteDuService(c);
        const chiffres = `${majuscule(p.mots.etablissement)} pouvait ${p.mots.infinitif} ${qte(p.capacite)} ${p.unites} ; il en a ${p.mots.servir} ${qte(p.creux.vendues)}, pour ${qte(p.creux.demande)} ${accord(p, "demandé")}s.`;
        return [
          {
            texte: "Attirer plus de clients au trimestre creux : il reste de la place",
            juste: p.placeAuCreux > 0,
            retour: `Oui. ${chiffres} Il reste de la place pour ${qte(p.placeAuCreux)} ${p.unites}, avec une équipe déjà payée : chaque client de plus fait baisser le coût du personnel par ${p.unite}.`,
          },
          {
            texte: "Embaucher des extras au trimestre creux, pour servir plus de clients",
            juste: false,
            retour: `Non : un salarié de plus monte le coût du personnel, sans faire venir un client. Les extras renforcent l'équipe quand l'activité monte, pas au creux. ${chiffres}`,
          },
          {
            texte: "Augmenter les salaires, pour que l'équipe serve plus vite les clients du trimestre creux",
            juste: false,
            retour: `Non : un salaire plus haut monte le coût du personnel, et ne fait venir aucun client. ${chiffres}`,
          },
        ];
      },
    },
    {
      id: "predire-l-equipe",
      objectifs: [5],
      type: "choix",
      titre: "Pariez sur l'équipe du creux",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Pariez encore. Sans un client de plus au ${rang(p.creux.numero)} trimestre (${qte(p.creux.vendues)} ${p.mots.servies}), combien de salariés pouvait-on garder pour que le personnel ne prenne pas plus de ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix ?`;
      },
      options: (c) => {
        const p = productiviteDuService(c);
        const e = p.creux.effectif;
        const voir = "Réduisez l'équipe au curseur de l'étape suivante.";
        const moitie = Math.round(e / 2);
        return [
          { texte: `Les ${qte(e)} : une équipe ne se réduit pas`, juste: false, retour: `${pari(false)} ${voir}` },
          { texte: `Environ ${qte(p.equipeMax)}, au lieu de ${qte(e)}`, juste: p.equipeMax !== moitie && p.equipeMax < e, retour: `${pari(p.equipeMax !== moitie && p.equipeMax < e)} ${voir}` },
          { texte: `Environ ${qte(moitie)} : la moitié de l'équipe`, juste: p.equipeMax === moitie, retour: `${pari(p.equipeMax === moitie)} ${voir}` },
        ];
      },
    },
    {
      id: "l-equipe-au-curseur",
      objectifs: [5],
      type: "curseur",
      titre: "L'équipe au curseur",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Faites varier l'équipe du ${rang(p.creux.numero)} trimestre, à ${eur(p.coutDUnSalarie)} le salarié, sans un client de plus. Une droite donne ce que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du chiffre d'affaires du trimestre laissent au personnel, ${eur(p.permisAuCreux)} ; l'autre, ce que coûte l'équipe. Placez le curseur sur la plus grande équipe qui tient ce repère, puis validez.`;
      },
      grandeur: () => ({ libelle: "Salariés au trimestre creux", unite: "salariés" }),
      sens: "plus-grande",
      cible: (c) => {
        const p = productiviteDuService(c);
        return { attendu: p.equipeMax, min: 1, max: 2 * p.creux.effectif };
      },
      zones: ["L'équipe dans le repère", "L'équipe pèse trop"],
      rates: () => ({
        dessous: "Une équipe plus grande tiendrait encore le repère : cherchez la plus grande.",
        dessus: "Cette équipe coûte déjà plus que ce que le repère lui laisse.",
      }),
      montrer: "Montrer l'équipe",
      lecture: (c, e) => {
        const p = productiviteDuService(c);
        const personnel = auCentime(e * p.coutDUnSalarie);
        return [
          { libelle: `Ce que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du chiffre d'affaires laissent au personnel`, montant: p.permisAuCreux },
          { libelle: "Coût du personnel de cette équipe", montant: personnel },
          { libelle: `Coût du personnel par ${p.unite}`, montant: auCentime(personnel / p.creux.vendues) },
          { libelle: "Ce que le repère laisse de plus que l'équipe", montant: auCentime(p.permisAuCreux - personnel), fort: true },
        ];
      },
      droites: (c) => {
        const p = productiviteDuService(c);
        return {
          produit: () => p.permisAuCreux,
          cout: (e) => e * p.coutDUnSalarie,
          libelles: [`Ce que ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du chiffre d'affaires laissent au personnel`, "Coût de l'équipe"],
        };
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        return [
          `Sans un client de plus, une équipe de ${qte(p.equipeMax)} salariés tenait le repère : ${eur(p.personnelReduit)} de personnel, ${eur(p.coutParUniteReduit)} par ${p.unite}. Mais cette équipe réduite sert les mêmes clients : chacun de ses salariés en sert plus par jour. Reste à vérifier qu'elle le peut.`,
        ];
      },
    },
    {
      id: "l-equipe-du-creux",
      objectifs: [5],
      type: "montants",
      titre: "Une équipe réduite au creux",
      notions: ["productivity", "payroll", "capacity"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Sans un client de plus au ${rang(p.creux.numero)} trimestre, calculez l'équipe la plus grande qui tient le personnel à ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix, le coût du personnel par ${p.unite} avec cette équipe, puis les ${p.unites} que chacun de ses salariés servirait par jour, à comparer au trimestre le plus chargé.`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return [
          {
            libelle: "Salariés au plus",
            attendu: p.equipeMax,
            calcul: `${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} × ${eur(p.prix)} × ${qte(p.creux.vendues)} ÷ ${eur(p.coutDUnSalarie)} = ${qte(auCentieme(p.permisAuCreux / p.coutDUnSalarie))}, soit ${qte(p.equipeMax)} salariés`,
            tolerance: 0,
          },
          {
            libelle: `Coût du personnel par ${p.unite}, équipe réduite`,
            attendu: p.coutParUniteReduit,
            calcul: `${qte(p.equipeMax)} × ${eur(p.coutDUnSalarie)} ÷ ${qte(p.creux.vendues)} = ${eur(p.coutParUniteReduit)}`,
          },
          {
            libelle: `${majuscule(p.unites)} par salarié et par jour, équipe réduite`,
            attendu: p.parJourReduit,
            calcul: `${qte(p.creux.vendues)} ÷ (${qte(p.equipeMax)} × ${qte(p.jours)}) = ${qte(p.parJourReduit)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const tient = p.parJourReduit <= p.plein.parSalarieEtParJour;
        return [
          tient
            ? `${qte(p.parJourReduit)} ${p.unites} par salarié et par jour, quand l'équipe en a servi ${qte(p.plein.parSalarieEtParJour)} au trimestre le plus chargé : une équipe de ${qte(p.equipeMax)} pouvait servir le creux. C'est ce que fait la profession, avec des contrats saisonniers et des congés pris en basse saison.`
            : `${qte(p.parJourReduit)} ${p.unites} par salarié et par jour, plus que les ${qte(p.plein.parSalarieEtParJour)} du trimestre le plus chargé : une équipe aussi réduite ne pouvait pas servir le creux.`,
          "Le coût du personnel par client se tient de deux façons : plus de clients pour la même équipe, ou une équipe à la mesure des clients. La seconde a une limite : ce qu'un salarié peut servir par jour.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-equipe",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de l'équipe",
      notions: ["productivity", "payroll", "capacity"],
      question: (c) => {
        const l = laboratoireDeLEquipe(c);
        const p = l.p;
        return `Rejouez le ${rang(p.creux.numero)} trimestre avec deux leviers : l'équipe, à ${eur(p.coutDUnSalarie)} le salarié, et les ${p.mots.servies}, de la demande du trimestre (${qte(p.creux.demande)}) jusqu'à ${p.mots.plafond} (${qte(p.capacite)}). Le tableau suit le coût du personnel par ${p.unite} et ce que chaque salarié sert par jour. Relevez le défi.`;
      },
      leviers: (c) => {
        const l = laboratoireDeLEquipe(c);
        return [
          { code: "effectif", libelle: "Salariés", unite: "salariés", ...l.leviers.effectif, depart: l.depart.effectif },
          { code: "servis", libelle: majuscule(l.p.mots.servies), unite: l.p.unites, ...l.leviers.servis, depart: l.depart.servis },
        ];
      },
      lecture: (c, x) => {
        const l = laboratoireDeLEquipe(c);
        const p = l.p;
        const y = l.lire(x.effectif!, x.servis!);
        const d = l.lire(l.depart.effectif, l.depart.servis);
        return [
          { libelle: "Coût du personnel du trimestre", montant: y.personnel, reference: d.personnel },
          { libelle: `${majuscule(p.unites)} par salarié et par jour`, montant: y.parJour, reference: d.parJour, unite: p.unites },
          { libelle: `${majuscule(p.unites)} par salarié et par jour, au trimestre le plus chargé`, montant: p.plein.parSalarieEtParJour, reference: p.plein.parSalarieEtParJour, unite: p.unites },
          { libelle: "Part du personnel dans le chiffre d'affaires", montant: y.part, reference: d.part, unite: "%" },
          { libelle: `Coût du personnel par ${p.unite}`, montant: y.coutParUnite, reference: d.coutParUnite, fort: true },
          { libelle: `Coût du personnel par ${p.unite}, au trimestre le plus chargé`, montant: p.plein.coutParUnite, reference: p.plein.coutParUnite },
          { libelle: "Économie sur le coût du personnel", montant: auCentime(d.personnel - y.personnel) + 0, reference: 0, effet: true },
        ];
      },
      // Le coût par client selon les clients servis : il se divise, ce n'est pas une droite.
      graphique: (c) => {
        const l = laboratoireDeLEquipe(c);
        const p = l.p;
        return {
          levier: "servis",
          courbes: [
            { libelle: `Coût du personnel par ${p.unite}`, valeur: (x) => l.lire(x.effectif!, x.servis!).coutParUnite },
            { libelle: "Au trimestre le plus chargé", valeur: () => p.plein.coutParUnite },
          ],
        };
      },
      defi: (c) => {
        const l = laboratoireDeLEquipe(c);
        const p = l.p;
        return {
          consigne: `Au trimestre creux, ramenez le coût du personnel par ${p.unite} à celui du trimestre le plus chargé (${eur(p.plein.coutParUnite)}), sans demander à un salarié plus de ${p.unites} par jour qu'à ce trimestre-là (${qte(p.plein.parSalarieEtParJour)}).`,
          atteint: (x) => l.atteint(x.effectif!, x.servis!),
          indice: (x) => {
            const y = l.lire(x.effectif!, x.servis!);
            return x.servis! * p.plein.effectif > p.plein.vendues * x.effectif!
              ? `Chaque salarié sert ${qte(y.parJour)} ${p.unites} par jour, plus qu'au trimestre le plus chargé : l'équipe est trop petite pour ces clients.`
              : `Le personnel coûte ${eur(y.coutParUnite)} par ${p.unite} : il faut plus de clients pour cette équipe, ou une équipe plus petite.`;
          },
          solution: l.solution,
        };
      },
      montrer: "Montrer une équipe qui relève le défi",
      explication: (c, x) => {
        const l = laboratoireDeLEquipe(c);
        const p = l.p;
        const y = l.lire(x.effectif!, x.servis!);
        return [
          `Avec ${qte(x.effectif!)} salariés et ${qte(x.servis!)} ${p.mots.servies}, chaque salarié sert ${qte(y.parJour)} ${p.unites} par jour, comme au trimestre le plus chargé, et le personnel coûte ${eur(y.coutParUnite)} par ${p.unite}. Les deux conditions ne se tiennent ensemble qu'à la productivité du trimestre le plus chargé.`,
          `C'est la formule cachée sous le chapitre : coût du personnel par ${p.unite} = coût d'un salarié ÷ ${p.unites} par salarié sur le trimestre, ${eur(p.coutDUnSalarie)} ÷ ${qte(p.plein.parSalarie)} = ${eur(auCentime(p.coutDUnSalarie / p.plein.parSalarie))}. Le coût par client ne baisse que si la productivité monte : plus de clients pour l'équipe, ou une équipe à leur mesure.`,
        ];
      },
    },
    {
      id: "une-equipe-de-plus",
      objectifs: [5],
      type: "montants",
      titre: "Variante : un salarié de plus",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `La direction envisage ${SALARIES_EN_PLUS === 1 ? "un salarié de plus" : `${qte(SALARIES_EN_PLUS)} salariés de plus`} toute l'année, au même coût que les autres, et veut que le personnel ne prenne pas plus de ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} du prix sur l'année. Calculez le coût du personnel de l'année avec cette équipe, les ${p.unites} qu'il faudrait servir sur l'année (à l'unité supérieure), puis les ${p.unites} de plus que l'année jouée.`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        const v = p.variante;
        return [
          {
            libelle: "Coût du personnel de l'année, équipe renforcée",
            attendu: v.personnel,
            calcul: `${qte(v.effectif)} × ${eur(p.coutDUnSalarie)} × ${qte(p.trimestres.length)} = ${eur(v.personnel)}`,
          },
          {
            libelle: `${majuscule(p.unites)} à servir sur l'année`,
            attendu: v.clients,
            calcul: `${eur(v.personnel)} ÷ (${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)} × ${eur(p.prix)}) = ${eur(v.personnel)} ÷ ${eur(p.coutVise)} = ${qte(v.clients)}`,
            tolerance: 1,
          },
          {
            libelle: `${majuscule(p.unites)} de plus que l'année jouée`,
            attendu: v.enPlus,
            calcul: `${qte(v.clients)} − ${qte(v.venduesDeLAnnee)} = ${qte(v.enPlus)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const v = p.variante;
        return [
          `Le salarié de plus coûte ${eur(auCentime(SALARIES_EN_PLUS * p.coutDUnSalarie * p.trimestres.length))} sur l'année : il ne se paie, au repère de ${pct(PART_DU_PRIX_POUR_LE_PERSONNEL * 100)}, que si l'établissement sert ${qte(v.enPlus)} ${p.unites} de plus. Or il ne crée pas de place : ${p.mots.etablissement} peut ${p.mots.infinitif} ${qte(v.capaciteDeLAnnee)} ${p.unites} sur l'année, et l'année jouée en a refusé ${qte(v.refusesDeLAnnee)} au trimestre où il était plein. Les ${p.unites} de plus doivent venir des trimestres où il reste de la place.`,
        ];
      },
    },
    {
      id: "juger-l-equipe",
      objectifs: [5],
      type: "choix",
      titre: "Primer la productivité ?",
      notions: ["productivity", "capacity"],
      question: (c) => {
        const p = productiviteDuService(c);
        return `Le directeur veut primer l'équipe sur ses ${p.unites} par salarié et par jour, trimestre après trimestre. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const p = productiviteDuService(c);
        const faits = `Avec la même équipe, elle est passée de ${qte(p.plein.parSalarieEtParJour)} au trimestre le plus chargé à ${qte(p.creux.parSalarieEtParJour)} au plus creux, et la demande seule a changé.`;
        return [
          {
            texte: "Elle mesure surtout le remplissage, que l'équipe ne décide pas",
            juste: true,
            retour: `Oui. ${faits} La productivité se lit avec la demande et la capacité ; on prime plutôt ce que l'équipe maîtrise, la qualité du service et les clients qui reviennent.`,
          },
          {
            texte: "Bonne idée : plus de clients par salarié, c'est une équipe qui travaille mieux",
            juste: false,
            retour: `Non. ${faits} L'équipe n'a pas moins bien travaillé au creux : elle a eu moins de clients.`,
          },
          {
            texte: `Mieux vaut la primer sur le coût du personnel par ${p.unite}, qui ne dépend que d'elle`,
            juste: false,
            retour: `Non : le coût par ${p.unite} se divise par les clients, et suit la demande comme la productivité. ${faits}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["productivity", "fixed_costs"],
      texte: (c) => {
        const p = productiviteDuService(c);
        return [
          `Chez ${p.entreprise}, la même équipe de ${qte(p.creux.effectif)} salariés a ${p.mots.servir} ${qte(p.plein.parSalarieEtParJour)} ${p.unites} par salarié et par jour au trimestre le plus chargé, ${qte(p.creux.parSalarieEtParJour)} au plus creux : le personnel y a coûté ${eur(p.plein.coutParUnite)}, puis ${eur(p.creux.coutParUnite)} par ${p.unite}.`,
          "Avec une équipe fixe, la productivité suit l'activité : c'est le remplissage qui la fait. La profession adapte donc une partie de son équipe à la saison (des extras, des saisonniers, les congés pris en basse saison). La simulation du cours, elle, garde la même équipe toute l'année : c'est ce qui laisse voir l'écart.",
          `Le coût du personnel par client n'est que le coût d'un salarié divisé par ce qu'il sert : il baisse avec plus de clients pour la même équipe, ou avec une équipe à la mesure des clients, dans la limite de ce qu'un salarié peut servir par jour.`,
          "Au niveau de l'examen, vous savez calculer la productivité et le coût du personnel par client, comparer le trimestre plein et le trimestre creux, remonter d'un repère de coût aux clients ou à l'équipe qu'il exige, croiser le coût et la productivité d'une équipe réduite, et dire ce que la productivité ne mesure pas.",
          `Dans l'arène, les chiffres de ${p.mots.votre} seront différents : la notion, elle, est la même.`,
        ];
      },
      repere: (c) => {
        const p = productiviteDuService(c);
        return `Plus il y a de ${p.unites} pour la même équipe, plus la productivité monte, et plus le coût du personnel par ${p.unite} baisse.`;
      },
    },
  ],
};
