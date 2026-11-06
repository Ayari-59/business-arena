import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { PieceDuBureau } from "../bureaux/types";
import { auCentime } from "../monde/amortissement";
import {
  CHOIX_DU_DOSSIER,
  ligneDuDossier,
  meilleurDossier,
  resultatDuDossier,
  suiteDuDossier,
  toutesLesSuitesDuDossier,
  vanAuCoutDuCapital,
  type ChoixDeLaLigne,
  type ChoixDuPret,
  type FinDuDossier,
  type ResultatDuDossier,
  type SuiteCompleteDuDossier,
  type SuiteDuDossier,
} from "../monde/dossier-vert-de-nova";
import {
  EMPLOIS_CREES,
  EQUIPEMENTS_D_EFFICACITE,
  HAUSSE_ATTENDUE_DU_KWH,
  KWH_ECONOMISES_PAR_AN,
  KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE,
  PRET_VERT,
  PRIX_DU_KWH,
  TAUX_DE_SUBVENTION,
  deuxProjetsDurables,
} from "../monde/investissement-durable";
import { DUREE_DES_PROJETS, PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE, TAUX_DE_L_IMPOT_DES_PROJETS, TAUX_D_ACTUALISATION_DE_NOVA } from "../monde/projets-et-financement";
import type { ChiffreDuScenario, Scenario, SituationDuScenario, SuiteResumee } from "./types";

