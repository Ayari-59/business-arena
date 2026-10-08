import type { Metadata } from "next";
import Link from "next/link";
import { startGameAction } from "../actions";
import { getPlatformConfig } from "@/services/admin.service";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { leviersDuNiveau } from "@/config/decisions";
import { DEFAULT_SCENARIO_CODE, SCENARIO_CHOICES, SECTOR_LABELS, familyOf } from "@/config/scenarios/registry";
import { SubmitButton } from "@/components/submit-button";
import { QuickConfigFields } from "@/components/quick-config-form";
import { bouton } from "@/components/bouton";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { ReprendreMaPartie } from "@/components/reprendre-ma-partie";
import { getGuestUserId } from "@/lib/guest";
import { partiesSoloEnCours } from "@/services/partie-en-cours.service";
import { LIEN_CONTACT, liensDAcces } from "@/config/navigation";
import { messageNiveauxReserves } from "@/config/vitrine-solo";

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
  searchParams: Promise<{ secteur?: string; trop?: string; reserve?: string }>;
}) {
  const config = await getPlatformConfig();
  // Celui qui revient retrouve sa partie AVANT d'en configurer une autre.
  const userId = await getGuestUserId();
  const enCours = userId ? await partiesSoloEnCours(userId) : [];
  // Les fiches d'entreprise renvoient ici avec leur métier en poche : le
  // sélecteur doit s'ouvrir dessus, sinon le clic n'a servi à rien.
  const { secteur, trop, reserve } = await searchParams;
  const scenarioChoisi = SCENARIO_CHOICES.some((s) => s.code === secteur)
    ? secteur!
    : DEFAULT_SCENARIO_CODE;

  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

        <section className="mx-auto max-w-6xl px-6 py-8 sm:py-16">
          {/*
            Colonnes centrées l'une sur l'autre : le texte est bien plus court que
            le formulaire, et les aligner par le haut laissait un vide sous lui.
            La colonne de droite est large (540 px) : le formulaire y respire, ses
            cartes de secteur s'étalent, sa hauteur se rapproche de celle du texte.
            Le texte, lui, reste borné par son max-w-lg et ne s'étire pas.
          */}
          <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-[1fr_540px] lg:items-center">
            <ReprendreMaPartie parties={enCours} className="order-0 lg:col-span-2" />
            {/* SUR TÉLÉPHONE, le choix du métier vient tout de suite : un titre, puis le formulaire,
                puis ce qui se lit à loisir. `contents` défait cette colonne en deux blocs que
                `order` réarrange ; au-delà de `lg`, c'est la colonne de texte d'avant, à l'identique. */}
            <div className="contents lg:block">
            <div className="order-1">
              <p className="text-xs uppercase tracking-annonce text-amber-400">Partie solo</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
                {enCours.length > 0 ? "Lancez une nouvelle partie" : "Lancez votre première partie"}
              </h1>
            </div>
            <div className="order-3">
              {/* UNE LIGNE, PAS UN DISCOURS. Le paragraphe, les trois puces et les cinq liens
                  qui entouraient le formulaire disaient ce que la page d'accueil et le menu disent
                  déjà : celui qui est ici veut jouer, il choisit son métier et son niveau. */}
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-400">
                Choisissez un métier et un niveau. Premier contact ? Commencez au niveau 1.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link href="/join" className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
                  J&apos;ai un code (élève)
                </Link>
                <Link href="/reprendre" className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
                  Reprendre avec mon code
                </Link>
                <Link href="/profile" className="text-slate-400 underline-offset-4 hover:underline">
                  Mon profil
                </Link>
              </div>
            </div>
            </div>

            {reserve ? (
              <p
                role="status"
                className="order-2 mb-4 rounded-xl encadre-neutre p-4 text-base text-slate-200 lg:order-none"
              >
                {messageNiveauxReserves(config.vitrineSolo)} Choisissez un niveau plus bas, ou jouez
                l&apos;entreprise vitrine à tous les niveaux.
              </p>
            ) : null}
            {trop ? (
              <p
                role="status"
                className="order-2 mb-4 rounded-xl encadre-neutre p-4 text-base text-slate-200 lg:order-none"
              >
                Trop de parties lancées depuis cette connexion dans la dernière heure.
                Réessayez tout à l&apos;heure. Si vous êtes en classe, les élèves n&apos;ont
                pas besoin de passer par ici : donnez-leur le code de la partie, ils
                entrent par <strong>/join</strong> et ne créent rien.
              </p>
            ) : null}
            {!config.allowPublicPlay ? (
              <div className="order-2 carte p-6 text-sm text-slate-400 lg:order-none">
                Les parties publiques sont momentanément désactivées. Élèves : utilisez le code
                donné par votre enseignant sur{" "}
                <Link href="/join" className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2">
                  /join
                </Link>
                .
              </div>
            ) : (
              <form
                action={startGameAction}
                className="order-2 carte p-4 shadow-xl shadow-black/30 ring-1 ring-white/5 sm:p-6 lg:order-none"
              >
                <h2 className="titre-carte text-slate-100">Configurer la partie</h2>
                <QuickConfigFields
                  scenarios={SCENARIO_CHOICES.map((s) => {
                    const famille = familyOf(s.code);
                    return {
                      code: s.code,
                      secteur: s.sector,
                      label: s.shortName,
                      sector: SECTOR_LABELS[s.sector],
                      tagline: s.tagline,
                      ...(famille
                        ? { variante: { gammeFromLevel: famille.gammeFromLevel, mono: famille.monoLabel, gamme: famille.gammeLabel } }
                        : {}),
                    };
                  })}
                  vitrine={config.vitrineSolo}
                  liens={{
                    contact: { href: LIEN_CONTACT.href, libelle: LIEN_CONTACT.libelle },
                    enseignant: {
                      href: liensDAcces().find((l) => l.acces === "enseignant")!.href,
                      libelle: "Accéder à l'espace enseignant",
                    },
                  }}
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
                  className={`${bouton({ taille: "l" })} mt-5 w-full`}
                >
                  Lancer la partie
                </SubmitButton>
              </form>
            )}
          </div>
        </section>
      </main>
      <PiedDePage />
    </>
  );
}
