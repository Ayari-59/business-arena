/**
 * ÉPISODE 93 — LE VIRAGE VERS LE DOMICILE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la stratégie montre à
 * Gratienne, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que
 * ses décisions révèlent d'elle.
 *
 * Une orientation se joue sur la durée d'un CPOM, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, cinq ans
 * d'excédent supplémentaire à 4 % pour chaque position prise, moins les
 * sommes engagées et perdues, recalculée chaque semaine avec ce que le
 * trimestre révèle : la réponse d'Orchidia, les chiffres du pilote et la
 * réponse du département, la décision de l'ARS, le vote du financement du
 * schéma.
 */
import {
  ACCUEIL,
  ACCUEIL_OPTIONS,
  CRT_OPTIONS,
  D,
  DEPARTS,
  ENVELOPPE,
  FERME,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_VALEUR,
  ORCHIDIA_OPTIONS,
  ORIENTATION,
  PERTE_PAR_JOUR,
  PILOTE,
  PILOTE_OPTIONS,
  PLACES_D1,
  PROBA,
  QUOTA,
  RECETTES_PERDUES_20,
  REPONSE_ORCHIDIA,
  RSS,
  CRT,
  SCENARIO,
  TAUX,
  chanceCRT,
  chanceOrchidia,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  tauxBanque,
  TAUX_BANQUE,
  type Scenario,
  type Trimestre,
} from "@/engine/episodes/virage-domiciliaire";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/virage-domiciliaire";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const points = (v: number) => `${nombre(v * 100, 0)} pts`;

