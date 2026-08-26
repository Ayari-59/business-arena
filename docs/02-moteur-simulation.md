# 02 — Architecture du moteur de simulation économique

Couvre le point 3 de la mission n°37 et les exigences §8 à §19 du cahier des charges.

Le moteur est un package TypeScript **pur, déterministe, configuré par le scénario,
indépendant de React, de Next et de la base de données**. Toutes les formules ci-dessous
font foi : toute valeur utilisée par le moteur provient du scénario ou de l'état, jamais
d'une constante cachée (§9 : « ne pas utiliser de valeurs arbitraires sans les documenter »).

---

## 1. Contrat du moteur

```ts
// src/engine/simulation/index.ts
export const ENGINE_VERSION = "0.1.0";

export function simulateRound(input: SimulationInput): SimulationOutput;

interface SimulationInput {
  scenario: ScenarioConfig;          // instantané figé à la création de la partie (ADR-10)
  roundIndex: number;                // 1..N
  companies: CompanyState[];         // état de TOUTES les entreprises de la partie
  decisions: Record<CompanyId, RoundDecisions>; // décisions validées (ou reconduites, ADR-04)
  activeEvents: EventInstance[];     // événements en cours (durée > 1 tour)
  rng: SeededRng;                    // PRNG seedé — SEULE source d'aléa (ADR-05)
}

interface SimulationOutput {
  companies: CompanyState[];         // nouvel état complet
  results: Record<CompanyId, RoundResult>;   // P&L, bilan, KPIs, détail des calculs
  market: MarketRoundResult;         // demande par segment, parts de marché, prix moyens
  events: EventInstance[];           // événements tirés ce tour + événements poursuivis
  trace: EngineTrace;                // journal de calcul (pédagogie + débogage)
}
```

Propriétés garanties (testées, doc 09) :

- **Pureté** : aucune E/S, aucune date système, aucun `Math.random`.
- **Déterminisme** : même input ⇒ même output (sérialisé), base du rejeu et de l'anti-triche.
- **Symétrie** : le moteur ne sait pas quelles entreprises sont humaines ou bots.
- **Traçabilité** : `EngineTrace` enregistre les grandeurs intermédiaires (demande avant/après
  chaque effet, coût unitaire décomposé…). C'est la matière première du débriefing pédagogique
  et des indices de niveau 1 (« examinez ce qui a évolué »). Jamais montrée brute au joueur.

## 2. Pipeline de résolution d'un tour

Ordre fixe, documenté, sans boucle de convergence (budget perf : O(C×S×P), < 1 s) :

```
 1. events/     tirage des nouveaux événements (PRNG) + application des modificateurs
                actifs sur une copie des paramètres du scénario (« paramètres effectifs »)
 2. hr/         effectifs disponibles, heures, productivité effective (grève, climat)
 3. production/ production réalisée = min(demande planifiée par le joueur, capacités)
 4. costs/      coûts de production du tour, coût unitaire (CUMP entrant)
 5. inventory/  stock disponible à la vente = stock initial + production
 6. market/     demande par segment → allocation concurrentielle → ventes contraintes
                par le stock (ruptures) → report/perte de demande
 7. inventory/  stock final, valorisation, coût de possession
 8. finance/    compte de résultat, plan de financement du tour, budget de trésorerie,
                bilan, FRNG/BFR/TN, ratios ; découvert automatique si trésorerie < 0
 9. investment/ mise en service des investissements arrivés à terme (capacité, qualité)
10. kpis/       calcul de tous les indicateurs (le déblocage à l'affichage est ailleurs)
```

Chaque étape est un module avec sa fonction pure et ses tests (`market/demand.ts` exporte
`computeSegmentDemand`, etc. — mêmes noms que doc 06).

---

## 3. Marché et demande (§9, §10, §11, §12)

### 3.1 Demande potentielle par segment

Pour chaque segment `s` et produit `p`, la demande potentielle **du marché** au tour `t` :

```
PotentialDemand(s, p, t) =
    BaseDemand(s, p)                        // taille du segment × fréquence d'achat (scénario)
  × (1 + growth(s))^(t-1)                   // croissance du segment
  × Seasonality(s, t)                       // coefficient saisonnier du scénario (Σ normalisée)
  × MacroEffect(t)                          // événements de marché (crise, mode, réglementation)
```

