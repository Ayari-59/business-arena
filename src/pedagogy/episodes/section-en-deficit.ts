/**
 * ÉPISODE 83 — LA SECTION QUI PLONGE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Eudoxie montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  CAPACITE,
  D,
  DEFICIT_ERRD,
  JOURS_SANS_PERTE,
  NEUTRE,
  OCCUPATION_CIBLE,
  PERTE_PAR_JOUR,
  RESULTAT_ERRD,
  conserve,
  evenements,
  habilitationAccordee,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/section-en-deficit";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/section-en-deficit";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const MONGRENIER = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration",
} as const;
const BICHOT = { de: "Ermeline Bichot", role: "Aide-soignante de nuit, élue au CSE" } as const;
const TARIFICATION = {
  de: "Service de la tarification",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const ARS = { de: "Délégation départementale de l'ARS", role: "Côte-d'Or" } as const;

/** Le résultat de départ : l'ERRD reconduit, l'excédent de soins repris. */
const DEPART = conserve(RESULTAT_ERRD);
/** Ce que le conseil attend : ramener le déficit de l'an prochain sous 150 k€. */
const SEUIL = -150000;

/** Ce que les décisions révèlent, dans l'ordre où une DAF du secteur les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui décomposaient le déficit par section",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    hebergement:
      "Votre diagnostic de la semaine 1 était juste : le déficit était à l'hébergement, entre des chambres vides et un prix de journée sous le coût de revient. Les aides-soignants relèvent du soins et de la dépendance, qui ne le financent pas.",
    repartition:
      "En semaine 1, vous avez vu l'erreur de répartition : elle était réelle, mais pas le cœur du déficit. Une fois les aides-soignants de nuit remis au soins et à la dépendance, l'hébergement restait à plus de 200 k€ de déficit, faute d'occupation et de prix.",
    soignants:
      "En semaine 1, vous avez retenu le diagnostic du conseil : trop d'aides-soignants. Or leurs postes sont financés par le soins et la dépendance, et le soins était en excédent : le déficit était à l'hébergement.",
    siege:
      "En semaine 1, vous avez retenu les frais de siège ; ils pèsent sur l'hébergement, mais aucune décision du trimestre ne les changeait, et ils n'expliquent pas l'écart entre le prix de journée et le coût de revient.",
  };
  const justes = ["hebergement", "repartition"];
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
    score: d === "hebergement" ? 1 : d === "repartition" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché à combler le déficit là où l'argent ne revient pas : aucun poste d'aide-soignant supprimé, aucune charge déplacée vers le soins, aucune demande à la mauvaise autorité."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions une réponse au déficit global : supprimer des postes ou ne plus remplacer, faire absorber des charges par le soins, demander à l'ARS de couvrir l'hébergement.${
            t.faits.suppression !== null
              ? " Les postes ont été supprimés : la part soins de l'économie a été reprise sur le forfait, l'hébergement n'a pas bougé."
              : ""
          }${t.faits.inspection ? " Un signalement a conduit l'ARS à inspecter l'établissement." : ""}`,
  };

  const calibrage = constatCalibrage(
    p,
    t.hebergementErrd / 1000,
    "pour le résultat de la section hébergement à l'ERRD",
    "k€",
    { juste: 5, proche: 20 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const autorite = [
    t.cleCorrigee,
    p.chemin[D.prix] === 0 || p.chemin[D.prix] === 1,
    p.chemin[D.coupe] === 0,
  ].filter(Boolean).length;
  const sections: Constat = {
    score: autorite === 3 ? 1 : autorite === 2 ? 0.6 : 0,
    texte: `${
      t.cleCorrigee
        ? "Vous avez remis les aides-soignants de nuit au soins et à la dépendance : le faux excédent de soins n'a pas été repris."
        : "La ligne de nuit est restée à l'hébergement : un excédent de soins qui n'en était pas un est parti à l'ARS."
    } ${
      p.chemin[D.prix] === 0 || p.chemin[D.prix] === 1
        ? "Vous avez porté l'hébergement devant son autorité de tarification, le département."
        : "L'hébergement n'a pas été présenté à son autorité de tarification, le département."
    } ${
      t.faits.coupe.validee
        ? `La coupe validée a relevé les forfaits (GMP ${t.faits.coupe.gmp}, PMP ${t.faits.coupe.pmp}).`
        : "Les forfaits soins et dépendance sont restés calculés sur une coupe de trois ans."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, sections];
}

export function axe([information, diagnostic, reflexe, calibrage, sections]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le résultat section par section",
      texte:
        "Rejouez l'épisode en décomposant d'abord l'ERRD : produits et charges de l'hébergement, puis le soins et la dépendance. Le total ne dit pas où est le déficit, ni qui peut le financer.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas couper là où l'argent ne revient pas",
      texte:
        "Avant de supprimer une charge, demandez-vous à quelle section elle s'impute et qui la finance. Un poste d'aide-soignant s'impute au soins et à la dépendance : l'économie de soins est reprise par l'ARS, et le déficit d'hébergement reste entier.",
    };
  }
  if (sections!.score === 0) {
    return {
      titre: "Négocier avec la bonne autorité",
      texte:
        "Chaque section a son financeur : le département pour l'hébergement et la dépendance, l'ARS pour le soins. Une répartition juste, une coupe à jour et un dossier par section sont ce qui fait bouger les tarifs.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Localiser la section, puis la cause",
      texte:
        "Quand un établissement est en déficit, cherchez d'abord la section qui le porte, puis ce qui l'explique : l'occupation, le prix de journée, la répartition des charges, la coupe.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la section hébergement ligne par ligne : journées facturées fois prix de journée, moins chaque charge imputée à la section.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_SECTIONS: Episode<Trimestre> = {
  code: "section-en-deficit",
  numero: 83,
  domaine: "Lire un budget par sections tarifaires",
  titre: "La section qui plonge",
  resume:
    "Un EHPAD affiche 310 k€ de déficit et le conseil veut supprimer deux postes d'aides-soignants. Trouver la section qui plonge, sa cause, et l'autorité de tarification qui peut la financer.",
  persona:
    "Vous êtes Eudoxie Rambourg, directrice administrative et financière de l'Association Solvanne, à Dijon. Vous préparez avec Mihaela Vasilescu, contrôleuse de gestion, les propositions budgétaires de l'EHPAD d'Auxonne, que dirige Bakary Gagnepain, et vous rendez compte à la directrice générale, Ursule Mauvernay, et au conseil d'administration.",
  mandat: [
    { fort: kE(DEFICIT_ERRD), texte: "de déficit à l'ERRD de l'EHPAD d'Auxonne" },
    { fort: `${CAPACITE} places`, texte: "habilitées à l'aide sociale, trois sections tarifaires" },
    { fort: "deux postes", texte: "d'aides-soignants que le conseil veut supprimer" },
    { fort: kE(SEUIL), texte: "le déficit de l'an prochain que le conseil veut ne pas dépasser" },
  ],
  jugement:
    "Le conseil juge le trimestre sur le résultat prévisionnel de l'an prochain que l'association gardera, section par section (un excédent de soins est repris par l'ARS), moins le coût des mesures engagées.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "L'EHPAD d'Auxonne",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la rumeur des suppressions de postes fait partir des soignantes en CDD.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...BICHOT,
        alerte: true,
        texte: `Pendant ce temps, une collègue en CDD a signé ailleurs ; son remplacement passe en intérim chez Soralis Intérim Santé : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le résultat de la section hébergement à l'ERRD, en milliers d'euros",
    unite: "k€",
    placeholder: "0",
    min: -600,
    max: 200,
    step: 1,
    reel: (t) => t.hebergementErrd / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "prevu",
      nom: "Résultat prévu l'an prochain",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "ce que l'association garderait, coût des mesures déduit"
          : `ERRD : ${kE(DEFICIT_ERRD)}, dont un excédent de soins repris`,
      jauge: (l) =>
        l.prevu == null
          ? null
          : {
              part: Math.min(1, Math.max(0, (l.prevu - DEPART) / (SEUIL - DEPART))),
              enRetard: l.prevu < SEUIL,
            },
    },
    {
      cle: "hebergement",
      nom: "Section hébergement",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "prévue l'an prochain" : "financée par les résidents et l'aide sociale",
    },
    {
      cle: "soins",
      nom: "Section soins",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "prévue l'an prochain ; un excédent est repris par l'ARS"
          : "financée par le forfait de l'ARS",
    },
    {
      cle: "occupation",
      nom: "Taux d'occupation",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `semaine ${semaine} ; cible ${taux(OCCUPATION_CIBLE, 0)}` : "l'an dernier",
    },
    {
      cle: "absenteisme",
      nom: "Absentéisme des soignants",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: (semaine) => (semaine ? `semaine ${semaine}` : "moyenne de l'an dernier"),
    },
  ],
  contexte(l, decisions) {
    return {
      prevu: kE(l.prevu ?? DEPART),
      hebergement: kE(l.hebergement ?? RESULTAT_ERRD.hebergement),
      soins: kE(l.soins ?? RESULTAT_ERRD.soins),
      occupation: taux(l.occupation ?? 0),
      absenteisme: taux(l.absenteisme ?? 0),
      cleCorrigee: l.cle === 1 || decisions[D.nuit] === 0,
      coupeValidee: l.coupe === 1,
      postesSupprimes: l.suppression === 1,
      soinsExcedent: (l.soins ?? 0) > 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const journees = semaines.reduce((x, w) => x + w.journees, 0);
    return [
      ["Journées réalisées", nombre(journees, 0)],
      ["Taux d'occupation moyen", taux(journees / (CAPACITE * 7 * semaines.length))],
      ["Résultat prévu l'an prochain, en fin de période", kE(t.semaines[a]!.prevu)],
    ];
  },
  courbe: {
    titre: "Journées réalisées, semaine par semaine",
    cle: "journees",
    cible: CAPACITE * 7 * OCCUPATION_CIBLE,
    libelleCible: "97 % d'occupation, ce sur quoi le prix de journée est calculé",
    graduations: [395, 410, 425, 440],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.journees!, 0)} journées · occupation ${taux(s.occupation!)}`,
      `absentéisme ${taux(s.absenteisme!)} · résultat prévu ${kE(s.prevu!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.prix && choix === 1) {
      // Le département répond à la demande d'habilitation partielle selon le hasard du trimestre.
      return [
        {
          ...TARIFICATION,
          texte: habilitationAccordee(graine) ? REPONSES.habilitationOui : REPONSES.habilitationNon,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.conseilImpose) {
      lies.push({ ...MONGRENIER, heure: "sem. 6", alerte: true, texte: REPONSES.conseilImpose });
    }
    if (arrive.conseilAttend) {
      lies.push({ ...MONGRENIER, heure: "sem. 6", texte: REPONSES.conseilAttend });
    }
    if (arrive.detectee) {
      lies.push({ ...ARS, heure: "sem. 7", alerte: true, texte: REPONSES.detectee });
    }
    if (arrive.nonDetectee) {
      lies.push({ ...ARS, heure: "sem. 7", texte: REPONSES.nonDetectee });
    }
    if (arrive.departement) {
      lies.push({
        ...TARIFICATION,
        heure: "sem. 8",
        alerte: !t.faits.rattrapage,
        texte: t.faits.rattrapage ? REPONSES.rattrapageOui : REPONSES.rattrapageNon,
      });
    }
    if (arrive.audit) {
      lies.push({
        de: "Cabinet Montagut",
        role: "Expertise comptable",
        heure: "sem. 10",
        texte: REPONSES.audit,
      });
    }
    if (arrive.coupe) {
      lies.push({
        de: "Dr Nnamdi Adeyemi",
        role: "Médecin coordonnateur, EHPAD d'Auxonne",
        heure: "sem. 10",
        alerte: !t.faits.coupe.validee,
        texte: t.faits.coupe.validee ? REPONSES.coupeOui : REPONSES.coupeNon,
      });
    }
    if (arrive.inspection) {
      lies.push({ ...ARS, heure: "sem. 11", alerte: true, texte: REPONSES.inspection });
    }
    if (arrive.reorientations) {
      lies.push({
        de: "Tassadit Truchot",
        role: "Infirmière coordinatrice (IDEC)",
        heure: "sem. 11",
        texte: REPONSES.reorientations,
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
      `${kE(t.objectif)} prévus l'an prochain : ${
        t.objectif >= SEUIL
          ? `un déficit tenu sous les ${kE(-SEUIL)} que le conseil acceptait`
          : `au-delà des ${kE(-SEUIL)} de déficit que le conseil acceptait`
      }`,
    formatObjectif: kE,
    noteDesBarres:
      "Résultat prévisionnel de l'an prochain que l'association garde (un excédent de soins est repris), moins le coût des mesures, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Résultat prévu l'an prochain",
          valeur: kE(t.objectif),
          aide: `coût des mesures compris (${kE(t.couts)}) ; seuil du conseil ${kE(SEUIL)}`,
          tenu: t.objectif >= SEUIL,
        },
        {
          nom: "Section hébergement",
          valeur: kE(t.sections.hebergement),
          aide: `${kE(RESULTAT_ERRD.hebergement)} à l'ERRD ; occupation prévue ${taux(t.occupationPrevue)}`,
          tenu: t.sections.hebergement > RESULTAT_ERRD.hebergement / 2,
        },
        {
          nom: "Coupe GMP et PMP",
          valeur: t.faits.coupe.validee ? "validée" : "non validée",
          aide: `GMP ${t.faits.coupe.gmp}, PMP ${t.faits.coupe.pmp} ; soins prévu ${kE(t.sections.soins)}${
            t.repris > 0 ? `, dont ${kE(t.repris)} repris` : ""
          }`,
          tenu: t.faits.coupe.validee,
        },
        {
          nom: "Équipe soignante",
          valeur: t.faits.suppression === null ? "postes maintenus" : "deux postes supprimés",
          aide: `absentéisme prévu ${taux(t.absenteismePrevu)}`,
          tenu: t.faits.suppression === null && !t.faits.inspection,
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
          titre: "Les autorités de tarification",
          texte: `${
            t.faits.rattrapage
              ? "Le département a accordé 3,20 € de rattrapage par journée"
              : "Le prix de journée suivra le taux directeur"
          } ; ${
            t.faits.coupe.validee
              ? `la coupe a été validée (GMP ${t.faits.coupe.gmp}, PMP ${t.faits.coupe.pmp})`
              : "la coupe n'a pas été validée"
          }${t.faits.detectee ? " ; l'ARS a rejeté l'imputation d'agents de service au soins" : ""}.`,
        },
        ...(t.faits.suppression !== null || t.faits.inspection
          ? [
              {
                titre: "L'équipe",
                texte: `${
                  t.faits.suppression === null
                    ? "Les absences n'ont plus été remplacées"
                    : `Les deux postes ont été supprimés${t.faits.suppression === 6 ? " par le vote du conseil en octobre" : ""}`
                }${
                  t.faits.inspection
                    ? t.faits.inspection.semaine === null
                      ? " ; un signalement conduira l'ARS à inspecter l'établissement l'an prochain"
                      : " ; un signalement a conduit l'ARS à inspecter l'établissement en semaine 11"
                    : ""
                }.`,
              },
            ]
          : []),
        {
          titre: "L'occupation",
          texte: `${taux(t.occupationMoyenne)} en moyenne sur le trimestre ; ${taux(t.occupationPrevue)} retenus pour l'an prochain.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
