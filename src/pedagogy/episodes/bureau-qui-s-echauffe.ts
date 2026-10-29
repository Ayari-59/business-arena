/**
 * LE BUREAU QUI S'ÉCHAUFFE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Sacha montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de sa
 * manière de travailler avec les autres.
 *
 * Comme « Le libre-service qui perd », l'épisode se joue depuis un poste
 * d'employé : le tableau de bord ne montre que ce qu'un employé de bureau
 * suit (les factures en attente, les retards, les litiges, l'entente au
 * bureau), et le bilan parle de la manière de parler aux autres, pas de
 * stratégie.
 */
import {
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  OBJECTIF_ENTENTE,
  OBJECTIF_EN_ATTENTE,
  OBJECTIF_LITIGES,
  OBJECTIF_RETARDS,
  PERTE_PAR_JOUR,
  PLAFOND,
  SANS_BON_DEPART,
  SEMAINES,
  SEMAINE_DECOUVERTE,
  DEBUT,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/bureau-qui-s-echauffe";
import {
  DIAGNOSTICS,
  ETAPES,
  PREVISION,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/bureau-qui-s-echauffe";
import type {
  Constat,
  Episode,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";
import { kE1 } from "./libre-service-qui-perd";

const pc = (v: number) => taux(v, 0);
/** L'entente au bureau, sur 10. */
const surDix = (v: number) => `${nombre(v)} / 10`;
/** Un écart au plafond : positif, le bureau a coûté moins que le plafond. */
const ecartAuPlafond = (v: number) =>
  v >= 0
    ? `${kE1(v)} sous le plafond du bureau`
    : `${kE1(-v)} au-delà du plafond du bureau`;

/** Les seuils de la prévision des factures reçues en semaine 3 : juste, et proche. */
export const SEUILS_PREVISION = { juste: 4, proche: 10 } as const;

/** Les décisions de relation, et la bonne option de chacune : le transporteur, Fabienne, l'erreur, le client, la remarque. */
export const BONNES_RELATIONS = [
  [D.transporteur, O.transporteur.ecouter],
  [D.desaccord, O.desaccord.parler],
  [D.erreur, O.erreur.dire],
  [D.telephone, O.telephone.verifier],
  [D.remarque, O.remarque.ecouter],
] as const;

/** Ce que les décisions révèlent, dans l'ordre où un employé les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient pourquoi les factures attendaient",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    circuit: `Votre diagnostic de la semaine 1 était juste : ${pc(SANS_BON_DEPART)} des factures arrivaient sans leur bon de livraison, resté au dépôt.`,
    charge:
      "En semaine 1, vous avez vu la charge du bureau : une vraie difficulté, mais pas la cause. Les factures attendaient surtout leur bon de livraison.",
    fournisseurs:
      "En semaine 1, vous avez accusé les fournisseurs ; les factures attendaient surtout leur bon de livraison, resté au dépôt.",
    collegue:
      "En semaine 1, vous avez accusé Fabienne ; elle mettait de côté les factures sans bon de livraison, et ces bons restaient au dépôt.",
  };
  const justes = ["circuit", "charge"];
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
    score: d === "circuit" ? 1 : d === "charge" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  // Les réponses réflexes, comptées par décision.
  const n = new Set(
    REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec]) => dec),
  ).size;
  const reflexes: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais choisi la réponse réflexe : ni payer sans vérifier, ni renvoyer ailleurs, ni cacher, ni vous justifier."
        : `Vous avez choisi la réponse réflexe ${n} fois sur ${ETAPES.length} décisions : payer sans vérifier, renvoyer ailleurs, répondre sur le même ton, cacher ou vous justifier. Elle soulage sur le moment, et coûte ensuite.${
            t.erreurDecouverte
              ? ` Le double paiement caché a été découvert en semaine ${SEMAINE_DECOUVERTE}.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.recues,
    "reçues en semaine 3",
    "factures",
    SEUILS_PREVISION,
    (e) => `${nombre(e, 0)} facture${e >= 2 ? "s" : ""}`,
  );

  const bien = BONNES_RELATIONS.filter(
    ([dec, o]) => p.chemin[dec] === o,
  ).length;
  const relations: Constat = {
    score: bien === BONNES_RELATIONS.length ? 1 : bien >= 3 ? 0.6 : 0,
    texte:
      bien === BONNES_RELATIONS.length
        ? "Avec le transporteur, Fabienne, Nathalie et le client, vous avez écouté, vérifié les faits et dit les choses tôt, en face, et calmement."
        : `Sur ${BONNES_RELATIONS.length} situations avec d'autres personnes, vous en avez traité ${bien} en écoutant, en vérifiant les faits et en disant les choses en face. ${
            p.chemin[D.desaccord] === O.desaccord.parler
              ? ""
              : "Le désaccord avec Fabienne, non traité en face, a usé l'entente du bureau."
          }`.trim(),
  };

  return [information, diagnostic, reflexes, calibrage, relations];
}

export function axe([
  information,
  diagnostic,
  reflexes,
  calibrage,
  relations,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder pourquoi les factures attendent",
      texte:
        "Rejouez l'épisode en triant d'abord la pile et en suivant un bon de livraison jusqu'au bureau : les factures attendaient des bons restés au dépôt.",
    };
  }
  if (relations!.score === 0) {
    return {
      titre: "Écouter, vérifier, dire en face",
      texte:
        "Un interlocuteur écouté se calme, un désaccord dit en face se règle, une erreur dite tôt se rattrape. Renvoyer, se taire ou cacher coûte plus tard.",
    };
  }
  if (reflexes!.score === 0) {
    return {
      titre: "Résister à la réponse réflexe",
      texte:
        "Payer sans vérifier, acheter la paix par une remise, se justifier : chaque réponse réflexe soulage sur le moment, et revient ensuite en litiges ou en argent perdu.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui bloque",
      texte:
        "Quand une pile grossit, cherchez ce qui empêche de la traiter avant d'accuser la charge ou une personne : ici, des bons de livraison qui ne montaient pas.",
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

const NATHALIE = {
  de: "Nathalie Grosjean",
  role: "Responsable administrative",
} as const;
const BRESSAN = { de: "Gilles Bressan", role: "Transports Bressan" } as const;

export const EPISODE_BUREAU: Episode<Trimestre> = {
  code: "bureau-qui-s-echauffe",
  numero: 50,
  domaine: "Relations au travail et gestion administrative",
  titre: "Le bureau qui s'échauffe",
  resume:
    "Un trimestre au bureau administratif d'une agence : des factures qui s'entassent, un transporteur en colère, une collègue, une erreur à dire. Écouter, vérifier, dire les choses en face.",
  persona:
    "Vous êtes Sacha Morel, en seconde professionnelle Gestion administrative, transport et logistique, en apprentissage au bureau de l'agence Arvel Distribution de Bourgoin-Jallieu. Avec Fabienne Tissot, gestionnaire administrative, vous traitez les factures fournisseurs, le comptoir administratif et le téléphone. Votre responsable : Nathalie Grosjean, responsable administrative.",
  mandat: [
    { fort: `${OBJECTIF_EN_ATTENTE}`, texte: "factures en attente, au plus" },
    {
      fort: `${OBJECTIF_RETARDS}`,
      texte: "factures payées en retard par semaine, au plus",
    },
    { fort: `${OBJECTIF_LITIGES}`, texte: "litiges ouverts en moyenne, au plus" },
    { fort: surDix(OBJECTIF_ENTENTE), texte: "d'entente au bureau, au moins" },
  ],
  jugement: `Nathalie fait le compte en euros de ce que le bureau a coûté en plus à l'agence : les indemnités de retard, ce qui a été payé à tort, les litiges, les clients perdus, les heures perdues en tensions. Elle le compare au plafond qu'elle a fixé, ${kE1(PLAFOND)}.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre bureau",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours, la pile grossit, et des factures passent leur échéance.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...NATHALIE,
        alerte: true,
        texte: `Pendant que tu cherchais, des factures ont passé leur échéance : environ ${euros(perdu)} d'indemnités de retard.`,
      };
    },
  },
  prevision: {
    libelle: `le nombre de factures fournisseurs reçues en semaine 3. Repère : environ ${PREVISION.parJour} factures par jour ouvré, et ${PREVISION.jours} jours ouvrés par semaine`,
    unite: "factures",
    placeholder: "40",
    min: 0,
    max: 300,
    step: 1,
    reel: (t) => t.semaines[3]!.recues,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "enAttente",
      nom: "Factures en attente",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_EN_ATTENTE} au plus`,
    },
    {
      cle: "retards",
      nom: "Factures payées en retard",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "la semaine dernière"} ; objectif : ${OBJECTIF_RETARDS} au plus`,
    },
    {
      cle: "litiges",
      nom: "Litiges ouverts",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_LITIGES} au plus`,
    },
    {
      cle: "entente",
      nom: "Entente au bureau",
      format: surDix,
      formatEcart: (v) => `${nombre(v)} pt`,
      sensBon: 1,
      aide: () => `objectif : ${surDix(OBJECTIF_ENTENTE)} au moins`,
    },
    {
      cle: "couts",
      nom: "Coût du bureau",
      format: kE1,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE1(l.plafondADate ?? 0)} de plafond sur ${kE1(PLAFOND)}`
          : `plafond : ${kE1(PLAFOND)} pour le trimestre`,
      jauge: (l) =>
        l.plafondADate
          ? {
              part: Math.min(1, Math.max(0, (l.couts ?? 0) / PLAFOND)),
              enRetard: (l.couts ?? 0) > l.plafondADate,
            }
          : null,
    },
  ],
  contexte(l) {
    return {
      enAttente: nombre(l.enAttente ?? 0, 0),
      retards: nombre(l.retards ?? 0, 0),
      litiges: nombre(l.litiges ?? 0, 0),
      entente: nombre(l.entente ?? 0),
      couts: kE1(l.couts ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Factures en attente, sem. ${a}`, nombre(t.semaines[a]!.enAttente, 0)],
      [`Entente au bureau, sem. ${a}`, surDix(t.semaines[a]!.entente)],
      ["Coût de la période", kE1(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Factures en attente, semaine par semaine",
    cle: "enAttente",
    cible: OBJECTIF_EN_ATTENTE,
    libelleCible: `objectif : ${OBJECTIF_EN_ATTENTE} au plus`,
    graduations: [30, 60, 120, 200],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.enAttente!, 0)} en attente · ${nombre(s.retards!, 0)} payées en retard`,
      `${nombre(s.litiges!, 0)} litiges ouverts · entente ${surDix(s.entente!)}`,
    ],
  },
  reactions: () => null,
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.promesseTenue) {
      lies.push({
        ...BRESSAN,
        heure: `sem. ${DEBUT[D.transporteur]}`,
        texte: REPONSES.promesseTenue,
      });
    }
    if (arrive.promesseRompue) {
      lies.push({
        ...BRESSAN,
        heure: `sem. ${DEBUT[D.transporteur] + 1}`,
        alerte: true,
        texte: REPONSES.promesseRompue,
      });
    }
    if (arrive.decouverte) {
      lies.push({
        ...NATHALIE,
        heure: `sem. ${SEMAINE_DECOUVERTE}`,
        alerte: true,
        texte: REPONSES.decouverte,
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
    hasard(graine).imprevus.map((x) => ({
      semaine: x.semaine,
      titre: x.imprevu.titre,
    })),

  bilan: {
    titre: (t) => ecartAuPlafond(t.objectif),
    formatObjectif: kE1,
    noteDesBarres:
      "Écart au plafond du bureau, indemnités de retard, paiements à tort, litiges, clients perdus et heures perdues compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Factures en attente",
          valeur: nombre(t.enAttenteFinale, 0),
          aide: `en semaine ${SEMAINES} ; objectif ${OBJECTIF_EN_ATTENTE} au plus`,
          tenu: t.enAttenteFinale <= OBJECTIF_EN_ATTENTE,
        },
        {
          nom: "Payées en retard",
          valeur: nombre(t.retards, 0),
          aide: `sur le trimestre ; objectif ${OBJECTIF_RETARDS * SEMAINES} au plus`,
          tenu: t.retards <= OBJECTIF_RETARDS * SEMAINES,
        },
        {
          nom: "Litiges ouverts",
          valeur: nombre(t.litigesMoyens),
          aide: `en moyenne ; objectif ${OBJECTIF_LITIGES} au plus`,
          tenu: t.litigesMoyens <= OBJECTIF_LITIGES,
        },
        {
          nom: "Entente au bureau",
          valeur: surDix(t.ententeFinale),
          aide: `en semaine ${SEMAINES} ; objectif ${surDix(OBJECTIF_ENTENTE)}`,
          tenu: t.ententeFinale >= OBJECTIF_ENTENTE,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les paiements à tort",
          texte: `${euros(t.payeATort)} payés sans être dus, ou mal récupérés, sur le trimestre.`,
        },
        ...(t.erreurDecouverte
          ? [
              {
                titre: "Le double paiement",
                texte: `a été découvert par Nathalie en semaine ${SEMAINE_DECOUVERTE}.`,
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
