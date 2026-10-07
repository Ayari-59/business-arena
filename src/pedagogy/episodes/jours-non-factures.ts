/**
 * ÉPISODE 67 — LES JOURS QU'ON NE FACTURE PAS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Clélia montre — le taux
 * d'occupation à côté du taux de réalisation, et le TJM moyen qui monte pour
 * de mauvaises raisons —, ce que la courbe trace, ce sur quoi le bilan la
 * juge, et ce que ses décisions révèlent d'elle.
 */
import {
  BUDGET_MARGE,
  D,
  JOURS_SANS_PERTE,
  KERVALAN,
  MARS,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEMAINES,
  avenantSigne,
  erdreAccepteCatalogue,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  talvenecAccepte,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/jours-non-factures";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/jours-non-factures";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 0)} jour${Math.round(v) >= 2 ? "s" : ""}`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** La semaine d'un événement, écrite comme le joueur la lit. */
const sem = (w: number) => `semaine ${Math.ceil(w)}`;

const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const FANCH = {
  de: "Fañch Kerros",
  role: "Acheteur, centre hospitalier de Kervalan",
} as const;
const LENAIG = { de: "Lénaïg Quilliec", role: "Manager, mission Kervalan" } as const;
const TANGI = { de: "Tangi Benedetti", role: "Manager, mission Montlouvel" } as const;
const OIHANA = { de: "Oïhana Larralde", role: "Manager, mission Talvenec" } as const;
const WIEBKE = { de: "Wiebke Hansel", role: "Achats de prestations, Banque de l'Erdre" } as const;
const ZAKARIA = {
  de: "Zakaria Bellouti",
  role: "Directeur supply chain, Talvenec Emballages",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où une directrice des opérations les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient les jours facturés et les restes à faire mission par mission",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    forfaits:
      "Votre diagnostic de la semaine 1 était juste : trois forfaits sous-estimés faisaient passer des jours que personne ne payait. L'occupation les comptait, la réalisation les montrait.",
    kervalan:
      "En semaine 1, vous avez vu Kervalan : la plus grosse dérive, mais pas la seule. Montlouvel et Talvenec faisaient l'autre moitié des jours non facturés des trois missions.",
    banc: "En semaine 1, vous avez retenu le banc ; l'occupation était pourtant la plus haute depuis deux ans. Ce qui manquait, c'étaient des jours facturés, pas des jours staffés.",
    prix: "En semaine 1, vous avez retenu les prix ; à grade égal, les TJM tenaient, et les missions saines dégageaient leur marge. Le trou venait des jours passés au-delà des jours vendus.",
  };
  const justes = ["forfaits", "kervalan"];
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
    score: d === "forfaits" ? 1 : d === "kervalan" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais piloté à l'occupation : ni renforts sur des missions déjà dépassées, ni hausse de prix sur la foi du TJM moyen, ni forfait au prix du client pour occuper l'équipe."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} ce qui fait monter l'occupation ou ce que disait le TJM moyen : renforts sur des missions dépassées, prix relevés, forfaits au prix du client. Sur le trimestre, l'occupation a été de ${taux(t.occupation)}, et ${jours(t.nonFactures)} passés en mission n'ont pas été facturés.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.realisationMars,
    "de taux de réalisation en mars",
    "%",
    { juste: 0.5, proche: 2 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const missions =
    (p.chemin[D.marge] === 1 ? 1 : p.chemin[D.marge] === 2 ? 0.5 : 0) +
    (p.chemin[D.kervalan] === 1 || p.chemin[D.kervalan] === 2 ? 1 : 0) +
    (p.chemin[D.banc] === 1 || p.chemin[D.banc] === 2 ? 1 : 0);
  const forfaits =
    (p.chemin[D.prix] === 1 ? 1 : p.chemin[D.prix] === 2 ? 0.5 : 0) +
    (p.chemin[D.talvenec] === 1 ? 1 : p.chemin[D.talvenec] === 2 ? 0.5 : 0) +
    (p.chemin[D.phase2] === 2 ? 1 : p.chemin[D.phase2] === 1 ? 0.5 : 0);
  const domaine: Constat = {
    score: (missions + forfaits) / 6,
    texte: `${
      missions >= 2.5
        ? "Vous avez agi sur les missions qui dérapaient : recentrées, le hors-périmètre payé ou arrêté, et le banc vendu plutôt que mis en renfort."
        : missions >= 1
          ? "Vous avez agi sur une partie des missions qui dérapaient, pas sur toutes."
          : "Les missions qui dérapaient ont continué de dériver : personne n'a repris leur reste à faire."
    } ${
      forfaits >= 2.5
        ? "Et vous avez vendu les forfaits sur ce qu'ils coûtent vraiment."
        : forfaits >= 1
          ? "Les forfaits, vous les avez en partie chiffrés sur le réalisé."
          : "Les forfaits sont partis au prix du client ou au chiffrage habituel : les jours non facturés de demain."
    } Taux de réalisation du trimestre : ${taux(t.realisation)}, contre ${taux(MARS.realisation)} en mars.`,
  };

  return [information, diagnostic, reflexe, calibrage, domaine];
}

export function axe([information, diagnostic, reflexe, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire les jours facturés, pas les jours staffés",
      texte:
        "Rejouez l'épisode en ouvrant d'abord Tempora et les restes à faire : le bureau facturait 85 % des jours qu'il passait en mission, et trois forfaits faisaient plus de neuf jours non facturés sur dix.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas piloter à l'occupation",
      texte:
        "Un consultant occupé sur une mission au forfait déjà dépassée ne rapporte rien, et coûte des frais et du temps de manager. Regardez la réalisation et la marge mission par mission avant de staffer, et le TJM grade par grade avant d'y croire.",
    };
  }
  if (domaine!.score < 0.5) {
    return {
      titre: "Agir sur les missions qui dérapent, et sur la façon de vendre",
      texte:
        "Recentrez une mission dépassée sur son cahier des charges, faites payer le hors-périmètre, vendez le banc en régie plutôt qu'en renfort ; et chiffrez les forfaits sur le réalisé des missions comparables, ou recoupez le périmètre au budget.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où sont les jours non facturés",
      texte:
        "Une moyenne cache souvent deux ou trois missions. Classez les missions par jours non facturés : celles qui font le trou sont rarement celles dont on parle le plus.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la réalisation",
      texte:
        "Le taux de réalisation se calcule sur les jours passés, pas sur les jours disponibles : (320 + 408 + 60 + 55 + 75) ÷ 1 080 = 85,0 %. Rapporté aux 1 500 jours disponibles, c'est le taux de facturation : 61,2 %.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_REALISATION: Episode<Trimestre> = {
  code: "jours-non-factures",
  numero: 67,
  domaine: "Piloter la marge des missions",
  titre: "Les jours qu'on ne facture pas",
  resume:
    "Un bureau de conseil occupé comme jamais, et une marge qui baisse. Lire la réalisation mission par mission, plutôt que pousser l'occupation.",
  persona:
    "Vous êtes Clélia Kerhervé, directrice des opérations d'Atlas Conseil au bureau de Nantes, le siège du cabinet. Vous pilotez le staffing et la marge des missions de 75 consultants facturables : 45 analystes et consultants, 30 consultants seniors, managers et directeurs, en régie et au forfait, pour des industriels, des banques, des collectivités et des hôpitaux.",
  mandat: [
    { fort: "75 %", texte: "de taux d'occupation : la cible du cabinet" },
    { fort: "95 %", texte: "de taux de réalisation sur les missions" },
    { fort: kE(BUDGET_MARGE), texte: "de marge des missions au budget du trimestre" },
    { fort: "720 € et 1 080 €", texte: "de TJM catalogue, juniors et seniors" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge des missions du bureau : les honoraires gagnés, moins le coût de tous les consultants (intercontrat compris), la sous-traitance, les frais non refacturés et les pénalités.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre bureau",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les missions qui dérapent continuent de passer des jours que personne ne paiera.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...PRUNE,
        alerte: true,
        texte: `Pendant que vous enquêtiez, les trois missions ont continué leur hors-périmètre : ${euros(perdu)} de frais et de jours non facturés.`,
      };
    },
  },
  prevision: {
    libelle: "le taux de réalisation du bureau en mars, en % (jours facturés ÷ jours passés)",
    unite: "%",
    placeholder: "80,0",
    min: 0,
    max: 100,
    step: 0.1,
    reel: (t) => t.realisationMars,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "jours staffés ÷ jours disponibles ; cible 75 %" : "en mars ; cible 75 %",
    },
    {
      cle: "realisation",
      nom: "Taux de réalisation",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "jours facturés ÷ jours passés ; cible 95 %" : "en mars ; cible 95 %",
    },
    {
      cle: "tjm",
      nom: "TJM moyen facturé",
      format: euros,
      sensBon: 1,
      aide: () => `honoraires ÷ jours facturés ; il y a un an : ${euros(MARS.tjmAnDernier)}`,
    },
    {
      cle: "marge",
      nom: "Marge des missions",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `cumulée ; budget à date : ${kE(l.budgetADate ?? 0)}`
          : `budget du trimestre : ${kE(BUDGET_MARGE)}`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.max(0, Math.min(1, (l.marge ?? 0) / BUDGET_MARGE)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "nonFactures",
      nom: "Jours non facturés",
      format: jours,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "passés en mission, cumulés depuis avril"
          : `en mars : ${nombre(MARS.nonFactures, 0)} jours`,
    },
  ],
  contexte(l, decisions) {
    const fin = l.finKervalan ?? 0;
    const echeance = l.echeanceKervalan ?? KERVALAN.echeance;
    return {
      occupation: taux(l.occupation ?? 0),
      realisation: taux(l.realisation ?? 0),
      tjm: euros(l.tjm ?? 0),
      marge: kE(l.marge ?? 0),
      bancJuniors: nombre(Math.max(0, l.bancJuniors ?? 0), 0),
      rafKervalan: jours(l.rafKervalan ?? 0),
      trace: decisions[D.marge] === 1 || decisions[D.marge] === 2,
      retard: fin > echeance || (fin === 0 && SEMAINES - 2 >= echeance),
      kervalanEtat:
        fin > 0
          ? fin > echeance
            ? `Le schéma directeur a été remis en ${sem(fin)}, après le comité de la semaine ${echeance}.`
            : `Le schéma directeur a été remis en ${sem(fin)}, à temps pour le comité.`
          : `Le schéma directeur n'est pas encore remis : il reste ${jours(l.rafKervalan ?? 0)}, et le comité était en semaine ${echeance}.`,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Réalisation, sem. ${a}`, taux(t.semaines[a]!.realisation)],
      [`Occupation, sem. ${a}`, taux(t.semaines[a]!.occupation)],
      ["Marge de la période", kE(semaines.reduce((x, w) => x + w.marge, 0))],
    ];
  },
  courbe: {
    titre: "Taux de réalisation, semaine par semaine",
    cle: "realisation",
    cible: 0.95,
    libelleCible: "cible : 95 %",
    graduations: [0.6, 0.7, 0.8, 0.9, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `réalisation ${taux(s.realisation!)} · occupation ${taux(s.occupation!)}`,
      `${nombre(s.passes! - s.factures!, 0)} jours non facturés · marge ${kE(s.marge!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.banc && choix === 2) {
      const oui = erdreAccepteCatalogue(graine);
      return [
        { ...WIEBKE, alerte: !oui, texte: oui ? REPONSES.erdreCatalogue : REPONSES.erdreRefuse },
      ];
    }
    if (etape === D.talvenec && (choix === 1 || choix === 2)) {
      const oui = talvenecAccepte(choix, graine);
      const texte =
        choix === 1
          ? oui
            ? REPONSES.talvenecRechiffreOui
            : REPONSES.talvenecRechiffreNon
          : oui
            ? REPONSES.talvenecRegieOui
            : REPONSES.talvenecRegieNon;
      return [{ ...ZAKARIA, alerte: !oui, texte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.avenant) {
      const oui = avenantSigne(chemin, graine);
      lies.push({
        ...FANCH,
        heure: "sem. 4",
        alerte: !oui,
        texte: oui ? REPONSES.avenantSigne : REPONSES.avenantRefuse,
      });
    }
    if (arrive.finTalvenec) {
      lies.push({
        ...OIHANA,
        heure: `sem. ${Math.ceil(t.fin.talvenec)}`,
        texte:
          "Talvenec est terminé : le diagnostic et le schéma logistique sont livrés. L'équipe revient au bureau.",
      });
    }
    if (arrive.finMontlouvel) {
      lies.push({
        ...TANGI,
        heure: `sem. ${Math.ceil(t.fin.montlouvel)}`,
        texte:
          "Montlouvel est terminé : le plan de transformation est passé en conseil communautaire. L'équipe revient au bureau.",
      });
    }
    if (arrive.finKervalan) {
      const echeance = avenantSigne(chemin, graine) ? KERVALAN.echeanceAvenant : KERVALAN.echeance;
      const enRetard = t.fin.kervalan > echeance;
      lies.push({
        ...LENAIG,
        heure: `sem. ${Math.ceil(t.fin.kervalan)}`,
        alerte: enRetard,
        texte: enRetard
          ? `Le schéma directeur est remis, après le comité de la semaine ${echeance}. Le CHU a dû décaler sa séance.`
          : "Le schéma directeur est remis, à temps pour le comité de pilotage. Le directeur du CHU l'a présenté lui-même.",
      });
    }
    if (arrive.penalites) {
      lies.push({
        ...FANCH,
        heure: `sem. ${Math.min(SEMAINES, Math.ceil(t.fin.kervalan))}`,
        alerte: true,
        texte: `${REPONSES.penalites} Montant : ${euros(t.penalites)}.`,
      });
    }
    if (arrive.phase2) {
      lies.push({
        ...FANCH,
        heure: "sem. 12",
        alerte: t.phase2 === "refuse",
        texte: t.phase2 === "accepte" ? REPONSES.phase2Oui : REPONSES.phase2Non,
      });
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
    titre: (t) =>
      `Marge des missions : ${kE(t.objectif)}, ${
        t.objectif >= BUDGET_MARGE
          ? `au-dessus du budget de ${kE(BUDGET_MARGE)}`
          : `sous le budget de ${kE(BUDGET_MARGE)}`
      }`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge des missions du bureau, intercontrat, sous-traitance, frais et pénalités compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const echeance = t.avenant === "signe" ? KERVALAN.echeanceAvenant : KERVALAN.echeance;
      return [
        {
          nom: "Marge des missions",
          valeur: kE(t.objectif),
          aide: `budget ${kE(BUDGET_MARGE)} ; salaires ${kE(t.salaires)}`,
          tenu: t.objectif >= BUDGET_MARGE,
        },
        {
          nom: "Taux de réalisation",
          valeur: taux(t.realisation),
          aide: `sur le trimestre ; ${taux(MARS.realisation)} en mars, cible 95 %`,
          tenu: t.realisation >= 0.9,
        },
        {
          nom: "Taux d'occupation",
          valeur: taux(t.occupation),
          aide: `sur le trimestre ; ${jours(t.nonFactures)} non facturés`,
          tenu: t.occupation >= 0.72 && t.realisation >= 0.9,
        },
        {
          nom: "Kervalan",
          valeur: t.fin.kervalan > SEMAINES ? "pas remis" : `remis en ${sem(t.fin.kervalan)}`,
          aide: t.penalitesAppliquees
            ? `pénalités de retard : ${euros(t.penalites)}`
            : t.fin.kervalan > echeance
              ? `après le comité de la semaine ${echeance}`
              : `comité de la semaine ${echeance}`,
          tenu: t.fin.kervalan <= echeance,
        },
      ];
    },
    hasard(t, graine) {
      const avenant =
        t.avenant === null
          ? []
          : [
              {
                titre: "Le CHU de Kervalan",
                texte:
                  t.avenant === "signe"
                    ? "a signé l'avenant du hors-périmètre : 33,6 k€."
                    : "a refusé l'avenant : rien n'était écrit, le hors-périmètre commencé a dû être terminé.",
              },
            ];
      const erdre =
        t.erdre === "catalogue" || t.erdre === "refuse"
          ? [
              {
                titre: "La Banque de l'Erdre",
                texte:
                  t.erdre === "catalogue"
                    ? "a accepté le TJM catalogue de 720 €."
                    : "a refusé le TJM catalogue et pris un autre cabinet.",
              },
            ]
          : [];
      const talvenec =
        t.talvenec === null
          ? []
          : [
              {
                titre: "Talvenec",
                texte:
                  t.talvenec === "accepte"
                    ? "a signé le déploiement."
                    : "a refusé la proposition et fait le déploiement en interne.",
              },
            ];
      const phase2 =
        t.phase2 === null
          ? []
          : [
              {
                titre: "La phase 2 de Kervalan",
                texte: t.phase2 === "accepte" ? "a été commandée." : "n'a pas été retenue.",
              },
            ];
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        ...avenant,
        ...erdre,
        ...talvenec,
        ...phase2,
        {
          titre: "Les missions",
          texte: [
            `Talvenec s'est terminé en ${sem(t.fin.talvenec)}`,
            t.fin.montlouvel <= SEMAINES
              ? `Montlouvel en ${sem(t.fin.montlouvel)}`
              : "Montlouvel n'était pas fini en juin",
            t.fin.kervalan <= SEMAINES
              ? `Kervalan en ${sem(t.fin.kervalan)}${t.penalitesAppliquees ? ", avec des pénalités de retard" : t.kervalanEnRetard ? ", en retard mais sans pénalités" : ""}`
              : "Kervalan n'était pas remis en juin",
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
