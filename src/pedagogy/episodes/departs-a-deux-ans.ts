/**
 * ÉPISODE 73 — LES CONSULTANTS QUI PARTENT À DEUX ANS, tel que l'interface et
 * le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi des départs de Maëline montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Une politique de fidélisation se juge sur l'année, l'épisode dure un
 * trimestre : le tableau de bord suit donc l'ÉCONOMIE NETTE ESTIMÉE, le coût
 * des départs évités sur l'année par rapport au rythme de l'an dernier, moins
 * le coût des mesures, recalculée chaque semaine avec les démissions
 * constatées et ce que le trimestre apprend (Halden, les seniors, la
 * certification).
 */
import {
  ANNONCE_HALDEN,
  BUDGET_MESURES,
  CERTIFICATION,
  D,
  INCIDENT,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_ECONOMIE,
  OBJECTIF_TAUX,
  PERTE_PAR_JOUR,
  KERZERHO,
  REGIE,
  SEGMENTS,
  SEMAINES,
  TAUX_AN_DERNIER,
  coutDUnDepart,
  departsDeReference,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/departs-a-deux-ans";
import {
  DIAGNOSTICS,
  RUBEN,
  ETAPES,
  ABEL,
  AISSATOU,
  JAKEZ,
  NOE,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/departs-a-deux-ans";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le coût d'un départ de consultant à deux ans, en k€ : ce que la prévision de la semaine 1 demande. */
export const COUT_A_DEUX_ANS = coutDUnDepart("juniors") / 1000;

const RH = { de: "Équipe des ressources humaines", role: "Atlas Conseil" } as const;
const HALDEN = { de: "Presse économique", role: "Nantes" } as const;

const demissions = (t: Trimestre) => SEGMENTS.reduce((x, s) => x + t.constates[s], 0);
/** Les mesures qui répondent chacune à la cause de son segment. */
const parSegment = (chemin: readonly number[]) =>
  [chemin[D.augmentations] === 1, chemin[D.intercontrat] === 1, chemin[D.parcours] === 1].filter(
    Boolean,
  ).length;

/** Ce que les décisions révèlent, dans l'ordre où une directrice des ressources humaines les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient qui part, pour quelle raison, et ce que cela coûte",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    segments:
      "Votre diagnostic de la semaine 1 était juste : chaque segment part pour sa raison, les missions chez les juniors, les perspectives chez les seniors, la rémunération chez les profils data.",
    missions:
      "En semaine 1, vous avez vu les missions et l'intercontrat : la première cause du plus grand segment, mais ni celle des seniors, ni celle des profils data.",
    salaires:
      "En semaine 1, vous avez retenu les salaires ; lus par segment, les entretiens ne le disaient que pour les profils data. La synthèse des questionnaires mettait la rémunération en tête parce que chacun la coche, pas parce qu'elle fait partir.",
    marche:
      "En semaine 1, vous avez jugé les départs inévitables ; sept départs sur dix avaient une cause qu'Atlas pouvait traiter.",
  };
  const justes = ["segments", "missions"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "segments" ? 1 : d === "missions" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du cabinet sous pression : ni augmenter tout le monde, ni remplir l'occupation avec des régies, ni publier sans demander, ni recruter comme le budget le disait, ni acheter des seniors au prix du marché."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : augmenter tout le monde, remplir l'occupation avec des régies, publier sans demander, recruter comme le budget le disait, acheter des seniors au prix du marché.${
            t.departGroupe ? " Deux juniors de la même régie ont démissionné ensemble." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_A_DEUX_ANS,
    "pour le départ d'un consultant à deux ans",
    "k€",
    { juste: 2.5, proche: 6 },
    (e) => `${nombre(e)} k€`,
  );

  const k = parSegment(p.chemin);
  const segments: Constat = {
    score: k === 3 ? 1 : k === 2 ? 0.6 : 0,
    texte:
      k === 3
        ? "Vous avez répondu à chaque segment par sa cause : le rattrapage pour les profils data, des missions choisies pour les juniors, des parcours demandés aux seniors avant d'être publiés."
        : `Vous avez répondu à ${k} segment${k > 1 ? "s" : ""} sur trois par sa cause propre. Une mesure qui ne touche pas la raison de partir d'un segment coûte sans le retenir.`,
  };

  return [information, diagnostic, reflexe, calibrage, segments];
}

export function axe([information, diagnostic, reflexe, calibrage, segments]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire les entretiens de départ par segment",
      texte:
        "Rejouez l'épisode en relisant d'abord les 46 entretiens de départ, raison principale par raison principale et segment par segment, et en chiffrant ce que coûte un départ : la rémunération n'était la première cause que chez les profils data.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter la raison de partir, pas le salaire de tous",
      texte:
        "Une hausse générale paie tout le monde pour retenir ceux qui partent pour l'argent, et ne retient pas les autres. Cherchez la cause de chaque segment : l'intérêt des missions, une progression visible, la mobilité interne ; puis payez là où le marché l'exige.",
    };
  }
  if (segments!.score === 0) {
    return {
      titre: "Une mesure par segment",
      texte:
        "Juniors, seniors et profils data ne partent pas pour la même raison : une mesure n'agit que sur la cause qu'elle traite. Faites correspondre chaque mesure à un segment et à sa cause.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Segmenter avant de conclure",
      texte:
        "Une moyenne de cabinet mélange des départs qui n'ont rien en commun. Lisez les causes par ancienneté et par profil avant de choisir une politique.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul d'un départ",
      texte:
        "Posez les quatre postes : le recrutement, la marge perdue pendant que le poste est vide, les jours que la recrue ne facture pas, et la part des départs qui emportent un client. C'est souvent le dernier qu'on oublie.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const demissionsA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.demissions);

export const EPISODE_TURNOVER: Episode<Trimestre> = {
  code: "departs-a-deux-ans",
  numero: 73,
  domaine: "Fidéliser dans un cabinet",
  titre: "Les consultants qui partent à deux ans",
  resume:
    "Un cabinet qui perd un consultant sur quatre chaque année, et des associés qui veulent 6 % pour tous. Lire les départs par segment, et traiter la raison de partir.",
  persona:
    "Vous êtes Maëline Courtecuisse, directrice des ressources humaines d'Atlas Conseil, cabinet de conseil en management et bureau d'études : 240 collaborateurs, dont 190 consultants facturables, cinq practices, un siège à Nantes et des bureaux à Rennes, Bordeaux et Paris. L'an dernier, 24 % des consultants sont partis, vers les clients et vers Halden Partners.",
  mandat: [
    {
      fort: taux(OBJECTIF_TAUX, 0),
      texte: "de départs sur l'année au plus, contre 24 % l'an dernier",
    },
    { fort: "3 %", texte: "d'enveloppe d'augmentations prévue au budget" },
    { fort: kE(BUDGET_MESURES), texte: "de budget de fidélisation, hors enveloppe" },
    { fort: kE(OBJECTIF_ECONOMIE), texte: "d'économie nette attendue sur l'année" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur l'économie nette estimée en semaine 13 : le coût des départs évités sur l'année par rapport au rythme de l'an dernier, moins le coût des mesures prises et les pertes du trimestre.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos départs",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du comité de direction se boucle avec un cabinet de rémunération payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Victoire Lanoë",
        role: "Présidente d'Atlas Conseil",
        alerte: true,
        texte: `Pour tenir la date du comité, j'ai fait boucler ton dossier par le cabinet de rémunération : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle: "le coût moyen du départ d'un consultant à deux ans d'ancienneté, en milliers d'euros",
    unite: "k€",
    placeholder: "30",
    min: 0,
    max: 300,
    step: 0.5,
    reel: () => COUT_A_DEUX_ANS,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "taux",
      nom: "Taux de départ estimé",
      format: (v) => taux(v, 1),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "sur l'année : départs constatés, et attendus d'ici décembre"
          : `l'an dernier ; objectif ${taux(OBJECTIF_TAUX, 0)}`,
    },
    {
      cle: "economie",
      nom: "Économie nette estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "départs évités sur l'année, moins le coût des mesures"
          : "rien n'est encore décidé",
    },
    {
      cle: "demissions",
      nom: "Démissions depuis janvier",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `même période l'an dernier : ${nombre(l.reference ?? 0, 0)}`
          : `${nombre(departsDeReference(1, SEMAINES), 0)} au premier trimestre l'an dernier`,
    },
    {
      cle: "intercontrat",
      nom: "Consultants en intercontrat",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `fin de semaine ${semaine}` : "janvier : les marchés publics attendent",
    },
    {
      cle: "mesures",
      nom: "Coût des mesures sur l'année",
      format: kE,
      sensBon: -1,
      aide: () => `budget de fidélisation : ${kE(BUDGET_MESURES)}, hors enveloppe`,
      jauge: (l) => ({
        part: Math.min(1, Math.max(0, (l.mesures ?? 0) / BUDGET_MESURES)),
        enRetard: (l.mesures ?? 0) > BUDGET_MESURES,
      }),
    },
  ],
  contexte(l, decisions): Contexte {
    const parcours = decisions[D.parcours];
    return {
      taux: taux(l.taux ?? TAUX_AN_DERNIER, 1),
      economie: kE(l.economie ?? 0),
      demissions: nombre(l.demissions ?? 0, 0),
      reference: nombre(l.reference ?? 0, 0),
      intercontrat: nombre(l.intercontrat ?? 0, 0),
      besoin: nombre(l.besoin ?? 0, 0),
      halden: (l.halden ?? 0) === 1,
      bourse: decisions[D.intercontrat] === 1,
      parcours: parcours === 0 || parcours === 1,
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Démissions, sem. ${de} à ${a}`, nombre(s.demissions - demissionsA(t, de - 1), 0)],
      [`Taux de départ estimé, sem. ${a}`, taux(s.taux, 1)],
      [`Économie nette estimée, sem. ${a}`, kE(s.economie)],
    ];
  },
  courbe: {
    titre: "Taux de départ estimé sur l'année, semaine par semaine",
    cle: "taux",
    cible: OBJECTIF_TAUX,
    libelleCible: `objectif : ${taux(OBJECTIF_TAUX, 0)} au plus`,
    graduations: [0.16, 0.2, 0.24, 0.28, 0.32],
    format: (v) => taux(v, 0),
    details: (s) => [
      `taux estimé ${taux(s.taux!, 1)} · ${nombre(s.demissions!, 0)} démissions depuis janvier`,
      `économie nette ${kE(s.economie!)} · ${nombre(s.intercontrat!, 0)} en intercontrat`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.parcours && choix === 1) {
      // Ce que les seniors attendent ne dépend que du hasard du trimestre.
      return [
        {
          ...RH,
          texte: hasard(graine).expertise
            ? REPONSES.entretiensExpertise
            : REPONSES.entretiensManager,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.kerzerho) {
      const parcours = chemin[D.parcours] === 0 || chemin[D.parcours] === 1;
      lies.push({
        ...JAKEZ,
        heure: `sem. ${KERZERHO.semaine}`,
        alerte: t.kerzerhoPart,
        texte: t.kerzerhoPart
          ? "Halden m'a proposé de monter leur équipe data dans l'Ouest. J'ai accepté : ici, je ne voyais pas la marche suivante. Je pars à la fin de mon préavis."
          : parcours
            ? "Halden m'a appelé pour monter leur équipe data. J'ai dit non : le chemin vers la direction de practice est écrit, je sais où je vais."
            : "Halden m'a appelé pour monter leur équipe data. J'ai dit non, pour cette fois.",
      });
      if (t.kerzerhoPart) {
        lies.push({
          ...RUBEN,
          heure: `sem. ${KERZERHO.semaine}`,
          alerte: t.clientPerdu,
          texte: t.clientPerdu
            ? `La Banque de l'Erdre suit Jakez : elle confie la suite de son programme data à Halden. ${kE(KERZERHO.perteClient)} de marge en moins cette année.`
            : "La Banque de l'Erdre reste avec nous : l'associé reprend la relation, et l'équipe a rassuré le client.",
        });
      }
    }
    if (arrive.departGroupe) {
      lies.push({
        ...AISSATOU,
        heure: `sem. ${REGIE.semaine}`,
        alerte: true,
        texte:
          "Deux des juniors placés en régie chez l'industriel démissionnent le même jour : « neuf mois de saisie, on n'est pas venus pour ça ». Le client demande des remplaçants.",
      });
    }
    if (arrive.certification) {
      lies.push({
        ...ABEL,
        heure: `sem. ${CERTIFICATION}`,
        alerte: !t.certification,
        texte: t.certification
          ? "Les quatre ont obtenu leur certification d'auditeur. Ils partent en audit lundi, en binôme avec mes seniors."
          : "Deux des quatre ont échoué à la certification. Je prends deux indépendants en urgence, et les deux recalés retournent en intercontrat.",
      });
    }
    if (arrive.incident) {
      lies.push({
        ...NOE,
        heure: `sem. ${INCIDENT}`,
        alerte: true,
        texte:
          "Un livrable parti sans relecture chez un client hospitalier : erreurs de calcul, comité de pilotage annulé. Nous reprenons le travail à nos frais.",
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.halden) {
      imprevus.push({
        ...HALDEN,
        heure: `sem. ${ANNONCE_HALDEN}`,
        texte: t.halden ? REPONSES.haldenOui : REPONSES.haldenNon,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} d'économie nette sur l'année, estimée en semaine 13`
        : `${kE(-t.objectif)} de surcoût net sur l'année, estimé en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Économie nette sur l'année : le coût des départs évités par rapport au rythme de l'an dernier, moins le coût des mesures et les pertes du trimestre, estimée en semaine 13 sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const reference = departsDeReference(1, SEMAINES);
      return [
        {
          nom: "Taux de départ",
          valeur: taux(t.taux, 1),
          aide: `estimé sur l'année ; objectif ${taux(OBJECTIF_TAUX, 0)}`,
          tenu: t.taux <= OBJECTIF_TAUX,
        },
        {
          nom: "Économie nette",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_ECONOMIE)}`,
          tenu: t.objectif >= OBJECTIF_ECONOMIE,
        },
        {
          nom: "Démissions du trimestre",
          valeur: nombre(demissions(t), 0),
          aide: `${nombre(reference, 0)} au premier trimestre l'an dernier`,
          tenu: demissions(t) <= reference,
        },
        {
          nom: "Coût des mesures",
          valeur: kE(t.mesures),
          aide: `sur l'année ; budget ${kE(BUDGET_MESURES)}`,
          tenu: t.mesures <= BUDGET_MESURES,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const equipe = [
        t.kerzerhoPart
          ? `Jakez Kerzerho est parti chez Halden${t.clientPerdu ? ", et la Banque de l'Erdre l'a suivi" : ", sans emporter la Banque de l'Erdre"}`
          : "Jakez Kerzerho a refusé l'offre de Halden",
        t.departGroupe ? "deux juniors de la régie ont démissionné ensemble" : null,
        t.certification === true ? "les quatre reconvertis ont été certifiés" : null,
        t.certification === false
          ? "deux des quatre reconvertis ont échoué à la certification"
          : null,
        t.incident ? "un livrable est parti sans relecture" : null,
      ].filter(Boolean);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Halden Partners",
          texte: t.halden
            ? "a ouvert un bureau à Nantes : seniors et profils data plus sollicités le reste de l'année."
            : "est resté à Paris cette année.",
        },
        {
          titre: "Les seniors",
          texte: t.expertise
            ? "attendaient en majorité une filière d'expertise, pas seulement la voie de manager."
            : "voulaient d'abord passer manager, avec des critères clairs.",
        },
        { titre: "L'équipe", texte: `${equipe.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()) },
      ];
    },
  },
  comportements,
  axe,
};
