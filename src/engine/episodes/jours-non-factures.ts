/**
 * LES JOURS QU'ON NE FACTURE PAS — le modèle du bureau de Nantes d'Atlas Conseil.
 *
 * Soixante-quinze consultants facturables (45 juniors : analystes et
 * consultants ; 30 seniors : consultants seniors, managers, directeurs), un
 * trimestre d'avril à juin, six décisions. Le taux d'occupation n'a jamais été
 * aussi haut, et la marge baisse. Quatre mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · UN FORFAIT SOUS-ESTIMÉ OCCUPE À PERTE. Au forfait, le prix est fixé : un
 *     jour passé au-delà des jours vendus ne rapporte rien. Le taux
 *     d'occupation (jours staffés ÷ jours disponibles) compte ces jours comme
 *     les autres ; le taux de réalisation (jours facturés ÷ jours passés) les
 *     montre. Le bureau est à 72 % d'occupation et 85 % de réalisation : il
 *     ne facture que 61 % de ses jours disponibles.
 *   · QUELQUES MISSIONS FONT L'ESSENTIEL DES DÉPASSEMENTS. Trois forfaits sur
 *     dix-huit (Kervalan, Montlouvel, Talvenec) concentrent plus de neuf jours
 *     non facturés sur dix. Les recentrer sur leur cahier des charges, faire
 *     payer le hors-périmètre par un avenant, libère des jours, et d'abord
 *     ceux des managers, qui manquent en juin quand les missions du printemps
 *     démarrent : chaque jour de manager qui manque se paie en freelance
 *     (Freelancia, 900 € la journée).
 *   · RENFORCER UNE MISSION EN DÉPASSEMENT AUGMENTE L'OCCUPATION ET LA PERTE.
 *     Le rythme d'une mission en retard est celui des comités et des
 *     validations du client, pas celui de l'équipe : un junior de plus y
 *     avance peu, coûte des frais de déplacement que le forfait ne rembourse
 *     pas, et prend du temps aux managers pour l'intégrer et relire son
 *     travail. L'occupation monte vers 80 %, la mission ne finit pas plus tôt.
 *   · UN FAUX INDICATEUR : LE TJM MOYEN FACTURÉ MONTE. Il monte parce que les
 *     juniors sont sur le banc, donc que les jours facturés sont plus souvent
 *     des jours de seniors (effet de structure), pas parce que les prix
 *     passent : à grade égal, le TJM n'a pas bougé. Relever les tarifs sur
 *     cette foi fait perdre des propositions.
 *
 * Le trimestre est jugé en euros : la MARGE DES MISSIONS du bureau, soit les
 * honoraires que les missions ont gagnés (au forfait, à l'avancement : la
 * valeur des jours vendus restants, au prorata du reste à faire consommé),
 * moins le coût de tous les consultants du bureau (salaires chargés,
 * intercontrat compris : un jour de banc coûte autant qu'un jour staffé), la
 * sous-traitance à Freelancia, les frais non refacturés et les pénalités.
 * Une journée-consultant ne se stocke pas : seule une journée facturée
 * rapporte.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, clients et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Les consultants facturables du bureau. */
export const JUNIORS = 45;
export const SENIORS = 30;
/** Le coût journalier : salaire chargé ÷ 210 jours ouvrés par an. */
export const COUT_JOUR = { junior: 340, senior: 590 } as const;
export const JOURS_PAR_AN = 210;
/** Les salaires d'une semaine : ils tombent que les consultants soient staffés ou non. */
export const salairesSemaine = (seniors: number = SENIORS) =>
  ((JUNIORS * COUT_JOUR.junior + seniors * COUT_JOUR.senior) * JOURS_PAR_AN) / 52;

/** Le TJM catalogue, par grade. */
export const TJM = { junior: 720, senior: 1080 } as const;
/** Ce que coûte une journée de freelance prise sur Freelancia, commission comprise. */
export const FREELANCE = { junior: 560, senior: 900 } as const;

/**
 * Le calendrier d'avril à juin : jours ouvrés par semaine (lundi de Pâques,
 * 1er et 8 mai, pont de l'Ascension, lundi de Pentecôte), moins les congés et
 * RTT, en moyenne 0,4 jour par consultant et par semaine.
 */
export const OUVRES = [0, 4, 5, 5, 5, 4, 4, 3, 5, 4, 5, 5, 5, 5] as const;
export const CONGES = 0.4;
export const dispo = (w: number) => OUVRES[w]! - CONGES;

