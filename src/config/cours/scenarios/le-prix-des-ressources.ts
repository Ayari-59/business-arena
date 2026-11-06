import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { AUGMENTATION_DE_CAPITAL, BESOIN_DE_FONDS, PRIX_DE_L_INVESTISSEUSE, ACTIONS_DE_NOVA } from "../monde/comptabilite-approfondie";
import { BETA_DES_CAPITAUX_PROPRES, DETTE_A_LA_PLACE_DU_CAPITAL, EMPRUNT_DE_N_PLUS_1, FRAIS_DE_DOSSIER, PLACEMENT_PRIVE } from "../monde/couts-de-financement";
import { TAUX_DE_L_IMPOT } from "../monde/financement-de-la-gamme";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "../monde/projets-et-financement";
import {
  CHOIX_DES_DECISIONS,
  laDette,
  laStructure,
  meilleureSuite,
  resultatDeLaSuite,
  suiteDesCodes,
  toutesLesSuites,
  type Dette,
  type FondsPropres,
  type ResultatDesRessources,
  type SuiteCompleteDesRessources,
  type SuiteDesRessources,
} from "../monde/prix-des-ressources";
import type { ChiffreDuScenario, ConsequenceDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LE PRIX DES RESSOURCES (comptabilité générale, palier 4 ; la suite du chapitre
 * « Arbitrer les coûts de financement » et de son cas, « L'associé qui préfère la dette »).
 *
 * En N+1, NOVA doit lever 80 000 € de dette et 60 000 € de plus pour sa gamme. L'élève décide pour le
 * président : quelle dette, puis comment lever le reste. La dette choisie d'abord change le CMPC de chaque
 * structure qu'il voit ensuite. Tous les chiffres se calculent dans le monde du cours
 * (monde/prix-des-ressources.ts, qui lit monde/couts-de-financement.ts) ; ce fichier écrit les situations,
 * les options et les textes, servis une décision à la fois.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number, chiffres = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`.replace(/^-/, "−");
const nombre = (n: number) => n.toLocaleString("fr-FR");
const P = PLACEMENT_PRIVE;

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDesCodes(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

const LIBELLES_DES_DETTES: Readonly<Record<Dette, string>> = {
  "amortissement-constant": `Le prêt de la banque, ${pct(EMPRUNT_DE_N_PLUS_1.taux)}, le capital rendu en parts égales chaque année`,
  "in-fine": `Le prêt de la banque, ${pct(EMPRUNT_DE_N_PLUS_1.taux)}, rendu en une fois à la fin`,
  obligataire: `Le placement privé obligataire, coupon de ${pct(P.tauxNominal)}`,
};

const LIBELLES_DES_FONDS: Readonly<Record<FondsPropres, string>> = {
  "capital-a-12": `Une augmentation de capital, une action pour ${AUGMENTATION_DE_CAPITAL.parite}, à ${eur(AUGMENTATION_DE_CAPITAL.prixDEmission)}`,
  "capital-a-11": `La même augmentation, à ${eur(PRIX_DE_L_INVESTISSEUSE)}, le prix de l'investisseuse`,
  "dette-de-plus": `Une dette de plus, ${eur(BESOIN_DE_FONDS)} à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)}`,
};

const libelleDuChoix = (s: SuiteDesRessources, i: number) => (i === 0 ? LIBELLES_DES_DETTES[s.dette!] : LIBELLES_DES_FONDS[s.fonds!]);

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "La direction financière",
  date: "février N+1",
  objet: "Financer la gamme au juste prix",
  paragraphes: [
    "Bonjour,",
    `Pour la gamme, il nous faut ${eur(EMPRUNT_DE_N_PLUS_1.montant)} de dette et ${eur(BESOIN_DE_FONDS)} de plus. Je veux que chaque ressource nous coûte le moins possible, après impôt.`,
    "Choisissez d'abord la dette, puis la façon de lever le reste. Il nous faut bien toute la somme.",
    "Merci. Le président",
  ],
};

