import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import { CAMPUSTECH, ELECTRO_COMPOSANTS } from "../monde/exercice-de-nova";
import { TAUX_DE_TVA } from "../monde/nova-gestion";
import { COMMANDE_DE_JEUX, COMMANDE_DE_NOEL, factureDeNoel } from "../monde/ventes-et-achats-de-nova";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LES JEUX DE NOËL (comptabilité générale, palier 3 ; la suite du chapitre « Ventes et achats
 * au complet » et de son cas, « La commande de Noël de CampusTech »).
 *
 * Le cas passait la vente de Noël : l'acompte de CampusTech, la facture, les palettes. Le bureau passe
 * l'achat qui la sert. NOVA commande à Électro-Composants Lyon les jeux de composants des enceintes de
 * Noël, aux conditions de la commande de la rentrée (le prix de toujours, 40 % d'acompte, le même port).
 * L'élève classe la pile, rapproche la commande, le bon de livraison et la facture, chiffre l'avoir que
 * l'écart appelle, passe l'acompte, la facture et l'avoir, puis répond au président.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : l'écart n'est plus sur le prix, il est sur la quantité. La facture
 * porte les jeux commandés, le bon de livraison ceux qui sont arrivés. Et la pile mêle des pièces à
 * saisir, à rapprocher, et une facture déjà passée par un autre service.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS (monde/ventes-et-achats-de-nova.ts : la commande
 * de Noël, les conditions de la commande de jeux de la rentrée). LES HYPOTHÈSES DU BUREAU, les seules :
 * les dates de la commande, de la livraison et du règlement des jeux, et les jeux manquants
 * (JEUX_DE_NOEL, ci-dessous).
 */

/**
 * LES JEUX DE NOËL (hypothèse du bureau) : NOVA les commande le 4 novembre N + 1, deux jours après la
 * commande de CampusTech, comme pour la rentrée ; Électro-Composants livre et facture le 11 novembre,
 * sept jours plus tard, et se paie à 22 jours, le 3 décembre. Il livre 20 jeux de moins qu'il n'en
 * facture : la rupture d'un composant, qu'il reconnaît par courriel.
 */
export const JEUX_DE_NOEL = {
  jeux: COMMANDE_DE_NOEL.enceintes,
  manquants: 20,
  commande: "4 novembre N + 1",
  facture: "11 novembre N + 1",
  reglement: "3 décembre N + 1",
} as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const J = JEUX_DE_NOEL;
const K = COMMANDE_DE_JEUX;

/** Les chiffres du bureau : l'acompte, la facture telle qu'elle arrive, l'avoir de l'écart, ce qui reste dû. */
export function jeuxDeNoel() {
  const commandeHt = auCentime(J.jeux * K.prixConvenu);
  const ttcDeLaCommande = auCentime(commandeHt * (1 + TAUX_DE_TVA));
  const acompteTtc = auCentime(ttcDeLaCommande * K.acompte);
  const acompteHt = auCentime(acompteTtc / (1 + TAUX_DE_TVA));
  const acompte = { ttc: acompteTtc, ht: acompteHt, tva: auCentime(acompteTtc - acompteHt) };
  const jeux = commandeHt;
  const ht = auCentime(jeux + K.port);
  const tva = auCentime(ht * TAUX_DE_TVA);
  const ttc = auCentime(ht + tva);
  const facture = { jeux, port: K.port, ht, tva, ttc, netAPayer: auCentime(ttc - acompte.ttc), tvaRestante: auCentime(tva - acompte.tva) };
  const livres = J.jeux - J.manquants;
  const avoirHt = auCentime(J.manquants * K.prixConvenu);
  const avoirTva = auCentime(avoirHt * TAUX_DE_TVA);
  const avoir = { ht: avoirHt, tva: avoirTva, ttc: auCentime(avoirHt + avoirTva) };
  return {
    commandeHt,
    ttcDeLaCommande,
    acompte,
    facture,
    livres,
    avoir,
    resteDu: auCentime(facture.netAPayer - avoir.ttc),
    /** Ce que les jeux de Noël coûtent à NOVA, hors taxes : les jeux livrés et le port. */
    coutHt: auCentime(livres * K.prixConvenu + K.port),
  };
}

const x = jeuxDeNoel();
const vente = factureDeNoel();

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: "14 novembre N + 1",
  objet: "Les jeux de Noël",
  paragraphes: [
    "Bonjour,",
    `Pour la commande de Noël de ${CAMPUSTECH.nom}, nous avons commandé ses jeux à ${ELECTRO_COMPOSANTS.nom}. Les pièces sont sur votre poste.`,
    "Pouvez-vous passer ce qui doit l'être ? J'ai besoin de savoir ce que nous devons encore au fournisseur, ce que ces jeux nous coûtent, et où en est notre acompte.",
    "Merci. Le président",
  ],
};

