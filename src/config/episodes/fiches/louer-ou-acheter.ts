/**
 * FICHE ENSEIGNANT · ÉPISODE 39, LOUER OU ACHETER.
 *
 * Arvel Location renouvelle et agrandit son parc avant la saison : achat à
 * crédit, crédit-bail, location longue durée ou location à la journée chez
 * un partenaire. La séance porte sur le coût total à durée égale et sur la
 * valeur de la souplesse face à une demande incertaine.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "louer-ou-acheter",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "BTS CG · Processus 6, Analyse de la situation financière",
    "BUT GEA · Finance d'entreprise",
  ],
  notion:
    "Une machine ne coûte pas une mensualité mais un coût total sur une durée donnée : prix d'acquisition moins valeur de revente, plus intérêts et entretien pour un achat à crédit ; loyers sans rien à revendre pour une location longue durée ; une journée payée chaque fois qu'on s'en sert pour une location courte. Les deux premières formules sont des coûts fixes, la troisième un coût variable : posséder ne se justifie qu'au-delà d'un taux d'utilisation, environ huit jours par mois dans l'épisode. L'erreur classique compare la mensualité d'emprunt au loyer de location longue durée, ou choisit la formule « qui ne sort pas de trésorerie », sans ramener les options à la même durée ni au même périmètre. L'épisode y ajoute l'incertitude : une saison qui peut se retourner, un chantier sous réserve, et des machines achetées qui ne se rendent pas, alors qu'une location à la journée se rend. Le bon raisonnement possède le socle sûr de la demande et loue la pointe ; il ne tient pas non plus pour gratuite une machine amortie qui tombe en panne.",
  objectifs: [
    "Je calcule le coût total sur trois ans d'une machine achetée à crédit : prix, moins valeur de revente, plus intérêts, plus entretien.",
    "Je compare achat à crédit, crédit-bail et location longue durée sur la même durée et le même périmètre, sans comparer des mensualités.",
    "Je calcule le nombre de jours d'utilisation par mois au-delà duquel posséder une machine coûte moins que la louer à la journée.",
    "Je réserve les coûts fixes à la demande sûre et je chiffre ce que coûte, dans le mauvais cas, un engagement pris sur une demande incertaine.",
  ],
  prerequis:
    "Le cours sur les modes de financement d'un investissement (emprunt à mensualités constantes, crédit-bail, location), sur l'amortissement et la distinction entre charges fixes et charges variables doit avoir été fait.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/louer-ou-acheter?hasard=12 : toute la classe joue le même trimestre, sous le même hasard. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier le calcul déposé en semaine 1 et la raison de chaque décision, en une ligne.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions. Vous circulez sans donner de chiffre ; à qui hésite en semaine 1, vous demandez seulement combien de jours par mois chaque machine tournera. Vous relevez, à main levée ou au tableau, les choix de la classe aux décisions 1, 3 et 6.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous recueillez les estimations du coût total d'une mini-pelle achetée à crédit et vous les classez au tableau : elles se regroupent autour de 33,6, 30,2, 48,4 et 55,6 k€. Vous refaites le calcul terme à terme à partir de l'offre de Valtrac et de la banque, puis vous le ramenez au mois (934 €) pour le comparer au loyer de location longue durée (1 290 €) et à la journée du partenaire (115 €) : le seuil de huit jours par mois en sort.",
    },
    {
      minutes: 20,
      titre: "La décision qui a partagé la classe",
      detail:
        "Vous partez de la décision où la classe s'est le plus partagée, souvent le chantier de Ganivet ou la réponse à Sorlin. Chaque camp donne son argument, puis vous faites chiffrer ce que chaque option coûte dans le bon cas et dans le mauvais cas. Vous traitez ensuite la contre-proposition à 157 € (question 4 du débrief).",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer : sous le hasard 12, la saison tient et Ganivet mène sa phase 2, si bien que des décisions risquées n'ont pas été punies. Vous comparez ce résultat à la moyenne sur trente tirages et vous rappelez que le résultat de l'épisode est bruité : le retournement de saison, une fois sur trois environ, déplace à lui seul des dizaines de milliers d'euros. On juge une décision sur sa moyenne et sur son mauvais cas, pas sur un trimestre.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous faites formuler la règle par la classe : comparer des coûts totaux à durée égale, rapporter le coût fixe aux jours d'utilisation, posséder le socle sûr et louer la pointe. Vous ajoutez les deux corollaires de l'épisode : le crédit-bail est un financement dont le taux se compare à celui de l'emprunt, et une machine amortie se juge sur ses coûts à venir. Vous distribuez l'exercice de prolongement.",
    },
  ],
  calcul: {
    reponse: 33.61,
    etapes: [
      "Source « Lire les offres de Valtrac et de la banque, ligne à ligne » : mini-pelle à 45 000 € HT, financée à 100 % sur 36 mois à 4,8 %, mensualité de 1 345 € ; entretien de 2 400 € par an ; cote de revente à trois ans de 22 000 €.",
      "Consommation de valeur sur trois ans : 45 000 − 22 000 = 23 000 €, la différence entre le prix d'acquisition et la valeur de revente.",
      "Coût du financement : 36 × 1 345 = 48 420 € remboursés, soit 48 420 − 45 000 = 3 420 € d'intérêts ; avec la mensualité exacte (1 344,65 €), 3 408 €.",
      "Entretien sur la durée : 3 × 2 400 = 7 200 €.",
      "Coût total : 23 000 + 3 408 + 7 200 = 33 608 €, soit 33,6 k€ (33,62 k€ avec la mensualité arrondie, sans incidence). Le calcul ne dépend pas du hasard : la valeur est la même sous toutes les graines.",
      "Ramené au mois : 33 608 / 36 = 934 €, contre 1 290 € de loyer en location longue durée (46 440 € sur trois ans) ; au tarif du partenaire de 115 € la journée, posséder coûte moins dès 934 / 115 = 8,1 jours de location par mois.",
    ],
    erreurs: [
      {
        valeur: 30.2,
        cause:
          "Les intérêts oubliés : 23 000 + 7 200 = 30 200 €. L'élève raisonne comme si la machine était payée comptant ; l'épisode juge ce calcul proche.",
      },
      {
        valeur: 55.6,
        cause:
          "La valeur de revente oubliée : 45 000 + 3 408 + 7 200 = 55 608 €. C'est aussi ce que donnent 36 mensualités plus l'entretien (48 420 + 7 200) : l'élève additionne des décaissements au lieu d'un coût, et oublie que la machine se revend 22 000 €.",
      },
      {
        valeur: 26.4,
        cause:
          "L'entretien oublié : 23 000 + 3 408 = 26 408 €. L'élève compare implicitement à la location longue durée, qui inclut l'entretien, sans l'ajouter du côté de l'achat.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "La mensualité de 1 345 € dépasse à peine le loyer, et au bout de trois ans les six machines appartiennent à l'entreprise.",
      ceQuiLeDejoue:
        "Le planning de l'an dernier donne 7 jours par mois en moyenne à une cinquième machine et 3 jours à une sixième, sous le seuil de 8,1 jours : ces deux machines coûtent plus possédées que louées à 115 € la journée. Sur trente tirages, l'option rapporte 8 k€ de moins que quatre achats et la pointe chez Sillon, et 17,5 k€ de moins quand la saison se retourne.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Aucun apport, l'entretien compris, rien qui sorte de la trésorerie : la location longue durée paraît la formule prudente.",
      ceQuiLeDejoue:
        "La banque finance l'achat à 100 % : la trésorerie n'est pas l'enjeu. Sur trois ans, la location longue durée coûte 36 × 1 290 = 46 440 € contre 33 608 € pour l'achat, soit 12,8 k€ de plus par machine, et elle porte aussi sur six machines dont deux tournent sous le seuil.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Louer au partenaire n'engage à rien et ne fait rien sortir de la trésorerie à l'avance.",
      ceQuiLeDejoue:
        "La demande d'Elvatec est sûre : cinq jours sur cinq, contrat ferme de deux ans, client sans incident de paiement. Une nacelle louée 21 jours par mois coûte 1 995 € à 95 € la journée, 2 730 € à 130 € en saison, contre 22 560 / 36 = 627 € par mois en crédit-bail, option levée et nacelle revendue ; l'écart moyen sur trente tirages est de 10,4 k€.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "La location longue durée évite d'acheter des machines dont Arvel n'aura plus l'usage après le chantier.",
      ceQuiLeDejoue:
        "Elle cumule les deux défauts : 1 180 € par mois sans rien à revendre, plus cher que l'achat, et une restitution anticipée qui coûte les loyers restant dus jusqu'au douzième mois si la phase 2 est reportée (une sur sept en temps normal, deux sur cinq quand les ventes calent). Elle fait moins bien que l'achat dans chacun des trente tirages, et la location chez Sillon, elle, se rend sans frais.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Deux machines achetées évitent d'enrichir le partenaire au tarif de saison de 165 € et appartiennent à l'entreprise au bout de trois ans.",
      ceQuiLeDejoue:
        "Mélina chiffre une quarantaine de journées à sous-louer d'ici la semaine 13 ; le contrat de saison les bloque à 115 € pour 25 journées au moins, sans engager 90 000 € sur trois ans. En saison normale l'achat fait à peu près jeu égal (0,5 k€ de moins), mais quand la saison se retourne les deux machines finissent sans emploi et l'option perd 11,9 k€ en moyenne.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La nacelle est amortie depuis longtemps : elle ne coûte plus rien, la réparation de 5 400 € est la solution la moins chère.",
      ceQuiLeDejoue:
        "L'amortissement passé est sans incidence sur la décision ; seuls comptent les coûts à venir : 5 400 € de réparation, puis près d'une chance sur cinq par semaine d'une panne à 2 800 €, environ 2,5 k€ attendus sur cinq semaines. Une nacelle neuve en crédit-bail coûte environ 156 € par semaine ; l'option fait 7,2 k€ de moins que le remplacement sur trente tirages.",
    },
  ],
  debrief: [
    "Le commercial de Valtrac compare une mensualité de 1 345 € à un loyer de 1 290 €. Qu'est-ce que chacun de ces deux montants contient, et qu'est-ce qu'il laisse de côté ? Combien coûte réellement chaque formule par mois ?",
    "Combien de jours par mois une mini-pelle doit-elle tourner pour qu'il vaille mieux la posséder que la louer chez Sillon ? Avec le planning de l'an dernier, combien de machines fallait-il posséder, et pourquoi pas six ?",
    "Pour Elvatec, le crédit-bail coûte 22,6 k€ sur trois ans, la location longue durée 33,1 k€. Pourquoi l'écart est-il si grand, et que vous apprend le fait que le taux implicite du crédit-bail soit à peu près celui de l'emprunt ?",
    "Pour Sorlin, contre-proposer 157 € la journée a fait mieux que signer à 131 € dans 14 tirages sur 30, chaque fois que Sorlin a accepté, mais seulement de 624 € ; sous le hasard 12, Sorlin a refusé et l'écart n'est que de 384 €. Pourquoi l'option coûte-t-elle pourtant près de 3 k€ en moyenne ? Que se passe-t-il quand Sorlin refuse et que la saison se retourne, et que valaient alors quatre jours garantis par semaine ?",
    "Pour Ganivet, sous le hasard 12, ceux qui ont acheté les tout-terrain ont fait 11 k€ de mieux que ceux qui les ont louées chez Sillon. Sur trente tirages, l'écart moyen n'est plus que de 1,4 k€, et dans les 10 % de tirages les plus défavorables l'achat finit 27 k€ sous le budget, la location 2,4 k€ seulement. Lequel des deux choix était le bon ? Les deux se défendent-ils ?",
    "La méthode « coût total et souplesse » fait en moyenne +6,7 k€ sur trente tirages, la méthode « mensualités et trésorerie » −45,9 k€. Sous le hasard 12, où la saison a tenu, l'écart est-il plus grand ou plus petit ? Que retenir d'un bon résultat obtenu sous un seul trimestre ?",
    "Pourquoi la vieille nacelle « amortie » n'était-elle pas gratuite ? Quels coûts fallait-il comparer le vendredi de la semaine 8 ?",
  ],
  prolongement: {
    enonce:
      "Une entreprise de travaux publics doit équiper trois chantiers d'un chariot télescopique pendant trois ans. Achat à crédit : 60 000 € HT financés à 100 % sur 36 mois, mensualité de 1 800 € ; cote de revente à trois ans 30 000 € ; entretien 2 800 € par an. Location longue durée : 36 loyers de 1 650 €, entretien compris, machine rendue au terme. Location courte : 200 € la journée, sans engagement. Le planning prévisionnel donne 15 jours d'utilisation par mois au premier chariot, 10 au deuxième, 4 au troisième. 1) Calculez le coût total sur trois ans d'un chariot acheté à crédit, puis d'un chariot en location longue durée. 2) Calculez le nombre de jours par mois au-delà duquel posséder un chariot coûte moins que le louer à la journée. 3) Combien de chariots faut-il posséder ? Comparez le coût total sur trois ans de votre solution à celui de trois achats et de trois locations longue durée. 4) Expliquez en deux phrases pourquoi comparer 1 800 € à 1 650 € induit en erreur.",
    corrige:
      "1) Intérêts : 36 × 1 800 − 60 000 = 4 800 €. Coût total de l'achat : 60 000 − 30 000 + 4 800 + 3 × 2 800 = 43 200 €, soit 1 200 € par mois. Location longue durée : 36 × 1 650 = 59 400 €, soit 16 200 € de plus. 2) 1 200 / 200 = 6 jours par mois. 3) Les deux premiers chariots tournent au-dessus du seuil (15 et 10 jours) : on les achète. Le troisième (4 jours) se loue à la journée : 4 × 200 × 36 = 28 800 €, contre 43 200 € possédé. Total : 2 × 43 200 + 28 800 = 115 200 €, contre 129 600 € pour trois achats (14 400 € d'écart) et 178 200 € pour trois locations longue durée. 4) La mensualité rembourse un capital dont 30 000 € reviennent à la revente et ne comprend pas l'entretien, alors que le loyer comprend l'entretien et ne laisse rien à revendre. Ramené au mois, l'achat coûte 1 200 € contre 1 650 € : 450 € de moins, et non 150 € de plus.",
  },
  evaluation: [
    "Le coût total de l'achat à crédit est juste et chacun de ses termes est justifié : prix, valeur de revente, intérêts, entretien.",
    "Les formules sont comparées sur la même durée et le même périmètre, entretien et revente compris, jamais par leurs mensualités.",
    "Le seuil d'utilisation est calculé et sert à décider combien de machines posséder.",
    "Chaque engagement de coût fixe est justifié par une demande sûre, ou par un pari dont le mauvais cas est chiffré.",
    "La décision sur la machine amortie repose sur les coûts à venir, non sur la valeur nette comptable.",
  ],
  vigilance:
    "Le coût total de l'épisode additionne des montants non actualisés et hors impôt sur les sociétés, alors que le choix entre emprunt et crédit-bail se traite en finance d'entreprise sur des décaissements nets d'économies d'impôt, actualisés : à présenter comme une première approche. Le crédit-bail y est en outre retraité comme un achat financé à crédit, selon la lecture économique de l'analyse financière, alors que les comptes sociaux en portent les loyers en charges.",
};
