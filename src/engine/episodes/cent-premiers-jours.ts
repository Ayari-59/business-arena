/**
 * LES CENT PREMIERS JOURS — le modèle de l'agence de Meyzieu.
 *
 * Un nouveau directeur, arrivé de Dijon, prend une agence de quinze personnes
 * qui tourne correctement, sans plus. Son prédécesseur, apprécié, vient de
 * partir à la retraite ; son adjoint espérait le poste. L'équipe observe, la
 * direction attend des résultats. Treize semaines, six décisions. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE CRÉDIT DU NOUVEAU VENU. Il arrive avec peu de crédit, et tout ce
 *     qu'il fait le remplit ou le vide : écouter chacun, régler l'irritant que
 *     l'équipe signale, tenir ce qu'il promet le remplissent ; imposer les
 *     recettes de son ancienne agence, promettre ce qu'il ne maîtrise pas le
 *     vident. Le crédit se lit partout : dans l'effort au comptoir, dans les
 *     erreurs de préparation, et surtout dans la manière dont l'équipe porte
 *     un plan. Le même plan rapporte bien davantage porté par une équipe
 *     qui fait confiance.
 *   · CE QUI MARCHE NE SE VOIT PAS SUR LES TABLEAUX. L'agence ouvre à 6 h 30
 *     et prépare la veille les commandes des artisans réguliers : c'est ce qui
 *     les fait venir, et cela coûte des heures majorées. Aligner les horaires
 *     sur l'ancienne agence, ou couper ces heures pour montrer vite un chiffre,
 *     économise un peu et fait partir les artisans, semaine après semaine. Les
 *     vrais problèmes, eux, ne se voient qu'en écoutant : un poste de comptoir
 *     en panne depuis quatre mois, et des devis de chantier qui attendent
 *     quatre jours parce qu'un seul homme les fait.
 *   · L'ADJOINT DÉÇU. Christophe connaît tous les gros clients et fait tous les
 *     gros devis. Associé avec un vrai rôle, il devient un allié : les devis
 *     partent en deux jours et les chantiers se gagnent. Recadré, il freine, et
 *     peut partir avec ses clients. Sa réponse est tirée au hasard, mais ses
 *     chances dépendent de la façon dont on l'a traité depuis le premier jour.
 *
 * Le trimestre est jugé en euros : la marge de l'agence, moins les coûts
 * (décisions, erreurs, départ), en écart au budget, plus ce que la dynamique
 * installée en semaine 13 rapporte ou coûte sur les huit semaines suivantes.
 * Arriver avec son plan et ne rien changer ne sont pas des postures : ce sont
 * des calculs.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les semaines du trimestre suivant que la direction compte dans le bilan de la prise de poste. */
export const SUITE = 8;
export const EFFECTIF = 15;
/** Les artisans qui achètent chaque semaine au comptoir. */
export const ARTISANS_DEPART = 140;
/** Ce qu'un artisan régulier achète par semaine, quand on le sert bien. */
export const PANIER = 460;
export const TAUX_COMPTOIR = 0.28;
/** Les devis de chantier demandés chaque semaine, et leur montant moyen. */
export const DEVIS_PAR_SEMAINE = 8;
export const MONTANT_DEVIS = 9000;
export const TAUX_CHANTIER = 0.2;
/** Particuliers et passages, par semaine. */
export const PASSAGE = 12000;
export const TAUX_PASSAGE = 0.32;
/** L'attente au comptoir à 7 h 15, en minutes, quand un seul des deux postes fonctionne. */
export const ATTENTE_DEPART = 18;
/** Le délai de réponse aux devis de chantier, en jours ouvrés. */
export const DELAI_DEPART = 4.5;
export const CONFIANCE_DEPART = 0.35;
/** La rancœur de Christophe, l'adjoint qui espérait le poste. */
export const RANCOEUR_DEPART = 0.55;
/** Les erreurs de préparation, reprises et avoirs, quand l'équipe ne fait aucune confiance. */
export const ERREURS = 1200;
/** Les heures majorées de l'ouverture à 6 h 30. */
export const MAJORATIONS = 900;
/** L'intérimaire du dépôt. */
export const INTERIM_DEPOT = 900;
/** La marge budgétée du trimestre, nette des coûts : la direction attend un peu mieux que l'existant. */
export const BUDGET = 351000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, un artisan qui attendait son devis signe ailleurs. */
export const PERTE_PAR_JOUR = 2000;
/** Le départ de Christophe : recrutement, intérim, et le temps qu'un remplaçant apprenne. */
export const COUT_DEPART = 12000;
/** Le gros chantier de la semaine 9 : la résidence des Peupliers, livrée en semaines 11 à 13. */
export const CHANTIER = 120000;
export const TAUX_GROS_CHANTIER = 0.22;
export const TAUX_PRIX_CASSE = 0.15;
export const OBJECTIF_CONFIANCE = 0.6;
export const OBJECTIF_ATTENTE = 10;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  arrivee: 0,
  irritant: 1,
  adjoint: 2,
  plan: 3,
  chantier: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 2, 3, 3, 3] as const;

