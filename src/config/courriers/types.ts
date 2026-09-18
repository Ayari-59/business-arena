/**
 * LE COURRIER DE L'ENTREPRISE.
 *
 * Les événements du moteur (§19) arrivaient sous forme de cartes à jouer :
 * enseignes, index de coin, pioche face cachée. C'était joli et c'était faux.
 * Une entreprise n'apprend pas qu'elle est contrôlée en piochant un pique ;
 * elle l'apprend en ouvrant une enveloppe. Le courrier remplace donc la carte
 * partout — à l'écran comme sur le papier —, avec ce que cela suppose : un
 * expéditeur qui a un nom, un objet, un corps de lettre, une signature.
 *
 * Deux conséquences, et ce sont elles qui font la différence pédagogique :
 *
 *   1. LE COURRIER A UN AUTEUR. « Coût des matières +20 % » tombait du ciel ;
 *      « votre fournisseur vous informe d'une revalorisation tarifaire » a un
 *      émetteur, donc un intérêt, donc une négociation possible. L'élève
 *      n'apprend pas seulement un effet, il apprend qui le lui envoie.
 *
 *   2. UNE ENVELOPPE N'EST JAMAIS VIDE. Le tirage pouvait ne rien donner, et
 *      l'écran affichait « aucune carte ce tour » — un vide, là où il y avait
 *      une place. Le facteur passe à chaque tour : quand rien de notable ne
 *      tombe, il apporte un courrier de routine (voir `routine.ts`), qui ne
 *      change rien aux comptes et qui demande quand même d'être lu. Trier ce
 *      qui compte de ce qui ne compte pas EST une compétence de gestion.
 *
 * Le `code` reste celui de l'événement du moteur : rien de ce fichier
 * n'atteint la simulation, les instantanés de scénario ni les parties en
 * cours. C'est un habillage, et il le reste.
 */

/** Ce dont le courrier parle, donc de quel monde il vient. */
export type NatureDuCourrier = "market" | "competition" | "internal" | "macro";

/**
 * Le pli. Un recommandé engage : mise en demeure, contrôle, commande ferme,
 * résiliation. Le reste arrive au courrier ordinaire. Tout traiter en
 * recommandé banaliserait justement ce qui doit alerter — et un article de
 * presse élogieux n'arrive pas avec un accusé de réception.
 *
 * La note de service, elle, n'est jamais passée par la poste : elle circule
 * dans les murs, dans une pochette interne qui ne porte ni timbre ni cachet.
 * Son enveloppe le dit du premier coup d'œil, et c'est une information : ce
 * qui vient de l'intérieur ne s'oppose pas à l'entreprise, il la renseigne.
 * Une démission reste un recommandé — elle fait courir un préavis.
 *
 * LE COURRIEL, enfin, pour ce qui ne peut pas attendre la poste : une panne
 * qu'on signale le matin même, un dépôt bloqué, un service interrompu. Aucun
 * prestataire n'affranchit une lettre pour annoncer que son serveur est
 * tombé ; il écrit, tout de suite, et cela se voit à la forme du message.
 *
 * Et c'est une leçon, pas un décor : un courriel ne prouve rien. Il n'a ni
 * accusé de réception ni date certaine, là où le recommandé fait courir un
 * délai opposable. « Je vous l'avais dit par mail » ne pèse rien face à une
 * mise en demeure — d'où la garde, dans `pli-des-courriers.test.ts`, qui
 * interdit qu'une mise en demeure parte par courriel.
 */
export type TypeDePli = "recommande" | "simple" | "interne" | "email";

export interface CourrierDef {
  /** Le code de l'événement du moteur. Ne change jamais. */
  code: string;
  /** Qui écrit : une raison sociale, une administration, un service. */
  expediteur: string;
  /** L'objet du courrier, tel qu'il s'imprime après « Objet : ». */
  objet: string;
  /** Le corps de la lettre. La formule d'appel et la politesse sont dessinées. */
  corps: string;
  /** Qui signe : une fonction, parfois un nom. */
  signataire: string;
  /** L'effet mécanique, affiché sous la lettre. */
  effet: string;
  /** Ce que le courrier met en jeu : la mini-leçon. */
  enJeu: string;
  nature: NatureDuCourrier;
  pli: TypeDePli;
  emoji: string;
  /** "market" : toute la classe · "team" : une entreprise destinataire. */
  scope: "market" | "team";
}

/**
 * LES QUATRE NATURES. Un courrier se classe avant d'être lu, à son cachet :
 * ce qui vient des clients et du marché, ce qui vient des concurrents, ce qui
 * naît dans les murs, ce qui tombe de plus haut que l'entreprise. La couleur
 * double la mention pour qui trie vite.
 *
 * Deux couleurs par nature : `accent`, franche, pour les fonds de nuit de
 * l'application, et `encre`, plus sombre, pour le papier — de l'ambre clair
 * sur de l'ivoire ne se lit pas.
 */
export const NATURES: Record<
  NatureDuCourrier,
  { label: string; mention: string; className: string; accent: string; encre: string }
> = {
  market: {
    label: "Marché",
    mention: "CLIENTS ET MARCHÉ",
    className: "border-sky-400/40 text-sky-300",
    accent: "#38bdf8",
    encre: "#0369a1",
  },
  competition: {
    label: "Concurrence",
    mention: "CONCURRENCE",
    className: "border-fuchsia-400/40 text-fuchsia-300",
    accent: "#e879f9",
    encre: "#a21caf",
  },
  internal: {
    // « Interne » seul se confondait avec la note de service, qui circule en
    // interne : ici, c'est le SUJET du courrier qui est interne, pas son
    // circuit. Une mise en demeure de la banque parle bien de la vie interne
    // de l'entreprise, et elle arrive par la poste.
    label: "Vie interne",
    mention: "VIE DE L'ENTREPRISE",
    className: "border-amber-400/40 text-amber-300",
    accent: "#fbbf24",
    encre: "#b45309",
  },
  macro: {
    label: "Macro-économie",
    mention: "ENVIRONNEMENT ÉCONOMIQUE",
    className: "border-emerald-400/40 text-emerald-300",
    accent: "#34d399",
    encre: "#047857",
  },
};

/** La mention portée par l'enveloppe, et lue par les lecteurs d'écran. */
export const MENTION_DU_PLI: Record<TypeDePli, string> = {
  recommande: "Lettre recommandée avec accusé de réception",
  simple: "Pli simple",
  interne: "Note de service — diffusion interne",
  // Ce que le courriel NE porte pas est précisément ce qu'il faut lire.
  email: "Courriel — sans accusé de réception",
};

/** La bande de tranche : sa mention et sa couleur, ou rien pour un pli simple. */
export const BANDE_DU_PLI: Record<TypeDePli, { mention: string; classe: string } | null> = {
  recommande: { mention: "Recommandé A.R.", classe: "bg-red-700 text-white" },
  simple: null,
  interne: { mention: "Diffusion interne", classe: "bg-slate-700 text-white" },
  // Pas de tranche : un courriel n'a pas d'enveloppe sur laquelle l'imprimer.
  email: null,
};

/**
 * Combien de tours le courrier pèse : lu dans l'effet (« pendant 2 tours »),
 * un tour sinon. C'est ce que dessinent les pastilles de durée.
 */
export function dureeDuCourrier(courrier: Pick<CourrierDef, "effet">): number {
  const m = courrier.effet.match(/pendant (\d+) tours?/i);
  return m ? Number(m[1]) : 1;
}
