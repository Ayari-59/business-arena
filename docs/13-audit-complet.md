# Audit complet — septembre 2026

Fait sur `4c741fc`, sur les 394 fichiers de `src/` (94 347 lignes) et les
223 fichiers de tests. Chaque constat ci-dessous a été **mesuré**, pas supposé :
la commande ou le banc qui l'établit est donné avec lui.

Un seul défaut a été corrigé dans la foulée, parce qu'il tenait en dix lignes et
qu'il rendait vert le banc d'invariants ajouté (§1). Tout le reste est rapporté,
pas modifié : l'arbitrage appartient à l'auteur.

---

## Ce qui est sain

À dire d'abord, parce que c'est le plus coûteux à établir et que ça encadre le
reste.

**Les états financiers bouclent.** Banc ajouté : `tests/audit/etats-financiers.test.ts`,
15 scénarios × 6 tours × toutes les entreprises, 75 vérifications.

| Invariant | Résultat |
|---|---|
| Actif = passif | vrai partout, au centime |
| Ouverture + flux = clôture | vrai partout |
| Aucun NaN, aucun infini | vrai après correction §1 |
| Caisse, stock, découvert, immobilisations ≥ 0 | vrai partout |
| Caisse et découvert jamais simultanés | vrai partout |

**Le code est propre.** Zéro `TODO`/`FIXME`/`HACK`, zéro `any`, zéro
`@ts-ignore`, `tsc` silencieux. Les deux seuls `dangerouslySetInnerHTML` sont
dans le layout, sur des chaînes statiques.

**Pas de faille d'autorisation dans l'arène.** L'équipe se déduit du cookie
signé, jamais du formulaire : aucun élève ne peut jouer pour une autre équipe.

**Rien de secret n'est versionné**, aucune clé en dur. En-têtes de sécurité
complets (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy,
Permissions-Policy) et CSP bloquante. `'unsafe-inline'` sur `script-src` est un
arbitrage assumé et documenté (cache statique contre nonce par requête) ; il est
acceptable ici parce que React échappe tout et qu'aucun HTML tiers n'est injecté.

**Débit limité** sur `/orientation` et `/rendez-vous` (5 par IP et par heure).

**Routes propres** : 41 pages, une seule non liée (`/concepts`), et c'est une
redirection 308 voulue vers `/notions`.

---

## 1. Corrigé — la capacité main-d'œuvre partait à l'infini

`src/engine/simulation/index.ts`, chemin gamme. Quand rien n'était planifié —
ce qui arrive à **chaque tour d'une entreprise défaillante** (production gelée)
comme à l'élève qui met zéro partout —, `laborCapacity` valait `Infinity`.

Ce nombre part en base dans `engineTrace`, en `jsonb`. Or
`JSON.stringify(Infinity)` vaut `null` : la colonne est typée `EngineTrace`,
elle promet un nombre, et elle stockait `null`. Un mensonge de type, invisible
aujourd'hui parce que le tableau de bord ne lit que `produced` et
`utilizationRate` — jusqu'au jour où quelqu'un lit le champ.

À défaut de mix, la capacité se mesure désormais sur les heures **moyennes** de
la gamme : ce que l'atelier sortirait en fabriquant de tout à parts égales. Un
ordre de grandeur juste, et fini.

---

## 2. Le verrouillage pédagogique — RETIRÉ

**Le diagnostic de la première rédaction était incomplet, et le constat est en
réalité plus simple et plus grave.** J'avais écrit « 39 des 56 entrées de la
carte désignent une situation qui n'existe plus », ce qui laissait croire à une
carte autrefois juste, devenue obsolète. La vérification complète dit autre
chose : **les deux moitiés du dispositif n'ont jamais partagé de vocabulaire.**

Trois pièces devaient s'emboîter :

| Pièce | Ce qu'elle contenait |
|---|---|
| `learning-paths.ts` | 6 sentiers, 25 étapes, nommées `LP-pricing-1-intro`, `LP-cash-flow-2-bfr`… |
| `situation-learning-map.ts` | 56 entrées liant une situation à des étapes nommées `core_01`, `market_02`, `finance_04`… |
| `isAccessible` | le verrou lui-même |

**Aucune correspondance entre les deux nomenclatures, sur aucune des 25
étapes.** La chaîne se terminait donc ainsi, à chaque débriefing :

```
markStepCompleted(élève, "core_01")
  → getLearningStep("core_01") → introuvable
  → throw new Error("Step core_01 not found")
  → } catch { }          ← avalé, sans une trace
```

Le `catch` vide portait ce commentaire : « Silently skip if step doesn't exist ».
Écrit pour tolérer une étape manquante, il tolérait qu'aucune n'existe.

