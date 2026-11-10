import { arrondi2, eur, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { coefficientDActualisation, van } from "../monde/finance";
import {
  CREDIT_BAIL_DE_LA_LIGNE,
  DEPOT_DE_GARANTIE,
  EMPRUNT_DE_LA_LIGNE,
  LIGNE_A_FINANCER,
  TAUX_DE_L_IMPOT,
  comparaison,
  coutApresImpot,
  type LeviersDeLaComparaison,
} from "../monde/financement-de-la-gamme";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : EMPRUNT OU CRÉDIT-BAIL, LE COÛT APRÈS IMPÔT (comptabilité générale, palier 4 ; BTS CG
 * P6 6.5.2, DCG UE6 4.1).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA a choisi la ligne semi-automatique de sa gamme de
 * N+1 (le chapitre « Le TRI et le choix entre deux projets ») ; elle doit maintenant la financer. La
 * banque prête tout son prix à 5 % ; un crédit-bailleur propose de l'acheter et de la lui louer. Les
 * flux et les taux se calculent dans monde/financement-de-la-gamme.ts, sur la ligne, le taux du prêt
 * et le taux d'impôt des autres chapitres de NOVA.
 *
 * L'objet : le coût d'un financement se juge après impôt. Les intérêts d'un emprunt sont déductibles :
 * l'emprunt à 5 % coûte 3,75 % après impôt. Les redevances d'un crédit-bail le sont aussi, en entier ;
 * mais NOVA, qui n'est pas propriétaire, perd l'économie d'impôt sur l'amortissement de la ligne. On
 * compare par la valeur actuelle des flux du crédit-bail, au coût de l'emprunt après impôt, puis par
 * le taux actuariel de chaque financement.
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, l-emprunt-apres-impot, le-tableau-de-l-emprunt (la formule est au repère ou
 *     dans la question) ;
 *   · l'expérience avant la formule : predire-le-moins-cher (un pari, vérifié plus loin) ;
 *     predire-le-taux puis le-taux-au-curseur (le taux d'actualisation qui annule la VAN, au pour
 *     mille) avant le-taux-actuariel (l'interpolation) ;
 *   · autonome : l-economie-perdue, les-flux-du-credit-bail, la-van-au-cout-de-l-emprunt ;
 *   · le laboratoire : le-laboratoire-du-contrat (la redevance, l'option, le taux de la banque), avec
 *     un graphique des deux taux selon la redevance, et un défi de négociation ;
 *   · expert : le-depot-de-garantie (ce que coûte un dépôt rendu sans intérêts), au-dela-du-cout (ce
 *     que le crédit-bail apporte d'autre que son coût) ; puis la synthèse.
 *
 * MATIÈRE : le cours du propriétaire « Gestion des investissements, rentabilité financière » (les
 * conséquences de chaque financement, la méthode des décaissements nets actualisés, le crédit-bail
 * plus coûteux que l'emprunt dans ses exemples), adapté à la ligne de NOVA.
 */

/** Le chapitre se joue chez NOVA : sa ligne, sa banque, son impôt. */
export const ENTREPRISES_DU_FINANCEMENT: readonly string[] = ["nova"];

/** Les bornes du curseur du taux d'actualisation, en pour mille : de 3 % à 6 %. */
export const TAUX_DU_CURSEUR = { min: 30, max: 60 } as const;

/** Les leviers du laboratoire : la redevance et l'option en euros, le taux de la banque en pour cent. */
export const LEVIERS_DU_CONTRAT = {
  redevance: { min: 28_000, max: 36_000, pas: 500 },
  option: { min: 0, max: 30_000, pas: 5_000 },
  taux: { min: 3, max: 7, pas: 0.5 },
} as const;

/** La redevance la plus haute qui garde le crédit-bail au coût de l'emprunt, option à 15 000 € et banque à 5 % : le défi. */
export const REDEVANCE_LIMITE = 31_500;

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
/** Un montant qui peut être négatif, entre parenthèses quand il l'est, pour qu'un « − » ne suive pas un « − ». */
const enCalcul = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Une position du laboratoire, en leviers de la comparaison. */
export const leviersDe = (p: Readonly<Record<string, number>>): Partial<LeviersDeLaComparaison> => ({ redevance: p.redevance!, option: p.option!, tauxDeLEmprunt: p.taux! / 100 });

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois (la fiche est figée). */
export function financementDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre();
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre() {
  const base = comparaison();
  const cb = CREDIT_BAIL_DE_LA_LIGNE;
  const e = EMPRUNT_DE_LA_LIGNE;
  const t = TAUX_DE_L_IMPOT;
  const r = base.coutDeLEmprunt;
  const flux = base.creditBail.flux;
  const dates = base.creditBail.dates;
  const n = cb.dureeAns;
  const horizon = dates.length - 1;
  // La valeur actuelle des décaissements du crédit-bail, au coût de l'emprunt : tout ce qui suit la date 0.
  const decaissements = arrondi2(cb.valeur - base.vanDuCreditBail);
  const vanA = (taux: number) => van(flux, taux);
  const bas = 0.045;
  const haut = 0.046;
  const interpole = bas + ((haut - bas) * -vanA(bas)) / (vanA(haut) - vanA(bas));
  const avecDepot = comparaison({ depot: DEPOT_DE_GARANTIE });
  const coutDuDepot = arrondi2(-DEPOT_DE_GARANTIE + DEPOT_DE_GARANTIE * coefficientDActualisation(r, n));
  return {
    base,
    cb,
    e,
    t,
    r,
    flux,
    dates,
    n,
    horizon,
    decaissements,
    vanA,
    bas,
    haut,
    interpole,
    avecDepot,
    coutDuDepot,
    vanAvecDepot: arrondi2(base.vanDuCreditBail + coutDuDepot),
    dotation: arrondi2(LIGNE_A_FINANCER.montant / LIGNE_A_FINANCER.dureeDAmortissement),
    annuite: (k: number) => base.emprunt.annees[k - 1]!,
    depart: { redevance: cb.redevance, option: cb.option, taux: e.taux * 100 },
  };
}

export type FinancementDuChapitre = ReturnType<typeof financementDuChapitre>;

/** Les deux offres, telles que NOVA les reçoit. */
export function tableauDesOffres(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = financementDuChapitre(c);
  return {
    titre: `Deux façons de financer ${LIGNE_A_FINANCER.libelle}, ${eur(LIGNE_A_FINANCER.montant)} HT`,
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "Emprunt bancaire", valeurs: [`${eur(x.e.montant)} à ${pct(x.e.taux)} l'an sur ${x.e.dureeAns} ans, le capital remboursé en parts égales chaque fin d'année, les intérêts sur le capital dû`] },
      { libelle: "Crédit-bail", valeurs: [`${x.n} redevances de ${eur(x.cb.redevance)} HT, payées chaque fin d'année ; option d'achat de ${eur(x.cb.option)} à la fin de la ${x.n}e année`] },
      { libelle: "Ligne achetée", valeurs: [`amortie en linéaire sur ${LIGNE_A_FINANCER.dureeDAmortissement} ans, ${eur(x.dotation)} par an`] },
      { libelle: "Ligne rachetée à l'option", valeurs: [`amortie sur ${x.cb.dureeDAmortissementDeLOption} an, l'année d'usage qui lui reste`] },
      { libelle: "Impôt sur les bénéfices", valeurs: [`${pct(x.t)} de chaque euro de résultat`] },
    ],
  };
}

/** Le tableau des décaissements nets de l'emprunt, année par année, à compléter. */
export function grilleDeLEmprunt(c: Pick<Cas, "code">): TableauACompleter {
  const x = financementDuChapitre(c);
  const a = x.base.emprunt.annees;
  const total = (f: (y: (typeof a)[number]) => number) => arrondi2(a.reduce((s, y) => s + f(y), 0));
  return {
    titre: "Les décaissements nets de l'emprunt",
    colonnes: ["Intérêts", "Capital", "Économie d'impôt", "Décaissement net"],
    lignes: [
      ...a.map((y) => ({
        libelle: `Fin de N+${y.annee}`,
        cellules: [
          y.annee === 1 ? donnee(y.interets) : aSaisir(y.interets, `${eur(y.capitalDebut)} encore dus × ${pct(x.e.taux)} = ${eur(y.interets)}`, { indice: "le taux sur le capital dû au début de l'année" }),
          donnee(y.amortissement),
          y.annee === 1 ? donnee(y.economieDImpot) : aSaisir(y.economieDImpot, `${eur(y.interets)} × ${pct(x.t)} = ${eur(y.economieDImpot)}`, { indice: "les intérêts de l'année × le taux de l'impôt" }),
          aSaisir(y.decaissementNet, `${eur(y.amortissement)} + ${eur(y.interets)} − ${eur(y.economieDImpot)} = ${eur(y.decaissementNet)}`, { indice: "l'annuité, moins l'impôt qu'elle fait économiser" }),
        ],
      })),
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: a.map((_, i) => i) },
        cellules: [
          aSaisir(x.base.emprunt.interets, `la somme des intérêts : ${eur(x.base.emprunt.interets)}, le coût du crédit avant impôt`),
          donnee(total((y) => y.amortissement)),
          aSaisir(total((y) => y.economieDImpot), `${pct(x.t)} de ${eur(x.base.emprunt.interets)} = ${eur(total((y) => y.economieDImpot))}`),
          aSaisir(total((y) => y.decaissementNet), `la somme de la colonne : ${eur(total((y) => y.decaissementNet))}`),
        ],
      },
    ],
  };
}

/** Les flux du crédit-bail après impôt, date par date, à compléter. */
export function grilleDuCreditBail(c: Pick<Cas, "code">): TableauACompleter {
  const x = financementDuChapitre(c);
  const d = x.dates;
  const vide = donnee(null);
  return {
    titre: "Les flux du crédit-bail après impôt, comparé à l'achat",
    colonnes: ["Prix évité", "Redevance nette", "Économie perdue", "Option", "Flux"],
    colonneDeTotal: 4,
    lignes: d.map((y) => {
      const k = y.date;
      const nom = k === 0 ? "Achat, 1er janvier N+1" : `Fin de N+${k}`;
      const optionDeLaDate = arrondi2(y.economieSurLOption - y.option);
      const premiere = k === 1;
      return {
        libelle: nom,
        cellules: [
          k === 0 ? donnee(x.cb.valeur) : vide,
          y.redevance === 0
            ? vide
            : premiere
              ? aSaisir(-y.redevanceNette, `${eur(y.redevance)} × (1 − ${pct(x.t)}) = ${eur(y.redevanceNette)}, qui sortent`, { indice: "la redevance, moins l'impôt qu'elle fait économiser, en négatif" })
              : donnee(-y.redevanceNette),
          y.economiePerdue === 0
            ? vide
            : premiere || k === x.horizon
              ? aSaisir(-y.economiePerdue, `${eur(x.dotation)} d'amortissement × ${pct(x.t)} = ${eur(y.economiePerdue)} que NOVA n'économise pas`, { indice: "l'impôt que l'amortissement de la ligne achetée aurait épargné, en négatif" })
              : donnee(-y.economiePerdue),
          optionDeLaDate === 0
            ? vide
            : aSaisir(
                optionDeLaDate,
                y.option > 0 ? `l'option, payée : ${eur(-y.option)}` : `${eur(x.cb.option)} d'amortissement de la ligne rachetée × ${pct(x.t)} = ${eur(y.economieSurLOption)} d'impôt économisé`,
                { indice: y.option > 0 ? "le prix de rachat sort à la fin du contrat" : "la ligne rachetée s'amortit : son amortissement fait économiser de l'impôt" },
              ),
          aSaisir(y.flux, `la somme de la ligne : ${eur(y.flux)}`),
        ],
      };
    }),
  };
}

export const EMPRUNT_OU_CREDIT_BAIL: Chapitre = {
  code: "emprunt-ou-credit-bail",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Emprunt ou crédit-bail : le coût après impôt",
  accroche:
    "NOVA doit financer sa ligne semi-automatique : la banque prête tout son prix, un crédit-bailleur propose de la lui louer. Le crédit-bail se déduit en entier, mais fait perdre l'amortissement. Chiffrer les deux après impôt, puis comparer.",
  objectifs: [
    "Calculer le coût après impôt d'un emprunt, avec l'économie d'impôt sur ses intérêts",
    "Établir les flux d'un crédit-bail après impôt : redevances nettes, économie perdue sur l'amortissement, option d'achat",
    "Comparer deux financements par la valeur actuelle de leurs flux et par leur taux actuariel",
    "Mesurer l'effet de la redevance, de l'option, du taux de la banque et d'un dépôt de garantie sur le choix",
  ],
  libre: false,
  prerequis: ["l-emprunt", "le-tri-et-le-choix-entre-deux-projets"],
  ensuite: ["le-plan-de-financement"],
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "le choix du financement se calcule ici sur la ligne semi-automatique de NOVA dans la simulation du cours, avec sa banque et son impôt ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux offres pour une ligne",
      notions: ["loan_schedule", "depreciation"],
      tableau: tableauDesOffres,
      texte: (c) => {
        const x = financementDuChapitre(c);
        return [
          `NOVA a retenu ${LIGNE_A_FINANCER.libelle} pour lancer sa gamme en N+1 : ${eur(LIGNE_A_FINANCER.montant)} HT, achetée le 1er janvier. Reste à la financer. Deux offres sont sur la table.`,
          `La banque prête tout le prix, à ${pct(x.e.taux)}. Le crédit-bailleur, lui, achète la ligne et la loue à NOVA pendant ${x.n} ans ; à la fin, NOVA peut la racheter pour le prix de l'option.`,
          "Avec l'emprunt, NOVA est propriétaire : elle amortit la ligne, et paie des intérêts. Avec le crédit-bail, elle ne l'est pas : elle paie des redevances, et n'amortit rien.",
          `Intérêts, redevances et amortissements sont des charges déductibles. Chacune fait baisser l'impôt de ${pct(x.t)} de son montant. Le vrai coût d'un financement se lit donc après impôt.`,
        ];
      },
      repere: () => "Économie d'impôt = charge déductible × taux de l'impôt. Coût d'un emprunt après impôt = taux × (1 − taux de l'impôt).",
    },
    {
      id: "predire-le-moins-cher",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le moins cher",
      notions: ["loan_schedule"],
      question: () =>
        "Avant tout calcul, pariez. Les redevances du crédit-bail se déduisent en entier, alors que l'emprunt ne déduit que ses intérêts. Après impôt, quel financement coûtera le moins à NOVA ?",
      options: () => {
        const voir = "Les étapes qui suivent le chiffrent : la valeur actuelle des flux, puis le taux actuariel de chaque financement.";
        return [
          { texte: "L'emprunt", juste: true, retour: `Bon pari, à vérifier. ${voir}` },
          { texte: "Le crédit-bail, parce que ses redevances se déduisent en entier", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Aucun : l'impôt efface l'écart entre les deux", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-emprunt-apres-impot",
      objectifs: [0],
      type: "montants",
      titre: "L'emprunt, après impôt",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = financementDuChapitre(c);
        const a = x.annuite(1);
        return `NOVA emprunte ${eur(x.e.montant)} à ${pct(x.e.taux)} sur ${x.e.dureeAns} ans. Fin N+1, elle rembourse ${eur(a.amortissement)} de capital et paie les intérêts de l'année. Calculez ces intérêts, l'impôt qu'ils font économiser, ce qui sort vraiment de la caisse, puis le coût de l'emprunt après impôt, en pour cent.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const a = x.annuite(1);
        return [
          { libelle: "Intérêts de N+1", attendu: a.interets, calcul: `${eur(a.capitalDebut)} × ${pct(x.e.taux)} = ${eur(a.interets)}` },
          { libelle: "Économie d'impôt sur les intérêts", attendu: a.economieDImpot, calcul: `${eur(a.interets)} × ${pct(x.t)} = ${eur(a.economieDImpot)}` },
          { libelle: "Décaissement net de N+1", attendu: a.decaissementNet, calcul: `${eur(a.amortissement)} + ${eur(a.interets)} − ${eur(a.economieDImpot)} = ${eur(a.decaissementNet)}` },
          { libelle: "Coût de l'emprunt après impôt, en %", attendu: arrondi2(x.r * 100), calcul: `${pct(x.e.taux)} × (1 − ${pct(x.t)}) = ${pct(x.r)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        const a = x.annuite(1);
        return [
          `Sur ${eur(a.interets)} d'intérêts, l'État en reprend ${eur(a.economieDImpot)} par l'impôt : l'emprunt ne coûte à NOVA que ${eur(arrondi2(a.interets - a.economieDImpot))}. Rapporté au capital dû, c'est ${pct(x.r)} au lieu de ${pct(x.e.taux)}.`,
          "Le capital remboursé, lui, n'est pas une charge : il ne fait rien économiser.",
        ];
      },
    },
    {
      id: "le-tableau-de-l-emprunt",
      objectifs: [0],
      type: "a-completer",
      titre: "Le tableau de l'emprunt",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Complétez le tableau de l'emprunt, année par année : les intérêts sur le capital dû, l'économie d'impôt à ${pct(x.t)}, et le décaissement net, capital compris. La première année est faite.`;
      },
      grille: grilleDeLEmprunt,
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Sur ${x.e.dureeAns} ans, NOVA décaisse ${eur(arrondi2(x.base.emprunt.annees.reduce((s, y) => s + y.decaissementNet, 0)))} pour ${eur(x.e.montant)} empruntés. Les intérêts baissent avec le capital dû, et l'économie d'impôt avec eux.`,
          `Actualisés à ${pct(x.r)}, ces décaissements valent exactement ${eur(x.e.montant)} : c'est ce que dit un coût de ${pct(x.r)} après impôt. Ce taux sert d'étalon au crédit-bail.`,
        ];
      },
    },
    {
      id: "l-economie-perdue",
      objectifs: [1],
      type: "choix",
      titre: "L'économie que NOVA perd",
      notions: ["depreciation"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `En crédit-bail, NOVA déduit chaque redevance de ${eur(x.cb.redevance)}. Pourquoi faut-il pourtant compter, chaque année, ${eur(arrondi2(x.dotation * x.t))} contre le crédit-bail ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            texte: "La ligne n'est pas à NOVA : elle ne l'amortit pas",
            juste: true,
            retour: `Oui. Achetée, la ligne s'amortirait de ${eur(x.dotation)} par an pendant ${LIGNE_A_FINANCER.dureeDAmortissement} ans, et cet amortissement ferait économiser ${eur(arrondi2(x.dotation * x.t))} d'impôt chaque année. Le crédit-bail la laisse au crédit-bailleur : NOVA perd cette économie.`,
          },
          {
            texte: "Parce que les redevances ne sont déductibles qu'en partie",
            juste: false,
            retour: "Non : une redevance de crédit-bail se déduit en entier, comme un loyer. Ce qui manque, c'est la charge que NOVA aurait eue en achetant.",
          },
          {
            texte: "Parce que le crédit-bailleur répercute son impôt dans la redevance",
            juste: false,
            retour: "Ce que le crédit-bailleur met dans sa redevance est déjà dans son montant. La somme comptée ici vient de NOVA elle-même : une charge qu'elle n'a plus.",
          },
        ];
      },
    },
    {
      id: "les-flux-du-credit-bail",
      objectifs: [1],
      type: "a-completer",
      titre: "Les flux du crédit-bail",
      notions: ["depreciation", "discounting"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `À vous, sans formule cette fois. Comparez le crédit-bail à l'achat, date par date, du côté de NOVA. Le 1er janvier, elle ne paie pas la ligne. Ensuite, la redevance nette d'impôt, l'économie perdue sur l'amortissement, l'option, puis l'amortissement de la ligne rachetée en N+${x.horizon}. Ce qui sort s'écrit en négatif.`;
      },
      grille: grilleDuCreditBail,
      explication: (c) => {
        const x = financementDuChapitre(c);
        const d1 = x.dates[1]!;
        return [
          `Chaque année du contrat coûte ${eur(-d1.flux)} : ${eur(d1.redevanceNette)} de redevance nette, plus ${eur(d1.economiePerdue)} d'économie perdue. La dernière année ajoute l'option.`,
          `En N+${x.horizon}, NOVA aurait encore amorti une ligne achetée ; la ligne rachetée s'amortit aussi, mais sur ${eur(x.cb.option)} seulement : il reste ${eur(-x.flux[x.horizon]!)} de perte.`,
        ];
      },
    },
    {
      id: "la-van-au-cout-de-l-emprunt",
      objectifs: [2],
      type: "montants",
      titre: "Le crédit-bail au coût de l'emprunt",
      notions: ["discounting"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Actualisez les flux du crédit-bail au coût de l'emprunt après impôt, ${pct(x.r)}. Calculez la valeur actuelle de tout ce qui suit le 1er janvier, puis la VAN du crédit-bail : le prix évité, moins cette valeur actuelle.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const termes = x.flux.slice(1).map((f, i) => `${eur(-f)} × ${(1 + x.r).toLocaleString("fr-FR", { maximumFractionDigits: 4 })}^−${i + 1}`);
        return [
          { libelle: "Valeur actuelle des décaissements du crédit-bail", attendu: x.decaissements, calcul: `${termes.join(" + ")} = ${eur(x.decaissements)}` },
          { libelle: "VAN du crédit-bail", attendu: x.base.vanDuCreditBail, calcul: `${eur(x.cb.valeur)} − ${eur(x.decaissements)} = ${eur(x.base.vanDuCreditBail)}` },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Au coût de l'emprunt, l'emprunt a une VAN nulle : ses décaissements valent ce qu'il apporte. Le crédit-bail, lui, a une VAN de ${eur(x.base.vanDuCreditBail)} : il coûte ${eur(-x.base.vanDuCreditBail)} de plus, en valeur d'aujourd'hui.`,
          "Votre pari se vérifie ici : l'emprunt est moins cher. La perte de l'amortissement pèse plus que la déduction des redevances.",
        ];
      },
    },
    {
      id: "predire-le-taux",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le taux",
      notions: ["irr_payback"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le taux actuariel du crédit-bail est le taux qui annule sa VAN. À ${pct(x.r)}, elle vaut ${eur(x.base.vanDuCreditBail)}. Ce taux est-il plus haut ou plus bas que ${pct(x.r)} ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        const voir = "Le curseur de l'étape suivante fait varier le taux d'actualisation : vous le verrez.";
        return [
          { texte: `Plus haut que ${pct(x.r)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Plus bas que ${pct(x.r)}, puisque la VAN est négative`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Égal à ${pct(x.r)} : les deux financements ont la même banque`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le taux, au curseur",
      notions: ["irr_payback", "discounting"],
      question: () =>
        `Faites varier le taux d'actualisation, de ${TAUX_DU_CURSEUR.min} ‰ à ${TAUX_DU_CURSEUR.max} ‰ (${TAUX_DU_CURSEUR.min} ‰ font ${pct(TAUX_DU_CURSEUR.min / 1000)}). Une droite donne ce que le crédit-bail évite de payer le 1er janvier ; l'autre, la valeur actuelle de ce qu'il coûte ensuite. Placez le curseur sur le plus petit taux où la première couvre la seconde.`,
      grandeur: () => ({ libelle: "Taux d'actualisation", unite: "‰" }),
      cible: (c) => {
        const x = financementDuChapitre(c);
        const attendu = Math.ceil(x.base.tauxDuCreditBail * 1000);
        return { attendu, min: TAUX_DU_CURSEUR.min, max: TAUX_DU_CURSEUR.max };
      },
      zones: ["Le crédit-bail vaut plus qu'il ne coûte", "Le crédit-bail coûte plus qu'il n'apporte"],
      rates: () => ({
        dessous: "À ce taux, la valeur actuelle de ce que coûte le crédit-bail dépasse encore le prix évité.",
        dessus: "À un taux plus bas, le prix évité couvre déjà ce que coûte le crédit-bail : cherchez le plus petit taux.",
      }),
      montrer: "Montrer le taux",
      lecture: (c, q) => {
        const x = financementDuChapitre(c);
        const v = x.vanA(q / 1000);
        return [
          { libelle: "Prix de la ligne, évité le 1er janvier", montant: x.cb.valeur },
          { libelle: `Valeur actuelle des décaissements, à ${pct(q / 1000)}`, montant: arrondi2(x.cb.valeur - v) },
          { libelle: `VAN du crédit-bail, à ${pct(q / 1000)}`, montant: v, fort: true },
        ];
      },
      droites: (c) => {
        const x = financementDuChapitre(c);
        return { produit: () => x.cb.valeur, cout: (q) => arrondi2(x.cb.valeur - x.vanA(q / 1000)), libelles: ["Prix évité", "Valeur actuelle des décaissements"] };
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `À ${pct(x.bas)}, la VAN vaut encore ${eur(x.vanA(x.bas))} ; à ${pct(x.haut)}, ${eur(x.vanA(x.haut))}. Le taux actuariel du crédit-bail est entre les deux, au-dessus des ${pct(x.r)} de l'emprunt.`,
          "Plus le taux monte, moins pèsent les décaissements lointains : la courbe descend. Le taux qui l'amène au prix évité est le coût du crédit-bail.",
        ];
      },
    },
    {
      id: "le-taux-actuariel",
      objectifs: [2],
      type: "montants",
      titre: "Le taux actuariel, par interpolation",
      notions: ["irr_payback"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le taux est entre ${pct(x.bas)} et ${pct(x.haut)}. Calculez la VAN du crédit-bail à chacun, puis le taux qui l'annule, par interpolation linéaire, en pour cent au centième.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const a = x.vanA(x.bas);
        const b = x.vanA(x.haut);
        return [
          { libelle: `VAN à ${pct(x.bas)}`, attendu: a, calcul: `${eur(x.cb.valeur)} − la valeur actuelle des décaissements à ${pct(x.bas)} = ${eur(a)}` },
          { libelle: `VAN à ${pct(x.haut)}`, attendu: b, calcul: `${eur(x.cb.valeur)} − la valeur actuelle des décaissements à ${pct(x.haut)} = ${eur(b)}` },
          {
            libelle: "Taux actuariel du crédit-bail après impôt, en %",
            attendu: arrondi2(x.interpole * 100),
            calcul: `${pct(x.bas)} + 0,1 point × ${eur(-a)} ÷ (${eur(-a)} + ${eur(b)}) = ${pct(x.interpole)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Le crédit-bail coûte ${pct(x.base.tauxDuCreditBail)} après impôt, l'emprunt ${pct(x.r)}. Les deux méthodes disent la même chose : la VAN au coût de l'emprunt est négative, et le taux du crédit-bail le dépasse.`,
          `Avant impôt, l'écart était plus grand encore : ${pct(x.base.tauxAvantImpot)} pour le crédit-bail, ${pct(x.e.taux)} pour l'emprunt. L'impôt le réduit, sans l'effacer.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-contrat",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du contrat",
      notions: ["irr_payback", "discounting", "loan_schedule"],
      question: () =>
        "Faites varier la redevance, le prix de l'option et le taux de la banque : le tableau suit le coût de l'emprunt après impôt, le taux du crédit-bail après impôt et sa VAN au coût de l'emprunt. Le graphique trace les deux taux selon la redevance. Relevez le défi.",
      leviers: (c) => {
        const x = financementDuChapitre(c);
        const L = LEVIERS_DU_CONTRAT;
        return [
          { code: "redevance", libelle: "Redevance annuelle, HT", unite: "€", ...L.redevance, depart: x.depart.redevance },
          { code: "option", libelle: "Prix de l'option d'achat", unite: "€", ...L.option, depart: x.depart.option },
          { code: "taux", libelle: "Taux de la banque", unite: "%", ...L.taux, depart: x.depart.taux },
        ];
      },
      lecture: (c, p) => {
        const x = financementDuChapitre(c);
        const l = comparaison(leviersDe(p));
        return [
          { libelle: "Coût de l'emprunt après impôt", montant: arrondi2(l.coutDeLEmprunt * 100), unite: "%", reference: arrondi2(x.r * 100) },
          { libelle: "Taux du crédit-bail après impôt", montant: arrondi2(l.tauxDuCreditBail * 100), unite: "%", reference: arrondi2(x.base.tauxDuCreditBail * 100) },
          { libelle: "Taux du crédit-bail avant impôt", montant: arrondi2(l.tauxAvantImpot * 100), unite: "%", reference: arrondi2(x.base.tauxAvantImpot * 100) },
          { libelle: "VAN du crédit-bail au coût de l'emprunt", montant: l.vanDuCreditBail, reference: x.base.vanDuCreditBail, effet: true, fort: true },
        ];
      },
      graphique: () => ({
        levier: "redevance",
        unite: "%",
        courbes: [
          { libelle: "Taux du crédit-bail après impôt", valeur: (p) => arrondi2(comparaison(leviersDe(p)).tauxDuCreditBail * 100) },
          { libelle: "Coût de l'emprunt après impôt", valeur: (p) => arrondi2(coutApresImpot(p.taux! / 100) * 100) },
        ],
      }),
      defi: (c) => {
        const x = financementDuChapitre(c);
        const L = LEVIERS_DU_CONTRAT;
        const vanDe = (p: Readonly<Record<string, number>>) => comparaison(leviersDe(p)).vanDuCreditBail;
        const auDepart = (p: Readonly<Record<string, number>>) => p.option === x.depart.option && p.taux === x.depart.taux;
        return {
          consigne: `Négociez la redevance. L'option restant à ${eur(x.depart.option)} et la banque à ${pct(x.e.taux)}, trouvez la redevance la plus haute à laquelle le crédit-bail ne coûte pas plus que l'emprunt, au pas de ${eur(L.redevance.pas)}.`,
          atteint: (p) => auDepart(p) && vanDe(p) >= 0 && vanDe({ ...p, redevance: p.redevance! + L.redevance.pas }) < 0,
          indice: (p) => {
            if (!auDepart(p)) return `Le défi garde l'option à ${eur(x.depart.option)} et la banque à ${pct(x.e.taux)} : ne bougez que la redevance.`;
            if (vanDe(p) < 0) return `À cette redevance, le crédit-bail coûte encore ${eur(-vanDe(p))} de plus que l'emprunt : baissez-la.`;
            return "Le crédit-bail ne coûte pas plus que l'emprunt, mais le crédit-bailleur accepterait une redevance plus haute : montez-la.";
          },
          solution: { redevance: REDEVANCE_LIMITE, option: x.depart.option, taux: x.depart.taux },
        };
      },
      explication: (c, p) => {
        const x = financementDuChapitre(c);
        const l = comparaison(leviersDe(p));
        return [
          `Défi relevé : à ${eur(p.redevance!)}, le crédit-bail coûte ${pct(l.tauxDuCreditBail)} après impôt, sous les ${pct(l.coutDeLEmprunt)} de l'emprunt. Il faudrait que le crédit-bailleur baisse sa redevance de ${eur(x.cb.redevance - p.redevance!)} par an.`,
          "Les autres leviers jouent aussi. Une option plus chère alourdit la fin du contrat. Une banque plus chère relève l'étalon : le crédit-bail redevient compétitif quand l'emprunt coûte plus.",
        ];
      },
    },
    {
      id: "le-depot-de-garantie",
      objectifs: [3],
      type: "montants",
      titre: "Un dépôt de garantie",
      notions: ["discounting"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le crédit-bailleur demande en plus un dépôt de garantie d'une redevance, ${eur(DEPOT_DE_GARANTIE)}, versé le 1er janvier N+1 et rendu sans intérêts fin N+${x.n}. Calculez ce que coûte ce dépôt en valeur actuelle, au coût de l'emprunt, puis la nouvelle VAN du crédit-bail.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            libelle: "Coût du dépôt en valeur actuelle",
            attendu: x.coutDuDepot,
            calcul: `− ${eur(DEPOT_DE_GARANTIE)} + ${eur(DEPOT_DE_GARANTIE)} × ${(1 + x.r).toLocaleString("fr-FR", { maximumFractionDigits: 4 })}^−${x.n} = ${eur(x.coutDuDepot)}`,
          },
          { libelle: "VAN du crédit-bail avec le dépôt", attendu: x.vanAvecDepot, calcul: `${enCalcul(x.base.vanDuCreditBail)} + ${enCalcul(x.coutDuDepot)} = ${eur(x.vanAvecDepot)}` },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Rendu au centime, le dépôt coûte pourtant ${eur(-x.coutDuDepot)} : NOVA prête ${eur(DEPOT_DE_GARANTIE)} pendant ${x.n} ans sans intérêts. Avec lui, le crédit-bail monte à ${pct(x.avecDepot.tauxDuCreditBail)} après impôt.`,
          "Un dépôt, un premier loyer majoré, des frais de dossier : chaque clause du contrat entre dans ses flux, et se juge en valeur actuelle.",
        ];
      },
    },
    {
      id: "au-dela-du-cout",
      objectifs: [3],
      type: "choix",
      titre: "Au-delà du coût",
      notions: ["loan_schedule", "balance_sheet"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le crédit-bail coûte ${eur(-x.base.vanDuCreditBail)} de plus que l'emprunt. Un associé veut pourtant le retenir. Lequel de ses arguments tient ?`;
      },
      options: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            texte: "Il finance toute la ligne, sans apport",
            juste: true,
            retour: `Oui. Le crédit-bail finance tout le prix, sans garantie à donner, et laisse la réserve et la capacité d'emprunt de NOVA pour autre chose. C'est un avantage réel, qui se paie ici ${eur(-x.base.vanDuCreditBail)} : à NOVA de dire s'il les vaut.`,
          },
          {
            texte: "Il n'est pas une dette, alors les banques ne le comptent pas",
            juste: false,
            retour: "Non : les redevances à venir figurent dans l'annexe, et l'analyste retraite le crédit-bail comme un achat financé par emprunt. Le chapitre « Soldes intermédiaires de gestion et CAF » le fait.",
          },
          {
            texte: "Ses redevances se déduisent en entier : il est donc toujours moins cher",
            juste: false,
            retour: "Le calcul vient de le montrer : la déduction des redevances ne compense pas la perte de l'amortissement. Le moins cher se calcule, il ne se devine pas.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["loan_schedule", "discounting", "irr_payback"],
      texte: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Vous avez calculé le coût de l'emprunt après impôt, ${pct(x.r)} pour ${pct(x.e.taux)} de taux, et établi les flux du crédit-bail : la redevance nette, l'économie perdue sur l'amortissement, l'option.`,
          `Vous avez comparé les deux : au coût de l'emprunt, le crédit-bail a une VAN de ${eur(x.base.vanDuCreditBail)}, et son taux actuariel après impôt est de ${pct(x.base.tauxDuCreditBail)}. NOVA empruntera.`,
          `Vous avez négocié au laboratoire : sous ${eur(REDEVANCE_LIMITE + LEVIERS_DU_CONTRAT.redevance.pas)} de redevance, le crédit-bail l'emporterait. Au niveau de l'examen, vous savez comparer deux financements après impôt et justifier le choix.`,
          "Dans l'arène, les chiffres de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût de l'emprunt après impôt = taux × (1 − t). Flux du crédit-bail : + prix évité ; − redevance × (1 − t) ; − amortissement évité × t ; − option ; + amortissement de l'option × t. Le financement le moins cher a le taux actuariel le plus bas.",
    },
  ],
};
