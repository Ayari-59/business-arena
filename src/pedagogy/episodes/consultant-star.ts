/**
 * ÉPISODE 71 — LE CONSULTANT STAR, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Philippine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans les épisodes écrits
 * après l'équipe : les réponses qui dépendent d'un choix antérieur (Ilham en
 * semaine 4, l'essai du mentorat, la reprise de l'écart du comité, Halden et
 * la Banque Dauriac) passent par `evenements().lies`, et `lire` renvoie des
 * clés non affichées (le comportement, qui est parti) qui nourrissent les
 * messages et les sources.
 */
import {
  BUDGET,
  COUT_DEPART_ANALYSTE,
  D,
  ENGAGEMENT_DEPART,
  EQUIPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OCCUPATION_BASSE,
  OCCUPATION_CIBLE,
  OCCUPATION_VENDUE,
  PERTE_PAR_JOUR,
  SEUIL_ENGAGEMENT,
  banqueAccepte,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/consultant-star";
import {
  DIAGNOSTICS,
  ETAPES,
  PERSONNES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/consultant-star";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const sur100 = (v: number) => `${nombre(v, 0)} / 100`;
/** Un écart au budget de marge : positif, l'équipe a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
const { MAXIMILIEN, ILHAM, NEVEN, GAETANE, ENORA, AMAYA, MAYEUL } = PERSONNES;

/** Ce que les décisions révèlent, dans l'ordre où une manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les trois qui donnaient les faits, le staffing réel et le coût d'un départ",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    comportement:
      "Votre diagnostic de la semaine 1 était juste : le comportement de Maximilien, toléré parce qu'il rapportait, coûtait à l'équipe plus qu'il ne lui apportait. Des analystes staffés à 55 % quand le plan en vendait 85 %, et une analyste en entretien chez un concurrent.",
    delegation:
      "En semaine 1, vous avez vu un consultant débordé qui garde le travail : c'était vrai, mais il ne manquait pas de temps pour déléguer. Il relisait en humiliant, réécrivait la nuit, et personne ne le lui avait dit.",
    niveau:
      "En semaine 1, vous avez retenu le niveau des analystes ; leurs livrables étaient complets, et 64 commentaires dont aucun ne disait quoi corriger ne relèvent pas de l'exigence.",
    carnet:
      "En semaine 1, vous avez retenu le carnet de la practice ; Morgane et Liam, sur les autres missions, étaient à 80 %. Les jours manquants étaient ceux que Maximilien gardait pour lui.",
  };
  const justes = ["comportement", "delegation"];
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
    score: d === "comportement" ? 1 : d === "delegation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const analystes = [t.ilham, t.gaetane, t.ylan].filter((x) => x !== null).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais fermé les yeux parce qu'il rapportait, ni écarté Maximilien de ses clients : vous avez traité le comportement en gardant le talent."
        : `Vous avez choisi ${n} fois de laisser faire parce qu'il rapporte, ou de l'écarter de ses missions. Fermer les yeux coûte les juniors ; l'écarter coûte les clients.${
            analystes ? ` ${analystes} analyste${analystes > 1 ? "s ont" : " a"} démissionné.` : ""
          }${t.halden !== null ? " Maximilien est parti chez Halden Partners." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_DEPART_ANALYSTE / 1000,
    "de coût d'un départ d'analyste pour l'équipe",
    "k€",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e)} k€`,
  );

  const recadre = p.chemin[D.maximilien] === 1;
  const suivi = p.chemin[D.rechute] === 1;
  const methode = (recadre ? 1 : 0) + (suivi ? 1 : 0);
  const recadrage: Constat = {
    score: methode === 2 ? 1 : methode === 1 ? 0.6 : 0,
    texte: `${
      recadre
        ? `Vous avez recadré Maximilien avec des faits datés et des attentes explicites${t.change ? ", et il a changé" : " ; cette fois, il n'a pas changé"}.`
        : p.chemin[D.maximilien] === 2
          ? "Vous lui avez fait un reproche général, sans un fait : il n'avait rien à quoi se tenir."
          : p.chemin[D.maximilien] === 3
            ? "Vous l'avez écarté de ses missions au lieu de lui dire ce qui n'allait pas."
            : "Vous ne lui avez rien dit en semaine 1."
    } ${
      suivi
        ? "Quand l'ancien comportement est revenu avant le comité Lagrave, vous l'avez repris tout de suite, avec le fait précis."
        : "Quand l'ancien comportement est revenu avant le comité Lagrave, vous ne l'avez pas repris avec le fait précis : l'écart est devenu la norme, ou la sanction a remplacé le suivi."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, recadrage];
}

export function axe([information, diagnostic, reflexe, calibrage, recadrage]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Aller chercher les faits",
      texte:
        "Rejouez l'épisode en relisant d'abord ses commentaires de relecture et le staffing réel dans Tempora : les faits datés rendent le recadrage possible, et les jours d'analyste perdus montrent ce que coûte le silence.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni fermer les yeux, ni écarter le talent",
      texte:
        "Se taire parce qu'il fait 30 % du chiffre coûte les juniors ; lui retirer ses clients coûte les clients. Le recadrage avec des faits, des attentes explicites et un suivi garde les deux.",
    };
  }
  if (recadrage!.score === 0) {
    return {
      titre: "Recadrer avec des faits, puis suivre",
      texte:
        "Un reproche général ne change rien, et un recadrage sans suivi ne tient pas au premier rush. Dites les faits, l'effet, l'attente ; puis reprenez le premier écart tout de suite.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Compter ce que le talent coûte à l'équipe",
      texte:
        "La performance d'une équipe n'est pas la somme des talents : regardez ce que le comportement d'un seul fait aux autres, en jours non staffés, en engagement et en départs.",
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

export const EPISODE_STAR: Episode<Trimestre> = {
  code: "consultant-star",
  numero: 71,
  domaine: "Manager un talent difficile",
  titre: "Le consultant star",
  resume:
    "Le consultant le plus brillant de l'équipe, adoré des clients, épuise les analystes. Recadrer un comportement sans sacrifier ni le talent ni l'équipe.",
  persona: `Vous êtes Philippine Darras, manager dans la practice Data et systèmes d'information d'Atlas Conseil, au bureau de Bordeaux. Votre équipe : sept personnes, dont Maximilien Harismendy, consultant senior, ${EQUIPE.length - 5 === 2 ? "deux" : EQUIPE.length - 5} consultants et quatre analystes.`,
  mandat: [
    { fort: kE(BUDGET), texte: "de marge de l'équipe sur le trimestre, départs déduits" },
    { fort: taux(OCCUPATION_CIBLE, 0), texte: "de taux d'occupation, la cible d'Atlas Conseil" },
    { fort: "7 sur 7", texte: "personnes à garder dans l'équipe" },
    { fort: sur100(SEUIL_ENGAGEMENT), texte: "d'engagement des analystes au moins" },
  ],
  jugement:
    "Le directeur de la practice juge le trimestre sur la marge de l'équipe (honoraires moins salaires et achats), moins ce que coûtent les départs : recrutement, intercontrat, clients perdus.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre équipe",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, Maximilien continue de réécrire les livrables des analystes : autant de jours qui ne se facturent pas.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...NEVEN,
        alerte: true,
        texte: `Pendant ce temps, Maximilien a refait seul deux de nos analyses : des jours d'analyste que la banque ne paiera pas. ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le coût d'un départ d'analyste pour l'équipe, en k€",
    unite: "k€",
    placeholder: "15",
    min: 0,
    max: 100,
    step: 0.5,
    reel: () => COUT_DEPART_ANALYSTE / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Marge de l'équipe",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `départs déduits ; budget à date : ${kE(l.budgetADate ?? 0)}`
          : `${kE(BUDGET)} pour le trimestre, départs déduits`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => `de l'équipe ; cible ${taux(OCCUPATION_CIBLE, 0)}`,
    },
    {
      cle: "occupationJuniors",
      nom: "Staffing de ses équipiers",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => `sur ses missions ; vendu au client : ${taux(OCCUPATION_VENDUE, 0)}`,
    },
    {
      cle: "engagement",
      nom: "Engagement des analystes",
      format: sur100,
      formatEcart: (v) => `${nombre(v, 0)} pt`,
      sensBon: 1,
      aide: () => `baromètre du vendredi ; vigilance sous ${nombre(SEUIL_ENGAGEMENT, 0)}`,
    },
    {
      cle: "departs",
      nom: "Démissions",
      format: (v) => nombre(v, 0),
      formatEcart: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (_semaine, l) =>
        (l.departs ?? 0) > 0 ? `coût provisionné : ${kE(l.coutDeparts ?? 0)}` : "aucune à ce jour",
    },
  ],
  contexte(l, decisions) {
    return {
      engagement: nombre(l.engagement ?? ENGAGEMENT_DEPART, 0),
      occupation: taux(l.occupation ?? 0, 0),
      occupationJuniors: taux(l.occupationJuniors ?? OCCUPATION_BASSE, 0),
      cumul: kE(l.cumul ?? 0),
      recadre: decisions[D.maximilien] === 1,
      maximilienParti: (l.maximilienParti ?? 0) > 0,
      ilhamPartie: (l.ilhamPartie ?? 0) > 0,
      gaetanePartie: (l.gaetanePartie ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Engagement, sem. ${a}`, sur100(fin.engagement)],
      [`Occupation, sem. ${a}`, taux(fin.occupation, 0)],
      ["Marge de la période, départs déduits", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Engagement des analystes, semaine par semaine",
    cle: "engagement",
    cible: SEUIL_ENGAGEMENT,
    libelleCible: `seuil de vigilance : ${nombre(SEUIL_ENGAGEMENT, 0)} / 100`,
    graduations: [20, 40, 60, 80],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `engagement ${sur100(s.engagement!)} · ${nombre(s.departs!, 0)} démission${s.departs! > 1 ? "s" : ""}`,
      `occupation ${taux(s.occupation!, 0)} · ses équipiers ${taux(s.occupationJuniors!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.lot && choix === 2) {
      // Seule la proposition compte : la banque répond selon le hasard du trimestre.
      return [
        {
          ...AMAYA,
          texte: banqueAccepte(graine) ? REPONSES.banqueAccepte : REPONSES.banqueRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.ilham === "reste")
      lies.push({ ...ILHAM, heure: "sem. 4", texte: REPONSES.ilhamReste });
    if (arrive.ilham === "part") {
      lies.push({ ...ENORA, heure: "sem. 4", alerte: true, texte: REPONSES.ilhamPart });
    }
    if (arrive.halden) {
      lies.push({ ...MAXIMILIEN, heure: `sem. ${t.halden}`, alerte: true, texte: REPONSES.halden });
    }
    if (arrive.dauriacPerdue) {
      lies.push({
        ...AMAYA,
        heure: `sem. ${t.halden! + 2}`,
        alerte: true,
        texte: REPONSES.dauriacPerdue,
      });
    }
    if (arrive.essai !== null) {
      lies.push({
        ...ENORA,
        heure: "sem. 8",
        texte: arrive.essai ? REPONSES.essaiConcluant : REPONSES.essaiRate,
      });
    }
    if (arrive.reprise !== null) {
      lies.push({
        ...GAETANE,
        heure: "sem. 9",
        ...(arrive.reprise ? {} : { alerte: true }),
        texte: arrive.reprise
          ? REPONSES.repriseReussie
          : chemin[D.rechute] === 2
            ? REPONSES.repriseRateeAvertissement
            : REPONSES.repriseRatee,
      });
    }
    if (arrive.gaetane) {
      lies.push({ ...ENORA, heure: "sem. 10", alerte: true, texte: REPONSES.gaetanePart });
    }
    if (chemin[D.copil] === 2 && de <= 12 && a >= 12) {
      lies.push({
        ...(t.halden !== null ? MAYEUL : AMAYA),
        heure: "sem. 12",
        texte: REPONSES.reprise,
      });
    }
    if (arrive.ylan) {
      lies.push({ ...ENORA, heure: "sem. 12", alerte: true, texte: REPONSES.ylanPart });
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
    titre: (t) => `Marge de l'équipe ${ecartAuBudget(t.objectif - BUDGET)}, départs déduits`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge de l'équipe sur le trimestre, moins le coût des départs (recrutement, intercontrat, clients perdus), sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const analystes = 3 - [t.ilham, t.gaetane, t.ylan].filter((x) => x !== null).length;
      return [
        {
          nom: "Marge, départs déduits",
          valeur: kE(t.objectif),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Maximilien",
          valeur: t.halden === null ? "resté" : "parti",
          aide:
            t.halden === null
              ? t.change
                ? "et il a changé"
                : "votre consultant senior"
              : `chez Halden Partners, en semaine ${t.halden}, avec la Banque Dauriac`,
          tenu: t.halden === null,
        },
        {
          nom: "Analystes exposés",
          valeur: `${analystes} sur 3 restés`,
          aide: "Ilham, Gaëtane et Neven",
          tenu: analystes === 3,
        },
        {
          nom: "Taux d'occupation",
          valeur: taux(t.occupationMoyenne, 0),
          aide: `moyenne du trimestre ; cible ${taux(OCCUPATION_CIBLE, 0)}`,
          tenu: t.occupationMoyenne >= OCCUPATION_CIBLE - 0.005,
        },
      ];
    },
    hasard(t, graine) {
      const partis = [
        t.ilham !== null ? "Ilham a démissionné en semaine 4" : null,
        t.gaetane !== null ? "Gaëtane a démissionné en semaine 10" : null,
        t.ylan !== null ? "Neven a démissionné en semaine 12" : null,
        t.halden !== null
          ? `Maximilien est parti chez Halden Partners en semaine ${t.halden}`
          : null,
      ].filter(Boolean);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Maximilien",
          texte: t.change
            ? "a changé après le recadrage de la semaine 1."
            : "n'a pas changé de lui-même pendant le trimestre.",
        },
        ...(t.banque !== null
          ? [
              {
                titre: "La Banque Dauriac",
                texte: t.banque
                  ? "a accepté que Peio mène le lot 2."
                  : "a refusé un autre chef de mission que Maximilien.",
              },
            ]
          : []),
        ...(t.essaiConcluant !== null
          ? [
              {
                titre: "L'essai du mentorat",
                texte: t.essaiConcluant
                  ? "a été concluant : Maximilien a pris le mentorat."
                  : "n'a pas été concluant : Peio a pris le mentorat.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: (partis.length ? partis.join(", ") : "Personne n'est parti").concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
