import { soldUnits } from "../../../engine/simulation/runGame";
import type { SupplierDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel, pronom } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE STOCK DE SÉCURITÉ ET LE POINT DE COMMANDE (2de pro GATL, palier 1).
 *
 * Quand faut-il recommander ? L'élève lit le stock d'une année de l'arène, trimestre après
 * trimestre (le stock au début, les entrées, la demande des clients, les ventes, le stock à la
 * fin), calcule la demande par jour d'un trimestre, la consommation pendant le délai du
 * fournisseur, le stock de sécurité et le point de commande, puis dit s'il faut commander. Il
 * mesure enfin les deux erreurs telles que le moteur les joue : le stock qui déborde (des jours
 * de ventes payés d'avance, de l'argent bloqué au bilan) et le stock qui manque (la demande que
 * le stock ne sert pas est perdue, au même taux pour chaque clientèle).
 *
 * CE QUE LE MOTEUR FAIT, ET CE QU'IL NE FAIT PAS. Un trimestre de l'arène fait entrer en stock
 * ce que la feuille de décision commande, puis sert la demande avec le stock du début et ces
 * entrées ; ce qui manque est perdu (`lost`), ce qui reste passe au trimestre suivant, valorisé
 * au coût moyen pondéré. Il ne pose AUCUN délai de réapprovisionnement : ce qui est commandé dans
 * un trimestre est vendable dans ce trimestre. Le délai du cours est donc une hypothèse, prise
 * dans ce que la fiche du fournisseur de l'arène annonce au joueur (`DELAI_DE_REAPPROVISIONNEMENT`),
 * et le texte le dit. Le moteur ne compte pas non plus de coût de stockage à l'unité : l'entrepôt
 * est dans les charges de structure, le même montant plein ou vide. Ce que coûte un stock en trop,
 * dans l'arène, c'est l'argent payé au fournisseur et bloqué dans le stock.
 *
 * Les trimestres étudiés se lisent dans l'année du cours (`anneeJouee`) : le premier où le stock
 * manque (le pic, où la demande monte), et celui qui le précède, qui sert toute sa demande (la base
 * des calculs). Le premier, et non celui qui perd le plus : la gestion de l'arène commande d'après
 * la demande, et une fois le stock de départ écoulé, les trimestres suivants commencent à vide ;
 * seul le trimestre d'avant le premier manque garde un stock à comparer au point de commande.
 *
 * « Le stock du point de vente » (BTS MCO) mesure la rotation et le crédit fournisseur ; « Les
 * stocks » (comptabilité) passe les écritures d'inventaire. Ce chapitre-ci dit quand recommander.
 */

/**
 * Les entreprises du chapitre : celle qui garde le stock d'un seul produit, acheté à un
 * fournisseur, d'un trimestre à l'autre. Les autres n'en ont pas (un service ou un repas ne se
 * garde pas), le fabriquent à la demande (NOVA), gardent des chantiers en cours (le bâtiment), ou
 * suivent plusieurs articles qui ont chacun leur stock (la boutique).
 */
export const ENTREPRISES_DU_STOCK_DE_SECURITE: readonly string[] = ["ecommerce"];

/**
 * LE DÉLAI DE RÉAPPROVISIONNEMENT, HYPOTHÈSE DU COURS. Le moteur n'en pose pas. Le cours prend
 * celui que la fiche du fournisseur de l'arène annonce au joueur, celui que l'année du cours
 * utilise : chez PIXEL & CO, le grossiste européen promet un « réassort sous une semaine ». La
 * garde du chapitre vérifie que la fiche le dit toujours.
 */
export const DELAI_DE_REAPPROVISIONNEMENT: Readonly<Record<string, { jours: number; annonce: string }>> = {
  ecommerce: { jours: 7, annonce: "réassort sous une semaine" },
};

/**
 * LE STOCK DE SÉCURITÉ, CHOIX DE GESTION DU COURS : l'entreprise garde d'avance 5 jours de
 * demande, pour un fournisseur en retard ou une demande qui monte. Ce n'est pas un chiffre de
 * l'arène, et le texte le présente comme le choix de l'entreprise.
 */