### 3.2 Attractivité d'une offre pour un segment

Chaque entreprise `c` propose (prix, marketing, qualité perçue). Son **score d'attraction** :

```
Attraction(c, s) =
    PriceEffect(c, s) × MarketingEffect(c, s) × QualityEffect(c, s) × LoyaltyEffect(c, s)
```

- **PriceEffect** — élasticité par segment (§11), autour d'un prix de référence du segment :
  `PriceEffect = (price / refPrice(s)) ^ elasticity(s)` avec `elasticity(s) < 0`
  (ex. segment « sensibles au prix » : −2,5 ; « premium » : −0,6). Borné par
  `[minEffect, maxEffect]` du scénario pour éviter les explosions numériques — bornes
  **documentées dans le scénario**, pas dans le code.
- **Prix psychologique (§12)** — deux mécanismes non linéaires, activables par segment :
  1. *Seuils de rupture* : liste de seuils (ex. 20 €, 25 €) avec pénalité multiplicative
     au franchissement (ex. ×0,92 au-dessus de 20 €) → 19,90 € ≠ 20,10 €.
  2. *Zone d'acceptabilité* : en dessous de `minAcceptablePrice(s)`, effet qualité-prix
     inversé (prix trop bas = méfiance) : l'attraction **baisse** quand le prix descend
     sous ce plancher. La demande n'est donc jamais purement linéaire au prix.
- **MarketingEffect** — rendements décroissants :
  `1 + mktSensitivity(s) × log(1 + mktSpend / mktScale(s))` ; un budget nul donne 1,
  le sur-investissement plafonne naturellement.
- **QualityEffect** — `(perceivedQuality(c) / refQuality) ^ qualitySensitivity(s)` ;
  la qualité perçue évolue avec inertie (voir §5.4).
- **LoyaltyEffect** — `1 + loyalty(s) × marketShare(c, s, t-1)` : la part de marché
  acquise sur le segment protège partiellement (fidélité paramétrée par segment).

### 3.3 Allocation concurrentielle (parts de marché)

Modèle de part d'attraction (logit simplifié, standard des business games) :

```
Share(c, s) = Attraction(c, s)^γ(s) / Σ_k Attraction(k, s)^γ(s)
Sales*(c, s, p) = PotentialDemand(s, p) × Share(c, s)
```

`γ(s) ≥ 1` règle l'intensité concurrentielle du segment (γ élevé = le meilleur rafle tout).
Un « concurrent extérieur » optionnel (attraction constante) représente le reste du marché
et empêche que la demande totale soit toujours servie par les joueurs.

### 3.4 Contrainte de stock et ruptures

```
Sales(c, s, p)  = min(Sales*(c, s, p), stock alloué)     // allocation au prorata des segments
LostSales(c, s) = Sales* − Sales
```

Une part `backlogRate(s)` des ventes perdues est reportée au tour suivant, le reste est
perdu et dégrade la fidélité (`LoyaltyEffect` du tour suivant). La rupture est un
**événement pédagogique de premier ordre** (capacité, prévision — doc 03).

### 3.5 Observabilité pédagogique de l'élasticité (§11)

La `trace` conserve, par segment : demande avant effet prix, après effet prix, après
marketing, etc. Le débriefing peut ainsi montrer « votre baisse de prix de 8 % a augmenté
vos ventes de 19 % sur le segment étudiant » sans jamais révéler le paramètre d'élasticité
lui-même — le joueur le **découvre** en expérimentant.

---

## 4. Production (§13)

La production réalisée n'est jamais la production demandée par décret (§13) :

```
MachineCapacity   = Σ unités de production actives × capacité unitaire × availability
                    (availability dégradée par maintenance insuffisante et pannes-événements)
LaborCapacity     = effectif productif × heures/tour × productivité effective
MaxOutsourcing    = plafond de sous-traitance du scénario (coût unitaire majoré, qualité ↘)
Production(c, p)  = min(plan du joueur, MachineCapacity, LaborCapacity, matières disponibles)
                    + sous-traitance décidée (≤ MaxOutsourcing)
UtilizationRate   = Production interne / MachineCapacity
```

