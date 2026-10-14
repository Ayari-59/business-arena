/**
 * ÉPISODE 82 — L'INTÉRIM QUI FLAMBE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord des remplacements de Cassien
 * montre, ce que la courbe trace, ce sur quoi le bilan le juge, et ce que ses
 * décisions révèlent de lui.
 */
import {
  CABINET,
  D,
  DEBUT_CDD,
  DEBUT_CDI,
  ENVELOPPE,
  EPIDEMIES,
  INTERIM_DEPART,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  REGULIERS,
  REMISE_SORALIS,
  HEURES_AN,
  INTERIM_HEURE,
  SALAIRE_HEURE,
  SURCOUT_ANNUEL_IDE,
  SEMAINES,
  SERVICE,
  SERVICE_EXCLUSIVITE,
  SERVICE_PIC,
  VACANTS_DEPART,
  demissions,
  evenements,
  hasard,
  remiseSoralis,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/interim-qui-flambe";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  nomEpidemie,
} from "@/config/episodes/interim-qui-flambe";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Pour commencer une phrase : « Trois des cinq remplaçants ». */
const EN_LETTRES = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq"] as const;
const postes = (v: number) => `${nombre(v, 0)} postes`;
/** Un écart à l'enveloppe du CPOM : positif, l'association tient sa trajectoire. */
const ecartALEnveloppe = (t: Trimestre) =>
  t.objectif >= 0
    ? `${kE(t.annee)} de surcoût estimé sur l'année, ${kE(t.objectif)} sous l'enveloppe du CPOM`
    : `${kE(t.annee)} de surcoût estimé sur l'année, ${kE(-t.objectif)} au-delà de l'enveloppe du CPOM`;
/** L'intérim du premier trimestre de l'an dernier, et la trajectoire du CPOM : un quart de moins. */
export const INTERIM_TRIMESTRE_PASSE = INTERIM_DEPART * SEMAINES;
export const TRAJECTOIRE_INTERIM = 0.75;
/** Le repère des postes non pourvus : trois par semaine au plus, sur le trimestre. */
export const PLAFOND_NON_POURVUS = 3 * SEMAINES;

