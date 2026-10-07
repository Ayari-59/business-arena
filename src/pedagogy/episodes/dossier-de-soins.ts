/**
 * ÉPISODE 86 — LE DOSSIER DE SOINS QUE PERSONNE NE REMPLIT, tel que l'interface
 * et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Fulbert montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  CHANCE_VOLONTAIRE,
  COUT_HEURE,
  D,
  ETE,
  HEURES_DOUBLE_DEPART,
  JOURS_SANS_PERTE,
  MINUTES_RECOPIE,
  NEUTRE,
  OBJECTIF_DOUBLE,
  OBJECTIF_ERREURS,
  OBJECTIF_USAGE,
  PERTE_PAR_JOUR,
  POSTES_JOUR,
  RECOPIE_DEPART,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  volontaireDeNuit,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/dossier-de-soins";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/dossier-de-soins";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
/** Le solde du projet : positif, le temps gagné couvre ses coûts. */
const solde = (v: number) =>
  v >= 0 ? `${kE(v)} de temps gagné, coûts déduits` : `${kE(-v)} de coûts au-delà du temps gagné`;

/** Le plafond d'absentéisme des soignants que l'association s'est fixé. */
export const PLAFOND_ABSENTEISME = 0.12;

const QUALITE = { de: "Qualité et gestion des risques", role: "Siège" } as const;
const EQUIPE_SI = { de: "Odon Sabran", role: "Technicien des systèmes d'information" } as const;

/** Les choix qui ont imposé l'outil, formé en salle ou rendu les transmissions au papier. */
const nbReflexes = (chemin: readonly number[]) =>
  REFLEXES.filter(([dec, o]) => chemin[dec] === o).length;

