/**
 * LE CONSULTANT STAR — le modèle de l'équipe Data et SI du bureau de Bordeaux.
 *
 * Atlas Conseil, practice Data et systèmes d'information, avril à juin.
 * Philippine Darras manage sept personnes : Maximilien Harismendy, consultant
 * senior adoré de ses clients (la Banque Dauriac, Lagrave Aérostructures),
 * deux consultants et quatre analystes. Maximilien fait 30 % du chiffre de
 * l'équipe ; il relit les livrables des analystes en les humiliant, garde le
 * travail pour lui et domine les réunions. Trois mécanismes font l'épisode,
 * et le joueur doit les découvrir :
 *
 *   · CE QU'ON TOLÈRE SE PAIE EN JUNIORS. Le comportement de Maximilien pèse
 *     sur l'engagement des analystes ; l'engagement pèse sur le taux de
 *     réalisation (les jours refaits ne se facturent pas) et sur les départs.
 *     Trois analystes de ses missions ont chacun un moment où ils peuvent
 *     démissionner (semaines 4, 10 et 12) : le départ tombe ou non selon le
 *     hasard, avec un risque qui suit l'engagement. Un départ est provisionné
 *     dès la démission : 22 k€ (cabinet, poste vacant, montée en compétence).
 *     Et parce qu'il garde le travail, ses analystes ne sont staffés qu'à
 *     55 % quand le plan vendu au client en prévoyait 85 % : le temps d'un
 *     consultant ne se stocke pas, chaque jour vendu et non consommé est perdu.
 *   · UN RECADRAGE TIENT AUX FAITS. Un entretien fondé sur des faits datés,
 *     leur effet, des attentes explicites et un suivi change le comportement
 *     quatre fois sur cinq ; un reproche général (« fais attention à ton
 *     ton »), une fois sur quatre. Sous la pression d'un comité, l'ancien
 *     comportement revient (semaine 7) : un écart laissé sans réponse redevient
 *     la norme, un écart repris avec le fait précis se referme.
 *   · SE SÉPARER DU TALENT COÛTE LES CLIENTS. Lui retirer ses clients phares,
 *     ou le mettre sous avertissement écrit, le fait partir chez Halden
 *     Partners, et la Banque Dauriac le suit : la mission s'arrête deux
 *     semaines plus tard, ses deux analystes passent en intercontrat, et le
 *     compte perdu se compte (la marge des deux trimestres suivants).
 *
 * Un quatrième ressort récompense le recadrage réussi : un RÔLE DE MENTOR
 * encadré transforme la situation (engagement, délégation) quand Maximilien a
 * changé, et l'aggrave sinon. Son goût pour la transmission est inconnu :
 * un essai limité le révèle avant de s'engager.
 *
 * Le trimestre est jugé en euros : la marge de l'équipe (honoraires facturés
 * moins salaires chargés, indépendants et mesures) moins le coût des départs
 * (recrutement, intercontrat, clients perdus). Recadrer n'y est pas une vertu
 * morale, c'est un calcul : fermer les yeux coûte les juniors, écarter le
 * talent coûte les clients.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les jours ouvrés de chaque semaine, du lundi 6 avril au vendredi 3 juillet : Pâques, 1er et 8 mai, Ascension, Pentecôte. */
export const JOURS_OUVRES = [0, 4, 5, 5, 4, 4, 4, 5, 4, 5, 5, 5, 5, 5] as const;
export const TOTAL_JOURS_OUVRES = JOURS_OUVRES.reduce<number>((s, j) => s + j, 0);

/** Les sept de l'équipe. */
export const P = {
  maximilien: 0,
  ilham: 1,
  ylan: 2,
  gaetane: 3,
  selim: 4,
  morgane: 5,
  liam: 6,
} as const;

