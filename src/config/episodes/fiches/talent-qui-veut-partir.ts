/**
 * FICHE ENSEIGNANT · ÉPISODE 24, LE TALENT QUI VEUT PARTIR.
 *
 * Fidéliser ses meilleurs éléments : chacun a sa raison de partir, et ce
 * n'est presque jamais d'abord le salaire. Le piège : la contre-offre, qui
 * achète du temps et se sait, et la promesse d'un poste qu'on ne maîtrise
 * pas. Les chiffres du hasard de la classe sont ceux de la graine 8.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "talent-qui-veut-partir",
  formations: ["stmg", "bts-gpme", "but-gea"],
  programme: [
    "STMG · Ressources humaines et communication, Thème 2, Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "On ne retient pas quelqu'un en lui courant après le jour où il démissionne : on le retient en sachant avant lui ce qui lui manque. L'erreur classique consiste à répondre à une offre concurrente par de l'argent (une augmentation, une contre-offre, une prime), ou à promettre un poste que l'on ne maîtrise pas. Dans l'épisode, Grégoire Chevalier dirige six agences Arvel Distribution autour de Lyon. Héloïse Kervella, cheffe de Vénissieux, la première marge de la région (36 k€ par semaine), a reçu une offre des Comptoirs Valdane : une direction de secteur sur trois agences et 12 % de plus. Habib Amrani, à Givors, fait 52 heures par semaine avec un vendeur non remplacé depuis cinq mois ; Mathilde Guérin, à Tassin, a fait la meilleure progression de marge de la région (+2,1 points) sans que personne ne le dise. Le baromètre des chefs d'agence est passé de 61 à 47 sur 100 en un an. L'élève découvre que les trois sont payés dans la médiane du marché, que chacun a un besoin différent (des perspectives, une charge tenable, de la reconnaissance), qu'une augmentation fait monter l'engagement d'un coup avant qu'il ne redescende vers ce que le besoin satisfait permet, que trois contre-offres acceptées sur quatre n'ont pas empêché un départ dans l'année, et qu'un parcours sans promesse vaut quelle que soit la décision du comité de direction.",
  objectifs: [
    "Je mène un entretien de rétention avant la démission, et j'identifie ce qui fait rester et partir chaque personne.",
    "Je distingue les facteurs de motivation (perspectives, autonomie, reconnaissance, charge de travail) de la rémunération, et j'explique pourquoi une augmentation ne traite pas un besoin d'un autre ordre.",
    "Je chiffre le coût d'un départ (remplacement, agence sans chef, clients qui suivent) pour le comparer au coût d'une mesure de fidélisation.",
    "Je ne promets que ce que je maîtrise, et je prépare des candidats à un poste avec des critères écrits.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les théories de la motivation, la notion de rémunération globale et la distinction entre facteurs de satisfaction et d'insatisfaction doivent avoir été vues en cours. L'entretien de rétention, la contre-offre et le coût d'un départ peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/talent-qui-veut-partir?hasard=8 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous rappelez que l'épisode parle de personnes : partir est un droit, et donner envie de rester est le travail du manager. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de l'engagement moyen d'Héloïse, de Habib et de Mathilde en semaine 2 et ce qui la justifie, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la réponse à l'offre écrite de Valdane en semaine 2, et la façon de préparer la région au poste régional en semaine 8. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 2 : la contre-offre au lieu du parcours.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées et vous les rapprochez du choix de la semaine 1. Vous reconstruisez le raisonnement à partir des 47 sur 100 du baromètre : les entretiens de rétention donnent un sursaut, mais rien n'a encore changé pour Héloïse, Habib ou Mathilde, et l'engagement redescend vers ce que leurs besoins permettent. Sous le tirage n° 8, le modèle donne 45 sur 100 (Héloïse 49, Habib 40, Mathilde 46). Vous faites expliquer les valeurs éloignées (52, 61).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les réponses à Héloïse en semaine 2 (s'aligner, promettre, le parcours, la laisser décider). Les élèves qui se sont alignés défendent leur choix, puis la classe lit la source de Sidonie Brisset sur les contre-offres : quatre acceptées sur cinq, trois de ces quatre personnes parties dans l'année, et l'augmentation finit toujours par se savoir. Pour la promesse, vous faites lire la réponse d'Henri Dumoulin : le comité tranche en semaine 10 et gèle une création de poste sur deux. Vous enchaînez sur Habib : ce qui lui manque, d'après son agenda, ce sont un vendeur et quatre heures de reporting en moins, pas 3 000 €.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 8, « Écouter et construire un parcours » finit 28,9 k€ au-dessus du budget, « Personne n'est irremplaçable » 121,8 k€ en dessous et « Surenchérir sur le salaire » 126,9 k€ en dessous ; sur les trente tirages, la première tient le budget 26 fois, les deux autres jamais. Sous ce tirage, Héloïse ne restait qu'avec le parcours : avec la contre-offre comme avec la promesse, elle part en semaine 3. Vous montrez ensuite les deux décisions où le hasard peut renverser le jugement : annoncer un nom pour le poste régional, et laisser partir Kofi.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois mécanismes de l'épisode : on ne retient pas par l'argent un besoin d'un autre ordre ; une contre-offre achète du temps et se sait ; une promesse qu'on ne tient pas détruit la confiance plus bas qu'avant. Vous les reliez à un geste chacun : l'entretien de rétention avant la démission, la mesure qui répond au besoin de chacun, la préparation ouverte avec des critères écrits. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 45,
    etapes: [
      "Point de départ (point de la région d'Ambroise Ancelin) : baromètre des chefs d'agence à 47 sur 100, contre 61 il y a un an. Le modèle part de 48 pour Héloïse, 42 pour Habib et 50 pour Mathilde, soit 46,7 en moyenne.",
      "Ce que fait l'entretien de rétention de la semaine 1 : la première fois qu'on leur demande ce qui les ferait rester (« C'est la première fois qu'on me demande ce qui me ferait rester »), chacun gagne environ 5 points d'un coup.",
      "Ce que l'entretien ne change pas encore : les entretiens annuels montrent que rien n'a bougé pour aucun des trois (le « rôle plus large » d'Héloïse sans suite, les 52 heures de Habib, les résultats de Mathilde jamais cités). Chaque semaine, l'engagement de chacun fait environ un quart du chemin vers ce que son besoin satisfait permet, autour de 38 à 41 sur 100 tant que rien n'est fait. Hors hasard : 49 puis 46 pour Héloïse, 45 puis 43 pour Habib, 52 puis 49 pour Mathilde, soit 46 en moyenne en semaine 2.",
      "Sous le tirage n° 8, l'humeur des semaines retire un peu plus : Héloïse 49, Habib 40, Mathilde 46, soit 45 sur 100 (44,9). L'épisode juge juste à 3 points près, proche à 7 ; selon les trente tirages, le chiffre va de 44 à 47.",
      "Pour comparer, sous le même tirage : sans rien faire, l'engagement tombe à 40 ; avec l'augmentation de 10 % proposée à Héloïse, il est à 43 : le sursaut d'Héloïse ne change rien pour Habib et Mathilde, et il redescend déjà.",
    ],
    erreurs: [
      {
        valeur: 52,
        cause:
          "Les 5 points de l'entretien ajoutés aux 47 du baromètre, comme s'ils restaient acquis : l'écoute ne fait qu'ouvrir la discussion, et l'engagement redescend tant que rien n'a changé pour personne.",
      },
      {
        valeur: 61,
        cause:
          "Le niveau d'il y a un an pris pour une cible que les entretiens rétabliraient : ce qui a fait baisser le baromètre de 14 points en un an (le poste vacant de Givors, la demande d'Héloïse restée sans suite) est toujours là en semaine 2.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Héloïse est la meilleure et Valdane lui offre 12 % de plus : lui proposer 10 % tout de suite coupe court et montre qu'on tient à elle.",
      ceQuiLeDejoue:
        "Les entretiens annuels montrent qu'aucun des trois ne parle de salaire en premier, et la comparaison de Sidonie les place dans la médiane du marché, à 4 % près. Au déjeuner, Héloïse le dit : « Honnêtement, l'argent n'est pas le sujet. Ça fait deux ans que je demande à faire autre chose que faire tourner mon agence. » Henri prévient : « Ne me demande pas de dérogation pour acheter du temps. » Rejouée sur les trente tirages à la place des entretiens de rétention, l'augmentation perd 49 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Elle n'a rien dit, le taux de départ de la région est dans la moyenne du groupe (7 % par an) : inutile de s'agiter, et personne n'est irremplaçable.",
      ceQuiLeDejoue:
        "Les statistiques du groupe ne disent rien d'Héloïse, que Loïc Tanguy a vue longuement avec le directeur régional de Valdane. Sidonie chiffre ce que coûte un chef d'agence qui part : quatre mois et 30 k€ pour le remplacer, près de 10 % de la marge de l'agence en attendant, et des clients qui le suivent chez le concurrent. Rejoué sur les trente tirages à la place des entretiens de rétention, ne rien brusquer perd 46 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "L'offre est écrite et Héloïse doit répondre vendredi : s'aligner sur les 12 % avec une prime de fidélité, Valdane aura du mal à suivre.",
      ceQuiLeDejoue:
        "La source sur les contre-offres : sur les cinq dernières du groupe, quatre acceptées, et trois de ces quatre personnes parties dans l'année ; à chaque fois, l'augmentation a fini par se savoir. Les notes de l'entretien disent ce qu'Héloïse attend : encadrer et transmettre, avec Kofi « prêt à tenir l'agence deux jours par semaine ». Sous le tirage n° 8, elle accepte Valdane malgré la contre-offre. Rejouée sur les trente tirages à la place du parcours, la contre-offre perd 48 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "C'est sa carrière et sa décision ; un chef d'agence se remplace.",
      ceQuiLeDejoue:
        "Elle n'a « pas encore décidé » et le dit en face : c'est une demande, pas une démission. Remplacer un chef d'agence coûte 30 k€ et quatre mois, et Vénissieux fait 36 k€ de marge par semaine ; son départ fait aussi baisser l'engagement de Habib et de Mathilde, et laisse Kofi tenir l'agence sans titre. Rejoué sur les trente tirages à la place du parcours, la laisser décider perd 68 k€ en moyenne, la plus grosse perte de l'épisode, et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Habib donne tout depuis des mois : une prime de 3 000 € reconnaît son engagement, tout de suite.",
      ceQuiLeDejoue:
        "Son agenda montre 52 heures par semaine, dont 11 au comptoir pour couvrir le poste vacant, et quatre heures chaque lundi à remplir deux reportings identiques. Il l'avait dit à l'entretien : « Un vendeur, et un reporting au lieu de deux. » Après la prime, il répond : « Samedi, je serai quand même au comptoir. » Sidonie annonce que le gel des embauches est levé pour les postes de vente. Rejouée sur les trente tirages à la place du vendeur recruté, la prime perd 17 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Tout le monde est sous pression : demander à Habib de tenir jusqu'à l'été ne coûte rien.",
      ceQuiLeDejoue:
        "Habib a raté l'anniversaire de son fils et ne sait pas « combien de temps je vais tenir comme ça » ; pas une semaine de congé depuis Pâques. Sans renfort ni allègement, sa charge s'accumule chaque semaine, et un concurrent qui recrute à deux kilomètres rend une offre concrète. Givors recule déjà de 4 % sur un an. Rejoué sur les trente tirages à la place du vendeur recruté, l'attente perd 22 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Mathilde demande sa grille de rémunération et les règles de mobilité : 5 % d'augmentation l'empêcheront de partir à son tour.",
      ceQuiLeDejoue:
        "Elle est déjà payée 2 % au-dessus de la médiane, et ce qu'elle demande est ailleurs : que l'on voie ce qu'elle fait à Tassin (+2,1 points de marge, la meilleure progression des six agences) et qu'on la laisse décider. Son projet de drive chantier, refusé deux fois, a été repris avec succès par Valdane à Écully. Une augmentation hors campagne se saurait vite : les six chefs d'agence se parlent chaque semaine. Rejouée sur les trente tirages à la place du pilote du drive, l'augmentation perd 11 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "C'est honnête : la politique du groupe ne permet aucune augmentation cette année, et cela ne coûte rien.",
      ceQuiLeDejoue:
        "Mathilde le répond elle-même : « Je ne demandais pas d'argent. » Ce qu'elle attend se donne sans dérogation : un mot devant les chefs d'agence à la réunion régionale, et 2 500 € de budget pour le pilote du drive à Tassin, dont elle décide de l'organisation. Rejoué sur les trente tirages à la place du pilote, le refus perd 12 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Kofi est un adjoint solide : s'aligner sur les 8 % de Valdane évite de perdre celui qui tient Vénissieux quand Héloïse est en mission.",
      ceQuiLeDejoue:
        "Au café, Kofi le dit : « J'adore ça. Je voudrais en faire plus, pas partir. Valdane m'offre surtout un titre. » La nomination comme chef d'agence délégué, avec un périmètre écrit, lui donne ce titre et des décisions pour 1 000 €, contre 2 500 € de dérogation ; et une augmentation de plus finit par se savoir. Rejoué sur les trente tirages à la place de la délégation, l'alignement perd 2,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Un adjoint se remplace : le poste sera publié en janvier, et l'agence a déjà sa cheffe.",
      ceQuiLeDejoue:
        "Remplacer un adjoint coûte 12 k€ dans le modèle, et c'est lui qui permet à Héloïse de tenir sa mission régionale deux jours par semaine. Ce qu'il cherche ne coûte que 1 000 € de délégation et de formation. Rejoué sur les trente tirages à la place de la délégation, le laisser partir perd 6,9 k€ en moyenne : il fait mieux 12 fois, de 1 k€, quand Kofi reste de lui-même, et perd 12 k€ les autres fois.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de salaire, d'autres un problème de charge, d'autres trois besoins différents. Quelles sources permettaient de trancher, et que disait la comparaison des salaires avec le marché ?",
    "Héloïse, Habib et Mathilde ne demandent pas la même chose. Pour chacun, dites ce qui lui manque, la source qui le montre, et la mesure qui y répond.",
    "Sidonie compte quatre contre-offres acceptées sur cinq, et trois départs dans l'année parmi ces quatre. Pourquoi une contre-offre retient-elle sur le moment et pas dans la durée ? Que se passe-t-il quand elle se sait ?",
    "Promettre le poste régional à Héloïse ne coûte rien aujourd'hui. Que coûte la promesse le jour où le comité gèle le poste ? Et pour Habib et Mathilde ?",
    "Sous le tirage n° 8, le comité a créé le poste : ceux qui avaient annoncé un nom en semaine 8 finissent au même niveau que ceux qui ont ouvert une préparation. Sur les trente tirages, annoncer un nom perd 20,5 k€ en moyenne, et jusqu'à 90 k€ quand le poste est gelé. Était-ce une bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Un chef d'agence qui part coûte 30 k€ de remplacement, quatre mois et près de 10 % de la marge de son agence. Combien coûte, au total, le départ d'Héloïse, et combien coûtait le parcours qui la retenait ?",
    "Quelle règle gardez-vous pour fidéliser une personne clé ? Formulez-la en une phrase, avec le moment où il faut agir.",
  ],
  prolongement: {
    enonce:
      "Une cheffe d'agence a reçu une offre d'un concurrent. Son agence fait 36 000 € de marge par semaine. Si elle part, la remplacer coûte 30 000 € et prend 16 semaines, pendant lesquelles l'agence perd 10 % de sa marge. Trois réponses sont possibles. Contre-offre : 5 500 € ; elle reste quatre fois sur cinq, mais trois sur quatre de ceux qui restent partent dans l'année. Parcours de développement : 3 500 € ; elle reste 85 fois sur 100, et 90 % de ceux qui restent sont encore là un an après. Ne rien faire : elle reste une fois sur quatre, et la moitié de ceux qui restent partent dans l'année. 1) Calculez le coût d'un départ. 2) Pour chaque réponse, calculez la probabilité qu'elle soit encore là dans un an. 3) Calculez le coût attendu de chaque réponse sur l'année : son coût, plus le coût d'un départ multiplié par la probabilité de départ. 4) Quelle réponse recommandez-vous, et quelle information vous manque-t-il pour la choisir ?",
    corrige:
      "1) 10 % × 36 000 × 16 = 57 600 € de marge perdue, plus 30 000 € de remplacement : 87 600 €. 2) Contre-offre : 4/5 × 1/4 = 20 % ; parcours : 0,85 × 0,90 = 76,5 % ; ne rien faire : 1/4 × 1/2 = 12,5 %. 3) Contre-offre : 5 500 + 0,80 × 87 600 = 5 500 + 70 080 = 75 580 € ; parcours : 3 500 + 0,235 × 87 600 = 3 500 + 20 586 = 24 086 € ; ne rien faire : 0,875 × 87 600 = 76 650 €. 4) Le parcours, de loin : la contre-offre coûte presque autant que ne rien faire, parce qu'elle ne traite pas la raison du départ. Mais ses chances ne valent que si l'on sait ce que la personne cherche : c'est l'entretien de rétention qui le dit, et sans lui, un parcours qui tombe à côté ne retient pas mieux qu'une augmentation.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 distingue les trois besoins (perspectives, charge, reconnaissance) avec les sources qui les montrent, et écarte le salaire avec la comparaison au marché.",
    "L'estimation de l'engagement en semaine 2 est raisonnée à partir du baromètre et de ce que la décision de la semaine 1 change ou ne change pas, et l'écart avec 45 est expliqué.",
    "Chaque mesure de fidélisation répond au besoin de la personne visée, et son coût est comparé à celui d'un départ.",
    "L'élève refuse de promettre ce qu'il ne maîtrise pas, et explique ce que vaut une préparation sur critères écrits quelle que soit la décision du comité.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 8.",
  ],
  vigilance:
    "La prévision porte sur un indicateur du modèle, l'engagement au baromètre, que les sources ne détaillent pas : c'est le raisonnement (un sursaut d'écoute qui redescend tant que rien ne change) plus que le chiffre qu'il faut corriger. Les augmentations « hors campagne » et les dérogations relèvent de la politique de rémunération propre à l'entreprise ; en droit, une différence de rémunération entre salariés placés dans une situation identique doit pouvoir être justifiée par des éléments objectifs, ce qui est à rappeler aux élèves quand l'épisode parle d'augmentations qui « se savent ». La réduction du préavis demandée par Héloïse suppose l'accord de l'employeur.",
};
