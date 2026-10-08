/**
 * LA LIGNE QUI S'ARRÊTE QUAND IL MANQUE QUELQU'UN — le contenu de l'épisode.
 *
 * Erwann Tromeur est chef de l'atelier de conditionnement de la Laiterie de
 * Kerbrélan, à Loudéac. Sur vingt-deux conducteurs de ligne, trois savent
 * régler la thermoformeuse de la ligne 5 ; quand l'un d'eux manque, la ligne
 * tourne à mi-cadence ou s'arrête, et Yvonnick Gouriou part à la retraite en
 * juin. Janvier à mars, six décisions, chacune précédée de ce qu'un chef
 * d'atelier reçoit vraiment : le responsable de production, la supply chain,
 * la qualité, les chefs d'équipe, l'élue au CSE, les experts et les
 * conducteurs eux-mêmes.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont calculés sur le modèle (src/engine/episodes/polyvalence-des-operateurs.ts).
 *
 * La sécurité des aliments n'est jamais arbitrée : un défaut de scellage est
 * bloqué et détruit, et un lot sorti par erreur est rappelé. Ce qui arrive se
 * dit sobrement.
 *
 * Entreprise, enseignes, personnes et chiffres sont fictifs.
 */
import {
  CADENCE,
  COUT_ABSENCES_PRINTEMPS,
  COUT_RATTRAPAGE_H,
  COUT_RUPTURE_H,
  COUT_SAMEDI,
  COUVERTURE,
  DECLASSEMENT_SEMAINE,
  DEMANDE,
  ECHELON,
  EXPERTS,
  HABILITATION,
  HEURES_PERDUES_PRINTEMPS,
  HEURES_POSTE,
  HS_ARRET,
  HS_MAX,
  INTERIM,
  MARGE_HEURE,
  MCV_POT,
  NON_HABILITE,
  PENALITE_HEURE,
  PRIME_EXPERTS,
  RECRUTEMENT,
  REMPLACEMENT_BINOME,
  REMPLACEMENT_RELAIS,
  STANDARDS,
  TAUX_ABSENCE_HIVER,
  TAUX_ABSENCE_PRINTEMPS,
  TAUX_SERVICE_EXIGE,
  TRANSFERT,
  VALEUR_RANG,
  ABANDON,
  ACCELERATION_STANDARDS,
  VITESSE,
  CONDUCTEURS,
} from "@/engine/episodes/polyvalence-des-operateurs";
import { euros, kE, nombre, taux } from "./format";
import type { Etape } from "./types";

export const GURVAN = { de: "Gurvan Kerebel", role: "Responsable de production, Loudéac" } as const;
export const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
export const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
export const MAEWENN = {
  de: "Maëwenn Postec",
  role: "Directrice des ressources humaines",
} as const;
export const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
export const YVONNICK = {
  de: "Yvonnick Gouriou",
  role: "Conducteur de ligne, expert de la ligne 5, poste du matin",
} as const;
export const URSULINE = {
  de: "Ursuline Cloarec",
  role: "Conductrice de ligne, experte de la ligne 5, poste d'après-midi",
} as const;
export const SIDOINE = {
  de: "Sidoine Toularastel",
  role: "Conducteur de ligne, expert de la ligne 5, poste de nuit",
} as const;
export const ARTHAUD = { de: "Arthaud Bourdonnec", role: "Conducteur de ligne, ligne 4" } as const;
export const ZAINAB = { de: "Zainab Ollitrault", role: "Conductrice de ligne, ligne 6" } as const;
export const MAIXENT = {
  de: "Maixent Le Rhun",
  role: "Chef d'équipe du matin, conditionnement",
} as const;
export const DORINE = { de: "Dorine Tanniou", role: "Élue au CSE" } as const;
export const CASIMIR = {
  de: "Casimir Rospabé",
  role: "Chargé de recrutement, Kerlann Intérim",
} as const;

/** Les deux stagiaires que la matrice désigne, dans l'ordre du modèle. */
export const STAGIAIRES = ["Arthaud", "Zainab"] as const;

