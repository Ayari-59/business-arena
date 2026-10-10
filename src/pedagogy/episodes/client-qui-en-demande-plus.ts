/**
 * ÉPISODE 65 — LE CLIENT QUI EN DEMANDE TOUJOURS PLUS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Amélie montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Le tableau de bord suit ce qu'une directrice de mission lit chaque lundi
 * dans l'outil de suivi des temps : le taux de réalisation et la marge à
 * terminaison projetés (si plus rien ne s'ajoutait), le retard du cœur de
 * mission, les jours hors périmètre non facturés, et la satisfaction de la
 * sponsor telle que les points mensuels la laissent deviner.
 */
import {
  CAPACITE,
  COUT_JOUR,
  D,
  HONORAIRES,
  JOURS_BUDGET,
  JOURS_SANS_PERTE,
  MARGE_BUDGET,
  MARGE_SUITE,
  NEUTRE,
  OBJECTIF_REALISATION,
  PERTE_PAR_JOUR,
  PROVISION,
  REALISATION_SI_ABSORBE,
  SATISFACTION_DEPART,
  SUITE,
  avenant1Signe,
  evenements,
  hasard,
  regieAcceptee,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/client-qui-en-demande-plus";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/client-qui-en-demande-plus";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des jours : « 1 jour », « 12 jours ». */
const jours = (v: number) => {
  const n = Math.round(Math.max(0, v));
  return `${n.toLocaleString("fr-FR")} jour${n >= 2 ? "s" : ""}`;
};
/** Le retard du cœur : en jours, ou l'avance prise quand un livrable est sorti du périmètre. */
const retard = (v: number) =>
  v <= -0.5 ? `${nombre(-v, 0)} j d'avance` : `${nombre(Math.max(0, v), 0)} j`;
const points = (e: number) => `${nombre(e)} point${e >= 2 ? "s" : ""}`;

/** Le taux de réalisation si les demandes de la semaine 1 étaient absorbées, en % : ce que la prévision demande. */
export const PREVISION_EN_POURCENTS = REALISATION_SI_ABSORBE * 100;

/** Ce que les décisions révèlent, dans l'ordre où une directrice de mission les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient ce que Morvanel avait acheté et ce que coûtaient ses demandes",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    perimetre:
      "Votre diagnostic de la semaine 1 était juste : le périmètre glissait, et chaque demande absorbée sans avenant coûtait deux fois, en jours non facturés et en retard sur ce que la sponsor avait acheté.",
    besoins:
      "En semaine 1, vous avez vu de vrais besoins, et c'en étaient : ils ont fait la matière de la suite. Mais tant qu'ils entraient gratuitement dans le forfait, ils détruisaient la marge et retardaient le cœur de mission.",
    equipe:
      "En semaine 1, vous avez retenu la productivité de l'équipe ; elle tenait son plan, c'est le plan qui grossissait chaque semaine.",
    client:
      "En semaine 1, vous avez vu un client qui teste le cabinet ; Brieuc avait de vrais besoins, et personne ne lui avait jamais donné de prix.",
  };
  const justes = ["perimetre", "besoins"];
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
    score: d === "perimetre" ? 1 : d === "besoins" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais dit oui pour faire plaisir : chaque demande a reçu un prix, un échange ou une date, et la suite s'est jouée sur les livrables, pas sur une remise."
        : `Vous avez dit oui pour faire plaisir ${n} fois sur ${ETAPES.length} décisions : accepter sans avenant, laisser l'équipe rendre service, acheter la suite par une remise. Au bout du trimestre, ${jours(t.absorbes)} hors périmètre non facturés et un taux de réalisation de ${taux(t.realisation, 0)}.${
            t.erreur ? " L'équipe, à force de courir, a livré un standard faux." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PREVISION_EN_POURCENTS,
    "de taux de réalisation si les demandes de la semaine 1 étaient absorbées gratuitement",
    "%",
    { juste: 0.5, proche: 2 },
    points,
  );

  const cadrages = [
    p.chemin[D.demandes] === 1,
    p.chemin[D.demarrage] === 1 || p.chemin[D.demarrage] === 2,
    p.chemin[D.comite] === 1,
    p.chemin[D.coupsDeMain] === 1,
  ].filter(Boolean).length;
  const secs =
    (p.chemin[D.demandes] === 2 ? 1 : 0) +
    (p.chemin[D.demarrage] === 3 ? 1 : 0) +
    (p.chemin[D.coupsDeMain] === 3 ? 1 : 0);
  const perimetre: Constat = {
    score: cadrages === 4 ? 1 : cadrages >= 2 ? 0.6 : 0,
    texte: `${
      cadrages === 4
        ? "Vous avez tenu le périmètre sans fermer la porte : un avenant proposé tôt, un échange ou un avenant pour la ligne de surgelés, un registre arbitré par la sponsor, le reporting rendu à l'usine."
        : cadrages >= 2
          ? `Vous avez cadré le périmètre ${cadrages} fois sur quatre occasions de le faire : avenant proposé tôt, échange contre un livrable moins utile, registre arbitré par la sponsor, travail rendu à l'usine.`
          : "Vous n'avez presque jamais transformé une demande en avenant ou en échange : le forfait a payé ce que le client demandait en plus."
    }${
      secs >= 2
        ? ` Vous avez aussi dit non sèchement ${secs} fois : la marge était protégée, la relation avec Brieuc beaucoup moins${t.escalade ? ", et il s'en est plaint à Aourell" : ""}.`
        : ""
    } Au comité final, Aourell ${
      t.suiteAccordee
        ? "a donné son accord de principe pour la suite"
        : "a mis la suite en concurrence"
    }.`,
  };

  return [information, diagnostic, reflexe, calibrage, perimetre];
}

export function axe([information, diagnostic, reflexe, calibrage, perimetre]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Relire ce que le client a acheté",
      texte:
        "Rejouez l'épisode en relisant d'abord la proposition signée et en chiffrant les demandes : une des quatre était déjà au contrat, les trois autres faisaient 34 jours, soit un avenant de 34 k€ quand le client avait encore du budget.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Donner un prix avant de dire oui",
      texte:
        "Au forfait, chaque jour offert coûte son coût de revient et retarde ce que la sponsor a acheté. Proposez un avenant tôt, ou un échange contre un livrable moins utile : le client garde ce qu'il veut, la mission garde sa marge.",
    };
  }
  if (perimetre!.score === 0) {
    return {
      titre: "Transformer les demandes en avenants ou en échanges",
      texte:
        "Ni oui à tout, ni non sec : un registre des demandes, un prix pour chacune, un arbitrage par la sponsor. C'est ce qui garde à la fois la marge et la suite.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir le périmètre derrière la marge",
      texte:
        "Quand le taux de réalisation baisse, regardez ce qui entre dans le forfait avant de regarder qui le produit : l'équipe tenait son plan, c'est le plan qui grossissait.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Le taux de réalisation se calcule : les honoraires rapportés à la valeur des jours passés. Notez vos estimations et comparez-les au réalisé.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const BRIEUC = { de: "Brieuc Guilcher", role: "Directeur des opérations, Morvanel" } as const;
const AOURELL = {
  de: "Aourell Abgrall",
  role: "Directrice générale de Morvanel, sponsor",
} as const;

export const EPISODE_PERIMETRE: Episode<Trimestre> = {
  code: "client-qui-en-demande-plus",
  numero: 65,
  domaine: "Tenir le périmètre d'une mission",
  titre: "Le client qui en demande toujours plus",
  resume:
    "Une mission au forfait chez un industriel, et un client qui ajoute chaque semaine une demande « rapide ». Tenir le périmètre sans perdre la suite.",
  persona:
    "Vous êtes Amélie Trégouët, directrice de mission dans la practice Performance opérationnelle et supply chain d'Atlas Conseil, au bureau de Rennes. Votre mission : l'excellence opérationnelle de l'usine de Loudéac de Morvanel, industriel des plats cuisinés et des conserves, vendue au forfait 420 k€. La phase 1 est livrée ; restent les phases 2 et 3, de septembre à fin novembre. Votre équipe : Rokia Keïta (manager), Théodule Rivalland (consultant senior), Mai-Linh Dao et Briac Fermont (consultants), Coline Santacroce (analyste).",
  mandat: [
    {
      fort: kE(HONORAIRES),
      texte: `au forfait pour les phases 2 et 3, soit ${JOURS_BUDGET} jours`,
    },
    { fort: taux(OBJECTIF_REALISATION, 0), texte: "de taux de réalisation, au moins" },
    { fort: kE(MARGE_BUDGET), texte: "de marge à terminaison prévue au budget" },
    { fort: kE(SUITE.honoraires), texte: "de mission suivante en jeu au comité final" },
  ],
  jugement:
    "Votre associé juge le trimestre en euros : la marge à terminaison de la mission, plus la valeur espérée de la mission suivante telle que la sponsor la laisse au comité final.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre mission",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours, Brieuc n'attend plus votre réponse : il met vos consultants sur ses demandes.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Rokia Keïta",
        role: "Manager de la mission, Atlas Conseil",
        alerte: true,
        texte: `Pendant ce temps, Brieuc a mis Briac et Mai-Linh sur la ligne 4 : ${nombre(perdu / COUT_JOUR, 1)} jours d'équipe non facturés, ${euros(perdu)} de coût de revient.`,
      };
    },
  },
  prevision: {
    libelle:
      "le taux de réalisation de la mission si les demandes en cours sont toutes absorbées gratuitement, en %",
    unite: "%",
    placeholder: "95",
    min: 50,
    max: 110,
    step: 0.1,
    reel: () => PREVISION_EN_POURCENTS,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "realisation",
      nom: "Taux de réalisation",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `projeté à terminaison ; objectif ${taux(OBJECTIF_REALISATION, 0)} au moins`,
    },
    {
      cle: "marge",
      nom: "Marge à terminaison",
      format: kE,
      sensBon: 1,
      aide: () => `projetée ; budget ${kE(MARGE_BUDGET)}`,
      jauge: (l) =>
        l.marge === null || l.marge === undefined
          ? null
          : {
              part: Math.min(1, Math.max(0, l.marge / MARGE_BUDGET)),
              enRetard: l.marge < MARGE_BUDGET,
            },
    },
    {
      cle: "retard",
      nom: "Retard du cœur de mission",
      format: retard,
      sensBon: -1,
      aide: () => `en jours d'équipe ; provision pour aléas ${PROVISION} j`,
    },
    {
      cle: "absorbes",
      nom: "Hors périmètre non facturé",
      format: (v) => `${nombre(v, 0)} j`,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `depuis septembre, soit ${kE((l.absorbes ?? 0) * COUT_JOUR)} de coût de revient`
          : "quatre demandes en attente",
    },
    {
      cle: "satisfaction",
      nom: "Satisfaction de la sponsor",
      format: (v) => `${nombre(v, 0)} / 100`,
      sensBon: 1,
      aide: () => `estimée ; ${SATISFACTION_DEPART} en septembre`,
    },
  ],
  contexte(l, decisions) {
    const r = l.retard ?? 0;
    const absorbes = l.absorbes ?? 0;
    return {
      realisation: taux(l.realisation ?? 1),
      marge: kE(l.marge ?? MARGE_BUDGET),
      retard: jours(r),
      absorbes: jours(absorbes),
      coutAbsorbe: kE(absorbes * COUT_JOUR),
      fuite: jours(l.fuite ?? 0),
      satisfaction: nombre(l.satisfaction ?? SATISFACTION_DEPART, 0),
      avenant1: l.avenant1 === 1,
      gratuit: decisions[D.demandes] === 0 || decisions[D.demandes] === 3,
      aLHeure: r - PROVISION <= CAPACITE,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const absorbe = semaines.reduce((x, w) => x + w.semaine, 0);
    return [
      [`Taux de réalisation, sem. ${a}`, taux(t.semaines[a]!.realisation)],
      ["Hors périmètre non facturé sur la période", `${nombre(absorbe, 0)} j`],
      [`Retard du cœur, sem. ${a}`, retard(t.semaines[a]!.retard)],
    ];
  },
  courbe: {
    titre: "Taux de réalisation projeté, semaine par semaine",
    cle: "realisation",
    cible: OBJECTIF_REALISATION,
    libelleCible: `objectif : ${taux(OBJECTIF_REALISATION, 0)} au moins`,
    graduations: [0.6, 0.7, 0.8, 0.9, 1, 1.1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `réalisation ${taux(s.realisation!)} · marge ${kE(s.marge!)}`,
      `${nombre(s.absorbes!, 0)} j hors périmètre · retard ${retard(s.retard!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    // Seul le choix compte : Brieuc signe ou non selon le hasard du trimestre.
    if (etape === D.demandes && choix === 1) {
      const signe = avenant1Signe([1, ...NEUTRE.slice(1)], graine);
      return [{ ...BRIEUC, texte: signe ? REPONSES.avenant1Signe : REPONSES.avenant1Refuse }];
    }
    if (etape === D.coupsDeMain && choix === 2) {
      const acceptee = regieAcceptee(
        [...NEUTRE.slice(0, D.coupsDeMain), 2, ...NEUTRE.slice(4)],
        graine,
      );
      return [{ ...BRIEUC, texte: acceptee ? REPONSES.regieAcceptee : REPONSES.regieRefusee }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.avenant2 !== null) {
      lies.push({
        ...BRIEUC,
        heure: "sem. 4",
        texte: arrive.avenant2 ? REPONSES.avenant2Signe : REPONSES.avenant2Refuse,
      });
    }
    if (arrive.regularisation !== null) {
      lies.push({
        ...BRIEUC,
        heure: "sem. 7",
        alerte: !arrive.regularisation,
        texte: arrive.regularisation
          ? REPONSES.regularisationPayee
          : REPONSES.regularisationRefusee,
      });
    }
    if (arrive.escalade) {
      lies.push({ ...AOURELL, heure: "sem. 8", alerte: true, texte: REPONSES.escalade });
    }
    if (arrive.erreur) {
      lies.push({
        de: "Gwendal Le Moal",
        role: "Responsable qualité, usine de Loudéac",
        heure: "sem. 10",
        alerte: true,
        texte: REPONSES.erreur,
      });
    }
    if (arrive.priorite) {
      lies.push({
        ...AOURELL,
        heure: "sem. 10",
        texte: arrive.priorite === "consolider" ? REPONSES.consolider : REPONSES.deployer,
      });
    }
    if (arrive.verdict !== null) {
      lies.push({
        ...AOURELL,
        heure: "sem. 13",
        alerte: !arrive.verdict,
        texte: arrive.verdict ? REPONSES.suiteAccordee : REPONSES.suiteEnConcurrence,
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
    titre: (t) =>
      `${kE(t.objectif)} : ${kE(t.marge)} de marge à terminaison, ${kE(t.valeurSuite)} de suite espérée`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge à terminaison de la mission plus valeur espérée de la mission suivante, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Taux de réalisation",
          valeur: taux(t.realisation, 0),
          aide: `à terminaison ; objectif ${taux(OBJECTIF_REALISATION, 0)}`,
          tenu: t.realisation >= OBJECTIF_REALISATION,
        },
        {
          nom: "Marge à terminaison",
          valeur: kE(t.marge),
          aide: `budget ${kE(MARGE_BUDGET)}${t.avenants > 0 ? ` ; ${kE(t.avenants)} d'avenants` : ""}`,
          tenu: t.marge >= MARGE_BUDGET,
        },
        {
          nom: "Cœur de mission",
          valeur:
            t.retardFinal <= PROVISION
              ? "à l'heure"
              : `${jours(t.retardFinal - PROVISION)} de retard`,
          aide: `au comité final, provision de ${PROVISION} jours consommée`,
          tenu: t.retardFinal <= PROVISION,
        },
        {
          nom: "La suite",
          valeur: t.suiteAccordee ? "accord de principe" : "mise en concurrence",
          aide: `${kE(SUITE.honoraires)} d'honoraires ; chance d'accord ${taux(t.chanceSuite, 0)}`,
          tenu: t.suiteAccordee,
        },
      ];
    },
    hasard(t, graine) {
      const reponses = [
        t.avenant1 ? "Brieuc a signé l'avenant de septembre" : null,
        t.avenant2 ? "il a signé celui de la ligne de surgelés" : null,
        t.regularisation ? "il a payé la moitié de la régularisation" : null,
        t.regie ? "il a pris le reporting en régie" : null,
      ].filter(Boolean);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(reponses.length
          ? [
              {
                titre: "Morvanel",
                texte: `${reponses.join(", ").replace(/^./, (c) => c.toUpperCase())}.`,
              },
            ]
          : []),
        {
          titre: "La sponsor",
          texte: `Sa priorité pour l'an prochain : ${
            t.consolider ? "consolider Loudéac" : "déployer la méthode aux autres usines"
          }. ${
            t.suiteAccordee
              ? `Accord de principe au comité final, avec ${taux(t.chanceSuite, 0)} de chances de l'obtenir : ${kE(t.valeurSuite)} espérés sur ${kE(MARGE_SUITE)} de marge.`
              : `Mise en concurrence au comité final, alors que l'accord avait ${taux(t.chanceSuite, 0)} de chances : ${kE(t.valeurSuite)} espérés.`
          }`,
        },
        {
          titre: "L'équipe",
          texte: [
            t.escalade ? "Brieuc s'est plaint d'Atlas à la sponsor en semaine 8" : null,
            t.erreur
              ? "à force de courir, l'équipe a livré un standard faux en semaine 10"
              : "l'équipe n'a pas livré d'erreur",
          ]
            .filter(Boolean)
            .join(" ; ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