/** Ceux qui ne sont pas staffables : formation, intégration, avant-vente, management. */
export const INTERNES = { junior: 2, senior: 8 } as const;
/** Les missions en régie, en équivalents temps plein : chaque jour passé est facturé. */
export const REGIE = { junior: 11, senior: 5 } as const;
/** Les quinze forfaits « dans les clous » : 97 % de réalisation. */
export const SAINS = { junior: 11, senior: 10, realisation: 0.97, frais: 25 } as const;
/** Les missions déjà signées qui démarrent en juin. */
export const CARNET_JUIN = { junior: 2, senior: 3, des: 9, realisation: 0.95, frais: 25 } as const;
/** Les propositions de mai, qui démarrent après l'Ascension : ce que la politique de prix fera signer. */
export const NOUVELLES = { junior: 10, senior: 6, des: 8, frais: 25 } as const;

/** Les trois forfaits qui dérapent : équipe, reste à faire estimé, jours vendus restants. */
export interface MissionEnDerapage {
  id: "kervalan" | "montlouvel" | "talvenec";
  juniors: number;
  seniors: number;
  /** Le reste à faire estimé par le chef de mission, en jours. */
  raf: number;
  /** Les jours vendus qui restent à produire : la valeur que la mission peut encore gagner. */
  vendusRestants: number;
  /** Frais de déplacement par jour passé, que le forfait ne rembourse pas. */
  frais: number;
}

export const MISSIONS: Record<MissionEnDerapage["id"], MissionEnDerapage> = {
  kervalan: { id: "kervalan", juniors: 4, seniors: 2, raf: 260, vendusRestants: 110, frais: 90 },
  montlouvel: {
    id: "montlouvel",
    juniors: 3,
    seniors: 2,
    raf: 150,
    vendusRestants: 80,
    frais: 35,
  },
  talvenec: { id: "talvenec", juniors: 4, seniors: 2, raf: 110, vendusRestants: 64, frais: 60 },
};
export const IDS = ["kervalan", "montlouvel", "talvenec"] as const;

/** Le TJM moyen de l'équipe d'une mission : celui auquel ses jours ont été vendus. */
export const tjmEquipe = (m: Pick<MissionEnDerapage, "juniors" | "seniors">) =>
  (m.juniors * TJM.junior + m.seniors * TJM.senior) / (m.juniors + m.seniors);
/** Le coût journalier moyen d'une équipe. */
export const coutEquipe = (m: Pick<MissionEnDerapage, "juniors" | "seniors">) =>
  (m.juniors * COUT_JOUR.junior + m.seniors * COUT_JOUR.senior) / (m.juniors + m.seniors);
/** Ce que la mission peut encore gagner : les jours vendus restants, au TJM de l'équipe. */
export const valeurRestante = (m: MissionEnDerapage) => m.vendusRestants * tjmEquipe(m);
/** La réalisation du reste à faire : jours vendus restants ÷ jours qu'il faudra. */
export const realisationRestante = (m: MissionEnDerapage) => m.vendusRestants / m.raf;
/** La marge à terminaison du reste à faire : valeur restante − coût des jours − frais. */
export const margeATerminaison = (m: MissionEnDerapage) =>
  valeurRestante(m) - m.raf * (coutEquipe(m) + m.frais);

/** Kervalan : les demandes du CHU hors cahier des charges, comprises dans le reste à faire. */
export const KERVALAN = {
  /** Le montant du marché, HT. */
  marche: 360000,
  /** La part du reste à faire qui sort du cahier des charges : deux sites, des entretiens en plus. */
  horsPerimetre: 0.25,
  /** Après un refus d'avenant, ce qu'on peut encore retirer : le hors-périmètre pas encore commencé. */
  apresRefus: 0.05,
  /** L'avenant que le cabinet peut chiffrer : 40 jours au TJM de l'équipe. */
  avenantJours: 40,
  /** La remise du schéma directeur au comité de pilotage : fin de la semaine 10. */
  echeance: 10,
  /** Un avenant signé repousse l'échéance d'une semaine. */
  echeanceAvenant: 11,
  /** Les pénalités de retard du CCAP, par jour calendaire. */
  penaliteJour: 400,
} as const;
export const AVENANT = KERVALAN.avenantJours * tjmEquipe(MISSIONS.kervalan);
/** Moins de 10 % du marché initial : une modification de faible montant, sans nouvelle mise en concurrence. */
export const PART_AVENANT = AVENANT / KERVALAN.marche;
/** L'acheteur du CHU signe l'avenant sept fois sur dix quand les demandes ont été tracées, trois sinon. */
export const CHANCE_AVENANT = { trace: 0.7, sansTrace: 0.3 } as const;
/** En retard, le CHU applique les pénalités sept fois sur dix. */
export const CHANCE_PENALITE = 0.7;

