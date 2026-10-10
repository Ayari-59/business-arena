/**
 * ÉPISODE 85 — LES CHUTES DE LA NUIT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Ernestine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  CHUTES_ATTENDUES,
  CONTENTIONS_DEPART,
  D,
  FRACTURES_ETE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_CHUTES,
  PERTE_PAR_JOUR,
  SEMAINES,
  TOTAL_ETE,
  evenements,
  hasard,
  medecinAccepte,
  plainte,
  simuler,
  tableauDeBord,
  type FractureTiree,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/chutes-la-nuit";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/chutes-la-nuit";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const chutes = (v: number) => `${nombre(v, 0)} chute${Math.round(v) >= 2 ? "s" : ""}`;
const fractures = (v: number) => `${nombre(v, 0)} fracture${v >= 2 ? "s" : ""}`;
const residents = (v: number) => `${nombre(v, 0)} résident${v >= 2 ? "s" : ""}`;
const CONTENTIONS_INITIALES = CONTENTIONS_DEPART.douze + CONTENTIONS_DEPART.autres;
/** Le coût des chutes, dit en clair : l'objectif en est l'opposé. */
const coutDesChutes = (t: Trimestre) =>
  `Coût des chutes : ${kE(t.coutTotal)}, dont ${kE(t.risqueLaisse)} de risque laissé à janvier`;

const NAFISSATOU = { de: "Nafissatou Sakho", role: "Aide-soignante de nuit" } as const;
const MURESAN = { de: "Dr Ioana Mureșan", role: "Médecin coordonnateur" } as const;
const LAMBOLEY = { de: "Médard Lamboley", role: "Fils de Mme Lamboley, résidente" } as const;

/** Ce qu'une fracture devient dans le fil des messages : sobrement, comme une déclaration. */
const RESIDENTS_FRACTURES = [
  { qui: "Mme B., 91 ans", ou: "dans sa salle de bains", quoi: "fracture du col du fémur" },
  { qui: "M. C., 86 ans", ou: "au pied de son lit", quoi: "fracture du poignet" },
  {
    qui: "Mme T., 89 ans",
    ou: "dans le couloir, en allant aux toilettes",
    quoi: "fracture du bassin",
  },
  { qui: "M. V., 84 ans", ou: "dans sa chambre", quoi: "fracture du col du fémur" },
  { qui: "Mme H., 93 ans", ou: "près de son fauteuil", quoi: "fracture de l'épaule" },
] as const;

export function texteFracture(f: FractureTiree): string {
  const r = RESIDENTS_FRACTURES[(f.rang - 1) % RESIDENTS_FRACTURES.length]!;
  return f.barriere
    ? `${r.qui}, a enjambé la barrière de son lit vers 5 h 30 : ${r.quoi}. Transfert au centre hospitalier, la famille est prévenue, la déclaration part à l'ARS.`
    : `${r.qui}, a chuté ${r.ou} vers 5 h 45 : ${r.quoi}. Transfert au centre hospitalier, la famille est prévenue, la déclaration part à l'ARS.`;
}

