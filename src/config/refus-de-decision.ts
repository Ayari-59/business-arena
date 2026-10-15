import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { PRODUCT_FIELD_PREFIX } from "@/config/decision-source";
import { PREFIXE_VENTES_ESTIMEES } from "@/config/ventes-estimees";
import type { PlafondDInvestissement } from "@/engine/investment/plafond";

/**
 * LA DÉCISION QUI NE PASSE PAS DIT POURQUOI, ET OÙ.
 *
 * Le propriétaire : « C'est mieux d'indiquer l'élément qui ne va pas quand une
 * décision ne passe pas. » Le formulaire de décision laissait le navigateur
 * refuser seul (une bulle native, absente quand le champ était sur une étape
 * repliée), et le serveur répondait « Décisions invalides : vérifiez les
 * montants saisis » : l'élève savait qu'une chose n'allait pas, pas laquelle.
 *
 * Ce module est la langue des refus, pour LES DEUX CÔTÉS. Le navigateur
 * vérifie la saisie avant l'envoi ; l'action serveur traduit ce qu'elle refuse
 * (bornes du schéma, volume nul, financement de sauvetage, tour clos…) dans la
 * même langue, avec le NOM DU CHAMP du formulaire visé : l'écran marque le
 * champ, l'ouvre s'il est replié, et y pose le focus.
 *
 * Trois règles :
 *   · un refus nomme le champ en langage du joueur (« Prix de vente de
 *     Formule du midi »), jamais par son nom technique ;
 *   · il dit la valeur refusée et comment corriger (le minimum, le maximum, le
 *     pas accepté) ;
 *   · aucun texte de bibliothèque ne passe (« Invalid input », « Too big »…) :
 *     un refus qu'on ne sait pas traduire devient une phrase générale.
 *
 * Pur : sans React, sans zod, sans base. Gardé par `tests/unit/refus-de-decision.test.ts`.
 */

/** Un refus : le champ du formulaire qu'il vise (ou `null`), et ce qu'on en dit au joueur. */
export interface ErreurDeChamp {
  champ: string | null;
  message: string;
}

/** De quoi nommer les champs dans la langue du secteur joué. */
export interface ContexteDesLibelles {
  vocabulaire: Pick<ScenarioVocabulary, "priceLabel" | "productionPlanLabel" | "units" | "unit">;
  /** Les références d'une gamme, pour nommer leurs champs. Absent en mono-produit. */
  references?: readonly { code: string; name: string }[] | null;
}

// ── LES BORNES TECHNIQUES ──────────────────────────────────────────────────
// Les garde-fous du schéma serveur (`services/decision-schema.ts`), écrits UNE
// fois : le schéma les lit, le navigateur aussi. Un garde-fou que l'écran ne
// connaîtrait pas serait un refus découvert après l'envoi.

export interface Borne {
  min: number;
  max: number;
  /** Un nombre entier est exigé (personnes). */
  entier?: boolean;
}

export const PRIX_MAX = 10_000;
export const VOLUME_MAX = 50_000;
export const VENTES_ESTIMEES_MAX = 10_000_000;

/** Bornes des champs scalaires, par nom de champ du formulaire. */
export const BORNES_DES_CHAMPS: Readonly<Record<string, Borne>> = {
  price: { min: 1, max: PRIX_MAX },
  // Le volume est un pivot : zéro n'est pas une décision (l'action le refuse).
  productionPlan: { min: 1, max: VOLUME_MAX },
  marketingBudget: { min: 0, max: 200_000 },
  qualityBudget: { min: 0, max: 200_000 },
  maintenanceBudget: { min: 0, max: 100_000 },
  rdBudget: { min: 0, max: 500_000 },
  brandMarketingBudget: { min: 0, max: 200_000 },
  hire: { min: 0, max: 10, entier: true },
  fire: { min: 0, max: 10, entier: true },
  trainingBudget: { min: 0, max: 100_000 },
  // Saisi en pour cent du marché ; le schéma reçoit l'indice (0,8 à 1,3).
  salaryPercent: { min: 80, max: 130 },
  machineCapacityUnits: { min: 0, max: 50_000 },
  newLoan: { min: 0, max: 500_000 },
  loanRepayment: { min: 0, max: 500_000 },
  capitalIncrease: { min: 0, max: 500_000 },
  dividend: { min: 0, max: 1_000_000 },
  discount: { min: 0, max: 1_000_000 },
  factoring: { min: 0, max: 1_000_000 },
  placement: { min: 0, max: 1_000_000 },
  rseBudget: { min: 0, max: 500_000 },
  rseInvestment: { min: 0, max: 500_000 },
  expectedUnits: { min: 0, max: VENTES_ESTIMEES_MAX },
};

