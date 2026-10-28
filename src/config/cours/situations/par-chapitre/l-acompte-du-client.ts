import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { de, delaiDuClientPro, nomDuClient } from "../../provisions";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES FLUX DE L'ENTREPRISE » : L'ACOMPTE DU CLIENT
 * (comptabilité générale, palier 1).
 *
 * Le client professionnel du cas a versé un acompte à la commande, avant d'être livré.
 * Le gérant attend le relevé de la banque de janvier et veut savoir d'avance ce qui a dû
 * entrer et sortir du compte, et ce que les partenaires doivent encore ou attendent.
 * L'élève refait seul le chemin du chapitre : les deux flux de chaque opération et leur
 * moment, les entrées et les sorties d'argent du mois, ce qui reste à venir, puis la
 * phrase qu'il rend.
 *
 * Le cas est neuf par sa question : dans le chapitre, l'argent suit toujours le flux
 * réel ou tombe avec lui ; ici, une partie le précède. Les autres chiffres sont ceux du
 * mois du cas (`cas.ts`).
 */

/**
 * L'acompte versé par le client professionnel à la commande : 30 % du montant toutes
 * taxes comprises, l'usage courant pour une commande importante qu'il faut préparer.
 */
export const ACOMPTE_A_LA_COMMANDE = 0.3;

/** Le client commande dix jours avant d'être livré : le temps de préparer sa commande. */
export const JOURS_ENTRE_COMMANDE_ET_LIVRAISON = 10;

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
/** « à » devant un nom, contracté : au groupe, à la société, à l'agence. */
const a = (nom: string) => (nom.startsWith("le ") ? `au ${nom.slice(3)}` : nom.startsWith("les ") ? `aux ${nom.slice(4)}` : `à ${nom}`);

/**
 * L'échéance du reste : « payable le 21 mars », ou, quand le client paie au-delà du délai convenu
 * (plafonné à 60 jours entre professionnels), « payable le 20 mars, réglé en fait le 20 avril, en retard ».
 */
function echeanceDuReste(c: Cas) {
  const d = delaiDuClientPro(c);
  return d.retard > 0 ? `payable le ${date(d.echeanceConvenue)}, réglé en fait le ${date(d.paiement)}, en retard` : `payable le ${date(d.paiement)}`;
}

/** Les chiffres de la réponse, calculés une fois du cas. */
export function acompteDuClient(c: Cas) {
  const v = c.venteCredit;
  const acompte = auCentime(v.ttc * ACOMPTE_A_LA_COMMANDE);
  const solde = auCentime(v.ttc - acompte);
  const cotisations = c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales;
  const entrees = auCentime(c.capital + c.emprunt + acompte + c.venteComptant.ttc);
  const sorties = auCentime(c.loyer.montant + c.immobilisation.ttc + c.personnel.net);
  const banque = auCentime(entrees - sorties);
  return {
    client: nomDuClient(v.client),
    commande: v.date - JOURS_ENTRE_COMMANDE_ET_LIVRAISON,
    acompte,
    solde,
    cotisations,
    entrees,
    sorties,
    banque,
    // Ce que les partenaires attendent encore de l'entreprise : le fournisseur et l'URSSAF.
    aPayer: auCentime(c.achat.ttc + cotisations),
  };
}