export const COUTS = {
  /** Le second poste de comptoir, la douchette et le comptoir express des bons de la veille. */
  comptoir: 2500,
  /** Un renfort intérimaire au comptoir, s'il est accordé. */
  renfort: 1100,
  /** La formation d'un binôme aux devis de chantier. */
  binome: 1500,
  prime: 3000,
  /** Le plan partagé : formation aux devis, relance des artisans perdus. */
  planPartage: 2500,
  /** Le plan de Dijon : réorganisation du dépôt, application de commande. */
  planDijon: 4000,
  presentation: 1000,
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
  effet: { comptoir?: number; chantiers?: number; attente?: number; erreurs?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "intemperies",
    titre: "Une semaine de gel",
    de: "Thao Vo",
    role: "Commerciale terrain",
    texte:
      "Gel toute la semaine : les maçons et les plaquistes ont arrêté leurs chantiers, ils ne passent plus que pour l'indispensable.",
    duree: 1,
    effet: { comptoir: 0.88, chantiers: 0.8 },
  },
  {
    id: "chariot",
    titre: "Panne du chariot élévateur",
    de: "José Carvalho",
    role: "Chef de dépôt",
    texte:
      "Le chariot élévateur est en panne, la pièce arrive dans huit jours : on charge à la main, les préparations prennent du retard et les erreurs suivent.",
    duree: 1,
    effet: { attente: 6, erreurs: 1.6 },
  },
  {
    id: "rupture",
    titre: "Rupture sur les plaques de plâtre",
    de: "Approvisionnement",
    role: "Dépôt régional",
    texte:
      "Le fabricant de plaques de plâtre a arrêté une ligne : deux semaines de livraisons au compte-gouttes, des chantiers qui attendent.",
    duree: 2,
    effet: { chantiers: 0.85 },
  },
  {
    id: "grippe",
    titre: "La grippe au comptoir",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "La grippe touche l'agence : deux vendeurs absents pendant deux semaines, le comptoir tourne à quatre.",
    duree: 2,
    effet: { attente: 5, erreurs: 1.3 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent fait ses portes ouvertes",
    de: "Thao Vo",
    role: "Commerciale terrain",
    texte:
      "Le négoce d'en face fait deux semaines de portes ouvertes, petit-déjeuner et remises : quelques artisans vont voir.",
    duree: 2,
    effet: { comptoir: 0.95 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  comptoir: number;
  chantiers: number;
}

export interface Hasard {
  /** Le bruit des ventes, semaine par semaine, sur les vingt et une semaines. */
  semaines: readonly (Bruit | null)[];
  /** Christophe accepte-t-il le pôle chantiers ? */
  uChristophe: number;
  /** Christophe part-il, si sa rancœur est trop forte ? */
  uDepart: number;
  /** La direction régionale accorde-t-elle le renfort promis ? */
  uRenfort: number;
  /** Le promoteur retient-il le devis de l'agence ? */
  uChantier: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000193 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES + SUITE; i += 1) {
    semaines.push({
      comptoir: Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))),
      chantiers: Math.min(1.3, Math.max(0.7, 1 + 0.12 * gauss(r))),
    });
  }
  const uChristophe = r();
  const uDepart = r();
  const uRenfort = r();
  const uChantier = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uChristophe, uDepart, uRenfort, uChantier, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * CHRISTOPHE ACCEPTE-T-IL LE PÔLE CHANTIERS ?
 *
 * Un adjoint déçu prend un rôle qu'on lui tend pour un lot de consolation…
 * ou pour une reconnaissance. Tout dépend de ce qu'il a vu depuis le premier
 * jour : un directeur qui l'a reçu en premier et lui a demandé ce qu'il
 * ferait, ou un directeur qui a présenté son plan le lundi et changé les
 * horaires sans lui en parler.
 */
