import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { FACTURE_DE_CAMPUSTECH, facturesDeCampusTech, dateEcrite } from "../monde/compte-client-de-nova";
import {
  CHOIX_DES_DECISIONS,
  CONDITIONS_DU_SCENARIO as C,
  ELECTRO_COMPOSANTS_EN_MAI,
  ESCOMPTE_DE_REGLEMENT,
  FRAIS_DE_REJET,
  JOUR_DE_LA_RELANCE_PAYEE,
  JOUR_DU_SCENARIO,
  SOLDE_DU_30_AVRIL,
  creditDeMai,
  daillyDeMai,
  factureCedee,
  jourDeMai,
  joursDuDailly,
  joursDuReport,
  toutesLesSuites,
  meilleureSuite,
  montantsDeMai,
  mouvementsDeMai,
  planSansLimite,
  resultatDeLaSuite,
  suiteDesCodes,
  type ChoixDeLaBanque,
  type ChoixDuClient,
  type ChoixDuFournisseur,
  type EtatDeLaRelation,
  type ResultatDeLaSuite,
  type SuiteComplete,
  type SuiteDeChoix,
} from "../monde/decouvert-de-nova";
import { INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT, DELAI_MAXIMAL_CONVENU, MAJORATION_DU_TAUX_BCE } from "../monde/delais-et-tva";
import { JOURS_DE_LA_BANQUE, JOURS_DU_MOIS_BANCAIRE } from "../monde/equilibre-de-tresorerie";
import { RETARD_DE_CAMPUSTECH } from "../monde/nova-gestion";
import { ELECTRO_COMPOSANTS } from "../monde/exercice-de-nova";
import { RELANCES } from "../monde/mauvais-payeurs";
import type { ChiffreDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LE DÉCOUVERT DE NOVA (comptabilité générale, palier 4 ; BTS CG P6, 6.4.2 ; DCG UE6, 5.1).
 *
 * La suite du chapitre « Financer et placer la trésorerie », en décisions : le 28 avril N+1, le plan de
 * mai met le compte de NOVA sous zéro dès le 1er, et au delà de l'autorisation le 5. L'élève, qui tient
 * la trésorerie, décide pour le président : le client, puis le fournisseur, puis la banque. Tous les
 * chiffres se calculent dans le monde du cours (monde/decouvert-de-nova.ts) ; ce fichier écrit les
 * situations, les options et les textes, qui ne partent au navigateur qu'une décision à la fois
 * (pedagogy/cours/scenario-servi.ts, app/cours/scenario/actions.ts).
 *
 * L'ARBRE : 3 × 3 × 3 suites, toutes calculées. Trois fins : un prélèvement rejeté (le découvert dépassé),
 * un fournisseur payé en retard (une relation abîmée), un mois tenu. La meilleure suite, et sa règle :
 * monde/decouvert-de-nova.ts, `meilleureSuite`.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const jours = (n: number) => `${n} jour${n >= 2 ? "s" : ""}`;
const m = montantsDeMai();
const facture = (reference: string) => facturesDeCampusTech().find((x) => x.reference === reference)!;
const FEVRIER = facture("février");
const MARS = facture("mars");
const AVRIL = facture("avril");

const RELATIONS: Readonly<Record<EtatDeLaRelation, string>> = { bonne: "bonne", tendue: "tendue", abimee: "abîmée" };

const LIBELLES = {
  client: {
    attendre: "Attendre le virement du 10 mai, comme chaque mois",
    relancer: "Relancer CampusTech aujourd'hui, à l'amiable, comme le prévoit la procédure",
    escompter: `Offrir à CampusTech l'escompte de ${pct(ESCOMPTE_DE_REGLEMENT.taux)} sur la facture de mars, si elle la règle tout de suite`,
  },
  fournisseur: {
    payer: "Payer Électro-Composants le 1er mai, comme convenu",
    etaler: "Demander à Électro-Composants d'étaler : la moitié le 1er mai, l'autre le 1er juin",
    retarder: `Régler Électro-Composants le ${jourDeMai(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard)}, une fois le virement de CampusTech arrivé`,
  },
} as const satisfies { client: Record<ChoixDuClient, string>; fournisseur: Record<ChoixDuFournisseur, string> };

function libelleDeLaBanque(s: SuiteDeChoix, choix: ChoixDeLaBanque): string {
  if (choix === "decouvert") return `Rester sur le découvert autorisé, ${eur(C.decouvert.autorise)} au plus`;
  if (choix === "credit") {
    const c = creditDeMai(s);
    return c.montant > 0 ? `Emprunter ${eur(c.montant)} pour un mois (crédit de trésorerie)` : "Demander un crédit de trésorerie d'un mois";
  }
  return `Céder à la banque la facture de ${factureCedee(s).reference} de CampusTech (cession Dailly)`;
}

/** Le libellé d'une option choisie, dans l'ordre des décisions. */
function libelleDuChoix(suite: SuiteDeChoix, i: number): string {
  if (i === 0) return LIBELLES.client[suite.client!];
  if (i === 1) return LIBELLES.fournisseur[suite.fournisseur!];
  return libelleDeLaBanque(suite, suite.banque!);
}

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDesCodes(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = `${dateEcrite(JOUR_DU_SCENARIO)} N+1`;

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La trésorerie",
  date: JOUR,
  objet: "Le plan de mai",
  paragraphes: [
    "Bonjour,",
    `Le plan de mai m'inquiète : le compte passe sous zéro dès le 1er mai, et au delà de nos ${eur(C.decouvert.autorise)} de découvert autorisé le 5, avec le loyer.`,
    "Je ne veux ni rejet ni retard. Voyez CampusTech, puis Électro-Composants, puis la banque, dans cet ordre, et dites-moi ce que chaque geste coûte.",
    "Merci. Le président",
  ],
};

/** Le plan de mai, pour une suite donnée : les mouvements du compte, et le solde du 30 avril. */
function planDeMai(s: SuiteDeChoix, titre: string): PieceDuBureau {
  const p = planSansLimite(s);
  return {
    code: "plan",
    nature: "plan",
    titre,
    de: "La trésorerie de NOVA",
    a: "Le président",
    date: JOUR,
    lignes: mouvementsDeMai(s).map((x) => ({ date: jourDeMai(x.jour), libelle: x.libelle, montant: x.montant })),
    montants: [
      { libelle: "Solde du 30 avril au soir", montant: SOLDE_DU_30_AVRIL },
      { libelle: `Le plus bas du mois, le ${jourDeMai(p.plusBas.jour)}`, montant: p.plusBas.solde },
      { libelle: "Solde au 31 mai", montant: p.fin, fort: true },
    ],
    mention: "Les remises de cartes sont comptées hors taxes : la TVA qu'elles encaissent est mise de côté pour l'État. Le même jour, les entrées passent avant les sorties.",
  };
}

const COMPTE_DE_CAMPUSTECH: PieceDuBureau = {
  code: "campustech",
  nature: "extrait",
  titre: "Le compte de CampusTech",
  de: "La comptabilité clients",
  a: "La trésorerie",
  date: JOUR,
  paragraphes: [
    `CampusTech paie à ${jours(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)}, convenus, et règle en vérité ${jours(RETARD_DE_CAMPUSTECH)} plus tard.`,
    `La facture de février est échue depuis le ${dateEcrite(FEVRIER.echeance)} : la procédure prévoit une relance amiable ${jours(RELANCES.relanceAmiable)} après l'échéance, aujourd'hui.`,
    `Les conditions de NOVA offrent un escompte de ${pct(ESCOMPTE_DE_REGLEMENT.taux)} du net hors taxes pour un règlement rapide.`,
  ],
  montants: [
    { libelle: `Facture du ${dateEcrite(FEVRIER.date)}, échue le ${dateEcrite(FEVRIER.echeance)}, réglée d'habitude le ${dateEcrite(FEVRIER.paiement)}`, montant: FEVRIER.ttc },
    { libelle: `Facture du ${dateEcrite(MARS.date)}, échéance le ${dateEcrite(MARS.echeance)}, réglée d'habitude le ${dateEcrite(MARS.paiement)}`, montant: MARS.ttc },
    { libelle: `Facture du ${dateEcrite(AVRIL.date)}, échéance le ${dateEcrite(AVRIL.echeance)}, réglée d'habitude le ${dateEcrite(AVRIL.paiement)}`, montant: AVRIL.ttc },
  ],
  mention: `Chaque facture : ${FACTURE_DE_CAMPUSTECH.enceintes} enceintes à ${eur(FACTURE_DE_CAMPUSTECH.ht / FACTURE_DE_CAMPUSTECH.enceintes)} hors taxes, TVA comprise.`,
};

const FACTURE_D_ELECTRO: PieceDuBureau = {
  code: "electro",
  nature: "facture",
  titre: "Facture d'Électro-Composants du 10 avril",
  de: ELECTRO_COMPOSANTS.nom,
  a: "NOVA",
  date: "10 avril N+1",
  objet: "Les composants d'avril",
  montants: [
    { libelle: `${m.jeuxDAvril} jeux de composants à ${eur(ELECTRO_COMPOSANTS.prixDuJeu)}, hors taxes`, montant: m.composantsHt },
    { libelle: "TVA", montant: m.composants - m.composantsHt },
    { libelle: "À payer le 1er mai", montant: m.composants, fort: true },
  ],
  mention: `Conditions générales : tout retard ouvre de plein droit des pénalités au taux de la BCE majoré de ${MAJORATION_DU_TAUX_BCE * 100} points et une indemnité de ${eur(INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT)}.`,
};

const CONDITIONS_DE_LA_BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "Les conditions de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "janvier N+1",
  objet: "Vos concours à court terme",
  paragraphes: [
    `Découvert autorisé : ${eur(C.decouvert.autorise)} au plus, à ${pct(C.decouvert.tauxAnnuel)} l'an sur le solde débiteur de chaque jour ; les agios du mois se prélèvent le mois suivant. Au delà, nous rejetons les paiements.`,
    `Crédit de trésorerie : un mois, par tranches de ${eur(C.credit.tranche)}, à ${pct(C.credit.tauxAnnuel)} l'an, ${eur(C.credit.frais)} de frais à chaque mise en place.`,
    `Cession Dailly : nous avançons une facture, toutes taxes comprises, à ${pct(C.dailly.tauxAnnuel)} l'an jusqu'à son paiement, ${eur(C.dailly.fraisParBordereau)} par bordereau. Votre client n'a rien à accepter.`,
    `Frais de rejet d'un prélèvement : ${eur(FRAIS_DE_REJET)}.`,
  ],
  mention: `Les intérêts se comptent sur ${JOURS_DE_LA_BANQUE} jours, en mois de ${JOURS_DU_MOIS_BANCAIRE} jours.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES
// ─────────────────────────────────────────────────────────────────────────────

/** Le plan sans financement : le plus bas, les jours sous zéro, l'autorisation. */
function chiffresDuPlan(s: SuiteDeChoix): ChiffreDuScenario[] {
  const p = planSansLimite(s);
  return [
    { libelle: "Le plus bas du mois", valeur: `${eur(p.plusBas.solde)}, le ${jourDeMai(p.plusBas.jour)}`, ton: p.plusBas.solde < -C.decouvert.autorise ? "alerte" : p.plusBas.solde >= 0 ? "bon" : undefined },
    { libelle: "Jours sous zéro", valeur: jours(p.joursSousZero) },
    { libelle: "Découvert autorisé", valeur: eur(C.decouvert.autorise) },
  ];
}

const coutDuMois = (r: ResultatDeLaSuite) => eur(r.cout);

function chiffresDuResultat(r: ResultatDeLaSuite): ChiffreDuScenario[] {
  return [
    { libelle: "Le plus bas du mois", valeur: `${eur(r.compte.plusBas.solde)}, le ${jourDeMai(r.compte.plusBas.jour)}`, ton: r.compte.plusBas.solde >= 0 ? "bon" : undefined },
    { libelle: "Paiements rejetés", valeur: String(r.compte.rejets.length), ton: r.compte.rejets.length ? "alerte" : "bon" },
    { libelle: "Coût du mois", valeur: coutDuMois(r) },
    { libelle: "Solde au 31 mai", valeur: eur(r.compte.fin) },
    { libelle: "Trésorerie de fin de mai, une fois rendu ce que le mois emprunte", valeur: eur(r.tresorerieNette) },
    { libelle: "Relation avec CampusTech", valeur: RELATIONS[r.relations.client], ton: r.relations.client === "bonne" ? "bon" : undefined },
    { libelle: "Relation avec Électro-Composants", valeur: RELATIONS[r.relations.fournisseur], ton: r.relations.fournisseur === "abimee" ? "alerte" : r.relations.fournisseur === "bonne" ? "bon" : undefined },
    { libelle: "Relation avec la banque", valeur: RELATIONS[r.relations.banque], ton: r.relations.banque === "abimee" ? "alerte" : "bon" },
  ];
}

/** Le détail du coût du mois, poste par poste, les postes nuls omis. */
function detailDuCout(r: ResultatDeLaSuite): string {
  const postes: [string, number][] = [
    ["l'escompte accordé à CampusTech", r.couts.escompte],
    ["l'intérêt de l'étalement", r.couts.etalement],
    ["les pénalités et l'indemnité du retard", r.couts.retard],
    ["les agios du découvert", r.couts.agios],
    ["les intérêts et les frais du crédit", r.couts.credit],
    ["les intérêts et les frais du Dailly", r.couts.dailly],
    ["les frais de rejet", r.couts.rejets],
  ];
  const presents = postes.filter(([, x]) => x > 0).map(([l, x]) => `${l}, ${eur(x)}`);
  return presents.length ? `Le mois coûte ${eur(r.cout)} : ${presents.join(" ; ")}.` : "Le mois ne coûte rien.";
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  const p = planSansLimite(s);
  if (avant.length === 0) {
    return {
      titre: "Le client",
      consigne: `Que faites-vous de la facture de février de CampusTech, échue depuis le ${dateEcrite(FEVRIER.echeance)} ?`,
      paragraphes: [
        `Au 30 avril au soir, le compte portera ${eur(SOLDE_DU_30_AVRIL)}. Le 1er mai part la facture d'Électro-Composants, ${eur(m.composants)} ; le 5, le loyer, ${eur(m.loyer)}.`,
        `CampusTech ne vire la facture de février que le ${dateEcrite(FEVRIER.paiement)}. D'ici là, le compte descend à ${eur(p.plusBas.solde)} : la banque n'en couvre que ${eur(C.decouvert.autorise)}.`,
        "Après le 10, tout rentre dans l'ordre : le factor d'Ondes verse le 15, les remises de cartes tombent chaque semaine.",
      ],
      chiffres: chiffresDuPlan(s),
      pieces: [COURRIEL, planDeMai(s, "Le plan de mai, avant toute décision"), COMPTE_DE_CAMPUSTECH],
      options: CHOIX_DES_DECISIONS[0]!.map((code) => ({ code, texte: LIBELLES.client[code as ChoixDuClient] })),
    };
  }
  if (avant.length === 1) {
    return {
      titre: "Le fournisseur",
      consigne: "Comment réglez-vous la facture d'avril d'Électro-Composants, due le 1er mai ?",
      paragraphes: [
        `La facture porte ${eur(m.composants)}, payable le 1er mai : c'est elle qui ouvre le trou du début de mois.`,
        `Après votre décision sur CampusTech, le plan descend à ${eur(p.plusBas.solde)}, le ${jourDeMai(p.plusBas.jour)}, et reste ${jours(p.joursSousZero)} sous zéro.`,
      ],
      chiffres: chiffresDuPlan(s),
      pieces: [FACTURE_D_ELECTRO, planDeMai(s, "Le plan de mai, après la décision sur CampusTech")],
      options: CHOIX_DES_DECISIONS[1]!.map((code) => ({ code, texte: LIBELLES.fournisseur[code as ChoixDuFournisseur] })),
    };
  }
  const c = creditDeMai(s);
  return {
    titre: "La banque",
    consigne: "Comment couvrez-vous ce qui reste du trou de mai ?",
    paragraphes: [
      p.plusBas.solde < 0
        ? `Le plan descend encore à ${eur(p.plusBas.solde)}, le ${jourDeMai(p.plusBas.jour)}, et reste ${jours(p.joursSousZero)} sous zéro. Le découvert autorisé couvre ${eur(C.decouvert.autorise)}.`
        : `Le plan ne passe plus sous zéro : le plus bas est de ${eur(p.plusBas.solde)}, le ${jourDeMai(p.plusBas.jour)}.`,
      c.montant > 0
        ? `Le président veut garder un matelas de ${eur(C.matelas)} : le crédit qui y ramène le plus bas est de ${eur(c.montant)}, versé le 1er mai et rendu le 1er juin.`
        : `Le plus bas reste au-dessus du matelas de ${eur(C.matelas)} que le président veut garder : un crédit n'aurait rien à couvrir.`,
      `La cession Dailly porterait sur la facture de ${factureCedee(s).reference} de CampusTech, ${eur(daillyDeMai(s).nominal)}, que CampusTech paierait à la banque le ${dateEcrite(factureCedee(s).paiement)}, ${jours(joursDuDailly(s))} après le 1er mai.`,
    ],
    chiffres: chiffresDuPlan(s),
    pieces: [CONDITIONS_DE_LA_BANQUE, planDeMai(s, "Le plan de mai, après CampusTech et Électro-Composants")],
    options: CHOIX_DES_DECISIONS[2]!.map((code) => ({ code, texte: libelleDeLaBanque(s, code as ChoixDeLaBanque) })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function consequence(codes: readonly string[]) {
  const s = suiteDe(codes);
  const avant = planSansLimite(suiteDe(codes.slice(0, -1)));
  const apres = planSansLimite(s);
  const compare = (): ChiffreDuScenario[] => [
    { libelle: "Le plus bas du mois", avant: `${eur(avant.plusBas.solde)}, le ${jourDeMai(avant.plusBas.jour)}`, valeur: `${eur(apres.plusBas.solde)}, le ${jourDeMai(apres.plusBas.jour)}`, ton: apres.plusBas.solde < -C.decouvert.autorise ? "alerte" : apres.plusBas.solde >= 0 ? "bon" : undefined },
    { libelle: "Jours sous zéro", avant: jours(avant.joursSousZero), valeur: jours(apres.joursSousZero) },
  ];
  if (codes.length === 1) {
    const textes: Record<ChoixDuClient, string[]> = {
      attendre: [`CampusTech vire ${eur(m.facture)} le ${dateEcrite(FEVRIER.paiement)}, comme chaque mois. Rien ne change au plan, et rien ne coûte.`],
      relancer: [
        `Relancée, CampusTech avance son virement de ${eur(m.facture)} au ${jourDeMai(JOUR_DE_LA_RELANCE_PAYEE)}, le jour de ses règlements fournisseurs : le loyer passe.`,
        "Son acheteur, qui n'avait jamais été relancé, le fait savoir au président : la relation se tend, sans rien coûter.",
      ],
      escompter: [
        `CampusTech accepte : elle vire la facture de mars le 1er mai, escompte déduit, ${eur(m.escompte.net)} au lieu de ${eur(m.facture)}.`,
        `L'escompte coûte ${eur(m.escompte.ttc)} toutes taxes comprises : ${pct(ESCOMPTE_DE_REGLEMENT.taux)} de ${eur(FACTURE_DE_CAMPUSTECH.ht)} hors taxes, ${eur(m.escompte.ht)}, et la TVA qui baisse d'autant. Le ${dateEcrite(MARS.paiement)}, rien ne rentrera plus.`,
      ],
    };
    const r = s.client === "relancer" ? "tendue" : "bonne";
    return { titre: "CampusTech", paragraphes: textes[s.client!], chiffres: [...compare(), { libelle: "Relation avec CampusTech", valeur: RELATIONS[r], ton: r === "bonne" ? ("bon" as const) : undefined }] };
  }
  if (codes.length === 2) {
    const etalement = resultatDeLaSuite({ ...(s as Required<Pick<SuiteDeChoix, "client" | "fournisseur">>), banque: "decouvert" }).couts;
    const textes: Record<ChoixDuFournisseur, string[]> = {
      payer: [`La facture part le 1er mai, ${eur(m.composants)}. Électro-Composants est payé à la date convenue.`],
      etaler: [
        `Électro-Composants accepte : ${eur(m.composants / 2)} le 1er mai, autant le 1er juin, à ${jours(joursDuReport())} de la facture, dans le délai légal.`,
        `Il compte sur la moitié reportée l'intérêt de ses pénalités, ${eur(etalement.etalement)}, et il le note : la relation se tend.`,
      ],
      retarder: [
        `La facture part le ${jourDeMai(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard)}, ${jours(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard - 1)} après l'échéance, sans accord : c'est un retard.`,
        `Les pénalités et l'indemnité de recouvrement sont dues de plein droit, ${eur(etalement.retard)}. Électro-Composants ne livrera plus qu'au comptant : la relation est abîmée.`,
      ],
    };
    const r = s.fournisseur === "retarder" ? "abimee" : s.fournisseur === "etaler" ? "tendue" : "bonne";
    return {
      titre: "Électro-Composants",
      paragraphes: textes[s.fournisseur!],
      chiffres: [...compare(), { libelle: "Relation avec Électro-Composants", valeur: RELATIONS[r], ton: r === "abimee" ? ("alerte" as const) : r === "bonne" ? ("bon" as const) : undefined }],
    };
  }
  const r = resultatDeLaSuite(s as SuiteComplete);
  return { titre: "La banque", paragraphes: [...paragraphesDeLaBanque(r), detailDuCout(r)], chiffres: chiffresDuResultat(r) };
}

function paragraphesDeLaBanque(r: ResultatDeLaSuite): string[] {
  const out: string[] = [];
  const s = r.suite;
  if (s.banque === "credit") {
    out.push(
      r.credit.montant > 0
        ? `La banque verse ${eur(r.credit.montant - r.credit.frais)} le 1er mai, frais déduits ; NOVA rendra ${eur(r.aRendre.credit)} le 1er juin, intérêts compris. Le crédit court ${jours(JOURS_DU_MOIS_BANCAIRE)}, quand le besoin en compte ${jours(planSansLimite(s).joursSousZero)}.`
        : "La banque n'a rien à prêter : le plan ne descend pas sous le matelas du président. Rien ne coûte.",
    );
  } else if (s.banque === "dailly") {
    const d = r.cession!;
    out.push(`La banque avance ${eur(d.net)} le 1er mai sur la facture de ${factureCedee(s).reference}, ${eur(d.nominal)}, pour ${jours(d.jours)} : ${eur(d.interets)} d'intérêts et ${eur(d.frais)} de frais. CampusTech la paiera à la banque.`);
  } else {
    out.push("NOVA reste sur son découvert autorisé : il ne coûte que les jours où le compte est débiteur.");
  }
  for (const x of r.compte.rejets) {
    out.push(
      `Le ${jourDeMai(x.jourPrevu)}, ${x.nom}, ${eur(-x.montant)}, porterait le compte au delà des ${eur(C.decouvert.autorise)} autorisés : la banque le rejette.${x.jourPasse ? ` Le paiement repasse le ${jourDeMai(x.jourPasse)}, une fois CampusTech payée.` : " Le paiement ne repasse pas en mai."}`,
    );
  }
  if (r.compte.agios > 0) out.push(`Le compte reste ${jours(r.compte.joursSousZero)} débiteur, ${eur(r.compte.nombres)} de soldes débiteurs cumulés : ${eur(r.compte.agios)} d'agios, prélevés en juin.`);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "le-client", titre: "Le client", options: CHOIX_DES_DECISIONS[0]! },
  { id: "le-fournisseur", titre: "Le fournisseur", options: CHOIX_DES_DECISIONS[1]! },
  { id: "la-banque", titre: "La banque", options: CHOIX_DES_DECISIONS[2]! },
] as const;

const codesDe = (s: SuiteComplete) => [s.client, s.fournisseur, s.banque];

function resumer(r: ResultatDeLaSuite): SuiteResumee {
  return {
    choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })),
    chiffres: chiffresDuResultat(r),
  };
}

