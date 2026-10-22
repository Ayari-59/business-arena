import type { EngineScenarioConfig, SegmentConfig } from "../../engine/types";

/**
 * LE CALENDRIER DES PARTIES AU MOIS (décision du propriétaire, octobre 2026).
 *
 * Une partie au mois se jouait sur la dramaturgie du trimestre : chaque mois relisait
 * la saison d'un trimestre entier, et douze mois faisaient défiler trois Noëls. Elle
 * suit désormais le calendrier :
 *
 * - LA SAISON D'UN MOIS est celle de son trimestre, la même qu'au trimestre, répartie
 *   entre ses trois mois par le profil du métier quand c'est nécessaire (`PROFILS`) : les
 *   soldes de janvier, le creux d'août, le Black Friday. Un profil ne fait que répartir :
 *   les trois mois d'un trimestre font, ensemble, la demande du trimestre ;
 * - LA PARTIE COMMENCE AU MOIS QUE L'ENSEIGNANT CHOISIT (`moisDeDepart`, janvier par
 *   défaut). Le tour 1 du trimestre est janvier à mars de la première année ;
 * - CE QUI EST ÉCRIT POUR UN TRIMESTRE TOMBE AU PREMIER MOIS DE CE TRIMESTRE : la
 *   situation, l'événement scripté, l'étape d'investissement. Le trimestre en cours au
 *   départ ouvre au premier mois ; un trimestre déjà passé au départ ne se joue pas. Les
 *   autres mois sont des mois de gestion. Une situation de fin de partie s'ouvre au
 *   dernier mois ;
 * - CE QUI DURE se compte en temps réel : un événement d'un trimestre dure trois mois,
 *   un programme de R&D de deux trimestres en dure six.
 *
 * Une partie au mois créée avant ce calendrier ne porte pas `moisDeDepart` dans son
 * instantané : elle se joue et se rejoue comme avant, au bit près.
 */

/** La durée d'une partie au mois sans demande, et la plus longue qu'elle puisse avoir. */
export const MOIS_PAR_DEFAUT = 12;
export const MOIS_MAX = 18;

export const NOMS_DES_MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/** Un profil : douze coefficients, de janvier à décembre ; chaque trimestre fait 3. */
type Profil = readonly number[];

const PLAT: Profil = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

/**
 * LES PROFILS DES MÉTIERS, par préfixe de code de scénario (`nova` vaut pour `nova` et
 * `nova-gamme`). `defaut` répartit les tableaux du marché et des produits, et des
 * segments sans profil propre ; `segments` donne le leur à une clientèle dont le mois
 * n'est pas celui du marché (les comités d'entreprise commandent en novembre, les
 * séminaires désertent août) ; `attrition`, celui des départs d'adhérents. Un métier ou
 * une clientèle absents : la saison du trimestre, également répartie.
 */
interface ProfilsDuMetier {
  defaut: Profil;
  segments?: Readonly<Record<string, Profil>>;
  attrition?: Profil;
}

// Les rentrées, les soldes et les fêtes de fin d'année, communs à plusieurs métiers.
const AFFAIRES_EN_AOUT: Profil = [0.9, 1, 1.1, 1, 1, 1, 1.1, 0.5, 1.4, 1.1, 1.1, 0.8];

