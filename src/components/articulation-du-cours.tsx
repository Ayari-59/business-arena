import Link from "next/link";
import { ENCHAINEMENT, briques } from "@/config/articulation";

/**
 * LES QUATRE BRIQUES, DANS L'ORDRE OÙ ELLES S'ENCHAÎNENT.
 *
 * Les trois premières se suivent (apprendre, s'entraîner, décider dans la
 * durée) ; l'épisode se joue à côté, à n'importe quel moment, et la flèche le
 * dit. Sur un téléphone, les briques s'empilent et la flèche descend. Tout le
 * texte vient de config/articulation.ts.
 */
export function ArticulationDuCours({ titreId = "articulation" }: { titreId?: string }) {
  const [cours, situations, arene, episodes] = briques();
  const carte = (b: NonNullable<typeof cours>) => (
    <li key={b.code} data-brique={b.code} className="carte grid content-start gap-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-etiquette text-amber-300">{b.geste}</p>
      <p className="font-semibold text-slate-100">{b.nom}</p>
      <p className="text-sm leading-relaxed text-slate-300">{b.texte}</p>
      <p className="text-xs text-slate-400">
        {b.forme} · {b.compte}
      </p>
      <Link href={b.lien.href} className="text-sm text-amber-300 underline-offset-4 hover:underline">
        {b.lien.libelle}
      </Link>
    </li>
  );
  const fleche = (cle: string) => (
    <li key={cle} aria-hidden className="self-center justify-self-center text-xl text-amber-400/80">
      <span className="md:hidden">↓</span>
      <span className="max-md:hidden">→</span>
    </li>
  );
  return (
    <section aria-labelledby={titreId} data-articulation="" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id={titreId} className="text-2xl font-bold text-slate-50">
          Cours, cas pratiques, arène, épisodes : comment ils s&apos;enchaînent
        </h2>
        <p className="max-w-3xl text-base text-slate-300">{ENCHAINEMENT[0]}</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {carte(cours!)}
        {fleche("f1")}
        {carte(situations!)}
        {fleche("f2")}
        {carte(arene!)}
      </ol>
      <ul className="grid gap-3 md:grid-cols-[1fr_2fr] md:items-center">
        {carte(episodes!)}
        <li className="text-sm leading-relaxed text-slate-400">
          <p>{ENCHAINEMENT[1]}</p>
          <p className="mt-2">{ENCHAINEMENT[2]}</p>
        </li>
      </ul>
    </section>
  );
}