/** Ce que les décisions révèlent, dans l'ordre où un responsable des systèmes d'information les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les journaux de connexion et le tour de soins, qui montraient où et quand on saisissait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    terrain:
      "Votre diagnostic de la semaine 1 était juste : Carnéo n'entrait pas dans le travail réel. La tablette restait au poste de soins, rien n'existait la nuit, les plans de soins ne disaient pas ce qu'on faisait : on notait sur papier, et on recopiait en fin de poste.",
    parametrage:
      "En semaine 1, vous avez vu les plans de soins : une vraie cause, mais pas la principale. Même avec des plans justes, on ne valide pas au fil des soins un plan qu'on consulte à l'autre bout du couloir.",
    formation:
      "En semaine 1, vous avez retenu la formation des équipes ; elles avaient suivi la même que les trois EHPAD où Carnéo a pris. Ce n'était pas le savoir qui manquait, mais une tablette au chariot.",
    resistance:
      "En semaine 1, vous avez retenu la résistance des équipes ; les journaux montraient qu'elles se connectaient presque autant qu'ailleurs, mais en fin de poste, pour recopier. Elles ne refusaient pas l'outil : il n'était pas là où elles travaillent.",
  };
  const justes = ["terrain", "parametrage"];
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
    score: d === "terrain" ? 1 : d === "parametrage" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = nbReflexes(p.chemin);
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais imposé l'outil, ni formé en salle, ni rendu les transmissions au papier : vous avez cherché ce qui l'empêchait d'entrer dans le travail."
        : `Vous avez imposé l'outil, formé en salle ou rendu les transmissions au papier ${n} fois sur ${ETAPES.length} décisions. L'obligation a fabriqué des recopies de fin de poste, la formation en salle trois points qui ne tiennent pas, le papier une double perte : le temps de Carnéo, et ses plans de soins.${
            t.depart ? " Une aide-soignante de nuit a démissionné en semaine 10." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.heuresDoubleDepart,
    "de recopie par semaine dans les trois EHPAD",
    "heures",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e)} heure${e >= 2 ? "s" : ""}`,
  );

  // Le travail réel : le matériel au chariot, les plans refaits avec les équipes, des référents, le papier retiré.
  const materiel = p.chemin[D.terrain] === 1;
  const plans = p.chemin[D.plans] === 1;
  const referents = p.chemin[D.referents] === 0;
  const bascule = p.chemin[D.bascule] === 1 || p.chemin[D.bascule] === 2;
  const bons = [materiel, plans, referents, bascule].filter(Boolean).length;
  const travail: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      materiel
        ? "Vous avez mis Carnéo sur les chariots, la nuit et dans les étages de Montbard."
        : "Carnéo est resté au poste de soins, et la nuit sans tablette."
    } ${
      plans
        ? "Vous avez fait refaire les plans de soins par ceux qui font les soins."
        : "Les plans de soins n'ont pas été refaits avec les équipes."
    } ${
      referents
        ? "Des référents de terrain ont accompagné leurs collègues au chariot."
        : "Personne n'a accompagné les équipes au chariot."
    } ${
      bascule
        ? "Vous avez retiré le cahier papier : un seul support."
        : "Les transmissions ont continué sur deux supports, ou sont revenues au papier."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, travail];
}

export function axe([information, diagnostic, reflexe, calibrage, travail]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder où et quand on saisit",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les journaux de connexion et en suivant un tour de soins : la moitié des postes recopiaient leur papier en fin de poste, parce que la tablette était au bout du couloir et que les plans de soins ne disaient pas ce qu'ils faisaient.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Faire entrer l'outil dans le travail plutôt que l'imposer",
      texte:
        "Une obligation contrôlée produit des saisies, pas de l'usage : des recopies de fin de poste, génériques et tardives. Revenir au papier supprime la recopie, mais rend les plans de soins et le temps gagné. Cherchez d'abord ce qui empêche de saisir au moment du soin.",
    };
  }
  if (travail!.score === 0) {
    return {
      titre: "Mettre l'outil là où se font les soins",
      texte:
        "Un dossier de soins s'utilise au chariot, la nuit comme le jour, avec des plans que les équipes ont écrits, et des collègues pour aider. Sans cela, ni l'obligation ni la formation ne changent les pratiques.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui empêche de saisir au moment du soin",
      texte:
        "Quand un outil n'est pas utilisé, regardez d'abord où et quand le travail se fait, et ce que l'outil y demande, avant de juger la formation ou la volonté des équipes.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la semaine 1",
      texte: `${POSTES_JOUR} postes par jour, sept jours sur sept, dont la moitié recopient ${MINUTES_RECOPIE} minutes : ${POSTES_JOUR * 7} × ${nombre(RECOPIE_DEPART)} × ${MINUTES_RECOPIE} / 60, soit ${nombre(HEURES_DOUBLE_DEPART, 0)} heures de soignants par semaine, ${euros(HEURES_DOUBLE_DEPART * COUT_HEURE)} au coût horaire chargé.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_DOSSIER_SOINS: Episode<Trimestre> = {
  code: "dossier-de-soins",
  numero: 86,
  domaine: "Faire adopter un outil par les soignants",
  titre: "Le dossier de soins que personne ne remplit",
  resume:
    "Un dossier de soins informatisé que trois EHPAD recopient en fin de poste. Mettre l'outil là où se font les soins, avec des plans écrits par les équipes et des référents de terrain, plutôt que l'imposer.",
  persona:
    "Vous êtes Fulbert Ravignan, responsable des systèmes d'information de l'Association Solvanne, à Dijon. Carnéo, le dossier de soins informatisé, est déployé depuis six mois dans les six EHPAD de l'association. À Beaune, Chalon-sur-Saône et Montbard (248 places), les transmissions restent sur papier, les plans de soins ne sont pas à jour et la tablette de nuit dort dans un tiroir. Votre équipe : un technicien, Odon Sabran, et la cheffe de projet de l'éditeur. Le trimestre va d'avril à juin.",
  mandat: [
    { fort: pc(OBJECTIF_USAGE), texte: "des transmissions saisies au moment du soin, fin juin" },
    { fort: `${OBJECTIF_DOUBLE} h`, texte: "de recopie par semaine, au plus" },
    { fort: `${OBJECTIF_ERREURS}`, texte: "erreurs de soins liées aux transmissions, au plus" },
    { fort: "12 %", texte: "d'absentéisme des soignants, au plus" },
  ],
  jugement:
    "La directrice générale juge le trimestre en euros : le temps de transmission gagné depuis avril, au coût horaire d'un soignant, moins ce que le projet a coûté (matériel, formation, paramétrage, accompagnement, contrôle, erreurs de soins, absences, départs, crédits repris), en ajoutant les huit semaines de l'été au rythme de la fin juin.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Carnéo dans les trois EHPAD",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des soignants continuent de rester après leur poste pour recopier, payés en heures supplémentaires.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Eudoxie Rambourg",
        role: "Directrice administrative et financière",
        alerte: true,
        texte: `Pendant ce temps, les recopies faites après le poste ont été payées en heures supplémentaires : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "les heures que les soignants des trois EHPAD passent chaque semaine à recopier dans Carnéo ce qu'ils ont écrit sur papier",
    unite: "h",
    placeholder: "0",
    min: 0,
    max: 400,
    step: 1,
    reel: (t) => t.heuresDoubleDepart,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "usage",
      nom: "Saisies au moment du soin",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `part des postes ; objectif ${pc(OBJECTIF_USAGE)} fin juin`,
      jauge: (l) =>
        l.usage == null
          ? null
          : { part: Math.min(1, l.usage / OBJECTIF_USAGE), enRetard: l.usage < OBJECTIF_USAGE },
    },
    {
      cle: "heuresDouble",
      nom: "Heures de recopie",
      format: heures,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `papier recopié dans Carnéo, semaine ${semaine} ; objectif ${OBJECTIF_DOUBLE} h au plus`
          : `papier recopié dans Carnéo, chaque semaine ; objectif ${OBJECTIF_DOUBLE} h au plus`,
    },
    {
      cle: "erreurs",
      nom: "Erreurs de soins",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "liées aux transmissions, déclarées depuis avril",
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme des soignants",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `plafond ${taux(PLAFOND_ABSENTEISME, 0)}`,
    },
    {
      cle: "solde",
      nom: "Solde du projet",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "temps gagné depuis avril, moins les coûts" : "le trimestre commence",
    },
  ],
  contexte(l, decisions) {
    return {
      usage: taux(l.usage ?? 0, 0),
      heuresDouble: heures(l.heuresDouble ?? 0),
      erreurs: nombre(l.erreurs ?? 0, 0),
      absenteisme: taux(l.absenteisme ?? 0),
      materiel: decisions[D.terrain] === 1,
      plansRefaits: decisions[D.plans] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const erreurs = semaines.reduce((x, w) => x + w.erreurs, 0);
    return [
      [`Saisies au moment du soin, sem. ${a}`, taux(t.semaines[a]!.usage, 0)],
      [`Recopie, sem. ${a}`, heures(t.semaines[a]!.heuresDouble)],
      ["Erreurs de soins de la période", nombre(erreurs, 0)],
    ];
  },
  courbe: {
    titre: "Transmissions saisies au moment du soin, semaine par semaine",
    cle: "usage",
    cible: OBJECTIF_USAGE,
    libelleCible: `objectif : ${pc(OBJECTIF_USAGE)} fin juin`,
    graduations: [0, 0.25, 0.5, 0.75, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.usage!, 0)} au moment du soin · ${heures(s.heuresDouble!)} de recopie`,
      `${nombre(s.erreurs!, 0)} erreur${s.erreurs! >= 2 ? "s" : ""} de soins · absences ${taux(s.absenteisme!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.referents && choix === 0) {
      // Seul le choix compte : l'équipe de nuit de Montbard répond selon le hasard du trimestre.
      return [
        {
          ...EQUIPE_SI,
          texte: volontaireDeNuit(graine) ? REPONSES.volontaireOui : REPONSES.volontaireNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.erreurs > 0) {
      lies.push({
        ...QUALITE,
        heure: `sem. ${de} à ${a}`,
        alerte: arrive.erreurs >= 2,
        texte: `${arrive.erreurs} erreur${arrive.erreurs >= 2 ? "s" : ""} de soins liée${
          arrive.erreurs >= 2 ? "s" : ""
        } aux transmissions déclarée${arrive.erreurs >= 2 ? "s" : ""} dans les trois EHPAD : un soin modifié non transmis, un changement de régime non repris, une chute signalée trop tard à l'équipe suivante. Aucune n'a eu de conséquence grave.`,
      });
    }
    if (arrive.demarrage) {
      lies.push({
        ...EQUIPE_SI,
        heure: "sem. 9",
        alerte: true,
        texte: chemin[D.bascule] === 1 ? REPONSES.demarrageSimultane : REPONSES.demarrageProgressif,
      });
    }
    if (arrive.depart) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: "sem. 10",
        alerte: true,
        texte: REPONSES.depart,
      });
    }
    if (chemin[D.bascule] === 0 && de <= 12 && a >= 12) {
      lies.push({
        de: "Eudoxie Rambourg",
        role: "Directrice administrative et financière",
        heure: "sem. 12",
        alerte: t.repriseArs,
        texte: t.repriseArs ? REPONSES.reprise : REPONSES.pasDeReprise,
      });
    }
    if (arrive.incident) {
      lies.push({ ...QUALITE, heure: "sem. 13", alerte: true, texte: REPONSES.incident });
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
    titre: (t) => `${solde(t.objectif)}, été compris`,
    formatObjectif: kE,
    noteDesBarres: `Temps de transmission gagné depuis avril, moins les coûts du projet (matériel, formation, erreurs de soins, absences, départs, crédits repris), avec les ${ETE} semaines de l'été au rythme de la fin juin, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.`,
    tuiles(t) {
      return [
        {
          nom: "Saisies au moment du soin",
          valeur: taux(t.usageFinal, 0),
          aide: `fin juin ; objectif ${pc(OBJECTIF_USAGE)}`,
          tenu: t.usageFinal >= OBJECTIF_USAGE,
        },
        {
          nom: "Recopie",
          valeur: heures(t.heuresDoubleFinal),
          aide: `en semaine 13 ; objectif ${OBJECTIF_DOUBLE} h au plus`,
          tenu: t.heuresDoubleFinal <= OBJECTIF_DOUBLE,
        },
        {
          nom: "Erreurs de soins",
          valeur: nombre(t.erreurs, 0),
          aide: `sur le trimestre ; ${OBJECTIF_ERREURS} au plus`,
          tenu: t.erreurs <= OBJECTIF_ERREURS,
        },
        {
          nom: "Équipes",
          valeur: taux(t.absenteismeMoyen),
          aide: t.depart
            ? "d'absentéisme ; une aide-soignante de nuit a démissionné"
            : `d'absentéisme en moyenne ; plafond ${taux(PLAFOND_ABSENTEISME, 0)}`,
          tenu: t.absenteismeMoyen <= PLAFOND_ABSENTEISME && !t.depart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La mi-juin",
          texte: `a apporté ${t.chaleur}.`,
        },
        {
          titre: "Les équipes et l'ARS",
          texte: [
            t.volontaire
              ? "un soignant de nuit de Montbard se serait proposé comme référent"
              : `aucun soignant de nuit de Montbard ne se serait proposé comme référent (une chance sur ${Math.round(1 / (1 - CHANCE_VOLONTAIRE))} environ)`,
            t.demarrageDifficile ? "la bascule a connu un démarrage difficile" : null,
            t.depart ? "une aide-soignante de nuit a démissionné en semaine 10" : null,
            t.repriseArs ? "l'ARS a repris 18 000 € de crédits" : null,
            t.incident ? "un compte partagé a rendu une transmission introuvable" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};

function pc(v: number) {
  return `${Math.round(v * 100)} %`;
}
