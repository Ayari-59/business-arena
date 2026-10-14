import type { AtelierDefinition } from "./index";
import { formationsEnToutesLettres } from "../formations";
import { scenarioByCode } from "../scenarios/registry";
import { tempsDeTravail } from "../scenarios/registry";
import { DIFFICULTY_PRESETS } from "../difficulty";
import { INVITATION_NOTE } from "../justification";
import { DIAGNOSTIC, MODELE } from "../situation-rendu";
import { NOM_DU_JOURNAL } from "../gazette/types";
import { BPI_V2_DIMENSIONS, INDICE, scoringWeightsV2, V2_DIMENSION_LABELS } from "../../scoring/bpi";
import type { NombreDeToursDEssai } from "../tour-d-essai";
import { dossiersDeService, type DossierService, type LigneService } from "./services";
import {
  leviersDuResponsable,
  listeDeControle,
  notionsDuResponsable,
  prochaineOuverture,
  repartitionDeLAtelier,
  RESPONSABLES,
  RESULTATS_COMMUNS_PAR_ROLE,
  roleByCode,
  roleDuKpi,
  ROLES,
  VEILLE_PAR_ROLE,
  type CodeDeResponsable,
  type CodeDeRole,
  type LevierDuResponsable,
  type PointDeControle,
  type RoleDeLEquipe,
} from "./roles";

/**
 * LE DOSSIER DE CHAQUE RESPONSABLE.
 *
 * Le dossier de l'équipe (`dossiers.ts`) dit à tous ce que l'entreprise est et
 * ce que l'atelier demande. Chaque responsable reçoit en plus SON document,
 * à part : sa mission, les décisions qu'il porte et ce qu'elles changent, les
 * chiffres de son domaine, ce qu'il lit à chaque clôture, ce qu'il prépare
 * pour chaque séance, ce qu'il demande aux autres avant de valider, et sa
 * feuille de décision à remplir au stylo.
 *
 * Rien n'est écrit à la main par atelier : tout se déduit du registre, de
 * l'atelier (niveau, séances, effectif), du scénario (vocabulaire, chiffres,
 * indicateurs) et des correspondances de `roles.ts`. Un levier que le niveau
 * ferme n'apparaît pas ; un rôle sans levier garde un dossier, plus court,
 * qui dit ce qu'il surveille et à quel niveau ses leviers s'ouvrent.
 *
 * C'est un document d'ÉLÈVE. La structure ne porte que des champs qui lui
 * sont destinés, recopiés un à un : ni préparation de l'enseignant, ni
 * déroulé minuté, ni corrigé. La garde des dossiers s'y étend.
 */

export interface SeanceDuResponsable {
  numero: number;
  titre: string;
  tourJoue: number | null;
  essai: boolean;
  /** Les décisions de ce rôle que le tour demande, par nom d'écran. */
  decisions: string[];
  /** Les notions de la séance qui reviennent à ce rôle (celles de tous comprises). */
  notions: string[];
  /** Pour la direction : l'objectif de la séance et le livrable qu'elle tient. */
  objectif: string | null;
  livrable: string | null;
  trace: string | null;
  /** La dernière séance : la présentation ou le rapport final. */
  derniere: boolean;
}

export interface MandatDeDirection {
  objectif: string;
  tours: number;
  periodicite: "month" | "quarter" | "year";
  tourDEssai: NombreDeToursDEssai | null;
  /** Ce qui fait le classement : l'indice et ses dimensions, pondérées comme le scénario les pondère. */
  indice: { sigle: string; nom: string };
  dimensions: { label: string; poids: number }[];
  /** Comment l'indice se calcule et quand le classement se lit, en phrases. */
  regles: string[];
  premierArbitrage: { question: string; routes: { label: string; gain: string; risque: string }[] };
}

