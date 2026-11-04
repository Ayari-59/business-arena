import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  ACTIONS_DE_L_ASSOCIE,
  BETA_DES_CAPITAUX_PROPRES,
  COMPROMIS,
  DETTES_DU_31_DECEMBRE,
  DIVIDENDE_ANNONCE,
  EMPRUNT_DE_N_PLUS_1,
  FRAIS_DE_DOSSIER,
  LEVIERS_DU_COMPROMIS,
  PRIX_DE_L_ACTION,
  augmentationVueParLesActionnaires,
  cmpcDeNova,
  compromis,
  coutDuCreditBail,
  coutParLeDividendeConstant,
  coutParLeDividendeEnProgression,
  coutParLeMedaf,
  detteOptimale,
  empruntObligataire,
  lesTroisModes,
} from "../monde/couts-de-financement";
import { AUGMENTATION_DE_CAPITAL } from "../monde/comptabilite-approfondie";
import { CLOTURE_DE_LA_FICHE } from "../monde/exercice-de-nova";
import { TAUX_DE_L_IMPOT, coutApresImpot } from "../monde/financement-de-la-gamme";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "../monde/projets-et-financement";
import { annuiteDeRemboursement, valeurActuelleDesFlux } from "../monde/valeur-et-temps";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR } from "./la-valeur-et-le-temps";

/**
 * CHAPITRE : ARBITRER LES COÛTS DE FINANCEMENT (comptabilité générale, palier 4 ; DCG UE6 3.3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA finance sa gamme de N+1. L'emprunt de 80 000 € qui
 * équilibre son plan de financement, au taux de sa banque ; un placement privé obligataire que la
 * banque propose à la place ; l'augmentation de capital de juin N+1 (1 action nouvelle pour 3, à
 * 12 €) ; le crédit-bail de la ligne, déjà chiffré. Tous les chiffres se calculent dans
 * monde/couts-de-financement.ts.
 *
 * L'objet : chaque ressource a un coût, et ce coût se compare après impôt. L'emprunt bancaire in fine,
 * à annuité constante ou à amortissement constant ; l'emprunt obligataire classique ; le coût des
 * capitaux propres, par le dividende (constant ou en progression) et par le MEDAF (la formule
 * seulement, comme le programme le limite) ; l'augmentation de capital et ses effets pour les
 * actionnaires (sans droit préférentiel de souscription, hors programme ici, que le chapitre
 * « L'augmentation de capital » traite en comptabilité) ; le CMPC ; puis l'effet de l'endettement :
 * la théorie du compromis et le financement hiérarchique. « Emprunt ou crédit-bail » a comparé ces
 * deux financements ; « La création de valeur » prolonge au DSCG (Hamada, EVA).
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, trois-facons-de-rembourser, par-le-medaf (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-le-moins-cher avant le-cout-actuariel ;
 *     predire-les-capitaux-propres avant par-le-dividende ; predire-l-optimum puis le
 *     laboratoire-du-compromis (la dette, le coût des difficultés ; un graphique de l'économie
 *     d'impôt, du coût attendu et du gain net) ;
 *   · autonome : le-tableau-a-annuite-constante, l-emprunt-obligataire, l-augmentation-de-capital,
 *     le-cmpc ;
 *   · expert : l-obligataire-apres-impot, les-effets-pour-l-actionnaire, le-financement-hierarchique ;
 *     puis la synthèse.
 *
 * MATIÈRE : le cours du propriétaire « Gestion des investissements, rentabilité financière » (les
 * conséquences de chaque mode de financement : fonds propres, emprunt, crédit-bail), adapté aux
 * financements de NOVA.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number, chiffres = 2) => `${(t * 100 + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`;
const nb = (x: number, chiffres = 6) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const enPct = (t: number) => auCentime(t * 100);
const donnee = (valeur: number | null, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, ...autres });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function coutsDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const e = EMPRUNT_DE_N_PLUS_1;
  const modes = lesTroisModes();
  const parMode = (m: string) => modes.find((x) => x.mode === m)!;
  const obligataire = empruntObligataire();
  const vaObligataire = (t: number) => valeurActuelleDesFlux(obligataire.avant.slice(1).map((f) => -f), t);
  const bas = Math.floor(obligataire.avantImpot * 1000) / 1000;
  const haut = bas + 0.001;
  const interpole = bas + ((haut - bas) * (vaObligataire(bas) - obligataire.fondsNets)) / (vaObligataire(bas) - vaObligataire(haut));
  const cmpc = cmpcDeNova();
  return {
    e,
    t: TAUX_DE_L_IMPOT,
    modes,
    inFine: parMode("in-fine"),
    annuite: parMode("echeances-constantes"),
    amortissement: parMode("amortissement-constant"),
    annuiteConstante: annuiteDeRemboursement(e.montant, e.taux, e.dureeAns),
    apresImpot: coutApresImpot(e.taux),
    obligataire,
    vaObligataire,
    bas,
    haut,
    interpole,
    constant: coutParLeDividendeConstant(),
    progression: coutParLeDividendeEnProgression(),
    medaf: coutParLeMedaf(),
    augmentation: augmentationVueParLesActionnaires(),
    cmpc,
    creditBail: coutDuCreditBail(),
    optimum: detteOptimale(),
  };
}

/** Les financements de N+1 sur la table, et ce que NOVA en sait. */
export function tableauDesFinancements(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = coutsDuChapitre(c);
  return {
    titre: "Les financements de NOVA pour N+1",
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "Emprunt bancaire", valeurs: [`${eur(x.e.montant)} à ${pct(x.e.taux)} sur ${x.e.dureeAns} ans : in fine, à annuité constante ou à amortissement constant`] },
      { libelle: "Placement privé obligataire", valeurs: [`${qte(x.obligataire.titres)} obligations de ${eur(x.obligataire.nominal / x.obligataire.titres)}, émises ${eur(x.obligataire.prixDEmission)}, coupon ${pct(x.obligataire.tauxNominal)}, remboursées au pair dans ${x.obligataire.dureeAns} ans`] },
      { libelle: "Augmentation de capital", valeurs: [`1 action nouvelle pour ${AUGMENTATION_DE_CAPITAL.parite} anciennes, à ${eur(PRIX_DE_L_ACTION)}`] },
      { libelle: "Crédit-bail de la ligne", valeurs: [`${pct(x.creditBail)} après impôt, calculé au chapitre « Emprunt ou crédit-bail »`] },
      { libelle: "Bilan du 31 décembre N", valeurs: [`${eur(x.augmentation.capitauxPropres)} de capitaux propres, ${eur(DETTES_DU_31_DECEMBRE)} d'emprunt`] },
      { libelle: "Impôt sur les bénéfices", valeurs: [`${pct(x.t)} de chaque euro de résultat`] },
    ],
  };
}

