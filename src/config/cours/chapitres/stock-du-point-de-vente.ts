import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas, StockDuTrimestre } from "../cas";
import {
  fournisseurDe,
  leviersDuReassort,
  pointDeCommande,
  prixDAchatChez,
  referenceDe,
  simulerLeReassort,
  stockDuMois,
  coutVariable,
  type LeviersDuReassort,
} from "../monde/boutique";
import { BOUTIQUES_DU_COURS, JOURS_DU_TRIMESTRE, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE STOCK DU POINT DE VENTE (BTS MCO, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique du
 * cours, MAILLE & CO, a une fiche figée (monde/maille-et-co.ts : sa gamme, ses stocks et ses
 * livraisons de janvier, ses fournisseurs) et un modèle simple (monde/boutique.ts : `stockDuMois`,
 * le stock du mois référence par référence ; `simulerLeReassort`, le réassort jour par jour). Une
 * évolution du moteur ne change rien ici.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le stock d'un trimestre de l'arène (cas.stock, valorisé au coût
 * moyen pondéré, chez MAILLE & CO et PIXEL & CO). Il lit maintenant le mois de janvier de la boutique,
 * référence par référence, au coût d'achat du façonnier (qui ne change pas dans le mois : pas de coût
 * moyen à calculer). Il se joue chez MAILLE & CO seule, pour que le point de vente soit le même d'un
 * chapitre MCO à l'autre. Les chiffres changent : 1,99 de rotation sur le mois et 15 jours de stockage
 * (au lieu de 4,23 et 21 sur un trimestre). L'étape « qui finance », qui valait 0 jour (défaut 8 de
 * l'audit), compare maintenant deux fournisseurs : le façonnier, payé à 45 jours, finance le stock et
 * 30 jours de plus ; les fins de série, payées comptant, laissent la boutique porter ses 15 jours.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, le-stock-en-valeur, stock-moyen, rotation, lire-la-rotation (la formule est au
 *     repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-point-de-
 *     commande puis le-point-de-commande-au-curseur (le stock qui reste à la livraison face au stock de
 *     sécurité) avant le-point-de-commande ; predire-qui-finance puis le-credit-au-curseur (le crédit
 *     fournisseur moyen face au stock moyen, selon le délai de paiement) avant qui-finance ;
 *   · autonome : couverture, le-point-de-commande (la formule est donnée une fois), le-cardigan,
 *     qui-finance (ni formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-laboratoire-du-reassort (point de commande, quantité commandée, retard du façonnier :
 *     ne manquer aucune vente avec 7 jours de retard sans gonfler le stock ; le graphique trace le stock
 *     du soir en dents de scie), l-atelier-local (une variante chiffrée : un délai plus court, un prix
 *     plus haut), le-delai-court (une critique : un délai court baisse le point de commande, pas le
 *     stock moyen), a-rebours (retrouver le stock final à viser pour une durée de stockage donnée) ;
 *     puis la synthèse.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : le mois commercial de 30 jours aux ventes régulières ; le
 * stock valorisé au coût d'achat du façonnier ; le stock de sécurité de 7 jours de ventes (la fiche) ;
 * au curseur du crédit, des achats au rythme des marchandises vendues ; au laboratoire, un trimestre au
 * rythme de janvier qui commence avec le stock disponible de janvier.
 */

/** Les entreprises où le chapitre se joue : la boutique du cours, seule. */
export const ENTREPRISES_DU_STOCK: readonly string[] = ["boutique"];

/**
 * LA DURÉE DE STOCKAGE VISÉE AU MOIS SUIVANT (hypothèse du cours, pour le calcul à rebours) : 10 jours,
 * à ventes égales au coût d'achat, au lieu de 15.
 */
export const DUREE_DE_STOCKAGE_VISEE = 10;

/**
 * LE PLAFOND DU STOCK MOYEN DU LABORATOIRE (hypothèse du cours) : 400 pulls col rond en moyenne sur le
 * trimestre. Sans lui, un point de commande très haut ne manquerait jamais rien, en immobilisant tout.
 */
export const STOCK_MOYEN_PLAFOND = 400;

/** Les bornes des leviers du laboratoire du réassort. */
export const LEVIERS_DU_REASSORT = {
  commande: { min: 300, max: 800, pas: 20 },
  quantite: { min: 200, max: 900, pas: 50 },
  retard: { min: 0, max: 14, pas: 1 },
} as const;

/** Les bornes du curseur du point de commande et de celui du délai de paiement. */
export const POINT_DE_COMMANDE_DU_CURSEUR = { min: 300, max: 800 } as const;
export const DELAI_DU_CURSEUR = { min: 0, max: 60 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Le stock de janvier, et tout ce que le chapitre et son cas en tirent. */
export function stockDeLaBoutique(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = stockDuMois(f);
  const faconnier = fournisseurDe(f, "faconnier");
  const finsDeSerie = fournisseurDe(f, "fins-de-serie");
  const atelier = fournisseurDe(f, "atelier-local");
  const col = s.references.find((r) => r.code === "col-rond")!;
  const cardigan = s.references.find((r) => r.code === "cardigan")!;
  const refCol = referenceDe(f, "col-rond");
  const refCardigan = referenceDe(f, "cardigan");
  const coutDe = (code: string) => f.gamme.find((r) => r.code === code)!.coutDAchat;
  const rotation = auCentime(s.rotation);
  const duree = Math.round(s.dureeDeStockage);
  const reassort = leviersDuReassort(f, "col-rond");
  const ventesDuDelai = col.ventesParJour * faconnier.delaiDeLivraison;
  // Le crédit fournisseur moyen : des achats au rythme des marchandises vendues, payés au délai.
  const achatsParJour = auCentime(s.coutDAchatDesVendues / f.joursDuMois);
  const delaiQuiFinance = Math.ceil(s.stockMoyen / achatsParJour - 1e-9);
  // La variante de l'atelier local : un délai plus court, le même stock de sécurité, la même commande.
  const pointDeCommandeAtelier = pointDeCommande(col.ventesParJour, atelier.delaiDeLivraison, col.stockDeSecurite);
  const stockMoyenDUnCycle = col.stockDeSecurite + reassort.quantiteCommandee / 2;
  const prixAtelier = prixDAchatChez(f, "col-rond", "atelier-local");
  // Le calcul à rebours : la durée visée, à ventes égales, et un mois qui part du stock du 31 janvier.
  const rotationVisee = f.joursDuMois / DUREE_DE_STOCKAGE_VISEE;
  const stockMoyenVise = auCentime(s.coutDAchatDesVendues / rotationVisee);
  return {
    f,
    s,
    faconnier,
    finsDeSerie,
    atelier,
    col,
    cardigan,
    refCol,
    refCardigan,
    coutDe,
    rotation,
    duree,
    couverture: auDixieme(s.couverture),
    couvertureDuCol: col.final / col.ventesParJour,
    reassort,
    ventesDuDelai,
    margeDuCol: auCentime(refCol.prixHt - coutVariable(refCol)),
    demandeDuCardigan: refCardigan.demandeDuMois,
    manqueDuCardigan: refCardigan.demandeDuMois - refCardigan.ventesDuMois,
    caManqueDuCardigan: auCentime((refCardigan.demandeDuMois - refCardigan.ventesDuMois) * refCardigan.prixHt),
    joursFinancesParLeFaconnier: faconnier.delaiDePaiement - duree,
    joursAvancesAvecLesFins: duree - finsDeSerie.delaiDePaiement,
    stockMoyenAuxFins: auCentime(s.stockMoyen * finsDeSerie.multiplicateur),
    achatsParJour,
    delaiQuiFinance,
    pointDeCommandeAtelier,
    stockMoyenDUnCycle,
    prixAtelier,
    surcoutAtelier: auCentime(reassort.quantiteCommandee * (prixAtelier - refCol.coutDAchat)),
    rotationVisee,
    stockMoyenVise,
    stockFinalVise: auCentime(2 * stockMoyenVise - s.valeurFinale),
  };
}

export type StockDeLaBoutique = ReturnType<typeof stockDeLaBoutique>;

/** Le laboratoire du réassort : le trimestre du pull col rond pour un point de commande, une quantité et un retard. */
export function laboratoireDuReassort(x: StockDeLaBoutique, commande: number, quantite: number, retard: number) {
  const l: LeviersDuReassort = { ...x.reassort, pointDeCommande: commande, quantiteCommandee: quantite, retard };
  return simulerLeReassort(l);
}

/** Le stock de janvier, référence par référence : le document de départ. */
export function tableauDuStock(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = stockDeLaBoutique(c);
  return {
    titre: `${x.f.entreprise} · le stock de ${x.f.moisDeReference}, référence par référence`,
    colonnes: ["Au 1er janvier", "Livré en janvier", "Vendu en janvier", "Au 31 janvier", "Coût d'achat"],
    lignes: x.s.references.map((r) => ({ libelle: r.nom, valeurs: [qte(r.initial), qte(r.livre), qte(r.vendu), qte(r.final), eur(x.coutDe(r.code))] })),
  };
}

/** Le tableau de la synthèse : ce que le manager suit, référence par référence. */
function tableauDuReassort(x: StockDeLaBoutique): TableauDeDonnees {
  return {
    titre: `${x.f.entreprise} · le réassort chez le façonnier, livré en ${qte(x.faconnier.delaiDeLivraison)} jours`,
    colonnes: ["Ventes par jour", "Stock de sécurité", "Point de commande", "Au 31 janvier", "Couverture"],
    lignes: x.s.references.map((r) => ({
      libelle: r.nom,
      valeurs: [qte(r.ventesParJour), qte(r.stockDeSecurite), qte(r.pointDeCommande), qte(r.final), `${qte(auDixieme(r.couverture))} jours`],
    })),
  };
}

export const STOCK_DU_POINT_DE_VENTE: Chapitre = {
  code: "stock-du-point-de-vente",
  parcours: "mco",
  palier: 3,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
    "2de pro GATL 4 · Traiter les flux physiques en relation avec les données de gestion",
    "BUT TC · Piloter un espace de vente",
  ],
  titre: "Le stock du point de vente",
  accroche:
    "Ce que le stock immobilise, à quelle vitesse il tourne, et quand recommander pour ne pas manquer de ventes. Puis la question du banquier : le fournisseur finance-t-il le stock, ou la boutique paie-t-elle ses articles avant leur vente ?",
  objectifs: [
    "Calculer le stock moyen, le coût d'achat des marchandises vendues, la rotation et la durée de stockage",
    "Calculer la couverture du stock, référence par référence",
    "Calculer le stock de sécurité et le point de commande, et voir la rupture qu'ils évitent",
    "Comparer la durée de stockage au délai de paiement du fournisseur",
    "Retrouver le stock à viser pour une durée de stockage donnée, et critiquer un délai plus court",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_STOCK,
    pourquoi:
      "ce chapitre se joue dans la boutique du cours, MAILLE & CO, dont la simulation suit le stock référence par référence et jour par jour : le même point de vente d'un chapitre MCO à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui dort en réserve",
      notions: ["stock"],
      tableau: tableauDuStock,
      texte: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, sur le mois de ${x.f.moisDeReference}. Le tableau donne, pour chacune des ${qte(x.s.references.length)} références, le stock du 1er janvier, ce que le façonnier a livré dans le mois, ce qui s'est vendu, et ce qui reste au 31 janvier.`,
          `La simulation suppose un mois commercial de ${qte(x.f.joursDuMois)} jours, aux ventes régulières. Le stock est valorisé au coût d'achat du façonnier, qui ne change pas dans le mois. Le façonnier livre ${qte(x.faconnier.delaiDeLivraison)} jours après la commande et se paie à ${qte(x.faconnier.delaiDePaiement)} jours.`,
          "Un article en réserve, c'est de l'argent payé au fournisseur et pas encore revenu par la caisse. Le commerçant veut assez de stock pour ne pas manquer de ventes, et pas plus.",
        ];
      },
      repere: () =>
        "Stock moyen = (stock initial + stock final) ÷ 2. Coût d'achat des marchandises vendues = stock initial + achats − stock final. Rotation = coût d'achat des marchandises vendues ÷ stock moyen. Durée de stockage = jours de la période ÷ rotation.",
    },
    {
      id: "le-stock-en-valeur",
      type: "montants",
      titre: "Le stock en valeur",
      notions: ["stock"],
      tableau: tableauDuStock,
      question: (c) =>
        `Pour chaque référence, multipliez la quantité par son coût d'achat, puis additionnez les ${qte(ficheDe(c).gamme.length)} lignes : le stock du 1er janvier, les livraisons de janvier, puis le stock du 31 janvier.`,
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        const somme = (q: (r: (typeof x.s.references)[number]) => number) => x.s.references.map((r) => `${qte(q(r))} × ${eur(x.coutDe(r.code))}`).join(" + ");
        return [
          { libelle: "Stock au 1er janvier, en valeur", attendu: x.s.valeurInitiale, calcul: `${somme((r) => r.initial)} = ${eur(x.s.valeurInitiale)}` },
          { libelle: "Achats livrés en janvier", attendu: x.s.achats, calcul: `${somme((r) => r.livre)} = ${eur(x.s.achats)}` },
          { libelle: "Stock au 31 janvier, en valeur", attendu: x.s.valeurFinale, calcul: `${somme((r) => r.final)} = ${eur(x.s.valeurFinale)}` },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Le stock a fondu dans le mois : ${eur(x.s.valeurInitiale)} au 1er janvier, ${eur(x.s.valeurFinale)} au 31. Le cardigan finit à zéro ; le bonnet, que le façonnier n'a pas livré, garde encore ${qte(x.s.references.find((r) => r.code === "bonnet")!.final)} articles.`,
        ];
      },
    },
    {
      id: "stock-moyen",
      type: "montants",
      titre: "Le stock moyen et le coût des vendues",
      notions: ["stock", "stock_rotation"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Avec ${eur(x.s.valeurInitiale)} au 1er janvier, ${eur(x.s.achats)} d'achats et ${eur(x.s.valeurFinale)} au 31 janvier, calculez le stock moyen du mois (la moyenne du stock initial et du stock final), puis le coût d'achat des marchandises vendues (stock initial, plus achats, moins stock final).`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          { libelle: "Stock moyen", attendu: x.s.stockMoyen, calcul: `(${eur(x.s.valeurInitiale)} + ${eur(x.s.valeurFinale)}) ÷ 2 = ${eur(x.s.stockMoyen)}` },
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: x.s.coutDAchatDesVendues,
            calcul: `${eur(x.s.valeurInitiale)} + ${eur(x.s.achats)} − ${eur(x.s.valeurFinale)} = ${eur(x.s.coutDAchatDesVendues)}`,
          },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `En moyenne, ${eur(x.s.stockMoyen)} dorment en réserve pendant le mois, pour ${eur(x.s.coutDAchatDesVendues)} de marchandises vendues au prix d'achat. Vérification : les ${qte(x.s.vendus)} articles vendus, chacun à son coût d'achat, refont exactement ce montant.`,
        ];
      },
    },
    {
      id: "rotation",
      type: "montants",
      titre: "La rotation et la durée de stockage",
      notions: ["stock_rotation"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Le stock moyen vaut ${eur(x.s.stockMoyen)} et les marchandises vendues ${eur(x.s.coutDAchatDesVendues)} au prix d'achat. Calculez la rotation du stock sur le mois (coût des vendues ÷ stock moyen, au centième), puis la durée moyenne de stockage (${qte(x.f.joursDuMois)} jours ÷ rotation, au jour).`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          { libelle: "Rotation du stock", attendu: x.rotation, tolerance: 0.01, calcul: `${eur(x.s.coutDAchatDesVendues)} ÷ ${eur(x.s.stockMoyen)} = ${deux(x.rotation)}` },
          { libelle: "Durée moyenne de stockage (jours)", attendu: x.duree, tolerance: 1, calcul: `${qte(x.f.joursDuMois)} ÷ ${deux(x.rotation)} = ${qte(x.duree)}` },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Le stock a tourné ${deux(x.rotation)} fois dans le mois : un article reste en moyenne ${qte(x.duree)} jours en réserve avant d'être vendu. Sur un trimestre au même rythme, la rotation serait ${qte(JOURS_DU_TRIMESTRE / x.f.joursDuMois)} fois plus forte, et la durée la même : la rotation dépend de la période, la durée de stockage non.`,
        ];
      },
    },
    {
      id: "lire-la-rotation",
      type: "choix",
      titre: "Une rotation qui monte",
      notions: ["stock_rotation"],
      question: (c) => `Au mois suivant, la rotation du stock de ${stockDeLaBoutique(c).f.entreprise} passe au-dessus de ${deux(stockDeLaBoutique(c).rotation)}. Qu'est-ce que cela veut dire ?`,
      options: () => [
        {
          texte: "Le stock tourne plus vite : moins d'argent dort en réserve pour les mêmes ventes.",
          juste: true,
          retour: "Oui. Une rotation plus forte, c'est une durée de stockage plus courte : la boutique vend la même chose avec moins de stock, donc moins d'argent avancé au fournisseur.",
        },
        {
          texte: "La boutique a acheté plus de marchandises.",
          juste: false,
          retour: "Acheter plus sans vendre plus fait grossir le stock moyen : la rotation baisse.",
        },
        {
          texte: "Les ventes ont baissé.",
          juste: false,
          retour: "Moins de ventes, au même stock, c'est une rotation plus faible : le stock dort plus longtemps.",
        },
      ],
    },
    {
      id: "couverture",
      type: "montants",
      titre: "La couverture du stock",
      notions: ["stock"],
      tableau: tableauDuStock,
      question: () =>
        "Sans formule cette fois. Au rythme de janvier, combien d'articles la boutique vend-elle par jour ? Combien de jours de vente le stock du 31 janvier tient-il, toutes références confondues (au dixième) ? Et celui du pull col rond seul ?",
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          { libelle: "Ventes par jour", attendu: x.s.ventesParJour, calcul: `${qte(x.s.vendus)} ÷ ${qte(x.f.joursDuMois)} = ${qte(x.s.ventesParJour)}` },
          { libelle: "Couverture du stock final (jours)", attendu: x.couverture, tolerance: 0.1, calcul: `${qte(x.s.final)} ÷ ${qte(x.s.ventesParJour)} = ${qte(x.couverture)}` },
          { libelle: "Couverture du pull col rond (jours)", attendu: x.couvertureDuCol, tolerance: 0.1, calcul: `${qte(x.col.final)} ÷ (${qte(x.col.vendu)} ÷ ${qte(x.f.joursDuMois)}) = ${qte(x.col.final)} ÷ ${qte(x.col.ventesParJour)} = ${qte(x.couvertureDuCol)}` },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `En moyenne, le stock tient ${qte(x.couverture)} jours. La moyenne cache tout : le cardigan est à zéro, le bonnet tient ${qte(auDixieme(x.s.references.find((r) => r.code === "bonnet")!.couverture))} jours. Le pull col rond tient ${qte(x.couvertureDuCol)} jours, et le façonnier livre en ${qte(x.faconnier.delaiDeLivraison)} : commandé aujourd'hui, il arrivera trop tard. La couverture se lit référence par référence, face au délai de livraison.`,
        ];
      },
    },
    {
      id: "predire-le-point-de-commande",
      type: "choix",
      titre: "Pariez sur le moment de commander",
      notions: ["stock"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Avant de calculer, pariez. Le pull col rond se vend ${qte(x.col.ventesParJour)} par jour, et le façonnier livre ${qte(x.faconnier.delaiDeLivraison)} jours après la commande ; il lui arrive d'avoir une semaine de retard. Pour ne manquer aucune vente, la boutique doit commander quand il reste en réserve…`;
      },
      options: () => {
        const voir = "Déplacez le curseur à l'étape suivante : il montre ce qui reste en réserve quand la livraison arrive.";
        return [
          { texte: "Juste les ventes du délai de livraison", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Les ventes du délai, plus une réserve pour le retard", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Rien : on commande quand le rayon est vide", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-point-de-commande-au-curseur",
      type: "curseur",
      titre: "Commandez au bon moment",
      notions: ["stock"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Faites varier le stock auquel la boutique commande le pull col rond. Une droite donne ce qui reste en réserve quand la livraison arrive, ${qte(x.faconnier.delaiDeLivraison)} jours plus tard ; l'autre, la réserve qui tient ${qte(x.f.delaiDeSecurite)} jours de retard. Placez le curseur sur le plus petit stock de commande qui garde cette réserve intacte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Stock au moment de commander", unite: "pulls" }),
      cible: (c) => {
        const x = stockDeLaBoutique(c);
        return { attendu: x.ventesDuDelai + x.col.stockDeSecurite, min: POINT_DE_COMMANDE_DU_CURSEUR.min, max: POINT_DE_COMMANDE_DU_CURSEUR.max };
      },
      zones: ["La réserve tient le retard", "Rupture au premier retard"],
      rates: () => ({
        dessous: "À ce niveau, la livraison arrive quand la réserve est déjà entamée : un retard, et le rayon se vide.",
        dessus: "Plus bas, la réserve tient encore : cherchez le plus petit stock de commande.",
      }),
      montrer: "Montrer le point de commande",
      lecture: (c, p) => {
        const x = stockDeLaBoutique(c);
        const cout = x.refCol.coutDAchat;
        return [
          { libelle: "Stock au moment de commander, au coût d'achat", montant: auCentime(p * cout) },
          { libelle: "Ventes du délai de livraison, au coût d'achat", montant: auCentime(x.ventesDuDelai * cout) },
          { libelle: "Stock restant à la livraison, au coût d'achat", montant: auCentime(Math.max(0, p - x.ventesDuDelai) * cout) },
          {
            libelle: "Chiffre d'affaires perdu avec une semaine de retard",
            montant: auCentime(Math.max(0, x.ventesDuDelai + x.col.ventesParJour * x.f.delaiDeSecurite - p) * x.refCol.prixHt),
            fort: true,
          },
        ];
      },
      droites: (c) => {
        const x = stockDeLaBoutique(c);
        return {
          produit: (p) => p - x.ventesDuDelai,
          cout: () => x.col.stockDeSecurite,
          libelles: ["Stock restant à la livraison", "Réserve de sécurité"],
        };
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Il faut commander à ${qte(x.ventesDuDelai + x.col.stockDeSecurite)} pulls. Pendant les ${qte(x.faconnier.delaiDeLivraison)} jours du délai, la boutique en vend ${qte(x.ventesDuDelai)} ; il en reste ${qte(x.col.stockDeSecurite)} à l'arrivée de la livraison, de quoi vendre ${qte(x.f.delaiDeSecurite)} jours de plus si le façonnier est en retard. Ces ${qte(x.col.stockDeSecurite)} pulls sont le stock de sécurité ; le seuil où l'on commande, le point de commande.`,
        ];
      },
    },
    {
      id: "le-point-de-commande",
      type: "montants",
      titre: "Le stock de sécurité et le point de commande",
      notions: ["stock"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Le stock de sécurité couvre ${qte(x.f.delaiDeSecurite)} jours de ventes : stock de sécurité = ventes par jour × ${qte(x.f.delaiDeSecurite)}. Point de commande = ventes par jour × délai de livraison + stock de sécurité. Calculez, pour le pull col rond (${qte(x.col.vendu)} vendus en ${qte(x.f.joursDuMois)} jours, livré en ${qte(x.faconnier.delaiDeLivraison)} jours), les ventes par jour, le stock de sécurité et le point de commande.`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          { libelle: "Ventes par jour du pull col rond", attendu: x.col.ventesParJour, calcul: `${qte(x.col.vendu)} ÷ ${qte(x.f.joursDuMois)} = ${qte(x.col.ventesParJour)}` },
          { libelle: "Stock de sécurité", attendu: x.col.stockDeSecurite, calcul: `${qte(x.col.ventesParJour)} × ${qte(x.f.delaiDeSecurite)} = ${qte(x.col.stockDeSecurite)}` },
          {
            libelle: "Point de commande",
            attendu: x.col.pointDeCommande,
            calcul: `${qte(x.col.ventesParJour)} × ${qte(x.faconnier.delaiDeLivraison)} + ${qte(x.col.stockDeSecurite)} = ${qte(x.col.pointDeCommande)}`,
          },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `C'est le chiffre trouvé au curseur. Le point de commande ne dit pas combien commander, mais quand : dès que la réserve du pull col rond descend à ${qte(x.col.pointDeCommande)}. Au 31 janvier, il en reste ${qte(x.col.final)} : la commande aurait dû partir depuis longtemps.`,
        ];
      },
    },
    {
      id: "le-cardigan",
      type: "montants",
      titre: "Le cardigan en rupture",
      notions: ["stock"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `À vous, sans formule. Le cardigan se vend ${qte(x.cardigan.ventesParJour)} par jour chez le même façonnier ; les clients en ont demandé ${qte(x.demandeDuCardigan)} en janvier, à ${eur(x.refCardigan.prixHt)} hors taxes. Calculez son point de commande, les ventes manquées de janvier, puis le chiffre d'affaires hors taxes qu'elles ont coûté.`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          {
            libelle: "Point de commande du cardigan",
            attendu: x.cardigan.pointDeCommande,
            calcul: `${qte(x.cardigan.ventesParJour)} × ${qte(x.faconnier.delaiDeLivraison)} + ${qte(x.cardigan.ventesParJour)} × ${qte(x.f.delaiDeSecurite)} = ${qte(x.cardigan.pointDeCommande)}`,
          },
          { libelle: "Ventes manquées du cardigan", attendu: x.manqueDuCardigan, calcul: `${qte(x.demandeDuCardigan)} demandés − ${qte(x.cardigan.vendu)} vendus = ${qte(x.manqueDuCardigan)}` },
          { libelle: "Chiffre d'affaires manqué", attendu: x.caManqueDuCardigan, calcul: `${qte(x.manqueDuCardigan)} × ${eur(x.refCardigan.prixHt)} = ${eur(x.caManqueDuCardigan)}` },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Au 1er janvier, il ne restait que ${qte(x.cardigan.initial)} cardigans, bien sous le point de commande de ${qte(x.cardigan.pointDeCommande)} : la commande aurait dû partir en décembre. La livraison de ${qte(x.cardigan.livre)}, le ${qte(x.refCardigan.livraisons[0]!.jour)} janvier, n'a pas suffi : ${qte(x.manqueDuCardigan)} demandes sont restées sans article, ${eur(x.caManqueDuCardigan)} de ventes perdues. Une rupture ne se voit pas dans la rotation : elle se lit dans la demande servie.`,
        ];
      },
    },
    {
      id: "predire-qui-finance",
      type: "choix",
      titre: "Pariez sur qui finance le stock",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Un article reste ${qte(x.duree)} jours en réserve. Le façonnier se paie à ${qte(x.faconnier.delaiDePaiement)} jours ; un tricoteur de fins de série vend ${pct(Math.round((1 - x.finsDeSerie.multiplicateur) * 100))} moins cher, mais au comptant. Pariez : si la boutique achetait tout en fins de série, qui financerait son stock ?`;
      },
      options: () => {
        const voir = "Faites varier le délai de paiement à l'étape suivante, et regardez qui porte le stock.";
        return [
          { texte: "La boutique : elle paierait chaque article avant sa vente", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le fournisseur, comme avant : le stock tourne vite", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Personne : le prix plus bas compense le paiement comptant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-credit-au-curseur",
      type: "curseur",
      titre: "Le délai qui finance le stock",
      notions: ["payment_terms", "bfr", "stock_rotation"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Supposez que la boutique achète au rythme où elle vend, ${eur(x.achatsParJour)} au coût d'achat chaque jour. Faites varier le délai de paiement du fournisseur : une droite donne ce que la boutique lui doit en moyenne (achats d'un jour × délai), l'autre son stock moyen, ${eur(x.s.stockMoyen)}. Placez le curseur sur le plus petit délai, en jours, où le crédit du fournisseur couvre tout le stock.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement du fournisseur", unite: "jours" }),
      cible: (c) => ({ attendu: stockDeLaBoutique(c).delaiQuiFinance, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["Le fournisseur finance le stock", "La boutique avance l'argent"],
      rates: () => ({
        dessous: "À ce délai, la boutique paie ses articles avant que le stock ne soit écoulé : elle en finance une part.",
        dessus: "Plus court encore, le crédit du fournisseur couvre toujours le stock : cherchez le plus petit délai.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, d) => {
        const x = stockDeLaBoutique(c);
        const credit = auCentime(x.achatsParJour * d);
        return [
          { libelle: "Crédit du fournisseur, en moyenne", montant: credit },
          { libelle: "Stock moyen", montant: x.s.stockMoyen },
          { libelle: "Stock que la boutique finance elle-même", montant: auCentime(Math.max(0, x.s.stockMoyen - credit)), fort: true },
        ];
      },
      droites: (c) => {
        const x = stockDeLaBoutique(c);
        return { produit: (d) => x.achatsParJour * d, cout: () => x.s.stockMoyen, libelles: ["Crédit du fournisseur", "Stock moyen"] };
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Dès ${qte(x.delaiQuiFinance)} jours de crédit, le fournisseur finance tout le stock : c'est la durée de stockage exacte, ${qte(auCentime(x.s.dureeDeStockage))} jours, arrondie au jour supérieur. Au comptant, le délai vaut zéro, et la boutique porte seule ses ${eur(x.s.stockMoyen)} de stock moyen. Le façonnier, à ${qte(x.faconnier.delaiDePaiement)} jours, fait mieux que financer le stock : il finance aussi des articles déjà vendus et encaissés.`,
        ];
      },
    },
    {
      id: "qui-finance",
      type: "montants",
      titre: "Qui finance le stock ?",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Un article reste ${qte(x.duree)} jours en réserve. Chez le façonnier, de combien de jours le crédit dépasse-t-il cette durée ? Chez les fins de série, combien de jours la boutique paie-t-elle un article avant sa vente ? Et quel stock moyen avancerait-elle, si elle y achetait les mêmes articles ?`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          {
            libelle: "Jours financés par le façonnier au-delà du stockage",
            attendu: x.joursFinancesParLeFaconnier,
            tolerance: 1,
            calcul: `${qte(x.faconnier.delaiDePaiement)} − ${qte(x.duree)} = ${qte(x.joursFinancesParLeFaconnier)}`,
          },
          {
            libelle: "Jours avancés par la boutique avec les fins de série",
            attendu: x.joursAvancesAvecLesFins,
            tolerance: 1,
            calcul: `${qte(x.duree)} − ${qte(x.finsDeSerie.delaiDePaiement)} (comptant) = ${qte(x.joursAvancesAvecLesFins)}`,
          },
          {
            libelle: "Stock moyen avancé avec les fins de série",
            attendu: x.stockMoyenAuxFins,
            tolerance: 1,
            calcul: `${eur(x.s.stockMoyen)} × ${qte(x.finsDeSerie.multiplicateur)} = ${eur(x.stockMoyenAuxFins)}`,
          },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Chez le façonnier, l'article est vendu ${qte(x.joursFinancesParLeFaconnier)} jours avant d'être payé : le crédit fournisseur finance le stock et au-delà, une ressource pour la trésorerie. Chez les fins de série, la boutique paie comptant et attend ${qte(x.joursAvancesAvecLesFins)} jours la vente : ses ${eur(x.stockMoyenAuxFins)} de stock moyen pèsent sur son besoin en fonds de roulement. Le prix plus bas allège le stock à financer ; le paiement comptant le fait porter par la boutique.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-reassort",
      type: "simulation",
      titre: "Le laboratoire du réassort",
      notions: ["stock", "stock_rotation"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Faites tourner le réassort du pull col rond sur un trimestre au rythme de janvier, ${qte(x.col.ventesParJour)} pulls par jour, à partir des ${qte(x.reassort.stockInitial)} pulls disponibles en janvier. Le façonnier livre ${qte(x.faconnier.delaiDeLivraison)} jours après la commande, plus son retard. Réglez le point de commande, la quantité commandée et le retard ; le graphique trace le stock de chaque soir, en faisant glisser le jour lu.`;
      },
      leviers: (c) => {
        const x = stockDeLaBoutique(c);
        const L = LEVIERS_DU_REASSORT;
        return [
          { code: "commande", libelle: "Point de commande", unite: "pulls", ...L.commande, depart: x.ventesDuDelai },
          { code: "quantite", libelle: "Quantité commandée", unite: "pulls", ...L.quantite, depart: x.reassort.quantiteCommandee },
          { code: "retard", libelle: "Retard du façonnier", unite: "jours", ...L.retard, depart: x.f.delaiDeSecurite },
          { code: "jour", libelle: "Jour du trimestre lu", unite: "jour", min: 1, max: x.reassort.jours, pas: 1, depart: Math.round(x.reassort.jours / 2) },
        ];
      },
      lecture: (c, p) => {
        const x = stockDeLaBoutique(c);
        const l = laboratoireDuReassort(x, p.commande!, p.quantite!, p.retard!);
        const d = laboratoireDuReassort(x, x.ventesDuDelai, x.reassort.quantiteCommandee, x.f.delaiDeSecurite);
        const jour = Math.min(x.reassort.jours, Math.max(1, Math.round(p.jour!)));
        const moyen = (s: typeof l) => auCentime(s.stockMoyen);
        return [
          { libelle: "Ventes manquées du trimestre", montant: l.ventesManquees, reference: d.ventesManquees, unite: "pulls" },
          { libelle: "Jours de rupture", montant: l.joursDeRupture, reference: d.joursDeRupture, unite: "jours" },
          { libelle: "Commandes passées", montant: l.commandes, reference: d.commandes, unite: "commandes" },
          { libelle: "Stock moyen du soir", montant: moyen(l), reference: moyen(d), unite: "pulls" },
          { libelle: "Stock moyen, au coût d'achat", montant: auCentime(moyen(l) * x.refCol.coutDAchat), reference: auCentime(moyen(d) * x.refCol.coutDAchat) },
          { libelle: "Stock du soir au jour lu", montant: l.jours[jour - 1]!.stockDuSoir, unite: "pulls" },
          { libelle: "Marge perdue sur les ventes manquées", montant: auCentime(-l.ventesManquees * x.margeDuCol), reference: auCentime(-d.ventesManquees * x.margeDuCol), effet: true, fort: true },
        ];
      },
      // Le stock du soir, jour après jour : des dents de scie, qui descendent de la demande du jour et
      // remontent d'un coup à chaque livraison ; le point de commande et le stock de sécurité en repère.
      graphique: (c) => {
        const x = stockDeLaBoutique(c);
        return {
          levier: "jour",
          unite: "pulls",
          courbes: [
            {
              libelle: "Stock du soir",
              valeur: (p) => {
                const l = laboratoireDuReassort(x, p.commande!, p.quantite!, p.retard!);
                return l.jours[Math.min(x.reassort.jours, Math.max(1, Math.round(p.jour!))) - 1]!.stockDuSoir;
              },
            },
            { libelle: "Point de commande", valeur: (p) => p.commande! },
            { libelle: "Stock de sécurité", valeur: () => x.col.stockDeSecurite },
          ],
        };
      },
      defi: (c) => {
        const x = stockDeLaBoutique(c);
        const retard = x.f.delaiDeSecurite;
        return {
          consigne: `Le façonnier peut livrer avec ${qte(retard)} jours de retard : ne manquez aucune vente du pull col rond sur le trimestre, avec un stock moyen d'au plus ${qte(STOCK_MOYEN_PLAFOND)} pulls.`,
          atteint: (p) => {
            const l = laboratoireDuReassort(x, p.commande!, p.quantite!, p.retard!);
            return p.retard! >= retard && l.ventesManquees === 0 && l.stockMoyen <= STOCK_MOYEN_PLAFOND;
          },
          indice: (p) => {
            const l = laboratoireDuReassort(x, p.commande!, p.quantite!, p.retard!);
            if (p.retard! < retard) return `Le défi se joue avec au moins ${qte(retard)} jours de retard : c'est le retard que le stock de sécurité doit absorber.`;
            if (l.ventesManquees > 0)
              return `${qte(l.ventesManquees)} pulls manquent, sur ${qte(l.joursDeRupture)} jours de rupture : la commande part trop tard ou trop petite. Montez le point de commande, ou commandez davantage à chaque fois.`;
            return `Aucune rupture, mais le stock moyen monte à ${qte(auCentime(l.stockMoyen))} pulls : trop d'argent dort en réserve. Baissez le point de commande ou la quantité commandée.`;
          },
          solution: { commande: x.col.pointDeCommande, quantite: x.reassort.quantiteCommandee, retard, jour: Math.round(x.reassort.jours / 2) },
        };
      },
      montrer: "Montrer un réglage qui tient",
      explication: (c, p) => {
        const x = stockDeLaBoutique(c);
        const l = laboratoireDuReassort(x, p.commande!, p.quantite!, p.retard!);
        return [
          `Commander à ${qte(p.commande!)} pulls, ${qte(p.quantite!)} à la fois : ${qte(l.commandes)} commandes sur le trimestre, aucune vente manquée malgré ${qte(p.retard!)} jours de retard, et ${qte(auCentime(l.stockMoyen))} pulls en moyenne. Le point de commande du chapitre, ${qte(x.col.pointDeCommande)}, avec un mois de ventes à chaque commande, tient le défi ; d'autres réglages le tiennent aussi.`,
          `Le stock dessine des dents de scie : il descend de ${qte(x.col.ventesParJour)} pulls par jour et remonte d'un coup à chaque livraison. Le stock de sécurité ne sert que pendant le retard. Sans lui, au point de commande de ${qte(x.ventesDuDelai)}, la même semaine de retard vide le rayon. Une commande plus petite part plus souvent, et demande un point de commande plus haut pour ne pas rompre.`,
        ];
      },
    },
    {
      id: "l-atelier-local",
      type: "montants",
      titre: "Variante : l'atelier local, plus proche",
      notions: ["stock", "payment_terms"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Variante : l'atelier local livre le pull col rond en ${qte(x.atelier.delaiDeLivraison)} jours au lieu de ${qte(x.faconnier.delaiDeLivraison)}, mais à ${eur(x.prixAtelier)} au lieu de ${eur(x.refCol.coutDAchat)}. La boutique garde ${qte(x.f.delaiDeSecurite)} jours de stock de sécurité et des commandes de ${qte(x.reassort.quantiteCommandee)} pulls. Calculez le point de commande chez l'atelier, le stock moyen d'un cycle de commande (le stock de sécurité, plus la moitié de la commande, chez l'un comme chez l'autre), et ce qu'une commande coûte de plus à l'atelier.`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          {
            libelle: "Point de commande chez l'atelier local",
            attendu: x.pointDeCommandeAtelier,
            calcul: `${qte(x.col.ventesParJour)} × ${qte(x.atelier.delaiDeLivraison)} + ${qte(x.col.stockDeSecurite)} = ${qte(x.pointDeCommandeAtelier)}`,
          },
          {
            libelle: "Stock moyen d'un cycle de commande",
            attendu: x.stockMoyenDUnCycle,
            calcul: `${qte(x.col.stockDeSecurite)} + ${qte(x.reassort.quantiteCommandee)} ÷ 2 = ${qte(x.stockMoyenDUnCycle)}, chez l'un comme chez l'autre`,
          },
          {
            libelle: "Surcoût d'une commande à l'atelier local",
            attendu: x.surcoutAtelier,
            calcul: `${qte(x.reassort.quantiteCommandee)} × (${eur(x.prixAtelier)} − ${eur(x.refCol.coutDAchat)}) = ${eur(x.surcoutAtelier)}`,
          },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Le point de commande tombe de ${qte(x.col.pointDeCommande)} à ${qte(x.pointDeCommandeAtelier)} pulls : on commande plus tard. Mais entre deux livraisons, le stock oscille toujours entre le stock de sécurité et le stock de sécurité plus la commande : en moyenne ${qte(x.stockMoyenDUnCycle)} pulls, le délai n'y change rien. Et chaque commande coûte ${eur(x.surcoutAtelier)} de plus.`,
        ];
      },
    },
    {
      id: "le-delai-court",
      type: "choix",
      titre: "Ce que promet un délai court",
      notions: ["stock", "stock_rotation"],
      question: (c) => `Le vendeur de l'atelier local promet : « Avec mes ${qte(stockDeLaBoutique(c).atelier.delaiDeLivraison)} jours de délai, vous garderez beaucoup moins de stock. » Qu'en dites-vous au manager ?`,
      options: (c) => {
        const x = stockDeLaBoutique(c);
        const pulls = x.col.pointDeCommande - x.pointDeCommandeAtelier;
        return [
          {
            texte: "Le délai baisse le point de commande, pas le stock moyen : c'est la taille de la commande qui l'allège",
            juste: true,
            retour: `Oui. Le stock moyen d'un cycle reste ${qte(x.stockMoyenDUnCycle)} pulls. Ce que le délai court permet, c'est de commander plus petit et plus souvent sans risquer la rupture (l'atelier accepte ${qte(x.atelier.minimumDeCommande)} pulls) : c'est là que le stock baisserait, et il faudrait le payer ${eur(auCentime(x.prixAtelier - x.refCol.coutDAchat))} de plus par pull.`,
          },
          {
            texte: `Il a raison : ${qte(pulls)} pulls de moins en réserve, ${eur(pulls * x.refCol.coutDAchat)} libérés`,
            juste: false,
            retour: `Non : ${qte(pulls)} pulls, c'est l'écart entre les deux points de commande, le moment où l'on commande. La réserve moyenne, elle, dépend du stock de sécurité et de la commande : ${qte(x.stockMoyenDUnCycle)} pulls dans les deux cas.`,
          },
          {
            texte: `Il a tort : le stock de sécurité coûterait ${eur(auCentime(x.col.stockDeSecurite * (x.prixAtelier - x.refCol.coutDAchat)))} de plus, et c'est tout`,
            juste: false,
            retour: `Non : ce n'est pas tout. Le délai court ne baisse pas le stock moyen à commande égale, mais il ouvre la voie à des commandes plus petites ; et le surcoût porte sur chaque pull acheté, ${eur(x.surcoutAtelier)} par commande de ${qte(x.reassort.quantiteCommandee)}.`,
          },
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le stock à viser",
      notions: ["stock_rotation", "stock"],
      question: (c) => {
        const x = stockDeLaBoutique(c);
        return `Le mois suivant, le manager vise une durée de stockage de ${qte(DUREE_DE_STOCKAGE_VISEE)} jours, pour les mêmes ventes au coût d'achat (${eur(x.s.coutDAchatDesVendues)}) sur ${qte(x.f.joursDuMois)} jours. Le mois part du stock du 31 janvier, ${eur(x.s.valeurFinale)}. Retrouvez la rotation visée, le stock moyen visé, puis le stock final à viser en fin de mois.`;
      },
      champs: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          { libelle: "Rotation visée", attendu: x.rotationVisee, calcul: `${qte(x.f.joursDuMois)} ÷ ${qte(DUREE_DE_STOCKAGE_VISEE)} = ${qte(x.rotationVisee)}` },
          { libelle: "Stock moyen visé", attendu: x.stockMoyenVise, calcul: `${eur(x.s.coutDAchatDesVendues)} ÷ ${qte(x.rotationVisee)} = ${eur(x.stockMoyenVise)}` },
          { libelle: "Stock final à viser", attendu: x.stockFinalVise, calcul: `2 × ${eur(x.stockMoyenVise)} − ${eur(x.s.valeurFinale)} = ${eur(x.stockFinalVise)}` },
        ];
      },
      explication: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `Pour stocker ${qte(DUREE_DE_STOCKAGE_VISEE)} jours, le stock doit tourner ${qte(x.rotationVisee)} fois dans le mois, et ne garder en moyenne que ${eur(x.stockMoyenVise)}. Comme le mois part de ${eur(x.s.valeurFinale)}, il doit finir à ${eur(x.stockFinalVise)}. Remonter de la durée au stock oblige à savoir ce que chaque ratio compare.`,
          `Le calcul ne dit pas quelles références alléger : un stock final plus bas, réparti au hasard, passerait sous le stock de sécurité d'une référence et ferait rompre. Le ratio fixe l'objectif, le réassort référence par référence le tient.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock", "stock_rotation", "payment_terms"],
      tableau: (c) => tableauDuReassort(stockDeLaBoutique(c)),
      texte: (c) => {
        const x = stockDeLaBoutique(c);
        return [
          `En janvier, ${x.f.entreprise} a gardé en moyenne ${eur(x.s.stockMoyen)} de stock pour ${eur(x.s.coutDAchatDesVendues)} vendus au coût d'achat : une rotation de ${deux(x.rotation)} et ${qte(x.duree)} jours de stockage. Le façonnier, payé à ${qte(x.faconnier.delaiDePaiement)} jours, finance ce stock ; au comptant, la boutique le porterait seule.`,
          `Le stock se pilote référence par référence : la couverture face au délai de livraison, le stock de sécurité pour le retard, le point de commande pour savoir quand commander. Le cardigan, commandé trop tard, a coûté ${eur(x.caManqueDuCardigan)} de ventes. Un délai plus court baisse le point de commande ; c'est la taille des commandes qui baisse le stock moyen.`,
          "Au niveau de l'examen, vous savez calculer un stock moyen, une rotation, une durée de stockage et une couverture, fixer un stock de sécurité et un point de commande, dire qui finance le stock selon le délai fournisseur, et retrouver à rebours le stock à viser.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Stock de sécurité = ventes par jour × délai de sécurité. Point de commande = ventes par jour × délai de livraison + stock de sécurité. Le fournisseur finance le stock quand son délai de paiement dépasse la durée de stockage.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS COMPATIBLES, POUR LES CHAPITRES ET LES CAS QUI LES LISENT ENCORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les entreprises du cours qui gardent un stock de marchandises d'un trimestre à l'autre (dans le cas
 * figé, cas.stock). Ce chapitre ne s'en sert plus (il se joue chez MAILLE & CO seule,
 * `ENTREPRISES_DU_STOCK`) ; « Le budget du point de vente » et son cas la lisent encore.
 */