export function chanceQueChristopheAccepte(chemin: readonly number[]): number {
  if (chemin[D.adjoint] !== 0) return 0;
  const arrivee = [-0.2, 0.35, 0.15, 0][chemin[D.arrivee] ?? 3] ?? 0;
  const irritant = chemin[D.irritant] === 1 ? -0.2 : chemin[D.irritant] === 0 ? 0.1 : 0;
  return Math.min(0.9, Math.max(0.05, 0.3 + arrivee + irritant));
}
export const christopheAccepte = (chemin: readonly number[], graine: number) =>
  hasard(graine).uChristophe < chanceQueChristopheAccepte(chemin);

/** Deux fois sur cinq, la direction régionale accorde le renfort que le directeur a promis à l'équipe. */
export const renfortAccorde = (graine: number) => hasard(graine).uRenfort < 0.4;

/** Le risque que Christophe parte, lu sur sa rancœur en fin de semaine 9. */
export const risqueDeDepart = (rancoeur: number) =>
  Math.min(0.85, Math.max(0, (rancoeur - 0.4) * 2));

/** La part des devis de chantier signés, selon le délai de réponse. */
export const transformation = (delai: number) =>
  Math.min(0.42, Math.max(0.15, 0.45 - 0.03 * delai));

export type Semaine = {
  /** Chiffre d'affaires de la semaine. */
  ca: number;
  /** Marge commerciale de la semaine. */
  marge: number;
  /** Ce que la semaine a coûté : décisions, erreurs, départ, enquête ; une économie compte en négatif. */
  cout: number;
  /** Marge nette des coûts cumulée, moins le budget à date. */
  ecart: number;
  artisans: number;
  /** L'attente au comptoir à 7 h 15, en minutes. */
  attente: number;
  /** Le délai de réponse aux devis de chantier, en jours ouvrés. */
  delaiDevis: number;
  confiance: number;
  rancoeur: number;
  /** 1 tant que les bons de la veille et l'ouverture à 6 h 30 tiennent. */
  veille: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget, coûts compris, plus la dynamique laissée : positif, l'agence fait mieux que le budget. */
  objectif: number;
  marge: number;
  couts: number;
  /** Ce que la dynamique installée en semaine 13 rapporte, ou coûte, sur les huit semaines suivantes, par rapport à l'agence trouvée en arrivant. */
  valeurLaissee: number;
  /** `null` : on ne lui a rien proposé. */
  christopheAccepte: boolean | null;
  christophePart: boolean;
  /** `null` : rien n'a été promis. */
  renfortAccorde: boolean | null;
  /** `null` : l'agence n'a pas répondu. */
  chantierGagne: boolean | null;
  /** Les bons préparés la veille ont-ils été supprimés pendant le trimestre ? */
  veilleSupprimee: boolean;
  artisansFinal: number;
  confianceFinale: number;
  attenteFinale: number;
  delaiFinal: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La marge d'une semaine ordinaire de l'agence telle que le directeur la trouve, hors bruit. */
export const MARGE_DE_DEPART =
  ARTISANS_DEPART *
    PANIER *
    (1 - 0.004 * (ATTENTE_DEPART - 8)) *
    (0.97 + 0.05 * CONFIANCE_DEPART) *
    TAUX_COMPTOIR +
  DEVIS_PAR_SEMAINE * MONTANT_DEVIS * transformation(DELAI_DEPART) * TAUX_CHANTIER +
  PASSAGE * (1 - 0.006 * (ATTENTE_DEPART - 8)) * TAUX_PASSAGE;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const accepte = d3 === 0 ? christopheAccepte(chemin, graine) : null;
  const renfort = d2 === 2 ? renfortAccorde(graine) : null;
  /** Ce que l'écoute de la semaine 1 apprend : le plan vise les bons problèmes, ou à côté. */
  const lucidite = d1 === 1 ? 1 : d1 === 2 ? 0.6 : 0.45;

  const semaines: (Semaine | null)[] = [null];
  let C = CONFIANCE_DEPART;
  let R = RANCOEUR_DEPART;
  let N = ARTISANS_DEPART;
  let attenteBase = ATTENTE_DEPART;
  let delai = DELAI_DEPART;
  let veille = true;
  let veilleSupprimee = false;
  let interim = true;
  let part = false;
  let clientsChristophe = 1;
  let recapture = 0;
  let creux = 0;
  let pression = false;
  let rangement = 1;
  let gagne: boolean | null = null;
  let marge = 0;
  let couts = 0;
  let ecart = 0;
  let valeurLaissee = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  const supprimerVeille = () => {
    if (!veille) return;
    veille = false;
    veilleSupprimee = true;
    attenteBase += 5;
  };

  for (let w = 1; w <= SEMAINES + SUITE; w += 1) {
    const suite = w > SEMAINES;
    const n = h.semaines[w]!;
    const actifs = suite
      ? []
      : h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? enquete : 0;
    let ventesChantier = 0;
    let margeChantier = 0;

    if (!suite) {
      // D1 — les premiers jours.
      if (d1 === 0 && w === 1) {
        C -= 0.1;
        R += 0.1;
      }
      if (d1 === 1 && w <= 3) {
        C += 0.03;
        if (w === 1) R -= 0.1;
      }
      if (d1 === 2 && w === 2) C += 0.02;
      if (d1 === 3 && w <= 3) {
        C -= 0.01;
        if (w === 1) R -= 0.05;
      }

      // D2 — l'irritant, en semaine 4.
      if (w === 4) {
        if (d2 === 0) {
          cout += COUTS.comptoir;
          attenteBase -= 8;
          // L'irritant que chacun avait cité : la preuve qu'on a été entendu.
          C += 0.04 + (0.06 * (lucidite - 0.45)) / 0.55;
          R -= 0.05;
        }
        if (d2 === 1) {
          supprimerVeille();
          C -= 0.1;
          R += 0.05;
        }
        if (d2 === 2) C += 0.05;
        if (d2 === 3) C -= 0.02;
      }
      if (renfort !== null && w === 6) {
        if (renfort) {
          attenteBase -= 7;
          C += 0.04;
        } else C -= 0.15;
      }
      if (renfort && w >= 6) cout += COUTS.renfort;

      // D3 — Christophe, en semaine 6.
      if (w === 6) {
        if (d3 === 0) {
          cout += COUTS.binome;
          if (accepte) {
            R *= 0.2;
            C += 0.05;
          } else R -= 0.1;
        }
        if (d3 === 1) {
          R += 0.3;
          C -= 0.05;
        }
        if (d3 === 2) R -= 0.05;
        if (d3 === 3) {
          cout += COUTS.prime;
          R -= 0.15;
          C -= 0.02;
        }
      }
      if (d3 === 0 && w === 8) delai = accepte ? 2.5 : 3.8;
      if (d3 === 1 && w === 7) delai += 0.8;
      // Deux capitaines : l'équipe ne sait plus qui décide.
      if (d3 === 2 && w >= 6) C -= 0.008;

      // D4 — le plan, en semaine 8.
      if (w === 8) {
        if (d4 === 0) {
          cout += COUTS.planPartage;
          const k = lucidite * (0.5 + C);
          recapture = 0.6 * k;
          delai -= 0.6 * k;
          C += 0.05;
        }
        if (d4 === 1) {
          cout += COUTS.planDijon;
          supprimerVeille();
          creux = 0.1 * (1 - C);
          rangement = 0.8;
          C -= 0.1;
          R += 0.1;
        }
        if (d4 === 2) {
          supprimerVeille();
          interim = false;
          attenteBase += 4;
          C -= 0.08;
        }
        if (d4 === 3) C -= 0.03;
      }
      if (w === 11) creux = 0;

      // D5 — le gros chantier, en semaine 9 ; la réponse du promoteur en semaine 10.
      if (w === 10) {
        if (d5 === 0) {
          let p = part ? 0.3 : accepte ? 0.85 : 0.45;
          if (d4 === 0) p += 0.05;
          gagne = h.uChantier < p;
        }
        if (d5 === 1) {
          gagne = h.uChantier < 0.5;
          R += 0.1;
          C -= 0.02;
        }
        if (d5 === 2) gagne = h.uChantier < 0.88;
        if (d5 === 3) C -= 0.02;
      }
      if (w === 11 && gagne && d5 === 0) C += 0.04;
      if (gagne && w >= 11) {
        ventesChantier = CHANTIER / 3;
        margeChantier = ventesChantier * (d5 === 2 ? TAUX_PRIX_CASSE : TAUX_GROS_CHANTIER);
      }

      // D6 — finir le trimestre, en semaine 12.
      if (w === 12) {
        if (d6 === 0) {
          cout += COUTS.presentation;
          C += 0.07;
        }
        if (d6 === 1) {
          C -= 0.1;
          R += 0.1;
        }
        if (d6 === 2) {
          pression = true;
          C -= 0.08;
        }
        if (d6 === 3) C -= 0.03;
      }

      // Le départ de Christophe, décidé en fin de semaine 9, prend effet en semaine 10.
      if (part && w === 10) {
        cout += COUT_DEPART;
        clientsChristophe = 0.8;
        delai = Math.max(delai, 6);
        C -= 0.05;
      }
    } else {
      // La suite : ce que la dynamique installée continue de produire, sans décision nouvelle.
      if (w === SEMAINES + 1 && d6 === 0) {
        recapture += 1 * C;
        delai = Math.max(2, delai - 0.3);
      }
      if (w === SEMAINES + 1 && d6 === 1) {
        supprimerVeille();
        creux = 0.1 * (1 - C);
      }
      if (w === SEMAINES + 4) creux = 0;
    }
    // Le temps sans résultat use le crédit ; la rancœur s'éteint doucement.
    C -= 0.004;
    R -= 0.005;
    C = borne(C, 0.1, 0.95);
    R = borne(R, 0, 1);

    // L'attente au comptoir à 7 h 15.
    let attente = attenteBase;
    for (const a of actifs) attente += a.imprevu.effet.attente ?? 0;
    attente = Math.max(4, attente);

    // Les artisans réguliers : ceux que l'attente, la fin des bons de la veille et une équipe sans
    // confiance font partir, ceux que le bouche-à-oreille et la relance ramènent.
    const depart =
      0.005 +
      0.0004 * Math.max(0, attente - 8) +
      (veille ? 0 : 0.008) +
      (pression ? 0.003 : 0) +
      0.006 * Math.max(0, 0.4 - C);
    N = N - N * depart + 1.26 + recapture;

    // Le chiffre de la semaine.
    let fComptoir = n.comptoir;
    let fChantiers = n.chantiers;
    let fErreurs = 1;
    for (const a of actifs) {
      fComptoir *= a.imprevu.effet.comptoir ?? 1;
      fChantiers *= a.imprevu.effet.chantiers ?? 1;
      fErreurs *= a.imprevu.effet.erreurs ?? 1;
    }
    let panier = PANIER * (1 - 0.004 * Math.max(0, attente - 8)) * (veille ? 1 : 0.97);
    if (pression) panier *= 1.02;
    const comptoir = N * panier * (0.97 + 0.05 * C) * fComptoir * (1 - creux);
    const chantiers =
      DEVIS_PAR_SEMAINE * MONTANT_DEVIS * transformation(delai) * clientsChristophe * fChantiers;
    const passage = PASSAGE * (1 - 0.006 * Math.max(0, attente - 8)) * n.comptoir;
    const ca = comptoir + chantiers + passage + ventesChantier;
    const margeSemaine =
      comptoir * TAUX_COMPTOIR + chantiers * TAUX_CHANTIER + passage * TAUX_PASSAGE + margeChantier;

    // Ce que la semaine coûte encore : les erreurs, et ce que les coupes économisent.
    const erreurs = ERREURS * (1.2 - C) * rangement * fErreurs * (pression ? 1.5 : 1);
    cout += erreurs - ERREURS * (1.2 - CONFIANCE_DEPART);
    if (!veille) cout -= MAJORATIONS;
    if (!interim) cout -= INTERIM_DEPOT;

    if (suite) {
      if (renfort) cout += COUTS.renfort;
      valeurLaissee += margeSemaine - cout - MARGE_DE_DEPART;
      continue;
    }

    marge += margeSemaine;
    couts += cout;
    ecart += margeSemaine - cout - BUDGET / SEMAINES;

    // À bout, Christophe part : la décision se lit en fin de semaine 9.
    if (w === 9 && !accepte && h.uDepart < risqueDeDepart(R)) part = true;

    semaines.push({
      ca,
      marge: margeSemaine,
      cout,
      ecart,
      artisans: N,
      attente,
      delaiDevis: delai,
      confiance: C,
      rancoeur: R,
      veille: veille ? 1 : 0,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: marge - couts - BUDGET + valeurLaissee,
    marge,
    couts,
    valeurLaissee,
    christopheAccepte: accepte,
    christophePart: part,
    renfortAccorde: renfort,
    chantierGagne: gagne,
    veilleSupprimee,
    artisansFinal: fin.artisans,
    confianceFinale: fin.confiance,
    attenteFinale: fin.attente,
    delaiFinal: fin.delaiDevis,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, départ, chantier, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    renfort: t.renfortAccorde !== null && dans(6) ? t.renfortAccorde : null,
    christophe: t.christopheAccepte !== null && dans(6) ? t.christopheAccepte : null,
    christophePart: t.christophePart && dans(10),
    chantier: t.chantierGagne !== null && dans(10) ? t.chantierGagne : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAgence {
  marge: number | null;
  ecart: number | null;
  artisans: number | null;
  attente: number | null;
  delaiDevis: number | null;
  confiance: number | null;
  /** 1 : Christophe a accepté le pôle chantiers ; 0 : non, ou pas encore ; −1 : il est parti. */
  christophe: number | null;
  /** 1 tant que les bons de la veille tiennent. */
  veille: number | null;
}

/** Ce que le directeur lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAgence {
  if (semaine === 0) {
    return {
      marge: MARGE_DE_DEPART,
      ecart: 0,
      artisans: ARTISANS_DEPART,
      attente: ATTENTE_DEPART,
      delaiDevis: DELAI_DEPART,
      confiance: CONFIANCE_DEPART,
      christophe: 0,
      veille: 1,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.marge,
    ecart: s.ecart,
    artisans: s.artisans,
    attente: s.attente,
    delaiDevis: s.delaiDevis,
    confiance: s.confiance,
    christophe:
      t.christophePart && semaine >= 10 ? -1 : t.christopheAccepte && semaine >= 6 ? 1 : 0,
    veille: s.veille,
  };
}
