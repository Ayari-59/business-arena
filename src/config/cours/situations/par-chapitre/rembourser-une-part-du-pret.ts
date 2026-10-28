import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { de, delaiDuClientPro, nomDuClient } from "../../provisions";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CHARGES ET PRODUITS, ENCAISSEMENTS ET DÉCAISSEMENTS » :
 * REMBOURSER UNE PART DU PRÊT EN FÉVRIER (comptabilité générale, palier 1).
 *
 * Le gérant veut rembourser une part de l'emprunt par avance, en février. Il craint que
 * ce remboursement plombe le résultat du mois. L'élève a le programme de février et
 * refait seul les deux questions du chapitre pour chaque opération (le résultat, la
 * banque), calcule le résultat de février et la variation de la banque, puis rend sa
 * réponse.
 *
 * Le cas est neuf par sa question : le mois n'est plus janvier, et il porte une
 * opération que le chapitre n'a pas, un remboursement d'emprunt décidé par le gérant.
 * Les autres chiffres sont ceux du mois du cas (`cas.ts`), reconduits en février.
 */

/**
 * La part de l'emprunt remboursée par avance : 10 %, ce que le gérant juge pouvoir
 * prélever sur la trésorerie du début d'année sans se priver du reste du prêt.
 */
export const PART_REMBOURSEE_PAR_AVANCE = 0.1;

/** Février suit janvier : ses dates sont celles de janvier, trente et un jours plus tard. */
const UN_MOIS = 31;
/** Le dernier jour de février, en jours du cours. */
const FIN_FEVRIER = 59;

/** « à » devant un nom, contracté : au groupe, à la société, à l'agence. */
const a = (nom: string) => (nom.startsWith("le ") ? `au ${nom.slice(3)}` : nom.startsWith("les ") ? `aux ${nom.slice(4)}` : `à ${nom}`);
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const resultatEcrit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
const variationEcrite = (x: number) => (x >= 0 ? `montera de ${eur(x)}` : `baissera de ${eur(-x)}`);

/**
 * L'échéance d'une facture du client, décalée de `decalage` jours (un mois pour la vente de février) :
 * « payable le 20 mars », ou, quand le client paie au-delà du délai convenu (plafonné à 60 jours entre
 * professionnels), « payable le 20 mars, réglée en fait le 20 avril, en retard ».
 */
function echeanceDuClient(c: Cas, decalage: number) {
  const d = delaiDuClientPro(c);
  return d.retard > 0
    ? `payable le ${date(d.echeanceConvenue + decalage)}, réglée en fait le ${date(d.paiement + decalage)}, en retard`
    : `payable le ${date(d.paiement + decalage)}`;
}

/** Les chiffres de la réponse, calculés une fois du cas. */
export function remboursementParAvance(c: Cas) {
  const remboursement = auCentime(c.emprunt * PART_REMBOURSEE_PAR_AVANCE);
  const cotisations = c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales;
  // Le client professionnel de janvier paie en février si son échéance y tombe.
  const clientEnFevrier = c.venteCredit.echeance <= FIN_FEVRIER;
  const charges = auCentime(c.achat.ht + c.loyer.montant + c.personnel.cout);
  const produits = auCentime(c.venteComptant.ht + c.venteCredit.ht);
  const resultat = auCentime(produits - charges);
  const encaissements = auCentime(c.venteComptant.ttc + (clientEnFevrier ? c.venteCredit.ttc : 0));
  const decaissements = auCentime(c.achat.ttc + c.loyer.montant + c.personnel.net + cotisations + remboursement);
  const variation = auCentime(encaissements - decaissements);
  return { remboursement, cotisations, clientEnFevrier, client: nomDuClient(c.venteCredit.client), produits, charges, resultat, encaissements, decaissements, variation };
}

