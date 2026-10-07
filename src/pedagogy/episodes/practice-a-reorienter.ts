/**
 * ÉPISODE 75 — LA PRACTICE DONT LE MARCHÉ S'ÉTEINT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que Tempora montre à Abel chaque semaine, ce que la
 * courbe trace, ce sur quoi le comité de direction le juge, et ce que ses
 * décisions révèlent de lui.
 *
 * Une reconversion se joue sur des trimestres, l'épisode sur un seul : le
 * tableau de bord suit donc, à côté de l'occupation et du carnet,
 * l'INTERCONTRAT ATTENDU DE DÉCEMBRE À FÉVRIER, recalculé chaque semaine avec
 * ce qui est signé et qui sera vendable. C'est lui qui dit, dès l'automne, ce
 * que coûte d'attendre.
 */
import {
  COUT_JOUR,
  D,
  INTERCONTRAT_SI_RIEN,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_VALEUR,
  OCCUPATION_CIBLE,
  PERTE_PAR_JOUR,
  ARRIVEE_EXPERTS,
  SCENARIOS,
  arriveeDesIndependants,
  arriveesDesExperts,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/practice-a-reorienter";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/practice-a-reorienter";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 0)} j`;
/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const OLYMPE = {
  de: "Olympe Lavallière",
  role: "Associée, membre du comité de direction",
} as const;
const MYLENE = { de: "Mylène Berthomieu", role: "Manageuse, pôle audits" } as const;
const AYOUB = { de: "Ayoub Ferrec", role: "Consultant" } as const;
const EVELYNE = { de: "Évelyne Galliot", role: "Experte décarbonation industrielle" } as const;
const FREELANCIA = { de: "Freelancia", role: "Plateforme de consultants indépendants" } as const;
const ADELAIDE = {
  de: "Adélaïde Fourcroy",
  role: "Directrice industrielle, Conserveries de l'Aulne",
} as const;
const RH = { de: "Ressources humaines", role: "Siège, Nantes" } as const;

/** Ce que les aides régionales annoncées en novembre disent du marché de la décarbonation. */
const MARCHE: Record<string, string> = {
  porteur:
    "la Région double ses aides à la décarbonation industrielle, le marché sera porteur cet hiver",
  moyen: "les aides régionales sont reconduites à l'identique, le marché suit son rythme",
  lent: "les aides régionales sont réduites, les industriels repoussent leurs études",
};

/** Ce que les décisions révèlent, dans l'ordre où un directeur de practice les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le plan de charge des audits et ce que les clients industriels attendent",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    reconversion:
      "Votre diagnostic de la semaine 1 était juste : le carnet d'audits s'éteignait à une date connue, et personne n'était encore vendable en décarbonation. Il fallait reconvertir par étapes, avant que l'intercontrat n'arrive.",
    ventes:
      "En semaine 1, vous avez vu qu'il manquait des missions : c'est vrai, mais un client n'achète pas une décarbonation à une équipe qui n'en a jamais fait. Vendre sans rendre vendable ne remplit pas le carnet.",
    formation:
      "En semaine 1, vous avez cru à un manque de formation : un consultant certifié en salle n'est pas vendable pour autant, les clients veulent quelqu'un qui l'a déjà fait.",
    creux:
      "En semaine 1, vous avez vu un creux passager ; le plan de charge disait le contraire : aucun client ne renouvelle après l'échéance, et février est vide.",
  };
  const justes = ["reconversion", "ventes"];
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
    score: d === "reconversion" ? 1 : d === "ventes" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun des deux réflexes d'une practice dont le marché s'éteint : ni vendre les derniers audits en remettant la suite à l'an prochain, ni tout basculer d'un coup par décision de direction."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} un réflexe : vendre les derniers audits « et on verra l'an prochain », ou tout réorganiser d'un coup.${
            t.coutDeparts > 0 && t.departs.some((x) => x.nature === "subi")
              ? ` Le trimestre s'est soldé par ${t.departs.filter((x) => x.nature === "subi").length} départ${t.departs.filter((x) => x.nature === "subi").length > 1 ? "s" : ""} subi${t.departs.filter((x) => x.nature === "subi").length > 1 ? "s" : ""}.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    INTERCONTRAT_SI_RIEN,
    "d'intercontrat de décembre à février si rien ne changeait",
    "jours",
    { juste: 20, proche: 60 },
    (e) => `${nombre(e, 0)} jours`,
  );

  const d3 = p.chemin[D.binomes];
  const d4 = p.chemin[D.reticents];
  const surMission = d3 === 1 || d3 === 2;
  const chacun = d4 === 1;
  const formes =
    d3 === 0
      ? "Vous avez certifié toute l'équipe en salle : personne n'en est sorti vendable."
      : d3 === 3
        ? "Vous n'avez mis personne en binôme : en décembre, personne de l'équipe ne sera vendable en décarbonation."
        : `Vous avez formé ${d3 === 1 ? "quatre volontaires" : "huit consultants d'un coup"} en binôme sur de vraies missions${
            t.vendablesEn !== null && t.vendablesEn > 13
              ? `, vendables seuls vers la semaine ${t.vendablesEn}`
              : ""
          }.`;
  const personnes =
    d4 === 1
      ? " Et vous avez traité chacun des quatre réticents selon sa situation : un départ accompagné, une mobilité, une fin de carrière sur les audits et l'AMO, un binôme encadré."
      : d4 === 0
        ? " Mais vous avez imposé la même règle aux quatre réticents : ceux qui partent alors choisissent leur moment, et leurs clients."
        : d4 === 2
          ? " Mais vous avez laissé les quatre réticents sur les audits sans rien décider : en janvier, ils n'auront plus rien à faire."
          : " Mais un plan de départs pour les quatre a coûté plus cher que de traiter chacun, et inquiété ceux qu'on voulait garder.";
  const etapes: Constat = {
    score: surMission && chacun ? 1 : surMission || chacun ? 0.6 : 0,
    texte: formes + personnes,
  };

  return [information, diagnostic, reflexe, calibrage, etapes];
}

