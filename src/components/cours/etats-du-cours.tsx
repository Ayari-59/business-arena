import { montantEcrit } from "@/pedagogy/cours/correcteur";
import { bilan, compteDeResultat, mouvements, tvaNette, type Ecriture, type LigneDEtat } from "@/pedagogy/cours/etats";
import { intituleDe } from "@/pedagogy/cours/plan-comptable";
import type { Vue } from "@/config/cours/types";

/**
 * CE QUE LA SIMULATION MONTRE APRÈS CHAQUE ÉTAPE : LES ÉTATS DE L'ENTREPRISE.
 *
 * Le bilan, le compte de résultat, les comptes de TVA, le compte de banque en T et
 * le journal se calculent tous du même journal (`pedagogy/cours/etats.ts`). Une
 * ligne que la dernière écriture a fait bouger se signale : c'est elle qu'il faut
 * regarder, et l'œil la trouve sans lire tout le tableau.
 */

const m = (x: number) => montantEcrit(x);

function Colonne({
  titre,
  lignes,
  total,
  libelleTotal,
  avant,
}: {
  titre: string;
  lignes: LigneDEtat[];
  total: number;
  libelleTotal: string;
  avant?: LigneDEtat[];
}) {
  const bouge = (l: LigneDEtat) => avant !== undefined && avant.find((a) => a.libelle === l.libelle)?.montant !== l.montant;
  return (
    <div className="min-w-0">
      <p className="border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-etiquette text-slate-400">{titre}</p>
      <table className="w-full text-sm">
        <tbody>
          {lignes.length === 0 && (
            <tr>
              <td className="py-1.5 text-slate-400" colSpan={2}>
                Rien encore
              </td>
            </tr>
          )}
          {lignes.map((l) => (
            <tr key={l.libelle} data-bouge={bouge(l) || undefined} className={bouge(l) ? "font-semibold" : ""}>
              <td className="py-1.5 pr-2">
                {l.libelle}
                {bouge(l) && <span className="ml-1.5 text-xs font-semibold uppercase tracking-etiquette text-slate-400">a bougé</span>}
              </td>
              <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{m(l.montant)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-300 font-semibold">
            <td className="py-1.5 pr-2">{libelleTotal}</td>
            <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{m(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function VueBilan({ soldes, avant, titre = "Bilan" }: { soldes: Record<string, number>; avant?: Record<string, number>; titre?: string }) {
  const b = bilan(soldes);
  const a = avant ? bilan(avant) : undefined;
  return (
    <figure className="grid gap-2" aria-label={titre}>
      <figcaption className="text-sm font-semibold">{titre}</figcaption>
      <div className="grid gap-4 sm:grid-cols-2">
        <Colonne titre="Actif : ce que l'entreprise possède" lignes={b.actif} total={b.totalActif} libelleTotal="Total de l'actif" avant={a?.actif} />
        <Colonne titre="Passif : d'où viennent les ressources" lignes={b.passif} total={b.totalPassif} libelleTotal="Total du passif" avant={a?.passif} />
      </div>
    </figure>
  );
}

export function VueResultat({ soldes, avant }: { soldes: Record<string, number>; avant?: Record<string, number> }) {
  const cr = compteDeResultat(soldes);
  const a = avant ? compteDeResultat(avant) : undefined;
  return (
    <figure className="grid gap-2" aria-label="Compte de résultat">
      <figcaption className="text-sm font-semibold">Compte de résultat de janvier</figcaption>
      <div className="grid gap-4 sm:grid-cols-2">
        <Colonne titre="Charges" lignes={cr.charges} total={cr.totalCharges} libelleTotal="Total des charges" avant={a?.charges} />
        <Colonne titre="Produits" lignes={cr.produits} total={cr.totalProduits} libelleTotal="Total des produits" avant={a?.produits} />
      </div>
      <p className="flex items-baseline justify-between rounded-lg border border-slate-300 px-3 py-2 font-semibold">
        <span>{cr.resultat >= 0 ? "Résultat : bénéfice" : "Résultat : perte"}</span>
        <span className="whitespace-nowrap tabular-nums">{m(cr.resultat)}</span>
      </p>
    </figure>
  );
}

export function VueTva({ soldes }: { soldes: Record<string, number> }) {
  const comptes = ["44571", "44562", "44566"].filter((c) => soldes[c]);
  const t = tvaNette(soldes);
  return (
    <figure className="grid gap-2" aria-label="TVA du mois">
      <figcaption className="text-sm font-semibold">La TVA de janvier</figcaption>
      <table className="w-full text-sm">
        <tbody>
          {comptes.map((c) => (
            <tr key={c}>
              <td className="py-1.5 pr-2">
                {c} {intituleDe(c)}
              </td>
              <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{c === "44571" ? m(-soldes[c]!) : `${"−"} ${m(soldes[c]!)}`}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-300 font-semibold">
            <td className="py-1.5 pr-2">{t >= 0 ? "TVA due à l'État" : "Crédit de TVA : l'État doit à l'entreprise"}</td>
            <td className="whitespace-nowrap py-1.5 text-right tabular-nums">{m(Math.abs(t))}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}

/** Un compte du grand livre, dessiné en T : le débit à gauche, le crédit à droite. */
export function CompteEnT({ journal, compte }: { journal: readonly Ecriture[]; compte: string }) {
  const lignes = mouvements(journal, compte);
  const debit = lignes.filter((l) => l.debit > 0);
  const credit = lignes.filter((l) => l.credit > 0);
  const solde = lignes.reduce((s, l) => s + l.debit - l.credit, 0);
  const cote = (ls: typeof lignes, champ: "debit" | "credit") => (
    <ul className="grid gap-1 text-sm">
      {ls.map((l, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span className="truncate text-slate-400">{l.date}</span>
          <span className="tabular-nums">{m(l[champ])}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <figure className="grid gap-2" aria-label={`Compte ${compte} en T`}>
      <figcaption className="text-sm font-semibold">
        Grand livre : {compte} {intituleDe(compte)}
      </figcaption>
      <div className="grid grid-cols-2 border-t-2 border-slate-400">
        <div className="border-r-2 border-slate-400 py-2 pr-3">
          <p className="mb-1 text-xs uppercase tracking-etiquette text-slate-400">Débit</p>
          {cote(debit, "debit")}
        </div>
        <div className="py-2 pl-3">
          <p className="mb-1 text-xs uppercase tracking-etiquette text-slate-400">Crédit</p>
          {cote(credit, "credit")}
        </div>
      </div>
      <p className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-semibold">
        <span>Solde {solde >= 0 ? "débiteur" : "créditeur"}</span>
        <span className="tabular-nums">{m(Math.abs(solde))}</span>
      </p>
    </figure>
  );
}

/** Le journal tenu jusque-là, écriture par écriture. */
export function Journal({ journal }: { journal: readonly Ecriture[] }) {
  if (journal.length === 0) return <p className="text-sm text-slate-400">Le journal est vide : rien n&apos;est encore passé.</p>;
  return (
    <ol className="grid gap-3" aria-label="Journal">
      {journal.map((e, i) => (
        <li key={i} className="grid gap-1">
          <p className="flex flex-wrap justify-between gap-x-2 text-xs text-slate-400">
            <span>{e.date}</span>
            <span>{e.libelle}</span>
          </p>
          <table className="w-full text-xs">
            <tbody>
              {e.lignes.map((l, j) => (
                <tr key={j}>
                  <td className={`py-0.5 pr-2 ${l.credit > 0 ? "pl-4" : ""}`}>
                    <span className="tabular-nums font-semibold">{l.compte}</span> {intituleDe(l.compte)}
                  </td>
                  <td className="w-20 py-0.5 text-right tabular-nums">{l.debit > 0 ? m(l.debit) : ""}</td>
                  <td className="w-20 py-0.5 text-right tabular-nums">{l.credit > 0 ? m(l.credit) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </li>
      ))}
    </ol>
  );
}

/** La vue qu'une étape montre une fois réussie. */
export function VueDEtape({
  vue,
  journal,
  soldes,
  avant,
}: {
  vue: Vue;
  journal: readonly Ecriture[];
  soldes: Record<string, number>;
  avant?: Record<string, number>;
}) {
  switch (vue) {
    case "bilan":
      return <VueBilan soldes={soldes} avant={avant} />;
    case "resultat":
      return <VueResultat soldes={soldes} avant={avant} />;
    case "bilan-et-resultat":
      return (
        <div className="grid gap-6">
          <VueResultat soldes={soldes} avant={avant} />
          <VueBilan soldes={soldes} avant={avant} />
        </div>
      );
    case "tva":
      return <VueTva soldes={soldes} />;
    case "grand-livre":
      return <CompteEnT journal={journal} compte="512" />;
  }
}
