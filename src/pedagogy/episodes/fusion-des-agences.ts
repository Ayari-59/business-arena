/**
 * ÉPISODE 27 — LA FUSION DES AGENCES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Jérôme montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET_INTEGRATION,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_CLIENTS,
  PERTE_PAR_JOUR,
  PLAN_MARGE,
  doublonsDuPlan,
  evenements,
  hasard,
  raymondVexe,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/fusion-des-agences";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/fusion-des-agences";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des milliers d'euros au dixième : les doublons et la marge d'une semaine. */
const kE1 = (v: number) => `${v < 0 ? "−" : ""}${nombre(Math.abs(v) / 1000)} k€`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart au plan de rachat : positif, l'agence fait mieux que le plan. */
const ecartAuPlan = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du plan de rachat` : `${kE(-v)} sous le plan de rachat`;

const RAYMOND = { de: "Raymond Combelle", role: "Ancien dirigeant du négoce, conseiller" } as const;
const CHRISTOPHE = { de: "Gilbert Aubin", role: "Chef des ventes, Arvel Vienne" } as const;

/** Les vendeurs clés du négoce partis pendant le trimestre. */
const partis = (t: Trimestre) =>
  [
    t.sebastienPart ? "Sébastien" : null,
    t.joelPart ? "Pierrick" : null,
    t.naimaPart ? "Taous" : null,
  ].filter((x): x is string => x !== null);

const enumeration = (noms: readonly string[]) =>
  noms.length <= 1 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;
/** « Sébastien est parti », « Taous est partie », « Sébastien et Taous sont partis ». */
const sontPartis = (noms: readonly string[]) =>
  `${enumeration(noms)} ${noms.length > 1 ? "sont partis" : noms[0] === "Taous" ? "est partie" : "est parti"}`;

/** Ce que les décisions révèlent, dans l'ordre où un directeur d'agence les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient à qui les clients du négoce étaient attachés",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    personnes:
      "Votre diagnostic de la semaine 1 était juste : les clients du négoce suivaient leurs vendeurs, et c'est leur départ, nourri par l'incertitude et le choc des procédures, qui menaçait le rachat.",
    doublons:
      "En semaine 1, vous avez vu les doublons : un vrai coût, mais pas le principal risque. Un vendeur parti emportait chaque semaine plus de marge que tous les doublons réunis.",
    procedures:
      "En semaine 1, vous avez vu un négoce sans règles ; il avait les siennes, et ses clients y tenaient : le devis dans l'heure et la palette du matin.",
    prix: "En semaine 1, vous avez cru que les clients partiraient pour les prix ; les deux grilles étaient à 1 % près. Ils partaient avec leur vendeur, ou quand le service se dégradait.",
  };
  const justes = ["personnes", "doublons"];
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
    score: d === "personnes" ? 1 : d === "doublons" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const perdus = partis(t);
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux deux réflexes du rachat : ni tout aligner d'un coup sur Arvel, ni laisser vivre deux agences côte à côte. Vous avez tranché vite, et unifié par étapes."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions l'un des deux réflexes du rachat : aligner le négoce d'un coup sur Arvel, ou laisser deux agences vivre côte à côte. Le premier fait partir les gens et fuir les clients, le second laisse l'incertitude et les doublons courir.${
            perdus.length
              ? ` ${sontPartis(perdus)}, avec une partie de ${perdus.length > 1 ? "leurs" : "ses"} clients.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.clients * 100,
    "de clients du négoce conservés en semaine 3",
    "%",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const joel = p.chemin[D.comptoir] === 0;
  const raymond = p.chemin[D.raymond] === 0;
  const reactivite = p.chemin[D.reactivite] === 0 || p.chemin[D.reactivite] === 3;
  const pris = (joel ? 1 : 0) + (raymond ? 1 : 0) + (reactivite ? 1 : 0);
  const meilleur: Constat = {
    score: pris === 3 ? 1 : pris === 2 ? 0.6 : 0,
    texte: `${
      joel
        ? "Vous avez donné à Pierrick un rôle construit sur ce qu'il fait mieux que personne : connaître ses clients."
        : "Vous n'avez pas fait de place à ce que Pierrick savait faire : ses 140 artisans."
    } ${
      raymond
        ? "Vous avez fait de Raymond un pont vers ses clients plutôt qu'un patron parallèle."
        : "Raymond n'a pas servi de pont vers ses clients."
    } ${
      reactivite
        ? "Et vous avez pris au négoce sa réactivité au lieu de la lui retirer."
        : "Et la réactivité du négoce, qui faisait gagner des devis, n'a pas profité à l'agence."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, meilleur];
}

export function axe([information, diagnostic, reflexe, calibrage, meilleur]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder à qui parlent les clients",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le portefeuille du négoce et en déjeunant avec ses vendeurs : trois quarts de sa marge passaient par quatre personnes, qui ne savaient pas ce qu'elles allaient devenir.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni tout aligner, ni laisser deux agences",
      texte:
        "Aligner le négoce d'un coup sur Arvel fait partir les meilleurs et fuir leurs clients ; ne rien toucher laisse l'incertitude et les doublons courir. Décidez vite des rôles, puis unifiez par étapes.",
    };
  }
  if (meilleur!.score === 0) {
    return {
      titre: "Prendre le meilleur des deux cultures",
      texte:
        "Le négoce racheté sait des choses qu'Arvel ne sait pas : servir dans l'heure, connaître chaque artisan. Bâtissez les rôles sur ces forces et étendez-les à l'agence, au lieu de les effacer.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait la valeur du rachat",
      texte:
        "Avant de compter les doublons, demandez-vous ce que vous avez vraiment acheté : dans un négoce, ce sont des clients, et ils suivent des personnes.",
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
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_FUSION: Episode<Trimestre> = {
  code: "fusion-des-agences",
  numero: 29,
  domaine: "Intégration après un rachat",
  titre: "La fusion des agences",
  resume:
    "Un négoce familial racheté à trois rues de votre agence, deux équipes, deux cultures. Décider vite des rôles, garder les clients, prendre le meilleur des deux.",
  persona:
    "Vous êtes Jérôme Castaing, directeur de l'agence d'Arvel Distribution à Vienne, en Isère. Arvel vient de racheter les Établissements Combelle, le négoce familial installé à trois rues : vos dix-huit salariés et les quatorze du négoce doivent devenir une seule agence. Raymond Combelle, l'ancien patron, reste six mois comme conseiller.",
  mandat: [
    { fort: kE1(PLAN_MARGE), texte: "de marge combinée par semaine, au plan de rachat" },
    { fort: taux(OBJECTIF_CLIENTS, 0), texte: "des clients du négoce conservés, au moins" },
    { fort: "Semaine 10", texte: "plus aucun doublon : postes, logiciels, tournées" },
    { fort: kE(BUDGET_INTEGRATION), texte: "de budget d'intégration" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au plan de rachat : la marge combinée des deux agences, moins les coûts d'intégration et des doublons, en comptant ce que les clients gardés rapporteront le mois suivant.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le concurrent démarche les artisans du négoce pendant que vous cherchez.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...CHRISTOPHE,
        alerte: true,
        texte: `Pendant ce temps, le Comptoir Rhodanien a appelé les artisans du négoce un par un : des commandes de chantier sont parties chez lui, ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la part des clients du négoce qui commandent encore en semaine 3, en %",
    unite: "%",
    placeholder: "95",
    min: 0,
    max: 100,
    step: 0.5,
    reel: (t) => t.semaines[3]!.clients * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge combinée",
      format: kE1,
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "la semaine dernière"} ; plan : ${kE1(PLAN_MARGE)}`,
    },
    {
      cle: "clients",
      nom: "Clients du négoce conservés",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => `en part de sa marge au rachat ; objectif ${taux(OBJECTIF_CLIENTS, 0)}`,
    },
    {
      cle: "inquietude",
      nom: "Équipe du négoce inquiète",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: () => "baromètre RH : inquiets pour leur poste",
    },
    {
      cle: "doublons",
      nom: "Doublons",
      format: kE1,
      sensBon: -1,
      aide: (semaine) => `par semaine ; plan : ${kE1(doublonsDuPlan(Math.max(1, semaine)))}`,
    },
    {
      cle: "integration",
      nom: "Coûts d'intégration",
      format: kE1,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `engagés à date, sur ${kE(BUDGET_INTEGRATION)} de budget`
          : `${kE(BUDGET_INTEGRATION)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.integration ?? 0) / BUDGET_INTEGRATION),
              enRetard: (l.integration ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l) {
    return {
      marge: kE1(l.marge ?? 0),
      clients: taux(l.clients ?? 0, 0),
      inquietude: taux(l.inquietude ?? 0, 0),
      doublons: kE1(l.doublons ?? 0),
      sebastienLa: l.sebastien !== 0,
      joelLa: l.joel !== 0,
      naimaLa: l.naima !== 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ecart = semaines.reduce((x, w) => x + w.contribution - w.plan, 0);
    return [
      [`Marge, sem. ${a}`, kE1(t.semaines[a]!.marge)],
      [`Clients du négoce, sem. ${a}`, taux(t.semaines[a]!.clients, 0)],
      ["Écart au plan de la période", kE(ecart)],
    ];
  },
  courbe: {
    titre: "Marge combinée des deux agences, semaine par semaine",
    cle: "marge",
    cible: PLAN_MARGE,
    libelleCible: `plan de rachat : ${kE1(PLAN_MARGE)} par semaine`,
    graduations: [40000, 50000, 60000, 70000, 80000],
    format: (v) => `${nombre(v / 1000, 0)} k€`,
    details: (s) => [
      `Arvel ${kE1(s.margeArvel!)} · négoce ${kE1(s.margeNegoce!)}`,
      `clients du négoce ${taux(s.clients!, 0)} · doublons ${kE1(s.doublons!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.raymond && choix === 1) {
      // Seul le choix de l'écarter compte : Raymond le prend bien ou mal selon le hasard du trimestre.
      const vexe = raymondVexe([...NEUTRE.slice(0, D.raymond), 1], graine);
      return [{ ...RAYMOND, texte: vexe ? REPONSES.raymondVexe : REPONSES.raymondAccepte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.sebastienPart) {
      lies.push({
        de: "Sébastien Ponsard",
        role: "Commercial terrain, Combelle",
        heure: "sem. 6",
        alerte: true,
        texte: REPONSES.sebastienPart,
      });
    }
    if (arrive.raymondVexe) {
      lies.push({ ...CHRISTOPHE, heure: "sem. 7", alerte: true, texte: REPONSES.raymondDejeune });
    }
    if (arrive.joelPart) {
      lies.push({
        de: "Pierrick Daguerre",
        role: "Combelle",
        heure: "sem. 7",
        alerte: true,
        texte: chemin[D.comptoir] === 1 ? REPONSES.joelPartVendeur : REPONSES.joelPart,
      });
    }
    if (arrive.bascule) {
      const ratee = arrive.bascule === "ratee";
      lies.push({
        ...(ratee
          ? { de: "Ariane Ravier", role: "Cheffe de comptoir, Arvel Vienne" }
          : { de: "Yves Lagarde", role: "Chef de projet informatique, siège" }),
        heure: "sem. 9",
        alerte: ratee,
        texte: ratee ? REPONSES.basculeRatee : REPONSES.basculeReussie,
      });
    }
    if (arrive.naimaPart) {
      lies.push({
        de: "Taous Tahiri",
        role: "Vendeuse comptoir, Combelle",
        heure: "sem. 11",
        alerte: true,
        texte: REPONSES.naimaPart,
      });
    }
    if (arrive.repriseFautive) {
      lies.push({
        de: "Tiago Moreira",
        role: "Contrôleur de gestion régional",
        heure: "sem. 11",
        texte: REPONSES.repriseFautive,
      });
    }
    if (arrive.devisAPerte) {
      lies.push({ ...CHRISTOPHE, heure: "sem. 11", alerte: true, texte: REPONSES.devisAPerte });
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
    titre: (t) => `${ecartAuPlan(t.objectif)}, mois suivant compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au plan de rachat : marge combinée des deux agences, moins les coûts d'intégration et des doublons, mois suivant compris, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const perdus = partis(t);
      return [
        {
          nom: "Clients du négoce",
          valeur: taux(t.clientsFinal, 0),
          aide: `conservés en semaine 13 ; objectif ${taux(OBJECTIF_CLIENTS, 0)}`,
          tenu: t.clientsFinal >= OBJECTIF_CLIENTS,
        },
        {
          nom: "Vendeurs clés",
          valeur: `${3 - perdus.length} sur 3`,
          aide: perdus.length ? sontPartis(perdus) : "Sébastien, Taous et Pierrick sont restés",
          tenu: perdus.length === 0,
        },
        {
          nom: "Doublons",
          valeur: `${kE1(t.doublonsFinal)} / sem.`,
          aide: "en semaine 13 ; plan : aucun",
          tenu: t.doublonsFinal === 0,
        },
        {
          nom: "Coûts d'intégration",
          valeur: kE(t.integration),
          aide: `budget ${kE(BUDGET_INTEGRATION)}`,
          tenu: t.integration <= BUDGET_INTEGRATION,
        },
      ];
    },
    hasard(t, graine) {
      const equipe = [
        t.sebastienPart ? "Sébastien est parti en semaine 6 au Comptoir Rhodanien" : null,
        t.joelPart ? "Pierrick est parti en semaine 7" : null,
        t.naimaPart ? "Taous est partie en semaine 11" : null,
      ].filter(Boolean);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'équipe du négoce",
          texte: equipe.length
            ? `${equipe.join(", ")}, avec une partie de ${equipe.length > 1 ? "leurs" : "ses"} clients.`
            : "Sébastien, Taous et Pierrick sont restés jusqu'au bout du trimestre.",
        },
        ...(t.raymondVexe
          ? [
              {
                titre: "Raymond",
                texte:
                  "a mal pris d'être écarté, et l'a dit à ses anciens clients ; une partie est allée voir ailleurs.",
              },
            ]
          : []),
        ...(t.basculeRatee
          ? [
              {
                titre: "La bascule informatique",
                texte:
                  "a mal tourné : prix spéciaux mal repris, factures fausses, deux semaines de comptoir désorganisé.",
              },
            ]
          : []),
        ...(t.devisAPerte
          ? [
              {
                titre: "La délégation de devis",
                texte: "a laissé passer un gros devis chiffré à perte en semaine 11 : 24 k€.",
              },
            ]
          : []),
        ...(t.repriseFautive
          ? [
              {
                titre: "La reprise des données",
                texte: "a laissé passer quelques prix faux malgré la vérification : 2 k€ d'avoirs.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