const BON_DE_COMMANDE: PieceDuBureau = {
  code: "commande",
  nature: "bon-de-commande",
  titre: `Bon de commande de NOVA du ${J.commande}`,
  de: "NOVA",
  a: ELECTRO_COMPOSANTS.nom,
  date: J.commande,
  objet: `Les jeux de composants de ${qte(J.jeux)} NOVA One`,
  montants: [
    { libelle: `${qte(J.jeux)} jeux à ${eur(K.prixConvenu)}, hors taxes`, montant: x.commandeHt },
    { libelle: "Total taxes comprises", montant: x.ttcDeLaCommande, fort: true },
  ],
  mention: `Conditions de la rentrée : ${pct(K.acompte)} d'acompte toutes taxes comprises à la commande ; port de ${eur(K.port)} hors taxes, facturé à la livraison ; solde à 22 jours.`,
};

const FACTURE_D_ACOMPTE: PieceDuBureau = {
  code: "facture-d-acompte",
  nature: "facture",
  titre: "Facture d'acompte d'Électro-Composants",
  de: ELECTRO_COMPOSANTS.nom,
  a: "NOVA",
  date: J.commande,
  objet: `Acompte de ${pct(K.acompte)} sur votre commande du ${J.commande}`,
  montants: [
    { libelle: "Acompte, hors taxes", montant: x.acompte.ht },
    { libelle: "TVA", montant: x.acompte.tva },
    { libelle: "Acompte taxes comprises, réglé par virement ce jour", montant: x.acompte.ttc, fort: true },
  ],
};

const BON_DE_LIVRAISON: PieceDuBureau = {
  code: "livraison",
  nature: "bon-de-livraison",
  titre: `Bon de livraison du ${J.facture}`,
  de: ELECTRO_COMPOSANTS.nom,
  a: "NOVA, réception",
  date: J.facture,
  objet: `Votre commande du ${J.commande}`,
  paragraphes: [`Jeux de composants livrés et contrôlés à la réception : ${qte(x.livres)}.`],
  mention: "Signé par le magasinier de NOVA, sans réserve sur les jeux reçus.",
};

const FACTURE: PieceDuBureau = {
  code: "facture",
  nature: "facture",
  titre: `Facture d'Électro-Composants du ${J.facture}`,
  de: ELECTRO_COMPOSANTS.nom,
  a: "NOVA",
  date: J.facture,
  objet: `Votre commande du ${J.commande}`,
  montants: [
    { libelle: `${qte(J.jeux)} jeux à ${eur(K.prixConvenu)}`, montant: x.facture.jeux },
    { libelle: "Port", montant: x.facture.port },
    { libelle: "Total hors taxes", montant: x.facture.ht },
    { libelle: `TVA à ${pct(TAUX_DE_TVA)}`, montant: x.facture.tva },
    { libelle: "Total taxes comprises", montant: x.facture.ttc },
    { libelle: `Acompte reçu le ${J.commande}, à déduire`, montant: x.acompte.ttc },
    { libelle: `Net à payer le ${J.reglement}`, montant: x.facture.netAPayer, fort: true },
  ],
};

