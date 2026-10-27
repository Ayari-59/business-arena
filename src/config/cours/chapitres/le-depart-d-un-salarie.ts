import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : LE DÉPART D'UN SALARIÉ ET SON REMPLACEMENT (BTS GPME, palier 3, bloc 3).
 *
 * Les chapitres du bac STMG ont montré qu'un salaire trop bas fait partir des salariés
 * (« Rémunération et motivation ») et qu'une embauche n'arrive qu'au trimestre suivant
 * (« Recruter »). Ici, le gestionnaire de la PME chiffre UN départ, en entier : la capacité que
 * le poste vide fait perdre, les ventes et la marge qui partent avec elle, le recrutement du
 * remplaçant et le salaire que le poste vide n'a pas coûté. Puis il compare ce coût à ce qu'a
 * fait économiser le salaire sous le marché qui a provoqué le départ, et se demande quand il
 * aurait fallu recruter pour que le poste ne reste pas vide.
 *
 * L'année est celle du cours, rejouée par l'arène (gestion-de-la-pme.ts) : au trimestre 1, les
 * salaires sont payés sous le marché, assez pour franchir le seuil de démission du scénario
 * (`hr.attritionThreshold`), et un salarié part à la fin du trimestre ; dès le trimestre 2, le
 * salaire revient à celui du marché, et le remplaçant est recruté, en plus des embauches que la
 * gestion fait ce trimestre-là dans l'année sans départ ; il n'arrive qu'au trimestre d'après,
 * comme le moteur le joue (src/engine/hr). Le coût d'un recrutement et le salaire sont ceux du
 * scénario.
 *
 * Les autres décisions de l'année sont celles du bon gestionnaire de l'arène (arene-du-cours.ts),
 * qui prévoit chaque trimestre sa production d'après la demande du trimestre d'avant, ventes
 * manquées comprises. Un client que le poste vide n'a pas servi compte donc encore dans la demande
 * qu'il lit : il ne prépare pas moins ensuite, et les trimestres suivants restent ceux de
 * l'année sans départ, ou s'en écartent un peu (la garde le vérifie). Le coût complet du départ
 * compte cet écart de marge des trimestres suivants ; l'étape qui le calcule ne se montre que là
 * où l'année rejouée le rencontre.
 *
 * Le chapitre ne se joue que là où un poste vide coûte des ventes : ailleurs, l'équipe a plus de
 * bras que son activité n'en demande, et un départ n'y fait perdre aucune vente (la garde le
 * vérifie dans les deux sens). Défaut de l'arène, que le chapitre dit : elle ne fait payer ni le
 * temps que le remplaçant met à connaître son poste, ni le savoir-faire de celui qui part.
 */

/**
 * L'écart de salaire du trimestre 1, sous le salaire du marché : 10 %. C'est une économie
 * qu'une PME peut être tentée de faire, et elle passe sous le seuil de démission de chaque
 * entreprise du cours (entre 95 % et 98 % du marché) : un salarié part à la fin du trimestre.
 */
export const ECART_SOUS_LE_MARCHE = 0.1;

/** Le trimestre où les salaires sont payés sous le marché, et où le salarié démissionne. */
export const TRIMESTRE_DE_LA_BAISSE = 1;

/**
 * Le salaire des autres trimestres : celui du marché (indice 1), comme dans l'année du cours. La
 * gestion de l'arène reconduit sa décision du trimestre d'avant : sans ce retour, la baisse du
 * trimestre 1 durerait toute l'année, et un salarié partirait chaque trimestre.
 */
export const SALAIRE_DU_MARCHE = 1;

/**
 * Le trimestre où le gérant recrute le remplaçant : le suivant, une fois le départ constaté.
 * Recruté, le remplaçant n'arrive qu'au trimestre d'après : ce trimestre-ci, le poste est vide.
 */
export const TRIMESTRE_DU_RECRUTEMENT = 2;

