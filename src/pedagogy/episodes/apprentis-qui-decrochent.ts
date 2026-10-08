/**
 * ÉPISODE 58 — LES APPRENTIS QUI DÉCROCHENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Garance montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Le trimestre se juge sur la contribution de la salle. Une rupture y est
 * comptée à son coût complet la semaine où elle tombe : c'est la façon la plus
 * honnête de mettre en regard le temps qu'on croyait gagner en faisant servir
 * un apprenti tout de suite, et ce que son départ coûte.
 */
import {
  APPRENTIS,
  BUDGET,
  COUT_RUPTURE,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  VENTES_ADD,
  cfaDecale,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/apprentis-qui-decrochent";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/apprentis-qui-decrochent";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Le coût d'une rupture, en k€ : ce que la prévision de la semaine 1 demande. */
export const COUT_RUPTURE_EN_KE = COUT_RUPTURE / 1000;

const majuscule = (x: string) => `${x.charAt(0).toUpperCase()}${x.slice(1)}`;

/** Un écart au budget : positif, la salle a fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

const LISANDRO = { de: "Lisandro Esquerré", role: "Chef de rang" } as const;
const KASSANDRA = {
  de: "Kassandra Oudin",
  role: "Chargée de l'alternance, ressources humaines",
} as const;
const NOELINE = {
  de: "Noéline Garrouste",
  role: "Formatrice référente, CFA des Deux Lacs",
} as const;

/** Ce que dit chaque apprenti qui rompt son contrat. */
const DEPARTS: Record<string, { role: string; texte: string }> = {
  bintou: {
    role: "Apprentie, BTS 2e année",
    texte:
      "Garance, j'arrête mon contrat ici. Je finirai mon BTS dans une maison où l'on m'apprend le métier avant de me lâcher seule.",
  },
  kelian: {
    role: "Apprenti, CAP 2e année",
    texte:
      "Je vais arrêter. Mon oncle me prend dans son garage. Ici, je fais le travail d'un serveur avec un salaire d'apprenti, et personne ne me montre rien.",
  },
  sanaa: {
    role: "Apprentie, CAP 2e année",
    texte:
      "Je ne reviendrai pas lundi. Je ne peux plus rentrer chez moi le soir, et je ne fais que débarrasser.",
  },
  nolhan: {
    role: "Apprenti, CAP 1re année",
    texte:
      "Je préfère arrêter. Tous les samedis, je me fais reprendre devant les clients. Je ne suis peut-être pas fait pour ça.",
  },
  iliana: {
    role: "Apprentie, BTS 1re année",
    texte:
      "Je romps mon contrat : un hôtel d'Annecy me prend en alternance, avec une tutrice qui a du temps pour moi.",
  },
};

/** Ce que les décisions révèlent, dans l'ordre où une directrice de salle les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient comment les apprentis décrochent",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    tutorat:
      "Votre diagnostic de la semaine 1 était juste : les apprentis apprenaient seuls, dans le coup de feu, sans tuteur qui en ait le temps, et c'est ce qui les faisait partir.",
    calendrier:
      "En semaine 1, vous avez vu le calendrier du CFA : une vraie cause de désordre, mais pas la principale. Les ruptures de l'an dernier venaient d'apprentis lâchés seuls au rang, que personne n'avait le temps de former.",
    motivation:
      "En semaine 1, vous avez retenu la motivation des jeunes ; ceux qui tiennent, ailleurs dans le groupe, ont surtout un tuteur et un parcours.",
    effectif:
      "En semaine 1, vous avez vu un manque de bras ; prendre davantage d'apprentis pour compenser les départs, c'est en former moins bien chacun, et en perdre davantage.",
  };
  const justes = ["tutorat", "calendrier"];
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
    score: d === "tutorat" ? 1 : d === "calendrier" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const parties = t.ruptures.filter((x) => !x.accord).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais employé vos apprentis comme main-d'œuvre d'appoint : ni seuls au rang avant d'en avoir le métier, ni retenus pendant leurs cours, ni remplacés par d'autres apprentis plutôt que formés."
        : `Vous avez employé ${n} fois vos apprentis comme main-d'œuvre d'appoint : au rang seuls dans le coup de feu, retenus pendant leurs cours, ou remplacés par d'autres plutôt que formés. Le temps gagné tout de suite revenait en erreurs de service, puis en départs${
            parties
              ? ` : ${parties} contrat${parties > 1 ? "s" : ""} rompu${parties > 1 ? "s" : ""} ce trimestre`
              : ""
          }.`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_RUPTURE_EN_KE,
    "de coût d'une rupture de contrat pour le restaurant",
    "k€",
    { juste: 0.3, proche: 0.8 },
    (e) => `${nombre(e)} k€`,
  );

  const tuteurs = p.chemin[D.rentree] === 0;
  const coupe = p.chemin[D.groupes] === 1;
  const lancesTropTot = [
    p.chemin[D.rentree] === 1,
    p.chemin[D.arret] === 2,
    p.chemin[D.recrues] === 0,
    p.chemin[D.sanaa] === 3,
  ].filter(Boolean).length;
  let score: number;
  let texte: string;
  if (!tuteurs) {
    score = 0;
    texte = `Personne n'a eu d'heures pour former les apprentis : Lisandro est resté tuteur en titre des cinq, entre deux tables. Ils ont appris seuls, lentement ; ${t.autonomes} sur ${APPRENTIS.length} tiennent un rang seuls à la fin novembre.`;
  } else if (lancesTropTot > 0 || coupe) {
    score = 0.6;
    texte = `Vous avez donné du temps aux tuteurs, mais ${
      lancesTropTot > 0
        ? "vous avez aussi lancé des apprentis seuls au rang avant qu'ils en aient le métier"
        : "vous avez laissé les apprentis seuls sur les tables de groupe"
    } : ce que le tutorat construisait, le coup de feu le défaisait. ${t.autonomes} sur ${APPRENTIS.length} tiennent un rang seuls à la fin novembre.`;
  } else {
    score = 1;
    texte = `Vous avez donné du temps aux tuteurs et un parcours à chaque apprenti, et vous ne les avez mis seuls au rang qu'une fois prêts, sur les services calmes : ${t.autonomes} sur ${APPRENTIS.length} tiennent un rang seuls à la fin novembre.`;
  }
  const former: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, former];
}

export function axe([information, diagnostic, reflexe, calibrage, former]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder comment les apprentis décrochent",
      texte:
        "Rejouez l'épisode en relisant d'abord les ruptures de l'an dernier et en passant un samedi soir à côté des apprentis : seuls au rang dans le coup de feu, sans personne pour les former, ils partaient.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Former avant de faire servir",
      texte:
        "Un apprenti mis au rang tout de suite donne des bras pour un mois et des erreurs pour un trimestre ; quand il rompt, il coûte six semaines d'extra et un recrutement. Donnez-lui un tuteur et un parcours avant de compter sur lui.",
    };
  }
  if (former!.score === 0) {
    return {
      titre: "Donner du temps aux tuteurs",
      texte:
        "Un tuteur en titre qui tient aussi son rang ne forme personne. Trois heures par semaine pendant la mise en place coûtent bien moins qu'une rupture.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait partir les apprentis",
      texte:
        "Quand des contrats se rompent, regardez comment les apprentis passent leurs services avant d'accuser leur motivation ou de chercher plus de bras.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer une rupture avant de la risquer",
      texte:
        "Six semaines d'extra à la place d'un apprenti, moins ce que l'apprenti aurait coûté, plus les frais du remplacement : faites le calcul avant de décider qu'un apprenti peut attendre.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_APPRENTIS: Episode<Trimestre> = {
  code: "apprentis-qui-decrochent",
  numero: 60,
  domaine: "Former en alternance",
  titre: "Les apprentis qui décrochent",
  resume:
    "Une salle de restaurant où les apprentis rompent leur contrat. Leur donner un tuteur et un parcours avant de compter sur eux.",
  persona:
    "Vous êtes Garance Royet, directrice de salle de La Table d'Augustin d'Aix-les-Bains, le restaurant de bistronomie du Groupe Escale : soixante-dix places et une terrasse, dix services par semaine. Votre salle compte huit personnes : Lisandro Esquerré et Zénobie Ballandras, chefs de rang, Melchior Guichard au bar, et cinq apprentis, dont deux arrivent ce lundi. Deux contrats d'apprentissage ont été rompus l'an dernier.",
  mandat: [
    { fort: kE(BUDGET), texte: "de contribution de la salle sur le trimestre" },
    { fort: "Aucune rupture", texte: "de contrat d'apprentissage, après deux l'an dernier" },
    { fort: "3 apprentis sur 5", texte: "autonomes au rang à la fin novembre" },
    { fort: "Septembre à novembre", texte: "la rentrée, l'arrière-saison, le creux de novembre" },
  ],
  jugement:
    "Le groupe juge le trimestre sur la contribution de la salle : la marge des couverts et des ventes additionnelles, moins la main-d'œuvre de la salle, plus les aides à l'apprentissage, moins ce que coûtent les ruptures et leurs remplacements.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre salle",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, vous n'êtes plus au passe : le samedi soir, la salle tourne sans vous.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...LISANDRO,
        alerte: true,
        texte: `Pendant que tu étais dans les dossiers, personne au passe samedi : des tables oubliées, des desserts offerts. ${euros(perdu)} de gestes et de couverts perdus.`,
      };
    },
  },
  prevision: {
    libelle: "le coût d'une rupture de contrat d'apprentissage pour le restaurant, en k€",
    unite: "k€",
    placeholder: "3",
    min: 0,
    max: 30,
    step: 0.1,
    reel: () => COUT_RUPTURE_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Contribution de la salle",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine ? `budget à date : ${kE(l.budgetADate ?? 0)}` : `${kE(BUDGET)} sur le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.max(0, Math.min(1, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "apprentis",
      nom: "Apprentis sous contrat",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `${nombre(l.ruptures ?? 0, 0)} rupture${(l.ruptures ?? 0) > 1 ? "s" : ""} depuis la rentrée`
          : "cinq à la rentrée",
    },
    {
      cle: "autonomie",
      nom: "Autonomie des apprentis",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "la part du métier de rang tenue seul, en moyenne",
    },
    {
      cle: "incidents",
      nom: "Erreurs de service",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine ? "dans la semaine ; une semaine normale : 2 ou 3" : "la semaine dernière",
    },
    {
      cle: "ventes",
      nom: "Ventes additionnelles",
      format: (v) => `${nombre(v)} €`,
      formatEcart: (v) => `${nombre(v, 2)} €`,
      sensBon: 1,
      aide: () => `par couvert ; un confirmé en fait ${euros(VENTES_ADD)}`,
    },
  ],
  contexte(l, decisions) {
    return {
      cumul: kE(l.cumul ?? 0),
      apprentis: nombre(l.apprentis ?? 0, 0),
      autonomie: taux(l.autonomie ?? 0, 0),
      autonomes: nombre(l.autonomes ?? 0, 0),
      incidents: nombre(l.incidents ?? 0, 0),
      ruptures: nombre(l.ruptures ?? 0, 0),
      tutore: decisions[D.rentree] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Contribution de la période", kE(semaines.reduce((x, w) => x + w.contribution, 0))],
      [`Apprentis sous contrat, sem. ${a}`, nombre(t.semaines[a]!.apprentis, 0)],
      [
        "Erreurs de service",
        nombre(
          semaines.reduce((x, w) => x + w.incidents, 0),
          0,
        ),
      ],
    ];
  },
  courbe: {
    titre: "Contribution de la salle, semaine par semaine",
    cle: "contribution",
    cible: BUDGET / 13,
    libelleCible: `cadence du budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [-8000, 0, 8000, 16000],
    format: kE,
    details: (s) => [
      `${nombre(s.couverts!, 0)} couverts · ${nombre(s.ventes!)} € de ventes additionnelles par couvert`,
      `${nombre(s.incidents!, 0)} erreurs de service${s.ruptures ? ` · rupture : ${kE(s.ruptures)}` : ""}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.calendrier && choix === 1) {
      // Seule la demande compte : le CFA répond selon le hasard du trimestre.
      const decale = cfaDecale([...NEUTRE.slice(0, D.calendrier), 1], graine);
      return [{ ...NOELINE, texte: decale ? REPONSES.cfaDecale : REPONSES.cfaRefuse }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.bintou !== null) {
      lies.push({
        ...LISANDRO,
        heure: "sem. 5",
        alerte: !arrive.bintou,
        texte: arrive.bintou ? REPONSES.bintouTient : REPONSES.bintouCraque,
      });
    }
    if (arrive.cfaAlerte) {
      lies.push({ ...NOELINE, heure: "sem. 7", alerte: true, texte: REPONSES.cfaAlerte });
    }
    for (const r of arrive.ruptures) {
      const depart = DEPARTS[r.id];
      lies.push(
        depart
          ? {
              de: r.nom,
              role: depart.role,
              heure: `sem. ${r.semaine}`,
              alerte: true,
              texte: depart.texte,
            }
          : {
              ...KASSANDRA,
              heure: `sem. ${r.semaine}`,
              alerte: true,
              texte: `${majuscule(r.nom)} a rompu son contrat cette semaine.`,
            },
      );
      lies.push({
        ...KASSANDRA,
        heure: `sem. ${r.semaine}`,
        texte: `Un extra tiendra le rang le temps de trouver un nouvel apprenti : six semaines, au moins. Coût de la rupture pour la salle : ${kE(COUT_RUPTURE)}.`,
      });
    }
    if (arrive.groupes !== null) {
      const rates = arrive.groupes;
      lies.push({
        de: "Ludger Rennard",
        role: "Escale Événements",
        heure: "sem. 13",
        alerte: rates > 0,
        texte:
          rates === 0
            ? "Les repas de fin d'année se sont bien passés : les entreprises veulent déjà réserver l'an prochain."
            : `${rates} soirée${rates > 1 ? "s" : ""} de groupe sur ${chemin[D.groupes] === 2 ? 4 : 6} ${rates > 1 ? "ont" : "a"} mal tourné : plats servis en décalé, tables oubliées. Les entreprises ont obtenu une remise de 20 %.`,
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
    titre: (t) => `${kE(t.objectif)} de contribution, ${ecartAuBudget(t.objectif - BUDGET)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Contribution de la salle sur le trimestre, ruptures et remplacements compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const ruptures = t.ruptures.length;
      return [
        {
          nom: "Contribution de la salle",
          valeur: kE(t.objectif),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Ruptures de contrat",
          valeur: nombre(ruptures, 0),
          aide: `${kE(t.coutRuptures)} au total ; deux l'an dernier`,
          tenu: ruptures === 0,
        },
        {
          nom: "Apprentis autonomes",
          valeur: `${t.autonomes} sur ${APPRENTIS.length}`,
          aide: `apprentis de la rentrée qui tiennent un rang seuls ; objectif 3`,
          tenu: t.autonomes >= 3,
        },
        {
          nom: "Erreurs de service",
          valeur: nombre(t.incidentsTotal / 13, 0),
          aide: "par semaine en moyenne ; une semaine normale : 2 ou 3",
          tenu: t.incidentsTotal / 13 <= 4,
        },
      ];
    },
    hasard(t, graine) {
      const parties = t.ruptures.filter((r) => !r.accord);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.cfaDecale
          ? [{ titre: "Le CFA", texte: "a accepté de décaler les sessions de CAP." }]
          : []),
        ...(t.bintouTient === null
          ? []
          : [
              {
                titre: "Bintou",
                texte: t.bintouTient
                  ? "a tenu le rang de Zénobie deux semaines."
                  : "a perdu pied son premier samedi comme cheffe de rang.",
              },
            ]),
        {
          titre: "Les apprentis",
          texte:
            parties.length === 0
              ? "Aucun n'a rompu son contrat au hasard du trimestre."
              : `${majuscule(
                  parties
                    .map((r) => `${r.nom} en semaine ${r.semaine}`)
                    .join(", ")
                    .replace(/, ([^,]*)$/, " et $1"),
                )} ${parties.length > 1 ? "ont rompu leur contrat" : "a rompu son contrat"}.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
