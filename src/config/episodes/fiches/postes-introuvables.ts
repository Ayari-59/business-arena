/**
 * FICHE ENSEIGNANT · ÉPISODE 61, LES POSTES QU'ON NE POURVOIT PLUS.
 *
 * Recruter dans un métier en tension : ce qui fait renoncer les candidats
 * (le logement, la coupure) n'est pas ce que répètent les directeurs (le
 * salaire), et payer davantage les seuls nouveaux fait partir les anciens.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "postes-introuvables",
  formations: ["bts-mhr", "but-gea"],
  programme: [
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
    "BUT GEA · Gérer le développement des ressources humaines",
  ],
  notion:
    "Quand un métier manque de candidats, le réflexe est de payer plus à l'embauche et de publier plus d'annonces. L'erreur classique est de choisir le levier avant d'avoir compté pourquoi les candidats renoncent, et de payer davantage les seuls nouveaux, ce que les anciens apprennent en quelques jours. Dans l'épisode, Mounir Belghazi, DRH du Groupe Escale à Annecy, doit trouver 64 saisonniers pour l'été avec une enveloppe de 150 k€, face aux hôtels suisses. L'an dernier, 17 postes sur 52 sont restés vides ; sur 88 candidats qui ont refusé ou se sont désistés, 51 citaient le logement (58 %), 19 la coupure ou des plannings connus trop tard (22 %), 11 seulement le salaire (13 %). Sur cent candidats venus d'ailleurs, 13 finissent la saison quand ils se logent seuls, 20 quand le groupe les loge. Un cuisinier qui manque ferme deux déjeuners par semaine à L'Escale Lac et coûte 30 k€ sur l'été. L'élève découvre qu'un toit, des horaires sans coupure, une prime de fin de saison pour tous et la cooptation font venir et rester, qu'un poste vide se chiffre, et qu'un été organisé d'avance perd moins qu'un été subi.",
  objectifs: [
    "Je compte les raisons des refus et des désistements avant de choisir un levier de recrutement.",
    "Je calcule le coût d'un poste vide sur une saison : la marge perdue, moins le salaire qu'on ne verse pas.",
    "Je repère quand une mesure réservée aux nouveaux crée une iniquité qui fait partir les équipes en place.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "La notion de marge sur coût matière (chiffre d'affaires hors taxes moins coût des matières) et celle de coût employeur d'un salaire doivent être connues. Le contrat saisonnier, la cooptation et l'intérim peuvent être présentés pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/postes-introuvables?hasard=21 : toute la classe joue la même campagne, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du coût d'un cuisinier vacant sur l'été, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "La campagne",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, le levier choisi en semaine 1 (salaire, logement, indemnité ou rien) et la réponse aux directeurs en semaine 2. Aux plus rapides, vous demandez de rejouer en ne changeant que la décision sur la coupure.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées au tableau, de la plus basse à la plus haute, et refaites le calcul avec les chiffres de Prosper Okafor : deux déjeuners fermés, 75 couverts, 30 € de ticket hors taxes, 30 % de ratio matière, 650 € de salaire, douze semaines. Vous faites expliquer les valeurs éloignées de 30 k€ (46,2, 37,8 ou 8,4), puis vous montrez la source du contrôle de gestion : un serveur vacant coûte 920 € par semaine, une femme de chambre 1 840 €.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (salaire ou logement), de la semaine 2 (prime d'embauche ou prime de fin de saison) et de la semaine 4 (la coupure). Pour la semaine 1, vous faites relire la source des refus : 51 sur 88 pour le logement, 11 pour le salaire. Pour la semaine 2, la source sur les fidèles : à L'Escale Évian, une prime réservée aux nouveaux a fait perdre quatre fidèles sur onze.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 21, « Faire venir et faire rester » préserve 945 k€ de marge d'été, « Le salaire des nouveaux et les annonces » 385 k€, et ne rien changer 577 k€ : payer les nouveaux fait moins bien que l'immobilité. Puis vous montrez la coupure : sous ce tirage, le service sans coupure a mal tenu, et ceux qui ont gardé la coupure avec des plannings publiés finissent environ 52 k€ au-dessus. Sur les trente tirages, le service sans coupure reste pourtant le meilleur en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : compter pourquoi les candidats renoncent avant de choisir le levier, et ne jamais payer un nouveau plus qu'un ancien. Vous la déclinez en quatre gestes : loger ceux qui viennent d'ailleurs, s'attaquer aux horaires, retenir par une prime de fin de saison pour tous, et organiser l'été pour l'effectif qu'on aura plutôt que surenchérir au dernier moment.",
    },
  ],
  calcul: {
    reponse: 30,
    etapes: [
      "Source « Demander à Prosper Okafor ce que coûte un cuisinier qui manque » : à cinq cuisiniers au lieu de six, le déjeuner ferme deux jours par semaine, le lundi et le mardi ; un déjeuner, c'est 75 couverts à 30 € de ticket moyen hors taxes, soit 2 × 75 × 30 = 4 500 € de chiffre d'affaires perdu par semaine.",
      "La matière n'est pas achetée quand le service est fermé : avec un ratio matière de 30 %, la marge perdue est de 4 500 × (1 − 0,30) = 3 150 € par semaine. La salle est en place de toute façon : elle reste payée et ne se déduit pas.",
      "Le cuisinier qui manque n'est pas payé : on retire son salaire chargé, 650 € par semaine, soit 3 150 − 650 = 2 500 € par semaine de poste vide.",
      "Sur les douze semaines de la saison, de mi-juin à début septembre : 12 × 2 500 = 30 000 €, soit 30 k€. Le calcul ne dépend pas du hasard : 30 k€ pour toute la classe ; l'épisode le juge juste à 2 k€ près.",
    ],
    erreurs: [
      {
        valeur: 46.2,
        cause:
          "Le chiffre d'affaires perdu est pris pour de la marge, sans retirer la matière qu'on n'achète pas : (4 500 − 650) × 12 = 46,2 k€.",
      },
      {
        valeur: 37.8,
        cause:
          "Le salaire non versé n'est pas déduit, alors que la prévision le demande : 3 150 × 12 = 37,8 k€.",
      },
      {
        valeur: 8.4,
        cause:
          "Le ratio matière est pris pour le taux de marge : 4 500 × 0,30 = 1 350 €, moins 650 €, soit 700 € par semaine et 8,4 k€ sur l'été.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Romy Castellane le dit : la Suisse paie plus, il faut payer plus à l'embauche, et plus d'annonces feront plus de candidats.",
      ceQuiLeDejoue:
        "La source des refus de l'an dernier : 11 candidats perdus sur 88 citaient le salaire, 51 le logement. Les hôtels suisses paient plus du double, aucune prime française ne comble l'écart, et Marwa Selmi entend d'abord « Vous logez ? ». Les 150 € brut ne vont qu'aux nouveaux : les fidèles l'apprennent, Euloge Nkounkou rapporte que trois d'entre eux hésitent à revenir. Rejoué sur les trente tirages à la place du logement, ce choix perd 154 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Un hôtel de Montreux offre 1 500 francs à la signature : sans prime d'embauche de 600 €, on perd les meilleurs.",
      ceQuiLeDejoue:
        "La source sur les fidèles : à L'Escale Évian, une prime réservée aux nouveaux s'est sue en une semaine, et quatre fidèles sur onze ne sont pas revenus ; Léopold Vittoz, second du Lac depuis onze ans, gagnerait moins qu'un chef de partie qui arrive. La source sur les départs ajoute qu'un saisonnier sur sept part avant la fin, et qu'une prime de fin de saison pour tous divise ces départs par plus de deux. Rejouée sur les trente tirages à la place de la prime de fin de saison, la prime d'embauche perd 173,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi:
        "Le vivier se tarit : trois sites de plus et des publicités sur les réseaux sociaux toucheront plus de monde, et vite.",
      ceQuiLeDejoue:
        "Les annonces sont déjà vues ; elles rapportent des profils sans expérience qui posent la même question du logement. La source sur les équipes en place chiffre la cooptation : une à deux candidatures sérieuses par semaine, qui signent deux fois plus souvent et partent deux fois moins en cours de saison (6 %, contre 12 à 14 %), pour 300 € brut versés seulement quand le filleul finit sa saison. Rejouées sur les trente tirages à la place de la cooptation, les annonces multipliées perdent 58,6 k€ en moyenne et ne font mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Les directeurs connaissent leur part depuis janvier, et Annabelle Socquet compte sur ses neuf saisonniers : changer la répartition, c'est se fâcher avec eux.",
      ceQuiLeDejoue:
        "Lucile Fabbri le dit : un poste vide coûte d'autant moins que l'hôtel est calme. Envoyer les recrues là où les réservations sont les plus fortes réduit d'environ 20 % le coût des postes qui resteront vides dans une saison normale ; servir d'abord les restaurants n'en gagne que 8 %. Rejouée sur les trente tirages à la place de la réaffectation, la répartition de février perd 17 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Romy Castellane boucle sa brigade cette semaine si on lui donne 200 € de plus par mois pour les derniers candidats.",
      ceQuiLeDejoue:
        "Les 200 € brut coûtent 780 € par recrue sur la saison, charges comprises, et ne vont qu'aux derniers arrivés : ceux qui ont signé en mars l'apprennent et demandent à renégocier. La source du contrôle de gestion montre qu'un poste vide qu'on sait d'avance coûte environ 25 % de moins : on ferme les services les moins rentables et des chambres à la vente au lieu de surréserver. Rejouée sur les trente tirages à la place de l'été organisé, la surenchère perd 123 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, qui a vu un problème de salaire, qui un problème de logement ? Qu'est-ce qui, dans les refus de l'an dernier, permettait de trancher ?",
    "Un cuisinier vacant coûte 30 k€ sur l'été, un réceptionniste vacant 700 € par semaine seulement : que dit cet écart de l'endroit où envoyer les recrues, et des postes qu'on peut laisser vides ?",
    "Une prime d'embauche et une prime de fin de saison peuvent coûter à peu près autant. Pourquoi l'une fait-elle partir des fidèles et l'autre les retient-elle ?",
    "Sous le tirage 21, le service sans coupure a mal tenu, et garder la coupure avec des plannings publiés trois semaines à l'avance fait environ 52 k€ de mieux. Sur les trente tirages, il fait pourtant mieux en moyenne que les trois autres choix. Lequel fallait-il prendre, et sur quel critère ?",
    "Sous le tirage 21, la méthode du salaire des nouveaux et des annonces préserve 385 k€, et ne rien changer 577 k€. Comment des décisions prises pour attirer plus de candidats peuvent-elles faire moins bien que l'immobilité ?",
    "En semaine 10, il manque encore des contrats. Que gagne-t-on à décider d'avance des services qu'on fermera, plutôt qu'à surenchérir ou à attendre juin ?",
    "Quelle règle gardez-vous pour recruter dans un métier en pénurie ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Une brasserie de station emploie quatre cuisiniers l'été. S'il en manque un, elle ferme le dîner du dimanche : 90 couverts à 38 € de ticket moyen hors taxes, avec un ratio matière de 28 %. Un cuisinier saisonnier coûte 700 € par semaine, charges comprises, et la saison dure dix semaines. 1) Calculez le coût d'une semaine de poste vide, salaire non versé déduit, puis sur la saison. 2) Une agence d'intérim facture au coefficient 2,2 sur le salaire chargé : combien coûte une semaine d'intérimaire, et combien rapporte-t-elle de plus qu'une semaine de poste vide ? 3) L'agence ne garantit que 35 % des semaines et facture 800 € de frais par poste réservé, pourvu ou non : la réservation vaut-elle la peine sur la saison ? 4) Le patron hésite entre 150 € brut de plus par mois pour le seul nouveau cuisinier, et un studio à 600 € par mois. Que lui conseillez-vous de vérifier d'abord ?",
    corrige:
      "1) 90 × 38 = 3 420 € de chiffre d'affaires ; la marge perdue est de 3 420 × (1 − 0,28) = 2 462,40 € ; moins 700 € de salaire non versé, une semaine vide coûte 1 762,40 €, soit 17 624 € sur dix semaines. 2) Une semaine d'intérimaire coûte 2,2 × 700 = 1 540 € ; elle évite de perdre 2 462,40 € de marge : elle rapporte 2 462,40 − 1 540 = 922,40 € de plus qu'une semaine de poste vide. 3) En espérance, 0,35 × 10 = 3,5 semaines couvertes, soit 3,5 × 922,40 = 3 228,40 €, moins 800 € de frais : 2 428,40 €. La réservation vaut la peine, mais elle ne couvre qu'un tiers environ du coût du poste vide (17 624 €). 4) Ce qui fait renoncer les candidats : s'ils viennent d'ailleurs et ne trouvent pas à se loger, le studio traite la cause ; 150 € de plus pour le seul nouveau risquent d'être sus des trois cuisiniers en place.",
  },
  evaluation: [
    "Le coût d'un cuisinier vacant est calculé juste (marge sur coût matière de deux déjeuners, salaire non versé déduit, douze semaines), à partir de la source nommée.",
    "Le choix du levier de la semaine 1 s'appuie sur le décompte des refus de l'an dernier, chiffré.",
    "Chaque mesure de rémunération est jugée sur ce qu'elle fait aux équipes en place, pas seulement sur les candidats qu'elle attire.",
    "Le traitement des postes qui resteront vides s'appuie sur leur coût par métier et sur le pick-up de chaque hôtel.",
    "L'élève distingue, sur la décision de la coupure, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 21.",
  ],
  vigilance:
    "L'épisode affirme qu'un contrat saisonnier n'ouvre pas droit à l'indemnité de fin de contrat de 10 %, sauf disposition conventionnelle : la règle et ses exceptions sont à vérifier avec la convention HCR en vigueur. La retenue de 150 € par mois au saisonnier logé suit les règles de l'avantage en nature logement, que le modèle ne détaille pas. Le coût employeur est un coefficient forfaitaire de 1,3.",
};
