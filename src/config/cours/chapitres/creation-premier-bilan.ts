import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { bilan, compteDeResultat, tvaNette } from "../../../pedagogy/cours/etats";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { Facture } from "../cas";
import { dateDuCours as date } from "../dates";
import type { Chapitre, EtatDuCours, Piece } from "../types";

/**
 * CHAPITRE PILOTE : DE LA CRÉATION AU PREMIER BILAN (comptabilité générale, palier 2).
 *
 * Un mois de la vie d'une entreprise qu'on crée, opération par opération : les
 * apports, l'emprunt, le loyer, l'équipement, un achat et deux ventes, la paie,
 * puis le compte de résultat, la TVA et le bilan du 31 janvier, que l'élève
 * construit lui-même à partir de son journal. On finit par les échéances : le
 * fournisseur et l'URSSAF payés, le client qui règle, et le constat qui ouvre la suite du
 * cours : le résultat n'a pas bougé, la trésorerie si.
 *
 * Tous les montants viennent du cas de l'entreprise choisie (`cas.ts`).
 */

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

const banqueDe = (e: EtatDuCours) => e.soldes["512"] ?? 0;

function facturePiece(args: {
  nature: string;
  de: string;
  a: string;
  quand: number;
  designation: string;
  f: Facture;
  mention?: string;
}): Piece {
  const { f } = args;
  return {
    nature: args.nature,
    de: args.de,
    a: args.a,
    date: date(args.quand),
    lignes: [{ libelle: args.designation, quantite: qte(f.quantite), prixUnitaire: f.prixUnitaire, montant: f.ht }],
    totaux: [
      { libelle: "Total hors taxes", montant: f.ht },
      { libelle: `TVA ${pct(f.tauxTva)}`, montant: f.tva },
      { libelle: "Total TTC", montant: f.ttc, fort: true },
    ],
    mention: args.mention,
  };
}

