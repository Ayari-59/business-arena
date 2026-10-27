import type { CompanyRoundResult, EngineScenarioConfig, EquipmentTypeDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { TOURS_MAX_AU_TRIMESTRE, prolongerLaPartie } from "../../scenarios/rounds";
import type { Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";
import { TRIMESTRE_DE_L_ACHAT, avecLeParcSansDoublon, machineDuChapitre } from "./croitre-en-investissant";
import { TRIMESTRES_PAR_EXERCICE } from "./le-deficit-reporte";

/** Au centime, sans zéro négatif : −0,001 € s'écrit 0 €, pas « −0 € ». */
const centime = (x: number) => auCentime(x) || 0;
/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number, decimales = 2) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** Un coefficient d'actualisation, à quatre décimales, comme dans une table financière. */
const coef4 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/**
 * CHAPITRE : LA VALEUR ACTUELLE NETTE D'UN INVESTISSEMENT (DSCG, UE2 Finance, palier 4).
 *
 * L'entreprise achète au premier trimestre une machine de plus, la même que le premier équipement
 * de son parc (`machineDuChapitre`, celle de « Croître en investissant »), et la paie sur sa
 * trésorerie : la décision d'investir se juge sans son financement, dont le coût est porté par le
 * taux d'actualisation. L'arène rejoue la partie sur la durée du projet, douze trimestres
 * (`DUREE_DU_PROJET`, la plus longue partie qu'elle joue au trimestre), avec et sans la machine.
 * Le chapitre en tire les flux de trésorerie d'exploitation que la machine ajoute, trimestre après
 * trimestre (l'EBE gagné, moins l'impôt du résultat d'exploitation gagné), la valeur résiduelle de
 * la machine à la fin du projet, nette de l'impôt sur la moins-value, puis les actualise au taux
 * trimestriel équivalent au coût du capital annuel, et rend son verdict sur le signe de la VAN.
 *
 * Ce n'est pas « Croître en investissant » (stratégie, palier 3), qui juge la machine sur la
 * première année, sans actualiser, par son résultat net et un délai de récupération simple : ici,
 * l'horizon est celui du projet, les flux sont des flux de trésorerie après impôt, et le temps a
 * un prix. Le TRI et le choix entre deux projets viennent au chapitre suivant
 * (« Le taux de rentabilité interne et le choix entre deux projets »).
 *
 * TOUT VIENT DU MOTEUR. La machine achetée entre en service au trimestre suivant et s'amortit
 * linéairement dès lors (src/engine/simulation/index.ts) ; la revente d'une machine rend une part
 * fixe de sa valeur nette comptable (`resaleRatio` du catalogue), et la moins-value entre dans le
 * résultat d'exploitation (src/engine/finance/statements.ts) : elle fait donc baisser l'impôt.
 * L'impôt sur les flux est celui du moteur : un seul taux (`finance.taxRate`), sur le résultat de
 * l'exercice. Il vaut le taux appliqué au résultat d'exploitation gagné tant que chaque exercice
 * finit en bénéfice, avec et sans la machine, et que le financement ne change rien : la garde le
 * vérifie, exercice par exercice.
 *
 * LA DÉFAILLANCE SE TRANCHE AVANT D'ADDITIONNER. Une entreprise défaillante dans un rejeu compte
 * zéro les trimestres suivants : ses flux ne diraient plus rien de la machine. `sansDefaillance`
 * refuse un tel rejeu au lieu d'en additionner les trimestres.
 *
 * LES ENTREPRISES. Il faut une machine qui fait vendre, et trois exercices bénéficiaires avec
 * l'une ou l'autre des deux machines du chapitre et du suivant, sans quoi l'impôt sur les flux ne
 * serait pas celui que l'arène prélève ; il faut aussi que les flux de chacune aient un taux de
 * rentabilité interne, que le chapitre suivant cherche. L'entreprise de l'élève joue le bon
 * gestionnaire, qui produit pour la demande reçue : la machine fait vendre partout, sauf chez
 * ATLAS CONSEIL, où la capacité en plus ne fait rien vendre de plus. Chez NOVA, elle fait vendre,
 * mais moins cher : le bon gestionnaire ne relève son prix que quand la demande déborde nettement
 * de son atelier, et la machine agrandit l'atelier. Elle y retire de l'EBE sur le projet, et
 * aucun taux n'annule sa VAN. Chez MARTEL & FILS, les deux machines du chapitre suivant, achetées
 * ensemble, valent plus que la somme de leurs VAN seules : chacune y fait embaucher, et leurs
 * embauches additionnées coûtent plus que celles de l'ensemble ; le cas « Acheter les deux
 * machines », qui mesure ce que l'ensemble perd à se partager la demande, n'y aurait pas d'objet.
 * Restent MAILLE & CO, L'ESCALE, LA TABLE D'AUGUSTIN, PIXEL & CO, VOLT FITNESS et ROUTE & CIE.
 * Chez L'ESCALE, la machine fait vendre, mais pas assez : les deux VAN y sont négatives, et le
 * verdict y est de renoncer.
 */

/** Les entreprises où l'investissement a un objet, et où l'impôt sur les flux est celui que l'arène prélève. */
export const ENTREPRISES_DE_L_ACTUALISATION = ["boutique", "hotel", "bistrot", "ecommerce", "fitness", "transport"] as const;

/** La durée du projet : la plus longue partie que l'arène joue au trimestre, trois exercices. */
export const DUREE_DU_PROJET = TOURS_MAX_AU_TRIMESTRE;

export const TRIMESTRES_PAR_AN = TRIMESTRES_PAR_EXERCICE;

/**
 * LE COÛT DU CAPITAL, UNE HYPOTHÈSE DU COURS : l'arène n'en a pas. 8 % par an est un ordre de
 * grandeur du coût moyen pondéré du capital d'une PME non cotée, entre le taux de ses emprunts
 * (de 4,2 % à 6,5 % dans les scénarios de l'arène, avant impôt) et la rentabilité qu'exigent ses
 * associés. Les flux s'actualisent à ce taux, ramené au trimestre.
 */
export const COUT_DU_CAPITAL_ANNUEL = 0.08;

/** Le taux trimestriel équivalent à un taux annuel, arrondi au centième de point, comme le chapitre le fait garder. */
export const tauxTrimestrielEquivalent = (annuel: number) => Math.round((Math.pow(1 + annuel, 1 / TRIMESTRES_PAR_AN) - 1) * 10000) / 10000;

/** Le taux d'actualisation du chapitre : 1,94 % par trimestre. */
export const TAUX_TRIMESTRIEL = tauxTrimestrielEquivalent(COUT_DU_CAPITAL_ANNUEL);

/** Le taux annuel équivalent à un taux trimestriel. */
export const tauxAnnuelEquivalent = (trimestriel: number) => Math.pow(1 + trimestriel, TRIMESTRES_PAR_AN) - 1;

/** La partie rejouée sur la durée du projet, comme une partie de douze tours la joue, la machine achetée comptée une fois. */
export const surLaDureeDuProjet =
  (code: string) =>
  (s: EngineScenarioConfig): EngineScenarioConfig =>
    prolongerLaPartie({ ...avecLeParcSansDoublon(s), roundsCount: scenarioByCode(code).scenario.roundsCount }, DUREE_DU_PROJET);

export type Paiement = "tresorerie" | "emprunt";

/** Les trimestres du projet, sans rien acheter. */
export const projetSansInvestir = (code: string) =>
  rejouerAvec(code, "la-valeur-actuelle-nette:sans", () => undefined, surLaDureeDuProjet(code));

/** Les trimestres du projet, les machines achetées au trimestre 1, payées sur la trésorerie ou par un emprunt du même montant. */
export function projetAvec(code: string, machines: readonly EquipmentTypeDef[], paiement: Paiement = "tresorerie") {
  const prix = machines.reduce((t, m) => t + m.costPerUnit, 0);
  return rejouerAvec(
    code,
    `la-valeur-actuelle-nette:${machines.map((m) => m.code).join("+")}:${paiement}`,
    (t, d) =>
      t === TRIMESTRE_DE_L_ACHAT
        ? {
            ...d,
            investment: { ...d.investment, equipmentBuy: [...(d.investment?.equipmentBuy ?? []), ...machines.map((m) => ({ typeCode: m.code, quantity: 1 }))] },
            finance: paiement === "emprunt" ? { ...d.finance, newLoan: (d.finance?.newLoan ?? 0) + prix } : d.finance,
          }
        : undefined,
    surLaDureeDuProjet(code),
  );
}

/**
 * Un rejeu où l'entreprise tombe en défaillance ne se lit pas : à partir de là, l'arène compte
 * zéro chaque trimestre, et l'écart avec l'autre rejeu ne dirait plus rien de l'investissement.
 */
export function sansDefaillance(tours: readonly CompanyRoundResult[], quoi: string): readonly CompanyRoundResult[] {
  const k = tours.findIndex((r) => r.defaillant);
  if (k >= 0) throw new Error(`${quoi} : l'entreprise est défaillante au trimestre ${k + 1}, ses flux ne se lisent plus`);
  return tours;
}

/** Les flux de trésorerie que l'arène ne compte pas dans l'exploitation : l'impôt, les intérêts et l'investissement. */
const HORS_EXPLOITATION = new Set(["impot", "interets", "investissement"]);
const exploitationEncaissee = (r: CompanyRoundResult) =>
  r.cashFlow.items.reduce((t, i) => (HORS_EXPLOITATION.has(i.label) ? t : t + i.amount), 0);
const tresorerieNette = (r: CompanyRoundResult) => r.balanceSheet.cash - r.balanceSheet.overdraft;

/** La valeur résiduelle des machines au bout du projet : la revente que l'arène paie, et l'impôt que sa moins-value fait économiser. */
export function valeurResiduelle(machines: readonly EquipmentTypeDef[], duree: number, taux: number) {
  const enService = duree - TRIMESTRE_DE_L_ACHAT;
  const lignes = machines.map((m) => {
    const vnc = centime(m.costPerUnit * Math.max(0, 1 - enService / m.depreciationRounds));
    // Le même repli que le moteur quand le catalogue ne dit rien.
    const ratio = m.resaleRatio ?? 0.5;
    const prix = centime(vnc * ratio);
    return { vnc, ratio, prix };
  });
  const vnc = centime(lignes.reduce((t, l) => t + l.vnc, 0));
  const prix = centime(lignes.reduce((t, l) => t + l.prix, 0));
  const moinsValue = centime(vnc - prix);
  const economie = centime(taux * moinsValue);
  return { enService, vnc, ratio: lignes[0]!.ratio, prix, moinsValue, economie, nette: centime(prix + economie) };
}

/** La VAN d'une suite de flux trimestriels, à un taux trimestriel, chaque flux actualisé arrondi au centime. */
export function vanAuTaux(cout: number, flux: readonly number[], residuelle: number, taux: number) {
  const va = centime(flux.reduce((t, f, k) => t + centime(f * Math.pow(1 + taux, -(k + 1))), 0));
  const vaResiduelle = centime(residuelle * Math.pow(1 + taux, -flux.length));
  return { va, vaResiduelle, van: centime(va + vaResiduelle - cout) };
}

/** La VAN exacte, sans arrondi : celle que la dichotomie annule. */
export const vanExacte = (cout: number, flux: readonly number[], residuelle: number, taux: number) =>
  flux.reduce((t, f, k) => t + f * Math.pow(1 + taux, -(k + 1)), 0) + residuelle * Math.pow(1 + taux, -flux.length) - cout;

/**
 * L'écart admis sur une valeur actuelle : l'élève qui lit ses coefficients à quatre décimales, comme
 * dans une table financière, s'écarte d'au plus un demi dix-millième de chaque flux.
 */
export const toleranceDActualisation = (flux: readonly number[], residuelle = 0) =>
  Math.max(1, Math.ceil((flux.reduce((t, f) => t + Math.abs(f), 0) + Math.abs(residuelle)) * 0.00005));

/** Le délai de récupération actualisé, en trimestres : quand le cumul des flux actualisés rejoint pour de bon l'investissement. */
export function delaiActualise(actualises: readonly number[], cout: number): number | null {
  let cumul = 0;
  const cumuls = actualises.map((a) => (cumul = centime(cumul + a)));
  const dernierSous = cumuls.reduce((d, c, k) => (c < cout ? k : d), -1);
  if (dernierSous === cumuls.length - 1) return null;
  const k = dernierSous + 1;
  const avant = k === 0 ? 0 : cumuls[k - 1]!;
  return auDixieme(k + (cout - avant) / actualises[k]!);
}

export type Verdict = "investir" | "renoncer";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le projet d'une ou de plusieurs machines achetées au trimestre 1, sur `duree` trimestres. */
export function projet(code: string, machines: readonly EquipmentTypeDef[] = [machineDuChapitre(code)], duree = DUREE_DU_PROJET, paiement: Paiement = "tresorerie") {
  const cle = `${code}:${machines.map((m) => m.code).join("+")}:${duree}:${paiement}`;
  const deja = calculs.get(cle);
  if (deja) return deja;
  const r = calculer(code, machines, duree, paiement);
  calculs.set(cle, r);
  return r;
}

function calculer(code: string, machines: readonly EquipmentTypeDef[], duree: number, paiement: Paiement) {
  const s = scenarioByCode(code).scenario;
  const t = s.finance.taxRate;
  const i = TAUX_TRIMESTRIEL;
  const sans = sansDefaillance(projetSansInvestir(code), `${code}, sans investir`).slice(0, duree);
  const avec = sansDefaillance(projetAvec(code, machines, paiement), `${code}, avec ${machines.map((m) => m.name).join(" et ")}`).slice(0, duree);
  const cout = machines.reduce((x, m) => x + m.costPerUnit, 0);
  const dotation = centime(machines.reduce((x, m) => x + m.costPerUnit / m.depreciationRounds, 0));

  const lignes = sans.map((a, k) => {
    const b = avec[k]!;
    const ebe = centime(b.incomeStatement.ebitda - a.incomeStatement.ebitda);
    const rex = centime(b.incomeStatement.operatingIncome - a.incomeStatement.operatingIncome);
    const impot = centime(t * rex);
    const flux = centime(ebe - impot);
    const coef = Math.pow(1 + i, -(k + 1));
    return { trimestre: k + 1, ebe, rex, impot, flux, coef, actualise: centime(flux * coef) };
  });
  const flux = lignes.map((l) => l.flux);
  const total = (f: (l: (typeof lignes)[number]) => number) => centime(lignes.reduce((x, l) => x + f(l), 0));
  const vr = valeurResiduelle(machines, duree, t);
  const { va, vaResiduelle, van } = vanAuTaux(cout, flux, vr.nette, i);
  const coefFin = Math.pow(1 + i, -duree);

  // Ce que l'arène a prélevé d'impôt en plus, et ce que la trésorerie nette a gagné au bout du projet.
  const sommeEcart = (f: (r: CompanyRoundResult) => number) => centime(avec.reduce((x, b, k) => x + f(b) - f(sans[k]!), 0));
  const impotDeLArene = sommeEcart((r) => r.incomeStatement.tax);
  const interetsEnPlus = sommeEcart((r) => r.incomeStatement.interest);
  const tresorerieGagnee = centime(tresorerieNette(avec[duree - 1]!) - tresorerieNette(sans[duree - 1]!));
  const ebeTotal = total((l) => l.ebe);
  const bfr = centime(ebeTotal - sommeEcart(exploitationEncaissee));
  const fluxTotal = total((l) => l.flux);

  // Le trimestre qui montre le calcul d'un flux : celui où la machine ajoute le plus.
  const exemple = lignes.reduce((m, l) => (l.flux > m.flux ? l : m), lignes[0]!);

  return {
    code,
    machines: machines.map((m) => m.name),
    machine: machines.map((m) => m.name).join(" et "),
    cout,
    capacite: machines.reduce((x, m) => x + m.capacityPerUnit, 0),
    duree,
    dureeDAmortissement: machines[0]!.depreciationRounds,
    dotation,
    taux: t,
    tauxPct: auCentieme(t * 100),
    lignes,
    flux,
    exemple,
    ebeTotal,
    rexTotal: total((l) => l.rex),
    impotTotal: total((l) => l.impot),
    fluxTotal,
    vr,
    coefFin,
    va,
    vaResiduelle,
    van,
    tolerance: toleranceDActualisation(flux, vr.nette),
    ip: auCentieme((va + vaResiduelle) / cout),
    delai: delaiActualise(
      lignes.map((l) => l.actualise),
      cout,
    ),
    verdict: (van > 0 ? "investir" : "renoncer") as Verdict,
    // Payées sur la trésorerie : ce que l'arène prélève, et ce que la trésorerie nette garde au bout.
    impotDeLArene,
    interetsEnPlus,
    agiosApresImpot: centime(interetsEnPlus * (1 - t)),
    tresorerieGagnee,
    ecartDeTresorerie: centime(fluxTotal - cout - tresorerieGagnee),
    bfr,
  };
}

/** Le projet du chapitre : la machine du premier équipement du parc, sur la durée du projet. */
export const projetDuChapitre = (c: Cas) => projet(c.code);

const T = TRIMESTRE_DE_L_ACHAT;
const TAUX_PCT = auCentieme(TAUX_TRIMESTRIEL * 100);
const COUT_PCT = auCentieme(COUT_DU_CAPITAL_ANNUEL * 100);

export const LA_VALEUR_ACTUELLE_NETTE: Chapitre = {
  code: "la-valeur-actuelle-nette",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "La valeur actuelle nette d'un investissement",
  accroche: `Une machine de plus, payée comptant : ce qu'elle ajoute à la trésorerie pendant ${DUREE_DU_PROJET} trimestres, l'impôt sur ces flux, ce qu'elle vaudra à la revente, et ce que vaut aujourd'hui tout cela au coût du capital. La VAN dit si l'investissement crée de la valeur.`,
  objectifs: [
    "Passer d'un coût du capital annuel au taux trimestriel équivalent",
    "Calculer les flux de trésorerie d'exploitation d'un investissement, après l'impôt sur le résultat d'exploitation",
    "Calculer la valeur résiduelle d'un équipement, nette de l'impôt sur la moins-value de cession",
    "Actualiser les flux et calculer la valeur actuelle nette",
    "Décider sur le signe de la VAN, et dire ce que l'arène simplifie",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTUALISATION,
    pourquoi: `ce chapitre suit une machine qui fait vendre, sur ${DUREE_DU_PROJET / TRIMESTRES_PAR_AN} exercices tous bénéficiaires, pour que l'impôt sur ses flux soit celui que l'arène prélève, et dont les flux ont un taux de rentabilité interne : c'est le cas chez MAILLE & CO, L'ESCALE, LA TABLE D'AUGUSTIN, PIXEL & CO, VOLT FITNESS et ROUTE & CIE. Chez ATLAS CONSEIL, la machine ne fait rien vendre de plus. Chez NOVA, elle fait vendre, mais moins cher : elle y retire de l'EBE, et aucun taux n'annule sa VAN. Chez MARTEL & FILS, les deux machines que compare le chapitre sur le TRI, achetées ensemble, valent plus que la somme de leurs VAN seules : leurs embauches additionnées y coûtent plus que celles de l'ensemble.`,
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une machine, et le prix du temps",
      notions: ["discounting", "depreciation"],
      texte: (c) => {
        const p = projetDuChapitre(c);
        return [
          `${c.entreprise} envisage d'acheter au trimestre ${T} une machine de plus, « ${p.machine} », la même que le premier équipement de son parc, pour ${eur(p.cout)}. Elle la paierait sur sa trésorerie : on juge un investissement sans son financement, dont le coût est porté par le taux d'actualisation.`,
          `L'arène a rejoué ${p.duree} trimestres, ${p.duree / TRIMESTRES_PAR_AN} exercices, avec et sans la machine : mêmes concurrents, même marché, et le même bon gestionnaire pour toutes les autres décisions, qui les règle sur ce qu'il voit, machine comprise. La machine entre en service au trimestre ${T + 1} ; au bout du trimestre ${p.duree}, le projet s'arrête et la machine se revend.`,
          `La question n'est plus de savoir si la machine rapporte, mais si elle rapporte plus que ce que coûtent les capitaux qu'elle immobilise. Un euro reçu dans ${p.duree} trimestres vaut moins qu'un euro aujourd'hui : il faut actualiser.`,
        ];
      },
      tableau: (c) => {
        const p = projetDuChapitre(c);
        return {
          titre: `Le projet ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix de la machine, décaissé au trimestre ${T}`, valeurs: [eur(p.cout)] },
            { libelle: `Capacité ajoutée par trimestre (${c.unites})`, valeurs: [qte(p.capacite)] },
            { libelle: "Durée d'amortissement (trimestres)", valeurs: [qte(p.dureeDAmortissement)] },
            { libelle: "Durée du projet (trimestres)", valeurs: [qte(p.duree)] },
            { libelle: "Part de la valeur nette comptable reprise à la revente", valeurs: [pct(p.vr.ratio * 100)] },
            { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(p.tauxPct)] },
            { libelle: "Coût du capital, par an (hypothèse du cours)", valeurs: [pct(COUT_PCT)] },
          ],
        };
      },
      repere: () =>
        "VAN = flux actualisés + valeur résiduelle actualisée − investissement. Le projet crée de la valeur si sa VAN est positive.",
    },
    {
      id: "taux",
      type: "montants",
      titre: "Le taux trimestriel équivalent",
      notions: ["discounting"],
      question: () =>
        `Le coût du capital est de ${pct(COUT_PCT)} par an, et les flux de l'arène sont trimestriels. Calculez le taux trimestriel équivalent : celui qui, composé sur ${TRIMESTRES_PAR_AN} trimestres, redonne ${pct(COUT_PCT)} par an. Arrondissez-le au centième de point ; le chapitre le gardera ainsi.`,
      champs: () => [
        {
          libelle: "Taux trimestriel équivalent (%)",
          attendu: TAUX_PCT,
          calcul: `(1 + ${pct(COUT_PCT)})^(1/${TRIMESTRES_PAR_AN}) − 1 = ${pct((Math.pow(1 + COUT_DU_CAPITAL_ANNUEL, 1 / TRIMESTRES_PAR_AN) - 1) * 100, 4)}, soit ${pct(TAUX_PCT)}`,
          tolerance: 0.01,
        },
      ],
      explication: (c) => {
        const p = projetDuChapitre(c);
        const proportionnel = COUT_PCT / TRIMESTRES_PAR_AN;
        return [
          `Le taux proportionnel, ${pct(COUT_PCT)} ÷ ${TRIMESTRES_PAR_AN} = ${pct(proportionnel)}, est trop fort : composé sur un an, il donnerait ${pct(tauxAnnuelEquivalent(proportionnel / 100) * 100)}, plus que le coût du capital. Des flux trimestriels s'actualisent au taux équivalent.`,
          `Le flux du trimestre k s'actualise par (1 + ${pct(TAUX_PCT)})^(−k). Au trimestre ${p.duree}, ce coefficient vaut ${coef4(p.coefFin)} : un euro reçu à la fin du projet vaut ${eur(centime(p.coefFin))} aujourd'hui.`,
        ];
      },
    },
    {
      id: "flux",
      type: "montants",
      titre: "Les flux de trésorerie d'exploitation",
      notions: ["ebitda_margin", "income_statement"],
      tableau: (c) => {
        const p = projetDuChapitre(c);
        return {
          titre: "Ce que la machine ajoute, trimestre après trimestre",
          colonnes: ["EBE gagné", "Résultat d'exploitation gagné"],
          lignes: p.lignes.map((l) => ({ libelle: `Trimestre ${l.trimestre}`, valeurs: [eur(l.ebe), eur(l.rex)] })),
        };
      },
      question: (c) => {
        const p = projetDuChapitre(c);
        return `L'EBE gagné est un flux de trésorerie avant impôt. L'impôt, lui, se calcule sur le résultat d'exploitation gagné, après la dotation de la machine, au taux de ${pct(p.tauxPct)}. Sur les ${p.duree} trimestres, calculez l'EBE gagné, l'impôt sur le résultat d'exploitation gagné, puis les flux de trésorerie d'exploitation après impôt.`;
      },
      champs: (c) => {
        const p = projetDuChapitre(c);
        return [
          { libelle: "EBE gagné sur le projet", attendu: p.ebeTotal, calcul: `la somme des ${p.duree} trimestres du tableau, ${eur(p.ebeTotal)}`, tolerance: 1 },
          {
            libelle: "Impôt sur le résultat d'exploitation gagné",
            attendu: p.impotTotal,
            calcul: `${eur(p.rexTotal)} × ${pct(p.tauxPct)} = ${eur(p.impotTotal)}`,
            tolerance: 1,
          },
          {
            libelle: "Flux de trésorerie d'exploitation sur le projet",
            attendu: p.fluxTotal,
            calcul: `${eur(p.ebeTotal)} − ${retranche(p.impotTotal)} = ${eur(p.fluxTotal)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = projetDuChapitre(c);
        const x = p.exemple;
        const ecartDImpot = centime(p.impotTotal - p.impotDeLArene);
        // La machine peut faire baisser l'impôt (sa dotation dépasse l'EBE qu'elle ajoute) et la trésorerie : le texte le dit dans le bon sens.
        const prelevement = p.impotDeLArene >= 0 ? `${eur(p.impotDeLArene)} d'impôt en plus` : `${eur(-p.impotDeLArene)} d'impôt en moins`;
        const tresorerie = p.tresorerieGagnee >= 0 ? `plus haute de ${eur(p.tresorerieGagnee)}` : `plus basse de ${eur(-p.tresorerieGagnee)}`;
        return [
          `Le flux d'un trimestre est l'EBE gagné moins l'impôt de son résultat d'exploitation gagné : au trimestre ${x.trimestre}, ${eur(x.ebe)} − ${pct(p.tauxPct)} × ${retranche(x.rex)} = ${eur(x.flux)}. C'est aussi le résultat d'exploitation gagné après impôt, plus la dotation de la machine, ${eur(p.dotation)} par trimestre, qui ne sort pas d'argent.`,
          Math.abs(ecartDImpot) < 1
            ? `L'arène a prélevé ${prelevement} sur les ${p.duree / TRIMESTRES_PAR_AN} exercices : le même montant. Un seul taux, sur le résultat de chaque exercice, tous bénéficiaires.`
            : `L'arène a prélevé ${prelevement} sur les ${p.duree / TRIMESTRES_PAR_AN} exercices, ${eur(Math.abs(ecartDImpot))} ${ecartDImpot > 0 ? "de moins" : "de plus"} que le calcul du chapitre : l'achat a fait varier de ${eur(Math.abs(p.interetsEnPlus))} les agios du découvert, déductibles. C'est un effet du financement, que la VAN laisse au taux d'actualisation.`,
          `Au bout du projet, la trésorerie nette est ${tresorerie} avec la machine, alors que les flux moins le prix donnent ${eur(centime(p.fluxTotal - p.cout))}. L'écart tient au besoin en fonds de roulement que l'activité en plus immobilise, stocks, créances et TVA (${eur(p.bfr)})${p.agiosApresImpot !== 0 ? `, et aux agios après impôt (${eur(p.agiosApresImpot)})` : ""}. Le chapitre ne compte pas cette variation du BFR, que l'entreprise récupérerait en arrêtant l'activité.`,
        ];
      },
    },
    {
      id: "valeur-residuelle",
      type: "montants",
      titre: "La valeur résiduelle",
      notions: ["depreciation"],
      question: (c) => {
        const p = projetDuChapitre(c);
        return `Au bout du trimestre ${p.duree}, la machine a servi ${p.vr.enService} trimestres sur les ${p.dureeDAmortissement} de sa durée d'amortissement. L'arène la reprend à ${pct(p.vr.ratio * 100)} de sa valeur nette comptable ; la moins-value de cession est une charge, qui fait économiser l'impôt. Calculez la valeur nette comptable de la machine à la fin du projet, son prix de cession, puis la valeur résiduelle nette d'impôt.`;
      },
      champs: (c) => {
        const p = projetDuChapitre(c);
        const v = p.vr;
        return [
          {
            libelle: "Valeur nette comptable à la fin du projet",
            attendu: v.vnc,
            calcul: `${eur(p.cout)} × (1 − ${v.enService} ÷ ${p.dureeDAmortissement}) = ${eur(v.vnc)}`,
            tolerance: 1,
          },
          { libelle: "Prix de cession", attendu: v.prix, calcul: `${eur(v.vnc)} × ${pct(v.ratio * 100)} = ${eur(v.prix)}`, tolerance: 1 },
          {
            libelle: "Valeur résiduelle nette d'impôt",
            attendu: v.nette,
            calcul: `${eur(v.prix)} + ${pct(p.tauxPct)} × (${eur(v.vnc)} − ${eur(v.prix)}) = ${eur(v.prix)} + ${eur(v.economie)} = ${eur(v.nette)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = projetDuChapitre(c);
        const v = p.vr;
        return [
          `La revente rapporte ${eur(v.prix)}. La moins-value, ${eur(v.moinsValue)}, entre dans le résultat d'exploitation du trimestre de la cession, comme l'arène la compte : l'impôt baisse de ${eur(v.economie)}.`,
          "Ce qui compte n'est pas ce que la machine vaut dans les comptes, mais l'argent qu'elle rendra : le catalogue de l'arène ne reprend qu'une part de sa valeur nette comptable.",
        ];
      },
    },
    {
      id: "van",
      type: "montants",
      titre: "La valeur actuelle nette",
      notions: ["discounting"],
      tableau: (c) => {
        const p = projetDuChapitre(c);
        return {
          titre: `Les flux à actualiser, au taux de ${pct(TAUX_PCT)} par trimestre`,
          colonnes: ["Flux de trésorerie", "Coefficient d'actualisation"],
          lignes: [
            ...p.lignes.map((l) => ({ libelle: `Trimestre ${l.trimestre}`, valeurs: [eur(l.flux), coef4(l.coef)] })),
            { libelle: `Valeur résiduelle nette, fin du trimestre ${p.duree}`, valeurs: [eur(p.vr.nette), coef4(p.coefFin)] },
          ],
        };
      },
      question: () =>
        `Au taux de ${pct(TAUX_PCT)} par trimestre, calculez la valeur actuelle des flux de trésorerie d'exploitation, celle de la valeur résiduelle, puis la valeur actuelle nette de la machine.`,
      champs: (c) => {
        const p = projetDuChapitre(c);
        const [a, b] = p.lignes.filter((l) => l.flux !== 0);
        return [
          {
            libelle: "Valeur actuelle des flux d'exploitation",
            attendu: p.va,
            calcul: `${retranche(a!.flux)} × ${coef4(a!.coef)} + ${retranche(b!.flux)} × ${coef4(b!.coef)} + … = ${eur(p.va)}`,
            tolerance: p.tolerance,
          },
          {
            libelle: "Valeur actuelle de la valeur résiduelle",
            attendu: p.vaResiduelle,
            calcul: `${eur(p.vr.nette)} × ${coef4(p.coefFin)} = ${eur(p.vaResiduelle)}`,
            tolerance: 1,
          },
          {
            libelle: "Valeur actuelle nette (VAN)",
            attendu: p.van,
            calcul: `${eur(p.va)} + ${eur(p.vaResiduelle)} − ${eur(p.cout)} = ${eur(p.van)}`,
            tolerance: p.tolerance + 1,
          },
        ];
      },
      explication: (c) => {
        const p = projetDuChapitre(c);
        const sansActualiser = centime(p.fluxTotal + p.vr.nette);
        return [
          `Sans actualiser, la machine rendrait ${eur(sansActualiser)} pour ${eur(p.cout)}. Actualisé, ce qu'elle rend ne vaut plus que ${eur(centime(p.va + p.vaResiduelle))} : attendre a un prix, le coût du capital.`,
          p.van > 0
            ? `La VAN est positive : la machine rapporte plus que les ${pct(COUT_PCT)} par an qu'exigent les capitaux, et crée ${eur(p.van)} de valeur, en euros d'aujourd'hui.`
            : `La VAN est négative : la machine rapporte moins que les ${pct(COUT_PCT)} par an qu'exigent les capitaux, et détruit ${eur(-p.van)} de valeur, en euros d'aujourd'hui.`,
        ];
      },
    },
    {
      id: "decision",
      type: "choix",
      titre: "Investir ou non",
      notions: ["discounting", "profitability_vs_return"],
      question: (c) => `La VAN de la machine est de ${eur(projetDuChapitre(c).van)}. Que décider ?`,
      options: (c) => {
        const p = projetDuChapitre(c);
        return [
          {
            texte: "Investir : la VAN est positive, la machine crée de la valeur au coût du capital",
            juste: p.verdict === "investir",
            retour:
              p.verdict === "investir"
                ? `Oui : ses flux actualisés et sa revente valent ${eur(centime(p.va + p.vaResiduelle))}, ${eur(p.van)} de plus que son prix. Les capitaux qu'elle immobilise sont rémunérés à ${pct(COUT_PCT)} par an, et il reste de la valeur pour l'entreprise.`
                : `Non : la VAN est négative, ${eur(p.van)}.`,
          },
          {
            texte: "Renoncer : la VAN est négative, la machine rapporte moins que le coût du capital",
            juste: p.verdict === "renoncer",
            retour:
              p.verdict === "renoncer"
                ? `Oui : ses flux actualisés et sa revente ne valent que ${eur(centime(p.va + p.vaResiduelle))}, moins que son prix.`
                : `Non : la VAN est positive, ${eur(p.van)}.`,
          },
          {
            texte: "Investir, parce que les flux cumulés dépassent le prix de la machine",
            juste: false,
            retour:
              p.fluxTotal > p.cout
                ? `Non : ce raisonnement oublie le temps. Les flux cumulés, ${eur(p.fluxTotal)}, ne disent rien du coût du capital : c'est leur valeur actuelle qu'on compare au prix.`
                : `Non : les flux cumulés, ${eur(p.fluxTotal)}, ne dépassent même pas le prix de la machine, ${eur(p.cout)}. Et même s'ils le dépassaient, c'est leur valeur actuelle qu'on compare au prix.`,
          },
          {
            texte: "Renoncer : la machine ne sera pas amortie à la fin du projet",
            juste: false,
            retour: `Non : qu'il reste ${eur(p.vr.vnc)} à amortir ne coûte rien en soi. La revente en rend ${eur(p.vr.nette)}, impôt compris, et la VAN l'a compté.`,
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["discounting"],
      texte: (c) => {
        const p = projetDuChapitre(c);
        return [
          `Chez ${c.entreprise}, la machine coûte ${eur(p.cout)}. En ${p.duree} trimestres, elle ajoute ${eur(p.fluxTotal)} de flux de trésorerie d'exploitation après impôt, et se revend ${eur(p.vr.nette)}, impôt compris. Au coût du capital de ${pct(COUT_PCT)} par an, sa VAN est de ${eur(p.van)} : ${p.verdict === "investir" ? "elle crée de la valeur" : "elle en détruit"}.`,
          `Ce que l'arène simplifie : un seul taux d'impôt, sans taux réduit, prélevé chaque trimestre ; une revente à une part fixe de la valeur nette comptable, sans marché de l'occasion ; les autres décisions prises par le même bon gestionnaire, avec et sans la machine, qui peut régler autrement ses prix, sa production ou son équipe quand la machine est là ; un projet arrêté au bout de ${p.duree} trimestres, la plus longue partie que l'arène joue au trimestre. Et le cours ajoute ses hypothèses : un coût du capital de ${pct(COUT_PCT)} par an, des flux reçus en fin de trimestre, et une variation du besoin en fonds de roulement laissée de côté.`,
        ];
      },
      repere: () =>
        "Flux de trésorerie d'exploitation = EBE gagné − impôt sur le résultat d'exploitation gagné. Valeur résiduelle nette = prix de cession + impôt économisé sur la moins-value. On investit si la VAN est positive.",
    },
  ],
};
