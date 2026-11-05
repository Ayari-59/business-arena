import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { REMUNERATION_DE_LA_GERANTE, USURE_DE_GESTION_DU_MOIS, concordance } from "../monde/comptabilite-de-gestion";
import { GESTION_DU_COURS } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";
import { auCentime } from "../monde/amortissement";

/**
 * CHAPITRE : LA CONCORDANCE DES RÉSULTATS (contrôle de gestion, palier 4 ; BTS CG, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : l'exercice N de NOVA, vu par ses deux comptabilités. La
 * comptabilité générale est celle de la clôture (monde/exercice-de-nova.ts et monde/cloture.ts :
 * 79 225,96 € de résultat net) ; la comptabilité de gestion, celle du chapitre « Le coût complet pas à
 * pas », tenue les douze mois de l'exercice (monde/comptabilite-de-gestion.ts : `concordance`).
 *
 * L'objet : expliquer, ligne par ligne, pourquoi les deux résultats diffèrent, et passer de l'un à
 * l'autre au centime. Les charges que la gestion n'incorpore pas (les risques, le financement,
 * l'impôt), la charge supplétive qu'elle ajoute (le travail du président), les produits qu'elle
 * laisse de côté, la charge qu'elle substitue (l'usure de la ligne), les différences d'inventaire (le
 * boni des jeux revenus sans bon, l'évaluation du stock) et les différences d'arrondi.
 *
 * POURQUOI L'EXERCICE ET NON DÉCEMBRE : la comptabilité générale n'a qu'un résultat, celui de
 * l'exercice. Les travaux d'inventaire (le stock, les amortissements, les provisions) et l'impôt ne
 * se font qu'à la clôture ; un « résultat de décembre » de la comptabilité générale serait une
 * construction, pas un chiffre des comptes. La concordance se fait donc sur l'exercice, et retrouve
 * exactement son résultat net ; décembre y entre comme l'un des douze mois de la gestion.
 *
 * LES TROIS TEMPS :
 *   · guidé : trier-les-charges, non-incorporees, difference-d-incorporation (la règle est dans la
 *     question) ;
 *   · l'expérience avant la formule : le-sens-du-boni (un pari) avant le tableau de passage ;
 *     le-pari-de-la-gerante, puis jusqu-ou-la-gerante (un curseur) et le laboratoire ;
 *   · autonome : l-inventaire, les-arrondis, tableau-de-passage (des tableaux à compléter, signes
 *     compris), le-mois-ou-l-exercice.
 */

/** La concordance se calcule sur l'exercice N de NOVA. */
export const ENTREPRISES_DE_LA_CONCORDANCE: readonly string[] = ["nova"];

/** Les bornes du curseur de la rémunération du président, en euros par mois. */
export const GERANTE_DU_CURSEUR = { min: 0, max: 12_000 } as const;

/** Le levier du président au laboratoire, et le levier à choix des charges de risque. */
export const GERANTE_DU_LABORATOIRE = { min: 0, max: 6_000, pas: 600 } as const;
export const RISQUES = { nonIncorpores: 0, incorpores: 1 } as const;
/** Les comptes des charges de risque, que le laboratoire peut faire incorporer. */
export const COMPTES_DES_RISQUES: readonly string[] = ["6817", "6815"];
/** L'écart en deçà duquel le défi du laboratoire tient les deux résultats pour proches. */
export const ECART_DU_DEFI = 100;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
/** Un terme d'une somme écrite, son signe devant : « + 134,89 € », « − 1 092 € ». */
const enSuite = (x: number) => `${x < 0 ? "−" : "+"} ${eur(Math.abs(x))}`;

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** L'exercice de NOVA dans ses deux comptabilités, et tout ce que le chapitre en demande. */
export function concordanceDeNova(c: Pick<Cas, "code">) {
  const f = GESTION_DU_COURS[c.code]!;
  const k = concordance();
  const s = k.cg.soldes;
  const solde = (compte: string) => auCentime(s[compte] ?? 0);
  const risques = auCentime(COMPTES_DES_RISQUES.reduce((t, x) => t + solde(x), 0));
  const totalNonIncorporees = auCentime(-k.lignes.chargesNonIncorporees);
  /** Ce que la gestion aurait trouvé sans la rémunération du président : le résultat analytique, supplétive remise. */
  const avantLaGerante = auCentime(k.exercice.resultatAnalytique + k.lignes.supletives);
  return {
    f,
    k,
    solde,
    risques,
    totalNonIncorporees,
    avantLaGerante,
    gerantePlafond: Math.floor(avantLaGerante / 12 + 1e-9),
    ecart: auCentime(k.resultatGeneral - k.exercice.resultatAnalytique),
    decembre: k.exercice.decembre,
  };
}

export type ConcordanceDeNova = ReturnType<typeof concordanceDeNova>;

