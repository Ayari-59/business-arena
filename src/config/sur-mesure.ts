import { LIEN_CONTACT } from "./navigation";

/**
 * LES SITUATIONS SUR MESURE, ÉCRITES UNE FOIS.
 *
 * Le propriétaire : « dire aussi que l'on peut développer des situations sur
 * mesure en fonction du référentiel. » L'option existait dans la grille des
 * offres, sur une ligne ; la page des parcours finissait sur une bande qui
 * promettait un rendez-vous ; rien ne disait ce qu'on livre, ce qu'on demande,
 * ni dans quel délai.
 *
 * UNE SEULE SOURCE DE TEXTE. L'encart des ateliers, la bande des parcours, le
 * paragraphe des écoles et celui des enseignants lisent ce module, et la
 * grille des offres y prend le libellé de son option : deux phrases qui
 * divergent, c'est une promesse faite à un endroit et retirée à l'autre, et
 * une garde le vérifie (tests/architecture/sur-mesure.test.ts).
 *
 * AUCUN PRIX : les offres se vendent sur devis, et le délai est indicatif,
 * parce qu'il dépend du référentiel qu'on nous confie.
 */
export const SUR_MESURE = {
  /** Le libellé de l'option dans la grille des offres (config/tarifs.ts). */
  offre: "Scénario sur mesure : une entreprise fictive à l'image de la vôtre",
  titre: "Une situation sur mesure, écrite pour votre référentiel",
  promesse:
    "Les entreprises du registre servent déjà plusieurs formations. Quand la vôtre demande un secteur, un vocabulaire ou une progression qu'aucune ne porte, nous écrivons l'entreprise qu'il lui faut : ses tours, ses situations-problèmes et le déroulé des séances, alignés sur les blocs de votre référentiel.",
  demande: {
    titre: "Ce que nous vous demandons",
    points: [
      "Le référentiel ou le programme, tel que votre académie le publie.",
      "Le volume horaire dont vous disposez, et la durée de vos créneaux.",
      "Le niveau de vos élèves ou étudiants, et l'année de formation.",
      "Le secteur souhaité, ou la famille d'entreprises que vos élèves connaissent.",
    ],
  },
  livre: {
    titre: "Ce que nous livrons",
    points: [
      "Une entreprise fictive, avec son marché, ses clientèles et ses chocs.",
      "Ses tours et ses situations-problèmes, chacune rattachée à un bloc du référentiel.",
      "Un déroulé de séances minuté, avec les livrables, les traces et les critères.",
    ],
  },
  delai: {
    titre: "Délai indicatif",
    texte:
      "Quelques semaines entre la lecture de votre référentiel et la première séance jouable : un ordre de grandeur, qui dépend de ce que votre programme demande et se précise au rendez-vous.",
  },
  appel: {
    rendezVous: LIEN_CONTACT,
    devis: { href: "/devis" },
  },
} as const;
