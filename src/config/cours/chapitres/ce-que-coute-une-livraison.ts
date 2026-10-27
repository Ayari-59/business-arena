import { soldUnits } from "../../../engine/simulation/runGame";
import type { SupplierDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { nomEntreprise } from "../../scenarios/presentation";
import { scenarioByCode } from "../../scenarios/registry";
import { accord, accordPluriel, pronom } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CE QUE COÛTE UNE LIVRAISON (2de pro GATL, palier 1).
 *
 * Chez le transporteur du cours, ROUTE & CIE : ce que coûte une palette livrée, et ce qu'il en
 * reste au prix que paie le client. L'arène NE CONNAÎT PAS LES KILOMÈTRES : elle ne compte ni
 * trajets ni tournées, elle vend des palettes livrées. Le chapitre raisonne donc à la palette,
 * l'unité que le moteur compte.
 *
 * Ce que le scénario et le moteur comptent, et que le chapitre reprend :
 *   · à chaque palette, le carburant et les péages, comptés ensemble (`materialCostPerUnit`,
 *     multiplié par l'offre de carburant choisie : la carte réseau, la cuve au dépôt, le contrat
 *     constructeur, `suppliers[].costMultiplier`), puis l'entretien courant, les pneus, les
 *     primes de route et le lavage (`otherVariableCostPerUnit`) ;
 *   · chaque trimestre, quoi qu'il arrive, les salaires des chauffeurs (l'effectif de départ ×
 *     `salaryPerEmployeePerRound`, dans les charges de structure du moteur), l'usure des camions
 *     (l'amortissement du parc que le moteur calcule) et l'entretien de la flotte (le budget
 *     d'entretien du trimestre) ;
 *   · le prix d'une palette, le même pour les clientèles du scénario (la feuille de décision n'a
 *     qu'un prix), qui ne se distinguent que par le délai de paiement.
 *
 * Tout se lit au premier trimestre de l'année du cours (`anneeJouee`), où chaque place mise en
 * route a été remplie : les palettes livrées sont celles que les camions ont emportées. Les
 * charges de chaque trimestre se répartissent sur ces palettes livrées.
 */

/** Le transporteur du cours : le seul qui vende des livraisons. */
export const ENTREPRISES_DE_LA_LIVRAISON: readonly string[] = ["transport"];

const TRANSPORTEUR = nomEntreprise(scenarioByCode("transport"));

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « une palette », accordé avec l'unité. */
const uneUnite = (c: Cas) => `${accord(c, "un")} ${c.unite}`;

/** Le coût de la route d'une unité, avec une offre de carburant : carburant et péages, puis le reste. */
const routeAvec = (code: string, f: SupplierDef) => {
  const p = scenarioByCode(code).scenario.product;
  return auCentime(p.materialCostPerUnit * f.costMultiplier + p.otherVariableCostPerUnit);
};

/** Les chiffres du chapitre, au premier trimestre de l'année du cours. */
export function coutDUneLivraison(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const { partie, depart } = anneeJouee(c.code);
  const r = partie.rounds[0]!.results["joueur"]!;
  const offres = s.suppliers ?? [];
  const fournisseur = offres.find((f) => f.code === r.supplier?.code) ?? offres[0];
  if (!fournisseur) throw new Error(`${c.entreprise} n'a pas d'offre de carburant`);
  const carburant = auCentime(s.product.materialCostPerUnit * fournisseur.costMultiplier);
  const entretienCourant = s.product.otherVariableCostPerUnit;
  const route = auCentime(carburant + entretienCourant);
  const palettes = Math.round(soldUnits(r));
  const chauffeurs = depart.headcount;
  const salaire = s.hr!.salaryPerEmployeePerRound;
  const salaires = chauffeurs * salaire;
  const chauffeurParPalette = auCentime(salaires / palettes);
  const capacite = Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity));
  const amortissement = auCentime(r.incomeStatement.depreciation);
  const entretienDeLaFlotte = auCentime(r.incomeStatement.maintenanceCost);
  const camionsParPalette = auCentime((amortissement + entretienDeLaFlotte) / palettes);
  const coutDUnePalette = auCentime(route + chauffeurParPalette + camionsParPalette);
  const segments = Object.values(r.market.bySegment);
  const prix = auCentime(segments.reduce((t, v) => t + v.revenue, 0) / segments.reduce((t, v) => t + v.sold, 0));
  const clienteles = s.market.segments
    .filter((g) => (r.market.bySegment[g.code]?.sold ?? 0) > 0)
    .map((g) => {
      const v = r.market.bySegment[g.code]!;
      return {
        code: g.code,
        nom: g.name,
        palettes: Math.round(v.sold),
        chiffreDAffaires: auCentime(v.revenue),
        prix: auCentime(v.revenue / v.sold),
        delai: g.paymentDelayDays ?? 0,
      };
    });
  return {
    fournisseur,
    autresOffres: offres.filter((f) => f.code !== fournisseur.code).map((f) => ({ ...f, route: routeAvec(c.code, f) })),
    carburant,
    entretienCourant,
    route,
    palettes,
    chauffeurs,
    salaire,
    salaires,
    chauffeurParPalette,
    capacite,
    chauffeurCamionsPleins: auCentime(salaires / capacite),
    amortissement,
    entretienDeLaFlotte,
    camionsParPalette,
    coutDUnePalette,
    prix,
    reste: auCentime(prix - coutDUnePalette),
    /** Les autres charges de structure du trimestre : exploitation, loyers, assurances, taxe à l'essieu. */
    autresCharges: auCentime(r.incomeStatement.fixedCosts - salaires),
    clienteles,
    /** Combien de clientèles paient une palette au moins ce qu'elle coûte. */
    couvrent: clienteles.filter((k) => k.prix >= coutDUnePalette).length,
  };
}

