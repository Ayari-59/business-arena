import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../../pedagogy/cours/etats";
import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { dE, delaiDuClient, janvierDe, nomDuClient, paiementDuClient } from "../../chapitres/creation-premier-bilan";
import { dateDuCours as date } from "../../dates";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DE LA CRÉATION AU PREMIER BILAN » : LA COMMANDE DU 31 JANVIER
 * (comptabilité générale, palier 2).
 *
 * Le journal de janvier est passé. Le dernier jour du mois, le client professionnel du cas repasse
 * commande, avec une enveloppe fixée toutes taxes comprises : autant d'unités que possible pour ce
 * budget. La commande est livrée le jour même. Le gérant veut savoir, avant de facturer, combien
 * d'unités il peut livrer, et ce que cette vente change au résultat de janvier, à la TVA du mois et à
 * la banque. L'élève remonte de l'enveloppe TTC à la quantité (un calcul à rebours, au curseur),
 * établit la facture, la passe au journal, calcule ce qui bouge et ce qui ne bouge pas, juge le cas
 * d'une livraison qui glisserait en février (le rattachement), puis rend sa réponse.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le journal de janvier est celui du chapitre, repris en une
 * balance (`ouverture`), sur le cas figé de l'entreprise (monde/cas-des-entreprises.ts) ; les prix et
 * le délai du client sont ceux du cas. Il se joue dans les neuf entreprises du cours, comme son
 * chapitre.
 */

/**
 * L'enveloppe du client, hypothèse du cours : la moitié de sa première commande, toutes taxes
 * comprises, arrondie à la centaine d'euros supérieure. Une commande de réassort, plus petite que
 * celle qui a ouvert son compte.
 */
export const PART_DE_LA_PREMIERE_COMMANDE = 0.5;
export const ARRONDI_DE_L_ENVELOPPE = 100;

/** Le client commande, et il est livré, le dernier jour de janvier. */
export const JOUR_DE_LA_COMMANDE = 31;

/** La livraison qui glisserait, dans la question du rattachement : le 2 février. */
export const JOUR_DE_LA_LIVRAISON_DECALEE = 33;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
const resultatEcrit = (x: number) => (x >= 0 ? `un bénéfice de ${eur(x)}` : `une perte de ${eur(-x)}`);
const tvaEcrite = (x: number) => (x >= 0 ? `${eur(x)} de TVA à reverser à l'État` : `un crédit de TVA de ${eur(-x)}`);

/** Janvier tel que le journal le porte, puis la commande et ce qu'elle change. */
export function commandeDu31Janvier(c: Cas) {
  const v = c.venteCredit;
  const j = janvierDe(c);
  // L'enveloppe du client, puis la quantité la plus grande qu'elle paie, taxes comprises.
  const enveloppe = Math.ceil((v.ttc * PART_DE_LA_PREMIERE_COMMANDE) / ARRONDI_DE_L_ENVELOPPE - 1e-9) * ARRONDI_DE_L_ENVELOPPE;
  const prixTtc = auCentime(v.prixUnitaire * (1 + v.tauxTva));
  const quantite = Math.floor(enveloppe / prixTtc + 1e-9);
  // L'erreur classique : diviser l'enveloppe TTC par le prix hors taxes.
  const quantiteAuHorsTaxes = Math.floor(enveloppe / v.prixUnitaire + 1e-9);
  // La nouvelle facture, au prix et au taux de la première.
  const ht = auCentime(quantite * v.prixUnitaire);
  const tvaFacture = auCentime(ht * v.tauxTva);
  const ttc = auCentime(ht + tvaFacture);
  return {
    produits: j.produits,
    charges: j.charges,
    resultat: j.resultat,
    collectee: j.collectee,
    deductible: j.deductible,
    tva: j.tvaNette,
    banque: j.banque,
    creances: j.creances,
    enveloppe,
    prixTtc,
    quantiteAuHorsTaxes,
    facture: { quantite, ht, tva: tvaFacture, ttc, echeance: JOUR_DE_LA_COMMANDE + v.delai },
    resteDeLEnveloppe: auCentime(enveloppe - ttc),
    resultatApres: auCentime(j.resultat + ht),
    tvaApres: auCentime(j.tvaNette + tvaFacture),
    creancesApres: auCentime(j.creances + ttc),
  };
}

