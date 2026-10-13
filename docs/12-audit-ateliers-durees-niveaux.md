# Audit des ateliers : durées, niveaux, formations servies, situations sur mesure (13 octobre 2026)

Quinze ateliers publiés (`src/config/ateliers/`), lus intégralement et confrontés au modèle de durée (`src/config/duree-du-tour.ts`), aux préréglages de niveau (`src/config/difficulty.ts`), aux familles de scénarios (`src/config/scenarios/registry.ts`) et au registre des formations (`src/config/formations.ts`). Méthode : un script de relevé (`chargeDesSeances`, `adaptationsDuNiveau`, `formationsServies`, dont la sortie est reprise ci-dessous telle quelle), puis une lecture séance par séance des phases qui jouent le tour. Les numéros de ligne renvoient aux fichiers de `src/config/ateliers/` sauf mention contraire.

La demande du propriétaire, mot pour mot : « J'aimerais auditer les ateliers : bien calibrer les durées, adapter aux niveaux, une situation peut servir plusieurs formations donc les indiquer, dire aussi que l'on peut développer des situations sur mesure en fonction du référentiel. » Une situation, dans son vocabulaire, est l'entreprise jouée avec ses tours et ses situations-problèmes ; un atelier est un déroulé de `src/config/ateliers/*.ts` ; une formation est une entrée de `src/config/formations.ts`.

## 1. Ce que l'audit du 16 septembre a laissé, et ce qui est réglé

Le document `docs/11-audit-ateliers.md` portait quatorze constats transversaux et trois lots. Les trois lots ont été livrés le jour même, et la plupart des constats sont devenus des gardes dans `tests/pedagogy/ateliers.test.ts` : minutage exact des séances (l. 48), tours égaux aux séances jouées (l. 60), aucune séance au-delà de deux heures depuis le 13 octobre (voir 3.4), temps de parole qui tient dans sa phase (l. 114), entrées de référentiel non inventées (l. 185 et l. 253), aucun atelier qui ferme avant le pic du secteur (l. 317), réglages qui existent dans le produit et nom du niveau égal à celui du préréglage (l. 346 à 368), aucune séance sur un levier fermé (l. 430), traces à un acte, livrables comptés juste, promesses que le produit ne tient pas, échelle d'exigence unique, notions reliées à une fiche, mot du référentiel jamais écrit en dur.

Restaient ouverts, au 16 septembre : la situation « 18 % de commission » de l'hôtel, que le moteur ne modélise pas, et la relecture des arrêtés du BTS MHR et du BUT GEA (`REFERENTIELS_NON_VERIFIES`, `referentiels.ts` l. 163). Les deux restent ouverts : ce ne sont pas des questions de durée ni de niveau, et inventer un référentiel pour les clore serait pire que de les laisser nommés.

Ce que le document 11 ne regardait pas, et que la demande d'aujourd'hui exige : le temps que chaque séance laisse réellement au tour qu'elle joue, la cohérence du niveau avec la formation et l'année, ce qu'un cran de plus ou de moins change concrètement, les formations qu'une même entreprise sert, et l'offre de situations sur mesure.

## 2. Vue d'ensemble, relevée et non recopiée

| Atelier | Formations | Scénario | Niveau | Tours | Exigence | Format |
|---|---|---|---|---|---|---|
| debutant | (Toutes filières, en découverte) | boutique-mono | 1 | 4 | 1 | 4 séances de 2 h |
| stmg | stmg | nova | 1 | 4 | 1 | 4 séances de 1 h 30 |
| cg1 | bts-cg | nova | 3 | 6 | 2 | 6 séances de 3 h |
| mco | bts-mco | boutique | 3 | 4 | 2 | 5 séances de 3 h |
| mco2 | bts-mco | bistrot | 3 | 6 | 3 | 6 séances de 2 h |
| ndrc | bts-ndrc | ecommerce | 2 | 5 | 2 | 6 séances de 3 h |
| fitness | bts-ndrc | fitness | 3 | 5 | 3 | 6 séances de 3 h |
| gpme | bts-gpme | conseil-gamme | 4 | 5 | 3 | 6 séances de 3 h |
| mhr | bts-mhr | hotel | 3 | 4 | 3 | 5 séances de 3 h |
| bistrot | bts-mhr-bc | bistrot-gamme | 4 | 4 | 3 | 5 séances de 3 h |
| gea | but-gea | nova-gamme | 4 | 4 | 3 | 5 séances de 3 h |
| dcg | dcg | nova-gamme | 5 | 4 | 4 | 5 séances de 3 h |
| dcg-rse | dcg | nova-gamme | 5 | 5 | 4 | 6 séances de 3 h |
| avance | (Toutes filières, après un premier atelier) | transport | 5 | 5 | 4 | 6 séances de 3 h |
| campus | bts-cg, bts-mco, bts-ndrc, stmg | nova | 3 | 6 | 3 | 7 séances de 1 h 30 |

Les formats « de 3 h » sont ceux du relevé du matin ; la décision du 13 octobre (3.4) les passe tous à 2 h.

