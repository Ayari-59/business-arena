/**
 * ÉPISODE 18 — L'AGENDA QUI DÉBORDE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Clovis montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Deux contournements du contrat `Episode`, comme dans les cinq premiers écrits
 * après l'équipe (dépôt, budget, projet, achats, recrutement) :
 * les suites qui dépendent d'un choix antérieur (le point d'étape de Tariq,
 * l'ouverture du drive, les entretiens menés par les adjoints, la réponse du
 * groupe scolaire) passent par `evenements().lies`, et `lire` renvoie des clés
 * non affichées (délai, fatigue, autonomie, avancement attendu…) qui
 * nourrissent les messages, les sources et la jauge.
 */
import {
  BUDGET,
  D,
  EFFECTIF,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_FILE,
  OBJECTIF_HEURES,
  OUVERTURE_PREVUE,
  PERTE_PAR_JOUR,
  PROJET,
  SEUIL_TARIQ,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/agenda-qui-deborde";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/agenda-qui-deborde";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v)} j`;
const heures = (v: number) => `${nombre(v, 0)} h`;
const dossiers = (v: number) => nombre(v, 0);
const avancement = (v: number) => `${nombre((100 * v) / PROJET, 0)} %`;
/** Un écart au budget de marge : positif, l'agence a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où passait votre temps et ce qui attendait sur votre bureau",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    goulot:
      "Votre diagnostic de la semaine 1 était juste : tout passait par vous, et c'est l'attente de vos signatures qui coûtait.",
    reunions:
      "En semaine 1, vous avez vu les réunions et les interruptions : une vraie fuite de temps, mais pas la cause. Sept dossiers sur dix qui attendaient votre signature pouvaient être signés par vos adjoints.",
    adjoints:
      "En semaine 1, vous avez retenu que vos adjoints n'étaient pas au niveau ; ils préparaient déjà tous les dossiers, il leur manquait seulement le droit de décider.",
    effectif:
      "En semaine 1, vous avez retenu le manque de monde ; l'agence était dans la moyenne de la région, et le travail attendait sur un seul bureau, le vôtre.",
  };
  const justes = ["goulot", "reunions"];
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
    score: d === "goulot" ? 1 : d === "reunions" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la surcharge en travaillant plus, en reprenant tout en main ou en lâchant tout sans cadre : vous avez retiré des dossiers de votre bureau, avec des règles."
        : `Face à la surcharge, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de travailler plus, de tout contrôler ou de tout lâcher sans cadre. Les heures gagnées revenaient en fatigue, et la fatigue en erreurs.${
            t.maximeArrete ? " Vous avez fini par être arrêté une semaine." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[2]!.file,
    "en attente sur votre bureau en fin de semaine 2",
    "dossiers",
    { juste: 8, proche: 20 },
    (e) => `${nombre(e, 0)} dossier${e >= 2 ? "s" : ""}`,
  );

  const driveProtege = p.chemin[D.drive] === 0 || p.chemin[D.drive] === 1;
  const entretiensTenus = p.chemin[D.entretiens] === 0 || p.chemin[D.entretiens] === 2;
  const tenus = (driveProtege ? 1 : 0) + (entretiensTenus ? 1 : 0);
  const important: Constat = {
    score: tenus === 2 ? 1 : tenus === 1 ? 0.6 : 0,
    texte: `${
      driveProtege
        ? p.chemin[D.drive] === 0
          ? "Vous avez protégé du temps pour le drive au lieu de le laisser aux urgences."
          : "Vous avez confié le drive à Tariq avec un point d'étape au lieu de le laisser aux urgences."
        : `Le drive n'a pas eu de temps à lui dans vos journées${
            t.crise ? " : il est devenu une crise en semaine 9" : ""
          }.`
    } ${
      entretiensTenus
        ? "Les entretiens annuels ont été tenus pendant le trimestre, en commençant par vos adjoints."
        : p.chemin[D.entretiens] === 1
          ? "Les entretiens annuels ont été expédiés en une journée, en semaine 13."
          : "Les entretiens annuels ont été reportés."
    }${t.gwenaellePart ? " Gwenaëlle est partie chercher ailleurs les responsabilités qu'elle demandait." : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, important];
}

export function axe([information, diagnostic, reflexe, calibrage, important]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer où va votre temps",
      texte:
        "Rejouez l'épisode en relevant d'abord une semaine de votre agenda et ce qui attend sur votre bureau : sept dossiers sur dix pouvaient être signés par vos adjoints.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Déléguer avec un cadre plutôt que travailler plus",
      texte:
        "Des heures en plus vident la pile un mois et remplissent la fatigue un trimestre ; tout reprendre après une erreur remet la pile sur votre bureau. Fixez des seuils, formez, contrôlez un dossier sur cinq, puis lâchez.",
    };
  }
  if (important!.score === 0) {
    return {
      titre: "Protéger du temps pour l'important",
      texte:
        "Ce qui n'est jamais urgent finit par le devenir : un projet sans temps à lui devient une crise, une équipe sans entretien finit par partir. Bloquez du temps, ou confiez-le avec un point d'étape, avant que l'urgence ne s'en charge.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où les décisions attendent",
      texte:
        "Quand tout est en retard, regardez où les dossiers s'arrêtent avant de compter les heures : le goulot, c'était votre bureau.",
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

const GWENAELLE = {
  de: "Gwenaëlle Kerjean",
  role: "Adjointe, responsable des ventes",
} as const;
const TARIQ = {
  de: "Tariq Lahlou",
  role: "Adjoint, responsable du dépôt",
} as const;

export const EPISODE_AGENDA: Episode<Trimestre> = {
  code: "agenda-qui-deborde",
  numero: 20,
  domaine: "Organisation et délégation",
  titre: "L'agenda qui déborde",
  resume:
    "Un directeur d'agence à soixante heures par semaine : tout passe par lui, et l'important n'avance pas. Retirer des dossiers de son bureau plutôt que travailler plus.",
  persona:
    "Vous êtes Clovis Lemaistre, directeur de l'agence Arvel Distribution de Genas, agrandie l'an dernier d'une cour couverte et d'un drive encore en travaux. Votre équipe : deux adjoints, Gwenaëlle Kerjean aux ventes et Tariq Lahlou au dépôt, et les douze personnes de leurs équipes.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge nette de l'agence sur le trimestre" },
    {
      fort: `semaine ${OUVERTURE_PREVUE}`,
      texte: "pour ouvrir le drive, annoncée aux clients",
    },
    {
      fort: `${EFFECTIF} entretiens`,
      texte: "annuels à tenir avant la fin du trimestre",
    },
    {
      fort: `${OBJECTIF_FILE} dossiers`,
      texte: "en attente de votre signature, au plus",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge nette de l'agence en écart au budget, en comptant ce que coûtent les décisions qui attendent, les erreurs, les opportunités manquées et les départs.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les devis qui attendent votre signature finissent par partir chez un concurrent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...GWENAELLE,
        alerte: true,
        texte: `Pendant ce temps, Menuiserie Oberti a signé chez un concurrent, et deux devis ont expiré : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de dossiers en attente sur votre bureau en fin de semaine 2",
    unite: "dossiers",
    placeholder: "64",
    min: 0,
    max: 300,
    step: 1,
    reel: (t) => t.semaines[2]!.file,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "file",
      nom: "Dossiers en attente",
      format: dossiers,
      sensBon: -1,
      aide: (semaine, l) =>
        `${semaine ? `fin de semaine ${semaine}` : "ce matin"} ; délai moyen ${jours(l.delai ?? 0)}`,
    },
    {
      cle: "heures",
      nom: "Vos heures",
      format: heures,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine === 0
          ? "la semaine dernière"
          : l.absent
            ? "en arrêt cette semaine"
            : `objectif : ${OBJECTIF_HEURES} h au plus`,
    },
    {
      cle: "erreurs",
      nom: "Erreurs de décision",
      format: (v) => `${nombre(v)} / sem.`,
      formatEcart: (v) => nombre(v),
      sensBon: -1,
      aide: (semaine, l) =>
        semaine ? `${nombre(l.erreursCumul ?? 0, 0)} depuis la semaine 1` : "la semaine dernière",
    },
    {
      cle: "projet",
      nom: "Drive : travail fait",
      format: avancement,
      formatEcart: (v) => `${nombre((100 * v) / PROJET, 0)} pt`,
      sensBon: 1,
      aide: (_semaine, l) =>
        l.drive ? "le drive est ouvert" : `ouverture annoncée en semaine ${OUVERTURE_PREVUE}`,
      jauge: (l) =>
        l.projet === null
          ? null
          : {
              part: Math.min(1, (l.projet ?? 0) / PROJET),
              enRetard: (l.projet ?? 0) < (l.attendu ?? 0) - 0.5,
            },
    },
    {
      cle: "cumul",
      nom: "Marge nette de l'agence",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      file: dossiers(l.file ?? 0),
      delai: jours(l.delai ?? 0),
      heures: l.absent ? "aucune, vous êtes arrêté" : heures(l.heures ?? 0),
      projet: avancement(l.projet ?? 0),
      erreursCumul: nombre(l.erreursCumul ?? 0, 0),
      cadre: decisions[D.delegation] === 1,
      sansCadre: decisions[D.delegation] === 2,
      delegue: decisions[D.delegation] === 1 || decisions[D.delegation] === 2,
      epuise: (l.fatigue ?? 0) >= 0.8,
      autonome: (l.autonomie ?? 0) >= 0.6,
      drive: (l.drive ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Dossiers en attente, sem. ${a}`, dossiers(fin.file)],
      [`Vos heures, sem. ${a}`, fin.absent ? "en arrêt" : heures(fin.heures)],
      ["Marge nette de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Dossiers qui attendent votre signature, semaine par semaine",
    cle: "file",
    cible: OBJECTIF_FILE,
    libelleCible: `objectif : ${OBJECTIF_FILE} dossiers au plus`,
    graduations: [25, 50, 100, 150, 200],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${dossiers(s.file!)} en attente · délai ${jours(s.delai!)}`,
      s.absent
        ? "vous êtes en arrêt"
        : `vos heures ${heures(s.heures!)} · ${nombre(s.erreurs!)} erreurs`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.drive && choix === 1) {
      // Seul le choix de lui confier compte : sa réponse dit ce qu'il sait faire, selon le hasard du trimestre.
      const talent = hasard(graine).talentTariq;
      return [
        {
          ...TARIQ,
          texte:
            talent >= 1.1
              ? REPONSES.tariqSur
              : talent >= SEUIL_TARIQ
                ? REPONSES.tariqSerre
                : REPONSES.tariqHesitant,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.reunions] === 2 && dans(4)) {
      lies.push({
        de: "Rodrigue Ekambi",
        role: "Chef de cour",
        heure: "sem. 4",
        texte: REPONSES.sansReunion,
      });
    }
    if (arrive.pointTariq !== null) {
      lies.push({
        ...TARIQ,
        heure: "sem. 7",
        alerte: !arrive.pointTariq,
        texte: arrive.pointTariq ? REPONSES.pointTariqOk : REPONSES.pointTariqRetard,
      });
    }
    if (arrive.arret) {
      lies.push({
        de: "Coralie Courtois",
        role: "Assistante d'agence",
        heure: "sem. 9",
        alerte: true,
        texte: REPONSES.arret,
      });
    }
    if (arrive.crise) {
      lies.push({
        de: "Hortense Valadier",
        role: "Directrice régionale",
        heure: `sem. ${OUVERTURE_PREVUE}`,
        alerte: true,
        texte: REPONSES.crise,
      });
    }
    if (arrive.ouverture !== null) {
      lies.push({
        de: "Rodrigue Ekambi",
        role: "Chef de cour",
        heure: `sem. ${arrive.ouverture}`,
        texte: REPONSES.ouverture,
      });
    }
    if (chemin[D.entretiens] === 2 && dans(10)) {
      lies.push({
        ...TARIQ,
        heure: "sem. 10",
        texte:
          t.semaines[10]!.autonomie >= 0.6 ? REPONSES.entretiensPortes : REPONSES.entretiensSubis,
      });
    }
    if (arrive.gwenaellePart) {
      lies.push({
        ...GWENAELLE,
        heure: "sem. 11",
        alerte: true,
        texte: REPONSES.depart,
      });
    }
    if (arrive.offre !== null) {
      lies.push({
        de: "Bilal Kaboré",
        role: "Technico-commercial",
        heure: "sem. 12",
        alerte: !arrive.offre,
        texte: arrive.offre ? REPONSES.offreGagnee : REPONSES.offrePerdue,
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
    titre: (t) => `Marge nette ${ecartAuBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette de l'agence en écart au budget, attente des décisions, erreurs, opportunités manquées et départs compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Dossiers en attente",
          valeur: dossiers(t.fileFinale),
          aide: `en semaine 13 ; objectif ${OBJECTIF_FILE} au plus`,
          tenu: t.fileFinale <= OBJECTIF_FILE,
        },
        {
          nom: "Vos heures",
          valeur: heures(t.heuresFinales),
          aide: `en semaine 13 ; objectif ${OBJECTIF_HEURES} h au plus`,
          tenu: t.heuresFinales <= OBJECTIF_HEURES,
        },
        {
          nom: "Drive",
          valeur: t.ouverture !== null ? `semaine ${t.ouverture}` : "fermé",
          aide: `ouverture annoncée en semaine ${OUVERTURE_PREVUE}${t.crise ? ", finie dans l'urgence" : ""}`,
          tenu: t.ouverture !== null && t.ouverture <= OUVERTURE_PREVUE,
        },
        {
          nom: "Entretiens annuels",
          valeur: `${t.entretiensFaits} sur ${EFFECTIF}`,
          aide: t.gwenaellePart
            ? "Gwenaëlle s'en va"
            : t.entretiensExpedies
              ? "expédiés en une journée, en semaine 13"
              : "tenus dans le trimestre",
          tenu: t.entretiensFaits >= EFFECTIF && !t.gwenaellePart && !t.entretiensExpedies,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.offreGagnee !== null
          ? [
              {
                titre: "Le groupe scolaire",
                texte: t.offreGagnee
                  ? "a retenu votre offre."
                  : "a choisi un concurrent, un peu moins cher.",
              },
            ]
          : []),
        {
          titre: "L'agence",
          texte: [
            t.maximeArrete ? "Vous avez été arrêté une semaine" : "Vous n'avez pas été arrêté",
            t.tariqTiendrait
              ? "Tariq aurait tenu seul le calendrier du drive"
              : "Tariq n'aurait pas tenu seul le calendrier du drive",
            t.gwenaellePart ? "Gwenaëlle est partie" : "Gwenaëlle est restée",
          ]
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
