/**
 * LA BANDE QUI TERMINE UNE PAGE PUBLIQUE, À CONTRE-JOUR.
 *
 * Les cinq pages publiques finissaient toutes sur le même bloc flottant : un
 * titre, une phrase et deux boutons centrés sur le fond qui portait déjà les
 * huit sections précédentes. Une page qui déroule trente écrans d'arguments
 * doit finir sur quelque chose, et ce quelque chose est l'endroit où l'on
 * décide — or rien ne l'y distinguait d'un paragraphe.
 *
 * `contre-jour` retourne l'échelle des couleurs POUR CE BLOC : la bande est
 * sombre sur la page claire qu'on sert, et claire si le lecteur a choisi le
 * thème sombre. Aucune couleur n'est écrite ici — `bg-slate-950` et
 * `text-slate-50` sont les classes de partout ailleurs, elles désignent
 * simplement l'autre bout de l'échelle une fois dedans. C'est le contraste
 * d'une capture d'écran au milieu d'un texte, appliqué à un bloc.
 *
 * ÉCRITE UNE FOIS. Cinq copies d'une même bande, c'est cinq bandes qui
 * dérivent : l'une garde l'ancien espacement, l'autre passe au serif, une
 * troisième oublie le filet du haut. Le dépôt a déjà payé cette leçon sur les
 * boutons — cinquante, dans onze remplissages différents.
 *
 * UN SEUL BLOC À CONTRE-JOUR PAR ÉCRAN, et c'est ce composant qui porte la
 * règle. Le contraste attire l'œil parce qu'il est unique sur la page : deux
 * bandes n'en feraient pas deux qui se voient, elles en feraient deux qui
 * s'annulent. tests/architecture/contre-jour.test.ts le tient.
 *
 * Les boutons restent à la page : ils ne mènent pas au même endroit selon
 * qu'on lit les métiers, le parcours d'une classe ou le guide de prise en
 * main, et c'est bien le seul contenu de cette bande.
 */
export function BandeFinale({
  titre,
  texte,
  children,
}: {
  titre: string;
  texte: string;
  /** Les liens d'action, propres à chaque page. */
  children: React.ReactNode;
}) {
  return (
    <section className="contre-jour border-t border-white/10 bg-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-slate-50">{titre}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300">{texte}</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {children}
        </div>
      </div>
    </section>
  );
}
