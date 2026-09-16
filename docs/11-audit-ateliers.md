# Audit des ateliers — 16 septembre 2026

Onze ateliers publiés (`src/config/ateliers/`), lus intégralement et confrontés au moteur, aux scénarios, aux niveaux de difficulté et aux référentiels. Méthode : une analyse structurelle automatique du registre (tours, niveaux, leviers ouverts, situations déclenchées, référentiels, notions), puis une lecture séance par séance. Les numéros de ligne renvoient aux fichiers de `src/config/ateliers/`.

Ce que les gardes de `tests/pedagogy/ateliers.test.ts` garantissent déjà et qui n'est donc pas repris ici : minutage exact des séances, tours croissants, séance sans tour en dernier, `tours` égal au nombre de séances jouées, variante de scénario conforme au niveau, entrées de référentiel non inventées, aucune séance sur un levier fermé.

## 1. Vue d'ensemble

| Atelier | Diplôme | Scénario · niveau · tours | Heures | Verdict |
|---|---|---|---|---|
| debutant | Découverte | boutique-mono · 1 · 4 | 8 | Solide, une notion par séance |
| stmg | Bac STMG | nova · 1 · 4 | 6 | Solide ; trésorerie du T4 ignorée, « sans aléa » faux |
| cg1 | BTS CG 1 | nova · 3 · 6 | 18 | La meilleure fiche, fidèle au produit |
| mco | BTS MCO 1 | boutique · 3 · 4 | 15 | Solide ; comptage des livrables faux |
| ndrc | BTS NDRC 1 | ecommerce · 2 · 5 | 18 | Bon alignement ; deux promesses inverses au moteur |
| gpme | BTS GPME 2 | conseil-gamme · 4 · 5 | 18 | Bon ; la gamme et la R&D imposées par le niveau ne sont pas jouées |
| mhr | BTS MHR 1 | hotel · 3 · 4 | 15 | S3 écrite pour un pic que l'hôtel ne porte pas |
| gea | BUT GEA 1 | nova-gamme · 4 · 4 | 15 | Maillon faible : gamme annoncée, jamais jouée ; copie de CG1 |
| dcg | DCG 2/3 | nova-gamme · 5 · 4 · variable | 15 | Bon ; investissement au dernier tour sans effet observable |
| dcg-rse | DCG 2/3 | nova-gamme · 5 · 5 · variable | 18 | Le plus original, le plus exposé aux écarts avec le moteur RSE |
| avance | Transversal | transport · 5 · 5 · variable | 18 | Promet ce que le transport ne porte pas (kilomètre, sous-traitance, pénalités) |

Scénarios sans atelier : hotel-gamme, bistrot, bistrot-gamme, conseil, ecommerce-gamme, fitness, batiment. Quatre ateliers sur cinq de niveau BTS/DCG tournent sur NOVA (stmg, cg1, gea, dcg, dcg-rse).

## 2. Constats transversaux