Conséquences mesurées :

- la table `completed_learning_steps` n'a **jamais** reçu une ligne, sur aucun
  scénario, pour aucun élève ;
- le score affiché valant `étapes complétées ÷ 25`, l'onglet **« Progression »
  de la barre enseignant affichait 0 % pour toutes les équipes, toujours** ;
- 39 des 56 entrées de la carte désignaient en plus une situation supprimée ;
- `isAccessible` était de toute façon écrit en dur à `true`, rendant la branche
  de `situation-panel.tsx` inatteignable.

Ce n'était donc pas une régression : c'était un chantier interrompu, jamais
fonctionnel sur aucune version.

**Décision : retiré.** Réparer n'aurait pas été corriger 39 lignes mais
concevoir la progression — quelles étapes, délivrées par quoi, dans quel
ordre, pour 137 situations et 15 scénarios. Un travail de didacticien. Et il
aurait fallu d'abord trancher une question de fond : les situations que la
carte verrouillait sont celles de **détection**, qui s'ouvrent quand l'élève va
mal, c'est-à-dire au moment où elles servent. Les lui fermer, c'est lui refuser
l'explication de ce qui vient de lui arriver.

Ont disparu : `learning-progress.service.ts`, `learning-paths.ts`,
`situation-learning-map.ts`, la page `/teacher/learning` et son tableau de
bord, l'onglet « Progression », les deux champs sur `SituationDef`, les deux
sur `SituationView`, et la branche morte de l'écran élève.

**N'a pas disparu, et c'est l'essentiel : la maîtrise des notions.** Mesurée au
diagnostic, écrite dans `learning_progress`, visible dans la vue pédagogique.
Celle-là fonctionne, et elle est intacte.

Les deux tables `completed_learning_steps` et `learning_path_progression`
restent en base, vides : les supprimer serait une porte à sens unique sur une
base de production, pour un gain nul. Le schéma le dit sur place.

*Si une progression est un jour reconçue, la piste à retenir est l'inverse du
verrou : non pas fermer une situation, mais signaler à l'élève ce qui lui
manque pour la comprendre, avec le lien vers la fiche notion. Même intention
pédagogique, sans jamais fermer une porte au moment où elle sert.*

## 3. 370 lignes mortes qui dupliquent le chemin vivant — CORRIGÉ

**Gravité : haute** (risque de correction à moitié appliquée).

`debrief.service.ts` (733 lignes) et `pedagogy.service.ts` (763 lignes) sont
**identiques à 49 %** hors commentaires — dont un bloc de 95 lignes et un de 83.
Les deux exportent `submitQuiz` et `debriefRound`.

Or, mesuré sur tous les imports du dépôt :

| Export de `debrief.service` | Importé par |
|---|---|
| `setMissedPolicy` | `teacher/actions.ts` |
| `retakeSituation` | `arena/[gameId]/actions.ts` |
| `askedQuestions`, `modelCtxOf`, `toView`, `SituationView` | `pedagogy-reporting.service.ts` |
| **`submitQuiz`** | **personne** |
| **`debriefRound`** | **personne** |

Le chemin vivant passe par `pedagogy.service` : `arena/actions.ts` y prend
`submitQuiz`, `round-resolution.service.ts` y prend `debriefRound`. Les deux
grosses fonctions de `debrief.service` — environ 370 lignes — sont du code mort
qui ressemble au code vivant. Une correction faite sur la mauvaise copie ne se
verrait nulle part, et rien ne le signalerait.

L'en-tête de `pedagogy.service.ts:48` décrit d'ailleurs encore
`debrief.service` comme faisant « QCM, rattrapage, débriefing » : la
documentation est à moitié fausse.

**Correctif :** supprimer `submitQuiz` et `debriefRound` de `debrief.service`,
garder les quatre helpers, corriger l'en-tête.

---

## 4. Contraste : 111 textes sous le seuil AA — CORRIGÉ

**Gravité : moyenne.** Mesuré sur l'échelle Tailwind réellement employée.

| Classe | sur slate-900 | sur slate-950 | WCAG AA (4,5:1) |
|---|---|---|---|
| `text-slate-600` | 2,36:1 | 2,66:1 | **échec**, sous même le seuil non textuel |
| `text-slate-500` | 3,75:1 | 4,24:1 | **échec** |
| `text-slate-400` | 6,96:1 | 7,87:1 | conforme |

`text-slate-400` (657 usages) est sain. Ce sont les 111 usages de `slate-500` et
`slate-600` qui posent problème — et ils ne sont pas décoratifs : étiquettes de
chiffrage (`decision-form.tsx:573`), mentions de l'assistant, libellés d'étapes
à venir. En classe, sur un vidéoprojecteur ou un écran de téléphone en plein
jour, ces textes disparaissent.