export const PROFILS: Readonly<Record<string, ProfilsDuMetier>> = {
  // NOVA, enceintes : la rentrée étudiante en septembre, Noël en décembre ; la chaîne
  // de magasins se référence à la rentrée et passe sa grosse commande avant les fêtes.
  nova: {
    defaut: [1, 1, 1, 1, 1, 1, 0.9, 0.7, 1.4, 0.8, 1, 1.2],
    segments: {
      campustech: [1, 1, 1, 1, 1, 1, 0.6, 0.9, 1.5, 1.1, 1.3, 0.6],
      lyceens: [1, 1, 1, 1, 1, 1, 0.9, 0.7, 1.4, 0.7, 0.9, 1.4],
      gms: [1, 1, 1, 1, 1, 1, 1, 0.8, 1.2, 1, 1.2, 0.8],
    },
  },
  // MAILLE & CO, la maille : les soldes de janvier, l'été creux, les premiers froids de
  // septembre, les cadeaux de décembre ; les comités d'entreprise passent commande en novembre.
  boutique: {
    defaut: [1.3, 0.9, 0.8, 1.1, 1, 0.9, 0.7, 0.6, 1.7, 0.9, 0.9, 1.2],
    segments: {
      pull_ce: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.6, 1.4, 1],
      entreprises: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0.6, 1.4, 1],
    },
  },
  // L'ESCALE, hôtel en ville : la clientèle d'affaires et les séminaires désertent août,
  // les loisirs le remplissent ; les vacances de février, les ponts de mai et juin.
  hotel: {
    defaut: [0.9, 1.05, 1.05, 0.9, 1, 1.1, 1, 1.1, 0.9, 1.1, 0.9, 1],
    segments: {
      affaires: AFFAIRES_EN_AOUT,
      direction: AFFAIRES_EN_AOUT,
      loisirs: [0.8, 1.2, 1, 0.8, 1, 1.2, 0.9, 1.3, 0.8, 1.1, 0.8, 1.1],
      escapades: [0.8, 1.2, 1, 0.8, 1, 1.2, 0.9, 1.3, 0.8, 1.1, 0.8, 1.1],
      groupes: [0.8, 1.1, 1.1, 0.9, 1.1, 1, 1, 0.4, 1.6, 1.2, 1.1, 0.7],
      occasions: [0.9, 1, 1.1, 0.8, 1, 1.2, 1.1, 1.1, 0.8, 1, 0.8, 1.2],
    },
  },
  // Le bistrot : le midi d'affaires vide en août, les banquets et le traiteur reviennent
  // à la rentrée et culminent aux repas de fin d'année ; le soir suit les beaux jours.
  bistrot: {
    defaut: [0.9, 1, 1.1, 0.9, 1, 1.1, 1.1, 0.8, 1.1, 0.95, 0.95, 1.1],
    segments: {
      midi_affaires: [0.9, 1, 1.1, 1, 1, 1, 1.1, 0.5, 1.4, 1, 1.05, 0.95],
      midi_habitues: [0.9, 1, 1.1, 1, 1, 1, 1.1, 0.5, 1.4, 1, 1.05, 0.95],
      groupes: [1, 1, 1, 0.9, 1, 1.1, 1, 0.5, 1.5, 0.9, 0.9, 1.2],
      associations: [1, 1, 1, 0.9, 1, 1.1, 1, 0.5, 1.5, 0.9, 0.9, 1.2],
      entreprises_traiteur: [1, 1, 1, 0.9, 1, 1.1, 1.1, 0.5, 1.4, 0.9, 0.9, 1.2],
      collectivites_traiteur: [1, 1, 1, 0.9, 1, 1.1, 1.1, 0.5, 1.4, 0.9, 0.9, 1.2],
    },
  },
  // Le cabinet de conseil : août ne facture presque rien, décembre ralentit ; les
  // collectivités lancent leurs consultations au printemps et les closent en novembre.
  conseil: {
    defaut: [0.9, 1, 1.1, 1, 1, 1, 1.2, 0.4, 1.4, 1.1, 1.1, 0.8],
    segments: {
      public: [0.8, 1, 1.2, 1, 1, 1, 1.2, 0.4, 1.4, 1, 1.2, 0.8],
      collectivites_num: [0.8, 1, 1.2, 1, 1, 1, 1.2, 0.4, 1.4, 1, 1.2, 0.8],
    },
  },
  // L'e-commerce de la maison : les soldes de janvier, la rentrée, le Black Friday de novembre.
  ecommerce: {
    defaut: [1.2, 0.9, 0.9, 1, 1, 1, 1, 0.8, 1.2, 0.7, 1.3, 1],
  },
  // VOLT FITNESS : les bonnes résolutions de janvier, la reprise de septembre, l'été qui
  // vide la salle et fait partir les adhérents.
  fitness: {
    defaut: [1.2, 0.9, 0.9, 1.1, 1, 0.9, 1, 0.6, 1.4, 1.1, 1.1, 0.8],
    segments: {
      resolutions: [1.8, 0.7, 0.5, 1.1, 1, 0.9, 0.6, 0.4, 2, 1.1, 1.1, 0.8],
      reguliers: [1, 1, 1, 1, 1, 1, 1, 0.7, 1.3, 1, 1, 1],
      entreprises: [1, 1, 1, 1, 1, 1, 1.1, 0.5, 1.4, 1.1, 1.1, 0.8],
    },
    attrition: [1, 1, 1, 1, 1, 1, 1.1, 1.3, 0.6, 1, 1, 1],
  },
  // Le bâtiment : le gel de janvier, les congés d'août, la trêve de fin d'année.
  batiment: {
    defaut: [0.8, 0.9, 1.3, 1, 1, 1, 1.1, 0.6, 1.3, 1.1, 1.1, 0.8],
    segments: {
      marches_publics: [0.8, 1, 1.2, 1, 1, 1, 1.1, 0.6, 1.3, 0.9, 1, 1.1],
    },
  },
  // Le transport : les usines ferment en août, la distribution livre le Black Friday.
  transport: {
    defaut: [1, 1, 1, 1, 1, 1, 1, 0.8, 1.2, 1, 1, 1],
    segments: {
      industriels: [1, 1, 1, 1, 1, 1, 1.1, 0.6, 1.3, 1.05, 1.05, 0.9],
      distribution: [1, 1, 1, 1, 1, 1, 1, 0.8, 1.2, 1, 1.2, 0.8],
    },
  },
};

