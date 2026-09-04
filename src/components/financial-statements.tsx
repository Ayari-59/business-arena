import type { CompanyRoundResult } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";

/**
 * Les comptes du tour, en clair et GRATUITS (doc 02 §7.3 : ce sont VOS
 * comptes) : compte de résultat, bilan, analyse des coûts, budget de
 * trésorerie — dépliables sous les résultats. Composant serveur.
 */

const euro = (v: number) => {
  const rounded = Math.round(v);
  return `${rounded < 0 ? "−" : ""}${Math.abs(rounded).toLocaleString("fr-FR")} €`;
};
const units = (v: number) => Math.round(v).toLocaleString("fr-FR");
const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} %`;

const CASH_LABELS: Record<string, string> = {
  encaissements_clients: "Encaissements clients",
  escompte_creances: "Escompte de créances",
  affacturage: "Affacturage",
  affacturage_force: "Affacturage forcé (banque)",
  paiements_fournisseurs: "Paiements fournisseurs",
  couts_variables_decaisses: "Coûts variables décaissés",
  commissions_partenaires: "Commissions des canaux partenaires",
  couts_fixes: "Charges de structure décaissées",
  marketing: "Budget marketing",
  qualite: "Budget qualité",
  maintenance: "Budget maintenance",
  interets: "Charges financières",
  placement_arrive_a_terme: "Placement arrivé à terme",
  produits_financiers: "Produits financiers (placement)",
  placement_souscrit: "Placement souscrit",
  impot: "Impôt sur les sociétés",
  tva_decaissee: "TVA décaissée",
  investissement: "Investissement",
  nouvel_emprunt: "Nouvel emprunt",
  augmentation_capital: "Augmentation de capital",
  dividendes_verses: "Dividendes versés aux associés",
  remboursement_emprunt: "Remboursement d'emprunt",
};

function Panel({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-xl border border-white/10 bg-slate-900"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-200 hover:text-amber-200">
        {title}
        <span className="float-right text-xs text-slate-500 group-open:hidden">déplier</span>
      </summary>
      <div className="border-t border-white/5 px-4 py-3">{children}</div>
    </details>
  );
}

function Row({
  label,
  value,
  strong,
  indent,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  indent?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-1 text-xs ${
        strong ? "border-t border-white/10 font-semibold text-slate-100" : "text-slate-300"
      } ${indent ? "pl-4 text-slate-400" : ""}`}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums ${
          tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-400" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function FinancialStatements({
  result,
  price,
  materialCostPerUnit,
  otherVariableCostPerUnit,
  vocabulary,
}: {
  result: CompanyRoundResult;
  /** Prix de vente du tour (analyse des coûts) — null si inconnu. */
  price: number | null;
  materialCostPerUnit: number;
  otherVariableCostPerUnit: number;
  /** Le métier nomme lui-même ce qu'il achète : on ne vend pas des matières
   *  premières dans une salle de sport. */
  vocabulary: ScenarioVocabulary;
}) {
  const cr = result.incomeStatement;
  const b = result.balanceSheet;
  const cvu = materialCostPerUnit + otherVariableCostPerUnit;
  const soldUnits = Object.values(result.market.bySegment).reduce((s, d) => s + d.sold, 0)
    + (result.extraOrders?.delivered ?? 0)
    + (result.extraOrders?.subcontracted ?? 0)
    + (result.orderOffer?.delivered ?? 0);
  const structure =
    cr.fixedCosts + cr.marketingCost + cr.qualityCost + cr.maintenanceCost + cr.depreciation;
  const placement = b.shortTermInvestment ?? 0;
  const totalAssets =
    b.fixedAssetsNet + b.inventoryValue + b.receivables + b.cash + placement;
  const vat = b.vatLiability ?? 0;

  return (
    <section className="mt-4 space-y-2" aria-label="Vos comptes du tour">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        🧾 Vos comptes du tour · lisez-les comme un dirigeant
      </p>

      <Panel title="Compte de résultat" defaultOpen>
        <Row label="Chiffre d'affaires" value={euro(cr.revenue)} />
        {Math.abs(cr.productionStocked) > 0.5 ? (
          <Row label="Production stockée (± Δ stock)" value={euro(cr.productionStocked)} indent />
        ) : null}
        <Row label="− Coût variable des ventes" value={euro(-cr.cogs)} indent />
        {/* La commission d'un canal partenaire se retranche ici, avec les
            autres charges de la vente : c'est la seule place d'où « la marge
            après commission » se lit sans la recalculer. La ligne n'apparaît
            que dans les secteurs qui vendent par un tiers. */}
        {(cr.commissionCost ?? 0) > 0.5 ? (
          <Row
            label="− Commissions des canaux partenaires"
            value={euro(-(cr.commissionCost ?? 0))}
            indent
          />
        ) : null}
        <Row label="= Marge sur coût variable" value={euro(cr.grossMargin)} strong />
        <Row label="− Marketing" value={euro(-cr.marketingCost)} indent />
        <Row label="− Qualité" value={euro(-cr.qualityCost)} indent />
        <Row label="− Maintenance" value={euro(-cr.maintenanceCost)} indent />
        <Row label="− Charges de structure" value={euro(-cr.fixedCosts)} indent />
        <Row label="= Excédent brut d'exploitation (EBE)" value={euro(cr.ebitda)} strong />
        <Row label="− Dotations aux amortissements" value={euro(-cr.depreciation)} indent />
        <Row label="= Résultat d'exploitation" value={euro(cr.operatingIncome)} strong />
        <Row label="− Charges financières (intérêts, agios, mobilisations)" value={euro(-cr.interest)} indent />
        {(cr.financialIncome ?? 0) > 0.5 ? (
          <Row
            label="+ Produits financiers (placement)"
            value={euro(cr.financialIncome ?? 0)}
            indent
          />
        ) : null}
        {(cr.taxLossUsed ?? 0) > 0.5 ? (
          <Row
            label="dont déficit antérieur imputé (report)"
            value={euro(cr.taxLossUsed ?? 0)}
            indent
          />
        ) : null}
        <Row label="− Impôt sur les sociétés" value={euro(-cr.tax)} indent />
        <Row
          label="= RÉSULTAT NET"
          value={euro(cr.netIncome)}
          strong
          tone={cr.netIncome >= 0 ? "good" : "bad"}
        />
      </Panel>

      <Panel title="Bilan">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actif
            </p>
            <Row label="Immobilisations nettes" value={euro(b.fixedAssetsNet)} />
            <Row label="Stocks de produits finis" value={euro(b.inventoryValue)} />
            <Row label="Créances clients" value={euro(b.receivables)} />
            {placement > 0.5 ? (
              <Row label="Valeurs mobilières de placement" value={euro(placement)} />
            ) : null}
            <Row label="Disponibilités" value={euro(b.cash)} />
            <Row label="TOTAL ACTIF" value={euro(totalAssets)} strong />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Passif
            </p>
            <Row label="Capitaux propres" value={euro(b.equity)} />
            <Row label="Dettes financières" value={euro(b.financialDebt)} />
            <Row label="Dettes fournisseurs" value={euro(b.payables)} />
            {Math.abs(vat) > 0.5 ? (
              <Row label={vat >= 0 ? "TVA à décaisser" : "Crédit de TVA (−)"} value={euro(vat)} />
            ) : null}
            {b.overdraft > 0.5 ? (
              <Row label="Concours bancaires (découvert)" value={euro(b.overdraft)} tone="bad" />
            ) : null}
            <Row
              label="TOTAL PASSIF"
              value={euro(b.equity + b.financialDebt + b.payables + vat + b.overdraft)}
              strong
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {placement > 0.5 && b.overdraft > 0.5
            ? "Vous détenez un placement ET un découvert : vous payez le second bien plus cher que le premier ne rapporte. "
            : ""}
          Le bilan équilibre au centime, par construction. FRNG{" "}
          {euro(result.functionalBalance.frng)} − BFR {euro(result.functionalBalance.bfr)} ={" "}
          trésorerie nette {euro(result.functionalBalance.netTreasury)}.
        </p>
      </Panel>

      <Panel title="Analyse des coûts">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              À l&apos;unité
            </p>
            <Row label={vocabulary.materialLabel} value={euro(materialCostPerUnit)} indent />
            <Row label={vocabulary.otherVariableLabel} value={euro(otherVariableCostPerUnit)} indent />
            <Row label="= Coût variable unitaire" value={euro(cvu)} strong />
            {price !== null ? (
              <>
                <Row label="Prix de vente" value={euro(price)} />
                <Row
                  label="= Marge sur coût variable / unité"
                  value={euro(price - cvu)}
                  strong
                  tone={price - cvu > 0 ? "good" : "bad"}
                />
              </>
            ) : null}
            {soldUnits > 0.5 ? (
              <Row
                label="Coût complet unitaire (≈ variables + structure / vendues)"
                value={euro(cr.cogs / Math.max(1, soldUnits) + structure / soldUnits)}
              />
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sur le tour
            </p>
            <Row
              label="Coûts variables"
              value={`${euro(cr.cogs)} (${cr.revenue > 0 ? pct(cr.cogs / cr.revenue) : "—"} du CA)`}
            />
            <Row
              label="Charges de structure (budgets et amortissements compris)"
              value={`${euro(structure)} (${cr.revenue > 0 ? pct(structure / cr.revenue) : "—"} du CA)`}
            />
            <Row
              label="Seuil de rentabilité"
              value={
                result.breakeven.breakEvenUnits != null && result.breakeven.breakEvenRevenue != null
                  ? `${units(result.breakeven.breakEvenUnits)} u (${euro(result.breakeven.breakEvenRevenue)})`
                  : "seuil jamais atteint (marge sur coût variable nulle ou négative)"
              }
              strong
            />
            <Row
              label="Marge de sécurité"
              value={result.breakeven.safetyMargin != null ? euro(result.breakeven.safetyMargin) : "—"}
              tone={result.breakeven.safetyMargin != null && result.breakeven.safetyMargin >= 0 ? "good" : "bad"}
            />
            <Row
              label="Indice de sécurité"
              value={result.breakeven.safetyIndex != null ? pct(result.breakeven.safetyIndex) : "—"}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Les charges de structure tombent quoi qu&apos;il arrive : chaque unité vendue au-dessus
          du coût variable les éponge : le seuil dit combien il en faut.
        </p>
      </Panel>

      <Panel title="Budget de trésorerie">
        <Row label="Trésorerie d'ouverture" value={euro(result.cashFlow.opening)} strong />
        {result.cashFlow.items.map((item) => (
          <Row
            key={item.label}
            label={CASH_LABELS[item.label] ?? item.label}
            value={euro(item.amount)}
            indent
            tone={item.amount >= 0 ? undefined : undefined}
          />
        ))}
        <Row
          label="= Trésorerie de clôture"
          value={euro(result.cashFlow.closing)}
          strong
          tone={result.cashFlow.closing >= 0 ? "good" : "bad"}
        />
        <p className="mt-2 text-xs text-slate-500">
          Le résultat est une opinion, la trésorerie est un fait : ce tableau montre où
          l&apos;argent est réellement entré et sorti.
        </p>
      </Panel>
    </section>
  );
}
