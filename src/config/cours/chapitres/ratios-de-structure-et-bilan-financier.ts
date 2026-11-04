import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  BAISSE_DE_LA_CAF_TESTEE,
  DEPART_DE_LA_STRUCTURE,
  DUREE_DU_NOUVEL_EMPRUNT,
  ENTREPRISES_DE_LA_STRUCTURE,
  INVESTISSEMENT_DE_LA_GAMME,
  MATELAS_DU_COMPTE_COURANT,
  PART_DU_PRIX_NEUF_A_LA_REVENTE,
  REGLES_DE_LA_BANQUE,
  defiDeLaStructure,
  empruntMinimalDeLaGamme,
  ficheDeLaStructure,
  investissementComptant,
  investissementComptantMaximal,
  structureApres,
  structureDeNova,
  type PositionDeLaStructure,
  type StructureDeNova,
} from "../monde/structure-financiere";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : RATIOS DE STRUCTURE ET BILAN FINANCIER (comptabilité générale, palier 4 ; BTS CG P6,
 * 6.3.2 et 6.4.1 ; DCG UE6).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le bilan de NOVA au 31 décembre de son premier exercice,
 * celui du chapitre « Bilan fonctionnel et BFR », et sa capacité d'autofinancement, celle du chapitre
 * « Soldes intermédiaires de gestion et CAF ». Tous les chiffres se calculent dans
 * monde/structure-financiere.ts ; les règles des banques sont celles du cours (config/cours/financement.ts).
 *
 * L'objet : deux lectures du même bilan. Les ratios de structure, sur le bilan fonctionnel (la
 * couverture des emplois stables, l'indépendance financière, l'endettement, la capacité de
 * remboursement, et jusqu'où emprunter) ; puis le bilan financier, selon la liquidité et
 * l'exigibilité (les reclassements, une moins-value latente, le fonds de roulement financier, la
 * liquidité, la solvabilité, l'autonomie), et le risque de défaillance.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, couverture-et-independance, endettement-et-capacite (la formule est dans la
 *     question) ;
 *   · autonome : jusqu-ou-emprunter, le-bilan-financier (un tableau à compléter), solvabilite-et-autonomie ;
 *   · l'expérience avant la formule : predire-l-investissement puis l-investissement-au-curseur (un
 *     investissement payé comptant, le fonds de roulement financier face au compte courant) avant
 *     le-fonds-de-roulement-financier ; predire-l-emprunt puis le-laboratoire-de-la-banque (investir,
 *     emprunter, apporter, et une mauvaise année ; un graphique des dettes face au plafond de la
 *     capacité de remboursement) ;
 *   · expert : la-regle-qui-bloque, la-liquidite-immediate, le-risque-de-defaillance,
 *     fonctionnel-ou-financier ; puis la synthèse.
 */

/** Les bornes du curseur de l'investissement payé comptant, en milliers d'euros. */
export const INVESTISSEMENT_DU_CURSEUR = { min: 0, max: 300 } as const;

/** L'emprunt que le dirigeant voudrait demander (hypothèse du chapitre) : entre ce que permet l'endettement et ce que permet l'indépendance. */
export const EMPRUNT_DEMANDE = 175_000;

/** Les leviers du laboratoire. */
export const LEVIERS_DE_LA_STRUCTURE = {
  investissement: { min: 0, max: 250_000, pas: 10_000 },
  emprunt: { min: 0, max: 200_000, pas: 5_000 },
  apport: { min: 0, max: 100_000, pas: 5_000 },
  baisse: { min: 0, max: 80, pas: 10 },
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
/** « 0,65 an », « 3,63 ans ». */
const ans = (x: number) => `${qte(x)} ${x < 2 ? "an" : "ans"}`;
const donnee = (valeur: number): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** La structure de NOVA au 31 décembre, pour un cas. */
export const structureDuCas = (c: Pick<Cas, "code">): StructureDeNova => structureDeNova(ficheDeLaStructure(c.code));

const position = (p: Readonly<Record<string, number>>): PositionDeLaStructure => ({ investissement: p.investissement ?? 0, emprunt: p.emprunt ?? 0, apport: p.apport ?? 0, baisse: p.baisse ?? 0 });

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Le haut du bilan fonctionnel et la CAF : ce que les ratios de structure lisent. */
function hautDuBilan(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = structureDuCas(c);
  return {
    titre: `Le haut du bilan fonctionnel de ${s.entreprise} au 31 décembre, et sa CAF`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Emplois stables : la ligne de montage, valeur brute", valeurs: [eur(s.emploisStables)] },
      { libelle: "Capitaux propres : capital et résultat", valeurs: [eur(s.capitauxPropres)] },
      { libelle: "Amortissements, dépréciation et provision", valeurs: [eur(auCentime(s.ressourcesPropres - s.capitauxPropres))] },
      { libelle: "Dettes financières : l'emprunt, sans ses intérêts courus", valeurs: [eur(s.dettesFinancieres)] },
      { libelle: "Ressources stables", valeurs: [eur(s.ressourcesStables)] },
      { libelle: "Capacité d'autofinancement de l'exercice", valeurs: [eur(s.caf)] },
    ],
  };
}

