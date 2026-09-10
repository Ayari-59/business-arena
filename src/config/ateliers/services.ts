import { suppliersOf, toGamme, withoutRd } from "../../engine/gamme";
import { axisAffinity, COMMUNICATION_AXES, COMMUNICATION_AXIS_LABELS } from "../../engine/market/communication";
import type { CommunicationAxis, SegmentConfig } from "../../engine/types";
import { tempsDeTravail } from "../scenarios/registry";
import type { ScenarioDefinition } from "../scenarios/registry";

/**
 * LES DOSSIERS DE SERVICE DE L'ÉQUIPE.
 *
 * Une équipe de jeu d'entreprise se répartit les rôles : quelqu'un tient les
 * achats et le stock, quelqu'un le commercial, quelqu'un les ressources
 * humaines, quelqu'un la finance. Chacun a besoin de SA page : les chiffres
 * de son domaine tels que le jeu les applique, et ce qu'on attend de lui à
 * chaque tour. C'est ce que les jeux d'entreprise classiques distribuent en
 * quatre livrets ; ici les quatre se déduisent du scénario, donc chaque
 * secteur a les siens et ils disent le vrai (un chiffre recopié à la main
 * aurait divergé du moteur au premier réglage de l'enseignant).
 *
 * Ce sont des DONNÉES de l'élève : aucun corrigé, aucune préparation
 * d'enseignant n'y entre — le dossier élève tout entier est sous cette garde.
 */

export interface LigneService {
  libelle: string;
  valeur: string;
}

export interface DossierService {
  code: "approvisionnement" | "commercial" | "rh" | "financier";
  titre: string;
  /** Ce que ce service décide ou surveille, à chaque tour. */
  mission: string;
  /** Les chiffres de son domaine, tels que le jeu les applique. */
  lignes: LigneService[];
  /** Un tableau facultatif (références, clientèles, fournisseurs…). */
  tableau?: { entetes: string[]; lignes: string[][] };
  /** Les questions que ce service doit avoir posées avant de valider le tour. */
  questions: string[];
}

/** Une référence de la gamme, telle que le dossier la présente. */
export interface ReferenceDossier {
  code: string;
  nom: string;
  prixUsuel: number;
  coutAchat: number;
  fraisVariables: number;
  coutVariable: number;
  margeUsuelle: number;
  stockOuverture: number;
  saison: number[];
}

const euro = (v: number) =>
  `${Math.round(v * 100) / 100} €`.replace(".", ",").replace(/(\d)(?=(\d{3})+(?:,|\s€))/g, "$1 ");
const entier = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/[  ]/g, " ");
const pct = (v: number) => `${Math.round(v * 100)} %`;
const jours = (d: number) => (d > 0 ? `à ${d} jours` : "comptant");

/** La gamme du scénario, prix et coûts par référence (une seule en mono-produit). */
export function referencesDuDossier(definition: ScenarioDefinition, tours: number): ReferenceDossier[] {
  const config = definition.scenario;
  const etat = definition.company("dossier", definition.playerTeamName, "human");
  return toGamme(config).map((p) => {
    const dominant = [...p.market.segments].sort((a, b) => b.size - a.size)[0];
    const prix = dominant?.refPrice ?? 0;
    const stock =
      etat.finishedGoodsByProduct?.[p.code]?.quantity ??
      (config.products ? 0 : etat.finishedGoods.quantity);
    return {
      code: p.code,
      nom: config.products ? p.name : definition.vocabulary.unit,
      prixUsuel: prix,
      coutAchat: p.materialCostPerUnit,
      fraisVariables: p.otherVariableCostPerUnit,
      coutVariable: p.materialCostPerUnit + p.otherVariableCostPerUnit,
      margeUsuelle: prix - p.materialCostPerUnit - p.otherVariableCostPerUnit,
      stockOuverture: Math.round(stock),
      saison: Array.from({ length: tours }, (_, i) => p.market.seasonality[i] ?? 1),
    };
  });
}

/** Le tour où la demande de la gamme culmine, sur les tours joués. */
function tourFort(definition: ScenarioDefinition, tours: number): number {
  const gamme = toGamme(definition.scenario);
  let meilleur = 1;
  let max = -1;
  for (let t = 1; t <= tours; t++) {
    const demande = gamme.reduce(
      (s, p) =>
        s +
        p.market.segments.reduce((u, seg) => u + seg.size * (seg.seasonality?.[t - 1] ?? p.market.seasonality[t - 1] ?? 1), 0),
      0,
    );
    if (demande > max) {
      max = demande;
      meilleur = t;
    }
  }
  return meilleur;
}

/**
 * Les axes de communication qui portent et ceux qui desservent auprès d'une
 * clientèle, au prix qu'elle a l'habitude de payer. L'innovation dépend de ce
 * qu'on a de neuf à montrer : elle se juge en partie, pas dans le dossier.
 */
