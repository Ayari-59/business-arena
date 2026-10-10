/**
 * ÉPISODE 103 — LA LIGNE QUI S'ARRÊTE QUAND IL MANQUE QUELQU'UN, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Erwann montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 *
 * Le trimestre se juge en euros à la semaine 13 : ce que les heures perdues,
 * les heures majorées, les mesures et les lots bloqués ont coûté, et la valeur
 * de la polyvalence acquise pour le printemps. C'est la seule façon honnête de
 * mettre en regard un binôme qui coûte en janvier et un conducteur qui couvrira
 * les absences d'avril à juin.
 */
import {
  D,
  EXPERTS,
  HEURES_PERDUES_ATTENDUES,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  PERTE_PAR_JOUR,
  SEMAINES,
  TAUX_SERVICE_EXIGE,
  evenements,
  hasard,
  interimTrouve,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/polyvalence-des-operateurs";
import {
  ANNAIG,
  DIAGNOSTICS,
  ETAPES,
  GURVAN,
  URSULINE,
  SIDOINE,
  MAIXENT,
  CASIMIR,
  ARTHAUD,
  REFERENCES,
  REFLEXES,
  REPONSES,
  STAGIAIRES,
  ZAINAB,
} from "@/config/episodes/polyvalence-des-operateurs";
import type { Constat, Episode, Lecture, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);
/** La cadence des heures perdues au rythme des absences de l'an dernier. */
const PAR_SEMAINE = HEURES_PERDUES_ATTENDUES / SEMAINES;
/** Un stagiaire tient seul un poste entier à partir de là. */
const PRET = 0.7;

/** Ce que les décisions révèlent, dans l'ordre où un chef d'atelier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la matrice de polyvalence et le relevé des absences de la ligne 5",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    dependance:
      "Votre diagnostic de la semaine 1 était juste : la ligne 5 dépendait de trois personnes, et un savoir-faire de cette sorte se transmet en semaines, à côté de ceux qui l'ont.",
    absences:
      "En semaine 1, vous avez vu les absences : un vrai déclencheur, mais pas la cause. Les experts ne manquaient pas plus que les autres ; c'est qu'ils étaient trois, et personne derrière eux.",
    effectif:
      "En semaine 1, vous avez retenu un manque de conducteurs expérimentés ; l'atelier en comptait vingt-deux, dont deux déjà au niveau 3 sur la ligne 5, qui ne demandaient qu'à apprendre.",
    machine:
      "En semaine 1, vous avez retenu la machine ; son rendement était dans la moyenne des lignes. Ce qui manquait, c'étaient des gens pour la régler.",
  };
  const justes = ["dependance", "absences"];
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
    score: d === "dependance" ? 1 : d === "absences" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la dépendance par des heures supplémentaires, un intérimaire « qui connaît la machine » ou un recrutement pour plus tard : vous avez formé ceux qui étaient déjà là."
        : `Vous avez répondu ${n} fois par le réflexe du métier : des heures supplémentaires pour les experts, un intérimaire « qui connaît la machine », ou un recrutement pour plus tard. Ces réponses couvrent une absence ; elles laissent la dépendance entière${
            t.kilianPart ? ", et Sidoine a fini par partir" : ""
          }.`,
  };

  const calibrage = constatCalibrage(
    p,
    HEURES_PERDUES_ATTENDUES,
    "de production perdues sur la ligne 5 en un trimestre d'hiver, faute de conducteur qualifié",
    "heures",
    { juste: 6, proche: 20 },
    (e) => `${nombre(e)} heure${e >= 2 ? "s" : ""}`,
  );

  const lances = p.chemin[D.plan] === O.plan.binomes;
  const prets = t.mFinal.filter((m, k) => m >= 1 && !t.abandons.includes(k)).length;
  let score: number;
  let texte: string;
  if (!lances) {
    score = 0;
    texte = `Vous n'avez lancé aucun binôme : la ligne 5 finit le trimestre comme elle l'a commencé, réglable par ${t.kilianPart ? "deux personnes" : "trois personnes"}, et Yvonnick part en juin.`;
  } else if (prets < 2) {
    score = 0.6;
    texte = `Vous avez lancé deux binômes pendant le creux de janvier, mais ${
      prets === 0 ? "aucun stagiaire n'est" : "un seul stagiaire est"
    } devenu autonome avant la fin du trimestre${
      t.abandons.length ? " : un stagiaire a quitté son binôme faute de reconnaissance" : ""
    }.`;
  } else {
    score = 1;
    const depuis = [...new Set(t.autonomie.map((w) => (w ?? 0) + 1))];
    texte = `Vous avez lancé deux binômes pendant le creux de janvier : Arthaud et Zainab règlent la ligne 5 seuls depuis ${
      depuis.length === 1 ? `la semaine ${depuis[0]}` : `les semaines ${depuis.join(" et ")}`
    }. Le printemps commence avec ${nombre(EXPERTS + prets - (t.kilianPart ? 1 : 0), 0)} conducteurs capables de la régler.`;
  }
  const transmission: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, transmission];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  transmission,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Repérer qui tient quoi",
      texte:
        "Rejouez l'épisode en faisant d'abord la matrice de polyvalence avec les chefs d'équipe, et le relevé des absences : trois experts pour trois postes, deux conducteurs déjà au niveau 3, et 117 heures perdues par hiver.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Transmettre plutôt qu'acheter des heures",
      texte:
        "Des heures supplémentaires ou un intérimaire couvrent l'absence de cette semaine et laissent la dépendance entière ; la fatigue revient en absences, en défauts de scellage, en départ. Formez ceux qui sont déjà là.",
    };
  }
  if (transmission!.score === 0) {
    return {
      titre: "Former pendant le creux",
      texte:
        "Un binôme coûte peu en janvier, quand la ligne a du creux, et cher en mars. Lancé en janvier, avec des standards écrits, il donne un conducteur autonome dès mars.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher la dépendance derrière les absences",
      texte:
        "Les absences ne sont pas le problème : tout le monde en a. Le problème, c'est un savoir-faire tenu par trois personnes. Comptez qui sait faire quoi avant de compter qui manque.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Compter les heures que coûte une absence",
      texte:
        "Trois postes de 40 heures sur treize semaines, 12 % d'absence, et cinq huitièmes de chaque heure découverte perdus : faites le calcul jusqu'au bout avant de chiffrer un plan.",
    };
  }
  if (transmission!.score < 1) {
    return {
      titre: "Reconnaître ceux qui apprennent",
      texte:
        "Écrire les réglages accélère la formation ; reconnaître la polyvalence dans la classification garde les stagiaires en binôme. Sans l'un ou l'autre, la relève arrive trop tard, ou pas.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Ce que la semaine 6 dit des binômes : le chemin fait, et qui tient un poste seul. */
function binomes(l: Lecture) {
  const m1 = l.m1 ?? 0;
  const m2 = l.m2 ?? 0;
  return {
    chemin1: taux(Math.min(1, m1), 0),
    chemin2: taux(Math.min(1, m2), 0),
    pret1: m1 >= PRET,
    pret2: m2 >= PRET,
  };
}

export const EPISODE_POLYVALENCE: Episode<Trimestre> = {
  code: "polyvalence-des-operateurs",
  numero: 103,
  domaine: "Développer la polyvalence d'une équipe de production",
  titre: "La ligne qui s'arrête quand il manque quelqu'un",
  resume:
    "Trois conducteurs sur vingt-deux savent régler la ligne 5, et l'un part en juin. Repérer, transmettre en binôme pendant le creux, écrire les réglages, reconnaître la polyvalence.",
  persona:
    "Vous êtes Erwann Tromeur, chef de l'atelier de conditionnement de la Laiterie de Kerbrélan, à Loudéac : six lignes de conditionnement en pots, vingt-deux conducteurs de ligne et leurs équipes, en 2×8 et en 3×8. Vous rendez compte à Gurvan Kerebel, responsable de production de l'usine.",
  mandat: [
    { fort: `${EXPERTS} conducteurs`, texte: "sur vingt-deux savent régler la ligne 5" },
    { fort: "30 juin", texte: "Yvonnick Gouriou, l'un des trois, part à la retraite" },
    {
      fort: taux(TAUX_SERVICE_EXIGE),
      texte: "de taux de service exigé par les enseignes, avec pénalités",
    },
    {
      fort: "Janvier à mars",
      texte: "le creux d'après les fêtes, puis les promotions de printemps",
    },
  ],
  jugement:
    "Gurvan Kerebel juge le trimestre en euros à la semaine 13 : la valeur de la polyvalence acquise pour le printemps, moins ce qu'ont coûté les heures perdues, les heures majorées, les mesures et les lots bloqués.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre atelier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le planning de la semaine se boucle sans vous : on ouvre la ligne le samedi pour rattraper.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...GURVAN,
        alerte: true,
        texte: `Faute de plan, j'ai fait ouvrir la ligne 5 samedi avec Sidoine pour rattraper les nuits perdues : ${euros(perdu)} d'heures majorées.`,
      };
    },
  },
  prevision: {
    libelle:
      "les heures de production que la ligne 5 perd en un trimestre d'hiver faute de conducteur qualifié, au rythme des absences de l'an dernier",
    unite: "heures",
    placeholder: "100",
    min: 0,
    max: 600,
    step: 1,
    reel: () => HEURES_PERDUES_ATTENDUES,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "perduesCumul",
      nom: "Heures perdues faute de conducteur qualifié",
      format: heures,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `depuis janvier ; au rythme de l'an dernier : ${heures(PAR_SEMAINE * semaine)}`
          : "sur la ligne 5",
    },
    {
      cle: "service",
      nom: "Taux de service de la ligne 5",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "la semaine dernière"} ; exigé : ${taux(TAUX_SERVICE_EXIGE)}`,
    },
    {
      cle: "heuresSup",
      nom: "Heures rattrapées en heures supplémentaires",
      format: heures,
      sensBon: -1,
      aide: () => "heures de ligne, par les experts, depuis janvier",
    },
    {
      cle: "qualifies",
      nom: "Conducteurs capables de régler la 5",
      format: (v) => nombre(v),
      sensBon: 1,
      aide: () => "les experts, et la part autonome des stagiaires",
      jauge: (l) =>
        (l.m1 ?? 0) > 0 || (l.m2 ?? 0) > 0
          ? {
              part: Math.min(1, l.progression ?? 0),
              enRetard: (l.semaine ?? 0) >= 8 && (l.progression ?? 0) < 0.7,
            }
          : null,
    },
    {
      cle: "coutCumul",
      nom: "Coût du trimestre",
      format: kE,
      sensBon: -1,
      aide: () => "ruptures, heures majorées, mesures, lots bloqués",
    },
  ],
  contexte(l, decisions) {
    return {
      perdues: heures(l.perduesCumul ?? 0),
      service: taux(l.service ?? 0),
      heuresSup: heures(l.heuresSup ?? 0),
      qualifies: nombre(l.qualifies ?? EXPERTS),
      lots: nombre(l.lots ?? 0, 0),
      binomes: decisions[D.plan] === O.plan.binomes,
      parti2: (l.abandon2 ?? 0) > 0,
      ...binomes(l),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Heures perdues, sem. ${de} à ${a}`, heures(semaines.reduce((x, w) => x + w.perdues, 0))],
      [`Taux de service, sem. ${a}`, taux(t.semaines[a]!.service)],
      ["Coût de la période", kE(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Taux de service de la ligne 5, semaine par semaine",
    cle: "service",
    cible: TAUX_SERVICE_EXIGE,
    libelleCible: `exigé par les enseignes : ${taux(TAUX_SERVICE_EXIGE)}`,
    graduations: [0.4, 0.6, 0.8, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${heures(s.perdues!)} perdues faute de conducteur qualifié · ${heures(s.rupture!)} de rupture`,
      `${nombre(s.qualifies!)} conducteurs capables de régler la ligne`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.plan && choix === O.plan.interim) {
      // Seule la demande compte : l'agence répond selon le hasard du trimestre.
      return [
        {
          ...CASIMIR,
          alerte: !interimTrouve(graine),
          texte: interimTrouve(graine) ? REPONSES.interimTrouve : REPONSES.interimAbsent,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const lances = chemin[D.plan] === O.plan.binomes;
    if (arrive.interim) {
      lies.push({
        ...MAIXENT,
        heure: "sem. 4",
        texte:
          "L'intérimaire est arrivé. Il connaît le principe d'une thermoformeuse, pas la nôtre ni nos formats : on le fait commencer à côté de Sidoine.",
      });
    }
    for (const k of arrive.abandons) {
      lies.push({
        ...(k === 0 ? ARTHAUD : ZAINAB),
        heure: "sem. 6",
        alerte: true,
        texte: `Erwann, je retourne sur la ligne ${k === 0 ? "4" : "6"}. Plus de responsabilités pour le même salaire, et personne ne sait me dire ce que j'y gagne. Je suis désolé${k === 0 ? "" : "e"}.`,
      });
    }
    if (chemin[D.arret] === O.arret.binome && de <= 7 && a >= 7) {
      const t = simuler(chemin, graine);
      const tient = lances && t.abandons.length < 2;
      const qui = tient
        ? STAGIAIRES[t.abandons.includes(0) ? 1 : t.semaines[6]!.m1 >= t.semaines[6]!.m2 ? 0 : 1]!
        : null;
      lies.push({
        ...MAIXENT,
        heure: "sem. 7",
        alerte: !tient,
        texte: tient
          ? `${qui} tient l'après-midi d'Ursuline cette semaine, la fiche de réglage au poste et Yvonnick au téléphone.`
          : "Personne d'autre que les trois n'a jamais réglé la 5 : l'après-midi tourne à mi-cadence, et s'arrête quand un changement de format tombe.",
      });
    }
    for (const { k, w } of arrive.autonomies) {
      lies.push({
        ...MAIXENT,
        heure: `sem. ${w + 1}`,
        texte: `${STAGIAIRES[k]} a fait seul un changement de format complet cette semaine, contrôle d'étanchéité conforme du premier coup. ${k === 0 ? "Yvonnick" : "Ursuline"} a regardé sans rien dire.`,
      });
    }
    if (arrive.retourGwenola) {
      lies.push({
        ...URSULINE,
        heure: "sem. 10",
        texte: "Je reprends lundi, le genou tient. Merci à ceux qui ont tenu l'après-midi.",
      });
    }
    for (const w of arrive.lots) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Lot bloqué sur la ligne 5 : défaut de scellage détecté au contrôle d'étanchéité. Aucun pot n'est sorti de l'usine ; le lot est détruit et refait.",
      });
    }
    if (arrive.retrait !== null) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${arrive.retrait}`,
        alerte: true,
        texte:
          "Un lot au scellage défectueux, fait de nuit, est parti chez Celtis avant que le contrôle ne le détecte. Retrait organisé avec la centrale d'achat, la DDPP est informée. Aucun signalement de consommateur à ce jour.",
      });
    }
    if (arrive.kilianPart) {
      lies.push({
        ...SIDOINE,
        heure: "sem. 11",
        alerte: true,
        texte:
          "Erwann, j'ai accepté un poste de jour dans une autre usine de la zone. Je pose mes congés : vendredi est mon dernier jour. Trois ans de nuits et de samedis, je n'en peux plus.",
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    const semaine = (m: Message) => Number((m.heure ?? "").replace(/\D/g, ""));
    lies.sort((x, y) => semaine(x) - semaine(y));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      `${kE(t.objectif)} : ${heures(t.perdues)} perdues faute de conducteur qualifié, ${nombre(t.qualifiesFinal)} conducteurs capables de régler la ligne 5`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur estimée à la semaine 13 : la polyvalence acquise pour le printemps, moins ce qu'ont coûté les heures perdues, les heures majorées, les mesures et les lots bloqués, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Taux de service",
          valeur: taux(t.serviceMoyen),
          aide: "de la ligne 5, en moyenne ; objectif du trimestre 95 %",
          tenu: t.serviceMoyen >= 0.95,
        },
        {
          nom: "Relève de la ligne 5",
          valeur: nombre(t.qualifiesFinal),
          aide: "conducteurs capables de la régler en fin de trimestre ; objectif 5",
          tenu: t.qualifiesFinal >= 4.95,
        },
        {
          nom: "Lots bloqués",
          valeur: nombre(t.lots.length, 0),
          aide: t.retrait
            ? "dont un lot sorti et rappelé"
            : "défauts de scellage ; objectif : aucun",
          tenu: t.lots.length === 0,
        },
        {
          nom: "Experts",
          valeur: `${t.kilianPart ? EXPERTS - 1 : EXPERTS} sur ${EXPERTS}`,
          aide: t.kilianPart ? "Sidoine est parti" : "encore là en fin de trimestre",
          tenu: !t.kilianPart,
        },
      ];
    },
    hasard(t, graine) {
      const lots = t.lots.length;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        ...(t.interimDemande
          ? [
              {
                titre: "L'agence d'intérim",
                texte: t.interim
                  ? "a trouvé un conducteur de thermoformeuse, arrivé en semaine 4 : il ne connaissait ni la machine ni les formats."
                  : "n'a trouvé personne de disponible qui connaisse les thermoformeuses.",
              },
            ]
          : []),
        ...(t.recrutementLance
          ? [
              {
                titre: "Le cabinet de recrutement",
                texte: t.recrue
                  ? "a trouvé un conducteur de thermoformeuse, qui arrivera en juin."
                  : "n'a trouvé personne avant juin.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: [
            t.kilianPart
              ? "Sidoine est parti à la fin de la semaine 11"
              : "les trois experts sont restés",
            t.abandons.length
              ? `${t.abandons.map((k) => STAGIAIRES[k]).join(" et ")} ${pluriel(t.abandons.length, "a quitté son binôme", "ont quitté leur binôme")} en semaine 5`
              : null,
            lots
              ? `${lots} ${pluriel(lots, "lot bloqué", "lots bloqués")} pour un défaut de scellage${t.retrait ? ", dont un sorti de l'usine et rappelé" : ""}`
              : "aucun lot bloqué",
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
