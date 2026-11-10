import { arrondi2 as auCentime, eur, nombreAuCentieme, pct, taux2 } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { indicateursDuPointDeVente } from "../../chapitres/indicateurs-du-point-de-vente";
import { ENTREPRISES_DU_POINT_DE_VENTE } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES INDICATEURS DU POINT DE VENTE » : MOINS DE CLIENTS LE MOIS
 * PROCHAIN (BTS MCO, palier 2).
 *
 * Des travaux vont fermer la rue de la boutique pendant un mois : le gérant attend 15 % d'entrées en
 * moins. Il veut savoir ce que cela retire au chiffre d'affaires encaissé en caisse (les commandes des
 * comités d'entreprise, hors caisse, ne dépendent pas de la rue), et ce qu'il faudrait pour le garder.
 * L'élève refait seul les indicateurs du chapitre, applique la baisse au trafic (la transformation
 * ne bouge pas), puis remonte à rebours : le panier qui compense, l'indice de vente qu'il exige au
 * même prix moyen, et, au curseur, la transformation qui compenserait à la place du panier. Le piège
 * est celui des pourcentages : perdre 15 % des visiteurs ne se rattrape pas avec 15 % de plus sur un
 * autre levier, car les leviers se multiplient. La réponse demande un jugement : fixer à l'équipe
 * le bon objectif.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), chez
 * MAILLE & CO seule : ses chiffres sont ceux de `indicateursDuPointDeVente`. La baisse des entrées
 * est une hypothèse de l'histoire.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la transformation et la hausse du panier se donnent à deux
 * décimales (au dixième, avant), sur le panier et le prix moyen au centime ; les entrées et les
 * passages sont des quantités, écrites à deux décimales puis arrondies à l'unité ; l'indice de vente
 * est une grandeur au centième. Les chiffres d'affaires se calculent sur le panier arrondi, au centime
 * (à cinq euros près, avant).
 */

/**
 * LA BAISSE DES ENTRÉES ATTENDUE, hypothèse du cas : 15 % du trafic de janvier. C'est l'ordre de
 * grandeur de ce que perd un commerce de centre-ville quand sa rue est fermée par des travaux : une
 * baisse nette, pas un effondrement. La simulation garde la transformation de janvier.
 */
export const BAISSE_DES_ENTREES = 0.15;

/** Les bornes du curseur de la transformation, en passages pour 1 000 entrées. */
export const TRANSFORMATION_DU_CURSEUR = { min: 240, max: 320 } as const;

const qte = nombreAuCentieme;
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Verdict = "il-faut-plus-que-la-baisse" | "la-baisse-suffit";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function moinsDeClients(c: Pick<Cas, "code">) {
  // Les indicateurs du chapitre, repris à deux décimales : la transformation (au dixième au chapitre),
  // le panier et le prix moyen au centime. Chaque ligne part de la ligne arrondie.
  const ki = indicateursDuPointDeVente(c);
  const k = { ...ki, transformation: taux2(ki.m.tickets, ki.m.entrees) };
  const m = k.m;
  const entreesCalculees = auCentime(m.entrees * (1 - BAISSE_DES_ENTREES));
  const entreesApres = Math.round(entreesCalculees);
  const passagesCalcules = auCentime((entreesApres * k.transformation) / 100);
  const passagesApres = Math.round(passagesCalcules);
  const caSansAction = auCentime(passagesApres * k.panier);
  const panierVise = auCentime(m.chiffreDAffairesEnCaisse / passagesApres);
  const hausseDuPanier = auCentime((panierVise / k.panier - 1) * 100);
  // La transformation qui compense à la place du panier, en passages pour 1 000 entrées.
  const transformationVisee = Math.ceil((m.chiffreDAffairesEnCaisse / (entreesApres * m.panierMoyen)) * 1_000 - 1e-9);
  // Les erreurs classiques : rattraper 15 % de visiteurs en moins avec 15 % de plus sur un autre levier.
  const panierFaux = auCentime(k.panier * (1 + BAISSE_DES_ENTREES));
  const verdict: Verdict = hausseDuPanier > BAISSE_DES_ENTREES * 100 ? "il-faut-plus-que-la-baisse" : "la-baisse-suffit";
  return {
    k,
    entreesCalculees,
    entreesApres,
    passagesCalcules,
    passagesApres,
    caSansAction,
    caPerdu: auCentime(m.chiffreDAffairesEnCaisse - caSansAction),
    panierVise,
    hausseDuPanier,
    indiceVise: auCentime(panierVise / k.prixMoyen),
    transformationVisee,
    panierFaux,
    caFaux: auCentime(passagesApres * panierFaux),
    transformationFausse: auCentime(k.transformation * (1 + BAISSE_DES_ENTREES)),
    verdict,
  };
}

