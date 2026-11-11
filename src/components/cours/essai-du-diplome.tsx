import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import type { EssaiDuDiplome as Essai } from "@/config/cours/chapitres-libres";
import { dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import type { Chapitre } from "@/config/cours/types";

/**
 * L'ESSAI D'UN DIPLÔME, EN TÊTE DE SA PAGE (décision du propriétaire, novembre 2026 ; audit du
 * 10 novembre, produit P1-1). Le chapitre libre du diplôme, celui de la liste choisie le 11 novembre
 * (config/cours/chapitres-libres.ts), et son cas pratique dédié, qui s'ouvrent l'un et l'autre sans
 * compte. Le chapitre n'est plus forcément le premier du parcours : l'encart ne le dit plus. Sur la page /parcours/<formation> et dans la vue du diplôme de /cours, sous le nom du
 * diplôme : l'encart est court, pour se lire sans défiler sur un téléphone.
 *
 * La page donne ses liens (`lien`) : ils portent le diplôme (`diplome=`), comme les autres liens de
 * la page, pour que le chapitre montre les compétences de ce diplôme
 * (config/cours/competences-affichees.ts).
 */
export function EssaiDuDiplome({
  essai,
  lien,
  className = "",
}: {
  essai: Essai;
  lien: (contenu: Chapitre) => string;
  className?: string;
}) {
  const { diplome, chapitre, cas } = essai;
  const titre = `essai-du-diplome-${diplome.code}`;
  return (
    <aside
      aria-labelledby={titre}
      data-essai-du-diplome={diplome.code}
      className={`grid gap-1.5 rounded-xl border border-amber-400/30 bg-slate-900 px-4 py-3 ${className}`}
    >
      <p id={titre} className="text-xs font-semibold uppercase tracking-etiquette text-amber-300">
        Pour essayer, sans compte · {diplome.sigle}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <Link
          href={lien(chapitre)}
          data-chapitre-libre={chapitre.code}
          className="text-lg font-semibold text-slate-50 underline underline-offset-4 hover:text-amber-300"
        >
          {chapitre.titre}
        </Link>
        <span className="text-xs tabular-nums text-slate-400">{dureeEnClair(dureeDuChapitre(chapitre))}</span>
      </p>
      <p className="text-sm leading-relaxed text-slate-300">
        Un chapitre de ce parcours, à son niveau et dans son métier.
        {cas ? (
          <>
            {" "}
            Son cas pratique s&apos;ouvre aussi sans compte :{" "}
            <Link href={lien(cas)} data-cas-libre={cas.code} className={LIEN_A_L_ENCRE}>
              {cas.titre}
            </Link>
            .
          </>
        ) : null}
      </p>
    </aside>
  );
}
