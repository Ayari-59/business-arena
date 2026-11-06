import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { auCentime } from "../monde/amortissement";
import { AUDIO_COMPTOIR, CHARGES_DE_LA_FILIALE, NOVA_DIFFUSION, PART_DE_NOVA, PRET_A_LA_FILIALE, VENTES_A_LA_FILIALE, groupeNova } from "../monde/groupe-nova";
import { IMPOT_SUR_LES_SOCIETES } from "../monde/exercice-de-nova";
import { TAUX_DE_TVA } from "../monde/nova-gestion";
import type { Bureau, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LA PREMIÈRE CONSOLIDATION (comptabilité générale, palier 4 ; BTS CG P2 2.7.2).
 *
 * La suite du chapitre « Initiation à la consolidation », au bureau : février N + 2, le premier exercice
 * de NOVA DIFFUSION est clos, et la banque de NOVA demande les comptes du groupe. L'élève trie les
 * opérations du dossier (réciproques, à éliminer ; avec un tiers, à garder ; les capitaux propres de la
 * filiale, à partager), chiffre les éliminations, dresse le chiffre d'affaires du groupe, partage les
 * capitaux propres de la filiale après en avoir calculé le résultat, puis répond au président. Le piège :
 * AUDIO COMPTOIR, cliente de la filiale, n'entre dans le groupe qu'en N + 2 ; en N + 1, c'est un tiers.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS (monde/groupe-nova.ts, `groupeNova`), sauf la
 * part des ventes de la filiale faite à AUDIO COMPTOIR, la seule hypothèse du bureau, nommée ci-dessous.
 * Ce fichier écrit la pile, les consignes et les corrigés, qui ne partent jamais au navigateur.
 *
 * POURQUOI UN BUREAU : la consolidation du BTS est un travail de dossier, des pièces à trier et des
 * montants à éliminer dans un tableau. Le chapitre ne passe pas d'écritures d'élimination : une enquête,
 * qui rectifie des écritures, irait au delà.
 */

/**
 * LES VENTES DE NOVA DIFFUSION À AUDIO COMPTOIR EN N + 1 (hypothèse du bureau) : la boutique dont la filiale
 * envisage de prendre 60 % en N + 2 est déjà sa cliente ; elle lui a acheté 150 One au prix de revente de
 * la filiale. Ces ventes font partie du chiffre d'affaires de la filiale (monde/groupe-nova.ts) : elles
 * n'en changent aucun chiffre.
 */
export const VENTES_A_AUDIO_COMPTOIR = { enceintes: 150 } as const;

const g = groupeNova();
const F = NOVA_DIFFUSION.nom;
const A = AUDIO_COMPTOIR.nom;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;

const JOUR = "10 février N + 2";
const ventesAAudio = auCentime(VENTES_A_AUDIO_COMPTOIR.enceintes * VENTES_A_LA_FILIALE.prixDeRevente);
const actionsDeNova = Math.round(NOVA_DIFFUSION.actions * PART_DE_NOVA);
const prixDeLaOne = auCentime(g.ventesReciproques / VENTES_A_LA_FILIALE.enceintes);

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Les comptes du groupe",
  paragraphes: [
    "Bonjour,",
    `Le premier exercice de ${F} est clos. La banque veut les comptes du groupe au 31 décembre N + 1, et non plus ceux de NOVA seule.`,
    `Préparez la consolidation. Je veux savoir le chiffre d'affaires du groupe, ce que nous faisons des ventes à ${A}, et ce qui revient au directeur de la filiale.`,
    "Merci. Le président",
  ],
};

const REGISTRE: PieceDuBureau = {
  code: "registre",
  nature: "note",
  titre: `Le registre des actions de ${F}`,
  de: F,
  a: "Le service comptable",
  date: `${NOVA_DIFFUSION.creation}`,
  paragraphes: [
    `${NOVA_DIFFUSION.forme} au capital de ${eur(g.capital)} : ${qte(NOVA_DIFFUSION.actions)} actions de ${eur(NOVA_DIFFUSION.nominal)}, une voix chacune.`,
    `NOVA : ${qte(actionsDeNova)} actions, souscrites et payées à leur valeur nominale. Le directeur de la filiale : ${qte(NOVA_DIFFUSION.actions - actionsDeNova)} actions.`,
  ],
  mention: `À l'actif de NOVA : les titres de ${F}, ${eur(g.titres)}.`,
};