export const CREATION_PREMIER_BILAN: Chapitre = {
  code: "creation-premier-bilan",
  parcours: "comptabilite-generale",
  palier: 2,
  blocs: [
    "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
    "BTS CG P2 · Contrôle et production de l'information financière",
    "BTS CG P3 · Gestion des obligations fiscales",
    "BTS CG P4 · Gestion des relations sociales",
    "DCG UE9 · Comptabilité",
  ],
  titre: "De la création au premier bilan",
  accroche:
    "Un mois de la vie d'une entreprise qu'on crée : vous passez chaque écriture, puis vous construisez vous-même son compte de résultat et son bilan.",
  objectifs: [
    "Passer une écriture en partie double dans le journal",
    "Distinguer une charge, une immobilisation et un simple règlement",
    "Calculer et enregistrer la TVA déductible et la TVA collectée",
    "Enregistrer la paie : salaires bruts, cotisations, net à payer, règlement à l'URSSAF",
    "Construire le compte de résultat et le bilan à partir du journal",
    "Expliquer pourquoi le résultat n'est pas la trésorerie",
  ],
  libre: true,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La partie double",
      notions: ["balance_sheet"],
      texte: (c) => [
        `Vous tenez la comptabilité de ${c.entreprise} depuis sa création, le 1er janvier. Chaque opération du mois arrive avec sa pièce : un relevé de banque, une facture, une quittance. Vous l'enregistrez dans le journal, puis la simulation montre ce qu'elle change dans les comptes de l'entreprise.`,
        "Une opération s'écrit toujours deux fois, sur deux comptes au moins : c'est la partie double. Quand l'entreprise reçoit 100 € sur son compte bancaire, il faut dire aussi d'où ils viennent.",
        "Les comptes portent un numéro. Le premier chiffre dit leur famille : 1 les capitaux, 2 les immobilisations, 4 les tiers (clients, fournisseurs, État), 5 la trésorerie, 6 les charges, 7 les produits. Le plan de comptes du cours reste ouvert à côté du journal.",
      ],
      repere: () =>
        "Au débit, ce que l'entreprise reçoit ou consomme (l'emploi). Au crédit, d'où cela vient (la ressource). Dans chaque écriture, le total du débit est égal au total du crédit.",
    },
    {
      id: "apport",
      type: "ecriture",
      titre: "Les apports des associés",
      notions: ["balance_sheet"],
      evenement: (c) =>
        `Le ${date(c.dates.capital)}, les associés de ${c.entreprise} versent ${eur(c.capital)} sur le compte bancaire de l'entreprise : c'est leur apport en capital.`,
      piece: (c) => ({
        nature: "Relevé bancaire",
        de: "Votre banque",
        a: c.entreprise,
        date: date(c.dates.capital),
        lignes: [{ libelle: "Virement reçu des associés : apport en capital", montant: c.capital }],
        totaux: [{ libelle: "Crédit en votre faveur", montant: c.capital, fort: true }],
      }),
      ecriture: (c) => ({
        date: date(c.dates.capital),
        libelle: "Apport en capital",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.capital, indice: "la somme versée par les associés" },
          { role: "l'apport des associés", compte: "101", acceptes: ["108"], sens: "credit", montant: c.capital, indice: "la somme versée par les associés" },
        ],
      }),
      indices: () => [
        "L'argent arrive sur le compte bancaire de l'entreprise : c'est un compte de trésorerie, classe 5.",
        "D'où vient-il ? Des associés, qui apportent le capital de départ : classe 1.",
      ],
      explication: (c) => [
        `La banque reçoit ${eur(c.capital)} : c'est ce que l'entreprise reçoit, au débit du 512.`,
        `Le capital dit d'où vient cet argent : des associés. C'est une ressource durable, au crédit du 101. L'entreprise ne la rembourse pas, mais elle la doit à ses associés : elle figure au passif.`,
        "Le bilan s'équilibre déjà : à l'actif, ce que l'entreprise possède (la banque) ; au passif, d'où cela vient (le capital).",
      ],
      vue: "bilan",
    },
    {
      id: "emprunt",
      type: "ecriture",
      titre: "L'emprunt bancaire",
      notions: ["loan_schedule"],
      evenement: (c) =>
        `Le ${date(c.dates.emprunt)}, la banque accorde un prêt de ${eur(c.emprunt)} à ${c.entreprise} et verse les fonds sur son compte.`,
      piece: (c) => ({
        nature: "Contrat de prêt et relevé bancaire",
        de: "Votre banque",
        a: c.entreprise,
        date: date(c.dates.emprunt),
        lignes: [{ libelle: "Déblocage des fonds du prêt", montant: c.emprunt }],
        totaux: [{ libelle: "Crédit en votre faveur", montant: c.emprunt, fort: true }],
        mention: "Remboursement par échéances, intérêts en sus.",
      }),
      ecriture: (c) => ({
        date: date(c.dates.emprunt),
        libelle: "Emprunt bancaire",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.emprunt, indice: "le montant prêté" },
          { role: "la dette envers la banque", compte: "164", acceptes: ["1641"], sens: "credit", montant: c.emprunt, indice: "le montant prêté" },
        ],
      }),
      indices: () => [
        "Comme pour l'apport, l'argent arrive en banque.",
        "Cette fois, il vient d'un prêteur qu'il faudra rembourser : une dette financière, classe 1 aussi.",
      ],
      explication: (c, e) => [
        `La banque de l'entreprise atteint ${eur(banqueDe(e))}. L'emprunt de ${eur(c.emprunt)} est une ressource, comme le capital, mais elle se rembourse : c'est une dette, au passif.`,
      ],
      vue: "bilan",
    },
    {
      id: "emprunt-charge",
      type: "choix",
      titre: "Un emprunt, une charge ?",
      notions: ["loan_schedule"],
      question: (c) => `Les ${eur(c.emprunt)} empruntés sont-ils une charge de janvier pour ${c.entreprise} ?`,
      options: () => [
        {
          texte: "Oui : emprunter coûte de l'argent.",
          juste: false,
          retour:
            "Ce qui coûte, ce sont les intérêts, payés au fil des échéances : eux seront des charges (compte 661). Le capital emprunté, lui, se rend.",
        },
        {
          texte: "Non : c'est une ressource, une dette qu'il faudra rembourser.",
          juste: true,
          retour:
            "Exactement. L'emprunt ne change pas le résultat : il ajoute la même somme à l'actif (la banque) et au passif (la dette).",
        },
        {
          texte: "Non : c'est un produit, l'entreprise s'enrichit.",
          juste: false,
          retour: "L'entreprise n'est pas plus riche : elle a reçu de l'argent qu'elle doit rendre. L'actif et le passif augmentent ensemble.",
        },
      ],
    },
    {
      id: "loyer",
      type: "ecriture",
      titre: "Le loyer du local",
      notions: ["fixed_costs"],
      evenement: (c) =>
        `Le ${date(c.loyer.date)}, le loyer de janvier du local est prélevé : ${eur(c.loyer.montant)}. Le bailleur n'a pas opté pour la TVA : la quittance est sans TVA.`,
      piece: (c) => ({
        nature: "Quittance de loyer",
        de: "Le bailleur",
        a: c.entreprise,
        date: date(c.loyer.date),
        lignes: [{ libelle: "Loyer du local, mois de janvier", montant: c.loyer.montant }],
        totaux: [{ libelle: "Net à payer, prélevé", montant: c.loyer.montant, fort: true }],
      }),
      ecriture: (c) => ({
        date: date(c.loyer.date),
        libelle: "Loyer de janvier",
        lignes: [
          { role: "le loyer, consommé dans le mois", compte: "6132", acceptes: ["613"], sens: "debit", montant: c.loyer.montant, indice: "le montant de la quittance" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.loyer.montant, indice: "le montant de la quittance" },
        ],
      }),
      indices: () => [
        "L'occupation du local pendant janvier est consommée dans le mois : c'est une charge, classe 6 (les locations).",
        "La banque paie : l'argent sort, au crédit du compte de trésorerie.",
      ],
      explication: (c) => [
        `Le loyer est une charge : ${c.entreprise} a consommé un mois d'occupation du local. Il entre au compte de résultat, au débit du 6132.`,
        "Premier effet sur le résultat : sans aucune vente encore, il est négatif du montant du loyer.",
      ],
      vue: "resultat",
    },
    {
      id: "tva-immo",
      type: "montants",
      titre: "Le calcul de la facture",
      notions: ["vat_payable"],
      question: (c) =>
        `${c.entreprise} commande son équipement : ${qte(c.immobilisation.quantite)} × « ${c.immobilisation.designation} » à ${eur(c.immobilisation.prixUnitaire)} hors taxes l'unité, TVA ${pct(c.immobilisation.tauxTva)}. Calculez la facture.`,
      champs: (c) => [
        { libelle: "Montant hors taxes (HT)", attendu: c.immobilisation.ht, calcul: `${qte(c.immobilisation.quantite)} × ${eur(c.immobilisation.prixUnitaire)} = ${eur(c.immobilisation.ht)}` },
        { libelle: "TVA", attendu: c.immobilisation.tva, calcul: `${eur(c.immobilisation.ht)} × ${pct(c.immobilisation.tauxTva)} = ${eur(c.immobilisation.tva)}` },
        { libelle: "Montant toutes taxes comprises (TTC)", attendu: c.immobilisation.ttc, calcul: `${eur(c.immobilisation.ht)} + ${eur(c.immobilisation.tva)} = ${eur(c.immobilisation.ttc)}` },
      ],
      explication: () => [
        "Le prix hors taxes est ce que l'équipement coûte vraiment à l'entreprise. La TVA s'ajoute, l'entreprise la paie au fournisseur, mais l'État la lui rendra : c'est la TVA déductible.",
      ],
    },
    {
      id: "immobilisation",
      type: "ecriture",
      titre: "L'achat de l'équipement",
      notions: ["depreciation", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.immobilisation.date)}, ${c.entreprise} reçoit son équipement et règle la facture par virement : ${eur(c.immobilisation.ttc)} TTC.`,
      piece: (c) =>
        facturePiece({
          nature: "Facture d'achat",
          de: "Le fournisseur d'équipement",
          a: c.entreprise,
          quand: c.immobilisation.date,
          designation: c.immobilisation.designation,
          f: c.immobilisation,
          mention: "Réglée par virement à réception.",
        }),
      ecriture: (c) => ({
        date: date(c.immobilisation.date),
        libelle: `Achat : ${c.immobilisation.designation}`,
        lignes: [
          { role: "l'équipement, au prix hors taxes", compte: c.immobilisation.compte, acceptes: c.immobilisation.acceptes, sens: "debit", montant: c.immobilisation.ht, indice: "le montant hors taxes de la facture" },
          { role: "la TVA déductible", compte: "44562", acceptes: ["44566"], sens: "debit", montant: c.immobilisation.tva, indice: "le montant de TVA de la facture" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.immobilisation.ttc, indice: "ce que la banque a réellement payé, taxes comprises" },
        ],
      }),
      indices: (c) => [
        `L'équipement va servir plusieurs années : ce n'est pas une charge du mois, c'est une immobilisation, classe 2. Cherchez le compte qui correspond à « ${c.immobilisation.designation} ».`,
        "Trois lignes : l'équipement hors taxes, la TVA que l'État rendra (classe 4, TVA déductible sur immobilisations), et la banque qui paie le TTC.",
      ],
      explication: (c) => [
        `L'équipement entre à l'actif pour ${eur(c.immobilisation.ht)} hors taxes, au compte ${c.immobilisation.compte} (${intituleDe(c.immobilisation.compte)}). Il appartient à l'entreprise et servira plusieurs années : c'est une immobilisation.`,
        `La TVA de ${eur(c.immobilisation.tva)} n'est pas un coût : l'entreprise la récupère sur l'État. C'est une créance, au compte 44562.`,
        `La banque a payé ${eur(c.immobilisation.ttc)}. L'actif n'a pas grossi : de l'argent est devenu un équipement et une créance de TVA.`,
      ],
      vue: "bilan",
    },
    {
      id: "immo-resultat",
      type: "choix",
      titre: "Un équipement, une charge ?",
      notions: ["depreciation"],
      question: (c) => `Après cet achat de ${eur(c.immobilisation.ht)} hors taxes, le résultat de janvier a-t-il baissé ?`,
      options: (c) => [
        {
          texte: `Oui, de ${eur(c.immobilisation.ht)}.`,
          juste: false,
          retour: "L'équipement n'est pas consommé dans le mois : il reste à l'actif. Le compte de résultat ne le voit pas encore.",
        },
        {
          texte: "Non : l'équipement est une immobilisation. Il coûtera au fil de son usage, par l'amortissement.",
          juste: true,
          retour:
            "C'est cela. Chaque mois de service, une part de sa valeur deviendra une charge : la dotation aux amortissements (compte 681), au palier 3.",
        },
        {
          texte: `Oui, de ${eur(c.immobilisation.ttc)}, taxes comprises.`,
          juste: false,
          retour: "Ni le hors taxes ni la TVA ne sont des charges ici : l'équipement est un actif, la TVA une créance sur l'État.",
        },
      ],
      vue: "resultat",
    },
    {
      id: "achat",
      type: "ecriture",
      titre: "Un achat à crédit",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.achat.date)}, ${c.achat.fournisseur} livre et facture : ${c.achat.designation.toLowerCase()}. La facture se paiera à ${c.achat.delai} jours, le ${date(c.achat.echeance)}. Tout est consommé dans le mois.`,
      piece: (c) =>
        facturePiece({
          nature: "Facture d'achat",
          de: c.achat.fournisseur,
          a: c.entreprise,
          quand: c.achat.date,
          designation: c.achat.designation,
          f: c.achat,
          mention: `Payable à ${c.achat.delai} jours, le ${date(c.achat.echeance)}.`,
        }),
      ecriture: (c) => ({
        date: date(c.achat.date),
        libelle: `Facture ${c.achat.fournisseur}`,
        lignes: [
          { role: "l'achat, au prix hors taxes", compte: c.achat.compte, acceptes: c.achat.acceptes, sens: "debit", montant: c.achat.ht, indice: "le montant hors taxes de la facture" },
          { role: "la TVA déductible", compte: "44566", sens: "debit", montant: c.achat.tva, indice: "le montant de TVA de la facture" },
          { role: "la dette envers le fournisseur", compte: "401", sens: "credit", montant: c.achat.ttc, indice: "ce que l'entreprise devra payer, taxes comprises" },
        ],
      }),
      indices: (c) => [
        `Ce qui est acheté est consommé dans le mois : une charge, classe 6. Quel compte d'achats convient à « ${c.achat.designation} » ?`,
        "Rien n'est payé aujourd'hui : l'entreprise doit la facture à son fournisseur, classe 4. La TVA, elle, se récupère (TVA déductible sur autres biens et services).",
      ],
      explication: (c) => [
        `L'achat est une charge de ${eur(c.achat.ht)} hors taxes : il entre au compte de résultat, au débit du ${c.achat.compte}.`,
        `Rien n'est sorti de la banque. ${c.achat.fournisseur} attend ${eur(c.achat.ttc)} : une dette, au passif, au compte 401. La charge naît à la facture, pas au paiement.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "vente-credit",
      type: "ecriture",
      titre: "Une vente à un client professionnel",
      notions: ["revenue", "payment_terms", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.venteCredit.date)}, ${c.entreprise} facture ${c.venteCredit.client} : ${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)} hors taxes. Le client paiera à ${c.venteCredit.delai} jours, le ${date(c.venteCredit.echeance)}.`,
      piece: (c) =>
        facturePiece({
          nature: "Facture de vente",
          de: c.entreprise,
          a: c.venteCredit.client,
          quand: c.venteCredit.date,
          designation: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)}`,
          f: c.venteCredit,
          mention: `Payable à ${c.venteCredit.delai} jours, le ${date(c.venteCredit.echeance)}.`,
        }),
      ecriture: (c) => ({
        date: date(c.venteCredit.date),
        libelle: "Facture de vente à échéance",
        lignes: [
          { role: "la créance sur le client", compte: "411", sens: "debit", montant: c.venteCredit.ttc, indice: "ce que le client devra payer, taxes comprises" },
          { role: "la vente, au prix hors taxes", compte: c.venteCredit.compte, acceptes: c.venteCredit.acceptes, sens: "credit", montant: c.venteCredit.ht, indice: "le montant hors taxes de la facture" },
          { role: "la TVA collectée", compte: "44571", sens: "credit", montant: c.venteCredit.tva, indice: "le montant de TVA de la facture" },
        ],
      }),
      indices: (c) => [
        `La vente est un produit, classe 7. Quel compte de ventes convient à ce que vend ${c.entreprise} ?`,
        "Le client ne paie pas tout de suite : il doit la facture TTC, classe 4. Et la TVA qu'il paie, l'entreprise la collecte pour l'État.",
      ],
      explication: (c) => [
        `La vente est un produit de ${eur(c.venteCredit.ht)} hors taxes, au crédit du ${c.venteCredit.compte} (${intituleDe(c.venteCredit.compte)}). Elle compte dans le résultat de janvier, même si rien n'est encore encaissé.`,
        `${c.venteCredit.client.charAt(0).toUpperCase()}${c.venteCredit.client.slice(1)} doit ${eur(c.venteCredit.ttc)} : une créance, à l'actif, au compte 411.`,
        `La TVA de ${eur(c.venteCredit.tva)} n'appartient pas à l'entreprise : elle la collecte pour l'État et la lui reversera. C'est une dette, au compte 44571.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "tva-collectee",
      type: "choix",
      titre: "La TVA collectée",
      notions: ["vat_payable", "revenue"],
      question: (c) => `Les ${eur(c.venteCredit.tva)} de TVA facturés au client font-ils partie du chiffre d'affaires de ${c.entreprise} ?`,
      options: () => [
        { texte: "Oui : le client les paie à l'entreprise.", juste: false, retour: "Le client les paie, mais l'entreprise ne fait que les collecter : elle les reverse à l'État." },
        {
          texte: "Non : l'entreprise collecte la TVA pour l'État et la lui reverse.",
          juste: true,
          retour: "Exactement : le chiffre d'affaires se lit toujours hors taxes.",
        },
        { texte: "Seulement quand le client a payé.", juste: false, retour: "Payée ou non, la TVA collectée reste due à l'État : elle n'est jamais un produit." },
      ],
    },
    {
      id: "bulletin",
      type: "montants",
      titre: "La paie de janvier",
      notions: ["fixed_costs"],
      question: (c) =>
        `Les ${qte(c.personnel.effectif)} salariés de ${c.entreprise} ont gagné ${eur(c.personnel.brut)} bruts en janvier. Les cotisations salariales, retenues sur le brut, en font ${pct(c.personnel.tauxSalarial)} ; les cotisations patronales, que l'entreprise paie en plus, ${pct(c.personnel.tauxPatronal)}. Calculez le récapitulatif de la paie.`,
      champs: (c) => {
        const p = c.personnel;
        return [
          { libelle: "Cotisations salariales", attendu: p.cotisationsSalariales, calcul: `${eur(p.brut)} × ${pct(p.tauxSalarial)} = ${eur(p.cotisationsSalariales)}` },
          { libelle: "Net à payer aux salariés", attendu: p.net, calcul: `${eur(p.brut)} − ${eur(p.cotisationsSalariales)} = ${eur(p.net)}` },
          { libelle: "Cotisations patronales", attendu: p.cotisationsPatronales, calcul: `${eur(p.brut)} × ${pct(p.tauxPatronal)} = ${eur(p.cotisationsPatronales)}` },
          { libelle: "Coût total pour l'entreprise", attendu: p.cout, calcul: `${eur(p.brut)} + ${eur(p.cotisationsPatronales)} = ${eur(p.cout)}` },
        ];
      },
      explication: (c) => [
        `Le brut, ${eur(c.personnel.brut)}, est le salaire du contrat. Le salarié n'en reçoit que le net, ${eur(c.personnel.net)} : ses cotisations sont retenues et versées pour lui aux organismes sociaux.`,
        `L'entreprise, elle, paie le brut et ses propres cotisations : le personnel lui coûte ${eur(c.personnel.cout)}. Les cotisations, salariales et patronales, se règlent à l'URSSAF le ${date(c.personnel.dateUrssaf)}.`,
      ],
    },
    {
      id: "paie",
      type: "ecriture",
      titre: "Les salaires du mois",
      notions: ["fixed_costs"],
      evenement: (c) =>
        `Le ${date(c.personnel.date)}, le journal de paie de janvier est arrêté : ${eur(c.personnel.brut)} de salaires bruts, dont ${eur(c.personnel.cotisationsSalariales)} de cotisations salariales retenues et ${eur(c.personnel.net)} de net à payer.`,
      piece: (c) => ({
        nature: "Journal de paie de janvier",
        de: c.entreprise,
        a: `Ses ${qte(c.personnel.effectif)} salariés`,
        date: date(c.personnel.date),
        lignes: [
          { libelle: "Salaires bruts", montant: c.personnel.brut },
          { libelle: `Cotisations salariales (${pct(c.personnel.tauxSalarial)})`, montant: c.personnel.cotisationsSalariales },
          { libelle: `Cotisations patronales (${pct(c.personnel.tauxPatronal)})`, montant: c.personnel.cotisationsPatronales },
        ],
        totaux: [
          { libelle: "Net à payer aux salariés", montant: c.personnel.net, fort: true },
          { libelle: "Coût total pour l'entreprise", montant: c.personnel.cout },
        ],
      }),
      ecriture: (c) => ({
        date: date(c.personnel.date),
        libelle: "Salaires de janvier",
        lignes: [
          { role: "les salaires bruts", compte: "641", sens: "debit", montant: c.personnel.brut, indice: "le total des salaires bruts" },
          { role: "les cotisations salariales dues aux organismes sociaux", compte: "431", acceptes: ["437"], sens: "credit", montant: c.personnel.cotisationsSalariales, indice: "la part retenue sur le brut" },
          { role: "le net dû aux salariés", compte: "421", sens: "credit", montant: c.personnel.net, indice: "ce que les salariés recevront" },
        ],
      }),
      indices: () => [
        "La charge, c'est le salaire brut : classe 6, les rémunérations du personnel.",
        "Rien n'est encore payé. L'entreprise doit le net à ses salariés (compte 421) et les cotisations retenues aux organismes sociaux (compte 431).",
      ],
      explication: (c) => [
        `La charge de l'entreprise est le brut, ${eur(c.personnel.brut)}, au débit du 641. Elle se partage en deux dettes : le net dû aux salariés (421) et les cotisations salariales dues à l'URSSAF (431).`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "cotisations-patronales",
      type: "ecriture",
      titre: "Les cotisations patronales",
      notions: ["fixed_costs"],
      evenement: (c) =>
        `Le même jour, l'entreprise enregistre ses propres cotisations sur les salaires de janvier : ${eur(c.personnel.cotisationsPatronales)}, à verser à l'URSSAF le ${date(c.personnel.dateUrssaf)}.`,
      ecriture: (c) => ({
        date: date(c.personnel.date),
        libelle: "Cotisations patronales de janvier",
        lignes: [
          { role: "les cotisations patronales", compte: "645", sens: "debit", montant: c.personnel.cotisationsPatronales, indice: "la part patronale du journal de paie" },
          { role: "la dette envers les organismes sociaux", compte: "431", acceptes: ["437"], sens: "credit", montant: c.personnel.cotisationsPatronales, indice: "la part patronale du journal de paie" },
        ],
      }),
      indices: () => [
        "Ces cotisations sont une charge de l'entreprise, à côté des salaires : classe 6, les charges de sécurité sociale.",
        "Elles se paieront plus tard : une dette envers les organismes sociaux, la même que pour les cotisations salariales.",
      ],
      explication: (c) => [
        `Une deuxième charge de personnel, ${eur(c.personnel.cotisationsPatronales)}, au débit du 645. L'URSSAF attend désormais ${eur(c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales)} : les cotisations salariales et patronales réunies.`,
      ],
      vue: "resultat",
    },
    {
      id: "versement-salaires",
      type: "ecriture",
      titre: "Le versement des salaires",
      notions: ["fixed_costs"],
      evenement: (c) => `Le ${date(c.personnel.date)}, ${c.entreprise} vire leur net à payer aux salariés : ${eur(c.personnel.net)}.`,
      ecriture: (c) => ({
        date: date(c.personnel.date),
        libelle: "Virement des salaires nets",
        lignes: [
          { role: "la dette envers les salariés qui s'éteint", compte: "421", sens: "debit", montant: c.personnel.net, indice: "le net à payer" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.personnel.net, indice: "le net à payer" },
        ],
      }),
      indices: () => ["La dette envers les salariés disparaît : le compte 421 passe au débit.", "La banque paie."],
      explication: (c) => [
        `Seul le net, ${eur(c.personnel.net)}, sort aujourd'hui de la banque. Les cotisations restent dues à l'URSSAF jusqu'au ${date(c.personnel.dateUrssaf)} : c'est une dette sociale, au passif.`,
      ],
      vue: "bilan",
    },
    {
      id: "cout-du-personnel",
      type: "choix",
      titre: "Le coût du personnel",
      notions: ["fixed_costs", "income_statement"],
      question: (c) => `Que coûte le personnel de janvier à ${c.entreprise}, dans son compte de résultat ?`,
      options: (c) => [
        {
          texte: `${eur(c.personnel.net)} : le net versé aux salariés.`,
          juste: false,
          retour: "Le net est ce que les salariés reçoivent. L'entreprise paie aussi leurs cotisations, retenues sur le brut, et les siennes.",
        },
        {
          texte: `${eur(c.personnel.brut)} : les salaires bruts.`,
          juste: false,
          retour: "Il manque les cotisations patronales, que l'entreprise paie en plus du brut (compte 645).",
        },
        {
          texte: `${eur(c.personnel.cout)} : le brut et les cotisations patronales.`,
          juste: true,
          retour: "C'est cela : 641 et 645 réunis. Ce que la banque a versé ce jour-là, le net, n'en est qu'une partie.",
        },
      ],
      vue: "resultat",
    },
    {
      id: "vente-comptant",
      type: "ecriture",
      titre: "Les ventes au comptant",
      notions: ["revenue", "vat_payable"],
      evenement: (c) =>
        `Le ${date(c.venteComptant.date)}, la caisse récapitule ${c.venteComptant.qui} : ${qte(c.venteComptant.quantite)} ${c.unites} à ${eur(c.venteComptant.prixUnitaire)} hors taxes, TVA ${pct(c.venteComptant.tauxTva)}. L'argent est déjà sur le compte bancaire.`,
      piece: (c) =>
        facturePiece({
          nature: "Récapitulatif des ventes du mois",
          de: c.entreprise,
          a: "Clients au comptant",
          quand: c.venteComptant.date,
          designation: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)}`,
          f: c.venteComptant,
          mention: "Encaissé.",
        }),
      ecriture: (c) => ({
        date: date(c.venteComptant.date),
        libelle: "Ventes au comptant de janvier",
        lignes: [
          { role: "l'argent encaissé en banque", compte: "512", acceptes: ["530"], sens: "debit", montant: c.venteComptant.ttc, indice: "ce que les clients ont payé, taxes comprises" },
          { role: "les ventes, au prix hors taxes", compte: c.venteComptant.compte, acceptes: c.venteComptant.acceptes, sens: "credit", montant: c.venteComptant.ht, indice: "le montant hors taxes des ventes" },
          { role: "la TVA collectée", compte: "44571", sens: "credit", montant: c.venteComptant.tva, indice: "la TVA sur ces ventes" },
        ],
      }),
      indices: () => [
        "C'est la même vente que tout à l'heure, à une différence près : le client a déjà payé.",
        "Au lieu d'une créance client, c'est la banque qui reçoit le TTC.",
      ],
      explication: (c) => [
        `Mêmes produit et TVA que pour une vente à échéance, mais le TTC, ${eur(c.venteComptant.ttc)}, arrive directement en banque : aucune créance ne naît.`,
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "solde-banque",
      type: "montants",
      titre: "Le solde de la banque",
      notions: ["net_treasury"],
      question: () =>
        "Le mois est fini. Dans le grand livre, le compte 512 réunit tout ce qui est entré et sorti de la banque. Quel est son solde au 31 janvier ?",
      champs: (_c, e) => [
        { libelle: "Solde du compte 512 Banque", attendu: banqueDe(e), calcul: `Total des entrées moins total des sorties : ${eur(banqueDe(e))}` },
      ],
      explication: () => [
        "Le solde d'un compte est la différence entre son débit et son crédit. Un compte de banque débiteur, c'est de l'argent disponible.",
      ],
      vue: "grand-livre",
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le compte de résultat",
      notions: ["income_statement"],
      question: () =>
        "Construisez le compte de résultat de janvier : additionnez les produits (classe 7), puis les charges (classe 6).",
      champs: (_c, e) => {
        const cr = compteDeResultat(e.soldes);
        return [
          { libelle: "Total des produits", attendu: cr.totalProduits, calcul: cr.produits.map((p) => eur(p.montant)).join(" + ") + ` = ${eur(cr.totalProduits)}` },
          { libelle: "Total des charges", attendu: cr.totalCharges, calcul: cr.charges.map((p) => eur(p.montant)).join(" + ") + ` = ${eur(cr.totalCharges)}` },
          { libelle: "Résultat (produits moins charges)", attendu: cr.resultat, calcul: `${eur(cr.totalProduits)} − ${eur(cr.totalCharges)} = ${eur(cr.resultat)}` },
        ];
      },
      explication: (c, e) => {
        const r = compteDeResultat(e.soldes).resultat;
        return [
          r >= 0
            ? `${c.entreprise} dégage un bénéfice de ${eur(r)} en janvier : ses produits dépassent ses charges.`
            : `${c.entreprise} perd ${eur(-r)} en janvier : ses charges dépassent ses produits.`,
          "Ce résultat est provisoire : il manque encore l'usure de l'équipement (l'amortissement) et les intérêts de l'emprunt, que le palier 3 ajoute.",
        ];
      },
      vue: "resultat",
    },
    {
      id: "tva-nette",
      type: "montants",
      titre: "La TVA du mois",
      notions: ["vat_payable"],
      question: () =>
        "Calculez la TVA de janvier : la TVA collectée sur les ventes, moins la TVA déductible sur les achats. Écrivez un nombre négatif si l'État doit de l'argent à l'entreprise.",
      champs: (_c, e) => [
        {
          libelle: "TVA collectée moins TVA déductible",
          attendu: tvaNette(e.soldes),
          calcul: `${eur(-(e.soldes["44571"] ?? 0))} − ${eur((e.soldes["44562"] ?? 0) + (e.soldes["44566"] ?? 0))} = ${eur(tvaNette(e.soldes))}`,
        },
      ],
      explication: (_c, e) => {
        const t = tvaNette(e.soldes);
        return t >= 0
          ? [`L'entreprise doit ${eur(t)} de TVA à l'État pour janvier. Elle la déclare et la paie en février : c'est une dette, au passif du bilan.`]
          : [
              `L'entreprise a payé plus de TVA qu'elle n'en a collecté : l'État lui doit ${eur(-t)}. C'est un crédit de TVA, une créance à l'actif, qu'elle imputera sur la TVA des mois suivants ou dont elle demandera le remboursement.`,
              "C'est fréquent le mois où l'on achète son équipement.",
            ];
      },
      vue: "tva",
    },
    {
      id: "bilan",
      type: "montants",
      titre: "Le bilan au 31 janvier",
      notions: ["balance_sheet"],
      question: () =>
        "Construisez le bilan au 31 janvier. À l'actif : les immobilisations, les créances (clients, TVA si l'État vous doit), la banque. Au passif : le capital, le résultat, les dettes (emprunt, fournisseur, organismes sociaux, TVA si vous la devez).",
      champs: (_c, e) => {
        const b = bilan(e.soldes);
        return [
          { libelle: "Total de l'actif", attendu: b.totalActif, calcul: b.actif.map((l) => eur(l.montant)).join(" + ") + ` = ${eur(b.totalActif)}` },
          { libelle: "Total du passif", attendu: b.totalPassif, calcul: b.passif.map((l) => eur(l.montant)).join(" + ") + ` = ${eur(b.totalPassif)}` },
        ];
      },
      explication: (_c, e) => {
        const b = bilan(e.soldes);
        return [
          `Les deux totaux sont égaux : ${eur(b.totalActif)}. Ce n'est pas un hasard : chaque écriture avait autant de débit que de crédit.`,
          "Le résultat se range au passif, avec le capital : il appartient aux associés. C'est lui qui équilibre le bilan, parce que les charges et les produits ne figurent pas au bilan.",
        ];
      },
      vue: "bilan",
    },
    {
      id: "resultat-tresorerie",
      type: "choix",
      titre: "Résultat et trésorerie",
      notions: ["net_treasury", "income_statement"],
      question: (c, e) => {
        const r = compteDeResultat(e.soldes).resultat;
        const variation = banqueDe(e) - c.capital - c.emprunt;
        return `Hors apports et emprunt, la banque a varié de ${eur(variation)} en janvier. Le résultat est de ${eur(r)}. Pourquoi ces deux nombres diffèrent-ils ?`;
      },
      options: () => [
        {
          texte:
            "Le résultat compte une vente ou un achat quand la facture naît ; la banque, quand on paie. Et l'équipement est payé sans être une charge.",
          juste: true,
          retour:
            "C'est cela : la créance du client, les dettes du fournisseur et de l'URSSAF, l'équipement et la TVA font tout l'écart. Le résultat mesure l'enrichissement, la trésorerie l'argent disponible.",
        },
        {
          texte: "Il y a une erreur dans le journal.",
          juste: false,
          retour: "Le bilan s'équilibre : le journal est juste. Les deux nombres ne mesurent simplement pas la même chose.",
        },
        {
          texte: "La TVA est un produit qui ne passe pas par la banque.",
          juste: false,
          retour: "La TVA n'est jamais un produit. Elle passe par la banque, mais elle est due à l'État ou due par lui.",
        },
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "echeances",
      type: "lecture",
      titre: "Les échéances",
      notions: ["payment_terms"],
      texte: (c) => {
        const reglements = [
          { jour: c.achat.echeance, texte: `la facture de ${c.achat.fournisseur} arrive à échéance` },
          { jour: c.personnel.dateUrssaf, texte: "les cotisations de janvier se paient à l'URSSAF" },
          { jour: c.venteCredit.echeance, texte: `${c.venteCredit.client} doit régler sa facture` },
        ].sort((a, b) => a.jour - b.jour);
        return [
          `Le temps passe. ${reglements.map((r) => `Le ${date(r.jour)}, ${r.texte}`).join(". ")}.`,
          "Ces règlements ne sont ni des achats, ni des ventes, ni des charges de personnel : ils soldent des dettes et une créance déjà enregistrées. Passez-les dans l'ordre des dates, puis regardez ce qu'ils changent.",
        ];
      },
    },
    {
      id: "paiement-fournisseur",
      type: "ecriture",
      titre: "Le fournisseur est payé",
      notions: ["payment_terms"],
      echeance: (c) => c.achat.echeance,
      evenement: (c) => `Le ${date(c.achat.echeance)}, ${c.entreprise} paie ${c.achat.fournisseur} par virement : ${eur(c.achat.ttc)}.`,
      ecriture: (c) => ({
        date: date(c.achat.echeance),
        libelle: `Règlement ${c.achat.fournisseur}`,
        lignes: [
          { role: "la dette fournisseur qui s'éteint", compte: "401", sens: "debit", montant: c.achat.ttc, indice: "le montant de la facture, taxes comprises" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.achat.ttc, indice: "le montant de la facture, taxes comprises" },
        ],
      }),
      indices: () => [
        "La dette envers le fournisseur disparaît : le compte 401, qui était au crédit, passe cette fois au débit.",
        "La banque paie.",
      ],
      explication: (c) => [
        `La dette de ${eur(c.achat.ttc)} est éteinte, la banque a baissé d'autant. Aucune charge nouvelle : l'achat avait déjà été enregistré à la facture.`,
      ],
      vue: "bilan",
    },
    {
      id: "paiement-urssaf",
      type: "ecriture",
      titre: "L'URSSAF est payée",
      notions: ["payment_terms"],
      echeance: (c) => c.personnel.dateUrssaf,
      evenement: (c) =>
        `Le ${date(c.personnel.dateUrssaf)}, ${c.entreprise} verse à l'URSSAF les cotisations de janvier : ${eur(c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales)}, salariales et patronales réunies.`,
      ecriture: (c) => ({
        date: date(c.personnel.dateUrssaf),
        libelle: "Cotisations de janvier à l'URSSAF",
        lignes: [
          { role: "la dette sociale qui s'éteint", compte: "431", acceptes: ["437"], sens: "debit", montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales, indice: "les cotisations salariales et patronales réunies" },
          { role: "le paiement par la banque", compte: "512", sens: "credit", montant: c.personnel.cotisationsSalariales + c.personnel.cotisationsPatronales, indice: "les cotisations salariales et patronales réunies" },
        ],
      }),
      indices: () => ["La dette envers l'URSSAF disparaît : le compte 431 passe au débit.", "La banque paie."],
      explication: () => ["La dette sociale est soldée. Aucune charge nouvelle : les cotisations avaient été enregistrées avec la paie de janvier."],
      vue: "bilan",
    },
    {
      id: "encaissement-client",
      type: "ecriture",
      titre: "Le client paie",
      notions: ["payment_terms"],
      echeance: (c) => c.venteCredit.echeance,
      evenement: (c) => `Le ${date(c.venteCredit.echeance)}, ${c.venteCredit.client} règle sa facture par virement : ${eur(c.venteCredit.ttc)}.`,
      ecriture: (c) => ({
        date: date(c.venteCredit.echeance),
        libelle: "Règlement client",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.venteCredit.ttc, indice: "le montant de la facture, taxes comprises" },
          { role: "la créance client qui s'éteint", compte: "411", sens: "credit", montant: c.venteCredit.ttc, indice: "le montant de la facture, taxes comprises" },
        ],
      }),
      indices: () => ["La banque reçoit l'argent.", "La créance sur le client disparaît : le compte 411 passe au crédit."],
      explication: (c) => [`La créance de ${eur(c.venteCredit.ttc)} est devenue de l'argent en banque. Aucun produit nouveau : la vente avait été enregistrée à la facture.`],
      vue: "bilan",
    },
    {
      id: "apres-echeances",
      type: "comparaison",
      titre: "Ce qui a changé",
      notions: ["net_treasury", "income_statement", "balance_sheet"],
      question: (c) =>
        `Entre le 31 janvier et le ${date(Math.max(c.achat.echeance, c.venteCredit.echeance, c.personnel.dateUrssaf))}, le résultat de janvier a-t-il changé ?`,
      avantLEtape: "echeances",
      libelles: { avant: "Au 31 janvier", apres: "Après les échéances" },
      options: (c) => [
        { texte: "Oui, il a augmenté : le client a payé.", juste: false, retour: "Le client a payé une vente déjà comptée en janvier : la payer ne la compte pas une deuxième fois." },
        {
          texte: "Non : payer et encaisser ne créent ni charge ni produit. Ils changent la forme de l'actif et du passif.",
          juste: true,
          retour: `C'est la leçon du chapitre : le résultat de ${c.entreprise} est né des factures ; les règlements ne font que transformer une créance ou une dette en argent.`,
        },
        { texte: "Oui, il a baissé : le fournisseur et l'URSSAF ont été payés.", juste: false, retour: "L'achat et les cotisations étaient déjà comptés en janvier. Les payer ne fait qu'éteindre les dettes." },
      ],
      explication: (_c, avant, apres) => {
        const a = bilan(avant.soldes);
        const b = bilan(apres.soldes);
        return [
          `Le résultat reste à ${eur(a.resultat)}. La banque passe de ${eur(avant.soldes["512"] ?? 0)} à ${eur(apres.soldes["512"] ?? 0)}, le client, le fournisseur et l'URSSAF sont soldés.`,
          `Le total du bilan, lui, passe de ${eur(a.totalActif)} à ${eur(b.totalActif)} : payer une dette fait baisser l'actif et le passif ensemble.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "income_statement"],
      texte: (c) => [
        `Vous avez tenu le premier mois de ${c.entreprise} : chaque opération dans le journal, puis le compte de résultat, la TVA et le bilan, construits à partir de vos propres écritures.`,
        "Le bilan de janvier n'est pas encore celui d'un comptable : il y manque l'usure de l'équipement, les intérêts de l'emprunt et les stocks. C'est le palier 3 : les opérations courantes et les travaux de fin de période.",
        `Dans l'arène, ${c.entreprise} démarre avec ce capital et cet emprunt : vous pouvez la diriger, et lire ses comptes trimestre après trimestre.`,
      ],
      repere: () =>
        "Une charge ou un produit naît à la facture ; un règlement ne fait que solder une dette ou une créance. Le résultat mesure ce que l'entreprise a gagné, la trésorerie ce dont elle dispose.",
    },
  ],
};
