import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { dateDe } from "../chapitres/la-cloture";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import {
  CHOIX_DES_DECISIONS,
  meilleureSuite,
  prudenceDuScenario,
  resultatApres,
  resultatDeLaSuite,
  suiteDesCodes,
  toutesLesSuites,
  type ChoixDeLaCreance,
  type ChoixDuLitige,
  type ChoixDuStockEtDeLaLigne,
  type ResultatDeLaSuite,
  type SuiteComplete,
  type SuiteDeChoix,
} from "../monde/objectif-du-president";
import type { ChiffreDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : L'OBJECTIF DU PRÉSIDENT (comptabilité générale, palier 4 ; la suite du chapitre
 * « Dépréciations et provisions » et de son cas, « La créance qui se dégrade »).
 *
 * Au 31 décembre N, le président de NOVA a promis à la banque au moins 90 000 € de résultat avant impôt.
 * L'élève arrête la prudence de l'exercice, une décision après l'autre : la créance de Sonora, le litige,
 * puis le stock de composants et la ligne. Chaque décision montre le résultat qu'elle laisse, face à
 * l'objectif. Tous les chiffres se calculent dans le monde du cours (monde/objectif-du-president.ts) ;
 * ce fichier écrit les situations, les options et les textes, qui ne partent au navigateur qu'une
 * décision à la fois (pedagogy/cours/scenario-servi.ts, app/cours/scenario/actions.ts).
 *
 * L'ARBRE : 3 × 3 × 3 suites, toutes calculées. Trois fins : la prudence oubliée, la prudence excessive,
 * l'image fidèle. La meilleure suite est la seule fidèle (monde/objectif-du-president.ts, `meilleureSuite`).
 */

const f = EXERCICE_DE_NOVA;
const p = prudenceDuScenario();
const y = p.y;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const AU_31 = `${dateDe(f.cloture)} N`;

const LIBELLES = {
  creance: {
    attendre: "Attendre la fin de la procédure : la créance reste au compte client",
    "hors-taxes": `La reclasser en douteuse et la déprécier de ${pct(p.taux)} de son hors taxes`,
    "toutes-taxes": `La reclasser en douteuse et la déprécier de ${pct(p.taux)} de ce qu'elle doit, TVA comprise`,
  },
  litige: {
    rien: "Ne rien passer : aucun jugement n'est encore rendu",
    probable: "Provisionner la condamnation que l'avocat juge probable",
    demande: "Provisionner tout ce que le client réclame, par prudence",
  },
  stock: {
    garder: "Laisser le stock et la ligne à leur coût",
    stock: "Déprécier le stock de composants au prix du grossiste",
    ligne: "Déprécier la ligne à ce qu'en donnerait un acheteur d'occasion",
  },
} as const satisfies { creance: Record<ChoixDeLaCreance, string>; litige: Record<ChoixDuLitige, string>; stock: Record<ChoixDuStockEtDeLaLigne, string> };

const libelleDuChoix = (s: SuiteDeChoix, i: number) => (i === 0 ? LIBELLES.creance[s.creance!] : i === 1 ? LIBELLES.litige[s.litige!] : LIBELLES.stock[s.stock!]);

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDesCodes(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La comptabilité",
  date: AU_31,
  objet: "Le résultat de l'année",
  paragraphes: [
    "Bonjour,",
    `J'ai promis à la banque au moins ${eur(p.objectif)} de résultat avant impôt pour notre premier exercice. Avant les travaux de prudence, nous sommes à ${eur(p.resultatSansPrudence)}.`,
    "Faites ce que les comptes demandent, mais dites-moi à chaque étape où nous en sommes face à cet objectif.",
    "Merci. Le président",
  ],
};

const CREANCES: PieceDuBureau = {
  code: "creances",
  nature: "extrait",
  titre: "Le compte de Sonora",
  de: "La comptabilité clients",
  a: "La comptabilité",
  date: AU_31,
  paragraphes: [
    `Facture du ${dateDe(p.creance.date)}, ${qte(p.creance.enceintes)} enceintes, échue le ${dateDe(p.creance.echeance)} et impayée.`,
    `Le ${dateDe(f.sonora.redressement.date)}, le tribunal a ouvert une procédure de redressement judiciaire contre Sonora. Le mandataire laisse craindre une perte de ${pct(p.taux)} de la créance.`,
  ],
  montants: [
    { libelle: "Hors taxes", montant: p.creance.ht },
    { libelle: "TVA", montant: p.creance.tva },
    { libelle: "Dû par Sonora, TVA comprise", montant: p.creance.ttc, fort: true },
  ],
};