export interface DossierDuResponsable {
  role: RoleDeLEquipe;
  entete: {
    atelier: string;
    diplome: string;
    annee: string;
    entreprise: string;
    promesse: string;
  };
  /** 1. Sa mission, dans le vocabulaire de ce métier. */
  mission: string;
  /** 2. Les décisions qu'il porte, parmi celles que le niveau ouvre. */
  decisions: LevierDuResponsable[];
  /** Quand rien (ou pas tout) n'est ouvert : le niveau qui ouvre la suite. */
  ouverture: { niveau: number; niveauNom: string; leviers: string[] } | null;
  /** 3. Les chiffres de son domaine (aucun pour la direction). */
  chiffres: { lignes: LigneService[]; tableau?: DossierService["tableau"] } | null;
  /** 4. Les indicateurs qu'il lit à chaque clôture. */
  indicateurs: string[];
  /** 5. Ce qu'il prépare pour chaque séance. */
  seances: SeanceDuResponsable[];
  /** 6. Les questions à poser aux autres responsables avant de valider, et celles à se poser. */
  aDemander: string[];
  aVerifier: string[];
  /** 7. Sa feuille de décision, tours en colonnes. */
  feuille: { decisions: string[]; indicateurs: string[]; tours: number[] };
  /** 8. La répartition selon l'effectif que la fiche conseille. */
  repartition: string[];
  /** La direction seule : le mandat, ce qu'elle porte, la liste de contrôle, la synthèse. */
  direction: {
    mandat: MandatDeDirection;
    porte: string[];
    controle: PointDeControle[];
    synthese: string[];
  } | null;
}

/** Les lignes de la feuille de synthèse de la direction, tour par tour. */
export const LIGNES_DE_SYNTHESE = [
  "Décision clé du tour",
  "Ce que nous attendions",
  "Ce qui s'est passé",
  "Ce que nous changeons au tour suivant",
  "Place au classement",
] as const;

/** Les indicateurs qu'un rôle lit à la clôture, parmi les communs et ceux du métier. */
function indicateursDuRole(
  role: CodeDeRole,
  kpis: { key: string; label: string }[],
  temps: ReturnType<typeof tempsDeTravail>,
): string[] {
  const communs = Object.entries(RESULTATS_COMMUNS_PAR_ROLE)
    .filter(([, roles]) => roles.includes(role))
    .map(([label]) => label);
  if (role === "direction") {
    // Le résultat, la caisse, la part de marché, le classement, l'indicateur
    // de tête du métier (le premier que le secteur déclare), puis l'indice.
    return [
      ...communs.filter((l) => l !== "Place au classement"),
      "Part de marché",
      ...(kpis[0] ? [kpis[0].label] : []),
      "Place au classement",
      ...BPI_V2_DIMENSIONS.map((d) => `${INDICE.sigle} · ${V2_DIMENSION_LABELS[d]}`),
    ];
  }
  const veille = VEILLE_PAR_ROLE[role].map((l) =>
    l === "Effectif" ? `Effectif et ${temps.pluriel} disponibles` : l,
  );
  return [...communs, ...kpis.filter((k) => roleDuKpi(k.key) === role).map((k) => k.label), ...veille];
}

