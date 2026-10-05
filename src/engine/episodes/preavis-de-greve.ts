/**
 * LE PRÉAVIS DE GRÈVE — le modèle de la négociation annuelle des dépôts.
 *
 * Cent vingt salariés dans trois dépôts (Chassieu, Moirans, Andrézieux), une
 * négociation annuelle sur les salaires qui s'ouvre mal, un préavis de grève
 * pour la semaine 4, une enveloppe fixée par la direction, et la saison haute
 * du bâtiment qui commence en semaine 8. Treize semaines, six décisions. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA CONFIANCE SE CONSTRUIT DANS LA DURÉE. Ouvrir les chiffres, tenir ce
 *     qu'on a promis (l'étude sur la pénibilité, les plannings du samedi)
 *     la font monter, et chaque engagement tenu la fait encore monter semaine
 *     après semaine. Une promesse rompue, une lettre envoyée aux salariés
 *     par-dessus leurs représentants la font chuter, et la note arrive plus
 *     tard : des grévistes plus nombreux, une signature plus chère, une
 *     prochaine négociation qui part de plus loin.
 *   · LES INTÉRÊTS, PAS LES POSITIONS. Derrière les 4,5 % réclamés, il y a des
 *     attentes précises : les premiers niveaux de la grille rattrapés par le
 *     Smic, les samedis annoncés le jeudi. Une mesure ciblée et un planning
 *     tenu valent plus, pour ceux qui les reçoivent, qu'un point d'augmentation
 *     générale, et coûtent moins. Un chiffre lancé d'entrée fige la discussion
 *     sur le pourcentage : on ne reprend pas ce qu'on a mis sur la table.
 *   · LA GRÈVE COÛTE, CÉDER AUSSI. Un jour de dépôt arrêté, ce sont des
 *     livraisons manquées et des artisans qui vont voir ailleurs, une fois et
 *     demie plus en saison haute. Mais céder sous la menace apprend que la
 *     menace paie : la signature d'aujourd'hui et la négociation de l'an
 *     prochain coûtent plus cher.
 *
 * Le trimestre est jugé en euros : l'écart à l'enveloppe de la négociation,
 * en comptant le coût annuel des mesures accordées, ce que les grèves ont
 * coûté (chiffre perdu et clients partis), les coûts engagés, et ce que le
 * climat laissé coûtera, ou fera gagner, à la prochaine négociation.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const SALARIES = 120;
/** La masse salariale annuelle des dépôts, charges comprises. */
export const MASSE = 4200000;
/** Un point d'augmentation : 1 % de la masse salariale, sur l'année. */
export const POINT = MASSE / 100;
/** L'enveloppe fixée par la direction, en points de masse salariale. */
export const ENVELOPPE_POINTS = 3.0;
export const ENVELOPPE = ENVELOPPE_POINTS * POINT;
/** La confiance des salariés dans la direction, au lendemain du préavis (sur 1). */
export const CONFIANCE_DEPART = 0.3;
/** La marge perdue par jour de dépôt à l'arrêt, hors saison haute. */
export const PERTE_JOUR = 15000;
/** La saison haute du bâtiment : les semaines où un jour perdu coûte une fois et demie plus. */
export const SAISON = 8;
export const MULTIPLICATEUR_SAISON = 1.5;
export const OBJECTIF_SERVICE = 0.95;
export const SERVICE_DEPART = 0.94;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des débrayages d'une heure dans les dépôts. */
export const PERTE_PAR_JOUR = 2500;
/** Ce que les élus réclament, en points d'augmentation générale. */
export const REVENDICATION = 4.5;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ouverture: 0,
  preavis: 1,
  paquet: 2,
  samedis: 3,
  cloture: 4,
  suivi: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 0, 3, 1, 1, 3] as const;

export const COUTS = {
  /** La préparation des chiffres pour les élus : extractions, une demi-journée de la contrôleuse de gestion. */
  chiffres: 2000,
  /** L'encadrement et les heures pour tenir les dépôts pendant la grève. */
  continuite: 3000,
  /** L'étude ergonomique des quais, promise l'an dernier. */
  etude: 6000,
  /** Samedis volontaires majorés et intérimaires, par semaine de saison haute. */
  volontaires: 1500,
  /** Samedis imposés, majoration légale, par semaine. */
  imposes: 1000,
  /** Samedis payés double, par semaine. */
  double: 3000,
  mediation: 4000,
  commission: 2000,
  /** La prime de fin de conflit, 100 € par salarié, charges comprises. */
  primeFin: SALARIES * 100 * 1.45,
} as const;

