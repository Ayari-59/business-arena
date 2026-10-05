/**
 * ÉPISODE 19 — LE PRÉAVIS DE GRÈVE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Christine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux choses du contrat sont contournées comme dans les épisodes précédents :
 * le vote des équipes sur le préavis et sur le dernier paquet dépend de choix
 * antérieurs (la confiance construite), il passe donc par `evenements().lies`
 * à la bonne semaine ; et `lire` renvoie des clés non affichées (le préavis
 * levé, la dernière grève, la signature, ce qui manque aux élus) qui
 * nourrissent les messages et les sources.
 */
import {
  CONFIANCE_DEPART,
  D,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_SERVICE,
  PERTE_PAR_JOUR,
  SALARIES,
  evenements,
  hasard,
  interimTrouve,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/preavis-de-greve";
import {
  BENSAID,
  CONCESSIONS,
  DIAGNOSTICS,
  ETAPES,
  FERMETES,
  LE_GOFF,
  MALLET,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/preavis-de-greve";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un indice sur 100, lu sur une part. */
const sur100 = (v: number) => `${nombre(v * 100, 0)} sur 100`;
const points = (v: number) => `${nombre(v * 100, 0)} pt`;
/** Un écart à l'enveloppe : positif, le trimestre reste en dessous. */
const ecartALEnveloppe = (v: number) =>
  v >= 0 ? `${kE(v)} sous l'enveloppe` : `${kE(-v)} au-delà de l'enveloppe`;
const OBJECTIF_CONFIANCE = 0.6;

const JUSTES: readonly string[] = ["interets", "confiance"];

/** Les engagements tenus et rompus, et les représentants contournés, lus sur le chemin. */
function parole(chemin: readonly number[]) {
  const etude = chemin[D.preavis] === 2;
  const promisPlanning = chemin[D.paquet] === 2;
  const planningTenu = promisPlanning && (chemin[D.samedis] === 0 || chemin[D.samedis] === 2);
  const planningRompu = promisPlanning && chemin[D.samedis] === 1;
  const calendrier = chemin[D.suivi] === 0;
  const lettre = chemin[D.preavis] === 1;
  const retard = chemin[D.suivi] === 1 || chemin[D.suivi] === 3;
  return {
    etude,
    planningTenu,
    planningRompu,
    calendrier,
    lettre,
    retard,
    tenus: [etude, planningTenu, calendrier].filter(Boolean).length,
    rompus: [planningRompu, lettre, retard].filter(Boolean).length,
  };
}

/** Ce que les décisions révèlent, dans l'ordre où une DRH les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qu'il y avait derrière les 4,5 %",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    interets:
      "Votre diagnostic de la semaine 1 était juste : derrière les 4,5 %, il y avait des premiers niveaux rattrapés par le Smic et des samedis annoncés le jeudi. Des attentes précises, qu'on traite mieux et moins cher qu'un pourcentage.",
    confiance:
      "En semaine 1, vous avez vu la confiance rompue par la promesse non tenue de l'an dernier : une vraie cause, mais pas la seule. Il restait à trouver ce que les salariés attendaient vraiment.",
    surenchere:
      "En semaine 1, vous avez lu une surenchère avant les élections ; reçus hors de la table, les élus parlaient de la grille et des samedis, pas de pourcentage.",
    marche:
      "En semaine 1, vous avez cru les salaires des dépôts sous le marché ; ils étaient 2 % au-dessus de la branche. Seuls les premiers niveaux décrochaient.",
  };
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (JUSTES.includes(r.principal) && !JUSTES.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!JUSTES.includes(r.principal) && JUSTES.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!JUSTES.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "interets" ? 1 : d === "confiance" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const fermetes = FERMETES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const concessions = CONCESSIONS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n = fermetes + concessions;
  const detail = [
    fermetes ? `opposé un refus de principe ${fermetes} fois` : null,
    concessions ? `cédé sous la menace ${concessions} fois` : null,
  ]
    .filter(Boolean)
    .join(", et ");
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu au conflit par un refus de principe ni par une concession sous la menace : vous avez partagé les chiffres, cherché ce qui comptait pour les salariés, et proposé un paquet."
        : `Face au conflit, vous avez ${detail}, sur ${ETAPES.length} décisions.${
            fermetes
              ? " Un refus de principe durcit les positions : des grévistes plus nombreux, et une signature qui coûte plus cher ensuite."
              : ""
          }${
            concessions
              ? " Céder sous la menace achète la paix du moment et apprend que la menace paie : la prochaine négociation partira de plus haut."
              : ""
          }${
            t.joursDeGreve ? ` Les dépôts ont perdu ${nombre(t.joursDeGreve)} jours de grève.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.confiance * 100,
    "de confiance des salariés en semaine 3",
    "points",
    { juste: 4, proche: 10 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const x = parole(p.chemin);
  const tenus = [
    x.etude ? "lancé l'étude des quais promise l'an dernier" : null,
    x.planningTenu ? "tenu les plannings du samedi annoncés quinze jours avant" : null,
    x.calendrier ? "publié le calendrier de chaque mesure" : null,
  ].filter(Boolean);
  const rompus = [
    x.lettre ? "écrit aux salariés par-dessus leurs représentants" : null,
    x.planningRompu
      ? "laissé imposer des samedis annoncés le jeudi, après avoir promis quinze jours"
      : null,
    x.retard ? "laissé les mesures arriver en retard sans rien dire" : null,
  ].filter(Boolean);
  const confianceTenue: Constat = {
    score: x.rompus === 0 && x.tenus >= 2 ? 1 : x.rompus === 0 || x.tenus >= 2 ? 0.6 : 0,
    texte: `${
      tenus.length
        ? `Vous avez ${tenus.join(", ")}.`
        : "Vous n'avez pris aucun engagement que les salariés pouvaient vérifier."
    }${rompus.length ? ` Mais vous avez ${rompus.join(", ")}.` : ""} En semaine 13, la confiance des salariés était à ${sur100(
      t.confianceFinale,
    )}, pour ${sur100(CONFIANCE_DEPART)} au départ : c'est d'elle que part la prochaine négociation.`,
  };

  return [information, diagnostic, reflexe, calibrage, confianceTenue];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  confianceTenue,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qu'il y a derrière la revendication",
      texte:
        "Rejouez l'épisode en analysant d'abord la grille et en recevant les élus hors de la table : derrière les 4,5 %, il y avait des premiers niveaux rattrapés par le Smic et des samedis annoncés le jeudi. Deux problèmes qui se traitent mieux qu'un pourcentage.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni refus de principe, ni concession sous la menace",
      texte:
        "Refuser fermement puis céder quand la grève approche, c'est payer deux fois : la grève, puis la concession, et la prochaine négociation en prime. Partagez les chiffres, explorez ce qui compte pour les salariés, proposez un paquet équilibré, et tenez-le.",
    };
  }
  if (confianceTenue!.score === 0) {
    return {
      titre: "Tenir parole, et passer par les représentants",
      texte:
        "La confiance se construit dans la durée et se perd en un jour : une promesse tenue rend la suivante crédible, une promesse rompue ou une lettre par-dessus les élus se paie plus tard, en grévistes et en points d'augmentation.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Négocier les intérêts, pas les positions",
      texte:
        "Un pourcentage réclamé est une position ; ce qu'il recouvre, ce sont des intérêts. Cherchez lesquels avant de chiffrer : une mesure ciblée vaut souvent plus, pour ceux qui la reçoivent, qu'un point pour tout le monde.",
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

const MEDIATEUR = { de: "Le médiateur", role: "Médiation sociale" } as const;
const INTERIM = { de: "Agence d'intérim", role: "Lyon Est" } as const;

export const EPISODE_DIALOGUE_SOCIAL: Episode<Trimestre> = {
  code: "preavis-de-greve",
  numero: 19,
  domaine: "Dialogue social",
  titre: "Le préavis de grève",
  resume:
    "Une négociation salariale tendue, un préavis de grève, une enveloppe fixée et la saison haute qui approche. Négocier les intérêts plutôt que les positions, et tenir parole.",
  persona: `Vous êtes Christine Lacroix, directrice des ressources humaines d'Arvel Distribution pour la région Rhône-Alpes. La négociation annuelle sur les salaires concerne les ${SALARIES} salariés des trois dépôts de la région, à Chassieu, Moirans et Andrézieux : préparateurs, caristes et réceptionnaires, qui approvisionnent les agences.`,
  mandat: [
    { fort: kE(ENVELOPPE), texte: "d'enveloppe sur l'année, toutes mesures comprises" },
    { fort: "Semaine 4", texte: "la grève annoncée dans les trois dépôts" },
    { fort: "Semaine 8", texte: "le début de la saison haute du bâtiment" },
    { fort: "Un accord", texte: "signé, qui tienne jusqu'à la prochaine négociation" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart à l'enveloppe : le coût annuel des mesures accordées, ce que les grèves ont coûté en livraisons et en clients, les coûts engagés, et ce que le climat laissé coûtera, ou fera gagner, à la prochaine négociation.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos dépôts",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours sans signe de votre part, les dépôts débrayent une heure par jour : des livraisons partent en retard.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...MALLET,
        alerte: true,
        texte: `Pendant ce temps, les équipes ont débrayé une heure par jour pour se faire entendre : ${euros(perdu)} de livraisons en retard et de gestes aux clients.`,
      };
    },
  },
  prevision: {
    libelle: "la confiance des salariés dans la direction en semaine 3, sur 100",
    unite: "sur 100",
    placeholder: "30",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[3]!.confiance * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "confiance",
      nom: "Confiance des salariés",
      format: sur100,
      formatEcart: points,
      sensBon: 1,
      aide: () =>
        `baromètre hebdomadaire ; objectif : ${nombre(OBJECTIF_CONFIANCE * 100, 0)} au moins`,
    },
    {
      cle: "offre",
      nom: "Mesures sur la table",
      format: kE,
      sensBon: -1,
      aide: (_, l) =>
        l.offre ? `coût sur l'année ; enveloppe : ${kE(ENVELOPPE)}` : "aucun chiffre sur la table",
      jauge: (l) =>
        l.offre !== null
          ? { part: Math.min(1, (l.offre ?? 0) / ENVELOPPE), enRetard: (l.offre ?? 0) > ENVELOPPE }
          : null,
    },
    {
      cle: "service",
      nom: "Taux de service des dépôts",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        `livraisons complètes et à l'heure${semaine ? `, semaine ${semaine}` : ""} ; objectif : ${taux(OBJECTIF_SERVICE, 0)}`,
    },
    {
      cle: "pertes",
      nom: "Chiffre perdu",
      format: kE,
      sensBon: -1,
      aide: () => "livraisons manquées et clients partis, cumulés",
    },
    {
      cle: "ecart",
      nom: "Écart à l'enveloppe",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "à date : mesures, pertes et coûts déduits" : `${kE(ENVELOPPE)} sur l'année`,
    },
  ],
  contexte(l, decisions) {
    const manque = l.manque;
    return {
      confiance: sur100(l.confiance ?? 0),
      offre: kE(l.offre ?? 0),
      pertes: kE(l.pertes ?? 0),
      service: taux(l.service ?? 0, 0),
      ecart: ecartALEnveloppe(l.ecart ?? 0),
      preavisLeve: l.preavisLeve === 1,
      greve: (l.greve ?? 0) > 0,
      signe: l.signe === 1,
      manque:
        manque === null || manque === undefined
          ? ""
          : manque <= 0
            ? "rien"
            : manque < 0.5
              ? "peu"
              : "beaucoup",
      ouvert: decisions[D.ouverture] === 1,
      etude: decisions[D.preavis] === 2,
      paquet: decisions[D.paquet] === 2,
    };
  },
  recap(t, de, a) {
    const avant = de > 1 ? t.semaines[de - 1]!.pertes : 0;
    return [
      [`Écart à l'enveloppe, sem. ${a}`, kE(t.semaines[a]!.ecart)],
      [`Confiance, sem. ${a}`, sur100(t.semaines[a]!.confiance)],
      ["Chiffre perdu sur la période", kE(t.semaines[a]!.pertes - avant)],
    ];
  },
  courbe: {
    titre: "Taux de service des dépôts, semaine par semaine",
    cle: "service",
    cible: OBJECTIF_SERVICE,
    libelleCible: `objectif : ${taux(OBJECTIF_SERVICE, 0)} de livraisons complètes et à l'heure`,
    graduations: [0.5, 0.6, 0.7, 0.8, 0.9, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `service ${taux(s.service!, 0)} · ${s.greve ? `grève, ${taux(s.greve, 0)} de grévistes` : "pas de grève"}`,
      `confiance ${sur100(s.confiance!)} · mesures ${kE(s.offre!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.samedis && choix === 0) {
      // L'agence trouve ou non deux caristes selon le hasard du trimestre, pas selon les décisions.
      const trouve = interimTrouve(graine);
      return [
        {
          ...INTERIM,
          alerte: !trouve,
          texte: trouve ? REPONSES.interimTrouve : REPONSES.interimManque,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.leveeSemaine2) {
      lies.push({
        ...BENSAID,
        heure: "sem. 2",
        texte:
          "Les équipes ont voté ce week-end : le préavis est levé. Mais personne n'a oublié les 4,5 %.",
      });
    }
    if (arrive.maintenuSemaine2) {
      lies.push({
        ...BENSAID,
        heure: "sem. 2",
        alerte: true,
        texte:
          "Les équipes ont voté : 3 %, c'est un début, pas une réponse. Le préavis est maintenu.",
      });
    }
    if (arrive.leveeSemaine4) {
      lies.push(
        chemin[D.preavis] === 3
          ? { ...BENSAID, heure: "sem. 4", texte: "L'avance est acceptée : le préavis est levé." }
          : {
              ...LE_GOFF,
              heure: "sem. 4",
              texte:
                "Les équipes ont voté : le préavis est levé. On vous attend aux trois réunions, et on suivra l'étude de près.",
            },
      );
    }
    if (arrive.refusSemaine4) {
      lies.push({
        ...BENSAID,
        heure: "sem. 4",
        alerte: true,
        texte:
          chemin[D.preavis] === 3
            ? "Les équipes ont refusé l'avance : « on ne vend pas la grève pour 1 % ». La grève a lieu lundi et mardi."
            : "Les équipes ont voté le maintien, à une courte majorité : trop de promesses non tenues par le passé. La grève a lieu lundi et mardi.",
      });
    }
    if (arrive.greve4 !== null) {
      lies.push({
        ...MALLET,
        heure: "sem. 4",
        alerte: true,
        texte: `Grève lundi et mardi : ${taux(arrive.greve4, 0)} de grévistes dans les trois dépôts. ${
          arrive.greve4 > 0.5
            ? "Chassieu n'a presque rien expédié, les agences ont vidé leurs rayons."
            : "Les livraisons prioritaires sont parties, pas les autres."
        }`,
      });
    }
    if (arrive.signature !== null && chemin[D.cloture] === 2) {
      lies.push({
        ...BENSAID,
        heure: `sem. ${arrive.signature}`,
        texte:
          "Les équipes ont voté oui dans les trois dépôts : nous signons. Rendez-vous en septembre pour le suivi.",
      });
    }
    if (arrive.signature !== null && chemin[D.cloture] === 3) {
      lies.push({
        ...MEDIATEUR,
        heure: `sem. ${arrive.signature}`,
        texte:
          "Les positions se sont rapprochées, en coupant la différence sur l'augmentation générale. L'accord est signé.",
      });
    }
    if (arrive.refusDuPaquet) {
      lies.push({
        ...LE_GOFF,
        heure: "sem. 10",
        alerte: true,
        texte:
          "Les équipes ont rejeté la proposition, de peu. Nous appelons à une journée de grève mercredi.",
      });
    }
    if (arrive.greve10 !== null) {
      lies.push({
        ...MALLET,
        heure: "sem. 10",
        alerte: true,
        texte: `Grève en pleine saison : ${taux(arrive.greve10, 0)} de grévistes. ${
          arrive.greve10 > 0.4
            ? "Les agences n'ont pas été réassorties, des artisans sont allés chercher ailleurs."
            : "Le réassort a pris un jour de retard."
        }`,
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
    titre: (t) => `${ecartALEnveloppe(t.objectif)}, grèves et climat laissé compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart à l'enveloppe de la négociation, mesures accordées sur l'année, grèves, clients perdus et climat laissé compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Accord",
          valeur: t.signe ? `signé, sem. ${t.semaineSignature}` : "non signé",
          aide: t.signe ? "par les élus des trois dépôts" : "procès-verbal de désaccord",
          tenu: t.signe,
        },
        {
          nom: "Mesures accordées",
          valeur: kE(t.mesures),
          aide: `sur l'année ; enveloppe ${kE(ENVELOPPE)}`,
          tenu: t.mesures <= ENVELOPPE,
        },
        {
          nom: "Jours de grève",
          valeur: nombre(t.joursDeGreve),
          aide: t.joursDeGreve
            ? `jusqu'à ${taux(Math.max(t.greve4, t.greve10), 0)} de grévistes`
            : "dans les trois dépôts",
          tenu: t.joursDeGreve === 0,
        },
        {
          nom: "Confiance des salariés",
          valeur: sur100(t.confianceFinale),
          aide: `en semaine 13 ; ${nombre(CONFIANCE_DEPART * 100, 0)} au départ, objectif ${nombre(OBJECTIF_CONFIANCE * 100, 0)}`,
          tenu: t.confianceFinale >= OBJECTIF_CONFIANCE,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.interim !== null
          ? [
              {
                titre: "L'agence d'intérim",
                texte: t.interim
                  ? "a trouvé deux caristes pour la saison haute."
                  : "n'a trouvé personne : les samedis volontaires ont porté seuls la saison.",
              },
            ]
          : []),
        {
          titre: "Les équipes",
          texte: [
            t.semaineDeLevee !== null
              ? `ont levé le préavis en semaine ${t.semaineDeLevee}`
              : `ont fait grève en semaine 4, à ${taux(t.greve4, 0)}`,
            t.greve10 > 0 ? `ont fait grève en semaine 10, à ${taux(t.greve10, 0)}` : null,
            t.signe
              ? `et ont signé en semaine ${t.semaineSignature}`
              : "et n'ont pas signé : les mesures ont été appliquées sans accord",
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
