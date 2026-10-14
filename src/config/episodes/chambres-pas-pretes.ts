/**
 * LES CHAMBRES PAS PRÊTES À 15 H — le contenu de l'épisode.
 *
 * Djeneba Touré est gouvernante générale de L'Escale Annemasse, l'hôtel
 * 3 étoiles de 78 chambres du Groupe Escale, à la frontière de Genève. De
 * janvier à mars, la clientèle d'affaires remplit l'hôtel du lundi au jeudi :
 * départs tôt, arrivées dès 13 h. Les chambres ne sont pas prêtes à 15 h, et
 * le directeur propose des intérimaires. Six décisions, chacune précédée de ce
 * qu'une gouvernante générale reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Leurs chiffres sont ceux du
 * modèle (src/engine/episodes/chambres-pas-pretes.ts) ; un test les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape, Message } from "./types";
import {
  BILAN_LUNDI,
  COUTS,
  GROUPE,
  HORAIRES,
  LINGE,
  LUNDI,
  MARGE_NUITEE,
  RECOUCHE,
  RENFORT_SALON,
  RENFORTS,
  SALON,
  TEMPS,
  CHAMBRES,
} from "@/engine/episodes/chambres-pas-pretes";

/** Un montant tel que les sources l'écrivent : « 1 456 € ». */
const eu = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
/** Un prix au centime : « 20,90 € ». */
const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** Une durée en minutes, écrite en heures : « 38 h 45 ». */
const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
};

/* Les chiffres que les sources donnent, tirés du modèle. */
/** Deux intérimaires, sept heures, quatre jours chargés. */
export const COUT_INTERIM_SEMAINE = 2 * HORAIRES.heuresPayees * 4 * COUTS.interim;
/** Un intérimaire de 12 h à 17 h, quatre jours chargés. */
export const COUT_INTERIM_APRES_MIDI = 5 * 4 * COUTS.interim;
/** Ce que l'équipe peut faire avant 11 h 30 le lundi : le linge du matin, et les recouches libres. */
export const TRAVAIL_AVANT_LINGE =
  LINGE.stockTampon * TEMPS.depart + (LUNDI.recouches / 2) * TEMPS.recouche;
/** Le temps de présence de l'équipe de 8 h 15 à 11 h 30. */
export const PRESENCE_AVANT_LINGE = LUNDI.equipe * (LINGE.livraison + LINGE.tri - HORAIRES.debut);
/** Le salon : un hôtel plein, les départs et les séjours d'un jour chargé. */
export const SALON_DEPARTS = Math.round(CHAMBRES * SALON.departs);
export const SALON_SEJOURS = CHAMBRES - SALON_DEPARTS;
export const SALON_MINUTES = SALON_DEPARTS * TEMPS.depart + SALON_SEJOURS * TEMPS.recouche;
/** Quatre personnes, six heures et demie de chambres chacune. */
export const SALON_CAPACITE = 4 * (HORAIRES.fin - HORAIRES.debut - 30);
export const COUT_SALON_INTERIM =
  RENFORT_SALON.interimaires * HORAIRES.heuresPayees * 4 * 2 * COUTS.interim;
export const COUT_SALON_FORME = COUT_SALON_INTERIM + RENFORT_SALON.formation;
export const COUT_GROUPE_INTERIM = GROUPE.interimaires * HORAIRES.heuresPayees * COUTS.interim;
/** Les deux sessions à venir de l'organisateur du groupe. */
export const GROUPE_NUITEES = 2 * GROUPE.chambres * 2;

export const DIAGNOSTICS = [
  {
    id: "flux",
    t: "L'équipe perd ses matinées à attendre le linge, et fait les chambres dans l'ordre des étages au lieu de celui des arrivées",
  },
  { id: "effectif", t: "Il manque du monde aux étages les jours chargés" },
  {
    id: "ordre",
    t: "Les chambres sont faites dans l'ordre des étages, pas dans celui où les clients arrivent",
  },
  {
    id: "productivite",
    t: "Les femmes et valets de chambre sont trop lents : douze chambres par jour, quand Chambéry-Gare en fait quinze",
  },
] as const;

