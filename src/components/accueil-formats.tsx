import Link from "next/link";
import { Bande } from "@/components/bande";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { briques } from "@/config/articulation";

/**
 * LES QUATRE FORMATS, SUR L'ACCUEIL (audit d'octobre 2026).
 *
 * L'accueil ne parlait que de l'arène : le cours n'y avait aucun lien, et la
 * carte d'épisode posée à côté du classement d'une partie laissait croire à un
 * seul produit. Cette bande nomme les quatre formats, dit ce que l'élève y
 * fait, combien il y en a et sous quelle forme, et donne à chacun sa porte :
 * la page qui le présente, et ce qui s'ouvre sans licence quand il y en a une.
 *
 * Chaque format se prend seul : c'est la première phrase, parce qu'un
 * enseignant qui veut un chapitre ne doit pas croire qu'il lui faut le business
 * game. Tout le texte vient de config/articulation.ts, comme la carte du cours,
 * et les comptes se lisent dans les registres.
 */
export function LesQuatreFormats({ contraste }: { contraste: boolean }) {
  return (
    <Bande
      id="accueil.formats"
      contraste={contraste}
      interieur="mx-auto max-w-6xl px-6 py-14 lg:py-20"
      labelledby="les-formats"
    >
      <div id="formats" className="grid scroll-mt-24 gap-3">
        <h2 id="les-formats" className="surtitre flex items-center gap-3">
          <span aria-hidden className="h-px w-8 bg-slate-400" />
          Quatre formats, à prendre seuls ou ensemble
        </h2>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          Un chapitre pour apprendre une notion, un cas pratique pour la vérifier, une partie de l&apos;arène pour piloter
          une entreprise dans la durée, un épisode manager pour décider en situation. Chacun tient seul ; ensemble, ils
          s&apos;enchaînent.
        </p>
      </div>
      <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" data-formats-de-l-accueil="">
        {briques().map((b) => (
          <li key={b.code} data-format={b.code} className="grid content-start gap-2 border-t border-white/15 pt-4">
            <p className="text-sm font-semibold text-slate-400">{b.geste}</p>
            <h3 className="text-lg font-semibold text-slate-50">{b.nom}</h3>
            <p className="text-sm leading-relaxed text-slate-300">{b.texte}</p>
            <p className="text-xs tabular-nums text-slate-400">
              {b.forme} · {b.compte}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link href={b.lien.href} className={LIEN_A_L_ENCRE}>
                {b.lien.libelle}
              </Link>
              {b.essai ? (
                <Link href={b.essai.href} className={LIEN_A_L_ENCRE} data-essai-gratuit="">
                  Essayer : {b.essai.libelle.charAt(0).toLowerCase() + b.essai.libelle.slice(1)}
                </Link>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </Bande>
  );
}