/** Les mesures, en points de masse salariale. */
export const MESURES = {
  /** L'offre de la direction, au niveau de l'enveloppe. */
  direction: 2.5,
  tout: 3.0,
  /** L'avance consentie contre la levée du préavis, à valoir sur l'accord. */
  acompte: 1.0,
  general: 2.8,
  /** La part générale du paquet bâti sur les intérêts. */
  socle: 1.5,
  /** +40 € par mois sur les trois premiers niveaux (48 salariés), charges comprises. */
  cible: 0.8,
  /** 300 € de prime de saison haute par salarié, charges comprises. */
  prime: 1.25,
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
  effet: {
    /** Ce que l'imprévu coûte, en euros. */
    cout?: number;
    confiance?: number;
    /** Ce qu'il ajoute aux attentes des salariés, en points. */
    attente?: number;
    /** Ce qu'il retire au taux de service de la semaine. */
    service?: number;
    /** Ce qu'il coûte seulement tant qu'aucun accord n'est signé. */
    conflit?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "accident",
    titre: "Un cariste blessé à Moirans",
    de: "Responsable du dépôt de Moirans",
    role: "Dépôt de Moirans",
    texte:
      "Un cariste s'est blessé à l'épaule en manutention : six semaines d'arrêt. La commission santé et sécurité se réunit en urgence, et l'émotion est vive sur les quais.",
    effet: { cout: 3000, confiance: -0.05 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent recrute des caristes",
    de: "Responsable du dépôt de Chassieu",
    role: "Dépôt de Chassieu",
    texte:
      "Un logisticien qui ouvre une plateforme à côté de Chassieu recrute des caristes à 150 € de plus par mois. Ses affiches sont sur le parking.",
    effet: { attente: 0.2 },
  },
  {
    id: "smic",
    titre: "Revalorisation du Smic",
    de: "Service paie",
    role: "Siège",
    texte:
      "Le Smic est revalorisé au 1er du mois : les deux premiers niveaux de la grille sont rattrapés. La mise en conformité s'impute sur l'enveloppe.",
    effet: { cout: 0.15 * POINT, attente: -0.1 },
  },
  {
    id: "presse",
    titre: "Un article sur le conflit",
    de: "Direction commerciale",
    role: "Région Rhône-Alpes",
    texte:
      "Le quotidien régional consacre un article au conflit dans les dépôts. Deux entreprises générales demandent des garanties de livraison pour leurs chantiers.",
    effet: { conflit: 5000 },
  },
  {
    id: "panne",
    titre: "Panne du logiciel d'entrepôt",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel de gestion d'entrepôt est tombé deux jours à Chassieu : préparation sur papier, livraisons en retard, heures supplémentaires pour rattraper.",
    effet: { cout: 6000, service: 0.08, confiance: -0.02 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** L'activité des dépôts, autour de 1. */
  activite: number;
  service: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Les élus lèvent-ils le préavis ? */
  uLevee: number;
  /** La participation à la grève de la semaine 4, et à celle de la saison haute. */
  nGreve4: number;
  nGreve10: number;
  /** L'agence d'intérim trouve-t-elle deux caristes ? */
  uInterim: number;
  /** Les élus signent-ils le dernier paquet ? */
  uSignature: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000039 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      activite: Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))),
      service: Math.min(2, Math.max(-2, gauss(r))),
    });
  }
  const uLevee = r();
  const nGreve4 = gauss(r);
  const nGreve10 = gauss(r);
  const uInterim = r();
  const uSignature = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uLevee, nGreve4, nGreve10, uInterim, uSignature, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * LES ÉLUS LÈVENT-ILS LE PRÉAVIS ?
 *
 * Contre de l'argent, presque toujours : céder achète une certitude. Contre
 * une méthode et une promesse enfin tenue, souvent, mais seulement si la
 * direction a montré dès la semaine 1 qu'elle jouait cartes sur table : la
 * même proposition, venant d'une direction qui a commencé par fermer la
 * porte, ressemble à une manœuvre.
 */
