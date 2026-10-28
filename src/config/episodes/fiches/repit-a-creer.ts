/**
 * FICHE ENSEIGNANT · ÉPISODE 85, LE RÉPIT À CRÉER.
 *
 * Entreprendre un projet social, de l'intention à l'ouverture : vérifier le
 * besoin chez ceux qui l'ont, choisir une forme, réunir les acteurs, calculer
 * un modèle économique, mesurer l'utilité. Le piège est d'aller vite et seul,
 * parce que « le besoin est évident ».
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "repit-a-creer",
  formations: ["seconde-mg"],
  programme: [
    "2de MG · S'engager et entreprendre, de l'intention à la création",
    "2de MG · Organiser et décider, des objectifs à la réalisation",
  ],
  notion:
    "Une bonne idée ne suffit pas à faire un projet : il faut vérifier le besoin chez ceux qui l'ont, choisir une forme qui permet d'agir, trouver des alliés, calculer qui paie quoi, et montrer à quoi le projet sert. L'erreur classique consiste à se dire que le besoin est évident et à ouvrir vite, seul, gratuitement, puis à compter les passages. Dans l'épisode, Alix Fournier fait des soins à domicile pour l'Association Solvanne, à Dijon, et veut créer un accueil de répit : une demi-journée où la personne aidée est accueillie pendant que l'aidant souffle. Le service suit 120 familles, et environ une sur quatre a un aidant épuisé, soit une trentaine d'aidants. Les familles rencontrées ne veulent pas le mardi mais le samedi après-midi, avec un transport ; un service de Solvanne peut ouvrir dès la semaine 8, une association nouvelle pas avant la semaine 12 ; la mairie prête une salle et des bénévoles formés permettent d'ouvrir plus. L'élève découvre qu'une demi-journée de six places coûte 108 €, qu'une participation de 5 € par famille, une subvention et un mécène local la font tenir, qu'un prix qui couvre tout (18 €) vide l'accueil, et qu'un financeur renouvelle son aide quand on lui montre des heures de répit, des familles aidées et une fatigue qui baisse.",
  objectifs: [
    "Je vérifie un besoin en interrogeant les personnes concernées, et je sais dire ce qu'un sondage ne dit pas (le jour, l'heure, le transport).",
    "Je calcule une part d'une population (une famille sur quatre) pour estimer le public d'un projet.",
    "Je compare des formes juridiques simples selon le délai, l'assurance et la possibilité de recevoir une subvention.",
    "Je calcule le coût d'une demi-journée et ce que la participation des familles en couvre, pour savoir ce qu'il reste à financer.",
    "Je choisis des indicateurs qui montrent l'utilité sociale d'un projet, et je distingue la qualité d'un choix du résultat obtenu sous un tirage.",
  ],
  prerequis:
    "Aucun prérequis de gestion : une fraction, une multiplication et une soustraction suffisent. La notion d'aidant et celle d'association peuvent être présentées en cinq minutes avant de jouer.",
  dureeMinutes: 90,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/repit-a-creer?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent en binôme. Vous lisez le message de Mme Bernard (« Je n'ai pas eu une après-midi à moi depuis un an ») et vous demandez de noter sur papier le nombre d'aidants épuisés estimé en semaine 1, avec son calcul, et la façon choisie de vérifier le besoin.",
    },
    {
      minutes: 30,
      titre: "Le trimestre",
      detail:
        "Les binômes jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la façon de vérifier le besoin (semaine 1), la forme du projet (semaine 2) et le modèle économique (semaine 8), où la classe se partage souvent entre la gratuité, la participation et le mécène unique. Un binôme qui a fini tôt calcule le prix qui couvrirait tous les coûts d'une demi-journée.",
    },
    {
      minutes: 10,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les nombres relevés, puis vous refaites le calcul avec la classe : 120 familles suivies, une sur quatre, soit 30 aidants épuisés. Vous faites expliquer les valeurs éloignées (480, 90 ou 15). Vous ajoutez que le modèle tire le nombre réel autour de 30 (31 sous le tirage de la classe) : une estimation n'est pas un comptage, et c'est pour cela qu'on va voir les familles.",
    },
    {
      minutes: 15,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 et de la semaine 8. Pour la semaine 1, faites comparer ce que dit le sondage (90 % de oui, aucun jour) et ce que disent les familles rencontrées (le samedi, un transport). Pour la semaine 2, faites lire la source de l'assureur : un groupe d'amis sans forme n'est couvert par personne. Pour la semaine 8, faites calculer au tableau une demi-journée : 90 € de salariée, 3 € par personne pour six personnes, 5 € de participation par famille.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, « Écouter, s'appuyer, calculer » finit à 23 k€ de valeur créée, « Ne rien préparer » à 4 k€ et « Aller vite, et seul » à 2,6 k€. Vous faites remarquer deux surprises : le fonds n'a pas accordé la subvention de démarrage, même au bon projet, et ceux qui ont commencé sans forme n'ont pas eu d'accident. Sur les trente tirages, partir sans forme perd pourtant 6,4 k€ en moyenne et ne fait jamais mieux. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les six étapes du projet, chacune avec sa question : qui en a besoin, et quand ? sous quelle forme ? avec qui ? pour quelle date, en remontant le temps ? qui paie quoi ? comment montrer que ça sert ? Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 30,
    etapes: [
      "Source « Compter les aidants épuisés dans les dossiers du service » : le service suit 120 familles dans le quartier.",
      "Même source : environ une famille sur quatre a un aidant qui dit être épuisé.",
      "Une sur quatre, c'est diviser par 4 : 120 / 4 = 30 aidants épuisés.",
      "C'est une estimation : le nombre réel, tiré par le modèle, tourne autour de 30 (31 sous le tirage de la classe). L'épisode juge la prévision juste à 3 aidants près, proche à 8.",
    ],
    erreurs: [
      {
        valeur: 480,
        cause: "Les 120 familles multipliées par 4 au lieu d'être divisées : « une sur quatre » est une part, pas un multiplicateur.",
      },
      {
        valeur: 90,
        cause: "Les trois quarts comptés au lieu du quart (120 × 3 / 4) : ce sont les familles dont l'aidant n'est pas épuisé.",
      },
      {
        valeur: 15,
        cause: "Le nombre de familles qu'on propose de rencontrer en semaine 1, pris pour le nombre d'aidants épuisés.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 3,
      pourquoi: "Tout le monde sait que les aidants sont fatigués : vérifier, c'est perdre du temps.",
      ceQuiLeDejoue:
        "Les trois familles rencontrées pendant les tournées disent toutes la même chose : le samedi après-midi, et un transport ; Mme Bernard fait ses courses le mardi. Sabine Vautrin conseille d'aller voir les familles avant d'acheter quoi que ce soit. Savoir qu'elles sont fatiguées ne dit ni le jour, ni l'heure. Rejoué sur les trente tirages à la place des quinze familles rencontrées, ne rien vérifier perd 5,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi: "Pas de papiers, on ouvre plus tôt : on verra la forme plus tard.",
      ceQuiLeDejoue:
        "L'assureur de Solvanne prévient : un groupe d'amis sans forme n'est couvert par personne, et aucun financeur ne lui verse d'argent. Eudoxie Rambourg montre qu'un service de Solvanne ouvre dès la semaine 8, avec l'assurance, la comptabilité et les salariés qui existent déjà. Sous le tirage de la classe, aucun accident n'est arrivé ; rejoué sur les trente tirages, partir sans forme perd pourtant 6,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi: "Faire tout soi-même, c'est ne dépendre de personne et avancer à son rythme.",
      ceQuiLeDejoue:
        "La liste de ce que chacun apporte : la mairie prête une salle le samedi, des bénévoles formés permettent d'ouvrir plus de demi-journées, et le fonds finance plus volontiers un projet que la mairie et des bénévoles soutiennent déjà. Seule, Alix n'ouvre que deux demi-journées par semaine. Rejoué sur les trente tirages à la place de la réunion des acteurs, tout faire seul perd 8,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Les familles attendent : ouvrir dès la semaine prochaine, et régler les détails ensuite.",
      ceQuiLeDejoue:
        "La liste de ce qui doit être prêt (la salle, l'assurance, les bénévoles formés, le goûter, les familles prévenues par leurs soignants) prend environ trois semaines, et les familles ne viennent que si leur soignant leur en parle. Gérard Lamy le constate : il manquait le goûter, et personne ne savait que l'accueil était ouvert. Rejoué sur les trente tirages à la place du calendrier remonté étape par étape, ouvrir tout de suite perd 3,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi: "Gratuit, personne n'est arrêté par le prix : c'est le plus juste pour des familles fatiguées.",
      ceQuiLeDejoue:
        "Le calcul du seuil montre qu'une participation de 5 € par famille, une subvention et un mécène local de 1 500 € font tenir l'accueil ; le fonds dit aimer les projets où les familles participent un peu. Gratuit, des familles réservent et ne viennent pas, et les places restent vides. Rejoué sur les trente tirages à la place de la participation, l'accueil gratuit perd 3,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "Le nombre de visites, c'est simple, ça ne coûte rien, et ça montre que l'accueil marche.",
      ceQuiLeDejoue:
        "Le fonds dit ce qu'il appelle utilité sociale : combien d'heures de répit, combien de familles aidées, et si les aidants sont moins épuisés qu'avant ; un questionnaire de cinq questions, rempli à l'arrivée puis un mois après, prend deux minutes. Compter les passages ne dit pas si les aidants vont mieux, et la subvention de 12 000 € de l'an prochain en dépend. Rejoué sur les trente tirages à la place des trois chiffres, il perd 6,4 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont pensé à l'argent, d'autres à la salle, d'autres aux familles. Qu'est-ce que les familles rencontrées ont appris à Alix qu'aucun sondage ne lui aurait dit ?",
    "Un service de Solvanne, une association nouvelle, une coopérative, un groupe d'amis : qu'est-ce qui change d'une forme à l'autre ? Pourquoi la forme la plus libre est-elle la plus lente ?",
    "Une demi-journée de six places coûte 108 €. Que paient les familles avec une participation de 5 € ? Qui paie le reste ? Pourquoi un prix de 18 €, qui couvre tout, ferait-il moins de bien ?",
    "La grande surface proposait de tout payer. Sur les trente tirages, ce mécène unique fait mieux 13 fois, et perd 3,4 k€ en moyenne. Sous le tirage n° 12, il s'est retiré en semaine 11. Pourquoi un seul payeur rend-il un projet fragile ?",
    "Sous le tirage n° 12, ceux qui ont commencé sans forme n'ont pas eu d'accident. Leur choix était-il bon pour autant ? Qu'aurait coûté une chute dans la salle, sans assurance ?",
    "Quels trois chiffres montrez-vous au fonds pour qu'il renouvelle son aide ? Formulez votre réponse en une phrase.",
  ],
  prolongement: {
    enonce:
      "Un club sportif veut ouvrir un accueil de répit deux demi-journées par semaine, pendant 10 semaines. Une demi-journée accueille 6 personnes ; elle coûte 96 € d'animation, plus 4 € de goûter et de matériel par personne. Chaque famille paie 6 € par demi-journée. 1) Combien coûte une demi-journée pleine ? 2) Combien les familles en paient-elles, et combien reste-t-il à financer ? 3) Combien faut-il trouver en subventions et en mécénat pour les 10 semaines ? 4) Quel prix faudrait-il demander à chaque famille pour tout couvrir ? 5) Une demi-journée, c'est 4 heures de répit pour chaque aidant ; une heure vaut 30 €. Combien d'heures de répit, et quelle valeur, sur les 10 semaines si toutes les places sont prises ?",
    corrige:
      "1) 96 + 6 × 4 = 96 + 24 = 120 €. 2) Les familles paient 6 × 6 = 36 € ; il reste 120 − 36 = 84 € à financer. 3) 2 demi-journées × 10 semaines = 20 demi-journées ; 20 × 84 = 1 680 €. 4) 120 / 6 = 20 € par famille, plus de 3 fois la participation prévue. 5) 20 demi-journées × 6 aidants × 4 heures = 480 heures de répit, soit 480 × 30 = 14 400 €.",
  },
  evaluation: [
    "L'estimation de la semaine 1 est juste (120 / 4 = 30), et l'élève sait dire qu'il s'agit d'une estimation à vérifier auprès des familles.",
    "Le choix de la façon de vérifier le besoin est justifié par ce qu'il apprend (le jour, l'heure, le transport), et non par sa rapidité.",
    "La forme du projet est choisie en comparant le délai, l'assurance et l'accès aux financements.",
    "Le coût d'une demi-journée et la part payée par les familles sont calculés juste, et le reste à financer est identifié.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode présente les formes juridiques de façon très simplifiée, au niveau de la seconde : la création d'une association (statuts, assemblée constitutive, déclaration en préfecture), une société coopérative d'intérêt collectif associant une commune et l'accueil de personnes dépendantes par des bénévoles relèvent de règles que l'épisode ne détaille pas. Un accueil de jour ou de répit réglementé suppose aussi une autorisation et un encadrement que l'épisode ne traite pas : à signaler aux élèves comme une limite du jeu.",
};