export const JOURS_DE_SECURITE = 5;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface TrimestreDuStock {
  trimestre: number;
  /** Ce qui est en stock au début du trimestre, et à la fin (unités entières). */
  debut: number;
  fin: number;
  /** Ce qui entre en stock : ce qu'il faut pour que début + entrées − ventes = fin, au rond près. */
  entrees: number;
  demande: number;
  ventes: number;
  /** La demande que le stock n'a pas servie. */
  perdues: number;
  /** Le prix d'une unité vendue. */
  prix: number;
  /** La valeur du stock de fin au bilan de l'arène, et les charges de structure du trimestre. */
  valeurFin: number;
  chargesFixes: number;
}

/** Le fournisseur que l'année du cours utilise (celui de la feuille proposée). */
function fournisseurDuCours(c: Cas): SupplierDef {
  const s = scenarioByCode(c.code).scenario;
  const code = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!.supplier?.code;
  const f = (s.suppliers ?? []).find((x) => x.code === code) ?? s.suppliers?.[0];
  if (!f) throw new Error(`${c.entreprise} n'a pas de fournisseur dans l'arène`);
  return f;
}

/** Le stock de l'année du cours, trimestre par trimestre, tel que le moteur le joue. */
export function stockDeLAnnee(c: Cas): TrimestreDuStock[] {
  const { partie, depart } = anneeJouee(c.code);
  let debut = depart.finishedGoods.quantity;
  return partie.rounds.map((tour, k) => {
    const r = tour.results["joueur"]!;
    const suivant = tour.companies.find((x) => x.id === "joueur")!;
    const segments = Object.values(r.market.bySegment);
    const d = Math.round(debut);
    const f = Math.round(suivant.finishedGoods.quantity);
    const ventes = Math.round(soldUnits(r));
    const demande = Math.round(segments.reduce((t, v) => t + v.demandForCompany, 0));
    const vendues = segments.reduce((t, v) => t + v.sold, 0);
    debut = suivant.finishedGoods.quantity;
    return {
      trimestre: k + 1,
      debut: d,
      fin: f,
      entrees: f - d + ventes,
      demande,
      ventes,
      perdues: demande - ventes,
      prix: auCentime(segments.reduce((t, v) => t + v.revenue, 0) / vendues),
      valeurFin: auCentime(r.balanceSheet.inventoryValue),
      chargesFixes: auCentime(r.incomeStatement.fixedCosts),
    };
  });
}

/** Les chiffres du chapitre : la base, le point de commande, le stock qui déborde et celui qui manque. */
export function stockEtPointDeCommande(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const annee = stockDeLAnnee(c);
  const delai = DELAI_DE_REAPPROVISIONNEMENT[c.code];
  if (!delai) throw new Error(`Pas de délai de réapprovisionnement pour ${c.entreprise}`);
  // Le pic : le premier trimestre où le stock manque ; la base, celui d'avant, qui sert toute sa demande.
  const pic = annee.find((t) => t.perdues > 0);
  if (!pic) throw new Error(`${c.entreprise} ne manque jamais de stock dans l'année du cours`);
  const base = annee[pic.trimestre - 2];
  if (!base) throw new Error(`${c.entreprise} manque de stock dès le premier trimestre`);
  const jours = s.roundDays;
  const parJour = Math.ceil(base.demande / jours);
  const pendantLeDelai = parJour * delai.jours;
  const securite = parJour * JOURS_DE_SECURITE;
  const pointDeCommande = pendantLeDelai + securite;
  const couverture = Math.floor(base.fin / parJour);
  const disponibles = pic.debut + pic.entrees;
  const perdues = pic.demande - disponibles;
  return {
    annee,
    fournisseur: fournisseurDuCours(c),
    delai: delai.jours,
    annonce: delai.annonce,
    jours,
    base,
    pic,
    parJour,
    pendantLeDelai,
    securite,
    pointDeCommande,
    /** Les jours de demande que le point de commande garde d'avance : le délai et la sécurité. */
    joursDuPoint: delai.jours + JOURS_DE_SECURITE,
    joursAvantDeCommander: Math.max(0, Math.floor((base.fin - pointDeCommande) / parJour)),
    couverture,
    disponibles,
    perdues,
    chiffreDAffairesPerdu: auCentime(perdues * pic.prix),
  };
}

