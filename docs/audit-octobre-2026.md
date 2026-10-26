# Audit de Business Arena, octobre 2026

État initial relevé le 26 octobre 2026, au commit `af81e36`, avant toute modification. Les pages publiées sur www.business-arena.fr ont été comparées au code : l'ordre des sections, le menu et les chiffres publiés sont ceux du code, sauf un réglage de production signalé plus bas. Les chiffres ont été recalculés depuis les registres (`npx tsx`), jamais repris d'une page.

Chaque constat porte : le problème, la preuve, l'impact, la priorité (P0 erreur ou impasse, P1 navigation, compréhension et conversion, P2 secondaire) et la correction proposée. Les **hypothèses** sont séparées des défauts avérés.

## 1. Ce qui existe réellement

### Les formats

| Format | Nom affiché | Route | Ce que fait l'élève | Accès sans licence | Licence qui l'ouvre (code) |
|---|---|---|---|---|---|
| Cours par la simulation | « Le cours », 52 chapitres en 9 thèmes | `/cours`, `/cours/[chapitre]` | Passe les écritures et fait les calculs, guidé, sur une entreprise de l'arène | Le chapitre « Création et premier bilan » | Toute licence de l'arène (Classe, Programme, Campus) : `cours/[chapitre]/page.tsx`, `cours.service.ts` |
| Cas pratiques | « Cas pratiques », 52 dédiés et 7 de synthèse | Dans `/cours` | Refait seul les calculs d'un chapitre sur une question neuve | Aucun | Comme le cours |
| Business game | « L'arène », 16 « ateliers » | `/jouer`, `/join`, `/arena`, `/animations`, `/compete` | Dirige une entreprise en équipe sur plusieurs tours, face à des concurrents | Une partie solo (`/jouer`) ; catalogue des ateliers | Champ `arene` de `org_licences` : Classe, Programme, Campus (`config/tarifs.ts`, `PARAMETRAGE_DES_OFFRES`) |
| Épisodes manager | « Épisodes manager », 113 | `/entreprises/episode` | Un rôle, six décisions, un bilan qui sépare la décision de la chance | 5 démonstrations, niveau Découverte | Champ `episodes` de `org_licences`, vendu à part |

**« Épisodes en classe » n'est pas un format distinct.** `/enseignants/episodes` présente les mêmes épisodes manager (même registre, même composant), avec 18 fiches de séance pour l'enseignant et une animation de cohorte. C'est un usage de l'enseignant, pas un format en soi. Dans le code, la brique « appliquer » est tenue par les **cas pratiques** (`config/articulation.ts`).

### La licence

Une seule licence par organisation (`org_licences`, `src/db/schema/identity.ts`). Elle porte quatre champs : `arene` (classe, programme ou campus), `episodes` (oui ou non), `examen` (oui ou non) et `nature` (vendue, offerte ou essai). Le code connaît déjà ces critères de prix : entreprises (une ou toutes), niveaux (un ou tous), enseignants (1, au devis, sans limite), parties simultanées, durée (un an ou une année scolaire), modules (examen, épisodes), options d'accompagnement sur devis. Il n'existe aucun critère par nombre d'élèves ni par nombre de classes : une « classe » est une partie en cours. Les prix de référence (290, 990 et 1 990 €) existent dans le code, mais ne sont pas publiés (`prixPublics=false`).

## 2. Constats avérés

### Contenu faux (P0)

1. **Treize ateliers annoncent une séance de moins que leur propre fiche.** Exemple : « Prendre les commandes de Nova en quatre séances » et « Quatre séances d'une heure et demie », alors que la même fiche affiche « 5 séances de 1 h 30 » (`config/ateliers/stmg.ts`). Même écart pour cg1, mco, mco2, ndrc, fitness, gpme, mhr, bistrot, gea, dcg, dcg-rse et avance. La séance d'essai a été ajoutée sans reprendre les titres ni les accroches. *Impact* : un enseignant planifie une séance de moins. *Correction* : aligner les textes sur `seances.length` et étendre la garde des ateliers aux titres, accroches et résumés.
2. **Des promesses d'accès que le code ne tient pas.**
   - `/animations` dit des ateliers qu'ils sont « librement utilisables en classe », alors que le dossier, les corrigés et le lancement demandent une licence de l'arène (`acces.service.ts`).
   - `/enseignants/episodes` dit « Les épisodes se jouent sans compte ». C'est exact pour l'élève, mais aucune des 18 fiches de séance ne correspond à une des 5 démonstrations : sans licence épisodes, aucune ne se joue.

   *Impact* : l'enseignant croit l'accès gratuit, puis bute sur un refus. *Correction* : dire ce qui est libre et ce qui demande une licence.

