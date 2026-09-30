# Socle de compétences — proposition à arbitrer

Engendré par `npx tsx scripts/socle-des-competences.ts --ecrire`.
Ne pas le corriger à la main : il se réécrit depuis `src/config/competences.ts`.

| | |
| --- | --- |
| familles | 15 |
| gestes | 82 |
| phrases d'atelier | 251 dans 15 ateliers |
| reprises par un geste | 251 |
| laissées de côté | 0 |

## Ce qui a été tranché, et pourquoi (2)

Ces phrases auraient pu fonder un geste à elles seules. Elles sont restées dans un
geste plus large, et le choix est écrit : sans trace, la question se reposera dans six
mois et sera tranchée dans l'autre sens, sans que personne ne sache qu'elle avait déjà
été examinée.

### `charge-ou-decaissement`

fitness:4:2 relie en plus le besoin en fonds de roulement négatif au financement du cycle, et aurait donc pu aller à besoin-en-fonds-de-roulement. Une phrase n'appartient qu'à un geste, sans quoi toute couverture de référentiel la compterait deux fois : elle reste où est son acte de tête, la distinction, et l'énoncé mentionne la suite.

- `cg1:3:0` Je distingue une charge d'un décaissement, et un produit d'un encaissement.
- `cg1:4:1` Je lis la production stockée au compte de résultat et je dis ce qu'elle est : un produit qui n'a rien encaissé.
- `fitness:4:2` Je distingue un produit encaissé d'un produit acquis, et je relie le besoin en fonds de roulement négatif au financement du cycle.

### `ce-qui-erode-la-marge`

ndrc:3:0 chiffre un retour produit, pas une remise. Le calcul est pourtant le même, ce qui part de la marge et le volume qu'il faut pour le rattraper, donc le geste ne se scinde pas : c'est son code qui promettait trop, et il a été renommé.

- `debutant:3:0` Je décide d'une promotion et j'en attends un effet précis.
- `debutant:3:1` Je comprends qu'une remise doit être compensée par davantage de ventes.
- `mco:3:0` Je calcule l'effet d'une remise sur ma marge unitaire et sur le volume qu'il faut vendre pour la compenser.
- `ndrc:3:0` Je chiffre ce qu'un retour produit retire à la marge d'une commande.
- `gpme:5:0` Je calcule ce qu'une remise retire à la marge et le volume qu'il faudrait pour la compenser.
- `mhr:2:0` Je mesure l'effet d'une baisse de tarif sur le remplissage qu'il faut gagner pour la compenser.

## Le socle, famille par famille

### Lire une situation et des comptes

*Ce qu'on fait avant de décider : comprendre ce qu'on a sous les yeux.*

#### `lire-les-comptes`

> Je lis les documents de synthèse d'une entreprise et j'en tire ce qu'elle possède, ce qu'elle doit, et ce qui lui reste.

5 phrases, 4 diplômes.

- `debutant:1:2` Je lis un résultat de fin de trimestre et j'y retrouve ma marge.
- `stmg:1:0` Je repère, dans la situation d'une entreprise, ce qu'elle vend, ce que cela lui coûte et ce qu'il lui reste.
- `stmg:1:2` Je lis un compte de résultat simple et j'y retrouve la décision que mon équipe a prise.
- `cg1:1:0` Je lis un bilan d'ouverture et j'en tire ce que l'entreprise possède, ce qu'elle doit et ce qui lui reste.
- `gpme:1:0` Je lis les documents de synthèse d'une PME et j'en tire ce qu'elle possède et ce qu'on lui doit.

#### `variable-ou-fixe`

> Je distingue une charge qui suit les ventes d'une charge qui tombe de toute façon, y compris sur des documents qui ne les séparent pas.

4 phrases, 4 diplômes.

- `stmg:2:0` Je distingue une charge qui augmente avec les ventes d'une charge qui tombe tous les trimestres.
- `cg1:2:0` Je distingue une charge variable d'une charge de structure sur un compte de résultat réel.
- `gea:1:0` Je distingue les charges fixes des charges variables dans les comptes d'une entreprise.
- `dcg:2:0` Je sépare les charges variables des charges fixes à partir de documents qui ne les distinguent pas.

#### `reperer-la-contrainte`

> Je repère la ressource qui limite l'activité, et je la distingue d'un simple manque de moyens.

2 phrases, 2 diplômes.

- `cg1:1:1` Je repère la contrainte qui limite l'activité, et je la distingue d'un simple manque de moyens.
- `gpme:1:1` Je repère que la ressource d'un cabinet est le temps de ses équipes, et qu'il ne se stocke pas.

#### `hierarchiser-un-diagnostic`

> Je formule un diagnostic écrit et hiérarchisé, destiné à quelqu'un qui n'a pas le temps de tout lire, sans recopier les documents.

4 phrases, 4 diplômes.

- `cg1:1:2` Je formule un diagnostic écrit, hiérarchisé, sans recopier les documents.
- `ndrc:1:2` Je formule un premier plan d'action commercial, chiffré et hiérarchisé.
- `gpme:1:2` Je rédige une note de diagnostic hiérarchisée, destinée à un dirigeant qui n'a pas le temps de tout lire.
- `dcg:1:2` Je hiérarchise les problèmes financiers d'une entreprise au lieu de les énumérer.

#### `charge-ou-decaissement`

> Je distingue une charge d'un décaissement et un produit d'un encaissement, et j'en tire ce qu'un résultat ne dit ni de la caisse ni du cycle qu'il faut financer.

3 phrases, 2 diplômes.

- `cg1:3:0` Je distingue une charge d'un décaissement, et un produit d'un encaissement.
- `cg1:4:1` Je lis la production stockée au compte de résultat et je dis ce qu'elle est : un produit qui n'a rien encaissé.
- `fitness:4:2` Je distingue un produit encaissé d'un produit acquis, et je relie le besoin en fonds de roulement négatif au financement du cycle.

#### `tenir-ensemble`

> Je construis un diagnostic qui tient ensemble l'activité, la rentabilité et la trésorerie d'une même période.

