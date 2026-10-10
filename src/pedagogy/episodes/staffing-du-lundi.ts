/**
 * ÉPISODE 70 — LE STAFFING DU LUNDI, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Aïssatou montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  CHANCE_COOP_PART,
  CH,
  D,
  INSATISFACTION,
  JOURS_SANS_PERTE,
  NEUTRE,
  NOVEMBRE,
  OBJECTIF_OCCUPATION,
  PERTE_PAR_JOUR,
  PROPOSITIONS,
  PROSPECT,
  RETZ,
  SEMAINES,
  evenements,
  hasard,
  modeJuniors,
  prospectSigne,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/staffing-du-lundi";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  reponseProspect,
} from "@/config/episodes/staffing-du-lundi";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const HAUTECOEUR = { de: "Sosthène Hautecoeur", role: "Associé, Performance opérationnelle" };
const QUEMENEUR = { de: "Éléonore Quémeneur", role: "Associée, Organisation et transformation" };
const HAMELIN = { de: "Ladislas Hamelin", role: "Associé, Data et systèmes d'information" };
const LE_SCAO = { de: "Sterenn Le Scao", role: "Responsable des propositions" };
const LANOE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" };

const jours = (v: number) => `${nombre(v, 0)} j`;
const etp = (v: number) => `${nombre(v, 0)} ETP`;

/** Ce que les décisions révèlent, dans l'ordre où une responsable du staffing les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le détail du plan de charge et les fiches des missions",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    valeurRisque:
      "Votre diagnostic de la semaine 1 était juste : le staffing suivait l'ordre des demandes, et les seniors partaient là où ils comptaient le moins.",
    reservations:
      "En semaine 1, vous avez vu les réservations de précaution : une vraie cause de blocage, mais pas la principale. Le plus coûteux était de placer les seniors et les analystes dans l'ordre des demandes plutôt que selon le risque des missions.",
    seniors:
      "En semaine 1, vous avez retenu le manque de seniors ; le bureau en avait assez, mais les plaçait sur la mission simple plutôt que sur le forfait critique.",
    juniors:
      "En semaine 1, vous avez retenu les analystes non facturables ; en binôme, ils devenaient productifs en quelques semaines. C'est seuls qu'ils coûtaient.",
  };
  const justes = ["valeurRisque", "reservations"];
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
    score: d === "valeurRisque" ? 1 : d === "reservations" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais staffé dans l'ordre des demandes ni rempli l'intercontrat avec la première mission venue : chaque affectation a été pesée à la valeur et au risque de la mission."
        : `Vous avez donné aux associés ce qu'ils réclamaient, dans l'ordre de leurs demandes, ou rempli l'intercontrat avec la première mission venue, ${n} fois sur ${ETAPES.length} décisions.${
            t.crise
              ? " Le comité de pilotage du CH a tourné à la crise."
              : t.incidents > 0
                ? ` Des clients se sont plaints de ${t.incidents} analyste${t.incidents > 1 ? "s" : ""} placé${t.incidents > 1 ? "s" : ""} seul${t.incidents > 1 ? "s" : ""}.`
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.occupationPrevue * 100,
    "de taux d'occupation prévisible en octobre",
    "%",
    { juste: 1.5, proche: 4 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  // Chaque consultant là où il compte : les seniors sur le risque, les analystes en binôme,
  // l'intercontrat employé, les réservations vérifiées.
  const c = p.chemin;
  const seniors = (c[D.rentree] === 1 || c[D.rentree] === 2) && c[D.avenant] === 1;
  const analystes = (c[D.rentree] === 1 || c[D.rentree] === 2) && c[D.junior] === 1;
  const intercontrat = c[D.intercontrat] === 1 || c[D.intercontrat] === 2;
  const reservations = (c[D.reservation] === 1 || c[D.reservation] === 2) && c[D.restitution] === 1;
  const bons = [seniors, analystes, intercontrat, reservations].filter(Boolean).length;
  const valeur: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: [
      seniors
        ? "Vos seniors sont allés là où le risque était : le forfait du CH à la rentrée, l'avenant des urgences en novembre."
        : "Vos seniors ne sont pas toujours allés là où le risque était : un senior sur une mission simple, c'est un forfait critique tenu par quelqu'un d'autre.",
      analystes
        ? "Vos analystes ont grandi en binôme avant d'être lâchés."
        : "Des analystes ont été placés seuls sur des missions exigeantes : facturés à plein sur le papier, ils ont dépassé.",
      intercontrat
        ? "Vous avez employé le creux d'octobre à l'avant-vente ou à la formation."
        : "Le creux d'octobre n'a servi ni à l'avant-vente ni à la formation.",
      reservations
        ? "Vous n'avez pas laissé une réservation sans proposition bloquer une mission signée."
        : "Des réservations sans proposition remise ont bloqué des consultants.",
    ].join(" "),
  };

  return [information, diagnostic, reflexe, calibrage, valeur];
}

export function axe([information, diagnostic, reflexe, calibrage, valeur]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le plan de charge avant de staffer",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le détail de Tempora et les fiches des missions : les 91 % d'octobre comptaient 180 jours de réservations de précaution, et les fiches disaient ce qu'un senior évite sur un forfait hospitalier.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Affecter selon la valeur et le risque, pas l'ordre des demandes",
      texte:
        "Un senior vaut ce qu'il évite là où le risque est, pas son TJM. Sur Distrimer, il rapportait 250 € de plus par jour ; aux commandes du CH, il évitait près de 20 k€ de dépassements et un comité de crise une fois sur deux.",
    };
  }
  if (valeur!.score === 0) {
    return {
      titre: "Mettre chaque consultant là où il compte",
      texte:
        "Les seniors sur les missions critiques, les analystes en binôme avant d'être seuls, l'intercontrat à l'avant-vente ou à la formation, et aucune réservation sans proposition remise.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où le staffing perd de la valeur",
      texte:
        "Avant de manquer de monde, demandez-vous si les bonnes personnes sont aux bons endroits : un bureau peut perdre plus en plaçant mal ses seniors qu'en en manquant.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du plan de charge",
      texte:
        "786 jours signés, plus la moitié des 72 jours de propositions, sur 1 140 jours disponibles : 72,1 %. Les réservations de précaution n'y entrent pas : au printemps, aucune n'avait été facturée à la date prévue.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_STAFFING: Episode<Trimestre> = {
  code: "staffing-du-lundi",
  numero: 70,
  domaine: "Affecter les consultants",
  titre: "Le staffing du lundi",
  resume:
    "Soixante consultants, des associés qui veulent tous les meilleurs, huit analystes qui arrivent et un mois d'octobre qui paraît plein. Affecter selon la valeur et le risque, pas dans l'ordre des demandes.",
  persona:
    "Vous êtes Aïssatou Ndour, responsable du staffing du bureau de Nantes d'Atlas Conseil. Chaque lundi, vous affectez aux missions qui démarrent les soixante consultants du bureau, des analystes aux managers, sous la pression des associés qui veulent tous les meilleurs. Le trimestre couvre septembre, octobre et novembre : la rentrée, le creux d'octobre, le rush de fin d'année.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge des missions sur le trimestre" },
    { fort: taux(OBJECTIF_OCCUPATION, 0), texte: "de taux d'occupation des consultants" },
    { fort: "aucun forfait", texte: "critique en dérive" },
    { fort: "huit analystes", texte: "arrivés en septembre, facturables en novembre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge des missions du bureau (honoraires moins salaires, dépassements, indépendants, avoirs et pénalités), plus la valeur des propositions gagnées : la marge prévue des missions signées.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre bureau",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les missions de la rentrée démarrent sans équipe arrêtée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...LANOE,
        alerte: true,
        texte: `Pendant ce temps, Distrimer et le CH ont attendu leurs équipes : ${euros(perdu)} de jours non facturés et de démarrages repoussés.`,
      };
    },
  },
  prevision: {
    libelle: "le taux d'occupation prévisible du bureau en octobre (semaines 6 à 9), en %",
    unite: "%",
    placeholder: "75",
    min: 0,
    max: 100,
    step: 0.1,
    reel: (t) => t.occupationPrevue * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge des missions",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `jours facturés, sem. ${semaine} ; cible 75 %` : "fin août ; cible 75 %",
    },
    {
      cle: "intercontrat",
      nom: "Consultants en intercontrat",
      format: etp,
      sensBon: -1,
      aide: () => "sans mission facturable, en équivalents temps plein",
    },
    {
      cle: "depassements",
      nom: "Jours de dépassement",
      format: jours,
      sensBon: -1,
      aide: () => "sur les forfaits et les missions des analystes, depuis la rentrée",
    },
    {
      cle: "propositions",
      nom: "Propositions gagnées",
      format: kE,
      sensBon: 1,
      aide: () => "marge prévue des missions signées depuis la rentrée",
    },
  ],
  contexte(l, decisions) {
    const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
    return {
      marge: kE(l.marge ?? 0),
      occupation: taux(l.occupation ?? 0),
      intercontrat: etp(l.intercontrat ?? 0),
      crise: (l.crise ?? 0) > 0,
      autonomes: (l.autonomes ?? 0) > 0,
      rentree: modeJuniors(chemin),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.margeSemaine, 0);
    const avant = de > 1 ? t.semaines[de - 1]!.propositions : 0;
    return [
      ["Marge de la période", kE(marge)],
      [`Occupation, sem. ${a}`, taux(t.semaines[a]!.occupation)],
      ["Propositions gagnées", kE(t.semaines[a]!.propositions - avant)],
    ];
  },
  courbe: {
    titre: "Marge des missions, semaine par semaine",
    cle: "margeSemaine",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [0, 25000, 50000, 75000, 100000, 125000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.margeSemaine!)} · occupation ${taux(s.occupation!)}`,
      `${etp(s.intercontrat!)} en intercontrat · ${jours(s.depassements!)} de dépassement cumulés`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.reservation && choix === 0) {
      // La coopérative répond selon le hasard du trimestre.
      const part = hasard(graine).uCoop < CHANCE_COOP_PART;
      return [
        {
          de: "Mariannick Kerdoncuff",
          role: "Directrice supply chain, Coopérative laitière du Bocage",
          texte: part ? REPONSES.coopPart : REPONSES.coopAttend,
        },
      ];
    }
    if (etape === D.reservation && choix === 2) {
      // Ligériennes décide jeudi, quoi qu'on fasse : l'appel apprend sa réponse.
      return [reponseProspect(prospectSigne(graine))];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    for (const s of arrive.incidents) {
      lies.push({ ...LANOE, heure: `sem. ${s}`, alerte: true, texte: REPONSES.incident });
    }
    if (arrive.copil) {
      lies.push({
        ...QUEMENEUR,
        heure: `sem. ${CH.copil}`,
        alerte: arrive.crise,
        texte: arrive.crise ? REPONSES.copilCrise : REPONSES.copilBien,
      });
    }
    if (arrive.prospectPerdu) {
      lies.push({
        ...HAMELIN,
        heure: `sem. ${PROSPECT.de}`,
        alerte: true,
        texte: REPONSES.prospectPerdu,
      });
    }
    if (arrive.prospectSigne && (chemin[D.reservation] === 0 || chemin[D.reservation] === 3)) {
      lies.push({
        ...HAMELIN,
        heure: `sem. ${PROSPECT.de}`,
        texte:
          "Ligériennes a signé : mes trois confirmés démarrent lundi. Tu vois, j'avais raison de les garder.",
      });
    }
    for (const prop of arrive.propositions) {
      lies.push({
        ...LE_SCAO,
        heure: `sem. ${prop.semaine}`,
        texte: prop.gagnee
          ? `${prop.client} nous retient pour ${prop.objet} : ${kE(prop.montant)} signés.`
          : `${prop.client} a retenu un concurrent pour ${prop.objet}.`,
      });
    }
    if (chemin[D.intercontrat] === 0 && de <= NOVEMBRE && a >= NOVEMBRE) {
      lies.push({
        de: "Prune Lecoeur",
        role: "Contrôleuse de gestion",
        heure: `sem. ${NOVEMBRE}`,
        texte: REPONSES.halden,
      });
    }
    if (arrive.retzDerape) {
      lies.push({
        de: "Jacinthe Lostanlen",
        role: "Directrice générale adjointe, Pays de Retz",
        heure: `sem. ${RETZ.semaineDerapage}`,
        alerte: true,
        texte: REPONSES.retzDerape,
      });
    } else if (chemin[D.junior] !== 2 && !t.retzDerape && de <= SEMAINES && a >= SEMAINES) {
      lies.push({
        de: "Jacinthe Lostanlen",
        role: "Directrice générale adjointe, Pays de Retz",
        heure: `sem. ${SEMAINES}`,
        texte: REPONSES.retzTient,
      });
    }
    if (arrive.distrimerMecontent) {
      lies.push({
        ...HAUTECOEUR,
        heure: `sem. ${INSATISFACTION.semaine}`,
        alerte: true,
        texte: REPONSES.distrimerMecontent,
      });
    }
    if (arrive.tranche) {
      lies.push({
        ...QUEMENEUR,
        heure: `sem. ${SEMAINES}`,
        alerte: !t.trancheAffermie,
        texte: t.trancheAffermie ? REPONSES.trancheAffermie : REPONSES.trancheRefusee,
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
    titre: (t) => `${kE(t.objectif)} de marge et de propositions gagnées`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge des missions du bureau, plus la valeur des propositions gagnées, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge des missions",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)} ; occupation moyenne ${taux(t.occupationMoyenne)}`,
          tenu: t.marge >= BUDGET,
        },
        {
          nom: "Propositions gagnées",
          valeur: kE(t.propositions),
          aide: t.gagnees.length
            ? `${t.gagnees.length} proposition${t.gagnees.length > 1 ? "s" : ""} sur ${PROPOSITIONS.length}, en marge prévue`
            : "aucune des trois propositions",
          tenu: t.gagnees.length >= 2,
        },
        {
          nom: "Centre hospitalier",
          valeur: t.trancheAffermie ? "tranche affermie" : "tranche perdue",
          aide: t.crise ? "après un comité de pilotage de crise" : "sans comité de crise",
          tenu: t.trancheAffermie && !t.crise,
        },
        {
          nom: "Analystes de septembre",
          valeur: t.autonomes ? "autonomes" : `${t.incidents} plainte${t.incidents > 1 ? "s" : ""}`,
          aide: t.autonomes
            ? "formés en binôme, ils tiennent une mission en novembre"
            : "placés seuls, aucun n'est prêt à tenir une mission",
          tenu: t.autonomes && t.incidents === 0 && !t.retzDerape,
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
        {
          titre: "Les clients",
          texte: [
            t.prospectSigne
              ? "Assurances Ligériennes a signé en semaine 7"
              : "Assurances Ligériennes a repoussé son programme à janvier",
            h.uCoop < CHANCE_COOP_PART
              ? "la coopérative n'aurait pas attendu novembre"
              : "la coopérative aurait attendu novembre",
            t.gagnees.length
              ? `gagné : ${PROPOSITIONS.filter((x) => t.gagnees.includes(x.id))
                  .map((x) => x.client)
                  .join(", ")}`
              : "aucune proposition gagnée",
          ]
            .join(", ")
            .concat("."),
        },
        {
          titre: "Les missions",
          texte: [
            t.crise
              ? "le comité de pilotage du CH a tourné à la crise en semaine 7"
              : "le comité de pilotage du CH s'est bien passé",
            t.incidents
              ? `${t.incidents} client${t.incidents > 1 ? "s se sont plaints" : " s'est plaint"} d'un analyste seul`
              : "aucun client ne s'est plaint d'un analyste",
            t.retzDerape ? "le livrable du Pays de Retz a été refusé" : null,
            t.distrimerMecontent ? "Distrimer a demandé un geste" : null,
            t.trancheAffermie
              ? "le directoire a affermi la tranche optionnelle"
              : "le directoire n'a pas affermi la tranche optionnelle",
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
