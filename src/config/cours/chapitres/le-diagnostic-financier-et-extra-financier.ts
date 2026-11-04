import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  DIVIDENDE_PAR_ACTION_EN_N_PLUS_2,
  ACTIONS_APRES_L_AUGMENTATION,
  BESOIN_POSE,
  MOYENNES_DU_SECTEUR,
  SOCIAL_DES_EXERCICES,
  diagnosticDeNova,
  nPlus2Avec,
  type CodeDExercice,
} from "../monde/diagnostic-de-nova";
import { KG_CO2_PAR_KWH, KWH_DU_BATIMENT_PAR_MOIS, KWH_PAR_ENCEINTE } from "../monde/tableau-de-bord-durable";
import { KWH_ECONOMISES_PAR_AN } from "../monde/investissement-durable";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE DIAGNOSTIC FINANCIER ET EXTRA-FINANCIER (comptabilité générale, palier 4 ; DCG UE6,
 * 1.1, 1.6 et 1.7, programme de 2025).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les trois exercices de NOVA résumés par
 * monde/diagnostic-de-nova.ts. N est la clôture du cours, au centime (celle des chapitres des soldes,
 * du bilan fonctionnel et des ratios de structure) ; N + 1 et N + 2 la prolongent, avec les hypothèses
 * nommées de ce fichier et des autres fiches de NOVA (une seule NOVA). Les moyennes du secteur sont des
 * constantes du cours.
 *
 * L'objet : la démarche du diagnostic (ses lecteurs, ses documents, l'annexe, l'environnement), la
 * batterie de ratios (activité, profitabilité, rentabilité, faillite, rotation, investissement,
 * structure), le stock et le flux, le niveau et le taux de croissance, la comparaison dans le temps et
 * avec le secteur, les données ESG et la performance durable, les limites de l'information, et une
 * conclusion générale.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, les-lecteurs, l-annexe, les-ratios-d-activite (les formules dans la question) ;
 *   · l'expérience avant la formule : predire-la-marge avant les ratios d'activité ;
 *     predire-le-dividende puis le-laboratoire-du-diagnostic (le délai des clients et le dividende de
 *     N + 2 ; un graphique de la rentabilité financière selon le dividende, face au secteur) avant
 *     les limites ;
 *   · autonome : profitabilite-et-rentabilite, stock-ou-flux, les-ratios-de-faillite,
 *     rotation-et-investissement, face-au-secteur ;
 *   · expert : les-donnees-esg, les-indicateurs-esg, performance-durable, les-limites, la-conclusion ;
 *     et la synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur les ratios d'analyse de l'activité, du résultat et du bilan
 * (les familles de ratios d'une centrale de bilans, l'analyse sur plusieurs exercices et face au
 * secteur, « tout ratio doit être accompagné d'un commentaire », les ratios réducteurs
 * d'information), adapté à NOVA.
 */

/** Le diagnostic se lit sur des exercices tenus en comptabilité : ceux de NOVA. */
export const ENTREPRISES_DU_DIAGNOSTIC: readonly string[] = ["nova"];

/** Le défi du laboratoire : la rentabilité financière que demandent les associés, la trésorerie que veut garder le dirigeant. */
export const RENTABILITE_DEMANDEE = 0.35;
export const TRESORERIE_A_GARDER = 230_000;

/** Les bornes des leviers du laboratoire : le délai des clients de N + 2, en jours ; le dividende, en euros par action. */
export const LEVIERS_DU_DIAGNOSTIC = { delai: { min: 25, max: 60, pas: 5 }, dividende: { min: 0, max: 8, pas: 1 } } as const;

/** La position que montre la correction : le délai de la fiche, 3 € par action. */
export const SOLUTION_DU_DIAGNOSTIC = { delaiClients: BESOIN_POSE["N+2"].delaiClients, dividende: 3 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, decimales = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−");
/** Une fraction écrite en pour cent : « 27,1 % ». */
const pct = (t: number) => `${qte(auCentime(t * 100))} %`;
/** Une fraction en pour cent au centième, la réponse attendue d'un champ. */
const enPourcent = (t: number) => auCentime(t * 100);
const jours = (n: number) => `${qte(n)} jours`;
const LIBELLES: Readonly<Record<CodeDExercice, string>> = { N: "N", "N+1": "N + 1", "N+2": "N + 2" };

/** Le diagnostic, et chaque exercice par son rang (0 : N, 1 : N + 1, 2 : N + 2). */
export function diagnosticDuChapitre(_c?: Pick<Cas, "code">) {
  const d = diagnosticDeNova();
  const [n, n1, n2] = d.exercices;
  const [r0, r1, r2] = d.ratios;
  const [e0, e1, e2] = d.esg;
  return { ...d, n: n!, n1: n1!, n2: n2!, r0: r0!, r1: r1!, r2: r2!, e0: e0!, e1: e1!, e2: e2!, s: MOYENNES_DU_SECTEUR };
}

export type DiagnosticDuChapitre = ReturnType<typeof diagnosticDuChapitre>;

/** Le laboratoire à une position : N + 2 rejoué, et ses écarts au départ. */
export function laboratoireDuDiagnostic(p: Readonly<Record<string, number>>) {
  return nPlus2Avec(p.delaiClients!, p.dividende!);
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

const trois = (_x: DiagnosticDuChapitre, f: (i: 0 | 1 | 2) => string) => [f(0), f(1), f(2)];

/** Les comptes résumés des trois exercices : le compte de résultat par soldes, et la CAF. */
export function comptesResumes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = diagnosticDuChapitre(c);
  const e = x.exercices;
  const ligne = (libelle: string, f: (k: (typeof e)[number]) => number) => ({ libelle, valeurs: trois(x, (i) => eur(f(e[i]!))) });
  return {
    titre: "Les comptes résumés de NOVA, trois exercices",
    colonnes: e.map((k) => LIBELLES[k.code]),
    lignes: [
      { libelle: "Enceintes vendues", valeurs: trois(x, (i) => qte(e[i]!.enceintes)) },
      ligne("Chiffre d'affaires (production vendue)", (k) => k.production),
      ligne("Consommations en provenance des tiers", (k) => k.consommations),
      ligne("Valeur ajoutée", (k) => k.valeurAjoutee),
      ligne("Impôts et taxes", (k) => k.impotsEtTaxes),
      ligne("Charges de personnel", (k) => k.personnel),
      ligne("Excédent brut d'exploitation", (k) => k.excedentBrutDExploitation),
      ligne("Reprises sur dépréciations et provisions", (k) => k.reprises),
      ligne("Dotations aux amortissements, dépréciations et provisions", (k) => k.dotations),
      ligne("Autres charges (la créance de Sonora perdue)", (k) => k.autresCharges),
      ligne("Résultat d'exploitation", (k) => k.resultatDExploitation),
      ligne("Résultat financier", (k) => auCentime(k.produitsFinanciers - k.chargesFinancieres)),
      ligne("Résultat exceptionnel", (k) => k.resultatExceptionnel),
      ligne("Impôt sur les sociétés", (k) => k.impot),
      ligne("Résultat net", (k) => k.resultatNet),
      ligne("Capacité d'autofinancement", (k) => k.caf),
      ligne("Investissements de l'année", (k) => k.investissements),
    ],
  };
}

/** Les bilans résumés des trois exercices, en valeurs brutes pour le haut, en valeurs nettes pour le bas. */
export function bilansResumes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = diagnosticDuChapitre(c);
  const e = x.exercices;
  const r = x.ratios;
  const ligne = (libelle: string, f: (i: 0 | 1 | 2) => number) => ({ libelle, valeurs: trois(x, (i) => eur(f(i))) });
  return {
    titre: "Les bilans de NOVA au 31 décembre, trois exercices",
    colonnes: e.map((k) => LIBELLES[k.code]),
    lignes: [
      ligne("Immobilisations, valeur brute", (i) => e[i]!.immobilisationsBrutes),
      ligne("Amortissements cumulés", (i) => e[i]!.amortissements),
      ligne("Stock de composants", (i) => e[i]!.stocks),
      ligne("Clients, valeur brute", (i) => e[i]!.clientsBruts),
      ligne("Autres créances d'exploitation", (i) => e[i]!.autresCreances),
      ligne("Trésorerie (banque et placements)", (i) => e[i]!.tresorerieNette),
      ligne("Total de l'actif, en valeurs nettes", (i) => r[i]!.bilan.totalActif),
      ligne("Capitaux propres", (i) => e[i]!.capitauxPropres),
      ligne("Emprunt, capital restant dû", (i) => e[i]!.dettesFinancieres),
      ligne("dont à moins d'un an", (i) => e[i]!.echeancesAMoinsDUnAn),
      ligne("Fournisseurs de composants", (i) => e[i]!.fournisseurs),
      ligne("Autres dettes d'exploitation", (i) => e[i]!.autresDettesDExploitation),
      ligne("Impôt dû et intérêts courus", (i) => e[i]!.passifHorsExploitation),
      ligne("Dettes à moins d'un an (provision pour litige comprise en N)", (i) => r[i]!.bilan.dettesAMoinsDUnAn),
      ligne("Actif circulant, en valeurs nettes", (i) => r[i]!.bilan.actifCirculant),
      ligne("Besoin en fonds de roulement d'exploitation", (i) => e[i]!.besoinDExploitation),
    ],
  };
}

/** La batterie des ratios, sur trois exercices et face au secteur. */
export function batterieDeRatios(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = diagnosticDuChapitre(c);
  const r = x.ratios;
  const s = x.s;
  const taux = (libelle: string, f: (k: (typeof r)[number]) => number | null, secteur: number) => ({
    libelle,
    valeurs: [...trois(x, (i) => (f(r[i]!) === null ? "" : pct(f(r[i]!)!))), pct(secteur)],
  });
  const fois = (libelle: string, f: (k: (typeof r)[number]) => number, secteur: number, unite = "") => ({
    libelle,
    valeurs: [...trois(x, (i) => `${qte(f(r[i]!))}${unite}`), `${qte(secteur)}${unite}`],
  });
  return {
    titre: "La batterie de ratios de NOVA, face au secteur",
    colonnes: ["N", "N + 1", "N + 2", "Secteur"],
    lignes: [
      taux("Croissance du chiffre d'affaires", (k) => k.croissanceDuChiffreDAffaires, s.croissanceDuChiffreDAffaires),
      taux("Taux de valeur ajoutée", (k) => k.tauxDeValeurAjoutee, s.tauxDeValeurAjoutee),
      taux("Taux de marge brute (EBE ÷ CA)", (k) => k.tauxDeMargeBrute, s.tauxDeMargeBrute),
      taux("Taux de marge nette", (k) => k.tauxDeMargeNette, s.tauxDeMargeNette),
      taux("Rentabilité économique, après impôt", (k) => k.rentabiliteEconomique, s.rentabiliteEconomique),
      taux("Rentabilité financière", (k) => k.rentabiliteFinanciere, s.rentabiliteFinanciere),
      fois("Endettement (dettes financières ÷ capitaux propres)", (k) => k.endettement, s.endettement),
      fois("Liquidité générale", (k) => k.liquiditeGenerale, s.liquiditeGenerale),
      taux("Autonomie financière (capitaux propres ÷ total du bilan)", (k) => k.autonomie, s.autonomie),
      fois("Délai des clients", (k) => k.delaiClients, s.delaiClients, " j"),
      fois("Délai des fournisseurs", (k) => k.delaiFournisseurs, s.delaiFournisseurs, " j"),
      fois("Durée du stock de composants", (k) => k.rotationDesStocks, s.rotationDesStocks, " j"),
      taux("Taux d'investissement (investissements ÷ VA)", (k) => k.tauxDInvestissement, s.tauxDInvestissement),
      taux("Taux d'usure des immobilisations", (k) => k.tauxDUsure, s.tauxDUsure),
      fois("Couverture des emplois stables", (k) => k.couverture, s.couverture),
      fois("Capacité de remboursement (années de CAF)", (k) => k.capaciteDeRemboursement, s.capaciteDeRemboursement),
    ],
  };
}

/** Les données ESG brutes des trois exercices : ce que l'élève a pour calculer les indicateurs. */
export function donneesESG(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = diagnosticDuChapitre(c);
  const e = x.esg;
  const k = x.exercices;
  return {
    titre: "Les données extra-financières de NOVA, trois exercices",
    colonnes: k.map((y) => LIBELLES[y.code]),
    lignes: [
      { libelle: "Enceintes montées", valeurs: trois(x, (i) => qte(k[i]!.enceintes)) },
      { libelle: "Électricité consommée (kWh)", valeurs: trois(x, (i) => qte(e[i]!.kwh)) },
      { libelle: "Émissions de l'électricité (kg de CO2 équivalent)", valeurs: trois(x, (i) => qte(e[i]!.co2)) },
      { libelle: "Valeur ajoutée", valeurs: trois(x, (i) => eur(k[i]!.valeurAjoutee)) },
      { libelle: "Part des emballages valorisés", valeurs: trois(x, (i) => pct(e[i]!.partValorisee)) },
      { libelle: "Effectif", valeurs: trois(x, (i) => qte(e[i]!.effectif)) },
      { libelle: "Heures payées", valeurs: trois(x, (i) => qte(e[i]!.heuresPayees)) },
      { libelle: "Heures d'absence", valeurs: trois(x, (i) => qte(SOCIAL_DES_EXERCICES[k[i]!.code].absences)) },
      { libelle: "Accidents du travail avec arrêt", valeurs: trois(x, (i) => qte(SOCIAL_DES_EXERCICES[k[i]!.code].accidents)) },
      { libelle: "Heures de formation", valeurs: trois(x, (i) => qte(SOCIAL_DES_EXERCICES[k[i]!.code].formation)) },
      { libelle: "Part de CampusTech dans le chiffre d'affaires", valeurs: trois(x, (i) => pct(e[i]!.partDuPremierClient)) },
    ],
  };
}

/** Les indicateurs ESG des trois exercices, face au secteur. */
export function indicateursESGDuChapitre(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = diagnosticDuChapitre(c);
  const e = x.esg;
  const s = x.s;
  return {
    titre: "Les indicateurs ESG de NOVA, face au secteur",
    colonnes: ["N", "N + 1", "N + 2", "Secteur"],
    lignes: [
      { libelle: "Électricité par enceinte (kWh)", valeurs: [...trois(x, (i) => qte(e[i]!.kwhParEnceinte)), qte(s.kwhParEnceinte)] },
      { libelle: "CO2 par enceinte (kg)", valeurs: [...trois(x, (i) => qte(e[i]!.co2ParEnceinte, 4)), qte(s.co2ParEnceinte)] },
      { libelle: "Part des emballages valorisés", valeurs: [...trois(x, (i) => pct(e[i]!.partValorisee)), pct(s.partValorisee)] },
      { libelle: "Taux d'absentéisme", valeurs: [...trois(x, (i) => pct(e[i]!.absenteisme)), pct(s.absenteisme)] },
      { libelle: "Taux de fréquence des accidents", valeurs: [...trois(x, (i) => qte(e[i]!.tauxDeFrequence)), qte(s.tauxDeFrequence)] },
      { libelle: "Formation par salarié (heures)", valeurs: [...trois(x, (i) => qte(e[i]!.formationParSalarie)), qte(s.formationParSalarie)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_DIAGNOSTIC_FINANCIER: Chapitre = {
  code: "le-diagnostic-financier-et-extra-financier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "Le diagnostic financier et extra-financier",
  accroche:
    "Trois exercices de NOVA, une batterie de ratios, le secteur en face, et les données ESG. Ce que la croissance a coûté en besoin de financement, ce qu'un ratio dit et ce qu'il cache, et la conclusion qu'on en tire pour la banque comme pour les associés.",
  objectifs: [
    "Conduire la démarche d'un diagnostic : ses lecteurs, les états financiers et l'annexe, l'environnement",
    "Calculer les ratios d'activité, de profitabilité, de rentabilité, de faillite, de rotation, d'investissement et de structure",
    "Distinguer un ratio de stock d'un ratio de flux, un niveau d'un taux de croissance, et situer NOVA face à son secteur",
    "Conduire un diagnostic à partir de données ESG et juger une performance durable",
    "Discuter les limites de l'information financière et extra-financière, et rédiger une conclusion générale",
  ],
  libre: false,
  prerequis: ["soldes-intermediaires-de-gestion", "bilan-fonctionnel-et-bfr", "ratios-de-structure-et-bilan-financier"],
  ensuite: ["evaluer-un-investissement-durable"],
  entreprises: {
    codes: ENTREPRISES_DU_DIAGNOSTIC,
    pourquoi: "le diagnostic se lit sur trois exercices tenus en comptabilité, ceux de NOVA dans la simulation du cours : une seule NOVA, la même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois exercices sur la table",
      notions: ["income_statement", "balance_sheet"],
      tableau: comptesResumes,
      texte: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, sur trois exercices de NOVA. N est le premier, celui que vous avez clôturé : ${eur(x.n.production)} de chiffre d'affaires, ${eur(x.n.resultatNet)} de résultat net. En N + 1, la seconde ligne manuelle et la gamme Go et Studio arrivent, avec deux opérateurs, une augmentation de capital et les suites de Sonora et du litige. N + 2 est la deuxième année de la gamme, et celle du premier dividende.`,
          "Un diagnostic financier juge la situation d'une entreprise à partir de ses comptes : son activité, sa rentabilité, ses risques, sa structure. Un diagnostic extra-financier y ajoute ses effets sur l'environnement, sur ses salariés, et la façon dont elle est dirigée (les critères ESG). Il est multidimensionnel : aucun chiffre seul ne conclut.",
          "La démarche commence par l'environnement : un marché des enceintes qui croît, une énergie dont le prix monte, des emballages que la réglementation surveille. Puis les états financiers : le bilan, le compte de résultat et l'annexe, qui les explique. Enfin les ratios, comparés dans le temps et au secteur, et une conclusion pour le lecteur qui a commandé le diagnostic.",
        ];
      },
      repere: () => "Un ratio rapporte deux grandeurs. Il ne dit rien seul : il se compare à lui-même dans le temps, et à celui du secteur.",
    },
    {
      id: "les-lecteurs",
      objectifs: [0],
      type: "choix",
      titre: "Qui lit le diagnostic",
      notions: ["balance_sheet"],
      question: () =>
        "La banque de NOVA, ses associés, ses salariés et un grand client industriel lisent les mêmes comptes. La banque étudie un prêt pour N + 3. Qu'est-ce qui distingue ses questions de celles des associés ?",
      options: () => [
        {
          texte: "Elle cherche d'abord si NOVA pourra rembourser : solvabilité, liquidité, CAF",
          juste: true,
          retour:
            "Oui. Chaque partie prenante a sa question. La banque, le remboursement ; les associés, la rentabilité de leurs capitaux et le dividende ; les salariés, la pérennité de l'emploi et le partage de la valeur ajoutée ; le client, la solidité d'un fournisseur dont il dépend. Le diagnostic est le même, la conclusion s'adresse à un lecteur.",
        },
        {
          texte: "Rien : un diagnostic est unique, il se lit dans le même ordre et donne la même conclusion à tous",
          juste: false,
          retour: "Les chiffres sont les mêmes, pas les questions. La banque regarde d'abord le risque de ne pas être remboursée, les associés ce que rapportent leurs capitaux.",
        },
        {
          texte: "Elle juge d'abord la rentabilité des capitaux propres, dont dépend le dividende qui lui revient",
          juste: false,
          retour: "Le dividende revient aux associés, pas à la banque. Elle touche des intérêts, quelle que soit la rentabilité : ce qui compte pour elle, c'est d'être remboursée.",
        },
      ],
    },
    {
      id: "l-annexe",
      objectifs: [0],
      type: "choix",
      titre: "Ce que dit l'annexe",
      notions: ["income_statement", "depreciation"],
      tableau: comptesResumes,
      question: (c) => {
        const x = diagnosticDuChapitre(c);
        return `Le compte de résultat de N + 1 porte ${eur(x.n1.autresCharges)} de charge sur Sonora, ${eur(x.n1.reprises)} de reprises et un résultat exceptionnel de ${eur(x.n1.resultatExceptionnel)}. Où l'analyste apprend-il que ce sont les suites de risques de N, qui ne reviendront pas ?`;
      },
      options: () => [
        {
          texte: "Dans l'annexe, qui explique les dépréciations, les provisions et leur dénouement",
          juste: true,
          retour:
            "Oui. L'annexe fait partie des états financiers : elle dit les méthodes (amortissement, stocks), le détail des provisions et des dépréciations, les engagements hors bilan, le crédit-bail. Sans elle, un analyste prendrait la perte sur Sonora pour un risque récurrent, et la reprise pour un produit de l'activité.",
        },
        {
          texte: "Dans le bilan de N + 1, où la créance de Sonora apparaît encore pour sa valeur brute",
          juste: false,
          retour: "Non : la créance est sortie du bilan en N + 1, la moitié encaissée, le reste perdu. Le bilan ne dit pas pourquoi ; l'annexe le dit.",
        },
        {
          texte: "Nulle part : le compte de résultat suffit, une charge est une charge",
          juste: false,
          retour: "Une charge qui ne reviendra pas ne se lit pas comme une charge de chaque année. Le diagnostic retire ce qui est exceptionnel pour juger ce qui dure.",
        },
      ],
    },
    {
      id: "predire-la-marge",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la marge de N + 1",
      notions: ["ebitda_margin"],
      question: (c) => {
        const x = diagnosticDuChapitre(c);
        return `Avant de calculer, pariez. De N à N + 1, le chiffre d'affaires de NOVA passe de ${eur(x.n.production)} à ${eur(x.n1.production)}, et l'excédent brut d'exploitation de ${eur(x.n.excedentBrutDExploitation)} à ${eur(x.n1.excedentBrutDExploitation)}. Le taux de marge brute (EBE ÷ chiffre d'affaires)…`;
      },
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        const ecart = x.r1.tauxDeMargeBrute - x.r0.tauxDeMargeBrute;
        const voir = "Calculez les ratios d'activité à l'étape suivante, puis la profitabilité.";
        const pari = (juste: boolean) => `${juste ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Monte : l'EBE grandit plus vite", juste: ecart > 0.001, retour: pari(ecart > 0.001) },
          { texte: "Reste à peu près le même", juste: Math.abs(ecart) <= 0.001, retour: pari(Math.abs(ecart) <= 0.001) },
          { texte: "Baisse : la gamme coûte cher à lancer", juste: ecart < -0.001, retour: pari(ecart < -0.001) },
        ];
      },
    },
    {
      id: "les-ratios-d-activite",
      objectifs: [1, 2],
      type: "montants",
      titre: "Les ratios d'activité",
      notions: ["income_statement"],
      tableau: comptesResumes,
      question: () =>
        "Deux ratios d'activité, en pour cent au centième. Le taux de croissance du chiffre d'affaires : (CA de l'année − CA de l'année précédente) ÷ CA de l'année précédente × 100, pour N + 1 et N + 2. Le taux de valeur ajoutée : valeur ajoutée ÷ production × 100, pour les trois exercices.",
      champs: (c) => {
        const x = diagnosticDuChapitre(c);
        const croissance = (a: number, b: number, t: number) => `(${eur(b)} − ${eur(a)}) ÷ ${eur(a)} × 100 = ${pct(t)}`;
        const va = (k: typeof x.n, t: number) => `${eur(k.valeurAjoutee)} ÷ ${eur(k.production)} × 100 = ${pct(t)}`;
        return [
          { libelle: "Croissance du chiffre d'affaires en N + 1 (%)", attendu: enPourcent(x.r1.croissanceDuChiffreDAffaires!), calcul: croissance(x.n.production, x.n1.production, x.r1.croissanceDuChiffreDAffaires!), tolerance: 0.01 },
          { libelle: "Croissance du chiffre d'affaires en N + 2 (%)", attendu: enPourcent(x.r2.croissanceDuChiffreDAffaires!), calcul: croissance(x.n1.production, x.n2.production, x.r2.croissanceDuChiffreDAffaires!), tolerance: 0.01 },
          { libelle: "Taux de valeur ajoutée en N (%)", attendu: enPourcent(x.r0.tauxDeValeurAjoutee), calcul: va(x.n, x.r0.tauxDeValeurAjoutee), tolerance: 0.01 },
          { libelle: "Taux de valeur ajoutée en N + 1 (%)", attendu: enPourcent(x.r1.tauxDeValeurAjoutee), calcul: va(x.n1, x.r1.tauxDeValeurAjoutee), tolerance: 0.01 },
          { libelle: "Taux de valeur ajoutée en N + 2 (%)", attendu: enPourcent(x.r2.tauxDeValeurAjoutee), calcul: va(x.n2, x.r2.tauxDeValeurAjoutee), tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          `NOVA croît vite, ${pct(x.r1.croissanceDuChiffreDAffaires!)} puis ${pct(x.r2.croissanceDuChiffreDAffaires!)}, quand le secteur croît de ${pct(x.s.croissanceDuChiffreDAffaires)} : la gamme et la seconde ligne portent la croissance, qui ralentit déjà. Un taux de croissance compare deux flux d'années différentes ; un taux de valeur ajoutée, deux flux de la même année : un niveau.`,
          `Le taux de valeur ajoutée monte, de ${pct(x.r0.tauxDeValeurAjoutee)} à ${pct(x.r2.tauxDeValeurAjoutee)}, mais reste sous le secteur (${pct(x.s.tauxDeValeurAjoutee)}) : NOVA assemble des composants qu'elle achète, et son loyer pèse dans ses consommations. Il monte parce que le loyer, fixe, se répartit sur plus de ventes. Le taux de marge brute, lui, ${Math.abs(x.r1.tauxDeMargeBrute - x.r0.tauxDeMargeBrute) <= 0.001 ? "n'a presque pas bougé en N + 1" : "a bougé en N + 1"} : le lancement de la gamme, sa publicité et ses deux opérateurs ont absorbé la croissance.`,
        ];
      },
    },
    {
      id: "profitabilite-et-rentabilite",
      objectifs: [1],
      type: "montants",
      titre: "Profitabilité et rentabilité de N + 2",
      notions: ["ebitda_margin", "profitability_vs_return"],
      tableau: bilansResumes,
      question: () =>
        "Pour N + 2, en pour cent au centième : le taux de marge brute (EBE ÷ chiffre d'affaires) et le taux de marge nette (résultat net ÷ chiffre d'affaires), deux ratios de profitabilité. Puis l'actif économique (immobilisations nettes + besoin en fonds de roulement d'exploitation), la rentabilité économique (résultat d'exploitation × (1 − 25 %) ÷ actif économique) et la rentabilité financière (résultat net ÷ capitaux propres).",
      champs: (c) => {
        const x = diagnosticDuChapitre(c);
        const k = x.n2;
        const r = x.r2;
        return [
          { libelle: "Taux de marge brute (%)", attendu: enPourcent(r.tauxDeMargeBrute), calcul: `${eur(k.excedentBrutDExploitation)} ÷ ${eur(k.production)} × 100 = ${pct(r.tauxDeMargeBrute)}`, tolerance: 0.01 },
          { libelle: "Taux de marge nette (%)", attendu: enPourcent(r.tauxDeMargeNette), calcul: `${eur(k.resultatNet)} ÷ ${eur(k.production)} × 100 = ${pct(r.tauxDeMargeNette)}`, tolerance: 0.01 },
          {
            libelle: "Actif économique",
            attendu: r.actifEconomique,
            calcul: `(${eur(k.immobilisationsBrutes)} − ${eur(k.amortissements)}) + ${eur(k.besoinDExploitation)} = ${eur(r.actifEconomique)}`,
            tolerance: 1,
          },
          {
            libelle: "Rentabilité économique (%)",
            attendu: enPourcent(r.rentabiliteEconomique),
            calcul: `${eur(k.resultatDExploitation)} × 0,75 ÷ ${eur(r.actifEconomique)} × 100 = ${pct(r.rentabiliteEconomique)}`,
            tolerance: 0.01,
          },
          { libelle: "Rentabilité financière (%)", attendu: enPourcent(r.rentabiliteFinanciere), calcul: `${eur(k.resultatNet)} ÷ ${eur(k.capitauxPropres)} × 100 = ${pct(r.rentabiliteFinanciere)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = diagnosticDuChapitre(c);
        const r = x.r2;
        return [
          `La profitabilité rapporte un résultat au chiffre d'affaires : NOVA garde ${pct(r.tauxDeMargeBrute)} de ses ventes en EBE, au-dessus du secteur (${pct(x.s.tauxDeMargeBrute)}) pour la première fois. La rentabilité rapporte un résultat aux capitaux engagés : ${pct(r.rentabiliteEconomique)} sur l'actif économique, ${pct(r.rentabiliteFinanciere)} sur les capitaux propres.`,
          `La rentabilité économique est très haute parce que l'actif économique est petit : NOVA loue ses locaux et ses lignes coûtent peu. La rentabilité financière est plus basse qu'elle : sans dette à faire jouer, et avec une trésorerie de ${eur(x.n2.tresorerieNette)} qui ne rapporte rien, les capitaux propres financent bien plus que l'actif économique.`,
        ];
      },
    },
    {
      id: "stock-ou-flux",
      objectifs: [2],
      type: "tri",
      titre: "Un stock ou un flux",
      notions: ["balance_sheet", "income_statement"],
      question: () =>
        "Un ratio rapporte des grandeurs de deux natures. Un stock se lit au bilan, à une date (le 31 décembre). Un flux s'accumule sur l'exercice (le compte de résultat, les investissements de l'année). Rangez chaque grandeur de N + 2.",
      categories: [
        { code: "stock", libelle: "Un stock, lu à une date" },
        { code: "flux", libelle: "Un flux, cumulé sur l'année" },
      ],
      elements: (c) => {
        const x = diagnosticDuChapitre(c);
        const k = x.n2;
        return [
          { libelle: "Le chiffre d'affaires", montant: k.production, categorie: "flux", pourquoi: "Les ventes de janvier à décembre : un flux. Le délai des clients le rapporte à un stock, les créances du 31 décembre." },
          { libelle: "Les capitaux propres", montant: k.capitauxPropres, categorie: "stock", pourquoi: "Ce que les associés ont apporté et laissé, au 31 décembre : un stock. La rentabilité financière lui rapporte un flux, le résultat." },
          { libelle: "Les créances clients", montant: k.clientsBruts, categorie: "stock", pourquoi: "Ce que les clients doivent ce jour-là : un stock, qui change dès le lendemain." },
          { libelle: "La capacité d'autofinancement", montant: k.caf, categorie: "flux", pourquoi: "Ce que l'activité de l'année a dégagé : un flux. La capacité de remboursement lui rapporte un stock, la dette." },
          { libelle: "Les dettes financières", montant: k.dettesFinancieres, categorie: "stock", pourquoi: "Le capital restant dû au 31 décembre : un stock. L'endettement le rapporte à un autre stock, les capitaux propres." },
          { libelle: "L'excédent brut d'exploitation", montant: k.excedentBrutDExploitation, categorie: "flux", pourquoi: "Un solde du compte de résultat : un flux. Le taux de marge brute le rapporte à un autre flux, le chiffre d'affaires." },
          { libelle: "Le stock de composants", montant: k.stocks, categorie: "stock", pourquoi: "Ce qu'il y a dans l'atelier au 31 décembre : un stock, que sa durée rapporte à un flux, les consommations." },
          { libelle: "Les investissements de l'année", montant: k.investissements, categorie: "flux", pourquoi: "Ce qui a été acheté dans l'année : un flux, que le taux d'investissement rapporte à la valeur ajoutée." },
        ];
      },
      relance: "Cette grandeur se lit-elle un jour donné, au bilan, ou s'additionne-t-elle sur toute l'année ?",
      explication: () => [
        "Trois sortes de ratios en sortent. Un flux sur un flux (la marge, le taux de valeur ajoutée) se compare d'une année à l'autre sans souci. Un stock sur un stock (l'endettement, la liquidité) est une photo du 31 décembre. Un stock sur un flux (un délai, une rentabilité) mêle les deux : une créance du 31 décembre face aux ventes de toute l'année.",
        "Et chacun se lit en niveau (le taux de marge de N + 2) ou en taux de croissance (la croissance du chiffre d'affaires) : un niveau situe, un taux de croissance dit la tendance.",
      ],
    },
    {
      id: "les-ratios-de-faillite",
      objectifs: [1],
      type: "montants",
      titre: "Les ratios de faillite de N + 2",
      notions: ["balance_sheet", "frng"],
      tableau: bilansResumes,
      question: () =>
        "Sans formule cette fois, sur le bilan de N + 2 : l'endettement (en fois, au centième), la liquidité générale (en fois, au centième), l'autonomie financière (en pour cent, au centième) et la capacité de remboursement (en années de CAF, au centième).",
      champs: (c) => {
        const x = diagnosticDuChapitre(c);
        const k = x.n2;
        const r = x.r2;
        const b = r.bilan;
        return [
          { libelle: "Endettement", attendu: r.endettement, calcul: `${eur(k.dettesFinancieres)} de dettes financières ÷ ${eur(k.capitauxPropres)} de capitaux propres = ${qte(r.endettement)}`, tolerance: 0.01 },
          { libelle: "Liquidité générale", attendu: r.liquiditeGenerale, calcul: `${eur(b.actifCirculant)} d'actif circulant ÷ ${eur(b.dettesAMoinsDUnAn)} de dettes à moins d'un an = ${qte(r.liquiditeGenerale)}`, tolerance: 0.01 },
          { libelle: "Autonomie financière (%)", attendu: enPourcent(r.autonomie), calcul: `${eur(k.capitauxPropres)} ÷ ${eur(b.totalActif)} de total du bilan × 100 = ${pct(r.autonomie)}`, tolerance: 0.01 },
          { libelle: "Capacité de remboursement", attendu: r.capaciteDeRemboursement, calcul: `${eur(k.dettesFinancieres)} ÷ ${eur(k.caf)} de CAF = ${qte(r.capaciteDeRemboursement)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = diagnosticDuChapitre(c);
        const r = x.r2;
        return [
          `Aucun risque de faillite : NOVA doit ${qte(r.endettement)} fois ses capitaux propres (le secteur ${qte(x.s.endettement)}), son actif circulant couvre ${qte(r.liquiditeGenerale)} fois ses dettes à court terme (${qte(x.s.liquiditeGenerale)}), et une année de CAF rembourserait plusieurs fois son emprunt.`,
          "C'est un point fort pour la banque, et une question pour les associés : une entreprise aussi peu endettée et aussi liquide finance tout par ses capitaux propres, et garde une trésorerie qui ne rapporte rien. Le ratio dit la sécurité ; il ne dit pas si elle est bien employée.",
        ];
      },
    },
    {
      id: "rotation-et-investissement",
      objectifs: [1],
      type: "montants",
      titre: "Rotation et investissement",
      notions: ["payment_terms", "stock_rotation"],
      tableau: bilansResumes,
      question: (c) => {
        const x = diagnosticDuChapitre(c);
        return `Sur 360 jours, au centième. En N + 2 : le délai des clients (créances ÷ chiffre d'affaires toutes taxes comprises × 360) et la durée du stock (stock ÷ composants consommés, ${eur(x.n2.composantsConsommes)}, × 360). Puis, en pour cent au centième, le taux d'investissement de N + 1 (investissements ÷ valeur ajoutée) et le taux d'usure de N + 2 (amortissements cumulés ÷ immobilisations brutes).`;
      },
      champs: (c) => {
        const x = diagnosticDuChapitre(c);
        const k = x.n2;
        return [
          { libelle: "Délai des clients en N + 2 (jours)", attendu: x.r2.delaiClients, calcul: `${eur(k.clientsBruts)} ÷ (${eur(k.production)} × 1,2) × 360 = ${jours(x.r2.delaiClients)}`, tolerance: 0.05 },
          { libelle: "Durée du stock en N + 2 (jours)", attendu: x.r2.rotationDesStocks, calcul: `${eur(k.stocks)} ÷ ${eur(k.composantsConsommes)} × 360 = ${jours(x.r2.rotationDesStocks)}`, tolerance: 0.05 },
          { libelle: "Taux d'investissement de N + 1 (%)", attendu: enPourcent(x.r1.tauxDInvestissement), calcul: `${eur(x.n1.investissements)} ÷ ${eur(x.n1.valeurAjoutee)} × 100 = ${pct(x.r1.tauxDInvestissement)}`, tolerance: 0.01 },
          { libelle: "Taux d'usure de N + 2 (%)", attendu: enPourcent(x.r2.tauxDUsure), calcul: `${eur(k.amortissements)} ÷ ${eur(k.immobilisationsBrutes)} × 100 = ${pct(x.r2.tauxDUsure)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          `Le délai des clients passe de ${jours(x.r0.delaiClients)} en N à ${jours(x.r2.delaiClients)} en N + 2, et le stock de ${jours(x.r0.rotationDesStocks)} à ${jours(x.r2.rotationDesStocks)}. Les chaînes de hi-fi paient à 60 jours, la gamme demande du stock. Le besoin d'exploitation grandit bien plus vite que le chiffre d'affaires : de ${eur(x.n.besoinDExploitation)} à ${eur(x.n2.besoinDExploitation)}.`,
          `NOVA a beaucoup investi en N + 1 (${pct(x.r1.tauxDInvestissement)} de sa valeur ajoutée, le secteur ${pct(x.s.tauxDInvestissement)}), presque rien en N + 2. Son taux d'usure monte vite, ${pct(x.r2.tauxDUsure)} : un composant de la seconde ligne s'amortit sur 3 ans. Il faudra renouveler.`,
        ];
      },
    },
    {
      id: "face-au-secteur",
      objectifs: [2],
      type: "choix",
      titre: "NOVA face à son secteur",
      notions: ["bfr", "payment_terms"],
      tableau: batterieDeRatios,
      question: () => "Voici la batterie complète, sur trois exercices et face au secteur. Quel constat est juste ?",
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          {
            texte: "Le délai des clients et le stock rattrapent le secteur : le besoin croît plus vite que les ventes",
            juste: true,
            retour: `Oui. Encore sous le secteur, le délai des clients (${jours(x.r2.delaiClients)} contre ${jours(x.s.delaiClients)}) et la durée du stock (${jours(x.r2.rotationDesStocks)} contre ${jours(x.s.rotationDesStocks)}) montent vite : la tendance compte autant que le niveau. Le besoin a été multiplié par ${qte(auCentime(x.n2.besoinDExploitation / x.n.besoinDExploitation), 1)} quand le chiffre d'affaires l'a été par ${qte(auCentime(x.n2.production / x.n.production), 1)}.`,
          },
          {
            texte: "Le délai des clients reste sous la moyenne du secteur : le besoin en fonds de roulement n'est donc pas un sujet",
            juste: false,
            retour: "Le niveau rassure, la tendance non : le délai a presque doublé en deux ans. Un diagnostic lit la comparaison au secteur et l'évolution, ensemble.",
          },
          {
            texte: "NOVA est plus endettée que son secteur, et sa liquidité est fragile",
            juste: false,
            retour: `C'est l'inverse : ${qte(x.r2.endettement)} d'endettement contre ${qte(x.s.endettement)}, ${qte(x.r2.liquiditeGenerale)} de liquidité générale contre ${qte(x.s.liquiditeGenerale)}.`,
          },
          {
            texte: "Le taux de valeur ajoutée, sous le secteur, prouve que NOVA perd de l'argent",
            juste: false,
            retour: `Non : un taux de valeur ajoutée bas dit un métier d'assembleur, qui achète beaucoup ; la marge nette de NOVA (${pct(x.r2.tauxDeMargeNette)}) dépasse celle du secteur.`,
          },
        ];
      },
    },
    {
      id: "predire-le-dividende",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le dividende",
      notions: ["profitability_vs_return"],
      question: () =>
        `Avant le laboratoire, pariez. Les associés demandent plus que ${eur(DIVIDENDE_PAR_ACTION_EN_N_PLUS_2)} par action en N + 2. Si NOVA leur versait 3 € par action, sans rien changer à son activité, sa rentabilité financière de N + 2…`,
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        const apres = laboratoireDuDiagnostic({ delaiClients: SOLUTION_DU_DIAGNOSTIC.delaiClients, dividende: 3 }).ratios.rentabiliteFinanciere;
        const voir = "Faites-le dans le laboratoire : le dividende et le délai des clients de N + 2.";
        return [
          { texte: "Ne bougerait pas : le résultat est le même", juste: apres === x.r2.rentabiliteFinanciere, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monterait", juste: apres > x.r2.rentabiliteFinanciere, retour: `Bon pari. ${voir}` },
          { texte: "Baisserait : l'argent sort de l'entreprise", juste: apres < x.r2.rentabiliteFinanciere, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-diagnostic",
      objectifs: [2, 4],
      type: "simulation",
      titre: "Le laboratoire du diagnostic",
      notions: ["profitability_vs_return", "bfr", "net_treasury"],
      question: () =>
        "Rejouez le bilan de N + 2 avec un autre dividende (versé en mai, sur le résultat de N + 1) et un autre délai des clients. Le résultat ne bouge pas : regardez ce que font les ratios. Relevez le défi.",
      leviers: () => [
        { code: "delaiClients", libelle: "Délai des clients en N + 2", unite: "jours", ...LEVIERS_DU_DIAGNOSTIC.delai, depart: BESOIN_POSE["N+2"].delaiClients },
        { code: "dividende", libelle: "Dividende par action", unite: "€", ...LEVIERS_DU_DIAGNOSTIC.dividende, depart: DIVIDENDE_PAR_ACTION_EN_N_PLUS_2 },
      ],
      lecture: (c, p) => {
        const x = diagnosticDuChapitre(c);
        const l = laboratoireDuDiagnostic(p);
        const e = l.exercice;
        const r = l.ratios;
        return [
          { libelle: "Résultat net de N + 2", montant: e.resultatNet, reference: x.n2.resultatNet },
          { libelle: "Dividende versé", montant: e.dividendes, reference: x.n2.dividendes },
          { libelle: "Besoin en fonds de roulement d'exploitation", montant: e.besoinDExploitation, reference: x.n2.besoinDExploitation },
          { libelle: "Trésorerie nette", montant: e.tresorerieNette, reference: x.n2.tresorerieNette, fort: true },
          { libelle: "Rentabilité financière", montant: enPourcent(r.rentabiliteFinanciere), unite: "%", reference: enPourcent(x.r2.rentabiliteFinanciere), fort: true },
          { libelle: "Autonomie financière", montant: enPourcent(r.autonomie), unite: "%", reference: enPourcent(x.r2.autonomie) },
          { libelle: "Liquidité générale", montant: r.liquiditeGenerale, unite: "fois", reference: x.r2.liquiditeGenerale },
          { libelle: "La trésorerie, face au départ", montant: auCentime(e.tresorerieNette - x.n2.tresorerieNette), reference: 0, effet: true },
        ];
      },
      defi: () => ({
        consigne: `Les associés veulent une rentabilité financière d'au moins ${pct(RENTABILITE_DEMANDEE)} ; le dirigeant veut garder au moins ${eur(TRESORERIE_A_GARDER)} de trésorerie nette. Trouvez une position qui satisfait les deux.`,
        atteint: (p) => {
          const l = laboratoireDuDiagnostic(p);
          return l.ratios.rentabiliteFinanciere >= RENTABILITE_DEMANDEE && l.exercice.tresorerieNette >= TRESORERIE_A_GARDER;
        },
        indice: (p) => {
          const l = laboratoireDuDiagnostic(p);
          if (l.ratios.rentabiliteFinanciere < RENTABILITE_DEMANDEE) return `La rentabilité financière n'est que de ${pct(l.ratios.rentabiliteFinanciere)}. Le résultat ne bougera pas : quelle grandeur du ratio pouvez-vous faire baisser ?`;
          return `La trésorerie nette tombe à ${eur(l.exercice.tresorerieNette)}. Un dividende plus petit, ou des clients qui paient plus vite, la relèvent.`;
        },
        solution: { ...SOLUTION_DU_DIAGNOSTIC },
      }),
      graphique: () => ({
        levier: "dividende",
        unite: "%",
        courbes: [
          { libelle: "Rentabilité financière de N + 2", valeur: (p) => enPourcent(laboratoireDuDiagnostic(p).ratios.rentabiliteFinanciere) },
          { libelle: "Moyenne du secteur", valeur: () => enPourcent(MOYENNES_DU_SECTEUR.rentabiliteFinanciere) },
        ],
      }),
      explication: (c, p) => {
        const x = diagnosticDuChapitre(c);
        const l = laboratoireDuDiagnostic(p);
        return [
          `À ${eur(p.dividende!)} par action, ${eur(l.exercice.dividendes)} sortent : les capitaux propres baissent d'autant, et la rentabilité financière monte de ${pct(x.r2.rentabiliteFinanciere)} à ${pct(l.ratios.rentabiliteFinanciere)}, sans un euro de résultat en plus. La trésorerie nette, ${eur(l.exercice.tresorerieNette)}, paie la différence.`,
          `Le délai des clients ne change ni le résultat ni la rentabilité financière : il déplace la trésorerie vers les créances. C'est une limite des ratios : un ratio s'améliore quand son dénominateur baisse, que l'entreprise aille mieux ou non. Chaque euro de dividende par action fait sortir ${eur(ACTIONS_APRES_L_AUGMENTATION)} : NOVA paraît plus rentable, et devient moins autonome.`,
        ];
      },
    },
    {
      id: "les-donnees-esg",
      type: "lecture",
      titre: "Les données extra-financières",
      notions: ["csr_index"],
      tableau: donneesESG,
      texte: () => [
        "Le diagnostic extra-financier lit des données qui ne sont pas dans les comptes : l'électricité, les émissions, les déchets, les heures d'absence, les accidents, la formation, la dépendance à un client. Elles se rangent selon trois critères : l'environnement (E), le social (S) et la gouvernance (G).",
        `Ce que la simulation suppose : la chaîne consomme ${qte(KWH_PAR_ENCEINTE)} kWh par enceinte montée, le bâtiment ${qte(KWH_DU_BATIMENT_PAR_MOIS)} kWh par mois ; dès N + 1, les équipements d'efficacité de la seconde ligne en économisent ${qte(KWH_ECONOMISES_PAR_AN)} par an. L'électricité du réseau émet ${qte(KG_CO2_PAR_KWH, 3)} kg de CO2 par kWh. Comme un ratio financier, un indicateur ESG se rapporte à une grandeur de l'activité (une intensité) pour se comparer d'une année à l'autre et au secteur.`,
        "La performance durable croise les deux lectures : une entreprise qui gagne de l'argent en abîmant son outil humain ou son environnement prépare des coûts futurs (des départs, des accidents, une énergie plus chère, une réglementation plus stricte).",
      ],
      repere: () => "Une intensité (par enceinte, par millier d'euros de valeur ajoutée) se compare dans le temps ; un total dit l'empreinte réelle.",
    },
    {
      id: "les-indicateurs-esg",
      objectifs: [3],
      type: "montants",
      titre: "Les indicateurs ESG",
      notions: ["csr_index"],
      tableau: donneesESG,
      question: () =>
        "Calculez, pour N + 2 : l'électricité par enceinte (kWh, au centième), le CO2 par enceinte (kg, au dix-millième) et le CO2 par millier d'euros de valeur ajoutée (kg, au centième). Puis le taux d'absentéisme de N + 1 (heures d'absence ÷ heures payées, en pour cent au centième).",
      champs: (c) => {
        const x = diagnosticDuChapitre(c);
        const e = x.e2;
        const k = x.n2;
        return [
          { libelle: "Électricité par enceinte en N + 2 (kWh)", attendu: e.kwhParEnceinte, calcul: `${qte(e.kwh)} kWh ÷ ${qte(k.enceintes)} enceintes = ${qte(e.kwhParEnceinte)} kWh`, tolerance: 0.01 },
          { libelle: "CO2 par enceinte en N + 2 (kg)", attendu: e.co2ParEnceinte, calcul: `${qte(e.co2)} kg ÷ ${qte(k.enceintes)} enceintes = ${qte(e.co2ParEnceinte, 4)} kg`, tolerance: 0.0001 },
          {
            libelle: "CO2 par millier d'euros de valeur ajoutée en N + 2 (kg)",
            attendu: e.co2ParMilleEurosDeValeurAjoutee,
            calcul: `${qte(e.co2)} kg ÷ ${qte(auCentime(k.valeurAjoutee / 1_000))} milliers d'euros = ${qte(e.co2ParMilleEurosDeValeurAjoutee)} kg`,
            tolerance: 0.01,
          },
          {
            libelle: "Taux d'absentéisme de N + 1 (%)",
            attendu: enPourcent(x.e1.absenteisme),
            calcul: `${qte(SOCIAL_DES_EXERCICES["N+1"].absences)} heures ÷ ${qte(x.e1.heuresPayees)} heures payées × 100 = ${pct(x.e1.absenteisme)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          `L'électricité par enceinte tombe de ${qte(x.e0.kwhParEnceinte)} kWh en N à ${qte(x.e2.kwhParEnceinte)} kWh en N + 2 (le secteur ${qte(x.s.kwhParEnceinte)}) : le bâtiment se partage sur plus d'enceintes, et les équipements d'efficacité économisent. L'absentéisme de N + 1, ${pct(x.e1.absenteisme)}, a dépassé le seuil d'alerte de 3 % l'année où l'équipe a grandi, avant de redescendre.`,
        ];
      },
    },
    {
      id: "performance-durable",
      objectifs: [3],
      type: "choix",
      titre: "Une performance durable ?",
      notions: ["csr_index"],
      tableau: indicateursESGDuChapitre,
      question: (c) => {
        const x = diagnosticDuChapitre(c);
        return `De N à N + 2, le CO2 par enceinte baisse de ${qte(x.e0.co2ParEnceinte, 4)} à ${qte(x.e2.co2ParEnceinte, 4)} kg, mais les émissions totales passent de ${qte(x.e0.co2)} à ${qte(x.e2.co2)} kg. Que conclure ?`;
      },
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          {
            texte: "L'intensité s'améliore, l'empreinte grandit avec l'activité : les deux se lisent ensemble",
            juste: true,
            retour: `Oui. NOVA produit plus proprement chaque enceinte, mais en produit ${qte(x.n2.enceintes - x.n.enceintes)} de plus. Un indicateur d'intensité juge l'efficacité ; le total dit ce que l'entreprise pèse vraiment. Avec ses emballages valorisés à ${pct(x.e2.partValorisee)} et une formation qui progresse, la trajectoire est bonne, pas achevée.`,
          },
          {
            texte: "NOVA pollue davantage : sa performance environnementale se dégrade, quoi qu'en dise l'indicateur par enceinte",
            juste: false,
            retour: "Le total monte, mais chaque enceinte émet moins : juger sur le seul total condamnerait toute croissance. Les deux lectures sont nécessaires.",
          },
          {
            texte: "Seul l'indicateur par enceinte compte : NOVA a atteint ses objectifs",
            juste: false,
            retour: "Une intensité qui baisse peut cacher une empreinte qui monte. Ici, les émissions totales grandissent : l'objectif n'est atteint que si NOVA s'en était fixé un en intensité.",
          },
        ];
      },
    },
    {
      id: "les-limites",
      objectifs: [4],
      type: "choix",
      titre: "Ce que les chiffres ne disent pas",
      notions: ["csr_index"],
      tableau: indicateursESGDuChapitre,
      question: (c) => {
        const x = diagnosticDuChapitre(c);
        return `Le taux de fréquence des accidents de N + 1 est de ${qte(x.e1.tauxDeFrequence)}, quand le secteur est à ${qte(x.s.tauxDeFrequence)}. Un administrateur s'alarme : « NOVA est une entreprise dangereuse. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          {
            texte: `Sur ${x.e1.effectif} salariés, ${SOCIAL_DES_EXERCICES["N+1"].accidents} accidents font ce taux : il se lit avec les chiffres bruts`,
            juste: true,
            retour:
              "Oui. Un taux par million d'heures sur une petite équipe bondit au premier accident : il faut lire le nombre, la gravité, les causes, et la tendance (aucun accident en N + 2). C'est une limite générale : un ratio réduit l'information. Les comptes sont une photo du 31 décembre, aux coûts historiques ; le secteur mêle des entreprises différentes ; les données ESG d'une petite entreprise ne sont ni normalisées ni auditées.",
          },
          {
            texte: "Il a raison : un taux de fréquence se compare directement au secteur, quelle que soit la taille de l'équipe",
            juste: false,
            retour: "Un taux calculé sur quelques milliers d'heures varie énormément d'une année à l'autre : un accident de plus ou de moins le fait tripler ou s'annuler.",
          },
          {
            texte: "Le chiffre ne compte pas : les indicateurs sociaux n'entrent pas dans un diagnostic financier",
            juste: false,
            retour: "Ils y entrent : le programme demande un diagnostic à partir de données financières et ESG. Un accident coûte (un arrêt, un remplacement, une cotisation plus chère) et dit quelque chose de l'organisation du travail.",
          },
        ];
      },
    },
    {
      id: "la-conclusion",
      objectifs: [4],
      type: "choix",
      titre: "La conclusion générale",
      notions: ["balance_sheet", "bfr", "csr_index"],
      tableau: batterieDeRatios,
      question: () => "La banque attend votre conclusion générale, en quelques lignes. Laquelle rendez-vous ?",
      options: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          {
            texte: `Rentable, solvable et sobre en énergie ; à surveiller : le besoin, qui croît plus vite que les ventes`,
            juste: true,
            retour: `C'est la conclusion qu'appellent les chiffres. Une croissance forte et profitable (${pct(x.r2.tauxDeMargeNette)} de marge nette), une structure très solide (${qte(x.r2.endettement)} d'endettement), des indicateurs ESG qui progressent. Et deux points de vigilance : le besoin d'exploitation, multiplié par ${qte(auCentime(x.n2.besoinDExploitation / x.n.besoinDExploitation), 1)}, et l'usure rapide de l'outil. Une conclusion répond à son lecteur : à la banque, NOVA peut emprunter.`,
          },
          {
            texte: "Une entreprise en difficulté : sa valeur ajoutée reste sous le secteur et son besoin explose, la banque ne doit pas prêter",
            juste: false,
            retour: "C'est ne retenir que deux chiffres sur seize : la marge, la rentabilité, la solvabilité et la trésorerie disent le contraire. Une conclusion pèse l'ensemble.",
          },
          {
            texte: "Tous les ratios sont meilleurs que ceux du secteur : rien à signaler, aucun point de vigilance",
            juste: false,
            retour: "Non : le taux de valeur ajoutée est sous le secteur, et la tendance du délai des clients, du stock et de l'usure appelle une vigilance. Une conclusion sans réserve n'est pas un diagnostic.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "balance_sheet", "csr_index"],
      tableau: batterieDeRatios,
      texte: (c) => {
        const x = diagnosticDuChapitre(c);
        return [
          `Vous avez conduit le diagnostic de NOVA sur trois exercices. Un chiffre d'affaires de ${eur(x.n.production)} à ${eur(x.n2.production)}, une marge brute qui passe de ${pct(x.r0.tauxDeMargeBrute)} à ${pct(x.r2.tauxDeMargeBrute)}. Une structure très peu endettée, un besoin d'exploitation qui grandit plus vite que les ventes, et des indicateurs ESG qui progressent en intensité.`,
          "Le laboratoire l'a montré : un ratio bouge quand son dénominateur bouge, que l'entreprise aille mieux ou non. Un ratio se compare, se commente, et se croise avec les autres.",
          "Au niveau de l'examen, vous savez mener la démarche d'un diagnostic pour un lecteur, lire les états financiers et l'annexe, calculer et classer les ratios des sept familles. Vous savez distinguer stock et flux, niveau et taux de croissance, comparer au secteur, intégrer les indicateurs ESG, en discuter les limites, et rédiger une conclusion générale.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Activité : croissance, taux de valeur ajoutée. Profitabilité : EBE ou résultat ÷ CA. Rentabilité : résultat ÷ capitaux engagés. Faillite : endettement, liquidité, autonomie. Rotation : délais en jours. Investissement : investissements ÷ VA, usure. Structure : couverture, indépendance, capacité de remboursement.",
    },
  ],
};