3 phrases, 2 diplômes.

- `gea:4:2` Je tiens ensemble la production, la marge et la trésorerie d'un trimestre de pointe.
- `gea:5:0` Je construis un diagnostic financier qui relie l'activité, la rentabilité et la trésorerie.
- `avance:6:0` Je construis un diagnostic stratégique qui relie la rentabilité, la trésorerie et la résistance au risque.

### Calculer un coût, une marge, un seuil

*Le calcul de gestion proprement dit, celui qui donne un chiffre à opposer à une intuition.*

#### `marge-unitaire`

> Je calcule une marge unitaire et un taux de marge à partir d'un prix d'achat et d'un prix de vente.

7 phrases, 6 diplômes.

- `debutant:1:0` Je calcule la différence entre un prix d'achat et un prix de vente.
- `cg1:2:1` Je calcule une marge sur coût variable unitaire et un taux de marge.
- `mco:1:0` Je calcule une marge unitaire et un taux de marque à partir d'un prix d'achat et d'un prix de vente.
- `mco2:1:0` Je calcule le ratio matières et la marge sur coût variable d'un couvert à partir des comptes de l'unité.
- `mhr:1:0` Je calcule un prix moyen par chambre et un taux d'occupation à partir des nuitées vendues et des chambres disponibles.
- `bistrot:1:0` Je calcule le ratio matières de chaque offre et je le situe par rapport à ce que vise la profession.
- `campus:1:1` Je calcule le coût variable d'une enceinte et la marge qu'un prix de vente en dégage.

#### `soldes-intermediaires`

> Je calcule les soldes intermédiaires de gestion et je repère celui qui explique le résultat.

1 phrases, 1 diplômes.

- `dcg:1:1` Je calcule les soldes intermédiaires de gestion et je repère celui qui explique le résultat.

#### `cout-de-revient`

> Je calcule un coût de revient unitaire à partir des charges et des entrées de la période.

3 phrases, 3 diplômes.

- `cg1:4:0` Je calcule un coût unitaire moyen pondéré à partir du stock initial et des entrées du trimestre.
- `gea:1:1` Je calcule un coût de revient unitaire par référence et la marge qu'un prix de vente en dégage.
- `avance:1:0` Je calcule un coût de revient à la palette à partir des charges d'un transporteur.

#### `couts-pertinents`

> Je distingue, dans un coût complet, ce qui est engagé de toute façon de ce que la décision ajoute, et je décide sur le second.

2 phrases, 1 diplômes.

- `avance:2:0` Je distingue, dans le coût de revient complet d'une palette, ce qui est engagé de toute façon de ce que la décision ajoute.
- `avance:2:1` Je calcule la marge qu'un lot payé sous le coût complet laisse tout de même, et je la compare à celle d'un retour à vide.

#### `seuil-de-rentabilite`

> Je calcule le volume qui couvre les charges de structure d'une période, et la marge de sécurité qui m'en sépare.

11 phrases, 8 diplômes.

- `stmg:2:1` Je calcule combien d'unités mon entreprise doit vendre pour ne rien perdre.
- `cg1:2:2` Je calcule un seuil de rentabilité en volume et en valeur, et j'en déduis une marge de sécurité.
- `mco:1:1` Je détermine le nombre d'articles à vendre pour couvrir les charges de structure du trimestre.
- `mco2:1:1` Je détermine le nombre de couverts qui couvre les charges d'un mois, et je le ramène à une journée type.
- `mco2:3:0` Je mesure ce qu'un mois creux fait au résultat d'une unité à charges fixes, et la marge de sécurité qui m'en sépare.
- `fitness:1:1` Je calcule la marge récurrente d'un adhérent et le nombre d'adhérents au seuil de rentabilité.
- `fitness:3:1` Je mesure ce qu'une charge fixe fait à un trimestre creux, et la marge de sécurité qui me sépare du seuil.
- `mhr:1:1` Je détermine le taux de remplissage qui couvre les charges de structure d'un trimestre.
- `bistrot:1:1` Je calcule la marge sur coût variable d'un couvert, offre par offre, et le seuil de rentabilité de l'établissement au mix que je prévois.
- `gea:1:2` Je détermine le volume de production qui absorbe les charges fixes du trimestre, au mix que je prévois de vendre.
- `dcg:2:1` Je calcule un seuil de rentabilité, une marge de sécurité et un levier opérationnel.

#### `ce-qui-erode-la-marge`

> Je mesure ce qu'une remise, un retour ou une baisse de tarif retire à la marge, et le volume qu'il faudrait pour la compenser.

6 phrases, 5 diplômes.

- `debutant:3:0` Je décide d'une promotion et j'en attends un effet précis.
- `debutant:3:1` Je comprends qu'une remise doit être compensée par davantage de ventes.
- `mco:3:0` Je calcule l'effet d'une remise sur ma marge unitaire et sur le volume qu'il faut vendre pour la compenser.
- `ndrc:3:0` Je chiffre ce qu'un retour produit retire à la marge d'une commande.
- `gpme:5:0` Je calcule ce qu'une remise retire à la marge et le volume qu'il faudrait pour la compenser.
- `mhr:2:0` Je mesure l'effet d'une baisse de tarif sur le remplissage qu'il faut gagner pour la compenser.

#### `resultat-ou-rentabilite`

> Je distingue le résultat d'une période de la rentabilité des capitaux qui l'ont produit.

1 phrases, 1 diplômes.

- `campus:5:0` Je distingue le résultat d'un trimestre de la rentabilité des capitaux qui l'ont produit.

### Fixer un prix et un volume

*La décision commerciale élémentaire, et le risque qu'on prend d'un côté ou de l'autre.*

#### `fixer-un-prix`

> Je fixe un prix de vente et je dis sur quoi je me suis appuyé pour le fixer.

4 phrases, 4 diplômes.