- **Maintenance** : budget de maintenance < seuil recommandé ⇒ `availability` décroît de
  tour en tour et la probabilité de l'événement « panne » augmente (couplage documenté).
- **Qualité produite** : fonction du budget qualité, du taux d'utilisation (surchauffe
  > 95 % ⇒ défauts), et de la part sous-traitée. Alimente la qualité perçue avec inertie :
  `perceivedQuality(t) = λ × perceivedQuality(t-1) + (1-λ) × producedQuality(t)`.
- **Approvisionnements** : les matières commandées au tour `t` sont disponibles selon le
  délai fournisseur du scénario ; le paiement suit le délai de règlement fournisseur
  (→ BFR, §6).

### 4.1 Ressources humaines (niveaux Arbitrage+)

Décisions `hr` (si `scenario.hr` est défini) : embauches, licenciements, budget de
formation, indice de salaire. Règles :

- **effet à t+1** pour les mouvements d'effectif (le recrutement prend du temps),
  **coûts à t** (recrutement, indemnités) — l'asymétrie est la leçon ;
- seul l'**écart** de masse salariale est facturé : les salaires de
  `includedHeadcount` employés à l'indice 1 sont déjà dans `fixedCostsPerRound`
  (réduire l'effectif ou l'indice économise des charges de structure) ;
- **morale** : la productivité du tour est multipliée par 1 + sens × (indice − 1),
  bornée — sous-payer bride la capacité main-d'œuvre dès ce tour ;
- **attrition** : sous le seuil (`attritionThreshold`), une démission par tour,
  jamais en dessous d'un salarié ;
- **formation** : productivité(t+1) += sens × ln(1 + budget/échelle), plafonnée.

Les bots n'utilisent jamais la RH et une entreprise qui n'y touche pas est
rigoureusement neutre (testé) : calibration et snapshot doré inchangés. Sur NOVA,
l'atelier machine (7 000 u/trimestre) reste le goulot à effectif complet — la RH
compense les départs, ouvre le dégraissage risqué, et prépare l'investissement
capacitaire. Périodicité : salaires et échelle de formation ×k ; coûts d'embauche
et de licenciement ponctuels, non redimensionnés.

### 4.2 Coûts de la qualité et de la non-qualité (activables à la création)

Si `scenario.qualityCosts` est défini (paramètre « taux de rebuts » du panneau
économique) :

- **prévention** : le budget qualité existant — plus il est haut, plus la qualité
  produite monte, moins les défaillances coûtent ;
- **défaillances internes** : rebuts = production × taux(2 − qualité produite),
  borné. Produits et payés (matières, MOD) mais invendables : seul le net entre en
  stock, la perte est ajoutée au coût des ventes ;
- **défaillances externes** : retours clients = ventes × sens × max(0, 1 − qualité
  perçue), remboursés au prix de vente, unités détruites.

Le bilan reste équilibré (achats + variables décaissés = coût des ventes + Δ stock,
rebuts compris). La leçon : le bon niveau de qualité est un calcul COQ/CNQ, pas une
vertu.

## 5. Coûts (§14)

Typologie native du moteur — chaque ligne de coût du scénario est étiquetée :

| Axe | Valeurs | Usage pédagogique |
|---|---|---|
| Comportement | `fixed` / `variable` (inducteur : unité produite, unité vendue, € de CA) | seuil de rentabilité, CVP |
| Traçabilité | `direct(product)` / `indirect` | coûts complets vs partiels |
| Horizon | `capacity` (paliers : une ligne de production ajoutée = +X de fixes) / `operating` | coûts de structure, décisions LT |
| Financier | intérêts, agios de découvert | effet de levier, risque financier |

Calculs exposés par `costs/` :