const FINS = {
  rejet: {
    titre: "Un prélèvement rejeté",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Le découvert autorisé ne couvrait pas le trou : la banque a rejeté ${r.compte.rejets.map((x) => x.nom).join(", ")}. Un rejet ne coûte pas seulement ${eur(FRAIS_DE_REJET)} : la banque le note, le créancier aussi.`,
      "Un trou qui dépasse l'autorisation se traite avant le jour où il s'ouvre, jamais le jour même.",
    ],
  },
  retard: {
    titre: "Le fournisseur payé en retard",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Le compte n'est pas passé sous zéro, mais Électro-Composants a été payé ${jours(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard - 1)} après l'échéance, sans accord : ${eur(r.couts.retard)} de pénalités et d'indemnité.`,
      "Un fournisseur qui ne livre plus qu'au comptant prend à NOVA le crédit qu'il lui faisait : le trou de juin sera plus profond.",
    ],
  },
  tenu: {
    titre: "Le mois tenu",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Aucun paiement rejeté, aucun partenaire payé en retard : NOVA traverse mai. ${detailDuCout(r)}`,
    ],
  },
} as const;

/** Ce que coûterait chaque banque, après les deux premières décisions de la meilleure suite. */
function justification(b: ResultatDeLaSuite): string[] {
  const s = b.suite;
  const plan = planSansLimite(s);
  const autres = (["credit", "dailly"] as const).map((banque) => resultatDeLaSuite({ ...s, banque }));
  const sansRelance = resultatDeLaSuite({ ...s, client: "attendre" });
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => libelleDuChoix(s, i).replace(/^./, (x) => x.toLowerCase())).join(" ; ")}. Elle coûte ${eur(b.cout)}.`,
    `La relance est la procédure : la facture de février est échue depuis le ${dateEcrite(FEVRIER.echeance)}. Elle avance ${eur(m.facture)} au ${jourDeMai(JOUR_DE_LA_RELANCE_PAYEE)} et ramène le plus bas à ${eur(plan.plusBas.solde)}, dans l'autorisation, pendant ${jours(plan.joursSousZero)}.`,
    `Sans elle, ${sansRelance.compte.rejets.map((x) => `${x.nom} est rejeté le ${jourDeMai(x.jourPrevu)}`).join(", ")}. Avec elle, le découvert ne coûte que ${eur(b.compte.agios)} d'agios ; le crédit d'un mois aurait coûté ${eur(autres[0]!.cout)}, la cession Dailly ${eur(autres[1]!.cout)}, pour un besoin de quelques jours.`,
    "Le financement suit le besoin : un trou de quelques jours se couvre au découvert, s'il tient dans l'autorisation ; un crédit d'un mois ou une facture cédée se paient pour des jours où l'argent dort.",
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteComplete;
  const r = resultatDeLaSuite(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const ecart = r.cout - b.cout;
  const comparaison: string[] = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuites().length} : aucun rejet, aucun retard, le coût le plus bas.`]
    : [
        `Votre suite coûte ${eur(r.cout)}, la meilleure ${eur(b.cout)}${ecart > 0.005 ? `, soit ${eur(ecart)} de moins` : ""}.`,
        ...(r.abimees > 0 ? ["Elle abîme une relation, ce que la meilleure évite : un rejet ou un retard sans accord se paie au delà du mois."] : []),
        ...DECISIONS.flatMap((d, i) => (codesDe(b.suite)[i] === codes[i] ? [] : [`${d.titre} : vous avez choisi « ${libelleDuChoix(s, i)} » ; la meilleure suite choisit « ${libelleDuChoix(b.suite, i)} ».`])),
      ];
  return {
    fin: { code: r.fin, titre: FINS[r.fin].titre, paragraphes: FINS[r.fin].paragraphes(r) },
    meilleure: memes,
    eleve: resumer(r),
    reference: resumer(b),
    comparaison: [...comparaison, ...justification(b)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

const meilleur = meilleureSuite();
const autresBanques = (["credit", "dailly"] as const).map((banque) => resultatDeLaSuite({ ...meilleur.suite, banque }));

export const LE_DECOUVERT_DE_NOVA: Scenario = {
  code: "le-decouvert-de-nova",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  reprend: ["financer-et-placer-la-tresorerie"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Scénario : le découvert de NOVA",
  accroche: "Le plan de mai passe sous zéro dès le 1er. Le client, le fournisseur, puis la banque : chaque décision change la suivante.",
  objectifs: [
    "Lire un plan de trésorerie au jour le jour et repérer le trou, sa date, sa profondeur et sa durée",
    "Mobiliser d'abord les délais des clients et des fournisseurs, puis choisir le concours bancaire qui colle au besoin",
    "Chiffrer chaque geste : escompte, pénalités, agios, intérêts et frais",
  ],
  libre: false,
  accueil: [
    `Vous tenez la trésorerie de NOVA. Nous sommes le ${dateEcrite(JOUR_DU_SCENARIO)} N+1, et le président vous confie le plan de mai.`,
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez ce qu'elle change au plan ; la suivante part de là. À la fin, un bilan compare votre suite à la meilleure.",
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
      "Un concours bancaire se choisit sur la durée du besoin : le découvert se paie au jour, le crédit au mois, le Dailly jusqu'au paiement du client.",
      "Un délai se négocie avant l'échéance ; payé après sans accord, c'est un retard, et la loi le sanctionne.",
    ],
    questions: [
      {
        id: "le-bon-concours",
        question: "Une fois CampusTech relancée, pourquoi le découvert coûte-t-il moins que le crédit de trésorerie ?",
        options: [
          { texte: "Il ne se paie que les jours où le compte est débiteur", juste: true, retour: `Oui : ${eur(meilleur.compte.agios)} pour ${jours(meilleur.compte.joursSousZero)}, quand le crédit se paie ${jours(JOURS_DU_MOIS_BANCAIRE)} et ses frais, ${eur(autresBanques[0]!.cout)}.` },
          { texte: "Son taux annuel est plus bas que celui du crédit de trésorerie", juste: false, retour: `Non : ${pct(C.decouvert.tauxAnnuel)} l'an pour le découvert, ${pct(C.credit.tauxAnnuel)} pour le crédit. C'est la durée qui fait le coût.` },
          { texte: "La banque ne compte pas d'agios tant que le découvert reste autorisé", juste: false, retour: "Non : le découvert autorisé porte des agios sur chaque jour débiteur ; il est autorisé, pas gratuit." },
          { texte: "Le crédit se rembourse avant la fin du besoin, et il faut en reprendre un", juste: false, retour: "Non : le crédit court tout le mois, bien au delà du besoin ; il dure trop, il ne s'arrête pas trop tôt." },
        ],
      },
      {
        id: "le-retard",
        question: `Régler Électro-Composants le ${jourDeMai(ELECTRO_COMPOSANTS_EN_MAI.jourDuRetard)} sans accord, qu'est-ce que c'est ?`,
        options: [
          { texte: "Un retard, avec ses pénalités et son indemnité", juste: true, retour: `Oui : les pénalités courent dès le lendemain de l'échéance, et l'indemnité de ${eur(INDEMNITE_FORFAITAIRE_DE_RECOUVREMENT)} s'y ajoute, sans relance.` },
          { texte: `Un étalement permis, puisque le délai reste sous les ${jours(DELAI_MAXIMAL_CONVENU.joursDeLaFacture)} de la loi`, juste: false, retour: "Non : le plafond légal borne le délai qu'on convient ; il n'autorise pas à dépasser celui qui est convenu." },
          { texte: "Rien de grave, tant que le fournisseur est payé avant la fin du mois", juste: false, retour: "Non : l'échéance est le 1er mai ; chaque jour après est un jour de retard, et le fournisseur le compte." },
        ],
      },
    ],
  },
};
