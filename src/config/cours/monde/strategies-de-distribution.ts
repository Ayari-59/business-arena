import { enseigneDe } from "./attractivite";
import { MARCHE_A_TROIS } from "./marche-a-trois";
import { CANAL_INDIRECT } from "./mercatique-de-nova";

/**
 * LE MONDE DU COURS : LES STRATÉGIES DE DISTRIBUTION DU MARCHÉ DE NOVA (le complément du chapitre « Les
 * canaux de distribution », mercatique de terminale, question 2.1 : « Peut-on se passer
 * d'intermédiaires ? »).
 *
 * CE QUI VIENT DES FICHES QUI EXISTENT : les trois enseignes du marché à trois (marche-a-trois.ts :
 * SoundBox, fabriquée en très grandes séries ; Auris, haut de gamme) et le canal indirect de NOVA,
 * CampusTech (mercatique-de-nova.ts).
 *
 * LES HYPOTHÈSES DU COMPLÉMENT, dites ici : où chaque enseigne vend ses enceintes (SoundBox dans toutes
 * les grandes surfaces, NOVA sur son site et chez CampusTech, Auris chez quelques revendeurs agréés), le
 * comparateur de prix en ligne qui s'intercale entre NOVA et ses clients, et le réassort partagé que
 * CampusTech et NOVA mettent en place (les ventes de chaque magasin transmises chaque soir).
 */

export type CodeDeStrategieDeDistribution = "intensive" | "selective" | "exclusive";

const nom = (code: "soundbox" | "auris") => enseigneDe(MARCHE_A_TROIS, code).nom;

/** Où chaque enseigne vend ses enceintes, et la stratégie de distribution que cela fait. */
export const DISTRIBUTION_DES_ENSEIGNES: readonly { libelle: string; strategie: CodeDeStrategieDeDistribution; pourquoi: string }[] = [
  { libelle: `${nom("soundbox")}, dans toutes les grandes surfaces et les stations-service`, strategie: "intensive", pourquoi: "Être présent partout où le client passe : la distribution intensive, pour un produit courant acheté sans réfléchir longtemps." },
  { libelle: `NOVA, sur son site et chez ${CANAL_INDIRECT.nom}, choisie pour ses clients étudiants`, strategie: "selective", pourquoi: "Quelques intermédiaires choisis pour leur clientèle et leur conseil : la distribution sélective." },
  { libelle: `${nom("auris")}, chez un seul revendeur agréé par grande ville`, strategie: "exclusive", pourquoi: "Un revendeur unique sur une zone, qui s'engage à bien présenter la marque : la distribution exclusive, pour le haut de gamme." },
];

/** Le comparateur de prix en ligne (hypothèse du complément). */
export const COMPARATEUR = { nom: "un comparateur de prix en ligne" } as const;

/** Les intermédiaires de NOVA, pour le complément. */
export const intermediaireDeNova = () => CANAL_INDIRECT.nom;