export interface Personne {
  nom: string;
  role: string;
  /** Taux journalier moyen facturé, en euros. */
  tjm: number;
  /** Salaire annuel brut, en euros. */
  salaire: number;
  /** Sa mission : celles de Maximilien, ou une autre de la practice. */
  mission: "dauriac" | "lagrave" | "autre";
}

export const EQUIPE: readonly Personne[] = [
  {
    nom: "Maximilien Harismendy",
    role: "Consultant senior",
    tjm: 1150,
    salaire: 78000,
    mission: "dauriac",
  },
  { nom: "Ilham Mebarki", role: "Analyste", tjm: 700, salaire: 42000, mission: "dauriac" },
  { nom: "Neven Gloaguen", role: "Analyste", tjm: 700, salaire: 42000, mission: "dauriac" },
  { nom: "Gaëtane Nakamura", role: "Analyste", tjm: 700, salaire: 42000, mission: "lagrave" },
  { nom: "Peio Larrieu", role: "Consultant", tjm: 900, salaire: 54000, mission: "lagrave" },
  { nom: "Morgane Tastet", role: "Consultante", tjm: 900, salaire: 54000, mission: "autre" },
  { nom: "Liam Capdevielle", role: "Analyste", tjm: 700, salaire: 42000, mission: "autre" },
];

/** Charges patronales comprises : le salaire chargé vaut une fois et demie le brut. */
export const CHARGES = 1.5;
/** Jours ouvrés par an et par consultant. */
export const JOURS_PAR_AN = 210;
export const MASSE_SALARIALE_ANNUELLE = EQUIPE.reduce((s, p) => s + p.salaire * CHARGES, 0);
/** Les salaires ne dépendent pas du carnet : un treizième de trimestre par semaine. */
export const SALAIRES_SEMAINE = MASSE_SALARIALE_ANNUELLE / 52;

/** Taux d'occupation de Maximilien : il facture presque tout son temps. */
export const OCCUPATION_STAR = 0.95;
/** Ce que le plan de staffing vendu aux clients prévoyait pour ses analystes. */
export const OCCUPATION_VENDUE = 0.85;
/** Ce que Tempora montre : il garde le travail, ses analystes ne sont staffés qu'à 55 %. */
export const OCCUPATION_BASSE = 0.55;
/** Le reste de la practice : analystes et consultants des autres missions. */
export const OCCUPATION_AUTRES = 0.8;
/** La cible d'Atlas Conseil pour ses consultants. */
export const OCCUPATION_CIBLE = 0.75;

/** Ce que coûte un départ d'analyste, tel que le contrôle de gestion le compte. */
export const DEPART = {
  /** Honoraires du cabinet de recrutement, en part du salaire annuel brut. */
  cabinet: 0.2,
  /** Jours ouvrés entre le départ et l'arrivée du remplaçant. */
  vacance: 20,
  /** Premiers jours du remplaçant, non facturables. */
  integration: 15,
  /** Occupation d'un analyste de la practice, qui fait le chiffre perdu. */
  occupation: 0.8,
} as const;
/** Le coût salarial d'un jour ouvré d'analyste, charges comprises : 300 €. */
export const COUT_JOUR_ANALYSTE = (42000 * CHARGES) / JOURS_PAR_AN;
export const COUT_DEPART_ANALYSTE =
  DEPART.cabinet * 42000 +
  DEPART.vacance * (700 * DEPART.occupation - COUT_JOUR_ANALYSTE) +
  DEPART.integration * 700 * DEPART.occupation;
/** Le départ de Maximilien : le cabinet (25 % de son brut), et le compte de la Banque Dauriac. */
export const COUT_RECRUTEMENT_SENIOR = 0.25 * 78000;
/** La marge des deux trimestres suivants sur la Banque Dauriac, perdue avec le compte. */
export const VALEUR_COMPTE_DAURIAC = 40000;

/** Le budget de marge de l'équipe sur le trimestre. */
export const BUDGET = 90000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un livrable réécrit de plus, deux jours d'analyste non facturés. */
export const PERTE_PAR_JOUR = 1400;

