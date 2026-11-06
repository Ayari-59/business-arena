import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { EXERCICE_DE_NOVA } from "../monde/exercice-de-nova";
import {
  CHOIX_DES_DECISIONS,
  MOIS_DE_L_ARMOIRE,
  chiffresDuControle,
  coutsApres,
  meilleureSuite,
  resultatDeLaSuite,
  suiteDesCodes,
  toutesLesSuites,
  type ChoixDeLArmoire,
  type ChoixDeLEcart,
  type ChoixDuFichier,
  type ResultatDeLaSuite,
  type SuiteComplete,
  type SuiteDeChoix,
} from "../monde/controle-fiscal-de-nova";
import type { ChiffreDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LE CONTRÔLE FISCAL DE NOVA (comptabilité générale, palier 4 ; la suite du chapitre
 * « Sécuriser les processus » et de son cas, « La facture reçue deux fois »).
 *
 * NOVA est contrôlée en N+1 sur son exercice N. L'élève, collaborateur du cabinet, décide trois fois : ce
 * que deviennent les factures papier de N, ce qu'il remet au vérificateur le jour de sa venue, ce qu'il
 * répond à l'écart entre les ventes et la TVA déclarée. Chaque décision montre ce qu'elle coûte et ce
 * qu'elle laisse de la comptabilité. Tous les chiffres se calculent dans le monde du cours
 * (monde/controle-fiscal-de-nova.ts) ; ce fichier écrit les situations, les options et les textes, qui
 * ne partent au navigateur qu'une décision à la fois.
 *
 * L'ARBRE : 3 × 3 × 3 suites, toutes calculées. Six fins, de la comptabilité réécrite au contrôle sans
 * rappel ; la meilleure suite est la seule conforme (monde/controle-fiscal-de-nova.ts, `meilleureSuite`).
 */

const f = EXERCICE_DE_NOVA;
const k = chiffresDuControle();
const c = k.cadrage;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

const LIBELLES = {
  armoire: {
    "dix-ans": `Les garder ${k.conservation} ans, classées par journal et par numéro de pièce`,
    jeter: "Les jeter : le PGI garde toutes les écritures, cela suffit",
    reprise: `Les garder jusqu'à la fin du droit de reprise, le 31 décembre N+${k.reprise}, puis les jeter`,
  },
  fichier: {
    fec: `Le FEC de N, tiré du PGI : toutes les écritures, ${k.zones} zones par ligne`,
    papier: "Le grand livre et la balance de N, imprimés et signés par le président",
    attendre: "Rien pour l'instant : attendre de savoir ce que le vérificateur cherche",
  },
  ecart: {
    cadrage: "Remettre le cadrage, qui explique l'écart ligne par ligne",
    payer: "Admettre l'écart et payer la TVA qu'il représente, pour clore vite",
    rouvrir: "Rouvrir décembre N dans le PGI et corriger les ventes pour qu'elles collent",
  },
} as const satisfies { armoire: Record<ChoixDeLArmoire, string>; fichier: Record<ChoixDuFichier, string>; ecart: Record<ChoixDeLEcart, string> };

const libelleDuChoix = (s: SuiteDeChoix, i: number) => (i === 0 ? LIBELLES.armoire[s.armoire!] : i === 1 ? LIBELLES.fichier[s.fichier!] : LIBELLES.ecart[s.ecart!]);

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
  a: "Le cabinet d'expertise comptable",
  date: MOIS_DE_L_ARMOIRE,
  objet: "L'armoire de l'atelier",
  paragraphes: [
    "Bonjour,",
    `L'armoire de l'atelier déborde : toutes les factures papier de N y sont, ${k.factures} rien que pour ${k.fournisseur}. Vous les avez saisies dans le PGI. Que dois-je en faire ?`,
    "Merci. Le président",
  ],
};

const AVIS: PieceDuBureau = {
  code: "avis",
  nature: "avis",
  titre: "Avis de vérification de comptabilité",
  de: "L'administration fiscale",
  a: "Le président de NOVA",
  date: k.avis,
  objet: "Vérification de comptabilité, exercice N",
  paragraphes: [`Le vérificateur se présentera le ${k.intervention} pour la première intervention. La comptabilité de NOVA est tenue sur un logiciel.`],
  mention: "Vous pouvez vous faire assister d'un conseil de votre choix.",
};

const NOTE_DU_VERIFICATEUR: PieceDuBureau = {
  code: "note",
  nature: "note",
  titre: "Note du vérificateur",
  de: "Le vérificateur",
  a: "Le cabinet d'expertise comptable",
  date: "novembre N+1",
  objet: "Les ventes de N et la TVA déclarée",
  paragraphes: [`Le compte 701 porte ${eur(c.ventesComptabilisees)} de ventes pour N. Les douze déclarations de TVA de l'année déclarent ${eur(c.base)} de bases. Je relève un écart de ${eur(c.ecart)}. Merci de vous expliquer.`],
};