### Impasses et conversion (P1)

3. **Le cours, une fois refusé, ne mène nulle part.** La page d'un chapitre réservé n'a qu'un bouton, « Voir le cours » : aucun lien vers les offres ni vers le devis (`cours/[chapitre]/page.tsx`). Aucune page commerciale ne dit que le cours s'ouvre avec la licence de l'arène.
4. **Le cours est absent de l'accueil et des pages commerciales.** On compte zéro lien vers `/cours` dans l'accueil, `/enseignants`, `/ecoles` et `/fonctionnalites`. Les quatre formats ne sont présentés ensemble que sur `/cours` et `/teacher/cours`.
5. **L'accueil ne présente que l'arène.** Il compte huit sections et sept titres. Une carte d'épisode y est posée à côté du classement d'une partie, sans que les deux formats soient nommés. Les neuf lieux reviennent deux fois. Rien ne dit qu'un format peut se prendre seul.
6. **Une seule aide au choix, et elle ne mène qu'à l'arène.** `/orientation` pose ses questions et ne propose qu'un réglage d'arène ; c'est pourtant l'action principale du site.
7. **Six portes pour taper un code d'élève** : `/join`, `/cours/rejoindre`, `/entreprises/episode/rejoindre`, `/compete`, `/examen`, `/reprendre`. La barre ne propose que « Rejoindre une partie » (`/join`), qui répond « Code de partie inconnu » à un code de classe du cours ou de cohorte. *Impact* : en classe, l'élève reste bloqué.
8. **Plusieurs noms pour une même chose.**
   - Le concours s'appelle « Business Arena Championship » sur l'accueil, `/fonctionnalites` et `/teacher`, alors que le menu l'a renommé « Concours entre classes » (`config/navigation.ts`).
   - `/parcours` s'appelle « Référentiels par diplôme », « Votre référentiel, bloc par bloc » ou « Parcours par diplôme » selon l'endroit.
   - Les épisodes portent au moins quatre noms.
9. **Des chiffres faux ou flous.**
   - `/orientation` dit « Répondez aux trois questions » pour un formulaire en quatre étapes, et promet de demander « le temps dont vous disposez », ce qu'il ne demande pas.
   - `/entreprises` dit « face à 7 concurrents » : 7 est le maximum, une partie solo se joue par défaut à trois entreprises.
   - `/tarifs` promet « le guide de débrief des 113 épisodes » alors que 18 fiches existent.
10. **L'examen individuel n'apparaît pas sur les cartes de `/tarifs`**, alors qu'il est inclus dans Programme et Campus (`tarifs.ts`) et que `/ecoles` le dit.
11. **Le concours est rangé chez les enseignants, mais sa page est un formulaire d'élève.** `/compete` sert à « Rejoindre un concours » ; l'enseignant organise depuis son espace.
12. **`/entreprises` porte deux sens.** C'est à la fois le public visé dans le menu (« Entreprises et managers ») et la page des 9 entreprises jouables, qui finit sur « Créer une partie pour ma classe » et une inscription, puis un refus sans licence. La page n'a aucun appel au devis.

### Secondaire (P2)

- Quatre recettes de bouton secondaire et trois gabarits d'en-tête de page. L'orange n'est réservé à l'action que sur l'accueil et l'arène.
- La garde de contraste mesure 10 pages, sans `/cours`, `/entreprises/episode`, `/enseignants/episodes`, `/orientation` ni `/fonctionnalites`.
- Plusieurs entrées marquées « page courante » à la fois (comparaison par préfixe dans `site-header.tsx`).
- Sept pages sans pied de page (`/manuel`, `/mentions-legales`, `/rendez-vous`, `/examen`, `/profile`, et `/join`, `/reprendre` par choix).
- Le menu ne change pas pour un enseignant connecté : pas de « Mon compte » ni de déconnexion dans la barre.
- `/teacher/manuel` double `/manuel` et n'a aucun lien.
- Les épisodes, au menu, sont en `noindex` et absents du sitemap.
- « 139 situations » compte les situations des 15 définitions, dont 21 doublons de variantes « gamme ». La page `/entreprises` en totalise 82 sur ses 9 tuiles.
- Des affirmations sans mesure : « une partie en 30 secondes ».

**Aucun lien interne cassé.** Toutes les routes et toutes les ancres vérifiables existent.

## 3. Hypothèses à vérifier

