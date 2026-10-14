import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 45, LE PROJET QU'ON N'OSE PAS ARRÊTER.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/projet-a-arreter.ts) ; ceux du
 * hasard de la classe sont ceux de la graine 18, et les moyennes portent sur
 * les trente tirages du bilan, les autres décisions étant celles de la bonne
 * méthode.
 */
export const FICHE: FicheEnseignant = {
  code: "projet-a-arreter",
  formations: ["dcg", "but-gea"],
  programme: [
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
    "École de commerce · Stratégie d'entreprise",
  ],
  notion:
    "L'escalade d'engagement, décrite par Staw, est la tendance à remettre des ressources dans un projet qui déçoit parce qu'on y a déjà beaucoup investi, qu'on l'a annoncé ou qu'on en est comptable. Elle repose sur une erreur de raisonnement, la prise en compte des coûts irrécupérables, et sur une erreur de pilotage : lire les indicateurs avancés qui flattent (visites, devis, notoriété) plutôt que ceux qui tranchent (ventes, taux de transformation), faute d'avoir fixé avant de lire les chiffres ce que le projet devait montrer, et à quelle date. L'erreur symétrique existe : tout arrêter au premier mauvais chiffre détruit les options que le projet porte encore, une reconversion ou la chance de décoller. L'épisode met l'élève à la place d'une directrice générale adjointe qui hérite de trois showrooms ayant coûté 2,4 M€, annoncés à la presse par le président : le compte analytique affiche −391 k€, la perte propre aux showrooms n'est que de 85,4 k€, et chaque site appelle une réponse différente. Le piège est que les deux réflexes, sauver le projet et le liquider, se défendent tous deux par l'argent déjà dépensé ; seule la comparaison des flux à venir, site par site et option par option, sous des critères signés d'avance, crée de la valeur.",
  objectifs: [
    "Je sépare, dans un compte analytique, la perte qu'un projet fait vraiment perdre de l'amortissement des sommes déjà dépensées et des frais du siège qui resteraient.",
    "Je compare, pour chaque site, les flux à venir de chaque option (continuer, transformer, céder, fermer) en espérance et dans le mauvais cas, sans y faire entrer le coût passé.",
    "Je fixe un critère d'arrêt chiffré et daté sur un indicateur qui distingue les scénarios, avant de connaître les chiffres, et je révise le pari quand il se déclenche.",
    "Je distingue l'arrêt qui libère des ressources de l'arrêt prématuré qui détruit une option, et je présente un recentrage de façon qu'il soit accepté.",
  ],
  prerequis:
    "La marge sur coût variable et les charges fixes, la notion de coût pertinent et de coût irrécupérable, l'actualisation et l'espérance d'une valeur sous plusieurs scénarios ; une première approche de la rationalité limitée et des biais de décision est utile.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/projet-a-arreter?hasard=18 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous posez une seule consigne : chaque décision s'écrit avec le chiffre qui la justifie, et avec ce qui ferait changer d'avis.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les treize semaines. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, la perte annuelle saisie en semaine 1 et l'option choisie à chacune des six décisions. Ceux qui finissent tôt rejouent avec les mêmes décisions avec d'autres aléas et notent l'écart de valeur créée.",
    },
    {
      minutes: 15,
      titre: "Correction de la perte des showrooms",
      detail:
        "Vous affichez les estimations de la classe, puis vous reconstituez au tableau le compte de chaque site à partir de la source « Reprendre le compte d'exploitation des trois showrooms, site par site ». Vous passez de −85,4 k€ à −391,4 k€ en ajoutant l'amortissement et la quote-part du siège, et vous faites dire ce que chacune de ces deux lignes deviendrait si les showrooms fermaient. Vous faites retrouver d'où viennent 391, 325 ou 151 k€.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous repartez du relevé, en général Saint-Priest (semaine 6) et Écully (semaine 11). Vous faites défendre chaque option par un binôme qui l'a choisie, puis vous confrontez les arguments aux chiffres des sources « Chiffrer chaque option », en espérance et scénario par scénario. Vous revenez sur l'analyse client par client de la semaine 2 : qui l'a commandée, et qu'a-t-elle changé ensuite ?",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous prévenez la classe que le résultat de cet épisode est très bruité : sous le tirage 18, le marché des particuliers plafonne et Brémond n'offre que 30 k€, si bien que la bonne méthode détruit 8,6 k€, au milieu de ses 30 tirages, alors qu'elle en crée 20 k€ en moyenne. Le réflexe de sauver le projet détruit 513 k€ sous ce tirage et 462 k€ en moyenne, l'attentisme 297 et 265 k€. Vous projetez le bilan d'un élève et faites distinguer ce que la classe a obtenu de ce que ses décisions valaient.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez les règles que l'épisode a fait éprouver : le coût passé n'entre dans aucun calcul ; chaque unité se juge sur ses flux à venir, option par option ; le critère d'arrêt s'écrit avant les chiffres, sur un indicateur qui tranche ; arrêter trop tôt détruit une option ; un recentrage se présente sur des critères, pas comme l'erreur de quelqu'un. Vous distribuez le cas de prolongement.",
    },
  ],
  calcul: {
    reponse: 85.4,
    etapes: [
      "Source « Reprendre le compte d'exploitation des trois showrooms, site par site » : chaque site dégage 36 % de marge sur coût variable sur ses ventes aux particuliers et supporte ses charges fixes propres (loyer, personnel, autres frais).",
      "Écully : 950 × 36 % = 342 k€ de marge sur coût variable, moins 105 + 210 + 40 = 355 k€ de charges fixes, soit −13 k€.",
      "Saint-Priest : 640 × 36 % = 230,4 k€, moins 80 + 150 + 32 = 262 k€, soit −31,6 k€. Rillieux : 420 × 36 % = 151,2 k€, moins 66 + 98 + 28 = 192 k€, soit −40,8 k€.",
      "Perte d'exploitation annuelle propre aux trois showrooms : 13 + 31,6 + 40,8 = 85,4 k€. Elle ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 5 k€ près, proche à 15 k€.",
      "Rapprochement avec le compte analytique : −85,4 − 240 (amortissement sur dix ans des 2,4 M€ déjà dépensés) − 66 (quote-part des frais du siège, qui resterait aux agences) = −391,4 k€, les −391 k€ qu'affiche la direction financière. Aucune de ces deux lignes ne disparaîtrait si l'on fermait.",
    ],
    erreurs: [
      {
        valeur: 391.4,
        cause:
          "Le compte analytique est repris tel quel : on compte l'amortissement de travaux déjà payés, un coût irrécupérable, et des frais du siège qui ne changent avec aucune décision. C'est le chiffre que l'on oppose au projet pour le fermer, et l'épisode le juge faux.",
      },
      {
        valeur: 325.4,
        cause:
          "On retire la quote-part du siège mais on garde les 240 k€ d'amortissement, au motif qu'« il faut bien rembourser les travaux » : c'est exactement le raisonnement par le coût passé que l'épisode corrige.",
      },
      {
        valeur: 151.4,
        cause:
          "On retire l'amortissement mais on laisse les 66 k€ de quote-part du siège, comme s'ils disparaissaient avec les showrooms. L'épisode juge cette valeur fausse.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "2,4 M€ sont déjà investis, le président a annoncé le projet à la presse et les visites ont pris 30 % en un an : s'arrêter au milieu du gué serait un gâchis.",
      ceQuiLeDejoue:
        "Le panel de la fédération montre que les visites et les devis montent dans tous les showrooms, ceux qui échouent compris, et le plan de l'équipe suppose un taux de transformation remonté de 22 à 32 %. Sur les 30 tirages, voter la relance (90 k€ de campagne et 20 k€ par site et par an pour le dimanche) donne −82 k€ en moyenne, contre +20 k€ pour le gel assorti de critères signés.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Le tableau de bord donne déjà les visites, les devis et les ventes chaque lundi, et les visites montent : pourquoi payer 18 k€ de plus ?",
      ceQuiLeDejoue:
        "La source « Mettre côte à côte visites, devis et ventes » montre visites +30 %, devis +26 %, ventes +4 %, et des ventes faites par les artisans que personne ne compte. L'analyse client par client donne la liste des artisans (Saint-Priest au format artisans vaut +16 k€ en espérance avec elle, −34 k€ sans) et un critère lisible pour Écully (l'essai vaut +32 k€ au lieu de −9 k€) : sur les 30 tirages, +20 k€ contre −56 k€ sans rien commander.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Dix-huit mois, c'est trop tôt pour juger, et le président a dit à la presse qu'Arvel Maison, c'est trois showrooms.",
      ceQuiLeDejoue:
        "La source « Chiffrer chaque option pour Rillieux » donne pour le garder −59, −107 ou −163 k€ selon le scénario, quand le fermer coûte −52 k€ dans tous les cas (32 k€ de loyer jusqu'à l'échéance et 20 k€ de déstockage) : il vaut moins que la fermeture même si le marché décolle. Sur les 30 tirages, −104 k€ contre +20 k€ pour la négociation avec Brémond.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Les visites montent et le salon de l'habitat approche : c'est maintenant que ça se joue, on ne change pas de cap avant le meilleur moment de l'année.",
      ceQuiLeDejoue:
        "La source sur les quatre derniers salons dit qu'ils battent chaque année un record de visites sans faire bouger les ventes : ce n'est pas un test. Les options chiffrées donnent au format particuliers −68 k€ en espérance, au format artisans +16 k€ avec la liste ; l'analyse montre que 46 % des montants signés à Saint-Priest viennent de clients amenés par leur artisan. Sur les 30 tirages, −96 k€ contre +20 k€.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Le président veut entendre qu'on ne lâche pas le projet, et un an de plus avec une campagne de printemps ne fâche personne.",
      ceQuiLeDejoue:
        "La source « Mettre chaque site face aux critères » rappelle qu'un gel fait manquer l'échéance des baux : six mois de pertes de plus par site à fermer, et un repreneur qui n'attend pas ; la cession de Rillieux vaut, selon l'offre, 101 à 141 k€ de plus en espérance qu'un gel. Le président accepte un recentrage présenté sur des critères qu'il a signés neuf fois sur dix : sur les 30 tirages, −102 k€ pour la rallonge contre +20 k€.",
    },
    {
      decision: 5,
      option: 3,
      pourquoi:
        "Écully est la vitrine, le président y tient, et la cellule voisine permettrait enfin de montrer les cuisines prévues par le plan de départ.",
      ceQuiLeDejoue:
        "La source « Chiffrer chaque option pour Écully » donne à l'agrandissement +295, −108 ou −300 k€ selon le scénario, soit −65 k€ en espérance, contre +32 k€ pour l'essai sous critère : on double la mise sur le seul scénario favorable, qui a une chance sur quatre. Il ne bat l'essai que sur 8 tirages sur 30, et fait 95 k€ de moins en moyenne.",
    },
  ],
  debrief: [
    "Le compte analytique dit −391 k€, le calcul de la semaine 1 −85,4 k€ : que contiennent les 306 k€ d'écart, et que deviendrait chacune de ces lignes si l'on fermait les trois showrooms ? Lequel des deux chiffres pousse à sauver le projet, lequel à le liquider, et pourquoi aucun des deux ne dit quoi faire d'un site ?",
    "En semaine 2, l'analyse client par client coûtait 18 k€, l'étude de marché 45 k€, l'enquête de satisfaction 8 k€. Qu'est-ce que chacune pouvait vous apprendre, et à temps pour quelle décision ? Montrez sur les chiffres des sources comment l'analyse a changé la réponse pour Saint-Priest et pour Écully, alors que l'étude, plus chère, arrivait après le comité.",
    "En semaine 6, à Saint-Priest, qui a attendu le salon, qui a renforcé, qui a changé de cap, qui a fermé ? Quel signal permettait de réviser le pari, et pourquoi le salon n'en était pas un ? Fermer et transformer arrêtent tous deux le format particuliers : pourquoi la fermeture vaut-elle 88 k€ de moins en moyenne ?",
    "Au comité de la semaine 10, sous le tirage 18, le président valide le recentrage quelle que soit sa présentation : sur les critères signés en semaine 2, comme la correction des erreurs du plan, et même chez qui avait proposé l'arrêt des trois showrooms en semaine 1. Présenté comme une correction, il ne l'accepte pourtant que quatre fois sur dix, contre plus de neuf sur dix sur des critères qu'il a signés : sur les 30 tirages, cette présentation fait 53 k€ de moins en moyenne. Que dit cette différence sur l'escalade d'engagement d'un dirigeant, et sur la façon d'écrire des critères d'arrêt ?",
    "En semaine 11, transformer Écully tout de suite bat l'essai sous critère sur 22 tirages sur 30, et sous le tirage 18 il fait 20 k€ de mieux ; pourtant il rapporte 12 k€ de moins en moyenne. Quand le marché plafonne ou recule, il gagne une vingtaine de milliers d'euros en avançant le changement d'un semestre ; quand il décolle, il en perd une centaine. Ceux qui l'ont choisi ont-ils mieux décidé, ou ont-ils eu de la chance ? Que détruit-on en arrêtant trop tôt ?",
    "Sous le tirage 18, la bonne méthode a détruit 8,6 k€, sa 16e place sur les 30 tirages ; elle crée 20 k€ en moyenne et reste négative 18 fois. Le réflexe de sauver le projet détruit 513 k€ sous ce tirage, 462 k€ en moyenne. Un comité qui jugerait sa directrice sur ce trimestre la féliciterait-il ? Sur quoi juger une décision stratégique dont le résultat se lit en années ?",
  ],
  prolongement: {
    enonce:
      "La société Tessière, fabricant de vélos, a lancé il y a deux ans une gamme de vélos cargo : 1,2 M€ de développement et d'outillage déjà payés, amortis sur six ans. Le compte analytique de la gamme sur douze mois : 800 k€ de chiffre d'affaires, 30 % de marge sur coût variable, 300 k€ de charges fixes propres (équipe dédiée, atelier loué, salons), 200 k€ d'amortissement, 50 k€ de quote-part des frais du siège. Le directeur général hésite entre trois options pour les deux années qui viennent (on n'actualise pas). Continuer : si le marché des loueurs professionnels décolle (probabilité 0,3), la marge sur coût variable passe à 420 k€ par an ; sinon (0,7), elle reste à 240 k€. Arrêter maintenant : 40 k€ de déstockage et d'indemnités, plus rien ensuite. Continuer un an à l'essai : au bout d'un an on saura si le marché décolle ; s'il ne décolle pas, on arrête, avec les mêmes 40 k€. 1) Quelle perte la gamme fait-elle vraiment perdre chaque année ? Expliquez l'écart avec le compte analytique. 2) Calculez la valeur espérée de chaque option sur deux ans. Laquelle retenir ? Combien de fois sur dix l'arrêt immédiat fait-il mieux que l'essai ? 3) Le chef de gamme propose comme critère de l'essai « 3 000 visiteurs sur le stand du salon du cycle ». Qu'en pensez-vous, et quel critère écririez-vous ?",
    corrige:
      "1) Marge sur coût variable 800 × 30 % = 240 k€, moins 300 k€ de charges fixes propres : la gamme fait perdre 60 k€ par an. Le compte analytique affiche 240 − 300 − 200 − 50 = −310 k€ : les 200 k€ d'amortissement sont la répartition du 1,2 M€ déjà payé, irrécupérable, et les 50 k€ de siège resteraient si l'on arrêtait. 2) Continuer : si le marché décolle, 2 × (420 − 300) = +240 k€ ; sinon 2 × (−60) = −120 k€ ; en espérance 0,3 × 240 + 0,7 × (−120) = 72 − 84 = −12 k€. Arrêter maintenant : −40 k€ dans tous les cas. Essai : si le marché décolle, +240 k€ ; sinon −60 − 40 = −100 k€ ; en espérance 0,3 × 240 + 0,7 × (−100) = 72 − 70 = +2 k€. On retient l'essai : il garde la chance de décoller et coupe la perte de la deuxième année quand le marché ne décolle pas, ce qui vaut 0,7 × 20 = 14 k€ de plus que continuer sans condition. L'arrêt immédiat fait mieux que l'essai sept fois sur dix (−40 contre −100 k€), mais il perd 280 k€ les trois autres fois : il rapporte 42 k€ de moins en espérance. 3) Les visiteurs d'un salon montent quel que soit le marché : le critère ne se déclencherait jamais, et l'essai redeviendrait « continuer » (−12 k€). On attend un critère écrit avant de connaître les chiffres, daté et portant sur ce qui distingue les deux scénarios, par exemple un volume de commandes fermes des loueurs professionnels ou un taux de transformation des devis à douze mois, validé par le directeur général avec la conséquence prévue s'il n'est pas atteint.",
  },
  evaluation: [
    "La perte propre aux showrooms est calculée site par site à partir de la marge sur coût variable et des charges fixes, et l'amortissement comme la quote-part du siège sont écartés avec leur justification.",
    "Chaque décision sur un site compare les options sur leurs flux à venir, en espérance et dans le mauvais scénario, et aucune ne s'appuie sur les 2,4 M€ déjà dépensés ou sur l'annonce du président.",
    "Le critère d'arrêt proposé est fixé avant les chiffres, daté, et porte sur un indicateur qui distingue les scénarios (ventes, transformation, origine des clients), pas sur les visites.",
    "L'élève distingue l'arrêt qui coupe une perte de l'arrêt prématuré qui détruit une option, à propos de Saint-Priest ou d'Écully, chiffres à l'appui.",
    "L'élève distingue, sur le bilan des 30 tirages, la qualité d'une décision de son résultat sous le tirage de la classe.",
  ],
  vigilance:
    "Le modèle donne au décideur des probabilités de scénario calibrées (le panel de la fédération) et juge le trimestre sur une valeur actualisée à 8 % sur trois ans seulement, la durée du bail qui repart : sans valeur au-delà, il sous-estime ce que vaut un Écully qui décolle, et donc l'option de continuer. Un enseignant de stratégie voudra dire que l'escalade réelle se joue justement quand ces probabilités ne sont pas connues, et que l'acceptation du président, tirée au hasard selon la présentation, résume une dynamique de gouvernance bien plus riche.",
};