/** Le journal de janvier, déjà passé, en une balance : les soldes du chapitre au 31 janvier. */
function journalDeJanvier(c: Cas): Ecriture {
  const s = janvierDe(c).soldes;
  return {
    date: date(JOUR_DE_LA_COMMANDE),
    libelle: "Le journal de janvier, déjà passé : ses soldes",
    lignes: Object.keys(s)
      .filter((k) => s[k] !== 0)
      .sort()
      .map((compte) => ({ compte, debit: s[compte]! > 0 ? s[compte]! : 0, credit: s[compte]! < 0 ? -s[compte]! : 0 })),
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
    "Le dernier jour de janvier, le client professionnel repasse commande pour une enveloppe toutes taxes comprises. Avant de facturer, le gérant veut savoir combien livrer, et ce que cette vente change au résultat, à la TVA et à la banque du mois.",
  objectifs: [
    "Remonter d'une enveloppe toutes taxes comprises à une quantité, sans confondre HT et TTC",
    "Établir une facture de vente et la passer en partie double",
    "Dire ce qu'une vente change au résultat, à la TVA du mois, aux créances et à la banque",
    "Rattacher une vente au bon mois, et rédiger une réponse chiffrée au gérant",
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
        const client = nomDuClient(c.venteCredit.client);
        return [
          `« ${majuscule(client)} vient de repasser commande : autant ${dE(c.unites)} que possible, au même prix que la première fois, pour une enveloppe de ${eur(k.enveloppe)} toutes taxes comprises. La commande est livrée aujourd'hui ; ${client} ${paiementDuClient(c)}. Combien puis-je en livrer ? Si je facture ce soir, la vente compte-t-elle dans le mois ? Dites-moi ce que deviennent notre résultat de janvier, la TVA du mois et la banque au 31 janvier. »`,
          "Le journal de janvier est passé : vous le trouvez déjà saisi, en une balance. Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = commandeDu31Janvier(c);
        const d = delaiDuClient(c);
        return {
          titre: `Janvier et la nouvelle commande · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Produits de janvier, hors taxes", valeurs: [eur(k.produits)] },
            { libelle: "Charges de janvier", valeurs: [eur(k.charges)] },
            { libelle: "TVA collectée de janvier", valeurs: [eur(k.collectee)] },
            { libelle: "TVA déductible de janvier", valeurs: [eur(k.deductible)] },
            { libelle: "Banque au 31 janvier", valeurs: [eur(k.banque)] },
            { libelle: "Enveloppe du client, toutes taxes comprises", valeurs: [eur(k.enveloppe)] },
            { libelle: `Prix hors taxes (${c.unite})`, valeurs: [eur(c.venteCredit.prixUnitaire)] },
            { libelle: "Taux de TVA", valeurs: [pct(c.venteCredit.tauxTva)] },
            { libelle: "Délai de paiement convenu", valeurs: [`${qte(d.convenu)} jours`] },
            { libelle: "Règlement attendu", valeurs: [`à ${qte(d.reel)} jours, le ${date(k.facture.echeance)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la quantité que paie l'enveloppe, la facture, son écriture au journal, le résultat, la TVA, la créance et la banque du 31 janvier une fois la vente passée, puis votre réponse.",
    },
    {
      id: "la-quantite",
      type: "curseur",
      titre: "Ce que paie l'enveloppe",
      notions: ["vat_payable"],
      question: (c) => {
        const k = commandeDu31Janvier(c);
        return `Faites varier la quantité commandée. Une droite donne l'enveloppe du client, ${eur(k.enveloppe)} toutes taxes comprises ; l'autre, ce que coûte la commande, TVA comprise. Placez le curseur sur la plus grande quantité que l'enveloppe paie, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `${majuscule(c.unites)} ${accordPluriel(c, "commandé")}`, unite: c.unites }),
      sens: "plus-grande",
      cible: (c) => {
        const k = commandeDu31Janvier(c);
        return { attendu: k.facture.quantite, max: 2 * k.quantiteAuHorsTaxes };
      },
      zones: ["Dans l'enveloppe", "Au-delà de l'enveloppe"],
      rates: () => ({
        dessous: "L'enveloppe paie encore plus : cherchez la plus grande quantité.",
        dessus: "À cette quantité, la commande coûte déjà plus que l'enveloppe, TVA comprise.",
      }),
      montrer: "Montrer la quantité",
      lecture: (c, q) => {
        const k = commandeDu31Janvier(c);
        const ht = auCentime(q * c.venteCredit.prixUnitaire);
        const ttc = auCentime(ht + auCentime(ht * c.venteCredit.tauxTva));
        return [
          { libelle: "Commande hors taxes", montant: ht },
          { libelle: "Commande toutes taxes comprises", montant: ttc },
          { libelle: "Reste de l'enveloppe", montant: auCentime(k.enveloppe - ttc), fort: true },
        ];
      },
      droites: (c) => {
        const k = commandeDu31Janvier(c);
        return {
          produit: () => k.enveloppe,
          cout: (q) => q * k.prixTtc,
          libelles: ["Enveloppe du client, TTC", "Commande, TVA comprise"],
        };
      },
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `L'enveloppe paie ${qte(k.facture.quantite)} ${c.unites} : à ${eur(k.prixTtc)} l'unité toutes taxes comprises, il en reste ${eur(k.resteDeLEnveloppe)}. Une enveloppe TTC se divise par le prix TTC : divisée par le prix hors taxes, elle annoncerait ${qte(k.quantiteAuHorsTaxes)} ${c.unites}, que le client ne pourrait pas payer.`,
        ];
      },
    },
    {
      id: "facture",
      type: "montants",
      titre: "La facture",
      notions: ["vat_payable"],
      question: (c) => {
        const k = commandeDu31Janvier(c);
        return `Établissez la facture des ${qte(k.facture.quantite)} ${c.unites}.`;
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
          `Le client devra ${eur(k.facture.ttc)}, dans son enveloppe. Mais ${c.entreprise} ne gagne que le hors taxes, ${eur(k.facture.ht)} : la TVA, ${eur(k.facture.tva)}, elle la collecte pour l'État.`,
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
        return `Le ${date(JOUR_DE_LA_COMMANDE)}, ${c.entreprise} livre et facture ${nomDuClient(c.venteCredit.client)} : ${eur(k.facture.ttc)} toutes taxes comprises.`;
      },
      piece: (c) => {
        const k = commandeDu31Janvier(c);
        const d = delaiDuClient(c);
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
          mention: `Payable à ${qte(d.convenu)} jours, le ${date(JOUR_DE_LA_COMMANDE + d.convenu)}.`,
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
      indices: () => [
        "Une vente : un produit, classe 7. Le client n'a pas payé : rien ne passe par la banque.",
        "Au débit, ce que le client doit, taxes comprises ; au crédit, ce que l'entreprise gagne et ce qu'elle doit à l'État.",
      ],
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `La vente entre au compte de résultat de janvier pour ${eur(k.facture.ht)}, le jour de la livraison et de la facture. La créance sur ${nomDuClient(c.venteCredit.client)} grossit de ${eur(k.facture.ttc)} ; elle ne deviendra de l'argent que le ${date(k.facture.echeance)}.`,
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
        "Une fois la facture passée, que valent au 31 janvier le résultat du mois, la TVA du mois (négative si l'État doit de l'argent à l'entreprise), la créance sur le client et la banque ?",
      champs: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          { libelle: "Résultat de janvier, la vente comprise", attendu: k.resultatApres, calcul: `${eur(k.produits)} + ${eur(k.facture.ht)} − ${eur(k.charges)} = ${eur(k.resultatApres)}` },
          { libelle: "TVA collectée moins TVA déductible", attendu: k.tvaApres, calcul: `${eur(k.collectee)} + ${eur(k.facture.tva)} − ${eur(k.deductible)} = ${eur(k.tvaApres)}` },
          { libelle: "Créance sur le client", attendu: k.creancesApres, calcul: `${eur(k.creances)} + ${eur(k.facture.ttc)} = ${eur(k.creancesApres)}` },
          { libelle: "Banque au 31 janvier", attendu: k.banque, calcul: `rien n'a bougé : ${eur(k.banque)}` },
        ];
      },
      explication: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          `Sans la commande, ${c.entreprise} faisait ${resultatEcrit(k.resultat)} en janvier ; avec elle, ${resultatEcrit(k.resultatApres)}. La TVA du mois passe à ${tvaEcrite(k.tvaApres)} : elle est due sur la facture, avant que le client ait payé.`,
          `La banque, elle, reste à ${eur(k.banque)} : le résultat compte la vente à la facture, la banque l'argent le jour où il arrive. Ce qui a grossi, c'est la créance : ${eur(k.creancesApres)}.`,
        ];
      },
    },
    {
      id: "le-rattachement",
      type: "choix",
      titre: "Et si la livraison glissait ?",
      notions: ["revenue", "income_statement"],
      question: () =>
        `Le gérant ajoute : « Et si le transporteur ne livrait que le ${date(JOUR_DE_LA_LIVRAISON_DECALEE)} ? Je facturerais quand même ce soir, pour que la vente compte en janvier. » Que lui répondez-vous ?`,
      options: (c) => {
        const k = commandeDu31Janvier(c);
        return [
          {
            texte: `Livrée le ${date(JOUR_DE_LA_LIVRAISON_DECALEE)}, la vente appartient à février`,
            juste: true,
            retour: `Oui : un produit se rattache à la période où le bien est livré ou le service rendu. Facturer avant la livraison avancerait ${eur(k.facture.ht)} de produit dans un mois qui ne l'a pas gagné ; à une clôture, ce serait un produit constaté d'avance.`,
          },
          {
            texte: "Elle compte en janvier : c'est la date de la facture qui fait le mois de la vente",
            juste: false,
            retour: "Non : la facture constate une vente, elle ne la crée pas. Sans livraison en janvier, la vente n'appartient pas à janvier, quelle que soit la date de la facture.",
          },
          {
            texte: `Peu importe : la vente ne compterait qu'au paiement, le ${date(k.facture.echeance)}`,
            juste: false,
            retour: "Non : une vente compte à la livraison, pas au paiement. Le règlement solde la créance, il ne crée pas de produit.",
          },
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
        const u = c.unites;
        return [
          {
            texte: `Facturez ce soir ${qte(k.facture.quantite)} ${u} : janvier gagne ${eur(k.facture.ht)}, la banque rien avant le ${date(k.facture.echeance)}`,
            juste: true,
            retour: `Oui : l'enveloppe paie ${qte(k.facture.quantite)} ${u}, TVA comprise. Livrée et facturée en janvier, la vente compte en janvier pour son hors taxes : le résultat passe à ${eur(k.resultatApres)} ; la banque reste à ${eur(k.banque)} jusqu'au paiement du client.`,
          },
          {
            texte: `Facturez ce soir ${qte(k.quantiteAuHorsTaxes)} ${u} : janvier gagne ${eur(auCentime(k.quantiteAuHorsTaxes * c.venteCredit.prixUnitaire))}, la banque rien avant le ${date(k.facture.echeance)}`,
            juste: false,
            retour: `Non : ${qte(k.quantiteAuHorsTaxes)} ${u}, c'est l'enveloppe divisée par le prix hors taxes. Le client paie TVA comprise : son enveloppe ne paie que ${qte(k.facture.quantite)} ${u}.`,
          },
          {
            texte: `Facturez ce soir ${qte(k.facture.quantite)} ${u} : janvier gagne ${eur(k.facture.ttc)}, le prix que le client paiera, TVA comprise`,
            juste: false,
            retour: `Non : la TVA, ${eur(k.facture.tva)}, n'est pas un produit ; ${c.entreprise} la collecte pour l'État. Le résultat ne gagne que le hors taxes, ${eur(k.facture.ht)}.`,
          },
          {
            texte: `Facturez ce soir ${qte(k.facture.quantite)} ${u} : janvier gagne ${eur(k.facture.ht)}, et la banque ${eur(k.facture.ttc)} dès la facture envoyée`,
            juste: false,
            retour: `Non : facturer n'encaisse rien. La banque reste à ${eur(k.banque)} ; les ${eur(k.facture.ttc)} arriveront le ${date(k.facture.echeance)}.`,
          },
        ];
      },
    },
  ],
};
