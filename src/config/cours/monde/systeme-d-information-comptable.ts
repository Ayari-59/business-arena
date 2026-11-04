import { auCentime, rangDuJour, JOURS_DU_MOIS, type DateDuCours } from "./amortissement";
import { avecLaTva, facturesDeCampusTech, facturesDuFournisseur } from "./cloture";
import type { FicheDeLExercice, LigneDeBalance } from "./exercice-de-nova";
import { facture } from "./facture";

/**
 * LE MONDE DU COURS : LE SYSTÈME D'INFORMATION COMPTABLE DE NOVA, ET SES CONTRÔLES
 * (Bac STMG, gestion et finance, thème 1 : le programme 1.1 et les contrôles du 1.2).
 *
 * Deux chapitres du lycée lisent ici le premier exercice de NOVA (exercice-de-nova.ts), le même que
 * celui des six autres chapitres du parcours (comptes-du-lycee.ts) :
 *   · « Le système d'information comptable » suit une facture de CampusTech du document au
 *     bilan : la pièce, le journal, le compte du client au grand livre, la balance avant
 *     inventaire de la fiche, les documents de synthèse ; puis ce que le numérique y change (la
 *     facture électronique, la sauvegarde) ;
 *   · « Contrôler les comptes » lettre le compte de CampusTech et rapproche le compte bancaire de
 *     NOVA du relevé de la banque, au 31 décembre.
 *
 * TOUT SE REFAIT DEPUIS LA FICHE : les factures de CampusTech et d'Électro-Composants sont celles de
 * la clôture (cloture.ts), celles de Sonora sortent du modèle de facture (facture.ts) ; la garde
 * vérifie que le compte des clients retombe sur la balance avant inventaire, et que le compte
 * bancaire, une fois rapproché, retombe sur la banque de la fiche, au centime. UNE SEULE NOVA : le
 * rapprochement ne change aucun chiffre de la clôture, il dit comment la comptabilité y arrive.
 *
 * LES HYPOTHÈSES DU COURS, nommées ci-dessous : le coût d'une facture papier et d'une facture
 * électronique, l'abonnement à une plateforme, les jours de saisie et le prix des sauvegardes, les
 * paiements par carte du 31 décembre, et les deux opérations que le comptable n'a pas encore
 * saisies quand le relevé de décembre arrive.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES DATES
// ─────────────────────────────────────────────────────────────────────────────

/** La date d'un rang du calendrier commercial (le contraire de `rangDuJour`), dans l'exercice. */
export function dateDuRang(rang: number): DateDuCours {
  const mois = Math.floor((rang - 1) / JOURS_DU_MOIS) + 1;
  return { jour: rang - (mois - 1) * JOURS_DU_MOIS, mois };
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;

/** « 20 octobre », « 1er décembre ». */
export const dateEcrite = (d: DateDuCours) => `${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]}`;

/** Le nom d'un mois : « septembre ». */
export const nomDuMois = (mois: number) => MOIS[mois - 1]!;

/** « de juillet », « d'août », « d'octobre » : le mois après « de », élidé. */
export const deMois = (mois: number) => (/^[aeiouyé]/.test(nomDuMois(mois)) ? `d'${nomDuMois(mois)}` : `de ${nomDuMois(mois)}`);

// ─────────────────────────────────────────────────────────────────────────────
// LES COMPTES DE TIERS : CE QUI EST FACTURÉ, CE QUI EST RÉGLÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Une ligne d'un compte de tiers : une facture ou un règlement, et la facture à laquelle elle se rattache. */
export interface MouvementDeTiers {
  date: DateDuCours;
  nature: "facture" | "reglement";
  /** Le mois de la facture que la ligne concerne (1 pour janvier) : la clé du lettrage. */
  facture: number;
  montant: number;
}

/** Le solde d'une liste de mouvements, du côté du créancier : factures moins règlements. */
const solde = (lignes: readonly MouvementDeTiers[]) =>
  auCentime(lignes.reduce((t, l) => t + (l.nature === "facture" ? l.montant : -l.montant), 0));

/**
 * LE COMPTE DE CAMPUSTECH (411) DE L'ANNÉE : une facture le 20 de chaque mois, et son règlement
 * 80 jours après (le 10 du troisième mois suivant, la règle de `facturesEnCours`), quand il tombe
 * dans l'exercice. Les factures d'octobre, de novembre et de décembre restent dues.
 */
export function compteDeCampusTech(f: FicheDeLExercice): MouvementDeTiers[] {
  const fin = rangDuJour(f.cloture);
  return facturesDeCampusTech(f).flatMap((x, m) => {
    const paiement = rangDuJour(x.date) + f.campustech.delai;
    const lignes: MouvementDeTiers[] = [{ date: x.date, nature: "facture", facture: m + 1, montant: x.ttc }];
    if (paiement <= fin) lignes.push({ date: dateDuRang(paiement), nature: "reglement", facture: m + 1, montant: x.ttc });
    return lignes;
  });
}

/** LE COMPTE DE SONORA (411) : la facture de septembre, réglée le 25 septembre escompte déduit ; celle d'octobre, impayée. */
export function compteDeSonora(f: FicheDeLExercice): MouvementDeTiers[] {
  const s = f.sonora;
  const septembre = facture(f.facturesSonora.septembre).netAPayer;
  const octobre = facture(f.facturesSonora.octobre).netAPayer;
  return [
    { date: s.premiereCommande.date, nature: "facture", facture: s.premiereCommande.date.mois, montant: septembre },
    { date: s.premiereCommande.reglement, nature: "reglement", facture: s.premiereCommande.date.mois, montant: septembre },
    { date: s.secondeCommande.date, nature: "facture", facture: s.secondeCommande.date.mois, montant: octobre },
  ];
}

/**
 * LE COMPTE COLLECTIF DES CLIENTS (411) AU GRAND LIVRE : ce qui a été facturé dans l'année (au
 * débit), ce qui a été réglé (au crédit), et le solde, qui est la balance avant inventaire.
 */
export function grandLivreDesClients(f: FicheDeLExercice) {
  const campustech = compteDeCampusTech(f);
  const sonora = compteDeSonora(f);
  const total = (l: readonly MouvementDeTiers[], n: MouvementDeTiers["nature"]) => auCentime(l.filter((x) => x.nature === n).reduce((t, x) => t + x.montant, 0));
  const tous = [...campustech, ...sonora];
  return {
    campustech: {
      lignes: campustech,
      factures: campustech.filter((x) => x.nature === "facture").length,
      reglements: campustech.filter((x) => x.nature === "reglement").length,
      facture: total(campustech.slice(0, 1), "facture"),
      debit: total(campustech, "facture"),
      credit: total(campustech, "reglement"),
      solde: solde(campustech),
    },
    sonora: { lignes: sonora, debit: total(sonora, "facture"), credit: total(sonora, "reglement"), solde: solde(sonora) },
    debit: total(tous, "facture"),
    credit: total(tous, "reglement"),
    solde: solde(tous),
  };
}

/**
 * LE COMPTE D'ÉLECTRO-COMPOSANTS (401) : une facture le 10 de chaque mois, réglée par virement le
 * 1er du mois suivant (la fiche). La facture de décembre reste due au 31 décembre.
 */
export function compteDuFournisseur(f: FicheDeLExercice): MouvementDeTiers[] {
  return facturesDuFournisseur(f).flatMap((x, m) => {
    const lignes: MouvementDeTiers[] = [{ date: x.date, nature: "facture", facture: m + 1, montant: x.ttc }];
    if (m < 11) lignes.push({ date: { jour: 1, mois: m + 2 }, nature: "reglement", facture: m + 1, montant: x.ttc });
    return lignes;
  });
}

/** Le solde d'un compte de tiers, et ses lignes non lettrées : les factures dont aucun règlement n'est passé. */
export function lettrage(lignes: readonly MouvementDeTiers[]) {
  const reglees = new Set(lignes.filter((l) => l.nature === "reglement").map((l) => l.facture));
  const lettree = (l: MouvementDeTiers) => reglees.has(l.facture);
  const nonLettrees = lignes.filter((l) => !lettree(l));
  return { lettree, nonLettrees, solde: solde(lignes), resteDu: auCentime(nonLettrees.reduce((t, l) => t + (l.nature === "facture" ? l.montant : -l.montant), 0)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LA BALANCE ET LES DOCUMENTS DE SYNTHÈSE
// ─────────────────────────────────────────────────────────────────────────────

/** Où va un compte de la balance : au bilan (classes 1 à 5), au compte de résultat (classes 6 et 7). */
export const documentDuCompte = (compte: string): "bilan" | "resultat" => (/^[67]/.test(compte) ? "resultat" : "bilan");

/** Les totaux de la balance avant inventaire : la partie double les rend égaux. */
export function totauxDeLaBalance(balance: readonly LigneDeBalance[]) {
  const debit = auCentime(balance.reduce((t, l) => t + l.debit, 0));
  const credit = auCentime(balance.reduce((t, l) => t + l.credit, 0));
  return { debit, credit, ecart: auCentime(debit - credit) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LA FACTURE ÉLECTRONIQUE (HYPOTHÈSES DU COURS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CE QUE COÛTE UNE FACTURE, ÉMISE OU REÇUE (HYPOTHÈSE DU COURS, ordre de grandeur des études sur la
 * dématérialisation) : sur papier, 9 € (l'impression ou l'ouverture du courrier, l'enveloppe et le
 * timbre, la saisie à la main, le classement) ; électronique, 3 € (le contrôle de l'écriture que le
 * logiciel propose). La plateforme agréée qui transmet les factures électroniques coûte 480 € par
 * an à NOVA (40 € par mois). Ces prix varient d'une offre à l'autre : seul l'ordre de grandeur compte.
 */
export const COUT_D_UNE_FACTURE_PAPIER = 9;
export const COUT_D_UNE_FACTURE_ELECTRONIQUE = 3;
export const ABONNEMENT_A_LA_PLATEFORME = 480;

/** Le nombre de factures par an à partir duquel l'économie paie l'abonnement : le seuil du curseur. */
export const seuilDeLaFactureElectronique = () => Math.ceil(ABONNEMENT_A_LA_PLATEFORME / (COUT_D_UNE_FACTURE_PAPIER - COUT_D_UNE_FACTURE_ELECTRONIQUE) - 1e-9);

/**
 * LES FACTURES ENTRE ENTREPRISES DE L'ANNÉE, celles que la réforme rend électroniques : émises (les
 * douze de CampusTech, les deux de Sonora) et reçues (les douze d'Électro-Composants, celle de la
 * ligne de montage). Les ventes en ligne aux particuliers n'en sont pas : elles se déclarent à part.
 */
export function facturesEntreEntreprises(f: FicheDeLExercice) {
  const emises = facturesDeCampusTech(f).length + compteDeSonora(f).filter((l) => l.nature === "facture").length;
  const recues = facturesDuFournisseur(f).length + 1;
  return { emises, recues, total: emises + recues };
}

// ─────────────────────────────────────────────────────────────────────────────
// LA SAUVEGARDE (HYPOTHÈSES DU COURS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES JOURS DE SAISIE D'UNE ANNÉE (HYPOTHÈSE DU COURS) : 250 jours ouvrés. Une panne sans copie
 * qui survive fait perdre tout l'exercice : le laboratoire place l'incident au 31 décembre.
 */
export const JOURS_DE_SAISIE_DE_L_ANNEE = 250;

/**
 * OÙ SE GARDE LA COPIE (HYPOTHÈSE DU COURS) : ce qui lui arrive dans trois incidents, et son prix par
 * an. Sur le serveur lui-même, elle disparaît avec lui. Sur un disque externe branché au serveur, elle
 * survit à la panne du serveur, pas à l'incendie du bureau ni au rançongiciel qui chiffre tout ce qui
 * est branché. En ligne, chez un prestataire, hors de l'entreprise et avec ses versions anciennes,
 * elle survit aux trois.
 */
export const LIEUX_DE_LA_COPIE = [
  { code: "serveur", libelle: "sur le serveur lui-même", prixParAn: 0, survit: { panne: false, incendie: false, rancongiciel: false } },
  { code: "disque", libelle: "sur un disque externe branché au serveur", prixParAn: 120, survit: { panne: true, incendie: false, rancongiciel: false } },
  { code: "en-ligne", libelle: "en ligne, hors de l'entreprise", prixParAn: 360, survit: { panne: true, incendie: true, rancongiciel: true } },
] as const;

export type Incident = keyof (typeof LIEUX_DE_LA_COPIE)[number]["survit"];

/** Les jours de saisie perdus dans un incident : depuis la dernière copie si elle survit, toute l'année sinon. */
export function sauvegarde(frequence: number, lieu: number) {
  const l = LIEUX_DE_LA_COPIE[lieu]!;
  const perte = (i: Incident) => (l.survit[i] ? Math.min(frequence, JOURS_DE_SAISIE_DE_L_ANNEE) : JOURS_DE_SAISIE_DE_L_ANNEE);
  const pertes = { panne: perte("panne"), incendie: perte("incendie"), rancongiciel: perte("rancongiciel") };
  return { lieu: l, pertes, pire: Math.max(...Object.values(pertes)), prixParAn: l.prixParAn };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE RAPPROCHEMENT BANCAIRE DU 31 DÉCEMBRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES PAIEMENTS PAR CARTE DU 31 DÉCEMBRE (HYPOTHÈSE DU COURS) : 60 enceintes commandées en ligne ce
 * jour-là (sur les ventes de décembre de la fiche), enregistrées par NOVA le jour même, que la banque
 * ne crédite que le 2 janvier N+1. La banque est en retard sur NOVA : rien à corriger dans les comptes.
 */
export const CARTES_DU_31_DECEMBRE = { enceintes: 60, credit: { jour: 2, mois: 1, exercice: 1 } as DateDuCours };

/**
 * CE QUE LE COMPTABLE N'A PAS ENCORE SAISI QUAND LE RELEVÉ DE DÉCEMBRE ARRIVE (HYPOTHÈSE DU COURS) :
 *   · le prélèvement du loyer du 5 décembre, dont l'avis n'est arrivé qu'avec le relevé ;
 *   · le virement de CampusTech du 10 décembre, qui règle la facture de septembre : la banque l'a
 *     reçu, le comptable ne l'a pas vu.
 * Le rapprochement les révèle ; une fois saisis, le compte bancaire est celui de la fiche. La
 * balance avant inventaire de la fiche est donc établie après le rapprochement.
 */
export const OUBLIS_DE_DECEMBRE = { loyer: { jour: 5, mois: 12 } as DateDuCours, campustech: { jour: 10, mois: 12 } as DateDuCours };

/** Le rapprochement du compte bancaire de NOVA (512) et du relevé de la banque, au 31 décembre. */
export function rapprochementDeDecembre(f: FicheDeLExercice) {
  const ligne = (compte: string) => f.balanceAvantInventaire.find((l) => l.compte === compte)!;
  const banque = auCentime(ligne("512").debit - ligne("512").credit);
  const loyer = f.loyer.montant;
  const septembre = compteDeCampusTech(f).find((l) => l.nature === "reglement" && l.date.mois === OUBLIS_DE_DECEMBRE.campustech.mois && l.date.jour === OUBLIS_DE_DECEMBRE.campustech.jour)!;
  const virement = septembre.montant;
  const cartes = avecLaTva(CARTES_DU_31_DECEMBRE.enceintes * f.prixDeLEnceinte, f.tauxDeTva).ttc;
  // Les opérations de décembre que les deux côtés portent : elles se pointent, et ne jouent pas.
  const fournisseur = compteDuFournisseur(f).find((l) => l.nature === "reglement" && l.date.mois === 12)!;
  const organismes = auCentime(["431", "437", "442"].reduce((t, c) => t + ligne(c).credit, 0));
  const compteAvant = auCentime(banque - virement + loyer);
  const releve = auCentime(banque - cartes);
  return {
    banque,
    loyer,
    virement,
    factureReglee: septembre.facture,
    cartes,
    fournisseur: fournisseur.montant,
    organismes,
    /** Le solde du compte 512 de NOVA avant le rapprochement. */
    compteAvant,
    /** Le solde du relevé de la banque au 31 décembre : ce qui est vraiment sur le compte ce jour-là. */
    releve,
    /** Les deux soldes, rapprochés : celui de la fiche. */
    compteRapproche: auCentime(compteAvant + virement - loyer),
    releveRapproche: auCentime(releve + cartes),
    /** La facture du 10 décembre d'Électro-Composants : une dette, pas un mouvement de la banque (le piège du laboratoire). */
    factureDuFournisseur: compteDuFournisseur(f).find((l) => l.nature === "facture" && l.date.mois === 12)!.montant,
  };
}

export type RapprochementDeDecembre = ReturnType<typeof rapprochementDeDecembre>;

/** Les leviers du laboratoire du rapprochement : chacun vaut 0 (non) ou 1 (oui). */
export interface ChoixDuRapprochement {
  /** Le prélèvement du loyer, porté au compte de NOVA. */
  loyer: number;
  /** Le virement de CampusTech, porté au compte de NOVA. */
  campustech: number;
  /** Les cartes du 31 décembre, ajoutées au relevé de la banque. */
  cartes: number;
  /** La facture du 10 décembre d'Électro-Composants, retirée du compte de NOVA comme si elle était payée. */
  facture: number;
}

/** Les deux soldes corrigés selon les choix du laboratoire, et l'écart qui reste. */
export function rapprochementChoisi(r: RapprochementDeDecembre, p: ChoixDuRapprochement) {
  const compte = auCentime(r.compteAvant + p.campustech * r.virement - p.loyer * r.loyer - p.facture * r.factureDuFournisseur);
  const releve = auCentime(r.releve + p.cartes * r.cartes);
  return { compte, releve, ecart: auCentime(compte - releve) };
}
