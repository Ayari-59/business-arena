/**
 * FICHE ENSEIGNANT · ÉPISODE 72, LE TRAVAIL FAIT QU'ON N'A PAS FACTURÉ.
 *
 * Le besoin de financement d'un cabinet de conseil commence avant la facture :
 * l'en-cours de production et les factures que le client ne peut pas payer en
 * l'état pèsent plus que les retards de paiement qu'on veut relancer.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "factures-qui-dorment",
  formations: ["bts-cg", "dcg", "but-gea", "bac-pro-agora"],
  programme: [
    "BTS CG · Processus 6, Analyse de la situation financière",
    "DCG · UE 6, Finance d'entreprise",
    "Bac pro AGORA · Bloc 1, Gérer des relations avec les clients, les usagers et les adhérents",
  ],
  notion:
    "Un DSO qui monte ne dit pas que les clients paient plus tard : il dit que les créances grossissent, et une partie d'entre elles ne sont pas payables. L'erreur classique consiste à lire la liste des « clients en retard » comme une liste de mauvais payeurs, à relancer tout le monde et à demander du découvert. Chez Atlas Conseil, le DSO est passé de 75 à 96 jours (8 940 k€ de créances pour 34 M€ de chiffre d'affaires, 93 k€ par jour), mais la liste des retards de 4 240 k€ mêle 1 240 k€ de factures publiques rejetées par le portail, que l'acheteur n'a jamais reçues, et 790 k€ de factures contestées : il ne reste que 2 210 k€ vraiment échues et non contestées. Surtout, l'argent dort avant la facture : 2 741 k€ d'en-cours de production au 30 septembre, dont 1 120 k€ de jalons franchis que personne n'a déclenchés et 901 k€ de régie sans temps validés. L'élève découvre qu'on ne relance pas une facture qui n'existe pas, qu'il faut facturer juste et à temps avant de relancer, et qu'un banquier prête sur un échéancier crédible plutôt que sur une demande.",
  objectifs: [
    "Je calcule l'en-cours de production d'un cabinet : les travaux réalisés au forfait non encore facturés, et la régie réalisée non facturée.",
    "Je décompose une balance âgée en créances non échues, échues, rejetées et contestées, et je dis lesquelles une relance peut faire payer.",
    "Je calcule un DSO et une durée de production immobilisée, et j'explique ce qui les fait monter.",
    "Je choisis un financement de court terme en sachant ce que le prêteur regarde et ce que chaque solution coûte.",
  ],
  prerequis:
    "Le cycle d'exploitation, la notion de créance client, la balance âgée et le calcul d'un délai de paiement en jours de chiffre d'affaires doivent être connus. Le découvert, la facilité de caisse et l'affacturage peuvent être présentés en quelques minutes avant la séance ; l'en-cours de production se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/factures-qui-dorment?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, l'en-cours de production non facturé au 30 septembre, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (relance générale, revue des en-cours, relances habituelles ou découvert), celle de la semaine 6 sur la facture d'Ollivro et celle de la semaine 8 sur le financement de décembre. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 6 : le comité de pilotage avec avenant, ou l'avoir de 80 k€.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir de l'extraction de Tempora : 8 450 k€ réalisés sur les forfaits pour 6 610 k€ facturés, soit 1 840 k€, plus 1 060 jours de régie à 850 €, soit 901 k€ : 2 741 k€. Vous faites expliquer les valeurs éloignées (1 840, 2 021 ou 4 771), puis vous rapportez l'en-cours au chiffre d'affaires d'un jour : près de 29 jours de production qui n'ont pas encore de facture.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : la relance de toute la liste contre la revue des en-cours. Vous faites relire la balance âgée et séparer, au tableau, les 4 240 k€ de la liste en 2 210 k€ dus, 1 240 k€ rejetés et 790 k€ contestés. Vous enchaînez sur la semaine 2, où la mise en demeure des acheteurs publics échoue parce qu'aucune facture conforme n'a été reçue, puis sur la semaine 8 : ce que regarde le comité de crédit de Kristen Cariou, et pourquoi l'échéancier passe là où la demande seule échoue.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Facturer juste avant de relancer » dégage 1 546 k€ pour une cible de 1 000 k€, « Relancer tout le monde, demander du découvert » 148 k€, et l'attentisme −140 k€. Vous montrez ensuite la décision où le hasard peut tromper : en semaine 6, l'avoir de 80 k€ fait mieux que le comité de pilotage 8 fois sur 30, parce que l'avenant n'est pas toujours signé, mais il rapporte 72 k€ de moins en moyenne. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de relancer, facturer ce qui est dû, et vérifier que la facture est payable. Vous la déclinez en trois gestes : déclencher les jalons et valider les temps à date fixe, rendre obligatoire à l'émission ce que le client exige (le numéro d'engagement), et ne relancer que les factures échues et non contestées. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 2741,
    etapes: [
      "Source « Extraire de Tempora l'en-cours des missions au 30 septembre » : sur les 64 missions au forfait en cours, 8 450 k€ de travaux sont réalisés (avancement validé × prix) pour 6 610 k€ facturés : 8 450 − 6 610 = 1 840 k€ d'en-cours au forfait. Les 1 120 k€ de jalons franchis non déclenchés en font partie, avec 720 k€ de travaux qui attendent le prochain jalon.",
      "Même source : en régie, 1 060 jours réalisés en août et en septembre ne sont pas facturés, au TJM moyen de 850 € : 1 060 × 850 = 901 000 €, soit 901 k€.",
      "En-cours de production non facturé : 1 840 + 901 = 2 741 k€. Le chiffre ne dépend pas du hasard : 2 741 k€ pour toute la classe. L'épisode le juge juste à 20 k€ près, proche à 100 k€.",
      "Pour le situer : avec 34 M€ de chiffre d'affaires, un jour vaut 34 000 / 365 ≈ 93 k€ ; l'en-cours représente environ 29 jours de production, et en-cours et créances ensemble (2 741 + 8 940) / 93 ≈ 125 jours, le chiffre du mandat au 30 septembre.",
    ],
    erreurs: [
      {
        valeur: 1840,
        cause:
          "Les seuls forfaits (8 450 − 6 610) : la régie réalisée sans temps validés, 1 060 jours à 850 €, soit 901 k€, est oubliée.",
      },
      {
        valeur: 2021,
        cause:
          "Les jalons franchis et la régie seulement (1 120 + 901) : les 720 k€ de travaux réalisés entre deux jalons sont aussi de l'en-cours, même s'ils ne sont pas encore facturables.",
      },
      {
        valeur: 4771,
        cause:
          "L'en-cours additionné aux factures rejetées et contestées (2 741 + 1 240 + 790) : c'est ce qui « dort sans facture valide », mais les 2 030 k€ de factures sont déjà émises et comptent dans les créances, pas dans l'en-cours.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La banque s'inquiète du DSO, la présidente veut « relancer tout le monde, et fort », et la liste des clients en retard additionne 4 240 k€ : c'est l'action qui paraît la plus directe.",
      ceQuiLeDejoue:
        "La balance âgée montre que, sur les 4 240 k€, 1 240 k€ sont des factures publiques rejetées que l'acheteur n'a jamais reçues et 790 k€ des factures contestées : seuls 2 210 k€ sont dus. L'extraction de Tempora montre 2 741 k€ d'en-cours qui n'ont même pas de facture, et Gustave Herbelin le dit : « On ne relance pas une facture qui n'existe pas. » Rejouée sur les trente tirages à la place de la revue des en-cours, la campagne de relance perd 194 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Le découvert frôle l'autorisation de 1 500 k€ et décembre est le mois le plus lourd : demander une rallonge « ne coûte rien », dit la présidente.",
      ceQuiLeDejoue:
        "Kristen Cariou annonce elle-même que son comité veut comprendre d'où vient la dégradation du DSO ; une demande sans dossier ne règle rien et coûte 2,5 k€ de frais d'étude, dus même en cas de refus. Rejouée sur les trente tirages à la place de la revue des en-cours, elle perd 96 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Les acheteurs publics doivent de plein droit des intérêts moratoires quand ils paient en retard : une mise en demeure signée de la direction financière paraît faire valoir un droit.",
      ceQuiLeDejoue:
        "La source sur les droits d'Atlas le précise : le délai ne court que pour une facture conforme reçue, et une facture rejetée ne donne droit à rien. Louison Fradin, au centre hospitalier de Pornevaux, répond qu'il n'a reçu aucune facture conforme. Les motifs de rejet sont presque toujours un numéro d'engagement absent : 22 % des factures publiques reviennent, 4 % avec le champ rendu obligatoire. Rejouée sur les trente tirages à la place des numéros obtenus et rendus obligatoires, la mise en demeure perd 615 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le travail est fait, il doit être payé : une mise en demeure puis une injonction de payer paraissent montrer qu'Atlas ne se laisse pas faire, comme le suggère Gustave.",
      ceQuiLeDejoue:
        "Le contrat montre que 160 k€ sur 240 sont exactement dans le périmètre et que 80 k€ viennent d'une extension demandée par courriel, sans avenant. L'avocat prévient que le débiteur peut former opposition dans le mois, et la procédure au fond dure douze à dix-huit mois. Un client déjà relancé sur une facture qu'il conteste ne signe plus l'avenant que trois fois sur dix, et la phase 3 vaut 120 k€ de marge, avec Kéroual Consulting déjà reçu. Rejouée sur les trente tirages à la place du comité de pilotage, la mise en demeure perd 257 k€ en moyenne ; elle ne fait mieux que 2 fois sur 30.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Prune Lecoeur annonce un manque de 1 390 k€ au pic de la semaine 12 : demander 1 500 k€ de découvert supplémentaire jusqu'à fin janvier paraît la réponse exacte au besoin.",
      ceQuiLeDejoue:
        "Kristen Cariou dit ce que regarde son comité : un échéancier de factures émises, acceptées, non contestées. Avec 2 646 k€ qui dorment encore sans facture valide, une facilité de caisse appuyée sur l'échéancier passe plus de huit fois sur dix ; un découvert demandé sans dossier, une fois sur trois au mieux. Rejouée sur les trente tirages à la place de l'échéancier, la demande de découvert perd 21 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Avant les congés, la présidente veut tout le monde au téléphone : « C'est maintenant ou en février. »",
      ceQuiLeDejoue:
        "Le tri de la liste montre que seuls 1 402 k€ sont échus et non contestés ; le reste, 764 k€ contestés et 278 k€ rejetés, ne rentrera pas sur une relance. Ce qui peut encore être encaissé, ce sont les 556 k€ de jalons, les 474 k€ de régie et les factures publiques conformes déposées avant les mandatements du 12 décembre. Rejouée sur les trente tirages à la place de la facturation avant la clôture, la relance générale perd 239 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, la liste des clients en retard disait 4 240 k€. Qu'est-ce que la balance âgée y a trouvé, et quelle part une relance pouvait-elle vraiment faire payer ?",
    "L'en-cours de production valait 2 741 k€ au 30 septembre. Pourquoi ce chiffre n'apparaît-il pas dans le DSO, et pourquoi pèse-t-il pourtant sur la trésorerie autant que les créances ?",
    "Une facture publique rejetée ne fait courir aucun délai de paiement. Qu'est-ce qui, dans la décision de la semaine 2, distinguait corriger les rejets un par un et rendre le numéro d'engagement obligatoire à l'émission ?",
    "En semaine 6, l'avoir de 80 k€ fait mieux que le comité de pilotage 8 fois sur 30, mais rapporte 72 k€ de moins en moyenne. Lequel choisissez-vous, et sur quel critère ?",
    "Le comité de crédit de la Banque de l'Erdre accorde une facilité appuyée sur un échéancier et refuse souvent un découvert demandé seul. Qu'est-ce qu'un prêteur achète, quand il prête à court terme ?",
    "Sous le tirage n° 12, ceux qui ont relancé tout le monde et demandé du découvert dégagent 148 k€, contre 1 546 k€ pour ceux qui ont facturé juste. Si l'un d'eux a eu la rallonge, sa décision était-elle bonne pour autant ?",
    "Quelle règle gardez-vous pour faire rentrer l'argent d'une entreprise qui vend du temps ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un bureau d'études réalise 9 600 k€ de chiffre d'affaires hors taxes par an. Au 30 juin, ses forfaits en cours représentent 1 200 k€ de travaux réalisés, pour 950 k€ facturés ; 300 jours de régie réalisés ne sont pas facturés, au TJM moyen de 800 €. Ses créances clients s'élèvent à 2 400 k€ hors taxes ; la liste des « clients en retard » en additionne 900 k€, dont 300 k€ de factures publiques rejetées et 200 k€ de factures contestées. 1) Calculez l'en-cours de production non facturé. 2) Calculez le DSO, sur une année de 365 jours. 3) Calculez la production immobilisée, en-cours et créances, en jours de chiffre d'affaires. 4) Quel montant une campagne de relance peut-elle faire payer plus vite, et que faut-il faire du reste ?",
    corrige:
      "1) Forfaits : 1 200 − 950 = 250 k€ ; régie : 300 × 800 = 240 k€ ; en-cours : 250 + 240 = 490 k€. 2) Un jour de chiffre d'affaires vaut 9 600 / 365 ≈ 26,3 k€ ; DSO : 2 400 / 26,3 ≈ 91 jours. 3) (2 400 + 490) / 26,3 ≈ 110 jours. 4) 900 − 300 − 200 = 400 k€ seulement sont échus et non contestés. Les 300 k€ rejetés doivent être corrigés et redéposés (aucun délai ne court tant que la facture n'est pas conforme) ; les 200 k€ contestés se règlent avec le client, livrable validé ou avenant signé ; les 490 k€ d'en-cours doivent d'abord être facturés.",
  },
  evaluation: [
    "L'en-cours de production est calculé juste (1 840 k€ au forfait et 901 k€ de régie, soit 2 741 k€) à partir de la source nommée.",
    "La liste des retards est décomposée en factures dues, rejetées et contestées, avec les montants de la balance âgée, et la relance est réservée aux factures dues.",
    "Chaque litige ou rejet est traité par sa cause (numéro d'engagement, avenant, livrable validé) plutôt que par la pression sur le client.",
    "Le financement de décembre est choisi en disant ce que regarde le prêteur et ce que coûte chaque solution.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les règles de la commande publique que l'épisode pose (délai de paiement de 30 jours pour une collectivité et de 50 jours pour un établissement public de santé, intérêts moratoires au taux de la Banque centrale européenne majoré de huit points, indemnité forfaitaire de 40 €) sont à relire au texte en vigueur. La majoration de 5 % sur les échéances de l'URSSAF et de la TVA payées en retard est une simplification du modèle. L'affirmation que les créances cédées avec recours « restent au bilan » dépend du référentiel comptable : en comptes individuels français, les créances affacturées sortent en général de l'actif.",
};
