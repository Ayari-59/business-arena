import { montantEcrit, type EcritureAttendue, type LigneAttendue } from "../../../pedagogy/cours/correcteur";
import { intituleDe } from "../../../pedagogy/cours/plan-comptable";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { LigneDeCompte, PieceDuBureau } from "../bureaux/types";
import { dateDe } from "../chapitres/la-cloture";
import { JOURS_DE_L_ANNEE, JOURS_DU_MOIS, auCentime, planDAmortissement, type DateDuCours } from "../monde/amortissement";
import { chargeConstateeDAvance, cloture, type CodeDeTravail, type LigneDEcriture } from "../monde/cloture";
import { DOSSIER_DU_STAGIAIRE, dossierDuStagiaire, resultatDuStagiaire, type NatureDeLErreur } from "../monde/cloture-du-stagiaire";
import { interetsCourus } from "../monde/emprunt";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import { valoriserLeStock } from "../monde/stock";
import type { Enquete } from "./types";

/**
 * L'ENQUÊTE : LA CLÔTURE DU STAGIAIRE (comptabilité générale ; la suite du chapitre « La clôture », avec
 * les travaux de prudence et les régularisations du palier suivant).
 *
 * Début janvier N+1, le stagiaire de NOVA a préparé les écritures d'inventaire du premier exercice ; le
 * président ne signera pas les comptes sans qu'on les ait relues. L'élève reçoit le dossier (le courriel
 * du président, la balance avant inventaire, les notes de l'inventaire, les neuf écritures du stagiaire),
 * trie les écritures, rectifie les fausses, puis chiffre le résultat avant impôt corrigé.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : les bons dans la clôture de NOVA
 * (monde/cloture.ts), ceux du stagiaire dans monde/cloture-du-stagiaire.ts, qui lit le même modèle de
 * travers. Ce fichier écrit le dossier, les consignes et les corrigés, qui ne partent jamais au
 * navigateur (pedagogy/cours/bureau-servi.ts, app/cours/enquete/actions.ts).
 */

const f = EXERCICE_DE_NOVA;
const k = cloture(f);
const dossier = dossierDuStagiaire(f);
const r = resultatDuStagiaire(f);

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const nombre = (n: number) => n.toLocaleString("fr-FR");

/** Le jour où l'élève ouvre le dossier (hypothèse de l'enquête) : avant l'arrivée de la facture de Composants Express. */
const JOUR_DE_L_ENQUETE: DateDuCours = { jour: 5, mois: 1, exercice: 1 };
const AU_31_DECEMBRE = `${dateDe(f.cloture)} N`;

const ecriture = (code: CodeDeTravail) => dossier.find((d) => d.code === code)!;
const ecart = (code: CodeDeTravail) => r.ecarts.find((x) => x.code === code)!.ecart;

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE DISENT LES PIÈCES : LES FAITS DE LA FICHE
// ─────────────────────────────────────────────────────────────────────────────

const ligne = f.equipement;
const premiereAnnee = planDAmortissement(f.immobilisation, ligne.mode)[0]!;
const composants = f.composantsDeDecembre;
const stock = valoriserLeStock(composants, f.methodeDeStock);
const entrees = composants.mouvements.filter((m) => m.sens === "entree");
const fnp = f.factureNonParvenue;
const livraisonDeLaFacture = entrees.find((m) => m.date.jour === fnp.livraison.jour && m.date.mois === fnp.livraison.mois)!;
const sonora = f.creances.find((c) => c.litigieuse)!;
const prime = f.assurance;
const cca = chargeConstateeDAvance(prime.prime, prime.date, prime.moisCouverts, f.cloture);
const moisDeN = cca.joursDansLExercice / JOURS_DU_MOIS;
const urgente = f.commandeUrgenteDeDecembre;
const differee = f.livraisonDiffereeDeDecembre;
const interets = interetsCourus(f.pret, f.cloture);