- `debutant:1:1` Je fixe un prix de vente et j'en explique la raison en une phrase.
- `stmg:1:1` Je fixe un prix de vente et je dis sur quoi je me suis appuyé pour le fixer.
- `cg1:2:3` Je fixe un prix de vente en tenant compte du seuil et de la réaction des clients.
- `mhr:3:1` Je fixe un tarif de haute saison adapté à la clientèle qui domine, sans transposer celui qui convenait à la clientèle d'avant.

#### `decider-un-volume`

> Je décide un volume à préparer, à commander ou à produire, en assumant explicitement de quel côté je prends le risque.

7 phrases, 4 diplômes.

- `debutant:2:0` Je choisis une quantité de marchandise à commander pour un trimestre.
- `debutant:4:1` Je décide un prix et une quantité ensemble pour un trimestre qui compte.
- `mco:4:2` Je dimensionne un approvisionnement en acceptant explicitement un risque.
- `mco2:1:2` Je fixe un prix et un volume à préparer en sachant ce que coûte un couvert jeté.
- `ndrc:4:2` Je dimensionne un budget d'acquisition et le stock qui va avec, pour le trimestre où chaque commande manquée coûte le plus.
- `fitness:1:2` Je fixe un prix et un volume de places à vendre en tenant compte de la capacité d'accueil réelle.
- `campus:3:2` Je règle un volume de production en assumant de quel côté je prends le risque.

#### `rupture-ou-surstock`

> Je chiffre ce que coûte une vente que je n'ai pas pu servir et ce que coûte ce que j'ai préparé pour rien.

5 phrases, 5 diplômes.

- `debutant:2:1` Je comprends ce que coûte un rayon vide et ce que coûte un rayon qui ne se vend pas.
- `stmg:3:2` Je choisis de produire plus que je ne vends, et j'explique ce que ce stock me coûte et ce qu'il me rapportera.
- `mco:4:1` J'évalue ce que coûte une rupture de stock et ce que coûte un surstock.
- `bistrot:1:2` Je fixe des couverts à préparer en pesant le client refusé contre la denrée jetée.
- `campus:3:1` Je chiffre le coût d'un stock d'invendus et celui d'une demande que je n'ai pas pu servir.

#### `repercuter-une-hausse`

> Je répercute une hausse de coût différemment selon la sensibilité au prix de chaque clientèle.

7 phrases, 5 diplômes.

- `mco2:3:1` Je répercute une hausse du prix des denrées en tenant compte de la sensibilité de chaque clientèle.
- `mhr:2:1` Je distingue les clientèles qui réservent au prix affiché de celles qui ne viennent qu'à prix cassé.
- `bistrot:3:0` Je mesure ce qu'une hausse des denrées fait au ratio matières, à la marge par couvert et au seuil de l'établissement.
- `bistrot:3:1` Je répercute une hausse de coût différemment selon l'élasticité de chaque clientèle, et je retravaille la carte quand le prix ne suffit pas.
- `avance:3:0` Je mesure ce qu'une hausse du carburant fait à la marge d'une palette et au poids du carburant dans le prix.
- `avance:3:1` Je répercute une hausse de coût différemment selon la sensibilité au prix de chaque clientèle.
- `campus:5:1` Je répercute une hausse du prix des matières en tenant compte de la sensibilité de chaque clientèle.

#### `prix-plancher`

> Je fixe un prix plancher qui tient compte du risque commercial d'habituer le marché à un tarif bas.

1 phrases, 1 diplômes.

- `avance:2:2` Je fixe un prix plancher qui tient compte du risque commercial d'habituer le marché à un tarif bas.

### Anticiper la demande

*Se servir du passé joué plutôt que d'attendre la période pour la subir.*

#### `anticiper-un-volume`

> J'anticipe un volume à partir de la saisonnalité de chaque clientèle et des périodes déjà jouées.

8 phrases, 6 diplômes.

- `debutant:2:2` Je relis mon trimestre précédent pour décider du suivant.
- `debutant:4:0` J'anticipe une forte demande à partir de mes trimestres précédents.
- `mco:4:0` J'anticipe un volume de ventes à partir de la saisonnalité et de mes trimestres précédents.
- `ndrc:4:0` J'anticipe un volume de commandes à partir des trimestres joués et de la saison.
- `fitness:3:0` J'anticipe un creux saisonnier à partir de la saisonnalité de chaque clientèle et de mes trimestres précédents.
- `mhr:3:0` J'anticipe une bascule de clientèles à partir de la saisonnalité de chaque segment et de mes trimestres précédents.
- `gea:4:0` J'anticipe un volume de production à partir de la saisonnalité et de mes trimestres précédents.
- `campus:3:0` J'estime la demande d'un trimestre à partir des trimestres joués et des décisions prises.

#### `prix-et-demande`

> Je relie une variation de prix à la variation de demande qu'elle provoque sur chaque clientèle.

1 phrases, 1 diplômes.

- `campus:2:1` Je relie une variation de prix de vente à la variation de demande qu'elle provoque sur chaque clientèle.

#### `un-marche-qui-change`

> Je repère l'événement qui change la taille du marché, et je dis ce qu'il exige de mon entreprise.

1 phrases, 1 diplômes.

- `stmg:3:0` Je repère l'arrivée d'un client qui change la taille du marché, et je dis ce qu'elle exige de mon entreprise.

### Piloter la trésorerie

*Le décalage entre ce qui est gagné et ce qui est encaissé, et ce qu'il faut en faire.*

#### `plan-de-tresorerie`

> Je construis un plan de trésorerie de la période à partir de décisions prévues et de délais de règlement, et j'y repère le point de tension.

6 phrases, 6 diplômes.

- `cg1:3:1` Je construis un budget de trésorerie à partir de décisions prévues et de délais de règlement.
- `fitness:4:1` Je construis un plan de trésorerie de trimestre et j'y repère ce qu'un encaissement d'avance déplace.
- `mhr:4:0` Je construis un plan de trésorerie de trimestre à partir de mes encaissements et de mes charges fixes.
- `gea:2:1` Je construis un plan de trésorerie de trimestre à partir des encaissements et des décaissements.
- `avance:4:1` Je construis un plan de trésorerie de trimestre de pointe et j'y repère le point de tension.
- `campus:4:1` Je construis un plan de trésorerie de trimestre et j'y repère le point de tension.

