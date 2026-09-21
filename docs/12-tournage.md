# 12 · Tournage des capsules vidéo

Ce document sert à filmer, pas à décider. Il suppose tranchées les questions
de fond (à qui l'on parle, ce qu'on montre) et donne ce qui manque devant
l'écran : le plateau, l'état exact de l'application, et le déroulé plan par
plan avec le texte à dire.

Quatre capsules, indépendantes, dans l'ordre où elles servent à quelqu'un qui
découvre. Chacune tient sous trois minutes : au-delà, on ne regarde plus, on
cherche le passage utile — et un passage qu'on cherche aurait dû être une
capsule à part.

---

## Le plateau

**Le monde de démonstration.** Il se crée d'un bouton dans `/admin` —
« Générer le monde démo » — ou en ligne de commande par `npm run seed:demo`.
Il installe un établissement, un compte enseignant, **quatre élèves nommés**,
une partie de classe **trois tours déjà joués** et un concours en phase
d'inscriptions.

Sa **graine est fixe** (`GRAINE_DEMO`, dans `src/services/demo.service.ts`) :
les tirages d'événements, les bots et les résultats des trois tours sont
identiques à chaque création. Une prise ratée se refait donc à l'identique,
et un chiffre lu à l'oral reste vrai au montage. Le monde est **idempotent** :
si les comptes existent déjà, rien n'est recréé — pour repartir de zéro, il
faut supprimer l'établissement démo avant de re-générer.

Le quatrième tour est celui de la tension de trésorerie. C'est le tour à
jouer en direct : il a une situation qui mord.

**Avant d'enregistrer**

| À faire | Pourquoi |
| --- | --- |
| Fenêtre à 1440 × 900, zoom navigateur à 100 % | Au-delà, le texte de l'application devient illisible à la lecture d'une vidéo compressée |
| Masquer barre de favoris, extensions, notifications | Une notification en plein plan oblige à refaire la prise |
| Deux profils de navigateur ouverts (enseignant / élève) | L'identité élève tient dans un cookie : deux onglets du même profil, c'est un seul élève |
| Thème clair si la vidéo doit être projetée en salle | Le fond sombre se délave au vidéoprojecteur |
| Pas de vraies données d'élèves à l'écran | Le monde démo porte des prénoms inventés ; s'en tenir à lui |

**Les chiffres cités à l'oral** doivent être lus à l'écran au moment où on les
dit. Un chiffre annoncé de mémoire finit toujours par contredire l'image.

---

## Capsule 1 · « Une partie, en trois minutes »

**Pour qui** : un enseignant qui découvre et se demande si ça le concerne.
**Ce qu'on veut qu'il retienne** : ce n'est pas un exercice, c'est une
décision qui a des conséquences.
**Durée cible** : 2 min 30.

| Temps | Écran | Ce qu'on fait | Ce qu'on dit |
| --- | --- | --- | --- |
| 0:00 | Arène, onglet « Situation », tour 4 | Immobile, on laisse lire trois secondes | « Une équipe d'élèves dirige une entreprise. À chaque tour, elle reçoit une situation. Celle-ci : le trimestre est bon, et la caisse est vide. » |
| 0:20 | Même écran, on fait défiler l'énoncé | Lentement, sans commenter chaque ligne | « Tout ce qu'il faut pour décider est là. Rien n'est décoratif, et il n'y a pas de bonne réponse écrite quelque part. » |
| 0:45 | Onglet « Analyser » | Cocher un diagnostic, choisir le modèle | « Avant de décider, l'équipe pose un diagnostic et choisit son modèle d'analyse. C'est ça, la compétence qu'on mesure. » |
| 1:15 | Onglet « Décider », étape « Vendre » | Modifier le prix, puis le volume | « Puis elle décide. Un prix, un volume, des budgets. Chaque champ arrive avec une proposition : la reconduire sans y toucher, ce n'est pas décider. » |
| 1:45 | Dernière étape, champ de justification | Écrire une phrase courte, en entier | « Au premier tour, on demande une phrase : ce qu'on attend de ces choix. Elle reviendra au tour suivant, en face du résultat. » |
| 2:05 | Clic sur « Valider », puis tableau de bord du tour clos | Laisser le résultat s'afficher | « La simulation répond. Le marché, la production, les comptes. Et l'équipe recommence, avec ce qu'elle vient d'apprendre. » |

**Pièges de tournage.** Ne pas filmer la validation deux fois : le tour se
clôt et le monde démo n'est plus au même endroit. Préparer la phrase de
justification à l'avance — se voir taper et hésiter casse le rythme.

---

## Capsule 2 · « Lancer votre première séance »

**Pour qui** : l'enseignant qui va animer dans deux jours.
**Ce qu'on veut qu'il retienne** : il n'y a rien à installer, et il sait déjà
quoi faire du début à la fin.
**Durée cible** : 2 min 45.

