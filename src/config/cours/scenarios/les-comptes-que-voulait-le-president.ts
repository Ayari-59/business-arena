import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { TRAVAUX_DE_L_INDEPENDANCE, TRAVAUX_DE_LA_PRUDENCE } from "../monde/cadre-de-la-comptabilite";
import { cloture, leviersDeLaFiche, type CodeDeTravail, type LeviersDeLaCloture } from "../monde/cloture";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA, SONORA } from "../monde/exercice-de-nova";
import type { BilanDuScenario, ChiffreDuScenario, ConsequenceDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LES COMPTES QUE VOULAIT LE PRÉSIDENT (comptabilité générale, palier 3 ; la suite du
 * chapitre « Le cadre de la comptabilité » et de son cas, « Créer l'atelier de réparation »).
 *
 * Début janvier N+1, la clôture de N se prépare. Le président de NOVA voudrait un résultat qui l'arrange,
 * et fait trois propositions au comptable, que l'élève tient : sur la prudence (la créance de Sonora et le
 * litige), sur l'indépendance des exercices (les travaux de rattachement), sur la permanence des méthodes
 * (l'amortissement de la ligne, la valorisation du stock). À chaque décision, la clôture de N se refait ;
 * le bilan compare le résultat net obtenu à celui des comptes publiés, qui donnent l'image fidèle.
 *
 * UN CRAN PLUS LOIN QUE LE CHAPITRE : le laboratoire du chapitre appliquait ou oubliait deux principes ;
 * le scénario ajoute les excès (la prudence poussée au pire, des travaux choisis selon leur effet) et la
 * permanence des méthodes, chiffrée. Le piège : un résultat plus bas n'est pas plus prudent, il est faux.
 *
 * TOUS LES CHIFFRES SE CALCULENT DANS LE MONDE DU COURS : la clôture de N (monde/cloture.ts, sur la fiche
 * figée exercice-de-nova.ts, qui n'est que lue), ses leviers (le mode d'amortissement, la méthode de
 * stock, la perte probable sur Sonora, la provision du litige, les travaux oubliés) et les travaux de
 * chaque principe (monde/cadre-de-la-comptabilite.ts). Aucune hypothèse nouvelle : « au pire », c'est la
 * créance de Sonora perdue en entier et le litige provisionné à ce que réclame le client, deux montants
 * de la fiche.
 */

const f = EXERCICE_DE_NOVA;
const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export const CHOIX = {
  prudence: ["appliquer", "oublier", "au-pire"],
  independance: ["rattacher", "oublier", "choisir"],
  permanence: ["garder", "degressif", "peps"],
} as const;
type ChoixDePrudence = (typeof CHOIX.prudence)[number];
type ChoixDIndependance = (typeof CHOIX.independance)[number];
type ChoixDePermanence = (typeof CHOIX.permanence)[number];
export type SuiteDesComptes = { prudence: ChoixDePrudence; independance: ChoixDIndependance; permanence: ChoixDePermanence };

/** Les travaux de rattachement qui baissent le résultat : ceux que « choisir » laisse de côté. */
export const TRAVAUX_QUI_BAISSENT: readonly CodeDeTravail[] = cloture(f).travaux.filter((t) => TRAVAUX_DE_L_INDEPENDANCE.includes(t.code) && t.effetSurLeResultat < 0).map((t) => t.code);

/** Les leviers de la clôture pour une suite de choix, même incomplète : ce qui n'est pas encore décidé reste celui de la fiche. */
export function leviersDeLaSuite(s: Partial<SuiteDesComptes>): Partial<LeviersDeLaCloture> {
  const oublies: CodeDeTravail[] = [...(s.prudence === "oublier" ? TRAVAUX_DE_LA_PRUDENCE : []), ...(s.independance === "oublier" ? TRAVAUX_DE_L_INDEPENDANCE : s.independance === "choisir" ? TRAVAUX_QUI_BAISSENT : [])];
  return {
    travauxOublies: oublies,
    ...(s.prudence === "au-pire" ? { tauxDePerteProbable: 1, provisionPourLitige: f.litige.demande } : {}),
    ...(s.permanence === "degressif" ? { modeDAmortissement: "degressif" as const } : {}),
    ...(s.permanence === "peps" ? { methodeDeStock: "peps" as const } : {}),
  };
}

/** La clôture de N pour une suite : le résultat avant impôt, l'impôt, le résultat net, l'écart avec les comptes publiés. */
export function clotureDeLaSuite(s: Partial<SuiteDesComptes>) {
  const k = cloture(f, leviersDeLaSuite(s));
  const fidele = CLOTURE_DE_LA_FICHE.resultatNet;
  return { resultatAvantImpot: k.resultatAvantImpot, impot: k.impot.impot, resultatNet: k.resultatNet, ecart: auCentime(k.resultatNet - fidele) };
}

const FIDELE: SuiteDesComptes = { prudence: "appliquer", independance: "rattacher", permanence: "garder" };
const estFidele = (s: SuiteDesComptes) => s.prudence === FIDELE.prudence && s.independance === FIDELE.independance && s.permanence === FIDELE.permanence;

/** Le résultat d'une suite complète, et la fin qu'elle atteint. */
export function resultatDesComptes(s: SuiteDesComptes) {
  const k = clotureDeLaSuite(s);
  const fin = estFidele(s) ? "fidele" : k.ecart > 0 ? "embellis" : "assombris";
  return { suite: s, ...k, fin } as const;
}

export const toutesLesSuites = () => CHOIX.prudence.flatMap((prudence) => CHOIX.independance.flatMap((independance) => CHOIX.permanence.map((permanence) => resultatDesComptes({ prudence, independance, permanence }))));

/** La meilleure suite : la seule qui applique les trois principes, celle des comptes publiés. */
export const meilleureSuite = () => resultatDesComptes(FIDELE);

const suiteDe = (codes: readonly string[]): Partial<SuiteDesComptes> => ({
  ...(codes[0] ? { prudence: codes[0] as ChoixDePrudence } : {}),
  ...(codes[1] ? { independance: codes[1] as ChoixDIndependance } : {}),
  ...(codes[2] ? { permanence: codes[2] as ChoixDePermanence } : {}),
});

// ─────────────────────────────────────────────────────────────────────────────
// LES TEXTES
// ─────────────────────────────────────────────────────────────────────────────

const L = leviersDeLaFiche(f);

const LIBELLES = {
  prudence: {
    appliquer: `Déprécier la créance de ${SONORA.nom} de la perte probable, provisionner le litige au montant probable`,
    oublier: "Suivre le président : l'avocat est confiant, Sonora paiera peut-être, rien à constater",
    "au-pire": `Tout prévoir au pire : ${SONORA.nom} perdue en entier, le litige à ce que réclame le client`,
  },
  independance: {
    rattacher: "Rattacher à N toutes ses charges et tous ses produits, et eux seuls",
    oublier: "Ne rien rattacher : chaque facture tombera dans l'exercice de sa date",
    choisir: "Ne rattacher que les travaux qui montent le résultat, comme le propose le président",
  },
  permanence: {
    garder: "Garder les méthodes de toujours : l'amortissement linéaire, le coût moyen du stock",
    degressif: "Amortir la ligne en dégressif cette année, pour payer moins d'impôt",
    peps: "Valoriser le stock au premier entré, premier sorti cette année",
  },
} as const satisfies { prudence: Record<ChoixDePrudence, string>; independance: Record<ChoixDIndependance, string>; permanence: Record<ChoixDePermanence, string> };

const libelleDuChoix = (s: SuiteDesComptes, i: number) => (i === 0 ? LIBELLES.prudence[s.prudence] : i === 1 ? LIBELLES.independance[s.independance] : LIBELLES.permanence[s.permanence]);

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = "6 janvier N+1";

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le service comptable",
  date: JOUR,
  objet: "La clôture de N",
  paragraphes: [
    "Bonjour,",
    "Les actionnaires attendent un beau premier exercice, et la banque aussi. J'ai trois idées pour la clôture : ne rien constater pour Sonora et le litige, ne rattacher à N que ce qui l'arrange, et revoir nos méthodes cette année.",
    "Vous tenez les comptes : dites-moi ce que vous en faites. Je veux les chiffres de chaque décision.",
    "Le président",
  ],
};

const NOTES: PieceDuBureau = {
  code: "notes",
  nature: "note",
  titre: "Les notes de l'inventaire",
  de: "Le service comptable de NOVA",
  a: "Le comptable",
  date: "31 décembre N",
  paragraphes: [
    `${SONORA.nom} est en redressement judiciaire ; le mandataire laisse craindre une perte de ${pct(L.tauxDePerteProbable)} de sa créance.`,
    `Un client réclame ${eur(f.litige.demande)} à NOVA ; l'avocat juge probable une condamnation à ${eur(f.litige.montantProbable)}.`,
    "Des factures de décembre arriveront ou partiront en janvier ; une prime d'assurance couvre en partie N+1 ; des enceintes facturées en décembre seront livrées en janvier ; des intérêts courent.",
    "Depuis la création, NOVA amortit sa ligne en linéaire et valorise son stock au coût moyen pondéré.",
  ],
};

const PUBLIES = CLOTURE_DE_LA_FICHE.resultatNet;

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS ET LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

const ecartEcrit = (x: number) => (Math.abs(x) < 0.005 ? "aucun" : x > 0 ? `${eur(x)} de trop` : `${eur(-x)} de moins`);

const chiffresDe = (k: ReturnType<typeof clotureDeLaSuite>): ChiffreDuScenario[] => [
  { libelle: "Résultat avant impôt", valeur: eur(k.resultatAvantImpot) },
  { libelle: "Impôt sur les sociétés", valeur: eur(k.impot) },
  { libelle: "Résultat net", valeur: eur(k.resultatNet) },
  { libelle: "Écart avec l'image fidèle", valeur: ecartEcrit(k.ecart), ton: Math.abs(k.ecart) < 0.005 ? "bon" : "alerte" },
];

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  const k = clotureDeLaSuite(s);
  const encours = [{ libelle: "Résultat net, à ce stade", valeur: eur(k.resultatNet) }];
  if (avant.length === 0) {
    return {
      titre: "La prudence",
      consigne: `Que faites-vous de la créance de ${SONORA.nom} et du litige ?`,
      paragraphes: [
        "Le président voudrait ne rien constater : l'avocat est confiant, et Sonora paiera peut-être. Le résultat serait plus beau.",
        "La prudence commande de constater une perte probable, jamais un gain probable ; elle ne commande pas de retenir le pire.",
      ],
      chiffres: encours,
      pieces: [COURRIEL, NOTES],
      options: CHOIX.prudence.map((code) => ({ code, texte: LIBELLES.prudence[code] })),
    };
  }
  if (avant.length === 1) {
    return {
      titre: "L'indépendance des exercices",
      consigne: "Que rattachez-vous à l'exercice N ?",
      paragraphes: [
        `Six travaux rattachent à N ses charges et ses produits. ${TRAVAUX_QUI_BAISSENT.length} baissent le résultat, les autres le montent ; le président propose de ne garder que ceux qui le montent.`,
        `Après votre décision sur la prudence, le résultat net est de ${eur(k.resultatNet)}.`,
      ],
      chiffres: encours,
      pieces: [NOTES],
      options: CHOIX.independance.map((code) => ({ code, texte: LIBELLES.independance[code] })),
    };
  }
  return {
    titre: "La permanence des méthodes",
    consigne: "Changez-vous de méthode pour la clôture de N ?",
    paragraphes: [
      "Le président voudrait amortir la ligne en dégressif cette année, ou valoriser le stock autrement. Ni l'activité ni les biens n'ont changé.",
      `À ce stade, le résultat net est de ${eur(k.resultatNet)}.`,
    ],
    chiffres: encours,
    pieces: [NOTES],
    options: CHOIX.permanence.map((code) => ({ code, texte: LIBELLES.permanence[code] })),
  };
}

