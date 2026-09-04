import type { Metadata } from "next";
import Link from "next/link";
import { startGameAction } from "../actions";
import { getPlatformConfig } from "@/services/admin.service";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { etendueDesDecisions, leviersDuNiveau } from "@/config/decisions";
import { DEFAULT_SCENARIO_CODE, SCENARIOS, SECTOR_ICONS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { SubmitButton } from "@/components/submit-button";
import { QuickConfigFields } from "@/components/quick-config-form";

export const dynamic = "force-dynamic";

/**
 * Le lancement d'une partie solo, sur sa propre page.
 *
 * Il vivait au bas de l'accueil ; la landing portait alors trop de choses. Il
 * a désormais son adresse (/jouer), vers laquelle pointent le bouton « Tester
 * le simulateur » de l'accueil et les liens « Diriger … » des fiches
 * d'entreprise (qui passent le secteur en `?secteur=`).
 *
 * Aucune logique métier ici : le formulaire écrit ses choix dans des champs
 * cachés et les remet à `startGameAction` (server action, inchangée).
 */
export const metadata: Metadata = {
  title: "Lancer une partie",
  description:
    "Configurez votre partie solo : choisissez un secteur, un niveau de défi et le rythme du marché, puis lancez la simulation.",
  alternates: { canonical: "/jouer" },
};

export default async function JouerPage({
  searchParams,
}: {
  searchParams: Promise<{ secteur?: string }>;
}) {
  const config = await getPlatformConfig();
  const decisions = etendueDesDecisions();
  // Les fiches d'entreprise renvoient ici avec leur métier en poche : le
  // sélecteur doit s'ouvrir dessus, sinon le clic n'a servi à rien.
  const { secteur } = await searchParams;
  const scenarioChoisi = SCENARIOS.some((s) => s.code === secteur)
    ? secteur!
    : DEFAULT_SCENARIO_CODE;

  return (
    <main id="main" className="relative overflow-hidden">
      {/* halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        {/*
          Colonnes centrées l'une sur l'autre : le texte est bien plus court que
          le formulaire, et les aligner par le haut laissait un vide sous lui.
          La colonne de droite est large (540 px) : le formulaire y respire, ses
          cartes de secteur s'étalent, sa hauteur se rapproche de celle du texte.
          Le texte, lui, reste borné par son max-w-lg et ne s'étire pas.
        */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_540px] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Partie solo</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              Lancez votre première partie
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
              Choisissez l&apos;un des {SCENARIOS.length} métiers, puis menez votre entreprise
              face à des concurrents qui ne vous feront aucun cadeau. De {decisions.minimum} à{" "}
              {decisions.maximum} décisions par tour selon le niveau : prix, volumes, marketing,
              qualité, financement. Chacune compte, et la crise de trésorerie réserve une leçon
              que peu voient venir.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li>· Niveau Découverte : aucune connaissance préalable requise</li>
              <li>· Débriefing corrigé à chaque tour, fiches notions intégrées</li>
              <li>· Votre profil de compétences progresse à chaque situation traitée</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/entreprises" className="text-amber-300 underline-offset-4 hover:underline">
                Découvrir les {SCENARIOS.length} entreprises
              </Link>
              <Link href="/join" className="text-amber-300 underline-offset-4 hover:underline">
                J&apos;ai un code (élève)
              </Link>
              <Link href="/guide" className="text-slate-400 underline-offset-4 hover:underline">
                Guide
              </Link>
              <Link href="/profile" className="text-slate-400 underline-offset-4 hover:underline">
                Mon profil
              </Link>
            </div>
          </div>

          {!config.allowPublicPlay ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-400">
              Les parties publiques sont momentanément désactivées. Élèves : utilisez le code
              donné par votre enseignant sur{" "}
              <Link href="/join" className="text-amber-300 underline-offset-4 hover:underline">
                /join
              </Link>
              .
            </div>
          ) : (
            <form
              action={startGameAction}
              className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/30 ring-1 ring-white/5"
            >
              <h2 className="text-sm font-semibold text-slate-100">Configurer la partie</h2>
              <QuickConfigFields
                scenarios={SCENARIOS.map((s) => ({
                  code: s.code,
                  icon: SECTOR_ICONS[s.sector],
                  label: SECTOR_LABELS[s.sector],
                  tagline: s.tagline,
                }))}
                levels={DIFFICULTY_PRESETS.map((p) => ({
                  level: p.level,
                  name: p.name,
                  tagline: p.tagline,
                  decisions: leviersDuNiveau(p.level).length,
                }))}
                defaultScenario={scenarioChoisi}
              />
              <SubmitButton
                pendingLabel="Création de la partie…"
                className="mt-5 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              >
                Lancer la partie
              </SubmitButton>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
