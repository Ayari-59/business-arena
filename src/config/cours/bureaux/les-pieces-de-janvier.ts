import { montantEcrit, type EcritureAttendue } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import { dateDe } from "../chapitres/la-cloture";
import type { CodeDeTravail } from "../monde/cloture";
import { janvierDeNova } from "../monde/janvier-de-nova";
import type { Bureau, EtapeDuJournal, PieceDuBureau } from "./types";

/**
 * LE BUREAU : LES PIÈCES DE JANVIER (comptabilité générale, palier 4 ; la suite du chapitre
 * « Régularisations de fin d'exercice » et de son cas, « L'assurance sur plusieurs années »).
 *
 * Le 9 janvier N+1, au siège de NOVA : l'exercice N est clos, ses cinq régularisations passées. L'élève
 * trie les pièces arrivées depuis le 1er janvier, extourne les régularisations, passe les pièces qui les
 * dénouent, puis chiffre ce que N+1 garde de ces opérations. Tous les chiffres se calculent dans le monde
 * du cours (monde/janvier-de-nova.ts) ; ce fichier écrit la pile, les consignes et les corrigés, qui ne
 * partent jamais au navigateur.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : toutes les extournes à la fois, les vraies pièces de janvier, et deux
 * pièces qui ne se saisissent pas, parce que l'extourne suffit.
 */

const j = janvierDeNova();
const x = j.x;
const f = j.f;
const eur = (v: number) => montantEcrit(v + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const PREMIER_JANVIER = dateDe({ jour: 1, mois: 1, exercice: 1 });
const AUJOURD_HUI = dateDe({ jour: 9, mois: 1, exercice: 1 });
const FACTURE_URGENTE = dateDe(f.commandeUrgenteDeDecembre.facture);
const ECHEANCE = dateDe(j.placement.echeance);
const ARRIVEE = dateDe(f.factureNonParvenue.arrivee);
const LIVRAISON = dateDe(f.livraisonDiffereeDeDecembre.livraison);

const regularisation = (code: CodeDeTravail) => j.regularisations.find((r) => r.code === code)!;

// ─────────────────────────────────────────────────────────────────────────────
// LA PILE
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La comptabilité",
  date: AUJOURD_HUI,
  objet: "Le début de N+1",
  paragraphes: [
    "Bonjour,",
    "Les comptes de N sont arrêtés, et les pièces de janvier arrivent. Je ne veux pas que N+1 porte deux fois ce que N a déjà pris, ni qu'il perde ce qui lui revient.",
    "Pouvez-vous ouvrir l'exercice, passer ce qu'il faut, et me dire ce que N+1 garde de ces opérations ?",
    "Merci. Le président",
  ],
};

const JOURNAL: PieceDuBureau = {
  code: "journal",
  nature: "note",
  titre: "Les régularisations du 31 décembre N",
  de: "La comptabilité de NOVA",
  a: "La comptabilité",
  date: dateDe(f.cloture),
  objet: "Extrait du journal des opérations diverses",
  paragraphes: j.regularisations.map((r) => {
    const debit = r.lignes.filter((l) => l.debit > 0).map((l) => l.compte).join(" et ");
    const credit = r.lignes.filter((l) => l.credit > 0).map((l) => l.compte).join(" et ");
    const montant = r.lignes.reduce((t, l) => t + l.debit, 0);
    return `${r.libelle.charAt(0).toUpperCase()}${r.libelle.slice(1)} : ${eur(montant)}, ${debit} au débit, ${credit} au crédit.`;
  }),
  mention: "Ces écritures se retournent au premier jour de l'exercice suivant.",
};

const FACTURE_CAMPUSTECH: PieceDuBureau = {
  code: "facture-campustech",
  nature: "facture",
  titre: `Facture à ${f.campustech.nom} du ${FACTURE_URGENTE}`,
  de: "NOVA",
  a: f.campustech.nom,
  date: FACTURE_URGENTE,
  objet: `La commande urgente, livrée le ${dateDe(f.commandeUrgenteDeDecembre.livraison)} N`,
  paragraphes: [`${qte(f.commandeUrgenteDeDecembre.enceintes)} enceintes à ${eur(f.prixDeLEnceinte)} hors taxes.`],
  montants: [
    { libelle: "Total hors taxes", montant: x.fae.ht },
    { libelle: `TVA à ${pct(f.tauxDeTva)}`, montant: x.fae.tva },
    { libelle: "Total à payer", montant: x.fae.ttc, fort: true },
  ],
};