1. **« Monde variable décoché » ne coupe pas les aléas.** `game-creation.service.ts` n'applique que la texture des paramètres ; les événements restent tirés (probabilité × 0,5 au niveau 1, × 0,75 au 2, × 1 au 3, × 1,25 au 4, × 1,5 au 5). Fiches qui affirment le contraire : stmg l.32-34 et l.116 (« sans aléa »), ndrc l.49, gpme l.48. Seule mhr l.53 est juste (« la même saison »).
2. **« La partie reste ouverte » est faux.** `reglages.tours` fixe le nombre de tours à la création, rien ne prolonge une partie : gea l.445 et l.456, mco l.453, dcg l.440 promettent un prolongement qui demande de recréer une partie.
3. **Changer de niveau en cours de partie n'existe pas** : dcg l.457.
4. **Monter ou descendre d'un niveau change parfois de scénario** (`gammeFromLevel: 4` pour nova, hotel, conseil, ecommerce) : mhr au niveau 4 bascule sur hotel-gamme, gpme au niveau 3 sur conseil mono ; aucune FAQ ne le dit (mhr l.461, gpme l.529).
5. **Comptage des livrables faux** dans quatre évaluations finales : gea l.437, mhr l.437, mco l.434 (« cinq » pour quatre) et avance l.509 (« six » pour cinq) ; le livrable de la dernière séance est compté une seconde fois à la ligne suivante.
6. **Délais de règlement cités faux** dans NOVA : étudiants et passionnés paient comptant, CampusTech à 80 jours à partir du tour 3 ; gea l.165 et cg1 l.235 écrivent « soixante jours ».
7. **Les événements scriptés ne sont pas dans les fiches** : hausse des matières +20 % au tour 5 de NOVA (cg1 S5, dcg-rse S5), choc énergie +22 % au tour 4 de l'hôtel (mhr S4), gazole +18 % au tour 3 du transport (avance S3), décret d'ouverture du marché au tour 4 du conseil (gpme S4). L'enseignant découvre ces chocs en même temps que sa classe.
8. **Le marché est redimensionné au nombre de concurrents** (facteur concurrents/3). Les chiffres de marché des commentaires d'en-tête (stmg l.14-15) sont ceux de la calibration à trois concurrents ; à huit équipes le marché joué est 2,7 fois plus grand.
9. **Échelle de difficulté incohérente** : le même chiffre porte des mots différents (1 = « Initiation » pour debutant, « Découverte » pour stmg ; 2 = « Initiation » ; 3 = « Approfondissement » pour gpme, « Pilotage » pour mhr et gea). Une échelle unique, définie une fois, s'impose.
10. **Les notions citées n'ont presque jamais de fiche notion** : 12 notions sur 16 pour debutant, 19 sur 25 pour cg1, 24 sur 24 pour dcg-rse, 29 sur 30 pour avance sont absentes du catalogue de 39 fiches (`src/config/pedagogy/concepts.ts`), et la fiche d'atelier les affiche en texte mort (`animations/[code]/page.tsx` l.349). Soit on relie chaque notion à une fiche, soit on enrichit le catalogue.
11. **Aucune épreuve d'examen n'est nommée** hors dcg (l.465) et gpme (l.537, sans nommer E4/E5/E6). Les livrables sont pourtant taillés pour E4/E6 (GPME), E5/E6 (NDRC), l'épreuve écrite MSGN et le Grand oral (STMG), UE13 (DCG).
12. **Traces au passeport à deux actes** : debutant (4/4), mco (4/5), stmg (3/4), ndrc (3/6) écrivent « J'ai … et j'ai … » ; un passeport attend un acte par ligne.
13. **Livrables sans nom de document** (pas de « : » dans la phrase) : cg1 3/6, dcg-rse 2/6 ; le formulaire prend alors le titre de la séance.
14. **Le pilier gouvernance de l'indice RSE est pénalisé pour tout le monde** : `rse.ts` l.122-130 retire dix points quand aucun plan de trésorerie n'est déposé, et l'arène ne permet plus d'en déposer (`bank.ts` l.13-22). Toute équipe, à tout tour, porte ce malus sans pouvoir l'expliquer.

## 3. Erreurs à corriger, atelier par atelier

**stmg** · l.417 « monter d'un cran … ouvre la trésorerie » : c'est le niveau 3, donc deux crans. · l.396 « Demi-journée banalisée » pour 6 h 30. · l.350 « ce qu'elles sortent de leur stock » n'est pas une décision du moteur. · S4 ignore la trésorerie du tour 4 (CampusTech payé à 80 jours) que les notes l.116 promettent ; au niveau 1 aucune décision de financement n'est ouverte, une équipe peut tomber en financement de sauvetage sans levier.

**ndrc** · l.23 `traceLabel` au pluriel : la page écrit « son fiches descriptives d'activités ». · FAQ q5 l.538-541 propose de fusionner les séances 3 et 5, qui jouent chacune un tour : impossible. · S4 l.285 et l.291 promettent une acquisition « plus chère » au pic ; le coût du clic est constant dans le moteur et le CAC baisse au pic. · S4 arrive un tour trop tard pour le stock : la capacité de préparation est de 7 000 commandes par tour, la demande du tour 4 la dépasse, et rien en S3 ne fait préparer le stock. · Critère l.193 : le CAC du jeu divise par les commandes du segment nouveaux clients, pas par « les clients réellement venus ». · Pitch l.27 « négocie sa place sur les marketplaces » : la commission est fixe.

**gpme** · « activités » (l.11, 33, 479, 499, 522-529) alors que le référentiel et `referentielLabel` disent « blocs ». · La gamme (trois offres) et la R&D (cyber-sécurité, 30 000 € dès le tour 2) sont imposées par le niveau 4 et posées par le dilemme du tour 1 ; aucune séance ne les cadre. · FAQ q3 l.529 : le niveau 4 ouvre aussi investissement, RSE, R&D, qualité, maintenance ; descendre d'un cran bascule en mono.

**mhr** · S3 est écrite pour un pic de volume (« afflux », « les chambres manquent ») ; le tour 3 de l'hôtel est un changement de mix (affaires × 0,5, groupes × 0,3, loisirs × 2) à volume presque constant, et la situation du tour le dit elle-même. La leçon réelle : loisirs élastiques et payés comptant, affaires et groupes à 30 et 45 jours qui reviennent au tour 4. · Compétence l.216 « j'arbitre entre des clientèles » : en mono-produit il n'y a qu'un prix et un volume. · S4 muette sur le choc énergie du tour 4 (+22 % sur deux tours) : l'écart prévu/réalisé sera attribué à la prévision. · Notion « assurance » l.296 sans phase. · Option du BTS (A, B, C) non précisée.