export const ENGAGEMENT_DEPART = 44;
/** Au-dessous, le baromètre interne alerte. */
export const SEUIL_ENGAGEMENT = 60;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  maximilien: 0,
  ilham: 1,
  lot: 2,
  mentor: 3,
  rechute: 4,
  copil: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [0, 0, 0, 3, 0, 0] as const;

export const COUTS = {
  /** La prime proposée à Ilham pour finir la mission. */
  prime: 2000,
  /** Une journée de Philippine, manager facturée 1 100 €, pour l'essai du mentorat. */
  essai: 1100,
  /** Ce que la Banque Dauriac fait reprendre après une restitution sans Maximilien. */
  reprise: 2100,
} as const;

/** L'indépendant de Freelancia que Maximilien veut sur le lot 2 : acheté 650 €, revendu 800 €. */
export const FREELANCE = { achat: 650, vente: 800, jours: 4 } as const;

/** Probabilités. */
export const CHANCES = {
  /** Qu'un recadrage fondé sur des faits change le comportement. */
  recadrageFactuel: 0.8,
  /** Qu'un reproche général le change. */
  reprocheGeneral: 0.25,
  /** Qu'un mentorat réussisse, Maximilien ayant changé ; ou non. */
  mentorChange: 0.7,
  mentorSansRecadrage: 0.15,
  /** Que la Banque Dauriac accepte une équipe sans Maximilien sur le lot 2. */
  banqueAccepte: 0.45,
  /** Que l'écart du comité se referme quand on le reprend avec le fait. */
  repriseApresChangement: 0.9,
  repriseSansChangement: 0.6,
  avertissement: 0.85,
} as const;

/** Le risque que Maximilien parte chez Halden Partners, selon ce qu'on lui fait. */
export const RISQUES_HALDEN = {
  retire: 0.75,
  recadre: 0.06,
  lotSansLui: 0.1,
  avertissement: 0.3,
  retireLagrave: 0.55,
  copilSansLui: 0.15,
} as const;

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
    /** Occupation des deux personnes des autres missions. */
    autres?: number;
    /** Occupation sur la mission Lagrave (Maximilien y passe deux jours sur cinq). */
    lagrave?: number;
    /** Morgane absente. */
    morgane?: number;
    /** Maximilien pris par une avant-vente. */
    maximilien?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "marche",
    titre: "Un marché public notifié en retard",
    de: "Achats Publics de l'Ouest",
    role: "Centrale d'achat",
    texte:
      "La notification du marché de la métropole est repoussée d'une semaine : Morgane et Liam, qui devaient démarrer lundi, sont en intercontrat.",
    duree: 1,
    effet: { autres: 0.3 },
  },
  {
    id: "arret",
    titre: "Morgane en arrêt maladie",
    de: "Énora Bidegain",
    role: "Ressources humaines, bureau de Bordeaux",
    texte: "Morgane Tastet est en arrêt maladie pour deux semaines.",
    duree: 2,
    effet: { morgane: 0 },
  },
  {
    id: "gel",
    titre: "Lagrave gèle ses dépenses de conseil",
    de: "Mayeul Oyarzabal",
    role: "DSI, Lagrave Aérostructures",
    texte:
      "Clôture semestrielle oblige, la direction financière gèle toutes les dépenses de conseil une semaine. Merci de suspendre les ateliers.",
    duree: 1,
    effet: { lagrave: 0.2 },
  },
  {
    id: "avant-vente",
    titre: "Une avant-vente du bureau de Paris",
    de: "Bureau de Paris",
    role: "Practice Data et SI",
    texte:
      "Paris a besoin de Maximilien trois jours pour une proposition commerciale à remettre vendredi : du temps non facturable.",
    duree: 1,
    effet: { maximilien: 0.35 },
  },
  {
    id: "renfort",
    titre: "Nantes demande un renfort",
    de: "Bureau de Nantes",
    role: "Practice Data et SI",
    texte:
      "Une mission de Nantes manque d'un analyste deux semaines : Liam part en renfort, facturé à temps plein.",
    duree: 2,
    effet: { autres: 1.12 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  engagement: number;
  occupation: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le recadrage de la semaine 1 change-t-il Maximilien ? */
  uRecadrage: number;
  /** Son goût pour la transmission : le mentorat réussit-il ? */
  uMentor: number;
  /** La Banque Dauriac accepte-t-elle une équipe sans lui ? */
  uBanque: number;
  /** L'écart du comité Lagrave se referme-t-il ? */
  uReprise: number;
  /** Les démissions d'Ilham (sem. 4), de Gaëtane (sem. 10), d'Neven (sem. 12). */
  uIlham: number;
  uGaetane: number;
  uYlan: number;
  /** Les tentations de Halden, une par décision qui le froisse. */
  uHalden: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000697 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      engagement: 1.5 * gauss(r),
      occupation: Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))),
    });
  }
  const uRecadrage = r();
  const uMentor = r();
  const uBanque = r();
  const uReprise = r();
  const uIlham = r();
  const uGaetane = r();
  const uYlan = r();
  const uHalden = [r(), r(), r(), r(), r(), r()];
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    semaines,
    uRecadrage,
    uMentor,
    uBanque,
    uReprise,
    uIlham,
    uGaetane,
    uYlan,
    uHalden,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUE LES DÉCISIONS DÉCLENCHENT, SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Le recadrage de la semaine 1 a-t-il changé Maximilien ? */