export function axe([information, diagnostic, reflexe, calibrage, etapes]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le plan de charge avant de décider",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le plan de charge des audits et en appelant les clients industriels : le calendrier disait quand l'équipe n'aurait plus rien à faire, et les clients ce qu'ils achèteraient.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni attendre, ni tout basculer",
      texte:
        "Une équipe se reconvertit par étapes : on garde le métier actuel tant qu'il paie, on forme sur de premières missions réelles à côté de gens qui savent, et on avance au rythme du carnet signé. Attendre coûte l'intercontrat ; tout basculer coûte des missions ratées et des départs.",
    };
  }
  if (etapes!.score === 0) {
    return {
      titre: "Former sur des missions, et chacun selon sa situation",
      texte:
        "Un consultant devient vendable sur une vraie mission, en binôme, pas en salle. Et quatre personnes qui ne veulent pas changer ont quatre raisons différentes : un départ accompagné coûte moins qu'un départ subi ou qu'un trimestre d'intercontrat.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Rendre l'équipe vendable avant de vendre",
      texte:
        "Le carnet d'audits s'éteint à une date connue. Le problème n'est pas seulement de trouver des missions de décarbonation, c'est d'avoir des gens qu'un client industriel acceptera de payer : des experts, des références, des binômes.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le compte de l'intercontrat",
      texte:
        "Les jours staffables de l'équipe, moins les audits restants, moins l'AMO : c'est ce qui restera sans mission. Posez le calcul mois par mois, avec le calendrier du plan de charge.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const marcheDe = (graine: number) => hasard(graine).scenario.id;

export const EPISODE_RECONVERSION: Episode<Trimestre> = {
  code: "practice-a-reorienter",
  numero: 75,
  domaine: "Reconvertir une équipe",
  titre: "La practice dont le marché s'éteint",
  resume:
    "Les audits réglementaires qui faisaient 60 % de l'activité s'arrêtent au 31 décembre, et personne dans l'équipe n'a jamais fait de décarbonation. Reconvertir dix-huit consultants sans attendre ni tout casser.",
  persona:
    "Vous êtes Abel Quintin, directeur de la practice Énergie et bâtiment d'Atlas Conseil, cabinet de conseil et bureau d'études nantais : dix-huit consultants, des audits énergétiques réglementaires et de l'assistance à maîtrise d'ouvrage. L'obligation d'audit prend fin au 31 décembre pour presque tous vos clients ; la décarbonation des sites industriels monte, mais votre équipe n'y est pas formée. Le trimestre va de septembre à novembre.",
  mandat: [
    { fort: "18 consultants", texte: "dont aucun n'a encore mené de mission de décarbonation" },
    { fort: "60 %", texte: "de l'activité de l'an dernier venait des audits réglementaires" },
    { fort: taux(OCCUPATION_CIBLE, 0), texte: "le taux d'occupation cible des consultants" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur au moins, trimestre suivant compris" },
  ],
  jugement:
    "Le comité de direction juge le trimestre en euros : le résultat de la practice de septembre à novembre, moins les départs, plus ce que vaut le trimestre suivant tel qu'on peut l'estimer fin novembre (la marge du carnet de décarbonation constitué, moins l'intercontrat attendu de décembre à février).",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre practice",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les industriels qui demandaient une proposition de décarbonation vont la chercher ailleurs.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...OLYMPE,
        alerte: true,
        texte: `Pendant que tu enquêtais, Halden Partners a remis une proposition à deux industriels qui attendaient la nôtre : ${euros(perdu)} de marge envolée.`,
      };
    },
  },
  prevision: {
    libelle: "l'intercontrat de décembre à février si rien ne change, en jours",
    unite: "jours",
    placeholder: "300",
    min: 0,
    max: 1200,
    step: 1,
    reel: () => INTERCONTRAT_SI_RIEN,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => {
    const t = simuler(
      NEUTRE.map((n, i) => decisions[i] ?? n),
      graine,
      j,
    );
    return {
      ...tableauDeBord(decisions, graine, j, semaine),
      vendablesEn: semaine > 0 && t.vendablesEn !== null ? t.vendablesEn : null,
      marche: SCENARIOS.findIndex((s) => s.id === marcheDe(graine)),
    };
  },
  indicateurs: [
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pts`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `jours facturés de la semaine ${semaine} ; cible ${taux(OCCUPATION_CIBLE, 0)}`
          : `l'an dernier ; cible ${taux(OCCUPATION_CIBLE, 0)}`,
      jauge: (l) =>
        l.occupation == null
          ? null
          : {
              part: Math.min(1, l.occupation / OCCUPATION_CIBLE),
              enRetard: l.occupation < OCCUPATION_CIBLE - 0.05,
            },
    },
    {
      cle: "intercontrat",
      nom: "Intercontrat du trimestre",
      format: jours,
      sensBon: -1,
      aide: () =>
        `jours staffables sans mission depuis le 1er septembre, ${euros(COUT_JOUR)} chacun`,
    },
    {
      cle: "carnet",
      nom: "Carnet de décarbonation",
      format: jours,
      sensBon: 1,
      aide: () => "jours signés restant à produire",
    },
    {
      cle: "enDecarbonation",
      nom: "En décarbonation",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (_, l) =>
        `${nombre(l.experts ?? 0, 0)} expert(e)s ou indépendants, ${nombre(l.binomes ?? 0, 0)} consultants en binôme`,
    },
    {
      cle: "interSuivant",
      nom: "Intercontrat attendu, décembre à février",
      format: (v) => jours(v),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "avec ce qui est signé et qui sera vendable"
          : "à estimer : c'est votre prévision",
    },
  ],
  contexte(l, decisions): Contexte {
    const marche = SCENARIOS[l.marche ?? 1] ?? SCENARIOS[1];
    return {
      occupation: taux(l.occupation ?? OCCUPATION_CIBLE, 0),
      intercontrat: nombre(l.intercontrat ?? 0, 0),
      carnet: nombre(l.carnet ?? 0, 0),
      retard: nombre(l.retard ?? 0, 0),
      binomes: l.binomes ?? 0,
      experts: l.experts ?? 0,
      signes: nombre(l.signes ?? 0, 0),
      interSuivant: nombre(l.interSuivant ?? INTERCONTRAT_SI_RIEN, 0),
      vendablesEn: l.vendablesEn ?? 0,
      marche: MARCHE[marche.id]!,
      cap: decisions[D.cap] ?? NEUTRE[D.cap],
      expertsChoix: decisions[D.experts] ?? NEUTRE[D.experts],
      binomesChoix: decisions[D.binomes] ?? NEUTRE[D.binomes],
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1).map((s) => s!);
    const occupation = semaines.reduce((s, x) => s + x.occupation, 0) / semaines.length;
    const inter = semaines.reduce((s, x) => s + x.intercontratSemaine, 0);
    const fin = t.semaines[a]!;
    return [
      [`Taux d'occupation, sem. ${de} à ${a}`, taux(occupation, 0)],
      ["Intercontrat sur la période", jours(inter)],
      [`Carnet de décarbonation, sem. ${a}`, jours(fin.carnet)],
    ];
  },
  courbe: {
    titre: "Taux d'occupation de la practice, semaine par semaine",
    cle: "occupation",
    cible: OCCUPATION_CIBLE,
    libelleCible: `cible : ${taux(OCCUPATION_CIBLE, 0)}`,
    graduations: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.occupation!, 0)} d'occupation · ${jours(s.intercontratSemaine!)} d'intercontrat`,
      `carnet de décarbonation ${jours(s.carnet!)} · ${nombre(s.binomes!, 0)} en binôme · ${jours(s.retard!)} d'audits en retard`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.experts && (choix === 0 || choix === 1)) {
      // Les candidates signent ; leur arrivée dépend des préavis, tirés avec le trimestre.
      const tard = arriveesDesExperts([NEUTRE[D.cap], choix], graine).filter(
        (a) => a > ARRIVEE_EXPERTS,
      ).length;
      const texte =
        choix === 0
          ? tard === 0
            ? REPONSES.deuxALHeure
            : tard === 1
              ? REPONSES.uneEnRetard
              : REPONSES.deuxEnRetard
          : tard === 0
            ? REPONSES.uneALHeure
            : REPONSES.uneTard;
      return [{ ...RH, texte }];
    }
    if (etape === D.experts && choix === 2) {
      return [
        {
          ...FREELANCIA,
          texte:
            arriveeDesIndependants(graine) === 5
              ? REPONSES.independantsTot
              : REPONSES.independantsTard,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    for (const w of new Set(arrive.arrivees)) {
      lies.push({
        ...EVELYNE,
        heure: `sem. ${w}`,
        texte:
          t.arrivees.length === 2 && t.arrivees[0] === t.arrivees[1]
            ? "Gaïane et moi sommes arrivées ce matin. Montrez-nous les clients d'audit qui ont un projet : on commence par eux."
            : w === t.arrivees[0]
              ? "Arrivée ce matin. Montrez-moi les clients d'audit qui ont un projet : on commence par eux."
              : "Gaïane Moysan nous rejoint enfin. Nous pouvons encadrer deux binômes chacune.",
      });
    }
    if (arrive.independants !== null) {
      lies.push({
        ...FREELANCIA,
        heure: `sem. ${arrive.independants}`,
        texte: "Nos deux indépendants sont en mission chez vous à partir d'aujourd'hui.",
      });
    }
    if (arrive.debutBinomes !== null) {
      lies.push({
        ...AYOUB,
        heure: `sem. ${arrive.debutBinomes}`,
        texte:
          t.semaines[13]!.experts > 0 || t.independants !== null
            ? `Premier jour en binôme : nous sommes ${t.semaines[arrive.debutBinomes]!.binomes} consultants sur les missions de décarbonation, facturés à moitié pendant qu'on apprend.`
            : "Premier jour sur une mission de décarbonation, à deux auditeurs qui découvrent le sujet. On fait de notre mieux.",
      });
    }
    if (arrive.missionRatee !== null) {
      lies.push({
        ...MYLENE,
        heure: `sem. ${arrive.missionRatee}`,
        alerte: true,
        texte:
          "Le premier comité de pilotage de décarbonation s'est mal passé : le client conteste la méthode et les chiffres. Avoir de 15 000 €, et il ne nous confiera pas la deuxième phase.",
      });
    } else if (arrive.missionReussie && t.produitsTotal >= 40) {
      lies.push({
        ...OLYMPE,
        heure: "sem. 11",
        texte:
          "Le client de notre première feuille de route de décarbonation accepte d'être cité en référence. C'est la première de la practice.",
      });
    }
    if (chemin[D.commande] === 0 && t.semaines[10]!.binomes > 0 && de <= 10 && a >= 10) {
      lies.push({
        ...AYOUB,
        heure: "sem. 10",
        texte:
          "Retour sur les audits pour quatre semaines. Les missions de décarbonation avancent sans nous ; on reprendra en décembre.",
      });
    }
    if (arrive.clientSigne !== null) {
      lies.push({
        ...ADELAIDE,
        heure: "sem. 11",
        alerte: !arrive.clientSigne,
        texte: arrive.clientSigne ? REPONSES.clientOui : REPONSES.clientNon,
      });
    }
    for (const x of arrive.departs) {
      lies.push({
        ...MYLENE,
        heure: `sem. ${Math.min(x.semaine, 13)}`,
        alerte: true,
        texte:
          x.semaine >= 13
            ? `${x.qui} annonce son départ : il ne veut pas d'une bascule en janvier. Ses clients d'AMO sont inquiets.`
            : `${x.qui} a démissionné${x.qui === "Gwenola Toullec" ? " pour Kéroual Consulting, avec un de ses clients" : ""}. Ses dossiers sont à reprendre.`,
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
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur, trimestre suivant compris`
        : `${kE(-t.objectif)} de valeur perdue, trimestre suivant compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur du trimestre, en euros : le résultat de la practice de septembre à novembre, moins les départs, plus la marge du carnet de décarbonation constitué, moins l'intercontrat attendu de décembre à février, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const subis = t.departs.filter((x) => x.nature === "subi").length;
      return [
        {
          nom: "Valeur du trimestre",
          valeur: kE(t.objectif),
          aide: `résultat ${kES(t.resultat)}, trimestre suivant ${kES(t.projection.valeur)} ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Intercontrat attendu",
          valeur: jours(t.projection.intercontrat),
          aide: `de décembre à février ; ${jours(INTERCONTRAT_SI_RIEN)} si rien ne changeait`,
          tenu: t.projection.intercontrat <= INTERCONTRAT_SI_RIEN / 2,
        },
        {
          nom: "Carnet de décarbonation",
          valeur: jours(t.projection.carnetPondere),
          aide: `signé ou promis par le rythme de novembre ; ${nombre(t.projection.vendables, 1)} vendables en équivalent temps plein`,
          tenu: t.projection.carnetPondere >= 150,
        },
        {
          nom: "Départs subis",
          valeur: nombre(subis, 0),
          aide:
            t.departs.length > subis
              ? `${t.departs.length - subis} départ${t.departs.length - subis > 1 ? "s" : ""} ou mobilité${t.departs.length - subis > 1 ? "s" : ""} préparé${t.departs.length - subis > 1 ? "s" : ""} en plus`
              : "aucun départ préparé",
          tenu: subis === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const tard = t.arrivees.filter((a) => a > 7).length;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché de la décarbonation",
          texte: `${h.scenario.nom.charAt(0).toUpperCase()}${h.scenario.nom.slice(1)} : ${MARCHE[h.scenario.id]}.`,
        },
        {
          titre: "Les expertes",
          texte:
            t.arrivees.length === 0
              ? h.uExperts[0]! < 0.25 === h.uExperts[1]! < 0.25
                ? `Aucune n'a été recrutée ; toutes deux seraient arrivées en semaine ${h.uExperts[0]! < 0.25 ? 10 : ARRIVEE_EXPERTS}.`
                : `Aucune n'a été recrutée ; l'une serait arrivée en semaine ${ARRIVEE_EXPERTS}, l'autre en semaine 10.`
              : t.arrivees.length === 1
                ? `Une seule a été recrutée ; elle est arrivée en semaine ${t.arrivees[0]}${tard ? ", trois semaines plus tard que prévu" : ", comme prévu"}.`
                : tard === 0
                  ? `Les deux sont arrivées comme prévu, en semaine ${ARRIVEE_EXPERTS}.`
                  : tard === 1
                    ? `L'une est arrivée en semaine ${ARRIVEE_EXPERTS}, l'autre trois semaines plus tard.`
                    : "Les deux sont arrivées en semaine 10, trois semaines plus tard que prévu.",
        },
        {
          titre: "L'équipe",
          texte: `${
            t.missionRatee !== null
              ? "La première mission de décarbonation a raté son premier comité de pilotage. "
              : t.produitsTotal > 0
                ? "La première mission de décarbonation a passé son premier comité de pilotage. "
                : ""
          }${
            t.departs.filter((x) => x.nature === "subi").length
              ? `Départs subis : ${t.departs
                  .filter((x) => x.nature === "subi")
                  .map((x) => x.qui)
                  .join(", ")}.`
              : "Aucun départ subi."
          }`,
        },
      ];
    },
  },
  comportements,
  axe,
};
