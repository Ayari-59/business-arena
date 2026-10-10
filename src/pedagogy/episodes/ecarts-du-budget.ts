/**
 * ÉPISODE 35 — LES ÉCARTS DU BUDGET, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Léna montre — l'écart au
 * budget flexible à côté de celui au budget statique, pour que l'effet de
 * volume se voie —, ce que la courbe trace, ce sur quoi le bilan la juge, et
 * ce que ses décisions révèlent d'elle.
 */
import {
  BUDGET_STATIQUE,
  COUT_PREETABLI,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEMAINES,
  STANDARD,
  VOLUME_BUDGET,
  cimenterieAccepte,
  defautPresse,
  evenements,
  hasard,
  interimExperimente,
  roulementUse,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/ecarts-du-budget";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/ecarts-du-budget";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart sur coût, réel − préétabli : positif, défavorable ; négatif, favorable. */
const ecart = (v: number) =>
  Math.abs(v) < 500 ? "0 k€" : `${kE(Math.abs(v))} ${v > 0 ? "défavorable" : "favorable"}`;
/** La version courte, pour le tableau de bord. */
const ecartCourt = (v: number) =>
  Math.abs(v) < 500 ? "0 k€" : `${kE(Math.abs(v))} ${v > 0 ? "défav." : "fav."}`;
const tonnes = (v: number) => `${nombre(v, 0)} t`;
const kgParTonne = (v: number) => `${nombre(v, 0)} kg/t`;
const parTonne = (v: number) => `${nombre(v, 0)} €/t`;
const pluriel = (n: number, mot: string) => `${nombre(n, 0)} ${mot}${n >= 2 ? "s" : ""}`;
/** L'objectif : positif, l'atelier a coûté moins que le coût préétabli de sa production. */
const ecartAuFlexible = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget flexible` : `${kE(-v)} au-delà du budget flexible`;
/** Le rebut moyen des quatre dernières semaines. */
const rebutFin = (t: Trimestre) => {
  const fin = t.semaines.slice(-4) as Semaine[];
  return (
    fin.reduce((s, w) => s + w.rebut * w.production, 0) / fin.reduce((s, w) => s + w.production, 0)
  );
};

const DJAMEL = { de: "Djamel Amrouche", role: "Chef d'équipe" } as const;
const RADOMIR = { de: "Radomir Petrovic", role: "Technicien, fabricant de la presse" } as const;
const YOLANDE = { de: "Yolande Perrichon", role: "Chargée de clientèle, cimenterie" } as const;
const AGENCE = { de: "Agence d'intérim", role: "Saint-Priest" } as const;
const ANATOLE = { de: "Anatole Brugère", role: "Chargé d'opérations, ZAC des Tuileries" } as const;

/** Ce que les décisions révèlent, dans l'ordre où une responsable d'atelier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui séparaient le volume, les prix et les quantités",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    presse:
      "Votre diagnostic de la semaine 1 était juste : la presse compactait mal, l'équipe compensait par du ciment, et les rebuts mangeaient les heures. L'écart était dans les quantités et le temps.",
    moules:
      "En semaine 1, vous avez vu les moules usés : une vraie cause, mais la plus petite. Les bordures mal compactées par la presse rebutaient deux fois et demie plus que les regards, et pesaient plus de la moitié du tonnage.",
    prix: "En semaine 1, vous avez retenu le prix du ciment : la hausse était réelle, mais l'écart sur prix ne pesait qu'un tiers de l'écart sur quantité de ciment, et rien à côté des heures perdues en rebuts.",
    depassement:
      "En semaine 1, vous avez retenu le dépassement global ; refait à la production réelle, le budget en absorbait le quart : l'atelier avait produit 40 t de plus que prévu.",
  };
  const justes = ["presse", "moules"];
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
    score: d === "presse" ? 1 : d === "moules" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais réagi à l'écart le plus visible : ni poursuivre le prix du ciment, ni accuser l'atelier d'un dépassement de volume, ni fabriquer un écart favorable."
        : `Devant un écart, vous avez choisi ${n} fois sur ${ETAPES.length} de réagir à celui qui se voyait : le prix du ciment, le dépassement au budget statique, le taux horaire, un écart favorable à afficher.${
            t.lotsRefuses
              ? ` Les clients ont refusé ${pluriel(t.lotsRefuses, "lot")} de bordures.`
              : t.perdu > 1
                ? ` ${tonnes(t.perdu)} de commandes sont parties chez des confrères, faute d'être livrées.`
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.ecartQuantiteCimentMois,
    "d'écart sur quantité de ciment le mois dernier",
    "k€",
    { juste: 0.05, proche: 0.5 },
    (e) => `${nombre(e)} k€`,
  );

  const presse = p.chemin[D.ecart] === 1 ? 1 : p.chemin[D.regleur] === 0 ? 0.5 : 0;
  const quantites =
    0.5 * presse + (p.chemin[D.ciment] !== 0 ? 0.25 : 0) + (p.chemin[D.revue] !== 0 ? 0.25 : 0);
  const e = t.ecarts;
  const domaine: Constat = {
    score: quantites,
    texte: `${
      presse === 1
        ? "Vous avez traité la cause dès la semaine 1 : la presse réglée, les rebuts sont retombés."
        : presse > 0
          ? "La presse n'a été réglée qu'en semaine 10, par le formateur du fabricant."
          : "La presse n'a jamais été réglée : le trimestre entier s'est joué à 42 Hz."
    } Sur le trimestre, écart sur prix du ciment : ${ecart(e.prixCiment)} ; sur quantité de ciment : ${ecart(e.quantiteCiment)} ; sur temps de main-d'œuvre : ${ecart(e.temps)} ; sur taux : ${ecart(e.taux)}. Le volume a ajouté ${kE(e.volume)} au budget, sans rien dire des coûts.`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Refaire le budget à la production réelle",
      texte:
        "Rejouez l'épisode en commençant par le budget flexible et la presse : le quart du dépassement tenait au volume, et le reste aux quantités et aux heures, pas au prix.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Décomposer avant de réagir",
      texte:
        "L'écart qui se voit — le prix, le total, le taux — n'est pas celui qui coûte. Refaites le budget à la production réelle, séparez prix et quantités, taux et temps, puis agissez sur le plus gros.",
    };
  }
  if (domaine!.score < 0.5) {
    return {
      titre: "Chercher la cause dans les quantités",
      texte:
        "Un écart sur quantité a toujours une cause technique : un réglage, un moule, un geste. Allez la voir à l'atelier ; un prix ou un dosage baissé ne la corrigent pas.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Remonter à la cause principale",
      texte:
        "Plusieurs causes expliquent souvent un même écart. Chiffrez la part de chacune — la presse, les moules, le prix — avant de choisir où mettre l'argent.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de l'écart",
      texte:
        "L'écart sur quantité se valorise au prix préétabli, et la quantité préétablie se calcule pour la production réelle : (178 − 0,150 × 1 040) × 150 €.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_ECARTS: Episode<Trimestre> = {
  code: "ecarts-du-budget",
  numero: 35,
  domaine: "Contrôle de gestion",
  titre: "Les écarts du budget",
  resume:
    "Un atelier béton qui dépasse son budget de 18 k€ en un mois. Décomposer l'écart avant de chercher un coupable : le volume, les prix, les quantités, les heures.",
  persona:
    "Vous êtes Léna Delmotte, responsable de l'atelier de préfabrication béton d'Arvel Distribution à Saint-Priest : des linteaux, des bordures et des regards, vendus aux artisans et aux collectivités par les agences du groupe. Votre équipe : dix opérateurs, un chef d'équipe, un régleur, et une vibro-presse.",
  mandat: [
    { fort: euros(COUT_PREETABLI), texte: "de coût préétabli par tonne bonne" },
    { fort: tonnes(VOLUME_BUDGET), texte: "de production budgétée par semaine" },
    { fort: "2 %", texte: "de rebuts prévus par la fiche de coût" },
    { fort: kE(BUDGET_STATIQUE), texte: "de budget de production pour le trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget flexible — le coût préétabli de ce que l'atelier a réellement produit —, en comptant les pénalités de retard, les commandes perdues et les lots refusés.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre atelier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'atelier continue de surdoser et de rebuter : des livraisons partent en retard.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...DJAMEL,
        alerte: true,
        texte: `Pendant que tu enquêtais, deux livraisons de bordures sont parties en retard : ${euros(perdu)} de pénalités.`,
      };
    },
  },
  prevision: {
    libelle: "l'écart sur quantité de ciment du mois dernier, en k€ (positif s'il est défavorable)",
    unite: "k€",
    placeholder: "0,0",
    min: -20,
    max: 40,
    step: 0.1,
    reel: (t) => t.ecartQuantiteCimentMois,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "ecartFlexible",
      nom: "Écart au budget flexible",
      format: ecartCourt,
      formatEcart: kE,
      sensBon: -1,
      aide: () => "réel − coût préétabli de la production réelle, cumulé",
    },
    {
      cle: "ecartStatique",
      nom: "Écart au budget statique",
      format: ecartCourt,
      formatEcart: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `dont effet de volume : ${kE(l.volume ?? 0)}`
          : `réel − budget de ${tonnes(VOLUME_BUDGET)} par semaine`,
    },
    {
      cle: "production",
      nom: "Production",
      format: tonnes,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `tonnes bonnes ; budget à date : ${tonnes(l.volumeADate ?? 0)}`
          : `budget : ${tonnes(VOLUME_BUDGET * SEMAINES)} sur le trimestre`,
      jauge: (l) =>
        l.volumeADate
          ? {
              part: Math.min(1, (l.production ?? 0) / (VOLUME_BUDGET * SEMAINES)),
              enRetard: (l.production ?? 0) < l.volumeADate,
            }
          : null,
    },
    {
      cle: "rebut",
      nom: "Rebuts",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: (semaine) =>
        semaine ? "du tonnage coulé ; fiche : 2 %" : "le mois dernier ; fiche : 2 %",
    },
    {
      cle: "ciment",
      nom: "Ciment par tonne bonne",
      format: kgParTonne,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `fiche : ${nombre(STANDARD.ciment * 1000, 0)} kg/t`
          : `le mois dernier ; fiche : ${nombre(STANDARD.ciment * 1000, 0)} kg/t`,
    },
  ],
  contexte(l, decisions) {
    return {
      ecartFlexible: ecart(l.ecartFlexible ?? 0),
      ecartStatique: ecart(l.ecartStatique ?? 0),
      depassement:
        (l.ecartStatique ?? 0) >= 0
          ? `${kE(l.ecartStatique ?? 0)} au-dessus de son budget`
          : `${kE(-(l.ecartStatique ?? 0))} sous son budget`,
      ciment: kgParTonne(l.ciment ?? 0),
      cimentKg: `${nombre(l.ciment ?? 0, 0)} kg`,
      rebut: taux(l.rebut ?? 0),
      ecartMO: ecart((l.ecartTaux ?? 0) + (l.ecartTemps ?? 0)),
      ecartTaux: ecart(l.ecartTaux ?? 0),
      ecartTemps: ecart(l.ecartTemps ?? 0),
      ecartPrixCiment: ecart(l.ecartPrixCiment ?? 0),
      ecartQuantiteCiment: ecart(l.ecartQuantiteCiment ?? 0),
      presseReglee: decisions[D.ecart] === 1 || decisions[D.regleur] === 0,
      dosageStrict: decisions[D.ecart] === 3,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Écart de la période", ecart(semaines.reduce((x, w) => x + w.ecart, 0))],
      [`Rebuts, sem. ${a}`, taux(t.semaines[a]!.rebut)],
      [`Ciment, sem. ${a}`, kgParTonne(t.semaines[a]!.ciment)],
    ];
  },
  courbe: {
    titre: "Coût réel d'une tonne bonne, semaine par semaine",
    cle: "coutParTonne",
    cible: COUT_PREETABLI,
    libelleCible: `coût préétabli : ${parTonne(COUT_PREETABLI)}`,
    graduations: [100, 125, 150, 175, 200],
    format: parTonne,
    details: (s) => [
      `${parTonne(s.coutParTonne!)} · ${tonnes(s.production!)} bonnes`,
      `rebuts ${taux(s.rebut!)} · ciment ${kgParTonne(s.ciment!)} · ${nombre(s.heures!, 2)} h/t`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.ecart && choix === 1) {
      return [
        { ...RADOMIR, texte: roulementUse(graine) ? REPONSES.roulementUse : REPONSES.vibreurSain },
      ];
    }
    if (etape === D.ciment && choix === 1) {
      const oui = cimenterieAccepte(graine);
      return [
        {
          ...YOLANDE,
          alerte: !oui,
          texte: oui ? REPONSES.cimenterieAccepte : REPONSES.cimenterieRefuse,
        },
      ];
    }
    if (etape === D.commande && choix === 2) {
      const oui = interimExperimente(graine);
      return [
        {
          ...AGENCE,
          texte: oui ? REPONSES.interimExperimente : REPONSES.interimDebutant,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.ecart] === 3 && dans(2)) {
      lies.push({ ...DJAMEL, heure: "sem. 2", alerte: true, texte: REPONSES.noteDeService });
    }
    if (arrive.roulement) {
      lies.push({ ...RADOMIR, heure: "sem. 5", texte: REPONSES.roulementPose });
    }
    if (chemin[D.dosage] === 0 && dans(4) && defautPresse(chemin, graine, 4) >= 0.5) {
      lies.push({ ...DJAMEL, heure: "sem. 4", alerte: true, texte: REPONSES.sansDemiSac });
    }
    for (const w of arrive.lots) {
      lies.push({
        ...ANATOLE,
        role: "Réception des lots, client",
        heure: `sem. ${w}`,
        alerte: true,
        texte: REPONSES.lotRefuse,
      });
    }
    if (arrive.fiche) {
      lies.push({ ...DJAMEL, heure: "sem. 11", alerte: true, texte: REPONSES.ficheIncomplete });
    }
    if (arrive.panne) {
      lies.push({ ...DJAMEL, heure: "sem. 12", alerte: true, texte: REPONSES.panne });
    }
    const semaine = (m: Message) => Number(m.heure?.replace("sem. ", "") ?? 0);
    lies.sort((x, y) => semaine(x) - semaine(y));
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
    titre: (t) => `${ecartAuFlexible(t.objectif)}, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget flexible, pénalités, commandes perdues et lots refusés compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const fin = rebutFin(t);
      return [
        {
          nom: "Budget flexible",
          valeur: ecart(-t.objectif),
          aide: `sur ${kE(t.flexible)} ; au budget statique : ${ecart(t.reel - t.statique)}`,
          tenu: -t.objectif <= 0.1 * t.flexible,
        },
        {
          nom: "Rebuts",
          valeur: taux(fin),
          aide: "sur les quatre dernières semaines ; fiche 2 %",
          tenu: fin <= 0.04,
        },
        {
          nom: "Ciment",
          valeur: kgParTonne(t.cimentFin),
          aide: `par tonne bonne, en fin de trimestre ; fiche ${nombre(STANDARD.ciment * 1000, 0)} kg`,
          tenu: t.cimentFin <= STANDARD.ciment * 1000 * 1.03,
        },
        {
          nom: "Livraisons",
          valeur: t.lotsRefuses
            ? t.lotsRefuses > 1
              ? `${t.lotsRefuses} lots refusés`
              : "1 lot refusé"
            : t.perdu > 1
              ? `${tonnes(t.perdu)} perdues`
              : "tenues",
          aide: t.lotsRefuses
            ? "par les clients, à l'essai de gel-dégel"
            : "commandes livrées, lots acceptés",
          tenu: t.lotsRefuses === 0 && t.perdu <= 20,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.cimenterie
          ? [
              {
                titre: "La cimenterie",
                texte:
                  t.cimenterie === "accepte"
                    ? "a accepté l'engagement de volume : 158 €/t au lieu de 168."
                    : "a refusé de limiter sa hausse : 168 €/t.",
              },
            ]
          : []),
        ...(t.interim
          ? [
              {
                titre: "L'intérim",
                texte:
                  t.interim === "experimente"
                    ? "a envoyé deux intérimaires qui connaissaient le béton."
                    : "a envoyé deux intérimaires qui n'avaient jamais vu une presse : les rebuts ont monté.",
              },
            ]
          : []),
        {
          titre: "L'atelier",
          texte: [
            t.roulementUse ? "le roulement du vibreur était usé jusqu'en semaine 5" : null,
            t.ficheIncomplete ? "la fiche d'Armel oubliait les moules de regards" : null,
            t.panne ? "la presse a lâché en semaine 12" : "la presse a tenu",
            t.lotsRefuses
              ? `${pluriel(t.lotsRefuses, "lot")} de bordures refusé${t.lotsRefuses > 1 ? "s" : ""}`
              : "aucun lot refusé",
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