/** Bornes des champs d'une référence de gamme (`product.<code>.<champ>`). */
export const BORNES_PAR_REFERENCE: Readonly<Record<string, Borne>> = {
  price: { min: 1, max: PRIX_MAX },
  // Une référence peut ne rien produire ; c'est la gamme ENTIÈRE qui doit produire.
  productionPlan: { min: 0, max: VOLUME_MAX },
  marketingBudget: { min: 0, max: 200_000 },
  qualityBudget: { min: 0, max: 200_000 },
  rdBudget: { min: 0, max: 500_000 },
};

const BORNE_DES_VENTES_ESTIMEES: Borne = { min: 0, max: VENTES_ESTIMEES_MAX };

/** La référence d'un champ de gamme ou de ventes estimées, et le champ visé. */
function decouper(nom: string): { code: string; champ: string } | null {
  if (nom.startsWith(PRODUCT_FIELD_PREFIX)) {
    const reste = nom.slice(PRODUCT_FIELD_PREFIX.length);
    const point = reste.lastIndexOf(".");
    if (point <= 0) return null;
    return { code: reste.slice(0, point), champ: reste.slice(point + 1) };
  }
  if (nom.startsWith(PREFIXE_VENTES_ESTIMEES)) {
    return { code: nom.slice(PREFIXE_VENTES_ESTIMEES.length), champ: "ventesEstimees" };
  }
  return null;
}

/** La référence de gamme que vise un champ, s'il en vise une (`ref-<code>` en parcours). */
export function referenceDuChamp(nom: string): string | null {
  return nom.startsWith(PRODUCT_FIELD_PREFIX) ? (decouper(nom)?.code ?? null) : null;
}

export function borneDuChamp(nom: string): Borne | null {
  const parReference = decouper(nom);
  if (parReference) {
    if (parReference.champ === "ventesEstimees") return BORNE_DES_VENTES_ESTIMEES;
    return BORNES_PAR_REFERENCE[parReference.champ] ?? null;
  }
  return BORNES_DES_CHAMPS[nom] ?? null;
}

// ── LES NOMS DES CHAMPS ────────────────────────────────────────────────────

const LIBELLES: Readonly<Record<string, string>> = {
  marketingBudget: "Budget marketing",
  qualityBudget: "Budget qualité",
  maintenanceBudget: "Budget maintenance",
  rdBudget: "Recherche et développement",
  brandMarketingBudget: "Budget de marque",
  communicationAxis: "Axe de communication",
  hire: "Embauches",
  fire: "Licenciements",
  trainingBudget: "Budget formation",
  salaryPercent: "Salaires (marché = 100)",
  machineCapacityUnits: "Investissement capacité",
  newLoan: "Nouvel emprunt",
  loanRepayment: "Remboursement d'emprunt",
  capitalIncrease: "Augmentation de capital",
  dividend: "Dividende versé aux associés",
  discount: "Escompte",
  factoring: "Affacturage",
  placement: "Placement du surplus",
  rseBudget: "Budget RSE",
  rseInvestment: "Investissement process propre",
  insurance: "Assurance",
  supplierChoice: "Fournisseur",
  acceptOrder: "Commande exceptionnelle",
  equipmentBuyJson: "Achat de machines",
  equipmentSellJson: "Vente de machines",
  justification: "Votre note",
  expectedUnits: "Ventes prévues",
  expectedCash: "Trésorerie prévue",
  rachatCible: "Cible du rachat",
  rachatPrixMaximum: "Prix maximum du rachat",
  rachatPaiement: "Paiement du rachat",
  rachatEmprunt: "Emprunt d'acquisition",
  rachatAugmentation: "Apport d'investisseurs entrants",
  rachatPart: "Part achetée",
  diligence: "Audit d'un site",
};

const LIBELLES_PAR_REFERENCE: Readonly<Record<string, string>> = {
  marketingBudget: "Marketing",
  qualityBudget: "Qualité",
  rdBudget: "R&D",
  supplierChoice: "Fournisseur",
  ventesEstimees: "Ventes estimées",
};

