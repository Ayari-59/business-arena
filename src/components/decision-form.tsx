"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { playRoundAction, type PlayRoundState } from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import {
  pivotFieldsFor,
  pivotsNonTouches,
  productFieldName,
  readProductFields,
  type PivotField,
  type PivotFieldInfo,
} from "@/config/decision-source";
import { scalarsOfGamme } from "@/engine/gamme";
import type { RoundDecisions } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import type { GameView } from "@/services/game-view.service";
import { formatEuro, formatEuroCents, formatUnits } from "@/lib/format";
import {
  bloqueLaValidation,
  messageSauvetage,
  verdictSauvetage,
  type ExigenceSauvetage,
  type VerdictSauvetage,
} from "@/services/sauvetage";
import { COMMUNICATION_AXIS_LABELS } from "@/engine/market/communication";
import { SimulationProgress } from "@/components/simulation-progress";
import { NomReference } from "@/components/nom-reference";
import {
  cleBrouillon,
  ecrireBrouillon,
  effacerBrouillon,
  effacerBrouillonsAnterieurs,
  lireBrouillon,
  type Brouillon,
} from "@/lib/brouillon-decisions";

const initialState: PlayRoundState = { error: null };

type ChampSaisi = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Repose une valeur dans un champ, de façon que React la voie.
 *
 * React garde une copie de la valeur de chaque champ pour filtrer les
 * événements qu'il juge redondants : écrire `champ.value` puis émettre un
 * événement ne déclencherait donc RIEN. On passe par le setter natif du
 * prototype, qui met à jour le champ et cette copie, avant d'émettre.
 * Sans quoi la marge en temps réel, le façonnier choisi et l'axe de
 * communication resteraient sur leur valeur d'origine après restauration.
 */
