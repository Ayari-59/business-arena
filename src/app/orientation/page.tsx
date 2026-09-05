import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { OrientationForm } from "@/components/orientation-form";
import { SCENARIOS } from "@/config/scenarios/registry";
import { ATELIERS } from "@/config/ateliers";

/**
 * La page ne lit que la configuration de plateforme (rien par utilisateur, pas
 * de searchParams) : comme la landing (#99), on la met en cache et on la
 * régénère au plus toutes les 5 min (ISR) plutôt que de la rendre côté serveur
 * — avec un hit base — à chaque visite. L'adresse de contact tolère 5 min de
 * décalage.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/orientation" },
  title: "Choisir sa simulation",
  description:
    "Quatre questions pour trouver l'entreprise, le niveau et la durée qui conviennent à votre classe.",
};

export default async function OrientationPage() {
  const config = await getPlatformConfig();

  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
        Business Arena · orientation
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-50">Quelle simulation pour votre classe</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
        {SCENARIOS.length} entreprises, six niveaux de difficulté, une durée réglable et{" "}
        {ATELIERS.length} ateliers prêts à animer : cela fait beaucoup de combinaisons, et le
        mauvais réglage ne se voit qu&apos;en séance trois. Répondez à quatre questions, la
        recommandation s&apos;écrit à mesure, avec ses raisons. Vous pouvez la discuter :
        elle n&apos;a rien d&apos;un oracle, c&apos;est le raisonnement que nous tiendrions à
        votre place.
      </p>

      <div className="mt-10">
        <OrientationForm contactEmail={config.contactEmail} />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-slate-600">
        Rien n&apos;est figé : le secteur, le niveau, la durée et la périodicité se changent à
        la création de la partie, et une partie qui ne convient pas se relance en trente
        secondes. Voir{" "}
        <Link href="/entreprises" className="text-slate-400 underline-offset-4 hover:underline">
          les fiches des entreprises
        </Link>{" "}
        ou{" "}
        <Link href="/ateliers" className="text-slate-400 underline-offset-4 hover:underline">
          les ateliers publiés
        </Link>
        .
      </p>
    </main>
  );
}