const COMPTES: PieceDuBureau = {
  code: "comptes",
  nature: "note",
  titre: `Les comptes de ${F}, N + 1`,
  de: F,
  a: "Le service comptable",
  date: "31 décembre N + 1",
  paragraphes: [`Le résultat n'est pas encore reporté : il se déduit des produits et des charges. L'impôt est celui d'une PME, ${pct(IMPOT_SUR_LES_SOCIETES.tauxReduit)} sous le plafond du taux réduit.`],
  montants: [
    { libelle: "Chiffre d'affaires, ventes aux magasins", montant: g.chiffreDAffairesDeLaFiliale },
    { libelle: "Charge : achats d'enceintes à NOVA", montant: g.ventesReciproques },
    { libelle: "Charge : charges externes", montant: CHARGES_DE_LA_FILIALE.externes },
    { libelle: "Charge : personnel", montant: CHARGES_DE_LA_FILIALE.personnel },
    { libelle: "Charge : intérêts du prêt de NOVA", montant: g.interets },
    { libelle: "Charge : impôt sur les sociétés", montant: g.impot },
    { libelle: "Bilan : créances sur les clients, TTC", montant: g.clients },
    { libelle: "Bilan : banque", montant: g.banque },
    { libelle: "Bilan : emprunt auprès de NOVA", montant: g.passif.emprunt },
    { libelle: "Bilan : dette envers NOVA, TTC", montant: g.dettesReciproques },
    { libelle: "Bilan : impôt dû à l'État", montant: g.impot },
  ],
};

const RELEVE: PieceDuBureau = {
  code: "releve",
  nature: "note",
  titre: `Le compte de ${F} chez NOVA`,
  de: "La comptabilité clients de NOVA",
  a: "Le service comptable",
  date: "31 décembre N + 1",
  paragraphes: [
    `NOVA a livré à sa filiale ${qte(VENTES_A_LA_FILIALE.enceintes)} One dans l'année, à son prix de ${eur(prixDeLaOne)} hors taxes.`,
    `La dernière livraison de décembre, ${qte(VENTES_A_LA_FILIALE.enceintesDeLaDerniereLivraison)} One, n'est pas encore réglée au 31 décembre. TVA à ${pct(TAUX_DE_TVA)}.`,
  ],
  montants: [{ libelle: `Ventes de l'année à ${F}, hors taxes`, montant: g.ventesReciproques, fort: true }],
};

const CONTRAT: PieceDuBureau = {
  code: "contrat",
  nature: "lettre",
  titre: "Le contrat de prêt à la filiale",
  de: "NOVA",
  a: F,
  date: "1er juillet N + 1",
  objet: "Prêt de trésorerie",
  paragraphes: [`NOVA prête ${eur(PRET_A_LA_FILIALE.montant)} à ${F} ce jour, à ${pct(PRET_A_LA_FILIALE.taux)} l'an. Les intérêts se paient chaque 31 décembre ; le capital, en une fois, plus tard.`],
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Avis de virement des intérêts",
  de: "La banque de NOVA",
  a: "NOVA",
  date: "31 décembre N + 1",
  objet: "Virement reçu",
  paragraphes: [`Virement de ${F}, intérêts de son prêt.`],
  montants: [{ libelle: "Montant reçu", montant: g.interets, fort: true }],
};

const FACTURE_AUDIO: PieceDuBureau = {
  code: "audio",
  nature: "facture",
  titre: `Les factures de ${F} à ${A}`,
  de: F,
  a: A,
  date: "N + 1",
  objet: "Récapitulatif de l'année",
  paragraphes: [`${A} est une boutique de hi-fi indépendante. ${F} envisage d'en prendre ${pct(AUDIO_COMPTOIR.partDeLaFiliale)} en N + 2.`],
  montants: [
    { libelle: `${qte(VENTES_A_AUDIO_COMPTOIR.enceintes)} One à ${eur(VENTES_A_LA_FILIALE.prixDeRevente)}, hors taxes`, montant: ventesAAudio },
    { libelle: "TVA", montant: auCentime(ventesAAudio * TAUX_DE_TVA) },
    { libelle: "Total toutes taxes comprises", montant: auCentime(ventesAAudio * (1 + TAUX_DE_TVA)), fort: true },
  ],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, REGISTRE, COMPTES, RELEVE, CONTRAT, AVIS, FACTURE_AUDIO];

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