function consequence(codes: readonly string[]): ConsequenceDuScenario {
  const s = suiteDe(codes);
  const avant = clotureDeLaSuite(suiteDe(codes.slice(0, -1)));
  const apres = clotureDeLaSuite(s);
  const effet = auCentime(apres.resultatNet - avant.resultatNet);
  const compare: ChiffreDuScenario[] = [
    { libelle: "Résultat net", avant: eur(avant.resultatNet), valeur: eur(apres.resultatNet) },
    { libelle: "Impôt sur les sociétés", avant: eur(avant.impot), valeur: eur(apres.impot) },
    { libelle: "Écart avec l'image fidèle", valeur: ecartEcrit(apres.ecart), ton: Math.abs(apres.ecart) < 0.005 ? "bon" : "alerte" },
  ];
  const variation = Math.abs(effet) < 0.005 ? "ne change pas le résultat net" : effet > 0 ? `monte le résultat net de ${eur(effet)}` : `baisse le résultat net de ${eur(-effet)}`;
  if (codes.length === 1) {
    const textes: Record<ChoixDePrudence, string> = {
      appliquer: `La dépréciation et la provision retiennent la perte que l'on sait probable. La décision ${variation}.`,
      oublier: `Rien n'est constaté : la décision ${variation}. NOVA afficherait un bénéfice qu'une perte probable menace déjà.`,
      "au-pire": `Tout est prévu au pire : la décision ${variation}. Ce n'est pas plus prudent, c'est faux : une provision retient le probable, pas le pire.`,
    };
    return { titre: "La prudence", paragraphes: [textes[s.prudence!]], chiffres: compare };
  }
  if (codes.length === 2) {
    const textes: Record<ChoixDIndependance, string> = {
      rattacher: `Chaque charge et chaque produit de N sont rattachés à N. La décision ${variation}.`,
      oublier: `Rien n'est rattaché : la décision ${variation}. Le résultat de N porte des factures qui ne sont pas les siennes, et en oublie d'autres.`,
      choisir: `Seuls les travaux qui montent le résultat sont passés : la décision ${variation}. Choisir les rattachements selon leur effet, c'est n'appliquer le principe qu'à moitié.`,
    };
    return { titre: "L'indépendance des exercices", paragraphes: [textes[s.independance!]], chiffres: compare };
  }
  const textes: Record<ChoixDePermanence, string> = {
    garder: `Les méthodes restent celles de toujours : N se compare à N+1. La décision ${variation}.`,
    degressif: `La ligne passe en dégressif sans que rien n'ait changé : la décision ${variation}. Un changement de méthode se justifie, il ne se choisit pas pour l'impôt.`,
    peps: `Le stock passe au premier entré, premier sorti : la décision ${variation}. Changer de méthode d'une année à l'autre rend les exercices incomparables.`,
  };
  return { titre: "La permanence des méthodes", paragraphes: [textes[s.permanence!]], chiffres: compare };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "la-prudence", titre: "La prudence", options: CHOIX.prudence },
  { id: "l-independance", titre: "L'indépendance des exercices", options: CHOIX.independance },
  { id: "la-permanence", titre: "La permanence des méthodes", options: CHOIX.permanence },
] as const;

