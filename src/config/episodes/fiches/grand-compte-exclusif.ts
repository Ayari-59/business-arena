import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 48, LE GRAND COMPTE QUI VEUT L'EXCLUSIVITÉ.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/grand-compte-exclusif.ts) ; ceux
 * du hasard de la classe sont ceux de la graine 12.
 */
export const FICHE: FicheEnseignant = {
  code: "grand-compte-exclusif",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Un grand compte apporte du volume, mais il crée une dépendance qui a un prix : les clients qu'on cesse de servir, les actifs spécifiques qu'on engage pour lui et qui ne valent rien ailleurs, et surtout le pouvoir de négociation qu'il gagne une fois que le fournisseur ne peut plus se passer de lui. L'erreur classique est de juger le contrat sur son chiffre d'affaires et sa marge de la première année, puis, une fois le risque aperçu, de le refuser par principe : on oublie dans le premier cas que la concentration se paie à la renégociation, dans le second que décliner donne le volume au concurrent. La réponse des manuels est contractuelle : une exclusivité limitée dans le temps, une indexation des prix, un volume minimal garanti, la reprise des actifs dédiés bornent la dépendance sans renoncer au volume, et l'engagement se révise au premier signal. Le mécanisme se rattache au pouvoir de négociation des clients des cinq forces de Porter et, pour les actifs spécifiques et le risque d'être pris en otage à la renégociation, à l'économie des coûts de transaction de Williamson. L'épisode le fait vivre en six décisions : un contrat de 5 M€ par an, près d'un quart de la région, qui ne laisse que 145 k€ de contribution annuelle une fois ses coûts cachés déduits, une extension où une analyse à 6 k€ change la réponse, un chantier suspendu qui doit faire réviser l'engagement, et une revue des prix où le client fait payer la dépendance.",
  objectifs: [
    "Je chiffre la contribution annuelle d'un grand contrat en déduisant de sa marge sur coût variable les coûts qui ne figurent pas dans l'offre : structure dédiée, crédit client, portage du stock, marge des clients exclus.",
    "J'explique d'où vient le pouvoir de négociation d'un client dont on dépend, et je l'évalue par ce que la rupture coûterait à chacune des parties.",
    "J'associe à chaque clause d'un contrat-cadre le risque qu'elle borne : exclusivité limitée, indexation, volume minimal, reprise des actifs dédiés.",
    "Je décide s'il vaut la peine de payer une information avant de m'engager, et je révise un engagement au vu d'un signal plutôt que de le confirmer.",
  ],
  prerequis:
    "La marge sur coût variable, le coût du crédit client (créances toutes taxes comprises, durée en jours sur 360) et du portage d'un stock, l'actualisation au taux de l'entreprise, et les cinq forces de Porter, au moins le pouvoir de négociation des clients.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/grand-compte-exclusif?hasard=12 : toute la classe joue le même trimestre, sous le même hasard. Les élèves jouent seuls ou en binôme, au niveau Standard, dans le rôle du directeur commercial grands comptes qui porte la réponse au comité de direction. Vous demandez de noter, à chaque décision, le chiffre qui l'a emportée, et rien de plus.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, la contribution annuelle saisie en semaine 1, la réponse à Sarlève (tel quel, clauses, sans exclusivité, décliner) et la réponse à l'extension. Ceux qui finissent tôt rejouent avec les mêmes décisions sous un autre hasard et notent l'écart.",
    },
    {
      minutes: 15,
      titre: "Correction de la contribution annuelle",
      detail:
        "Vous affichez les estimations de la classe, puis vous posez le calcul ligne par ligne à partir des deux sources décisives de la semaine 1 : 400 k€ de marge sur coût variable, il en reste 145 k€. Vous faites retrouver d'où viennent les estimations fausses, en commençant par les 400 k€ de la projection commerciale et les 233 k€ de ceux qui ont oublié Moulinier et Batival. Vous rapportez enfin les 145 k€ aux 5 M€ de chiffre d'affaires : moins de 3 %, pour près d'un quart de la région.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous partez de la réponse de la semaine 1 : vous faites défendre « tel quel » et « décliner » par un binôme qui les a choisies, puis vous montrez que les clauses répondent aux deux (la source sur Sarlève dit qu'il les a déjà signées en Savoie). Vous enchaînez sur l'extension, où la classe se partage souvent entre accepter, refuser et faire analyser, et sur le chantier suspendu : ce sont les deux décisions où l'information et la révision font la différence. Vous terminez par la revue des prix, qui montre ce que valent les clauses une fois la dépendance installée.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous prévenez la classe que le hasard pèse lourd ici : la valeur d'un contrat de trois ans dépend du carnet de commandes du client, de sa réponse, d'une analyse qui peut se tromper et d'une résiliation possible. Le hasard 12 est favorable (carnet solide, analyse favorable, campagne de conquête réussie, pas de résiliation) : la bonne méthode y fait 383 k€ pour 277 k€ en moyenne sur 30 tirages, et « prendre le volume » 186 k€ pour −17 k€ en moyenne. Vous faites lire, décision par décision, ce que chaque choix valait en moyenne plutôt que ce qu'il a rapporté sous ce hasard.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez les règles que l'épisode a fait éprouver : chiffrer ce que le volume coûte avant ce qu'il rapporte ; ni signer tel quel ni refuser, mais borner la dépendance par contrat ; payer une information quand elle peut changer la réponse ; réviser l'engagement au premier signal ; mesurer son pouvoir de négociation par ce que la rupture coûterait à chacun. Vous distribuez le cas de prolongement, à traiter en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 145,
    etapes: [
      "Marge sur coût variable du contrat (« Lire le projet de contrat-cadre, ligne par ligne ») : 5 000 k€ × 8 % = 400 k€ ; la cellule dédiée, charge fixe propre au contrat, en retire 150 k€.",
      "Remises de fin d'année des fabricants (« Demander à Rosalie Fontenay ce que le contrat coûterait à Arvel ») : +40 k€. Crédit client : trente jours de plus sur des créances toutes taxes comprises, 5 000 × 1,2 × 30 / 360 = 500 k€ de créances en plus, financés à 5 % : 25 k€.",
      "Portage du stock dédié : 400 k€ × 8 % = 32 k€ par an (financement, assurance, démarque).",
      "Marge perdue chez les clients que l'exclusivité oblige à cesser de livrer : 800 k€ × 11 % = 88 k€.",
      "Contribution annuelle = 400 − 150 + 40 − 25 − 32 − 88 = 145 k€. Elle ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode juge juste à 5 k€ près, proche à 15 k€.",
    ],
    erreurs: [
      {
        valeur: 233,
        cause:
          "La marge de Moulinier et Batival est oubliée (145 + 88) : le coût d'opportunité de l'exclusivité n'apparaît dans aucune ligne du contrat, il faut aller le chercher dans les chiffres de Rosalie Fontenay. L'épisode la juge fausse.",
      },
      {
        valeur: 170,
        cause:
          "Le crédit client est oublié (145 + 25) : le délai de paiement est lu comme une condition commerciale, pas comme un coût de financement. L'épisode la juge fausse.",
      },
      {
        valeur: 400,
        cause:
          "La marge sur coût variable est prise pour la contribution, comme dans la projection de l'équipe commerciale (1,2 M€ de marge sur trois ans, soit 400 k€ par an) : aucun des coûts propres au contrat n'est déduit.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "5 M€ par an pendant trois ans, un dépôt à moitié vide, des paliers de remise enfin franchis, et Lestrade prêt à signer à la place d'Arvel.",
      ceQuiLeDejoue:
        "Le contrat ne laisse que 145 k€ par an, ses volumes sont indicatifs et ses prix se révisent « d'un commun accord » ; la source sur Sarlève montre qu'il a déjà accepté une indexation et une exclusivité de deux ans en Savoie. Les décisions suivantes restant les meilleures, signer tel quel vaut 130 k€ en moyenne sur les 30 tirages, contre 277 k€ avec les clauses.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Un quart du chiffre d'affaires de la région sur un seul client, c'est un risque qu'aucun directeur ne devrait prendre.",
      ceQuiLeDejoue:
        "Décliner n'est pas neutre : Lestrade, renforcé, prend 30 k€ de marge par an aux agences, soit 30 × 2,5771 = 77,3 k€ sur trois ans au taux de 8 %. Sur les 30 tirages, décliner détruit 84 k€ en moyenne et ne crée jamais de valeur, alors que les clauses bornaient le risque.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le contrat demande 400 k€ de stock dédié, et le client doit être servi sans attente.",
      ceQuiLeDejoue:
        "Le planning ferme montre que la moitié du volume seulement est commandée : un stock de sécurité de 200 k€ coûte 4 k€ de commandes plus fréquentes et 3,5 k€ de pénalités en espérance (35 % × 10 k€), contre 16 k€ de portage de plus par an, sans compter la décote d'un stock spécifique qu'on ne revend à personne. Sur les 30 tirages, le stock complet coûte 25 k€ de plus en moyenne.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "L'exclusivité impose d'arrêter les livraisons, et une lettre ne coûte rien.",
      ceQuiLeDejoue:
        "« Regarder ce que sont devenus les clients perdus pour une exclusivité » : prévenu par lettre, un client met près d'un an à revenir ; reçu et attendu, il revient le mois où l'exclusivité finit. 88 k€ × (0,8 − 0,15) = 57,2 k€ de marge, actualisés en année 3 (45,4 k€), pour 6 k€ de gestes : sur les 30 tirages, la lettre coûte 39,5 k€ de plus en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Plus de volume, plus de remises, et le directeur régional assure qu'il remplira l'entrepôt de Bourgoin.",
      ceQuiLeDejoue:
        "« Chiffrer l'extension » donne +94 k€ si l'activité de la filiale tient, −48 k€ si elle se tasse, −98 k€ si elle se retourne, soit +13 k€ en espérance, avec un bail ferme qui court même si le contrat s'arrête ; Sarlève dépasserait alors 27 % de la région. N'accepter qu'après une analyse favorable vaut 0,5 × 0,85 × 93,7 − 0,3 × 0,25 × 47,7 − 0,2 × 0,05 × 98,0 − 6 = 29,3 k€.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Un chantier suspendu arrive tous les ans ; on a signé pour trois ans, et Sarlève doit voir qu'Arvel est solide.",
      ceQuiLeDejoue:
        "« Mesurer ce que le signal change » : si l'activité recule, le volume baisse mais pas la cellule (150 k€ par an) ni le stock dédié ; réviser coûte 10 k€ de réorganisation et 10 % de frais de retour sur le stock des Vergnes, et rien n'empêche de revenir à l'effectif complet si le carnet tient. Sur les 30 tirages, tenir le cap coûte 32 k€ de plus en moyenne.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "On ne peut pas perdre un quart de la région à trois mois de la clôture : un point de prix pour garder le contrat, c'est peu.",
      ceQuiLeDejoue:
        "Un point sur les années 2 et 3 vaut 83 k€ ; avec la clause d'indexation, la demande n'a pas de fondement, et Sarlève résilie une fois sur vingt face à un échange (0,4 point contre un volume ferme à 85 %). L'offre de Lestrade ne compte ni cellule ni camion-grue. Sur les 30 tirages, céder coûte 65 k€ de plus que l'échange en moyenne.",
    },
  ],
  debrief: [
    "Le contrat apporte 400 k€ de marge sur coût variable et la projection commerciale parle de 1,2 M€ : pourquoi n'en reste-t-il que 145 k€ par an ? Lequel des coûts déduits ne figure dans aucune ligne du contrat, et pourquoi est-ce celui qu'on oublie ?",
    "Ni signer tel quel, ni décliner : dites, pour chacune des quatre clauses de la contre-proposition, le risque qu'elle borne (clients exclus, revue des prix, baisse d'activité, actifs spécifiques). Pourquoi décliner n'est-il pas « ne rien risquer » ? Sous le hasard 12, Sarlève a accepté les clauses et serait parti chez Lestrade sans exclusivité : qu'est-ce que la source sur Sarlève permettait d'anticiper ?",
    "L'option qui trompe. « Accepter l'extension : plus de volume, plus de remises » bat « faire analyser le carnet » sur 19 tirages sur 30, pour 18 k€ de moins en moyenne ; sous le hasard 12, elle fait mieux de 6 k€, le prix de l'analyse, parce que le carnet était solide et l'analyse favorable. Ceux qui ont accepté sans analyse ont-ils bien décidé, ou ont-ils eu de la chance ? Montrez que l'analyse ne fait que coûter 6 k€ dans 17 tirages, évite une perte de 45 à 98 k€ dans 11 autres, et fait renoncer à tort à un groupe solide dans les 2 derniers.",
    "Que valait l'analyse à 6 k€ ? Une conclusion favorable porte la chance d'un carnet solide de 50 % à 83 %, une conclusion défavorable la ramène à 15 %. Comparez accepter (+13 k€ en espérance), refuser (0) et n'accepter qu'après une conclusion favorable (+29 k€) : à quelle condition une information vaut-elle son prix ?",
    "Le chantier suspendu et la note dégradée devaient-ils changer l'engagement ? Sous le hasard 12, le carnet a tenu et tenir le cap a fait 7 k€ de mieux que réviser ; sur les 30 tirages, il fait 32 k€ de moins en moyenne. Qu'est-ce qu'un signal change, une certitude ou des chances ? Pourquoi est-il moins coûteux de réviser une cellule dédiée qu'on peut regonfler que de la garder au complet ?",
    "À la revue des prix, la rupture coûterait à Arvel 374 k€ de valeur sur le chemin de la bonne méthode, sous le hasard 12. D'où vient ce pouvoir de Sarlève ? Avec l'indexation, l'échange est la meilleure réponse ; sans elle, accorder le point redevient le moins mauvais choix (150 k€ en moyenne contre 130 k€ pour l'échange et 30 k€ pour tenir les prix) : que dit cet écart de la dépendance ?",
    "Sous le hasard 12, le meilleur trimestre possible (475 k€) combine la campagne de conquête, l'extension sans analyse, le seul gel du stock et des prix tenus : quatre choix qui perdent en moyenne. « Prendre le volume » y fait 186 k€, presque l'objectif, pour −17 k€ en moyenne. Que conclure d'un directeur jugé sur ce trimestre ? Une décision stratégique se juge-t-elle à son résultat d'un trimestre ?",
  ],
  prolongement: {
    enonce:
      "Fabrimeca, sous-traitant en usinage, se voit proposer par un équipementier automobile un contrat de trois ans : 2 M€ de chiffre d'affaires par an à 10 % de taux de marge sur coût variable. Le contrat exige une ligne dédiée, louée en bail ferme de trois ans pour 80 k€ par an, et un outillage spécifique de 90 k€ payé au départ, sans usage hors du contrat (amorti sur trois ans). Le client paie à 90 jours au lieu de 60 (TVA à 20 %, crédit court terme à 4 %, année de 360 jours). L'exclusivité oblige à cesser de livrer un concurrent du donneur d'ordre : 400 k€ de chiffre d'affaires à 12 %, qui mettrait un an à revenir si le contrat s'arrêtait. Les prix se révisent chaque année « d'un commun accord », à défaut de quoi chacun peut résilier. 1) Calculez la contribution annuelle du contrat. 2) À la fin de la première année, le client demande une baisse de prix et menace de partir. Sur les années 2 et 3, sans actualisation, jusqu'à quelle baisse annuelle Fabrimeca a-t-elle intérêt à céder plutôt que de le voir résilier ? 3) Quelles clauses auraient réduit ce pouvoir de négociation dès la signature ?",
    corrige:
      "1) Marge sur coût variable 2 000 × 10 % = 200 k€ ; ligne dédiée −80 k€ ; amortissement de l'outillage −30 k€ ; crédit client 2 000 × 1,2 × 30 / 360 × 4 % = −8 k€ ; marge du client exclu 400 × 12 % = −48 k€ : 34 k€ par an. 2) L'outillage est payé : il n'entre plus dans la comparaison, et le bail court dans les deux cas. Garder le contrat avec une baisse x rapporte, chaque année, 200 − x − 8 − 80 − 48 = 64 − x ; le perdre coûte le bail des deux années et la marge du client exclu la première, soit −80 − 48 − 80 = −208 k€. Fabrimeca cède tant que 2 × (64 − x) ≥ −208, soit x ≤ 168 k€ par an, 8,4 points de prix, quand le contrat ne lui laissait que 34 k€ par an à la signature. On attend l'idée que le pouvoir du client se mesure à ce que la rupture coûterait au fournisseur, et que tout ce qui est engagé et irrécupérable l'augmente. 3) L'outillage payé ou repris par le client ; une indemnité de résiliation couvrant les loyers restants (le seuil tombe alors à 88 k€ par an, 4,4 points) ; une révision des prix indexée sur un indice plutôt que « d'un commun accord » ; une exclusivité plus courte que le contrat et un retour préparé du client exclu ; un volume minimal garanti.",
  },
  evaluation: [
    "La contribution annuelle est posée ligne par ligne : crédit client sur les seuls jours en plus et sur des créances toutes taxes comprises, portage du stock, marge des clients exclus comptée comme un coût d'opportunité.",
    "La réponse à Sarlève est justifiée par ce que chaque clause borne, et le refus par principe est écarté pour ce qu'il coûte, pas seulement pour ce qu'il évite.",
    "La décision sur l'extension s'appuie sur une espérance chiffrée et sur ce que l'analyse peut changer à la réponse, pas sur le volume ni sur le résultat obtenu.",
    "Le signal de la semaine 7 conduit à réviser l'engagement, et l'élève explique pourquoi la revue des prix se négocie différemment avec et sans clause d'indexation.",
    "L'élève distingue, sur le bilan des 30 tirages, la qualité d'une décision de son résultat sous le hasard de la classe.",
  ],
  vigilance:
    "Les sources donnent des probabilités chiffrées (le carnet de Sarlève, la fiabilité de l'analyse, les chances de résiliation) qu'aucun directeur n'a sous cette forme : un enseignant de stratégie voudra discuter d'où elles viendraient. La valeur est en outre bornée aux trois ans du contrat, au taux de 8 % sans prime de risque, et ignore ce que la relation vaudrait au-delà (renouvellement, référence, position face à Lestrade).",
};
