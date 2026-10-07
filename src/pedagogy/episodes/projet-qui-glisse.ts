/**
 * ÉPISODE 5 — LE PROJET QUI GLISSE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Camille montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  CADENCE,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAN_DEPART,
  SEMAINES,
  evenements,
  hasard,
  saintPriestRefuse,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/projet-qui-glisse";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  type IdDiagnostic,
} from "@/config/episodes/projet-qui-glisse";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jh = (v: number) => `${nombre(v, 0)} jh`;
const semaines = (v: number) => `${nombre(v)} semaine${v >= 2 ? "s" : ""}`;
/** La valeur nette du projet : ce qu'il apporte, dérapages déduits. */
const valeurNette = (v: number) =>
  v >= 0
    ? `${kE(v)} de valeur nette, retards et défauts déduits`
    : `${kE(v)} : les dérapages ont coûté plus que l'outil n'a rapporté`;

const JUSTES: readonly string[] = ["perimetre", "recette"];

/** Ce que les décisions révèlent, dans l'ordre où une cheffe de projet les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qui entrait au périmètre",
  );

  const d = p.diagnostic as IdDiagnostic;
  const lecture: Record<IdDiagnostic, string> = {
    perimetre:
      "Votre diagnostic de la semaine 1 était juste : les demandes acceptées au fil de l'eau ajoutaient presque autant de travail que l'équipe en abattait.",
    recette:
      "En semaine 1, vous avez vu la recette en retard : une vraie difficulté, mais pas celle qui faisait glisser la date. Le périmètre grossissait de près de 9 jh par semaine.",
    effectif:
      "En semaine 1, vous avez retenu le manque de bras ; l'équipe abattait son travail, mais il en rentrait presque autant qu'elle en sortait.",
    prestataire:
      "En semaine 1, vous avez retenu le prestataire ; le contrôle de ses livraisons le montrait au rythme prévu.",
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
    score: d === "perimetre" ? 1 : d === "recette" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Face à la date, vous n'avez jamais ajouté de monde, d'heures ou de demandes, ni rogné les tests : vous avez retiré du travail plutôt que d'en forcer le passage."
        : `Face à la date, vous avez ${n === 1 ? "une fois" : `${n} fois`} renforcé l'équipe, forcé les heures, accepté une demande pour faire plaisir ou rogné les tests. Sur trente tirages, ce qu'on gagnait tout de suite revenait plus tard en retard ou en défauts.${
            t.incident ? " L'ouverture a connu une panne." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.raf,
    "de reste à faire en fin de semaine 3",
    "jh",
    { juste: 10, proche: 25 },
    (e) => jh(e),
  );

  const perimetreTenu = p.chemin[D.cap] === 1 || p.chemin[D.pilotage] === 1;
  const recetteProtegee = p.chemin[D.recette] === 1 && p.chemin[D.tests] !== 0;
  const tenus = (perimetreTenu ? 1 : 0) + (recetteProtegee ? 1 : 0);
  const projet: Constat = {
    score: tenus === 2 ? 1 : tenus === 1 ? 0.6 : 0,
    texte: `${
      p.chemin[D.cap] === 1 && p.chemin[D.pilotage] === 1
        ? "Vous avez gelé le périmètre, puis découpé : l'essentiel est sorti à la date."
        : perimetreTenu
          ? `Vous avez ${p.chemin[D.cap] === 1 ? "gelé le périmètre sans découper ensuite" : "découpé sans avoir gelé le périmètre"} : la moitié du chemin.`
          : `Le périmètre est resté ouvert : ${jh(t.demandesAcceptees)} de demandes sont entrées en cours de route.`
    } ${
      recetteProtegee
        ? "Vous avez donné à la recette ses testeurs et son temps."
        : `La recette n'a pas eu ses testeurs ou son temps : ${nombre(t.defautsLivres, 0)} défauts sont partis en service sans avoir été trouvés.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, projet];
}

export function axe([information, diagnostic, reflexe, calibrage, projet]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer le reste à faire réel",
      texte:
        "Rejouez l'épisode en recomptant d'abord le reste à faire et en lisant le registre des demandes : il rentrait presque autant de travail que l'équipe en abattait.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Retirer du travail plutôt qu'ajouter des bras",
      texte:
        "Des renforts, des heures ou des demandes acceptées pour faire plaisir donnent l'impression d'agir ; ils ajoutent de la coordination, des défauts et du retard. Cherchez d'abord ce qu'on peut sortir du périmètre.",
    };
  }
  if (projet!.score === 0) {
    return {
      titre: "Geler, découper, protéger la recette",
      texte:
        "Une date se tient en choisissant ce qui sort à la date, pas en courant plus vite. Et un défaut trouvé en recette coûte une journée ; livré, il en coûte bien plus.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder ce qui entre, pas seulement ce qui sort",
      texte:
        "Quand un projet glisse, mesurez ce qui s'ajoute au périmètre chaque semaine avant de juger la vitesse de l'équipe : le retard vient souvent de là.",
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

const BRUNO = { de: "Bruno Castel", role: "Directeur commercial" } as const;

export const EPISODE_PROJET: Episode<Trimestre> = {
  code: "projet-qui-glisse",
  numero: 27,
  domaine: "Gestion de projet",
  titre: "Le projet qui glisse",
  resume:
    "Un portail de commande en ligne promis pour la semaine 13, qui prend du retard. Tenir la date en choisissant ce qui sort, pas en courant plus vite.",
  persona:
    "Vous êtes Camille Ferrand, cheffe de projet à la direction des systèmes d'information d'Arvel Distribution, à Lyon. Vous déployez Arvel Pro, le portail de commande en ligne des artisans, avec quatre développeurs internes, deux développeurs du prestataire Studio Lumen et huit utilisateurs clés prêtés par les agences.",
  mandat: [
    { fort: "Semaine 13", texte: "mise en service annoncée aux artisans" },
    { fort: "220 jh", texte: "de reste à faire, pour une équipe qui en abat 24 par semaine" },
    { fort: kE(BUDGET), texte: "de budget pour le trimestre, équipe et prestataire" },
    { fort: "0", texte: "défaut bloquant à l'ouverture" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la valeur nette du projet : ce que rapporte ce qui est mis en service, diminué de chaque semaine de retard, moins les surcoûts, le travail qui reste, le lancement manqué et les défauts livrés.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre projet",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'équipe continue d'avancer sans cap : du travail qu'il faudra reprendre.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Yannick Meunier",
        role: "Développeur principal",
        alerte: true,
        texte: `Pendant ce temps, on a développé deux demandes d'agence qu'il faudra sans doute défaire : ${euros(perdu)} de travail perdu.`,
      };
    },
  },
  prevision: {
    libelle: "le reste à faire en fin de semaine 3, en jours-homme",
    unite: "jh",
    placeholder: "180",
    min: 0,
    max: 600,
    step: 5,
    reel: (t) => t.semaines[3]!.raf,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "avancement",
      nom: "Avancement",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (_, l) =>
        l.decoupe
          ? `plan initial : ${taux(l.plan ?? PLAN_DEPART, 0)} ; lot 2 reporté`
          : `plan : ${taux(l.plan ?? PLAN_DEPART, 0)}`,
      jauge: (l) =>
        l.avancement == null || l.plan == null
          ? null
          : { part: Math.min(1, l.avancement), enRetard: l.avancement < l.plan },
    },
    {
      cle: "raf",
      nom: "Reste à faire",
      format: jh,
      sensBon: -1,
      aide: (_, l) =>
        l.decoupe ? "l'essentiel, avant l'ouverture" : "tout le périmètre, avant l'ouverture",
    },
    {
      cle: "demandes",
      nom: "Demandes en attente",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "demandes des agences pas encore tranchées",
    },
    {
      cle: "ouverts",
      nom: "Défauts ouverts",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "trouvés en recette, pas encore corrigés",
    },
    {
      cle: "budget",
      nom: "Budget consommé",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
    },
  ],
  contexte(l, decisions) {
    const rythme = l.rythme ?? 0;
    return {
      avancement: taux(l.avancement ?? 0, 0),
      plan: taux(l.plan ?? 0, 0),
      raf: jh(l.raf ?? 0),
      ouverts: nombre(l.ouverts ?? 0, 0),
      demandes: nombre(l.demandes ?? 0, 0),
      gele: decisions[D.cap] === 1,
      rythme: jh(rythme),
      semainesRestantes:
        rythme > 0 && (l.rafTotal ?? 0) / rythme <= 20
          ? nombre((l.rafTotal ?? 0) / rythme, 0)
          : "plus de vingt",
      partCoeur: taux(l.partCoeur ?? 0, 0),
    };
  },
  recap(t, de, a) {
    const periode = t.semaines.slice(de, a + 1) as Semaine[];
    const depense = periode.reduce((x, w) => x + w.depense, 0);
    return [
      [`Reste à faire, sem. ${a}`, jh(t.semaines[a]!.raf)],
      [`Défauts ouverts, sem. ${a}`, nombre(t.semaines[a]!.ouverts, 0)],
      ["Surcoûts de la période", kE(depense)],
    ];
  },
  courbe: {
    titre: "Reste à faire abattu, semaine par semaine",
    cle: "net",
    cible: CADENCE,
    libelleCible: `cadence du plan : ${CADENCE} jh par semaine`,
    graduations: [10, 20, 30],
    format: (v) => `${nombre(v, 0)} jh`,
    details: (s) => [
      `${jh(s.realise!)} développés · ${jh(s.ajoute!)} ajoutés`,
      `reste à faire ${jh(s.rafTotal!)} · ${nombre(s.ouverts!, 0)} défauts ouverts`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.recette && choix === 1) {
      // Seul le choix compte : l'agence de Saint-Priest répond selon le hasard du trimestre.
      return [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte: saintPriestRefuse(graine)
            ? REPONSES.saintPriestRefuse
            : REPONSES.saintPriestAccepte,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.directeurAttend) {
      lies.push({ ...BRUNO, heure: "sem. 6", texte: REPONSES.directeurAttend });
    }
    if (arrive.devisImpose) {
      lies.push({ ...BRUNO, heure: "sem. 7", alerte: true, texte: REPONSES.directeurImpose });
    }
    if (arrive.incident) {
      const pilote = chemin[D.ouverture] === 1;
      lies.push({
        de: "Support des agences",
        role: "Siège",
        heure: pilote ? "sem. 12" : "sem. 13",
        alerte: true,
        texte: pilote
          ? "Chez les deux agences pilotes, les commandes avec remise chantier sont restées bloquées six heures. Corrigé avant l'ouverture générale."
          : "Le jour de l'ouverture, les commandes avec remise chantier sont restées bloquées six heures. Les agences ont repris les commandes au téléphone.",
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
    titre: (t) => valeurNette(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Valeur nette du projet — ce qui est mis en service, diminué du retard, moins les surcoûts, le travail restant, le lancement manqué et les défauts livrés — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const aLaDate = t.glissement === 0 && !t.report;
      return [
        {
          nom: "Mise en service",
          valeur: aLaDate
            ? "semaine 13"
            : `semaine ${SEMAINES + (t.report ? 4 : 0) + Math.ceil(t.glissement)}`,
          aide: t.decoupe
            ? "l'essentiel à la date, le reste en lot 2"
            : t.report
              ? "report annoncé en semaine 7"
              : "tout le périmètre d'un bloc",
          tenu: aLaDate,
        },
        {
          nom: "Demandes acceptées",
          valeur: jh(t.demandesAcceptees),
          aide: "ajoutés au périmètre en cours de route",
          tenu: t.demandesAcceptees <= 40,
        },
        {
          nom: "Défauts livrés",
          valeur: nombre(t.defautsLivres, 0),
          aide: t.incident
            ? "et une panne le jour de l'ouverture"
            : "partis en service sans avoir été trouvés",
          tenu: t.defautsLivres <= 8 && !t.incident,
        },
        {
          nom: "Budget",
          valeur: kE(t.budgetConsomme),
          aide: `consommé, sur ${kE(BUDGET)}`,
          tenu: t.budgetConsomme <= BUDGET,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.saintPriestRefuse
          ? [
              {
                titre: "L'agence de Saint-Priest",
                texte: "a gardé ses deux utilisateurs clés au comptoir.",
              },
            ]
          : []),
        {
          titre: "Le projet",
          texte: [
            t.devisImpose
              ? "le devis en ligne est entré dans l'ouverture"
              : t.directeurAttend
                ? "Bruno Castel a accepté d'attendre le lot 2"
                : null,
            t.glissement === 0
              ? t.report
                ? "la date reportée a été tenue"
                : "l'essentiel a ouvert en semaine 13"
              : `la mise en service a glissé de ${semaines(Math.ceil(t.glissement))}`,
            t.incident
              ? "l'ouverture a connu une panne de six heures"
              : "l'ouverture s'est passée sans panne",
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