/** Les profils d'un scénario : ceux de son métier, ou la saison également répartie. */
export function profilsDuScenario(code: string): ProfilsDuMetier {
  return PROFILS[code.split("-")[0]!] ?? { defaut: PLAT };
}

/** Le rang du mois du tour `tour` depuis janvier de la première année (0 = janvier). */
const rangDuMois = (tour: number, moisDeDepart: number) => moisDeDepart - 1 + (tour - 1);

/** Le mois civil du tour (1 = janvier). */
export function moisDuTour(tour: number, moisDeDepart: number): number {
  return (rangDuMois(tour, moisDeDepart) % 12) + 1;
}

/** Le nom du mois du tour : « août ». */
export const nomDuMois = (tour: number, moisDeDepart: number): string =>
  NOMS_DES_MOIS[moisDuTour(tour, moisDeDepart) - 1]!;

/** Le tour du trimestre auquel appartient le tour `tour` d'une partie au mois (1 = janvier à mars de la première année). */
export function trimestreDuTour(tour: number, moisDeDepart: number): number {
  return Math.floor(rangDuMois(tour, moisDeDepart) / 3) + 1;
}

/**
 * LE TOUR D'UNE PARTIE AU MOIS OÙ TOMBE CE QUI EST ÉCRIT POUR LE TOUR `trimestre` DU
 * TRIMESTRE : le premier mois de ce trimestre ; le premier tour si ce trimestre est en
 * cours au départ ; `null` s'il est passé au départ, ou s'il tombe après le dernier tour.
 */
export function tourDuTrimestre(trimestre: number, moisDeDepart: number, mois: number): number | null {
  const premier = 3 * (trimestre - 1) - (moisDeDepart - 1) + 1;
  const tour = premier >= 1 ? premier : trimestre === trimestreDuTour(1, moisDeDepart) ? 1 : null;
  return tour !== null && tour <= mois ? tour : null;
}

/** Le dernier tour d'une partie au mois qui appartient encore au tour `trimestre` du trimestre. */
const dernierMoisDuTrimestre = (trimestre: number, moisDeDepart: number) => 3 * trimestre - (moisDeDepart - 1);

/** Le nombre de trimestres qu'une partie de `mois` mois touche, depuis janvier de la première année. */
export const trimestresDeLaPartie = (mois: number, moisDeDepart: number) => trimestreDuTour(mois, moisDeDepart);

/** Une saison trimestrielle (une valeur par tour du trimestre) rendue mois par mois. */
export function saisonDesMois(
  trimestrielle: readonly number[],
  profil: Profil,
  moisDeDepart: number,
  mois: number,
): number[] {
  return Array.from({ length: mois }, (_, i) => {
    const tour = i + 1;
    const valeur = trimestrielle[trimestreDuTour(tour, moisDeDepart) - 1];
    if (valeur === undefined) throw new Error(`Saison trimestrielle trop courte pour le mois ${tour}.`);
    return valeur * profil[moisDuTour(tour, moisDeDepart) - 1]!;
  });
}

/**
 * LE SCÉNARIO D'UNE PARTIE AU MOIS, SUR LE CALENDRIER.
 *
 * Il reçoit le scénario composé au trimestre sur les trimestres que la partie touche
 * (`trimestresDeLaPartie`, prolongé au besoin) puis redimensionné au mois
 * (`applyPeriodicity`) : les flux y sont déjà au mois, les tours encore des trimestres.
 * Il rend la partie de `mois` tours, dont chacun est un mois.
 */
