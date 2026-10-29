import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { POURQUOI_LA_GESTION_DE_BASE } from "../../chapitres/les-flux";
import { dateDuCours as date } from "../../dates";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE, FICHE_DE_GESTION, moisDuBudget } from "../../monde/gestion-et-information";
import { DELAI_CONVENU_DE_CAMPUSTECH } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CHARGES ET PRODUITS, ENCAISSEMENTS ET DÉCAISSEMENTS » :
 * REMBOURSER UNE PART DU PRÊT EN FÉVRIER (comptabilité générale, palier 1).
 *
 * Le gérant de NOVA veut rembourser une part de l'emprunt par avance, en février. Il craint que ce
 * remboursement plombe le résultat du mois. L'élève a le programme de février et refait seul les
 * deux questions du chapitre pour chaque opération (le résultat, la banque), calcule le résultat de
 * février et la variation de la banque, puis rend sa réponse.
 *
 * Le cas est neuf par sa question : le mois n'est plus janvier, et il porte une opération que le
 * chapitre n'a pas, un remboursement d'emprunt décidé par le gérant.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : le mois de février du semestre (le budget de
 * trésorerie et les charges du contrôle de gestion, moisDuBudget dans monde/gestion-et-information.ts).
 * Il reconduisait janvier en février, dans neuf entreprises ; chez NOVA, février vend moins que
 * janvier (1 450 enceintes au lieu de 1 590) et finit en perte de 733 €.
 */

/**
 * La part de l'emprunt remboursée par avance : 10 %, ce que le gérant juge pouvoir prélever sur la
 * trésorerie du début d'année sans se priver du reste du prêt (hypothèse du cas).
 */
export const PART_REMBOURSEE_PAR_AVANCE = 0.1;

/** Février suit janvier : ses dates sont celles de janvier, trente et un jours plus tard. */
const UN_MOIS = 31;
/** Février, dans les mois du semestre (0 : janvier). */
const FEVRIER = 1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const resultatEcrit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
const variationEcrite = (x: number) => (x >= 0 ? `montera de ${eur(x)}` : `baissera de ${eur(-x)}`);

/** Les chiffres de la réponse : février, et le remboursement par avance. */
export function remboursementParAvance(c: Cas) {
  const m = moisDuBudget(FICHE_DE_GESTION, FEVRIER);
  const remboursement = auCentime(c.emprunt * PART_REMBOURSEE_PAR_AVANCE);
  const particuliers = m.ventes.find((v) => v.code === "particuliers")!;
  const campustech = m.ventes.find((v) => v.code === "campustech")!;
  const d = m.decaissements;
  const decaissements = auCentime(d.fournisseur + d.autresCoutsVariables + d.loyer + d.salairesNets + d.cotisations + d.tva + remboursement);
  const encaissements = m.encaissements.total;
  // CampusTech, facturée le 20 février, devait payer à 60 jours ; elle paie à 80, en retard.
  const factureDeFevrier = c.venteCredit.date + UN_MOIS;
  return {
    m,
    remboursement,
    particuliers,
    campustech,
    produits: m.produits,
    charges: m.totalDesCharges,
    resultat: m.resultat,
    encaissements,
    decaissements,
    variation: auCentime(encaissements - decaissements),
    echeanceConvenueDeFevrier: factureDeFevrier + DELAI_CONVENU_DE_CAMPUSTECH,
    paiementDeFevrier: factureDeFevrier + c.venteCredit.delai,
  };
}