#### `chiffrer-un-besoin-de-financement`

> Je présente un besoin de financement chiffré et daté.

1 phrases, 1 diplômes.

- `cg1:3:2` Je présente un besoin de financement chiffré et daté.

#### `resultat-contre-caisse`

> J'explique l'écart entre le résultat d'une période et le solde de trésorerie, poste par poste.

3 phrases, 3 diplômes.

- `cg1:4:2` Je retrouve, poste par poste, où est passé l'argent d'un trimestre bénéficiaire : stock, créances, TVA à décaisser.
- `mhr:4:1` Je mesure l'effet d'un trimestre creux sur la caisse d'un établissement à charges lourdes.
- `gea:2:2` J'explique un écart entre le résultat comptable et le solde de trésorerie.

#### `effet-d-un-delai`

> Je mesure ce qu'un délai de règlement fait à la trésorerie, à résultat inchangé, et je le traduis en euros immobilisés.

9 phrases, 5 diplômes.

- `mco:2:1` Je mesure l'effet d'un délai de règlement fournisseur sur la trésorerie du magasin.
- `mco2:2:1` Je mesure l'effet d'un délai de règlement sur la trésorerie d'un mois, à résultat inchangé.
- `mco2:4:1` Je relie le chiffre d'affaires d'un mois à l'encaissement du mois suivant, selon le délai de chaque clientèle.
- `gpme:2:0` Je calcule le délai moyen de règlement de mes clients et je le traduis en euros immobilisés.
- `fitness:4:0` Je compare une offre annuelle encaissée d'avance à une offre trimestrielle sur le prix, la trésorerie et la fidélité.
- `mhr:3:2` Je relie le mix de clientèles du trimestre à son encaissement : qui paie comptant, qui paie à trente ou quarante-cinq jours.
- `bistrot:2:2` Je mesure ce qu'un paiement comptant fait à la trésorerie d'un établissement dont le résultat ne change pas.
- `bistrot:4:2` Je relie le mix servi à la trésorerie du trimestre : les banquets se règlent à trente jours, le midi et le soir comptant.
- `mco2:5:0` Je suis un encaissement attendu et je constate son arrivée dans la caisse du mois.

#### `besoin-en-fonds-de-roulement`

> Je repère le besoin en fonds de roulement dans un bilan et je le relie aux délais de règlement et au rythme de l'activité.

5 phrases, 4 diplômes.

- `gea:2:0` Je lis un bilan et j'y repère le besoin en fonds de roulement d'une entreprise.
- `gea:4:1` Je mesure l'effet d'une forte croissance des ventes sur le besoin en fonds de roulement.
- `dcg:1:0` Je construis un bilan fonctionnel et j'en tire le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette.
- `avance:4:0` Je relie le besoin en fonds de roulement d'un transporteur aux délais de règlement de ses clientèles et de ses fournisseurs.
- `campus:4:0` Je relie le besoin en fonds de roulement d'une entreprise aux délais de règlement de ses clientèles.

#### `financer-le-court-terme`

> Je compare ce que coûtent les façons de couvrir un besoin de trésorerie, et je rapporte ce coût à ce qu'il évite.

10 phrases, 6 diplômes.

- `cg1:4:3` Je propose une action qui libère de la trésorerie et je dis ce qu'elle coûte.
- `cg1:5:2` Je calcule le coût d'un escompte et celui d'un affacturage sur mes propres créances, au prorata du trimestre.
- `cg1:5:3` Je choisis de mobiliser ou non mes créances, et je justifie mon choix par le calcul.
- `mco2:4:2` Je décide d'une couverture du besoin de trésorerie et j'en assume le coût.
- `mco2:5:1` Je chiffre le coût d'un financement court terme et je le rapporte à ce qu'il a évité.
- `gpme:2:1` Je choisis entre attendre, relancer, escompter ou céder une créance, en comparant ce que chaque solution coûte.
- `mhr:4:2` Je décide d'une couverture du besoin de trésorerie et j'en assume le coût.
- `avance:4:2` Je compare l'escompte et l'affacturage sur leur coût, et je mesure le risque d'un chiffre d'affaires concentré sur un client.
- `avance:5:2` Je décide d'un placement des excédents de trésorerie en gardant une réserve de sécurité chiffrée.
- `campus:4:2` Je compare le coût d'un découvert, d'un escompte et d'un affacturage avant de choisir.

#### `tva`

> Je calcule une TVA à décaisser et j'explique pourquoi une taxe neutre pour le résultat pèse sur la trésorerie.

2 phrases, 1 diplômes.

- `cg1:5:0` Je calcule une TVA collectée, une TVA déductible et une TVA à décaisser.
- `cg1:5:1` J'explique pourquoi une taxe neutre pour le résultat pèse sur la trésorerie.

### Arbitrer sous contrainte de capacité

*Ce qui se joue quand tout ne peut pas être servi.*

#### `la-capacite-qui-bloque`

> Je repère laquelle de mes capacités bloque, et je borne mes ventes à la plus petite.

4 phrases, 3 diplômes.

- `stmg:3:1` Je calcule ce que ma capacité de production me permet de vendre au maximum dans un trimestre.
- `ndrc:4:1` Je vérifie que ma capacité de préparation suit le trafic que j'achète.
- `fitness:5:0` Je repère laquelle des deux capacités bloque, la surface ou l'encadrement, et je borne mes ventes à la plus petite.
- `bistrot:4:0` Je repère laquelle des deux capacités bloque, les places ou les heures de brigade, selon le mix que je sers.

#### `marge-par-unite-rare`

> Je classe des offres par la marge qu'elles dégagent rapportée à l'unité de capacité qu'elles consomment.

2 phrases, 2 diplômes.

