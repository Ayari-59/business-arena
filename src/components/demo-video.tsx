"use client";

import { useState } from "react";

/**
 * LA DÉMO, EN LECTURE AU CLIC.
 *
 * Un lecteur YouTube embarqué d'emblée, c'est près d'un mégaoctet de scripts
 * tiers et des cookies posés à des visiteurs qui n'ont rien demandé, sur une
 * page que la plupart quittent sans jamais lancer la vidéo. Ici la page ne
 * charge qu'une vignette ; l'iframe n'apparaît qu'après un clic, et sur le
 * domaine sans cookie.
 *
 * La vignette vient de YouTube, qui ne garantit pas la version `maxres` pour
 * toutes les vidéos : on retombe sur `hq`, puis sur rien du tout. Un fond vide
 * vaut mieux qu'une image cassée.
 */

const VIGNETTES = ["maxresdefault", "hqdefault"] as const;

export function DemoVideo({ videoId, title }: { videoId: string; title: string }) {
  const [joue, setJoue] = useState(false);
  const [essai, setEssai] = useState(0);
  const vignette = VIGNETTES[essai];

  return (
    <figure className="m-0">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-amber-400/5">
        {joue ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setJoue(true)}
            aria-label={`Lancer la vidéo : ${title}`}
            className="group absolute inset-0 flex items-center justify-center"
          >
            {vignette ? (
              // eslint-disable-next-line @next/next/no-img-element -- vignette distante, servie par YouTube
              <img
                src={`https://i.ytimg.com/vi/${videoId}/${vignette}.jpg`}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setEssai((n) => n + 1)}
                className="absolute inset-0 h-full w-full object-cover opacity-70 transition group-hover:opacity-90"
              />
            ) : null}
            <span
              aria-hidden
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-2xl text-slate-950 shadow-lg transition group-hover:scale-110"
            >
              ▶
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-xs text-slate-600">
        La vidéo n&apos;est chargée qu&apos;après votre clic, depuis le domaine YouTube sans
        cookie.{" "}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          L&apos;ouvrir sur YouTube
        </a>
        .
      </figcaption>
    </figure>
  );
}
