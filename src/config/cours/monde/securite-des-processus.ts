import { auCentime } from "./amortissement";
import { cloture as clotureDuModele, facturesDuFournisseur, sommeDesComptes } from "./cloture";
import type { FicheDeLExercice } from "./exercice-de-nova";
import { bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : SÉCURISER LES PROCESSUS DE NOVA (le chapitre « Sécuriser les processus :
 * contrôle interne, archivage, contrôle extérieur » et son cas ; BTS CG P1 1.2.3, 1.2.4, 1.7 ;
 * P2 2.6, 2.8 ; P3 3.2.5, 3.3.8 ; P4 4.1.2, 4.4).
 *
 * LE CHAPITRE SE JOUE EN N + 1, SUR L'EXERCICE N DÉJÀ CLOS. Il ne change aucun chiffre de la fiche
 * (exercice-de-nova.ts) : il la relit pour contrôler. Les contrôles de cohérence portent sur l'exercice
 * N (la TVA de l'année face aux ventes comptabilisées, la déclaration sociale de décembre face aux
 * comptes de la paie), la tentative de fraude sur la facture de décembre d'Électro-Composants Lyon,
 * et le contrôle fiscal de N + 1 demande le fichier des écritures de N.
 *
 * L'ORGANISATION COMPTABLE DE NOVA (HYPOTHÈSE DU COURS, posée ici pour tout le cours) : NOVA n'a pas
 * de service comptable. Ses salariés sont les opérateurs de l'atelier (la paie du cours). La
 * comptabilité se partage entre quatre acteurs, sans salarié de plus :
 *   · la présidente : elle commande, donne le bon à payer et signe seule les virements (elle seule a
 *     la signature bancaire) ;
 *   · le chef d'équipe de l'atelier (l'opérateur promu en avril N + 1, masse-salariale-de-nova.ts ;
 *     avant lui, l'opérateur de permanence) : il reçoit les livraisons et signe le bon de réception ;
 *   · le collaborateur du cabinet d'expertise comptable (le rôle de l'élève) : il saisit les pièces
 *     dans le PGI en ligne que NOVA partage avec le cabinet, lettre, rapproche, prépare la TVA et la
 *     déclaration sociale nominative (la paie est confiée au cabinet) ;
 *   · l'expert-comptable du cabinet : il révise, valide les déclarations, arrête les comptes annuels.
 */

const CLOTURES = new Map<string, ReturnType<typeof clotureDuModele>>();

/** La clôture de la fiche, calculée une fois : les contrôles la relisent souvent. */
function cloture(f: FicheDeLExercice) {
  let k = CLOTURES.get(f.code);
  if (!k) {
    k = clotureDuModele(f);
    CLOTURES.set(f.code, k);
  }
  return k;
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ORGANISATION
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDActeur = "presidente" | "chef-d-equipe" | "collaborateur" | "expert-comptable";

export const ACTEURS_DE_NOVA: readonly { code: CodeDActeur; libelle: string; role: string }[] = [
  { code: "presidente", libelle: "La présidente", role: "commande, bon à payer, signature des virements" },
  { code: "chef-d-equipe", libelle: "Le chef d'équipe de l'atelier", role: "réception des livraisons, bon de réception" },
  { code: "collaborateur", libelle: "Le collaborateur du cabinet", role: "saisie, lettrage, rapprochements, TVA et DSN préparées" },
  { code: "expert-comptable", libelle: "L'expert-comptable", role: "révision, validation des déclarations, comptes annuels" },
];

/** Les quatre fonctions que le contrôle interne sépare : décider, détenir, enregistrer, contrôler. */
export type FonctionDuControle = "autoriser" | "detenir" | "enregistrer" | "controler";

/** LES TÂCHES DU PROCESSUS ACHATS DE NOVA, de la commande au paiement : qui la fait, et quelle fonction elle remplit. */
export const TACHES_DES_ACHATS: readonly { libelle: string; acteur: CodeDActeur; fonction: FonctionDuControle; pourquoi: string }[] = [
  { libelle: "Signer le bon de commande des composants", acteur: "presidente", fonction: "autoriser", pourquoi: "Elle engage NOVA envers le fournisseur : c'est une décision." },
  { libelle: "Recevoir les jeux et signer le bon de réception", acteur: "chef-d-equipe", fonction: "detenir", pourquoi: "Il a les biens sous sa garde : la fonction de détention." },
  { libelle: "Saisir la facture d'achat dans le PGI", acteur: "collaborateur", fonction: "enregistrer", pourquoi: "C'est la fonction d'enregistrement, la comptabilité." },
  { libelle: "Rapprocher commande, bon de réception et facture", acteur: "collaborateur", fonction: "controler", pourquoi: "Trois pièces d'acteurs différents comparées : un contrôle." },
  { libelle: "Donner le bon à payer et signer le virement", acteur: "presidente", fonction: "autoriser", pourquoi: "Faire sortir l'argent est une décision : celle de celui qui a la signature." },
  { libelle: "Rapprocher le relevé bancaire du compte 512", acteur: "collaborateur", fonction: "controler", pourquoi: "Le relevé vient de la banque, le compte du PGI : leur accord se contrôle." },
  { libelle: "Garder les identifiants de la banque en ligne", acteur: "presidente", fonction: "detenir", pourquoi: "Qui tient les moyens de paiement détient les fonds." },
];

/** LES DROITS DANS LE PGI PARTAGÉ (hypothèse du cours) : chaque droit a un seul titulaire. */
export const DROITS_DU_PGI: readonly { libelle: string; titulaire: CodeDActeur; pourquoi: string }[] = [
  { libelle: "Valider une modification des coordonnées bancaires d'un fournisseur", titulaire: "presidente", pourquoi: "Celle qui paie valide, après un contre-appel : le collaborateur saisit la demande, il ne la valide pas." },
  { libelle: "Saisir et lettrer les factures et les règlements", titulaire: "collaborateur", pourquoi: "L'enregistrement, sans aucun droit de paiement." },
  { libelle: "Enregistrer une réception de marchandises", titulaire: "chef-d-equipe", pourquoi: "Celui qui reçoit déclare ce qu'il a reçu ; il ne touche ni aux factures ni aux paiements." },
  { libelle: "Émettre les virements depuis le PGI", titulaire: "presidente", pourquoi: "La seule signature bancaire de NOVA." },
  { libelle: "Clôturer une période et valider les déclarations", titulaire: "expert-comptable", pourquoi: "Le contrôle final, par celui qui ne saisit pas." },
];

// ─────────────────────────────────────────────────────────────────────────────
// LA TENTATIVE DE FRAUDE (HYPOTHÈSE DU COURS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA FRAUDE AU CHANGEMENT DE COORDONNÉES BANCAIRES (hypothèse du cours) : le 28 décembre N, un
 * courriel qui imite Électro-Composants Lyon (son logo, sa signature, une adresse presque la même)
 * annonce un changement de banque et demande de virer la facture du 10 décembre, due le 1er janvier
 * N + 1, sur un nouvel IBAN. La procédure de NOVA l'arrête : aucune coordonnée ne change sans un
 * contre-appel au numéro déjà connu du fichier des fournisseurs, puis la validation de la présidente.
 * Le fournisseur, rappelé, n'a jamais changé de banque.
 */
export const COURRIEL_FRAUDULEUX = { date: { jour: 28, mois: 12 }, echeance: "1er janvier N + 1" } as const;

/** Ce que la fraude aurait coûté, face à l'exercice N : la facture de décembre, le résultat net, le compte courant. */
export function fraudeEvitee(f: FicheDeLExercice) {
  const facture = facturesDuFournisseur(f).at(-1)!;
  const k = cloture(f);
  const compteCourant = k.soldes["512"] ?? 0;
  return {
    facture: facture.ttc,
    dateDeLaFacture: facture.date,
    resultatNet: k.resultatNet,
    compteCourant,
    partDuResultat: Math.round((facture.ttc / k.resultatNet) * 10_000) / 10_000,
    partDuCompteCourant: Math.round((facture.ttc / compteCourant) * 10_000) / 10_000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONTRÔLES DE COHÉRENCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CADRAGE DE LA TVA DE N (le « cadrage » que le référentiel nomme) : les ventes comptabilisées de
 * l'exercice, après inventaire, face à la base déclarée sur les douze déclarations de l'année. La TVA
 * d'une vente se collecte à la facture (hypothèse de la fiche) ; la base est le net financier : la
 * facture de septembre de Sonora porte un escompte, qui réduit la base mais reste un compte de charges
 * (665), pas une baisse du 701. L'écart s'explique par trois éléments :
 *   · la facture à établir de la commande urgente (livrée le 30 décembre, facturée le 4 janvier) :
 *     une vente de N, déclarée en janvier N + 1 ;
 *   · le produit constaté d'avance (120 enceintes facturées le 20 décembre, livrées en janvier) : une
 *     base de N, une vente de N + 1 ;
 *   · l'escompte de Sonora.
 * Les leviers du laboratoire facturent autrement (la commande urgente le 30 décembre, la livraison
 * différée à la livraison) : les ventes comptabilisées ne bougent pas, la base déclarée si.
 */
export function cadrageDeLaTva(f: FicheDeLExercice, autrement: { commandeUrgenteFactureeEnDecembre?: boolean; livraisonDiffereeFactureeEnJanvier?: boolean } = {}) {
  const k = cloture(f);
  const avant = k.soldesAvantInventaire;
  const ventesComptabilisees = auCentime(-sommeDesComptes(k.soldes, ["70"]));
  const ventesFacturees = auCentime(-sommeDesComptes(avant, ["70"]));
  const escompte = sommeDesComptes(avant, ["665"]);
  const travail = (code: string) => {
    const t = k.travaux.find((x) => x.code === code)!;
    return auCentime(t.lignes.filter((l) => l.compte.startsWith("70")).reduce((s, l) => s + l.credit - l.debit, 0));
  };
  const factureAEtablir = travail("factureAEtablir");
  const produitConstateDAvance = auCentime(-travail("produitConstateDAvance"));
  const base = auCentime(
    ventesFacturees - escompte + (autrement.commandeUrgenteFactureeEnDecembre ? factureAEtablir : 0) - (autrement.livraisonDiffereeFactureeEnJanvier ? produitConstateDAvance : 0),
  );
  const ecart = auCentime(ventesComptabilisees - base);
  return {
    ventesComptabilisees,
    ventesFacturees,
    factureAEtablir,
    produitConstateDAvance,
    escompte,
    base,
    tvaCollectee: auCentime(base * f.tauxDeTva),
    ecart,
    /** La part de l'écart qui vient des dates de facturation, et non de l'escompte. */
    decalages: auCentime(ecart - escompte),
  };
}

/**
 * LA DÉCLARATION SOCIALE NOMINATIVE DE DÉCEMBRE N FACE AUX COMPTES DE LA PAIE : ce que la DSN déclare
 * (les cotisations de l'URSSAF, de la retraite, le prélèvement à la source), recalculé sur le brut de
 * la fiche, face aux soldes des comptes 431, 437 et 442 au 31 décembre ; et le brut de l'année déclaré
 * mois par mois face au compte 641.
 */
export function controleDeLaPaie(f: FicheDeLExercice) {
  const b = bulletinDePaie(f.paie.brut, f.tauxDeLaPaie);
  const k = cloture(f);
  const solde = (c: string) => auCentime(-(k.soldesAvantInventaire[c] ?? 0));
  const brutDeLAnnee = auCentime(f.paie.brut * 12);
  return {
    brutDuMois: f.paie.brut,
    dsn: { urssaf: b.aVerser.urssaf, retraite: b.aVerser.retraite, prelevement: b.aVerser.etat },
    comptes: { urssaf: solde("431"), retraite: solde("437"), prelevement: solde("442") },
    brutDeLAnnee,
    compte641: auCentime(k.soldesAvantInventaire["641"] ?? 0),
    ecarts: {
      urssaf: auCentime(b.aVerser.urssaf - solde("431")),
      retraite: auCentime(b.aVerser.retraite - solde("437")),
      prelevement: auCentime(b.aVerser.etat - solde("442")),
      brut: auCentime(brutDeLAnnee - (k.soldesAvantInventaire["641"] ?? 0)),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ARCHIVAGE ET LE CONTRÔLE EXTÉRIEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES DURÉES DE CONSERVATION que le chapitre enseigne, à compter de la clôture de l'exercice (ou de la
 * date du document). Quand deux règles visent le même document, la plus longue l'emporte.
 * // À VÉRIFIER : 10 ans pour les livres et pièces justificatives (code de commerce, art. L123-22) ;
 * // 6 ans pour les documents fiscaux (livre des procédures fiscales, art. L102 B) ; 5 ans pour le
 * // double des bulletins de paie (code du travail, art. L3243-4) et pour les contrats commerciaux
 * // (prescription de droit commun).
 */
export const DUREES_DE_CONSERVATION = { comptable: 10, fiscale: 6, sociale: 5, contrats: 5 } as const;

/**
 * LE DROIT DE REPRISE DE L'ADMINISTRATION, en règle générale : jusqu'à la fin de la troisième année
 * qui suit celle de l'exercice. Les pièces de N se contrôlent jusqu'au 31 décembre N + 3.
 * // À VÉRIFIER : délai de reprise de droit commun (LPF, art. L169 pour l'impôt sur les sociétés,
 * // L176 pour la TVA).
 */
export const DROIT_DE_REPRISE_EN_ANNEES = 3;

/**
 * LE CONTRÔLE FISCAL DE N + 1 (hypothèse du cours) : l'avis de vérification de comptabilité arrive le
 * 6 octobre N + 1, sur l'exercice N ; le vérificateur vient le 20 octobre. Le fichier des écritures
 * comptables (FEC) se remet dès le début des opérations de contrôle : un fichier de toutes les
 * écritures de l'exercice, une ligne par ligne d'écriture, 18 zones normées. Ne pas le remettre coûte
 * une amende.
 * // À VÉRIFIER : remise du FEC dès le début des opérations (LPF, art. L47 A) ; amende de 5 000 € pour
 * // défaut de remise ou de conformité (CGI, art. 1729 D) ; délai de réponse de 30 jours à une
 * // proposition de rectification, prorogeable de 30 jours sur demande.
 */
export const CONTROLE_FISCAL = {
  avis: "6 octobre N + 1",
  premiereIntervention: "20 octobre N + 1",
  zonesDuFec: 18,
  amendePourDefautDeFec: 5_000,
  delaiDeReponseEnJours: 30,
} as const;

/** Les 18 zones du FEC, dans l'ordre de l'arrêté (lues à l'étape du fichier). */
export const ZONES_DU_FEC: readonly string[] = [
  "JournalCode",
  "JournalLib",
  "EcritureNum",
  "EcritureDate",
  "CompteNum",
  "CompteLib",
  "CompAuxNum",
  "CompAuxLib",
  "PieceRef",
  "PieceDate",
  "EcritureLib",
  "Debit",
  "Credit",
  "EcritureLet",
  "DateLet",
  "ValidDate",
  "Montantdevise",
  "Idevise",
];
