import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { valeurNetteALaCloture } from "../monde/amortissement";
import { cloture as clotureDuMonde, depreciationDeCreance, impotSurLesSocietes, perteSurCreance, type CodeDeTravail } from "../monde/cloture";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_CLOTURE, balanceApresLaCloture, clotureDeNova, dateDe, ficheDe } from "./la-cloture";

/**
 * CHAPITRE : DÉPRÉCIATIONS ET PROVISIONS (comptabilité générale, palier 4 ; BTS CG, DCG UE9, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la suite de « La
 * clôture », sur le premier exercice de NOVA (monde/exercice-de-nova.ts), calculée par le modèle du
 * cours (monde/cloture.ts : `depreciationDeCreance`, `perteSurCreance`, la clôture avec ses leviers).
 * Le journal s'ouvre sur la balance que « La clôture » a laissée (ses travaux passés, sans l'impôt).
 *
 * L'objet : la prudence au 31 décembre N, puis ce que N+1 en fait. Sonora, un client en redressement
 * judiciaire : sa créance passe en douteuse et se déprécie de la perte probable, sur son hors taxes et
 * non sur ce qu'elle doit TVA comprise. Le client dont le salon a brûlé : une provision au montant
 * probable, pas à celui qu'il réclame. Le stock de composants et la ligne : examinés, et laissés tels
 * quels, chacun pour sa raison. Puis le résultat et l'impôt, la prudence chiffrée ; et N+1 : la
 * condamnation et la reprise de la provision, le liquidateur, la perte hors taxes, la TVA récupérée,
 * la reprise de la dépréciation.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, client-douteux, reclassement, montant-depreciation, litige (la règle ou les
 *     chiffres sont dans la question) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-objectif
 *     puis le-taux-de-perte (un curseur sur la perte estimée : jusqu'où l'objectif annoncé à la banque
 *     tient-il ?) avant resultat ; predire-le-liquidateur puis l-encaissement-qui-suffit (un curseur
 *     sur la part que versera le liquidateur) avant les écritures de N+1 ; puis le laboratoire des deux
 *     exercices (la perte estimée et la provision, le défi « N+1 sans charge nette », un graphique où
 *     le total des deux exercices ne bouge pas) ;
 *   · autonome : dotation-depreciation, provision, le-stock-de-composants, equipement, resultat, et
 *     les écritures de N+1 (ni formule ni chiffres à prendre ; la correction montre le chemin) ;
 *   · expert : deux-annees (le coût de chaque risque sur deux exercices), variante-vingt-pour-cent (une
 *     variante chiffrée : un liquidateur plus avare), a-rebours (retrouver le taux de perte estimé à
 *     partir de la charge nette de N+1), corriger-n (la critique : un changement d'estimation ne
 *     corrige pas l'exercice clos) ; puis la synthèse.
 *
 * Ce qui a disparu : la créance de CampusTech lue dans l'arène (174 871,16 € TVA comprise) et le litige
 * prud'homal ; Sonora et le litige du client les remplacent. La phrase « aucune entreprise du cours ne
 * finit l'année avec du stock », fausse : NOVA garde 600 jeux de composants, et le chapitre les examine.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** Les travaux du chapitre suivant (les régularisations), laissés de côté ici. */
export const TRAVAUX_DES_REGULARISATIONS: readonly CodeDeTravail[] = ["chargeConstateeDAvance", "factureAEtablir", "produitConstateDAvance"];

/**
 * LA VALEUR DE REVENTE DE LA LIGNE, hypothèse du cours : un acheteur d'occasion n'en donnerait que 40 %
 * de sa valeur nette ; la ligne sert, et ce n'est pas ce prix qui la mesure.
 */
export const PART_DE_REVENTE_DE_LA_LIGNE = 0.4;

/**
 * LE PRIX D'UN JEU DE COMPOSANTS APRÈS NOËL, hypothèse du cours : le grossiste solde ses jeux à
 * 21,50 € hors taxes, sous leur coût moyen de 22,50 €. Les enceintes qui les utiliseront se vendent,
 * elles, au-dessus de leur coût de production.
 */
export const PRIX_DU_JEU_APRES_NOEL = 21.5;

/**
 * L'OBJECTIF ANNONCÉ À LA BANQUE, hypothèse du cours : le dirigeant a promis au moins 90 000 € de
 * résultat avant impôt pour le premier exercice. Le curseur cherche jusqu'où la perte estimée le
 * laisse tenir, pour montrer que la prudence ne se règle pas sur un objectif.
 */
export const OBJECTIF_ANNONCE_A_LA_BANQUE = 90_000;

/** L'écart de perte estimée sur lequel parie l'élève avant le curseur : dix points de plus. */
export const ECART_DU_PARI = 0.1;

/** La variante d'expert : un liquidateur qui ne verse que 20 % de la créance. */
export const PART_VERSEE_VARIANTE = 0.2;

/**
 * LE CALCUL À REBOURS : un autre dénouement, où le liquidateur verse 30 % ; la charge nette de N+1 se
 * déduit d'un taux de perte estimé en N que l'élève doit retrouver (65 %, la réponse, que le texte ne
 * donne pas).
 */
export const PART_VERSEE_A_REBOURS = 0.3;
export const TAUX_ESTIME_A_REBOURS = 0.65;

