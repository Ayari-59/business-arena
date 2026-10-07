/**
 * ÉPISODE 68 — LE FORFAIT VENDU SOUS SON COÛT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Prune montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 */
import {
  ARMORINE,
  BUDGET,
  D,
  FACTURABLES,
  JOURS_TRAVAILLES,
  MARGE_SANS_DEPASSEMENT,
  QUOTE_PART,
  QUOTE_PART_GRILLE,
  SALAIRE_CHARGE,
  TJM_MOYEN,
  JOURS_SANS_PERTE,
  MARGE_AFFICHEE,
  MARGE_REELLE_2024,
  MISSION,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLANCHER,
  PRIX_ACTUEL,
  VALMORIN,
  armorineAccepte,
  catalogueAccepte,
  contreAcceptee,
  coutComplet,
  coutGrille,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/forfait-trop-bas";
import {
  DIAGNOSTICS,
  ETAPES,
  PERSONNES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  messageAttribution,
  pourcent,
} from "@/config/episodes/forfait-trop-bas";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const { DARIUSH, LORCAN, ONDREJ, GAID, DOMENICA } = PERSONNES;
const ELOAN = { de: "Eloan Kastler", role: "Manager" } as const;

/** Un taux au dixième, signe moins typographique compris. */
const tauxSigne = (v: number) => `${v < 0 ? "−" : ""}${nombre(Math.abs(v) * 100, 1)} %`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** La marge des forfaits, rapportée au budget. */
const auBudget = (v: number) =>
  v >= BUDGET ? `${kE(v - BUDGET)} au-dessus du budget` : `${kE(BUDGET - v)} sous le budget`;

/** Le coût complet d'une journée facturable de consultant senior : la prévision de la semaine 1. */
export const COUT_SENIOR = coutComplet("senior");

/** Ce que les décisions révèlent, dans l'ordre où une contrôleuse de gestion les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la grille, les temps de Tempora et les charges de structure",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    cout: `Votre diagnostic de la semaine 1 était juste : la grille répartissait le coût d'un consultant sur ${JOURS_TRAVAILLES} jours, quand il n'en facture que ${FACTURABLES.manager} à ${FACTURABLES.senior}, avec une quote-part de structure de 2019. Un consultant senior y coûtait ${euros(coutGrille("senior"))} le jour ; il en coûte ${euros(COUT_SENIOR)}.`,
    depassements: `En semaine 1, vous avez retenu les dépassements : une vraie cause, mais pas la principale. Sans un seul jour de dépassement, les forfaits de l'an dernier n'auraient gagné que ${pourcent(MARGE_SANS_DEPASSEMENT)} : l'essentiel de l'écart venait du coût d'une journée.`,
    prix: "En semaine 1, vous avez jugé nos TJM trop hauts ; ils étaient à peine au-dessus du vrai coût d'une journée. Baisser les prix, c'était vendre plus de forfaits à perte.",
    occupation: `En semaine 1, vous avez retenu le taux d'occupation ; à ${pourcent(FACTURABLES.senior / JOURS_TRAVAILLES)} de taux de facturation, il était proche de la cible de 75 %. Ce qui manquait, c'était un coût qui tienne compte des jours qu'un consultant ne facture pas.`,
  };
  const justes = ["cout", "depassements"];
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
    score: d === "cout" ? 1 : d === "depassements" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais chiffré au coût de la grille de 2019, ni baissé un prix pour gagner un forfait : chaque prix signé couvrait le coût d'une journée facturable."
        : `Vous avez chiffré ${n} décision${n > 1 ? "s" : ""} sur ${ETAPES.length} au coût de la grille de 2019, ou baissé un prix pour gagner : chaque forfait gagné ainsi était une perte signée pour des mois.${
            t.tauxMargeReelle !== null && t.tauxMargeAffichee !== null
              ? ` Vos forfaits signés affichent ${pourcent(t.tauxMargeAffichee)} de marge selon la grille, et ${tauxSigne(t.tauxMargeReelle)} au coût réel.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_SENIOR,
    "de coût complet pour une journée facturable de consultant senior",
    "€",
    { juste: 10, proche: 60 },
    (e) => euros(e),
  );

  // Coût complet, coût marginal, pyramide : le bon coût à la bonne question.
  const intercontrat = p.chemin[D.intercontrat] === 3;
  const pyramide = p.chemin[D.pyramide] === 1 || p.chemin[D.pyramide] === 2;
  const bonCout = (intercontrat ? 1 : 0) + (pyramide ? 1 : 0);
  const domaine: Constat = {
    score: bonCout === 2 ? 1 : bonCout === 1 ? 0.6 : 0,
    texte: `${
      intercontrat
        ? "Pour la biscuiterie, vous avez raisonné au coût marginal : trois analystes en intercontrat certain ne coûtaient que leurs frais, et vous avez borné la mission à leur fenêtre libre."
        : p.chemin[D.intercontrat] === 0
          ? `Vous avez refusé la mission de la biscuiterie « sous le coût complet » : les trois analystes, payés de toute façon, sont restés six semaines sans mission, et les ${euros(MISSION.prix)} de la mission sont partis chez un indépendant.`
          : p.chemin[D.intercontrat] === 1
            ? "Vous avez accepté la mission de la biscuiterie sur dix semaines : au-delà de la fenêtre d'intercontrat, ses jours ne coûtaient plus des frais, mais des analystes de Freelancia."
            : "Pour la biscuiterie, vous avez contre-proposé le coût complet : le bon prix pour un forfait ordinaire, pas pour une mission qui occupe de l'intercontrat certain."
    } ${
      pyramide
        ? "Pour Valmorin, vous avez tenu le budget par la pyramide plutôt que par le TJM."
        : p.chemin[D.pyramide] === 0
          ? "Pour Valmorin, vous avez tenu le budget en baissant les TJM d'une équipe chargée en managers : le forfait coûtait plus qu'il ne rapportait."
          : `Pour Valmorin, vous avez maintenu le prix catalogue${t.valmorin === "perdue" ? ", et la coopérative a signé avec Halden Partners" : ""}.`
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
      titre: "Compter les jours qu'un consultant facture vraiment",
      texte: `Rejouez l'épisode en ouvrant d'abord la grille, les temps de Tempora et les charges de structure : un consultant senior ne facture que ${FACTURABLES.senior} de ses ${JOURS_TRAVAILLES} jours, et la structure coûte ${euros(QUOTE_PART)} par consultant, pas ${euros(QUOTE_PART_GRILLE)}. Sa journée coûte ${euros(COUT_SENIOR)}, pas ${euros(coutGrille("senior"))}.`,
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Chiffrer au coût d'une journée facturable",
      texte:
        "Le coût d'une journée vendue doit payer aussi les jours qui ne se vendent pas : congés, formation, avant-vente, intercontrat, tâches internes, et la structure autour. Sous ce coût, chaque forfait gagné est une perte signée : un taux de transformation qui remonte n'est pas une bonne nouvelle.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Le coût complet pour le prix, le coût marginal pour l'intercontrat",
      texte:
        "Le coût complet fixe le prix plancher durable d'un forfait. Mais un consultant en intercontrat certain est payé qu'il travaille ou non : une mission bornée à cette fenêtre ne coûte que ce qu'elle ajoute. Et avant de baisser un TJM, regardez la pyramide de l'équipe.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher l'écart entre la marge affichée et la marge réelle",
      texte:
        "Quand les forfaits paraissent rentables à la vente et perdent à la clôture, comparez d'abord le coût qui a servi à les chiffrer au coût réel d'une journée vendue, avant d'accuser les chefs de mission ou les prix.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte: `Refaites le calcul de la semaine 1 : salaire chargé plus quote-part de structure à jour, divisés par les jours facturables. Pour un senior, ${euros(SALAIRE_CHARGE.senior)} plus ${euros(QUOTE_PART)}, divisés par ${FACTURABLES.senior} jours.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_COUT_DU_JOUR: Episode<Trimestre> = {
  code: "forfait-trop-bas",
  numero: 68,
  domaine: "Coût de revient d'une journée",
  titre: "Le forfait vendu sous son coût",
  resume:
    "Des forfaits rentables à la vente et en perte à la clôture, une grille qui divise par 218 jours. Calculer le coût d'une journée facturable, puis savoir quand le coût marginal suffit.",
  persona:
    "Vous êtes Prune Lecoeur, contrôleuse de gestion d'Atlas Conseil, cabinet de conseil en management de 240 collaborateurs, siège à Nantes. Vous tenez les chiffres des propositions et des forfaits, et c'est vous que le comité de direction écoute sur le coût d'une journée.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge des forfaits sur le trimestre, carnet compris" },
    {
      fort: pourcent(MARGE_AFFICHEE),
      texte: `de marge affichée à la vente l'an dernier, ${pourcent(MARGE_REELLE_2024)} à la clôture`,
    },
    { fort: "218 jours", texte: "le diviseur de la grille de chiffrage depuis 2019" },
    { fort: "janvier à mars", texte: "un trimestre de propositions et de renouvellements" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la marge des forfaits : réalisée sur ceux en cours, et à terminaison, au coût réel des jours, sur ceux signés de janvier à mars.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos forfaits",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les associés envoient leurs propositions chiffrées avec l'ancienne grille.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...LORCAN,
        alerte: true,
        texte: `Je n'ai pas pu attendre : deux avenants sont partis chiffrés avec l'ancienne grille. ${euros(perdu)} de marge en moins.`,
      };
    },
  },
  prevision: {
    libelle: "le coût de revient complet d'une journée facturable d'un consultant senior, en euros",
    unite: "€",
    placeholder: "600",
    min: 0,
    max: 3000,
    step: 1,
    reel: () => COUT_SENIOR,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge des forfaits",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `réalisée, et à terminaison sur les forfaits signés ; budget ${kE(BUDGET)}`
          : `${kE(BUDGET)} de budget pour le trimestre`,
      jauge: (l) =>
        l.marge == null
          ? null
          : { part: Math.min(1, Math.max(0, l.marge / BUDGET)), enRetard: l.marge < 0 },
    },
    {
      cle: "carnet",
      nom: "Carnet à produire",
      format: kE,
      sensBon: 1,
      aide: () => "honoraires signés depuis janvier, pas encore produits",
    },
    {
      cle: "transformation",
      nom: "Taux de transformation",
      format: (v) => pourcent(v),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "propositions gagnées sur propositions remises" : "l'an dernier",
    },
    {
      cle: "prixJour",
      nom: "Prix moyen d'un jour vendu",
      format: euros,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "forfaits signés depuis janvier"
          : `l'an dernier ; catalogue ${euros(TJM_MOYEN)} à la pyramide type`,
    },
    {
      cle: "margeReelle",
      nom: "Marge réelle des forfaits signés",
      format: tauxSigne,
      formatEcart: points,
      sensBon: 1,
      aide: (_semaine, l) =>
        l.margeAffichee == null
          ? "au coût réel des jours, dépassements compris"
          : `la grille de 2019 affiche ${pourcent(l.margeAffichee)}`,
    },
  ],
  contexte(l, decisions) {
    return {
      marge: kE(l.marge ?? 0),
      carnet: kE(l.carnet ?? 0),
      remises: l.remises ?? 0,
      gagnees: l.gagnees ?? 0,
      margeReelle: l.margeReelle == null ? "nulle" : tauxSigne(l.margeReelle),
      grilleCorrigee: decisions[D.grille] === 2,
      goNoGo: decisions[D.pertes] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const avant = de > 1 ? (t.semaines[de - 1] as Semaine) : null;
    const remises = t.semaines[a]!.remises - (avant?.remises ?? 0);
    const gagnees = t.semaines[a]!.gagnees - (avant?.gagnees ?? 0);
    return [
      ["Marge de la période", kE(semaines.reduce((x, w) => x + w.margeSemaine, 0))],
      ["Propositions gagnées", `${gagnees} sur ${remises}`],
      [`Carnet à produire, sem. ${a}`, kE(t.semaines[a]!.carnet)],
    ];
  },
  courbe: {
    titre: "Marge des forfaits, semaine par semaine",
    cle: "margeSemaine",
    cible: BUDGET / 13,
    libelleCible: `cadence du budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [-50000, -25000, 0, 25000, 50000],
    format: kE,
    details: (s) => [
      `marge de la semaine ${kE(s.margeSemaine!)}, forfaits signés compris · cumul ${kE(s.marge!)}`,
      `${s.gagnees} proposition${s.gagnees! > 1 ? "s" : ""} gagnée${s.gagnees! > 1 ? "s" : ""} sur ${s.remises} · carnet ${kE(s.carnet!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.intercontrat && choix === 2) {
      return [
        { ...ONDREJ, texte: contreAcceptee(graine) ? REPONSES.contreOui : REPONSES.contreNon },
      ];
    }
    if (etape === D.pyramide && choix === 3) {
      return [
        {
          ...GAID,
          texte: catalogueAccepte(graine) ? REPONSES.catalogueOui : REPONSES.catalogueNon,
        },
      ];
    }
    if (etape === D.renouvellement && choix === 1) {
      return [
        {
          ...DOMENICA,
          texte: armorineAccepte(graine) ? REPONSES.armorineOui : REPONSES.armorineNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = arrive.resultats.map((r) => ({
      ...(r.semaine % 2 ? DARIUSH : LORCAN),
      heure: `sem. ${r.semaine}`,
      texte: r.gagne
        ? `${r.client} : proposition gagnée, à ${euros(r.prix)} le jour moyen.`
        : `${r.client} : proposition perdue. Le client a retenu un concurrent.`,
    }));
    if (arrive.accord) lies.push(messageAttribution(arrive.accord));
    if (arrive.comite) {
      lies.push({
        ...ELOAN,
        heure: `sem. ${VALMORIN.semaineComite}`,
        alerte: true,
        texte: REPONSES.comite,
      });
    }
    // Dans l'ordre des semaines : « sem. 11 » avant « sem. 12 ».
    lies.sort((x, y) => Number(x.heure?.slice(5)) - Number(y.heure?.slice(5)));
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
    titre: (t) => `${kE(t.objectif)} de marge des forfaits, ${auBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge des forfaits : réalisée sur ceux en cours, à terminaison et au coût réel des jours sur ceux signés de janvier à mars, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge des forfaits",
          valeur: kE(t.objectif),
          aide: `carnet compris ; budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Marge réelle à la signature",
          valeur: t.tauxMargeReelle === null ? "aucun forfait" : tauxSigne(t.tauxMargeReelle),
          aide:
            t.tauxMargeAffichee === null
              ? "aucun forfait signé"
              : `des forfaits signés ; la grille de 2019 affichait ${pourcent(t.tauxMargeAffichee)}`,
          tenu: (t.tauxMargeReelle ?? -1) > 0,
        },
        {
          nom: "Prix des propositions gagnées",
          valeur: t.prixPropositions === null ? "aucune gagnée" : euros(t.prixPropositions),
          aide: `le jour moyen ; plancher ${euros(PLANCHER)}, ${euros(PRIX_ACTUEL)} l'an dernier`,
          tenu: (t.prixPropositions ?? 0) >= PLANCHER,
        },
        {
          nom: "Intercontrat de février",
          valeur:
            t.mission === "ferme"
              ? "mission bornée"
              : t.mission === "prolongee"
                ? "mission prolongée"
                : t.mission === "contre"
                  ? "contre-proposition acceptée"
                  : "analystes sans mission",
          aide: "trois analystes libres des semaines 6 à 11",
          tenu: t.mission === "ferme" || t.mission === "contre",
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const gagnees = t.resultats.filter((r) => r.gagne).length;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les propositions",
          texte: `${gagnees} gagnée${gagnees > 1 ? "s" : ""} sur ${t.remises} remise${t.remises > 1 ? "s" : ""}${
            t.accord === null
              ? ", sans réponse à l'accord-cadre"
              : t.accord.gagnant === "atlas"
                ? ", et l'accord-cadre des collectivités"
                : ` ; l'accord-cadre est allé à ${t.accord.gagnant === "keroual" ? "Kéroual Consulting" : "Halden Partners"}`
          }.`,
        },
        {
          titre: "Les clients",
          texte: [
            t.mission === "contre" ? "la biscuiterie a accepté la contre-proposition" : null,
            t.valmorin === "perdue"
              ? "Valmorin a signé avec Halden Partners"
              : t.comite
                ? "le comité de Valmorin a réclamé son manager"
                : "Valmorin a signé",
            t.armorine === "partie"
              ? "la Mutuelle Armorine est partie"
              : t.armorine === "relevee"
                ? `la Mutuelle Armorine a accepté ${euros(ARMORINE.prixPropose)} le jour`
                : "la Mutuelle Armorine a renouvelé",
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