const aSaisir = (valeur: number, calcul: string, indice: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, indice, ...autres });
const donnee = (valeur: number): CelluleACompleter => ({ valeur });

/** Ce que la consolidation élimine, et ce que les éliminations changent au résultat du groupe. */
export function grilleDesEliminations(): TableauACompleter {
  return {
    titre: "Les opérations réciproques à éliminer",
    colonnes: ["Montant éliminé"],
    lignes: [
      { libelle: "Ventes de NOVA et achats de la filiale", cellules: [aSaisir(g.ventesReciproques, `${qte(VENTES_A_LA_FILIALE.enceintes)} × ${eur(prixDeLaOne)} = ${eur(g.ventesReciproques)}`, "les ventes de l'année à la filiale, hors taxes")] },
      {
        libelle: "Créance de NOVA et dette de la filiale",
        cellules: [aSaisir(g.dettesReciproques, `${qte(VENTES_A_LA_FILIALE.enceintesDeLaDerniereLivraison)} × ${eur(prixDeLaOne)} × ${qte(1 + TAUX_DE_TVA)} = ${eur(g.dettesReciproques)}`, "la dernière livraison, toutes taxes comprises")],
      },
      { libelle: "Prêt de NOVA et emprunt de la filiale", cellules: [aSaisir(PRET_A_LA_FILIALE.montant, `le prêt du contrat : ${eur(PRET_A_LA_FILIALE.montant)}`, "le capital prêté")] },
      {
        libelle: "Intérêts reçus par NOVA et payés par la filiale",
        cellules: [aSaisir(g.interets, `${eur(PRET_A_LA_FILIALE.montant)} × ${pct(PRET_A_LA_FILIALE.taux)} × ${PRET_A_LA_FILIALE.mois} ÷ 12 = ${eur(g.interets)}`, `le prêt court depuis le 1er juillet : ${PRET_A_LA_FILIALE.mois} mois d'intérêts`)],
      },
      {
        libelle: "Effet des éliminations sur le résultat du groupe",
        fort: true,
        cellules: [aSaisir(0, "chaque élimination ôte autant d'un produit et d'une charge, ou d'un actif et d'un passif : 0 €", "ce qu'une élimination ôte d'un côté, elle l'ôte de l'autre", { horsTotal: true })],
      },
    ],
  };
}

/** Le chiffre d'affaires et les achats du groupe : les comptes additionnés, puis les éliminations. */
export function grilleDuGroupe(): TableauACompleter {
  return {
    titre: "Le chiffre d'affaires du groupe, N + 1",
    colonnes: ["NOVA", F, "Éliminations", "Groupe"],
    colonneDeTotal: 3,
    lignes: [
      {
        libelle: "Chiffre d'affaires",
        cellules: [
          donnee(g.chiffreDAffairesDeNova),
          aSaisir(g.chiffreDAffairesDeLaFiliale, `les comptes de la filiale : ${eur(g.chiffreDAffairesDeLaFiliale)}`, "le chiffre d'affaires de la filiale, ventes à AUDIO COMPTOIR comprises"),
          aSaisir(-g.ventesReciproques, `les ventes de NOVA à sa filiale : − ${eur(g.ventesReciproques)}`, "les ventes réciproques, en négatif"),
          aSaisir(g.chiffreDAffairesDuGroupe, `${eur(g.chiffreDAffairesDeNova)} + ${eur(g.chiffreDAffairesDeLaFiliale)} − ${eur(g.ventesReciproques)} = ${eur(g.chiffreDAffairesDuGroupe)}`, "le chiffre d'affaires de NOVA plus celui de la filiale, moins les ventes réciproques"),
        ],
      },
      {
        libelle: "Achats d'enceintes à NOVA",
        cellules: [
          donnee(0),
          aSaisir(g.ventesReciproques, `les comptes de la filiale : ${eur(g.ventesReciproques)}`, "les achats de la filiale à NOVA"),
          aSaisir(-g.ventesReciproques, `les achats réciproques : − ${eur(g.ventesReciproques)}`, "les achats réciproques, en négatif"),
          aSaisir(0, "le groupe n'achète pas à lui-même : 0 €", "ce qui reste une fois l'élimination faite"),
        ],
      },
    ],
  };
}

