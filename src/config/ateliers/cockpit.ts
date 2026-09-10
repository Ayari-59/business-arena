import type { CompanyState, EngineScenarioConfig } from "../../engine/types";
import { toGamme, type GammeProduct } from "../../engine/gamme";
import type { ScenarioDefinition } from "../scenarios/registry";

/**
 * LE COCKPIT : un classeur d'aide à la décision, référence par référence.
 *
 * Le tableau de bord en tableur relève ce qui s'est passé. Le cockpit, lui,
 * regarde devant : l'équipe y pose une demande prévue, un prix et un volume
 * pour chaque référence et chaque tour, et le classeur en déduit ce que la
 * réserve contiendra, ce qui manquera, ce que la boutique encaissera et ce
 * qu'il restera en caisse — avant de valider quoi que ce soit dans le jeu.
 * C'est le cahier de prévision que tout jeu d'entreprise sérieux distribue
 * avec le dossier de l'équipe : une prévision logistique et une prévision de
 * résultat et de trésorerie, qui se recalculent à chaque hypothèse.
 *
 * Le classeur est d'abord une SPÉCIFICATION pure : des feuilles, des lignes,
 * des cellules portant une valeur ou une formule. Un test la relit comme un
 * tableur le ferait et résout chaque référence de formule vers l'intitulé
 * qu'elle vise, parce qu'un classeur engendré dont une référence est décalée
 * d'un rang s'ouvre, calcule, et ment. Le rendu en fichier (.xlsx) est ailleurs.
 *
 * Tout vient du scénario : la gamme (un produit en mono-produit, cinq chez
 * MAILLE & CO), les clientèles, les délais, la structure, le bilan
 * d'ouverture. Un atelier de n'importe quel secteur a donc son cockpit, et une
 * équipe en cours de partie reçoit le sien, prérempli de son historique.
 *
 * Les formules emploient un petit nombre de fonctions (SUM, MIN, MAX, IF)
 * écrites dans leur forme canonique : un fichier .xlsx les stocke ainsi et
 * chaque tableur les affiche dans sa langue. Ce n'est vrai que du format
 * .xlsx — un CSV n'a pas cette garantie, d'où le choix du format ici.
 */

export type Format = "euro" | "unites" | "pct" | "coef" | "texte";
export type Style = "titre" | "section" | "entete" | "saisie" | "calcul" | "note" | "normal";

export interface CelluleSpec {
  /** Une valeur posée dans la cellule (texte ou nombre). */
  v?: string | number | null;
  /** Une formule, sans le « = » de tête. */
  f?: string;
  style?: Style;
  format?: Format;
}

export interface FeuilleSpec {
  nom: string;
  largeurs: number[];
  lignes: CelluleSpec[][];
}

export interface ClasseurSpec {
  /** Le nom du fichier, sans extension, en ASCII. */
  fichier: string;
  feuilles: FeuilleSpec[];
}

/** L'historique d'une équipe : ce que les tours joués ont donné, référence par référence. */
export interface HistoriqueEquipe {
  equipe: string;
  tours: {
    tour: number;
    produits: {
      code: string;
      prix: number;
      misEnRayon: number;
      vendu: number;
      manque: number;
      stockFin: number;
      chiffreAffaires: number;
    }[];
    chiffreAffaires: number;
    resultatNet: number;
    tresorerieNette: number;
  }[];
  /** L'état d'où repart l'équipe : stock par référence et caisse à l'ouverture du tour à jouer. */
  ouverture: {
    tour: number;
    stocks: Record<string, number>;
    caisse: number;
    creances: number;
    dettesFournisseurs: number;
  };
}

export interface CockpitSource {
  scenario: ScenarioDefinition;
  /** Le scénario réellement joué (instantané de la partie), sinon celui du registre. */
  config?: EngineScenarioConfig;
  /** Les tours que le cockpit couvre, dans l'ordre (1..n pour un atelier, les tours restants pour une équipe). */
  tours: number[];
  /** Le nombre d'entreprises sur le marché (équipes + concurrents pilotés) : la part moyenne de chacune. */
  concurrents: number;
  historique?: HistoriqueEquipe;
}

