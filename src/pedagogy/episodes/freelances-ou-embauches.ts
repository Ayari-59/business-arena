/**
 * ÉPISODE 74 — EMBAUCHER OU LOUER DES FREELANCES, tel que l'interface et le
 * bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la practice Data montre, ce que
 * la courbe trace, ce sur quoi le bilan juge Ruben, et ce que ses décisions
 * révèlent de lui.
 */
import {
  CONVERSION,
  D,
  DURABLE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_T1,
  PERTE_PAR_JOUR,
  RECRUTEMENTS_PLAN,
  SEMAINES,
  evenements,
  hasard,
  simuler,
  sondageFavorable,
  tableauDeBord,
  type Scenario,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/freelances-ou-embauches";
import {
  ACTEURS,
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/freelances-ou-embauches";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Au-delà, l'intercontrat projeté d'avril à décembre n'est plus un résidu : c'est un sureffectif. */
const PLAFOND_INTERCONTRAT = 150;

const VOTE: Record<Scenario, string> = {
  reportee: "l'échéance reportée de deux ans",
  maintenue: "l'échéance maintenue au 30 juin",
  elargie: "l'obligation élargie aux ETI",
};

const jours = (v: number) => `${nombre(v, 0)} j`;

/** Ce que les décisions révèlent, dans l'ordre où un directeur de practice les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le carnet de missions, la note de veille et la comparaison des coûts",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    durable:
      "Votre diagnostic de la semaine 1 était juste : la demande mêlait une part portée par des contrats-cadres et une vague réglementaire qui pouvait retomber ; seule la première justifiait des embauches.",
    delai:
      "En semaine 1, vous avez vu qu'un recrutement prend deux à trois mois : c'était vrai, et cela imposait des freelances tout de suite. Mais la vraie question était ailleurs : quelle part de la demande serait encore là quand les recrues arriveraient.",
    effectif:
      "En semaine 1, vous avez lu un sous-effectif de huit consultants ; il n'en manquait que trois pour la demande sûre. Les cinq autres tenaient à une échéance que Bruxelles pouvait reporter.",
    tjm: "En semaine 1, vous avez retenu le coût des freelances ; il réduisait la marge, mais c'est leur flexibilité qui comptait pour la part incertaine de la demande.",
  };
  const justes = ["durable", "delai"];
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
    score: d === "durable" ? 1 : d === "delai" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais dimensionné l'équipe permanente sur la demande du moment : vous avez embauché sur la demande sûre, et loué le reste."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} de dimensionner l'équipe permanente sur la demande du moment plutôt que sur la demande sûre : embaucher pour une vague qui pouvait retomber, ou louer une demande devenue certaine.${
            t.intercontratProjete > PLAFOND_INTERCONTRAT
              ? ` D'avril à décembre, ${jours(t.intercontratProjete)} d'intercontrat sont attendus.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    DURABLE,
    "de demande durable",
    "ETP",
    { juste: 0.5, proche: 2 },
    (e) => `${nombre(e)} ETP`,
  );

  // Le noyau sur la demande sûre, et la flexibilité préservée là où elle protège.
  const [, d2, d3] = p.chemin;
  const noyau =
    Math.abs(t.cdiFin - t.durableFin) <= 1 && t.intercontratProjete <= PLAFOND_INTERCONTRAT;
  const flexible = (d2 === 1 || d2 === 2) && d3 === 1;
  const domaine: Constat = {
    score: noyau && flexible ? 1 : noyau || flexible ? 0.6 : 0,
    texte: `Fin mars, ${t.cdiFin} consultants en CDI pour ${t.durableFin} ETP de demande durable${
      noyau
        ? " : le noyau permanent correspondait à la demande sûre."
        : t.cdiFin > t.durableFin
          ? " : un sureffectif qu'aucun contrat-cadre ne portait."
          : " : des postes durables tenus en freelances, qui coûtaient de la marge chaque semaine."
    } ${
      d2 === 0
        ? `Vous aviez placé des freelances sur la plateforme de Kervalis${
            t.demarches > 0 ? ` : la banque en a recruté ${t.demarches} en direct.` : "."
          }`
        : d3 !== 1
          ? "Votre engagement auprès de Freelancia rendait payant l'arrêt d'un freelance."
          : "Les freelances sont restés là où ils protégeaient : sur la part incertaine, loin de la mission sensible."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter les contrats avant les gens",
      texte:
        "Rejouez l'épisode en lisant d'abord le carnet de missions, la note de veille et la comparaison des coûts : la part durable de la demande, le sort de la vague et le seuil d'intercontrat y étaient.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Embaucher sur la demande sûre, louer le reste",
      texte:
        "Un CDI se paie toutes les semaines ; il ne vaut mieux qu'un freelance que s'il facture plus de 108 jours par an. Embauchez pour ce que les contrats-cadres garantissent, louez la vague, et changez d'avis quand une demande devient sûre.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Garder la flexibilité là où elle protège",
      texte:
        "Un freelance s'arrête sans coût : c'est ce qu'il apporte. Ne le placez pas sur la mission que le client ne peut pas perdre, et ne signez pas d'engagement qui rend son arrêt payant.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer la demande durable de la vague",
      texte:
        "Avant de dimensionner une équipe, rangez chaque ligne du carnet : contrat-cadre ou forfait, jusqu'à quand, et de quoi dépend la suite. Le noyau permanent se calcule sur la première colonne.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le compte de la demande durable ligne par ligne : un bon de commande qui s'arrête au 30 juin n'est pas durable, même s'il est passé sur un contrat-cadre.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_FREELANCES: Episode<Trimestre> = {
  code: "freelances-ou-embauches",
  numero: 74,
  domaine: "Dimensionner une équipe",
  titre: "Embaucher ou louer des freelances",
  resume:
    "La demande de missions data a doublé, il manque huit consultants. Embaucher pour la demande sûre, louer la part qui peut retomber, et savoir changer d'avis quand elle devient sûre.",
  persona:
    "Vous êtes Ruben Esnault, directeur de la practice Data et systèmes d'information d'Atlas Conseil, à Nantes. Trente consultants en CDI, des contrats-cadres avec une banque, un groupement hospitalier, un industriel et une mutuelle, et depuis l'été une vague de missions de mise en conformité : les demandes ont doublé en six mois, il vous manque huit consultants.",
  mandat: [
    { fort: kE(OBJECTIF_T1), texte: "de marge pour la practice sur le trimestre" },
    { fort: "un plan d'effectif", texte: "d'avril à décembre, pour le comité de mars" },
    { fort: "aucune mission", texte: "perdue faute de monde" },
    { fort: "janvier à mars", texte: "et un vote à Bruxelles le 26 mars" },
  ],
  jugement:
    "La présidente juge votre trimestre sur la marge de la practice de janvier à mars, plus la marge que la structure en place fin mars permet d'attendre d'avril à décembre, intercontrat et coûts de recrutement compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre practice",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, vous ne facturez plus votre propre mission : la journée de directeur se perd.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ACTEURS.PRUNE,
        alerte: true,
        texte: `Pendant ce temps, ta propre mission n'a pas été facturée : ${euros(perdu)} de marge en moins.`,
      };
    },
  },
  prevision: {
    libelle: "la part durable de la demande, en consultants équivalents temps plein",
    unite: "ETP",
    placeholder: "30",
    min: 0,
    max: 60,
    step: 0.5,
    reel: () => DURABLE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
    semaine,
  }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge de la practice",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `objectif à date : ${kE((OBJECTIF_T1 * semaine) / SEMAINES)}`
          : `${kE(OBJECTIF_T1)} attendus sur le trimestre`,
      jauge: (l) =>
        l.semaine
          ? {
              part: Math.max(0, Math.min(1, (l.marge ?? 0) / OBJECTIF_T1)),
              enRetard: (l.marge ?? 0) < (OBJECTIF_T1 * l.semaine) / SEMAINES,
            }
          : null,
    },
    {
      cle: "occupation",
      nom: "Consultants en mission",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "part des consultants en CDI qui facturent cette semaine",
    },
    {
      cle: "intercontrat",
      nom: "Intercontrat",
      format: jours,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? "jours payés sans mission depuis janvier" : "aucun : la demande dépasse l'équipe",
    },
    {
      cle: "nonPourvus",
      nom: "Postes non pourvus",
      format: (v) => `${nombre(v)} ETP`,
      sensBon: -1,
      aide: () => "missions que personne ne tient cette semaine",
    },
    {
      cle: "coutJour",
      nom: "Coût d'une journée facturée",
      format: euros,
      sensBon: -1,
      aide: () => "salaires, freelances, sous-traitance et recrutement, par jour facturé",
    },
  ],
  contexte(l, decisions) {
    const d1 = decisions[D.plan] ?? NEUTRE[D.plan];
    return {
      marge: kE(l.marge ?? 0),
      intercontrat: nombre(l.intercontrat ?? 0, 0),
      libre: d1 !== 3,
      freelances: l.freelances ?? 0,
      recrutements: RECRUTEMENTS_PLAN[d1] ?? 0,
      ouverts: RECRUTEMENTS_PLAN[d1] ?? 0,
      lotPerdu: (l.lotPerdu ?? 0) > 0,
      demarches: l.demarches ?? 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.margeSemaine, 0);
    return [
      ["Marge de la période", kE(marge)],
      [`Consultants en mission, sem. ${a}`, taux(t.semaines[a]!.occupation, 0)],
      [`Freelances en mission, sem. ${a}`, nombre(t.semaines[a]!.freelances, 0)],
    ];
  },
  courbe: {
    titre: "Marge de la practice, semaine par semaine",
    cle: "margeSemaine",
    cible: OBJECTIF_T1 / SEMAINES,
    libelleCible: `objectif : ${kE(OBJECTIF_T1 / SEMAINES)} par semaine`,
    graduations: [10000, 25000, 50000, 70000],
    format: kE,
    details: (s) => [
      `marge de la semaine ${kE(s.margeSemaine!)} · ${taux(s.occupation!, 0)} des consultants en mission`,
      `${nombre(s.cdi!, 0)} consultants en CDI · ${nombre(s.freelances!, 0)} freelances · ${nombre(s.nonPourvus!, 0)} ETP non pourvus`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.extension && choix === 1) {
      // Yaël et Zélia acceptent ou non le CDI, selon le hasard du trimestre.
      const [y, q] = hasard(graine).accepte.map((u) => u < CONVERSION.chance);
      const c = REPONSES.conversion;
      return [...(y && q ? c.deux : y ? c.yael : q ? c.zelia : c.aucun)];
    }
    if (etape === D.keroual && choix === 2) {
      return [sondageFavorable(graine) ? REPONSES.sondageFavorable : REPONSES.sondageDefavorable];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    for (const f of arrive.faits) {
      const heure = `sem. ${f.semaine}`;
      if (f.quoi === "demarche") lies.push({ ...REPONSES.demarche(f.n), heure });
      if (f.quoi === "depart") lies.push({ ...REPONSES.depart(f.n), heure });
      if (f.quoi === "lot") lies.push({ ...REPONSES.lot, heure });
      if (f.quoi === "arrivee") lies.push({ ...REPONSES.arrivee(f.n), heure });
      if (f.quoi === "indemnite") lies.push({ ...REPONSES.indemnite(euros(f.n)), heure });
    }
    if (arrive.vote) {
      lies.push({
        ...ACTEURS.VICTOIRE,
        heure: `sem. ${SEMAINES}`,
        alerte: true,
        texte: REPONSES.vote[hasard(graine).scenario],
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
    titre: (t) =>
      `${kE(t.objectif)} de marge attendue sur l'année, dont ${kE(t.margeT1)} au trimestre`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge de la practice de janvier à mars, plus la marge attendue d'avril à décembre avec la structure en place fin mars, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge du trimestre",
          valeur: kE(t.margeT1),
          aide: `objectif ${kE(OBJECTIF_T1)}`,
          tenu: t.margeT1 >= OBJECTIF_T1,
        },
        {
          nom: "Noyau permanent",
          valeur: `${t.cdiFin} CDI`,
          aide: `pour ${t.durableFin} ETP de demande durable fin mars`,
          tenu: Math.abs(t.cdiFin - t.durableFin) <= 1,
        },
        {
          nom: "Intercontrat attendu",
          valeur: jours(t.intercontratProjete),
          aide: `d'avril à décembre ; au plus ${PLAFOND_INTERCONTRAT} jours`,
          tenu: t.intercontratProjete <= PLAFOND_INTERCONTRAT,
        },
        {
          nom: "Banque Kervalis",
          valeur: t.lotPerdu
            ? "lot confié à Halden"
            : t.demarches > 0
              ? `${t.demarches} freelance${t.demarches > 1 ? "s" : ""} recruté${t.demarches > 1 ? "s" : ""} en direct`
              : "relation intacte",
          aide: "le client le plus sensible de la practice",
          tenu: !t.lotPerdu && t.demarches === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le vote de Bruxelles",
          texte: `Le 26 mars : ${VOTE[t.scenario]}. La marge d'avril à décembre est estimée avec cette issue : ${kE(t.projection)}.`,
        },
        {
          titre: "Les freelances et les recrues",
          texte: [
            t.departs > 0
              ? `${t.departs} freelance${t.departs > 1 ? "s sont partis" : " est parti"} en cours de mission`
              : "aucun freelance n'est parti en cours de mission",
            t.demarches > 0 ? `Kervalis en a recruté ${t.demarches} en direct` : null,
            t.indemnites > 0 ? `${kE(t.indemnites)} d'indemnités payées à Freelancia` : null,
            `${kE(t.recrutement)} d'honoraires et de frais de recrutement sur l'année`,
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
