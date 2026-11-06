import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { CREDIT_BAIL_DE_LA_LIGNE, EMPRUNT_DE_LA_LIGNE, LIGNE_A_FINANCER, TAUX_DE_L_IMPOT } from "../monde/financement-de-la-gamme";
import {
  CHOIX_DES_DECISIONS,
  CONTRE_OFFRES,
  creditBailMoinsCher,
  lectureDe,
  lectureDeLEmprunt,
  meilleureSuite,
  resultatDeLaSuite,
  suiteDesCodes,
  toutesLesSuites,
  type ContreOffre,
  type Methode,
  type ResultatDeLaLigne,
  type Signature,
  type SuiteCompleteDeLaLigne,
  type SuiteDeLaLigne,
} from "../monde/ligne-en-credit-bail";
import type { ChiffreDuScenario, ConsequenceDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LA LIGNE EN CRÉDIT-BAIL (comptabilité générale, palier 4 ; la suite du chapitre « Emprunt
 * ou crédit-bail : le coût après impôt » et de son cas, « Le banc en crédit-bail »).
 *
 * Début N+1, NOVA doit financer sa ligne semi-automatique. La banque prête à 5 % ; le crédit-bailleur
 * propose son offre, puis, quand NOVA hésite, trois contre-offres. L'élève décide pour le président :
 * comment comparer, quelle contre-offre demander, quoi signer. La méthode choisie d'abord décide des
 * chiffres qu'il voit ensuite : une méthode fausse peut faire écarter la bonne offre, ou retenir la
 * mauvaise. Tous les chiffres se calculent dans le monde du cours (monde/ligne-en-credit-bail.ts) ; ce
 * fichier écrit les situations, les options et les textes, servis une décision à la fois.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`.replace(/^-/, "−");
const e = lectureDeLEmprunt();
const base = lectureDe();
const cb = CREDIT_BAIL_DE_LA_LIGNE;

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDesCodes(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

const LIBELLES_DES_METHODES: Readonly<Record<Methode, string>> = {
  "avant-impot": "Comparer les taux : celui du crédit-bail, avant impôt, face aux 5 % de la banque",
  decaissements: "Comparer ce que NOVA paiera en tout, d'un côté et de l'autre",
  van: "Actualiser les flux après impôt, au coût de l'emprunt après impôt",
};

const NOMS_DES_METHODES: Readonly<Record<Methode, string>> = {
  "avant-impot": "les taux avant impôt",
  decaissements: "la somme payée",
  van: "la valeur actuelle après impôt",
};

/** Une offre de crédit-bail écrite : sa redevance, son option, son dépôt. */
function offreEcrite(l: ReturnType<typeof lectureDe>["leviers"]) {
  const depot = l.depot ? `, un dépôt de garantie de ${eur(l.depot)} rendu sans intérêts à la fin` : "";
  return `${l.dureeAns} redevances de ${eur(l.redevance)}, une option de ${eur(l.option)}${depot}`;
}

const LIBELLES_DES_CONTRE_OFFRES: Readonly<Record<ContreOffre, string>> = {
  depot: `Le dépôt : ${offreEcrite(lectureDe(CONTRE_OFFRES.depot).leviers)}`,
  "option-haute": `L'option haute : ${offreEcrite(lectureDe(CONTRE_OFFRES["option-haute"]).leviers)}`,
  "option-basse": `L'option basse : ${offreEcrite(lectureDe(CONTRE_OFFRES["option-basse"]).leviers)}`,
};

function libelleDeLaSignature(s: SuiteDeLaLigne, x: Signature) {
  if (x === "emprunt") return `Signer l'emprunt de la banque, ${eur(EMPRUNT_DE_LA_LIGNE.montant)} à ${pct(EMPRUNT_DE_LA_LIGNE.taux)}`;
  if (x === "base") return "Signer l'offre de base du crédit-bailleur";
  return `Signer la contre-offre : ${LIBELLES_DES_CONTRE_OFFRES[s.contreOffre!].split(" : ")[0]!.toLowerCase()}`;
}

function libelleDuChoix(s: SuiteDeLaLigne, i: number) {
  if (i === 0) return LIBELLES_DES_METHODES[s.methode!];
  if (i === 1) return LIBELLES_DES_CONTRE_OFFRES[s.contreOffre!];
  return libelleDeLaSignature(s, s.signature!);
}