/** Le nom d'un champ du formulaire, dans la langue du secteur : « Prix de vente de NOVA One ». */
export function libelleDuChamp(nom: string, ctx: ContexteDesLibelles): string {
  const v = ctx.vocabulaire;
  const parReference = decouper(nom);
  if (parReference) {
    const reference = ctx.references?.find((r) => r.code === parReference.code)?.name;
    const base =
      parReference.champ === "price"
        ? v.priceLabel
        : parReference.champ === "productionPlan"
          ? v.productionPlanLabel
          : (LIBELLES_PAR_REFERENCE[parReference.champ] ?? "Ce champ");
    // En mono-produit, les ventes estimées n'ont qu'une référence : on ne la nomme pas.
    if (!reference || (parReference.champ === "ventesEstimees" && !ctx.references?.length)) return base;
    return `${base} de ${reference}`;
  }
  if (nom === "price") return v.priceLabel;
  if (nom === "productionPlan") return v.productionPlanLabel;
  const groupe = /^(sousTraitance|reseauEtranger|fabricationEtrangere)\.(?:[^.]+\.)?([^.]+)$/.exec(nom);
  if (groupe) {
    const reference = ctx.references?.find((r) => r.code === groupe[2])?.name ?? groupe[2];
    const base =
      groupe[1] === "sousTraitance"
        ? "Sous-traitance"
        : groupe[1] === "reseauEtranger"
          ? "Ventes par le réseau étranger"
          : "Fabrication à l'étranger";
    return `${base} de ${reference}`;
  }
  return LIBELLES[nom] ?? "Ce champ";
}

/** L'unité d'un champ, pour écrire une valeur : euros, pièces, personnes, pour cent. */
type Unite = "€" | "unites" | "personnes" | "pour-cent";

function uniteDuChamp(nom: string): Unite {
  const parReference = decouper(nom);
  const champ = parReference?.champ ?? nom;
  if (champ === "productionPlan" || champ === "ventesEstimees" || champ === "expectedUnits") return "unites";
  if (champ === "machineCapacityUnits") return "unites";
  if (/^(sousTraitance|reseauEtranger|fabricationEtrangere)\./.test(champ)) return "unites";
  if (champ === "hire" || champ === "fire") return "personnes";
  if (champ === "salaryPercent") return "pour-cent";
  return "€";
}

const nombreFr = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n).replace(/^-/, "−");

/** Une valeur écrite avec son unité : « 12,5 € », « 0 enceinte », « 3 personnes ». */
export function ecrireValeur(n: number, nom: string, ctx: ContexteDesLibelles): string {
  const unite = uniteDuChamp(nom);
  const chiffre = nombreFr(n);
  if (unite === "€") return `${chiffre} €`;
  if (unite === "pour-cent") return `${chiffre} %`;
  if (unite === "personnes") return `${chiffre} personne${Math.abs(n) >= 2 ? "s" : ""}`;
  return `${chiffre} ${Math.abs(n) >= 2 ? ctx.vocabulaire.units : ctx.vocabulaire.unit}`;
}

/**
 * Ce que le maximum veut dire, quand il n'est pas un simple garde-fou : les
 * plafonds que le moteur appliquerait en silence (voir `ChampPlafonne`).
 */
const RAISON_DU_MAXIMUM: Readonly<Record<string, string>> = {
  newLoan: "ce que la banque prête encore",
  capitalIncrease: "ce qui reste de l'enveloppe des associés",
  dividend: "les réserves distribuables",
};

// ── LE REFUS D'UNE SAISIE ──────────────────────────────────────────────────

/** Une saisie telle que le navigateur la porte, prête à être jugée. */
export interface SaisieDuChamp {
  nom: string;
  /** Le texte du champ ; vide quand rien n'est saisi (ou que le navigateur n'a pas pu le lire). */
  brut: string;
  /** Le navigateur a reçu des caractères qui ne font pas un nombre (`validity.badInput`). */
  illisible?: boolean;
  requis?: boolean;
  /** Les bornes posées sur le champ lui-même (`min`, `max`, `step`). */
  min?: number | null;
  max?: number | null;
  pas?: number | null;
}

/** Ce qui ne va pas dans une saisie, avant d'en écrire le message. */
export type RaisonDuRefus =
  | { type: "vide" }
  | { type: "illisible" }
  | { type: "sous-le-minimum"; valeur: number; min: number }
  | { type: "au-dessus-du-maximum"; valeur: number; max: number; raison?: string }
  | { type: "pas"; valeur: number; pas: number };

const proche = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** Les deux valeurs acceptées qui encadrent une saisie hors pas. */
function voisins(valeur: number, pas: number): [number, number] {
  const bas = Math.floor(valeur / pas + 1e-9) * pas;
  const arrondir = (x: number) => Math.round(x * 1e6) / 1e6;
  return [arrondir(bas), arrondir(bas + pas)];
}

