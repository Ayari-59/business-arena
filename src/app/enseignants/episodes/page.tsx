import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { CatalogueDesEpisodes } from "@/components/catalogue-des-episodes";
import { catalogueDesEpisodes } from "@/config/episodes/catalogue";
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
 * Les fiches enseignant, rangées comme la page des épisodes et par le même
 * composant (`CatalogueDesEpisodes`) : Arvel Distribution en tiroirs de thème,
 * les autres entreprises en un tiroir par métier ; une famille ou un secteur
 * sans fiche ne s'affiche pas. Une fiche dit ce que
 * l'épisode enseigne, comment conduire la séance de deux heures, le corrigé
 * du calcul et les questions du débrief.
 */
export default function EpisodesEnClassePage() {
  const avecFiche = new Map(FICHES.map((f) => [f.code, f]));
  const entreprises = catalogueDesEpisodes((code) => avecFiche.has(code));
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
          <CatalogueDesEpisodes
            entreprises={entreprises}
            unite={{ un: "fiche", plusieurs: "fiches" }}
            carte={(code, niveau) => {
              const fiche = avecFiche.get(code);
              return fiche ? <CarteFiche key={code} fiche={fiche} niveau={niveau} /> : null;
            }}
          />
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

function CarteFiche({ fiche, niveau }: { fiche: FicheEnseignant; niveau: 3 | 4 }) {
  const ep = episodeParCode(fiche.code);
  if (!ep) return null;
  // Le niveau du titre suit le rangement (voir la page des épisodes).
  const Titre = niveau === 3 ? "h3" : "h4";
  const sigles = fiche.formations.map((c) => formationParCode(c)?.sigle ?? c).join(" · ");
  return (
    <li className="carte flex flex-col gap-4 p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Épisode {ep.numero} · {sigles}
        </p>
        <Titre className="mt-2 text-xl font-semibold text-slate-50">{ep.titre}</Titre>
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
