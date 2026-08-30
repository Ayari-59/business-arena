/**
 * LES RÉFÉRENTIELS, TELS QUE LEURS TEXTES LES ÉCRIVENT.
 *
 * Les ateliers citaient leurs blocs, processus et thèmes en texte libre, séance
 * par séance. Trois erreurs y vivaient, et aucune ne se voyait autrement qu'en
 * ouvrant l'arrêté : un thème de programme purement inventé, un intitulé de
 * management tronqué au tiers, et un diplôme entier rangé sous le mauvais mot,
 * le BTS Gestion de la PME ayant des blocs de compétences là où le produit lui
 * prêtait des activités.
 *
 * Ce sont les erreurs que repère du premier coup d'œil le seul lecteur qui
 * compte ici : celui qui connaît son référentiel par cœur.
 *
 * CE REGISTRE EST UNE RÉFÉRENCE, PAS UN CARCAN. Le mot qui découpe un métier
 * reste un choix d'affichage : blocs de compétences, activités, processus,
 * unités d'enseignement, une autre filière viendra avec le sien et devra
 * pouvoir l'écrire. Un intitulé raccourci pour tenir dans une fiche n'est pas
 * une faute non plus. La garde ne retient donc que ce qui a réellement fait
 * défaut : une entrée que le texte ne porte pas du tout, comme ce thème de
 * programme entièrement inventé. Elle compare le fond, sans accents, sans
 * casse et sans le préfixe qui numérote.
 *
 * Un diplôme absent d'ici n'est pas bloqué : il n'est simplement pas confronté
 * à un texte, faute qu'on l'ait lu. Ajouter une filière ne demande donc rien.
 *
 * La provenance n'est pas un ornement. Une liste lue dans l'arrêté et une liste
 * reconstituée de mémoire ne se corrigent pas de la même façon, et le prochain
 * qui passera ici doit savoir laquelle il a sous les yeux.
 */

export interface Referentiel {
  /** Le mot par lequel le texte découpe le métier. */
  label: string;
  accord: "mobilisés" | "mobilisées";
  /** D'où vient la liste, et à quelle date elle a été confrontée au texte. */
  source: string;
  /**
   * Les intitulés, tels que le texte les écrit. Un atelier peut les raccourcir
   * ou les préfixer autrement : c'est le fond qui est comparé, pas la lettre.
   */
  entrees: readonly string[];
}

export const REFERENTIELS: Record<string, Referentiel> = {
  mco: {
    label: "Blocs de compétences",
    accord: "mobilisés",
    source:
      "Arrêté du 8 juillet 2024 modifiant l'arrêté du 15 octobre 2018, BTS Management commercial opérationnel. Lu sur le texte.",
    entrees: [
      "Bloc 1 · Développer la relation client et assurer la vente conseil",
      "Bloc 2 · Animer et dynamiser l'offre commerciale",
      "Bloc 3 · Assurer la gestion opérationnelle",
      "Bloc 4 · Manager l'équipe commerciale",
    ],
  },
  ndrc: {
    label: "Blocs de compétences",
    accord: "mobilisés",
    source:
      "Référentiel du BTS Négociation et digitalisation de la relation client. Lu sur le texte.",
    entrees: [
      "Bloc 1 · Relation client et négociation-vente",
      "Bloc 2 · Relation client à distance et digitalisation",
      "Bloc 3 · Relation client et animation de réseaux",
    ],
  },
  gpme: {
    label: "Blocs de compétences",
    accord: "mobilisés",
    source:
      "Référentiel du BTS Gestion de la PME. Lu sur le texte, qui parle de blocs de compétences et non d'activités, et dont trois intitulés sur quatre se terminent par « de la PME ».",
    entrees: [
      "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
      "Bloc 2 · Participer à la gestion des risques de la PME",
      "Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
      "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
    ],
  },
};

/**
 * Les diplômes dont la liste n'a pas encore été confrontée à son texte.
 *
 * Ils sont nommés plutôt que passés sous silence : la garde les laisse
 * tranquilles, et ce commentaire dit où en est chacun.
 *
 * `cg1` — le mot est le bon : le BTS Comptabilité et Gestion découpe bien le
 * métier en PROCESSUS, confirmé par l'enseignant qui édite ces ateliers. Ses
 * cinq intitulés, eux, n'ont pas été relus sur l'arrêté. Rien ne les impose ici
 * pour autant : le mot d'un référentiel reste un choix d'affichage, et une
 * confirmation orale n'est pas une raison d'en faire une règle de compilation.
 *
 * `dcg` — ni le mot ni les intitulés n'ont été vérifiés.
 *
 * `stmg` — porte ses thèmes dans son propre fichier, où deux programmes sur
 * trois ont été lus sur le texte.
 */
export const REFERENTIELS_NON_VERIFIES = ["cg1", "dcg", "stmg"] as const;