| Temps | Écran | Ce qu'on fait | Ce qu'on dit |
| --- | --- | --- | --- |
| 0:00 | `/teacher`, tableau de bord | Cliquer « Créer une partie » | « Une partie de classe se crée en deux décisions. » |
| 0:10 | Formulaire de création | Choisir le secteur, poser le niveau sur 3 | « Le secteur décide de l'univers. Le niveau décide du nombre de leviers ouverts — au niveau 3, dix décisions par tour. » |
| 0:35 | Page de partie, ticket du code | S'arrêter sur le code | « La partie existe. Ce code est tout ce dont vos élèves ont besoin. » |
| 0:50 | « Projeter pour la classe », panneau « Code d'entrée » | Passer en plein écran | « Vous le projetez, ils entrent. Le compteur monte : vous savez quand tout le monde est là sans demander. » |
| 1:15 | Second profil : `/join` | Saisir le code et un prénom | « Côté élève : un code, un prénom, et il est dans une équipe. Rien à installer. » |
| 1:35 | Retour projection, panneau « Ce tour » | Montrer les noms d'équipes, vertes et en attente | « Pendant le tour, vous projetez l'avancement. Les équipes qui traînent se voient au mur. » |
| 2:00 | Page de partie, « Clore le tour et simuler » | Ouvrir la confirmation, la lire, valider | « À la fin, vous clôturez. L'écran vous dit qui a validé, et que les autres reconduiront leurs décisions. » |
| 2:25 | Projection, panneau « Classement » | Révéler puis projeter | « Et le classement, c'est vous qui l'ouvrez. Tant que vous ne l'avez pas fait, personne ne l'a vu. » |

**Pièges de tournage.** La création de partie prend une dizaine de secondes :
couper au montage, ou meubler. Le second profil doit déjà être ouvert et
vierge — filmer la création d'un profil de navigateur n'intéresse personne.

---

## Capsule 3 · « Le tour de l'élève »

**Pour qui** : les élèves, projetée en classe avant la première séance.
**Ce qu'on veut qu'ils retiennent** : où cliquer, et qu'on peut se tromper.
**Durée cible** : 1 min 45. La plus courte : elle passe avant qu'ils ne
touchent le clavier, et ils ne retiendront que trois choses.

| Temps | Écran | Ce qu'on fait | Ce qu'on dit |
| --- | --- | --- | --- |
| 0:00 | `/join` | Saisir le code, le prénom | « Le code que votre enseignant affiche, votre prénom, et c'est parti. Si un autre prénom apparaît déjà, cliquez « Ce n'est pas moi » : l'ordinateur est encore à quelqu'un d'autre. » |
| 0:25 | Arène, en-tête | Montrer le nom et l'équipe | « Vérifiez en haut : c'est bien vous, et voilà votre équipe. » |
| 0:40 | Les trois onglets | Les survoler dans l'ordre | « Trois étapes, dans l'ordre. La situation, l'analyse, la décision. » |
| 1:00 | Onglet « Analyser », bouton d'indice | Ouvrir un indice, montrer le coût annoncé | « Si vous bloquez, il y a des indices. Ils coûtent des points — et même en les ouvrant tous, il vous en reste 80 %. Cherchez d'abord ; demander de l'aide ne vous disqualifie pas. » |
| 1:20 | Onglet « Décider », pied de page | Montrer « Valider » et la mention de modification | « Vous validez pour toute l'équipe. Et vous pouvez revenir corriger jusqu'à la clôture. » |

**Pièges de tournage.** Filmer sur un compte élève, pas sur le compte
enseignant : les écrans ne portent pas les mêmes informations. Montrer le coût
de l'indice **avant** de cliquer : c'est le sens de la phrase.

---

## Capsule 4 · « Lire les résultats »

**Pour qui** : l'enseignant, après sa première séance.
**Ce qu'on veut qu'il retienne** : l'application lui dit si la classe a joué,
pas seulement qui a gagné.
**Durée cible** : 2 min.

| Temps | Écran | Ce qu'on fait | Ce qu'on dit |
| --- | --- | --- | --- |
| 0:00 | Page de partie, tableau des équipes | Montrer une pastille « par défaut » | « Cette pastille dit qu'une équipe a validé sans modifier ni le prix ni le volume. Elle n'a pas décidé, elle a cliqué. C'est la mesure la plus dure du dispositif. » |
| 0:25 | Même tableau, une justification citée | S'arrêter dessus | « Sous chaque validation, ce que l'équipe attendait de ses choix, écrit avant de connaître le résultat. Votre débriefing part de là. » |
| 0:50 | Classement, pastille IPG | Montrer les dimensions | « Le classement ne suit pas le bénéfice : l'indice compose l'économique, le financier, le commercial, la RSE, le pilotage et la maîtrise décisionnelle. Gagner de l'argent en cassant sa trésorerie ne fait pas monter. » |
| 1:20 | « Observation de séance » | Faire défiler participation et temps | « Et cet écran-ci répond à la question de la première fois : est-ce qu'ils ont joué ? La participation tour par tour, le temps médian, la part de ceux qui n'ont rien changé. » |
| 1:45 | Relevé de notes | Montrer une ligne | « Le travail pédagogique devient une note sur vingt, par équipe et par élève. » |

**Pièges de tournage.** La pastille « par défaut » n'apparaît que si une
équipe a effectivement validé sans rien changer — vérifier sa présence dans le
monde démo avant de lancer l'enregistrement, et sinon la provoquer sur le
tour 4 avec un compte élève.

---

## Après le tournage

- **Sous-titres obligatoires.** Une capsule se regarde en salle des
  professeurs, son coupé.
- **Aucun chiffre en vignette.** Une vignette qui annonce « 15 secteurs »
  vieillit ; le titre de la capsule, non.
- **Refilmer plutôt que rafistoler.** Le monde démo étant reproductible, une
  prise se refait pour le prix d'une génération.