export function chanceDeLevee(chemin: readonly number[]): number {
  const [d1, d2] = chemin;
  let chance = d1 === 2 ? 0.8 : 0;
  if (d2 === 2) chance = Math.max(chance, d1 === 1 ? 0.6 : d1 === 2 ? 0.85 : 0.3);
  if (d2 === 3) chance = Math.max(chance, 0.97);
  return chance;
}
export const preavisLeve = (chemin: readonly number[], graine: number) =>
  hasard(graine).uLevee < chanceDeLevee(chemin);

/** La semaine où la levée du préavis est annoncée : la 2 après l'offre de la semaine 1, la 4 après la proposition de la semaine 3. */
export function semaineDeLevee(chemin: readonly number[], graine: number): number | null {
  if (!preavisLeve(chemin, graine)) return null;
  return chemin[D.ouverture] === 2 && hasard(graine).uLevee < 0.8 ? 2 : 4;
}

/** Deux fois sur trois, l'agence d'intérim trouve deux caristes pour la saison haute. */
export const interimTrouve = (graine: number) => hasard(graine).uInterim < 0.65;

/** La chance que les élus signent le dernier paquet : elle suit la confiance. */
export const chanceDeSignature = (confiance: number) =>
  Math.min(0.95, Math.max(0.1, 0.15 + 1.1 * confiance));

/** Ce qu'il faut aux élus pour signer, en points perçus : moins quand ils ont confiance, plus quand la pression a payé. */
export const seuilDeSignature = (confiance: number, cede: number, attente: number) =>
  3.4 - 1.2 * (confiance - CONFIANCE_DEPART) + 0.3 * cede + attente;

/** La part du dépôt à l'arrêt pour une participation donnée : au-delà de 70 %, plus rien ne sort. */
const arret = (participation: number) => Math.min(1, 1.4 * participation);