function poserValeur(champ: ChampSaisi, valeur: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(champ) as object,
    "value",
  )?.set;
  if (setter) setter.call(champ, valeur);
  else champ.value = valeur;
  champ.dispatchEvent(new Event("input", { bubbles: true }));
  // Un `<select>` écoute `change`, pas `input`.
  if (champ instanceof HTMLSelectElement) {
    champ.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/** Relit les quantités du parc machines depuis leur champ caché en JSON. */
function quantitesDepuisJson(json: string | undefined): Record<string, number> {
  if (!json) return {};
  try {
    const lu: unknown = JSON.parse(json);
    if (!Array.isArray(lu)) return {};
    const q: Record<string, number> = {};
    for (const ligne of lu) {
      if (typeof ligne !== "object" || ligne === null) continue;
      const { typeCode, quantity } = ligne as { typeCode?: unknown; quantity?: unknown };
      if (typeof typeCode === "string" && typeof quantity === "number" && quantity > 0) {
        q[typeCode] = quantity;
      }
    }
    return q;
  } catch {
    return {};
  }
}

function EquipmentPanel({
  offer,
  vocabulary,
  buyQty,
  setBuyQty,
  sellQty,
  setSellQty,
}: {
  offer: NonNullable<Parameters<typeof DecisionForm>[0]["equipmentOffer"]>;
  vocabulary: ScenarioVocabulary;
  buyQty: Record<string, number>;
  setBuyQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sellQty: Record<string, number>;
  setSellQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const totalCapacity = offer.fleet.reduce((sum, f) => {
    const typ = offer.types.find((t) => t.code === f.typeCode);
    return sum + (typ ? f.count * typ.capacityPerUnit : 0);
  }, 0);
  const totalPending = offer.pendingFleet.reduce((sum, f) => {
    const typ = offer.types.find((t) => t.code === f.typeCode);
    return sum + (typ ? f.count * typ.capacityPerUnit : 0);
  }, 0);
  const buyImpact = offer.types.reduce((sum, t) => sum + (buyQty[t.code] ?? 0) * t.capacityPerUnit, 0);
  const sellImpact = offer.types.reduce((sum, t) => sum + (sellQty[t.code] ?? 0) * t.capacityPerUnit, 0);
  const totalCost = offer.types.reduce((sum, t) => sum + (buyQty[t.code] ?? 0) * t.costPerUnit, 0);
  const totalSale = offer.types.reduce((sum, t) => {
    const f = offer.fleet.find((fl) => fl.typeCode === t.code);
    if (!f || !f.count) return sum;
    const avgBook = f.bookValue / f.count;
    return sum + (sellQty[t.code] ?? 0) * avgBook * t.resaleRatio;
  }, 0);

  return (
    <Family
      legend="🏭 Parc machines · investir ou céder"
      tone="border-indigo-400/25 bg-indigo-950/20"
      legendClass="text-xs font-semibold uppercase tracking-wide text-indigo-300"
    >
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <span className="text-slate-400">Capacité en service</span>
        <span className="text-right text-slate-200">
          {Math.round(totalCapacity).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
        </span>
        {totalPending > 0 ? (
          <>
            <span className="text-slate-400">En cours d&apos;installation</span>
            <span className="text-right text-emerald-300">
              +{Math.round(totalPending).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
            </span>
          </>
        ) : null}
      </div>
      <div className="space-y-3">
        {offer.types.map((t) => {
          const fl = offer.fleet.find((f) => f.typeCode === t.code);
          const pend = offer.pendingFleet.find((f) => f.typeCode === t.code);
          const owned = fl?.count ?? 0;
          const pendCount = pend?.count ?? 0;
          const buy = buyQty[t.code] ?? 0;
          const sell = sellQty[t.code] ?? 0;
          const avgBook = owned > 0 ? (fl?.bookValue ?? 0) / owned : 0;
          return (
            <div key={t.code} className="rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-200">{t.name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {Math.round(t.capacityPerUnit).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}/u
                  </span>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-slate-400">
                  {owned} en service{pendCount > 0 ? ` + ${pendCount} en attente` : ""}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>{t.costPerUnit.toLocaleString("fr-FR")} €/u</span>
                <span>Amorti en {Math.round(t.depreciationRounds)} tours</span>
                <span>Maintenance ×{t.maintenanceMultiplier.toLocaleString("fr-FR")}</span>
                {owned > 0 ? (
                  <span>VNC moy. {Math.round(avgBook).toLocaleString("fr-FR")} €</span>
                ) : null}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                    Acheter
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 rounded border border-white/10 bg-slate-950 px-2 py-1 focus-within:border-emerald-400/60">
                    <input
                      type="number"
                      min={0}
                      max={t.maxPerRound}
                      value={buy}
                      onChange={(e) =>
                        setBuyQty((prev) => ({
                          ...prev,
                          [t.code]: Math.min(t.maxPerRound, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-slate-100 outline-none"
                    />
                    <span className="shrink-0 text-xs text-slate-400">max {t.maxPerRound}</span>
                  </span>
                  {buy > 0 ? (
                    <span className="mt-0.5 block text-xs text-emerald-300/80">
                      = {(buy * t.costPerUnit).toLocaleString("fr-FR")} €
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-red-400">
                    Vendre
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 rounded border border-white/10 bg-slate-950 px-2 py-1 focus-within:border-red-400/60">
                    <input
                      type="number"
                      min={0}
                      max={owned}
                      value={sell}
                      onChange={(e) =>
                        setSellQty((prev) => ({
                          ...prev,
                          [t.code]: Math.min(owned, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-slate-100 outline-none"
                    />
                    <span className="shrink-0 text-xs text-slate-400">max {owned}</span>
                  </span>
                  {sell > 0 ? (
                    <span className="mt-0.5 block text-xs text-red-300/80">
                      = {Math.round(sell * avgBook * t.resaleRatio).toLocaleString("fr-FR")} € (VNC {Math.round(sell * avgBook).toLocaleString("fr-FR")} €)
                    </span>
                  ) : null}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {(buyImpact > 0 || sellImpact > 0) ? (
        <div className="mt-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {buyImpact > 0 ? (
              <>
                <span className="text-emerald-400">Capacité ajoutée (t+1)</span>
                <span className="text-right tabular-nums text-emerald-300">
                  +{Math.round(buyImpact).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
                </span>
                <span className="text-slate-400">Investissement</span>
                <span className="text-right tabular-nums text-slate-200">
                  {totalCost.toLocaleString("fr-FR")} €
                </span>
              </>
            ) : null}
            {sellImpact > 0 ? (
              <>
                <span className="text-red-400">Capacité retirée</span>
                <span className="text-right tabular-nums text-red-300">
                  −{Math.round(sellImpact).toLocaleString("fr-FR")} {vocabulary.perRoundLabel}
                </span>
                <span className="text-slate-400">Produit de cession</span>
                <span className="text-right tabular-nums text-slate-200">
                  {Math.round(totalSale).toLocaleString("fr-FR")} €
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Les machines achetées entrent en service au tour suivant. La revente se fait à la
        valeur de marché (VNC × ratio de revente) : vendre en dessous de la VNC génère une
        perte de cession, un coût bien réel que le résultat encaisse.
      </p>
    </Family>
  );
}

function Field({
  name,
  label,
  defaultValue,
  step = 1,
  suffix,
  hint,
  onValueChange,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step?: number;
  suffix: string;
  hint?: string;
  /** Remonte la valeur saisie, pour les champs qu'une règle doit suivre en direct. */
  onValueChange?: (valeur: number) => void;
}) {
  return (
    <label className="block">
      <span className="block min-h-8 leading-4 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-lg border border-white/5 bg-slate-950 px-3 py-2 focus-within:border-amber-400/60">
        <input
          type="number"
          name={name}
          defaultValue={defaultValue}
          step={step}
          min={0}
          required
          onChange={
            onValueChange
              ? (e) => {
                  const v = Number(e.currentTarget.value.replace(",", "."));
                  onValueChange(Number.isFinite(v) ? v : 0);
                }
              : undefined
          }
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none"
        />
        <span className="shrink-0 text-xs text-slate-400">{suffix}</span>
      </span>
      {hint ? <span className="mt-1 block text-[13px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

/**
 * GAMME : un prix, un volume, un marketing — et, quand le niveau et le
 * scénario les ouvrent, un budget qualité et un fournisseur — PAR RÉFÉRENCE.
 * Chaque ligne rappelle ce qu'il faut pour décider — le prix usuel de la
 * clientèle dominante, le coût variable, le stock en réserve et la saison du
 * tour —, parce que c'est ici que se joue le mix. Les scalaires historiques
 * (prix moyen, volume total, qualité totale, fournisseur dominant) sont
 * dérivés côté serveur : aucun champ scalaire n'est envoyé pour ces décisions.
 */
/** Le multiplicateur d'un fournisseur, lu par rapport au fournisseur de RÉFÉRENCE de son catalogue. */
export function ecartFournisseur(
  s: { costMultiplier: number },
  reference: { costMultiplier: number } | undefined,
): string {
  const ratio = reference && reference.costMultiplier > 0 ? s.costMultiplier / reference.costMultiplier : s.costMultiplier;
  const pct = Math.round((ratio - 1) * 100);
  return pct === 0 ? "coût de référence" : `${pct > 0 ? "+" : "−"}${Math.abs(pct)} %`;
}

/** Une référence en développement ne se vend ni ne se produit : rien à saisir. */
function enDeveloppement(p: NonNullable<GameView["gamme"]>[number]): boolean {
  const dev = p.rd?.development;
  return !!dev && !dev.available;
}

/** La pastille d'une référence en développement, à côté de son nom. */
function EnDeveloppement() {
  return (
    <span className="ml-2 inline-block whitespace-nowrap rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 align-middle text-xs font-medium text-amber-300">
      🔬 en développement
    </span>
  );
}

/**
 * Le tableau des VENTES de la gamme : le prix, le volume et le façonnier de
 * chaque référence. Les budgets (marketing, qualité, R&D) vivent dans le
 * tableau des budgets, avec l'entretien : la fenêtre des ventes ne porte que
 * ce qui fait le chiffre d'affaires et la marge.
 *
 * Mobile : layout de cartes par référence au lieu de tableau, pour éviter
 * le scroll horizontal sur petit écran.
 */
/**
 * Une suite de faits courts — « 34,56 €/u · qualité −6 % · règlement 30 j ».
 *
 * Écrite en phrase continue, elle se coupait au milieu d'un fait : le lecteur
 * recollait « jours non facturés 0 » d'une ligne et « jours-conseil » de la
 * suivante. Ici chaque fait est insécable et porte SON séparateur, de sorte que
 * le point médian termine une ligne au lieu d'en commencer une.
 */
function Faits({ faits, className = "" }: { faits: string[]; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-x-1.5 gap-y-0.5 text-xs leading-snug text-slate-400 ${className}`}>
      {faits.map((fait, i) => (
        <span key={fait} className="whitespace-nowrap">
          {fait}
          {i < faits.length - 1 ? (
            <span aria-hidden className="text-slate-600"> ·</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Un fait de capacité : son intitulé, son chiffre, et ce qui l'explique.
 * L'intitulé au-dessus du chiffre — c'est la seule disposition qui tienne
 * quand l'un et l'autre sont longs et que l'écran fait 390 px.
 */
function FaitCapacite({
  label,
  valeur,
  note,
  couleur = "text-slate-200",
  testId,
}: {
  label: string;
  valeur: string;
  note?: string;
  couleur?: string;
  testId?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase leading-4 tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-sm font-medium tabular-nums ${couleur}`} data-testid={testId}>
        {valeur}
      </dd>
      {note ? <dd className="text-xs leading-snug text-slate-400">{note}</dd> : null}
    </div>
  );
}

/**
 * Ce que le fournisseur choisi entraîne : son prix d'achat, sa qualité, son
 * délai de règlement, son risque de rupture.
 *
 * Ces quatre faits vivaient dans le libellé de l'<option>, que le système rend
 * à sa façon — sur Android, trois lignes par option dans un pavé blanc. Ici la
 * page les met en page elle-même, et les deux derniers (délai, rupture), qui
 * n'étaient nulle part à l'écran alors que le texte les annonce, se voient
 * enfin.
 */
function FaitsFournisseur({
  fournisseur: f,
}: {
  fournisseur: {
    materialCostPerUnit: number;
    qualityBonus: number;
    paymentDelayDays: number;
    supplyRiskProbability: number;
  };
}) {
  const faits = [`${formatEuroCents(f.materialCostPerUnit)}/u`];
  if (f.qualityBonus !== 0) {
    faits.push(
      `qualité ${f.qualityBonus > 0 ? "+" : "−"}${Math.abs(Math.round(f.qualityBonus * 100))} %`,
    );
  }
  faits.push(f.paymentDelayDays > 0 ? `règlement ${f.paymentDelayDays} j` : "règlement comptant");
  if (f.supplyRiskProbability > 0) {
    faits.push(`rupture ${Math.round(f.supplyRiskProbability * 100)} %`);
  }
  return <Faits faits={faits} className="mt-1" />;
}

/**
 * LA GAMME EN MATRICE : LES INTITULÉS EN LIGNE, LES RÉFÉRENCES EN COLONNE.
 *
 * Le formulaire en gamme avait deux jeux d'onglets — un pour le prix, le
 * volume et le façonnier, un autre pour le marketing, la qualité et la R&D —
 * puis un seul, puis cinq cartes côte à côte. Chaque étape rapprochait ce qui
 * se décide ensemble ; celle-ci va au bout.
 *
 * Car la gamme est un TABLEAU, et l'avait toujours été : les mêmes six ou sept
 * décisions, répétées référence par référence. Les servir en cartes, c'était
 * redire sept fois les mêmes intitulés et obliger à comparer de mémoire. En
 * matrice, chaque ligne est une question posée à toute la gamme d'un coup —
 * « à quel prix ? », « combien ? », « combien de marketing ? » — et la réponse
 * se lit en travers. C'est ainsi que se fait l'arbitrage : un prix contre un
 * autre, une marge contre une autre, une capacité partagée à répartir.
 *
 * Les lignes suivent la chaîne du raisonnement, et non l'ordre du schéma de
 * données : chez qui j'achète → ce que ça me coûte → à quel prix je vends →
 * ce qu'il m'en reste → combien j'en fais → ce que je dépense pour le vendre.
 * Les lignes DÉDUITES (coût variable, marge, coefficient) se recalculent à la
 * frappe : le prix saisi et le façonnier choisi sont écoutés, les champs
 * restant non contrôlés pour que le formulaire les envoie tels quels.
 *
 * SUR TÉLÉPHONE, une seule colonne tient. La barre d'onglets ne disparaît donc
 * pas : elle choisit la colonne visible, et la matrice se lit comme une fiche
 * — intitulé à gauche, valeur à droite. C'est le MÊME tableau, avec des
 * colonnes masquées en CSS : aucun champ n'est démonté, aucun nom de champ
 * n'est en double, et rien ne change de forme au chargement.
 *
 * Une seule chose a besoin de savoir où l'on est : le `required` des champs —
 * il vaut pour la colonne active sur téléphone, et pour toutes sur grand
 * écran. D'où le `matchMedia`, qui part de « téléphone » et ne peut donc
 * jamais exiger un champ que personne ne voit.
 */
function GammeReference({
  gamme,
  defaults,
  vocabulary: v,
  quality,
  rd,
  roundIndex,
}: {
  gamme: NonNullable<GameView["gamme"]>;
  defaults: RoundDecisions;
  vocabulary: ScenarioVocabulary;
  /** Le budget qualité est-il ouvert à ce niveau ? */
  quality: boolean;
  /** La R&D est-elle ouverte (niveau ET scénario) ? */
  rd: boolean;
  roundIndex: number;
}) {
  const n = gamme.length;
  const avecFournisseurs = gamme.some((p) => p.suppliers);
  const avecRd = rd && gamme.some((p) => p.rd);
  const avecSaison = gamme.some((p) => Math.abs(p.seasonCoef - 1) > 0.01);
  const [activeProduct, setActiveProduct] = useState(gamme[0]?.code ?? "");
  // Où sommes-nous ? La mise en page, elle, n'a pas besoin de le demander : le
  // CSS s'en charge. Seul le `required` doit le savoir — exiger un champ qu'on
  // ne voit pas bloque l'envoi sans rien afficher, et le point de départ est
  // donc « téléphone », le cas où une seule colonne est visible.
  const [surGrandEcran, setSurGrandEcran] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const suivre = () => setSurGrandEcran(mq.matches);
    suivre();
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);
  /** Cette colonne est-elle sous les yeux ? Toutes le sont sur grand écran. */
  const visible = (code: string) => surGrandEcran || code === activeProduct;
  /** Masquée en CSS tant qu'on n'a pas la place — jamais démontée. */
  const colonne = (code: string) =>
    `${code === activeProduct ? "" : "hidden "}lg:table-cell overflow-hidden px-2 py-1.5 align-top`;

  const [prix, setPrix] = useState<Record<string, number>>(() =>
    Object.fromEntries(gamme.map((p) => [p.code, defaults.products?.[p.code]?.price ?? p.refPrice])),
  );
  const [faconniers, setFaconniers] = useState<Record<string, string | undefined>>(() =>
    Object.fromEntries(
      gamme.map((p) => {
        const own = defaults.products?.[p.code]?.supplierChoice ?? defaults.supplierChoice;
        const valide = p.suppliers?.some((s) => s.code === own) ? own : p.suppliers?.[0]?.code;
        return [p.code, valide];
      }),
    ),
  );

  type Reference = NonNullable<GameView["gamme"]>[number];
  const faconnierDe = (p: Reference) =>
    p.suppliers?.find((s) => s.code === faconniers[p.code]) ?? p.suppliers?.[0];
  const achatDe = (p: Reference) => faconnierDe(p)?.materialCostPerUnit ?? p.materialCostPerUnit;
  const cvuDe = (p: Reference) => achatDe(p) + p.otherVariableCostPerUnit;
  const prixDe = (p: Reference) => prix[p.code] ?? p.refPrice;

  /** Une cellule sans objet : la référence n'est pas encore vendable. */
  const rien = <span className="text-slate-600">—</span>;

  /** Un champ chiffré, dans sa cellule. */
  const champ = (
    p: Reference,
    nom: "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "rdBudget",
    label: string,
    valeur: number,
    suffixe: string,
    pas = 1,
    onChange?: (v: number) => void,
  ) => (
    <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 focus-within:border-amber-400/60">
      <input
        type="number"
        name={productFieldName(p.code, nom)}
        aria-label={`${label} · ${p.name}`}
        defaultValue={valeur}
        onChange={onChange ? (e) => onChange(Number(e.currentTarget.value.replace(",", "."))) : undefined}
        step={pas}
        min={0}
        required={visible(p.code)}
        className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-slate-100 outline-none"
      />
      <span className="shrink-0 text-xs text-slate-400">{suffixe}</span>
    </span>
  );

  /**
   * Les lignes de la matrice, dans l'ordre du raisonnement. Une ligne absente
   * (pas de façonnier dans ce secteur, pas de qualité à ce niveau) n'est pas
   * une ligne vide : elle n'existe pas.
   */
  const lignes: { cle: string; label: string; deduite?: boolean; cellule: (p: Reference) => ReactNode }[] = [
    {
      cle: "refPrice",
      label: "Prix usuel",
      deduite: true,
      cellule: (p) => <span className="tabular-nums">{formatEuro(p.refPrice)}</span>,
    },
    {
      cle: "stock",
      label: v.leftoverLabel,
      deduite: true,
      cellule: (p) => (
        <span className="tabular-nums">
          {formatUnits(p.stock)} {v.units}
        </span>
      ),
    },
    ...(avecSaison
      ? [
          {
            cle: "saison",
            label: "Saison",
            deduite: true,
            cellule: (p: Reference) => (
              <span className="tabular-nums">
                ×{p.seasonCoef.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
              </span>
            ),
          },
        ]
      : []),
    ...(avecFournisseurs
      ? [
          {
            cle: "supplierChoice",
            label: "Fournisseur",
            cellule: (p: Reference) => {
              const suppliers = p.suppliers;
              if (!suppliers) return rien;
              const reference = suppliers[0];
              const choisi = faconnierDe(p);
              return (
                <>
                  <select
                    name={productFieldName(p.code, "supplierChoice")}
                    aria-label={`Fournisseur · ${p.name}`}
                    defaultValue={faconniers[p.code]}
                    onChange={(e) =>
                      setFaconniers((etat) => ({ ...etat, [p.code]: e.currentTarget.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-[13px] text-slate-100 outline-none focus:border-amber-400/60"
                  >
                    {suppliers.map((s) => {
                      // Le nom seul pour le façonnier de référence, l'écart
                      // collé au nom pour les autres : dans une colonne de
                      // matrice, « · coût de référence » ne tenait pas.
                      const ecart = ecartFournisseur(s, reference);
                      return (
                        <option key={s.code} value={s.code}>
                          {ecart === "coût de référence" ? s.name : `${s.name} ${ecart}`}
                        </option>
                      );
                    })}
                  </select>
                  {choisi ? <FaitsFournisseur fournisseur={choisi} /> : null}
                </>
              );
            },
          },
        ]
      : []),
    {
      cle: "cvu",
      label: "Coût variable",
      deduite: true,
      cellule: (p) => <span className="tabular-nums">{formatEuroCents(cvuDe(p))}</span>,
    },
    {
      cle: "price",
      label: v.priceLabel,
      cellule: (p) =>
        enDeveloppement(p) ? (
          <>
            {rien}
            <input
              type="hidden"
              name={productFieldName(p.code, "price")}
              value={Math.round((defaults.products?.[p.code]?.price ?? p.refPrice) * 10) / 10}
            />
          </>
        ) : (
          champ(
            p,
            "price",
            v.priceLabel,
            Math.round((defaults.products?.[p.code]?.price ?? p.refPrice) * 10) / 10,
            "€",
            0.1,
            (saisi) => setPrix((etat) => ({ ...etat, [p.code]: Number.isFinite(saisi) ? saisi : 0 })),
          )
        ),
    },
    {
      cle: "marge",
      label: "Marge unitaire",
      deduite: true,
      cellule: (p) => {
        if (enDeveloppement(p)) return rien;
        const marge = prixDe(p) - cvuDe(p);
        return (
          <span
            className={`tabular-nums font-medium ${marge < 0 ? "text-red-400" : "text-emerald-300"}`}
          >
            {formatEuroCents(marge)}
          </span>
        );
      },
    },
    {
      cle: "coef",
      label: "Coefficient",
      deduite: true,
      cellule: (p) => {
        const achat = achatDe(p);
        if (enDeveloppement(p) || achat <= 0) return rien;
        return (
          <span className="tabular-nums">
            ×{(prixDe(p) / achat).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      cle: "productionPlan",
      label: v.productionPlanLabel,
      cellule: (p) =>
        enDeveloppement(p) ? (
          <>
            {rien}
            <input type="hidden" name={productFieldName(p.code, "productionPlan")} value={0} />
          </>
        ) : (
          champ(
            p,
            "productionPlan",
            v.productionPlanLabel,
            Math.round(defaults.products?.[p.code]?.productionPlan ?? 0),
            v.units,
          )
        ),
    },
    {
      cle: "marketingBudget",
      label: "Marketing",
      cellule: (p) =>
        enDeveloppement(p) ? (
          <>
            {rien}
            <input type="hidden" name={productFieldName(p.code, "marketingBudget")} value={0} />
          </>
        ) : (
          champ(
            p,
            "marketingBudget",
            "Marketing",
            Math.round(defaults.products?.[p.code]?.marketingBudget ?? defaults.marketingBudget / n),
            "€",
          )
        ),
    },
    ...(quality
      ? [
          {
            cle: "qualityBudget",
            label: "Qualité",
            cellule: (p: Reference) =>
              enDeveloppement(p) ? (
                <>
                  {rien}
                  <input type="hidden" name={productFieldName(p.code, "qualityBudget")} value={0} />
                </>
              ) : (
                champ(
                  p,
                  "qualityBudget",
                  "Qualité",
                  Math.round(defaults.products?.[p.code]?.qualityBudget ?? defaults.qualityBudget / n),
                  "€",
                )
              ),
          },
        ]
      : []),
    ...(avecRd
      ? [
          {
            cle: "rdBudget",
            label: "R&D",
            cellule: (p: Reference) =>
              champ(p, "rdBudget", "R&D", Math.round(defaults.products?.[p.code]?.rdBudget ?? 0), "€"),
          },
        ]
      : []),
  ];

  /** Ce qu'il reste à financer sur une référence encore à bâtir, dit en clair. */
  const chantiers = gamme.flatMap((p) => {
    const dev = p.rd?.development;
    return dev && !dev.available ? [{ p, dev }] : [];
  });

  return (
    <div className="space-y-3">
      {/* Sur téléphone, une seule colonne tient : ces boutons choisissent
          laquelle. Au-delà, elles sont toutes là et il n'y a rien à choisir. */}
      <div className="flex flex-wrap gap-2 lg:hidden">
        {gamme.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => setActiveProduct(p.code)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
              activeProduct === p.code
                ? "bg-amber-400/20 border border-amber-400/60 text-amber-200"
                : "bg-slate-900 border border-white/5 text-slate-400 hover:text-slate-200"
            }`}
          >
            <NomReference reference={p} />
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {/* `table-fixed` : les colonnes se partagent la largeur également, au
            lieu de la réclamer selon leur contenu. Sans lui, la liste
            déroulante des façonniers — dont la largeur minimale est celle de
            son option la plus longue — poussait la dernière référence hors du
            cadre. Les colonnes masquées ne réservent rien : sur téléphone, il
            ne reste que l'intitulé et la référence choisie. */}
        <table className="w-full table-fixed border-collapse text-sm">
          <caption className="sr-only">
            Vos décisions, référence par référence : les intitulés en ligne, les références en
            colonne.
          </caption>
          <thead>
            <tr className="border-b border-white/10">
              <td className="w-[38%] lg:w-[15%]" />
              {gamme.map((p) => (
                <th
                  key={p.code}
                  scope="col"
                  className={`${colonne(p.code)} text-left text-sm font-medium text-slate-100`}
                >
                  <NomReference reference={p} />
                  {enDeveloppement(p) ? <EnDeveloppement /> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.cle} className="border-b border-white/5 last:border-0">
                <th
                  scope="row"
                  className="py-1.5 pr-2 text-left align-top text-xs font-medium uppercase leading-4 tracking-wide text-slate-400"
                >
                  {l.label}
                </th>
                {gamme.map((p) => (
                  <td
                    key={p.code}
                    className={`${colonne(p.code)} ${l.deduite ? "text-xs text-slate-300" : ""}`}
                  >
                    {l.cellule(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chantiers.map(({ p, dev }) => {
        const reste = Math.max(0, dev.cost - dev.invested);
        return (
          <p key={p.code} className="text-xs leading-relaxed text-amber-200/80">
            <strong className="font-medium">{p.name}</strong> —{" "}
            {reste <= 0
              ? `financée (${formatEuro(dev.invested)} engagés) : vendable dès le tour ${Math.max(dev.availableFromRound, roundIndex + 1)}.`
              : `${formatEuro(dev.invested)} engagés sur ${formatEuro(dev.cost)} : il reste ${formatEuro(reste)} à financer, puis elle se vend dès le tour suivant (au plus tôt le tour ${dev.availableFromRound}).`}
          </p>
        );
      })}

      <p className="text-xs leading-relaxed text-slate-400">
        Capacité partagée : si la somme des volumes la dépasse, toutes les références sont
        réduites dans la même proportion.
        {avecFournisseurs
          ? " Le façonnier choisi ne vaut que pour sa référence : son coût d'achat, sa qualité, son délai, son risque de rupture."
          : ""}
      </p>
      <p className="text-xs leading-relaxed text-slate-400">
        Chaque budget va à sa référence et se paie le tour même. Marketing : effet immédiat,
        qui retombe si on cesse
        {quality ? " ; qualité : la qualité perçue" : ""}
        {avecRd ? " ; R&D : le niveau technique, avec retard" : ""}.
      </p>
    </div>
  );
}

/**
 * Une famille de décisions, repliable. L'accordéon des périodes situe le tour ;
 * ces accordéons rangent les leviers d'UN tour par famille — cœur ouvert,
 * avancé replié — pour garder le formulaire scannable sans rien cacher au
 * moteur (un `details` fermé reste dans le DOM et se soumet).
 */
function Family({
  legend,
  children,
  defaultOpen = true,
  tone = "border-white/10 bg-slate-950",
  legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-400",
}: {
  legend: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: string;
  legendClass?: string;
}) {
  return (
    <details open={defaultOpen} className={`group rounded-lg border [&:not([open])]:border-dashed ${tone}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 [&::-webkit-details-marker]:hidden">
        <span className={legendClass}>{legend}</span>
        <span className="text-xs text-slate-400 transition-transform group-open:rotate-90">▸</span>
      </summary>
      <div className="border-t border-white/10 p-3 sm:p-4">{children}</div>
    </details>
  );
}

export function DecisionForm({
  gameId,
  roundIndex,
  periodName,
  defaults,
  proposed,
  kind,
  alreadySubmitted,
  insuranceOffer,
  enabled,
  distributableReserves,
  investmentOffer,
  debtSchedule,
  treasuryOffer,
  bankFile,
  orderOffer,
  studiesOffer,
  capitalAllowance,
  loanCapacity,
  insuranceFormulas,
  suppliersOffer,
  equipmentOffer,
  capacityFacts,
  vocabulary,
  verrou,
  sauvetage,
  gamme = null,
  rdOffer = null,
  communicationOffer = null,
}: {
  gameId: string;
  /** Levier communication du scénario (marque et axe) ; null sans levier. */
  communicationOffer?: GameView["communicationOffer"];
  /** Gamme du scénario joué (prix, volume et marketing par référence) ; null en mono-produit. */
  gamme?: GameView["gamme"];
  /** Levier R&D du scénario (échelle du budget par tour) ; null sans levier. */
  rdOffer?: GameView["rdOffer"];
  roundIndex: number;
  periodName: string;
  /**
   * Verrou temporel (planning) : message à afficher quand le tour est hors de
   * sa fenêtre. Null = jouable. Le formulaire reste visible (lecture seule) mais
   * « Valider » est grisé ; le serveur refuse de toute façon.
   */
  verrou?: string | null;
  /**
   * Financement de sauvetage exigé après un tour clos en cessation de
   * paiements. `null` hors crise, ou quand l'enseignant a préféré
   * l'avertissement au verrou.
   */
  sauvetage?: ExigenceSauvetage | null;
  defaults: RoundDecisions;
  /**
   * Les valeurs PROPOSÉES pour ce tour (tour précédent, sinon point de départ
   * du secteur) : la référence pour dire si un pivot a été touché. Distinct de
   * `defaults`, qui reprend aussi ce que l'équipe a déjà validé ce tour.
   */
  proposed?: RoundDecisions;
  kind: "solo" | "class";
  alreadySubmitted: boolean;
  /** Offre d'assurance du scénario (prime déjà à l'échelle de la périodicité). */
  insuranceOffer?: { premium: number; coveredLabels: string[] } | null;
  /** Décisions exposées au niveau de difficulté de la partie (doc 08 §2). */
  enabled?: {
    quality: boolean;
    maintenance: boolean;
    finance: boolean;
    insurance: boolean;
    hr: boolean;
    investment: boolean;
    rse: boolean;
    placement: boolean;
    dividend: boolean;
    rd: boolean;
  };
  /** Bénéfices des tours passés non distribués : le plafond du dividende. */
  distributableReserves?: number;
  /** Investissement du scénario (coût par unité de capacité, plafond). */
  investmentOffer?: { costPerCapacityUnit: number; maxPerRound: number } | null;
  /** Échéance d'emprunt obligatoire du tour (prélevée automatiquement). */
  debtSchedule?: { nextMandatory: number; outstanding: number } | null;
  /** Outils de trésorerie du scénario (escompte / affacturage). */
  treasuryOffer?: {
    discountAnnualRate: number;
    discountMaxShare: number;
    factoringFeeRate: number;
    overdraftLimit: number;
    placementAnnualRate: number | null;
    maturedPlacement: number;
  } | null;
  /**
   * Dossier bancaire : ce que la banque consent pour ce tour, et ce qu'elle a
   * retenu du dernier plan. `null` = le scénario n'en ouvre pas.
   */
  bankFile?: {
    trust: number;
    overdraftLimit: number;
    fullOverdraftLimit: number;
    overdraftAnnualRate: number;
    lastReliability: number | null;
  } | null;
  /** Commande exceptionnelle proposée pour CE tour (rotation du pool). */
  orderOffer?: {
    title: string;
    narrative: string;
    units: number;
    price: number;
    paymentDelayDays: number;
    unitVariableCost: number;
    /** En gamme : la référence sur laquelle porte la commande. */
    productName?: string | null;
  } | null;
  /** Catalogue d'études du scénario : l'information a un prix. */
  studiesOffer?: {
    marketCost: number;
    priceCost: number;
    financeCost: number;
    projectCost: number;
  } | null;
  /** Enveloppe d'augmentation de capital restante (null = illimitée). */
  capitalAllowance?: { total: number; remaining: number } | null;
  /** Ce que la banque peut encore prêter : `null` sans plafond déclaré. */
  loanCapacity?: { remaining: number; ratio: number; equity: number; debt: number } | null;
  /** Formules d'assurance (si le scénario en propose plusieurs — remplace le toggle simple). */
  insuranceFormulas?: {
    code: string;
    name: string;
    premium: number;
    coveredLabels: string[];
  }[] | null;
  /** Fournisseurs disponibles (si le scénario en propose). */
  suppliersOffer?: {
    code: string;
    name: string;
    narrative: string;
    costMultiplier: number;
    qualityBonus: number;
    paymentDelayDays: number;
    supplyRiskProbability: number;
    materialCostPerUnit: number;
  }[] | null;
  /** Équipements typés : catalogue de machines et parc actuel. */
  equipmentOffer?: {
    types: {
      code: string;
      name: string;
      capacityPerUnit: number;
      costPerUnit: number;
      depreciationRounds: number;
      maintenanceMultiplier: number;
      maxPerRound: number;
      resaleRatio: number;
    }[];
    fleet: { typeCode: string; count: number; bookValue: number }[];
    pendingFleet: { typeCode: string; count: number }[];
  } | null;
  /** Vocabulaire du secteur joué (registre des scénarios). */
  vocabulary: ScenarioVocabulary;
  /** Capacité de production : goulots et levier RH. */
  capacityFacts?: {
    machineCapacity: number;
    laborCapacity: number;
    bottleneck: "machine" | "labor" | "balanced";
    headcount: number;
    productivity: number;
    subscription?: {
      members: number;
      expectedRetained: number;
      baseChurnRate: number;
      refPrice: number;
    };
  } | null;
}) {
  const action = playRoundAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    action,
    initialState,
    // Pas de délai : la résolution du tour redirige vers les résultats et peut
    // être longue (démarrage à froid + simulation). Un délai coupait l'attente
    // et affichait « le serveur n'a pas répondu » juste avant les résultats. Une
    // vraie erreur d'action reste signalée par `state.error`.
    { label: "décisions du tour", timeoutMs: Infinity },
  );
  const reserves = Math.max(0, distributableReserves ?? 0);

  // Les pivots (prix, volume) validés sans avoir été touchés : on le dit avant
  // d'envoyer, une fois. « Oui » confirme et envoie ; « Non » ramène au champ.
  const reference = proposed ?? defaults;
  const [nonTouches, setNonTouches] = useState<PivotFieldInfo[] | null>(null);
  const confirme = useRef(false);
  const verifierPivots = (e: React.FormEvent<HTMLFormElement>) => {
    if (confirme.current) return;
    const form = e.currentTarget;
    const lire = (name: PivotField) =>
      Number((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? NaN);
    // Gamme : les pivots sont les scalaires dérivés des champs par produit,
    // du même calcul que le serveur et que la proposition.
    const products = gamme ? readProductFields(new FormData(form).entries()) : undefined;
    const saisie = products
      ? scalarsOfGamme(products)
      : { price: lire("price"), productionPlan: lire("productionPlan") };
    const intacts = pivotsNonTouches(
      { price: saisie.price, productionPlan: saisie.productionPlan },
      { price: reference.price, productionPlan: reference.productionPlan },
    );
    if (intacts.length === 0) return;
    e.preventDefault();
    setNonTouches(pivotFieldsFor(v).filter((p) => intacts.includes(p.key)));
  };
  const garderLesValeurs = (e: React.MouseEvent<HTMLButtonElement>) => {
    confirme.current = true;
    setNonTouches(null);
    e.currentTarget.form?.requestSubmit();
  };
  const lesModifier = (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = e.currentTarget.form;
    const premier = nonTouches?.[0]?.key;
    setNonTouches(null);
    if (!form || !premier) return;
    // En gamme, le pivot vit dans la première ligne du tableau des références.
    const nom = gamme?.[0] ? productFieldName(gamme[0].code, premier) : premier;
    const champ = form.elements.namedItem(nom) as HTMLInputElement | null;
    // Le champ pivot vit à l'étape « Vendre », pas forcément celle affichée : on
    // révèle son étape AVANT de poser le focus, sinon il est masqué (`hidden`)
    // et le focus reste sans effet (l'élève ne verrait rien se passer).
    const section = champ?.closest("[data-etape]") as HTMLElement | null;
    const i = Number(section?.dataset.etape);
    if (!Number.isNaN(i)) setEtape(i);
    requestAnimationFrame(() => champ?.focus());
  };
  const [equipBuyQty, setEquipBuyQty] = useState<Record<string, number>>({});
  const [equipSellQty, setEquipSellQty] = useState<Record<string, number>>({});
  // L'étape affichée de l'assistant de décision (voir plus bas). Les étapes
  // inactives restent MONTÉES (attribut `hidden`, jamais démontées) : le
  // formulaire se soumet toujours en entier, quelle que soit l'étape à l'écran.
  const [etape, setEtape] = useState(0);

  // Un champ requis dans une famille repliée — OU sur une étape masquée — est
  // invisible : le navigateur ne peut pas y afficher sa bulle de validation et
  // abandonne l'envoi en silence (« An invalid form control is not focusable »).
  // En phase de capture, avant que le navigateur ne tente d'y poser le focus, on
  // rouvre la famille du champ fautif ET on affiche son étape.
  const revelerFamilleInvalide = (e: React.FormEvent<HTMLFormElement>) => {
    const cible = e.target as HTMLElement;
    const famille = cible.closest?.("details") as HTMLDetailsElement | null;
    if (famille && !famille.open) famille.open = true;
    const section = cible.closest?.("[data-etape]") as HTMLElement | null;
    const i = Number(section?.dataset.etape);
    if (!Number.isNaN(i)) setEtape(i);
  };
  const on = enabled ?? {
    quality: true,
    maintenance: true,
    finance: true,
    insurance: true,
    hr: false,
    investment: false,
    rse: false,
    placement: false,
    dividend: false,
    rd: false,
  };
  const rdMono = on.rd && !!rdOffer && !gamme;
  // L'axe de communication tenu : écouté pour dire à qui il parle.
  const [axe, setAxe] = useState<string>(defaults.communicationAxis ?? "");
  // LES DEUX LEVIERS DU SAUVETAGE, SUIVIS EN DIRECT. Le bouton de validation
  // doit se débloquer à la saisie, pas après un aller-retour serveur : une
  // équipe en crise a déjà assez à comprendre sans découvrir son erreur après
  // l'envoi.
  const [renfort, setRenfort] = useState({
    emprunt: Math.max(0, defaults.finance?.newLoan ?? 0),
    apport: Math.max(0, defaults.finance?.capitalIncrease ?? 0),
  });
  const verdict: VerdictSauvetage = sauvetage
    ? verdictSauvetage(sauvetage, renfort)
    : { issue: "suffisant" };
  const blocageSauvetage = messageSauvetage(verdict, formatEuro);
  // Le verrou et le message ne disent pas la même chose : une demande de
  // subvention déposée lève le verrou sans rien réunir de plus, et n'a donc
  // aucun message de blocage à afficher.
  const validationBloquee = bloqueLaValidation(verdict);

  // Vocabulaire du secteur : c'est lui qui parle à l'élève, pas le moteur.
  const v = vocabulary;

  // Répartition des leviers en étapes courtes (anti-scroll) : plutôt qu'un long
  // formulaire qu'on déroule, quelques écrans qu'on parcourt. Une étape sans
  // aucun contenu au niveau de difficulté courant est retirée ; l'index
  // d'affichage se calcule sur les étapes RÉELLEMENT visibles.
  // Les quatre budgets du tour (marketing, qualité, maintenance, R&D) et la
  // communication ont leur étape, « Budgéter » : ce que l'entreprise dépense
  // ce tour pour soutenir son offre. « Vendre » ne garde que le prix, le
  // volume et l'approvisionnement. Il n'y a plus d'étape « Produire ».
  // EN GAMME, « Budgéter » ne garde que les budgets d'entreprise : l'entretien
  // et la marque. Sans l'un ni l'autre, l'étape n'a plus rien à montrer — elle
  // disparaît donc de la barre. Sa section reste dans le DOM, masquée : les
  // scalaires cachés qu'elle porte (qualité, entretien) continuent de partir.
  const budgetsVisible = !gamme || on.maintenance || !!communicationOffer;
  const equipeVisible = on.hr || on.rse;
  const financerVisible = on.finance || (on.investment && !!equipmentOffer);
  const couvertureVisible =
    on.dividend ||
    (on.finance && !!treasuryOffer) ||
    (on.insurance && (!!insuranceOffer || (insuranceFormulas?.length ?? 0) > 0));
  const etapesVisibles = [
    "vendre",
    budgetsVisible ? "budgets" : null,
    equipeVisible ? "equipe" : null,
    financerVisible ? "financer" : null,
    couvertureVisible ? "couverture" : null,
    "prevoir",
  ].filter((x): x is string => x !== null);
  const META: Record<string, { titre: string; icone: string }> = {
    // En gamme, la première étape ne se limite plus à vendre : elle porte TOUT
    // ce qui se décide sur une référence, budgets compris. L'appeler « Vendre »
    // ferait chercher ailleurs des champs qui sont là.
    vendre: { titre: gamme ? "Vos références" : "Vendre & s'approvisionner", icone: "🎯" },
    budgets: { titre: "Budgéter", icone: "💸" },
    equipe: { titre: "Équipe & RSE", icone: "👥" },
    financer: { titre: "Financer & investir", icone: "💶" },
    couverture: { titre: "Trésorerie & couverture", icone: "🛡️" },
    prevoir: { titre: "S'informer & prévoir", icone: "📊" },
  };
  const idx = (cle: string) => etapesVisibles.indexOf(cle);
  const total = etapesVisibles.length;
  const courante = Math.min(etape, total - 1);
  const derniere = courante === total - 1;

  // ── BROUILLON LOCAL ──────────────────────────────────────────────────────
  // Six étapes, des dizaines de champs, et rien n'était gardé tant qu'on
  // n'avait pas validé : un onglet fermé ou un appel en plein cours, et le tour
  // entier était à ressaisir. On sauve à chaque frappe, dans le navigateur.
  const cle = cleBrouillon(gameId, roundIndex);
  const brouillonRestaure = useRef(false);

  const sauverBrouillon = () => {
    const form = formRef.current;
    if (!form || alreadySubmitted) return;
    const b: Brouillon = {};
    for (const [nom, valeur] of new FormData(form).entries()) {
      if (typeof valeur === "string") b[nom] = valeur;
    }
    ecrireBrouillon(cle, b);
  };

  // La restauration se fait APRÈS le montage, jamais pendant le rendu : le
  // serveur ne voit pas `localStorage`, et lire le stockage au rendu ferait
  // diverger le HTML hydraté de celui du serveur.
  useEffect(() => {
    if (brouillonRestaure.current) return;
    brouillonRestaure.current = true;
    // Un tour joué ne se rejoue pas : son brouillon n'a plus d'objet.
    effacerBrouillonsAnterieurs(gameId, cle);
    if (alreadySubmitted) {
      effacerBrouillon(cle);
      return;
    }
    const b = lireBrouillon(cle);
    const form = formRef.current;
    if (!b || !form) return;

    for (const champ of Array.from(form.elements)) {
      if (
        !(champ instanceof HTMLInputElement) &&
        !(champ instanceof HTMLSelectElement) &&
        !(champ instanceof HTMLTextAreaElement)
      ) {
        continue;
      }
      const nom = champ.name;
      if (!nom) continue;
      // Les champs cachés sont recalculés par React à chaque rendu : y écrire
      // ne servirait à rien. Ceux qui portent un état — le parc machines — sont
      // remis plus bas, par leur état.
      if (champ instanceof HTMLInputElement && champ.type === "hidden") continue;
      if (champ instanceof HTMLInputElement && champ.type === "checkbox") {
        // Une case décochée ne figure pas dans un envoi : son absence du
        // brouillon veut dire « décochée », pas « inconnue ».
        champ.checked = Object.prototype.hasOwnProperty.call(b, nom);
        continue;
      }
      if (champ instanceof HTMLInputElement && champ.type === "radio") {
        champ.checked = b[nom] === champ.value;
        continue;
      }
      const valeur = b[nom];
      if (valeur !== undefined && valeur !== champ.value) poserValeur(champ, valeur);
    }

    // Le parc machines ne passe pas par des champs nommés : ses quantités
    // vivent dans un état React et ressortent en JSON caché. On les relit là.
    setEquipBuyQty(quantitesDepuisJson(b.equipmentBuyJson));
    setEquipSellQty(quantitesDepuisJson(b.equipmentSellJson));
  }, [cle, gameId, alreadySubmitted, formRef]);

  // Le tour est parti : le filet n'a plus lieu d'être.
  useEffect(() => {
    if (alreadySubmitted) effacerBrouillon(cle);
  }, [alreadySubmitted, cle]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={verifierPivots}
      onChange={sauverBrouillon}
      onInvalidCapture={revelerFamilleInvalide}
      className="space-y-3"
    >
      {/* Verrou de planning : hors de la fenêtre, on l'annonce et « Valider »
          est grisé (le serveur refuse de toute façon). La page reste lisible. */}
      {verrou ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-200"
        >
          <span aria-hidden>🔒</span> {verrou}
        </p>
      ) : null}
      {/*
        LE FINANCEMENT DE SAUVETAGE. Visible à toutes les étapes, comme le
        verrou de planning : le bouton « Valider » est grisé au bas de chacune
        d'elles, et un bouton grisé sans sa raison sous les yeux est une
        impasse. Le message dit le montant qui reste à réunir et s'efface de
        lui-même dès que le compte y est.
      */}
      {blocageSauvetage ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm leading-relaxed text-red-200"
        >
          <span aria-hidden className="mt-0.5">🚨</span>
          <span>
            <strong className="font-semibold">Financement de sauvetage exigé.</strong>{" "}
            {blocageSauvetage}
          </span>
        </p>
      ) : null}
      {/* Barre d'étapes : où j'en suis, saut direct possible. Les libellés se
          replient en simples numéros sur petit écran. */}
      <ol className="flex flex-wrap gap-1.5" aria-label="Étapes de décision">
        {etapesVisibles.map((cle, i) => {
          const actif = i === courante;
          const fait = i < courante;
          return (
            <li key={cle} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setEtape(i)}
                aria-current={actif ? "step" : undefined}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  actif
                    ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                    : fait
                      ? "border-emerald-400/30 bg-emerald-950/20 text-emerald-300/80 hover:text-emerald-200"
                      : "border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span aria-hidden>{fait ? "✓" : META[cle]!.icone}</span>
                <span className="hidden truncate sm:inline">{META[cle]!.titre}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section
        data-etape={idx("vendre")}
        hidden={courante !== idx("vendre")}
        className="space-y-3"
      >
      {orderOffer ? (
        <Family
          legend={`📦 Commande exceptionnelle · ${orderOffer.title}`}
          tone="border-sky-400/25 bg-sky-950/20"
          legendClass="text-xs font-semibold uppercase tracking-wide text-sky-300"
        >
          <p className="text-sm leading-relaxed text-slate-300">{orderOffer.narrative}</p>
          <p className="mt-2 text-xs text-slate-400">
            <strong className="text-slate-200">
              {Math.round(orderOffer.units).toLocaleString("fr-FR")} {v.units}
            </strong>{" "}
            à{" "}
            <strong className="text-slate-200">
              {orderOffer.price.toLocaleString("fr-FR")} €/u
            </strong>{" "}
            (coût variable ≈ {orderOffer.unitVariableCost.toLocaleString("fr-FR")} €/u),{" "}
            {orderOffer.paymentDelayDays > 0
              ? `règlement à ${orderOffer.paymentDelayDays} jours`
              : "règlement comptant"}
            .{" "}
            {orderOffer.productName
              ? `Sur « ${orderOffer.productName} », servie sur son stock restant après le marché.`
              : "Servie sur votre stock restant après le marché."}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {orderOffer.paymentDelayDays > 0
              ? "Belle marge, mais encaissée plus tard : le BFR gonfle d'autant."
              : "Cash immédiat, marge mince : comparez le prix à votre coût variable."}
          </p>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              name="acceptOrder"
              defaultChecked={defaults.acceptOrder ?? false}
              className="mt-0.5 h-4 w-4 accent-sky-400"
            />
            <span className="text-sm font-medium text-slate-200">
              Accepter la commande, à prendre ou à laisser : elle ne repassera pas.
            </span>
          </label>
        </Family>
      ) : null}
      {gamme ? (
        // TOUT CE QUI SE DÉCIDE POUR UNE RÉFÉRENCE EST DANS SON ONGLET : prix,
        // volume, façonnier, puis les budgets qui la soutiennent. Séparés, le
        // prix et le budget marketing d'une même référence se décidaient sur
        // deux étapes, alors que l'un commande l'autre.
        <Family legend="🎯 Vos références · tout ce qui se décide pour chacune" defaultOpen>
          <GammeReference
            gamme={gamme}
            defaults={defaults}
            vocabulary={v}
            quality={on.quality}
            rd={on.rd && !!rdOffer}
            roundIndex={roundIndex}
          />
        </Family>
      ) : null}
      {gamme ? (
        <></>
      ) : (
        <Family legend="🎯 Vos ventes · le prix et le volume du tour" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <Field name="price" label={v.priceLabel} defaultValue={defaults.price} step={0.1}
              suffix={`€/${v.unit}`}
              hint="Attention aux seuils psychologiques…" />
            <Field name="productionPlan" label={v.productionPlanLabel}
              defaultValue={Math.round(defaults.productionPlan)} suffix={v.units}
              hint="Le volume réel sera borné par vos capacités." />
          </div>
        </Family>
      )}
      {capacityFacts ? (
        <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 sm:px-3.5 sm:py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            ⚙️ {v.capacityPanelTitle}
          </p>
          {/*
            Deux colonnes à parts égales sur téléphone donnaient une grille
            illisible : « Jours-consultants disponibles » se coupait à gauche
            pendant que « 720 jours/tour (12 pers. × prod. 100 %) » se coupait à
            droite, l'un et l'autre alignés à contre-sens. L'intitulé passe donc
            AU-DESSUS de son chiffre, et la grille ne se rétablit qu'une fois la
            place venue.
          */}
          <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {capacityFacts.subscription ? (
              <FaitCapacite
                label={`Portefeuille d'${v.units}`}
                valeur={`${capacityFacts.subscription.members.toLocaleString("fr-FR")} ${v.units}`}
                note={`~${capacityFacts.subscription.expectedRetained.toLocaleString("fr-FR")} resteront à ${Math.round(capacityFacts.subscription.baseChurnRate * 100)} % d'attrition`}
                testId="portefeuille-adherents"
              />
            ) : null}
            <FaitCapacite
              label={v.capacityLabel}
              valeur={`${Math.round(capacityFacts.machineCapacity).toLocaleString("fr-FR")} ${v.perRoundLabel}`}
            />
            <FaitCapacite
              label={v.laborLabel}
              valeur={`${Math.round(capacityFacts.laborCapacity).toLocaleString("fr-FR")} ${v.perRoundLabel}`}
              note={`${capacityFacts.headcount} pers. × prod. ${Math.round(capacityFacts.productivity * 100)} %`}
            />
            <FaitCapacite
              label="Goulot"
              valeur={
                capacityFacts.bottleneck === "labor"
                  ? v.laborLabel
                  : capacityFacts.bottleneck === "machine"
                    ? v.capacityBottleneckLabel
                    : "Équilibré"
              }
              couleur={
                capacityFacts.bottleneck === "labor"
                  ? "text-amber-400"
                  : capacityFacts.bottleneck === "machine"
                    ? "text-sky-400"
                    : "text-emerald-400"
              }
            />
          </dl>
          {capacityFacts.bottleneck === "labor" ? (
            <p className="mt-2 text-xs text-amber-300/80">{v.laborBottleneckHint}</p>
          ) : capacityFacts.bottleneck === "machine" ? (
            <p className="mt-2 text-xs text-sky-300/80">{v.capacityBottleneckHint}</p>
          ) : null}
        </div>
      ) : null}
      {(() => {
        // Mono-produit : les fournisseurs du scénario, à choisir ici (radio),
        // leur coût lu par rapport au fournisseur de référence. Gamme : la
        // fiche de chaque façonnier, avec les références qu'il fournit et le
        // prix d'achat de chacune chez lui — le choix se fait dans le tableau.
        type Fiche = {
          code: string;
          name: string;
          narrative: string;
          qualityBonus: number;
          paymentDelayDays: number;
          supplyRiskProbability: number;
          prix: { reference: string; achat: number; ecart: string }[];
        };
        const fiches: Fiche[] = [];
        if (gamme) {
          for (const p of gamme) {
            const reference = p.suppliers?.[0];
            for (const s of p.suppliers ?? []) {
              const cle = `${s.code}·${s.name}`;
              let fiche = fiches.find((f) => `${f.code}·${f.name}` === cle);
              if (!fiche) {
                fiche = { ...s, prix: [] };
                fiches.push(fiche);
              }
              fiche.prix.push({ reference: p.name, achat: s.materialCostPerUnit, ecart: ecartFournisseur(s, reference) });
            }
          }
        } else if (suppliersOffer && suppliersOffer.length > 0) {
          const reference = suppliersOffer[0];
          for (const s of suppliersOffer) {
            fiches.push({ ...s, prix: [{ reference: v.unit, achat: s.materialCostPerUnit, ecart: ecartFournisseur(s, reference) }] });
          }
        }
        if (fiches.length === 0) return null;
        return (
          <Family
            // EN GAMME, CE PANNEAU NE PORTE AUCUNE DÉCISION : le façonnier se
            // choisit ligne par ligne dans le tableau des ventes, et ceci n'est
            // qu'un catalogue — autant de fiches que de façonniers, dépliées
            // au-dessus des champs qu'on vient remplir. Il s'ouvre à la demande.
            // En mono-produit, au contraire, le choix EST ici (les boutons
            // radio) : le replier cacherait une décision du tour.
            defaultOpen={!gamme}
            legend={
              gamme
                ? `🏭 ${v.supplierPanelLabel} · ${fiches.length} fiche${fiches.length > 1 ? "s" : ""}`
                : `🏭 ${v.supplierPanelLabel}`
            }
            tone="border-emerald-400/25 bg-emerald-950/20"
            legendClass="text-xs font-semibold uppercase tracking-wide text-emerald-300"
          >
            {gamme ? (
              <p className="mb-2 text-xs leading-relaxed text-emerald-200/80">
                Chaque référence a ses façonniers ; le choix se fait ligne par ligne dans le
                tableau de vos ventes. Voici ce que chacun propose, et à quel prix d&apos;achat
                pour chaque référence qu&apos;il fournit.
              </p>
            ) : null}
            <div className="space-y-2">
              {fiches.map((s) => (
                <label
                  key={`${s.code}·${s.name}`}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2"
                >
                  {gamme ? null : (
                    <input
                      type="radio"
                      name="supplierChoice"
                      value={s.code}
                      defaultChecked={(defaults.supplierChoice ?? fiches[0]?.code) === s.code}
                      className="mt-0.5 h-4 w-4 accent-emerald-400"
                    />
                  )}
                  <span>
                    <span className="text-sm font-medium text-slate-200">
                      {s.name}
                      {gamme
                        ? ""
                        : ` · ${v.materialLabel.toLowerCase()} à ${formatEuroCents(s.prix[0]!.achat)}/${v.unit} (${s.prix[0]!.ecart})`}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">{s.narrative}</span>
                    {gamme ? (
                      <span className="mt-1 block text-xs text-slate-300">
                        {s.prix.map((x, i) => (
                          <span key={x.reference}>
                            {i > 0 ? " · " : ""}
                            {x.reference} {formatEuroCents(x.achat)} ({x.ecart})
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <span className="mt-1 flex flex-wrap gap-3 text-xs">
                      {s.qualityBonus !== 0 ? (
                        <span className={s.qualityBonus > 0 ? "text-emerald-400" : "text-amber-400"}>
                          Qualité {s.qualityBonus > 0 ? "+" : "−"}{Math.abs(Math.round(s.qualityBonus * 100))} %
                        </span>
                      ) : null}
                      <span className="text-slate-400">
                        Délai de règlement : {s.paymentDelayDays === 0 ? "comptant" : `${s.paymentDelayDays} j`}
                      </span>
                      {s.supplyRiskProbability > 0 ? (
                        <span className="text-red-400">
                          Risque de rupture : {Math.round(s.supplyRiskProbability * 100)} %/tour
                        </span>
                      ) : (
                        <span className="text-emerald-400/60">Approvisionnement fiable</span>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Le prix d&apos;achat entre dans le coût variable : c&apos;est ce qui reste entre lui et
              votre prix de vente qui fait la marge. Le bonus de qualité joue sur la qualité
              perçue, le délai de règlement sur la trésorerie (BFR), le risque de rupture sur
              ce que vous recevez. L&apos;assurance étendue couvre le litige fournisseur.
            </p>
          </Family>
        );
      })()}
      </section>

      {/* Budgéter : les quatre budgets du tour (marketing, qualité, entretien,
          R&D) et la communication — ce que l'entreprise dépense ce tour pour
          soutenir son offre. Un budget que le niveau n'ouvre pas part caché,
          à sa valeur proposée, pour que la lecture côté serveur reste complète. */}
      <section
        data-etape={idx("budgets")}
        hidden={courante !== idx("budgets")}
        className="space-y-3"
      >
      <p className="text-sm leading-relaxed text-slate-400">
        Faire venir les clients, tenir la qualité, entretenir votre
        capacité{on.rd && rdOffer ? ", développer" : ""}
        {communicationOffer ? ", bâtir votre marque" : ""}. Chaque budget se paie le tour même.
      </p>
      {gamme ? null : (
        // Les budgets du tour, au même endroit : marketing, qualité, maintenance
        // et R&D.
        <Family
          legend={`💸 Les budgets du tour · ${["marketing", on.quality ? "qualité" : null, on.maintenance ? "maintenance" : null, rdMono ? "R&D" : null].filter(Boolean).join(", ")}`}
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field name="marketingBudget" label="Budget marketing" defaultValue={defaults.marketingBudget} suffix="€"
              hint="Fait venir les clients ce tour-ci ; l'effet retombe vite si on cesse." />
            {on.quality ? (
              <Field name="qualityBudget" label="Budget qualité" defaultValue={defaults.qualityBudget} suffix="€"
                hint="Prévention : moins de rebuts et de retours, une qualité perçue qui monte." />
            ) : (
              <input type="hidden" name="qualityBudget" value={defaults.qualityBudget} />
            )}
            {on.maintenance ? (
              <Field name="maintenanceBudget" label="Budget maintenance" defaultValue={defaults.maintenanceBudget} suffix="€"
                hint="Une maintenance insuffisante dégrade la disponibilité machine." />
            ) : (
              <input type="hidden" name="maintenanceBudget" value={defaults.maintenanceBudget} />
            )}
            {rdMono ? (
              <Field
                name="rdBudget"
                label="Recherche et développement"
                defaultValue={Math.round(defaults.rdBudget ?? 0)}
                suffix="€"
                hint="Élève le niveau technique, avec retard ; s'érode si la R&D cesse."
              />
            ) : null}
          </div>
        </Family>
      )}
      {gamme ? (
        // EN GAMME, IL NE RESTE ICI QUE LES BUDGETS DE L'ENTREPRISE : l'entretien
        // de la capacité, qu'aucune référence ne porte à elle seule (et, plus
        // bas, la marque). Le marketing, la qualité et la R&D de chaque
        // référence se décident dans SON onglet, avec son prix et son volume.
        // Les scalaires que le niveau n'ouvre pas partent cachés d'ici : le
        // serveur ne dérive rien des références pour eux.
        <Family
          legend={`💸 Les budgets de l'entreprise · ${[on.maintenance ? "entretien" : null, communicationOffer ? "marque" : null].filter(Boolean).join(", ")}`}
          defaultOpen
        >
          <p className="text-xs leading-relaxed text-slate-400">
            Le marketing, la qualité et la R&D de chaque référence se décident dans son
            onglet, à l&apos;étape précédente.
          </p>
          {on.quality ? null : <input type="hidden" name="qualityBudget" value={defaults.qualityBudget} />}
          {on.maintenance ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                name="maintenanceBudget"
                label={`Budget d'entretien · ${v.capacityLabel.toLowerCase()}`}
                defaultValue={defaults.maintenanceBudget}
                suffix="€"
                hint={`Trop peu d'entretien dégrade votre ${v.capacityLabel.toLowerCase()} disponible.`}
              />
            </div>
          ) : (
            <input type="hidden" name="maintenanceBudget" value={defaults.maintenanceBudget} />
          )}
        </Family>
      ) : null}
      {communicationOffer ? (
        // La communication (levier `communication`) : le budget de MARQUE, en
        // gamme seulement (les budgets par référence restent le marketing
        // spécifique), et l'AXE tenu ce tour. L'axe est un choix d'entreprise :
        // un seul, lisible, dont le formulaire dit à qui il parle.
        <Family legend={gamme ? "📣 Communication · la marque et l'axe" : "📣 Communication · l'axe"} defaultOpen>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gamme ? (
              <Field
                name="brandMarketingBudget"
                label="Budget de marque"
                defaultValue={Math.round(defaults.brandMarketingBudget ?? 0)}
                suffix="€"
                hint={`Notoriété de marque, toute la gamme, avec retard — ${Math.round(communicationOffer.brandAwareness * 100)} % à l'ouverture. Les budgets par référence agissent tout de suite.`}
              />
            ) : null}
            <label className="block">
              <span className="block min-h-8 leading-4 text-xs font-medium uppercase tracking-wide text-slate-400">Axe de communication</span>
              <select
                name="communicationAxis"
                value={axe}
                onChange={(e) => setAxe(e.currentTarget.value)}
                className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              >
                <option value="">Aucun axe : le budget parle à tout le monde</option>
                {communicationOffer.axes.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[13px] text-slate-400">
                {axe
                  ? COMMUNICATION_AXIS_LABELS[axe as keyof typeof COMMUNICATION_AXIS_LABELS].hint
                  : "Bien choisi, l'axe rend le même budget plus efficace ; mal choisi, il dessert."}
                {communicationOffer.lastAxis && axe && axe !== communicationOffer.lastAxis
                  ? " Changer d'axe use la notoriété acquise."
                  : ""}
              </span>
            </label>
          </div>
        </Family>
      ) : null}
      </section>

      <section
        data-etape={idx("equipe")}
        hidden={courante !== idx("equipe")}
        className="space-y-3"
      >
      {on.hr ? (
        <Family legend="👥 Ressources humaines">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field name="hire" label="Embauches" defaultValue={0} suffix="pers."
              hint="Arrivée au tour suivant, coût de recrutement immédiat." />
            <Field name="fire" label="Licenciements" defaultValue={0} suffix="pers."
              hint="Départ au tour suivant, indemnité immédiate." />
            <Field name="trainingBudget" label="Budget formation" defaultValue={0} suffix="€"
              hint="Élève la productivité dès le tour suivant." />
            <Field name="salaryPercent" label="Salaires (marché = 100)" defaultValue={Math.round((defaults.hr?.salaryIndex ?? 1) * 100)} suffix="%"
              hint="Sous-payer démotive et fait partir les salariés." />
          </div>
        </Family>
      ) : null}
      {on.rse ? (
        <Family legend="🌱 Engagement RSE">
          <p className="mb-2 text-xs text-slate-400">
            Ça coûte maintenant, ça rapporte plus tard : l&apos;effet met plusieurs tours
            à se construire, et à retomber si vous cessez.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field name="rseBudget" label="Budget RSE" defaultValue={0} suffix="€"
              hint="Capital-image : relève la demande lentement, à l'inverse du marketing." />
            <Field name="rseInvestment" label="Investissement process propre" defaultValue={0} suffix="€"
              hint="Réduit durablement les rebuts, tour après tour." />
          </div>
        </Family>
      ) : null}
      </section>

      <section
        data-etape={idx("financer")}
        hidden={courante !== idx("financer")}
        className="space-y-3"
      >
      {on.finance && debtSchedule && debtSchedule.outstanding > 0.5 ? (
        <p className="rounded-lg border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
          🏦 Échéance d&apos;emprunt du tour :{" "}
          <strong>{Math.round(debtSchedule.nextMandatory).toLocaleString("fr-FR")} €</strong>{" "}
          de capital, prélevée automatiquement (+ intérêts). Dette restante{" "}
          {Math.round(debtSchedule.outstanding).toLocaleString("fr-FR")} €. Les échéances
          tombent, que la caisse soit pleine ou vide.
        </p>
      ) : null}
      {on.finance ? (
      <Family legend="💶 Financer · emprunt, capital, investissement">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <>
              <Field name="newLoan" label="Nouvel emprunt" defaultValue={0} suffix="€"
                onValueChange={(v) => setRenfort((r) => ({ ...r, emprunt: v }))}
                hint={
                  loanCapacity
                    ? `5 %/an. La banque prête jusqu'à ${loanCapacity.ratio} × vos capitaux propres : il vous reste ${Math.round(loanCapacity.remaining).toLocaleString("fr-FR")} €.`
                    : "5 %/an, amortissement constant sur la durée du contrat."
                } />
              <Field
                name="loanRepayment"
                label={debtSchedule ? "Remboursement anticipé" : "Remboursement d'emprunt"}
                defaultValue={0}
                suffix="€"
                hint={debtSchedule ? "Facultatif, en plus de l'échéance obligatoire." : undefined}
              />
              <Field name="capitalIncrease" label="Augmentation de capital" defaultValue={0} suffix="€"
                onValueChange={(v) => setRenfort((r) => ({ ...r, apport: v }))}
                hint={
                  capitalAllowance
                    ? `Apport des associés · reste ${Math.round(capitalAllowance.remaining).toLocaleString("fr-FR")} € sur ${Math.round(capitalAllowance.total).toLocaleString("fr-FR")} € pour la partie.`
                    : "Apport des associés : trésorerie et capitaux propres, sans intérêts mais dilutif."
                } />
            {on.investment && investmentOffer && !equipmentOffer ? (
              <Field
                name="machineCapacityUnits"
                label={`Investissement capacité (${investmentOffer.costPerCapacityUnit.toLocaleString("fr-FR")} €/u)`}
                defaultValue={0}
                suffix={v.perRoundLabel}
                hint={`En service au tour suivant, amorti linéairement. Max ${Math.round(investmentOffer.maxPerRound).toLocaleString("fr-FR")} u par tour.`}
              />
            ) : null}
            </>
        </div>
        {/*
          LE DÉCOUVERT EST UN FAIT DE LA DÉCISION, PAS UNE NOTE DE BAS DE PAGE.
          Il vivait dans le panneau du plan de trésorerie, parti avec lui. Or
          c'est le chiffre qui dit jusqu'où la caisse peut descendre avant que
          la banque force la cession des créances : il a sa place là où l'on
          décide d'emprunter.
        */}
        {bankFile ? (
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Découvert autorisé{" "}
            <strong className="text-slate-200">{formatEuro(bankFile.overdraftLimit)}</strong>, à{" "}
            <strong className="text-slate-200">
              {(bankFile.overdraftAnnualRate * 100).toLocaleString("fr-FR", {
                maximumFractionDigits: 1,
              })}{" "}
              %
            </strong>{" "}
            l&apos;an. Au-delà, la banque cède vos créances à votre place, et
            vous le paie cher.
          </p>
        ) : null}
      </Family>
      ) : null}
      {on.investment && equipmentOffer ? (
        <>
          <EquipmentPanel
            offer={equipmentOffer}
            vocabulary={v}
            buyQty={equipBuyQty}
            setBuyQty={setEquipBuyQty}
            sellQty={equipSellQty}
            setSellQty={setEquipSellQty}
          />
          <input type="hidden" name="equipmentBuyJson" value={JSON.stringify(
            equipmentOffer.types
              .filter((t) => (equipBuyQty[t.code] ?? 0) > 0)
              .map((t) => ({ typeCode: t.code, quantity: equipBuyQty[t.code] ?? 0 }))
          )} />
          <input type="hidden" name="equipmentSellJson" value={JSON.stringify(
            equipmentOffer.types
              .filter((t) => (equipSellQty[t.code] ?? 0) > 0)
              .map((t) => ({ typeCode: t.code, quantity: equipSellQty[t.code] ?? 0 }))
          )} />
        </>
      ) : null}
      </section>

      <section
        data-etape={idx("couverture")}
        hidden={courante !== idx("couverture")}
        className="space-y-3"
      >
      {on.dividend ? (
        <Family legend="💰 Affectation du résultat · dividende">
          <Field
            name="dividend"
            label="Dividende versé aux associés"
            defaultValue={0}
            suffix="€"
            hint={
              reserves > 0
                ? `Réserves distribuables : ${formatEuro(reserves)}. Le versement sort en trésorerie, pas en résultat.`
                : roundIndex <= 1
                  ? "Rien à distribuer : l'affectation s'ouvre à partir du tour 2."
                  : "Rien à distribuer : une perte se rattrape d'abord."
            }
          />
        </Family>
      ) : null}
      {on.finance && treasuryOffer ? (
        <Family legend="💶 Trésorerie · mobiliser le poste clients">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              name="discount"
              label={`Escompte (${(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
              defaultValue={0}
              suffix="€"
              hint={`Avance sur créances, plafonnée à ${Math.round(treasuryOffer.discountMaxShare * 100)} % du poste clients, le moins cher.`}
            />
            <Field
              name="factoring"
              label={`Affacturage (${(treasuryOffer.factoringFeeRate * 100).toLocaleString("fr-FR")} % du montant)`}
              defaultValue={0}
              suffix="€"
              hint="Cession de créances, sans plafond : plus cher, immédiat."
            />
          </div>
          {on.placement && treasuryOffer.placementAnnualRate !== null ? (
            <div className="mt-3 border-t border-white/5 pt-3">
              <Field
                name="placement"
                label={`Placer le surplus (${(treasuryOffer.placementAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
                defaultValue={0}
                suffix="€"
                hint="Bloqué jusqu'au tour suivant : cet argent ne paiera rien ce tour-ci."
              />
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {treasuryOffer.maturedPlacement > 0.5
                  ? `${Math.round(treasuryOffer.maturedPlacement).toLocaleString("fr-FR")} € placés au tour précédent sont revenus en caisse, intérêts compris. `
                  : ""}
                Placez trop et vous financerez un découvert à{" "}
                {(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} % avec un
                placement à{" "}
                {(treasuryOffer.placementAnnualRate * 100).toLocaleString("fr-FR")} %.
              </p>
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Découvert autorisé jusqu&apos;à{" "}
            {Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €. Au-delà, la
            banque cède vos créances d&apos;office, au tarif fort.
          </p>
        </Family>
      ) : null}
      {on.insurance && insuranceFormulas && insuranceFormulas.length > 0 ? (
        <Family legend="🛡️ Assurance · choisissez votre couverture">
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2">
              <input
                type="radio"
                name="insurance"
                value=""
                defaultChecked={!defaults.insurance}
                className="mt-0.5 h-4 w-4 accent-amber-400"
              />
              <span className="text-sm text-slate-400">Aucune : pas de prime, tous les risques pour vous.</span>
            </label>
            {insuranceFormulas.map((f) => (
              <label
                key={f.code}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2"
              >
                <input
                  type="radio"
                  name="insurance"
                  value={f.code}
                  defaultChecked={defaults.insurance === f.code || (defaults.insurance === true && f.code === insuranceFormulas[0]?.code)}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {f.name} · {formatEuro(f.premium)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Couvre : {f.coveredLabels.join(", ")}.
                  </span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Un coût certain contre un risque incertain : plus la couverture est large, plus
            la prime pèse.
          </p>
        </Family>
      ) : on.insurance && insuranceOffer ? (
        <label className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-950 px-2.5 py-2">
          <input
            type="checkbox"
            name="insurance"
            defaultChecked={defaults.insurance === true}
            className="mt-0.5 h-4 w-4 accent-amber-400"
          />
          <span>
            <span className="text-sm font-medium text-slate-200">
              🛡️ Assurance catastrophe · {formatEuro(insuranceOffer.premium)} ce tour
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Couvre : {insuranceOffer.coveredLabels.join(", ")}. Un coût certain contre un
              risque incertain, à vous d&apos;arbitrer.
            </span>
          </span>
        </label>
      ) : null}
      </section>

      <section
        data-etape={idx("prevoir")}
        hidden={courante !== idx("prevoir")}
        className="space-y-3"
      >
      {studiesOffer ? (
        <Family legend={"📊 Acheter de l'information · livrée avec les résultats du tour"}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                {
                  name: "studyMarket",
                  label: "Étude de marché",
                  cost: studiesOffer.marketCost,
                  hint: "Demande par segment, parts de marché, prix moyens et résultats des concurrents.",
                },
                {
                  name: "studyPrice",
                  label: "Analyse de prix",
                  cost: studiesOffer.priceCost,
                  hint: "Élasticités estimées par segment, seuils psychologiques, prix de référence.",
                },
                {
                  name: "studyFinance",
                  label: "Étude financière",
                  cost: studiesOffer.financeCost,
                  hint: "Ratios complets, structure des coûts, seuil, comparaison sectorielle.",
                },
                {
                  name: "studyProject",
                  label: "Analyse de projet",
                  cost: studiesOffer.projectCost,
                  hint: "VAN, TRI et délai de récupération de l'investissement ; arbitrage de la commande du tour.",
                },
              ] as const
            ).map((study) => (
              <label
                key={study.name}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2"
              >
                <input
                  type="checkbox"
                  name={study.name}
                  defaultChecked={false}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {study.label} · {formatEuro(study.cost)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{study.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            L&apos;information a un prix, facturé en charges de structure : il se lit au seuil
            de rentabilité. Décider sans données coûte souvent plus cher.
          </p>
        </Family>
      ) : null}
      <Family
        legend="✍️ En quelques mots"
        tone="border-slate-700/60"
        legendClass="text-xs font-medium text-slate-400"
      >
        <textarea
          name="justification"
          rows={2}
          aria-label="Justification de vos décisions"
          placeholder="Pourquoi ces choix ce tour-ci ?"
          className="w-full resize-y rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-400">
          L&apos;enseignant la lira au débriefing.
        </p>
      </Family>
      </section>
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      {pending && kind === "solo" ? (
        // Le tour se résout côté serveur puis redirige : entre les deux, on
        // rend l'attente tangible — la machine tourne, étape après étape —
        // plutôt qu'un bouton grisé « Envoi en cours… ».
        <SimulationProgress periodName={periodName} />
      ) : nonTouches ? (
        // Pivots laissés aux valeurs proposées : la confirmation REMPLACE le
        // pied de navigation au lieu de s'y ajouter. Sans ça, « Oui/Non » et
        // « Valider » cohabitaient à l'écran (double boutonnage) ; ici une
        // seule action est offerte à la fois.
        <div role="alert" className="border-t border-orange-400/30 pt-3">
          <p className="text-sm text-orange-100">
            Vous validez avec les valeurs proposées pour :{" "}
            <strong>{nonTouches.map((p) => p.label).join(", ")}</strong>. C&apos;est un choix ?
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={garderLesValeurs}
              className="rounded-lg bg-orange-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
            >
              Oui, je garde ces valeurs
            </button>
            <button
              type="button"
              onClick={lesModifier}
              className="rounded-lg border border-orange-400/50 px-4 py-2.5 text-sm font-semibold text-orange-200 transition hover:bg-orange-400/10"
            >
              Non, je les modifie
            </button>
          </div>
        </div>
      ) : (
        // Pied de navigation de l'assistant : « Précédent »/« Suivant » d'une
        // étape à l'autre, et « Valider » (envoi réel) à la dernière seulement.
        // Le bouton d'avance est de type `button` : changer d'étape ne soumet
        // rien, seul le « Valider » final déclenche la résolution du tour.
        // Sur mobile, l'action principale se replie sur sa propre ligne (via
        // `order` + `flex-wrap`), calée à droite par `ml-auto` : coincée entre
        // « Précédent » et « Étape X/Y », elle rétrécissait et son libellé
        // débordait. On garde un bouton à la TAILLE DE SON CONTENU plutôt qu'une
        // barre pleine largeur, qui paraissait trop lourde sur téléphone. Sur
        // grand écran, tout revient sur une seule rangée : Précédent · Étape ·
        // action (poussée à droite par le `sm:mr-auto` du compteur).
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => setEtape((e) => Math.max(0, Math.min(e, total - 1) - 1))}
            disabled={courante === 0}
            className="order-2 shrink-0 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-30 sm:order-1"
          >
            ← Précédent
          </button>
          <span className="order-3 shrink-0 text-xs tabular-nums text-slate-400 sm:order-2 sm:mr-auto">
            Étape {courante + 1} / {total}
          </span>
          {/* Deux boutons DISTINCTS (clés) et non un seul nœud dont le type
              bascule : sans cela, React réutilisait le même <button> en passant
              de « Suivant » (type=button) à « Valider » (type=submit) pendant le
              clic, et le navigateur exécutait l'activation par défaut sur un
              bouton devenu submit — le dernier « Suivant » envoyait le tour. */}
          {derniere ? (
            <button
              key="valider"
              type="submit"
              disabled={pending || verrou != null || validationBloquee}
              className="order-1 ml-auto rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 sm:order-3 sm:ml-0"
            >
              {pending
                ? "Envoi en cours…"
                : kind === "solo"
                  ? "Valider et simuler"
                  : alreadySubmitted
                    ? "Mettre à jour mes décisions validées"
                    : "Valider les décisions de l'équipe"}
            </button>
          ) : (
            <button
              key="suivant"
              type="button"
              onClick={() => setEtape((e) => Math.min(total - 1, Math.min(e, total - 1) + 1))}
              className="order-1 ml-auto rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 sm:order-3 sm:ml-0"
            >
              Suivant →
            </button>
          )}
        </div>
      )}
      {!(pending && kind === "solo") ? (
        <p className="text-center text-xs text-slate-400">
          {kind === "solo"
            ? "Mode apprentissage : les résultats sont calculés immédiatement, à vous d'analyser."
            : "Vos décisions restent modifiables jusqu'à la clôture du tour par l'enseignant."}
        </p>
      ) : null}
    </form>
  );
}