const OFFRES_DE_DETTE: PieceDuBureau = {
  code: "dettes",
  nature: "note",
  titre: `Les offres pour les ${eur(EMPRUNT_DE_N_PLUS_1.montant)}`,
  de: "La direction financière",
  a: "Le président de NOVA",
  date: "février N+1",
  objet: "Trois façons d'emprunter",
  paragraphes: [
    `La banque prête ${eur(EMPRUNT_DE_N_PLUS_1.montant)} à ${pct(EMPRUNT_DE_N_PLUS_1.taux)} sur ${EMPRUNT_DE_N_PLUS_1.dureeAns} ans, en parts égales ou en une fois à la fin, au choix. Elle prend ${eur(FRAIS_DE_DOSSIER)} de frais de dossier le jour du versement.`,
    `Le placement privé : ${nombre(P.titres)} obligations de ${eur(P.nominal)}, émises à ${eur(P.prixDEmission)}, coupon de ${pct(P.tauxNominal)}, remboursées au pair dans ${P.dureeAns} ans ; ${eur(P.frais)} de frais d'émission.`,
    `Les intérêts, les frais et la prime de remboursement sont déductibles, à ${pct(TAUX_DE_L_IMPOT)}.`,
  ],
};

const LES_ACTIONNAIRES: PieceDuBureau = {
  code: "actionnaires",
  nature: "note",
  titre: "Ce qu'exigent les actionnaires",
  de: "La direction financière",
  a: "Le président de NOVA",
  date: "février N+1",
  objet: "Le coût des capitaux propres",
  paragraphes: [
    `Taux sans risque : ${pct(TAUX_SANS_RISQUE)} ; prime de risque du marché : ${pct(PRIME_DE_RISQUE_DU_MARCHE)}. Bêta des capitaux propres de NOVA : ${nombre(BETA_DES_CAPITAUX_PROPRES)}.`,
    `Si NOVA empruntait ${eur(BESOIN_DE_FONDS)} de plus, à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)}, ses actionnaires porteraient plus de risque : un bêta de ${nombre(DETTE_A_LA_PLACE_DU_CAPITAL.beta)}.`,
    `Une investisseuse propose de souscrire toute l'augmentation à ${eur(PRIX_DE_L_INVESTISSEUSE)} l'action, au lieu de ${eur(AUGMENTATION_DE_CAPITAL.prixDEmission)}.`,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES, LES SITUATIONS, LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function chiffresDeLaDette(d: Dette): ChiffreDuScenario[] {
  const x = laDette(d);
  return [
    { libelle: "Coût actuariel avant impôt", valeur: pct(x.avantImpot) },
    { libelle: "Coût actuariel après impôt", valeur: pct(x.apresImpot) },
    { libelle: "Sortie de la première année", valeur: eur(x.premiereAnnee) },
    { libelle: "Sortie de la dernière année", valeur: eur(x.derniereAnnee) },
  ];
}

function chiffresDeLaStructure(r: ResultatDesRessources): ChiffreDuScenario[] {
  const st = r.structure;
  return [
    { libelle: "Ce qui est levé", valeur: eur(st.leve), ton: r.couvert ? "bon" : "alerte" },
    { libelle: "Coût des capitaux propres, par le MEDAF", valeur: pct(st.kc) },
    { libelle: "Coût moyen pondéré du capital", valeur: pct(st.cmpc, 3) },
    { libelle: "Coût de la dette de N+1, après impôt", valeur: pct(r.dette.apresImpot) },
  ];
}

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    return {
      titre: "La dette",
      consigne: `Quelle dette retenez-vous pour les ${eur(EMPRUNT_DE_N_PLUS_1.montant)} ?`,
      paragraphes: [
        `Trois façons d'emprunter les ${eur(EMPRUNT_DE_N_PLUS_1.montant)}. La banque prend des frais de dossier ; le placement privé, des frais d'émission, et ses titres sont émis sous le pair.`,
        "Un coupon plus bas ne dit pas un coût plus bas : à vous de juger sur ce que coûte vraiment chaque dette.",
      ],
      chiffres: [
        { libelle: "Taux de la banque", valeur: pct(EMPRUNT_DE_N_PLUS_1.taux) },
        { libelle: "Coupon du placement privé", valeur: pct(P.tauxNominal) },
        { libelle: "Taux de l'impôt", valeur: pct(TAUX_DE_L_IMPOT) },
      ],
      pieces: [COURRIEL, OFFRES_DE_DETTE],
      options: CHOIX_DES_DECISIONS[0]!.map((code) => ({ code, texte: LIBELLES_DES_DETTES[code as Dette] })),
    };
  }
  const options = CHOIX_DES_DECISIONS[1]!.map((code) => ({ code, texte: LIBELLES_DES_FONDS[code as FondsPropres] }));
  return {
    titre: "Les fonds de plus",
    consigne: `Comment levez-vous les ${eur(BESOIN_DE_FONDS)} de plus ?`,
    paragraphes: [
      `Votre dette de N+1 coûte ${pct(laDette(s.dette!).apresImpot)} après impôt. Reste à lever ${eur(BESOIN_DE_FONDS)} : en capital, ou par une dette de plus.`,
      "Pour chaque façon, voici le CMPC de NOVA qui en sortirait, avec votre dette : les capitaux propres et les dettes, pondérés par leurs montants au bilan.",
    ],
    chiffres: CHOIX_DES_DECISIONS[1]!.map((code) => ({ libelle: LIBELLES_DES_FONDS[code as FondsPropres], valeur: `CMPC de ${pct(laStructure({ dette: s.dette!, fonds: code as FondsPropres }).cmpc, 3)}` })),
    pieces: [LES_ACTIONNAIRES],
    options,
  };
}

