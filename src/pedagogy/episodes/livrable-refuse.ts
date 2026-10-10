/**
 * ÉPISODE 66 — LE LIVRABLE QUE LE CLIENT REFUSE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Ewen montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 *
 * La mission se juge sur sa marge, et sur ce qu'elle laisse derrière elle :
 * le tableau de bord suit donc la marge à terminaison (le forfait, moins les
 * jours pointés et ceux qui restent à faire, moins les pénalités projetées),
 * et la courbe y ajoute la valeur espérée de la tranche optionnelle, qui suit
 * la confiance de la collectivité.
 */
import {
  CONFIANCE_DEPART,
  D,
  FACTEUR_ATTENDU,
  FORFAIT,
  JOURS_AVANT,
  JOURS_DE_REPRISE,
  JOURS_SANS_PERTE,
  JOURS_VENDUS,
  NEUTRE,
  PERTE_PAR_JOUR,
  SCENARIOS,
  TRANCHE,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  versionParfaiteRefusee,
  type Evenement,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/livrable-refuse";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/livrable-refuse";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 1)} j`;
/** Un montant signé : « +4 k€ », « −3 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

/** La marge que le cabinet attend encore de la mission après le refus. */
export const OBJECTIF_MARGE = 20000;
/** La valeur visée : cette marge, et une tranche optionnelle bien engagée. */
export const OBJECTIF_VALEUR = 35000;
/** Au-delà de ce nombre d'erreurs relevées par le client, le trimestre n'a pas tenu la qualité. */
export const PLAFOND_REMARQUES = 6;

const MARJOLAINE = {
  de: "Marjolaine Cadoret",
  role: "Directrice du patrimoine bâti, Ardven Agglomération",
} as const;
const TUDY = { de: "Tudy Gourvès", role: "Économe de flux, Ardven Agglomération" } as const;
const ELIAZ = { de: "Eliaz Lachèvre", role: "Analyste" } as const;

/** Les validations intermédiaires du trimestre : [décision, option]. */
export const VALIDATIONS = [
  [D.refus, 1],
  [D.phase2, 1],
  [D.relecture, 1],
  [D.copil, 0],
] as const;

/** Ce que les décisions révèlent, dans l'ordre où un manager de mission les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les trois qui montraient ce que le comité refusait vraiment et ce que coûterait la reprise",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    methode:
      "Votre diagnostic de la semaine 1 était juste : le comité refusait une hypothèse de méthode, l'année de référence des consommations, que personne ne lui avait fait valider.",
    validation:
      "En semaine 1, vous avez vu que le rapport était arrivé sans étape de validation : une vraie cause, mais elle ne disait pas quoi corriger. Ce qui devait être validé, c'était l'année de référence.",
    forme:
      "En semaine 1, vous avez retenu la forme du rapport ; six remarques sur huit en parlaient, mais la seule qui portait sur le fond expliquait le refus.",
    donnees:
      "En semaine 1, vous avez retenu des données incomplètes ; les factures étaient là, c'est l'année de référence qui n'était pas celle de la collectivité.",
  };
  const justes = ["methode", "validation"];
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
    score: d === "methode" ? 1 : d === "validation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais misé sur l'effort de la fin : ni la version « parfaite » du week-end, ni le renfort pour rattraper, ni la relecture de la veille, ni la correction au cas par cas, ni les samedis, ni la nuit avant le comité."
        : `Vous avez choisi ${n} fois l'effort de la fin plutôt que la validation en route : la version « parfaite » du week-end, le renfort pour rattraper, la relecture de la veille, la correction au cas par cas, les samedis ou la nuit avant le comité.${
            t.nouveauRefus ? " Le rapport intermédiaire a été refusé une deuxième fois." : ""
          }${t.arret ? " Shirin s'est arrêtée deux semaines." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    JOURS_DE_REPRISE,
    "de reprise pour recalculer les vingt-deux bâtiments",
    "jours",
    { juste: 2, proche: 6 },
    (e) => `${nombre(e)} jour${e >= 2 ? "s" : ""}`,
  );

  const faites = VALIDATIONS.filter(([dec, o]) => p.chemin[dec] === o).length;
  const methodeValidee = p.chemin[D.refus] === 1;
  const validations: Constat = {
    score: faites >= 3 && methodeValidee ? 1 : faites >= 1 ? 0.6 : 0,
    texte:
      faites === 0
        ? `Vous n'avez fait valider ni la méthode, ni un échantillon, ni les fiches par un pair, ni le rapport final avant le comité : chaque erreur a été trouvée par le client, ${nombre(t.remarques, 0)} en tout, au moment où elle coûtait le plus.`
        : `Vous avez posé ${faites} des quatre validations intermédiaires possibles (la méthode avec le client, un échantillon avant de généraliser, la relecture par un pair, la revue avant le comité final).${
            t.methode2Tardive
              ? " Les hypothèses de la phase 2 ont été découvertes en comité, sur toutes les fiches."
              : ""
          }${t.methode3Tardive ? " Les priorités du plan ont été contestées en comité final." : ""} Le client a relevé ${nombre(t.remarques, 0)} erreurs dans le trimestre.`,
  };

  return [information, diagnostic, reflexe, calibrage, validations];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  validations,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le refus avant de le corriger",
      texte:
        "Rejouez l'épisode en relisant d'abord le compte rendu et la note de méthode : une seule remarque portait sur le fond, et c'était elle qui expliquait le refus. Une reprise lancée avant de le savoir refait la même erreur.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Valider en route plutôt que tout reprendre à la fin",
      texte:
        "La qualité d'un livrable ne se rattrape pas par des week-ends : elle se construit par des validations intermédiaires, la méthode avec le client, un échantillon avant de généraliser, une relecture par un pair à chaque étape. Elles coûtent des jours ; les reprises tardives en coûtent bien plus.",
    };
  }
  if (validations!.score === 0) {
    return {
      titre: "Faire valider avant de généraliser",
      texte:
        "Une hypothèse que le client ne partage pas coûte deux jours sur trois fiches types et dix-sept sur vingt-deux fiches finies. Montrez tôt, sur peu, et généralisez ensuite.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher l'hypothèse derrière la forme",
      texte:
        "Un comité parle de la forme parce que c'est ce qu'il voit. Avant de corriger, cherchez l'hypothèse de méthode qu'on ne lui a jamais fait valider : c'est elle qui fait refuser.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer la reprise avant de la promettre",
      texte:
        "Posez-la bâtiment par bâtiment : ce qui est déjà fait et ne se refait pas (la visite, les factures), ce qui se recalcule, et la synthèse. C'est ce chiffre qui dit si la date tient.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Les messages qui disent ce qui est arrivé à la mission, au fil des semaines. */
function messageDe(quoi: Evenement, t: Trimestre): Message | null {
  switch (quoi) {
    case "temoins":
      return { ...TUDY, texte: REPONSES.temoins };
    case "accepteeV2":
      return { ...MARJOLAINE, texte: REPONSES.phase1Acceptee };
    case "retouchesV2":
      return { ...MARJOLAINE, alerte: true, texte: REPONSES.phase1Retouches };
    case "courrielLu":
      return { ...TUDY, texte: REPONSES.courrielLu };
    case "courrielSansReponse":
      return { ...ELIAZ, texte: REPONSES.courrielSansReponse };
    case "echantillonEcart":
      return { ...TUDY, texte: REPONSES.echantillonEcart };
    case "echantillonValide":
      return { ...TUDY, texte: REPONSES.echantillonValide };
    case "copil2Refus":
      return { ...MARJOLAINE, alerte: true, texte: REPONSES.copil2Refus };
    case "copil2Remarques":
      return { ...MARJOLAINE, alerte: true, texte: REPONSES.copil2Remarques };
    case "copil2Valide":
      return { ...MARJOLAINE, texte: REPONSES.copil2Valide };
    case "arretShirin":
      return {
        de: "Ressources humaines",
        role: "Atlas Conseil, Nantes",
        alerte: true,
        texte: REPONSES.arretShirin,
      };
    case "remiseAcceptee":
      return { ...MARJOLAINE, texte: REPONSES.remiseAcceptee };
    case "remiseRefusee":
      return { ...MARJOLAINE, alerte: true, texte: REPONSES.remiseRefusee };
    case "precopilEcart":
      return { ...TUDY, texte: REPONSES.precopilEcart };
    case "budget":
      return { ...MARJOLAINE, texte: REPONSES.budget[t.scenario]! };
    // Les réponses aux versions de janvier sont dites par la réaction de la première étape.
    default:
      return null;
  }
}

export const EPISODE_LIVRABLE: Episode<Trimestre> = {
  code: "livrable-refuse",
  numero: 66,
  domaine: "Qualité d'une mission",
  titre: "Le livrable que le client refuse",
  resume:
    "Un rapport intermédiaire refusé en comité de pilotage, vingt-deux bâtiments à auditer et une tranche optionnelle en jeu. Analyser le refus avant de le corriger, et valider en route plutôt que tout reprendre à la fin.",
  persona:
    "Vous êtes Ewen Le Goff, manager de mission chez Atlas Conseil, practice Énergie et bâtiment, au bureau de Rennes. Vous conduisez le diagnostic énergétique de vingt-deux bâtiments d'Ardven Agglomération (écoles, gymnases, une piscine, une médiathèque, des bâtiments administratifs), au forfait, avec Basile, Shirin et Eliaz. Le rapport intermédiaire vient d'être refusé en comité de pilotage.",
  mandat: [
    { fort: euros(FORFAIT), texte: `HT au forfait, soit ${nombre(JOURS_VENDUS, 0)} jours vendus` },
    { fort: `${JOURS_AVANT} jours`, texte: "déjà pointés sur la phase 1, pour 55 prévus" },
    { fort: "31 mars", texte: "la remise du rapport final" },
    {
      fort: euros(TRANCHE.honoraires),
      texte: "d'honoraires de tranche optionnelle, si l'agglomération l'affermit",
    },
  ],
  jugement:
    "L'associée juge le trimestre sur la marge de la mission (le forfait, moins les jours consommés à leur coût, les samedis rachetés et les pénalités de retard), plus la valeur espérée de la tranche optionnelle : sa marge, multipliée par la chance que l'agglomération l'affermisse.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre mission",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'équipe staffée sur la mission attend vos consignes : ses jours se pointent quand même.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Basile Quéré",
        role: "Consultant senior, thermicien",
        alerte: true,
        texte: `On a attendu tes consignes sans pouvoir avancer : ${euros(perdu)} de jours pointés sur la mission pour rien.`,
      };
    },
  },
  prevision: {
    libelle:
      "les jours de reprise si les vingt-deux bâtiments doivent être recalculés avec une autre année de référence, synthèse comprise",
    unite: "j",
    placeholder: "40",
    min: 0,
    max: 200,
    step: 0.5,
    reel: () => JOURS_DE_REPRISE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "jours",
      nom: "Jours pointés",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `depuis le début de la mission ; ${nombre(JOURS_VENDUS, 0)} vendus`,
      jauge: (l) => ({
        part: Math.min(1, (l.jours ?? 0) / JOURS_VENDUS),
        enRetard: (l.jours ?? 0) > JOURS_VENDUS,
      }),
    },
    {
      cle: "confiance",
      nom: "Confiance de l'agglomération",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "lue dans les échanges et les comités",
    },
    {
      cle: "manque",
      nom: "Jours qui manquent",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `pour tenir le 31 mars ; reste à faire : ${nombre(l.reste ?? 0, 0)} j`
          : "au planning d'avant le refus",
    },
    {
      cle: "remarques",
      nom: "Erreurs relevées par le client",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "depuis janvier",
    },
    {
      cle: "marge",
      nom: "Marge à terminaison",
      format: kE,
      sensBon: 1,
      aide: () => `estimée sur ${kE(FORFAIT)} de forfait`,
    },
  ],
  contexte(l, decisions): Contexte {
    const manque = l.manque ?? 0;
    return {
      jours: `${nombre(l.jours ?? 0, 0)} jours`,
      reste: `${nombre(l.reste ?? 0, 0)} jours`,
      capacite: `${nombre(l.capacite ?? 0, 0)} jours`,
      manque: `${nombre(manque, 0)} jours`,
      manquant: Math.round(manque) > 0,
      fiches: nombre(l.fiches ?? 0, 0),
      remarques: nombre(l.remarques ?? 0, 0),
      confiance: taux(l.confiance ?? CONFIANCE_DEPART, 0),
      phase1Validee: (l.phase1 ?? 0) === 1,
      nouveauRefus: (l.nouveauRefus ?? 0) === 1,
      sousReserve: (l.sousReserve ?? 0) === 1,
      methodeValidee: decisions[D.refus] === 1,
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    const pointes = (t.semaines.slice(de, a + 1) as Semaine[]).reduce((x, w) => x + w.pointes, 0);
    return [
      [`Valeur estimée, sem. ${a}`, kE(s.valeur)],
      ["Jours pointés sur la période", jours(pointes)],
      [`Confiance, sem. ${a}`, taux(s.confiance, 0)],
    ];
  },
  courbe: {
    titre: "Marge à terminaison et tranche espérée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-40000, -20000, 0, 20000, 40000, 60000, 80000],
    format: kE,
    details: (s) => [
      `marge à terminaison ${kE(s.marge!)} · tranche espérée ${kE(s.valeur! - s.marge!)}`,
      `confiance ${taux(s.confiance!, 0)} · ${nombre(s.manque!, 0)} j qui manquent`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.refus && choix === 0) {
      // La version « parfaite » refaite avec la même méthode : le comité tranche selon le hasard.
      return [
        {
          ...MARJOLAINE,
          texte: versionParfaiteRefusee(graine)
            ? REPONSES.parfaiteRefusee
            : REPONSES.parfaiteSousReserve,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    for (const { semaine, quoi } of arrive.journal) {
      const m = messageDe(quoi, t);
      if (!m) continue;
      if (quoi === "budget") imprevus.push({ ...m, heure: `sem. ${semaine}` });
      else lies.push({ ...m, heure: `sem. ${semaine}` });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      `${kE(t.objectif)} : ${kE(t.marge)} de marge et ${kE(t.valeurTranche)} de tranche espérée`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge de la mission (jours pointés, samedis rachetés, pénalités de retard) plus la valeur espérée de la tranche optionnelle, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const aLaDate = t.retard < 0.05;
      return [
        {
          nom: "Marge de la mission",
          valeur: kE(t.marge),
          aide: `${taux(t.marge / FORFAIT, 0)} du forfait ; objectif ${kE(OBJECTIF_MARGE)}`,
          tenu: t.marge >= OBJECTIF_MARGE,
        },
        {
          nom: "Rapport final",
          valeur: aLaDate ? "à la date" : `${nombre(t.retard, 1)} sem. de retard`,
          aide: aLaDate
            ? t.remise
              ? "le plan pluriannuel deux semaines plus tard, comme convenu"
              : "remis le 31 mars"
            : `${euros(t.penalites)} de pénalités`,
          tenu: aLaDate,
        },
        {
          nom: "Erreurs relevées par le client",
          valeur: nombre(t.remarques, 0),
          aide: `dans le trimestre ; plafond ${PLAFOND_REMARQUES}`,
          tenu: t.remarques <= PLAFOND_REMARQUES,
        },
        {
          nom: "Tranche optionnelle",
          valeur: taux(t.chanceTranche * SCENARIOS[t.scenario]!.facteur, 0),
          aide: `chance d'affermissement ; ${kES(t.valeurTranche)} espérés`,
          tenu: t.chanceTranche * SCENARIOS[t.scenario]!.facteur >= 0.4,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const d1 = t.chemin[D.refus];
      const collectivite =
        d1 === 1
          ? "a validé la méthode en atelier, puis la nouvelle version du rapport intermédiaire."
          : t.sousReserve
            ? "a accepté la version du week-end sous réserve, puis a tout refusé au comité de phase 2."
            : t.nouveauRefus
              ? "a refusé une deuxième fois le rapport intermédiaire, avant de valider la méthode."
              : "a envoyé ses remarques écrites en semaine 3, puis a validé la nouvelle version.";
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        { titre: "L'agglomération", texte: collectivite },
        {
          titre: "Les hypothèses de la phase 2",
          texte: !t.methode2
            ? "étaient celles de l'agglomération : rien à reprendre."
            : t.methode2Tardive
              ? "n'étaient pas celles de l'agglomération ; l'écart a été découvert en comité, sur toutes les fiches."
              : "n'étaient pas celles de l'agglomération ; l'écart a été trouvé tôt, sur peu de fiches.",
        },
        {
          titre: "Les priorités du plan",
          texte: !t.methode3
            ? "suivaient les critères des élus."
            : t.methode3Tardive
              ? "ne suivaient pas les critères des élus, qui l'ont dit en comité final."
              : "ne suivaient pas les critères des élus ; elles ont été reprises avant le comité.",
        },
        ...(t.remise !== null
          ? [
              {
                titre: "La remise en deux temps",
                texte: t.remise
                  ? "a été acceptée par le directeur général des services."
                  : "a été refusée : le rapport complet était attendu au 31 mars.",
              },
            ]
          : []),
        {
          titre: "Le budget de l'agglomération",
          texte: `${SCENARIOS[t.scenario]!.nom} : ${taux(SCENARIOS[t.scenario]!.facteur, 0)} de la chance d'affermissement maintenue (${taux(FACTEUR_ATTENDU, 0)} en moyenne).`,
        },
        {
          titre: "L'équipe",
          texte: t.arret
            ? "Shirin s'est arrêtée deux semaines après des samedis travaillés."
            : "personne ne s'est arrêté.",
        },
      ];
    },
  },
  comportements,
  axe,
};
