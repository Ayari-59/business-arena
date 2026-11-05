import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  CONTRATS_D_ASSURANCE,
  ECHARPE_EN_DECEMBRE,
  PROTECTIONS,
  RISQUES,
  SEUIL_DE_DEMARQUE,
  contratDAssurance,
  coutMoyenDuRisque,
  demarqueDeJanvier,
  inventaireDeDecembre,
  meilleureProtection,
  protegerLaBoutique,
  type CodeDeProtection,
} from "../monde/inventaire-de-la-boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'INVENTAIRE ET LA DÉMARQUE (BTS MCO, bloc 3, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde) : la boutique MAILLE & CO, sa fiche
 * (monde/maille-et-co.ts) et le module de son inventaire (monde/inventaire-de-la-boutique.ts). Une
 * évolution du moteur ne change rien ici.
 *
 * L'objet : l'inventaire obligatoire de fin d'exercice, la valeur du stock selon la méthode (coût moyen
 * pondéré ou premier entré, premier sorti) et ce qu'elle change à la marge ; puis la démarque, ce
 * qu'elle coûte, ce qu'une protection évite ; enfin les risques de la boutique, ce qui se prévient,
 * ce qui s'assure, ce qui s'accepte, et le droit d'un vol constaté.
 *
 * Le piège central : la démarque se lit au comptage, pas dans la caisse ; et deux protections ne
 * s'additionnent pas, chacune agit sur ce que l'autre a laissé.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026) :
 *   · guidé : intro, le-cout-moyen (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-la-methode avant la-fiche-de-stock ; predire-les-
 *     protections puis le-laboratoire-de-la-prevention (quatre protections, le gain de chaque
 *     combinaison) avant quelle-protection-acheter ;
 *   · autonome : la-fiche-de-stock, la-marge-selon-la-methode, la-demarque-de-janvier, ce-que-coute-
 *     la-demarque (ni formule ni chiffres à prendre donnés) ;
 *   · expert : les-risques-de-la-boutique (un tri), l-assurance (deux contrats), le-vol-constate (le
 *     droit d'un incident), quelle-protection-acheter (un jugement) ; puis la synthèse.
 *
 * Le droit cité : l'inventaire au moins une fois tous les douze mois (Code de commerce, art. L123-12) ;
 * la permanence des méthodes comptables ; l'appréhension de l'auteur d'un flagrant délit par toute
 * personne, qui le conduit devant un officier de police judiciaire (Code de procédure pénale, art. 73),
 * sans fouille ; la déclaration d'un vol à l'assureur sous deux jours ouvrés (Code des assurances,
 * art. L113-2).
 */

export const ENTREPRISES_DE_L_INVENTAIRE: readonly string[] = ["boutique"];

const POURQUOI =
  "ce chapitre se joue à la boutique du cours, MAILLE & CO : son inventaire compte les articles de ses rayons, et c'est le même point de vente d'un chapitre à l'autre du parcours.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Les protections dans l'ordre du laboratoire, et leurs leviers (non ou oui). */
const CODES_DES_PROTECTIONS: readonly CodeDeProtection[] = ["antivol", "cameras", "vigile", "formation"];
const choisiesDe = (p: Readonly<Record<string, number>>) => CODES_DES_PROTECTIONS.filter((code) => p[code] === 1);

/** Tout ce que le chapitre et son cas lisent, calculé une fois du cas. */
export function inventaireEtDemarque(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const cmup = inventaireDeDecembre(f, "cmup-periode");
  const peps = inventaireDeDecembre(f, "peps");
  const d = demarqueDeJanvier(f);
  const meilleure = meilleureProtection(f);
  const a = contratDAssurance("A");
  const b = contratDAssurance("B");
  const echarpe = f.gamme.find((r) => r.code === "echarpe")!;
  return {
    f,
    cmup,
    peps,
    ecartDeStock: auCentime(peps.final.valeur - cmup.final.valeur),
    ecartDeMarge: auCentime(peps.margeCommerciale - cmup.margeCommerciale),
    echarpe,
    d,
    tauxAffiche: auDixieme(d.taux * 100),
    meilleure,
    antivolEtCameras: protegerLaBoutique(f, ["antivol", "cameras"]),
    seule: (code: CodeDeProtection) => protegerLaBoutique(f, [code]),
    a,
    b,
    moinsCher: a.coutMoyenParAn <= b.coutMoyenParAn ? a : b,
  };
}

export type InventaireEtDemarque = ReturnType<typeof inventaireEtDemarque>;

/** La fiche de stock de l'écharpe en décembre, telle qu'on la donne à l'élève. */
export function tableauDeDecembre(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = inventaireEtDemarque(c);
  const e = ECHARPE_EN_DECEMBRE;
  return {
    titre: `${x.f.entreprise} · l'écharpe en décembre de N − 1`,
    colonnes: ["Quantité", "Prix d'achat"],
    lignes: [
      { libelle: "Stock du 1er décembre", valeurs: [qte(e.initial.quantite), eur(e.initial.prix)] },
      ...e.livraisons.map((l) => ({ libelle: `Livraison du ${l.jour} décembre`, valeurs: [qte(l.quantite), eur(l.prix)] })),
      { libelle: "Ventes de décembre", valeurs: [qte(e.vendues), "à valoriser"] },
      { libelle: "Comptage du 31 décembre", valeurs: [qte(e.comptees), "à valoriser"] },
    ],
  };
}

/** Le comptage du 31 janvier face au stock théorique, référence par référence. */
export function tableauDuComptage(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = inventaireEtDemarque(c);
  return {
    titre: `${x.f.entreprise} · le comptage du 31 janvier`,
    colonnes: ["Stock théorique", "Démarque connue", "Compté", "Prix HT", "Coût d'achat"],
    lignes: x.d.references.map((r) => {
      const g = x.f.gamme.find((k) => k.code === r.code)!;
      return { libelle: r.nom, valeurs: [qte(r.theorique), qte(r.connue), qte(r.comptees), eur(g.prixHt), eur(g.coutDAchat)] };
    }),
  };
}

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const aSaisir = (valeur: number, calcul: string, indice: string): CelluleACompleter => ({ valeur, saisir: true, calcul, indice });

/** La fiche de stock à compléter : les sorties et le stock final, au coût moyen pondéré et au premier entré, premier sorti. */
function grilleDeLaFiche(x: InventaireEtDemarque): TableauACompleter {
  const e = ECHARPE_EN_DECEMBRE;
  const [l1, l2] = e.livraisons;
  const m = x.cmup.manquant.quantite;
  const plusAnciens = e.initial.quantite + l1.quantite;
  return {
    titre: `${x.f.entreprise} · la fiche de stock de l'écharpe, décembre de N − 1`,
    colonnes: ["Quantité", "Au coût moyen", "Premier entré"],
    lignes: [
      { libelle: "Stock du 1er décembre", cellules: [donnee(e.initial.quantite, "écharpes"), donnee(x.cmup.initial.valeur), donnee(x.peps.initial.valeur)] },
      { libelle: `Livraison du ${l1.jour} décembre`, cellules: [donnee(l1.quantite, "écharpes"), donnee(auCentime(l1.quantite * l1.prix)), donnee(auCentime(l1.quantite * l1.prix))] },
      { libelle: `Livraison du ${l2.jour} décembre`, cellules: [donnee(l2.quantite, "écharpes"), donnee(auCentime(l2.quantite * l2.prix)), donnee(auCentime(l2.quantite * l2.prix))] },
      {
        libelle: "Ventes de décembre",
        cellules: [
          donnee(e.vendues, "écharpes"),
          aSaisir(x.cmup.ventes, `${qte(e.vendues)} × ${eur(x.cmup.coutMoyen)} = ${eur(x.cmup.ventes)}`, "les écharpes vendues au coût moyen du mois"),
          aSaisir(x.peps.ventes, `${qte(plusAnciens)} × ${eur(l1.prix)} + ${qte(e.vendues - plusAnciens)} × ${eur(l2.prix)} = ${eur(x.peps.ventes)}`, "les lots les plus anciens d'abord"),
        ],
      },
      {
        libelle: "Manquant à l'inventaire",
        cellules: [
          donnee(m, "écharpes"),
          aSaisir(x.cmup.manquant.valeur, `${qte(m)} × ${eur(x.cmup.coutMoyen)} = ${eur(x.cmup.manquant.valeur)}`, "le manquant au coût moyen"),
          aSaisir(x.peps.manquant.valeur, `${qte(m)} × ${eur(l2.prix)} = ${eur(x.peps.manquant.valeur)}, pris sur le dernier lot`, "après les ventes, il ne reste que le dernier lot"),
        ],
      },
      {
        libelle: "Stock du 31 décembre",
        fort: true,
        totalDe: { plus: [0, 1, 2], moins: [3, 4] },
        cellules: [
          donnee(e.comptees, "écharpes"),
          aSaisir(x.cmup.final.valeur, `${qte(e.comptees)} × ${eur(x.cmup.coutMoyen)} = ${eur(x.cmup.final.valeur)}`, "le stock compté au coût moyen"),
          aSaisir(x.peps.final.valeur, `${qte(e.comptees)} × ${eur(l2.prix)} = ${eur(x.peps.final.valeur)}`, "le stock final est fait du dernier lot"),
        ],
      },
    ],
  };
}

export const L_INVENTAIRE_ET_LA_DEMARQUE: Chapitre = {
  code: "l-inventaire-et-la-demarque",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "L'inventaire et la démarque",
  accroche:
    "L'inventaire compte ce que la boutique possède vraiment. Sa valeur dépend de la méthode, et la marge avec elle. Ce qui manque au comptage est la démarque : ce qu'elle coûte, ce qu'une protection évite, et ce qui s'assure.",
  objectifs: [
    "Valoriser un stock au coût moyen pondéré et au premier entré, premier sorti, à partir de l'inventaire",
    "Mesurer l'effet de la méthode de valorisation sur la marge",
    "Calculer la démarque inconnue, son taux et son coût",
    "Chiffrer une protection contre la démarque face à la démarque évitée",
    "Évaluer les risques de la boutique et choisir entre prévenir, assurer et accepter",
  ],
  libre: false,
  prerequis: ["stock-du-point-de-vente"],
  ensuite: ["recruter-integrer-former"],
  entreprises: { codes: ENTREPRISES_DE_L_INVENTAIRE, pourquoi: POURQUOI },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Compter ce que la boutique possède",
      notions: ["stock", "weighted_average_cost"],
      tableau: tableauDeDecembre,
      texte: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. La loi impose un inventaire au moins une fois tous les 12 mois : à la clôture, la boutique compte chaque article et lui donne une valeur.`,
          `Le stock théorique est celui de la fiche de stock : le stock du début, plus les entrées, moins les sorties. Le comptage donne le stock réel. Quand il trouve moins, la différence est un manquant.`,
          `Le façonnier a relevé son prix le 14 décembre. Deux méthodes du plan comptable valorisent alors les sorties : le coût moyen pondéré de la période, ou le premier entré, premier sorti, qui fait sortir les lots les plus anciens d'abord.`,
        ];
      },
      repere: () => "Stock théorique = stock initial + entrées − sorties. Coût moyen pondéré = (valeur du stock initial + valeur des entrées) ÷ (quantité initiale + quantités entrées).",
    },
    {
      id: "le-cout-moyen",
      objectifs: [0],
      type: "montants",
      titre: "Le coût moyen du mois",
      notions: ["weighted_average_cost", "stock"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Calculez le stock théorique du 31 décembre (le disponible moins les ${qte(ECHARPE_EN_DECEMBRE.vendues)} écharpes vendues), le manquant face aux ${qte(ECHARPE_EN_DECEMBRE.comptees)} écharpes comptées, puis le coût moyen pondéré de décembre (${eur(x.cmup.disponible.valeur)} pour ${qte(x.cmup.disponible.quantite)} écharpes).`;
      },
      champs: (c) => {
        const x = inventaireEtDemarque(c);
        const theorique = x.cmup.disponible.quantite - ECHARPE_EN_DECEMBRE.vendues;
        return [
          { libelle: "Stock théorique du 31 décembre", attendu: theorique, calcul: `${qte(x.cmup.disponible.quantite)} − ${qte(ECHARPE_EN_DECEMBRE.vendues)} = ${qte(theorique)} écharpes` },
          { libelle: "Manquant à l'inventaire", attendu: x.cmup.manquant.quantite, calcul: `${qte(theorique)} − ${qte(ECHARPE_EN_DECEMBRE.comptees)} = ${qte(x.cmup.manquant.quantite)} écharpes` },
          { libelle: "Coût moyen pondéré", attendu: x.cmup.coutMoyen, calcul: `${eur(x.cmup.disponible.valeur)} ÷ ${qte(x.cmup.disponible.quantite)} = ${eur(x.cmup.coutMoyen)}` },
        ];
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `La fiche annonce ${qte(x.cmup.disponible.quantite - ECHARPE_EN_DECEMBRE.vendues)} écharpes, le rayon en montre ${qte(ECHARPE_EN_DECEMBRE.comptees)}. Le manquant sort du stock lui aussi : il n'a pas été vendu, mais il n'est plus là. Au coût moyen, chaque écharpe sortie vaut ${eur(x.cmup.coutMoyen)}.`,
        ];
      },
    },
    {
      id: "predire-la-methode",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la méthode",
      notions: ["weighted_average_cost", "stock"],
      question: () =>
        "Avant de remplir la fiche, pariez. Les prix ont monté en décembre. Au premier entré, premier sorti, le stock du 31 décembre vaudra, face au coût moyen…",
      options: (c) => {
        const x = inventaireEtDemarque(c);
        const voir = "Remplissez la fiche de stock à l'étape suivante, dans les deux méthodes : le stock final dit qui l'emporte.";
        return [
          { texte: "Plus : il garde les derniers lots, plus chers", juste: x.ecartDeStock > 0, retour: `Bon pari. ${voir}` },
          { texte: "Autant : la méthode ne change pas les quantités", juste: x.ecartDeStock === 0, retour: `Pari à vérifier : les quantités sont les mêmes, pas les prix. ${voir}` },
          { texte: "Moins : les premiers lots sont restés en rayon", juste: x.ecartDeStock < 0, retour: `Pari à vérifier : les premiers lots sortent d'abord. ${voir}` },
        ];
      },
    },
    {
      id: "la-fiche-de-stock",
      objectifs: [0],
      type: "a-completer",
      titre: "La fiche de stock de décembre",
      notions: ["weighted_average_cost", "stock"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Complétez la fiche dans les deux méthodes : les ventes, le manquant et le stock du 31 décembre, au coût moyen de ${eur(x.cmup.coutMoyen)} puis au premier entré, premier sorti. La ligne du stock final fait le disponible moins les sorties.`;
      },
      grille: (c) => grilleDeLaFiche(inventaireEtDemarque(c)),
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `Au premier entré, premier sorti, les ventes emportent les ${qte(ECHARPE_EN_DECEMBRE.initial.quantite + ECHARPE_EN_DECEMBRE.livraisons[0].quantite)} écharpes à ${eur(ECHARPE_EN_DECEMBRE.initial.prix)} d'abord : le stock du 31 décembre est fait du dernier lot et vaut ${eur(x.peps.final.valeur)}, contre ${eur(x.cmup.final.valeur)} au coût moyen.`,
          `${x.f.entreprise} valorise son stock au premier entré, premier sorti : l'écharpe du 1er janvier vaut donc ${eur(x.echarpe.coutDAchat)}, le coût d'achat que lisent les autres chapitres de la boutique.`,
        ];
      },
    },
    {
      id: "la-marge-selon-la-methode",
      objectifs: [1],
      type: "montants",
      titre: "La marge selon la méthode",
      notions: ["weighted_average_cost", "margin_rates"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Sans formule cette fois. Décembre a vendu ${qte(ECHARPE_EN_DECEMBRE.vendues)} écharpes à ${eur(x.echarpe.prixHt)} hors taxes. Calculez, dans chaque méthode, le coût d'achat des écharpes sorties (vendues et manquantes) et la marge commerciale, puis l'écart de marge entre les deux méthodes.`;
      },
      champs: (c) => {
        const x = inventaireEtDemarque(c);
        const dispo = eur(x.cmup.disponible.valeur);
        return [
          { libelle: "Coût des sorties au coût moyen", attendu: x.cmup.coutDesSorties, calcul: `${dispo} − ${eur(x.cmup.final.valeur)} de stock final = ${eur(x.cmup.coutDesSorties)}` },
          { libelle: "Marge au coût moyen", attendu: x.cmup.margeCommerciale, calcul: `${eur(x.cmup.chiffreDAffaires)} − ${eur(x.cmup.coutDesSorties)} = ${eur(x.cmup.margeCommerciale)}` },
          { libelle: "Coût des sorties au premier entré", attendu: x.peps.coutDesSorties, calcul: `${dispo} − ${eur(x.peps.final.valeur)} de stock final = ${eur(x.peps.coutDesSorties)}` },
          { libelle: "Marge au premier entré", attendu: x.peps.margeCommerciale, calcul: `${eur(x.peps.chiffreDAffaires)} − ${eur(x.peps.coutDesSorties)} = ${eur(x.peps.margeCommerciale)}` },
          { libelle: "Écart de marge", attendu: x.ecartDeMarge, calcul: `${eur(x.peps.margeCommerciale)} − ${eur(x.cmup.margeCommerciale)} = ${eur(x.ecartDeMarge)}` },
        ];
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `Les deux méthodes partagent les mêmes ${eur(x.cmup.disponible.valeur)} entre les sorties et le stock final. Ce que le premier entré, premier sorti met de plus dans le stock (${eur(x.ecartDeStock)}), il le retire du coût des sorties : la marge de décembre monte d'autant.`,
          "Le manquant pèse dans les deux : une écharpe volée est un coût d'achat sans vente en face.",
        ];
      },
    },
    {
      id: "lire-la-methode",
      objectifs: [1],
      type: "choix",
      titre: "Changer de méthode pour la marge ?",
      notions: ["weighted_average_cost"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Le gérant remarque que le premier entré, premier sorti donne ${eur(x.ecartDeMarge)} de marge en plus en décembre. Il propose de passer au coût moyen l'année où les prix baisseront. Que lui répondez-vous ?`;
      },
      options: () => [
        {
          texte: "Non : une méthode se garde d'un exercice à l'autre",
          juste: true,
          retour: "Oui. La permanence des méthodes interdit de choisir chaque année celle qui embellit la marge : les comptes ne se compareraient plus. L'écart vient des prix, pas d'un meilleur commerce.",
        },
        {
          texte: "Oui : la méthode la plus favorable se choisit chaque année",
          juste: false,
          retour: "Non : la permanence des méthodes l'interdit. Changer de méthode se justifie par une meilleure information, se dit dans l'annexe, et ne se fait pas pour la marge.",
        },
        {
          texte: "Oui : la marge en plus est un gain de trésorerie",
          juste: false,
          retour: "Non : la méthode ne fait entrer aucun euro dans la caisse. Elle partage autrement le même coût d'achat entre le stock et les sorties.",
        },
      ],
    },
    {
      id: "la-demarque-de-janvier",
      objectifs: [2],
      type: "montants",
      titre: "La démarque de janvier",
      notions: ["stock", "markdown"],
      tableau: tableauDuComptage,
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Le 31 janvier, l'équipe compte chaque rayon. Les ${qte(x.d.connue)} bonnets tachés sont déjà sortis du stock sur un bon de casse : c'est la démarque connue. Calculez la démarque inconnue de janvier en articles, sa valeur au prix de vente hors taxes, puis son taux sur les ${eur(x.d.chiffreDAffaires)} de chiffre d'affaires du mois (au dixième).`;
      },
      champs: (c) => {
        const x = inventaireEtDemarque(c);
        const lignes = x.d.references.filter((r) => r.inconnue > 0);
        return [
          { libelle: "Démarque inconnue, en articles", attendu: x.d.articles, calcul: `Stock théorique − démarque connue − compté : ${lignes.map((r) => qte(r.inconnue)).join(" + ")} = ${qte(x.d.articles)} articles` },
          { libelle: "Démarque inconnue au prix de vente", attendu: x.d.auPrixDeVente, calcul: `${lignes.map((r) => `${qte(r.inconnue)} × ${eur(x.f.gamme.find((g) => g.code === r.code)!.prixHt)}`).join(" + ")} = ${eur(x.d.auPrixDeVente)}` },
          { libelle: "Taux de démarque inconnue (%)", attendu: x.tauxAffiche, tolerance: 0.1, calcul: `${eur(x.d.auPrixDeVente)} ÷ ${eur(x.d.chiffreDAffaires)} × 100 = ${pct(x.tauxAffiche)}` },
        ];
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `${qte(x.d.articles)} articles ont disparu sans passer en caisse : vols, erreurs de caisse, d'étiquetage ou de réception. Leur taux, ${pct(x.tauxAffiche)}, dépasse le seuil de ${pct(SEUIL_DE_DEMARQUE * 100)} que la direction s'est fixé.`,
          "La démarque se mesure au prix de vente pour se comparer au chiffre d'affaires ; elle coûte, elle, le prix d'achat des articles perdus.",
        ];
      },
    },
    {
      id: "ce-que-coute-la-demarque",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte la démarque",
      notions: ["stock", "contribution_margin", "average_basket"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `Sans formule cette fois. Que coûte la démarque inconnue de janvier au coût d'achat ? Que coûterait-elle sur une année de mois comme janvier ? Combien de passages en caisse, à ${eur(x.d.margeDUnPassage)} de marge chacun, faut-il pour payer celle du mois (arrondi au-dessus) ?`;
      },
      champs: (c) => {
        const x = inventaireEtDemarque(c);
        const lignes = x.d.references.filter((r) => r.inconnue > 0);
        return [
          { libelle: "Démarque du mois au coût d'achat", attendu: x.d.auCoutDAchat, calcul: `${lignes.map((r) => `${qte(r.inconnue)} × ${eur(x.f.gamme.find((g) => g.code === r.code)!.coutDAchat)}`).join(" + ")} = ${eur(x.d.auCoutDAchat)}` },
          { libelle: "Démarque de l'année", attendu: x.d.parAn, calcul: `${eur(x.d.auCoutDAchat)} × 12 = ${eur(x.d.parAn)}` },
          { libelle: "Passages en caisse qui la paient", attendu: x.d.passagesPourLaPayer, calcul: `${eur(x.d.auCoutDAchat)} ÷ ${eur(x.d.margeDUnPassage)} = ${qte(auCentime(x.d.auCoutDAchat / x.d.margeDUnPassage))}, arrondi à ${qte(x.d.passagesPourLaPayer)}` },
        ];
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `Chaque mois comme janvier, ${qte(x.d.passagesPourLaPayer)} clients servis ne font que remplacer les articles perdus. Sur l'année, ${eur(x.d.parAn)} : c'est le montant qu'une protection peut espérer sauver, et le plafond de ce qu'elle peut coûter.`,
        ];
      },
    },
    {
      id: "predire-les-protections",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur deux protections",
      notions: ["stock"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        const antivol = PROTECTIONS.find((p) => p.code === "antivol")!;
        const cameras = PROTECTIONS.find((p) => p.code === "cameras")!;
        return `Avant le laboratoire, pariez. Les portiques antivol évitent ${pct(antivol.efficacite * 100)} de la démarque inconnue, la vidéoprotection ${pct(cameras.efficacite * 100)}. Les deux ensemble en éviteront, sur ${eur(x.d.parAn)}…`;
      },
      options: (c) => {
        const x = inventaireEtDemarque(c);
        const p = x.antivolEtCameras;
        const voir = "Le laboratoire suivant combine les protections et montre la part évitée.";
        const somme = auDixieme((PROTECTIONS.find((k) => k.code === "antivol")!.efficacite + PROTECTIONS.find((k) => k.code === "cameras")!.efficacite) * 100);
        return [
          { texte: `${pct(auDixieme(p.part * 100))} : chacune agit sur le reste`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${pct(somme)} : les deux parts évitées s'ajoutent`, juste: false, retour: `Pari à vérifier : un vol déjà évité ne s'évite pas deux fois. ${voir}` },
          { texte: `${pct(PROTECTIONS.find((k) => k.code === "antivol")!.efficacite * 100)} : la meilleure des deux suffit`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-prevention",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la prévention",
      notions: ["stock", "fixed_costs"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `La démarque inconnue d'une année comme janvier coûte ${eur(x.d.parAn)}. Choisissez les protections : le tableau montre la part de la démarque qu'elles évitent, ce qu'elles coûtent sur l'année, et ce qu'elles rapportent une fois payées.`;
      },
      leviers: () =>
        PROTECTIONS.map((p) => ({
          code: p.code,
          libelle: `${p.nom}, ${eur(p.coutParAn)} par an`,
          unite: "",
          min: 0,
          max: 1,
          pas: 1,
          depart: 0,
          choix: [
            { valeur: 0, libelle: "Non" },
            { valeur: 1, libelle: "Oui" },
          ],
        })),
      lecture: (c, p) => {
        const x = inventaireEtDemarque(c);
        const l = protegerLaBoutique(x.f, choisiesDe(p));
        return [
          { libelle: "Démarque de l'année", montant: l.demarque },
          { libelle: "Part évitée", montant: auDixieme(l.part * 100), reference: 0, unite: "%" },
          { libelle: "Démarque évitée", montant: l.evitee, reference: 0 },
          { libelle: "Coût des protections", montant: -l.cout + 0, reference: 0, effet: true },
          { libelle: "Gain de l'année", montant: l.gain, reference: 0, effet: true, fort: true },
        ];
      },
      defi: (c) => {
        const x = inventaireEtDemarque(c);
        const m = x.meilleure;
        const lire = (p: Readonly<Record<string, number>>) => protegerLaBoutique(x.f, choisiesDe(p));
        return {
          consigne: "Trouvez les protections qui rapportent le plus sur l'année, une fois payées.",
          atteint: (p) => lire(p).gain === m.gain && choisiesDe(p).length === m.choisies.length,
          indice: (p) => {
            const l = lire(p);
            if (choisiesDe(p).length === 0) return "Sans protection, rien n'est évité : essayez-en une, puis une deuxième.";
            if (l.gain < 0) return `Ces protections coûtent ${eur(l.cout)} pour ${eur(l.evitee)} évités : l'une d'elles coûte plus qu'elle ne sauve.`;
            return `Elles rapportent ${eur(l.gain)}. Retirez ou ajoutez une protection : chacune n'agit que sur la démarque que les autres ont laissée.`;
          },
          solution: Object.fromEntries(CODES_DES_PROTECTIONS.map((code) => [code, m.choisies.includes(code) ? 1 : 0])),
        };
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        const m = x.meilleure;
        const v = x.seule("vigile");
        const f = protegerLaBoutique(x.f, [...m.choisies, "formation"]);
        return [
          `Les portiques seuls rapportent ${eur(m.gain)} : ${eur(m.evitee)} évités pour ${eur(m.cout)}. Le vigile du samedi en évite ${eur(v.evitee)}, mais coûte ${eur(v.cout)} : il ne se paie pas sur une démarque de cette taille.`,
          `Ajouter la formation aux portiques ferait perdre de l'argent : elle n'agirait plus que sur la moitié restante, et le gain tomberait à ${eur(f.gain)}.`,
        ];
      },
    },
    {
      id: "les-risques-de-la-boutique",
      objectifs: [4],
      type: "tri",
      titre: "Prévenir, assurer ou accepter",
      notions: ["fixed_costs"],
      question: () =>
        "Voici les risques de la boutique, avec leur coût moyen sur l'année (fréquence × coût d'un sinistre). Rangez chacun selon sa parade : le prévenir, l'assurer, ou l'accepter en le surveillant.",
      categories: [
        { code: "prevenir", libelle: "Prévenir : fréquent, coût faible à chaque fois" },
        { code: "assurer", libelle: "Assurer : rare, mais lourd quand il survient" },
        { code: "accepter", libelle: "Accepter : rare et léger" },
      ],
      elements: () =>
        RISQUES.map((r) => ({
          libelle: r.nom,
          montant: coutMoyenDuRisque(r),
          categorie: r.parade,
          pourquoi:
            r.parade === "prevenir"
              ? `${qte(r.frequenceParAn)} fois par an, ${eur(r.coutParSinistre)} chaque fois : une prime le paierait deux fois, la prévention le réduit.`
              : r.parade === "assurer"
                ? `Une fois tous les ${qte(Math.round(1 / r.frequenceParAn))} ans en moyenne, mais ${eur(r.coutParSinistre)} ce jour-là : la boutique ne peut pas le porter seule.`
                : `${qte(r.frequenceParAn)} fois par an, ${eur(r.coutParSinistre)} chaque fois : le prévenir coûterait plus qu'il ne coûte.`,
        })),
      relance: "Regardez la fréquence et le coût d'un sinistre, pas seulement le coût moyen : un risque rare et lourd ne se traite pas comme un risque fréquent et léger.",
      explication: () => [
        `Le coût moyen ne suffit pas : le cambriolage coûte moins en moyenne que la démarque, mais il peut coûter ${eur(RISQUES.find((r) => r.nom.startsWith("Cambriolage"))!.coutParSinistre)} d'un coup. C'est la forme du risque qui choisit la parade.`,
        "Un risque s'évalue par sa fréquence et sa gravité ; il se prévient, se transfère à un assureur, ou s'accepte, et sa couverture a un coût.",
      ],
    },
    {
      id: "l-assurance",
      objectifs: [4],
      type: "montants",
      titre: "Deux contrats d'assurance",
      notions: ["fixed_costs"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        const [a, b] = CONTRATS_D_ASSURANCE;
        return `Les risques assurés surviennent ${qte(x.a.sinistresParAn)} fois par an en moyenne. Le contrat A coûte ${eur(a.primeParAn)} par an, franchise de ${eur(a.franchise)} par sinistre ; le contrat B ${eur(b.primeParAn)}, franchise de ${eur(b.franchise)}. Calculez le coût moyen de l'année de chaque contrat (la prime plus les franchises moyennes), puis ce que la boutique paierait d'un sinistre de ${eur(x.b.pire)} avec le contrat B.`;
      },
      champs: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          { libelle: "Coût moyen du contrat A", attendu: x.a.coutMoyenParAn, calcul: `${eur(x.a.primeParAn)} + ${qte(x.a.sinistresParAn)} × ${eur(x.a.franchise)} = ${eur(x.a.coutMoyenParAn)}` },
          { libelle: "Coût moyen du contrat B", attendu: x.b.coutMoyenParAn, calcul: `${eur(x.b.primeParAn)} + ${qte(x.b.sinistresParAn)} × ${eur(x.b.franchise)} = ${eur(x.b.coutMoyenParAn)}` },
          { libelle: "Reste à payer du pire sinistre, contrat B", attendu: x.b.franchise, calcul: `La franchise du contrat : ${eur(x.b.franchise)}, au lieu de ${eur(x.b.pire)} sans assurance` },
        ];
      },
      explication: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `Les deux contrats coûtent plus que le coût moyen des sinistres, ${eur(x.a.sansAssurance)} : l'assureur se paie. La boutique n'achète pas une économie, elle achète un plafond à ses pertes. Le contrat ${x.moinsCher.code} coûte le moins en moyenne, et sa franchise reste à la portée de la trésorerie.`,
          "Aucun des deux ne couvre la démarque inconnue : un vol à l'étalage sans effraction ne s'assure pas, il se prévient.",
        ];
      },
    },
    {
      id: "le-vol-constate",
      objectifs: [4],
      type: "choix",
      titre: "Un vol constaté",
      notions: ["stock"],
      question: () =>
        "Un samedi, le portique sonne et une vendeuse voit une cliente glisser une écharpe dans son sac. Que peut faire l'équipe ?",
      options: () => [
        {
          texte: "Retenir la cliente et appeler la police, sans la fouiller",
          juste: true,
          retour: "Oui. Toute personne peut appréhender l'auteur d'un flagrant délit pour le remettre à la police. La fouille du sac est réservée aux officiers de police judiciaire : la vendeuse peut seulement demander à la cliente de l'ouvrir. La boutique porte plainte, et la déclare à l'assureur s'il y a lieu.",
        },
        {
          texte: "Fouiller son sac dans la réserve, puis la laisser repartir",
          juste: false,
          retour: "Non : ni la vendeuse ni un vigile ne peuvent fouiller un sac sans l'accord de la cliente, et l'enfermer dans la réserve serait une séquestration.",
        },
        {
          texte: "Lui faire payer l'écharpe et une pénalité, puis afficher sa photo",
          juste: false,
          retour: "Non : la boutique ne fixe pas d'amende, et afficher la photo d'une personne porte atteinte à sa vie privée. Seule la justice sanctionne.",
        },
      ],
    },
    {
      id: "quelle-protection-acheter",
      objectifs: [3],
      type: "choix",
      titre: "Quelle protection acheter ?",
      notions: ["stock", "fixed_costs"],
      question: (c) => {
        const x = inventaireEtDemarque(c);
        return `La démarque inconnue dépasse le seuil de ${pct(SEUIL_DE_DEMARQUE * 100)} et coûterait ${eur(x.d.parAn)} sur l'année. Le responsable veut un vigile le samedi. Que décidez-vous ?`;
      },
      options: (c) => {
        const x = inventaireEtDemarque(c);
        const m = x.meilleure;
        const v = x.seule("vigile");
        const tout = protegerLaBoutique(x.f, ["antivol", "cameras", "vigile", "formation"]);
        return [
          { texte: "Les portiques antivol seuls", juste: m.choisies.length === 1 && m.choisies[0] === "antivol", retour: `Oui : ${eur(m.gain)} de gain sur l'année. Chaque protection de plus coûterait plus que la démarque qu'elle évite encore.` },
          { texte: "Le vigile du samedi, la protection la plus visible", juste: false, retour: `Non : ${eur(v.cout)} par an pour ${eur(v.evitee)} évités. Le vigile coûte plus que toute la démarque de l'année.` },
          { texte: "Toutes les protections, pour ne plus rien perdre", juste: false, retour: `Non : elles éviteraient ${pct(auDixieme(tout.part * 100))} de la démarque, mais coûteraient ${eur(tout.cout)}. Le gain serait de ${eur(tout.gain)}.` },
          { texte: "Une assurance contre le vol", juste: false, retour: "Non : la démarque inconnue ne s'assure pas. Un vol à l'étalage, fréquent et léger, se prévient." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock", "weighted_average_cost", "markdown"],
      tableau: (c) => {
        const x = inventaireEtDemarque(c);
        return {
          titre: `${x.f.entreprise} · l'inventaire et la démarque`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Stock de l'écharpe au 31 décembre, au coût moyen", valeurs: [eur(x.cmup.final.valeur)] },
            { libelle: "Le même, au premier entré, premier sorti", valeurs: [eur(x.peps.final.valeur)] },
            { libelle: "Démarque inconnue de janvier", valeurs: [`${qte(x.d.articles)} articles, ${pct(x.tauxAffiche)}`] },
            { libelle: "Démarque d'une année, au coût d'achat", valeurs: [eur(x.d.parAn)] },
            { libelle: "Gain des portiques antivol", valeurs: [eur(x.meilleure.gain)] },
            { libelle: `Coût moyen du contrat ${x.moinsCher.code}`, valeurs: [eur(x.moinsCher.coutMoyenParAn)] },
          ],
        };
      },
      texte: (c) => {
        const x = inventaireEtDemarque(c);
        return [
          `L'inventaire compte ce que ${x.f.entreprise} possède. Quand les prix montent, le premier entré, premier sorti donne un stock plus cher et une marge plus haute que le coût moyen : ${eur(x.ecartDeMarge)} sur l'écharpe en décembre. La méthode choisie se garde.`,
          `La démarque se lit au comptage : ${qte(x.d.articles)} articles en janvier, ${pct(x.tauxAffiche)} du chiffre d'affaires. Une protection se juge sur la démarque qu'elle évite, face à ce qu'elle coûte, et les protections se cumulent sur ce qui reste.`,
          "Un risque fréquent et léger se prévient, un risque rare et lourd s'assure, un risque rare et léger s'accepte. Un vol constaté se traite par la police, jamais par la boutique seule.",
          "Les limites de la méthode : la démarque d'un mois n'est pas celle de l'année, les efficacités des protections sont des ordres de grandeur, et un vol évité peut se reporter sur un autre magasin.",
          "Au niveau de l'examen, vous savez valoriser un stock dans deux méthodes, en lire l'effet sur la marge, calculer la démarque et son taux, chiffrer une prévention et choisir une couverture.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Démarque inconnue = stock théorique − démarque connue − stock compté. Taux de démarque = démarque au prix de vente ÷ chiffre d'affaires. Gain d'une protection = démarque évitée − coût de la protection.",
    },
  ],
};