function consequence(codes: readonly string[]): ConsequenceDuScenario {
  const s = suiteDe(codes);
  if (codes.length === 1) {
    const x = laDette(s.dette!);
    const textes: Record<Dette, string[]> = {
      "amortissement-constant": [`La banque verse ${eur(x.fondsRecus)}, frais déduits. NOVA rend ${eur(EMPRUNT_DE_N_PLUS_1.montant / EMPRUNT_DE_N_PLUS_1.dureeAns)} de capital chaque année, avec les intérêts sur ce qui reste dû.`, "Les frais pèsent sur un capital qui se rembourse vite : le coût actuariel monte au-dessus du taux affiché."],
      "in-fine": [`La banque verse ${eur(x.fondsRecus)}, frais déduits. NOVA ne paie que les intérêts, puis rend les ${eur(EMPRUNT_DE_N_PLUS_1.montant)} en une fois la dernière année.`, "Les frais s'étalent sur un capital gardé tout du long : ils pèsent moins sur le coût. Il faudra préparer la dernière année."],
      obligataire: [`Les obligations, émises sous le pair, et les frais ne laissent à NOVA que ${eur(x.fondsRecus)}. Elle paie ${eur(x.premiereAnnee)} de coupons par an, puis rembourse le nominal.`, "La prime de remboursement et les frais s'ajoutent au coupon : le coût dépasse le taux affiché."],
    };
    return { titre: "La dette", paragraphes: textes[s.dette!], chiffres: chiffresDeLaDette(s.dette!) };
  }
  const r = resultatDeLaSuite(s as SuiteCompleteDesRessources);
  return { titre: "Les fonds de plus", paragraphes: paragraphesDesFonds(r), chiffres: chiffresDeLaStructure(r) };
}

