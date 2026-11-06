import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import {
  CHOIX_DU_PLAN,
  DUREES_DE_LA_BANQUE,
  JOUR_DU_PLAN,
  PAS_DE_L_EMPRUNT,
  ebaucheDuPlan,
  empruntDuManque,
  empruntQuiEquilibre,
  enCreditBail,
  finDuPlan,
  meilleureSuiteDuPlan,
  montantDuChoix,
  planDeLaSuite,
  planEnCreditBail,
  resultatDuPlan,
  suiteDuPlan,
  toutesLesSuitesDuPlan,
  type ChoixDeLaDuree,
  type ChoixDuMontant,
  type FinDuPlan,
  type ResultatDuPlan,
  type SuiteCompleteDuPlan,
  type SuiteDuPlan,
} from "../monde/boucler-le-plan";
import { auCentime } from "../monde/amortissement";
import { dateEcrite as dateDuCompte } from "../monde/compte-client-de-nova";
import { PLACEMENT } from "../monde/exercice-de-nova";
import { ANNEES_DU_PLAN, CREDIT_BAIL_DE_LA_LIGNE, EMPRUNT_DE_LA_LIGNE, LIGNE_A_FINANCER, MOULES, RESERVE_DE_LA_GAMME, TAUX_DE_L_IMPOT, type PlanDeLaGamme } from "../monde/financement-de-la-gamme";
import type { ChiffreDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : BOUCLER LE PLAN DE LA GAMME (comptabilité générale, palier 4 ; BTS CG P6 6.5.2, DCG UE6
 * 4.4).
 *
 * La suite du chapitre « Le plan de financement », en décisions : début janvier N+1, le plan ébauché de
 * la gamme manque d'argent en N+1, et le président doit dire à la banque ce qu'il lui demande. L'élève,
 * contrôleur de gestion, décide le financement (un emprunt et son montant, ou la ligne en crédit-bail et
 * un emprunt des seuls moules), puis la durée de l'emprunt ; chaque choix se lit dans le plan, année par
 * année. Tous les chiffres se calculent dans le monde du cours (monde/boucler-le-plan.ts, qui
 * lit le plan du chapitre) ; ce fichier écrit les situations, les options et les textes, qui ne partent
 * au navigateur qu'une décision à la fois (pedagogy/cours/scenario-servi.ts).
 *
 * POURQUOI UN SCÉNARIO : le chapitre arbitre un financement. Le financement et la durée d'un emprunt se
 * décident l'un après l'autre, et le second change ce que le premier donne.
 *
 * L'ARBRE : 4 × 3 suites, toutes calculées. Trois fins : un plan qui manque d'argent une année, un plan
 * qui tient mais coûte plus qu'il ne faut (des intérêts pour rien, ou des redevances), le plan bouclé. La meilleure suite, et sa règle :
 * monde/boucler-le-plan.ts, `meilleureSuiteDuPlan`.
 */

/** Un jour du cours, écrit : « 6 janvier ». */
const dateEcrite = (d: { jour: number; mois: number }) => dateDuCompte({ jour: d.jour, mois: d.mois });
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const ans = (n: number) => `${n} an${n >= 2 ? "s" : ""}`;
const minuscule = (t: string) => t.replace(/^./, (x) => x.toLowerCase());

const EBAUCHE = ebaucheDuPlan();
const N1 = ANNEES_DU_PLAN[0];
const DERNIERE = ANNEES_DU_PLAN.at(-1)!;

const LIBELLES_DU_MONTANT: Readonly<Record<ChoixDuMontant, string>> = {
  manque: `Emprunter ${eur(empruntDuManque())}, le manque de ${N1} au plan ébauché, arrondi au millier`,
  equilibre: `Emprunter ${eur(empruntQuiEquilibre())}, le manque de l'ébauche et une marge`,
  ligne: `Emprunter ${eur(LIGNE_A_FINANCER.montant)}, tout le prix de la ligne`,
  "credit-bail": `Prendre la ligne en crédit-bail, et emprunter ${eur(MOULES.montant)} pour les moules`,
};

const LIBELLES_DE_LA_DUREE: Readonly<Record<ChoixDeLaDuree, string>> = {
  courte: `Sur ${ans(DUREES_DE_LA_BANQUE.courte)}, pour en finir vite`,
  habituelle: `Sur ${ans(DUREES_DE_LA_BANQUE.habituelle)}, la durée habituelle de la banque`,
  longue: `Sur ${ans(DUREES_DE_LA_BANQUE.longue)}, pour alléger chaque annuité`,
};

function libelleDuChoix(s: SuiteDuPlan, i: number): string {
  if (i === 0) return LIBELLES_DU_MONTANT[s.montant!];
  return LIBELLES_DE_LA_DUREE[s.duree!];
}

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDuPlan(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = `${dateEcrite(JOUR_DU_PLAN)} N+1`;

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le contrôle de gestion",
  date: JOUR,
  objet: "Ce que nous demandons à la banque",
  paragraphes: [
    "Bonjour,",
    `Le plan ébauché de la gamme manque d'argent en ${N1} : ${eur(EBAUCHE.annees[0]!.solde)}. Je vois la banque la semaine prochaine.`,
    "Dites-moi comment financer la gamme, emprunt ou crédit-bail, puis sur combien de temps emprunter.",
    `Je veux un plan qui tienne chaque année, et qui nous laisse le plus possible fin ${DERNIERE}, ce que nous devrons encore à la banque déduit.`,
    "Merci. Le président",
  ],
};

/** Le plan d'une suite, résumé année par année : les soldes et leur cumul, l'emprunt et ses intérêts. */
function pieceDuPlan(plan: PlanDeLaGamme, titre: string, emprunt: string): PieceDuBureau {
  return {
    code: "plan",
    nature: "note",
    titre,
    de: "Le contrôle de gestion de NOVA",
    a: "Le président",
    date: JOUR,
    objet: emprunt,
    paragraphes: plan.annees.map((a) => `${a.annee} : emplois ${eur(a.emplois)}, ressources ${eur(a.ressources)}, solde ${eur(a.solde)}, cumul ${eur(a.cumul)}.`),
    mention: plan.leviers.creditBail
      ? `Les emplois : les moules en ${N1}, l'augmentation du BFR, le capital remboursé, l'option du crédit-bail en ${DERNIERE}. Les ressources : la réserve en ${N1}, l'emprunt, la CAF, la diminution du BFR. La CAF compte la redevance et les intérêts, après impôt à ${pct(TAUX_DE_L_IMPOT)}.`
      : `Les emplois : la ligne et les moules en ${N1}, l'augmentation du BFR, le capital remboursé. Les ressources : la réserve en ${N1}, l'emprunt, la CAF, la diminution du BFR. La CAF compte les intérêts de l'emprunt, après impôt à ${pct(TAUX_DE_L_IMPOT)}.`,
  };
}

const LE_CREDIT_BAILLEUR: PieceDuBureau = {
  code: "credit-bail",
  nature: "lettre",
  titre: "L'offre du crédit-bailleur",
  de: "Le crédit-bailleur",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "La ligne semi-automatique en crédit-bail",
  paragraphes: [
    `Nous achetons la ligne, ${eur(CREDIT_BAIL_DE_LA_LIGNE.valeur)} HT, et vous la louons ${ans(CREDIT_BAIL_DE_LA_LIGNE.dureeAns)}.`,
    `Vous payez ${CREDIT_BAIL_DE_LA_LIGNE.dureeAns} redevances de ${eur(CREDIT_BAIL_DE_LA_LIGNE.redevance)} HT, le 31 décembre de chaque année, de ${N1} à ${DERNIERE}.`,
    `À la fin du contrat, vous rachetez la ligne pour ${eur(CREDIT_BAIL_DE_LA_LIGNE.option)}. Aucun dépôt de garantie n'est demandé.`,
    "Le contrat ne porte que sur la ligne : les moules restent à votre charge.",
  ],
};

const LA_BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "Les conditions de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Votre emprunt pour la gamme",
  paragraphes: [
    `Nous prêtons à ${pct(EMPRUNT_DE_LA_LIGNE.taux)} l'an, le capital remboursé en parts égales à la fin de chaque année, la première annuité fin ${N1}.`,
    `Durées possibles : ${ans(DUREES_DE_LA_BANQUE.courte)}, ${ans(DUREES_DE_LA_BANQUE.habituelle)} ou ${ans(DUREES_DE_LA_BANQUE.longue)}.`,
    "Nous prêtons sur un plan de financement qui tient chaque année.",
  ],
};

