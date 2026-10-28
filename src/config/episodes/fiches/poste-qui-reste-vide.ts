/**
 * FICHE ENSEIGNANT · ÉPISODE 23, LE POSTE QUI RESTE VIDE.
 *
 * Recruter sous pression : l'annonce qui remplit le vivier, l'entretien
 * structuré qui trie, l'offre qui part vite, l'intégration qui fait la montée
 * en charge. Le piège : le coup de cœur recommandé, qui n'est un bon choix
 * qu'une fois sur trois. Les chiffres du hasard de la classe sont ceux de la
 * graine 12.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "poste-qui-reste-vide",
  formations: ["stmg", "bts-gpme", "bts-sam"],
  programme: [
    "STMG · Ressources humaines et communication, Thème 1, Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
  ],
  notion:
    "Un recrutement se joue avant l'entretien, pendant l'entretien et après la signature. L'erreur classique consiste à croire que le poste reste vide faute de visibilité (on paie une diffusion plus large de la même annonce), puis à recruter le candidat recommandé « parce qu'il est libre tout de suite et que tout le monde l'adore », et enfin à le lâcher seul avec le fichier clients. Dans l'épisode, Marion Dubreuil dirige l'agence Arvel Distribution de Villefranche-sur-Saône : Julien Faure, technico-commercial, est parti il y a trois semaines, ses 52 clients pèsent plus de 120 k€ de marge par trimestre et l'équipe tourne à 125 % de charge. L'annonce, celle de 2017, demande un « vendeur conseil » avec cinq ans de négoce et ne dit ni le secteur, ni la rémunération, ni le véhicule : sur 9 candidatures, 6 viennent de vendeurs de magasin et une seule d'un profil terrain. Gilles Peyrot, plombier client, recommande Jordan Ferrand, vendeur en grande surface de bricolage. L'élève découvre que c'est l'annonce réécrite qui remplit le vivier, que la grille d'entretien et les références trient mieux que l'impression, qu'un bon candidat qui attend dix jours accepte une autre offre, et qu'une recrue parrainée est autonome en cinq à six semaines quand trois recrues sur huit parties seules ont quitté avant la fin de leur période d'essai.",
  objectifs: [
    "Je décris un poste par ses missions réelles avant de rédiger l'annonce, et je dis à qui elle s'adresse.",
    "Je hiérarchise un portefeuille de clients par sa marge pour organiser l'intérim d'un poste vacant.",
    "Je conduis une sélection structurée (mêmes questions, mise en situation, grille notée à deux, références) plutôt qu'au feeling.",
    "Je construis l'intégration d'une recrue (parrain, plan des premières semaines, point à mi-période d'essai) et j'en mesure l'effet sur sa montée en charge.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les étapes d'un processus de recrutement (définition du poste, annonce, présélection, entretien, intégration) et la notion de période d'essai doivent avoir été vues en cours. L'entretien structuré, le coût d'une vacance et le coût d'un recrutement raté peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/poste-qui-reste-vide?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation du nombre de candidatures reçues d'ici la fin de la semaine 4 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : le sort de l'annonce en semaine 1, et la façon de choisir en semaine 4 (Jordan sans entretien, entretien structuré, au feeling, ou attendre le profil idéal), la décision où la classe se partage le plus. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 5 : la procédure habituelle au lieu de l'offre ferme sous 48 heures.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées et vous les rapprochez du choix fait sur l'annonce : le nombre de candidatures dépend d'abord de ce que dit l'annonce. Vous reconstruisez le raisonnement (une semaine pour réécrire, puis un flux plus fort et plus qualifié), puis vous donnez ce que le modèle a compté sous le tirage n° 12 : 17 candidatures avec l'annonce réécrite, 12 avec la rediffusion payante, 5 avec le cabinet ou en patientant. Vous faites expliquer les valeurs éloignées (12, 21, 24).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 4. Les élèves qui ont recruté Jordan défendent leur choix (la recommandation, la disponibilité, l'équipe à bout) ; la classe le confronte à l'appel de son ancien responsable et à la remarque de Nicolas Perrin : « vendre du placo à un plaquiste, c'est autre chose ». Vous enchaînez sur l'offre de la semaine 5 : faites dire ce que le candidat a répondu (« Celui qui me répond le premier avec une offre claire aura une longueur d'avance ») et ce que Gérald Fontaine accepte de valider par mail.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, la « Bonne méthode » finit 11,1 k€ au-dessus du budget de contribution, « Attendre le candidat parfait » 25,6 k€ en dessous, « Le coup de cœur » 43,9 k€ en dessous : sous ce tirage, Jordan n'était pas un bon technico-commercial. Sur les trente tirages, la bonne méthode tient le budget 23 fois, les deux autres jamais. Vous montrez aussi que, sous le tirage de la classe, garder l'ancienne annonce aurait fait 0,4 k€ de mieux que la réécrire, parce que le vivier contenait quand même un bon candidat : sur les trente tirages, ce pari perd 13 k€ environ une fois sur deux.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les quatre temps du recrutement et le geste de chacun : définir le poste (l'annonce dit le métier, le secteur, la rémunération, le véhicule), trier (une grille commune notée à deux, une mise en situation, des références), conclure vite (une offre ferme et complète), intégrer (un parrain disponible, un plan, un point à mi-période d'essai). Vous ajoutez la règle de l'intérim : protéger d'abord les douze clients qui font 58 % de la marge. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 17,
    etapes: [
      "Point de départ (alerte du lundi) : 9 candidatures reçues en trois semaines avec l'ancienne annonce, soit 3 par semaine, dont un seul profil terrain. Le compteur de la prévision part de zéro au début du trimestre : les 9 déjà reçues n'y entrent pas.",
      "Ce que montrent les sources : l'annonce de 2017 attire des vendeurs de magasin (6 sur 9), et le seul technico-commercial du lot le dit : « Mettez le secteur, la rémunération et le véhicule dans l'annonce, et ceux qui font ce métier répondront. » Réécrire l'annonce augmente le flux et sa qualité ; elle part « la semaine prochaine », donc la semaine 1 se fait encore avec l'ancienne.",
      "Le modèle compte environ 1,5 candidature en semaine 1 avec l'ancienne annonce, puis environ 6 par semaine avec l'annonce réécrite, dont un tiers de profils terrain. Attendu hors hasard : 1,5 + 3 × 6 = 19,5 candidatures d'ici la fin de la semaine 4.",
      "Sous le tirage n° 12, les semaines sont un peu creuses : 1,2 puis 4,8, 6,4 et 4,7 candidatures, soit 17 (17,1) en fin de semaine 4. L'épisode juge juste à 3 candidatures près, proche à 8 : l'estimation de 19,5 est juste. Selon les trente tirages, le chiffre va de 15 à 25.",
      "Pour comparer, sous le même tirage : la même annonce rediffusée sur trois sites payants donne 12 candidatures, surtout des vendeurs de magasin ; le cabinet ou l'attente en laissent 5.",
    ],
    erreurs: [
      {
        valeur: 12,
        cause:
          "Le rythme de l'ancienne annonce prolongé tel quel, 3 par semaine pendant quatre semaines : c'est oublier que l'annonce réécrite, qui dit enfin le métier, attire bien davantage de candidats.",
      },
      {
        valeur: 21,
        cause:
          "Les 9 candidatures déjà reçues ajoutées aux 12 attendues : le compteur part du début du trimestre, et l'estimation mélange deux périodes.",
      },
      {
        valeur: 24,
        cause:
          "Le flux de l'annonce réécrite compté dès la semaine 1 (4 × 6) : elle est réécrite avec l'équipe et ne part en ligne que la semaine suivante.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Neuf candidatures en trois semaines, c'est trop peu : il faut que beaucoup plus de monde voie l'annonce, et trois sites payants le permettent tout de suite.",
      ceQuiLeDejoue:
        "La comparaison des salaires montre une rémunération dans la moyenne (2 500 € brut de fixe, 6 000 € de variable, un véhicule) : le problème n'est pas le prix du poste. La relecture de l'annonce et le rappel des candidats montrent qu'elle décrit mal le métier : rediffusée, elle attire encore plus de vendeurs de magasin, pour 1 800 € au lieu de 400 €. Gérald le dit : « Avant de diffuser plus, demande-toi qui lirait ton annonce et aurait envie d'y répondre. » Rejouée sur les trente tirages à la place de l'annonce réécrite, la rediffusion perd 6,8 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Jordan est recommandé par un bon client, il est libre tout de suite, le courant est passé au café, et l'équipe ne tient plus : le poste serait pourvu dès maintenant.",
      ceQuiLeDejoue:
        "Un appel à l'ancien responsable de Jordan suffisait : sous le tirage de la classe, « ses devis restaient sans suite : il ne relançait jamais », et il avait quitté un poste de commercial avant la fin de sa période d'essai. Le modèle ne fait du coup de cœur un bon technico-commercial qu'une fois sur trois ; la grille de Nicolas (cinq questions, une mise en situation, une note par critère donnée à deux) le garde s'il est bon. Rejoué sur les trente tirages à la place de l'entretien structuré, le recrutement sans entretien perd 17,5 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Un mauvais recrutement coûte cher : mieux vaut attendre le profil idéal, cinq ans de négoce et un carnet d'adresses, que se tromper.",
      ceQuiLeDejoue:
        "Le profil de l'ancienne annonce n'est pas le poste : Julien passait quatre jours sur cinq chez les artisans, et c'est ce que la grille met à l'épreuve. Attendre deux semaines laisse partir le coup de cœur et les meilleurs candidats de la première vague (« ils ont d'autres pistes »), pendant que la vacance coûte chaque semaine et que trois des douze gros clients ont déjà reçu un concurrent. Rejoué sur les trente tirages à la place de l'entretien structuré, attendre perd 6,5 k€ en moyenne et ne fait mieux que 3 fois.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "La procédure existe pour une raison : le comité RH du jeudi et l'entretien avec le directeur régional évitent une embauche précipitée.",
      ceQuiLeDejoue:
        "Le candidat le dit : il a une offre d'un concurrent à confirmer sous huit jours, et répondra au premier qui fait une offre claire ; la procédure prend une dizaine de jours. Gérald, lui, valide par mail dans la journée toute offre dans la fourchette budgétée. Dans le modèle, la procédure fait perdre le candidat retenu près d'une fois sur deux et retarde l'arrivée de deux semaines, contre une fois sur huit pour l'offre ferme. Rejouée sur les trente tirages à la place de l'offre ferme, la procédure perd 7,9 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Un technico-commercial apprend sur le terrain ; c'est ainsi que toute l'équipe a commencé, et cela ne coûte rien.",
      ceQuiLeDejoue:
        "Bastien Roux le dit lui-même : « on a tous commencé comme ça. Enfin, ceux qui sont restés. » La source sur les dernières arrivées de la région compte trois recrues sur huit parties avant la fin de leur période d'essai, toutes démarrées seules avec le fichier ; celles qui avaient un parrain étaient autonomes en cinq à six semaines. Seule, la recrue met environ trois mois à monter en charge et perd des clients au passage de relais. Rejoué sur les trente tirages à la place du parrain, le fichier seul perd 11 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de visibilité, d'autres un problème de rémunération, d'autres l'annonce elle-même. Quelles sources permettaient de trancher, et que montrait la comparaison des salaires ?",
    "Bastien a pris treize clients en plus des siens et ne fait plus que les urgences. Pourquoi confier les douze gros clients à Nicolas et à Mélanie, et les quarante autres au comptoir, protège-t-il mieux le portefeuille que de demander à tout le monde de tout visiter avec une prime ?",
    "Gilles Peyrot recommande Jordan, et le courant est passé au café. Qu'est-ce qu'une recommandation dit d'un candidat, et qu'est-ce qu'elle ne dit pas ? En quoi l'entretien structuré protège-t-il aussi Jordan s'il est bon ?",
    "L'offre ferme sous 48 heures contourne la procédure du comité RH. Est-ce un manque de rigueur ? Qu'est-ce qui rendait cette entorse acceptable ici ?",
    "Sous le tirage n° 12, garder l'ancienne annonce aurait fait un peu mieux que la réécrire, parce que le vivier contenait quand même un bon candidat ; sur les trente tirages, ce pari perd environ 13 k€ une fois sur deux. Qui a pris la bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Un poste vacant coûte chaque semaine, un mauvais recrutement coûte davantage. Comment ces deux coûts justifient-ils à la fois d'aller vite et de ne pas recruter n'importe qui ?",
    "Quelle règle gardez-vous pour le prochain recrutement ? Formulez-la en une phrase, avec une étape du processus dedans.",
  ],
  prolongement: {
    enonce:
      "Une PME doit pourvoir un poste de commercial sur un trimestre de 13 semaines. Le portefeuille rapporte 9 000 € de marge par semaine quand un bon commercial le suit, 6 000 € quand personne ne le suit ou que la recrue ne fait pas l'affaire. Le salaire chargé est de 1 000 € par semaine ; une recrue qui ne fait pas l'affaire coûte en plus 6 000 € (salaire versé pour rien, recrutement à refaire). Option A : recruter tout de suite le candidat recommandé ; il prend son poste en semaine 3 et n'est bon qu'une fois sur trois. Option B : un entretien structuré ; la recrue prend son poste en semaine 6 et est bonne 9 fois sur 10. Option C : ne recruter personne ce trimestre. 1) Calculez le résultat du trimestre (marge moins salaires et coût d'échec) de chaque option, dans chaque cas, puis son espérance. 2) Quelle option recommandez-vous ? 3) À partir de quelle probabilité d'être bon le candidat recommandé deviendrait-il le meilleur choix ?",
    corrige:
      "1) Option A, bon candidat : 2 semaines à 6 000 € et 11 semaines à 9 000 €, soit 12 000 + 99 000 = 111 000 €, moins 11 × 1 000 = 11 000 € de salaires : 100 000 €. Mauvais candidat : 13 × 6 000 = 78 000 €, moins 11 000 € de salaires et 6 000 € d'échec : 61 000 €. Espérance : (100 000 + 2 × 61 000) / 3 = 74 000 €. Option B, bonne recrue : 5 × 6 000 + 8 × 9 000 = 102 000 €, moins 8 000 € de salaires : 94 000 €. Mauvaise : 78 000 − 8 000 − 6 000 = 64 000 €. Espérance : 0,9 × 94 000 + 0,1 × 64 000 = 91 000 €. Option C : 78 000 €. 2) L'option B, malgré trois semaines de vacance en plus : elle rapporte 17 000 € de plus que A en moyenne, et A fait même moins bien que ne recruter personne. 3) A vaut 61 000 + 39 000 × p ; elle égale B quand 39 000 × p = 30 000, soit p ≈ 0,77 : il faudrait que le candidat recommandé soit bon plus de trois fois sur quatre.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 est justifié par les sources : l'annonce recopiée de 2017 et le rappel des candidats, et non la diffusion ou le salaire.",
    "L'estimation des candidatures est construite à partir du rythme constaté et de l'effet attendu de l'annonce réécrite, et l'écart avec 17 est expliqué.",
    "Le choix du candidat s'appuie sur une méthode de sélection explicite (grille, mise en situation, références), et l'élève dit ce qu'une recommandation ne garantit pas.",
    "L'intégration est organisée (parrain disponible, plan, point à mi-période d'essai) et reliée à la montée en charge et au risque de départ.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La prévision porte sur un flux de candidatures que les sources ne chiffrent pas pour l'annonce réécrite : l'élève l'estime, et c'est le raisonnement (le contenu de l'annonce change le nombre et la qualité des candidatures, et elle ne part qu'en semaine 2) qu'il faut corriger. L'épisode traite la rupture de la période d'essai comme une décision de gestion : en droit du travail, elle doit respecter la durée prévue par le contrat ou la convention collective et un délai de prévenance, et ne doit pas reposer sur un motif étranger aux compétences du salarié ; à préciser aux élèves.",
};
