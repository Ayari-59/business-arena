/**
 * FICHE ENSEIGNANT · ÉPISODE 93, FORMER SES PROPRES SOIGNANTS.
 *
 * La gestion prévisionnelle des compétences dans un métier en pénurie :
 * qualifier les agents qui font déjà le travail plutôt que recruter à coups de
 * primes, et mesurer les parcours aux tutrices qui peuvent les suivre. Les
 * chiffres du hasard de la classe sont ceux de la graine 27, les moyennes
 * celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "former-ses-soignants",
  formations: ["stmg", "bts-sam", "but-gea"],
  programme: [
    "STMG · Terminale, ressources humaines et communication, Thème 1, Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "Quand un métier est en pénurie, les diplômés ne se trouvent pas dehors : une prime d'embauche déplace des soignants d'un employeur à l'autre, et ils repartent pour la prime suivante. Le levier est la compétence qu'on a déjà : les agents qui font le travail sans le diplôme. L'erreur classique consiste à lancer une campagne de recrutement, ou à tenir avec l'intérim et le faisant fonction, puis à compter dans l'effectif soignant des personnes qui ne sont pas encore diplômées. Dans l'épisode, l'Association Solvanne a 34 postes d'aides-soignants vacants et 40 de ses 110 agents de service font fonction ; l'intérim et les heures supplémentaires coûtent 15 120 € la semaine pour 14 000 € prévus à l'EPRD. La campagne de l'an dernier (prime de 2 000 €, 14 000 € de frais) a signé cinq aides-soignantes, dont trois sont reparties avant un an ; 92 % des élèves aides-soignants de la région ont un employeur avant leur diplôme. Une VAE accompagnée coûte 1 200 € par candidat après l'OPCO et diplôme 66 candidats sur cent en dix-huit mois. L'élève découvre qu'un parcours coûte maintenant et rapporte plus tard, que les diplômés formés chez soi restent (neuf sur dix un an après, contre 55 % des recrues externes), et qu'on ne lance pas plus de parcours que les tutrices n'en peuvent suivre : 14 tutrices, deux parcours chacune.",
  objectifs: [
    "Je calcule le nombre de diplômés qu'un parcours qualifiant donnera, en comptant les validations totales et les validations partielles qui se complètent.",
    "Je compare le coût d'un recrutement externe et celui d'une qualification interne, en tenant compte de ceux qui restent un an après.",
    "Je mesure les parcours lancés à la capacité de tutorat avant de m'engager.",
    "Je distingue un agent en formation d'un soignant diplômé, et je refuse de compter le premier dans l'effectif du second.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de compétence, de qualification, de recrutement interne et externe et de fidélisation doivent avoir été vues ; un pourcentage appliqué à un effectif suffit pour le calcul. La VAE, le tutorat et le rôle de l'OPCO peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/former-ses-soignants?hasard=27 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez l'association en deux phrases (34 postes vacants, 40 agents qui font fonction) sans parler de VAE, et vous demandez de noter sur papier le nombre de diplômés attendus calculé en semaine 1, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez le plan de la rentrée (semaine 1) et la réponse à la chute de Montbard (semaine 4), où la classe se partage souvent entre l'encadrement, la note de service et la suppression du faisant fonction de nuit. Un binôme qui a fini tôt compte les places de tutorat que prendrait chaque plan.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir de la source de l'OPCO : 45 validations totales et 35 partielles sur cent, dont six sur dix se complètent. Vous faites expliquer les valeurs éloignées (9, 16 ou 18), puis vous mettez en face la campagne de l'an dernier : cinq signées, deux encore là.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (campagne, VAE, institut, attente), de la semaine 4 (faisant fonction) et de la semaine 6 (apprentis). Pour la semaine 4, vous faites lire l'analyse des causes : pas de faute individuelle, un verticalisateur qui demande deux personnes, et un binôme de nuit à 720 € par semaine. Pour la semaine 6, vous faites compter les places : dix apprentis en prennent quinze, et le jury de la cohorte pilote arrive en semaine 10.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 27, « Former ses soignants » finit à 250 k€ de valeur nette, « Recruter dehors, à coups de primes » à −19 k€ et l'attente à −72 k€. Vous montrez ensuite la note de service de la semaine 4 : sous ce tirage, l'ARS n'est pas venue, et elle finit à peine au-dessus de l'encadrement (+0,3 k€), alors qu'elle perd près de 18 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : dans un métier en pénurie, on qualifie ceux qui font déjà le travail, autant qu'on peut les suivre. Vous la déclinez en trois gestes : chiffrer chaque voie jusqu'aux diplômés et à ceux qui restent, compter les tutrices avant les candidats, et encadrer le faisant fonction tant qu'il existe. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 13.2,
    etapes: [
      "Source « Faire le point avec le conseiller de l'OPCO sur les parcours qualifiants » : sur cent candidats accompagnés en VAE, 45 obtiennent une validation totale au premier jury, 35 une validation partielle, les autres abandonnent ou échouent.",
      "Même source : six validations partielles sur dix complètent les blocs manquants dans les dix-huit mois, soit 0,35 × 0,6 = 0,21 diplômé par candidat.",
      "Taux de diplômés en dix-huit mois : 0,45 + 0,21 = 0,66 par candidat engagé.",
      "Pour 20 candidats : 20 × 0,66 = 13,2 aides-soignants diplômés attendus. Le chiffre ne dépend pas du hasard : 13,2 pour toute la classe. L'épisode le juge juste à 0,5 près, proche à 1,5.",
      "Pour la suite : 13,2 diplômés pour 20 × 1 200 € = 24 000 € de frais nets après l'OPCO, soit environ 1 800 € par diplômé ; la campagne de l'an dernier avait coûté 14 000 € de frais, plus 2 000 € de prime par recrue, pour deux aides-soignantes encore là un an après.",
    ],
    erreurs: [
      {
        valeur: 9,
        cause:
          "Seules les validations totales sont comptées (20 × 0,45) : les validations partielles qui complètent leurs blocs dans les dix-huit mois sont oubliées.",
      },
      {
        valeur: 16,
        cause:
          "Toutes les validations, totales et partielles, sont comptées comme des diplômes (20 × 0,80) : quatre validations partielles sur dix ne se complètent pas dans les dix-huit mois.",
      },
      {
        valeur: 18,
        cause:
          "Le taux de réussite de la formation complète à l'institut (neuf sur dix) est appliqué aux vingt candidats en VAE : ce sont deux parcours différents.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Il manque des aides-soignants diplômés : une campagne avec une prime de 3 000 € en fait venir dans un mois, quand une VAE n'en diplôme qu'au bout de dix mois.",
      ceQuiLeDejoue:
        "Le bilan de la campagne de l'an dernier, raconté par Wendeline Lagoutte : 14 000 € de campagne et une prime de 2 000 € pour cinq signées, dont trois venues d'EHPAD voisins et trois reparties avant un an. 92 % des élèves aides-soignants ont un employeur avant leur diplôme, et 55 % seulement des recrues externes sont encore là un an après. Rejouée sur les trente tirages à la place de la VAE, la campagne perd 173 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi: "Pas de dépense nouvelle, et l'enveloppe de 60 k€ reste disponible pour plus tard.",
      ceQuiLeDejoue:
        "Le tableau de bord le dit dès 7 h 30 : 15 120 € d'intérim et d'heures supplémentaires la semaine, pour 14 000 € prévus, et Madeleine Sirugue rappelle que le CPOM demande de résorber le faisant fonction et que l'ARS regarde s'il existe un plan pour qualifier les agents. Attendre, c'est payer le trou chaque semaine sans préparer un seul diplômé. Rejoué sur les trente tirages à la place de la VAE, ne rien lancer perd 204 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "La règle existe déjà : un rappel écrit à tous les EHPAD montre que la direction réagit, sans alourdir la facture d'intérim.",
      ceQuiLeDejoue:
        "L'analyse des causes de Madeleine Sirugue : seule, l'agente n'avait pas le choix, le verticalisateur demande deux personnes, et une note ne change pas les plannings. Le directeur d'Auxonne raconte que l'ARS regarde qui fait quoi la nuit et les fiches de tâches. Un binôme de nuit coûte un poste d'intérim, 720 € par semaine. Rejouée sur les trente tirages à la place de l'encadrement, la note perd près de 18 k€ en moyenne, même si elle fait mieux 19 fois sur 30, quand l'ARS ne vient pas.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Dix apprentis qui tiennent presque un poste chacun, c'est 576 € d'intérim évité par semaine et par apprenti au lieu de 216 € en binôme.",
      ceQuiLeDejoue:
        "La directrice financière le chiffre : en binôme, un apprenti apporte un peu moins d'un tiers de poste ; Mauricette Péclard prévient qu'ils ne sont pas là pour boucher les trous, et le modèle diplôme moins de la moitié des apprentis laissés seuls, contre huit sur dix suivis. Ce sont aussi dix non diplômés de plus sur des soins d'aide-soignant. Rejoué sur les trente tirages à la place de dix apprentis suivis, ce choix perd près de 40 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Orchidia offre 4 000 € : s'aligner est la seule façon de garder les trois aides-soignantes de Dijon-Grésilles.",
      ceQuiLeDejoue:
        "Les entretiens disent autre chose : Safiatou parle des plannings changés la veille, Tamara voudrait transmettre, Begoña habite Chenôve. Un an après, 55 % seulement de celles qu'une prime avait retenues étaient encore là, contre 85 % des tutrices ; à Chalon, une prime de rétention a valu neuf demandes d'alignement et 9 000 € pour les apaiser. Le rôle de tutrice coûte 1 900 € par personne sur l'année. Rejouée sur les trente tirages à la place du rôle de tutrice, la prime perd près de 15 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Les huit candidats sont à un ou deux blocs du diplôme et savent faire : sur des postes d'aide-soignant, ils évitent deux postes d'intérim, 1 440 € par semaine.",
      ceQuiLeDejoue:
        "Apolonia Malecot lit les résultats bloc par bloc : avec les modules et une tutrice, 85 % valident dans l'année ; maintenus en faisant fonction, nuits comprises, sans temps pour préparer, 35 %. Madeleine Sirugue rappelle que ce sont huit non diplômés de plus sur des soins d'aide-soignant, et deux de plus la nuit, ce que le CPOM demande de résorber. Rejoué sur les trente tirages à la place des modules, ce choix perd 59 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème d'attractivité, d'autres un métier en pénurie. Qu'est-ce qui, dans le bilan de la campagne de l'an dernier, montrait qu'une prime ne créait pas d'aides-soignants de plus dans la région ?",
    "Vingt VAE donnent 13,2 diplômés en dix-huit mois, et rien pendant le trimestre. Pourquoi la direction générale juge-t-elle le trimestre sur une valeur estimée à la semaine 13, et que deviendrait le jugement si l'on ne regardait que la facture d'intérim de novembre ?",
    "Une tutrice suit deux parcours. Combien de places prenait votre plan en semaine 3, puis en novembre avec les apprentis et la cohorte pilote ? Que se passe-t-il pour tous les candidats quand on dépasse ?",
    "Après la chute de Montbard, le juriste déconseille une sanction. Pourquoi le faisant fonction est-il une organisation de l'employeur plutôt qu'une faute de l'agente, et que coûte une sanction à la déclaration des événements indésirables ?",
    "Sous le tirage n° 27, l'ARS n'est pas venue, et la note de service finit à peine au-dessus de l'encadrement ; sur les trente tirages, elle perd près de 18 k€ en moyenne. La note était-elle une bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Un apprenti compté dans l'effectif tient presque un poste ; suivi en binôme, un tiers. Pourquoi le second vaut-il mieux pour l'association, pour l'apprenti et pour les résidents ?",
    "Quelle règle présentez-vous au conseil d'administration pour les postes que l'on ne trouve pas dehors ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un service d'aide à domicile manque d'auxiliaires de vie diplômées. 1) Douze intervenantes font le travail sans le diplôme ; une VAE accompagnée coûte 2 800 € par candidate, dont 1 800 € pris en charge, et donne 50 % de validations totales et 30 % de validations partielles, dont la moitié se complètent dans les dix-huit mois. Combien de diplômées peut-on attendre, et que coûte chacune ? 2) Une campagne avec une prime de 2 500 € et 8 000 € de frais signerait six recrues, dont la moitié serait encore là un an après. Que coûte chaque recrue encore là ? 3) Neuf diplômées formées en interne sur dix restent un an : comparez le coût par diplômée encore là un an après.",
    corrige:
      "1) 12 × (0,50 + 0,30 × 0,5) = 12 × 0,65 = 7,8 diplômées ; frais nets de 12 × 1 000 = 12 000 €, soit environ 1 540 € par diplômée. 2) 6 × 2 500 + 8 000 = 23 000 € pour trois recrues encore là, soit environ 7 670 € chacune. 3) 7,8 × 0,9 = 7,02 diplômées encore là un an après, pour 12 000 €, soit environ 1 710 € chacune, plus de quatre fois moins que la campagne, et sans retirer d'aides à domicile à un autre employeur.",
  },
  evaluation: [
    "Le nombre de diplômés attendus est calculé juste (validations totales et partielles complétées) à partir de la source de l'OPCO, et l'élève dit pourquoi le résultat n'arrive pas dans le trimestre.",
    "Le choix entre recruter et qualifier est argumenté par le coût et par ceux qui restent un an après, avec les chiffres de la campagne de l'an dernier.",
    "Le nombre de parcours lancés est rapporté à la capacité de tutorat, à chaque décision qui en ajoute.",
    "La réponse à la chute de Montbard traite l'organisation de la nuit, sans faute individuelle, et sans laisser des non diplômés seuls sur des soins d'aide-soignant.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 27.",
  ],
  vigilance:
    "Les taux de réussite de la VAE, les montants pris en charge par l'OPCO, le délai de cinq ans pour valider les blocs manquants et le financement de l'apprentissage sont ceux de l'épisode, fictifs ; les règles de la VAE et du diplôme d'État d'aide-soignant ont changé ces dernières années, et un enseignant de la filière sanitaire et sociale voudra vérifier celles en vigueur. Le faisant fonction (un agent de service qui réalise des soins d'aide-soignant) engage la responsabilité de l'employeur : l'épisode le pose ainsi, sans détailler le cadre juridique des actes autorisés, qui mérite d'être relu avec un professionnel.",
};