/** Les chiffres que les sources affichent, calculés sur le modèle. */
export const HEURES_PLANIFIEES = EXPERTS * HEURES_POSTE * 13;
export const SEMAINES_DE_FORMATION = 1 / VITESSE;
export const SEMAINES_AVEC_STANDARDS = 1 / (VITESSE * ACCELERATION_STANDARDS);
export const COUT_ECHELON_TRIMESTRE = ECHELON.beneficiaires * ECHELON.semaine * 13;
export const COUT_TRANSFERT_SEMAINE = TRANSFERT.heures * TRANSFERT.coutHeure;
/** La part moyenne des stagiaires qui quittent le binôme, sans reconnaissance et avec l'échelon. */
export const ABANDON_SANS = (ABANDON[1][0] + ABANDON[1][1]) / 2;
export const ABANDON_ECHELON = (ABANDON[2][0] + ABANDON[2][1]) / 2;

export const DIAGNOSTICS = [
  {
    id: "dependance",
    t: "La ligne 5 dépend de trois personnes : un savoir-faire critique que personne d'autre ne détient, et qui met des semaines à se transmettre",
  },
  {
    id: "absences",
    t: "Les trois conducteurs qualifiés manquent trop souvent : il faut réduire leurs absences et les couvrir",
  },
  {
    id: "effectif",
    t: "L'atelier manque de conducteurs expérimentés : il faut en recruter un qui connaisse déjà les thermoformeuses",
  },
  {
    id: "machine",
    t: "La thermoformeuse de la ligne 5 est trop difficile à régler : c'est une affaire de machine et de maintenance",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois personnes pour une ligne",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord de l'atelier",
        role: "Alerte automatique",
        heure: "06:10",
        alerte: true,
        texte: `Ligne 5, semaine dernière : 10 heures de production perdues faute de conducteur qualifié, Sidoine Toularastel étant en arrêt deux nuits. Taux de service de la ligne : 97,6 %, pour ${taux(TAUX_SERVICE_EXIGE)} exigés par les enseignes.`,
      },
      {
        ...GURVAN,
        heure: "08:15",
        texte:
          "Erwann, la 5 s'est encore arrêtée deux nuits la semaine dernière, et Yvonnick part à la retraite fin juin. Le trimestre, c'est janvier à mars : je veux ton plan vendredi. Comment on le tient, et comment on passe l'été.",
      },
      {
        ...YSEE,
        heure: "09:30",
        texte: `Le plan de janvier est creux après les fêtes : ${DEMANDE.janvier} heures de ligne par semaine sur la 5. Février monte à ${DEMANDE.fevrier}, et mars à ${DEMANDE.mars} avec les promotions de printemps de Celtis. Et je ne peux rien produire d'avance : trente jours de DLC, et les enseignes veulent les deux tiers à réception.`,
      },
      {
        ...YVONNICK,
        heure: "11:05",
        texte:
          "Il me reste six mois. Je veux bien montrer ce que je sais, mais il faut que quelqu'un soit à côté de moi pour le voir.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "matrice",
        titre: "Faire la matrice de polyvalence de l'atelier avec les chefs d'équipe",
        cout: 1,
        nature: "decisive",
        resultat: `Avec ${MAIXENT.de} et les deux autres chefs d'équipe, poste par poste : ${CONDUCTEURS} conducteurs, six lignes, quatre niveaux (1 : en formation ; 2 : conduit sous surveillance ; 3 : conduit seul, sans changer de format ni toucher aux réglages ; 4 : autonome, règle et change de format). Sur les lignes 1 à 4 et 6, de cinq à neuf conducteurs de niveau 4. Sur la thermoformeuse de la ligne 5, ${EXPERTS}, un par poste : Yvonnick le matin, Ursuline l'après-midi, Sidoine la nuit. Deux conducteurs sont au niveau 3 sur la 5 : ${ARTHAUD.de}, six ans de maison, qui règle déjà la thermoformeuse de la ligne 4, d'un autre modèle, et ${ZAINAB.de}, deux ans de maison, volontaire. Neuf conducteurs tiennent deux lignes au niveau 4. La matrice montre deux autres postes tenus par deux personnes seulement : la doseuse de fruits de la ligne 3 et la préparation des mix aromatisés de nuit.`,
      },
      {
        id: "arrets",
        titre: "Relever les absences et les arrêts de la ligne 5 sur un an",
        cout: 1,
        nature: "decisive",
        resultat: `L'hiver dernier, les trois experts ont manqué ${taux(TAUX_ABSENCE_HIVER, 0)} de leurs heures planifiées (maladie, accidents, formations, congés non remplacés) ; ${taux(TAUX_ABSENCE_PRINTEMPS, 0)} au printemps. La ligne tourne en 3×8 du lundi au vendredi : trois postes de ${HEURES_POSTE} heures par semaine. Quand l'expert d'un poste manque, un conducteur d'une autre ligne fait tourner la 5 à mi-cadence sans toucher aux réglages, trois postes sur quatre ; le quatrième, un changement de format tombe sur le poste, et la ligne s'arrête jusqu'au poste suivant. Une heure de production qui manque à la commande coûte ${euros(MARGE_HEURE)} de marge sur coût variable (${nombre(CADENCE, 0)} pots à ${nombre(MCV_POT, 2)} €) et ${euros(PENALITE_HEURE)} de pénalités logistiques : ${euros(COUT_RUPTURE_H)}. En janvier, le creux du plan absorbe une partie des heures perdues ; en mars, plus rien.`,
      },
      {
        id: "interim",
        titre: "Appeler l'agence d'intérim",
        cout: 0.5,
        nature: "utile",
        resultat: `${CASIMIR.de} : « Un conducteur qui connaît les thermoformeuses, j'en trouve un une fois sur deux à cette saison. Comptez ${euros(INTERIM.semaine)} la semaine, et la semaine ${INTERIM.arrivee} au plus tôt, après l'habilitation hygiène. Il aura conduit d'autres machines que la vôtre, sur d'autres formats. » ${ANNAIG.de} se souvient de l'intérimaire de la ligne 2, l'an dernier : deux lots bloqués en un mois, et parti à la fin de sa mission.`,
      },
      {
        id: "trs",
        titre: "Comparer le TRS de la ligne 5 à celui des autres lignes",
        cout: 1,
        nature: "bruit",
        resultat:
          "Taux de rendement synthétique de la ligne 5 sur l'année : 64 %, contre 61 à 69 % sur les autres lignes de Loudéac. Disponibilité, performance et qualité sont dans la moyenne ; les micro-arrêts du scellage aussi.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gurvan Kerebel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gurvan : « Avant d'acheter des heures, regarde qui pourrait apprendre, et quand. Janvier est creux ; mars ne le sera pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant vendredi ?",
    options: [
      {
        t: "Faire couvrir les absences par les trois experts, en heures supplémentaires et le samedi",
        d: `Jusqu'à ${HS_MAX} heures de ligne rattrapées par semaine : ${euros(COUT_RATTRAPAGE_H)} l'heure de ligne en heures majorées, et ${euros(COUT_SAMEDI)} chaque samedi ouvert.`,
      },
      {
        t: "Lancer deux binômes sur la ligne 5 dès la semaine 2, pendant le creux de janvier",
        d: `Arthaud avec Yvonnick, Zainab avec Ursuline, sur les vraies productions. Un remplaçant à mi-temps sur leur ligne d'origine : ${euros(REMPLACEMENT_BINOME)} par semaine chacun, et un peu de cadence perdue.`,
      },
      {
        t: "Demander à l'agence un intérimaire « qui connaît les thermoformeuses »",
        d: `${euros(INTERIM.semaine)} la semaine à partir de la semaine ${INTERIM.arrivee}, s'il y en a un de disponible.`,
      },
      {
        t: "Attendre le printemps pour recruter le remplaçant d'Yvonnick",
        d: "Rien à engager d'ici là. L'atelier fait avec ses trois experts.",
      },
    ],
    reactions: [
      [
        {
          ...SIDOINE,
          texte:
            "D'accord pour les heures. Mais ça fait trois ans que c'est « pour dépanner », et les samedis, on les fait toujours à trois.",
        },
      ],
      [
        {
          ...ARTHAUD,
          texte:
            "La thermoformeuse de la 4 et celle de la 5, ce n'est pas la même bête, mais le principe est le même. Ça fait deux ans que je demande à apprendre.",
        },
      ],
      null,
      [
        {
          ...GURVAN,
          texte: "Le printemps, c'est quand les promotions commencent. Et d'ici là ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les réglages qui ne sont écrits nulle part",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ANNAIG,
        heure: "10:20",
        alerte: true,
        texte:
          "Erwann, le lot bloqué de décembre venait d'une température de scellage réglée de mémoire, cinq degrés sous la consigne. Je propose qu'on verrouille les consignes de la thermoformeuse : seuls les trois experts y auraient accès.",
      },
      {
        de: "Tableau de bord de l'atelier",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Heures perdues faute de conducteur qualifié depuis le 1er janvier : ${ctx.perdues}. Taux de service de la ligne 5 cette semaine : ${ctx.service}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "changements",
        titre: "Regarder les trois derniers changements de format de la ligne 5",
        cout: 0.5,
        nature: "decisive",
        resultat: `Trois changements, trois façons de faire : 55 minutes pour Yvonnick, 80 pour Sidoine, 110 pour Ursuline, qui reprend deux fois le formage. Température de chauffe du film, pression de formage, température et temps de scellage : rien n'est écrit, chacun a ses repères. À Pontivy, ${FANCHON.de} a fait écrire avec la qualité des standards visuels de réglage pour la ligne 2 : la formation d'un conducteur y est passée de ${nombre(SEMAINES_DE_FORMATION, 0)} à ${nombre(SEMAINES_AVEC_STANDARDS, 0)} semaines de binôme, et les défauts de scellage ont été divisés par deux.`,
      },
      {
        id: "pms",
        titre: "Demander à Annaïg ce qu'exige le plan de maîtrise sanitaire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Annaïg : « Les paramètres de scellage doivent être validés et tracés, avec un contrôle d'étanchéité à chaque changement de format et toutes les heures. Verrouiller les consignes empêcherait les erreurs des non-experts ; mais un stagiaire qui ne peut pas toucher aux réglages ne peut plus que conduire, et il ne les apprendra jamais. »",
      },
    ],
    question: "Que faites-vous des réglages de la thermoformeuse ?",
    options: [
      {
        t: "Écrire avec la qualité les standards visuels de réglage de chaque format",
        d: `Une demi-journée par semaine pour chaque expert jusqu'à la semaine 6, pendant le creux : photos, consignes, points de contrôle du scellage, affichés au poste. ${euros(STANDARDS.cout)}, et un peu de cadence.`,
      },
      {
        t: "Demander aux experts de noter leurs réglages dans un cahier au poste",
        d: "Quand ils ont un moment. Rien à payer.",
      },
      {
        t: "Verrouiller les consignes de la thermoformeuse : seuls les trois experts y touchent",
        d: "Ce que propose la qualité. Plus de réglage de mémoire par un non-expert.",
      },
      {
        t: "Ne rien formaliser : le savoir passera de la main à la main",
        d: "Rien à changer.",
      },
    ],
    reactions: [
      [
        {
          ...URSULINE,
          texte:
            "En l'écrivant, on s'est rendu compte qu'on ne règle pas le formage pareil tous les trois. Maintenant, si : la fiche est au poste, avec les photos.",
        },
      ],
      [
        {
          ...YVONNICK,
          texte: "Un cahier, d'accord. Ce soir, je n'ai pas eu le temps.",
        },
      ],
      [
        {
          ...SIDOINE,
          texte: "Bon. Mais alors, qui me remplace quand je suis malade ?",
        },
      ],
      [
        {
          ...ANNAIG,
          texte: "Noté. Le prochain défaut de scellage, on en reparlera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Plus de responsabilités, même paie",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...DORINE,
        heure: "14:30",
        alerte: true,
        texte:
          "Les délégués demandent que la polyvalence soit reconnue dans la classification. On demande aux gens d'apprendre une deuxième ligne et de remplacer au pied levé, sans rien de plus sur la fiche de paie. Et les trois de la 5 font des heures depuis trois ans.",
      },
      {
        ...MAEWENN,
        heure: "16:00",
        texte:
          "Les négociations annuelles obligatoires se terminent fin février. Si tu as une proposition pour l'atelier, c'est maintenant.",
      },
      ...(ctx.binomes
        ? [
            {
              ...ZAINAB,
              heure: "17:40",
              texte:
                "J'aime bien apprendre la 5. Mais au vestiaire, on me demande ce que j'y gagne, et je ne sais pas quoi répondre.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "classification",
        titre: "Relire la classification, et ce qui s'est passé à Pontivy",
        cout: 0.5,
        nature: "decisive",
        resultat: `Dans la grille de l'atelier, rien ne distingue un conducteur qui tient deux lignes d'un conducteur qui en tient une. À Pontivy, depuis l'échelon « conducteur polyvalent » (${euros(ECHELON.mensuel)} par mois, après validation sur poste), les volontaires pour les formations ont doublé. Dans les ateliers du groupe sans reconnaissance, ${nombre(Math.round(ABANDON_SANS * 10), 0)} stagiaires sur dix quittent leur binôme avant la fin ; avec l'échelon, moins d'un sur dix. L'an dernier, une prime versée aux seuls experts de Pontivy a refroidi les candidats : « on forme pour que ce soient eux qui touchent ».`,
      },
      {
        id: "cout",
        titre: "Chiffrer l'échelon avec la DRH",
        cout: 0.5,
        nature: "utile",
        resultat: `${MAEWENN.de} : « ${euros(ECHELON.mensuel)} brut par mois et par conducteur, ${euros(ECHELON.semaine)} par semaine charges comprises. Les ${ECHELON.beneficiaires} qui tiennent déjà deux lignes, puis chaque nouveau qualifié : ${euros(COUT_ECHELON_TRIMESTRE)} par trimestre pour les ${ECHELON.beneficiaires}. Une prime exceptionnelle de ${euros(PRIME_EXPERTS.brut)} aux trois experts coûterait ${euros(PRIME_EXPERTS.charge)} charges comprises. »`,
      },
    ],
    question: "Que proposez-vous aux délégués ?",
    options: [
      {
        t: "Verser une prime exceptionnelle de 500 € aux trois experts de la ligne 5",
        d: `Pour leurs heures et leurs samedis. ${euros(PRIME_EXPERTS.charge)} charges comprises, en février.`,
      },
      {
        t: "Renvoyer la question aux négociations de l'an prochain",
        d: "Rien à payer cette année.",
      },
      {
        t: "Créer un échelon « conducteur polyvalent » pour qui tient deux lignes, après validation sur poste",
        d: `${euros(ECHELON.mensuel)} par mois : les ${ECHELON.beneficiaires} qui tiennent déjà deux lignes, puis chaque nouveau qualifié.`,
      },
    ],
    reactions: [
      [
        {
          ...DORINE,
          texte:
            "Une prime pour les trois, rien pour ceux qui apprennent ou qui tiennent déjà deux lignes. Au vestiaire, c'est ce qu'on a retenu.",
        },
      ],
      [
        {
          ...DORINE,
          texte: "On en reparlera l'an prochain, alors. Les gens retiendront la réponse.",
        },
      ],
      [
        {
          ...DORINE,
          texte:
            "C'est la première fois qu'on reconnaît ceux qui tiennent deux lignes. Trois conducteurs m'ont déjà demandé comment entrer en binôme.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Ursuline s'arrête trois semaines",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...URSULINE,
        heure: "07:50",
        alerte: true,
        texte:
          "Erwann, mon opération du genou est avancée : je suis arrêtée trois semaines à partir de lundi. Je suis désolée de vous laisser l'après-midi en février.",
      },
      {
        de: "Tableau de bord de l'atelier",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Février : ${DEMANDE.fevrier} heures de ligne par semaine à produire. Heures perdues faute de conducteur qualifié depuis janvier : ${ctx.perdues}. Taux de service de la ligne cette semaine : ${ctx.service}.`,
      },
      {
        ...YSEE,
        heure: "18:20",
        texte: `Fanchon peut prendre ${TRANSFERT.heures} heures par semaine de yaourts MDD sur une ligne de Pontivy, à ${euros(TRANSFERT.coutHeure)} l'heure de surcoût, transport Kerfroid compris. Dis-moi lundi.`,
      },
    ],
    sources: [
      {
        id: "binomes",
        titre: "Faire le point sur les binômes avec Yvonnick et Ursuline",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.binomes
            ? `Yvonnick : « Arthaud a fait ${ctx.chemin1} du chemin. ${ctx.pret1 ? "Il fait ses changements de format seul ; je regarde et je ne dis presque plus rien." : "Il conduit bien, il règle encore avec moi à côté."} » Ursuline : « Zainab, ${ctx.chemin2}. ${ctx.parti2 ? "Elle est retournée sur la 6." : ctx.pret2 ? "Elle sait faire, il lui manque de la bouteille." : "Elle progresse, mais seule, pas encore."} » Un conducteur tient seul un poste entier, changements de format compris, au-delà de la moitié du chemin, à peu près ; avant, la ligne tourne à mi-cadence avec lui comme sans lui.`
            : "Il n'y a pas de binôme sur la 5 : à part Yvonnick, Ursuline et Sidoine, personne n'a jamais changé un format sur la thermoformeuse. L'après-midi tournera à mi-cadence, ou en heures supplémentaires.",
      },
      {
        id: "heures",
        titre: "Regarder ce que permettent les horaires des deux experts restants",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Yvonnick et Sidoine peuvent monter à 48 heures par semaine, le maximum légal : ${HS_ARRET} heures de ligne rattrapées par semaine, à ${euros(COUT_RATTRAPAGE_H)} l'heure de ligne en heures majorées, plus ${euros(COUT_SAMEDI)} chaque samedi ouvert. Depuis janvier, les experts ont déjà rattrapé ${ctx.heuresSup} en heures supplémentaires, et la durée moyenne de 44 heures sur douze semaines s'applique aussi.`,
      },
    ],
    question: "Comment tenez-vous l'après-midi pendant trois semaines ?",
    options: [
      {
        t: "Confier l'après-midi au stagiaire le plus avancé, avec les standards au poste et Yvonnick joignable",
        d: `Un remplaçant à plein temps sur sa ligne d'origine : ${euros(REMPLACEMENT_RELAIS)} par semaine. S'il n'y a pas de stagiaire, l'après-midi tourne à mi-cadence.`,
      },
      {
        t: "Faire monter Yvonnick et Sidoine à 48 heures pour couvrir l'après-midi",
        d: `${HS_ARRET} heures de ligne rattrapées par semaine, en heures majorées, et des samedis.`,
      },
      {
        t: `Organiser la mi-cadence l'après-midi et transférer ${TRANSFERT.heures} heures par semaine à Pontivy`,
        d: `Plus de changement de format l'après-midi : la ligne ralentit, elle ne s'arrête plus. Le transfert coûte ${euros(COUT_TRANSFERT_SEMAINE)} par semaine.`,
      },
      {
        t: "Laisser tourner l'après-midi à mi-cadence avec un conducteur de la ligne 4",
        d: "Comme d'habitude quand un expert manque.",
      },
    ],
    reactions: [
      [
        {
          ...MAIXENT,
          texte:
            "Le planning de l'après-midi est refait pour trois semaines. La fiche de réglage est au poste, et le numéro d'Yvonnick aussi.",
        },
      ],
      [
        {
          ...SIDOINE,
          texte: "48 heures, de nuit, trois semaines. On le fera. Ne me demandez pas de sourire.",
        },
      ],
      [
        {
          ...FANCHON,
          texte: `${TRANSFERT.heures} heures par semaine, c'est calé avec Ysée. Le premier camion Kerfroid part lundi.`,
        },
      ],
      [
        {
          ...MAIXENT,
          texte:
            "Comme d'habitude, alors. On va encore perdre les changements de format de l'après-midi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Cinq semaines de mars",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...YSEE,
        heure: "09:10",
        alerte: true,
        texte: `Mars arrive : ${DEMANDE.mars} heures de ligne par semaine sur la 5 avec les promotions de printemps, et Celtis exige ${taux(TAUX_SERVICE_EXIGE)} de taux de service. Comment tu tiens les cinq dernières semaines ?`,
      },
      {
        de: "Tableau de bord de l'atelier",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Heures rattrapées en heures supplémentaires depuis janvier : ${ctx.heuresSup}. Lots bloqués depuis janvier : ${ctx.lots}. Taux de service de la ligne cette semaine : ${ctx.service}.`,
      },
      {
        ...GURVAN,
        heure: "18:30",
        texte:
          "Si tu as besoin de samedis jusqu'à fin mars, je te les signe. Dis-moi ce que tu veux.",
      },
    ],
    sources: [
      {
        id: "compteurs",
        titre: "Lire les compteurs d'heures et les défauts de réglage de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sept défauts de scellage sur dix, l'an dernier, sont survenus après la neuvième heure de travail ou sur un changement de format fait par quelqu'un qui ne le faisait pas d'habitude. Depuis janvier, les experts ont rattrapé ${ctx.heuresSup} en heures supplémentaires. Un samedi ouvert coûte ${euros(COUT_SAMEDI)} avant la première heure produite : nettoyage en place, énergie, un cariste, un laborantin. Et sur la 5, un changement de format sur quatre tombe aujourd'hui sur un poste où il n'y a personne pour le faire : la ligne s'arrête.`,
      },
      {
        id: "series",
        titre: "Demander à Ysée ce que coûterait d'allonger les séries",
        cout: 0.5,
        nature: "utile",
        resultat: `Ysée : « Deux changements de format par semaine au lieu de cinq : moins de réglages, mais des yaourts qui attendent en chambre froide. Avec trente jours de DLC et les deux tiers exigés à réception, une partie partira en déclassement, chez un déstockeur ou en dons aux associations : environ ${euros(DECLASSEMENT_SEMAINE)} par semaine. »`,
      },
    ],
    question: "Comment organisez-vous mars ?",
    options: [
      {
        t: "Planifier un samedi de rattrapage chaque semaine jusqu'à fin mars",
        d: `Majoré, avec les experts. ${euros(COUT_SAMEDI)} par samedi ouvert, plus les heures.`,
      },
      {
        t: "Arrêter les heures systématiques, et regrouper les changements de format sur les postes où un qualifié est présent, faits par les stagiaires sous son contrôle",
        d: "Plus de changement de format sur un poste découvert. Les stagiaires règlent, l'expert vérifie.",
      },
      {
        t: "Allonger les séries : deux changements de format par semaine au lieu de cinq",
        d: `Moins de réglages, plus de stock en chambre froide : environ ${euros(DECLASSEMENT_SEMAINE)} de déclassement par semaine.`,
      },
      {
        t: "Ne rien changer",
        d: "On continue comme en février.",
      },
    ],
    reactions: [
      [
        {
          ...SIDOINE,
          texte:
            "Encore des samedis. On m'a proposé un poste de jour ailleurs, vous savez. Je n'ai pas encore répondu.",
        },
      ],
      [
        {
          ...MAIXENT,
          texte:
            "Changements de format le matin et la nuit, avec un qualifié au poste : ça se planifie. Ceux qui apprennent règlent, les experts regardent.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Séries longues à partir de lundi. Je préviens le service clients pour les dates courtes.",
        },
      ],
      [
        {
          ...MAIXENT,
          texte: "On continue comme en février.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Préparer l'été sans Yvonnick",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...MAEWENN,
        heure: "11:00",
        alerte: true,
        texte:
          "Yvonnick a confirmé son départ en retraite au 30 juin. Qu'est-ce que tu prévois pour la ligne 5 : on lance un recrutement ?",
      },
      {
        ...GURVAN,
        heure: "14:20",
        texte: `Le deuxième trimestre commence dans trois semaines, et c'est la pleine saison. Au tableau de bord, la 5 compte ${ctx.qualifies} conducteurs capables de la régler, la part autonome des stagiaires comprise. Sur qui on compte au printemps ?`,
      },
    ],
    sources: [
      {
        id: "printemps",
        titre: "Chiffrer ce que les absences coûteront au deuxième trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: `Au printemps, les experts manquent ${taux(TAUX_ABSENCE_PRINTEMPS, 0)} de leurs heures : sur treize semaines et trois postes de ${HEURES_POSTE} heures, ${nombre(HEURES_PERDUES_PRINTEMPS, 0)} heures de production perdues si personne ne peut les remplacer, soit ${kE(COUT_ABSENCES_PRINTEMPS)} à ${euros(COUT_RUPTURE_H)} l'heure en pleine saison. Un conducteur de plus capable de régler la ligne en évite ${taux(COUVERTURE[0], 0)}, ${kE(VALEUR_RANG[0]!)} ; un deuxième, ${taux(COUVERTURE[1], 0)}, ${kE(VALEUR_RANG[1]!)} : deux absences en même temps sont rares. Un conducteur formé que personne n'a habilité ne sera pas mis seul sur un poste : il n'évitera que ${taux(NON_HABILITE, 0)} de ces heures.`,
      },
      {
        id: "recrutement",
        titre: "Demander à la DRH ce que donnerait un recrutement externe",
        cout: 0.5,
        nature: "utile",
        resultat: `${MAEWENN.de} : « Un cabinet : ${euros(RECRUTEMENT.cabinet)}, quatre mois, et moins d'une chance sur deux de trouver un conducteur de thermoformeuse dans le centre Bretagne avant juin. S'il vient, il arrive en juin, et il lui faudra apprendre nos formats. »`,
      },
    ],
    question: "Que prévoyez-vous pour le printemps ?",
    options: [
      {
        t: "Habiliter les stagiaires par un changement de format complet validé par la qualité, et les inscrire au planning du printemps",
        d: `${euros(HABILITATION)} par stagiaire, le temps de la qualité et d'un expert, en semaines 11 et 12.`,
      },
      {
        t: "Lancer le recrutement d'un conducteur expérimenté pour remplacer Yvonnick",
        d: `${euros(RECRUTEMENT.cabinet)} de cabinet. Arrivée possible en juin.`,
      },
      {
        t: "Mettre dès la semaine 11 le stagiaire le plus avancé seul au poste de nuit, sans attendre d'habilitation",
        d: "Sidoine passe de jour pour couvrir les absences. Rien à payer.",
      },
      {
        t: "Ne rien prévoir de particulier",
        d: "On verra en juin.",
      },
    ],
    reactions: [
      [
        {
          ...ANNAIG,
          texte:
            "Je ferai les habilitations avec Yvonnick : un changement de format complet, contrôle d'étanchéité compris. Ceux qui réussissent entrent dans la matrice au niveau 4.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte:
            "L'annonce part lundi. Les profils de thermoformage sont rares dans le centre Bretagne.",
        },
      ],
      [
        {
          ...ANNAIG,
          texte:
            "Seul la nuit, sans habilitation, sur une ligne qui scelle des yaourts ? Je renforce les contrôles d'étanchéité, et je note mon désaccord.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "On verra en juin, donc. Yvonnick, lui, partira le 30.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Transmettre pendant le creux", chemin: [1, 0, 2, 0, 1, 0] },
  { nom: "Heures sup et recrutement", chemin: [0, 3, 0, 1, 0, 1] },
  { nom: "Attentiste", chemin: [3, 3, 1, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier quand un savoir-faire tient à quelques personnes : faire faire des
 * heures supplémentaires aux experts, chercher un intérimaire « qui connaît la machine », ou
 * attendre le départ en retraite pour recruter. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [0, 3],
  [3, 1],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  interimTrouve: `J'ai votre conducteur : huit ans sur des thermoformeuses dans une usine de desserts du Finistère, sur une autre marque de machine. Il commence en semaine ${INTERIM.arrivee}, après l'habilitation hygiène.`,
  interimAbsent:
    "Désolé : personne de disponible qui connaisse les thermoformeuses avant le printemps. Je vous rappelle si un profil se libère.",
} as const;
