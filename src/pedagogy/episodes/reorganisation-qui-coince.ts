/**
 * ÉPISODE 10 — LA RÉORGANISATION QUI COINCE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Isabelle montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Deux choses du contrat sont contournées comme dans les épisodes précédents :
 * la réponse de Patrick et l'issue du pilote dépendent de choix antérieurs,
 * elles passent donc par `evenements().lies` à la bonne semaine ; et `lire`
 * renvoie des clés non affichées (le pilote, le départ de Patrick, le
 * déploiement attendu à date) qui nourrissent les messages et la jauge.
 */
import {
  BUDGET,
  CA_BASE,
  COMMERCIAUX,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_ADHESION,
  OBJECTIF_USAGE,
  PERTE_PAR_JOUR,
  SEMAINES,
  SUITE,
  evenements,
  hasard,
  livraisonALHeure,
  patrickAccepte,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/reorganisation-qui-coince";
import {
  DIAGNOSTICS,
  ETAPES,
  INJONCTIONS,
  RECULS,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/reorganisation-qui-coince";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un indice sur 100, lu sur une part. */
const sur100 = (v: number) => `${nombre(v * 100, 0)} sur 100`;
const points = (v: number) => `${nombre(v * 100, 0)} pt`;
/** Un écart au budget de marge : positif, la région fait mieux que le budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget de marge` : `${kE(-v)} en dessous du budget de marge`;

const JUSTES: readonly string[] = ["objections", "rythme"];

/** Ce que les décisions révèlent, dans l'ordre où une responsable les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce que l'équipe refusait vraiment et comment d'autres régions s'y étaient prises",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    objections:
      "Votre diagnostic de la semaine 1 était juste : l'équipe ne refusait pas l'organisation, elle refusait de perdre ses clients sans passation et de remplir une fiche inutilisable, et les deux anciens entraînaient les autres.",
    rythme:
      "En semaine 1, vous avez vu que le calendrier était trop brutal : une vraie cause, mais pas la première. Même étalée, une bascule que personne n'a discutée aurait coincé.",
    outil:
      "En semaine 1, vous avez retenu l'outil : il était lourd, mais c'était une objection parmi d'autres, et le changer n'aurait pas suffi à faire adhérer l'équipe.",
    anciens:
      "En semaine 1, vous avez vu deux anciens qui bloquaient par principe ; reçus, Patrick et Sylvie ne contestaient pas l'idée, seulement la façon de faire.",
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
    score: d === "objections" ? 1 : d === "rythme" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const imposees = INJONCTIONS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const cedees = RECULS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n = imposees + cedees;
  const detail = [
    imposees ? `imposé ou contrôlé ${imposees} fois` : null,
    cedees ? `reporté ou cédé ${cedees} fois` : null,
  ]
    .filter(Boolean)
    .join(", et ");
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la résistance en imposant, ni en cédant : vous avez écouté, essayé petit, puis déployé avec ceux qui y croyaient."
        : `Face à la résistance, vous avez ${detail}, sur ${ETAPES.length} décisions. ${
            imposees
              ? " Imposer fabrique du freinage silencieux, des saisies vides et des départs."
              : ""
          }${cedees ? " Céder laisse l'échéance arriver sans rien en place." : ""}${
            t.patrickPart ? " Patrick est parti chez un concurrent en semaine 10." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.adhesion * 100,
    "d'indice d'adhésion en semaine 3",
    "points",
    { juste: 3, proche: 8 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const associe = p.chemin[D.patrick] === 0;
  const mesure = p.chemin[D.outil] !== 0 && p.chemin[D.fin] === 1;
  const n2 = (associe ? 1 : 0) + (mesure ? 1 : 0);
  const adoption: Constat = {
    score: n2 === 2 ? 1 : n2 === 1 ? 0.6 : 0,
    texte: `${
      associe
        ? `Vous avez associé Patrick au projet plutôt que de le recadrer ou de l'en exclure${
            t.patrickAccepte
              ? ", et il a présenté lui-même ses clients"
              : " ; il a refusé, mais l'offre était faite"
          }.`
        : "Vous n'avez pas associé Patrick, l'influent que les autres regardaient."
    } ${
      mesure
        ? `Vous avez mesuré l'usage réel de l'outil plutôt que le nombre de saisies : en semaine 13, ${taux(t.usageFinal, 0)} des visites étaient vraiment suivies.`
        : `En semaine 13, l'outil affichait ${taux(t.saisiesFinales, 0)} de visites saisies, mais ${taux(t.usageFinal, 0)} seulement disaient vraiment quelque chose : c'est l'usage réel qui fait le gain.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, adoption];
}

export function axe([information, diagnostic, reflexe, calibrage, adoption]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Écouter les objections avant d'agir",
      texte:
        "Rejouez l'épisode en recevant d'abord Patrick et Sylvie : ils ne refusaient pas l'organisation, mais la perte de leurs clients sans passation et une fiche inutilisable dans le camion. Ce sont deux problèmes qu'on règle.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Construire l'adhésion plutôt que l'imposer ou céder",
      texte:
        "Imposer donne une organisation en place sur le papier, des saisies vides et des départs ; céder laisse l'échéance arriver sans rien. Entre les deux : écouter, faire la preuve avec des volontaires, associer les influents, puis déployer par vagues.",
    };
  }
  if (adoption!.score === 0) {
    return {
      titre: "Mesurer l'usage réel, pas les saisies",
      texte:
        "Un taux de saisie se fabrique sous contrôle ; l'usage réel vient de l'utilité et de l'adhésion. Associez ceux que l'équipe écoute, et mesurez ce que l'outil apporte vraiment.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce que l'équipe refuse vraiment",
      texte:
        "Une résistance au changement porte presque toujours sur quelque chose de précis : ce qu'on retire aux gens, ce qu'on leur ajoute. Faites-le dire avant de choisir le rythme ou de changer l'outil.",
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

const PATRICK = { de: "Patrick Vial", role: "Commercial, Villefranche" } as const;
const SYLVIE = { de: "Sylvie Charrier", role: "Commerciale, Gerland" } as const;
const YANIS = { de: "Yanis Belkacem", role: "Commercial, Villeurbanne" } as const;
const EDITEUR = { de: "Laure Vasseur", role: "Cheffe de projet, éditeur de l'outil" } as const;

export const EPISODE_CHANGEMENT: Episode<Trimestre> = {
  code: "reorganisation-qui-coince",
  numero: 10,
  domaine: "Conduite du changement",
  titre: "La réorganisation qui coince",
  resume:
    "Une nouvelle organisation commerciale mal reçue, deux anciens qui freinent, un outil vide. Construire l'adhésion plutôt que l'imposer ou céder.",
  persona:
    "Vous êtes Isabelle Fontanel, responsable régionale des ventes d'Arvel Distribution pour la région lyonnaise. Votre équipe : quatorze commerciaux, répartis dans quatre agences (Villeurbanne, Gerland, Vénissieux, Villefranche), qui vendent aux artisans et aux grands comptes du bâtiment.",
  mandat: [
    { fort: "Semaine 13", texte: "la nouvelle organisation complète, par type de clients" },
    { fort: kE(BUDGET), texte: "de marge commerciale budgétée sur le trimestre" },
    { fort: "60 %", texte: "des visites réellement suivies dans l'outil" },
    { fort: `${COMMERCIAUX}`, texte: "commerciaux, et leurs clients, à garder" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de marge de la région, coûts du projet et départs compris, plus ce que l'organisation laissée en semaine 13 rapportera, ou coûtera, sur les deux mois suivants.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre région",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours sans réponse de votre part, la rumeur court chez les clients : des affaires se perdent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Marc Delaunay",
        role: "Directeur commercial",
        alerte: true,
        texte: `Pendant ce temps, des artisans ont entendu dire qu'ils allaient changer de commercial et sont allés voir ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "l'indice d'adhésion de l'équipe en semaine 3, sur 100",
    unite: "sur 100",
    placeholder: "38",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[3]!.adhesion * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
    attendu: semaine / SEMAINES,
  }),
  indicateurs: [
    {
      cle: "ca",
      nom: "Chiffre d'affaires de la semaine",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "semaine dernière"} ; habituel : ${kE(CA_BASE)}`,
    },
    {
      cle: "adhesion",
      nom: "Adhésion de l'équipe",
      format: sur100,
      formatEcart: points,
      sensBon: 1,
      aide: () =>
        `questionnaire anonyme ; objectif : ${nombre(OBJECTIF_ADHESION * 100, 0)} au moins`,
    },
    {
      cle: "usage",
      nom: "Usage réel de l'outil",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: (_, l) => `visites vraiment suivies ; saisies affichées : ${taux(l.saisies ?? 0, 0)}`,
    },
    {
      cle: "deploiement",
      nom: "Nouvelle organisation en place",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `part du chiffre ; prévu à date : ${taux(l.attendu ?? 0, 0)}`
          : "complète en semaine 13",
      jauge: (l) =>
        l.attendu
          ? {
              part: Math.min(1, l.deploiement ?? 0),
              enRetard: (l.deploiement ?? 0) < (l.attendu ?? 0) - 0.05,
            }
          : null,
    },
    {
      cle: "ecart",
      nom: "Écart au budget de marge",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "à date, coûts du projet compris" : `${kE(BUDGET)} pour le trimestre`,
    },
  ],
  contexte(l, decisions) {
    const ecart = l.ecart ?? 0;
    return {
      ca: kE(l.ca ?? 0),
      adhesion: sur100(l.adhesion ?? 0),
      usage: taux(l.usage ?? 0, 0),
      saisies: taux(l.saisies ?? 0, 0),
      deploiement: taux(l.deploiement ?? 0, 0),
      ecart:
        ecart >= 0
          ? `${kE(ecart)} au-dessus de son budget de marge`
          : `${kE(-ecart)} en dessous de son budget de marge`,
      pilote: l.pilote === 1 ? "reussi" : l.pilote === 0 ? "echoue" : "",
      ecoute: decisions[D.annonce] === 1,
      patrickParti: l.patrickParti === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ecart = semaines.reduce((x, w) => x + w.marge - w.cout - BUDGET / SEMAINES, 0);
    return [
      ["Écart au budget, période", kE(ecart)],
      [`Adhésion, sem. ${a}`, sur100(t.semaines[a]!.adhesion)],
      [`Usage réel de l'outil, sem. ${a}`, taux(t.semaines[a]!.usage, 0)],
    ];
  },
  courbe: {
    titre: "Chiffre d'affaires, semaine par semaine",
    cle: "ca",
    cible: CA_BASE,
    libelleCible: `niveau habituel : ${kE(CA_BASE)} par semaine`,
    graduations: [320000, 360000, 400000, 440000, 480000],
    format: kE,
    details: (s) => [
      `${kE(s.ca!)} · organisation en place ${taux(s.deploiement!, 0)}`,
      `adhésion ${sur100(s.adhesion!)} · usage réel ${taux(s.usage!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.outil && choix === 1) {
      // L'éditeur tient ou non son délai selon le hasard du trimestre, pas selon les décisions.
      const aLHeure = livraisonALHeure(graine);
      return [
        {
          ...EDITEUR,
          alerte: !aLHeure,
          texte: aLHeure ? REPONSES.livraisonALHeure : REPONSES.livraisonEnRetard,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.sylvieVolontaire) {
      lies.push({ ...SYLVIE, heure: "sem. 4", texte: REPONSES.sylvieVolontaire });
    }
    if (arrive.pilote !== null) {
      lies.push({
        ...YANIS,
        heure: "sem. 7",
        alerte: !arrive.pilote,
        texte: arrive.pilote ? REPONSES.piloteReussi : REPONSES.piloteEchoue,
      });
    }
    if (arrive.livraison !== null) {
      lies.push({ ...EDITEUR, heure: `sem. ${arrive.livraison}`, texte: REPONSES.outilLivre });
    }
    if (arrive.patrick !== null) {
      // Sa réponse dépend de la façon dont on l'a traité en semaine 1, et du pilote.
      const oui = patrickAccepte(chemin, graine);
      lies.push({
        ...PATRICK,
        heure: "sem. 8",
        alerte: !oui,
        texte: oui ? REPONSES.patrickAccepte : REPONSES.patrickRefuse,
      });
    }
    if (arrive.patrickPart) {
      lies.push({ ...PATRICK, heure: "sem. 10", alerte: true, texte: REPONSES.patrickPart });
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, suite du projet comprise`,
    formatObjectif: kE,
    noteDesBarres: `Écart au budget de marge de la région, coûts du projet et départs compris, plus ce que l'organisation laissée rapporte ou coûte sur les ${SUITE} semaines suivantes, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.`,
    tuiles(t) {
      return [
        {
          nom: "Nouvelle organisation",
          valeur: taux(t.deploiementFinal, 0),
          aide: "en place en semaine 13 ; attendu 100 %",
          tenu: t.deploiementFinal >= 0.99,
        },
        {
          nom: "Adhésion de l'équipe",
          valeur: sur100(t.adhesionFinale),
          aide: `en semaine 13 ; objectif ${nombre(OBJECTIF_ADHESION * 100, 0)}`,
          tenu: t.adhesionFinale >= OBJECTIF_ADHESION,
        },
        {
          nom: "Usage réel de l'outil",
          valeur: taux(t.usageFinal, 0),
          aide: `pour ${taux(t.saisiesFinales, 0)} de saisies affichées ; objectif ${taux(OBJECTIF_USAGE, 0)}`,
          tenu: t.usageFinal >= OBJECTIF_USAGE,
        },
        {
          nom: "Équipe",
          valeur: `${t.patrickPart ? COMMERCIAUX - 1 : COMMERCIAUX} sur ${COMMERCIAUX}`,
          aide: t.patrickPart
            ? "Patrick est parti chez un concurrent"
            : "commerciaux en fin de trimestre",
          tenu: !t.patrickPart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.livraison !== null
          ? [
              {
                titre: "L'éditeur",
                texte:
                  t.livraison === 7
                    ? "a livré la fiche simplifiée en semaine 7, comme prévu."
                    : "a livré la fiche simplifiée en semaine 10, avec trois semaines de retard.",
              },
            ]
          : []),
        ...(t.piloteReussi !== null
          ? [
              {
                titre: "Le pilote",
                texte: t.piloteReussi
                  ? "a réussi : ses portefeuilles ont fait mieux qu'avant, et l'équipe l'a vu."
                  : "a échoué : des clients perdus pendant les passations, et l'équipe l'a vu aussi.",
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: [
            t.patrickAccepte === true
              ? "Patrick a accepté d'être référent"
              : t.patrickAccepte === false
                ? "Patrick a refusé d'être référent"
                : null,
            t.patrickPart
              ? `${t.patrickAccepte === false ? "puis il" : "Patrick"} est parti chez un concurrent en semaine 10, avec une partie de ses artisans`
              : "personne n'est parti",
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