const ROMUALD = { de: "Romuald Aubertin", role: "Directeur de L'Escale Annemasse" } as const;
const ROSINE = { de: "Rosine Kabongo", role: "Gouvernante d'étage" } as const;
const ZAHIA = { de: "Zahia Merabet", role: "Lingère" } as const;
const REKA = { de: "Réka Varga", role: "Femme de chambre" } as const;
const HERY = { de: "Hery Rasolofo", role: "Valet de chambre" } as const;
const ALOIS = { de: "Aloïs Brunschwig", role: "Chef de réception" } as const;
const KWAME = { de: "Kwame Asante", role: "Responsable des formations, Navelis Aéro" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les chambres pas prêtes à 15 h",
    jusqua: 2,
    messages: () => [
      {
        de: "Hostéo",
        role: "Rapport de la semaine dernière",
        heure: "07:40",
        alerte: true,
        texte: `Lundi : ${BILAN_LUNDI.nonPretes} chambres en départ pas prêtes à 15 h, ${Math.round(BILAN_LUNDI.clientsAttente)} clients ont attendu leur chambre. Note des avis sur Bookalia et Voyagio : 8,3, contre 8,6 en octobre. Le trimestre de janvier à mars commence : l'hôtel sera presque plein du lundi au jeudi.`,
      },
      {
        ...ROMUALD,
        heure: "08:20",
        texte:
          "Djeneba, deux voyageurs d'Helvardis ont attendu leur chambre plus d'une heure la semaine dernière, et leur responsable des voyages m'a appelé. Je veux des chambres prêtes à 15 h. S'il faut des intérimaires, je signe.",
      },
      {
        ...REKA,
        heure: "10:50",
        texte:
          "On est toutes au troisième à attendre les draps. Les recouches qu'on pouvait faire sont faites. Et à 15 h, ce sera encore la course.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "lingerie",
        titre: "Passer la matinée à la lingerie avec Zahia",
        cout: 1,
        nature: "decisive",
        resultat: `Le linge propre resté dans les offices le matin couvre ${LINGE.stockTampon} départs, pas un de plus. La Blanchisserie du Fier livre à 11 h ; Zahia trie et monte les chariots en une demi-heure : les draps sont aux étages à 11 h 30. « Je pourrais avoir une parure de plus par lit en location, ${eu(LINGE.dotation)} par semaine. On ne me l'a jamais demandé. »`,
      },
      {
        id: "planning",
        titre: "Relire le planning et la feuille d'étage de lundi",
        cout: 1,
        nature: "decisive",
        resultat: `Lundi : ${LUNDI.equipe} femmes et valets de chambre, chariots prêts à 8 h 15, pause de 12 h à 12 h 30, fin des chambres à 15 h 15. ${LUNDI.departs} départs à ${TEMPS.depart} minutes et ${LUNDI.recouches} recouches à ${TEMPS.recouche} minutes. Les départs étaient libres avant 10 h ; la moitié des clients en recouche avaient quitté leur chambre à 9 h, les autres vers 11 h 30. Les dernières chambres ont été finies à ${hm(BILAN_LUNDI.finDernier)}, en heures supplémentaires.`,
      },
      {
        id: "arrivees",
        titre: "Comparer la liste d'arrivées de la réception aux chambres faites",
        cout: 0.5,
        nature: "utile",
        resultat: `Lundi, ${LUNDI.tot} clients sont arrivés entre 13 h et 15 h, presque tous des comptes entreprises ; ${Math.round(BILAN_LUNDI.totAttente)} ont attendu leur chambre. Hostéo pré-affecte les chambres la veille sans regarder l'ordre du ménage : à 10 h, des chambres du premier étaient prêtes pour des clients attendus à 19 h, pendant que celles du quatrième, attendues à 13 h, n'étaient pas commencées.`,
      },
      {
        id: "chambery",
        titre: "Comparer la productivité avec L'Escale Chambéry-Gare",
        cout: 1,
        nature: "bruit",
        resultat: `D'après le contrôle de gestion du siège : 15 chambres par personne et par jour chargé à Chambéry-Gare, ${(Math.round(((LUNDI.departs + LUNDI.recouches) / LUNDI.equipe) * 10) / 10).toLocaleString("fr-FR")} ici. Chambéry-Gare a plus de séjours longs, donc plus de recouches.`,
      },
      {
        id: "conseil",
        titre: "Appeler Dragana Petković, gouvernante générale de L'Escale Lac",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Dragana : « Avant de demander des bras, regarde à quelle heure ton équipe n'a rien à faire, et pourquoi. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous à Romuald Aubertin ?",
    options: [
      {
        t: "Faire venir deux intérimaires du lundi au jeudi",
        d: `Dès la semaine 2, par l'agence Intérim Salève : ${eu(COUT_INTERIM_SEMAINE)} par semaine (${COUTS.interim} € de l'heure, sept heures, quatre jours).`,
      },
      {
        t: "Porter le stock tampon de linge à une journée",
        d: `Une parure de plus par lit, en location à la Blanchisserie du Fier, dès la semaine 2 : ${eu(LINGE.dotation)} par semaine.`,
      },
      {
        t: "Avancer la prise de poste de l'équipe à 7 h",
        d: "Les mêmes heures, une heure plus tôt : les chambres commencées plus tôt seront prêtes plus tôt. Rien à payer.",
      },
      {
        t: "Ne rien changer pour l'instant",
        d: "La première semaine de janvier est à 86 % : on verra quand l'hôtel sera plein.",
      },
    ],
    reactions: [
      [
        {
          ...REKA,
          texte:
            "Deux intérimaires commencent lundi. Il faudra tout leur montrer, et à 10 h 30, on sera huit à attendre les draps au lieu de six.",
        },
      ],
      [
        {
          ...ZAHIA,
          texte:
            "La blanchisserie livre les parures en plus vendredi. Lundi matin, il y aura de quoi faire tous les départs avant 11 h.",
        },
      ],
      [
        {
          ...HERY,
          texte:
            "À 7 h, les clients dorment encore, et les draps arrivent toujours à 11 h. On va attendre plus longtemps, et finir à 15 h quand même.",
        },
      ],
      [
        {
          ...ROMUALD,
          texte: "Helvardis m'a rappelé. Qu'est-ce qui change, concrètement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les clients de 13 h attendent",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ALOIS,
        heure: "13:40",
        alerte: true,
        texte:
          "Trois voyageurs d'Helvardis sont au comptoir depuis 13 h 15 ; leurs chambres, au quatrième, ne sont pas faites. Au premier, quatre chambres sont prêtes depuis 10 h pour des clients qui arrivent ce soir.",
      },
      {
        de: "Hostéo",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.nonPretes} chambres pas prêtes à 15 h par jour chargé, ${ctx.clientsAttente} clients ont attendu leur chambre, ${ctx.heuresPerdues} perdues à attendre chaque jour chargé.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "liste",
        titre: "Voir avec Aloïs ce que la liste d'arrivées peut dire",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Hostéo peut sortir chaque soir la liste des arrivées du lendemain avec l'heure annoncée : trois clients en départ sur dix arrivent avant 15 h, presque tous des comptes entreprises. Rien n'empêche de leur donner, la veille, les chambres libérées les premières, et de les faire d'abord. Pour les clients du soir, l'heure d'arrivée est rarement renseignée.",
      },
      {
        id: "essai",
        titre: "Regarder l'essai de Rosine : tous les départs d'abord",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.stockJournee
            ? "Mardi, Rosine a fait passer tous les départs avant les recouches. Avec le linge du matin, les départs étaient finis avant 13 h 30 ; mais un client de 13 h avait autant de chances qu'un autre d'avoir sa chambre dans les dernières."
            : `Mardi, Rosine a fait passer tous les départs avant les recouches. Passé le ${LINGE.stockTampon}e départ, plus de draps avant 11 h 30 : l'équipe a fait les recouches libres, puis attendu, comme d'habitude.`,
      },
    ],
    question: "Dans quel ordre faites-vous les chambres ?",
    options: [
      {
        t: "Faire d'abord les chambres des clients attendus avant 15 h, d'après la liste d'arrivées",
        d: "Chaque soir, Rosine et la réception leur donnent les chambres libérées les premières ; le reste par étage. Vingt minutes par jour pour Rosine.",
      },
      {
        t: "Faire tous les départs d'abord, puis les recouches",
        d: "Une règle simple, la même à tous les étages.",
      },
      {
        t: "Garder l'ordre des étages",
        d: "Chacun ses étages, comme depuis des années : moins de marche, moins de chariots déplacés.",
      },
      {
        t: "Ajouter un intérimaire l'après-midi pour finir les chambres",
        d: `De 12 h à 17 h, du lundi au jeudi : ${eu(COUT_INTERIM_APRES_MIDI)} par semaine.`,
      },
    ],
    reactions: [
      [
        {
          ...ALOIS,
          texte:
            "La liste est partie hier soir à 22 h. Ce midi, les clients de 13 h avaient leur chambre. On sait enfin ce qu'on peut promettre au comptoir.",
        },
      ],
      [
        {
          ...ROSINE,
          texte:
            "Les départs passent d'abord, à tous les étages. Les recouches se font l'après-midi.",
        },
      ],
      [
        {
          ...REKA,
          texte: "Chacun ses étages, d'accord. Mais au comptoir, ils attendent toujours.",
        },
      ],
      [
        {
          ...ROSINE,
          texte:
            "L'intérimaire de l'après-midi est arrivé. Il faut le suivre : il ne connaît ni les chambres ni nos standards.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La recouche de tous les jours",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ROMUALD,
        heure: "09:15",
        alerte: true,
        texte:
          "Djeneba, le siège pousse la recouche à la demande dans tous les hôtels : moins de linge, moins de produits, moins d'heures. Chambéry-Gare et Aix-les-Bains l'ont fait cet automne. Comment le ferais-tu ici ?",
      },
      {
        ...ROSINE,
        heure: "11:30",
        texte: `La moitié de nos clients restent du lundi au jeudi. Les recouches, c'est une trentaine de chambres par jour chargé, ${TEMPS.recouche} minutes chacune : dix heures d'équipe. Cette semaine, ${ctx.nonPretes} chambres pas prêtes à 15 h par jour chargé.`,
      },
    ],
    sources: [
      {
        id: "groupe",
        titre: "Demander aux autres hôtels du groupe comment ils s'y sont pris",
        cout: 0.5,
        nature: "decisive",
        resultat: `À Chambéry-Gare, la recouche est proposée à l'arrivée, avec une boisson offerte au bar pour chaque jour sans ménage, et faite d'office au-delà de trois nuits : selon les semaines, de ${Math.round(RECOUCHE.adhesionMin * 100)} à ${Math.round(RECOUCHE.adhesionMax * 100)} % des clients en séjour la déclinent. À Aix-les-Bains, on l'a supprimée un jour sur trois par une affichette « Un geste pour la planète » : ${Math.round(RECOUCHE.imposee * 100)} % de recouches en moins, des réclamations, et la note des avis a perdu trois dixièmes.`,
      },
      {
        id: "avis",
        titre: "Relire les avis des clients en séjour",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur Bookalia et Voyagio, les clients d'affaires parlent de l'attente à l'arrivée, du calme, du petit-déjeuner ; presque jamais de la fréquence du ménage. Ce qu'ils ne pardonnent pas : une serviette qui manque, un gobelet pas changé, l'impression qu'on économise sur leur dos.",
      },
    ],
    question: "Que faites-vous des recouches ?",
    options: [
      {
        t: "Proposer la recouche à la demande à l'arrivée, avec une boisson offerte",
        d: `Au comptoir et par une carte en chambre ; recouche d'office au-delà de trois nuits. ${centimes(RECOUCHE.boisson)} la boisson, ${centimes(LINGE.parRecouche)} de linge en moins par recouche déclinée.`,
      },
      {
        t: "Passer à une recouche tous les trois jours, annoncée par une affichette",
        d: "« Un geste pour la planète » : plus de temps gagné, sans rien offrir.",
      },
      {
        t: "Garder la recouche tous les jours",
        d: "Le standard de l'hôtel, que les clients connaissent.",
      },
      {
        t: "Passer à une recouche express de douze minutes",
        d: "Lit fait, poubelles, serviettes : huit minutes gagnées par chambre.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...ALOIS,
          texte:
            "Deux clients m'ont demandé ce matin si l'hôtel faisait des économies sur leur dos. Un troisième l'a écrit sur Voyagio.",
        },
      ],
      [
        {
          ...ROSINE,
          texte: "Rien ne change : l'équipe garde ses dix heures de recouches par jour chargé.",
        },
      ],
      [
        {
          ...REKA,
          texte:
            "On va plus vite, mais on oublie des choses. Hier, deux chambres sans gobelets propres.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le salon de février",
    jusqua: 9,
    messages: () => [
      {
        ...ALOIS,
        heure: "10:05",
        alerte: true,
        texte:
          "Le salon professionnel de Genève tombe en semaines 8 et 9 : l'hôtel est complet du lundi au jeudi, et la moitié des clients arrivent avant 15 h.",
      },
      {
        ...ROSINE,
        heure: "10:40",
        texte:
          "Et ce sont les vacances d'hiver : Esperanza et Ilda sont en congés posés depuis septembre. On sera quatre aux étages au lieu de six.",
      },
    ],
    sources: [
      {
        id: "charge",
        titre: "Calculer la charge d'un jour de salon",
        cout: 0.5,
        nature: "decisive",
        resultat: `Hôtel plein : ${SALON_DEPARTS} départs (${hm(SALON_DEPARTS * TEMPS.depart)} de travail) et ${SALON_SEJOURS} séjours (${hm(SALON_SEJOURS * TEMPS.recouche)} si toutes les recouches sont faites), soit ${hm(SALON_MINUTES)} de chambres par jour chargé. À quatre, l'équipe en fait ${hm(SALON_CAPACITE)}. Il manque près de deux personnes par jour, avant les absences, et les heures supplémentaires sont limitées à une par personne.`,
      },
      {
        id: "volontaires",
        titre: "Sonder l'équipe sur des heures complémentaires",
        cout: 0.5,
        nature: "utile",
        resultat: `Trois temps partiels prendraient des heures complémentaires, majorées de 10 % (${centimes(COUTS.heureComplementaire)} de l'heure). Esperanza et Ilda pourraient décaler une partie de leurs congés, avec ${eu(RENFORT_SALON.primeVolontaires / 2)} de prime chacune. Rosine : « Ilda a déjà réservé. Si elle ne bouge pas, on aura une demi-personne de plus par jour ; si tout le monde joue le jeu, presque deux. Je dirais quatre chances sur dix que ça ne marche qu'à moitié. »`,
      },
      {
        id: "agence",
        titre: "Appeler l'agence Intérim Salève",
        cout: 0.5,
        nature: "utile",
        resultat: `L'agence garantit deux intérimaires, à ${COUTS.interim} € de l'heure. Sans formation, une intérimaire fait les deux tiers du travail d'une titulaire, et oublie quelque chose dans une chambre sur onze. Formées deux jours en binôme en semaine 7, elles font les quatre cinquièmes, et oublient deux fois moins : ${eu(RENFORT_SALON.formation)} de formation en plus.`,
      },
    ],
    question: "Comment préparez-vous le salon ?",
    options: [
      {
        t: "Prendre deux intérimaires pendant le salon",
        d: `Semaines 8 et 9, du lundi au jeudi : ${eu(COUT_SALON_INTERIM)}.`,
      },
      {
        t: "Proposer des heures complémentaires et des congés décalés, avec une prime",
        d: `Aux temps partiels et aux deux équipières en congés : ${centimes(COUTS.heureComplementaire)} de l'heure, ${eu(RENFORT_SALON.primeVolontaires)} de primes. Elles diront oui, ou pas toutes.`,
      },
      {
        t: "Prendre deux intérimaires formés en binôme la semaine d'avant",
        d: `Deux jours de formation en semaine 7, puis les semaines 8 et 9 : ${eu(COUT_SALON_FORME)}, garantis par l'agence.`,
      },
      {
        t: "Ne rien prévoir : on fera en heures supplémentaires",
        d: "Une heure de plus par personne au plus ; Rosine et Zahia finiront le soir.",
      },
    ],
    reactions: [
      [
        {
          ...ROSINE,
          texte: "Les deux intérimaires arrivent lundi de la semaine 8. Je les mets avec qui ?",
        },
      ],
      null,
      [
        {
          ...REKA,
          texte:
            "Les deux intérimaires sont en binôme avec Hery et moi depuis lundi. Elles apprennent vite, et elles connaissent déjà les chariots.",
        },
      ],
      [
        {
          ...HERY,
          texte: "On fera comme d'habitude. On finira tard.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les oublis dans les avis",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ROMUALD,
        heure: "09:00",
        alerte: true,
        texte: `Djeneba, trois avis cette semaine : un cheveu dans la douche, pas de gobelets, un peignoir manquant. La note est à ${ctx.note}. Qu'est-ce que tu fais ?`,
      },
      {
        de: "Hostéo",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 9 : ${ctx.defauts} chambres avec un oubli signalé par un client.`,
      },
    ],
    sources: [
      {
        id: "oublis",
        titre: "Relire les réclamations du mois avec Rosine",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Une titulaire oublie quelque chose dans une chambre sur ${Math.round(1 / RENFORTS.titulaire.defauts)} ; une intérimaire non formée, dans une sur ${Math.round(1 / RENFORTS.interim.defauts)}. ${
            ctx.interim
              ? "Ce mois-ci, plus de la moitié des oublis viennent des chambres faites par les intérimaires et de celles finies dans la course de l'après-midi."
              : "Ce mois-ci, les oublis viennent surtout des chambres finies dans la course de l'après-midi et des chambres d'une nouvelle recrue."
          } Aujourd'hui, Rosine contrôle une chambre sur dix, au hasard.`,
      },
      {
        id: "controle",
        titre: "Chiffrer avec Rosine ce que coûte un contrôle",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Tout contrôler, c'est cinq minutes par chambre, plus de six heures par jour chargé : Rosine ne ferait plus ses recouches, et les chambres attendraient sa validation trois quarts d'heure en moyenne avant d'être libérées. Contrôler les chambres des arrivées tôt, des clients fidèles et des nouveaux, c'est une heure et demie ; une check-list d'autocontrôle sur chaque chariot couvre le reste.",
      },
    ],
    question: "Comment faites-vous baisser les oublis ?",
    options: [
      {
        t: "Faire contrôler toutes les chambres par Rosine avant de les libérer",
        d: "Rien ne sort sans son passage. Elle ne fait plus de chambres.",
      },
      {
        t: "Contrôler les arrivées tôt, les fidèles et les nouveaux ; une check-list pour le reste",
        d: "Une heure et demie par jour pour Rosine, une check-list sur chaque chariot.",
      },
      {
        t: "Instaurer une prime au nombre de chambres faites",
        d: "Au-delà de quatorze chambres par jour : 600 € sur le mois pour l'équipe.",
      },
      {
        t: "Rappeler les standards en réunion d'équipe",
        d: "Une demi-heure le lundi.",
      },
    ],
    reactions: [
      [
        {
          ...ALOIS,
          texte:
            "Les chambres arrivent validées, mais plus tard : à 14 h, j'en ai nettement moins que d'habitude à donner.",
        },
      ],
      [
        {
          ...ROSINE,
          texte:
            "La check-list est sur chaque chariot. Je passe dans les chambres des arrivées tôt avant midi.",
        },
      ],
      [
        {
          ...REKA,
          texte: "On court. Les chiffres montent, et les oublis avec.",
        },
      ],
      [
        {
          ...HERY,
          texte: "Message reçu. On fera attention.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Un groupe à 12 h 30",
    jusqua: 13,
    messages: () => [
      {
        ...KWAME,
        heure: "11:20",
        alerte: true,
        texte: `Madame Touré, nos ${GROUPE.chambres} techniciens arrivent en car le mardi de la semaine 12, vers 12 h 30, pour deux nuits. Ils déposent leurs affaires et repartent à 14 h pour leur formation à Genève : il leur faut leur chambre en arrivant.`,
      },
      {
        ...ALOIS,
        heure: "11:45",
        texte: `Je n'ai pas de rooming list. Sans elle, remettre ${GROUPE.chambres} clés au comptoir, c'est trois quarts d'heure de file.`,
      },
    ],
    sources: [
      {
        id: "car",
        titre: "Appeler l'organisateur et le transporteur",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le transporteur part de Lyon à 9 h ; une fois sur trois, la route est dégagée et le car arrive vers 11 h 30. Navelis Aéro prévoit deux autres sessions cette année : ${GROUPE_NUITEES} nuitées, ${eu(GROUPE_NUITEES * MARGE_NUITEE)} de marge pour l'hôtel s'il revient.`,
      },
      {
        id: "plan",
        titre: "Faire le plan du mardi avec Rosine",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${GROUPE.chambres} départs à ${TEMPS.depart} minutes : ${hm(GROUPE.chambres * TEMPS.depart)} de travail, un peu plus de trois heures à six. Faites en premier, les chambres du groupe sont prêtes avant midi si l'équipe est au complet. ${
            ctx.stockJournee
              ? "Avec le stock tampon, le linge est là dès 8 h 15."
              : `Le linge du matin couvre ${LINGE.stockTampon} départs : il faudrait commander 20 parures de plus pour le mardi (${eu(GROUPE.lingeEnPlus)}).`
          }`,
      },
    ],
    question: "Comment préparez-vous l'arrivée du groupe ?",
    options: [
      {
        t: "Préparer l'arrivée avec la réception : rooming list, chambres du groupe en premier, linge en plus",
        d: `Les clés en enveloppes la veille ; ${eu(GROUPE.lingeEnPlus)} de parures en plus pour le mardi.`,
      },
      {
        t: "Faire venir trois intérimaires le mardi",
        d: `Une journée : ${eu(COUT_GROUPE_INTERIM)}.`,
      },
      {
        t: "Proposer au groupe de prendre les chambres à 15 h, avec café et bagagerie",
        d: `Sûr d'être prêts. Pour l'après-midi de formation perdu, 20 % de remise sur le séjour et le café : ${eu(GROUPE.accueil)}.`,
      },
      {
        t: "Laisser la réception gérer à l'arrivée",
        d: "Les chambres du groupe seront faites avec les autres.",
      },
    ],
    reactions: [
      [
        {
          ...ALOIS,
          texte:
            "Rooming list reçue, clés en enveloppes. Zahia a mis de côté le linge du groupe, et Rosine a affiché l'ordre des chambres pour mardi.",
        },
      ],
      [
        {
          ...ROSINE,
          texte: "Trois intérimaires mardi. Je ne sais pas encore à quels étages les mettre.",
        },
      ],
      [
        {
          ...KWAME,
          texte:
            "D'accord pour 15 h, puisqu'il le faut. Mes techniciens iront en formation avec leurs valises.",
        },
      ],
      [
        {
          ...ALOIS,
          texte: "On fera au mieux au comptoir.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le flux d'abord", chemin: [1, 0, 0, 1, 1, 0] },
  { nom: "Des bras en plus", chemin: [0, 3, 2, 0, 3, 1] },
  { nom: "Attentiste", chemin: [3, 2, 2, 3, 3, 3] },
] as const;

/**
 * Le réflexe du métier : faire venir des intérimaires dès que les chambres ne
 * sont pas prêtes, au lieu de lever ce qui bloque le flux. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 3],
  [3, 0],
  [5, 1],
] as const;

export const REPONSES = {
  adhesion: (part: number): Message => ({
    ...ALOIS,
    texte: `Première semaine : ${Math.round(part * 100)} % des clients en séjour ont décliné la recouche. Ils prennent volontiers la boisson, et personne ne s'est plaint.`,
  }),
  volontairesOui: {
    ...ROSINE,
    texte:
      "Bonne nouvelle : Esperanza et Ilda décalent une semaine de congés chacune, et les trois temps partiels prennent des heures. On sera presque six.",
  },
  volontairesNon: {
    ...ROSINE,
    texte:
      "Ilda ne peut pas décaler, Esperanza seulement deux jours. Avec les temps partiels, on aura une demi-personne de plus par jour. Pas plus.",
  },
  grandCompteReste:
    "Monsieur Aubertin, nos voyageurs me disent que les chambres sont prêtes quand ils arrivent. Nous renouvelons l'accord pour l'année.",
  grandComptePart:
    "Monsieur Aubertin, trop de nos voyageurs ont attendu leur chambre cet hiver. Nous logerons nos équipes chez Orméa Hotels à partir de la semaine prochaine.",
  carEnAvance: "Le car est arrivé à 11 h 30, une heure plus tôt que prévu.",
  carALHeure: "Le car est arrivé à 12 h 30.",
  organisateurRevient: "Merci pour l'accueil. Nous reviendrons pour nos deux prochaines sessions.",
  organisateurPart:
    "L'arrivée de mardi nous a coûté le début de la formation. Nous organiserons nos prochaines sessions ailleurs.",
} as const;
