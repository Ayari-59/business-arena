"use client";

import { avecTypographie } from "@/components/typographie";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import type { PartieJouee } from "@/config/episodes/types";
import type { NiveauAffiche, RetourServi } from "@/pedagogy/episodes/partie-servie";
import { enregistrerPartieAction, type SuiteDeLaPartie } from "@/app/entreprises/episode/actions";

/**
 * TROIS BLOCS SOUS LE BILAN : vos choix tenaient-ils, ce que l'épisode a
 * observé, et ensuite.
 *
 * Les deux premiers se calculent au serveur avec le bilan, à partir de la partie
 * seule (pedagogy/episodes/partie-servie.ts). Le troisième demande le profil : la partie est envoyée une fois au serveur,
 * qui la garde et répond par le prochain épisode à jouer. Si le serveur ne
 * répond pas, le bilan reste entier ; seule la suite manque.
 *
 * L'APERÇU DU PROFIL (audit P0-2, décision du propriétaire) : une démonstration jouée
 * sans licence, en Découverte, ne compte pas dans le profil. Un quatrième bloc montre
 * alors les axes du profil calculés sur cette partie seule (`pedagogy/profil/apercu.ts`),
 * avec le bilan, sans rien garder. La partie elle-même n'est pas gardée : le serveur refuse d'écrire
 * une partie de démonstration (`estUnePartieDeDemonstration`, config/episodes/demos.ts).
 */

type Envoi = { etat: "attente" } | { etat: "fait"; suite: SuiteDeLaPartie };

const SANS_SUITE: SuiteDeLaPartie = {
  ok: false,
  compte: true,
  episodesComptes: 0,
  pourquoi: null,
  objectifChoisi: false,
  recommandations: [],
  conseil: null,
  offre: null,
};

