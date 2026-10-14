/**
 * ÉPISODE 81 — LA FAMILLE QUI ÉCRIT À L'ARS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de l'EHPAD de Montchapet montre à
 * Edmée, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  ABSENTEISME_BASE,
  APPELS,
  D,
  ETP_SOIGNANTS,
  HEURE_AS,
  HEURE_AS_DIMANCHE,
  HEURES_RENFORT,
  JOURS_SANS_PERTE,
  LISTE_NORMALE,
  NEUTRE,
  PERTE_PAR_JOUR,
  RENFORT_TRIMESTRE,
  SEMAINE_DE_RELANCE,
  evenements,
  hasard,
  prestataireAccepte,
  semaineDeSanction,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/famille-qui-ecrit";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/famille-qui-ecrit";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const minutes = (v: number) => `${nombre(v, 0)} min`;
const pieces = (v: number) => `${nombre(v, 0)} pièce${Math.round(v) >= 2 ? "s" : ""}`;
/** « Panne de Carnéo » devient « panne de Carnéo » : seule l'initiale change. */
const minuscule = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);
/** Un coût : l'objectif en est l'opposé. */
const cout = (objectif: number) => kE(-objectif);

const FAMILLE = { de: "Ginette Durupt", role: "Fille de Mme Vauchez" } as const;
const ARS = { de: "ARS Bourgogne-Franche-Comté", role: "Délégation départementale" } as const;
const RH = { de: "Ressources humaines", role: "Siège, Association Solvanne" } as const;

