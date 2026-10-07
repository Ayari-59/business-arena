/**
 * LES APPELS D'OFFRES EN RAFALE — le contenu de l'épisode.
 *
 * Florimond Vannier est associé d'Atlas Conseil, responsable de la practice
 * Organisation et transformation au bureau de Rennes : des collectivités, des
 * hôpitaux, des organismes publics. En janvier, les budgets votés, douze
 * consultations tombent en six semaines. Quatre seniors, quatorze
 * consultants, dont sept en intercontrat : l'équipe ne peut pas toutes les
 * faire bien. Six décisions, chacune précédée de ce qu'un associé reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent se recalcule depuis les constantes du modèle ; le test le vérifie.
 *
 * Cabinet, acheteurs, personnes et chiffres sont fictifs.
 */
import {
  AN_DERNIER,
  CAPACITE,
  COUT_JOUR,
  DILUTION,
  JOURS,
  JOURS_REPRISE,
  MONTANT_DES_DOUZE,
  PART_GROUPEMENT,
  PRIX,
  RATIO_COUT,
  RATIO_COUT_JUNIOR,
  REFERE,
  RENFORT,
  TJM,
  TJM_PUBLIC,
  marche,
} from "@/engine/episodes/appels-d-offres-en-rafale";
import { euros, kE, nombre } from "./format";
import type { Etape } from "./types";

