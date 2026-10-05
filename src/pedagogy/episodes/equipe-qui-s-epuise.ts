/**
 * ÉPISODE 2 — L'ÉQUIPE QUI S'ÉPUISE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Nadia montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 */
import {
  BUDGET,
  D,
  EFFECTIF,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_DELAI,
  OBJECTIF_SATISFACTION,
  PERTE_PAR_JOUR,
  SEUIL_ABSENTEISME,
  campagneDecalee,
  evenements,
  hasard,
  mathieuReste,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/equipe-qui-s-epuise";
import {
  DIAGNOSTICS,
  ETAPES,
  PRESSIONS,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/equipe-qui-s-epuise";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v)} j`;
/** Un écart au budget : positif, le service est resté en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient d'où venait la charge",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    relances:
      "Votre diagnostic de la semaine 1 était juste : les retards fabriquaient des relances, qui fabriquaient des retards.",
    effectif:
      "En semaine 1, vous avez vu le manque de monde : une vraie cause, mais pas celle qui remplissait la file. Près de quatre demandes sur dix étaient des relances.",
    productivite:
      "En semaine 1, vous avez retenu la productivité des conseillers ; la comparaison avec le groupe la montrait normale.",
    motivation:
      "En semaine 1, vous avez retenu la motivation de l'équipe ; ce qui la minait, c'était une file qu'aucun effort ne vidait.",
  };
  const justes = ["relances", "effectif"];
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
    score: d === "relances" ? 1 : d === "effectif" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = PRESSIONS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const pression: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la surcharge en demandant plus à l'équipe : vous avez retiré du travail plutôt qu'ajouté des heures."
        : `Face à la surcharge, vous avez demandé plus à l'équipe ${n} fois sur ${ETAPES.length} décisions. La capacité gagnée tout de suite revenait plus tard en fatigue, puis en absences.${
            t.inesPart ? " Inès a fini par démissionner en semaine 10." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.delai,
    "de délai de réponse en semaine 3",
    "jours",
    { juste: 0.3, proche: 0.8 },
    (e) => `${nombre(e)} jour${e >= 2 ? "s" : ""}`,
  );

  const conflitTraite = p.chemin[D.conflit] === 0 || p.chemin[D.conflit] === 1;
  const teletravailCadre = p.chemin[D.teletravail] === 0;
  const tensions = (conflitTraite ? 1 : 0) + (teletravailCadre ? 1 : 0);
  const equipe: Constat = {
    score: tensions === 2 ? 1 : tensions === 1 ? 0.6 : 0,
    texte: `${
      conflitTraite
        ? "Vous avez traité le conflit entre Sophie et Romain au lieu de le laisser s'user."
        : p.chemin[D.conflit] === 2
          ? "Vous avez tranché le conflit entre Sophie et Romain sans en traiter la cause : la charge des litiges."
          : `Vous avez laissé le conflit entre Sophie et Romain se régler seul${t.sophieArret ? " ; Sophie s'est arrêtée trois semaines" : ""}.`
    } ${
      teletravailCadre
        ? "Vous avez répondu à la demande de télétravail avec un cadre."
        : "La demande de télétravail est restée sans réponse cadrée."
    }`,
  };

  return [information, diagnostic, pression, calibrage, equipe];
}

export function axe([information, diagnostic, pression, calibrage, equipe]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder ce qui remplit la file",
      texte:
        "Rejouez l'épisode en analysant d'abord les demandes de la semaine : près de quatre sur dix étaient des relances, que l'accusé de réception aurait fait disparaître.",
    };
  }
  if (pression!.score === 0) {
    return {
      titre: "Retirer du travail plutôt qu'en demander plus",
      texte:
        "Des heures ou des objectifs en plus donnent de la capacité pour un mois et de la fatigue pour un trimestre. Cherchez d'abord le travail qu'on peut supprimer.",
    };
  }
  if (equipe!.score === 0) {
    return {
      titre: "Traiter les tensions tôt",
      texte:
        "Un conflit ou une demande laissés sans réponse usent l'équipe semaine après semaine. Une heure de discussion coûte moins qu'un arrêt.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fabrique la charge",
      texte:
        "Quand une file grossit, regardez ce qui y entre avant de regarder qui la vide : une partie de la charge est souvent produite par le retard lui-même.",
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

const MATHIEU = { de: "Mathieu Roche", role: "Conseiller" } as const;

export const EPISODE_EQUIPE: Episode<Trimestre> = {
  code: "equipe-qui-s-epuise",
  numero: 2,
  domaine: "Management d'équipe",
  titre: "L'équipe qui s'épuise",
  resume:
    "Un service client dont les délais s'allongent et l'équipe se fatigue. Retirer du travail avant d'en demander plus.",
  persona:
    "Vous êtes Nadia Haddad, responsable du service client d'Arvel Distribution, à Villeurbanne. Votre équipe : douze conseillers, qui répondent aux artisans et aux grands comptes par téléphone et par e-mail.",
  mandat: [
    { fort: `${OBJECTIF_DELAI} jours`, texte: "de délai de réponse, au plus" },
    { fort: "85 %", texte: "de clients satisfaits au moins" },
    { fort: kE(BUDGET), texte: "de budget variable (heures, intérim, recrutement)" },
    { fort: "6 %", texte: "d'absentéisme, au plus" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget du service, en comptant ce que coûtent les clients perdus, les gestes commerciaux et les départs.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre service",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les clients qui attendent finissent par coûter des gestes commerciaux.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Hélène Garnier",
        role: "Directrice des opérations",
        alerte: true,
        texte: `Pendant ce temps, deux grands comptes excédés ont obtenu un geste commercial : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le délai de réponse en semaine 3, en jours",
    unite: "j",
    placeholder: "3,5",
    min: 0,
    max: 20,
    step: 0.1,
    reel: (t) => t.semaines[3]!.delai,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "delai",
      nom: "Délai de réponse",
      format: jours,
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_DELAI} jours au plus`,
    },
    {
      cle: "satisfaction",
      nom: "Clients satisfaits",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => "objectif : 85 % au moins",
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "groupe : 5 %",
    },
    {
      cle: "file",
      nom: "Demandes en attente",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `fin de semaine ${semaine}` : "ce matin"),
    },
    {
      cle: "depenses",
      nom: "Budget variable consommé",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.depenses ?? 0) / BUDGET),
              enRetard: (l.depenses ?? 0) > l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      delai: jours(l.delai ?? 0),
      file: nombre(l.file ?? 0, 0),
      satisfaction: taux(l.satisfaction ?? 0, 0),
      absenteisme: taux(l.absenteisme ?? 0),
      fileSoulagee: decisions[D.file] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const depense = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      [`Délai, sem. ${a}`, jours(t.semaines[a]!.delai)],
      [`Satisfaction, sem. ${a}`, taux(t.semaines[a]!.satisfaction, 0)],
      ["Coût de la période", kE(depense)],
    ];
  },
  courbe: {
    titre: "Délai de réponse, semaine par semaine",
    cle: "delai",
    cible: OBJECTIF_DELAI,
    libelleCible: `objectif : ${OBJECTIF_DELAI} jours au plus`,
    graduations: [2, 5, 10, 15],
    format: (v) => `${nombre(v, 0)} j`,
    details: (s) => [
      `délai ${jours(s.delai!)} · ${nombre(s.file!, 0)} en attente`,
      `satisfaction ${taux(s.satisfaction!, 0)} · absences ${taux(s.absenteisme!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.campagne && choix === 0) {
      // Seul le choix de demander compte : le marketing répond selon le hasard du trimestre.
      const decalee = campagneDecalee([...NEUTRE.slice(0, D.campagne), 0], graine);
      return [
        {
          de: "Marketing",
          role: "Siège",
          texte: decalee ? REPONSES.campagneDecalee : REPONSES.campagneMaintenue,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (chemin[D.mathieu] === 3 && de <= 4 && a >= 4) {
      lies.push({
        ...MATHIEU,
        heure: "sem. 4",
        texte: mathieuReste(chemin, graine) ? REPONSES.mathieuReste : REPONSES.mathieuPart,
      });
    }
    if (arrive.mathieuPart) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: "sem. 6",
        texte: "Mathieu a quitté le service vendredi. Son pot de départ a réuni toute l'équipe.",
      });
    }
    if (arrive.sophieArret) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: "sem. 8",
        alerte: true,
        texte: "Sophie Lambert est en arrêt de travail pour trois semaines.",
      });
    }
    if (arrive.inesPart) {
      lies.push({
        de: "Inès Moreau",
        role: "Conseillère",
        heure: "sem. 10",
        alerte: true,
        texte:
          "Nadia, je démissionne. Je n'en peux plus de courir. Je pars tout de suite, en solde de congés.",
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget variable du service, clients perdus, gestes commerciaux et départs compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Délai de réponse",
          valeur: jours(t.delaiFinal),
          aide: `en semaine 13 ; objectif ${OBJECTIF_DELAI} j`,
          tenu: t.delaiFinal <= OBJECTIF_DELAI,
        },
        {
          nom: "Clients satisfaits",
          valeur: taux(t.satisfactionMoyenne, 0),
          aide: "en moyenne ; objectif 85 %",
          tenu: t.satisfactionMoyenne >= OBJECTIF_SATISFACTION,
        },
        {
          nom: "Absentéisme",
          valeur: taux(t.absenteismeMoyen),
          aide: "en moyenne ; plafond 6 %",
          tenu: t.absenteismeMoyen <= SEUIL_ABSENTEISME,
        },
        {
          nom: "Équipe",
          valeur: `${t.effectifFinal} sur ${EFFECTIF}`,
          aide: t.inesPart ? "Inès a démissionné" : "conseillers en fin de trimestre",
          tenu: t.effectifFinal >= EFFECTIF - 1 && !t.inesPart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.campagneDecalee
          ? [{ titre: "Le marketing", texte: "a accepté de décaler la campagne en semaine 12." }]
          : []),
        {
          titre: "L'équipe",
          texte: [
            t.mathieuReste ? "Mathieu est resté" : "Mathieu est parti en semaine 5",
            t.sophieArret ? "Sophie s'est arrêtée trois semaines" : null,
            t.inesPart ? "Inès a démissionné en semaine 10" : "personne d'autre n'est parti",
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
