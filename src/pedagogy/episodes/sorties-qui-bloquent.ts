/**
 * ÉPISODE 80 — LES SORTIES QUI BLOQUENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi de la clinique de Médéric montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  CONVENTIONS,
  D,
  DMS_ANCIENNE,
  DMS_DEPART,
  EPRD,
  JOURNEES_BLOQUEES_RYTHME,
  JOURS_SANS_PERTE,
  LITS,
  NEUTRE,
  PERTE_PAR_JOUR,
  PRESCRIPTEURS,
  VALEUR_ADRESSEUR,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/sorties-qui-bloquent";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/sorties-qui-bloquent";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 1)} j`;
const patients = (v: number) => nombre(v, 0);
/** Un écart à l'EPRD : positif, la clinique a fait mieux que son état prévisionnel. */
const ecartAEPRD = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus de l'EPRD` : `${kE(-v)} sous l'EPRD`;

const EDMEE = {
  de: "Edmée Faucompré",
  role: "Directrice de l'EHPAD de Dijon-Montchapet",
} as const;
const MARIN = { de: "Marin Peyrebrune", role: "Directeur régional, Orchidia Résidences" } as const;
const SABRI = {
  de: "Sabri Mabanza",
  role: "Cadre de la cellule de gestion des lits, CHU",
} as const;
const AUDE = {
  de: "Aude Lantenois",
  role: "Responsable qualité et gestion des risques",
} as const;
const SOLAL = { de: "Solal Benhamza", role: "Cadre supérieur de santé, admissions" } as const;

/** Les services perdus, dits en clair. */
const services = (ids: readonly string[]) =>
  ids.map((id) => PRESCRIPTEURS.find((p) => p.id === id)!.nom).join(", ");

/** Ce que les décisions révèlent, dans l'ordre où un directeur de SMR les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la revue des dossiers et les admissions",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    aval: "Votre diagnostic de la semaine 1 était juste : les soins n'avaient pas changé, les patients attendaient une sortie que personne n'avait préparée.",
    places:
      "En semaine 1, vous avez vu le manque de places dans l'aval : une vraie contrainte, mais pas toute l'attente. Près de la moitié tenait aux dossiers, qu'on pouvait lancer dès l'entrée.",
    lits: "En semaine 1, vous avez retenu le manque de lits ; un lit sur six était occupé par un patient médicalement sortant, et des lits de plus se remplissent des mêmes séjours bloqués.",
    medecins:
      "En semaine 1, vous avez retenu la durée des soins ; elle n'avait pas bougé depuis deux ans, à 28 jours. C'est l'attente de l'aval qui avait grandi.",
  };
  const justes = ["aval", "places"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "aval" ? 1 : d === "places" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché des lits en plus ni fait sortir un patient avant que son aval soit prêt : vous avez libéré les lits par l'aval."
        : `Lits pleins, vous avez choisi ${n} fois sur ${ETAPES.length} décisions d'ajouter des lits ou de faire sortir plus vite sans que l'aval soit prêt.${
            t.rehospitalisations >= 1
              ? ` ${nombre(Math.round(t.rehospitalisations), 0)} patients sont revenus par les urgences du CHU.`
              : p.chemin[D.strategie] === 0
                ? " Les lits de l'aile Est se sont remplis, et le nombre de patients bloqués a monté avec eux."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.journeesAuRythme,
    "de journées bloquées sur le trimestre au rythme de la semaine 1",
    "journées",
    { juste: 100, proche: 300 },
    (e) => `${nombre(e, 0)} journées`,
  );

  // Agir sur l'aval : préparer à l'entrée, reprendre les dossiers, conventionner, aménager, programmer.
  const gestes = [
    p.chemin[D.strategie] === 1,
    p.chemin[D.stock] === 0 || p.chemin[D.stock] === 2,
    p.chemin[D.conventions] !== 3,
    p.chemin[D.domicile] === 1,
    p.chemin[D.fetes] === 1,
  ];
  const bons = gestes.filter(Boolean).length;
  const aval: Constat = {
    score: bons === 5 ? 1 : bons >= 3 ? 0.6 : 0,
    texte: `${
      gestes[0]
        ? "Vous avez fait préparer chaque sortie dès l'entrée, là où se jouait la moitié de l'attente."
        : "Vous n'avez pas fait préparer les sorties dès l'entrée : les dossiers partaient toujours le jour où le patient était déclaré sortant."
    } ${
      gestes[2]
        ? "Vous avez cherché des places chez l'aval."
        : "Vous n'avez passé aucune convention avec l'aval."
    } ${
      gestes[3]
        ? "Vous avez fait rentrer chez eux les patients dans un domicile adapté, sans attendre la fin des travaux."
        : p.chemin[D.domicile] === 0
          ? "Vous avez laissé rentrer des patients dans un domicile qui n'était pas prêt."
          : "Vous avez gardé des patients jusqu'à la fin de leurs travaux."
    } Au total, ${nombre(t.journeesBloquees, 0)} journées bloquées, contre ${nombre(JOURNEES_BLOQUEES_RYTHME, 0)} au rythme de la semaine 1.`,
  };

  return [information, diagnostic, reflexe, calibrage, aval];
}

