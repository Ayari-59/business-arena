/**
 * ÉPISODE 47 — LE PARI DU RÉEMPLOI, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Ysaline montre, ce que la
 * courbe trace, ce sur quoi le comité la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Une stratégie se joue sur des années, l'épisode sur un trimestre : le
 * tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, la VAN sur cinq ans des
 * positions prises, recalculée chaque semaine avec ce que le trimestre
 * révèle. Elle bouge quand on décide, et quand le trimestre parle : le taux
 * d'écoulement au premier bilan, Vercoran, la Métropole, le décret.
 */
import {
  ACCORD,
  BILAN,
  D,
  DEDIT,
  DEMOLISSEURS,
  DEUX_GRANDS,
  ECOULEMENT,
  FILIERE,
  JOURS_SANS_PERTE,
  LIGNE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PLATEFORME,
  PUBLICATION,
  REPRISE,
  SCENARIOS,
  SUBVENTION,
  TAUX,
  VERCORAN,
  VOLUME_ACCESSIBLE,
  VOLUME_DES_SIX,
  coutAccord,
  evenements,
  hasard,
  margeParTonne,
  offreCaduque,
  prixRemis,
  simuler,
  tableauDeBord,
  vanEquipement,
  type Trimestre,
} from "@/engine/episodes/pari-du-reemploi";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/pari-du-reemploi";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const n0 = (v: number) => nombre(Math.round(v), 0);
const pct = (v: number) => taux(v, 0);

const OCTAVIEN = { de: "Octavien Rouanet", role: "Directeur administratif et financier" } as const;
const TIDIANE = { de: "Tidiane Sarr", role: "Chef de projet réemploi" } as const;
const AUGUSTIN = { de: "Isidore Ferrari-Lebel", role: "Acheteur public, Métropole" } as const;
const SIXTINE = { de: "Mélisande Delabarre", role: "Directrice régionale, Orréa" } as const;
const AMEDEE = { de: "Amédée Pruvost", role: "Délégué régional, fédération du négoce" } as const;
const ANAELLE = {
  de: "Euphémie Ferrié",
  role: "Ingénieure, bureau d'études en diagnostic",
} as const;

/** Le gisement sous convention la première année, et celui qui reste acquis ensuite. */
function gisementsDe(decisions: readonly number[], vercoran: boolean) {
  const d2 = decisions[D.conventions];
  const an1 = d2 === 0 || d2 === 1 ? DEUX_GRANDS : d2 === 3 ? DEMOLISSEURS.sartel : 0;
  const durable = d2 === 1 ? (vercoran ? 0 : DEUX_GRANDS) : an1;
  return { an1, durable };
}

/**
 * LES CHIFFRES DE L'ÉQUIPEMENT, à des volumes donnés : ce que la source de
 * la semaine 11 montre, en espérance sur le décret (les flux d'agence
 * n'existent que s'il s'applique).
 */
export function chiffresDesEquipements(
  volumeSiDecret: number,
  volumeSansDecret: number,
  subvention: number,
) {
  const pOui = SCENARIOS.filter((s) => s.obligation).reduce((x, s) => x + s.chance, 0);
  const esperance = (f: (v: number) => number) =>
    pOui * f(volumeSiDecret) + (1 - pOui) * f(volumeSansDecret);
  return {
    ligne: esperance((v) => vanEquipement(LIGNE, v, { subvention })),
    plateforme: esperance((v) => vanEquipement(PLATEFORME, v, { subvention })),
    garder: esperance((v) => vanEquipement(PLATEFORME, v, { service: 0.5 })),
    reduire: esperance((v) => vanEquipement(LIGNE, v, { dedit: DEDIT.reduire })),
    annuler: -DEDIT.annuler,
  };
}