/** Écrit le message d'un refus : le champ, la valeur refusée, et ce qui est accepté. */
export function messageDuRefus(nom: string, raison: RaisonDuRefus, ctx: ContexteDesLibelles): string {
  const libelle = libelleDuChamp(nom, ctx);
  const ecrire = (n: number) => ecrireValeur(n, nom, ctx);
  const borne = borneDuChamp(nom);
  switch (raison.type) {
    case "vide": {
      const min = borne?.min ?? 0;
      return min > 0
        ? `${libelle} : la case est vide. Saisissez au moins ${ecrire(min)}.`
        : `${libelle} : la case est vide. Saisissez une valeur (${ecrire(0)} si vous n'engagez rien).`;
    }
    case "illisible":
      return `${libelle} : la saisie n'est pas un nombre. Saisissez des chiffres, avec une virgule pour les décimales.`;
    case "sous-le-minimum":
      return `${libelle} : ${ecrire(raison.valeur)} est sous le minimum accepté. Minimum accepté : ${ecrire(raison.min)}.`;
    case "au-dessus-du-maximum":
      return `${libelle} : ${ecrire(raison.valeur)} dépasse ${raison.raison ?? "le maximum accepté"}. Maximum accepté : ${ecrire(raison.max)}.`;
    case "pas": {
      const [bas, haut] = voisins(raison.valeur, raison.pas);
      const quoi =
        proche(raison.pas, 1)
          ? "n'est pas un nombre entier"
          : `ne tombe pas sur le pas de saisie (${ecrire(raison.pas)})`;
      return `${libelle} : ${ecrire(raison.valeur)} ${quoi}. Saisissez ${ecrire(bas)} ou ${ecrire(haut)}.`;
    }
  }
}

/** Lit un nombre écrit à la française ou à l'anglaise ; `null` s'il n'en est pas un. */
export function lireNombre(brut: string): number | null {
  const texte = brut.trim().replace(/\s/g, "").replace(",", ".");
  if (texte === "") return null;
  const n = Number(texte);
  return Number.isFinite(n) ? n : null;
}

/**
 * Juge une saisie : les bornes du champ (celles que l'écran pose, comme le
 * plafond de l'emprunt) ET les garde-fous du schéma serveur, la plus stricte
 * des deux l'emportant. `null` : la saisie passe.
 */
export function raisonDuRefus(s: SaisieDuChamp): RaisonDuRefus | null {
  if (s.illisible) return { type: "illisible" };
  const valeur = lireNombre(s.brut);
  if (s.brut.trim() === "") return s.requis ? { type: "vide" } : null;
  if (valeur === null) return { type: "illisible" };
  const borne = borneDuChamp(s.nom);
  const mins = [s.min, borne?.min].filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  const maxs = [s.max, borne?.max].filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  const min = mins.length > 0 ? Math.max(...mins) : null;
  const max = maxs.length > 0 ? Math.min(...maxs) : null;
  if (min !== null && valeur < min && !proche(valeur, min)) return { type: "sous-le-minimum", valeur, min };
  if (max !== null && valeur > max && !proche(valeur, max)) {
    // Le plafond de l'écran (la banque, les associés, les réserves) a sa raison ;
    // le garde-fou du schéma n'en a pas d'autre que d'arrêter la faute de frappe.
    const plafondDeLEcran = typeof s.max === "number" && proche(s.max, max);
    const raison = plafondDeLEcran ? RAISON_DU_MAXIMUM[s.nom] : undefined;
    return { type: "au-dessus-du-maximum", valeur, max, ...(raison ? { raison } : {}) };
  }
  const pas = borne?.entier ? 1 : s.pas;
  if (pas && pas > 0) {
    const quotient = valeur / pas;
    if (Math.abs(quotient - Math.round(quotient)) > 1e-6) return { type: "pas", valeur, pas };
  }
  return null;
}

/** Le refus d'une saisie, prêt à afficher ; `null` si elle passe. */
export function erreurDuChamp(s: SaisieDuChamp, ctx: ContexteDesLibelles): ErreurDeChamp | null {
  const raison = raisonDuRefus(s);
  return raison ? { champ: s.nom, message: messageDuRefus(s.nom, raison, ctx) } : null;
}

// ── LE VOLUME, PIVOT DU TOUR ───────────────────────────────────────────────

/**
 * LE VOLUME NE PEUT PAS ÊTRE NUL : produire zéro n'est pas une décision, c'est
 * une absence (audit croisé §07). En mono-produit le refus vise le plan de
 * production ; en gamme, la somme des références, et donc le plan de la
 * première référence en vente.
 */