/** La lettre de colonne d'un tour : le tour d'indice 0 est en B, A portant les intitulés. */
export const colonne = (index: number): string => {
  let n = index + 1; // B = 1
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

const NOM_PARAMETRES = "Paramètres";
const NOM_LOGISTIQUE = "Prévision logistique";
const NOM_RESULTAT = "Prévision résultat";
const NOM_HISTORIQUE = "Historique";

/** Une référence à une cellule d'une autre feuille, telle qu'un tableur l'attend. */
const ref = (feuille: string, adresse: string) => `'${feuille}'!${adresse}`;

const t = (v: string, style: Style = "normal"): CelluleSpec => ({ v, style });
const n = (v: number, format: Format, style: Style = "normal"): CelluleSpec => ({ v, format, style });
const f = (formule: string, format: Format, style: Style = "calcul"): CelluleSpec => ({
  f: formule,
  format,
  style,
});
const vide = (): CelluleSpec => ({});

/** Part du chiffre d'affaires de base réglée à crédit (clientèles à délai). */
function partCredit(gamme: GammeProduct[]): number {
  let total = 0;
  let credit = 0;
  for (const p of gamme) {
    for (const s of p.market.segments) {
      const poids = s.size * s.refPrice;
      total += poids;
      if (s.paymentDelayDays > 0) credit += poids;
    }
  }
  return total > 0 ? credit / total : 0;
}

/** Le prix usuel d'un produit : celui de sa clientèle dominante. */
function prixUsuel(p: GammeProduct): number {
  const main = [...p.market.segments].sort((a, b) => b.size - a.size)[0];
  return main?.refPrice ?? 0;
}

/** La demande de base d'un produit au tour donné, rapportée à une entreprise moyenne. */
function demandeMoyenne(p: GammeProduct, tour: number, diviseur: number): number {
  const idx = tour - 1;
  const total = p.market.segments.reduce((sum, s) => {
    const saison = s.seasonality?.[idx] ?? p.market.seasonality[idx] ?? 1;
    const croissance = Math.pow(1 + s.growth, idx);
    return sum + s.size * saison * croissance;
  }, 0);
  return Math.round(total / Math.max(1, diviseur));
}

export function cockpitSpec(source: CockpitSource): ClasseurSpec {
  const definition = source.scenario;
  const config = source.config ?? definition.scenario;
  const gamme = toGamme(config);
  const etat: CompanyState = definition.company("cockpit", definition.playerTeamName, "human");
  const tours = source.tours;
  const v = definition.vocabulary;
  // La demande de base d'une entreprise moyenne. Un scénario du registre est
  // calibré pour trois concurrents et le marché est redimensionné à la
  // création de la partie ; un instantané de partie porte déjà ce
  // dimensionnement, et se partage donc entre les concurrents réels.
  const diviseur = source.config ? Math.max(1, source.concurrents) : Math.min(Math.max(1, source.concurrents), 3);
  const hist = source.historique;
  const partDifferee = Math.min(1, config.finance.supplierPaymentDelayDays / config.roundDays);
  const credit = partCredit(gamme);
  const echeance = (etat.loans ?? []).reduce((s, l) => s + l.perRound, 0);
  const ouverture = hist?.ouverture;

  // ------------------------------------------------------------------ Paramètres
  const P: CelluleSpec[][] = [];
  const param: Record<string, string> = {};
  const poser = (cle: string, libelle: string, valeur: number, format: Format, note?: string) => {
    P.push([t(libelle), n(valeur, format, "saisie"), note ? t(note, "note") : vide()]);
    param[cle] = ref(NOM_PARAMETRES, `B${P.length}`);
  };

  P.push([t(`${definition.title} · cockpit de prévision`, "titre")]);
  P.push([t(hist ? `Équipe ${hist.equipe}` : "Feuille de paramètres : ce que le jeu applique. Modifiez-la seulement si l'enseignant a changé les règles.", "note")]);
  P.push([]);
  P.push([t("L'ENTREPRISE", "section")]);
  poser("capacite", `${v.capacityLabel} (${v.perRoundLabel})`, Math.round(etat.machineCapacity), "unites");
  poser("heures", "Heures de main-d'œuvre disponibles par tour", Math.round(etat.headcount * etat.hoursPerEmployee * etat.productivity), "unites", `${etat.headcount} personnes × ${etat.hoursPerEmployee} h`);
  poser("fixes", "Charges de structure décaissées par tour", config.fixedCostsPerRound, "euro");
  poser("amortissements", "Amortissements par tour", config.finance.depreciationPerRound, "euro");
  poser("marketingRef", "Budget marketing de référence par tour", Math.round(0.5 * config.marketing.scale), "euro");
  poser("qualiteRef", "Budget qualité de référence par tour", Math.round(0.5 * config.production.qualityScale), "euro");
  poser("maintenanceRef", "Budget maintenance de référence par tour", Math.round(config.production.maintenanceReference), "euro");
  poser("is", "Taux d'impôt sur les bénéfices", config.finance.taxRate, "pct");
  poser("echeance", "Échéance d'emprunt par tour", Math.round(echeance), "euro");
  poser("decouvert", "Découvert autorisé", config.finance.overdraftLimit, "euro");
  P.push([]);
  P.push([t("LES DÉLAIS", "section")]);
  poser("partCredit", "Part du chiffre d'affaires encaissée au tour suivant", Math.round(credit * 100) / 100, "pct", "clientèles qui règlent à délai, pondérées par leur poids");
  poser("partDifferee", "Part des achats payée au tour suivant", Math.round(partDifferee * 100) / 100, "pct", `délai fournisseur ${config.finance.supplierPaymentDelayDays} j sur un tour de ${config.roundDays} j`);
  P.push([]);
  P.push([t("À L'OUVERTURE", "section")]);
  poser("caisse", "Trésorerie", Math.round(ouverture?.caisse ?? etat.finance.cash), "euro");
  poser("creances", "Créances clients à encaisser", Math.round(ouverture?.creances ?? etat.finance.receivables), "euro");
  poser("dettes", "Dettes fournisseurs à régler", Math.round(ouverture?.dettesFournisseurs ?? etat.finance.payables), "euro");
  P.push([]);
  P.push([t("LA GAMME", "section")]);
  P.push([
    t("Référence", "entete"),
    t("Prix usuel", "entete"),
    t(v.materialLabel, "entete"),
    t(v.otherVariableLabel, "entete"),
    t("Coût variable", "entete"),
    t("Heures par unité", "entete"),
    t(`${v.leftoverLabel} à l'ouverture`, "entete"),
    ...tours.map((tour) => t(`Saison T${tour}`, "entete")),
  ]);
  const ligneGamme: Record<string, number> = {};
  for (const p of gamme) {
    const stock = ouverture?.stocks[p.code] ?? etat.finishedGoodsByProduct?.[p.code]?.quantity ?? (gamme.length === 1 ? etat.finishedGoods.quantity : 0);
    P.push([
      t(p.name),
      n(prixUsuel(p), "euro", "saisie"),
      n(p.materialCostPerUnit, "euro", "saisie"),
      n(p.otherVariableCostPerUnit, "euro", "saisie"),
      f(`C${P.length + 1}+D${P.length + 1}`, "euro"),
      n(p.hoursPerUnit, "coef", "saisie"),
      n(Math.round(stock), "unites", "saisie"),
      ...tours.map((tour) => n(p.market.seasonality[tour - 1] ?? 1, "coef")),
    ]);
    ligneGamme[p.code] = P.length;
  }
  const gammeRef = (code: string, col: "B" | "C" | "D" | "E" | "F" | "G") =>
    ref(NOM_PARAMETRES, `${col}${ligneGamme[code]}`);

  // ------------------------------------------------------------------ Prévision logistique
  const L: CelluleSpec[][] = [];
  const ligneL: Record<string, Record<string, number>> = {};
  L.push([t(`${NOM_LOGISTIQUE} · ${definition.title}`, "titre")]);
  L.push([
    t(
      "Cases jaunes : vos hypothèses et vos décisions. Cases grises : ce que le classeur en déduit. La demande préremplie est la part moyenne du marché ; la vôtre dépendra de votre prix, de votre marketing et de vos concurrents.",
      "note",
    ),
  ]);
  L.push([]);
  L.push([t("", "entete"), ...tours.map((tour) => t(`Tour ${tour}`, "entete"))]);

  const dernier = hist?.tours.at(-1);
  for (const p of gamme) {
    const lignes: Record<string, number> = {};
    L.push([t(p.name.toUpperCase(), "section")]);
    const poserLigne = (cle: string, libelle: string, cellules: CelluleSpec[]) => {
      L.push([t(libelle), ...cellules]);
      lignes[cle] = L.length;
    };
    const rangDemande = L.length + 1;
    const dernierProduit = dernier?.produits.find((x) => x.code === p.code);
    poserLigne(
      "demande",
      "Demande prévue (à saisir)",
      tours.map((tour) => {
        const base = demandeMoyenne(p, tour, diviseur);
        // Une équipe en cours de partie part de ce qu'elle a réellement vu au
        // dernier tour, ramené à la saison du tour visé.
        if (dernierProduit && dernier) {
          const vu = dernierProduit.vendu + dernierProduit.manque;
          const saisonVue = p.market.seasonality[dernier.tour - 1] ?? 1;
          const saison = p.market.seasonality[tour - 1] ?? 1;
          return n(Math.round(saisonVue > 0 ? (vu * saison) / saisonVue : vu), "unites", "saisie");
        }
        return n(base, "unites", "saisie");
      }),
    );
    poserLigne(
      "prix",
      `${v.priceLabel} (à saisir)`,
      tours.map(() => n(dernierProduit?.prix ?? prixUsuel(p), "euro", "saisie")),
    );
    const rangPrix = rangDemande + 1;
    const rangStockDebut = rangDemande + 3;
    poserLigne(
      "plan",
      `${v.productionPlanLabel} (à saisir — préremplie : de quoi servir la demande)`,
      tours.map((_, i) => f(`MAX(0,${colonne(i)}${rangDemande}-${colonne(i)}${rangStockDebut})`, "unites", "saisie")),
    );
    const rangPlan = rangDemande + 2;
    poserLigne(
      "stockDebut",
      `${v.leftoverLabel} en début de tour`,
      tours.map((_, i) =>
        i === 0 ? f(gammeRef(p.code, "G"), "unites") : f(`${colonne(i - 1)}${rangDemande + 6}`, "unites"),
      ),
    );
    poserLigne(
      "disponible",
      "Disponible à la vente",
      tours.map((_, i) => f(`${colonne(i)}${rangStockDebut}+${colonne(i)}${rangPlan}`, "unites")),
    );
    const rangDisponible = rangDemande + 4;
    poserLigne(
      "ventes",
      "Ventes prévues",
      tours.map((_, i) => f(`MIN(${colonne(i)}${rangDisponible},${colonne(i)}${rangDemande})`, "unites")),
    );
    const rangVentes = rangDemande + 5;
    poserLigne(
      "stockFin",
      `${v.leftoverLabel} en fin de tour`,
      tours.map((_, i) => f(`${colonne(i)}${rangDisponible}-${colonne(i)}${rangVentes}`, "unites")),
    );
    poserLigne(
      "manque",
      "Demande non servie",
      tours.map((_, i) => f(`${colonne(i)}${rangDemande}-${colonne(i)}${rangVentes}`, "unites")),
    );
    poserLigne(
      "ca",
      "Chiffre d'affaires prévu",
      tours.map((_, i) => f(`${colonne(i)}${rangPrix}*${colonne(i)}${rangVentes}`, "euro")),
    );
    poserLigne(
      "achats",
      `${v.materialLabel} (${v.productionLabel.toLowerCase()} du tour)`,
      tours.map((_, i) => f(`${gammeRef(p.code, "C")}*${colonne(i)}${rangPlan}`, "euro")),
    );
    poserLigne(
      "cv",
      "Coût variable des ventes",
      tours.map((_, i) => f(`${gammeRef(p.code, "E")}*${colonne(i)}${rangVentes}`, "euro")),
    );
    poserLigne(
      "marge",
      "Marge sur coût variable",
      tours.map((_, i) => f(`${colonne(i)}${rangDemande + 8}-${colonne(i)}${rangDemande + 10}`, "euro")),
    );
    L.push([]);
    ligneL[p.code] = lignes;
  }

  L.push([t("TOUTES RÉFÉRENCES", "section")]);
  const somme = (cle: string, i: number) =>
    gamme.map((p) => `${colonne(i)}${ligneL[p.code]![cle]}`).join("+");
  const totaux: Record<string, number> = {};
  const poserTotal = (cle: string, libelle: string, cellules: CelluleSpec[]) => {
    L.push([t(libelle), ...cellules]);
    totaux[cle] = L.length;
  };
  poserTotal("plan", `Total ${v.productionPlanLabel.toLowerCase()}`, tours.map((_, i) => f(somme("plan", i), "unites")));
  poserTotal("capacite", v.capacityLabel, tours.map(() => f(param.capacite!, "unites")));
  poserTotal(
    "depassement",
    "Au-delà de la capacité (réduit dans la même proportion sur toutes les références)",
    tours.map((_, i) => f(`MAX(0,${colonne(i)}${totaux.plan}-${colonne(i)}${totaux.capacite})`, "unites")),
  );
  poserTotal(
    "heures",
    "Heures de main-d'œuvre nécessaires",
    tours.map((_, i) => f(gamme.map((p) => `${gammeRef(p.code, "F")}*${colonne(i)}${ligneL[p.code]!.plan}`).join("+"), "unites")),
  );
  poserTotal("heuresDispo", "Heures disponibles", tours.map(() => f(param.heures!, "unites")));
  poserTotal("ventes", "Total ventes prévues", tours.map((_, i) => f(somme("ventes", i), "unites")));
  poserTotal("manque", "Total demande non servie", tours.map((_, i) => f(somme("manque", i), "unites")));
  poserTotal("ca", "Chiffre d'affaires prévu, toutes références", tours.map((_, i) => f(somme("ca", i), "euro")));
  poserTotal("achats", `Total ${v.materialLabel.toLowerCase()}`, tours.map((_, i) => f(somme("achats", i), "euro")));
  poserTotal("cv", "Coût variable des ventes, toutes références", tours.map((_, i) => f(somme("cv", i), "euro")));
  poserTotal("marge", "Marge sur coût variable, toutes références", tours.map((_, i) => f(somme("marge", i), "euro")));

  // ------------------------------------------------------------------ Prévision résultat & trésorerie
  const R: CelluleSpec[][] = [];
  const ligneR: Record<string, number> = {};
  const poserR = (cle: string, libelle: string, cellules: CelluleSpec[], style?: Style) => {
    R.push([t(libelle, style ?? "normal"), ...cellules]);
    ligneR[cle] = R.length;
  };
  const logi = (cle: string, i: number) => ref(NOM_LOGISTIQUE, `${colonne(i)}${totaux[cle]}`);
  R.push([t(`${NOM_RESULTAT} et trésorerie · ${definition.title}`, "titre")]);
  R.push([
    t(
      "Le résultat se constate à la vente, la trésorerie au règlement : les deux blocs ne bougent pas ensemble, et c'est ce que ce classeur montre.",
      "note",
    ),
  ]);
  R.push([]);
  R.push([t("", "entete"), ...tours.map((tour) => t(`Tour ${tour}`, "entete"))]);
  R.push([t("COMPTE DE RÉSULTAT PRÉVISIONNEL", "section")]);
  poserR("ca", "Chiffre d'affaires", tours.map((_, i) => f(logi("ca", i), "euro")));
  poserR("cv", "Coût variable des ventes", tours.map((_, i) => f(logi("cv", i), "euro")));
  poserR("mcv", "Marge sur coût variable", tours.map((_, i) => f(`${colonne(i)}${ligneR.ca}-${colonne(i)}${ligneR.cv}`, "euro")));
  poserR("marketing", "Budget marketing (à saisir)", tours.map(() => f(param.marketingRef!, "euro", "saisie")));
  poserR("qualite", "Budget qualité (à saisir)", tours.map(() => f(param.qualiteRef!, "euro", "saisie")));
  poserR("maintenance", "Budget maintenance (à saisir)", tours.map(() => f(param.maintenanceRef!, "euro", "saisie")));
  poserR("fixes", "Charges de structure", tours.map(() => f(param.fixes!, "euro")));
  poserR("amortissements", "Amortissements", tours.map(() => f(param.amortissements!, "euro")));
  poserR(
    "re",
    "Résultat d'exploitation",
    tours.map((_, i) =>
      f(
        `${colonne(i)}${ligneR.mcv}-${colonne(i)}${ligneR.marketing}-${colonne(i)}${ligneR.qualite}-${colonne(i)}${ligneR.maintenance}-${colonne(i)}${ligneR.fixes}-${colonne(i)}${ligneR.amortissements}`,
        "euro",
      ),
    ),
  );
  poserR("impot", "Impôt sur les bénéfices", tours.map((_, i) => f(`MAX(0,${colonne(i)}${ligneR.re})*${param.is}`, "euro")));
  poserR("rn", "Résultat net prévu", tours.map((_, i) => f(`${colonne(i)}${ligneR.re}-${colonne(i)}${ligneR.impot}`, "euro")));
  poserR(
    "cumul",
    "Résultat net cumulé",
    tours.map((_, i) => (i === 0 ? f(`${colonne(0)}${ligneR.rn}`, "euro") : f(`${colonne(i - 1)}${ligneR.rn! + 1}+${colonne(i)}${ligneR.rn}`, "euro"))),
  );
  R.push([]);
  R.push([t("BUDGET DE TRÉSORERIE PRÉVISIONNEL", "section")]);
  // Les six lignes du budget se suivent : début, encaissements, règlement des
  // achats, charges, emprunt, fin. Le début d'un tour est la fin du précédent.
  const rangDebut = R.length + 1;
  const rangFin = rangDebut + 5;
  poserR(
    "debut",
    "Trésorerie en début de tour",
    tours.map((_, i) => (i === 0 ? f(param.caisse!, "euro") : f(`${colonne(i - 1)}${rangFin}`, "euro"))),
  );
  poserR(
    "encaissements",
    "Encaissements clients",
    tours.map((_, i) =>
      i === 0
        ? f(`${colonne(0)}${ligneR.ca}*(1-${param.partCredit})+${param.creances}`, "euro")
        : f(`${colonne(i)}${ligneR.ca}*(1-${param.partCredit})+${colonne(i - 1)}${ligneR.ca}*${param.partCredit}`, "euro"),
    ),
  );
  poserR(
    "decAchats",
    `Règlement des ${v.materialLabel.toLowerCase()}`,
    tours.map((_, i) =>
      i === 0
        ? f(`${logi("achats", 0)}*(1-${param.partDifferee})+${param.dettes}`, "euro")
        : f(`${logi("achats", i)}*(1-${param.partDifferee})+${logi("achats", i - 1)}*${param.partDifferee}`, "euro"),
    ),
  );
  poserR(
    "decCharges",
    "Charges décaissées (structure, marketing, qualité, maintenance, impôt)",
    tours.map((_, i) =>
      f(
        `${colonne(i)}${ligneR.fixes}+${colonne(i)}${ligneR.marketing}+${colonne(i)}${ligneR.qualite}+${colonne(i)}${ligneR.maintenance}+${colonne(i)}${ligneR.impot}`,
        "euro",
      ),
    ),
  );
  poserR("emprunt", "Échéance d'emprunt", tours.map(() => f(param.echeance!, "euro")));
  poserR(
    "fin",
    "Trésorerie en fin de tour",
    tours.map((_, i) =>
      f(
        `${colonne(i)}${ligneR.debut}+${colonne(i)}${ligneR.encaissements}-${colonne(i)}${ligneR.decAchats}-${colonne(i)}${ligneR.decCharges}-${colonne(i)}${ligneR.emprunt}`,
        "euro",
      ),
    ),
  );
  poserR(
    "alerte",
    "Au-delà du découvert autorisé",
    tours.map((_, i) => f(`MAX(0,-${colonne(i)}${ligneR.fin}-${param.decouvert})`, "euro")),
  );

  const feuilles: FeuilleSpec[] = [
    { nom: NOM_PARAMETRES, largeurs: [52, 14, 16, 16, 14, 14, 18, ...tours.map(() => 10)], lignes: P },
    { nom: NOM_LOGISTIQUE, largeurs: [58, ...tours.map(() => 14)], lignes: L },
    { nom: NOM_RESULTAT, largeurs: [58, ...tours.map(() => 14)], lignes: R },
  ];

  // ------------------------------------------------------------------ Historique
  if (hist && hist.tours.length > 0) {
    const H: CelluleSpec[][] = [];
    const joues = hist.tours.map((x) => x.tour);
    H.push([t(`${NOM_HISTORIQUE} · ${hist.equipe}`, "titre")]);
    H.push([t("Ce que les tours joués ont donné, tel que le jeu l'a calculé.", "note")]);
    H.push([]);
    H.push([t("", "entete"), ...joues.map((tour) => t(`Tour ${tour}`, "entete"))]);
    for (const p of gamme) {
      H.push([t(p.name.toUpperCase(), "section")]);
      const serie = (cle: keyof HistoriqueEquipe["tours"][number]["produits"][number], format: Format) =>
        hist.tours.map((x) => {
          const prod = x.produits.find((y) => y.code === p.code);
          return prod ? n(prod[cle] as number, format) : vide();
        });
      H.push([t(v.priceLabel), ...serie("prix", "euro")]);
      H.push([t(v.productionPlanLabel), ...serie("misEnRayon", "unites")]);
      H.push([t("Vendu"), ...serie("vendu", "unites")]);
      H.push([t("Demande non servie"), ...serie("manque", "unites")]);
      H.push([t(`${v.leftoverLabel} en fin de tour`), ...serie("stockFin", "unites")]);
      H.push([t("Chiffre d'affaires"), ...serie("chiffreAffaires", "euro")]);
      H.push([]);
    }
    H.push([t("L'ENTREPRISE", "section")]);
    H.push([t("Chiffre d'affaires"), ...hist.tours.map((x) => n(x.chiffreAffaires, "euro"))]);
    H.push([t("Résultat net"), ...hist.tours.map((x) => n(x.resultatNet, "euro"))]);
    H.push([t("Trésorerie nette"), ...hist.tours.map((x) => n(x.tresorerieNette, "euro"))]);
    feuilles.push({ nom: NOM_HISTORIQUE, largeurs: [40, ...joues.map(() => 14)], lignes: H });
  }

  return { fichier: `cockpit-${sansAccents(definition.playerTeamName)}${hist ? `-${sansAccents(hist.equipe)}` : ""}`, feuilles };
}

/** Un nom de fichier en ASCII : un accent dans l'en-tête fait perdre le nom entier. */
export function sansAccents(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Relit une spécification comme un tableur le ferait : pour chaque formule,
 * les intitulés (colonne A) des lignes qu'elle référence, feuille par feuille.
 * C'est l'outil du test de non-mensonge ; il vit ici pour que le test ne
 * réinvente pas la grammaire des références.
 */
export function referencesResolues(
  classeur: ClasseurSpec,
): { feuille: string; ligne: number; intitule: string; formule: string; cibles: string[] }[] {
  const parNom = new Map(classeur.feuilles.map((fe) => [fe.nom, fe]));
  const out: { feuille: string; ligne: number; intitule: string; formule: string; cibles: string[] }[] = [];
  for (const fe of classeur.feuilles) {
    fe.lignes.forEach((ligne, i) => {
      for (const cellule of ligne) {
        if (!cellule.f) continue;
        const cibles: string[] = [];
        for (const m of cellule.f.matchAll(/(?:'([^']+)'!)?\$?([A-Z]+)\$?(\d+)/g)) {
          const feuilleCible = m[1] ? parNom.get(m[1]) : fe;
          const rang = Number(m[3]);
          const intitule = feuilleCible?.lignes[rang - 1]?.[0]?.v;
          cibles.push(typeof intitule === "string" ? intitule : `?${m[0]}`);
        }
        out.push({
          feuille: fe.nom,
          ligne: i + 1,
          intitule: String(ligne[0]?.v ?? ""),
          formule: cellule.f,
          cibles,
        });
      }
    });
  }
  return out;
}
