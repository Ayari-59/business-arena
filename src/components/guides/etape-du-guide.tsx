import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import {
  LARGEUR_REDUITE,
  hauteurReduite,
  imageDeLaCapture,
  type EtapeDuGuide,
  type PublicDuGuide,
} from "@/config/guides";

/**
 * UNE ÉTAPE D'UN GUIDE : son numéro, son titre, la capture réelle et ses repères, puis ce
 * qu'on fait, ce qu'on voit, et l'erreur fréquente.
 *
 * Les repères sont dessinés SUR la capture par le script qui la photographie (un cadre
 * fin et un numéro, rien de criard) ; la légende numérotée, sous l'image, dit ce que
 * chacun montre. La figure ne se coupe pas d'une page à l'autre à l'impression.
 *
 * Les textes arrivent déjà résolus (jetons remplacés) depuis la page.
 */
export function EtapeDuGuideRendue({
  numero,
  etape,
  publicDuGuide,
}: {
  numero: number;
  etape: EtapeDuGuide;
  publicDuGuide: PublicDuGuide;
}) {
  const c = etape.capture;
  return (
    <li
      id={etape.id}
      data-etape-du-guide={etape.id}
      className={`carte etape-du-guide scroll-mt-24 p-5 sm:p-7 ${etape.sautDePage ? "saut-de-page" : ""}`}
    >
      <h2 className="flex items-baseline gap-3 text-xl font-bold text-slate-50 sm:text-2xl">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-400 text-base font-semibold text-slate-200"
        >
          {numero}
        </span>
        <span>
          <span className="sr-only">Étape {numero} : </span>
          {etape.titre}
        </span>
      </h2>

      <figure className="capture-du-guide mt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- capture déjà réduite et compressée (deux tailles, webp) : l'optimiseur la recompresserait. */}
        <img
          src={imageDeLaCapture(publicDuGuide, c)}
          srcSet={`${imageDeLaCapture(publicDuGuide, c, true)} ${LARGEUR_REDUITE}w, ${imageDeLaCapture(publicDuGuide, c)} ${c.largeur}w`}
          sizes="(max-width: 896px) 100vw, 848px"
          width={c.largeur}
          height={c.hauteur}
          alt={c.alt}
          loading={numero <= 1 ? "eager" : "lazy"}
          decoding="async"
          data-capture={`${publicDuGuide}/${c.fichier}`}
          data-hauteur-reduite={hauteurReduite(c)}
          className="h-auto w-full rounded-lg border border-white/10"
        />
        {c.reperes.length > 0 ? (
          <figcaption className="mt-3">
            <ol className="grid gap-1.5 text-base text-slate-300">
              {c.reperes.map((r, i) => (
                <li key={r.cible} className="flex items-baseline gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-100"
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="sr-only">Repère {i + 1} : </span>
                    {r.legende}
                  </span>
                </li>
              ))}
            </ol>
          </figcaption>
        ) : null}
      </figure>

      <div className="mt-6 grid gap-5 text-base leading-relaxed text-slate-300">
        <div>
          <h3 className="surtitre text-slate-400">Ce que vous faites</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-6">
            {etape.faire.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="surtitre text-slate-400">Ce que vous voyez</h3>
          <p className="mt-2">{etape.voir}</p>
        </div>
        <div className="rounded-lg encadre-neutre px-4 py-3">
          <h3 className="surtitre text-slate-400">L&apos;erreur fréquente</h3>
          <p className="mt-1.5 text-slate-200">{etape.erreur}</p>
        </div>
        {etape.lien ? (
          <p>
            <Link href={etape.lien.href} className={LIEN_A_L_ENCRE}>
              {etape.lien.libelle}
            </Link>
          </p>
        ) : null}
      </div>
    </li>
  );
}
