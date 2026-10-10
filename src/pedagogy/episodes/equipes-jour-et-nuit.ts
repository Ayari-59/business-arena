/**
 * ÉPISODE 90 — L'ÉQUIPE DE JOUR ET L'ÉQUIPE DE NUIT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du service d'Hélier montre, ce que
 * la courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  CHUTES_BASE,
  CHUTES_PAR_LEVER,
  CHUTES_PAR_OUBLI_DE_QUALITE,
  D,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  LEVERS_DEPART,
  LEVERS_REVISION,
  LEVE_TOT,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLACES,
  QUALITE_DEPART,
  SEMAINES,
  VEILLEUSES,
  departsDeRotation,
  evenements,
  familleSaisitLARS,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/equipes-jour-et-nuit";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/equipes-jour-et-nuit";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Les chutes de l'automne, sur treize semaines : le point de départ du trimestre. */
export const CHUTES_AUTOMNE = Math.round(
  SEMAINES *
    (CHUTES_BASE +
      CHUTES_PAR_OUBLI_DE_QUALITE * (1 - QUALITE_DEPART) +
      CHUTES_PAR_LEVER * (LEVERS_DEPART - LEVE_TOT)),
);
/** L'objectif de chutes du trimestre : un quart de moins qu'à l'automne. */
export const OBJECTIF_CHUTES = 24;

/** Un écart à l'enveloppe : positif, le trimestre a coûté moins que prévu. */
const ecartALEnveloppe = (v: number) =>
  v >= 0 ? `${kE(v)} sous l'enveloppe` : `${kE(-v)} au-dessus de l'enveloppe`;

const ADALGISE = { de: "Adalgise Ansquer", role: "Directrice de l'EHPAD" } as const;
const PENDA = { de: "Penda Diabaté", role: "Aide-soignante de nuit" } as const;
const NACERA = { de: "Nacéra Bouadjar", role: "Aide-soignante de nuit" } as const;
const ROKHAYA = { de: "Rokhaya Brugnot", role: "Aide-soignante de jour, premier étage" } as const;
const MADELEINE = {
  de: "Madeleine Sirugue",
  role: "Directrice qualité et gestion des risques, siège",
} as const;
const OKSANA = { de: "Oksana Hrytsenko", role: "Ressources humaines, siège" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un cadre de santé les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les plans de soins et le coût d'une veilleuse remplacée par l'intérim",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    frontiere:
      "Votre diagnostic de la semaine 1 était juste : la charge du matin avait glissé sur la nuit par une liste que personne n'avait décidée, et des transmissions de trois minutes entretenaient le reproche.",
    matin:
      "En semaine 1, vous avez vu un matin sous-dimensionné : c'était vrai, cinq aides-soignants tiennent quarante toilettes et il en restait quarante-deux. Mais la réponse n'était pas seulement des bras : l'après-midi n'avait aucune toilette planifiée, et la liste des 5 h 30 avait reporté la charge sur la nuit sans que personne la décide.",
    nuit: "En semaine 1, vous avez retenu une nuit qui ne fait pas sa part ; elle levait dix-huit résidents avant 6 h 45, dont treize sur une liste écrite par le jour et que personne n'avait validée.",
    personnes:
      "En semaine 1, vous avez retenu un conflit de personnes ; les deux équipes ne se croisaient que trois minutes par jour, et se disputaient une frontière de tâches que personne n'avait tracée.",
  };
  const justes = ["frontiere", "matin"];
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
    score: d === "frontiere" ? 1 : d === "matin" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n === 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais tranché pour une équipe contre l'autre, ni imposé une rotation à tous : vous avez fait décider la frontière par ceux qui la vivent."
        : `Sous la pression, vous avez ${n} fois sur ${ETAPES.length} décisions tranché pour l'équipe de jour ou imposé une rotation à tous : la note de service, l'avertissement à la veilleuse qui avait suivi la liste, la rotation d'avril. Trancher ne réglait pas la frontière des tâches, et c'est la nuit, introuvable à recruter, qui en payait le prix.${
            t.departsNuit > 0
              ? ` ${t.departsNuit} veilleuse${t.departsNuit > 1 ? "s sont parties" : " est partie"} pendant le trimestre.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.posteInterim,
    "pour une veilleuse à temps plein remplacée par l'intérim pendant un trimestre",
    "k€",
    { juste: 0.5, proche: 2 },
    (e) => `${nombre(e)} k€`,
  );

  // Les temps communs : se réunir, se transmettre, répartir ensemble, l'inscrire au roulement.
  const reunion = p.chemin[D.conflit] === 2;
  const chevauchement = p.chemin[D.transmissions] === 0;
  const repartition = p.chemin[D.repartition] === 0;
  const roulement = p.chemin[D.printemps] === 0;
  const bons = [reunion, chevauchement, repartition, roulement].filter(Boolean).length;
  const communs: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      reunion
        ? "Vous avez d'abord assis les deux équipes à la même table, les faits sous les yeux."
        : "Les deux équipes ne se sont jamais réunies pour regarder ensemble ce qui se passait entre 5 h et 8 h."
    } ${
      chevauchement
        ? "Le quart d'heure de 6 h 45 est devenu un vrai temps de transmissions ciblées."
        : "Les transmissions sont restées sans temps protégé pour se parler."
    } ${
      repartition && roulement
        ? "La répartition des soins a été décidée avec les deux équipes, puis inscrite au roulement pour durer."
        : repartition
          ? "La répartition des soins a été décidée avec les deux équipes ; rien ne l'a inscrite au roulement."
          : roulement
            ? "Des temps communs sont inscrits au roulement, mais la répartition des soins n'a pas été décidée ensemble."
            : "Ni la répartition des soins ni des temps communs n'ont été décidés avec les deux équipes."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, communs];
}