function paragraphesDesFonds(r: ResultatDesRessources): string[] {
  const st = r.structure;
  if (r.suite.fonds === "dette-de-plus") {
    return [
      `NOVA emprunte ${eur(BESOIN_DE_FONDS)} de plus, à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)} : ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux * (1 - TAUX_DE_L_IMPOT))} après impôt. Mais ses actionnaires, plus exposés, exigent ${pct(st.kc)} au lieu de ${pct(laStructure({ ...r.suite, fonds: "capital-a-12" }).kc)}.`,
      `Le CMPC monte à ${pct(st.cmpc, 3)} : la dette de plus, bon marché, rend plus chers les capitaux propres.`,
    ];
  }
  const nouvelles = ACTIONS_DE_NOVA.nombre / AUGMENTATION_DE_CAPITAL.parite;
  const base = `${nombre(nouvelles)} actions nouvelles à ${eur(st.prix!)} : ${eur(st.leve)} levés. L'action, qui valait ${eur(st.valeurAvant)}, en vaut ${eur(st.valeurDeLAction)} après.`;
  if (!r.couvert) return [base, `Il manque ${eur(BESOIN_DE_FONDS - st.leve)} au besoin. Le CMPC paraît plus bas, ${pct(st.cmpc, 3)}, parce que les capitaux propres pèsent moins : un coût bas ne sert à rien si la somme n'est pas réunie.`];
  return [base, `Le CMPC s'établit à ${pct(st.cmpc, 3)}. Les actionnaires exigent ${pct(st.kc)}, mais ne pèsent qu'une part du capital investi.`];
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "la-dette", titre: "La dette", options: CHOIX_DES_DECISIONS[0]! },
  { id: "les-fonds-de-plus", titre: "Les fonds de plus", options: CHOIX_DES_DECISIONS[1]! },
] as const;

const codesDe = (s: SuiteCompleteDesRessources) => [s.dette, s.fonds];
const resumer = (r: ResultatDesRessources): SuiteResumee => ({ choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDeLaStructure(r) });

const FINS = {
  "non-couvert": { titre: "Le besoin n'est pas couvert", paragraphes: (r: ResultatDesRessources) => [`NOVA n'a levé que ${eur(r.structure.leve)} sur ${eur(BESOIN_DE_FONDS)}. Émettre sous le prix prévu lève moins, et prend plus de valeur aux actionnaires qui ne souscrivent pas.`] },
  risque: { titre: "Le risque se paie", paragraphes: (r: ResultatDesRessources) => [`Toute la somme est réunie, mais le CMPC monte à ${pct(r.structure.cmpc, 3)} : plus de dette rend les actionnaires plus exigeants.`] },
  "dette-chere": { titre: "Une dette plus chère que nécessaire", paragraphes: (r: ResultatDesRessources) => [`La structure est la bonne, mais la dette de N+1 coûte ${pct(r.dette.apresImpot)} après impôt, quand une autre coûtait moins.`] },
  "juste-prix": { titre: "Le juste prix", paragraphes: (r: ResultatDesRessources) => [`Toute la somme est réunie, au plus faible CMPC : ${pct(r.structure.cmpc, 3)}.`] },
} as const;

