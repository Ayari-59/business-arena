import { OBJECTIF_CA, type TableauDeBord } from "@/engine/episodes/trimestre-qui-derape";
import { kE, nombre, taux } from "./format-episode";

/**
 * LE TABLEAU DE BORD DE CLAIRE.
 *
 * Cinq chiffres, ceux que son directeur regarde. Après une décision, chacun
 * porte l'écart avec la lecture précédente, coloré selon le sens qui est bon
 * pour l'agence : un délai de paiement qui MONTE est une mauvaise nouvelle,
 * un chiffre d'affaires qui monte une bonne. Le signe et le mot disent le
 * sens ; la couleur ne fait que le confirmer.
 */
function Ecart({
  apres,
  avant,
  format,
  sensBon,
}: {
  apres: number | null;
  avant: number | null | undefined;
  format: (v: number) => string;
  sensBon: 1 | -1;
}) {
  if (avant == null || apres == null) return null;
  const d = apres - avant;
  if (Math.abs(d) < 1e-9) return null;
  const bon = sensBon * d > 0;
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        bon ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
      }`}
    >
      {d > 0 ? "+" : "−"}
      {format(Math.abs(d))}
    </span>
  );
}

function Indicateur({
  nom,
  valeur,
  ecart,
  aide,
  children,
}: {
  nom: string;
  valeur: string;
  ecart?: React.ReactNode;
  aide: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-400">{nom}</dt>
      <dd className="mt-0.5 flex flex-wrap items-baseline">
        <span className="font-display text-xl font-semibold tabular-nums text-slate-50">
          {valeur}
        </span>
        {ecart}
      </dd>
      <dd className="mt-0.5 text-xs text-slate-400">{aide}</dd>
      {children}
    </div>
  );
}

export function TableauDeLAgence({
  semaine,
  t,
  avant,
}: {
  semaine: number;
  t: TableauDeBord;
  avant: TableauDeBord | null;
}) {
  const enRetard = t.cible > 0 && t.ca < t.cible;
  const points = (v: number) => `${nombre(v * 100)} pt`;
  return (
    <section aria-labelledby="tableau-titre" className="carte p-4 sm:p-5">
      <h2
        id="tableau-titre"
        className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
      >
        Votre agence · {semaine ? `fin de semaine ${semaine}` : "aujourd'hui"}
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-1 lg:gap-y-4">
        <Indicateur
          nom="Chiffre d'affaires"
          valeur={kE(t.ca)}
          ecart={<Ecart apres={t.ca} avant={avant?.ca} format={kE} sensBon={1} />}
          aide={
            semaine
              ? `objectif à date ${kE(t.cible)}`
              : `objectif ${kE(OBJECTIF_CA)} en 13 semaines`
          }
        >
          {semaine > 0 && (
            <dd
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800"
              aria-label={enRetard ? "en retard sur l'objectif" : "à l'objectif"}
            >
              <span
                className={`block h-full rounded-full ${enRetard ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${Math.min(100, (100 * t.ca) / t.cible)}%` }}
              />
            </dd>
          )}
        </Indicateur>
        <Indicateur
          nom="Marge brute"
          valeur={t.marge == null ? "—" : taux(t.marge)}
          ecart={<Ecart apres={t.marge} avant={avant?.marge} format={points} sensBon={1} />}
          aide="mandat : 30 % au moins"
        />
        <Indicateur
          nom="Transformation des devis"
          valeur={taux(t.transfo)}
          ecart={<Ecart apres={t.transfo} avant={avant?.transfo} format={points} sensBon={1} />}
          aide={semaine ? `semaine ${semaine}` : "semaine dernière ; 38 % il y a un mois"}
        />
        <Indicateur
          nom="Délai de paiement"
          valeur={`${nombre(t.dso, 0)} j`}
          ecart={
            <Ecart
              apres={t.dso}
              avant={avant?.dso}
              format={(v) => `${nombre(v, 0)} j`}
              sensBon={-1}
            />
          }
          aide="au-delà de 55 j : 1 500 € par jour"
        />
        <Indicateur
          nom="Remises accordées"
          valeur={kE(t.remises)}
          ecart={<Ecart apres={t.remises} avant={avant?.remises} format={kE} sensBon={-1} />}
          aide="budget du trimestre : 40 k€"
        />
      </dl>
    </section>
  );
}