export type Semaine = {
  /** Confiance des salariés dans la direction, sur 1 (baromètre). */
  confiance: number;
  /** Le coût annuel des mesures sur la table, en euros. */
  offre: number;
  /** Livraisons complètes et à l'heure. */
  service: number;
  /** Chiffre perdu et clients partis, cumulés. */
  pertes: number;
  /** L'enveloppe, moins tout ce qui est engagé ou perdu à date. */
  ecart: number;
  /** Ce que la semaine a engagé ou fait perdre : mesures, grève, clients, coûts. */
  cout: number;
  /** La participation à la grève de la semaine ; 0 sans grève. */
  greve: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart à l'enveloppe, grèves, clients perdus et climat laissé compris : positif, sous l'enveloppe. */
  objectif: number;
  /** Le coût annuel des mesures accordées. */
  mesures: number;
  /** En points de masse salariale. */
  points: number;
  /** Chiffre perdu et clients partis. */
  pertes: number;
  /** Les autres coûts : étude, samedis, médiation, primes, imprévus, enquête. */
  couts: number;
  /** Ce que le climat laissé coûtera (positif) ou fera gagner (négatif) à la prochaine négociation. */
  precedent: number;
  preavisLeve: boolean;
  /** La semaine où la levée a été annoncée ; `null` : le préavis a tenu. */
  semaineDeLevee: number | null;
  /** Participation à la grève de la semaine 4 ; 0 si le préavis a été levé. */
  greve4: number;
  /** Participation à la grève de la saison haute ; 0 sans grève. */
  greve10: number;
  joursDeGreve: number;
  /** `null` : pas de samedis volontaires. */
  interim: boolean | null;
  /** Les élus ont-ils signé ? */
  signe: boolean;
  semaineSignature: number | null;
  /** Les concessions faites sous la menace. */
  cede: number;
  /** Les points perçus par les salariés, et ce qu'il leur fallait pour signer. */
  percu: number;
  seuil: number;
  confianceFinale: number;
  serviceMoyen: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const levee = preavisLeve(chemin, graine);
  const interim = d4 === 0 ? interimTrouve(graine) : null;
  const semaines: (Semaine | null)[] = [null];

  let C = CONFIANCE_DEPART;
  // Les mesures sur la table, en points : générales, ciblées, primes.
  let g = 0;
  let t = 0;
  let p = 0;
  let offre = 0;
  let attente = 0;
  let cede = 0;
  let pertes = 0;
  let total = 0;
  let joursDeGreve = 0;
  let greve4 = 0;
  let greve10 = 0;
  let signe = false;
  let semaineSignature: number | null = null;
  let percu = 0;
  let seuil = 0;
  let ecartAMediation = 0;
  let serviceCumule = 0;
  // Les engagements tenus, et ceux qui ne l'ont pas été : la confiance les suit semaine après semaine.
  let tenus = 0;
  let rompus = 0;

  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  /** Ce que valent, pour les salariés, les mesures sur la table. */
  const valeurPercue = () => {
    const ciblage = d1 === 1 ? 1.7 : 1.3;
    const planning = d3 === 2 && d4 !== 1 ? 0.4 : 0;
    const samedis = d4 === 0 ? 0.15 : d4 === 2 ? 0.1 : 0;
    return g + t * ciblage + p * 0.45 + planning + samedis;
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const saison = w >= SAISON;
    const multiplicateur = saison ? MULTIPLICATEUR_SAISON : 1;
    const actifs = h.imprevus.filter((i) => i.semaine === w);
    let cout = w === 1 ? enquete : 0;
    let perdu = 0;
    let service = SERVICE_DEPART + 0.012 * n.service + (saison ? -0.01 : 0.005);
    let greve = 0;

    /** Un ou deux jours de grève : des livraisons manquées, et des artisans qui ne reviennent pas. */
    const greveDe = (joursGreve: number, participation: number) => {
      const manque = joursGreve * PERTE_JOUR * multiplicateur * n.activite * arret(participation);
      const clients = manque * 0.5;
      joursDeGreve += joursGreve;
      service -= (joursGreve / 5) * arret(participation) * 0.9;
      greve = participation;
      C -= 0.03;
      return manque + clients;
    };

    // D1 — l'ouverture de la négociation.
    if (w === 1) {
      if (d1 === 0) {
        g = MESURES.direction;
        C -= 0.08;
      }
      if (d1 === 1) {
        cout += COUTS.chiffres;
        C += 0.12;
      }
      if (d1 === 2) {
        g = MESURES.tout;
        cede += 1;
        C += 0.03;
      }
      if (d1 === 3) C -= 0.06;
    }

    // D2 — la veille de la grève : ce qui est mis sur la table la semaine 3, ce qui en découle la semaine 4.
    if (w === 3 && d2 === 3) {
      // Une avance à valoir sur l'accord : elle ne coûte rien de plus si l'accord la dépasse, mais la menace a payé.
      g = Math.max(g, MESURES.acompte);
      cede += 1;
      C += 0.05;
    }
    if (w === 4) {
      if (d2 === 0) {
        cout += COUTS.continuite;
        C -= 0.03;
      }
      if (d2 === 1) {
        C -= 0.12;
        rompus += 1;
      }
      if (d2 === 2) {
        cout += COUTS.etude;
        C += 0.08;
        tenus += 1;
      }
      if (!levee) {
        let participation =
          0.45 -
          0.6 * (C - CONFIANCE_DEPART) +
          (d2 === 0 ? 0.04 : 0) +
          (d2 === 1 ? -0.05 : 0) +
          0.07 * h.nGreve4;
        participation = borne(participation, 0.08, 0.85);
        greve4 = participation;
        perdu += greveDe(2, participation) * (d2 === 0 ? 0.8 : 1);
      }
    }

    // D3 — ce que la direction met sur la table à la deuxième réunion.
    if (w === 6) {
      if (d3 === 0) g = Math.max(g, MESURES.general);
      if (d3 === 1) {
        g = Math.max(g, MESURES.socle);
        p = MESURES.prime;
        C -= 0.03;
      }
      if (d3 === 2) {
        // Un pourcentage déjà annoncé ne se reprend pas : la part ciblée se réduit d'autant, sans disparaître.
        g = Math.max(g, MESURES.socle);
        t = Math.max(0.4, MESURES.cible - 0.5 * (g - MESURES.socle));
        C += 0.04 + (d1 === 1 ? 0.03 : 0);
      }
      if (d3 === 3) {
        g = Math.max(g, MESURES.direction);
        attente += 0.15;
        C -= 0.04;
      }
    }

    // D4 — les samedis de la saison haute.
    if (saison) {
      if (d4 === 0) {
        cout += COUTS.volontaires;
        if (w === SAISON) {
          C += 0.03 + (d3 === 2 ? 0.03 : 0);
          if (d3 === 2) tenus += 1;
        }
        if (!interim) {
          perdu += 1500 * n.activite;
          service -= 0.03;
        }
      }
      if (d4 === 1) {
        cout += COUTS.imposes;
        service -= 0.01;
        if (w === SAISON) {
          C -= d3 === 2 ? 0.14 : 0.04;
          if (d3 === 2) rompus += 1;
        }
      }
      if (d4 === 2) {
        // Obligatoires mais prévus quinze jours avant, et bien payés : le planning promis est tenu.
        cout += COUTS.double;
        if (w === SAISON) {
          C -= 0.02;
          if (d3 === 2) tenus += 1;
        }
      }
      if (d4 === 3) {
        perdu += 2500 * n.activite * 1.6;
        service -= 0.04;
        if (w === SAISON) C += 0.02;
      }
    }

    // Les imprévus de la semaine.
    for (const { imprevu } of actifs) {
      cout += imprevu.effet.cout ?? 0;
      if (!signe) cout += imprevu.effet.conflit ?? 0;
      C += imprevu.effet.confiance ?? 0;
      attente += imprevu.effet.attente ?? 0;
      service -= imprevu.effet.service ?? 0;
    }

    // D5 — le dernier tour, au seuil de la saison haute.
    if (w === 10) {
      percu = valeurPercue();
      seuil = seuilDeSignature(C, cede, attente);
      const ecart = seuil - percu;
      if (d5 === 0) {
        // Ils demandent toujours un peu plus à qui cède.
        g += Math.max(0.4, ecart + 0.4);
        cede += 1;
        signe = true;
        C += 0.02;
      }
      if (d5 === 1) {
        const participation = borne(
          0.25 + 0.25 * ecart + 0.4 * (0.5 - C) + 0.07 * h.nGreve10,
          0.05,
          0.75,
        );
        greve10 = participation;
        perdu += greveDe(ecart > 1 ? 2 : 1, participation);
        C -= 0.12;
      }
      if (d5 === 2) {
        // Combler l'écart avec des mesures choisies sur leurs sujets coûte moins qu'en pourcentage.
        t += Math.max(0, ecart) * (d1 === 1 ? 0.6 : 0.75);
        if (h.uSignature < chanceDeSignature(C)) {
          signe = true;
          C += 0.04;
        } else {
          const participation = borne(0.15 + 0.3 * (0.5 - C) + 0.05 * h.nGreve10, 0.05, 0.6);
          greve10 = participation;
          perdu += greveDe(1, participation);
          C -= 0.03;
        }
      }
      if (d5 === 3) {
        cout += COUTS.mediation;
        ecartAMediation = Math.max(0, ecart);
        if (ecart > 0.2) {
          const participation = borne(
            0.1 + 0.25 * ecart + 0.3 * (0.5 - C) + 0.05 * h.nGreve10,
            0.05,
            0.6,
          );
          greve10 = participation;
          perdu += greveDe(1, participation);
        }
      }
      if (signe) semaineSignature = w;
    }
    if (w === 12 && d5 === 3) {
      // Le médiateur coupe la poire en deux, en pourcentage.
      g += ecartAMediation * 0.9;
      signe = true;
      semaineSignature = w;
    }

    // D6 — tenir ce qui a été conclu.
    if (w === 12) {
      if (d6 === 0) {
        cout += COUTS.commission;
        C += 0.06;
        tenus += 1;
      }
      if (d6 === 1) {
        // Un mois de mesures en moins sur l'année : une économie, et une promesse rompue.
        cout -= ((g + t) * POINT) / 12;
        C -= 0.25;
        rompus += 1;
      }
      if (d6 === 2) {
        cout += COUTS.primeFin;
        cede += 0.5;
        C += 0.03;
      }
      if (d6 === 3) {
        // La paie applique quand elle peut, et personne ne prévient les élus.
        C -= 0.1;
        rompus += 1;
      }
    }

    // La confiance se construit dans la durée : chaque engagement tenu la nourrit, chaque promesse rompue la ronge.
    C += 0.006 * (tenus - rompus);
    C = borne(C, 0.05, 0.95);

    // Les mesures nouvellement sur la table s'engagent sur l'année.
    const nouvelle = (g + t + p) * POINT;
    cout += nouvelle - offre;
    offre = nouvelle;
    pertes += perdu;
    cout += perdu;
    total += cout;
    service = borne(service, 0.5, 0.99);
    serviceCumule += service;

    semaines.push({
      confiance: C,
      offre,
      service,
      pertes,
      ecart: ENVELOPPE - total,
      cout,
      greve,
    });
  }

  // La prochaine négociation part du climat laissé, et de ce que la pression a rapporté.
  const precedent = POINT * (0.3 * cede + 1.5 * (0.6 - C));
  const mesures = offre;
  return {
    semaines,
    objectif: ENVELOPPE - total - precedent,
    mesures,
    points: g + t + p,
    pertes,
    couts: total - mesures - pertes,
    precedent,
    preavisLeve: levee,
    semaineDeLevee: semaineDeLevee(chemin, graine),
    greve4,
    greve10,
    joursDeGreve,
    interim,
    signe,
    semaineSignature,
    cede,
    percu,
    seuil,
    confianceFinale: C,
    serviceMoyen: serviceCumule / SEMAINES,
  };
}