Lecture : quatre ateliers de section de technicien sur onze tournent sur NOVA ou sa gamme, les cinq autres entreprises jouées se partagent sept ateliers, et une entreprise du choix n'a de déroulé que sans formation (ROUTE & CIE). MARTEL & FILS, qui n'en avait aucun à la date de l'audit, porte depuis l'atelier `martel` (BTS GPME, première année, sept séances de deux heures dont un tour d'essai). C'est le point de départ de la section 5.

## 3. Calibrer les durées

### 3.1 La règle de lecture

Pour chaque séance qui joue un tour, le modèle `dureeDuTour` est appliqué aux réglages de la fiche : le scénario de `reglages.scenarioCode` (donc déjà la variante, mono ou gamme), les champs qu'ouvre `reglages.niveau` (le préréglage de repli pour un concours), la situation déclenchée à ce tour (`signesDeSituation`), les questions selon `reglages.quizMode` (l'analyse de quatre minutes ne compte que si la partie pose des questions), et la prise en main de huit minutes au premier tour que l'atelier fait jouer. Le module `src/config/ateliers/duree-des-seances.ts` porte ce calcul (`estimationDuTour`) ; c'est lui que la fiche affiche et que la garde lit.

En face, les minutes que le déroulé donne RÉELLEMENT à la saisie des décisions. La règle, écrite dans `duree-des-seances.ts` l. 45 (`TITRE_DE_JEU`, `DETAIL_DE_JEU`, `TITRE_SANS_JEU`) : une phase est une phase de jeu quand son titre annonce la décision du tour (« Décisions du trimestre », « Décider le tour 2 », « Premier arbitrage et décisions », « On décide », « Le dernier tour ») ou quand son détail dit que l'équipe saisit, valide ou joue ; un titre qui pose une alternative (« Décision ou marché », « Investir ou tenir ») est une phase d'analyse, on y pèse et on n'y saisit pas ; une clôture, un débriefing, une relecture ne jouent rien, même quand leur détail cite la saisie qui les a précédés. Trois faux positifs d'une première version de la règle ont été écartés ainsi : « Décision ou marché » (dcg S4), « Les flux que la décision change » (avance S5) et « Où en est mon standing », dont le détail dit « au dernier tour » sans rien jouer (dcg-rse S5).

Trois verdicts : juste quand la phase de jeu vaut au moins l'estimation plus un quart (`MARGE_CONSEILLEE`, l. 105), serrée entre l'estimation et ce quart, impossible en dessous. Le quart est ce qui sépare une phase qui tient d'une phase qu'on finit en débordant sur la clôture : le modèle ne compte ni la discussion à trois autour de l'écran ni la note que presque tous les déroulés demandent d'écrire avant de valider.

### 3.2 Le relevé, séance par séance (après correction)