export function axe([information, diagnostic, reflexe, calibrage, aval]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder qui occupe les lits",
      texte:
        "Rejouez l'épisode en faisant d'abord la revue des dossiers : un patient sur six était médicalement sortant. La durée des soins n'avait pas bougé ; c'est l'attente de l'aval qui allongeait les séjours.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Libérer les lits par l'aval",
      texte:
        "Des lits de plus se remplissent des mêmes séjours bloqués, et une sortie avant que l'aide ou le domicile soient prêts fait revenir le patient. Une durée de séjour se raccourcit en préparant la sortie, pas en ouvrant des lits ni en pressant les médecins.",
    };
  }
  if (aval!.score === 0) {
    return {
      titre: "Préparer la sortie avant qu'elle arrive",
      texte:
        "Le dossier d'EHPAD, l'APA, l'aménagement du domicile se lancent dès l'entrée, avec une date de sortie prévisionnelle ; les places se négocient avec l'aval. Une place réservée ne sert qu'à un dossier prêt.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où le séjour s'allonge",
      texte:
        "Avant de juger la capacité ou les médecins, séparez la durée des soins de l'attente de la sortie. Ici, la première n'avait pas changé ; la seconde avait doublé.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte:
        "21 patients médicalement sortants, chaque jour, pendant les 91 jours du trimestre : 1 911 journées où un lit manque au court séjour. C'est l'ordre de grandeur qu'une réouverture de lits ne fait pas disparaître.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_PARCOURS: Episode<Trimestre> = {
  code: "sorties-qui-bloquent",
  numero: 80,
  domaine: "Fluidifier le parcours du patient",
  titre: "Les sorties qui bloquent",
  resume:
    "Une clinique de soins de réadaptation pleine, une durée de séjour qui s'allonge, un CHU qui attend, un conseil qui veut des lits. Chercher où le séjour s'allonge vraiment.",
  persona:
    "Vous êtes Médéric Amegavi, directeur de la clinique du Val Solvanne, l'établissement de soins médicaux et de réadaptation de l'Association Solvanne, à Dijon : 120 lits et 20 places d'hôpital de jour, des patients adressés par le centre hospitalier universitaire et les cliniques de l'agglomération après une fracture, un accident vasculaire, une hospitalisation qui a fait perdre l'autonomie. Le trimestre va d'octobre à décembre.",
  mandat: [
    { fort: kE(EPRD), texte: "de résultat d'activité sur le trimestre, inscrits à l'EPRD" },
    { fort: `${LITS} lits`, texte: "installés ; quinze autres autorisés, dans l'aile Est fermée" },
    { fort: "la durée de séjour", texte: "engagée dans le CPOM avec l'ARS" },
    { fort: "aucune sortie", texte: "qui mette un patient en danger" },
  ],
  jugement:
    "Votre directrice générale juge le trimestre sur le résultat d'activité de la clinique, recettes d'activité nettes moins le coût des mesures prises et des réhospitalisations, en écart à l'EPRD, moins la valeur des adressages perdus.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre clinique",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les lits restent bloqués sans que rien ne change.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...SOLAL,
        alerte: true,
        texte: `Pendant ce temps, les patients sortants sont restés dans leurs lits et le court séjour a placé ses patients ailleurs : ${euros(perdu)} de recettes d'activité perdues.`,
      };
    },
  },
  prevision: {
    libelle:
      "le nombre de journées bloquées (patients médicalement sortants qui attendent leur aval) sur le trimestre, au rythme d'aujourd'hui",
    unite: "journées",
    placeholder: "0",
    min: 0,
    max: 10000,
    step: 10,
    reel: (t) => t.journeesAuRythme,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "resultat",
      nom: "Résultat d'activité",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `EPRD à date : ${kE(l.eprdADate ?? 0)} sur ${kE(EPRD)}`
          : `${kE(EPRD)} à l'EPRD du trimestre`,
      jauge: (l) =>
        l.eprdADate
          ? {
              part: Math.min(1, Math.max(0, (l.resultat ?? 0) / EPRD)),
              enRetard: (l.resultat ?? 0) < l.eprdADate,
            }
          : null,
    },
    {
      cle: "bloques",
      nom: "Patients médicalement sortants",
      format: patients,
      sensBon: -1,
      aide: () => "qui attendent leur aval dans un lit",
    },
    {
      cle: "dms",
      nom: "Durée moyenne de séjour",
      format: jours,
      sensBon: -1,
      aide: () => `les soins, plus l'attente ; ${DMS_ANCIENNE} jours il y a deux ans`,
    },
    {
      cle: "delai",
      nom: "Délai de réponse au court séjour",
      format: jours,
      sensBon: -1,
      aide: () => "attente d'une place pour un patient adressé",
    },
    {
      cle: "admissions",
      nom: "Admissions",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) => (semaine ? `en semaine ${semaine}` : "par semaine"),
    },
  ],
  contexte(l, decisions) {
    const perdus = l.prescripteursPerdus ?? 0;
    return {
      resultat: kE(l.resultat ?? 0),
      eprdADate: kE(l.eprdADate ?? 0),
      bloques: patients(l.bloques ?? 0),
      dms: `${nombre(l.dms ?? DMS_DEPART, 0)} jours`,
      delai: `${nombre(l.delai ?? 0, 0)} jours`,
      admissions: nombre(l.admissions ?? 0, 0),
      rehosp: nombre(Math.round(l.rehospitalisations ?? 0), 0),
      perdus:
        perdus === 0
          ? "aucun service n'adresse encore ailleurs"
          : perdus === 1
            ? "un service a pris l'habitude d'adresser ailleurs"
            : `${perdus} services ont pris l'habitude d'adresser ailleurs`,
      prep: (decisions[D.strategie] ?? NEUTRE[D.strategie]) === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    const bloquees = semaines.reduce((x, w) => x + w.bloques * 7, 0);
    return [
      ["Résultat de la période", kE(contribution)],
      ["Journées bloquées", nombre(bloquees, 0)],
      [`Durée de séjour, sem. ${a}`, jours(t.semaines[a]!.dms)],
    ];
  },
  courbe: {
    titre: "Résultat d'activité, semaine par semaine",
    cle: "contribution",
    cible: EPRD / 13,
    libelleCible: `EPRD : ${kE(EPRD / 13)} par semaine`,
    graduations: [-40000, 0, 40000, 80000, 120000],
    format: kE,
    details: (s) => [
      `résultat ${kE(s.contribution!)} · ${nombre(s.admissions!, 0)} admissions`,
      `${patients(s.bloques!)} patients médicalement sortants · délai ${jours(s.delai!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    const h = hasard(graine);
    if (etape === D.conventions && choix === 0) {
      const signe = h.uInterne < CONVENTIONS.interne.accord;
      return [{ ...EDMEE, texte: signe ? REPONSES.interneAcceptee : REPONSES.interneRefusee }];
    }
    if (etape === D.conventions && choix === 1) {
      const signe = h.uExterne < CONVENTIONS.externe.accord;
      return [{ ...MARIN, texte: signe ? REPONSES.externeAcceptee : REPONSES.externeRefusee }];
    }
    if (etape === D.stock && choix === 2) {
      return [{ ...EDMEE, texte: REPONSES.temporaire(h.placesTemporaires) }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (chemin[D.strategie] === 0 && de <= 5 && a >= 5) {
      lies.push({
        ...SOLAL,
        heure: "sem. 5",
        texte:
          "L'aile Est rouvre : huit lits cette semaine, les sept autres la semaine prochaine. Une bonne part de l'équipe vient de Soralis Intérim Santé.",
      });
    }
    if (arrive.interne) {
      lies.push({
        ...EDMEE,
        heure: `sem. ${chemin[D.conventions] === 2 ? CONVENTIONS.imposee.debut : CONVENTIONS.interne.debut}`,
        texte:
          chemin[D.conventions] === 2
            ? "La convention est entrée en vigueur. Nous réservons les places demandées, comme le comité de direction l'a décidé."
            : "Premières places réservées pour la clinique dans nos EHPAD et au SSIAD.",
      });
    }
    if (arrive.externe) {
      lies.push({
        ...MARIN,
        heure: `sem. ${CONVENTIONS.externe.debut}`,
        texte: "Nos résidences accueillent leurs premiers patients de la clinique.",
      });
    }
    if (arrive.rehosp >= 1) {
      lies.push({
        ...AUDE,
        heure: `sem. ${a}`,
        alerte: true,
        texte: `${nombre(Math.round(arrive.rehosp), 0)} ${
          Math.round(arrive.rehosp) > 1 ? "patients sont revenus" : "patient est revenu"
        } par les urgences du CHU depuis le dernier point, dont une chute à domicile. Les déclarations d'événement indésirable sont faites.`,
      });
    }
    for (const perdu of arrive.perdus) {
      lies.push({
        ...SABRI,
        heure: `sem. ${perdu.semaine}`,
        alerte: true,
        texte: `Je vous préviens : ${services([perdu.id])} a pris l'habitude d'adresser ses patients à d'autres établissements d'abord. Vos délais ne leur conviennent plus.`,
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
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => ecartAEPRD(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Résultat d'activité de la clinique, moins la valeur des adressages perdus, en écart à l'EPRD, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Résultat d'activité",
          valeur: kE(t.resultat),
          aide: `EPRD ${kE(EPRD)}`,
          tenu: t.resultat >= EPRD,
        },
        {
          nom: "Journées bloquées",
          valeur: nombre(t.journeesBloquees, 0),
          aide: `${nombre(JOURNEES_BLOQUEES_RYTHME, 0)} au rythme de la semaine 1`,
          tenu: t.journeesBloquees <= 0.8 * JOURNEES_BLOQUEES_RYTHME,
        },
        {
          nom: "Réhospitalisations",
          valeur: nombre(Math.round(t.rehospitalisations), 0),
          aide: "patients revenus par les urgences du CHU",
          tenu: t.rehospitalisations < 0.5,
        },
        {
          nom: "Services prescripteurs",
          valeur: `${PRESCRIPTEURS.length - t.perdus.length} sur ${PRESCRIPTEURS.length}`,
          aide: t.perdus.length
            ? `adressent ailleurs : ${services(t.perdus.map((p) => p.id))} (${kE(t.valeurPerdue)})`
            : "tous adressent encore à la clinique",
          tenu: t.perdus.length === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'aval",
          texte: [
            h.uInterne < CONVENTIONS.interne.accord
              ? "les directeurs d'EHPAD de l'association auraient signé une convention"
              : "les directeurs d'EHPAD de l'association auraient refusé une convention",
            h.uExterne < CONVENTIONS.externe.accord
              ? "Orchidia Résidences l'aurait acceptée"
              : "Orchidia Résidences l'aurait refusée",
            `${h.placesTemporaires} ${h.placesTemporaires > 1 ? "places" : "place"} d'hébergement temporaire en octobre`,
          ]
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
        {
          titre: "Les services prescripteurs",
          texte: t.perdus.length
            ? `${t.perdus
                .map((p) => `${services([p.id])} a basculé en semaine ${p.semaine}`)
                .join(", ")
                .replace(/^./, (c) =>
                  c.toUpperCase(),
                )}, soit ${kE(t.perdus.length * VALEUR_ADRESSEUR)} de recettes perdues sur l'année qui vient.`
            : "Tous les services ont continué de vous adresser leurs patients.",
        },
      ];
    },
  },
  comportements,
  axe,
};
