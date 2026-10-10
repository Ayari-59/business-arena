import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 38, LA CROISSANCE À FINANCER.
 *
 * Le corrigé de la semaine 1 est le BFR normatif du marché Altaïr, 560 k€,
 * que l'épisode tient pour constant quel que soit le hasard.
 */
export const FICHE: FicheEnseignant = {
  code: "croissance-a-financer",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 6, Analyse de la situation financière",
    "DCG · UE 6, Finance d'entreprise",
    "BUT GEA · Finance d'entreprise",
  ],
  notion:
    "La croissance consomme de la trésorerie : un marché qui paie tard fait monter le besoin en fonds de roulement avant de faire entrer le premier euro, et ce besoin, exprimé en jours de chiffre d'affaires, grandit avec l'activité. Comme la trésorerie nette est toujours égale au fonds de roulement net global moins le BFR, une entreprise rentable peut voir son résultat monter pendant que sa trésorerie s'effondre : c'est l'effet de ciseaux. L'erreur classique consiste à juger un marché sur sa marge, puis à financer par le découvert un besoin qui ne disparaîtra pas tant que le marché tourne. L'épisode met l'élève dans la position du directeur financier d'une filiale qui vient de signer un marché rentable payé à 77 jours : 560 k€ de BFR à financer pour 300 k€ d'autorisation de découvert, déjà utilisée à hauteur de 100 k€. Le piège est de tout prendre au découvert, ou à l'inverse de tout refuser par peur ; la bonne conduite chiffre le besoin, finance le structurel par des ressources stables et le conjoncturel par le découvert, et dose le rythme de la croissance à ce qu'elle peut financer.",
  objectifs: [
    "Je calcule le BFR d'un marché en jours de chiffre d'affaires hors taxes, en pondérant le stock et le crédit fournisseur par leur part dans le prix de vente, puis je le convertis en euros.",
    "J'explique l'effet de ciseaux par la relation trésorerie nette = FRNG − BFR.",
    "Je distingue un besoin de financement structurel d'un besoin conjoncturel, et j'associe à chacun le financement qui lui convient.",
    "Je dose une croissance nouvelle au financement dont je dispose avant de l'accepter.",
  ],
  prerequis:
    "Le bilan fonctionnel (FRNG, BFR, trésorerie nette), les délais de règlement clients et fournisseurs, et les principaux financements à court et à moyen terme doivent avoir été vus en cours.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/croissance-a-financer?hasard=28 : toute la classe joue le même trimestre. Les élèves jouent seuls ou en binôme, au niveau Standard. Demandez-leur de noter sur papier, au fil du jeu, leur diagnostic, leur estimation du BFR et l'option retenue à chaque décision : le débrief s'appuie sur ces notes.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Vous circulez sans donner d'indice. Repérez ceux qui décident en semaine 1 sans avoir ouvert les conditions du marché ni le BFR normatif : ce sont eux que le calcul au tableau doit convaincre. Relevez à main levée, au fil de la séance, la répartition des choix aux décisions 4 (Clairval) et 5 (Valcourt), où la classe se partage le plus souvent.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau toutes les estimations du BFR, sans commentaire, puis vous reconstruisez le calcul en jours de chiffre d'affaires : délai client, stock, crédit fournisseur. Faites retrouver à la classe d'où viennent 840 k€, 490 k€ et 350 k€. Terminez en rapprochant 560 k€ des 300 k€ d'autorisation, déjà entamée de 100 k€ : le besoin ne tient pas dans le découvert, et la banque en finance 70 % sur dossier, soit le prêt de 400 k€.",
    },
    {
      minutes: 25,
      titre: "Débrief : la décision qui a partagé la classe",
      detail:
        "Partez de la décision où les mains se sont le plus partagées, le plus souvent celle de Valcourt. Faites argumenter les deux camps sur les sources de la semaine 9 avant de dire ce qui s'est passé. Sous l'aléa 28, Valcourt n'a pas toléré le dépassement : chantier arrêté en semaine 11, LCR rejetées en semaines 12 et 13, et ceux qui ont laissé faire finissent 30 k€ derrière la garantie de la holding. Faites-leur dire ce qu'ils auraient gagné s'il avait toléré : c'est cette asymétrie qu'il faut discuter.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Projetez le bilan d'un volontaire et lisez la comparaison aux trois manières de décider. Sur 30 tirages, la méthode qui chiffre et finance selon la nature du besoin finit en moyenne autour de 35 k€ au-dessus du budget, quand « tout au découvert » et l'attentisme finissent autour de 82 k€ et 91 k€ en dessous. Faites distinguer, décision par décision, le résultat obtenu sous l'aléa 28 et la qualité du choix.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau trésorerie nette = FRNG − BFR, et les chiffres du meilleur chemin sous l'aléa 28 : de la semaine 1 à la semaine 13, le résultat cumulé atteint 219 k€ et le FRNG passe de 170 k€ à 728 k€, mais le BFR passe de 268 k€ à 1 009 k€ et la trésorerie nette de −98 k€ à −281 k€. Vous concluez par la règle : un besoin structurel se finance par des ressources stables, un besoin conjoncturel par le court terme, et une croissance se prend à la mesure de ce qu'on peut financer.",
    },
  ],
  calcul: {
    reponse: 560,
    etapes: [
      "« Relire les conditions financières du marché Altaïr » : 3,65 M€ HT par an, soit 3 650 000 / 365 = 10 k€ de chiffre d'affaires par jour ; entre les travaux et l'encaissement, 15 jours en moyenne avant la situation, 2 jours de visa et 60 jours de délai : 77 jours de crédit client.",
      "« Demander à Maëva le BFR normatif d'un chantier de bailleur » : les menuiseries font 50 % du prix de vente et arrivent 14 jours avant la pose, soit 14 × 50 % = 7 jours de chiffre d'affaires de stock.",
      "Même source : Valcourt est payé 56 jours après la livraison, soit 56 × 50 % = 28 jours de chiffre d'affaires de crédit fournisseur ; les poseurs, payés chaque semaine, ne créent pas de ressource notable.",
      "BFR normatif du marché : 77 + 7 − 28 = 56 jours de chiffre d'affaires hors taxes.",
      "En euros : 56 × 10 k€ = 560 k€. Ce besoin est structurel : chaque situation encaissée est remplacée par une autre, il demeure tant que le marché tourne. L'épisode le tient pour fixe, quels que soient les aléas.",
    ],
    erreurs: [
      {
        valeur: 840,
        cause:
          "Le crédit fournisseur est oublié : (77 + 7) × 10 k€. L'élève ne voit que ce que le marché immobilise, pas ce que Valcourt finance.",
      },
      {
        valeur: 490,
        cause:
          "Le stock de menuiseries livrées deux semaines avant la pose est oublié : (77 − 28) × 10 k€. L'erreur est proche, mais elle ignore un poste du cycle d'exploitation.",
      },
      {
        valeur: 350,
        cause:
          "Les jours de stock et de crédit fournisseur ne sont pas pondérés par la part des menuiseries dans le prix : (77 + 14 − 56) × 10 k€. Des jours d'achats sont additionnés à des jours de ventes.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le marché est rentable, il ne coûte rien de démarrer : la trésorerie suivra la marge.",
      ceQuiLeDejoue:
        "La marge est de 14 k€ par semaine, le BFR de 560 k€. La prévision à treize semaines le dit dès la semaine 1 : le besoin dépasse l'autorisation dès la semaine 5 et atteint 941 k€ en semaine 13, pour 300 k€ d'autorisation et 100 k€ de tolérance.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi: "Décaler le démarrage donne du temps pour voir venir, sans rien engager.",
      ceQuiLeDejoue:
        "Deux semaines de décalage ne changent rien au BFR en régime, qui reste de 560 k€ et arrive simplement plus tard : le besoin est structurel, pas un à-coup. Elles coûtent en revanche deux semaines de marge, 2 × 14 k€ = 28 k€.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le dividende est au budget, la holding l'attend, et il n'appartient pas à la filiale de le discuter.",
      ceQuiLeDejoue:
        "Verser 250 k€ ampute d'autant le FRNG au moment où le BFR monte. La convention de trésorerie permet de le laisser en compte courant bloqué deux ans, qui compte parmi les ressources stables, pour environ 2,4 k€ d'intérêts sur le reste du trimestre ; sous l'aléa 28, prêt accordé, la prévision fait passer le pic de 462 k€ à 211 k€ pour 300 k€ d'autorisation.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Les concurrents affichent 10 % d'acompte, et Rayan signe 34 k€ par semaine au lieu de 30 k€.",
      ceQuiLeDejoue:
        "Avec 19 % de désistements et 4 % de soldes impayés, 1 000 € commandés ne rapportent plus que 186 € au lieu de 349 € à 30 % d'acompte : sur quatre semaines, 25,4 k€ contre 41,9 k€. Et l'acompte de 30 %, encaissé un mois avant tout décaissement, est la ressource qui finançait la campagne.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "La trésorerie est déjà tendue : ce n'est pas le moment d'engager 8 000 € de stand.",
      ceQuiLeDejoue:
        "Avec 30 % d'acompte, la campagne se finance elle-même : 9 k€ encaissés par semaine de commandes, un mois avant de payer les menuiseries. Renoncer, c'est perdre environ 41,9 k€ de contribution pour économiser 8 k€.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi: "Le lot est rentable, et Clairval ne reviendra pas si l'on refuse la moitié.",
      ceQuiLeDejoue:
        "Le lot complet ajoute à terme 56 jours × 80 k€ / 7 = 640 k€ de BFR, un gage-espèces de 104 k€ qui ampute le FRNG et deux semaines de rodage à 60 %. Sous l'aléa 28, sur le meilleur chemin, la simulation donne un pic de 356 k€ avec les quatre bâtiments, 274 k€ avec deux, pour 300 k€ d'autorisation.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Altaïr suffit pour cette année : un second marché, c'est un second trou de trésorerie.",
      ceQuiLeDejoue:
        "Une fois le prêt et le compte courant en place, la moitié du lot tient sous l'autorisation (274 k€ de pic sous l'aléa 28) et rapporte 7,2 k€ − 1,5 k€ = 5,7 k€ par semaine. Sans prêt, en revanche, refuser devient le bon choix : la prudence se juge au financement en place.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi: "Valcourt ne lâchera pas un client qui lui commande 35 k€ par semaine.",
      ceQuiLeDejoue:
        "Le plafond vient de l'assureur-crédit de Valcourt, pas de son service commercial, et la clause de réserve de propriété lui permet de reprendre les menuiseries : chantier arrêté, 6 000 € de pénalités Altaïr par semaine. La source sur l'encours le chiffre à 400 k€ d'ici la semaine 13, soit 150 k€ à payer à la livraison, quand la garantie de la holding coûte 900 € et conserve les 56 jours.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "Reporter les LCR libère 70 k€ au moment du pic pour 600 € seulement.",
      ceQuiLeDejoue:
        "Les primes sont un à-coup de deux semaines : sous l'aléa 28, sur le meilleur chemin, la prévision donne un pic de 302 k€ en semaine 12, 2 k€ au-delà des 300 k€ d'autorisation et loin de la tolérance de 100 k€ ; le découvert réel plafonne à 299 k€, il suffit. Demander un report au fournisseur dont l'assureur vient de plafonner l'encours, c'est l'alerter : une fois sur deux, il suspend ses livraisons.",
    },
  ],
  debrief: [
    "En semaine 1, le marché Altaïr manquait-il de rentabilité ou d'argent ? Qu'est-ce qui, dans les sources, permettait de trancher avant de décider ?",
    "Le besoin créé par Altaïr disparaît-il quand Altaïr paie sa première situation, en semaine 13 ? Pourquoi « un décalage de quelques mois » est-il un diagnostic proche mais pas juste ?",
    "Sous l'aléa 28, la banque a accordé le relèvement du découvert à ceux qui l'ont demandé, et ils finissent presque au niveau du prêt (38,4 k€ contre 38,5 k€ au-dessus du budget). Sur 30 tirages, le relèvement finit pourtant 33 k€ en moyenne derrière le prêt : pourquoi la banque le refuse-t-elle le plus souvent, et que vaut une bonne issue obtenue par chance ?",
    "Ceux qui ont continué à commander chez Valcourt « parce qu'il ne lâchera pas un client comme nous » finissent sous l'aléa 28 à 30 k€ de la garantie de la holding : Valcourt a arrêté le chantier. Sur 30 tirages, cette option bat pourtant la garantie 13 fois, et rapporte 15 k€ de moins en moyenne : que gagne-t-on dans les 13 tirages favorables, que perd-on dans les 17 autres, et qu'est-ce que cette asymétrie dit de la décision ?",
    "Pourquoi prendre la moitié du lot Clairval valait mieux que tout prendre, et pourquoi, sans prêt en semaine 1, le refuser devenait la meilleure réponse ?",
    "Le découvert était le mauvais outil en semaine 1 et le bon en semaine 11 : qu'est-ce qui a changé entre les deux besoins ?",
    "Comparez votre résultat sous l'aléa 28 à ce que vos décisions donnent en moyenne sur 30 tirages : avez-vous bien décidé, ou avez-vous eu de la chance ?",
  ],
  prolongement: {
    enonce:
      "Une entreprise de pose de cuisines signe avec un promoteur un marché de 2 920 000 € HT par an, réalisé régulièrement. Les situations mensuelles (15 jours en moyenne après les travaux) sont payées 45 jours après leur émission. Les matériaux représentent 40 % du prix de vente ; ils sont livrés 20 jours avant la pose et payés 45 jours après leur livraison. Avant le marché, le FRNG est de 250 k€, le BFR de 180 k€, et l'autorisation de découvert de 150 k€. 1) Calculez le BFR du marché en jours de chiffre d'affaires HT, puis en euros. 2) Calculez la trésorerie nette avant le marché, puis en régime. 3) La banque finance 70 % du besoin chiffré par un prêt à moyen terme : quelle est la trésorerie nette après le prêt, et tient-elle dans l'autorisation ? 4) En fin d'année, un versement exceptionnel de 90 k€ creuse la trésorerie pendant trois semaines : comment le financer ? Justifiez.",
    corrige:
      "1) Chiffre d'affaires par jour : 2 920 000 / 365 = 8 000 €. Crédit client : 15 + 45 = 60 jours ; stock : 20 × 40 % = 8 jours ; crédit fournisseur : 45 × 40 % = 18 jours. BFR = 60 + 8 − 18 = 50 jours de chiffre d'affaires HT, soit 50 × 8 000 = 400 000 €. 2) Avant : 250 − 180 = +70 k€. En régime, le BFR passe à 180 + 400 = 580 k€ et la trésorerie nette à 250 − 580 = −330 k€, 180 k€ au-delà de l'autorisation : le besoin est structurel. 3) Prêt : 70 % × 400 = 280 k€ ; FRNG = 250 + 280 = 530 k€ ; trésorerie nette = 530 − 580 = −50 k€, dans l'autorisation de 150 k€. 4) Le versement est un besoin conjoncturel de trois semaines : la trésorerie nette descend à −50 − 90 = −140 k€, encore dans l'autorisation ; le découvert est le bon outil, un prêt serait trop lent et trop cher. La marge restante, 10 k€, est mince : un plan de trésorerie hebdomadaire s'impose sur ces trois semaines.",
  },
  evaluation: [
    "Le BFR du marché est calculé en jours de chiffre d'affaires hors taxes, stock et crédit fournisseur pondérés par la part des achats dans le prix, puis converti en euros.",
    "La nature du besoin, structurel ou conjoncturel, est justifiée par sa durée et sa cause, pas par son montant.",
    "Chaque financement retenu est relié à la nature du besoin et à son effet sur le FRNG ou sur la trésorerie nette.",
    "Les décisions sont justifiées par les sources consultées et par les chiffres, pas par le résultat obtenu sous l'aléa 28.",
    "L'élève distingue, sur le bilan des 30 tirages, la qualité d'une décision de son issue.",
  ],
  vigilance:
    "L'épisode raisonne hors taxes : le BFR normatif y est calculé sans TVA, alors que le programme compte d'ordinaire créances clients et dettes fournisseurs toutes taxes comprises, avec leurs coefficients de structure. Le calcul reste juste dans sa convention, mais il mérite d'être signalé aux élèves qui ont appris la méthode TTC.",
};