/** Le bilan comptable en valeurs nettes, et ce que l'analyste sait de plus. */
function bilanEtInformations(c: Pick<Cas, "code">): TableauDeDonnees {
  const s = structureDuCas(c);
  const p = s.postes;
  const l = (libelle: string, valeur: string) => ({ libelle, valeurs: [valeur] });
  return {
    titre: `Le bilan comptable de ${s.entreprise} au 31 décembre, en valeurs nettes, et l'annexe`,
    colonnes: ["Montant ou information"],
    lignes: [
      l("Ligne de montage, valeur nette", eur(p.immobilisationsNettes)),
      l("Stock de composants", eur(p.stock)),
      l("Clients, dépréciation déduite", eur(p.clientsNets)),
      l("TVA déductible", eur(p.autresCreances)),
      l("Charge constatée d'avance", eur(p.chargesConstateesDAvance)),
      l("Compte à terme et ses intérêts courus", eur(p.placement)),
      l("Banque", eur(p.banque)),
      l("Capital", eur(p.capital)),
      l("Résultat de l'exercice", eur(p.resultat)),
      l("Provision pour litige", eur(p.provision)),
      l("Emprunt, capital restant dû", eur(p.capitalRestantDu)),
      l("Intérêts courus de l'emprunt", eur(p.interetsCourus)),
      l("Fournisseurs", eur(p.fournisseurs)),
      l("Dettes fiscales et sociales, impôt compris", eur(p.dettesFiscalesEtSociales)),
      l("Produit constaté d'avance", eur(p.produitConstateDAvance)),
      l("Valeur de revente de la ligne", eur(s.financier.valeurDeRevente)),
      l("Emprunt : échéances des 12 mois à venir", eur(s.financier.echeancesAMoinsDUnAn)),
      l("Litige : jugement attendu", "en mai N+1"),
      l("Compte à terme : échéance", "le 6 janvier N+1"),
      l("Dividende voté sur le résultat", "aucun"),
    ],
  };
}