- La plupart des combinaisons entreprise × niveau de l'offre Classe n'auraient aucun atelier inclus : les ateliers sont concentrés sur NOVA, niveaux 3 à 5.
- Un référent d'établissement compté comme enseignant bloquerait la création d'une partie avec l'offre Classe (`licence.service.ts`).
- Les demandes de devis ne seraient notifiées que si `contactEmail` est configuré en production (`devis/actions.ts`).
- L'accueil, centré sur l'arène, retarderait la compréhension des quatre formats. Les enseignants le confirmeraient.

## 4. Ce que le propriétaire doit trancher

1. **Les niveaux gratuits en solo.** Le code et la grille figée disent 1 à 3 ; la production publie 1 à 6, réglé en base dans `/admin/offres`. En l'état, la Découverte gratuite ouvre plus de niveaux que l'offre Classe.
2. **Les prix.** Publier les prix de référence, ou rester « sur devis » partout.
3. **Le cours dans les offres.** Faut-il écrire sur les cartes Classe, Programme et Campus que le cours et ses cas pratiques sont inclus (c'est le comportement actuel) ? L'offre Classe doit-elle limiter le cours à son entreprise ?
4. **Un cas pratique libre** à côté du chapitre libre, pour qu'on puisse essayer ce format.
5. **L'unité de l'offre épisodes.** Cohorte, managers, épisodes ou durée ? Faut-il appliquer les « 15 managers » et les « 3 à 6 épisodes », que le code n'impose pas ? Faut-il une fiche de séance sur une démonstration ?
6. **Les formules Classe, Programme et Campus.** Une « classe » est aujourd'hui une partie en cours. Faut-il un critère par effectif ou par nombre de groupes ? Le référent compte-t-il comme enseignant ?
7. **Réseaux d'établissements, RENATER et LTI, essai d'établissement** : contenu, seuil, offres concernées.
8. **Les prestations humaines promises** (lancement, débrief à distance, guide des 113 épisodes) : lesquelles assumer ?
9. **Le rôle de `/entreprises`** : page des entreprises jouables, ou page pour les entreprises clientes ? Et son libellé au menu.
10. **L'indexation des épisodes** par les moteurs de recherche.

## 5. L'architecture pédagogique proposée

L'hypothèse « Apprendre, Appliquer, Piloter, Développer le jugement » colle au code, à une condition : « Appliquer » désigne les **cas pratiques**, et les « épisodes en classe » sont une façon d'animer les **épisodes manager** en séance, pas un cinquième format. Les quatre gestes deviennent :

- **Apprendre** : le cours.
- **S'entraîner** : les cas pratiques.
- **Piloter** : l'arène.
- **Décider en situation** : les épisodes manager, joués seul ou en classe.

Chaque format se prend seul. Chacun a sa porte gratuite : le chapitre libre, la partie solo, les démonstrations. Les passages de l'un à l'autre (fin de chapitre, bilan d'épisode, fiches notions) existent déjà.

## 6. Ce qui a été fait

**Lot 1 (#308)**
- Les 13 ateliers annoncent leur nombre réel de séances. Les titres, les accroches, les règles annoncées, les rythmes proposés et les rangs de séance cités dans le texte ont été corrigés. La garde `tests/pedagogy/ateliers-nombre-de-seances.test.ts` empêche l'erreur de revenir.
- Les promesses d'accès suivent le code. Sur `/animations`, les fiches se lisent librement, mais le dossier et la partie demandent une licence de l'arène. Sur `/enseignants/episodes`, la cohorte demande l'offre épisodes, et la page renvoie aux démonstrations.
- Un chapitre réservé mène au chapitre libre, aux offres et au devis.
- L'accueil présente les quatre formats, chacun avec sa page et sa porte gratuite (`components/accueil-formats.tsx`). Le héros y renvoie.
- Le concours s'appelle partout « Concours entre classes ». `/orientation` annonce bien quatre questions. Le nombre de concurrents est donné comme un maximum.

**Lot 2**
- Une seule porte pour les codes d'élève (`services/rejoindre.service.ts`). Un code de classe du cours, de cohorte d'épisodes, de concours ou d'examen tapé dans « Rejoindre une partie » mène à sa page, avec le code déjà saisi. Comme pour une partie, rien n'est créé tant que le code n'est pas reconnu.
- Le formulaire d'inscription à un concours (`/compete`) est rangé chez les élèves, sous « Rejoindre un concours ». Côté enseignants, « Concours entre classes » mène à l'explication (`/guide#concours`).
- La description du cours dans le menu dit ce qu'il est devenu : de la comptabilité au marketing, avec des cas pratiques.
- `/parcours` porte le même nom au menu et sur l'accueil : « Référentiels par diplôme ».