type Resultat = ReturnType<typeof resultatDesComptes>;

const resumer = (r: Resultat): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDe(r) });

const FINS = {
  fidele: { titre: "L'image fidèle", paragraphes: () => [`Les trois principes sont appliqués : le résultat net, ${eur(PUBLIES)}, est celui des comptes publiés. L'assemblée décidera de son dividende sur un résultat juste.`] },
  embellis: {
    titre: "Des comptes embellis",
    paragraphes: (r: Resultat) => [`Le résultat net, ${eur(r.resultatNet)}, dépasse l'image fidèle de ${eur(r.ecart)}. Un dividende versé sur ce résultat distribuerait un bénéfice qui n'existe pas, et l'impôt serait faux.`],
  },
  assombris: {
    titre: "Des comptes assombris",
    paragraphes: (r: Resultat) => [`Le résultat net, ${eur(r.resultatNet)}, reste sous l'image fidèle de ${eur(-r.ecart)}. Un résultat trop bas n'est pas prudent : il cache une richesse aux actionnaires et fausse la comparaison avec N+1.`],
  },
} as const;

const codesDe = (s: SuiteDesComptes) => [s.prudence, s.independance, s.permanence];

function bilan(codes: readonly string[]): BilanDuScenario {
  const s = suiteDe(codes) as SuiteDesComptes;
  const r = resultatDesComptes(s);
  const b = meilleureSuite();
  const memes = estFidele(s);
  const comparaison = memes
    ? [`Votre suite est la seule des ${toutesLesSuites().length} qui donne l'image fidèle : les trois principes, appliqués sans excès.`]
    : [
        `Votre résultat net est de ${eur(r.resultatNet)} ; celui des comptes publiés, ${eur(b.resultatNet)}.`,
        ...DECISIONS.flatMap((d, i) => (codesDe(b.suite)[i] === codes[i] ? [] : [`${d.titre} : vous avez choisi « ${libelleDuChoix(s, i)} » ; l'image fidèle demande « ${libelleDuChoix(b.suite, i)} ».`])),
      ];
  return {
    fin: { code: r.fin, titre: FINS[r.fin].titre, paragraphes: FINS[r.fin].paragraphes(r) },
    meilleure: memes,
    eleve: resumer(r),
    reference: resumer(b),
    comparaison: [...comparaison, "Les principes ne servent pas un résultat voulu : la prudence retient le probable, l'indépendance rattache tout ce qui appartient à l'exercice, la permanence garde les méthodes."],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

const auPire = clotureDeLaSuite({ prudence: "au-pire", independance: "rattacher", permanence: "garder" });

export const LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT: Scenario = {
  code: "les-comptes-que-voulait-le-president",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["le-cadre-de-la-comptabilite"],
  commanditaire: "Le président",
  entreprise: { code: f.code, nom: f.entreprise },
  titre: "Scénario : les comptes que voulait le président",
  accroche: "Le président voudrait un premier exercice qui l'arrange. La prudence, l'indépendance des exercices, puis les méthodes : chaque décision refait la clôture de N.",
  objectifs: [
    "Appliquer la prudence sans la pousser au pire",
    "Rattacher à l'exercice toutes ses charges et tous ses produits, sans choisir",
    "Garder ses méthodes d'un exercice à l'autre",
    "Mesurer ce que chaque principe change au résultat net",
  ],
  libre: false,
  accueil: [
    `Vous tenez les comptes de NOVA. Nous sommes le ${JOUR}, et la clôture du premier exercice se prépare. Le président a des idées.`,
    "Vous décidez l'une après l'autre. Après chaque décision, la clôture de N se refait sous vos yeux ; à la fin, un bilan compare votre résultat à celui qui donne l'image fidèle.",
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
    explication: ["L'image fidèle n'est ni le plus haut ni le plus bas des résultats : c'est celui que donnent les principes, appliqués de bonne foi."],
    questions: [
      {
        id: "le-pire",
        question: "Pourquoi tout provisionner au pire n'est-il pas plus prudent ?",
        options: [
          { texte: "Une provision retient le probable", juste: true, retour: `Oui : au pire, le résultat net tomberait à ${eur(auPire.resultatNet)}, ${eur(-auPire.ecart)} sous l'image fidèle. La prudence n'autorise pas à sous-évaluer.` },
          { texte: "Parce que la prudence ne concerne que les gains, jamais les pertes", juste: false, retour: "Non : c'est l'inverse. La prudence constate les pertes probables ; elle ignore les gains probables." },
          { texte: "Parce qu'une provision ne change pas le résultat, seulement le bilan", juste: false, retour: "Non : une provision se dote par une charge ; elle baisse le résultat." },
        ],
      },
      {
        id: "le-degressif",
        question: "Le président veut amortir la ligne en dégressif « cette année ». Que lui répondez-vous ?",
        options: [
          { texte: "Non : la méthode ne change pas sans raison", juste: true, retour: "Oui : la permanence des méthodes rend les exercices comparables. Un changement se justifie par un changement réel, et l'annexe l'explique." },
          { texte: "Oui, puisque le dégressif est une méthode admise par le plan comptable", juste: false, retour: "Non : admise, elle se choisit une fois et se garde ; on n'en change pas pour l'impôt d'une année." },
          { texte: "Oui, à condition d'en revenir au linéaire l'année suivante", juste: false, retour: "Non : c'est justement ce va-et-vient que la permanence interdit." },
        ],
      },
    ],
  },
};
