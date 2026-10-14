import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 37, L'INVESTISSEMENT À CHOISIR.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/investissement-a-choisir.ts) ; ceux
 * du hasard de la classe sont ceux de la graine 12.
 */
export const FICHE: FicheEnseignant = {
  code: "investissement-a-choisir",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "BTS CG · Processus 6, Analyse de la situation financière",
    "BUT GEA · Finance d'entreprise",
  ],
  notion:
    "Le choix d'investissement se fait à la VAN, au taux de l'entreprise : elle seule dit combien d'euros un projet crée, alors que le TRI donne un pourcentage et le délai de récupération ignore tout ce qui suit le remboursement. L'erreur classique consiste à classer des projets de tailles et de durées différentes au TRI ou au délai, et, sous une enveloppe rationnée, à remplir l'enveloppe dans l'ordre de ce classement au lieu de chercher la combinaison qui maximise la VAN totale. L'épisode y ajoute trois corollaires : ce qui est déjà dépensé n'entre dans aucun calcul, les flux différés (renouvellement, valeur résiduelle, BFR récupéré, prépaiement) se placent à leur date, et une dépense qui ne sert que si un événement incertain se produit vaut moins que le droit de la faire plus tard. Le piège est tendu dès la semaine 1 : le stockeur automatique a le TRI le plus faible et le délai le plus long des trois dossiers, et c'est lui qui crée le plus de valeur.",
  objectifs: [
    "Je calcule la VAN d'un projet en plaçant chaque flux à sa date : investissement et stock au départ, valeur résiduelle et stock récupéré la dernière année.",
    "Je distingue ce que mesurent la VAN, le TRI et le délai de récupération, et je retiens la VAN pour comparer des projets de tailles et de durées différentes.",
    "Je choisis, dans une enveloppe rationnée, la combinaison de projets indivisibles qui maximise la VAN totale.",
    "J'écarte les coûts irrécupérables et je chiffre la valeur d'attendre une information avant d'engager une dépense.",
  ],
  prerequis:
    "L'actualisation (facteur d'actualisation, coefficient d'annuité constante), la VAN, le TRI et le délai de récupération d'un projet aux flux donnés, et la notion de besoin en fonds de roulement.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/investissement-a-choisir?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous rappelez une seule consigne : chaque décision s'écrit avec le chiffre qui la justifie, sur une feuille qu'on gardera pour le débrief.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les treize semaines. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, la VAN du stockeur que chacun a saisie en semaine 1 et l'option choisie à chacune des six décisions. Ceux qui finissent tôt rejouent avec les mêmes décisions avec d'autres aléas et notent l'écart.",
    },
    {
      minutes: 20,
      titre: "Correction de la VAN du stockeur",
      detail:
        "Vous affichez les estimations de la classe, puis vous posez les flux du stockeur année par année au tableau, à partir des deux sources de la semaine 1. Vous faites retrouver d'où vient chaque estimation fausse : stock non récupéré, stock oublié, valeur résiduelle oubliée. Vous terminez par la comparaison des trois dossiers et des combinaisons qui tiennent dans 700 k€.",
    },
    {
      minutes: 25,
      titre: "La décision qui a partagé la classe",
      detail:
        "Vous repartez du relevé et prenez la décision où la classe s'est le plus partagée, souvent la recommandation de la semaine 1 ou la mezzanine. Vous faites défendre chaque option par un binôme qui l'a choisie, puis vous confrontez les arguments aux chiffres des sources. Vous finissez par la clause d'extension, que la version de base sans plus a battue sous ce tirage.",
    },
    {
      minutes: 10,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève : sous le tirage 12, la bonne méthode fait 301 k€, au-dessus de sa moyenne de 202 k€ sur les 30 tirages. Vous faites distinguer ce que la classe a obtenu de ce que ses décisions valaient en moyenne, décision par décision.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez les règles que l'épisode a fait éprouver : comparer à la VAN, combiner dans l'enveloppe, ignorer le coût passé, placer les flux différés à leur date, payer le droit d'attendre plutôt que parier. Vous distribuez l'exercice de prolongement, à faire en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 137.67,
    etapes: [
      "Année 0 : « Remettre les trois dossiers au même format » donne 480 k€ d'investissement et 80 k€ de stock à constituer au démarrage ; la note de la direction financière (« Relire la note de la direction financière sur les investissements ») les place en début de projet, soit un décaissement initial de 560 k€.",
      "Années 1 à 10 : 95 k€ de flux nets de trésorerie par an, maintenance déduite, actualisés au taux du groupe de 8 % par le coefficient d'annuité (1 − 1,08⁻¹⁰) / 0,08 = 6,7101 : 95 × 6,7101 = 637,5 k€.",
      "Année 10, en plus du flux courant : la valeur résiduelle des tours (50 k€) et le stock récupéré (80 k€), soit 130 k€, actualisés par le facteur 1,08⁻¹⁰ = 0,4632 : 60,2 k€, dont 23,2 k€ de valeur résiduelle et 37,1 k€ de BFR récupéré.",
      "VAN = −560 + 637,5 + 60,2 = 137,7 k€ (137,67 k€ sans arrondi). Elle ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode juge juste à 5 k€ près, proche à 15 k€.",
      "Pour le comité : le stockeur a le TRI le plus faible (12,7 %) et le délai de récupération le plus long (5,9 ans) des trois dossiers, mais une VAN plus de deux fois supérieure à celle des chariots (58,8 k€) et du WMS (56,9 k€).",
    ],
    erreurs: [
      {
        valeur: 100.6,
        cause:
          "Le stock est décaissé en année 0 mais pas récupéré en année 10 : il manque 80 × 0,4632 = 37,1 k€. C'est l'erreur la plus fréquente, et l'épisode la juge fausse.",
      },
      {
        valeur: 180.6,
        cause:
          "Le stock est oublié des deux côtés, parce que l'enveloppe se compte « stock non compris » : 480 k€ au départ, 50 k€ en année 10. On efface le coût d'immobiliser 80 k€ pendant dix ans, soit 80 − 37,1 = 42,9 k€.",
      },
      {
        valeur: 114.5,
        cause:
          "La valeur résiduelle de 50 k€ est oubliée en année 10 (seul le stock est récupéré) : il manque 50 × 0,4632 = 23,2 k€.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Ce sont les deux meilleurs TRI et les deux délais de récupération les plus courts, et le directeur des opérations le recommande.",
      ceQuiLeDejoue:
        "Mis au même format, les dossiers donnent 196,5 k€ de VAN au stockeur et aux chariots (620 k€ engagés) contre 115,7 k€ aux chariots et au WMS (390 k€) ; le stockeur et le WMS, 730 k€, ne tiennent pas dans l'enveloppe. Sur les 30 tirages, les décisions suivantes restant les meilleures, la recommandation au TRI crée 135 k€ en moyenne, contre 202 k€.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le fournisseur annonce 30 % de croissance et prévient qu'une extension coûtera plus cher et prendra plus de temps plus tard.",
      ceQuiLeDejoue:
        "« Calculer ce que rapporterait l'extension » la chiffre à +54 k€ de VAN si le groupe rattache les agences du Nord-Isère et −90 k€ sinon : à quatre chances sur dix, 0,4 × 53,7 − 0,6 × 90,1 = −32,6 k€ en espérance. Les 30 % du fournisseur sont le rattachement tenu pour acquis.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "On y a déjà mis 210 k€, et on ne laisse pas un chantier en plan.",
      ceQuiLeDejoue:
        "Les 210 k€ ne reviennent dans aucun cas ; seuls comptent les flux à venir. Avec le stockeur, finir coûte 90 k€ pour 4 k€ par an pendant dix ans, soit −90 + 4 × 6,7101 = −63,2 k€, avant un renfort de 25 k€ une fois sur deux, quand la revente rapporte 20 ou 32 k€ nets du démontage.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Le comité a validé 140 k€ de plomb ; 36 k€ de plus allongent le délai de récupération.",
      ceQuiLeDejoue:
        "Sur six ans, le lithium évite le remplacement de 40 k€ en année 4 (29,4 k€ actualisés), économise 4 k€ par an (18,5 k€) et se revend 6 k€ (3,8 k€) : −36 + 29,4 + 18,5 + 3,8 = +15,7 k€ de VAN. Le délai de récupération ne voit pas l'année 4.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Le rattachement serait « fait à 90 % », et il faut être prêt au printemps avant que le prix garanti expire.",
      ceQuiLeDejoue:
        "La directrice financière dit que rien n'est décidé, une chance sur trois ou sur deux. Avec la clause, commander maintenant vaut −32,6 k€ en espérance, attendre la décision du groupe +21,5 k€ (0,4 × 53,7) ; sans clause, −33,7 k€ contre +15,7 k€.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi: "Le fournisseur fait 15 % de remise : 68 k€ au lieu de 80 k€, 12 k€ d'économie.",
      ceQuiLeDejoue:
        "Cinq annuités de 16 k€ payées en fin d'année valent 16 × 3,9927 = 63,9 k€ aujourd'hui au taux de 8 % : le prépaiement coûte 4,1 k€ de plus. La remise ne paie pas cinq ans d'avance de trésorerie.",
    },
  ],
  debrief: [
    "Le stockeur a le TRI le plus faible (12,7 %) et le délai de récupération le plus long (5,9 ans) : pourquoi crée-t-il pourtant plus de deux fois plus de valeur que chacun des deux autres dossiers ? Qu'est-ce qu'un pourcentage ne dit pas sur la taille et la durée d'un projet ?",
    "Avec 700 k€, pourquoi ne suffit-il pas de prendre les projets dans l'ordre de leur VAN ? Calculez l'indice de profitabilité de chacun (0,42 pour les chariots, 0,25 pour le stockeur, 0,23 pour le WMS) et dites pourquoi, avec des projets indivisibles, il faut comparer des combinaisons.",
    "Dans quelle colonne de votre calcul de la mezzanine figuraient les 210 k€ déjà payés ? Que change à la décision le fait que le stockeur lui prenne les petites pièces ?",
    "Sous le tirage 12, la version de base sans plus a fait 2 k€ de mieux que la clause d'extension : le groupe n'a pas rattaché les agences, et la clause n'a servi à rien. Sur les 30 tirages, elle gagne 20 fois de 2 k€ et perd 10 fois de 11 à 15 k€, soit 3 k€ de moins en moyenne. Ceux qui l'ont choisie ont-ils bien décidé, ou ont-ils eu de la chance ? Qu'achète-t-on en payant une option ?",
    "Que valait l'information du comité de direction de mi-décembre ? Comparez « commander maintenant » et « attendre la décision du groupe » : d'où vient l'écart d'environ 50 k€ en espérance ?",
    "Sous le tirage 12, la bonne méthode a créé 301 k€ et le réflexe 47 k€ ; sur les 30 tirages, 202 k€ et zéro. Que conclure d'un binôme qui a fait 250 k€ ? Un résultat permet-il de juger une décision ?",
  ],
  prolongement: {
    enonce:
      "Une PME dispose d'une enveloppe d'investissement de 450 k€, stock non compris, et actualise au taux de 10 %. Les flux sont nets d'impôt et en fin d'année. Projet A : 300 k€ d'investissement et 40 k€ de stock au démarrage, récupéré la dernière année ; 70 k€ par an pendant 8 ans ; valeur résiduelle 20 k€ ; une étude de faisabilité de 15 k€ a déjà été payée. Projet B : 120 k€, 45 k€ par an pendant 4 ans. Projet C : 200 k€, 60 k€ par an pendant 5 ans. Les TRI sont de 14,5 % pour A, 18,5 % pour B et 15,2 % pour C. 1) Calculez la VAN et le délai de récupération de chaque projet. 2) Classez-les au TRI, au délai, puis à la VAN. 3) Quelle combinaison retenir dans l'enveloppe ? 4) Que faites-vous des 15 k€ de l'étude ?",
    corrige:
      "1) A : −340 + 70 × 5,3349 + 60 × 0,4665 = −340 + 373,4 + 28,0 = 61,4 k€ (le flux de l'année 8 vaut 70 + 20 + 40 = 130 k€) ; délai 340 / 70 = 4,9 ans. B : −120 + 45 × 3,1699 = 22,6 k€ ; délai 2,7 ans. C : −200 + 60 × 3,7908 = 27,4 k€ ; délai 3,3 ans. 2) Au TRI comme au délai : B, C, A. À la VAN : A, C, B. 3) A et C (500 k€) dépassent l'enveloppe ; A et B (420 k€) créent 61,4 + 22,6 = 84,1 k€, B et C (320 k€) 50,1 k€, A seul 61,4 k€ : on retient A et B. 4) Rien : ils sont payés quel que soit le choix, c'est un coût irrécupérable. Oublier de récupérer le stock ramènerait la VAN de A à 42,8 k€.",
  },
  evaluation: [
    "La VAN du stockeur est posée flux par flux, chaque montant à sa date, et le stock récupéré comme la valeur résiduelle apparaissent en année 10.",
    "Le choix du portefeuille compare des combinaisons qui tiennent dans l'enveloppe, à la VAN totale, et non des projets classés au TRI ou au délai.",
    "Les 210 k€ de la mezzanine sont explicitement écartés du calcul, et les options sont comparées sur les seuls flux à venir.",
    "La décision sur l'extension est justifiée par une espérance chiffrée et par la valeur d'attendre la décision du groupe, pas par la prévision du fournisseur.",
    "L'élève distingue, sur le bilan des 30 tirages, la qualité d'une décision de son résultat sous le tirage de la classe.",
  ],
  vigilance:
    "Les dossiers donnent directement des flux nets d'impôt : l'épisode ne fait reconstituer ni l'économie d'impôt sur les dotations aux amortissements ni l'imposition de la plus-value de cession, et le stock est récupéré à sa valeur nominale. Un enseignant de DCG voudra peut-être le signaler, ou le faire reconstituer en prolongement.",
};