/** Le tableau de l'emprunt à annuité constante, à compléter. */
export function grilleDeLAnnuiteConstante(c: Pick<Cas, "code">): TableauACompleter {
  const x = coutsDuChapitre(c);
  const a = x.annuite.tableau.annees;
  return {
    titre: `${eur(x.e.montant)} à ${pct(x.e.taux)}, ${x.e.dureeAns} annuités constantes`,
    colonnes: ["Capital dû au début", "Intérêts", "Amortissement", "Annuité"],
    colonneDeTotal: 3,
    lignes: [
      ...a.map((y) => ({
        libelle: `Fin de N+${y.annee}`,
        cellules: [
          y.annee === 1 ? donnee(y.capitalDebut, { horsTotal: true }) : aSaisir(y.capitalDebut, `le capital dû l'année d'avant, moins son amortissement : ${eur(y.capitalDebut)}`, { horsTotal: true, indice: "le capital dû au début de l'année d'avant, moins ce qu'elle a remboursé" }),
          y.annee === 1 ? donnee(y.interets) : aSaisir(y.interets, `${eur(y.capitalDebut)} × ${pct(x.e.taux)} = ${eur(y.interets)}`, { indice: "le taux sur le capital dû au début de l'année" }),
          y.annee === 1 ? donnee(y.amortissement) : aSaisir(y.amortissement, `${eur(y.annuite)} − ${eur(y.interets)} = ${eur(y.amortissement)}`, { indice: "l'annuité, moins les intérêts de l'année" }),
          donnee(y.annuite),
        ],
      })),
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: a.map((_, i) => i) },
        cellules: [
          donnee(null),
          aSaisir(x.annuite.interets, `la somme des intérêts : ${eur(x.annuite.interets)}`),
          donnee(x.e.montant),
          donnee(x.annuite.tableau.total),
        ],
      },
    ],
  };
}

/** Le CMPC de NOVA, source par source, à compléter (poids, coûts et contributions en pour cent). */
export function grilleDuCmpc(c: Pick<Cas, "code">): TableauACompleter {
  const x = coutsDuChapitre(c);
  const l = x.cmpc.lignes;
  return {
    titre: "Le coût moyen pondéré du capital de NOVA",
    colonnes: ["Montant", "Poids", "Coût après impôt", "Contribution"],
    tolerance: 0.02,
    lignes: [
      ...l.map((s) => ({
        libelle: s.libelle,
        cellules: [
          donnee(s.montant),
          aSaisir(enPct(s.poids), `${eur(s.montant)} ÷ ${eur(x.cmpc.total)} = ${pct(s.poids)}`, { unite: "%", indice: "le montant de la source ÷ le total des sources" }),
          donnee(enPct(s.cout), { unite: "%", horsTotal: true }),
          aSaisir(enPct(s.contribution), `${pct(s.poids)} × ${pct(s.cout)} = ${pct(s.contribution)}`, { unite: "%", indice: "le poids × le coût après impôt" }),
        ],
      })),
      {
        libelle: "Total : le CMPC",
        fort: true,
        totalDe: { plus: l.map((_, i) => i) },
        cellules: [
          aSaisir(x.cmpc.total, `${l.map((s) => eur(s.montant)).join(" + ")} = ${eur(x.cmpc.total)}`),
          donnee(100, { unite: "%" }),
          donnee(null),
          aSaisir(auCentime(l.reduce((s, y) => s + enPct(y.contribution), 0)), `la somme des contributions : le CMPC, ${pct(x.cmpc.cmpc)}`, { unite: "%" }),
        ],
      },
    ],
  };
}

