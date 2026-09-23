# 04 — Architecture du moteur de compétition

Couvre le point 5 de la mission n°37 (§25–§26). Le MVP n'implémente que le socle
(mode compétition simple) ; le mode concours « BUSINESS ARENA CHAMPIONSHIP » est
**anticipé dans le schéma et les contrats**, pas développé (ADR-12).

---

## 1. Les trois modes de jeu

| | Apprentissage | Compétition | Concours (post-MVP) |
|---|---|---|---|
| Indices | complets | limités (quota) | selon phase, souvent aucun |
| Décisions | modifiables, tour rejouable en bac à sable | **verrouillées après validation** | verrouillées + échéance stricte |
| Règles | adaptables par l'enseignant | identiques pour tous, figées à la création | identiques + auditées |
| Classement | facultatif, formatif | temps réel ou différé (choix organisateur) | différé jusqu'à l'annonce |
| Information | selon difficulté | selon difficulté, symétrique | symétrique, souvent réduite |

Le mode est un attribut de la partie (`games.mode`) qui pilote les politiques
(verrouillage, indices, visibilité du classement) dans la **couche services** — le moteur
économique est identique dans les trois modes.

## 2. Socle MVP (mode compétition, §25)

- **Équité** : toutes les entreprises d'une partie partagent le même instantané de scénario,
  la même graine, la même échéance de tour. Les événements `scope: market` frappent tout le
  monde ; les événements `scope: company` sont tirés par le PRNG commun (auditables au rejeu).
- **Verrouillage** : la validation des décisions est définitive (horodatée serveur) ;
  l'absence de validation à l'échéance reconduit les décisions précédentes (ADR-04).
- **Anti-triche MVP** (ADR-13) : résolution 100 % serveur, journal append-only des décisions,
  graine et paramètres cachés non exposés, indices tracés, rejeu de contrôle
  (`scripts/replay.ts` doit reproduire exactement les résultats publiés).
- **Classement** : par le BPI (doc 08), pas par le seul résultat financier ; l'historique
  des décisions de chaque équipe est archivé et consultable après la partie.

## 3. Moteur de concours (`src/competition`) — contrats posés dès le MVP

Un **concours** (`competitions`) est un arbre de **phases** (`competition_stages`) :

```
Concours ──< Stages (qualification | groupes | élimination | demi-finale | finale)
                │  format: { type, gamesPerStage, teamsPerGame, advanceCount, tieBreakers[] }
                └──< Games (parties ordinaires, games.competition_stage_id renseigné)
Inscriptions ──< competition_entries (équipe, organisation, statut)
```

- Chaque phase engendre des **parties ordinaires** : le moteur de compétition ne fait que
  composer les groupes (seeding par BPI ou tirage seedé), agréger les classements de phase
  et propager les qualifiés vers la phase suivante (`advanceCount`, `tieBreakers` :
  BPI, puis performance financière, puis trésorerie finale).
- Classement individuel ET par équipe : l'individuel agrège les BPI des parties jouées par
  le joueur (les équipes étant possiblement recomposées entre phases).
- Ce design garantit qu'organiser un championnat national = de l'orchestration de parties
  existantes, **zéro modification du moteur économique**.

### 3.0 Le code de reprise d'un joueur (implémenté)

Un élève de concours n'a ni compte ni mot de passe : il est reconnu par un cookie invité
signé, donc par SON NAVIGATEUR. Changer de poste, vider ses cookies ou passer du PC de la
salle au téléphone suffisait à le rendre méconnaissable — et, une fois les inscriptions
closes, à l'exclure de son propre tournoi, sans aucun recours.

- `competition_members (competition_id, user_id, team_label, recovery_code)` : un code
  personnel par membre, tiré à l'inscription dans l'alphabet des codes lisibles (ni I, ni
  L, ni O, ni 0, ni 1), huit signes, unique pour toute la base — il se saisit donc seul,
  sans le code du concours.
- `reprendreSonIdentite({ code, ip })` rend l'identité de son propriétaire ; l'appareil la
  reçoit par `setGuestCookie`. Le message d'échec est le même pour un code mal formé et
  pour un code inconnu, et les tentatives sont comptées par adresse dans `login_attempts`
  sous le marqueur `reprise-de-concours`, distinct de la connexion enseignante.
- Le code est stocké EN CLAIR, à dessein : le chemin de secours réel d'une salle de classe
  est l'enseignant, qui doit pouvoir le relire à l'élève qui l'a perdu. Il est donc visible
  par son propriétaire (sur sa page de concours) et par l'organisateur (liste repliée, avec
  la mise en garde de ne pas la projeter). Il ne donne accès qu'à ce joueur, dans ce
  concours.
- Le code appartient au JOUEUR et non à l'équipe : deux coéquipiers n'ont pas le même,
  sinon l'un jouerait pour l'autre. Se réinscrire ne le change pas, puisque c'est celui
  que l'élève a noté.

### 3.1 Phases intermédiaires (implémenté)

L'arbre ci-dessus n'était parcouru qu'en deux temps : des poules de qualification, puis la
finale. Un tournoi de campus en demande davantage — préliminaires, demi-finales, finale —,
et rien dans la table ne l'interdisait : elle porte déjà un `index` et un type `semifinal`.

- `startIntermediateStage({ groupSize, advancePerGroup, nom })` clôt la phase en cours,
  qualifie ses meilleures équipes et les retire au sort dans de nouvelles **poules**. Le
  geste est répétable : on empile autant de phases que l'organisateur en lance, jusqu'à ce
  qu'il appelle `startFinal`.
- Le **nom** saisi (« Demi-finales », « Tour 2 ») vit dans le `format` jsonb de la phase :
  aucune colonne à ajouter, et l'affichage sait nommer une phase autrement que « Phase 2 ».
- La graine du tirage est celle du concours **décalée par l'index** de la phase. Sans ce
  décalage, deux phases successives mélangeraient la même liste dans le même ordre et les
  mêmes équipes se retrouveraient ensemble sans que rien ne l'explique.
- Avant de confirmer, l'organisateur voit l'**aperçu** de la phase (`apercuDePhase`) :
  nombre de poules, taille réelle après redistribution du reste, équipes encore en lice.
  Deux empêchements le bloquent, et chacun dit quoi faire à la place — moins de deux poules
  possibles (c'est une finale qu'il faut lancer), et autant de qualifiées que d'équipes
  dans la plus petite poule (la phase ne trancherait rien).
- Chaque phase se clôt du même geste, finale comprise : les qualifiées restent `active`,
  les autres passent `eliminated`. Dans un concours terminé, plus personne n'est en lice.
- Le déroulé affiché suit les phases réellement créées, et non plus quatre étapes figées :
  inscriptions, une entrée par phase, la finale tant qu'elle n'est pas lancée, le podium.

## 4. Rôles et cycle de vie

- `organizer` (rôle sur le concours) : crée les phases, fixe le calendrier, publie les
  résultats. L'enseignant est l'organisateur naturel d'une compétition de classe.
- Cycle d'une partie : `draft → open → round_in_progress ⇄ round_closed → finished → archived`.
- Cycle d'un concours : `draft → registration → running(stage k) → finished`.
- Les échéances (tours et phases) sont exécutées par le cron Vercel (doc 01 §5), idempotent.
