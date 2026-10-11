import Link from "next/link";
import { bouton } from "@/components/bouton";
import { euros, type CarteDeTarif } from "@/config/catalogue";

/**
 * UNE CARTE D'OFFRE DE /tarifs. Le prix en grand, dans le condensé des chiffres ; « par an »
 * en petit ; la liste « Inclus » ; un bouton au pied (plein pour la seule offre mise en
 * avant). Sans état ni import serveur : /tarifs la rend, et l'aperçu de /admin/offres
 * (composant client) montre la même carte avant l'enregistrement.
 */
export function ListeInclus({ elements }: { elements: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {elements.map((x, i) => (
        <li
          key={`${i}-${x}`}
          className="relative pl-4 text-base leading-relaxed text-slate-300 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-slate-400"
        >
          {x}
        </li>
      ))}
    </ul>
  );
}

export function CarteDOffre({ offre, apercu = false }: { offre: CarteDeTarif; apercu?: boolean }) {
  const principal = offre.bouton.principal;
  const idDuTitre = `${apercu ? "apercu-" : ""}offre-${offre.code}`;
  return (
    <article
      data-offre={apercu ? undefined : offre.code}
      data-apercu-offre={apercu ? offre.code : undefined}
      aria-labelledby={idDuTitre}
      className={`carte flex flex-col p-6 ${principal ? "ring-1 ring-slate-300" : ""}`}
    >
      <h3 id={idDuTitre} className="text-xl font-semibold text-slate-50">
        {offre.nom}
      </h3>
      <p className="mt-1 text-sm leading-snug text-slate-400 xl:min-h-[5rem]">{offre.pourQui}</p>

      <div data-prix className="mt-5">
        {offre.prixCents !== null ? (
          <>
            <p className="flex h-12 items-end gap-2">
              <span className="font-display text-5xl font-bold leading-none tabular-nums text-slate-50">
                {euros(offre.prixCents)}
              </span>
              <span className="pb-1 text-base font-medium text-slate-300">par an</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Prix de référence, sur devis</p>
          </>
        ) : offre.tarif === "gratuit" ? (
          <>
            <p className="flex h-12 items-end">
              <span className="text-4xl font-bold leading-none text-slate-50">Gratuit</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Sans compte</p>
          </>
        ) : (
          <>
            <p className="flex h-12 items-end">
              <span className="text-4xl font-bold leading-none text-slate-50">Sur devis</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Sur mesure, établie au devis</p>
          </>
        )}
      </div>

      {offre.mention ? (
        <p className="mt-4 self-start rounded-full border border-[var(--filet-carte)] bg-[var(--voile-neutre)] px-3 py-1 text-sm font-semibold text-slate-100">
          {offre.mention}
        </p>
      ) : null}

      <p className="libelle mt-6">Inclus</p>
      <ListeInclus elements={offre.inclus} />

      <ul className="mt-4 space-y-1">
        {offre.precisions.map((p, i) => (
          <li key={`${i}-${p}`} className="text-sm leading-relaxed text-slate-400">
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={offre.bouton.href}
          className={`${bouton({ variante: principal ? "principal" : "secondaire", taille: "l" })} w-full`}
          {...(apercu ? { tabIndex: -1, "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
        >
          {offre.bouton.libelle}
        </Link>
      </div>
    </article>
  );
}
