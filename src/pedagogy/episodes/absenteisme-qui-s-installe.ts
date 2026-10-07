/**
 * ÉPISODE 88 — L'ABSENTÉISME QUI S'INSTALLE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de l'EHPAD de Montbard montre, ce
 * que la courbe trace, ce sur quoi le bilan juge Valère, et ce que ses
 * décisions révèlent de lui.
 */
import {
  AIDE,
  BUDGET,
  D,
  DEPART,
  INCIDENT_ASH,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  POOL,
  RAPPELS_DEPART,
  RECHUTE,
  RECHUTE_SEMAINE,
  SEMAINES,
  TAUX_CIBLE,
  TAUX_DEPART,
  dureeDeRechute,
  evenements,
  hasard,
  poolComplet,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/absenteisme-qui-s-installe";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/absenteisme-qui-s-installe";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const journees = (v: number) => `${nombre(v)} j`;
/** Le repère des rappels sur repos du trimestre : moitié moins qu'au rythme de mars. */
export const PLAFOND_RAPPELS = Math.round((RAPPELS_DEPART * SEMAINES) / 2);
/** Un écart au budget de remplacement sur douze mois : positif, l'établissement reste dessous. */
const ecartAuBudget = (t: Trimestre) =>
  t.objectif >= 0
    ? `${kE(t.cout12Mois)} sur douze mois, ${kE(t.objectif)} sous le budget de remplacement`
    : `${kE(t.cout12Mois)} sur douze mois, ${kE(-t.objectif)} au-delà du budget de remplacement`;
const pourcent = (v: number) => `${Math.round(v * 100)} %`;

const PERVENCHE = { de: "Pervenche Jacquemard", role: "Responsable administrative et RH" } as const;
const ZOUBIDA = { de: "Zoubida Mérigot", role: "Infirmière coordinatrice (IDEC)" } as const;
/** Ceux qui se bloquent le dos pendant le trimestre, dans l'ordre où ça arrive. */
const BLESSES = [
  "Zeynep Aksoy s'est bloqué le dos en redressant une résidente dans son lit",
  "Hatice Perrenot s'est fait mal à l'épaule en relevant un résident assis au sol",
  "Lounès Hamadouche s'est bloqué le dos pendant un transfert du fauteuil au lit",
  "Coumba Tribolet a ressenti une douleur vive au dos en installant un résident pour la nuit",
  "Souad Mignardot s'est bloqué le dos en aidant une résidente à se lever",
] as const;

/** Ce que les décisions révèlent, dans l'ordre où un directeur d'établissement les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la décomposition des absences par motif et le coût des remplacements",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    causes:
      "Votre diagnostic de la semaine 1 était juste : les absences avaient deux moteurs qu'on pouvait traiter, les manutentions sans matériel pour le dos, et les rappels sur repos pour les arrêts courts.",
    dos: "En semaine 1, vous avez vu les dos abîmés par les manutentions : c'était 40 % des journées perdues. Mais quatre arrêts courts sur dix suivaient un rappel sur repos de la même personne : un second moteur, que le matériel ne touchait pas.",
    assiduite:
      "En semaine 1, vous avez retenu un défaut d'assiduité ; les arrêts courts suivaient les rappels sur repos, et les trois qui s'arrêtaient le plus étaient ceux qu'on rappelait le plus. Les lundis ne disaient rien de plus.",
    effectif:
      "En semaine 1, vous avez retenu un manque d'effectif ; 24 ETP pour 70 résidents, c'est l'ordinaire. Ce qui manquait, c'étaient les présents : 16 % des journées perdues, pour des causes qu'on pouvait traiter.",
  };
  const justes = ["causes", "dos"];
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
    score: d === "causes" ? 1 : d === "dos" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais traité l'absentéisme comme un défaut d'assiduité : ni prime, ni contre-visite. Vous avez cherché ce qui faisait les absences."
        : `Vous avez répondu ${n} fois par une prime d'assiduité ou une contre-visite. Elles touchaient à peine les arrêts courts, rien aux accidents, et pénalisaient ceux qui avaient mal au dos.${
            t.conceicaoPart ? " Conceição est partie en juin." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.coutAnnuelDepart,
    "de coût annuel des remplacements au rythme d'avant vos décisions",
    "k€",
    { juste: 10, proche: 30 },
    (e) => `${nombre(e)} k€`,
  );

  // Les causes traitées : le dos, les rappels, la reprise, les matins.
  const dos = p.chemin[D.causes] === 1;
  const rappels = p.chemin[D.planning] === 0 || p.chemin[D.rappels] === 1;
  const reprise = p.chemin[D.reprise] === 1 || p.chemin[D.reprise] === 2;
  const matin = p.chemin[D.matin] === 0;
  const traitees = [dos, rappels, reprise, matin].filter(Boolean).length;
  const causes: Constat = {
    score: traitees === 4 ? 1 : traitees >= 2 ? 0.6 : 0,
    texte: `${
      dos
        ? "Vous avez équipé les chambres les plus lourdes et formé l'équipe : le dos a été protégé à la source."
        : "Les transferts sont restés faits à bras, sans rail ni verticalisateur."
    } ${
      rappels
        ? "Vous avez desserré les rappels sur repos, qui fabriquaient les arrêts courts."
        : "Les rappels sur repos ont continué de tomber sur les mêmes, et de fabriquer des arrêts courts."
    } ${
      reprise && matin
        ? "La reprise de Fanta a été suivie, et les matins réorganisés autour des habitudes des résidents."
        : reprise
          ? "La reprise de Fanta a été suivie ; les matins, eux, ont gardé leurs transferts entassés."
          : matin
            ? "Les matins ont été réorganisés, mais Fanta a repris à plein poste."
            : "Ni la reprise de Fanta ni les matins n'ont été pensés pour le dos."
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
      titre: "Lire les absences par motif",
      texte:
        "Rejouez l'épisode en décomposant d'abord les absences par motif : 40 % pour le dos, 30 % d'arrêts courts dont quatre sur dix suivaient un rappel sur repos, 30 % de longues maladies. Un taux global ne dit pas quoi faire ; ses motifs, si.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter les causes plutôt que l'assiduité",
      texte:
        "Une prime d'assiduité ou des contre-visites supposent que l'équipe pourrait venir et ne vient pas. Ici, les dos se blessaient faute de matériel, et les arrêts courts suivaient les rappels sur repos. Payer la présence pénalise ceux qui se sont blessés en soignant.",
    };
  }
  if (causes!.score === 0) {
    return {
      titre: "Remonter de chaque motif à sa cause",
      texte:
        "Pour chaque motif, cherchez ce qui le déclenche : un transfert fait à bras, un rappel sur un repos, une reprise trop rapide, des matins où tout se concentre. C'est là qu'une mesure agit.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Découper le taux avant de le soigner",
      texte:
        "Les accidents du travail, les arrêts courts et les longues maladies n'ont ni les mêmes causes ni les mêmes remèdes. Un diagnostic qui n'en voit qu'un laisse l'autre moteur tourner.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du coût",
      texte:
        "16 % de 120 journées par semaine, sur 52 semaines : près de 1 000 journées par an. À 272,50 € la journée remplacée en moyenne (rappels, CDD, intérim), environ 272 k€ : c'est ce chiffre qui dit ce qu'une mesure peut coûter.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_ABSENTEISME: Episode<Trimestre> = {
  code: "absenteisme-qui-s-installe",
  numero: 88,
  domaine: "Comprendre et réduire l'absentéisme",
  titre: "L'absentéisme qui s'installe",
  resume:
    "Un EHPAD à 16 % d'absentéisme chez les aides-soignants, des rappels sur repos chaque semaine et deux accidents au dos. Lire les absences par motif et traiter leurs causes, plutôt que payer l'assiduité.",
  persona:
    "Vous êtes Valère Bellefontaine, directeur de l'EHPAD de Montbard, l'un des six EHPAD de l'Association Solvanne : 70 résidents, dont une unité protégée, et 24 ETP d'aides-soignants qui travaillent sur deux étages, de jour comme de nuit. Le trimestre va d'avril à juin.",
  mandat: [
    { fort: "12 %", texte: "d'absentéisme des aides-soignants, la cible du CPOM" },
    { fort: kE(BUDGET), texte: "de remplacements par an inscrits à l'EPRD" },
    { fort: "70 résidents", texte: "accompagnés sans rien céder sur la qualité des soins" },
    { fort: "des repos", texte: "qu'on ne touche plus chaque semaine" },
  ],
  jugement:
    "La directrice générale juge le trimestre sur le coût de l'absentéisme des aides-soignants sur douze mois, d'avril à mars : les remplacements (rappels sur repos, CDD, intérim, pool) et les mesures du trimestre, puis les trois trimestres suivants au rythme que vos mesures installent, comparés au budget de l'EPRD.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre établissement",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la semaine se recolle à coups de rappels sur repos et d'intérim.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...PERVENCHE,
        alerte: true,
        texte: `Pendant ce temps, le planning s'est recollé comme d'habitude : rappels sur repos et intérim de dernière minute, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût annuel des remplacements des absences d'aides-soignants, au rythme actuel, en k€",
    unite: "k€",
    placeholder: "200",
    min: 0,
    max: 1000,
    step: 1,
    reel: (t) => t.coutAnnuelDepart,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "taux",
      nom: "Absentéisme des aides-soignants",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine} ; cible du CPOM : ${taux(TAUX_CIBLE, 0)}`
          : `sur douze mois ; secteur : 10 à 14 %`,
    },
    {
      cle: "coutCumule",
      nom: "Remplacements et mesures",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `depuis avril ; budget à date : ${kE(l.budgetADate ?? 0)}`
          : `${kE(BUDGET)} de budget sur l'année`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.coutCumule ?? 0) / ((BUDGET * SEMAINES) / 52)),
              enRetard: (l.coutCumule ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "rappels",
      nom: "Rappels sur repos",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine} ; mars : ${nombre(RAPPELS_DEPART, 0)} par semaine`
          : "par semaine, en mars",
    },
    {
      cle: "courts",
      nom: "Arrêts courts",
      format: journees,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `journées perdues en semaine ${semaine}` : "journées par semaine, sur douze mois",
    },
    {
      cle: "dos",
      nom: "Arrêts pour le dos",
      format: journees,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `accidents du travail et TMS, journées perdues en semaine ${semaine}`
          : "accidents du travail et TMS, journées par semaine",
    },
  ],
  contexte(l, decisions) {
    const equipe = decisions[D.causes] === 1;
    const k = equipe ? 1 : 0;
    const n = l.arretsDos ?? 0;
    return {
      taux: taux(l.taux ?? TAUX_DEPART),
      cout: kE(l.coutCumule ?? 0),
      rappels: nombre(l.rappels ?? 0, 0),
      interim: nombre(l.interim ?? 0, 0),
      courts: journees(l.courts ?? 0),
      dos: journees(l.dos ?? 0),
      arretsDos:
        n === 0
          ? "aucun nouvel arrêt pour le dos dans l'équipe"
          : `${n} nouvel${n > 1 ? "s" : ""} arrêt${n > 1 ? "s" : ""} pour le dos dans l'équipe`,
      equipe,
      pool: decisions[D.planning] === 0,
      rechutePlein: pourcent(RECHUTE.plein[k]),
      rechuteAmenagee: pourcent(RECHUTE.amenagee[k]),
      rechuteTpt: pourcent(RECHUTE.tpt[k]),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    const rappels = semaines.reduce((x, w) => x + w.rappels, 0);
    return [
      [`Absentéisme, sem. ${a}`, taux(t.semaines[a]!.taux)],
      ["Coût de la période", kE(cout)],
      ["Rappels sur repos", nombre(rappels, 0)],
    ];
  },
  courbe: {
    titre: "Absentéisme des aides-soignants, semaine par semaine",
    cle: "taux",
    cible: TAUX_CIBLE,
    libelleCible: `cible du CPOM : ${taux(TAUX_CIBLE, 0)}`,
    graduations: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.taux!)} d'absences · ${journees(s.dos!)} pour le dos · ${journees(s.courts!)} d'arrêts courts`,
      `${nombre(s.rappels!, 0)} rappels sur repos · ${nombre(s.interim!, 0)} journées d'intérim`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.planning && choix === 0) {
      // Deux candidates en interne pour le pool, ou une seule : le hasard du trimestre.
      return [
        { ...PERVENCHE, texte: poolComplet(graine) ? REPONSES.poolComplet : REPONSES.poolUne },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.aide !== null) {
      lies.push({
        ...PERVENCHE,
        heure: `sem. ${AIDE.semaine}`,
        texte: arrive.aide ? REPONSES.aideAccordee : REPONSES.aideRefusee,
      });
    }
    for (const w of arrive.arretsDos) {
      const rang = t.arretsDos.indexOf(w);
      lies.push({
        ...ZOUBIDA,
        heure: `sem. ${w}`,
        alerte: true,
        texte: `${BLESSES[rang % BLESSES.length]} : arrêt de six semaines.${
          chemin[D.causes] === 1 && w >= 7
            ? " C'était dans une chambre que les rails ne couvrent pas."
            : ""
        }`,
      });
    }
    if (arrive.departAnnonce) {
      lies.push({
        de: "Conceição Figueira",
        role: "Aide-soignante",
        heure: `sem. ${DEPART.annonce}`,
        alerte: true,
        texte: chemin[D.rappels] === 0 ? REPONSES.departAnnonceControle : REPONSES.departAnnonce,
      });
    }
    if (arrive.poolRenfort) {
      lies.push({
        ...PERVENCHE,
        heure: `sem. ${POOL.renfort}`,
        texte: "La seconde aide-soignante du pool a pris son poste lundi. Le pool est au complet.",
      });
    }
    if (arrive.rechute) {
      lies.push({
        ...ZOUBIDA,
        heure: `sem. ${RECHUTE_SEMAINE}`,
        alerte: true,
        texte: `Fanta s'est de nouveau bloqué le dos : arrêt de ${dureeDeRechute(chemin)} semaines.`,
      });
    }
    if (arrive.incidentAsh) {
      lies.push({
        ...ZOUBIDA,
        heure: `sem. ${INCIDENT_ASH.semaine}`,
        alerte: true,
        texte:
          "Mme L., 91 ans, a glissé pendant un transfert fait par une ASH. Thilelli Bidaut l'a retenue et s'est fait mal au dos : arrêt de quatre semaines. La résidente n'a qu'un hématome, mais sa fille nous a écrit. J'ai déclaré l'événement indésirable et arrêté les transferts par les ASH.",
      });
    }
    if (arrive.departEffectif) {
      lies.push({
        ...PERVENCHE,
        heure: `sem. ${DEPART.dernier + 1}`,
        texte:
          "Conceição est partie vendredi. Son poste est tenu par Soralis Intérim Santé le temps de recruter.",
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
    titre: ecartAuBudget,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de remplacement sur douze mois, remplacements et mesures du trimestre compris, puis trois trimestres au rythme atteint, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût sur douze mois",
          valeur: kE(t.cout12Mois),
          aide: `budget de l'EPRD : ${kE(BUDGET)}`,
          tenu: t.cout12Mois <= BUDGET,
        },
        {
          nom: "Absentéisme fin juin",
          valeur: taux(t.tauxFinal),
          aide: `semaines 11 à 13 ; cible du CPOM ${taux(TAUX_CIBLE, 0)}`,
          tenu: t.tauxFinal <= TAUX_CIBLE,
        },
        {
          nom: "Rappels sur repos",
          valeur: nombre(t.rappelsTotal, 0),
          aide: `sur le trimestre ; repère : ${PLAFOND_RAPPELS} au plus, moitié moins qu'au rythme de mars`,
          tenu: t.rappelsTotal <= PLAFOND_RAPPELS,
        },
        {
          nom: "L'équipe",
          valeur: t.conceicaoPart
            ? "Conceição partie"
            : t.rechute
              ? "Fanta de nouveau arrêtée"
              : "au complet",
          aide: t.conceicaoPart
            ? "partie au centre hospitalier en juin"
            : t.rechute
              ? "rechute après sa reprise"
              : "pas de départ, pas de rechute",
          tenu: !t.conceicaoPart && !t.rechute,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.aideAccordee
          ? [
              {
                titre: "L'assurance maladie",
                texte: "a retenu votre dossier : 40 % du matériel pris en charge.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: [
            t.arretsDos.length === 0
              ? "Aucun nouvel arrêt pour le dos pendant le trimestre"
              : `${t.arretsDos.length} nouvel${t.arretsDos.length > 1 ? "s" : ""} arrêt${t.arretsDos.length > 1 ? "s" : ""} pour le dos pendant le trimestre`,
            t.rechute ? "Fanta a rechuté après sa reprise" : "Fanta a tenu sa reprise",
            t.conceicaoPart
              ? `Conceição est partie en juin (le risque qu'elle parte était de ${taux(t.risqueDepart, 0)})`
              : `Conceição est restée (le risque qu'elle parte était de ${taux(t.risqueDepart, 0)})`,
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