/** Les bornes et le pas des leviers du laboratoire : la perte estimée en %, la provision en euros. */
export const PROVISION_DU_LABORATOIRE = { max: 12_000, pas: 500 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** Un effet sur le résultat, signé : « + 1 000 € » ou « − 2 802,50 € ». */
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

// ─────────────────────────────────────────────────────────────────────────────
// LA PRUDENCE DE NOVA
// ─────────────────────────────────────────────────────────────────────────────

/** La prudence de l'exercice, et ce que N+1 en fait : tout ce que le chapitre et son cas demandent. */
export function prudenceDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const x = clotureDeNova(c);
  const creance = f.creances.find((k) => k.litigieuse)!;
  const taux = f.sonora.redressement.tauxDePerteProbable;
  const d = depreciationDeCreance(creance.ttc, f.tauxDeTva, taux);
  const provision = f.litige.montantProbable;
  // Le résultat après la dépréciation et la provision, sans les régularisations du chapitre suivant.
  const k = clotureDuMonde(f, { travauxOublies: TRAVAUX_DES_REGULARISATIONS });
  const verse = auCentime(creance.ttc * f.suites.sonora.partEncaissee);
  const p = perteSurCreance(creance.ttc, verse, f.tauxDeTva, d.depreciation);
  const condamnation = f.suites.litige.condamnation;
  const effetDuJugement = auCentime(provision - condamnation);
  // Un point de perte estimée : 1 % de la créance hors taxes.
  const unPoint = auCentime(d.ht / 100);
  const resultatSansPrudence = x.resultatAvantImpot;
  const resultatAuTaux = (t: number) => auCentime(resultatSansPrudence - provision - unPoint * t);
  const variante = perteSurCreance(creance.ttc, auCentime(creance.ttc * PART_VERSEE_VARIANTE), f.tauxDeTva, d.depreciation);
  const rebours = perteSurCreance(creance.ttc, auCentime(creance.ttc * PART_VERSEE_A_REBOURS), f.tauxDeTva, auCentime(d.ht * TAUX_ESTIME_A_REBOURS));
  const vnc = valeurNetteALaCloture(f.immobilisation, f.equipement.mode, 0);
  return {
    f,
    x,
    creance,
    taux,
    d,
    provision,
    demande: f.litige.demande,
    resultatSansPrudence,
    impotSansPrudence: x.impot.impot,
    resultat: k.resultatAvantImpot,
    impot: k.impot,
    impotEnMoins: auCentime(x.impot.impot - k.impot.impot),
    chargesDeLaPrudence: auCentime(d.depreciation + provision),
    verse,
    p,
    condamnation,
    effetDuJugement,
    unPoint,
    resultatAuTaux,
    // Le plus grand taux estimé, en %, qui tient l'objectif annoncé à la banque.
    tauxQuiTientLObjectif: Math.floor((resultatSansPrudence - provision - OBJECTIF_ANNONCE_A_LA_BANQUE) / unPoint + 1e-9),
    // La plus petite part versée, en %, pour que la dépréciation couvre la perte hors taxes.
    partQuiSuffit: Math.ceil((d.ht - d.depreciation) / unPoint - 1e-9),
    // Sur les deux exercices.
    coutDeLaCreance: p.perteHt,
    coutDuLitige: condamnation,
    totalDesDeuxExercices: auCentime(p.perteHt + condamnation),
    chargeNetteDeN1: auCentime(p.chargeNette - effetDuJugement),
    variante,
    rebours,
    vnc,
    revente: auCentime(vnc * PART_DE_REVENTE_DE_LA_LIGNE),
    stock: { quantite: x.stock.final.quantite, coutMoyen: x.stock.coutMoyen, valeur: x.stockFinal, auPrixDuGrossiste: auCentime(x.stock.final.quantite * PRIX_DU_JEU_APRES_NOEL) },
  };
}

export type PrudenceDeNova = ReturnType<typeof prudenceDeNova>;

/** Le laboratoire des deux exercices : pour une perte estimée (en %) et une provision, ce que portent N, N+1 et les deux. */
export function laboratoireDesDeuxExercices(y: PrudenceDeNova, tauxEstime: number, provision: number) {
  const depreciation = auCentime(y.unPoint * tauxEstime);
  const chargeNetteCreance = auCentime(y.p.perteHt - depreciation);
  const effetDuJugement = auCentime(provision - y.condamnation);
  return {
    depreciation,
    provision,
    chargesDeN: auCentime(depreciation + provision),
    resultatDeN: auCentime(y.resultatSansPrudence - depreciation - provision),
    chargeNetteCreance,
    effetDuJugement,
    effetSurN1: auCentime(effetDuJugement - chargeNetteCreance),
    total: auCentime(-(depreciation + provision) + effetDuJugement - chargeNetteCreance),
  };
}

/** Le journal en ouvrant le chapitre : la balance que « La clôture » a laissée, ses travaux passés, sans l'impôt. */
function ouverture(c: Pick<Cas, "code">): Ecriture {
  return { date: "31 décembre", libelle: "Balance après les travaux de « La clôture », avant l'impôt", lignes: balanceApresLaCloture(c) };
}

/** Les créances clients au 31 décembre : le document de départ. */
function tableauDesCreances(y: PrudenceDeNova): TableauDeDonnees {
  return {
    titre: `Les créances clients de ${y.f.entreprise} au 31 décembre N`,
    colonnes: ["Hors taxes", "TVA", "TVA comprise"],
    lignes: y.f.creances.map((k) => ({
      libelle: `${k.client}, facture du ${dateDe(k.date)}${k.litigieuse ? `, échue le ${dateDe(k.echeance)} et impayée` : ""}`,
      valeurs: [eur(k.ht), eur(k.tva), eur(k.ttc)],
    })),
  };
}