/** La revue des forfaits : recentrer chaque mission sur son cahier des charges. */
export const RECENTRAGE = 0.12;
/** Un renfort sur une mission en retard : ce qu'il fait avancer, et ce qu'il coûte aux managers. */
export const RENFORT = { efficacite: 0.25, coordination: 0.5, integration: 1.5 } as const;
export const RENFORTS = {
  /** D1 : le banc en renfort pour monter à 80 % d'occupation. */
  banc: { kervalan: 3, montlouvel: 2, talvenec: 1 },
  /** D2 : trois consultants de plus sur Kervalan. */
  kervalan: 3,
  /** D4 : quatre de plus sur Kervalan, pour la dernière ligne droite. */
  fin: 4,
} as const;

/** La Banque de l'Erdre demande trois consultants juniors en régie, des semaines 8 à 13. */
export const ERDRE = { juniors: 3, tjm: 650, contreProposition: 720, des: 8, chance: 0.4 } as const;

/** D3 : les politiques de prix des propositions de mai. */
export const POLITIQUES = [
  /** Relever les TJM de 6 %. */
  { volume: 0.65, tjm: 1.06, realisation: 0.86, dispersion: 0.06, frais: 25 },
  /** Chiffrer sur le réalisé, avec une provision pour aléas et des jalons. */
  { volume: 0.9, tjm: 1, realisation: 0.96, dispersion: 0.015, frais: 25 },
  /** Proposer en régie dès que le périmètre est flou. */
  { volume: 0.7, tjm: 1, realisation: 1, dispersion: 0, frais: 0 },
  /** Chiffrer comme d'habitude. */
  { volume: 1, tjm: 1, realisation: 0.86, dispersion: 0.06, frais: 25 },
] as const;

/** D5 : le déploiement chez Talvenec, des semaines 10 à 13. */
export const SUITE_TALVENEC = {
  juniors: 3,
  seniors: 1,
  des: 10,
  frais: 40,
  /** Trois sites au lieu d'un : 120 jours au réalisé de la phase 1. */
  besoin: 120,
  /** « Même prix » : les 60 jours vendus de la phase 1. */
  memePrix: 60,
  /** Rechiffré : 114 jours vendus, jalons de facturation compris. */
  rechiffre: 114,
} as const;
export const OFFRES_TALVENEC = [
  /** « Même équipe, même prix » : un déploiement plus large que la phase 1, au prix de la phase 1. */
  { realisation: 0.5, chance: 1, frais: 40 },
  /** Rechiffré sur le réalisé de la phase 1, avec des jalons. */
  { realisation: 0.95, chance: 0.7, frais: 40 },
  /** En régie. */
  { realisation: 1, chance: 0.35, frais: 0 },
  /** Décliner. */
  { realisation: 0, chance: 0, frais: 0 },
] as const;

/** D6 : la phase 2 de Kervalan, l'accompagnement à la mise en œuvre, à partir de la semaine 12. */
export const PHASE2 = {
  juniors: 4,
  seniors: 2,
  des: 12,
  frais: 90,
  /** Le budget du CHU, HT. */
  budget: 60000,
  /** Les jours qu'il faudrait pour tout le périmètre demandé, au réalisé de la phase 1. */
  besoin: 130,
  /** Les jours qu'il faut pour la tranche ferme recoupée : deux établissements sur quatre. */
  trancheFerme: 75,
} as const;
export const OFFRES_PHASE2 = [
  /** Au budget du CHU : le même périmètre pour la moitié des jours qu'il faudra. */
  { realisation: 0.55, chance: [1, 1], frais: 90 },
  /** En régie, par bons de commande. */
  { realisation: 1, chance: [0.6, 0.3], frais: 0 },
  /** Le périmètre recoupé au budget : une tranche ferme chiffrée sur le réalisé, le reste en option. */
  { realisation: 0.95, chance: [0.85, 0.55], frais: 90 },
  /** Décliner. */
  { realisation: 0, chance: [0, 0], frais: 0 },
] as const;

/* ---------------------------------------------------------------------------
 * LE MOIS DERNIER : mars, tel que Tempora l'a arrêté.
 * ------------------------------------------------------------------------- */
export const MOIS_DERNIER = {
  disponibles: 1500,
  regie: { passes: 320, factures: 320 },
  sains: { passes: 420, factures: 408 },
  kervalan: { passes: 120, factures: 60 },
  montlouvel: { passes: 100, factures: 55 },
  talvenec: { passes: 120, factures: 75 },
  /** Jours facturés par grade, et la même chose en mars de l'an dernier. */
  facturesJuniors: 556,
  facturesSeniors: 362,
  anDernier: { occupation: 0.66, realisation: 0.96, facturesJuniors: 634, facturesSeniors: 326 },
} as const;

