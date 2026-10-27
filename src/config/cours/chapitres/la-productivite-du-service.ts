import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accord } from "../accords";
import { anneeJouee, type Cas } from "../cas";
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
 * Tout vient de l'arène : l'année du cours (`anneeJouee`), trimestre par trimestre (les ventes, la
 * demande adressée, ce que l'établissement a mis en vente, ses deux capacités) ; l'effectif au
 * début de chaque trimestre ; le coût d'un salarié par trimestre (`hr.salaryPerEmployeePerRound`),
 * que l'arène compte dans les charges de structure, comme l'année de la clôture
 * (`anneeDeLArene`, cas.ts) ; les jours du trimestre (`roundDays`). Aucune hypothèse n'est ajoutée.
 *
 * Ce que le chapitre ne double pas : « L'équipe et son planning » (BTS MCO) compte le coût d'une
 * heure, le chiffre d'affaires par salarié et la part du personnel sur le mois du cas ;
 * « L'effectif et la masse salariale » (bac STMG), la masse salariale de l'année. Ici, l'unité de
 * mesure est le client servi, et l'objet est sa variation d'un trimestre à l'autre.
 */

/** Les deux entreprises du métier : le restaurant et l'hôtel. */
export const ENTREPRISES_DU_SERVICE: readonly string[] = ["bistrot", "hotel"];

/** Les mots du service, dans chaque établissement. */
const MOTS: Record<string, { servies: string; etablissement: string; servir: string }> = {
  bistrot: { servies: "couverts servis", etablissement: "le bistrot", servir: "servi" },
  hotel: { servies: "nuitées vendues", etablissement: "l'hôtel", servir: "vendu" },
};
const mots = (c: Cas) => MOTS[c.code] ?? { servies: `${c.unites} vendues`, etablissement: "l'entreprise", servir: "vendu" };

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « 1er », « 2e » : le rang d'un trimestre, compté à partir de 1. */
const rang = (n: number) => (n === 1 ? "1er" : `${n}e`);

/** Un trimestre de l'année du cours, vu par le personnel. */
export interface TrimestreDuService {
  /** Le rang du trimestre dans l'année, à partir de 1. */
  numero: number;
  effectif: number;
  /** Le coût du personnel du trimestre : l'effectif, au coût d'un salarié. */
  personnel: number;
  vendues: number;
  demande: number;
  /** Ce que l'établissement a mis en vente : le volume de sa feuille de décision. */
  enVente: number;
  /** Le plafond physique (les chambres, la salle et la cuisine) et celui de l'équipe. */
  capaciteDAccueil: number;
  capaciteDeLEquipe: number;
  prixMoyen: number;
  parSalarie: number;
  parSalarieEtParJour: number;
  coutParUnite: number;
}

/** L'année du cours, trimestre par trimestre, et ce que le chapitre en tire. */
export function productiviteDuService(c: Cas) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const hr = s.hr!;
  const { partie, depart } = anneeJouee(c.code);
  const jours = s.roundDays;
  const trimestres: TrimestreDuService[] = partie.rounds.map((t, k) => {
    const r = t.results["joueur"]!;
    // L'effectif du trimestre : celui de l'entreprise quand il commence.
    const etat = k === 0 ? depart : partie.rounds[k - 1]!.companies.find((x) => x.id === "joueur")!;
    const effectif = etat.headcount;
    const personnel = auCentime(effectif * hr.salaryPerEmployeePerRound);
    const vendues = Math.round(soldUnits(r));
    return {
      numero: k + 1,
      effectif,
      personnel,
      vendues,
      demande: Math.round(Object.values(r.market.bySegment).reduce((x, v) => x + v.demandForCompany, 0)),
      enVente: Math.round(r.production.produced),
      capaciteDAccueil: Math.round(r.production.machineCapacity),
      capaciteDeLEquipe: Math.floor(r.production.laborCapacity + 1e-9),
      prixMoyen: auCentime(r.incomeStatement.revenue / soldUnits(r)),
      parSalarie: auDixieme(vendues / effectif),
      parSalarieEtParJour: auCentieme(vendues / (effectif * jours)),
      coutParUnite: auCentime(personnel / vendues),
    };
  });
  const plein = trimestres.reduce((a, b) => (b.vendues > a.vendues ? b : a));
  const creux = trimestres.reduce((a, b) => (b.vendues < a.vendues ? b : a));
  // Ce que l'établissement peut servir au trimestre creux : le plus petit de ses deux plafonds.
  const capacite = Math.min(creux.capaciteDAccueil, creux.capaciteDeLEquipe);
  const refuses = Math.max(0, creux.demande - creux.vendues);
  return {
    vocabulaire: def.vocabulary,
    jours,
    coutDUnSalarie: hr.salaryPerEmployeePerRound,
    embauche: hr.hiringCost,
    depart: hr.firingCost,
    trimestres,
    plein,
    creux,
    memeEquipe: plein.effectif === creux.effectif && plein.personnel === creux.personnel,
    variationDeLaProductivite: auDixieme((creux.parSalarie / plein.parSalarie - 1) * 100),
    variationDuCout: auDixieme((creux.coutParUnite / plein.coutParUnite - 1) * 100),
    capacite,
    productiviteMaximale: auDixieme(capacite / creux.effectif),
    coutPlancher: auCentime(creux.personnel / capacite),
    remplissageDuPlein: auDixieme((plein.vendues / capacite) * 100),
    remplissageDuCreux: auDixieme((creux.vendues / capacite) * 100),
    /** Les clients que le trimestre creux a laissé repartir : demandés, et pas servis. */
    refuses,
    /** Ceux d'entre eux que la capacité de service pouvait encore accueillir, avec la même équipe. */
    servables: Math.min(refuses, Math.max(0, capacite - creux.vendues)),
    partDuPersonnelAuCreux: auDixieme((creux.coutParUnite / creux.prixMoyen) * 100),
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const p = productiviteDuService(c);
  return {
    titre: `L'année ${/^[aeiouyéèêAEIOUYÉÈ]/.test(c.entreprise) ? `d'${c.entreprise}` : `de ${c.entreprise}`} dans l'arène`,
    colonnes: p.trimestres.map((t) => `${rang(t.numero)} trimestre`),
    lignes: [
      { libelle: majuscule(mots(c).servies), valeurs: p.trimestres.map((t) => qte(t.vendues)) },
      { libelle: "Effectif", valeurs: p.trimestres.map((t) => `${qte(t.effectif)} salariés`) },
      { libelle: "Coût du personnel du trimestre", valeurs: p.trimestres.map((t) => eur(t.personnel)) },
    ],
  };
}

/** Les trois champs d'un trimestre : par salarié, par salarié et par jour, et le coût par unité. */
function champsDuTrimestre(c: Cas, t: TrimestreDuService, jours: number) {
  const u = c.unites;
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
      calcul: `${qte(t.vendues)} ÷ (${qte(t.effectif)} × ${qte(jours)}) = ${qte(t.parSalarieEtParJour)}`,
      tolerance: 0.01,
    },
    {
      libelle: `Coût du personnel par ${c.unite}`,
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
        const m = mots(c);
        return [
          `${c.entreprise} emploie ${qte(p.creux.effectif)} salariés. Chacun lui coûte ${eur(p.coutDUnSalarie)} par trimestre, salaire et cotisations patronales : ${eur(p.creux.personnel)} pour toute l'équipe, que ${m.etablissement} soit plein ou non. Dans l'arène, ce coût est compris dans les charges de structure.`,
          c.code === "hotel"
            ? "À l'hôtel, ce que l'équipe sert se compte en nuitées : une nuitée, c'est une chambre louée pour une nuit. Le tableau donne les nuitées vendues de chaque trimestre de l'année du cours."
            : "Au restaurant, ce que l'équipe sert se compte en couverts : un couvert, c'est un client servi à table. Le tableau donne les couverts servis de chaque trimestre de l'année du cours.",
          `La productivité du personnel rapporte ce qui a été servi à ceux qui l'ont servi. Le coût du personnel par ${c.unite} dit ce que l'équipe pèse sur chaque client.`,
        ];
      },
      repere: (c) =>
        `Productivité du personnel = ${c.unites} du trimestre ÷ effectif. Coût du personnel par ${c.unite} = coût du personnel du trimestre ÷ ${c.unites} du trimestre.`,
    },
    {
      id: "plein",
      type: "montants",
      titre: "Le trimestre le plus chargé",
      notions: ["productivity"],
      question: (c) => {
        const p = productiviteDuService(c);
        const t = p.plein;
        return `Au ${rang(t.numero)} trimestre, le plus chargé de l'année, ${c.entreprise} a ${mots(c).servir} ${qte(t.vendues)} ${c.unites} avec ${qte(t.effectif)} salariés, pour ${eur(t.personnel)} de personnel. Calculez les ${c.unites} par salarié sur le trimestre (au dixième), par salarié et par jour (sur les ${qte(p.jours)} jours du trimestre, au centième), puis le coût du personnel par ${c.unite} (au centime).`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return champsDuTrimestre(c, p.plein, p.jours);
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const t = p.plein;
        return [
          `Au plus fort de l'année, chaque salarié correspond à ${qte(t.parSalarie)} ${c.unites} sur le trimestre, soit ${qte(t.parSalarieEtParJour)} par jour, et le personnel coûte ${eur(t.coutParUnite)} par ${c.unite}, sur un prix moyen de ${eur(t.prixMoyen)}.`,
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
        return `Au ${rang(t.numero)} trimestre, le plus creux de l'année, ${c.entreprise} n'a ${mots(c).servir} que ${qte(t.vendues)} ${c.unites}, avec ${qte(t.effectif)} salariés et ${eur(t.personnel)} de personnel. Faites les mêmes calculs : par salarié sur le trimestre, par salarié et par jour, puis le coût du personnel par ${c.unite}.`;
      },
      champs: (c) => {
        const p = productiviteDuService(c);
        return champsDuTrimestre(c, p.creux, p.jours);
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        const t = p.creux;
        return [
          `Au trimestre creux, chaque salarié ne correspond plus qu'à ${qte(t.parSalarieEtParJour)} ${c.unites} par jour, et le personnel coûte ${eur(t.coutParUnite)} par ${c.unite} : ${pct(p.partDuPersonnelAuCreux)} du prix moyen de ${eur(t.prixMoyen)}.`,
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
        return `Du ${rang(p.plein.numero)} trimestre au ${rang(p.creux.numero)}, calculez la variation de la productivité (${c.unites} par salarié sur le trimestre), puis celle du coût du personnel par ${c.unite}, en pourcentage au dixième.`;
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
            libelle: `Variation du coût du personnel par ${c.unite} (%)`,
            attendu: p.variationDuCout,
            calcul: `(${eur(p.creux.coutParUnite)} ÷ ${eur(p.plein.coutParUnite)} − 1) × 100 = ${pct(p.variationDuCout)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        return [
          `La productivité baisse de ${pct(Math.abs(p.variationDeLaProductivite))}, et le coût du personnel par ${c.unite} monte de ${pct(p.variationDuCout)} : il monte plus que la productivité ne baisse, parce que le même coût se partage entre moins de clients.`,
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
        return `Au ${rang(p.creux.numero)} trimestre, le personnel coûte ${eur(p.creux.coutParUnite)} par ${c.unite}, contre ${eur(p.plein.coutParUnite)} au ${rang(p.plein.numero)}. D'où vient l'écart ?`;
      },
      options: (c) => {
        const p = productiviteDuService(c);
        const equipe = p.memeEquipe
          ? `L'équipe compte ${qte(p.plein.effectif)} salariés au ${rang(p.plein.numero)} comme au ${rang(p.creux.numero)} trimestre, pour ${eur(p.plein.personnel)} de personnel chaque fois`
          : `L'équipe compte ${qte(p.plein.effectif)} salariés au ${rang(p.plein.numero)} trimestre et ${qte(p.creux.effectif)} au ${rang(p.creux.numero)}, pour ${eur(p.plein.personnel)} et ${eur(p.creux.personnel)} de personnel`;
        const faits = `${equipe} ; ${mots(c).etablissement} a ${mots(c).servir} ${qte(p.plein.vendues)} ${c.unites}, puis ${qte(p.creux.vendues)}.`;
        return [
          {
            texte: "La même équipe, payée pareil, pour moins de clients",
            juste: p.memeEquipe,
            retour: p.memeEquipe
              ? `Oui. ${faits} Le coût du personnel est une charge fixe : il tombe chaque trimestre, et réparti sur moins de clients, il pèse plus sur chacun.`
              : `Non. ${faits}`,
          },
          {
            texte: "Une équipe plus nombreuse au trimestre creux, pour autant de clients",
            juste: !p.memeEquipe,
            retour: !p.memeEquipe ? `Oui. ${faits}` : `Non : l'équipe n'a pas changé. ${faits}`,
          },
          {
            texte: "Des salaires plus élevés au trimestre creux",
            juste: false,
            retour: `Non : dans l'arène, un salarié coûte ${eur(p.coutDUnSalarie)} chaque trimestre, quelle que soit la saison. ${faits}`,
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
        const v = p.vocabulaire;
        return {
          titre: `Ce que ${c.entreprise} peut servir au ${rang(p.creux.numero)} trimestre`,
          colonnes: [majuscule(c.unites)],
          lignes: [
            { libelle: v.capacityLabel, valeurs: [qte(p.creux.capaciteDAccueil)] },
            { libelle: v.laborLabel, valeurs: [qte(p.creux.capaciteDeLEquipe)] },
            { libelle: `${majuscule(mots(c).servies)} au ${rang(p.creux.numero)} trimestre`, valeurs: [qte(p.creux.vendues)] },
          ],
        };
      },
      question: (c) => {
        const p = productiviteDuService(c);
        return `L'activité d'un trimestre ne peut pas dépasser le plus petit des deux plafonds du tableau : ${qte(p.capacite)} ${c.unites}. Si ${c.entreprise} servait autant au ${rang(p.creux.numero)} trimestre, avec la même équipe, quelle serait la productivité par salarié sur le trimestre (au dixième), et le coût du personnel par ${c.unite} (au centime) ?`;
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
            libelle: `Coût du personnel par ${c.unite} à pleine capacité`,
            attendu: p.coutPlancher,
            calcul: `${eur(p.creux.personnel)} ÷ ${qte(p.capacite)} = ${eur(p.coutPlancher)}`,
          },
        ];
      },
      explication: (c) => {
        const p = productiviteDuService(c);
        return [
          `À pleine capacité, le personnel ne coûterait que ${eur(p.coutPlancher)} par ${c.unite} : c'est le plus bas que l'équipe puisse atteindre. Le trimestre le plus chargé a servi ${pct(p.remplissageDuPlein)} de cette capacité, le plus creux ${pct(p.remplissageDuCreux)}.`,
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
        return `Au ${rang(p.creux.numero)} trimestre, ${p.creux.demande > p.creux.vendues ? `${qte(p.creux.demande)} ${c.unites} ont été ${accord(c, "demandé")}s à ${c.entreprise}, qui en avait prévu ${qte(p.creux.enVente)} dans « ${p.vocabulaire.productionPlanLabel} »` : `la demande adressée à ${c.entreprise} était de ${qte(p.creux.demande)} ${c.unites}`}. Que faire pour que le personnel coûte moins par ${c.unite} au trimestre creux ?`;
      },
      options: (c) => {
        const p = productiviteDuService(c);
        const v = p.vocabulaire;
        const desRefuses = p.refuses > 0;
        const chiffres = `${majuscule(mots(c).etablissement)} pouvait servir ${qte(p.capacite)} ${c.unites} ; il en a ${mots(c).servir} ${qte(p.creux.vendues)}, pour ${qte(p.creux.demande)} ${accord(c, "demandé")}s.`;
        return [
          {
            texte: `Servir les clients refusés : la demande était là, mais « ${v.productionPlanLabel} » était trop bas`,
            juste: desRefuses,
            retour: desRefuses
              ? `Oui. ${chiffres} ${qte(p.refuses)} ${c.unites} ${accord(c, "demandé")}s n'ont pas été ${accord(c, "servi")}s, ${p.servables === p.refuses ? `alors que la capacité de service pouvait ${accord(c, "un") === "une" ? "toutes" : "tous"} les accueillir` : `dont ${qte(p.servables)} que la capacité de service pouvait encore accueillir`}, avec une équipe déjà payée : ${accord(c, "chacun")} aurait fait baisser le coût du personnel par ${c.unite}.`
              : `Non : tous les clients qui sont venus ont été servis. ${chiffres}`,
          },
          {
            texte: "Attirer plus de clients au trimestre creux : tous ceux qui sont venus ont été servis",
            juste: !desRefuses,
            retour: !desRefuses
              ? `Oui. ${chiffres} Il reste de la place, avec une équipe déjà payée : chaque client de plus fait baisser le coût du personnel par ${c.unite}.`
              : `Non : des clients sont venus et n'ont pas été servis. ${chiffres}`,
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
          `Chez ${c.entreprise}, la même équipe de ${qte(p.creux.effectif)} salariés a ${mots(c).servir} ${qte(p.plein.parSalarieEtParJour)} ${c.unites} par salarié et par jour au trimestre le plus chargé, ${qte(p.creux.parSalarieEtParJour)} au plus creux : le personnel y a coûté ${eur(p.plein.coutParUnite)}, puis ${eur(p.creux.coutParUnite)} par ${c.unite}.`,
          `Avec une équipe fixe, la productivité suit l'activité : c'est le remplissage qui la fait. La profession adapte donc une partie de son équipe à la saison (des extras, des saisonniers, les congés pris en basse saison). L'arène, elle, ne change l'effectif qu'en embauchant (${eur(p.embauche)} de recrutement) ou en se séparant d'un salarié (${eur(p.depart)}), au trimestre suivant : son équipe reste fixe d'un trimestre à l'autre.`,
        ];
      },
      repere: (c) => `Plus il y a de ${c.unites} pour la même équipe, plus la productivité monte, et plus le coût du personnel par ${c.unite} baisse.`,
    },
  ],
};
