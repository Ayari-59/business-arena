import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { casDeLEntreprise } from "../cas";
import { delaiDuClient } from "../chapitres/creation-premier-bilan";
import { TAUX_DU_DECOUVERT, escompteDuDefi, factureDAchat, laboratoireDeLEscompte } from "../chapitres/remises-et-reglements";
import { dateDuCours as date } from "../dates";
import { DECOUVERT_DE_NOVA } from "../monde/banque-de-nova";
import { coutDeLAvance, escompteMaximal, facture, tauxAnnuelDeLEscompte } from "../monde/facture";
import { JOURS_D_ESCOMPTE, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../remises";
import { ESCOMPTE_DEMANDE } from "../situations/par-chapitre/l-escompte-demande-par-le-client";
import type { BilanDuScenario, ChiffreDuScenario, ConsequenceDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LES ESCOMPTES DE JANVIER (comptabilité générale, palier 3 ; la suite du chapitre
 * « Remises et règlements » et de son cas, « L'escompte demandé par le client »).
 *
 * Le 20 janvier N, NOVA facture CampusTech, qui paie d'habitude à 80 jours ; Électro-Composants lui
 * propose un escompte pour un règlement rapide de sa facture du 10. Le compte de NOVA est à découvert ce
 * mois-là : chaque euro reçu plus tôt épargne des agios, chaque euro payé plus tôt en coûte. L'élève
 * décide trois fois : l'escompte offert à CampusTech sur sa facture de janvier ; le règlement
 * d'Électro-Composants ; l'escompte des factures suivantes de CampusTech, une fois la première mesurée.
 *
 * UN CRAN PLUS LOIN QUE LE CAS : le cas jugeait un escompte demandé ; le scénario fait arbitrer les deux
 * côtés à la fois, avec un piège (déduire un escompte sans payer dans le délai), et fait fixer la règle
 * pour la suite à partir de ce que la première facture a coûté.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : la vente et l'achat de janvier du cas figé de
 * NOVA, les conditions du cours (remises.ts), le laboratoire de l'escompte et la facture d'achat du
 * chapitre (chapitres/remises-et-reglements.ts), l'escompte demandé du cas. LA SEULE HYPOTHÈSE DU
 * SCÉNARIO : le compte de NOVA est à découvert en janvier, au taux de la banque de NOVA
 * (banque-de-nova.ts, 12 % l'an, que lit le chapitre ; au-delà des 5 000 € autorisés, la banque finance
 * au même taux par un crédit de trésorerie) ; elle fixe le prix de l'argent avancé, dans un sens comme
 * dans l'autre. Les factures suivantes de CampusTech sont celles de janvier, chaque mois (CampusTech
 * commande les mêmes enceintes). À 12 %, les 2 % des conditions (10,5 % l'an pour 70 jours d'avance)
 * coûtent moins que le découvert : la meilleure suite les offre en janvier.
 */

const c = casDeLEntreprise("nova");

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const jours = (n: number) => `${n} jour${n >= 2 ? "s" : ""}`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les factures de CampusTech qui suivent celle de janvier dans le semestre : février à juin, cinq. */
export const FACTURES_SUIVANTES = 5;

/** Les jours dont un escompte avance le paiement de CampusTech : de son délai réel au délai de l'escompte. */
export const JOURS_AVANCES = c.venteCredit.delai - JOURS_D_ESCOMPTE;

/** L'escompte le plus fort que paie le découvert, au dixième de point (celui du défi du chapitre). */
export const ESCOMPTE_MAXIMAL = Math.round(escompteDuDefi(c) * 10) / 1000;

export const CHOIX = {
  client: ["aucun", "conditions", "demande"],
  fournisseur: ["echeance", "escompte", "deduire"],
  suite: ["maximal", "demande", "aucun"],
} as const;
type ChoixDuClient = (typeof CHOIX.client)[number];
type ChoixDuFournisseur = (typeof CHOIX.fournisseur)[number];
type ChoixDeLaSuite = (typeof CHOIX.suite)[number];

const TAUX_DU_CLIENT: Readonly<Record<ChoixDuClient, number>> = { aucun: 0, conditions: TAUX_D_ESCOMPTE, demande: ESCOMPTE_DEMANDE };
const TAUX_DE_LA_SUITE: Readonly<Record<ChoixDeLaSuite, number>> = { maximal: ESCOMPTE_MAXIMAL, demande: ESCOMPTE_DEMANDE, aucun: 0 };

/**
 * Ce qu'un escompte accordé à CampusTech rapporte sur une facture, face au découvert : les agios
 * épargnés sur le net financier, pendant les jours d'avance, moins l'escompte. Sans escompte, rien.
 */
export function escompteAccorde(taux: number) {
  if (taux === 0) {
    const f = facture({ quantite: c.venteCredit.quantite, prixUnitaire: c.venteCredit.prixUnitaire, reductions: [{ nature: "remise", taux: TAUX_DE_REMISE }], escompte: 0, tauxDeTva: c.venteCredit.tauxTva });
    return { taux, escompte: 0, netAPayer: f.netAPayer, agiosEpargnes: 0, gain: 0, paiement: c.venteCredit.date + c.venteCredit.delai, coutAnnuel: 0 };
  }
  const l = laboratoireDeLEscompte(c, { remise: TAUX_DE_REMISE * 100, escompte: Math.round(taux * 1000) / 10, jours: JOURS_AVANCES, taux: TAUX_DU_DECOUVERT * 100 });
  return { taux, escompte: l.escompte, netAPayer: l.netAPayer, agiosEpargnes: l.interetsEvites, gain: l.gain, paiement: c.venteCredit.date + JOURS_D_ESCOMPTE, coutAnnuel: tauxAnnuelDeLEscompte(taux, JOURS_AVANCES) };
}

/** Ce que chaque règlement d'Électro-Composants rapporte, face au découvert, et ce qu'il fait à la relation. */
export function reglementDuFournisseur(choix: ChoixDuFournisseur) {
  const a = factureDAchat(c);
  if (choix === "escompte") {
    const agios = coutDeLAvance(a.netFinancier, TAUX_DU_DECOUVERT, a.joursGagnes);
    return { choix, gain: auCentime(a.escompte - agios), escompte: a.escompte, agios, abimee: false };
  }
  // Déduire l'escompte sans payer dans le délai : le fournisseur le réclame, et NOVA le lui doit.
  return { choix, gain: 0, escompte: choix === "deduire" ? a.escompte : 0, agios: 0, abimee: choix === "deduire" };
}

export type SuiteDesEscomptes = { client: ChoixDuClient; fournisseur: ChoixDuFournisseur; suite: ChoixDeLaSuite };

/** Le résultat d'une suite complète : ce que chaque décision rapporte face au découvert, et la fin. */
export function resultatDesEscomptes(s: SuiteDesEscomptes) {
  const client = escompteAccorde(TAUX_DU_CLIENT[s.client]);
  const fournisseur = reglementDuFournisseur(s.fournisseur);
  const suite = escompteAccorde(TAUX_DE_LA_SUITE[s.suite]);
  const surLaSuite = auCentime(suite.gain * FACTURES_SUIVANTES);
  const total = auCentime(client.gain + fournisseur.gain + surLaSuite);
  const fin = fournisseur.abimee ? "fournisseur" : client.gain + surLaSuite < 0 ? "marge" : "gagnant";
  return { suite: s, client, fournisseur, surLaSuite, total, fin } as const;
}

export const toutesLesSuites = () => CHOIX.client.flatMap((client) => CHOIX.fournisseur.flatMap((fournisseur) => CHOIX.suite.map((suite) => resultatDesEscomptes({ client, fournisseur, suite }))));

/** La meilleure suite : celle qui rapporte le plus, sans abîmer le fournisseur. */
export function meilleureSuite() {
  return toutesLesSuites()
    .filter((r) => r.fin !== "fournisseur")
    .reduce((a, b) => (b.total > a.total ? b : a));
}

const suiteDe = (codes: readonly string[]): Partial<SuiteDesEscomptes> => ({
  ...(codes[0] ? { client: codes[0] as ChoixDuClient } : {}),
  ...(codes[1] ? { fournisseur: codes[1] as ChoixDuFournisseur } : {}),
  ...(codes[2] ? { suite: codes[2] as ChoixDeLaSuite } : {}),
});

// ─────────────────────────────────────────────────────────────────────────────
// LES TEXTES DES OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

const achat = factureDAchat(c);
const venteSansEscompte = escompteAccorde(0);

const LIBELLES = {
  client: {
    aucun: `Ne pas offrir d'escompte : CampusTech paiera à ${c.venteCredit.delai} jours, comme d'habitude`,
    conditions: `Offrir l'escompte des conditions de NOVA, ${pct(TAUX_D_ESCOMPTE)} pour un paiement sous ${JOURS_D_ESCOMPTE} jours`,
    demande: `Accorder les ${pct(ESCOMPTE_DEMANDE)} que demande CampusTech, pour un paiement sous ${JOURS_D_ESCOMPTE} jours`,
  },
  fournisseur: {
    echeance: `Payer Électro-Composants à l'échéance, le ${date(c.achat.echeance)}`,
    escompte: `Payer sous ${JOURS_D_ESCOMPTE} jours, le ${date(c.achat.date + JOURS_D_ESCOMPTE)}, et prendre l'escompte de ${pct(TAUX_D_ESCOMPTE)}`,
    deduire: `Payer à l'échéance, le ${date(c.achat.echeance)}, en déduisant quand même l'escompte de ${pct(TAUX_D_ESCOMPTE)}`,
  },
  suite: {
    maximal: `Offrir l'escompte le plus fort que paie le découvert, ${pct(ESCOMPTE_MAXIMAL)}`,
    demande: `Garder les ${pct(ESCOMPTE_DEMANDE)} qu'elle demande, pour la garder contente`,
    aucun: "Ne plus offrir d'escompte",
  },
} as const satisfies { client: Record<ChoixDuClient, string>; fournisseur: Record<ChoixDuFournisseur, string>; suite: Record<ChoixDeLaSuite, string> };

const libelleDuChoix = (s: SuiteDesEscomptes, i: number) => (i === 0 ? LIBELLES.client[s.client] : i === 1 ? LIBELLES.fournisseur[s.fournisseur] : LIBELLES.suite[s.suite]);

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = `${date(c.venteCredit.date)} N`;

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "Les escomptes",
  paragraphes: [
    "Bonjour,",
    `Nous sommes à découvert ce mois-ci, à ${pct(TAUX_DU_DECOUVERT)} l'an. CampusTech demande un escompte pour payer vite, et Électro-Composants nous en propose un. Décidez pour moi, chiffres à l'appui : chaque euro d'escompte doit rapporter plus qu'il ne coûte.`,
    "Merci. Le président",
  ],
};

const FACTURE_DE_CAMPUSTECH: PieceDuBureau = {
  code: "facture-campustech",
  nature: "facture",
  titre: `Facture de NOVA à CampusTech du ${date(c.venteCredit.date)}`,
  de: "NOVA",
  a: c.venteCredit.client,
  date: JOUR,
  montants: [
    { libelle: `${c.venteCredit.quantite} enceintes à ${eur(c.venteCredit.prixUnitaire)}, brut hors taxes`, montant: c.venteCredit.ht },
    { libelle: `Remise de ${pct(TAUX_DE_REMISE)}`, montant: auCentime(c.venteCredit.ht * TAUX_DE_REMISE) },
    { libelle: "Net à payer sans escompte, taxes comprises", montant: venteSansEscompte.netAPayer, fort: true },
  ],
  mention: `Délai convenu : ${delaiDuClient(c).convenu} jours. CampusTech paie d'habitude à ${c.venteCredit.delai} jours.`,
};

const FACTURE_D_ELECTRO: PieceDuBureau = {
  code: "facture-electro",
  nature: "facture",
  titre: `Facture d'Électro-Composants du ${date(c.achat.date)}`,
  de: c.achat.fournisseur,
  a: "NOVA",
  date: `${date(c.achat.date)} N`,
  montants: [
    { libelle: "Composants, hors taxes", montant: achat.netCommercial },
    { libelle: `Escompte de ${pct(TAUX_D_ESCOMPTE)} si le paiement arrive avant le ${date(c.achat.date + JOURS_D_ESCOMPTE)}`, montant: achat.escompte },
    { libelle: "Net à payer avec l'escompte, taxes comprises", montant: achat.ttc, fort: true },
  ],
  mention: `Sans escompte : ${eur(c.achat.ttc)}, payables le ${date(c.achat.echeance)}. L'escompte n'est dû que pour un paiement dans le délai.`,
};

const RAPPEL_DU_DECOUVERT: PieceDuBureau = {
  code: "decouvert",
  nature: "lettre",
  titre: "Les conditions du découvert",
  de: "La banque de NOVA",
  a: "NOVA",
  date: "janvier N",
  paragraphes: [
    `Découvert autorisé à ${pct(TAUX_DU_DECOUVERT)} l'an, sur le solde débiteur de chaque jour, l'année comptée pour 360 jours.`,
    ...(Math.max(achat.netFinancier, venteSansEscompte.netAPayer) > DECOUVERT_DE_NOVA.autorise
      ? [`Au-delà de l'autorisation de découvert, ${eur(DECOUVERT_DE_NOVA.autorise)}, la banque finance au même taux par un crédit de trésorerie.`]
      : []),
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

const signe = (x: number) => (x > 0 ? `${eur(x)} de gagnés` : x < 0 ? `${eur(-x)} de perdus` : "rien");

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    return {
      titre: "L'escompte de CampusTech",
      consigne: "Quel escompte offrez-vous à CampusTech sur sa facture de janvier ?",
      paragraphes: [
        `CampusTech doit ${eur(venteSansEscompte.netAPayer)}, qu'elle paiera dans ${jours(c.venteCredit.delai)}. Un escompte la ferait payer sous ${jours(JOURS_D_ESCOMPTE)} : ${jours(JOURS_AVANCES)} d'avance, autant de jours de découvert en moins.`,
        "L'escompte se calcule sur le net commercial, après la remise ; la TVA se calcule ensuite, sur le net financier.",
      ],
      chiffres: [
        { libelle: "Jours d'avance", valeur: jours(JOURS_AVANCES) },
        { libelle: "Taux du découvert", valeur: pct(TAUX_DU_DECOUVERT) },
      ],
      pieces: [COURRIEL, FACTURE_DE_CAMPUSTECH, RAPPEL_DU_DECOUVERT],
      options: CHOIX.client.map((code) => ({ code, texte: LIBELLES.client[code] })),
    };
  }
  if (avant.length === 1) {
    return {
      titre: "L'escompte d'Électro-Composants",
      consigne: "Comment réglez-vous la facture d'Électro-Composants ?",
      paragraphes: [
        `Payer sous ${jours(JOURS_D_ESCOMPTE)}, c'est payer ${jours(achat.joursGagnes)} plus tôt, et donc rester ${jours(achat.joursGagnes)} de plus à découvert sur le net financier.`,
        `L'escompte vaut ${eur(achat.escompte)} hors taxes. Ramené à l'année, il rapporte ${pct(Math.round(achat.tauxAnnuel * 1000) / 1000)}.`,
      ],
      chiffres: [
        { libelle: "Escompte proposé", valeur: eur(achat.escompte) },
        { libelle: "Jours payés plus tôt", valeur: jours(achat.joursGagnes) },
        { libelle: "Taux du découvert", valeur: pct(TAUX_DU_DECOUVERT) },
      ],
      pieces: [FACTURE_D_ELECTRO, RAPPEL_DU_DECOUVERT],
      options: CHOIX.fournisseur.map((code) => ({ code, texte: LIBELLES.fournisseur[code] })),
    };
  }
  const premier = escompteAccorde(TAUX_DU_CLIENT[s.client!]);
  return {
    titre: "Les factures suivantes",
    consigne: `Quel escompte offrez-vous à CampusTech sur ses ${FACTURES_SUIVANTES} factures suivantes, chacune comme celle de janvier ?`,
    paragraphes: [
      premier.taux === 0
        ? "En janvier, vous n'avez rien offert : CampusTech paiera dans ses délais habituels, et rien n'a coûté."
        : `En janvier, l'escompte de ${pct(premier.taux)} a coûté ${eur(premier.escompte)} et épargné ${eur(premier.agiosEpargnes)} d'agios : ${signe(premier.gain)} face au découvert.`,
      `Un escompte paie s'il coûte moins que ${jours(JOURS_AVANCES)} de découvert sur ce qu'il fait rentrer. Le plus fort qui y parvient : ${pct(ESCOMPTE_MAXIMAL)}, au dixième de point.`,
    ],
    chiffres: [
      { libelle: "Escompte le plus fort que paie le découvert", valeur: pct(ESCOMPTE_MAXIMAL) },
      { libelle: "Ce que la facture de janvier a donné", valeur: signe(premier.gain), ton: premier.gain < 0 ? "alerte" : undefined },
    ],
    pieces: [RAPPEL_DU_DECOUVERT],
    options: CHOIX.suite.map((code) => ({ code, texte: LIBELLES.suite[code] })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function chiffresDeLEscompte(x: ReturnType<typeof escompteAccorde>, fois = 1): ChiffreDuScenario[] {
  return [
    { libelle: fois > 1 ? `Escomptes accordés, sur ${fois} factures` : "Escompte accordé", valeur: eur(x.escompte * fois) },
    { libelle: "Agios épargnés", valeur: eur(x.agiosEpargnes * fois) },
    { libelle: "Face au découvert", valeur: signe(auCentime(x.gain * fois)), ton: x.gain < 0 ? "alerte" : x.gain > 0 ? "bon" : undefined },
  ];
}

function consequence(codes: readonly string[]): ConsequenceDuScenario {
  const s = suiteDe(codes);
  if (codes.length === 1) {
    const x = escompteAccorde(TAUX_DU_CLIENT[s.client!]);
    const paragraphes =
      x.taux === 0
        ? [`CampusTech paiera ${eur(x.netAPayer)} le ${date(x.paiement)}. Rien ne coûte, rien ne rentre plus tôt.`]
        : [
            `CampusTech accepte et paie le ${date(x.paiement)} : ${eur(x.netAPayer)}, escompte déduit. L'escompte coûte ${eur(x.escompte)} ; ${jours(JOURS_AVANCES)} de découvert en moins épargnent ${eur(x.agiosEpargnes)}.`,
            `Ramené à l'année, cet escompte coûte ${pct(Math.round(x.coutAnnuel * 1000) / 1000)}, quand le découvert coûte ${pct(TAUX_DU_DECOUVERT)}.`,
          ];
    return { titre: "CampusTech", paragraphes, chiffres: chiffresDeLEscompte(x) };
  }
  if (codes.length === 2) {
    const x = reglementDuFournisseur(s.fournisseur!);
    const textes: Record<ChoixDuFournisseur, string[]> = {
      echeance: [`NOVA paie ${eur(c.achat.ttc)} le ${date(c.achat.echeance)}. L'escompte est perdu, mais rien ne coûte.`],
      escompte: [`NOVA paie ${eur(achat.ttc)} le ${date(c.achat.date + JOURS_D_ESCOMPTE)}. Elle gagne ${eur(x.escompte)} d'escompte et paie ${eur(x.agios)} d'agios pour ${jours(achat.joursGagnes)} de découvert en plus.`],
      deduire: [
        `NOVA paie le ${date(c.achat.echeance)} en déduisant ${eur(x.escompte)} : Électro-Composants refuse, l'escompte n'est dû que pour un paiement dans le délai. NOVA doit le reverser.`,
        "Le fournisseur le note : il ne proposera plus d'escompte, et la relation est abîmée.",
      ],
    };
    return {
      titre: "Électro-Composants",
      paragraphes: textes[s.fournisseur!],
      chiffres: [
        { libelle: "Face au découvert", valeur: signe(x.gain), ton: x.gain > 0 ? "bon" : undefined },
        { libelle: "Relation avec Électro-Composants", valeur: x.abimee ? "abîmée" : "bonne", ton: x.abimee ? "alerte" : "bon" },
      ],
    };
  }
  const x = escompteAccorde(TAUX_DE_LA_SUITE[s.suite!]);
  const paragraphes =
    x.taux === 0
      ? [`Les ${FACTURES_SUIVANTES} factures suivantes se paieront à ${jours(c.venteCredit.delai)}, sans escompte. Rien ne coûte.`]
      : [`Sur chaque facture suivante, l'escompte de ${pct(x.taux)} coûte ${eur(x.escompte)} et épargne ${eur(x.agiosEpargnes)} d'agios : ${signe(x.gain)} par facture, ${signe(auCentime(x.gain * FACTURES_SUIVANTES))} sur les ${FACTURES_SUIVANTES}.`];
  return { titre: "Les factures suivantes", paragraphes, chiffres: chiffresDeLEscompte(x, FACTURES_SUIVANTES) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "le-client", titre: "L'escompte de CampusTech", options: CHOIX.client },
  { id: "le-fournisseur", titre: "L'escompte d'Électro-Composants", options: CHOIX.fournisseur },
  { id: "la-suite", titre: "Les factures suivantes", options: CHOIX.suite },
] as const;

type Resultat = ReturnType<typeof resultatDesEscomptes>;

const chiffresDuResultat = (r: Resultat): ChiffreDuScenario[] => [
  { libelle: "L'escompte de janvier, face au découvert", valeur: signe(r.client.gain), ton: r.client.gain < 0 ? "alerte" : undefined },
  { libelle: "Le règlement d'Électro-Composants", valeur: signe(r.fournisseur.gain), ton: r.fournisseur.gain > 0 ? "bon" : undefined },
  { libelle: `Les ${FACTURES_SUIVANTES} factures suivantes`, valeur: signe(r.surLaSuite), ton: r.surLaSuite < 0 ? "alerte" : r.surLaSuite > 0 ? "bon" : undefined },
  { libelle: "En tout", valeur: signe(r.total) },
  { libelle: "Relation avec Électro-Composants", valeur: r.fournisseur.abimee ? "abîmée" : "bonne", ton: r.fournisseur.abimee ? "alerte" : "bon" },
];

const resumer = (r: Resultat): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDuResultat(r) });

const FINS = {
  fournisseur: {
    titre: "Le fournisseur fâché",
    paragraphes: () => ["Un escompte se gagne en payant dans le délai ; le déduire sans payer à temps, c'est le prendre. Électro-Composants l'a réclamé, et ne le proposera plus : le meilleur escompte du mois est perdu."],
  },
  marge: {
    titre: "La marge rognée",
    paragraphes: (r: Resultat) => [`Les escomptes accordés à CampusTech coûtent plus que le découvert qu'ils épargnent : ${signe(auCentime(r.client.gain + r.surLaSuite))}. Un escompte trop fort paie le client pour un argent que la banque prêterait moins cher.`],
  },
  gagnant: {
    titre: "L'arbitrage gagnant",
    paragraphes: (r: Resultat) => [`Chaque escompte rapporte au moins ce qu'il coûte face au découvert : ${signe(r.total)} sur le semestre, et les deux partenaires sont ménagés.`],
  },
} as const;

const codesDe = (s: SuiteDesEscomptes) => [s.client, s.fournisseur, s.suite];

function bilan(codes: readonly string[]): BilanDuScenario {
  const s = suiteDe(codes) as SuiteDesEscomptes;
  const r = resultatDesEscomptes(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const comparaison = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuites().length} : ${signe(b.total)}, sans rien abîmer.`]
    : [
        `Votre suite donne ${signe(r.total)} ; la meilleure, ${signe(b.total)}.`,
        ...DECISIONS.flatMap((d, i) => (codesDe(b.suite)[i] === codes[i] ? [] : [`${d.titre} : vous avez choisi « ${libelleDuChoix(s, i)} » ; la meilleure suite choisit « ${libelleDuChoix(b.suite, i)} ».`])),
      ];
  const conditions = escompteAccorde(TAUX_D_ESCOMPTE);
  return {
    fin: { code: r.fin, titre: FINS[r.fin].titre, paragraphes: FINS[r.fin].paragraphes(r) },
    meilleure: memes,
    eleve: resumer(r),
    reference: resumer(b),
    comparaison: [
      ...comparaison,
      conditions.coutAnnuel > TAUX_DU_DECOUVERT
        ? `Les ${pct(TAUX_D_ESCOMPTE)} des conditions coûtent ${pct(Math.round(conditions.coutAnnuel * 1000) / 1000)} l'an pour ${jours(JOURS_AVANCES)} d'avance, plus que le découvert : sur la facture de janvier, mieux vaut ne rien offrir.`
        : `Les ${pct(TAUX_D_ESCOMPTE)} des conditions coûtent ${pct(Math.round(conditions.coutAnnuel * 1000) / 1000)} l'an pour ${jours(JOURS_AVANCES)} d'avance, moins que le découvert : sur la facture de janvier, ils rapportent ${eur(conditions.gain)}.`,
      `L'escompte d'Électro-Composants rapporte ${pct(Math.round(achat.tauxAnnuel * 1000) / 1000)} l'an : le prendre au découvert gagne ${eur(reglementDuFournisseur("escompte").gain)}. Pour la suite, ${pct(ESCOMPTE_MAXIMAL)} est l'escompte le plus fort qui rapporte encore.`,
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

const maximalExact = escompteMaximal(TAUX_DU_DECOUVERT, JOURS_AVANCES);

export const LES_ESCOMPTES_DE_JANVIER: Scenario = {
  code: "les-escomptes-de-janvier",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["remises-et-reglements"],
  commanditaire: "Le président",
  entreprise: { code: c.code, nom: c.entreprise },
  titre: "Scénario : les escomptes de janvier",
  accroche: "NOVA est à découvert. CampusTech veut un escompte, Électro-Composants en propose un. Le client, le fournisseur, puis la règle pour la suite : chaque décision se chiffre face au découvert.",
  objectifs: [
    "Comparer le coût d'un escompte accordé au découvert qu'il épargne",
    "Prendre un escompte de fournisseur quand il rapporte plus que l'argent avancé",
    "Fixer l'escompte le plus fort qu'une entreprise peut offrir",
  ],
  libre: false,
  accueil: [
    `Le ${JOUR}, au siège de NOVA. Le compte est à découvert ce mois-ci ; le président vous confie les escomptes.`,
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez ce qu'elle rapporte ou coûte face au découvert ; à la fin, un bilan compare votre suite à la meilleure.",
  ],
  decisions: DECISIONS,
  situation,
  consequence,
  bilan,
  questions: {
    id: "les-questions",
    type: "reponse",
    titre: "Pour finir, vérifiez",
    consigne: "Choisissez la bonne réponse à chaque question.",
    pieces: [],
    explication: [
      "Un escompte accordé est un financement : il se compare au taux de l'argent qu'il remplace. Un escompte obtenu est un placement : il se compare au taux de l'argent qu'il faut avancer.",
    ],
    questions: [
      {
        id: "le-maximal",
        question: `Pourquoi ${pct(ESCOMPTE_MAXIMAL)} est-il l'escompte le plus fort que NOVA peut offrir ?`,
        options: [
          { texte: "Au-delà, il coûte plus que le découvert", juste: true, retour: `Oui : pour ${jours(JOURS_AVANCES)} d'avance au taux du découvert, la formule donne ${pct(Math.round(maximalExact * 10000) / 10000)} ; au dixième de point inférieur, ${pct(ESCOMPTE_MAXIMAL)}.` },
          { texte: "C'est le taux du découvert, ramené aux jours d'avance sur le brut de la facture", juste: false, retour: "Non : l'escompte se calcule sur le net commercial, et le taux de la période se ramène ensuite à un escompte. Le brut n'y entre pas." },
          { texte: "C'est la moitié de ce que demande CampusTech, pour partager l'effort", juste: false, retour: "Non : l'escompte maximal ne se négocie pas, il se calcule : celui où les agios épargnés égalent l'escompte." },
        ],
      },
      {
        id: "deduire",
        question: "Déduire l'escompte d'Électro-Composants en payant à l'échéance, qu'est-ce que c'est ?",
        options: [
          { texte: "Une réduction prise sans y avoir droit", juste: true, retour: "Oui : l'escompte rémunère un paiement anticipé. Sans paiement dans le délai, il n'est pas dû, et le fournisseur le réclame." },
          { texte: "Un escompte comme un autre, puisque la facture le prévoit", juste: false, retour: "Non : la facture le prévoit sous condition, un paiement dans le délai. La condition manque." },
          { texte: "Une remise, que l'on peut toujours déduire d'une facture d'achat au moment de son paiement", juste: false, retour: "Non : une remise figure sur la facture ; l'escompte dépend du jour du paiement." },
        ],
      },
    ],
  },
};