export const REMBOURSER_UNE_PART_DU_PRET: Situation = {
  code: "rembourser-une-part-du-pret",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [],
  reprend: ["charges-produits-encaissements"],
  commanditaire: "Le gérant",
  titre: "Rembourser une part du prêt en février",
  accroche: "Le gérant veut rembourser une part de l'emprunt dès février, mais craint pour le résultat du mois. À vous de lui dire ce que ce remboursement change, et ce qu'il ne change pas.",
  objectifs: [
    "Dire, pour chaque opération du mois, si elle touche le résultat, la banque, les deux ou aucun",
    "Calculer le résultat d'un mois : les produits moins les charges",
    "Calculer les encaissements, les décaissements et la variation de la banque du mois",
    "Expliquer au gérant pourquoi un remboursement d'emprunt n'est pas une charge",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LA_GESTION_DE_BASE },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = remboursementParAvance(c);
        return [
          `« La banque accepte que nous remboursions par avance ${pct(PART_REMBOURSEE_PAR_AVANCE)} de notre emprunt, soit ${eur(r.remboursement)}, en février. Je le ferais volontiers, mais j'ai peur que ce remboursement plombe le résultat du mois. Dites-moi quel résultat nous ferons en février, et ce que deviendra la banque. »`,
          "Pas de cours cette fois : vous avez le programme de février, et la méthode est celle du chapitre. Les ventes et les achats sont donnés hors taxes et taxes comprises ; la TVA de février, que l'entreprise reversera en mars, le gérant la suit à part.",
        ];
      },
      tableau: (c) => {
        const r = remboursementParAvance(c);
        const m = r.m;
        return {
          titre: `Le programme de février · ${c.entreprise}`,
          colonnes: ["Hors taxes", "Taxes comprises"],
          lignes: [
            { libelle: "Ventes aux particuliers de février, payées à la commande", valeurs: [eur(r.particuliers.ht), eur(r.particuliers.ttc)] },
            { libelle: `Vente de février à ${c.venteCredit.client}, payable le ${date(r.echeanceConvenueDeFevrier)}, réglée en fait le ${date(r.paiementDeFevrier)}, en retard`, valeurs: [eur(r.campustech.ht), eur(r.campustech.ttc)] },
            { libelle: `Composants de février chez ${c.achat.fournisseur}, payables le ${date(c.achat.date + UN_MOIS + c.achat.delai)}`, valeurs: [eur(m.charges.composants), eur(m.composantsTtc)] },
            { libelle: "Emballage, transport et énergie de février, payés dans le mois", valeurs: [eur(m.charges.autres), eur(m.autresTtc)] },
            { libelle: `Composants de janvier, payés le ${date(c.achat.echeance)}`, valeurs: ["", eur(m.decaissements.fournisseur)] },
            { libelle: `Facture de janvier de ${c.venteCredit.client}, réglée le ${date(c.venteCredit.echeance)}, en retard`, valeurs: ["", eur(c.venteCredit.ttc)] },
            { libelle: `Loyer de février, prélevé le ${date(c.loyer.date + UN_MOIS)}, sans TVA`, valeurs: ["", eur(m.charges.loyer)] },
            { libelle: "Salaires bruts et cotisations patronales de février", valeurs: ["", eur(m.charges.personnel)] },
            { libelle: `dont salaires nets versés le ${date(c.personnel.date + UN_MOIS)}`, valeurs: ["", eur(m.decaissements.salairesNets)] },
            { libelle: `Cotisations de janvier, versées à l'URSSAF le ${date(c.personnel.dateUrssaf)}`, valeurs: ["", eur(m.decaissements.cotisations)] },
            { libelle: "TVA de janvier, reversée à l'État en février", valeurs: ["", eur(m.decaissements.tva)] },
            { libelle: "Usure de la ligne de montage en février", valeurs: [eur(m.charges.dotation), ""] },
            { libelle: "Remboursement par avance d'une part de l'emprunt", valeurs: ["", eur(r.remboursement)] },
          ],
        };
      },
      repere: () => "À rendre : ce que chaque opération touche, le résultat de février, la variation de la banque en février, et votre réponse.",
    },
    {
      id: "ce-que-touche",
      type: "tri",
      titre: "Le résultat, la banque, ou les deux ?",
      notions: ["income_statement", "payment_terms"],
      question: () => "Chaque opération de février touche-t-elle le résultat du mois, la banque en février, les deux, ou ni l'un ni l'autre ce mois-ci ?",
      categories: [
        { code: "les-deux", libelle: "Le résultat et la banque" },
        { code: "resultat", libelle: "Le résultat seulement" },
        { code: "banque", libelle: "La banque seulement" },
        { code: "aucun", libelle: "Ni l'un ni l'autre en février" },
      ],
      elements: (c) => {
        const r = remboursementParAvance(c);
        const m = r.m;
        return [
          { libelle: "Remboursement par avance de l'emprunt", montant: r.remboursement, categorie: "banque", pourquoi: "L'argent sort, mais la dette baisse d'autant : l'entreprise n'est pas plus pauvre. Ce n'est pas une charge." },
          { libelle: "Ventes aux particuliers de février", montant: r.particuliers.ht, categorie: "les-deux", pourquoi: "Un produit, encaissé à la commande." },
          { libelle: `Vente de février à ${c.venteCredit.client}`, montant: r.campustech.ht, categorie: "resultat", pourquoi: `Un produit de février, que le client paiera le ${date(r.paiementDeFevrier)} seulement, en retard sur l'échéance convenue.` },
          { libelle: "Composants de février", montant: m.charges.composants, categorie: "resultat", pourquoi: "Une charge de février, payée en mars seulement." },
          { libelle: "Emballage, transport et énergie de février", montant: m.charges.autres, categorie: "les-deux", pourquoi: "Une charge du mois, payée dans le mois." },
          { libelle: "Composants de janvier", montant: m.decaissements.fournisseur, categorie: "banque", pourquoi: "La charge a été comptée en janvier : la payer en février ne fait que solder la dette." },
          { libelle: `Facture de janvier de ${c.venteCredit.client}`, montant: c.venteCredit.ttc, categorie: "aucun", pourquoi: `Le produit a été compté en janvier, et l'argent n'arrivera que le ${date(c.venteCredit.echeance)}, après février.` },
          { libelle: "Loyer de février", montant: m.charges.loyer, categorie: "les-deux", pourquoi: "Un mois d'occupation, payé dans le mois." },
          { libelle: "Salaires et cotisations patronales de février", montant: m.charges.personnel, categorie: "les-deux", pourquoi: `Une charge pour tout le coût ; la banque n'en voit en février que le net, ${eur(m.decaissements.salairesNets)}, les cotisations se paient en mars.` },
          { libelle: "Cotisations de janvier à l'URSSAF", montant: m.decaissements.cotisations, categorie: "banque", pourquoi: "Elles étaient une charge de janvier : les verser en février solde la dette envers l'URSSAF." },
          { libelle: "TVA de janvier reversée à l'État", montant: m.decaissements.tva, categorie: "banque", pourquoi: "La TVA n'est ni une charge ni un produit : l'entreprise la collecte et la reverse." },
          { libelle: "Usure de la ligne en février", montant: m.charges.dotation, categorie: "resultat", pourquoi: "Une charge calculée : aucun argent ne sort." },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [`Le remboursement de ${eur(r.remboursement)} se range avec les factures de janvier payées en février : de l'argent qui sort sans appauvrir ${c.entreprise}. Il change le bilan (moins de banque, moins de dette), pas le compte de résultat.`];
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
        const k = r.m.charges;
        return [
          { libelle: "Total des produits de février", attendu: r.produits, calcul: `${eur(r.particuliers.ht)} + ${eur(r.campustech.ht)} = ${eur(r.produits)}` },
          { libelle: "Total des charges de février", attendu: r.charges, calcul: `${eur(k.composants)} + ${eur(k.autres)} + ${eur(k.loyer)} + ${eur(k.personnel)} + ${eur(k.dotation)} = ${eur(r.charges)}` },
          { libelle: "Résultat de février", attendu: r.resultat, calcul: `${eur(r.produits)} − ${eur(r.charges)} = ${eur(r.resultat)}` },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [`En février, ${c.entreprise} fait ${resultatEcrit(r.resultat)}. Les ventes et les achats de février y entrent, payés ou non ; les factures de janvier réglées ce mois-ci n'y entrent pas, elles ont été comptées en janvier. Et le remboursement n'y figure pas.`];
      },
    },
    {
      id: "banque",
      type: "montants",
      titre: "La banque en février",
      notions: ["net_treasury", "payment_terms"],
      question: () => "Calculez ce qui entre en banque en février, ce qui en sort, remboursement compris, puis la variation de la banque. Une variation négative dit que la banque baisse.",
      champs: (c) => {
        const r = remboursementParAvance(c);
        const d = r.m.decaissements;
        return [
          { libelle: "Encaissements de février", attendu: r.encaissements, calcul: `les ventes aux particuliers seules : ${eur(r.encaissements)}` },
          { libelle: "Décaissements de février", attendu: r.decaissements, calcul: `${[d.fournisseur, d.autresCoutsVariables, d.loyer, d.salairesNets, d.cotisations, d.tva, r.remboursement].map(eur).join(" + ")} = ${eur(r.decaissements)}` },
          { libelle: "Variation de la banque en février", attendu: r.variation, calcul: `${eur(r.encaissements)} − ${eur(r.decaissements)} = ${eur(r.variation)}` },
        ];
      },
      explication: (c) => {
        const r = remboursementParAvance(c);
        return [`La banque ${variationEcrite(r.variation)} en février, pour ${resultatEcrit(r.resultat)}. L'écart tient aux composants et à la TVA de janvier payés ce mois-ci, à la vente de ${c.venteCredit.client} et aux composants de février réglés plus tard, au décalage des cotisations, à l'usure de la ligne qui ne se paie pas, et aux ${eur(r.remboursement)} du remboursement, qui ne sont pas une charge.`];
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
          { texte: `Nous ferons ${resultatEcrit(r.resultat)}, remboursement à part ; la banque ${variationEcrite(r.variation)}`, juste: true, retour: `Oui : le résultat de février, ${resultatEcrit(r.resultat)}, ne compte que les produits et les charges du mois. Le remboursement de ${eur(r.remboursement)} fait sortir de l'argent et baisser la dette d'autant : il ne se lit que dans la banque.` },
          { texte: `Nous ferons ${resultatEcrit(auCentime(r.resultat - r.remboursement))}, le remboursement compté en charge, et la banque ${variationEcrite(r.variation)}`, juste: false, retour: `Non : rembourser n'appauvrit pas ${c.entreprise}, puisque sa dette baisse de ${eur(r.remboursement)}. Le remboursement n'est pas une charge : ${c.entreprise} fera ${resultatEcrit(r.resultat)}.` },
          { texte: `Nous ferons ${resultatEcrit(r.variation)} : c'est ce que la banque aura gagné ou perdu dans le mois`, juste: false, retour: `Non : c'est confondre le résultat et la banque, qui ${variationEcrite(r.variation)}. Le résultat compte les produits et les charges du mois, quand ils naissent, payés ou non : ${resultatEcrit(r.resultat)}.` },
          { texte: `Rembourser ne coûte rien, ni au résultat ni à la banque, qui ${variationEcrite(auCentime(r.variation + r.remboursement))}`, juste: false, retour: `Non : le remboursement n'est pas une charge, mais c'est bien un décaissement. Les ${eur(r.remboursement)} sortent de la banque, qui ${variationEcrite(r.variation)}.` },
        ];
      },
    },
  ],
};