export const COMMERCES_A_STOCK = ["boutique", "ecommerce"] as const;

/**
 * @deprecated Le stock d'un trimestre du cas figé (cas.stock, monde/cas-des-entreprises.ts), tel que
 * le chapitre le calculait avant de passer sur la boutique du cours. Le chapitre ne s'en sert plus ;
 * « Le tableau de bord du manager » et le cas « Commander pour la promotion » le lisent encore. Il ne
 * charge rien de l'arène (le type `Cas` seul est importé). À retirer quand ils seront passés sur le monde.
 */
export function stockDuPointDeVente(c: Cas) {
  if (!c.stock) throw new Error(`Pas de stock pour ${c.code}`);
  const s: StockDuTrimestre = c.stock;
  const jours = s.fin - s.debut + 1;
  const stockMoyen = auCentime((s.initial.valeur + s.final.valeur) / 2);
  const camv = s.coutDAchatDesVendues;
  const rotation = auCentime(camv / stockMoyen);
  const duree = Math.round(jours / rotation);
  const venduesParJour = auCentime(s.vendues / jours);
  const couverture = Math.round(s.final.quantite / venduesParJour);
  const delai = c.achat.delai;
  const stockFinalFinance = Math.max(0, Math.floor(((2 * delai * camv) / jours - s.initial.valeur) / s.cump));
  return {
    s,
    jours,
    stockMoyen,
    camv,
    rotation,
    duree,
    venduesParJour,
    couverture,
    delai,
    joursNonFinances: Math.max(0, duree - delai),
    stockFinalFinance,
    dureePour: (quantiteFinale: number) => (jours * ((s.initial.valeur + quantiteFinale * s.cump) / 2)) / camv,
  };
}