const paiement = (jours: number) => (jours === 0 ? "comptant" : `à ${qte(jours)} jours`);

export const CE_QUE_COUTE_UNE_LIVRAISON: Chapitre = {
  code: "ce-que-coute-une-livraison",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion"],
  titre: "Ce que coûte une livraison",
  accroche:
    "L'arène ne compte pas les kilomètres : elle compte les palettes livrées. Le carburant et les péages, le chauffeur, l'usure des camions : ce que coûte une palette, et ce qu'il en reste au prix que paie le client.",
  objectifs: [
    "Distinguer ce qui se paie à chaque palette et ce qui se paie chaque trimestre",
    "Calculer le coût de la route d'une palette, selon l'offre de carburant",
    "Répartir le salaire des chauffeurs et l'usure des camions sur les palettes livrées",
    "Calculer ce que coûte une palette livrée, et ce qu'il en reste au prix payé par le client",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_LIVRAISON,
    pourquoi: `ce chapitre compte ce que coûte une livraison chez un transporteur, et dans l'arène, seule ${TRANSPORTEUR} vend des livraisons.`,
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'arène compte",
      notions: ["variable_costs", "fixed_costs"],
      texte: (c) => {
        const k = coutDUneLivraison(c);
        return [
          `${c.entreprise} est un transporteur : elle vend des livraisons. L'arène ne connaît ni les kilomètres ni les tournées : elle compte des ${c.unites} ${accordPluriel(c, "livré")}. Au premier trimestre, ${c.entreprise} en a livré ${qte(k.palettes)}.`,
          `Certains coûts suivent chaque ${c.unite} : le carburant et les péages, que l'arène compte ensemble (${eur(k.carburant)} avec « ${k.fournisseur.name} »), puis l'entretien courant, les pneus, les primes de route et le lavage (${eur(k.entretienCourant)}).`,
          `D'autres se paient chaque trimestre, même quand un camion roule à moitié vide : les salaires des ${qte(k.chauffeurs)} chauffeurs, l'usure des camions et l'entretien de la flotte.`,
        ];
      },
      repere: (c) => `Coût d'${uneUnite(c)} ${accord(c, "livré")} = la route + la part du chauffeur + la part des camions.`,
      tableau: (c) => {
        const k = coutDUneLivraison(c);
        const une = `1 ${c.unite}`;
        return {
          titre: `${c.entreprise} · ce que coûte le premier trimestre`,
          colonnes: ["Montant", "Pour"],
          lignes: [
            { libelle: "Carburant et péages", valeurs: [eur(k.carburant), une] },
            { libelle: "Entretien courant, pneus, primes de route", valeurs: [eur(k.entretienCourant), une] },
            { libelle: `Salaires des ${qte(k.chauffeurs)} chauffeurs`, valeurs: [eur(k.salaires), "1 trimestre"] },
            { libelle: "Usure des camions (amortissement)", valeurs: [eur(k.amortissement), "1 trimestre"] },
            { libelle: "Entretien de la flotte", valeurs: [eur(k.entretienDeLaFlotte), "1 trimestre"] },
            { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "livré")}`, valeurs: [qte(k.palettes), "1 trimestre"] },
            { libelle: "Prix payé par le client", valeurs: [eur(k.prix), une] },
          ],
        };
      },
    },
    {
      id: "ranger",
      type: "tri",
      titre: "À chaque palette, ou chaque trimestre",
      notions: ["variable_costs", "fixed_costs"],
      question: (c) => `Rangez chaque coût : se paie-t-il à chaque ${c.unite} ${accord(c, "livré")}, ou chaque trimestre, quoi qu'il arrive ?`,
      categories: [
        { code: "unite", libelle: "À chaque palette livrée" },
        { code: "trimestre", libelle: "Chaque trimestre, quoi qu'il arrive" },
      ],
      elements: (c) => {
        const k = coutDUneLivraison(c);
        return [
          {
            libelle: "Carburant et péages",
            montant: k.carburant,
            categorie: "unite",
            pourquoi: `L'arène compte ${eur(k.carburant)} de carburant et de péages pour chaque ${c.unite} que les camions emportent : plus de ${c.unites}, plus de carburant.`,
          },
          {
            libelle: "Entretien courant, pneus, primes de route",
            montant: k.entretienCourant,
            categorie: "unite",
            pourquoi: `Les pneus s'usent et les primes de route se paient avec les livraisons : ${eur(k.entretienCourant)} par ${c.unite}.`,
          },
          {
            libelle: "Salaires des chauffeurs",
            montant: k.salaires,
            categorie: "trimestre",
            pourquoi: `Un chauffeur est payé au mois, qu'il livre beaucoup ou peu : ${eur(k.salaire)} par trimestre, charges comprises, dans les charges de structure de l'arène.`,
          },
          {
            libelle: "Usure des camions (amortissement)",
            montant: k.amortissement,
            categorie: "trimestre",
            pourquoi: "Un camion perd de sa valeur avec les années : l'arène en compte une part chaque trimestre, qu'il roule plein ou vide.",
          },
          {
            libelle: "Entretien de la flotte",
            montant: k.entretienDeLaFlotte,
            categorie: "trimestre",
            pourquoi: "C'est le budget d'entretien du trimestre, choisi sur la feuille de décision : il ne dépend pas du nombre de livraisons.",
          },
        ];
      },
      explication: (c) => [
        `Ce qui suit les ${c.unites} est un coût variable ; ce qui se paie chaque trimestre est une charge fixe. Pour savoir ce que coûte ${uneUnite(c)}, il faut répartir les charges fixes sur les ${c.unites} ${accordPluriel(c, "livré")}.`,
      ],
    },
    {
      id: "route",
      type: "montants",
      titre: "La route d'une palette",
      notions: ["variable_costs"],
      question: (c) => {
        const k = coutDUneLivraison(c);
        return `Avec « ${k.fournisseur.name} », l'offre de carburant du premier trimestre, calculez le coût de la route d'${uneUnite(c)} : le carburant et les péages (${eur(k.carburant)}), plus l'entretien courant, les pneus et les primes de route (${eur(k.entretienCourant)}).`;
      },
      champs: (c) => {
        const k = coutDUneLivraison(c);
        return [{ libelle: `Coût de la route par ${c.unite}`, attendu: k.route, calcul: `${eur(k.carburant)} + ${eur(k.entretienCourant)} = ${eur(k.route)}` }];
      },
      explication: (c) => {
        const k = coutDUneLivraison(c);
        return [`Chaque ${c.unite} ${accord(c, "emporté")} coûte ${eur(k.route)} de route. Dans l'arène, c'est le coût variable unitaire du premier trimestre.`];
      },
    },
    {
      id: "offres-de-carburant",
      type: "montants",
      titre: "Les autres offres de carburant",
      notions: ["variable_costs"],
      question: (c) => {
        const k = coutDUneLivraison(c);
        const p = scenarioByCode(c.code).scenario.product;
        const ecarts = k.autresOffres.map((f, i) => {
          const e = Math.round((f.costMultiplier - 1) * 1000) / 10;
          const ecart = `${pct(Math.abs(e))} ${e < 0 ? "de moins" : "de plus"}`;
          return i === 0 ? `« ${f.name} » fait payer le carburant et les péages ${ecart}` : `« ${f.name} », ${ecart}`;
        });
        return `L'arène propose d'autres façons de payer le carburant. ${ecarts.join(" ; ")}. L'entretien courant reste à ${eur(p.otherVariableCostPerUnit)}. Calculez le coût de la route d'${uneUnite(c)} avec chacune.`;
      },
      champs: (c) => {
        const k = coutDUneLivraison(c);
        const p = scenarioByCode(c.code).scenario.product;
        return k.autresOffres.map((f) => ({
          libelle: `Route par ${c.unite}, ${minuscule(f.name)}`,
          attendu: f.route,
          calcul: `${eur(p.materialCostPerUnit)} × ${nombre(f.costMultiplier)} + ${eur(p.otherVariableCostPerUnit)} = ${eur(f.route)}`,
        }));
      },
      explication: (c) => {
        const k = coutDUneLivraison(c);
        const offres = [{ ...k.fournisseur, route: k.route }, ...k.autresOffres];
        return [
          ...offres.map(
            (f) =>
              `« ${f.name} » : ${eur(f.route)} de route par ${c.unite} ; le carburant se paie ${paiement(f.paymentDelayDays)}, avec ${pct(Math.round(f.supplyRiskProbability * 1000) / 10)} de risque de rupture par trimestre.`,
          ),
          "L'offre la moins chère n'est pas toujours la plus sûre : dans l'arène, une rupture de carburant immobilise une partie des camions pendant le trimestre.",
        ];
      },
    },
    {
      id: "chauffeur",
      type: "montants",
      titre: "Le chauffeur, par palette",
      notions: ["payroll", "fixed_costs"],
      question: (c) => {
        const k = coutDUneLivraison(c);
        return `Les ${qte(k.chauffeurs)} chauffeurs coûtent ${eur(k.salaire)} chacun par trimestre, charges comprises. Au premier trimestre, ${c.entreprise} a livré ${qte(k.palettes)} ${c.unites}. Calculez les salaires du trimestre, puis la part du chauffeur dans chaque ${c.unite} ${accord(c, "livré")}, au centime.`;
      },
      champs: (c) => {
        const k = coutDUneLivraison(c);
        return [
          { libelle: "Salaires des chauffeurs du trimestre", attendu: k.salaires, calcul: `${qte(k.chauffeurs)} × ${eur(k.salaire)} = ${eur(k.salaires)}` },
          { libelle: `Part du chauffeur par ${c.unite}`, attendu: k.chauffeurParPalette, calcul: `${eur(k.salaires)} ÷ ${qte(k.palettes)} = ${eur(k.chauffeurParPalette)}` },
        ];
      },
      explication: (c) => {
        const k = coutDUneLivraison(c);
        return [
          `Chaque ${c.unite} porte ${eur(k.chauffeurParPalette)} de chauffeur. Si les camions avaient roulé pleins (${qte(k.capacite)} ${c.unites}), ${pronom(c)} n'en porterait que ${eur(k.chauffeurCamionsPleins)} : le salaire ne change pas, il se partage sur plus de livraisons.`,
        ];
      },
    },
    {
      id: "camions",
      type: "montants",
      titre: "Les camions, par palette",
      notions: ["depreciation", "fixed_costs"],
      question: (c) => {
        const k = coutDUneLivraison(c);
        return `Au premier trimestre, l'usure des camions (l'amortissement) compte ${eur(k.amortissement)}, et l'entretien de la flotte ${eur(k.entretienDeLaFlotte)}. Calculez leur part dans chaque ${c.unite} ${accord(c, "livré")}, au centime.`;
      },
      champs: (c) => {
        const k = coutDUneLivraison(c);
        return [
          {
            libelle: `Part des camions par ${c.unite}`,
            attendu: k.camionsParPalette,
            calcul: `(${eur(k.amortissement)} + ${eur(k.entretienDeLaFlotte)}) ÷ ${qte(k.palettes)} = ${eur(k.camionsParPalette)}`,
          },
        ];
      },
      explication: (c) => {
        const k = coutDUneLivraison(c);
        return [`Un camion s'use et s'entretient, qu'il roule plein ou non : ${eur(k.camionsParPalette)} par ${c.unite} au premier trimestre.`];
      },
    },
    {
      id: "cout-et-prix",
      type: "montants",
      titre: "Ce que coûte une palette livrée",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutDUneLivraison(c);
        return `Additionnez la route (${eur(k.route)}), la part du chauffeur (${eur(k.chauffeurParPalette)}) et celle des camions (${eur(k.camionsParPalette)}). Le client paie ${eur(k.prix)} par ${c.unite} : que reste-t-il ?`;
      },
      champs: (c) => {
        const k = coutDUneLivraison(c);
        return [
          {
            libelle: `Coût d'${uneUnite(c)} ${accord(c, "livré")}`,
            attendu: k.coutDUnePalette,
            calcul: `${eur(k.route)} + ${eur(k.chauffeurParPalette)} + ${eur(k.camionsParPalette)} = ${eur(k.coutDUnePalette)}`,
          },
          { libelle: `Ce qui reste par ${c.unite}`, attendu: k.reste, calcul: `${eur(k.prix)} − ${eur(k.coutDUnePalette)} = ${eur(k.reste)}` },
        ];
      },
      explication: (c) => {
        const k = coutDUneLivraison(c);
        return [
          k.reste > 0
            ? `Sur les ${eur(k.prix)} que paie le client, ${eur(k.coutDUnePalette)} paient la route, le chauffeur et les camions. Les ${eur(k.reste)} qui restent paient les autres charges de structure (${eur(k.autresCharges)} au premier trimestre : l'exploitation, les loyers, les assurances, la taxe à l'essieu), puis font le bénéfice.`
            : `Le client paie ${eur(k.prix)}, moins que les ${eur(k.coutDUnePalette)} de la route, du chauffeur et des camions : chaque ${c.unite} fait perdre ${eur(-k.reste)}, avant même les autres charges de structure.`,
        ];
      },
    },
    {
      id: "clienteles",
      type: "choix",
      titre: "Le prix de chaque clientèle",
      notions: ["full_unit_cost", "payment_terms"],
      tableau: (c) => {
        const k = coutDUneLivraison(c);
        return {
          titre: `${c.entreprise} · les clientèles du premier trimestre`,
          colonnes: [`${majuscule(c.unites)} ${accordPluriel(c, "livré")}`, "Chiffre d'affaires", `Prix par ${c.unite}`, "Paiement"],
          lignes: k.clienteles.map((l) => ({ libelle: l.nom, valeurs: [qte(l.palettes), eur(l.chiffreDAffaires), eur(l.prix), majuscule(paiement(l.delai))] })),
        };
      },
      question: (c) => {
        const k = coutDUneLivraison(c);
        return `${majuscule(uneUnite(c))} ${accord(c, "livré")} coûte ${eur(k.coutDUnePalette)}. D'après le tableau, quelles clientèles paient ${accord(c, "un")} ${c.unite} au moins ce qu'elle coûte ?`;
      },
      options: (c) => {
        const k = coutDUneLivraison(c);
        const n = k.clienteles.length;
        const prix = [...new Set(k.clienteles.map((l) => l.prix))];
        const lecture =
          prix.length === 1
            ? `Dans l'arène, ${c.entreprise} n'a qu'un prix par ${c.unite} : ${eur(prix[0]!)} pour toutes. Ce qui change d'une clientèle à l'autre, c'est quand l'argent arrive : ${k.clienteles.map((l) => `${minuscule(l.nom.split(" (")[0]!)} ${paiement(l.delai)}`).join(", ")}.`
            : `Les prix vont de ${eur(Math.min(...prix))} à ${eur(Math.max(...prix))}, pour un coût de ${eur(k.coutDUnePalette)}.`;
        return [
          {
            texte: "Toutes : chacune paie plus que la palette ne coûte",
            juste: k.couvrent === n,
            retour: k.couvrent === n ? `Oui. ${lecture}` : `Non : ${qte(n - k.couvrent)} paient moins que le coût. ${lecture}`,
          },
          {
            texte: "Une partie seulement : les autres paient moins que le coût",
            juste: k.couvrent > 0 && k.couvrent < n,
            retour: k.couvrent > 0 && k.couvrent < n ? `Oui. ${lecture}` : `Non. ${lecture}`,
          },
          {
            texte: "Aucune : le prix ne couvre pas ce que coûte une palette",
            juste: k.couvrent === 0,
            retour: k.couvrent === 0 ? `Oui. ${lecture}` : `Non. ${lecture}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost"],
      texte: (c) => {
        const k = coutDUneLivraison(c);
        return [
          `Au premier trimestre, ${uneUnite(c)} ${accord(c, "livré")} par ${c.entreprise} coûte ${eur(k.route)} de route, ${eur(k.chauffeurParPalette)} de chauffeur et ${eur(k.camionsParPalette)} de camions : ${eur(k.coutDUnePalette)}. Le client la paie ${eur(k.prix)}.`,
          `La route suit chaque ${c.unite}. Le chauffeur et les camions se paient chaque trimestre : plus les camions livrent, moins chaque ${c.unite} en porte.`,
        ];
      },
      repere: () => "Part d'une charge fixe par unité = charge du trimestre ÷ unités livrées.",
    },
  ],
};
