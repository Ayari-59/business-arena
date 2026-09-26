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

## 2. Le verrouillage pédagogique ne verrouille rien

**Gravité : haute.** Une fonctionnalité entière, câblée, visible dans le tableau
de bord enseignant, et inerte.

- `src/services/debrief.service.ts:701` pose `isAccessible: true` **en dur**.
  C'est le seul endroit qui produit ce champ.
- `src/components/situation-panel.tsx:125` teste `!situation.isAccessible` :
  branche **inatteignable**.
- `SITUATION_LEARNING_MAP` compte 56 entrées, dont **39 désignent une situation
  qui n'existe plus** (`nova_t1_reprise`, `hotel_t2_overbooking`,
  `transport_t3_renouvellement`…). Elles ne font donc rien, silencieusement.
- Résultat sur les 137 situations : 13 portent un prérequis, soit 9,5 %. Et la
  répartition est incohérente — `boutique` 8 sur 9, `boutique-mono` (son jumeau)
  0 ; `hotel` 2, `hotel-gamme` 0 ; NOVA, le scénario par défaut, 0.
- Pire, si le verrou était réactivé tel quel : **13 situations seraient
  définitivement inaccessibles**, car elles exigent une étape que leur propre
  scénario ne délivre jamais.

| Situation bloquée | Étape exigée, jamais délivrée |
|---|---|
| Le trimestre s'est terminé dans le rouge (boutique) | `finance_02` |
| Rentable, et pourtant à découvert (boutique) | `finance_03` |
| Sous le taux d'occupation d'équilibre (hotel) | `finance_02` |
| Le service ne couvre plus ses frais (bistrot) | `finance_02` |
| Sous le seuil (fitness) | `finance_02` |
| …et 8 autres | |

Ce sont exactement les situations de **détection** : celles qui s'ouvrent quand
l'élève est en difficulté, c'est-à-dire au moment où elles servent.

**Deux issues, pas trois.** Soit le verrou est assumé : il faut alors réparer la
carte et garantir qu'aucune étape exigée n'est orpheline. Soit il est abandonné :
il faut alors retirer `isAccessible`, la carte et la branche morte, et cesser de
montrer à l'enseignant une progression qui ne commande rien.

---

## 3. 370 lignes mortes qui dupliquent le chemin vivant

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

## 4. Contraste : 111 textes sous le seuil AA

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

## 5. N+1 dans le chemin de clôture du tour

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

## 6. Endpoints publics sans limite, qui écrivent en base

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

## 7. Le test de jouabilité joue une configuration qui n'existe pas

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

- **eslint n'est pas dans la CI.** `package.json` a `"lint": "eslint ."`, mais
  `.github/workflows/ci.yml` n'enchaîne que `typecheck`, `test` et `build`. Les
  14 avertissements actuels ne bloquent rien, et une future erreur non plus.
- **14 notions orphelines sur 52** (27 %) : `ebitda_margin`, `depreciation`,
  `full_unit_cost`, `distribution_commission`, `customer_acquisition_cost`,
  `payment_terms`, `weighted_average_cost`, `vat_payable`, `occupancy_revpar`,
  `operating_leverage`, `csr_index`, `brand_capital`, `volume_price_variance`,
  `balance_sheet`. Aucune situation ne les mobilise : elles existent en fiche, et
  la maîtrise ne peut jamais s'en mesurer. Les 20 modèles de décision, eux, sont
  tous cités au moins une fois.
- **Le salaire du transport est hors échelle.** 12 400 €/tour de 90 jours, soit
  **49 600 €/an chargé**, quasiment celui du conseil (50 400 €). Un conducteur
  routier coûte plutôt 36 000 à 38 000 € chargés. Environ 9 500 €/trimestre
  remettrait le secteur dans son échelle.
- **Deux vulnérabilités modérées** en dépendance de production : `exceljs` →
  `uuid` (absence de contrôle de bornes quand un `buf` est fourni). L'exposition
  réelle est faible — les classeurs sont générés côté serveur à partir de
  données du jeu, jamais d'entrée utilisateur — mais le correctif impose un
  changement majeur d'`exceljs`.
- **`revenueVarianceBySegment` n'est pas un écart sur chiffre d'affaires**, et
  le code le dit lui-même (`engine/costs/variance.ts:32`). Le panneau
  `variance-panel.tsx:73` l'affiche quand même. Tant que le vrai calcul n'est pas
  écrit, l'afficher enseigne une notion fausse.
- **Deux mécanismes pour la même redirection** : `/ateliers → /animations` passe
  par `next.config.ts`, `/concepts → /notions` par une page qui appelle
  `permanentRedirect`. La première est traitée avant tout rendu ; la seconde
  monte une route React pour ne rien afficher.
- **2,3 Mo de JavaScript** servis en chunks, dont un de 886 Ko. `decision-form.tsx`
  est le plus gros composant client du dépôt (2 554 lignes) et il est chargé par
  l'écran que tous les élèves ouvrent.

---

## Ordre suggéré

1. §2 — trancher le verrouillage pédagogique (réparer ou retirer). C'est le seul
   constat qui touche à ce que l'élève voit.
2. §3 — supprimer les 370 lignes mortes, avant qu'une correction se perde dedans.
3. §6 et §5 — limite de débit, puis le N+1 de la clôture.
4. §4 — le contraste, avec la garde qui va avec.
5. §7 — réparer le test de jouabilité, qui est aujourd'hui un filet troué.
6. §8 — au fil de l'eau.