/** Le bilan financier à compléter. */
export function grilleDuBilanFinancier(c: Pick<Cas, "code">): TableauACompleter {
  const s = structureDuCas(c);
  const p = s.postes;
  const b = s.financier;
  return {
    titre: `Le bilan financier de ${s.entreprise} au 31 décembre`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Actif à plus d'un an : la ligne, à sa valeur de revente", cellules: [aSaisir(b.actifPlusDUnAn, `${pct(PART_DU_PRIX_NEUF_A_LA_REVENTE * 100)} de ${eur(s.f.equipement.ht)} = ${eur(b.actifPlusDUnAn)}`, { indice: "la valeur de revente de l'annexe, pas la valeur nette" })] },
      { libelle: "Stock de composants", cellules: [donnee(p.stock)] },
      {
        libelle: "Créances : clients, TVA déductible, charge constatée d'avance",
        cellules: [aSaisir(b.creances, `${eur(p.clientsNets)} + ${eur(p.autresCreances)} + ${eur(p.chargesConstateesDAvance)} = ${eur(b.creances)}`, { indice: "les clients pour leur montant net de dépréciation" })],
      },
      { libelle: "Compte à terme et ses intérêts courus", cellules: [donnee(p.placement)] },
      { libelle: "Banque", cellules: [donnee(p.banque)] },
      { libelle: "Actif à moins d'un an", fort: true, totalDe: { plus: [1, 2, 3, 4] }, cellules: [aSaisir(b.actifMoinsDUnAn, `${[p.stock, b.creances, p.placement, p.banque].map(eur).join(" + ")} = ${eur(b.actifMoinsDUnAn)}`)] },
      { libelle: "Total de l'actif", fort: true, totalDe: { plus: [0, 5] }, cellules: [aSaisir(b.totalActif, `${eur(b.actifPlusDUnAn)} + ${eur(b.actifMoinsDUnAn)} = ${eur(b.totalActif)}`)] },
      {
        libelle: "Capitaux propres, moins-value latente déduite",
        cellules: [aSaisir(b.capitauxPropres, `${eur(p.capital)} + ${eur(p.resultat)} − ${eur(b.moinsValueLatente)} = ${eur(b.capitauxPropres)}`, { indice: "la moins-value : la valeur nette de la ligne moins sa valeur de revente" })],
      },
      { libelle: "Dettes à plus d'un an : l'emprunt au-delà de 12 mois", cellules: [aSaisir(b.dettesPlusDUnAn, `${eur(p.capitalRestantDu)} − ${eur(b.echeancesAMoinsDUnAn)} = ${eur(b.dettesPlusDUnAn)}`, { indice: "le capital restant dû, moins les échéances de l'année" })] },
      { libelle: "Emprunt : échéances des 12 mois à venir", cellules: [aSaisir(b.echeancesAMoinsDUnAn, `les échéances de capital de l'année : ${eur(b.echeancesAMoinsDUnAn)}`)] },
      { libelle: "Provision pour litige, jugée en mai", cellules: [donnee(p.provision)] },
      { libelle: "Intérêts courus, fournisseurs, dettes fiscales et sociales, produit constaté d'avance", cellules: [donnee(b.autresDettesAMoinsDUnAn)] },
      { libelle: "Dettes à moins d'un an", fort: true, totalDe: { plus: [9, 10, 11] }, cellules: [aSaisir(b.dettesMoinsDUnAn, `${eur(b.echeancesAMoinsDUnAn)} + ${eur(p.provision)} + ${eur(b.autresDettesAMoinsDUnAn)} = ${eur(b.dettesMoinsDUnAn)}`)] },
      { libelle: "Total du passif", fort: true, totalDe: { plus: [7, 8, 12] }, cellules: [aSaisir(b.totalPassif, `${eur(b.capitauxPropres)} + ${eur(b.dettesPlusDUnAn)} + ${eur(b.dettesMoinsDUnAn)} = ${eur(b.totalPassif)}`)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

const R = REGLES_DE_LA_BANQUE;

export const RATIOS_DE_STRUCTURE: Chapitre = {
  code: "ratios-de-structure-et-bilan-financier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Ratios de structure et bilan financier",
  accroche:
    "Le bilan de NOVA lu deux fois. Par le banquier qui prête à long terme : qui finance les investissements, en combien d'années les dettes se remboursent. Par celui qui craint la défaillance : ce qui rentrera dans l'année face à ce qui sera dû.",
  objectifs: [
    "Calculer et interpréter la couverture des emplois stables, l'indépendance financière, l'endettement et la capacité de remboursement",
    "Reclasser un bilan selon la liquidité et l'exigibilité, moins-value latente comprise",
    "Calculer le fonds de roulement financier et les ratios de liquidité, de solvabilité et d'autonomie",
    "Apprécier le risque de défaillance, et ce qu'un investissement et sa dette y changent",
    "Choisir entre le bilan fonctionnel et le bilan financier selon la question posée",
  ],
  libre: false,
  prerequis: ["bilan-fonctionnel-et-bfr", "soldes-intermediaires-de-gestion"],
  ensuite: ["financer-et-placer-la-tresorerie"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRUCTURE,
    pourquoi: "les ratios et le bilan financier se lisent ici sur le bilan de NOVA au 31 décembre de son premier exercice, dans la simulation du cours ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux lectures du même bilan",
      notions: ["balance_sheet", "frng"],
      tableau: hautDuBilan,
      texte: (c) => {
        const s = structureDuCas(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, sur le bilan de ${s.entreprise} au 31 décembre de son premier exercice : celui que vous avez relu par fonction, avec sa capacité d'autofinancement de ${eur(s.caf)}.`,
          `Le bilan fonctionnel répond à une question : le cycle d'investissement est-il financé durablement ? Les ratios de structure la chiffrent. La banque qui prête à ${DUREE_DU_NOUVEL_EMPRUNT} ans s'en sert.`,
          "Le bilan financier répond à une autre : si les choses tournent mal, l'entreprise paiera-t-elle ses dettes ? Il range l'actif selon sa liquidité et le passif selon son exigibilité, à plus ou à moins d'un an, à la valeur qu'on en tirerait.",
          `La simulation suppose : aucun dividende sur ce premier exercice, un litige jugé en mai N+1, un compte à terme qui revient le 6 janvier, et une ligne qui se revendrait ${pct(PART_DU_PRIX_NEUF_A_LA_REVENTE * 100)} de son prix neuf. Le laboratoire ajoute les siennes, dites à chaque fois.`,
        ];
      },
      repere: () =>
        "Couverture des emplois stables = ressources stables ÷ emplois stables. Indépendance financière = ressources propres ÷ ressources stables. Endettement = dettes financières ÷ capitaux propres. Capacité de remboursement = dettes financières ÷ CAF, en années.",
    },
    {
      id: "couverture-et-independance",
      objectifs: [0],
      type: "montants",
      titre: "La couverture et l'indépendance",
      notions: ["frng", "balance_sheet"],
      tableau: hautDuBilan,
      question: (c) => {
        const s = structureDuCas(c);
        return `Les ressources stables, ${eur(s.ressourcesStables)}, financent les emplois stables, ${eur(s.emploisStables)}. Calculez la couverture des emplois stables, au centième. Puis les ressources propres : les capitaux propres, plus les amortissements, la dépréciation et la provision. Enfin l'indépendance financière, ressources propres ÷ ressources stables, en pour cent au centième.`;
      },
      champs: (c) => {
        const s = structureDuCas(c);
        return [
          { libelle: "Couverture des emplois stables", attendu: s.ratios.couverture, calcul: `${eur(s.ressourcesStables)} ÷ ${eur(s.emploisStables)} = ${qte(s.ratios.couverture)}`, tolerance: 0.01 },
          { libelle: "Ressources propres", attendu: s.ressourcesPropres, calcul: `${eur(s.capitauxPropres)} + ${eur(auCentime(s.ressourcesPropres - s.capitauxPropres))} = ${eur(s.ressourcesPropres)}` },
          { libelle: "Indépendance financière, en %", attendu: s.ratios.independance, calcul: `${eur(s.ressourcesPropres)} ÷ ${eur(s.ressourcesStables)} = ${pct(s.ratios.independance)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const s = structureDuCas(c);
        return [
          `Les ressources stables couvrent ${qte(s.ratios.couverture)} fois les emplois stables : au-dessus de 1, l'équilibre financier minimal est tenu, et le fonds de roulement est positif.`,
          `Les associés et l'autofinancement apportent ${pct(s.ratios.independance)} des ressources stables, bien plus que la moitié que demandent les banques. Les prêteurs n'en apportent que le reste.`,
        ];
      },
    },
    {
      id: "endettement-et-capacite",
      objectifs: [0],
      type: "montants",
      titre: "L'endettement et la capacité de remboursement",
      notions: ["loan_schedule", "balance_sheet"],
      tableau: hautDuBilan,
      question: (c) => {
        const s = structureDuCas(c);
        return `Les dettes financières, ${eur(s.dettesFinancieres)}, se comparent à ce que les associés ont mis, les capitaux propres (${eur(s.capitauxPropres)}), et à ce que l'activité dégage chaque année, la CAF (${eur(s.caf)}). Calculez l'endettement, dettes financières ÷ capitaux propres, au centième, puis la capacité de remboursement, dettes financières ÷ CAF, en années au centième.`;
      },
      champs: (c) => {
        const s = structureDuCas(c);
        return [
          { libelle: "Endettement", attendu: s.ratios.endettement, calcul: `${eur(s.dettesFinancieres)} ÷ ${eur(s.capitauxPropres)} = ${qte(s.ratios.endettement)}`, tolerance: 0.01 },
          { libelle: "Capacité de remboursement, en années", attendu: s.ratios.capacite, calcul: `${eur(s.dettesFinancieres)} ÷ ${eur(s.caf)} = ${ans(s.ratios.capacite)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const s = structureDuCas(c);
        return [
          `L'emprunt pèse ${qte(s.ratios.endettement)} fois les capitaux propres ; la banque en accepte jusqu'à ${qte(R.endettement)}. En consacrant toute sa CAF à ses dettes, ${s.entreprise} les rembourserait en ${ans(s.ratios.capacite)} ; la banque s'inquiète au-delà de ${ans(R.capaciteDeRemboursement)}.`,
          "La capacité de remboursement mêle un stock, la dette du bilan, et un flux, la CAF de l'année : une bonne année l'embellit, une mauvaise la gâte.",
        ];
      },
    },
    {
      id: "jusqu-ou-emprunter",
      objectifs: [0],
      type: "montants",
      titre: "Jusqu'où emprunter, sans aide",
      notions: ["loan_schedule", "frng"],
      tableau: hautDuBilan,
      question: (c) => {
        const s = structureDuCas(c);
        return `À vous, sans formule cette fois. ${s.entreprise} emprunterait au 31 décembre sans rien acheter : l'emprunt nouveau s'ajoute aux dettes financières et aux ressources stables. Calculez, à l'euro inférieur, l'emprunt nouveau le plus élevé que permet chaque règle : la capacité de remboursement à ${ans(R.capaciteDeRemboursement)} au plus, l'endettement à ${qte(R.endettement)} au plus, l'indépendance à ${pct(R.independance * 100)} au moins.`;
      },
      champs: (c) => {
        const s = structureDuCas(c);
        return [
          { libelle: "Permis par la capacité de remboursement", attendu: s.permis.parLaCapacite, calcul: `${R.capaciteDeRemboursement} × ${eur(s.caf)} − ${eur(s.dettesFinancieres)} = ${eur(s.permis.parLaCapacite)}, à l'euro inférieur`, tolerance: 1 },
          { libelle: "Permis par l'endettement", attendu: s.permis.parLEndettement, calcul: `${qte(R.endettement)} × ${eur(s.capitauxPropres)} − ${eur(s.dettesFinancieres)} = ${eur(s.permis.parLEndettement)}, à l'euro inférieur`, tolerance: 1 },
          {
            libelle: "Permis par l'indépendance financière",
            attendu: s.permis.parLIndependance,
            calcul: `${eur(s.ressourcesPropres)} ÷ ${qte(R.independance)} − ${eur(s.ressourcesStables)} = ${eur(s.permis.parLIndependance)}, à l'euro inférieur : les ressources stables peuvent monter jusqu'au double des ressources propres`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const s = structureDuCas(c);
        return [`Chaque règle borne la dette d'une autre façon. La capacité de remboursement laisserait emprunter ${eur(s.permis.parLaCapacite)}, l'indépendance ${eur(s.permis.parLIndependance)}, l'endettement ${eur(s.permis.parLEndettement)} seulement.`];
      },
    },
    {
      id: "la-regle-qui-bloque",
      objectifs: [0],
      type: "choix",
      titre: "La règle qui bloque d'abord",
      notions: ["loan_schedule"],
      question: () => `Le dirigeant voudrait emprunter ${eur(EMPRUNT_DEMANDE)} de plus pour la gamme de N+1. Que lui dit la banque, au vu des trois règles ?`,
      options: (c) => {
        const s = structureDuCas(c);
        return [
          {
            texte: `Trop : l'endettement plafonne à ${eur(s.permis.parLEndettement)}`,
            juste: true,
            retour: `Oui. Au-delà de ${eur(s.permis.parLEndettement)}, les dettes financières dépasseraient les capitaux propres. Pour emprunter plus, il faudrait d'abord grossir les capitaux propres, par un apport ou par des bénéfices mis en réserve.`,
          },
          {
            texte: `D'accord : la capacité de remboursement permet jusqu'à ${eur(s.permis.parLaCapacite)} de plus`,
            juste: false,
            retour: "Non : une règle tenue ne suffit pas, la banque les veut toutes. La capacité de remboursement serait respectée, l'endettement non.",
          },
          {
            texte: `Trop : l'indépendance financière tomberait sous ${pct(R.independance * 100)}`,
            juste: false,
            retour: `Pas encore : elle tient jusqu'à ${eur(s.permis.parLIndependance)} d'emprunt nouveau. La règle qui bloque la première est celle de l'endettement.`,
          },
          {
            texte: "D'accord : la trésorerie nette dépasse déjà ce montant, le prêt ne risque rien",
            juste: false,
            retour: "Non : la trésorerie dit ce qui est disponible aujourd'hui, pas qui finance l'entreprise. Les ratios de structure regardent le haut du bilan.",
          },
        ];
      },
    },
    {
      id: "les-reclassements-financiers",
      objectifs: [1],
      type: "tri",
      titre: "Liquidité et exigibilité",
      notions: ["balance_sheet"],
      tableau: bilanEtInformations,
      question: () =>
        "Rangez chaque poste du bilan financier. L'actif se range selon le temps qu'il met à devenir de l'argent, le passif selon le moment où il faut le payer : à plus ou à moins d'un an. L'actif se lit à la valeur qu'on en tirerait, et le résultat après sa répartition.",
      categories: [
        { code: "actif-plus", libelle: "Actif à plus d'un an" },
        { code: "actif-moins", libelle: "Actif à moins d'un an" },
        { code: "propres", libelle: "Capitaux propres" },
        { code: "dettes-plus", libelle: "Dettes à plus d'un an" },
        { code: "dettes-moins", libelle: "Dettes à moins d'un an" },
      ],
      elements: (c) => {
        const s = structureDuCas(c);
        const p = s.postes;
        const b = s.financier;
        return [
          { libelle: "Ligne de montage, à sa valeur de revente", montant: b.valeurDeRevente, categorie: "actif-plus", pourquoi: "Elle sert des années : un actif à plus d'un an, pour ce qu'un acheteur en donnerait, pas pour sa valeur comptable." },
          { libelle: "Stock de composants", montant: p.stock, categorie: "actif-moins", pourquoi: "Il sera monté et vendu dans les semaines qui viennent : un actif à moins d'un an." },
          { libelle: "Charge constatée d'avance", montant: p.chargesConstateesDAvance, categorie: "actif-moins", pourquoi: "L'assurance payée d'avance couvre les neuf prochains mois : à moins d'un an." },
          { libelle: "Compte à terme, échéance le 6 janvier", montant: p.placement, categorie: "actif-moins", pourquoi: "Il revient en banque dans quelques jours, intérêts compris : à moins d'un an." },
          { libelle: "Résultat de l'exercice, sans dividende", montant: p.resultat, categorie: "propres", pourquoi: "Rien n'est distribué : tout le résultat reste aux capitaux propres. Un dividende voté, lui, serait une dette à moins d'un an." },
          { libelle: "Moins-value latente sur la ligne", montant: b.moinsValueLatente, categorie: "propres", pourquoi: "La ligne vaut moins que sa valeur comptable : l'écart se retranche de l'actif et des capitaux propres." },
          { libelle: "Emprunt, capital dû au-delà de 12 mois", montant: b.dettesPlusDUnAn, categorie: "dettes-plus", pourquoi: "Ces échéances tombent après l'an prochain : des dettes à plus d'un an." },
          { libelle: "Emprunt, échéances des 12 mois à venir", montant: b.echeancesAMoinsDUnAn, categorie: "dettes-moins", pourquoi: "Les échéances de capital de l'année tombent dans les 12 mois : elles quittent les dettes à long terme pour les dettes à moins d'un an." },
          { libelle: "Provision pour litige, jugement attendu en mai", montant: p.provision, categorie: "dettes-moins", pourquoi: "Le jugement tombera dans l'année : la provision est une dette probable à moins d'un an, pas une ressource durable comme au bilan fonctionnel." },
          { libelle: "Impôt sur les sociétés dû", montant: p.impot, categorie: "dettes-moins", pourquoi: "Il se paie au printemps : à moins d'un an." },
          { libelle: "Produit constaté d'avance", montant: p.produitConstateDAvance, categorie: "dettes-moins", pourquoi: "Des enceintes facturées, à livrer en janvier : une dette à moins d'un an." },
        ];
      },
      relance: "Pour chaque poste, demandez-vous : dans combien de temps devient-il de l'argent, ou faudra-t-il le payer ?",
      explication: (c) => {
        const s = structureDuCas(c);
        return [
          `Trois reclassements séparent le bilan financier du bilan fonctionnel. L'emprunt se coupe en deux, ${eur(s.financier.echeancesAMoinsDUnAn)} dus dans l'année. La provision devient une dette à court terme. La ligne se lit à sa valeur de revente : ${eur(s.financier.moinsValueLatente)} de moins-value latente, retranchés des capitaux propres.`,
        ];
      },
    },
    {
      id: "le-bilan-financier",
      objectifs: [1],
      type: "a-completer",
      titre: "Le bilan financier",
      notions: ["balance_sheet"],
      tableau: bilanEtInformations,
      question: () =>
        "À vous, sans formule cette fois. Remplissez le bilan financier à partir du bilan comptable et de l'annexe : l'actif en valeurs nettes, la ligne à sa valeur de revente, le passif selon son exigibilité. Il doit s'équilibrer.",
      grille: grilleDuBilanFinancier,
      explication: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          `Le bilan financier s'équilibre à ${eur(b.totalActif)}, moins que le bilan comptable de la moins-value latente, ${eur(b.moinsValueLatente)}.`,
          `${eur(b.actifMoinsDUnAn)} deviendront de l'argent dans l'année, face à ${eur(b.dettesMoinsDUnAn)} à payer dans le même temps.`,
        ];
      },
    },
    {
      id: "predire-l-investissement",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur un investissement payé comptant",
      notions: ["frng", "balance_sheet"],
      question: (c) => {
        const s = structureDuCas(c);
        return `Avant de calculer, pariez. ${s.entreprise} paie comptant, le 31 décembre, une machine de ${eur(50_000)}. Le fonds de roulement financier, capitaux permanents moins actif à plus d'un an…`;
      },
      options: () => {
        const voir = "Faites varier l'investissement à l'étape suivante : le curseur montre ce qui bouge, et ce qui ne bouge pas.";
        return [
          { texte: "Baisse de tout le prix", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Ne bouge pas : de l'argent devient une machine, l'actif total est le même", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte : l'actif à plus d'un an grossit", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-investissement-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "L'investissement payé comptant, au curseur",
      notions: ["frng", "net_treasury"],
      question: (c) => {
        const s = structureDuCas(c);
        return `Faites varier l'investissement payé comptant le 31 décembre, de 0 à ${qte(INVESTISSEMENT_DU_CURSEUR.max)} milliers d'euros. Une droite donne les capitaux permanents, ${eur(s.financier.capitauxPermanents)} : les capitaux propres et les dettes à plus d'un an. L'autre donne l'actif à plus d'un an. Jusqu'où le fonds de roulement financier reste-t-il positif ou nul ? Placez le curseur au millier près.`;
      },
      grandeur: () => ({ libelle: "Investissement payé comptant le 31 décembre", unite: "milliers d'euros" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: investissementComptantMaximal(structureDuCas(c)), min: INVESTISSEMENT_DU_CURSEUR.min, max: INVESTISSEMENT_DU_CURSEUR.max }),
      zones: ["Fonds de roulement financier positif", "Fonds de roulement financier négatif"],
      rates: () => ({
        dessous: "Plus haut, le fonds de roulement financier reste positif : cherchez l'investissement le plus élevé.",
        dessus: "À ce montant, l'actif à plus d'un an dépasse les capitaux permanents.",
      }),
      montrer: "Montrer l'investissement",
      lecture: (c, q) => {
        const s = structureDuCas(c);
        const x = investissementComptant(s, q);
        return [
          { libelle: "Investissement payé comptant", montant: x.montant },
          { libelle: "Actif à plus d'un an", montant: x.actifPlusDUnAn },
          { libelle: "Capitaux permanents", montant: x.capitauxPermanents },
          { libelle: "Fonds de roulement financier", montant: x.fondsDeRoulementFinancier, fort: true },
          { libelle: "Compte courant, hors compte à terme", montant: x.compteCourant },
        ];
      },
      droites: (c) => {
        const s = structureDuCas(c);
        return { produit: () => s.financier.capitauxPermanents, cout: (q) => s.financier.actifPlusDUnAn + q * 1_000, libelles: ["Capitaux permanents", "Actif à plus d'un an"] };
      },
      explication: (c) => {
        const s = structureDuCas(c);
        const max = investissementComptantMaximal(s);
        const sousZero = Math.floor(s.postes.banque / 1_000) + 1;
        return [
          `Chaque euro payé comptant passe de l'actif à moins d'un an à l'actif à plus d'un an : le fonds de roulement financier baisse d'autant, les capitaux permanents ne bougent pas. Au-delà de ${qte(max)} milliers d'euros, ${s.entreprise} financerait du long terme par des dettes à court terme.`,
          `Mais le compte courant passe sous zéro dès ${qte(sousZero)} milliers d'euros : le compte à terme, ${eur(s.postes.placement)}, ne revient que le 6 janvier. Un fonds de roulement financier positif dit que l'année tiendra, pas que chaque jour tiendra.`,
        ];
      },
    },
    {
      id: "le-fonds-de-roulement-financier",
      objectifs: [2],
      type: "montants",
      titre: "Le fonds de roulement financier et la liquidité",
      notions: ["frng", "net_treasury"],
      question: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return `Le fonds de roulement financier se calcule par le haut, capitaux permanents (${eur(b.capitauxPropres)} + ${eur(b.dettesPlusDUnAn)}) moins actif à plus d'un an (${eur(b.actifPlusDUnAn)}), et par le bas, actif à moins d'un an moins dettes à moins d'un an. Calculez-le, puis trois ratios au centième, toujours sur les dettes à moins d'un an : la liquidité générale (tout l'actif à moins d'un an), réduite (sans le stock), immédiate (la banque seule).`;
      },
      champs: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          { libelle: "Fonds de roulement financier", attendu: b.fondsDeRoulementFinancier, calcul: `${eur(b.capitauxPermanents)} − ${eur(b.actifPlusDUnAn)} = ${eur(b.actifMoinsDUnAn)} − ${eur(b.dettesMoinsDUnAn)} = ${eur(b.fondsDeRoulementFinancier)}` },
          { libelle: "Liquidité générale", attendu: b.liquiditeGenerale, calcul: `${eur(b.actifMoinsDUnAn)} ÷ ${eur(b.dettesMoinsDUnAn)} = ${qte(b.liquiditeGenerale)}`, tolerance: 0.01 },
          { libelle: "Liquidité réduite", attendu: b.liquiditeReduite, calcul: `(${eur(b.actifMoinsDUnAn)} − ${eur(s.postes.stock)}) ÷ ${eur(b.dettesMoinsDUnAn)} = ${qte(b.liquiditeReduite)}`, tolerance: 0.01 },
          { libelle: "Liquidité immédiate", attendu: b.liquiditeImmediate, calcul: `${eur(s.postes.banque)} ÷ ${eur(b.dettesMoinsDUnAn)} = ${qte(b.liquiditeImmediate)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          `Le fonds de roulement financier mesure une marge de sécurité : ${eur(b.fondsDeRoulementFinancier)} d'actif à moins d'un an au-delà de ce qu'il faut payer dans l'année. La liquidité générale le dit en rapport, ${qte(b.liquiditeGenerale)} : au-dessus de 1, l'entreprise peut payer ses dettes à court terme avec son actif à court terme.`,
          "La liquidité réduite écarte le stock, qu'il faut encore vendre ; l'immédiate ne garde que l'argent du jour.",
        ];
      },
    },
    {
      id: "solvabilite-et-autonomie",
      objectifs: [2],
      type: "montants",
      titre: "Solvabilité et autonomie, sans aide",
      notions: ["balance_sheet"],
      question: () =>
        "À vous, sans formule cette fois. La solvabilité générale rapporte tout l'actif du bilan financier à toutes les dettes ; l'autonomie financière rapporte les capitaux propres au total du bilan financier. Calculez les dettes totales, la solvabilité au centième, puis l'autonomie en pour cent au centième.",
      champs: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          { libelle: "Dettes totales", attendu: b.dettesTotales, calcul: `${eur(b.dettesPlusDUnAn)} + ${eur(b.dettesMoinsDUnAn)} = ${eur(b.dettesTotales)}` },
          { libelle: "Solvabilité générale", attendu: b.solvabilite, calcul: `${eur(b.totalActif)} ÷ ${eur(b.dettesTotales)} = ${qte(b.solvabilite)}`, tolerance: 0.01 },
          { libelle: "Autonomie financière, en %", attendu: b.autonomie, calcul: `${eur(b.capitauxPropres)} ÷ ${eur(b.totalPassif)} = ${pct(b.autonomie)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          `Vendu à sa valeur de réalisation, l'actif paierait ${qte(b.solvabilite)} fois toutes les dettes : les créanciers sont couverts. Les capitaux propres font ${pct(b.autonomie)} du total, au-dessus de la moitié que les banques aiment voir.`,
        ];
      },
    },
    {
      id: "la-liquidite-immediate",
      objectifs: [2, 3],
      type: "choix",
      titre: "Une liquidité immédiate sous 1",
      notions: ["net_treasury", "balance_sheet"],
      question: (c) => {
        const s = structureDuCas(c);
        return `La liquidité immédiate vaut ${qte(s.financier.liquiditeImmediate)} : la banque ne paierait pas toutes les dettes à moins d'un an, ${eur(s.financier.dettesMoinsDUnAn)}. Faut-il s'en inquiéter ?`;
      },
      options: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          {
            texte: "Non : ces dettes s'étalent sur l'année, le placement revient le 6 janvier",
            juste: true,
            retour: `Oui. Les dettes à moins d'un an ne sont pas toutes dues le 1er janvier : l'impôt part au printemps, le litige se juge en mai. Et le 6 janvier, le compte à terme porte la liquidité immédiate à ${qte(b.liquiditeAuSixJanvier)}. Un ratio du 31 décembre se lit avec les dates.`,
          },
          {
            texte: "Oui : sous 1, la banque doit refuser tout crédit et exiger un apport des associés",
            juste: false,
            retour: "Non : aucune entreprise ne garde en banque de quoi payer d'un coup toutes ses dettes de l'année. La liquidité immédiate se juge avec le calendrier des paiements, pas seule.",
          },
          {
            texte: "Oui : il faut rompre le compte à terme dès aujourd'hui",
            juste: false,
            retour: "Non : il revient dans quelques jours, intérêts compris. Le rompre ferait perdre ses intérêts pour payer des dettes qui ne sont pas encore dues.",
          },
        ];
      },
    },
    {
      id: "le-risque-de-defaillance",
      objectifs: [3],
      type: "choix",
      titre: "Le risque de défaillance",
      notions: ["balance_sheet", "net_treasury"],
      question: () =>
        "Une entreprise est en défaillance quand son actif disponible ne paie plus son passif exigible : c'est la cessation des paiements. Au vu du bilan financier, que dites-vous du risque de défaillance de NOVA au 31 décembre ?",
      options: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          {
            texte: `Faible : fonds de roulement financier positif, solvabilité de ${qte(b.solvabilite)}`,
            juste: true,
            retour: `Oui. L'actif à moins d'un an dépasse de ${eur(b.fondsDeRoulementFinancier)} les dettes de l'année, et l'actif entier paierait ${qte(b.solvabilite)} fois toutes les dettes. Le risque viendrait d'un retournement : une créance comme celle de Sonora, en plus grand, ou une année sans ventes.`,
          },
          {
            texte: `Élevé : ${eur(b.dettesMoinsDUnAn)} sont dus dans l'année, plus que la banque n'en contient`,
            juste: false,
            retour: "Non : les dettes de l'année se paient avec tout l'actif de l'année, le stock vendu, les clients encaissés et le compte à terme, pas avec la seule banque du jour.",
          },
          {
            texte: "Impossible à dire sans le compte de résultat de l'année suivante",
            juste: false,
            retour: "Non : le bilan financier est fait pour cette question. Il ne prévoit pas l'avenir, mais il dit si l'entreprise paierait ses dettes avec ce qu'elle possède aujourd'hui.",
          },
          {
            texte: "Élevé : l'entreprise doit encore son emprunt, et a un litige",
            juste: false,
            retour: "Non : devoir n'est pas défaillir. L'emprunt se rembourse par échéances, le litige est provisionné ; la question est de savoir si l'actif les paie, et il les paie.",
          },
        ];
      },
    },
    {
      id: "predire-l-emprunt",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur un emprunt",
      notions: ["loan_schedule", "balance_sheet"],
      question: () =>
        `Avant le laboratoire, pariez. NOVA emprunte au 31 décembre, sur ${DUREE_DU_NOUVEL_EMPRUNT} ans, et garde l'argent en banque. Un cinquième du capital est dû dans l'année. Sa liquidité générale…`,
      options: () => {
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        return [
          { texte: "Monte", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Baisse : il y a plus de dettes", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne bouge pas : l'argent emprunté est dû", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-banque",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la banque",
      notions: ["loan_schedule", "frng", "balance_sheet"],
      question: (c) => {
        const s = structureDuCas(c);
        return `Faites varier un investissement payé hors taxes le 31 décembre, un emprunt nouveau sur ${DUREE_DU_NOUVEL_EMPRUNT} ans, un apport des associés et la baisse de CAF que la banque teste. Le tableau suit le compte courant et les ratios ; le graphique, les dettes financières face au plafond de ${ans(R.capaciteDeRemboursement)} de CAF, selon l'emprunt. Relevez le défi : la gamme de N+1 coûte ${eur(INVESTISSEMENT_DE_LA_GAMME)} hors taxes, et ${s.entreprise} garde ${eur(MATELAS_DU_COMPTE_COURANT)} en compte courant.`;
      },
      leviers: () => {
        const L = LEVIERS_DE_LA_STRUCTURE;
        const d = DEPART_DE_LA_STRUCTURE;
        return [
          { code: "investissement", libelle: "Investissement payé hors taxes", unite: "€", ...L.investissement, depart: d.investissement },
          { code: "emprunt", libelle: "Emprunt nouveau", unite: "€", ...L.emprunt, depart: d.emprunt },
          { code: "apport", libelle: "Apport des associés", unite: "€", ...L.apport, depart: d.apport },
          { code: "baisse", libelle: "Baisse de la CAF testée par la banque", unite: "%", ...L.baisse, depart: d.baisse },
        ];
      },
      lecture: (c, p) => {
        const s = structureDuCas(c);
        const x = structureApres(s, position(p));
        const d = structureApres(s, DEPART_DE_LA_STRUCTURE);
        return [
          { libelle: "Compte courant", montant: x.banque, reference: d.banque, fort: true },
          { libelle: "Couverture des emplois stables", montant: x.couverture, reference: d.couverture, unite: "fois" },
          { libelle: "Indépendance financière", montant: x.independance, reference: d.independance, unite: "%" },
          { libelle: "Endettement", montant: x.endettement, reference: d.endettement, unite: "fois" },
          { libelle: "Capacité de remboursement", montant: Number.isFinite(x.capacite) ? x.capacite : 0, reference: d.capacite, unite: "ans" },
          { libelle: "Liquidité générale", montant: x.liquiditeGenerale, reference: d.liquiditeGenerale, unite: "fois" },
          { libelle: "Fonds de roulement financier", montant: x.fondsDeRoulementFinancier, reference: d.fondsDeRoulementFinancier },
        ];
      },
      graphique: (c) => {
        const s = structureDuCas(c);
        return {
          levier: "emprunt",
          courbes: [
            { libelle: "Compte courant", valeur: (p) => structureApres(s, position(p)).banque },
            { libelle: "Dettes financières", valeur: (p) => structureApres(s, position(p)).dettesFinancieres },
            { libelle: `Plafond : ${ans(R.capaciteDeRemboursement)} de CAF`, valeur: (p) => structureApres(s, position(p)).plafondDeLaCapacite },
          ],
        };
      },
      defi: (c) => {
        const s = structureDuCas(c);
        const e = empruntMinimalDeLaGamme(s);
        return {
          consigne: `Payez la gamme, ${eur(INVESTISSEMENT_DE_LA_GAMME)}, avec une CAF testée en baisse de ${pct(BAISSE_DE_LA_CAF_TESTEE)}, en gardant ${eur(MATELAS_DU_COMPTE_COURANT)} en compte courant et les quatre règles : capacité, indépendance, endettement, liquidité générale.`,
          atteint: (p) => defiDeLaStructure(s, position(p)),
          indice: (p) => {
            const q = position(p);
            const x = structureApres(s, q);
            if (q.investissement < INVESTISSEMENT_DE_LA_GAMME) return `L'investissement vaut ${eur(q.investissement)} : montez-le à ${eur(INVESTISSEMENT_DE_LA_GAMME)}.`;
            if (q.baisse < BAISSE_DE_LA_CAF_TESTEE) return `La banque teste une CAF en baisse de ${pct(BAISSE_DE_LA_CAF_TESTEE)} : placez la baisse à ce niveau.`;
            if (x.banque < MATELAS_DU_COMPTE_COURANT) return `Le compte courant tombe à ${eur(x.banque)}, sous le matelas : il manque de l'argent nouveau, emprunté ou apporté.`;
            if (x.dettesFinancieres > x.plafondDeLaCapacite) return `Les dettes financières, ${eur(x.dettesFinancieres)}, dépassent ${ans(R.capaciteDeRemboursement)} de CAF testée, ${eur(x.plafondDeLaCapacite)} : empruntez moins, apportez plus.`;
            return "Une règle n'est pas tenue : relisez l'indépendance, l'endettement et la liquidité générale.";
          },
          solution: { investissement: INVESTISSEMENT_DE_LA_GAMME, emprunt: e, apport: 0, baisse: BAISSE_DE_LA_CAF_TESTEE },
        };
      },
      explication: (c, p) => {
        const s = structureDuCas(c);
        const x = structureApres(s, position(p));
        const e = empruntMinimalDeLaGamme(s);
        return [
          `Défi relevé : le compte courant finit à ${eur(x.banque)}, la capacité de remboursement à ${ans(x.capacite)} sur une CAF de ${eur(x.caf)}. Sans apport, il faut emprunter au moins ${eur(e)} pour garder le matelas, et pas beaucoup plus pour rester sous le plafond : la fenêtre est étroite.`,
          "Le graphique le montre : le compte courant monte avec l'emprunt, les dettes aussi, et le plafond de la capacité de remboursement ne bouge pas. L'apport élargit la fenêtre : il remplit la banque sans ajouter de dette.",
          "Et la liquidité générale monte avec l'emprunt : l'argent entre tout de suite à l'actif à moins d'un an, la dette n'y entre que pour un cinquième. C'est le pari de l'étape précédente.",
        ];
      },
    },
    {
      id: "fonctionnel-ou-financier",
      objectifs: [4],
      type: "choix",
      titre: "Le bon bilan pour la bonne question",
      notions: ["balance_sheet", "frng", "bfr"],
      question: () =>
        "Deux lecteurs du même bilan. Un fournisseur se demande s'il sera payé si NOVA devait cesser son activité. Le dirigeant se demande si son cycle d'exploitation est financé durablement. Lequel doit lire le bilan financier ?",
      options: () => [
        {
          texte: "Le fournisseur",
          juste: true,
          retour: "Oui. Le bilan financier est une vue patrimoniale : il évalue ce que vaut l'actif et quand il devient de l'argent, face à ce qui est dû et quand. Le dirigeant, lui, lit le bilan fonctionnel : le fonds de roulement face au besoin du cycle d'exploitation.",
        },
        {
          texte: "Le dirigeant : le bilan financier dit si l'exploitation est financée",
          juste: false,
          retour: "Non : le bilan financier mêle l'exploitation et le reste dans les dettes à moins d'un an. C'est le bilan fonctionnel qui isole le besoin du cycle d'exploitation.",
        },
        {
          texte: "Les deux : les deux bilans donnent le même fonds de roulement",
          juste: false,
          retour: "Non : le fonds de roulement financier n'est pas le fonds de roulement net global. La part de l'emprunt due dans l'année, la provision et les valeurs de revente les séparent.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "frng", "loan_schedule"],
      texte: (c) => {
        const s = structureDuCas(c);
        const b = s.financier;
        return [
          `Sur le bilan fonctionnel de ${s.entreprise}, les ratios de structure sont bons : une couverture des emplois stables de ${qte(s.ratios.couverture)}, une indépendance de ${pct(s.ratios.independance)}, un endettement de ${qte(s.ratios.endettement)}, une capacité de remboursement de ${ans(s.ratios.capacite)}. La règle qui borne d'abord un emprunt nouveau est l'endettement.`,
          `Sur le bilan financier, la marge de sécurité est large : ${eur(b.fondsDeRoulementFinancier)} de fonds de roulement financier, une liquidité générale de ${qte(b.liquiditeGenerale)}, une solvabilité de ${qte(b.solvabilite)}. Le risque de défaillance est faible ; la liquidité immédiate se lit avec les dates.`,
          "Au niveau de l'examen, vous savez calculer et juger les ratios de structure, et dire jusqu'où l'entreprise peut s'endetter. Vous savez reclasser un bilan selon la liquidité et l'exigibilité, calculer le fonds de roulement financier et les ratios de liquidité, de solvabilité et d'autonomie, et choisir le bilan qui répond à la question posée.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : les ratios, eux, se calculent de la même façon.",
        ];
      },
      repere: () =>
        "Fonds de roulement financier = capitaux permanents − actif à plus d'un an = actif à moins d'un an − dettes à moins d'un an. Liquidité générale = actif à moins d'un an ÷ dettes à moins d'un an. Solvabilité = actif total ÷ dettes totales. Autonomie = capitaux propres ÷ total du bilan.",
    },
  ],
};