**gea** · Gamme promise (notes l.53 « le mix devient une décision »), jamais jouée : S1 parle d'« un produit » et d'« un coût de revient unitaire ». · La Studio se développe par R&D (25 000 €, disponible au tour 2) et le dilemme du tour 1 porte dessus ; la fiche ne nomme ni R&D ni prototype. · Notes l.53 omettent R&D et RSE parmi les leviers ouverts. · S3 ne dit pas que l'investissement se fait par lignes typées ni qu'il prend effet au tour suivant. · Le référentiel BUT GEA n'a pas été lu : le BUT est écrit en compétences à niveaux et en parcours (GC2F, GEMA, GPRH), pas en blocs ; « dossier professionnel » y est plutôt un portfolio.

**dcg** · l.77 « équipes de trois ou quatre » contre `effectifParEquipe` « trois ». · S4 investit au tour 4, dernier tour joué : la capacité prend effet au tour suivant, l'équipe ne verra jamais l'effet. · `pourquoi` l.35, S4 l.319 et critère l.341 supposent une banque qui juge « la fiabilité des plans » ; la banque juge la tenue de trésorerie et l'arène ne saisit plus de plan. · S3 « écarts prix / volume / coûts » : la seule situation d'écarts existe en NOVA mono au tour 2, pas en gamme.

**dcg-rse** · S1 fait lire l'indice RSE avant d'avoir joué : il n'est calculé qu'à la clôture. · S3 entière sur la baisse des rebuts : NOVA n'a pas de non-qualité par défaut, elle ne se crée qu'en réglant un taux de rebut à la création, ce que les réglages ne demandent pas. · S3 « empreinte » du fournisseur : ce n'est pas une donnée, c'est un proxy dérivé du coût et de la qualité. · S5 présente les cartes RSE (label, subvention, bad buzz, amende) comme la réaction du « dernier tour » : elles tombent dès le tour 3. · S2 oppose un marketing « qui s'éteint vite » à l'image RSE : le budget de marque de NOVA gamme est lui aussi un capital lent. · UE5 sur les parties prenantes relève d'UE7. · Évaluation finale sans pondération.

**avance** · « Coût de revient au kilomètre » (S1 : l.65, 67, 72, 119, 123) : le transport se compte en palettes, le kilomètre n'existe pas dans le jeu. · Sous-traitance (l.10, 30, 203-273, 533) : le scénario transport n'en porte pas. · Pénalités de retard (l.293, 316, 343) : inexistantes dans le moteur, seule la ponctualité perçue joue. · Les séances 1 à 4 et 6 recopient GEA phase par phase, minutes comprises. · Décalage systématique avec les situations du scénario : S2 fait le BFR quand le tour 2 pose le retour à vide, S3 investit quand le tour 3 subit le gazole, S5 place les excédents quand le tour 5 pose « renouveler ou réparer ». · En-tête l.16-18 « il n'apprend pas les notions » contredit S1 et S2.

**cg1** · l.235 délais. · l.100 : le niveau 3 expose aussi qualité, maintenance, fournisseur, assurance, financement ; à dire. · S5 muette sur la hausse des matières du tour 5.

**mco** · l.434 « cinq livrables intermédiaires » pour quatre. · l.453 « la partie reste ouverte ».

**debutant** · Rien de bloquant. Traces à deux actes.

## 4. Améliorations à faible coût

