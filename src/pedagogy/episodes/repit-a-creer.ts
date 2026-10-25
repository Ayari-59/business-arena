/**
 * LE RÉPIT À CRÉER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du projet montre, ce que la
 * courbe trace, ce sur quoi le bilan juge le projet, et ce que les décisions
 * révèlent de la manière d'entreprendre.
 *
 * On ne joue pas la direction de Solvanne : on joue la personne qui porte le
 * projet. Le tableau de bord montre ce qu'un porteur de projet suit (les
 * familles accueillies, les heures de répit, la caisse, les places), et le
 * bilan parle de la démarche, de l'intention à la création.
 */
import {
  D,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  OBJECTIF_FAMILLES,
  OUVERTURE_VISEE,
  PERTE_PAR_JOUR,
  SEMAINES,
  SEMAINE_RETRAIT,
  SEMAINE_SUBVENTION,
  SUBVENTION_SUIVANTE,
  VALEUR_HEURE,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/repit-a-creer";
import {
  DIAGNOSTICS,
  ETAPES,
  PREVISION,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/repit-a-creer";
import type {
  Constat,
  Episode,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";
import { kE1 } from "./libre-service-qui-perd";

/** Les seuils de la prévision des aidants épuisés : juste, et proche. */
export const SEUILS_PREVISION = { juste: 3, proche: 8 } as const;

/** Les étapes de la création, et le bon choix de chacune : la forme, les acteurs, le calendrier, le modèle. */
export const DEMARCHE = [
  [D.forme, O.forme.service],
  [D.acteurs, O.acteurs.reunir],
  [D.calendrier, O.calendrier.retroplanning],
  [D.modele, O.modele.participation],
] as const;

/** Ce que les décisions révèlent, dans l'ordre où un porteur de projet les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient le vrai besoin des familles",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    besoin:
      "Votre diagnostic de la semaine 1 était juste : tout dépendait des bons jours, des bons horaires et du transport, que seules les familles pouvaient dire.",
    argent:
      "En semaine 1, vous avez pensé d'abord à l'argent : une vraie question, mais un accueil financé où personne ne vient ne sert à rien.",
    salle:
      "En semaine 1, vous avez pensé d'abord à la salle ; la mairie en prêtait une, et ce qui comptait était ce que les familles attendaient.",
    publicite:
      "En semaine 1, vous avez pensé d'abord à la publicité ; les familles écoutent leur soignant, et elles viennent si l'accueil répond à leur besoin.",
  };
  const justes = ["besoin", "argent"];
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
    score: d === "besoin" ? 1 : d === "argent" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = new Set(
    REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec]) => dec),
  ).size;
  const reflexes: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé à l'envie d'aller trop vite : ni ouvrir sans vérifier, ni sans forme, ni tout seul."
        : `Vous avez cédé ${n} fois sur ${ETAPES.length} décisions à l'envie d'aller vite ou de faire simple : ouvrir sans vérifier, sans forme, tout seul, tout de suite, gratuitement, ou seulement compter les passages.${
            t.incident ? " Un incident a fermé l'accueil deux semaines." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.aidants,
    "parmi les familles suivies",
    "aidants épuisés",
    SEUILS_PREVISION,
    (e) => `${nombre(e, 0)} aidant${e >= 2 ? "s" : ""}`,
  );

  const bonnes = DEMARCHE.filter(([dec, o]) => p.chemin[dec] === o).length;
  const demarche: Constat = {
    score: bonnes === DEMARCHE.length ? 1 : bonnes >= 2 ? 0.6 : 0,
    texte:
      bonnes === DEMARCHE.length
        ? "De l'intention à la création, vous avez suivi une démarche : une forme qui s'appuie sur l'existant, des acteurs réunis, un calendrier remonté depuis l'ouverture, un modèle économique calculé."
        : `Sur les ${DEMARCHE.length} étapes de la création (la forme, les acteurs, le calendrier, le modèle économique), ${bonnes} ont été construites avec méthode. L'accueil a ouvert en semaine ${t.ouverture <= SEMAINES ? t.ouverture : "jamais"}.`,
  };

  return [information, diagnostic, reflexes, calibrage, demarche];
}

export function axe([
  information,
  diagnostic,
  reflexes,
  calibrage,
  demarche,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Aller voir les familles",
      texte:
        "Rejouez l'épisode en parlant d'abord aux familles et en comptant les aidants épuisés : elles disaient quel jour et à quelle heure elles viendraient.",
    };
  }
  if (demarche!.score === 0) {
    return {
      titre: "Entreprendre avec méthode",
      texte:
        "Une forme qui s'appuie sur ce qui existe, des partenaires réunis, un calendrier remonté depuis l'ouverture, un seuil calculé : chaque étape de la création se prépare.",
    };
  }
  if (reflexes!.score === 0) {
    return {
      titre: "Ne pas confondre vite et bien",
      texte:
        "Ouvrir sans vérifier, sans forme ou tout de suite fait gagner quelques jours, et coûte ensuite des familles, de l'argent ou un incident.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Partir du besoin",
      texte:
        "Un projet réussit s'il répond à un besoin réel. L'argent, la salle et la publicité viennent ensuite.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const SABINE = {
  de: "Sabine Vautrin",
  role: "Responsable de l'aide à domicile, Solvanne",
} as const;
const FONDS = {
  de: "Fonds départemental des aidants",
  role: "Financeur",
} as const;

export const EPISODE_REPIT: Episode<Trimestre> = {
  code: "repit-a-creer",
  numero: 85,
  domaine: "Entreprendre, de l'intention à la création",
  titre: "Le répit à créer",
  resume:
    "Un projet d'accueil de répit pour les aidants, de l'idée à l'ouverture : vérifier le besoin, choisir une forme, réunir les acteurs, calculer un modèle économique.",
  persona:
    "Vous êtes Alix Fournier. Depuis huit ans, vous faites des soins à domicile pour l'Association Solvanne, à Dijon. Chez les familles, vous voyez des aidants épuisés, qui ne prennent jamais une après-midi pour eux. Vous voulez créer un accueil de répit, et c'est vous qui portez le projet, avec Sabine Vautrin, votre responsable.",
  mandat: [
    {
      fort: `semaine ${OUVERTURE_VISEE}`,
      texte: "pour ouvrir l'accueil, au plus tard",
    },
    {
      fort: `${OBJECTIF_FAMILLES}`,
      texte: "personnes accueillies par semaine, au moins",
    },
    {
      fort: euros(ENVELOPPE),
      texte: "d'enveloppe de départ : la caisse ne doit pas finir à zéro",
    },
    {
      fort: euros(SUBVENTION_SUIVANTE),
      texte: "de subvention à obtenir pour l'an prochain",
    },
  ],
  jugement: `Sabine compte en euros la valeur que le projet a créée : chaque heure de répit comme une heure d'aide à domicile (${euros(VALEUR_HEURE)}), plus ce que la caisse a gagné ou perdu, plus la subvention de l'an prochain si elle est obtenue.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre projet",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours, ce sont des heures de préparation perdues.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...SABINE,
        alerte: true,
        texte: `Le temps passe : environ ${euros(perdu)} de préparation perdus, qu'il faudra rattraper.`,
      };
    },
  },
  prevision: {
    libelle: `le nombre d'aidants épuisés parmi les familles suivies par Solvanne. Repère : ${PREVISION.familles} familles suivies, environ une sur ${PREVISION.unSur}`,
    unite: "aidants épuisés",
    placeholder: "10",
    min: 0,
    max: 200,
    step: 1,
    reel: (t) => t.aidants,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "familles",
      nom: "Personnes accueillies",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () =>
        `cette semaine ; objectif : ${OBJECTIF_FAMILLES} au moins, une fois ouvert`,
    },
    {
      cle: "heures",
      nom: "Heures de répit",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "offertes aux aidants depuis l'ouverture",
    },
    {
      cle: "caisse",
      nom: "Caisse du projet",
      format: euros,
      sensBon: 1,
      aide: () => `au départ : ${euros(ENVELOPPE)}`,
    },
    {
      cle: "places",
      nom: "Places par semaine",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "ouvertes, quand l'accueil est ouvert",
    },
  ],
  contexte(l) {
    return {
      familles: nombre(l.familles ?? 0, 0),
      heures: nombre(l.heures ?? 0, 0),
      caisse: euros(l.caisse ?? 0),
      places: nombre(l.places ?? 0, 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [
        `Personnes accueillies, sem. ${de} à ${a}`,
        nombre(
          semaines.reduce((x, w) => x + w.familles, 0),
          0,
        ),
      ],
      [`Heures de répit, sem. ${a}`, nombre(t.semaines[a]!.heures, 0)],
      [`Caisse, sem. ${a}`, euros(t.semaines[a]!.caisse)],
    ];
  },
  courbe: {
    titre: "Personnes accueillies, semaine par semaine",
    cle: "familles",
    cible: OBJECTIF_FAMILLES,
    libelleCible: `objectif : ${OBJECTIF_FAMILLES} par semaine`,
    graduations: [5, 15, 25],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.familles!, 0)} personnes accueillies · ${nombre(s.places!, 0)} places`,
      `${nombre(s.heures!, 0)} heures de répit · caisse ${euros(s.caisse!)}`,
    ],
  },
  reactions: () => null,
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.subvention) {
      lies.push({
        ...FONDS,
        heure: `sem. ${SEMAINE_SUBVENTION}`,
        texte: REPONSES.subvention,
      });
    }
    if (arrive.ouverture) {
      lies.push({
        ...SABINE,
        heure: `sem. ${arrive.semaineOuverture}`,
        texte: "L'accueil de répit ouvre ses portes cette semaine.",
      });
    }
    if (arrive.incident) {
      lies.push({
        ...SABINE,
        heure: `sem. ${arrive.semaineOuverture + 1}`,
        alerte: true,
        texte: REPONSES.incident,
      });
    }
    if (arrive.retrait) {
      lies.push({
        ...SABINE,
        heure: `sem. ${SEMAINE_RETRAIT}`,
        alerte: true,
        texte: REPONSES.retrait,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({
      semaine: x.semaine,
      titre: x.imprevu.titre,
    })),

  bilan: {
    titre: (t) => `${kE1(t.objectif)} de valeur créée par le projet`,
    formatObjectif: kE1,
    noteDesBarres:
      "Valeur créée par le projet, heures de répit, caisse et subvention de l'an prochain comprises, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Ouverture",
          valeur:
            t.ouverture <= SEMAINES ? `semaine ${t.ouverture}` : "pas ouvert",
          aide: `visée : semaine ${OUVERTURE_VISEE} au plus tard`,
          tenu: t.ouverture <= OUVERTURE_VISEE,
        },
        {
          nom: "Personnes accueillies",
          valeur: nombre(t.famillesMoyennes),
          aide: `par semaine ouverte ; objectif ${OBJECTIF_FAMILLES}`,
          tenu: t.famillesMoyennes >= OBJECTIF_FAMILLES,
        },
        {
          nom: "Caisse du projet",
          valeur: euros(t.caisse),
          aide: `en semaine ${SEMAINES} ; au départ ${euros(ENVELOPPE)}`,
          tenu: t.caisse > 0,
        },
        {
          nom: "Subvention de l'an prochain",
          valeur: t.renouvelee ? "obtenue" : "refusée",
          aide: euros(SUBVENTION_SUIVANTE),
          tenu: t.renouvelee,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les familles",
          texte: `${t.aidants} aidants épuisés parmi les familles suivies, soit ${taux(t.aidants / PREVISION.familles, 0)} des familles.`,
        },
        ...(t.subvention
          ? []
          : [
              {
                titre: "Le fonds",
                texte: "n'a pas accordé la subvention de démarrage.",
              },
            ]),
        ...(t.meceneRetire
          ? [
              {
                titre: "La grande surface",
                texte: `s'est retirée en semaine ${SEMAINE_RETRAIT}.`,
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
