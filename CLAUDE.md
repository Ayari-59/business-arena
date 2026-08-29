# Consignes de travail sur BUSINESS ARENA

## Mise en production

**Fusion directe autorisée.** Quand un travail est terminé et vérifié, le fusionner
dans `main` et le pousser, sans demander confirmation. Vercel déploie sur `main`, et
`vercel-build` applique les migrations avant de compiler : la fusion est donc la mise
en production.

Trois conditions, toutes obligatoires :

1. la suite complète passe, ainsi que `tsc --noEmit` et `npm run build` ;
2. le parcours navigateur passe, quand le changement touche une page ;
3. la branche se fusionne sans conflit.

Une seule de ces conditions qui manque, et on ne fusionne pas : on le dit.

Ce qui reste à demander : supprimer ou écraser des données, changer une grille
tarifaire, publier au nom de l'établissement, et tout ce qui ne se rattrape pas par
un commit d'annulation.

## Écriture

**Aucun tiret en milieu de phrase**, dans toute la prose française : pages, scénarios,
situations, ateliers, messages de commit. Les deux-points, la virgule et le point
suffisent. Le trait d'union des mots composés reste bien sûr permis.

**Aucun chiffre de configuration dans une prose statique.** Les volumes, les prix, les
délais et le nombre de secteurs se lisent de la donnée jouée ou du registre. Un chiffre
écrit à la main devient faux sans prévenir, et c'est arrivé plusieurs fois : les récits
d'offres de commande, le comptage des entreprises sur la page d'accueil. Des tests le
gardent, ne les contournez pas.

## Vérification

Une garde n'est pas acquise tant qu'on ne l'a pas vue ROUGE. Casser volontairement ce
qu'elle protège, constater l'échec, restaurer. Une garde qui ne peut pas échouer ne
protège rien et fait croire le contraire : la retirer plutôt que la garder.

Ce que la suite ne voit pas se vérifie dans un vrai navigateur, sur le build de
production servi localement, base de données comprise. Les défauts trouvés en recette
vivaient tous ENTRE des pièces justes, jamais dedans.
