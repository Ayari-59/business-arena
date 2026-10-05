import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 42, LE CONCURRENT À RACHETER.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/concurrent-a-racheter.ts) ; ceux
 * du hasard de la classe sont ceux de la graine 23, les moyennes celles des
 * trente tirages du bilan, les autres décisions suivant la meilleure méthode.
 */
export const FICHE: FicheEnseignant = {
  code: "concurrent-a-racheter",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Une acquisition crée de la valeur pour l'acquéreur si le prix payé reste sous la valeur de la cible pour lui : sa valeur autonome, calculée sur un EBE retraité de ce qui ne se répétera pas, plus les synergies qu'il est raisonnable d'attendre, moins les coûts d'intégration et de transaction. Ce prix plafond se fixe avant d'entrer dans la vente, et seule la due diligence peut le faire baisser ; les synergies de revenus, rarement tenues, n'y entrent pas. L'erreur classique est de laisser l'enchère fixer le prix : dans une vente à plusieurs acquéreurs, celui qui l'emporte est souvent celui qui a le plus surestimé la cible, et il paie au vendeur les synergies qu'il avait calculées. C'est la malédiction du vainqueur, décrite par Capen, Clapp et Campbell à propos des enchères pétrolières (1971) et rapprochée des acquisitions par Roll (hypothèse d'hubris, 1986). L'épisode met l'élève à la place du directeur du développement d'un négoce de matériaux qui veut racheter un concurrent familial convoité par un groupe adossé à un fonds : tout le pousse à surenchérir pour « ne pas laisser la cible à Sérac », alors que la perdre coûte 220 k€ et la surpayer bien davantage. Il doit aussi décider combien payer pour savoir (l'audit), réviser l'offre de ce que l'audit trouve, et couvrir par des garanties ce qui reste incertain.",
  objectifs: [
    "Je calcule la valeur d'entreprise autonome d'une cible en appliquant un multiple de transactions comparables à un EBE retraité.",
    "Je fixe un prix plafond d'acquisition en distinguant les synergies de coûts, que je compte à leur taux de réalisation, des synergies de revenus, que je ne paie pas au vendeur.",
    "Je compare ce que coûte une surenchère à ce que coûte la perte de la cible, et je reconnais la malédiction du vainqueur.",
    "Je chiffre ce qu'un audit peut révéler, je révise l'offre de ce qu'il a trouvé et je couvre le risque restant par une garantie adossée à un séquestre ou un complément de prix.",
  ],
  prerequis:
    "L'EBE, la distinction entre valeur d'entreprise et valeur des titres (la dette nette), l'évaluation par les multiples de transactions comparables, et le calcul d'une espérance à partir de probabilités données.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/concurrent-a-racheter?hasard=23 : toute la classe joue le même trimestre, sous le même hasard. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous ne dites rien de la valeur d'une cible : vous demandez seulement de noter, avant la première offre, le prix maximal que chacun s'autorise et d'où il le tire.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions, de l'offre indicative au closing. Vous circulez sans répondre et relevez au tableau, sans commentaire, la valeur d'entreprise saisie en semaine 1, puis le choix fait en semaine 2 (audit complet, audit des comptes et des stocks, exclusivité, data room) et en semaine 5 (confirmer, réviser, baisser de 10 %, se retirer). Ceux qui finissent tôt rejouent les mêmes décisions sous un autre hasard et notent l'écart.",
    },
    {
      minutes: 20,
      titre: "Correction de la valeur de Mourgue",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute : les 8 250 k€ viennent de l'EBE publié, les 5 750 k€ de la dette nette retirée. Vous retraitez l'EBE ligne à ligne au tableau, appliquez le multiple, puis construisez avec la classe le prix plafond de 7,7 M€ à partir des synergies. Vous faites dire pourquoi les 660 k€ de synergies de revenus restent hors du plafond.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous prenez d'abord l'audit de la semaine 2, où la classe se partage le plus souvent entre l'audit complet et l'audit des comptes et des stocks, puis l'offre ferme de la semaine 5. Chaque camp donne son argument, puis vous ressortez la source qui tranchait : le cabinet d'audit sur ce que cachent les négoces familiaux, l'avocate sur ce qu'est un retrade. Vous terminez par le dernier tour : sous le hasard n° 23, l'offre révisée fait retirer Sérac, et la cédante demande un geste de 250 k€.",
    },
    {
      minutes: 10,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève. Le hasard pèse lourd : la meilleure méthode va de −305 k€ à +596 k€ selon le tirage, et n'atteint les 150 k€ du comité que 17 fois sur 30 ; sous le hasard n° 23, elle crée 499 k€ (le 5e tirage sur 30), bien au-dessus de sa moyenne de 187 k€. Vous faites distinguer ce que la classe a obtenu de ce que ses décisions valaient, et vous insistez : un rachat ne se juge pas sur un trimestre.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez la méthode que l'épisode a fait éprouver : retraiter l'EBE, appliquer le multiple, ajouter les seules synergies sûres, retirer les coûts du rachat, écrire le plafond avant la vente. Puis : payer l'audit quand ce qu'il peut trouver vaut plus que lui, réviser l'offre de ce qu'il trouve, laisser la cible plutôt que dépasser le plafond, couvrir le reste par contrat. Vous distribuez le cas de prolongement.",
    },
  ],
  calcul: {
    reponse: 7150,
    etapes: [
      "« Relire les comptes de Mourgue et la plaquette du banquier » : EBE publié du dernier exercice, 1 500 k€.",
      "Retraitements de l'EBE, même source : on retire les 150 k€ de marge du chantier du collège de Vizille (non récurrente) et les 80 k€ de rémunération qui manquent (un directeur général à 130 k€ chargés contre 50 k€ versés à la présidente) ; on réintègre les 30 k€ d'honoraires du litige clos (charge non récurrente). EBE retraité = 1 500 − 150 − 80 + 30 = 1 300 k€.",
      "« Rassembler les rachats de négoces de la région depuis trois ans » : médiane des transactions comparables, 5,5 fois l'EBE retraité, en valeur d'entreprise.",
      "Valeur d'entreprise autonome, synergies non comprises = 5,5 × 1 300 = 7 150 k€. C'est une valeur d'entreprise : la dette nette de 1 400 k€ ne se retire que pour passer au prix des titres (5 750 k€). Le résultat ne dépend pas du hasard ; l'épisode le juge juste à 100 k€ près, proche à 400 k€.",
      "Pour le comité, avec « Demander à Mounia Kherbache de chiffrer les synergies » : synergies de coûts 200 k€ par an, soit 5,5 × 200 = 1 100 k€ de valeur, tenues à 90 %, 990 k€. Prix plafond = 7 150 + 990 − 380 (intégration) − 60 (frais de transaction) = 7 700 k€. Les synergies de revenus (660 k€ de valeur, tenues au tiers, 220 k€) restent hors du plafond : c'est la marge de sécurité.",
    ],
    erreurs: [
      {
        valeur: 8250,
        cause:
          "Le multiple appliqué à l'EBE publié de 1 500 k€, comme le fait le banquier de la cédante : 200 k€ d'EBE qui ne se répéteront pas sont payés 1 100 k€. L'épisode la juge fausse.",
      },
      {
        valeur: 6985,
        cause:
          "Les retraitements à la baisse sont faits, mais pas la réintégration des 30 k€ du litige clos : 5,5 × 1 270 = 6 985 k€. On oublie qu'une charge non récurrente se retraite aussi. L'épisode la juge proche.",
      },
      {
        valeur: 5750,
        cause:
          "La dette nette de 1 400 k€ est retirée : on obtient le prix des titres, pas la valeur d'entreprise que demandent la question et les offres indicatives. L'épisode la juge fausse.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Sérac ne paie d'habitude pas plus de 5,9 fois l'EBE : une offre forte dès le premier tour l'écarte, comme le demande le directeur régional.",
      ceQuiLeDejoue:
        "7,9 M€, c'est 6,1 fois l'EBE retraité et 200 k€ au-dessus du plafond de 7,7 M€ : l'offre suppose toutes les synergies tenues à 100 %, revenus compris (8,47 M€). Sur les 30 tirages, elle fait −355 k€ en moyenne contre +187 k€ pour l'offre de 7,2 M€ sur l'EBE retraité.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "L'exclusivité écarte Sérac pour quatre semaines, et l'audit coûterait 85 k€ pour confirmer « ce qu'on sait déjà ».",
      ceQuiLeDejoue:
        "Le cabinet d'audit dit qu'un négoce familial sur trois a un stock surévalué (550 k€ ici) et un sur quatre un client qui part (1 100 k€) : 0,35 × 550 + 0,25 × 1 100 = 467,5 k€ cachés en moyenne, à payer en plus d'un prix d'au moins 7,8 M€, déjà au-dessus du plafond. Sur les 30 tirages : −562 k€ en moyenne contre +187 k€ pour l'audit complet.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Revenir sur l'offre annoncée ferait passer Arvel pour un « marchand de tapis » et laisserait la place à Sérac.",
      ceQuiLeDejoue:
        "L'avocate le dit : réviser le prix de ce que l'audit découvre est l'objet de la réserve de la lettre d'offre, et seul un retrade (revenir sur ce que les comptes montraient) fait rompre la cédante. Sous le hasard n° 23, confirmer 7,2 M€ après 550 k€ de stock dormant fait retirer Sérac et paie Mourgue 550 k€ de plus qu'en révisant ; sur les 30 tirages, −107 k€ contre +187 k€.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le président ne veut pas lire que Mourgue est chez Sérac, et 250 k€ ne font que 3 % du prix.",
      ceQuiLeDejoue:
        "Le calcul du prix plafond le rappelle : laisser Mourgue à Sérac coûte 220 k€ aux agences voisines, pas plus ; au-delà du plafond, chaque euro est une synergie donnée au vendeur, et le « fonds » du banquier n'a pas d'existence connue. Sous le hasard n° 23, Sérac s'est retiré, et le relèvement paie le geste demandé : 6,9 M€ au lieu de 6,65 M€ ; sur les 30 tirages, −148 k€ en moyenne contre +187 k€ avec le complément de prix.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La cédante refuse de bloquer le prix chez un notaire, le closing est calé, et on ne rouvre pas tout pour une clause.",
      ceQuiLeDejoue:
        "Le contrôle URSSAF finit en redressement de 400 k€ quatre fois sur dix ; sans séquestre, on récupère une fois sur deux. À 6,65 M€ de prix, la garantie de la cédante rend 0,4 × 0,5 × 332,5 = 66,5 k€ en espérance ; celle d'Arvel 0,4 × 380 = 152 k€, moins 51 k€ de contrepartie attendue (0,7 × 30 + 0,3 × 100), soit 101 k€. Sous le hasard n° 23, le redressement tombe et la cédante ne rend rien : 350 k€ de moins que le séquestre.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Son contrat de travail le lie, la présidente le connaît depuis vingt-deux ans, et le closing est prêt.",
      ceQuiLeDejoue:
        "L'analyse du portefeuille dit qu'un directeur commercial sollicité part presque une fois sur deux, avec 330 k€ de clients et les 220 k€ de synergies de revenus : 0,45 × 550 = 247,5 k€ de perte attendue, contre 0,1 × 550 + 0,9 × 100 = 145 k€ avec la prime de fidélisation. Sous le hasard n° 23, il part : 450 k€ de moins que l'accord.",
    },
  ],
  debrief: [
    "Le banquier parlait de « six fois l'EBE » et de 8,5 M€ ; votre calcul donne 7,15 M€ de valeur autonome et 7,7 M€ de plafond. Qu'y a-t-il dans chacun de ces chiffres ? Pourquoi les 660 k€ de synergies de revenus ne doivent-ils pas entrer dans le prix offert au vendeur ?",
    "Semaine 2 : l'audit complet coûtait 85 k€, l'audit des comptes et des stocks 40 k€, la data room rien. Sous le hasard n° 23, l'audit des comptes et des stocks a fait 45 k€ de mieux que l'audit complet, et il bat l'audit complet sur 24 tirages sur 30. Pourquoi est-il pourtant moins bon, avec 77 k€ de moins en moyenne ? Faites retrouver ce qui se passe les 6 fois où Bâtisseurs du Grésivaudan ne renouvelle pas : l'audit ciblé ne voit pas le départ, l'offre ferme ne s'en révise pas, et Arvel paie 7,2 M€ ou plus une cible qui vaut 1,1 M€ de moins, soit entre 447 et 650 k€ de perte par rapport à l'audit complet. Ceux qui l'ont choisi ont-ils bien décidé, ou ont-ils eu de la chance ?",
    "Semaine 5 : l'audit avait trouvé 550 k€ de stock dormant. Qui a révisé son offre, qui l'a confirmée, qui l'a baissée de 10 % ? Quelle différence faites-vous entre réviser une offre de ce que l'audit a découvert et un retrade ? Sous le hasard n° 23, la baisse forfaitaire n'a pas fait rompre la cédante, mais Sérac a surenchéri à 6,64 M€ et Arvel a payé 6,69 M€, 40 k€ de plus qu'en révisant : la rupture était-elle pour autant exclue ?",
    "Dernier tour : sous le hasard n° 23, l'offre révisée à 6,65 M€ fait retirer Sérac, qui ne serait pas allé au-delà de 6,64 M€, et la cédante demande un geste de 250 k€. Qui l'a payé pour « ne pas laisser Mourgue à Sérac » ? Qui porte la malédiction du vainqueur dans une enchère ? Que coûtait vraiment la perte de la cible, et que coûte chaque euro payé au-dessus du plafond ? À quoi sert un complément de prix versé seulement si l'EBE tient ?",
    "Sous le hasard n° 23, le contrôle URSSAF finit en redressement de 400 k€ : le séquestre en rend 380 k€, ceux qui avaient renoncé à toute garantie contre 50 k€ font 300 k€ de moins que ceux qui l'ont exigé, et la garantie de la cédante, sans séquestre, n'a rien rendu. Pourtant, la renonciation bat le séquestre 17 fois sur 30, de 80 à 150 k€, et ne coûte que 34 k€ en moyenne : pourquoi le bilan ne la compte-t-il pas parmi les bonnes décisions ?",
    "La meilleure méthode crée 187 k€ en moyenne sur les 30 tirages, entre −305 k€ et +596 k€, et n'atteint l'objectif du comité que 17 fois sur 30 ; le réflexe « gagner la cible » détruit 1 079 k€ en moyenne, et l'attentisme 228 k€. Un directeur du développement dont le dossier a fait −300 k€ a-t-il mal décidé ? Sur quoi un comité de direction devrait-il le juger ?",
  ],
  prolongement: {
    enonce:
      "Altimec, société de maintenance industrielle, étudie le rachat d'Hydrolec, un concurrent régional. L'EBE publié d'Hydrolec est de 900 k€. Il comprend 120 k€ de marge sur un contrat exceptionnel qui ne se renouvellera pas ; le dirigeant se verse 40 k€ quand un remplaçant coûterait 110 k€ chargés ; une indemnité de licenciement de 40 k€, non récurrente, a été passée en charges. Les transactions comparables se font à 6 fois l'EBE retraité, en valeur d'entreprise ; la dette nette d'Hydrolec est de 800 k€. Altimec chiffre 100 k€ par an de synergies de coûts, qu'elle a tenues à 80 % sur ses rachats passés, et 80 k€ par an de synergies de revenus, tenues au quart. L'intégration coûtera 250 k€, la transaction 50 k€. 1) Calculez l'EBE retraité, la valeur d'entreprise autonome et le prix plafond, en valeur d'entreprise puis en prix des titres. 2) Un concurrent offre 4,9 M€ ; le banquier demande 5 M€ pour signer. Si le concurrent l'emporte, Altimec perdra 150 k€ de valeur. Que recommandez-vous ? 3) Un audit des contrats clients coûte 30 k€ ; une cible sur quatre de ce type perd un client qui pèse 60 k€ d'EBE par an. Que vaut cet audit, et à quelle condition ?",
    corrige:
      "1) EBE retraité = 900 − 120 − 70 + 40 = 750 k€ ; valeur d'entreprise autonome = 6 × 750 = 4 500 k€. Synergies de coûts : 6 × 100 × 0,8 = 480 k€. Prix plafond = 4 500 + 480 − 250 − 50 = 4 680 k€ en valeur d'entreprise, soit 4 680 − 800 = 3 880 k€ pour les titres. Les synergies de revenus (6 × 80 × 0,25 = 120 k€) restent hors du plafond. 2) À 5 M€, Altimec paie 320 k€ au-dessus du plafond ; même en comptant les synergies de revenus, le rachat vaut 4 680 + 120 − 5 000 = −200 k€, plus mauvais que la perte de 150 k€ si le concurrent l'emporte. On laisse la cible, ou l'on reste à 4 680 k€ en prix ferme et l'on propose le reste en complément de prix versé seulement si l'EBE tient : on attend que l'élève dise qu'on ne dépasse pas le plafond en prix ferme pour « ne pas perdre ». 3) Le client perdu vaut 6 × 60 = 360 k€ ; en espérance, 0,25 × 360 = 90 k€ que l'audit permet de ne pas payer, pour 30 k€ : il rapporte 60 k€ en espérance, à condition de réviser l'offre de 360 k€ s'il trouve le départ du client. Sans révision, l'audit n'est qu'une dépense.",
  },
  evaluation: [
    "La valeur autonome est posée sur un EBE retraité poste par poste, chaque retraitement justifié par son caractère non récurrent ou manquant, et l'élève distingue valeur d'entreprise et prix des titres.",
    "Le prix plafond est écrit avant la négociation, avec les synergies de coûts à leur taux de réalisation et les synergies de revenus laissées hors du prix.",
    "Le choix de l'audit est justifié par ce qu'il peut trouver, chiffré en espérance, et l'offre ferme est révisée de ce que l'audit a trouvé, sans retrade sur ce que les comptes montraient.",
    "Face à la surenchère, l'élève compare explicitement le coût de la perte de la cible à celui du dépassement du plafond, et sait proposer un complément de prix ou une garantie adossée à un séquestre.",
    "L'élève distingue, sur le bilan des 30 tirages, la qualité d'une décision de son résultat sous le hasard de la classe.",
  ],
  vigilance:
    "L'épisode juge le dossier sur une valeur estimée au multiple en semaine 13, aléas comptés à leur espérance aux probabilités que donnent les sources : les synergies et les coûts d'intégration sont valorisés au multiple de l'EBE, sans actualisation ni délai de montée en charge ni impôt, et la perte si Sérac l'emporte est un forfait de 220 k€. Un enseignant de stratégie voudra rappeler qu'un rachat se juge sur plusieurs années, que les probabilités d'un dossier réel ne sont jamais annoncées, et qu'une évaluation par les flux actualisés compléterait celle par les multiples.",
};