/** Le laboratoire : les deux résultats pour une rémunération du président et un traitement des risques. */
export function laboratoireDeLaConcordance(gerante: number, risques: number) {
  const k = concordance({ gerante });
  const risque = auCentime(COMPTES_DES_RISQUES.reduce((t, x) => t + (k.cg.soldes[x] ?? 0), 0));
  const incorpores = risques === RISQUES.incorpores;
  const resultatAnalytique = auCentime(k.exercice.resultatAnalytique - (incorpores ? risque : 0));
  return {
    resultatAnalytique,
    supletives: k.lignes.supletives,
    nonIncorporees: auCentime(-k.lignes.chargesNonIncorporees - (incorpores ? risque : 0)),
    resultatGeneral: k.resultatGeneral,
    ecart: auCentime(k.resultatGeneral - resultatAnalytique),
  };
}

/** Les positions du laboratoire où les deux résultats sont à moins de l'écart du défi. */
export function positionsProches() {
  const n = Math.round((GERANTE_DU_LABORATOIRE.max - GERANTE_DU_LABORATOIRE.min) / GERANTE_DU_LABORATOIRE.pas);
  const positions = Array.from({ length: n + 1 }, (_, i) => GERANTE_DU_LABORATOIRE.min + i * GERANTE_DU_LABORATOIRE.pas).flatMap((g) =>
    [RISQUES.nonIncorpores, RISQUES.incorpores].map((r) => ({ gerante: g, risques: r })),
  );
  return positions.filter((p) => Math.abs(laboratoireDeLaConcordance(p.gerante, p.risques).ecart) <= ECART_DU_DEFI);
}

/** L'exercice dans ses deux comptabilités : le document du chapitre. */
function tableauDesDeuxResultats(x: ConcordanceDeNova): TableauDeDonnees {
  const { k, decembre, ecart } = x;
  return {
    titre: `L'exercice N de ${x.f.entreprise}, dans ses deux comptabilités`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat net de l'exercice, comptabilité générale", valeurs: [eur(k.resultatGeneral)] },
      { libelle: "Résultat analytique de l'exercice, somme des 12 mois", valeurs: [eur(k.exercice.resultatAnalytique)] },
      { libelle: "Dont le résultat analytique de décembre", valeurs: [eur(decembre.resultat)] },
      { libelle: "Écart à expliquer", valeurs: [eur(ecart)] },
    ],
  };
}

/** Les comptes de la clôture que la gestion laisse de côté. */
function tableauDesComptes(x: ConcordanceDeNova): TableauDeDonnees {
  const { k } = x;
  return {
    titre: "Ce que la comptabilité générale compte, et que la gestion laisse de côté",
    colonnes: ["Compte", "Montant"],
    lignes: [
      ...k.nonIncorporees.map((n) => ({ libelle: n.libelle, valeurs: [n.compte, eur(n.montant)] })),
      ...k.produitsNonIncorpores.map((n) => ({ libelle: `${n.libelle} (un produit)`, valeurs: [n.compte, eur(n.montant)] })),
    ],
  };
}

/** Les arrondis des unités d'œuvre, mois par mois. */
function tableauDesArrondis(x: ConcordanceDeNova): TableauDeDonnees {
  const { k } = x;
  return {
    titre: "Ce que les unités d'œuvre arrondies ont imputé de plus que les centres",
    colonnes: ["Écart d'arrondi"],
    lignes: [
      ...k.exercice.mois.map((m) => ({ libelle: m.nom.charAt(0).toUpperCase() + m.nom.slice(1), valeurs: [eur(m.arrondiDesUnitesDOeuvre)] })),
      { libelle: "Écart d'arrondi du coût moyen, fiche de stock de décembre", valeurs: [eur(k.exercice.arrondiDuStock)] },
    ],
  };
}

/** Le stock final dans les deux comptabilités, à remplir. */
function grilleDeLInventaire(x: ConcordanceDeNova): TableauACompleter {
  const { k } = x;
  const g = k.stockDeGestion;
  const cmup = g.cmup;
  const reel = k.stockPhysique;
  const auCoutDeGestion = auCentime(reel.quantite * cmup);
  const prixCG = reel.valeur / reel.quantite;
  return {
    titre: "Le stock de jeux au 31 décembre, dans les deux comptabilités",
    colonnes: ["Quantité", "Coût unitaire", "Montant"],
    lignes: [
      { libelle: "Stock théorique de la gestion, sur les bons", cellules: [donnee(g.final.quantite, "jeux"), donnee(cmup), donnee(g.final.valeur)] },
      {
        libelle: "Boni d'inventaire, au coût de la gestion",
        cellules: [
          aSaisir(k.jeuxEnPlus, `${qte(reel.quantite)} jeux comptés − ${qte(g.final.quantite)} attendus = ${qte(k.jeuxEnPlus)} jeux`, { unite: "jeux", indice: "les jeux comptés moins les jeux attendus" }),
          donnee(cmup),
          aSaisir(k.lignes.boniDInventaire, `${qte(k.jeuxEnPlus)} × ${eur(cmup)} = ${eur(k.lignes.boniDInventaire)}`, { indice: "les jeux en plus au coût moyen de la gestion" }),
        ],
      },
      {
        libelle: "Stock réel, au coût de la gestion",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [aSaisir(reel.quantite, `${qte(g.final.quantite)} + ${qte(k.jeuxEnPlus)} = ${qte(reel.quantite)} jeux`, { unite: "jeux" }), { ...donnee(cmup), horsTotal: true }, aSaisir(auCoutDeGestion, `${qte(reel.quantite)} × ${eur(cmup)} = ${eur(auCoutDeGestion)}`)],
      },
      { libelle: "Stock réel de la comptabilité générale, au prix d'achat", cellules: [donnee(reel.quantite, "jeux"), donnee(prixCG), donnee(reel.valeur)] },
      {
        libelle: "Écart d'évaluation du stock final",
        fort: true,
        totalDe: { plus: [3], moins: [2] },
        cellules: [VIDE, VIDE, aSaisir(k.lignes.evaluationDuStock, `${eur(reel.valeur)} − ${eur(auCoutDeGestion)} = ${eur(k.lignes.evaluationDuStock)}`, { indice: "le stock de la comptabilité générale moins le stock réel au coût de la gestion" })],
      },
    ],
  };
}

