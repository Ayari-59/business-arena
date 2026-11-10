import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { NOMS_DES_CLIENTELES } from "../../chapitres/interroger-les-clients";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/taux-de-marque";
import {
  ANS_DE_CONSERVATION,
  COEFFICIENT_DE_CONFIANCE,
  COUT_D_UN_SMS,
  ECHANTILLON_DE_LA_LIVRAISON,
  OUI_A_LA_LIVRAISON,
  SEUIL_DE_LANCEMENT_DE_LA_LIVRAISON,
  TAUX_DE_SONDAGE,
  etudeDeLaLivraison,
  fichierDeLaCarte,
} from "../../monde/clientele-de-la-boutique";
import type { CodeDeClientele } from "../../monde/maille-et-co";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INTERROGER LES CLIENTS » : FAUT-IL LIVRER À DOMICILE ? (BTS MCO, palier 2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les clientèles de janvier de MAILLE & CO et une seconde enquête,
 * en ligne (monde/clientele-de-la-boutique.ts, `etudeDeLaLivraison`, `fichierDeLaCarte`). Les passants y
 * ont trop répondu cette fois. La direction lance la livraison si au moins 30 % des clients
 * l'utiliseraient, et veut l'annoncer par SMS à tout le fichier. L'élève refait seul les calculs du
 * chapitre : les quotas et les poids, le redressement, la marge d'incertitude et la borne basse ; puis il
 * compte les destinataires que le RGPD permet.
 *
 * Les pièges : décider sur la part brute ; oublier la marge d'incertitude ; écrire à tout le fichier.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les quotas et les cartes sont des quantités, entières ; les
 * poids, des coefficients au dix-millième ; les oui redressés et la marge en points, des grandeurs au centième, chaque ligne partant de
 * la précédente arrondie (monde/clientele-de-la-boutique.ts) ; les parts et la borne basse, à deux
 * décimales (au dixième, avant).
 */

const qte = nombreAuCentieme;
/** Une proportion au dix-millième, écrite avec ses quatre décimales. */
const quatre = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const CLIENTELES = Object.keys(NOMS_DES_CLIENTELES) as CodeDeClientele[];

/** Les chiffres du cas, calculés une fois sur la fiche. */
export function fautIlLivrerADomicile(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const l = etudeDeLaLivraison(f);
  return {
    f,
    l,
    fichier: fichierDeLaCarte(),
    partBrute: auCentime(l.partBrute * 100),
    part: auCentime(l.part * 100),
    marge: auCentime(l.marge * 100),
    borneBasse: auCentime(auCentime(l.part * 100) - auCentime(l.marge * 100)),
  };
}

const tableauDuCas = (c: Pick<Cas, "code">): TableauDeDonnees => {
  const x = fautIlLivrerADomicile(c);
  return {
    titre: "« Feriez-vous livrer vos achats à domicile ? » L'enquête en ligne",
    colonnes: ["Passages du mois", "Ont répondu", "Répondent oui"],
    lignes: CLIENTELES.map((k) => ({
      libelle: NOMS_DES_CLIENTELES[k].replace(/^./, (l) => l.toUpperCase()),
      valeurs: [qte(x.f.clienteles.find((y) => y.code === k)!.tickets), qte(ECHANTILLON_DE_LA_LIVRAISON[k]), qte(OUI_A_LA_LIVRAISON[k])],
    })),
  };
};

export const FAUT_IL_LIVRER_A_DOMICILE: Situation = {
  code: "faut-il-livrer-a-domicile",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["interroger-les-clients"],
  commanditaire: "La direction",
  titre: "Faut-il livrer à domicile ?",
  accroche:
    "Une enquête en ligne dit que beaucoup de clients feraient livrer leurs achats. Mais qui a répondu ? Avant de lancer la livraison et de l'annoncer à tout le fichier, l'étude se redresse et se borne.",
  objectifs: [
    "Calculer les quotas d'un échantillon et les poids qui le redressent",
    "Redresser une proportion et la comparer à la proportion brute",
    "Calculer la marge d'incertitude d'une proportion et la borne basse de son intervalle",
    "Compter les clients qu'une offre peut viser dans le respect du RGPD, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend l'étude du chapitre, auprès des clientèles de la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDuCas,
      texte: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [
          `« L'enquête en ligne est revenue : ${pct(x.partBrute)} des répondants feraient livrer leurs achats. Nous lançons la livraison si au moins ${pct(SEUIL_DE_LANCEMENT_DE_LA_LIVRAISON * 100)} des clients l'utiliseraient. Pouvons-nous y aller ? Et j'aimerais l'annoncer par SMS aux ${qte(x.fichier.cartes)} cartes du fichier. »`,
          `Pas de cours cette fois : vous avez les réponses, les passages du mois et la méthode du chapitre. L'échantillon visé est le même, un client sur quatre (${qte(x.l.taille)} réponses). Le fichier de la carte est celui du chapitre.`,
        ];
      },
      repere: () => "À rendre : les quotas et les poids, la part redressée, la marge d'incertitude et la borne basse, les destinataires que le RGPD permet, et votre réponse.",
    },
    {
      id: "les-poids",
      type: "montants",
      titre: "Les quotas et les poids",
      notions: ["segmentation"],
      tableau: tableauDuCas,
      question: () => "Calculez le quota des fidèles et celui des passants (un quart de leurs passages), puis le poids d'une réponse de chacune de ces clientèles (au dix-millième).",
      champs: (c) => {
        const x = fautIlLivrerADomicile(c);
        const k = (y: "fideles" | "passants") => x.f.clienteles.find((z) => z.code === y)!.tickets;
        return [
          { libelle: "Quota · clientes fidèles", nature: "quantite", attendu: x.l.quotas.fideles, calcul: `${qte(k("fideles"))} × ${pct(TAUX_DE_SONDAGE * 100)} = ${qte(x.l.quotas.fideles)}` },
          { libelle: "Quota · passants", nature: "quantite", attendu: x.l.quotas.passants, calcul: `${qte(k("passants"))} × ${pct(TAUX_DE_SONDAGE * 100)} = ${qte(x.l.quotas.passants)}` },
          { libelle: "Poids d'une réponse de fidèle", nature: "coefficient", attendu: x.l.poids.fideles, calcul: `${qte(x.l.quotas.fideles)} ÷ ${qte(ECHANTILLON_DE_LA_LIVRAISON.fideles)} = ${quatre(x.l.poids.fideles)}` },
          { libelle: "Poids d'une réponse de passant", nature: "coefficient", attendu: x.l.poids.passants, calcul: `${qte(x.l.quotas.passants)} ÷ ${qte(ECHANTILLON_DE_LA_LIVRAISON.passants)} = ${quatre(x.l.poids.passants)}` },
        ];
      },
      explication: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [`Cette fois, les passants ont trop répondu : chacune de leurs réponses ne compte que pour ${quatre(x.l.poids.passants)}, et celle d'une fidèle pour ${quatre(x.l.poids.fideles)}.`];
      },
    },
    {
      id: "le-redressement",
      type: "montants",
      titre: "La part redressée",
      notions: ["segmentation"],
      question: () => "Calculez les oui redressés, puis la part redressée des clients qui feraient livrer, en pourcentage, à deux décimales.",
      champs: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [
          {
            libelle: "Oui redressés",
            nature: "grandeur",
            attendu: auCentime(x.l.ouiRedresses),
            calcul: `${qte(OUI_A_LA_LIVRAISON.fideles)} × ${quatre(x.l.poids.fideles)} + ${qte(OUI_A_LA_LIVRAISON.passants)} × ${quatre(x.l.poids.passants)} + ${qte(OUI_A_LA_LIVRAISON.comites)} = ${qte(auCentime(x.l.ouiRedresses))}`,
          },
          { libelle: "Part redressée (%)", attendu: x.part, calcul: `${qte(auCentime(x.l.ouiRedresses))} ÷ ${qte(x.l.taille)} × 100 = ${pct(x.part)}` },
        ];
      },
      explication: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [`Redressée, la part tombe de ${pct(x.partBrute)} à ${pct(x.part)} : les passants, plus nombreux à répondre, voulaient plus la livraison que les fidèles.`];
      },
    },
    {
      id: "la-marge",
      type: "montants",
      titre: "La marge d'incertitude",
      notions: ["segmentation"],
      question: (c) => {
        const x = fautIlLivrerADomicile(c);
        return `Calculez la marge d'incertitude à 95 % de la part redressée, ${qte(COEFFICIENT_DE_CONFIANCE)} × √(p × (1 − p) ÷ n), en points à deux décimales, puis la borne basse de l'intervalle (${qte(x.l.taille)} réponses).`;
      },
      champs: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [
          { libelle: "Marge d'incertitude (points)", nature: "grandeur", attendu: x.marge, calcul: `${qte(COEFFICIENT_DE_CONFIANCE)} × √(${quatre(x.l.part)} × ${quatre(1 - x.l.part)} ÷ ${qte(x.l.taille)}) × 100 = ${qte(x.marge)}` },
          { libelle: "Borne basse (%)", attendu: auCentime(x.borneBasse), calcul: `${pct(x.part)} − ${qte(x.marge)} = ${pct(auCentime(x.borneBasse))}` },
        ];
      },
      explication: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [`Même à sa borne basse, ${pct(auCentime(x.borneBasse))}, la part reste au-dessus du seuil de ${pct(SEUIL_DE_LANCEMENT_DE_LA_LIVRAISON * 100)} : la conclusion tient, malgré l'incertitude.`];
      },
    },
    {
      id: "a-qui-l-annoncer",
      type: "montants",
      titre: "À qui l'annoncer",
      notions: ["segmentation"],
      question: () =>
        `Comptez les cartes à effacer (dernier achat il y a plus de ${qte(ANS_DE_CONSERVATION)} ans), les clientes qui peuvent recevoir le SMS (cartes gardées qui ont accepté les offres), puis le coût de l'envoi à ${eur(COUT_D_UN_SMS)} le message.`,
      champs: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [
          { libelle: "Cartes à effacer", nature: "quantite", attendu: x.fichier.aEffacer, calcul: `Dernier achat il y a plus de ${qte(ANS_DE_CONSERVATION)} ans : ${qte(x.fichier.aEffacer)} cartes` },
          { libelle: "Destinataires du SMS", nature: "quantite", attendu: x.fichier.destinataires, calcul: `Les cartes gardées qui ont accepté les offres : ${qte(x.fichier.destinataires)}` },
          { libelle: "Coût de l'envoi", attendu: x.fichier.coutDeLaCampagne, calcul: `${qte(x.fichier.destinataires)} × ${eur(COUT_D_UN_SMS)} = ${eur(x.fichier.coutDeLaCampagne)}` },
        ];
      },
      explication: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [`Le SMS part à ${qte(x.fichier.destinataires)} clientes, pas à ${qte(x.fichier.cartes)} : les autres n'ont pas donné leur accord, ou leur carte doit être effacée. Les autres clients l'apprendront en boutique et sur le site.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const x = fautIlLivrerADomicile(c);
        return [
          {
            texte: `Lancer, et l'annoncer aux ${qte(x.fichier.destinataires)} clientes qui l'ont accepté`,
            juste: true,
            retour: `Oui : redressée, la part est de ${pct(x.part)}, et ${pct(auCentime(x.borneBasse))} au plus bas, au-dessus du seuil. Le SMS ne part qu'aux cartes gardées qui ont accepté les offres : ${eur(x.fichier.coutDeLaCampagne)}.`,
          },
          {
            texte: `Lancer et l'annoncer aux ${qte(x.fichier.cartes)} cartes : ${pct(x.partBrute)} des répondants la veulent`,
            juste: false,
            retour: `Non, deux fois : ${pct(x.partBrute)} est la part brute, gonflée par les passants (${pct(x.part)} redressée) ; et le SMS ne peut aller qu'aux ${qte(x.fichier.destinataires)} clientes qui l'ont accepté.`,
          },
          {
            texte: "Attendre : avec la marge d'incertitude, la part pourrait être sous le seuil",
            juste: false,
            retour: `Non : la borne basse, ${pct(auCentime(x.borneBasse))}, reste au-dessus de ${pct(SEUIL_DE_LANCEMENT_DE_LA_LIVRAISON * 100)}. L'incertitude ne remet pas la décision en cause.`,
          },
        ];
      },
    },
  ],
};
