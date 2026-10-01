import { Bande } from "@/components/bande";

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
 * main.
 *
 * LES MENTIONS SE LISENT SOUS LES BOUTONS, et pas une section plus haut. Elles
 * ont vécu sur la page des enseignants en pastilles vertes : quatre engagements
 * — sans compte élève, rien à installer — dans une section à eux, cent
 * soixante pixels de défilement, et la seule couleur verte d'une page laiton.
 * Or une objection se lève au moment où l'on clique, pas deux écrans avant :
 * c'est ici qu'elles servent, en une ligne.
 */
export function BandeFinale({
  id,
  contraste,
  titre,
  texte,
  mentions,
  children,
}: {
  /** L'identifiant de la bande au registre (config/bandes.ts) : « enseignants.finale ». */
  id: string;
  /** Décidé par la page, d'après le thème. */
  contraste: boolean;
  titre: string;
  texte: string;
  /** Ce qui lève une objection au moment de cliquer : « sans compte élève ». */
  mentions?: { label: string; desc: string }[];
  /** Les liens d'action, propres à chaque page. */
  children: React.ReactNode;
}) {
  return (
    <Bande
      id={id}
      contraste={contraste}
      exterieur="border-t border-white/10"
      interieur="mx-auto max-w-3xl px-6 py-16 text-center"
    >
      <h2 className="font-display text-3xl font-semibold text-slate-50">{titre}</h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300">{texte}</p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {children}
      </div>
      {mentions?.length ? (
        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          {mentions.map((m) => (
            // La phrase complète reste accessible : l'infobulle pour la
            // souris, le texte caché pour une synthèse vocale. Un libellé de
            // trois mots ne suffit pas à lever une objection à lui seul.
            <li key={m.label} title={m.desc} className="flex items-center gap-1.5">
              <span aria-hidden className="text-amber-400">
                ·
              </span>
              {m.label}
              <span className="sr-only"> : {m.desc}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Bande>
  );
}
