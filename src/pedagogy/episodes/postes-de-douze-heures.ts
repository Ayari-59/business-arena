/**
 * ÉPISODE 87 — PASSER EN DOUZE HEURES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de suivi de l'unité d'Irène montre, ce que
 * la courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans les épisodes
 * précédents : la réponse du CSE dépend de la première décision (des
 * indicateurs ou non), que `reactions` ne reçoit pas ; elle arrive donc par
 * `evenements().lies`, à la semaine où le CSE se prononce. Et `lire` renvoie des
 * clés non affichées (la part en 12 heures, l'excès d'erreurs mesuré, les
 * indicateurs) pour nourrir les messages et les sources.
 */
import {
  ABSENCE_BASE,
  BUDGET,
  D,
  EI_BASE,
  JOURNEES,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PREAVIS,
  PROBA_UNITE_B,
  VACANCES_DEPART,
  ECONOMIE_HEURES,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/postes-de-douze-heures";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/postes-de-douze-heures";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le niveau habituel des événements indésirables, pour 1 000 journées. */
export const EI_HABITUEL = (EI_BASE / JOURNEES) * 1000;

const heures = (v: number) => `${nombre(v)} h`;
const pourMille = (v: number) => nombre(v, 1);
/** Un écart au budget : positif, l'unité a fait mieux que son budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

const HUGOLIN = {
  de: "Hugolin Cottineau",
  role: "Cadre de santé de l'unité de neurologie",
} as const;
const NORBERT = { de: "Norbert Guillemaud", role: "Secrétaire du CSE" } as const;
const TERENCE = {
  de: "Térence Mabru",
  role: "Responsable des ressources humaines de la clinique",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où une cadre de santé les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les relèves des deux trames et ce que disent les études",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    effets:
      "Votre diagnostic de la semaine 1 était juste : personne ne savait ce que les 12 heures feraient à cette équipe, et c'est en le mesurant qu'on pouvait en garder le meilleur.",
    attractivite:
      "En semaine 1, vous avez vu le recrutement : un vrai enjeu, mais un seul des effets du changement. Les erreurs de fin de poste et les départs comptaient autant.",
    camps:
      "En semaine 1, vous avez vu deux camps à départager ; les deux groupes disaient la même chose : qu'on ne décide pas pour eux.",
    securite:
      "En semaine 1, vous avez retenu le danger des 12 heures ; la fatigue de fin de poste est réelle, mais son ampleur dépend de la trame et de l'équipe, et une relève de moins évite aussi des erreurs.",
  };
  const justes = ["effets", "attractivite"];
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
    score: d === "effets" ? 1 : d === "attractivite" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais tranché par principe : ni les 12 heures imposées, ni les 12 heures refusées sans en avoir mesuré les effets."
        : `Vous avez tranché par principe ${n} fois sur ${ETAPES.length} décisions, en imposant les 12 heures ou en les refusant sans en mesurer les effets.${
            t.departOpposee !== null && t.departOpposee <= 13
              ? " Anthéa Galmiche est partie."
              : t.departVolontaire !== null && t.departVolontaire <= 13
                ? " Nabou Cissokho est partie au CHU."
                : t.conflit === "apres"
                  ? " Le CSE, consulté après coup, a fait suspendre le projet."
                  : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    ECONOMIE_HEURES,
    "d'heures de chevauchement économisées par semaine en passant l'unité en 12 heures",
    "h",
    { juste: 1, proche: 4 },
    (e) => `${nombre(e)} h`,
  );

  const experimente = p.chemin[D.projet] === 1;
  const cseTot = p.chemin[D.cse] === 0;
  const corrige = p.chemin[D.chiffres] === 1;
  const bilanChiffre = p.chemin[D.janvier] === 1;
  const bons = [experimente, cseTot, corrige, bilanChiffre].filter(Boolean).length;
  const methode: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      experimente
        ? "Vous avez fait de la question une expérimentation : un secteur, des volontaires, des indicateurs relevés avant."
        : "Vous n'avez rien mesuré avant de changer, ou de refuser de changer."
    } ${
      cseTot
        ? "Vous avez consulté le CSE avant le démarrage."
        : p.chemin[D.cse] === 2
          ? "Vous avez attendu un accord, au prix d'un trimestre sans rien apprendre."
          : "Vous avez démarré avant d'avoir l'avis du CSE."
    } ${
      corrige && bilanChiffre
        ? "Vous avez corrigé au vu des chiffres, et décidé de la suite sur un bilan chiffré."
        : bilanChiffre
          ? "Vous avez décidé de la suite sur un bilan chiffré."
          : corrige
            ? "Vous avez corrigé au vu des chiffres, mais décidé de la suite sans bilan."
            : "La suite s'est décidée sans bilan chiffré."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, methode];
}

export function axe([information, diagnostic, reflexe, calibrage, methode]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce que les 12 heures font vraiment",
      texte:
        "Rejouez l'épisode en comparant d'abord les relèves des deux trames et ce que disent les études : une relève de moins et des candidats d'un côté, la fatigue de fin de poste de l'autre, et une ampleur qui dépend de l'équipe.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni imposer, ni refuser : expérimenter",
      texte:
        "Un changement d'organisation du travail se juge sur ses effets. Imposé, il fait partir ceux qui ne peuvent pas le suivre et braque le CSE ; refusé par principe, il fait partir ceux qui l'attendaient. Un secteur volontaire, mesuré, dit ce qu'il faut garder.",
    };
  }
  if (methode!.score === 0) {
    return {
      titre: "Emmener l'équipe et le CSE avec des chiffres",
      texte:
        "Des indicateurs relevés avant le démarrage, un CSE consulté avant de décider, une correction au vu des chiffres, un bilan pour décider de la suite : c'est ce qui transforme un pari en apprentissage.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Juger un changement sur ses effets",
      texte:
        "Le recrutement, la fatigue, le conflit entre deux groupes : chacun est vrai, aucun ne suffit. Le problème principal était de ne pas savoir ce que les 12 heures feraient à cette équipe.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des relèves",
      texte:
        "Pour chaque relève, la durée de la transmission multipliée par le nombre de soignants qui arrivent, sur sept jours : 35 heures en 7 h 30, 17,5 en 12 heures. C'est le gain le plus sûr du changement, et le plus facile à chiffrer.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Les suites des décisions, semaine par semaine : le CSE, les départs, les signatures, l'erreur grave. */
function suites(chemin: readonly number[], graine: number, de: number, a: number): Message[] {
  const t = simuler(chemin, graine);
  const dans = (w: number | null) => w !== null && w >= de && w <= a;
  const lies: Message[] = [];
  const projet = chemin[D.projet] !== 3;
  const cse = chemin[D.cse];
  if (projet && cse === 0 && dans(4)) {
    lies.push({
      ...NORBERT,
      heure: "sem. 4",
      alerte: t.conflit === "avant",
      texte:
        t.conflit === "avant"
          ? "Le CSE rend un avis défavorable et vote une expertise sur le projet. Le démarrage attendra le rapport de l'expert, en décembre."
          : "Avis favorable du CSE, avec deux réserves : le volontariat garanti, et un bilan présenté en décembre.",
    });
  }
  if (projet && cse === 2 && dans(4)) {
    lies.push({
      ...NORBERT,
      heure: "sem. 4",
      texte:
        "Les organisations syndicales acceptent d'ouvrir une négociation sur les 12 heures. Démarrage envisagé en janvier.",
    });
  }
  if (projet && cse === 1 && dans(7)) {
    lies.push({
      ...NORBERT,
      heure: "sem. 7",
      alerte: t.conflit === "apres",
      texte:
        t.conflit === "apres"
          ? "Saisi après coup, le CSE vote une expertise et alerte l'inspection du travail. La direction suspend les 12 heures à partir de lundi."
          : "Le CSE prend acte du démarrage, regrette de ne pas avoir été consulté avant, et demandera un bilan.",
    });
  }
  if (t.conflitExtension && dans(10)) {
    lies.push({
      ...NORBERT,
      heure: "sem. 10",
      alerte: true,
      texte:
        "Le CSE vote une expertise sur l'extension des 12 heures aux deux autres unités, décidée sans le consulter. La direction suspend tout en semaine 11.",
    });
  }
  if (t.departOpposee !== null && dans(t.departOpposee - PREAVIS)) {
    lies.push({
      de: "Anthéa Galmiche",
      role: "Infirmière",
      heure: `sem. ${t.departOpposee - PREAVIS}`,
      alerte: true,
      texte:
        "Irène, je démissionne. Je ne peux pas faire des journées de 12 heures avec trois enfants et une crèche qui ferme à 18 h 30. Je pars dans un mois, dans un centre de dialyse aux horaires de journée.",
    });
  }
  if (t.mutation !== null && dans(t.mutation - PREAVIS)) {
    lies.push({
      ...TERENCE,
      heure: `sem. ${t.mutation - PREAVIS}`,
      texte: `Nuria Chaudrier a demandé sa mutation à l'EHPAD de Dijon-Montchapet, en postes de 7 h 30. Elle quitte l'unité en semaine ${t.mutation}.`,
    });
  }
  if (t.departVolontaire !== null && dans(t.departVolontaire - PREAVIS)) {
    lies.push({
      de: "Nabou Cissokho",
      role: "Infirmière",
      heure: `sem. ${t.departVolontaire - PREAVIS}`,
      alerte: true,
      texte:
        "J'ai accepté le poste en 12 heures au CHU. Je vous remercie pour tout, mais je pars dans un mois.",
    });
  }
  for (const w of t.signatures) {
    if (dans(w)) {
      lies.push({
        ...TERENCE,
        heure: `sem. ${w}`,
        texte: `Un candidat a signé pour l'un de vos postes vacants. Il arrive en semaine ${w + PREAVIS}, après son préavis.`,
      });
    }
  }
  if (t.eig && dans(10)) {
    const douze = t.semaines[10]!.douze > 0;
    lies.push({
      de: "Aude Lantenois",
      role: "Responsable qualité et gestion des risques",
      heure: "sem. 10",
      alerte: true,
      texte: `Un événement indésirable grave mardi soir${douze ? ", en fin de poste de 12 heures" : ""} : une erreur de dose d'anticoagulant, repérée par le médecin de garde. La patiente a été transférée au CHU par précaution et va bien. Déclaration faite à l'ARS ; l'analyse des causes se fera avec l'équipe la semaine prochaine.`,
    });
  }
  return lies;
}

export const EPISODE_DOUZE_HEURES: Episode<Trimestre> = {
  code: "postes-de-douze-heures",
  numero: 87,
  domaine: "Réorganiser les temps de travail",
  titre: "Passer en douze heures",
  resume:
    "Une unité de soins dont une moitié de l'équipe veut des postes de 12 heures et l'autre n'en veut pas. Juger un changement d'horaires sur ses effets mesurés, et le conduire avec l'équipe et le CSE.",
  persona:
    "Vous êtes Irène Ferrandin, cadre de santé de l'unité d'orthopédie de la clinique du Val Solvanne, établissement de soins médicaux et de réadaptation de l'Association Solvanne, à Dijon. Votre unité : 40 lits, vingt-six soignants de jour (infirmiers et aides-soignants) et neuf de nuit. Le trimestre va de septembre à novembre.",
  mandat: [
    { fort: "40 lits", texte: "de réadaptation, soignés 24 heures sur 24" },
    { fort: kE(BUDGET), texte: "de budget de remplacement et d'intérim pour le trimestre" },
    {
      fort: nombre(EI_HABITUEL, 1),
      texte: "événements indésirables pour 1 000 journées : le niveau habituel, à ne pas dépasser",
    },
    { fort: `${VACANCES_DEPART} postes`, texte: "vacants, tenus en intérim" },
  ],
  jugement:
    "La direction juge le trimestre en euros : l'écart au budget de remplacement et d'intérim, moins le surcoût des événements indésirables, plus les heures de relève économisées, moins les coûts du projet ; et la même chose projetée sur le trimestre suivant, avec l'organisation que vous proposez pour janvier et les postes qu'elle aura fait pourvoir.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre unité",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le planning d'octobre attend : les missions d'intérim se réservent en urgence, plus cher.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Soralis Intérim Santé",
        role: "Agence de Dijon",
        alerte: true,
        texte: `Faute de planning d'octobre arrêté, vos missions ont été réservées en urgence : ${euros(perdu)} de majoration.`,
      };
    },
  },
  prevision: {
    libelle:
      "les heures de chevauchement économisées chaque semaine si toute l'unité passe en 12 heures",
    unite: "h",
    placeholder: "20",
    min: 0,
    max: 100,
    step: 0.25,
    reel: () => ECONOMIE_HEURES,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "ei",
      nom: "Événements indésirables",
      format: pourMille,
      sensBon: -1,
      aide: () => `pour 1 000 journées ; habituel : ${pourMille(EI_HABITUEL)}`,
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `au départ : ${taux(ABSENCE_BASE, 0)}`,
    },
    {
      cle: "vacants",
      nom: "Postes vacants",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "tenus en intérim",
    },
    {
      cle: "chevauchement",
      nom: "Heures de relève",
      format: heures,
      sensBon: -1,
      aide: () => "payées en double, par semaine",
    },
    {
      cle: "depenses",
      nom: "Remplacements et intérim",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.depenses ?? 0) / BUDGET),
              enRetard: (l.depenses ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    const corrige = l.corrige === 1;
    return {
      douze: l.douze ?? 0,
      refus: decisions[D.projet] === 3,
      indicateurs: l.indicateurs === 1,
      excesPct: `${nombre(Math.round((l.exces ?? 0) * 100), 0)} %`,
      absenteisme: taux(l.absenteisme ?? 0),
      conflit: l.conflit === 1,
      clinique: decisions[D.projet] === 0 && (l.douze ?? 0) > 0,
      trameLongue: (decisions[D.trame] ?? 0) === 0 && !corrige,
      pauseProtegee: decisions[D.trame] === 1 || corrige,
      aTourne: l.aTourne === 1,
      corrige,
      ei: pourMille(l.ei ?? 0),
      vacants: nombre(l.vacants ?? 0, 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ecart = -semaines.reduce((x, w) => x + w.ecart, 0);
    return [
      [`Événements indésirables, sem. ${a}`, `${pourMille(t.semaines[a]!.ei)} ‰ j.`],
      [`Absentéisme, sem. ${a}`, taux(t.semaines[a]!.absenteisme)],
      ["Écart au budget de la période", ecartAuBudget(ecart)],
    ];
  },
  courbe: {
    titre: "Événements indésirables pour 1 000 journées, semaine par semaine",
    cle: "ei",
    cible: EI_HABITUEL,
    libelleCible: `niveau habituel : ${pourMille(EI_HABITUEL)}`,
    graduations: [0, 3, 6, 9, 12],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${pourMille(s.ei!)} événements pour 1 000 journées · absences ${taux(s.absenteisme!)}`,
      `${nombre(s.vacants!, 0)} postes vacants · ${heures(s.chevauchement!)} de relève`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.janvier && choix === 1) {
      // Le cadre de neurologie répond selon le hasard du trimestre, quel que soit le reste.
      const accepte = hasard(graine).uUniteB < PROBA_UNITE_B;
      return [{ ...HUGOLIN, texte: accepte ? REPONSES.uniteBAccepte : REPONSES.uniteBRefuse }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const imprevus = hasard(graine)
      .imprevus.filter((i) => i.semaine >= de && i.semaine <= a)
      .map(({ imprevu, semaine }) => ({
        de: imprevu.de,
        role: imprevu.role,
        heure: `sem. ${semaine}`,
        texte: imprevu.texte,
      }));
    return { lies: suites(chemin, graine, de, a), imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, trimestre suivant compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de remplacement et d'intérim, surcoût des événements indésirables, heures de relève économisées et coûts du projet compris, sur le trimestre et projeté sur le suivant, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const departs = [t.departOpposee, t.departVolontaire, t.mutation].filter(
        (w) => w !== null && w <= 13,
      ).length;
      return [
        {
          nom: "Événements indésirables",
          valeur: `${pourMille(t.eiPourMille)} ‰ j.`,
          aide: `pour 1 000 journées, en moyenne ; habituel ${pourMille(EI_HABITUEL)}`,
          tenu: t.eiPourMille <= EI_HABITUEL + 0.05 && !t.eig,
        },
        {
          nom: "Absentéisme",
          valeur: taux(t.absenteismeMoyen),
          aide: `en moyenne ; au départ ${taux(ABSENCE_BASE, 0)}`,
          tenu: t.absenteismeMoyen <= ABSENCE_BASE + 0.005,
        },
        {
          nom: "Postes vacants",
          valeur: `${t.vacantsFin} sur ${VACANCES_DEPART}`,
          aide: `en fin de trimestre ; ${t.recrues} candidat${t.recrues > 1 ? "s" : ""} signé${t.recrues > 1 ? "s" : ""}`,
          tenu: t.vacantsFin < VACANCES_DEPART,
        },
        {
          nom: "Dialogue social",
          valeur: t.conflit || t.conflitExtension ? "Expertise votée" : "Sans conflit",
          aide: departs
            ? `${departs} départ${departs > 1 ? "s" : ""} dans l'équipe`
            : "personne n'est parti",
          tenu: !t.conflit && !t.conflitExtension && departs === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const sensibilite =
        t.sensibilite < 0.85
          ? "peu sensible"
          : t.sensibilite > 1.25
            ? "très sensible"
            : "moyennement sensible";
      const equipe = [
        t.departOpposee !== null && t.departOpposee <= 13 ? "Anthéa Galmiche a démissionné" : null,
        t.mutation !== null && t.mutation <= 13 ? "Nuria Chaudrier a demandé sa mutation" : null,
        t.departVolontaire !== null && t.departVolontaire <= 13
          ? "Nabou Cissokho est partie au CHU"
          : null,
        t.recrues
          ? `${t.recrues} candidat${t.recrues > 1 ? "s ont" : " a"} signé`
          : "aucun candidat n'a signé",
      ]
        .filter(Boolean)
        .join(", ");
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La fatigue de fin de poste",
          texte: `Votre équipe était ${sensibilite} à la fatigue des postes longs : la trame retenue en semaine 2 donnait, ou aurait donné, ${nombre(Math.round(t.excesMesure * 100), 0)} % d'erreurs en plus après la dixième heure.`,
        },
        ...(t.conflit || t.conflitExtension || t.conflitJanvier
          ? [
              {
                titre: "Le CSE",
                texte: t.conflitJanvier
                  ? "a voté une expertise sur la généralisation de janvier."
                  : "a voté une expertise, et le projet a été suspendu.",
              },
            ]
          : []),
        ...(t.eig
          ? [
              {
                titre: "Semaine 10, un événement indésirable grave",
                texte:
                  "Une erreur de dose, repérée à temps ; déclarée à l'ARS et analysée avec l'équipe.",
              },
            ]
          : []),
        { titre: "L'équipe", texte: `${equipe}.` },
      ];
    },
  },
  comportements,
  axe,
};
