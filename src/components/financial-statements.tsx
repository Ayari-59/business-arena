import type { CompanyRoundResult } from "@/engine/types";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import { Tiroir } from "@/components/tiroir";
import {
  ecartAuTourPrecedent,
  lectureDeLaTresorerie,
  lectureDuBilan,
  lectureDuResultat,
  type Lecture,
} from "@/components/lecture-des-comptes";
import { Icone } from "@/components/icone";

/**
 * Les comptes du tour, en clair et GRATUITS (doc 02 §7.3 : ce sont VOS
 * comptes) : compte de résultat, bilan, analyse des coûts, budget de
 * trésorerie — dépliables sous les résultats. Composant serveur.
 *
 * LA FORME EST CELLE DE LA PRESSE ÉCONOMIQUE, pas celle d'un tableau de bord.
 * C'étaient des suites de `<div>` en 12 px, avec des jauges et des pastilles
 * « tenu / manqué » pour dire si c'était bon. Ce sont maintenant de vrais
 * tableaux : en-têtes de colonne, intitulés à l'encre, chiffres tabulaires de
 * 14 px alignés à droite, filets fins, totaux et soldes intermédiaires en gras,
 * et une COLONNE D'ÉCART au tour précédent qui porte seule le vert et le rouge.
 * C'est le chiffre et son écart qui disent si c'est bon ; une jauge le disait à
 * sa place, et moins bien.
 *
 * La cascade du compte de résultat est conservée : chaque solde intermédiaire
 * se lit sous les charges qu'il absorbe.
 */