/** Ce qui s'est passé pendant des semaines : préavis, grèves, intérim, signature, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const [d1, d2] = chemin;
  return {
    /** Le préavis levé contre l'offre de la semaine 1 (semaine 2), ou après la semaine 3 (semaine 4). */
    leveeSemaine2: t.semaineDeLevee === 2 && dans(2),
    /** L'offre de la semaine 1 n'a pas suffi : le préavis tient. */
    maintenuSemaine2: d1 === 2 && t.semaineDeLevee !== 2 && dans(2),
    leveeSemaine4: t.semaineDeLevee === 4 && dans(4),
    /** La proposition de la semaine 3 a été refusée : la grève a lieu. */
    refusSemaine4: t.semaineDeLevee === null && (d2 === 2 || d2 === 3) && dans(4),
    greve4: t.greve4 > 0 && dans(4) ? t.greve4 : null,
    greve10: t.greve10 > 0 && dans(10) ? t.greve10 : null,
    signature: t.semaineSignature !== null && dans(t.semaineSignature) ? t.semaineSignature : null,
    refusDuPaquet: chemin[D.cloture] === 2 && !t.signe && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDepots {
  confiance: number | null;
  offre: number | null;
  service: number | null;
  pertes: number | null;
  ecart: number | null;
  /** 1 : le préavis est levé ; 0 : il tient. */
  preavisLeve: number | null;
  /** La participation à la dernière grève ; 0 sans grève. */
  greve: number | null;
  /** 1 : l'accord est signé. */
  signe: number | null;
  /** Ce qui manque aux élus pour signer, en points, à l'approche du dernier tour ; `null` avant. */
  manque: number | null;
}

/** Ce que la DRH lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDepots {
  if (semaine === 0) {
    return {
      confiance: CONFIANCE_DEPART,
      offre: 0,
      service: SERVICE_DEPART,
      pertes: 0,
      ecart: ENVELOPPE,
      preavisLeve: 0,
      greve: 0,
      signe: 0,
      manque: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const derniereGreve = [...t.semaines.slice(1, semaine + 1)].reverse().find((x) => x!.greve > 0);
  return {
    confiance: s.confiance,
    offre: s.offre,
    service: s.service,
    pertes: s.pertes,
    ecart: s.ecart,
    // Le préavis n'est levé, aux yeux du tableau, qu'une fois la levée annoncée.
    preavisLeve: t.semaineDeLevee !== null && semaine >= t.semaineDeLevee ? 1 : 0,
    greve: derniereGreve ? derniereGreve.greve : 0,
    signe: t.semaineSignature !== null && semaine >= t.semaineSignature ? 1 : 0,
    manque: semaine >= 9 ? t.seuil - t.percu : null,
  };
}