/** Le tableau de passage du résultat analytique au résultat de la comptabilité générale, à remplir. */
function grilleDePassage(x: ConcordanceDeNova): TableauACompleter {
  const { k, totalNonIncorporees } = x;
  const l = k.lignes;
  const signe = (v: number) => (v < 0 ? "se retranche" : "s'ajoute");
  return {
    titre: `Du résultat analytique au résultat de la comptabilité générale · ${x.f.entreprise}, exercice N`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat analytique de l'exercice", cellules: [donnee(k.exercice.resultatAnalytique)] },
      { libelle: "Charges supplétives", cellules: [aSaisir(l.supletives, `12 × ${eur(REMUNERATION_DE_LA_GERANTE)} = ${eur(l.supletives)} : comptées par la gestion seule, elles ${signe(l.supletives)}nt`, { indice: "le travail du président sur l'exercice, que la comptabilité générale ne compte pas" })] },
      { libelle: "Produits non incorporés", cellules: [aSaisir(l.produitsNonIncorpores, `${eur(l.produitsNonIncorpores)} d'intérêts du placement, que seule la comptabilité générale compte : ils s'ajoutent`, { indice: "les produits que seule la comptabilité générale compte" })] },
      { libelle: "Charges non incorporées", cellules: [aSaisir(l.chargesNonIncorporees, `${k.nonIncorporees.map((n) => eur(n.montant)).join(" + ")} = ${eur(totalNonIncorporees)}, qui se retranchent : ${eur(l.chargesNonIncorporees)}`, { indice: "les charges que seule la comptabilité générale compte, qui la font plus basse" })] },
      { libelle: "Différence d'incorporation de l'usure", cellules: [aSaisir(l.differenceDIncorporation, `${eur(k.usureDeGestion)} − ${eur(k.dotation)} = ${eur(l.differenceDIncorporation)} : la gestion a compté plus, cela ${signe(l.differenceDIncorporation)}`, { indice: "l'usure de la gestion moins la dotation de la clôture" })] },
      { libelle: "Boni d'inventaire", cellules: [aSaisir(l.boniDInventaire, `${qte(k.jeuxEnPlus)} jeux × ${eur(k.stockDeGestion.cmup)} = ${eur(l.boniDInventaire)} : des jeux comptés en sortie que la comptabilité générale retrouve en stock`, { indice: "les jeux trouvés en plus, au coût de la gestion" })] },
      { libelle: "Écart d'évaluation du stock final", cellules: [aSaisir(l.evaluationDuStock, `${eur(k.stockGeneral)} − ${eur(auCentime(k.stockPhysique.quantite * k.stockDeGestion.cmup))} = ${eur(l.evaluationDuStock)}`, { indice: "le stock de la comptabilité générale moins le stock réel au coût de la gestion" })] },
      { libelle: "Différences d'arrondi", cellules: [aSaisir(l.arrondis, `${eur(k.exercice.arrondiDesUnitesDOeuvre)} − ${eur(k.exercice.arrondiDuStock)} = ${eur(l.arrondis)}`, { indice: "ce que les unités d'œuvre ont imputé de plus, moins le reste du coût moyen" })] },
      {
        libelle: "Résultat de la comptabilité générale",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4, 5, 6, 7] },
        cellules: [aSaisir(k.resultatGeneral, `${eur(k.exercice.resultatAnalytique)} ${Object.values(l).map(enSuite).join(" ")} = ${eur(k.resultatGeneral)}`)],
      },
    ],
  };
}

