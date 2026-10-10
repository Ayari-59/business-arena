import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { FAMILLES, SECTEURS } from "@/config/episodes/familles";
import { FICHES, type FicheEnseignant } from "@/config/episodes/fiches";
import { formationParCode } from "@/config/formations";
import { episodeParCode } from "@/pedagogy/episodes/registre";

export const metadata: Metadata = {
  alternates: { canonical: "/enseignants/episodes" },
  title: "Épisodes en classe",
  description:
    "Des épisodes de contrôle de gestion, de finance et de stratégie à jouer en une séance : la notion du cours est le piège de la décision, et le calcul de la semaine 1 se corrige comme un exercice.",
  robots: { index: false, follow: false },
};

/**
 * LES ÉPISODES EN CLASSE.
 *
 * Les fiches enseignant, rangées par secteur puis par famille d'épisodes,
 * comme la page des épisodes ; un secteur sans fiche ne s'affiche pas. Une fiche dit ce que
 * l'épisode enseigne, comment conduire la séance de deux heures, le corrigé
 * du calcul et les questions du débrief.
 */
export default function EpisodesEnClassePage() {
  const familles = FAMILLES.map((f) => ({
    ...f,
    fiches: FICHES.filter((x) => f.episodes.includes(x.code)),
  })).filter((f) => f.fiches.length > 0);
  const secteurs = SECTEURS.map((s) => ({
    ...s,
    familles: familles.filter((f) => f.secteur === s.code),
  })).filter((s) => s.familles.length > 0);
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/enseignants" className="hover:text-slate-300">
              Enseignants
            </Link>{" "}
            / Épisodes en classe
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Une notion, un trimestre, une séance
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Chaque épisode met l&apos;élève à la place d&apos;un responsable qui doit décider, et la
            notion du cours y est le piège de la décision : on retient mieux le coût marginal après
            avoir refusé une commande rentable. Toute la classe joue le même trimestre, sous les
            mêmes aléas ; la séance tient en deux heures, débrief compris. Les épisodes se jouent
            sans compte, et aucun résultat n&apos;y est noté : le bilan juge les décisions.
          </p>
          {secteurs.map((s) => (
            <section key={s.code} aria-labelledby={`titre-secteur-${s.code}`} className="mt-16">
              <h2
                id={`titre-secteur-${s.code}`}
                className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl"
              >
                {s.nom}
              </h2>
              <p className="mt-2 max-w-2xl text-lg leading-relaxed text-slate-400">{s.texte}</p>
              {s.familles.map((f) => (
                <section key={f.code} aria-labelledby={`titre-${f.code}`} className="mt-12">
                  <h3
                    id={`titre-${f.code}`}
                    className="text-2xl font-semibold tracking-tight text-slate-50"
                  >
                    {f.titre}
                  </h3>
                  <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {f.fiches.map((fiche) => (
                      <CarteFiche key={fiche.code} fiche={fiche} />
                    ))}
                  </ul>
                </section>
              ))}
            </section>
          ))}
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

function CarteFiche({ fiche }: { fiche: FicheEnseignant }) {
  const ep = episodeParCode(fiche.code);
  if (!ep) return null;
  const sigles = fiche.formations.map((c) => formationParCode(c)?.sigle ?? c).join(" · ");
  return (
    <li className="carte flex flex-col gap-4 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Épisode {ep.numero} · {sigles}
        </p>
        <h4 className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</h4>
        <p className="mt-2 text-base leading-relaxed text-slate-300">{ep.resume}</p>
      </div>
      <p className="text-sm text-slate-400">
        {fiche.dureeMinutes / 60} h · {fiche.programme.join(" ; ")}
      </p>
      <Link
        href={`/enseignants/episodes/${fiche.code}`}
        className="mt-auto self-start text-sm font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Lire la fiche de l&apos;épisode {ep.numero}
      </Link>
    </li>
  );
}