/**
 * Les entreprises où le poste vide coûte des ventes : NOVA, le cabinet de conseil et le bâtiment,
 * dont la gestion prépare au trimestre vide plus que ce qu'une équipe d'un salarié de moins peut
 * produire. Dans les autres, la gestion produit moins que l'équipe ne le peut, même avec un
 * salarié de moins : l'arène n'y perd aucune vente pendant la vacance, et le départ ne fait
 * qu'économiser un salaire (la garde le vérifie).
 */
export const ENTREPRISES_OU_LE_POSTE_COMPTE = ["nova", "conseil", "batiment"] as const;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** L'indice du trimestre dans l'année rejouée (le moteur compte les trimestres à partir de 1). */
const rang = (trimestre: number) => trimestre - 1;

export type Verdict = "le-depart-coute-plus" | "l-economie-couvre";

/**
 * Les embauches que la gestion fait au trimestre `t` de l'année sans départ : le remplaçant s'y
 * ajoute. Recruter « un de plus que prévu », et non « un seul », garde l'équipe des trimestres
 * suivants égale à celle de l'année sans départ, là où la gestion embauche aussi pour son activité.
 */
export const embauchesPrevues = (code: string, t: number) => anneeDeReference(code)[rang(t)]!.hr?.hired ?? 0;

/** L'année du départ, rejouée : le salaire baissé au trimestre 1, le remplaçant recruté au trimestre 2. */
export function anneeDuDepart(code: string) {
  return rejouerAvec(code, "le-depart-d-un-salarie:remplace-au-trimestre-2", (t, d) =>
    t === TRIMESTRE_DE_LA_BAISSE
      ? { ...d, hr: { ...d.hr, salaryIndex: 1 - ECART_SOUS_LE_MARCHE } }
      : t === TRIMESTRE_DU_RECRUTEMENT
        ? { ...d, hr: { ...d.hr, salaryIndex: SALAIRE_DU_MARCHE, hire: embauchesPrevues(code, t) + 1 } }
        : { ...d, hr: { ...d.hr, salaryIndex: SALAIRE_DU_MARCHE } },
  );
}