export const MARS = (() => {
  const m = MOIS_DERNIER;
  const passes =
    m.regie.passes + m.sains.passes + m.kervalan.passes + m.montlouvel.passes + m.talvenec.passes;
  const factures =
    m.regie.factures +
    m.sains.factures +
    m.kervalan.factures +
    m.montlouvel.factures +
    m.talvenec.factures;
  const derive =
    m.kervalan.passes +
    m.montlouvel.passes +
    m.talvenec.passes -
    m.kervalan.factures -
    m.montlouvel.factures -
    m.talvenec.factures;
  const tjmMoyen = (j: number, s: number) => (j * TJM.junior + s * TJM.senior) / (j + s);
  return {
    passes,
    factures,
    nonFactures: passes - factures,
    /** La part des jours non facturés qui tient aux trois missions. */
    partDerive: derive / (passes - factures),
    occupation: passes / m.disponibles,
    realisation: factures / passes,
    facturation: factures / m.disponibles,
    tjm: tjmMoyen(m.facturesJuniors, m.facturesSeniors),
    tjmAnDernier: tjmMoyen(m.anDernier.facturesJuniors, m.anDernier.facturesSeniors),
    partJuniors: m.facturesJuniors / factures,
    partJuniorsAnDernier:
      m.anDernier.facturesJuniors / (m.anDernier.facturesJuniors + m.anDernier.facturesSeniors),
  };
})();

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les trois missions continuent leur hors-périmètre. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  marge: 0,
  kervalan: 1,
  prix: 2,
  banc: 3,
  talvenec: 4,
  phase2: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: {
    /** Seniors indisponibles, en équivalents temps plein. */
    seniors?: number;
    /** Seniors en moins jusqu'à la fin du trimestre (et leur salaire avec). */
    depart?: number;
    /** Régie suspendue, en équivalents temps plein. */
    regieJuniors?: number;
    regieSeniors?: number;
    /** Frais des missions en dépassement, et ce que leurs équipes avancent. */
    frais?: number;
    avancement?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "arret",
    titre: "Un manager en arrêt",
    de: "Ressources humaines",
    role: "Atlas Conseil, Nantes",
    texte:
      "Théophane Garrec, manager de la practice Data, est en arrêt maladie deux semaines. Ses deux missions en régie tournent sans lui ; il faut un manager pour les tenir.",
    duree: 2,
    effet: { seniors: 1 },
  },
  {
    id: "gel",
    titre: "Un client gèle sa régie",
    de: "Dariush Vahidi",
    role: "Associé, directeur commercial",
    texte:
      "Un distributeur régional gèle toutes ses dépenses de conseil quinze jours, le temps de son comité d'investissement : quatre consultants en régie reviennent au bureau.",
    duree: 2,
    effet: { regieJuniors: 3, regieSeniors: 1 },
  },
  {
    id: "depart",
    titre: "Une consultante senior part chez Halden Partners",
    de: "Ressources humaines",
    role: "Atlas Conseil, Nantes",
    texte:
      "Esmé Corvaisier, consultante senior, termine son préavis vendredi : elle rejoint Halden Partners. Elle n'est pas remplacée avant septembre.",
    duree: 13,
    effet: { depart: 1 },
  },
  {
    id: "greve",
    titre: "Grève des trains",
    de: "Évangéline Quilliec",
    role: "Manager, mission Kervalan",
    texte:
      "Grève des trains toute la semaine : les équipes partent en voiture de location, arrivent tard, et deux ateliers chez les clients sont décalés.",
    duree: 1,
    effet: { frais: 1.4, avancement: 0.85 },
  },
  {
    id: "qualiopi",
    titre: "Audit Qualiopi d'Atlas Formation",
    de: "Chiamaka Darrigade",
    role: "Associée fondatrice",
    texte:
      "L'auditeur Qualiopi passe la semaine chez Atlas Formation : deux seniors du bureau, formateurs référents, doivent être là toute la semaine.",
    duree: 1,
    effet: { seniors: 2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** La demande de régie de chaque semaine, rapportée à la moyenne. */
  regie: readonly number[];
  /** Le vrai reste à faire de chaque mission, rapporté à l'estimation. */
  raf: Readonly<Record<MissionEnDerapage["id"], number>>;
  /** Le taux de transformation des propositions de mai, rapporté au taux habituel. */
  transformation: number;
  /** La réalisation des nouveaux forfaits, en écarts-types. */
  ecartRealisation: number;
  uAvenant: number;
  uPenalite: number;
  uErdre: number;
  uTalvenec: number;
  uPhase2: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000667 + 7);
  const regie: number[] = [0];
  for (let i = 1; i <= SEMAINES; i += 1) {
    regie.push(Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r))));
  }
  const raf = {
    kervalan: Math.min(1.2, Math.max(0.85, 1 + 0.07 * gauss(r))),
    montlouvel: Math.min(1.2, Math.max(0.85, 1 + 0.07 * gauss(r))),
    talvenec: Math.min(1.2, Math.max(0.85, 1 + 0.07 * gauss(r))),
  };
  const transformation = Math.min(1.35, Math.max(0.65, 1 + 0.15 * gauss(r)));
  const ecartRealisation = Math.min(2, Math.max(-2, gauss(r)));
  const uAvenant = r();
  const uPenalite = r();
  const uErdre = r();
  const uTalvenec = r();
  const uPhase2 = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    regie,
    raf,
    transformation,
    ecartRealisation,
    uAvenant,
    uPenalite,
    uErdre,
    uTalvenec,
    uPhase2,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Les demandes hors périmètre de Kervalan ont-elles été tracées (revue en semaine 1) ? */