/** Le résultat de la filiale, tiré de ses comptes, puis ses capitaux propres partagés. */
export function grilleDuPartage(): TableauACompleter {
  const charges = [g.ventesReciproques, CHARGES_DE_LA_FILIALE.externes, CHARGES_DE_LA_FILIALE.personnel, g.interets, g.impot];
  return {
    titre: `Les capitaux propres de ${F} au 31 décembre N + 1`,
    colonnes: ["Part du groupe", "Minoritaires", "Total"],
    colonneDeTotal: 2,
    lignes: [
      {
        libelle: "Capital",
        cellules: [
          aSaisir(g.partDuGroupe.capital, `${eur(g.capital)} × ${pct(PART_DE_NOVA)} = ${eur(g.partDuGroupe.capital)}`, "le capital, à la part de NOVA"),
          aSaisir(g.minoritaires.capital, `${eur(g.capital)} × ${pct(1 - PART_DE_NOVA)} = ${eur(g.minoritaires.capital)}`, "le capital, à la part du directeur"),
          donnee(g.capital),
        ],
      },
      {
        libelle: "Résultat de N + 1",
        cellules: [
          aSaisir(g.partDuGroupe.resultat, `${eur(g.resultat)} × ${pct(PART_DE_NOVA)} = ${eur(g.partDuGroupe.resultat)}`, "le résultat, à la part de NOVA"),
          aSaisir(g.minoritaires.resultat, `${eur(g.resultat)} − ${eur(g.partDuGroupe.resultat)} = ${eur(g.minoritaires.resultat)}`, "le résultat, moins la part du groupe"),
          aSaisir(g.resultat, `${eur(g.chiffreDAffairesDeLaFiliale)} − ${charges.map(eur).join(" − ")} = ${eur(g.resultat)}`, "le chiffre d'affaires de la filiale, moins toutes ses charges, impôt compris"),
        ],
      },
      {
        libelle: "Capitaux propres",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [
          aSaisir(g.partDuGroupe.total, `${eur(g.partDuGroupe.capital)} + ${eur(g.partDuGroupe.resultat)} = ${eur(g.partDuGroupe.total)}`, "la somme de la colonne"),
          aSaisir(g.minoritaires.total, `${eur(g.minoritaires.capital)} + ${eur(g.minoritaires.resultat)} = ${eur(g.minoritaires.total)}`, "la somme de la colonne"),
          aSaisir(g.capitauxPropres, `${eur(g.capital)} + ${eur(g.resultat)} = ${eur(g.capitauxPropres)}`, "la somme de la colonne"),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

const cumul = auCentime(g.chiffreDAffairesDeNova + g.chiffreDAffairesDeLaFiliale);

export const LA_PREMIERE_CONSOLIDATION: Bureau = {
  code: "la-premiere-consolidation",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["initiation-a-la-consolidation"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Au bureau : la première consolidation",
  accroche: `Le premier exercice de ${F} est clos, et la banque veut les comptes du groupe. Triez les opérations, éliminez ce que le groupe se doit à lui-même, partagez la filiale, puis répondez au président.`,
  objectifs: [
    "Distinguer, dans un dossier, les opérations réciproques d'un groupe et les opérations avec des tiers",
    "Chiffrer les éliminations d'une mère et de sa filiale, et le chiffre d'affaires du groupe",
    "Calculer le résultat de la filiale, puis partager ses capitaux propres entre le groupe et les minoritaires",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. NOVA détient ${pct(PART_DE_NOVA)} de ${F} : un contrôle exclusif, une intégration globale. Les comptes de chaque société sont arrêtés ; ceux du groupe restent à faire.`,
    "Sur votre poste, la pile : le courriel du président dessus, puis les pièces de la filiale et de NOVA. Toutes ne s'éliminent pas. Rien ne vous dit lesquelles.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les opérations",
      consigne: "Pour chaque opération du dossier, dites ce que la consolidation en fait : l'éliminer, parce que le groupe la fait avec lui-même ; la garder, parce qu'elle est faite avec un tiers ; ou la partager entre le groupe et les minoritaires.",
      pieces: ["courriel"],
      categories: [
        { code: "eliminer", libelle: "À éliminer" },
        { code: "garder", libelle: "À garder" },
        { code: "partager", libelle: "À partager" },
      ],
      elements: [
        { code: "ventes", piece: "releve", libelle: `Les ventes de NOVA à ${F}`, categorie: "eliminer", pourquoi: "La vente de NOVA est l'achat de sa filiale : le groupe ne se vend rien à lui-même." },
        { code: "creance", piece: "releve", libelle: "La dernière livraison, non réglée au 31 décembre", categorie: "eliminer", pourquoi: "La créance de NOVA est la dette de sa filiale : le groupe ne se doit rien." },
        { code: "pret", piece: "contrat", libelle: "Le prêt de NOVA à sa filiale", categorie: "eliminer", pourquoi: "Le prêt de l'une est l'emprunt de l'autre : il disparaît des comptes du groupe." },
        { code: "interets", piece: "avis", libelle: "Les intérêts du prêt", categorie: "eliminer", pourquoi: "Le produit financier de NOVA est la charge de sa filiale : ils s'annulent." },
        { code: "audio", piece: "audio", libelle: `Les ventes de ${F} à ${A}`, categorie: "garder", pourquoi: `${A} n'entre dans le groupe qu'en N + 2, si la filiale en prend ${pct(AUDIO_COMPTOIR.partDeLaFiliale)}. En N + 1, c'est une cliente comme une autre.` },
        { code: "clients", piece: "comptes", libelle: `Les créances de ${F} sur ses clients`, categorie: "garder", pourquoi: "Les magasins sont des tiers : leurs dettes envers la filiale restent à l'actif du groupe." },
        { code: "impot", piece: "comptes", libelle: `L'impôt dû par ${F}`, categorie: "garder", pourquoi: "L'État est un tiers : la dette d'impôt reste au passif du groupe." },
        { code: "capital", piece: "registre", libelle: `Le capital de ${F}`, categorie: "partager", pourquoi: `Il appartient pour ${pct(PART_DE_NOVA)} à NOVA, qui l'élimine contre ses titres, et pour ${pct(1 - PART_DE_NOVA)} au directeur.` },
        { code: "resultat", piece: "comptes", libelle: `Le résultat de ${F}`, categorie: "partager", pourquoi: "Le groupe reprend tout le résultat de la filiale, mais une part revient au directeur." },
      ],
      explication: [
        "La consolidation élimine ce que les sociétés du groupe font entre elles, garde ce qu'elles font avec les autres, et partage ce que la filiale doit à ses actionnaires.",
      ],
    },
    {
      id: "les-eliminations",
      type: "etat",
      titre: "Chiffrer les éliminations",
      consigne: "Complétez le tableau : le montant de chaque opération réciproque, puis ce que les éliminations changent au résultat du groupe.",
      pieces: ["releve", "contrat", "avis"],
      grille: grilleDesEliminations(),
      explication: [
        `Le groupe élimine ${eur(g.ventesReciproques)} de ventes, ${eur(g.dettesReciproques)} de créance, ${eur(PRET_A_LA_FILIALE.montant)} de prêt et ${eur(g.interets)} d'intérêts. Le résultat ne bouge pas : un produit et une charge du même montant disparaissent ensemble.`,
      ],
    },
    {
      id: "le-groupe",
      type: "etat",
      titre: "Le chiffre d'affaires du groupe",
      consigne: "Complétez le tableau : les montants de la filiale, les éliminations en négatif, et ce qui reste au groupe.",
      pieces: ["comptes", "releve", "audio"],
      grille: grilleDuGroupe(),
      explication: [
        `Additionnés, les chiffres d'affaires de NOVA et de sa filiale font ${eur(cumul)} ; le groupe n'en garde que ${eur(g.chiffreDAffairesDuGroupe)}. Les ventes à ${A}, ${eur(ventesAAudio)}, y restent : elles sont faites à un tiers.`,
      ],
    },
    {
      id: "le-partage",
      type: "etat",
      titre: "Partager la filiale",
      consigne: `Complétez le tableau : le résultat de ${F}, tiré de ses comptes, puis le partage de ses capitaux propres entre le groupe (${pct(PART_DE_NOVA)}) et les minoritaires (${pct(1 - PART_DE_NOVA)}).`,
      pieces: ["comptes", "registre"],
      grille: grilleDuPartage(),
      explication: [
        `Les titres de NOVA, ${eur(g.titres)}, s'éliminent contre sa part du capital, ${eur(g.partDuGroupe.capital)} : l'écart est nul, NOVA a créé sa filiale. Le directeur détient ${eur(g.minoritaires.total)} des capitaux propres de la filiale, en intérêts minoritaires.`,
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez aux questions du courriel, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "le-chiffre-d-affaires",
          question: "Quel est le chiffre d'affaires du groupe en N + 1 ?",
          options: [
            { texte: eur(g.chiffreDAffairesDuGroupe), juste: true, retour: `Oui : ${eur(cumul)} additionnés, moins les ${eur(g.ventesReciproques)} de ventes de NOVA à sa filiale.` },
            { texte: `${eur(cumul)}, les chiffres d'affaires de NOVA et de sa filiale additionnés`, juste: false, retour: "Non : les ventes de NOVA à sa filiale ne sont qu'un passage d'une société à l'autre ; elles s'éliminent." },
            { texte: `${eur(auCentime(g.chiffreDAffairesDuGroupe - ventesAAudio))}, sans les ventes à ${A}`, juste: false, retour: `Non : ${A} n'est pas du groupe en N + 1. Ses achats sont des ventes du groupe à un tiers.` },
            { texte: `${eur(g.chiffreDAffairesDeNova)}, celui de NOVA seule`, juste: false, retour: "Non : le groupe vend aussi ce que la filiale revend aux magasins." },
          ],
        },
        {
          id: "audio-comptoir",
          question: `Que fait le groupe des ventes de ${F} à ${A} en N + 1 ?`,
          options: [
            { texte: "Il les garde", juste: true, retour: `Oui : ${A} n'entre dans le groupe qu'en N + 2. En N + 1, ses achats sont des ventes à un tiers.` },
            { texte: `Il les élimine, puisque la filiale va en prendre ${pct(AUDIO_COMPTOIR.partDeLaFiliale)}`, juste: false, retour: "Non : on n'élimine que ce que les sociétés du groupe font entre elles, à la date des comptes. Un projet ne fait pas entrer une société dans le groupe." },
            { texte: `Il en garde ${pct(AUDIO_COMPTOIR.partDeLaFiliale)}, la part que la filiale prendra`, juste: false, retour: "Non : une vente à un tiers se garde en entier ; rien ne se partage avant la prise de contrôle." },
          ],
        },
        {
          id: "le-directeur",
          question: `Que revient-il au directeur de ${F} dans les capitaux propres de la filiale ?`,
          options: [
            { texte: eur(g.minoritaires.total), juste: true, retour: `Oui : ${pct(1 - PART_DE_NOVA)} du capital, ${eur(g.minoritaires.capital)}, et du résultat, ${eur(g.minoritaires.resultat)}. Ils paraissent à part, en intérêts minoritaires.` },
            { texte: `${eur(g.minoritaires.capital)}, sa part du capital seulement`, juste: false, retour: "Non : le résultat de la filiale lui revient aussi pour sa part." },
            { texte: `${eur(auCentime(g.minoritaires.total + PRET_A_LA_FILIALE.montant * (1 - PART_DE_NOVA)))}, sa part des capitaux propres et du prêt`, juste: false, retour: "Non : le prêt est une opération réciproque, éliminée en entier. Le partage ne porte que sur les capitaux propres." },
          ],
        },
      ],
      explication: [`Votre réponse : un chiffre d'affaires du groupe de ${eur(g.chiffreDAffairesDuGroupe)}, les ventes à ${A} gardées, ${eur(g.minoritaires.total)} au directeur.`],
    },
  ],
};