/** Ce que les décisions révèlent, dans l'ordre où une IDEC les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'analyse des 41 déclarations et la nuit passée avec l'équipe",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    causes:
      "Votre diagnostic de la semaine 1 était juste : douze résidents faisaient 28 des 41 chutes, au lever entre 5 h et 7 h et après les psychotropes du soir. Des causes précises, qui se traitent.",
    psychotropes:
      "En semaine 1, vous avez retenu les traitements du soir : une vraie cause, qui expliquait une part des chutes des douze, mais pas le lever de 5 h dans le noir, ni le chaussage, ni la tournée qui ne passait pas avant 7 h.",
    surveillance:
      "En semaine 1, vous avez retenu le manque de bras la nuit ; les chutes ne tombaient pas n'importe quand, chez n'importe qui : 19 des 29 chutes de nuit entre 5 h et 7 h, chez douze résidents. Une ronde de plus passe partout, et rarement au bon endroit.",
    fragilite:
      "En semaine 1, vous avez retenu la dépendance qui monte ; le GMP n'avait guère bougé, et 78 des 90 résidents ne faisaient que 13 chutes. Ce n'était pas l'établissement qui tombait, c'étaient douze résidents, à une heure précise.",
  };
  const justes = ["causes", "psychotropes"];
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
    score: d === "causes" ? 1 : d === "psychotropes" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu aux chutes en contenant ou en surveillant sans cibler : ni barrière de plus, ni somnifère plus fort, ni fauteuil, ni ronde partout."
        : `Sous la pression, vous avez choisi ${n} fois sur ${ETAPES.length} décisions de contenir (barrières, somnifère plus fort, fauteuil) ou de surveiller sans cibler (veilleuse de plus, capteurs partout, ronde toutes les heures). Les chutes comptées baissent sous barrière ; les fractures, elles, montent, et la marche se perd.${
            t.contentionsMax > CONTENTIONS_INITIALES
              ? ` Jusqu'à ${residents(t.contentionsMax)} ont eu une barrière la nuit.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.chutesAttendues,
    "d'octobre à décembre si rien ne changeait",
    "chutes",
    { juste: 2, proche: 5 },
    (e) => chutes(e),
  );

  // Les causes traitées : le lever, les traitements, la marche, les contentions réévaluées.
  const lever = p.chemin[D.plan] === 2;
  const traitements = p.chemin[D.traitements] === 0 || p.chemin[D.traitements] === 2;
  const marche = p.chemin[D.activite] === 0 || p.chemin[D.activite] === 2;
  const reevalue = p.chemin[D.contentions] === 1;
  const traitees = [lever, traitements, marche, reevalue].filter(Boolean).length;
  const causes: Constat = {
    score: traitees === 4 ? 1 : traitees >= 2 ? 0.6 : 0,
    texte: `${
      lever
        ? "Vous avez traité le lever de 5 h : une tournée ciblée, la lumière, des chaussures fermées."
        : "Le lever de 5 h, où tombaient près de la moitié des chutes, n'a pas eu sa tournée."
    } ${
      traitements
        ? "Les psychotropes du soir ont été revus par paliers ; l'effet est venu tard, et il reste au trimestre suivant."
        : "Les psychotropes du soir n'ont pas été revus."
    } ${
      marche
        ? "Vous avez travaillé la marche ou protégé les hanches des douze."
        : "Rien n'a été fait pour la marche des douze, ni pour la gravité de leurs chutes."
    } ${
      reevalue
        ? "Les contentions ont été réévaluées une à une, et levées avec quelque chose à la place."
        : "Les contentions n'ont pas été réévaluées une à une."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, causes];
}

export function axe([information, diagnostic, reflexe, calibrage, causes]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire les déclarations avant de décider",
      texte:
        "Rejouez l'épisode en analysant d'abord les 41 déclarations et en passant une nuit avec l'équipe : douze résidents, le lever de 5 h, les hypnotiques de 20 h. Une journée et demie de lecture disait où agir.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter les causes plutôt que contenir",
      texte:
        "Une barrière fait baisser le nombre de chutes et monter celui des fractures ; un somnifère plus fort ou un fauteuil font perdre la marche ; une surveillance qui passe partout ne passe pas au bon moment. Cherchez pourquoi, quand et chez qui l'on tombe, et traitez cela.",
    };
  }
  if (causes!.score === 0) {
    return {
      titre: "Agir sur chaque cause, pas sur la peur de la chute",
      texte:
        "Le lever du matin, les traitements du soir, la marche, les contentions jamais réévaluées : chacune de ces causes a sa réponse, et les plus lentes sont celles qui comptent pour le trimestre suivant.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où les chutes se concentrent",
      texte:
        "Avant de juger l'effectif de nuit ou la dépendance, regardez qui tombe, à quelle heure et en faisant quoi : les événements indésirables se concentrent presque toujours.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des chutes attendues",
      texte:
        "41 chutes en treize semaines d'été, au même rythme en octobre et novembre, un quart de plus sur les quatre semaines de décembre : 41 × (9 + 4 × 1,25) / 13, soit 44 chutes si rien ne change.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_CHUTES: Episode<Trimestre> = {
  code: "chutes-la-nuit",
  numero: 85,
  domaine: "Analyser des événements indésirables",
  titre: "Les chutes de la nuit",
  resume:
    "Un EHPAD où les chutes de nuit se multiplient, et des familles qui demandent des barrières. Analyser les événements et traiter leurs causes plutôt que contenir ou surveiller sans cibler.",
  persona:
    "Vous êtes Ernestine Vaillandet, infirmière coordinatrice (IDEC) de l'EHPAD de Chalon-sur-Saône, l'un des six EHPAD de l'Association Solvanne : 90 places, une équipe de nuit de deux aides-soignantes et une agente de service, un médecin coordonnateur à mi-temps. Le trimestre va d'octobre à décembre ; l'hiver et ses épidémies arrivent en décembre.",
  mandat: [
    {
      fort: `${OBJECTIF_CHUTES} chutes`,
      texte: "au plus sur le trimestre : un quart de moins qu'à l'été",
    },
    { fort: "aucune fracture", texte: "évitable" },
    { fort: "pas de contention", texte: "sans indication motivée et réévaluée" },
    { fort: "le coût des chutes", texte: "au plus bas, risque laissé à janvier compris" },
  ],
  jugement:
    "La direction juge le trimestre sur le coût des chutes : heures, matériel, surveillance des contentions, soins après chaque chute, fractures (journées perdues, dépendance accrue, réclamations), plaintes et inspection, plus le coût attendu des fractures du trimestre suivant au risque atteint fin décembre.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre EHPAD",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, ce sont des nuits de plus sans rien changer.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Sigismond Ravanel",
        role: "Directeur de l'EHPAD",
        alerte: true,
        texte: `Pendant ce temps, des nuits de plus organisées comme avant : chutes, soins et appels aux familles, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de chutes d'octobre à décembre si rien ne change",
    unite: "chutes",
    placeholder: "40",
    min: 0,
    max: 200,
    step: 1,
    reel: (t) => t.chutesAttendues,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "chutesCumul",
      nom: "Chutes du trimestre",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `repère à date : ${nombre(l.objectifADate ?? 0, 0)} au plus, ${OBJECTIF_CHUTES} sur le trimestre`
          : `${TOTAL_ETE} l'été ; ${OBJECTIF_CHUTES} au plus ce trimestre`,
      jauge: (l) =>
        l.objectifADate
          ? {
              part: Math.min(1, (l.chutesCumul ?? 0) / OBJECTIF_CHUTES),
              enRetard: (l.chutesCumul ?? 0) > l.objectifADate,
            }
          : null,
    },
    {
      cle: "chutes",
      nom: "Chutes de la semaine",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine}, dont la nuit et le jour`
          : "par semaine, en moyenne l'été",
    },
    {
      cle: "fractures",
      nom: "Fractures",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `depuis le 1er octobre ; ${FRACTURES_ETE} l'été`,
    },
    {
      cle: "contentions",
      nom: "Résidents sous barrière la nuit",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `${CONTENTIONS_INITIALES} début octobre`,
    },
    {
      cle: "cout",
      nom: "Coût des chutes à date",
      format: kE,
      sensBon: -1,
      aide: () => "mesures, surveillance, soins, fractures, plaintes",
    },
  ],
  contexte(l, decisions) {
    return {
      chutes: nombre(l.chutes ?? 0, 0),
      chutesNuit: nombre(l.chutesNuit ?? 0, 0),
      chutesCumul: nombre(l.chutesCumul ?? 0, 0),
      objectifADate: nombre(l.objectifADate ?? 0, 0),
      fractures: nombre(l.fractures ?? 0, 0),
      contentions: nombre(l.contentions ?? 0, 0),
      cout: kE(l.cout ?? 0),
      plainte: (l.plainte ?? 0) > 0,
      inspection: (l.inspection ?? 0) > 0,
      analyse: decisions[D.plan] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Chutes de la période", chutes(semaines.reduce((x, w) => x + w.chutes, 0))],
      ["Fractures de la période", fractures(semaines.reduce((x, w) => x + w.fractures, 0))],
      ["Coût de la période", kE(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Chutes par semaine",
    cle: "chutes",
    cible: OBJECTIF_CHUTES / SEMAINES,
    libelleCible: `repère : ${nombre(OBJECTIF_CHUTES / SEMAINES)} par semaine, ${OBJECTIF_CHUTES} sur le trimestre`,
    graduations: [2, 4, 6],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${chutes(s.chutes!)}, dont ${nombre(s.chutesNuit!, 0)} la nuit · ${fractures(s.fractures!)}`,
      `${residents(s.contentions!)} sous barrière · ${kE(s.cout!)} dans la semaine`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.traitements && (choix === 0 || choix === 2)) {
      // Le troisième médecin traitant accepte ou non la revue, selon le hasard du trimestre.
      return [
        {
          ...MURESAN,
          texte: medecinAccepte(graine) ? REPONSES.medecinAccepte : REPONSES.medecinRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const choixFamille = chemin[D.famille];
    if (choixFamille !== undefined && choixFamille !== 0 && de <= 5 && a >= 5) {
      lies.push({
        ...LAMBOLEY,
        heure: "sem. 5",
        alerte: arrive.plainte,
        texte: plainte(chemin, graine) ? REPONSES.filsPlainte : REPONSES.filsAccepte,
      });
    }
    for (const f of arrive.fractures) {
      lies.push({
        ...NAFISSATOU,
        heure: `sem. ${f.semaine}`,
        alerte: true,
        texte: texteFracture(f),
      });
    }
    if (arrive.inspection) {
      const t = simuler(chemin, graine);
      lies.push({
        de: "Délégation départementale de l'ARS",
        role: "Inspection",
        heure: `sem. ${t.inspection}`,
        alerte: true,
        texte: `Au vu des événements graves déclarés ce trimestre, l'ARS annonce une inspection de l'établissement : prévention des chutes, registre des contentions, prescriptions et réévaluations. ${residents(t.semaines[t.inspection]!.contentions)} sous barrière ce jour-là.`,
      });
    }
    if (chemin[D.contentions] === 2 && de <= 11 && a >= 11) {
      const t = simuler(chemin, graine);
      lies.push({
        de: "Sigismond Ravanel",
        role: "Directeur de l'EHPAD",
        heure: "sem. 11",
        texte: `${nombre(t.reclamations, 0)} familles, qu'on n'avait pas prévenues, ont déposé une réclamation après la levée des barrières.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    const semaine = (m: Message) => Number(m.heure?.replace("sem. ", "") ?? 0);
    lies.sort((x, y) => semaine(x) - semaine(y));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: coutDesChutes,
    formatObjectif: kE,
    noteDesBarres:
      "L'opposé du coût des chutes, risque laissé à janvier compris, sous les aléas que vous avez joués : plus la barre est longue (moins le trimestre a coûté), mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Chutes du trimestre",
          valeur: nombre(t.chutes, 0),
          aide: `repère ${OBJECTIF_CHUTES} ; ${nombre(CHUTES_ATTENDUES, 0)} attendues si rien ne changeait`,
          tenu: t.chutes <= OBJECTIF_CHUTES,
        },
        {
          nom: "Fractures",
          valeur: nombre(t.fractures, 0),
          aide: `${nombre(t.fracturesAttendues)} attendues au vu du risque ; ${FRACTURES_ETE} l'été`,
          tenu: t.fractures <= 1,
        },
        {
          nom: "Contentions de nuit",
          valeur: residents(t.contentionsFin),
          aide: `fin décembre ; ${CONTENTIONS_INITIALES} début octobre`,
          tenu: t.contentionsFin < CONTENTIONS_INITIALES,
        },
        {
          nom: "Inspection",
          valeur: t.inspection ? `semaine ${t.inspection}` : "aucune",
          aide: t.inspection
            ? `${kE(t.coutInspection)}, injonctions comprises`
            : "trois événements graves la déclenchent",
          tenu: !t.inspection,
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
          titre: "Les fractures",
          texte: `${fractures(t.fractures)} ce trimestre, pour ${nombre(t.fracturesAttendues)} attendues au vu du risque de chaque semaine${
            t.fracturesDetail.some((f) => f.barriere)
              ? ", dont au moins une par-dessus une barrière"
              : ""
          }.`,
        },
        {
          titre: "Les médecins traitants",
          texte: t.medecinAccepte
            ? "les trois acceptaient une revue des traitements en commission."
            : "le troisième, qui suit trois des neuf, refusait d'abord la revue en commission.",
        },
        {
          titre: "Le fils de Mme Lamboley",
          texte: t.plainte ? "a écrit à l'ARS en semaine 5." : "n'a pas écrit à l'ARS.",
        },
      ];
    },
  },
  comportements,
  axe,
};
