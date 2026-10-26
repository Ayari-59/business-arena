import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { indicateurs } from "../../chapitres/indicateurs-du-point-de-vente";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES INDICATEURS DU POINT DE VENTE » : MOINS DE CLIENTS LE
 * MOIS PROCHAIN (BTS MCO, palier 2).
 *
 * Le gérant sait que le mois prochain amènera moins de clients. Il veut savoir ce que cela
 * retire au chiffre d'affaires, et quel panier moyen il faudrait pour le garder. L'élève
 * refait seul les calculs du chapitre (le chiffre d'affaires, les clients, le panier), puis
 * les applique à un mois plus creux.
 *
 * Le cas est neuf par sa question : le chapitre cherche les leviers d'une hausse ; ici, la
 * fréquentation baisse et le panier doit compenser. Le piège est celui des pourcentages :
 * perdre 15 % des clients ne se rattrape pas avec 15 % de panier en plus. Les chiffres du
 * mois sont ceux du chapitre (`indicateurs`).
 */

/**
 * La baisse de fréquentation attendue : 15 % des clients. C'est l'ordre de grandeur de ce
 * que perd un commerce quand sa rue est fermée par des travaux, ou quand une grande
 * enseigne arrive sur son créneau : une baisse nette, pas un effondrement.
 */
export const BAISSE_DE_FREQUENTATION = 0.15;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Pourquoi les clients seront moins nombreux, dans les mots du métier. */
const cause = (c: Cas) =>
  c.code === "ecommerce"
    ? "une grande enseigne lance son site sur notre créneau"
    : "des travaux vont fermer notre rue à la circulation pendant tout le mois";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function moinsDeClients(c: Cas) {
  const k = indicateurs(c);
  const clientsApres = Math.round(k.clients * (1 - BAISSE_DE_FREQUENTATION));
  const caSansAction = auCentime(clientsApres * k.panier);
  const panierVise = auCentime(k.chiffreDAffaires / clientsApres);
  // L'erreur classique : rattraper 15 % de clients en moins avec 15 % de panier en plus.
  const panierFaux = auCentime(k.panier * (1 + BAISSE_DE_FREQUENTATION));
  return {
    ...k,
    clientsApres,
    caSansAction,
    caPerdu: auCentime(k.chiffreDAffaires - caSansAction),
    panierVise,
    hausseDuPanier: auDixieme((panierVise / k.panier - 1) * 100),
    panierFaux,
    caFaux: auCentime(clientsApres * panierFaux),
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
    "Le mois prochain amènera moins de clients. Le gérant veut savoir ce que le chiffre d'affaires y perdra, et quel panier moyen il faudrait pour le garder.",
  objectifs: [
    "Calculer le chiffre d'affaires, le nombre de clients et le panier moyen du mois",
    "Chiffrer l'effet d'une baisse de fréquentation sur le chiffre d'affaires",
    "Calculer le panier moyen qui compense une perte de clients",
    "Répondre au gérant sans tomber dans le piège des pourcentages",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas suit les indicateurs d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = moinsDeClients(c);
        return [
          `« Le mois prochain, ${cause(c)}. Je m'attends à perdre ${pct(BAISSE_DE_FREQUENTATION * 100)} de nos ${r.client.pluriel}. Je veux savoir ce que cela retirerait à notre chiffre d'affaires si rien ne change, et quel ${r.nomDuPanier.toLowerCase()} il faudrait pour garder le chiffre d'affaires de ce mois-ci. »`,
          r.client.unitesParClient > 1
            ? `Pas de cours cette fois : vous avez les ventes du mois, clientèle par clientèle. Comme l'arène, comptez ${qte(r.client.unitesParClient)} article par passage en caisse. La méthode est celle du chapitre.`
            : `Pas de cours cette fois : vous avez les ventes du mois, clientèle par clientèle. Chez ${c.entreprise}, un client, c'est ${c.unite === "commande" ? "une commande" : "un couvert"}. La méthode est celle du chapitre.`,
        ];
      },
      tableau: (c) => ({
        titre: `${c.entreprise} · le mois, clientèle par clientèle`,
        colonnes: ["Vendu", "Chiffre d'affaires HT"],
        lignes: c.marche.clienteles.map((x) => ({ libelle: x.nom, valeurs: [qte(x.vendu), eur(x.chiffreDAffaires)] })),
      }),
      repere: (c) => {
        const r = moinsDeClients(c);
        return `À rendre : le chiffre d'affaires, les ${r.client.pluriel} et le ${r.nomDuPanier.toLowerCase()} du mois, ce que la baisse retirerait, le ${r.nomDuPanier.toLowerCase()} qui compense, et votre réponse.`;
      },
    },
    {
      id: "le-mois",
      type: "montants",
      titre: "Le mois de référence",
      notions: ["revenue", "average_basket"],
      question: (c) => {
        const r = moinsDeClients(c);
        return `Calculez le chiffre d'affaires hors taxes du mois, le nombre de ${r.client.pluriel} (à l'unité), puis le ${r.nomDuPanier.toLowerCase()}.`;
      },
      champs: (c) => {
        const r = moinsDeClients(c);
        const lignes = c.marche.clienteles;
        return [
          { libelle: "Chiffre d'affaires du mois", attendu: r.chiffreDAffaires, calcul: `${lignes.map((x) => eur(x.chiffreDAffaires)).join(" + ")} = ${eur(r.chiffreDAffaires)}` },
          r.client.unitesParClient > 1
            ? { libelle: majuscule(r.client.pluriel), attendu: r.clients, tolerance: 1, calcul: `${qte(r.ventes)} articles ÷ ${qte(r.client.unitesParClient)} = ${qte(r.clients)}` }
            : { libelle: majuscule(r.client.pluriel), attendu: r.clients, calcul: `${lignes.map((x) => qte(x.vendu)).join(" + ")} = ${qte(r.clients)}` },
          // Le nombre de clients arrondi à l'unité déplace le panier de quelques centimes.
          { libelle: r.nomDuPanier, attendu: r.panier, tolerance: 0.05, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.clients)} = ${eur(r.panier)}` },
        ];
      },
      explication: (c) => {
        const r = moinsDeClients(c);
        return [`Ce mois-ci, ${qte(r.clients)} ${r.client.pluriel} ont rapporté à ${c.entreprise} ${eur(r.panier)} en moyenne par ${r.client.singulier}. Le chiffre d'affaires, c'est toujours des clients multipliés par un panier.`];
      },
    },
    {
      id: "moins-de-clients",
      type: "montants",
      titre: "Avec moins de clients",
      notions: ["revenue", "average_basket"],
      question: (c) => {
        const r = moinsDeClients(c);
        return `Avec ${pct(BAISSE_DE_FREQUENTATION * 100)} de ${r.client.pluriel} en moins, combien en resterait-il (à l'unité) ? Quel chiffre d'affaires ${c.entreprise} ferait-elle si le ${r.nomDuPanier.toLowerCase()} ne bougeait pas, et combien perdrait-elle ?`;
      },
      champs: (c) => {
        const r = moinsDeClients(c);
        return [
          { libelle: `${majuscule(r.client.pluriel)} le mois prochain`, attendu: r.clientsApres, tolerance: 1, calcul: `${qte(r.clients)} × (1 − ${pct(BAISSE_DE_FREQUENTATION * 100)}) = ${qte(r.clientsApres)}` },
          { libelle: "Chiffre d'affaires au même panier", attendu: r.caSansAction, tolerance: 1, calcul: `${qte(r.clientsApres)} × ${eur(r.panier)} = ${eur(r.caSansAction)}` },
          { libelle: "Chiffre d'affaires perdu", attendu: r.caPerdu, tolerance: 1, calcul: `${eur(r.chiffreDAffaires)} − ${eur(r.caSansAction)} = ${eur(r.caPerdu)}` },
        ];
      },
      explication: (c) => {
        const r = moinsDeClients(c);
        return [`Sans rien changer, ${c.entreprise} perdrait ${eur(r.caPerdu)} de chiffre d'affaires dans le mois : les clients qui ne viennent pas emportent leur panier avec eux.`];
      },
    },
    {
      id: "le-panier-qui-compense",
      type: "montants",
      titre: "Le panier qui compense",
      notions: ["average_basket"],
      question: (c) => {
        const r = moinsDeClients(c);
        return `Pour garder le chiffre d'affaires de ce mois-ci avec les ${r.client.pluriel} qui restent, quel ${r.nomDuPanier.toLowerCase()} faudrait-il ? De combien devrait-il monter, en pourcentage, au dixième ?`;
      },
      champs: (c) => {
        const r = moinsDeClients(c);
        return [
          { libelle: `${r.nomDuPanier} nécessaire`, attendu: r.panierVise, tolerance: 0.05, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.clientsApres)} = ${eur(r.panierVise)}` },
          { libelle: "Hausse du panier (%)", attendu: r.hausseDuPanier, tolerance: 0.1, calcul: `(${eur(r.panierVise)} ÷ ${eur(r.panier)} − 1) × 100 = ${pct(r.hausseDuPanier)}` },
        ];
      },
      explication: (c) => {
        const r = moinsDeClients(c);
        return [
          `Perdre ${pct(BAISSE_DE_FREQUENTATION * 100)} des ${r.client.pluriel} demande ${pct(r.hausseDuPanier)} de ${r.nomDuPanier.toLowerCase()} en plus : le même chiffre d'affaires se partage entre moins de ${r.client.pluriel}, et chaque ${r.client.singulier} doit en porter davantage. Ce sera le chantier de l'équipe : le conseil, le produit complémentaire, la montée en gamme.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = moinsDeClients(c);
        return [
          {
            texte: `Il faudrait un ${r.nomDuPanier.toLowerCase()} de ${eur(r.panierVise)}, ${pct(r.hausseDuPanier)} de plus`,
            juste: true,
            retour: `Oui : ${eur(r.chiffreDAffaires)} à faire avec ${qte(r.clientsApres)} ${r.client.pluriel} au lieu de ${qte(r.clients)}, c'est ${eur(r.panierVise)} par ${r.client.singulier}. Sans hausse du panier, ${c.entreprise} perdrait ${eur(r.caPerdu)} dans le mois.`,
          },
          {
            texte: `Il suffirait d'un ${r.nomDuPanier.toLowerCase()} de ${eur(r.panierFaux)}, ${pct(BAISSE_DE_FREQUENTATION * 100)} de plus, comme les ${r.client.pluriel} ${accordPluriel(c, "perdu")}`,
            juste: false,
            retour: `Non : ${qte(r.clientsApres)} ${r.client.pluriel} à ${eur(r.panierFaux)} ne font que ${eur(r.caFaux)}. Le pourcentage de hausse se calcule sur le panier d'aujourd'hui, celui de la baisse sur les ${r.client.pluriel} d'aujourd'hui : ils ne se compensent pas. Il faut ${pct(r.hausseDuPanier)}.`,
          },
          {
            texte: `Le ${r.nomDuPanier.toLowerCase()} resterait à ${eur(r.panier)} : notre chiffre d'affaires ne bougerait pas`,
            juste: false,
            retour: `Non : le panier est une moyenne par ${r.client.singulier}, il ne dit rien du nombre de ${r.client.pluriel}. Au même panier, ${qte(r.clientsApres)} ${r.client.pluriel} font ${eur(r.caSansAction)}, soit ${eur(r.caPerdu)} de moins.`,
          },
        ];
      },
    },
  ],
};
