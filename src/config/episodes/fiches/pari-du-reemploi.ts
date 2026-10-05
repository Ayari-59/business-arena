import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 47, LE PARI DU RÉEMPLOI.
 *
 * Les chiffres du corrigé, des réflexes et du débrief se recalculent depuis le
 * modèle de l'épisode (src/engine/episodes/pari-du-reemploi.ts) ; ceux du
 * hasard de la classe sont ceux de la graine 12, les moyennes celles des
 * trente tirages du bilan, les autres décisions suivant la meilleure méthode.
 */
export const FICHE: FicheEnseignant = {
  code: "pari-du-reemploi",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Face à une évolution réglementaire qui crée un marché, la question « premier entrant ou suiveur ? » ne se tranche pas en bloc : l'avantage du premier entrant tient à ce qu'il peut préempter, des ressources rares qui ne se prennent qu'une fois, et l'avantage du suiveur à ce qu'il peut acheter plus tard, moins cher et mieux dimensionné, une fois l'incertitude levée. C'est la grille de Lieberman et Montgomery (1988), qui rangent la préemption des actifs rares parmi les sources d'avantage du pionnier et la levée de l'incertitude parmi celles du suiveur. L'erreur classique est double : se croire premier parce qu'on a acheté la capacité et qu'on l'a fait savoir, ou tout attendre parce que la règle n'est pas définitive, et laisser filer ce qui, une fois signé par un autre, ne reviendra pas. L'épisode met l'élève à la direction RSE et nouvelles activités d'un négoce de matériaux, devant un projet de décret sur la reprise et le réemploi des déchets du bâtiment : les conventions de cinq ans avec les deux grands démolisseurs de la métropole sont la ressource rare, la plateforme de tri et les comptoirs s'achètent à tout moment. Un concurrent, qui a fait exactement cela à Grenoble, entre ou non selon ce qu'on lui laisse et ce qu'on annonce ; et le plan doit se réviser sur le premier taux d'écoulement mesuré, comme l'offre à la Métropole sur la caractérisation des bâtiments.",
  objectifs: [
    "J'estime un gisement accessible en enchaînant les filtres d'une étude, et je situe ce qu'en tient chaque acteur.",
    "Je distingue, dans une position de premier entrant, les ressources rares qui se préemptent de ce qu'un suiveur pourra acheter plus tard, et je ne paie d'avance que pour les premières.",
    "J'anticipe la réaction d'un concurrent à ce que je lui laisse et à ce que j'annonce.",
    "Je révise un plan sur les premiers chiffres mesurés, et je paie une information quand elle change le prix d'un engagement ferme.",
  ],
  prerequis:
    "La VAN et l'actualisation, l'espérance d'un gain sous des probabilités données, et les notions d'avantage concurrentiel, de barrière à l'entrée et de ressource stratégique.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/pari-du-reemploi?hasard=12 : toute la classe joue le même trimestre, sous le même hasard. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous ne dites rien de l'avantage du premier entrant : vous demandez seulement de noter, à chaque décision, ce qu'un concurrent pourrait encore faire si l'on attendait.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les élèves jouent les six décisions, de la semaine 1 à la semaine 11. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, le gisement estimé en semaine 1 et l'option choisie à chaque décision. Vous ouvrez discrètement trois colonnes pour la semaine 1 : « plateforme annoncée », « gisements d'abord », « attendre le décret ou piloter ».",
    },
    {
      minutes: 15,
      titre: "Correction du gisement de la semaine 1",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute : les 60 000 t viennent de la conférence du salon, les 5 400 t des six démolisseurs pris pour tout le marché. Vous enchaînez au tableau les filtres de l'étude de l'observatoire jusqu'à 9 000 t, puis vous faites placer les deux grands démolisseurs : 2 400 t, plus du quart du gisement, près de la moitié des 5 000 t qui manquent chaque année à la plateforme de Vercoran.",
    },
    {
      minutes: 30,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous repartez du relevé : la semaine 1 et la réponse aux démolisseurs en semaine 2 partagent presque toujours la classe entre la plateforme annoncée, l'essai d'un an et l'attente. Vous faites défendre chaque option par un binôme qui l'a choisie, puis vous ressortez ce que montraient l'appel à Grenoble et la note sur Vercoran. Vous traitez ensuite l'accord-cadre de la Métropole (ce que vaut la caractérisation) et le premier bilan de la semaine 6 (tenir le plan ou le réviser).",
    },
    {
      minutes: 10,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous prévenez la classe que le résultat de cet épisode est très bruité : sur les trente tirages, la bonne méthode va de −257 k€ à +439 k€, et elle détruit de la valeur dans les cinq tirages où le décret est repoussé. Sous le hasard 12, plutôt favorable (décret maintenu, et Vercoran resté à Grenoble derrière elle), elle fait 399 k€, troisième des trente, pour 187 k€ en moyenne. Vous faites distinguer ce que la classe a obtenu de ce que ses décisions valaient en moyenne, décision par décision.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez la règle que l'épisode a fait éprouver : ce qui est rare et se signe une fois se prend tôt, ce qui s'achète à tout moment se décide sur des volumes mesurés ; la venue d'un concurrent dépend de ce qu'on lui laisse ; un plan se révise sur ses premiers chiffres. Vous rattachez la règle à la grille du premier entrant et du suiveur, puis vous distribuez le cas de prolongement.",
    },
  ],
  calcul: {
    reponse: 9000,
    etapes: [
      "« Lire l'étude de l'observatoire régional des déchets » : la métropole produit 400 000 t de déchets du bâtiment par an, travaux publics non compris.",
      "Premier filtre : 15 % de ce tonnage sont des produits et équipements déposables selon les diagnostics avant démolition, soit 400 000 × 0,15 = 60 000 t. C'est le « gisement » de la consultante du salon, réemployable ou non.",
      "Second filtre : 15 % des déposables sont en état d'être réemployés, soit 60 000 × 0,15 = 9 000 t de matériaux réemployables par an (400 000 × 0,0225). Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode juge juste à 300 t près, proche à 1 000 t.",
      "Contrôle par les acteurs : les six démolisseurs tiennent 60 % du gisement, soit 5 400 t, et la même étude les cite un par un : 1 400 t pour Sartel, 1 000 t pour Grollier, quatre moyens de 750 t, 1 400 + 1 000 + 3 000 = 5 400 t.",
      "Lecture stratégique : les deux grands font 2 400 t, 27 % du gisement et 44 % de ce que tiennent les six ; dispersés sur une quarantaine de chantiers, les quatre moyens ne paient pas le transport jusqu'à Grenoble. C'est ce qui fait des deux conventions la ressource rare.",
    ],
    erreurs: [
      {
        valeur: 60000,
        cause:
          "Un seul des deux filtres de 15 % : ce sont les produits déposables, réemployables ou non, le chiffre que la consultante du salon présente comme « le gisement du réemploi ». L'épisode la juge fausse.",
      },
      {
        valeur: 5400,
        cause:
          "Les six démolisseurs pris pour tout le gisement, en additionnant les tonnages cités (1 400 + 1 000 + 4 × 750) ou en appliquant les 60 % une fois de trop : c'est leur part, pas le marché. L'épisode la juge fausse.",
      },
      {
        valeur: 120000,
        cause:
          "Les deux pourcentages additionnés au lieu d'être enchaînés : 400 000 × (15 % + 15 %). Un taux de réemployables s'applique aux déposables, pas aux déchets.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Sur un marché qui s'ouvre, le premier équipé et le premier visible prend la place ; le directeur financier le dit lui-même : « soyons les premiers visibles ».",
      ceQuiLeDejoue:
        "L'appel à Grenoble montre une plateforme de Vercoran à 55 % de charge : ce sont ses conventions qui lui ont donné le marché, pas la machine ; la fédération précise que la subvention de 30 % exclut tout équipement déjà commandé. L'annonce porte la chance d'entrée de Vercoran de 20 à 40 % : sur les trente tirages, 42 k€ de valeur en moyenne contre 187 k€, soit 145 k€ de moins.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Le décret n'est qu'un projet, repoussé une fois sur quatre : engager une équipe avant le texte définitif, c'est parier.",
      ceQuiLeDejoue:
        "Rien de ce qui compte n'attend le texte : Vercoran a signé Grenoble en sept semaines, et les démolisseurs répondent avant le 15. Le gel double la chance d'entrée de Vercoran (40 % au lieu de 20 %), divise par deux les chances à l'accord-cadre et repousse les collectes à juillet : 115 k€ en moyenne, 72 k€ de moins, pour un pire cas à peine moins mauvais (−143 k€ au lieu de −148 k€ au 10e centile).",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Cinq ans d'exclusivité avant même le décret, c'est trop ; un an d'essai garde la main, comme le propose le directeur financier.",
      ceQuiLeDejoue:
        "« Chiffrer la convention proposée » : à la fin de l'essai, le démolisseur demandera 20 € la tonne au lieu de 12, s'il est encore libre ; « Comprendre ce que Vercoran cherche à Lyon » : il ira là où les grands volumes sont libres. L'essai porte sa chance d'entrée à 55 %, et s'il entre, Sartel et Grollier sont à lui pour cinq ans dès la deuxième année : 35 k€ en moyenne, 152 k€ de moins que les conventions.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "On ne signe rien qui engage cinq ans tant que la règle n'est pas connue.",
      ceQuiLeDejoue:
        "Sartel a fixé une échéance et Vercoran est à sa porte : la chance d'entrée monte à 60 %, et il prend alors les six démolisseurs. Sans gisement, la filière n'a rien à vendre et l'offre à la Métropole perd la moitié de ses chances, faute de références : −146 k€ en moyenne, 333 k€ de moins que les conventions, la pire option de l'épisode.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Une première référence publique n'a pas de prix, et au prix du plan, 94 € la tonne, on est les moins chers : on gagne.",
      ceQuiLeDejoue:
        "« Lire le cahier des charges et poser le coût d'une tonne » : chaque point de réemploi en moins coûte 4,2 € la tonne ; le déjeuner avec l'ancien de Vercoran donne 30 à 60 % de réemploi, 45 % en moyenne, soit 111 € de coût net pour une offre à 94 €. L'offre du plan perd de l'argent dans 21 tirages sur 30 et gagne d'autant plus sûrement que les bâtiments sont mauvais : 96 k€ de moins que la caractérisation en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le plan a été présenté avec six comptoirs ; reculer, dit la directrice générale, serait un mauvais signal pour les agences et les partenaires.",
      ceQuiLeDejoue:
        "« Lire le bilan des premières semaines » : sous le hasard 12, 48 % d'écoulement au lieu de 55 %, soit 1 298 t à vendre sur 2 700 t collectées, moins que les 1 350 t que deux comptoirs et la vente directe écoulent au plein prix. Les quatre autres comptoirs ajoutent 240 t pour 48 k€ d'aménagement et 40 k€ de vendeurs par an : 85 k€ de moins en moyenne.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "22 € la tonne, zéro souci, la conformité garantie : un négoce n'est pas un recycleur, dit le directeur financier.",
      ceQuiLeDejoue:
        "« Lire l'offre d'Orréa en détail » : la variante, au même prix sur les seules 2 700 t non réemployables, laisse à Arvel 300 t réemployables par an, qui rapportent 72 € la tonne sous le hasard 12 (environ 22 k€ par an), grossissent les volumes de la ligne de tri et comptent pour l'objectif du décret durci. Tout céder coûte 94 k€ en moyenne.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Le décret paraît dans un mois et la fédération dit que la plupart des adhérents attendent le texte : rien ne presse.",
      ceQuiLeDejoue:
        "L'offre le dit : les contrats ne prennent effet qu'avec l'obligation, attendre ne protège donc de rien. Il reste une place sur trois, prise une fois sur deux, et c'est alors 26 € la tonne sur 3 000 t, flux réemployables perdus : 47 k€ de moins en moyenne. Sous le hasard 12, la place était encore libre et l'attente n'a rien coûté.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "La subvention ne repassera peut-être pas, et le fabricant promet que les volumes vont exploser avec le décret.",
      ceQuiLeDejoue:
        "« Calculer la VAN de chaque équipement à nos volumes » : à 2 700 t par an (2 400 t si le décret est repoussé), la ligne de 4 000 t vaut +89 k€ subvention déduite, la plateforme de 8 000 t −71 k€, avec 50 k€ par an de fonctionnement pour une capacité aux deux tiers vide. Les références du fabricant sont des recycleurs d'inertes : 155 k€ de moins que la ligne en moyenne.",
    },
  ],
  debrief: [
    "Dans un an, qu'est-ce qu'un suiveur pourra encore acheter, et qu'est-ce qu'il ne pourra plus prendre ? Classez les six décisions de l'épisode dans l'une ou l'autre colonne, puis comparez : les conventions de cinq ans battent l'essai d'un an de 152 k€ en moyenne, alors que la plateforme commandée et annoncée en semaine 1 fait 145 k€ de moins que la posture qui attend décembre pour acheter une ligne à la taille des gisements.",
    "Vercoran entre à Lyon 4 fois sur 30 derrière la bonne méthode, 12 fois si l'on annonce la plateforme au salon, 20 fois derrière le premier visible et 23 fois derrière l'attentiste. Qu'est-ce qui, dans vos choix, décidait de sa venue ? Pourquoi une annonce bruyante sans gisement l'attire-t-elle au lieu de le dissuader ?",
    "Faire caractériser trois bâtiments coûte 15 k€ et ne change rien au dossier, sauf le prix : sous le hasard 12, la mesure donne 49 % de réemploi, 95 € de coût net, et l'offre part à 120 € au lieu de 94 €. Sur les trente tirages, cette information rapporte 96 k€ de plus que l'offre du plan. Quand une information vaut-elle son prix ? Qui, parmi vous, a remis l'offre du plan, et sur quelle hypothèse ?",
    "L'offre prudente à 214 € la tonne bat la caractérisation sur 17 tirages sur 30, et fait pourtant 39 k€ de moins en moyenne ; sous le hasard 12, elle fait 122 k€ de moins. Elle ne gagne l'accord-cadre que deux fois : dans quinze tirages, elle l'emporte seulement parce qu'elle n'a pas payé les 15 k€ d'études d'une offre perdue ou déclarée sans suite ; dans treize, elle perd de 82 à 160 k€. Qu'a-t-on choisi en remettant une offre que personne ne retiendra ? Un manager jugé sur son résultat aurait-il appris la bonne leçon ?",
    "En semaine 6, le premier bilan mesure 48 % d'écoulement au lieu des 55 % du plan, et la valeur estimée tombe de 420 k€ à 139 k€ en une semaine. La directrice générale dit que reculer est un mauvais signal. Qu'est-ce qui, dans le bilan, disait combien de comptoirs ouvrir ? Que coûte de réviser un plan, et que coûte de le tenir (85 k€ en moyenne) ?",
    "Sous le hasard 12, la bonne méthode a créé 399 k€ ; sur les trente tirages, 187 k€ en moyenne, avec un pire cas à −148 k€ au 10e centile et une valeur négative dans les cinq tirages où le décret est repoussé. L'attentiste fait 46 k€ sous le hasard 12, −26 k€ en moyenne. Que conclure d'un binôme qui a fait 300 k€ ? La qualité d'une décision stratégique peut-elle se juger au résultat d'un trimestre ?",
  ],
  prolongement: {
    enonce:
      "Logivert, transporteur régional nantais, prépare la zone à faibles émissions qui interdira les fourgons diesel en centre-ville dans un an. Deux ressources comptent. Les deux seuls entrepôts urbains disponibles en centre-ville, d'anciennes halles ferroviaires, se louent par bail de neuf ans ; les prendre dès maintenant coûte une année de loyer à vide, 60 k€. Une fois la zone en vigueur, ils rapportent 150 k€ de marge par an pendant cinq ans, soit 568,6 k€ en valeur d'aujourd'hui (coefficient d'annuité de 3,7908 à 10 %). Un concurrent national, Cargomax, observe. Si Logivert prend les entrepôts, il entre une fois sur cinq, et la marge de Logivert baisse alors de 30 %. Si Logivert attend l'ouverture de la zone, Cargomax entre sept fois sur dix et prend les deux entrepôts : Logivert n'a plus rien. Il faut aussi vingt fourgons électriques : 1 000 k€ aujourd'hui, 900 k€ dans un an selon les constructeurs, livrés en trois mois. 1) Qu'est-ce qui, dans ce dossier, se préempte, et qu'est-ce qui peut attendre ? 2) Comparez en espérance « prendre les entrepôts maintenant » et « attendre la zone » ; chiffrez ce que coûte l'achat immédiat des fourgons, au taux de 10 %. 3) Le directeur commercial veut annoncer dès maintenant « le premier logisticien 100 % électrique de Nantes ». L'annonce porterait la chance d'entrée de Cargomax à 35 %, même entrepôts pris. Qu'en pensez-vous ?",
    corrige:
      "1) Les entrepôts sont la ressource rare : deux seulement, liés pour neuf ans au premier qui signe, et dont la prise décide de la venue du concurrent. Les fourgons s'achètent à tout moment, moins cher dans un an, et leur nombre se fixe mieux sur les volumes réels : on attend que l'élève le dise avant tout calcul. 2) Prendre maintenant : 0,8 × 568,6 + 0,2 × 568,6 × 0,7 = 454,9 + 79,6 = 534,5 k€, moins 60 k€ de loyer à vide, soit 474,5 k€. Attendre : 0,3 × 568,6 = 170,6 k€. Prendre les entrepôts maintenant vaut 303,9 k€ de plus. Les fourgons achetés dans un an coûtent 900 / 1,10 = 818,2 k€ en valeur d'aujourd'hui : les acheter maintenant coûte 181,8 k€ de plus, pour un avantage nul tant que la zone n'est pas en vigueur. 3) Avec l'annonce : 0,65 × 568,6 + 0,35 × 398,0 = 369,6 + 139,3 = 508,9 k€, moins 60 k€, soit 448,9 k€ : l'annonce détruit 25,6 k€ de valeur avant même son propre coût. On attend que l'élève dise qu'être premier se joue sur la ressource prise, pas sur ce qu'on fait savoir, et qu'une annonce renseigne d'abord le concurrent.",
  },
  evaluation: [
    "Le gisement est estimé en enchaînant les deux filtres de l'étude, et contrôlé par la part des six démolisseurs.",
    "L'élève sépare explicitement ce qui se préempte (les conventions, la référence publique) de ce qui s'achète plus tard (l'équipement, les comptoirs), et justifie ainsi ses décisions des semaines 1, 2 et 11.",
    "La décision sur les démolisseurs tient compte de la réaction de Vercoran à ce qu'on lui laisse, chiffrée par ce que montrent les sources sur Grenoble et sur ses besoins de volume.",
    "Le nombre de comptoirs est révisé sur le taux d'écoulement mesuré en semaine 6, et l'offre à la Métropole est chiffrée sur un taux de réemploi mesuré ou explicitement supposé.",
    "L'élève distingue, sur le bilan des trente tirages, la qualité d'une décision de son résultat sous le hasard de la classe.",
  ],
  vigilance:
    "L'épisode tient pour sûres les probabilités que donnent les sources (le décret, la venue de Vercoran, calculée par une règle fixe à partir des choix) et arrête la valeur à l'horizon des conventions, cinq ans au taux de 9 %, sans impôt, sans valeur au-delà pour la filière ni pour la position acquise, l'équipement seul gardant 40 % de son prix. Un enseignant de stratégie voudra rappeler que les probabilités d'un dossier réel ne sont jamais annoncées, qu'un concurrent raisonne au lieu de tirer au sort, et que l'avantage du premier entrant se mesure souvent au-delà de la durée de ses premiers contrats.",
};
