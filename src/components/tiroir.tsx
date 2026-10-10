"use client";

import { Icone, type NomDIcone } from "@/components/icone";
import { useParcours } from "@/components/parcours-mobile";
import type { SurfaceDuRepli } from "@/config/surfaces-de-lecture";

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
  ferme = false,
  groupe,
  phrase = false,
  onBasculer,
  surface = "cockpit",
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
  /**
   * Fermé même dans le parcours du téléphone, où les tiroirs s'ouvrent d'office : pour un
   * détail qu'on ne lit qu'à la demande (le détail par clientèle, la saison du tour).
   */
  ferme?: boolean;
  /**
   * Un groupe de tiroirs qui se referment l'un l'autre : en ouvrir un ferme les autres du
   * même nom. Le navigateur s'en charge (`<details name>`), sans script.
   */
  groupe?: string;
  /** Un titre qui est une phrase (une question) : en minuscules lisibles, pas en capitales de rubrique. */
  phrase?: boolean;
  /** Prévenu quand le tiroir s'ouvre ou se ferme, par un geste comme par un changement de `ouvert`. */
  onBasculer?: (ouvert: boolean) => void;
  /**
   * LE SOL DU TIROIR (lot 6D). Le tiroir sert les deux sols de l'arène, et son
   * aspect par défaut reste celui du COCKPIT : un repli sombre, posé sur le
   * marine. Une instance dont le contenu est un DOCUMENT (de la prose à lire :
   * une situation, une aide, une explication) le dit ici, et devient une
   * feuille de la matière `.papier` : blanche, à l'encre, filet et ombre courte.
   * Posée dans un document déjà papier, elle en devient une section creusée.
   * Jamais par défaut : chaque instance papier est déclarée, et la garde
   * `surfaces-de-lecture.test.ts` les énumère toutes.
   */
  surface?: SurfaceDuRepli;
  children: React.ReactNode;
}) {
  // DANS LE PARCOURS DU TÉLÉPHONE, chaque carte a son écran à elle : replier ce qu'elle
  // contient laissait un écran à moitié vide et une information à deux touchers. Le
  // tiroir s'y ouvre ; on peut toujours le refermer.
  const enParcours = useParcours() !== null;
  const papier = surface === "papier";
  // Sur le papier, le chevron et l'icône prennent l'encre douce du document.
  // Dans le cockpit, la teinte du métier (lot P1) : un repli qu'on ouvre n'est
  // pas une action qui engage, et l'orange ne dit plus que celle-là. Il était
  // l'ambre vif, qui faisait lire chaque tiroir comme un bouton.
  const teinteDuRepere = papier ? "douce" : "text-[color:var(--metier,var(--color-slate-400))]";
  return (
    <details
      data-tiroir
      open={ferme ? false : ouvert || enParcours}
      name={groupe}
      onToggle={onBasculer ? (e) => onBasculer(e.currentTarget.open) : undefined}
      data-surface={papier ? "papier" : undefined}
      className={
        papier
          ? "papier tiroir-papier group rounded-lg"
          : "group rounded-lg border border-dashed border-white/15 bg-slate-950/60 open:border-solid open:bg-slate-950"
      }
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
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            aria-hidden
            className={`shrink-0 text-xs ${teinteDuRepere} transition-transform group-open:rotate-90`}
          >
            ▸
          </span>
          {icone ? <Icone nom={icone} className={`h-4 w-4 shrink-0 ${teinteDuRepere}`} /> : null}
          <span
            className={
              phrase
                ? "min-w-0 text-base font-medium text-slate-100"
                : "min-w-0 text-sm font-semibold text-slate-200"
            }
          >
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
