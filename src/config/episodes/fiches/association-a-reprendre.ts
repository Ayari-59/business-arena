/**
 * FICHE ENSEIGNANT · ÉPISODE 96, L'ASSOCIATION QUI DEMANDE À ÊTRE REPRISE.
 *
 * Une reprise se décide sur un diagnostic, se négocie avec l'autorité de
 * tarification avant le vote et se prépare avec les équipes. Le piège : dire
 * oui pour plaire, ou non par principe, sans avoir chiffré le passif social
 * que personne n'a provisionné. Les chiffres du hasard de la classe sont ceux
 * de la graine 16, les moyennes celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "association-a-reprendre",
  formations: ["dcg", "but-gea"],
  programme: [
    "DCG · UE 7, Management",
    "DCG · UE 3, Droit social",
    "BUT GEA · Piloter les relations avec les parties prenantes de l'organisation",
  ],
  notion:
    "Reprendre une organisation en difficulté, c'est reprendre ses déficits, mais aussi ce que ses comptes ne montrent pas : les engagements envers les salariés jamais provisionnés, un contentieux en cours, un bâtiment amorti qui demande des travaux. L'erreur classique consiste à répondre à la demande d'une autorité dont on dépend par un oui immédiat, pour ne pas la fâcher, ou par un non de principe, puis à se fier aux comptes certifiés et à ne rien chiffrer. Dans l'épisode, l'ARS demande à l'Association Solvanne de reprendre par fusion les Primevères (un IME de 45 enfants, un ESAT de 60 travailleurs), qui n'ont plus que dix-huit jours de trésorerie ; les budgets repris perdent 265 k€ par an, la fusion peut faire 280 k€ d'économies en régime, et le passif social non provisionné vaut 364,4 k€. Un refus s'est payé six fois sur dix au CPOM suivant, autour de 190 k€. L'élève découvre qu'un accord de principe sous conditions, un audit complet, un dossier qui chiffre exactement ce que l'ARS peut financer et des équipes associées avant le vote font d'une reprise subie une reprise négociée, et qu'un déficit commercial d'ESAT ne se cache pas dans le budget social.",
  objectifs: [
    "Je chiffre un passif social non provisionné (indemnités de départ à la retraite, comptes épargne-temps) à partir du registre du personnel.",
    "Je distingue ce qu'un financeur peut prendre en charge de ce qu'il ne peut pas, et je bâtis une demande chiffrée en conséquence.",
    "Je décide de l'étendue d'un audit d'acquisition en comparant son coût à ce qu'il peut révéler.",
    "Je prépare un transfert de salariés en respectant leurs droits et en consultant leurs représentants.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de provision, de fonds propres, de trésorerie et de budget doivent avoir été vues ; le transfert des contrats de travail en cas de fusion peut être présenté en quelques minutes. Le rôle de l'ARS, le CPOM et la distinction entre budget social et budget commercial d'un ESAT sont donnés par les sources de l'épisode.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/association-a-reprendre?hasard=16 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la situation en deux phrases (l'ARS demande une reprise, les Primevères n'ont plus que dix-huit jours de trésorerie) sans parler de passif social, et vous demandez de noter sur papier le passif calculé en semaine 1 et la réponse faite à l'ARS.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (oui, oui sous conditions, non, attente) et celle de la semaine 8 (voter, rouvrir, se retirer, ultimatum). Un binôme qui a fini tôt additionne tout ce que l'audit complet a révélé sous le tirage de la classe.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir du registre du personnel : douze départs à la retraite, six mois de salaire chacun, 440 jours de comptes épargne-temps. Vous faites expliquer les valeurs éloignées (280,8, 130,4 ou 1 674,8 k€), puis vous mettez le passif en face des économies de la fusion : plus d'une année d'économies en régime.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (l'audit) et de la semaine 6 (le budget commercial de l'ESAT). Pour la semaine 2, vous faites lire ce que le cabinet trouve d'habitude : un contentieux une fois sur deux, des travaux de mise en sécurité un peu plus d'une fois sur deux, que les comptes certifiés ne montrent pas. Pour la semaine 6, vous faites dire pourquoi une clé de répartition des moniteurs modifiée sans justification n'efface pas le déficit de la blanchisserie.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 16, la reprise négociée crée 120 k€ de valeur : l'ARS a tout accordé, y compris la seconde demande, alors que l'audit a révélé un contentieux et 403 k€ de travaux. Le oui pour plaire détruit 934 k€, et l'attente ne coûte que 24 k€, parce qu'Héliandre a repris les Primevères. Vous montrez ensuite le oui immédiat : il fait mieux que l'accord sous conditions 17 fois sur 30, et perd pourtant 208 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : ni oui pour plaire, ni non par prudence ; diagnostiquer, négocier avant le vote, préparer les équipes. Vous la déclinez en trois gestes : chiffrer ce qu'on prend, y compris ce que personne n'a provisionné ; demander exactement ce que le financeur peut financer ; dire aux salariés repris ce qui est garanti. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 364.4,
    etapes: [
      "Source « Éplucher le registre du personnel et les engagements sociaux des Primevères » : douze salariés partiront à la retraite dans les cinq ans, tous au-delà de vingt ans d'ancienneté, et la convention collective leur doit six mois de salaire chacun, à 3 900 € par mois charges comprises.",
      "Indemnités de départ à la retraite : 12 × 6 × 3 900 = 280 800 €.",
      "Même source : les comptes épargne-temps cumulent 440 jours, à 190 € la journée chargée : 440 × 190 = 83 600 €.",
      "Passif social non provisionné : 280 800 + 83 600 = 364 400 €, soit 364,4 k€. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 10 k€ près, proche à 40 k€.",
      "Pour la suite : les comptes des Primevères montrent 265 k€ de déficits par an (IME 175, ESAT social 35, ESAT commercial 55), et la fusion fait 280 k€ d'économies en régime, la moitié la première année. Le passif social pèse plus d'une année d'économies, et l'audit peut encore trouver un contentieux et des travaux.",
    ],
    erreurs: [
      {
        valeur: 280.8,
        cause:
          "Les comptes épargne-temps sont oubliés : seules les indemnités de départ à la retraite sont comptées. Les 440 jours sont dus aux salariés transférés.",
      },
      {
        valeur: 130.4,
        cause:
          "Un mois de salaire par départ au lieu de six (12 × 3 900 = 46 800 €, plus 83 600 €) : la convention collective doit six mois aux salariés de plus de vingt ans d'ancienneté.",
      },
      {
        valeur: 1674.8,
        cause:
          "Les six mois d'indemnité sont appliqués aux 68 salariés transférés (68 × 6 × 3 900, plus les comptes épargne-temps) : seuls les douze qui partiront dans les cinq ans font le passif.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "L'ARS n'a jamais demandé un service pareil, le CPOM se renégocie l'an prochain et l'extension du FAM en dépend : on ne peut pas dire non, alors autant dire oui vite.",
      ceQuiLeDejoue:
        "Les trois directeurs généraux qui ont traité avec cette ARS : l'association de l'Yonne qui a posé ses conditions, audit à l'appui, a obtenu l'essentiel, parce que l'ARS n'a pas d'autre solution qu'un administrateur provisoire ; celle qui a dit oui d'emblée n'a eu que la transition. Après un oui donné d'avance, l'ARS a trois chances sur dix de moins de financer le reste. Rejoué sur les trente tirages à la place de l'accord sous conditions, le oui immédiat perd 208 k€ en moyenne, même s'il fait mieux 17 fois sur 30.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Fonds propres négatifs, dix-huit jours de trésorerie, des déficits partout : reprendre les Primevères, c'est importer leurs pertes.",
      ceQuiLeDejoue:
        "Les comptes lus avec Eudoxie Rambourg : la fusion remplace un siège de 250 k€ par 60 k€ de renfort et mutualise 90 k€ d'achats, et les budgets sociaux passent de 210 k€ de déficit à 70 k€ d'excédent par an. Un refus s'est payé six fois sur dix au CPOM suivant, autour de 190 k€ sur cinq ans. Rejoué sur les trente tirages à la place de l'accord sous conditions, le refus perd 281 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Les comptes sont certifiés sans réserve depuis dix ans, et le temps manque : un audit de plus ne dira rien que le commissaire aux comptes n'ait vu.",
      ceQuiLeDejoue:
        "Dagmar Brachet, de Collonges Audit : sur les reprises qu'elle a auditées, un contentieux prud'homal en cours une fois sur deux, autour de 85 k€, et des travaux de mise en sécurité un peu plus d'une fois sur deux, 300 k€ en moyenne ; les comptes certifiés ne montrent ni l'un ni l'autre. Le procès-verbal de la commission de sécurité de 2019 laisse deux prescriptions sans trace de levée. L'audit complet coûte 48 k€, et ce qu'il trouve peut être présenté à l'ARS. Rejouée sur les trente tirages à la place de l'audit complet, la confiance dans les comptes perd 211 k€ en moyenne et ne fait mieux que 8 fois sur 30.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le président le dit : ne braquons pas l'ARS avec une liste de courses, elle a besoin de nous et saura nous aider.",
      ceQuiLeDejoue:
        "L'avocate Ximena Larcher détaille ce que l'ARS peut financer : la transition (70 k€), un avenant au CPOM qui laisse les économies dans les dotations (sans lui, 210 k€ repris sur le CPOM), la reprise du passif social. Les directeurs généraux ajoutent qu'un dossier chiffré appuyé sur un audit complet obtient l'essentiel quatre fois sur cinq en année normale, et rien de chiffré presque jamais. Rejouée sur les trente tirages à la place du dossier chiffré, la demande vide perd 316 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Ce sont les mêmes moniteurs qui encadrent la blanchisserie et accompagnent les travailleurs : en passer une plus grande part sur le budget social, et le déficit commercial fond aussitôt.",
      ceQuiLeDejoue:
        "Le compte de chaque atelier : la blanchisserie perd 80 k€ sur un contrat facturé sous son coût, et le budget commercial s'équilibre par ses ventes ; une clé de répartition modifiée sans justification est rejetée au premier contrôle. Recentrer coûte 20 k€ de transition et ramène le déficit à 5 k€ par an. Rejouée sur les trente tirages à la place du recentrage avec l'appel d'offres, la nouvelle clé perd 334 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi: "Nous avons dit à l'ARS que nous irions au bout : revenir sur notre parole nous ferait perdre sa confiance.",
      ceQuiLeDejoue:
        "La mise en regard de la réponse de l'ARS et des passifs : ce que l'audit a révélé et que l'ARS n'a pas accordé reste à la charge de Solvanne, et une seconde demande appuyée sur des chiffres d'audit est un peu plus facile à accorder que la première, pour 10 k€ de gestion transitoire de plus. Rouvrir n'est pas se retirer : un retrait à ce stade coûte autour de 230 k€. Rejoué sur les trente tirages à la place de la négociation rouverte, le vote comme annoncé perd 272 k€ en moyenne et ne fait mieux que 8 fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Moins on en dit avant la signature, moins on prend d'engagements : une note de service le lendemain du vote suffira.",
      ceQuiLeDejoue:
        "Irmine Marsaudon et Fodé Pellerey resteront s'ils savent avant l'été ce qu'ils deviennent ; quand rien n'a été dit avant le vote, les cadres sont partis plus d'une fois sur deux, et un départ de directrice coûte autour de 90 k€. L'avocate rappelle que le CSE des Primevères doit être informé et consulté. Associer les équipes coûte 15 k€. Rejoué sur les trente tirages à la place de cette préparation, le silence perd 44 k€ en moyenne et ne fait mieux que 10 fois sur 30.",
    },
  ],
  debrief: [
    "En semaine 1, le président de Solvanne ne voyait pas comment dire non, et Eudoxie Rambourg voulait d'abord voir les comptes. Qu'est-ce qu'un accord de principe sous conditions donnait à l'ARS, que ni le oui ni le non ne donnaient ?",
    "Le passif social vaut 364,4 k€ et n'apparaît nulle part dans les comptes des Primevères. Pourquoi des comptes certifiés peuvent-ils ne pas le montrer ? Qui le paie après la fusion ?",
    "L'audit complet coûte 48 k€. Sous le tirage n° 16, qu'a-t-il trouvé, et qu'en avez-vous fait devant l'ARS ? Que se serait-il passé si vous l'aviez découvert après le vote ?",
    "Pourquoi l'ARS ne peut-elle pas combler le déficit commercial de l'ESAT ? Qu'est-ce que la demande de le couvrir disait d'une direction générale à l'ARS ?",
    "Le oui immédiat fait mieux que l'accord sous conditions 17 fois sur 30, et perd 208 k€ en moyenne. Comment est-ce possible ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Sous le tirage n° 16, l'attente ne coûte que 24 k€, parce qu'Héliandre a repris les Primevères. Attendre était-il pour autant une bonne décision ? Qu'est-ce que l'association a laissé passer ?",
    "Quelle règle présentez-vous à votre conseil d'administration quand l'autorité de tarification vous demande un service ? Formulez-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Une association reprend un service de soins infirmiers à domicile de 30 salariés, tous transférés avec leur contrat. 1) Cinq salariés partiront à la retraite dans les cinq ans ; la convention leur doit quatre mois de salaire chacun, à 3 600 € par mois charges comprises. Les comptes épargne-temps cumulent 210 jours à 180 € la journée. Rien n'est provisionné : chiffrez le passif social. 2) La reprise fait 120 k€ d'économies par an en régime, la moitié la première année. Que rapporte-t-elle sur cinq ans ? 3) Les frais de transition sont de 50 k€. Quelle valeur la reprise crée-t-elle sur cinq ans, sans actualisation, si le financeur ne reprend pas le passif ? Et s'il le reprend ?",
    corrige:
      "1) Indemnités de départ : 5 × 4 × 3 600 = 72 000 € ; comptes épargne-temps : 210 × 180 = 37 800 € ; passif social : 109 800 €. 2) 60 000 + 4 × 120 000 = 540 000 €. 3) Sans reprise du passif : 540 000 − 109 800 − 50 000 = 380 200 € ; avec : 540 000 − 50 000 = 490 000 €. Le passif pèse près d'une année d'économies : c'est ce qu'il faut demander au financeur avant de signer.",
  },
  evaluation: [
    "Le passif social est calculé juste (indemnités de départ des douze salariés concernés, comptes épargne-temps), à partir du registre du personnel, et l'élève dit pourquoi les comptes certifiés ne le montrent pas.",
    "La réponse à l'ARS et la demande de financement sont argumentées par ce que l'ARS peut et ne peut pas financer, avec les chiffres des sources.",
    "Le choix de l'audit et celui du vote s'appuient sur ce que l'audit peut révéler et sur ce qui reste à la charge de Solvanne.",
    "La préparation des équipes respecte le transfert des contrats, le maintien des accords et la consultation du CSE, tels que l'épisode les pose.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 16.",
  ],
  vigilance:
    "L'épisode cite le transfert des contrats de travail (article L. 1224-1 du code du travail), la survie des accords collectifs quinze mois au plus le temps de négocier un accord de substitution (article L. 2261-14) et l'information-consultation du CSE : un enseignant de droit social voudra vérifier ces règles et leurs conditions avant de les présenter. Le montant des indemnités de départ à la retraite (six mois de salaire au-delà de vingt ans d'ancienneté) est donné par l'épisode comme celui de la convention collective : il varie selon la convention applicable. Les règles de financement par l'ARS (crédits non reconductibles, avenant au CPOM, budget commercial d'un ESAT qui s'équilibre par ses ventes) sont présentées de façon simplifiée.",
};