export function axe([information, diagnostic, reflexe, calibrage, communs]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder qui fait quoi entre 5 h et 8 h",
      texte:
        "Rejouez l'épisode en relisant d'abord les plans de soins et l'heure de lever de chaque résident : dix-huit levés avant 6 h 45, cinq seulement à leur demande, et une liste écrite par le jour que personne n'avait validée. Chiffrez aussi ce que coûte une veilleuse qui part : c'est ce qui rend chaque décision lourde.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas trancher pour une équipe contre l'autre",
      texte:
        "Entre deux équipes qui ne se croisent jamais, donner raison à l'une fait partir l'autre, et la rotation imposée fait partir des deux côtés. Le conflit vient des tâches à la frontière des postes : il se règle par des temps communs, des transmissions ciblées et une répartition décidée ensemble.",
    };
  }
  if (communs!.score === 0) {
    return {
      titre: "Donner aux deux équipes des temps pour se parler",
      texte:
        "Une réunion jour-nuit, un chevauchement protégé, une révision des plans de soins faite ensemble coûtent des heures tout de suite et paient trois semaines plus tard. Sans eux, chaque équipe ne connaît de l'autre que ce qu'elle lui laisse à faire.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher la cause à la frontière des postes",
      texte:
        "Avant de juger une équipe ou ses meneuses, regardez les tâches qui passent d'un poste à l'autre : qui les a attribuées, à quelle heure elles tombent, et ce que l'autre équipe en sait.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul d'une veilleuse en intérim",
      texte:
        "Sept nuits de dix heures par quinzaine, soit 455 heures sur treize semaines, à 48,50 € hors taxes plus une TVA que l'association ne récupère pas : environ 26,5 k€ le trimestre, deux fois le coût d'une veilleuse salariée.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_JOUR_NUIT: Episode<Trimestre> = {
  code: "equipes-jour-et-nuit",
  numero: 90,
  domaine: "Faire travailler deux équipes ensemble",
  titre: "L'équipe de jour et l'équipe de nuit",
  resume:
    "Dans un EHPAD, l'équipe de nuit et l'équipe de jour se renvoient les toilettes non faites et les résidents levés trop tôt. Régler la frontière des tâches avec les deux équipes plutôt que trancher pour l'une.",
  persona: `Vous êtes Hélier Thévenaud, cadre de santé de l'EHPAD de Dijon-Grésilles, l'un des six EHPAD de l'Association Solvanne : ${PLACES} places sur deux étages et une unité protégée de 14 places. Vous encadrez une équipe de jour de vingt-six soignants (aides-soignants, AES, agents de service) et une équipe de nuit de ${VEILLEUSES} veilleuses, trois chaque nuit. Les deux équipes ne se croisent qu'à 6 h 45 et à 21 h. Le trimestre va de janvier à mars, en pleine saison des épidémies.`,
  mandat: [
    {
      fort: kE(ENVELOPPE),
      texte:
        "d'enveloppe pour le trimestre : heures, remplacements de nuit, départs et événements indésirables",
    },
    { fort: "aucun résident", texte: "levé avant 6 h 45 sans l'avoir demandé" },
    { fort: `${OBJECTIF_CHUTES} chutes`, texte: `au plus, contre ${CHUTES_AUTOMNE} à l'automne` },
    { fort: "l'équipe de nuit", texte: "au complet à la fin de l'hiver" },
  ],
  jugement:
    "La direction juge le trimestre sur son coût, comparé à l'enveloppe : les heures payées, les nuits remplacées en intérim ou en rappel, les départs, et les événements indésirables (chutes, réclamations, défauts de transmission).",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre service",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la nuit continue de lever dix-huit résidents avant 6 h 45.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ADALGISE,
        alerte: true,
        texte: `Pendant ce temps, des levers à 5 h 30 de plus : une chute et des familles au téléphone, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût d'un poste de veilleuse à temps plein tenu en intérim pendant tout le trimestre",
    unite: "k€",
    placeholder: "20",
    min: 0,
    max: 100,
    step: 0.1,
    reel: (t) => t.posteInterim,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "coutCumule",
      nom: "Coût du trimestre",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `enveloppe à date : ${kE(l.enveloppeADate ?? 0)} sur ${kE(ENVELOPPE)}`
          : `${kE(ENVELOPPE)} d'enveloppe pour le trimestre`,
      jauge: (l) =>
        l.enveloppeADate
          ? {
              part: Math.min(1, Math.max(0, (l.coutCumule ?? 0) / ENVELOPPE)),
              enRetard: (l.coutCumule ?? 0) > l.enveloppeADate,
            }
          : null,
    },
    {
      cle: "levers",
      nom: "Résidents levés avant 6 h 45",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `dont ${LEVE_TOT} lève-tôt à leur demande`,
    },
    {
      cle: "chutes",
      nom: "Chutes",
      format: (v) => nombre(v),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine} ; automne : ${nombre(CHUTES_AUTOMNE / SEMAINES)} par semaine`
          : "par semaine, à l'automne",
    },
    {
      cle: "minutes",
      nom: "Transmissions de 6 h 45",
      format: (v) => `${nombre(v, 0)} min`,
      sensBon: 1,
      aide: () => "durée moyenne, de la nuit au jour",
    },
    {
      cle: "remplacements",
      nom: "Nuits remplacées",
      format: (v) => nombre(v),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en intérim ou en rappel sur repos, en semaine ${semaine}`
          : "en intérim ou en rappel sur repos, par semaine en décembre",
    },
  ],
  contexte(l, decisions) {
    return {
      levers: nombre(l.levers ?? 0, 0),
      minutes: nombre(l.minutes ?? 0, 0),
      chutes: nombre(l.chutes ?? 0),
      remplacements: nombre(l.remplacements ?? 0),
      cout: kE(l.coutCumule ?? 0),
      enveloppe: kE(l.enveloppeADate ?? 0),
      leversListe: (l.levers ?? 0) >= 16,
      noteDeService: decisions[D.conflit] === 0,
      reunion: decisions[D.conflit] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    const chutes = semaines.reduce((x, w) => x + w.chutes, 0);
    return [
      ["Coût de la période", kE(cout)],
      [`Levers précoces, sem. ${a}`, `${nombre(t.semaines[a]!.levers, 0)} résidents`],
      ["Chutes de la période", nombre(chutes, 0)],
    ];
  },
  courbe: {
    titre: "Résidents levés avant 6 h 45, semaine par semaine",
    cle: "levers",
    cible: LEVERS_REVISION,
    libelleCible: `repère : les ${LEVE_TOT} lève-tôt, et un de plus`,
    graduations: [0, 5, 10, 15, 20],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.levers!, 0)} levés avant 6 h 45 · ${nombre(s.reportees!, 0)} toilettes du matin reportées par jour`,
      `${nombre(s.chutes!)} chutes · transmissions de ${nombre(s.minutes!, 0)} minutes`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.chute && choix === 2) {
      // La famille accepte le courrier, ou porte sa réclamation à l'ARS, selon le hasard du trimestre.
      return [
        {
          ...MADELEINE,
          texte: familleSaisitLARS(choix, graine) ? REPONSES.saisine : REPONSES.apaise,
        },
      ];
    }
    if (etape === D.printemps && choix === 1) {
      // Qui part quand la rotation est annoncée : tiré au hasard, de chaque côté.
      const r = departsDeRotation(graine);
      if (r.nuit + r.jour === 0) return [{ ...OKSANA, texte: REPONSES.rotationAucun }];
      const parts = [
        r.nuit ? `${r.nuit} veilleuse${r.nuit > 1 ? "s" : ""}` : "",
        r.jour
          ? `${r.jour} aide${r.jour > 1 ? "s" : ""}-soignante${r.jour > 1 ? "s" : ""} de jour`
          : "",
      ].filter(Boolean);
      return [
        {
          ...OKSANA,
          texte: `Le roulement d'avril est annoncé : ${parts.join(" et ")} m'${
            r.nuit + r.jour > 1 ? "ont" : "a"
          } remis leur démission. Les veilleuses ont choisi la nuit pour leurs enfants ; les autres ne veulent pas de nuits qu'elles n'ont pas choisies.`,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const lies: Message[] = [];
    if (arrive.mutations && chemin[D.mutations] !== 0) {
      const parties = [
        t.smarandaPart ? "Smaranda Vornicu" : "",
        t.naceraPart ? "Nacéra Bouadjar" : "",
      ].filter(Boolean);
      lies.push(
        parties.length
          ? {
              ...OKSANA,
              heure: "sem. 5",
              alerte: true,
              texte: `${parties.join(" et ")} ${
                parties.length > 1 ? "ont" : "a"
              } démissionné : un poste de veilleuse chez Orchidia Résidences, à partir de la semaine 7. Les nuits vacantes passent à Soralis et en rappels sur repos.`,
            }
          : {
              ...NACERA,
              heure: "sem. 5",
              texte:
                chemin[D.mutations] === 1
                  ? "Smaranda et moi, on reste. Le groupe de travail, c'est la première fois qu'on nous demande comment faire."
                  : "On reste, Smaranda et moi. Pour l'instant.",
            },
      );
    }
    if (arrive.repartition) {
      lies.push(
        t.repartitionTient
          ? {
              ...ROKHAYA,
              heure: "sem. 9",
              texte:
                "Première semaine de la nouvelle répartition : six résidents levés avant 6 h 45, les douches de l'après-midi faites, et plus aucune toilette reportée. Je n'y croyais pas.",
            }
          : {
              ...PENDA,
              heure: "sem. 9",
              alerte: true,
              texte:
                "L'après-midi n'a pas fait les douches, et ce matin le jour nous a redonné la liste. On y avait cru, Hélier.",
            },
      );
    }
    if (arrive.saisine && chemin[D.chute] !== 2) {
      lies.push({ ...MADELEINE, heure: "sem. 9", alerte: true, texte: REPONSES.saisine });
    }
    if (arrive.troisiemePart) {
      lies.push({
        ...OKSANA,
        heure: "sem. 9",
        alerte: true,
        texte:
          "Penda Diabaté a démissionné après vingt-deux ans de nuits chez nous : elle prend un poste de veilleuse chez Orchidia Résidences et part en semaine 11.",
      });
    }
    if (arrive.jourPart) {
      lies.push({
        ...OKSANA,
        heure: "sem. 9",
        texte:
          "Rokhaya Brugnot a demandé une rupture conventionnelle : « Je ne veux plus passer mes matinées à rattraper ce qui n'a pas été fait. »",
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
    titre: (t) => `Coût du trimestre : ${kE(t.cout)}, ${ecartALEnveloppe(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart à l'enveloppe du trimestre, heures, nuits remplacées, départs et événements indésirables compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût du trimestre",
          valeur: kE(t.cout),
          aide: `enveloppe ${kE(ENVELOPPE)}`,
          tenu: t.cout <= ENVELOPPE,
        },
        {
          nom: "Levers avant 6 h 45",
          valeur: `${nombre(t.leversFinaux, 0)} résidents`,
          aide: `en fin de trimestre ; repère : les ${LEVE_TOT} lève-tôt et un de plus`,
          tenu: t.leversFinaux <= LEVERS_REVISION,
        },
        {
          nom: "Chutes",
          valeur: nombre(t.chutes, 0),
          aide: `sur le trimestre ; objectif ${OBJECTIF_CHUTES}, automne ${CHUTES_AUTOMNE}`,
          tenu: t.chutes <= OBJECTIF_CHUTES,
        },
        {
          nom: "L'équipe de nuit",
          valeur: `${VEILLEUSES - t.departsNuit} sur ${VEILLEUSES}`,
          aide:
            t.departsNuit === 0
              ? "aucune veilleuse partie"
              : `${t.departsNuit} veilleuse${t.departsNuit > 1 ? "s" : ""} partie${t.departsNuit > 1 ? "s" : ""} ou sur le départ`,
          tenu: t.departsNuit === 0,
        },
      ];
    },
    hasard(t, graine) {
      const deux = [t.smarandaPart, t.naceraPart].filter(Boolean).length;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les deux veilleuses",
          texte:
            deux === 0
              ? "Smaranda Vornicu et Nacéra Bouadjar sont restées dans l'équipe de nuit."
              : deux === 2
                ? "Smaranda Vornicu et Nacéra Bouadjar ont quitté l'équipe de nuit en semaine 7."
                : `${t.smarandaPart ? "Smaranda Vornicu" : "Nacéra Bouadjar"} a quitté l'équipe de nuit en semaine 7 ; l'autre est restée.`,
        },
        ...(t.repartitionTient === null
          ? []
          : [
              {
                titre: "La nouvelle répartition",
                texte: `${
                  t.repartitionTient ? "Elle a tenu" : "Elle n'a pas tenu"
                } ; au vu de la façon dont elle avait été préparée, elle avait ${taux(t.chanceRepartition, 0)} de chances de tenir.`,
              },
            ]),
        {
          titre: "La famille de Mme Sarkissian",
          texte: t.saisine
            ? "Son fils a porté sa réclamation à l'ARS."
            : "Son fils n'a pas porté sa réclamation à l'ARS.",
        },
        {
          titre: "Les équipes",
          texte: `${
            t.troisiemePart
              ? "Penda Diabaté a démissionné en semaine 9"
              : "Penda Diabaté est restée"
          } ; ${
            t.jourPart
              ? "Rokhaya Brugnot a demandé à partir"
              : "aucune aide-soignante de jour n'est partie"
          }${
            t.rotation.nuit + t.rotation.jour
              ? `, et l'annonce de la rotation a fait démissionner ${t.rotation.nuit + t.rotation.jour} soignant${t.rotation.nuit + t.rotation.jour > 1 ? "s" : ""}`
              : ""
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