/** Le choix dit court, pour les comparaisons du bilan : une contre-offre par son seul nom. */
const libelleCourt = (s: SuiteDeLaLigne, i: number) => (i === 1 ? LIBELLES_DES_CONTRE_OFFRES[s.contreOffre!].split(" : ")[0]! : libelleDuChoix(s, i));

/** Ce qu'une méthode dit d'une offre de crédit-bail : son chiffre, face à celui de l'emprunt. */
function chiffreDeLaMethode(m: Methode, libelle: string, l: ReturnType<typeof lectureDe>): ChiffreDuScenario {
  if (m === "avant-impot") return { libelle, valeur: `${pct(l.tauxAvantImpot)} avant impôt, contre ${pct(e.taux)}` };
  if (m === "decaissements") return { libelle, valeur: `${eur(l.totalPaye)} payés, contre ${eur(e.totalPaye)}` };
  return { libelle, valeur: `${eur(l.van)} de valeur actuelle après impôt, face à l'emprunt` };
}

const verdict = (m: Methode, l: ReturnType<typeof lectureDe>) => (creditBailMoinsCher(m, l) ? "le crédit-bail paraît moins cher que l'emprunt" : "le crédit-bail paraît plus cher que l'emprunt");

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La direction financière",
  date: "4 janvier N+1",
  objet: "Financer la ligne",
  paragraphes: [
    "Bonjour,",
    `Pour la ligne semi-automatique, ${eur(LIGNE_A_FINANCER.montant)}, j'ai deux offres : la banque et un crédit-bailleur. Je veux le moins cher, après impôt.`,
    "Dites-moi comment vous comparez, puis ce que je signe. Le crédit-bailleur se dit prêt à revoir son offre.",
    "Merci. Le président",
  ],
};

const OFFRE_DE_LA_BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "Offre de prêt de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Le financement de votre ligne",
  paragraphes: [
    `Nous vous prêtons ${eur(EMPRUNT_DE_LA_LIGNE.montant)} au taux de ${pct(EMPRUNT_DE_LA_LIGNE.taux)} l'an, sur ${EMPRUNT_DE_LA_LIGNE.dureeAns} ans, le capital remboursé en parts égales à la fin de chaque année.`,
  ],
};

const OFFRE_DE_BASE: PieceDuBureau = {
  code: "credit-bail",
  nature: "contrat",
  titre: "Projet de contrat de crédit-bail",
  de: "Un crédit-bailleur",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "La location de votre ligne, avec option d'achat",
  paragraphes: [
    `Nous achetons la ligne, ${eur(cb.valeur)} hors taxes, et vous la louons : ${offreEcrite(base.leviers)}, à lever à la fin du contrat.`,
    "Les redevances se paient à la fin de chaque année. La ligne rachetée s'amortit sur l'année d'usage qui lui reste.",
  ],
};

const NOTE_FISCALE: PieceDuBureau = {
  code: "impot",
  nature: "note",
  titre: "Note sur l'impôt de NOVA",
  de: "La direction financière",
  a: "Le président de NOVA",
  date: "décembre N",
  objet: "Ce que l'impôt change",
  paragraphes: [
    `Chaque euro de charge déductible épargne ${pct(TAUX_DE_L_IMPOT)} d'impôt à NOVA.`,
    `Les intérêts d'un emprunt sont déductibles, comme les redevances d'un crédit-bail. Achetée, la ligne s'amortit sur ${LIGNE_A_FINANCER.dureeDAmortissement} ans ; louée, NOVA ne l'amortit pas.`,
  ],
};

