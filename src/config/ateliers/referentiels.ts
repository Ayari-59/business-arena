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
  cg1: {
    label: "Processus",
    accord: "mobilisés",
    source:
      "Arrêté du 3 novembre 2014 portant définition du BTS Comptabilité et gestion, annexe I b, référentiel de certification, modifié par les arrêtés du 9 juin 2016 et du 15 septembre 2016. Lu sur le texte.",
    entrees: [
      "P1 · Contrôle et traitement comptable des opérations commerciales",
      "P2 · Contrôle et production de l'information financière",
      "P3 · Gestion des obligations fiscales",
      "P4 · Gestion des relations sociales",
      "P5 · Analyse et prévision de l'activité",
      "P6 · Analyse de la situation financière",
      "P7 · Fiabilisation de l'information et système d'information comptable (SIC)",
    ],
  },
  dcg: {
    label: "Unités d'enseignement",
    accord: "mobilisées",
    source:
      "Annexe 1, programme des unités d'enseignement du diplôme de comptabilité et de gestion. Lu sur le texte. Il s'agit du programme réformé, celui qui porte la durabilité et l'intelligence artificielle dans plusieurs unités.",
    entrees: [
      "UE1 · Fondamentaux du droit",
      "UE2 · Droit des affaires",
      "UE3 · Droit social",
      "UE4 · Droit fiscal",
      "UE5 · Économie contemporaine",
      "UE6 · Finance d'entreprise",
      "UE7 · Management des organisations",
      "UE8 · Système d'information de gestion",
      "UE9 · Comptabilité",
      "UE10 · Comptabilité approfondie",
      "UE11 · Contrôle de gestion",
      "UE12 · Anglais des affaires",
      "UE13 · Communication professionnelle",
    ],
  },
  stmg: {
    label: "Thèmes du programme",
    accord: "mobilisés",
    source:
      "Les trois programmes du cycle terminal STMG, lus sur leurs annexes : sciences de gestion et numérique de première (annexe 3), management de première (annexe 2), management, sciences de gestion et numérique de terminale, enseignement commun (annexe 2).",
    entrees: [
      // Première, sciences de gestion et numérique.
      "Thème 1 · De l'individu à l'acteur",
      "Thème 2 · Numérique et intelligence collective",
      "Thème 3 · Création de valeur et performance",
      "Thème 4 · Temps et risque",
      // Première, management.
      "Thème 1 · À la rencontre du management des organisations",
      "Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs",
      "Thème 3 · Les choix stratégiques des organisations",
      // Terminale, enseignement commun.
      "Thème 1 · Les organisations et l'activité de production de biens et de services",
      "Thème 2 · Les organisations et les acteurs",
      "Thème 3 · Les organisations et la société",
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
 * Elle est vide : les six diplômes publiés ont été lus sur leurs textes. Ce
 * n'est pas un état définitif et la liste n'est pas là pour décorer. Une
 * filière ajoutée demain y entrera le temps qu'on ouvre son arrêté, et c'est
 * précisément à cela qu'elle sert : un diplôme dont le texte n'a pas été lu
 * doit se voir, plutôt que de se confondre avec ceux qui l'ont été.
 */
export const REFERENTIELS_NON_VERIFIES = [] as const;
