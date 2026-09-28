import { Icone, type NomDIcone } from "@/components/icone";

/**
 * Un tiroir : un titre, ce qu'il cache, et son contenu replié.
 *
 * Pourquoi un composant. La page comptait cinq replis écrits chacun à sa
 * manière — l'un avec le triangle du navigateur, l'autre avec le mot
 * « déplier », un troisième avec rien du tout. Un repli qu'on ne voit pas est
 * un contenu perdu : l'élève ne cherche pas ce qu'il ne soupçonne pas. Ils
 * partagent désormais trois signaux, et un seul endroit à corriger.
 *
 * Les trois signaux :
 *   1. le chevron, en ambre comme les autres commandes, qui PIVOTE à l'ouverture
 *      — c'est lui qui dit « ceci s'ouvre » ;
 *   2. le trait POINTILLÉ tant que le tiroir est fermé, plein une fois ouvert :
 *      visible du coin de l'œil, sans rien ajouter à lire ;
 *   3. `quoi`, qui annonce le CONTENU par son compte (« 5 clientèles »). Un
 *      titre seul dit le sujet, pas qu'il y a matière derrière. Compté depuis la
 *      donnée affichée, jamais écrit à la main : un nombre en dur mentirait dès
 *      qu'un scénario change.
 *
 * Le triangle natif est masqué (`list-none` et la règle WebKit) : on dessine le
 * nôtre, sinon les deux se superposent.
 */
export function Tiroir({
  titre,
  icone,
  valeur,
  quoi,
  ouvert = false,
  children,
}: {
  titre: string;
  /**
   * Le repère du tiroir, dessiné. Les titres portaient un emoji, que le
   * système dessine à sa façon : différent d'un appareil à l'autre, en
   * couleurs étrangères au site, et brouillé au vidéoprojecteur.
   */
  icone?: NomDIcone;
  /**
   * LE CHIFFRE QUE LE TIROIR NE DOIT PAS CACHER.
   *
   * Un repli range ce qu'on consulte ; il ne doit pas ranger ce qui décide. La
   * saison du tour est le cas : elle multiplie la demande, donc elle commande le
   * volume à produire, et elle a déjà été corrigée une fois pour cette raison —
   * elle tenait dans une ligne bleu pâle en bas d'écran, que personne ne lisait.
   * La replier entière recommencerait la même faute.
   *
   * Le résumé porte donc la valeur, en clair et en couleur, et le tiroir garde
   * l'explication et le détail. C'est un nœud, pas un texte : la couleur y dit
   * le sens (vent favorable, vent contraire), ce qu'une chaîne ne saurait faire.
   */
  valeur?: React.ReactNode;
  /** Ce qui attend derrière, en un mot compté : « 5 clientèles », « 3 tours ». */
  quoi?: string;
  ouvert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={ouvert}
      className="group rounded-lg border border-dashed border-white/15 bg-slate-950/60 open:border-solid open:bg-slate-950"
    >
      {/*
        L'EN-TÊTE PASSE À LA LIGNE PLUTÔT QUE D'ÉCRASER SON TITRE. Sur un
        téléphone, un résumé chargé (titre, valeur, compte) ne tient pas sur une
        ligne : sans repli, c'est le TITRE qui rétrécit, et « Saison du tour » se
        coupait en trois lignes d'un mot pendant que le reste restait sur une
        seule. Le titre garde donc sa largeur, et c'est ce qui le suit qui
        descend d'une ligne.

        « Déplier » reste HORS du groupe qui se replie : sinon il partait seul
        sur la ligne du bas, à l'opposé du chevron qui dit la même chose. Ici il
        tient la droite du résumé, quel que soit le nombre de lignes.
      */}
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            aria-hidden
            className="shrink-0 text-xs text-amber-400/80 transition-transform group-open:rotate-90"
          >
            ▸
          </span>
          {icone ? <Icone nom={icone} className="h-4 w-4 shrink-0 text-amber-400/80" /> : null}
          <span className="min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-300">
            {titre}
          </span>
          {valeur ? <span className="shrink-0 text-sm font-semibold">{valeur}</span> : null}
          {/*
            Le compte, en texte simple. Il a porté une pastille — bordure, fond,
            coins ronds — et elle mentait deux fois : elle avait l'air d'un
            bouton posé au milieu d'un en-tête déjà cliquable, et son texte se
            coupait en deux sur un téléphone (« 3 » sur une ligne,
            « clientèles » sur la suivante), en écrasant le titre au passage.
            L'information mérite d'être là ; la fausse commande, non.
          */}
          {quoi ? (
            <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{quoi}</span>
          ) : null}
        </span>
        <span className="ml-auto shrink-0 pl-2 text-xs text-slate-400 group-open:hidden">
          déplier
        </span>
      </summary>
      <div className="border-t border-white/10 px-3 pb-2.5 pt-2 sm:px-3.5 sm:pb-3.5">{children}</div>
    </details>
  );
}
