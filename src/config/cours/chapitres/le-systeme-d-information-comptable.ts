import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import {
  ABONNEMENT_A_LA_PLATEFORME,
  COUT_D_UNE_FACTURE_ELECTRONIQUE,
  COUT_D_UNE_FACTURE_PAPIER,
  JOURS_DE_SAISIE_DE_L_ANNEE,
  LIEUX_DE_LA_COPIE,
  dateEcrite,
  documentDuCompte,
  facturesEntreEntreprises,
  grandLivreDesClients,
  sauvegarde,
  seuilDeLaFactureElectronique,
  totauxDeLaBalance,
} from "../monde/systeme-d-information-comptable";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE SYSTÈME D'INFORMATION COMPTABLE, DU DOCUMENT AU BILAN (Bac STMG, gestion et
 * finance, palier 1 ; programme de terminale, thème 1, question 1.1).
 *
 * L'élève suit une facture de NOVA à CampusTech d'un bout à l'autre de la chaîne : la pièce
 * justificative (laquelle des quatre s'enregistre ?), l'écriture au journal en partie double, le
 * compte du client au grand livre, la balance, puis les documents de synthèse. Puis ce que le
 * numérique change : le PGI et sa saisie unique, la facture électronique (un curseur : à partir de
 * combien de factures par an l'économie paie-t-elle l'abonnement à une plateforme ?), la sécurité
 * des accès, et un laboratoire de la sauvegarde (où garder la copie, à quel rythme : ne pas perdre
 * plus d'une journée de saisie, quel que soit l'incident).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA (exercice-de-nova.ts), sa
 * facture d'octobre à CampusTech et sa balance avant inventaire, refaits par
 * monde/systeme-d-information-comptable.ts, qui pose aussi les hypothèses du numérique.
 *
 * NOURRI PAR LE COURS DU PROPRIÉTAIRE : sa présentation du PGI (une base de données unique, des
 * modules, l'intégration automatique des factures en comptabilité, ses limites), et son corrigé de
 * la conformité des factures électroniques (authenticité de l'origine, intégrité, lisibilité,
 * conservation de 10 ans ; plusieurs copies, sur des supports différents, dont une hors de
 * l'entreprise ; la validation qui interdit de modifier une écriture), ramenés au lycée.
 */

/** Les comptes de la balance que l'élève range au tri, dans l'ordre de la balance. */
export const COMPTES_DU_TRI = ["101", "164", "2154", "401", "411", "4455", "512", "601", "6132", "641", "6611", "701"] as const;

/** Les bornes du curseur des factures de l'année. */
export const FACTURES_DU_CURSEUR = { min: 0, max: 200 } as const;

/** Le levier du rythme de la sauvegarde, en jours de saisie entre deux copies. */
export const LEVIERS_DE_LA_SAUVEGARDE = { frequence: { min: 1, max: 30, pas: 1 } } as const;

/** Le départ du laboratoire : une copie par semaine, sur le disque externe branché au serveur. */
export const DEPART_DE_LA_SAUVEGARDE = { frequence: 5, lieu: 1 } as const;

/** Le défi : au pire, perdre au plus une journée de saisie. La solution : chaque jour, en ligne. */
export const PERTE_ADMISE = 1;
export const SOLUTION_DE_LA_SAUVEGARDE = { frequence: 1, lieu: 2 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const jours = (n: number) => `${qte(n)} ${n > 1 ? "jours" : "jour"}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La facture d'octobre à CampusTech, le compte des clients, la balance : ce que le chapitre lit. */
export function informationComptable(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const creance = f.creances.find((x) => x.client === f.campustech.nom && x.date.mois === 10)!;
  const balance = f.balanceAvantInventaire;
  return {
    f,
    entreprise: f.entreprise,
    client: f.campustech.nom,
    facture: { date: creance.date, enceintes: creance.enceintes, prix: f.prixDeLEnceinte, ht: creance.ht, tva: creance.tva, ttc: creance.ttc, taux: f.tauxDeTva, delai: 60 },
    clients: grandLivreDesClients(f),
    balance,
    totaux: totauxDeLaBalance(balance),
    factures: facturesEntreEntreprises(f),
    seuil: seuilDeLaFactureElectronique(),
  };
}

export type InformationComptable = ReturnType<typeof informationComptable>;

/** L'économie nette de la facture électronique, pour un nombre de factures par an. */
export const economieDeLaFactureElectronique = (q: number) => auCentime(q * (COUT_D_UNE_FACTURE_PAPIER - COUT_D_UNE_FACTURE_ELECTRONIQUE) - ABONNEMENT_A_LA_PLATEFORME);

/** Une position du laboratoire : le rythme et le lieu de la copie. */
export const sauvegardeDuLaboratoire = (p: Readonly<Record<string, number>>) => sauvegarde(p.frequence!, p.lieu!);

const INCIDENTS = [
  { code: "panne", libelle: "Saisie perdue si le serveur tombe en panne", mot: "la panne du serveur" },
  { code: "incendie", libelle: "Saisie perdue si le bureau brûle", mot: "l'incendie du bureau" },
  { code: "rancongiciel", libelle: "Saisie perdue si un rançongiciel chiffre le réseau", mot: "un rançongiciel" },
] as const;

/** Pourquoi chaque compte va au bilan ou au compte de résultat, dit à l'élève au tri. */
const POURQUOI: Readonly<Record<string, string>> = {
  "101": "L'argent apporté par les associés : une ressource durable, au passif du bilan.",
  "164": "Ce que NOVA doit encore à la banque au 31 décembre : une dette, au bilan.",
  "2154": "La ligne de montage, que NOVA possède : un bien, à l'actif du bilan.",
  "401": "La facture de composants pas encore payée : une dette, au bilan.",
  "411": "Ce que les clients doivent encore : une créance, à l'actif du bilan.",
  "4455": "La TVA de décembre, à verser en janvier : une dette envers l'État, au bilan.",
  "512": "L'argent sur le compte au 31 décembre : à l'actif du bilan.",
  "601": "Les composants achetés dans l'année : une charge, au compte de résultat.",
  "6132": "Le loyer de l'année : une charge, au compte de résultat.",
  "641": "Les salaires de l'année : une charge, au compte de résultat.",
  "6611": "Les intérêts payés à la banque dans l'année : une charge financière, au compte de résultat.",
  "701": "Les enceintes vendues dans l'année : un produit, au compte de résultat.",
};

/** La balance avant inventaire, telle que l'élève la lit. */
function tableauDeLaBalance(k: InformationComptable): TableauDeDonnees {
  return {
    titre: `La balance avant inventaire de ${k.entreprise} au 31 décembre`,
    colonnes: ["Débit", "Crédit"],
    lignes: k.balance.map((l) => ({ libelle: `${l.compte} ${l.intitule}`, valeurs: [l.debit ? eur(l.debit) : "", l.credit ? eur(l.credit) : ""] })),
  };
}

/** Le compte 411 de l'année au grand livre, en quatre totaux. */
function tableauDuGrandLivre(k: InformationComptable): TableauDeDonnees {
  const g = k.clients;
  const sonora = g.sonora.lignes;
  return {
    titre: "Le compte 411 Clients au grand livre, de janvier à décembre",
    colonnes: ["Débit", "Crédit"],
    lignes: [
      { libelle: `Factures de ${k.client} (${qte(g.campustech.factures)})`, valeurs: [eur(g.campustech.debit), ""] },
      { libelle: `Factures de Sonora (${qte(sonora.filter((x) => x.nature === "facture").length)})`, valeurs: [eur(g.sonora.debit), ""] },
      { libelle: `Règlements de ${k.client} (${qte(g.campustech.reglements)})`, valeurs: ["", eur(g.campustech.credit)] },
      { libelle: `Règlement de Sonora (${qte(sonora.filter((x) => x.nature === "reglement").length)})`, valeurs: ["", eur(g.sonora.credit)] },
    ],
  };
}

export const LE_SYSTEME_D_INFORMATION_COMPTABLE: Chapitre = {
  code: "le-systeme-d-information-comptable",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 1 · Appliquer les règles comptables"],
  titre: "Le système d'information comptable : du document au bilan",
  accroche:
    "Une facture part chez un client. Elle devient une écriture, une ligne du grand livre, un solde de la balance, puis un chiffre du bilan. Ce que le PGI, la facture électronique et la sauvegarde y changent.",
  objectifs: [
    "Distinguer une pièce justificative d'un autre document",
    "Enregistrer une facture au journal en partie double",
    "Suivre une opération du journal au grand livre, à la balance et aux documents de synthèse",
    "Dire ce qu'apportent un PGI et la facture électronique",
    "Choisir des accès et une sauvegarde qui protègent les données comptables",
  ],
  libre: false,
  ensuite: ["controler-les-comptes", "lire-le-compte-de-resultat"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "la chaîne comptable se suit ici sur le premier exercice de NOVA dans la simulation du cours, de sa facture d'octobre à sa balance de fin d'année ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une facture, et tout ce qu'elle devient",
      notions: ["balance_sheet", "income_statement"],
      texte: (c) => {
        const k = informationComptable(c);
        return [
          `Le ${dateEcrite(k.facture.date)}, ${k.entreprise} facture ${qte(k.facture.enceintes)} enceintes à ${k.client}. Ce papier, ou ce fichier, va traverser toute la comptabilité.`,
          "Le système d'information comptable collecte les documents, les enregistre, les range, les conserve, et en tire les comptes de l'année. Aujourd'hui, il tient dans un logiciel : le plus souvent un progiciel de gestion intégré, un PGI.",
          "Vous allez suivre la facture d'octobre pas à pas, puis voir ce que le numérique change, et ce qu'il faut protéger.",
        ];
      },
      repere: () => "Pièce justificative → journal → grand livre → balance → documents de synthèse (bilan et compte de résultat).",
    },
    {
      id: "la-piece",
      objectifs: [0],
      type: "choix",
      titre: "La pièce justificative",
      notions: ["payment_terms"],
      question: (c) => {
        const k = informationComptable(c);
        return `En octobre, quatre documents circulent entre ${k.entreprise} et ${k.client} : le devis du mois dernier, le bon de commande du client, le bon de livraison signé, et la facture du ${dateEcrite(k.facture.date)}. Lequel s'enregistre en comptabilité ?`;
      },
      options: (c) => {
        const k = informationComptable(c);
        return [
          {
            texte: `La facture de ${k.entreprise}`,
            juste: true,
            retour: `Oui : la facture prouve la vente, son prix et sa TVA. C'est la pièce justificative de l'écriture. ${k.entreprise} la conserve 10 ans, comme toute pièce comptable.`,
          },
          {
            texte: `Le bon de commande de ${k.client}`,
            juste: false,
            retour: "Non : une commande est une promesse. Rien n'est encore vendu ni dû : elle ne s'enregistre pas.",
          },
          {
            texte: "Le bon de livraison signé par le client",
            juste: false,
            retour: "Non : il prouve que les enceintes sont parties, mais il ne dit ni le prix ni la TVA. C'est la facture qui s'enregistre.",
          },
          {
            texte: "Le devis envoyé le mois précédent",
            juste: false,
            retour: "Non : un devis est une proposition de prix, que le client peut refuser. Il ne crée ni vente ni dette.",
          },
        ];
      },
    },
    {
      id: "au-journal",
      objectifs: [1],
      type: "ecriture",
      titre: "La facture, au journal",
      notions: ["vat_payable", "payment_terms"],
      evenement: (c) => {
        const k = informationComptable(c);
        return `Le ${dateEcrite(k.facture.date)}, ${k.entreprise} envoie sa facture à ${k.client} : ${qte(k.facture.enceintes)} enceintes à ${eur(k.facture.prix)} hors taxes, payables à ${qte(k.facture.delai)} jours. Passez l'écriture au journal des ventes.`;
      },
      piece: (c) => {
        const k = informationComptable(c);
        return {
          nature: "Facture",
          de: k.entreprise,
          a: k.client,
          date: dateEcrite(k.facture.date),
          lignes: [{ libelle: "Enceintes", quantite: qte(k.facture.enceintes), prixUnitaire: k.facture.prix, montant: k.facture.ht }],
          totaux: [
            { libelle: "Total hors taxes", montant: k.facture.ht },
            { libelle: `TVA à ${pct(k.facture.taux)}`, montant: k.facture.tva },
            { libelle: "Net à payer", montant: k.facture.ttc, fort: true },
          ],
          mention: `Paiement à ${qte(k.facture.delai)} jours`,
        };
      },
      ecriture: (c) => {
        const k = informationComptable(c);
        return {
          date: dateEcrite(k.facture.date),
          libelle: `Facture ${k.client} d'octobre`,
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: k.facture.ttc, indice: "le net à payer de la facture, TVA comprise" },
            { role: "la vente", compte: "701", acceptes: ["70"], sens: "credit", montant: k.facture.ht, indice: "le total hors taxes" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: k.facture.tva, indice: "la TVA de la facture" },
          ],
        };
      },
      indices: () => [
        "Partie double : le total du débit égale le total du crédit.",
        "Le client doit tout, TVA comprise : sa dette est au débit. La vente, hors taxes, et la TVA, que NOVA reversera à l'État, sont au crédit.",
      ],
      explication: (c) => {
        const k = informationComptable(c);
        return [
          `Trois lignes, et ${eur(k.facture.ttc)} de chaque côté : ${k.client} doit ${eur(k.facture.ttc)}, ${k.entreprise} a vendu pour ${eur(k.facture.ht)}, et doit ${eur(k.facture.tva)} de TVA à l'État.`,
          "Au journal, les écritures s'enregistrent dans l'ordre des dates, chacune avec sa pièce. Aucun argent n'a encore bougé : la vente est là, l'encaissement viendra.",
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "au-grand-livre",
      objectifs: [2],
      type: "montants",
      titre: "Le compte du client, au grand livre",
      notions: ["payment_terms", "balance_sheet"],
      tableau: (c) => tableauDuGrandLivre(informationComptable(c)),
      question: () =>
        "Le grand livre range les écritures du journal compte par compte. Voici le compte 411 Clients de l'année, résumé. Calculez le total du débit, le total du crédit, puis le solde du compte au 31 décembre.",
      champs: (c) => {
        const g = informationComptable(c).clients;
        return [
          { libelle: "Total du débit", attendu: g.debit, calcul: `${eur(g.campustech.debit)} + ${eur(g.sonora.debit)} = ${eur(g.debit)}` },
          { libelle: "Total du crédit", attendu: g.credit, calcul: `${eur(g.campustech.credit)} + ${eur(g.sonora.credit)} = ${eur(g.credit)}` },
          { libelle: "Solde du compte", attendu: g.solde, calcul: `${eur(g.debit)} − ${eur(g.credit)} = ${eur(g.solde)}` },
        ];
      },
      explication: (c) => {
        const k = informationComptable(c);
        return [
          `Le solde est débiteur : au 31 décembre, les clients doivent encore ${eur(k.clients.solde)} à ${k.entreprise}. La facture d'octobre en fait partie, avec celles de novembre et de décembre, et la facture impayée de Sonora.`,
          "Ce solde est celui qui passe à la balance.",
        ];
      },
    },
    {
      id: "la-balance",
      objectifs: [2],
      type: "montants",
      titre: "La balance",
      notions: ["balance_sheet", "income_statement"],
      tableau: (c) => tableauDeLaBalance(informationComptable(c)),
      question: (c) =>
        `La balance réunit le solde de chaque compte du grand livre. Voici celle de ${informationComptable(c).entreprise} au 31 décembre, avant les travaux d'inventaire. Calculez le total des soldes débiteurs, puis celui des soldes créditeurs.`,
      champs: (c) => {
        const k = informationComptable(c);
        return [
          { libelle: "Total des soldes débiteurs", attendu: k.totaux.debit, calcul: `${k.balance.filter((l) => l.debit).map((l) => eur(l.debit)).join(" + ")} = ${eur(k.totaux.debit)}`, tolerance: 1 },
          { libelle: "Total des soldes créditeurs", attendu: k.totaux.credit, calcul: `${k.balance.filter((l) => l.credit).map((l) => eur(l.credit)).join(" + ")} = ${eur(k.totaux.credit)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = informationComptable(c);
        return [
          `Les deux totaux valent ${eur(k.totaux.debit)}. Chaque écriture a mis autant au débit qu'au crédit : la somme des débits égale donc la somme des crédits.`,
          "Une balance qui ne tombe pas juste signale une erreur de saisie ou de report. Une balance juste ne prouve pas tout : un montant passé dans le mauvais compte ne la déséquilibre pas.",
        ];
      },
    },
    {
      id: "vers-les-documents-de-synthese",
      objectifs: [2],
      type: "tri",
      titre: "De la balance au bilan et au compte de résultat",
      notions: ["balance_sheet", "income_statement"],
      question: () =>
        "Rangez chaque compte de la balance dans le document de synthèse où il va : le bilan (ce que l'entreprise possède et ce qu'elle doit au 31 décembre) ou le compte de résultat (ce que l'année a consommé et rapporté).",
      categories: [
        { code: "bilan", libelle: "Bilan" },
        { code: "resultat", libelle: "Compte de résultat" },
      ],
      elements: (c) =>
        informationComptable(c)
          .balance.filter((l) => (COMPTES_DU_TRI as readonly string[]).includes(l.compte))
          .map((l) => ({ libelle: `${l.compte} ${l.intitule}`, montant: auCentime(l.debit || l.credit), categorie: documentDuCompte(l.compte), pourquoi: POURQUOI[l.compte]! })),
      relance: "Demandez-vous si le compte dit ce que l'entreprise possède ou doit au 31 décembre, ou ce qu'elle a consommé ou gagné pendant l'année.",
      explication: () => [
        "Les comptes des classes 1 à 5 vont au bilan ; ceux des classes 6 (les charges) et 7 (les produits) vont au compte de résultat. La différence entre les produits et les charges, le résultat, passe au bilan dans les capitaux propres.",
      ],
    },
    {
      id: "le-pgi",
      objectifs: [3],
      type: "choix",
      titre: "Le PGI : une saisie, une seule fois",
      question: (c) => {
        const k = informationComptable(c);
        return `${k.entreprise} s'équipe d'un PGI : un seul logiciel, une seule base de données pour les ventes, les achats, la paie et la comptabilité. Le service commercial y crée la facture de ${k.client}. Que fait alors le comptable ?`;
      },
      options: () => [
        {
          texte: "Il contrôle l'écriture déjà passée",
          juste: true,
          retour:
            "Oui : la facture saisie une fois alimente tous les modules. Le PGI passe l'écriture, le comptable la vérifie. Le temps gagné sur la saisie va au contrôle et à l'analyse.",
        },
        {
          texte: "Il ressaisit la facture dans le module comptable",
          juste: false,
          retour: "Non : c'est ce qu'un PGI évite. Ressaisir prend du temps et crée des erreurs de recopie ; la base de données est commune.",
        },
        {
          texte: "Il attend le règlement du client pour l'enregistrer",
          juste: false,
          retour: "Non : la vente s'enregistre à la facture, sans attendre l'argent. Le règlement fera l'objet d'une autre écriture.",
        },
        {
          texte: "Rien : un PGI ne se trompe jamais, inutile de vérifier",
          juste: false,
          retour: "Non : le PGI applique ses paramètres. Un compte mal paramétré, un taux de TVA faux, et l'erreur se répète sur chaque facture : il faut contrôler.",
        },
      ],
    },
    {
      id: "la-facture-electronique",
      objectifs: [3],
      type: "choix",
      titre: "La facture électronique",
      question: (c) =>
        `La loi généralise la facture électronique entre entreprises. Depuis le 1er septembre 2026, toutes doivent pouvoir en recevoir ; une PME comme ${informationComptable(c).entreprise} devra aussi en émettre à partir du 1er septembre 2027. Une facture en PDF envoyée par courriel suffira-t-elle ?`,
      options: () => [
        {
          texte: "Non : il faudra un fichier structuré, passé par une plateforme agréée",
          juste: true,
          retour:
            "Oui : une facture électronique est un fichier de données que le logiciel du client lit sans ressaisie. Elle transite par une plateforme agréée. Comme toute pièce, elle se conserve 10 ans, lisible, et sans modification possible.",
        },
        {
          texte: "Oui : un PDF envoyé par courriel est déjà une facture électronique au sens de la loi",
          juste: false,
          retour: "Non : un PDF est une image de facture. Le client devrait encore la ressaisir ; la réforme vise des données que les logiciels échangent directement.",
        },
        {
          texte: "Oui, à condition de l'imprimer et de la signer à la main avant de l'envoyer",
          juste: false,
          retour: "Non : imprimer revient au papier. La réforme supprime justement la ressaisie et le papier entre entreprises.",
        },
        {
          texte: "Non : seule une facture papier envoyée en recommandé restera valable devant la loi",
          juste: false,
          retour: "Non : c'est l'inverse. Entre entreprises, la facture papier disparaît au profit de la facture électronique.",
        },
      ],
    },
    {
      id: "a-partir-de-combien",
      objectifs: [3],
      type: "curseur",
      titre: "À partir de combien de factures ?",
      question: () =>
        `Hypothèse du cours : une facture papier coûte ${eur(COUT_D_UNE_FACTURE_PAPIER)} à traiter (impression ou courrier, timbre, saisie, classement), une facture électronique ${eur(COUT_D_UNE_FACTURE_ELECTRONIQUE)}. La plateforme coûte ${eur(ABONNEMENT_A_LA_PLATEFORME)} par an. Avant de calculer, cherchez au curseur le nombre de factures par an à partir duquel l'économie paie l'abonnement.`,
      grandeur: () => ({ libelle: "Factures par an", unite: "factures" }),
      sens: "plus-petite",
      cible: () => ({ attendu: seuilDeLaFactureElectronique(), min: FACTURES_DU_CURSEUR.min, max: FACTURES_DU_CURSEUR.max }),
      zones: ["L'économie paie l'abonnement", "L'abonnement coûte plus"],
      rates: () => ({
        dessous: "À ce nombre, l'économie ne paie pas encore l'abonnement : cherchez plus haut.",
        dessus: "À ce nombre, l'économie paie déjà l'abonnement : le seuil est plus bas.",
      }),
      montrer: "Montrer le seuil",
      lecture: (_c, q) => [
        { libelle: "Coût des factures sur papier", montant: auCentime(q * COUT_D_UNE_FACTURE_PAPIER) },
        { libelle: "Coût des factures électroniques, abonnement compris", montant: auCentime(q * COUT_D_UNE_FACTURE_ELECTRONIQUE + ABONNEMENT_A_LA_PLATEFORME) },
        { libelle: "Économie de l'année", montant: economieDeLaFactureElectronique(q), fort: true },
      ],
      droites: () => ({
        produit: (q) => q * (COUT_D_UNE_FACTURE_PAPIER - COUT_D_UNE_FACTURE_ELECTRONIQUE),
        cout: () => ABONNEMENT_A_LA_PLATEFORME,
        libelles: ["Ce que l'électronique économise", "L'abonnement à la plateforme"],
      }),
      explication: (c) => {
        const k = informationComptable(c);
        const d = COUT_D_UNE_FACTURE_PAPIER - COUT_D_UNE_FACTURE_ELECTRONIQUE;
        return [
          `Chaque facture électronique économise ${eur(d)} : il en faut ${qte(k.seuil)} par an pour payer ${eur(ABONNEMENT_A_LA_PLATEFORME)} (${eur(ABONNEMENT_A_LA_PLATEFORME)} ÷ ${eur(d)}).`,
          `${k.entreprise} échange ${qte(k.factures.total)} factures dans l'année avec des entreprises : ${qte(k.factures.emises)} émises, ${qte(k.factures.recues)} reçues. ${k.factures.total >= k.seuil ? "L'économie paie l'abonnement, et elle y gagne aussi en délais et en erreurs évitées." : "Sur le seul papier, elle n'y gagne pas ; elle y gagne en délais, en erreurs évitées, et la loi l'impose de toute façon."}`,
        ];
      },
    },
    {
      id: "les-acces",
      objectifs: [4],
      type: "choix",
      titre: "Qui peut toucher aux comptes ?",
      question: (c) =>
        `Pour aller plus vite, les salariés de l'atelier de ${informationComptable(c).entreprise} utilisent le même identifiant que le comptable dans le PGI. Qu'en pensez-vous ?`,
      options: () => [
        {
          texte: "Chacun son compte, et des droits selon son métier",
          juste: true,
          retour:
            "Oui : chacun a son identifiant et son mot de passe, et le PGI ne lui ouvre que ce dont il a besoin. On sait qui a saisi quoi. Et une écriture validée ne se modifie plus : une erreur se corrige par une autre écriture.",
        },
        {
          texte: "C'est pratique : tout le monde peut corriger une erreur",
          juste: false,
          retour: "Non : si tout le monde peut tout modifier, une erreur ou une fraude ne se voit plus, et personne n'en répond.",
        },
        {
          texte: "C'est sans risque si le mot de passe est long et compliqué",
          juste: false,
          retour: "Non : un mot de passe solide protège de l'extérieur, pas d'un accès partagé. Partagé, il ne dit plus qui a fait quoi.",
        },
        {
          texte: "Il suffit de sauvegarder chaque jour pour être bien protégé",
          juste: false,
          retour: "Non : une sauvegarde garde une copie des données ; elle n'empêche pas une saisie fausse ou malveillante.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-sauvegarde",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la sauvegarde",
      question: (c) =>
        `Choisissez où ${informationComptable(c).entreprise} garde la copie de ses données comptables, et à quel rythme elle la refait. Le tableau dit combien de jours de saisie seraient perdus dans trois incidents, le 31 décembre. Relevez le défi.`,
      leviers: () => [
        { code: "frequence", libelle: "Jours de saisie entre deux copies", unite: "jours", ...LEVIERS_DE_LA_SAUVEGARDE.frequence, depart: DEPART_DE_LA_SAUVEGARDE.frequence },
        {
          code: "lieu",
          libelle: "Où se garde la copie",
          unite: "",
          min: 0,
          max: LIEUX_DE_LA_COPIE.length - 1,
          pas: 1,
          depart: DEPART_DE_LA_SAUVEGARDE.lieu,
          choix: LIEUX_DE_LA_COPIE.map((l, i) => ({ valeur: i, libelle: l.libelle })),
        },
      ],
      lecture: (_c, p) => {
        const s = sauvegardeDuLaboratoire(p);
        const depart = sauvegardeDuLaboratoire(DEPART_DE_LA_SAUVEGARDE);
        return [
          ...INCIDENTS.map((i) => ({ libelle: i.libelle, montant: s.pertes[i.code], unite: "jours", reference: depart.pertes[i.code] })),
          { libelle: "Au pire", montant: s.pire, unite: "jours", fort: true },
          { libelle: "Prix de la sauvegarde, par an", montant: s.prixParAn },
        ];
      },
      defi: () => ({
        consigne: `Quel que soit l'incident, ne perdez pas plus de ${jours(PERTE_ADMISE)} de saisie.`,
        atteint: (p) => sauvegardeDuLaboratoire(p).pire <= PERTE_ADMISE,
        indice: (p) => {
          const s = sauvegardeDuLaboratoire(p);
          const perdu = INCIDENTS.find((i) => !s.lieu.survit[i.code]);
          if (perdu) return `Une copie gardée ${s.lieu.libelle} disparaît avec ${perdu.mot} : toute l'année serait à ressaisir. Changez de lieu.`;
          return `La copie survit, mais elle date de ${jours(s.pire)} : tout ce qui a été saisi depuis serait perdu. Copiez plus souvent.`;
        },
        solution: SOLUTION_DE_LA_SAUVEGARDE,
      }),
      explication: (_c, p) => {
        const s = sauvegardeDuLaboratoire(p);
        return [
          `Défi relevé : une copie ${s.lieu.libelle}, refaite chaque jour, pour ${eur(s.prixParAn)} par an. Au pire, une journée de saisie est à refaire.`,
          `Le rythme protège de la panne ; seul le lieu protège de l'incendie et du rançongiciel. Sans copie qui survive, ce sont ${qte(JOURS_DE_SAISIE_DE_L_ANNEE)} jours de saisie à refaire. La règle : plusieurs copies, sur des supports différents, dont une hors de l'entreprise.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "income_statement"],
      texte: (c) => {
        const k = informationComptable(c);
        return [
          `La facture d'octobre ${dE(k.entreprise)} est devenue une écriture de ${eur(k.facture.ttc)}, une ligne du compte 411, une part de son solde de ${eur(k.clients.solde)}, puis une créance au bilan. La balance, juste à ${eur(k.totaux.debit)}, garantit que rien ne s'est perdu en route.`,
          "Le PGI saisit une fois et partage partout ; la facture électronique supprime la ressaisie entre entreprises. Ce que le numérique ne fait pas seul : contrôler, protéger les accès, et garder une copie qui survive à tout. Dans l'arène, les comptes de votre entreprise suivent la même chaîne.",
        ];
      },
      repere: () => "Une pièce, une écriture équilibrée ; la balance s'équilibre ; les classes 1 à 5 vont au bilan, 6 et 7 au compte de résultat. Des accès personnels, des copies hors de l'entreprise.",
    },
  ],
};