function RetourDeLEpisodeBrut({
  retour,
  code,
  partie,
  cle,
  niveaux,
}: {
  /** Ce que le serveur a calculé avec le bilan. Sans licence, en Découverte, il porte l'aperçu du profil. */
  retour: RetourServi;
  code: string;
  partie: PartieJouee;
  cle: string | null;
  /** Les noms des niveaux, pour le niveau conseillé. */
  niveaux: readonly NiveauAffiche[];
}) {
  const { robustesse, observees, apercu } = retour;
  const avecApercu = apercu !== null;
  const nomDuNiveau = (c: string) =>
    (niveaux.find((x) => x.code === c) ?? niveaux.find((x) => x.code === "standard"))?.nom;

  const [envoi, setEnvoi] = useState<Envoi>({ etat: "attente" });
  const envoyee = useRef<string | null>(null);
  useEffect(() => {
    if (!cle || envoyee.current === cle) return;
    envoyee.current = cle;
    let vivant = true;
    enregistrerPartieAction({ ...partie, niveau: partie.niveau ?? "standard", cle, code })
      .catch(() => null)
      .then((suite) => {
        if (vivant) setEnvoi({ etat: "fait", suite: suite ?? SANS_SUITE });
      });
    return () => {
      vivant = false;
      // Un démontage avant la réponse laisse le prochain montage réessayer.
      if (envoyee.current === cle) envoyee.current = null;
    };
  }, [cle, code, partie]);

  const suite = envoi.etat === "fait" ? envoi.suite : null;
  const neComptePas =
    partie.niveau === "decouverte" || suite?.compte === "decouverte"
      ? "Partie jouée au niveau Démonstration : l'effet immédiat de chaque choix aidait les suivants. Elle ne compte pas dans votre profil."
      : suite?.compte === "rejouee"
        ? "Vous aviez déjà joué cet épisode : seule votre première partie compte dans votre profil. Celle-ci sert à apprendre."
        : null;

  return (
    <>
      <section aria-labelledby="robustesse-titre" className="carte grid scroll-mt-24 gap-3 p-5">
        <h2 id="robustesse-titre" className="text-lg font-bold text-slate-50">
          Vos choix tenaient-ils ?
        </h2>
        <ul className="grid max-w-3xl gap-2 text-sm leading-relaxed text-slate-300">
          {robustesse.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="observe-titre" className="carte grid scroll-mt-24 gap-3 p-5">
        <h2 id="observe-titre" className="text-lg font-bold text-slate-50">
          Ce que cet épisode a observé
        </h2>
        <ul className="grid max-w-3xl gap-2 text-sm leading-relaxed text-slate-300">
          {observees.map((c) => (
            <li key={c.code}>
              <span className="font-semibold text-slate-100">{c.nom} :</span> {c.phrase}.
            </li>
          ))}
        </ul>
        {neComptePas && <p className="max-w-3xl text-sm text-amber-200">{neComptePas}</p>}
        <p className="max-w-3xl text-sm text-slate-400">
          Des décisions prises dans une situation simulée, jugées selon le modèle de cette situation
          : ni une note de la personne, ni une mesure de son potentiel.
        </p>
      </section>

      {apercu && (
        <section
          aria-labelledby="apercu-titre"
          className="carte grid scroll-mt-24 gap-3 p-5"
          data-apercu-du-profil=""
        >
          <h2 id="apercu-titre" className="text-lg font-bold text-slate-50">
            Aperçu de votre profil décisionnel
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
            Les axes du profil, calculés sur cet épisode seul. Une démonstration jouée au
            niveau Démonstration ne compte pas dans le profil : cet aperçu n&apos;est gardé nulle part.
          </p>
          <ul className="grid max-w-3xl gap-2 text-sm leading-relaxed text-slate-300">
            {apercu.competences.map((l) => (
              <li key={l.code}>
                <span className="font-semibold text-slate-100">
                  {l.nom}
                  {l.score != null ? ` : ${l.score}/100` : ""}.
                </span>{" "}
                {l.preuve}
              </li>
            ))}
          </ul>
          <ul className="grid max-w-3xl gap-2 text-sm leading-relaxed text-slate-300">
            <li>
              <span className="font-semibold text-slate-100">Robustesse.</span>{" "}
              {apercu.robustesse}
            </li>
            <li>
              <span className="font-semibold text-slate-100">Prise de risque.</span>{" "}
              {apercu.risque}
            </li>
          </ul>
          <p className="max-w-3xl text-sm text-slate-400">
            Sur un seul épisode, un score n&apos;a pas encore de marge : le profil n&apos;en donne
            qu&apos;à partir de {retour.seuilIndicatif} épisodes, et ne mesure une
            progression qu&apos;en comparant les premiers épisodes joués aux plus récents.
          </p>
          <p className="max-w-3xl text-sm font-semibold text-amber-200" data-mention-de-l-apercu="">
            {retour.mention}
          </p>
        </section>
      )}

      <section aria-labelledby="ensuite-titre" className="carte grid scroll-mt-24 gap-3 p-5">
        <h2 id="ensuite-titre" className="text-lg font-bold text-slate-50">
          Ensuite
        </h2>
        {envoi.etat === "attente" ? (
          <p className="text-sm text-slate-400" role="status">
            Votre partie est gardée, le prochain épisode se cherche…
          </p>
        ) : !suite?.ok ? (
          <p className="max-w-3xl text-sm text-slate-300" role="status">
            Votre partie n&apos;a pas pu être gardée : elle ne comptera pas dans votre profil.{" "}
            <Link href="/entreprises/episode" className="text-amber-300 underline">
              Choisir un autre épisode
            </Link>
          </p>
        ) : (
          <>
            {suite.pourquoi && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                {suite.pourquoi}{" "}
                <Link
                  href="/entreprises/episode/profil#suite"
                  className="whitespace-nowrap text-amber-300 underline"
                >
                  {suite.objectifChoisi
                    ? "Changer de compétence"
                    : "Choisir moi-même la compétence à travailler"}
                </Link>
              </p>
            )}
            {suite.conseil && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                <span className="font-semibold text-slate-100">
                  Niveau conseillé : {nomDuNiveau(suite.conseil.niveau)}.
                </span>{" "}
                {suite.conseil.pourquoi}
              </p>
            )}
            <ul className="grid gap-2.5">
              {suite.recommandations.map((r) => (
                <li
                  key={r.code}
                  className="max-w-3xl rounded-lg border border-white/5 bg-slate-950 p-3.5"
                >
                  <Link
                    href={`/entreprises/episode/${r.code}${
                      suite.conseil ? `?niveau=${suite.conseil.niveau}` : ""
                    }`}
                    className="font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {r.numero} · {r.titre}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{r.raison}</p>
                </li>
              ))}
            </ul>
            {suite.offre && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300" data-offre-entreprise="">
                {suite.offre}{" "}
                <Link
                  href={LIEN_TARIFS}
                prefetch={false}
                  className="whitespace-nowrap font-semibold text-amber-300 underline"
                >
                  Voir les offres
                </Link>
              </p>
            )}
            {suite.episodesComptes >= 2 ? (
              <p className="text-sm">
                <Link
                  href="/entreprises/episode/profil"
                  className="font-semibold text-amber-300 underline"
                >
                  Voir mon profil décisionnel
                </Link>{" "}
                <span className="text-slate-400">
                  · {suite.episodesComptes} épisodes y comptent
                </span>
              </p>
            ) : avecApercu ? null : (
              <p className="text-sm text-slate-400">
                Votre profil décisionnel s&apos;ouvre après deux épisodes joués en Standard ou en
                Expert.
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}

export const RetourDeLEpisode = avecTypographie(RetourDeLEpisodeBrut);