const euro = (v: number) => {
  const rounded = Math.round(v);
  return `${rounded < 0 ? "−" : ""}${Math.abs(rounded).toLocaleString("fr-FR")} €`;
};
const units = (v: number) => Math.round(v).toLocaleString("fr-FR");
const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} %`;
/** Un écart s'écrit SIGNÉ, dans les deux sens : « + » est une information. */
const euroSigne = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v)).toLocaleString("fr-FR")} €`;
const pctSigne = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${(Math.abs(v) * 100).toFixed(1).replace(".", ",")} %`;

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
  engagement_rse: "Engagement RSE",
  recherche_developpement: "Recherche et développement",
  sanction_rse: "Sanction RSE (amende)",
  subvention_rse: "Éco-subvention RSE",
  subvention_exceptionnelle: "Subvention exceptionnelle (sauvetage)",
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

/**
 * Un état financier replié. Il avait son propre repli, signalé par le mot
 * « déplier » flottant à droite ; il partage désormais le tiroir commun de
 * l'arène — même chevron, même trait pointillé quand c'est fermé — pour qu'un
 * élève reconnaisse un repli au même signe d'un bout à l'autre de la page.
 */
function Panel({
  title,
  defaultOpen,
  resume,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /**
   * Le chiffre qui dit l'état sans l'ouvrir, lu dans l'en-tête fermé. Quatre états ouverts
   * ensemble faisaient 3 000 px sur un téléphone : ils forment maintenant un accordéon (en
   * ouvrir un ferme les autres), et chacun annonce sa conclusion.
   */
  resume?: string;
  children: React.ReactNode;
}) {
  return (
    <Tiroir
      titre={title}
      quoi={resume}
      ouvert={defaultOpen}
      ferme={!defaultOpen}
      groupe="comptes-du-tour"
    >
      {children}
    </Tiroir>
  );
}

/**
 * La ligne de lecture en tête d'un état : la même voix que la banque dans le
 * tableau de bord, le ton porté par la couleur ET par le mot (un lecteur
 * d'écran n'a pas la couleur).
 */
function LigneDeLecture({ lecture }: { lecture: Lecture }) {
  // Le ton se lit au filet plein, vert ou rouge, sur un voile neutre : la
  // vigilance était un cadre orange (la couleur de l'action) et la lecture
  // favorable un voile turquoise.
  const teinte =
    lecture.ton === "mauvais"
      ? "encadre-perte text-slate-100"
      : lecture.ton === "bon"
        ? "encadre-gain text-slate-100"
        : "encadre-neutre text-slate-300";
  return (
    <p className={`mb-2 rounded-lg px-3 py-2 text-sm leading-relaxed ${teinte}`}>
      <span className="sr-only">
        {lecture.ton === "mauvais"
          ? "Point de vigilance. "
          : lecture.ton === "bon"
            ? "Lecture favorable. "
            : ""}
      </span>
      <Icone nom="idee" className="mr-1.5 h-4 w-4" />
      {lecture.texte}
    </p>
  );
}

type Format = "euro" | "units" | "percent";

const montre = (valeur: number, format: Format) =>
  format === "euro" ? euro(valeur) : format === "units" ? units(valeur) : pct(valeur);

/**
 * UN TABLEAU D'ÉTAT : l'intitulé, le chiffre du tour, l'écart, le pourcentage.
 *
 * `avecEcart` est faux pour l'analyse des coûts, qui n'est pas un état daté
 * mais une décomposition du tour : un écart y comparerait des grandeurs qui
 * n'ont pas la même base d'un tour à l'autre.
 */
function Etat({
  periode,
  avecEcart = true,
  legende,
  children,
}: {
  periode: string;
  avecEcart?: boolean;
  /** Ce que le tableau présente, pour un lecteur d'écran. */
  legende: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tableau-financier">
      <table className="text-sm">
        <caption className="sr-only">
          {legende}
          {avecEcart
            ? " La colonne d'écart compare au tour précédent ; elle reste vide quand il n'y a pas de référence."
            : ""}
        </caption>
        <thead>
          <tr className="libelle border-b border-white/10">
            <th scope="col" className="py-1 pr-3 text-left font-medium">
              Poste
            </th>
            <th scope="col" className="py-1 pl-2 text-right sm:pl-3 font-medium">
              {periode}
            </th>
            {avecEcart ? (
              <>
                <th scope="col" className="py-1 pl-2 text-right sm:pl-3 font-medium">
                  Écart
                </th>
                <th scope="col" className="py-1 pl-2 text-right sm:pl-3 font-medium">
                  %
                </th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/**
 * Une ligne d'état. `valeur` et `avant` sont dans le sens où ils S'AFFICHENT :
 * une charge montrée en négatif se compare en négatif.
 *
 * `fort` marque un TOTAL ou un SOLDE INTERMÉDIAIRE : filet au-dessus, gras.
 * `tone` ne sert plus qu'aux lignes qui sont des RÉSULTATS (le résultat net, la
 * trésorerie en découvert) ; un niveau s'écrit à l'encre, et c'est l'écart qui
 * dit s'il est bon.
 */
function Ligne({
  label,
  valeur,
  avant = null,
  texte,
  format = "euro",
  fort,
  decalee,
  tone,
  avecEcart = true,
}: {
  label: string;
  valeur: number;
  /** La même valeur au tour précédent. `null` : la colonne d'écart reste vide. */
  avant?: number | null;
  /** Le texte affiché quand il n'est pas le simple format de la valeur. */
  texte?: string;
  format?: Format;
  fort?: boolean;
  decalee?: boolean;
  tone?: "good" | "bad";
  avecEcart?: boolean;
}) {
  const ecart = avecEcart ? ecartAuTourPrecedent(valeur, avant) : null;
  // Un écart EST un résultat : il porte le vert ou le rouge francs. Un écart nul
  // ne dit ni gain ni perte — il reste à l'encre.
  const teinteEcart =
    ecart === null || Math.round(ecart.montant) === 0
      ? "text-slate-400"
      : ecart.montant > 0
        ? "text-emerald-300"
        : "text-red-400";
  return (
    <tr className={fort ? "border-t border-white/15" : ""}>
      <th
        scope="row"
        className={`py-1 pr-3 text-left font-normal ${
          fort ? "font-semibold text-slate-100" : decalee ? "pl-3 text-slate-400" : "text-slate-300"
        }`}
      >
        {label}
      </th>
      <td
        className={`whitespace-nowrap py-1 pl-2 text-right sm:pl-3 tabular-nums ${
          fort ? "font-semibold" : ""
        } ${tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-400" : fort ? "text-slate-100" : "text-slate-200"}`}
      >
        {texte ?? montre(valeur, format)}
      </td>
      {avecEcart ? (
        <>
          <td
            data-ecart
            className={`whitespace-nowrap py-1 pl-2 text-right sm:pl-3 tabular-nums ${teinteEcart}`}
          >
            {/* Pas de référence au tour précédent : la cellule reste VIDE. « 0 »
                dirait « rien n'a bougé », et c'est faux — on ne sait pas. */}
            {ecart === null ? "" : euroSigne(ecart.montant)}
          </td>
          <td
            data-ecart
            className={`whitespace-nowrap py-1 pl-2 text-right sm:pl-3 tabular-nums ${teinteEcart}`}
          >
            {ecart === null || ecart.relatif === null ? "" : pctSigne(ecart.relatif)}
          </td>
        </>
      ) : null}
    </tr>
  );
}

