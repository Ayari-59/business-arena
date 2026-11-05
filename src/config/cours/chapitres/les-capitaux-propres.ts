import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { PLAFOND_DE_LA_RESERVE_LEGALE } from "../monde/affectation-du-resultat";
import { RESERVE_LEGALE } from "../monde/comptabilite-approfondie";
import {
  ASSEMBLEE_DE_N_PLUS_1,
  CAPITAL_VISE,
  DELAI_DE_DECISION_EN_MOIS,
  DELAI_DE_LIBERATION_EN_ANS,
  DUREE_DES_FRAIS_D_ETABLISSEMENT,
  FACONS_D_AUGMENTER,
  INTERET_STATUTAIRE,
  LIBERATION_MINIMALE,
  PERTE_DU_CURSEUR_DE_PIXEL,
  TRESORERIE_VISEE,
  affectationDeNova,
  augmentation,
  augmentationDuLaboratoire,
  constitution,
  perteDePixel,
} from "../monde/capitaux-propres";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES CAPITAUX PROPRES, CONSTITUER, AUGMENTER, AFFECTER (BTS CG P2, 2.2.1, 2.2.2, 2.5.1,
 * 2.5.2 et 2.5.3 ; comptabilité générale, palier 4).
 *
 * Le chapitre suit les capitaux propres de NOVA dans l'ordre où ils bougent : la constitution du
 * 2 janvier N (souscrit, appelé, versé, et une variante à moitié libérée ; les frais de constitution,
 * montant donné), l'assemblée de juin N + 1 qui affecte le bénéfice de N (la version unique du cours,
 * celle du bac : 2 € de dividende par action, lu ici en intérêt statutaire et superdividende), la
 * perte de PIXEL & CO passée en report à nouveau débiteur, puis l'augmentation de capital du
 * 30 juin N + 1, ses frais et ses variantes (en nature, par incorporation de réserves). Le droit
 * préférentiel de souscription et le droit d'attribution, exclus du BTS, n'y paraissent pas : ils
 * sont au chapitre du DCG « L'augmentation de capital ».
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, la-souscription-de-nova, le-projet-d-affectation (les règles dans la question) ;
 *   · l'expérience avant la formule : predire-la-perte puis la-perte-au-curseur (les capitaux propres
 *     de PIXEL & CO face à la moitié du capital) avant l-affectation-de-la-perte ;
 *     predire-l-incorporation puis le-laboratoire-des-augmentations (la façon d'augmenter et le
 *     nombre d'actions) avant les écritures de l'augmentation ;
 *   · autonome et expert : le-tableau-d-affectation, le-bilan-apres-repartition, le-report-qui-attend
 *     (l'assemblée suivante de PIXEL & CO), le-nouveau-plafond ; puis la synthèse.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : monde/capitaux-propres.ts, qui lit la fiche de N, la
 * version unique de l'affectation (monde/affectation-du-resultat.ts), l'augmentation du DCG
 * (monde/comptabilite-approfondie.ts) et les exercices de PIXEL & CO (monde/projets-et-financement.ts).
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** Les entreprises du chapitre : NOVA seule (PIXEL & CO y paraît pour la perte, dans les étapes qui la nomment). */
export const ENTREPRISES_DES_CAPITAUX_PROPRES: readonly string[] = ["nova"];

/** Les leviers du laboratoire : la façon d'augmenter le capital, et le nombre d'actions nouvelles. */
export const LEVIERS_DES_AUGMENTATIONS = { actions: { min: 1_000, max: 8_000, pas: 1_000 } } as const;
export const DEPART_DES_AUGMENTATIONS = { facon: FACONS_D_AUGMENTER.incorporation, actions: 3_000 } as const;

/** La position du laboratoire qui relève le défi : le capital visé, et l'argent qui entre. */
export function solutionDesAugmentations() {
  const l = LEVIERS_DES_AUGMENTATIONS.actions;
  const toutes = [FACONS_D_AUGMENTER.numeraire, FACONS_D_AUGMENTER.nature, FACONS_D_AUGMENTER.incorporation].flatMap((facon) =>
    Array.from({ length: (l.max - l.min) / l.pas + 1 }, (_, i) => ({ facon, actions: l.min + i * l.pas })),
  );
  return toutes.filter((p) => defiDesAugmentations(p.facon, p.actions));
}

export function defiDesAugmentations(facon: number, actions: number) {
  const x = augmentationDuLaboratoire(facon, actions);
  return x.possible && x.capital === CAPITAL_VISE && x.tresorerie >= TRESORERIE_VISEE;
}

/** Le tableau d'affectation du PCG, à compléter : les origines, puis les affectations. */
export function grilleDAffectation(): TableauACompleter {
  const x = affectationDeNova();
  return {
    titre: "Tableau d'affectation du résultat de N",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Report à nouveau antérieur", cellules: [donnee(x.reportAnterieur)] },
      { libelle: "Résultat de l'exercice", cellules: [aSaisir(x.benefice, `le bénéfice de N : ${eur(x.benefice)}`)] },
      { libelle: "Prélèvements sur les réserves", cellules: [donnee(0)] },
      { libelle: "Total des origines", fort: true, totalDe: { plus: [0, 1, 2] }, cellules: [aSaisir(x.benefice, `${eur(x.reportAnterieur)} + ${eur(x.benefice)} + ${eur(0)} = ${eur(x.benefice)}`)] },
      { libelle: "Réserve légale", cellules: [aSaisir(x.reserveLegale, `${eur(x.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(x.reserveLegale)}`, "une part du bénéfice, sous le plafond")] },
      { libelle: "Réserves statutaires", cellules: [donnee(x.reserveStatutaire)] },
      { libelle: "Autres réserves", cellules: [aSaisir(x.reservesFacultatives, `les réserves facultatives votées : ${eur(x.reservesFacultatives)}`)] },
      { libelle: "Dividendes", cellules: [aSaisir(x.dividendes, `${eur(x.interetStatutaire)} + ${eur(x.superdividende)} = ${eur(x.dividendes)}`, "l'intérêt statutaire plus le superdividende")] },
      { libelle: "Report à nouveau", cellules: [aSaisir(x.reportANouveau, `${eur(x.distribuable)} − ${eur(x.dividendes)} − ${eur(x.reservesFacultatives)} = ${eur(x.reportANouveau)}`, "ce qui reste du bénéfice distribuable")] },
      { libelle: "Total des affectations", fort: true, totalDe: { plus: [4, 5, 6, 7, 8] }, cellules: [aSaisir(x.benefice, `il retombe sur le total des origines : ${eur(x.benefice)}`)] },
    ],
  };
}

export const LES_CAPITAUX_PROPRES: Chapitre = {
  code: "les-capitaux-propres",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Les capitaux propres : constituer, augmenter, affecter",
  accroche:
    "Du capital souscrit au dividende versé : les écritures de la constitution, de l'assemblée qui affecte le bénéfice ou la perte, et de l'augmentation de capital, chez NOVA et chez PIXEL & CO.",
  objectifs: [
    "Enregistrer la constitution d'une société, du capital souscrit au capital versé",
    "Bâtir et enregistrer l'affectation d'un bénéfice : réserves, dividende et report à nouveau",
    "Affecter une perte et situer les capitaux propres face à la moitié du capital",
    "Enregistrer une augmentation de capital et ses frais, selon la nature des apports",
    "Présenter le tableau d'affectation et le bilan après répartition",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan", "la-cloture"],
  ensuite: ["les-comptes-annuels", "l-augmentation-de-capital"],
  entreprises: {
    codes: ENTREPRISES_DES_CAPITAUX_PROPRES,
    pourquoi: "ce chapitre suit les capitaux propres de NOVA, de sa constitution à l'assemblée de N + 1 ; PIXEL & CO y paraît pour la perte.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que les associés ont mis, ce que l'entreprise a gardé",
      notions: ["balance_sheet", "dilution_issuance"],
      texte: (c) => {
        const k = constitution();
        const x = affectationDeNova();
        const a = augmentation();
        return [
          `Les capitaux propres sont ce que l'entreprise doit à ses associés : le capital qu'ils ont apporté, et ce que l'entreprise a gagné et gardé. ${c.entreprise} est une SAS : son capital de ${eur(k.capital)} est fait de ${qte(k.actions)} actions de ${eur(k.nominal)} de nominal.`,
          `Ils bougent à trois moments, que le chapitre suit dans l'ordre du calendrier. La constitution, le 2 janvier N. L'assemblée générale de juin N + 1, qui approuve les comptes de N et affecte le bénéfice de ${eur(x.benefice)}. L'augmentation de capital du ${a.date}, qui fait entrer ${eur(a.fonds)}.`,
          "Chaque écriture se passe en classe 1 pour les capitaux propres, en classe 4 pour ce que les associés doivent ou ce qu'on leur doit : leurs apports promis, leurs dividendes à payer.",
        ];
      },
      tableau: (c) => {
        const x = affectationDeNova();
        return {
          titre: `Les capitaux propres de ${c.entreprise} au 31 décembre N, avant affectation`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Capital (101)", valeurs: [eur(x.capital)] },
            { libelle: "Réserves", valeurs: [eur(0)] },
            { libelle: "Report à nouveau", valeurs: [eur(x.reportAnterieur)] },
            { libelle: "Résultat de l'exercice (120)", valeurs: [eur(x.benefice)] },
            { libelle: "Capitaux propres", valeurs: [eur(x.capitauxPropresAvant)] },
          ],
        };
      },
      repere: () => "Capital souscrit = capital appelé + capital non appelé ; capital appelé = capital versé + capital appelé non versé. Le capital du bilan est le capital souscrit.",
    },
    {
      id: "la-souscription-de-nova",
      objectifs: [0],
      type: "ecriture",
      titre: "La souscription des actions de NOVA",
      notions: ["balance_sheet"],
      evenement: (c) => {
        const k = constitution();
        return `Le 2 janvier N, les associés souscrivent les ${qte(k.actions)} actions de ${eur(k.nominal)} de ${c.entreprise}. Les statuts appellent tout le capital à la souscription : chaque associé doit son apport à la société. Passez la souscription.`;
      },
      ecriture: () => {
        const k = constitution();
        return {
          date: "2 janvier",
          libelle: "Souscription du capital, appelé en entier",
          lignes: [
            { role: "ce que les associés doivent à la société", compte: "4561", sens: "debit", montant: k.capital, indice: "le capital souscrit" },
            { role: "le capital souscrit, appelé et bientôt versé", compte: "1013", acceptes: ["101"], sens: "credit", montant: k.capital, indice: "le capital souscrit" },
          ],
        };
      },
      indices: () => [
        "Au débit, une créance sur les associés : le compte de leurs apports (456).",
        "Au crédit, le capital : appelé en entier, il va au 1013, capital souscrit, appelé, versé, puisque l'argent arrive le jour même.",
      ],
      explication: (c) => {
        const k = constitution();
        return [
          `Le même jour, la banque reçoit les fonds : 512 au débit, 4561 au crédit, pour ${eur(k.capital)}. Le compte des apports est soldé : il n'a servi qu'à suivre la promesse jusqu'au versement.`,
          `Le chapitre « De la création au premier bilan » passait l'apport de ${c.entreprise} en une ligne, 512 contre 101. C'est le même résultat : le détail par le 4561 se garde quand l'apport n'arrive pas en une fois.`,
        ];
      },
    },
    {
      id: "la-liberation-partielle",
      objectifs: [0],
      type: "montants",
      titre: "Et si la moitié seulement était versée ?",
      notions: ["balance_sheet"],
      question: () =>
        `Variante. Dans une SAS, une action de numéraire doit être libérée de ${pct(LIBERATION_MINIMALE)} au moins à la souscription ; le solde est appelé quand la société en a besoin, dans les ${DELAI_DE_LIBERATION_EN_ANS} ans. Supposez que les associés n'aient versé que ce minimum. Calculez le capital souscrit, le capital appelé et versé, puis le capital non appelé.`,
      champs: () => {
        const k = constitution();
        return [
          { libelle: "Capital souscrit", attendu: k.capital, calcul: `${qte(k.actions)} × ${eur(k.nominal)} = ${eur(k.capital)}` },
          { libelle: "Capital appelé et versé", attendu: k.appeleVerse, calcul: `${eur(k.capital)} × ${pct(LIBERATION_MINIMALE)} = ${eur(k.appeleVerse)}` },
          { libelle: "Capital non appelé", attendu: k.nonAppele, calcul: `${eur(k.capital)} − ${eur(k.appeleVerse)} = ${eur(k.nonAppele)}` },
        ];
      },
      explication: () => {
        const k = constitution();
        return [
          `Le capital du bilan reste de ${eur(k.capital)} : les associés s'y sont engagés. Les ${eur(k.nonAppele)} non appelés sont une créance de la société sur eux, inscrite en tête de l'actif (109), et la trésorerie n'a reçu que ${eur(k.appeleVerse)}.`,
        ];
      },
    },
    {
      id: "la-souscription-partielle",
      objectifs: [0],
      type: "ecriture",
      titre: "La souscription à moitié libérée, au journal",
      notions: ["balance_sheet"],
      evenement: () => "Toujours dans la variante : à la souscription, la société appelle la moitié du capital, et ne l'a pas encore reçue ; l'autre moitié n'est pas appelée. Passez la souscription.",
      ecriture: () => {
        const k = constitution();
        return {
          date: "2 janvier",
          libelle: "Souscription, moitié appelée",
          lignes: [
            { role: "le capital qui n'est pas encore appelé", compte: "109", sens: "debit", montant: k.nonAppele, indice: "la moitié non appelée" },
            { role: "le capital appelé, que les associés doivent verser", compte: "4562", sens: "debit", montant: k.appeleVerse, indice: "la moitié appelée" },
            { role: "le capital souscrit non appelé", compte: "1011", sens: "credit", montant: k.nonAppele, indice: "la moitié non appelée" },
            { role: "le capital souscrit appelé, pas encore versé", compte: "1012", sens: "credit", montant: k.appeleVerse, indice: "la moitié appelée" },
          ],
        };
      },
      indices: () => [
        "Deux créances sur les associés au débit : ce qui n'est pas appelé (109), ce qui est appelé et pas encore versé (4562).",
        "Deux comptes de capital au crédit, qui disent où en est chaque part : 1011 et 1012.",
      ],
      explication: () => {
        const k = constitution();
        return [
          `Au versement, la banque reçoit ${eur(k.appeleVerse)} (512 au débit, 4562 au crédit) et la part versée passe du 1012 au 1013. Le jour où le solde sera appelé, le 109 se videra dans le 4562, et le 1011 dans le 1012.`,
          "Une telle libération partielle a un prix chez NOVA : le taux réduit de l'impôt sur les sociétés exige un capital entièrement libéré.",
        ];
      },
    },
    {
      id: "les-frais-de-constitution",
      objectifs: [0],
      type: "choix",
      titre: "Les frais de constitution",
      notions: ["depreciation"],
      question: () => {
        const f = constitution().frais;
        return `Variante encore, au montant donné : la constitution a coûté ${eur(f.honoraires)} hors taxes d'honoraires pour les statuts (et ${eur(f.tva)} de TVA), et ${eur(f.immatriculation)} de frais d'immatriculation et d'annonce légale. Comment les traiter ?`;
      },
      options: () => {
        const f = constitution().frais;
        return [
          {
            texte: `En charges de N, ${eur(f.charges)} : c'est la règle`,
            juste: true,
            // À VÉRIFIER : l'interdiction de distribuer tant que les frais d'établissement ne sont pas amortis (Code de commerce, L. 232-9).
            retour: `Oui : la méthode de référence passe les frais en charges (6226 pour les honoraires, 6227 pour les frais d'actes), la TVA en déductible. Une option les inscrit à l'actif en frais d'établissement, amortis sur ${DUREE_DES_FRAIS_D_ETABLISSEMENT} ans au plus : ${eur(f.amortissementAnnuel)} par an ; tant qu'ils ne sont pas amortis, aucun dividende ne peut être versé sans réserves au moins égales.`,
          },
          {
            texte: "En diminution du capital souscrit, puisqu'ils ont servi à le constituer",
            juste: false,
            retour: "Non : le capital reste celui des statuts. Des frais ne sont pas un remboursement d'apport.",
          },
          {
            texte: `En immobilisation définitive, ${eur(f.paye)}, jamais amortie`,
            juste: false,
            retour: "Non : inscrits à l'actif, les frais d'établissement s'amortissent vite, et leur TVA se récupère : elle n'en fait pas partie.",
          },
        ];
      },
    },
    {
      id: "le-projet-d-affectation",
      objectifs: [1],
      type: "montants",
      titre: "Le projet d'affectation",
      notions: ["income_statement", "balance_sheet"],
      tableau: () => {
        const x = affectationDeNova();
        return {
          titre: "Ce que décide l'assemblée de juin N + 1",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Bénéfice de N", valeurs: [eur(x.benefice)] },
            { libelle: "Réserve légale", valeurs: [`${pct(RESERVE_LEGALE)} du bénéfice, jusqu'à ${pct(PLAFOND_DE_LA_RESERVE_LEGALE)} du capital`] },
            { libelle: "Intérêt statutaire", valeurs: [`${pct(INTERET_STATUTAIRE)} du capital libéré`] },
            { libelle: "Dividende par action", valeurs: [eur(x.dividendeParAction)] },
            { libelle: "Réserves facultatives", valeurs: [eur(x.reservesFacultatives)] },
          ],
        };
      },
      question: () =>
        "Le président présente le projet du chapitre « L'affectation du résultat ». Les statuts prévoient un premier dividende, l'intérêt statutaire, sur le capital libéré ; le reste du dividende est le superdividende. Calculez la réserve légale, le bénéfice distribuable, l'intérêt statutaire, le superdividende, puis le report à nouveau.",
      champs: () => {
        const x = affectationDeNova();
        return [
          { libelle: "Réserve légale", attendu: x.reserveLegale, calcul: `${eur(x.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(x.reserveLegale)}, sous le plafond de ${eur(x.plafond)}` },
          { libelle: "Bénéfice distribuable", attendu: x.distribuable, calcul: `${eur(x.benefice)} − ${eur(x.reserveLegale)} + ${eur(x.reportAnterieur)} = ${eur(x.distribuable)}` },
          { libelle: "Intérêt statutaire", attendu: x.interetStatutaire, calcul: `${eur(x.capital)} × ${pct(INTERET_STATUTAIRE)} = ${eur(x.interetStatutaire)}, soit ${eur(x.interetParAction)} par action` },
          { libelle: "Superdividende", attendu: x.superdividende, calcul: `${eur(x.dividendeParAction)} × ${qte(x.actions)} − ${eur(x.interetStatutaire)} = ${eur(x.superdividende)}` },
          { libelle: "Report à nouveau", attendu: x.reportANouveau, calcul: `${eur(x.distribuable)} − ${eur(x.dividendes)} − ${eur(x.reservesFacultatives)} = ${eur(x.reportANouveau)}` },
        ];
      },
      explication: () => {
        const x = affectationDeNova();
        return [
          `Le dividende de ${eur(x.dividendeParAction)} par action se lit en deux parts : ${eur(x.interetParAction)} d'intérêt statutaire, que les statuts réservent d'abord à chaque action, puis ${eur(x.superdividendeParAction)} de superdividende. Les statuts de NOVA n'imposent aucune réserve statutaire.`,
          `Le report à nouveau, ${eur(x.reportANouveau)}, attendra l'assemblée suivante : il s'ajoutera au bénéfice de N + 1 à affecter.`,
        ];
      },
    },
    {
      id: "le-tableau-d-affectation",
      objectifs: [1, 4],
      type: "a-completer",
      titre: "Le tableau d'affectation du PCG",
      notions: ["balance_sheet"],
      question: () =>
        "Complétez le tableau d'affectation, comme le présente l'annexe : en haut, les origines (ce qui est à affecter) ; en bas, les affectations. Les deux totaux sont égaux.",
      grille: grilleDAffectation,
      explication: () => {
        const x = affectationDeNova();
        return [`Les ${eur(x.benefice)} à affecter se retrouvent tous en bas : ${eur(x.reserveLegale + x.reservesFacultatives + x.reportANouveau)} restent dans les capitaux propres, ${eur(x.dividendes)} en sortent vers les associés.`];
      },
    },
    {
      id: "l-ecriture-d-affectation",
      objectifs: [1],
      type: "ecriture",
      titre: "L'affectation, au journal",
      notions: ["balance_sheet"],
      evenement: () => `Le ${ASSEMBLEE_DE_N_PLUS_1.date} N + 1, l'assemblée générale approuve les comptes de N et vote le projet. Passez l'affectation du bénéfice.`,
      ecriture: () => {
        const x = affectationDeNova();
        return {
          date: ASSEMBLEE_DE_N_PLUS_1.date,
          libelle: "Affectation du résultat de N",
          lignes: [
            { role: "le résultat, qui se solde", compte: "120", sens: "debit", montant: x.benefice, indice: "tout le bénéfice de N" },
            { role: "la réserve légale", compte: "1061", sens: "credit", montant: x.reserveLegale, indice: "la part de la loi" },
            { role: "les réserves facultatives", compte: "1068", sens: "credit", montant: x.reservesFacultatives, indice: "les réserves votées" },
            { role: "les dividendes dus aux associés", compte: "457", sens: "credit", montant: x.dividendes, indice: "le dividende total" },
            { role: "le report à nouveau", compte: "110", sens: "credit", montant: x.reportANouveau, indice: "ce qui reste en attente" },
          ],
        };
      },
      indices: () => [
        "Au débit, le résultat de l'exercice (120) : il est affecté en entier, son compte se solde.",
        "Au crédit, les réserves (1061, 1068), le report à nouveau créditeur (110), et une dette envers les associés pour les dividendes (457).",
      ],
      explication: () => {
        const x = affectationDeNova();
        return [`Le dividende n'est pas encore payé : le vote fait naître une dette de ${eur(x.dividendes)} envers les associés. Les capitaux propres tombent de ${eur(x.capitauxPropresAvant)} à ${eur(x.capitauxPropresApres)} ; les réserves et le report, eux, y restent.`];
      },
    },
    {
      id: "la-mise-en-paiement",
      objectifs: [1],
      type: "ecriture",
      titre: "La mise en paiement du dividende",
      notions: ["net_treasury"],
      evenement: (c) => `Le ${ASSEMBLEE_DE_N_PLUS_1.miseEnPaiement} N + 1, ${c.entreprise} vire les dividendes aux associés. Passez le paiement.`,
      ecriture: () => {
        const x = affectationDeNova();
        return {
          date: ASSEMBLEE_DE_N_PLUS_1.miseEnPaiement,
          libelle: "Mise en paiement des dividendes",
          lignes: [
            { role: "la dette envers les associés, qui s'éteint", compte: "457", sens: "debit", montant: x.dividendes, indice: "le dividende total" },
            { role: "l'argent qui sort", compte: "512", sens: "credit", montant: x.dividendes, indice: "le dividende total" },
          ],
        };
      },
      indices: () => ["La dette du 457 se solde au débit ; la banque, au crédit."],
      explication: () => {
        const x = affectationDeNova();
        return [
          `C'est ici seulement que la trésorerie baisse de ${eur(x.dividendes)}. Le cours simplifie : pour un associé personne physique, la société retient en réalité un prélèvement qu'elle reverse à l'État, et ne vire que le net.`,
        ];
      },
    },
    {
      id: "le-bilan-apres-repartition",
      objectifs: [4],
      type: "montants",
      titre: "Le bilan après répartition",
      notions: ["balance_sheet"],
      question: () =>
        "Le bilan du 31 décembre N peut se présenter après répartition, tel que l'assemblée l'a voté : le résultat disparaît, les réserves et le report apparaissent, et les dividendes votés sont une dette. Calculez les réserves, les capitaux propres après répartition, puis les dettes envers les associés.",
      champs: () => {
        const x = affectationDeNova();
        return [
          { libelle: "Réserves", attendu: x.reserveLegale + x.reservesFacultatives, calcul: `${eur(x.reserveLegale)} + ${eur(x.reservesFacultatives)} = ${eur(x.reserveLegale + x.reservesFacultatives)}` },
          { libelle: "Capitaux propres après répartition", attendu: x.capitauxPropresApres, calcul: `${eur(x.capital)} + ${eur(x.reserveLegale + x.reservesFacultatives)} + ${eur(x.reportANouveau)} = ${eur(x.capitauxPropresApres)}` },
          { libelle: "Dettes envers les associés", attendu: x.dividendes, calcul: `les dividendes votés : ${eur(x.dividendes)}` },
        ];
      },
      explication: () => {
        const x = affectationDeNova();
        return [`Le total du bilan ne change pas : ${eur(x.dividendes)} passent des capitaux propres aux dettes. C'est la différence entre un bilan avant et après répartition, et c'est le bilan après répartition qu'un banquier lit pour mesurer l'autonomie financière.`];
      },
    },
    {
      id: "predire-la-perte",
      objectifs: [2],
      type: "choix",
      titre: "Une perte, et la moitié du capital",
      notions: ["balance_sheet"],
      question: () => {
        const p = perteDePixel();
        return `Chez ${p.entreprise}, l'exercice N finit en perte : ${eur(p.perteComptable)} avant la créance née du report en arrière (« Le déficit reporté »), ${eur(p.perte)} après. Son capital est de ${eur(p.capital)}, ses réserves de ${eur(p.reserveLegale + p.autresReserves)}. La loi s'inquiète quand les capitaux propres tombent sous la moitié du capital. Avant de calculer : y tombent-ils ?`;
      },
      options: () => {
        const p = perteDePixel();
        return [
          { texte: "Non, ils restent au-dessus", juste: !p.sousLaMoitie, retour: `Oui : ${eur(p.capital)} + ${eur(p.reserveLegale + p.autresReserves)} − ${eur(p.perte)} = ${eur(p.capitauxPropres)}, au-dessus de ${eur(p.seuil)}. Les réserves de N − 1 amortissent le choc.` },
          { texte: "Oui, puisque la perte dépasse la moitié du capital", juste: p.sousLaMoitie, retour: `Non : on ne compare pas la perte au capital, mais les capitaux propres, réserves comprises, à la moitié du capital. Ils restent à ${eur(p.capitauxPropres)}.` },
          { texte: "On ne peut pas le savoir avant l'assemblée", juste: false, retour: "Non : les capitaux propres se lisent au bilan de clôture, avant même l'assemblée. C'est elle qui devra réagir s'ils sont trop bas." },
        ];
      },
    },
    {
      id: "la-perte-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où la perte peut aller",
      notions: ["balance_sheet"],
      sens: "plus-grande",
      question: () => {
        const p = perteDePixel();
        return `Faites varier la perte nette de N de ${p.entreprise}, à l'euro. Une droite donne ses capitaux propres, l'autre la moitié de son capital, ${eur(p.seuil)}. Placez le curseur sur la plus forte perte qui laisse les capitaux propres à la moitié du capital au moins.`;
      },
      grandeur: () => ({ libelle: "Perte nette de N", unite: "€" }),
      cible: () => ({ attendu: perteDePixel().perteMaximale, min: PERTE_DU_CURSEUR_DE_PIXEL.min, max: PERTE_DU_CURSEUR_DE_PIXEL.max }),
      zones: ["Au moins la moitié du capital", "Sous la moitié du capital"],
      rates: () => ({
        dessous: "À cette perte, les capitaux propres restent au-dessus de la moitié du capital, et une perte plus forte aussi : cherchez la plus forte.",
        dessus: "À cette perte, les capitaux propres sont déjà sous la moitié du capital.",
      }),
      montrer: "Montrer la perte",
      lecture: (_c, q) => {
        const p = perteDePixel(q);
        return [
          { libelle: "Capitaux propres", montant: p.capitauxPropres, fort: true },
          { libelle: "Moitié du capital", montant: p.seuil },
        ];
      },
      droites: () => {
        const p = perteDePixel();
        return { produit: (q) => perteDePixel(q).capitauxPropres, cout: () => p.seuil, libelles: ["Capitaux propres", "Moitié du capital"] };
      },
      explication: () => {
        const p = perteDePixel();
        return [
          `Au plus ${eur(p.perteMaximale)} : le capital et les réserves, ${eur(p.capital + p.reserveLegale + p.autresReserves)}, moins la moitié du capital. Au-delà, les associés doivent décider dans les ${DELAI_DE_DECISION_EN_MOIS} mois qui suivent l'approbation des comptes s'ils dissolvent la société ; sinon, elle devra reconstituer ses capitaux propres ou réduire son capital.`,
          `Avec ${eur(p.perte)}, ${p.entreprise} garde une marge de ${eur(p.perteMaximale - p.perte)}.`,
        ];
      },
    },
    {
      id: "l-affectation-de-la-perte",
      objectifs: [2],
      type: "ecriture",
      titre: "La perte, en report à nouveau débiteur",
      notions: ["balance_sheet"],
      evenement: () => {
        const p = perteDePixel();
        return `L'assemblée de ${p.entreprise} approuve les comptes de N et décide de reporter la perte nette, ${eur(p.perte)}, sur les exercices suivants, sans toucher à ses réserves. Passez l'affectation.`;
      },
      ecriture: () => {
        const p = perteDePixel();
        return {
          date: "20 juin",
          libelle: "Affectation de la perte de N",
          lignes: [
            { role: "le report à nouveau débiteur", compte: "119", sens: "debit", montant: p.perte, indice: "toute la perte nette" },
            { role: "le résultat déficitaire, qui se solde", compte: "129", sens: "credit", montant: p.perte, indice: "toute la perte nette" },
          ],
        };
      },
      indices: () => ["Une perte est un solde débiteur du 129 : elle se solde au crédit.", "Elle attend au report à nouveau, du côté débiteur (119)."],
      explication: () => {
        const p = perteDePixel();
        return [
          `Les capitaux propres ne changent pas, ${eur(p.capitauxPropres)} : la perte change seulement de compte. L'assemblée aurait pu aussi l'imputer sur les autres réserves, ${eur(p.autresReserves)} ; le report garde les réserves intactes, et c'est le bénéfice suivant qui l'épongera d'abord.`,
        ];
      },
    },
    {
      id: "le-report-qui-attend",
      objectifs: [2],
      type: "montants",
      titre: "L'assemblée suivante de PIXEL & CO",
      notions: ["income_statement"],
      question: () => {
        const p = perteDePixel();
        return `Un an plus tard, ${p.entreprise} affecte son bénéfice net de N + 1, ${eur(p.beneficeSuivant)}. Un report à nouveau débiteur s'impute d'abord sur le bénéfice : la réserve légale ne se calcule que sur ce qui reste. Calculez le report à nouveau débiteur qui reste, la dotation à la réserve légale, puis le dividende possible sans toucher aux réserves.`;
      },
      champs: () => {
        const p = perteDePixel();
        return [
          { libelle: "Report à nouveau débiteur restant", attendu: p.reportDebiteurRestant, calcul: `${eur(p.perte)} − ${eur(p.beneficeSuivant)} = ${eur(p.reportDebiteurRestant)}` },
          { libelle: "Réserve légale", attendu: 0, calcul: "le bénéfice ne couvre pas la perte antérieure : rien à doter" },
          { libelle: "Dividende possible", attendu: 0, calcul: "aucun bénéfice distribuable : le bénéfice a servi à éponger la perte" },
        ];
      },
      explication: () => {
        const p = perteDePixel();
        return [`Le bénéfice de N + 1 ne fait qu'absorber une part de la perte : ${eur(p.reportDebiteurRestant)} attendent encore. Seule une décision expresse de prélever sur les réserves permettrait un dividende, et la banque y lirait un signal.`];
      },
    },
    {
      id: "predire-l-incorporation",
      objectifs: [3],
      type: "choix",
      titre: "Augmenter le capital sans un euro de plus ?",
      notions: ["dilution_issuance"],
      question: () => {
        const a = augmentation();
        return `Retour chez NOVA, après l'assemblée. Elle pourrait augmenter son capital en y incorporant ses ${eur(a.incorporation.montant)} de réserves facultatives. Que deviendraient ses capitaux propres ?`;
      },
      options: () => {
        const x = affectationDeNova();
        return [
          { texte: "Ils resteraient les mêmes", juste: true, retour: `Oui : ${eur(x.capitauxPropresApres)}, au centime. Les réserves deviennent du capital : un poste des capitaux propres passe dans un autre, aucun argent n'entre.` },
          { texte: "Ils augmenteraient des réserves incorporées", juste: false, retour: "Non : les réserves étaient déjà dans les capitaux propres. Seul un apport nouveau, en argent ou en nature, les fait monter." },
          { texte: "Ils baisseraient, puisque les réserves disparaissent", juste: false, retour: "Non : elles ne disparaissent pas, elles changent de nom et deviennent du capital, que les associés ne peuvent plus se distribuer." },
        ];
      },
    },
    {
      id: "le-laboratoire-des-augmentations",
      objectifs: [3],
      type: "simulation",
      titre: "Trois façons d'augmenter le capital",
      notions: ["dilution_issuance", "balance_sheet"],
      question: () => {
        const a = augmentation();
        return `Choisissez la façon d'augmenter le capital et le nombre d'actions nouvelles. En numéraire, chacune se paie ${eur(a.prix)} par virement. En nature, un associé apporte un brevet de haut-parleur évalué au même prix. Par incorporation, les réserves facultatives deviennent des actions gratuites, au nominal de ${eur(a.nominal)}.`;
      },
      leviers: () => [
        {
          code: "facon",
          libelle: "Façon d'augmenter",
          unite: "",
          min: FACONS_D_AUGMENTER.numeraire,
          max: FACONS_D_AUGMENTER.incorporation,
          pas: 1,
          depart: DEPART_DES_AUGMENTATIONS.facon,
          choix: [
            { valeur: FACONS_D_AUGMENTER.numeraire, libelle: "En numéraire" },
            { valeur: FACONS_D_AUGMENTER.nature, libelle: "En nature" },
            { valeur: FACONS_D_AUGMENTER.incorporation, libelle: "Par incorporation" },
          ],
        },
        { code: "actions", libelle: "Actions nouvelles", unite: "actions", ...LEVIERS_DES_AUGMENTATIONS.actions, depart: DEPART_DES_AUGMENTATIONS.actions },
      ],
      lecture: (_c, p) => {
        const x = augmentationDuLaboratoire(p.facon!, p.actions!);
        const avant = augmentationDuLaboratoire(FACONS_D_AUGMENTER.numeraire, 0);
        return [
          { libelle: "Capital", montant: x.capital, reference: avant.capital, fort: true },
          { libelle: "Prime d'émission", montant: x.prime },
          { libelle: "Réserves facultatives", montant: x.reserves, reference: avant.reserves },
          { libelle: "Capitaux propres", montant: x.capitauxPropres, reference: avant.capitauxPropres },
          { libelle: "Argent reçu", montant: x.tresorerie },
          { libelle: "Brevet reçu", montant: x.immobilisations },
        ];
      },
      defi: () => {
        const s = solutionDesAugmentations()[0]!;
        return {
          consigne: `Portez le capital à ${eur(CAPITAL_VISE)} en faisant entrer au moins ${eur(TRESORERIE_VISEE)} d'argent.`,
          atteint: (p) => defiDesAugmentations(p.facon!, p.actions!),
          indice: (p) => {
            const x = augmentationDuLaboratoire(p.facon!, p.actions!);
            if (!x.possible) return `Les réserves facultatives ne suffisent pas : il faudrait ${eur(x.capital - augmentationDuLaboratoire(FACONS_D_AUGMENTER.numeraire, 0).capital)} de réserves.`;
            if (x.capital !== CAPITAL_VISE) return `Le capital atteint ${eur(x.capital)}, pas ${eur(CAPITAL_VISE)} : combien d'actions de ${eur(augmentation().nominal)} faut-il ajouter ?`;
            return `Le capital est juste, mais seulement ${eur(x.tresorerie)} d'argent entre : quelle façon fait payer les actions ?`;
          },
          solution: { facon: s.facon, actions: s.actions },
        };
      },
      explication: (_c, p) => {
        const x = augmentationDuLaboratoire(p.facon!, p.actions!);
        return [
          `Défi relevé : ${qte(p.actions!)} actions en numéraire portent le capital à ${eur(x.capital)} et font entrer ${eur(x.tresorerie)}, dont ${eur(x.prime)} de prime d'émission. C'est l'opération que NOVA a choisie.`,
          "L'apport en nature fait monter les capitaux propres autant, mais avec un bien, pas de l'argent. L'incorporation ne fait monter que le capital : les capitaux propres ne bougent pas.",
        ];
      },
    },
    {
      id: "l-augmentation-en-numeraire",
      objectifs: [3],
      type: "ecriture",
      titre: "L'augmentation de capital du 30 juin",
      notions: ["dilution_issuance"],
      evenement: () => {
        const a = augmentation();
        return `Le ${a.date}, ${qte(a.nouvelles)} actions nouvelles de ${eur(a.nominal)} de nominal sont souscrites à ${eur(a.prix)}, libérées en entier par virement. Passez l'augmentation.`;
      },
      ecriture: () => {
        const a = augmentation();
        return {
          date: "30 juin",
          libelle: "Augmentation de capital en numéraire",
          lignes: [
            { role: "l'argent reçu des souscripteurs", compte: "512", sens: "debit", montant: a.fonds, indice: "les actions nouvelles au prix d'émission" },
            { role: "le capital, pour le nominal des actions nouvelles", compte: "1013", acceptes: ["101"], sens: "credit", montant: a.capital, indice: "les actions nouvelles au nominal" },
            { role: "la prime d'émission", compte: "1041", sens: "credit", montant: a.prime, indice: "l'excédent du prix sur le nominal" },
          ],
        };
      },
      indices: () => ["Au débit, la banque, pour tout ce qui est versé.", "Au crédit, le capital au nominal (1013), l'excédent en prime d'émission (1041)."],
      explication: () => {
        const a = augmentation();
        return [
          `Le capital passe à ${eur(a.capitalApres)}. Pourquoi une prime ? Après l'assemblée, une action ancienne vaut ${eur(a.valeurDeLAction)} de capitaux propres : la vendre ${eur(a.nominal)} aux nouveaux ferait un cadeau, payé par les anciens. La prime réduit l'écart.`,
          "Un apport en nature se passerait de même, le bien au débit (un brevet en 205) à la place de la banque, après l'évaluation d'un commissaire aux apports ; il est libéré en entier dès la souscription.",
        ];
      },
    },
    {
      id: "les-frais-d-augmentation",
      objectifs: [3],
      type: "ecriture",
      titre: "Les frais de l'augmentation, sur la prime",
      notions: ["dilution_issuance"],
      evenement: () => {
        const f = augmentation().frais;
        return `Variante, au montant donné : l'opération a coûté ${eur(f.honoraires)} hors taxes d'honoraires, et ${eur(f.tva)} de TVA, payés par virement. NOVA les impute sur la prime d'émission. Passez le paiement des frais.`;
      },
      ecriture: () => {
        const f = augmentation().frais;
        return {
          date: "30 juin",
          libelle: "Frais d'augmentation de capital, imputés sur la prime",
          lignes: [
            { role: "la prime d'émission, qui absorbe les frais", compte: "1041", sens: "debit", montant: f.honoraires, indice: "les frais hors taxes" },
            { role: "la TVA déductible", compte: "44566", sens: "debit", montant: f.tva, indice: "la TVA des honoraires" },
            { role: "l'argent qui sort", compte: "512", sens: "credit", montant: f.paye, indice: "le toutes taxes comprises" },
          ],
        };
      },
      indices: () => ["Imputés sur la prime : ils diminuent le 1041, sans passer par une charge.", "La TVA reste déductible ; la banque paie le toutes taxes comprises."],
      explication: () => {
        const f = augmentation().frais;
        return [
          `La prime tombe à ${eur(f.primeRestante)} et le résultat de N + 1 n'est pas touché. NOVA aurait pu aussi les passer en charges (6226), ou les inscrire en frais d'établissement et les amortir sur ${DUREE_DES_FRAIS_D_ETABLISSEMENT} ans au plus.`,
          // À VÉRIFIER : la suppression des transferts de charges (règlement ANC n° 2022-06) et l'imputation directe des frais sur la prime.
          "Veille : le règlement ANC n° 2022-06 a supprimé les transferts de charges, qui servaient autrefois à cette imputation : les frais s'imputent désormais directement sur la prime.",
        ];
      },
    },
    {
      id: "l-incorporation-de-reserves",
      objectifs: [3],
      type: "ecriture",
      titre: "L'incorporation de réserves, au journal",
      notions: ["dilution_issuance"],
      evenement: () => {
        const a = augmentation();
        return `Variante : au lieu de créer des actions gratuites, l'assemblée incorpore les ${eur(a.incorporation.montant)} de réserves facultatives en portant le nominal des actions anciennes de ${eur(a.nominal)} à ${eur(a.incorporation.nominal)}. Passez l'incorporation.`;
      },
      ecriture: () => {
        const a = augmentation();
        return {
          date: "30 juin",
          libelle: "Incorporation de réserves au capital",
          lignes: [
            { role: "les réserves facultatives, qui passent au capital", compte: "1068", sens: "debit", montant: a.incorporation.montant, indice: "les réserves incorporées" },
            { role: "le capital", compte: "1013", acceptes: ["101"], sens: "credit", montant: a.incorporation.montant, indice: "les réserves incorporées" },
          ],
        };
      },
      indices: () => ["Un compte de capitaux propres au débit, un autre au crédit : rien d'autre ne bouge."],
      explication: () => {
        const a = augmentation();
        return [`Les réserves facultatives tombent à ${eur(a.incorporation.reservesRestantes)}. En élevant le nominal, chaque associé garde sa part du capital : aucun droit d'attribution n'est à calculer. Le capital, plus sûr pour les créanciers, ne pourra plus être distribué.`];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "dilution_issuance"],
      texte: () => {
        const x = affectationDeNova();
        const a = augmentation();
        const p = perteDePixel();
        return [
          `La constitution : souscrit, appelé, versé (4561, 109, 4562 ; 1011, 1012, 1013). L'affectation : ${eur(x.benefice)} se partagent entre la réserve légale, les réserves facultatives, ${eur(x.dividendes)} de dividendes (457) et le report à nouveau (110). Une perte, comme celle de ${p.entreprise}, attend au report à nouveau débiteur (119).`,
          `L'augmentation : ${eur(a.fonds)} en numéraire, dont ${eur(a.prime)} de prime ; en nature, un bien à la place de l'argent ; par incorporation, aucun changement des capitaux propres. Les frais, au montant donné, vont en charges, en frais d'établissement ou sur la prime.`,
          "Dans l'arène, les apports se décident à la création, et le résultat de chaque année reste dans l'entreprise : demandez-vous ce qu'un dividende vous aurait coûté en trésorerie.",
        ];
      },
      repere: () => "Bénéfice distribuable = bénéfice − pertes antérieures − réserve légale − réserves statutaires + report à nouveau créditeur. Dividende = intérêt statutaire + superdividende. Le plafond de la réserve légale, le dixième du capital, monte avec chaque augmentation.",
    },
  ],
};
