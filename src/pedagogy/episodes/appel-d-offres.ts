/**
 * ÉPISODE 16 — L'APPEL D'OFFRES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Vincent montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Le tableau de bord montre ce qu'un responsable grands comptes suit pendant
 * une consultation : la charge de son équipe, les devis de ses clients en
 * place qui attendent, l'avancement du dossier, ce que les réponses coûtent
 * et ce qui est signé. La note de Balmes, elle, n'apparaît qu'à
 * l'attribution.
 */
import {
  CAPACITE,
  COURANT,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF,
  PERTE_PAR_JOUR,
  PLANCHER,
  connaitSites,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/appel-d-offres";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/appel-d-offres";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pourcent = (v: number) => taux(v, 0);
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart à l'objectif de la direction : positif, l'équipe a fait mieux. */
const ecartObjectif = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus de l'objectif` : `${kE(-v)} sous l'objectif`;
const rangEn = (r: number) => (r === 1 ? "1re" : `${r}e`);

/** Ce que les décisions révèlent, dans l'ordre où un responsable grands comptes les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où se gagnait le marché et ce que l'équipe pouvait porter",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    grille:
      "Votre diagnostic de la semaine 1 était juste : 60 points sur 100 se jouaient sur la valeur technique, et l'équipe n'avait de jours que pour un grand dossier.",
    charge:
      "En semaine 1, vous avez vu que l'équipe était pleine : une vraie contrainte, mais la réponse était de choisir ses dossiers, pas d'ajouter du monde pour tout faire.",
    prix: "En semaine 1, vous avez cru que tout se jouerait sur le prix ; la grille en donnait 60 % à la valeur technique.",
    sortant:
      "En semaine 1, vous avez cru le sortant indélogeable ; ses livraisons au pied des immeubles agaçaient le bailleur, et sa note technique n'était pas acquise.",
  };
  const justes = ["grille", "charge"];
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
    score: d === "grille" ? 1 : d === "charge" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez ni répondu à tout, ni acheté des points en baissant le prix : vous avez choisi vos dossiers et tenu votre plancher."
        : `Sous la pression des consultations, vous avez répondu à tout ou baissé le prix pour gagner ${n} fois. ${
            t.balmes.gagne && t.balmes.marge < PLANCHER
              ? `Balmes est gagné à ${taux(t.balmes.marge)} de marge nette, sous le plancher : trois ans de travail pour rien, ou à perte.`
              : "Chaque point de remise se paie sur toute la durée d'un marché ; chaque dossier de trop se paie sur ceux qui comptent."
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.charge * 100,
    "de charge de l'équipe en semaine 3",
    "%",
    { juste: 8, proche: 20 },
    (e) => `${nombre(e, 0)} point${e >= 2 ? "s" : ""}`,
  );

  const questions = p.chemin[D.questions] === 1;
  const memoire = p.chemin[D.memoire] === 1;
  const lus = (questions ? 1 : 0) + (memoire ? 1 : 0);
  const memoires: Record<number, string> = {
    0: "Votre mémoire type ne répondait à aucun des critères",
    1: "Votre mémoire a répondu critère par critère",
    2: "Votre dossier de cent vingt pages montrait tout, sans répondre aux critères",
    3: "Votre mémoire, écrit par un cabinet, est resté général",
  };
  const grille: Constat = {
    score: lus === 2 ? 1 : lus === 1 ? 0.6 : 0,
    texte: `${
      questions
        ? "Vous avez interrogé Balmes pendant la consultation : la part de logements occupés et les sous-critères ont guidé le mémoire et le prix."
        : "Vous n'avez pas posé à Balmes les questions qui disaient ce qu'elle note et ce que coûteraient ses chantiers."
    } ${memoires[p.chemin[D.memoire] ?? 0] ?? ""} : ${nombre(t.balmes.technique, 0)} points sur 60 en valeur technique.`,
  };

  return [information, diagnostic, reflexe, calibrage, grille];
}