export function FinancialStatements({
  result,
  precedent = null,
  periode,
  price,
  otherVariableCostPerUnit,
  vocabulary,
}: {
  result: CompanyRoundResult;
  /**
   * Le tour précédent, pour la colonne d'écart. `null` au premier tour : les
   * cellules d'écart restent vides, et c'est ce qu'il faut dire.
   */
  precedent?: CompanyRoundResult | null;
  /** Le nom de la période affichée, en en-tête de colonne : « Trimestre 3 ». */
  periode: string;
  /** Prix de vente du tour (analyse des coûts) — null si inconnu. */
  price: number | null;
  /** Autres coûts variables à l'unité (énergie, commission, ménage…) : la seule
   *  part figée du coût variable — elle n'est pas ajustée par le fournisseur. */
  otherVariableCostPerUnit: number;
  /** Le métier nomme lui-même ce qu'il achète : on ne vend pas des matières
   *  premières dans une salle de sport. */
  vocabulary: ScenarioVocabulary;
}) {
  const cr = result.incomeStatement;
  const b = result.balanceSheet;
  const pcr = precedent?.incomeStatement ?? null;
  const pb = precedent?.balanceSheet ?? null;
  // Coût variable unitaire RÉEL du tour, tel que le moteur l'a employé pour le
  // seuil et la marge sur coût variable : il intègre le choix de fournisseur.
  // On en déduit la part matière (total − autres) plutôt que de réafficher un
  // coût standard qui contredirait les totaux ci-dessus.
  const cvu = result.breakeven.unitVariableCost;
  const materialCostPerUnit = cvu - otherVariableCostPerUnit;
  const vendues = (r: CompanyRoundResult) =>
    Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0) +
    (r.extraOrders?.delivered ?? 0) +
    (r.extraOrders?.subcontracted ?? 0) +
    (r.orderOffer?.delivered ?? 0) +
    (r.subscription?.retained ?? 0);
  const soldUnits = vendues(result);
  const structureDe = (c: typeof cr) =>
    c.fixedCosts +
    c.marketingCost +
    c.qualityCost +
    c.maintenanceCost +
    (c.rdCost ?? 0) +
    c.depreciation;
  const structure = structureDe(cr);
  const placement = b.shortTermInvestment ?? 0;
  const actifDe = (bilan: typeof b) =>
    bilan.fixedAssetsNet +
    bilan.inventoryValue +
    bilan.receivables +
    bilan.cash +
    (bilan.shortTermInvestment ?? 0);
  const totalAssets = actifDe(b);
  const vat = b.vatLiability ?? 0;
  const passifDe = (bilan: typeof b) =>
    bilan.equity +
    bilan.financialDebt +
    bilan.payables +
    (bilan.vatLiability ?? 0) +
    bilan.overdraft;
  /** Une valeur optionnelle du tour précédent : absente, la colonne reste vide. */
  const avant = <T,>(lire: (p: CompanyRoundResult) => T): T | null =>
    precedent ? lire(precedent) : null;

  return (
    <section className="mt-4 space-y-2" aria-label="Vos comptes du tour">
      <p className="surtitre flex items-center gap-1.5">
        <Icone nom="document" className="h-3.5 w-3.5 text-slate-400" />
        Vos comptes du tour · lisez-les comme un dirigeant
      </p>

      <Panel title="Compte de résultat" defaultOpen resume={`résultat net ${euro(cr.netIncome)}`}>
        <LigneDeLecture lecture={lectureDuResultat(cr)} />
        <Etat periode={periode} legende="Compte de résultat du tour, en cascade.">
          <Ligne label="Chiffre d'affaires" valeur={cr.revenue} avant={pcr?.revenue ?? null} />
          {Math.abs(cr.productionStocked) > 0.5 ? (
            <Ligne
              label="Production stockée (± Δ stock)"
              valeur={cr.productionStocked}
              avant={pcr?.productionStocked ?? null}
              decalee
            />
          ) : null}
          <Ligne
            label="− Coût variable des ventes"
            valeur={-cr.cogs}
            avant={pcr ? -pcr.cogs : null}
            decalee
          />
          {/* La commission d'un canal partenaire se retranche ici, avec les
              autres charges de la vente : c'est la seule place d'où « la marge
              après commission » se lit sans la recalculer. La ligne n'apparaît
              que dans les secteurs qui vendent par un tiers. */}
          {(cr.commissionCost ?? 0) > 0.5 ? (
            <Ligne
              label="− Commissions des canaux partenaires"
              valeur={-(cr.commissionCost ?? 0)}
              avant={pcr?.commissionCost !== undefined ? -pcr.commissionCost : null}
              decalee
            />
          ) : null}
          <Ligne
            label="= Marge sur coût variable"
            valeur={cr.grossMargin}
            avant={pcr?.grossMargin ?? null}
            fort
          />
          <Ligne
            label="− Marketing"
            valeur={-cr.marketingCost}
            avant={pcr ? -pcr.marketingCost : null}
            decalee
          />
          <Ligne
            label="− Qualité"
            valeur={-cr.qualityCost}
            avant={pcr ? -pcr.qualityCost : null}
            decalee
          />
          <Ligne
            label="− Maintenance"
            valeur={-cr.maintenanceCost}
            avant={pcr ? -pcr.maintenanceCost : null}
            decalee
          />
          {(cr.rdCost ?? 0) > 0.5 ? (
            <Ligne
              label="− Recherche et développement"
              valeur={-(cr.rdCost ?? 0)}
              avant={pcr?.rdCost !== undefined ? -pcr.rdCost : null}
              decalee
            />
          ) : null}
          {(cr.engagementRse ?? 0) > 0.5 ? (
            <Ligne
              label="− Engagement RSE"
              valeur={-(cr.engagementRse ?? 0)}
              avant={pcr?.engagementRse !== undefined ? -pcr.engagementRse : null}
              decalee
            />
          ) : null}
          <Ligne
            label="− Charges de structure"
            valeur={-cr.fixedCosts}
            avant={pcr ? -pcr.fixedCosts : null}
            decalee
          />
          <Ligne
            label="= Excédent brut d'exploitation (EBE)"
            valeur={cr.ebitda}
            avant={pcr?.ebitda ?? null}
            fort
          />
          <Ligne
            label="− Dotations aux amortissements"
            valeur={-cr.depreciation}
            avant={pcr ? -pcr.depreciation : null}
            decalee
          />
          <Ligne
            label="= Résultat d'exploitation"
            valeur={cr.operatingIncome}
            avant={pcr?.operatingIncome ?? null}
            fort
          />
          <Ligne
            label="− Charges financières (intérêts, agios, mobilisations)"
            valeur={-cr.interest}
            avant={pcr ? -pcr.interest : null}
            decalee
          />
          {(cr.financialIncome ?? 0) > 0.5 ? (
            <Ligne
              label="+ Produits financiers (placement)"
              valeur={cr.financialIncome ?? 0}
              avant={pcr?.financialIncome ?? null}
              decalee
            />
          ) : null}
          {(cr.exceptionalCharge ?? 0) > 0.5 ? (
            <Ligne
              label="− Sanction RSE (exceptionnel)"
              valeur={-(cr.exceptionalCharge ?? 0)}
              avant={pcr?.exceptionalCharge !== undefined ? -pcr.exceptionalCharge : null}
              decalee
            />
          ) : null}
          {(cr.exceptionalIncome ?? 0) > 0.5 ? (
            <Ligne
              label="+ Éco-subvention RSE (exceptionnel)"
              valeur={cr.exceptionalIncome ?? 0}
              avant={pcr?.exceptionalIncome ?? null}
              decalee
            />
          ) : null}
          {(cr.rescueSubsidy ?? 0) > 0.5 ? (
            <Ligne
              label="+ Subvention exceptionnelle (sauvetage)"
              valeur={cr.rescueSubsidy ?? 0}
              avant={pcr?.rescueSubsidy ?? null}
              decalee
            />
          ) : null}
          {(cr.taxLossUsed ?? 0) > 0.5 ? (
            <Ligne
              label="dont déficit antérieur imputé (report)"
              valeur={cr.taxLossUsed ?? 0}
              avant={pcr?.taxLossUsed ?? null}
              decalee
            />
          ) : null}
          <Ligne
            label="− Impôt sur les sociétés"
            valeur={-cr.tax}
            avant={pcr ? -pcr.tax : null}
            decalee
          />
          <Ligne
            label="= RÉSULTAT NET"
            valeur={cr.netIncome}
            avant={pcr?.netIncome ?? null}
            fort
            tone={cr.netIncome >= 0 ? "good" : "bad"}
          />
        </Etat>
      </Panel>

      <Panel title="Bilan" resume={`total actif ${euro(totalAssets)}`}>
        <LigneDeLecture lecture={lectureDuBilan(b, result.functionalBalance)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-200">
              Actif
            </p>
            <Etat periode={periode} legende="Actif du bilan de clôture.">
              <Ligne
                label="Immobilisations nettes"
                valeur={b.fixedAssetsNet}
                avant={pb?.fixedAssetsNet ?? null}
              />
              <Ligne
                label="Stocks de produits finis"
                valeur={b.inventoryValue}
                avant={pb?.inventoryValue ?? null}
              />
              <Ligne
                label="Créances clients"
                valeur={b.receivables}
                avant={pb?.receivables ?? null}
              />
              {placement > 0.5 ? (
                <Ligne
                  label="Valeurs mobilières de placement"
                  valeur={placement}
                  avant={pb?.shortTermInvestment ?? null}
                />
              ) : null}
              <Ligne label="Disponibilités" valeur={b.cash} avant={pb?.cash ?? null} />
              <Ligne
                label="TOTAL ACTIF"
                valeur={totalAssets}
                avant={pb ? actifDe(pb) : null}
                fort
              />
            </Etat>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-200">
              Passif
            </p>
            <Etat periode={periode} legende="Passif du bilan de clôture.">
              <Ligne label="Capitaux propres" valeur={b.equity} avant={pb?.equity ?? null} />
              <Ligne
                label="Dettes financières"
                valeur={b.financialDebt}
                avant={pb?.financialDebt ?? null}
              />
              <Ligne label="Dettes fournisseurs" valeur={b.payables} avant={pb?.payables ?? null} />
              {Math.abs(vat) > 0.5 ? (
                <Ligne
                  label={vat >= 0 ? "TVA à décaisser" : "Crédit de TVA (−)"}
                  valeur={vat}
                  avant={pb?.vatLiability ?? null}
                />
              ) : null}
              {b.overdraft > 0.5 ? (
                <Ligne
                  label="Concours bancaires (découvert)"
                  valeur={b.overdraft}
                  avant={pb?.overdraft ?? null}
                  tone="bad"
                />
              ) : null}
              <Ligne
                label="TOTAL PASSIF"
                valeur={passifDe(b)}
                avant={pb ? passifDe(pb) : null}
                fort
              />
            </Etat>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {placement > 0.5 && b.overdraft > 0.5
            ? "Placement ET découvert : le second coûte bien plus que le premier ne rapporte. "
            : ""}
          Le bilan équilibre au centime, par construction. FRNG{" "}
          {euro(result.functionalBalance.frng)} − BFR {euro(result.functionalBalance.bfr)} ={" "}
          trésorerie nette {euro(result.functionalBalance.netTreasury)}.
        </p>
      </Panel>

      <Panel
        title="Analyse des coûts"
        resume={
          result.breakeven.breakEvenUnits != null
            ? `seuil ${Math.round(result.breakeven.breakEvenUnits).toLocaleString("fr-FR")} ${vocabulary.units}`
            : "seuil jamais atteint"
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-200">
              À l&apos;unité
            </p>
            {/* Pas d'écart ici : une décomposition unitaire n'est pas un état
                daté, et sa base change avec le mix d'un tour à l'autre. */}
            <Etat periode="Par unité" avecEcart={false} legende="Coût et marge à l'unité.">
              <Ligne
                label={vocabulary.materialLabel}
                valeur={materialCostPerUnit}
                avecEcart={false}
                decalee
              />
              <Ligne
                label={vocabulary.otherVariableLabel}
                valeur={otherVariableCostPerUnit}
                avecEcart={false}
                decalee
              />
              <Ligne label="= Coût variable unitaire" valeur={cvu} avecEcart={false} fort />
              {price !== null ? (
                <>
                  <Ligne label="Prix de vente" valeur={price} avecEcart={false} />
                  {/* La marge unitaire est un NIVEAU : elle s'écrit à l'encre.
                      Une marge négative reste visible — c'est le chiffre, signé,
                      qui le dit, et non une pastille. */}
                  <Ligne
                    label="= Marge sur coût variable / unité"
                    valeur={price - cvu}
                    avecEcart={false}
                    fort
                  />
                </>
              ) : null}
              {soldUnits > 0.5 ? (
                <Ligne
                  label="Coût complet unitaire (≈ variables + structure / vendues)"
                  valeur={cr.cogs / Math.max(1, soldUnits) + structure / soldUnits}
                  avecEcart={false}
                />
              ) : null}
            </Etat>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-200">
              Sur le tour
            </p>
            <Etat periode={periode} legende="Coûts du tour et seuil de rentabilité.">
              <Ligne
                label="Coûts variables"
                valeur={cr.cogs}
                avant={pcr?.cogs ?? null}
                texte={`${euro(cr.cogs)} (${cr.revenue > 0 ? pct(cr.cogs / cr.revenue) : "—"} du CA)`}
              />
              <Ligne
                label="Charges de structure (budgets et amortissements compris)"
                valeur={structure}
                avant={pcr ? structureDe(pcr) : null}
                texte={`${euro(structure)} (${cr.revenue > 0 ? pct(structure / cr.revenue) : "—"} du CA)`}
              />
              <Ligne
                label="Seuil de rentabilité"
                valeur={result.breakeven.breakEvenUnits ?? 0}
                avant={avant((p) => p.breakeven.breakEvenUnits) ?? null}
                format="units"
                texte={
                  result.breakeven.breakEvenUnits != null &&
                  result.breakeven.breakEvenRevenue != null
                    ? `${units(result.breakeven.breakEvenUnits)} u (${euro(result.breakeven.breakEvenRevenue)})`
                    : "seuil jamais atteint"
                }
                avecEcart={result.breakeven.breakEvenUnits != null}
                fort
              />
              <Ligne
                label="Marge de sécurité"
                valeur={result.breakeven.safetyMargin ?? 0}
                avant={avant((p) => p.breakeven.safetyMargin) ?? null}
                texte={
                  result.breakeven.safetyMargin != null ? euro(result.breakeven.safetyMargin) : "—"
                }
                avecEcart={result.breakeven.safetyMargin != null}
              />
              <Ligne
                label="Indice de sécurité"
                valeur={result.breakeven.safetyIndex ?? 0}
                format="percent"
                texte={
                  result.breakeven.safetyIndex != null ? pct(result.breakeven.safetyIndex) : "—"
                }
                avecEcart={false}
              />
            </Etat>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Chaque unité vendue au-dessus de son coût variable éponge les charges de structure ; le
          seuil dit combien il en faut.
        </p>
      </Panel>

      <Panel title="Budget de trésorerie" resume={`clôture ${euro(result.cashFlow.closing)}`}>
        <LigneDeLecture lecture={lectureDeLaTresorerie(result.cashFlow, CASH_LABELS)} />
        <Etat
          periode={periode}
          legende="Budget de trésorerie du tour, de l'ouverture à la clôture."
        >
          <Ligne
            label="Trésorerie d'ouverture"
            valeur={result.cashFlow.opening}
            avant={precedent?.cashFlow.opening ?? null}
            fort
          />
          {result.cashFlow.items.map((item) => (
            <Ligne
              key={item.label}
              label={CASH_LABELS[item.label] ?? item.label}
              valeur={item.amount}
              // Un poste que le tour précédent ne portait pas n'a pas de
              // référence : sa cellule reste vide.
              avant={precedent?.cashFlow.items.find((p) => p.label === item.label)?.amount ?? null}
              decalee
            />
          ))}
          <Ligne
            label="= Trésorerie de clôture"
            valeur={result.cashFlow.closing}
            avant={precedent?.cashFlow.closing ?? null}
            fort
            // La trésorerie ne prend le rouge qu'en découvert (charte) : un
            // niveau positif s'écrit à l'encre.
            {...(result.cashFlow.closing < 0 ? ({ tone: "bad" } as const) : {})}
          />
        </Etat>
        <p className="mt-2 text-xs text-slate-400">
          Le résultat est une opinion, la trésorerie un fait.
        </p>
      </Panel>
    </section>
  );
}