const tableauDeLAnnee = (c: Cas) => {
  const a = stockDeLAnnee(c);
  return {
    titre: `${c.entreprise} · le stock de l'année dans l'arène, en ${c.unites}`,
    colonnes: a.map((t) => `Trimestre ${t.trimestre}`),
    lignes: [
      { libelle: "Stock au début", valeurs: a.map((t) => qte(t.debut)) },
      { libelle: "Entrées en stock", valeurs: a.map((t) => qte(t.entrees)) },
      { libelle: "Demande des clients", valeurs: a.map((t) => qte(t.demande)) },
      { libelle: "Ventes", valeurs: a.map((t) => qte(t.ventes)) },
      { libelle: "Stock à la fin", valeurs: a.map((t) => qte(t.fin)) },
    ],
  };
};

export const LE_STOCK_DE_SECURITE: Chapitre = {
  code: "le-stock-de-securite",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion"],
  titre: "Le stock de sécurité et le point de commande",
  accroche:
    "Quand faut-il recommander ? Assez tôt pour ne jamais laisser un client sans rien, assez tard pour ne pas remplir l'entrepôt d'argent qui dort. La demande par jour, le délai du fournisseur, le stock de sécurité et le point de commande, sur une année de l'arène.",
  objectifs: [
    "Calculer une demande moyenne par jour",
    "Calculer la consommation pendant le délai de réapprovisionnement",
    "Calculer un stock de sécurité et un point de commande",
    "Dire s'il faut commander, en comparant le stock au point de commande",
    "Chiffrer un stock qui déborde, et un stock qui manque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_STOCK_DE_SECURITE,
    pourquoi:
      "ce chapitre suit le stock d'un seul produit, acheté à un fournisseur et gardé d'un trimestre à l'autre. Un service ou un repas ne se garde pas, NOVA fabrique à la demande, le bâtiment garde des chantiers en cours, et la boutique suit plusieurs articles qui ont chacun leur stock.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ni trop, ni trop peu",
      notions: ["stock"],
      texte: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `Le stock de ${c.entreprise}, c'est ce qui attend en entrepôt d'être vendu. L'arène le compte en ${c.unites} : au début de l'année, de quoi en servir ${qte(k.annee[0]!.debut)}. Le tableau le suit trimestre après trimestre.`,
          "Un stock peut se tromper de deux façons. S'il manque, le client repart sans rien : c'est une vente perdue. S'il déborde, des marchandises payées dorment en entrepôt : c'est de l'argent bloqué.",
          `Quand on recommande, la marchandise n'arrive pas tout de suite : c'est le délai de réapprovisionnement. L'arène n'en compte pas : ce qui est commandé dans un trimestre arrive dans ce trimestre. Le cours suppose donc le délai qu'annonce le fournisseur de l'arène, « ${k.fournisseur.name} » (${k.annonce}) : ${qte(k.delai)} jours.`,
        ];
      },
      repere: () => "Point de commande = consommation pendant le délai + stock de sécurité.",
      tableau: tableauDeLAnnee,
    },
    {
      id: "par-jour",
      type: "montants",
      titre: "La demande par jour",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Au trimestre ${k.base.trimestre}, les clients ont demandé ${qte(k.base.demande)} ${c.unites} en ${qte(k.jours)} jours. Calculez la demande moyenne par jour, arrondie à l'unité supérieure : en stock, on ne prévoit jamais trop juste.`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          {
            libelle: "Demande par jour",
            attendu: k.parJour,
            calcul: `${qte(k.base.demande)} ÷ ${qte(k.jours)} = ${deux(k.base.demande / k.jours)}, soit ${qte(k.parJour)} en arrondissant au-dessus`,
          },
        ];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [`Chaque jour, ${qte(k.parJour)} ${c.unites} sortent du stock en moyenne : c'est la consommation du stock.`];
      },
    },
    {
      id: "pendant-le-delai",
      type: "montants",
      titre: "Pendant le délai",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Le fournisseur livre ${qte(k.delai)} jours après la commande. Combien de ${c.unites} les clients demandent-ils pendant ce délai, à ${qte(k.parJour)} par jour ?`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [{ libelle: "Consommation pendant le délai", attendu: k.pendantLeDelai, calcul: `${qte(k.parJour)} × ${qte(k.delai)} = ${qte(k.pendantLeDelai)}` }];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `Pendant les ${qte(k.delai)} jours d'attente, ${qte(k.pendantLeDelai)} ${c.unites} sortent du stock. Une commande passée quand il en reste moins, et le stock est vide avant que la livraison n'arrive.`,
        ];
      },
    },
    {
      id: "securite",
      type: "montants",
      titre: "Le stock de sécurité",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Un fournisseur peut livrer en retard, et la demande peut monter. Le cours suppose que ${c.entreprise} garde en plus ${qte(JOURS_DE_SECURITE)} jours de demande : c'est son stock de sécurité. Calculez-le, à ${qte(k.parJour)} ${c.unites} par jour.`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [{ libelle: "Stock de sécurité", attendu: k.securite, calcul: `${qte(k.parJour)} × ${qte(JOURS_DE_SECURITE)} = ${qte(k.securite)}` }];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `Ces ${qte(k.securite)} ${c.unites} ne servent qu'en cas de surprise. Quand le fournisseur livre à l'heure et que la demande ne bouge pas, la livraison arrive avant qu'on y touche.`,
        ];
      },
    },
    {
      id: "point-de-commande",
      type: "montants",
      titre: "Le point de commande",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Le point de commande, c'est le niveau de stock où il faut recommander : la consommation pendant le délai (${qte(k.pendantLeDelai)}), plus le stock de sécurité (${qte(k.securite)}). Calculez-le, en ${c.unites}.`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [{ libelle: "Point de commande", attendu: k.pointDeCommande, calcul: `${qte(k.pendantLeDelai)} + ${qte(k.securite)} = ${qte(k.pointDeCommande)}` }];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `Dès que le stock descend à ${qte(k.pointDeCommande)} ${c.unites}, on passe commande. Pendant le délai, les clients en prennent ${qte(k.pendantLeDelai)} : la livraison arrive quand il reste encore le stock de sécurité, ${qte(k.securite)}.`,
        ];
      },
    },
    {
      id: "commander",
      type: "choix",
      titre: "Commander ou attendre",
      notions: ["stock"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `À la fin du trimestre ${k.base.trimestre}, il reste ${qte(k.base.fin)} ${c.unites} en stock. Le point de commande est de ${qte(k.pointDeCommande)}. Faut-il passer commande ?`;
      },
      options: (c) => {
        const k = stockEtPointDeCommande(c);
        const auDessus = k.base.fin > k.pointDeCommande;
        return [
          {
            texte: "Pas encore : le stock est au-dessus du point de commande",
            juste: auDessus,
            retour: auDessus
              ? `Oui : ${qte(k.base.fin)} > ${qte(k.pointDeCommande)}. À ${qte(k.parJour)} par jour, le stock met encore ${qte(k.joursAvantDeCommander)} jours à descendre jusqu'au point de commande.`
              : `Non : ${qte(k.base.fin)} ≤ ${qte(k.pointDeCommande)}. Le stock est déjà au point de commande : attendre, c'est risquer le stock vide avant la livraison.`,
          },
          {
            texte: "Tout de suite : le stock est sous le point de commande",
            juste: !auDessus,
            retour: auDessus
              ? `Non : ${qte(k.base.fin)} > ${qte(k.pointDeCommande)}. Le stock est encore au-dessus du point de commande : commander maintenant ferait déborder l'entrepôt.`
              : `Oui : ${qte(k.base.fin)} ≤ ${qte(k.pointDeCommande)}. Il faut recommander tout de suite, pour que la livraison arrive avant que le stock ne soit vide.`,
          },
          {
            texte: "Tout de suite : on recommande à chaque fin de trimestre",
            juste: false,
            retour:
              "Non : on recommande quand le stock atteint le point de commande, pas à date fixe. Commander sans regarder le stock, c'est le faire déborder, ou manquer.",
          },
        ];
      },
    },
    {
      id: "deborde",
      type: "montants",
      titre: "Un stock qui déborde",
      notions: ["stock", "stock_rotation"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Combien de jours les ${qte(k.base.fin)} ${c.unites} en stock à la fin du trimestre ${k.base.trimestre} tiendraient-${pronom(c)}s, à ${qte(k.parJour)} par jour ? Arrondissez à l'unité inférieure.`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          {
            libelle: "Jours couverts par le stock",
            attendu: k.couverture,
            calcul: `${qte(k.base.fin)} ÷ ${qte(k.parJour)} = ${deux(k.base.fin / k.parJour)}, soit ${qte(k.couverture)} jours`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          k.couverture > k.joursDuPoint
            ? `Le stock tient ${qte(k.couverture)} jours, quand le point de commande n'en garde que ${qte(k.joursDuPoint)} d'avance (le délai et la sécurité) : il déborde. Ces marchandises ont été achetées et préparées : le bilan de l'arène compte ${eur(k.base.valeurFin)} de stock, de l'argent dépensé et pas encore revenu par les ventes.`
            : `Le stock tient ${qte(k.couverture)} jours, pas plus que les ${qte(k.joursDuPoint)} jours que garde le point de commande (le délai et la sécurité) : il ne déborde pas. Le bilan de l'arène le compte pour ${eur(k.base.valeurFin)}.`,
          `L'arène ne fait pas payer de loyer en plus pour un gros stock : l'entrepôt est dans les charges de structure (${eur(k.base.chargesFixes)} au trimestre ${k.base.trimestre}), le même montant plein ou vide. Ce que coûte un stock en trop, c'est l'argent bloqué dedans.`,
        ];
      },
    },
    {
      id: "manque",
      type: "montants",
      titre: "Un stock qui manque",
      notions: ["stock", "revenue"],
      question: (c) => {
        const k = stockEtPointDeCommande(c);
        return `Au trimestre ${k.pic.trimestre}, les clients demandent ${qte(k.pic.demande)} ${c.unites}. ${c.entreprise} commence le trimestre avec ${qte(k.pic.debut)} ${c.unites} en stock, et en fait entrer ${qte(k.pic.entrees)}. Calculez ce qu'elle a pu servir, ce qui a manqué, puis le chiffre d'affaires perdu, à ${eur(k.pic.prix)} par ${c.unite}.`;
      },
      champs: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          { libelle: "Disponible pour les clients", attendu: k.disponibles, calcul: `${qte(k.pic.debut)} + ${qte(k.pic.entrees)} = ${qte(k.disponibles)}` },
          { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "perdu")}`, attendu: k.perdues, calcul: `${qte(k.pic.demande)} − ${qte(k.disponibles)} = ${qte(k.perdues)}` },
          { libelle: "Chiffre d'affaires perdu", attendu: k.chiffreDAffairesPerdu, calcul: `${qte(k.perdues)} × ${eur(k.pic.prix)} = ${eur(k.chiffreDAffairesPerdu)}` },
        ];
      },
      explication: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `${k.pic.fin === 0 ? "Le stock s'est vidé avant la fin du trimestre" : "Le stock n'a pas suffi"} : ${qte(k.perdues)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}. L'arène sert alors chaque clientèle au même taux, et ce qui manque est perdu : ${eur(k.chiffreDAffairesPerdu)} de chiffre d'affaires en moins.`,
          "Le point de commande se calcule sur la demande. Quand la demande change, il se recalcule.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["stock"],
      texte: (c) => {
        const k = stockEtPointDeCommande(c);
        return [
          `À ${qte(k.parJour)} ${c.unites} par jour, avec un délai de ${qte(k.delai)} jours et ${qte(JOURS_DE_SECURITE)} jours de sécurité, ${c.entreprise} recommande quand son stock descend à ${qte(k.pointDeCommande)}.`,
          `Trop de stock bloque de l'argent ; trop peu fait perdre des ventes : ${qte(k.perdues)} ${c.unites} au trimestre ${k.pic.trimestre} dans l'arène. Le point de commande se tient entre les deux, et il se recalcule quand la demande change.`,
        ];
      },
      repere: () => "Consommation pendant le délai = demande par jour × délai. Stock de sécurité = demande par jour × jours de sécurité.",
    },
  ],
};
