import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { DATE_DE_REVENTE, PRIX_DE_L_OCCASION, anneeDuPlan, dateDuPlan } from "../chapitres/immobilisations";
import { JOURS_DE_L_ANNEE, auCentime } from "../monde/amortissement";
import { DELAI_DES_FACTURES, MISE_EN_SERVICE_DE_LA_NOUVELLE, remplacementDeLaCuisine } from "../monde/remplacement-de-la-cuisine";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LE REMPLACEMENT DE LA CUISINE (comptabilité générale, palier 3 ; la suite du chapitre
 * « Immobilisations et amortissements » et de son cas, « Un second équipement »).
 *
 * Début juillet de la 3e année, chez LA TABLE D'AUGUSTIN : l'ancienne cuisine a été cédée le 30 juin au
 * repreneur, la nouvelle installée le 1er juillet. L'élève trie la pile, range les lignes de la facture
 * du fournisseur, chiffre la sortie de l'une et l'entrée de l'autre, passe les trois écritures, puis
 * répond au dirigeant. Tous les chiffres se calculent dans le monde du cours
 * (monde/remplacement-de-la-cuisine.ts) ; ce fichier écrit la pile, les consignes et les corrigés, qui
 * ne partent jamais au navigateur (pedagogy/cours/bureau-servi.ts, app/cours/bureau/actions.ts).
 *
 * UN CRAN PLUS LOIN QUE LE CAS : la cession et l'achat le même mois, la dotation de l'année jusqu'au jour
 * de la cession, une facture qui mêle le coût et les charges, et un devis dans la pile qui ne se saisit pas.
 */