export const MOINS_DE_CLIENTS_LE_MOIS_PROCHAIN: Situation = {
  code: "moins-de-clients-le-mois-prochain",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["indicateurs-du-point-de-vente"],
  commanditaire: "Le gérant",
  titre: "Moins de clients le mois prochain",
  accroche:
    "Des travaux vont fermer la rue pendant un mois. Le gérant veut savoir ce que le chiffre d'affaires y perdra, et quel objectif fixer à l'équipe pour le garder.",
  objectifs: [
    "Calculer la transformation et le panier moyen du mois",
    "Chiffrer l'effet d'une baisse du trafic sur les passages et le chiffre d'affaires",
    "Retrouver à rebours le panier, l'indice de vente ou la transformation qui compensent",
    "Répondre au gérant sans tomber dans le piège des pourcentages",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « Les indicateurs du point de vente », qui se joue dans la boutique du cours, MAILLE & CO.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      tableau: (c) => {
        const { k } = moinsDeClients(c);
        return {
          titre: `${k.f.entreprise} en ${k.f.moisDeReference}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Entrées comptées à la porte", valeurs: [qte(k.m.entrees)] },
            { libelle: "Passages en caisse", valeurs: [qte(k.m.tickets)] },
            { libelle: "Articles vendus en caisse", valeurs: [qte(k.m.articlesEnCaisse)] },
            { libelle: "Chiffre d'affaires encaissé hors taxes", valeurs: [eur(k.m.chiffreDAffairesEnCaisse)] },
            { libelle: "Commandes des comités, hors caisse", valeurs: [eur(k.m.commandes.chiffreDAffaires)] },
            { libelle: "Baisse des entrées attendue pendant les travaux", valeurs: [pct(BAISSE_DES_ENTREES * 100)] },
          ],
        };
      },
      texte: (c) => {
        const { k } = moinsDeClients(c);
        return [
          `« Le mois prochain, des travaux vont fermer notre rue à la circulation. Je m'attends à ${pct(BAISSE_DES_ENTREES * 100)} d'entrées en moins. Je veux savoir ce que cela retirerait à notre chiffre d'affaires si rien ne change, et quel objectif donner à l'équipe pour garder le chiffre d'affaires en caisse de ${k.f.moisDeReference}. Les commandes des comités d'entreprise, elles, ne dépendent pas de la rue. »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. La simulation du cours suppose que les visiteurs qui viennent encore achètent comme en janvier : la transformation, l'indice de vente et le prix moyen ne bougent pas d'eux-mêmes.",
        ];
      },
      repere: () =>
        "À rendre : la transformation et le panier de janvier, les passages et le chiffre d'affaires du mois des travaux, ce qui compenserait la baisse, et votre réponse.",
    },
    {
      id: "le-mois",
      type: "montants",
      titre: "Le mois de référence",
      notions: ["conversion_rate", "average_basket"],
      question: () => "Calculez le taux de transformation du mois, à deux décimales, son panier moyen et son prix moyen d'un article.",
      champs: (c) => {
        const { k } = moinsDeClients(c);
        return [
          { libelle: "Taux de transformation (%)", attendu: k.transformation, calcul: `${qte(k.m.tickets)} ÷ ${qte(k.m.entrees)} × 100 = ${pct(k.transformation)}` },
          { libelle: "Panier moyen", attendu: k.panier, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} ÷ ${qte(k.m.tickets)} = ${eur(k.panier)}` },
          { libelle: "Prix moyen d'un article", attendu: k.prixMoyen, calcul: `${eur(k.m.chiffreDAffairesEnCaisse)} ÷ ${qte(k.m.articlesEnCaisse)} = ${eur(k.prixMoyen)}` },
        ];
      },
      explication: (c) => {
        const { k } = moinsDeClients(c);
        return [`En ${k.f.moisDeReference}, ${pct(k.transformation)} des visiteurs sont passés en caisse, pour ${eur(k.panier)} en moyenne. Le chiffre d'affaires, c'est des visiteurs, transformés, multipliés par un panier.`];
      },
    },
    {
      id: "moins-de-clients",
      type: "montants",
      titre: "Avec moins de visiteurs",
      notions: ["conversion_rate", "average_basket", "revenue"],
      question: () =>
        "Pendant les travaux, combien d'entrées resteraient (à l'unité) ? Combien de passages en caisse, à la même transformation (à l'unité) ? Quel chiffre d'affaires au même panier, et combien la boutique perdrait-elle ?",
      champs: (c) => {
        const x = moinsDeClients(c);
        const m = x.k.m;
        return [
          { libelle: "Entrées pendant les travaux", nature: "quantite", attendu: x.entreesApres, calcul: `${qte(m.entrees)} × (1 − ${pct(BAISSE_DES_ENTREES * 100)}) = ${qte(x.entreesCalculees)}, soit ${qte(x.entreesApres)} entrées à l'unité la plus proche` },
          { libelle: "Passages en caisse pendant les travaux", nature: "quantite", attendu: x.passagesApres, calcul: `${qte(x.entreesApres)} × ${pct(x.k.transformation)} = ${qte(x.passagesCalcules)}, soit ${qte(x.passagesApres)} passages à l'unité la plus proche` },
          // Le panier arrondi au centime que l'élève a gardé déplace le chiffre d'affaires de quelques euros.
          { libelle: "Chiffre d'affaires au même panier", attendu: x.caSansAction, calcul: `${qte(x.passagesApres)} × ${eur(x.k.panier)} = ${eur(x.caSansAction)}` },
          { libelle: "Chiffre d'affaires perdu", attendu: x.caPerdu, calcul: `${eur(m.chiffreDAffairesEnCaisse)} − ${eur(x.caSansAction)} = ${eur(x.caPerdu)}` },
        ];
      },
      explication: (c) => {
        const x = moinsDeClients(c);
        return [
          `Sans rien changer, ${x.k.f.entreprise} perdrait ${eur(x.caPerdu)} dans le mois : les visiteurs qui ne viennent pas emportent leur panier avec eux. La transformation, elle, ne bouge pas : c'est un rapport, pas un nombre de clients.`,
        ];
      },
    },
    {
      id: "le-panier-qui-compense",
      type: "montants",
      titre: "Le panier qui compense",
      notions: ["average_basket"],
      question: () =>
        "Remontez à rebours. Pour garder le chiffre d'affaires en caisse de janvier avec les passages qui restent, quel panier moyen faudrait-il ? De combien devrait-il monter, en pourcentage à deux décimales ? Et, au même prix moyen d'un article, quel indice de vente faudrait-il, au centième ?",
      champs: (c) => {
        const x = moinsDeClients(c);
        const m = x.k.m;
        return [
          { libelle: "Panier moyen nécessaire", attendu: x.panierVise, calcul: `${eur(m.chiffreDAffairesEnCaisse)} ÷ ${qte(x.passagesApres)} = ${eur(x.panierVise)}` },
          { libelle: "Hausse du panier (%)", attendu: x.hausseDuPanier, calcul: `(${eur(x.panierVise)} ÷ ${eur(x.k.panier)} − 1) × 100 = ${pct(x.hausseDuPanier)}` },
          { libelle: "Indice de vente nécessaire", nature: "grandeur", attendu: x.indiceVise, calcul: `${eur(x.panierVise)} ÷ ${eur(x.k.prixMoyen)} = ${qte(x.indiceVise)} articles par passage` },
        ];
      },
      explication: (c) => {
        const x = moinsDeClients(c);
        return [
          `Perdre ${pct(BAISSE_DES_ENTREES * 100)} des visiteurs demande ${pct(x.hausseDuPanier)} de panier en plus : le même chiffre d'affaires se partage entre moins de passages. Au même prix moyen, chaque client devrait prendre ${deux(x.indiceVise)} articles au lieu de ${deux(x.k.indice)} : le conseil et l'article complémentaire deviennent le chantier du mois.`,
        ];
      },
    },
    {
      id: "la-transformation-au-curseur",
      type: "curseur",
      titre: "La transformation qui compenserait",
      notions: ["conversion_rate", "revenue"],
      question: (c) => {
        const x = moinsDeClients(c);
        return `Autre voie : garder le panier de janvier (${eur(x.k.panier)}) et transformer davantage les ${qte(x.entreesApres)} visiteurs. Faites varier les passages en caisse pour 1 000 entrées : combien en faudrait-il, au moins, pour garder ${eur(x.k.m.chiffreDAffairesEnCaisse)} ? Placez le curseur, puis validez.`;
      },
      grandeur: () => ({ libelle: "Passages en caisse pour 1 000 entrées", unite: "passages" }),
      cible: (c) => ({ attendu: moinsDeClients(c).transformationVisee, min: TRANSFORMATION_DU_CURSEUR.min, max: TRANSFORMATION_DU_CURSEUR.max }),
      zones: ["Chiffre d'affaires de janvier gardé", "Chiffre d'affaires en baisse"],
      rates: () => ({
        dessous: "À cette transformation, le chiffre d'affaires reste sous celui de janvier.",
        dessus: "Une transformation plus basse suffit déjà : cherchez la plus petite.",
      }),
      montrer: "Montrer la transformation",
      lecture: (c, t) => {
        const x = moinsDeClients(c);
        const ca = auCentime(((x.entreesApres * t) / 1_000) * x.k.m.panierMoyen);
        return [
          { libelle: "Chiffre d'affaires en caisse du mois des travaux", montant: ca, fort: true },
          { libelle: "Chiffre d'affaires en caisse de janvier", montant: x.k.m.chiffreDAffairesEnCaisse },
          { libelle: "Écart sur janvier", montant: auCentime(ca - x.k.m.chiffreDAffairesEnCaisse) },
        ];
      },
      droites: (c) => {
        const x = moinsDeClients(c);
        return {
          produit: (t) => ((x.entreesApres * t) / 1_000) * x.k.m.panierMoyen,
          cout: () => x.k.m.chiffreDAffairesEnCaisse,
          libelles: ["Chiffre d'affaires en caisse du mois des travaux", "Chiffre d'affaires en caisse de janvier"],
        };
      },
      explication: (c) => {
        const x = moinsDeClients(c);
        return [
          `Il faudrait ${qte(x.transformationVisee)} passages pour 1 000 entrées, une transformation de ${pct(x.transformationVisee / 10)} au lieu de ${pct(x.k.transformation)}. C'est la même hausse que pour le panier, à l'arrondi près : quel que soit le levier, rattraper ${pct(BAISSE_DES_ENTREES * 100)} de visiteurs perdus demande de multiplier un autre levier par 1 ÷ (1 − ${pct(BAISSE_DES_ENTREES * 100)}).`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quel objectif proposez-vous au gérant pour le mois des travaux ?",
      options: (c) => {
        const x = moinsDeClients(c);
        const baisse = pct(BAISSE_DES_ENTREES * 100);
        return [
          {
            texte: `${pct(x.hausseDuPanier)} de panier en plus, pas ${baisse} : ${eur(x.panierVise)}`,
            juste: x.verdict === "il-faut-plus-que-la-baisse",
            retour: `Oui : ${eur(x.k.m.chiffreDAffairesEnCaisse)} à faire avec ${qte(x.passagesApres)} passages, c'est ${eur(x.panierVise)} par passage, ${deux(x.indiceVise)} articles au prix moyen de janvier. Sans rien faire, la boutique perdrait ${eur(x.caPerdu)}. L'autre voie, ${pct(x.transformationVisee / 10)} de transformation, demande la même hausse.`,
          },
          {
            texte: `Un panier de ${eur(x.panierFaux)}, ${baisse} de plus, comme le trafic perdu`,
            juste: false,
            retour: `Non : ${qte(x.passagesApres)} passages à ${eur(x.panierFaux)} ne font que ${eur(x.caFaux)}. La baisse se calcule sur le trafic de janvier, la hausse sur le panier de janvier : les leviers se multiplient, et ${baisse} de moins demande ${pct(x.hausseDuPanier)} de plus.`,
          },
          {
            texte: `Une transformation de ${pct(x.transformationFausse)}, ${baisse} au-dessus de janvier`,
            juste: false,
            retour: `Non : c'est le même piège, sur un autre levier. Il faudrait ${pct(x.transformationVisee / 10)} de transformation pour garder le chiffre d'affaires.`,
          },
          {
            texte: "Aucun : la transformation ne bouge pas, le chiffre d'affaires non plus",
            juste: false,
            retour: `Non : la transformation est un rapport, elle ne dit rien du nombre de visiteurs. À la même transformation et au même panier, le mois des travaux fait ${eur(x.caSansAction)}, ${eur(x.caPerdu)} de moins.`,
          },
        ];
      },
    },
  ],
};