function contreOffres(): PieceDuBureau {
  return {
    code: "contre-offres",
    nature: "lettre",
    titre: "Les contre-offres du crédit-bailleur",
    de: "Un crédit-bailleur",
    a: "Le président de NOVA",
    date: "8 janvier N+1",
    objet: "Trois aménagements possibles",
    paragraphes: ["Nous pouvons aménager notre offre de l'une de ces trois façons, au choix :", ...Object.values(LIBELLES_DES_CONTRE_OFFRES).map((t) => `${t}.`)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS ET LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    return {
      titre: "La méthode",
      consigne: "Comment comparez-vous l'emprunt et le crédit-bail ?",
      paragraphes: [
        `La banque prête ${eur(EMPRUNT_DE_LA_LIGNE.montant)} à ${pct(EMPRUNT_DE_LA_LIGNE.taux)}. Le crédit-bailleur demande ${offreEcrite(base.leviers)}.`,
        "Autour de la table, chacun a sa façon de comparer. Celle que vous retenez décidera des chiffres que vous mettrez sous les yeux du président.",
      ],
      chiffres: [
        { libelle: "Prix de la ligne", valeur: eur(LIGNE_A_FINANCER.montant) },
        { libelle: "Taux de la banque", valeur: pct(EMPRUNT_DE_LA_LIGNE.taux) },
        { libelle: "Taux de l'impôt de NOVA", valeur: pct(TAUX_DE_L_IMPOT) },
      ],
      pieces: [COURRIEL, OFFRE_DE_LA_BANQUE, OFFRE_DE_BASE, NOTE_FISCALE],
      options: CHOIX_DES_DECISIONS[0]!.map((code) => ({ code, texte: LIBELLES_DES_METHODES[code as Methode] })),
    };
  }
  const m = s.methode!;
  if (avant.length === 1) {
    return {
      titre: "La contre-offre",
      consigne: "Le crédit-bailleur propose trois aménagements. Lequel lui demandez-vous de mettre au contrat ?",
      paragraphes: [
        `Par ${NOMS_DES_METHODES[m]}, l'offre de base ne convainc pas : ${verdict(m, base)}. Le crédit-bailleur revient avec trois aménagements.`,
        "Voici ce que votre méthode dit de chacun.",
      ],
      chiffres: (Object.keys(CONTRE_OFFRES) as ContreOffre[]).map((c) => chiffreDeLaMethode(m, LIBELLES_DES_CONTRE_OFFRES[c].split(" : ")[0]!, lectureDe(CONTRE_OFFRES[c]))),
      pieces: [contreOffres(), OFFRE_DE_LA_BANQUE],
      options: CHOIX_DES_DECISIONS[1]!.map((code) => ({ code, texte: LIBELLES_DES_CONTRE_OFFRES[code as ContreOffre] })),
    };
  }
  const c = lectureDe(CONTRE_OFFRES[s.contreOffre!]);
  return {
    titre: "La signature",
    consigne: "Le président attend votre conseil. Que signe NOVA ?",
    paragraphes: [
      `Le crédit-bailleur a rédigé la contre-offre demandée : ${offreEcrite(c.leviers)}. L'offre de base reste valable, comme celle de la banque.`,
      `Par ${NOMS_DES_METHODES[m]}, pour la contre-offre, ${verdict(m, c)}.`,
    ],
    chiffres: [chiffreDeLaMethode(m, "La contre-offre", c), chiffreDeLaMethode(m, "L'offre de base", base)],
    pieces: [OFFRE_DE_LA_BANQUE, OFFRE_DE_BASE],
    options: CHOIX_DES_DECISIONS[2]!.map((code) => ({ code, texte: libelleDeLaSignature(s, code as Signature) })),
  };
}

function consequence(codes: readonly string[]): ConsequenceDuScenario {
  const s = suiteDe(codes);
  const m = s.methode!;
  if (codes.length === 1) {
    const paragraphes: Record<Methode, string[]> = {
      "avant-impot": [`Le taux que fait payer le crédit-bailleur, redevances et option seules, est de ${pct(base.tauxAvantImpot)} ; la banque prête à ${pct(e.taux)}.`],
      decaissements: [`Le crédit-bail fera payer ${eur(base.totalPaye)}, redevances et option ; l'emprunt, ${eur(e.totalPaye)}, capital et intérêts.`],
      van: [
        `Les flux du crédit-bail : la ligne que NOVA n'achète pas, puis chaque année la redevance moins l'impôt qu'elle épargne, et l'économie d'impôt perdue sur l'amortissement ; l'option, la dernière année.`,
        `Actualisés au coût de l'emprunt après impôt, ${pct(e.coutApresImpot)}, ils valent ${eur(base.van)}.`,
      ],
    };
    return { titre: "La méthode", paragraphes: [...paragraphes[m], `Par ${NOMS_DES_METHODES[m]}, ${verdict(m, base)}.`], chiffres: [chiffreDeLaMethode(m, "L'offre de base", base)] };
  }
  if (codes.length === 2) {
    const c = lectureDe(CONTRE_OFFRES[s.contreOffre!]);
    return {
      titre: "La contre-offre",
      paragraphes: [`Le crédit-bailleur accepte de rédiger cette contre-offre : ${offreEcrite(c.leviers)}.`, `Par ${NOMS_DES_METHODES[m]}, ${verdict(m, c)}.`],
      chiffres: [chiffreDeLaMethode(m, "La contre-offre", c)],
    };
  }
  const r = resultatDeLaSuite(s as SuiteCompleteDeLaLigne);
  return { titre: "La signature", paragraphes: paragraphesDeLaSignature(r), chiffres: chiffresDuResultat(r) };
}

function paragraphesDeLaSignature(r: ResultatDeLaLigne): string[] {
  const s = r.suite;
  const signe = s.signature === "emprunt" ? `NOVA signe l'emprunt de ${eur(EMPRUNT_DE_LA_LIGNE.montant)}.` : `NOVA signe le crédit-bail : ${offreEcrite(r.signee!.leviers)}.`;
  const mesure =
    s.signature === "emprunt"
      ? `Mesurée au coût de l'emprunt après impôt, ${pct(e.coutApresImpot)}, la contre-offre valait ${eur(r.contre.van)} face à l'emprunt.`
      : `Mesuré au coût de l'emprunt après impôt, ${pct(e.coutApresImpot)}, ce crédit-bail vaut ${eur(r.gain)} face à l'emprunt : ${r.gain >= 0 ? "il coûte moins" : "il coûte plus"}.`;
  return [signe, mesure];
}

function chiffresDuResultat(r: ResultatDeLaLigne): ChiffreDuScenario[] {
  return [
    { libelle: "Ce que NOVA gagne face à l'emprunt, en valeur actuelle après impôt", valeur: eur(r.gain), ton: r.gain > 1e-9 ? "bon" : r.gain < -1e-9 ? "alerte" : undefined },
    { libelle: "Le mieux que la table permettait", valeur: eur(r.meilleurDeLaTable) },
    { libelle: "Taux du financement signé, après impôt", valeur: pct(r.signee ? r.signee.tauxApresImpot : e.coutApresImpot) },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "la-methode", titre: "La méthode", options: CHOIX_DES_DECISIONS[0]! },
  { id: "la-contre-offre", titre: "La contre-offre", options: CHOIX_DES_DECISIONS[1]! },
  { id: "la-signature", titre: "La signature", options: CHOIX_DES_DECISIONS[2]! },
] as const;

const codesDe = (s: SuiteCompleteDeLaLigne) => [s.methode, s.contreOffre, s.signature];
const resumer = (r: ResultatDeLaLigne): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDuResultat(r) });