```
UnitVariableCost(p)      = Σ coûts variables directs / unité (matières, MOD, énergie, sous-traitance)
ContributionMargin(p)    = Price − UnitVariableCost           // marge sur coût variable unitaire
FixedCosts               = Σ fixes opérationnels + fixes de capacité + amortissements
FullUnitCost(p)          = (variables + quote-part des fixes imputés) / unités   // coût complet
RelevantCost(décision)   = coûts/recettes différentiels d'une option (commande exceptionnelle…)
BreakEvenUnits           = FixedCosts / ContributionMargin(unitaire)
BreakEvenRevenue         = FixedCosts / tauxMCV
SafetyMargin             = CA − BreakEvenRevenue ; SafetyIndex = SafetyMargin / CA
DeadPoint                = date du tour où le CA cumulé atteint le seuil (point mort)
```

Les stocks sont valorisés au **CUMP** (coût unitaire moyen pondéré), documenté et testé.

---

## 6. Finance : le pilier FRNG / BFR / Trésorerie (§16, §17)

`finance/` produit à chaque tour des **états financiers complets et cohérents**
(le bilan équilibre au centime — invariant testé) :

### 6.1 Compte de résultat du tour
CA, production stockée, coûts variables, coûts fixes, EBE, dotations aux amortissements,
résultat d'exploitation, charges financières (emprunts + agios de découvert), impôt
(taux du scénario), **résultat net**.

### 6.2 Bilan et équilibre fonctionnel

```
FRNG = Ressources stables (capitaux propres + dettes financières LT)
     − Emplois stables (immobilisations nettes)
BFR  = Stocks + Créances clients − Dettes fournisseurs (+ dettes fiscales et sociales)
TN   = FRNG − BFR      // invariant : TN = disponibilités − concours bancaires courants
```

- **Créances clients** = CA × délai clients / durée du tour (délais paramétrés par segment :
  les professionnels paient à 60 j, les particuliers comptant).
- **Dettes fournisseurs** = achats × délai fournisseurs / durée du tour.
- Le scénario peut proposer des **décisions sur les délais** (escompte pour paiement
  comptant, négociation fournisseur) → leviers de BFR observables.

### 6.3 Trésorerie et financement

Budget de trésorerie du tour : encaissements (ventes du tour et créances antérieures,
emprunts, apports) − décaissements (achats, salaires, fixes, investissements, échéances,
impôt). Si la trésorerie devient négative : **découvert automatique** au taux du scénario
(agios au tour suivant). Le découvert est **plafonné** (`finance.overdraftLimit`) et le
joueur dispose d'**outils de mobilisation du poste clients** (`scenario.treasury`,
décisions `treasury.discount` / `treasury.factoring`) pour l'éviter :

1. **Escompte** — avance sur créances, plafonnée à `discountMaxShare` du poste clients
   TTC du tour ; agios = montant × `discountAnnualRate` × jours du tour / 360, en
   charges financières. Le moins cher.
2. **Affacturage** — cession de créances sans plafond, commission `factoringFeeRate`
   sur le montant cédé. Plus cher, immédiat.
3. **Affacturage forcé** — si malgré tout le solde passe sous −plafond, la banque cède
   d'office les créances restantes au taux punitif `forcedFactoringFeeRate`, juste ce
   qu'il faut pour revenir dans les clous (calcul en deux passes, déterministe : la
   commission étant déductible, la seconde passe ne peut que remonter le solde). Le
   brut encaissé passe par les lignes `escompte_creances` / `affacturage` /
   `affacturage_force` du tableau de flux ; tous les coûts de mobilisation vont en
   charges financières.

S'il ne reste **plus de créances à céder** et que le solde reste sous −plafond ⇒
**crise de trésorerie caractérisée** (`treasury.crisis`), signalée en rouge dans
l'arène. C'est ainsi que le jeu crée naturellement la situation « rentable mais en
difficulté de trésorerie » (§16) : la croissance gonfle le BFR plus vite que le FRNG —
et la leçon « si vous ne gérez pas votre trésorerie, quelqu'un la gérera pour vous ».

**TVA** (`finance.vatRate`, 0 ou absente = désactivée — activable à la création de
partie) : le compte de résultat reste **HT** (la TVA n'est jamais un produit ni une
charge) ; créances clients et dettes fournisseurs deviennent **TTC**, et la TVA nette du
tour (collectée sur le CA − déductible sur les achats de matières, simplification
assumée) est portée au passif en **« TVA à décaisser »**, payée le tour suivant — une
dette d'exploitation qui entre dans le BFR (un crédit de TVA, en négatif, l'augmente).
La leçon : la TVA ne change pas le résultat mais transite par la trésorerie. Invariants
testés : compte de résultat identique avec/sans TVA, bilan équilibré au centime,
TN = FRNG − BFR conservé.