- `bistrot:4:1` J'arbitre entre des offres qui n'ont ni la même marge ni le même temps de brigade par couvert, quand tout ne peut pas être servi.
- `gea:3:0` Je classe les références d'une gamme par leur marge rapportée à l'unité de capacité qu'elles consomment quand cette capacité manque.

#### `cout-de-la-saturation`

> J'évalue le manque à gagner d'une capacité saturée face à une demande qui monte.

2 phrases, 2 diplômes.

- `fitness:5:1` Je chiffre ce que la saturation coûte en attrition et en valeur vie, contre ce que rapportent les inscriptions supplémentaires.
- `gea:3:1` J'évalue le manque à gagner d'une capacité de production saturée face à une demande qui monte.

#### `arbitrer-entre-clienteles`

> J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.

1 phrases, 1 diplômes.

- `mco2:4:0` J'arbitre entre des clientèles quand la capacité ne permet pas de toutes les accueillir.

### Investir et recruter

*Les décisions dont l'effet arrive après la période où on les prend.*

#### `juger-un-investissement`

> J'évalue un investissement sur les flux que la décision change, et non sur son coût seul.

5 phrases, 4 diplômes.

- `gea:3:2` Je compare le coût d'une ligne de production à la marge supplémentaire qu'elle rend possible, en tenant compte du trimestre de retard avant sa mise en service.
- `dcg:3:0` J'évalue un projet d'investissement à partir des flux qu'il génère et non de son coût seul.
- `dcg-rse:3:1` Je décide d'un investissement propre en comparant son décaissement immédiat à la baisse durable des rebuts.
- `avance:5:0` Je retiens, dans un projet de renouvellement, les seuls flux que la décision change : entretien évité, carburant économisé, revente des anciens véhicules.
- `campus:5:2` Je décide d'un budget de qualité et d'entretien en le rapportant à ce qu'il évite de perdre.

#### `valeur-d-aujourd-hui`

> Je ramène des flux étalés sur plusieurs périodes à leur valeur d'aujourd'hui, et je décide sur leur somme.

1 phrases, 1 diplômes.

- `avance:5:1` Je ramène des flux étalés sur plusieurs années à leur valeur d'aujourd'hui, et je décide sur leur somme.

#### `quand-recruter`

> Je calcule ce qu'un recrutement doit produire pour se payer, et je situe le moment entre la surcharge et l'embauche qui devance le carnet.

5 phrases, 3 diplômes.

- `gpme:4:0` Je calcule le nombre de journées qu'un consultant supplémentaire doit vendre pour se payer.
- `gpme:4:1` Je situe le moment où recruter, entre la surcharge qui fait perdre des clients et l'embauche qui devance le carnet.
- `gpme:4:2` Je prépare une décision d'embauche argumentée devant un dirigeant qui la financera.
- `bistrot:3:2` Je dimensionne une brigade et une cuisine pour une saison que je ne verrai qu'au trimestre suivant.
- `avance:3:2` Je dimensionne un véhicule et un recrutement pour un pic que je ne verrai qu'au trimestre suivant.

#### `choisir-un-financement`

> Je compare des modes de financement sur leur coût et sur ce qu'ils font à la structure du bilan.

1 phrases, 1 diplômes.

- `dcg:3:1` Je compare des modes de financement sur leur coût et sur ce qu'ils font à la structure du bilan.

### Conquérir et garder une clientèle

*Ce que vaut un client, ce qu'il coûte à acquérir, et ce qui le fait revenir.*

#### `acheter-ou-fideliser`

> Je distingue un chiffre d'affaires qu'il faut refaire à chaque période d'un chiffre d'affaires qui se reconduit tant que le client reste.

3 phrases, 2 diplômes.

- `ndrc:1:0` Je distingue une clientèle qu'il faut acheter d'une clientèle qui revient d'elle-même.
- `fitness:1:0` Je distingue un chiffre d'affaires qu'il faut refaire chaque trimestre d'un chiffre d'affaires qui se reconduit tant que le client reste.
- `avance:1:2` Je décide d'un premier équilibre entre une clientèle régulière et une clientèle volatile.

#### `cout-d-acquisition`

> Je calcule ce que coûte l'acquisition d'un client et je le compare à la marge qu'il dégage.

2 phrases, 1 diplômes.

- `ndrc:2:0` Je calcule un coût d'acquisition client à partir d'un budget engagé et de clients réellement venus.
- `ndrc:2:1` Je compare ce coût à la marge dégagée par une commande, et j'en tire une conclusion.

#### `valeur-dans-la-duree`

> Je mesure ce qu'un client rapporte avant de partir, et le taux auquel ma clientèle se renouvelle.

3 phrases, 1 diplômes.

- `ndrc:2:2` Je distingue un client rentable dès la première commande d'un client rentable seulement s'il revient.
- `fitness:2:0` Je mesure un taux d'attrition et je le décompose par clientèle, les inscrits de janvier ne restant pas comme les pratiquants réguliers.
- `fitness:2:1` Je calcule la valeur vie d'un client comme la somme des marges qu'il rapportera avant de partir.

#### `recruter-ou-retenir`

> Je distingue une action qui recrute des clients d'une action qui retient ceux que j'ai, et je chiffre ce que j'attends de chacune.

5 phrases, 2 diplômes.

- `mco:3:2` Je distingue une opération qui recrute des clientes d'une opération qui déplace des ventes.
- `mco2:3:2` Je choisis les actions commerciales d'un mois creux et je chiffre ce que j'en attends.
- `ndrc:3:2` Je propose une politique de service, avec ce qu'elle coûte et ce qu'elle évite.
- `fitness:2:2` Je choisis un levier de rétention en comparant ce qu'il coûte maintenant à ce qu'il rapporte sur la durée.
- `fitness:3:2` Je choisis les actions de relation client d'un trimestre creux, en distinguant ce qui retient de ce qui recrute.

#### `qualite-et-frequentation`

> Je relie le niveau de service ou de qualité d'une période à la fréquentation de la suivante.

3 phrases, 3 diplômes.