const LA_GAMME: PieceDuBureau = {
  code: "gamme",
  nature: "note",
  titre: "La gamme, ce qu'elle demande",
  de: "Le contrôle de gestion de NOVA",
  a: "Le président",
  date: JOUR,
  paragraphes: [
    `En ${N1}, la ligne semi-automatique, ${eur(LIGNE_A_FINANCER.montant)}, et les moules, ${eur(MOULES.montant)}, payés comptant ; puis le BFR qui grandit avec les ventes.`,
    `Pour les payer : la réserve placée, ${eur(RESERVE_DE_LA_GAMME)}, échue le ${dateEcrite(PLACEMENT.echeance)}, et la CAF de la gamme, année par année.`,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES
// ─────────────────────────────────────────────────────────────────────────────

function chiffresDuPlan(plan: PlanDeLaGamme): ChiffreDuScenario[] {
  return [
    { libelle: `Solde de ${N1}`, valeur: eur(plan.annees[0]!.solde), ton: plan.annees[0]!.solde < 0 ? "alerte" : "bon" },
    { libelle: `Plus petit solde du plan, en ${plan.plusPetit.annee}`, valeur: eur(plan.plusPetit.solde), ton: plan.plusPetit.solde < 0 ? "alerte" : "bon" },
    { libelle: `Solde cumulé fin ${DERNIERE}`, valeur: eur(plan.cumulFinal) },
  ];
}

function chiffresDuResultat(r: ResultatDuPlan): ChiffreDuScenario[] {
  return [
    ...chiffresDuPlan(r.plan),
    { libelle: "Années en déficit", valeur: String(r.deficits.length), ton: r.deficits.length ? "alerte" : "bon" },
    { libelle: "Première annuité", valeur: eur(r.premiereAnnuite) },
    { libelle: "Intérêts de l'emprunt, sur toute sa durée", valeur: eur(r.interetsDeLEmprunt) },
    ...(r.creditBail ? [{ libelle: "Redevances et option du crédit-bail", valeur: eur(r.loyers) }] : []),
    { libelle: `Capital encore dû fin ${DERNIERE}`, valeur: eur(r.restantDu) },
    { libelle: `Laissé à NOVA fin ${DERNIERE}, capital encore dû déduit`, valeur: eur(r.laisse) },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    const a = EBAUCHE.annees[0]!;
    return {
      titre: "Le financement",
      consigne: "Comment financez-vous la gamme ?",
      paragraphes: [
        `Sans emprunt, ${N1} demande ${eur(a.emplois)} d'emplois pour ${eur(a.ressources)} de ressources : il manque ${eur(-a.solde)}. Les années suivantes, la CAF de la gamme suffit.`,
        `Un emprunt entre en ressource en ${N1}. Mais ses intérêts baissent la CAF, et son capital remboursé s'ajoute aux emplois, dès la fin de ${N1}.`,
        `En crédit-bail, la ligne sort des emplois de ${N1}. Mais sa redevance baisse la CAF chaque année, et son option s'ajoute aux emplois de ${DERNIERE}.`,
      ],
      chiffres: chiffresDuPlan(EBAUCHE),
      pieces: [COURRIEL, LA_GAMME, pieceDuPlan(EBAUCHE, "Le plan ébauché, sans emprunt", "Aucun emprunt"), LA_BANQUE, LE_CREDIT_BAILLEUR],
      options: CHOIX_DU_PLAN[0]!.map((code) => ({ code, texte: LIBELLES_DU_MONTANT[code as ChoixDuMontant] })),
    };
  }
  const plan = planDeLaSuite(s);
  const montant = montantDuChoix(s.montant!);
  const cb = enCreditBail(s);
  return {
    titre: "La durée",
    consigne: `Sur combien d'années remboursez-vous les ${eur(montant)}${cb ? " des moules" : ""} ?`,
    paragraphes: [
      `Sur ${ans(DUREES_DE_LA_BANQUE.habituelle)}, le plan finit ${N1} à ${eur(plan.annees[0]!.solde)}, et son plus petit solde est de ${eur(plan.plusPetit.solde)}, en ${plan.plusPetit.annee}.`,
      "Plus l'emprunt est court, plus le capital remboursé chaque année est lourd. Plus il est long, plus il coûte d'intérêts, et ses dernières annuités tombent après le plan.",
    ],
    chiffres: chiffresDuPlan(plan),
    pieces: [pieceDuPlan(plan, `Le plan ${cb ? "en crédit-bail, " : ""}avec ${eur(montant)} sur ${ans(DUREES_DE_LA_BANQUE.habituelle)}`, `${cb ? "Ligne en crédit-bail, emprunt" : "Emprunt"} de ${eur(montant)}`), LA_BANQUE],
    options: CHOIX_DU_PLAN[1]!.map((code) => ({ code, texte: LIBELLES_DE_LA_DUREE[code as ChoixDeLaDuree] })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function consequence(codes: readonly string[]) {
  const s = suiteDe(codes);
  const avant = planDeLaSuite(suiteDe(codes.slice(0, -1)));
  const apres = planDeLaSuite(s);
  const compare = (): ChiffreDuScenario[] => [
    { libelle: `Solde de ${N1}`, avant: eur(avant.annees[0]!.solde), valeur: eur(apres.annees[0]!.solde), ton: apres.annees[0]!.solde < 0 ? "alerte" : "bon" },
    { libelle: "Plus petit solde du plan", avant: `${eur(avant.plusPetit.solde)}, en ${avant.plusPetit.annee}`, valeur: `${eur(apres.plusPetit.solde)}, en ${apres.plusPetit.annee}`, ton: apres.plusPetit.solde < 0 ? "alerte" : "bon" },
  ];
  if (codes.length === 1) {
    const montant = montantDuChoix(s.montant!);
    const premiere = apres.tableauDeLEmprunt[0]!;
    const a = apres.annees[0]!;
    const paragraphes = [
      ...(enCreditBail(s)
        ? [`La ligne en crédit-bail retire ${eur(LIGNE_A_FINANCER.montant)} des emplois de ${N1}, mais sa redevance de ${eur(CREDIT_BAIL_DE_LA_LIGNE.redevance)} baisse l'EBE chaque année, et son option de ${eur(CREDIT_BAIL_DE_LA_LIGNE.option)} s'ajoute aux emplois de ${DERNIERE}.`]
        : []),
      `Sur ${ans(DUREES_DE_LA_BANQUE.habituelle)}, les ${eur(montant)} entrent en ressource en ${N1}. Mais la fin de l'année rembourse déjà ${eur(premiere.capital)} de capital, et ses ${eur(premiere.interets)} d'intérêts baissent la CAF de ${eur(auCentime(premiere.interets * (1 - TAUX_DE_L_IMPOT)))}, après impôt.`,
      a.solde < 0
        ? `${N1} finit encore à ${eur(a.solde)} : l'emprunt couvre le manque de l'ébauche, pas ce qu'il coûte lui-même la première année.`
        : `${N1} finit à ${eur(a.solde)} : le plan tient la première année.`,
    ];
    return { titre: "Le financement", paragraphes, chiffres: compare() };
  }
  const r = resultatDuPlan(s as SuiteCompleteDuPlan);
  return { titre: "La durée", paragraphes: paragraphesDeLaDuree(r), chiffres: chiffresDuResultat(r) };
}

function paragraphesDeLaDuree(r: ResultatDuPlan): string[] {
  const premiere = r.plan.tableauDeLEmprunt[0]!;
  const out = [`Sur ${ans(r.duree)}, la première annuité est de ${eur(r.premiereAnnuite)} : ${eur(premiere.capital)} de capital et ${eur(premiere.interets)} d'intérêts.`];
  if (r.deficits.length) out.push(`Le plan manque d'argent en ${r.deficits.map((a) => `${a.annee}, ${eur(a.solde)}`).join(" ; ")}. La banque ne prête pas sur un plan qui ne tient pas.`);
  else out.push(`Chaque année tient : le plus petit solde est de ${eur(r.plan.plusPetit.solde)}, en ${r.plan.plusPetit.annee}.`);
  out.push(`L'emprunt coûte ${eur(r.interetsDeLEmprunt)} d'intérêts sur toute sa durée.`);
  if (r.creditBail) out.push(`Le crédit-bail fait payer ${eur(r.loyers)} pendant le plan, redevances et option, pour une ligne de ${eur(LIGNE_A_FINANCER.montant)}.`);
  if (r.restantDu > 0) out.push(`Fin ${DERNIERE}, il reste ${eur(r.restantDu)} de capital à rembourser, et ${eur(r.interetsApresLePlan)} d'intérêts tombent après le plan : le cumul du plan ne les voit pas.`);
  out.push(`Fin ${DERNIERE}, le plan laisse ${eur(r.laisse)} à NOVA, le capital encore dû déduit.`);
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "le-montant", titre: "Le financement", options: CHOIX_DU_PLAN[0]! },
  { id: "la-duree", titre: "La durée", options: CHOIX_DU_PLAN[1]! },
] as const;

const codesDe = (s: SuiteCompleteDuPlan) => [s.montant, s.duree];

function resumer(r: ResultatDuPlan): SuiteResumee {
  return {
    choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })),
    chiffres: chiffresDuResultat(r),
  };
}

const FINS: Readonly<Record<FinDuPlan, { titre: string; paragraphes: (r: ResultatDuPlan) => string[] }>> = {
  deficit: {
    titre: "Un plan qui ne tient pas",
    paragraphes: (r) => [
      `Le plan manque d'argent en ${r.deficits.map((a) => a.annee).join(" et ")} : la banque renvoie le dossier. Un emprunt d'équilibrage se calcule avec ses propres conséquences, ses intérêts et sa première annuité.`,
    ],
  },
  lourd: {
    titre: "Un plan qui tient, mais trop cher",
    paragraphes: (r) => [
      r.creditBail
        ? `Le plan tient chaque année, mais laisse ${eur(r.laisse)} fin ${DERNIERE}, contre ${eur(meilleureSuiteDuPlan().laisse)} au mieux. Le crédit-bail se paie en redevances, et l'emprunt des moules en intérêts, quand le plan en crédit-bail tenait sans lui.`
        : `Le plan tient chaque année, mais l'emprunt coûte ${eur(r.interetsDeLEmprunt)} d'intérêts, pour un besoin qui en demandait moins. L'argent emprunté au delà du besoin dort, et se paie.`,
    ],
  },
  tenu: {
    titre: "Le plan bouclé",
    paragraphes: (r) => [`Chaque année tient, et le plan laisse le plus à NOVA fin ${DERNIERE} : ${eur(r.laisse)}, pour ${eur(r.interetsDeLEmprunt)} d'intérêts. Le président peut aller voir la banque.`],
  },
};

/** Pourquoi la meilleure suite l'est, chiffres à l'appui. */
function justification(b: ResultatDuPlan): string[] {
  const court = resultatDuPlan({ ...b.suite, duree: "courte" });
  const long = resultatDuPlan({ ...b.suite, duree: "longue" });
  const cb = planEnCreditBail();
  const cbEtMoules = resultatDuPlan({ ...b.suite, montant: "credit-bail" });
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => minuscule(libelleDuChoix(b.suite, i))).join(", ")}. Elle coûte ${eur(b.interetsDeLEmprunt)} d'intérêts et laisse ${eur(b.laisse)} fin ${DERNIERE}.`,
    `Le manque de l'ébauche, ${eur(-EBAUCHE.annees[0]!.solde)}, ne suffit pas : l'emprunt rembourse déjà du capital et paie des intérêts en ${N1}. Le plus petit emprunt qui équilibre, au pas de ${eur(PAS_DE_L_EMPRUNT)}, est de ${eur(b.emprunt)}.`,
    `Sur ${ans(court.duree)}, la première annuité, ${eur(court.premiereAnnuite)}, laisse ${N1} à ${eur(court.plan.annees[0]!.solde)}. Sur ${ans(long.duree)}, le plan tient, mais l'emprunt coûte ${eur(long.interetsDeLEmprunt)} d'intérêts.`,
    `La ligne en crédit-bail coûte ${eur(cbEtMoules.loyers)} de redevances et d'option pour ${eur(LIGNE_A_FINANCER.montant)} de ligne. Avec l'emprunt des moules sur ${ans(cbEtMoules.duree)}, le plan laisse ${eur(cbEtMoules.laisse)} fin ${DERNIERE}.`,
    `Sans emprunt du tout, le plan en crédit-bail tient aussi et laisse ${eur(cb.cumulFinal)}, contre ${eur(b.laisse)} : c'est le repli si la banque refusait.`,
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteCompleteDuPlan;
  const r = resultatDuPlan(s);
  const b = meilleureSuiteDuPlan();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const fin = finDuPlan(r);
  const ecart = auCentime(b.laisse - r.laisse);
  const comparaison: string[] = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuitesDuPlan().length} : le plan tient chaque année, au moindre coût.`]
    : [
        r.equilibre
          ? `Votre plan laisse ${eur(r.laisse)} à NOVA fin ${DERNIERE}, celui de la meilleure suite ${eur(b.laisse)}, soit ${eur(ecart)} de plus.`
          : `Votre plan manque d'argent une année au moins ; celui de la meilleure suite tient chaque année, et laisse ${eur(b.laisse)} fin ${DERNIERE}.`,
        ...DECISIONS.flatMap((d, i) => (codesDe(b.suite)[i] === codes[i] ? [] : [`${d.titre} : vous avez choisi « ${libelleDuChoix(s, i)} » ; la meilleure suite choisit « ${libelleDuChoix(b.suite, i)} ».`])),
      ];
  return {
    fin: { code: fin, titre: FINS[fin].titre, paragraphes: FINS[fin].paragraphes(r) },
    meilleure: memes,
    eleve: resumer(r),
    reference: resumer(b),
    comparaison: [...comparaison, ...justification(b)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

const meilleur = meilleureSuiteDuPlan();
const duManque = resultatDuPlan({ montant: "manque", duree: "habituelle" });
const plusLong = resultatDuPlan({ ...meilleur.suite, duree: "longue" });
const enCreditBailSansEmprunt = planEnCreditBail();

export const BOUCLER_LE_PLAN_DE_LA_GAMME: Scenario = {
  code: "boucler-le-plan-de-la-gamme",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  reprend: ["le-plan-de-financement"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Scénario : boucler le plan de la gamme",
  accroche: `Le plan ébauché manque d'argent en ${N1}. Un emprunt ou le crédit-bail, puis la durée de l'emprunt : chaque choix se lit dans le plan, année par année.`,
  objectifs: [
    "Équilibrer un plan de financement par un emprunt, ses intérêts et ses remboursements compris",
    "Comparer dans le plan un emprunt et un crédit-bail, ses redevances et son option comprises",
    "Mesurer l'effet de la durée d'un emprunt sur chaque année du plan et sur son coût",
    "Choisir le financement qui tient chaque année au moindre coût",
  ],
  libre: false,
  accueil: [
    `Vous tenez le contrôle de gestion de NOVA. Nous sommes le ${JOUR}, et le président prépare sa demande à la banque pour la gamme.`,
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
      "Un emprunt d'équilibrage change le plan qu'il équilibre : ses intérêts baissent la CAF, son capital remboursé s'ajoute aux emplois.",
      "La durée se choisit sur le plan : assez longue pour que chaque année tienne, pas plus, car chaque année de plus se paie en intérêts.",
      `Le crédit-bail soulage la première année, mais ses redevances et son option coûtent plus que l'emprunt : le plan le montre fin ${DERNIERE}.`,
    ],
    questions: [
      {
        id: "le-manque",
        question: `Pourquoi emprunter ${eur(duManque.emprunt)}, le manque de ${N1} à l'ébauche, ne suffit-il pas ?`,
        options: [
          { texte: `L'emprunt pèse lui-même sur ${N1}`, juste: true, retour: `Oui : ${eur(duManque.plan.tableauDeLEmprunt[0]!.capital)} de capital remboursé et des intérêts dès la fin de ${N1}. Le plan finit l'année à ${eur(duManque.plan.annees[0]!.solde)}.` },
          { texte: "La banque retient des frais de dossier sur le montant prêté", juste: false, retour: "Non : les conditions de la banque ne parlent d'aucun frais. C'est l'emprunt lui-même, son capital et ses intérêts, qui pèse sur l'année." },
          { texte: `Le BFR de ${N1} grandit quand NOVA emprunte davantage`, juste: false, retour: "Non : le BFR suit les ventes de la gamme, pas l'emprunt. Il est le même dans tous les plans." },
        ],
      },
      {
        id: "la-duree",
        question: `Sur ${ans(plusLong.duree)}, le plan tient et ${N1} respire. Pourquoi n'est-ce pas la meilleure durée ?`,
        options: [
          { texte: "Il coûte plus d'intérêts", juste: true, retour: `Oui : ${eur(plusLong.interetsDeLEmprunt)} d'intérêts sur toute sa durée, contre ${eur(meilleur.interetsDeLEmprunt)} sur ${ans(meilleur.duree)}, et ${eur(plusLong.restantDu)} encore dus fin ${DERNIERE}.` },
          { texte: `Ses annuités sont trop lourdes pour la CAF de ${N1}`, juste: false, retour: "Non : plus l'emprunt est long, plus ses annuités sont légères. C'est son coût qui monte." },
          { texte: "La banque refuse les emprunts qui dépassent la durée du plan", juste: false, retour: `Non : la banque propose ${ans(DUREES_DE_LA_BANQUE.longue)}. Mais les annuités qui tombent après le plan se paieront quand même.` },
        ],
      },
      {
        id: "le-credit-bail",
        question: `En crédit-bail, sans aucun emprunt, ${N1} finit à ${eur(enCreditBailSansEmprunt.annees[0]!.solde)}. Pourquoi le contrôleur ne le retient-il pas ?`,
        options: [
          {
            texte: `Il laisse moins à NOVA fin ${DERNIERE}`,
            juste: true,
            retour: `Oui : ${eur(enCreditBailSansEmprunt.cumulFinal)} fin ${DERNIERE}, contre ${eur(meilleur.laisse)} avec l'emprunt de ${eur(meilleur.emprunt)}. Les redevances et l'option coûtent plus que les intérêts, même après impôt.`,
          },
          { texte: "Sa redevance ne se déduit pas du résultat imposable", juste: false, retour: "Non : la redevance est une charge déductible. C'est l'amortissement de la ligne que NOVA perd, puisqu'elle n'en est pas propriétaire." },
          { texte: "Le crédit-bailleur demande un dépôt de garantie que NOVA ne peut pas verser", juste: false, retour: "Non : l'offre du crédit-bailleur ne demande aucun dépôt de garantie." },
        ],
      },
    ],
  },
};
