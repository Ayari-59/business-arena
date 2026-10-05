/**
 * ÉPISODE 24 — LES COMPÉTENCES QUI MANQUENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Martine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans les épisodes 3 à 7 :
 * les suites qui dépendent d'un choix antérieur (la réponse de René, le
 * verdict du cabinet, les pénalités de l'agenceur) passent par
 * `evenements().lies`, et `lire` renvoie des clés non affichées (demande,
 * sous-traitance, présence de René) qui nourrissent les messages et les
 * sources.
 */
import {
  BUDGET,
  D,
  DEPART_JOAQUIM,
  DEPART_RENE,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEUIL_AUTONOME,
  evenements,
  hasard,
  recrueTrouvee,
  semaineRecrue,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/competences-qui-manquent";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/competences-qui-manquent";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const sur100 = (v: number) => `${nombre(v * 100, 0)} / 100`;
/** Un écart au budget de marge : positif, l'atelier a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où une responsable les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où était le savoir et combien de temps il faut pour l'apprendre",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    transmission:
      "Votre diagnostic de la semaine 1 était juste : le savoir de la machine tenait en deux têtes, et il fallait des semaines à côté d'elles pour le transmettre.",
    remplacement:
      "En semaine 1, vous avez vu qu'il allait manquer deux opérateurs : c'était vrai, mais ce qui partait, c'était un savoir, pas deux postes. Un remplaçant venu de dehors ne connaît pas vos pièces.",
    formation:
      "En semaine 1, vous avez retenu un manque de formation ; le fabricant lui-même prévenait que ses trois jours n'apprennent pas vos pièces, et qu'il faut des mois de pratique à côté de quelqu'un qui les connaît.",
    capacite:
      "En semaine 1, vous avez retenu un manque de capacité ; la machine pouvait faire plus. Ce qui allait manquer, c'étaient les gens capables de la piloter.",
  };
  const justes = ["transmission", "remplacement"];
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
    score: d === "transmission" ? 1 : d === "remplacement" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché la compétence dehors ni saupoudré la formation : vous l'avez fait passer de ceux qui l'avaient à ceux qui restaient."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions d'acheter la compétence dehors (recrutement, stage du fabricant, intérim) ou de la saupoudrer sur tout le monde. Ni un stage, ni une recrue, ni un intérimaire ne connaissaient vos pièces.${
            t.recrueArrivee === null && p.chemin[D.plan] === 0
              ? " Le cabinet n'a trouvé personne à temps."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[DEPART_RENE]!.service * 100,
    "de commandes sur mesure faites à l'atelier en semaine 9",
    "%",
    { juste: 8, proche: 20 },
    (e) => `${nombre(e, 0)} point${e >= 2 ? "s" : ""}`,
  );

  const gestes = [
    p.chemin[D.plan] === 1,
    p.chemin[D.savoir] === 0,
    p.chemin[D.rene] === 0,
    p.chemin[D.joaquim] === 0,
  ];
  const tot = gestes.filter(Boolean).length;
  const transmission: Constat = {
    score: tot >= 3 ? 1 : tot === 2 ? 0.6 : 0,
    texte: `${
      gestes[0]
        ? "Vous avez lancé la transmission en semaine 2, à côté de René et de Joaquim, sur les vraies pièces."
        : "Vous n'avez pas mis la relève à côté de René et de Joaquim tant qu'ils étaient là : le temps de transmettre est parti avec eux."
    } ${
      tot >= 3
        ? "Écrire leurs gestes, garder René deux jours par semaine, valider la relève avant le départ de Joaquim : vous avez fait durer la transmission jusqu'au bout."
        : "Une partie de ce qu'ils savaient n'a été ni écrite, ni validée avant leur départ."
    } En semaine 13, ${t.pilotesFinaux} pilote${t.pilotesFinaux >= 2 ? "s tenaient" : " tenait"} la machine seul${t.pilotesFinaux >= 2 ? "s" : ""}.`,
  };

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
      titre: "Chercher où est le savoir",
      texte:
        "Rejouez l'épisode en faisant d'abord la cartographie des compétences : programmer, régler et usiner les pièces complexes, deux personnes seulement le savaient. Et le fabricant disait combien de temps il faut pour l'apprendre.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Transmettre plutôt qu'acheter",
      texte:
        "Un stage générique, une recrue de dehors, un intérimaire ne connaissent pas vos pièces. Le savoir qui compte se transmet à côté de ceux qui l'ont, sur les vraies commandes, tant qu'ils sont là.",
    };
  }
  if (transmission!.score === 0) {
    return {
      titre: "Commencer avant les départs",
      texte:
        "Une compétence rare met des semaines à passer, et seulement en présence de celui qui la possède. Binômes, gestes écrits, cumul emploi-retraite, passation : chaque semaine gagnée avant un départ vaut plus que tout ce qu'on fait après.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder ce qui part, pas qui part",
      texte:
        "Un départ en retraite ne libère pas seulement un poste : il emporte des gestes, des réglages, des programmes. Cartographiez ce que chacun est seul à savoir avant de chercher qui le remplacera.",
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
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const RENE = { de: "René Vuillermoz", role: "Régleur-programmeur, machine numérique" } as const;
const CABINET = { de: "Clarisse Perret", role: "Cabinet de recrutement" } as const;
const RH = { de: "Edwige Quéméner", role: "Ressources humaines" } as const;

export const EPISODE_COMPETENCES: Episode<Trimestre> = {
  code: "competences-qui-manquent",
  numero: 24,
  domaine: "Compétences et formation",
  titre: "Les compétences qui manquent",
  resume:
    "Les deux seuls opérateurs qui savent piloter la machine numérique partent à la retraite, et le sur-mesure augmente. Transmettre avant qu'il soit trop tard.",
  persona:
    "Vous êtes Martine Guillot, responsable de l'atelier de découpe et de façonnage d'Arvel Distribution, à Vénissieux. Votre équipe : douze opérateurs, qui débitent, usinent et chantent les panneaux sur mesure pour les menuisiers et les agenceurs.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge du sur-mesure sur le trimestre" },
    { fort: "90 %", texte: "des commandes sur mesure faites à l'atelier, au moins" },
    {
      fort: euros(ENVELOPPE),
      texte: "d'enveloppe pour la formation, le recrutement et les renforts",
    },
    { fort: "2 pilotes", texte: "autonomes sur la machine en fin de trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge du sur-mesure en écart au budget, en comptant les pièces reprises, la formation, le recrutement et ce que coûte la sous-traitance des commandes que l'atelier n'a pas pu faire.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre atelier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des demandes de devis sur mesure restent sans réponse et partent chez un concurrent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Erwan Arnoux",
        role: "Chargé d'affaires sur-mesure",
        alerte: true,
        texte: `Pendant ce temps, trois menuisiers attendaient un devis sur mesure ; deux sont allés voir ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "la part des commandes sur mesure faites à l'atelier en semaine 9, la première sans René, en %",
    unite: "%",
    placeholder: "80",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[DEPART_RENE]!.service * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "service",
      nom: "Sur-mesure fait à l'atelier",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `${nombre(l.sousTraitees ?? 0, 0)} commandes sous-traitées sur ${nombre(l.demande ?? 0, 0)}`
          : "objectif : 90 % au moins",
    },
    {
      cle: "pilotes",
      nom: "Pilotes autonomes",
      format: (v) => nombre(v, 0),
      formatEcart: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) =>
        semaine < DEPART_RENE
          ? `René part fin de semaine ${DEPART_RENE - 1}, Joaquim fin de semaine ${DEPART_JOAQUIM - 1}`
          : semaine < DEPART_JOAQUIM
            ? `Joaquim part fin de semaine ${DEPART_JOAQUIM - 1}`
            : "sans René ni Joaquim",
    },
    {
      cle: "releve",
      nom: "Maîtrise de la relève",
      format: sur100,
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => `les deux meilleurs ; seuls au-delà de ${nombre(SEUIL_AUTONOME * 100, 0)}`,
    },
    {
      cle: "depenses",
      nom: "Enveloppe compétences",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `consommée, sur ${euros(ENVELOPPE)}` : `${euros(ENVELOPPE)} pour le trimestre`,
      jauge: (l) => ({
        part: Math.min(1, (l.depenses ?? 0) / ENVELOPPE),
        enRetard: (l.depenses ?? 0) > ENVELOPPE,
      }),
    },
    {
      cle: "cumul",
      nom: "Marge du sur-mesure",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
    },
  ],
  contexte(l, decisions) {
    const demande = l.demande ?? 0;
    const sousTraitees = l.sousTraitees ?? 0;
    return {
      service: taux(l.service ?? 0, 0),
      demande: nombre(demande, 0),
      faites: nombre(demande - sousTraitees, 0),
      sousTraitees: nombre(sousTraitees, 0),
      pilotes: nombre(l.pilotes ?? 0, 0),
      releve: sur100(l.releve ?? 0),
      relevePrete: (l.releve ?? 0) >= 0.5,
      binome: decisions[D.plan] === 1,
      valorise: decisions[D.plan] === 1 || decisions[D.savoir] === 0,
      reneLa: (l.reneLa ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Fait à l'atelier, sem. ${a}`, taux(fin.service, 0)],
      [`Maîtrise de la relève, sem. ${a}`, sur100(fin.releve)],
      ["Marge de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Commandes sur mesure faites à l'atelier, semaine par semaine",
    cle: "service",
    cible: 0.9,
    libelleCible: "objectif : 90 % au moins",
    graduations: [0, 0.25, 0.5, 0.75, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${nombre(s.faites!, 0)} faites sur ${nombre(s.demande!, 0)} · ${nombre(s.sousTraitees!, 0)} sous-traitées`,
      `${nombre(s.pilotes!, 0)} pilote${s.pilotes! >= 2 ? "s" : ""} autonome${s.pilotes! >= 2 ? "s" : ""} · relève ${sur100(s.releve!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.plan && choix === 0) {
      // Seul le lancement compte : le marché a des candidats ou non, selon le hasard du trimestre.
      return [
        {
          ...CABINET,
          texte: recrueTrouvee(graine) ? REPONSES.cabinetConfiant : REPONSES.cabinetPrudent,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.cabinet !== null) {
      lies.push({
        ...CABINET,
        heure: "sem. 7",
        alerte: !arrive.cabinet,
        texte: arrive.cabinet
          ? REPONSES.cabinetTrouve(semaineRecrue(graine))
          : REPONSES.cabinetRate,
      });
    }
    if (arrive.reponseRene !== null) {
      lies.push({
        ...RENE,
        heure: "sem. 8",
        alerte: !arrive.reponseRene,
        texte: arrive.reponseRene
          ? chemin[D.rene] === 1
            ? REPONSES.reneProlonge
            : REPONSES.reneOui
          : REPONSES.reneNon,
      });
    }
    if (arrive.departRene) {
      const t = simuler(chemin, graine);
      lies.push({
        ...RH,
        heure: `sem. ${DEPART_RENE}`,
        texte: t.reneReste
          ? chemin[D.rene] === 1
            ? "René a fêté ses trente-huit ans de maison vendredi… et il était à la machine lundi matin, comme d'habitude."
            : "René a liquidé sa retraite vendredi ; son contrat de cumul commence mardi. Il a gardé son casier."
          : "René a fêté vendredi ses trente-huit ans de maison. Toute l'équipe était là. Lundi matin, sa place à la machine était vide.",
      });
    }
    if (arrive.arriveeRecrue !== null) {
      lies.push({
        ...RH,
        heure: `sem. ${arrive.arriveeRecrue}`,
        texte:
          "Notre nouvel opérateur confirmé a pris son poste ce matin. Il découvre la machine et nos pièces.",
      });
    }
    if (arrive.departJoaquim) {
      lies.push({
        de: "Joaquim Carvalhal",
        role: "Opérateur machine numérique",
        heure: `sem. ${DEPART_JOAQUIM}`,
        texte:
          "Voilà, c'est fini pour moi. Merci pour tout, Martine. Et prenez soin de la machine : elle a du caractère.",
      });
    }
    if (arrive.litige !== null) {
      lies.push({
        de: "Agencements Ferlay",
        role: "Client",
        heure: `sem. ${arrive.litige}`,
        alerte: true,
        texte:
          "Deux semaines de retards sur nos caissons : notre chantier de Confluence a glissé, et le maître d'ouvrage nous applique ses pénalités. Conformément au contrat, nous vous en répercutons 5 000 €.",
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
    titre: (t) => `Marge du sur-mesure ${ecartAuBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge du sur-mesure en écart au budget, pièces reprises, formation, recrutement et sous-traitance compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Sur-mesure fait à l'atelier",
          valeur: taux(t.serviceMoyen, 0),
          aide: `sur le trimestre ; ${taux(t.serviceApres, 0)} après le départ de René`,
          tenu: t.serviceMoyen >= 0.9,
        },
        {
          nom: "Pilotes autonomes",
          valeur: nombre(t.pilotesFinaux, 0),
          aide: "en semaine 13 ; objectif 2",
          tenu: t.pilotesFinaux >= 2,
        },
        {
          nom: "Pièces reprises",
          valeur: taux(t.tauxRepriseMoyen),
          aide: "des commandes faites ; avant les départs, 2,5 %",
          tenu: t.tauxRepriseMoyen <= 0.04,
        },
        {
          nom: "Enveloppe compétences",
          valeur: kE(t.depenses),
          aide: `consommée sur ${euros(ENVELOPPE)}`,
          tenu: t.depenses <= ENVELOPPE,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const rythme = (apt: number) =>
        apt >= 1.15
          ? "plus vite que prévu"
          : apt <= 0.85
            ? "plus lentement que prévu"
            : "au rythme prévu";
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché",
          texte: recrueTrouvee(graine)
            ? `avait un opérateur confirmé disponible, qui pouvait arriver en semaine ${semaineRecrue(graine)}.`
            : "n'avait aucun opérateur confirmé disponible avant le trimestre prochain.",
        },
        {
          titre: "René",
          texte: t.reneReste
            ? "a accepté de rester après la semaine 8."
            : "est parti à la fin de la semaine 8.",
        },
        ...(t.litige !== null
          ? [
              {
                titre: "L'agenceur",
                texte: `a répercuté ses pénalités de chantier en semaine ${t.litige}.`,
              },
            ]
          : []),
        {
          titre: "La relève",
          texte: `Hamza apprenait ${rythme(h.aptitudes[0])}, Océane ${rythme(h.aptitudes[1])}, Abdou ${rythme(h.aptitudes[2])}.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