const COURRIEL_DU_FOURNISSEUR: PieceDuBureau = {
  code: "courriel-fournisseur",
  nature: "courriel",
  titre: "Courriel d'Électro-Composants",
  de: `Le service clients d'${ELECTRO_COMPOSANTS.nom}`,
  a: "Le service comptable de NOVA",
  date: "13 novembre N + 1",
  objet: "Votre réclamation",
  paragraphes: [
    "Bonjour,",
    "Vous avez raison : une rupture de composant nous a empêchés de livrer toute la commande, et notre facture porte les jeux commandés, non les jeux livrés. Nous ne livrerons pas les jeux manquants.",
    "Nous vous accordons un avoir pour les jeux non livrés, au prix de la facture, TVA comprise. Vous pouvez le déduire de notre facture dès aujourd'hui.",
    "Le service clients",
  ],
};

const FACTURE_DE_VENTE: PieceDuBureau = {
  code: "vente",
  nature: "facture",
  titre: `Facture de NOVA à ${CAMPUSTECH.nom} du ${COMMANDE_DE_NOEL.facture}`,
  de: "NOVA",
  a: CAMPUSTECH.nom,
  date: COMMANDE_DE_NOEL.facture,
  objet: `${qte(COMMANDE_DE_NOEL.enceintes)} NOVA One pour Noël`,
  montants: [
    { libelle: "Enceintes et port, hors taxes", montant: vente.baseDeTva },
    { libelle: "TVA", montant: vente.tva },
    { libelle: "Palettes consignées", montant: vente.consignation },
    { libelle: "Acompte déduit", montant: vente.acompte.ttc },
    { libelle: "Net à payer", montant: vente.netAPayer, fort: true },
  ],
  mention: `Copie. Passée au journal des ventes par le service facturation le ${COMMANDE_DE_NOEL.facture}.`,
};

/** La pile, telle qu'elle est posée sur le bureau : le courriel dessus, puis dans l'ordre d'arrivée. */
const PILE: readonly PieceDuBureau[] = [COURRIEL, BON_DE_COMMANDE, FACTURE_D_ACOMPTE, BON_DE_LIVRAISON, FACTURE, COURRIEL_DU_FOURNISSEUR, FACTURE_DE_VENTE];

// ─────────────────────────────────────────────────────────────────────────────
// LE CONTRÔLE
// ─────────────────────────────────────────────────────────────────────────────