const AVOCAT: PieceDuBureau = {
  code: "avocat",
  nature: "lettre",
  titre: "Lettre de l'avocat de NOVA",
  de: "L'avocat de NOVA",
  a: "Le président de NOVA",
  date: AU_31,
  objet: "L'assignation du client",
  paragraphes: [
    `Un client dont l'enceinte a pris feu en novembre assigne NOVA et réclame ${eur(y.demande)}.`,
    `À mon avis, une condamnation est probable, à ${eur(y.provision)} environ. Le jugement ne sera pas rendu avant plusieurs mois.`,
  ],
};

const INVENTAIRE: PieceDuBureau = {
  code: "inventaire",
  nature: "note",
  titre: "Notes de l'inventaire",
  de: "La comptabilité de NOVA",
  a: "La comptabilité",
  date: AU_31,
  paragraphes: [
    `Le stock : ${qte(p.stock.quantite)} jeux de composants à leur coût moyen, ${eur(p.stock.coutMoyen)}. Le grossiste les solde à ${eur(p.stock.prixDuGrossiste)} après Noël ; les enceintes qui les utiliseront se vendent au-dessus de leur coût de production.`,
    `La ligne de montage : valeur nette de ${eur(p.ligne.valeurNette)}. Un acheteur d'occasion n'en donnerait que ${pct(p.ligne.part)}, ${eur(p.ligne.revente)}. NOVA s'en sert tous les jours et ne compte pas la vendre.`,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES
// ─────────────────────────────────────────────────────────────────────────────

function chiffresDuResultat(resultat: number, avant?: number): ChiffreDuScenario[] {
  const tenu = resultat >= p.objectif;
  return [
    { libelle: "Résultat avant impôt", valeur: eur(resultat), ...(avant !== undefined ? { avant: eur(avant) } : {}) },
    { libelle: `Face à l'objectif de ${eur(p.objectif)}`, valeur: tenu ? `tenu, ${eur(resultat - p.objectif)} de marge` : `manqué de ${eur(p.objectif - resultat)}`, ton: tenu ? "bon" : "alerte" },
  ];
}

function chiffresDeLaSuite(r: ResultatDeLaSuite): ChiffreDuScenario[] {
  return [
    ...chiffresDuResultat(r.resultat),
    { libelle: "Impôt sur les sociétés", valeur: eur(r.impot) },
    { libelle: "Écart au résultat que la prudence demande", valeur: Math.abs(r.ecartALImageFidele) < 0.005 ? "aucun" : eur(r.ecartALImageFidele), ton: Math.abs(r.ecartALImageFidele) < 0.005 ? "bon" : "alerte" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  const resultat = resultatApres(s);
  if (avant.length === 0) {
    return {
      titre: "La créance de Sonora",
      consigne: "Que faites-vous de la créance de Sonora ?",
      paragraphes: [
        `Sonora doit ${eur(p.creance.ttc)} à NOVA, TVA comprise, sa facture du ${dateDe(p.creance.date)}. Elle est en redressement judiciaire depuis le ${dateDe(f.sonora.redressement.date)}.`,
        `Le mandataire laisse craindre une perte de ${pct(p.taux)}. Rien n'est encore perdu : la procédure dira en N+1 ce que NOVA récupère.`,
      ],
      chiffres: chiffresDuResultat(resultat),
      pieces: [COURRIEL, CREANCES],
      options: CHOIX_DES_DECISIONS[0]!.map((code) => ({ code, texte: LIBELLES.creance[code as ChoixDeLaCreance] })),
    };
  }
  if (avant.length === 1) {
    return {
      titre: "Le litige",
      consigne: "Que passez-vous pour le litige du client ?",
      paragraphes: [`Le client réclame ${eur(y.demande)} ; l'avocat juge probable une condamnation à ${eur(y.provision)}. Après votre décision sur Sonora, le résultat est de ${eur(resultat)}.`],
      chiffres: chiffresDuResultat(resultat),
      pieces: [AVOCAT],
      options: CHOIX_DES_DECISIONS[1]!.map((code) => ({ code, texte: LIBELLES.litige[code as ChoixDuLitige] })),
    };
  }
  return {
    titre: "Le stock et la ligne",
    consigne: "Que faites-vous du stock de composants et de la ligne de montage ?",
    paragraphes: [`Il reste à examiner les deux actifs que l'inventaire signale. Le résultat est de ${eur(resultat)}.`],
    chiffres: chiffresDuResultat(resultat),
    pieces: [INVENTAIRE],
    options: CHOIX_DES_DECISIONS[2]!.map((code) => ({ code, texte: LIBELLES.stock[code as ChoixDuStockEtDeLaLigne] })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

const TEXTES = {
  creance: {
    attendre: [`La créance reste au compte client pour ${eur(p.creance.ttc)}, comme si Sonora allait payer. Le bilan montre une créance que personne n'attend en entier.`],
    "hors-taxes": [
      `La créance passe en douteuse, sans rien perdre : on la suit à part. La dépréciation constate la perte probable sur le hors taxes, ${eur(p.creance.ht)} × ${pct(p.taux)} = ${eur(p.depreciation["hors-taxes"])}.`,
      "Si la perte se confirme, l'État rendra la TVA de la part perdue : elle n'est pas une perte pour NOVA.",
    ],
    "toutes-taxes": [
      `La créance passe en douteuse, et la dépréciation porte sur ${eur(p.creance.ttc)} × ${pct(p.taux)} = ${eur(p.depreciation["toutes-taxes"])}.`,
      `La TVA de la part perdue se récupère auprès de l'État : la dépréciation est trop forte de ${eur(p.depreciation["toutes-taxes"] - p.depreciation["hors-taxes"])}.`,
    ],
  },
  litige: {
    rien: ["Aucune charge : l'exercice ignore une sortie d'argent que l'avocat juge probable. Le jugement la fera tomber sur un exercice qui n'y est pour rien."],
    probable: [`La provision retient la sortie la plus probable, ${eur(y.provision)} : une charge de N, une dette probable au passif.`],
    demande: [`La provision retient ${eur(y.demande)}, ce que réclame le client. La prudence ne consiste pas à retenir le pire : ${eur(y.demande - y.provision)} de charge en trop.`],
  },
  stock: {
    garder: ["Le stock et la ligne restent à leur coût. Les jeux serviront à des enceintes vendues au-dessus de leur coût, et la ligne sert : ni l'un ni l'autre ne perd de valeur pour NOVA."],
    stock: [
      `Le stock baisse à ${eur(p.stock.auGrossiste)} : ${eur(p.autres.stock)} de dépréciation.`,
      "Mais le prix du grossiste ne mesure pas ce que les jeux valent pour NOVA : les enceintes qui les utilisent se vendent avec une marge. La charge n'a pas lieu d'être.",
    ],
    ligne: [
      `La ligne baisse à ${eur(p.ligne.revente)} : ${eur(p.autres.ligne)} de dépréciation.`,
      "Mais NOVA ne vend pas sa ligne, elle s'en sert : ce que donnerait un acheteur d'occasion ne mesure pas sa valeur d'usage. La charge n'a pas lieu d'être.",
    ],
  },
} as const;

function consequence(codes: readonly string[]) {
  const s = suiteDe(codes);
  const avant = resultatApres(suiteDe(codes.slice(0, -1)));
  const apres = resultatApres(s);
  const chiffres = chiffresDuResultat(apres, avant);
  if (codes.length === 1) return { titre: "La créance de Sonora", paragraphes: [...TEXTES.creance[s.creance!]], chiffres };
  if (codes.length === 2) return { titre: "Le litige", paragraphes: [...TEXTES.litige[s.litige!]], chiffres };
  const r = resultatDeLaSuite(s as SuiteComplete);
  return { titre: "Le stock et la ligne", paragraphes: [...TEXTES.stock[s.stock!]], chiffres: [...chiffres, ...chiffresDeLaSuite(r).slice(2)] };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "la-creance", titre: "La créance de Sonora", options: CHOIX_DES_DECISIONS[0]! },
  { id: "le-litige", titre: "Le litige", options: CHOIX_DES_DECISIONS[1]! },
  { id: "le-stock-et-la-ligne", titre: "Le stock et la ligne", options: CHOIX_DES_DECISIONS[2]! },
] as const;

const codesDe = (s: SuiteComplete) => [s.creance, s.litige, s.stock];

const resumer = (r: ResultatDeLaSuite): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDeLaSuite(r) });

const FINS = {
  oubliee: {
    titre: "La prudence oubliée",
    paragraphes: (r: ResultatDeLaSuite) => [
      r.exces > 0
        ? `Une perte ou une charge probable manque au résultat de N, et une autre y est comptée sans raison : les erreurs se mêlent, le résultat s'écarte de ${eur(Math.abs(r.ecartALImageFidele))} de celui que la prudence demande.`
        : `Le résultat de N est trop beau de ${eur(r.ecartALImageFidele)} : une perte ou une charge probable n'y est pas. L'objectif paraît tenu, mais sur des comptes qui ne disent pas ce qu'ils savent.`,
      "La perte ne disparaît pas : elle tombera sur N+1, qui n'y est pour rien. Et la banque découvrira que le premier exercice était flatté.",
    ],
  },
  excessive: {
    titre: "La prudence excessive",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Le résultat de N est trop bas de ${eur(-r.ecartALImageFidele)} : une charge y est comptée sans raison, ou pour trop.${r.objectifTenu ? "" : ` L'objectif est manqué de ${eur(-r.ecartALObjectif)}, sans que l'entreprise ait rien perdu.`}`,
      "Trop de prudence fausse aussi l'image : elle cache un bénéfice, qui réapparaîtra en N+1 sous forme de reprises.",
    ],
  },
  fidele: {
    titre: "L'image fidèle",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Chaque risque est pesé à son montant probable, rien de plus : le résultat est de ${eur(r.resultat)}, et l'objectif de ${eur(p.objectif)} est tenu, de ${eur(r.ecartALObjectif)}.`,
    ],
  },
} as const;

function justification(b: ResultatDeLaSuite): string[] {
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => libelleDuChoix(b.suite, i).replace(/^./, (c) => c.toLowerCase())).join(" ; ")}.`,
    `Elle passe ${eur(b.totalDesCharges)} de charges de prudence, la dépréciation de Sonora et la provision du litige, et laisse ${eur(b.resultat)} de résultat avant impôt.`,
    "La prudence compte les pertes probables, à leur montant probable ; elle ne compte ni les pertes possibles, ni les baisses de valeur qui ne touchent pas l'entreprise. L'objectif annoncé n'y change rien : il tient ici, il aurait pu manquer.",
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteComplete;
  const r = resultatDeLaSuite(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const comparaison: string[] = memes
    ? [`Votre suite est la seule des ${toutesLesSuites().length} qui donne l'image fidèle.`]
    : [
        `Votre résultat avant impôt est de ${eur(r.resultat)}, celui que la prudence demande ${eur(b.resultat)}.`,
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

export const L_OBJECTIF_DU_PRESIDENT: Scenario = {
  code: "l-objectif-du-president",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["depreciations-et-provisions"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Scénario : l'objectif du président",
  accroche: `Le président a promis ${montantEcrit(p.objectif)} de résultat à la banque. La créance de Sonora, le litige, puis le stock et la ligne : chaque décision de prudence le rapproche ou l'éloigne de sa promesse.`,
  objectifs: [
    "Déprécier une créance douteuse de sa perte probable, sur son hors taxes",
    "Provisionner un litige au montant probable de la sortie",
    "Écarter les dépréciations qui ne mesurent pas une perte pour l'entreprise",
    "Tenir la prudence à l'écart d'un objectif de résultat",
  ],
  libre: false,
  accueil: [
    `Vous arrêtez les comptes de NOVA au ${AU_31}. La balance, les amortissements, le stock et les charges à payer sont passés ; il reste la prudence.`,
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez le résultat qu'elle laisse face à l'objectif du président ; à la fin, un bilan compare votre suite à la meilleure.",
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
    explication: ["Une dépréciation et une provision mesurent une perte ou une charge probable, à son montant probable. Ni l'objectif du dirigeant, ni le pire qu'on imagine n'en décident."],
    questions: [
      {
        id: "la-tva",
        question: "Pourquoi la dépréciation de Sonora porte-t-elle sur le hors taxes ?",
        options: [
          { texte: "La TVA de la part perdue se récupère", juste: true, retour: `Oui : si Sonora ne paie pas, l'État rend la TVA de la part perdue. NOVA ne risque que le hors taxes : ${eur(p.depreciation["hors-taxes"])} et non ${eur(p.depreciation["toutes-taxes"])}.` },
          { texte: "Parce que la créance s'enregistre hors taxes au compte client", juste: false, retour: "Non : la créance s'enregistre toutes taxes comprises, c'est ce que le client doit. C'est la perte qui se mesure hors taxes." },
          { texte: "Parce que le mandataire ne parle que du hors taxes dans ses courriers", juste: false, retour: "Non : le mandataire donne une part de la créance. La TVA de cette part, l'État la rend à NOVA." },
        ],
      },
      {
        id: "l-objectif",
        question: `Si la prudence avait fait manquer les ${eur(p.objectif)}, qu'aurait dû faire le comptable ?`,
        options: [
          { texte: "Passer les mêmes écritures", juste: true, retour: `Oui : le résultat de ${eur(meilleur.resultat)} est celui que les risques demandent. Un objectif se commente auprès de la banque ; il ne règle pas une estimation.` },
          { texte: "Réduire la dépréciation de Sonora jusqu'à tenir l'objectif annoncé", juste: false, retour: "Non : ce serait choisir l'estimation pour le résultat qu'elle donne. Les comptes ne seraient plus fidèles." },
          { texte: "Reporter le litige en N+1, puisqu'aucun jugement n'est encore rendu", juste: false, retour: "Non : la condamnation est probable dès N ; la provision appartient à N, jugement ou non." },
        ],
      },
    ],
  },
};