const AVIS_DE_LA_BANQUE: PieceDuBureau = {
  code: "avis-banque",
  nature: "avis",
  titre: "Avis d'échéance du compte à terme",
  de: "La banque de NOVA",
  a: "NOVA",
  date: ECHEANCE,
  objet: "Votre compte à terme arrive à échéance",
  paragraphes: [`Votre placement de ${eur(j.placement.capital)}, ouvert le ${dateDe(f.placement.date)} N pour ${qte(f.placement.dureeMois)} mois à ${pct(f.placement.tauxAnnuel)} l'an, est échu. Nous créditons votre compte courant du capital et des intérêts.`],
  montants: [
    { libelle: "Capital", montant: j.placement.capital },
    { libelle: "Intérêts de la période", montant: j.placement.interets },
    { libelle: "Crédité au compte courant", montant: j.placement.verse, fort: true },
  ],
};

const FACTURE_COMPOSANTS: PieceDuBureau = {
  code: "facture-composants",
  nature: "facture",
  titre: `Facture de ${f.factureNonParvenue.fournisseur}`,
  de: f.factureNonParvenue.fournisseur,
  a: "NOVA",
  date: ARRIVEE,
  objet: `Les jeux de composants livrés le ${dateDe(f.factureNonParvenue.livraison)} N`,
  paragraphes: [`${qte(x.jeux)} jeux de composants à ${eur(x.prixDuJeu)} hors taxes.`],
  montants: [
    { libelle: "Total hors taxes", montant: x.fnp.ht },
    { libelle: `TVA à ${pct(f.tauxDeTva)}`, montant: x.fnp.tva },
    { libelle: "Total à payer", montant: x.fnp.ttc, fort: true },
  ],
};

const BON: PieceDuBureau = {
  code: "bon",
  nature: "bon",
  titre: `Bon de livraison du ${LIVRAISON}`,
  de: "NOVA",
  a: f.campustech.nom,
  date: LIVRAISON,
  paragraphes: [`${qte(x.enJanvier)} enceintes livrées, le solde de la facture du ${f.campustech.jourDeFacturation} décembre N.`],
  mention: "Signé par le client à la réception.",
};

const ASSURANCE: PieceDuBureau = {
  code: "assurance",
  nature: "lettre",
  titre: "Attestation d'assurance",
  de: "L'assureur de NOVA",
  a: "NOVA",
  date: dateDe(f.assurance.date),
  objet: "Multirisque de l'atelier",
  paragraphes: [`Garantie du ${dateDe(f.assurance.date)} N pour ${qte(f.assurance.moisCouverts)} mois. Prime annuelle de ${eur(f.assurance.prime)}, réglée à la souscription.`],
};

const PILE: readonly PieceDuBureau[] = [COURRIEL, JOURNAL, FACTURE_CAMPUSTECH, AVIS_DE_LA_BANQUE, FACTURE_COMPOSANTS, BON, ASSURANCE];

// ─────────────────────────────────────────────────────────────────────────────
// LES EXTOURNES
// ─────────────────────────────────────────────────────────────────────────────

/** Le rôle de chaque compte d'une extourne, par régularisation : ce que l'écriture retournée y fait. */
const ROLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  chargeConstateeDAvance: { "616": "l'assurance de N+1, qui revient en charge", "486": "la charge constatée d'avance, soldée" },
  factureNonParvenue: { "601": "l'achat de N, qui sort de N+1", "44586": "la TVA sur facture non parvenue, soldée", "408": "la dette provisoire envers le fournisseur, soldée" },
  factureAEtablir: { "418": "la facture à établir, soldée", "701": "la vente de N, qui sort de N+1", "44587": "la TVA sur facture à établir, soldée" },
  produitConstateDAvance: { "701": "la vente qui revient à N+1", "487": "le produit constaté d'avance, soldé" },
  interetsDuPlacement: { [j.placement.compteDesInteretsCourus]: "les intérêts courus, soldés", [j.placement.compteDeProduit]: "les intérêts de N, qui sortent de N+1" },
};