export function refusDuVolume(champ: string, ctx: ContexteDesLibelles): ErreurDeChamp {
  const v = ctx.vocabulaire;
  const gamme = champ.startsWith(PRODUCT_FIELD_PREFIX);
  return {
    champ,
    message: gamme
      ? `${v.productionPlanLabel} : le volume total de vos références doit être ≥ 1 (en ${v.units}). Saisissez au moins 1 ${v.unit} sur une référence.`
      : `${v.productionPlanLabel} : le volume doit être ≥ 1 (en ${v.units}). Saisissez au moins 1 ${v.unit}.`,
  };
}

// ── LES REFUS DU SCHÉMA SERVEUR ────────────────────────────────────────────

/** Ce que l'action retient d'un refus du schéma : de quoi l'écrire, rien de plus. */
export interface RefusDuSchema {
  code: string;
  path: readonly PropertyKey[];
  minimum?: number | bigint;
  maximum?: number | bigint;
}

/**
 * Le champ du formulaire d'un chemin du schéma. `null` quand la décision n'a
 * pas de champ visible (le parc de machines, envoyé en JSON caché ; les études).
 */
export function champDuChemin(
  path: readonly PropertyKey[],
  ctx?: ContexteDesLibelles,
  /** La première référence d'une gamme, quand le contexte ne nomme pas les références. */
  premiereReference?: string,
): string | null {
  const [tete, deux, trois] = path.map((p) => String(p));
  if (!tete) return null;
  switch (tete) {
    case "products":
      return deux && trois ? `${PRODUCT_FIELD_PREFIX}${deux}.${trois}` : null;
    case "finance":
    case "treasury":
    case "forecast":
      return deux ?? null;
    case "hr":
      return deux === "salaryIndex" ? "salaryPercent" : (deux ?? null);
    case "rse":
      return deux === "budget" ? "rseBudget" : deux === "investment" ? "rseInvestment" : null;
    case "investment":
      if (deux === "machineCapacityUnits") return "machineCapacityUnits";
      if (deux === "equipmentBuy") return "equipmentBuyJson";
      if (deux === "equipmentSell") return "equipmentSellJson";
      return null;
    case "salesEstimate":
      return deux === "byProduct" && trois ? `${PREFIXE_VENTES_ESTIMEES}${trois}` : null;
    case "studies":
      return null;
    // Niveau 7 : le montage du rachat a ses cases ; l'audit, sa liste.
    case "rachat":
      return deux ? (CHAMPS_DU_RACHAT[deux] ?? "rachatCible") : "rachatCible";
    case "diligence":
      return "diligence";
    case "sousTraitance":
      return deux ? `sousTraitance.${deux}` : null;
    case "reseauEtranger":
    case "fabricationEtrangere":
      return deux && trois ? `${tete}.${deux}.${trois}` : null;
    default: {
      // En gamme, prix, volume et budgets sont DÉRIVÉS des références : le
      // refus d'un scalaire dérivé vise la première référence.
      const premiere = ctx?.references?.[0]?.code ?? premiereReference;
      if (premiere && ["price", "productionPlan", "marketingBudget", "qualityBudget", "rdBudget"].includes(tete)) {
        return `${PRODUCT_FIELD_PREFIX}${premiere}.${tete}`;
      }
      return tete;
    }
  }
}

/** Les cases du montage d'un rachat (niveau 7), par chemin du schéma. */
const CHAMPS_DU_RACHAT: Readonly<Record<string, string>> = {
  cible: "rachatCible",
  prixMaximum: "rachatPrixMaximum",
  paiement: "rachatPaiement",
  emprunt: "rachatEmprunt",
  augmentationDeCapital: "rachatAugmentation",
  part: "rachatPart",
};

/** Les champs qui n'ont pas de case à l'écran : leur refus se lit au récapitulatif. */
const SANS_CASE = new Set(["equipmentBuyJson", "equipmentSellJson"]);

function valeurAuChemin(entree: unknown, path: readonly PropertyKey[]): unknown {
  let x: unknown = entree;
  for (const p of path) {
    if (x === null || typeof x !== "object") return undefined;
    x = (x as Record<PropertyKey, unknown>)[p as string];
  }
  return x;
}

/**
 * Traduit les refus du schéma serveur. Chacun nomme son champ et dit la
 * borne ; un code qu'on ne sait pas lire devient une phrase générale sur le
 * champ, jamais le texte de la bibliothèque.
 */