`tests/architecture/accessibilite.test.ts` garde la **taille** (≥ 12 px) et le
**padding** (≥ 12 px), mais pas le **contraste** : c'est un trou dans la garde
autant qu'un défaut dans les pages. Le calcul est mécanique et tiendrait en une
garde de plus.

---

## 5. N+1 dans le chemin de clôture du tour — CORRIGÉ

**Gravité : moyenne.** `src/services/pedagogy.service.ts:485`

```ts
for (const userId of allUserIds) {
  const progress = await db.select(...).where(eq(learningProgress.userId, userId));
```

Une requête **par élève**, en série, dans le chemin que l'enseignant déclenche en
cliquant « clore le tour », devant sa classe. À 30 élèves, 30 allers-retours qui
s'ajoutent les uns aux autres. Un `inArray(learningProgress.userId, allUserIds)`
suivi d'un regroupement en mémoire fait le même travail en une requête.

Même motif, moins critique car hors chemin chaud : `competition.service.ts:921`
(deux requêtes par phase de tournoi), `pedagogy-reporting.service.ts:798`.

---

## 6. Endpoints publics sans limite, qui écrivent en base — CORRIGÉ

**Gravité : moyenne.** Trois actions serveur non authentifiées créent des lignes
avant toute validation :

| Endpoint | Ce qu'un appel crée | Limite |
|---|---|---|
| `/jouer` → `startGameAction` | un utilisateur **et une partie complète** (partie, équipes, état, snapshot de scénario en jsonb) | aucune |
| `/join` → `joinGameAction` | un utilisateur invité, **avant** de vérifier le code | aucune |
| `/compete` | un utilisateur invité, **avant** de vérifier le concours | aucune |

`getOrCreateGuestUserId()` insère dans `users` dès qu'aucun cookie valide n'est
présent (`src/lib/guest.ts:44`). Une boucle sans cookie crée donc autant de
lignes qu'elle fait de requêtes — et sur `/jouer`, autant de parties.

Ce n'est pas une faille d'autorisation : c'est une amplification d'écriture qui
coûte de la base et de l'argent. Le motif du correctif existe déjà dans le
dépôt : `PLAFOND_PAR_IP_PAR_HEURE` (`orientation-request.service.ts:17`). Il
suffit de l'appliquer, et de ne créer l'invité qu'**après** validation du code.

---

## 7. Le test de jouabilité joue une configuration qui n'existe pas — CORRIGÉ

**Gravité : moyenne** (le test rassure à tort).

`tests/scenarios/jouabilite.test.ts` fait tourner chaque scénario **brut**, avec
le joueur et **les sept bots**. Or une vraie partie applique
`applyMarketScale(scenario, concurrents)` — précisément parce que, sans
redimensionnement, « une classe nombreuse partage un gâteau calibré pour trois
concurrents » (le commentaire de `game-creation.service.ts:195` le dit).

Mesuré dans la configuration que le test joue :

| | joueur neutre | joueur équilibré | bots morts en fin de partie |
|---|---|---|---|
| nova | faillite T2 | faillite T2 | 7/7 |
| bistrot | faillite T2 | faillite T2 | 7/7 |
| ecommerce | faillite T2 | faillite T2 | 5/7 |

Et la même mesure **avec** le redimensionnement, donc dans les conditions
réelles : le joueur survit partout, dans les 15 scénarios, à 3 comme à 8
entreprises. Le moteur va bien ; c'est le test qui joue autre chose que le jeu.

Il passe parce qu'il ne vérifie jamais la survie — seulement que rien ne casse.
**Correctif :** appliquer `applyMarketScale` comme le fait la création de partie,
et ajouter l'assertion qui manque.

*Effet de bord utile :* cette mesure a aussi montré que la stratégie **passive**
mène au dépôt de bilan sur `ecommerce` (tour 3) et `nova` (tour 6) même à trois
entreprises. Un élève qui ne change rien est un cas de classe très fréquent :
à arbitrer, ce n'est pas forcément un défaut.

---

## 8. Constats mineurs

- ~~**eslint n'est pas dans la CI.**~~ **CORRIGÉ.** L'étape `Lint` passe
  désormais avant les tests. Zéro erreur aujourd'hui, quatorze avertissements
  antérieurs qui ne bloquent pas.