- Une échelle de difficulté unique (1 Découverte, 2 Initiation, 3 Approfondissement, 4 Avancé) dans `types.ts` ou `index.ts`, et une garde.
- Nommer les événements scriptés dans la préparation de la séance qui les subit (cg1 S5, dcg-rse S5, mhr S4, avance S3, gpme S4).
- Nommer les épreuves : E4/E5/E6 (NDRC, GPME, MCO), épreuve écrite MSGN et Grand oral (STMG), UE13 (DCG), dans la FAQ ou les prolongements.
- Relier les notions aux fiches notions : un champ `notionsCles: ConceptId[]` optionnel par séance, affiché en lien, avec une garde qui refuse un identifiant inconnu ; enrichir le catalogue des vingt notions les plus citées (charges fixes et variables, budget de trésorerie, délai de règlement, taux de marque, coût d'acquisition client, tableau de bord, BFR, CUMP, écarts, RevPAR, taux d'occupation).
- Chiffrer les oraux non chiffrés (mhr S5, gea S5, dcg-rse S6, avance S6) et corriger les jeux de rôle qui laissent quatre équipes spectatrices (ndrc S5 : trois binômes simultanés).
- Une trace par acte dans `tracePasseport` (couper les « J'ai … et j'ai … »), et un nom de document devant chaque livrable.
- Dire dans chaque FAQ ce que fait réellement « monter ou descendre d'un niveau » (leviers ouverts, bascule mono/gamme).
- STMG : citer « Numérique et intelligence collective » en S4 et « De l'individu à l'acteur » en S1, les deux seuls thèmes jamais mobilisés ; ajouter en S4 une question de débriefing résultat contre trésorerie.
- CG1 : citer P6 sur S3 et S4 ou expliquer son absence ; retirer P7 de S1.
- DCG : citer UE13 sur la soutenance, l'étude projet achetable (VAN/TRI, 1 200 €) en S4, le plafond d'apport de 100 000 €.
- DCG-RSE : donner les ordres de grandeur (label ≈ 15 000 € par trimestre, amende et subvention = 12 000 €, cartes dès le tour 3) ; pondérer l'évaluation finale ; prévoir en S6 l'équipe qui n'a jamais engagé la RSE et n'a donc pas de synthèse extra-financière.
- GPME : exploiter le panneau des frais de mission et ses délais (30/30/15 jours) pour servir le bloc 1 côté fournisseurs ; faire lire le décret du tour 4 en ouverture de S4.
- MHR : nommer la commande exceptionnelle (allotement tour-opérateur, congrès) comme support de l'arbitrage entre clientèles ; donner une phase à l'assurance ou retirer la notion ; intégrer la situation orpheline du tour 4 (18 % de commission des plateformes).

## 5. Évolutions plus lourdes

- **GEA** : soit écrire la gamme (S1 : coût de revient par enceinte et question de la Studio ; S3 : facteur rare, marge par unité de capacité, investissement typé), soit basculer l'atelier en mono (nova, niveau 3) et assumer que le mix attend la deuxième année. Puis relire l'arrêté du BUT GEA, rattacher la fiche à un parcours et sortir `gea` de `REFERENTIELS_NON_VERIFIES`.
- **Avancé** : réécrire les séances pour qu'elles suivent le scénario transport (retour à vide et coût marginal, gazole et sensibilité, grand compte et pic, flotte par la VAN et placement, contrat à refuser au tour 6) ; c'est le seul atelier dont le titre n'est servi par aucune phase spécifique.
- **DCG** : déplacer l'investissement en S3 (tour 3, effet visible au pic du tour 4) et les écarts en S4 ; ou jouer cinq tours ; ajouter une situation d'écarts en gamme (transposition de celle de NOVA mono).
- **DCG-RSE** : dans `rse.ts`, ne plus pénaliser la gouvernance pour un plan que l'arène ne permet plus de déposer ; si l'on veut un vrai troisième critère fournisseur, donner au scénario un attribut d'empreinte par fournisseur.
- **NDRC** : si l'on tient à « l'acquisition coûte plus cher au pic », introduire un multiplicateur saisonnier du coût d'acquisition dans le scénario ; sinon réécrire S4 autour du vrai piège du moteur, la trésorerie (stock et publicité décaissés avant, marketplace payée à 30 jours).
- **MHR** : lire l'arrêté du BTS MHR et sortir `mhr` de `REFERENTIELS_NON_VERIFIES` ; préciser l'option.
- **Couverture** : sept scénarios n'ont pas d'atelier (bistrot, fitness, bâtiment, hôtel gamme, e-commerce gamme, conseil mono). Deux ateliers manquent à l'évidence : un BTS MHR option B/C sur le bistrot, et un atelier « abonnements » sur la salle de sport (BTS NDRC 2 ou MCO 2), qui diversifieraient une offre concentrée sur NOVA.

## 6. Ordre proposé

1. **Lot 1, erreurs de fait** (une demi-journée) : constats 1 à 7, `traceLabel` NDRC, GPME « activités », effectif DCG, kilomètre/sous-traitance/pénalités en transport, S1 et S5 de DCG-RSE, rebuts à activer. Avec une garde pour le comptage des livrables et une pour « la partie reste ouverte ».
2. **Lot 2, cohérence** (une journée) : échelle de difficulté, épreuves nommées, événements scriptés dans les préparations, oraux chiffrés, FAQ sur les niveaux, traces à un acte, notions reliées aux fiches.
3. **Lot 3, réécritures** : GEA, Avancé, S3 de MHR, S3-S4 de DCG, puis les deux ateliers manquants.
