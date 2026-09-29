/**
 * LA COUPURE DU MILIEU : trois chiffres, sur un sol retourné.
 *
 * Les pages publiques sont claires du haut jusqu'au pied, et une page qui ne
 * change jamais de sol n'a pas de colonne vertébrale. `contre-jour` retourne
 * l'échelle des couleurs pour ce bloc seul — sombre sur la page claire qu'on
 * sert, clair si le lecteur a choisi le thème sombre —, et c'est ce qui donne
 * à la page une articulation au lieu d'un déroulé.
 *
 * LES CHIFFRES PLUTÔT QU'UNE SECTION QUELCONQUE. Deux raisons. C'est le noyau
 * factuel de la page, ce qu'on doit en retenir ; et c'est la rangée qui, sur
 * chacune de ces pages, n'avait pas d'identité propre — trois cartes à bord
 * laiton posées entre deux sections, qui empruntaient leur relief à une
 * bordure plutôt qu'à leur place dans la page. Le sol le leur donne, et les
 * cartes disparaissent : une carte DANS une bande, ce sont deux façons de
 * dire « ceci est à part » qui se gênent.
 *
 * ELLE EST HAUTE DANS LA PAGE, ET LA BANDE FINALE EST TOUT EN BAS : le
 * contraste attire l'œil parce qu'il est unique sur l'ÉCRAN, pas sur la page.
 * Deux blocs à contre-jour cohabitent donc à condition de ne jamais se
 * rencontrer dans une même fenêtre, ce que tests/e2e/contre-jour.e2e.ts
 * mesure dans un vrai navigateur.
 *
 * Aucune couleur n'est écrite ici : `text-amber-400` et `text-slate-100` sont
 * les classes de partout ailleurs, elles désignent simplement l'autre bout de
 * l'échelle une fois dans le bloc.
 */
export function BandeDeChiffres({
  chiffres,
}: {
  chiffres: { valeur: string; libelle: string; detail: string }[];
}) {
  return (
    <section className="contre-jour bg-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-14">
        <dl className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {chiffres.map((c) => (
            <div key={c.libelle} className="text-center">
              {/* Le libellé se lit sous le nombre ; pour une synthèse vocale,
                  un nombre seul ne veut rien dire, d'où le terme d'abord. */}
              <dt className="sr-only">{c.libelle}</dt>
              <dd className="m-0">
                <p className="font-display text-4xl font-semibold tabular-nums text-amber-400">
                  {c.valeur}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{c.libelle}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.detail}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