// ─────────────────────────────────────────────────────────────────────────────
// LE DOSSIER
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: dateDe(JOUR_DE_L_ENQUETE),
  objet: "La clôture préparée par le stagiaire",
  paragraphes: [
    "Bonjour,",
    `Notre stagiaire a préparé les écritures d'inventaire du premier exercice. Il annonce un résultat avant impôt de ${eur(r.annonce)}. Je ne signerai pas les comptes avant qu'on les ait relues.`,
    "Pouvez-vous contrôler son dossier ? Pour chaque écriture, dites-moi si elle est juste. Pour chaque écriture fausse, je veux savoir pourquoi, et l'écriture juste. Puis donnez-moi le vrai résultat avant impôt.",
    `Les intérêts courus du compte à terme, ${eur(r.aPart.montant)}, ont été passés à part sur l'avis de la banque : ils sont justes, et déjà compris dans son résultat.`,
    "Merci. Le président",
  ],
};

const totalDe = (champ: "debit" | "credit") => auCentime(k.balance.reduce((t, l) => t + l[champ], 0));

const BALANCE: PieceDuBureau = {
  code: "balance",
  nature: "balance",
  titre: "Balance avant inventaire au 31 décembre N",
  de: "La comptabilité de NOVA",
  a: "Le service comptable",
  date: AU_31_DECEMBRE,
  comptes: k.balance.map((l) => ({ compte: l.compte, intitule: l.intitule, debit: l.debit, credit: l.credit })),
  montants: [
    { libelle: "Total des soldes débiteurs", montant: totalDe("debit") },
    { libelle: "Total des soldes créditeurs", montant: totalDe("credit"), fort: true },
  ],
  mention: "Tout le journal de l'exercice, sans les travaux d'inventaire.",
};

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Notes de l'inventaire",
  de: "Le service comptable de NOVA",
  a: "Le stagiaire",
  date: AU_31_DECEMBRE,
  objet: "Ce qu'il faut savoir pour la clôture",
  paragraphes: [
    `La ligne de montage : ${eur(ligne.ht)} hors taxes, mise en service le ${dateDe(ligne.miseEnService)}, amortie en linéaire sur ${nombre(ligne.dureeAns)} ans, sans valeur résiduelle.`,
    `Les composants de décembre : aucun stock au 1er décembre ; ${entrees.map((m) => `${nombre(m.quantite)} jeux reçus le ${dateDe(m.date)} à ${eur(m.prixUnitaire!)}`).join(", puis ")}. L'inventaire du 31 décembre en compte ${nombre(stock.final.quantite)}. NOVA valorise son stock au coût moyen pondéré du mois.`,
    `${fnp.fournisseur} a livré ses ${nombre(livraisonDeLaFacture.quantite)} jeux le ${dateDe(fnp.livraison)}, à ${eur(livraisonDeLaFacture.prixUnitaire!)} hors taxes, avec ${pct(f.tauxDeTva)} de TVA. Sa facture arrivera le ${dateDe(fnp.arrivee)}.`,
    `${sonora.client} doit ${eur(sonora.ttc)} toutes taxes comprises, sa facture du ${dateDe(sonora.date)}, échue le ${dateDe(sonora.echeance)} et impayée. Le ${dateDe(f.sonora.redressement.date)}, le tribunal a ouvert un redressement judiciaire ; le mandataire laisse craindre une perte de ${pct(f.sonora.redressement.tauxDePerteProbable)} de la créance.`,
    `Le litige : un client assigne NOVA et réclame ${eur(f.litige.demande)}. L'avocat de NOVA juge probable une condamnation à ${eur(f.litige.montantProbable)}.`,
    `L'assurance : ${eur(prime.prime)}, payés le ${dateDe(prime.date)}, pour ${nombre(prime.moisCouverts)} mois à partir de ce jour.`,
    `${f.campustech.nom} a reçu le ${dateDe(urgente.livraison)} les ${nombre(urgente.enceintes)} enceintes d'une commande urgente, à ${eur(f.prixDeLEnceinte)} hors taxes l'une. La facture partira le ${dateDe(urgente.facture)}.`,
    `La facture de ${f.campustech.nom} du ${dateDe({ jour: f.campustech.jourDeFacturation, mois: 12 })} porte ${nombre(f.campustech.enceintesParFacture)} enceintes ; ${nombre(differee.enceintes)} d'entre elles ne seront livrées que le ${dateDe(differee.livraison)}.`,
    `L'emprunt : la prochaine échéance, le ${dateDe(interets.echeanceSuivante!.date)}, portera ${eur(interets.echeanceSuivante!.interets)} d'intérêts, nés depuis l'échéance du ${dateDe(interets.depuis!)}.`,
  ],
  mention: "Mois de 30 jours, jour de départ et jour d'arrivée compris.",
};