function justification(b: ResultatDesRessources): string[] {
  const obligataire = laDette("obligataire");
  const constant = laDette("amortissement-constant");
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => libelleDuChoix(b.suite, i).replace(/^./, (x) => x.toLowerCase())).join(" ; ")}. Son CMPC est de ${pct(b.structure.cmpc, 3)}.`,
    `Le coupon de ${pct(P.tauxNominal)} cache un coût de ${pct(obligataire.apresImpot)} après impôt, émission sous le pair et frais compris. Avec des frais, le prêt en parts égales coûte ${pct(constant.apresImpot)}, l'in fine ${pct(b.dette.apresImpot)} : les frais pèsent moins sur un capital gardé longtemps.`,
    "Une dette de plus coûte peu par elle-même, mais elle rend les capitaux propres plus chers. Et une ressource se juge sur ce qu'elle apporte : un prix d'émission plus bas ne lève pas tout le besoin.",
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteCompleteDesRessources;
  const r = resultatDeLaSuite(s);
  const b = meilleureSuite();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const comparaison: string[] = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuites().length} : toute la somme, au plus faible CMPC.`]
    : [
        `Votre CMPC est de ${pct(r.structure.cmpc, 3)}, celui de la meilleure suite ${pct(b.structure.cmpc, 3)}.${r.couvert ? "" : r.structure.cmpc < b.structure.cmpc ? " Le vôtre paraît plus bas, mais il ne lève pas tout le besoin." : " Et il ne lève pas tout le besoin."}`,
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
const avecLaDette = resultatDeLaSuite({ ...meilleur.suite, fonds: "dette-de-plus" });

export const LE_PRIX_DES_RESSOURCES: Scenario = {
  code: "le-prix-des-ressources",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["arbitrer-les-couts-de-financement"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Scénario : le prix des ressources",
  accroche: "Il faut à NOVA 80 000 € de dette et 60 000 € de plus. Choisissez la dette, puis la façon de lever le reste : chaque choix se juge après impôt, et au CMPC.",
  objectifs: [
    "Comparer des dettes par leur coût actuariel après impôt, frais et prime compris",
    "Mesurer ce qu'une structure de financement fait au coût des capitaux propres et au CMPC",
    "Écarter une ressource moins chère en apparence qui ne couvre pas le besoin",
  ],
  libre: false,
  accueil: [
    "Février N+1. Le plan de la gamme est arrêté ; il reste à choisir les ressources, et le président vous confie la décision.",
    "Deux décisions, l'une après l'autre. La dette que vous choisissez d'abord change le CMPC de chaque façon de lever le reste. À la fin, un bilan compare votre suite à la meilleure.",
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
    explication: ["Le coût d'une ressource se mesure après impôt, par son taux actuariel ; le coût d'une structure, par le CMPC, où la dette rend les capitaux propres plus exigeants."],
    questions: [
      {
        id: "le-coupon",
        question: `Pourquoi le placement privé coûte-t-il plus que son coupon de ${pct(P.tauxNominal)}, avant impôt ?`,
        options: [
          { texte: "Il est émis sous le pair, avec des frais", juste: true, retour: `Oui : NOVA reçoit moins qu'elle ne rendra. Avant impôt, le coût monte à ${pct(laDette("obligataire").avantImpot)}.` },
          { texte: "Les coupons ne sont pas déductibles de l'impôt, contrairement aux intérêts bancaires", juste: false, retour: "Non : les coupons sont des intérêts, déductibles comme les autres." },
          { texte: "Le coupon se calcule sur le prix d'émission, plus bas que le nominal", juste: false, retour: "Non : le coupon se calcule sur le nominal. C'est ce que NOVA reçoit, plus bas, qui fait monter le coût." },
        ],
      },
      {
        id: "la-dette-de-plus",
        question: `La dette de plus ne coûte que ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux * (1 - TAUX_DE_L_IMPOT))} après impôt. Pourquoi monte-t-elle le CMPC ?`,
        options: [
          { texte: "Les actionnaires, plus exposés, exigent plus", juste: true, retour: `Oui : leur coût passe de ${pct(meilleur.structure.kc)} à ${pct(avecLaDette.structure.kc)}, et le CMPC de ${pct(meilleur.structure.cmpc, 3)} à ${pct(avecLaDette.structure.cmpc, 3)}.` },
          { texte: `Son taux de ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)} est plus haut que celui de la banque, et le CMPC prend les taux avant impôt`, juste: false, retour: "Non : le CMPC prend la dette après impôt. C'est le coût des capitaux propres qui monte." },
          { texte: "Elle ne le monte pas : plus de dette bon marché baisse toujours le CMPC", juste: false, retour: "Non : la dette pèse plus, mais les actionnaires exigent plus. Ici, le second effet l'emporte." },
        ],
      },
    ],
  },
};
