import type { Metadata } from "next";
import Link from "next/link";
import { RendezVousForm } from "@/components/rendez-vous-form";
import { creneauxProposes } from "@/services/rendez-vous.service";
import { DUREE_MINUTES } from "@/config/rendez-vous";

/**
 * Les créneaux se lisent sur l'agenda au moment de la visite : un créneau pris
 * il y a une minute ne doit plus se voir. La page est donc rendue à chaque
 * demande ; l'appel à l'agenda est borné à quelques secondes et, s'il
 * échoue, la page propose les plages ouvertes moins nos réservations.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/rendez-vous" },
  title: "Prendre rendez-vous",
  description:
    "Trente minutes au téléphone pour parler de votre classe et choisir la simulation : réservez un créneau libre.",
};

const ETAPES = [
  {
    titre: "Vous choisissez un créneau",
    texte: "Les créneaux proposés sont réellement libres : ils se règlent sur l'agenda de la personne qui vous appelle.",
  },
  {
    titre: "Nous vous appelons",
    texte: `Au numéro indiqué, à l'heure dite, pour ${DUREE_MINUTES} minutes. Votre classe, votre calendrier, ce qui vous fait hésiter.`,
  },
  {
    titre: "Vous repartez avec un réglage",
    texte: "Une entreprise, un niveau, une durée, et souvent un atelier prêt à animer. Rien à acheter, rien à installer.",
  },
];

export default async function RendezVousPage() {
  const { jours, periode, source } = await creneauxProposes();
  if (source === "local") {
    // Visible dans les journaux de l'hébergeur, pas pour le visiteur.
    console.warn("[rendez-vous] agenda non consulté, plages ouvertes seules");
  }
  return (
    <main id="main" className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena · rendez-vous</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-50">Trente minutes au téléphone</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
        Le formulaire d&apos;orientation répond en quatre questions ; une conversation répond aux
        autres. Prenez un créneau, nous vous appelons : votre classe, votre volume horaire, ce
        que vous voulez faire travailler, et le réglage qui convient s&apos;écrit à deux.
      </p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {ETAPES.map((e, i) => (
          <li key={e.titre} className="carte p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
              {i + 1}. {e.titre}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{e.texte}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <RendezVousForm jours={jours} periode={periode} />
      </div>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        Vous préférez écrire ? La{" "}
        <Link href="/orientation" className="text-slate-400 underline-offset-4 hover:underline">
          page d&apos;orientation
        </Link>{" "}
        recueille votre profil de classe et vous répond par courriel.
      </p>
    </main>
  );
}