const FINS = {
  "plus-cher": {
    titre: "Un crédit-bail plus cher que l'emprunt",
    paragraphes: (r: ResultatDeLaLigne) => [`Le crédit-bail signé coûte ${eur(-r.gain)} de plus que l'emprunt, en valeur actuelle après impôt. Une offre se juge sur ses flux après impôt, actualisés, pas sur ce qu'elle affiche.`],
  },
  "economie-manquee": {
    titre: "Une économie manquée",
    paragraphes: (r: ResultatDeLaLigne) => [`NOVA n'a rien perdu face à l'emprunt, mais la table offrait ${eur(r.meilleurDeLaTable)} de mieux, en valeur actuelle après impôt.`],
  },
  "le-moins-cher": {
    titre: "Le moins cher de la table",
    paragraphes: (r: ResultatDeLaLigne) => [`NOVA a signé le financement le moins cher de ceux qu'elle avait sous les yeux : ${eur(r.gain)} face à l'emprunt, en valeur actuelle après impôt.`],
  },
} as const;

function justification(b: ResultatDeLaLigne): string[] {
  const lectures = (Object.keys(CONTRE_OFFRES) as ContreOffre[]).map((c) => ({ c, l: lectureDe(CONTRE_OFFRES[c]) }));
  const depot = lectures.find((x) => x.c === "depot")!.l;
  const haute = lectures.find((x) => x.c === "option-haute")!.l;
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => libelleDuChoix(b.suite, i).replace(/^./, (x) => x.toLowerCase())).join(" ; ")}. Elle fait gagner ${eur(b.gain)} face à l'emprunt.`,
    `Seule la valeur actuelle après impôt compte tout : l'impôt épargné, l'économie perdue sur l'amortissement, et la date de chaque flux. Le dépôt paraît moins cher par la somme payée, ${eur(depot.totalPaye)} ; il coûte pourtant ${eur(-depot.van)} de plus que l'emprunt.`,
    `L'option haute paraît plus chère par la somme payée, ${eur(haute.totalPaye)} contre ${eur(e.totalPaye)} ; elle fait pourtant gagner ${eur(haute.van)}, parce que l'option se paie à la fin.`,
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteCompleteDeLaLigne;
  const r = resultatDeLaSuite(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const memeGain = Math.abs(r.gain - b.gain) < 1e-9;
  const comparaison: string[] = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuites().length} : la bonne méthode, la bonne contre-offre, la bonne signature.`]
    : [
        memeGain
          ? "Vous avez signé le même financement que la meilleure suite, mais votre méthode ne pouvait pas le justifier : elle pouvait aussi bien vous faire signer le mauvais."
          : `Votre suite vaut ${eur(r.gain)} face à l'emprunt, la meilleure ${eur(b.gain)} : ${eur(b.gain - r.gain)} de mieux.`,
        ...DECISIONS.flatMap((d, i) => (codesDe(b.suite)[i] === codes[i] ? [] : [`${d.titre} : vous avez choisi « ${libelleCourt(s, i)} » ; la meilleure suite choisit « ${libelleCourt(b.suite, i)} ».`])),
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