const LIBELLES_D_EXTOURNE: Readonly<Record<string, string>> = {
  chargeConstateeDAvance: "Extourne : charge constatée d'avance, assurance",
  factureNonParvenue: `Extourne : facture non parvenue, ${f.factureNonParvenue.fournisseur}`,
  factureAEtablir: `Extourne : facture à établir, ${f.campustech.nom}`,
  produitConstateDAvance: "Extourne : produit constaté d'avance, enceintes livrées en janvier",
  interetsDuPlacement: "Extourne : intérêts courus du compte à terme",
};

const ID: Readonly<Record<string, string>> = {
  chargeConstateeDAvance: "assurance",
  factureNonParvenue: "composants",
  factureAEtablir: "commande-urgente",
  produitConstateDAvance: "enceintes",
  interetsDuPlacement: "compte-a-terme",
};

function ecritureDExtourne(code: CodeDeTravail): EcritureAttendue {
  const r = regularisation(code);
  return {
    date: PREMIER_JANVIER,
    libelle: LIBELLES_D_EXTOURNE[code]!,
    lignes: r.extourne.map((l) => ({
      role: ROLES[code]![l.compte]!,
      compte: l.compte,
      sens: l.debit > 0 ? ("debit" as const) : ("credit" as const),
      montant: l.debit > 0 ? l.debit : l.credit,
      indice: "le montant de la régularisation du 31 décembre",
    })),
  };
}

const EXTOURNES: EtapeDuJournal["ecritures"] = j.regularisations.map((r) => ({
  id: ID[r.code]!,
  ecriture: ecritureDExtourne(r.code),
  indices: ["L'écriture du 31 décembre, retournée : chaque débit passe au crédit, chaque crédit au débit, pour le même montant.", "Le journal du 31 décembre, dans la pile, donne les comptes et les montants."],
}));

