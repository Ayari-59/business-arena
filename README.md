# BUSINESS ARENA — Dossier d'architecture (Mission n°37)

> **Simulation + Apprentissage + Aide à la décision + Compétition.**
> Plateforme SaaS de simulation d'entreprise dans laquelle un joueur ou une équipe dirige une
> entreprise virtuelle, apprend à choisir le bon modèle de gestion, et progresse du niveau
> DÉCOUVERTE au niveau EXECUTIVE.

Ce dossier est le **livrable de la mission n°37** : l'architecture complète du produit,
produite **avant toute ligne de code applicatif**, conformément à la méthode imposée
(§35 étape 1 : analyser, identifier les ambiguïtés, proposer l'architecture, ne pas coder).

## Statut du dépôt

`Ayari-59/business-arena` est le **dépôt dédié** du produit, comme l'exige le cahier des
charges. Il contient pour l'instant uniquement ce dossier d'architecture (livrable de
l'étape 1) ; le code applicatif arrivera par étapes (§35), chaque étape devant rester
conforme aux documents ci-dessous ou les amender explicitement.

## Sommaire du dossier

| Fichier | Contenu (points du cahier des charges §37) |
|---|---|
| [`docs/00-decisions-et-ambiguites.md`](docs/00-decisions-et-ambiguites.md) | Analyse du cahier des charges, ambiguïtés identifiées, décisions d'architecture (ADR) |
| [`docs/01-architecture-globale.md`](docs/01-architecture-globale.md) | 1. Architecture globale · 2. Architecture des dossiers · 16. Stratégie de déploiement Vercel |
| [`docs/02-moteur-simulation.md`](docs/02-moteur-simulation.md) | 3. Architecture du moteur de simulation (demande, élasticité, prix psychologique, production, coûts, finance FRNG/BFR, événements) |
| [`docs/03-moteur-pedagogique.md`](docs/03-moteur-pedagogique.md) | 4. Moteur pédagogique · 10. Les 20 concepts du MVP · 11. Modèles de décision · 12. Règles du système d'indices |
| [`docs/04-moteur-competition.md`](docs/04-moteur-competition.md) | 5. Architecture du moteur de compétition (modes apprentissage / compétition / concours) |
| [`docs/05-schema-base-de-donnees.md`](docs/05-schema-base-de-donnees.md) | 6. Schéma complet Neon PostgreSQL · 7. Relations entre tables |
| [`docs/06-types-typescript.md`](docs/06-types-typescript.md) | 8. Types TypeScript principaux |
| [`docs/07-scenario-nova.md`](docs/07-scenario-nova.md) | 9. Architecture du premier scénario NOVA (6 tours) |
| [`docs/08-scoring-et-difficulte.md`](docs/08-scoring-et-difficulte.md) | 13. Règles de scoring (Business Performance Index) · 14. Architecture des niveaux de difficulté |
| [`docs/09-strategie-tests.md`](docs/09-strategie-tests.md) | 15. Stratégie de tests |
| [`docs/10-strategie-evolution.md`](docs/10-strategie-evolution.md) | 17. Stratégie d'évolution future (championnat, IA, internationalisation…) |

## Stack (imposée, confirmée)

Next.js (App Router) · React · TypeScript strict · Vercel · Neon PostgreSQL · **Drizzle ORM** ·
Tailwind CSS · shadcn/ui · Git/GitHub · architecture compatible API LLM.

> Note : le dépôt frère `axio` utilise Prisma ; BUSINESS ARENA étant un produit indépendant,
> il applique la stack imposée par son propre cahier des charges, donc **Drizzle**.

## La boucle produit

```
SITUATION → PROBLÈME → DIAGNOSTIC → MODÈLE D'ANALYSE → DÉCISION
    ↑                                                      ↓
APPRENTISSAGE ← ANALYSE ← RÉSULTAT ← SIMULATION ←──────────┘
```

Chaque brique de l'architecture sert un maillon de cette boucle :

- **SITUATION / PROBLÈME** → moteur de scénarios + moteur d'événements (`docs/02`, `docs/07`)
- **DIAGNOSTIC / MODÈLE** → moteur pédagogique, référentiels de concepts et de modèles (`docs/03`)
- **DÉCISION / SIMULATION / RÉSULTAT** → moteur économique déterministe (`docs/02`)
- **ANALYSE / APPRENTISSAGE** → débriefing, indices, profil de compétences, scoring (`docs/03`, `docs/08`)
- **COMPÉTITION** → moteur de compétition (`docs/04`)

## Démarrage

```bash
npm install
cp .env.example .env    # renseigner DATABASE_URL (pooler) et DIRECT_URL (direct) Neon
npm run db:migrate      # applique les migrations drizzle/ sur la base
npm run dev             # http://localhost:3030
```

Vérifications : `npm run typecheck` · `npm test` · `npm run build`.

**Déploiement Vercel** : preset **Next.js**, racine du dépôt. Le script `vercel-build`
(`drizzle-kit migrate && next build`) applique automatiquement les migrations au build —
définir dans le projet Vercel les variables `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
`CRON_SECRET`. (Cible long terme : migrations en CI, doc 01 §5.)

## Prochaines étapes (méthode §35)

1. ✅ **Étape 1 — ce dossier** : architecture validée avant développement.
2. ✅ Étape 2 — modèle de données : schéma Drizzle (43 tables, `src/db/schema/`) +
   migration initiale (`drizzle/`), conformes à `docs/05`.
3. ✅ Étape 3 — moteur économique déterministe + tests (`docs/02`, `docs/09`).
4. ✅ Étape 4 — scénario NOVA calibré, invariants automatisés (`docs/07`).
5. ✅ Étape 5 — simulation de 6 tours (périodicité mois/trimestre/année au choix).
6. ✅ Étape 6 — interface joueur (arène, KPI, graphiques, décisions).
7. ✅ Étape 7 — interface enseignant (parties de classe 1-8 équipes + bots,
   codes d'invitation, clôture des tours, vue pédagogique).
8. ✅ Étape 8 — moteur pédagogique (situations scriptées et détectées,
   diagnostic, choix du modèle d'analyse, débriefing, progression).
9. ✅ Étape 9 — système d'indices à 5 niveaux (séquentiels, coûtés, tracés).
10. Étapes 10→13 — scoring BPI complet, profil joueur affiché, IA coach,
    moteur de compétition.

**Aucune modification du moteur économique ne sera acceptée sans tests** (§32).