/** Ce que chaque responsable demande aux autres avant de valider, nommés. */
function questionsAuxAutres(
  role: CodeDeResponsable,
  args: { v: ReturnType<typeof scenarioByCode>["vocabulary"]; ouverts: Set<string>; temps: ReturnType<typeof tempsDeTravail> },
): string[] {
  const { v, ouverts, temps } = args;
  const nomme = (code: CodeDeResponsable) => roleByCode.get(code)!.interlocuteur;
  const a = (champ: string) => ouverts.has(champ);
  switch (role) {
    case "commercial":
      return [
        `Demandez ${nomme("approvisionnement")} combien de ${v.units} le ${v.productionPlanLabel.toLowerCase()} du tour permet de vendre, ${v.leftoverLabel.toLowerCase()} compris : un prix qui attire plus que ce qu'on peut servir fait perdre des ventes, pas gagner de la marge.`,
        `Demandez ${nomme("financier")} ce que les clientèles qui règlent à délai font à la trésorerie du tour : ce qui est vendu n'est pas encore encaissé.`,
        ...(a("hire")
          ? [`Demandez ${nomme("rh")} si les ${temps.pluriel} de l'équipe suivent le volume que vos prix appellent, sachant qu'une embauche ne produit qu'au tour suivant.`]
          : []),
      ];
    case "approvisionnement":
      return [
        `Demandez ${nomme("commercial")} les ventes qu'il attend à son prix, clientèle par clientèle, avant de fixer le ${v.productionPlanLabel.toLowerCase()} : c'est la demande qui dimensionne le volume, pas la capacité.`,
        `Demandez ${nomme("financier")} si les achats du tour, au délai du fournisseur retenu, passent dans la caisse du tour${a("machineCapacityUnits") ? ", et si l'investissement de capacité, payé maintenant pour servir au tour suivant, est financé" : ""}.`,
        a("hire")
          ? `Demandez ${nomme("rh")} les ${temps.pluriel} disponibles ce tour, embauches du tour exclues puisqu'elles n'arrivent qu'au suivant.`
          : `Demandez ${nomme("rh")} si les ${temps.pluriel} disponibles couvrent le volume : à ce niveau l'effectif ne se change pas, le volume doit s'y plier.`,
      ];
    case "rh":
      return [
        `Demandez ${nomme("approvisionnement")} le ${v.productionPlanLabel.toLowerCase()} visé sur les prochains tours, pas seulement celui-ci : une embauche décidée ce tour ne travaille qu'au suivant.`,
        `Demandez ${nomme("financier")} ce que ${a("hire") ? "les embauches, la formation et l'écart de salaire" : "la masse salariale"} du tour coûtent en caisse avant de valider.`,
        `Demandez ${nomme("commercial")} le tour de la demande la plus forte : c'est lui qu'il faut avoir préparé en ${temps.pluriel}.`,
      ];
    case "financier":
      return [
        `Demandez ${nomme("commercial")} quelles ventes du tour seront encaissées ce tour-ci et lesquelles au tour suivant, clientèle par clientèle.`,
        `Demandez ${nomme("approvisionnement")} si le fournisseur retenu se paie comptant ou à délai${a("machineCapacityUnits") ? ", et ce que l'investissement de capacité décaisse ce tour" : ""}.`,
        `Demandez ${nomme("rh")} ce que ${a("hire") ? "les embauches, les départs, la formation et les salaires" : "la masse salariale"} du tour coûtent, pour les poser dans la trésorerie prévue.`,
      ];
  }
}

/** Les cinq dossiers d'un atelier, la direction en premier. */
export function dossiersDesResponsables(atelier: AtelierDefinition): DossierDuResponsable[] {
  return ROLES.map((r) => dossierDuResponsable(atelier, r.code));
}