const x = remplacementDeLaCuisine();
const a = x.ancienne;
const n = x.nouvelle;
const d = n.devis;
const eur = (v: number) => montantEcrit(v + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const CESSION = dateDuPlan(DATE_DE_REVENTE);
const MISE_EN_SERVICE = dateDuPlan(MISE_EN_SERVICE_DE_LA_NOUVELLE);
const FIN_DE_L_ANNEE = dateDuPlan({ jour: 31, mois: 12, exercice: DATE_DE_REVENTE.exercice });
const MISE_EN_SERVICE_DE_L_ANCIENNE = dateDuPlan({ jour: x.c.immobilisation.date, mois: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du dirigeant",
  de: `Le dirigeant de ${x.entreprise}`,
  a: "La comptabilité",
  date: MISE_EN_SERVICE,
  objet: "La cuisine",
  paragraphes: [
    "Bonjour,",
    `Le repreneur a pris l'ancienne cuisine hier, et la nouvelle tourne depuis ce matin. Vous trouverez les pièces sur votre bureau.`,
    "Passez ce qu'il faut, puis dites-moi trois choses : ce que la vente de l'ancienne nous fait gagner ou perdre ; ce que vaut la nouvelle dans nos comptes ; ce qu'elle nous coûtera en amortissement cette année.",
    "Merci. Le dirigeant",
  ],
};

const FICHE: PieceDuBureau = {
  code: "fiche",
  nature: "fiche",
  titre: "Fiche d'immobilisation de l'ancienne cuisine",
  de: `La comptabilité de ${x.entreprise}`,
  a: "La comptabilité",
  date: dateDuPlan({ jour: 31, mois: 12, exercice: 1 }),
  objet: `${a.designation}, compte ${a.compte}`,
  paragraphes: [`Mise en service le ${MISE_EN_SERVICE_DE_L_ANCIENNE}. Amortissement linéaire sur ${qte(a.duree)} ans, sans valeur résiduelle, en mois de 30 jours, le jour de la mise en service compté.`],
  montants: [
    { libelle: "Valeur brute, hors taxes", montant: a.base },
    { libelle: `Dotation de la ${anneeDuPlan(0)}`, montant: a.premiere },
    { libelle: `Dotation de la ${anneeDuPlan(1)}`, montant: a.deuxieme },
    { libelle: `Valeur nette au 31 décembre de la ${anneeDuPlan(1)}`, montant: auCentime(a.base - a.avantLaCession), fort: true },
  ],
  mention: "Aucune dotation n'est encore passée cette année.",
};

const FACTURE_DE_CESSION: PieceDuBureau = {
  code: "cession",
  nature: "facture",
  titre: "Facture de cession de l'ancienne cuisine",
  de: x.entreprise,
  a: "Le repreneur d'équipement d'occasion",
  date: CESSION,
  objet: `Cession : ${a.designation.toLowerCase()}, en l'état`,
  montants: [
    { libelle: "Prix de cession, hors taxes", montant: a.prix },
    { libelle: `TVA à ${pct(x.tauxDeLaCession)}`, montant: a.tvaDuPrix },
    { libelle: `Total, payable à ${DELAI_DES_FACTURES} jours`, montant: a.prixTtc, fort: true },
  ],
  mention: `Le repreneur offre ${pct(PRIX_DE_L_OCCASION)} du prix d'une cuisine neuve.`,
};

/** Les lignes de la facture du fournisseur : celles du devis du chapitre. */
const LIGNES_DE_LA_FACTURE = [
  { code: "prix", libelle: "Prix catalogue, hors taxes", montant: d.prix },
  { code: "remise", libelle: `Remise de ${pct(n.remise)}, à déduire`, montant: d.remise },
  { code: "livraison", libelle: "Livraison", montant: d.livraison },
  { code: "installation", libelle: "Installation et essais de mise en route", montant: d.installation },
  { code: "formation", libelle: "Formation de l'équipe de cuisine", montant: d.formation },
  { code: "entretien", libelle: "Contrat d'entretien de la première année", montant: d.entretien },
] as const;

const FACTURE_DU_FOURNISSEUR: PieceDuBureau = {
  code: "facture",
  nature: "facture",
  titre: "Facture de la nouvelle cuisine",
  de: "Le fournisseur de cuisines professionnelles",
  a: x.entreprise,
  date: MISE_EN_SERVICE,
  objet: `${a.designation}, modèle identique`,
  montants: [
    ...LIGNES_DE_LA_FACTURE.map((l) => ({ libelle: l.libelle, montant: l.montant })),
    { libelle: "Total hors taxes", montant: n.totalHt },
    { libelle: `TVA à ${pct(n.tauxTva)}`, montant: n.tva },
    { libelle: `Total, payable à ${DELAI_DES_FACTURES} jours`, montant: n.ttc, fort: true },
  ],
};

const BON: PieceDuBureau = {
  code: "bon",
  nature: "bon",
  titre: "Bon de livraison et d'installation",
  de: "Le fournisseur de cuisines professionnelles",
  a: x.entreprise,
  date: MISE_EN_SERVICE,
  paragraphes: [`Cuisine livrée, installée et essayée le ${MISE_EN_SERVICE}. Essais concluants : la cuisine est en service.`],
  mention: "Signé par le chef de cuisine.",
};

const DEVIS: PieceDuBureau = {
  code: "devis",
  nature: "lettre",
  titre: "Devis d'une cuisine plus grande",
  de: "Le fournisseur de cuisines professionnelles",
  a: x.entreprise,
  date: MISE_EN_SERVICE,
  objet: "Pour votre prochain agrandissement",
  paragraphes: ["Si votre salle s'agrandit, voici notre modèle supérieur, avec les mêmes conditions."],
  montants: [{ libelle: "Prix catalogue, hors taxes", montant: x.devisPlusGrand, fort: true }],
  mention: "Devis valable trois mois.",
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, FICHE, FACTURE_DE_CESSION, FACTURE_DU_FOURNISSEUR, BON, DEVIS];

// ─────────────────────────────────────────────────────────────────────────────
// LE CALCUL
// ─────────────────────────────────────────────────────────────────────────────

/** La sortie de l'ancienne cuisine et l'entrée de la nouvelle : un tableau à compléter, corrigé au serveur. */
export function grilleDuRemplacement(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  return {
    titre: "La cuisine, de l'ancienne à la nouvelle",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Valeur brute de l'ancienne cuisine", cellules: [{ valeur: a.base }] },
      { libelle: "Amortissements des deux premières années", cellules: [saisir(a.avantLaCession, `${eur(a.premiere)} + ${eur(a.deuxieme)} = ${eur(a.avantLaCession)}`, "les deux dotations de la fiche")] },
      {
        libelle: `Dotation de l'année, jusqu'au ${CESSION}`,
        cellules: [saisir(a.dotation, `${eur(a.annuite)} × ${qte(a.jours)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(a.dotation)}`, "l'annuité, au prorata des jours jusqu'à la cession")],
      },
      { libelle: "Amortissements cumulés à la cession", totalDe: { plus: [1, 2] }, cellules: [saisir(a.cumul, `${eur(a.avantLaCession)} + ${eur(a.dotation)} = ${eur(a.cumul)}`, "tout ce qui a été amorti, jusqu'au jour de la cession")] },
      { libelle: "Valeur nette comptable à la cession", totalDe: { plus: [0], moins: [3] }, cellules: [saisir(a.valeurNette, `${eur(a.base)} − ${eur(a.cumul)} = ${eur(a.valeurNette)}`, "la valeur brute moins les amortissements cumulés")] },
      { libelle: "Prix de cession, hors taxes", cellules: [{ valeur: a.prix }] },
      { libelle: "Résultat de cession", fort: true, totalDe: { plus: [5], moins: [4] }, cellules: [saisir(a.resultat, `${eur(a.prix)} − ${eur(a.valeurNette)} = ${eur(a.resultat)}`, "le prix face à la valeur nette, en négatif pour une perte")] },
      {
        libelle: "Coût d'acquisition de la nouvelle cuisine",
        cellules: [saisir(n.cout, `${eur(d.prix)} − ${eur(d.remise)} + ${eur(d.livraison)} + ${eur(d.installation)} = ${eur(n.cout)}`, "le prix net de remise, et les frais pour qu'elle serve")],
      },
      {
        libelle: `Dotation de la nouvelle cuisine, jusqu'au ${FIN_DE_L_ANNEE}`,
        fort: true,
        cellules: [saisir(n.dotation, `${eur(n.cout)} ÷ ${qte(a.duree)} × ${qte(n.jours)} ÷ ${qte(JOURS_DE_L_ANNEE)} = ${eur(n.dotation)}`, "l'annuité du coût d'acquisition, au prorata des jours de service")],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const pourquoiDeLaLigne = {
  prix: "Le prix d'achat est le cœur du coût d'acquisition.",
  remise: "Une remise obtenue à l'achat vient en moins du coût : la cuisine entre à l'actif pour son prix net.",
  livraison: "Sans transport, la cuisine ne serait pas là où elle doit servir : des frais accessoires, dans le coût.",
  installation: "Ce qu'il faut pour mettre la cuisine en état de fonctionner entre dans son coût, essais compris.",
  formation: "La formation sert l'équipe, pas la mise en état de la cuisine : le plan comptable l'exclut du coût.",
  entretien: "L'entretien garde la cuisine en état sans en augmenter la valeur : une charge de l'année qu'il couvre.",
};

export const LE_REMPLACEMENT_DE_LA_CUISINE: Bureau = {
  code: "le-remplacement-de-la-cuisine",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["immobilisations"],
  commanditaire: "Le dirigeant",
  entreprise: { code: x.c.code, nom: x.entreprise },
  titre: "Au bureau : le remplacement de la cuisine",
  accroche: "L'ancienne cuisine est vendue, la nouvelle installée. Triez la pile, séparez le coût des charges, chiffrez la sortie de l'une et l'entrée de l'autre, passez les écritures, puis répondez au dirigeant.",
  objectifs: [
    "Trier les pièces d'un remplacement d'équipement : ce qui se saisit, ce qui se consulte, ce qui ne s'enregistre pas",
    "Séparer, sur une facture, ce qui entre dans le coût d'acquisition et ce qui va en charges",
    "Amortir jusqu'au jour de la cession, puis calculer la valeur nette et le résultat de cession",
    "Passer la dotation, la cession et l'acquisition, et amortir la nouvelle cuisine au prorata",
  ],
  libre: false,
  accueil: [
    `Le ${MISE_EN_SERVICE}, au bureau de ${x.entreprise}. L'ancienne cuisine a servi deux ans et demi ; le repreneur l'a prise le ${CESSION}, la nouvelle est en service ce matin.`,
    "Sur votre poste, le courriel du dirigeant et les pièces du remplacement. Ouvrez-les une à une : rien ne vous dit ce qu'il faut en faire.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande : une écriture, une lecture pour le calcul, ou rien du tout.",
      pieces: ["courriel"],
      categories: [
        { code: "a-saisir", libelle: "À saisir" },
        { code: "a-consulter", libelle: "À consulter pour le calcul" },
        { code: "rien", libelle: "Rien à faire" },
      ],
      elements: [
        { code: "fiche", piece: "fiche", libelle: FICHE.titre, categorie: "a-consulter", pourquoi: "La fiche donne la valeur brute et les dotations passées : elle sert au calcul de la valeur nette, elle ne se saisit pas." },
        { code: "cession", piece: "cession", libelle: FACTURE_DE_CESSION.titre, categorie: "a-saisir", pourquoi: "La cession fait sortir l'ancienne cuisine des comptes et crée une créance sur le repreneur : une écriture." },
        { code: "facture", piece: "facture", libelle: FACTURE_DU_FOURNISSEUR.titre, categorie: "a-saisir", pourquoi: "L'achat de la nouvelle cuisine, et des charges qui l'accompagnent : une écriture." },
        { code: "bon", piece: "bon", libelle: BON.titre, categorie: "a-consulter", pourquoi: `Le bon donne la date de mise en service, le ${MISE_EN_SERVICE} : c'est d'elle que part l'amortissement.` },
        { code: "devis", piece: "devis", libelle: DEVIS.titre, categorie: "rien", pourquoi: "Un devis n'engage personne tant qu'il n'est pas signé : aucune écriture, aucune dette." },
      ],
      explication: ["Deux pièces se saisissent, deux se lisent pour le calcul, une se range sans écriture. Le devis est un piège classique : il ressemble à une facture, il n'en est pas une."],
    },
    {
      id: "la-facture",
      type: "classement",
      titre: "Le coût, ou les charges",
      consigne: "Rangez chaque ligne de la facture du fournisseur : entre-t-elle dans le coût de la nouvelle cuisine, qui s'amortira, ou va-t-elle en charges de l'année ?",
      pieces: ["facture"],
      categories: [
        { code: "cout", libelle: "Dans le coût de la cuisine" },
        { code: "charge", libelle: "En charges de l'année" },
      ],
      elements: LIGNES_DE_LA_FACTURE.map((l) => ({
        code: l.code,
        libelle: l.libelle,
        montant: l.code === "remise" ? -l.montant : l.montant,
        categorie: l.code === "formation" || l.code === "entretien" ? "charge" : "cout",
        pourquoi: pourquoiDeLaLigne[l.code],
      })),
      explication: [`Le coût d'acquisition, c'est le prix net de remise et les frais pour que la cuisine serve : ${eur(n.cout)}. La formation et l'entretien, ${eur(n.charges)}, pèsent tout de suite sur le résultat de l'année.`],
    },
    {
      id: "le-calcul",
      type: "etat",
      titre: "Chiffrer la sortie et l'entrée",
      consigne: "Complétez le tableau : l'ancienne cuisine jusqu'au jour de sa cession, puis la nouvelle, du 1er juillet au 31 décembre. Un résultat de cession négatif est une perte.",
      pieces: ["fiche", "cession", "facture"],
      grille: grilleDuRemplacement(),
      explication: [
        `L'ancienne cuisine vaut ${eur(a.valeurNette)} le jour de sa cession ; le repreneur en donne ${eur(a.prix)} : une moins-value de ${eur(-a.resultat)}.`,
        `La nouvelle entre à l'actif pour ${eur(n.cout)}. Elle ne sert que ${qte(n.jours)} jours cette année : sa première dotation est la moitié d'une annuité, ${eur(n.dotation)}.`,
      ],
    },
    {
      id: "les-ecritures",
      type: "journal",
      titre: "Passer les écritures",
      consigne: "Passez au journal les trois écritures du remplacement, dans l'ordre que vous voulez : la dotation de l'ancienne cuisine jusqu'à sa cession, sa cession, l'achat de la nouvelle.",
      pieces: ["cession", "facture"],
      ecritures: [
        {
          id: "dotation",
          ecriture: {
            date: CESSION,
            libelle: "Dotation de l'ancienne cuisine, jusqu'à sa cession",
            lignes: [
              { role: "la dotation de l'année", compte: "6811", acceptes: ["681"], sens: "debit", montant: a.dotation, indice: "l'annuité au prorata des jours jusqu'à la cession" },
              { role: "l'amortissement de la cuisine", compte: a.compteDAmortissement, acceptes: ["2815", "281"], sens: "credit", montant: a.dotation, indice: "l'annuité au prorata des jours jusqu'à la cession" },
            ],
          },
          indices: ["Avant de sortir un équipement, on l'amortit jusqu'au jour de sa cession.", "La même écriture qu'au 31 décembre, pour six mois."],
        },
        {
          id: "cession",
          ecriture: {
            date: CESSION,
            libelle: "Cession de l'ancienne cuisine",
            lignes: [
              { role: "les amortissements cumulés, qui sortent", compte: a.compteDAmortissement, acceptes: ["2815", "281"], sens: "debit", montant: a.cumul, indice: "tout ce qui a été amorti, jusqu'au jour de la cession" },
              { role: "la valeur nette comptable, en charge", compte: "675", sens: "debit", montant: a.valeurNette, indice: "la valeur brute moins les amortissements cumulés" },
              { role: "la cuisine, qui sort à sa valeur brute", compte: a.compte, acceptes: a.acceptes, sens: "credit", montant: a.base, indice: "la valeur d'entrée de la cuisine" },
              { role: "la créance sur le repreneur", compte: "462", sens: "debit", montant: a.prixTtc, indice: "le prix, taxes comprises" },
              { role: "la TVA collectée sur la cession", compte: "44571", sens: "credit", montant: a.tvaDuPrix, indice: "la TVA du prix de cession" },
              { role: "le prix de cession, en produit", compte: "775", sens: "credit", montant: a.prix, indice: "le prix hors taxes" },
            ],
          },
          indices: ["La cuisine sort à sa valeur brute, ses amortissements avec elle ; la valeur nette passe en charge.", "Le prix se constate à part : en produit hors taxes, la créance sur le repreneur taxes comprises, la TVA collectée."],
        },
        {
          id: "achat",
          ecriture: {
            date: MISE_EN_SERVICE,
            libelle: "Achat de la nouvelle cuisine",
            lignes: [
              { role: "la cuisine, à son coût d'acquisition", compte: a.compte, acceptes: a.acceptes, sens: "debit", montant: n.cout, indice: "le prix net de remise, la livraison et l'installation" },
              { role: "l'entretien de la première année", compte: "615", sens: "debit", montant: d.entretien, indice: "la ligne du contrat d'entretien" },
              // Le compte d'une formation achetée à un fournisseur (6228, divers ; 6333 vise la contribution légale, pas une facture).
              { role: "la formation de l'équipe", compte: "6228", acceptes: ["622"], sens: "debit", montant: d.formation, indice: "la ligne de la formation" },
              { role: "la TVA déductible sur la cuisine", compte: "44562", sens: "debit", montant: n.tvaDuCout, indice: "la TVA du coût d'acquisition" },
              { role: "la TVA déductible sur les charges", compte: "44566", sens: "debit", montant: n.tvaDesCharges, indice: "la TVA de la formation et de l'entretien" },
              { role: "la dette envers le fournisseur", compte: "404", acceptes: ["401"], sens: "credit", montant: n.ttc, indice: "le total de la facture, taxes comprises" },
            ],
          },
          indices: [
            "Une seule facture, deux natures : le coût d'acquisition à l'actif, la formation et l'entretien en charges.",
            "La TVA se sépare comme le reste : sur immobilisations pour la cuisine, sur autres biens et services pour les charges. La dette va au fournisseur d'immobilisations.",
          ],
        },
      ],
      explication: [
        `L'ancienne cuisine a quitté l'actif : ${eur(a.prix)} au 775 face à ${eur(a.valeurNette)} au 675. La nouvelle y entre pour ${eur(n.cout)} ; ${eur(n.charges)} de charges vont au résultat de l'année.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au dirigeant",
      consigne: "Répondez aux trois questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "la-vente",
          question: "Que nous fait la vente de l'ancienne cuisine ?",
          options: [
            { texte: `Une perte de ${eur(-a.resultat)}`, juste: true, retour: `Oui : la cuisine valait ${eur(a.valeurNette)} dans les comptes le jour de la cession, le repreneur en donne ${eur(a.prix)}. C'est une moins-value, pas une perte d'argent : les dotations avaient pris moins que l'usure réelle.` },
            { texte: `Un gain de ${eur(a.prix)}, le prix que verse le repreneur`, juste: false, retour: "Non : le prix entre en produit, mais la valeur nette sort en charge. Le résultat de cession est leur différence." },
            { texte: `Une perte de ${eur(a.base - a.prix)}, le prix d'achat moins le prix de vente`, juste: false, retour: `Non : les dotations ont déjà porté ${eur(a.cumul)} de ce coût au résultat. Seule la valeur nette se compare au prix.` },
            { texte: `Une perte de ${eur(a.base - a.avantLaCession - a.prix)}, sans la dotation de cette année`, juste: false, retour: `Presque : il manque la dotation des six premiers mois, ${eur(a.dotation)}. On amortit jusqu'au jour de la cession.` },
          ],
        },
        {
          id: "la-valeur",
          question: "Que vaut la nouvelle cuisine dans nos comptes, à son entrée ?",
          options: [
            { texte: eur(n.cout), juste: true, retour: `Oui : le prix net de remise, ${eur(n.prixNet)}, plus la livraison et l'installation. C'est sur ce coût qu'elle s'amortit.` },
            { texte: `${eur(d.prix)}, son prix catalogue`, juste: false, retour: "Non : la remise baisse le coût, la livraison et l'installation le montent." },
            { texte: `${eur(n.totalHt)}, le total hors taxes de la facture`, juste: false, retour: "Non : la formation et l'entretien sont des charges de l'année, pas une part de la cuisine." },
            { texte: `${eur(n.ttc)}, le total de la facture`, juste: false, retour: "Non : la TVA se déduit, et la facture mêle des charges au coût de la cuisine." },
          ],
        },
        {
          id: "l-amortissement",
          question: "Que coûtera la nouvelle cuisine en amortissement cette année ?",
          options: [
            { texte: eur(n.dotation), juste: true, retour: `Oui : ${eur(n.annuite)} par année pleine, pour ${qte(n.jours)} jours de service sur ${qte(JOURS_DE_L_ANNEE)}, du ${MISE_EN_SERVICE} au ${FIN_DE_L_ANNEE}.` },
            { texte: `${eur(n.annuite)}, une annuité pleine`, juste: false, retour: "Non : la cuisine ne sert que depuis le 1er juillet. La première année, l'annuité se prend au prorata." },
            { texte: `${eur(auCentime((d.prix / a.duree) * (n.jours / JOURS_DE_L_ANNEE)))}, sur le prix catalogue`, juste: false, retour: "Non : la base de l'amortissement est le coût d'acquisition, pas le prix catalogue." },
            { texte: `${eur(n.dotation + a.dotation)}, avec l'ancienne`, juste: false, retour: `C'est la charge d'amortissement de l'année pour les deux cuisines. La nouvelle seule coûte ${eur(n.dotation)}.` },
          ],
        },
      ],
      explication: [
        `Votre réponse : la vente laisse une moins-value de ${eur(-a.resultat)} ; la nouvelle cuisine entre à l'actif pour ${eur(n.cout)} ; elle coûtera ${eur(n.dotation)} d'amortissement cette année.`,
      ],
    },
  ],
};
