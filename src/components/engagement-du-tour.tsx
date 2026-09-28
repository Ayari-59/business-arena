import { formatEuro, formatUnits } from "@/lib/format";
import { productFieldName } from "@/config/decision-source";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";

/**
 * CE QUE VOUS ENGAGEZ, AVANT DE VALIDER.
 *
 * Valider, c'est l'acte du tour : on engage un prix, un volume, des budgets,
 * parfois un emprunt. À l'écran, cela ressemblait pourtant à l'envoi d'un
 * formulaire — six étapes de saisie, puis un bouton, sans que rien ne remette
 * sous les yeux ce qu'on vient de décider. Une équipe à quatre, qui a rempli
 * les étapes chacune de son côté, validait sans que personne n'ait jamais vu
 * l'ensemble.
 *
 * LE TOTAL DES BUDGETS EST LA SEULE CHOSE VRAIMENT NEUVE ICI. Chaque montant
 * est saisi dans son coin ; leur somme n'apparaît nulle part avant le compte de
 * résultat, c'est-à-dire trop tard. C'est pourtant elle qui sort de la caisse
 * ce tour-ci.
 *
 * Lu sur le formulaire lui-même, jamais recopié : les champs sont la source, et
 * un récapitulatif qui tiendrait ses propres valeurs finirait par mentir.
 */

export interface Engagement {
  /** Le prix du tour, ou le prix moyen des références en gamme. */
  prix: number | null;
  /** Le volume engagé, toutes références confondues. */
  volume: number;
  /** Les budgets saisis, dans l'ordre où le formulaire les demande. */
  budgets: { label: string; montant: number }[];
  /** Ce que ces budgets sortent de la caisse ce tour-ci. */
  total: number;
  /** Les ventes annoncées dans le plan de trésorerie, quand il est demandé. */
  ventesPrevues: number | null;
}

const nombre = (data: FormData, champ: string): number | null => {
  const brut = data.get(champ);
  if (brut === null) return null;
  const v = Number(String(brut).replace(",", "."));
  return Number.isFinite(v) ? v : null;
};

/**
 * L'engagement, lu dans les champs du formulaire. `codesDesReferences` est
 * vide en mono-produit, et porte les références de la gamme sinon : le prix et
 * le volume s'y lisent référence par référence.
 */
export function lireLEngagement(data: FormData, codesDesReferences: readonly string[]): Engagement {
  const budgets: { label: string; montant: number }[] = [];
  const ajouter = (label: string, champ: string) => {
    const v = nombre(data, champ);
    if (v !== null && v > 0) budgets.push({ label, montant: v });
  };

  let prix: number | null;
  let volume: number;
  if (codesDesReferences.length > 0) {
    const prixDesReferences = codesDesReferences
      .map((code) => nombre(data, productFieldName(code, "price")))
      .filter((v): v is number => v !== null);
    prix =
      prixDesReferences.length > 0
        ? prixDesReferences.reduce((s, v) => s + v, 0) / prixDesReferences.length
        : null;
    volume = codesDesReferences.reduce(
      (s, code) => s + (nombre(data, productFieldName(code, "productionPlan")) ?? 0),
      0,
    );
    // En gamme, marketing, qualité et R&D se décident référence par référence :
    // on les additionne plutôt que d'en montrer six lignes.
    const parReference = (champ: "marketingBudget" | "qualityBudget" | "rdBudget") =>
      codesDesReferences.reduce(
        (s, code) => s + (nombre(data, productFieldName(code, champ)) ?? 0),
        0,
      );
    const marketing = parReference("marketingBudget");
    if (marketing > 0) budgets.push({ label: "Marketing", montant: marketing });
    const qualite = parReference("qualityBudget");
    if (qualite > 0) budgets.push({ label: "Qualité", montant: qualite });
    const rd = parReference("rdBudget");
    if (rd > 0) budgets.push({ label: "Recherche et développement", montant: rd });
  } else {
    prix = nombre(data, "price");
    volume = nombre(data, "productionPlan") ?? 0;
    ajouter("Marketing", "marketingBudget");
    ajouter("Qualité", "qualityBudget");
    ajouter("Recherche et développement", "rdBudget");
  }
  ajouter("Entretien", "maintenanceBudget");
  ajouter("Marque", "brandMarketingBudget");
  ajouter("Formation", "trainingBudget");
  ajouter("RSE", "rseBudget");

  return {
    prix,
    volume,
    budgets,
    total: budgets.reduce((s, b) => s + b.montant, 0),
    ventesPrevues: nombre(data, "expectedUnits"),
  };
}

export function EngagementDuTour({
  engagement,
  vocabulary,
  gamme,
}: {
  engagement: Engagement;
  vocabulary: ScenarioVocabulary;
  /** Vrai quand le scénario a une gamme : le prix affiché est alors une moyenne. */
  gamme: boolean;
}) {
  const e = engagement;
  return (
    <section className="rounded-lg border border-amber-400/25 bg-amber-400/5 px-3 py-3 sm:px-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        Ce que vous engagez
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Ligne
          titre={gamme ? "Prix moyen" : vocabulary.priceLabel}
          valeur={e.prix === null ? "—" : formatEuro(e.prix)}
        />
        <Ligne
          titre={vocabulary.productionLabel}
          valeur={`${formatUnits(e.volume)} ${vocabulary.units}`}
        />
        <Ligne titre="Budgets du tour" valeur={formatEuro(e.total)} accent />
        {e.ventesPrevues !== null ? (
          <Ligne
            titre="Ventes annoncées"
            valeur={`${formatUnits(e.ventesPrevues)} ${vocabulary.units}`}
          />
        ) : null}
      </dl>
      {e.budgets.length > 0 ? (
        <p className="mt-2 text-sm leading-snug text-slate-400">
          {e.budgets.map((b, i) => (
            <span key={b.label}>
              {i > 0 ? " · " : ""}
              {b.label} <span className="tabular-nums text-slate-300">{formatEuro(b.montant)}</span>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

function Ligne({ titre, valeur, accent = false }: { titre: string; valeur: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{titre}</dt>
      <dd
        className={`mt-0.5 text-sm font-semibold tabular-nums ${
          accent ? "text-amber-200" : "text-slate-100"
        }`}
      >
        {valeur}
      </dd>
    </div>
  );
}