- `mco2:2:2` Je relie la qualité des denrées à la fréquentation du service du soir.
- `ndrc:3:1` Je relie le niveau de service rendu à la fidélité de la clientèle du trimestre suivant.
- `bistrot:2:1` Je relie la qualité des denrées à la fréquentation de la carte du soir, par la réputation qu'elle construit.

#### `dependance-a-un-client`

> J'évalue ce que représente un client dans mon activité avant de décider de le perdre.

1 phrases, 1 diplômes.

- `gpme:5:1` J'évalue ce que représente un client dans mon activité avant de décider de le perdre.

#### `situer-son-offre`

> Je situe mon offre par rapport aux clientèles qui la fréquentent.

2 phrases, 2 diplômes.

- `mco:1:2` Je situe l'assortiment du magasin par rapport aux clientèles qui le fréquentent.
- `mhr:1:2` Je situe l'offre de l'hôtel par rapport aux clientèles qui le fréquentent.

### Acheter et négocier

*L'autre côté de la marge : ce qu'on paie, et ce qu'un intermédiaire prélève.*

#### `comparer-des-fournisseurs`

> Je compare des fournisseurs sur plusieurs critères, pas seulement sur leur prix, et je pondère.

5 phrases, 4 diplômes.

- `mco:2:0` Je compare des offres fournisseurs sur autre chose que leur prix.
- `mco2:2:0` Je compare des fournisseurs sur le prix, la qualité, le délai de règlement et le risque de rupture.
- `fitness:5:2` Je sélectionne un partenariat, comité d'entreprise, mutuelle, club, en le jugeant sur sa marge, son délai de règlement et la place qu'il prend.
- `bistrot:2:0` Je compare des fournisseurs sur plusieurs critères, prix, qualité, délai et fiabilité, et je pondère.
- `dcg-rse:3:0` Je choisis un fournisseur en pesant son coût, sa qualité et l'empreinte que le rapport lui attribue d'après ces deux critères.

#### `preparer-une-negociation`

> Je prépare une négociation en identifiant ce que j'apporte à l'autre.

1 phrases, 1 diplômes.

- `ndrc:5:2` Je prépare une négociation en identifiant ce que j'apporte au partenaire.

#### `repondre-sans-rompre`

> Je construis une réponse commerciale qui n'est ni l'acceptation ni le refus sec.

1 phrases, 1 diplômes.

- `gpme:5:2` Je construis une réponse commerciale qui n'est ni l'acceptation ni le refus sec.

#### `ce-que-preleve-un-canal`

> Je calcule la marge qui reste après ce qu'un canal ou un partenaire prélève, et je la compare à celle d'une vente en direct.

4 phrases, 2 diplômes.

- `ndrc:1:1` Je repère ce qu'un canal de vente prélève avant que la marge n'arrive dans l'entreprise.
- `ndrc:5:0` Je calcule la marge qui reste après la commission d'un partenaire.
- `ndrc:5:1` Je compare un volume apporté par un tiers à un volume conquis en direct.
- `avance:1:1` Je compare la marge d'un contrat industriel à celle d'un chargement de la bourse de fret.

### Nommer et arbitrer un risque

*Le risque comme objet chiffré, pas comme adjectif.*

#### `chiffrer-un-risque`

> Je chiffre l'impact d'un risque plutôt que de le qualifier de fort ou faible.

1 phrases, 1 diplômes.

- `gpme:3:1` Je chiffre l'impact d'un risque plutôt que de le qualifier de fort ou faible.

#### `identifier-les-risques`

> J'identifie les risques propres à ma structure, dont la dépendance à un donneur d'ordres.

1 phrases, 1 diplômes.

- `gpme:3:0` J'identifie les risques propres à une petite structure, dont la dépendance à un donneur d'ordres.

#### `supporter-reduire-transferer`

> J'arbitre entre supporter un risque, le réduire, et le transférer à un tiers.

1 phrases, 1 diplômes.

- `gpme:3:2` J'arbitre entre supporter un risque, le réduire et le transférer à un assureur.

#### `reputation-ou-finance`

> Je distingue un risque de réputation d'un risque financier et j'estime la portée de chacun.

1 phrases, 1 diplômes.

- `dcg-rse:5:1` Je distingue un risque de réputation d'un risque financier et j'estime la portée de chacun.

#### `decider-avec-le-risque`

> Je décide en tenant compte du risque autant que du rendement, et je relie mon exposition à ce qu'une baisse de demande me ferait.

2 phrases, 1 diplômes.

- `dcg:2:2` Je relie le niveau du levier au risque que prend l'entreprise quand la demande baisse.
- `dcg-rse:5:2` Je décide en dernier tour en tenant compte du risque autant que du rendement.

### Prévoir, puis se confronter au réel

*Écrire ses hypothèses avant, et répondre de l'écart après.*

#### `budget-et-hypotheses`

> Je construis un budget de période dont j'écris les hypothèses avant de connaître le réel, et j'annonce l'effet que j'attends d'une décision.

3 phrases, 1 diplômes.

- `dcg:3:2` Je construis un plan de trésorerie et un budget de trimestre dont j'écris les hypothèses avant de connaître le réel.
- `dcg:4:0` Je construis un budget de trimestre à partir des exercices écoulés et d'hypothèses que je nomme.
- `dcg-rse:4:2` J'intègre ces retours différés dans un plan de financement et une politique d'effectif.

#### `annoncer-l-effet-attendu`

> Je modifie une décision et j'annonce à l'avance l'effet que j'en attends.

1 phrases, 1 diplômes.

- `stmg:2:2` Je modifie une décision et j'annonce à l'avance l'effet que j'en attends sur le résultat.

#### `decomposer-un-ecart`

> Je décompose un écart global en écart sur prix, sur volume et sur coûts.

2 phrases, 2 diplômes.

- `campus:2:0` Je décompose un écart de coût entre ce qui vient du volume et ce qui vient du prix des charges.
- `dcg:4:1` Je décompose un écart global en écart sur prix, sur volume et sur coûts.

#### `decision-ou-marche`

> Je distingue un écart imputable à une décision d'un écart imputable au marché.