/** Le contrôle des trois documents, et l'avoir qu'il appelle : un tableau à compléter, corrigé au serveur. */
export function grilleDuControle(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string, unite?: string) => ({ valeur, saisir: true, calcul, indice, ...(unite ? { unite } : {}) });
  return {
    titre: "Commande, bon de livraison, facture",
    colonnes: ["Contrôle"],
    lignes: [
      { libelle: "Jeux commandés", cellules: [{ valeur: J.jeux, unite: "jeux" }] },
      { libelle: "Jeux livrés", cellules: [saisir(x.livres, `le bon de livraison : ${qte(x.livres)} jeux`, "ce que le magasinier a reçu", "jeux")] },
      { libelle: "Jeux facturés", cellules: [saisir(J.jeux, `la facture : ${qte(J.jeux)} jeux`, "ce que la facture fait payer", "jeux")] },
      { libelle: "Jeux facturés sans être livrés", cellules: [saisir(J.manquants, `${qte(J.jeux)} − ${qte(x.livres)} = ${qte(J.manquants)} jeux`, "les jeux facturés moins les jeux livrés", "jeux")] },
      { libelle: "Avoir à recevoir, hors taxes", cellules: [saisir(x.avoir.ht, `${qte(J.manquants)} × ${eur(K.prixConvenu)} = ${eur(x.avoir.ht)}`, "les jeux manquants, au prix de la facture")] },
      { libelle: "TVA de l'avoir", cellules: [saisir(x.avoir.tva, `${eur(x.avoir.ht)} × ${pct(TAUX_DE_TVA)} = ${eur(x.avoir.tva)}`, "la TVA de l'avoir, au taux de la facture")] },
      { libelle: "Avoir à recevoir, toutes taxes comprises", fort: true, totalDe: { plus: [4, 5] }, cellules: [saisir(x.avoir.ttc, `${eur(x.avoir.ht)} + ${eur(x.avoir.tva)} = ${eur(x.avoir.ttc)}`, "le hors taxes et la TVA de l'avoir")] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES ÉCRITURES
// ─────────────────────────────────────────────────────────────────────────────

const ECRITURE_DE_L_ACOMPTE: EcritureAttendue = {
  date: J.commande,
  libelle: `Acompte à ${ELECTRO_COMPOSANTS.nom}, jeux de Noël`,
  lignes: [
    { role: "l'acompte versé au fournisseur", compte: "4091", acceptes: ["409"], sens: "debit", montant: x.acompte.ht, indice: "l'acompte hors taxes" },
    { role: "la TVA déductible sur l'acompte", compte: "44566", sens: "debit", montant: x.acompte.tva, indice: "la TVA de la facture d'acompte" },
    { role: "le paiement par la banque", compte: "512", sens: "credit", montant: x.acompte.ttc, indice: "l'acompte viré, taxes comprises" },
  ],
};

const ECRITURE_DE_LA_FACTURE: EcritureAttendue = {
  date: J.facture,
  libelle: `Facture ${ELECTRO_COMPOSANTS.nom}, jeux de Noël`,
  lignes: [
    { role: "l'achat des jeux, tels que facturés", compte: "601", acceptes: ["602"], sens: "debit", montant: x.facture.jeux, indice: "les jeux de la facture, hors taxes" },
    { role: "le port payé sur l'achat", compte: "6241", acceptes: ["624"], sens: "debit", montant: x.facture.port, indice: "le port hors taxes" },
    { role: "la TVA déductible qui reste", compte: "44566", sens: "debit", montant: x.facture.tvaRestante, indice: "la TVA de la facture, moins celle de l'acompte" },
    { role: "l'acompte qui s'impute", compte: "4091", acceptes: ["409"], sens: "credit", montant: x.acompte.ht, indice: "l'acompte hors taxes" },
    { role: "la dette fournisseur", compte: "401", sens: "credit", montant: x.facture.netAPayer, indice: "le net à payer de la facture" },
  ],
};

const ECRITURE_DE_L_AVOIR: EcritureAttendue = {
  date: J.facture,
  libelle: `Avoir ${ELECTRO_COMPOSANTS.nom}, jeux non livrés`,
  lignes: [
    { role: "la dette fournisseur qui baisse", compte: "401", sens: "debit", montant: x.avoir.ttc, indice: "l'avoir, toutes taxes comprises" },
    { role: "l'achat corrigé", compte: "601", acceptes: ["609"], sens: "credit", montant: x.avoir.ht, indice: "les jeux manquants, hors taxes" },
    { role: "la TVA déductible corrigée", compte: "44566", sens: "credit", montant: x.avoir.tva, indice: "la TVA de l'avoir" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LES_JEUX_DE_NOEL: Bureau = {
  code: "les-jeux-de-noel",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["ventes-et-achats-au-complet"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Au bureau : les jeux de Noël",
  accroche: "Les jeux de composants de la commande de Noël sont arrivés, avec leur facture. Classez la pile, rapprochez les trois documents, passez l'acompte, la facture et l'avoir, puis répondez au président.",
  objectifs: [
    "Trier une pile d'achat : ce qui se saisit, ce qui se rapproche d'abord, ce qui ne se saisit pas",
    "Rapprocher une commande, un bon de livraison et une facture, et chiffrer l'avoir d'un écart de quantité",
    "Passer l'acompte versé, la facture qui l'impute et l'avoir du fournisseur",
    "Dire ce qui reste dû au fournisseur, et ce que l'achat coûte vraiment",
  ],
  libre: false,
  accueil: [
    "Le 14 novembre N + 1, au siège de NOVA. La commande de Noël de CampusTech est lancée ; ses jeux de composants viennent d'arriver.",
    "Sur votre poste, la pile : le courriel du président dessus, puis le bon de commande, la facture d'acompte, le bon de livraison, la facture du fournisseur, son courriel, et une copie de la facture de Noël. Rien ne vous dit ce qu'il faut en faire.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande : la saisir telle quelle, la rapprocher d'une autre pièce avant tout, ou rien à saisir.",
      pieces: ["courriel"],
      categories: [
        { code: "a-saisir", libelle: "À saisir" },
        { code: "a-rapprocher", libelle: "À rapprocher d'abord" },
        { code: "rien", libelle: "Rien à saisir" },
      ],
      elements: [
        { code: "commande", piece: "commande", libelle: BON_DE_COMMANDE.titre, categorie: "a-rapprocher", pourquoi: "Une commande ne crée ni dette ni créance ; elle sert à contrôler la facture : ce qui a été commandé, et à quel prix." },
        { code: "facture-d-acompte", piece: "facture-d-acompte", libelle: FACTURE_D_ACOMPTE.titre, categorie: "a-saisir", pourquoi: "L'acompte est versé : une créance sur le fournisseur, avec sa TVA déjà déductible." },
        { code: "livraison", piece: "livraison", libelle: BON_DE_LIVRAISON.titre, categorie: "a-rapprocher", pourquoi: "Le bon de livraison dit ce qui est arrivé : il se rapproche de la commande et de la facture." },
        { code: "facture", piece: "facture", libelle: FACTURE.titre, categorie: "a-rapprocher", pourquoi: "Une facture d'achat se contrôle avant de se payer : ici, elle porte plus de jeux que le bon de livraison." },
        { code: "courriel-fournisseur", piece: "courriel-fournisseur", libelle: COURRIEL_DU_FOURNISSEUR.titre, categorie: "a-saisir", pourquoi: "Le fournisseur reconnaît l'écart et accorde l'avoir : il se passe, au montant du contrôle." },
        { code: "vente", piece: "vente", libelle: FACTURE_DE_VENTE.titre, categorie: "rien", pourquoi: "C'est une copie, déjà passée par le service facturation : la saisir une seconde fois doublerait la vente." },
      ],
      explication: [
        "Trois pièces se rapprochent avant toute saisie : la commande, le bon de livraison et la facture. L'acompte et l'avoir se saisissent. La copie de la vente ne se saisit pas : une pièce ne se passe qu'une fois.",
      ],
    },
    {
      id: "le-controle",
      type: "etat",
      titre: "Rapprocher les trois documents",
      consigne: "Complétez le contrôle : les jeux livrés, les jeux facturés, l'écart, puis l'avoir qu'il appelle, au prix de la facture.",
      pieces: ["commande", "livraison", "facture"],
      grille: grilleDuControle(),
      explication: [
        `Le prix et le port concordent ; la quantité, non : ${qte(J.manquants)} jeux facturés n'ont pas été livrés. L'avoir les retire, ${eur(x.avoir.ttc)} taxes comprises.`,
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer l'achat",
      consigne: "Passez l'acompte, la facture telle qu'elle est arrivée, puis l'avoir que le fournisseur accorde, une à une, dans l'ordre que vous voulez.",
      pieces: ["facture-d-acompte", "facture", "courriel-fournisseur"],
      horsListe: "Cette écriture ne correspond à aucune pièce qui reste à passer : relisez la facture d'acompte, la facture et le courriel du fournisseur.",
      ecritures: [
        { id: "acompte", ecriture: ECRITURE_DE_L_ACOMPTE, indices: ["L'acompte versé n'est pas encore un achat : c'est une créance sur le fournisseur.", "La TVA de la facture d'acompte se déduit déjà."] },
        {
          id: "facture",
          ecriture: ECRITURE_DE_LA_FACTURE,
          indices: ["La facture se passe telle qu'elle est arrivée ; l'avoir la corrigera.", "L'acompte s'impute pour son hors taxes ; une part de la TVA a déjà été déduite sur l'acompte."],
        },
        { id: "avoir", ecriture: ECRITURE_DE_L_AVOIR, indices: ["Un avoir défait une part de la facture : chaque ligne s'inverse, pour les jeux manquants.", "Il corrige une erreur de facturation : il se passe à l'achat lui-même."] },
      ],
      explication: [
        `Le 4091 est soldé : l'acompte s'est imputé sur la facture. Le 401 porte ${eur(x.facture.netAPayer)} moins l'avoir, ${eur(x.avoir.ttc)} : ${eur(x.resteDu)} à payer le ${J.reglement}.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux trois questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-reste-du",
          question: `Que devons-nous encore à ${ELECTRO_COMPOSANTS.nom} ?`,
          options: [
            { texte: `${eur(x.resteDu)}, avoir déduit`, juste: true, retour: `Oui : le net à payer de la facture, ${eur(x.facture.netAPayer)}, moins l'avoir des jeux manquants, ${eur(x.avoir.ttc)}, à régler le ${J.reglement}.` },
            { texte: `${eur(x.facture.netAPayer)}, le net à payer que porte la facture`, juste: false, retour: `Non : la facture fait payer ${qte(J.manquants)} jeux qui ne sont pas arrivés. L'avoir les retire.` },
            { texte: `${eur(x.facture.ttc - x.avoir.ttc)}, la facture et l'avoir, sans compter l'acompte`, juste: false, retour: `Non : l'acompte, ${eur(x.acompte.ttc)}, est déjà payé. Il se déduit de ce qui reste dû.` },
            { texte: `${eur(x.facture.netAPayer + x.avoir.ttc)}, la facture plus l'avoir à reverser`, juste: false, retour: "Non : l'avoir est accordé par le fournisseur à NOVA. Il diminue la dette, il ne l'augmente pas." },
          ],
        },
        {
          id: "le-cout",
          question: "Que nous coûtent ces jeux, hors taxes ?",
          options: [
            { texte: `${eur(x.coutHt)}, port compris`, juste: true, retour: `Oui : ${qte(x.livres)} jeux à ${eur(K.prixConvenu)} et ${eur(K.port)} de port. L'acompte ne change pas le coût : il change le moment où l'on paie.` },
            { texte: `${eur(x.facture.ht)}, le hors taxes de la facture`, juste: false, retour: `Non : ${qte(J.manquants)} jeux de la facture ne sont pas arrivés ; l'avoir les retire du coût.` },
            { texte: `${eur(x.coutHt - x.acompte.ht)}, une fois l'acompte déduit du coût`, juste: false, retour: "Non : l'acompte est une avance sur le prix, pas une réduction. Les jeux coûtent autant, payés en deux fois." },
            { texte: `${eur(x.livres * K.prixConvenu)}, les seuls jeux livrés, le port étant une charge à part`, juste: false, retour: "Non : le port payé est un frais accessoire d'achat ; il fait partie du coût des jeux." },
          ],
        },
        {
          id: "l-acompte",
          question: "Où en est l'acompte versé ?",
          options: [
            { texte: "Soldé : la facture l'a imputé", juste: true, retour: `Oui : le 4091 a reçu ${eur(x.acompte.ht)} au débit le ${J.commande}, et autant au crédit le ${J.facture}. Il ne reste rien à récupérer.` },
            { texte: "Il reste à récupérer auprès du fournisseur, avec l'avoir", juste: false, retour: "Non : l'acompte est déjà déduit de la facture. Le récupérer une seconde fois le compterait deux fois." },
            { texte: `Il reste au 4091 jusqu'au règlement du ${J.reglement}`, juste: false, retour: "Non : il s'impute le jour de la facture, qui le déduit. Le règlement ne paie que le reste." },
            { texte: "Il est devenu une charge de novembre, comme les jeux", juste: false, retour: "Non : l'achat porte tout le prix des jeux ; l'acompte n'est qu'une façon de le payer. Il ne s'ajoute pas aux charges." },
          ],
        },
      ],
      explication: [
        `Votre réponse : NOVA doit ${eur(x.resteDu)} à ${ELECTRO_COMPOSANTS.nom} ; les jeux lui coûtent ${eur(x.coutHt)} hors taxes ; l'acompte est soldé.`,
      ],
    },
  ],
};