const CADRAGE: PieceDuBureau = {
  code: "cadrage",
  nature: "note",
  titre: "Le cadrage de la TVA de N, au dossier du cabinet",
  de: "Le cabinet d'expertise comptable",
  a: "Le dossier de NOVA",
  date: "janvier N+1",
  montants: [
    { libelle: "Ventes comptabilisées de N", montant: c.ventesComptabilisees },
    { libelle: "Moins : la facture à établir de la commande urgente, déclarée en janvier", montant: c.factureAEtablir },
    { libelle: "Plus : le produit constaté d'avance, déclaré en décembre", montant: c.produitConstateDAvance },
    { libelle: "Moins : l'escompte accordé à Sonora", montant: c.escompte },
    { libelle: "Bases déclarées", montant: c.base, fort: true },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES
// ─────────────────────────────────────────────────────────────────────────────

function chiffresDuCout(s: SuiteDeChoix, avant?: SuiteDeChoix): ChiffreDuScenario[] {
  const t = coutsApres(s).total;
  return [{ libelle: "Rappels et amendes à ce jour", valeur: eur(t), ...(avant ? { avant: eur(coutsApres(avant).total) } : {}), ton: t > 0 ? "alerte" : "bon" }];
}

const OUI_NON = (x: boolean) => (x ? "oui" : "non");

function chiffresDeLaSuite(r: ResultatDeLaSuite): ChiffreDuScenario[] {
  return [
    { libelle: "Rappels et amendes", valeur: eur(r.cout), ton: r.cout > 0 ? "alerte" : "bon" },
    { libelle: "TVA déduite rappelée, faute de factures", valeur: eur(r.couts.tvaSansFacture) },
    { libelle: "Amende pour le fichier des écritures", valeur: eur(r.couts.amende) },
    { libelle: "TVA payée sur l'écart du cadrage", valeur: eur(r.couts.rappelSurLEcart) },
    { libelle: "Comptabilité probante", valeur: OUI_NON(r.probante), ton: r.probante ? "bon" : "alerte" },
    { libelle: "Pièces gardées le temps que la loi demande", valeur: OUI_NON(r.suite.armoire === "dix-ans"), ton: r.suite.armoire === "dix-ans" ? "bon" : "alerte" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    return {
      titre: "L'armoire",
      consigne: "Que conseillez-vous au président pour les factures papier de N ?",
      paragraphes: [
        `Nous sommes en ${MOIS_DE_L_ARMOIRE}. L'exercice N est clos, ses comptes approuvés. Toutes ses factures sont saisies dans le PGI que NOVA partage avec le cabinet.`,
        "Le président veut de la place à l'atelier. Il vous demande ce qu'il peut jeter.",
      ],
      chiffres: chiffresDuCout(s),
      pieces: [COURRIEL],
      options: CHOIX_DES_DECISIONS[0]!.map((code) => ({ code, texte: LIBELLES.armoire[code as ChoixDeLArmoire] })),
    };
  }
  if (avant.length === 1) {
    return {
      titre: "Le fichier des écritures",
      consigne: `Que remettez-vous au vérificateur le ${k.intervention} ?`,
      paragraphes: [
        `Le ${k.avis}, NOVA reçoit un avis de vérification de comptabilité sur l'exercice N. Le vérificateur vient le ${k.intervention}.`,
        s.armoire === "jeter"
          ? "Les factures papier de N ont été jetées en mars : il ne reste que le PGI."
          : "Les factures papier de N sont dans l'armoire, classées.",
      ],
      chiffres: chiffresDuCout(s),
      pieces: [AVIS],
      options: CHOIX_DES_DECISIONS[1]!.map((code) => ({ code, texte: LIBELLES.fichier[code as ChoixDuFichier] })),
    };
  }
  return {
    titre: "L'écart de TVA",
    consigne: "Que répondez-vous à la note du vérificateur ?",
    paragraphes: [
      `Le vérificateur rapproche les ventes comptabilisées de N des bases de TVA déclarées : ${eur(c.ecart)} d'écart.`,
      `Le cabinet a fait le cadrage en janvier : l'écart vient de dates de facturation, ${eur(c.decalages)}, et de l'escompte de Sonora, ${eur(c.escompte)}.`,
    ],
    chiffres: chiffresDuCout(s),
    pieces: [NOTE_DU_VERIFICATEUR, CADRAGE],
    options: CHOIX_DES_DECISIONS[2]!.map((code) => ({ code, texte: LIBELLES.ecart[code as ChoixDeLEcart] })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

const TEXTES = {
  armoire: {
    "dix-ans": [`Les factures restent, classées par journal et par numéro de pièce : le code de commerce veut les livres et les pièces ${k.conservation} ans. Chaque écriture du PGI renvoie à sa pièce.`],
    jeter: ["L'armoire est vide. Le PGI garde les écritures, mais plus les pièces qui les justifient : une écriture sans pièce ne prouve rien."],
    reprise: [
      `Les factures restent jusqu'au 31 décembre N+${k.reprise} : assez pour ce contrôle-ci, puisque l'administration peut reprendre jusque-là.`,
      `Mais le code de commerce veut les pièces ${k.conservation} ans : les jeter avant serait une faute, même sans contrôle.`,
    ],
  },
  fichier: {
    fec: [`Le FEC part dès la première intervention : ${k.zones} zones par ligne, toutes les écritures de N. Le vérificateur le traite lui-même, avec ses outils.`],
    papier: [`Une comptabilité tenue sur un logiciel se remet sous la forme d'un fichier, le FEC. Le papier ne vaut pas remise : l'amende de ${eur(k.amende)} est due.`],
    attendre: [`Le FEC se remet dès le début des opérations de contrôle, pas à la fin. Ne pas le remettre coûte l'amende de ${eur(k.amende)}.`],
  },
  ecart: {
    cadrage: [`Le cadrage explique l'écart au centime : la commande urgente, vendue en N et déclarée en janvier ; les enceintes facturées en décembre et livrées en janvier ; l'escompte, qui réduit la base sans réduire le 701. Aucun rappel.`],
    payer: [`NOVA paie ${pct(f.tauxDeTva)} de ${eur(c.ecart)}, ${eur(k.rappelSurLEcart)}, une TVA qu'elle ne devait pas : l'écart s'expliquait. Elle a payé pour ne pas avoir à montrer son cadrage.`],
    rouvrir: [
      "Rouvrir une période close défait ce qu'elle garantit : que les écritures déclarées sont celles qui ont été tenues. Le FEC et le PGI ne disent plus la même chose.",
      `La comptabilité perd sa valeur probante, et l'écart reste : le vérificateur rappelle ${eur(k.rappelSurLEcart)}.`,
    ],
  },
} as const;

function consequence(codes: readonly string[]) {
  const s = suiteDe(codes);
  const avant = suiteDe(codes.slice(0, -1));
  const chiffres = chiffresDuCout(s, avant);
  if (codes.length === 1) return { titre: "L'armoire", paragraphes: [...TEXTES.armoire[s.armoire!]], chiffres };
  if (codes.length === 2) {
    const piece =
      s.armoire === "jeter"
        ? [`Le vérificateur demande les factures de ${k.fournisseur} : il n'y en a plus. La TVA déduite sur elles, ${eur(k.rappelSansFacture)}, est rappelée.`]
        : [];
    return { titre: "Le fichier des écritures", paragraphes: [...TEXTES.fichier[s.fichier!], ...piece], chiffres };
  }
  const r = resultatDeLaSuite(s as SuiteComplete);
  return { titre: "L'écart de TVA", paragraphes: [...TEXTES.ecart[s.ecart!]], chiffres: [...chiffres, ...chiffresDeLaSuite(r).slice(4)] };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "l-armoire", titre: "L'armoire", options: CHOIX_DES_DECISIONS[0]! },
  { id: "le-fichier", titre: "Le fichier des écritures", options: CHOIX_DES_DECISIONS[1]! },
  { id: "l-ecart", titre: "L'écart de TVA", options: CHOIX_DES_DECISIONS[2]! },
] as const;

const codesDe = (s: SuiteComplete) => [s.armoire, s.fichier, s.ecart];

const resumer = (r: ResultatDeLaSuite): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDeLaSuite(r) });

const FINS = {
  reecrite: {
    titre: "La comptabilité réécrite",
    paragraphes: (r: ResultatDeLaSuite) => [
      `Une période close a été rouverte : la comptabilité ne prouve plus rien. Le contrôle coûte ${eur(r.cout)}, et le vérificateur peut désormais écarter les comptes et reconstituer lui-même les bases.`,
      "Une erreur se corrige par une écriture nouvelle, dans la période ouverte ; jamais en réécrivant une période close.",
    ],
  },
  pieces: {
    titre: "Les pièces jetées",
    paragraphes: (r: ResultatDeLaSuite) => [`Sans les factures, la TVA déduite ne se prouve plus : ${eur(r.couts.tvaSansFacture)} rappelés. Le contrôle coûte ${eur(r.cout)} en tout.`, "Une écriture vaut ce que vaut sa pièce : le PGI ne remplace pas l'archive."],
  },
  amende: {
    titre: "Le fichier qui manquait",
    paragraphes: (r: ResultatDeLaSuite) => [`Le FEC n'a pas été remis dès la première intervention : ${eur(r.couts.amende)} d'amende. Le contrôle coûte ${eur(r.cout)} en tout.`],
  },
  payee: {
    titre: "La TVA payée pour rien",
    paragraphes: () => [`NOVA a payé ${eur(k.rappelSurLEcart)} qu'elle ne devait pas : le cadrage expliquait l'écart. Un contrôle de cohérence tenu à jour sert le jour où l'on vous demande des comptes.`],
  },
  fragile: {
    titre: "Un contrôle sans rappel, une archive fragile",
    paragraphes: () => [`Le contrôle ne coûte rien. Mais les factures seront jetées avant les ${k.conservation} ans du code de commerce : la prochaine fois, elles pourraient manquer.`],
  },
  tenu: {
    titre: "Un contrôle sans rappel",
    paragraphes: () => ["Les pièces sont là, le fichier est remis, l'écart s'explique : le contrôle se clôt sans rappel ni amende. La procédure a fait son travail."],
  },
} as const;

function justification(b: ResultatDeLaSuite): string[] {
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => libelleDuChoix(b.suite, i).replace(/^./, (x) => x.toLowerCase())).join(" ; ")}. Elle ne coûte rien.`,
    `Les pièces se gardent ${k.conservation} ans ; le FEC se remet dès la première intervention ; une période close ne se rouvre pas, un écart se justifie par le cadrage.`,
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteComplete;
  const r = resultatDeLaSuite(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const comparaison: string[] = memes
    ? [`Votre suite est la seule des ${toutesLesSuites().length} qui tienne la comptabilité probante et conforme, sans rien coûter.`]
    : [
        `Votre suite coûte ${eur(r.cout)}, la meilleure ${eur(b.cout)}.`,
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

export const LE_CONTROLE_FISCAL: Scenario = {
  code: "le-controle-fiscal",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["securiser-les-processus"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Scénario : le contrôle fiscal",
  accroche: "NOVA est contrôlée sur son premier exercice. L'armoire des factures, le fichier des écritures, puis l'écart de TVA : chaque décision se paie, ou ne coûte rien.",
  objectifs: [
    "Conserver les pièces justificatives le temps que la loi demande",
    "Remettre au vérificateur le fichier des écritures comptables, dès la première intervention",
    "Justifier un écart par un contrôle de cohérence, sans rouvrir une période close",
  ],
  libre: false,
  accueil: [
    "Vous êtes le collaborateur du cabinet qui tient la comptabilité de NOVA. L'exercice N est clos ; N+1 commence par une question du président, et finira par un contrôle fiscal.",
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez ce qu'elle coûte ; à la fin, un bilan compare votre suite à la meilleure.",
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
    explication: ["Une comptabilité se défend par ses pièces, son fichier et ses contrôles : gardés, remis, tenus à jour. Ce qui est clos ne se réécrit pas."],
    questions: [
      {
        id: "l-ecart",
        question: "D'où vient l'écart entre les ventes de N et les bases déclarées ?",
        options: [
          { texte: "Des dates de facturation et de l'escompte", juste: true, retour: `Oui : ${eur(c.decalages)} de décalages entre la vente et sa facture, et ${eur(c.escompte)} d'escompte, qui réduit la base sans réduire les ventes.` },
          { texte: "D'une TVA oubliée sur une partie des ventes de l'année", juste: false, retour: "Non : chaque facture a porté sa TVA. L'écart vient de ventes et de bases qui ne tombent pas le même mois." },
          { texte: "D'une erreur de saisie dans le PGI, à corriger dans décembre N", juste: false, retour: "Non : aucune écriture n'est fausse, et une période close ne se corrige pas." },
        ],
      },
      {
        id: "les-pieces",
        question: "Combien de temps NOVA doit-elle garder les factures de N ?",
        options: [
          { texte: `${k.conservation} ans`, juste: true, retour: `Oui : le code de commerce veut les livres et les pièces justificatives ${k.conservation} ans. Le droit de reprise, plus court, ne dit que jusqu'où l'administration peut remonter.` },
          { texte: `Jusqu'au 31 décembre N+${k.reprise}, la fin du droit de reprise`, juste: false, retour: "Non : c'est le délai du fisc pour contrôler, pas celui de la conservation. Le plus long l'emporte." },
          { texte: "Jusqu'à leur saisie dans le PGI", juste: false, retour: "Non : le PGI garde l'écriture, pas la pièce qui la prouve." },
        ],
      },
    ],
  },
};
