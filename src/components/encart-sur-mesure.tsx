import Link from "next/link";
import { SUR_MESURE } from "@/config/sur-mesure";
import { LIBELLE_DU_DEVIS } from "@/config/tarifs";
import { bouton } from "@/components/bouton";

/**
 * L'ENCART DES SITUATIONS SUR MESURE.
 *
 * Le même bloc sur la page des ateliers et sur celle des parcours : le titre,
 * la promesse, ce qu'on demande, ce qu'on livre, le délai, et les deux gestes
 * qui existent, le rendez-vous et le devis. Tout le texte vient de
 * config/sur-mesure.ts ; rien n'est écrit ici, pour que l'encart et la grille
 * des offres disent la même chose.
 */
export function EncartSurMesure({ className = "" }: { className?: string }) {
  return (
    <section
      data-sur-mesure=""
      aria-labelledby="sur-mesure-titre"
      className={`carte p-6 sm:p-8 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-surtitre text-amber-300">
        Sur mesure
      </p>
      <h2 id="sur-mesure-titre" className="mt-2 text-xl font-bold text-slate-50">
        {SUR_MESURE.titre}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300">
        {SUR_MESURE.promesse}
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {[SUR_MESURE.demande, SUR_MESURE.livre].map((bloc) => (
          <div key={bloc.titre}>
            <h3 className="text-sm font-semibold text-slate-100">{bloc.titre}</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-400">
              {bloc.points.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-slate-400">
        <strong className="font-semibold text-slate-200">{SUR_MESURE.delai.titre}.</strong>{" "}
        {SUR_MESURE.delai.texte}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={SUR_MESURE.appel.rendezVous.href} className={bouton()}>
          {SUR_MESURE.appel.rendezVous.libelle}
        </Link>
        <Link
          href={SUR_MESURE.appel.devis.href}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/50"
        >
          {LIBELLE_DU_DEVIS}
        </Link>
      </div>
    </section>
  );
}

/**
 * LA MÊME PROMESSE EN UN PARAGRAPHE, pour les pages qui ne font que la
 * mentionner (les écoles, les enseignants) et renvoient à l'encart entier.
 */
export function ParagrapheSurMesure({ className = "" }: { className?: string }) {
  return (
    <p data-sur-mesure-paragraphe="" className={className}>
      <strong className="font-semibold text-slate-200">{SUR_MESURE.titre}.</strong>{" "}
      {SUR_MESURE.promesse}{" "}
      <Link
        href={SUR_MESURE.appel.rendezVous.href}
        className="font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        {SUR_MESURE.appel.rendezVous.libelle}
      </Link>
      {" · "}
      <Link
        href={SUR_MESURE.appel.devis.href}
        className="font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        {LIBELLE_DU_DEVIS}
      </Link>
    </p>
  );
}
