import type { CourrierDef } from "./types";

/**
 * LE COURRIER D'UNE PARTIE OÙ L'ASSURANCE N'EST PAS UN LEVIER.
 *
 * L'assurance s'ouvre au niveau Arbitrage (4). Plusieurs courriers en parlaient
 * à tous les niveaux : « sauf pour les assurés », un assureur qui écrit au sujet
 * de « la formule souscrite », une leçon sur la prime. À un niveau où l'équipe
 * ne peut rien souscrire, ces phrases parlent d'une décision qu'elle n'a pas :
 * elles se lisent ici AUTREMENT, sans l'assurance, avec le même effet sur les
 * comptes (le moteur ne change pas, l'effet chiffré non plus).
 *
 * Chaque variante ne réécrit que les champs qui parlent d'assurance ; les
 * autres restent ceux de la liasse. Une garde (`tests/unit/courriers-sans-assurance.test.ts`)
 * vérifie qu'avec l'assurance fermée aucun courrier tiré ne parle plus d'en
 * souscrire.
 */

/** L'expert qui constate, à la place de l'assureur qui indemnise. */
const EXPERT = {
  expediteur: "Cabinet Ferrand · Expertise des dommages",
  signataire: "L'expert",
  icone: "alerte" as const,
};

export const VARIANTES_SANS_ASSURANCE: Readonly<Record<string, Partial<CourrierDef>>> = {
  natural_disaster: {
    corps:
      "La tempête qui a traversé la zone industrielle a provoqué des inondations importantes. L'arrêté est publié : les entreprises sinistrées disposent de dix jours pour déclarer leurs pertes auprès des services de l'État.",
    effet: "Disponibilité −28 % et matières +12 % ce tour",
    enJeu:
      "Un coup dur qu'aucune garantie ne couvre se paie sur la marge et la trésorerie du tour : c'est là qu'il faut regarder.",
  },
  boutique_degat_des_eaux: {
    corps:
      "Le chauffe-eau du logement situé au-dessus de votre local a fui durant la nuit. Le constat amiable est joint. La moitié de votre stock est déclarée impropre à la vente.",
    enJeu:
      "Un stock abîmé se perd deux fois : ce qu'il a coûté, et ce qu'il aurait rapporté.",
    icone: "alerte",
  },
  hotel_degat_des_eaux: {
    ...EXPERT,
    corps:
      "L'expert est passé : douze chambres sont hors service et les plafonds de l'étage inférieur sont à reprendre.",
    enJeu:
      "La perte d'exploitation coûte plus cher que les travaux : une chambre fermée ne se revend pas le lendemain.",
  },
  bistrot_degat_des_eaux: {
    ...EXPERT,
    corps:
      "La canalisation située sous le passe a cédé. Nous relevons une cuisine inondée et une salle inexploitable le temps du séchage.",
    enJeu:
      "La perte d'exploitation est l'essentiel du dommage : une salle fermée ne vend rien, et les charges courent.",
  },
  ecom_entrepot: {
    ...EXPERT,
    corps:
      "Nous constatons qu'un tiers de votre stock est impropre à la vente et que le reste présente des traces d'humidité.",
    enJeu:
      "Le stock d'un pure player est son actif principal : abîmé, c'est de la trésorerie immobilisée qui ne reviendra pas.",
  },
  fitness_degat_des_eaux: {
    ...EXPERT,
    enJeu:
      "La perte d'exploitation dépasse largement le coût des travaux : une salle sans vestiaires perd ses adhérents.",
  },
  batiment_sinistre_chantier: {
    ...EXPERT,
    enJeu: "Un chantier suspendu coûte deux fois : les ouvrages à reprendre, et les équipes qui attendent.",
  },
  transport_accident: {
    ...EXPERT,
    corps:
      "Votre conducteur est indemne, le porteur est immobilisé et la marchandise transportée est endommagée. L'expertise est fixée à jeudi.",
    enJeu:
      "Un véhicule immobilisé, c'est de la capacité perdue : une flotte se dimensionne aussi pour les coups durs.",
  },
  ecom_cyberattaque: {
    enJeu: "Quand la boutique EST le site, chaque heure hors ligne est un chiffre d'affaires perdu pour de bon.",
  },
  conseil_litige_client: {
    corps:
      "Notre cliente conteste la conformité du livrable remis et suspend le règlement du solde. Nous restons ouverts à une solution amiable.",
  },
  fitness_accident: {
    corps:
      "Notre client a été blessé par une barre dont le réglage n'était pas conforme. Un arrêt de travail de six semaines lui a été prescrit. Nous vous demandons de prendre attache avec notre cabinet.",
  },
  bistrot_panne_froid: {
    corps:
      "Le groupe s'est arrêté dans la nuit de vendredi et la température est remontée durant tout le week-end. L'intégralité des denrées stockées est à détruire. L'attestation de destruction est jointe.",
  },
  batiment_vol_materiel: {
    corps:
      "Votre plainte pour effraction du fourgon et vol de perforateurs, scies et niveaux laser a été enregistrée. Aucune piste n'est ouverte à ce stade. Ce récépissé vous est délivré pour vos démarches.",
  },
  transport_vol_remorque: {
    corps:
      "Votre plainte pour le vol d'une remorque et de son chargement sur votre parking a été enregistrée. Les images de vidéoprotection sont en cours d'exploitation. Ce récépissé vous est délivré pour vos démarches.",
  },
};

/** Le courrier tel qu'il se lit dans la partie : sa variante sans assurance là où elle n'est pas un levier. */
export function courrierSelonLAssurance<T extends CourrierDef | undefined>(c: T, assuranceOuverte: boolean): T {
  if (!c || assuranceOuverte) return c;
  const variante = VARIANTES_SANS_ASSURANCE[c.code];
  return (variante ? { ...c, ...variante } : c) as T;
}

/** Les courriers de routine qui parlent d'assurance : ils ne se distribuent pas sans elle. */
export const ROUTINES_D_ASSURANCE: readonly string[] = ["routine_echeance_assurance"];