/** Les coûts après impôt de chaque ressource, côte à côte. */
export function tableauDesCouts(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = coutsDuChapitre(c);
  return {
    titre: "Les ressources de NOVA, après impôt",
    colonnes: ["Coût"],
    lignes: [
      { libelle: "Emprunt bancaire", valeurs: [pct(x.apresImpot)] },
      { libelle: "Emprunt obligataire", valeurs: [pct(x.obligataire.apresImpot)] },
      { libelle: "Crédit-bail de la ligne", valeurs: [pct(x.creditBail)] },
      { libelle: "Capitaux propres", valeurs: [pct(x.medaf)] },
      { libelle: "CMPC", valeurs: [pct(x.cmpc.cmpc)] },
    ],
  };
}

export const ARBITRER_LES_COUTS_DE_FINANCEMENT: Chapitre = {
  code: "arbitrer-les-couts-de-financement",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "Arbitrer les coûts de financement : dette, capital et CMPC",
  accroche:
    "Emprunter à la banque ou auprès d'investisseurs, ouvrir son capital, louer en crédit-bail : chaque ressource de NOVA a un prix. Le chiffrer après impôt, le pondérer en un coût du capital, puis dire jusqu'où la dette reste une bonne affaire.",
  objectifs: [
    "Bâtir le tableau d'un emprunt bancaire in fine, à annuité constante et à amortissement constant, et en calculer le coût actuariel avant et après impôt",
    "Calculer le coût actuariel d'un emprunt obligataire classique in fine, avant et après impôt",
    "Estimer le coût des capitaux propres par l'actualisation du dividende, constant ou en progression, et par le MEDAF",
    "Calculer les modalités financières d'une augmentation de capital et ses effets pour les actionnaires",
    "Calculer le coût moyen pondéré du capital, et discuter l'effet de l'endettement par la théorie du compromis et le financement hiérarchique",
  ],
  libre: false,
  prerequis: ["la-valeur-et-le-temps", "emprunt-ou-credit-bail"],
  ensuite: ["la-creation-de-valeur"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "les coûts se calculent ici sur les financements de NOVA dans la simulation du cours ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chaque ressource a un prix",
      notions: ["loan_schedule", "dilution_issuance"],
      tableau: tableauDesFinancements,
      texte: () => [
        "NOVA finance sa gamme. Elle peut emprunter à sa banque, ou directement auprès d'investisseurs par des obligations. Elle peut aussi ouvrir son capital à de nouveaux associés, ou louer en crédit-bail.",
        "Le prêteur se paie en intérêts, que l'impôt allège : ils sont déductibles. L'actionnaire se paie en dividendes et en plus-values, sur un bénéfice déjà imposé : rien ne l'allège.",
        "Pour arbitrer, on calcule le coût de chaque ressource après impôt, puis leur coût moyen, pondéré par leur poids : le coût du capital de NOVA.",
      ],
      repere: () => "Coût d'une dette = son taux actuariel ; après impôt, chaque charge déductible rend t de son montant. Coût des capitaux propres = la rentabilité qu'exigent les actionnaires. CMPC = Σ poids × coût après impôt.",
    },
    {
      id: "trois-facons-de-rembourser",
      objectifs: [0],
      type: "montants",
      titre: "Trois façons de rembourser",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `NOVA emprunte ${eur(x.e.montant)} à ${pct(x.e.taux)} sur ${x.e.dureeAns} ans. In fine, elle paie les intérêts chaque année et rend tout le capital à la fin. Calculez l'intérêt annuel in fine, le total de ses intérêts, puis l'annuité constante : C × i ÷ (1 − (1 + i)^−n).`;
      },
      champs: (c) => {
        const x = coutsDuChapitre(c);
        return [
          { libelle: "Intérêts d'une année, in fine", attendu: x.inFine.tableau.annees[0]!.interets, calcul: `${eur(x.e.montant)} × ${pct(x.e.taux)} = ${eur(x.inFine.tableau.annees[0]!.interets)}` },
          { libelle: "Total des intérêts, in fine", attendu: x.inFine.interets, calcul: `${x.e.dureeAns} × ${eur(x.inFine.tableau.annees[0]!.interets)} = ${eur(x.inFine.interets)}` },
          { libelle: "Annuité constante", attendu: x.annuiteConstante, calcul: `${eur(x.e.montant)} × ${nb(x.e.taux)} ÷ (1 − ${nb(1 + x.e.taux)}^−${x.e.dureeAns}) = ${eur(x.annuiteConstante)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `In fine, NOVA garde tout le capital ${x.e.dureeAns} ans, et paie ${eur(x.inFine.interets)} d'intérêts. À annuité constante, elle rembourse chaque année une part du capital : les intérêts baissent, l'amortissement monte, et leur somme reste ${eur(x.annuiteConstante)}.`,
          `À amortissement constant, elle rend ${eur(x.amortissement.tableau.annees[0]!.amortissement)} de capital par an : la première annuité est la plus lourde, ${eur(x.amortissement.premiereAnnuite)}, puis elle baisse.`,
        ];
      },
    },
    {
      id: "le-tableau-a-annuite-constante",
      objectifs: [0],
      type: "a-completer",
      titre: "Le tableau à annuité constante",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `À vous, sans formule cette fois. Complétez le tableau de l'emprunt à annuité constante de ${eur(x.annuiteConstante)}. La première année est faite ; la dernière annuité absorbe l'arrondi des centimes.`;
      },
      grille: grilleDeLAnnuiteConstante,
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Intérêts en tout : ${eur(x.inFine.interets)} in fine, ${eur(x.annuite.interets)} à annuité constante, ${eur(x.amortissement.interets)} à amortissement constant. Plus le capital est rendu tôt, moins il coûte d'intérêts.`,
        ];
      },
    },
    {
      id: "predire-le-moins-cher",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le moins cher",
      notions: ["loan_schedule", "irr_payback"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `L'emprunt in fine coûte ${eur(x.inFine.interets)} d'intérêts, l'amortissement constant ${eur(x.amortissement.interets)}. Au même taux de ${pct(x.e.taux)}, sans frais, lequel est le plus cher pour NOVA, en taux actuariel ?`;
      },
      options: () => {
        const voir = "L'étape suivante le calcule.";
        return [
          { texte: "Aucun : tous coûtent 5 %", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "L'in fine, qui paie le plus d'intérêts", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "L'amortissement constant, à la première annuité la plus lourde", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-cout-actuariel",
      objectifs: [0],
      type: "montants",
      titre: "Le coût actuariel, avant et après impôt",
      notions: ["irr_payback", "loan_schedule"],
      tableau: (c) => {
        const x = coutsDuChapitre(c);
        return {
          titre: "Les trois modes, taux actuariels calculés",
          colonnes: ["Intérêts", "Sans frais", `Frais de ${eur(FRAIS_DE_DOSSIER)}`],
          lignes: x.modes.map((m) => ({ libelle: m.libelle, valeurs: [eur(m.interets), pct(m.avantImpot), pct(m.avecFrais)] })),
        };
      },
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `Le tableau donne le taux actuariel de chaque mode, celui qui égale les fonds reçus et la valeur actuelle des annuités. Les intérêts sont déductibles à ${pct(x.t)}. Calculez le coût après impôt de l'emprunt sans frais, en pour cent, puis les fonds que NOVA reçoit si la banque prend ${eur(FRAIS_DE_DOSSIER)} de frais de dossier.`;
      },
      champs: (c) => {
        const x = coutsDuChapitre(c);
        return [
          { libelle: "Coût après impôt, en %", attendu: enPct(x.apresImpot), calcul: `${pct(x.e.taux)} × (1 − ${pct(x.t)}) = ${pct(x.apresImpot)}`, tolerance: 0.01 },
          { libelle: "Fonds reçus, frais déduits", attendu: auCentime(x.e.montant - FRAIS_DE_DOSSIER), calcul: `${eur(x.e.montant)} − ${eur(FRAIS_DE_DOSSIER)} = ${eur(auCentime(x.e.montant - FRAIS_DE_DOSSIER))}` },
        ];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Sans frais, les trois modes coûtent ${pct(x.e.taux)} avant impôt et ${pct(x.apresImpot)} après : l'in fine paie plus d'intérêts parce qu'il garde le capital plus longtemps, pas parce qu'il est plus cher. On choisit le mode selon la trésorerie, pas selon le total des intérêts.`,
          `Les frais rendent les modes inégaux : ${pct(x.inFine.avecFrais)} in fine, ${pct(x.amortissement.avecFrais)} à amortissement constant. Payés une fois, ils pèsent plus lourd sur un capital rendu vite. Après impôt, avec frais, l'annuité constante revient à ${pct(x.annuite.apresImpotAvecFrais)}.`,
        ];
      },
    },
    {
      id: "l-emprunt-obligataire",
      objectifs: [1],
      type: "montants",
      titre: "L'emprunt obligataire",
      notions: ["irr_payback"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        return `À vous, sans formule cette fois. NOVA émet ${qte(o.titres)} obligations de ${eur(o.nominal / o.titres)} à ${eur(o.prixDEmission)}, coupon ${pct(o.tauxNominal)}, remboursées au pair dans ${o.dureeAns} ans ; les frais d'émission sont de ${eur(o.frais)}. Calculez les fonds nets reçus, le coupon annuel total, puis le coût actuariel avant impôt : il est entre ${pct(x.bas, 1)} et ${pct(x.haut, 1)}.`;
      },
      champs: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        const a = x.vaObligataire(x.bas);
        const b = x.vaObligataire(x.haut);
        return [
          { libelle: "Fonds nets reçus", attendu: o.fondsNets, calcul: `${qte(o.titres)} × ${eur(o.prixDEmission)} − ${eur(o.frais)} = ${eur(o.fondsNets)}` },
          { libelle: "Coupon annuel total", attendu: o.coupons, calcul: `${eur(o.nominal)} × ${pct(o.tauxNominal)} = ${eur(o.coupons)}` },
          {
            libelle: "Coût actuariel avant impôt, en %",
            attendu: enPct(x.interpole),
            calcul: `à ${pct(x.bas, 1)} les coupons et le remboursement valent ${eur(a)}, à ${pct(x.haut, 1)} ${eur(b)} ; ${pct(x.bas, 1)} + 0,1 point × (${eur(a)} − ${eur(o.fondsNets)}) ÷ (${eur(a)} − ${eur(b)}) = ${pct(x.interpole)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        return [
          `Le coupon est de ${pct(o.tauxNominal)}, mais NOVA ne reçoit que ${eur(o.fondsNets)} pour en rendre ${eur(o.nominal)} : la prime de remboursement et les frais portent le coût à ${pct(o.avantImpot)}, plus que les ${pct(x.e.taux)} de la banque.`,
        ];
      },
    },
    {
      id: "l-obligataire-apres-impot",
      objectifs: [1],
      type: "montants",
      titre: "L'emprunt obligataire après impôt",
      notions: ["irr_payback"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        return `Les coupons sont déductibles. La prime de remboursement (${eur(o.prime)}) et les frais (${eur(o.frais)}) le sont aussi, étalés à parts égales sur ${o.dureeAns} ans. Calculez la charge étalée de chaque année, l'économie d'impôt annuelle à ${pct(x.t)}, puis ce que NOVA décaisse net chaque année avant le remboursement.`;
      },
      champs: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        return [
          { libelle: "Charge étalée par an", attendu: o.chargeEtalee, calcul: `(${eur(o.prime)} + ${eur(o.frais)}) ÷ ${o.dureeAns} = ${eur(o.chargeEtalee)}` },
          { libelle: "Économie d'impôt annuelle", attendu: o.economie, calcul: `(${eur(o.coupons)} + ${eur(o.chargeEtalee)}) × ${pct(x.t)} = ${eur(o.economie)}` },
          { libelle: "Décaissement net annuel", attendu: auCentime(o.coupons - o.economie), calcul: `${eur(o.coupons)} − ${eur(o.economie)} = ${eur(auCentime(o.coupons - o.economie))}` },
        ];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        const o = x.obligataire;
        return [
          `Avec ces flux nets, le coût actuariel après impôt est de ${pct(o.apresImpot)}, contre ${pct(x.apresImpot)} pour la banque sans frais et ${pct(x.annuite.apresImpotAvecFrais)} avec ses frais. Pour ${eur(x.e.montant)}, l'obligataire ne vaut pas la peine : il se justifie pour de gros montants, où les frais pèsent peu.`,
        ];
      },
    },
    {
      id: "predire-les-capitaux-propres",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le prix des actionnaires",
      notions: ["dilution_issuance"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `L'emprunt coûte ${pct(x.apresImpot)} après impôt. Les associés n'ont droit à aucun intérêt fixe. Leur argent coûte-t-il plus ou moins cher à NOVA ?`;
      },
      options: () => {
        const voir = "Les deux étapes qui suivent le chiffrent, par le dividende puis par le MEDAF.";
        return [
          { texte: "Plus cher que l'emprunt", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Rien : NOVA n'a pas à leur verser de dividende", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Moins cher, puisqu'il n'y a pas d'intérêts à payer chaque année", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "par-le-dividende",
      objectifs: [2],
      type: "montants",
      titre: "Le coût des capitaux propres par le dividende",
      notions: ["dilution_issuance", "total_shareholder_return"],
      question: () => {
        return `Les nouveaux associés paient l'action ${eur(PRIX_DE_L_ACTION)}. NOVA annonce un dividende de ${eur(DIVIDENDE_ANNONCE.premier)} par action. S'il restait constant, ce qu'ils exigent serait D ÷ P. S'il croît de ${pct(DIVIDENDE_ANNONCE.croissance)} par an, D1 ÷ P + g. Calculez les deux, en pour cent.`;
      },
      champs: (c) => {
        const x = coutsDuChapitre(c);
        return [
          { libelle: "Coût par le dividende constant, en %", attendu: enPct(x.constant), calcul: `${eur(DIVIDENDE_ANNONCE.premier)} ÷ ${eur(PRIX_DE_L_ACTION)} = ${pct(x.constant)}`, tolerance: 0.01 },
          { libelle: "Coût par le dividende en progression, en %", attendu: enPct(x.progression), calcul: `${eur(DIVIDENDE_ANNONCE.premier)} ÷ ${eur(PRIX_DE_L_ACTION)} + ${pct(DIVIDENDE_ANNONCE.croissance)} = ${pct(x.progression)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Payer ${eur(PRIX_DE_L_ACTION)} une action qui rapporte ${eur(DIVIDENDE_ANNONCE.premier)}, c'est attendre ${pct(x.constant)} du dividende, et le reste de sa croissance : ${pct(x.progression)} en tout. C'est la formule du cours d'une action, lue à l'envers.`,
          "Oublier la croissance sous-estime l'exigence des associés : un dividende qui monte vaut plus qu'un dividende figé.",
        ];
      },
    },
    {
      id: "par-le-medaf",
      objectifs: [2],
      type: "montants",
      titre: "Le coût des capitaux propres par le MEDAF",
      notions: ["total_shareholder_return"],
      question: () =>
        `Le MEDAF part du taux sans risque, ${pct(TAUX_SANS_RISQUE)}, et y ajoute une prime : la prime du marché, ${pct(PRIME_DE_RISQUE_DU_MARCHE)}, pondérée par le bêta des capitaux propres de NOVA, ${nb(BETA_DES_CAPITAUX_PROPRES)}. Calculez Kc = rf + βc × (Rm − rf), en pour cent.`,
      champs: (c) => {
        const x = coutsDuChapitre(c);
        return [{ libelle: "Coût des capitaux propres, en %", attendu: enPct(x.medaf), calcul: `${pct(TAUX_SANS_RISQUE)} + ${nb(BETA_DES_CAPITAUX_PROPRES)} × ${pct(PRIME_DE_RISQUE_DU_MARCHE)} = ${pct(x.medaf)}`, tolerance: 0.01 }];
      },
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Un bêta de ${nb(BETA_DES_CAPITAUX_PROPRES)} dit que l'action de NOVA varierait un peu plus que le marché : ses associés exigent la prime du marché, et un peu plus. Le MEDAF donne ${pct(x.medaf)}, le dividende ${pct(x.progression)} : deux méthodes, deux estimations proches, que l'analyste confronte.`,
          `Le chapitre retient ${pct(x.medaf)}, le plus prudent. Les capitaux propres coûtent plus du double de l'emprunt après impôt : l'actionnaire porte le risque, et ce qu'on lui verse ne se déduit pas.`,
        ];
      },
    },
    {
      id: "l-augmentation-de-capital",
      objectifs: [3],
      type: "montants",
      titre: "L'augmentation de capital",
      notions: ["dilution_issuance"],
      question: (c) => {
        const a = coutsDuChapitre(c).augmentation;
        return `NOVA a ${qte(a.actions)} actions et ${eur(a.capitauxPropres)} de capitaux propres. Elle émet 1 action nouvelle pour ${a.parite} anciennes, à ${eur(a.prix)}. Calculez les fonds levés, la valeur de l'action avant puis après l'opération (capitaux propres ÷ nombre d'actions), et le bénéfice par action de N avec les actions nouvelles.`;
      },
      champs: (c) => {
        const a = coutsDuChapitre(c).augmentation;
        return [
          { libelle: "Fonds levés", attendu: a.fonds, calcul: `${qte(a.actions)} ÷ ${a.parite} = ${qte(a.nouvelles)} actions × ${eur(a.prix)} = ${eur(a.fonds)}` },
          { libelle: "Valeur de l'action avant", attendu: a.valeurAvant, calcul: `${eur(a.capitauxPropres)} ÷ ${qte(a.actions)} = ${eur(a.valeurAvant)}`, tolerance: 0.01 },
          { libelle: "Valeur de l'action après", attendu: a.valeurApres, calcul: `(${eur(a.capitauxPropres)} + ${eur(a.fonds)}) ÷ ${qte(a.actionsApres)} = ${eur(a.valeurApres)}`, tolerance: 0.01 },
          { libelle: "Bénéfice par action après", attendu: a.bpaApres, calcul: `${eur(CLOTURE_DE_LA_FICHE.resultatNet)} ÷ ${qte(a.actionsApres)} = ${eur(a.bpaApres)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const a = coutsDuChapitre(c).augmentation;
        return [
          `Émise à ${eur(a.prix)}, sous sa valeur de ${eur(a.valeurAvant)}, l'action nouvelle fait baisser la valeur de toutes : ${eur(a.valeurApres)}. Le bénéfice de N, partagé entre ${qte(a.actionsApres)} actions, ne fait plus que ${eur(a.bpaApres)} par action, contre ${eur(a.bpaAvant)}.`,
          `Pour retrouver ce bénéfice par action, les ${eur(a.fonds)} devront faire monter le bénéfice à ${eur(a.beneficeQuiGardeLeBpa)}.`,
        ];
      },
    },
    {
      id: "les-effets-pour-l-actionnaire",
      objectifs: [3],
      type: "choix",
      titre: "Les effets pour l'actionnaire",
      notions: ["dilution_issuance"],
      question: (c) => {
        const a = coutsDuChapitre(c).augmentation;
        return `Un associé détient ${qte(ACTIONS_DE_L_ASSOCIE)} actions, ${pct(a.partAvant)} du capital. Il ne souscrit pas à l'augmentation. Qu'est-ce qui change pour lui ?`;
      },
      options: (c) => {
        const a = coutsDuChapitre(c).augmentation;
        return [
          {
            texte: `Il pèse ${pct(a.partApres)} des votes et perd de la valeur`,
            juste: true,
            retour: `Oui. Il garde ${qte(ACTIONS_DE_L_ASSOCIE)} actions sur ${qte(a.actionsApres)} : son pouvoir est dilué. Et chacune vaut ${eur(a.valeurApres)} au lieu de ${eur(a.valeurAvant)} : ${eur(a.perteDeLAssocie)} de perte, que le droit préférentiel de souscription viendrait compenser (le chapitre « L'augmentation de capital » le calcule).`,
          },
          { texte: "Rien : il garde le même nombre d'actions, donc les mêmes droits et la même richesse", juste: false, retour: `Son nombre d'actions ne bouge pas, mais le total grandit : il ne pèse plus que ${pct(a.partApres)}. Et chaque action vaut moins, émise sous sa valeur.` },
          { texte: "Il gagne : les fonds levés augmentent les capitaux propres de tous", juste: false, retour: `Les capitaux propres montent, mais ils se partagent entre plus d'actions : chacune passe de ${eur(a.valeurAvant)} à ${eur(a.valeurApres)}.` },
        ];
      },
    },
    {
      id: "le-cmpc",
      objectifs: [4],
      type: "a-completer",
      titre: "Le coût moyen pondéré du capital",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const x = coutsDuChapitre(c);
        return `Après N+1, NOVA aura ${eur(x.cmpc.lignes[0]!.montant)} de capitaux propres (augmentation comprise) et ${eur(x.cmpc.lignes[1]!.montant)} de dettes financières (le prêt de N et celui de N+1), en valeurs du bilan. Complétez : le poids de chaque source, sa contribution, poids × coût après impôt, et leur somme, le CMPC.`;
      },
      grille: grilleDuCmpc,
      explication: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Le capital de NOVA lui coûte ${pct(x.cmpc.cmpc)} par an : c'est ce que ses investissements doivent rapporter, au moins, pour satisfaire prêteurs et actionnaires. Un projet qui rapporte moins détruit de la valeur.`,
          "Plus de dette, à ce coût, ferait baisser le CMPC. Mais la dette coûte-t-elle toujours aussi peu quand elle grandit ?",
        ];
      },
    },
    {
      id: "predire-l-optimum",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la dette",
      notions: ["profitability_vs_return"],
      question: () => "Chaque euro de dette fait économiser l'impôt sur ses intérêts. Faut-il donc que NOVA s'endette le plus possible ?",
      options: () => {
        const voir = "Le laboratoire qui suit met en balance l'économie d'impôt et le risque de défaillance.";
        return [
          { texte: "Non, il y a un niveau à ne pas dépasser", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui, l'économie d'impôt grandit avec la dette", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non, la dette ne fait jamais gagner de valeur", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-compromis",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du compromis",
      notions: ["profitability_vs_return", "enterprise_value"],
      question: () =>
        `L'actif de NOVA vaut ${eur(COMPROMIS.valeurSansDette)} sans dette. Une dette permanente fait économiser ${pct(TAUX_DE_L_IMPOT)} de son montant en impôt, en valeur actuelle. Mais plus elle est lourde, plus la défaillance devient probable, et coûteuse. Faites varier la dette et le coût des difficultés ; le graphique trace l'économie, le coût attendu et le gain net. Relevez le défi.`,
      leviers: () => {
        const L = LEVIERS_DU_COMPROMIS;
        return [
          { code: "dette", libelle: "Dette permanente", unite: "€", ...L.dette, depart: 0 },
          { code: "difficultes", libelle: "Coût des difficultés, en part de l'actif", unite: "%", ...L.difficultes, depart: COMPROMIS.partDuCoutDesDifficultes * 100 },
        ];
      },
      lecture: (_c, p) => {
        const r = compromis(p.dette!, p.difficultes!);
        return [
          { libelle: "Économie d'impôt, en valeur actuelle", montant: r.economie },
          { libelle: "Probabilité de défaillance", montant: auCentime(r.probabilite * 100), unite: "%" },
          { libelle: "Coût attendu des difficultés", montant: r.coutAttendu },
          { libelle: "Gain net de la dette", montant: r.gain, reference: 0, effet: true, fort: true },
          { libelle: "Valeur de NOVA", montant: r.valeur, reference: COMPROMIS.valeurSansDette },
        ];
      },
      graphique: () => ({
        levier: "dette",
        courbes: [
          { libelle: "Économie d'impôt", valeur: (p) => compromis(p.dette!, p.difficultes!).economie },
          { libelle: "Coût attendu des difficultés", valeur: (p) => compromis(p.dette!, p.difficultes!).coutAttendu },
          { libelle: "Gain net", valeur: (p) => compromis(p.dette!, p.difficultes!).gain },
        ],
      }),
      defi: () => {
        const pas = LEVIERS_DU_COMPROMIS.dette.pas;
        const d30 = COMPROMIS.partDuCoutDesDifficultes * 100;
        const gain = (d: number) => compromis(d, d30).gain;
        return {
          consigne: `Le coût des difficultés restant à ${nb(d30)} % de l'actif, trouvez la dette, au pas de ${eur(pas)}, qui donne à NOVA la plus grande valeur.`,
          atteint: (p) => p.difficultes === d30 && p.dette === detteOptimale(d30),
          indice: (p) => {
            if (p.difficultes !== d30) return `Le défi garde le coût des difficultés à ${nb(d30)} % : ne bougez que la dette.`;
            if (gain(p.dette! + pas) > gain(p.dette!)) return "Un peu plus de dette ajoute encore de la valeur : montez.";
            return "À ce niveau, le risque coûte déjà plus que l'impôt ne rapporte : descendez.";
          },
          solution: { dette: detteOptimale(d30), difficultes: d30 },
        };
      },
      explication: (_c, p) => {
        const r = compromis(p.dette!, p.difficultes!);
        return [
          `Défi relevé : à ${eur(p.dette!)} de dette, l'économie d'impôt (${eur(r.economie)}) dépasse le plus le coût attendu des difficultés (${eur(r.coutAttendu)}). NOVA vaut ${eur(r.valeur)}. Au-delà, chaque euro de dette coûte plus en risque qu'il ne rapporte en impôt.`,
          "C'est la théorie du compromis : il existe un endettement optimal. Faites jouer le coût des difficultés : plus une défaillance coûterait cher, plus l'optimum recule.",
        ];
      },
    },
    {
      id: "le-financement-hierarchique",
      objectifs: [4],
      type: "choix",
      titre: "Le financement hiérarchique",
      notions: ["dilution_issuance"],
      question: () =>
        "Pour sa gamme, NOVA puise d'abord dans sa réserve et sa CAF, emprunte ensuite, et n'ouvre son capital qu'en dernier. Qu'explique la théorie du financement hiérarchique ?",
      options: () => [
        {
          texte: "Les dirigeants en savent plus que les investisseurs",
          juste: true,
          retour: "Oui. L'autofinancement ne demande rien à personne ; la dette, peu d'explications ; une émission d'actions fait craindre aux investisseurs que les dirigeants vendent des titres qu'ils jugent trop chers. D'où l'ordre : autofinancement, dette, puis capital. NOVA le suit.",
        },
        { texte: "Elle choisit toujours la ressource la moins chère d'abord, quel que soit son niveau de dette", juste: false, retour: "Le coût compte, mais la hiérarchie s'explique surtout par l'information : les investisseurs se méfient d'une entreprise qui émet des actions, et le lui font payer." },
        { texte: "La loi impose d'épuiser l'autofinancement avant d'emprunter", juste: false, retour: "Aucune loi ne l'impose : c'est un comportement observé, que la théorie explique par l'asymétrie d'information entre dirigeants et investisseurs." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["loan_schedule", "irr_payback", "dilution_issuance"],
      tableau: tableauDesCouts,
      texte: (c) => {
        const x = coutsDuChapitre(c);
        return [
          `Vous avez bâti les tableaux d'un emprunt in fine, à annuité constante et à amortissement constant, et vu qu'à taux égal ils coûtent tous ${pct(x.e.taux)}, ${pct(x.apresImpot)} après impôt. L'obligataire, avec sa prime et ses frais, revient à ${pct(x.obligataire.apresImpot)}.`,
          `Vous avez estimé ce qu'exigent les associés, ${pct(x.progression)} par le dividende et ${pct(x.medaf)} par le MEDAF, chiffré l'augmentation de capital et sa dilution, puis pondéré le tout : un CMPC de ${pct(x.cmpc.cmpc)}.`,
          `Vous avez trouvé l'endettement qui donne le plus de valeur, ${eur(x.optimum)}, et relié l'ordre des financements de NOVA à la hiérarchie. Au niveau de l'examen, vous savez arbitrer entre dette et capital.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût d'une dette après impôt : le taux actuariel de ses flux nets d'impôt ; sans frais, taux × (1 − t). Capitaux propres : D ÷ P (constant), D1 ÷ P + g (en progression), rf + βc × (Rm − rf) (MEDAF). CMPC = Kc × CP ÷ (CP + D) + Kd × (1 − t) × D ÷ (CP + D).",
    },
  ],
};
