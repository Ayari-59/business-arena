/**
 * FICHE ENSEIGNANT · ÉPISODE 15, LE QUAI DANGEREUX.
 *
 * Prévention des risques sur une plateforme logistique : les presque-accidents
 * sont des signaux qu'on écoute, le danger se traite à la source en séparant
 * les flux. Le piège : chercher un coupable, rappeler la consigne, tenir la cadence.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "quai-dangereux",
  formations: ["seconde-pro-gatl", "bts-gpme"],
  programme: [
    "2de pro GATL · 5, Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
    "2de pro GATL · 2, Organiser et planifier l'activité",
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
  ],
  notion:
    "Un accident grave est rare, mais il repose sur une base large de presque-accidents : c'est en les déclarant et en les analysant qu'on supprime le danger avant qu'il ne blesse. L'erreur classique, après un incident, consiste à chercher le coupable et à rappeler la consigne, puis à tenir la cadence de la saison par une prime au rendement ; le résultat est un registre vide et un danger intact. Dans l'épisode, Agathe Bonnefoy, responsable d'exploitation de la plateforme de Saint-Quentin-Fallavier, apprend qu'un chariot a frôlé un chauffeur au quai 4. Le registre ne compte que six presque-accidents déclarés en treize semaines quand les chefs d'équipe en citent quatre à cinq par semaine, et deux déclarants ont reçu un avertissement ; l'observation des quais compte vingt-trois croisements piétons et chariots par heure dans l'allée centrale, sans marquage, et un cariste intérimaire conduit avec un CACES expiré. L'élève découvre qu'une analyse sans recherche de coupable fait remonter les signaux, qu'une séparation physique des flux vaut mieux qu'une campagne de consignes qui s'use en un mois, et que la sécurité et la cadence se tiennent ensemble en lissant les pics plutôt qu'en pressant les équipes.",
  objectifs: [
    "Je lis un registre de presque-accidents comme un signal, et je sais pourquoi un nombre de déclarations qui monte peut être une bonne nouvelle.",
    "J'analyse un incident avec l'équipe sans chercher de coupable, et j'en tire une mesure qui traite le danger à sa source.",
    "Je hiérarchise les mesures de prévention : supprimer ou séparer le danger avant de rappeler une consigne.",
    "Je vérifie qu'un salarié qui conduit un engin a la formation et l'autorisation de conduite à jour, et j'en tire la décision.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de risque professionnel, d'accident du travail et de prévention doivent avoir été vues en cours. La pyramide des presque-accidents, la hiérarchie des mesures de prévention et l'analyse sans recherche de coupable peuvent être découvertes pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/quai-dangereux?hasard=18 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le nombre de presque-accidents qui seront déclarés d'ici la fin de la semaine 4 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la réponse de la semaine 1 (sanction, quart d'heure de consignes, analyse sans coupable, rien) et celle de la semaine 6 pour passer le pic de la saison, où la classe se partage souvent entre la prime au rendement et le lissage des commandes. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 4 : la campagne de consignes au lieu de la séparation des flux.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement : quatre à cinq presque-accidents réels par semaine selon les chefs d'équipe, dont une petite part déclarée tant que déclarer expose à un avertissement, et environ la moitié une fois l'analyse sans coupable lancée. Sous le tirage n° 18, le modèle donne 7 déclarations avec la meilleure méthode, 3 avec la sanction, 5 sans rien changer. Vous faites remarquer que le chiffre le plus haut est ici le meilleur signe.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 pour Dylan Fournier (retirer et former, laisser conduire, rendre à l'agence) et de la semaine 6. Vous faites lire la réponse du service juridique sur la formation et l'autorisation de conduite, et le bilan de la prime au rendement de l'an dernier : 6 % de cadence en plus pendant cinq semaines, deux accidents avec arrêt et 14 000 € de racks et de portes heurtés.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 18, « Écouter les signaux et traiter à la source » finit 26,1 k€ au-dessus du budget de marge, « Consignes, sanctions et cadence » 228 k€ en dessous et l'attentisme 265,3 k€ en dessous, tous deux frappés par un accident grave en semaine 11. Sur les trente tirages, l'accident grave arrive 2 fois avec la meilleure méthode, 9 fois avec chacune des deux autres. Vous en faites la leçon centrale : la sécurité se juge sur une probabilité, pas sur un trimestre sans accident.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la hiérarchie de l'épisode : supprimer ou séparer le danger d'abord (allée protégée, accueil déplacé, cales et feux de quai), former et habiliter ensuite, rappeler la consigne en dernier. Vous y ajoutez la règle des signaux : on ne punit pas celui qui déclare, on lui montre ce que sa fiche a changé. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 7,
    etapes: [
      "Source « Relire le registre des presque-accidents » : six déclarés en treize semaines, alors que les chefs d'équipe en citent quatre à cinq par semaine, et deux déclarants ont reçu un avertissement. Les presque-accidents réels sont donc de l'ordre de 4 à 5 par semaine, et presque aucun n'est écrit.",
      "La semaine 1 se joue encore avec les habitudes d'avant : de l'ordre d'une déclaration. À partir de la semaine 2, l'analyse sans coupable et la fiche simplifiée font remonter environ la moitié des presque-accidents ; une sanction, à l'inverse, ferait tomber la part déclarée à une sur dix.",
      "Dans le même temps, l'allée provisoire réduit les croisements, et Dylan Fournier ne conduit plus à partir de la semaine 3 : les presque-accidents réels baissent un peu. Estimation : 1 + 3 semaines × environ 2 déclarations = 7.",
      "Sous le tirage n° 18, le modèle donne 1, 2, 3 puis 1 déclarations en semaines 1 à 4 : 7 au total. Avec la sanction, il en donne 3 ; sans rien changer, 5.",
      "L'épisode juge juste à 2 près, proche à 4. Selon les trente tirages du bilan, la meilleure méthode en compte de 6 à 10.",
    ],
    erreurs: [
      {
        valeur: 2,
        cause:
          "Le rythme du registre prolongé (six en treize semaines, soit environ un toutes les deux semaines) : c'est le rythme d'un site où déclarer expose à une sanction, pas celui d'une équipe qui voit ses fiches analysées.",
      },
      {
        valeur: 18,
        cause:
          "Les quatre à cinq presque-accidents réels de chaque semaine comptés comme déclarés (4,5 × 4) : même sans crainte, une partie seulement est écrite.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi: "Il faut un signal fort : un avertissement à Rémi et une note aux quais, et tout le monde fera attention.",
      ceQuiLeDejoue:
        "Le registre le montrait : deux des six déclarants ont reçu un avertissement, et depuis, plus rien n'a été écrit. L'observation des quais compte vingt-trois croisements par heure dans l'allée centrale, sans marquage : Rémi n'est pas la cause. Nadège Coulon : « Ne cherche pas le coupable de jeudi. » Thierry Gomez le constate : « celui qui parle, on le punit ». Rejouée sur les trente tirages à la place de l'analyse sans coupable, la sanction perd 15,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi: "Dylan est l'un des plus rapides, la saison arrive : le recyclage attendra le trimestre prochain.",
      ceQuiLeDejoue:
        "Le service juridique : conduire un chariot exige une formation et une autorisation de conduite délivrée par l'employeur ; en cas d'accident grave, l'assureur estime le surcoût à 60 000 € au moins. L'agence propose un recyclage de deux jours en semaine 4 pour 900 €, Dylan préparant des commandes d'ici là. Rejoué sur les trente tirages à la place du recyclage, le laisser conduire perd 6,5 k€ en moyenne ; il fait mieux 2 fois sur 30, quand rien n'arrive, ce qui ne le rend pas acceptable.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi: "Une campagne gilets et klaxon coûte 1 200 € quand la séparation des flux en coûte 7 000 € et ralentit les quais.",
      ceQuiLeDejoue:
        "Le bilan des campagnes précédentes : les croisements dangereux ont baissé de 15 % la première semaine, puis sont revenus à leur niveau en un mois, deux années de suite. La carte des croisements place le danger au même endroit, et sur les sites du groupe qui ont séparé les flux, les croisements ont baissé de plus de moitié. Rejouée sur les trente tirages à la place de la séparation, la campagne perd 12,3 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Il faut tenir la cadence jusqu'à la semaine 11 : une prime au rendement fait gagner 6 % pour 1 800 € par semaine.",
      ceQuiLeDejoue:
        "Le bilan de la prime de l'an dernier : 6 % de cadence pendant cinq semaines, deux accidents avec arrêt et 14 000 € de racks et de portes de quai heurtés ; et celui qui s'arrête pour remplir une fiche perd sa prime. La source sur les vagues de commandes montrait l'autre levier : 45 % des palettes commandées pour le lundi et le mardi, et des agences qui acceptent de lisser six fois sur dix. Rejouée sur les trente tirages à la place du lissage, la prime perd 14,1 k€ en moyenne ; elle fait mieux 10 fois sur 30, quand aucun accident ne survient.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi: "Le comité de direction le propose : une prime collective si rien n'est déclaré, tout le monde se mobilise pour la sécurité.",
      ceQuiLeDejoue:
        "Les élus du CSE le disent tout de suite : « Plus personne ne remplira une fiche. » Une prime au zéro déclaration récompense le silence, pas la sécurité : la part des presque-accidents déclarés s'effondre, et l'analyse des fiches n'a plus de quoi travailler. Les fiches du trimestre montraient pourtant un danger nouveau, les camions qui avancent pendant le chargement, que des cales et un feu de quai règlent. Rejoué sur les trente tirages à la place de l'analyse hebdomadaire, le challenge perd 14,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi: "Deux remorques par quai : la cadence monte vite et on rattrape le retard avant la fin du trimestre.",
      ceQuiLeDejoue:
        "La source sur les palettes en attente : six sur dix sont du réassort que les agences peuvent recevoir la semaine suivante sans rupture, si on leur donne une date ferme. Charger deux remorques par quai fait croiser les chariots à l'arrière des remorques, comme le dit Thierry Gomez. Rejoué sur les trente tirages à la place des chantiers d'abord et d'une date ferme, il perd 3,6 k€ en moyenne ; il fait mieux 10 fois sur 30, quand aucun accident ne survient.",
    },
  ],
  debrief: [
    "En semaine 1, six presque-accidents déclarés en treize semaines, et les chefs d'équipe en citent quatre à cinq par semaine. Que dit cet écart, et qu'est-ce qui l'expliquait dans le registre ?",
    "Ceux qui ont sanctionné Rémi ont vu moins de presque-accidents déclarés que les autres. Leur plateforme était-elle plus sûre ? Comment peut-on se servir d'un indicateur qui monte quand les choses vont mieux ?",
    "Une campagne de consignes coûte 1 200 €, une séparation des flux 7 000 €. Pourquoi la seconde est-elle la moins chère sur le trimestre ? Classez les mesures de l'épisode de la plus efficace à la moins efficace.",
    "Laisser Dylan conduire, mettre une prime au rendement, charger deux remorques par quai : chacune fait mieux certains tirages, quand rien n'arrive. Pourquoi ne suffit-il pas qu'une décision ait bien fini pour qu'elle soit bonne ?",
    "Sous le tirage n° 18, les deux méthodes qui pressent ou attendent ont connu un accident grave en semaine 11 ; sur les trente tirages, elles en connaissent 9, contre 2 pour la meilleure. Que mesure le bilan, si l'accident grave reste un tirage ?",
    "Sous le tirage de la classe, les agences ont accepté de lisser leurs commandes, comme 17 fois sur 30. Si elles avaient refusé, la décision aurait-elle été mauvaise ?",
    "Quelle règle gardez-vous après un presque-accident ? Formulez-la en une phrase, avec celui qui déclare dedans.",
  ],
  prolongement: {
    enonce:
      "Une plateforme de 44 salariés compte 6 presque-accidents déclarés sur un trimestre de 13 semaines, alors que les chefs d'équipe en estiment 4,5 par semaine. Elle a eu 2 accidents avec arrêt sur l'année ; chaque salarié travaille 1 600 heures par an. 1) Combien de presque-accidents réels sur le trimestre, et quel est le taux de déclaration ? 2) Calculez le taux de fréquence de l'année (accidents avec arrêt × 1 000 000 / heures travaillées). 3) Après une analyse sans coupable, 26 fiches arrivent au trimestre suivant, pour le même nombre de presque-accidents réels. Quel est le nouveau taux de déclaration ? Le site est-il devenu plus dangereux ? 4) Une allée piétonne protégée coûte 7 000 €. On estime qu'elle fait passer la probabilité d'un accident grave sur le trimestre de 15 % à 5 %, pour un coût de 150 000 € par accident grave. Est-elle rentable sur un seul trimestre ?",
    corrige:
      "1) 4,5 × 13 = 58,5 presque-accidents réels ; 6 / 58,5 ≈ 10 %. 2) Heures travaillées : 44 × 1 600 = 70 400 ; taux de fréquence : 2 × 1 000 000 / 70 400 ≈ 28,4. 3) 26 / 58,5 ≈ 44 %. Le site n'est pas plus dangereux : il voit enfin ses signaux, et peut les traiter. 4) Coût attendu des accidents graves : 0,15 × 150 000 = 22 500 € sans l'allée, 0,05 × 150 000 = 7 500 € avec. L'allée évite 15 000 € de coût attendu pour 7 000 € : elle est rentable dès le premier trimestre, sans compter les blessures évitées, qui ne se ramènent pas à des euros.",
  },
  evaluation: [
    "La prévision de la semaine 1 relie le nombre de déclarations à ce qui arrive à ceux qui déclarent, et pas seulement au danger.",
    "Le diagnostic s'appuie sur les sources chiffrées (registre, croisements observés, habilitations) plutôt que sur l'imprudence d'un cariste.",
    "Les mesures choisies sont classées selon la hiérarchie de la prévention : séparer le danger avant de rappeler la consigne.",
    "La décision sur Dylan Fournier est justifiée par l'obligation de formation et d'autorisation de conduite, et non par la cadence.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "L'épisode pose qu'un cariste doit avoir une formation et une autorisation de conduite délivrée par l'employeur ; le CACES est le moyen usuel de justifier la formation. Le partage des obligations entre l'entreprise de travail temporaire et l'entreprise utilisatrice, la formation renforcée à la sécurité des intérimaires sur les postes à risque et le régime de la faute inexcusable sont à relire par un enseignant de droit ou de prévention. Les montants (60 000 € de surcoût, 150 000 € pour un accident grave) sont des hypothèses de l'épisode.",
};
