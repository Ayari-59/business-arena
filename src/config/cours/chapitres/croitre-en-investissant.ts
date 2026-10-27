import type { CompanyRoundResult, EngineScenarioConfig, EquipmentTypeDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** « gagne 3 622 € » ou « perd 2 971 € » : un gain négatif se dit comme une perte. */
const gagne = (x: number) => (x >= 0 ? `gagne ${eur(x)}` : `perd ${eur(-x)}`);
/**
 * CHAPITRE : CROÎTRE EN INVESTISSANT, CAPACITÉ, FINANCEMENT, RENTABILITÉ (stratégie et
 * management, palier 3).
 *
 * L'entreprise achète au premier trimestre une machine de plus, la même que le premier
 * équipement de son parc (celui que le cas achète à la création, `cas.immobilisation`), et la
 * finance par un emprunt du même montant. L'arène rejoue l'année du cours avec cette seule
 * décision changée : la capacité gagnée, ce qu'elle rapporterait si la demande suivait, ce que la
 * machine coûte (amortissement et intérêts), puis ce que l'année a vraiment donné, le délai de
 * récupération simple et la rentabilité. Une seconde année rejouée paie la même machine par la
 * trésorerie, sans emprunt : le financement change le résultat net, pas ce que la croissance
 * rapporte. Le chapitre finit sur la question de fond : croître payait-il ?
 *
 * Ce n'est ni « Immobilisations et amortissements » (le plan d'amortissement et ses écritures), ni
 * « L'emprunt et ses intérêts » (le tableau d'amortissement), ni « Financer l'entreprise »
 * (autofinancement ou emprunt, sur le bilan) : ces calculs sont repris en une ligne chacun, au
 * service d'une décision de croissance.
 *
 * TOUT VIENT DU MOTEUR. La machine entre en service au trimestre qui suit l'achat et s'amortit
 * linéairement dès lors, sur la durée du catalogue d'équipements (`depreciationRounds`) ;
 * l'emprunt se rembourse par parts égales sur la durée du scénario (`loanDurationRounds`), et ses
 * intérêts courent sur le capital dû à l'ouverture de chaque trimestre, à partir du trimestre
 * suivant (src/engine/finance/statements.ts). La gestion équilibrée de l'arène décide de tout le
 * reste, comme dans l'année du cours : la production, le prix, l'entretien, qu'elle proportionne
 * au parc.
 *
 * LE SCÉNARIO REJOUÉ. L'année du cours est jouée dans le scénario du niveau 1 ; l'investissement
 * ne s'ouvre qu'au niveau 4 (config/difficulty.ts), mais ce verrou est celui de la feuille de
 * décision et des concurrents pilotés : le moteur honore un achat de machine à tout niveau, dans
 * les neuf entreprises du cours (toutes ont un parc typé). Le chapitre rejoue donc le scénario de
 * l'année du cours, avec un seul ajout, `parcSansDoublon` (engine/types.ts) : sans lui, le chemin
 * d'avant le correctif recompte la machine achetée à chaque trimestre suivant. Une partie créée
 * aujourd'hui porte ce drapeau ; le cours le pose pour jouer l'achat comme elle.
 *
 * Là où la capacité n'est pas ce qui limite les ventes, la machine ne vend rien de plus, et le
 * chapitre le dit : croître ne paie pas toujours. Sur l'année du cours, c'est le cas de huit
 * entreprises sur neuf : chez ATLAS CONSEIL, l'équipe plafonne bien avant l'outil ; ailleurs, la
 * gestion équilibrée produit d'après ses ventes du tour d'avant, sous la capacité de son outil.
 * Seule VOLT FITNESS, qui produit à pleine capacité, vend davantage avec la machine. La branche
 * « la demande ne suit pas » reste écrite pour une année où la machine ferait vendre sans payer.
 */

/** Le trimestre de l'achat : le premier de l'année, pour que l'arène en montre toute la suite. */
export const TRIMESTRE_DE_L_ACHAT = 1;

/**
 * Le scénario rejoué, tel qu'une partie créée aujourd'hui le joue pour son parc : la machine
 * achetée compte une fois, et pas une fois de plus à chaque trimestre.
 */
export const avecLeParcSansDoublon = (s: EngineScenarioConfig): EngineScenarioConfig => ({ ...s, parcSansDoublon: true });

export type Financement = "emprunt" | "tresorerie";

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const dixieme = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const TRIMESTRES_PAR_AN = 4;

/** La machine du chapitre : le type du premier équipement du parc de départ, celui du cas. */
export function machineDuChapitre(code: string): EquipmentTypeDef {
  const equipement = scenarioByCode(code).scenario.equipment!;
  return equipement.types.find((t) => t.code === equipement.initialFleet[0]!.typeCode)!;
}

/** L'année du cours sans rien acheter, dans le même scénario que l'année avec la machine. */
export const anneeSansInvestir = (code: string) =>
  rejouerAvec(code, "croitre-en-investissant:reference", () => undefined, avecLeParcSansDoublon);

/** L'année du cours, une machine achetée au trimestre 1, payée par un emprunt du même montant ou par la trésorerie. */
export function anneeAvecLaMachine(code: string, machine: EquipmentTypeDef, financement: Financement) {
  return rejouerAvec(
    code,
    `croitre-en-investissant:${machine.code}:${financement}`,
    (t, d) =>
      t === TRIMESTRE_DE_L_ACHAT
        ? {
            ...d,
            investment: { ...d.investment, equipmentBuy: [...(d.investment?.equipmentBuy ?? []), { typeCode: machine.code, quantity: 1 }] },
            finance: financement === "emprunt" ? { ...d.finance, newLoan: (d.finance?.newLoan ?? 0) + machine.costPerUnit } : d.finance,
          }
        : undefined,
    avecLeParcSansDoublon,
  );
}

const somme = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(surLAnnee(annee, f));
const tresorerieNette = (r: CompanyRoundResult) => r.balanceSheet.cash - r.balanceSheet.overdraft;

export type Verdict = "croitre-paie" | "la-demande-ne-suit-pas" | "la-capacite-ne-manquait-pas";

/** Ce que la machine coûte, ce qu'elle peut rapporter, et ce que l'arène en a fait, pour une machine donnée. */
export function investissement(c: Cas, machine: EquipmentTypeDef = machineDuChapitre(c.code)) {
  const s = scenarioByCode(c.code).scenario;
  const sans = anneeSansInvestir(c.code);
  const avec = anneeAvecLaMachine(c.code, machine, "emprunt");
  const comptant = anneeAvecLaMachine(c.code, machine, "tresorerie");
  const k = TRIMESTRE_DE_L_ACHAT; // l'indice, dans l'année, du trimestre où la machine entre en service
  const trimestresEnService = sans.length - TRIMESTRE_DE_L_ACHAT;
  const cout = machine.costPerUnit;
  const capaciteGagnee = machine.capacityPerUnit * trimestresEnService;

  // Ce que l'année sans la machine a vendu, et ce que chaque unité vendue lui a laissé.
  const venduesSans = somme(sans, soldUnits);
  const margeSans = somme(sans, (r) => r.incomeStatement.grossMargin);
  const margeUnitaire = auCentime(margeSans / venduesSans);
  const margeSiLaDemandeSuit = Math.round(capaciteGagnee * margeUnitaire);

  // Ce que la machine coûte : l'amortissement de ses trimestres en service, les intérêts de l'emprunt.
  const amortissementParTrimestre = auCentime(cout / machine.depreciationRounds);
  const amortissement = auCentime((cout * trimestresEnService) / machine.depreciationRounds);
  const taux = s.finance.loanAnnualRate;
  const dureeDuPret = s.finance.loanDurationRounds!;
  const remboursement = auCentime(cout / dureeDuPret);
  const lignes = Array.from({ length: trimestresEnService }, (_, i) => {
    const du = auCentime(cout - (i * cout) / dureeDuPret);
    return { du, interets: auCentime((du * taux) / TRIMESTRES_PAR_AN) };
  });
  const interets = auCentime(lignes.reduce((t, l) => t + l.interets, 0));

  // L'année rejouée, avec et sans la machine.
  const lire = (annee: readonly CompanyRoundResult[]) => ({
    capaciteOutil: Math.round(annee[k]!.production.machineCapacity),
    capaciteEquipe: Math.round(annee[k]!.production.laborCapacity),
    production: somme(annee, (r) => r.production.produced),
    ventes: somme(annee, soldUnits),
    marge: somme(annee, (r) => r.incomeStatement.grossMargin),
    entretien: somme(annee, (r) => r.incomeStatement.maintenanceCost),
    amortissements: somme(annee, (r) => r.incomeStatement.depreciation),
    resultatDExploitation: somme(annee, (r) => r.incomeStatement.operatingIncome),
    chargesFinancieres: somme(annee, (r) => r.incomeStatement.interest),
    resultatNet: somme(annee, (r) => r.incomeStatement.netIncome),
    tresoreriePlusBasse: Math.round(Math.min(...annee.map(tresorerieNette))),
  });
  const a = lire(sans);
  const b = lire(avec);
  const t = lire(comptant);
  const ventesGagnees = b.ventes - a.ventes;
  const productionGagnee = b.production - a.production;
  const margeGagnee = b.marge - a.marge;
  const entretienEnPlus = b.entretien - a.entretien;
  const amortissementsEnPlus = b.amortissements - a.amortissements;
  const exploitationGagnee = b.resultatDExploitation - a.resultatDExploitation;
  const chargesFinancieresEnPlus = b.chargesFinancieres - a.chargesFinancieres;
  const resultatNetGagne = b.resultatNet - a.resultatNet;
  const impotEnPlus = somme(avec, (r) => r.incomeStatement.tax) - somme(sans, (r) => r.incomeStatement.tax);

  // Le délai de récupération simple et la rentabilité, sur la capacité d'autofinancement gagnée.
  const caf = resultatNetGagne + Math.round(amortissement);
  const delai = caf > 0 ? auDixieme((cout * trimestresEnService) / caf) : null;
  const rentabilite = auDixieme((resultatNetGagne / cout) * 100);

  // La même machine payée par la trésorerie.
  const exploitationGagneeComptant = t.resultatDExploitation - a.resultatDExploitation;
  const chargesFinancieresEnPlusComptant = t.chargesFinancieres - a.chargesFinancieres;
  const resultatNetGagneComptant = t.resultatNet - a.resultatNet;
  const ecartDeFinancement = resultatNetGagneComptant - resultatNetGagne;

  const verdict: Verdict =
    Math.abs(surLAnnee(avec, soldUnits) - surLAnnee(sans, soldUnits)) < 0.5
      ? "la-capacite-ne-manquait-pas"
      : resultatNetGagne > 0
        ? "croitre-paie"
        : "la-demande-ne-suit-pas";
  return {
    machine: machine.name,
    code: machine.code,
    cout,
    capacite: machine.capacityPerUnit,
    duree: machine.depreciationRounds,
    trimestresEnService,
    capaciteGagnee,
    venduesSans,
    margeSans,
    margeUnitaire,
    margeSiLaDemandeSuit,
    amortissementParTrimestre,
    amortissement,
    taux: Math.round(taux * 10000) / 100,
    dureeDuPret,
    remboursement,
    lignes,
    interets,
    sans: a,
    avec: b,
    comptant: t,
    ventesGagnees,
    productionGagnee,
    margeGagnee,
    entretienEnPlus,
    amortissementsEnPlus,
    exploitationGagnee,
    chargesFinancieresEnPlus,
    impotEnPlus,
    resultatNetGagne,
    caf,
    delai,
    rentabilite,
    exploitationGagneeComptant,
    chargesFinancieresEnPlusComptant,
    resultatNetGagneComptant,
    ecartDeFinancement,
    plafondDeDecouvert: s.finance.overdraftLimit,
    // L'équipe plafonne avant l'outil : la machine ne peut rien faire produire de plus.
    equipeLimite: a.capaciteEquipe < a.capaciteOutil,
    verdict,
  };
}

const T = TRIMESTRE_DE_L_ACHAT;

export const CROITRE_EN_INVESTISSANT: Chapitre = {
  code: "croitre-en-investissant",
  parcours: "strategie",
  palier: 3,
  blocs: ["DCG UE6 · Finance d'entreprise", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir la stratégie de création de valeur"],
  titre: "Croître en investissant : capacité, financement, rentabilité",
  accroche:
    "Une machine de plus, achetée à crédit au premier trimestre : ce qu'elle peut rapporter si la demande suit, ce qu'elle coûte chaque année, et ce que l'arène en fait quand elle rejoue l'année. Croître ne paie pas toujours.",
  objectifs: [
    "Chiffrer la capacité gagnée par un investissement et la marge qu'elle rapporterait si la demande suivait",
    "Calculer ce que l'investissement coûte sur l'année : amortissement et intérêts",
    "Mesurer dans l'année rejouée ce que la croissance a vraiment rapporté",
    "Calculer un délai de récupération simple et une rentabilité",
    "Dire quand croître ne paie pas : la demande ne suit pas, ou la capacité n'était pas ce qui manquait",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une machine de plus",
      notions: ["capacity", "depreciation"],
      texte: (c) => {
        const r = investissement(c);
        return [
          `La direction ${dE(c.entreprise)} veut croître. Elle envisage d'acheter au trimestre ${T} une machine de plus, « ${r.machine} », la même que le premier équipement de son parc, et de la payer par un emprunt du même montant.`,
          `Dans l'arène, une machine achetée entre en service au trimestre suivant : elle ajoute sa capacité aux trimestres ${T + 1} à ${T + r.trimestresEnService}, et s'amortit dès lors. L'emprunt se rembourse par parts égales chaque trimestre, et porte intérêt sur ce qui reste dû.`,
          "Investir pour croître, c'est parier que la capacité manque, et que la demande suivra. Ce chapitre chiffre le pari, puis l'arène rejoue l'année avec la machine : mêmes concurrents, même marché, même gestion pour tout le reste.",
        ];
      },
      tableau: (c) => {
        const r = investissement(c);
        return {
          titre: `La machine et l'emprunt ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix de la machine", valeurs: [eur(r.cout)] },
            { libelle: `Capacité ajoutée par trimestre (${c.unites})`, valeurs: [qte(r.capacite)] },
            { libelle: "Durée d'amortissement (trimestres)", valeurs: [qte(r.duree)] },
            { libelle: `Capacité de l'outil aujourd'hui, par trimestre (${c.unites})`, valeurs: [qte(r.sans.capaciteOutil)] },
            { libelle: `Capacité de l'équipe, par trimestre (${c.unites})`, valeurs: [qte(r.sans.capaciteEquipe)] },
            { libelle: "Taux annuel de l'emprunt", valeurs: [pct(r.taux)] },
            { libelle: "Durée de l'emprunt (trimestres)", valeurs: [qte(r.dureeDuPret)] },
          ],
        };
      },
      repere: () => "On produit au plus ce que permettent à la fois l'outil et l'équipe : une machine de plus ne sert que si l'outil est ce qui manque.",
    },
    {
      id: "si-la-demande-suit",
      type: "montants",
      titre: "Ce que la machine peut rapporter",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = investissement(c);
        return {
          titre: "L'année sans la machine",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.venduesSans)] },
            { libelle: "Marge sur coût variable de l'année", valeurs: [eur(r.margeSans)] },
          ],
        };
      },
      question: (c) =>
        `Calculez la marge sur coût variable que chaque unité vendue a laissée sur l'année, puis la capacité que la machine ajoute sur l'année (en ${c.unites}), et la marge qu'elle rapporterait si tout ce qu'elle permet de produire se vendait à ce niveau de marge.`,
      champs: (c) => {
        const r = investissement(c);
        return [
          { libelle: "Marge sur coût variable par unité vendue", attendu: r.margeUnitaire, calcul: `${eur(r.margeSans)} ÷ ${qte(r.venduesSans)} = ${eur(r.margeUnitaire)}`, tolerance: 0.01 },
          {
            libelle: `Capacité gagnée sur l'année (${c.unites})`,
            attendu: r.capaciteGagnee,
            calcul: `${qte(r.capacite)} × ${r.trimestresEnService} trimestres en service = ${qte(r.capaciteGagnee)}`,
            tolerance: 0,
          },
          {
            libelle: "Marge gagnée si la demande suit",
            attendu: r.margeSiLaDemandeSuit,
            calcul: `${qte(r.capaciteGagnee)} × ${eur(r.margeUnitaire)} = ${eur(r.margeSiLaDemandeSuit)}`,
            // L'élève qui garde la marge par unité sans l'arrondir au centime tombe à un demi-centime par unité près.
            tolerance: Math.max(1, Math.ceil(r.capaciteGagnee * 0.005)),
          },
        ];
      },
      explication: (c) => {
        const r = investissement(c);
        return [
          `${eur(r.margeSiLaDemandeSuit)} : c'est le plafond de ce que la machine peut rapporter cette année. Il suppose deux choses que rien ne garantit : que des clients achètent ces ${qte(r.capaciteGagnee)} ${c.unites} de plus, et que l'outil soit bien ce qui manquait pour les servir.`,
        ];
      },
    },
    {
      id: "charges",
      type: "montants",
      titre: "Ce que la machine coûte sur l'année",
      notions: ["depreciation", "loan_schedule"],
      question: (c) => {
        const r = investissement(c);
        return `La machine s'amortit sur ${r.duree} trimestres, à partir de son entrée en service. L'emprunt de ${eur(r.cout)} se rembourse de ${eur(r.remboursement)} par trimestre, et ses intérêts courent à ${pct(r.taux)} par an sur ce qui reste dû, à partir du trimestre ${T + 1}. Calculez l'amortissement de la machine et les intérêts de l'emprunt sur les ${r.trimestresEnService} trimestres où elle sert cette année.`;
      },
      champs: (c) => {
        const r = investissement(c);
        return [
          {
            libelle: "Amortissement de la machine sur l'année",
            attendu: r.amortissement,
            calcul: `${eur(r.cout)} × ${r.trimestresEnService} ÷ ${r.duree} = ${eur(r.amortissement)}, soit ${eur(r.amortissementParTrimestre)} par trimestre`,
            tolerance: 1,
          },
          {
            libelle: "Intérêts de l'emprunt sur l'année",
            attendu: r.interets,
            calcul: `${r.lignes.map((l) => `${eur(l.du)} × ${pct(r.taux)} ÷ 4`).join(" + ")} = ${r.lignes.map((l) => eur(l.interets)).join(" + ")} = ${eur(r.interets)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = investissement(c);
        const total = auCentime(r.amortissement + r.interets);
        return [
          `La machine pèse ${eur(total)} sur le résultat de l'année, avant d'avoir vendu quoi que ce soit : ${eur(r.amortissement)} d'amortissement, ${eur(r.interets)} d'intérêts. S'y ajoute l'entretien du parc agrandi. Pour que croître paie, la marge gagnée doit couvrir tout cela.`,
          `Le remboursement du capital, ${eur(r.remboursement)} par trimestre, n'est pas une charge : il sort de la trésorerie, pas du résultat.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année avec la machine",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = investissement(c);
        return {
          titre: "L'année jouée, sans et avec la machine",
          colonnes: ["Sans la machine", "Avec la machine"],
          lignes: [
            { libelle: `Capacité de l'outil au trimestre ${T + 1} (${c.unites})`, valeurs: [qte(r.sans.capaciteOutil), qte(r.avec.capaciteOutil)] },
            { libelle: `Capacité de l'équipe au trimestre ${T + 1} (${c.unites})`, valeurs: [qte(r.sans.capaciteEquipe), qte(r.avec.capaciteEquipe)] },
            { libelle: `Production de l'année (${c.unites})`, valeurs: [qte(r.sans.production), qte(r.avec.production)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.sans.ventes), qte(r.avec.ventes)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.sans.marge), eur(r.avec.marge)] },
            { libelle: "Entretien", valeurs: [eur(r.sans.entretien), eur(r.avec.entretien)] },
            { libelle: "Dotations aux amortissements", valeurs: [eur(r.sans.amortissements), eur(r.avec.amortissements)] },
            { libelle: "Résultat d'exploitation", valeurs: [eur(r.sans.resultatDExploitation), eur(r.avec.resultatDExploitation)] },
            { libelle: "Charges financières", valeurs: [eur(r.sans.chargesFinancieres), eur(r.avec.chargesFinancieres)] },
            { libelle: "Résultat net", valeurs: [eur(r.sans.resultatNet), eur(r.avec.resultatNet)] },
          ],
        };
      },
      question: (c) => `D'après le tableau, calculez les ventes gagnées sur l'année (en ${c.unites}), la marge sur coût variable gagnée, et le résultat net gagné.`,
      champs: (c) => {
        const r = investissement(c);
        return [
          { libelle: `Ventes gagnées (${c.unites})`, attendu: r.ventesGagnees, calcul: `${qte(r.avec.ventes)} − ${qte(r.sans.ventes)} = ${qte(r.ventesGagnees)}`, tolerance: 1 },
          { libelle: "Marge gagnée sur l'année", attendu: r.margeGagnee, calcul: `${eur(r.avec.marge)} − ${retranche(r.sans.marge)} = ${eur(r.margeGagnee)}`, tolerance: 1 },
          {
            libelle: "Résultat net gagné sur l'année",
            attendu: r.resultatNetGagne,
            calcul: `${eur(r.avec.resultatNet)} − ${retranche(r.sans.resultatNet)} = ${eur(r.resultatNetGagne)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = investissement(c);
        const impot = r.impotEnPlus === 0 ? "" : r.impotEnPlus > 0 ? ` et ${eur(r.impotEnPlus)} d'impôt en plus` : ` et ${eur(-r.impotEnPlus)} d'impôt en moins`;
        const ecartDInterets = Math.abs(r.chargesFinancieresEnPlus - r.interets) > 1;
        return [
          r.verdict === "la-capacite-ne-manquait-pas"
            ? `Les ventes n'ont pas bougé : la machine a ajouté de la capacité à l'outil, mais ${r.equipeLimite ? `l'équipe ne peut servir que ${qte(r.sans.capaciteEquipe)} ${c.unites} par trimestre, bien moins que l'outil` : "ce n'est pas l'outil qui limitait les ventes"}. Il n'y avait rien à gagner.`
            : r.margeGagnee < 0 && r.productionGagnee > r.ventesGagnees
              ? `L'arène a produit ${qte(r.productionGagnee)} ${c.unites} de plus, mais n'en a vendu que ${qte(r.ventesGagnees)} de plus : ce qui a été produit sans trouver preneur a coûté sans rien rapporter, et la marge baisse de ${eur(-r.margeGagnee)}.`
              : `L'arène a vendu ${qte(r.ventesGagnees)} ${c.unites} de plus, loin des ${qte(r.capaciteGagnee)} que la machine permettait : la marge gagnée, ${eur(r.margeGagnee)}, reste sous les ${eur(r.margeSiLaDemandeSuit)} du calcul où toute la demande suivait.`,
          `Le résultat d'exploitation ${gagne(r.exploitationGagnee)} : la marge gagnée, moins ${eur(r.entretienEnPlus)} d'entretien et ${eur(r.amortissementsEnPlus)} d'amortissement en plus. Après ${eur(r.chargesFinancieresEnPlus)} de charges financières en plus${impot}, le résultat net ${gagne(r.resultatNetGagne)}.`,
          ...(ecartDInterets
            ? [
                `Les charges financières en plus (${eur(r.chargesFinancieresEnPlus)}) ne sont pas exactement les intérêts de l'emprunt (${eur(r.interets)}) : la trésorerie n'a pas suivi le même chemin, et le découvert de l'entreprise a changé avec elle.`,
              ]
            : []),
        ];
      },
    },
    {
      id: "recuperation",
      type: "montants",
      titre: "Délai de récupération et rentabilité",
      notions: ["irr_payback", "profitability_vs_return"],
      question: (c) => {
        const r = investissement(c);
        return r.caf > 0
          ? `La machine fait gagner chaque année le résultat net en plus, et l'amortissement, qui ne sort pas d'argent : c'est la capacité d'autofinancement gagnée. Calculez-la, puis le délai de récupération simple (le prix de la machine divisé par ce qu'elle dégage par trimestre en service, en trimestres), et la rentabilité de la machine sur l'année (le résultat net gagné rapporté à son prix, en %).`
          : `La machine fait gagner chaque année le résultat net en plus, et l'amortissement, qui ne sort pas d'argent : c'est la capacité d'autofinancement gagnée. Calculez-la, puis la rentabilité de la machine sur l'année (le résultat net gagné rapporté à son prix, en %).`;
      },
      champs: (c) => {
        const r = investissement(c);
        return [
          {
            libelle: "Capacité d'autofinancement gagnée sur l'année",
            attendu: r.caf,
            calcul: `${eur(r.resultatNetGagne)} + ${eur(Math.round(r.amortissement))} = ${eur(r.caf)}`,
            tolerance: 1,
          },
          ...(r.delai !== null
            ? [
                {
                  libelle: "Délai de récupération (trimestres)",
                  attendu: r.delai,
                  calcul: `${eur(r.cout)} ÷ (${eur(r.caf)} ÷ ${r.trimestresEnService}) = ${dixieme(r.delai)} trimestres`,
                  tolerance: 0.1,
                },
              ]
            : []),
          {
            libelle: "Rentabilité de la machine sur l'année (%)",
            attendu: r.rentabilite,
            calcul: `${eur(r.resultatNetGagne)} ÷ ${eur(r.cout)} × 100 = ${pct(r.rentabilite)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = investissement(c);
        return [
          r.delai === null
            ? `La capacité d'autofinancement gagnée n'est pas positive : à ce rythme, la machine ne se rembourse jamais.`
            : r.delai > r.duree
              ? `À ce rythme, la machine se rembourserait en ${dixieme(r.delai)} trimestres, plus que les ${r.duree} trimestres de sa durée d'amortissement : elle serait usée avant d'avoir rendu ce qu'elle a coûté.`
              : `À ce rythme, la machine se rembourse en ${dixieme(r.delai)} trimestres, avant la fin des ${r.duree} trimestres de sa durée d'amortissement.`,
          r.rentabilite < 0
            ? `Sur la première année, où elle ne sert que ${r.trimestresEnService} trimestres, elle fait perdre ${pct(-r.rentabilite)} de son prix.`
            : r.rentabilite > r.taux
              ? `Elle rapporte ${pct(r.rentabilite)} de son prix dès la première année, où elle ne sert que ${r.trimestresEnService} trimestres : plus que les ${pct(r.taux)} par an que coûte l'emprunt.`
              : `Elle rapporte ${pct(r.rentabilite)} de son prix sur la première année, où elle ne sert que ${r.trimestresEnService} trimestres : pas plus que les ${pct(r.taux)} par an que coûte l'emprunt.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "Et payée par la trésorerie ?",
      notions: ["loan_schedule", "net_treasury"],
      tableau: (c) => {
        const r = investissement(c);
        return {
          titre: "La même machine, à l'emprunt ou par la trésorerie",
          colonnes: ["À l'emprunt", "Par la trésorerie"],
          lignes: [
            { libelle: "Résultat d'exploitation gagné", valeurs: [eur(r.exploitationGagnee), eur(r.exploitationGagneeComptant)] },
            { libelle: "Charges financières en plus", valeurs: [eur(r.chargesFinancieresEnPlus), eur(r.chargesFinancieresEnPlusComptant)] },
            { libelle: "Résultat net gagné", valeurs: [eur(r.resultatNetGagne), eur(r.resultatNetGagneComptant)] },
            { libelle: "Trésorerie nette au plus bas de l'année", valeurs: [eur(r.avec.tresoreriePlusBasse), eur(r.comptant.tresoreriePlusBasse)] },
          ],
        };
      },
      question: () =>
        "L'arène a rejoué l'année une troisième fois : la même machine, payée par la trésorerie, sans emprunt. Calculez l'écart de résultat net gagné entre les deux façons de payer (par la trésorerie, moins à l'emprunt).",
      champs: (c) => {
        const r = investissement(c);
        return [
          {
            libelle: "Écart de résultat net, trésorerie moins emprunt",
            attendu: r.ecartDeFinancement,
            calcul: `${eur(r.resultatNetGagneComptant)} − ${retranche(r.resultatNetGagne)} = ${eur(r.ecartDeFinancement)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = investissement(c);
        const chargesComptant =
          r.chargesFinancieresEnPlusComptant === 0
            ? "ne coûte aucune charge financière en plus"
            : `coûte ${eur(r.chargesFinancieresEnPlusComptant)} de charges financières en plus`;
        return [
          `Le résultat d'exploitation gagné est le même des deux façons, ${eur(r.exploitationGagnee)} : la façon de payer ne change ni la capacité, ni les ventes, ni l'amortissement. Seules changent les charges financières.`,
          r.ecartDeFinancement > 0
            ? `Payée par la trésorerie, la machine ${chargesComptant}, contre ${eur(r.chargesFinancieresEnPlus)} à l'emprunt : l'année finit mieux de ${eur(r.ecartDeFinancement)}.`
            : `Payée par la trésorerie, la machine ${chargesComptant}, contre ${eur(r.chargesFinancieresEnPlus)} à l'emprunt : sans emprunt, l'argent manque en caisse, et ce manque coûte plus que les intérêts de l'emprunt. L'emprunt fait finir l'année mieux de ${eur(-r.ecartDeFinancement)}.`,
          r.comptant.tresoreriePlusBasse < r.avec.tresoreriePlusBasse
            ? `Sans emprunt, la trésorerie nette descend plus bas : ${eur(r.comptant.tresoreriePlusBasse)} au plus bas de l'année, contre ${eur(r.avec.tresoreriePlusBasse)}. C'est autant de réserve en moins pour un coup dur.`
            : `La trésorerie nette touche le même point bas dans les deux cas, ${eur(r.avec.tresoreriePlusBasse)}${r.avec.tresoreriePlusBasse === -r.plafondDeDecouvert ? " : le plafond du découvert" : ""}.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Croître payait-il ?",
      notions: ["capacity", "irr_payback"],
      question: (c) => {
        const r = investissement(c);
        return `Avec la machine, ${c.entreprise} vend ${qte(r.ventesGagnees)} ${c.unites} de plus sur l'année, et son résultat net ${gagne(r.resultatNetGagne)}. Que retenir ?`;
      },
      options: (c) => {
        const r = investissement(c);
        return [
          {
            texte: "Croître a payé : le résultat de l'année monte, charges de la machine comprises",
            juste: r.verdict === "croitre-paie",
            retour:
              r.verdict === "croitre-paie"
                ? `Oui : la marge gagnée, ${eur(r.margeGagnee)}, couvre l'amortissement, l'entretien et les intérêts, et le résultat net gagne ${eur(r.resultatNetGagne)} dès la première année. La capacité manquait, et la demande a suivi, au moins en partie.`
                : `Non : le résultat net ${r.resultatNetGagne < 0 ? `baisse de ${eur(-r.resultatNetGagne)}` : "ne monte pas"}, charges de la machine comprises.`,
          },
          {
            texte: "La demande n'a pas suivi : la capacité en plus ne s'est pas assez vendue",
            juste: r.verdict === "la-demande-ne-suit-pas",
            retour:
              r.verdict === "la-demande-ne-suit-pas"
                ? `Oui : ${c.entreprise} vend ${qte(r.ventesGagnees)} ${c.unites} de plus, mais la marge gagnée (${eur(r.margeGagnee)}) ne couvre pas ce que la machine coûte, et le résultat net baisse de ${eur(-r.resultatNetGagne)}. Croître suppose des clients pour la capacité qu'on achète.`
                : r.verdict === "croitre-paie"
                  ? `Non : les ventes en plus ont suffi à payer la machine, et le résultat net gagne ${eur(r.resultatNetGagne)}.`
                  : "Non : il n'y a eu aucune vente en plus, la demande n'a même pas eu l'occasion de suivre.",
          },
          {
            texte: "Ce n'est pas la capacité qui manquait : les ventes n'ont pas bougé",
            juste: r.verdict === "la-capacite-ne-manquait-pas",
            retour:
              r.verdict === "la-capacite-ne-manquait-pas"
                ? `Oui : ${r.equipeLimite ? `l'équipe plafonne à ${qte(r.sans.capaciteEquipe)} ${c.unites} par trimestre, sous la capacité de l'outil` : "l'outil n'était pas ce qui limitait les ventes"}, et la machine n'a rien fait vendre de plus. Elle coûte son amortissement, son entretien et ses intérêts : le résultat net baisse de ${eur(-r.resultatNetGagne)}. Avant d'acheter de la capacité, il faut savoir ce qui manque.`
                : `Non : la machine a fait vendre ${qte(r.ventesGagnees)} ${c.unites} de plus.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "irr_payback"],
      texte: (c) => {
        const r = investissement(c);
        return [
          `Chez ${c.entreprise}, la machine coûte ${eur(r.cout)}. Si toute la demande suivait, elle rapporterait ${eur(r.margeSiLaDemandeSuit)} de marge sur l'année ; l'arène en a tiré ${eur(r.margeGagnee)}, et le résultat net ${gagne(r.resultatNetGagne)}.`,
          "Investir pour croître se décide sur trois questions : la capacité est-elle ce qui manque ? La demande suivra-t-elle ? La marge gagnée couvrira-t-elle l'amortissement, l'entretien et les intérêts ? Le délai de récupération dit ensuite en combien de temps l'investissement se rembourse, et la façon de payer l'investissement change le résultat net, pas ce que la croissance rapporte.",
        ];
      },
      repere: () =>
        "Délai de récupération simple = prix de l'investissement ÷ ce qu'il dégage par période (résultat net gagné + amortissement).",
    },
  ],
};
