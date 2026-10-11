/**
 * LES NIVEAUX OUVERTS SANS LICENCE (héritière de « la vitrine du solo public »).
 *
 * Décision du propriétaire (octobre 2026), avec la grille tarifaire : « Fermer les
 * niveaux 4 à 6 ». La Découverte gratuite comprend l'arène aux niveaux 1 à 3 ; les
 * niveaux avancés (RH, RSE, investissement, dividende, placement) sont inclus dans les
 * offres de l'arène (Classe, Programme et Campus, config/tarifs.ts). La règle vaut pour TOUS ceux
 * qui n'ont pas de licence de l'arène en cours : le visiteur du solo public, l'enseignant
 * et l'établissement sans licence. Une licence de l'arène en cours ouvre tous les niveaux
 * (services/acces.service.ts).
 *
 * L'étendue reste l'argument : les niveaux fermés restent VISIBLES, marqués du nom de
 * l'offre avec le lien vers les tarifs, jamais un bouton grisé muet. Le nom de l'offre et
 * la phrase qui l'explique vivent dans config/tarifs.ts (`MARQUE_DE_L_ARENE`,
 * `messageNiveauxReserves`) : ce module-ci est lu par le formulaire, côté navigateur, et
 * n'importe pas la grille ; la page serveur lui passe ces textes.
 *
 * Le réglage vit dans /admin et peut encore s'ajuster sans déploiement : relever le
 * niveau maximum, ou rouvrir une entreprise à tous les niveaux (l'ancienne « vitrine »).
 * Seule la création d'une partie est concernée : une partie commencée se termine.
 *
 * LA VERSION DU RÉGLAGE. Le réglage enregistré en base l'emporte sur le défaut du code.
 * Celui d'avant la décision (« vitrine éteinte », le défaut d'alors, écrit en base dès
 * qu'un administrateur enregistrait la page) aurait laissé tout ouvert en production.
 * Un réglage sans `version` à jour est donc lu comme le défaut ; ce que l'administrateur
 * enregistre désormais porte la version et fait foi.
 */

/**
 * L'entreprise que l'ancienne vitrine ouvrait par défaut. Écrite ici plutôt que lue du
 * registre : ce module est importé par le formulaire (côté navigateur), et le registre
 * des scénarios est lourd. Un test garde l'égalité avec `DEFAULT_SCENARIO_CODE`.
 */
export const ENTREPRISE_VITRINE_PAR_DEFAUT = "nova";

/** La version du réglage : ce qui est enregistré sans elle date d'avant la décision. */
export const VERSION_DE_LA_REGLE = 2;

export interface VitrineSolo {
  /** La règle s'applique-t-elle ? Éteinte (choix explicite de l'admin) : tout est ouvert. */
  active: boolean;
  /** Le code d'une entreprise jouable à tous les niveaux sans licence ; vide : aucune. */
  entrepriseOuverte: string;
  /** Le niveau maximum sans licence (1 à 6). */
  niveauMaxAutres: number;
}

export const NIVEAU_MAX = 6;

/** Sans licence : niveaux 1 à 3, pour toutes les entreprises. */
export const VITRINE_SOLO_PAR_DEFAUT: VitrineSolo = {
  active: true,
  entrepriseOuverte: "",
  niveauMaxAutres: 3,
};

/**
 * Où lire ce qu'apportent les offres. La page arrive avec la grille tarifaire. Les liens
 * qui y mènent ne se préchargent pas (`prefetch={false}`) : le catalogue en porte une
 * centaine, et un préchargement resté en attente tenait la page pour « jamais finie ».
 */
export const LIEN_TARIFS = "/tarifs";

/**
 * Colonne de JSON libre : une valeur absente, d'une version antérieure ou hors bornes
 * retombe sur le défaut.
 */
export function normaliserVitrine(brut: unknown): VitrineSolo {
  const v = (brut ?? {}) as Partial<VitrineSolo> & { version?: unknown };
  if (v.version !== VERSION_DE_LA_REGLE) return { ...VITRINE_SOLO_PAR_DEFAUT };
  const niveau = Math.floor(Number(v.niveauMaxAutres));
  return {
    active: v.active === true,
    entrepriseOuverte: typeof v.entrepriseOuverte === "string" ? v.entrepriseOuverte.trim() : "",
    niveauMaxAutres:
      Number.isFinite(niveau) && niveau >= 1 && niveau <= NIVEAU_MAX
        ? niveau
        : VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres,
  };
}

/** Ce que l'administrateur enregistre : la règle, et la version qui la fait foi. */
export function vitrineAEnregistrer(v: VitrineSolo): VitrineSolo & { version: number } {
  return { ...normaliserVitrine({ ...v, version: VERSION_DE_LA_REGLE }), version: VERSION_DE_LA_REGLE };
}

/** Le niveau le plus haut qu'on peut créer avec cette entreprise ; une licence ouvre tout. */
export function niveauMaxPour(vitrine: VitrineSolo, scenarioCode: string, licence = false): number {
  if (licence || !vitrine.active) return NIVEAU_MAX;
  return vitrine.entrepriseOuverte !== "" && scenarioCode === vitrine.entrepriseOuverte
    ? NIVEAU_MAX
    : vitrine.niveauMaxAutres;
}

/** Ce niveau est-il fermé pour cette entreprise ? */
export function niveauReserve(
  vitrine: VitrineSolo,
  scenarioCode: string,
  niveau: number,
  licence = false,
): boolean {
  return niveau > niveauMaxPour(vitrine, scenarioCode, licence);
}

/** Des niveaux sont-ils fermés pour certaines entreprises, et d'autres ouvertes ? */
export const aDeuxEtages = (vitrine: VitrineSolo): boolean =>
  vitrine.active && vitrine.entrepriseOuverte !== "";

/** Les niveaux fermés, en toutes lettres : « Les niveaux 4 à 6 », « Le niveau 6 ». */
export function niveauxFermes(vitrine: VitrineSolo): string {
  const premier = vitrine.niveauMaxAutres + 1;
  return premier >= NIVEAU_MAX ? `Le niveau ${NIVEAU_MAX}` : `Les niveaux ${premier} à ${NIVEAU_MAX}`;
}
