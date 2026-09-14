"use client";

import { useState, useSyncExternalStore } from "react";

/**
 * UNE ÉTAPE ENTRE LES RÉSULTATS ET LA DÉCISION SUIVANTE.
 *
 * La boucle qu'on veut enseigner est : décider → voir ce que ça donne →
 * COMPRENDRE → décider mieux. L'écran offrait les deux bouts en même temps :
 * les résultats du tour clos, puis, immédiatement dessous, le formulaire du
 * tour suivant. Rien n'obligeait à s'arrêter au milieu, et la mesure
 * « ont cliqué sans décider » de l'espace enseignant existe précisément parce
 * que certains ne s'arrêtaient pas.
 *
 * Ce composant replie le tour suivant tant que l'élève n'a pas dit qu'il
 * passait à la suite. Trois choix de conception, chacun contre un travers :
 *
 *  1. UNE ÉTAPE, PAS UN VERROU. Le bouton ouvre, il n'interroge pas et ne
 *     vérifie rien. Un élève bloqué au milieu d'une séance d'une heure lève la
 *     main, et c'est l'enseignant qui perd son cours. On guide, on n'empêche
 *     pas.
 *  2. LA GÉOGRAPHIE FAIT LE TRAVAIL. La carte du tour en cours vit juste sous
 *     les résultats du tour clos : le bouton est donc déjà au bout des
 *     résultats, et le seul chemin vers la saisie les traverse. Aucun
 *     mécanisme à ajouter pour ça.
 *  3. UNE FOIS OUVERT, ÇA RESTE OUVERT. Un élève qui revient finir sa décision
 *     ne doit pas retrouver le repli à chaque visite : ce serait de la friction
 *     pure, sans rien enseigner. La mémoire est locale à l'appareil, comme le
 *     brouillon de décision — c'est un état d'affichage, pas une donnée de jeu.
 */

const cle = (gameId: string, tour: number) => `arena:tour-ouvert:${gameId}:${tour}`;

/** Lecture tolérante : un stockage refusé (navigation privée) n'est pas une panne. */
function dejaOuvert(gameId: string, tour: number): boolean {
  try {
    return window.localStorage.getItem(cle(gameId, tour)) === "1";
  } catch {
    return false;
  }
}

function memoriser(gameId: string, tour: number): void {
  try {
    window.localStorage.setItem(cle(gameId, tour), "1");
  } catch {
    // Rien à faire : le tour s'ouvre quand même, il ne restera simplement pas
    // ouvert au prochain chargement.
  }
}

/**
 * L'événement `storage` ne se déclenche que dans les AUTRES onglets : un élève
 * qui ouvre le tour sur un second onglet y voit le premier suivre. Le sien est
 * géré par l'état local, plus bas.
 */
function souscrire(auChangement: () => void): () => void {
  window.addEventListener("storage", auChangement);
  return () => window.removeEventListener("storage", auChangement);
}

export function PassageAuTour({
  gameId,
  tour,
  labelTour,
  labelPrecedent,
  children,
}: {
  gameId: string;
  /** Le tour à ouvrir — sert de clé de mémorisation. */
  tour: number;
  /** « Tour 2 », « Trimestre 2 »… le vocabulaire du scénario. */
  labelTour: string;
  /**
   * Le tour dont les résultats viennent d'arriver, juste au-dessus. `null` au
   * PREMIER tour : il n'y a rien à lire avant, et une étape vide n'aurait
   * d'autre effet que de retarder l'entrée dans le jeu.
   */
  labelPrecedent: string | null;
  children: React.ReactNode;
}) {
  // LE SERVEUR N'A PAS DE localStorage. Le lire pendant le rendu ferait
  // diverger l'hydratation ; le lire dans un effet ferait basculer l'état après
  // coup. `useSyncExternalStore` est fait pour ça : un instantané côté serveur
  // (fermé), la vraie valeur côté navigateur, et pas d'écart entre les deux.
  const memorise = useSyncExternalStore(
    souscrire,
    () => dejaOuvert(gameId, tour),
    () => false,
  );
  // L'ouverture de CET onglet, que `storage` ne notifie pas à lui-même.
  const [ouvertMaintenant, setOuvertMaintenant] = useState(false);

  if (labelPrecedent === null || memorise || ouvertMaintenant) return <>{children}</>;

  return (
    <div className="px-3 py-5 text-center sm:px-4">
      {/*
        Une seule phrase. Le lien juste au-dessus dit déjà « voir les résultats
        ↑ » : redire « ils sont au-dessus » ferait deux fois le même travail. Ce
        qui reste à dire, c'est POURQUOI s'y arrêter.
      */}
      <p className="mx-auto max-w-prose text-sm leading-relaxed text-slate-300">
        C&apos;est sur les résultats du {labelPrecedent} que se décide le{" "}
        {labelTour.toLowerCase()}.
      </p>
      <button
        type="button"
        onClick={() => {
          memoriser(gameId, tour);
          setOuvertMaintenant(true);
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-400/15 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/25"
      >
        Passer au {labelTour.toLowerCase()}
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