function axesPourClientele(segment: SegmentConfig): { portent: string[]; desservent: string[] } {
  const portent: string[] = [];
  const desservent: string[] = [];
  const nom = (a: CommunicationAxis) => COMMUNICATION_AXIS_LABELS[a].label.replace(/^(Le |La |L')/, "").toLowerCase();
  for (const axe of COMMUNICATION_AXES) {
    if (axe === "innovation") continue;
    const a = axisAffinity(axe, segment, { price: segment.refPrice, techLevel: 0, freshlyLaunched: false });
    if (a === "fit") portent.push(nom(axe));
    if (a === "misfit") desservent.push(nom(axe));
  }
  return { portent, desservent };
}

export function dossiersDeService(
  definition: ScenarioDefinition,
  tours: number,
  options: { sansRd?: boolean } = {},
): DossierService[] {
  const config = options.sansRd ? withoutRd(definition.scenario) : definition.scenario;
  const v = definition.vocabulary;
  const etat = definition.company("dossier", definition.playerTeamName, "human");
  const gamme = referencesDuDossier(definition, tours);
  const multi = gamme.length > 1;
  const clienteles = toGamme(config).flatMap((p) =>
    p.market.segments.map((s) => ({ produit: p.name, segment: s, saison: p.market.seasonality })),
  );
  const pic = tourFort(definition, tours);
  const heures = etat.headcount * etat.hoursPerEmployee;
  // L'heure partout, le jour là où c'est l'unité du métier (le conseil).
  const temps = tempsDeTravail(v);
  const echeance = (etat.loans ?? []).reduce((s, l) => s + l.perRound, 0);
  const restant = (etat.loans ?? []).reduce((s, l) => s + l.remaining, 0);
  // Les références à développer avant de vendre (levier R&D), et la
  // communication (marque en gamme, axe partout où le levier existe).
  const aDevelopper = config.rd ? toGamme(config).filter((p) => p.development) : [];
  const communication = config.communication;
  const marque = communication && multi;

  const approvisionnement: DossierService = {
    code: "approvisionnement",
    titre: `Service approvisionnement et ${v.leftoverLabel.toLowerCase()}`,
    mission: `Décider chaque tour ${v.productionPlanLabel.toLowerCase()}${multi ? ", référence par référence," : ""} de façon à servir la demande sans laisser dormir de l'argent en ${v.leftoverLabel.toLowerCase()} ; choisir le fournisseur ; tenir la capacité.`,
    lignes: [
      { libelle: `${v.capacityLabel}`, valeur: `${entier(etat.machineCapacity)} ${v.perRoundLabel}` },
      { libelle: `${v.leftoverLabel} à l'ouverture`, valeur: `${entier(gamme.reduce((s, g) => s + g.stockOuverture, 0))} ${v.units}` },
      { libelle: "Délai de règlement des fournisseurs", valeur: jours(config.finance.supplierPaymentDelayDays) },
      ...aDevelopper.map((p) => ({
        libelle: `À développer avant de vendre : ${p.name}`,
        valeur: `${euro(p.development!.cost)} de R&D cumulée, vendable au tour qui suit et au plus tôt au tour ${p.development!.availableFromRound ?? 1}`,
      })),
      // Les fournisseurs : ceux du scénario en mono-produit ; en gamme, le
      // catalogue de chaque référence quand elle a le sien, avec le prix
      // d'achat de la référence chez chacun.
      ...toGamme(config).flatMap((p) => {
        const catalogue = suppliersOf(p, config) ?? [];
        const reference = catalogue[0];
        return catalogue.map((s) => {
          const ratio = reference ? s.costMultiplier / reference.costMultiplier : s.costMultiplier;
          const ecart = Math.round((ratio - 1) * 100);
          return {
            libelle: multi ? `${p.name} · ${s.name}` : s.name,
            valeur: `${v.materialLabel.toLowerCase()} ${euro(p.materialCostPerUnit * s.costMultiplier)} par ${v.unit} (${ecart === 0 ? "coût de référence" : `${ecart > 0 ? "+" : "−"}${Math.abs(ecart)} %`}) · règlement ${jours(s.paymentDelayDays)}${s.qualityBonus !== 0 ? ` · qualité ${s.qualityBonus > 0 ? "+" : "−"}${Math.abs(Math.round(s.qualityBonus * 100))} %` : ""}${s.supplyRiskProbability > 0 ? ` · risque de rupture ${pct(s.supplyRiskProbability)} par tour` : ""}`,
          };
        });
      }),
    ],
    tableau: {
      entetes: [multi ? "Référence" : "Produit", v.materialLabel, v.otherVariableLabel, "Coût variable", `${v.leftoverLabel} à l'ouverture`],
      lignes: gamme.map((g) => [g.nom, euro(g.coutAchat), euro(g.fraisVariables), euro(g.coutVariable), `${entier(g.stockOuverture)} ${v.units}`]),
    },
    questions: [
      `Combien de ${v.units} la demande prévue du tour appelle-t-elle, une fois déduit ce qui dort déjà en ${v.leftoverLabel.toLowerCase()} ?`,
      multi
        ? "Si la somme des volumes dépasse la capacité, quelle référence sacrifier en premier : celle qui rapporte le moins par unité de capacité."
        : "Le volume tient-il dans la capacité ? Au-delà, il est réduit d'office.",
      "Le fournisseur retenu se paie-t-il comptant ou à délai ? La réponse change la trésorerie, pas le résultat.",
      ...(aDevelopper.length > 0
        ? ["Une référence à développer ne se vend qu'au tour qui suit le tour où sa R&D cumulée atteint son coût : quel tour visez-vous, et que produisez-vous d'ici là ?"]
        : []),
    ],
  };

  const commercial: DossierService = {
    code: "commercial",
    titre: "Service commercial",
    mission: `Fixer ${v.priceLabel.toLowerCase()}${multi ? " de chaque référence" : ""} et le budget marketing${marque ? ", partagé entre la marque et chaque référence," : ""}${communication ? " puis choisir l'axe de communication," : ""} en lisant chaque clientèle : ce qu'elle a l'habitude de payer, ce qu'elle supporte, quand elle achète${communication ? ", ce qu'elle regarde" : ""}.`,
    lignes: [
      { libelle: "Budget marketing de référence par tour", valeur: euro(0.5 * config.marketing.scale) },
      ...(marque
        ? [
            {
              libelle: "Budget de marque de référence par tour",
              valeur: `${euro(0.5 * communication.brandScale)} · bâtit une notoriété qui porte toute la gamme au tour suivant, jusqu'à +${Math.round(communication.brandMax * 100)} %, et s'use si l'on cesse`,
            },
          ]
        : []),
      ...(communication
        ? [
            {
              libelle: "Axe de communication (un seul par tour)",
              valeur: `${COMMUNICATION_AXES.map((a) => COMMUNICATION_AXIS_LABELS[a].label.toLowerCase()).join(", ")} · un axe qui parle à la clientèle rend ×${communication.axisFit.toLocaleString("fr-FR")}, un axe qui ne lui parle pas ×${communication.axisMisfit.toLocaleString("fr-FR")} ; en changer use ${Math.round((1 - communication.axisSwitchDecay) * 100)} % de la notoriété acquise`,
            },
          ]
        : []),
      { libelle: "Tour de la demande la plus forte", valeur: `tour ${pic}` },
      ...(config.orderOffers ?? []).slice(0, 3).map((o) => ({
        libelle: `Commande exceptionnelle possible : ${o.title}`,
        valeur: `${entier(o.units)} ${v.units} à ${euro(o.price)}, règlement ${jours(o.paymentDelayDays)}`,
      })),
    ],
    tableau: {
      entetes: [
        multi ? "Clientèle · référence" : "Clientèle",
        "Demande de base par tour",
        "Prix usuel",
        "Règlement",
        `Saison (tour ${pic})`,
        ...(communication ? ["Axe qui porte · axe qui dessert"] : []),
      ],
      lignes: clienteles.map((c) => [
        c.segment.name,
        `${entier(c.segment.size)} ${v.units}`,
        euro(c.segment.refPrice),
        jours(c.segment.paymentDelayDays),
        `×${(c.segment.seasonality?.[pic - 1] ?? c.saison[pic - 1] ?? 1).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`,
        ...(communication
          ? [
              (() => {
                const { portent, desservent } = axesPourClientele(c.segment);
                return `${portent.length > 0 ? portent.join(", ") : "aucun"} · ${desservent.length > 0 ? desservent.join(", ") : "aucun"}`;
              })(),
            ]
          : []),
      ]),
    },
    questions: [
      "Quel prix chaque clientèle a-t-elle l'habitude de payer, et à partir de quel prix se détourne-t-elle ?",
      multi
        ? "Quelle référence porte la marge, quelle référence porte le volume ? Le mix vendu décide du seuil autant que les quantités."
        : "Un euro de prix en plus rapporte-t-il plus de marge qu'il ne coûte de ventes ?",
      "Les clientèles qui règlent à délai pèsent sur la trésorerie : le service financier doit le savoir avant la validation.",
      ...(communication
        ? ["Un seul axe pour toutes les clientèles : à laquelle parle-t-il, laquelle dessert-il, et l'entreprise est-elle crédible en le tenant ?"]
        : []),
    ],
  };

  const rh: DossierService = {
    code: "rh",
    titre: "Service ressources humaines",
    mission: config.hr
      ? `Ajuster l'effectif, la formation et les salaires pour que la main-d'œuvre suive le volume décidé, sans payer des ${temps.pluriel} qui ne servent pas.`
      : "Vérifier chaque tour que la main-d'œuvre disponible couvre le volume décidé : c'est la seconde limite de l'entreprise, après la capacité.",
    lignes: [
      { libelle: "Effectif", valeur: `${etat.headcount} personnes` },
      { libelle: `${temps.Pluriel} disponibles par tour`, valeur: `${entier(heures)} ${temps.abrege} (${etat.hoursPerEmployee} ${temps.abrege} par personne)` },
      ...(config.hr
        ? [
            { libelle: "Salaire chargé par personne et par tour", valeur: euro(config.hr.salaryPerEmployeePerRound) },
            { libelle: "Coût d'une embauche", valeur: euro(config.hr.hiringCost) },
            { libelle: "Coût d'un licenciement", valeur: euro(config.hr.firingCost) },
            { libelle: "Budget de formation de référence", valeur: euro(config.hr.trainingScale) },
            { libelle: "Embauches possibles par tour", valeur: `${config.hr.maxHiresPerRound} (effectif maximal ${config.hr.maxHeadcount})` },
          ]
        : []),
    ],
    tableau: {
      entetes: [multi ? "Référence" : "Produit", `${temps.Pluriel} par unité`, `Capacité de l'équipe (${v.perRoundLabel})`],
      lignes: toGamme(config).map((p) => [
        config.products ? p.name : v.unit,
        `${p.hoursPerUnit.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${temps.abrege}`,
        entier(p.hoursPerUnit > 0 ? heures / p.hoursPerUnit : 0),
      ]),
    },
    questions: [
      `Les ${temps.pluriel} nécessaires au volume décidé tiennent-${temps.pronom} dans les ${temps.pluriel} disponibles ?`,
      config.hr
        ? "Une embauche coûte tout de suite et ne produit qu'au tour suivant : le tour du pic s'anticipe."
        : "Si la main-d'œuvre est la limite, le levier n'est pas ouvert à ce niveau : le volume doit s'y plier.",
      "Un salaire sous le marché fait partir des salariés ; au-dessus, il motive. Les deux se paient.",
    ],
  };

  const financier: DossierService = {
    code: "financier",
    titre: "Service financier",
    mission: "Prévoir la trésorerie du tour avant de valider : ce qui entre, ce qui sort, et quand. Un résultat positif ne garantit pas une caisse positive.",
    lignes: [
      { libelle: "Trésorerie à l'ouverture", valeur: euro(etat.finance.cash) },
      { libelle: "Créances clients à encaisser", valeur: euro(etat.finance.receivables) },
      { libelle: "Dettes fournisseurs à régler", valeur: euro(etat.finance.payables) },
      { libelle: `${v.leftoverLabel} (valeur au bilan)`, valeur: euro(etat.finance.inventoryValue) },
      { libelle: "Immobilisations nettes", valeur: euro(etat.finance.fixedAssetsNet) },
      { libelle: "Capitaux propres", valeur: euro(etat.finance.equity) },
      { libelle: "Emprunt restant dû", valeur: `${euro(restant)} · échéance ${euro(echeance)} par tour` },
      { libelle: "Charges de structure décaissées par tour", valeur: euro(config.fixedCostsPerRound) },
      { libelle: "Amortissements par tour", valeur: euro(config.finance.depreciationPerRound) },
      { libelle: "Taux d'emprunt · taux de découvert", valeur: `${pct(config.finance.loanAnnualRate)} · ${pct(config.finance.overdraftAnnualRate)} par an` },
      { libelle: "Découvert autorisé", valeur: euro(config.finance.overdraftLimit) },
      { libelle: "Impôt sur les bénéfices", valeur: pct(config.finance.taxRate) },
      ...aDevelopper.map((p) => ({
        libelle: `R&D à financer avant de vendre ${p.name}`,
        valeur: `${euro(p.development!.cost)}, en charge du tour où elle s'engage, décaissée dans le tour`,
      })),
    ],
    questions: [
      "Quelles ventes du tour seront encaissées ce tour-ci, et lesquelles au tour suivant ?",
      "Les achats du tour se paient-ils maintenant ou plus tard ? Le fournisseur choisi fixe la réponse.",
      "Le solde prévu en fin de tour reste-t-il au-dessus du découvert autorisé, y compris au tour du pic où l'on achète avant de vendre ?",
      ...(aDevelopper.length > 0
        ? ["La R&D se paie tout de suite et ne vend qu'au tour suivant : la caisse du tour la supporte-t-elle sans passer sous le découvert ?"]
        : []),
    ],
  };

  return [approvisionnement, commercial, rh, financier];
}