const STERENN = { de: "Sterenn Le Scao", role: "Responsable des propositions" } as const;
const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const KATELL = { de: "Katell Jaouen", role: "Manager, Organisation et transformation" } as const;
const GOULVEN = { de: "Goulven Prigent", role: "Directeur de mission" } as const;
const SEFORA = { de: "Sefora Abergel", role: "Manager, Organisation et transformation" } as const;
const AZILIZ = { de: "Aziliz Coadou", role: "Consultante senior" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const KONAN = {
  de: "Konan Bodiguel",
  role: "Directeur général des services, Vilaine Métropole",
} as const;
const RIWAL = { de: "Riwal Morvézen", role: "Gérant de Penhors Études" } as const;

/** Un TJM, à l'euro. */
const tjm = (ratio: number) => `${Math.round(TJM_PUBLIC * ratio)} €`;
/** La marge d'un marché sur toute sa durée, à un prix donné. */
const margeA = (id: string, prix: number, ratio = RATIO_COUT) =>
  kE(marche(id).montant * (prix - ratio));
const KERMELIN = marche("kermelin");
const DECHETS = marche("dechets");
const METROPOLE = marche("metropole");

export const DIAGNOSTICS = [
  {
    id: "selection",
    t: "Nous répondons à trop d'appels d'offres avec trop peu de temps de seniors : les mémoires se diluent et le taux de transformation s'effondre. Il faut choisir où répondre",
  },
  {
    id: "seniors",
    t: "Il manque des seniors pour écrire les mémoires : l'équipe est trop petite pour le volume d'appels d'offres",
  },
  {
    id: "prix",
    t: "Nous perdons sur le prix : les concurrents cassent les TJM sur les marchés publics",
  },
  {
    id: "sortants",
    t: "Les marchés publics sont joués d'avance pour les sortants : on ne gagne que chez nos clients",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Douze appels d'offres en six semaines",
    jusqua: 2,
    messages: () => [
      {
        ...STERENN,
        heure: "08:10",
        alerte: true,
        texte: `Florimond, la veille des marchés publics de janvier est tombée : douze consultations pour la practice d'ici mi-février, ${nombre(MONTANT_DES_DOUZE / 1e6)} M€ en tout. Cinq dossiers de consultation sont en ligne, les autres sont annoncés. Les premières remises sont dans quatre semaines : il me faut ta liste, et vite.`,
      },
      {
        ...VICTOIRE,
        heure: "08:45",
        texte:
          "Les budgets publics sont votés : c'est maintenant que le carnet de l'année se remplit. Rennes a fini l'an dernier à 68 % d'occupation pour une cible de 75 %. Je compte sur toi pour faire du volume ce trimestre.",
      },
      {
        ...KATELL,
        heure: "09:30",
        texte:
          "Sept consultants sont en intercontrat jusqu'en mars : ils peuvent écrire. En revanche, Goulven, Sefora et moi sommes à 90 % sur nos missions jusqu'en avril.",
      },
      {
        ...PRUNE,
        heure: "10:05",
        texte:
          "Pour mémoire, le comité de direction juge les marchés publics du trimestre sur la marge des marchés gagnés, sur toute leur durée, moins le coût des réponses.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tempora",
        titre: "Reprendre dans Tempora le bilan des réponses de l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat: `${AN_DERNIER.reponses} réponses à des marchés publics, ${AN_DERNIER.gagnes} marchés gagnés. Elles ont pris ${AN_DERNIER.seniors + AN_DERNIER.consultants} jours d'avant-vente : ${AN_DERNIER.seniors} jours de managers et d'associés, ${AN_DERNIER.consultants} jours de consultants, que le contrôle de gestion impute à ${COUT_JOUR.senior} € et ${COUT_JOUR.consultant} € par jour. Sur les ${AN_DERNIER.pilotees} réponses pilotées par un senior (plus de trois jours de manager ou d'associé), ${AN_DERNIER.gagneesPilotees} gagnées ; sur les ${AN_DERNIER.reponses - AN_DERNIER.pilotees} écrites par les consultants à partir de la bibliothèque de mémoires, ${AN_DERNIER.gagnes - AN_DERNIER.gagneesPilotees === 1 ? "une seule" : AN_DERNIER.gagnes - AN_DERNIER.gagneesPilotees}.`,
      },
      {
        id: "rapports",
        titre: "Relire les rapports d'analyse des offres perdues l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les ${AN_DERNIER.reponses - AN_DERNIER.gagnes} marchés perdus, l'attributaire était plus cher que nous 9 fois. En moyenne, nous lui rendions 6,5 points sur 60 en note technique, et lui en reprenions 0,8 sur 40 en note prix. Les mémoires écrits par les consultants ont eu 34 sur 60 en moyenne, ceux pilotés par un senior 43. Les acheteurs relèvent les mêmes défauts : méthodologie générique, équipe non nommée, planning sans lien avec leur calendrier. Et en mars, quand l'équipe menait plus de six réponses de front, chaque réponse de plus coûtait environ ${nombre(DILUTION * 60)} point de note technique à toutes les autres.`,
      },
      {
        id: "grille",
        titre: "Passer les douze consultations à la grille go/no-go de la practice",
        cout: 1,
        nature: "utile",
        resultat:
          "La grille pose trois questions : avons-nous des références sur ce sujet, l'acheteur nous connaît-il, avons-nous vu le besoin avant l'avis ? Cinq consultations cochent au moins deux cases : le CH de Kermelin (références, client), le SDIS (les trois), Argoat-Lié (références, rédacteur du cahier des charges rencontré en novembre), le CCAS de Pontcallec (références, rédactrice rencontrée), l'OPH Ker Avel (références, client). Ailleurs : Vilaine Métropole, Kéroual Consulting est le titulaire sortant depuis 2021 ; le Département et le syndicat des eaux, ce n'est pas notre métier (évaluation de politiques publiques, systèmes d'information) ; la MDPH et Saint-Kerlan notent le prix pour moitié ; au GHT Rance-Argoat, Halden est le sortant ; au port de Kerhuel, aucune référence.",
      },
      {
        id: "tjm",
        titre: "Comparer nos TJM à ceux de Halden et de Kéroual",
        cout: 1,
        nature: "bruit",
        resultat: `Sur leurs marchés publics récents, Halden Partners affiche des TJM moyens de 700 à 760 €, Kéroual Consulting de 790 à 840 € ; nous sommes à ${TJM_PUBLIC} €. La presse spécialisée parle d'une guerre des prix dans le conseil au secteur public.`,
      },
      {
        id: "eulalie",
        titre: "Demander conseil à Anaïg Trévidic, associée à Nantes",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Anaïg : « À Nantes, on a cessé de répondre à tout il y a deux ans. Avant de lancer une réponse, regarde ce qu'elle t'a coûté l'an dernier, et ce qui fait gagner les autres. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle liste donnez-vous à Sterenn ?",
    options: [
      {
        t: "Répondre aux douze, avec des mémoires standardisés et des prix serrés, pour faire du volume",
        d: `Douze réponses écrites par les consultants à partir de la bibliothèque, relues par les seniors. Le TJM passe de ${TJM_PUBLIC} à ${tjm(PRIX.serre)}.`,
      },
      {
        t: "Passer les douze à la grille go/no-go, et ne répondre qu'aux cinq où nous avons un avantage",
        d: "Kermelin, le SDIS, Argoat-Lié, le CCAS de Pontcallec, Ker Avel, au prix habituel. Un courrier aux sept autres acheteurs pour décliner.",
      },
      {
        t: "Répondre aux six plus gros marchés, au prix habituel",
        d: "Vilaine Métropole, Kermelin, le GHT, le Département, Argoat-Lié et le SDIS : 1,55 M€ en jeu.",
      },
      {
        t: "Répondre au fil de l'eau, tant que l'équipe a du temps",
        d: "Comme l'an dernier : chaque dossier est pris par qui est disponible, dans l'ordre d'arrivée. Les huit premiers devraient passer.",
      },
    ],
    reactions: [
      [
        {
          ...AZILIZ,
          texte:
            "On a ouvert douze dossiers dans la bibliothèque de mémoires. On adapte le nom du client et le contexte, et on enchaîne.",
        },
      ],
      [
        {
          ...STERENN,
          texte:
            "Les sept courriers sont partis. Deux acheteurs m'ont répondu, déçus mais contents qu'on le dise tôt. On a cinq réponses à faire, et à faire bien.",
        },
      ],
      [
        {
          ...VICTOIRE,
          texte: "Six gros marchés : voilà qui ressemble à de l'ambition. Tiens-moi au courant.",
        },
      ],
      [
        {
          ...KATELL,
          texte:
            "Les consultants prennent les dossiers dans l'ordre d'arrivée. On verra où on en est en février.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le dossier de Vilaine Métropole",
    jusqua: 3,
    messages: (ctx) => [
      {
        ...STERENN,
        heure: "11:20",
        alerte: true,
        texte: `Le dossier de Vilaine Métropole est en ligne : ${kE(METROPOLE.montant)}, quatorze mois, l'accompagnement de la fusion de six directions. Remise en semaine ${METROPOLE.remise}.${
          ctx.metropoleRetenue
            ? " Elle est sur notre liste : je lance la réponse ?"
            : " Tu l'avais écartée sur l'annonce, mais la présidente m'en a déjà parlé deux fois."
        }`,
      },
      {
        ...VICTOIRE,
        heure: "14:00",
        texte:
          "C'est le plus gros marché de conseil de la région cette année. Une métropole comme référence, ça ouvre toutes les portes. On y va ?",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dce",
        titre: "Lire le cahier des charges et le règlement de consultation",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le cahier des charges impose « la démarche Cap Fusion en quatre temps » : c'est, mot pour mot, celle de la plaquette de Kéroual Consulting, titulaire du marché précédent. La valeur technique pèse 60 %, dont 20 points pour « au moins trois accompagnements de fusion de communautés depuis 2022 » : nous en avons un. Un autre sous-critère note « la connaissance des outils de pilotage existants de la collectivité », que Kéroual a construits.",
      },
      {
        id: "historique",
        titre: "Regarder qui a gagné les marchés de conseil de la Métropole",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Kéroual Consulting a gagné trois des quatre derniers marchés de conseil de la Métropole, le quatrième est allé à Halden. Le directeur général des services, Konan Bodiguel, est arrivé en septembre : il ne connaît pas encore les cabinets de la région, et son plan de mandat annonce plusieurs chantiers d'organisation au printemps.",
      },
    ],
    question: "Que faites-vous du marché de la Métropole ?",
    options: [
      {
        t: "Répondre à fond : c'est le plus gros marché de l'année",
        d: `Vous et Katell pilotez. ${JOURS.fond.senior} jours de seniors et ${JOURS.fond.consultant} jours de consultants, soutenance comprise.`,
      },
      {
        t: "Décliner, et demander un rendez-vous au nouveau directeur général des services",
        d: "Une journée de senior pour préparer et tenir le rendez-vous. Pas de marché ce trimestre.",
      },
      {
        t: "Répondre avec un mémoire type, pour se faire connaître",
        d: `${JOURS.type.senior} jour de senior et ${JOURS.type.consultant} jours de consultants.`,
      },
      {
        t: "Poser une question écrite sur le critère des références, et répondre à fond s'il est élargi",
        d: "Une demi-journée pour la question. L'acheteur répond à tous les candidats sur le profil d'acheteur ; il peut ne rien changer.",
      },
    ],
    reactions: [
      [
        {
          ...GOULVEN,
          texte:
            "On s'y met. Katell confie deux comités de pilotage de sa mission à Sefora pour libérer du temps.",
        },
      ],
      [
        {
          ...KONAN,
          texte:
            "Volontiers, venez me voir en semaine 4. Je ne vous cache pas que j'ai plusieurs chantiers d'organisation à lancer au printemps.",
        },
      ],
      [
        {
          ...AZILIZ,
          texte: "Le mémoire type de la Métropole est en route. Il sera déposé en semaine 6.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Qui écrit les mémoires ?",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...KATELL,
        heure: "09:15",
        alerte: true,
        texte: `${ctx.nbReponses} réponses en cours, et les remises s'enchaînent de la semaine 5 à la semaine 11. Les consultants en intercontrat peuvent tout écrire à partir de la bibliothèque ; on relira la veille de chaque remise. Ou alors l'un de nous pilote chaque réponse, mais il faudra le prendre quelque part.`,
      },
      {
        ...AZILIZ,
        heure: "16:40",
        texte:
          "Pour le CCAS de Pontcallec, la directrice nous avait parlé de ses difficultés en novembre. Le mémoire type n'en dit rien. Quelqu'un peut m'aider à le réécrire ?",
      },
    ],
    sources: [
      {
        id: "notes",
        titre: "Comparer les notes techniques de l'an dernier selon qui a écrit le mémoire",
        cout: 0.5,
        nature: "decisive",
        resultat: `Mémoires écrits par les consultants et relus la veille : 34 sur 60 en moyenne, ${AN_DERNIER.gagnes - AN_DERNIER.gagneesPilotees} marché gagné sur ${AN_DERNIER.reponses - AN_DERNIER.pilotees}. Mémoires pilotés par un manager ou un associé (une méthodologie écrite pour ce client, une équipe nommée avec ses CV, une soutenance préparée) : 43 sur 60, ${AN_DERNIER.gagneesPilotees} sur ${AN_DERNIER.pilotees}. Un pilotage prend ${JOURS.pilote.senior} jours de senior et ${JOURS.pilote.consultant} de consultant par réponse ; un mémoire type, ${JOURS.type.senior} et ${JOURS.type.consultant}.`,
      },
      {
        id: "charge",
        titre: "Faire le plan de charge des seniors dans Tempora",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Il reste ${ctx.resteSenior} de temps commercial aux quatre seniors d'ici la semaine 11, et ${CAPACITE.consultant} jours d'intercontrat aux consultants pour le trimestre. Piloter les ${ctx.nbRetenues} réponses retenues demanderait ${ctx.pilotage} jours de seniors en tout${ctx.metropole}. Au-delà du temps commercial, chaque jour est pris sur une mission facturable : ${euros(TJM.senior)} de TJM qu'on ne facture pas pour un senior, ${euros(TJM.consultant)} pour un consultant.`,
      },
      {
        id: "freelancia",
        titre: "Demander un devis à Freelancia",
        cout: 0.5,
        nature: "utile",
        resultat: `Des indépendants rompus aux marchés publics, à 700 € par jour, quatre jours par mémoire : ${nombre(JOURS.freelance.cash)} € par réponse. Ils ne connaissent ni nos références ni nos clients ; un manager doit relire.`,
      },
    ],
    question: "Comment écrivez-vous les mémoires ?",
    options: [
      {
        t: "Les consultants en intercontrat écrivent à partir de la bibliothèque, les seniors relisent la veille",
        d: `${JOURS.type.senior} jour de senior et ${JOURS.type.consultant} jours de consultant par réponse. L'intercontrat est déjà payé.`,
      },
      {
        t: "Un manager ou un associé pilote chaque réponse : méthodologie propre au client, équipe nommée, soutenance préparée",
        d: `${JOURS.pilote.senior} jours de senior et ${JOURS.pilote.consultant} jours de consultant par réponse.`,
      },
      {
        t: "Confier la rédaction à des indépendants de Freelancia, relus par un manager",
        d: `${nombre(JOURS.freelance.cash)} € par mémoire, et un jour de senior.`,
      },
      {
        t: "Piloter les deux plus gros dossiers, et le mémoire type pour les autres",
        d: `${JOURS.pilote.senior} jours de senior sur les deux plus gros, ${JOURS.type.senior} sur les autres.`,
      },
    ],
    reactions: [
      [
        {
          ...AZILIZ,
          texte:
            "On reprend les mémoires de l'an dernier. Pour Pontcallec, j'ai mis ce que je savais, sans savoir si c'est ce qu'ils attendent.",
        },
      ],
      [
        {
          ...SEFORA,
          texte:
            "J'ai pris Pontcallec et Ker Avel. J'ai appelé nos références pour avoir des chiffres, et nommé l'équipe : ça change le ton du mémoire.",
        },
      ],
      [
        {
          ...KATELL,
          texte:
            "Les premiers mémoires de Freelancia sont arrivés : propres, bien construits, et on pourrait les envoyer à n'importe quel client.",
        },
      ],
      [
        {
          ...GOULVEN,
          texte:
            "Je pilote les deux gros. Pour les autres, les consultants font au mieux avec la bibliothèque.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Halden casse les prix à Kermelin",
    jusqua: 7,
    messages: () => [
      {
        ...GOULVEN,
        heure: "10:30",
        alerte: true,
        texte:
          "J'ai croisé le directeur de Halden Partners aux rencontres des achats hospitaliers : ils répondent à Kermelin, et ils annoncent partout des TJM autour de 700 €. On remet dans deux semaines.",
      },
      {
        ...VICTOIRE,
        heure: "12:10",
        texte:
          "Kermelin est notre client depuis 2023. On ne va pas le perdre pour 15 %. Aligne-toi.",
      },
    ],
    sources: [
      {
        id: "formule",
        titre: "Simuler la note avec la formule du règlement de consultation",
        cout: 0.5,
        nature: "decisive",
        resultat: `Kermelin note la valeur technique sur 60 et le prix sur 40 : le prix le plus bas a 40, les autres 40 × (prix le plus bas / leur prix). Si Halden est 15 % sous nous, il nous reprend 6 points sur le prix ; s'aligner les rattrape, pas un de plus. Halden ne connaît pas l'hôpital : ses mémoires ont eu 38 à 41 sur 60 dans les hôpitaux de la région. Deux jours d'associé de plus sur notre mémoire (l'équipe nommée, un planning calé sur leurs services, les risques et leurs parades) valent environ ${nombre(RENFORT * 60)} points de note technique.`,
      },
      {
        id: "marge",
        titre: "Recalculer la marge du marché à chaque prix",
        cout: 0.5,
        nature: "utile",
        resultat: `Un jour produit sur ce marché coûte ${Math.round(RATIO_COUT * TJM_PUBLIC)} € (un quart de seniors, trois quarts de consultants). Sur ${kE(KERMELIN.montant)} au prix habituel, la marge du marché est de ${margeA("kermelin", 1)} ; alignés sur Halden (TJM de ${tjm(PRIX.aligne)}), ${margeA("kermelin", PRIX.aligne)}. Avec une équipe plus junior, 18 % moins chère, un jour coûte ${Math.round(RATIO_COUT_JUNIOR * TJM_PUBLIC)} € : ${margeA("kermelin", PRIX.junior, RATIO_COUT_JUNIOR)}, mais les CV pèsent dans la note technique.`,
      },
    ],
    question: "Quel prix remettez-vous à Kermelin ?",
    options: [
      {
        t: "S'aligner sur Halden : 15 % sous notre prix",
        d: `Le TJM moyen passe à ${tjm(PRIX.aligne)}. Le mémoire part tel qu'il est.`,
      },
      {
        t: "Garder notre prix, et mettre deux jours d'associé de plus sur le mémoire",
        d: "L'équipe nommée avec ses CV, un planning calé sur les services de l'hôpital, les risques et leurs parades.",
      },
      {
        t: "Garder notre prix, et remettre le mémoire tel qu'il est",
        d: "Rien ne change.",
      },
      {
        t: "Proposer une équipe plus junior, 18 % moins chère",
        d: `Plus d'analystes, un manager à mi-temps. Le TJM moyen passe à ${tjm(PRIX.junior)}.`,
      },
    ],
    reactions: [
      [
        {
          ...GOULVEN,
          texte: `Offre remise à ${tjm(PRIX.aligne)} de TJM moyen. Il faudra tenir le planning avec ce budget-là, si on gagne.`,
        },
      ],
      [
        {
          ...KATELL,
          texte:
            "Le mémoire est remis. On a nommé l'équipe, calé le planning sur la fermeture estivale des admissions, et mis nos chiffres de Quimperlé en référence.",
        },
      ],
      [
        {
          ...STERENN,
          texte: "Offre de Kermelin déposée sur le profil d'acheteur, au prix habituel.",
        },
      ],
      [
        {
          ...SEFORA,
          texte:
            "Offre remise. Je serai à mi-temps sur le projet, avec trois analystes qui sortent d'école. Ils sont bons, mais ils n'ont jamais vu un hôpital.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Un treizième appel d'offres",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...STERENN,
        heure: "09:00",
        alerte: true,
        texte: `Vilaine Métropole publie une procédure adaptée : ${DECHETS.objet}, ${kE(DECHETS.montant)}. Remise en semaine ${DECHETS.remise}, trois semaines seulement.${
          ctx.amont ? " C'est le chantier dont Konan Bodiguel vous avait parlé en semaine 4." : ""
        }`,
      },
      {
        ...KATELL,
        heure: "11:30",
        texte: `${ctx.nbReponses} réponses remises ou en cours, et il nous reste ${ctx.resteSenior} de temps commercial. Si on y va, il faut savoir qui le prend.`,
      },
    ],
    sources: [
      {
        id: "charge2",
        titre: "Refaire le plan de charge des seniors",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Il reste ${ctx.resteSenior} de temps commercial aux seniors d'ici la semaine 11, dont ${ctx.engage} déjà promis aux réponses en cours. Un pilotage prend ${JOURS.pilote.senior} jours de senior, un mémoire type ${JOURS.type.senior}, un groupement ${JOURS.groupement.senior} (la coordination avec le partenaire). Au-delà, chaque jour de senior est pris sur une mission facturable, à ${euros(TJM.senior)} ; et une mission dont on prend les gens finit par glisser.`,
      },
      {
        id: "besoin",
        titre: "Relire ce que l'on sait du besoin de la Métropole",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.amont
            ? "Vos notes du rendez-vous de la semaine 4 : la collecte a changé trois fois de chef de service en deux ans, les tournées sont refaites à la main, les agents attendent un diagnostic qui les écoute. La directrice de la collecte a rédigé le cahier des charges : vous l'avez rencontrée ce jour-là."
            : "Vous n'avez jamais rencontré la Métropole. Le cahier des charges tient en quatre pages et ne dit pas ce qui compte pour elle ; Kéroual, qui y travaille depuis 2021, le sait.",
      },
      {
        id: "penhors",
        titre: "Appeler Penhors Études pour un groupement",
        cout: 0.5,
        nature: "utile",
        resultat: `Riwal Morvézen est partant pour une réponse en co-traitance : Penhors apporte ses références en collecte et traitement des déchets, nous la conduite du diagnostic organisationnel. Le montant, le travail et la marge se partagent à ${nombre(PART_GROUPEMENT * 100)} %.`,
      },
    ],
    question: "Répondez-vous à la Métropole ?",
    options: [
      {
        t: "Répondre avec un mémoire type : l'équipe n'a plus de seniors à y mettre",
        d: `${JOURS.type.senior} jour de senior et ${JOURS.type.consultant} jours de consultant.`,
      },
      {
        t: "Répondre avec un associé au pilotage, quitte à prendre des jours sur une mission",
        d: `${JOURS.pilote.senior} jours de senior et ${JOURS.pilote.consultant} de consultant, en semaines 8 à 10.`,
      },
      {
        t: "Décliner : l'équipe est saturée",
        d: "Un courrier à l'acheteur.",
      },
      {
        t: "Répondre en groupement avec Penhors Études",
        d: `${JOURS.groupement.senior} jours de senior et ${JOURS.groupement.consultant} de consultant ; le marché et sa marge se partagent à parts égales.`,
      },
    ],
    reactions: [
      [
        {
          ...AZILIZ,
          texte:
            "Je pars du mémoire de Saint-Brieuc sur la propreté urbaine, et je l'adapte. Ce sera prêt pour la semaine 10.",
        },
      ],
      [
        {
          ...KATELL,
          texte:
            "Je prends le pilotage. Je décale un atelier de ma mission au Haut-Lié, la directrice générale des services est prévenue.",
        },
      ],
      [
        {
          ...STERENN,
          texte: "Courrier envoyé à la Métropole. Ils ont pris note.",
        },
      ],
      [
        {
          ...RIWAL,
          texte:
            "Marché conclu. Je vous envoie nos références et nos CV demain ; on se voit mardi pour la méthodologie.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les premiers résultats",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...STERENN,
        heure: "10:00",
        alerte: true,
        texte: `Les premiers résultats sont tombés : ${ctx.bilanDesResultats}. ${ctx.restantes}`,
      },
      {
        ...VICTOIRE,
        heure: "15:30",
        texte: ctx.perdus
          ? "Je lis les rejets. On perd trop : sur ce qui reste à remettre, il faut être plus agressif sur les prix."
          : "Bon début. Mais les dernières réponses sont les plus disputées : ne prends pas de risque sur le prix.",
      },
    ],
    sources: [
      {
        id: "analyse",
        titre: "Demander aux acheteurs les rapports d'analyse des offres",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.perdus
            ? `Sur ${ctx.perdusTexte}, l'attributaire était plus cher que nous ${ctx.moinsChers}. En moyenne, notre note technique était ${ctx.ecartTechnique} à la sienne, et notre note prix ${ctx.ecartPrix}. Les commentaires des acheteurs reviennent aux mêmes sous-critères : méthodologie générique, équipe non nommée, planning sans lien avec leur calendrier.`
            : "Aucun rejet à ce jour : les marchés notifiés vous ont été attribués. Les rapports d'analyse disent ce qui a fait la différence : la méthodologie écrite pour le client et l'équipe nommée, sur lesquelles vous devancez les autres candidats.",
      },
      {
        id: "restantes",
        titre: "Faire le point des réponses à remettre en semaine 11",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.nbRestantes
            ? `${ctx.restantesDetail} Reprendre un mémoire sur les sous-critères perdus prend ${nombre(JOURS_REPRISE.senior)} jour de senior et ${JOURS_REPRISE.consultant} jour de consultant par réponse.`
            : "Aucune réponse ne reste à remettre en semaine 11.",
      },
    ],
    question: "Que faites-vous des réponses qui restent à remettre ?",
    options: [
      {
        t: "Baisser de 10 % les prix des réponses qui restent à remettre",
        d: "Le TJM des réponses de la semaine 11 baisse de 10 %. Les mémoires partent tels quels.",
      },
      {
        t: "Lire les rapports d'analyse, et reprendre les mémoires restants sur les sous-critères où nous perdons des points",
        d: `${nombre(JOURS_REPRISE.senior)} jour de senior et ${JOURS_REPRISE.consultant} jour de consultant par réponse, en semaines 10 et 11.`,
      },
      {
        t: "Remettre les réponses comme prévu",
        d: "Rien ne change.",
      },
      {
        t: "Contester les rejets devant le juge du référé précontractuel",
        d: `${nombre(REFERE.avocat)} € d'avocat et ${REFERE.senior} jours d'associé. Les mémoires restants partent tels quels.`,
      },
    ],
    reactions: [
      [
        {
          ...GOULVEN,
          texte:
            "Prix baissés sur les dernières offres. Je ne suis pas sûr que nos rejets viennent du prix, mais soit.",
        },
      ],
      [
        {
          ...SEFORA,
          texte:
            "J'ai les rapports. On a réécrit la méthodologie et le planning des dernières réponses, et chaque consultant proposé a maintenant un CV qui parle du sujet.",
        },
      ],
      [
        {
          ...STERENN,
          texte: "Les dernières offres partent comme prévu, mercredi de la semaine 11.",
        },
      ],
      [
        {
          ...PRUNE,
          texte:
            "L'avocat a déposé les requêtes. Il nous prévient : le juge vérifie la régularité de la procédure, pas la note.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Choisir où répondre", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Faire du volume", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Au fil de l'eau", chemin: [3, 2, 0, 2, 2, 2] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : répondre à tout avec des prix
 * serrés, courir le plus gros marché, faire écrire l'intercontrat parce qu'il est « gratuit »,
 * baisser le prix ou la séniorité de l'équipe pour passer sous le concurrent, baisser encore
 * après des rejets. Le mémoire type du treizième marché n'y figure pas : il vaut moins que le
 * pilotage, mais il n'est pas un geste de prix ni de volume en soi.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [3, 3],
  [5, 0],
] as const;

export const REPONSES = {
  elargi:
    "Réponse publiée à tous les candidats : le critère est élargi aux accompagnements de fusion ou de mutualisation de services. La date de remise est maintenue.",
  maintenu:
    "Réponse publiée à tous les candidats : le critère est maintenu, il correspond au besoin de la collectivité. La date de remise est maintenue.",
  rendezVous:
    "Merci d'être venus. Je vous ai dit ce qui me préoccupe à la collecte : trois chefs de service en deux ans, des tournées refaites à la main. Une consultation va sortir ; je ne peux pas vous en dire plus, mais vous savez maintenant ce qui compte pour nous.",
  glissement:
    "Florimond, deux comités de pilotage décalés en un mois, des livrables relus à la va-vite : le jalon 2 glisse de trois semaines. Je dois appliquer les pénalités de retard du marché, et vos équipes rattraperont sans facturer. Comptez 15 000 €.",
  refere:
    "Ordonnance du juge des référés : les requêtes sont rejetées. La procédure était régulière et l'analyse des offres motivée ; le juge ne refait pas la notation.",
} as const;
