import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { nomDuClient } from "../../provisions";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DE LA CRÉATION AU PREMIER BILAN » : LA COMMANDE DU
 * 31 JANVIER (comptabilité générale, palier 2).
 *
 * Le journal de janvier est passé. Le dernier jour du mois, le client professionnel du
 * cas repasse commande, livrée le jour même et payable à son délai habituel. Le gérant
 * veut savoir, avant de facturer, ce que cette vente change au résultat de janvier, à la
 * TVA du mois et à la banque. L'élève établit la facture, la passe au journal, calcule
 * ce qui bouge et ce qui ne bouge pas, puis rend sa réponse.
 *
 * Le cas est neuf par sa question : une vente de plus, la veille du bilan. Le journal
 * de janvier est celui du chapitre, repris en une balance (`ouverture`) ; les prix et le
 * délai du client sont ceux du cas (`cas.ts`).
 */

/**
 * La nouvelle commande, en part de la première : la moitié, une commande de
 * réassort, plus petite que celle qui a ouvert le compte du client.
 */
export const PART_DE_LA_PREMIERE_COMMANDE = 0.5;

/** Le client commande, et il est livré, le dernier jour de janvier. */
export const JOUR_DE_LA_COMMANDE = 31;

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const resultatEcrit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
const tvaEcrite = (x: number) => (x >= 0 ? `${eur(x)} de TVA à reverser à l'État` : `un crédit de TVA de ${eur(-x)}`);
const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/** Janvier tel que le journal le porte, puis la commande et ce qu'elle change. */
export function commandeDu31Janvier(c: Cas) {
  const v = c.venteCredit;
  const p = c.personnel;
  const produits = auCentime(v.ht + c.venteComptant.ht);
  const charges = auCentime(c.loyer.montant + c.achat.ht + p.brut + p.cotisationsPatronales);
  const resultat = auCentime(produits - charges);
  const collectee = auCentime(v.tva + c.venteComptant.tva);
  const deductible = auCentime(c.immobilisation.tva + c.achat.tva);
  const tva = auCentime(collectee - deductible);
  const banque = auCentime(c.capital + c.emprunt - c.loyer.montant - c.immobilisation.ttc - p.net + c.venteComptant.ttc);
  // La nouvelle facture, au prix et au taux de la première.
  const quantite = Math.round(v.quantite * PART_DE_LA_PREMIERE_COMMANDE);
  const ht = auCentime(quantite * v.prixUnitaire);
  const tvaFacture = auCentime(ht * v.tauxTva);
  const ttc = auCentime(ht + tvaFacture);
  return {
    produits,
    charges,
    resultat,
    collectee,
    deductible,
    tva,
    banque,
    facture: { quantite, ht, tva: tvaFacture, ttc, echeance: JOUR_DE_LA_COMMANDE + v.delai },
    resultatApres: auCentime(resultat + ht),
    tvaApres: auCentime(tva + tvaFacture),
  };
}

/** Le journal de janvier, déjà passé, en une balance : les soldes du chapitre au 31 janvier. */
function journalDeJanvier(c: Cas): Ecriture {
  const k = commandeDu31Janvier(c);
  const p = c.personnel;
  const debit = (compte: string, montant: number) => ({ compte, debit: montant, credit: 0 });
  const credit = (compte: string, montant: number) => ({ compte, debit: 0, credit: montant });
  return {
    date: date(JOUR_DE_LA_COMMANDE),
    libelle: "Le journal de janvier, déjà passé : ses soldes",
    lignes: [
      debit("512", k.banque),
      debit(c.immobilisation.compte, c.immobilisation.ht),
      debit("44562", c.immobilisation.tva),
      debit("411", c.venteCredit.ttc),
      debit("6132", c.loyer.montant),
      debit(c.achat.compte, c.achat.ht),
      debit("44566", c.achat.tva),
      debit("641", p.brut),
      debit("645", p.cotisationsPatronales),
      credit("101", c.capital),
      credit("164", c.emprunt),
      credit("401", c.achat.ttc),
      credit("431", p.cotisationsSalariales + p.cotisationsPatronales),
      credit(c.venteCredit.compte, k.produits),
      credit("44571", k.collectee),
    ],
  };
}

