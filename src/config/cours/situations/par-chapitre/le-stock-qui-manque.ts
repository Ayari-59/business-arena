import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { arrete } from "../../chapitres/les-stocks";
import { dateDuCours as date } from "../../dates";
import { auCentime } from "../../monde/amortissement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES STOCKS » : LE STOCK QUI MANQUE (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le trimestre est celui du cas figé de l'entreprise
 * (monde/cas-des-entreprises.ts), valorisé par le modèle du cours (monde/stock.ts) à travers
 * l'arrêté du chapitre (`arrete`). Il se joue chez MAILLE & CO et PIXEL & CO, comme le chapitre.
 *
 * Le comptable annonce, après l'inventaire de fin de trimestre, une marge commerciale plus faible que
 * ce que les achats et les ventes laissaient attendre. Le gérant demande s'il a perdu de la
 * marchandise, combien, et si c'est normal. L'élève calcule le stock et la marge théoriques, puis
 * remonte À REBOURS de la marge annoncée au stock compté et aux unités manquantes ; il passe les deux
 * écritures d'inventaire avec le stock compté ; un curseur lui montre jusqu'où la démarque reste dans
 * la norme du commerce ; et il rend un jugement, la démarque chiffrée au coût d'achat (pas au prix de
 * vente, pas toutes taxes comprises) et située face à cette norme.
 *
 * LES TROIS TEMPS : le cas est autonome (le livrable et les documents, sans l'ordre des calculs) ;
 * expert par le calcul à rebours et le curseur de la norme.
 */

/**
 * La démarque trouvée au comptage : 2 % du stock calculé, arrondi à l'unité. C'est l'ordre de grandeur
 * courant des pertes inconnues (vol, casse, erreurs) sur un stock de détail.
 */
export const TAUX_DE_DEMARQUE = 0.02;

/**
 * La norme du secteur à laquelle le gérant se compare, hypothèse du cours : une démarque d'au plus 1 %
 * du chiffre d'affaires hors taxes, l'ordre de grandeur que publient les enquêtes du commerce de détail.
 */
export const DEMARQUE_DU_SECTEUR = 0.01;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les chiffres de la réponse, calculés une fois du stock du trimestre. */
export function stockQuiManque(c: Cas) {
  const a = arrete(c);
  // Le stock théorique : ce que les entrées et les sorties laissent, celui du chapitre.
  const theorique = a.final.quantite;
  const manquantes = Math.round(theorique * TAUX_DE_DEMARQUE);
  const comptees = theorique - manquantes;
  // Le comptage fait foi : le stock final est celui qu'on a trouvé, au coût moyen pondéré.
  const valeurComptee = auCentime(comptees * a.cump);
  const coutDesVendues = auCentime(a.initial.valeur + a.achats.ht - valeurComptee);
  const marge = auCentime(a.ventes.ht - coutDesVendues);
  const demarque = auCentime(a.final.valeur - valeurComptee);
  const norme = auCentime(a.ventes.ht * DEMARQUE_DU_SECTEUR);
  // Le curseur : le plus grand nombre d'unités manquantes dont le coût tient dans la norme.
  const limite = Math.floor(norme / a.cump + 1e-9);
  return {
    ...a,
    theorique,
    manquantes,
    comptees,
    valeurComptee,
    coutDesVendues,
    /** La marge que les achats et les ventes laissaient attendre, sans démarque : celle du chapitre. */
    margeTheorique: a.marge,
    /** La marge que le comptable annonce : celle du stock compté. */
    margeAnnoncee: marge,
    demarque,
    partDuChiffre: demarque / a.ventes.ht,
    norme,
    limite,
    maxDuCurseur: Math.max(10, Math.ceil((2 * limite) / 10) * 10),
    dansLaNorme: demarque <= norme,
    // Les erreurs classiques : compter les unités perdues au prix de vente, ou TVA comprise.
    auPrixDeVente: auCentime(manquantes * a.ventes.prixUnitaire),
    tvaComprise: auCentime(demarque * (1 + a.achats.tauxTva)),
  };
}

export const LE_STOCK_QUI_MANQUE: Situation = {
  code: "le-stock-qui-manque",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["les-stocks"],
  commanditaire: "Le gérant",
  titre: "Le stock qui manque à l'inventaire",
  accroche:
    "Après l'inventaire, le comptable annonce une marge plus faible que prévu. Le gérant veut savoir s'il manque de la marchandise, combien, et si c'est normal pour un commerce.",
  objectifs: [
    "Calculer le stock et la marge théoriques d'un trimestre au coût moyen pondéré",
    "Remonter à rebours d'une marge annoncée au stock compté et aux unités manquantes",
    "Passer les écritures d'inventaire avec le stock compté",
    "Chiffrer la démarque au coût d'achat et la situer face à la norme du secteur",
  ],
  libre: false,
  entreprises: {
    codes: ["boutique", "ecommerce"],
    pourquoi:
      "dans la simulation du cours, elle ne garde pas de marchandises en stock d'un trimestre à l'autre : un service ne se stocke pas, un produit frais non plus, et ce qu'une entreprise fabrique ou construit n'est pas une marchandise achetée pour être revendue.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = stockQuiManque(c);
        return [
          `« Après l'inventaire du ${date(r.fin)}, notre comptable annonce une marge commerciale de ${eur(r.margeAnnoncee)} pour le ${r.trimestreEcrit}. D'après nos achats et nos ventes, j'attendais davantage. Avons-nous perdu de la marchandise ? Combien d'unités, combien d'euros de marge, et est-ce normal pour un commerce comme le nôtre ? »`,
          "Pas de cours cette fois : vous avez les chiffres du trimestre, la marge annoncée et la norme du secteur, et la méthode est celle du chapitre. À vous de l'enchaîner. Le stock se valorise au coût moyen pondéré du trimestre, arrondi au centime, en inventaire intermittent.",
        ];
      },
      tableau: (c) => {
        const r = stockQuiManque(c);
        return {
          titre: `Le ${r.trimestreEcrit} · ${c.entreprise}`,
          colonnes: ["Unités", "Hors taxes"],
          lignes: [
            { libelle: `Stock au ${date(r.debut)}`, valeurs: [qte(r.initial.quantite), eur(r.initial.valeur)] },
            { libelle: `Achats du trimestre, à ${eur(r.achats.prixUnitaire)} l'unité`, valeurs: [qte(r.achats.quantite), eur(r.achats.ht)] },
            { libelle: "Ventes du trimestre", valeurs: [qte(r.vendues), eur(r.ventes.ht)] },
            { libelle: "Marge commerciale annoncée, après l'inventaire", valeurs: ["", eur(r.margeAnnoncee)] },
            { libelle: "Démarque habituelle du secteur, en part du chiffre d'affaires", valeurs: ["", `au plus ${pct(DEMARQUE_DU_SECTEUR)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge que les chiffres laissaient attendre, le stock réellement compté et les unités manquantes, les deux écritures d'inventaire, et votre réponse au gérant, chiffrée et située face à la norme.",
    },
    {
      id: "le-theorique",
      type: "montants",
      titre: "Ce que les chiffres laissaient attendre",
      notions: ["stock", "weighted_average_cost"],
      question: () => "Sans démarque, que resterait-il en rayon, à quelle valeur, et quelle marge le trimestre aurait-il dégagée ?",
      champs: (c) => {
        const r = stockQuiManque(c);
        return [
          { libelle: "Stock théorique, en unités", attendu: r.theorique, calcul: `${qte(r.initial.quantite)} + ${qte(r.achats.quantite)} − ${qte(r.vendues)} = ${qte(r.theorique)} unités` },
          {
            libelle: "Coût moyen pondéré d'une unité",
            attendu: r.cump,
            calcul: `(${eur(r.initial.valeur)} + ${eur(r.achats.ht)}) ÷ (${qte(r.initial.quantite)} + ${qte(r.achats.quantite)}) = ${eur(r.cump)}`,
          },
          { libelle: "Valeur du stock théorique", attendu: r.final.valeur, calcul: `${qte(r.theorique)} × ${eur(r.cump)} = ${eur(r.final.valeur)}` },
          {
            libelle: "Marge théorique",
            attendu: r.margeTheorique,
            calcul: `${eur(r.ventes.ht)} − (${eur(r.initial.valeur)} + ${eur(r.achats.ht)} − ${eur(r.final.valeur)}) = ${eur(r.margeTheorique)}`,
          },
        ];
      },
      explication: (c) => {
        const r = stockQuiManque(c);
        return [`Sans démarque, la marge aurait été de ${eur(r.margeTheorique)}. Le comptable en annonce ${eur(r.margeAnnoncee)} : ${eur(auCentime(r.margeTheorique - r.margeAnnoncee))} de moins. Reste à savoir d'où vient l'écart.`];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Remonter de la marge au stock compté",
      notions: ["stock", "margin_rates"],
      question: () =>
        "La marge annoncée repose sur le stock que l'inventaire a compté. Remontez-y : le coût d'achat des marchandises vendues qu'elle suppose, la valeur du stock compté, les unités comptées au coût moyen, puis les unités manquantes.",
      champs: (c) => {
        const r = stockQuiManque(c);
        return [
          { libelle: "Coût d'achat des marchandises vendues, d'après la marge annoncée", attendu: r.coutDesVendues, calcul: `${eur(r.ventes.ht)} − ${eur(r.margeAnnoncee)} = ${eur(r.coutDesVendues)}` },
          { libelle: "Valeur du stock compté", attendu: r.valeurComptee, calcul: `${eur(r.initial.valeur)} + ${eur(r.achats.ht)} − ${eur(r.coutDesVendues)} = ${eur(r.valeurComptee)}` },
          { libelle: "Unités comptées", attendu: r.comptees, calcul: `${eur(r.valeurComptee)} ÷ ${eur(r.cump)} = ${qte(r.comptees)} unités` },
          { libelle: "Unités manquantes", attendu: r.manquantes, calcul: `${qte(r.theorique)} − ${qte(r.comptees)} = ${qte(r.manquantes)} unités` },
        ];
      },
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `Il manque ${qte(r.manquantes)} unités sur ${qte(r.theorique)}. C'est le comptage qui fait foi : le stock final vaut ${eur(r.valeurComptee)}, pas les ${eur(r.final.valeur)} que les calculs prévoyaient, et l'écart de marge est exactement leur coût d'achat.`,
        ];
      },
    },
    {
      id: "annulation-stock-initial",
      type: "ecriture",
      titre: "Le stock initial s'annule",
      notions: ["stock"],
      evenement: (c) => {
        const r = stockQuiManque(c);
        return `Le ${date(r.fin)}, première écriture d'inventaire : le stock du ${date(r.debut)}, ${eur(r.initial.valeur)}, sort du bilan.`;
      },
      ecriture: (c) => {
        const r = stockQuiManque(c);
        return {
          date: date(r.fin),
          libelle: "Annulation du stock initial",
          lignes: [
            { role: "la variation des stocks, en charge", compte: "6037", acceptes: ["603"], sens: "debit", montant: r.initial.valeur, indice: "la valeur du stock initial" },
            { role: "le stock initial qui sort du bilan", compte: "37", acceptes: ["370"], sens: "credit", montant: r.initial.valeur, indice: "la valeur du stock initial" },
          ],
        };
      },
      indices: () => ["Le stock de marchandises (classe 3) se vide : il passe au crédit.", "En face, une charge : la variation des stocks de marchandises, à côté des achats (603)."],
      explication: (c) => [`Le stock du début entre dans les charges du trimestre : ${eur(stockQuiManque(c).initial.valeur)} au débit du 6037.`],
      vue: "resultat",
    },
    {
      id: "constatation-stock-compte",
      type: "ecriture",
      titre: "Le stock compté entre au bilan",
      notions: ["stock"],
      evenement: (c) => `Deuxième écriture : constatez le stock final du ${date(stockQuiManque(c).fin)}, celui que l'inventaire a trouvé.`,
      ecriture: (c) => {
        const r = stockQuiManque(c);
        return {
          date: date(r.fin),
          libelle: "Constatation du stock final compté",
          lignes: [
            { role: "le stock compté qui entre au bilan", compte: "37", acceptes: ["370"], sens: "debit", montant: r.valeurComptee, indice: "la valeur du stock compté" },
            { role: "la variation des stocks, en moins des charges", compte: "6037", acceptes: ["603"], sens: "credit", montant: r.valeurComptee, indice: "la valeur du stock compté" },
          ],
        };
      },
      indices: () => ["C'est l'écriture inverse de la précédente, pour le stock final.", "Le montant : pas le stock que les calculs prévoyaient, mais les unités comptées, au coût moyen pondéré."],
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `Les unités disparues ne sont plus à l'actif : elles restent dans les charges du trimestre, avec celles qu'on a vendues. Le 6037 ne retire des charges que les ${eur(r.valeurComptee)} vraiment en rayon, et le compte de résultat retrouve la marge annoncée, ${eur(r.margeAnnoncee)}.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "la-norme-du-secteur",
      type: "curseur",
      titre: "La démarque face à la norme",
      notions: ["stock", "markdown"],
      question: (c) => {
        const r = stockQuiManque(c);
        return `Faites varier les unités manquantes, de 0 à ${qte(r.maxDuCurseur)}. Une droite donne la norme du secteur, ${pct(DEMARQUE_DU_SECTEUR)} des ventes hors taxes, l'autre le coût de la démarque, les unités manquantes au coût moyen. Placez le curseur sur le plus grand nombre d'unités manquantes qui reste dans la norme, puis validez.`;
      },
      grandeur: () => ({ libelle: "Unités manquantes à l'inventaire", unite: "unités" }),
      sens: "plus-grande",
      cible: (c) => {
        const r = stockQuiManque(c);
        return { attendu: r.limite, min: 0, max: r.maxDuCurseur };
      },
      zones: ["Dans la norme du secteur", "Au-delà de la norme"],
      rates: () => ({
        dessous: "La démarque reste encore dans la norme un peu plus loin : cherchez le plus grand nombre d'unités.",
        dessus: "À cette position, la démarque dépasse déjà la norme du secteur.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, m) => {
        const r = stockQuiManque(c);
        const cout = auCentime(m * r.cump);
        return [
          { libelle: "Coût de la démarque", montant: cout },
          { libelle: "Norme du secteur", montant: r.norme },
          { libelle: "Marge commerciale après démarque", montant: auCentime(r.margeTheorique - cout), fort: true },
        ];
      },
      droites: (c) => {
        const r = stockQuiManque(c);
        return { produit: () => r.norme, cout: (m) => m * r.cump, libelles: ["Norme du secteur", "Coût de la démarque"] };
      },
      explication: (c) => {
        const r = stockQuiManque(c);
        return [
          `La norme tient jusqu'à ${qte(r.limite)} unités manquantes, ${eur(r.norme)} au coût d'achat. ${c.entreprise} en a perdu ${qte(r.manquantes)}, ${eur(r.demarque)}, soit ${pct(r.partDuChiffre)} des ventes : ${r.dansLaNorme ? "dans la norme" : "au-delà de la norme"}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = stockQuiManque(c);
        const verdict = r.dansLaNorme ? "dans la norme du secteur" : "au-delà de la norme du secteur";
        const inverse = r.dansLaNorme ? "au-delà de la norme du secteur" : "dans la norme du secteur";
        return [
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.demarque)} de marge, ${verdict}`,
            juste: true,
            retour: `Oui : ${qte(r.theorique)} unités attendues, ${qte(r.comptees)} comptées. Chacune a coûté ${eur(r.cump)} au coût moyen pondéré : ${eur(r.demarque)} en moins sur la marge, ${pct(r.partDuChiffre)} des ventes, face à une norme de ${pct(DEMARQUE_DU_SECTEUR)}. ${r.dansLaNorme ? "Rien d'alarmant, mais une démarque se suit d'un inventaire à l'autre." : "Il faut en chercher la cause : vol, casse, erreurs de réception."}`,
          },
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.auPrixDeVente)} de marge perdue au prix de vente, ${r.auPrixDeVente <= r.norme ? "dans la norme" : "au-delà de la norme"}`,
            juste: false,
            retour: `Non : la marge perd ce que les unités ont coûté, pas ce qu'elles auraient rapporté. Elles ne figuraient pas dans les ventes ; elles sortent du stock à ${eur(r.cump)} l'unité : ${eur(r.demarque)}.`,
          },
          {
            texte: `Il manque ${qte(r.manquantes)} unités : ${eur(r.tvaComprise)} de marge perdue, TVA comprise, ${inverse}`,
            juste: false,
            retour: `Non : la TVA payée au fournisseur se déduit, elle n'est pas un coût, et le stock se compte hors taxes : ${eur(r.demarque)}, ${verdict}.`,
          },
          {
            texte: "Rien ne manque : l'écart vient de la marge annoncée, un écart de stock ne touche que le bilan",
            juste: false,
            retour: `Non : le stock final vient en moins des charges. Plus petit, il en retire moins, et le coût d'achat des marchandises vendues monte de ${eur(r.demarque)}.`,
          },
        ];
      },
    },
  ],
};