/**
 * LE SCÉNARIO : LE DOSSIER VERT DE NOVA (comptabilité générale, palier 4 ; DCG UE6, 2.4).
 *
 * La suite du chapitre « Évaluer un investissement durable », en décisions : fin décembre N, le président
 * doit choisir la seconde ligne de la gamme, puis le prêt qu'il demande à la banque. L'élève, contrôleur
 * de gestion, choisit la ligne (A, A durable ou B), puis le prêt (le classique, le vert, ou le vert en
 * présentant toute la ligne comme alignée). Tous les chiffres se calculent dans le monde du cours
 * (monde/dossier-vert-de-nova.ts, qui lit monde/investissement-durable.ts) ; ce fichier écrit les
 * situations, les options et les textes, qui ne partent au navigateur qu'une décision à la fois.
 *
 * POURQUOI UN SCÉNARIO : le chapitre arbitre entre deux projets, puis entre deux financements, et le
 * second ne s'ouvre qu'à certains choix du premier. Le piège est celui que le chapitre nomme : le
 * verdissement de façade.
 *
 * L'ARBRE : 3 × 3 suites, toutes calculées. Quatre fins : le prêt vert obtenu, le prêt classique choisi,
 * le prêt vert refusé à un projet sans part alignée, le dossier verdi de façade. La meilleure suite, et sa
 * règle : monde/dossier-vert-de-nova.ts, `meilleurDossier`.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;
const minuscule = (t: string) => t.replace(/^./, (x) => x.toLowerCase());

const D = deuxProjetsDurables();
const t = TAUX_DE_L_IMPOT_DES_PROJETS;
const investissement = (p: typeof PROJET_LIGNE_MANUELLE) => p.actifs.reduce((s, a) => s + a.montant, 0);

const NOMS: Readonly<Record<ChoixDeLaLigne, string>> = { a: "le projet A", "a-durable": "le projet A durable", b: "le projet B" };

const LIBELLES_DE_LA_LIGNE: Readonly<Record<ChoixDeLaLigne, string>> = {
  a: "Le projet A : la seconde ligne manuelle, sans équipements",
  "a-durable": "Le projet A durable : la ligne manuelle et ses équipements d'efficacité",
  b: "Le projet B : la ligne semi-automatique, la plus forte VAN de l'étude",
};

function libelleDuPret(s: SuiteDuDossier, choix: ChoixDuPret): string {
  const nom = NOMS[s.ligne!];
  if (choix === "classique") return `Demander le prêt classique à ${pct(PRET_VERT.tauxClassique)} pour ${nom}`;
  if (choix === "vert") return `Demander le prêt vert à ${pct(PRET_VERT.tauxVert)} pour ${nom}, tel qu'il est`;
  return `Demander le prêt vert en présentant toute la ligne comme alignée sur la taxonomie`;
}

function libelleDuChoix(s: SuiteDuDossier, i: number): string {
  if (i === 0) return LIBELLES_DE_LA_LIGNE[s.ligne!];
  return libelleDuPret(s, s.pret!);
}

const suiteDe = (codes: readonly string[]) => {
  const s = suiteDuDossier(codes);
  if (!s) throw new Error(`suite inconnue : ${codes.join(", ")}`);
  return s;
};

// ─────────────────────────────────────────────────────────────────────────────
// LES PIÈCES
// ─────────────────────────────────────────────────────────────────────────────

const JOUR = "décembre N";

const COURRIEL: PieceDuBureau = {
  code: "courriel",
  nature: "courriel",
  titre: "Courriel du président",
  de: "Le président de NOVA",
  a: "Le contrôle de gestion",
  date: JOUR,
  objet: "La seconde ligne, et la banque",
  paragraphes: [
    "Bonjour,",
    `L'étude d'hier donne B devant A, à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}. Mais l'électricité va monter, le fournisseur des équipements d'efficacité a envoyé son devis, et la banque parle d'un prêt vert.`,
    "Choisissez la ligne, puis le prêt à demander. Je veux la meilleure VAN, et un dossier que la banque ne puisse pas nous reprocher.",
    "Merci. Le président",
  ],
};

const ETUDE: PieceDuBureau = {
  code: "etude",
  nature: "note",
  titre: "L'étude financière des lignes A et B",
  de: "Le contrôle de gestion de NOVA",
  a: "Le président",
  date: JOUR,
  paragraphes: [
    `Le projet A, la seconde ligne manuelle et les moules : ${eur(investissement(PROJET_LIGNE_MANUELLE))}, ${EMPLOIS_CREES.A} opérateurs de plus. VAN à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} : ${eur(D.vanDeA)}.`,
    `Le projet B, la ligne semi-automatique et les moules : ${eur(investissement(PROJET_LIGNE_SEMI_AUTOMATIQUE))}, ${EMPLOIS_CREES.B} opérateur de plus. VAN à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} : ${eur(D.vanDeB)}.`,
    `A et B sur ${DUREE_DES_PROJETS} ans, au prix de l'électricité d'aujourd'hui, impôt à ${pct(t)}.`,
  ],
};

const DEVIS: PieceDuBureau = {
  code: "devis",
  nature: "lettre",
  titre: "Le devis des équipements d'efficacité",
  de: "Le fournisseur des équipements",
  a: "NOVA",
  date: JOUR,
  objet: "Moteurs, variateurs, éclairage et récupération de chaleur",
  paragraphes: [
    `Pour la ligne manuelle seulement : ${eur(EQUIPEMENTS_D_EFFICACITE.montant)} hors taxes, amortis sur ${EQUIPEMENTS_D_EFFICACITE.dureeDAmortissement} ans comme la ligne. Économie attendue : ${qte(KWH_ECONOMISES_PAR_AN)} kWh par an.`,
    `L'aide publique à l'efficacité énergétique en prend ${pct(TAUX_DE_SUBVENTION)} à sa charge, versés à la commande.`,
  ],
};

const ELECTRICITE: PieceDuBureau = {
  code: "electricite",
  nature: "note",
  titre: "Le prix de l'électricité",
  de: "Le contrôle de gestion de NOVA",
  a: "Le président",
  date: JOUR,
  paragraphes: [
    `NOVA paie ${qte(PRIX_DU_KWH)} € le kWh hors taxes. Les prix à terme annoncent ${qte(HAUSSE_ATTENDUE_DU_KWH)} € de plus par kWh, en moyenne, sur la durée des projets.`,
    `La ligne semi-automatique consomme ${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh de plus par an que la ligne manuelle : l'étude les compte au prix d'aujourd'hui.`,
  ],
};

const BANQUE: PieceDuBureau = {
  code: "banque",
  nature: "lettre",
  titre: "Les conditions de la banque",
  de: "La banque de NOVA",
  a: "Le président de NOVA",
  date: JOUR,
  objet: "Le financement de votre seconde ligne",
  paragraphes: [
    `Nous financerons ${pct(PRET_VERT.part)} du projet. Prêt classique : ${pct(PRET_VERT.tauxClassique)}. Prêt vert : ${pct(PRET_VERT.tauxVert)}, réservé aux projets dont une part des dépenses est alignée sur la taxonomie verte européenne.`,
    "Nous contrôlons les critères techniques de la part que vous déclarez alignée, sur pièces.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LES CHIFFRES
// ─────────────────────────────────────────────────────────────────────────────

const RELATION = { bonne: "bonne", abimee: "abîmée" } as const;

function chiffresDeLaLigne(ligne: ChoixDeLaLigne): ChiffreDuScenario[] {
  const l = ligneDuDossier(ligne);
  return [
    { libelle: `VAN à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, la hausse de l'électricité comprise`, valeur: eur(vanAuCoutDuCapital(ligne)) },
    { libelle: "Part de l'investissement alignée sur la taxonomie", valeur: pct(l.partAlignee), ton: l.partAlignee > 0 ? "bon" : undefined },
    { libelle: "Électricité consommée en moins que B, par an", valeur: `${qte(l.kwhEnMoinsQueB)} kWh` },
    { libelle: "Opérateurs de plus", valeur: qte(l.emplois) },
  ];
}

function chiffresDuResultat(r: ResultatDuDossier): ChiffreDuScenario[] {
  return [
    { libelle: "Prêt obtenu", valeur: `${r.pretVert ? "vert" : "classique"}, à ${pct(r.pret.taux)}`, ton: r.pretVert ? "bon" : undefined },
    { libelle: "Taux d'actualisation du projet", valeur: pct(r.taux) },
    { libelle: "VAN du projet, à ce taux", valeur: eur(r.van) },
    { libelle: "Part de l'investissement alignée sur la taxonomie", valeur: pct(r.partAlignee) },
    { libelle: `CO2 évité face à B, sur ${DUREE_DES_PROJETS} ans`, valeur: `${qte(r.tonnesEviteesSurCinqAns)} t` },
    { libelle: "Opérateurs de plus", valeur: qte(r.emplois) },
    { libelle: "Relation avec la banque", valeur: RELATION[r.relation], ton: r.relation === "abimee" ? "alerte" : "bon" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// LES SITUATIONS
// ─────────────────────────────────────────────────────────────────────────────

function situation(avant: readonly string[]): SituationDuScenario {
  const s = suiteDe(avant);
  if (avant.length === 0) {
    return {
      titre: "La ligne",
      consigne: "Quelle seconde ligne retenez-vous pour la gamme ?",
      paragraphes: [
        `À ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, l'étude d'hier donne B devant A : ${eur(D.vanDeB)} contre ${eur(D.vanDeA)}. Elle compte l'électricité au prix d'aujourd'hui.`,
        `Les équipements d'efficacité ne vont qu'avec la ligne manuelle : A durable. Le prêt vert de la banque ne finance qu'un projet dont une part est alignée.`,
      ],
      chiffres: [
        { libelle: `VAN de A à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, l'étude d'hier`, valeur: eur(D.vanDeA) },
        { libelle: `VAN de B à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, l'étude d'hier`, valeur: eur(D.vanDeB) },
        { libelle: "Hausse attendue de l'électricité", valeur: `${qte(HAUSSE_ATTENDUE_DU_KWH)} € par kWh` },
      ],
      pieces: [COURRIEL, ETUDE, DEVIS, ELECTRICITE, BANQUE],
      options: CHOIX_DU_DOSSIER[0]!.map((code) => ({ code, texte: LIBELLES_DE_LA_LIGNE[code as ChoixDeLaLigne] })),
    };
  }
  const l = ligneDuDossier(s.ligne!);
  return {
    titre: "Le prêt",
    consigne: `Quel prêt demandez-vous pour ${NOMS[s.ligne!]} ?`,
    paragraphes: [
      `La banque finance ${pct(PRET_VERT.part)} du projet. Le prêt vert, de ${qte(auCentime((PRET_VERT.tauxClassique - PRET_VERT.tauxVert) * 100))} points moins cher, baisserait le taux d'actualisation du projet à ${pct(D.tauxVert)} : l'économie d'intérêts, après impôt, sur la part qu'il finance.`,
      l.partAlignee > 0
        ? `Dans ${NOMS[s.ligne!]}, seuls les équipements d'efficacité sont alignés : ${eur(EQUIPEMENTS_D_EFFICACITE.montant)} sur ${eur(l.investissement)}, ${pct(l.partAlignee)}. Ni la ligne ni les moules ne relèvent de la taxonomie.`
        : `Aucune dépense de ${NOMS[s.ligne!]} n'est alignée sur la taxonomie : ni la ligne ni les moules n'en relèvent.`,
    ],
    chiffres: chiffresDeLaLigne(s.ligne!),
    pieces: [BANQUE, DEVIS],
    options: CHOIX_DU_DOSSIER[1]!.map((code) => ({ code, texte: libelleDuPret(s, code as ChoixDuPret) })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES CONSÉQUENCES
// ─────────────────────────────────────────────────────────────────────────────

function consequence(codes: readonly string[]) {
  const s = suiteDe(codes);
  if (codes.length === 1) {
    const ligne = s.ligne!;
    const textes: Record<ChoixDeLaLigne, string[]> = {
      a: [`Vous retenez la ligne manuelle, ${eur(investissement(PROJET_LIGNE_MANUELLE))}. Au prix de l'électricité, elle ne change rien : sa VAN reste ${eur(D.vanDeA)}, à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}.`],
      "a-durable": [
        `Vous ajoutez les équipements : ${eur(EQUIPEMENTS_D_EFFICACITE.montant)}, dont ${eur(D.efficacite.subvention)} d'aide. Ils économisent ${qte(KWH_ECONOMISES_PAR_AN)} kWh par an, au prix attendu, et rapportent ${eur(D.vanDeLEfficacite)} de VAN.`,
        `À ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, A durable vaut ${eur(D.vanDeADurableA9)} : encore derrière B, une fois son risque compté.`,
      ],
      b: [
        `Vous retenez la ligne semi-automatique. Ses ${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh de plus par an subissent la hausse attendue : ${eur(D.risque.apresImpot)} par an après impôt, ${eur(-D.vanDuRisque)} en valeur actuelle.`,
        `À ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, B vaut ${eur(D.vanDeBAvecLeRisque)}, son risque compris.`,
      ],
    };
    return { titre: "La ligne", paragraphes: textes[ligne], chiffres: chiffresDeLaLigne(ligne) };
  }
  const r = resultatDuDossier(s as SuiteCompleteDuDossier);
  return { titre: "Le prêt", paragraphes: paragraphesDuPret(r), chiffres: chiffresDuResultat(r) };
}

function paragraphesDuPret(r: ResultatDuDossier): string[] {
  const nom = NOMS[r.suite.ligne];
  if (r.fin === "vert") {
    return [
      `La banque contrôle les équipements et accorde le prêt vert à ${pct(PRET_VERT.tauxVert)} : le taux du projet tombe à ${pct(r.taux)}, et sa VAN monte à ${eur(r.van)}.`,
      "Le taux joue sur tous les flux du projet, pas seulement sur ceux des équipements.",
    ];
  }
  if (r.fin === "refus") {
    return [`Aucune part de ${nom} n'est alignée : la banque refuse le prêt vert et propose le prêt classique. Le taux du projet reste ${pct(r.taux)}, sa VAN ${eur(r.van)}. Le dossier était honnête : la relation reste bonne.`];
  }
  if (r.fin === "facade") {
    return [
      `La banque contrôle les critères techniques sur pièces : ${r.partAlignee > 0 ? `seuls les équipements sont alignés, ${pct(r.partAlignee)} de l'investissement` : "rien n'est aligné"}. Elle refuse le prêt vert, ne prête qu'au taux classique, et note le dossier.`,
      `Le taux du projet reste ${pct(r.taux)}, sa VAN ${eur(r.van)}. La relation avec la banque est abîmée : le prochain dossier sera lu avec méfiance.`,
    ];
  }
  return [`La banque prête au taux classique, ${pct(PRET_VERT.tauxClassique)}. Le taux du projet reste ${pct(r.taux)}, sa VAN ${eur(r.van)}.`];
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BILAN
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = [
  { id: "la-ligne", titre: "La ligne", options: CHOIX_DU_DOSSIER[0]! },
  { id: "le-pret", titre: "Le prêt", options: CHOIX_DU_DOSSIER[1]! },
] as const;

const codesDe = (s: SuiteCompleteDuDossier) => [s.ligne, s.pret];

function resumer(r: ResultatDuDossier): SuiteResumee {
  return { choix: DECISIONS.map((d, i) => ({ decision: d.titre, option: libelleDuChoix(r.suite, i) })), chiffres: chiffresDuResultat(r) };
}

const FINS: Readonly<Record<FinDuDossier, { titre: string; paragraphes: (r: ResultatDuDossier) => string[] }>> = {
  vert: {
    titre: "Le prêt vert obtenu",
    paragraphes: (r) => [`Le projet porte une part alignée, la banque l'a contrôlée, et le prêt vert relève sa VAN à ${eur(r.van)}. Le dossier se défend sur ses chiffres et sur ses critères extra-financiers.`],
  },
  classique: {
    titre: "Le prêt classique",
    paragraphes: (r) => [`Le projet est financé au taux classique : sa VAN est de ${eur(r.van)}. ${r.aligne ? "Le prêt vert était à portée : la part alignée le permettait." : "Sans part alignée, le prêt vert n'était pas à portée."}`],
  },
  refus: {
    titre: "Le prêt vert refusé",
    paragraphes: () => ["Un prêt vert ne finance pas un projet sans part alignée. Le refus ne coûte rien, mais il dit que la porte du taux s'ouvrait à la première décision, avec la ligne."],
  },
  facade: {
    titre: "Le dossier verdi de façade",
    paragraphes: () => ["Présenter comme aligné ce qui ne l'est pas, c'est le verdissement de façade. La banque contrôle, refuse, et s'en souvient : la confiance perdue coûte plus que l'écart de taux."],
  },
};

function justification(b: ResultatDuDossier): string[] {
  const classique = resultatDuDossier({ ...b.suite, pret: "classique" });
  const bClassique = resultatDuDossier({ ligne: "b", pret: "classique" });
  return [
    `La meilleure suite : ${DECISIONS.map((_, i) => minuscule(libelleDuChoix(b.suite, i))).join(" ; ")}. Sa VAN est de ${eur(b.van)}.`,
    `À ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, B garde l'avantage, ${eur(bClassique.van)} contre ${eur(classique.van)} : sans prêt vert, A durable ne passe pas devant.`,
    `Les équipements d'efficacité ouvrent le prêt vert : le taux du projet tombe à ${pct(b.taux)}, et sa VAN gagne ${eur(auCentime(b.van - classique.van))}.`,
    `A durable consomme ${qte(b.kwhEnMoinsQueB)} kWh de moins que B par an, crée ${qte(b.emplois)} postes contre ${qte(EMPLOIS_CREES.B)}, et sa part alignée, ${pct(b.partAlignee)}, est celle que la banque a contrôlée.`,
  ];
}

function bilan(codes: readonly string[]) {
  const s = suiteDe(codes) as SuiteCompleteDuDossier;
  const r = resultatDuDossier(s);
  const b = meilleurDossier();
  const memes = codesDe(b.suite).every((x, i) => x === codes[i]);
  const comparaison: string[] = memes
    ? [`Votre suite est la meilleure des ${toutesLesSuitesDuDossier().length} : la VAN la plus haute, et un dossier que la banque a pu contrôler.`]
    : [
        `Votre projet vaut ${eur(r.van)}, celui de la meilleure suite ${eur(b.van)}, soit ${eur(auCentime(b.van - r.van))} de plus.`,
        ...(r.relation === "abimee" ? ["Votre dossier abîme la relation avec la banque, ce que la meilleure suite évite."] : []),
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

const meilleur = meilleurDossier();
const auTauxClassique = resultatDuDossier({ ...meilleur.suite, pret: "classique" });

export const LE_DOSSIER_VERT_DE_NOVA: Scenario = {
  code: "le-dossier-vert-de-nova",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  reprend: ["evaluer-un-investissement-durable"],
  commanditaire: "Le président",
  entreprise: { code: "nova", nom: "NOVA" },
  titre: "Scénario : le dossier vert de NOVA",
  accroche: "B a la meilleure VAN de l'étude d'hier. La ligne, puis le prêt demandé à la banque : chaque choix ouvre ou ferme le suivant.",
  objectifs: [
    "Faire entrer la transition écologique dans les flux d'un projet : un coût de plus, une aide, un risque évité",
    "Faire entrer un financement vert dans le taux d'actualisation, et savoir à quel projet il s'ouvre",
    "Choisir un projet sur sa VAN et ses critères extra-financiers, sans verdissement de façade",
  ],
  libre: false,
  accueil: [
    "Vous tenez le contrôle de gestion de NOVA. Nous sommes fin décembre N, et le président doit choisir la seconde ligne de la gamme avant de voir la banque.",
    "Vous décidez l'une après l'autre. Après chaque décision, vous voyez ce qu'elle change ; la suivante part de là. À la fin, un bilan compare votre suite à la meilleure.",
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
      "La transition entre dans les flux, par un coût, une aide et un risque évité, et dans le taux, par un financement vert. Le second ne s'ouvre qu'à un projet qui porte une part alignée.",
      "Un dossier vert se défend par ce que la banque peut contrôler, jamais par ce qu'on lui déclare.",
    ],
    questions: [
      {
        id: "le-taux-vert",
        question: `Le prêt vert fait passer la VAN du projet A durable de ${eur(auTauxClassique.van)} à ${eur(meilleur.van)}. Par où ?`,
        options: [
          { texte: "Il baisse le taux d'actualisation", juste: true, retour: `Oui : ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} − ${pct(PRET_VERT.part)} × (${pct(PRET_VERT.tauxClassique)} − ${pct(PRET_VERT.tauxVert)}) × (1 − ${pct(t)}) = ${pct(meilleur.taux)}. Le taux joue sur tous les flux du projet.` },
          { texte: "Il ajoute aux flux l'électricité économisée par les équipements", juste: false, retour: "Non : l'électricité économisée était déjà dans les flux du projet A durable. Le prêt vert agit sur le taux." },
          { texte: "Il remplace la subvention, que la banque verse à la place de l'État", juste: false, retour: "Non : la subvention reste une aide publique, dans les flux de la date 0. Le prêt vert est un financement moins cher." },
        ],
      },
      {
        id: "la-facade",
        question: "Pourquoi la banque refuse-t-elle le prêt vert à un dossier qui présente toute la ligne comme alignée ?",
        options: [
          { texte: "Elle contrôle ce qui est aligné", juste: true, retour: "Oui : seuls les équipements d'efficacité relèvent de la taxonomie. La banque contrôle les critères techniques sur pièces, et un dossier verdi de façade perd sa confiance." },
          { texte: "Elle ne finance jamais une ligne de production par un prêt vert", juste: false, retour: "Non : elle finance le projet A durable par un prêt vert, parce qu'une part de ses dépenses est alignée et contrôlée." },
          { texte: "Le prêt vert est réservé aux entreprises qui publient leur part alignée", juste: false, retour: "Non : NOVA, petite entreprise, n'a pas à la publier. Elle la montre à sa banque, qui la contrôle." },
        ],
      },
    ],
  },
};