export function axe([information, diagnostic, reflexe, calibrage, grille]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire la grille et compter ses jours",
      texte:
        "Rejouez l'épisode en lisant d'abord le règlement de consultation et le plan de charge : 60 points sur 100 se jouaient sur la valeur technique, et l'équipe n'avait que six jours par semaine pour les offres.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Choisir ses combats, et tenir son prix",
      texte:
        "Répondre à tout dilue l'effort, et baisser le prix achète des points au prix fort : chaque point de remise se paie pendant toute la durée du marché. Qualifiez les consultations, puis défendez une offre au-dessus de votre plancher.",
    };
  }
  if (grille!.score === 0) {
    return {
      titre: "Gagner les points là où ils coûtent le moins",
      texte:
        "Posez vos questions à l'acheteur et répondez à la grille critère par critère : une douzaine de points techniques coûtent quelques jours de travail ; les mêmes points en prix coûteraient quinze points de remise.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où se gagne le marché",
      texte:
        "Avant de chiffrer, lisez ce que l'acheteur note et comptez ce que votre équipe peut porter : c'est là que se décide une réponse.",
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

const SOLENE = { de: "Margot Kerguelen", role: "Responsable des marchés, Balmes Habitat" } as const;
const FREDERIC = { de: "Frédéric Vautrin", role: "Acheteur, Groupe Vauclair" } as const;
const LINH = { de: "Linh Pham", role: "Chargée d'études de prix" } as const;
const LEILA = { de: "Leïla Ouazzani", role: "Chargée d'affaires" } as const;

/** Ce que Balmes écrit à l'attribution. */
function attribution(t: Trimestre): string {
  const b = t.balmes;
  const note = `${nombre(b.note, 1)}/100, dont ${nombre(b.technique, 1)}/60 en valeur technique et ${nombre(b.notePrix, 1)}/40 pour le prix`;
  return b.gagne
    ? `Le marché vous est attribué. Votre note : ${note}. Le candidat suivant a obtenu ${nombre(b.noteConcurrent, 1)}/100.`
    : `Le marché est attribué à ${b.laureat}, avec ${nombre(b.noteConcurrent, 1)}/100. Votre offre est classée ${rangEn(b.rang)} : ${note}.`;
}

export const EPISODE_APPEL_OFFRES: Episode<Trimestre> = {
  code: "appel-d-offres",
  numero: 3,
  domaine: "Réponse aux appels d'offres",
  titre: "L'appel d'offres",
  resume:
    "Un appel d'offres de trois ans, deux autres consultations, une équipe déjà pleine. Choisir ses combats, gagner les points là où ils coûtent le moins, et tenir son prix.",
  persona:
    "Vous êtes Vincent Lambertin, responsable grands comptes d'Arvel Distribution, à Lyon. Votre équipe : Leïla Ouazzani et Maxence Tissot, chargés d'affaires, et Linh Pham, chargée d'études de prix. Ensemble, vous suivez quatorze grands comptes — entreprises générales, bailleurs, collectivités — et vous répondez à leurs consultations.",
  mandat: [
    { fort: "2,4 M€", texte: "de chiffre d'affaires sur trois ans : le marché Balmes Habitat" },
    { fort: "4 semaines", texte: "pour répondre : remise le vendredi de la semaine 5" },
    {
      fort: `${CAPACITE - COURANT} jours`,
      texte: "par semaine pour les offres, une fois les clients en place servis",
    },
    { fort: kE(OBJECTIF), texte: "de marge nouvelle attendue, nette des frais de réponse" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge des marchés gagnés — sur toute leur durée, actualisée — moins le coût de préparation des réponses et ce que la surcharge a coûté aux clients en place, en écart à l'objectif.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre équipe",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les devis des clients en place attendent et le dossier Balmes prend du retard.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...FREDERIC,
        alerte: true,
        texte: `Pendant ce temps, faute de devis, un conducteur de travaux de Vauclair a commandé chez un confrère : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "la charge de l'équipe en semaine 3, en % de sa capacité",
    unite: "%",
    placeholder: "100",
    min: 0,
    max: 250,
    step: 5,
    reel: (t) => t.semaines[3]!.charge * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "charge",
      nom: "Charge de l'équipe",
      format: pourcent,
      formatEcart: points,
      sensBon: -1,
      aide: () => `${CAPACITE} jours par semaine, dont ${COURANT} pour les clients en place`,
    },
    {
      cle: "devis",
      nom: "Devis clients en attente",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine ? `clients en place, fin de semaine ${semaine}` : "clients en place, ce matin",
    },
    {
      cle: "dossier",
      nom: "Dossier Balmes Habitat",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= 5 ? "déposé ; attribution en semaine 10" : "remise le vendredi de la semaine 5",
      jauge: (l) =>
        l.dossier == null
          ? null
          : { part: Math.min(1, l.dossier), enRetard: l.dossier < 0.6 && (l.prepa ?? 0) > 0 },
    },
    {
      cle: "prepa",
      nom: "Coûts de préparation",
      format: kE,
      sensBon: -1,
      aide: () => "jours passés aux offres et frais engagés",
    },
    {
      cle: "signe",
      nom: "Marge signée",
      format: kE,
      sensBon: 1,
      aide: () => "sur la durée des marchés gagnés, actualisée",
    },
  ],
  contexte(l, decisions) {
    const surcharge = l.surchargeTotale ?? 0;
    const marge = l.marge ?? 0;
    return {
      charge: pourcent(l.charge ?? 0),
      devis: nombre(l.devis ?? 0, 0),
      dossier: pourcent(l.dossier ?? 0),
      prepa: kE(l.prepa ?? 0),
      grille: decisions[D.questions] === 1,
      sites: l.sites === 1,
      deborde: surcharge >= 2,
      neglige: surcharge >= 3,
      devisRetard: Math.max(4, Math.round(3 * surcharge)),
      marge: taux(marge),
      margeApres: taux(marge - 0.05 * (l.prix ?? 1)),
      balmesGagne: l.balmes === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const resultat = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`Charge, sem. ${a}`, pourcent(t.semaines[a]!.charge)],
      [`Devis en attente, sem. ${a}`, nombre(t.semaines[a]!.devis, 0)],
      ["Résultat de la période", kE(resultat)],
    ];
  },
  courbe: {
    titre: "Charge de l'équipe, semaine par semaine",
    cle: "charge",
    cible: 1,
    libelleCible: `capacité : ${CAPACITE} jours par semaine`,
    graduations: [0.5, 1, 1.5],
    format: pourcent,
    details: (s) => [
      `charge ${pourcent(s.charge!)} · ${nombre(s.surcharge!, 1)} j de surcharge`,
      `${nombre(s.devis!, 0)} devis en attente · résultat à date ${kE(s.cumul!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.questions && choix === 3) {
      // Seule l'attente compte : les autres candidats posent la question, ou non, selon le hasard.
      const publiees = connaitSites([...NEUTRE.slice(0, D.questions), 3], graine);
      return [
        {
          de: "Plateforme des marchés",
          role: "Réponses aux candidats",
          texte: publiees ? REPONSES.publieesSites : REPONSES.publieesRien,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.surcharge !== null) {
      lies.push({
        de: "Conducteur de travaux",
        role: "Groupe Vauclair",
        heure: `sem. ${arrive.surcharge}`,
        alerte: true,
        texte: REPONSES.surcharge,
      });
    }
    if (arrive.ardanel) {
      lies.push({
        de: "Fabrice Teillard",
        role: "Acheteur, Maisons Ardanel",
        heure: "sem. 6",
        texte: arrive.ardanel === "gagne" ? REPONSES.ardanelGagne : REPONSES.ardanelPerdu,
      });
    }
    if (arrive.garon) {
      lies.push({
        de: "Ornella Tardieu",
        role: "Responsable des achats, syndicat du Haut-Garon",
        heure: "sem. 8",
        texte: arrive.garon === "gagne" ? REPONSES.garonGagne : REPONSES.garonPerdu,
      });
    }
    if (arrive.erreur) {
      lies.push({ ...LINH, heure: "sem. 8", alerte: true, texte: REPONSES.erreur });
    }
    if (arrive.balmes) {
      lies.push({ ...SOLENE, heure: "sem. 10", alerte: true, texte: attribution(t) });
    }
    if (arrive.surcout) {
      lies.push({ ...LEILA, heure: "sem. 11", alerte: true, texte: REPONSES.surcout });
    }
    if (arrive.vauclair) {
      const choix = chemin[D.vauclair];
      const texte =
        arrive.vauclair === "part"
          ? REPONSES.vauclairPart
          : choix === 3
            ? REPONSES.vauclairResteRemise
            : choix === 2
              ? REPONSES.vauclairResteFerme
              : REPONSES.vauclairResteRevue;
      lies.push({
        ...(choix === 3 && arrive.vauclair === "reste"
          ? { de: "Maxence Tissot", role: "Chargé d'affaires" }
          : FREDERIC),
        heure: "sem. 12",
        alerte: arrive.vauclair === "part",
        texte,
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
    titre: (t) => `${ecartObjectif(t.objectif)}, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart à l'objectif de la direction — marge des marchés gagnés sur leur durée, actualisée, moins le coût des réponses et ce que la surcharge a coûté aux clients en place — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const b = t.balmes;
      const net = t.signe - t.prepa - t.pertes;
      return [
        {
          nom: "Balmes Habitat",
          valeur: b.gagne ? `Gagné, ${nombre(b.note, 0)}/100` : `Perdu, ${rangEn(b.rang)}`,
          aide: b.gagne
            ? `marge nette ${taux(b.marge)} ; plancher ${taux(PLANCHER, 0)}`
            : `attribué à ${b.laureat}`,
          tenu: b.gagne && b.marge >= PLANCHER,
        },
        {
          nom: "Marge nouvelle, nette",
          valeur: kE(net),
          aide: `signée, moins réponses et pertes ; objectif ${kE(OBJECTIF)}`,
          tenu: net >= OBJECTIF,
        },
        {
          nom: "Devis en attente",
          valeur: nombre(t.devisMax, 0),
          aide: "au plus fort du trimestre ; tolérance 10",
          tenu: t.devisMax <= 10,
        },
        {
          nom: "Groupe Vauclair",
          valeur:
            t.vauclair === "part" ? "Perdu" : t.vauclair === "aligne" ? "Gardé à −5 %" : "Gardé",
          aide: "premier compte de l'équipe",
          tenu: t.vauclair === "reste",
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const consultations = [
        t.ardanel ? `Ardanel ${t.ardanel === "gagne" ? "gagné" : "perdu"}` : null,
        t.garon ? `Haut-Garon ${t.garon === "gagne" ? "gagné" : "perdu"}` : null,
        `Balmes ${t.balmes.gagne ? "gagné" : `attribué à ${t.balmes.laureat}`}`,
      ].filter(Boolean);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les concurrents",
          texte: `Gabriac a obtenu ${nombre(h.gabriac.technique, 0)} sur 60 en valeur technique et lâché ${taux(h.gabriac.concession)} en négociation ; Grandval, ${nombre(h.grandval.technique, 0)} sur 60, et ${taux(h.grandval.concession)}.`,
        },
        {
          titre: "Les consultations",
          texte: `${consultations.join(", ")}.`,
        },
        {
          titre: "L'équipe et les clients",
          texte: [
            t.connaitSites
              ? "l'équipe savait que 60 % des logements seraient occupés"
              : "l'équipe ignorait que 60 % des logements seraient occupés",
            t.balmes.erreur ? "une erreur s'est glissée dans le bordereau de prix" : null,
            t.vauclair === "part"
              ? "Vauclair est parti chez Grandval"
              : t.vauclair === "aligne"
                ? "Vauclair est resté, à 5 % de remise"
                : "Vauclair est resté",
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