const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const CORENTINE = { de: "Corentine Baradat", role: "Directrice de l'EHPAD de Beaune" } as const;
const GRETA = {
  de: "Greta Quenardel",
  role: "Cadre de santé, EHPAD de Beaune",
} as const;
const MARIN = {
  de: "Marin Peyrebrune",
  role: "Directeur régional, Orchidia Résidences",
} as const;
const BANQUE = { de: "Valdemar Joubaud", role: "Chargé d'affaires, Banque Saônelle" } as const;
const DEPARTEMENT = {
  de: "Direction de l'autonomie",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const ARS = { de: "Délégation départementale", role: "Agence régionale de santé" } as const;

/** Ce que la prévision de la semaine 1 demande : les recettes perdues par an si vingt places de Beaune sont transformées. */
export const RECETTES_PERDUES_KE = RECETTES_PERDUES_20 / 1000;

const ORIENTATIONS = [
  "défendre nos places",
  "un virage par étapes",
  "le grand virage à Beaune",
  "attendre le vote",
] as const;
const CHOIX_ORCHIDIA = [
  "une résidence concurrente",
  "une convention proposée à Orchidia",
  "rien proposé à Orchidia",
  "une baisse de prix à Montchapet",
] as const;
const SCENARIOS_DITS: Record<Scenario, string> = {
  applique: "appliqué",
  differe: "différé",
  renforce: "renforcé",
};

/** Ce que les décisions révèlent, dans l'ordre où une directrice de la stratégie les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le compte d'une place par section et le financement du schéma, qui disaient ce qu'une place transformée perd et gagne",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    virage:
      "Votre diagnostic de la semaine 1 était juste : les besoins et les financements vont vers le domicile et le répit, et l'on y va par étapes testées, avec ce qu'on sait faire, au rythme de ce que le département finance.",
    transformer:
      "En semaine 1, vous avez vu que le schéma viderait nos EHPAD hors de Dijon : c'est vrai, mais l'essentiel était le rythme. Une place transformée sans financement coûte, et vider quarante places d'un coup perd des recettes et des soignants.",
    concurrent:
      "En semaine 1, vous avez vu Orchidia comme la menace principale. Sa résidence vise des personnes autonomes : ce qui lui manque, le soin et l'EHPAD, est ce que nous savons faire.",
    places:
      "En semaine 1, vous avez lu la liste d'attente comme un besoin de places. Le schéma les gèle, et les familles gardent leurs parents à domicile plus longtemps : le besoin se déplace, il ne se mesure pas aux inscriptions.",
  };
  const justes = ["virage", "transformer"];
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
    score: d === "virage" ? 1 : d === "transformer" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du conseil : ni défendre les lits en en demandant d'autres, ni imiter le concurrent commercial, ni renoncer au centre de ressources, ni étendre le pilote comme le plan le disait, ni ouvrir un service sans savoir qui viendrait, ni signer un CPOM à l'identique."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure un conseil d'administration : défendre ses lits, imiter Orchidia, garder ses forces pour les EHPAD, suivre le plan malgré les chiffres, ouvrir sans demander, ne rien changer au CPOM.${
            t.departs ? " L'équipe de Beaune a en plus perdu des soignants." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    RECETTES_PERDUES_KE,
    "de recettes perdues par an si vingt places de Beaune sont transformées",
    "k€",
    { juste: 10, proche: 40 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const d4 = p.chemin[D.pilote];
  const d5 = p.chemin[D.accueil];
  const sPilote = d4 === PILOTE_OPTIONS.ajuster ? 1 : d4 === PILOTE_OPTIONS.arreter ? 0.6 : 0;
  const sAccueil =
    d5 === ACCUEIL_OPTIONS.enquete
      ? 1
      : d5 === ACCUEIL_OPTIONS.minibus || d5 === ACCUEIL_OPTIONS.renoncer
        ? 0.6
        : 0;
  const adh = taux(t.adhesion, 0);
  const pilote =
    d4 === PILOTE_OPTIONS.ajuster
      ? `Pour le dispositif renforcé, vous avez révisé le plan au vu du pilote : ${adh} des familles le choisissaient, pas 80 %, et les nuits coûtaient plus que prévu.`
      : d4 === PILOTE_OPTIONS.arreter
        ? `Pour le dispositif renforcé, vous avez tout arrêté : prudent, mais ${adh} des familles le choisissaient, et une extension resserrée, nuits mutualisées, rapportait en moyenne.`
        : `Pour le dispositif renforcé, vous avez étendu comme le plan le prévoyait alors que ${adh} seulement des familles le choisissaient, et que les nuits coûtaient plus que prévu.`;
  const accueil =
    d5 === ACCUEIL_OPTIONS.enquete
      ? ` À Beaune, vous avez interrogé les aidants avant d'ouvrir : la demande était ${t.demande}, l'accueil a été dimensionné en conséquence.`
      : d5 === ACCUEIL_OPTIONS.ouvrir
        ? ` À Beaune, vous avez ouvert douze places sans savoir qui viendrait ni comment : la demande était ${t.demande}, et sans transport un accueil de jour reste à moitié vide.`
        : d5 === ACCUEIL_OPTIONS.minibus
          ? ` À Beaune, vous avez misé sur le transport sans connaître la demande (elle était ${t.demande}) : une enquête de 12 k€ l'aurait dit.`
          : ` À Beaune, vous avez renoncé à l'accueil de jour sans connaître la demande des aidants (elle était ${t.demande}).`;
  const tester: Constat = { score: (sPilote + sAccueil) / 2, texte: pilote + accueil };

  return [information, diagnostic, reflexe, calibrage, tester];
}

export function axe([information, diagnostic, reflexe, calibrage, tester]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qu'une place perd et ce qu'elle rapporte",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le compte d'une place par section et le financement du schéma : une place transformée perd ses recettes d'hébergement et de dépendance, garde ses crédits de soins, et ne rapporte que si le département finance.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Aller là où vont les besoins et les financements",
      texte:
        "Défendre ses lits, imiter le concurrent commercial ou garder ses forces pour les EHPAD protège ce qu'on a, pas ce dont le territoire aura besoin. Développez l'offre que le schéma finance, avec ce que vous savez faire : le soin à domicile, le répit, l'EHPAD comme ressource.",
    };
  }
  if (tester!.score < 0.5) {
    return {
      titre: "Tester, puis réviser",
      texte:
        "Un pilote vaut par ce qu'il révèle : quand ses chiffres démentent le plan, c'est le plan qu'on change. Et avant d'ouvrir un service, demandez à ceux qui doivent y venir s'ils viendront, et comment.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Transformer au rythme des financements",
      texte:
        "Le virage domiciliaire est la bonne direction ; le rythme se règle sur ce que le département finance vraiment. Une place transformée hors financement coûte chaque année ; transformée par étapes, elle reste réversible.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul par section",
      texte:
        "Recettes perdues d'une place : 365 jours, au taux d'occupation de Beaune, au tarif d'hébergement plus le tarif dépendance. Le forfait soins ne compte pas : il suit la place dans le CPOM.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions : un schéma différé ou une ARS qui retient un autre dossier peuvent faire perdre une bonne orientation, sans la rendre mauvaise.",
  };
}

const ORIENTATION_GRAND = ORIENTATION.grand;

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

export const EPISODE_VIRAGE: Episode<Trimestre> = {
  code: "virage-domiciliaire",
  numero: 93,
  domaine: "Repositionner une offre médico-sociale",
  titre: "Le virage vers le domicile",
  resume:
    "Un schéma qui gèle les places d'EHPAD, une résidence services concurrente, un pilote à domicile qui livre ses chiffres, un CPOM à négocier. Développer l'offre là où vont les besoins et les financements, par étapes testées.",
  persona:
    "Vous êtes Gratienne Dumoulinet, directrice générale adjointe de l'Association Solvanne, chargée de la stratégie : six EHPAD, une clinique de réadaptation, un pôle domicile et un pôle handicap en Côte-d'Or et en Saône-et-Loire. Vous proposez au conseil d'administration l'orientation du prochain CPOM.",
  mandat: [
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
    {
      fort: "480 places",
      texte: "dans six EHPAD, gelées par le projet de schéma jusqu'en 2031",
    },
    {
      fort: taux(TAUX, 0),
      texte: "le taux du conseil ; une position se valorise sur les cinq ans du CPOM",
    },
    {
      fort: kE(ENVELOPPE),
      texte: "disponibles au plan pluriannuel d'investissement, emprunts compris",
    },
  ],
  jugement:
    "Le conseil juge le trimestre sur la valeur créée pour l'association : cinq ans d'excédent supplémentaire, à 4 %, pour chaque position prise, recalculés en semaine 13 avec ce que le trimestre a révélé, moins les sommes engagées et perdues.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre stratégie",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la note au bureau se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...EUDOXIE,
        alerte: true,
        texte: `Pour tenir la date du bureau, j'ai fait boucler votre note par un cabinet : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "les recettes que l'association perdrait chaque année si vingt places de l'EHPAD de Beaune étaient transformées, en milliers d'euros",
    unite: "k€",
    placeholder: "500",
    min: 0,
    max: 2000,
    step: 1,
    reel: () => RECETTES_PERDUES_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `cinq ans d'excédent à ${taux(l.taux ?? TAUX, 1)}, avec ce que le trimestre a révélé`
          : "rien n'est encore engagé",
    },
    {
      cle: "excedent",
      nom: "Excédent annuel des positions",
      format: (v) => `${kE(v)}/an`,
      sensBon: 1,
      aide: () => "par an, en espérance, positions prises et menaces comprises",
    },
    {
      cle: "engage",
      nom: "Sommes engagées",
      format: kE,
      sensBon: -1,
      aide: () => `sur ${kE(ENVELOPPE)} disponibles au plan pluriannuel`,
      jauge: (l) => ({
        part: Math.min(1, (l.engage ?? 0) / ENVELOPPE),
        enRetard: (l.engage ?? 0) > ENVELOPPE,
      }),
    },
    {
      cle: "occupation",
      nom: "Occupation des six EHPAD",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) => (semaine ? `semaine ${semaine} ; cible 97 %` : "moyenne de l'an dernier"),
    },
    {
      cle: "differe",
      nom: "Risque que le schéma soit différé",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) =>
        semaine >= SCENARIO.semaine
          ? "le département a voté"
          : semaine >= PILOTE.semaine
            ? "estimé après la réponse du département au pilote"
            : "estimé par la direction de l'autonomie",
    },
  ],
  contexte(l, decisions): Contexte {
    const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
    const d1 = chemin[D.orientation]!;
    const adhesion = l.adhesion ?? PILOTE.adhesion.moyenne;
    const candidats = Math.round(PILOTE.eligibles * adhesion);
    const deja = PLACES_D1[d1]!;
    const promesse = [...chemin];
    promesse[D.crt] = CRT_OPTIONS.promettre;
    const porter = [...chemin];
    porter[D.crt] = CRT_OPTIONS.porter;
    return {
      orientation: ORIENTATIONS[d1]!,
      orchidiaChoix: CHOIX_ORCHIDIA[chemin[D.orchidia]!]!,
      chanceOrchidia: taux(chanceOrchidia(chemin), 0),
      chanceCRT: taux(chanceCRT(porter), 0),
      chanceCRTPromesse: taux(chanceCRT(promesse), 0),
      adhesion: taux(adhesion, 0),
      candidats,
      videsPlan: Math.max(0, PILOTE.plan - candidats),
      signal: (l.signal ?? 0) === 1,
      differe: taux(l.differe ?? PROBA.differe, 0),
      placesDeja: deja,
      placesFerme: Math.max(0, FERME.places - deja),
      valeur: kE(l.valeur ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Excédent annuel des positions, sem. ${a}`, `${kE(s.excedent)}/an`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-2000000, -1000000, 0, 1000000, 2000000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `excédent des positions ${kE(s.excedent!)}/an · engagé ${kE(s.engage!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.orchidia && choix === ORCHIDIA_OPTIONS.residence) {
      // La banque prête sans caution, ou l'exige, selon le hasard du trimestre.
      return [
        {
          ...BANQUE,
          texte:
            tauxBanque(graine) === TAUX_BANQUE.base ? REPONSES.banqueBase : REPONSES.banqueCaution,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.orchidia) {
      lies.push({
        ...MARIN,
        heure: `sem. ${REPONSE_ORCHIDIA}`,
        alerte: !t.orchidiaAccepte,
        texte: t.orchidiaAccepte ? REPONSES.orchidiaAccepte : REPONSES.orchidiaRefuse,
      });
    }
    if (arrive.riposte) {
      lies.push({
        ...EUDOXIE,
        heure: `sem. ${RSS.semaineRiposte}`,
        alerte: t.orchidiaRiposte,
        texte: t.orchidiaRiposte ? REPONSES.riposte : REPONSES.paix,
      });
    }
    if (arrive.departs) {
      lies.push({
        ...CORENTINE,
        heure: `sem. ${DEPARTS.semaine}`,
        alerte: t.departs,
        texte: t.departs ? REPONSES.departs : REPONSES.equipeTient,
      });
    }
    if (arrive.crt) {
      lies.push({
        ...ARS,
        heure: `sem. ${CRT.semaine}`,
        alerte: !t.crtGagne,
        texte: t.crtGagne ? REPONSES.crtGagne : REPONSES.crtPerdu,
      });
    }
    if (arrive.enquete) {
      lies.push({
        ...GRETA,
        heure: `sem. ${ACCUEIL.resultat}`,
        texte: t.demande === "forte" ? REPONSES.demandeForte : REPONSES.demandeFaible,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.vote) {
      imprevus.push({
        ...DEPARTEMENT,
        heure: `sem. ${SCENARIO.semaine}`,
        texte: REPONSES[t.scenario],
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : cinq ans d'excédent supplémentaire, à 4 %, pour chaque position prise, moins les sommes engagées et perdues, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Excédent annuel",
          valeur: `${kE(t.excedent)}/an`,
          aide: "ce que vos positions ajoutent chaque année, menaces déduites",
          tenu: t.excedent > 0,
        },
        {
          nom: "Centre de ressources",
          valeur: t.crtGagne ? "obtenu" : "non obtenu",
          aide: t.chanceCRT
            ? `${taux(t.chanceCRT, 0)} de chances vu vos choix`
            : "l'association n'a pas candidaté",
          tenu: t.crtGagne,
        },
        {
          nom: "Sommes engagées",
          valeur: kE(t.engage),
          aide: `sur ${kE(ENVELOPPE)} disponibles au plan pluriannuel`,
          tenu: t.engage <= ENVELOPPE,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const lignes = [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le financement du schéma",
          texte: `a été ${SCENARIOS_DITS[t.scenario]} en semaine ${SCENARIO.semaine} (une chance sur deux d'être appliqué, trois sur dix d'être différé, deux sur dix d'être renforcé) : ${QUOTA[t.scenario]} places financées chez Solvanne.`,
        },
        {
          titre: "Le dispositif renforcé",
          texte: `${taux(t.adhesion, 0)} des familles l'ont choisi, pour 80 % au plan ; le département ${
            t.signal ? "a accepté" : "a refusé"
          } de financer les plans d'aide du pilote avant le vote.`,
        },
        {
          titre: "Orchidia",
          texte:
            t.choixOrchidia === ORCHIDIA_OPTIONS.convention
              ? `${t.orchidiaAccepte ? "a accepté" : "a refusé"} la convention de parcours ; vu votre orientation, elle l'acceptait ${taux(t.chanceOrchidia, 0)} du temps.`
              : t.choixOrchidia === ORCHIDIA_OPTIONS.residence
                ? `${t.orchidiaRiposte ? "a baissé ses prix" : "a gardé ses prix"} face à votre résidence ; elle les baisse six fois sur dix.`
                : `ouvre sa résidence en septembre ; elle aurait accepté une convention ${taux(t.chanceOrchidia, 0)} du temps, vu votre orientation.`,
        },
        {
          titre: "Les aidants de Beaune",
          texte: `La demande pour l'accueil de jour était ${t.demande} ; elle l'était une fois sur deux.`,
        },
      ];
      if (t.orientation === ORIENTATION_GRAND) {
        lignes.push({
          titre: "L'équipe de Beaune",
          texte: t.departs
            ? "a perdu des soignants à l'annonce de la transformation, comme une fois sur deux."
            : "a tenu malgré l'annonce de la transformation ; une fois sur deux, elle perd des soignants.",
        });
      }
      if (t.chanceCRT > 0) {
        lignes.push({
          titre: "Le centre de ressources territorial",
          texte: `${t.crtGagne ? "a été confié à Solvanne" : "est allé à l'EHPAD public de la plaine"} ; vu vos choix, vous aviez ${taux(t.chanceCRT, 0)} de chances de l'obtenir.`,
        });
      }
      return lignes;
    },
  },
  comportements,
  axe,
};