### 6.4 Ratios et rentabilités (§17)

```
Profitabilité            = Résultat net / CA
Rentabilité économique   = Résultat d'exploitation net d'IS / (capitaux propres + dettes financières)
Rentabilité financière   = Résultat net / Capitaux propres
Effet de levier          = Rf − Re, expliqué par (Re − i) × D/CP dans la trace
Rotation des actifs      = CA / Actif ; Endettement = D / CP ; Autonomie = CP / total bilan
Liquidité générale       = Actif circulant / Passif circulant
```

### 6.5 Investissement et financement (§18)

**Implémenté** : la décision `investment.machineCapacityUnits` achète de la capacité
machine au prix du scénario (`investment.costPerCapacityUnit`) — décaissement et
immobilisation immédiats, **mise en service au tour suivant**, amortissement linéaire
sur `depreciationRounds` dès la mise en service (suivi par entreprise :
`extraDepreciationPerRound`). Plafond d'achat par tour. Périodicité : une même
machine physique vaut le même prix — coût par unité de capacité en 1/k, durée en
tours en 1/k, plafond en k. Financement : `finance.newLoan` (emprunt),
`finance.capitalIncrease` (apport en capitaux propres, sans intérêts) — actions
ponctuelles jamais reconduites, comme l'investissement.

**Plafond d'augmentation de capital** (`finance.maxCapitalIncreaseTotal`) : les
associés suivent jusqu'à une enveloppe TOTALE sur la partie (stock en €, inchangée par
la périodicité, suivie par `CompanyState.capitalRaised`) — sans plafond, l'apport
illimité fausserait le jeu de trésorerie. Un apport au-delà est écrêté (résultat
`capital = { requested, applied, remainingAfter }`, affiché en jeu) ; absent = illimité
(comportement historique). NOVA : 100 000 €.

**Échéanciers d'emprunt obligatoires** (`finance.loanDurationRounds`) : rembourser un
emprunt n'est **pas une décision, c'est une contrainte**. Chaque emprunt vivant est
porté dans `CompanyState.loans` (`{ remaining, perRound }`, amortissement constant) ;
l'échéance en capital du tour est **prélevée automatiquement**, que la caisse soit
pleine ou vide — les intérêts courent sur le capital restant dû. Un nouvel emprunt
s'étale sur la durée contractuelle, première échéance au tour suivant. La décision
`finance.loanRepayment` devient un **remboursement anticipé**, facultatif, en plus de
l'échéance. Périodicité : la durée en tours est divisée par k, l'échéance par tour
multipliée par k (le capital restant dû est un stock, inchangé). Sans
`loanDurationRounds` au scénario, comportement historique : remboursement libre.
Résultat du tour : `debt = { mandatoryRepayment, earlyRepayment, newLoan, outstanding,
nextMandatory }`, affiché dans l'arène et annoncé au joueur avant décision (bandeau
« l'échéance tombe »).

### 6.5bis Cadre initial (§18)

Projets d'investissement définis par le scénario : coût initial, échéancier, valeur
résiduelle, effets (capacité, qualité, coûts). `investment/` fournit les fonctions
d'évaluation **mises à disposition du joueur comme outils** (doc 03) et utilisées par
les tests : `npv(flows, rate)`, `irr(flows)`, `paybackPeriod(flows)`. Le financement choisi
(autofinancement / emprunt / crédit-bail) impacte FRNG, charges financières et levier.

---

## 7. Moteur d'événements (§19)

Un événement est une **donnée**, pas du code :

```ts
interface EventDefinition {
  code: string;                    // "raw_material_spike"
  trigger: { minRound?: number; conditions?: ConditionExpr[]; probability: number };
  scope: "market" | "company";     // frappe tout le marché ou une entreprise tirée
  duration: number;                // en tours
  modifiers: Modifier[];           // { target: "market.rawMaterialPrice", op: "mul", value: 1.25 }
  announcement: { textKey: string; leadTime: 0 | 1 };  // annoncé ou surprise
  difficulty: number;              // niveau minimal d'apparition
  linkedConcepts: string[];        // concepts pédagogiques mobilisés
}
```