export function erreursDuSchema(
  refus: readonly RefusDuSchema[],
  entree: unknown,
  ctx: ContexteDesLibelles,
): ErreurDeChamp[] {
  const vues = new Set<string>();
  const out: ErreurDeChamp[] = [];
  const produits = valeurAuChemin(entree, ["products"]);
  const premiereReference =
    produits && typeof produits === "object" ? Object.keys(produits)[0] : undefined;
  // EN GAMME, UN SCALAIRE DÉRIVÉ REFUSÉ ne fait que répéter le refus d'une
  // référence (un prix vide fait une moyenne illisible) : on ne garde que
  // celui de la référence, qui dit laquelle.
  const parReference = new Set(
    refus.filter((r) => String(r.path[0]) === "products").map((r) => String(r.path[2] ?? "")),
  );
  for (const r of refus) {
    if (r.path.length === 1 && parReference.has(String(r.path[0]))) continue;
    const champ = champDuChemin(r.path, ctx, premiereReference);
    const cle = champ ?? r.path.map(String).join(".");
    if (vues.has(cle)) continue;
    vues.add(cle);
    const nom = champ ?? "";
    const libelle = champ ? libelleDuChamp(champ, ctx) : "Une décision du tour";
    // L'indice de salaire part en fraction (0,8) ; l'écran le saisit en pour cent (80).
    const echelle = champ === "salaryPercent" ? 100 : 1;
    const brut = valeurAuChemin(entree, r.path);
    const valeur = (() => {
      if (typeof brut === "number") return Number.isFinite(brut) ? brut * echelle : null;
      if (typeof brut === "string") {
        const n = lireNombre(brut);
        return n === null ? null : n * echelle;
      }
      return null;
    })();
    let message: string;
    if (r.code === "too_small" && r.minimum !== undefined && valeur !== null && champ) {
      message = messageDuRefus(champ, { type: "sous-le-minimum", valeur, min: Number(r.minimum) * echelle }, ctx);
    } else if (r.code === "too_big" && r.maximum !== undefined && valeur !== null && champ) {
      message = messageDuRefus(champ, { type: "au-dessus-du-maximum", valeur, max: Number(r.maximum) * echelle }, ctx);
    } else if ((r.code === "not_multiple_of" || r.code === "invalid_type") && champ && valeur !== null) {
      // Un nombre refusé pour son type : c'est un entier qu'on attendait (personnes).
      message = messageDuRefus(champ, { type: "pas", valeur, pas: 1 }, ctx);
    } else if (r.code === "invalid_type" && champ) {
      // Le formulaire lit une case vide comme « pas un nombre » : on dit les deux.
      message =
        typeof brut === "string" && brut.trim() !== ""
          ? messageDuRefus(champ, { type: "illisible" }, ctx)
          : messageDuRefus(champ, { type: "vide" }, ctx);
    } else if (r.code === "invalid_value" || r.code === "invalid_enum_value" || r.code === "invalid_union") {
      message = `${libelle} : ce choix n'est pas proposé ce tour. Choisissez une option de la liste.`;
    } else {
      message = `${libelle} : la valeur envoyée n'est pas acceptée. Vérifiez-la, puis validez à nouveau.`;
    }
    out.push({ champ: champ && !SANS_CASE.has(nom) ? champ : null, message });
  }
  return out;
}

// ── LES REFUS DU SERVICE ───────────────────────────────────────────────────

/** Le préfixe technique que la résolution ajoute à ses erreurs (`enrichError`). */
const PREFIXE_DE_RESOLUTION = /^Résolution tour \d+ \(partie [^)]*\)(?: équipe \S+)?: /;

/**
 * LES REFUS QUE LE JOUEUR PEUT COMPRENDRE, et ce qu'il peut y faire. Tout le
 * reste (un état incohérent, un bilan déséquilibré, une base qui ne répond
 * pas) est une panne : on ne lui montre pas l'intérieur du moteur.
 */