| Atelier | Séance | Tour | Estimation (lecture+saisie+analyse+prise en main) | Phases de jeu | Minutes de jeu | Verdict |
|---|---|---|---|---|---|---|
| debutant | 1 | 1 | 12 (2+2+0+8) | On fixe le prix (30) | 30 | juste |
| debutant | 2 | 2 | 3 (1+2+0+0) | On commande (30) | 30 | juste |
| debutant | 3 | 3 | 3 (1+2+0+0) | On décide (30) | 30 | juste |
| debutant | 4 | 4 | 3 (1+2+0+0) | On décide, une dernière fois (25) | 25 | juste |
| stmg | 1 | 1 | 16 (2+2+4+8) | Le premier prix (20) ; Communication et saisie (15) | 35 | juste |
| stmg | 2 | 2 | 7 (1+2+4+0) | Deuxième décision (15) | 15 | juste |
| stmg | 3 | 3 | 7 (1+2+4+0) | Troisième décision (20) | 20 | juste |
| stmg | 4 | 4 | 7 (1+2+4+0) | La décision du pic (15) | 15 | juste |
| cg1 | 1 | 1 | 20 (2+6+4+8) | Le premier arbitrage (45) | 45 | juste |
| cg1 | 2 | 2 | 11 (1+6+4+0) | Décider le tour 2 (40) | 40 | juste |
| cg1 | 3 | 3 | 11 (1+6+4+0) | Décider le tour 3 (30) | 30 | juste |
| cg1 | 4 | 4 | 11 (1+6+4+0) | Décider le tour 4 (30) | 30 | juste |
| cg1 | 5 | 5 | 11 (1+6+4+0) | Décider le tour 5 (30) | 30 | juste |
| cg1 | 6 | 6 | 11 (1+6+4+0) | Le dernier tour (20) | 20 | juste |
| mco | 1 | 1 | 20 (2+6+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| mco | 2 | 2 | 11 (1+6+4+0) | Décisions du trimestre (35) | 35 | juste |
| mco | 3 | 3 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| mco | 4 | 4 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| mco2 | 1 | 1 | 19 (1+6+4+8) | Décisions du mois (25) | 25 | juste |
| mco2 | 2 | 2 | 11 (1+6+4+0) | Décisions du mois (20) | 20 | juste |
| mco2 | 3 | 3 | 11 (1+6+4+0) | Décisions du mois (20) | 20 | juste |
| mco2 | 4 | 4 | 11 (1+6+4+0) | Décisions du mois (20) | 20 | juste |
| mco2 | 5 | 5 | 11 (1+6+4+0) | Décisions du mois (20) | 20 | juste |
| mco2 | 6 | 6 | 11 (1+6+4+0) | Le dernier mois (15) ; Décisions et clôture (20) | 35 | juste |
| ndrc | 1 | 1 | 17 (2+3+4+8) | Décisions du trimestre (35) | 35 | juste |
| ndrc | 2 | 2 | 8 (1+3+4+0) | Décisions du trimestre (35) | 35 | juste |
| ndrc | 3 | 3 | 8 (1+3+4+0) | Décisions du trimestre (35) | 35 | juste |
| ndrc | 4 | 4 | 8 (1+3+4+0) | Décisions du trimestre (35) | 35 | juste |
| ndrc | 5 | 5 | 8 (1+3+4+0) | Décisions du trimestre (35) | 35 | juste |
| fitness | 1 | 1 | 20 (2+6+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| fitness | 2 | 2 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| fitness | 3 | 3 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| fitness | 4 | 4 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| fitness | 5 | 5 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| gpme | 1 | 1 | 23 (2+9+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| gpme | 2 | 2 | 14 (1+9+4+0) | Décisions du trimestre (35) | 35 | juste |
| gpme | 3 | 3 | 14 (1+9+4+0) | Décisions du trimestre (35) | 35 | juste |
| gpme | 4 | 4 | 14 (1+9+4+0) | Décisions du trimestre (35) | 35 | juste |
| gpme | 5 | 5 | 14 (1+9+4+0) | Décisions du trimestre (35) | 35 | juste |
| mhr | 1 | 1 | 20 (2+6+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| mhr | 2 | 2 | 11 (1+6+4+0) | Décisions du trimestre (35) | 35 | juste |
| mhr | 3 | 3 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| mhr | 4 | 4 | 11 (1+6+4+0) | Décisions du trimestre (30) | 30 | juste |
| bistrot | 1 | 1 | 23 (2+9+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| bistrot | 2 | 2 | 14 (1+9+4+0) | Décisions du trimestre (30) | 30 | juste |
| bistrot | 3 | 3 | 14 (1+9+4+0) | Décisions du trimestre (30) | 30 | juste |
| bistrot | 4 | 4 | 14 (1+9+4+0) | Décisions du trimestre (30) | 30 | juste |
| gea | 1 | 1 | 23 (2+9+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| gea | 2 | 2 | 14 (1+9+4+0) | Décisions du trimestre (35) | 35 | juste |
| gea | 3 | 3 | 14 (1+9+4+0) | Décisions du trimestre (30) | 30 | juste |
| gea | 4 | 4 | 14 (1+9+4+0) | Décisions du trimestre (30) | 30 | juste |
| dcg | 1 | 1 | 25 (2+11+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| dcg | 2 | 2 | 16 (1+11+4+0) | Décisions du trimestre (30) | 30 | juste |
| dcg | 3 | 3 | 16 (1+11+4+0) | Plan de trésorerie, budget et décisions (30) | 30 | juste |
| dcg | 4 | 4 | 16 (1+11+4+0) | Budget du dernier trimestre et décisions (30) | 30 | juste |
| dcg-rse | 1 | 1 | 25 (2+11+4+8) | Premières décisions (45) | 45 | juste |
| dcg-rse | 2 | 2 | 16 (1+11+4+0) | Décisions du trimestre (50) | 50 | juste |
| dcg-rse | 3 | 3 | 16 (1+11+4+0) | Décisions du trimestre (50) | 50 | juste |
| dcg-rse | 4 | 4 | 16 (1+11+4+0) | Décisions du trimestre (50) | 50 | juste |
| dcg-rse | 5 | 5 | 16 (1+11+4+0) | Décisions du dernier tour (50) | 50 | juste |
| avance | 1 | 1 | 25 (2+11+4+8) | Premier arbitrage et décisions (35) | 35 | juste |
| avance | 2 | 2 | 16 (1+11+4+0) | Décisions du trimestre (35) | 35 | juste |
| avance | 3 | 3 | 16 (1+11+4+0) | Décisions du trimestre (30) | 30 | juste |
| avance | 4 | 4 | 16 (1+11+4+0) | Décisions du trimestre (30) | 30 | juste |
| avance | 5 | 5 | 16 (1+11+4+0) | Décisions du trimestre (30) | 30 | juste |
| campus | 1 | 1 | 20 (2+6+4+8) | Premières décisions (25) | 25 | juste |
| campus | 2 | 2 | 11 (1+6+4+0) | Comité et décisions (20) | 20 | juste |
| campus | 3 | 3 | 11 (1+6+4+0) | Comité et décisions (20) | 20 | juste |
| campus | 4 | 4 | 11 (1+6+4+0) | Comité et décisions (20) | 20 | juste |
| campus | 5 | 5 | 11 (1+6+4+0) | Comité et décisions (20) | 20 | juste |
| campus | 6 | 6 | 11 (1+6+4+0) | Le dernier arbitrage (20) ; Décisions du dernier trimestre (15) | 35 | juste |

Bilan : 71 justes, 0 serrées, 0 impossibles.

### 3.3 Ce que le relevé a trouvé, et ce qui a été corrigé

Avant correction : 69 séances justes, 2 serrées, 0 impossible. Aucun déroulé ne donnait moins que l'estimation ; deux lui donnaient juste l'estimation, sans marge.

**mco2, séance 1** (l. 95 à 108) : vingt minutes de « Décisions du mois » pour un premier tour estimé à dix-neuf (prise en main de huit minutes, situation du mois, quatre minutes d'analyse, six de saisie au niveau Pilotage). Corrigé sans changer la durée de la séance : « Lire le compte du mois » passe de trente à vingt-cinq minutes, « Décisions du mois » de vingt à vingt-cinq. Le compte du mois se lit en vingt-cinq minutes ; c'est la saisie du premier tour, avec l'arbitrage du mois à motiver en trois lignes, qui manquait d'air.

**campus, séance 1** (`campus.ts` l. 105 à 124) : vingt minutes de « Premières décisions » pour un premier tour estimé à vingt. Une séance de quatre-vingt-dix minutes, dans un tournoi où cinq postes doivent se parler avant de cliquer. Corrigé sans changer la durée : « Les équipes et les postes » de quinze à douze minutes, « Premier comité de direction » de vingt à dix-huit, « Premières décisions » de vingt à vingt-cinq. Le comité de direction tient en dix-huit minutes à cinq fois deux minutes d'exposé et une synthèse ; c'est la saisie qu'il fallait allonger.

Aucun autre déroulé n'a été touché, et aucun `format` n'a changé : les soixante-neuf autres séances donnent au tour entre 1,3 fois (cg1 S6, vingt minutes pour onze) et dix fois (debutant S2 à S4, trente minutes pour trois) ce que le modèle estime. Les marges les plus larges sont celles de l'animation de découverte, où la saisie est de deux champs et où tout le temps de la phase se passe à écrire pourquoi ce prix et pas un autre : c'est voulu, et la fiche le dit.

### 3.4 Les créneaux réels

Décision du propriétaire, le 13 octobre 2026, après lecture de ce relevé (« J'aimerais ramener toutes les durées à 1 h 30, 2 h max par séance ? Ça me semble beaucoup 3 heures. » puis « Ok, passe tout à 2 h. ») : toutes les séances post-bac passent en 2 h, le format standard de tous les ateliers hors lycée (stmg, 1 h 30) et tournoi (campus, 1 h 30). Les onze ateliers écrits en séances de 3 h (cg1, mco, ndrc, mhr, fitness, gpme, bistrot, gea, dcg, dcg-rse, avance) sont réécrits en 120 minutes par séance, sans toucher ni aux parties, ni aux livrables, ni aux traces, ni aux blocs du référentiel ; le découpage en créneaux plus courts (`creneauConseille`, `decoupageEnCreneaux`, « Si vos créneaux font 2 h ») que ce paragraphe décrivait devient sans objet et a été retiré des données, des types, de la fiche et des gardes. La garde « aucune séance post-bac ne dépasse deux heures » (section 7) tient la décision.

### 3.5 Sur la fiche et dans le cockpit

La fiche `/animations/[code]` écrit sous chaque séance jouée « Le tour demande ≈ N min (estimation : lecture, saisie, analyse, prise en main), le déroulé lui en donne M » (`page.tsx` l. 665). Le cockpit de l'atelier est un classeur de prévision (`cockpit-atelier.ts`, servi en .xlsx) : une ligne de durée n'y a pas sa place, et elle n'y a pas été mise. La fiche de pilotage de la partie, elle, porte déjà l'estimation et la mesure (`teacher/games/[gameId]`), et c'est là qu'un enseignant la relit une fois la partie créée.

## 4. Adapter aux niveaux

### 4.1 La règle, et sa vérification

Le niveau d'une fiche se lisait seul. La règle retenue, et désormais gardée (`tests/pedagogy/ateliers.test.ts` l. 797) : le lycée découvre (1) ; une première année de section de technicien gère ou pilote (2 à 3) ; une seconde année et le BUT pilotent ou arbitrent (3 à 4) ; le DCG arbitre ou fait de la stratégie (4 à 5) ; l'approfondissement transversal fait de la stratégie (5) ; un concours impose son niveau ; une découverte sans formation choisit le sien.

Relevé : stmg 1, debutant 1 (découverte), cg1 3, mco 3, ndrc 2, mhr 3 (premières années), mco2 3, fitness 3, gpme 4, bistrot 4 (deuxièmes années), gea 4 (BUT), dcg 5, dcg-rse 5, avance 5, campus 3 (concours, préréglage de repli). Les quinze niveaux sont dans la règle : aucun n'a été corrigé. L'échelle d'exigence suit le niveau sans le recopier (1/1, 1/1, 2/3, 2/3, 2/2, 3/3, 3/3, 3/4, 3/3, 3/4, 3/4, 4/5, 4/5, 4/5, 3/3), la garde de l'échelle unique existe (l. 589), celle du nom du niveau aussi (l. 362 : `niveauNom` doit être `DIFFICULTY_PRESETS[niveau].name`), et celle des leviers fermés (l. 430) tient pour les quinze fiches. Il n'y avait donc pas de garde à ajouter sur le nom du niveau ; la garde ajoutée est celle de la règle formation et année.

Une nuance que la règle laisse passer et que l'audit note : ndrc joue au niveau 2 là où les trois autres premières années jouent au 3. C'est cohérent avec sa fiche (six séances sur l'acquisition, le service et les partenaires, sans trésorerie ni effectif) et avec sa seconde année, fitness, qui passe au 3 en ouvrant les créances. Rien à corriger.

### 4.2 Les deux crans voisins, déduits et affichés

Chaque fiche porte maintenant un bloc « Adapter le niveau » (`page.tsx` l. 561), calculé par `src/config/ateliers/adaptations.ts` et jamais écrit à la main : le niveau voisin et son nom (préréglages), ce qu'il ferme et ce qu'il ouvre comme leviers (différence des `decisions` entre les deux préréglages, libellés de `tableau-des-niveaux.ts`), si l'entreprise change de variante (`scenarioCodeForLevel` sur la tête de famille), les séances à retoucher (celles dont le titre, l'objectif ou les titres de phases annoncent un levier que le cran ferme, selon la même table de mots que la garde des leviers fermés, `MOTS_DES_LEVIERS` l. 35 ; et, quand l'entreprise bascule, la séance dont la préparation donne les réglages de création, et celles qui raisonnent sur un seul produit ou sur la gamme), et le temps à ajouter ou retirer par tour (différence des estimations `dureeDuTour` au niveau voisin, avec l'entreprise du niveau voisin, en fourchette sur les tours joués). Un concours ne s'adapte pas, et la fiche le dit.

| Atelier | Niveau | Un cran plus bas | Un cran plus haut |
|---|---|---|---|
| debutant | 1 | aucun | 2 · Gestion ; ferme rien ; ouvre Qualité, Maintenance ; même entreprise ; séances aucune ; environ 1 min de plus par tour |
| stmg | 1 | aucun | 2 · Gestion ; ferme rien ; ouvre Qualité, Maintenance ; même entreprise ; séances aucune ; environ 1 min de plus par tour |
| cg1 | 3 | 2 · Gestion ; ferme Créances clients, Effectif et salaires ; ouvre rien ; même entreprise ; séances 3, 5 ; environ 3 min de moins par tour | 4 · Arbitrage ; ferme rien ; ouvre Emprunt et apport, Assurance, Investissement ; NOVA → NOVA · gamme ; séances 1 ; environ 3 min de plus par tour |
| mco | 3 | 2 · Gestion ; ferme Créances clients, Effectif et salaires ; ouvre rien ; MAILLE & CO → MAILLE & CO · un article ; séances 1 ; environ 3 min de moins par tour | 4 · Arbitrage ; ferme rien ; ouvre Emprunt et apport, Assurance, Investissement ; même entreprise ; séances aucune ; environ 3 min de plus par tour |
| mco2 | 3 | 2 · Gestion ; ferme Créances clients, Effectif et salaires ; ouvre rien ; même entreprise ; séances 5 ; environ 3 min de moins par tour | 4 · Arbitrage ; ferme rien ; ouvre Emprunt et apport, Assurance, Investissement ; LA TABLE D'AUGUSTIN → LA TABLE D'AUGUSTIN · gamme ; séances 1 ; 3 à 4 min de plus par tour |
| ndrc | 2 | 1 · Découverte ; ferme Qualité, Maintenance ; ouvre rien ; même entreprise ; séances aucune ; environ 1 min de moins par tour | 3 · Pilotage ; ferme rien ; ouvre Créances clients, Effectif et salaires ; même entreprise ; séances aucune ; environ 3 min de plus par tour |
| fitness | 3 | 2 · Gestion ; ferme Créances clients, Effectif et salaires ; ouvre rien ; même entreprise ; séances 4 ; environ 3 min de moins par tour | 4 · Arbitrage ; ferme rien ; ouvre Emprunt et apport, Assurance, Investissement ; même entreprise ; séances aucune ; environ 3 min de plus par tour |
| gpme | 4 | 3 · Pilotage ; ferme Emprunt et apport, Assurance, Investissement ; ouvre rien ; ATLAS CONSEIL · gamme → ATLAS CONSEIL ; séances 1 ; environ 3 min de moins par tour | 5 · Stratégie ; ferme rien ; ouvre RSE, Placement, R&D ; même entreprise ; séances aucune ; environ 2 min de plus par tour |
| mhr | 3 | 2 · Gestion ; ferme Créances clients, Effectif et salaires ; ouvre rien ; même entreprise ; séances 4 ; environ 3 min de moins par tour | 4 · Arbitrage ; ferme rien ; ouvre Emprunt et apport, Assurance, Investissement ; L'ESCALE → L'ESCALE · gamme ; séances 1 ; environ 3 min de plus par tour |
| bistrot | 4 | 3 · Pilotage ; ferme Emprunt et apport, Assurance, Investissement ; ouvre rien ; LA TABLE D'AUGUSTIN · gamme → LA TABLE D'AUGUSTIN ; séances 1, 2, 3, 4 ; 3 à 4 min de moins par tour | 5 · Stratégie ; ferme rien ; ouvre RSE, Placement, R&D ; même entreprise ; séances aucune ; environ 2 min de plus par tour |
| gea | 4 | 3 · Pilotage ; ferme Emprunt et apport, Assurance, Investissement ; ouvre rien ; NOVA · gamme → NOVA ; séances 1, 3 ; environ 3 min de moins par tour | 5 · Stratégie ; ferme rien ; ouvre RSE, Placement, R&D ; même entreprise ; séances aucune ; environ 2 min de plus par tour |
| dcg | 5 | 4 · Arbitrage ; ferme RSE, Placement, R&D ; ouvre rien ; même entreprise ; séances aucune ; environ 2 min de moins par tour | 6 · Executive ; ferme rien ; ouvre Dividende ; même entreprise ; séances aucune ; environ 1 min de plus par tour |
| dcg-rse | 5 | 4 · Arbitrage ; ferme RSE, Placement, R&D ; ouvre rien ; même entreprise ; séances 1, 4, 6 ; environ 2 min de moins par tour | 6 · Executive ; ferme rien ; ouvre Dividende ; même entreprise ; séances aucune ; environ 1 min de plus par tour |
| avance | 5 | 4 · Arbitrage ; ferme RSE, Placement, R&D ; ouvre rien ; même entreprise ; séances 5 ; environ 2 min de moins par tour | 6 · Executive ; ferme rien ; ouvre Dividende ; même entreprise ; séances aucune ; environ 1 min de plus par tour |
| campus | 3 | Un concours impose son niveau : cette fiche ne s'adapte pas, elle s'organise. |  |

Trois lectures. Un cran plus bas ferme presque toujours quelque chose dont une séance vit : les créances pour cg1 S3 et S5, mco2 S5, fitness S4, mhr S4 ; l'investissement et le financement pour gea S1 et S3, bistrot S1 à S4, gpme S1 ; la RSE pour dcg-rse S1, S4 et S6 ; le placement pour avance S5. Un cran plus haut n'oblige à rien, sauf quand il fait basculer l'entreprise en gamme : cg1, mco2 et mhr au niveau 4 changent d'entreprise, et leur séance 1, qui donne les réglages de création, est à retoucher. Un cran plus bas fait l'inverse pour mco (la boutique repasse à un article sous le niveau 3), gpme, bistrot et gea (la gamme disparaît sous le niveau 4). Et le temps par tour bouge de une à quatre minutes, jamais plus : adapter le niveau ne demande pas de refaire le minutage, il demande de retoucher les séances nommées.

## 5. Une situation sert plusieurs formations

### 5.1 Sur les ateliers : `formations[]` revu, et pourquoi rien n'a été ajouté

Le champ est déjà multiple, et le tournoi inter-filières en sert quatre. Pour chacun des quatorze autres, la question posée : un autre code de `formations.ts` peut-il être ajouté tel quel, c'est-à-dire sans réécrire une séance ? La réponse est non, pour une raison de données et non de contenu : chaque séance nomme ses blocs avec les mots d'UN référentiel (`processus`), et la couverture d'une formation (`couverture.ts`, `couvertureDeLaFormation`) ainsi que la page des parcours lisent ces blocs comme ceux de la formation rattachée. Rattacher ndrc (blocs du BTS NDRC) au BTS MCO ferait paraître « Bloc 1 · Relation client et négociation-vente » dans la couverture du BTS MCO, où ce bloc n'existe pas ; rattacher cg1 (processus P1 à P7) au DCG ferait paraître des processus sous un diplôme en unités d'enseignement. Le seul montage honnête est celui du tournoi : préfixer chaque intitulé du diplôme dont il vient, ce qui est une réécriture de la fiche, pas un ajout de code. Les candidats examinés et écartés pour cette raison : ndrc et fitness vers bts-mco, mco et mco2 vers bts-ndrc, cg1 vers dcg, gea vers dcg et bts-cg, bistrot vers bts-mco. Les deux ateliers sans formation (debutant, avance) le restent : ils n'ont pas de référentiel à confronter, et c'est ce que dit leur `public`.

Ce que la demande vise, « une situation peut servir plusieurs formations », se dit donc sur l'ENTREPRISE, où c'est vrai sans fiction.

### 5.2 Sur les entreprises : `formations-servies.ts`

Le module `src/config/scenarios/formations-servies.ts` dérive, pour chaque entreprise du choix (`SCENARIO_CHOICES`, une tuile par famille), les formations qu'elle sert : automatiquement, celles des ateliers qui la jouent, mono ou gamme confondues ; et éditorialement, une liste « convient aussi » (`CONVIENT_AUSSI`, l. 28), dans l'ordre du registre des formations et sans doublon.

| Entreprise | Ateliers (automatique) | Convient aussi (éditorial) | Formations servies |
|---|---|---|---|
| NOVA (nova) | stmg → stmg ; cg1 → bts-cg ; gea → but-gea ; dcg → dcg ; dcg-rse → dcg ; campus → bts-cg, bts-mco, bts-ndrc, stmg | stmg, bts-cg, dcg, but-gea | STMG, BTS CG, BTS MCO, BTS NDRC, BUT GEA, DCG |
| MAILLE & CO (boutique) | debutant → aucune ; mco → bts-mco | bts-mco, stmg | STMG, BTS MCO |
| L'ESCALE (hotel) | mhr → bts-mhr | bts-mhr | BTS MHR |
| LA TABLE D'AUGUSTIN (bistrot) | mco2 → bts-mco ; bistrot → bts-mhr-bc | bts-mhr-bc, bts-mco | BTS MCO, BTS MHR · B et C |
| ATLAS CONSEIL (conseil) | gpme → bts-gpme | bts-gpme, but-gea | BTS GPME, BUT GEA |
| PIXEL & CO (ecommerce) | ndrc → bts-ndrc | bts-ndrc, bts-mco | BTS MCO, BTS NDRC |
| VOLT FITNESS (fitness) | fitness → bts-ndrc | bts-ndrc, bts-mco | BTS MCO, BTS NDRC |
| MARTEL & FILS (batiment) | aucun | bts-gpme, but-gea | BTS GPME, BUT GEA |
| ROUTE & CIE (transport) | avance → aucune | but-gea, dcg, bts-gpme | BTS GPME, BUT GEA, DCG |

Les justifications de la liste éditoriale, par les blocs du référentiel :

- **NOVA, et le DCG et le BUT GEA** : un stock évalué au coût moyen, un coût de revient par enceinte en gamme, des délais de règlement par clientèle, un investissement typé qui prend effet au tour suivant. UE6 (finance d'entreprise) et UE11 (contrôle de gestion) du DCG, dont deux ateliers la jouent déjà ; la compétence « analyser les processus de l'organisation » et le parcours gestion comptable, fiscale et financière du BUT GEA, dont gea la joue en gamme. Le STMG et le BTS CG viennent des ateliers ; le BTS MCO et le BTS NDRC viennent du tournoi, qui les y fait jouer avec leurs propres blocs.
- **MAILLE & CO, et le STMG** : la boutique a un atelier de BTS MCO (Bloc 3 · Assurer la gestion opérationnelle, Bloc 2 · Animer et dynamiser l'offre commerciale). Le programme de première en sciences de gestion et numérique (« Création de valeur et performance », « Temps et risque ») s'y lit comme sur NOVA, et la fiche stmg propose déjà, en prolongement, de basculer sur la boutique pour opposer fabriquer et revendre.
- **L'ESCALE, et le BTS MHR** : la même formation que son atelier ; aucune autre, parce que le prix moyen, le taux d'occupation et le RevPAR sont le vocabulaire de l'hôtellerie et de personne d'autre.
- **LA TABLE D'AUGUSTIN, et le BTS MCO** : mco2 la joue déjà en seconde année (Bloc 3 · gestion opérationnelle, trésorerie du mois) ; bistrot la joue pour les options B et C du BTS MHR.
- **ATLAS CONSEIL, et le BUT GEA** : le poste clients en euros, les risques d'une petite structure, le coût complet d'un recrutement, autant de gestes de la compétence « piloter les relations avec les acteurs internes et externes » et du parcours gestion comptable, fiscale et financière, au niveau 4 où le cabinet se joue en gamme ; le BTS GPME vient de son atelier (Bloc 1, relation clients et fournisseurs ; Bloc 2, risques ; Bloc 3, personnel).
- **PIXEL & CO, et le BTS MCO** : le coût d'acquisition et le panier moyen (Bloc 2 · Animer et dynamiser l'offre commerciale), les retours et le service (Bloc 1 · Développer la relation client) ; le BTS NDRC vient de son atelier (Bloc 2 · relation client à distance et digitalisation).
- **VOLT FITNESS, et le BTS MCO** : l'attrition et la valeur vie d'un adhérent (Bloc 1 · relation client), l'encaissement d'avance et la saison (Bloc 3 · gestion opérationnelle) ; le BTS NDRC vient de son atelier.
- **MARTEL & FILS, et le BTS GPME et le BUT GEA** : le BTS GPME vient depuis de son atelier de première année (`martel`, Blocs 1, 2, 4 et une séance du Bloc 3 : le devis, le poste clients, le budget de trésorerie et les risques, l'embauche, le rapport au dirigeant) ; le BUT reste éditorial, pour la gestion financière d'une activité à cycle long, sans déroulé publié.
- **ROUTE & CIE, et le BUT GEA, le DCG et le BTS GPME** : l'atelier avancé la joue sans formation. Le coût à la palette, le renouvellement de la flotte par la valeur actuelle nette, le grand compte à soixante jours sont UE6 et UE11 du DCG, la gestion financière du BUT, et les Blocs 1 et 4 du BTS GPME (fournisseurs et développement de la PME).

Le tout est gardé (`tests/architecture/formations-servies.test.ts`) : chaque code existe, chaque entreprise jouée par un atelier liste au moins les formations de cet atelier, chaque entreprise du choix sert au moins une formation dans l'ordre du registre, et les pages lisent le module.

### 5.3 L'affichage, sans aucun sigle en dur

- `/jouer` : chaque carte d'entreprise porte « Sert : STMG, BTS CG, BTS MCO, BTS NDRC, BUT GEA et DCG » (`quick-config-form.tsx` l. 291, au-delà du téléphone), et la légende sous la grille le dit pour l'entreprise choisie à toutes les largeurs (l. 317), pour que le 3 × 3 du téléphone reste intact.
- `/animations` : le tableau écrit les formations servies sous chaque entreprise (l. 205), les cartes ont une ligne « Sert », et une section « Une même entreprise, plusieurs formations » (l. 309) liste, par entreprise dans l'ordre des choix, ses déroulés et ses formations ; une entreprise sans déroulé renvoie à l'encart sur mesure.
- `/parcours` : chaque diplôme nomme « Les entreprises qui servent ce diplôme » (l. 260), lues par `scenariosServant`.
- `/animations/[code]` : « Cette entreprise sert aussi … » dans « À retenir » (l. 300) et dans la fiche technique.

La garde « aucun mot de référentiel en dur » (`tests/pedagogy/ateliers.test.ts` l. 727) ne couvrait que « Processus mobilisés » sur deux pages. Elle couvre maintenant cinq fichiers (les deux pages d'ateliers, `/jouer`, `/parcours`, le composant des cartes) et tous les sigles et noms entiers de `FORMATIONS`, dans le code seul, commentaires retirés. Elle a trouvé une faute dès son premier passage : la liste des ateliers écrivait « processus en BTS CG, blocs de compétences en MCO, NDRC et GPME, thèmes au lycée, unités d'enseignement en DCG » dans une phrase (`animations/page.tsx`, anciennes l. 274 à 279). La phrase se lit maintenant dans les fiches (`MOTS_DES_REFERENTIELS`, l. 77) : le mot de chaque référentiel, regroupé par mot, dans l'ordre du registre.

## 6. Situations sur mesure

Une seule source de texte, `src/config/sur-mesure.ts` : le libellé de l'option, le titre, la promesse, ce qu'on demande à l'établissement (le référentiel ou le programme, le volume horaire et la durée des créneaux, le niveau et l'année, le secteur souhaité), ce qu'on livre (une entreprise fictive avec son marché et ses chocs, ses tours et ses situations-problèmes rattachées aux blocs, un déroulé de séances minuté avec livrables, traces et critères), le délai, présenté comme indicatif et comme un ordre de grandeur, et les deux gestes qui existent : le rendez-vous du menu (`LIEN_CONTACT`) et le devis (`/devis`). Aucun prix : tout se vend sur devis.

Affichage : l'encart entier sur `/animations` (après le tableau et la section des entreprises, `EncartSurMesure`, l. 359) ; la bande finale de `/parcours`, qui disait « Les mêmes mécaniques servent d'autres référentiels : prenons rendez-vous », prend le titre et la promesse du module et offre le rendez-vous puis le devis (l. 400) ; un paragraphe sur `/ecoles` (l. 306, sous les trois offres) et sur `/enseignants` (l. 387, sous les ateliers).

L'option `scenario-sur-mesure` de `tarifs.ts` (l. 925) prend son libellé dans le module : « Scénario sur mesure : une entreprise fictive à l'image de la vôtre », inchangé, de sorte que la grille figée d'octobre (`tests/fixtures/grille-d-octobre-2026.json`) et la base versée par la migration 0041 disent encore la même phrase. La garde `tests/architecture/sur-mesure.test.ts` vérifie l'égalité des trois, l'absence de prix et de tiret, le délai dit indicatif, les deux liens, et que les quatre pages lisent le module sans écrire leur propre phrase.

## 7. Gardes ajoutées

Dans `tests/pedagogy/ateliers.test.ts` :

1. « chaque séance laisse au tour joué au moins ce que le modèle de durée estime » (l. 765) : pour toute séance qui joue un tour, au moins une phase de jeu, et un verdict qui n'est pas « impossible ». La tolérance est NULLE, et c'est écrit dans la garde : le modèle est déjà un plancher (il ne compte ni les aides du formulaire ni le courrier du tour, et sa lecture est lente à dessein), donc une phase qui donne moins que ce plancher est un déroulé faux, pas un déroulé serré. La marge d'un quart n'est pas exigée : c'est un objectif d'écriture, atteint sur les soixante et onze séances, et la fiche montre les deux chiffres. Un texte de situation qui s'allonge demain fera rougir cette garde avant la classe. Vue rouge en donnant quinze minutes au premier mois de mco2.
2. « le niveau de jeu suit la formation et l'année » (l. 797). Vue rouge en passant cg1 au niveau 5.
3. « aucune séance post-bac ne dépasse deux heures » (remplace « aucune séance ne dépasse trois heures ») : chaque séance fait exactement 120 minutes, sauf stmg et campus, nommés un à un, à 90. Vue rouge sur les onze fiches tant qu'elles annoncent 180 minutes. La garde du créneau conseillé, que cette liste portait ici, a été retirée avec le champ (3.4).
4. La garde des mots de référentiel étendue aux sigles et aux cinq fichiers (l. 727). Vue rouge en écrivant « BTS CG » dans `/jouer`.

Nouveaux fichiers : `tests/architecture/formations-servies.test.ts` (vue rouge avec un code de formation inventé), `tests/architecture/sur-mesure.test.ts` (vue rouge avec un libellé d'option qui diverge), `tests/unit/duree-des-seances.test.ts` (la règle des phases de jeu, les verdicts, l'estimation, le découpage), `tests/unit/adaptations.test.ts` (les crans de cg1, stmg, dcg, mco, campus ; vue rouge avec un levier sans mots). Trois parcours de navigateur : `tests/e2e/animations.e2e.ts`, `jouer.e2e.ts`, `ecoles.e2e.ts`.

## 8. Ce qui reste ouvert

- Les arrêtés du BTS MHR et du BUT GEA, toujours à lire (`REFERENTIELS_NON_VERIFIES`), et la situation « 18 % de commission » de l'hôtel : inchangés depuis le document 11.
- Le modèle de durée est un modèle, pas une mesure. Dès qu'une classe aura joué un atelier, la médiane mesurée par le carnet d'usage dira mieux que l'estimation ; la garde devrait alors lire la mesure quand elle existe.
- MARTEL & FILS a maintenant son déroulé pour le BTS GPME (`src/config/ateliers/martel.ts`) ; la sous-traitance que le bâtiment promettait n'existe pas dans le moteur pour cette entreprise, et la fiche la chiffre sur le papier.
- Les adaptations nomment les séances à retoucher ; elles ne les réécrivent pas. Un atelier joué un cran plus bas reste à retoucher par son auteur, et la fiche dit lesquelles de ses séances.