/** La prudence sur deux exercices : la synthèse. */
function tableauDesDeuxExercices(y: PrudenceDeNova): TableauDeDonnees {
  return {
    titre: `Ce que la prudence de ${y.f.entreprise} pèse sur chaque exercice`,
    colonnes: ["En N", "En N+1", "Sur les deux"],
    lignes: [
      { libelle: "La créance de Sonora", valeurs: [eur(-y.d.depreciation), eur(-y.p.chargeNette), eur(-y.coutDeLaCreance)] },
      { libelle: "Le litige du client", valeurs: [eur(-y.provision), eur(y.effetDuJugement), eur(-y.coutDuLitige)] },
      { libelle: "Ensemble, effet sur le résultat", valeurs: [eur(-y.chargesDeLaPrudence), eur(-y.chargeNetteDeN1), eur(-y.totalDesDeuxExercices)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const DEPRECIATIONS_ET_PROVISIONS: Chapitre = {
  code: "depreciations-et-provisions",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Dépréciations et provisions",
  accroche:
    "Un client en redressement judiciaire, un autre qui réclame des dommages : au 31 décembre, le comptable compte les pertes probables avant les gains, et l'exercice suivant dit s'il a bien estimé.",
  objectifs: [
    "Appliquer le principe de prudence à la clôture, et en chiffrer l'effet sur le résultat et l'impôt",
    "Reclasser une créance douteuse et la déprécier sur son montant hors taxes",
    "Constituer une provision pour risque au montant probable",
    "Dire quand un stock ou une immobilisation se déprécie, et quand ils ne se déprécient pas",
    "Solder une créance irrécouvrable, récupérer la TVA, reprendre la dépréciation et la provision",
    "Mesurer ce qu'une estimation déplace d'un exercice à l'autre, et retrouver une estimation à rebours",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CLOTURE,
    pourquoi:
      "la prudence se joue sur le premier exercice de NOVA, dans la simulation du cours : le même client défaillant et le même litige, de la clôture à leur dénouement l'année suivante.",
  },
  ouverture,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La prudence",
      notions: ["income_statement", "payment_terms"],
      tableau: (c) => tableauDesCreances(prudenceDeNova(c)),
      texte: (c) => {
        const y = prudenceDeNova(c);
        const f = y.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, là où « La clôture » l'a laissée : la balance, la dotation, le stock, la facture non parvenue et les intérêts courus sont passés. Le résultat avant impôt est de ${eur(y.resultatSansPrudence)}.`,
          `Avant l'impôt, le comptable regarde ce que l'exercice laisse de risques. ${f.sonora.nom}, client depuis septembre, n'a pas réglé sa facture du ${dateDe(y.creance.date)}, échue le ${dateDe(y.creance.echeance)} ; le ${dateDe(f.sonora.redressement.date)}, le tribunal a ouvert contre lui une procédure de redressement judiciaire. En novembre, la batterie d'une enceinte a pris feu chez un particulier, qui assigne ${f.entreprise}.`,
          `La simulation suppose que le mandataire et l'avocat estiment juste au 31 décembre, avec ce qu'ils savent ; les dénouements de N+1 sont ceux de la fiche. La règle est celle de la prudence : une perte probable se compte dès qu'on la connaît, un gain seulement quand il est acquis.`,
        ];
      },
      repere: () =>
        "Une dépréciation constate qu'un actif vaut moins que sa valeur au bilan : une créance, un stock, une immobilisation. Une provision constate une dette probable, dont le montant ou l'échéance restent incertains. L'une et l'autre se mesurent à ce qui est probable, jamais à ce qu'on redoute ou qu'on espère.",
    },
    {
      id: "client-douteux",
      type: "choix",
      titre: "Un client en difficulté",
      notions: ["payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Au 31 décembre, ${y.f.sonora.nom} doit ${eur(y.creance.ttc)} à ${y.f.entreprise}, TVA comprise. Le mandataire judiciaire laisse craindre une perte de ${pct(y.taux)} de la créance. Que fait le comptable ?`;
      },
      options: () => [
        {
          texte: "Il passe la créance en clients douteux, et la déprécie de la perte probable, calculée sur son montant hors taxes",
          juste: true,
          retour:
            "C'est cela. La créance change de compte pour qu'on la suive à part, et la dépréciation constate dès cet exercice la perte probable. Hors taxes : si la perte se confirme, l'État rendra la TVA de la part perdue ; elle n'est pas une perte pour l'entreprise.",
        },
        {
          texte: "Rien pour l'instant : la perte n'est pas sûre, on la passera quand le tribunal aura statué",
          juste: false,
          retour: "La prudence demande l'inverse : une perte probable se compte dès qu'on la connaît. Attendre, c'est présenter un résultat trop beau cette année.",
        },
        {
          texte: "Il passe toute la créance en perte, puisque le client ne paiera sans doute pas",
          juste: false,
          retour: "La perte n'est ni sûre ni totale : le mandataire laisse espérer une partie. On déprécie la perte probable ; la perte définitive viendra à la fin de la procédure.",
        },
      ],
    },
    {
      id: "reclassement",
      type: "ecriture",
      titre: "La créance devient douteuse",
      notions: ["payment_terms"],
      evenement: (c) => {
        const y = prudenceDeNova(c);
        return `Passez la créance de ${y.f.sonora.nom}, ${eur(y.creance.ttc)}, en clients douteux.`;
      },
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: "31 décembre",
          libelle: `Créance douteuse, ${y.f.sonora.nom}`,
          lignes: [
            { role: "la créance douteuse", compte: "416", sens: "debit", montant: y.creance.ttc, indice: "la créance entière, TVA comprise" },
            { role: "la créance qui quitte le compte clients", compte: "411", sens: "credit", montant: y.creance.ttc, indice: "la créance entière, TVA comprise" },
          ],
        };
      },
      indices: () => [
        "Un compte de clients vers un autre : rien ne change dans le résultat.",
        "Au débit, les clients douteux ou litigieux (416) ; au crédit, le compte clients (411). Le montant : toute la créance, TVA comprise.",
      ],
      explication: (c) => [
        `${prudenceDeNova(c).f.entreprise} n'a rien perdu en passant cette écriture : la créance est la même, rangée à part pour qu'on la suive jusqu'à la fin de la procédure.`,
      ],
    },
    {
      id: "montant-depreciation",
      type: "montants",
      titre: "Le montant de la dépréciation",
      notions: ["payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `La créance est de ${eur(y.creance.ttc)} TVA comprise, avec une TVA à ${pct(y.f.tauxDeTva)}. La perte probable est de ${pct(y.taux)}. Calculez la créance hors taxes, la TVA qu'elle contient, puis la dépréciation, sur le hors taxes.`;
      },
      champs: (c) => {
        const y = prudenceDeNova(c);
        return [
          { libelle: "Créance hors taxes", attendu: y.d.ht, calcul: `${eur(y.creance.ttc)} ÷ ${qte(1 + y.f.tauxDeTva)} = ${eur(y.d.ht)}` },
          { libelle: "TVA contenue dans la créance", attendu: y.d.tva, calcul: `${eur(y.creance.ttc)} − ${eur(y.d.ht)} = ${eur(y.d.tva)}` },
          { libelle: "Dépréciation", attendu: y.d.depreciation, calcul: `${eur(y.d.ht)} × ${pct(y.taux)} = ${eur(y.d.depreciation)}` },
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `La TVA de la créance, ${eur(y.d.tva)}, a été versée à l'État quand la vente a été facturée. Si le client ne paie pas, l'État la rend sur la part perdue : la dépréciation ne porte que sur le hors taxes. Sur la créance TVA comprise, elle aurait été de ${eur(auCentime(y.creance.ttc * y.taux))}, ${eur(auCentime(y.creance.ttc * y.taux - y.d.depreciation))} de trop.`,
        ];
      },
    },
    {
      id: "dotation-depreciation",
      type: "ecriture",
      titre: "La dépréciation, au journal",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => `Passez la dépréciation de la créance de ${prudenceDeNova(c).f.sonora.nom}.`,
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: "31 décembre",
          libelle: `Dépréciation de la créance de ${y.f.sonora.nom}`,
          lignes: [
            { role: "la charge de l'exercice, la dotation aux dépréciations", compte: "6817", acceptes: ["681"], sens: "debit", montant: y.d.depreciation, indice: "la dépréciation calculée" },
            { role: "la dépréciation de la créance", compte: "491", sens: "credit", montant: y.d.depreciation, indice: "la dépréciation calculée" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : une dotation, comme pour les amortissements, mais aux dépréciations des actifs circulants (6817).",
        "Au crédit, le compte qui se soustrait de la créance au bilan : les dépréciations des comptes de clients (491).",
      ],
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `Au bilan, la créance garde sa valeur d'origine, ${eur(y.creance.ttc)}, et la dépréciation s'en soustrait : elle vaut ${eur(y.d.valeurNette)} net. Au compte de résultat, ${eur(y.d.depreciation)} de charges en plus, et pas un euro de sorti.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "litige",
      type: "choix",
      titre: "Le salon qui a brûlé",
      notions: ["income_statement"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Le particulier dont le salon a brûlé réclame ${eur(y.demande)} à ${y.f.entreprise}. Son avocat juge probable une condamnation à ${eur(y.provision)}. Que constate le comptable au 31 décembre ?`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        return [
          {
            texte: `Une provision pour litige de ${eur(y.provision)} : le montant probable`,
            juste: true,
            retour: "C'est cela. La dette est probable, son montant incertain : c'est une provision. Elle se mesure à ce que l'entreprise risque vraiment, selon son avocat, pas à ce que l'adversaire demande.",
          },
          {
            texte: `Une provision de ${eur(y.demande)} : ce que le client réclame`,
            juste: false,
            retour: "La demande d'un adversaire n'est pas une estimation. La provision se mesure à la sortie d'argent probable : ici, celle que juge l'avocat.",
          },
          {
            texte: "Rien : tant que le jugement n'est pas rendu, l'entreprise ne doit rien",
            juste: false,
            retour: "La prudence demande de constater une dette probable dès qu'on la connaît, même si son montant n'est pas encore fixé. C'est l'objet même d'une provision.",
          },
        ];
      },
    },
    {
      id: "provision",
      type: "ecriture",
      titre: "La provision, au journal",
      notions: ["income_statement"],
      evenement: () => "Passez la provision pour litige au montant probable.",
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: "31 décembre",
          libelle: "Provision pour litige, le salon du client",
          lignes: [
            { role: "la charge de l'exercice, la dotation aux provisions", compte: "6815", acceptes: ["681"], sens: "debit", montant: y.provision, indice: "le montant probable" },
            { role: "la provision pour litige", compte: "1511", acceptes: ["151"], sens: "credit", montant: y.provision, indice: "le montant probable" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : une dotation aux provisions d'exploitation (6815).",
        "Au crédit, une dette dont le montant reste incertain : les provisions pour litiges (1511). Elle se range au passif, entre les capitaux propres et les dettes.",
      ],
      explication: (c) => [
        `L'exercice porte la charge du litige qu'il a fait naître, même si ${prudenceDeNova(c).f.entreprise} ne paiera, s'il le faut, qu'après le jugement.`,
      ],
      vue: "resultat",
    },
    {
      id: "le-stock-de-composants",
      type: "choix",
      titre: "Et le stock de composants ?",
      notions: ["stock"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Au 31 décembre, ${qte(y.stock.quantite)} jeux de composants sont en stock pour ${eur(y.stock.valeur)}, à ${eur(y.stock.coutMoyen)} le jeu. Après Noël, le grossiste les solde à ${eur(PRIX_DU_JEU_APRES_NOEL)}. Les enceintes qui les utiliseront se vendent ${eur(y.f.prixDeLEnceinte)} hors taxes, au-dessus de leur coût de production. Faut-il déprécier le stock ?`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        return [
          {
            texte: "Non : ces jeux entreront dans des enceintes vendues au-dessus de leur coût",
            juste: true,
            retour: `C'est cela. Une matière première vaut ce qu'elle rapportera une fois fabriquée : tant que les produits où elle entre se vendent au moins à leur coût, elle ne se déprécie pas, même si son prix d'achat a baissé. Une marchandise revendue telle quelle, elle, se déprécierait dès que ce qu'on en tirera tombe sous son coût.`,
          },
          {
            texte: `Oui, de ${eur(auCentime(y.stock.valeur - y.stock.auPrixDuGrossiste))} : les jeux valent ${eur(PRIX_DU_JEU_APRES_NOEL)} chez le grossiste`,
            juste: false,
            retour: `Ce serait juste pour une marchandise revendue en l'état. ${y.f.entreprise} ne revend pas ses jeux : elle les monte dans des enceintes, qui rapporteront plus que leur coût. Le prix du grossiste ne mesure pas ce que le stock vaut pour elle.`,
          },
          {
            texte: "Non : un stock ne se déprécie jamais, il se consomme",
            juste: false,
            retour: "Un stock se déprécie quand ce qu'on en tirera tombe sous son coût : une collection démodée, des produits proches de leur date, des composants d'un produit vendu à perte. Ici, la comparaison ne donne rien à déprécier.",
          },
        ];
      },
    },
    {
      id: "equipement",
      type: "choix",
      titre: "Et la ligne de montage ?",
      notions: ["depreciation"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Au 31 décembre, la ligne de montage vaut ${eur(y.vnc)} au bilan, après sa première dotation. Revendue d'occasion, elle n'en rapporterait que ${pct(PART_DE_REVENTE_DE_LA_LIGNE)}, ${eur(y.revente)}. Faut-il la déprécier ?`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        return [
          {
            texte: "Non : l'entreprise s'en sert, et ce qu'elle lui rapporte en servant dépasse sa valeur au bilan",
            juste: true,
            retour:
              "C'est cela. La valeur actuelle d'une immobilisation est la plus grande de deux : sa valeur de revente, et sa valeur d'usage, ce qu'elle rapportera à l'entreprise qui la garde. On ne déprécie que si cette valeur actuelle tombe sous la valeur nette comptable. Une ligne qui fait tourner toute l'activité vaut plus que son prix d'occasion.",
          },
          {
            texte: `Oui, de ${eur(auCentime(y.vnc - y.revente))} : la différence entre sa valeur au bilan et son prix de revente`,
            juste: false,
            retour:
              "Ce serait juste si l'entreprise allait la revendre. Elle la garde : c'est sa valeur d'usage qui compte, et elle dépasse la valeur au bilan tant que la ligne sert. La perte de revente se constatera, dans le résultat de la cession, le jour où elle sera vendue.",
          },
          {
            texte: "Non : une immobilisation ne se déprécie jamais, elle s'amortit",
            juste: false,
            retour:
              "Une immobilisation peut se déprécier en plus de son amortissement : une machine abîmée, un fonds de commerce dont la clientèle part. On compare alors sa valeur actuelle à sa valeur nette comptable. Ici, la comparaison ne donne rien à déprécier.",
          },
        ];
      },
    },
    {
      id: "predire-l-objectif",
      type: "choix",
      titre: "Pariez sur l'estimation",
      notions: ["payment_terms", "income_statement"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Le dirigeant a annoncé à la banque au moins ${eur(OBJECTIF_ANNONCE_A_LA_BANQUE)} de résultat avant impôt. Pariez : si le mandataire avait craint ${pct(y.taux + ECART_DU_PARI)} de perte au lieu de ${pct(y.taux)}, le résultat avant impôt aurait baissé de…`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        const voir = "Faites glisser la perte estimée à l'étape suivante : le résultat la suit, point par point.";
        return [
          { texte: `${eur(auCentime(y.d.ht * ECART_DU_PARI))} : ${pct(ECART_DU_PARI)} de la créance hors taxes`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${eur(auCentime(y.creance.ttc * ECART_DU_PARI))} : ${pct(ECART_DU_PARI)} de la créance TVA comprise`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien : la dépréciation de l'exercice est déjà passée", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-de-perte",
      type: "curseur",
      titre: "Jusqu'où l'objectif tient",
      notions: ["payment_terms", "income_statement"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Faites varier la perte estimée sur la créance de ${y.f.sonora.nom}, en % de son hors taxes ; la provision reste de ${eur(y.provision)}. Une droite donne le résultat avant impôt, l'autre l'objectif annoncé à la banque. Placez le curseur sur la plus forte perte estimée qui tient encore l'objectif, puis validez.`;
      },
      grandeur: () => ({ libelle: "Perte estimée sur la créance", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prudenceDeNova(c).tauxQuiTientLObjectif, min: 0, max: 100 }),
      zones: ["Objectif tenu", "Objectif manqué"],
      rates: () => ({
        dessous: "L'objectif tient encore à une perte plus forte : cherchez la plus forte.",
        dessus: "À cette perte estimée, le résultat passe sous l'objectif annoncé.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, t) => {
        const y = prudenceDeNova(c);
        const r = y.resultatAuTaux(t);
        return [
          { libelle: "Dépréciation de la créance", montant: auCentime(y.unPoint * t) },
          { libelle: "Résultat avant impôt", montant: r, fort: true },
          { libelle: "Écart à l'objectif", montant: auCentime(r - OBJECTIF_ANNONCE_A_LA_BANQUE) },
          { libelle: "Impôt sur les sociétés", montant: impotSurLesSocietes(r, y.f.impot).impot },
        ];
      },
      droites: (c) => {
        const y = prudenceDeNova(c);
        return {
          produit: (t) => y.resultatSansPrudence - y.provision - y.unPoint * t,
          cout: () => OBJECTIF_ANNONCE_A_LA_BANQUE,
          libelles: ["Résultat avant impôt", "Objectif annoncé à la banque"],
        };
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `L'objectif tient jusqu'à ${qte(y.tauxQuiTientLObjectif)} % de perte estimée ; au taux du mandataire, ${pct(y.taux)}, il reste ${eur(auCentime(y.resultat - OBJECTIF_ANNONCE_A_LA_BANQUE))} de marge. Chaque point de perte estimée coûte ${eur(y.unPoint)} de résultat : 1 % de la créance hors taxes.`,
          "Mais le taux ne se choisit pas pour tenir un objectif : c'est l'estimation la plus probable au 31 décembre, celle du mandataire. Le baisser pour tenir la promesse faite à la banque, ce serait présenter des comptes qui ne disent pas vrai ; et la perte reviendrait l'année suivante, le laboratoire le montrera.",
        ];
      },
    },
    {
      id: "resultat",
      type: "montants",
      titre: "La prudence, chiffrée",
      notions: ["income_statement"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Chiffrez la prudence. Calculez le résultat avant impôt après la dépréciation et la provision, l'impôt au barème (${pct(y.f.impot.tauxReduit)} jusqu'à ${eur(y.f.impot.plafondDuTauxReduit)}, ${pct(y.f.impot.tauxNormal)} au-delà, arrondi à l'euro), puis l'impôt en moins par rapport à celui de « La clôture ».`;
      },
      champs: (c) => {
        const y = prudenceDeNova(c);
        return [
          { libelle: "Résultat avant impôt", attendu: y.resultat, calcul: `${eur(y.resultatSansPrudence)} − ${eur(y.d.depreciation)} − ${eur(y.provision)} = ${eur(y.resultat)}` },
          {
            libelle: "Impôt sur les sociétés",
            attendu: y.impot.impot,
            calcul: `${eur(y.impot.aTauxReduit)} + (${eur(y.resultat)} − ${eur(y.f.impot.plafondDuTauxReduit)}) × ${pct(y.f.impot.tauxNormal)} = ${eur(y.impot.exact)}, arrondi à ${eur(y.impot.impot)}`,
          },
          { libelle: "Impôt en moins", attendu: y.impotEnMoins, calcul: `${eur(y.impotSansPrudence)} − ${eur(y.impot.impot)} = ${eur(y.impotEnMoins)}` },
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `La prudence coûte ${eur(y.chargesDeLaPrudence)} de résultat avant impôt, mais ${eur(auCentime(y.chargesDeLaPrudence - y.impotEnMoins))} seulement après impôt : une dépréciation et une provision justifiées sont des charges déductibles, au taux marginal de ${pct(y.f.impot.tauxNormal)}.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "predire-le-liquidateur",
      type: "choix",
      titre: "Pariez sur le liquidateur",
      notions: ["payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `L'an prochain, le liquidateur de ${y.f.sonora.nom} versera une part de la créance, et le reste sera perdu. Pariez : pour que la dépréciation de ${eur(y.d.depreciation)} suffise, sans charge de plus en N+1, il devra verser au moins…`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        const voir = "Faites glisser la part versée à l'étape suivante.";
        return [
          { texte: `${pct(1 - y.taux)} de la créance : le complément de la perte estimée`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${pct(y.taux)} de la créance : le taux du mandataire`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien : la dépréciation couvre la perte, quelle qu'elle soit", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-encaissement-qui-suffit",
      type: "curseur",
      titre: "Ce que le liquidateur doit verser",
      notions: ["payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Faites varier la part de la créance que versera le liquidateur, en %. Une droite donne la dépréciation déjà constatée, l'autre la perte hors taxes qu'il restera. Placez le curseur sur la plus petite part versée où la dépréciation de ${eur(y.d.depreciation)} couvre la perte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Part versée par le liquidateur", unite: "%" }),
      cible: (c) => ({ attendu: prudenceDeNova(c).partQuiSuffit, min: 0, max: 100 }),
      zones: ["La dépréciation couvre la perte", "N+1 porte une charge"],
      rates: () => ({
        dessous: "À cette part versée, la perte dépasse la dépréciation : N+1 porterait le reste.",
        dessus: "Avec moins, la dépréciation couvre encore la perte : cherchez la plus petite part.",
      }),
      montrer: "Montrer la part",
      lecture: (c, e) => {
        const y = prudenceDeNova(c);
        const perte = auCentime(y.d.ht - y.unPoint * e);
        return [
          { libelle: "Ce que verse le liquidateur", montant: auCentime((y.creance.ttc * e) / 100) },
          { libelle: "Perte hors taxes", montant: perte },
          { libelle: "Reprise de la dépréciation", montant: y.d.depreciation },
          { libelle: "Charge nette de N+1", montant: auCentime(perte - y.d.depreciation), fort: true },
        ];
      },
      droites: (c) => {
        const y = prudenceDeNova(c);
        return {
          produit: () => y.d.depreciation,
          cout: (e) => y.d.ht - y.unPoint * e,
          libelles: ["Dépréciation constatée en N", "Perte hors taxes en N+1"],
        };
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `Il faut que le liquidateur verse au moins ${qte(y.partQuiSuffit)} % : la perte estimée était de ${pct(y.taux)}, et c'est le seul dénouement que la dépréciation couvre sans reste. En dessous, N+1 porte l'écart entre la perte réelle et la perte estimée ; au-dessus, il en reprend une part en produit.`,
          `L'étape suivante dit ce que le liquidateur a vraiment versé.`,
        ];
      },
    },
    {
      id: "annee-suivante",
      type: "lecture",
      titre: "L'année suivante",
      notions: ["payment_terms"],
      texte: (c) => {
        const y = prudenceDeNova(c);
        const s = y.f.suites;
        return [
          `Le ${dateDe(s.litige.date)}, le tribunal condamne ${y.f.entreprise} à verser ${eur(y.condamnation)} au particulier : moins que la provision de ${eur(y.provision)}.`,
          `Le ${dateDe(s.sonora.date)}, le redressement de ${y.f.sonora.nom} se termine en liquidation. Le liquidateur verse ${pct(s.sonora.partEncaissee)} de la créance, ${eur(y.verse)} ; le reste, ${eur(y.p.perteTtc)} TVA comprise, ne sera jamais payé. Le mandataire craignait ${pct(y.taux)} de perte : elle est de ${pct(1 - s.sonora.partEncaissee)}.`,
          "Une estimation reste une estimation : les écritures qui suivent dénouent le litige, soldent la créance et reprennent ce qui n'a plus d'objet.",
        ];
      },
      repere: () => "Une dépréciation ou une provision ne s'oublie pas : quand le risque se dénoue, la charge réelle se constate, et la dépréciation ou la provision se reprend en produit, pour son montant entier.",
    },
    {
      id: "la-condamnation",
      type: "ecriture",
      titre: "La condamnation",
      notions: ["income_statement"],
      evenement: (c) => {
        const y = prudenceDeNova(c);
        return `Le ${dateDe(y.f.suites.litige.date)}, ${y.f.entreprise} verse au particulier les ${eur(y.condamnation)} du jugement, par la banque. Passez le paiement.`;
      },
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: dateDe(y.f.suites.litige.date),
          libelle: "Condamnation, le salon du client",
          lignes: [
            { role: "la charge du litige", compte: "658", acceptes: ["6588"], sens: "debit", montant: y.condamnation, indice: "ce que le jugement fait payer" },
            { role: "l'argent versé", compte: "512", sens: "credit", montant: y.condamnation, indice: "ce que le jugement fait payer" },
          ],
        };
      },
      indices: () => [
        "Au crédit, la banque.",
        "Au débit, une charge de gestion courante : les charges diverses de gestion courante (658). La provision, elle, ne se touche pas dans cette écriture.",
      ],
      explication: (c) => [`${eur(prudenceDeNova(c).condamnation)} de charges en N+1, et autant de sortis de la banque. Reste à reprendre la provision, qui n'a plus d'objet.`],
    },
    {
      id: "reprise-de-la-provision",
      type: "ecriture",
      titre: "La reprise de la provision",
      notions: ["income_statement"],
      evenement: (c) => `Le litige est jugé : la provision de ${eur(prudenceDeNova(c).provision)} n'a plus d'objet. Reprenez-la.`,
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: dateDe(y.f.suites.litige.date),
          libelle: "Reprise de la provision pour litige",
          lignes: [
            { role: "la provision qui disparaît", compte: "1511", acceptes: ["151"], sens: "debit", montant: y.provision, indice: "la provision du 31 décembre" },
            { role: "le produit de la reprise", compte: "7815", acceptes: ["781"], sens: "credit", montant: y.provision, indice: "la provision du 31 décembre" },
          ],
        };
      },
      indices: () => ["L'écriture inverse de la dotation, pour son montant entier.", "Au crédit, un produit : les reprises sur provisions d'exploitation (7815)."],
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `N+1 porte la condamnation, ${eur(y.condamnation)}, et la reprise, ${eur(y.provision)} : ${signe(y.effetDuJugement)} sur son résultat. L'avocat avait vu un peu large, et N+1 rend l'écart ; sur les deux exercices, le litige coûte ce qu'il a coûté, ${eur(y.coutDuLitige)}.`,
        ];
      },
    },
    {
      id: "encaissement",
      type: "ecriture",
      titre: "Ce que le liquidateur verse",
      notions: ["payment_terms"],
      evenement: (c) => {
        const y = prudenceDeNova(c);
        return `Le ${dateDe(y.f.suites.sonora.date)}, la banque reçoit ${eur(y.verse)} du liquidateur de ${y.f.sonora.nom}. Passez l'encaissement.`;
      },
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: dateDe(y.f.suites.sonora.date),
          libelle: `Règlement du liquidateur, ${y.f.sonora.nom}`,
          lignes: [
            { role: "l'argent reçu", compte: "512", sens: "debit", montant: y.verse, indice: "ce que verse le liquidateur" },
            { role: "la créance douteuse, en partie réglée", compte: "416", sens: "credit", montant: y.verse, indice: "ce que verse le liquidateur" },
          ],
        };
      },
      indices: () => ["La banque au débit.", "Au crédit, la créance douteuse : c'est elle que le liquidateur règle, pas le compte clients."],
      explication: (c) => [`Il reste ${eur(prudenceDeNova(c).p.perteTtc)} au compte 416, que personne ne paiera.`],
    },
    {
      id: "perte",
      type: "ecriture",
      titre: "La part perdue",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const y = prudenceDeNova(c);
        return `Le liquidateur certifie que les ${eur(y.p.perteTtc)} restants sont irrécouvrables. Soldez la créance : la perte se passe hors taxes, et l'État rend la TVA qu'elle contient.`;
      },
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: dateDe(y.f.suites.sonora.date),
          libelle: `Créance irrécouvrable, ${y.f.sonora.nom}`,
          lignes: [
            { role: "la perte sur créance irrécouvrable", compte: "654", sens: "debit", montant: y.p.perteHt, indice: "la part perdue, hors taxes" },
            { role: "la TVA récupérée sur la part perdue", compte: "44571", sens: "debit", montant: y.p.tvaRecuperee, indice: "la TVA contenue dans la part perdue" },
            { role: "la créance douteuse, soldée", compte: "416", sens: "credit", montant: y.p.perteTtc, indice: "ce qui reste au compte 416" },
          ],
        };
      },
      indices: (c) => {
        const y = prudenceDeNova(c);
        return [
          `Au crédit, le reste de la créance douteuse, TVA comprise.`,
          `Au débit, deux lignes : la perte hors taxes (654), et la TVA de cette part, qui vient en moins de la TVA collectée (44571). Le hors taxes : le reste ÷ ${qte(1 + y.f.tauxDeTva)}.`,
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `${eur(y.p.perteTtc)} perdus TVA comprise, mais ${eur(y.p.perteHt)} seulement pour ${y.f.entreprise} : les ${eur(y.p.tvaRecuperee)} de TVA, versés à l'État sur une vente jamais payée, s'imputent sur la prochaine déclaration.`,
        ];
      },
    },
    {
      id: "reprise",
      type: "ecriture",
      titre: "La reprise de la dépréciation",
      notions: ["payment_terms", "income_statement"],
      evenement: (c) => `La créance est soldée : la dépréciation de ${eur(prudenceDeNova(c).d.depreciation)} n'a plus d'objet. Reprenez-la.`,
      ecriture: (c) => {
        const y = prudenceDeNova(c);
        return {
          date: dateDe(y.f.suites.sonora.date),
          libelle: `Reprise de la dépréciation, ${y.f.sonora.nom}`,
          lignes: [
            { role: "la dépréciation qui disparaît", compte: "491", sens: "debit", montant: y.d.depreciation, indice: "la dépréciation du 31 décembre" },
            { role: "le produit de la reprise", compte: "7817", acceptes: ["781"], sens: "credit", montant: y.d.depreciation, indice: "la dépréciation du 31 décembre" },
          ],
        };
      },
      indices: () => ["L'écriture inverse de la dotation, pour son montant entier.", "Au crédit, un produit : les reprises sur dépréciations des actifs circulants (7817)."],
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `N+1 porte la perte, ${eur(y.p.perteHt)}, et la reprise, ${eur(y.d.depreciation)} : ${eur(y.p.chargeNette)} de charge nette, l'écart entre la perte réelle et la perte estimée. Le reste de la perte, l'exercice du redressement l'avait déjà porté.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-deux-exercices",
      type: "simulation",
      titre: "Le laboratoire des deux exercices",
      notions: ["payment_terms", "income_statement"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Les dénouements sont connus : le liquidateur a versé ${pct(y.f.suites.sonora.partEncaissee)}, le jugement a coûté ${eur(y.condamnation)}. Revenez au 31 décembre N, et refaites les deux estimations : la perte sur la créance de ${y.f.sonora.nom}, la provision pour le litige. Le tableau suit ce que chaque exercice porte, en effet sur son résultat ; le graphique, ce que bouge la perte estimée.`;
      },
      leviers: (c) => {
        const y = prudenceDeNova(c);
        return [
          { code: "taux", libelle: "Perte estimée sur la créance", unite: "%", min: 0, max: 100, pas: 1, depart: Math.round(y.taux * 100) },
          { code: "provision", libelle: "Provision pour le litige", unite: "€", min: 0, max: PROVISION_DU_LABORATOIRE.max, pas: PROVISION_DU_LABORATOIRE.pas, depart: y.provision },
        ];
      },
      lecture: (c, p) => {
        const y = prudenceDeNova(c);
        const l = laboratoireDesDeuxExercices(y, p.taux!, p.provision!);
        const d = laboratoireDesDeuxExercices(y, Math.round(y.taux * 100), y.provision);
        return [
          { libelle: "Dépréciation de la créance, en N", montant: -l.depreciation, reference: -d.depreciation, effet: true },
          { libelle: "Provision pour le litige, en N", montant: -l.provision, reference: -d.provision, effet: true },
          { libelle: "Résultat avant impôt de N", montant: l.resultatDeN, reference: d.resultatDeN },
          { libelle: "Charge nette de N+1 sur la créance", montant: -l.chargeNetteCreance, reference: -d.chargeNetteCreance, effet: true },
          { libelle: "Effet du jugement sur N+1", montant: l.effetDuJugement, reference: d.effetDuJugement, effet: true },
          { libelle: "Total sur les deux exercices", montant: l.total, reference: d.total, effet: true, fort: true },
        ].map((x) => ({ ...x, montant: x.montant + 0, reference: x.reference + 0 }));
      },
      // Ce que la perte estimée déplace : la charge de N monte, celle de N+1 descend, et leur total ne bouge pas.
      graphique: (c) => {
        const y = prudenceDeNova(c);
        return {
          levier: "taux",
          courbes: [
            { libelle: "Ce que porte N", valeur: (p) => -laboratoireDesDeuxExercices(y, p.taux!, p.provision!).chargesDeN + 0 },
            { libelle: "Ce que porte N+1", valeur: (p) => laboratoireDesDeuxExercices(y, p.taux!, p.provision!).effetSurN1 + 0 },
            { libelle: "Les deux exercices", valeur: (p) => laboratoireDesDeuxExercices(y, p.taux!, p.provision!).total + 0 },
          ],
        };
      },
      defi: (c) => {
        const y = prudenceDeNova(c);
        return {
          consigne: "Réglez les deux estimations pour que N+1 ne porte rien : ni charge nette ni produit net, sur la créance comme sur le litige.",
          atteint: (p) => {
            const l = laboratoireDesDeuxExercices(y, p.taux!, p.provision!);
            return l.chargeNetteCreance === 0 && l.effetDuJugement === 0;
          },
          indice: (p) => {
            const l = laboratoireDesDeuxExercices(y, p.taux!, p.provision!);
            if (l.chargeNetteCreance !== 0)
              return l.chargeNetteCreance > 0
                ? `N+1 porte encore ${eur(l.chargeNetteCreance)} sur la créance : la perte estimée est sous la perte réelle.`
                : `N+1 reprend ${eur(-l.chargeNetteCreance)} sur la créance : la perte estimée dépasse la perte réelle.`;
            return l.effetDuJugement > 0
              ? `N+1 reprend ${eur(l.effetDuJugement)} sur le litige : la provision dépasse la condamnation.`
              : `N+1 porte encore ${eur(-l.effetDuJugement)} sur le litige : la provision est sous la condamnation.`;
          },
          solution: { taux: Math.round((1 - y.f.suites.sonora.partEncaissee) * 100), provision: y.condamnation },
        };
      },
      explication: (c, p) => {
        const y = prudenceDeNova(c);
        const l = laboratoireDesDeuxExercices(y, p.taux!, p.provision!);
        return [
          `Avec des estimations justes, ${qte(p.taux!)} % et ${eur(p.provision!)}, N porte toute la charge, ${eur(l.chargesDeN)}, et N+1 rien. Mais déplacez les leviers : le total des deux exercices reste ${eur(-l.total)}, la perte hors taxes de la créance et la condamnation, quelle que soit l'estimation.`,
          "La prudence ne crée ni n'efface une charge : elle la place dans l'exercice où le risque est né. Une estimation trop faible flatte N et charge N+1 ; une estimation trop forte fait l'inverse. Sur le graphique, les deux premières courbes se croisent en miroir, et la troisième est plate.",
        ];
      },
    },
    {
      id: "deux-annees",
      type: "montants",
      titre: "Ce que chaque risque a coûté",
      notions: ["income_statement"],
      question: () =>
        "Sur les deux exercices, combien la créance perdue a-t-elle coûté au résultat, et quelle part en porte N+1 ? Et le litige : quel effet sur N+1, et quel coût sur les deux exercices ? Un produit net se donne positif.",
      champs: (c) => {
        const y = prudenceDeNova(c);
        return [
          {
            libelle: "Coût de la créance sur les deux exercices",
            attendu: y.coutDeLaCreance,
            calcul: `${eur(y.d.depreciation)} de dotation + ${eur(y.p.perteHt)} de perte − ${eur(y.d.depreciation)} de reprise = ${eur(y.coutDeLaCreance)}, la perte hors taxes`,
          },
          { libelle: "Charge nette de N+1 sur la créance", attendu: y.p.chargeNette, calcul: `${eur(y.p.perteHt)} − ${eur(y.d.depreciation)} = ${eur(y.p.chargeNette)}` },
          { libelle: "Effet du litige sur N+1", attendu: y.effetDuJugement, calcul: `${eur(y.provision)} de reprise − ${eur(y.condamnation)} de condamnation = ${eur(y.effetDuJugement)}, un produit net` },
          { libelle: "Coût du litige sur les deux exercices", attendu: y.coutDuLitige, calcul: `${eur(y.provision)} de dotation − ${eur(y.effetDuJugement)} rendus en N+1 = ${eur(y.coutDuLitige)}, la condamnation` },
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `Au bout du compte, chaque risque coûte ce qu'il a coûté : ${eur(y.coutDeLaCreance)} pour la créance, ${eur(y.coutDuLitige)} pour le litige. Les estimations n'ont fait que répartir ces charges : N en a porté ${eur(y.chargesDeLaPrudence)}, N+1 l'écart, ${signe(-y.chargeNetteDeN1)} sur son résultat.`,
        ];
      },
    },
    {
      id: "variante-vingt-pour-cent",
      type: "montants",
      titre: "Variante : un liquidateur plus avare",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Variante : le liquidateur de ${y.f.sonora.nom} ne verse que ${pct(PART_VERSEE_VARIANTE)} de la créance, et la dépréciation de N reste de ${eur(y.d.depreciation)}. Calculez la perte TVA comprise, la perte hors taxes, la TVA récupérée, puis la charge nette de N+1.`;
      },
      champs: (c) => {
        const y = prudenceDeNova(c);
        const v = y.variante;
        return [
          { libelle: "Perte toutes taxes comprises", attendu: v.perteTtc, calcul: `${eur(y.creance.ttc)} − ${eur(v.encaisse)} versés = ${eur(v.perteTtc)}` },
          { libelle: "Perte hors taxes", attendu: v.perteHt, calcul: `${eur(v.perteTtc)} ÷ ${qte(1 + y.f.tauxDeTva)} = ${eur(v.perteHt)}` },
          { libelle: "TVA récupérée", attendu: v.tvaRecuperee, calcul: `${eur(v.perteTtc)} − ${eur(v.perteHt)} = ${eur(v.tvaRecuperee)}` },
          { libelle: "Charge nette de N+1", attendu: v.chargeNette, calcul: `${eur(v.perteHt)} − ${eur(y.d.depreciation)} de reprise = ${eur(v.chargeNette)}` },
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        const v = y.variante;
        return [
          `Avec ${pct(PART_VERSEE_VARIANTE)} versés, N+1 porterait ${eur(v.chargeNette)} : la dépréciation n'avait vu que ${eur(y.d.depreciation)} d'une perte hors taxes de ${eur(v.perteHt)}. Le coût total, ${eur(v.perteHt)}, reste la perte hors taxes ; seule sa répartition change.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver l'estimation à rebours",
      notions: ["payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Un autre dénouement : le liquidateur verse ${pct(PART_VERSEE_A_REBOURS)} de la créance, et N+1 porte une charge nette de ${eur(y.rebours.chargeNette)} sur elle. Retrouvez la perte hors taxes, la dépréciation qu'avait constatée N, puis la perte estimée en N, en % du hors taxes.`;
      },
      champs: (c) => {
        const y = prudenceDeNova(c);
        const r = y.rebours;
        return [
          {
            libelle: "Perte hors taxes",
            attendu: r.perteHt,
            calcul: `(${eur(y.creance.ttc)} − ${eur(r.encaisse)}) ÷ ${qte(1 + y.f.tauxDeTva)} = ${eur(r.perteTtc)} ÷ ${qte(1 + y.f.tauxDeTva)} = ${eur(r.perteHt)}`,
          },
          { libelle: "Dépréciation constatée en N", attendu: r.reprise, calcul: `${eur(r.perteHt)} − ${eur(r.chargeNette)} de charge nette = ${eur(r.reprise)}, ce que la reprise a rendu` },
          { libelle: "Perte estimée en N, en %", attendu: Math.round(TAUX_ESTIME_A_REBOURS * 100), calcul: `${eur(r.reprise)} ÷ ${eur(y.d.ht)} × 100 = ${qte(Math.round(TAUX_ESTIME_A_REBOURS * 100))} %` },
        ];
      },
      explication: (c) => {
        const y = prudenceDeNova(c);
        return [
          `La charge nette de N+1 est la perte réelle moins la reprise : remonter de l'une à l'autre redonne la dépréciation de N, et le taux qu'on avait estimé. Ici, ${qte(Math.round(TAUX_ESTIME_A_REBOURS * 100))} % estimés pour ${pct(1 - PART_VERSEE_A_REBOURS)} perdus : l'estimation était proche, et N+1 ne porte que ${eur(y.rebours.chargeNette)}.`,
        ];
      },
    },
    {
      id: "corriger-n",
      type: "choix",
      titre: "Faut-il corriger l'exercice N ?",
      notions: ["income_statement", "payment_terms"],
      question: (c) => {
        const y = prudenceDeNova(c);
        return `Le mandataire craignait ${pct(y.taux)} de perte, il y en a eu ${pct(1 - y.f.suites.sonora.partEncaissee)}. Les comptes de N sont arrêtés et approuvés. Le dirigeant veut corriger ces comptes pour y porter la perte réelle. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const y = prudenceDeNova(c);
        return [
          {
            texte: "Non : l'estimation était la meilleure au 31 décembre, et l'écart va dans N+1",
            juste: true,
            retour: `C'est cela. Une estimation faite de bonne foi, avec ce qu'on savait à la clôture, ne devient pas fausse parce que la réalité diffère : c'est un changement d'estimation, qui passe dans l'exercice où l'on apprend le nouveau chiffre, ici les ${eur(y.p.chargeNette)} de N+1. Seule une erreur, un chiffre faux au regard de ce qu'on savait alors, appellerait une correction.`,
          },
          {
            texte: `Oui : la dépréciation de N doit être portée à ${eur(y.p.perteHt)}, la perte réelle`,
            juste: false,
            retour: "Non : les comptes de N disent ce qu'on savait au 31 décembre. Les réécrire avec ce qu'on apprend en juin N+1 ferait d'une estimation une erreur, ce qu'elle n'est pas.",
          },
          {
            texte: "Non : une dépréciation ne se reprend jamais, la perte de N+1 s'y ajoute",
            juste: false,
            retour: `Non : la dépréciation se reprend quand la créance est soldée. Sans reprise, la créance coûterait ${eur(auCentime(y.d.depreciation + y.p.perteHt))}, plus que ce qui a été perdu.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "payment_terms"],
      tableau: (c) => tableauDesDeuxExercices(prudenceDeNova(c)),
      texte: (c) => {
        const y = prudenceDeNova(c);
        return [
          `Vous avez fait les travaux de prudence de ${y.f.entreprise} : une créance reclassée et dépréciée sur son hors taxes, une provision au montant probable, un stock et une ligne examinés et laissés tels quels. Le résultat avant impôt passe de ${eur(y.resultatSansPrudence)} à ${eur(y.resultat)}, l'impôt baisse de ${eur(y.impotEnMoins)}. Puis N+1 a dénoué les deux risques : la perte et la condamnation constatées, la dépréciation et la provision reprises.`,
          "Au niveau de l'examen, vous savez chiffrer une dépréciation et une provision et leur effet sur l'impôt, dénouer une créance irrécouvrable avec sa TVA, mesurer ce qu'une estimation déplace d'un exercice à l'autre, remonter de la charge nette de N+1 au taux estimé, et dire pourquoi un changement d'estimation ne corrige pas l'exercice clos.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Dépréciation d'un actif, provision pour une dette probable : une dotation au 31 décembre, une reprise quand le risque se dénoue. Le montant est celui qu'on estime probable ; sur deux exercices, le risque coûte ce qu'il a coûté, et l'estimation ne fait que le répartir.",
    },
  ],
};

