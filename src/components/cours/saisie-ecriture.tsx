"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { lireMontant, montantEcrit, type LigneSaisie } from "@/pedagogy/cours/correcteur";
import { PLAN_DU_COURS, compteDuPlan } from "@/pedagogy/cours/plan-comptable";

/**
 * LA SAISIE D'UNE ÉCRITURE, COMME DANS UN JOURNAL.
 *
 * Une ligne par compte : le numéro, puis le montant au débit ou au crédit. Le
 * numéro se tape ou se choisit dans le plan de comptes du cours ; l'intitulé du
 * compte s'affiche dès qu'il est reconnu, pour que l'élève voie ce qu'il écrit.
 * Les totaux se font en direct : une écriture déséquilibrée se voit avant
 * d'être validée.
 */

const vide = (): LigneSaisie => ({ compte: "", debit: "", credit: "" });

export function SaisieEcriture({
  nombreDeLignes,
  depart,
  verrouillee,
  onValider,
}: {
  /** Combien de lignes proposer au départ : celles de l'écriture attendue. */
  nombreDeLignes: number;
  /** Des lignes déjà remplies (la correction, quand on la montre). */
  depart?: LigneSaisie[];
  verrouillee: boolean;
  onValider: (saisie: LigneSaisie[]) => void;
}) {
  const [lignes, setLignes] = useState<LigneSaisie[]>(
    () => depart ?? Array.from({ length: Math.max(2, nombreDeLignes) }, vide),
  );
  const changer = (i: number, champ: keyof LigneSaisie, valeur: string) =>
    setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, [champ]: valeur } : l)));
  const total = (champ: "debit" | "credit") =>
    lignes.reduce((s, l) => {
      const v = lireMontant(l[champ]);
      return s + (v !== null && !Number.isNaN(v) ? v : 0);
    }, 0);
  const td = Math.round(total("debit") * 100) / 100;
  const tc = Math.round(total("credit") * 100) / 100;

  return (
    <form
      className="grid gap-3"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!verrouillee) onValider(lignes);
      }}
      aria-label="Saisie de l'écriture"
    >
      <datalist id="plan-du-cours">
        {PLAN_DU_COURS.map((c) => (
          <option key={c.numero} value={c.numero}>
            {c.intitule}
          </option>
        ))}
      </datalist>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-etiquette text-slate-400">
              <th className="pb-1 pr-2 font-semibold">Compte</th>
              <th className="w-24 pb-1 pr-2 text-right font-semibold sm:w-32">Débit</th>
              <th className="w-24 pb-1 pr-2 text-right font-semibold sm:w-32">Crédit</th>
              <th className="w-8 pb-1" aria-label="Retirer" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => {
              const connu = compteDuPlan(l.compte);
              return (
                <tr key={i} className="align-top">
                  <td className="py-1 pr-2">
                    <input
                      className="champ w-full px-2.5 py-2 tabular-nums"
                      list="plan-du-cours"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label={`Compte, ligne ${i + 1}`}
                      value={l.compte}
                      disabled={verrouillee}
                      onChange={(e) => changer(i, "compte", e.target.value.replace(/[^0-9]/g, ""))}
                    />
                    <span className="mt-0.5 block min-h-4 text-xs text-slate-400">{connu?.intitule ?? ""}</span>
                  </td>
                  {(["debit", "credit"] as const).map((champ) => (
                    <td key={champ} className="py-1 pr-2">
                      <input
                        className="champ w-full px-2.5 py-2 text-right tabular-nums"
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={`${champ === "debit" ? "Débit" : "Crédit"}, ligne ${i + 1}`}
                        value={l[champ]}
                        disabled={verrouillee}
                        onChange={(e) => changer(i, champ, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="py-1">
                    {lignes.length > 2 && !verrouillee && (
                      <button
                        type="button"
                        className="min-h-10 px-1.5 text-slate-400 hover:text-slate-200"
                        aria-label={`Retirer la ligne ${i + 1}`}
                        onClick={() => setLignes((ls) => ls.filter((_, j) => j !== i))}
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td className="py-1.5 pr-2">Totaux</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{montantEcrit(td)}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{montantEcrit(tc)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {td !== tc && (td > 0 || tc > 0) && (
        <p className="text-sm text-slate-400" aria-live="polite">
          Pour l&apos;instant, le débit et le crédit ne sont pas égaux.
        </p>
      )}
      {!verrouillee && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={bouton({ taille: "m" })}>
            Valider l&apos;écriture
          </button>
          <button type="button" className={bouton({ variante: "lien", taille: "m" })} onClick={() => setLignes((ls) => [...ls, vide()])}>
            Ajouter une ligne
          </button>
        </div>
      )}
    </form>
  );
}
