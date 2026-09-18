import type { CourrierDef } from "./types";
import { RSE_COURRIERS } from "./liasses/rse";
import { NOVA_COURRIERS } from "./liasses/nova";
import { BOUTIQUE_COURRIERS } from "./liasses/boutique";
import { HOTEL_COURRIERS } from "./liasses/hotel";
import { BISTROT_COURRIERS } from "./liasses/bistrot";
import { CONSEIL_COURRIERS } from "./liasses/conseil";
import { ECOMMERCE_COURRIERS } from "./liasses/ecommerce";
import { FITNESS_COURRIERS } from "./liasses/fitness";
import { BATIMENT_COURRIERS } from "./liasses/batiment";
import { TRANSPORT_COURRIERS } from "./liasses/transport";

/**
 * LE REGISTRE DU COURRIER.
 *
 * Toutes les liasses réunies. Chaque scénario ne reçoit que SES courriers : le
 * filtre se fait sur les codes d'événements de la partie jouée (voir
 * `courriersPourCodes`), jamais sur cette liste globale — une partie lancée
 * joue son instantané, pas la version courante du secteur.
 */
export const COURRIERS: CourrierDef[] = [
  ...RSE_COURRIERS,
  ...NOVA_COURRIERS,
  ...BOUTIQUE_COURRIERS,
  ...HOTEL_COURRIERS,
  ...BISTROT_COURRIERS,
  ...CONSEIL_COURRIERS,
  ...ECOMMERCE_COURRIERS,
  ...FITNESS_COURRIERS,
  ...BATIMENT_COURRIERS,
  ...TRANSPORT_COURRIERS,
];

export const courrierParCode = new Map(COURRIERS.map((c) => [c.code, c]));

/**
 * LES LIASSES, NOMMÉES ET NUMÉROTÉES. Un courrier porte une référence :
 * « Nos réf. : NOVA-07/30 » dit à l'élève lequel il tient et à l'enseignant
 * lequel manque à sa liasse imprimée. Les courriers RSE, transverses aux
 * secteurs, forment leur propre liasse.
 */
export const LIASSES: { code: string; nom: string; courriers: CourrierDef[] }[] = [
  { code: "rse", nom: "RSE", courriers: RSE_COURRIERS },
  { code: "nova", nom: "NOVA", courriers: NOVA_COURRIERS },
  { code: "boutique", nom: "MAILLE & CO", courriers: BOUTIQUE_COURRIERS },
  { code: "hotel", nom: "L'ESCALE", courriers: HOTEL_COURRIERS },
  { code: "bistrot", nom: "LA TABLE D'AUGUSTIN", courriers: BISTROT_COURRIERS },
  { code: "conseil", nom: "ATLAS CONSEIL", courriers: CONSEIL_COURRIERS },
  { code: "ecommerce", nom: "PIXEL & CO", courriers: ECOMMERCE_COURRIERS },
  { code: "fitness", nom: "VOLT FITNESS", courriers: FITNESS_COURRIERS },
  { code: "batiment", nom: "MARTEL & FILS", courriers: BATIMENT_COURRIERS },
  { code: "transport", nom: "ROUTE & CIE", courriers: TRANSPORT_COURRIERS },
];

const positions = new Map<string, { liasse: string; index: number; total: number }>();
for (const liasse of LIASSES) {
  liasse.courriers.forEach((c, i) =>
    positions.set(c.code, { liasse: liasse.nom, index: i + 1, total: liasse.courriers.length }),
  );
}

/** « NOVA · 7 / 30 » : la liasse du courrier et sa place dedans. */
export function positionDuCourrier(
  code: string,
): { liasse: string; index: number; total: number } | null {
  return positions.get(code) ?? null;
}

/** La référence portée en tête de lettre : « NOVA-07/30 ». */
export function referenceDuCourrier(code: string): string | null {
  const p = positions.get(code);
  if (!p) return null;
  const liasse = p.liasse.replace(/[^A-Za-zÀ-ÿ0-9]+/g, "").toUpperCase().slice(0, 8);
  return `${liasse}-${String(p.index).padStart(2, "0")}/${p.total}`;
}

/** Courriers destinés à UNE entreprise (distribution ciblée). */
export const COURRIERS_ENTREPRISE_CODES = COURRIERS.filter((c) => c.scope === "team").map(
  (c) => c.code,
);

/** Courriers adressés à tout le marché (distribution générale). */
export const COURRIERS_MARCHE_CODES = COURRIERS.filter((c) => c.scope === "market").map(
  (c) => c.code,
);

/**
 * Les courriers d'un scénario donné, dans l'ordre de la liasse. On passe les
 * codes d'événements du scénario (ou de son instantané) plutôt que son code :
 * une partie déjà lancée joue son instantané.
 */
export function courriersPourCodes(codes: readonly string[]): CourrierDef[] {
  const voulus = new Set(codes);
  return COURRIERS.filter((c) => voulus.has(c.code));
}