/** Le départ et son remplacement : la vacance, son coût complet, et l'économie qui l'a provoqué. */
export function departDUnSalarie(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const reference = anneeDeReference(c.code);
  const depart = anneeDuDepart(c.code);
  const effectif = c.personnel.effectif;
  const salaire = hr.salaryPerEmployeePerRound;
  const ecart = Math.round(ECART_SOUS_LE_MARCHE * 100);
  const trimestreVide = TRIMESTRE_DU_RECRUTEMENT;
  const avant = reference[rang(trimestreVide)]!;
  const vide = depart[rang(trimestreVide)]!;
  const economie = Math.round(effectif * salaire * ECART_SOUS_LE_MARCHE);
  const capaciteAvant = Math.round(avant.production.laborCapacity);
  const capaciteVide = Math.round(vide.production.laborCapacity);
  const venduesAvant = Math.round(soldUnits(avant));
  const venduesVide = Math.round(soldUnits(vide));
  const margeAvant = Math.round(avant.incomeStatement.grossMargin);
  const margeVide = Math.round(vide.incomeStatement.grossMargin);
  const ventesPerdues = venduesAvant - venduesVide;
  const margePerdue = margeAvant - margeVide;
  // Les trimestres d'après le poste vide : la gestion y prépare d'après ses ventes du trimestre d'avant.
  const ensuite = (a: typeof reference) => a.slice(rang(trimestreVide) + 1);
  const venduesEnsuiteAvant = Math.round(surLAnnee(ensuite(reference), soldUnits));
  const venduesEnsuiteApres = Math.round(surLAnnee(ensuite(depart), soldUnits));
  const margeEnsuiteAvant = Math.round(surLAnnee(ensuite(reference), (r) => r.incomeStatement.grossMargin));
  const margeEnsuiteApres = Math.round(surLAnnee(ensuite(depart), (r) => r.incomeStatement.grossMargin));
  const ventesPerduesEnsuite = venduesEnsuiteAvant - venduesEnsuiteApres;
  const margePerdueEnsuite = margeEnsuiteAvant - margeEnsuiteApres;
  const recrutement = hr.hiringCost;
  // Le poste reste vide un trimestre : c'est un salaire que l'entreprise ne verse pas.
  const salaireNonVerse = salaire;
  const coutDuDepart = margePerdue + margePerdueEnsuite + recrutement - salaireNonVerse;
  const resultatAvant = Math.round(surLAnnee(reference, (r) => r.incomeStatement.operatingIncome));
  const resultatApres = Math.round(surLAnnee(depart, (r) => r.incomeStatement.operatingIncome));
  const ecartDeResultat = resultatApres - resultatAvant;
  const venduesAnnee = Math.round(surLAnnee(reference, soldUnits));
  const venduesAnneeApres = Math.round(surLAnnee(depart, soldUnits));
  const verdict: Verdict = ecartDeResultat < 0 ? "le-depart-coute-plus" : "l-economie-couvre";
  return {
    effectif,
    salaire,
    ecart,
    seuil: Math.round(hr.attritionThreshold * 100),
    economie,
    departs: depart[rang(TRIMESTRE_DE_LA_BAISSE)]!.hr?.departed ?? 0,
    trimestreVide,
    effectifVide: vide.hr?.headcount ?? effectif,
    capaciteAvant,
    capaciteVide,
    capacitePerdue: capaciteAvant - capaciteVide,
    venduesAvant,
    venduesVide,
    ventesPerdues,
    margeAvant,
    margeVide,
    margePerdue,
    margeParVentePerdue: ventesPerdues > 0 ? auCentime(margePerdue / ventesPerdues) : 0,
    /** L'effectif au trimestre où le remplaçant est arrivé : celui de l'année sans départ. */
    effectifEnsuite: depart[rang(trimestreVide) + 1]?.hr?.headcount ?? effectif,
    plansEnsuiteAvant: Math.round(surLAnnee(ensuite(reference), (r) => r.production.planned)),
    plansEnsuiteApres: Math.round(surLAnnee(ensuite(depart), (r) => r.production.planned)),
    venduesEnsuiteAvant,
    venduesEnsuiteApres,
    ventesPerduesEnsuite,
    margeEnsuiteAvant,
    margeEnsuiteApres,
    margePerdueEnsuite,
    /** La marge que le départ fait perdre sur l'année : pendant la vacance, puis les trimestres suivants. */
    margePerdueTotale: margePerdue + margePerdueEnsuite,
    trimestresEnsuite:
      reference.length === trimestreVide + 1
        ? `le trimestre ${reference.length}`
        : `les trimestres ${trimestreVide + 1} ${reference.length === trimestreVide + 2 ? "et" : "à"} ${reference.length}`,
    recrutement,
    salaireNonVerse,
    coutDuDepart,
    venduesAnnee,
    venduesAnneeApres,
    resultatAvant,
    resultatApres,
    ecartDeResultat,
    verdict,
  };
}

