# Référentiels officiels

Les PDF déposés ici ne sont **pas versionnés** : le dépôt est public, et on n'y
republie pas les textes du ministère. Seules les listes qu'on en extrait
vivent dans le code, avec la mention de leur source.

Le conteneur est éphémère : les PDF disparaissent avec la session. Ce fichier
dit donc ce qui a été lu, quand, et ce qu'on en a tiré, pour que la
vérification suivante n'ait pas à tout refaire.

## Ce qui a été vérifié sur le texte

| document | ce qu'il a servi à vérifier | résultat |
|---|---|---|
| Programme de sciences de gestion et numérique de première STMG, annexe 3 | les thèmes cités par l'animation de découverte | **quatre** thèmes : de l'individu à l'acteur, numérique et intelligence collective, création de valeur et performance, temps et risque. « Évaluation et performance », que le produit citait, n'existe pas |
| Programme de management, sciences de gestion et numérique de terminale STMG, annexe 2 | les thèmes de l'enseignement commun | **trois** thèmes : les organisations et l'activité de production de biens et de services, les organisations et les acteurs, les organisations et la société. Conformes à ce que le produit affichait |
| Arrêté du 8 juillet 2024 modifiant l'arrêté du 15 octobre 2018, BTS management commercial opérationnel | les quatre blocs de compétences et les savoirs associés | les quatre intitulés du produit sont exacts, celui du bloc 4 compris |

| Référentiel du BTS Négociation et digitalisation de la relation client | les trois blocs de compétences | conformes : relation client et négociation-vente, relation client à distance et digitalisation, relation client et animation de réseaux |
| Référentiel du BTS Gestion de la PME | le mot du référentiel et les quatre intitulés | **deux erreurs**. Le texte parle de **blocs de compétences**, le produit disait « activités », mot qui y désigne le découpage fin à l'intérieur d'un bloc. Et deux intitulés sur quatre étaient tronqués, amputés du « de la PME » qui les termine |
| Référentiel du BTS Support à l'action managériale | rien pour l'instant | aucun atelier ne vise ce diplôme. Ses blocs, pour mémoire : optimisation des processus administratifs, gestion de projet, collaboration à la gestion des ressources humaines, et une culture économique, juridique et managériale |

## Ce qui reste à vérifier

- **Le programme de management de première STMG** : son annexe n'a pas été
  déposée. Les trois thèmes cités par le produit viennent de recherches
  concordantes, pas du texte.
- **BTS CG** : le mot est confirmé, ce diplôme découpe bien le métier en
  **processus**. Ses cinq intitulés, eux, n'ont pas été relus sur l'arrêté.
- **DCG** : ni le mot ni les intitulés n'ont été vérifiés. Le produit lui prête
  des « unités d'enseignement ».

## Notions : ce que l'arrêté du BTS MCO nomme, et ce qu'il ne nomme pas

Nommées par le texte, et présentes au registre : rotation des stocks (dont le
texte retient l'effet sur la rentabilité), assortiment, marchandisage et la
mesure de ses performances.

Absentes du texte, mais ajoutées au registre parce qu'elles sont le vocabulaire
du métier : coefficient multiplicateur, démarque, panier moyen et indice de
vente, taux de transformation. L'arrêté les couvre par des formules plus
larges : « les principaux outils de fixation du prix », « les indicateurs de
gestion des stocks », « la mesure des performances du marchandisage ».

Nommées par le texte et **manquantes** au registre : les soldes intermédiaires
de gestion, les amortissements et provisions, les méthodes de valorisation des
stocks, le coût de passation et de possession des stocks, la gamme, le
positionnement, la gestion des risques d'une unité commerciale.

## Une note sur la souplesse

Le registre `src/config/ateliers/referentiels.ts` est une référence, pas un
carcan. Le mot qui découpe un métier reste un choix d'affichage, et un intitulé
raccourci pour tenir dans une fiche n'est pas une faute : la garde compare le
fond, sans accents, sans casse et sans le préfixe qui numérote. Une filière
absente du registre n'est pas bloquée, elle n'est simplement pas confrontée à
un texte.
