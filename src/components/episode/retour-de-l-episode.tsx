"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { niveauParCode } from "@/config/episodes/niveaux";
import type { Episode, PartieJouee } from "@/config/episodes/types";
import { observer } from "@/pedagogy/profil/observations";
import { competencesObservees, phrasesDeRobustesse } from "@/pedagogy/profil/retour";
import { enregistrerPartieAction, type SuiteDeLaPartie } from "@/app/entreprises/episode/actions";

/**
 * TROIS BLOCS SOUS LE BILAN : vos choix tenaient-ils, ce que l'épisode a
 * observé, et ensuite.
 *
 * Les deux premiers se calculent ici, à partir de la partie seule. Le
 * troisième demande le profil : la partie est envoyée une fois au serveur,
 * qui la garde et répond par le prochain épisode à jouer. Si le serveur ne
 * répond pas, le bilan reste entier ; seule la suite manque.
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
};

export function RetourDeLEpisode({
  ep,
  partie,
  cle,
}: {
  ep: Episode;
  partie: PartieJouee;
  cle: string | null;
}) {
  const { mesures, observations } = useMemo(() => observer(ep, partie), [ep, partie]);
  const robustesse = useMemo(() => phrasesDeRobustesse(ep, mesures), [ep, mesures]);
  const observees = useMemo(() => competencesObservees(observations), [observations]);

  const [envoi, setEnvoi] = useState<Envoi>({ etat: "attente" });
  const envoyee = useRef<string | null>(null);
  useEffect(() => {
    if (!cle || envoyee.current === cle) return;
    envoyee.current = cle;
    let vivant = true;
    enregistrerPartieAction({ ...partie, niveau: partie.niveau ?? "standard", cle, code: ep.code })
      .catch(() => null)
      .then((suite) => {
        if (vivant) setEnvoi({ etat: "fait", suite: suite ?? SANS_SUITE });
      });
    return () => {
      vivant = false;
      // Un démontage avant la réponse laisse le prochain montage réessayer.
      if (envoyee.current === cle) envoyee.current = null;
    };
  }, [cle, ep.code, partie]);

  const suite = envoi.etat === "fait" ? envoi.suite : null;
  const neComptePas =
    partie.niveau === "decouverte" || suite?.compte === "decouverte"
      ? "Partie jouée en Découverte : l'effet immédiat de chaque choix aidait les suivants. Elle ne compte pas dans votre profil."
      : suite?.compte === "rejouee"
        ? "Vous aviez déjà joué cet épisode : seule votre première partie compte dans votre profil. Celle-ci sert à apprendre."
        : null;

  return (
    <>
      <section aria-labelledby="robustesse-titre" className="carte grid gap-3 p-5">
        <h2 id="robustesse-titre" className="text-lg font-bold text-slate-50">
          Vos choix tenaient-ils ?
        </h2>
        <ul className="grid max-w-3xl gap-2 text-sm leading-relaxed text-slate-300">
          {robustesse.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="observe-titre" className="carte grid gap-3 p-5">
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

      <section aria-labelledby="ensuite-titre" className="carte grid gap-3 p-5">
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
                  Niveau conseillé : {niveauParCode(suite.conseil.niveau).nom}.
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
                    className="font-semibold text-amber-300 underline-offset-2 hover:underline"
                  >
                    {r.numero} · {r.titre}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{r.raison}</p>
                </li>
              ))}
            </ul>
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
            ) : (
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
