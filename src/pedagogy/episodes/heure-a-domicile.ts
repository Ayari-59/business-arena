/**
 * ÉPISODE 84 — L'HEURE D'AIDE À DOMICILE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Delphin montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  COUT_DE_REVIENT,
  D,
  HEURES_SEMAINE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_EXERCICE,
  PERTE_PAR_JOUR,
  RATIOS,
  RESULTAT_AN_DERNIER,
  TARIF,
  chuAccepte,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/heure-a-domicile";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  notificationCPOM,
} from "@/config/episodes/heure-a-domicile";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des euros au centime : le coût d'une heure se lit au centime près. */
const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const heures = (v: number) => `${nombre(v, 0)} h`;

const LEONOR = { de: "Leonor Mathiot", role: "Responsable de secteur, Beaune" } as const;
const VOAHANGY = { de: "Voahangy Rakotomalala", role: "Planificatrice, Dijon" } as const;
const THUY = { de: "Thuy Chevrolat", role: "Infirmière coordinatrice du SSIAD" } as const;
const DEPARTEMENT = {
  de: "Conseil départemental de la Côte-d'Or",
  role: "Direction de l'autonomie, service de la tarification",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable de pôle les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de refaire le calcul de l'heure",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    revient:
      "Votre diagnostic de la semaine 1 était juste : rapportées aux seules heures facturées, les charges font 27,33 € de l'heure, pas 26 €. Les trajets, la coordination, la formation, les absences et les annulations sont payés sans être facturés, et la perte est de 2,53 € par heure.",
    trajets:
      "En semaine 1, vous avez vu les trajets : le plus gros temps payé et non facturé, et le premier levier. Mais ils n'expliquaient pas seuls l'écart entre 26 € et la perte : c'est l'ensemble des temps non facturables, rapporté aux heures facturées, qui portait l'heure à 27,33 €.",
    courtes:
      "En semaine 1, vous avez retenu les passages de moins d'une heure : ils coûtent plus qu'ils ne rapportent, mais ne font que 14 % des heures, et leurs bénéficiaires, les plus dépendants, ont aussi des heures longues. Le déficit tenait au coût de l'heure facturée tout entière.",
    structure:
      "En semaine 1, vous avez retenu les frais de structure : un peu plus de 4 € par heure facturée, ce qui n'est pas excessif pour un service de cette taille. L'écart venait des heures payées et non facturées.",
  };
  const justes = ["revient", "trajets"];
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
    score: d === "revient" ? 1 : d === "trajets" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché l'équilibre en refusant des interventions, en faisant payer les familles ou en diluant les frais fixes dans des heures qui coûtent plus que le tarif : vous avez agi sur ce qui fait le coût de l'heure."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions l'option que dicte le coût apparent : refuser ou suspendre les petites interventions, multiplier les heures pour diluer les frais fixes, faire payer les annulations, couper la coordination, négocier sur les 26 € de la comptabilité.${
            t.plainte || t.signalement
              ? " Des familles ont saisi le département, et il s'en est souvenu au moment du CPOM."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.coutDeRevient,
    "de coût de revient complet d'une heure facturée",
    "€",
    { juste: 0.25, proche: 0.8 },
    (e) => centimes(e),
  );

  const gardees = t.heuresRegime >= 0.98 * HEURES_SEMAINE;
  const cpom = t.majoration.accordee > 0;
  const departement: Constat = {
    score: gardees && cpom ? 1 : gardees || cpom ? 0.6 : 0,
    texte: `${
      gardees
        ? `Vous avez gardé les bénéficiaires du service : ${heures(t.heuresRegime)} facturées par semaine fin juin, pour ${heures(HEURES_SEMAINE)} l'an dernier.`
        : `Le service a perdu des bénéficiaires : ${heures(t.heuresRegime)} facturées par semaine fin juin, pour ${heures(HEURES_SEMAINE)} l'an dernier, et des contrats d'intervenantes qui ne baissent pas aussi vite.`
    } ${
      cpom
        ? `Le département a majoré le tarif de ${centimes(t.majoration.accordee)} de l'heure au 1er juillet.`
        : "Le tarif n'a pas été majoré au 1er juillet."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, departement];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  departement,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Refaire le calcul de l'heure",
      texte:
        "Rejouez l'épisode en rapprochant d'abord la paie, le planning et les comptes : 119 950 heures payées pour 95 000 facturées. Le coût d'une heure facturée se calcule sur les heures qu'on facture, pas sur celles qu'on planifie.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Agir sur les tournées, pas sur les petites interventions",
      texte:
        "Refuser les passages courts fait baisser la part des trajets et perdre les bénéficiaires les plus dépendants, avec toutes leurs heures ; diluer les frais fixes dans des heures lointaines coûte plus que le tarif. Réduisez la route par la sectorisation, les annulations par l'alerte et la réaffectation, et négociez sur le vrai coût.",
    };
  }
  if (departement!.score === 0) {
    return {
      titre: "Garder la confiance du département",
      texte:
        "Le tarif se négocie avec l'autorité de tarification sur des chiffres justes et un plan d'action. Un service qui refuse des plans d'aide ou fait partir des bénéficiaires obtient rarement une majoration.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Diviser par les heures facturées",
      texte:
        "Quand le coût annoncé n'explique pas la perte, demandez par quoi on l'a divisé. Une heure facturée porte les trajets, la coordination, la formation, les absences et les annulations.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul : les charges du service, 2 596 k€, divisées par les 95 000 heures facturées. Ou, ligne par ligne : 17 € l'heure payée, multipliés par 1,26 heure payée par heure facturée, plus les kilomètres et la structure.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_HEURE_DOMICILE: Episode<Trimestre> = {
  code: "heure-a-domicile",
  numero: 84,
  domaine: "Coût de revient d'une heure d'intervention",
  titre: "L'heure d'aide à domicile",
  resume:
    "Un service d'aide à domicile perd 240 k€ par an alors que la comptabilité annonce un coût à peine supérieur au tarif. Calculer le vrai coût de l'heure facturée, et agir sur les tournées plutôt que sur les petites interventions.",
  persona:
    "Vous êtes Delphin Diakhaby, responsable du pôle domicile de l'Association Solvanne, à Dijon : le SSIAD et le service d'aide à domicile, 95 000 heures par an à Dijon et Beaune, quatre responsables de secteur, deux planificatrices et quelque 90 intervenantes. Vous rendez compte à la directrice générale, Ursule Mauvernay. Le trimestre va d'avril à juin.",
  mandat: [
    {
      fort: kE(OBJECTIF_EXERCICE),
      texte: "de perte au plus sur l'exercice, demande le conseil d'administration",
    },
    { fort: centimes(TARIF), texte: "de l'heure, le tarif APA et PCH du département" },
    { fort: kE(RESULTAT_AN_DERNIER), texte: "de résultat l'an dernier" },
    { fort: "31 mai", texte: "pour déposer le dossier de l'avenant au CPOM" },
  ],
  jugement:
    "Votre direction juge le trimestre sur le résultat de l'exercice du service, tel qu'on peut l'estimer fin juin : le premier trimestre, le vôtre, puis juillet à décembre au rythme où vous laissez le service, majoration du CPOM et été compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre service",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des demandes d'aide restées sans réponse partent chez un autre service.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...VOAHANGY,
        alerte: true,
        texte: `Pendant ce temps, des demandes d'APA sont restées sans réponse et sont parties chez un autre service : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le coût de revient complet d'une heure facturée l'an dernier, en euros",
    unite: "€",
    placeholder: "26",
    min: 10,
    max: 60,
    step: 0.01,
    reel: (t) => t.coutDeRevient,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "facturees",
      nom: "Heures facturées",
      format: heures,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `semaine ${semaine} ; ${heures(HEURES_SEMAINE)} par semaine l'an dernier`
          : "par semaine, l'an dernier",
    },
    {
      cle: "ratio",
      nom: "Heures payées par heure facturée",
      format: (v) => nombre(v, 2),
      sensBon: -1,
      aide: () => "trajets, coordination, formation, absences et annulations compris",
    },
    {
      cle: "trajets",
      nom: "Part des trajets",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => `en part des heures facturées ; ${taux(RATIOS.trajets, 0)} l'an dernier`,
    },
    {
      cle: "cout",
      nom: "Coût de revient de l'heure facturée",
      format: centimes,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `toutes les charges de la semaine ; tarif du département ${centimes(TARIF)}`
          : "à vous de le calculer",
      jauge: (l) =>
        l.cout == null ? null : { part: Math.min(1, TARIF / l.cout), enRetard: l.cout > TARIF },
    },
    {
      cle: "cumul",
      nom: "Résultat du trimestre",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "d'avril à la fin de la semaine, à date" : "premier trimestre : −61 k€",
    },
  ],
  contexte(l, decisions) {
    return {
      facturees: nombre(l.facturees ?? 0, 0),
      ratio: nombre(l.ratio ?? 0, 2),
      trajets: taux(l.trajets ?? 0),
      annulations: taux(l.annulations ?? 0),
      cout: centimes(l.cout ?? 0),
      cumul: kE(l.cumul ?? 0),
      sectorise: decisions[D.levier] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Heures facturées de la période", heures(semaines.reduce((x, w) => x + w.facturees, 0))],
      [`Coût de l'heure facturée, sem. ${a}`, centimes(t.semaines[a]!.cout)],
      ["Résultat de la période", kE(semaines.reduce((x, w) => x + w.resultat, 0))],
    ];
  },
  courbe: {
    titre: "Coût de revient de l'heure facturée, semaine par semaine",
    cle: "cout",
    cible: TARIF,
    libelleCible: `le tarif du département : ${centimes(TARIF)}`,
    graduations: [24, 27, 30, 33, 36],
    format: (v) => `${nombre(v, 0)} €`,
    details: (s) => [
      `${centimes(s.cout!)} l'heure · ${heures(s.facturees!)} facturées`,
      `${nombre(s.ratio!, 2)} h payée par heure facturée · trajets ${taux(s.trajets!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.annulations && choix === 1) {
      // La cellule de coordination des sorties du CHU répond selon le hasard du trimestre.
      return [{ ...THUY, texte: chuAccepte(graine) ? REPONSES.chuOui : REPONSES.chuNon }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.refus) lies.push({ ...LEONOR, heure: "sem. 4", texte: REPONSES.refus });
    if (arrive.plainte) {
      lies.push({ ...DEPARTEMENT, heure: "sem. 6", alerte: true, texte: REPONSES.plainte });
    }
    if (arrive.plannings) lies.push({ ...VOAHANGY, heure: "sem. 5", texte: REPONSES.plannings });
    if (arrive.facturation) lies.push({ ...LEONOR, heure: "sem. 5", texte: REPONSES.facturation });
    if (arrive.relance) lies.push({ ...VOAHANGY, heure: "sem. 6", texte: REPONSES.relance });
    if (arrive.tournees) lies.push({ ...VOAHANGY, heure: "sem. 9", texte: REPONSES.tournees });
    if (arrive.reprise) {
      lies.push({
        ...LEONOR,
        heure: "sem. 9",
        texte: chemin[D.reprise] === 0 ? REPONSES.repriseTout : REPONSES.repriseSecteurs,
      });
    }
    if (arrive.evenement) {
      lies.push({ ...LEONOR, heure: "sem. 10", alerte: true, texte: REPONSES.evenement });
    }
    if (arrive.departs) {
      lies.push({ ...LEONOR, heure: "sem. 11", alerte: true, texte: REPONSES.departs(t.departs) });
    }
    if (arrive.suspension) lies.push({ ...LEONOR, heure: "sem. 12", texte: REPONSES.suspension });
    if (arrive.cpom) {
      lies.push({
        ...DEPARTEMENT,
        heure: "sem. 12",
        alerte: t.majoration.accordee === 0,
        texte: notificationCPOM(chemin[D.cpom]!, t.majoration.accordee),
      });
    }
    if (arrive.signalement) {
      lies.push({ ...DEPARTEMENT, heure: "sem. 13", alerte: true, texte: REPONSES.signalement });
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
      `Exercice projeté : ${kE(t.objectif)}, pour ${kE(RESULTAT_AN_DERNIER)} l'an dernier`,
    formatObjectif: kE,
    noteDesBarres:
      "Résultat de l'exercice du service tel qu'on l'estime fin juin (premier trimestre, avril à juin, puis juillet à décembre au rythme de fin juin, majoration du CPOM et été compris), sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Résultat de l'exercice",
          valeur: kE(t.objectif),
          aide: `projeté fin juin ; le conseil d'administration demande ${kE(OBJECTIF_EXERCICE)} au plus`,
          tenu: t.objectif >= OBJECTIF_EXERCICE,
        },
        {
          nom: "Coût de l'heure facturée",
          valeur: centimes(t.coutRegime),
          aide: `au rythme de fin juin ; ${centimes(COUT_DE_REVIENT)} l'an dernier`,
          tenu: t.coutRegime <= COUT_DE_REVIENT - 0.75,
        },
        {
          nom: "Majoration du CPOM",
          valeur: t.majoration.accordee > 0 ? `+${centimes(t.majoration.accordee)}` : "aucune",
          aide: "de l'heure APA et PCH, au 1er juillet",
          tenu: t.majoration.accordee > 0,
        },
        {
          nom: "Bénéficiaires",
          valeur: heures(t.heuresRegime),
          aide: `facturées par semaine fin juin ; ${heures(HEURES_SEMAINE)} l'an dernier`,
          tenu: t.heuresRegime >= 0.98 * HEURES_SEMAINE && !t.plainte && !t.signalement,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le CHU",
          texte: chuAccepte(graine)
            ? "aurait accepté de signaler les hospitalisations de vos bénéficiaires."
            : "n'aurait pas pu s'engager à signaler les hospitalisations.",
        },
        {
          titre: "Le département",
          texte: `${
            t.majoration.accordee > 0
              ? `a majoré le tarif de ${centimes(t.majoration.accordee)} de l'heure`
              : "n'a pas majoré le tarif"
          }${
            t.majoration.chance > 0
              ? `, avec ${Math.round(t.majoration.chance * 100)} chances sur cent d'obtenir la demande entière au vu du trimestre`
              : ", faute de dossier"
          }${
            t.plainte ? ". Une famille l'avait saisi après un refus de passage" : ""
          }${t.signalement ? ". Une famille a fait un signalement sur la suspension d'été" : ""}.`,
        },
        {
          titre: "L'équipe",
          texte: [
            t.evenement ? "une alerte s'est perdue, et un bénéficiaire a été hospitalisé" : null,
            t.departs > 0
              ? `${t.departs === 1 ? "une intervenante a démissionné" : `${t.departs} intervenantes ont démissionné`}`
              : "aucune intervenante n'est partie",
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