export const L_ACOMPTE_DU_CLIENT: Situation = {
  code: "l-acompte-du-client",
  parcours: "comptabilite-generale",
  palier: 1,
  blocs: [],
  reprend: ["les-flux-de-l-entreprise"],
  commanditaire: "Le gérant",
  titre: "L'acompte du client",
  accroche:
    "Le client professionnel a payé une partie de sa commande avant d'être livré. Le gérant veut savoir ce que le relevé de janvier doit montrer, avant de l'ouvrir.",
  objectifs: [
    "Dire, pour chaque opération, si l'argent arrive avant, avec ou après le flux réel",
    "Reconnaître un flux financier qui n'a pas de flux réel en face",
    "Calculer les entrées et les sorties d'argent d'un mois, et la banque à la fin du mois",
    "Dire ce que les partenaires doivent encore, ou attendent de l'entreprise",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const r = acompteDuClient(c);
        return [
          `« En commandant, ${r.client} nous a versé un acompte de ${pct(ACOMPTE_A_LA_COMMANDE)}, avant la livraison ; le reste se paiera à l'échéance. La banque va m'envoyer le relevé de janvier. Avant de l'ouvrir, je veux savoir ce qui a dû entrer et sortir de notre compte depuis notre création, le ${date(1)}, ce qu'il doit nous rester au 31 janvier, et ce que nos partenaires nous doivent encore ou attendent de nous. »`,
          "Pas de cours cette fois : vous avez les opérations du mois, taxes comprises, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = acompteDuClient(c);
        return {
          titre: `Les opérations de janvier · ${c.entreprise}`,
          colonnes: ["Date", "Montant"],
          lignes: [
            { libelle: "Apport des associés, versé en banque", valeurs: [date(c.dates.capital), eur(c.capital)] },
            { libelle: "Prêt de la banque, versé sur le compte", valeurs: [date(c.dates.emprunt), eur(c.emprunt)] },
            { libelle: "Loyer du local, prélevé", valeurs: [date(c.loyer.date), eur(c.loyer.montant)] },
            { libelle: `Équipement « ${c.immobilisation.designation} », livré et payé à réception`, valeurs: [date(c.immobilisation.date), eur(c.immobilisation.ttc)] },
            { libelle: `Achat chez ${c.achat.fournisseur}, livré, payable le ${date(c.achat.echeance)}`, valeurs: [date(c.achat.date), eur(c.achat.ttc)] },
            { libelle: `Commande ${de(r.client)} : acompte de ${pct(ACOMPTE_A_LA_COMMANDE)}, versé à la commande`, valeurs: [date(r.commande), eur(r.acompte)] },
            { libelle: `Livraison et facture ${a(r.client)}, le reste ${echeanceDuReste(c)}`, valeurs: [date(c.venteCredit.date), eur(c.venteCredit.ttc)] },
            { libelle: "Salaires nets, versés aux salariés", valeurs: [date(c.personnel.date), eur(c.personnel.net)] },
            { libelle: `Cotisations sociales de janvier, à verser à l'URSSAF le ${date(c.personnel.dateUrssaf)}`, valeurs: [date(c.personnel.date), eur(r.cotisations)] },
            { libelle: "Ventes au comptant du mois, encaissées", valeurs: [date(c.venteComptant.date), eur(c.venteComptant.ttc)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le moment de l'argent pour chaque opération, les entrées et les sorties de janvier, la banque au 31 janvier, ce qui reste à venir, et votre réponse.",
    },
    {
      id: "quand",
      type: "tri",
      titre: "L'argent, quand ?",
      notions: ["payment_terms"],
      question: () =>
        `Pour chaque opération du mois, l'argent arrive-t-il avant le flux réel, le même jour, ou après ? Ou n'y a-t-il pas de flux réel du tout en face ?`,
      categories: [
        { code: "avant", libelle: "L'argent avant le flux réel" },
        { code: "ensemble", libelle: "L'argent le jour du flux réel" },
        { code: "apres", libelle: "L'argent après le flux réel" },
        { code: "sans", libelle: "De l'argent sans flux réel en face" },
      ],
      elements: (c) => {
        const r = acompteDuClient(c);
        return [
          { libelle: "Apport des associés", montant: c.capital, categorie: "sans", pourquoi: "Les associés apportent de l'argent pour lancer l'entreprise : aucun bien, aucun service ne part vers eux ce jour-là." },
          { libelle: "Prêt de la banque", montant: c.emprunt, categorie: "sans", pourquoi: "La banque prête de l'argent et en recevra plus tard : des flux financiers dans les deux sens, sans flux réel." },
          {
            libelle: `Équipement « ${c.immobilisation.designation} »`,
            montant: c.immobilisation.ttc,
            categorie: "ensemble",
            pourquoi: "Livré et payé à réception : l'équipement arrive et l'argent part le même jour.",
          },
          {
            libelle: `Achat chez ${c.achat.fournisseur}`,
            montant: c.achat.ttc,
            categorie: "apres",
            pourquoi: `Livré le ${date(c.achat.date)}, payé le ${date(c.achat.echeance)} : le flux réel part le premier, l'argent suit.`,
          },
          {
            libelle: `Acompte ${de(r.client)}`,
            montant: r.acompte,
            categorie: "avant",
            pourquoi: `Versé le ${date(r.commande)}, ${qte(JOURS_ENTRE_COMMANDE_ET_LIVRAISON)} jours avant la livraison : l'argent arrive le premier.`,
          },
          {
            libelle: `Reste de la facture ${de(r.client)}`,
            montant: r.solde,
            categorie: "apres",
            pourquoi:
              delaiDuClientPro(c).retard > 0
                ? `Livré le ${date(c.venteCredit.date)}, le client devait payer le reste le ${date(delaiDuClientPro(c).echeanceConvenue)} ; il le paie en fait le ${date(c.venteCredit.echeance)}, en retard : l'argent suit le flux réel.`
                : `Livré le ${date(c.venteCredit.date)}, le client paie le reste le ${date(c.venteCredit.echeance)} : l'argent suit le flux réel.`,
          },
          { libelle: "Ventes au comptant", montant: c.venteComptant.ttc, categorie: "ensemble", pourquoi: "Les clients paient sur-le-champ : le flux réel et le flux financier tombent ensemble." },
        ];
      },
      explication: (c) => {
        const r = acompteDuClient(c);
        return [
          `La même vente ${a(r.client)} a deux moments d'argent : ${eur(r.acompte)} avant la livraison, ${eur(r.solde)} après. Entre les deux, le client a payé une partie de ce qu'il n'avait pas encore reçu ; puis, une fois livré, il doit le reste.`,
        ];
      },
    },
    {
      id: "banque",
      type: "montants",
      titre: "La banque au 31 janvier",
      notions: ["cash_budget"],
      question: () =>
        `Le compte bancaire était vide le ${date(1)}, jour de la création. Quel est le total de ce qui y est entré en janvier, le total de ce qui en est sorti, et ce qu'il doit porter au 31 janvier ?`,
      champs: (c) => {
        const r = acompteDuClient(c);
        return [
          {
            libelle: "Total des entrées de janvier",
            attendu: r.entrees,
            calcul: `${eur(c.capital)} + ${eur(c.emprunt)} + ${eur(r.acompte)} + ${eur(c.venteComptant.ttc)} = ${eur(r.entrees)}`,
          },
          {
            libelle: "Total des sorties de janvier",
            attendu: r.sorties,
            calcul: `${eur(c.loyer.montant)} + ${eur(c.immobilisation.ttc)} + ${eur(c.personnel.net)} = ${eur(r.sorties)}`,
          },
          { libelle: "Banque au 31 janvier", attendu: r.banque, calcul: `${eur(r.entrees)} − ${eur(r.sorties)} = ${eur(r.banque)}` },
        ];
      },
      explication: (c) => {
        const r = acompteDuClient(c);
        return [
          `Entrent l'apport, le prêt, l'acompte et les ventes au comptant ; sortent le loyer, l'équipement et les salaires nets. Le fournisseur, l'URSSAF et le reste de la facture ${de(r.client)} ne passent pas par la banque en janvier : leur argent bougera plus tard.`,
          `Les entrées comptent ${eur(c.capital + c.emprunt)} d'apport et de prêt : la banque du 31 janvier dit ce dont ${c.entreprise} dispose, pas ce qu'elle a gagné.`,
        ];
      },
    },
    {
      id: "a-venir",
      type: "montants",
      titre: "Ce qui reste à venir",
      notions: ["payment_terms"],
      question: (c) => {
        const r = acompteDuClient(c);
        return `Au 31 janvier, que doit encore ${r.client} à ${c.entreprise} ? Et que doit encore ${c.entreprise} à son fournisseur et à l'URSSAF, réunis ?`;
      },
      champs: (c) => {
        const r = acompteDuClient(c);
        return [
          { libelle: "Ce que le client doit encore", attendu: r.solde, calcul: `${eur(c.venteCredit.ttc)} − ${eur(r.acompte)} = ${eur(r.solde)}` },
          { libelle: "Ce que l'entreprise doit au fournisseur et à l'URSSAF", attendu: r.aPayer, calcul: `${eur(c.achat.ttc)} + ${eur(r.cotisations)} = ${eur(r.aPayer)}` },
        ];
      },
      explication: (c) => {
        const r = acompteDuClient(c);
        return [
          `${eur(r.solde)} entreront le ${date(c.venteCredit.echeance)} ; ${eur(c.achat.ttc)} sortiront le ${date(c.achat.echeance)} et ${eur(r.cotisations)} le ${date(c.personnel.dateUrssaf)}. Le flux réel a déjà eu lieu : il ne reste que l'argent à faire circuler.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["payment_terms", "cash_budget"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = acompteDuClient(c);
        return [
          {
            texte: `La banque doit porter ${eur(r.banque)} ; le client nous doit encore ${eur(r.solde)}`,
            juste: true,
            retour: `Oui : ${eur(r.entrees)} sont entrés, dont l'acompte de ${eur(r.acompte)}, et ${eur(r.sorties)} sont sortis. Le reste de la facture, ${eur(r.solde)}, arrivera le ${date(c.venteCredit.echeance)}.`,
          },
          {
            texte: `La banque doit porter ${eur(r.banque + r.solde)} : le client est livré, sa facture est donc payée`,
            juste: false,
            retour: `Non : la livraison est le flux réel ; l'argent ne la suit pas le même jour. Le client n'a versé que l'acompte, ${eur(r.acompte)} ; les ${eur(r.solde)} restants n'arriveront que le ${date(c.venteCredit.echeance)}.`,
          },
          {
            texte: `La banque doit porter ${eur(r.banque - r.acompte)} : la vente à crédit ne rapporte rien avant l'échéance`,
            juste: false,
            retour: `Non : c'est oublier l'acompte. ${r.client.charAt(0).toUpperCase()}${r.client.slice(1)} a versé ${eur(r.acompte)} le ${date(r.commande)}, avant même la livraison : l'argent est déjà en banque.`,
          },
          {
            texte: `La banque doit porter ${eur(r.banque - c.achat.ttc)}, une fois payé le fournisseur qui nous a livrés`,
            juste: false,
            retour: `Non : ${c.achat.fournisseur} a livré, mais sera payé le ${date(c.achat.echeance)}. En janvier, ses ${eur(c.achat.ttc)} ne sont pas sortis de la banque.`,
          },
        ];
      },
    },
  ],
};
