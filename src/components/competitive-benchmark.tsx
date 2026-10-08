import { formatEuro, formatPercent } from "@/lib/format";
import { Embleme } from "@/components/embleme";
import { Tiroir } from "@/components/tiroir";
import type { GameView } from "@/services/game-view.service";
import { Icone } from "@/components/icone";

export function CompetitiveBenchmark({
  benchmark,
}: {
  benchmark: NonNullable<GameView["competitiveBenchmark"]>;
}) {
  const playerIdx = benchmark.competitivenessIndex;
  // Les caractères présents dans ce tableau, une seule fois chacun : deux
  // concurrents peuvent partager un profil, la légende n'a pas à le répéter.
  const styles = [
    ...new Map(
      benchmark.competitors
        .map((c) => c.style)
        .filter((st): st is NonNullable<typeof st> => st !== null)
        .map((st) => [st.label, st] as const),
    ).values(),
  ];
  const idxTone =
    playerIdx >= 1.05 ? "text-emerald-400" : playerIdx < 0.95 ? "text-red-400" : "text-slate-100";

  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400 sm:mb-3">
        <Icone nom="concurrence" className="h-3.5 w-3.5" />
        Benchmark concurrentiel
      </h3>

      {/*
        SUR TÉLÉPHONE, LE NOM ET LE CHIFFRE SUR UNE LIGNE, la phrase dessous. Côte à côte, le libellé
        tenait en trois lignes dans une colonne étroite, et le chiffre tombait sous lui.
      */}
      <div className="mb-3 rounded-lg border border-fuchsia-400/20 bg-fuchsia-950/20 px-3 py-2.5 sm:mb-4 sm:flex sm:items-baseline sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex items-baseline justify-between gap-3 sm:block">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Indice de compétitivité-prix
          </p>
          <p className={`text-2xl font-semibold tabular-nums ${idxTone}`}>
            {(playerIdx * 100).toFixed(0)}
          </p>
        </div>
        <p className="mt-0.5 text-sm leading-snug text-slate-400 sm:mt-0">
          {playerIdx >= 1.05
            ? "Votre prix est inférieur au marché : vous captez de la demande, mais marquez-vous assez ?"
            : playerIdx < 0.95
              ? "Votre prix dépasse le marché : vous marquez plus par unité, mais risquez d'en vendre moins."
              : "Votre prix est aligné sur le marché : la bataille se joue sur d'autres leviers."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-medium">Entreprise</th>
              <th className="pb-2 pr-3 text-right font-medium">Prix moyen</th>
              <th className="pb-2 pr-3 text-right font-medium">Part de marché</th>
              <th className="pb-2 text-right font-medium">Chiffre d&apos;affaires</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {benchmark.competitors.map((c) => (
              <tr
                key={c.name}
                className={`border-t border-white/5 ${c.isPlayer ? "ligne-moi font-semibold text-slate-100" : ""}`}
              >
                <td className="py-2 pr-3">
                  <Embleme
                    code={c.embleme}
                    className={`mr-1.5 h-3.5 w-3.5 ${c.isPlayer ? "text-slate-100" : "text-slate-400"}`}
                  />
                  {c.name}
                  {c.isPlayer ? (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">vous</span>
                  ) : null}
                  {/*
                    LE CARACTÈRE DU CONCURRENT, sous son nom. Le moteur donne à
                    chaque entreprise simulée un profil qui décide vraiment de
                    ses choix ; l'élève ne voyait qu'un nom et un prix, et ne
                    pouvait donc pas apprendre à LIRE un adversaire. Il paraît
                    après deux tours clos — avant, ce serait une fiche technique
                    plutôt qu'une observation — et jamais pour une équipe de la
                    classe, qui a des élèves et non un profil.
                  */}
                  {/*
                    L'étiquette seule ici : l'explication vit dans la légende,
                    sous le tableau. Une infobulle `title` ne s'ouvre pas sur un
                    téléphone, et la répéter dans les deux endroits ferait lire
                    deux fois la même phrase.
                  */}
                  {c.style ? (
                    <span className="mt-0.5 block text-xs text-slate-400">{c.style.label}</span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {c.avgPrice !== null ? formatEuro(c.avgPrice) : "—"}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatPercent(c.marketShare)}
                </td>
                <td className="py-2 text-right tabular-nums">{formatEuro(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-xs text-slate-400">
              <td className="pt-2 pr-3">Moyenne du marché</td>
              <td className="pt-2 pr-3 text-right tabular-nums">
                {benchmark.marketAvgPrice > 0 ? formatEuro(benchmark.marketAvgPrice) : "—"}
              </td>
              <td className="pt-2 pr-3" />
              <td className="pt-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/*
        CE QUE CHAQUE CARACTÈRE IMPLIQUE, une ligne par style présent. Le
        tableau porte l'étiquette ; sans cette légende, elle ne dirait rien à
        qui ne joue pas depuis dix ans, et une infobulle ne s'ouvre pas sur un
        téléphone.
      */}
      {/*
        LA LÉGENDE ET LA RÈGLE DE LECTURE, À LA DEMANDE. Elles faisaient sept lignes sous le
        tableau, lues une fois puis traînées à chaque tour : on les range dans un tiroir fermé,
        et le tableau, lui, reste à l'écran.
      */}
      <div className="mt-2">
        <Tiroir titre="Comment lire ce tableau" ferme>
          {styles.length > 0 ? (
            <ul className="mb-2 space-y-1">
              {styles.map((st) => (
                <li key={st.label} className="text-sm leading-snug text-slate-400">
                  <span className="font-semibold text-slate-300">{st.label}</span> · {st.aide}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm leading-relaxed text-slate-400">
            L&apos;indice de compétitivité-prix compare votre prix au marché : au-dessus de
            100, vous êtes moins cher ; en dessous, plus cher. Le prix n&apos;est qu&apos;un levier
            parmi d&apos;autres : marketing, qualité et stock font le reste.
          </p>
        </Tiroir>
      </div>
    </section>
  );
}