/** Le titre de chaque écriture du stagiaire, tel qu'il l'a noté : rien n'y dit si elle est juste. */
const TITRES: Readonly<Record<CodeDeTravail, string>> = {
  dotation: "La dotation de la ligne de montage",
  stock: "Le stock final de composants",
  factureNonParvenue: `La livraison de ${fnp.fournisseur}`,
  creanceDouteuse: `La créance de ${sonora.client}`,
  provision: "Le litige",
  chargeConstateeDAvance: "La prime d'assurance",
  factureAEtablir: `La commande urgente de ${f.campustech.nom}`,
  produitConstateDAvance: `Les enceintes livrées en janvier`,
  interetsCourus: "Les intérêts de l'emprunt",
  interetsDuPlacement: "Les intérêts du compte à terme",
};

/** Le code d'une écriture, dans la page : le travail, en minuscules et tirets. */
const codeDe = (code: CodeDeTravail) => code.replace(/[A-Z]/g, (x) => `-${x.toLowerCase()}`);
const pieceDe = (code: CodeDeTravail) => `ecriture-${codeDe(code)}`;
const numeroDe = (code: CodeDeTravail) => DOSSIER_DU_STAGIAIRE.indexOf(code) + 1;
const titreDe = (code: CodeDeTravail) => `Écriture ${numeroDe(code)} : ${TITRES[code].charAt(0).toLowerCase()}${TITRES[code].slice(1)}`;

const enComptes = (lignes: readonly LigneDEcriture[]): LigneDeCompte[] => lignes.map((l) => ({ compte: l.compte, intitule: intituleDe(l.compte), debit: l.debit, credit: l.credit }));

const ECRITURES_DU_STAGIAIRE: PieceDuBureau[] = dossier.map((d) => ({
  code: pieceDe(d.code),
  nature: "ecriture",
  titre: titreDe(d.code),
  de: "Le stagiaire",
  a: "Le service comptable",
  date: AU_31_DECEMBRE,
  comptes: enComptes(d.stagiaire.lignes),
}));

/** Le dossier, tel qu'il est posé sur le bureau : le courriel dessus, la balance, les notes, puis les écritures. */
const PILE: readonly PieceDuBureau[] = [COURRIEL, BALANCE, NOTES, ...ECRITURES_DU_STAGIAIRE];

// ─────────────────────────────────────────────────────────────────────────────
// LE TRI
// ─────────────────────────────────────────────────────────────────────────────

/** Pourquoi une écriture juste l'est : ce que l'élève lit, le tri réussi. */
const POURQUOI_DES_JUSTES: Partial<Record<CodeDeTravail, string>> = {
  stock: `Juste : ${nombre(stock.final.quantite)} jeux au coût moyen du mois, ${eur(stock.coutMoyenDePeriode)}, font ${eur(stock.final.valeur)} ; le stock se débite, la variation se crédite.`,
  factureAEtablir: `Juste : ${nombre(urgente.enceintes)} enceintes livrées en N font ${eur(ecriture("factureAEtablir").juste.montant)} de ventes de N, avec leur TVA, à facturer.`,
  interetsCourus: `Juste : les intérêts de la prochaine échéance courent depuis le ${dateDe(interets.depuis!)} ; ${nombre(interets.jours)} jours sur ${nombre(interets.joursDeLaPeriode)} appartiennent à N, ${eur(interets.echeanceSuivante!.interets)} × ${nombre(interets.jours)} ÷ ${nombre(interets.joursDeLaPeriode)} = ${eur(interets.montant)}.`,
};

const POURQUOI_DES_FAUSSES = "Fausse : vous direz pourquoi, et vous la rectifierez, à l'étape suivante.";

// ─────────────────────────────────────────────────────────────────────────────
// LA RECTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les raisons à choisir, communes aux six erreurs : les six natures, et deux leurres. La plus longue
 * est un leurre (garde : la bonne réponse d'un choix n'est jamais la plus longue).
 */
const RAISONS: readonly { code: NatureDeLErreur | "tva-oubliee" | "methode"; libelle: string }[] = [
  { code: "prorata", libelle: "Le prorata temporis est oublié" },
  { code: "compte", libelle: "Le compte de la dette ne convient pas" },
  { code: "base", libelle: "La base retenue comprend la TVA" },
  { code: "estimation", libelle: "Le montant n'est pas le montant probable" },
  { code: "periode", libelle: "La part retenue est celle de l'exercice" },
  { code: "sens", libelle: "Le débit et le crédit sont inversés" },
  { code: "tva-oubliee", libelle: "La TVA est oubliée" },
  { code: "methode", libelle: "La méthode de valorisation n'est pas celle que l'entreprise applique chaque année" },
];