export function auCalendrierMensuel(
  scenario: EngineScenarioConfig,
  moisDeDepart: number,
  mois: number,
): EngineScenarioConfig {
  const profils = profilsDuScenario(scenario.code);
  const enMois = (t: readonly number[], profil: Profil = profils.defaut) => saisonDesMois(t, profil, moisDeDepart, mois);
  // Un segment qui a son profil prend la saison qu'il lit (la sienne, ou celle de son
  // marché) répartie à sa façon ; les autres suivent leur marché.
  const segment = (g: SegmentConfig, saisonDuMarche: readonly number[]): SegmentConfig => {
    const propre = profils.segments?.[g.code];
    return {
      ...g,
      ...(g.seasonality || propre ? { seasonality: enMois(g.seasonality ?? saisonDuMarche, propre ?? profils.defaut) } : {}),
      ...(g.croissanceJusquAuTour !== undefined
        ? { croissanceJusquAuTour: dernierMoisDuTrimestre(g.croissanceJusquAuTour, moisDeDepart) }
        : {}),
    };
  };
  // Une durée écrite en trimestres, comptée en mois.
  const duree = (trimestres: number) => trimestres * 3;
  // Un « pas avant le tour du trimestre q » : pas avant le premier mois de q.
  const pasAvant = (q: number) => Math.max(1, 3 * (q - 1) - (moisDeDepart - 1) + 1);
  return {
    ...scenario,
    roundsCount: mois,
    moisDeDepart,
    market: {
      ...scenario.market,
      seasonality: enMois(scenario.market.seasonality),
      segments: scenario.market.segments.map((g) => segment(g, scenario.market.seasonality)),
    },
    ...(scenario.products
      ? {
          products: scenario.products.map((p) => {
            const saison = p.market.seasonality ?? scenario.market.seasonality;
            return {
              ...p,
              market: {
                ...p.market,
                ...(p.market.seasonality ? { seasonality: enMois(p.market.seasonality) } : {}),
                segments: p.market.segments.map((g) => segment(g, saison)),
              },
            };
          }),
        }
      : {}),
    ...(scenario.subscription?.churnSeasonality
      ? {
          subscription: {
            ...scenario.subscription,
            churnSeasonality: enMois(scenario.subscription.churnSeasonality, profils.attrition ?? PLAT),
          },
        }
      : {}),
    events: scenario.events.map((e) => ({
      ...e,
      duration: duree(e.duration),
      ...(e.minRound !== undefined ? { minRound: pasAvant(e.minRound) } : {}),
    })),
    scriptedEvents: scenario.scriptedEvents.flatMap((s) => {
      const tour = tourDuTrimestre(s.round, moisDeDepart, mois);
      return tour === null ? [] : [{ ...s, round: tour }];
    }),
    ...(scenario.rse
      ? {
          rse: {
            ...scenario.rse,
            cards: {
              ...scenario.rse.cards,
              minRound: pasAvant(scenario.rse.cards.minRound),
              labelDuration: duree(scenario.rse.cards.labelDuration),
            },
          },
        }
      : {}),
    ...(scenario.rdActions
      ? {
          rdActions: {
            ...scenario.rdActions,
            actions: scenario.rdActions.actions.map((a) => ({ ...a, durationRounds: duree(a.durationRounds) })),
          },
        }
      : {}),
  };
}

/**
 * UNE DURÉE ÉCRITE EN TRIMESTRES, DITE EN MOIS DE TEMPS RÉEL (décision du propriétaire :
 * au mois sur le calendrier, un événement dure le temps réel). Le texte d'un courrier ou
 * d'une situation compte une durée en trimestres, ou en tours d'effet : « deux prochains
 * {{trimestres}} », « pendant 2 tours ». Au mois de toujours, le jeton rendait « deux
 * prochains mois », vrai quand un événement durait deux tours. Sur le calendrier, il en
 * dure six : le nombre se triple et l'unité devient le mois. Une durée sans nombre
 * (« plusieurs trimestres ») et un trimestre au singulier (un flux, « par trimestre »)
 * passent par les mots du mois, comme avant.
 */
const NOMBRES = ["un", "deux", "trois", "quatre", "cinq", "six"] as const;
const TRIPLES = ["trois", "six", "neuf", "douze", "quinze", "dix-huit"] as const;

const triple = (mot: string): string => {
  const i = NOMBRES.indexOf(mot.toLowerCase() as (typeof NOMBRES)[number]);
  const t = TRIPLES[i]!;
  return mot[0] === mot[0]!.toUpperCase() ? t[0]!.toUpperCase() + t.slice(1) : t;
};

const DUREE_EN_TRIMESTRES = new RegExp(
  `\\b(${NOMBRES.join("|")})( (?:prochains|derniers))? \\{\\{trimestres\\}\\}`,
  "gi",
);
const DUREE_EN_TOURS = /\bpendant (\d+) tours?\b/g;

export function enTempsReel(texte: string): string {
  return texte
    .replace(DUREE_EN_TRIMESTRES, (_, nombre: string, adjectif: string | undefined) => `${triple(nombre)}${adjectif ?? ""} mois`)
    .replace(DUREE_EN_TOURS, (_, n: string) => `pendant ${3 * Number(n)} mois`);
}