/** Ce que les décisions révèlent, dans l'ordre où une directrice les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le journal des appels malades et les plannings du week-end",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    organisation:
      "Votre diagnostic de la semaine 1 était juste : la plupart des plaintes étaient fondées et venaient de l'organisation — six aides-soignantes de 7 h à 9 h le week-end, un linge que personne ne marquait — et les toilettes tardives de la semaine étaient un choix de la résidente, que sa fille ignorait.",
    matins:
      "En semaine 1, vous avez vu le manque de bras du week-end matin : la première cause, mais pas la seule. Le linge se perdait pour une autre raison, et une partie de la plainte tenait à un malentendu sur les levers.",
    famille:
      "En semaine 1, vous avez conclu que la famille exagérait, sur la foi d'un taux de réclamations dans la moyenne. Le journal des appels malades disait le contraire : dix-neuf minutes à la sonnette le week-end matin, contre six en semaine.",
    soignante:
      "En semaine 1, vous avez cherché une soignante en faute. Les plannings montraient une aide-soignante seule pour seize résidents le dimanche matin : une question d'organisation, pas de personne.",
  };
  const justes = ["organisation", "matins"];
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
    score: d === "organisation" ? 1 : d === "matins" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la réclamation par une défense de principe ni par une sanction : vous avez cherché les faits, puis corrigé."
        : `Sous la réclamation, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de défendre l'établissement par principe ou de sanctionner une soignante. Une réponse défensive fait venir l'inspection, une famille mise en cause cherche des alliés, et une sanction sans faits vide l'équipe du week-end.${
            t.inspection
              ? " L'ARS est venue inspecter en semaine 7."
              : t.depart
                ? " Une aide-soignante a démissionné."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    RENFORT_TRIMESTRE / 1000,
    "pour le coût d'un renfort de 7 h à 9 h le week-end sur le trimestre",
    "k€",
    { juste: 0.1, proche: 0.3 },
    (e) => `${nombre(e, 2)} k€`,
  );

  // Rencontrer la famille, associer les familles, garder l'équipe.
  const recue = p.chemin[D.famille] === 0;
  const associees = p.chemin[D.cvs] === 0;
  const equipeTenue = semaineDeSanction(p.chemin) === null;
  const bons = [recue, associees, equipeTenue].filter(Boolean).length;
  const familles: Constat = {
    score: bons === 3 ? 1 : bons === 2 ? 0.6 : 0,
    texte: `${
      recue
        ? "Vous avez reçu Mme Durupt avec les faits : ce qui était fondé, ce qui ne l'était pas, ce qui allait changer."
        : "Vous n'avez pas reçu Mme Durupt à temps avec des faits : elle est restée seule avec ce qu'elle voyait le dimanche."
    } ${
      associees
        ? "Vous avez associé les familles au conseil de la vie sociale, chiffres à l'appui."
        : "Les familles n'ont pas été associées au suivi du plan d'action."
    } ${
      equipeTenue
        ? "Vous avez soutenu l'équipe sans la défendre en bloc ni désigner de coupable."
        : `Une aide-soignante a été sanctionnée sans faits établis${t.arrets ? ", et l'équipe du week-end s'est arrêtée" : ""}.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, familles];
}

export function axe([information, diagnostic, reflexe, calibrage, familles]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Établir les faits avant de répondre",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le journal des appels malades et les plannings du week-end : dix-neuf minutes à la sonnette le dimanche matin contre six en semaine, six aides-soignantes au lieu de neuf. Une réclamation est une information.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Corriger l'organisation, ni défendre ni sanctionner",
      texte:
        "Répondre que tout est conforme fait venir l'inspection ; sanctionner une soignante sans faits vide l'équipe. Les faits montrent presque toujours une cause d'organisation : c'est elle qu'on corrige, en soutenant l'équipe.",
    };
  }
  if (familles!.score === 0) {
    return {
      titre: "Rencontrer la famille, puis associer les familles",
      texte:
        "Une famille reçue avec des faits s'apaise le plus souvent ; laissée sans réponse, elle trouve des alliés et la presse. Le conseil de la vie sociale est le lieu où le plan d'action se montre et se suit.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer le fondé du malentendu",
      texte:
        "Une réclamation mêle souvent plusieurs causes : un manque de bras à une heure précise, un processus mal suivi, et un malentendu qu'une explication lève. Les traiter comme une seule cause fait manquer les autres.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du renfort",
      texte: `${HEURES_RENFORT} heures le samedi à ${euros(HEURE_AS)} et ${HEURES_RENFORT} heures le dimanche à ${euros(HEURE_AS_DIMANCHE)}, sur treize week-ends : ${euros(RENFORT_TRIMESTRE)}. Le renfort coûte peu ; ce qu'il évite coûte beaucoup plus.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_FAMILLES: Episode<Trimestre> = {
  code: "famille-qui-ecrit",
  numero: 81,
  domaine: "Répondre à une réclamation",
  titre: "La famille qui écrit à l'ARS",
  resume:
    "Une fille de résidente écrit à l'ARS et au journal ; l'équipe se sent attaquée. Établir les faits, recevoir la famille, corriger l'organisation : ni défense de principe, ni sanction rapide.",
  persona:
    "Vous êtes Edmée Faucompré, directrice de l'EHPAD de Dijon-Montchapet, 96 places, à l'Association Solvanne. Avec vous : Khadidja Haddouche, infirmière coordinatrice, le Dr Ignace Andrianjafy, médecin coordonnateur, Colombe Guenebaud, gouvernante, et une équipe de 42 équivalents temps plein d'aides-soignants et d'accompagnants. D'avril à juin : Mme Ginette Durupt, fille d'une résidente, a écrit à l'ARS et au journal local, et l'ARS attend vos explications sous quinze jours.",
  mandat: [
    { fort: "15 jours", texte: "pour répondre à l'ARS" },
    { fort: `${APPELS.objectif} min`, texte: "à la sonnette le week-end matin, au plus" },
    { fort: `${LISTE_NORMALE} demandes`, texte: "d'admission en attente, comme avant l'article" },
    { fort: "aucun départ", texte: "de soignant à cause de l'affaire" },
  ],
  jugement:
    "La directrice générale juge le trimestre sur ce que la réclamation et ses suites coûtent à l'EHPAD — renforts, linge, remplacements, départs, inspection — et sur l'effet attendu sur les admissions du trimestre suivant.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre EHPAD",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la famille et le journal relancent, et d'autres familles appellent l'accueil.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Ursule Mauvernay",
        role: "Directrice générale",
        alerte: true,
        texte: `Pendant ce temps, le journal a relancé, et l'accueil a reçu les appels inquiets de plusieurs familles : ${euros(perdu)} de temps de cadre et de réclamations à traiter.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût d'un renfort d'une aide-soignante de 7 h à 9 h le samedi et le dimanche pendant un trimestre, en k€",
    unite: "k€",
    placeholder: "0",
    min: 0,
    max: 50,
    step: 0.01,
    reel: (t) => t.renfortTrimestre,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "appels",
      nom: "Sonnette, week-end matin",
      format: minutes,
      sensBon: -1,
      aide: () =>
        `délai moyen de 7 h à 9 h ; en semaine : ${APPELS.semaine} min ; objectif ${APPELS.objectif} min`,
    },
    {
      cle: "linge",
      nom: "Linge perdu",
      format: pieces,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `déclaré en semaine ${semaine}` : "par semaine ; avant janvier : une ou deux",
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme des soignants",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `ordinaire : ${taux(ABSENTEISME_BASE, 0)} ; ${ETP_SOIGNANTS} ETP`,
    },
    {
      cle: "liste",
      nom: "Demandes d'admission en attente",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => `avant l'article : ${LISTE_NORMALE}`,
      jauge: (l) =>
        l.liste == null
          ? null
          : { part: Math.min(1, l.liste / LISTE_NORMALE), enRetard: l.liste < LISTE_NORMALE - 2 },
    },
    {
      cle: "couts",
      nom: "Coûts engagés",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `depuis avril ; ${nombre(l.reclamations ?? 0, 0)} réclamations reçues`
          : "renforts, linge, remplacements, inspection",
    },
  ],
  contexte(l, decisions) {
    return {
      appels: minutes(l.appels ?? 0),
      linge: nombre(l.linge ?? 0, 0),
      absenteisme: taux(l.absenteisme ?? 0),
      liste: nombre(l.liste ?? 0, 0),
      couts: kE(l.couts ?? 0),
      reclamations: nombre(l.reclamations ?? 0, 0),
      faits: decisions[D.equipe] === 0,
      defense: decisions[D.equipe] === 1,
      sanction: semaineDeSanction(decisions) !== null,
      apaiseeConnue: l.apaisee != null,
      apaisee: l.apaisee === 1,
      recue: decisions[D.famille] === 0,
      autres: l.autres === 1,
      inspection: l.inspection === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const depense = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`Sonnette du week-end, sem. ${a}`, minutes(t.semaines[a]!.appels)],
      [`Demandes en attente, sem. ${a}`, nombre(t.semaines[a]!.liste, 0)],
      ["Coût de la période", kE(depense)],
    ];
  },
  courbe: {
    titre: "Sonnette du week-end matin, semaine par semaine",
    cle: "appels",
    cible: APPELS.objectif,
    libelleCible: `objectif : ${APPELS.objectif} minutes au plus`,
    graduations: [5, 10, 15, 20, 25],
    format: (v) => `${nombre(v, 0)} min`,
    details: (s) => [
      `sonnette ${minutes(s.appels!)} · linge perdu ${pieces(s.linge!)}`,
      `${nombre(s.reclamations!, 1)} réclamations · ${nombre(s.liste!, 0)} demandes en attente`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.linge && choix === 0) {
      // Seul le choix d'exiger compte : Ondelys répond selon le hasard du trimestre.
      return [
        {
          de: "Wojciech Kaczmarek",
          role: "Blanchisserie Ondelys",
          texte: prestataireAccepte(graine)
            ? REPONSES.prestataireAccepte
            : REPONSES.prestataireConteste,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const s = t.sanction;
    const lies: Message[] = [];
    if (arrive.rencontre && chemin.length > D.famille) {
      lies.push({
        ...FAMILLE,
        heure: "sem. 2",
        alerte: !t.apaisee,
        texte:
          chemin[D.famille] === 0
            ? t.apaisee
              ? REPONSES.apaisee
              : REPONSES.fachee
            : t.apaisee
              ? REPONSES.apaiseeADistance
              : REPONSES.facheeADistance,
      });
    }
    if (arrive.arrets && s !== null) {
      lies.push({ ...RH, heure: `sem. ${s + 1}`, alerte: true, texte: REPONSES.arrets });
    }
    if (arrive.depart && s !== null) {
      lies.push({ ...RH, heure: `sem. ${s + 2}`, alerte: true, texte: REPONSES.depart });
    }
    if (arrive.autres) {
      lies.push({
        de: "Madeleine Sirugue",
        role: "Directrice qualité et gestion des risques, siège",
        heure: "sem. 4",
        alerte: true,
        texte: REPONSES.autres,
      });
    }
    if (arrive.decisionArs && chemin.length > D.ars) {
      lies.push({
        ...ARS,
        heure: "sem. 5",
        alerte: t.inspection,
        texte: t.inspection ? REPONSES.inspection : REPONSES.cloture,
      });
    }
    if (arrive.visite) lies.push({ ...ARS, heure: "sem. 7", texte: REPONSES.visite });
    if (arrive.injonction) {
      lies.push({ ...ARS, heure: "sem. 9", alerte: true, texte: REPONSES.injonction });
    }
    if (arrive.renfortLache && t.finDuRenfort !== null) {
      lies.push({
        de: "Khadidja Haddouche",
        role: "Infirmière coordinatrice",
        heure: `sem. ${t.finDuRenfort}`,
        alerte: true,
        texte: t.finDuRenfort === 5 ? REPONSES.renfortAbsent : REPONSES.renfortLache,
      });
    }
    if (arrive.relance) {
      lies.push({
        ...ARS,
        heure: `sem. ${SEMAINE_DE_RELANCE}`,
        alerte: true,
        texte: REPONSES.relance,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    const semaine = (m: Message) => Number(m.heure?.replace(/\D/g, "") ?? 0);
    lies.sort((x, y) => semaine(x) - semaine(y));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `La réclamation a coûté ${cout(t.objectif)}, admissions comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Ce que la réclamation et ses suites ont coûté à l'EHPAD — renforts, linge, remplacements, départs, inspection, temps de cadre — et l'effet attendu sur les admissions du trimestre suivant, compté en négatif, sous les aléas que vous avez joués : plus la barre est proche de zéro, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "L'ARS",
          valeur: t.inspection
            ? "inspection en semaine 7"
            : t.relance
              ? `visite en semaine ${SEMAINE_DE_RELANCE}`
              : "réclamation close",
          aide:
            t.inspection || t.relance
              ? "et ses suites : injonction, audit"
              : "sur pièces, sans visite",
          tenu: !t.inspection && !t.relance,
        },
        {
          nom: "Sonnette, week-end matin",
          valeur: minutes(t.appelsFin),
          aide: `en moyenne de la semaine 10 à la semaine 13 ; objectif ${APPELS.objectif} min`,
          tenu: t.appelsFin <= APPELS.objectif,
        },
        {
          nom: "Demandes d'admission",
          valeur: `${nombre(t.listeFinale, 0)} en attente`,
          aide: `fin juin ; avant l'article : ${LISTE_NORMALE} ; effet sur le trimestre suivant : ${kE(t.perteAdmissions)}`,
          tenu: t.listeFinale >= LISTE_NORMALE - 2,
        },
        {
          nom: "Équipe",
          valeur: t.depart ? "un départ" : t.arrets ? "deux arrêts" : "aucun départ",
          aide: `absentéisme moyen ${taux(t.absenteismeMoyen)}`,
          tenu: !t.depart && !t.arrets,
        },
      ];
    },
    hasard(t, graine) {
      const accepte = prestataireAccepte(graine);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${minuscule(imprevu.titre)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Mme Durupt",
          texte: t.apaisee
            ? "s'est apaisée après votre réponse de la semaine 2."
            : t.autres
              ? "ne s'est pas apaisée ; trois autres familles ont écrit à l'ARS, et le journal a publié un deuxième article."
              : "ne s'est pas apaisée, mais d'autres familles ne s'en sont pas mêlées.",
        },
        {
          titre: "L'ARS",
          texte: t.inspection
            ? "a inspecté l'établissement en semaine 7, puis enjoint de renforcer le week-end et de conduire un audit."
            : t.relance
              ? `a clos la réclamation, puis est revenue en semaine ${SEMAINE_DE_RELANCE} quand le renfort promis a lâché.`
              : "a clos la réclamation sur pièces.",
        },
        {
          titre: "Le blanchisseur",
          texte: t.planLinge
            ? accepte
              ? "a accepté le plan de correction et les pénalités."
              : "a contesté les pénalités ; le marquage seul a réduit les pertes."
            : accepte
              ? "aurait accepté un plan de correction et les pénalités, si on les lui avait demandés."
              : "aurait contesté les pénalités, si on les lui avait demandées.",
        },
        {
          titre: "L'équipe",
          texte:
            [
              t.sanction !== null
                ? `une aide-soignante a été sanctionnée en semaine ${t.sanction}`
                : "aucune soignante n'a été sanctionnée",
              t.arrets ? "deux collègues se sont arrêtées" : null,
              t.depart ? "une aide-soignante a démissionné" : null,
              t.finDuRenfort !== null
                ? t.finDuRenfort === 5
                  ? "personne ne s'est portée volontaire pour le renfort"
                  : "les volontaires du renfort se sont retirées en juin"
                : null,
            ]
              .filter(Boolean)
              .join(", ")
              .replace(/^./, (c) => c.toUpperCase()) + ".",
        },
      ];
    },
  },
  comportements,
  axe,
};