export const horsPerimetreTrace = (chemin: readonly number[]) =>
  chemin[D.marge] === 1 || chemin[D.marge] === 2;
export const chanceAvenant = (chemin: readonly number[]) =>
  horsPerimetreTrace(chemin) ? CHANCE_AVENANT.trace : CHANCE_AVENANT.sansTrace;
export const avenantSigne = (chemin: readonly number[], graine: number) =>
  chemin[D.kervalan] === 1 && hasard(graine).uAvenant < chanceAvenant(chemin);
/** La Banque de l'Erdre accepte-t-elle le TJM catalogue ? */
export const erdreAccepteCatalogue = (graine: number) => hasard(graine).uErdre < ERDRE.chance;
export const talvenecAccepte = (option: number, graine: number) =>
  hasard(graine).uTalvenec < OFFRES_TALVENEC[option]!.chance;

export type Semaine = {
  /** Jours staffés ÷ jours disponibles des consultants du bureau. */
  occupation: number;
  /** Jours facturés ÷ jours passés sur les missions. */
  realisation: number;
  /** Jours facturés ÷ jours disponibles. */
  facturation: number;
  /** Honoraires ÷ jours facturés. */
  tjm: number;
  honoraires: number;
  salaires: number;
  freelance: number;
  frais: number;
  penalites: number;
  marge: number;
  passes: number;
  factures: number;
  /** Les jours passés sur les trois missions en dépassement, et ce qu'ils ont facturé. */
  passesDerive: number;
  facturesDerive: number;
  /** Les consultants sur le banc, en équivalents temps plein. */
  banc: number;
  /** Les jours pris en freelance, faute de consultants libres. */
  joursFreelance: number;
  bancJuniors: number;
  bancSeniors: number;
  /** Le reste à faire de Kervalan en fin de semaine, en jours. */
  rafKervalan: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge des missions du bureau sur le trimestre, en euros. */
  objectif: number;
  honoraires: number;
  salaires: number;
  freelance: number;
  frais: number;
  penalites: number;
  passes: number;
  factures: number;
  nonFactures: number;
  realisation: number;
  occupation: number;
  /** La semaine où chaque mission en dépassement se termine (fractionnaire ; 14 : pas finie). */
  fin: Readonly<Record<MissionEnDerapage["id"], number>>;
  kervalanEnRetard: boolean;
  penalitesAppliquees: boolean;
  avenant: "signe" | "refuse" | null;
  erdre: "catalogue" | "refuse" | "accepte" | null;
  talvenec: "accepte" | "refuse" | null;
  phase2: "accepte" | "refuse" | null;
  /** Le taux de réalisation de mars, en % : ce que la prévision demande. */
  realisationMars: number;
}

