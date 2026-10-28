/**
 * FICHE ENSEIGNANT · ÉPISODE 12, LE CONTRÔLE QUI S'ANNONCE.
 *
 * Délais de paiement, règles de facturation et contrôle interne : les retards
 * viennent du circuit de validation, pas de la caisse, et un écart qu'on montre
 * coûte moins qu'un écart qu'on trouve. Le piège : bloquer, maquiller ou minimiser.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "controle-qui-s-annonce",
  formations: ["seconde-pro-gatl", "bts-cg", "bts-gpme"],
  programme: [
    "2de pro GATL · 3, Mettre en œuvre et contrôler les processus administratifs, et 5, Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
    "BTS CG · Processus 1, Contrôle et traitement comptable des opérations commerciales",
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
  ],
  notion:
    "Une facture payée en retard n'est presque jamais un problème de trésorerie ni de comptables : c'est un problème de circuit, l'endroit où la facture attend. L'erreur classique, à l'annonce d'un contrôle, consiste à agir sur l'apparence des dossiers : geler les paiements « le temps de tout vérifier », payer l'arriéré en urgence pour « arriver propres », faire antidater des accords de remise, ou recevoir le contrôleur avec le strict minimum. Dans l'épisode, Émilie Masson, responsable de la conformité d'Arvel Négoce Rhône, apprend qu'un inspecteur de la DGCCRF arrive en semaine 8 : 18 % des 500 factures hebdomadaires sont payées après l'échéance, le délai moyen est de 52 jours, 420 factures échues attendent, et une soixantaine de remises ont été accordées sans écrit. L'extraction des factures en retard montre 3 jours de saisie, 38 jours d'attente du bon pour accord en agence et 4 jours de paiement, avec une signature unique au-delà de 5 000 €, et 1,6 million d'euros disponibles. L'élève découvre que seul le circuit corrigé (délégations, relance, dématérialisation) fait baisser le taux que le contrôleur mesure, qu'un écart présenté avec sa cause et un plan daté pèse bien moins qu'un écart découvert, et qu'un dossier maquillé n'est jamais une économie.",
  objectifs: [
    "Je suis le parcours d'une facture du courrier au virement et je repère l'étape où elle attend.",
    "Je distingue un stock (les factures échues non payées) d'un flux (la part des factures de la semaine payées en retard), et je sais lequel une décision fait bouger.",
    "Je régularise un écart de facturation de façon honnête et je refuse de faire antidater un document.",
    "Je prépare une note d'autodiagnostic : les écarts, leurs causes, les corrections faites et un plan daté.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le circuit d'une facture fournisseur (réception, bon pour accord, saisie, règlement), la notion d'échéance et de délai de paiement, et les mentions d'une facture doivent avoir été vus en cours. Le contrôle interne et la délégation de signature peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/controle-qui-s-annonce?hasard=5 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, la part des factures qui seront payées en retard en semaine 3 et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la prévision de la semaine 1, et la réponse à Fabien Lemarchand en semaine 5 sur les remises sans papier, où la classe se partage souvent. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 3 : délégations de signature au lieu de la refonte du circuit.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute. Vous refaites le raisonnement à partir de l'extraction des 200 factures : le retard se fait avant la comptabilité, et aucune décision de la semaine 1 ne touche au circuit avant la semaine 4. Le taux reste donc autour de 18 % (18,6 % sous le tirage n° 5). Vous faites expliquer les valeurs éloignées (5, 10, 61), puis ce que donne le gel des paiements : environ 39 % en semaine 3.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (audit ciblé, cabinet, gel, attente), de la semaine 5 (régulariser, antidater, supprimer, laisser) et de la semaine 7 (note d'autodiagnostic, avocat, compte-gouttes, comptabilité). Pour les remises, vous faites lire la réponse de Clara Esteves : un avoir et un accord daté du jour, c'est un manquement reconnu ; un accord antidaté, c'est un faux. Vous ne mettez pas cette option en débat comme une habileté : vous faites seulement constater ce qu'elle a coûté.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 5, « Savoir, corriger, montrer » finit 16,8 k€ sous le budget de conformité de 95 k€, « Bloquer, puis minimiser » 142,6 k€ au-delà, et l'attentisme 80 k€ au-delà ; sur les trente tirages, la première méthode reste sous le budget 24 fois, les deux autres jamais. Vous séparez la qualité d'une décision de son résultat sur deux cas : la refonte du circuit, battue par les délégations quand le prestataire glisse, et le dossier déclaré clos, gagnant quand il n'y a pas de contrôle de suite.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois règles de l'épisode : chercher où la facture attend avant d'agir ; corriger la cause (le circuit, les délégations) plutôt que vider le stock ; montrer au contrôleur ce qu'on sait, avec le plan de correction daté, et ne jamais maquiller. Vous terminez sur le contrôle interne : trente factures vérifiées chaque mois et des équipes formées, pour que la correction tienne après le départ du contrôleur.",
    },
  ],
  calcul: {
    reponse: 18,
    etapes: [
      "Tableau de bord du lundi : la semaine dernière, 18 % des factures fournisseurs ont été payées après l'échéance, soit environ 90 factures sur 500. C'est un flux : la part des factures de la semaine qui partent en retard.",
      "Source « Extraire le parcours des 200 dernières factures en retard » : 3 jours de saisie, 38 jours d'attente du bon pour accord en agence, 4 jours de paiement une fois la facture validée, et 61 % des retards sur des factures de plus de 5 000 € qui attendent en plus la signature de Lionel Barthès. La trésorerie n'est pas en cause (1,6 million d'euros disponibles). Le taux dépend donc du circuit de validation.",
      "Aucune décision de la semaine 1 ne touche au circuit : l'audit ciblé apprend, il ne corrige pas ; les délégations de signature, si on les choisit en semaine 3, n'agissent qu'à partir de la semaine 4, la refonte à partir de la semaine 6. En semaine 3, le taux reste donc celui de départ : 18 %.",
      "Seule exception : le gel des paiements met en retard tout ce qui échoit pendant le gel. Le modèle donne alors 45 % en semaine 2 et 38 % en semaine 3 avant aléa, environ 39 % sous le tirage de la classe.",
      "Sous le tirage n° 5, le modèle donne 18,0 %, 19,6 % puis 18,6 % pour les semaines 1 à 3 : les écarts autour de 18 % sont le bruit des échéances groupées et des absences. L'épisode juge juste à 2 points près, proche à 5. Selon les trente tirages du bilan, la valeur va de 15,3 % à 23,5 %.",
    ],
    erreurs: [
      {
        valeur: 5,
        cause:
          "L'objectif du mandat (5 % au plus) pris pour une prévision, comme si décider suffisait à corriger : rien ne change au circuit avant la semaine 4.",
      },
      {
        valeur: 10,
        cause:
          "Le taux que donnent les délégations de signature, compté dès la semaine 3 : elles ne se décident qu'en semaine 3 et n'agissent qu'à partir de la semaine 4.",
      },
      {
        valeur: 61,
        cause:
          "La part des retards qui concernent des factures de plus de 5 000 € (61 %) prise pour la part des factures payées en retard : c'est une répartition des retards, pas un taux.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Avant un contrôle, on ne veut plus rien laisser passer : geler deux semaines et revoir chaque facture paraît prudent, pour 3 000 € de temps seulement.",
      ceQuiLeDejoue:
        "L'extraction le disait : la comptabilité paie en 4 jours ce qu'on lui transmet validé, le retard se fait en agence (38 jours). Geler met en retard tout ce qui échoit pendant le gel : environ 39 % de factures en retard en semaine 3 sous le tirage de la classe, dans la période que le contrôleur examine, et une fois sur deux Plâtres du Forez suspend ses livraisons. Rejoué sur les trente tirages à la place de l'audit ciblé, le gel perd 44,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Bérénice Hoarau le propose : deux semaines d'heures supplémentaires, et plus une facture échue en semaine 4. On arrive propres.",
      ceQuiLeDejoue:
        "Payer l'arriéré vide le stock, pas le flux : les chefs d'agence interrogés visent toujours le vendredi, et tout ce qui dépasse 5 000 € remonte encore à Lionel. Bérénice le constate elle-même : « les bannettes des agences se remplissent déjà comme avant ». Le taux reste à 18 %, et c'est lui que le contrôleur mesure. Rejoué sur les trente tirages à la place de la refonte, le rattrapage perd 26,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi: "Modifier les règles maintenant, ce serait reconnaître qu'elles posaient problème.",
      ceQuiLeDejoue:
        "Ludivine Abrial le disait : « Si je pouvais signer jusqu'à 15 000 € et qu'on me relançait, ça partirait dans la semaine. » Viser une facture prend trois minutes. Et la source sur l'amende le précise : les corrections déjà en place la réduisent, l'immobilité ne la réduit pas. Rejoué sur les trente tirages à la place de la refonte, ne rien changer perd 27,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Fabien Lemarchand promet des dossiers propres en une semaine : le contrôleur ne verra que des accords signés.",
      ceQuiLeDejoue:
        "Clara Esteves, juriste du groupe : « Un accord antidaté, c'est un faux. Le contrôleur peut interroger les artisans ; s'il le découvre, l'amende change d'échelle, le dossier part au procureur. » Dans le modèle, il le découvre un peu moins d'une fois sur deux (15 tirages sur 30), et il l'a découvert sous le tirage de la classe. Même caché, le faux coûte 5 000 € de temps commercial et des artisans qui partent. Rejoué sur les trente tirages à la place de la régularisation, il perd 50,1 k€ en moyenne, 95,7 k€ sous le tirage de la classe, et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi: "Supprimer toutes les remises hors barème : plus de remise sans papier, donc plus de nouveau risque.",
      ceQuiLeDejoue:
        "La source sur les remises : une soixantaine, 41 artisans, 2,3 % du chiffre d'affaires des agences, et pour une dizaine d'entre eux la remise est le prix. Les accorder par écrit, avec mention sur la facture, ne coûte rien de plus. Supprimer ne régularise pas les remises passées, que le contrôleur trouvera, et fait partir des artisans chaque semaine. Rejoué sur les trente tirages, il perd 33,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Gagner du temps : le contrôleur finira sur des chiffres plus récents, une fois les corrections en place.",
      ceQuiLeDejoue:
        "La source sur le montant de l'amende : la bonne foi et les corrections déjà en place l'allègent, une entrave au contrôle aggrave tout. Pascal Ménard répond en élargissant son échantillon à 300 factures et en reprenant toutes les remises une à une. Rejoué sur les trente tirages à la place de la note d'autodiagnostic, le compte-gouttes perd 36,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Fabien le dit : « Leur échantillon ne veut rien dire. » Un avocat qui conteste tout, c'est se défendre.",
      ceQuiLeDejoue:
        "Relu ligne à ligne avec Clara, le procès-verbal est exact facture par facture, et la méthode de tirage est celle que l'administration applique partout : « Il n'y a pas grand-chose à contester. » La contestation coûte 7 000 € d'honoraires et n'est entendue qu'une fois sur cinq. Rejouée sur les trente tirages à la place de la reconnaissance avec corrections prouvées, elle perd 11,1 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi: "Le contrôle est passé, la sanction tombera : l'équipe a besoin de souffler.",
      ceQuiLeDejoue:
        "La source des deux dernières semaines : deux agences sur quatre visent de nouveau le vendredi, et des commerciaux accordent encore des remises sans écrit ; Ludivine : « Personne ne nous a jamais expliqué le délai légal. » Le contrôleur avait prévenu que l'injonction pourrait être vérifiée. Sous le tirage de la classe, il revient en semaine 13, et clore le dossier coûte 15,8 k€ de plus que former les équipes. Sur les trente tirages, clore fait mieux 13 fois, d'environ 1,3 k€, quand il n'y a pas de contrôle de suite : en moyenne, il perd 8,3 k€.",
    },
  ],
  debrief: [
    "En semaine 1, la comptabilité payait en quatre jours ce qu'on lui transmettait validé. Où les factures attendaient-elles, et qu'est-ce qui, dans les sources, permettait de le savoir avant de décider ?",
    "Payer l'arriéré en urgence fait tomber les factures échues, mais pas la part des factures payées en retard. Quelle différence entre ces deux chiffres, et lequel le contrôleur mesure-t-il ?",
    "Sous le tirage de la classe, le contrôleur a découvert les accords antidatés ; sur les trente tirages, il les découvre une fois sur deux. Ceux qui n'ont pas été découverts avaient-ils pris une meilleure décision ? Qu'est-ce que la juriste refusait de couvrir, et pourquoi ?",
    "Pourquoi un écart que l'on présente soi-même, avec sa cause et un plan daté, coûte-t-il moins qu'un écart que le contrôleur trouve seul ? Que fallait-il avoir fait en semaine 1 pour pouvoir écrire la note d'autodiagnostic ?",
    "La refonte du circuit rapporte le plus en moyenne, mais les délégations de signature font mieux 10 fois sur 30, quand le prestataire glisse de trois semaines. Laquelle choisissez-vous, et sur quel critère ?",
    "Ceux qui ont clos le dossier ont perdu 15,8 k€ sous le tirage de la classe, parce que le contrôleur est revenu ; sous treize autres tirages, ils auraient gagné 1,3 k€. Comment juger cette décision indépendamment de son résultat ?",
    "Quelle règle gardez-vous face à un contrôle annoncé ? Formulez-la en une phrase, avec la cause et ce qu'on montre.",
  ],
  prolongement: {
    enonce:
      "Une PME reçoit 300 factures fournisseurs par semaine, payables à 45 jours. Le parcours moyen d'une facture : 2 jours d'enregistrement, 30 jours d'attente du bon pour accord du chef de service, puis 3 jours de paiement. Les factures de plus de 3 000 €, soit 40 % des factures, attendent en plus 14 jours la signature du gérant. 1) Calculez le délai d'une facture de moins de 3 000 € et celui d'une facture de plus de 3 000 €. Lesquelles sont payées en retard, et combien par semaine ? 2) L'indemnité forfaitaire de 40 € par facture payée en retard est réclamée par un fournisseur sur deux : que coûte-t-elle par semaine, puis sur 13 semaines ? 3) Le comptable propose de payer en 1 jour au lieu de 3. Le chef de service propose de viser sous 15 jours. Quelle proposition supprime les retards ?",
    corrige:
      "1) Moins de 3 000 € : 2 + 30 + 3 = 35 jours, dans le délai de 45 jours. Plus de 3 000 € : 2 + 30 + 14 + 3 = 49 jours, en retard. Ce sont 40 % de 300, soit 120 factures par semaine. 2) 120 × 40 € × 0,5 = 2 400 € par semaine, soit 2 400 × 13 = 31 200 € sur le trimestre. 3) Payer en 1 jour donne 2 + 30 + 14 + 1 = 47 jours : les 120 factures restent en retard. Viser sous 15 jours donne 2 + 15 + 14 + 3 = 34 jours : plus aucune facture en retard, sans même toucher à la signature du gérant. Le retard se fait là où la facture attend, pas au paiement.",
  },
  evaluation: [
    "La prévision de la semaine 1 est justifiée par le parcours des factures : le retard se fait avant la comptabilité, et rien ne change au circuit avant la semaine 4.",
    "Le stock de factures échues et le taux de retard sont distingués, et la décision de la semaine 3 est argumentée sur le second.",
    "Les remises sans écrit sont traitées par une régularisation honnête (avoir, accord daté du jour, mention sur la facture), et le refus d'antidater est motivé.",
    "La réception du contrôleur et la réponse au procès-verbal s'appuient sur ce que l'entreprise sait de ses écarts et sur des corrections prouvées.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "Le plafond de 60 jours, l'indemnité forfaitaire de 40 € pour frais de recouvrement et l'obligation de faire figurer sur la facture toute réduction de prix acquise sont repris de l'épisode ; le texte exact (code de commerce, délais de paiement et mentions de la facture) est à relire avant de les donner aux élèves. Le délai de quinze jours pour présenter des observations, le barème de l'amende par point de retard et le coefficient lié à l'attitude de l'entreprise sont des simplifications du modèle, pas la procédure réelle de sanction administrative.",
};