const FADILA = {
  de: "Fadila Benmansour",
  role: "Responsable de la paie et des plannings, siège",
} as const;
const ILINCA = {
  de: "Ilinca Gautheron",
  role: "Responsable de l'agence Soralis Intérim Santé de Dijon",
} as const;
const IOANA = {
  de: "Dr Ioana Mureșan",
  role: "Médecin coordonnateur, EHPAD de Chalon-sur-Saône",
} as const;
const SIGISMOND = {
  de: "Sigismond Ravanel",
  role: "Directeur de l'EHPAD de Chalon-sur-Saône",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où un DRH les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les recours par motif, le contrat de Soralis et le coût d'un salarié",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    symptome:
      "Votre diagnostic de la semaine 1 était juste : l'intérim remplaçait trois choses différentes, des postes vacants, des absences imprévues et des congés planifiés trop tard, et chacune avait sa réponse.",
    vacances:
      "En semaine 1, vous avez vu les postes d'infirmier vacants : une vraie cause, la plus chère par poste, mais pas la seule. Un tiers de l'intérim d'infirmier et plus de la moitié de celui d'aide-soignant remplaçaient des absences imprévues, que rien d'interne ne couvrait.",
    tarif:
      "En semaine 1, vous avez retenu le tarif de Soralis ; il était dans la moyenne du marché. Ce qui coûtait, c'était le nombre de postes commandés, et ce qui les faisait commander.",
    facilite:
      "En semaine 1, vous avez retenu la facilité des établissements à appeler l'agence ; ils l'appelaient faute d'autre solution : ni pool, ni bourse de remplacement, ni plannings connus à temps.",
  };
  const justes = ["symptome", "vacances"];
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
    score: d === "symptome" ? 1 : d === "vacances" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la facture en plafonnant l'intérim ou en négociant le tarif : vous avez traité ce qui faisait appeler l'agence."
        : `Sous la pression de la facture, vous avez ${n} fois sur ${ETAPES.length} décisions plafonné l'intérim ou négocié le tarif : note de la direction générale, exclusivité, consignes du pic, contrat-cadre. Un plafond ne supprime pas l'absence, il laisse le poste vide ; une remise se paie en intérimaires qui ne connaissent pas les résidents, ou en volume minimal.${
            t.ei > 0
              ? ` ${t.ei > 1 ? `${t.ei} événements indésirables graves ont été déclarés` : "Un événement indésirable grave a été déclaré"} pendant le trimestre.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.surcoutAnnuelIde,
    "de surcoût annuel pour un poste d'infirmier tenu en intérim",
    "k€",
    { juste: 2, proche: 6 },
    (e) => `${nombre(e)} k€`,
  );

  // Une réponse par cause : les congés, les absences, les postes vacants, l'été.
  const bourse = p.chemin[D.premiere] === 2;
  const pool = p.chemin[D.pool] === 1 || p.chemin[D.pool] === 3;
  const vacants = p.chemin[D.vacants] === 0 || p.chemin[D.vacants] === 3;
  const ete = p.chemin[D.ete] === 0;
  const bons = [bourse, pool, vacants, ete].filter(Boolean).length;
  const causes: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      bourse
        ? "Vous avez publié les plannings tôt et proposé les remplacements en interne d'abord."
        : "Les plannings sont restés à quinze jours : les congés partaient à l'intérim faute de temps."
    } ${
      pool
        ? "Vous avez dimensionné le pool sur le socle des absences, là où il est plein toute l'année."
        : p.chemin[D.pool] === 2
          ? "Votre pool était dimensionné sur le pic : à moitié vide d'avril à décembre, il coûtait plus qu'il n'évitait."
          : "Les absences imprévues sont restées sans remplaçant interne."
    } ${
      vacants
        ? `Vous avez proposé un contrat aux remplaçants réguliers : ${t.reguliers} sur ${REGULIERS} ont accepté.`
        : "Les postes vacants sont restés tenus en intérim, au double du prix d'un salarié."
    } ${
      ete
        ? "L'été est préparé : congés arrêtés et CDD signés en avril."
        : "L'été n'est pas préparé autrement que l'an dernier."
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
      titre: "Lire les recours par motif avant de toucher à la facture",
      texte:
        "Rejouez l'épisode en analysant d'abord les recours de l'an dernier : plus de la moitié de l'intérim d'infirmier tenait des postes vacants, un tiers remplaçait des absences imprévues, le reste des congés posés trop tard. Trois causes, trois réponses.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter les causes plutôt que plafonner la dépense",
      texte:
        "Une note qui plafonne l'intérim laisse des postes vides : glissement de tâches, événements indésirables, soignants rappelés sur leurs repos, puis démissions. Une remise se paie en intérimaires inconnus ou en volume minimal. Ce qui fait baisser la facture, c'est d'avoir moins besoin de l'agence.",
    };
  }
  if (causes!.score === 0) {
    return {
      titre: "Donner à chaque cause sa réponse",
      texte:
        "Un poste vacant se pourvoit, et les remplaçants réguliers sont les premiers candidats ; une absence imprévue se couvre par un pool dimensionné sur le socle ; des congés se planifient assez tôt pour être remplacés en interne.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que l'intérim remplace",
      texte:
        "Avant de juger un prix ou un comportement, demandez pourquoi chaque poste est commandé. Le même euro d'intérim ne se supprime pas de la même façon selon qu'il tient un poste vide depuis six mois ou une absence d'un samedi.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du surcoût",
      texte: `${euros(INTERIM_HEURE.ide)} de l'heure facturés contre ${euros(SALAIRE_HEURE.ide)} chargés, sur ${nombre(HEURES_AN, 0)} heures : un poste d'infirmier tenu toute l'année en intérim coûte ${kE(SURCOUT_ANNUEL_IDE)} de plus qu'un salarié. C'est le chiffre qui dit ce que vaut un CDI signé par un remplaçant régulier.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_INTERIM: Episode<Trimestre> = {
  code: "interim-qui-flambe",
  numero: 82,
  domaine: "Maîtriser les remplacements",
  titre: "L'intérim qui flambe",
  resume:
    "1,9 M€ d'intérim, 60 % de plus en un an, et une note qui voudrait le plafonner. Traiter ce que l'intérim remplace plutôt que sa facture.",
  persona:
    "Vous êtes Cassien Calvayrac, directeur des ressources humaines de l'Association Solvanne, à Dijon : six EHPAD, une clinique de soins médicaux et de réadaptation, un pôle domicile et un pôle handicap, 1 150 salariés. L'intérim se concentre sur les infirmiers et les week-ends de trois EHPAD : Chalon-sur-Saône, Beaune et Dijon-Grésilles, 250 places. Le trimestre va de janvier à mars, en pleine saison des épidémies.",
  mandat: [
    { fort: kE(ENVELOPPE), texte: "de surcoût de remplacement sur l'année, au plus (CPOM)" },
    {
      fort: `−${taux(1 - TRAJECTOIRE_INTERIM, 0)}`,
      texte: "d'intérim au premier trimestre, par rapport à l'an dernier",
    },
    { fort: "aucun poste", texte: "laissé vide au détriment de la sécurité des résidents" },
    { fort: `${VACANTS_DEPART.ide} postes`, texte: "d'infirmier vacants à pourvoir" },
  ],
  jugement:
    "La direction générale juge le trimestre sur l'année qu'il prépare : le surcoût de remplacement du trimestre (intérim, CDD, heures majorées et pool, moins les salaires que les postes vacants ne versent pas), plus celui qu'on peut estimer d'avril à décembre avec ce qui est en place, plus le coût des événements indésirables graves et des départs, comparé à l'enveloppe du CPOM.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos remplacements",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les établissements commandent un week-end de plus à Soralis sans que rien ne change.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Eudoxie Rambourg",
        role: "Directrice administrative et financière",
        alerte: true,
        texte: `Pendant ce temps, un week-end de plus commandé à Soralis sans pilotage : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le surcoût annuel d'un poste d'infirmier tenu toute l'année en intérim plutôt que par un salarié, en k€",
    unite: "k€",
    placeholder: "30",
    min: 0,
    max: 200,
    step: 0.1,
    reel: (t) => t.surcoutAnnuelIde,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "surcoutCumule",
      nom: "Surcoût de remplacement",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `depuis janvier ; enveloppe à date : ${kE(l.budgetADate ?? 0)}`
          : `enveloppe du CPOM : ${kE(ENVELOPPE)} sur l'année`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.surcoutCumule ?? 0) / (ENVELOPPE / 4))),
              enRetard: (l.surcoutCumule ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "interim",
      nom: "Intérim de la semaine",
      format: kE,
      sensBon: -1,
      aide: () => `facturé par Soralis ; l'an dernier : ${kE(INTERIM_DEPART)} par semaine`,
    },
    {
      cle: "nonPourvus",
      nom: "Postes non pourvus",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `postes de 12 heures sans remplaçant, en semaine ${semaine}`
          : "postes de 12 heures sans remplaçant, par semaine l'an dernier",
    },
    {
      cle: "absences",
      nom: "Absences imprévues",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "postes de 12 heures à remplacer dans la semaine, infirmiers et aides-soignants",
    },
    {
      cle: "vacantsIde",
      nom: "Postes d'infirmier vacants",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "dans les trois EHPAD, tenus en intérim",
    },
  ],
  contexte(l, decisions) {
    const amplitude = l.epidemie ?? EPIDEMIES.moyenne.amplitude;
    const exclusivite = decisions[D.premiere] === 1;
    const servicePic =
      SERVICE -
      SERVICE_PIC * amplitude -
      (exclusivite ? SERVICE_EXCLUSIVITE.base + SERVICE_EXCLUSIVITE.pic * amplitude : 0);
    const avecPool = decisions[D.pool] !== undefined && decisions[D.pool] !== 0;
    return {
      surcout: kE(l.surcoutCumule ?? 0),
      interim: kE(l.interim ?? 0),
      nonPourvus: nombre(l.nonPourvus ?? 0, 0),
      absences: nombre(l.absences ?? 0, 0),
      vacantsIde: nombre(l.vacantsIde ?? 0, 0),
      epidemie: nomEpidemie(amplitude),
      servicePic: taux(servicePic, 0),
      poolUtilisation: taux(l.poolUtilisation ?? 0, 0),
      projection: kE(l.projectionInterim ?? 0),
      avecPool,
      note: decisions[D.premiere] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const surcout = semaines.reduce((x, w) => x + w.surcout, 0);
    const vides = semaines.reduce((x, w) => x + w.nonPourvus, 0);
    return [
      ["Surcoût de la période", kE(surcout)],
      [`Intérim, sem. ${a}`, kE(t.semaines[a]!.interim)],
      ["Postes non pourvus", nombre(vides, 0)],
    ];
  },
  courbe: {
    titre: "Surcoût de remplacement, semaine par semaine",
    cle: "surcout",
    cible: ENVELOPPE / 52,
    libelleCible: `enveloppe du CPOM : ${kE(ENVELOPPE / 52)} par semaine`,
    graduations: [10000, 20000, 30000, 40000, 50000],
    format: kE,
    details: (s) => [
      `surcoût ${kE(s.surcout!)} · intérim ${kE(s.interim!)}`,
      `${postes(s.absences!)} d'absence · ${nombre(s.nonPourvus!, 0)} non pourvus`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.premiere && choix === 1) {
      // Soralis accorde −8 % ou −5 %, selon le hasard du trimestre.
      const forte = remiseSoralis(graine) === REMISE_SORALIS.forte;
      return [{ ...ILINCA, texte: forte ? REPONSES.remiseForte : REPONSES.remiseFaible }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.premiere] === 1 && dans(3)) {
      lies.push({ ...SIGISMOND, heure: "sem. 3", alerte: true, texte: REPONSES.reguliersPerdus });
    }
    const v = chemin[D.vacants];
    if ((v === 0 || v === 3) && dans(5)) {
      const n = t.reguliers;
      const contrat = v === 0 ? "le CDI" : "le CDD de huit mois";
      lies.push({
        ...FADILA,
        heure: "sem. 5",
        texte:
          n === 0
            ? `Aucun des remplaçants réguliers n'a accepté ${contrat}. Ils préfèrent garder leur liberté.`
            : `${EN_LETTRES[n]} des ${EN_LETTRES[REGULIERS].toLowerCase()} remplaçants réguliers ${n > 1 ? "ont" : "a"} accepté ${contrat}. ${n > 1 ? "Ils prennent" : "Il prend"} ${n > 1 ? "leur" : "son"} poste en semaine ${v === 0 ? DEBUT_CDI : DEBUT_CDD}.`,
      });
    }
    if (v === 1 && dans(CABINET.arrivee)) {
      lies.push({
        ...FADILA,
        heure: `sem. ${CABINET.arrivee}`,
        texte:
          t.recrues === 0
            ? "Le cabinet n'a trouvé personne. Les deux postes restent en intérim."
            : `Le cabinet a trouvé ${t.recrues === 1 ? "une infirmière" : "deux infirmiers"} : arrivée lundi.`,
      });
    }
    for (const w of arrive.ei) {
      lies.push({
        ...IOANA,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Un événement indésirable grave cette semaine : une résidente a chuté la nuit, alors que l'équipe était incomplète, et a été hospitalisée. Il est déclaré à l'ARS, la famille demande à être reçue, et l'analyse des causes commence lundi.",
      });
    }
    for (const dem of demissions(chemin, graine)) {
      if (!dans(dem.semaine)) continue;
      if (!dem.ide && !dem.as) continue;
      const deux = dem.ide && dem.as;
      const qui = deux
        ? "Une infirmière et une aide-soignante de Chalon ont remis leur démission"
        : dem.ide
          ? "Une infirmière de Chalon a remis sa démission"
          : "Une aide-soignante de Chalon a remis sa démission";
      lies.push({
        ...FADILA,
        heure: `sem. ${dem.semaine}`,
        alerte: true,
        texte: `${qui} : « On ne peut plus travailler comme ça. » ${deux ? "Les postes seront vacants" : "Le poste sera vacant"} dans deux semaines.`,
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
    titre: (t) => ecartALEnveloppe(t),
    formatObjectif: kE,
    noteDesBarres:
      "Écart à l'enveloppe de remplacement du CPOM sur l'année estimée : le surcoût du trimestre, celui d'avril à décembre avec ce qui est en place, les événements indésirables graves et les départs, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Intérim du trimestre",
          valeur: kE(t.interimTrimestre),
          aide: `l'an dernier au même trimestre : ${kE(INTERIM_TRIMESTRE_PASSE)} ; trajectoire : −${taux(1 - TRAJECTOIRE_INTERIM, 0)}`,
          tenu: t.interimTrimestre <= INTERIM_TRIMESTRE_PASSE * TRAJECTOIRE_INTERIM,
        },
        {
          nom: "Surcoût estimé sur l'année",
          valeur: kE(t.annee),
          aide: `enveloppe du CPOM : ${kE(ENVELOPPE)}`,
          tenu: t.annee <= ENVELOPPE,
        },
        {
          nom: "Postes non pourvus",
          valeur: nombre(t.nonPourvus, 0),
          aide: `postes de 12 heures sur le trimestre ; repère : ${PLAFOND_NON_POURVUS} au plus`,
          tenu: t.nonPourvus <= PLAFOND_NON_POURVUS,
        },
        {
          nom: "Événements indésirables graves",
          valeur: nombre(t.ei, 0),
          aide:
            t.departs.ide + t.departs.as > 0
              ? `et ${t.departs.ide + t.departs.as} démission${t.departs.ide + t.departs.as > 1 ? "s" : ""} de soignants épuisés`
              : "aucune démission de soignant épuisé",
          tenu: t.ei === 0 && t.departs.ide + t.departs.as === 0,
        },
      ];
    },
    hasard(t, graine) {
      const ep = EPIDEMIES[t.epidemie];
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'épidémie",
          texte: `a été ${ep.nom === "faible" ? "faible" : ep.nom === "forte" ? "forte" : "d'intensité moyenne"} cet hiver : une fois sur quatre elle est faible, une fois sur deux moyenne, une fois sur quatre forte.`,
        },
        ...(t.remise
          ? [
              {
                titre: "Soralis Intérim Santé",
                texte: `a accordé ${taux(t.remise, 0)} de remise contre l'exclusivité ; une fois sur deux, c'est ${taux(REMISE_SORALIS.forte, 0)}.`,
              },
            ]
          : []),
        {
          titre: "Les équipes",
          texte: [
            t.ei === 0
              ? "Aucun événement indésirable grave"
              : `${t.ei} événement${t.ei > 1 ? "s" : ""} indésirable${t.ei > 1 ? "s" : ""} grave${t.ei > 1 ? "s" : ""}`,
            t.departs.ide + t.departs.as === 0
              ? "aucune démission"
              : `${t.departs.ide + t.departs.as} démission${t.departs.ide + t.departs.as > 1 ? "s" : ""} de soignants épuisés`,
            `${t.reguliers} remplaçant${t.reguliers > 1 ? "s" : ""} régulier${t.reguliers > 1 ? "s" : ""} sous contrat`,
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