1 phrases, 1 diplômes.

- `dcg:4:2` Je distingue un écart imputable à une décision d'un écart imputable au marché.

#### `mesurer-l-effet-d-une-action`

> Je mesure l'écart entre ma prévision et le réalisé, j'en cherche la cause, et je corrige la période suivante.

3 phrases, 3 diplômes.

- `debutant:3:2` Je compare un trimestre avec promotion à un trimestre sans.
- `cg1:3:3` Je mesure l'écart entre ma prévision et le réalisé, et j'en cherche la cause.
- `mco2:5:2` Je corrige une politique commerciale à partir de ce que les deux mois précédents ont montré.

### Rendre compte

*Ce qui reste d'une gestion quand la partie est finie : un écrit, un oral, une trace.*

#### `tableau-de-bord`

> Je construis un tableau de bord qui tient sur une page et qui se lit.

7 phrases, 5 diplômes.

- `mco:5:0` Je construis un tableau de bord commercial qui tient sur une page et qui se lit.
- `mco2:6:0` Je construis un tableau de bord mensuel qui tient sur une page et qui se lit.
- `ndrc:6:0` Je construis un tableau de bord commercial qui tient sur une page et qui se lit.
- `fitness:6:0` Je construis un tableau de bord de la relation client qui tient sur une page et qui se lit.
- `gpme:6:0` Je construis un tableau de bord de PME qui tient sur une page et qui se lit.
- `mhr:5:0` Je construis un tableau de bord de direction qui tient sur une page et qui se lit.
- `bistrot:5:0` Je construis un tableau de bord d'exploitation qui tient sur une page et qui se lit.

#### `choisir-ses-indicateurs`

> Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.

9 phrases, 7 diplômes.

- `stmg:4:0` Je choisis, parmi les indicateurs disponibles, les trois qui expliquent le mieux le résultat de mon entreprise.
- `mco:5:1` Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.
- `mco2:6:1` Je choisis les indicateurs qui expliquent mon résultat et j'écarte ceux qui l'habillent.
- `ndrc:6:1` Je choisis les indicateurs qui expliquent la performance, et j'écarte ceux qui la décorent.
- `fitness:6:1` Je choisis les indicateurs qui expliquent mon portefeuille, et j'écarte ceux qui l'habillent.
- `mhr:5:1` Je choisis les indicateurs qui expliquent mon résultat, et j'écarte ceux qui l'habillent.
- `bistrot:5:1` Je choisis les indicateurs qui expliquent mon résultat, ratio matières, ticket moyen, taux de remplissage, et j'écarte ceux qui l'habillent.
- `gea:5:1` Je choisis les indicateurs qui expliquent la situation de l'entreprise, et j'écarte ceux qui l'habillent.
- `avance:6:1` Je choisis les indicateurs qui expliquent une trajectoire, et j'écarte ceux qui l'habillent.

#### `ecrire-une-note`

> Je rédige un écrit professionnel qui explique des résultats plutôt qu'il ne les décrit.

4 phrases, 4 diplômes.

- `debutant:4:2` Je fais le bilan d'une année de gestion en quelques phrases.
- `cg1:6:2` Je rédige une note de gestion qui explique des résultats plutôt que de les décrire.
- `gpme:2:2` Je rédige une procédure de relance applicable par une PME sans service de recouvrement.
- `dcg:5:0` Je rédige un rapport de gestion qui relie décisions, écarts et situation financière.

#### `presenter-a-l-oral`

> Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.

9 phrases, 7 diplômes.

- `stmg:4:1` Je présente oralement une décision de gestion et ses conséquences chiffrées sur un exercice complet.
- `cg1:6:3` Je présente une analyse à l'oral et je réponds à une question chiffrée.
- `mco:5:2` Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.
- `mco2:6:2` Je présente oralement six mois d'exploitation, leurs réussites et leurs erreurs.
- `ndrc:6:2` Je présente oralement une gestion commerciale, ses réussites et ses erreurs, devant un jury.
- `fitness:6:2` Je présente oralement cinq trimestres de pilotage, leurs réussites et leurs erreurs, devant un jury.
- `mhr:5:2` Je présente oralement une année de direction, ses réussites et ses erreurs, devant un jury.
- `bistrot:5:2` Je présente oralement quatre trimestres d'exploitation, leurs réussites et leurs erreurs, devant un jury.
- `gea:5:2` Je présente oralement une gestion, ses réussites et ses erreurs, devant un jury.

#### `repondre-aux-objections`

> Je réponds à des questions portant sur mes méthodes autant que sur mes chiffres, sans esquiver les arbitrages perdants.

4 phrases, 3 diplômes.

- `gpme:6:2` Je présente oralement une gestion et je réponds aux objections d'un dirigeant.
- `dcg:5:2` Je réponds à des questions portant sur mes méthodes de calcul, pas seulement sur mes chiffres.
- `dcg-rse:6:2` Je soutiens un rapport et je réponds aux objections d'un jury sans esquiver les arbitrages perdants.
- `avance:6:2` Je défends oralement une stratégie et ses arbitrages devant un jury qui conteste.

#### `assumer-une-erreur`

> Je reconnais une décision ou une hypothèse fausse, et j'en tire une conséquence, sans chercher d'excuse extérieure.

3 phrases, 3 diplômes.

- `stmg:4:2` Je reconnais une erreur de gestion et je dis ce que je ferais autrement, sans chercher d'excuse extérieure.
- `dcg:5:1` J'assume publiquement une hypothèse qui s'est révélée fausse et j'en tire une conséquence.
- `campus:7:2` Je reçois un classement et j'en tire ce que je referais autrement.

#### `relier-decisions-et-resultats`

> Je relie les décisions prises aux résultats obtenus, sans en attribuer le mérite au hasard.

1 phrases, 1 diplômes.

- `gpme:6:1` Je relie les décisions prises et les résultats obtenus, sans en attribuer le mérite au hasard.

#### `rendre-compte-de-sa-part`

