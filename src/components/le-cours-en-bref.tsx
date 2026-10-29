import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { leCoursEnChiffres } from "@/config/articulation";

/**
 * LE COURS, EN UN ENCART, SUR LES PAGES DES PUBLICS (audit produit du 28 octobre 2026, P1-2).
 *
 * Posé DANS une bande existante, pas en bande à lui : l'ordre des bandes et leurs
 * contre-jours se règlent dans config/bandes.ts, et un encart n'a pas à les déplacer.
 * Les nombres viennent de `leCoursEnChiffres`, comptés dans les registres.
 */
export function LeCoursEnBref({ className = "" }: { className?: string }) {
  const n = leCoursEnChiffres();
  // « chaque chapitre » seulement quand c'est vrai ; sinon le compte.
  const laboratoire =
    n.avecLaboratoire === n.chapitres
      ? "chacun avec son laboratoire"
      : `dont ${n.avecLaboratoire} avec leur laboratoire`;
  return (
    <section aria-labelledby="le-cours-en-bref" data-le-cours-en-bref="" className={`carte grid gap-3 p-6 ${className}`}>
      <h2 id="le-cours-en-bref" className="text-xl font-semibold text-slate-50">
        Aussi : le cours de gestion par la simulation
      </h2>
      <p className="text-base leading-relaxed text-slate-300">
        {n.chapitres} chapitres guidés pas à pas sur les chiffres d&apos;une entreprise de l&apos;arène, {laboratoire} :
        des curseurs et des leviers dont l&apos;élève voit l&apos;effet en direct. {n.casPratiques} cas pratiques pour
        vérifier sans guide, sur les référentiels de {n.formations} formations. Il se prend seul, sans partie
        d&apos;arène.
      </p>
      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link href="/cours" className={LIEN_A_L_ENCRE}>
          Le catalogue et le filtre par diplôme
        </Link>
        <Link href={n.libre.href} className={LIEN_A_L_ENCRE} data-essai-gratuit="">
          Essayer le chapitre libre, sans compte
        </Link>
      </p>
    </section>
  );
}