export const LA_COMMANDE_DU_31_JANVIER: Situation = {
  code: "la-commande-du-31-janvier",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [],
  reprend: ["creation-premier-bilan"],
  commanditaire: "Le gérant",
  titre: "La commande du 31 janvier",
  accroche:
    "Le dernier jour de janvier, le client professionnel repasse commande. Avant de facturer, le gérant veut savoir ce que cette vente change au résultat, à la TVA et à la banque du mois.",
  objectifs: [
    "Établir une facture de vente : hors taxes, TVA, toutes taxes comprises",
    "Passer une vente à crédit en partie double",
    "Dire ce qu'une vente change au résultat, à la TVA du mois et à la banque",
    "Rédiger une réponse chiffrée au gérant",
  ],
  // Libre comme le chapitre qu'il reprend (décision du propriétaire, octobre 2026 :
  // « cas pratique inclus ») : la démonstration va du chapitre à son cas pratique.
  libre: true,
  ouverture: journalDeJanvier,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `« ${majuscule(nomDuClient(c.venteCredit.client))} vient de repasser commande : ${qte(k.facture.quantite)} ${c.unites}, au même prix que la première fois. La commande est livrée aujourd'hui, payable à ${qte(c.venteCredit.delai)} jours. Si je facture ce soir, la vente compte-t-elle dans le mois ? Dites-moi ce que deviennent notre résultat de janvier, la TVA du mois et la banque au 31 janvier. »`,
          `Le journal de janvier est passé : vous le trouvez déjà saisi, en une balance. Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.`,
        ];
      },
      tableau: (c) => {
        const k = commandeDu31Janvier(c);
        return {
          titre: `Janvier et la nouvelle commande · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Produits de janvier, hors taxes", valeurs: [eur(k.produits)] },
            { libelle: "Charges de janvier", valeurs: [eur(k.charges)] },
            { libelle: "TVA collectée de janvier", valeurs: [eur(k.collectee)] },
            { libelle: "TVA déductible de janvier", valeurs: [eur(k.deductible)] },
            { libelle: "Banque au 31 janvier", valeurs: [eur(k.banque)] },
            { libelle: `Nouvelle commande : ${c.unites}`, valeurs: [qte(k.facture.quantite)] },
            { libelle: `Prix hors taxes (${c.unite})`, valeurs: [eur(c.venteCredit.prixUnitaire)] },
            { libelle: "Taux de TVA", valeurs: [pct(c.venteCredit.tauxTva)] },
            { libelle: "Paiement", valeurs: [`à ${qte(c.venteCredit.delai)} jours, le ${date(k.facture.echeance)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la facture, son écriture au journal, le résultat, la TVA et la banque du 31 janvier une fois la vente passée, et votre réponse.",
    },
    {
      id: "facture",
      type: "montants",
      titre: "La facture",
      notions: ["vat_payable"],
      question: (c) => {
        const k = commandeDu31Janvier(c);
        return `${qte(k.facture.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)} hors taxes, TVA ${pct(c.venteCredit.tauxTva)}. Calculez la facture.`;
      },
      champs: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          { libelle: "Montant hors taxes (HT)", attendu: k.facture.ht, calcul: `${qte(k.facture.quantite)} × ${eur(c.venteCredit.prixUnitaire)} = ${eur(k.facture.ht)}` },
          { libelle: "TVA", attendu: k.facture.tva, calcul: `${eur(k.facture.ht)} × ${pct(c.venteCredit.tauxTva)} = ${eur(k.facture.tva)}` },
          { libelle: "Montant toutes taxes comprises (TTC)", attendu: k.facture.ttc, calcul: `${eur(k.facture.ht)} + ${eur(k.facture.tva)} = ${eur(k.facture.ttc)}` },
        ];
      },
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `Le client devra ${eur(k.facture.ttc)}. Mais ${c.entreprise} ne gagne que le hors taxes, ${eur(k.facture.ht)} : la TVA, ${eur(k.facture.tva)}, elle la collecte pour l'État.`,
        ];
      },
    },
    {
      id: "ecriture",
      type: "ecriture",
      titre: "La facture, au journal",
      notions: ["revenue", "payment_terms", "vat_payable"],
      evenement: (c) => {
        const k = commandeDu31Janvier(c);
        return `Le ${date(JOUR_DE_LA_COMMANDE)}, ${c.entreprise} livre et facture ${nomDuClient(c.venteCredit.client)} : ${eur(k.facture.ttc)} toutes taxes comprises, payables le ${date(k.facture.echeance)}.`;
      },
      piece: (c) => {
        const k = commandeDu31Janvier(c);
        return {
          nature: "Facture de vente",
          de: c.entreprise,
          a: c.venteCredit.client,
          date: date(JOUR_DE_LA_COMMANDE),
          lignes: [{ libelle: majuscule(c.unites), quantite: qte(k.facture.quantite), prixUnitaire: c.venteCredit.prixUnitaire, montant: k.facture.ht }],
          totaux: [
            { libelle: "Total hors taxes", montant: k.facture.ht },
            { libelle: `TVA ${pct(c.venteCredit.tauxTva)}`, montant: k.facture.tva },
            { libelle: "Total TTC", montant: k.facture.ttc, fort: true },
          ],
          mention: `Payable à ${qte(c.venteCredit.delai)} jours, le ${date(k.facture.echeance)}.`,
        };
      },
      ecriture: (c) => {
        const k = commandeDu31Janvier(c);
        return {
          date: date(JOUR_DE_LA_COMMANDE),
          libelle: "Facture de vente à échéance",
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: k.facture.ttc, indice: "ce que le client devra payer, taxes comprises" },
            { role: "la vente, au prix hors taxes", compte: c.venteCredit.compte, acceptes: c.venteCredit.acceptes, sens: "credit", montant: k.facture.ht, indice: "le montant hors taxes de la facture" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: k.facture.tva, indice: "le montant de TVA de la facture" },
          ],
        };
      },
      indices: (c) => [
        "Une vente : un produit, classe 7. Le client n'a pas payé : rien ne passe par la banque.",
        `Au débit, la créance sur le client pour le TTC (411). Au crédit, la vente hors taxes (${c.venteCredit.compte}) et la TVA collectée pour l'État (44571).`,
      ],
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `La vente entre au compte de résultat de janvier pour ${eur(k.facture.ht)}, le jour de la facture. La créance sur ${nomDuClient(c.venteCredit.client)} grossit de ${eur(k.facture.ttc)} ; elle ne deviendra de l'argent que le ${date(k.facture.echeance)}.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "ce-qui-change",
      type: "montants",
      titre: "Ce que la vente change",
      notions: ["income_statement", "vat_payable", "net_treasury"],
      question: () =>
        "Une fois la facture passée, quel est le résultat de janvier ? Que vaut la TVA du mois, collectée moins déductible (un nombre négatif si l'État doit de l'argent à l'entreprise) ? Et que porte la banque au 31 janvier ?",
      champs: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          {
            libelle: "Résultat de janvier, la vente comprise",
            attendu: k.resultatApres,
            calcul: `${eur(k.produits)} + ${eur(k.facture.ht)} − ${eur(k.charges)} = ${eur(k.resultatApres)}`,
          },
          {
            libelle: "TVA collectée moins TVA déductible",
            attendu: k.tvaApres,
            calcul: `${eur(k.collectee)} + ${eur(k.facture.tva)} − ${eur(k.deductible)} = ${eur(k.tvaApres)}`,
          },
          { libelle: "Banque au 31 janvier", attendu: k.banque, calcul: `rien n'a bougé : ${eur(k.banque)}` },
        ];
      },
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `Sans la commande, ${c.entreprise} faisait ${resultatEcrit(k.resultat)} en janvier ; avec elle, ${resultatEcrit(k.resultatApres)}. La TVA du mois passe à ${tvaEcrite(k.tvaApres)}.`,
          `La banque, elle, reste à ${eur(k.banque)} : le résultat compte la vente à la facture, la banque l'argent le jour où il arrive.`,
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
        const k = commandeDu31Janvier(c);
        return [
          {
            texte: `Facturez ce soir : le résultat de janvier gagne ${eur(k.facture.ht)}, la banque rien avant le ${date(k.facture.echeance)}`,
            juste: true,
            retour: `Oui : la vente compte en janvier, au jour de la facture, pour son hors taxes. Le résultat passe à ${eur(k.resultatApres)} ; la banque reste à ${eur(k.banque)} jusqu'au paiement du client.`,
          },
          {
            texte: `Facturez ce soir : le résultat de janvier gagne ${eur(k.facture.ttc)}, le prix que le client paiera, TVA comprise`,
            juste: false,
            retour: `Non : la TVA, ${eur(k.facture.tva)}, n'est pas un produit ; ${c.entreprise} la collecte pour l'État. Le résultat ne gagne que le hors taxes, ${eur(k.facture.ht)}.`,
          },
          {
            texte: `Peu importe la date : la vente ne comptera dans le résultat que le ${date(k.facture.echeance)}, quand le client paiera`,
            juste: false,
            retour: `Non : une vente naît à la facture, pas au paiement. Facturée le ${date(JOUR_DE_LA_COMMANDE)}, elle compte dans le résultat de janvier pour ${eur(k.facture.ht)}.`,
          },
          {
            texte: `Facturez ce soir : le résultat gagne ${eur(k.facture.ht)} et la banque ${eur(k.facture.ttc)}, dès la facture envoyée`,
            juste: false,
            retour: `Non : facturer n'encaisse rien. La banque reste à ${eur(k.banque)} ; les ${eur(k.facture.ttc)} arriveront le ${date(k.facture.echeance)}.`,
          },
        ];
      },
    },
  ],
};
