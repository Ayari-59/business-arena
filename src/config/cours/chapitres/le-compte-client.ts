import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  CESSION_D_ONDES,
  CLIENTS_DE_LA_BALANCE,
  DATE_D_ARRETE,
  DOUBLON,
  FACTURE_DE_CAMPUSTECH,
  LCR_DE_DECEMBRE,
  LCR_DE_VIBRA,
  LIGNES_DE_CREDIT,
  REGLEMENT_PARTIEL,
  STUDIO_MERIDIEN,
  TRANCHES,
  TTC_D_UNE_ENCEINTE,
  VIBRA,
  annulationDuDoublon,
  balanceAgee,
  bordereauDEscompte,
  bordereauDuFactor,
  commandeMaximale,
  compteDeCampusTech,
  creancesOuvertes,
  dateEcrite,
  effetsEscomptesNonEchus,
  enCoursDeCampusTech,
  factureDEnceintes,
  impayeDeVibra,
  lettrageDeCampusTech,
} from "../monde/compte-client-de-nova";
import { B } from "../monde/financer-et-placer";
import { RELANCES } from "../monde/mauvais-payeurs";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COMPTE CLIENT, LETTRAGE, EFFETS DE COMMERCE, BALANCE ÂGÉE (comptabilité générale,
 * palier 4 ; BTS CG P1, 1.3.2, 1.3.3, 1.4.1 et 1.4.2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA en N+1, ses clients CampusTech, Sonora et Ondes, la
 * banque et le factor du chapitre « Financer et placer la trésorerie », dont il passe les opérations au
 * journal sans changer un chiffre. Tous les chiffres se calculent dans monde/compte-client-de-nova.ts.
 *
 * LE FIL : le 30 avril, le comptable contrôle le compte de CampusTech dans le PGI (le lettrage, un
 * doublon à annuler, un règlement partiel) ; il remonte à la lettre de change de décembre (acceptation,
 * escompte, engagement hors bilan) ; il dresse la balance âgée de tous les clients, mesure l'en-cours
 * de CampusTech face à sa ligne de crédit, et alerte ; en juin, l'effet de Vibra revient impayé ; en mai,
 * la première facture d'Ondes part chez le factor ; enfin, le compte rendu au responsable.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-compte-dans-le-pgi, le-solde-a-corriger, annuler-le-doublon, la-lcr-acceptee,
 *     la-remise-a-l-escompte, le-bordereau-d-escompte (les comptes sont dans la question) ;
 *   · l'expérience avant la formule : predire-la-ligne, la-commande-au-curseur (la plus grosse commande
 *     sous la ligne), puis le-laboratoire-de-l-en-cours (la commande et l'escompte ; l'escompte sort la
 *     créance du bilan, pas le risque de l'en-cours) ;
 *   · autonome : la-balance-agee (le tableau à compléter), la-remise-a-l-encaissement, l-effet-impaye,
 *     la-cession-au-factor, le-bordereau-du-factor ;
 *   · expert : le-lettrage-partiel, les-effets-escomptes, l-alerte, le-compte-rendu ; puis la synthèse.
 */

/** Le compte client se joue chez NOVA. */
export const ENTREPRISES_DU_COMPTE_CLIENT: readonly string[] = ["nova"];

/** Les leviers du laboratoire de l'en-cours : la commande urgente (enceintes), la facture de mars escomptée ou non. */
export const LEVIERS_DE_L_EN_COURS = { commande: { min: 0, max: 300, pas: 20 } } as const;
export const DEPART_DE_L_EN_COURS = { commande: 200, escompte: 0 } as const;

/** Les bornes du curseur de la commande urgente. */
export const COMMANDE_DU_CURSEUR = { min: 0, max: 300 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const jours = (n: number) => `${qte(n)} jour${n >= 2 ? "s" : ""}`;
const an = (d: { exercice?: 0 | 1 }) => (d.exercice === 0 ? " N" : "");
const jourDe = (d: Parameters<typeof dateEcrite>[0]) => `${dateEcrite(d)}${an(d)}`;
const auJournal = (d: Parameters<typeof dateEcrite>[0]) => `${dateEcrite(d)} N+1`;

/** Tous les chiffres du chapitre. */
export function compteClientDuChapitre(_c: Pick<Cas, "code">) {
  const lettrage = lettrageDeCampusTech();
  const balance = balanceAgee();
  const campus = balance.lignes.find((l) => l.client === "CampusTech")!;
  const studio = balance.lignes.find((l) => l.client === "Studio Méridien")!;
  return {
    compte: compteDeCampusTech(),
    lettrage,
    doublon: annulationDuDoublon(),
    escompte: bordereauDEscompte(),
    balance,
    campus,
    studio,
    commandeMax: commandeMaximale(),
    commandeMaxAuPas: commandeMaximale(LEVIERS_DE_L_EN_COURS.commande.pas),
    vibra: factureDEnceintes(VIBRA.enceintes),
    impaye: impayeDeVibra(),
    factor: bordereauDuFactor(),
    effetsAu31Janvier: effetsEscomptesNonEchus({ jour: 30, mois: 1, exercice: 1 }),
    effetsAu31Mars: effetsEscomptesNonEchus({ jour: 30, mois: 3, exercice: 1 }),
    reste: auCentime(FACTURE_DE_CAMPUSTECH.ttc - REGLEMENT_PARTIEL.montant),
  };
}

const position = (p: Readonly<Record<string, number>>) => ({ commande: p.commande ?? 0, escompte: (p.escompte === 1 ? 1 : 0) as 0 | 1 });

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Le compte 411 CampusTech dans le PGI, au 30 avril, avant contrôle. */
function leCompteDansLePgi(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = compteClientDuChapitre(c);
  return {
    titre: `Le compte 411 CampusTech au ${dateEcrite(DATE_D_ARRETE)} N+1, dans le PGI`,
    colonnes: ["Débit", "Crédit"],
    lignes: x.compte.map((l) => ({ libelle: `${jourDe(l.date)} · ${l.libelle}`, valeurs: [l.debit ? eur(l.debit) : "", l.credit ? eur(l.credit) : ""] })),
  };
}

/** Les créances ouvertes au 30 avril, pièce par pièce. */
function lesCreancesOuvertes(): TableauDeDonnees {
  return {
    titre: `Les créances ouvertes au ${dateEcrite(DATE_D_ARRETE)} N+1, doublon annulé`,
    colonnes: ["Reste dû", "Échéance convenue"],
    lignes: creancesOuvertes().map((x) => ({ libelle: `${x.client}, ${x.piece}`, valeurs: [eur(x.reste), jourDe(x.echeance)] })),
  };
}

/** Les lignes de crédit des clients. */
function lesLignesDeCredit(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = compteClientDuChapitre(c);
  return {
    titre: "En-cours et lignes de crédit au 30 avril",
    colonnes: ["En-cours", "Ligne", "Plus gros retard"],
    lignes: x.balance.lignes.map((l) => ({ libelle: l.client, valeurs: [eur(l.total), l.ligne ? eur(l.ligne) : "aucune", jours(l.retardMaximal)] })),
  };
}

/** La balance âgée à compléter. */
function grilleDeLaBalance(c: Pick<Cas, "code">): TableauACompleter {
  const x = compteClientDuChapitre(c);
  const b = x.balance;
  return {
    titre: `La balance âgée des clients au ${dateEcrite(DATE_D_ARRETE)} N+1`,
    colonnes: [...TRANCHES.map((t) => t.libelle), "Total"],
    colonneDeTotal: TRANCHES.length,
    lignes: [
      ...b.lignes.map((l) => ({
        libelle: l.client,
        cellules: [
          ...TRANCHES.map((t) => ({ valeur: l.parTranche[t.code], saisir: true, calcul: `ce que ${l.client} doit dans cette tranche : ${eur(l.parTranche[t.code])}`, indice: "le retard d'une pièce se compte depuis son échéance convenue, au 30 avril" })),
          { valeur: l.total, saisir: true, calcul: `${TRANCHES.map((t) => eur(l.parTranche[t.code])).join(" + ")} = ${eur(l.total)}`, indice: "la somme des tranches de la ligne" },
        ],
      })),
      {
        libelle: "Total",
        fort: true,
        totalDe: { plus: b.lignes.map((_, i) => i) },
        cellules: [
          ...TRANCHES.map((t) => ({ valeur: b.totaux[t.code], saisir: true, calcul: `${eur(b.totaux[t.code])}`, indice: "la somme de la colonne" })),
          { valeur: b.total, saisir: true, calcul: `${eur(b.total)}`, indice: "la somme de la colonne, ou celle de la ligne" },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_COMPTE_CLIENT: Chapitre = {
  code: "le-compte-client",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales"],
  titre: "Le compte client : lettrage, effets de commerce, balance âgée",
  accroche:
    "Le compte de CampusTech ne tombe pas juste, une lettre de change attend son échéance, un petit client ne paie plus. Vous lettrez, vous passez les effets au journal, vous dressez la balance âgée et vous alertez.",
  objectifs: [
    "Lettrer un compte client dans le PGI, repérer une anomalie et la corriger",
    "Enregistrer l'acceptation, l'escompte, l'encaissement et l'impayé d'une lettre de change relevé, et suivre les effets escomptés non échus",
    "Présenter une balance âgée, comparer l'en-cours d'un client à sa ligne de crédit et alerter",
    "Enregistrer la cession d'une facture à un factor et son bordereau",
  ],
  libre: false,
  prerequis: ["remises-et-reglements", "financer-et-placer-la-tresorerie"],
  ensuite: ["fournisseurs-et-banque"],
  entreprises: {
    codes: ENTREPRISES_DU_COMPTE_CLIENT,
    pourquoi: "le compte client se suit ici sur NOVA en N+1, dans la simulation du cours, avec ses clients, sa banque et son factor ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un compte client à contrôler",
      notions: ["payment_terms", "receivables_financing"],
      tableau: lesLignesDeCredit,
      texte: () => [
        `Ce chapitre se joue dans la simulation du cours, chez NOVA, en N+1. Fin avril, le responsable du crédit client demande au comptable un point sur les clients : le compte de CampusTech, les effets de commerce, et qui risque de ne pas payer.`,
        `CampusTech reçoit chaque mois une facture de ${eur(FACTURE_DE_CAMPUSTECH.ttc)} TTC, convenue à 60 jours et payée à 80. En décembre, elle a accepté une lettre de change, que NOVA a escomptée : c'est celle du chapitre « Financer et placer la trésorerie ».`,
        `Deux petits clients sont arrivés : ${STUDIO_MERIDIEN.nom}, une école de son, et ${VIBRA.nom}, un magasin de hi-fi. Sonora, en procédure collective, est au compte 416. La chaîne Ondes, enfin, paie à 60 jours : ses factures partiront chez le factor.`,
        "Chaque client a une ligne de crédit : le plus que le responsable accepte qu'il doive à NOVA. Le tableau les donne, avec l'en-cours du 30 avril.",
      ],
      repere: () => "Lettrer, c'est relier une facture aux règlements qui la soldent, par sa référence. En-cours = ce que le client doit encore + ses effets escomptés non échus.",
    },
    {
      id: "le-compte-dans-le-pgi",
      objectifs: [0],
      type: "choix",
      titre: "Le lettrage automatique",
      notions: ["payment_terms"],
      tableau: leCompteDansLePgi,
      question: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le PGI lettre les factures d'octobre, de novembre et de décembre avec leurs règlements (${x.lettrage.lettres.map((l) => l.lettre).join(", ")}). Il propose ensuite de lettrer le second virement du ${dateEcrite(DOUBLON.date)}, ${eur(x.doublon.montant)}, avec la facture du 20 janvier : même montant. Que faites-vous ?`;
      },
      options: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          {
            texte: "Je refuse : ce virement paie novembre, c'est un doublon",
            juste: true,
            retour: `Oui. Sa référence est la facture de novembre, déjà soldée (lettre B) ; même date, même montant, une seule ligne au relevé de la banque : le virement a été saisi à la main, puis importé avec le relevé. Lettré avec janvier, il cacherait le doublon et ferait croire janvier payée. On lettre sur la référence de la pièce, jamais sur le seul montant.`,
          },
          {
            texte: "J'accepte : un virement du bon montant solde forcément une facture ouverte",
            juste: false,
            retour: `Non : le montant ne dit pas quelle facture est payée. Toutes les factures de CampusTech font ${eur(x.doublon.montant)} ; seule la référence de la pièce le dit.`,
          },
          {
            texte: "Je le lettre avec la facture d'avril, la plus récente, pour garder les anciennes ouvertes",
            juste: false,
            retour: "Non : lettrer une facture que le client n'a pas payée efface une créance réelle du suivi, et la relance ne partirait jamais.",
          },
        ];
      },
    },
    {
      id: "le-solde-a-corriger",
      objectifs: [0],
      type: "montants",
      titre: "Le solde à corriger",
      notions: ["payment_terms"],
      tableau: leCompteDansLePgi,
      question: () => "Calculez le solde du compte tel que le PGI l'affiche, puis le solde juste, le doublon retiré, et l'écart entre les deux.",
      champs: (c) => {
        const x = compteClientDuChapitre(c);
        const d = x.compte.reduce((t, l) => t + l.debit, 0);
        const cr = x.compte.reduce((t, l) => t + l.credit, 0);
        return [
          { libelle: "Solde affiché (débiteur)", attendu: x.lettrage.affiche, calcul: `${eur(d)} au débit − ${eur(cr)} au crédit = ${eur(x.lettrage.affiche)}` },
          { libelle: "Solde juste", attendu: x.lettrage.juste, calcul: `${eur(x.lettrage.affiche)} + ${eur(x.doublon.montant)} saisis deux fois = ${eur(x.lettrage.juste)}` },
          { libelle: "Écart", attendu: x.lettrage.ecart, calcul: `${eur(x.lettrage.juste)} − ${eur(x.lettrage.affiche)} = ${eur(x.lettrage.ecart)}` },
        ];
      },
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `Le compte sous-estime ce que CampusTech doit de ${eur(x.lettrage.ecart)}, et la banque, au compte 512, est surestimée d'autant : le rapprochement de février aurait dû le voir. Le comptable signale l'anomalie au responsable, puis la corrige avec son accord.`,
        ];
      },
    },
    {
      id: "annuler-le-doublon",
      objectifs: [0],
      type: "ecriture",
      titre: "Annuler le doublon",
      notions: ["payment_terms"],
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le ${dateEcrite(DATE_D_ARRETE)}, avec l'accord du responsable, le comptable annule le virement de ${eur(x.doublon.montant)} saisi deux fois le ${dateEcrite(DOUBLON.date)} : l'écriture inverse du doublon.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        return {
          date: auJournal(DATE_D_ARRETE),
          libelle: "Annulation du virement de CampusTech saisi deux fois",
          lignes: [
            { role: "la créance sur CampusTech, rétablie", compte: "411", sens: "debit", montant: x.doublon.montant, indice: "le montant du virement en double" },
            { role: "la banque, ramenée à ce qu'elle a vraiment reçu", compte: "512", sens: "credit", montant: x.doublon.montant, indice: "le même montant" },
          ],
        };
      },
      indices: () => ["Le doublon avait débité la banque et crédité le client : faites l'inverse.", "Le client doit de nouveau ce que la saisie en trop avait effacé."],
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [`Le compte de CampusTech revient à ${eur(x.lettrage.juste)} débiteur, la somme de ses factures ouvertes. Le virement en trop et son annulation se lettrent entre eux.`];
      },
    },
    {
      id: "le-lettrage-partiel",
      objectifs: [0],
      type: "choix",
      titre: "Le règlement partiel",
      notions: ["payment_terms"],
      question: () => {
        return `Le ${dateEcrite(REGLEMENT_PARTIEL.date)}, CampusTech n'a versé que ${eur(REGLEMENT_PARTIEL.montant)} sur sa facture du 20 janvier, ${eur(FACTURE_DE_CAMPUSTECH.ttc)}. Le PGI ne la lettre pas. Comment la traitez-vous ?`;
      },
      options: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          {
            texte: `Un lettrage partiel : ${eur(x.reste)} restent dus`,
            juste: true,
            retour: `Oui. Le comptable relie à la main le règlement à sa facture, en lettrage partiel ; la facture reste ouverte pour ${eur(x.reste)}, échue depuis le 20 mars, et la relance suit ce solde. Le jour où il arrive, le ${dateEcrite(REGLEMENT_PARTIEL.solde)}, le lettrage devient complet.`,
          },
          {
            texte: "Je lettre la facture en entier : le client paiera le reste avec la suivante",
            juste: false,
            retour: `Non : ${eur(x.reste)} disparaîtraient du suivi. Un engagement oral ne solde pas une créance.`,
          },
          {
            texte: "Je passe l'écart en charge, il est trop petit pour être réclamé",
            juste: false,
            retour: "Non : rien ne dit que CampusTech ne paiera pas, et une créance ne s'abandonne pas sans l'accord du responsable et sans pièce.",
          },
        ];
      },
    },
    {
      id: "la-lcr-acceptee",
      objectifs: [1],
      type: "ecriture",
      titre: "La lettre de change acceptée",
      notions: ["receivables_financing"],
      evenement: () =>
        `Le ${dateEcrite(LCR_DE_DECEMBRE.acceptation)}, NOVA tire une lettre de change relevé (une LCR, un effet dématérialisé) sur CampusTech, au montant de la facture du 20 décembre, payable le ${dateEcrite(LCR_DE_DECEMBRE.echeance)}. CampusTech l'accepte : la créance devient un effet à recevoir, au compte 413.`,
      ecriture: () => ({
        date: auJournal(LCR_DE_DECEMBRE.acceptation),
        libelle: "LCR acceptée par CampusTech, facture du 20 décembre",
        lignes: [
          { role: "l'effet à recevoir", compte: "413", sens: "debit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le montant de la facture, toutes taxes comprises" },
          { role: "la créance ordinaire, qui change de forme", compte: "411", sens: "credit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le même montant" },
        ],
      }),
      indices: () => ["La créance ne disparaît pas : elle passe d'un compte de clients à un autre.", "Le compte 413 porte les effets à recevoir."],
      explication: () => [
        "Rien n'est encaissé : CampusTech doit toujours la même somme, mais par un effet qu'il a accepté de payer à l'échéance. Cet effet, NOVA peut le garder jusqu'à l'échéance, le remettre à l'encaissement, ou l'escompter.",
      ],
    },
    {
      id: "la-remise-a-l-escompte",
      objectifs: [1],
      type: "ecriture",
      titre: "La remise à l'escompte",
      notions: ["receivables_financing"],
      evenement: () =>
        `Le ${dateEcrite(LCR_DE_DECEMBRE.remise)}, NOVA a besoin de trésorerie : elle remet l'effet à l'escompte. Il quitte le portefeuille pour le compte 5114, effets à l'escompte, en attendant le bordereau de la banque.`,
      ecriture: () => ({
        date: auJournal(LCR_DE_DECEMBRE.remise),
        libelle: "Remise à l'escompte de la LCR de CampusTech",
        lignes: [
          { role: "l'effet remis à l'escompte", compte: "5114", sens: "debit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le nominal de l'effet" },
          { role: "l'effet qui quitte le portefeuille", compte: "413", sens: "credit", montant: FACTURE_DE_CAMPUSTECH.ttc, indice: "le même nominal" },
        ],
      }),
      indices: () => ["L'effet sort du compte des effets à recevoir.", "Il entre au compte des valeurs à l'encaissement, effets à l'escompte."],
      explication: () => ["L'effet est entre les mains de la banque. Le bordereau dira ce qu'elle en garde."],
    },
    {
      id: "le-bordereau-d-escompte",
      objectifs: [1],
      type: "ecriture",
      titre: "Le bordereau d'escompte",
      notions: ["receivables_financing"],
      piece: (c) => {
        const x = compteClientDuChapitre(c);
        const e = x.escompte;
        return {
          nature: "Bordereau d'escompte",
          de: "La banque de NOVA",
          a: "NOVA",
          date: auJournal(LCR_DE_DECEMBRE.remise),
          lignes: [
            { libelle: `LCR sur CampusTech, échéance ${dateEcrite(LCR_DE_DECEMBRE.echeance)}`, montant: e.nominal },
            { libelle: `À déduire, agio : ${pct(B.escompte.tauxAnnuel)} sur ${jours(e.jours)}`, montant: e.agio },
            { libelle: "À déduire, commission d'escompte, exonérée de TVA", montant: e.commission },
          ],
          totaux: [{ libelle: "Net porté au crédit de votre compte", montant: e.net, fort: true }],
        };
      },
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le jour même, la banque crédite NOVA de ${eur(x.escompte.net)} : le nominal moins l'agio, ${eur(x.escompte.agio)}, et la commission, ${eur(x.escompte.commission)}. Ce sont les chiffres du chapitre « Financer et placer la trésorerie ». Passez le bordereau.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        const e = x.escompte;
        return {
          date: auJournal(LCR_DE_DECEMBRE.remise),
          libelle: "Bordereau d'escompte, LCR de CampusTech",
          lignes: [
            { role: "le net crédité en banque", compte: "512", sens: "debit", montant: e.net, indice: "le net du bordereau" },
            { role: "l'agio, un intérêt", compte: "6616", acceptes: ["661"], sens: "debit", montant: e.agio, indice: "l'agio du bordereau" },
            { role: "la commission, un service bancaire", compte: "627", sens: "debit", montant: e.commission, indice: "la commission du bordereau" },
            { role: "l'effet escompté, qui sort", compte: "5114", sens: "credit", montant: e.nominal, indice: "le nominal de l'effet" },
          ],
        };
      },
      indices: () => [
        "L'agio rémunère l'argent avancé : c'est une charge financière d'intérêts. La commission paie un service bancaire.",
        "Le compte 5114 se solde : la banque a pris l'effet.",
      ],
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `L'effet a disparu des comptes de NOVA : ni créance au 413, ni effet au 5114. Il coûte ${eur(x.escompte.cout)}, ${eur(x.escompte.agio)} d'intérêts et ${eur(x.escompte.commission)} de services bancaires. La commission d'escompte rémunère un crédit : la banque de NOVA ne la soumet pas à la TVA. Une commission de service, elle, en porterait.`,
        ];
      },
    },
    {
      id: "les-effets-escomptes",
      objectifs: [1],
      type: "montants",
      titre: "Les effets escomptés non échus",
      notions: ["receivables_financing", "balance_sheet"],
      question: () =>
        `L'effet a quitté le bilan, mais si CampusTech ne payait pas la banque le ${dateEcrite(LCR_DE_DECEMBRE.echeance)}, la banque se retournerait contre NOVA. L'annexe déclare donc les effets escomptés non échus, en engagement hors bilan. Quel montant y figure au 31 janvier ? Et au 31 mars ?`,
      champs: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          { libelle: "Effets escomptés non échus au 31 janvier", attendu: x.effetsAu31Janvier, calcul: `escompté le ${dateEcrite(LCR_DE_DECEMBRE.remise)}, échu le ${dateEcrite(LCR_DE_DECEMBRE.echeance)} : encore en risque, ${eur(x.effetsAu31Janvier)}` },
          { libelle: "Effets escomptés non échus au 31 mars", attendu: x.effetsAu31Mars, calcul: `échu le ${dateEcrite(LCR_DE_DECEMBRE.echeance)} et payé : ${eur(x.effetsAu31Mars)}` },
        ];
      },
      explication: () => [
        "Un engagement hors bilan n'est ni une dette ni une créance : c'est un risque que les comptes doivent dire. Tant que l'effet n'est pas échu, NOVA garantit son paiement ; à l'échéance payée, l'engagement s'éteint, sans écriture.",
      ],
    },
    {
      id: "la-balance-agee",
      objectifs: [2],
      type: "a-completer",
      titre: "La balance âgée",
      notions: ["payment_terms", "customer_portfolio"],
      tableau: lesCreancesOuvertes,
      question: () =>
        `Rangez chaque créance ouverte au ${dateEcrite(DATE_D_ARRETE)} selon son retard, compté depuis son échéance convenue : non échue, échue de 1 à 30 jours, de 31 à 60, ou de plus de 60. Puis faites les totaux, client par client et tranche par tranche.`,
      grille: grilleDeLaBalance,
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        const b = x.balance;
        return [
          `Sur ${eur(b.total)} de créances, ${eur(auCentime(b.total - b.totaux["non-echu"]))} sont échues, soit ${pct(Math.round(b.partEchue * 1000) / 1000)}. Sonora pèse ${eur(b.totaux["plus-60"])} à plus de 60 jours : une créance déjà douteuse, déclarée au mandataire et dépréciée.`,
          `Le retard de CampusTech est son habitude, 20 jours ; celui de ${STUDIO_MERIDIEN.nom}, ${jours(x.studio.retardMaximal)} malgré la mise en demeure, est un signal. La balance âgée ne dit pas qui paiera : elle dit où regarder.`,
        ];
      },
    },
    {
      id: "predire-la-ligne",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la ligne de crédit",
      notions: ["receivables_financing", "customer_portfolio"],
      question: (c) => {
        const x = compteClientDuChapitre(c);
        return `Avant de calculer, pariez. CampusTech doit ${eur(x.campus.total)} pour une ligne de ${eur(x.campus.ligne)}, et demande une commande urgente. Le commercial propose d'escompter sa facture de mars, en lettre de change, « pour faire de la place sous la ligne ». L'escompte permet-il de livrer davantage ?`;
      },
      options: () => {
        const voir = "Faites-le au curseur, puis au laboratoire.";
        return [
          { texte: "Non, il ne change pas l'en-cours", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui : la facture escomptée sort du compte du client", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Oui, mais seulement de son net, agio déduit", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-commande-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "La commande urgente, au curseur",
      notions: ["customer_portfolio", "payment_terms"],
      question: (c) => {
        const x = compteClientDuChapitre(c);
        return `Faites varier les enceintes de la commande urgente de CampusTech, à ${eur(TTC_D_UNE_ENCEINTE)} TTC l'une. Une droite donne la ligne de crédit, ${eur(x.campus.ligne)} ; l'autre l'en-cours, ${eur(x.campus.total)} plus la commande. Jusqu'à combien d'enceintes la commande reste-t-elle sous la ligne ? Placez le curseur à l'enceinte près.`;
      },
      grandeur: () => ({ libelle: "Enceintes de la commande urgente", unite: "enceintes" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: compteClientDuChapitre(c).commandeMax, min: COMMANDE_DU_CURSEUR.min, max: COMMANDE_DU_CURSEUR.max }),
      zones: ["Sous la ligne", "Au-delà de la ligne"],
      rates: () => ({
        dessous: "La ligne accepte encore des enceintes : cherchez la commande la plus grande.",
        dessus: "À ce nombre, l'en-cours dépasse la ligne de crédit.",
      }),
      montrer: "Montrer la commande",
      lecture: (_c, q) => {
        const e = enCoursDeCampusTech({ commande: q, escompte: 0 });
        return [
          { libelle: "Commande, TTC", montant: e.commande },
          { libelle: "En-cours avec la commande", montant: e.enCours, fort: true },
          { libelle: "Ligne de crédit", montant: e.ligne },
        ];
      },
      droites: (c) => {
        const x = compteClientDuChapitre(c);
        return { produit: () => x.campus.ligne, cout: (q) => x.campus.total + q * TTC_D_UNE_ENCEINTE, libelles: ["Ligne de crédit", "En-cours avec la commande"] };
      },
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `La ligne laisse ${eur(auCentime(x.campus.ligne - x.campus.total))} : ${qte(x.commandeMax)} enceintes à ${eur(TTC_D_UNE_ENCEINTE)}. Au-delà, le commercial doit demander au responsable de relever la ligne, ou obtenir un paiement avant de livrer.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-en-cours",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de l'en-cours",
      notions: ["customer_portfolio", "receivables_financing"],
      question: () =>
        "Faites varier la commande urgente, par 20 enceintes, et dites si la facture de mars est escomptée. Le tableau suit la créance au compte du client, l'effet escompté non échu, l'en-cours et ce qui reste sous la ligne ; le graphique suit l'en-cours selon la commande. Relevez le défi.",
      leviers: () => [
        { code: "commande", libelle: "Commande urgente", unite: "enceintes", ...LEVIERS_DE_L_EN_COURS.commande, depart: DEPART_DE_L_EN_COURS.commande },
        { code: "escompte", libelle: "Facture de mars escomptée", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DE_L_EN_COURS.escompte, choix: [{ valeur: 0, libelle: "Non" }, { valeur: 1, libelle: "Oui" }] },
      ],
      lecture: (_c, p) => {
        const x = enCoursDeCampusTech(position(p));
        const d = enCoursDeCampusTech(position(DEPART_DE_L_EN_COURS));
        return [
          { libelle: "Créance au compte du client", montant: x.auBilan, reference: d.auBilan },
          { libelle: "Effet escompté non échu", montant: x.effet, reference: d.effet },
          { libelle: "En-cours", montant: x.enCours, reference: d.enCours, fort: true },
          { libelle: "Reste sous la ligne", montant: x.marge, reference: d.marge },
        ];
      },
      graphique: () => ({
        levier: "commande",
        courbes: [
          { libelle: "En-cours", valeur: (p) => enCoursDeCampusTech(position(p)).enCours },
          { libelle: "Créance au compte du client", valeur: (p) => enCoursDeCampusTech(position(p)).auBilan },
          { libelle: "Ligne de crédit", valeur: () => LIGNES_DE_CREDIT.CampusTech },
        ],
      }),
      defi: (c) => {
        const x = compteClientDuChapitre(c);
        return {
          consigne: "Le commercial insiste : escomptez la facture de mars, puis trouvez la plus grosse commande, par 20 enceintes, que la ligne accepte encore.",
          atteint: (p) => {
            const q = position(p);
            return q.escompte === 1 && q.commande === x.commandeMaxAuPas;
          },
          indice: (p) => {
            const q = position(p);
            if (q.escompte !== 1) return "Escomptez d'abord la facture de mars, comme le commercial le demande.";
            const e = enCoursDeCampusTech(q);
            if (!e.accepte) return `L'en-cours, ${eur(e.enCours)}, dépasse la ligne : la créance a baissé, pas le risque. Commandez moins.`;
            return `La ligne laisse encore ${eur(e.marge)} : commandez davantage, sans la dépasser.`;
          },
          solution: { commande: x.commandeMaxAuPas, escompte: 1 },
        };
      },
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        const avec = enCoursDeCampusTech({ commande: x.commandeMaxAuPas, escompte: 1 });
        return [
          `Défi relevé : ${qte(x.commandeMaxAuPas)} enceintes, exactement ce que la ligne acceptait sans escompte. L'escompte fait baisser la créance au compte du client à ${eur(avec.auBilan)}, mais l'effet escompté, ${eur(avec.effet)}, reste dans l'en-cours : si CampusTech ne payait pas, NOVA rembourserait la banque.`,
          "L'escompte finance la créance ; il ne transfère pas le risque. Seul un factor avec garantie le ferait.",
        ];
      },
    },
    {
      id: "l-alerte",
      objectifs: [2],
      type: "choix",
      titre: "Qui faut-il signaler ?",
      notions: ["customer_portfolio", "payment_terms"],
      tableau: lesLignesDeCredit,
      question: () => "La balance âgée est faite. Quel client signalez-vous d'abord au responsable, avec une proposition ?",
      options: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          {
            texte: `${STUDIO_MERIDIEN.nom} : bloquer ses livraisons`,
            juste: true,
            retour: `Oui. Son en-cours, ${eur(x.studio.total)}, dépasse sa ligne de ${eur(x.studio.ligne)}, et il a ${jours(x.studio.retardMaximal)} de retard : la relance amiable est partie au ${RELANCES.relanceAmiable}e jour, la mise en demeure au ${RELANCES.miseEnDemeure}e, sans effet. On bloque toute nouvelle livraison, et le responsable décide d'une injonction de payer.`,
          },
          {
            texte: "Sonora : c'est la plus grosse créance échue, et à plus de 60 jours",
            juste: false,
            retour: "Elle est déjà au compte 416, déclarée au mandataire et dépréciée : il n'y a plus d'alerte à donner, seulement le jugement à attendre.",
          },
          {
            texte: "CampusTech : son en-cours est de loin le plus gros de la balance âgée",
            juste: false,
            retour: `Il est sous sa ligne, et son retard de 20 jours est connu et régulier. Un gros en-cours bien suivi n'est pas une alerte ; un petit au-delà de sa ligne, si.`,
          },
          {
            texte: `${VIBRA.nom} : sa facture n'est pas encore échue`,
            juste: false,
            retour: "Une facture non échue ne se relance pas. Vibra est sous sa ligne : rien à signaler.",
          },
        ];
      },
    },
    {
      id: "la-remise-a-l-encaissement",
      objectifs: [1],
      type: "ecriture",
      titre: "La remise à l'encaissement",
      notions: ["receivables_financing"],
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `${VIBRA.nom} a accepté le ${dateEcrite(LCR_DE_VIBRA.acceptation)} une LCR de ${eur(x.vibra.ttc)}, à échéance du ${dateEcrite(LCR_DE_VIBRA.echeance)} : elle est au compte 413. NOVA n'a pas besoin de l'escompter : le ${dateEcrite(LCR_DE_VIBRA.remise)}, elle la remet à l'encaissement, pour que la banque la présente à l'échéance.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        return {
          date: auJournal(LCR_DE_VIBRA.remise),
          libelle: "Remise à l'encaissement de la LCR de Vibra",
          lignes: [
            { role: "l'effet remis à l'encaissement", compte: "5113", sens: "debit", montant: x.vibra.ttc, indice: "le nominal de l'effet" },
            { role: "l'effet qui quitte le portefeuille", compte: "413", sens: "credit", montant: x.vibra.ttc, indice: "le même nominal" },
          ],
        };
      },
      indices: () => ["Comme pour l'escompte, l'effet quitte le portefeuille.", "Il va au compte des effets à l'encaissement, et non à l'escompte."],
      explication: () => ["À l'échéance, la banque présentera l'effet : si Vibra paie, elle créditera NOVA, et le 5113 se soldera. Aucun agio : la banque n'avance rien."],
    },
    {
      id: "l-effet-impaye",
      objectifs: [1],
      type: "ecriture",
      titre: "L'effet revient impayé",
      notions: ["receivables_financing", "payment_terms"],
      piece: (c) => {
        const x = compteClientDuChapitre(c);
        const i = x.impaye;
        return {
          nature: "Avis d'impayé",
          de: "La banque de NOVA",
          a: "NOVA",
          date: auJournal(LCR_DE_VIBRA.impaye),
          lignes: [
            { libelle: `LCR sur ${VIBRA.nom}, échue le ${dateEcrite(LCR_DE_VIBRA.echeance)} : non payée, rendue`, montant: i.nominal },
            { libelle: "Frais d'impayé, hors taxes", montant: i.frais },
            { libelle: "TVA sur les frais, 20 %", montant: i.tva },
          ],
          totaux: [{ libelle: "Débité de votre compte (frais et TVA)", montant: i.debitBanque, fort: true }],
        };
      },
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le ${dateEcrite(LCR_DE_VIBRA.impaye)}, la banque rend l'effet : ${VIBRA.nom} n'avait pas la provision. Elle débite NOVA de ses frais, ${eur(x.impaye.frais)} hors taxes, et de leur TVA, ${eur(x.impaye.tva)}. Passez l'avis d'impayé.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        const i = x.impaye;
        return {
          date: auJournal(LCR_DE_VIBRA.impaye),
          libelle: "LCR de Vibra impayée",
          lignes: [
            { role: "la créance sur Vibra, qui revient", compte: "411", sens: "debit", montant: i.nominal, indice: "le nominal de l'effet" },
            { role: "les frais d'impayé", compte: "627", sens: "debit", montant: i.frais, indice: "les frais hors taxes de l'avis" },
            { role: "la TVA déductible sur les frais", compte: "44566", sens: "debit", montant: i.tva, indice: "la TVA de l'avis" },
            { role: "l'effet à l'encaissement, qui ne sera pas payé", compte: "5113", sens: "credit", montant: i.nominal, indice: "le nominal de l'effet" },
            { role: "la banque, débitée des frais", compte: "512", sens: "credit", montant: i.debitBanque, indice: "les frais toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "L'effet ne sera pas payé : il quitte le compte des effets à l'encaissement, et Vibra redevient un client ordinaire qui doit la facture.",
        "La banque ne débite que ses frais : elle n'avait rien avancé. Ces frais sont un service bancaire, avec de la TVA déductible.",
      ],
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `Vibra doit de nouveau ${eur(x.impaye.nominal)} au compte 411, et la relance commence. Un impayé n'est pas une perte : tant que rien ne dit que Vibra ne paiera pas, la créance n'est ni douteuse ni dépréciée. Mais l'en-cours de Vibra, à présent échu, se suit de près.`,
          "Escompté, l'effet serait revenu de la même façon : la banque aurait repris son nominal sur le compte de NOVA, en plus des frais.",
        ];
      },
    },
    {
      id: "la-cession-au-factor",
      objectifs: [3],
      type: "ecriture",
      titre: "La facture cédée au factor",
      notions: ["receivables_financing"],
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le ${dateEcrite(CESSION_D_ONDES.date)}, NOVA facture à la chaîne ${x.factor.client} ${eur(x.factor.ttc)} TTC, à 60 jours, et cède aussitôt la facture au factor, comme le cas « Une chaîne nouvelle, à 60 jours » le conseillait. C'est désormais le factor que la chaîne paiera. Passez la cession.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        return {
          date: auJournal(CESSION_D_ONDES.date),
          libelle: "Facture d'Ondes cédée au factor",
          lignes: [
            { role: "la créance sur le factor", compte: "467", sens: "debit", montant: x.factor.ttc, indice: "le montant de la facture, toutes taxes comprises" },
            { role: "la créance sur Ondes, qui sort", compte: "411", sens: "credit", montant: x.factor.ttc, indice: "le même montant" },
          ],
        };
      },
      indices: () => ["La chaîne ne doit plus rien à NOVA : elle doit au factor.", "Le factor devient le débiteur de NOVA, à un compte de tiers divers."],
      explication: () => [
        "La créance change de débiteur : du client au factor. Avec la garantie, si la chaîne ne paie pas, c'est le factor qui perd : le risque est parti.",
      ],
    },
    {
      id: "le-bordereau-du-factor",
      objectifs: [3],
      type: "ecriture",
      titre: "Le bordereau du factor",
      notions: ["receivables_financing"],
      piece: (c) => {
        const x = compteClientDuChapitre(c);
        const f = x.factor;
        return {
          nature: "Bordereau d'affacturage",
          de: "Le factor",
          a: "NOVA",
          date: auJournal(CESSION_D_ONDES.date),
          lignes: [
            { libelle: `Facture ${x.factor.client} du ${dateEcrite(CESSION_D_ONDES.date)}`, montant: f.ttc },
            { libelle: "À déduire, retenue de garantie, 10 %", montant: f.retenue },
            { libelle: `À déduire, commission de financement, 7 % sur ${jours(f.jours)}`, montant: f.financement },
            { libelle: "À déduire, commission d'affacturage, 1 %", montant: f.commission },
            { libelle: "À déduire, TVA sur la commission d'affacturage", montant: f.tva },
          ],
          totaux: [{ libelle: "Viré sur votre compte", montant: f.verseAuJournal, fort: true }],
        };
      },
      evenement: (c) => {
        const x = compteClientDuChapitre(c);
        return `Le factor vire ${eur(x.factor.verseAuJournal)} : la facture moins la retenue de garantie, ses deux commissions, et la TVA de la commission d'affacturage, un service. Le chapitre « Financer et placer » comptait le coût hors taxes, ${eur(x.factor.cout)} ; la TVA, que NOVA déduit, n'y ajoute rien. Passez le bordereau : la retenue reste due par le factor.`;
      },
      ecriture: (c) => {
        const x = compteClientDuChapitre(c);
        const f = x.factor;
        return {
          date: auJournal(CESSION_D_ONDES.date),
          libelle: "Bordereau du factor, facture d'Ondes",
          lignes: [
            { role: "l'argent viré", compte: "512", sens: "debit", montant: f.verseAuJournal, indice: "le versement du bordereau" },
            { role: "la commission d'affacturage, un service", compte: "6225", acceptes: ["622"], sens: "debit", montant: f.commission, indice: "la commission d'affacturage" },
            { role: "la TVA déductible sur la commission", compte: "44566", sens: "debit", montant: f.tva, indice: "la TVA du bordereau" },
            { role: "la commission de financement, un intérêt", compte: "6616", acceptes: ["661"], sens: "debit", montant: f.financement, indice: "la commission de financement" },
            { role: "ce que le factor a réglé de sa dette", compte: "467", sens: "credit", montant: f.avance, indice: "la facture moins la retenue de garantie" },
          ],
        };
      },
      indices: () => [
        "Le factor ne solde pas toute sa dette : il garde la retenue de garantie, qui reste au débit du compte 467.",
        "Deux charges différentes : la rémunération de l'affacturage, un service, et le financement, un intérêt.",
      ],
      explication: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `Il reste ${eur(x.factor.retenue)} au débit du 467 : la retenue de garantie. Quand la chaîne aura payé le factor, le ${dateEcrite(CESSION_D_ONDES.echeance)}, il la virera à NOVA, et le compte du factor se lettrera.`,
        ];
      },
    },
    {
      id: "le-compte-rendu",
      objectifs: [2, 0],
      type: "choix",
      titre: "Le compte rendu au responsable",
      notions: ["customer_portfolio"],
      question: () => "Que met le comptable dans son compte rendu au responsable du crédit client ?",
      options: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          {
            texte: "La méthode, chaque anomalie et sa correction, puis les clients à risque",
            juste: true,
            retour: `Oui. La méthode : le lettrage sur la référence, la balance âgée au ${dateEcrite(DATE_D_ARRETE)}. Les anomalies et ce qui a été fait : le doublon de ${eur(x.doublon.montant)} annulé avec son accord, le solde de ${eur(x.reste)} attendu. L'analyse : ${STUDIO_MERIDIEN.nom} au-delà de sa ligne, l'effet de Vibra impayé. Puis une proposition : bloquer, relancer, réviser les lignes.`,
          },
          {
            texte: "La balance âgée seule : les chiffres parlent d'eux-mêmes, le responsable les lira",
            juste: false,
            retour: "Non : un tableau ne dit ni comment il a été fait, ni ce qui a été corrigé, ni ce qu'il faut décider. Le compte rendu justifie la méthode et analyse les résultats.",
          },
          {
            texte: "Les anomalies, mais corrigées sans le dire, pour ne pas inquiéter le responsable",
            juste: false,
            retour: "Non : une correction se fait après l'avis du responsable et se trace. Une écriture passée sans le dire est précisément ce qu'un contrôle interne doit empêcher.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payment_terms", "receivables_financing", "customer_portfolio"],
      texte: (c) => {
        const x = compteClientDuChapitre(c);
        return [
          `Le compte de CampusTech tombait faux de ${eur(x.lettrage.ecart)} : un virement saisi deux fois, que le lettrage par la référence a démasqué. La lettre de change de décembre est passée au journal, de l'acceptation au bordereau d'escompte, et l'effet escompté est resté un engagement hors bilan jusqu'au ${dateEcrite(LCR_DE_DECEMBRE.echeance)}.`,
          `La balance âgée a montré ${eur(auCentime(x.balance.total - x.balance.totaux["non-echu"]))} d'échu et un client au-delà de sa ligne. L'escompte ne libère pas une ligne de crédit : l'en-cours garde l'effet. Un effet impayé revient au compte 411 ; une facture cédée au factor passe au compte 467, et la retenue de garantie y attend le paiement du client.`,
          "Au niveau de l'examen, vous savez lettrer un compte client et corriger ce qu'il révèle, enregistrer les effets de commerce et l'affacturage, présenter une balance âgée, et rendre compte au responsable.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : les calculs, eux, sont les mêmes.",
        ];
      },
      repere: () =>
        "Acceptation : 413 / 411. Escompte : 5114 / 413, puis 512, 6616, 627 / 5114. Encaissement : 5113 / 413. Impayé : 411, 627, 44566 / 5113 (ou 512), 512. Affacturage : 467 / 411, puis 512, 6225, 44566, 6616 / 467.",
    },
  ],
};

/** Les clients de la balance, pour les tests. */
export const CLIENTS_DU_CHAPITRE = CLIENTS_DE_LA_BALANCE;