const PIECES: EtapeDuJournal["ecritures"] = [
  {
    id: "facture-campustech",
    ecriture: {
      date: FACTURE_URGENTE,
      libelle: `Facture de la commande urgente, ${f.campustech.nom}`,
      lignes: [
        { role: "la créance sur le client", compte: "411", sens: "debit", montant: x.fae.ttc, indice: "le total de la facture, taxes comprises" },
        { role: "la vente", compte: "701", sens: "credit", montant: x.fae.ht, indice: "le total hors taxes" },
        { role: "la TVA collectée", compte: "44571", sens: "credit", montant: x.fae.tva, indice: "la TVA de la facture" },
      ],
    },
    indices: ["Une facture de vente, passée comme toutes les autres.", "L'extourne a déjà retiré la vente de N+1 : la facture la remet, et rien ne compte deux fois."],
  },
  {
    id: "compte-a-terme",
    ecriture: {
      date: ECHEANCE,
      libelle: "Échéance du compte à terme",
      lignes: [
        { role: "la banque, créditée du capital et des intérêts", compte: "512", sens: "debit", montant: j.placement.verse, indice: "le montant crédité au compte courant" },
        { role: "le placement, qui se solde", compte: j.placement.compte, sens: "credit", montant: j.placement.capital, indice: "le capital placé" },
        { role: "les intérêts versés", compte: j.placement.compteDeProduit, sens: "credit", montant: j.placement.interets, indice: "les intérêts de l'avis" },
      ],
    },
    indices: ["Le capital revient : le placement se solde. Les intérêts entrent en produit, tous, l'extourne ayant retiré la part de N.", "La banque reçoit le total de l'avis."],
  },
  {
    id: "facture-composants",
    ecriture: {
      date: ARRIVEE,
      libelle: `Facture de ${f.factureNonParvenue.fournisseur}`,
      lignes: [
        { role: "l'achat de composants", compte: "601", sens: "debit", montant: x.fnp.ht, indice: "le total hors taxes" },
        { role: "la TVA déductible", compte: "44566", sens: "debit", montant: x.fnp.tva, indice: "la TVA de la facture" },
        { role: "la dette envers le fournisseur", compte: "401", sens: "credit", montant: x.fnp.ttc, indice: "le total de la facture" },
      ],
    },
    indices: ["La facture se passe comme toute facture d'achat, au fournisseur.", "L'extourne a soldé le 408 et retiré l'achat de N+1 : la facture le remet une seule fois."],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE N+1 GARDE
// ─────────────────────────────────────────────────────────────────────────────

const LIGNES_DU_RESTE: readonly { code: keyof typeof j.effets; libelle: string; piece: string }[] = [
  { code: "chargeConstateeDAvance", libelle: "L'assurance", piece: "aucune pièce : la prime est payée" },
  { code: "factureNonParvenue", libelle: `Les composants de ${f.factureNonParvenue.fournisseur}`, piece: "la facture du 8 janvier" },
  { code: "factureAEtablir", libelle: "La commande urgente de CampusTech", piece: "la facture du 4 janvier" },
  { code: "produitConstateDAvance", libelle: "Les enceintes livrées le 8 janvier", piece: "aucune pièce : elles sont déjà facturées" },
  { code: "interetsDuPlacement", libelle: "Le compte à terme", piece: "les intérêts de l'avis du 6 janvier" },
];

const signe = (v: number) => (v < 0 ? `− ${eur(-v)}` : `+ ${eur(v)}`);

/** Ce que N+1 garde, opération par opération : un tableau à compléter, corrigé au serveur. */
export function grilleDuReste(): TableauACompleter {
  const saisir = (valeur: number, calcul: string, indice: string) => ({ valeur, saisir: true, calcul, indice });
  const total = (k: "extourne" | "piece") => LIGNES_DU_RESTE.reduce((t, l) => t + j.effets[l.code][k], 0);
  return {
    titre: "Ce que les régularisations laissent au résultat de N+1",
    colonnes: ["Extourne du 1er janvier", "Pièce de janvier", "Reste à N+1"],
    colonneDeTotal: 2,
    lignes: [
      ...LIGNES_DU_RESTE.map((l) => {
        const e = j.effets[l.code];
        return {
          libelle: l.libelle,
          cellules: [
            saisir(e.extourne, `l'extourne retourne ${eur(Math.abs(regularisation(l.code).effet))} : ${signe(e.extourne)}`, "l'inverse de l'effet de la régularisation, en négatif s'il baisse le résultat"),
            saisir(e.piece, e.piece === 0 ? `${l.piece} : 0 €` : `${l.piece} : ${signe(e.piece)}`, "ce que la pièce de janvier met au résultat ; zéro s'il n'y en a pas"),
            saisir(j.reste(l.code), `${signe(e.extourne)} ${signe(e.piece)} = ${eur(j.reste(l.code))}`, "l'extourne plus la pièce"),
          ],
        };
      }),
      {
        libelle: "Ce que N+1 garde",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4] },
        cellules: [
          saisir(j.totalDesExtournes, `${eur(total("extourne"))}, la somme de la colonne`, "la somme des extournes"),
          saisir(j.totalDesPieces, `${eur(total("piece"))}, la somme de la colonne`, "la somme des pièces"),
          saisir(j.resteDansNPlus1, `${eur(j.totalDesExtournes)} ${signe(j.totalDesPieces)} = ${eur(j.resteDansNPlus1)}`, "les extournes plus les pièces"),
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

export const LES_PIECES_DE_JANVIER: Bureau = {
  code: "les-pieces-de-janvier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["regularisations-de-fin-d-exercice"],
  commanditaire: "Le président",
  entreprise: { code: j.f.code, nom: j.entreprise },
  titre: "Au bureau : les pièces de janvier",
  accroche: "L'exercice N est clos, les pièces de janvier arrivent. Triez-les, extournez les régularisations, passez ce qui se saisit, puis dites au président ce que N+1 garde.",
  objectifs: [
    "Reconnaître la pièce de janvier qui dénoue une régularisation, et celle qui n'appelle aucune écriture",
    "Extourner au 1er janvier les régularisations du 31 décembre",
    "Passer les pièces de janvier sans rien compter deux fois",
    "Mesurer ce que le nouvel exercice garde des régularisations",
  ],
  libre: false,
  accueil: [
    `Le ${AUJOURD_HUI}, au siège de NOVA. Les comptes de N sont arrêtés au ${dateDe(f.cloture)} N, avec leurs cinq régularisations.`,
    "Sur votre poste, le courriel du président, le journal du 31 décembre et les pièces arrivées depuis. Ouvrez-les une à une : rien ne vous dit ce qu'il faut en faire.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "la-pile",
      type: "classement",
      titre: "Classer la pile",
      consigne: "Ouvrez chaque pièce et dites ce qu'elle demande en janvier : une écriture, rien de plus que l'extourne, ou une simple lecture.",
      pieces: ["courriel"],
      categories: [
        { code: "a-saisir", libelle: "À saisir" },
        { code: "extourne", libelle: "L'extourne suffit" },
        { code: "a-lire", libelle: "À lire pour les extournes" },
      ],
      elements: [
        { code: "journal", piece: "journal", libelle: JOURNAL.titre, categorie: "a-lire", pourquoi: "Le journal du 31 décembre donne les cinq écritures à retourner : leurs comptes et leurs montants." },
        { code: "facture-campustech", piece: "facture-campustech", libelle: FACTURE_CAMPUSTECH.titre, categorie: "a-saisir", pourquoi: "La facture part : elle se passe comme toute vente. L'extourne de la facture à établir évite de compter la vente deux fois." },
        { code: "avis-banque", piece: "avis-banque", libelle: AVIS_DE_LA_BANQUE.titre, categorie: "a-saisir", pourquoi: "Le capital revient et les intérêts sont versés : la banque, le placement et le produit bougent." },
        { code: "facture-composants", piece: "facture-composants", libelle: FACTURE_COMPOSANTS.titre, categorie: "a-saisir", pourquoi: "La facture arrive : elle se passe au fournisseur, comme d'habitude. L'extourne a soldé le 408." },
        { code: "bon", piece: "bon", libelle: BON.titre, categorie: "extourne", pourquoi: `Les enceintes sont facturées depuis le ${f.campustech.jourDeFacturation} décembre : il n'y a rien à facturer. L'extourne du produit constaté d'avance remet la vente en N+1.` },
        { code: "assurance", piece: "assurance", libelle: ASSURANCE.titre, categorie: "extourne", pourquoi: "La prime a été payée en octobre : aucune pièce ne vient en janvier. L'extourne remet en charge les mois de N+1." },
      ],
      explication: ["Trois pièces se saisissent, deux n'appellent rien d'autre que l'extourne. Facturer une seconde fois les enceintes livrées le 8 janvier serait l'erreur du jour : la facture est partie en décembre."],
    },
    {
      id: "les-extournes",
      type: "journal",
      titre: "Extourner au 1er janvier",
      consigne: "Passez, au 1er janvier N+1, l'écriture inverse de chacune des cinq régularisations du 31 décembre, dans l'ordre que vous voulez.",
      pieces: ["journal"],
      ecritures: EXTOURNES,
      explication: [`Les cinq régularisations sont retournées : leurs comptes de bilan sont soldés, et N+1 s'ouvre sur un effet de ${eur(j.totalDesExtournes)}. Les pièces vont maintenant se passer comme d'habitude.`],
    },
    {
      id: "les-pieces",
      type: "journal",
      titre: "Passer les pièces de janvier",
      consigne: "Passez les trois pièces de janvier qui se saisissent, dans l'ordre que vous voulez.",
      pieces: ["facture-campustech", "avis-banque", "facture-composants"],
      ecritures: PIECES,
      explication: ["Chaque pièce s'est passée comme si la régularisation n'avait pas existé : c'est l'extourne qui l'a permis. Le 408, le 418 et le 5088 sont soldés."],
    },
    {
      id: "ce-que-garde-n-plus-1",
      type: "etat",
      titre: "Ce que N+1 garde",
      consigne: "Complétez le tableau : pour chaque opération, ce que l'extourne puis la pièce de janvier font au résultat de N+1, en négatif pour un effet qui le baisse. Une case sans pièce vaut zéro.",
      pieces: ["journal"],
      grille: grilleDuReste(),
      explication: [
        `N+1 garde ${eur(j.resteDansNPlus1)} : ${eur(-x.prime.chargeConstateeDAvance)} d'assurance pour ses ${qte(x.prime.moisApres)} mois, ${eur(x.pca)} de ventes pour les enceintes livrées le ${LIVRAISON}, ${eur(x.interetsDeNPlus1)} d'intérêts pour les jours de janvier.`,
        "Les composants et la commande urgente ne laissent rien : l'extourne et la pièce s'annulent.",
      ],
    },
    {
      id: "la-reponse",
      type: "reponse",
      titre: "Répondre au président",
      consigne: "Répondez au président, chiffres à l'appui.",
      pieces: ["courriel"],
      questions: [
        {
          id: "ce-qui-reste",
          question: "Que garde N+1 de ces opérations ?",
          options: [
            { texte: eur(j.resteDansNPlus1), juste: true, retour: "Oui : l'assurance de ses mois, la vente des enceintes livrées en janvier et les intérêts de janvier. Le reste appartenait à N." },
            { texte: `${eur(j.totalDesPieces)}, l'effet des pièces de janvier`, juste: false, retour: "Non : sans les extournes, N+1 compterait l'achat et la vente une seconde fois, et perdrait l'assurance et les enceintes." },
            { texte: `${eur(j.totalDesExtournes)}, l'effet des extournes`, juste: false, retour: "Non : les pièces de janvier se passent aussi. Les extournes seules effaceraient l'achat sans la facture." },
            { texte: "Rien : N a déjà tout pris", juste: false, retour: "Non : N n'a pris que sa part. L'assurance, les enceintes et les intérêts de janvier reviennent à N+1." },
          ],
        },
        {
          id: "le-double",
          question: `Pourquoi la facture de ${f.factureNonParvenue.fournisseur} ne compte-t-elle pas deux fois ?`,
          options: [
            { texte: "L'extourne a retiré l'achat de N+1", juste: true, retour: `Oui : l'extourne du 1er janvier a crédité le 601 de ${eur(x.fnp.ht)} et soldé le 408 ; la facture le débite du même montant. N+1 n'en porte rien.` },
            { texte: "Elle se passe au 408 et non au 401, pour solder la dette", juste: false, retour: "Non : avec l'extourne, la facture se passe au 401, comme toute facture. Le 408 est déjà soldé." },
            { texte: "Elle ne se passe pas : la régularisation de N suffit", juste: false, retour: "Non : la facture est la pièce, elle se passe toujours. C'est la régularisation qui s'efface." },
          ],
        },
        {
          id: "les-enceintes",
          question: `Faut-il facturer les ${qte(x.enJanvier)} enceintes livrées le ${LIVRAISON} ?`,
          options: [
            { texte: "Non : elles le sont depuis décembre", juste: true, retour: `Oui : la facture du ${f.campustech.jourDeFacturation} décembre les porte. L'extourne du produit constaté d'avance remet ${eur(x.pca)} de ventes en N+1, le jour où elles sont livrées.` },
            { texte: `Oui : ${eur(x.pca)} hors taxes, la vente appartient à N+1`, juste: false, retour: "Non : ce serait les facturer deux fois. La vente revient à N+1 par l'extourne, pas par une facture." },
            { texte: "Oui, mais sans TVA, déjà collectée en décembre", juste: false, retour: "Non : aucune facture n'est à faire. L'extourne suffit." },
          ],
        },
      ],
      explication: [`Votre réponse : N+1 garde ${eur(j.resteDansNPlus1)} ; la facture du fournisseur ne compte qu'une fois, grâce à l'extourne ; les enceintes ne se facturent pas une seconde fois.`],
    },
  ],
};