> Je rends compte de ce que mon poste a apporté à une décision collective.

1 phrases, 1 diplômes.

- `campus:6:2` Je rends compte oralement de ce que mon poste a apporté à une décision collective.

#### `expliquer-a-un-profane`

> J'explique une décision de gestion à quelqu'un qui n'a pas ma formation.

1 phrases, 1 diplômes.

- `campus:1:2` J'explique une décision de gestion à quelqu'un qui n'a pas ma formation.

### Décider en équipe

*Ce qu'un jeu d'entreprise fait travailler et qu'un dossier ne fait pas.*

#### `tenir-un-poste`

> Je tiens un poste de direction nommé et j'en réponds devant mon équipe.

1 phrases, 1 diplômes.

- `campus:1:0` Je tiens un poste de direction nommé et j'en réponds devant mon équipe.

#### `defendre-un-choix`

> Je défends un choix devant des collègues ou un comité qui ont décidé autrement.

3 phrases, 3 diplômes.

- `mco:2:2` Je défends un choix d'approvisionnement devant des collègues qui ont choisi autrement.
- `mhr:2:2` Je défends une politique tarifaire devant des collègues qui ont choisi autrement.
- `campus:2:2` Je défends devant un comité une proposition qui vient de mon poste.

#### `decider-sous-contrainte`

> Je décide sous contrainte de temps, avec un public qui suit mes chiffres.

1 phrases, 1 diplômes.

- `campus:7:0` Je décide sous contrainte de temps, à cinq postes, avec un public qui suit mes chiffres.

#### `lire-le-jeu-d-un-autre`

> J'analyse la gestion d'une autre équipe et j'explique ce que sa décision va produire.

1 phrases, 1 diplômes.

- `campus:7:1` J'analyse en direct la partie d'une autre équipe et j'explique ce que sa décision va produire.

### Piloter l'extra-financier

*Ce qui ne se lit pas dans le résultat mais finit par y entrer.*

#### `lire-un-indice-esg`

> Je lis un indice extra-financier et j'explique ce que mesure chacun de ses piliers.

1 phrases, 1 diplômes.

- `dcg-rse:1:0` Je lis un indice extra-financier et j'explique ce que mesure chacun de ses trois piliers.

#### `empreinte-d-une-decision`

> Je relie une décision de gestion à son empreinte environnementale, sociale ou de gouvernance.

1 phrases, 1 diplômes.

- `dcg-rse:1:1` Je relie une décision de gestion à son empreinte environnementale, sociale ou de gouvernance.

#### `depense-ou-engagement`

> Je distingue une dépense qui agit dans la période d'un engagement qui se capitalise, et je décide de le maintenir ou de l'ajuster sur l'horizon qui me reste.

3 phrases, 1 diplômes.

- `dcg-rse:1:2` Je justifie un premier montant d'engagement en le confrontant à la marge qu'il ampute.
- `dcg-rse:2:0` Je distingue une dépense qui agit dans le trimestre d'un engagement qui se capitalise dans la durée.
- `dcg-rse:2:2` Je décide de maintenir ou d'ajuster un engagement en raisonnant sur l'horizon de la partie.

#### `effets-differes-d-un-engagement`

> Je relie un engagement à l'effet mesurable qu'il produit plus tard, et je l'impute aux décisions qui l'ont fait bouger.

2 phrases, 1 diplômes.

- `dcg-rse:3:2` Je suis l'évolution du taux de rebuts et je l'impute aux décisions qui l'ont fait bouger.
- `dcg-rse:4:1` Je relie un engagement social à un turnover réduit et aux coûts de recrutement évités.

#### `capital-d-image`

> Je lis l'effet différé d'un capital d'image sur la part de marché et sur les conditions que m'accorde la banque.

2 phrases, 1 diplômes.

- `dcg-rse:2:1` Je lis l'effet différé d'un capital d'image sur la part de marché.
- `dcg-rse:4:0` Je relie un capital d'image à la confiance de la banque et à des conditions de découvert plus favorables.

#### `commenter-une-trajectoire-esg`

> Je commente une trajectoire extra-financière en distinguant la mesure de l'engagement qui l'a produite.

1 phrases, 1 diplômes.

- `dcg-rse:6:1` Je commente une trajectoire ESG et une empreinte en distinguant la mesure de l'engagement qui l'a produite.

#### `parties-prenantes`

> J'anticipe la réaction des parties prenantes à partir du niveau atteint.

1 phrases, 1 diplômes.

- `dcg-rse:5:0` J'anticipe une réaction des parties prenantes à partir du standing RSE atteint.

### Travailler la donnée

*Le geste outillé : sortir un chiffre, le contrôler, en faire une série.*

#### `controler-un-export`

> J'exporte des données de gestion et je les contrôle avant de les utiliser.

1 phrases, 1 diplômes.

- `cg1:6:0` J'exporte des données de gestion et je les contrôle avant de les utiliser.

#### `construire-une-serie`

> Je construis une série sur plusieurs périodes et j'en tire une évolution lisible.

2 phrases, 2 diplômes.

- `cg1:6:1` Je construis une série sur plusieurs périodes et j'en tire une évolution.
- `dcg-rse:6:0` Je consolide des indicateurs extra-financiers sur plusieurs exercices en une synthèse lisible.

#### `lire-un-classement`

> Je lis un classement multicritère et je repère la dimension qui me coûte des points.

1 phrases, 1 diplômes.

- `campus:6:1` Je lis un classement multicritère et je repère la dimension qui me coûte des points.

#### `decider-selon-l-ecart-au-classement`

> Je décide un dernier tour en fonction de l'écart qui me sépare de la place que je vise.

1 phrases, 1 diplômes.

- `campus:6:0` Je décide un dernier tour en fonction de l'écart qui me sépare de la place que je vise.

#### `lire-un-indicateur`

> Je lis un indicateur d'activité et j'en tire ce qui se passe sur le terrain.

1 phrases, 1 diplômes.

- `mco:3:1` Je lis un taux de transformation et j'en tire ce qui se passe en rayon.