const depotLu = lectureDe(CONTRE_OFFRES.depot);

export const LA_LIGNE_EN_CREDIT_BAIL: Scenario = {
  code: "la-ligne-en-credit-bail",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["emprunt-ou-credit-bail"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Scénario : la ligne en crédit-bail",
  accroche: "La banque prête à 5 %, le crédit-bailleur revoit son offre. Choisissez comment comparer, quelle contre-offre demander, puis ce que NOVA signe : la méthode décide de ce que vous verrez.",
  objectifs: [
    "Choisir la méthode qui compare un emprunt et un crédit-bail après impôt",
    "Juger des contre-offres : une redevance, une option, un dépôt de garantie",
    "Conseiller une signature, chiffres actualisés à l'appui",
  ],
  libre: false,
  accueil: [
    "Début janvier N+1. NOVA a choisi sa ligne semi-automatique ; il reste à la financer, et le président vous confie le dossier.",
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez ce qu'elle donne ; la suivante part de là. À la fin, un bilan compare votre suite à la meilleure.",
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
      "Un financement se juge sur ses flux après impôt, actualisés au coût de l'emprunt après impôt. Le crédit-bail perd l'économie d'impôt sur l'amortissement : c'est ce que les taux affichés ne disent pas.",
    ],
    questions: [
      {
        id: "le-depot",
        question: `Le dépôt de garantie de ${eur(depotLu.leviers.depot)} est rendu à la fin du contrat. Pourquoi coûte-t-il quand même ?`,
        options: [
          { texte: `Il est rendu sans intérêts, ${cb.dureeAns} ans plus tard`, juste: true, retour: `Oui : NOVA prête cet argent au crédit-bailleur pour rien. Rendu dans ${cb.dureeAns} ans, il vaut moins aujourd'hui : la contre-offre perd ${eur(-depotLu.van)} face à l'emprunt.` },
          { texte: "Il ne coûte rien, puisque NOVA le récupère en entier", juste: false, retour: `Non : récupérer la même somme ${cb.dureeAns} ans plus tard, c'est perdre ce qu'elle aurait rapporté entre-temps.` },
          { texte: "Il est imposé comme une charge l'année de son versement, et l'impôt de NOVA monte d'autant", juste: false, retour: "Non : un dépôt n'est pas une charge, c'est une créance. C'est le temps qui le rend coûteux, pas l'impôt." },
        ],
      },
      {
        id: "l-economie-perdue",
        question: "Pourquoi le crédit-bail coûte-t-il plus, après impôt, que ce que dit son taux avant impôt face à l'emprunt ?",
        options: [
          { texte: "NOVA perd l'économie d'impôt sur l'amortissement", juste: true, retour: `Oui : non propriétaire, NOVA n'amortit pas la ligne, et perd chaque année ${pct(TAUX_DE_L_IMPOT)} de la dotation en impôt épargné.` },
          { texte: "Les redevances ne sont pas déductibles, contrairement aux intérêts", juste: false, retour: "Non : les redevances sont déductibles en entier. C'est l'amortissement de la ligne que NOVA perd." },
          { texte: "Le crédit-bailleur facture la TVA sur les redevances, et NOVA ne peut pas la récupérer", juste: false, retour: "Non : la TVA des redevances se déduit, comme celle d'un achat. Le cours compare hors taxes." },
        ],
      },
    ],
  },
};