- `ConditionExpr` : petit langage de conditions sur l'état (`company.utilization > 0.95`,
  `market.round >= 3`) évalué par le moteur — permet « la panne frappe les usines
  sur-utilisées », « la grève suit deux tours de productivité forcée ».
- Le tirage utilise le PRNG de la partie (déterminisme, ADR-05). Les scénarios peuvent aussi
  **scripter** des événements certains à un tour donné (probability = 1, round fixé) — c'est
  le mécanisme des situations pédagogiques de NOVA (doc 07).
- Les `modifiers` s'appliquent sur les **paramètres effectifs** du tour (copie), jamais sur
  le scénario d'origine.

Catalogue MVP (seed) : hausse matières premières, baisse de prix d'un concurrent (bot),
panne machine, grève, perte d'un client grand compte, nouveau concurrent entrant, hausse
des taux, changement réglementaire (norme qualité), opportunité d'export, campagne
marketing virale.

### 7.1 Cartes événements (habillage de classe)

Les **cartes** (`src/config/events/cards.ts`) sont l'habillage théâtral des événements —
le moteur ne les connaît pas. Deux decks :

- **Cartes marché** (`scope: "market"`) : toute la classe. L'enseignant peut en tirer
  jusqu'à 2 par tour (mode apprentissage uniquement).
- **Cartes équipe** (`scope: "team"`) : une seule entreprise ciblée. Une carte par équipe
  et par tour ; l'injection se fait avec `scope: "company"` + `companyId` de l'équipe,
  les autres équipes ne subissent (et ne voient) pas l'effet. Les événements
  correspondants du scénario ont `probability: 0` : jamais tirés par le PRNG, donc
  la calibration et le mode compétition ne sont pas affectés. Cibles limitées à
  `material_cost` / `availability` / `interest_rate` (la demande est un modificateur
  de marché, non déclinable par entreprise).

Plafond global : 4 cartes en jeu par tour. Un **deck physique imprimable**
(`/teacher/cards/print`, A4, dos + face à plier) permet le tirage réel en classe ;
l'enseignant saisit ensuite la carte tirée dans le deck numérique pour qu'elle
s'applique à la clôture du tour. En mode compétition, seul le tirage seedé fait foi.

### 7.2 Commandes fermes et assurance catastrophe

Deux mécaniques s'appuient sur le moteur d'événements :

**Commandes exceptionnelles entre chaque tour** (`scenario.orderOffers`) : distinctes
des commandes fermes d'événement, elles sont proposées À CHAQUE TOUR par rotation
déterministe dans un pool (aucun aléa consommé — tirages seedés inchangés ; la même
offre pour toutes les équipes, comparabilité de classe). Deux archétypes alternent :
l'**export à forte marge payé à long délai** (le CA part en créances au délai de
l'offre : le BFR gonfle du CA moins le stock cédé) et le **comptant à marge mince**
(cash immédiat, rentabilité maigre). Décision `decisions.acceptOrder` (ponctuelle,
jamais reconduite), livraison sur le stock restant après le marché et les commandes
fermes, sans sous-traitance ni effet sur la part de marché. Le délai de règlement
entre dans le calcul en euros de la part du CA à crédit (`creditRevenue`). Résultat :
`result.orderOffer = { accepted, delivered, revenue, onCredit, … }`. Volumes en flux
(× k) ; prix et délais inchangés par la périodicité. L'arbitrage rentabilité /
trésorerie est ainsi posé à chaque tour — c'est le but.


- **Commande ferme** (cible `order`, additive, en unités) : l'entreprise visée vend
  d'office N unités **en plus** de ses ventes de marché, réglées **comptant**, dans la
  limite du stock restant après les ventes de marché. La commande s'ajoute au CA sans
  gonfler la part de marché (calculée sur le marché adressable seul). Sans stock, rien
  n'est livré : l'opportunité ne se saisit qu'avec de l'anticipation. Les valeurs
  `order` sont des flux : `applyPeriodicity` les redimensionne (× k).