export function dossierDuResponsable(atelier: AtelierDefinition, code: CodeDeRole): DossierDuResponsable {
  const role = roleByCode.get(code);
  if (!role) throw new Error(`Rôle inconnu : ${code}`);
  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  const config = scenario.scenario;
  const v = scenario.vocabulary;
  const temps = tempsDeTravail(v);
  const niveau = atelier.reglages.niveau;
  const tours = atelier.reglages.tours;
  const rdOuverte = DIFFICULTY_PRESETS.find((p) => p.level === niveau)?.decisions.rd ?? false;
  const services = dossiersDeService(scenario, tours, { sansRd: !rdOuverte });
  const service = services.find((s) => s.code === code) ?? null;
  const decisions = leviersDuResponsable(code, niveau, config);
  const ouverts = new Set(RESPONSABLES.flatMap((r) => leviersDuResponsable(r.code, niveau, config).map((l) => l.champ)));
  const indicateurs = indicateursDuRole(code, scenario.kpis, temps);

  const entete = {
    atelier: atelier.titre,
    diplome: formationsEnToutesLettres(atelier),
    annee: atelier.annee,
    entreprise: scenario.title,
    promesse: scenario.tagline,
  };

  // Le vocabulaire du métier, pour que la mission parle de chambres, de
  // couverts ou de mètres carrés, et non d'unités.
  const vocabulaire = `Dans cette entreprise, on vend des ${v.units} : le prix s'appelle « ${v.priceLabel.toLowerCase()} », le volume « ${v.productionPlanLabel.toLowerCase()} », la limite « ${v.capacityLabel.toLowerCase()} », et ce qui n'est pas vendu, « ${v.leftoverLabel.toLowerCase()} ».`;

  const seances: SeanceDuResponsable[] = atelier.seances.map((s, i) => {
    const joue = s.essai === true || s.tourJoue !== null;
    return {
      numero: s.numero,
      titre: s.titre,
      tourJoue: s.tourJoue,
      essai: s.essai === true,
      decisions: joue ? decisions.map((d) => d.nom) : [],
      notions: notionsDuResponsable(code, s.notions),
      objectif: code === "direction" ? s.objectif : null,
      livrable: code === "direction" ? s.livrable : null,
      trace: code === "direction" ? s.tracePasseport : null,
      derniere: i === atelier.seances.length - 1,
    };
  });

  const repartition = repartitionDeLAtelier({
    effectifParEquipe: atelier.reglages.effectifParEquipe,
    niveau,
    scenario: config,
  });
  const toursJoues = Array.from({ length: tours }, (_, i) => i + 1);

  if (code === "direction") {
    const poids = scoringWeightsV2(config.scoring);
    const mandat: MandatDeDirection = {
      objectif: `Diriger ${scenario.title} pendant ${tours} tours, face aux autres équipes qui vendent aux mêmes clients, et répondre de chaque tour validé.`,
      tours,
      periodicite: atelier.reglages.periodicite,
      tourDEssai: atelier.reglages.tourDEssai ?? null,
      indice: { sigle: INDICE.sigle, nom: INDICE.nom },
      dimensions: BPI_V2_DIMENSIONS.map((d) => ({ label: V2_DIMENSION_LABELS[d], poids: poids[d] })),
      regles: [
        `Chaque dimension est notée sur 100 : pour moitié face aux repères du scénario, pour moitié par le rang de l'équipe parmi les autres ; l'${INDICE.sigle} du tour est la somme pondérée des dimensions.`,
        `L'${INDICE.sigle} de la partie pondère les tours par leur numéro : le dernier pèse plus que le premier, et une partie qui finit bien se classe mieux qu'une partie qui a bien commencé.`,
        "Le classement d'un tour se lit quand l'animateur le révèle, pas à la seconde où le tour est clos.",
      ],
      premierArbitrage: {
        question: scenario.dilemma.question,
        routes: scenario.dilemma.routes.map((r) => ({ label: r.label, gain: r.gain, risque: r.risque })),
      },
    };
    return {
      role,
      entete,
      mission: `Tenir le cap et valider le tour. La direction ne remplit aucune case de décision : elle écrit la note qui justifie les choix de l'équipe, elle lit ce que le tour a envoyé, elle met les quatre responsables d'accord, et c'est elle qui valide. ${vocabulaire}`,
      decisions: [],
      ouverture: null,
      chiffres: null,
      indicateurs,
      seances,
      aDemander: RESPONSABLES.map(
        (r) => `Demandez ${r.interlocuteur} ce qu'il attend de ses décisions du tour, en une phrase : c'est la matière de la note de justification, et ce qu'on relira au tour suivant à côté du constat.`,
      ),
      aVerifier: [],
      feuille: { decisions: [], indicateurs, tours: toursJoues },
      repartition,
      direction: {
        mandat,
        porte: [
          `La note de justification des décisions, sur l'écran du tour : « ${INVITATION_NOTE} » Elle est recommandée, jamais exigée, et elle revient au tour suivant à côté du constat.`,
          "La validation finale du tour, une fois les quatre responsables d'accord : un tour validé ne se rouvre pas.",
          `Le courrier du tour et ${NOM_DU_JOURNAL}, à lire avant de décider : ce qui est arrivé à l'entreprise et au marché s'y annonce.`,
          `La situation du tour, à mener en équipe : ${DIAGNOSTIC} à cocher sur l'écran de la situation, ${MODELE} d'analyse à choisir et ses questions ; le rendu ne part que complet, ${DIAGNOSTIC} et ${MODELE} ensemble.`,
        ],
        controle: listeDeControle(niveau, config),
        synthese: [...LIGNES_DE_SYNTHESE],
      },
    };
  }

  const responsable = code;
  const ouverture = prochaineOuverture(responsable, niveau, config);
  return {
    role,
    entete,
    mission: `${service!.mission} ${vocabulaire}`,
    decisions,
    ouverture,
    chiffres: { lignes: service!.lignes, ...(service!.tableau ? { tableau: service!.tableau } : {}) },
    indicateurs,
    seances,
    aDemander: questionsAuxAutres(responsable, { v, ouverts, temps }),
    aVerifier: [...service!.questions],
    feuille: { decisions: decisions.map((d) => d.nom), indicateurs, tours: toursJoues },
    repartition,
    direction: null,
  };
}