export function maximilienChange(chemin: readonly number[], graine: number): boolean {
  const u = hasard(graine).uRecadrage;
  if (chemin[D.maximilien] === 1) return u < CHANCES.recadrageFactuel;
  if (chemin[D.maximilien] === 2) return u < CHANCES.reprocheGeneral;
  return false;
}

/** La Banque Dauriac accepte-t-elle que Peio mène le lot 2 sans Maximilien ? */
export const banqueAccepte = (graine: number) => hasard(graine).uBanque < CHANCES.banqueAccepte;

/** La chance que le mentorat réussisse : il faut que Maximilien ait changé, et qu'il aime transmettre. */
export const chanceDuMentorat = (change: boolean) =>
  change ? CHANCES.mentorChange : CHANCES.mentorSansRecadrage;

/** Le risque de démission d'un analyste, lu sur l'engagement de l'équipe et ce qui le touche, lui. */
export const risqueDeDepart = (engagement: number, propre: number) =>
  Math.min(0.9, Math.max(0, (60 - engagement) / 22 + propre));

export type Semaine = {
  /** La marge de la semaine : honoraires moins salaires et achats. */
  marge: number;
  /** La marge cumulée, départs déduits. */
  cumul: number;
  /** Ce qui compte pour l'objectif cette semaine : marge moins départs. */
  contribution: number;
  /** Taux d'occupation de l'équipe. */
  occupation: number;
  /** Taux d'occupation des analystes de ses missions. */
  occupationJuniors: number;
  /** Baromètre d'engagement des analystes, sur 100. */
  engagement: number;
  /** Le comportement de Maximilien : 1, comme aujourd'hui ; 0, corrigé. */
  comportement: number;
  /** Démissions cumulées dans l'équipe. */
  departs: number;
  /** Coût des départs cumulé. */
  coutDeparts: number;
  /** Le risque de démission du prochain analyste exposé. */
  risque: number;
  honoraires: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge de l'équipe sur le trimestre, moins le coût des départs. */
  objectif: number;
  marge: number;
  coutDeparts: number;
  change: boolean;
  /** La semaine où Maximilien annonce son départ chez Halden, ou `null`. */
  halden: number | null;
  /** La semaine de démission de chaque analyste exposé, ou `null`. */
  ilham: number | null;
  gaetane: number | null;
  ylan: number | null;
  mentorat: "maximilien" | "selim" | null;
  /** L'essai du mentorat a-t-il été concluant ? `null` sans essai. */
  essaiConcluant: boolean | null;
  banque: boolean | null;
  repriseReussie: boolean | null;
  occupationMoyenne: number;
  occupationJuniorsMoyenne: number;
  engagementFinal: number;
  departs: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const change = maximilienChange(chemin, graine);
  const accepte = d3 === 2 ? banqueAccepte(graine) : null;
  /** Le lot 2 : avec un indépendant (Maximilien l'a staffé), en pyramide, ou mené par Peio. */
  const lot: "freelance" | "pyramide" | "selim" =
    d3 === 1 ? "pyramide" : d3 === 2 && accepte ? "selim" : "freelance";

  // Maximilien part-il chez Halden ? Le premier risque qui tombe l'emporte.
  const risques: [number, number][] = [];
  if (d1 === 3) risques.push([3, RISQUES_HALDEN.retire]);
  if (d1 === 1) risques.push([3, RISQUES_HALDEN.recadre]);
  if (d3 === 2) risques.push([5, RISQUES_HALDEN.lotSansLui]);
  if (d5 === 2) risques.push([9, RISQUES_HALDEN.avertissement]);
  if (d5 === 3) risques.push([9, RISQUES_HALDEN.retireLagrave]);
  if (d6 === 2) risques.push([12, RISQUES_HALDEN.copilSansLui]);
  let halden: number | null = null;
  for (let i = 0; i < risques.length && halden === null; i += 1) {
    const [semaine, p] = risques[i]!;
    if (h.uHalden[i]! < p) halden = semaine;
  }
  const parti = (w: number) => halden !== null && w > halden;
  /** La Banque Dauriac suit Maximilien deux semaines après son annonce. */
  const dauriacPerdue = (w: number) => halden !== null && w >= halden + 2;

  // Le mentorat : direct, après essai, confié à Peio, ou rien.
  const uMentor = h.uMentor;
  let mentorat: "maximilien" | "selim" | null = null;
  let debutMentorat = 99;
  let essaiConcluant: boolean | null = null;
  let mentorReussi = false;
  if (d4 === 0) {
    mentorat = "maximilien";
    debutMentorat = 7;
  } else if (d4 === 1) {
    essaiConcluant = uMentor < chanceDuMentorat(change);
    mentorat = essaiConcluant ? "maximilien" : "selim";
    debutMentorat = 9;
  } else if (d4 === 2) {
    mentorat = "selim";
    debutMentorat = 7;
  }
  if (mentorat === "maximilien") mentorReussi = uMentor < chanceDuMentorat(change);

  const semaines: (Semaine | null)[] = [null];
  let comportement = 1;
  let delegation = 0;
  let engagement = ENGAGEMENT_DEPART;
  let cumul = 0;
  let coutDeparts = 0;
  let departs = 0;
  const pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let ilham: number | null = null;
  let gaetane: number | null = null;
  let ylan: number | null = null;
  let repriseReussie: boolean | null = null;
  let avantRechute = 1;
  let marge = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const jo = JOURS_OUVRES[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const effet = (cle: keyof Imprevu["effet"]) =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[cle] ?? 1), 1);

    // Le comportement de Maximilien : ce que le recadrage en a fait, et la rechute du comité.
    let cible = 1;
    if (d1 === 1) cible = change ? 0.3 : 0.85;
    if (d1 === 2) cible = change ? 0.5 : 0.95;
    if (w === 7) avantRechute = comportement;
    if (w >= 7) {
      // La veille du comité Lagrave, il réécrit la nuit la partie de Gaëtane : l'ancien réflexe revient.
      cible = Math.min(1, cible + 0.45);
      if (w >= 9) {
        if (d5 === 0) cible = Math.min(1, cible + 0.05);
        if (d5 === 1) {
          const p =
            avantRechute <= 0.5 ? CHANCES.repriseApresChangement : CHANCES.repriseSansChangement;
          repriseReussie = h.uReprise < p;
          cible = repriseReussie ? Math.min(avantRechute, 0.4) : Math.min(1, cible);
        }
        if (d5 === 2) {
          repriseReussie = h.uReprise < CHANCES.avertissement;
          cible = repriseReussie ? 0.35 : cible;
        }
      }
    }
    if (mentorReussi && w >= debutMentorat) cible = Math.max(0, cible - 0.15);
    comportement += (w === 7 ? 0.8 : 0.5) * (cible - comportement);

    // Ce que les analystes en subissent : moins s'il est écarté d'eux, rien s'il est parti.
    let exposition = 1;
    if (d1 === 3) exposition = 0.25;
    if (d5 === 3 && w >= 9) exposition *= 0.7;
    // En pyramide, les analystes travaillent sous lui : bien s'il a changé, pire sinon.
    if (lot === "pyramide" && w >= 6) exposition *= 1 + 0.6 * comportement;
    if (lot === "selim" && w >= 6) exposition *= 0.85;
    if (parti(w)) exposition = 0.15;
    const subi = Math.min(1.3, comportement * exposition);

    // La délégation : il garde le travail tant qu'il n'a pas changé, ou qu'on ne la lui demande pas.
    let delegationCible = 0.55 * (1 - comportement);
    if (lot === "pyramide" && w >= 6) delegationCible += 0.35 * (1 - 0.8 * comportement);
    if (lot === "freelance" && w >= 6) delegationCible -= 0.1;
    if (d1 === 3) delegationCible = 0.5;
    if (mentorat === "maximilien" && w >= debutMentorat)
      delegationCible += mentorReussi ? 0.3 : -0.1;
    delegation += 0.4 * (borne(delegationCible, 0, 1) - delegation);

    // L'engagement des analystes.
    let engagementCible = 68 - 34 * subi;
    if (d2 === 1 && w >= 3) engagementCible += 1;
    if (d2 === 2 && w >= 3) engagementCible += 4;
    if (d2 === 3 && w >= 3) engagementCible -= 1;
    // Le lot confié à un indépendant : les analystes comprennent qu'on ne leur fait pas confiance.
    if (lot === "freelance" && w >= 6) engagementCible -= 4;
    if (mentorat === "maximilien" && w >= debutMentorat) engagementCible += mentorReussi ? 12 : -12;
    if (mentorat === "selim" && w >= debutMentorat) engagementCible += 3;
    if (d5 === 0 && w >= 9) engagementCible -= 3;
    if (d5 === 1 && w >= 9) engagementCible += 2;
    if (w >= 11) {
      if (d6 === 0) engagementCible -= 3 + 8 * subi;
      if (d6 === 1) engagementCible += 3 + 6 * (1 - subi);
      if (d6 === 2) engagementCible += 3;
    }
    engagementCible -= 4 * departs;
    engagement = borne(engagement + 0.35 * (engagementCible - engagement) + n.engagement, 20, 95);

    // Qui facture quoi.
    const reel = 0.78 + 0.2 * (engagement / 100);
    const occ: number[] = EQUIPE.map(() => 0);
    occ[P.maximilien] = OCCUPATION_STAR * effet("maximilien");
    if (d1 === 3) occ[P.maximilien] = 0.6;
    if (d5 === 3 && w >= 9) occ[P.maximilien] = Math.min(occ[P.maximilien]!, 0.6);
    if (mentorat === "maximilien" && w >= debutMentorat)
      occ[P.maximilien] = occ[P.maximilien]! - 0.05;
    if (lot === "pyramide" && w >= 6) occ[P.maximilien] = occ[P.maximilien]! - 0.05;
    const juniors = OCCUPATION_BASSE + (OCCUPATION_VENDUE - OCCUPATION_BASSE) * delegation;
    occ[P.ilham] = juniors;
    occ[P.ylan] = juniors;
    occ[P.gaetane] = juniors * effet("lagrave");
    occ[P.selim] = juniors * effet("lagrave");
    // Le lot 2 de Dauriac, à partir de la semaine 6, staffe Ilham et Neven s'il est en pyramide.
    if ((lot === "pyramide" || lot === "selim") && w >= 6) {
      occ[P.ilham] = Math.min(0.92, occ[P.ilham]! + 0.25);
      occ[P.ylan] = Math.min(0.92, occ[P.ylan]! + 0.25);
    }
    if (lot === "selim" && w >= 6) occ[P.selim] = Math.max(0.3, occ[P.selim]! - 0.1);
    if (d2 === 1) {
      // Ilham sortie de la mission : intercontrat, puis une autre mission en semaine 6.
      if (w >= 3 && w <= 5) occ[P.ilham] = 0.15;
      if (w >= 6) occ[P.ilham] = OCCUPATION_AUTRES;
    }
    if (d2 === 2 && w >= 3) occ[P.selim] = occ[P.selim]! - 0.05;
    occ[P.morgane] = OCCUPATION_AUTRES * n.occupation * effet("autres") * effet("morgane");
    occ[P.liam] = Math.min(1, OCCUPATION_AUTRES * n.occupation * effet("autres"));
    // Maximilien passe deux jours sur cinq chez Lagrave.
    occ[P.maximilien] = occ[P.maximilien]! * (0.6 + 0.4 * effet("lagrave"));
    if (parti(w)) occ[P.maximilien] = Math.min(occ[P.maximilien]!, 0.4);
    if (dauriacPerdue(w)) {
      occ[P.maximilien] = Math.min(occ[P.maximilien]!, 0.35);
      if (d2 !== 1 || w < 6) occ[P.ilham] = 0.2;
      occ[P.ylan] = 0.2;
    }

    let honoraires = 0;
    let joursFactures = 0;
    EQUIPE.forEach((p, i) => {
      const o = borne(occ[i]!, 0, 1);
      joursFactures += jo * o;
      honoraires += jo * o * p.tjm * (i === P.maximilien ? 1 : reel);
    });
    let achats = 0;
    if (lot === "freelance" && w >= 6 && !dauriacPerdue(w)) {
      honoraires += FREELANCE.jours * FREELANCE.vente;
      achats += FREELANCE.jours * FREELANCE.achat;
    }
    if (d2 === 3 && w === 3) achats += COUTS.prime;
    if (d4 === 1 && w === 7) achats += COUTS.essai;
    if (d6 === 2 && w === 12) achats += COUTS.reprise;
    const margeSemaine = honoraires - SALAIRES_SEMAINE - achats;
    marge += margeSemaine;

    // Les démissions : Ilham en fin de semaine 4, Gaëtane en semaine 10, Neven en semaine 12.
    let depart = 0;
    let risque = 0;
    if (w <= 4) {
      const propre = 0.1 + [0.15, -0.35, -0.25, -0.12][w >= 3 ? (d2 ?? 0) : 0]!;
      risque = risqueDeDepart(engagement, propre);
      if (w === 4 && h.uIlham < risque) ilham = 4;
    } else if (w <= 10) {
      const propre = w >= 9 ? [0.2, -0.1, -0.1, -0.15][d5 ?? 0]! : 0.1;
      risque = risqueDeDepart(engagement, propre);
      if (w === 10 && h.uGaetane < risque) gaetane = 10;
    } else {
      const propre = w >= 11 ? [0.35, -0.1, 0.05][d6 ?? 0]! : 0.1;
      risque = risqueDeDepart(engagement, propre);
      if (w === 12 && h.uYlan < risque) ylan = 12;
    }
    if (ilham === w || gaetane === w || ylan === w) {
      depart += COUT_DEPART_ANALYSTE;
      departs += 1;
    }
    if (halden !== null && w === halden) {
      depart += COUT_RECRUTEMENT_SENIOR;
      departs += 1;
    }
    if (halden !== null && w === halden + 2) depart += VALEUR_COMPTE_DAURIAC;
    coutDeparts += depart;

    const perteEnquete = w === 1 ? pertes : 0;
    const contribution = margeSemaine - depart - perteEnquete;
    cumul += contribution;
    const joursPossibles = jo * EQUIPE.length;
    const exposes = [P.ilham, P.ylan, P.gaetane, P.selim];
    semaines.push({
      marge: margeSemaine,
      cumul,
      contribution,
      occupation: joursFactures / joursPossibles,
      occupationJuniors: exposes.reduce((s, i) => s + borne(occ[i]!, 0, 1), 0) / exposes.length,
      engagement,
      comportement,
      departs,
      coutDeparts,
      risque,
      honoraires,
    });
  }
  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: marge - coutDeparts - pertes,
    marge,
    coutDeparts,
    change,
    halden,
    ilham,
    gaetane,
    ylan,
    mentorat,
    essaiConcluant,
    banque: accepte,
    repriseReussie,
    occupationMoyenne: pleines.reduce((s, x) => s + x.occupation, 0) / SEMAINES,
    occupationJuniorsMoyenne: pleines.reduce((s, x) => s + x.occupationJuniors, 0) / SEMAINES,
    engagementFinal: pleines[SEMAINES - 1]!.engagement,
    departs,
  };
}

