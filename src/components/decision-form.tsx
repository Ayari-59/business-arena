"use client";

import { bouton } from "@/components/bouton";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useGlisser, vibrer, VIBRATION_DE_REUSSITE } from "@/lib/glisser";
import { playRoundAction, type PlayRoundState } from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { sansMolette } from "@/components/sans-molette";
import {
  coutDeLAffacturage,
  coutDeLEscompte,
  echeancierEmprunt,
  totalDesEtudes,
} from "@/config/cout-du-financement";
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
import { INVITATION_NOTE } from "@/config/justification";
import {
  EngagementDuTour,
  lireLEngagement,
  type Engagement,
} from "@/components/engagement-du-tour";
import { Repliable } from "@/components/repliable";
import { ValeurRafraichie } from "@/components/chiffre-qui-arrive";
import { aideDuBudgetEntretien } from "@/config/entretien";
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
import { EcheanceDuTour } from "@/components/echeance-du-tour";
import { SimulationProgress } from "@/components/simulation-progress";
import { NomReference } from "@/components/nom-reference";
import { Aide, PanneauConsulte, TelephoneContexte } from "@/components/aide-repliable";
import { Icone, type NomDIcone } from "@/components/icone";
import { Tiroir } from "@/components/tiroir";
import { useParcours } from "@/components/parcours-mobile";
import { allerAuDebutDEtape } from "@/lib/debut-d-etape";
import {
  Carte,
  CartesContexte,
  RecapDesDecisions,
  fusionnerFinancerEtInvestir,
  estMontre,
  useModeCartes,
  type DefCarte,
} from "@/components/cartes-de-decision";
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
  simple = false,
}: {
  /**
   * Aux deux premiers niveaux, le parc se lit sans le vocabulaire du bilan : le prix, la
   * capacité, et le tour où la machine sert. L'amortissement, le coefficient d'entretien et la
   * valeur nette comptable viennent avec le niveau qui sait les lire.
   */
  simple?: boolean;
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
  const { actif: enCarte } = useModeCartes();

  return (
    <Family
      carte="investissement"
      icone="usine"
      legend="Parc machines · investir ou céder"
    >
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-sm:mb-2">
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
      <div className="space-y-3 max-sm:space-y-2">
        {offer.types.map((t) => {
          const fl = offer.fleet.find((f) => f.typeCode === t.code);
          const pend = offer.pendingFleet.find((f) => f.typeCode === t.code);
          const owned = fl?.count ?? 0;
          const pendCount = pend?.count ?? 0;
          const buy = buyQty[t.code] ?? 0;
          const sell = sellQty[t.code] ?? 0;
          const avgBook = owned > 0 ? (fl?.bookValue ?? 0) / owned : 0;
          return (
            <div key={t.code} className="rounded-lg border border-white/5 bg-slate-900 px-2.5 py-2 max-sm:py-1.5">
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
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0 text-xs text-slate-400 max-sm:mt-1">
                <span>{t.costPerUnit.toLocaleString("fr-FR")} €/u</span>
                {simple ? (
                  <span>en service au tour suivant</span>
                ) : (
                  <>
                    <span>Amorti en {Math.round(t.depreciationRounds)} tours</span>
                    <span>Maintenance ×{t.maintenanceMultiplier.toLocaleString("fr-FR")}</span>
                    {owned > 0 ? (
                      <span>VNC moy. {Math.round(avgBook).toLocaleString("fr-FR")} €</span>
                    ) : null}
                  </>
                )}
              </div>
              {/* ACHETER ET VENDRE NE SONT NI UN GAIN NI UNE PERTE : l'encre et
                  un signe, plus le vert et le rouge des résultats. */}
              <div className="mt-2 grid grid-cols-2 gap-3 max-sm:mt-1">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-300 max-sm:hidden">
                    <span aria-hidden>+ </span>Acheter
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 champ px-2 py-1 max-sm:mt-0">
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-300 sm:hidden">
                      <span aria-hidden>+ </span>Acheter
                    </span>
                    <input
                      type="number"
                      onWheel={sansMolette}
                      aria-label={`Acheter · ${t.name}`}
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
                    <span className="mt-0.5 block text-xs text-slate-300">
                      = {(buy * t.costPerUnit).toLocaleString("fr-FR")} €
                    </span>
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-300 max-sm:hidden">
                    <span aria-hidden>− </span>Vendre
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 champ px-2 py-1 max-sm:mt-0">
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-300 sm:hidden">
                      <span aria-hidden>− </span>Vendre
                    </span>
                    <input
                      type="number"
                      onWheel={sansMolette}
                      aria-label={`Vendre · ${t.name}`}
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
                    <span className="mt-0.5 block text-xs text-slate-300">
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
      {enCarte ? (
        <div className="mt-2">
          <Tiroir titre="Mise en service et revente" ferme>
            <p className="text-sm leading-relaxed text-slate-400">
              Les machines achetées entrent en service au tour suivant. La revente se fait à la
              valeur de marché (VNC × ratio de revente) : vendre en dessous de la VNC génère une
              perte de cession, un coût bien réel que le résultat encaisse.
            </p>
          </Tiroir>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Les machines achetées entrent en service au tour suivant. La revente se fait à la
          valeur de marché (VNC × ratio de revente) : vendre en dessous de la VNC génère une
          perte de cession, un coût bien réel que le résultat encaisse.
        </p>
      )}
    </Family>
  );
}

/**
 * CE QUE LA DÉCISION VA COÛTER, SOUS LE CHAMP QUI LA PORTE.
 *
 * Un taux annoncé n'apprend rien : l'élève saisit un montant et ne rencontre
 * jamais le chiffre qui l'intéresse. Ces lignes se recalculent à la frappe, et
 * les nombres qu'elles montrent sont exactement ceux que le moteur appliquera
 * (voir `config/cout-du-financement`, et le test qui compare les deux).
 *
 * Rien ne s'affiche tant que le montant est nul : un encadré de zéros à côté
 * d'un champ vide est un meuble, pas une information.
 */
function Chiffrage({
  lignes,
}: {
  lignes: { label: string; valeur: string; fort?: boolean; alerte?: boolean }[];
}) {
  if (lignes.length === 0) return null;
  return (
    <dl
      role="status"
      className="mt-2 grid gap-x-4 gap-y-1 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-xs sm:grid-cols-[auto_1fr]"
    >
      {lignes.map((ligne) => (
        <div key={ligne.label} className="contents">
          <dt className={ligne.alerte ? "text-red-300" : "text-slate-400"}>{ligne.label}</dt>
          <dd
            className={`text-right tabular-nums sm:text-left ${
              ligne.alerte
                ? "font-semibold text-red-300"
                : ligne.fort
                  ? // Une valeur chiffrée est une information : l'encre, jamais l'orange
                    // de l'action (charte).
                    "font-semibold text-slate-50"
                  : "text-slate-200"
            }`}
          >
            {ligne.valeur}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * CE QUE LES BUDGETS SORTENT DE LA CAISSE CE TOUR-CI, SOUS LES BUDGETS.
 *
 * Chaque montant se saisit dans son coin ; leur somme n'apparaissait qu'au
 * récapitulatif de la dernière étape, c'est-à-dire après l'arbitrage. Elle est
 * calculée par `engagement-du-tour.tsx`, lue sur le formulaire : un total qui
 * tiendrait ses propres valeurs finirait par mentir.
 *
 * ET ON LE VOIT SE METTRE À JOUR. Il suivait déjà la frappe, mais sans qu'un
 * pixel ne le dise : on arbitrait en regardant un nombre qu'on croyait figé.
 * `ValeurRafraichie` ouvre et referme l'anneau d'accent autour de lui à chaque
 * recalcul (voir `components/chiffre-qui-arrive.tsx`).
 */
function TotalDesBudgets({ engagement }: { engagement: Engagement | null }) {
  const { actif: enCarte } = useModeCartes();
  // En parcours, les budgets sont une carte à eux et le récapitulatif vient
  // juste après : un total de plus y prendrait la place d'un champ.
  if (enCarte || !engagement || engagement.budgets.length === 0) return null;
  return (
    <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/10 pt-3 text-sm">
      <span className="text-slate-400">Total des budgets du tour</span>
      <strong className="font-semibold tabular-nums text-slate-50">
        <ValeurRafraichie valeur={engagement.total}>{formatEuro(engagement.total)}</ValeurRafraichie>
      </strong>
    </p>
  );
}

/**
 * LA DÉCISION N°1 N'A PAS LE MÊME CHAMP QU'UNE CASE FACULTATIVE.
 *
 * Sur ordinateur, le prix — la décision qui commande tout le tour — avait
 * exactement la forme de « Budget RSE » : un intitulé de 12 px en capitales
 * grises, un cadre de 14 px. L'écran était un formulaire d'administration, où
 * rien ne disait ce qui pèse.
 *
 * Un champ MAJEUR porte donc son intitulé à l'encre, en lettres ordinaires, et
 * son chiffre en 30 px tabulaires, l'unité posée à côté. Dessous, le repère du
 * tour passé : le prix pratiqué, le volume vendu. C'est une DONNÉE (bleu
 * donnée), pas un résultat : ni vert ni rouge sur un niveau, et jamais
 * l'orange de l'action.
 *
 * Le repère ne s'invente pas — il vient de la vue de partie — et il manque au
 * premier tour, où il n'y a rien à rappeler : la ligne ne paraît alors pas.
 */
function ChampMajeur({
  name,
  label,
  defaultValue,
  step,
  max,
  suffix,
  hint,
  repere,
  onValueChange,
  inputRef,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step: number;
  max?: number;
  suffix: string;
  hint?: string;
  /** Ce que le tour passé a donné, déjà formaté. Absent au premier tour. */
  repere?: string;
  onValueChange?: (valeur: number) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const interne = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? interne;
  return (
    <label className="block">
      <span className="block text-base font-semibold text-slate-100">{label}</span>
      <span className="mt-1.5 flex items-baseline gap-2 champ px-4 py-3">
        <input
          type="number"
          onWheel={sansMolette}
          inputMode="decimal"
          {...(max !== undefined ? { max } : {})}
          ref={ref}
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
          className="min-w-0 flex-1 bg-transparent text-3xl font-bold tabular-nums text-slate-50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="shrink-0 text-base text-slate-400">{suffix}</span>
      </span>
      {repere ? (
        <span
          data-repere-du-tour-passe
          className="mt-1.5 block text-sm tabular-nums text-[var(--donnee)]"
        >
          {repere}
        </span>
      ) : null}
      {hint ? <span className="mt-1 block text-sm text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Field({
  name,
  label,
  defaultValue,
  step = 1,
  max,
  suffix,
  hint,
  onValueChange,
  inputRef,
  plage,
  libelle,
  sansCurseur,
  majeur = false,
  repere,
}: {
  /** L'étiquette courte d'une ligne compacte (plusieurs champs sur la même carte). Absente : le champ est en grand. */
  libelle?: string;
  /** Une décision majeure : sur ordinateur, un champ large et un chiffre de 30 px. */
  majeur?: boolean;
  /** Le repère du tour passé, déjà formaté : lu sous un champ majeur. */
  repere?: string;
  /** Pas de curseur : le montant se tape. */
  sansCurseur?: boolean;
  name: string;
  label: string;
  defaultValue: number;
  step?: number;
  /** Plafond opposable : le navigateur refuse d'envoyer au-delà. */
  max?: number;
  suffix: string;
  hint?: string;
  /** Remonte la valeur saisie, pour les champs qu'une règle doit suivre en direct. */
  onValueChange?: (valeur: number) => void;
  /** Donne la main sur la saisie : le curseur écrit dedans, elle reste la source. */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** La plage du curseur, sur téléphone ; à défaut, jusqu'au double de la valeur proposée. */
  plage?: { min?: number; max: number };
}) {
  const { actif: enCarte } = useModeCartes();
  const interne = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? interne;
  // PLUSIEURS CHAMPS SUR UNE CARTE : la ligne compacte. Le grand bloc est pour le champ qui est la
  // question de sa carte ; une carte doit tenir sur un écran, et à trois champs il n'y tient plus.
  const compact = enCarte && (libelle !== undefined || !CHAMPS_SEULS_SUR_LEUR_CARTE.includes(name));
  if (compact) {
    return (
      <div className="block">
        <SaisieDeCarte
          name={name}
          label={label}
          defaultValue={defaultValue}
          step={step}
          {...(max !== undefined ? { max } : {})}
          suffixe={suffix}
          {...(plage ? { plage } : {})}
          // Un curseur n'a de sens qu'avec une échelle : un plafond connu, une valeur proposée à
          // doubler. Un champ à zéro, sans plafond, n'en a pas : « 0 à 20 000 € » n'était qu'un décor.
          sansCurseur={sansCurseur ?? (inputRef !== undefined || (!plage && !(defaultValue > 0)))}
          grand={false}
          compact
          libelle={libelle ?? label}
          inputRef={ref}
          {...(onValueChange ? { onValueChange } : {})}
        />
        {hint ? <span className="mt-0.5 block text-sm text-slate-400">{hint}</span> : null}
      </div>
    );
  }
  if (enCarte) {
    return (
      <div className="block">
        {/* Seul sur sa carte, le chiffre est celui de la question ; parmi d'autres, il se nomme. */}
        {CHAMPS_SEULS_SUR_LEUR_CARTE.includes(name) ? null : (
          <span className="mb-1.5 block text-base font-medium text-slate-200">{label}</span>
        )}
        <SaisieDeCarte
          name={name}
          label={label}
          defaultValue={defaultValue}
          step={step}
          {...(max !== undefined ? { max } : {})}
          suffixe={suffix}
          {...(plage ? { plage } : {})}
          // Un champ plafonné porte déjà son curseur (voir ChampPlafonne).
          sansCurseur={inputRef !== undefined}
          // Un champ seul sur sa carte se lit en grand ; plusieurs sur la même, plus serré.
          grand={CHAMPS_SEULS_SUR_LEUR_CARTE.includes(name)}
          inputRef={ref}
          {...(onValueChange ? { onValueChange } : {})}
        />
        {hint ? <span className="mt-2 block text-sm text-slate-400 max-sm:text-base">{hint}</span> : null}
      </div>
    );
  }
  // SUR ORDINATEUR, LA HIÉRARCHIE : une décision majeure a son champ large, les
  // budgets et les options gardent le champ normal.
  if (majeur) {
    return (
      <ChampMajeur
        name={name}
        label={label}
        defaultValue={defaultValue}
        step={step}
        {...(max !== undefined ? { max } : {})}
        suffix={suffix}
        {...(hint ? { hint } : {})}
        {...(repere ? { repere } : {})}
        {...(onValueChange ? { onValueChange } : {})}
        {...(inputRef ? { inputRef } : {})}
      />
    );
  }
  return (
    <label className="block">
      <span className="block min-h-8 leading-4 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="mt-1 flex items-center gap-2 champ px-3 py-2">
        <input
          type="number"
          onWheel={sansMolette}
          {...(max !== undefined ? { max } : {})}
          ref={ref}
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
      {hint ? <span className="mt-1 block text-sm text-slate-400">{hint}</span> : null}
    </label>
  );
}

/**
 * LE PAS D'UN CURSEUR SE LIT SANS COMPTER : 1, 2 ou 5 fois une puissance de dix.
 * Un plafond de 312 000 € se règle par 5 000, jamais par 3 124.
 */
export function pasDuCurseur(plafond: number): number {
  const brut = plafond / 100;
  if (!(brut > 0)) return 1;
  const puissance = Math.pow(10, Math.floor(Math.log10(brut)));
  for (const multiple of [1, 2, 5]) {
    if (brut <= multiple * puissance) return multiple * puissance;
  }
  return 10 * puissance;
}

/**
 * OÙ LE CURSEUR S'ARRÊTE : sur un cran rond, sauf tout en haut.
 *
 * Arrondir au pas laisserait le dernier cran sous le plafond — 310 000 quand
 * la banque en prête 312 453 —, et le « ce que la banque prête encore » écrit
 * sous le curseur serait faux d'un cran. Le bout du curseur vaut donc le
 * plafond EXACT.
 */
export function cranDuCurseur(brut: number, maximum: number, pas: number): number {
  if (!(maximum > 0)) return 0;
  if (brut >= maximum - pas / 2) return maximum;
  return Math.min(Math.max(0, Math.round(brut / pas) * pas), maximum);
}

/** Les champs qui ont leur carte à eux : le chiffre y est le seul sujet. */
const CHAMPS_SEULS_SUR_LEUR_CARTE = [
  "price",
  "productionPlan",
  "marketingBudget",
  "qualityBudget",
  "maintenanceBudget",
];

/**
 * LA PLAGE D'UN CURSEUR QUAND PERSONNE NE LA DONNE : jusqu'au double de la valeur
 * proposée, arrondi à un cran rond. Un champ à zéro (une embauche, un emprunt)
 * n'a pas de point de départ à doubler : l'unité dit alors l'ordre de grandeur.
 */
export function plageAuto(valeur: number, suffixe: string): { min: number; max: number } {
  if (valeur > 0) {
    const brut = valeur * 2;
    const pas = pasDuCurseur(brut);
    return { min: 0, max: Math.ceil(brut / pas) * pas };
  }
  if (suffixe === "€") return { min: 0, max: 20000 };
  return { min: 0, max: 10 };
}

/**
 * LE CURSEUR D'UNE SAISIE, SUR TÉLÉPHONE. Un doigt règle un montant d'un geste, là
 * où des boutons − et + l'auraient fait cran par cran. La saisie au clavier reste
 * au-dessus : c'est elle qui porte la valeur et le `name`, le curseur ne fait que
 * l'écrire — par le même chemin que le brouillon à la restauration — et la suit
 * quand elle change (le brouillon, une frappe).
 */
function CurseurDeSaisie({
  champ,
  label,
  min,
  max,
  suffixe,
  valeurInitiale,
  compact = false,
}: {
  champ: RefObject<HTMLInputElement | null>;
  label: string;
  min: number;
  max: number;
  suffixe: string;
  valeurInitiale: number;
  /** Les bornes de part et d'autre du curseur, sur une seule ligne : la forme d'un champ parmi plusieurs. */
  compact?: boolean;
}) {
  const [valeur, setValeur] = useState(valeurInitiale);
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    const suivre = () => setValeur(Number(el.value.replace(",", ".")) || 0);
    el.addEventListener("input", suivre);
    return () => el.removeEventListener("input", suivre);
  }, [champ]);
  const etendue = Math.max(1, max - min);
  const pas = pasDuCurseur(etendue);
  const curseur = (
    <input
      type="range"
      onWheel={sansMolette}
      aria-label={`${label} : curseur`}
      min={min}
      max={max}
      step="any"
      value={Math.min(Math.max(valeur, min), max)}
      onChange={(e) => {
        const cran = min + cranDuCurseur(Number(e.currentTarget.value) - min, etendue, pas);
        if (champ.current) poserValeur(champ.current, String(Math.round(cran * 100) / 100));
      }}
      className="curseur curseur-jeu min-w-0 accent-amber-400"
      // 44 px : sous le pouce, le trait de 24 px se manque ; 40 px quand le champ n'est qu'un parmi
      // plusieurs. (Hors classe : la règle de `.curseur` n'est pas dans une couche et l'emporterait
      // sur un utilitaire.) `--part` : la part parcourue, que la piste peint en laiton.
      style={
        {
          height: compact ? "2.5rem" : "2.75rem",
          "--part": `${Math.round(((Math.min(Math.max(valeur, min), max) - min) / Math.max(1, max - min)) * 100)}%`,
        } as React.CSSProperties
      }
    />
  );
  if (compact) {
    return (
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-sm text-slate-400 tabular-nums">
        <span>{min.toLocaleString("fr-FR")}</span>
        {curseur}
        <span>
          {max.toLocaleString("fr-FR")} {suffixe}
        </span>
      </div>
    );
  }
  return (
    <div className="mt-4">
      {curseur}
      <span className="mt-1 flex justify-between gap-2 text-base text-slate-400 tabular-nums">
        <span>
          {min.toLocaleString("fr-FR")} {suffixe}
        </span>
        <span>
          {max.toLocaleString("fr-FR")} {suffixe}
        </span>
      </span>
    </div>
  );
}

/**
 * Une saisie chiffrée en grand, avec son curseur : la forme d'un champ de décision
 * sur une carte (téléphone). Utilisée par `Field` et par les cellules de la gamme.
 */
function SaisieDeCarte({
  name,
  label,
  defaultValue,
  step,
  max,
  suffixe,
  plage,
  sansCurseur = false,
  obligatoire = true,
  inputRef,
  onValueChange,
  grand = true,
  compact = false,
  libelle,
}: {
  name: string;
  label: string;
  defaultValue: number;
  step: number;
  max?: number;
  suffixe: string;
  plage?: { min?: number; max: number };
  sansCurseur?: boolean;
  obligatoire?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onValueChange?: (valeur: number) => void;
  grand?: boolean;
  /**
   * Plusieurs champs sur une même carte (les références d'une gamme) : l'étiquette à gauche et le
   * montant à droite sur UNE ligne, le curseur dessous. Le grand bloc est beau quand il tient sur un
   * écran ; à cinq par carte, il n'y tient plus.
   */
  compact?: boolean;
  /** L'étiquette visible de la ligne compacte (le `label` reste le nom accessible du champ). */
  libelle?: string;
}) {
  const interne = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? interne;
  const auto = plageAuto(defaultValue, suffixe);
  const borneMin = plage?.min ?? 0;
  const borneMax = plage?.max ?? max ?? auto.max;
  // LE BLOC SE CALE SUR LE MONTANT. Un chiffre de six caractères n'a pas besoin du corps ni
  // de la hauteur d'un chiffre de deux : la taille suit le nombre de caractères, l'unité se
  // pose à côté du chiffre plutôt qu'en dessous, et un champ parmi d'autres sur sa carte est
  // plus bas que celui qui l'occupe seul.
  const [longueur, setLongueur] = useState(String(defaultValue).length);
  const corps = grand
    ? longueur <= 5
      ? "text-5xl"
      : longueur <= 8
        ? "text-4xl"
        : "text-3xl"
    : longueur <= 6
      ? "text-3xl"
      : longueur <= 9
        ? "text-2xl"
        : "text-xl";
  if (compact) {
    return (
      <div className="block">
        <label className="flex min-h-10 items-center justify-between gap-3">
          <span className="min-w-0 flex-1 text-base text-slate-300">{libelle ?? label}</span>
          <span className="champ flex min-h-10 w-44 shrink-0 items-baseline justify-end gap-1.5 px-3 py-1">
            <input
              type="number"
              onWheel={sansMolette}
              inputMode="decimal"
              aria-label={label}
              {...(max !== undefined ? { max } : {})}
              ref={ref}
              name={name}
              defaultValue={defaultValue}
              step={step}
              min={0}
              required={obligatoire}
              onInput={(e) => setLongueur(Math.max(1, e.currentTarget.value.length))}
              onChange={
                onValueChange
                  ? (e) => {
                      const v = Number(e.currentTarget.value.replace(",", "."));
                      onValueChange(Number.isFinite(v) ? v : 0);
                    }
                  : undefined
              }
              className="min-w-0 flex-1 bg-transparent text-right text-xl font-bold tabular-nums text-slate-50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="shrink-0 text-base text-slate-400">{suffixe}</span>
          </span>
        </label>
        {sansCurseur ? null : (
          <CurseurDeSaisie
            champ={ref}
            label={label}
            min={borneMin}
            max={Math.max(borneMax, borneMin + 1)}
            suffixe={suffixe}
            valeurInitiale={defaultValue}
            compact
          />
        )}
      </div>
    );
  }
  return (
    <div className="block">
      {/* Une étiquette, pas une boîte : toucher n'importe où dans le cadre met le curseur dans le
          champ, qui n'a que la largeur de son contenu. */}
      <label
        className={`champ flex flex-wrap items-baseline justify-center gap-x-2 px-4 ${grand ? "py-4" : "py-2.5"}`}
      >
        <input
          type="number"
          onWheel={sansMolette}
          inputMode="decimal"
          aria-label={label}
          {...(max !== undefined ? { max } : {})}
          ref={ref}
          name={name}
          defaultValue={defaultValue}
          step={step}
          min={0}
          required={obligatoire}
          onInput={(e) => setLongueur(Math.max(1, e.currentTarget.value.length))}
          onChange={
            onValueChange
              ? (e) => {
                  const v = Number(e.currentTarget.value.replace(",", "."));
                  onValueChange(Number.isFinite(v) ? v : 0);
                }
              : undefined
          }
          // Le champ épouse son contenu (en `ch`, chiffres tabulaires) : chiffre et unité
          // restent côte à côte et centrés, quelle que soit la taille du nombre.
          style={{ width: `${Math.max(2, longueur) + 0.5}ch` }}
          className={`max-w-full min-w-0 bg-transparent text-center font-bold tabular-nums text-slate-50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${corps}`}
        />
        <span className="text-base text-slate-400">{suffixe}</span>
      </label>
      {sansCurseur ? null : (
        <CurseurDeSaisie
          champ={ref}
          label={label}
          min={borneMin}
          max={Math.max(borneMax, borneMin + 1)}
          suffixe={suffixe}
          valeurInitiale={defaultValue}
        />
      )}
    </div>
  );
}

/**
 * UN PLAFOND QUI TIENT, PLUTÔT QU'UN PLAFOND QUI PRÉVIENT.
 *
 * Quatre décisions ont un plafond connu avant la validation, et que le moteur
 * applique EN SILENCE : l'emprunt (ratio × capitaux propres − dette), l'apport
 * (l'enveloppe des associés), le remboursement anticipé (la dette restante) et
 * le dividende (les réserves). Taper au-delà ne déclenche rien : la décision
 * part entière, `Math.min` la rabote, et l'élève découvre l'écart au tour
 * suivant sans savoir d'où il vient.
 *
 * Le curseur ne va pas au-delà. Le plafond devient une borne qu'on sent sous le
 * doigt, pas un avertissement après coup. La saisie reste à côté : une décision
 * de gestion se prend au chiffre près, et un curseur seul ne donne pas 312 000
 * pile. C'est elle qui porte la valeur et le `name` ; le curseur ne fait que
 * l'écrire, par le même chemin que le brouillon à la restauration.
 */
function ChampPlafonne({
  name,
  label,
  plafond,
  suffix,
  hint,
  legendePlafond,
  defaultValue = 0,
  onValueChange,
}: {
  name: string;
  label: string;
  /** Le maximum que le moteur retiendra. Au-delà, il rabote sans le dire. */
  plafond: number;
  suffix: string;
  hint?: string;
  /** Ce que vaut le bout du curseur, en toutes lettres. */
  legendePlafond: string;
  defaultValue?: number;
  onValueChange?: (valeur: number) => void;
}) {
  const champ = useRef<HTMLInputElement | null>(null);
  const [valeur, setValeur] = useState(defaultValue);
  const { actif: enCarte } = useModeCartes();
  const maximum = Math.max(0, Math.floor(plafond));
  const pas = pasDuCurseur(maximum);

  if (enCarte) {
    // En parcours : la ligne compacte, son curseur borné au plafond, et le plafond dit sous le
    // curseur ; l'explication (`hint`) se range dans l'aide de la carte, que le parent compose.
    return (
      <div>
        <Field
          name={name}
          label={label}
          libelle={label}
          defaultValue={defaultValue}
          max={maximum}
          suffix={suffix}
          inputRef={champ}
          onValueChange={(v) => {
            setValeur(v);
            onValueChange?.(v);
          }}
        />
        {maximum > 0 ? (
          <CurseurDeSaisie
            champ={champ}
            label={label}
            min={0}
            max={maximum}
            suffixe={suffix}
            valeurInitiale={valeur}
            compact
          />
        ) : null}
        {hint ? <span className="mt-0.5 block text-sm text-slate-400">{hint}</span> : null}
      </div>
    );
  }

  return (
    <div>
      <Field
        name={name}
        label={label}
        defaultValue={defaultValue}
        max={maximum}
        suffix={suffix}
        hint={hint}
        inputRef={champ}
        onValueChange={(v) => {
          setValeur(v);
          onValueChange?.(v);
        }}
      />
      {maximum > 0 ? (
        <>
          <input
            type="range"
            onWheel={sansMolette}
            aria-label={`${label} : curseur`}
            min={0}
            max={maximum}
            step="any"
            value={Math.min(Math.max(valeur, 0), maximum)}
            onChange={(e) => {
              const cran = cranDuCurseur(Number(e.currentTarget.value), maximum, pas);
              if (champ.current) poserValeur(champ.current, String(cran));
            }}
            className="curseur mt-2 accent-amber-400"
            style={{ height: "2.75rem" }}
          />
          <span className="flex justify-between gap-2 text-sm text-slate-400">
            <span>0 {suffix}</span>
            <span className="text-right tabular-nums">
              {maximum.toLocaleString("fr-FR")} {suffix} · {legendePlafond}
            </span>
          </span>
        </>
      ) : null}
    </div>
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
    <span className="pastille-etat ml-2 whitespace-nowrap rounded-full px-2 py-0.5 align-middle text-xs font-medium text-slate-200">
      en développement
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
            <span aria-hidden className="text-slate-400"> ·</span>
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
      <dt className="text-xs uppercase leading-4 tracking-wide text-slate-400">{label}</dt>
      <dd className={`text-sm font-medium tabular-nums ${couleur}`} data-testid={testId}>
        {valeur}
      </dd>
      {note ? <dd className="text-sm leading-snug text-slate-400">{note}</dd> : null}
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
  capacite,
  tourPasse,
}: {
  /** Ce que l'atelier peut produire ce tour, toutes références confondues : le haut du curseur de volume. */
  capacite?: number;
  /**
   * Ce que chaque référence a donné au tour passé : le prix pratiqué et le
   * volume vendu, lus de la vue de partie. Absent au premier tour — la ligne
   * de repère ne paraît alors pas.
   */
  tourPasse?: Record<string, { tour: number; prix: number | null; volume: number | null }>;
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
  const [produitChoisi, setActiveProduct] = useState(gamme[0]?.code ?? "");
  // EN CARTES (téléphone), la référence affichée est celle de la carte courante :
  // une carte par référence, plus d'onglets pour passer de l'une à l'autre.
  const { actif: enCartes, courante: carteCourante } = useModeCartes();
  const activeProduct = enCartes
    ? (gamme.find((p) => `ref-${p.code}` === carteCourante)?.code ?? gamme[0]?.code ?? "")
    : produitChoisi;
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
  const visible = (code: string) => (surGrandEcran && !enCartes) || code === activeProduct;
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
  const rien = <span className="text-slate-400">—</span>;

  /** Les deux décisions majeures d'une référence : son prix et son volume. */
  const majeur = (nom: string) => nom === "price" || nom === "productionPlan";

  /** Un champ chiffré, dans sa cellule. */
  const champ = (
    p: Reference,
    nom: "price" | "productionPlan" | "marketingBudget" | "qualityBudget" | "rdBudget",
    label: string,
    valeur: number,
    suffixe: string,
    pas = 1,
    onChange?: (v: number) => void,
  ) =>
    enCartes ? (
      <SaisieDeCarte
        name={productFieldName(p.code, nom)}
        label={`${label} · ${p.name}`}
        defaultValue={valeur}
        step={pas}
        suffixe={suffixe}
        obligatoire={visible(p.code)}
        grand={false}
        compact
        libelle={label}
        // Le curseur sert au prix et au volume, qu'on tâtonne. Les budgets (marketing, qualité, R&D)
        // se tapent : un curseur de plus par ligne ne tenait plus sur l'écran, et ne servait à rien.
        sansCurseur={nom !== "price" && nom !== "productionPlan"}
        // Le prix se règle autour de ce que paient les clients ; le reste, autour de la valeur proposée.
        {...(nom === "price" ? { plage: { min: 0, max: Math.ceil((p.refPrice * 2.2) / 5) * 5 } } : {})}
        {...(nom === "productionPlan" && capacite ? { plage: { min: 0, max: Math.max(capacite, valeur) } } : {})}
        {...(onChange ? { onValueChange: onChange } : {})}
      />
    ) : (
    // LE PRIX ET LE VOLUME SONT LES DÉCISIONS MAJEURES DE LA RÉFÉRENCE : leur
    // chiffre se lit en 24 px, les budgets gardent le corps du tableau.
    <span
      className={`flex items-center gap-1.5 champ ${
        enCartes ? "px-4 py-3" : majeur(nom) ? "px-2.5 py-2" : "px-2 py-1.5"
      }`}
    >
      <input
        type="number"
        onWheel={sansMolette}
        name={productFieldName(p.code, nom)}
        aria-label={`${label} · ${p.name}`}
        defaultValue={valeur}
        onChange={onChange ? (e) => onChange(Number(e.currentTarget.value.replace(",", "."))) : undefined}
        step={pas}
        min={0}
        required={visible(p.code)}
        className={`min-w-0 flex-1 bg-transparent tabular-nums text-slate-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${
          enCartes ? "text-xl" : majeur(nom) ? "text-2xl font-bold text-slate-50" : "text-sm"
        }`}
      />
      <span className={`shrink-0 text-slate-400 ${enCartes ? "text-base" : "text-xs"}`}>{suffixe}</span>
    </span>
    );

  /**
   * Les lignes de la matrice, dans l'ordre du raisonnement. Une ligne absente
   * (pas de façonnier dans ce secteur, pas de qualité à ce niveau) n'est pas
   * une ligne vide : elle n'existe pas.
   */
  const lignes: {
    cle: string;
    label: string;
    deduite?: boolean;
    /** Une décision majeure de la référence : son intitulé se lit à l'encre. */
    majeure?: boolean;
    cellule: (p: Reference) => ReactNode;
  }[] = [
    {
      cle: "refPrice",
      label: "Prix usuel",
      deduite: true,
      cellule: (p) => <span className="tabular-nums">{formatEuro(p.refPrice)}</span>,
    },
    // LE REPÈRE DU TOUR PASSÉ, référence par référence : ce qui a été pratiqué
    // et ce qui s'est vendu. C'est une DONNÉE (bleu donnée), pas un résultat ;
    // la ligne n'existe pas au premier tour, où il n'y a rien à rappeler.
    ...(tourPasse && gamme.some((p) => tourPasse[p.code]?.prix != null)
      ? [
          {
            cle: "tour-passe",
            label: "Tour passé",
            deduite: true,
            cellule: (p: Reference) => {
              const avant = tourPasse[p.code];
              if (!avant || avant.prix === null) return rien;
              return (
                <span data-repere-du-tour-passe className="tabular-nums text-[var(--donnee)]">
                  {formatEuro(avant.prix)}
                  {avant.volume !== null ? ` · ${formatUnits(avant.volume)} ${v.units}` : ""}
                </span>
              );
            },
          },
        ]
      : []),
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
                    className={`w-full champ text-slate-100 outline-none ${enCartes ? "px-3 py-2.5 text-base" : "px-2 py-1.5 text-sm"}`}
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
      majeure: true,
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
        // UNE MARGE UNITAIRE EST UN NIVEAU, pas un résultat : elle s'écrit à
        // l'encre (charte). Le rouge reste pour celle qui passe sous zéro —
        // vendre au-dessous du coût variable est, lui, un fait à signaler.
        return (
          <span className={`font-medium tabular-nums ${marge < 0 ? "text-red-400" : ""}`}>
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
      majeure: true,
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

  if (enCartes) {
    return (
      <div>
        {gamme.map((p) => (
          <div key={p.code} hidden={p.code !== activeProduct} className="space-y-2">
            {(() => {
              // Les trois repères qui font la décision (prix usuel, coût variable, marge) se lisent
              // d'un coup d'œil ; stock, saison et coefficient se consultent, dans un tiroir fermé :
              // une carte doit tenir sur un écran.
              const reperes = lignes.filter(
                (l) => l.deduite && !(enDeveloppement(p) && (l.cle === "marge" || l.cle === "coef")),
              );
              const principaux = reperes.filter((l) => ["refPrice", "cvu", "marge"].includes(l.cle));
              const autres = reperes.filter((l) => !["refPrice", "cvu", "marge"].includes(l.cle));
              // Libellés courts pour tenir sur une ligne : « Coût », « Marge ».
              const courts: Record<string, string> = { cvu: "Coût", marge: "Marge" };
              const repere = (l: (typeof lignes)[number]) => (
                <span key={l.cle} className="whitespace-nowrap">
                  <span className="text-slate-400">{courts[l.cle] ?? l.label}</span> {l.cellule(p)}
                </span>
              );
              const pastille = (l: (typeof lignes)[number]) => (
                <li
                  key={l.cle}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-sm text-slate-200"
                >
                  <span className="text-slate-400">{l.label}</span> {l.cellule(p)}
                </li>
              );
              return (
                <>
                  {/* Une ligne de texte, pas trois pastilles : elles passaient sur deux rangées. */}
                  <p className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-200">
                    {principaux.map(repere)}
                  </p>
                  {autres.length > 0 ? (
                    <Tiroir titre="Autres repères" ferme>
                      <ul className="flex flex-wrap gap-1.5">{autres.map(pastille)}</ul>
                    </Tiroir>
                  ) : null}
                </>
              );
            })()}
            {enDeveloppement(p) ? <EnDeveloppement /> : null}
            {lignes
              .filter((l) => !l.deduite)
              .map((l) => {
                // Un champ chiffré porte son étiquette sur sa propre ligne (compacte) ; une cellule
                // sans objet (référence à bâtir) ou le choix du fournisseur gardent la leur au-dessus.
                const aVendre = ["price", "productionPlan", "marketingBudget", "qualityBudget"].includes(l.cle);
                // Une référence à bâtir ne se vend ni ne se produit : ses champs restent dans le
                // formulaire (leur valeur part à zéro), masqués, sans étiquette ni tiret.
                if (aVendre && enDeveloppement(p)) {
                  return (
                    <div key={l.cle} hidden>
                      {l.cellule(p)}
                    </div>
                  );
                }
                // Le fournisseur : l'étiquette à gauche du choix, sur la même ligne.
                if (l.cle === "supplierChoice") {
                  return (
                    <div key={l.cle} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3">
                      <span className="text-base text-slate-300">{l.label}</span>
                      <div className="min-w-0">{l.cellule(p)}</div>
                    </div>
                  );
                }
                const etiquetteIntegree = aVendre || l.cle === "rdBudget";
                return (
                  <div key={l.cle} className="space-y-1">
                    {etiquetteIntegree ? null : (
                      <span className="block text-base text-slate-300">{l.label}</span>
                    )}
                    {l.cellule(p)}
                  </div>
                );
              })}
            {chantiers
              .filter((c) => c.p.code === p.code)
              .map(({ dev }) => {
                const reste = Math.max(0, dev.cost - dev.invested);
                return (
                  <p key={p.code} className="text-base leading-relaxed text-slate-300">
                    {reste <= 0
                      ? `Financée (${formatEuro(dev.invested)} engagés) : vendable dès le tour ${Math.max(dev.availableFromRound, roundIndex + 1)}.`
                      : `${formatEuro(dev.invested)} engagés sur ${formatEuro(dev.cost)} : il reste ${formatEuro(reste)} à financer, puis elle se vend dès le tour suivant (au plus tôt le tour ${dev.availableFromRound}).`}
                  </p>
                );
              })}
          </div>
        ))}
      </div>
    );
  }

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
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              activeProduct === p.code
                ? // La référence choisie est un ÉTAT CHOISI : voile neutre et filet
                  // orange plein (charte), comme l'onglet d'étape.
                  "voile-neutre border-amber-400 text-slate-100"
                : "border-white/5 bg-slate-900 text-slate-400 hover:text-slate-200"
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
                  className={
                    l.majeure
                      ? "py-1.5 pr-2 text-left align-middle text-sm font-semibold leading-5 text-slate-100"
                      : "py-1.5 pr-2 text-left align-top text-xs font-medium uppercase leading-4 tracking-wide text-slate-400"
                  }
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
          <p key={p.code} className="text-sm leading-relaxed text-slate-300">
            <strong className="font-medium">{p.name}</strong> —{" "}
            {reste <= 0
              ? `financée (${formatEuro(dev.invested)} engagés) : vendable dès le tour ${Math.max(dev.availableFromRound, roundIndex + 1)}.`
              : `${formatEuro(dev.invested)} engagés sur ${formatEuro(dev.cost)} : il reste ${formatEuro(reste)} à financer, puis elle se vend dès le tour suivant (au plus tôt le tour ${dev.availableFromRound}).`}
          </p>
        );
      })}

      <Aide>
        <p className="text-sm leading-relaxed text-slate-400">
          Capacité partagée : si la somme des volumes la dépasse, toutes les références sont
          réduites dans la même proportion.
          {avecFournisseurs
            ? " Le façonnier choisi ne vaut que pour sa référence : son coût d'achat, sa qualité, son délai, son risque de rupture."
            : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Chaque budget va à sa référence et se paie le tour même. Marketing : effet immédiat,
          qui retombe si on cesse
          {quality ? " ; qualité : la qualité perçue" : ""}
          {avecRd ? " ; R&D : le niveau technique, avec retard" : ""}.
        </p>
      </Aide>
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
  icone,
  children,
  defaultOpen = true,
  tone = "border-white/10 bg-slate-950",
  legendClass = "text-xs font-semibold uppercase tracking-wide text-slate-400",
  carte,
  repli = false,
  quoi,
}: {
  legend: ReactNode;
  /**
   * Le repère de la famille, dessiné en laiton devant son titre. Il était écrit
   * en emoji au début de la légende : une pastille de couleur étrangère au
   * site, différente sur chaque téléphone de la classe.
   */
  icone?: NomDIcone;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: string;
  legendClass?: string;
  /**
   * La ou les cartes (parcours téléphone) sur lesquelles cette famille se montre.
   * En parcours, une famille se présente À PLAT, sans titre ni repli : la carte a
   * sa propre question. Sans cette indication, elle ne paraît sur aucune carte.
   */
  carte?: string | string[];
  /**
   * UNE OPTION PONCTUELLE, REPLIÉE PAR DÉFAUT (ordinateur).
   *
   * L'assurance, les études, la commande exceptionnelle, le dividende et les
   * outils de trésorerie ne se touchent qu'un tour sur trois ; dépliés, ils
   * poussaient le prix et le volume hors de l'écran. Ils prennent le repli du
   * site (`Repliable` du lot 3B : un chevron, un bord plein), et `quoi` annonce
   * ce qu'ils portent — un repli ne cache jamais qu'on a engagé quelque chose.
   */
  repli?: boolean;
  /** Ce qui est engagé derrière le repli, compté depuis le formulaire. */
  quoi?: string;
}) {
  const contexte = useModeCartes();
  if (contexte.actif) {
    const cles = carte === undefined ? [] : Array.isArray(carte) ? carte : [carte];
    return (
      <div data-carte={cles.join(" ")} hidden={!estMontre(contexte, cles)} className="space-y-3">
        {children}
      </div>
    );
  }
  if (repli) {
    return (
      <Repliable
        className={`option-ponctuelle rounded-lg border px-3 py-2 sm:px-3.5 sm:py-2.5 ${tone}`}
        classeResume={legendClass}
        {...(quoi ? { quoi } : {})}
        resume={
          <span className="flex items-center gap-1.5">
            {icone ? <Icone nom={icone} className="h-3.5 w-3.5 text-amber-400" /> : null}
            {legend}
          </span>
        }
      >
        <div className="mt-2 border-t border-white/10 pt-3">{children}</div>
      </Repliable>
    );
  }
  return (
    <details open={defaultOpen} className={`group rounded-lg border [&:not([open])]:border-dashed ${tone}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 [&::-webkit-details-marker]:hidden">
        <span className={`flex items-center gap-1.5 ${legendClass}`}>
          {icone ? <Icone nom={icone} className="h-3.5 w-3.5 text-amber-400" /> : null}
          {legend}
        </span>
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
  telephone = false,
  enTeteDuRecapitulatif = null,
  reperes = null,
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
  financeOffer,
  insuranceFormulas,
  suppliersOffer,
  equipmentOffer,
  capacityFacts,
  vocabulary,
  verrou,
  echeance = null,
  sauvetage,
  gamme = null,
  rdOffer = null,
  communicationOffer = null,
}: {
  gameId: string;
  /** Sur téléphone, les textes d'aide se rangent dans un tiroir (voir aide-repliable.tsx). */
  telephone?: boolean;
  /** Sur téléphone, l'état de l'équipe (décisions enregistrées, classe, échéance) se lit au récapitulatif. */
  enTeteDuRecapitulatif?: ReactNode;
  /**
   * Ce qui éclaire le prix sur sa carte : la fourchette de ce que paient les clients,
   * et le coût d'une unité (absent en gamme, où chaque référence a le sien).
   */
  reperes?: {
    prixUsuels: string | null;
    coutVariable: number | null;
    /** La plage du curseur de prix : de la moitié du plus bas prix usuel à près du double du plus haut. */
    plagePrix?: { min: number; max: number };
    /**
     * CE QUE LE TOUR PASSÉ A DONNÉ : le prix pratiqué et le volume vendu, lus de
     * la vue de partie (historique des ventes en mono-produit, résultat par
     * référence en gamme). `null` au premier tour, où il n'y a rien à rappeler :
     * la ligne de repère ne paraît alors pas, plutôt que d'annoncer un zéro.
     */
    tourPasse?: { tour: number; prix: number | null; volume: number | null } | null;
    /** Le même repère, référence par référence, en gamme. */
    tourPasseParReference?: Record<
      string,
      { tour: number; prix: number | null; volume: number | null }
    >;
  } | null;
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
   * Échéance du tour (ISO) quand l'enseignant en a posé une. Le verrou dit
   * qu'il est trop tard ; ceci le dit AVANT, ce qui est toute la différence
   * entre un tour validé et vingt minutes de saisie refusées.
   */
  echeance?: string | null;
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
    creances: boolean;
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
  /** Conditions du crédit, pour chiffrer l'emprunt avant la validation. */
  financeOffer?: {
    loanAnnualRate: number;
    loanDurationRounds: number | null;
    roundDays: number;
  } | null;
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
    /** Disponibilité machine (0..1) : ce que l'entretien commande. */
    availability: number;
    /** Capacité machine réellement disponible : nominale × disponibilité. */
    availableMachineCapacity: number;
    /** Le budget d'entretien sous lequel la disponibilité se dégrade. */
    maintenanceReference: number;
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
  // L'aide du champ d'entretien : le seuil du métier, puis l'état de l'atelier.
  const aideEntretien = aideDuBudgetEntretien(capacityFacts);
  // LE HAUT DU CURSEUR DE VOLUME est ce que l'atelier peut réellement produire ce tour : la plus
  // basse de la capacité machine disponible et de la capacité de main-d'œuvre. Au-delà, le moteur
  // borne de toute façon la production. Hors cas (abonnement, pas de capacité connue), le curseur
  // retombe sur deux fois la valeur proposée.
  const capaciteEffective =
    capacityFacts && !capacityFacts.subscription
      ? (() => {
          const bornes = [capacityFacts.availableMachineCapacity, capacityFacts.laborCapacity].filter(
            (c) => Number.isFinite(c) && c > 0,
          );
          return bornes.length > 0 ? Math.ceil(Math.min(...bornes)) : undefined;
        })()
      : undefined;

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
    if (!Number.isNaN(i)) allerALEtape(i);
    requestAnimationFrame(() => champ?.focus());
  };
  const [equipBuyQty, setEquipBuyQty] = useState<Record<string, number>>({});
  const [equipSellQty, setEquipSellQty] = useState<Record<string, number>>({});
  // L'étape affichée de l'assistant de décision (voir plus bas). Les étapes
  // inactives restent MONTÉES (attribut `hidden`, jamais démontées) : le
  // formulaire se soumet toujours en entier, quelle que soit l'étape à l'écran.
  const [etape, setEtape] = useState(0);
  /**
   * LES ÉTAPES DÉJÀ VUES, ET NON CELLES D'AVANT.
   *
   * La coche de la barre d'étapes se posait sur tout ce qui portait un numéro
   * inférieur à l'étape affichée. Elle mentait des deux côtés : sauter
   * directement à « Financer » cochait les trois étapes sautées, et revenir en
   * arrière décochait celles qu'on venait de remplir. Une coche qui ment est
   * pire qu'une absence de coche, parce qu'on s'y fie pour valider.
   *
   * On retient donc ce qui a vraiment été affiché. La première étape l'est dès
   * l'ouverture.
   */
  const [vues, setVues] = useState<ReadonlySet<number>>(() => new Set([0]));
  /**
   * CE QUE L'ÉQUIPE ENGAGE, RELU JUSTE AVANT DE VALIDER. Lu sur le formulaire
   * lui-même à l'arrivée sur la dernière étape, puis à chaque frappe tant qu'on
   * y est : un récapitulatif qui tiendrait ses propres valeurs finirait par
   * mentir. `null` tant qu'on n'est pas arrivé au bout.
   */
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  /**
   * EN PARCOURS (téléphone) : la carte affichée, ce que le joueur a répondu (relu
   * sur le formulaire pour le récapitulatif), et sa réponse à la commande
   * exceptionnelle — `null` tant qu'il n'a rien dit, pour qu'aucun des deux
   * boutons ne paraisse déjà choisi.
   */
  const [carte, setCarte] = useState(0);
  const [donneesRecap, setDonneesRecap] = useState<FormData | null>(null);
  const [commandeAcceptee, setCommandeAcceptee] = useState<boolean | null>(null);
  const [prixSaisi, setPrixSaisi] = useState<number | null>(null);
  const relireLEngagement = () => {
    const f = formRef.current;
    if (!f) return;
    const donnees = new FormData(f);
    setDonneesRecap(donnees);
    setEngagement(
      lireLEngagement(
        donnees,
        gamme?.map((p) => p.code) ?? [],
        (code) => insuranceFormulas?.find((formule) => formule.code === code)?.name ?? "souscrite",
      ),
    );
  };

  /**
   * UN SEUL APLAT ORANGE PAR ÉCRAN. Sur l'onglet « Décider », le courrier du
   * tour se pose au-dessus du formulaire avec son bouton « Ouvrir le courrier »
   * (marqué `data-action-de-l-etape`) : tant qu'il est là, le pied du
   * formulaire passe en filet.
   */
  const [actionPropre, setActionPropre] = useState(false);
  useEffect(() => {
    const zone = formRef.current?.closest("#decisions");
    if (!zone) return;
    const relire = () =>
      setActionPropre(
        [...zone.querySelectorAll("[data-action-de-l-etape]")].some(
          (el) => !formRef.current?.contains(el),
        ),
      );
    relire();
    const veille = new MutationObserver(relire);
    veille.observe(zone, { childList: true, subtree: true });
    return () => veille.disconnect();
  }, [formRef]);
  const aplat = (classes: string) =>
    actionPropre ? bouton({ variante: "secondaire", taille: "l" }) : classes;

  /** Afficher une carte : on repart du haut de l'écran, et le récapitulatif se relit. */
  const allerALaCarte = (i: number) => {
    setCarte(i);
    // Le début de la carte, sous la barre et l'ardoise repliée : pas le haut de
    // la page, où l'ardoise reprenait la place du champ (voir debut-d-etape).
    allerAuDebutDEtape(formRef.current);
    if (cartes[i]?.cle === "recap") relireLEngagement();
  };

  /** Le seul chemin pour changer d'étape : il retient qu'on y est passé. */
  const allerALEtape = (calcul: number | ((e: number) => number)) => {
    const brut = typeof calcul === "function" ? calcul(etape) : calcul;
    if (modeCartes) {
      // En parcours, une étape n'est qu'un groupe de cartes : on va à la première.
      const premiere = cartes.findIndex((c) => c.etape === etapesVisibles[brut]);
      if (premiere >= 0) allerALaCarte(premiere);
      return;
    }
    setEtape(brut);
    setVues((v) => (v.has(brut) ? v : new Set(v).add(brut)));
    if (brut === total - 1) relireLEngagement();
    // L'étape suivante commence en haut du formulaire : si l'on a défilé plus
    // bas, on y remonte, sous la barre et l'ardoise repliée.
    allerAuDebutDEtape(formRef.current, { seulementSiDepasse: true });
  };

  // Un champ requis dans une famille repliée — OU sur une étape masquée — est
  // invisible : le navigateur ne peut pas y afficher sa bulle de validation et
  // abandonne l'envoi en silence (« An invalid form control is not focusable »).
  // En phase de capture, avant que le navigateur ne tente d'y poser le focus, on
  // rouvre la famille du champ fautif ET on affiche son étape.
  const revelerFamilleInvalide = (e: React.FormEvent<HTMLFormElement>) => {
    const cible = e.target as HTMLElement;
    if (modeCartes) {
      // En parcours, le champ fautif se retrouve par sa carte.
      const bloc = cible.closest?.("[data-carte]") as HTMLElement | null;
      const cles = bloc?.dataset.carte?.split(" ") ?? [];
      const i = cartes.findIndex((c) => cles.includes(c.cle));
      if (i >= 0) allerALaCarte(i);
      return;
    }
    const famille = cible.closest?.("details") as HTMLDetailsElement | null;
    if (famille && !famille.open) famille.open = true;
    const section = cible.closest?.("[data-etape]") as HTMLElement | null;
    const i = Number(section?.dataset.etape);
    if (!Number.isNaN(i)) allerALEtape(i);
  };
  const on = enabled ?? {
    quality: true,
    maintenance: true,
    finance: true,
    creances: true,
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
  // Les montants que le chiffrage suit à la frappe. L'emprunt est déjà suivi
  // par `renfort` (garde-fou du sauvetage) : on ne le double pas.
  const [mobilisation, setMobilisation] = useState({ escompte: 0, affacturage: 0 });
  const [etudesCochees, setEtudesCochees] = useState<Record<string, number>>({});

  // ── LE CHIFFRAGE, RECALCULÉ À CHAQUE FRAPPE ────────────────────────────
  // Les nombres montrés sont ceux du moteur : le module est calé dessus, et un
  // test d'intégration compare les deux sur une vraie simulation.
  const tauxEmprunt = financeOffer
    ? `${(financeOffer.loanAnnualRate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %/an`
    : "Taux du scénario";
  const chiffrageEmprunt =
    financeOffer && financeOffer.loanDurationRounds && renfort.emprunt > 0
      ? (() => {
          const e = echeancierEmprunt({
            montant: renfort.emprunt,
            dureeEnTours: financeOffer.loanDurationRounds,
            tauxAnnuel: financeOffer.loanAnnualRate,
            joursDuTour: financeOffer.roundDays,
            plafond: loanCapacity?.remaining ?? null,
          });
          return [
            // LE MOTEUR RABOTE EN SILENCE : chiffrer la demande annoncerait une
            // échéance que personne ne paiera. On chiffre ce qui sera prêté, et
            // on dit que la demande a été ramenée au plafond.
            ...(e.plafonne
              ? [
                  {
                    label: "Au-delà du plafond",
                    valeur: `la banque prêtera ${formatEuro(e.montantAccorde)}`,
                    alerte: true,
                  },
                ]
              : []),
            { label: `Échéance, sur ${e.tours} tours`, valeur: `${formatEuro(e.echeanceParTour)} par tour` },
            { label: "Intérêts", valeur: formatEuro(e.interets) },
            { label: "Total à rembourser", valeur: formatEuro(e.totalARembourser), fort: true },
          ];
        })()
      : [];
  const chiffrageEscompte =
    treasuryOffer && financeOffer && mobilisation.escompte > 0
      ? (() => {
          const c = coutDeLEscompte({
            montant: mobilisation.escompte,
            tauxAnnuel: treasuryOffer.discountAnnualRate,
            joursDuTour: financeOffer.roundDays,
          });
          return [
            { label: "Agios", valeur: formatEuro(c.cout) },
            { label: "En caisse", valeur: formatEuro(c.net), fort: true },
            // Le plafond se calcule sur les ventes DU TOUR, que l'élève est en
            // train de décider : aucun chiffre exact ne peut être annoncé ici.
            {
              label: "Plafond",
              valeur: `${Math.round(treasuryOffer.discountMaxShare * 100)} % du poste clients du tour ; le surplus ne sera pas escompté`,
            },
          ];
        })()
      : [];
  const chiffrageAffacturage =
    treasuryOffer && mobilisation.affacturage > 0
      ? (() => {
          const c = coutDeLAffacturage({
            montant: mobilisation.affacturage,
            commission: treasuryOffer.factoringFeeRate,
          });
          return [
            { label: "Commission", valeur: formatEuro(c.cout) },
            { label: "En caisse", valeur: formatEuro(c.net), fort: true },
          ];
        })()
      : [];

  const prixCoches = Object.values(etudesCochees);
  const totalEtudes = totalDesEtudes(prixCoches);
  const nombreDEtudes = `${prixCoches.length} étude${prixCoches.length > 1 ? "s" : ""}`;

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
  // Le choix d'un fournisseur n'a son étape qu'en mono-produit : en gamme il se
  // fait dans le tableau des ventes (voir « S'approvisionner » plus bas).
  const approvisionnerVisible = !gamme && !!suppliersOffer && suppliersOffer.length > 0;
  const tresorerieVisible = on.dividend || (on.creances && !!treasuryOffer);
  const assuranceVisible =
    on.insurance && (!!insuranceOffer || (insuranceFormulas?.length ?? 0) > 0);
  const etapesVisibles = [
    "vendre",
    approvisionnerVisible ? "approvisionner" : null,
    budgetsVisible ? "budgets" : null,
    equipeVisible ? "equipe" : null,
    financerVisible ? "financer" : null,
    tresorerieVisible ? "tresorerie" : null,
    assuranceVisible ? "assurance" : null,
    "prevoir",
  ].filter((x): x is string => x !== null);
  const META: Record<string, { titre: string; icone: NomDIcone }> = {
    // En gamme, la première étape ne se limite plus à vendre : elle porte TOUT
    // ce qui se décide sur une référence, budgets compris. L'appeler « Vendre »
    // ferait chercher ailleurs des champs qui sont là.
    vendre: { titre: gamme ? "Vos références" : "Vendre", icone: "cible" },
    approvisionner: { titre: "S'approvisionner", icone: "camion" },
    budgets: { titre: "Budgéter", icone: "argent" },
    equipe: { titre: "Équipe & RSE", icone: "equipes" },
    financer: { titre: "Financer & investir", icone: "banque" },
    tresorerie: { titre: "Trésorerie", icone: "tresorerie" },
    assurance: { titre: "Assurance", icone: "assurance" },
    prevoir: { titre: "S'informer & prévoir", icone: "loupe" },
  };
  const idx = (cle: string) => etapesVisibles.indexOf(cle);
  const total = etapesVisibles.length;
  const courante = Math.min(etape, total - 1);

  // ── LES CARTES (parcours téléphone) ──────────────────────────────────────
  // Une décision par écran. Chaque carte désigne l'étape (la section) qui porte
  // ses champs et sait résumer la réponse du joueur pour le récapitulatif. La
  // liste suit EXACTEMENT les conditions des sections plus bas : une carte sans
  // champ, ou un champ sans carte, serait un trou dans le parcours.
  const parcours = useParcours();
  const modeCartes = parcours !== null;
  const nb = (x: FormDataEntryValue | null) => Number(x ?? 0).toLocaleString("fr-FR");
  const euros = (champ: string) => (d: FormData) => `${nb(d.get(champ))} €`;
  const cartes: DefCarte[] = modeCartes
    ? [
        ...(orderOffer
          ? [
              {
                cle: "commande",
                etape: "vendre",
                nom: "Commande exceptionnelle",
                question: "Une commande exceptionnelle",
                resume: (d: FormData) => (d.get("acceptOrder") ? "Acceptée" : "Refusée"),
              },
            ]
          : []),
        ...(gamme
          ? gamme.map((p) => ({
              cle: `ref-${p.code}`,
              etape: "vendre",
              nom: p.name,
              question: `Vos choix pour ${p.name}`,
              resume: (d: FormData) =>
                enDeveloppement(p)
                  ? "À développer"
                  : `${nb(d.get(productFieldName(p.code, "price")))} € · ${nb(d.get(productFieldName(p.code, "productionPlan")))} ${v.units}`,
            }))
          : [
              {
                cle: "prix",
                etape: "vendre",
                nom: "Prix de vente",
                question: "À quel prix vendez-vous ?",
                resume: (d: FormData) => `${nb(d.get("price"))} €/${v.unit}`,
              },
              {
                cle: "volume",
                etape: "vendre",
                nom: "Production",
                question: "Combien produisez-vous ?",
                resume: (d: FormData) => `${nb(d.get("productionPlan"))} ${v.units}`,
              },
            ]),
        ...(approvisionnerVisible
          ? [
              {
                cle: "fournisseur",
                etape: "approvisionner",
                nom: "Fournisseur",
                question: "Chez qui vous approvisionnez-vous ?",
                resume: (d: FormData) =>
                  suppliersOffer?.find((s) => s.code === d.get("supplierChoice"))?.name ?? "—",
              },
            ]
          : []),
        ...(gamme
          ? on.maintenance
            ? [
                {
                  cle: "maintenance",
                  etape: "budgets",
                  nom: "Entretien",
                  question: "Quel budget d'entretien ?",
                  resume: euros("maintenanceBudget"),
                },
              ]
            : []
          : [
              // Marketing, qualité, maintenance (et R&D) : UNE carte. Séparés, trois écrans presque
              // vides, chacun avec la même aide, pour des montants qui se règlent ensemble.
              {
                cle: "budgets",
                etape: "budgets",
                nom: "Budgets",
                question: "Vos budgets du tour",
                resume: (d: FormData) =>
                  [
                    "marketingBudget",
                    ...(on.quality ? ["qualityBudget"] : []),
                    ...(on.maintenance ? ["maintenanceBudget"] : []),
                    ...(rdMono ? ["rdBudget"] : []),
                  ]
                    .map((k) => `${nb(d.get(k))} €`)
                    .join(" · "),
              },
            ]),
        ...(communicationOffer
          ? [
              {
                cle: "communication",
                etape: "budgets",
                nom: "Communication",
                question: gamme ? "Quelle marque, quel axe ?" : "Quel axe de communication ?",
                resume: (d: FormData) =>
                  COMMUNICATION_AXIS_LABELS[
                    String(d.get("communicationAxis")) as keyof typeof COMMUNICATION_AXIS_LABELS
                  ]?.label ?? "—",
              },
            ]
          : []),
        ...(on.hr
          ? [
              {
                cle: "rh",
                etape: "equipe",
                nom: "Équipe",
                question: "Que décidez-vous pour votre équipe ?",
                resume: (d: FormData) =>
                  `${nb(d.get("hire"))} arrivée${Number(d.get("hire")) > 1 ? "s" : ""}, ${nb(d.get("fire"))} départ${Number(d.get("fire")) > 1 ? "s" : ""}`,
              },
            ]
          : []),
        ...(on.rse
          ? [
              {
                cle: "rse",
                etape: "equipe",
                nom: "RSE",
                question: "Quel engagement RSE ?",
                resume: euros("rseBudget"),
              },
            ]
          : []),
        // FINANCER ET INVESTIR sont deux questions : emprunter ou augmenter le capital
        // (d'où vient l'argent), puis acheter ou céder des machines (où il va).
        ...(on.finance
          ? [
              {
                cle: "financement",
                etape: "financer",
                nom: "Financement",
                question: "Faut-il financer ce tour ?",
                resume: (d: FormData) => {
                  const lignes = [
                    Number(d.get("newLoan")) > 0 ? `emprunt ${nb(d.get("newLoan"))} €` : null,
                    Number(d.get("loanRepayment")) > 0 ? `remboursement ${nb(d.get("loanRepayment"))} €` : null,
                    Number(d.get("capitalIncrease")) > 0 ? `capital ${nb(d.get("capitalIncrease"))} €` : null,
                  ].filter(Boolean);
                  return lignes.length > 0 ? lignes.join(", ") : "Aucun";
                },
              },
            ]
          : []),
        ...(on.investment && equipmentOffer
          ? [
              {
                cle: "investissement",
                etape: "financer",
                nom: "Investissement",
                question: "Investissez-vous dans des machines ?",
                resume: (d: FormData) => {
                  const lignes = [
                    d.get("equipmentBuyJson") && d.get("equipmentBuyJson") !== "[]" ? "achat de machines" : null,
                    d.get("equipmentSellJson") && d.get("equipmentSellJson") !== "[]" ? "vente de machines" : null,
                  ].filter(Boolean);
                  return lignes.length > 0 ? lignes.join(", ") : "Aucun";
                },
              },
            ]
          : []),
        ...(on.dividend
          ? [
              {
                cle: "dividende",
                etape: "tresorerie",
                nom: "Dividende",
                question: "Quel dividende versez-vous ?",
                resume: (d: FormData) => (Number(d.get("dividend")) > 0 ? `${nb(d.get("dividend"))} €` : "Aucun"),
              },
            ]
          : []),
        ...(on.creances && treasuryOffer
          ? [
              {
                cle: "mobilisation",
                etape: "tresorerie",
                nom: "Trésorerie",
                question: "Mobilisez-vous vos créances clients ?",
                resume: (d: FormData) => {
                  const lignes = [
                    Number(d.get("discount")) > 0 ? `escompte ${nb(d.get("discount"))} €` : null,
                    Number(d.get("factoring")) > 0 ? `affacturage ${nb(d.get("factoring"))} €` : null,
                  ].filter(Boolean);
                  return lignes.length > 0 ? lignes.join(", ") : "Aucune";
                },
              },
            ]
          : []),
        ...(assuranceVisible
          ? [
              {
                cle: "assurance",
                etape: "assurance",
                nom: "Assurance",
                question: "Quelle couverture choisissez-vous ?",
                resume: (d: FormData) => {
                  const choix = d.get("insurance");
                  if (!choix) return "Aucune";
                  return insuranceFormulas?.find((f) => f.code === choix)?.name ?? "Souscrite";
                },
              },
            ]
          : []),
        ...(studiesOffer
          ? [
              {
                cle: "etudes",
                etape: "prevoir",
                nom: "Études",
                question: "Achetez-vous des études ?",
                resume: (d: FormData) => {
                  const n = ["studyMarket", "studyPrice", "studyFinance", "studyProject"].filter((c) => d.get(c)).length;
                  return n > 0 ? `${n} étude${n > 1 ? "s" : ""}` : "Aucune";
                },
              },
            ]
          : []),
        {
          cle: "justification",
          etape: "prevoir",
          nom: "Votre note",
          question: "Qu'attendez-vous de ces choix ?",
          resume: (d: FormData) => {
            const t = String(d.get("justification") ?? "").trim();
            return t ? (t.length > 28 ? `${t.slice(0, 28)}…` : t) : "—";
          },
        },
        { cle: "recap", etape: "recap", nom: "", question: "Vos décisions du tour" },
      ]
    : [];
  const carteIdx = Math.min(carte, Math.max(0, cartes.length - 1));
  const carteCourante = modeCartes ? cartes[carteIdx] : undefined;
  const derniere = modeCartes ? carteCourante?.cle === "recap" : courante === total - 1;
  const masquee = (cle: string) =>
    modeCartes ? carteCourante?.etape !== cle : courante !== idx(cle);

  // ── LA HIÉRARCHIE DE LA FEUILLE ──────────────────────────────────────────
  // Le repère du tour passé, à côté de la décision majeure qu'il éclaire. Il
  // vient de la vue de partie et n'existe pas au premier tour : la ligne ne
  // paraît alors pas, plutôt que d'annoncer « 0 € pratiqué ».
  const tourPasse = reperes?.tourPasse ?? null;
  const repereDuPrix =
    tourPasse && tourPasse.prix !== null
      ? `Tour ${tourPasse.tour} : ${formatEuro(tourPasse.prix)} pratiqué par ${v.unit}`
      : undefined;
  const repereDuVolume =
    tourPasse && tourPasse.volume !== null
      ? `Tour ${tourPasse.tour} : ${formatUnits(tourPasse.volume)} ${v.units} vendu${
          tourPasse.volume > 1 ? "s" : ""
        }`
      : undefined;
  /**
   * Ce qu'un repli d'option ponctuelle annonce : les options engagées qu'il
   * porte, lues sur le formulaire. « aucune » quand il n'y a rien derrière —
   * un repli muet laisserait chercher.
   */
  const quoiDeLOption = (cle: string): string => {
    const dedans = (engagement?.optionsPonctuelles ?? []).filter((o) => o.cle === cle);
    if (dedans.length === 0) return "aucune";
    return dedans.map((o) => `${o.label.toLowerCase()} ${o.valeur}`).join(" · ");
  };

  /**
   * SUR ORDINATEUR, L'ENGAGEMENT EST LU DÈS L'ARRIVÉE. Le total des budgets et
   * le compte des options repliées se lisent du formulaire ; sans cette
   * première lecture, ils restaient vides jusqu'à la première frappe, et un
   * repli annonçait « aucune » alors qu'une valeur reconduite l'habitait déjà.
   * Après le montage, jamais pendant le rendu : le serveur n'a pas de formulaire.
   */
  useEffect(() => {
    if (!modeCartes) relireLEngagement();
    // Une seule fois : ensuite, c'est `onChange` qui suit la saisie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeCartes]);

  // En parcours, le formulaire dit où il en est à la barre de la partie (carte
  // courante, nombre de cartes) ; reculer depuis la première ramène à l'analyse.
  useEffect(() => {
    if (modeCartes) parcours?.rapporterDecision(carteIdx, cartes.length);
  }, [parcours, modeCartes, carteIdx, cartes.length]);
  // Et la question de la carte se lit en haut de l'écran, dans la barre de la partie.
  const questionDeLaCarte = modeCartes ? carteCourante?.question : undefined;
  const definirEntete = parcours?.definirEntete;
  useEffect(() => {
    if (!questionDeLaCarte) return;
    definirEntete?.({ titre: questionDeLaCarte });
    return () => definirEntete?.(null);
  }, [definirEntete, questionDeLaCarte]);

  /** Avancer d'une carte, à condition que celle-ci soit remplie correctement. */
  const carteSuivante = () => {
    const f = formRef.current;
    if (f) {
      for (const champ of Array.from(f.elements) as HTMLInputElement[]) {
        if (champ.type === "hidden" || champ.closest("[hidden]")) continue;
        if (typeof champ.checkValidity === "function" && !champ.checkValidity()) {
          champ.reportValidity();
          return;
        }
      }
    }
    allerALaCarte(Math.min(cartes.length - 1, carteIdx + 1));
  };
  const cartePrecedente = () =>
    carteIdx === 0 ? parcours?.reculerAvantLesDecisions() : allerALaCarte(carteIdx - 1);
  // Le glissement double les boutons. Il ne passe pas la commande (qui veut une réponse) ni la
  // dernière carte (qui veut un envoi) : seul un geste franc, sur une carte ordinaire, avance.
  const glisser = useGlisser({
    actif: modeCartes && !verrou,
    suivant:
      !derniere && carteCourante?.cle !== "commande"
        ? () => {
            vibrer(8);
            carteSuivante();
          }
        : undefined,
    precedent: () => {
      vibrer(8);
      cartePrecedente();
    },
  });
  // Valider se sent dans la main : le tour part.
  useEffect(() => {
    if (pending) vibrer(VIBRATION_DE_REUSSITE);
  }, [pending]);
  const repondreALaCommande = (oui: boolean) => {
    const champ = formRef.current?.elements.namedItem("acceptOrder") as HTMLInputElement | null;
    // Un vrai clic, pas une affectation : c'est lui qui prévient le formulaire,
    // donc le brouillon et le récapitulatif.
    if (champ && champ.checked !== oui) champ.click();
    setCommandeAcceptee(oui);
    allerALaCarte(Math.min(cartes.length - 1, carteIdx + 1));
  };

  // ── BROUILLON LOCAL ──────────────────────────────────────────────────────
  // Six étapes, des dizaines de champs, et rien n'était gardé tant qu'on
  // n'avait pas validé : un onglet fermé ou un appel en plein cours, et le tour
  // entier était à ressaisir. On sauve à chaque frappe, dans le navigateur.
  // La note d'avant est recommandée, jamais exigée (voir config/justification).
  const premierTour = roundIndex === 1;
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

  // Le panneau des fournisseurs, calculé ici pour pouvoir se loger dans l'étape
  // « S'approvisionner » (mono-produit) ou sous « Vos références » (gamme).
  const panneauFournisseurs = (() => {
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
        // En cartes, le catalogue n'a pas de carte : le façonnier se choisit sur celle
        // de sa référence, avec ses délais et son risque sous le choix.
        if (gamme && modeCartes) return null;
        return (
          <Family
            // EN GAMME, CE PANNEAU NE PORTE AUCUNE DÉCISION : le façonnier se
            // choisit ligne par ligne dans le tableau des ventes, et ceci n'est
            // qu'un catalogue — autant de fiches que de façonniers, dépliées
            // au-dessus des champs qu'on vient remplir. Il s'ouvre à la demande.
            // En mono-produit, au contraire, le choix EST ici (les boutons
            // radio) : le replier cacherait une décision du tour.
            defaultOpen={!gamme}
            carte={gamme ? "references" : "fournisseur"}
            icone="camion"
            legend={
              gamme
                ? `${v.supplierPanelLabel} · ${fiches.length} fiche${fiches.length > 1 ? "s" : ""}`
                : v.supplierPanelLabel
            }
          >
            {gamme ? (
              <p className="mb-2 text-sm leading-relaxed text-slate-400">
                Chaque référence a ses façonniers ; le choix se fait ligne par ligne dans le
                tableau de vos ventes. Voici ce que chacun propose, et à quel prix d&apos;achat
                pour chaque référence qu&apos;il fournit.
              </p>
            ) : null}
            <div className="space-y-2 max-sm:space-y-1.5">
              {fiches.map((s) => (
                <label
                  key={`${s.code}·${s.name}`}
                  className="flex items-start gap-3 bg-slate-900 rounded-xl border border-white/10 px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12 max-sm:py-1.5"
                >
                  {gamme ? null : (
                    <input
                      type="radio"
                      name="supplierChoice"
                      value={s.code}
                      defaultChecked={(defaults.supplierChoice ?? fiches[0]?.code) === s.code}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-400"
                    />
                  )}
                  <span>
                    <span className="text-sm font-medium text-slate-200">
                      {s.name}
                      {gamme
                        ? ""
                        : ` · ${v.materialLabel.toLowerCase()} à ${formatEuroCents(s.prix[0]!.achat)}/${v.unit} (${s.prix[0]!.ecart})`}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400 max-sm:line-clamp-1">{s.narrative}</span>
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
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs max-sm:mt-0.5">
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
                        <span className="text-emerald-400">Approvisionnement fiable</span>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Aide>
                <p className="text-sm leading-relaxed text-slate-400">
                  Le prix d&apos;achat entre dans le coût variable : c&apos;est ce qui reste entre lui et
                  votre prix de vente qui fait la marge. Le bonus de qualité joue sur la qualité
                  perçue, le délai de règlement sur la trésorerie (BFR), le risque de rupture sur
                  ce que vous recevez. L&apos;assurance étendue couvre le litige fournisseur.
                </p>
              </Aide>
            </div>
          </Family>
        );
      })();

  return (
    <TelephoneContexte.Provider value={telephone}>
    <CartesContexte.Provider
      value={{ actif: modeCartes, courante: carteCourante?.cle ?? "" }}
    >
    <form
      ref={formRef}
      action={formAction}
      onSubmit={verifierPivots}
      onChange={() => {
        sauverBrouillon();
        // En parcours, le récapitulatif ne suit la saisie que sur la dernière
        // carte : ailleurs, il n'est pas affiché. SUR ORDINATEUR, l'engagement
        // est relu à chaque frappe : le total des budgets se lit sous les
        // budgets, et chaque option ponctuelle repliée annonce ce qu'elle porte.
        if (derniere || !modeCartes) relireLEngagement();
      }}
      onInvalidCapture={revelerFamilleInvalide}
      data-debut-d-etape=""
      className="space-y-3"
      {...glisser}
    >
      {/* Verrou de planning : hors de la fenêtre, on l'annonce et « Valider »
          est grisé (le serveur refuse de toute façon). La page reste lisible. */}
      {verrou ? (
        <p
          role="status"
          className="encadre-neutre flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-100"
        >
          <Icone nom="verrou" className="h-4 w-4" /> {verrou}
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
          className="flex items-start gap-2 rounded-lg encadre-perte px-3 py-2 text-sm leading-relaxed text-red-200"
        >
          <Icone nom="alerte" className="mt-0.5 h-4 w-4" />
          <span>
            <strong className="font-semibold">Financement de sauvetage exigé.</strong>{" "}
            {blocageSauvetage}
          </span>
        </p>
      ) : null}
      {/* Barre d'étapes : où j'en suis, saut direct possible. Les libellés se
          replient en simples numéros sur petit écran. */}
      <ol
        className={`flex flex-wrap gap-1 sm:gap-1.5 ${modeCartes ? "hidden" : ""}`}
        aria-label="Étapes de décision"
      >
        {etapesVisibles.map((cle, i) => {
          const actif = i === courante;
          const fait = !actif && vues.has(i);
          return (
            <li key={cle} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => allerALEtape(i)}
                aria-current={actif ? "step" : undefined}
                className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border px-1 py-2 text-xs font-medium transition sm:gap-1.5 sm:px-2 ${
                  actif
                    ? // L'étape courante est un ÉTAT CHOISI : voile neutre et filet
                      // orange plein (charte), et non un aplat dilué d'orange.
                      "voile-neutre border-amber-400 text-slate-100"
                    : fait
                      ? // Une étape faite est un ÉTAT, pas un résultat : neutre, et sa coche.
                        "voile-neutre border-white/10 text-slate-200 hover:text-slate-100"
                      : "border-white/10 text-slate-400 hover:text-slate-200"
                }`}
              >
                {fait ? (
                  <span aria-hidden>✓</span>
                ) : (
                  <Icone nom={META[cle]!.icone} className="h-4 w-4" />
                )}
                <span className="hidden truncate sm:inline">{META[cle]!.titre}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section
        data-etape={idx("vendre")}
        hidden={masquee("vendre")}
        className="space-y-3"
      >
      {gamme ? (
        // TOUT CE QUI SE DÉCIDE POUR UNE RÉFÉRENCE EST DANS SON ONGLET : prix,
        // volume, façonnier, puis les budgets qui la soutiennent. Séparés, le
        // prix et le budget marketing d'une même référence se décidaient sur
        // deux étapes, alors que l'un commande l'autre.
        <Family
          carte={gamme.map((p) => `ref-${p.code}`)}
          icone="cible"
          legend="Vos références · tout ce qui se décide pour chacune"
          defaultOpen
        >
          <GammeReference
            gamme={gamme}
            defaults={defaults}
            vocabulary={v}
            quality={on.quality}
            rd={on.rd && !!rdOffer}
            roundIndex={roundIndex}
            {...(capaciteEffective ? { capacite: capaciteEffective } : {})}
            {...(reperes?.tourPasseParReference
              ? { tourPasse: reperes.tourPasseParReference }
              : {})}
          />
        </Family>
      ) : null}
      {gamme ? (
        <></>
      ) : (
        <Family
          carte={["prix", "volume"]}
          icone="cible"
          legend="Vos ventes · le prix et le volume du tour"
          defaultOpen
        >
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <Carte cle="prix">
              {/* En parcours, les repères sont des pastilles au-dessus du champ de la
                  carte ; sur ordinateur ils se lisent sous les deux champs majeurs. */}
              {modeCartes && reperes ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {reperes.prixUsuels ? (
                    <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-slate-200">
                      Prix usuels {reperes.prixUsuels}
                    </span>
                  ) : null}
                  {reperes.coutVariable !== null ? (
                    <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-slate-200">
                      Coût variable {formatEuro(reperes.coutVariable)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <Field name="price" label={v.priceLabel} defaultValue={defaults.price} step={0.1}
                suffix={`€/${v.unit}`} onValueChange={setPrixSaisi} majeur
                {...(repereDuPrix ? { repere: repereDuPrix } : {})}
                {...(reperes?.plagePrix ? { plage: reperes.plagePrix } : {})}
                hint="Attention aux seuils psychologiques…" />
              {modeCartes && reperes && reperes.coutVariable !== null ? (
                <p className="mt-3 flex items-baseline justify-between border-t border-white/10 px-1 pt-3 text-base text-slate-300">
                  <span>Marge par {v.unit}</span>
                  {/* Une valeur chiffrée est une information, jamais l'orange de l'action. */}
                  <strong className="text-lg tabular-nums text-slate-50">
                    {formatEuro((prixSaisi ?? defaults.price) - reperes.coutVariable)}
                  </strong>
                </p>
              ) : null}
            </Carte>
            <Carte cle="volume">
              <Field name="productionPlan" label={v.productionPlanLabel}
                defaultValue={Math.round(defaults.productionPlan)} suffix={v.units} majeur
                {...(repereDuVolume ? { repere: repereDuVolume } : {})}
                {...(capaciteEffective
                  ? { plage: { min: 0, max: Math.max(capaciteEffective, Math.round(defaults.productionPlan)) } }
                  : {})}
                hint="Le volume réel sera borné par vos capacités." />
            </Carte>
          </div>
          {/* LES REPÈRES DU MARCHÉ, SUR ORDINATEUR : sous les deux champs majeurs, pas
              au-dessus d'eux. Ce sont des données (bleu donnée), pas des résultats. */}
          {!modeCartes && reperes && (reperes.prixUsuels || reperes.coutVariable !== null) ? (
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-3 text-sm tabular-nums text-[var(--donnee)]">
              {reperes.prixUsuels ? (
                <span>
                  <span className="text-slate-400">Prix usuels du marché</span>{" "}
                  {reperes.prixUsuels}
                </span>
              ) : null}
              {reperes.coutVariable !== null ? (
                <span>
                  <span className="text-slate-400">Coût variable</span>{" "}
                  {formatEuro(reperes.coutVariable)}
                </span>
              ) : null}
            </p>
          ) : null}
        </Family>
      )}
      {orderOffer ? (
        <Family
          carte="commande"
          icone="colis"
          legend={`Commande exceptionnelle · ${orderOffer.title}`}
          repli
          quoi={quoiDeLOption("commande")}
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
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {orderOffer.paymentDelayDays > 0
              ? "Belle marge, mais encaissée plus tard : le BFR gonfle d'autant."
              : "Cash immédiat, marge mince : comparez le prix à votre coût variable."}
          </p>
          <label className={`mt-3 flex items-start gap-3 ${modeCartes ? "sr-only" : ""}`}>
            <input
              type="checkbox"
              name="acceptOrder"
              defaultChecked={defaults.acceptOrder ?? false}
              className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
            />
            <span className="text-sm font-medium text-slate-200">
              Accepter la commande, à prendre ou à laisser : elle ne repassera pas.
            </span>
          </label>
        </Family>
      ) : null}
      {capacityFacts ? (
        <Carte cle="volume">
        <PanneauConsulte
          titre={v.capacityPanelTitle}
          icone="usine"
          resume={`${Math.round(capacityFacts.availableMachineCapacity).toLocaleString("fr-FR")} ${v.perRoundLabel} · ${
            capacityFacts.bottleneck === "labor"
              ? v.laborLabel
              : capacityFacts.bottleneck === "machine"
                ? v.capacityBottleneckLabel
                : "équilibré"
          }`}
        >
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
            {/*
              LA CAPACITÉ ANNONCÉE EST CELLE QU'ON A, PAS CELLE D'UN ATELIER
              NEUF. Le moteur produit sous `machineCapacity × availability` : à
              82 % de disponibilité, annoncer la capacité nominale promettait un
              plafond inatteignable, sans dire pourquoi. La note ne paraît qu'en
              dessous de 100 % — à l'ouverture, il n'y a rien à expliquer.
            */}
            <FaitCapacite
              label={v.capacityLabel}
              valeur={`${Math.round(capacityFacts.availableMachineCapacity).toLocaleString("fr-FR")} ${v.perRoundLabel}`}
              note={
                capacityFacts.availability < 0.995
                  ? `${Math.round(capacityFacts.availability * 100)} % de disponibilité, sur ${Math.round(capacityFacts.machineCapacity).toLocaleString("fr-FR")} à l'état neuf`
                  : undefined
              }
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
              // Le goulot est un CONSTAT, ni une action ni un résultat :
              // l'encre, quel qu'il soit (« Équilibré » passait au vert, la
              // main-d'œuvre à l'orange de l'action, la machine au bleu ciel).
              couleur="text-slate-100"
            />
          </dl>
          {capacityFacts.bottleneck === "labor" ? (
            <p className="mt-2 text-xs text-slate-300">{v.laborBottleneckHint}</p>
          ) : capacityFacts.bottleneck === "machine" ? (
            <p className="mt-2 text-xs text-sky-300/80">{v.capacityBottleneckHint}</p>
          ) : null}
        </PanneauConsulte>
        </Carte>
      ) : null}
      {gamme ? panneauFournisseurs : null}
      </section>

      {/* S'APPROVISIONNER, À PART. Le choix du fournisseur (les boutons radio) pesait
          707 px dans une étape déjà longue de 1 329 px : il a la sienne. En gamme, le
          façonnier se choisit ligne par ligne dans le tableau des ventes et ce panneau
          n'est qu'un catalogue : il reste sous « Vos références », et l'étape ne
          paraît pas. */}
      <section
        data-etape={idx("approvisionner")}
        hidden={masquee("approvisionner")}
        className="space-y-3"
      >
      {gamme ? null : panneauFournisseurs}
      </section>

      {/* Budgéter : les quatre budgets du tour (marketing, qualité, entretien,
          R&D) et la communication — ce que l'entreprise dépense ce tour pour
          soutenir son offre. Un budget que le niveau n'ouvre pas part caché,
          à sa valeur proposée, pour que la lecture côté serveur reste complète. */}
      <section
        data-etape={idx("budgets")}
        hidden={masquee("budgets")}
        className="space-y-3"
      >
      {/* En parcours, une partie mono n'a pas besoin de cette aide : chaque champ porte déjà la sienne,
          juste dessous. Elle ne se répète pas sur un écran qui dit la même chose. */}
      {modeCartes && !gamme ? null : (
      <Aide>
        <p className="text-sm leading-relaxed text-slate-400">
          Faire venir les clients, tenir la qualité, entretenir votre
          capacité{on.rd && rdOffer ? ", développer" : ""}
          {communicationOffer ? ", bâtir votre marque" : ""}. Chaque budget se paie le tour même.
        </p>
      </Aide>
      )}
      {gamme ? null : (
        // Les budgets du tour, au même endroit : marketing, qualité, maintenance
        // et R&D.
        <Family
          carte="budgets"
          icone="argent"
          legend={`Les budgets du tour · ${["marketing", on.quality ? "qualité" : null, on.maintenance ? "maintenance" : null, rdMono ? "R&D" : null].filter(Boolean).join(", ")}`}
          defaultOpen
        >
          <Carte cle="budgets">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field name="marketingBudget" label="Budget marketing" libelle="Marketing" defaultValue={defaults.marketingBudget} suffix="€"
                hint="Fait venir les clients ce tour-ci ; l'effet retombe vite si on cesse." />
              {on.quality ? (
                <Field name="qualityBudget" label="Budget qualité" libelle="Qualité" defaultValue={defaults.qualityBudget} suffix="€"
                  hint="Prévention : moins de rebuts et de retours, une qualité perçue qui monte." />
              ) : (
                <input type="hidden" name="qualityBudget" value={defaults.qualityBudget} />
              )}
              {on.maintenance ? (
                <Field name="maintenanceBudget" label="Budget maintenance" libelle="Maintenance" defaultValue={defaults.maintenanceBudget} suffix="€"
                  hint={aideEntretien} />
              ) : (
                <input type="hidden" name="maintenanceBudget" value={defaults.maintenanceBudget} />
              )}
              {rdMono ? (
                <Field
                  name="rdBudget"
                  label="Recherche et développement"
                  libelle="R&D"
                  sansCurseur
                  defaultValue={Math.round(defaults.rdBudget ?? 0)}
                  suffix="€"
                  hint="Élève le niveau technique, avec retard ; s'érode si la R&D cesse."
                />
              ) : null}
            </div>
            <TotalDesBudgets engagement={engagement} />
          </Carte>
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
          carte="maintenance"
          icone="argent"
          legend={`Les budgets de l'entreprise · ${[on.maintenance ? "entretien" : null, communicationOffer ? "marque" : null].filter(Boolean).join(", ")}`}
          defaultOpen
        >
          <p className="text-sm leading-relaxed text-slate-400">
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
                hint={aideEntretien}
              />
            </div>
          ) : (
            <input type="hidden" name="maintenanceBudget" value={defaults.maintenanceBudget} />
          )}
          <TotalDesBudgets engagement={engagement} />
        </Family>
      ) : null}
      {communicationOffer ? (
        // La communication (levier `communication`) : le budget de MARQUE, en
        // gamme seulement (les budgets par référence restent le marketing
        // spécifique), et l'AXE tenu ce tour. L'axe est un choix d'entreprise :
        // un seul, lisible, dont le formulaire dit à qui il parle.
        <Family
          carte="communication"
          icone="communication"
          legend={gamme ? "Communication · la marque et l'axe" : "Communication · l'axe"}
          defaultOpen
        >
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
                className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
              >
                <option value="">Aucun axe : le budget parle à tout le monde</option>
                {communicationOffer.axes.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-sm text-slate-400">
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
        hidden={masquee("equipe")}
        className="space-y-3"
      >
      {on.hr ? (
        <Family carte="rh" icone="equipes" legend="Ressources humaines">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
        <Family carte="rse" icone="feuille" legend="Engagement RSE">
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
        hidden={masquee("financer")}
        className="space-y-3"
      >
      {on.finance && debtSchedule && debtSchedule.outstanding > 0.5 ? (
        <Carte cle="financement">
        {/* Une information, pas une action : l'encre sur le voile neutre. */}
        <p className="encadre-neutre rounded-lg px-3 py-2 text-xs text-slate-200">
          <Icone nom="banque" className="mr-1.5 h-3.5 w-3.5" />
          Échéance d&apos;emprunt du tour :{" "}
          <strong>{Math.round(debtSchedule.nextMandatory).toLocaleString("fr-FR")} €</strong>{" "}
          de capital, prélevée automatiquement (+ intérêts). Dette restante{" "}
          {Math.round(debtSchedule.outstanding).toLocaleString("fr-FR")} €.
          <span className="max-sm:hidden"> Les échéances tombent, que la caisse soit pleine ou vide.</span>
        </p>
        </Carte>
      ) : null}
      {on.finance ? (
      <Family carte="financement" icone="banque" legend="Financer · emprunt, capital, investissement">
        <div className="grid grid-cols-1 gap-3 max-sm:gap-1.5 sm:grid-cols-2">
            <>
              <div>
                {/*
                  LE TAUX VIENT DU SCÉNARIO. Il était écrit « 5 %/an » en dur :
                  un scénario qui prête à 6 % annonçait 5 %.
                  Le plafond, lui, ne s'annonce plus : il borne le curseur.
                */}
                {loanCapacity ? (
                  <ChampPlafonne
                    name="newLoan"
                    label="Nouvel emprunt"
                    plafond={loanCapacity.remaining}
                    suffix="€"
                    legendePlafond="ce que la banque prête encore"
                    onValueChange={(v) => setRenfort((r) => ({ ...r, emprunt: v }))}
                    hint={`${tauxEmprunt}. La banque prête jusqu'à ${loanCapacity.ratio} × vos capitaux propres.`}
                  />
                ) : (
                  <Field name="newLoan" label="Nouvel emprunt" defaultValue={0} suffix="€"
                    onValueChange={(v) => setRenfort((r) => ({ ...r, emprunt: v }))}
                    hint={`${tauxEmprunt}. Amortissement constant sur la durée du contrat.`} />
                )}
                <Chiffrage lignes={chiffrageEmprunt} />
              </div>
              <Field
                name="loanRepayment"
                label={debtSchedule ? "Remboursement anticipé" : "Remboursement d'emprunt"}
                defaultValue={0}
                suffix="€"
                hint={debtSchedule ? "Facultatif, en plus de l'échéance obligatoire." : undefined}
              />
              {capitalAllowance ? (
                <ChampPlafonne
                  name="capitalIncrease"
                  label="Augmentation de capital"
                  plafond={capitalAllowance.remaining}
                  suffix="€"
                  legendePlafond="reste de l'enveloppe"
                  onValueChange={(v) => setRenfort((r) => ({ ...r, apport: v }))}
                  hint={`Apport des associés · enveloppe de ${Math.round(capitalAllowance.total).toLocaleString("fr-FR")} € pour la partie.`}
                />
              ) : (
                <Field name="capitalIncrease" label="Augmentation de capital" defaultValue={0} suffix="€"
                  onValueChange={(v) => setRenfort((r) => ({ ...r, apport: v }))}
                  hint="Apport des associés : trésorerie et capitaux propres, sans intérêts mais dilutif." />
              )}
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
          modeCartes ? (
            <div className="mt-2">
              <Tiroir
                titre="Découvert autorisé"
                quoi={`${formatEuro(bankFile.overdraftLimit)} · ${(bankFile.overdraftAnnualRate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %/an`}
                ferme
              >
                <p className="text-sm leading-relaxed text-slate-400">
                  Au-delà, la banque cède vos créances à votre place, et vous le paie cher.
                </p>
              </Tiroir>
            </div>
          ) : (
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
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
          )
        ) : null}
      </Family>
      ) : null}
      {on.investment && equipmentOffer ? (
        <Carte cle="investissement">
          <EquipmentPanel
            offer={equipmentOffer}
            vocabulary={v}
            buyQty={equipBuyQty}
            setBuyQty={setEquipBuyQty}
            sellQty={equipSellQty}
            setSellQty={setEquipSellQty}
            // Les niveaux qui n'ouvrent pas encore les créances sont ceux qui débutent.
            simple={!on.creances}
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
        </Carte>
      ) : null}
      </section>

      <section
        data-etape={idx("tresorerie")}
        hidden={masquee("tresorerie")}
        className="space-y-3"
      >
      {on.dividend ? (
        <Family carte="dividende" icone="argent" legend="Affectation du résultat · dividende" repli quoi={quoiDeLOption("dividende")}>
          <ChampPlafonne
            name="dividend"
            label="Dividende versé aux associés"
            plafond={reserves}
            suffix="€"
            legendePlafond="toutes les réserves"
            hint={
              reserves > 0
                ? "Les réserves sont les bénéfices non distribués des tours passés. Le versement sort en trésorerie, pas en résultat."
                : roundIndex <= 1
                  ? "Rien à distribuer : l'affectation s'ouvre à partir du tour 2."
                  : "Rien à distribuer : une perte se rattrape d'abord."
            }
          />
        </Family>
      ) : null}
      {on.creances && treasuryOffer ? (
        <Family carte="mobilisation" icone="tresorerie" legend="Trésorerie · mobiliser le poste clients" repli quoi={quoiDeLOption("mobilisation")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Field
                name="discount"
                label={`Escompte (${(treasuryOffer.discountAnnualRate * 100).toLocaleString("fr-FR")} %/an)`}
                defaultValue={0}
                suffix="€"
                onValueChange={(v) => setMobilisation((m) => ({ ...m, escompte: v }))}
                hint={`Avance sur créances, plafonnée à ${Math.round(treasuryOffer.discountMaxShare * 100)} % du poste clients, le moins cher.`}
              />
              <Chiffrage lignes={chiffrageEscompte} />
            </div>
            <div>
              <Field
                name="factoring"
                label={`Affacturage (${(treasuryOffer.factoringFeeRate * 100).toLocaleString("fr-FR")} % du montant)`}
                defaultValue={0}
                suffix="€"
                onValueChange={(v) => setMobilisation((m) => ({ ...m, affacturage: v }))}
                hint="Cession de créances, sans plafond : plus cher, immédiat."
              />
              <Chiffrage lignes={chiffrageAffacturage} />
            </div>
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
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
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
          {modeCartes ? (
            <div className="mt-2">
              <Tiroir
                titre="Découvert autorisé"
                quoi={`${Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €`}
                ferme
              >
                <p className="text-sm leading-relaxed text-slate-400">
                  Au-delà, la banque cède vos créances d&apos;office, au tarif fort.
                </p>
              </Tiroir>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Découvert autorisé jusqu&apos;à{" "}
              {Math.round(treasuryOffer.overdraftLimit).toLocaleString("fr-FR")} €. Au-delà, la
              banque cède vos créances d&apos;office, au tarif fort.
            </p>
          )}
        </Family>
      ) : null}
      </section>

      {/* L'ASSURANCE, À PART. Elle faisait 844 px sous la trésorerie : une famille
          de formules qu'on compare, et qui demande un écran à elle. */}
      <section
        data-etape={idx("assurance")}
        hidden={masquee("assurance")}
        className="space-y-3"
      >
      {on.insurance && insuranceFormulas && insuranceFormulas.length > 0 ? (
        <Family carte="assurance" icone="assurance" legend="Assurance · choisissez votre couverture" repli quoi={quoiDeLOption("assurance")}>
          <div className="space-y-2">
            <label className="flex items-start gap-3 bg-slate-900 rounded-xl border border-white/10 px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12">
              <input
                type="radio"
                name="insurance"
                value=""
                defaultChecked={!defaults.insurance}
                className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
              />
              <span className="text-sm text-slate-400">Aucune : pas de prime, tous les risques pour vous.</span>
            </label>
            {insuranceFormulas.map((f) => (
              <label
                key={f.code}
                className="flex items-start gap-3 bg-slate-900 rounded-xl border border-white/10 px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12"
              >
                <input
                  type="radio"
                  name="insurance"
                  value={f.code}
                  defaultChecked={defaults.insurance === f.code || (defaults.insurance === true && f.code === insuranceFormulas[0]?.code)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {f.name} · {formatEuro(f.premium)}
                  </span>
                  {/* En parcours, la liste complète des risques ne tient pas sur l'écran : la ligne dit
                      combien, et le détail de chaque formule est dans le tiroir sous les choix. */}
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {modeCartes
                      ? `${f.coveredLabels.length} risque${f.coveredLabels.length > 1 ? "s" : ""} couvert${f.coveredLabels.length > 1 ? "s" : ""}`
                      : `Couvre : ${f.coveredLabels.join(", ")}.`}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {modeCartes ? (
            <div className="mt-2">
              <Tiroir titre="Ce que couvre chaque formule" ferme>
                <ul className="space-y-2 text-sm text-slate-300">
                  {insuranceFormulas.map((f) => (
                    <li key={f.code}>
                      <strong className="text-slate-100">{f.name}</strong> : {f.coveredLabels.join(", ")}.
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Un coût certain contre un risque incertain : plus la couverture est large, plus la prime pèse.
                </p>
              </Tiroir>
            </div>
          ) : (
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Un coût certain contre un risque incertain : plus la couverture est large, plus
            la prime pèse.
          </p>
          )}
        </Family>
      ) : on.insurance && insuranceOffer ? (
        <Carte cle="assurance">
        <label className="flex items-start gap-3 bg-slate-950 rounded-xl border border-white/10 px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12">
          <input
            type="checkbox"
            name="insurance"
            defaultChecked={defaults.insurance === true}
            className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
          />
          <span>
            <span className="text-sm font-medium text-slate-200">
              <Icone nom="assurance" className="mr-1.5 h-4 w-4 text-amber-400" />
              Assurance catastrophe · {formatEuro(insuranceOffer.premium)} ce tour
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Couvre : {insuranceOffer.coveredLabels.join(", ")}. Un coût certain contre un
              risque incertain, à vous d&apos;arbitrer.
            </span>
          </span>
        </label>
        </Carte>
      ) : null}
      </section>

      <section
        data-etape={idx("prevoir")}
        hidden={masquee("prevoir")}
        className="space-y-3"
      >
      {studiesOffer ? (
        <Family
          carte="etudes"
          icone="loupe"
          legend={"Acheter de l'information · livrée avec les résultats du tour"}
          repli
          quoi={quoiDeLOption("etudes")}
        >
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
                className="flex items-start gap-3 bg-slate-900 rounded-xl border border-white/10 px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12"
              >
                <input
                  type="checkbox"
                  name={study.name}
                  defaultChecked={false}
                  onChange={(e) =>
                    setEtudesCochees((cochees) => {
                      const suite = { ...cochees };
                      if (e.target.checked) suite[study.name] = study.cost;
                      else delete suite[study.name];
                      return suite;
                    })
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                />
                <span>
                  <span className="text-sm font-medium text-slate-200">
                    {study.label} · {formatEuro(study.cost)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400 max-sm:line-clamp-2">{study.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {/*
            LE CUMUL, PENDANT QU'ON COCHE. Quatre prix affichés à côté de
            quatre cases ne font pas une addition : l'élève coche trois études
            et découvre la facture au tour suivant, dans les charges de
            structure. Le total se voit maintenant au moment du choix.
          */}
          <Chiffrage
            lignes={
              totalEtudes > 0
                ? [
                    {
                      label: `Coût total des études (${nombreDEtudes})`,
                      valeur: formatEuro(totalEtudes),
                      fort: true,
                    },
                  ]
                : []
            }
          />
          {modeCartes ? (
            <div className="mt-2">
              <Tiroir titre="Pourquoi payer l'information ?" ferme>
                <p className="text-sm leading-relaxed text-slate-400">
                  L&apos;information a un prix, facturé en charges de structure : il se lit au seuil
                  de rentabilité. Décider sans données coûte souvent plus cher.
                </p>
              </Tiroir>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              L&apos;information a un prix, facturé en charges de structure : il se lit au seuil
              de rentabilité. Décider sans données coûte souvent plus cher.
            </p>
          )}
        </Family>
      ) : null}
      {/*
        LA NOTE D'AVANT. Écrire ce qu'on attend de ses choix AVANT de connaître
        le résultat est la seule façon de mesurer son propre raisonnement : au
        tour suivant, la note revient à côté du constat, et l'écart se lit.
        Elle est exigée au PREMIER TOUR, où personne n'a encore d'habitude à
        reconduire, puis laissée libre : une note arrachée chaque tour devient
        une formalité qu'on expédie, et une formalité n'apprend rien.
      */}
      <Family
        carte="justification"
        icone="ecrire"
        legend="En quelques mots"
        tone="border-slate-700/60"
        legendClass="text-xs font-medium text-slate-400"
      >
        <textarea
          name="justification"
          rows={2}
          aria-label="Justification de vos décisions"
          placeholder={premierTour ? INVITATION_NOTE : "Pourquoi ces choix ce tour-ci ?"}
          className="w-full resize-y champ px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none"
        />
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {premierTour
            ? "Recommandé : une phrase, avant de savoir. Elle vous reviendra au prochain tour, en face du résultat."
            : "Elle vous reviendra au prochain tour, en face du résultat. L'enseignant la lira au débriefing."}
        </p>
      </Family>
      </section>
      {modeCartes && carteCourante?.cle === "recap" ? enTeteDuRecapitulatif : null}
      {modeCartes && carteCourante?.cle === "recap" && donneesRecap ? (
        <RecapDesDecisions
          lignes={fusionnerFinancerEtInvestir(
            cartes
              .filter((c) => c.resume)
              .map((c) => ({ cle: c.cle, nom: c.nom, valeur: c.resume!(donneesRecap) })),
          )}
          surModifier={(cle) => {
            const i = cartes.findIndex((c) => c.cle === cle);
            if (i >= 0) allerALaCarte(i);
          }}
        />
      ) : null}
      {state.error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      {/*
        LE RÉCAPITULATIF D'ENGAGEMENT, à la dernière étape seulement. Valider,
        c'est l'acte du tour ; il ressemblait à l'envoi d'un formulaire. Une
        équipe à quatre, qui a rempli les étapes chacune de son côté, validait
        sans que personne n'ait vu l'ensemble.
      */}
      {derniere && engagement && !verrou && !modeCartes ? (
        <EngagementDuTour
          engagement={engagement}
          vocabulary={v}
          gamme={Boolean(gamme && gamme.length > 0)}
        />
      ) : null}
      {pending && kind === "solo" ? (
        // Le tour se résout côté serveur puis redirige : entre les deux, on
        // rend l'attente tangible — la machine tourne, étape après étape —
        // plutôt qu'un bouton grisé « Envoi en cours… ».
        modeCartes ? (
          // EN PARCOURS, l'attente prend l'écran : posée sous la dernière carte, elle restait hors
          // de vue, et le toucher sur « Valider et simuler » semblait ne rien faire.
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6 backdrop-blur-sm">
            <div className="w-full max-w-sm">
              <SimulationProgress periodName={periodName} />
            </div>
          </div>
        ) : (
          <SimulationProgress periodName={periodName} />
        )
      ) : nonTouches ? (
        // Pivots laissés aux valeurs proposées : la confirmation REMPLACE le
        // pied de navigation au lieu de s'y ajouter. Sans ça, « Oui/Non » et
        // « Valider » cohabitaient à l'écran (double boutonnage) ; ici une
        // seule action est offerte à la fois.
        <div
          role="alert"
          className={`border-t border-orange-400 pt-3 ${
            modeCartes
              ? // EN PARCOURS, la question prend la place du pied fixe : posée sous un long
                // récapitulatif, elle restait hors de l'écran.
                "fixed inset-x-0 bottom-0 z-40 bg-slate-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md print:hidden"
              : ""
          }`}
        >
          <p className="text-sm text-orange-100">
            Vous validez avec les valeurs proposées pour :{" "}
            <strong>{nonTouches.map((p) => p.label).join(", ")}</strong>. C&apos;est un choix ?
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={garderLesValeurs}
              className="min-h-11 rounded-lg bg-orange-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
            >
              Oui, je garde ces valeurs
            </button>
            <button
              type="button"
              onClick={lesModifier}
              className="min-h-11 rounded-lg border border-orange-400 px-4 py-2.5 text-sm font-semibold text-orange-200 transition hover:bg-white/5"
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
        // SUR TÉLÉPHONE, CE PIED EST COLLÉ AU BAS DE L'ÉCRAN, juste au-dessus des
        // onglets de l'arène (voir segmented-tabs.tsx) : « Précédent » à gauche,
        // l'action principale qui prend toute la place restante. Le compteur
        // « Étape X/Y » y disparaît : les pastilles numérotées juste au-dessus
        // du formulaire le disent déjà, et il coûtait la largeur d'un bouton.
        // Sur grand écran, tout reste sur une rangée : Précédent · Étape · action
        // (poussée à droite par le `sm:mr-auto` du compteur).
        <div
          className={`space-y-3 border-t border-white/10 pt-3 ${
            modeCartes
              ? // EN PARCOURS, LE PIED EST FIXÉ AU BAS DE L'ÉCRAN, quelle que soit la
                // longueur de la carte : une carte courte ne laisse pas son bouton
                // flotter au milieu, comme un site.
                // `mb-0` : l'espacement du formulaire (space-y) donnait au pied une
                // marge basse, qui le décollait de 12 px du bas de l'écran.
                "fixed inset-x-0 bottom-0 z-40 mb-0 border-white/12 bg-slate-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 print:hidden"
              : "max-sm:sticky max-sm:bottom-[var(--barre-bas,0px)] max-sm:z-30 max-sm:-mx-4 max-sm:bg-slate-950/95 max-sm:px-4 max-sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] max-sm:backdrop-blur-md"
          }`}
        >
          {/* L'échéance se rappelle ici, contre le bouton : c'est le moment où
              savoir qu'il reste huit minutes change quelque chose. */}
          {echeance && !verrou ? <EcheanceDuTour closesAt={echeance} /> : null}
          <div className="flex items-center gap-3 sm:flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (modeCartes) {
                  vibrer(8);
                  cartePrecedente();
                } else allerALEtape((e) => Math.max(0, Math.min(e, total - 1) - 1));
              }}
              disabled={!modeCartes && courante === 0}
              aria-label={modeCartes ? "Retour" : "Précédent"}
              className="order-1 min-h-11 shrink-0 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {modeCartes ? "Retour" : "← Précédent"}
            </button>
            <span className="order-2 hidden shrink-0 text-xs tabular-nums text-slate-400 sm:mr-auto sm:block">
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
                // « Envoi en cours… » se lit déjà dans le libellé ; `aria-busy`
                // le dit aussi aux technologies d'assistance, garde l'encre du
                // bouton entière au lieu de l'éteindre, et lui pose la barre
                // indéterminée des actions longues (bloc « LOT 5B »).
                aria-busy={pending}
                className={`${aplat(`${bouton({ taille: "l" })} bg-gradient-to-b from-amber-300 to-amber-400 shadow-lg shadow-amber-400/25`)} active:scale-[0.98] order-3 max-sm:flex-1`}
              >
                {pending
                  ? "Envoi en cours…"
                  : kind === "solo"
                    ? "Valider et simuler"
                    : alreadySubmitted
                      ? "Mettre à jour mes décisions validées"
                      : "Valider les décisions de l'équipe"}
              </button>
            ) : modeCartes && carteCourante?.cle === "commande" ? (
              // UNE QUESTION, DEUX RÉPONSES : la réponse fait avancer. La case à
              // cocher du formulaire reste, masquée, et c'est elle qui part.
              <div key="commande" className="order-3 flex min-w-0 flex-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => repondreALaCommande(false)}
                  className={`${bouton({ variante: commandeAcceptee === false ? "principal" : "secondaire", taille: "l" })} min-h-12 min-w-0 flex-1 px-3`}
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => repondreALaCommande(true)}
                  className={`${bouton({ variante: commandeAcceptee === false ? "secondaire" : "principal", taille: "l" })} min-h-12 min-w-0 flex-1 px-3`}
                >
                  Accepter
                </button>
              </div>
            ) : (
              <button
                key="suivant"
                type="button"
                onClick={() => {
                  if (modeCartes) {
                    vibrer(8);
                    carteSuivante();
                  } else allerALEtape((e) => Math.min(total - 1, Math.min(e, total - 1) + 1));
                }}
                className={`${aplat(`${bouton({ taille: "l" })} bg-gradient-to-b from-amber-300 to-amber-400 shadow-lg shadow-amber-400/25`)} active:scale-[0.98] order-3 max-sm:flex-1`}
              >
                {modeCartes ? "Continuer" : "Suivant"} →
              </button>
            )}
          </div>
        </div>
      )}
      {/* La place du pied fixe : sans elle, le bas de la carte passerait dessous. */}
      {modeCartes ? <div aria-hidden className="h-[calc(5.5rem+env(safe-area-inset-bottom))]" /> : null}
      {!(pending && kind === "solo") && !modeCartes ? (
        <p className="text-center text-xs text-slate-400">
          {kind === "solo"
            ? "Mode apprentissage : les résultats sont calculés immédiatement, à vous d'analyser."
            : "Vos décisions restent modifiables jusqu'à la clôture du tour par l'enseignant."}
        </p>
      ) : null}
    </form>
    </CartesContexte.Provider>
    </TelephoneContexte.Provider>
  );
}