- **14 notions orphelines sur 52** (27 %) : `ebitda_margin`, `depreciation`,
  `full_unit_cost`, `distribution_commission`, `customer_acquisition_cost`,
  `payment_terms`, `weighted_average_cost`, `vat_payable`, `occupancy_revpar`,
  `operating_leverage`, `csr_index`, `brand_capital`, `volume_price_variance`,
  `balance_sheet`. Aucune situation ne les mobilise : elles existent en fiche, et
  la maîtrise ne peut jamais s'en mesurer. Les 20 modèles de décision, eux, sont
  tous cités au moins une fois.
- ~~**Le salaire du transport est hors échelle.**~~ **CONSTAT RETIRÉ, il était
  faux.** Je l'avais bâti sur une comparaison qui ne tient pas : « 49 600 €/an
  chargé, quasiment celui du conseil (50 400 €) ». Or `conseil` déclare
  `hoursPerEmployee: 60` là où les autres secteurs déclarent 455 : ses heures
  sont des heures FACTURABLES, pas des heures de présence. Comparer les deux
  totaux annuels revenait à comparer deux nombres qui ne mesurent pas la même
  chose.

  La bonne comparaison est le coût horaire chargé, et elle raconte autre
  chose :

  | Secteur | €/tour | h/tour | €/heure chargée |
  |---|---|---|---|
  | transport | 12 400 | 455 | 27,3 |
  | bâtiment | 9 600 | 455 | 21,1 |
  | hôtel | 8 600 | 455 | 18,9 |
  | e-commerce | 8 200 | 455 | 18,0 |
  | boutique, bistrot | 7 200 | 455 | 15,8 |
  | NOVA | 8 000 | 540 | 14,8 |

  27,3 €/heure chargée pour un conducteur routier est défendable dès qu'on
  compte les frais de route, qui sont un coût réel de l'employeur. Et la valeur
  avait été relevée **volontairement**, avec sa raison écrite dans le code :
  « 49 600 € par an et par chauffeur, charges comprises : le coût réel d'un
  conducteur routier, et non les 35 200 € que portait la première version. »

  Rien n'est modifié. Reste, pour l'œil de l'auteur et non comme un défaut :
  le transport est 30 % au-dessus du bâtiment pour des qualifications voisines.
  C'est un arbitrage de calibration, pas une erreur.
- **Deux vulnérabilités modérées** en dépendance de production : `exceljs` →
  `uuid` (absence de contrôle de bornes quand un `buf` est fourni). L'exposition
  réelle est faible — les classeurs sont générés côté serveur à partir de
  données du jeu, jamais d'entrée utilisateur — mais le correctif impose un
  changement majeur d'`exceljs`.
- **`revenueVarianceBySegment` n'est pas un écart sur chiffre d'affaires**, et
  le code le dit lui-même (`engine/costs/variance.ts`). **CORRIGÉ, avec une
  rectification du constat :** j'avais écrit que le panneau « l'affiche quand
  même », laissant croire qu'un élève le voyait. C'est faux — `VariancePanel`
  n'est importé par aucune page, personne ne l'a jamais vu. Le moteur calcule
  pourtant ces écarts à chaque tour et pour chaque référence, et rien ne les
  lit. Les deux chiffres faux sont retirés du panneau et une garde empêche
  qu'ils y reviennent ; les écarts de COÛTS, qui sont justes, y restent seuls.
  Deux décisions en suspens : brancher ce panneau, ou cesser de calculer ce que
  personne ne lit.
- **Deux mécanismes pour la même redirection** : `/ateliers → /animations` passe
  par `next.config.ts`, `/concepts → /notions` par une page qui appelle
  `permanentRedirect`. La première est traitée avant tout rendu ; la seconde
  monte une route React pour ne rien afficher.
- **2,3 Mo de JavaScript** servis en chunks, dont un de 886 Ko. `decision-form.tsx`
  est le plus gros composant client du dépôt (2 554 lignes) et il est chargé par
  l'écran que tous les élèves ouvrent.

---

## Où en est l'audit

| § | Constat | État |
|---|---|---|
| 1 | Capacité main-d'œuvre infinie en base | corrigé |
| 2 | Verrouillage pédagogique inerte | **retiré** |
| 3 | 370 lignes mortes dupliquant le chemin vivant | corrigé |
| 4 | Contraste sous le seuil AA (111 textes, + l'encre du courrier) | corrigé, avec garde |
| 5 | N+1 à la clôture du tour | corrigé, avec garde |
| 6 | Endpoints publics sans limite | corrigé, avec garde |
| 7 | Test de jouabilité hors sujet | corrigé, l'assertion mord |
| 8 | Constats mineurs | **à faire** |

Il reste le §8, et deux chantiers hors audit : eslint dans la CI (le plus
rentable des trois lignes à écrire), et la répétition générale scriptée d'une
séance complète — l'application n'a toujours jamais rencontré d'élèves.