/** Ce que les décisions révèlent, dans l'ordre où une directrice les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de mesurer le gisement et de comprendre ce que Vercoran avait fait à Grenoble",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    gisements:
      "Votre diagnostic de la semaine 1 était juste : l'avantage tient aux gisements, rares et signés pour cinq ans ; l'équipement, lui, s'achète à tout moment.",
    premier:
      "En semaine 1, vous avez vu qu'il fallait entrer tôt : c'est vrai des gisements, pas de tout. Être premier sur une plateforme ou des comptoirs n'apporte rien qu'un suiveur ne puisse acheter.",
    capacite:
      "En semaine 1, vous avez cru que le marché irait à la capacité de tri : à Grenoble, la plateforme de Vercoran tourne à 55 % ; ce sont ses conventions qui lui ont donné le marché.",
    decret:
      "En semaine 1, vous avez préféré attendre que le décret soit sûr : l'équipement pouvait attendre, les gisements non. Ils se signent pour cinq ans, et une seule fois.",
  };
  const justes = ["gisements", "premier"];
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
    score: d === "gisements" ? 1 : d === "premier" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé ni à la mode ni à l'attente : ni plateforme achetée pour se montrer, ni offre au prix du plan, ni plan tenu contre les chiffres, ni démolisseurs laissés à Vercoran, ni flux cédés pour avoir la paix."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : acheter et annoncer pour être vu premier, chiffrer et dimensionner sur les hypothèses du plan, ou attendre que tout soit prouvé et laisser filer ce qui ne se signe qu'une fois.`,
  };

  const calibrage = constatCalibrage(
    p,
    VOLUME_ACCESSIBLE,
    "de matériaux réemployables accessibles chaque année dans la métropole",
    "t",
    { juste: 300, proche: 1000 },
    (e) => `${nombre(e, 0)} t`,
  );

  const [d1, d2, , , , d6] = p.chemin;
  const pris = d2 === 0;
  const enPartie = d2 === 3;
  const attendu = d1 !== 0 && d6 !== 0;
  const issue = t.vercoran
    ? `Vercoran est entré à Lyon : ${pct(t.chanceVercoran)} de chances, au vu de ce que vous lui laissiez.`
    : `Vercoran n'est pas venu cette fois : il avait ${pct(t.chanceVercoran)} de chances de le faire, au vu de ce que vous lui laissiez.`;
  let texte: string;
  if (pris && attendu) {
    texte = `Vous avez pris tôt ce qui ne se signe qu'une fois — les deux grands démolisseurs, pour cinq ans — et laissé l'équipement attendre les volumes. ${issue}`;
  } else if ((pris || enPartie) && !attendu) {
    texte = `Vous avez pris ${pris ? "les gisements" : "une partie des gisements"}, mais acheté la capacité avant les volumes : la plateforme se serait achetée aussi bien l'an prochain, subventionnée. ${issue}`;
  } else if (enPartie) {
    texte = `Vous n'avez signé que Sartel : Grollier restait libre, et avec lui la raison pour Vercoran de venir. ${issue}`;
  } else if (!attendu) {
    texte = `Vous avez acheté ce qui s'achète à tout moment, la capacité de tri, et laissé libre ce qui ne se signe qu'une fois, les démolisseurs. ${issue}`;
  } else {
    texte = `Vous avez attendu sur tout : l'équipement pouvait attendre, pas les gisements. ${issue}`;
  }
  const domaine: Constat = {
    score: pris && attendu ? 1 : pris || (enPartie && attendu) ? 0.6 : 0,
    texte,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer le gisement, et lire le concurrent",
      texte:
        "Rejouez l'épisode en commençant par l'étude de l'observatoire et par ce que Vercoran a fait à Grenoble : on ne sait pas ce qui est rare sans savoir combien il y en a, et qui le veut.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Distinguer ce qui se prend de ce qui s'achète",
      texte:
        "Devant une réglementation qui crée un marché, ni la mode ni l'attente : demandez-vous ce qui sera encore libre dans un an. Ce qui se signe une fois (gisements, références publiques) se prend tôt ; ce qui s'achète (équipements, comptoirs) se décide sur les chiffres.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Prendre tôt ce qui est rare",
      texte:
        "Un premier entrant n'a d'avantage que sur ce qu'un suiveur ne pourra pas acheter plus tard. Ici, ce sont les conventions de cinq ans avec les grands démolisseurs, et ce qu'elles dissuadent un concurrent de tenter.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher l'avantage qui dure",
      texte:
        "Être premier n'est pas une stratégie en soi : cherchez la ressource rare, qu'un concurrent ne pourra plus prendre une fois signée, et ne payez d'avance que pour elle.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire l'estimation du gisement",
      texte:
        "Enchaînez les filtres de l'étude, sans en sauter : les déchets du bâtiment, la part déposable, la part réemployable. Les six démolisseurs permettent de vérifier l'ordre de grandeur.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions : un décret repoussé ou un concurrent qui entre quand même. Si la valeur tient en moyenne, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

const DECRET: Record<string, string> = {
  durci: `Le décret paraît durci : reprise obligatoire au 1er juillet, et un objectif de réemploi chiffré dès la deuxième année, avec contribution libératoire.`,
  maintenu:
    "Le décret paraît tel quel : reprise obligatoire des déchets triés au 1er juillet, objectif de réemploi renvoyé à plus tard.",
  repousse:
    "Le décret est repoussé de deux ans : ni reprise obligatoire ni objectif avant l'été d'après.",
};

export const EPISODE_REEMPLOI: Episode<Trimestre> = {
  code: "pari-du-reemploi",
  numero: 47,
  domaine: "Premier entrant ou suiveur",
  titre: "Le pari du réemploi",
  resume:
    "Un décret qui crée un marché, un concurrent qui rôde, une plateforme qui se vend bien au salon. Prendre tôt ce qui est rare, et attendre pour ce qui s'achète.",
  persona:
    "Vous êtes Ysaline Okoye, directrice RSE et nouvelles activités d'Arvel Distribution : une trentaine d'agences en Auvergne-Rhône-Alpes, siège à Lyon. Un projet de décret oblige les négoces à reprendre les déchets triés de leurs clients et ouvre une activité : collecter, trier et revendre les matériaux de réemploi de la métropole. Le comité de direction attend votre position.",
  mandat: [
    {
      fort: `${n0(VOLUME_DES_SIX)} t`,
      texte: "de matériaux réemployables par an chez les six principaux démolisseurs",
    },
    { fort: "5 ans", texte: "la durée des conventions de gisement" },
    { fort: taux(TAUX, 0), texte: "le taux d'actualisation du groupe pour une activité nouvelle" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
  ],
  jugement:
    "Le comité juge le trimestre sur la valeur créée : le résultat du trimestre et la VAN sur cinq ans des positions prises, recalculées en semaine 13 avec le décret publié, la réaction de Vercoran et les taux mesurés, moins les sommes engagées et perdues.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre filière réemploi",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du comité se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...OCTAVIEN,
        alerte: true,
        texte: `Pour tenir le délai du comité, j'ai fait boucler ton dossier par un cabinet : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "le volume de matériaux réemployables accessible chaque année dans la métropole, en tonnes",
    unite: "t",
    placeholder: "5000",
    min: 0,
    max: 100000,
    step: 100,
    reel: () => VOLUME_ACCESSIBLE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "VAN sur cinq ans, avec ce que le trimestre a révélé, contribution attendue du décret comprise"
          : "rien n'est encore engagé",
    },
    {
      cle: "gisement",
      nom: "Gisements sous contrat",
      format: (v) => `${n0(v)} t/an`,
      sensBon: 1,
      aide: () => `les deux grands démolisseurs : ${n0(DEUX_GRANDS)} t sur ${n0(VOLUME_DES_SIX)}`,
      jauge: (l) => ({
        part: Math.min(1, (l.gisement ?? 0) / DEUX_GRANDS),
        enRetard: (l.concurrence ?? 0) > 0 && (l.gisement ?? 0) < DEUX_GRANDS,
      }),
    },
    {
      cle: "engage",
      nom: "Sommes engagées",
      format: kE,
      sensBon: -1,
      aide: () => "équipements, dédits, bennes, études, aménagements",
    },
    {
      cle: "ecoulement",
      nom: "Taux d'écoulement",
      format: (v) => pct(v),
      formatEcart: (v) => `${nombre(v * 100, 0)} pts`,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= BILAN ? "mesuré au premier bilan" : `hypothèse du plan, pas encore mesurée`,
    },
    {
      cle: "concurrence",
      nom: "Gisement pris par la concurrence",
      format: (v) => pct(v),
      formatEcart: (v) => `${nombre(v * 100, 0)} pts`,
      sensBon: -1,
      aide: () => `part des ${n0(VOLUME_DES_SIX)} t des six démolisseurs`,
    },
  ],
  contexte(l, decisions): Contexte {
    const vercoran = l.vercoran === 1;
    const g = gisementsDe(decisions, vercoran);
    const ecoulement = l.ecoulement ?? ECOULEMENT.plan;
    const d5 = decisions[D.orrea];
    const garde = d5 === 1 || d5 === 2;
    const volumeSiDecret = g.durable + (garde ? REPRISE.reemployables : 0);
    const subvention = l.subvention ?? SUBVENTION;
    const c = chiffresDesEquipements(volumeSiDecret, g.durable, subvention);
    const margeAgence = margeParTonne(ecoulement, {
      prixGaranti: 0,
      collecte: FILIERE.collecteAgence,
    });
    return {
      plateforme: decisions[D.posture] === 0,
      attente: decisions[D.posture] === 2,
      aDesConventions: decisions[D.conventions] === 0 || decisions[D.conventions] === 3,
      aDesGisements: g.an1 > 0,
      ecoulement: pct(ecoulement),
      volumeAccord: l.volumeAccord ?? ACCORD.volume,
      volumeFiliere: n0(
        decisions.length > D.orrea ? volumeSiDecret : g.an1 + REPRISE.reemployables,
      ),
      volumeSansDecret: n0(g.durable),
      volumes:
        volumeSiDecret === g.durable
          ? `à ${n0(g.durable)} t par an`
          : `à ${n0(volumeSiDecret)} t par an si l'obligation s'applique et ${n0(g.durable)} t si le décret est repoussé`,
      vendables: n0(ecoulement * (g.an1 + REPRISE.reemployables)),
      margeAgence: n0(margeAgence),
      valeurAgence: kE(margeAgence * REPRISE.reemployables),
      subvention: pct(subvention),
      vanLigne: kES(c.ligne),
      vanPlateforme: kES(c.plateforme),
      vanGarder: kES(c.garder),
      vanReduire: kES(c.reduire),
      vanAnnuler: kES(c.annuler),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Gisements sous contrat, sem. ${a}`, `${n0(s.gisement)} t/an`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [100000, 200000, 300000, 400000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `gisements ${n0(s.gisement!)} t/an · écoulement ${pct(s.ecoulement!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.accord && choix === 1) {
      // La caractérisation mesure le taux de réemploi des bâtiments : l'offre suit la mesure.
      const h = hasard(graine);
      return [
        { ...ANAELLE, texte: REPONSES.caracterisation(h.reemploi, prixRemis(1, h.reemploi)!) },
        { ...AUGUSTIN, texte: REPONSES.offreRecue },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.vercoran) {
      const d2 = chemin[D.conventions];
      const moyens = DEMOLISSEURS.moyens * DEMOLISSEURS.parMoyen;
      let texte: string;
      if (t.vercoran) {
        texte =
          d2 === 0
            ? `Vercoran est entré à Lyon : il a signé les quatre démolisseurs moyens, ${n0(moyens)} t par an pour cinq ans. Sartel et Grollier sont à nous.`
            : d2 === 3
              ? `Vercoran est entré à Lyon : il a signé Grollier et les quatre démolisseurs moyens, ${n0(moyens + DEMOLISSEURS.grollier)} t par an pour cinq ans.`
              : d2 === 1
                ? "Vercoran est entré à Lyon : il a signé les quatre démolisseurs moyens, et Sartel et Grollier à la fin de notre essai. À partir de l'an prochain, ils sont à lui pour cinq ans."
                : `Vercoran est entré à Lyon : il a signé les six démolisseurs, ${n0(VOLUME_DES_SIX)} t par an pour cinq ans.`;
      } else {
        texte =
          d2 === 0
            ? "Vercoran a renoncé à Lyon pour cette année : sans les deux grands, le voyage ne paie pas."
            : "Vercoran n'a encore rien signé à Lyon. Les démolisseurs libres le sont toujours, pour l'instant.";
      }
      lies.push({ ...TIDIANE, heure: `sem. ${VERCORAN.semaine}`, alerte: t.vercoran, texte });
    }
    if (arrive.accord) {
      const concurrent = coutAccord(h.reemploi) + ACCORD.margeConcurrents;
      lies.push({
        ...AUGUSTIN,
        heure: `sem. ${ACCORD.attribution}`,
        alerte: !t.accord,
        texte: t.accord
          ? `La Métropole retient votre offre à ${n0(t.prixRemis!)} € la tonne. Notification après la publication du décret.`
          : `La Métropole a retenu une autre offre, à ${n0(concurrent)} € la tonne : des bâtiments à ${pct(h.reemploi)} de réemploi.`,
      });
    }
    if (arrive.decret && t.accord && !t.scenario.obligation) {
      lies.push({
        ...AUGUSTIN,
        heure: `sem. ${PUBLICATION}`,
        alerte: true,
        texte:
          "Le décret étant repoussé, la Métropole déclare l'accord-cadre sans suite. Votre offre ne sera pas notifiée.",
      });
    }
    if (arrive.orrea) {
      lies.push({
        ...SIXTINE,
        heure: `sem. ${PUBLICATION}`,
        alerte: offreCaduque(graine),
        texte: offreCaduque(graine)
          ? `La troisième place a été prise : notre offre est close. Ce sera le tarif standard, ${REPRISE.standard} € la tonne, flux réemployables compris.`
          : "La troisième place était encore libre : nous signons la reprise des déchets non réemployables, vous gardez les flux réemployables.",
      });
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.decret) {
      imprevus.push({
        ...AMEDEE,
        heure: `sem. ${PUBLICATION}`,
        texte: DECRET[t.scenario.id]!,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : le résultat du trimestre et la VAN sur cinq ans des positions prises, recalculés avec le décret publié, la réaction de Vercoran et les taux mesurés, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const eq = t.equipement;
      const aLaTaille = eq === null ? t.volume < LIGNE.capacite / 2 : eq.capacite <= 2 * t.volume;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Gisements",
          valeur: `${n0(t.conventions)} t par an`,
          aide: `sous convention à partir de l'an prochain ; les deux grands : ${n0(DEUX_GRANDS)} t`,
          tenu: t.conventions >= DEUX_GRANDS,
        },
        {
          nom: "Accord-cadre",
          valeur:
            t.accord === null
              ? "pas d'offre"
              : !t.accord
                ? "perdu"
                : t.scenario.obligation
                  ? `gagné à ${n0(t.prixRemis!)} €/t`
                  : "sans suite",
          aide:
            t.accord && t.scenario.obligation
              ? `coût réel : ${n0(coutAccord(t.reemploi))} €/t`
              : "la première référence publique",
          tenu: t.accord === true && t.scenario.obligation && t.prixRemis! > coutAccord(t.reemploi),
        },
        {
          nom: "Équipement de tri",
          valeur: eq ? `${n0(eq.capacite)} t` : "sous-traité",
          aide: `pour ${n0(t.volume)} t collectées par an`,
          tenu: aLaTaille,
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
        { titre: "Le décret", texte: DECRET[t.scenario.id]! },
        {
          titre: "Vercoran",
          texte: t.vercoran
            ? `est entré à Lyon en semaine 5. Au vu de vos choix, il avait ${pct(t.chanceVercoran)} de chances de le faire.`
            : `n'est pas venu à Lyon. Au vu de vos choix, il avait ${pct(t.chanceVercoran)} de chances de le faire.`,
        },
        {
          titre: "Les taux mesurés",
          texte: `${pct(t.ecoulement)} d'écoulement pour la filière, pour ${pct(ECOULEMENT.plan)} au plan ; ${pct(t.reemploi)} de réemploi sur les bâtiments de la Métropole.`,
        },
        {
          titre: "La Métropole",
          texte:
            t.accord === null
              ? `Vous n'avez pas répondu. À ${pct(t.reemploi)} de réemploi, la tonne coûtait ${n0(coutAccord(t.reemploi))} € nette.`
              : t.accord
                ? `a retenu votre offre à ${n0(t.prixRemis!)} € la tonne, pour un coût réel de ${n0(coutAccord(t.reemploi))} €${t.scenario.obligation ? "" : ", puis l'a déclarée sans suite, le décret repoussé"}.`
                : `a retenu un concurrent ; votre offre à ${n0(t.prixRemis!)} € avait ${pct(t.chanceAccord!)} de chances.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
