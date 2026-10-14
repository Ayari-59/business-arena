/**
 * ÉPISODE 29 — L'ÉQUIPE DISPERSÉE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Benoît montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Deux contournements du contrat `Episode`, comme dans les cinq premiers écrits
 * après l'équipe (dépôt, budget, projet, achats, recrutement) :
 * les suites qui dépendent d'un choix antérieur (le binôme sans entrain sous
 * le boîtier, la réponse d'Ambre, l'atelier sans elle) passent par
 * `evenements().lies`, et `lire` renvoie des clés non affichées (lien,
 * confiance, engagement par groupe, départs) qui nourrissent les messages.
 */
import {
  BUDGET,
  D,
  EFFECTIF,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_COMPTES_RENDUS,
  OBJECTIF_ECART,
  PERTE_PAR_JOUR,
  SEMAINES,
  binomesQuiPrennent,
  evenements,
  hasard,
  remiseSuivie,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/equipe-dispersee";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/equipe-dispersee";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const sur100 = (v: number) => `${nombre(v * 100, 0)} / 100`;
const fois = (v: number) => `× ${nombre(v)}`;
/** Un écart au budget de marge : positif, l'équipe a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient d'où venaient les écarts",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    isolement:
      "Votre diagnostic de la semaine 1 était juste : livrés à eux-mêmes, les débutants décrochaient, et des comptes rendus que personne ne lisait ne servaient à rien.",
    competences:
      "En semaine 1, vous avez vu que les débutants ne savaient pas encore monter un devis technique : c'était vrai, mais seuls sur leur secteur, ils n'avaient personne pour l'apprendre, et l'équipe entière manquait de cadre.",
    activite:
      "En semaine 1, vous avez retenu un manque de travail ; les débutants faisaient autant de visites que les autres. Ce qu'ils perdaient, c'étaient les devis techniques.",
    secteurs:
      "En semaine 1, vous avez retenu des secteurs moins porteurs ; leur potentiel variait de moins de 10 %, et celui de Killian était au-dessus de la moyenne.",
  };
  const justes = ["isolement", "competences"];
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
    score: d === "isolement" ? 1 : d === "competences" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé ni à la surveillance, ni au laisser-faire : vous avez piloté par les résultats, et gardé le lien."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions de surveiller l'activité ou de laisser chacun faire. Un boîtier dit où sont les commerciaux, pas ce qu'ils vendent ; laisser faire laisse les plus fragiles seuls.${
            t.elodiePart ? " Ambre, la meilleure de l'équipe, est partie chez un concurrent." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.marge / 1000,
    "de marge de l'équipe en semaine 3",
    "k€",
    { juste: 2, proche: 5 },
    (e) => `${nombre(e)} k€`,
  );

  const rituels = p.chemin[D.cadre] === 1;
  const style =
    p.chemin[D.elodie] === 0 && (p.chemin[D.debutants] === 0 || p.chemin[D.debutants] === 1);
  const departs = [
    t.killianPart ? "Killian a démissionné en semaine 8" : null,
    t.elodiePart ? "Ambre est partie en semaine 10" : null,
  ].filter(Boolean);
  const lien: Constat = {
    score: rituels && style ? 1 : rituels || style ? 0.6 : 0,
    texte: `${
      rituels
        ? "Vous avez donné un rythme à une équipe dispersée : un point court chaque semaine, une réunion par mois en présentiel."
        : p.chemin[D.cadre] === 0
          ? "Vous avez remplacé le lien par un boîtier : vous saviez où ils étaient, pas ce qui les bloquait."
          : "Votre équipe est restée sans rituel : chacun seul sur son secteur, le lien s'est usé semaine après semaine."
    } ${
      style
        ? "Vous avez adapté votre style à chacun : guider les débutants sur le terrain, confier une mission à la plus autonome."
        : "Vous n'avez pas adapté votre style à chacun, alors que débutants et autonomes n'attendaient pas la même chose de vous."
    }${departs.length ? ` ${departs.join(", et ")}.` : " Personne n'a quitté l'équipe."}`,
  };

  return [information, diagnostic, reflexe, calibrage, lien];
}

export function axe([information, diagnostic, reflexe, calibrage, lien]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qui fait les écarts",
      texte:
        "Rejouez l'épisode en comparant d'abord les visites et les devis de chacun : les débutants visitaient autant que les autres ; ils perdaient les devis techniques, seuls sur leur secteur.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Piloter par les résultats et le lien, pas par la surveillance",
      texte:
        "Un boîtier dit où sont les commerciaux, pas ce qu'ils vendent, et il fait fuir les meilleurs ; laisser faire laisse les plus fragiles seuls. Des objectifs clairs, un point court chaque semaine et une réunion par mois tiennent une équipe qu'on ne voit pas.",
    };
  }
  if (lien!.score === 0) {
    return {
      titre: "Adapter son style à chacun",
      texte:
        "Les débutants ont besoin qu'on les guide sur le terrain, les plus autonomes qu'on leur confie des missions. Le même traitement pour tous use les uns comme les autres.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder ce qui manque, pas qui se cache",
      texte:
        "Quand les résultats divergent, comparez ce que font les meilleurs et les moins bons, visite par visite : l'écart est rarement dans l'activité, plus souvent dans le savoir-faire et l'isolement.",
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
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const RAPHAEL = { de: "Marius Montagnon", role: "Directeur commercial régional" } as const;
const ALASSANE = { de: "Alassane Koné", role: "Technico-commercial, Rhône est" } as const;
const ELODIE = { de: "Ambre Vasquez", role: "Technico-commerciale, Isère nord" } as const;
const KILLIAN = { de: "Killian Desbois", role: "Technico-commercial, Isère sud" } as const;
const GREGOIRE = { de: "Félix Matthey", role: "Technico-commercial, Ain" } as const;
const OPHELIE = { de: "Albane Grangier", role: "Technico-commerciale, Rhône sud" } as const;

export const EPISODE_DISTANCE: Episode<Trimestre> = {
  code: "equipe-dispersee",
  numero: 21,
  domaine: "Management à distance",
  titre: "L'équipe dispersée",
  resume:
    "Neuf commerciaux itinérants qu'on ne voit presque jamais, des résultats du simple au double, et une direction qui veut géolocaliser les véhicules. Piloter par les résultats et le lien, pas par la surveillance.",
  persona:
    "Vous êtes Benoît Le Bihan, responsable de l'équipe technico-commerciale itinérante d'Arvel Distribution pour le Rhône, l'Ain et l'Isère, rattaché à l'agence de Saint-Priest. Votre équipe : neuf technico-commerciaux, chacun sur son secteur, chez les artisans et sur les chantiers. Vous les voyez rarement.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge nette de l'équipe sur le trimestre" },
    {
      fort: taux(OBJECTIF_COMPTES_RENDUS, 0),
      texte: "des visites avec un compte rendu, au moins",
    },
    {
      fort: fois(OBJECTIF_ECART),
      texte: "d'écart au plus entre les meilleurs et les débutants",
    },
    { fort: `${EFFECTIF} commerciaux`, texte: "à garder sur la route" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge apportée par l'équipe en écart au budget, en comptant les outils, les déplacements, les primes et les recrutements.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre équipe",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les devis qui attendent une réponse de votre part partent chez les concurrents.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...RAPHAEL,
        alerte: true,
        texte: `Pendant ce temps, deux devis techniques sont restés sans réponse et sont partis chez un concurrent : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la marge de l'équipe en semaine 3, en milliers d'euros",
    unite: "k€",
    placeholder: "54",
    min: 0,
    max: 150,
    step: 0.5,
    reel: (t) => t.semaines[3]!.marge / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Marge nette de l'équipe",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "ecart",
      nom: "Écart de résultats",
      format: fois,
      formatEcart: (v) => nombre(v),
      sensBon: -1,
      aide: () => `un autonome face à un débutant ; objectif ${fois(OBJECTIF_ECART)} au plus`,
    },
    {
      cle: "comptesRendus",
      nom: "Comptes rendus remplis",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => `des visites ; objectif ${taux(OBJECTIF_COMPTES_RENDUS, 0)}`,
    },
    {
      cle: "engagement",
      nom: "Engagement de l'équipe",
      format: sur100,
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "baromètre du vendredi",
    },
    {
      cle: "risque",
      nom: "Risque de départ",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: () => "qu'un commercial parte dans le trimestre",
    },
  ],
  contexte(l, decisions) {
    return {
      marge: kE(l.marge ?? 0),
      ecart: nombre(l.ecart ?? 0),
      comptesRendus: taux(l.comptesRendus ?? 0, 0),
      engagement: nombre((l.engagement ?? 0) * 100, 0),
      risque: taux(l.risque ?? 0, 0),
      cumul: kE(l.cumul ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      geoloc: decisions[D.cadre] === 0,
      rituels: decisions[D.cadre] === 1,
      killianParti: l.killianParti === 1,
      elodiePartie: l.elodiePartie === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Marge de l'équipe, sem. ${a}`, kE(fin.marge)],
      [`Engagement, sem. ${a}`, sur100(fin.engagement)],
      ["Marge nette de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Marge de l'équipe, semaine par semaine",
    cle: "marge",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [40000, 50000, 60000, 70000, 80000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.marge!)} · écart ${fois(s.ecart!)}`,
      `comptes rendus ${taux(s.comptesRendus!, 0)} · engagement ${sur100(s.engagement!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.debutants && choix === 0) {
      // Seul le choix compte : les binômes prennent ou non selon le hasard du trimestre.
      const [killian, anais] = binomesQuiPrennent(graine);
      const r =
        killian && anais
          ? REPONSES.deuxBinomes
          : killian
            ? REPONSES.binomeKillian
            : anais
              ? REPONSES.binomeAnais
              : REPONSES.aucunBinome;
      return r.map((m) => ({ ...m }));
    }
    if (etape === D.fin && choix === 2) {
      return [
        {
          ...GREGOIRE,
          texte: remiseSuivie(graine) ? REPONSES.remiseSuivie : REPONSES.remiseIgnoree,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.binomeReticent) {
      lies.push({ ...ALASSANE, heure: "sem. 4", texte: REPONSES.binomeReticent });
    }
    if (arrive.killianPart) {
      lies.push({ ...KILLIAN, heure: "sem. 8", alerte: true, texte: REPONSES.killianPart });
    }
    if (arrive.elodiePart) {
      lies.push({ ...ELODIE, heure: "sem. 10", alerte: true, texte: REPONSES.elodiePart });
    }
    if (arrive.elodieReste) {
      lies.push({ ...ELODIE, heure: "sem. 10", texte: REPONSES.elodieReste });
    }
    if (arrive.atelier === "complet") {
      lies.push({
        ...OPHELIE,
        heure: "sem. 10",
        texte:
          "L'atelier, c'était la meilleure journée depuis longtemps : Ambre et Alassane ont déroulé un vrai chantier d'isolation, du relevé au devis, et chacun est reparti avec le sien.",
      });
    }
    if (arrive.atelier === "sans-elodie") {
      lies.push({
        ...OPHELIE,
        heure: "sem. 10",
        texte:
          "Sans Ambre, Alassane a animé l'atelier seul. Utile, mais on a manqué de cas concrets, et on a fini en milieu d'après-midi.",
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
    titre: (t) => `Marge nette ${ecartAuBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette de l'équipe en écart au budget, outils, déplacements, primes et recrutements compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const crFinal = t.semaines[SEMAINES]!.comptesRendus;
      return [
        {
          nom: "Marge nette",
          valeur: kE(t.margeNette),
          aide: `sur le trimestre ; budget ${kE(BUDGET)}`,
          tenu: t.objectif >= 0,
        },
        {
          nom: "Écart de résultats",
          valeur: fois(t.ecartFinal),
          aide: `en semaine 13 ; objectif ${fois(OBJECTIF_ECART)} au plus`,
          tenu: t.ecartFinal <= OBJECTIF_ECART,
        },
        {
          nom: "Comptes rendus",
          valeur: taux(crFinal, 0),
          aide: `en semaine 13 ; objectif ${taux(OBJECTIF_COMPTES_RENDUS, 0)}`,
          tenu: crFinal >= OBJECTIF_COMPTES_RENDUS,
        },
        {
          nom: "Équipe",
          valeur: `${t.effectifFinal} sur ${EFFECTIF}`,
          aide:
            t.killianPart && t.elodiePart
              ? "Killian et Ambre sont partis"
              : t.killianPart
                ? "Killian a démissionné"
                : t.elodiePart
                  ? "Ambre est partie"
                  : "commerciaux en fin de trimestre",
          tenu: t.effectifFinal === EFFECTIF,
        },
      ];
    },
    hasard(t, graine) {
      const binomes = t.binomes;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(binomes
          ? [
              {
                titre: "Les binômes",
                texte:
                  binomes[0] && binomes[1]
                    ? "ont pris tous les deux."
                    : binomes[0]
                      ? "celui d'Alassane et de Killian a pris ; celui d'Ambre et d'Anaïs, non."
                      : binomes[1]
                        ? "celui d'Ambre et d'Anaïs a pris ; celui d'Alassane et de Killian, non."
                        : "n'ont pris ni l'un ni l'autre.",
              },
            ]
          : []),
        ...(t.remiseSuivie !== null
          ? [
              {
                titre: "Les artisans",
                texte: t.remiseSuivie
                  ? "ont avancé leurs commandes pour profiter de la remise."
                  : "n'ont pas avancé leurs commandes ; la remise a surtout profité à ceux qui commandaient de toute façon.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte:
            t.killianPart || t.elodiePart
              ? [
                  t.killianPart ? "Killian a démissionné en semaine 8" : null,
                  t.elodiePart ? "Ambre est partie chez un concurrent en semaine 10" : null,
                ]
                  .filter(Boolean)
                  .join(", et ")
                  .concat(".")
              : "Personne n'est parti : Killian s'est accroché, et Ambre a décliné l'offre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
