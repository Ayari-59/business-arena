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
 */

/** Les deux entreprises du métier : le restaurant et l'hôtel. */
export const ENTREPRISES_DU_SERVICE: readonly string[] = ["bistrot", "hotel"];

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
  };
}

export type ProductiviteDuService = ReturnType<typeof productiviteDuService>;

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
      id: "ecart",
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
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["productivity", "fixed_costs"],
      texte: (c) => {
        const p = productiviteDuService(c);
        return [
          `Chez ${p.entreprise}, la même équipe de ${qte(p.creux.effectif)} salariés a ${p.mots.servir} ${qte(p.plein.parSalarieEtParJour)} ${p.unites} par salarié et par jour au trimestre le plus chargé, ${qte(p.creux.parSalarieEtParJour)} au plus creux : le personnel y a coûté ${eur(p.plein.coutParUnite)}, puis ${eur(p.creux.coutParUnite)} par ${p.unite}.`,
          "Avec une équipe fixe, la productivité suit l'activité : c'est le remplissage qui la fait. La profession adapte donc une partie de son équipe à la saison (des extras, des saisonniers, les congés pris en basse saison). La simulation du cours, elle, garde la même équipe toute l'année : c'est ce qui laisse voir l'écart.",
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