export const REMBOURSER_UNE_PART_DU_PRET: Situation = {
  code: "rembourser-une-part-du-pret",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [],
  reprend: ["charges-produits-encaissements"],
  commanditaire: "Le gérant",
  titre: "Rembourser une part du prêt en février",
  accroche:
    "Le gérant veut rembourser une part de l'emprunt dès février, mais craint pour le résultat du mois. À vous de lui dire ce que ce remboursement change, et ce qu'il ne change pas.",
  objectifs: [
    "Dire, pour chaque opération du mois, si elle touche le résultat, la banque, les deux ou aucun",
    "Calculer le résultat d'un mois : les produits moins les charges",
    "Calculer les encaissements, les décaissements et la variation de la banque du mois",
    "Expliquer au gérant pourquoi un remboursement d'emprunt n'est pas une charge",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = remboursementParAvance(c);
        return [
          `« La banque accepte que nous remboursions par avance ${pct(PART_REMBOURSEE_PAR_AVANCE)} de notre emprunt, soit ${eur(r.remboursement)}, en février. Je le ferais volontiers, mais j'ai peur que ce remboursement plombe le résultat du mois. Février ressemblera à janvier : dites-moi quel résultat ${c.entreprise} fera en février, et de combien la banque bougera, remboursement compris. »`,
          "Pas de cours cette fois : vous avez le programme de février, et la méthode est celle du chapitre. Les ventes et les achats sont donnés hors taxes et taxes comprises ; la TVA à reverser à l'État, le gérant la suit à part : laissez-la de côté.",
        ];
      },
      tableau: (c) => {
        const r = remboursementParAvance(c);
        return {
          titre: `Le programme de février · ${c.entreprise}`,
          colonnes: ["Hors taxes", "Taxes comprises"],
          lignes: [
            { libelle: "Ventes au comptant de février, encaissées dans le mois", valeurs: [eur(c.venteComptant.ht), eur(c.venteComptant.ttc)] },
            { libelle: `Vente de février ${a(r.client)}, ${echeanceDuClient(c, UN_MOIS)}`, valeurs: [eur(c.venteCredit.ht), eur(c.venteCredit.ttc)] },
            { libelle: `Achat de février chez ${c.achat.fournisseur}, payable le ${date(c.achat.echeance + UN_MOIS)}`, valeurs: [eur(c.achat.ht), eur(c.achat.ttc)] },
            { libelle: `Facture de janvier ${de(c.achat.fournisseur)}, payée le ${date(c.achat.echeance)}`, valeurs: ["", eur(c.achat.ttc)] },
            { libelle: `Facture de janvier ${de(r.client)}, ${echeanceDuClient(c, 0)}`, valeurs: ["", eur(c.venteCredit.ttc)] },
            { libelle: `Loyer de février, prélevé le ${date(c.loyer.date + UN_MOIS)}, sans TVA`, valeurs: ["", eur(c.loyer.montant)] },
            { libelle: "Salaires bruts et cotisations patronales de février", valeurs: ["", eur(c.personnel.cout)] },
            { libelle: `dont salaires nets versés le ${date(c.personnel.date + UN_MOIS)}`, valeurs: ["", eur(c.personnel.net)] },
            { libelle: `Cotisations de janvier, versées à l'URSSAF le ${date(c.personnel.dateUrssaf)}`, valeurs: ["", eur(r.cotisations)] },
            { libelle: "Remboursement par avance d'une part de l'emprunt", valeurs: ["", eur(r.remboursement)] },
          ],
        };
      },
      repere: () =>
        "À rendre : ce que chaque opération touche, le résultat de février, la variation de la banque en février, et votre réponse.",
    },
    {
      id: "ce-que-touche",
      type: "tri",
      titre: "Le résultat, la banque, ou les deux ?",
      notions: ["income_statement", "payment_terms"],
      question: () => `Chaque opération de février touche-t-elle le résultat du mois, la banque en février, les deux, ou ni l'un ni l'autre ce mois-ci ?`,
      categories: [
        { code: "les-deux", libelle: "Le résultat et la banque" },
        { code: "resultat", libelle: "Le résultat seulement" },
        { code: "banque", libelle: "La banque seulement" },
        { code: "aucun", libelle: "Ni l'un ni l'autre en février" },
      ],
      elements: (c) => {
        const r = remboursementParAvance(c);
        return [
          {
            libelle: "Remboursement par avance de l'emprunt",
            montant: r.remboursement,
            categorie: "banque",
            pourquoi: "L'argent sort, mais la dette baisse d'autant : l'entreprise n'est pas plus pauvre. Ce n'est pas une charge.",
          },
          { libelle: "Ventes au comptant de février", montant: c.venteComptant.ht, categorie: "les-deux", pourquoi: "Un produit, encaissé sur-le-champ." },
          {
            libelle: `Vente de février ${a(r.client)}`,
            montant: c.venteCredit.ht,
            categorie: "resultat",
            pourquoi: `Un produit de février, que le client paiera le ${date(c.venteCredit.echeance + UN_MOIS)} seulement${delaiDuClientPro(c).retard > 0 ? ", en retard sur l'échéance convenue" : ""}.`,
          },
          {
            libelle: `Achat de février chez ${c.achat.fournisseur}`,
            montant: c.achat.ht,
            categorie: "resultat",
            pourquoi: `Une charge de février, payée le ${date(c.achat.echeance + UN_MOIS)} seulement.`,
          },
          {
            libelle: `Facture de janvier ${de(c.achat.fournisseur)}`,
            montant: c.achat.ttc,
            categorie: "banque",
            pourquoi: "La charge a été comptée en janvier : la payer en février ne fait que solder la dette.",
          },
          {
            libelle: `Facture de janvier ${de(r.client)}`,
            montant: c.venteCredit.ttc,
            categorie: r.clientEnFevrier ? "banque" : "aucun",
            pourquoi: r.clientEnFevrier
              ? `Le produit a été compté en janvier ; l'argent arrive le ${date(c.venteCredit.echeance)}, en février.`
              : `Le produit a été compté en janvier, et l'argent n'arrivera que le ${date(c.venteCredit.echeance)}, après février.`,
          },
          { libelle: "Loyer de février", montant: c.loyer.montant, categorie: "les-deux", pourquoi: "Un mois d'occupation, payé dans le mois." },
          {
            libelle: "Salaires et cotisations patronales de février",
            montant: c.personnel.cout,
            categorie: "les-deux",
            pourquoi: `Une charge pour tout le coût ; la banque n'en voit en février que le net, ${eur(c.personnel.net)}, les cotisations se paient en mars.`,
          },
          {
            libelle: "Cotisations de janvier à l'URSSAF",
            montant: r.cotisations,
            categorie: "banque",
            pourquoi: "Elles étaient une charge de janvier : les verser en février solde la dette envers l'URSSAF.",
          },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [
          `Le remboursement de ${eur(r.remboursement)} se range avec les factures de janvier payées en février : de l'argent qui sort sans appauvrir ${c.entreprise}. Il change le bilan (moins de banque, moins de dette), pas le compte de résultat.`,
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat de février",
      notions: ["income_statement"],
      question: () => "Calculez le total des produits de février, celui des charges, puis le résultat du mois. Un résultat négatif est une perte.",
      champs: (c) => {
        const r = remboursementParAvance(c);
        return [
          { libelle: "Total des produits de février", attendu: r.produits, calcul: `${eur(c.venteComptant.ht)} + ${eur(c.venteCredit.ht)} = ${eur(r.produits)}` },
          {
            libelle: "Total des charges de février",
            attendu: r.charges,
            calcul: `${eur(c.achat.ht)} + ${eur(c.loyer.montant)} + ${eur(c.personnel.cout)} = ${eur(r.charges)}`,
          },
          { libelle: "Résultat de février", attendu: r.resultat, calcul: `${eur(r.produits)} − ${eur(r.charges)} = ${eur(r.resultat)}` },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [
          `En février, ${c.entreprise} fait ${resultatEcrit(r.resultat)}. Les ventes et l'achat de février y entrent, payés ou non ; les factures de janvier réglées ce mois-ci n'y entrent pas, elles ont été comptées en janvier. Et le remboursement n'y figure pas.`,
        ];
      },
    },
    {
      id: "banque",
      type: "montants",
      titre: "La banque en février",
      notions: ["net_treasury", "payment_terms"],
      question: () =>
        "Calculez ce qui entre en banque en février, ce qui en sort, remboursement compris, puis la variation de la banque. Une variation négative dit que la banque baisse.",
      champs: (c) => {
        const r = remboursementParAvance(c);
        return [
          {
            libelle: "Encaissements de février",
            attendu: r.encaissements,
            calcul: r.clientEnFevrier ? `${eur(c.venteComptant.ttc)} + ${eur(c.venteCredit.ttc)} = ${eur(r.encaissements)}` : `les ventes au comptant seules : ${eur(r.encaissements)}`,
          },
          {
            libelle: "Décaissements de février",
            attendu: r.decaissements,
            calcul: `${eur(c.achat.ttc)} + ${eur(c.loyer.montant)} + ${eur(c.personnel.net)} + ${eur(r.cotisations)} + ${eur(r.remboursement)} = ${eur(r.decaissements)}`,
          },
          { libelle: "Variation de la banque en février", attendu: r.variation, calcul: `${eur(r.encaissements)} − ${eur(r.decaissements)} = ${eur(r.variation)}` },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [
          `La banque ${variationEcrite(r.variation)} en février, pour ${resultatEcrit(r.resultat)}. L'écart tient aux factures de janvier réglées ce mois-ci, à la vente et à l'achat de février réglés plus tard, au décalage des cotisations, et aux ${eur(r.remboursement)} du remboursement, qui ne sont pas une charge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["income_statement", "net_treasury"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = remboursementParAvance(c);
        return [
          {
            texte: `Nous ferons ${resultatEcrit(r.resultat)}, remboursement à part ; la banque ${variationEcrite(r.variation)}`,
            juste: true,
            retour: `Oui : le résultat de février, ${resultatEcrit(r.resultat)}, ne compte que les produits et les charges du mois. Le remboursement de ${eur(r.remboursement)} fait sortir de l'argent et baisser la dette d'autant : il ne se lit que dans la banque.`,
          },
          {
            texte: `Nous ferons ${resultatEcrit(auCentime(r.resultat - r.remboursement))}, le remboursement compté en charge, et la banque ${variationEcrite(r.variation)}`,
            juste: false,
            retour: `Non : rembourser n'appauvrit pas ${c.entreprise}, puisque sa dette baisse de ${eur(r.remboursement)}. Le remboursement n'est pas une charge : ${c.entreprise} fera ${resultatEcrit(r.resultat)}.`,
          },
          {
            texte: `Nous ferons ${resultatEcrit(r.variation)} : c'est ce que la banque aura gagné ou perdu dans le mois`,
            juste: false,
            retour: `Non : c'est confondre le résultat et la banque, qui ${variationEcrite(r.variation)}. Le résultat compte les produits et les charges du mois, quand ils naissent, payés ou non : ${resultatEcrit(r.resultat)}.`,
          },
          {
            texte: `Rembourser ne coûte rien, ni au résultat ni à la banque, qui ${variationEcrite(auCentime(r.variation + r.remboursement))}`,
            juste: false,
            retour: `Non : le remboursement n'est pas une charge, mais c'est bien un décaissement. Les ${eur(r.remboursement)} sortent de la banque, qui ${variationEcrite(r.variation)}.`,
          },
        ];
      },
    },
  ],
};