/** Le rôle et l'indice de chaque compte d'une écriture juste, pour le correcteur. */
type Roles = Readonly<Record<string, { role: string; indice: string }>>;

function attendue(code: CodeDeTravail, libelle: string, roles: Roles): EcritureAttendue {
  const lignes: LigneAttendue[] = ecriture(code).juste.lignes.map((l) => {
    const x = roles[l.compte]!;
    return { role: x.role, compte: l.compte, sens: l.debit > 0 ? "debit" : "credit", montant: l.debit > 0 ? l.debit : l.credit, indice: x.indice };
  });
  return { date: AU_31_DECEMBRE, libelle, lignes };
}

/** Le montant juste d'un travail, et celui du stagiaire. */
const juste = (code: CodeDeTravail) => ecriture(code).juste.montant;
const fausse = (code: CodeDeTravail) => ecriture(code).stagiaire.montant;

const RECTIFICATIONS = [
  {
    id: codeDe("dotation"),
    raison: "prorata",
    ecriture: attendue("dotation", "Dotation aux amortissements de la ligne", {
      "6811": { role: "la dotation de l'exercice", indice: "l'annuité au prorata des jours de service" },
      [ligne.compteDAmortissement]: { role: "l'amortissement de la ligne", indice: "l'annuité au prorata des jours de service" },
    }),
    pourquoi: `La ligne sert depuis le ${dateDe(ligne.miseEnService)} : ${nombre(premiereAnnee.prorata)} jours sur ${nombre(JOURS_DE_L_ANNEE)}. La dotation vaut ${eur(ligne.ht)} ÷ ${nombre(ligne.dureeAns)} × ${nombre(premiereAnnee.prorata)} ÷ ${nombre(JOURS_DE_L_ANNEE)} = ${eur(juste("dotation"))}, et non ${eur(fausse("dotation"))} : ${eur(ecart("dotation"))} de charge en trop.`,
    indices: ["Relisez la date de mise en service de la ligne, dans les notes.", "La première année, l'annuité se compte au prorata des jours de service."],
  },
  {
    id: codeDe("factureNonParvenue"),
    raison: "compte",
    ecriture: attendue("factureNonParvenue", `Livraison de ${fnp.fournisseur}, facture non parvenue`, {
      "601": { role: "l'achat de composants", indice: "le hors taxes de la livraison" },
      "44586": { role: "la TVA sur facture non parvenue", indice: "la TVA de la livraison" },
      "408": { role: "la dette envers le fournisseur", indice: "le toutes taxes comprises de la livraison" },
    }),
    pourquoi: `La facture n'est pas arrivée : la dette va au 408, fournisseurs, factures non parvenues, et non au 401. Les montants étaient justes, le résultat aussi : une erreur peut fausser les comptes sans se voir au résultat.`,
    indices: ["Relisez la date d'arrivée de la facture.", "Une dette dont la facture n'est pas arrivée a son propre compte de fournisseur."],
  },
  {
    id: codeDe("creanceDouteuse"),
    raison: "base",
    ecriture: attendue("creanceDouteuse", `Créance de ${sonora.client}, reclassée en douteuse et dépréciée`, {
      "416": { role: "la créance douteuse", indice: "le toutes taxes comprises de la créance" },
      "411": { role: "la créance sortie du compte client", indice: "le toutes taxes comprises de la créance" },
      "6817": { role: "la dotation à la dépréciation", indice: "la perte probable sur le hors taxes" },
      "491": { role: "la dépréciation de la créance", indice: "la perte probable sur le hors taxes" },
    }),
    pourquoi: `La perte probable porte sur le hors taxes : ${eur(sonora.ht)} × ${pct(f.sonora.redressement.tauxDePerteProbable)} = ${eur(juste("creanceDouteuse"))}. La TVA de la part perdue se récupère auprès de l'État : elle ne se déprécie pas. Le stagiaire a déprécié ${eur(sonora.ttc)} × ${pct(f.sonora.redressement.tauxDePerteProbable)} = ${eur(fausse("creanceDouteuse"))}.`,
    indices: [`Si ${sonora.client} ne payait pas, NOVA perdrait-elle aussi la TVA de sa facture ?`, "La TVA d'une créance perdue se récupère : la dépréciation porte sur le hors taxes."],
  },
  {
    id: codeDe("provision"),
    raison: "estimation",
    ecriture: attendue("provision", "Provision pour le litige", {
      "6815": { role: "la dotation à la provision", indice: "la condamnation que l'avocat juge probable" },
      "1511": { role: "la provision pour litige", indice: "la condamnation que l'avocat juge probable" },
    }),
    pourquoi: `Une provision retient la sortie probable, ${eur(juste("provision"))}, celle que l'avocat estime, et non ce que le client demande, ${eur(fausse("provision"))}. La prudence ne consiste pas à retenir le pire : ${eur(ecart("provision"))} de charge en trop.`,
    indices: ["Les notes donnent ce que le client demande et ce que l'avocat attend du jugement : quel montant retenir ?", "Une provision se fait au montant de la sortie la plus probable."],
  },
  {
    id: codeDe("chargeConstateeDAvance"),
    raison: "periode",
    ecriture: attendue("chargeConstateeDAvance", "Prime d'assurance, part de N+1", {
      "486": { role: "la charge constatée d'avance", indice: "la part de la prime qui couvre N+1" },
      "616": { role: "la prime d'assurance, diminuée", indice: "la part de la prime qui couvre N+1" },
    }),
    pourquoi: `Du ${dateDe(prime.date)} au ${dateDe(f.cloture)}, ${nombre(moisDeN)} mois couvrent N ; les ${nombre(cca.moisApres)} autres couvrent N+1. La charge constatée d'avance vaut ${eur(prime.prime)} × ${nombre(cca.moisApres)} ÷ ${nombre(prime.moisCouverts)} = ${eur(juste("chargeConstateeDAvance"))}, et non la part de N, ${eur(fausse("chargeConstateeDAvance"))}.`,
    indices: ["Combien de mois de la prime tombent après le 31 décembre ?", "Une charge constatée d'avance retire de N ce qui appartient à N+1."],
  },
  {
    id: codeDe("produitConstateDAvance"),
    raison: "sens",
    ecriture: attendue("produitConstateDAvance", "Enceintes facturées en N, livrées en janvier", {
      "701": { role: "les ventes, diminuées", indice: "le hors taxes des enceintes livrées en janvier" },
      "487": { role: "le produit constaté d'avance", indice: "le hors taxes des enceintes livrées en janvier" },
    }),
    pourquoi: `Un produit constaté d'avance retire des ventes de N ce qui sera livré en N+1 : le 701 se débite, le 487 se crédite, de ${eur(juste("produitConstateDAvance"))}. À l'envers, l'écriture ajoutait ce montant au résultat au lieu de le retrancher : ${eur(-ecart("produitConstateDAvance"))} de trop.`,
    indices: ["Un produit constaté d'avance augmente ou diminue les ventes de N ?", "Des ventes qui diminuent se passent au débit du 701."],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LE RÉSULTAT CORRIGÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Un terme d'une somme : « + 138,89 € » ou « − 14 160 € ». */
const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Le résultat avant impôt corrigé : un tableau à compléter, corrigé au serveur. */
export function grilleDuResultat(): TableauACompleter {
  const sommeDesEcarts = r.ecarts.map((x, i) => (i === 0 ? eur(x.ecart) : terme(x.ecart))).join(" ");
  return {
    titre: "Le résultat avant impôt corrigé",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat avant impôt annoncé par le stagiaire", cellules: [{ valeur: r.annonce }] },
      {
        libelle: "Effet des rectifications sur le résultat",
        cellules: [{ valeur: r.correction, saisir: true, calcul: `${sommeDesEcarts} = ${eur(r.correction)}`, indice: "ce que chaque rectification change au résultat, en plus ou en moins" }],
      },
      {
        libelle: "Résultat avant impôt corrigé",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [{ valeur: r.corrige, saisir: true, calcul: `${eur(r.annonce)} ${terme(r.correction)} = ${eur(r.corrige)}`, indice: "le résultat annoncé, plus l'effet des rectifications" }],
      },
    ],
  };
}

const nombreDErreurs = RECTIFICATIONS.length;
const nombreDEcritures = DOSSIER_DU_STAGIAIRE.length;

// ─────────────────────────────────────────────────────────────────────────────
// L'ENQUÊTE
// ─────────────────────────────────────────────────────────────────────────────

export const LA_CLOTURE_DU_STAGIAIRE: Enquete = {
  format: "enquete",
  code: "la-cloture-du-stagiaire",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["la-cloture"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Enquête : la clôture du stagiaire",
  accroche: "Le stagiaire a préparé la clôture de NOVA, et le président hésite à signer. Contrôlez chaque écriture d'inventaire, trouvez les erreurs, dites pourquoi, rectifiez, puis donnez le vrai résultat.",
  objectifs: [
    "Contrôler des écritures d'inventaire face aux notes et à la balance",
    "Nommer la nature d'une erreur : le prorata, le compte, la base, le montant, la période, le sens",
    "Passer l'écriture juste de chaque travail d'inventaire faux",
    "Mesurer l'effet des erreurs sur le résultat avant impôt",
  ],
  libre: false,
  accueil: [
    `Le ${dateDe(JOUR_DE_L_ENQUETE)}, au siège de NOVA. Le premier exercice est clos au ${dateDe(f.cloture)} N ; le stagiaire a passé les écritures d'inventaire, et le président attend votre avis avant de signer.`,
    "Sur votre poste, le dossier : le courriel du président, la balance avant inventaire, les notes de l'inventaire et les écritures du stagiaire. Certaines sont justes, d'autres non. Rien ne vous dit lesquelles : c'est votre enquête.",
  ],
  pile: PILE,
  etapes: [
    {
      id: "le-tri",
      type: "classement",
      titre: "Trier les écritures",
      consigne: "Ouvrez chaque écriture du stagiaire, comparez-la aux notes de l'inventaire et à la balance, puis dites si elle est juste ou fausse.",
      pieces: ["courriel", "notes"],
      categories: [
        { code: "juste", libelle: "Juste" },
        { code: "fausse", libelle: "Fausse" },
      ],
      elements: dossier.map((d) => ({
        code: codeDe(d.code),
        piece: pieceDe(d.code),
        libelle: titreDe(d.code),
        categorie: d.erreur ? "fausse" : "juste",
        pourquoi: d.erreur ? POURQUOI_DES_FAUSSES : POURQUOI_DES_JUSTES[d.code]!,
      })),
      explication: [
        `${nombre(nombreDErreurs)} écritures sur ${nombre(nombreDEcritures)} sont fausses. Une écriture d'inventaire se contrôle sur son montant, ses comptes et son sens. Il reste à dire, pour chaque erreur, ce qui ne va pas.`,
      ],
    },
    {
      id: "les-rectifications",
      type: "rectification",
      titre: "Rectifier les écritures fausses",
      consigne: "Pour chaque écriture fausse, choisissez la raison de l'erreur, puis passez l'écriture juste à sa place. Le formulaire part de l'écriture du stagiaire.",
      pieces: ["notes"],
      depuis: { etape: "le-tri", dans: "fausse" },
      raisons: RAISONS,
      ecritures: RECTIFICATIONS,
      explication: [
        `Les ${nombre(nombreDErreurs)} erreurs sont de natures différentes : un prorata oublié, un compte qui ne convient pas, une base qui comprend la TVA, un montant qui n'est pas le probable, une période confondue, un sens inversé. Une seule ne change pas le résultat : celle du compte.`,
      ],
    },
    {
      id: "le-resultat",
      type: "etat",
      titre: "Donner le vrai résultat",
      consigne: "Complétez le tableau : l'effet de vos rectifications sur le résultat avant impôt, en négatif s'il le baisse, puis le résultat avant impôt corrigé.",
      pieces: ["courriel"],
      grille: grilleDuResultat(),
      explication: [
        `Les erreurs se compensaient presque : le résultat annoncé n'était faux que de ${eur(Math.abs(r.correction))}, alors que ${nombre(nombreDErreurs)} écritures l'étaient. Un résultat vraisemblable ne prouve pas des comptes justes.`,
        `Le résultat avant impôt corrigé est de ${eur(r.corrige)} ; l'impôt sur les sociétés se calcule sur lui, ${eur(r.impotCorrige)}, et non sur celui du stagiaire, ${eur(r.impotAnnonce)}.`,
      ],
    },
  ],
};