/** Ce qui s'est passé pendant des semaines : démissions, Halden, mentorat, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number | null) => w !== null && w >= de && w <= a;
  return {
    ilham: dans(4) ? (t.ilham !== null ? ("part" as const) : ("reste" as const)) : null,
    gaetane: dans(t.gaetane),
    ylan: dans(t.ylan),
    halden: dans(t.halden),
    dauriacPerdue: t.halden !== null && dans(t.halden + 2),
    essai: dans(8) ? t.essaiConcluant : null,
    reprise: dans(9) ? t.repriseReussie : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEquipe {
  cumul: number | null;
  budgetADate: number | null;
  occupation: number | null;
  occupationJuniors: number | null;
  engagement: number | null;
  departs: number | null;
  coutDeparts: number | null;
  risque: number | null;
  /** Clés non affichées : elles nourrissent les messages et les sources. */
  comportement: number | null;
  maximilienParti: number | null;
  ilhamPartie: number | null;
  gaetanePartie: number | null;
}

/** Ce que Philippine lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEquipe {
  if (semaine === 0) {
    return {
      cumul: 0,
      budgetADate: 0,
      occupation: (OCCUPATION_STAR + 4 * OCCUPATION_BASSE + 2 * OCCUPATION_AUTRES) / 7,
      occupationJuniors: OCCUPATION_BASSE,
      engagement: ENGAGEMENT_DEPART,
      departs: 0,
      coutDeparts: 0,
      risque: risqueDeDepart(ENGAGEMENT_DEPART, 0.25),
      comportement: 1,
      maximilienParti: 0,
      ilhamPartie: 0,
      gaetanePartie: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    occupation: s.occupation,
    occupationJuniors: s.occupationJuniors,
    engagement: s.engagement,
    departs: s.departs,
    coutDeparts: s.coutDeparts,
    risque: s.risque,
    comportement: s.comportement,
    maximilienParti: t.halden !== null && t.halden <= semaine ? 1 : 0,
    ilhamPartie: t.ilham !== null && t.ilham <= semaine ? 1 : 0,
    gaetanePartie: t.gaetane !== null && t.gaetane <= semaine ? 1 : 0,
  };
}
