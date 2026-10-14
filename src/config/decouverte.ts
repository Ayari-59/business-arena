import { EPISODES_DE_DEMO, NIVEAU_DES_DEMOS } from "@/config/episodes/demos";
import { NIVEAUX, type CodeNiveau } from "@/config/episodes/niveaux";
import { NIVEAU_MAX, VITRINE_SOLO_PAR_DEFAUT, type VitrineSolo } from "@/config/vitrine-solo";

/**
 * LES GRATUITÉS : CE QUI EST OUVERT SANS LICENCE, ET L'ESSAI D'ÉTABLISSEMENT.
 *
 * Demande du propriétaire : gérer « les gratuités » depuis /admin. La Découverte (l'offre
 * gratuite de /tarifs) se règle dans /admin/offres et vit en base
 * (`catalogue_reglages`, clé « decouverte », migration 0041). Elle REMPLACE le réglage
 * « vitrine solo » de platform_settings, que la migration y a recopié :
 *  · `solo` : les niveaux de l'arène ouverts en solo sans licence (par défaut 1 à 3 pour
 *    toutes les entreprises), une entreprise rouverte à tous les niveaux si l'admin le
 *    veut, ou la règle éteinte (tout ouvert) ;
 *  · `demos` : les épisodes manager jouables sans licence (par défaut
 *    `EPISODES_DE_DEMO`, un par métier, ce que l'admin est invité à garder) ;
 *  · `niveauDesDemos` : le niveau auquel ils se jouent (par défaut Découverte).
 * La règle serveur (services/acces.service.ts) lit ce réglage à chaque création de partie
 * et à chaque ouverture d'épisode.
 *
 * L'ESSAI D'ÉTABLISSEMENT (clé « essai ») est désactivé par défaut : la grille dit « pas
 * d'essai en classe ». Activé, l'admin peut accorder à une organisation une licence
 * d'essai, datée et marquée comme telle, dans la durée maximale réglée ici.
 *
 * Ce module est léger : le formulaire de /admin/offres le lit côté navigateur.
 */
export interface ReglageDeLaDecouverte {
  solo: VitrineSolo;
  demos: string[];
  niveauDesDemos: CodeNiveau;
}

export const DECOUVERTE_PAR_DEFAUT: ReglageDeLaDecouverte = {
  solo: { ...VITRINE_SOLO_PAR_DEFAUT },
  demos: [...EPISODES_DE_DEMO],
  niveauDesDemos: NIVEAU_DES_DEMOS,
};

export interface ReglageDeLEssai {
  autorise: boolean;
  /** La durée maximale d'une licence d'essai, en jours. */
  dureeMaxJours: number;
}

export const ESSAI_PAR_DEFAUT: ReglageDeLEssai = { autorise: false, dureeMaxJours: 30 };
export const DUREE_MAX_D_UN_ESSAI = 90;

const estUnNiveauDEpisode = (v: unknown): v is CodeNiveau =>
  typeof v === "string" && NIVEAUX.some((n) => n.code === v);

/** Les niveaux ouverts en solo : une valeur absente ou hors bornes retombe sur le défaut. */
export function normaliserSolo(brut: unknown): VitrineSolo {
  const v = (brut ?? {}) as Partial<VitrineSolo>;
  const niveau = Math.floor(Number(v.niveauMaxAutres));
  return {
    active: typeof v.active === "boolean" ? v.active : VITRINE_SOLO_PAR_DEFAUT.active,
    entrepriseOuverte: typeof v.entrepriseOuverte === "string" ? v.entrepriseOuverte.trim() : "",
    niveauMaxAutres:
      Number.isFinite(niveau) && niveau >= 1 && niveau <= NIVEAU_MAX ? niveau : VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres,
  };
}

/**
 * Colonne de JSON libre : ce qui manque ou ne se lit pas retombe sur le défaut. Les
 * démonstrations inconnues du registre (`connu`) sont écartées ; une liste vide reste
 * vide (l'admin peut retirer toutes les démonstrations).
 */
export function normaliserDecouverte(brut: unknown, connu: (code: string) => boolean = () => true): ReglageDeLaDecouverte {
  const v = (brut ?? {}) as Partial<Record<keyof ReglageDeLaDecouverte, unknown>>;
  const demos = Array.isArray(v.demos)
    ? [...new Set(v.demos.filter((c): c is string => typeof c === "string" && connu(c)))]
    : [...DECOUVERTE_PAR_DEFAUT.demos];
  return {
    solo: normaliserSolo(v.solo),
    demos,
    niveauDesDemos: estUnNiveauDEpisode(v.niveauDesDemos) ? v.niveauDesDemos : DECOUVERTE_PAR_DEFAUT.niveauDesDemos,
  };
}

export function normaliserEssai(brut: unknown): ReglageDeLEssai {
  const v = (brut ?? {}) as Partial<ReglageDeLEssai>;
  const jours = Math.floor(Number(v.dureeMaxJours));
  return {
    autorise: v.autorise === true,
    dureeMaxJours:
      Number.isFinite(jours) && jours >= 1 && jours <= DUREE_MAX_D_UN_ESSAI ? jours : ESSAI_PAR_DEFAUT.dureeMaxJours,
  };
}

/** Le dernier niveau ouvert sans licence, tel que la ligne d'état et les refus le disent. */
export const niveauMaxSansLicence = (d: ReglageDeLaDecouverte): number =>
  d.solo.active ? d.solo.niveauMaxAutres : NIVEAU_MAX;