const REFUS_CONNUS: readonly [RegExp, (m: string) => string][] = [
  [/^Ce tour n'est pas ouvert$/, () => "Ce tour n'est plus ouvert aux décisions : il vient d'être clos, ou pas encore ouvert. Rechargez la page pour voir où en est la partie."],
  [/^Ce tour est déjà en cours de résolution$/, () => "Ce tour est déjà en train d'être simulé : un autre envoi est parti avant celui-ci. Patientez quelques secondes, puis rechargez la page."],
  [/^Cette partie est terminée$/, () => "Cette partie est terminée : elle ne reçoit plus de décisions. Rechargez la page pour lire le bilan."],
  [/^Partie introuvable$/, () => "Cette partie est introuvable. Rechargez la page, ou relancez une partie depuis l'accueil."],
  [/^Vous n'êtes pas membre de cette partie$/, () => "Cet appareil ne fait partie d'aucune équipe de cette partie. Rejoignez-la à nouveau avec son code."],
  [/^Mode compétition : vos décisions sont verrouillées après validation$/, () => "Mode compétition : vos décisions sont déjà validées pour ce tour et ne se modifient plus."],
  [/^Cette partie a été archivée par l'enseignant\.$/, (m) => `${m} Elle ne reçoit plus de décisions.`],
  // Le verrou de planning (`services/play-lock`) parle déjà au joueur.
  [/^Ce tour (ouvre le |est clôturé|n'est pas encore ouvert)/, (m) => `${m} Vos décisions n'ont pas été envoyées.`],
];

export const MESSAGE_DE_PANNE =
  "La simulation du tour n'a pas pu se faire : vos saisies sont conservées. Réessayez dans un instant ; si le refus revient, prévenez votre enseignant.";

/** Le refus d'un service, dans la langue du joueur ; une panne devient une phrase générale. */
export function messageDuRefusServeur(erreur: unknown): string {
  let brut = erreur instanceof Error ? erreur.message : typeof erreur === "string" ? erreur : "";
  // L'erreur enrichie garde l'originale en cause : c'est elle qui parle.
  const cause = erreur instanceof Error ? erreur.cause : undefined;
  if (cause instanceof Error && cause.message) brut = cause.message;
  const message = brut.replace(PREFIXE_DE_RESOLUTION, "").trim();
  for (const [motif, traduire] of REFUS_CONNUS) {
    if (motif.test(message)) return traduire(message);
  }
  return MESSAGE_DE_PANNE;
}

// ── LE PLAFOND D'INVESTISSEMENT ────────────────────────────────────────────

/**
 * L'ACHAT D'UNE MACHINE, CHAMP PAR CHAMP. Le parc part au serveur en JSON caché
 * (`equipmentBuyJson`), sans case à marquer : chaque case « Acheter » porte donc
 * son propre nom, `equipmentBuy.<type>`, que le refus du plafond vise. Le
 * serveur ne lit pas ces cases ; il juge le JSON, et nomme la case du premier
 * type acheté.
 */
export const PREFIXE_ACHAT_DE_MACHINE = "equipmentBuy.";
export const champDAchatDeMachine = (code: string) => `${PREFIXE_ACHAT_DE_MACHINE}${code}`;

/** Ce que le plafond dit, et de quoi l'écrire : les chiffres du calcul (`engine/investment/plafond`). */
export type PlafondAEcrire = Pick<
  PlafondDInvestissement,
  "applique" | "marge" | "effectif" | "mainDOeuvre" | "machineDisponible" | "disponibilite" | "unite"
>;

type VocabulaireDuPlafond = Pick<ScenarioVocabulary, "unit" | "units" | "plafond">;

/** Les mots d'un scénario qui n'en déclare pas (un scénario de l'enseignant). */
const MOTS_DU_PLAFOND_PAR_DEFAUT = {
  equipeFait: "peut assurer",
  parcEnFait: "votre équipement en assure",
  enTrop: "un équipement resterait inemployé",
} as const;

const entier = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
const enUnites = (n: number, v: VocabulaireDuPlafond) => `${entier(n)} ${Math.round(n) >= 2 ? v.units : v.unit}`;

/** « votre équipe de 4 personnes fait tourner 7 200 enceintes par tour ; vos machines en font déjà 7 000 » */
function constatDuPlafond(p: PlafondAEcrire, v: VocabulaireDuPlafond): string {
  const mots = v.plafond ?? MOTS_DU_PLAFOND_PAR_DEFAUT;
  const personnes = `${p.effectif} personne${p.effectif >= 2 ? "s" : ""}`;
  const dispo =
    p.disponibilite < 0.995 ? ` (à ${Math.round(p.disponibilite * 100)} % de disponibilité)` : "";
  return `votre équipe de ${personnes} ${mots.equipeFait} ${enUnites(p.mainDOeuvre, v)} par tour ; ${mots.parcEnFait} déjà ${entier(p.machineDisponible)}${dispo}`;
}

/**
 * LE REFUS : « Investissement : votre équipe de 4 personnes fait tourner 7 200
 * enceintes par tour ; vos machines en font déjà 7 000. Au-delà de 200
 * enceintes de capacité en plus, une machine resterait à l'arrêt. Les
 * embauches s'ouvrent au niveau 4. » Le niveau des embauches est lu dans les
 * préréglages (`premierNiveauQuiOuvre`).
 */
export function messageDuPlafond(
  p: PlafondAEcrire,
  v: VocabulaireDuPlafond,
  niveauDesEmbauches: number | null,
): string {
  const mots = v.plafond ?? MOTS_DU_PLAFOND_PAR_DEFAUT;
  const limite =
    p.marge > 0
      ? `Au-delà de ${enUnites(p.marge, v)} de capacité en plus, ${mots.enTrop}.`
      : `Toute capacité en plus serait de trop : ${mots.enTrop}.`;
  const embauches = niveauDesEmbauches ? ` Les embauches s'ouvrent au niveau ${niveauDesEmbauches}.` : "";
  return `Investissement : ${constatDuPlafond(p, v)}. ${limite}${embauches}`;
}

/**
 * L'AIDE SOUS LE CHAMP, AVANT TOUTE ERREUR : jusqu'où l'on peut investir à ce
 * niveau. Là où les embauches sont ouvertes, il n'y a pas de plafond : l'aide
 * dit seulement à partir d'où une capacité en plus demandera d'embaucher.
 * `null` : le scénario n'ouvre aucun investissement.
 */
export function aideDuPlafond(p: PlafondAEcrire, v: VocabulaireDuPlafond): string | null {
  if (!p.unite) return null;
  if (!p.applique) {
    return p.marge > 0
      ? `Au-delà de ${enUnites(p.marge, v)} de capacité en plus, il faudra embaucher pour la faire tourner.`
      : "Votre équipe est déjà le goulot : une capacité en plus demandera d'embaucher.";
  }
  if (p.marge <= 0) {
    return `À ce niveau, aucune capacité en plus : ${constatDuPlafond(p, v)}.`;
  }
  const phrase = `Jusqu'à ${enUnites(p.marge, v)} de capacité en plus à ce niveau.`;
  if (p.unite.type === "machines") {
    const tiennent = p.unite.machines.some((m) => m.maxSousLePlafond > 0);
    if (!tiennent && p.unite.machines.length > 0) {
      const petite = [...p.unite.machines].sort((a, b) => a.capacite - b.capacite)[0]!;
      return `${phrase} La plus petite, ${petite.nom}, en ajoute ${entier(petite.capacite)} : aucune n'entre sous ce plafond.`;
    }
  }
  return phrase;
}

/**
 * LE REFUS DU PLAFOND, rattaché à son champ : la case « Acheter » du premier
 * type acheté (parc typé), ou l'investissement de capacité. `null` : la
 * décision passe. Le jugement (`depasse`) vient du calcul du plafond, des deux
 * côtés ; ce module ne fait que l'écrire.
 */
export function refusDuPlafond(args: {
  plafond: PlafondAEcrire;
  depasse: boolean;
  /** Les types achetés, dans l'ordre du parc : le premier porte le refus. */
  typesAchetes: readonly string[];
  vocabulaire: VocabulaireDuPlafond;
  niveauDesEmbauches: number | null;
}): ErreurDeChamp | null {
  if (!args.depasse) return null;
  const champ =
    args.plafond.unite?.type === "machines"
      ? args.typesAchetes[0]
        ? champDAchatDeMachine(args.typesAchetes[0])
        : null
      : "machineCapacityUnits";
  return { champ, message: messageDuPlafond(args.plafond, args.vocabulaire, args.niveauDesEmbauches) };
}

// ── LE RÉSUMÉ ──────────────────────────────────────────────────────────────

/** La phrase de tête du récapitulatif : combien de décisions ne passent pas. */
export function titreDuRecapitulatif(n: number): string {
  return n <= 1
    ? "Une décision ne passe pas. Corrigez-la, puis validez à nouveau."
    : `${n} décisions ne passent pas. Corrigez-les, puis validez à nouveau.`;
}

/** Le texte unique d'un refus, pour qui ne lit qu'une ligne (l'état de l'action). */
export function resumeDesRefus(erreurs: readonly ErreurDeChamp[]): string | null {
  if (erreurs.length === 0) return null;
  if (erreurs.length === 1) return erreurs[0]!.message;
  return `${titreDuRecapitulatif(erreurs.length)} ${erreurs.map((e) => e.message).join(" ")}`;
}

/** L'identifiant d'un champ, pour les liens du récapitulatif et `aria-describedby`. */
export function idDuChamp(nom: string): string {
  return `champ-${nom.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
