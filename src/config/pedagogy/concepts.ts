/**
 * Référentiel des concepts (doc 03 §2) — données, pas code. Les 20 concepts
 * du MVP + les concepts d'investissement (VAN/TRI, atelier « capacité »).
 * Chaque concept a 3 profondeurs d'explication (intuition / méthode / formel)
 * et un axe de compétence pour le profil joueur (§28).
 */

export type ConceptDomain =
  | "market"
  | "commercial"
  | "costs"
  | "margins"
  | "thresholds"
  | "production"
  | "finance"
  | "profitability";

export type SkillAxis =
  | "finance"
  | "marketing"
  | "production"
  | "analysis"
  | "strategy"
  | "decision"
  | "risk";

export interface ConceptDef {
  code: string;
  name: string;
  domain: ConceptDomain;
  axis: SkillAxis;
  definition: string;
  intuition: string;
  method: string;
  formula?: string;
}

export const CONCEPTS: ConceptDef[] = [
  {
    code: "demand_market_share",
    name: "Demande et part de marché",
    domain: "market",
    axis: "marketing",
    definition: "La demande est la quantité que le marché veut acheter ; votre part de marché est la fraction que vous en captez.",
    intuition: "Le gâteau (la demande) et votre part du gâteau sont deux choses différentes : le gâteau peut grossir pendant que votre part rétrécit.",
    method: "Comparez l'évolution de la demande totale du segment et celle de vos ventes : si le marché croît plus vite que vous, vous perdez du terrain.",
    formula: "Part de marché = vos ventes / demande totale du marché",
  },
  {
    code: "price_elasticity",
    name: "Élasticité-prix",
    domain: "market",
    axis: "marketing",
    definition: "Sensibilité de la demande à une variation de prix.",
    intuition: "Baisser le prix de 10 % peut faire gagner 25 % de clients (segment élastique)… ou presque rien (segment rigide). Tous les clients ne réagissent pas pareil.",
    method: "Testez de petites variations de prix et observez la variation des ventes segment par segment.",
    formula: "e = (ΔQ/Q) / (ΔP/P), avec e < −1 : demande élastique",
  },
  {
    code: "psych_price",
    name: "Prix psychologique",
    domain: "market",
    axis: "marketing",
    definition: "Seuils de prix perçus par les clients : 59,90 € n'est pas 60 €.",
    intuition: "La perception du prix n'est pas linéaire : franchir un seuil symbolique fait décrocher la demande plus que l'écart ne le justifie. Un prix trop bas peut aussi inquiéter.",
    method: "Repérez les seuils (50 €, 60 €, 100 €…) et positionnez-vous juste en dessous quand la marge le permet.",
  },
  {
    code: "seasonality",
    name: "Saisonnalité",
    domain: "market",
    axis: "analysis",
    definition: "Variations régulières de la demande selon la période (fêtes, rentrée…).",
    intuition: "Si le pic de demande arrive au tour 4, c'est au tour 3 qu'il faut produire : après, il est trop tard.",
    method: "Lisez les coefficients saisonniers, anticipez la production et les stocks un tour avant le pic.",
  },
  {
    code: "revenue",
    name: "Chiffre d'affaires (prix × volume)",
    domain: "commercial",
    axis: "marketing",
    definition: "Total des ventes valorisées au prix de vente.",
    intuition: "Le CA peut monter alors que la rentabilité baisse : vendre plus en gagnant moins par unité n'est pas toujours un progrès.",
    method: "Décomposez toujours une variation de CA en effet prix et effet volume.",
    formula: "CA = prix × quantités vendues",
  },
  {
    code: "segmentation",
    name: "Segmentation",
    domain: "commercial",
    axis: "marketing",
    definition: "Découpage du marché en groupes de clients aux comportements homogènes.",
    intuition: "Un étudiant et un passionné n'achètent pas la même chose au même prix : un seul prix pour tous, c'est un compromis qui déçoit tout le monde.",
    method: "Analysez vos ventes segment par segment, jamais en masse globale.",
  },
  {
    code: "fixed_costs",
    name: "Coûts fixes",
    domain: "costs",
    axis: "finance",
    definition: "Charges indépendantes du volume produit (loyer, salaires de structure, amortissements).",
    intuition: "Que vous vendiez 0 ou 5 000 enceintes, le loyer tombe. C'est un tapis roulant : il faut vendre assez chaque période juste pour le payer.",
    method: "Isolez les charges qui ne bougent pas quand le volume bouge.",
  },
  {
    code: "variable_costs",
    name: "Coûts variables",
    domain: "costs",
    axis: "finance",
    definition: "Charges proportionnelles au volume (matières, main-d'œuvre directe, énergie).",
    intuition: "Chaque unité produite « emporte » son coût : produire plus coûte plus, produire moins soulage immédiatement.",
    method: "Calculez le coût variable unitaire : c'est le plancher absolu de votre prix de vente durable.",
  },
  {
    code: "contribution_margin",
    name: "Marge sur coût variable",
    domain: "margins",
    axis: "finance",
    definition: "Ce que chaque unité vendue laisse pour couvrir les coûts fixes, puis dégager un profit.",
    intuition: "À 59 € avec 38 € de coût variable, chaque enceinte « contribue » pour 21 € : les 4 571 premières paient la structure, les suivantes font le bénéfice.",
    method: "MCV unitaire = prix − coût variable unitaire ; MCV totale = MCV unitaire × volume.",
    formula: "MCV = CA − coûts variables ; taux de MCV = MCV / CA",
  },
  {
    code: "margin_rates",
    name: "Taux de marge et taux de marque",
    domain: "margins",
    axis: "finance",
    definition: "Deux façons d'exprimer la même marge : rapportée au coût (marge) ou au prix (marque).",
    intuition: "Une marge de 21 € sur 38 € de coût, c'est 55 % de taux de marge mais 36 % de taux de marque : attention à qui parle de quoi.",
    method: "Précisez toujours le dénominateur avant de comparer des « pourcentages de marge ».",
    formula: "Taux de marge = marge/coût ; taux de marque = marge/prix",
  },
  {
    code: "breakeven",
    name: "Seuil de rentabilité",
    domain: "thresholds",
    axis: "finance",
    definition: "Niveau d'activité à partir duquel l'entreprise ne perd plus d'argent.",
    intuition: "C'est la ligne de flottaison : en dessous, chaque période creuse la perte ; au-dessus, chaque vente supplémentaire devient du bénéfice net de coûts variables.",
    method: "Divisez les coûts fixes par la marge sur coût variable unitaire.",
    formula: "SR (volume) = coûts fixes / MCV unitaire ; SR (valeur) = coûts fixes / taux de MCV",
  },
  {
    code: "dead_point",
    name: "Point mort",
    domain: "thresholds",
    axis: "finance",
    definition: "Date à laquelle le seuil de rentabilité est atteint dans la période.",
    intuition: "« À partir du 20 novembre, on travaille pour nous » : le point mort traduit le seuil en jours de calendrier.",
    method: "Point mort = (SR en valeur / CA) × durée de la période.",
  },
  {
    code: "safety_margin",
    name: "Marge de sécurité",
    domain: "thresholds",
    axis: "risk",
    definition: "Ce que le CA peut perdre avant de repasser sous le seuil de rentabilité.",
    intuition: "C'est votre coussin : une marge de sécurité de 8 % signifie qu'une baisse de 8 % des ventes vous met dans le rouge.",
    method: "Marge de sécurité = CA − seuil de rentabilité ; indice = marge / CA.",
  },
  {
    code: "capacity",
    name: "Capacité et taux d'utilisation",
    domain: "production",
    axis: "production",
    definition: "Volume maximal productible et proportion réellement utilisée.",
    intuition: "On ne vend pas ce qu'on n'a pas produit : une demande record ne sert à rien si l'atelier plafonne. Et une usine à 40 % paie des fixes pour rien.",
    method: "Comparez plan de production, capacité machine × disponibilité, et capacité main-d'œuvre : la plus petite gagne.",
  },
  {
    code: "stock",
    name: "Stocks et rupture",
    domain: "production",
    axis: "production",
    definition: "Réserve de produits entre production et vente ; la rupture est une vente perdue.",
    intuition: "Le stock coûte (il immobilise de l'argent), la rupture coûte plus (client perdu, image dégradée) : tout l'art est entre les deux.",
    method: "Surveillez les ventes manquées par segment et constituez du stock avant les pics saisonniers.",
  },
  {
    code: "productivity",
    name: "Productivité",
    domain: "production",
    axis: "production",
    definition: "Production obtenue par unité de ressource (heure de travail, machine).",
    intuition: "Deux ateliers identiques peuvent produire différemment : maintenance, organisation et climat social font la différence.",
    method: "Suivez unités/heure et disponibilité machine ; une maintenance négligée se paie en pannes.",
  },
  {
    code: "frng",
    name: "FRNG (fonds de roulement)",
    domain: "finance",
    axis: "finance",
    definition: "Excédent des ressources stables sur les emplois stables, disponible pour financer le cycle d'exploitation.",
    intuition: "Ce que les capitaux longs (capital + emprunts) laissent une fois les machines et locaux payés : la réserve qui finance le quotidien.",
    method: "FRNG = (capitaux propres + dettes financières) − actif immobilisé net.",
    formula: "FRNG = ressources stables − emplois stables",
  },
  {
    code: "bfr",
    name: "BFR (besoin en fonds de roulement)",
    domain: "finance",
    axis: "finance",
    definition: "Argent immobilisé par le cycle d'exploitation : stocks + créances clients − dettes fournisseurs.",
    intuition: "Entre le moment où vous payez vos fournisseurs et celui où vos clients vous paient, quelqu'un doit avancer l'argent : c'est vous. Plus vous grandissez, plus l'avance grossit.",
    method: "BFR = stocks + créances clients − dettes fournisseurs. Leviers : délais clients, délais fournisseurs, niveau de stock.",
    formula: "BFR = stocks + créances − dettes d'exploitation",
  },
  {
    code: "net_treasury",
    name: "Trésorerie nette",
    domain: "finance",
    axis: "finance",
    definition: "Ce qui reste du FRNG une fois le BFR financé : le solde disponible en banque.",
    intuition: "On peut être bénéficiaire et à découvert : le résultat est une opinion, la trésorerie est un fait. C'est elle qui fait vivre ou mourir l'entreprise.",
    method: "TN = FRNG − BFR. Si TN < 0 : augmenter le FRNG (capital, emprunt long) ou réduire le BFR (délais, stocks).",
    formula: "Trésorerie nette = FRNG − BFR = disponibilités − concours bancaires",
  },
  {
    code: "profitability_vs_return",
    name: "Profitabilité vs rentabilité",
    domain: "profitability",
    axis: "analysis",
    definition: "La profitabilité rapporte le résultat au CA ; la rentabilité le rapporte aux capitaux engagés.",
    intuition: "Gagner 20 000 € est « bien » ? Cela dépend : avec 100 000 € investis c'est excellent, avec 2 millions c'est médiocre. Le montant seul ne dit rien.",
    method: "Profitabilité = résultat/CA ; rentabilité économique = résultat d'exploitation net d'IS / capitaux engagés ; rentabilité financière = résultat net / capitaux propres.",
  },
  {
    code: "discounting",
    name: "Actualisation et VAN",
    domain: "profitability",
    axis: "finance",
    definition:
      "L'actualisation ramène des flux futurs à leur valeur d'aujourd'hui ; la VAN (valeur actuelle nette) compare ces flux actualisés au capital investi.",
    intuition:
      "Un euro dans deux ans vaut moins qu'un euro aujourd'hui : le temps a un prix, celui de l'argent immobilisé. Investir, c'est échanger des euros certains maintenant contre des euros espérés plus tard.",
    method:
      "Estimez les flux supplémentaires par tour (unités × marge sur coût variable), actualisez-les au taux de référence (votre taux d'emprunt), retranchez l'investissement : VAN > 0 ⇒ le projet crée de la valeur.",
    formula: "VAN = −I₀ + Σ Ft / (1 + i)^t",
  },
  {
    code: "irr_payback",
    name: "TRI et délai de récupération",
    domain: "profitability",
    axis: "decision",
    definition:
      "Le TRI est le taux d'actualisation qui annule la VAN ; le délai de récupération est le temps nécessaire pour que les flux cumulés remboursent l'investissement.",
    intuition:
      "Le TRI répond à « ce projet rapporte du combien % ? », à comparer à votre coût de financement. Le délai de récupération répond à « au bout de combien de temps ai-je récupéré ma mise ? ».",
    method:
      "Comparez le TRI au taux d'emprunt : TRI > taux ⇒ le financement par dette crée de la valeur. Méfiez-vous d'un délai de récupération plus long que la visibilité de votre marché.",
    formula: "TRI : i tel que Σ Ft / (1 + i)^t = I₀",
  },
  {
    code: "loan_schedule",
    name: "Tableau d'amortissement",
    domain: "finance",
    axis: "finance",
    definition:
      "Un emprunt se rembourse selon un échéancier contractuel : chaque période, une part du capital (l'amortissement) plus les intérêts sur le capital restant dû.",
    intuition:
      "Les échéances tombent que la caisse soit pleine ou vide : emprunter, c'est engager sa trésorerie FUTURE. La question n'est pas « puis-je emprunter ? » mais « mes flux futurs paieront-ils les échéances ? ».",
    method:
      "Rapprochez votre capacité d'autofinancement des annuités : CAF < échéances = danger, quel que soit le résultat affiché.",
    formula: "Amortissement constant : échéance t = capital/durée + restant dû × taux",
  },
  {
    code: "receivables_financing",
    name: "Escompte et affacturage",
    domain: "finance",
    axis: "decision",
    definition:
      "Mobiliser le poste clients transforme des créances en trésorerie immédiate : l'escompte avance les effets contre agios, l'affacturage cède les créances contre commission.",
    intuition:
      "Vos clients vous doivent de l'argent : cette richesse dort dans le BFR. La banque ou le factor peuvent l'avancer, moins cher que le découvert mais jamais gratuit. Un besoin PONCTUEL se couvre en mobilisant des créances ; un besoin STRUCTUREL exige de la ressource stable.",
    method:
      "Comparez les coûts : agios d'escompte (taux × durée restante) vs commission d'affacturage vs agios de découvert, et gardez l'emprunt ou le capital pour les besoins durables.",
    formula: "Coût d'escompte = montant × taux × durée/360 ; coût d'affacturage = montant × commission",
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * GESTION COMMERCIALE.
   *
   * Le registre était écrit dans la langue de la comptabilité et de la finance :
   * seuil, marge, besoin en fonds de roulement, escompte. Un enseignant de
   * management commercial opérationnel n'y trouvait aucune des notions par
   * lesquelles son référentiel découpe le métier, et son point de vente se
   * commentait donc avec le vocabulaire d'un service comptable.
   *
   * Celles-ci ne remplacent pas les précédentes, elles les précèdent : on
   * n'explique pas la marge d'une boutique à quelqu'un qui ne sait pas encore
   * ce qu'un coefficient multiplicateur, une démarque et une rotation font à
   * cette marge.
   *
   * DEUX ORIGINES, QU'IL FAUT DISTINGUER. Confrontées à l'arrêté du BTS
   * management commercial opérationnel, trois de ces notions y sont nommées :
   * la rotation des stocks, dont le texte retient précisément l'effet sur la
   * rentabilité, l'assortiment, et le marchandisage dont le rendement de la
   * surface mesure la performance.
   *
   * Les quatre autres ne le sont pas. Le coefficient multiplicateur, la
   * démarque, le panier moyen et le taux de transformation sont du vocabulaire
   * de métier, que l'arrêté couvre par des formules plus larges : « les
   * principaux outils de fixation du prix », « les indicateurs de gestion des
   * stocks », « la mesure des performances du marchandisage ». Ils se
   * travaillent partout en section, ils ne sont pas dans le texte : les
   * présenter comme des notions du référentiel serait faux.
   * ──────────────────────────────────────────────────────────────────────── */
  {
    code: "markup_coefficient",
    name: "Coefficient multiplicateur",
    domain: "margins",
    axis: "analysis",
    definition:
      "Le nombre par lequel on multiplie un prix d'achat hors taxes pour obtenir le prix de vente affiché en rayon.",
    intuition:
      "C'est le taux de marque vu à l'envers, et c'est celui que le commerce emploie vraiment : personne en boutique ne dit « je prends soixante pour cent de marque », on dit « je multiplie par deux et demi ». Il porte aussi la taxe, ce qui explique qu'un coefficient annoncé par un fournisseur et celui qu'on applique en rayon ne soient jamais le même nombre.",
    method:
      "Partez du prix que la clientèle accepte de payer, divisez par le prix d'achat : vous obtenez le coefficient qu'il vous faut aller chercher chez votre fournisseur. C'est le sens de lecture du commerce, l'autre étant celui du comptable.",
    formula: "Coefficient = prix de vente TTC / prix d'achat HT",
  },
  {
    code: "markdown",
    name: "Démarque connue et inconnue",
    domain: "commercial",
    axis: "analysis",
    definition:
      "Tout ce qui sort du stock sans passer en caisse au prix prévu : soldes, remises et casse pour la démarque connue, vol et erreurs pour la démarque inconnue.",
    intuition:
      "Un article démarqué a déjà coûté son prix d'achat. Ce qu'on perd n'est donc pas le prix affiché, c'est la marge qu'il devait rapporter, et il faut vendre plusieurs articles au prix plein pour la rattraper.",
    method:
      "Rapportez la démarque au chiffre d'affaires, et séparez toujours la connue de l'inconnue : la première est une décision commerciale qui se pilote, la seconde est une fuite qui se cherche en réserve avant de s'imputer à la clientèle.",
    formula: "Taux de démarque = démarque / chiffre d'affaires",
  },
  {
    code: "stock_rotation",
    name: "Rotation des stocks",
    domain: "commercial",
    axis: "analysis",
    definition:
      "Le nombre de fois qu'un stock se renouvelle dans la période, et sa réciproque, le nombre de jours qu'un article passe en réserve avant d'être vendu.",
    intuition:
      "Deux boutiques peuvent afficher exactement la même marge par article. Celle qui écoule son stock deux fois plus vite gagne deux fois plus d'argent avec le même argent immobilisé : la rotation est ce qui transforme une marge en rentabilité.",
    method:
      "Divisez le coût d'achat des marchandises vendues par le stock moyen de la période. Divisez ensuite la durée de la période par cette rotation pour obtenir la durée de stockage, qui est le nombre qui parle à une équipe de vente.",
    formula:
      "Rotation = coût d'achat des marchandises vendues / stock moyen ; durée de stockage = durée de la période / rotation",
  },
  {
    code: "average_basket",
    name: "Panier moyen et indice de vente",
    domain: "commercial",
    axis: "marketing",
    definition:
      "Ce que dépense un client qui achète, et le nombre d'articles qu'il emporte.",
    intuition:
      "Faire entrer davantage de monde coûte cher en communication et en vitrine. Faire emporter un article de plus à quelqu'un qui est déjà devant la caisse ne coûte presque rien, et c'est le levier que l'on oublie en premier.",
    method:
      "Divisez le chiffre d'affaires par le nombre de tickets, puis le nombre d'articles vendus par ce même nombre de tickets. Le premier rapport dit combien on dépense, le second dit pourquoi : un panier qui monte sans que l'indice bouge signale une hausse de prix, pas une vente additionnelle.",
    formula:
      "Panier moyen = chiffre d'affaires / nombre de tickets ; indice de vente = articles vendus / nombre de tickets",
  },
  {
    code: "conversion_rate",
    name: "Taux de transformation",
    domain: "commercial",
    axis: "marketing",
    definition: "La part des visiteurs entrés dans le point de vente qui en repartent avec un achat.",
    intuition:
      "La vitrine et la communication font entrer ; l'accueil, l'assortiment et la disponibilité font acheter. Un trafic qui monte pendant que le taux baisse est le signe qu'on a promis en vitrine ce qu'on ne tient pas en rayon.",
    method:
      "Comptez les entrées et les tickets sur la même période. Suivez la variation du taux plutôt que sa valeur absolue, qui ne se compare qu'à des points de vente de même format.",
    formula: "Taux de transformation = nombre de tickets / nombre de visiteurs",
  },
  {
    code: "assortment",
    name: "Assortiment : largeur et profondeur",
    domain: "commercial",
    axis: "marketing",
    definition:
      "Le nombre de familles de produits présentées en rayon, et le nombre de références proposées dans chacune.",
    intuition:
      "Large et peu profond, on répond à tout le monde sans satisfaire personne. Étroit et profond, on devient la référence d'une clientèle et on renonce assumément aux autres. Il n'y a pas de bon assortiment dans l'absolu, seulement un assortiment cohérent avec une clientèle nommée.",
    method:
      "Avant d'ajouter une famille, regardez ce que rapporte au mètre de linéaire celle qui lui cédera la place : une référence de plus n'ajoute du chiffre d'affaires que si elle en prend moins qu'elle n'en apporte.",
  },
  {
    code: "sales_per_sqm",
    name: "Rendement de la surface de vente",
    domain: "commercial",
    axis: "analysis",
    definition:
      "Ce que rapporte un mètre carré de vente, ou un mètre de linéaire, sur la période.",
    intuition:
      "La surface est la ressource rare d'un point de vente : elle est louée à l'année, elle ne s'agrandit pas, et chaque rayon doit payer la place qu'il occupe. C'est l'équivalent, pour une boutique, de ce que le taux d'occupation est pour un hôtel.",
    method:
      "Rapportez d'abord le chiffre d'affaires à la surface, puis la marge à la même surface, et comparez les rayons entre eux. C'est la seconde comparaison qui décide : un rayon qui fait du volume à faible marge peut occuper la meilleure place pour rien.",
    formula: "Rendement = chiffre d'affaires de la période / surface de vente en mètres carrés",
  },

  /* ────────────────────────────────────────────────────────────────────────
   * QUATRE NOTIONS QUE L'ÉLÈVE LIT DANS SES PROPRES COMPTES.
   *
   * Le registre s'est construit par le haut : on partait des référentiels, on
   * regardait ce qu'ils nomment, on ajoutait. C'est le mauvais sens. La
   * question qui compte n'est pas « qu'est-ce que l'arrêté nomme », c'est
   * « qu'est-ce que l'élève lit sans pouvoir le comprendre ».
   *
   * Or à chaque clôture il ouvre son compte de résultat, et y lit « excédent
   * brut d'exploitation », « dotations aux amortissements », « coût complet
   * unitaire », « commissions des canaux partenaires ». Aucune de ces quatre
   * lignes n'avait de fiche. La deuxième en avait même une TROMPEUSE : le
   * registre porte « tableau d'amortissement », qui parle du remboursement
   * d'un emprunt et non de l'usure d'un bien. L'élève qui cherchait tombait
   * sur la mauvaise.
   *
   * Deux d'entre elles figurent aussi dans le référentiel du BTS MCO, deux
   * n'y sont pas. C'est bien l'écran qui a décidé, pas le texte.
   * ──────────────────────────────────────────────────────────────────────── */
  {
    code: "ebitda_margin",
    name: "Excédent brut d'exploitation",
    domain: "profitability",
    axis: "analysis",
    definition:
      "Ce que l'exploitation dégage avant les amortissements, les intérêts et l'impôt : le premier chiffre qui dise si l'activité elle même gagne de l'argent.",
    intuition:
      "C'est le résultat débarrassé de trois choses qui ne viennent pas du métier : la façon dont l'entreprise a financé ses murs, la façon dont elle les amortit, et ce que le fisc lui prend. Deux boutiques identiques, dont l'une a emprunté et l'autre non, ont le même excédent brut et des résultats nets différents. C'est pour cela qu'on le regarde en premier quand on compare deux affaires.",
    method:
      "Partez de la marge sur coût variable, retranchez les charges de structure et les budgets engagés dans le tour. Ce qui reste est l'excédent brut. Retranchez ensuite les dotations aux amortissements et vous obtenez le résultat d'exploitation, le solde suivant : l'écart entre les deux est exactement ce que l'usure des biens a coûté.",
    formula: "EBE = marge sur coût variable − charges de structure − budgets du tour",
  },
  {
    code: "depreciation",
    name: "Dotation aux amortissements",
    domain: "costs",
    axis: "finance",
    definition:
      "La part du prix d'une immobilisation que l'exercice supporte, parce qu'il s'en est servi.",
    intuition:
      "Un agencement payé une fois sert plusieurs années. Le mettre entier dans les charges de l'année de l'achat écraserait ce résultat là et flatterait les suivants, alors que le magasin a travaillé pareil. On en étale donc le coût sur la durée d'usage. C'est une charge qui ne se décaisse pas : elle pèse sur le résultat sans rien sortir de la caisse, ce qui explique qu'une entreprise puisse afficher une perte sans manquer d'argent.",
    method:
      "Divisez la valeur d'entrée du bien par le nombre d'exercices pendant lesquels il servira. Ce que le bilan appelle valeur nette est ce qui n'a pas encore été amorti. À ne pas confondre avec le tableau d'amortissement d'un emprunt : celui là parle du remboursement d'une dette, celui ci de l'usure d'un bien. Le mot est le même, la chose n'a aucun rapport.",
    formula: "Dotation de l'exercice = valeur d'entrée / durée d'usage en exercices",
  },
  {
    code: "full_unit_cost",
    name: "Coût de revient complet",
    domain: "costs",
    axis: "analysis",
    definition:
      "Ce qu'une unité vendue a réellement coûté, une fois les charges de structure réparties sur le volume.",
    intuition:
      "Le coût variable dit ce que coûte la prochaine unité, le coût de revient ce que coûte une unité en moyenne. Les deux sont justes et ne répondent pas à la même question : le premier décide d'accepter une commande de plus, le second dit si le prix affiché tient sur l'année. Les confondre fait refuser des commandes rentables, ou vendre à perte en croyant gagner.",
    method:
      "Ajoutez au coût variable d'une unité la part de structure qu'elle porte, c'est à dire les charges de structure du tour divisées par les unités vendues. Ce coût baisse donc quand le volume monte, sans qu'aucune charge n'ait bougé : c'est l'effet du partage et non une économie. Un coût de revient calculé sur un tour creux fait donc peur pour rien.",
    formula: "Coût de revient unitaire = coût variable unitaire + charges de structure / unités vendues",
  },
  {
    code: "distribution_commission",
    name: "Commission de distribution",
    domain: "margins",
    axis: "analysis",
    definition:
      "La part du prix de vente que prélève le tiers qui a apporté le client.",
    intuition:
      "Une place de marché, un apporteur d'affaires, une centrale : le client paie le prix affiché, l'entreprise n'en encaisse qu'une partie. La commission ne se voit ni sur l'étiquette ni sur la facture du client, uniquement dans les comptes. C'est ce qui la rend facile à oublier quand on compare un canal à un autre, et c'est une charge, jamais une remise : une remise se négocie avec le client et se voit, une commission se négocie avec le partenaire et ne se voit pas.",
    method:
      "Appliquez le taux au chiffre d'affaires du canal, jamais à la marge. Retranchez le montant obtenu de la marge d'une vente en direct : l'écart est ce que le canal coûte par commande. Comparez ensuite les canaux par la marge qu'ils apportent et non par le nombre de commandes, car un canal commissionné pèse toujours moins dans la marge que dans les ventes.",
    formula: "Commission = taux × prix de vente ; marge après commission = prix − coût variable − commission",
  },
];

export const conceptByCode = new Map(CONCEPTS.map((c) => [c.code, c]));

/* ────────────────────────────────────────────────────────────────────────────
 * GRAPHE DES PRÉREQUIS (V2 couche 2, chantier #1).
 *
 * `A` figurant dans la liste de `B` se lit « avoir saisi A avant d'aborder B ».
 * C'est un DAG : cinq racines de démarrage (listes vides), aucune boucle, et
 * toute notion est atteignable depuis une racine. L'invariant est vérifié par
 * tests/architecture/notions-dag.test.ts, qui échoue au moindre cycle, code
 * inconnu, ou notion isolée.
 *
 * Portée : ce graphe et son seuil (PREREQUISITE_MASTERY_THRESHOLD) alimenteront
 * le filtrage par niveau et l'ordonnancement des situations (chantier #2). Les
 * situations DÉTECTÉES restent des moments réactifs, ouvertes sur leur seul
 * déclencheur — on ne cache pas un atelier avancé (VAN/TRI) derrière une chaîne
 * de maîtrise, sous peine de le rendre inatteignable en partie courte.
 *
 * Quatre arêtes ont été tranchées avec l'enseignant, contre la première ébauche :
 *  - `frng` ancré sur `fixed_costs` (et non `depreciation`) : on comprend le
 *    fonds de roulement comme « ressources durables − immobilisations » sans
 *    maîtriser le mécanisme d'amortissement, qui n'en est qu'un raffinement.
 *  - `bfr` ancré sur `stock` (et non `stock_rotation`) : le besoin en fonds de
 *    roulement se comprend AVANT les ratios de rotation, qui expliquent ensuite
 *    pourquoi il bouge. La rotation (KPI commercial) reste fille de `stock` : les
 *    deux sont sœurs, pas parent-enfant — les lier sur-verrouillerait la rotation.
 *  - `loan_schedule` conserve `net_treasury` : la fiche elle-même est écrite
 *    autour du risque de trésorerie (« engager sa trésorerie future »,
 *    « CAF < échéances = danger ») ; la détacher en ferait une racine ouverte
 *    au grand débutant, à rebours du gating recherché.
 *  - `ebitda_margin` placé en amont (marge & coût), avant le cycle
 *    trésorerie / VAN : c'est un solde de marge d'exploitation, pas une notion
 *    de gestion courante.
 * ──────────────────────────────────────────────────────────────────────────── */
export const CONCEPT_PREREQUISITES: Record<string, readonly string[]> = {
  // Niveau 1 — Découverte : racines (démarrage débutant, aucun prérequis)
  fixed_costs: [],
  variable_costs: [],
  demand_market_share: [],
  capacity: [],
  stock: [],

  // Niveau 2 — Fondamentaux
  revenue: ["demand_market_share"],
  price_elasticity: ["demand_market_share"],
  segmentation: ["demand_market_share"],
  seasonality: ["demand_market_share"],
  conversion_rate: ["demand_market_share"],
  productivity: ["capacity"],
  contribution_margin: ["revenue", "variable_costs"],

  // Niveau 3 — Marge & coût
  margin_rates: ["contribution_margin"],
  breakeven: ["contribution_margin", "fixed_costs"],
  full_unit_cost: ["fixed_costs", "variable_costs"],
  depreciation: ["fixed_costs"],
  psych_price: ["price_elasticity"],
  markup_coefficient: ["margin_rates"],
  stock_rotation: ["stock"],
  assortment: ["segmentation"],
  average_basket: ["revenue"],
  ebitda_margin: ["contribution_margin", "fixed_costs"],

  // Niveau 4 — Gestion courante
  dead_point: ["breakeven"],
  safety_margin: ["breakeven"],
  markdown: ["stock_rotation", "margin_rates"],
  frng: ["fixed_costs"],
  bfr: ["stock"],
  distribution_commission: ["margin_rates"],
  sales_per_sqm: ["average_basket"],

  // Niveau 5 — Analyse & trésorerie
  net_treasury: ["frng", "bfr"],
  receivables_financing: ["bfr"],
  profitability_vs_return: ["margin_rates", "breakeven"],
  loan_schedule: ["net_treasury"],

  // Niveau 6 — Investissement
  discounting: ["net_treasury", "profitability_vs_return"],
  irr_payback: ["discounting"],
};

/** Prérequis d'une notion (codes), liste vide si racine ou notion inconnue. */
export function prerequisitesOf(code: string): readonly string[] {
  return CONCEPT_PREREQUISITES[code] ?? [];
}