export const LE_DEPART_D_UN_SALARIE: Chapitre = {
  code: "le-depart-d-un-salarie",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME"],
  titre: "Le départ d'un salarié et son remplacement",
  accroche:
    "Un salaire sous le marché fait une économie tout de suite. S'il fait partir un salarié, le poste reste vide le temps de le remplacer : la capacité perdue, la marge qui s'en va, le recrutement. Le coût complet d'un départ, face à l'économie.",
  objectifs: [
    "Mesurer ce qu'un poste vide fait perdre en capacité, en ventes et en marge",
    "Calculer le coût complet d'un départ et de son remplacement",
    "Comparer ce coût à l'économie d'un salaire sous le marché",
    "Tenir compte du délai de remplacement pour décider quand recruter",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_OU_LE_POSTE_COMPTE,
    pourquoi:
      "dans l'arène, son équipe a plus de bras que son activité n'en demande, et un poste vide n'y coûte aucune vente ; ce chapitre mesure ce qu'un départ fait perdre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un salarié s'en va",
      notions: ["staff_turnover", "pay_and_motivation"],
      texte: (c) => {
        const r = departDUnSalarie(c);
        return [
          `Au trimestre ${TRIMESTRE_DE_LA_BAISSE}, ${c.entreprise} a payé ses ${r.effectif} salariés ${r.ecart} % sous le salaire du marché, pour faire une économie. Dans l'arène, sous ${r.seuil} % du salaire du marché, un salarié démissionne : il part à la fin du trimestre.`,
          `Le gérant recrute un remplaçant au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, une fois le départ constaté. Le recrutement coûte ${eur(r.recrutement)} tout de suite, et le remplaçant n'arrive qu'au trimestre suivant : pendant tout le trimestre ${r.trimestreVide}, le poste reste vide. Dès ce trimestre, le salaire revient à celui du marché. L'arène a rejoué l'année ainsi ; le reste est décidé par la même gestion, qui prévoit chaque trimestre sa production d'après la demande du trimestre d'avant, ventes manquées comprises.`,
        ];
      },
      tableau: (c) => {
        const r = departDUnSalarie(c);
        return {
          titre: `Le personnel ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Effectif au trimestre ${TRIMESTRE_DE_LA_BAISSE}`, valeurs: [String(r.effectif)] },
            { libelle: "Coût d'un salarié par trimestre, au salaire du marché", valeurs: [eur(r.salaire)] },
            { libelle: `Salaire payé au trimestre ${TRIMESTRE_DE_LA_BAISSE} (marché = 100)`, valeurs: [String(100 - r.ecart)] },
            { libelle: "Seuil de démission (marché = 100)", valeurs: [String(r.seuil)] },
            { libelle: "Coût d'un recrutement", valeurs: [eur(r.recrutement)] },
          ],
        };
      },
      repere: () =>
        "Coût d'un départ = marge perdue à cause du poste vide (pendant la vacance, puis les trimestres qui suivent) + coût du recrutement − salaires que le poste vide n'a pas coûtés.",
    },
    {
      id: "vacance",
      type: "montants",
      titre: "Le poste vide",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = departDUnSalarie(c);
        return {
          titre: `Le trimestre ${r.trimestreVide}, sans départ et avec le poste vide`,
          colonnes: ["Sans départ", "Poste vide"],
          lignes: [
            { libelle: "Effectif", valeurs: [String(r.effectif), String(r.effectifVide)] },
            { libelle: `Capacité de l'équipe (${c.unites})`, valeurs: [qte(r.capaciteAvant), qte(r.capaciteVide)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(r.venduesAvant), qte(r.venduesVide)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.margeAvant), eur(r.margeVide)] },
          ],
        };
      },
      question: (c) => {
        const r = departDUnSalarie(c);
        return `Au trimestre ${r.trimestreVide}, le poste est vide. Calculez la capacité que l'équipe perd, les ventes perdues (en ${c.unites}) et la marge sur coût variable perdue.`;
      },
      champs: (c) => {
        const r = departDUnSalarie(c);
        return [
          { libelle: `Capacité perdue (${c.unites})`, attendu: r.capacitePerdue, calcul: `${qte(r.capaciteAvant)} − ${qte(r.capaciteVide)} = ${qte(r.capacitePerdue)}`, tolerance: 1 },
          { libelle: `Ventes perdues (${c.unites})`, attendu: r.ventesPerdues, calcul: `${qte(r.venduesAvant)} − ${qte(r.venduesVide)} = ${qte(r.ventesPerdues)}`, tolerance: 1 },
          { libelle: "Marge perdue", attendu: r.margePerdue, calcul: `${eur(r.margeAvant)} − ${retranche(r.margeVide)} = ${eur(r.margePerdue)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = departDUnSalarie(c);
        return [
          `Avec un salarié de moins, l'équipe ${dE(c.entreprise)} peut produire ${qte(r.capacitePerdue)} ${c.unites} de moins dans le trimestre, et elle en vend ${qte(r.ventesPerdues)} de moins : ce trimestre, c'est elle qui limitait les ventes. Ces ventes emportent leur marge, ${eur(r.margePerdue)}, soit ${eur(r.margeParVentePerdue)} pour chacune.`,
        ];
      },
    },
    {
      id: "ensuite",
      type: "montants",
      titre: "Après le retour du remplaçant",
      notions: ["contribution_margin"],
      si: (c) => {
        const r = departDUnSalarie(c);
        return r.ventesPerduesEnsuite !== 0 || r.margePerdueEnsuite !== 0;
      },
      tableau: (c) => {
        const r = departDUnSalarie(c);
        return {
          titre: `${r.trimestresEnsuite.charAt(0).toUpperCase()}${r.trimestresEnsuite.slice(1)}, sans départ et après le départ`,
          colonnes: ["Sans départ", "Après le départ"],
          lignes: [
            { libelle: `Production préparée par la gestion (${c.unites})`, valeurs: [qte(r.plansEnsuiteAvant), qte(r.plansEnsuiteApres)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(r.venduesEnsuiteAvant), qte(r.venduesEnsuiteApres)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.margeEnsuiteAvant), eur(r.margeEnsuiteApres)] },
          ],
        };
      },
      question: (c) => {
        const r = departDUnSalarie(c);
        return `Le remplaçant arrive au trimestre ${r.trimestreVide + 1} : l'équipe retrouve l'effectif de l'année sans départ, ${r.effectifEnsuite} salariés. Mais la gestion prévoit chaque trimestre sa production d'après la demande du trimestre d'avant, ventes manquées comprises : l'année ne reprend pas forcément à l'identique. D'après le tableau, calculez les ventes perdues sur ${r.trimestresEnsuite} (en ${c.unites}), puis la marge sur coût variable perdue (une vente ou une marge gagnée se compte en négatif).`;
      },
      champs: (c) => {
        const r = departDUnSalarie(c);
        return [
          {
            libelle: `Ventes perdues ensuite (${c.unites})`,
            attendu: r.ventesPerduesEnsuite,
            calcul: `${qte(r.venduesEnsuiteAvant)} − ${qte(r.venduesEnsuiteApres)} = ${qte(r.ventesPerduesEnsuite)}`,
            tolerance: 1,
          },
          {
            libelle: "Marge perdue ensuite",
            attendu: r.margePerdueEnsuite,
            calcul: `${eur(r.margeEnsuiteAvant)} − ${retranche(r.margeEnsuiteApres)} = ${eur(r.margePerdueEnsuite)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = departDUnSalarie(c);
        const plans = r.plansEnsuiteApres - r.plansEnsuiteAvant;
        const ventes = -r.ventesPerduesEnsuite;
        const sens = (x: number) => (x > 0 ? "de plus" : "de moins");
        return [
          `Le trimestre ${r.trimestreVide} a manqué ${qte(r.ventesPerdues)} ${c.unites} de ventes, que la gestion lit encore comme de la demande. Sur ${r.trimestresEnsuite}, elle prépare ${plans === 0 ? `autant que sans départ` : `${qte(Math.abs(plans))} ${c.unites} ${sens(plans)}`}, et ${c.entreprise} ${ventes === 0 ? "vend autant" : `en vend ${qte(Math.abs(ventes))} ${sens(ventes)}`}, son équipe complète.`,
          r.margePerdueEnsuite > 0
            ? `Le départ coûte encore ${eur(r.margePerdueEnsuite)} de marge après l'arrivée du remplaçant.`
            : r.margePerdueEnsuite < 0
              ? `Ensuite, la marge ne baisse pas : elle monte de ${eur(-r.margePerdueEnsuite)}, qui viennent en déduction du coût du départ.`
              : "Ensuite, la marge est celle de l'année sans départ.",
        ];
      },
    },
    {
      id: "cout",
      type: "montants",
      titre: "Le coût complet du départ",
      notions: ["staff_turnover", "payroll"],
      tableau: (c) => {
        const r = departDUnSalarie(c);
        return {
          titre: "L'année jouée, au salaire du marché et avec le départ",
          colonnes: ["Salaire du marché", "Départ et remplacement"],
          lignes: [{ libelle: "Résultat de l'activité sur l'année", valeurs: [eur(r.resultatAvant), eur(r.resultatApres)] }],
        };
      },
      question: (c) => {
        const r = departDUnSalarie(c);
        return `Calculez le coût complet du départ : la marge perdue${r.margePerdueEnsuite !== 0 ? ` pendant la vacance et ensuite` : ""}, plus le recrutement, moins le salaire que le poste vide n'a pas coûté au trimestre ${r.trimestreVide}. Calculez ensuite l'économie de salaire du trimestre ${TRIMESTRE_DE_LA_BAISSE} (${r.effectif} salariés × ${eur(r.salaire)} × ${r.ecart} %), puis, d'après le tableau, l'écart de résultat de l'activité sur l'année.`;
      },
      champs: (c) => {
        const r = departDUnSalarie(c);
        return [
          {
            libelle: "Coût complet du départ",
            attendu: r.coutDuDepart,
            calcul: `${eur(r.margePerdue)}${r.margePerdueEnsuite !== 0 ? ` + ${retranche(r.margePerdueEnsuite)}` : ""} + ${eur(r.recrutement)} − ${eur(r.salaireNonVerse)} = ${eur(r.coutDuDepart)}`,
            tolerance: 1,
          },
          {
            libelle: `Économie de salaire du trimestre ${TRIMESTRE_DE_LA_BAISSE}`,
            attendu: r.economie,
            calcul: `${r.effectif} × ${eur(r.salaire)} × ${r.ecart} % = ${eur(r.economie)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat sur l'année",
            attendu: r.ecartDeResultat,
            calcul: `${eur(r.resultatApres)} − ${retranche(r.resultatAvant)} = ${eur(r.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = departDUnSalarie(c);
        return [
          r.coutDuDepart >= 0
            ? `Le départ coûte ${eur(r.coutDuDepart)} : le salaire que le poste vide n'a pas coûté ne compense pas la marge perdue et le recrutement.${r.margePerdueEnsuite > 0 && r.margePerdue + r.recrutement < r.salaireNonVerse ? ` Le trimestre vide, seul, aurait rapporté ${eur(r.salaireNonVerse - r.margePerdue - r.recrutement)} ; ce sont les ventes perdues ensuite qui font le coût.` : ""}`
            : `Ici, le poste vide coûte moins que le salaire qu'il fait économiser : la marge perdue (${eur(r.margePerdueTotale)}) et le recrutement (${eur(r.recrutement)}) restent sous le salaire non versé (${eur(r.salaireNonVerse)}). Le coût du départ est négatif : le départ rapporte ${eur(-r.coutDuDepart)}.`,
          `La baisse de salaire avait fait économiser ${eur(r.economie)} au trimestre ${TRIMESTRE_DE_LA_BAISSE}. L'écart de résultat de l'année, ${eur(r.ecartDeResultat)}, est l'économie moins le coût du départ : dans l'arène, rien d'autre n'a changé.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Fallait-il payer sous le marché ?",
      notions: ["pay_and_motivation", "staff_turnover"],
      question: (c) => {
        const r = departDUnSalarie(c);
        return `Au salaire du marché toute l'année, le résultat de l'activité ${dE(c.entreprise)} aurait été de ${eur(r.resultatAvant)} ; avec le salaire baissé au trimestre ${TRIMESTRE_DE_LA_BAISSE} et le départ qui a suivi, il est de ${eur(r.resultatApres)}. Que retenir ?`;
      },
      options: (c) => {
        const r = departDUnSalarie(c);
        const coute = r.verdict === "le-depart-coute-plus";
        return [
          {
            texte: "Le départ coûte plus que l'économie : il fallait garder le salaire du marché",
            juste: coute,
            retour: coute
              ? `Oui : le départ a coûté ${eur(r.coutDuDepart)}, plus que les ${eur(r.economie)} économisés, et le résultat de l'année baisse de ${eur(-r.ecartDeResultat)}. L'économie portait sur un trimestre de salaires ; le départ se paie en ventes que l'équipe ne peut plus servir${r.margePerdueEnsuite > 0 ? ", puis en ventes que la gestion ne prépare plus" : ""}.`
              : `Non : cette année, l'économie (${eur(r.economie)}) dépasse le coût du départ (${eur(r.coutDuDepart)}), et le résultat monte de ${eur(r.ecartDeResultat)}.`,
          },
          {
            texte: "L'économie couvre le départ cette année, mais l'arène ne compte pas tout",
            juste: !coute,
            retour: !coute
              ? `Oui : le résultat monte de ${eur(r.ecartDeResultat)}. Mais l'arène ne fait payer ni le temps que le remplaçant met à connaître son poste, ni le savoir-faire de celui qui part ; et tant que le salaire reste sous le seuil, un autre salarié part chaque trimestre. Dans une vraie PME, un départ coûte davantage.`
              : `Non : le résultat de l'année baisse de ${eur(-r.ecartDeResultat)} : le départ a coûté plus que l'économie.`,
          },
          {
            texte: "Le départ ne coûte rien : le remplaçant prend le poste le jour même",
            juste: false,
            retour: `Non : recruté au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, le remplaçant n'arrive qu'au trimestre suivant. Pendant le trimestre ${r.trimestreVide}, le poste est vide, et ${c.entreprise} vend ${qte(r.ventesPerdues)} ${c.unites} de moins.`,
          },
        ];
      },
    },
    {
      id: "delai",
      type: "choix",
      titre: "Remplacer à temps",
      notions: ["staff_turnover"],
      question: () =>
        `Le salarié a prévenu de son départ dès le trimestre ${TRIMESTRE_DE_LA_BAISSE}. Pour que le poste ne reste jamais vide, quand fallait-il recruter le remplaçant ?`,
      options: (c) => {
        const r = departDUnSalarie(c);
        return [
          {
            texte: `Au trimestre ${TRIMESTRE_DE_LA_BAISSE}, dès l'annonce : un remplaçant recruté n'arrive qu'au trimestre suivant`,
            juste: true,
            retour: `Oui : dans l'arène comme dans une PME, un recrutement prend du temps. Recruté au trimestre ${TRIMESTRE_DE_LA_BAISSE}, le remplaçant arrive au trimestre ${TRIMESTRE_DE_LA_BAISSE + 1}, quand le salarié part : l'équipe reste à ${r.effectif}. Le recrutement coûte autant, mais le salaire du trimestre est versé : c'est la marge des ventes servies qui doit le payer.`,
          },
          {
            texte: `Au trimestre ${TRIMESTRE_DU_RECRUTEMENT}, le jour du départ : le remplaçant arrive dès qu'on le recrute`,
            juste: false,
            retour: `Non : c'est ce que le gérant a fait, et le poste est resté vide tout le trimestre ${r.trimestreVide}. Un remplaçant recruté n'arrive qu'au trimestre suivant.`,
          },
          {
            texte: "Peu importe la date : un poste vide ne fait qu'économiser un salaire",
            juste: false,
            retour: `Non : un poste vide fait aussi perdre des ventes quand l'équipe est le facteur qui limite l'activité. Ici, ${r.margePerdueEnsuite !== 0 ? `${eur(r.margePerdueTotale)} de marge sur l'année` : `${eur(r.margePerdue)} de marge en un trimestre`}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["staff_turnover"],
      texte: (c) => {
        const r = departDUnSalarie(c);
        return [
          `Chez ${c.entreprise}, le départ remplacé au trimestre ${TRIMESTRE_DU_RECRUTEMENT} coûte ${eur(r.coutDuDepart)} : ${eur(r.margePerdue)} de marge perdue pendant que le poste est vide${r.margePerdueEnsuite !== 0 ? `, ${eur(r.margePerdueEnsuite)} ensuite` : ""}, plus ${eur(r.recrutement)} de recrutement, moins ${eur(r.salaireNonVerse)} de salaire non versé. La baisse de salaire qui l'a provoqué avait fait économiser ${eur(r.economie)}.`,
          "Le coût d'un départ se compte en entier : le recrutement, mais aussi ce que l'équipe ne peut plus faire pendant que le poste est vide, parce qu'un remplaçant met du temps à arriver. Il se compare à ce qu'aurait coûté le salaire du marché. Et l'arène ne compte pas tout : l'intégration du remplaçant, le savoir-faire qui part avec le salarié.",
        ];
      },
      repere: () => "Coût d'un départ = marge perdue pendant la vacance et ensuite + coût du recrutement − salaires non versés.",
    },
  ],
};