- **Assurance catastrophe** (`scenario.insurance`, optionnelle) : une décision par tour
  (`decisions.insurance`). L'assuré paie une **prime** (charge de structure : EBITDA,
  trésorerie et seuil de rentabilité l'absorbent) et les événements couverts
  (`coveredEventCodes`) sont **exclus de ses modificateurs effectifs** — le sinistre
  frappe les autres, pas lui. Limite assumée : la demande étant un paramètre de marché
  calculé une fois pour tous, un événement de demande n'est pas couvrable (validé par
  le schéma). Les bots ne s'assurent jamais (calibration inchangée). La prime est un
  flux : × k par périodicité. Résultat : `result.insurance = { premium,
  neutralizedEvents }` et `result.extraOrders = { requested, delivered }` tracent
  l'un et l'autre pour le débriefing.

**Commandes à prix imposé et sous-traitance** : une commande peut porter un prix
unitaire imposé (cible `order_price`) et un droit à sous-traiter (`order_subcontract`,
unités) si le scénario définit `subcontracting.unitCost`. Le stock sert d'abord, la
sous-traitance comble (achetée finie, décaissée et comptée au coût des ventes) — la
marge d'une commande sous-traitée se CALCULE : c'est l'arbitrage make or buy, et la
carte XXL (2 500 u à 61 €, sous-traitance à 52 €) le rend physique. Deux cartes :
`tight_order` (tient dans la capacité, 55 €/u imposés — coûts pertinents) et
`xxl_order` (dépasse la capacité — sous-traiter ou avoir investi).

Sur NOVA : `natural_disaster` (marché, disponibilité ×0,72 et matières ×1,12, couvert),
`cold_wave` (couvert), `export_market` (demande ×1,15 sur 2 tours), `big_order`
(commande ferme de 600 unités/trimestre, carte équipe) ; prime 2 500 €/trimestre.
Tous à `probability: 0` sauf `cold_wave` (déjà existant) — et **appondus en fin de
liste** : le PRNG consomme un tirage par événement, insérer au milieu décalerait les
tirages seedés existants.

---

## 7.3 Études achetables : l'information a un prix (§8bis)

Le joueur peut acheter des rapports pour décider avec des **données riches et
variées** (`scenario.studies`, décisions `decisions.studies.{market,price,finance,project}`,
actions ponctuelles jamais reconduites). Côté moteur, chaque étude cochée est une
**charge de structure** du tour (résultat, seuil de rentabilité et trésorerie la
portent : décider sans données coûte souvent plus cher, mais l'information n'est pas
gratuite) — résultat `result.studies = { purchased, cost }` ; coûts en flux (× k).
Les RAPPORTS sont construits côté services à la lecture (`getGameView.studyReports`),
depuis les résultats persistés du dernier tour résolu :

- **Étude de marché** : demande totale par segment, votre part / vendues / manquées,
  et pour chaque concurrent : prix moyen constaté (≈ CA / volumes), part de marché,
  CA, résultat net.
- **Analyse de prix** : élasticité estimée par segment, prix de référence, plancher
  de crédibilité, seuils psychologiques — les paramètres se découvrent en jouant, ou
  s'achètent.
- **Étude financière** : ratios complets (profitabilité, rentabilités, endettement,
  rotation), structure des coûts (CVU, marge unitaire, seuil, marge de sécurité) et
  comparaison sectorielle (moyennes des concurrents). Le bilan et le compte de
  résultat propres restent gratuits : ce sont VOS comptes.
- **Analyse de projet** : VAN, TRI et délai de récupération de l'investissement
  capacitaire (flux = ventes manquées × marge unitaire), et l'arbitrage chiffré de la
  commande exceptionnelle du tour courant (marge totale vs coût de portage du BFR au
  taux du découvert).

## 8. Ce que le moteur ne fait pas

- Il ne connaît ni les indices, ni les scores, ni les niveaux de déblocage d'information :
  il calcule **tout**, la pédagogie filtre (ADR-15).
- Il ne lit ni n'écrit en base : la couche services l'alimente et persiste ses sorties.
- Il n'appelle jamais d'IA. L'IA commente ses sorties, jamais l'inverse (§29).
