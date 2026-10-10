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
import { PiedDePage } from "@/components/pied-de-page";
import { ReprendreMaPartie } from "@/components/reprendre-ma-partie";
import { getGuestUserId } from "@/lib/guest";
import { partiesSoloEnCours } from "@/services/partie-en-cours.service";
import { LIEN_CONTACT, liensDAcces } from "@/config/navigation";
import { messageNiveauxReserves } from "@/config/vitrine-solo";
import { promesseEntreprise, teinteDuMetier } from "@/config/scenarios/presentation";

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
      <main id="main">
        {/*
          L'OUVERTURE MARINE DE L'ARÈNE (audit P2-21). L'entrée dans le jeu était
          une page claire : une colonne de texte centrée avec trois cents pixels
          de vide au-dessus du titre, et sur téléphone l'introduction arrivait
          APRÈS le formulaire. Elle s'ouvre désormais sur le marine, comme
          l'accueil : on entre dans l'arène. C'est une ardoise et non une bande
          de page (la page n'est pas au registre des bandes) : elle prend la
          matière du tableau, sans compter parmi les contre-jours.
          Sur téléphone, elle reste courte, pour que le premier métier tienne
          dans le premier écran (tests/e2e/mobile.e2e.ts).

          PLUS D'ANNEAU (lot P5). Le grand anneau décoratif coupé en haut à
          droite est parti, comme de la vitrine au lot P2 : un ornement sans
          rôle, qui ne dit rien de l'entreprise qu'on va choisir. Garde : l'e2e
          `halo` (aucun en-tête de page publique ne le porte).
        */}
        <section className="ardoise relative overflow-hidden bg-slate-950 text-slate-100">
          <div className="relative mx-auto max-w-6xl px-6 pb-6 pt-6 sm:pb-12 sm:pt-12">
            <p>
              <span className="surtitre-arene">Partie solo</span>
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-[1.05] text-slate-50 sm:mt-6 sm:text-5xl lg:text-6xl">
              Choisissez votre entreprise.{" "}
              <br className="hidden sm:block" />
              Le marché vous attend.
            </h1>
            {/* UNE LIGNE, PAS UN DISCOURS. Celui qui est ici veut jouer : il
                choisit son métier et son niveau. */}
            <p className="mt-3 max-w-xl text-base leading-snug text-slate-300 sm:mt-5 sm:text-lg sm:leading-relaxed">
              Choisissez un métier et un niveau. Premier contact ? Commencez au niveau 1.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm sm:mt-5">
              <Link
                href="/join"
                className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                J&apos;ai un code (élève)
              </Link>
              <Link
                href="/reprendre"
                className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Reprendre avec mon code
              </Link>
              {/* LOT P4 : trois liens sur une ligne, une seule forme (le troisième
                  n'était souligné qu'au survol : on le prenait pour du texte). */}
              <Link
                href="/profile"
                className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Mon profil
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
          <ReprendreMaPartie parties={enCours} className="mb-6" />
            {reserve ? (
              <p
                role="status"
                className="mb-4 rounded-xl encadre-neutre p-4 text-base text-slate-200"
              >
                {messageNiveauxReserves(config.vitrineSolo)} Choisissez un niveau plus bas, ou jouez
                l&apos;entreprise vitrine à tous les niveaux.
              </p>
            ) : null}
            {trop ? (
              <p
                role="status"
                className="mb-4 rounded-xl encadre-neutre p-4 text-base text-slate-200"
              >
                Trop de parties lancées depuis cette connexion dans la dernière heure.
                Réessayez tout à l&apos;heure. Si vous êtes en classe, les élèves n&apos;ont
                pas besoin de passer par ici : donnez-leur le code de la partie, ils
                entrent par <strong>/join</strong> et ne créent rien.
              </p>
            ) : null}
            {!config.allowPublicPlay ? (
              <div className="carte p-6 text-sm text-slate-400">
                Les parties publiques sont momentanément désactivées. Élèves : utilisez le code
                donné par votre enseignant sur{" "}
                <Link href="/join" className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2">
                  /join
                </Link>
                .
              </div>
            ) : (
              <form
                action={startGameAction}
                className="carte p-4 shadow-xl shadow-black/30 ring-1 ring-white/5 sm:p-6"
              >
                {/* Le titre de la carte dit le geste, et s'il y a déjà une partie à
                    reprendre au-dessus : « une nouvelle », ou « votre première ». */}
                <h2 className="titre-carte text-slate-100">
                  {enCours.length > 0 ? "Lancez une nouvelle partie" : "Lancez votre première partie"}
                </h2>
                <QuickConfigFields
                  scenarios={SCENARIO_CHOICES.map((s) => {
                    const famille = familyOf(s.code);
                    return {
                      code: s.code,
                      secteur: s.sector,
                      label: s.shortName,
                      sector: SECTOR_LABELS[s.sector],
                      tagline: s.tagline,
                      teinte: teinteDuMetier(s),
                      promesse: promesseEntreprise(s),
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
                  lancement={
                    // LE SEUL BOUTON DE LANCEMENT, dans le résumé collant (lot P2).
                    <SubmitButton
                      pendingLabel="Création de la partie…"
                      className={`${bouton({ taille: "l" })} w-full`}
                    >
                      Lancer la partie
                    </SubmitButton>
                  }
                />
              </form>
            )}
        </section>
      </main>
      <PiedDePage />
    </>
  );
}
