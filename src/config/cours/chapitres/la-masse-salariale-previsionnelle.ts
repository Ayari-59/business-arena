import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { MOIS_DE_L_EXERCICE } from "../monde/exercice-de-nova";
import {
  ARRIVEE_DU_CINQUIEME,
  DEPART,
  EFFECTIF_DE_DECEMBRE_N,
  ENVELOPPE_DE_L_EFFET_DE_MASSE,
  HAUSSES_DE_N_PLUS_1,
  NIVEAU_DEMANDE,
  PROMOTION,
  REALISE_DE_N_PLUS_1,
  SALAIRE_DE_DECEMBRE_N,
  SALAIRE_D_EMBAUCHE,
  budgetDeLaMasse,
  ecartsDeLaMasse,
  effetsDesHausses,
  laboratoireDesHausses,
  masseAEffectifConstant,
  masseBruteDeN,
  plusBasSalaireDeLAnnee,
  premierMoisDansLEnveloppe,
  salaireHoraire,
  type SalarieDuBudget,
} from "../monde/masse-salariale-de-nova";
import { FICHE_RH, HEURES_LEGALES_PAR_MOIS, SMIC_HORAIRE_BRUT, TAUX_PATRONAL } from "../monde/ressources-humaines-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA MASSE SALARIALE PRÉVISIONNELLE ET SES ÉCARTS (contrôle de gestion, palier 4 ;
 * DCG UE11 2025, 3.2 : les prévisions de ressources humaines, la masse salariale, prévisions et
 * écarts ; DSCG UE3 2.6 : les indices, les effets de niveau, de masse et de report, l'effet de noria).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/masse-salariale-de-nova.ts) : l'équipe de décembre N
 * est celle de la paie du cours, quatre opérateurs à 1 875 € bruts pour 151,67 heures ; la direction
 * prépare le budget de la masse salariale de N + 1, puis le compare à ce qui s'est passé.
 *
 * La matière vient du cours du propriétaire (chapitre 11, « Le contrôle budgétaire de la masse
 * salariale ») : le calcul par les indices en base 100 de décembre, la masse de l'effectif stable,
 * des sortants et des entrants, les trois effets et leur relation, le GVT et la noria, puis l'écart
 * sur masse salariale décomposé en écart sur effectif total, écart de structure et écart sur taux
 * nominal. Les chiffres sont ceux de NOVA.
 *
 * LES TROIS TEMPS :
 *   · guidé : les-indices, l-effet-de-report (la formule est dans la question, avec les chiffres) ;
 *   · l'expérience avant la formule : predire-la-date avant le curseur la-date-de-la-seconde-hausse
 *     (le mois qui fait tenir l'enveloppe), predire-la-variation avant la décomposition, et le
 *     laboratoire des hausses (taux de janvier, mois et taux de la seconde), avec le graphique des
 *     effets de masse et de report selon le mois ;
 *   · autonome : le-budget-de-n-plus-1 et les-effets-de-la-variation sont des tableaux à compléter,
 *     le-controle-de-la-masse un calcul d'écarts sans formule ;
 *   · expert : lire-les-ecarts et la-note-a-la-direction, puis la synthèse.
 */

/** Le chapitre se calcule sur l'équipe de NOVA. */
export const ENTREPRISES_DE_LA_MASSE_SALARIALE: readonly string[] = ["nova"];

/** Les leviers du laboratoire : la hausse de janvier et la seconde, en pour cent, et le mois de la seconde. */
export const LEVIERS_DES_HAUSSES = {
  janvier: { min: 0, max: 4, pas: 0.5 },
  mois: { min: 2, max: 12, pas: 1 },
  seconde: { min: 0, max: 4, pas: 0.5 },
} as const;

/** Le départ du laboratoire : une seule hausse de 4 % au 1er janvier, ce que demandent les opérateurs. */
export const DEPART_DU_LABORATOIRE = { janvier: 4, mois: 10, seconde: 0 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
/** Un taux en pour cent, au centième : « 2,51 % ». */
const pct = (t: number) => `${(Math.round(t * 1e4) / 100 + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
/** Un coefficient au dix-millième : « 1,0251 ». */
const coef = (k: number) => (Math.round(k * 1e4) / 1e4).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;
const nomDuMois = (m: number) => MOIS_DE_L_EXERCICE[m - 1]!;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const lePremier = (m: number) => `le 1er ${nomDuMois(m)}`;
const par = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function masseDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const effets = effetsDesHausses();
  const budget = budgetDeLaMasse();
  const ecarts = ecartsDeLaMasse();
  const deN = masseBruteDeN();
  const constant = masseAEffectifConstant();
  const [h1, h2] = HAUSSES_DE_N_PLUS_1 as readonly [(typeof HAUSSES_DE_N_PLUS_1)[number], (typeof HAUSSES_DE_N_PLUS_1)[number]];
  const plafond = auCentime(deN * (1 + ENVELOPPE_DE_L_EFFET_DE_MASSE));
  const juillet = laboratoireDesHausses(h1.taux, 7, h2.taux);
  const plusBas = plusBasSalaireDeLAnnee();
  return {
    effets,
    budget,
    ecarts,
    deN,
    constant,
    h1,
    h2,
    plafond,
    juillet,
    premierMois: premierMoisDansLEnveloppe()!,
    /** La masse de N + 2 de l'équipe de décembre N, sans hausse en N + 2 : 12 × le salaire de décembre N + 1. */
    masseDeNPlus2: auCentime(EFFECTIF_DE_DECEMBRE_N * SALAIRE_DE_DECEMBRE_N * 12 * effets.niveau),
    salaireDeJanvier: auCentime(SALAIRE_DE_DECEMBRE_N * (1 + h1.taux)),
    salaireDeDecembre: auCentime(SALAIRE_DE_DECEMBRE_N * effets.niveau),
    marche: FICHE_RH.personnel.salaireDuMarche.nPlus1,
    seuil: FICHE_RH.personnel.seuilDeDemission,
    plusBas,
    horaire: salaireHoraire(plusBas),
    ligne: (code: SalarieDuBudget["code"]) => budget.salaries.find((s) => s.code === code)!,
  };
}

/** Les salaires d'une ligne, dits par périodes : « 1 912,50 € de janvier à septembre, 1 950,75 € d'octobre à décembre ». */
export function periodesDe(s: SalarieDuBudget): string {
  const morceaux: { de: number; a: number; salaire: number }[] = [];
  s.salaires.forEach((v, i) => {
    if (v === 0) return;
    const der = morceaux.at(-1);
    if (der && der.salaire === v && der.a === i) der.a = i + 1;
    else morceaux.push({ de: i + 1, a: i + 1, salaire: v });
  });
  return morceaux.map((m) => (m.de === m.a ? `${eur(m.salaire)} en ${nomDuMois(m.de)}` : `${eur(m.salaire)} ${dE(nomDuMois(m.de))} à ${nomDuMois(m.a)}`)).join(", ");
}

/** L'équipe et la politique de N + 1 : ce que l'élève a sous les yeux. */
export function tableauDeLaPolitique(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = masseDuChapitre(c);
  return {
    titre: "L'équipe de décembre N et la politique salariale de N + 1",
    colonnes: ["Ce que prévoit la direction"],
    lignes: [
      { libelle: "Équipe de décembre N", valeurs: [`${qte(EFFECTIF_DE_DECEMBRE_N)} opérateurs à ${eur(SALAIRE_DE_DECEMBRE_N)} bruts pour ${qte(HEURES_LEGALES_PAR_MOIS)} heures, aucune hausse en N`] },
      { libelle: "Hausses générales", valeurs: [`${pct(x.h1.taux)} ${lePremier(x.h1.mois)}, ${pct(x.h2.taux)} ${lePremier(x.h2.mois)}`] },
      { libelle: "Promotion", valeurs: [`Un opérateur devient ${PROMOTION.poste} ${lePremier(PROMOTION.mois)}, à ${eur(PROMOTION.salaire)}`] },
      { libelle: "Départ", valeurs: [`Un opérateur a annoncé son départ : il part le 31 ${nomDuMois(DEPART.dernierMois)}, son remplaçant arrive ${lePremier(DEPART.arriveeDuRemplacant)}`] },
      { libelle: "Embauche", valeurs: [`Un cinquième opérateur arrive ${lePremier(ARRIVEE_DU_CINQUIEME)}`] },
      { libelle: "Salaire d'embauche", valeurs: [`${eur(SALAIRE_D_EMBAUCHE)}, ${qte(x.seuil * 100)} % du marché (${eur(x.marche)})`] },
      { libelle: "Cotisations patronales", valeurs: [`${qte(TAUX_PATRONAL * 100)} % du brut`] },
    ],
  };
}

/** Les salaires de N + 1, ligne par ligne : ce que le budget additionne. */
export function tableauDesSalaires(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = masseDuChapitre(c);
  return {
    titre: "Les salaires bruts mensuels de N + 1, par salarié",
    colonnes: ["Salaire de chaque mois payé"],
    lignes: x.budget.salaries.map((s) => ({ libelle: s.nombre > 1 ? `${s.libelle} (${qte(s.nombre)})` : s.libelle, valeurs: [periodesDe(s)] })),
  };
}

const donnee = (valeur: number, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, ...autres });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Une position du laboratoire, lue : les hausses en pour cent. */
export const laboratoireDuChapitre = (p: Readonly<Record<string, number>>) => laboratoireDesHausses(p.janvier! / 100, p.mois!, p.seconde! / 100);

/** Le défi : l'équipe gardée dès janvier, au moins 4 % sur l'année, et l'effet de masse dans l'enveloppe. */
export function defiDesHaussesAtteint(p: Readonly<Record<string, number>>) {
  const r = laboratoireDuChapitre(p);
  return r.gardeLEquipe && r.niveau >= 1 + NIVEAU_DEMANDE - 1e-9 && r.masse <= 1 + ENVELOPPE_DE_L_EFFET_DE_MASSE + 1e-9;
}

export const LA_MASSE_SALARIALE_PREVISIONNELLE: Chapitre = {
  code: "la-masse-salariale-previsionnelle",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "La masse salariale prévisionnelle et ses écarts",
  accroche:
    "NOVA prépare le budget de son équipe pour N + 1 : deux hausses, une promotion, un départ, une embauche. Combien coûtera l'année, et pourquoi ? Puis l'année passe : d'où vient l'écart entre la masse prévue et la masse réelle ?",
  objectifs: [
    "Calculer l'effet de niveau, l'effet de masse et l'effet de report d'une politique salariale, et les relier",
    "Choisir le calendrier des hausses qui tient une enveloppe de masse salariale",
    "Construire la masse salariale prévisionnelle à partir des salariés stables, sortants et entrants",
    "Décomposer la variation de la masse salariale en hausses générales, GVT, noria et effectif",
    "Analyser l'écart entre masse prévue et masse réelle en écarts sur effectif, de structure et sur salaire",
  ],
  libre: false,
  prerequis: ["la-paie", "effectif-et-masse-salariale", "analyse-des-ecarts"],
  ensuite: ["indicateurs-sociaux"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_MASSE_SALARIALE,
    pourquoi: "la masse salariale se calcule ici sur l'équipe de NOVA dans la simulation du cours, celle de la paie ; la méthode vaut pour toute équipe.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le budget de l'équipe",
      notions: ["payroll", "pay_and_motivation"],
      tableau: tableauDeLaPolitique,
      texte: (c) => {
        const x = masseDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez NOVA, en décembre N. L'équipe est celle de la paie : ${qte(EFFECTIF_DE_DECEMBRE_N)} opérateurs à ${eur(SALAIRE_DE_DECEMBRE_N)} bruts par mois. En N, NOVA n'a accordé aucune hausse : la masse brute de l'année fait ${eur(x.deN)}, la masse chargée ${eur(x.budget.chargeeDeN)}.`,
          `Pour N + 1, le marché paie un opérateur ${eur(x.marche)}. Sous ${qte(x.seuil * 100)} % de ce salaire, soit ${eur(SALAIRE_D_EMBAUCHE)}, un opérateur part. La direction prévoit donc une hausse dès janvier, une seconde en octobre, une promotion, un départ remplacé et une embauche.`,
          "Vous mesurerez d'abord ce que coûtent les hausses, et quand elles coûtent. Puis vous bâtirez le budget de N + 1, salarié par salarié, et le comparerez à ce qui s'est passé.",
        ];
      },
      repere: () =>
        "Masse salariale brute = somme des salaires bruts versés sur la période. Masse chargée = masse brute × (1 + taux des cotisations patronales). Les hausses se suivent en indices, base 100 au salaire de décembre de l'année d'avant.",
    },
    {
      id: "les-indices",
      objectifs: [0],
      type: "montants",
      titre: "Les indices de N + 1",
      notions: ["payroll"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `Base 100 au salaire de décembre N. Après la hausse de ${pct(x.h1.taux)} ${lePremier(x.h1.mois)}, l'indice passe à ${qte(x.effets.indices[0]!)} ; après celle de ${pct(x.h2.taux)} ${lePremier(x.h2.mois)}, il passe à ${qte(x.effets.indices[11]!)}. Calculez l'effet de niveau (décembre N + 1 ÷ décembre N), la somme des douze indices de l'année, puis l'effet de masse (somme ÷ 1 200).`;
      },
      champs: (c) => {
        const x = masseDuChapitre(c);
        const e = x.effets;
        const avant = x.h2.mois - 1;
        return [
          { libelle: "Effet de niveau (%)", attendu: auCentieme((e.niveau - 1) * 100), tolerance: 0.01, calcul: `${qte(e.decembre)} ÷ 100 = ${coef(e.niveau)}, soit +${pct(e.niveau - 1)} (${coef(1 + x.h1.taux)} × ${coef(1 + x.h2.taux)})` },
          { libelle: "Somme des douze indices", attendu: e.cumul, tolerance: 0.01, calcul: `${qte(avant)} × ${qte(e.indices[0]!)} + ${qte(12 - avant)} × ${qte(e.decembre)} = ${qte(e.cumul)}` },
          { libelle: "Effet de masse (%)", attendu: auCentieme((e.masse - 1) * 100), tolerance: 0.01, calcul: `${qte(e.cumul)} ÷ 1 200 = ${coef(e.masse)}, soit +${pct(e.masse - 1)}` },
        ];
      },
      explication: (c) => {
        const x = masseDuChapitre(c);
        const e = x.effets;
        return [
          `Un opérateur gagne ${pct(e.niveau - 1)} de plus en décembre N + 1 qu'en décembre N : c'est l'effet de niveau. Mais la masse de l'année ne monte que de ${pct(e.masse - 1)} : la seconde hausse ne joue que sur ${qte(12 - x.h2.mois + 1)} mois.`,
          `À effectif constant, l'équipe de décembre N coûterait ${eur(x.constant)} bruts en N + 1 : ${eur(x.deN)} × ${coef(e.masse)}. L'effet de niveau ne dépend pas des dates des hausses ; l'effet de masse, si.`,
        ];
      },
    },
    {
      id: "predire-la-date",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur la date",
      notions: ["payroll"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `Avant de calculer, pariez. La direction garde ses deux hausses de ${pct(x.h2.taux)}, mais avance la seconde ${dE(nomDuMois(x.h2.mois))} à juillet. L'effet de masse de N + 1…`;
      },
      options: (c) => {
        const x = masseDuChapitre(c);
        const voir = "Faites glisser le mois de la seconde hausse à l'étape suivante.";
        return [
          { texte: "Monterait", juste: x.juillet.masse > x.effets.masse, retour: `Bon pari. ${voir}` },
          { texte: "Ne bougerait pas : les taux sont les mêmes", juste: Math.abs(x.juillet.masse - x.effets.masse) < 1e-9, retour: `Pari à vérifier. ${voir}` },
          { texte: "Baisserait : la hausse serait plus courte", juste: x.juillet.masse < x.effets.masse, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-date-de-la-seconde-hausse",
      objectifs: [1],
      type: "curseur",
      titre: "La date de la seconde hausse, au curseur",
      notions: ["payroll"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `La direction accepte que les hausses fassent monter la masse de l'équipe de ${pct(ENVELOPPE_DE_L_EFFET_DE_MASSE)} au plus sur N + 1, soit ${eur(x.plafond)} bruts. La hausse de janvier reste. Faites glisser le mois de la seconde hausse, de février à décembre, et placez le curseur sur le premier mois où la masse tient dans l'enveloppe.`;
      },
      grandeur: () => ({ libelle: "Numéro du mois de la seconde hausse (10 : octobre)", unite: "" }),
      cible: (c) => ({ attendu: masseDuChapitre(c).premierMois, min: 2, max: 12 }),
      zones: ["La masse tient dans l'enveloppe", "La masse dépasse l'enveloppe"],
      rates: () => ({
        dessous: "À ce mois, la masse de l'équipe dépasse encore l'enveloppe.",
        dessus: "Plus tôt, la masse tient encore dans l'enveloppe : cherchez le premier mois possible.",
      }),
      montrer: "Montrer le premier mois possible",
      lecture: (c, m) => {
        const x = masseDuChapitre(c);
        const r = laboratoireDesHausses(x.h1.taux, m, x.h2.taux);
        return [
          { libelle: "Masse brute de l'équipe en N + 1", montant: r.masseBrute },
          { libelle: "Enveloppe de la direction", montant: x.plafond },
          { libelle: "Marge restante dans l'enveloppe", montant: auCentime(x.plafond - r.masseBrute), fort: true },
        ];
      },
      droites: (c) => {
        const x = masseDuChapitre(c);
        return { produit: () => x.plafond, cout: (m) => laboratoireDesHausses(x.h1.taux, m, x.h2.taux).masseBrute, libelles: ["Enveloppe de la direction", "Masse brute de l'équipe"] };
      },
      explication: (c) => {
        const x = masseDuChapitre(c);
        const m = x.premierMois;
        const r = laboratoireDesHausses(x.h1.taux, m, x.h2.taux);
        const avant = laboratoireDesHausses(x.h1.taux, m - 1, x.h2.taux);
        return [
          `La seconde hausse tient dans l'enveloppe à partir ${dE(nomDuMois(m))} : ${eur(r.masseBrute)}, contre ${eur(avant.masseBrute)} un mois plus tôt. Chaque mois d'avance coûte ${eur(auCentime(avant.masseBrute - r.masseBrute))} bruts à l'équipe.`,
          `Le décembre N + 1 est le même quel que soit le mois : ${eur(x.salaireDeDecembre)}. Retarder une hausse ne change pas l'effet de niveau ; il baisse l'effet de masse de l'année, et reporte la dépense sur la suivante.`,
        ];
      },
    },
    {
      id: "l-effet-de-report",
      objectifs: [0],
      type: "montants",
      titre: "L'effet de report sur N + 2",
      notions: ["payroll"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `Supposez qu'aucune hausse ne soit accordée en N + 2. Calculez la masse brute de N + 2 de l'équipe de décembre N (${qte(EFFECTIF_DE_DECEMBRE_N)} opérateurs à ${eur(x.salaireDeDecembre)}, 12 mois), puis l'effet de report de N + 1 sur N + 2 (12 × indice de décembre ÷ somme des indices). Vérifiez enfin que l'effet de niveau est le produit de l'effet de masse et de l'effet de report.`;
      },
      champs: (c) => {
        const x = masseDuChapitre(c);
        const e = x.effets;
        return [
          { libelle: "Masse brute de N + 2, sans hausse", attendu: x.masseDeNPlus2, calcul: `${qte(EFFECTIF_DE_DECEMBRE_N)} × ${eur(x.salaireDeDecembre)} × 12 = ${eur(x.masseDeNPlus2)}` },
          { libelle: "Effet de report sur N + 2 (%)", attendu: auCentieme((e.report - 1) * 100), tolerance: 0.01, calcul: `12 × ${qte(e.decembre)} ÷ ${qte(e.cumul)} = ${coef(e.report)}, soit +${pct(e.report - 1)} (ou ${eur(x.masseDeNPlus2)} ÷ ${eur(x.constant)})` },
          { libelle: "Effet de masse × effet de report", attendu: Math.round(e.masse * e.report * 1e4) / 1e4, tolerance: 0.0001, calcul: `${coef(e.masse)} × ${coef(e.report)} = ${coef(e.masse * e.report)}, l'effet de niveau` },
        ];
      },
      explication: (c) => {
        const x = masseDuChapitre(c);
        const e = x.effets;
        return [
          `Même sans aucune hausse en N + 2, la masse de l'équipe montera de ${pct(e.report - 1)} : les hausses de N + 1 joueront sur 12 mois au lieu d'une partie de l'année. Une hausse tardive coûte peu l'année où on l'accorde, et beaucoup l'année suivante.`,
          `En N, NOVA n'avait rien accordé : l'effet de report de N sur N + 1 est nul (${coef(1)}). Effet de niveau = effet de masse × effet de report : ${coef(e.niveau)} = ${coef(e.masse)} × ${coef(e.report)}.`,
        ];
      },
    },
    {
      id: "les-trois-effets",
      objectifs: [0],
      type: "choix",
      titre: "Ce que mesure chaque effet",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `Un délégué des opérateurs compare les ${pct(x.effets.niveau - 1)} de l'effet de niveau aux ${pct(x.effets.masse - 1)} de l'effet de masse et dit : « La direction annonce plus qu'elle ne paie. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = masseDuChapitre(c);
        return [
          {
            texte: "Les deux sont vrais : le niveau dit le salaire, la masse l'année",
            juste: true,
            retour: `Oui. L'effet de niveau dit de combien le salaire de décembre a monté ; l'effet de masse, ce que l'année a coûté de plus, selon les dates. La différence n'est pas perdue : c'est l'effet de report, ${pct(x.effets.report - 1)}, que l'équipe touchera en N + 2.`,
          },
          {
            texte: "Il a raison : seul l'effet de masse dit ce que gagnent les opérateurs",
            juste: false,
            retour: `Non : dès octobre, chaque opérateur touche ${eur(x.salaireDeDecembre)}, soit ${pct(x.effets.niveau - 1)} de plus qu'en décembre N. L'effet de masse mesure le coût de l'année, pas le salaire.`,
          },
          {
            texte: "Il se trompe : les deux effets valent la même chose sur deux ans",
            juste: false,
            retour: "Non : ils ne s'additionnent pas, ils se multiplient, et n'ont pas le même objet. Le niveau compare deux salaires de décembre ; la masse compare deux années.",
          },
        ];
      },
    },
    {
      id: "le-laboratoire-des-hausses",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des hausses",
      notions: ["payroll", "pay_and_motivation"],
      question: () =>
        "Faites varier la hausse de janvier, le mois et le taux de la seconde : le tableau suit les trois effets, la masse de l'équipe et son salaire de janvier. Relevez le défi, puis cherchez ce que la date change, et ce qu'elle ne change pas.",
      leviers: () => {
        const L = LEVIERS_DES_HAUSSES;
        const d = DEPART_DU_LABORATOIRE;
        return [
          { code: "janvier", libelle: "Hausse du 1er janvier", unite: "%", ...L.janvier, depart: d.janvier },
          { code: "mois", libelle: "Numéro du mois de la seconde hausse", unite: "", ...L.mois, depart: d.mois },
          { code: "seconde", libelle: "Seconde hausse", unite: "%", ...L.seconde, depart: d.seconde },
        ];
      },
      lecture: (_c, p) => {
        const r = laboratoireDuChapitre(p);
        const d = laboratoireDuChapitre(DEPART_DU_LABORATOIRE);
        return [
          { libelle: "Salaire de janvier d'un opérateur", montant: r.salaireDeJanvier, reference: d.salaireDeJanvier },
          { libelle: "Effet de niveau", montant: auCentieme((r.niveau - 1) * 100), unite: "%", reference: auCentieme((d.niveau - 1) * 100) },
          { libelle: "Effet de masse", montant: auCentieme((r.masse - 1) * 100), unite: "%", reference: auCentieme((d.masse - 1) * 100) },
          { libelle: "Effet de report sur N + 2", montant: auCentieme((r.report - 1) * 100), unite: "%", reference: auCentieme((d.report - 1) * 100) },
          { libelle: "Masse brute de l'équipe en N + 1", montant: r.masseBrute, reference: d.masseBrute, fort: true },
        ];
      },
      // La date de la seconde hausse fait baisser l'effet de masse et monter l'effet de report : les deux courbes se croisent.
      graphique: () => ({
        levier: "mois",
        unite: "%",
        courbes: [
          { libelle: "Effet de masse", valeur: (p) => auCentieme((laboratoireDuChapitre(p).masse - 1) * 100) },
          { libelle: "Effet de report sur N + 2", valeur: (p) => auCentieme((laboratoireDuChapitre(p).report - 1) * 100) },
        ],
      }),
      defi: (c) => {
        const x = masseDuChapitre(c);
        return {
          consigne: `Gardez l'équipe dès janvier (au moins ${eur(SALAIRE_D_EMBAUCHE)}), accordez au moins ${pct(NIVEAU_DEMANDE)} sur l'année, et tenez l'effet de masse sous ${pct(ENVELOPPE_DE_L_EFFET_DE_MASSE)}.`,
          atteint: (p) => defiDesHaussesAtteint(p),
          indice: (p) => {
            const r = laboratoireDuChapitre(p);
            if (!r.gardeLEquipe) return `En janvier, un opérateur touche ${eur(r.salaireDeJanvier)}, sous les ${eur(SALAIRE_D_EMBAUCHE)} du marché : il partirait.`;
            if (r.niveau < 1 + NIVEAU_DEMANDE - 1e-9) return `L'effet de niveau n'est que de ${pct(r.niveau - 1)} : les opérateurs demandent ${pct(NIVEAU_DEMANDE)}.`;
            return `L'effet de masse atteint ${pct(r.masse - 1)} : avancez moins la seconde hausse, ou mettez moins en janvier.`;
          },
          solution: { janvier: x.h1.taux * 100, mois: x.h2.mois, seconde: x.h2.taux * 100 },
        };
      },
      explication: (_c, p) => {
        const r = laboratoireDuChapitre(p);
        return [
          `Défi relevé : ${qte(p.janvier!)} % en janvier, ${qte(p.seconde!)} % ${lePremier(p.mois!)}. L'effet de niveau fait ${pct(r.niveau - 1)}, l'effet de masse ${pct(r.masse - 1)}, et ${pct(r.report - 1)} restent pour N + 2.`,
          "Glissez le mois : l'effet de niveau ne bouge pas, l'effet de masse baisse et l'effet de report monte. Ce que l'année n'a pas payé, la suivante le paiera. Une politique salariale se juge donc sur deux ans.",
        ];
      },
    },
    {
      id: "le-budget-de-n-plus-1",
      objectifs: [2],
      type: "a-completer",
      titre: "Le budget de N + 1, salarié par salarié",
      notions: ["payroll"],
      tableau: tableauDesSalaires,
      question: () =>
        "À vous, sans formule : remplissez, ligne par ligne, la masse brute de N + 1 (les salaires de chaque mois payé) et la masse chargée (cotisations patronales de 42 % comprises), puis les totaux. Le promu garde sa hausse de janvier jusqu'à sa promotion ; une recrue ne reçoit que les hausses qui suivent son arrivée.",
      grille: (c) => {
        const x = masseDuChapitre(c);
        const b = x.budget;
        const chargees = b.salaries.map((s) => auCentime(s.masse * (1 + TAUX_PATRONAL)));
        const n = b.salaries.length;
        return {
          titre: "La masse salariale prévisionnelle de N + 1 · NOVA",
          colonnes: ["Mois payés", "Masse brute", "Masse chargée"],
          lignes: [
            ...b.salaries.map((s, i) => ({
              libelle: s.nombre > 1 ? `${s.libelle} (${qte(s.nombre)})` : s.libelle,
              cellules: [
                donnee(s.moisPayes, { unite: "mois" }),
                aSaisir(s.masse, s.nombre > 1 ? `${qte(s.nombre)} × (${periodesDe(s)}) = ${eur(s.masse)}` : `${periodesDe(s)} : ${eur(s.masse)}`, { indice: "la somme des salaires de chaque mois payé" }),
                aSaisir(chargees[i]!, `${eur(s.masse)} × 1,42 = ${eur(chargees[i]!)}`, { indice: "la masse brute, cotisations patronales comprises" }),
              ],
            })),
            {
              libelle: "L'équipe de N + 1",
              fort: true,
              totalDe: { plus: Array.from({ length: n }, (_, i) => i) },
              cellules: [
                donnee(b.mois, { unite: "mois" }),
                aSaisir(b.brute, `${b.salaries.map((s) => eur(s.masse)).join(" + ")} = ${eur(b.brute)}`),
                aSaisir(auCentime(chargees.reduce((t, v) => t + v, 0)), `${eur(b.brute)} × 1,42 = ${eur(b.chargee)}`),
              ],
            },
          ],
        };
      },
      explication: (c) => {
        const x = masseDuChapitre(c);
        const b = x.budget;
        return [
          `La masse brute de N + 1 fait ${eur(b.brute)}, contre ${eur(b.deN)} en N : ${eur(b.variation)} de plus, soit +${pct(b.variationRelative)}. La masse chargée passe de ${eur(b.chargeeDeN)} à ${eur(b.chargee)}.`,
          `C'est la méthode des effectifs : les stables toute l'année, le sortant jusqu'à son départ, les entrants depuis leur arrivée. Chacun porte les hausses qui le concernent, et pas les autres.`,
        ];
      },
    },
    {
      id: "le-smic",
      objectifs: [2],
      type: "montants",
      titre: "Le plus bas salaire et le SMIC",
      notions: ["payroll"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `Avant de valider un budget, le contrôleur vérifie qu'aucun salaire ne descend sous le SMIC, ${qte(SMIC_HORAIRE_BRUT)} € bruts de l'heure. Le plus bas salaire de l'année est celui d'une recrue, ${eur(x.plusBas)} pour ${qte(HEURES_LEGALES_PAR_MOIS)} heures. Calculez son salaire horaire brut, au centime, puis son écart au SMIC.`;
      },
      champs: (c) => {
        const x = masseDuChapitre(c);
        const h = x.horaire;
        return [
          { libelle: "Salaire horaire brut d'une recrue", attendu: h.auCentime, calcul: `${eur(x.plusBas)} ÷ ${qte(HEURES_LEGALES_PAR_MOIS)} = ${qte(h.horaire, 4)} €, au centime ${eur(h.auCentime)}` },
          { libelle: "Écart au SMIC horaire", attendu: auCentime(h.auCentime - SMIC_HORAIRE_BRUT), calcul: `${eur(h.auCentime)} − ${eur(SMIC_HORAIRE_BRUT)} = ${eur(auCentime(h.auCentime - SMIC_HORAIRE_BRUT))}` },
        ];
      },
      explication: (c) => {
        const x = masseDuChapitre(c);
        const de = salaireHoraire(SALAIRE_DE_DECEMBRE_N);
        return [
          `La recrue gagne ${eur(x.horaire.auCentime)} de l'heure, au-dessus du SMIC. Les opérateurs de N, à ${eur(de.auCentime)} de l'heure, l'étaient de peu : une revalorisation du SMIC peut, à elle seule, imposer une hausse et changer le budget.`,
          "Le SMIC se lit à l'heure : un salaire mensuel se compare au SMIC pour la même durée de travail, ici la durée légale.",
        ];
      },
    },
    {
      id: "predire-la-variation",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la cause",
      notions: ["payroll", "staff_turnover"],
      question: (c) => {
        const b = masseDuChapitre(c).budget;
        return `Avant de décomposer, pariez. La masse brute monte de ${eur(b.variation)}. Quelle part de cette hausse vient des deux hausses générales ?`;
      },
      options: (c) => {
        const b = masseDuChapitre(c).budget;
        const part = b.effets.generales / b.variation;
        const voir = "Le tableau de l'étape suivante range la hausse effet par effet.";
        return [
          { texte: "Moins d'un quart", juste: part < 0.25, retour: `Bon pari. ${voir}` },
          { texte: "La moitié environ", juste: part >= 0.25 && part < 0.75, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus des trois quarts : ce sont les hausses", juste: part >= 0.75, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-effets-de-la-variation",
      objectifs: [3],
      type: "a-completer",
      titre: "D'où vient la hausse de la masse",
      notions: ["payroll", "staff_turnover"],
      question: (c) => {
        const x = masseDuChapitre(c);
        return `À vous : rangez la hausse de la masse brute effet par effet. Les hausses générales se mesurent sur l'équipe de décembre N gardée toute l'année. Le GVT est ce que la promotion ajoute au salaire d'un stable ; la noria, ce que le remplaçant coûte de moins que le sortant depuis son arrivée. L'effectif, c'est le cinquième opérateur moins les mois où personne n'occupe le poste du sortant (${nomDuMois(DEPART.dernierMois + 1)} et ${nomDuMois(DEPART.arriveeDuRemplacant - 1)}). Un stable coûte ${eur(auCentime(x.constant / EFFECTIF_DE_DECEMBRE_N))} sur l'année.`;
      },
      grille: (c) => {
        const x = masseDuChapitre(c);
        const b = x.budget;
        const e = b.effets;
        const unStable = auCentime(x.constant / EFFECTIF_DE_DECEMBRE_N);
        return {
          titre: "La variation de la masse brute de N à N + 1 · NOVA",
          colonnes: ["Effet sur la masse brute"],
          lignes: [
            { libelle: "Hausses générales (à effectif constant)", cellules: [aSaisir(e.generales, `${eur(x.constant)} − ${eur(x.deN)} = ${eur(e.generales)}`, { indice: "l'équipe de décembre N aux salaires de N + 1, moins N" })] },
            { libelle: "GVT : la promotion (technicité)", cellules: [aSaisir(e.gvt, `${eur(x.ligne("promu").masse)} − ${eur(unStable)} = ${eur(e.gvt)}`, { indice: "le promu moins un stable" })] },
            { libelle: "Noria : le remplaçant face au sortant", cellules: [aSaisir(e.noria, `${eur(x.ligne("remplacant").masse)} − ${eur(e.sortantAuxMoisDuRemplacant)} = ${eur(e.noria)}`, { indice: "le remplaçant moins ce qu'aurait gagné le sortant les mêmes mois : négatif s'il coûte moins" })] },
            { libelle: "Effectif : l'embauche et le poste vide", cellules: [aSaisir(e.effectif, `${eur(x.ligne("cinquieme").masse)} − ${eur(e.vacance)} = ${eur(e.effectif)}`, { indice: "le cinquième opérateur moins les mois sans personne au poste" })] },
            { libelle: "Variation de la masse brute", fort: true, totalDe: { plus: [0, 1, 2, 3] }, cellules: [aSaisir(b.variation, `${eur(b.brute)} − ${eur(b.deN)} = ${eur(b.variation)}`)] },
          ],
        };
      },
      explication: (c) => {
        const b = masseDuChapitre(c).budget;
        const e = b.effets;
        return [
          `Les hausses générales ne font que ${eur(e.generales)} des ${eur(b.variation)} : l'essentiel vient de l'effectif, ${eur(e.effectif)}, un salarié de plus pendant ${qte(12 - ARRIVEE_DU_CINQUIEME + 1)} mois. Le GVT ajoute ${eur(e.gvt)} ; la noria retire ${eur(-e.noria)}.`,
          "Une masse salariale qui monte ne dit donc pas que les salaires montent : il faut séparer ce qui tient aux salaires, à l'effectif et à la structure de l'équipe.",
        ];
      },
    },
    {
      id: "noria-et-gvt",
      objectifs: [3],
      type: "choix",
      titre: "La noria et le GVT",
      notions: ["staff_turnover", "pay_and_motivation"],
      question: (c) => {
        const e = masseDuChapitre(c).budget.effets;
        return `L'effet de noria de NOVA n'est que de ${eur(e.noria)}. Pourquoi si peu, alors qu'un ancien part et qu'une recrue le remplace ?`;
      },
      options: (c) => {
        const x = masseDuChapitre(c);
        return [
          {
            texte: "Une recrue est payée presque comme un ancien",
            juste: true,
            retour: `Oui. La noria mesure l'économie du remplacement d'un ancien, mieux payé, par un nouveau. Chez NOVA, les anciens n'ont qu'un an de maison, et le marché impose ${eur(SALAIRE_D_EMBAUCHE)} à l'embauche, contre ${eur(x.salaireDeJanvier)} pour un ancien : l'écart est faible. Là où les sortants ont une longue ancienneté, la noria pèse lourd.`,
          },
          {
            texte: "Le poste reste vide avant l'arrivée du remplaçant",
            juste: false,
            retour: `Non : les mois vides sont un effet d'effectif, ${eur(-x.budget.effets.vacance)}, compté à part. La noria se calcule depuis l'arrivée du remplaçant.`,
          },
          {
            texte: "La promotion du chef d'équipe l'annule en partie",
            juste: false,
            retour: `Non : la promotion est un GVT (technicité), ${eur(x.budget.effets.gvt)}, compté à part. Les deux effets ne se compensent pas dans le calcul : chacun a sa ligne.`,
          },
        ];
      },
    },
    {
      id: "le-controle-de-la-masse",
      objectifs: [4],
      type: "montants",
      titre: "Le prévu face au réel",
      notions: ["payroll", "cost_variance"],
      tableau: (c) => {
        const e = masseDuChapitre(c).ecarts;
        const ligneDe = (nom: string, p: { mois: number; masse: number }, r: { mois: number; masse: number }) => ({ libelle: nom, valeurs: [qte(p.mois), eur(p.masse), qte(r.mois), eur(r.masse)] });
        return {
          titre: "La masse brute de N + 1, prévue et réelle · NOVA",
          colonnes: ["Mois prévus", "Masse prévue", "Mois réels", "Masse réelle"],
          lignes: [
            ligneDe("Les anciens (en poste fin N)", e.prevu.categories.anciens, e.reel.categories.anciens),
            ligneDe("Les recrues", e.prevu.categories.recrues, e.reel.categories.recrues),
            ligneDe("L'équipe", { mois: e.prevu.mois, masse: e.prevu.brute }, { mois: e.reel.mois, masse: e.reel.brute }),
          ],
        };
      },
      question: () =>
        `L'année N + 1 est passée. Le remplaçant est arrivé ${lePremier(REALISE_DE_N_PLUS_1.arriveeDuRemplacant)}, un mois plus tôt que prévu, et le cinquième opérateur a négocié ${eur(REALISE_DE_N_PLUS_1.salaireDuCinquieme)} à l'embauche. Sans formule : calculez l'écart total sur la masse brute, puis ses trois composantes, au centime. Sur effectif, au salaire moyen prévu ; de structure, aux salaires prévus de chaque catégorie ; sur salaire, aux mois réels.`,
      champs: (c) => {
        const e = masseDuChapitre(c).ecarts;
        const p = e.prevu.categories;
        const r = e.reel.categories;
        return [
          { libelle: "Écart total sur la masse brute", attendu: e.total, calcul: `${eur(e.reel.brute)} − ${eur(e.prevu.brute)} = ${eur(e.total)} (défavorable)` },
          { libelle: "Écart sur effectif", attendu: e.effectif, tolerance: 0.05, calcul: `(${qte(e.reel.mois)} − ${qte(e.prevu.mois)}) × ${eur(e.prevu.brute)} ÷ ${qte(e.prevu.mois)} = ${qte(e.reel.mois - e.prevu.mois)} × ${qte(e.prevu.moyen, 4)} € = ${eur(e.effectif)}` },
          { libelle: "Écart de structure", attendu: e.structure, tolerance: 0.05, calcul: `${qte(r.anciens.mois)} × ${qte(p.anciens.moyen, 4)} + ${qte(r.recrues.mois)} × ${qte(p.recrues.moyen, 4)} − ${qte(e.reel.mois)} × ${qte(e.prevu.moyen, 4)} = ${eur(e.aStructureReelle)} − ${eur(e.aSalaireMoyenPrevu)} = ${eur(e.structure)}` },
          { libelle: "Écart sur salaire", attendu: e.salaire, tolerance: 0.05, calcul: `les recrues : ${eur(r.recrues.masse)} − ${qte(r.recrues.mois)} × ${qte(p.recrues.moyen, 4)} = ${eur(e.salaireParCategorie.recrues)} ; les anciens : ${eur(e.salaireParCategorie.anciens)}` },
        ];
      },
      explication: (c) => {
        const e = masseDuChapitre(c).ecarts;
        return [
          `Vérification : ${eur(e.effectif)} + ${par(e.structure)} + ${eur(e.salaire)} = ${eur(e.total)}. Écart sur masse salariale = écart sur effectif + écart de structure + écart sur salaire.`,
          "Comme pour une charge directe, l'écart se lit en quantité (les mois payés), en composition (qui est payé) et en prix (combien chacun est payé).",
        ];
      },
    },
    {
      id: "lire-les-ecarts",
      objectifs: [4],
      type: "choix",
      titre: "Lire l'écart de structure",
      notions: ["cost_variance", "staff_turnover"],
      question: (c) => {
        const e = masseDuChapitre(c).ecarts;
        return `L'écart de structure est favorable, ${eur(e.structure)}, alors que l'équipe a coûté plus que prévu. D'où vient-il ?`;
      },
      options: (c) => {
        const e = masseDuChapitre(c).ecarts;
        return [
          {
            texte: "Du mois en plus payé à une recrue",
            juste: true,
            retour: `Oui. Le mois réel en plus est celui d'une recrue, payée en moyenne ${eur(auCentime(e.prevu.categories.recrues.moyen))} au prix prévu, sous la moyenne de l'équipe (${eur(auCentime(e.prevu.moyen))}). L'écart sur effectif compte ce mois au salaire moyen ; l'écart de structure corrige : c'était un mois moins cher. C'est la noria, vue dans le contrôle.`,
          },
          {
            texte: "Du salaire négocié par le cinquième opérateur",
            juste: false,
            retour: `Non : un salaire plus haut que prévu est un écart sur salaire, ${eur(e.salaire)}, défavorable. L'écart de structure se calcule aux salaires prévus.`,
          },
          {
            texte: "De la promotion du chef d'équipe, moins chère que prévu",
            juste: false,
            retour: `Non : les anciens ont été payés comme prévu, leur écart sur salaire est de ${eur(e.salaireParCategorie.anciens)}. La promotion était au budget.`,
          },
        ];
      },
    },
    {
      id: "la-note-a-la-direction",
      objectifs: [4],
      type: "choix",
      titre: "La note à la direction",
      notions: ["payroll", "cost_variance"],
      question: (c) => {
        const e = masseDuChapitre(c).ecarts;
        return `La direction s'inquiète : « ${eur(e.total)} de plus que le budget, les salaires dérapent. » Quelle phrase mettez-vous en tête de votre note ?`;
      },
      options: (c) => {
        const e = masseDuChapitre(c).ecarts;
        return [
          {
            texte: "L'écart tient d'abord à un mois de poste pourvu en plus",
            juste: true,
            retour: `Oui. L'écart sur effectif, ${eur(e.effectif)}, est le prix d'un remplacement plus rapide : le poste n'est pas resté vide en ${nomDuMois(REALISE_DE_N_PLUS_1.arriveeDuRemplacant)}, ce qui a évité de perdre des enceintes. Le seul dérapage de salaire est l'embauche du cinquième, ${eur(e.salaire)} : le marché, plus que la politique de NOVA.`,
          },
          {
            texte: "Les hausses générales ont été trop fortes, il faut les revoir en N + 2",
            juste: false,
            retour: `Non : les anciens ont été payés exactement comme prévu (écart sur salaire de ${eur(e.salaireParCategorie.anciens)}). Les hausses générales ne sont pour rien dans l'écart.`,
          },
          {
            texte: "L'écart est inférieur à 3 % du budget : il n'y a rien à expliquer à la direction",
            juste: false,
            retour: "Non : un écart faible peut cacher des écarts qui se compensent. Le contrôle sert à dire d'où il vient, pour savoir sur quoi agir.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payroll", "staff_turnover", "cost_variance"],
      texte: (c) => {
        const x = masseDuChapitre(c);
        const b = x.budget;
        return [
          `Vous avez mesuré la politique salariale de N + 1 en indices : un effet de niveau de ${pct(x.effets.niveau - 1)}, un effet de masse de ${pct(x.effets.masse - 1)}, un effet de report de ${pct(x.effets.report - 1)} sur N + 2. Vous avez choisi la date d'une hausse pour tenir une enveloppe.`,
          `Vous avez bâti le budget de N + 1, ${eur(b.brute)} bruts et ${eur(b.chargee)} chargés, salarié par salarié, et rangé sa hausse en effets : hausses générales, GVT, noria, effectif. Puis vous avez décomposé l'écart du réalisé, ${eur(x.ecarts.total)}, en écarts sur effectif, de structure et sur salaire.`,
          "Au niveau de l'examen, vous savez construire une masse salariale prévisionnelle à partir des effectifs, calculer les trois effets et leur relation, et analyser un écart sur masse salariale.",
          "Dans l'arène, les chiffres de votre équipe seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Effet de niveau = indice de décembre N + 1 ÷ indice de décembre N. Effet de masse = somme des indices de N + 1 ÷ (12 × 100). Effet de report = 12 × indice de décembre ÷ somme des indices. Niveau = masse × report. Écart sur masse salariale = écart sur effectif + écart de structure + écart sur salaire.",
    },
  ],
};
