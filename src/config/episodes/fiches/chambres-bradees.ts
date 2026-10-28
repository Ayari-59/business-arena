/**
 * FICHE ENSEIGNANT · ÉPISODE 51, LES CHAMBRES QU'ON BRADE.
 *
 * Le revenue management d'un hôtel de loisirs : lire le pick-up segment par
 * segment et canal par canal avant de toucher aux prix. Le piège : baisser
 * dès que le rythme des réservations paraît en retard, et payer la baisse sur
 * chaque chambre qui se serait vendue de toute façon.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "chambres-bradees",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Une chambre de ce soir ne se stocke pas : d'où la tentation de baisser les prix dès que le pick-up, le rythme des réservations, paraît en retard. L'erreur classique consiste à lire ce retard en bloc et à y répondre par une baisse pour tous, alors qu'une baisse ne rapporte que là où il reste des chambres à vendre et des clients sensibles au prix. Dans l'épisode, L'Escale Lac, 84 chambres au bord du lac d'Annecy, a le plus mauvais pick-up du groupe, et la revenue manager du siège propose −15 % sur Bookalia et Voyagio pour tout le trimestre. Décomposé, le retard est un trompe-l'œil : les ponts de mai sont en avance (+6,4 %), les week-ends au niveau, l'écart vient des groupes (210 nuitées d'un séminaire non reconduit) et de nuits de semaine qui se réservent à quelques jours. Sur les ponts, déjà vendus à 44 % et finis à 92 % l'an dernier, la baisse sur les plateformes coûterait environ 16,6 k€ sans ajouter de nuitée, et ferait passer par les plateformes, à 17 % de commission, la moitié des clients du site qui comparent. L'élève découvre que les restrictions (deux nuits minimum sur les ponts, un tarif non remboursable en semaine) valent mieux qu'une baisse, qu'un groupe se juge sur ce qu'il déplace, qu'un allotement d'été se juge selon l'été, et que le direct se construit par un tarif membre qui garde la parité.",
  objectifs: [
    "Je décompose un pick-up par segment et par canal avant de juger qu'il est en retard.",
    "Je calcule ce qu'une baisse de prix coûte en revenu net de commissions sur les nuitées qui se seraient vendues de toute façon.",
    "Je juge un groupe ou un allotement sur les nuitées qu'il déplace, et non sur son seul chiffre d'affaires.",
    "Je préfère une restriction ou un tarif ciblé (durée minimale de séjour, non remboursable, tarif membre) à une baisse générale, et j'explique pourquoi.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le taux d'occupation, le prix moyen et le RevPAR doivent être connus, ainsi que la notion de canal de distribution et de commission. Le pick-up, la durée minimale de séjour et la parité tarifaire peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/chambres-bradees?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez L'Escale Lac et son pick-up en retard, sans parler de segments, et vous demandez de noter sur papier, avant de valider la semaine 1, le coût de la baisse de 15 % sur les ponts et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (baisse sur les plateformes, baisse générale, restrictions ou attente) et celle de la semaine 6 à Meerland Reizen, où la classe se partage le plus. Un binôme qui a fini tôt calcule ce que le groupe Brenval coûte sur le pont de l'Ascension.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous reconstruisez le calcul avec la classe : douze nuits de ponts, 84 chambres, 92 % d'occupation l'an dernier, 55 % par les plateformes, 39,30 € de moins sur une nuitée à 262 €, dont l'hôtel ne touche que 83 %. Vous faites expliquer les valeurs éloignées (20,0 k€, 30,2 k€ ou 18,1 k€). Vous terminez en faisant dire ce que la baisse ajouterait : presque rien, puisque les ponts finissaient déjà à 92 % et se vendent à 44 % six semaines avant.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (Brenval) et de la semaine 6 (Meerland). Pour Brenval, vous faites calculer le déplacement : une nuitée de pont rapporte 234 € net, le groupe paie 145 €, soit 89 € de moins sur 108 nuitées, 9,6 k€. Pour Meerland, vous faites lire la source « Chiffrer l'allotement selon l'été » : 12 chambres valent −22 k€ en moyenne, 6 chambres +2 k€, et l'analyse de Lucile permet de répondre selon l'été, si Meerland attend.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, l'été est normal. « Lire le pick-up, segmenter, vendre en direct » finit à 2 146 k€ (trimestre et été), pour un budget de 2 110 k€ ; « Attentiste » à 2 093 k€ ; « Baisser dès que le pick-up recule » à 1 924 k€, avec pourtant le meilleur taux d'occupation (74 % contre 72 %) et le plus bas RevPAR (122 € contre 131 €). Vous montrez ensuite la décision où le hasard compte : sous le tirage n° 12, Meerland n'a pas attendu l'analyse, et signer 6 chambres aurait rapporté 21 k€ de plus ; sur les trente tirages, l'analyse fait pourtant mieux en moyenne (5 k€ de plus que les 6 chambres). Vous faites séparer la qualité de la décision de son résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : on ne baisse un prix que là où il reste des chambres à vendre et des clients sensibles au prix. Vous la déclinez : lire le pick-up par segment et par canal, restreindre plutôt que brader, juger un groupe sur ce qu'il déplace, garder la parité et construire le direct par un tarif membre. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 16.6,
    etapes: [
      "Les douze nuits de ponts (source de Ludmila, et « Décomposer le pick-up par segment ») : trois nuits pour le 1er mai, trois pour le 8 mai, quatre pour l'Ascension, deux pour la Pentecôte. Avec 84 chambres : 12 × 84 = 1 008 chambres à vendre.",
      "À l'occupation de l'an dernier, 92 % : 1 008 × 0,92 = 927,36 nuitées. La source « Lire la production par canal » dit que 55 % des nuitées de ponts passent par Bookalia et Voyagio : 927,36 × 0,55 = 510,05 nuitées.",
      "Une baisse de 15 % sur une nuitée à 262 € retire 39,30 € au client ; l'hôtel ne touche que 83 % du prix, commission de 17 % déduite : 39,30 × 0,83 = 32,62 € de revenu net perdu par nuitée.",
      "Coût de la baisse : 510,05 × 32,62 ≈ 16 637 €, soit 16,6 k€. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 1 k€ près, proche à 3 k€.",
      "Ce calcul est un minimum : il ne compte pas les clients du site qui passeraient par les plateformes devenues moins chères (la moitié d'entre eux regardent Bookalia avant de réserver), ni le fait que la baisse n'ajoute presque aucune nuitée sur des ponts déjà vendus à 44 % et finis à 92 %.",
    ],
    erreurs: [
      {
        valeur: 20,
        cause:
          "La commission oubliée (510,05 × 39,30 = 20,0 k€) : l'hôtel ne perd que les 83 % du prix qu'il aurait touchés.",
      },
      {
        valeur: 30.2,
        cause:
          "La baisse appliquée à toutes les nuitées de ponts (927,36 × 32,62 = 30,2 k€) : elle ne porte que sur les plateformes, le site et le téléphone gardent leurs prix.",
      },
      {
        valeur: 18.1,
        cause:
          "Les 84 chambres comptées pleines les douze nuits (1 008 × 0,55 × 32,62 = 18,1 k€) : la question demande l'occupation de l'an dernier, 92 %.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La directrice générale veut un printemps plein, l'Orméa vient de passer à −15 % sur Bookalia, et Chambéry a pris six points d'occupation en faisant pareil.",
      ceQuiLeDejoue:
        "La source « Décomposer le pick-up par segment » montre les ponts en avance (+6,4 %) et les week-ends au niveau ; l'écart vient du séminaire Sérandal non reconduit et de nuits de semaine dont 6 % seulement sont réservées à cette date, comme chaque année. La source par canal rappelle que 50 % des clients du site regardent Bookalia : moins chères, les plateformes leur prennent 17 % de commission. Les prix de l'hôtel sont « dans la moyenne haute du lac, comme l'an dernier ». Rejouée sur les trente tirages à la place des restrictions, la baisse sur les plateformes perd 68 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Une baisse de 10 % partout garde la parité : on attire du monde sans faire basculer les clients du site vers les plateformes.",
      ceQuiLeDejoue:
        "La parité est gardée, mais la baisse porte sur chaque chambre, y compris celles des ponts et des week-ends, pleins ou presque : Clodomir le voit, « les premiers clients des ponts paient moins cher des chambres qu'ils avaient déjà en vue ». Aliénor l'a dit : une baisse sur un pont se paie sur chaque chambre qu'on aurait vendue de toute façon. Ludmila signalait la vraie marge : les nuits orphelines des ponts, et des clients de semaine prêts à payer d'avance pour moins cher. Rejouée sur les trente tirages, la baisse générale perd 33,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "108 nuitées d'un coup, sans commission, quand le pick-up est en retard : de quoi rattraper le séminaire perdu, et la directrice générale dit que ça ne se refuse pas.",
      ceQuiLeDejoue:
        "La source sur l'Ascension montre ses quatre nuits vendues à 57 %, en avance sur un an dernier fini à 92 % : chaque nuitée du groupe prend la place d'une nuitée de pont à 234 € net, soit 89 € de moins, 9,6 k€ sur les 108. Du lundi 18 au jeudi 21 mai, il reste près de 37 chambres libres par nuit, que personne ne réserve. Rejoué sur les trente tirages à la place de la contre-proposition, signer sur le pont perd 17,7 k€ en moyenne et ne fait jamais mieux ; sous le tirage n° 12, où Brenval refuse la semaine suivante, il perd 9,6 k€.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "La tête des résultats sur Annecy, et 12 % de réservations Bookalia en plus en moyenne : c'est le coup de pouce dont le pick-up a besoin.",
      ceQuiLeDejoue:
        "La source « Regarder qui sont les clients que Bookalia compte comme gagnés » : six clients Bookalia sur dix connaissaient déjà l'hôtel, et sur les ponts, les week-ends et l'été, l'hôtel est plein ou presque, où une meilleure place n'ajoute rien, quand les trois points de plus se paient sur chaque nuitée (7,86 € sur un pont, 8,55 € l'été). Ludmila voit deux habitués du téléphone passer par Bookalia. Le tarif membre, lui, rend 11 % de plus par nuitée qui passe au site. Rejoué sur les trente tirages à la place du tarif membre, le programme Préférence perd 21,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "115 k€ de chiffre d'affaires assuré en plein été : la directrice générale dit de signer, on ne sait jamais ce que l'été réserve.",
      ceQuiLeDejoue:
        "La source « Chiffrer l'allotement selon l'été » le dit : 12 chambres changent la valeur de l'été de −70 k€ si l'été est plein, −30 k€ s'il est normal, +69 k€ s'il est creux, soit −22 k€ en moyenne, parce que dans un été plein chaque chambre à 155 € prend la place d'un client à 257 € net. Les cinq derniers étés : plein un sur trois, normal un sur deux, creux un sur cinq. Rejoué sur les trente tirages à la place de l'analyse, signer les 12 chambres perd 38 k€ en moyenne, et ne fait mieux que 7 fois, dans les étés creux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La grille a été construite en mars avec le siège : on ne la touche pas au premier frémissement, on la jugera en septembre.",
      ceQuiLeDejoue:
        "La source « Lire le pick-up de l'été par marché et par canal » montre un été inégal : début juillet et fin août en retard, du 14 juillet au 15 août en avance et plein. La grille de mars vend toutes les dates au même prix (285 € en moyenne), sans durée minimale : trop cher sur les dates creuses, pas assez sur les dates pleines. Rejoué sur les trente tirages à la place de la revue date par date, garder la grille perd 32,5 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Un « Réservez tôt » à −15 % sur les plateformes sécurise l'été dès maintenant, et la directrice générale l'a elle-même proposé si le pick-up faiblit.",
      ceQuiLeDejoue:
        "Du 14 juillet au 15 août, l'hôtel sera plein : la baisse n'y ajoute aucune nuitée et retire 15 % à chacune. Faite sur les seules plateformes, elle ramène le problème de la semaine 1 : Ludmila a déjà deux clients du site qui veulent le prix de Bookalia. Rejoué sur les trente tirages à la place de la revue date par date, « Réservez tôt » perd 83 k€ en moyenne et ne fait jamais mieux : c'est le réflexe le plus coûteux de l'épisode.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le comité regarde le taux d'occupation de juin, et Annemasse a pris douze points avec une vente flash l'an dernier.",
      ceQuiLeDejoue:
        "La source « Refaire le calcul de la vente flash d'Annemasse » : sur les nuits de semaine, +29 % de nuitées mais −2,2 % de revenu net, un client du site sur deux passant par la vente flash ; sur les week-ends presque pleins, la baisse ne fait que réduire le prix de chambres qui se seraient vendues. Annemasse avait gagné douze points d'occupation, et perdu du revenu net. Rejouée sur les trente tirages à la place de l'offre aux membres, la vente flash perd 18,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le pick-up global était le plus mauvais du groupe. Qu'est-ce que la décomposition par segment montrait ? D'où venait vraiment l'écart, et pourquoi les nuits de semaine ne pouvaient-elles pas être en avance à cette date ?",
    "La baisse de 15 % sur les ponts coûtait 16,6 k€ de revenu net. Combien de nuitées en plus aurait-il fallu pour la payer, et combien restait-il de chambres à vendre sur des ponts finis à 92 % ?",
    "Pourquoi une durée minimale de séjour sur les ponts rapporte-t-elle plus qu'une baisse ? Qu'est-ce qu'une nuit orpheline, et qui paie le tarif non remboursable ?",
    "Brenval paie 145 € sans commission ; une nuitée de pont rapporte 234 € net. Comment un groupe peut-il faire perdre de l'argent en remplissant l'hôtel ? Et la semaine suivante, quand 37 chambres restent vides ?",
    "Sous le tirage n° 12, Meerland n'a pas attendu l'analyse, et ceux qui ont signé 6 chambres ont fait 21 k€ de mieux. Sur les trente tirages, l'analyse fait pourtant mieux en moyenne. Était-ce une mauvaise décision de commander l'analyse ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "« Baisser dès que le pick-up recule » finit avec le meilleur taux d'occupation et le plus bas revenu. Que mesure le taux d'occupation, que mesure le RevPAR, et lequel le Groupe Escale avait-il raison de regarder ?",
    "Quelle règle présentez-vous à Isaline Perraud pour la prochaine fois que le pick-up recule ? Formulez-la en une phrase, avec un segment et un canal dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 40 chambres vend un pont de trois nuits au prix moyen de 200 € ; il finit à 90 % d'occupation. 60 % des nuitées passent par les plateformes, qui prennent 18 % de commission ; le site coûte 3 %. 1) Combien de nuitées vend-il sur le pont, dont combien par les plateformes ? 2) Que coûte, en revenu net, une baisse de 10 % sur les seules plateformes, sur les nuitées qui se seraient vendues de toute façon ? 3) La moitié des clients du site passent alors par les plateformes, moins chères : que perd l'hôtel sur chacun d'eux, et en tout ? 4) Combien de nuitées en plus faudrait-il vendre par les plateformes, au prix baissé, pour compenser ? Combien de chambres restent libres sur le pont ? 5) Un autocariste propose 20 chambres pendant les trois nuits du pont à 120 € net. Que rapporte en moyenne une nuitée de pont vendue par les canaux habituels, et que coûte le groupe ?",
    corrige:
      "1) 40 × 3 × 0,90 = 108 nuitées, dont 108 × 0,60 = 64,8 par les plateformes et 43,2 par le site. 2) 64,8 × 200 × 0,10 × 0,82 = 1 062,72 €. 3) Un client du site rapportait 200 × 0,97 = 194 € ; par la plateforme, il rapporte 180 × 0,82 = 147,60 € : 46,40 € de moins ; 21,6 clients × 46,40 = 1 002,24 €. Perte totale : 2 064,96 €. 4) 2 064,96 / 147,60 ≈ 14 nuitées en plus, alors qu'il ne reste que 120 − 108 = 12 chambres libres sur le pont : la baisse ne peut pas se payer. 5) Nuitée moyenne nette : 0,60 × 200 × 0,82 + 0,40 × 200 × 0,97 = 98,40 + 77,60 = 176 € ; le groupe déplace 60 nuitées à 176 € pour 120 € : 60 × 56 = 3 360 € de moins.",
  },
  evaluation: [
    "Le coût de la baisse sur les ponts est calculé juste (nuits de ponts, occupation de l'an dernier, part des plateformes, commission déduite), et l'élève dit ce que la baisse aurait pu ajouter.",
    "Le diagnostic de la semaine 1 s'appuie sur la décomposition du pick-up par segment et par canal, et non sur le pick-up global ou sur les prix du concurrent.",
    "Le groupe Brenval et l'allotement Meerland sont jugés sur les nuitées qu'ils déplacent, selon le segment et le scénario d'été.",
    "Chaque choix de prix ou de distribution est argumenté en revenu net de commissions, et non en taux d'occupation.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode pose que, depuis la loi de 2015, rien n'interdit à un hôtel français d'afficher moins cher sur son propre site que sur les plateformes (les clauses de parité tarifaire imposées par les plateformes ayant été écartées) : c'est la règle telle que l'épisode la formule, qu'un enseignant voudra situer dans la loi du 6 août 2015 avant de la présenter comme générale. Le modèle traite les commissions et les frais du site comme des taux fixes, sans TVA ni taxe de séjour.",
};