export const LA_CONCORDANCE_DES_RESULTATS: Chapitre = {
  code: "la-concordance-des-resultats",
  parcours: "controle-de-gestion",
  palier: 4,
  // Pas de BTS CG P5 : le référentiel du BTS exclut la concordance des résultats entre la
  // comptabilité financière et la comptabilité de gestion (5.2.2, limites). Le DCG la demande (UE11).
  blocs: [
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "La concordance des résultats",
  accroche:
    "Le résultat analytique de NOVA n'est pas celui de ses comptes. Charges non incorporées, charges supplétives, inventaire et arrondis : retrouvez, ligne par ligne, le résultat de l'exercice au centime.",
  objectifs: [
    "Distinguer les charges incorporées, les charges non incorporées et les charges supplétives",
    "Chiffrer les différences d'incorporation, d'inventaire et d'arrondi",
    "Dresser le tableau de passage du résultat analytique au résultat de la comptabilité générale",
    "Expliquer pourquoi les deux résultats diffèrent, et ce que chacun mesure",
  ],
  libre: false,
  prerequis: ["cout-complet", "les-stocks"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_CONCORDANCE,
    pourquoi:
      "la concordance se calcule ici sur l'exercice N de NOVA, dans la simulation du cours, avec sa clôture et sa comptabilité de gestion ; la méthode est celle que vous appliquerez à votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux résultats pour un exercice",
      notions: ["full_unit_cost", "income_statement"],
      tableau: (c) => tableauDesDeuxResultats(concordanceDeNova(c)),
      texte: (c) => {
        const { f, k, decembre } = concordanceDeNova(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur l'exercice N. La clôture a donné son résultat net, ${eur(k.resultatGeneral)}. La comptabilité de gestion, tenue chaque mois comme dans « Le coût complet pas à pas » (décembre y laissait ${eur(decembre.resultat)}), donne ${eur(k.exercice.resultatAnalytique)} pour les 12 mois.`,
          "Ce n'est pas une erreur : les deux comptabilités ne comptent pas les mêmes charges. La gestion mesure l'exploitation courante ; elle laisse de côté ce qui n'en relève pas, ajoute ce que les comptes ne connaissent pas, évalue autrement l'usure et le stock, et arrondit ses unités d'œuvre.",
          "La concordance se fait sur l'exercice, et non sur décembre : la comptabilité générale n'a qu'un résultat, celui de la clôture, où se font l'inventaire, les amortissements, les provisions et l'impôt. Le tableau de passage doit retrouver ce résultat au centime.",
        ];
      },
      repere: () =>
        "Résultat analytique + charges supplétives + produits non incorporés − charges non incorporées ± différences d'incorporation ± différences d'inventaire ± différences d'arrondi = résultat de la comptabilité générale.",
    },
    {
      id: "trier-les-charges",
      objectifs: [0],
      type: "tri",
      titre: "Incorporées, ou non",
      notions: ["full_unit_cost"],
      question: () => "Rangez les charges de l'exercice : incorporées aux coûts, non incorporées, ou supplétives ?",
      categories: [
        { code: "incorporee", libelle: "Incorporée" },
        { code: "non", libelle: "Non incorporée" },
        { code: "supletive", libelle: "Supplétive" },
      ],
      relance: "Demandez-vous : la comptabilité générale compte-t-elle cette charge ? Et tient-elle à l'activité normale de l'entreprise ?",
      elements: (c) => {
        const { solde, k } = concordanceDeNova(c);
        const montant = (compte: string) => k.nonIncorporees.find((n) => n.compte === compte)!.montant;
        return [
          { libelle: "Loyer du local", montant: solde("6132"), categorie: "incorporee", pourquoi: "Le local sert à produire et à vendre : la charge entre dans les centres, par les surfaces." },
          { libelle: "Dépréciation de la créance de Sonora", montant: montant("6817"), categorie: "non", pourquoi: "Un client en redressement judiciaire n'est pas l'activité normale : la gestion n'en charge pas ses coûts." },
          { libelle: "Salaires et cotisations des opérateurs", montant: auCentime(solde("641") + solde("645")), categorie: "incorporee", pourquoi: "Le travail de l'équipe fait les enceintes : il entre dans les centres." },
          { libelle: "Travail du président, non payé", montant: k.lignes.supletives, categorie: "supletive", pourquoi: "La comptabilité générale ne le connaît pas ; la gestion le compte pour que le coût ne dépende pas de ce que le président se verse." },
          { libelle: "Intérêts de l'emprunt", montant: montant("6611"), categorie: "non", pourquoi: "Le coût du financement : la gestion de NOVA mesure l'exploitation sans lui." },
          { libelle: "Prime d'assurance de l'exercice", montant: solde("616"), categorie: "incorporee", pourquoi: "L'assurance couvre la ligne et les marchandises : elle entre dans la production et la distribution." },
          { libelle: "Provision pour le litige", montant: montant("6815"), categorie: "non", pourquoi: "Un risque exceptionnel, sans rapport avec la fabrication du mois : non incorporé." },
          { libelle: "Impôt sur les sociétés", montant: montant("695"), categorie: "non", pourquoi: "L'impôt dépend du résultat, pas de ce qu'on produit : il n'entre jamais dans un coût." },
          { libelle: "Escompte accordé à Sonora", montant: montant("665"), categorie: "non", pourquoi: "Une charge financière, le prix d'un paiement plus rapide : la gestion la laisse de côté." },
        ];
      },
      explication: (c) => {
        const { totalNonIncorporees, k } = concordanceDeNova(c);
        return [
          `${eur(totalNonIncorporees)} de charges que seule la comptabilité générale compte, ${eur(k.lignes.supletives)} que seule la gestion compte. Une charge non incorporée fait le résultat analytique plus haut que celui des comptes ; une charge supplétive le fait plus bas.`,
        ];
      },
    },
    {
      id: "pourquoi-la-gerante",
      objectifs: [0],
      type: "choix",
      titre: "Pourquoi compter le président",
      notions: ["full_unit_cost"],
      question: () =>
        `Le président ne se verse rien : les comptes ne portent aucune charge pour son travail. La comptabilité de gestion en compte une, ${eur(REMUNERATION_DE_LA_GERANTE)} par mois. Pourquoi ?`,
      options: () => [
        {
          texte: "Pour que le coût ne dépende pas de sa paie",
          juste: true,
          retour: "Oui. Un concurrent dont le dirigeant est salarié porte ce coût ; NOVA le porterait aussi le jour où son président se paierait. Sans la charge supplétive, le coût d'une enceinte paraîtrait plus bas qu'il n'est, et un prix fixé sur lui serait trop bas.",
        },
        { texte: "Pour réduire l'impôt que NOVA doit sur l'exercice", juste: false, retour: "Non : une charge supplétive n'est jamais passée en comptabilité générale. Elle ne change ni le résultat des comptes ni l'impôt." },
        { texte: "Parce que la loi l'impose à toute société commerciale", juste: false, retour: "Non : la comptabilité de gestion est libre, aucune loi n'en fixe les règles. C'est un choix de l'entreprise, pour des coûts qui disent vrai." },
      ],
    },
    {
      id: "non-incorporees",
      objectifs: [0],
      type: "montants",
      titre: "Ce que la gestion laisse de côté",
      notions: ["full_unit_cost", "income_statement"],
      tableau: (c) => tableauDesComptes(concordanceDeNova(c)),
      question: () =>
        "Faites les trois totaux de l'exercice : les charges que la gestion n'incorpore pas, les produits qu'elle n'incorpore pas, et la charge supplétive qu'elle ajoute (12 mois du travail du président).",
      champs: (c) => {
        const { k, totalNonIncorporees } = concordanceDeNova(c);
        return [
          { libelle: "Charges non incorporées", attendu: totalNonIncorporees, calcul: `${k.nonIncorporees.map((n) => eur(n.montant)).join(" + ")} = ${eur(totalNonIncorporees)}` },
          { libelle: "Produits non incorporés", attendu: k.lignes.produitsNonIncorpores, calcul: `les intérêts du placement : ${eur(k.lignes.produitsNonIncorpores)}` },
          { libelle: "Charges supplétives de l'exercice", attendu: k.lignes.supletives, calcul: `12 × ${eur(REMUNERATION_DE_LA_GERANTE)} = ${eur(k.lignes.supletives)}` },
        ];
      },
      explication: (c) => {
        const { k, totalNonIncorporees } = concordanceDeNova(c);
        return [
          `L'impôt pèse le plus lourd parmi les charges non incorporées : ${eur(k.nonIncorporees.find((n) => n.compte === "695")!.montant)} sur ${eur(totalNonIncorporees)}. Le résultat analytique est un résultat avant impôt, avant les risques et avant le financement.`,
        ];
      },
    },
    {
      id: "difference-d-incorporation",
      objectifs: [1],
      type: "montants",
      titre: "L'usure, comptée autrement",
      notions: ["depreciation", "full_unit_cost"],
      question: (c) => {
        const { k } = concordanceDeNova(c);
        return `La gestion compte l'usure de la ligne ${eur(USURE_DE_GESTION_DU_MOIS)} par mois, 12 mois pleins ; la clôture dote ${eur(k.dotation)}, pour les jours où la ligne a servi depuis le 6 janvier. Calculez l'usure de la gestion sur l'exercice, puis la différence d'incorporation : ce qu'il faut ajouter au résultat analytique pour retrouver celui des comptes.`;
      },
      champs: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          { libelle: "Usure comptée par la gestion sur l'exercice", attendu: k.usureDeGestion, calcul: `12 × ${eur(USURE_DE_GESTION_DU_MOIS)} = ${eur(k.usureDeGestion)}` },
          { libelle: "Différence d'incorporation, à ajouter", attendu: k.lignes.differenceDIncorporation, calcul: `${eur(k.usureDeGestion)} − ${eur(k.dotation)} = ${eur(k.lignes.differenceDIncorporation)}` },
        ];
      },
      explication: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          `La gestion a compté ${eur(k.lignes.differenceDIncorporation)} d'usure de plus que les comptes : son résultat est plus bas d'autant. Une charge calculée n'a pas à être la même dans les deux comptabilités ; la gestion préfère une usure régulière, mois après mois, à la dotation de la clôture.`,
        ];
      },
    },
    {
      id: "l-inventaire",
      objectifs: [1],
      type: "a-completer",
      titre: "Le stock final, deux fois",
      notions: ["stock", "weighted_average_cost"],
      question: (c) => {
        const { k } = concordanceDeNova(c);
        return `L'inventaire du 31 décembre compte ${qte(k.stockPhysique.quantite)} jeux, quand la fiche des bons en attendait ${qte(k.stockDeGestion.final.quantite)} : des jeux sortis en trop le 24 sont revenus sans bon de retour. La comptabilité générale évalue le stock au prix d'achat, la gestion au coût d'achat. Remplissez le tableau.`;
      },
      grille: (c) => grilleDeLInventaire(concordanceDeNova(c)),
      explication: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          `Deux différences, de sens contraire. Le boni d'inventaire, ${eur(k.lignes.boniDInventaire)} : la gestion a compté en coût des jeux qui étaient encore là. L'écart d'évaluation, ${eur(k.lignes.evaluationDuStock)} : la gestion garde dans son stock une part du centre approvisionnement, que la comptabilité générale passe en charges de l'exercice.`,
        ];
      },
    },
    {
      id: "les-arrondis",
      objectifs: [1],
      type: "montants",
      titre: "Les différences d'arrondi",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauDesArrondis(concordanceDeNova(c)),
      question: () =>
        "Chaque mois, les unités d'œuvre arrondies au centime ont imputé un peu plus ou un peu moins que les centres (tableau) ; en décembre, le coût moyen arrondi a laissé un reste sur la fiche de stock. Faites le total des arrondis des unités d'œuvre, puis la différence d'arrondi à ajouter au résultat analytique.",
      champs: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          { libelle: "Arrondis des unités d'œuvre sur l'exercice", attendu: k.exercice.arrondiDesUnitesDOeuvre, calcul: `${k.exercice.mois.map((m) => eur(m.arrondiDesUnitesDOeuvre)).join(" ; ")}, au total ${eur(k.exercice.arrondiDesUnitesDOeuvre)}` },
          { libelle: "Différences d'arrondi, à ajouter", attendu: k.lignes.arrondis, calcul: `${eur(k.exercice.arrondiDesUnitesDOeuvre)} − ${eur(k.exercice.arrondiDuStock)} = ${eur(k.lignes.arrondis)}` },
        ];
      },
      explication: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          `Les unités d'œuvre ont imputé ${eur(-k.exercice.arrondiDesUnitesDOeuvre)} de moins que les centres : la gestion a compté moins de charges que les comptes, il faut les retrancher. Le reste du coût moyen, ${eur(k.exercice.arrondiDuStock)}, n'est passé ni dans les coûts ni dans le stock : il se retranche aussi.`,
        ];
      },
    },
    {
      id: "le-sens-du-boni",
      objectifs: [1],
      type: "choix",
      titre: "Le sens du boni",
      notions: ["stock"],
      question: (c) => {
        const { k } = concordanceDeNova(c);
        return `L'inventaire trouve ${qte(k.jeuxEnPlus)} jeux de plus que la fiche de la gestion. Pour passer du résultat analytique au résultat des comptes, ce boni…`;
      },
      options: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          { texte: "S'ajoute au résultat analytique", juste: true, retour: `Oui. La gestion a compté ces jeux en coût de décembre ; les comptes les retrouvent en stock, et leur résultat est plus haut de ${eur(k.lignes.boniDInventaire)}.` },
          { texte: "Se retranche : des jeux ont disparu du stock", juste: false, retour: "Non : c'est un boni, il y a plus de jeux que prévu. Un mali, des jeux manquants, se retrancherait." },
          { texte: "Ne compte pas : seuls les montants du stock changent", juste: false, retour: "Non : un stock plus haut, c'est une consommation plus basse, donc un résultat plus haut dans les comptes." },
        ];
      },
    },
    {
      id: "tableau-de-passage",
      objectifs: [2],
      type: "a-completer",
      titre: "Le tableau de passage",
      notions: ["full_unit_cost", "income_statement"],
      question: () =>
        "Partez du résultat analytique de l'exercice. Écrivez chaque différence avec son signe : positive si elle s'ajoute pour retrouver le résultat des comptes, négative si elle se retranche. La dernière ligne doit retrouver le résultat net de la clôture.",
      grille: (c) => grilleDePassage(concordanceDeNova(c)),
      explication: (c) => {
        const { k } = concordanceDeNova(c);
        return [
          `Le tableau retrouve ${eur(k.resultatGeneral)}, le résultat net de la clôture, au centime : chaque euro d'écart entre les deux comptabilités a une cause, et une seule ligne.`,
        ];
      },
    },
    {
      id: "deux-resultats",
      objectifs: [3],
      type: "choix",
      titre: "Lequel est le bon ?",
      notions: ["full_unit_cost", "income_statement"],
      question: (c) => {
        const { k } = concordanceDeNova(c);
        return `${eur(k.exercice.resultatAnalytique)} pour la gestion, ${eur(k.resultatGeneral)} pour les comptes. Lequel des deux résultats dit vrai ?`;
      },
      options: () => [
        { texte: "Les deux : ils ne mesurent pas la même chose", juste: true, retour: "Oui. Les comptes disent ce que l'exercice a rapporté aux associés, impôt et risques compris ; la gestion dit ce que rapporte l'exploitation courante, travail du président compris. Le tableau de passage montre que l'un se déduit de l'autre." },
        { texte: "Celui des comptes : c'est le seul que l'on publie", juste: false, retour: "Non : il est le seul publié, mais il mélange l'exploitation, le financement, les risques et l'impôt. Pour fixer un prix, c'est le coût de la gestion qu'il faut." },
        { texte: "Celui de la gestion : il compte toutes les charges", juste: false, retour: "Non : il en laisse de côté, l'impôt, les risques, le financement, et il en ajoute une que les comptes ignorent. Il n'est pas plus complet, il est autre." },
      ],
    },
    {
      id: "le-pari-de-la-gerante",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le président",
      notions: ["full_unit_cost"],
      question: () =>
        `Avant de manipuler, pariez. Si la gestion comptait le travail du président ${eur(GERANTE_DU_LABORATOIRE.max)} par mois au lieu de ${eur(REMUNERATION_DE_LA_GERANTE)}, le résultat de la comptabilité générale…`,
      options: () => {
        const voir = "Faites varier sa rémunération aux deux étapes suivantes.";
        return [
          { texte: "Ne bougerait pas", juste: true, retour: `Bon pari : une charge supplétive n'est jamais passée en comptabilité générale. ${voir}` },
          { texte: "Baisserait d'autant, sur les 12 mois", juste: false, retour: `Pari à vérifier : seule la gestion compte cette charge. ${voir}` },
          { texte: "Monterait : l'impôt baisserait avec lui", juste: false, retour: `Pari à vérifier : l'impôt se calcule sur les comptes, que la charge supplétive ne touche pas. ${voir}` },
        ];
      },
    },
    {
      id: "jusqu-ou-la-gerante",
      objectifs: [3],
      type: "curseur",
      titre: "Jusqu'où compter le président",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { avantLaGerante } = concordanceDeNova(c);
        return `Sans le travail du président, la gestion trouverait ${eur(avantLaGerante)} sur l'exercice. Faites varier ce que vaut son travail, par mois : une droite donne ce résultat, l'autre la charge supplétive de 12 mois. Placez le curseur sur la plus grande rémunération où le résultat analytique reste positif, puis validez.`;
      },
      grandeur: () => ({ libelle: "Travail du président, par mois", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: concordanceDeNova(c).gerantePlafond, min: GERANTE_DU_CURSEUR.min, max: GERANTE_DU_CURSEUR.max }),
      zones: ["Le résultat analytique reste positif", "Le résultat analytique devient une perte"],
      rates: () => ({
        dessous: "Plus haut, le résultat analytique reste encore positif : cherchez la plus grande rémunération.",
        dessus: "À cette position, la charge supplétive dépasse ce que l'exploitation rapporte : la gestion montrerait une perte.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, g) => {
        const { avantLaGerante, k } = concordanceDeNova(c);
        return [
          { libelle: "Résultat de la gestion, sans le président", montant: avantLaGerante },
          { libelle: "Charge supplétive sur 12 mois", montant: auCentime(12 * g) },
          { libelle: "Résultat analytique de l'exercice", montant: auCentime(avantLaGerante - 12 * g), fort: true },
          { libelle: "Résultat de la comptabilité générale", montant: k.resultatGeneral },
        ];
      },
      droites: (c) => {
        const { avantLaGerante } = concordanceDeNova(c);
        return { produit: () => avantLaGerante, cout: (g) => 12 * g, libelles: ["Résultat de la gestion, sans le président", "Charge supplétive sur 12 mois"] };
      },
      explication: (c) => {
        const { gerantePlafond, k } = concordanceDeNova(c);
        return [
          `Au-delà de ${eur(gerantePlafond)} par mois, la gestion montrerait une perte, alors que les comptes affichent ${eur(k.resultatGeneral)} de bénéfice. Le travail du président ne coûte rien à la trésorerie ; un concurrent qui paie son dirigeant le paie, lui.`,
          "Une nuance que la droite ignore : en décembre, une petite part du travail du président entre dans le coût d'achat des jeux et reste en stock. Le résultat analytique ne baisse donc pas tout à fait de 12 € par euro de rémunération mensuelle.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-concordance",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la concordance",
      notions: ["full_unit_cost", "income_statement"],
      question: () =>
        "Faites varier ce que la gestion compte pour le travail du président, et choisissez si elle incorpore les charges de risque (la dépréciation de Sonora et la provision pour le litige). Le tableau suit les deux résultats et leur écart. Relevez le défi.",
      leviers: () => [
        { code: "gerante", libelle: "Travail du président, par mois", unite: "€", min: GERANTE_DU_LABORATOIRE.min, max: GERANTE_DU_LABORATOIRE.max, pas: GERANTE_DU_LABORATOIRE.pas, depart: REMUNERATION_DE_LA_GERANTE },
        {
          code: "risques",
          libelle: "Charges de risque",
          unite: "",
          min: RISQUES.nonIncorpores,
          max: RISQUES.incorpores,
          pas: 1,
          depart: RISQUES.nonIncorpores,
          choix: [
            { valeur: RISQUES.nonIncorpores, libelle: "Non incorporées" },
            { valeur: RISQUES.incorpores, libelle: "Incorporées" },
          ],
        },
      ],
      lecture: (_, p) => {
        const l = laboratoireDeLaConcordance(p.gerante!, p.risques!);
        const d = laboratoireDeLaConcordance(REMUNERATION_DE_LA_GERANTE, RISQUES.nonIncorpores);
        return [
          { libelle: "Charges supplétives", montant: l.supletives, reference: d.supletives },
          { libelle: "Charges non incorporées", montant: l.nonIncorporees, reference: d.nonIncorporees },
          { libelle: "Résultat analytique de l'exercice", montant: l.resultatAnalytique, reference: d.resultatAnalytique, effet: true, fort: true },
          { libelle: "Résultat de la comptabilité générale", montant: l.resultatGeneral, reference: d.resultatGeneral },
          { libelle: "Écart à expliquer par le tableau de passage", montant: l.ecart, reference: d.ecart },
        ];
      },
      defi: () => {
        const solution = positionsProches()[0]!;
        return {
          consigne: `Trouvez la position où le résultat analytique tombe à moins de ${eur(ECART_DU_DEFI)} du résultat de la comptabilité générale.`,
          atteint: (p) => Math.abs(laboratoireDeLaConcordance(p.gerante!, p.risques!).ecart) <= ECART_DU_DEFI,
          indice: (p) => {
            const l = laboratoireDeLaConcordance(p.gerante!, p.risques!);
            return `L'écart est de ${eur(l.ecart)}. ${l.ecart < 0 ? "Le résultat analytique est trop haut : comptez plus de charges dans la gestion." : "Le résultat analytique est trop bas : comptez moins de charges dans la gestion."}`;
          },
          solution: { gerante: solution.gerante, risques: solution.risques },
        };
      },
      explication: (_, p) => {
        const l = laboratoireDeLaConcordance(p.gerante!, p.risques!);
        return [
          `Avec ${eur(p.gerante!)} par mois pour le président et les charges de risque ${p.risques === RISQUES.incorpores ? "incorporées" : "non incorporées"}, la gestion trouve ${eur(l.resultatAnalytique)}, à ${eur(Math.abs(l.ecart))} du résultat des comptes. Une coïncidence : la charge supplétive et les charges de risque se compensent presque.`,
          "Le résultat de la comptabilité générale n'a pas bougé d'un centime, quoi que vous ayez fait : ce sont les choix de la gestion qui déplacent son résultat, et le tableau de passage qui en rend compte. Deux résultats proches ne prouvent pas que la gestion compte juste ; deux résultats éloignés ne prouvent pas qu'elle se trompe.",
        ];
      },
    },
    {
      id: "le-mois-ou-l-exercice",
      objectifs: [3],
      type: "choix",
      titre: "Le mois, ou l'exercice",
      notions: ["income_statement"],
      question: () => "Pourquoi le tableau de passage part-il du résultat analytique de l'exercice, et non de celui de décembre ?",
      options: () => [
        { texte: "Les comptes n'ont de résultat qu'à la clôture", juste: true, retour: "Oui. L'inventaire, les amortissements, les provisions et l'impôt ne se font qu'au 31 décembre : un résultat de décembre de la comptabilité générale n'existe pas. La concordance se fait là où les deux comptabilités ont un résultat, sur l'exercice." },
        { texte: "Décembre n'a pas de résultat analytique propre", juste: false, retour: "Non : la gestion calcule un résultat chaque mois, décembre compris. C'est la comptabilité générale qui n'en a qu'un, à la clôture." },
        { texte: "Les arrondis ne se compensent que sur 12 mois", juste: false, retour: "Non : les arrondis ne se compensent pas, ils s'additionnent, et le tableau de passage les reprend. La raison est ailleurs : la clôture." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost", "income_statement"],
      tableau: (c) => {
        const { k } = concordanceDeNova(c);
        const l = k.lignes;
        return {
          titre: `Le tableau de passage de l'exercice N · ${concordanceDeNova(c).f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat analytique de l'exercice", valeurs: [eur(k.exercice.resultatAnalytique)] },
            { libelle: "Charges supplétives", valeurs: [eur(l.supletives)] },
            { libelle: "Produits non incorporés", valeurs: [eur(l.produitsNonIncorpores)] },
            { libelle: "Charges non incorporées", valeurs: [eur(l.chargesNonIncorporees)] },
            { libelle: "Différence d'incorporation de l'usure", valeurs: [eur(l.differenceDIncorporation)] },
            { libelle: "Boni d'inventaire", valeurs: [eur(l.boniDInventaire)] },
            { libelle: "Écart d'évaluation du stock final", valeurs: [eur(l.evaluationDuStock)] },
            { libelle: "Différences d'arrondi", valeurs: [eur(l.arrondis)] },
            { libelle: "Résultat de la comptabilité générale", valeurs: [eur(k.resultatGeneral)] },
          ],
        };
      },
      texte: (c) => {
        const { k, f } = concordanceDeNova(c);
        return [
          `Chez ${f.entreprise}, la gestion trouve ${eur(k.exercice.resultatAnalytique)} et les comptes ${eur(k.resultatGeneral)}. Le tableau de passage explique l'écart ligne par ligne, et retrouve le résultat de la clôture au centime.`,
          "Trois familles de différences. Les charges et les produits que la gestion n'incorpore pas, et les charges supplétives qu'elle ajoute. Les charges qu'elle évalue autrement : l'usure, le stock. Et les écarts de méthode : l'inventaire, qui corrige la fiche des bons, et les arrondis des unités d'œuvre et du coût moyen.",
          "Au niveau de l'examen, vous savez classer une charge, chiffrer chaque différence avec son signe, et dresser le tableau de passage d'un résultat à l'autre.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la méthode, elle, est la même.",
        ];
      },
      repere: () =>
        "Une charge non incorporée ou un produit non incorporé : la gestion trouve plus, ou moins, que les comptes. Une charge supplétive : la gestion trouve moins. Un boni d'inventaire s'ajoute, un mali se retranche.",
    },
  ],
};