/** La relation avec le CHU, quand la phase 2 se décide : tendue si le schéma directeur a été remis en retard. */
export const relationTendue = (finKervalan: number, echeance: number) => finKervalan > echeance;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as [number, number, number, number, number, number];
  const signe = avenantSigne(chemin, graine);
  const politique = POLITIQUES[d3] ?? POLITIQUES[3];
  const realNouvelles = Math.min(
    1,
    Math.max(0.6, politique.realisation + politique.dispersion * h.ecartRealisation),
  );
  const erdre: Trimestre["erdre"] =
    d4 === 1
      ? "accepte"
      : d4 === 2
        ? erdreAccepteCatalogue(graine)
          ? "catalogue"
          : "refuse"
        : null;
  const talvenec: Trimestre["talvenec"] =
    d5 === 3 ? null : talvenecAccepte(d5, graine) ? "accepte" : "refuse";

  // Les missions en dépassement : reste à faire réel, valeur restante, renforts.
  const etat = Object.fromEntries(
    IDS.map((id) => {
      const m = MISSIONS[id];
      return [
        id,
        {
          raf: m.raf * h.raf[id],
          valeur: valeurRestante(m),
          juniors: m.juniors,
          seniors: m.seniors,
          renforts: 0,
          nouveaux: 0,
          fin: 14,
        },
      ];
    }),
  ) as Record<
    MissionEnDerapage["id"],
    {
      raf: number;
      valeur: number;
      juniors: number;
      seniors: number;
      renforts: number;
      nouveaux: number;
      fin: number;
    }
  >;
  if (signe) etat.kervalan.valeur += AVENANT;
  const echeance = signe ? KERVALAN.echeanceAvenant : KERVALAN.echeance;

  let phase2: Trimestre["phase2"] = null;
  let accepteeP2 = false;
  let seniors = SENIORS;
  const semaines: (Semaine | null)[] = [null];
  let penalitesAppliquees = false;
  let kervalanEnRetard = false;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const d = dispo(w);
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    // Les effets des imprévus en cours : des équivalents temps plein qui s'ajoutent, ou des facteurs.
    const effet = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x + (a.imprevu.effet[k] ?? 0), 0);
    const facteur = (k: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[k] ?? 1), 1);
    for (const a of h.imprevus) if (a.imprevu.effet.depart && w === a.semaine) seniors -= 1;

    // Les décisions qui touchent les missions en dépassement, au moment où elles prennent effet.
    const ajouter = (id: MissionEnDerapage["id"], n: number) => {
      if (etat[id].fin <= w - 1) return;
      etat[id].renforts += n;
      etat[id].nouveaux += n;
    };
    if (w === 2) {
      if (d1 === 0) for (const id of IDS) ajouter(id, RENFORTS.banc[id]);
      if (d1 === 1) for (const id of IDS) etat[id].raf *= 1 - RECENTRAGE;
      if (d1 === 2) etat.kervalan.raf *= 1 - RECENTRAGE;
    }
    if (w === 4) {
      if (d2 === 0) ajouter("kervalan", RENFORTS.kervalan);
      // Recentrer sans négocier : on cesse le hors-périmètre tout de suite.
      if (d2 === 2) etat.kervalan.raf *= 1 - KERVALAN.horsPerimetre;
    }
    // L'avenant refusé : le CHU exige qu'on finisse le hors-périmètre déjà engagé ; on ne recentre que le reste.
    if (w === 5 && d2 === 1 && !signe) etat.kervalan.raf *= 1 - KERVALAN.apresRefus;
    if (w === 8 && d4 === 0) ajouter("kervalan", RENFORTS.fin);
    if (w === 12) {
      const tendue = relationTendue(etat.kervalan.fin, echeance);
      const offre = OFFRES_PHASE2[d6]!;
      accepteeP2 = d6 !== 3 && h.uPhase2 < offre.chance[tendue ? 1 : 0]!;
      phase2 = d6 === 3 ? null : accepteeP2 ? "accepte" : "refuse";
    }

    // Les missions en dépassement avancent au rythme du client.
    let honoraires = 0;
    let passes = 0;
    let factures = 0;
    let frais = 0;
    let penalites = 0;
    let passesDerive = 0;
    let facturesDerive = 0;
    const derive = { junior: 0, senior: 0 };
    for (const id of IDS) {
      const e = etat[id];
      const m = MISSIONS[id];
      if (e.raf <= 1e-9) {
        e.renforts = 0;
        continue;
      }
      const equipe = e.juniors + e.seniors;
      const avance =
        equipe * d * facteur("avancement") +
        e.renforts * d * RENFORT.efficacite -
        e.renforts * RENFORT.coordination -
        e.nouveaux * RENFORT.integration;
      e.nouveaux = 0;
      const progres = Math.max(0.2 * equipe * d, avance);
      const part = Math.min(1, e.raf / progres);
      const gagne = e.valeur * Math.min(1, progres / e.raf);
      const jours = (equipe + e.renforts) * d * part;
      e.valeur -= gagne;
      e.raf -= progres * part;
      if (e.raf <= 1e-6) {
        e.raf = 0;
        e.fin = w - 1 + part;
      }
      honoraires += gagne;
      passes += jours;
      passesDerive += jours;
      const facturesM = gagne / tjmEquipe(m);
      factures += facturesM;
      facturesDerive += facturesM;
      frais += jours * m.frais * facteur("frais");
      derive.junior += (e.juniors + e.renforts) * part;
      derive.senior += e.seniors * part;
    }
    // Kervalan : le retard sur la remise au comité, et les pénalités du CCAP.
    const k = etat.kervalan;
    const finie = k.fin <= SEMAINES;
    if ((finie && w === Math.ceil(k.fin)) || (!finie && w === SEMAINES)) {
      const retard = Math.max(0, (finie ? k.fin : SEMAINES) - echeance);
      if (retard > 0) {
        kervalanEnRetard = true;
        if (h.uPenalite < CHANCE_PENALITE) {
          penalitesAppliquees = true;
          penalites += retard * 7 * KERVALAN.penaliteJour;
        }
      }
    }

    // Ce que les clients demandent, segment par segment, en équivalents temps plein.
    const segments: {
      junior: number;
      senior: number;
      tjm: number;
      realisation: number;
      frais: number;
      tjmJunior?: number;
    }[] = [
      {
        junior: Math.max(0, REGIE.junior * h.regie[w]! - effet("regieJuniors")),
        senior: Math.max(0, REGIE.senior * h.regie[w]! - effet("regieSeniors")),
        tjm: 1,
        realisation: 1,
        frais: 0,
      },
      {
        junior: SAINS.junior,
        senior: SAINS.senior,
        tjm: 1,
        realisation: SAINS.realisation,
        frais: SAINS.frais,
      },
    ];
    if (w >= CARNET_JUIN.des) {
      segments.push({
        junior: CARNET_JUIN.junior,
        senior: CARNET_JUIN.senior,
        tjm: 1,
        realisation: CARNET_JUIN.realisation,
        frais: CARNET_JUIN.frais,
      });
    }
    if (w >= NOUVELLES.des) {
      const v = politique.volume * h.transformation;
      segments.push({
        junior: NOUVELLES.junior * v,
        senior: NOUVELLES.senior * v,
        tjm: politique.tjm,
        realisation: realNouvelles,
        frais: politique.frais,
      });
    }
    if (w >= ERDRE.des && (erdre === "accepte" || erdre === "catalogue")) {
      segments.push({
        junior: ERDRE.juniors,
        senior: 0,
        tjm: 1,
        tjmJunior: erdre === "accepte" ? ERDRE.tjm : ERDRE.contreProposition,
        realisation: 1,
        frais: 0,
      });
    }
    if (w >= SUITE_TALVENEC.des && talvenec === "accepte") {
      const o = OFFRES_TALVENEC[d5]!;
      segments.push({
        junior: SUITE_TALVENEC.juniors,
        senior: SUITE_TALVENEC.seniors,
        tjm: 1,
        realisation: o.realisation,
        frais: o.frais,
      });
    }
    if (w >= PHASE2.des && accepteeP2) {
      const o = OFFRES_PHASE2[d6]!;
      segments.push({
        junior: PHASE2.juniors,
        senior: PHASE2.seniors,
        tjm: 1,
        realisation: o.realisation,
        frais: o.frais,
      });
    }

    // Qui les staffe : les consultants libres d'abord, Freelancia pour ce qui manque.
    const staffables = {
      junior: JUNIORS - INTERNES.junior,
      senior: seniors - INTERNES.senior - effet("seniors"),
    };
    const demande = {
      junior: segments.reduce((x, s) => x + s.junior, 0),
      senior: segments.reduce((x, s) => x + s.senior, 0),
    };
    const libres = {
      junior: Math.max(0, staffables.junior - derive.junior),
      senior: Math.max(0, staffables.senior - derive.senior),
    };
    const propres = {
      junior: Math.min(demande.junior, libres.junior),
      senior: Math.min(demande.senior, libres.senior),
    };
    const manque = {
      junior: demande.junior - propres.junior,
      senior: demande.senior - propres.senior,
    };
    const freelance = (manque.junior * FREELANCE.junior + manque.senior * FREELANCE.senior) * d;
    for (const s of segments) {
      const valeur =
        (s.junior * (s.tjmJunior ?? TJM.junior * s.tjm) + s.senior * TJM.senior * s.tjm) * d;
      const jours = (s.junior + s.senior) * d;
      honoraires += valeur * s.realisation;
      passes += jours;
      factures += jours * s.realisation;
      frais += jours * s.frais;
    }

    const salaires = salairesSemaine(seniors);
    const perte = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    const effectif = JUNIORS + seniors;
    const staffes = derive.junior + derive.senior + propres.junior + propres.senior;
    semaines.push({
      occupation: staffes / effectif,
      realisation: factures / passes,
      facturation: (factures / passes) * (staffes / effectif),
      tjm: honoraires / factures,
      honoraires,
      salaires,
      freelance,
      frais,
      penalites,
      marge: honoraires - salaires - freelance - frais - penalites - perte,
      passes,
      factures,
      passesDerive,
      facturesDerive,
      banc: libres.junior - propres.junior + libres.senior - propres.senior,
      joursFreelance: (manque.junior + manque.senior) * d,
      bancJuniors: libres.junior - propres.junior,
      bancSeniors: libres.senior - propres.senior - manque.senior,
      rafKervalan: etat.kervalan.raf,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const somme = (f: (x: Semaine) => number) => pleines.reduce((t, x) => t + f(x), 0);
  const passes = somme((x) => x.passes);
  const factures = somme((x) => x.factures);
  const dispoTotal = pleines.reduce((t, _, i) => t + dispo(i + 1), 0);
  return {
    semaines,
    objectif: somme((x) => x.marge),
    honoraires: somme((x) => x.honoraires),
    salaires: somme((x) => x.salaires),
    freelance: somme((x) => x.freelance),
    frais: somme((x) => x.frais),
    penalites: somme((x) => x.penalites),
    passes,
    factures,
    nonFactures: passes - factures,
    realisation: factures / passes,
    occupation: pleines.reduce((t, x, i) => t + x.occupation * dispo(i + 1), 0) / dispoTotal,
    fin: {
      kervalan: etat.kervalan.fin,
      montlouvel: etat.montlouvel.fin,
      talvenec: etat.talvenec.fin,
    },
    kervalanEnRetard,
    penalitesAppliquees,
    avenant: d2 === 1 ? (signe ? "signe" : "refuse") : null,
    erdre,
    talvenec,
    phase2,
    realisationMars: Math.round(MARS.realisation * 1000) / 10,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, fins de mission, pénalités, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const finK = Math.ceil(t.fin.kervalan);
  return {
    avenant: t.avenant !== null && dans(4),
    finTalvenec: t.fin.talvenec <= SEMAINES && dans(Math.ceil(t.fin.talvenec)),
    finMontlouvel: t.fin.montlouvel <= SEMAINES && dans(Math.ceil(t.fin.montlouvel)),
    finKervalan: t.fin.kervalan <= SEMAINES && dans(finK),
    penalites: t.penalitesAppliquees && dans(Math.min(SEMAINES, finK)),
    phase2: t.phase2 !== null && dans(12),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureBureau {
  occupation: number | null;
  realisation: number | null;
  tjm: number | null;
  marge: number | null;
  nonFactures: number | null;
  /** La marge budgétée à date, pour la jauge. */
  budgetADate: number | null;
  freelance: number | null;
  banc: number | null;
  bancJuniors: number | null;
  /** Le reste à faire de Kervalan, en jours. */
  rafKervalan: number | null;
  /** La semaine où Kervalan a été remis au comité, si c'est fait ; 0 sinon. */
  finKervalan: number | null;
  /** La semaine du comité final de Kervalan : 10, ou 11 avec l'avenant. */
  echeanceKervalan: number | null;
  realisationDerive: number | null;
}

/** La marge des missions budgétée pour le trimestre : 75 % d'occupation, 95 % de réalisation. */
export const BUDGET_MARGE = 520000;

/** Ce que Clélia lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureBureau {
  if (semaine === 0) {
    return {
      occupation: MARS.occupation,
      realisation: MARS.realisation,
      tjm: MARS.tjm,
      marge: 0,
      nonFactures: 0,
      budgetADate: 0,
      freelance: 0,
      banc: 12,
      bancJuniors: 10,
      rafKervalan: MISSIONS.kervalan.raf,
      finKervalan: 0,
      echeanceKervalan: KERVALAN.echeance,
      realisationDerive:
        (MOIS_DERNIER.kervalan.factures +
          MOIS_DERNIER.montlouvel.factures +
          MOIS_DERNIER.talvenec.factures) /
        (MOIS_DERNIER.kervalan.passes +
          MOIS_DERNIER.montlouvel.passes +
          MOIS_DERNIER.talvenec.passes),
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const ecoulees = t.semaines.slice(1, semaine + 1) as Semaine[];
  const cumul = (f: (x: Semaine) => number) => ecoulees.reduce((x, w) => x + f(w), 0);
  const s = t.semaines[semaine]!;
  const dispoADate = ecoulees.reduce((x, _, i) => x + dispo(i + 1), 0);
  const dispoTotal = Array.from({ length: SEMAINES }, (_, i) => dispo(i + 1)).reduce(
    (x, v) => x + v,
    0,
  );
  return {
    occupation: s.occupation,
    realisation: s.realisation,
    tjm: s.tjm,
    marge: cumul((x) => x.marge),
    nonFactures: cumul((x) => x.passes - x.factures),
    budgetADate: (BUDGET_MARGE * dispoADate) / dispoTotal,
    freelance: cumul((x) => x.freelance),
    banc: s.banc,
    bancJuniors: s.bancJuniors,
    rafKervalan: s.rafKervalan,
    finKervalan: t.fin.kervalan <= semaine ? t.fin.kervalan : 0,
    echeanceKervalan: avenantSigne(chemin, graine) ? KERVALAN.echeanceAvenant : KERVALAN.echeance,
    realisationDerive: s.passesDerive > 0 ? s.facturesDerive / s.passesDerive : null,
  };
}
