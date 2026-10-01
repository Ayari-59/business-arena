# Correspondance geste ↔ référentiel — déduite, à élaguer

Engendré par `npx tsx scripts/correspondance-referentiels.ts --ecrire`.
Ne pas le corriger à la main : il se réécrit depuis `src/config/correspondance.ts`.

Aucune ligne n'a été écrite. Une séance nomme déjà les blocs du référentiel qu'elle
mobilise et, depuis le socle, les gestes qu'elle fait travailler : leur coexistence
dans une même séance est le lien. Rien n'est branché, ni les ateliers ni la page des
parcours.

| | |
| --- | --- |
| diplômes | 9 |
| liens déduits | 337 |
| liens écartés à la main | 0 |

## Par où élaguer

Un lien est un CANDIDAT : deux choses présentes dans la même séance ne se servent pas
forcément l'une l'autre. Compter les séances témoins ne trie rien, car chaque séance
est une combinaison unique et la plupart des liens n'en ont qu'une. Ce qui trie, c'est
le nombre de blocs que nommait cette séance : si elle n'en nommait qu'un, tout ce
qu'elle fait travailler sert ce bloc sans discussion ; si elle en nommait quatre, le
geste en sert un ou deux et la coexistence ne dit pas lesquels.

Le tri reste modeste, et il faut le savoir avant de s'y fier : la grande masse vient de
séances à deux blocs, donc à une chance sur deux.

| blocs nommés par la meilleure séance témoin | liens | ce que ça vaut |
| --- | --- | --- |
| 1 | 13 | certain : la séance ne nommait que ce bloc |
| 2 | 279 | une chance sur deux |
| 3 | 25 | une chance sur trois |
| 4 | 20 | une chance sur quatre, à relire en premier |

### Les 45 liens les plus douteux

- **STMG** · `annoncer-l-effet-attendu` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `annoncer-l-effet-attendu` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `annoncer-l-effet-attendu` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `la-capacite-qui-bloque` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `la-capacite-qui-bloque` → Le management stratégique, du diagnostic à la fixation des objectifs · Première, management *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `la-capacite-qui-bloque` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `rupture-ou-surstock` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `rupture-ou-surstock` → Le management stratégique, du diagnostic à la fixation des objectifs · Première, management *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `rupture-ou-surstock` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `seuil-de-rentabilite` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `seuil-de-rentabilite` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `seuil-de-rentabilite` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `un-marche-qui-change` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `un-marche-qui-change` → Le management stratégique, du diagnostic à la fixation des objectifs · Première, management *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `un-marche-qui-change` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:3, qui nommait 3 blocs)*
- **STMG** · `variable-ou-fixe` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `variable-ou-fixe` → Temps et risque · Première, sciences de gestion et numérique *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `variable-ou-fixe` → Les organisations et les acteurs · Terminale, tronc commun *(séance stmg:2, qui nommait 3 blocs)*
- **STMG** · `assumer-une-erreur` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `assumer-une-erreur` → Numérique et intelligence collective · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `assumer-une-erreur` → Les choix stratégiques des organisations · Première, management *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `assumer-une-erreur` → Les organisations et la société · Terminale, tronc commun *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `choisir-ses-indicateurs` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `choisir-ses-indicateurs` → Numérique et intelligence collective · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `choisir-ses-indicateurs` → Les choix stratégiques des organisations · Première, management *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `choisir-ses-indicateurs` → Les organisations et la société · Terminale, tronc commun *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `fixer-un-prix` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `fixer-un-prix` → De l'individu à l'acteur · Première, sciences de gestion et numérique *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `fixer-un-prix` → À la rencontre du management des organisations · Première, management *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `fixer-un-prix` → Les organisations et l'activité de production de biens et de services · Terminale, tronc commun *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `lire-les-comptes` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `lire-les-comptes` → De l'individu à l'acteur · Première, sciences de gestion et numérique *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `lire-les-comptes` → À la rencontre du management des organisations · Première, management *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `lire-les-comptes` → Les organisations et l'activité de production de biens et de services · Terminale, tronc commun *(séance stmg:1, qui nommait 4 blocs)*
- **STMG** · `presenter-a-l-oral` → Création de valeur et performance · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `presenter-a-l-oral` → Numérique et intelligence collective · Première, sciences de gestion et numérique *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `presenter-a-l-oral` → Les choix stratégiques des organisations · Première, management *(séance stmg:4, qui nommait 4 blocs)*
- **STMG** · `presenter-a-l-oral` → Les organisations et la société · Terminale, tronc commun *(séance stmg:4, qui nommait 4 blocs)*
- **DCG** · `assumer-une-erreur` → UE6 · Finance d'entreprise *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `assumer-une-erreur` → UE11 · Contrôle de gestion *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `assumer-une-erreur` → UE13 · Communication professionnelle *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `ecrire-une-note` → UE6 · Finance d'entreprise *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `ecrire-une-note` → UE11 · Contrôle de gestion *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `ecrire-une-note` → UE13 · Communication professionnelle *(séance dcg:5, qui nommait 3 blocs)*
- **DCG** · `repondre-aux-objections` → UE6 · Finance d'entreprise *(séance dcg:5, qui nommait 3 blocs)*

## Ce que la table ouvrirait

Aujourd'hui un atelier sert un diplôme et un seul, parce que ses séances nomment les
blocs dans le vocabulaire de ce diplôme. Avec la table, un atelier atteint tout
diplôme dont les blocs sont liés aux gestes qu'il travaille. ATTEINDRE N'EST PAS
COUVRIR : un bloc est atteint dès qu'un seul geste le touche, c'est un plancher.

| atelier | son diplôme | ce qu'il atteindrait ailleurs |
| --- | --- | --- |
| Découvrir la gestion en tenant une boutique | aucun | BTS NDRC 3/3 · BTS MCO 3/4 · BTS GPME 3/4 · BTS MHR 3/4 · DCG 3/4 · STMG 7/10 · BTS CG 4/6 · BTS MHR · B et C 2/4 · BUT GEA 2/4 |
| Découvrir la gestion d'une entreprise en quatre séances | STMG | BTS NDRC 3/3 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BTS MCO 3/4 · BUT GEA 3/4 · DCG 3/4 · BTS CG 3/6 · BTS GPME 2/4 |
| Piloter une entreprise pendant six trimestres | BTS CG | BTS MCO 4/4 · BTS NDRC 3/3 · BTS MHR 4/4 · BUT GEA 4/4 · STMG 9/10 · BTS GPME 3/4 · BTS MHR · B et C 3/4 · DCG 3/4 |
| Tenir un point de vente pendant quatre trimestres | BTS MCO | BTS NDRC 3/3 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BUT GEA 4/4 · BTS GPME 3/4 · DCG 3/4 · STMG 7/10 · BTS CG 2/6 |
| Piloter une unité de restauration au mois | BTS MCO | BTS CG 6/6 · BTS NDRC 3/3 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BTS GPME 3/4 · BUT GEA 3/4 · DCG 3/4 · STMG 6/10 |
| Rentabiliser une clientèle sur cinq trimestres | BTS NDRC | BTS MCO 4/4 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BUT GEA 4/4 · BTS GPME 3/4 · STMG 7/10 · BTS CG 3/6 · DCG 2/4 |
| Garder ses adhérents plutôt que les remplacer | BTS NDRC | BTS MCO 4/4 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BUT GEA 4/4 · BTS GPME 3/4 · DCG 3/4 · STMG 7/10 · BTS CG 4/6 |
| Assister le dirigeant d'une PME pendant cinq trimestres | BTS GPME | BTS CG 6/6 · BTS MCO 4/4 · BTS NDRC 3/3 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · DCG 3/4 · STMG 4/10 |
| Piloter un hôtel sur une année de saisons | BTS MHR | BTS CG 6/6 · BTS MCO 4/4 · BTS NDRC 3/3 · BTS MHR · B et C 4/4 · BUT GEA 4/4 · STMG 9/10 · BTS GPME 3/4 · DCG 2/4 |
| Composer la carte et tenir le service | BTS MHR · B et C | BTS MCO 4/4 · BTS NDRC 3/3 · BTS GPME 4/4 · BTS MHR 4/4 · BUT GEA 3/4 · DCG 3/4 · STMG 7/10 · BTS CG 2/6 |
| Analyser et piloter une entreprise industrielle | BUT GEA | BTS NDRC 3/3 · BTS MHR 4/4 · BTS MHR · B et C 4/4 · BTS MCO 3/4 · DCG 3/4 · BTS CG 4/6 · STMG 6/10 |
| Piloter et rendre compte sur quatre exercices | DCG | BUT GEA 4/4 · BTS GPME 3/4 · BTS NDRC 2/3 · STMG 6/10 · BTS CG 3/6 · BTS MCO 2/4 · BTS MHR 2/4 · BTS MHR · B et C 2/4 |
| RSE et performance : un engagement qui se pilote | DCG | BTS MCO 3/4 · BTS NDRC 2/3 · BTS GPME 2/4 · BTS MHR · B et C 2/4 · BUT GEA 2/4 · BTS CG 2/6 |
| Piloter sous incertitude une entreprise de transport | aucun | BTS MCO 4/4 · BTS NDRC 3/3 · BTS GPME 4/4 · BTS MHR 4/4 · BUT GEA 4/4 · DCG 4/4 · BTS CG 5/6 · BTS MHR · B et C 3/4 · STMG 4/10 |
| Diriger une entreprise en équipe inter-filières | aucun | BTS NDRC 3/3 · BUT GEA 4/4 · DCG 4/4 · BTS CG 5/6 · BTS MCO 3/4 · BTS MHR 3/4 · BTS MHR · B et C 3/4 · STMG 7/10 · BTS GPME 2/4 |

## La table, diplôme par diplôme

### Baccalauréat STMG

#### Création de valeur et performance · Première, sciences de gestion et numérique

8 gestes liés.

- `annoncer-l-effet-attendu` *(stmg:2 ; 3 blocs nommés)*
- `seuil-de-rentabilite` *(stmg:2 ; 3 blocs nommés)*
- `variable-ou-fixe` *(stmg:2 ; 3 blocs nommés)*
- `assumer-une-erreur` *(stmg:4 ; 4 blocs nommés)*
- `choisir-ses-indicateurs` *(stmg:4 ; 4 blocs nommés)*
- `fixer-un-prix` *(stmg:1 ; 4 blocs nommés)*
- `lire-les-comptes` *(stmg:1 ; 4 blocs nommés)*
- `presenter-a-l-oral` *(stmg:4 ; 4 blocs nommés)*

#### De l'individu à l'acteur · Première, sciences de gestion et numérique

2 gestes liés.

- `fixer-un-prix` *(stmg:1 ; 4 blocs nommés)*
- `lire-les-comptes` *(stmg:1 ; 4 blocs nommés)*

#### À la rencontre du management des organisations · Première, management

2 gestes liés.

- `fixer-un-prix` *(stmg:1 ; 4 blocs nommés)*
- `lire-les-comptes` *(stmg:1 ; 4 blocs nommés)*

#### Les organisations et l'activité de production de biens et de services · Terminale, tronc commun

2 gestes liés.

- `fixer-un-prix` *(stmg:1 ; 4 blocs nommés)*
- `lire-les-comptes` *(stmg:1 ; 4 blocs nommés)*

#### Temps et risque · Première, sciences de gestion et numérique

6 gestes liés.

- `annoncer-l-effet-attendu` *(stmg:2 ; 3 blocs nommés)*
- `la-capacite-qui-bloque` *(stmg:3 ; 3 blocs nommés)*
- `rupture-ou-surstock` *(stmg:3 ; 3 blocs nommés)*
- `seuil-de-rentabilite` *(stmg:2 ; 3 blocs nommés)*
- `un-marche-qui-change` *(stmg:3 ; 3 blocs nommés)*
- `variable-ou-fixe` *(stmg:2 ; 3 blocs nommés)*

#### Les organisations et les acteurs · Terminale, tronc commun

6 gestes liés.

- `annoncer-l-effet-attendu` *(stmg:2 ; 3 blocs nommés)*
- `la-capacite-qui-bloque` *(stmg:3 ; 3 blocs nommés)*
- `rupture-ou-surstock` *(stmg:3 ; 3 blocs nommés)*
- `seuil-de-rentabilite` *(stmg:2 ; 3 blocs nommés)*
- `un-marche-qui-change` *(stmg:3 ; 3 blocs nommés)*
- `variable-ou-fixe` *(stmg:2 ; 3 blocs nommés)*

#### Le management stratégique, du diagnostic à la fixation des objectifs · Première, management

3 gestes liés.

- `la-capacite-qui-bloque` *(stmg:3 ; 3 blocs nommés)*
- `rupture-ou-surstock` *(stmg:3 ; 3 blocs nommés)*
- `un-marche-qui-change` *(stmg:3 ; 3 blocs nommés)*

#### Numérique et intelligence collective · Première, sciences de gestion et numérique

3 gestes liés.

- `assumer-une-erreur` *(stmg:4 ; 4 blocs nommés)*
- `choisir-ses-indicateurs` *(stmg:4 ; 4 blocs nommés)*
- `presenter-a-l-oral` *(stmg:4 ; 4 blocs nommés)*

#### Les choix stratégiques des organisations · Première, management

3 gestes liés.

- `assumer-une-erreur` *(stmg:4 ; 4 blocs nommés)*
- `choisir-ses-indicateurs` *(stmg:4 ; 4 blocs nommés)*
- `presenter-a-l-oral` *(stmg:4 ; 4 blocs nommés)*

#### Les organisations et la société · Terminale, tronc commun

3 gestes liés.

- `assumer-une-erreur` *(stmg:4 ; 4 blocs nommés)*
- `choisir-ses-indicateurs` *(stmg:4 ; 4 blocs nommés)*
- `presenter-a-l-oral` *(stmg:4 ; 4 blocs nommés)*

### BTS Comptabilité et Gestion

#### P1 · Contrôle et traitement comptable des opérations commerciales

5 gestes liés.

- `hierarchiser-un-diagnostic` *(cg1:1 ; 1 blocs nommés)*
- `lire-les-comptes` *(cg1:1 ; 1 blocs nommés)*
- `reperer-la-contrainte` *(cg1:1 ; 1 blocs nommés)*
- `financer-le-court-terme` *(cg1:5 ; 2 blocs nommés)*
- `tva` *(cg1:5 ; 2 blocs nommés)*

#### P5 · Analyse et prévision de l'activité

12 gestes liés.

- `fixer-un-prix` *(cg1:2 ; 1 blocs nommés)*
- `marge-unitaire` *(cg1:2 ; 1 blocs nommés)*
- `seuil-de-rentabilite` *(cg1:2 ; 1 blocs nommés)*
- `variable-ou-fixe` *(cg1:2 ; 1 blocs nommés)*
- `charge-ou-decaissement` *(cg1:3 ; 2 blocs nommés)*
- `chiffrer-un-besoin-de-financement` *(cg1:3 ; 2 blocs nommés)*
- `construire-une-serie` *(cg1:6 ; 2 blocs nommés)*
- `controler-un-export` *(cg1:6 ; 2 blocs nommés)*
- `ecrire-une-note` *(cg1:6 ; 2 blocs nommés)*
- `mesurer-l-effet-d-une-action` *(cg1:3 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(cg1:3 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(cg1:6 ; 2 blocs nommés)*

#### P6 · Analyse de la situation financière

7 gestes liés.

- `charge-ou-decaissement` *(cg1:3, cg1:4 ; 2 blocs nommés)*
- `chiffrer-un-besoin-de-financement` *(cg1:3 ; 2 blocs nommés)*
- `cout-de-revient` *(cg1:4 ; 2 blocs nommés)*
- `financer-le-court-terme` *(cg1:4 ; 2 blocs nommés)*
- `mesurer-l-effet-d-une-action` *(cg1:3 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(cg1:3 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(cg1:4 ; 2 blocs nommés)*

#### P2 · Contrôle et production de l'information financière

4 gestes liés.

- `charge-ou-decaissement` *(cg1:4 ; 2 blocs nommés)*
- `cout-de-revient` *(cg1:4 ; 2 blocs nommés)*
- `financer-le-court-terme` *(cg1:4 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(cg1:4 ; 2 blocs nommés)*

#### P3 · Gestion des obligations fiscales

2 gestes liés.

- `financer-le-court-terme` *(cg1:5 ; 2 blocs nommés)*
- `tva` *(cg1:5 ; 2 blocs nommés)*

#### P7 · Fiabilisation de l'information et système d'information comptable (SIC)

4 gestes liés.

- `construire-une-serie` *(cg1:6 ; 2 blocs nommés)*
- `controler-un-export` *(cg1:6 ; 2 blocs nommés)*
- `ecrire-une-note` *(cg1:6 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(cg1:6 ; 2 blocs nommés)*

### BTS Management commercial opérationnel

#### Bloc 3 · Assurer la gestion opérationnelle

18 gestes liés.

- `effet-d-un-delai` *(mco:2, mco2:2, mco2:4, mco2:5 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(mco:1, mco2:1, mco2:3 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(mco:5, mco2:6 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(mco:2, mco2:2 ; 2 blocs nommés)*
- `decider-un-volume` *(mco:4, mco2:1 ; 2 blocs nommés)*
- `financer-le-court-terme` *(mco2:4, mco2:5 ; 2 blocs nommés)*
- `marge-unitaire` *(mco:1, mco2:1 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(mco:5, mco2:6 ; 2 blocs nommés)*
- `tableau-de-bord` *(mco:5, mco2:6 ; 2 blocs nommés)*
- `anticiper-un-volume` *(mco:4 ; 2 blocs nommés)*
- `arbitrer-entre-clienteles` *(mco2:4 ; 2 blocs nommés)*
- `defendre-un-choix` *(mco:2 ; 2 blocs nommés)*
- `mesurer-l-effet-d-une-action` *(mco2:5 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(mco2:2 ; 2 blocs nommés)*
- `recruter-ou-retenir` *(mco2:3 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(mco2:3 ; 2 blocs nommés)*
- `rupture-ou-surstock` *(mco:4 ; 2 blocs nommés)*
- `situer-son-offre` *(mco:1 ; 2 blocs nommés)*

#### Bloc 2 · Animer et dynamiser l'offre commerciale

18 gestes liés.

- `seuil-de-rentabilite` *(mco:1, mco2:1, mco2:3 ; 2 blocs nommés)*
- `decider-un-volume` *(mco:4, mco2:1 ; 2 blocs nommés)*
- `effet-d-un-delai` *(mco:2, mco2:5 ; 2 blocs nommés)*
- `marge-unitaire` *(mco:1, mco2:1 ; 2 blocs nommés)*
- `recruter-ou-retenir` *(mco:3, mco2:3 ; 2 blocs nommés)*
- `anticiper-un-volume` *(mco:4 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(mco:3 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(mco2:6 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(mco:2 ; 2 blocs nommés)*
- `defendre-un-choix` *(mco:2 ; 2 blocs nommés)*
- `financer-le-court-terme` *(mco2:5 ; 2 blocs nommés)*
- `lire-un-indicateur` *(mco:3 ; 2 blocs nommés)*
- `mesurer-l-effet-d-une-action` *(mco2:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(mco2:6 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(mco2:3 ; 2 blocs nommés)*
- `rupture-ou-surstock` *(mco:4 ; 2 blocs nommés)*
- `situer-son-offre` *(mco:1 ; 2 blocs nommés)*
- `tableau-de-bord` *(mco2:6 ; 2 blocs nommés)*

#### Bloc 1 · Développer la relation client et assurer la vente conseil

8 gestes liés.

- `effet-d-un-delai` *(mco2:2, mco2:4 ; 2 blocs nommés)*
- `arbitrer-entre-clienteles` *(mco2:4 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(mco:3 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(mco2:2 ; 2 blocs nommés)*
- `financer-le-court-terme` *(mco2:4 ; 2 blocs nommés)*
- `lire-un-indicateur` *(mco:3 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(mco2:2 ; 2 blocs nommés)*
- `recruter-ou-retenir` *(mco:3 ; 2 blocs nommés)*

#### Bloc 4 · Manager l'équipe commerciale

3 gestes liés.

- `choisir-ses-indicateurs` *(mco:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(mco:5 ; 2 blocs nommés)*
- `tableau-de-bord` *(mco:5 ; 2 blocs nommés)*

### BTS Négociation et digitalisation de la relation client

#### Bloc 2 · Relation client à distance et digitalisation

15 gestes liés.

- `recruter-ou-retenir` *(ndrc:3, fitness:2, fitness:3 ; 2 blocs nommés)*
- `acheter-ou-fideliser` *(ndrc:1, fitness:1 ; 2 blocs nommés)*
- `anticiper-un-volume` *(ndrc:4, fitness:3 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(ndrc:6, fitness:6 ; 2 blocs nommés)*
- `decider-un-volume` *(ndrc:4, fitness:1 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(ndrc:6, fitness:6 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(fitness:1, fitness:3 ; 2 blocs nommés)*
- `tableau-de-bord` *(ndrc:6, fitness:6 ; 2 blocs nommés)*
- `valeur-dans-la-duree` *(ndrc:2, fitness:2 ; 2 blocs nommés)*
- `ce-que-preleve-un-canal` *(ndrc:1 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(ndrc:3 ; 2 blocs nommés)*
- `cout-d-acquisition` *(ndrc:2 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(ndrc:1 ; 2 blocs nommés)*
- `la-capacite-qui-bloque` *(ndrc:4 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(ndrc:3 ; 2 blocs nommés)*

#### Bloc 1 · Relation client et négociation-vente

21 gestes liés.

- `recruter-ou-retenir` *(ndrc:3, fitness:2, fitness:3 ; 2 blocs nommés)*
- `acheter-ou-fideliser` *(ndrc:1, fitness:1 ; 2 blocs nommés)*
- `ce-que-preleve-un-canal` *(ndrc:1, ndrc:5 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(fitness:1, fitness:3 ; 2 blocs nommés)*
- `valeur-dans-la-duree` *(ndrc:2, fitness:2 ; 2 blocs nommés)*
- `anticiper-un-volume` *(fitness:3 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(ndrc:3 ; 2 blocs nommés)*
- `charge-ou-decaissement` *(fitness:4 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(fitness:6 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(fitness:5 ; 2 blocs nommés)*
- `cout-d-acquisition` *(ndrc:2 ; 2 blocs nommés)*
- `cout-de-la-saturation` *(fitness:5 ; 2 blocs nommés)*
- `decider-un-volume` *(fitness:1 ; 2 blocs nommés)*
- `effet-d-un-delai` *(fitness:4 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(ndrc:1 ; 2 blocs nommés)*
- `la-capacite-qui-bloque` *(fitness:5 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(fitness:4 ; 2 blocs nommés)*
- `preparer-une-negociation` *(ndrc:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(fitness:6 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(ndrc:3 ; 2 blocs nommés)*
- `tableau-de-bord` *(fitness:6 ; 2 blocs nommés)*

#### Bloc 3 · Relation client et animation de réseaux

13 gestes liés.

- `la-capacite-qui-bloque` *(ndrc:4, fitness:5 ; 2 blocs nommés)*
- `anticiper-un-volume` *(ndrc:4 ; 2 blocs nommés)*
- `ce-que-preleve-un-canal` *(ndrc:5 ; 2 blocs nommés)*
- `charge-ou-decaissement` *(fitness:4 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(ndrc:6 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(fitness:5 ; 2 blocs nommés)*
- `cout-de-la-saturation` *(fitness:5 ; 2 blocs nommés)*
- `decider-un-volume` *(ndrc:4 ; 2 blocs nommés)*
- `effet-d-un-delai` *(fitness:4 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(fitness:4 ; 2 blocs nommés)*
- `preparer-une-negociation` *(ndrc:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(ndrc:6 ; 2 blocs nommés)*
- `tableau-de-bord` *(ndrc:6 ; 2 blocs nommés)*

### BTS Gestion de la PME

#### Bloc 4 · Soutenir le fonctionnement et le développement de la PME

13 gestes liés.

- `ce-qui-erode-la-marge` *(gpme:5 ; 2 blocs nommés)*
- `chiffrer-un-risque` *(gpme:3 ; 2 blocs nommés)*
- `dependance-a-un-client` *(gpme:5 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(gpme:1 ; 2 blocs nommés)*
- `identifier-les-risques` *(gpme:3 ; 2 blocs nommés)*
- `lire-les-comptes` *(gpme:1 ; 2 blocs nommés)*
- `quand-recruter` *(gpme:4 ; 2 blocs nommés)*
- `relier-decisions-et-resultats` *(gpme:6 ; 2 blocs nommés)*
- `reperer-la-contrainte` *(gpme:1 ; 2 blocs nommés)*
- `repondre-aux-objections` *(gpme:6 ; 2 blocs nommés)*
- `repondre-sans-rompre` *(gpme:5 ; 2 blocs nommés)*
- `supporter-reduire-transferer` *(gpme:3 ; 2 blocs nommés)*
- `tableau-de-bord` *(gpme:6 ; 2 blocs nommés)*

#### Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME

9 gestes liés.

- `ce-qui-erode-la-marge` *(gpme:5 ; 2 blocs nommés)*
- `dependance-a-un-client` *(gpme:5 ; 2 blocs nommés)*
- `ecrire-une-note` *(gpme:2 ; 2 blocs nommés)*
- `effet-d-un-delai` *(gpme:2 ; 2 blocs nommés)*
- `financer-le-court-terme` *(gpme:2 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(gpme:1 ; 2 blocs nommés)*
- `lire-les-comptes` *(gpme:1 ; 2 blocs nommés)*
- `reperer-la-contrainte` *(gpme:1 ; 2 blocs nommés)*
- `repondre-sans-rompre` *(gpme:5 ; 2 blocs nommés)*

#### Bloc 2 · Participer à la gestion des risques de la PME

9 gestes liés.

- `chiffrer-un-risque` *(gpme:3 ; 2 blocs nommés)*
- `ecrire-une-note` *(gpme:2 ; 2 blocs nommés)*
- `effet-d-un-delai` *(gpme:2 ; 2 blocs nommés)*
- `financer-le-court-terme` *(gpme:2 ; 2 blocs nommés)*
- `identifier-les-risques` *(gpme:3 ; 2 blocs nommés)*
- `relier-decisions-et-resultats` *(gpme:6 ; 2 blocs nommés)*
- `repondre-aux-objections` *(gpme:6 ; 2 blocs nommés)*
- `supporter-reduire-transferer` *(gpme:3 ; 2 blocs nommés)*
- `tableau-de-bord` *(gpme:6 ; 2 blocs nommés)*

#### Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME

1 gestes liés.

- `quand-recruter` *(gpme:4 ; 2 blocs nommés)*

### BTS Management en hôtellerie-restauration

#### Bloc 1 · Piloter l'activité opérationnelle de l'établissement

12 gestes liés.

- `anticiper-un-volume` *(mhr:3 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(mhr:2 ; 2 blocs nommés)*
- `defendre-un-choix` *(mhr:2 ; 2 blocs nommés)*
- `effet-d-un-delai` *(mhr:3 ; 2 blocs nommés)*
- `financer-le-court-terme` *(mhr:4 ; 2 blocs nommés)*
- `fixer-un-prix` *(mhr:3 ; 2 blocs nommés)*
- `marge-unitaire` *(mhr:1 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(mhr:4 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(mhr:2 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(mhr:4 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(mhr:1 ; 2 blocs nommés)*
- `situer-son-offre` *(mhr:1 ; 2 blocs nommés)*

#### Bloc 2 · Analyser les coûts et la performance pour décider

9 gestes liés.

- `choisir-ses-indicateurs` *(mhr:5 ; 2 blocs nommés)*
- `financer-le-court-terme` *(mhr:4 ; 2 blocs nommés)*
- `marge-unitaire` *(mhr:1 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(mhr:4 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(mhr:5 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(mhr:4 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(mhr:1 ; 2 blocs nommés)*
- `situer-son-offre` *(mhr:1 ; 2 blocs nommés)*
- `tableau-de-bord` *(mhr:5 ; 2 blocs nommés)*

#### Bloc 3 · Gérer l'offre commerciale et la relation client

6 gestes liés.

- `anticiper-un-volume` *(mhr:3 ; 2 blocs nommés)*
- `ce-qui-erode-la-marge` *(mhr:2 ; 2 blocs nommés)*
- `defendre-un-choix` *(mhr:2 ; 2 blocs nommés)*
- `effet-d-un-delai` *(mhr:3 ; 2 blocs nommés)*
- `fixer-un-prix` *(mhr:3 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(mhr:2 ; 2 blocs nommés)*

#### Bloc 4 · Rendre compte et manager l'équipe

3 gestes liés.

- `choisir-ses-indicateurs` *(mhr:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(mhr:5 ; 2 blocs nommés)*
- `tableau-de-bord` *(mhr:5 ; 2 blocs nommés)*

### BTS Management en hôtellerie-restauration, options B et C

#### Bloc 2 · Analyser les coûts et la performance pour décider

8 gestes liés.

- `choisir-ses-indicateurs` *(bistrot:5 ; 2 blocs nommés)*
- `marge-unitaire` *(bistrot:1 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(bistrot:5 ; 2 blocs nommés)*
- `quand-recruter` *(bistrot:3 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(bistrot:3 ; 2 blocs nommés)*
- `rupture-ou-surstock` *(bistrot:1 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(bistrot:1 ; 2 blocs nommés)*
- `tableau-de-bord` *(bistrot:5 ; 2 blocs nommés)*

#### Bloc 1 · Piloter l'activité opérationnelle de l'établissement

8 gestes liés.

- `effet-d-un-delai` *(bistrot:2, bistrot:4 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(bistrot:2 ; 2 blocs nommés)*
- `la-capacite-qui-bloque` *(bistrot:4 ; 2 blocs nommés)*
- `marge-par-unite-rare` *(bistrot:4 ; 2 blocs nommés)*
- `marge-unitaire` *(bistrot:1 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(bistrot:2 ; 2 blocs nommés)*
- `rupture-ou-surstock` *(bistrot:1 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(bistrot:1 ; 2 blocs nommés)*

#### Bloc 3 · Gérer l'offre commerciale et la relation client

7 gestes liés.

- `effet-d-un-delai` *(bistrot:2, bistrot:4 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(bistrot:2 ; 2 blocs nommés)*
- `la-capacite-qui-bloque` *(bistrot:4 ; 2 blocs nommés)*
- `marge-par-unite-rare` *(bistrot:4 ; 2 blocs nommés)*
- `qualite-et-frequentation` *(bistrot:2 ; 2 blocs nommés)*
- `quand-recruter` *(bistrot:3 ; 2 blocs nommés)*
- `repercuter-une-hausse` *(bistrot:3 ; 2 blocs nommés)*

#### Bloc 4 · Rendre compte et manager l'équipe

3 gestes liés.

- `choisir-ses-indicateurs` *(bistrot:5 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(bistrot:5 ; 2 blocs nommés)*
- `tableau-de-bord` *(bistrot:5 ; 2 blocs nommés)*

### BUT Gestion des entreprises et des administrations

#### Bloc 1 · Analyser les coûts et la rentabilité

9 gestes liés.

- `anticiper-un-volume` *(gea:4 ; 2 blocs nommés)*
- `besoin-en-fonds-de-roulement` *(gea:4 ; 2 blocs nommés)*
- `cout-de-la-saturation` *(gea:3 ; 2 blocs nommés)*
- `cout-de-revient` *(gea:1 ; 2 blocs nommés)*
- `juger-un-investissement` *(gea:3 ; 2 blocs nommés)*
- `marge-par-unite-rare` *(gea:3 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(gea:1 ; 2 blocs nommés)*
- `tenir-ensemble` *(gea:4 ; 2 blocs nommés)*
- `variable-ou-fixe` *(gea:1 ; 2 blocs nommés)*

#### Bloc 2 · Établir et lire les documents de synthèse

9 gestes liés.

- `besoin-en-fonds-de-roulement` *(gea:2 ; 2 blocs nommés)*
- `choisir-ses-indicateurs` *(gea:5 ; 2 blocs nommés)*
- `cout-de-revient` *(gea:1 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(gea:2 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(gea:5 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(gea:2 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(gea:1 ; 2 blocs nommés)*
- `tenir-ensemble` *(gea:5 ; 2 blocs nommés)*
- `variable-ou-fixe` *(gea:1 ; 2 blocs nommés)*

#### Bloc 3 · Piloter la trésorerie et le financement

5 gestes liés.

- `besoin-en-fonds-de-roulement` *(gea:2, gea:4 ; 2 blocs nommés)*
- `anticiper-un-volume` *(gea:4 ; 2 blocs nommés)*
- `plan-de-tresorerie` *(gea:2 ; 2 blocs nommés)*
- `resultat-contre-caisse` *(gea:2 ; 2 blocs nommés)*
- `tenir-ensemble` *(gea:4 ; 2 blocs nommés)*

#### Bloc 4 · Décider et rendre compte

6 gestes liés.

- `choisir-ses-indicateurs` *(gea:5 ; 2 blocs nommés)*
- `cout-de-la-saturation` *(gea:3 ; 2 blocs nommés)*
- `juger-un-investissement` *(gea:3 ; 2 blocs nommés)*
- `marge-par-unite-rare` *(gea:3 ; 2 blocs nommés)*
- `presenter-a-l-oral` *(gea:5 ; 2 blocs nommés)*
- `tenir-ensemble` *(gea:5 ; 2 blocs nommés)*

### DCG

#### UE6 · Finance d'entreprise

15 gestes liés.

- `budget-et-hypotheses` *(dcg:3, dcg-rse:4 ; 2 blocs nommés)*
- `capital-d-image` *(dcg-rse:2, dcg-rse:4 ; 2 blocs nommés)*
- `besoin-en-fonds-de-roulement` *(dcg:1 ; 2 blocs nommés)*
- `choisir-un-financement` *(dcg:3 ; 2 blocs nommés)*
- `decider-avec-le-risque` *(dcg:2 ; 2 blocs nommés)*
- `depense-ou-engagement` *(dcg-rse:2 ; 2 blocs nommés)*
- `effets-differes-d-un-engagement` *(dcg-rse:4 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(dcg:1 ; 2 blocs nommés)*
- `juger-un-investissement` *(dcg:3 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(dcg:2 ; 2 blocs nommés)*
- `soldes-intermediaires` *(dcg:1 ; 2 blocs nommés)*
- `variable-ou-fixe` *(dcg:2 ; 2 blocs nommés)*
- `assumer-une-erreur` *(dcg:5 ; 3 blocs nommés)*
- `ecrire-une-note` *(dcg:5 ; 3 blocs nommés)*
- `repondre-aux-objections` *(dcg:5 ; 3 blocs nommés)*

#### UE11 · Contrôle de gestion

21 gestes liés.

- `budget-et-hypotheses` *(dcg:3, dcg:4 ; 1 blocs nommés)*
- `decision-ou-marche` *(dcg:4 ; 1 blocs nommés)*
- `decomposer-un-ecart` *(dcg:4 ; 1 blocs nommés)*
- `juger-un-investissement` *(dcg:3, dcg-rse:3 ; 2 blocs nommés)*
- `repondre-aux-objections` *(dcg:5, dcg-rse:6 ; 2 blocs nommés)*
- `besoin-en-fonds-de-roulement` *(dcg:1 ; 2 blocs nommés)*
- `choisir-un-financement` *(dcg:3 ; 2 blocs nommés)*
- `commenter-une-trajectoire-esg` *(dcg-rse:6 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(dcg-rse:3 ; 2 blocs nommés)*
- `construire-une-serie` *(dcg-rse:6 ; 2 blocs nommés)*
- `decider-avec-le-risque` *(dcg:2 ; 2 blocs nommés)*
- `depense-ou-engagement` *(dcg-rse:1 ; 2 blocs nommés)*
- `effets-differes-d-un-engagement` *(dcg-rse:3 ; 2 blocs nommés)*
- `empreinte-d-une-decision` *(dcg-rse:1 ; 2 blocs nommés)*
- `hierarchiser-un-diagnostic` *(dcg:1 ; 2 blocs nommés)*
- `lire-un-indice-esg` *(dcg-rse:1 ; 2 blocs nommés)*
- `seuil-de-rentabilite` *(dcg:2 ; 2 blocs nommés)*
- `soldes-intermediaires` *(dcg:1 ; 2 blocs nommés)*
- `variable-ou-fixe` *(dcg:2 ; 2 blocs nommés)*
- `assumer-une-erreur` *(dcg:5 ; 3 blocs nommés)*
- `ecrire-une-note` *(dcg:5 ; 3 blocs nommés)*

#### UE13 · Communication professionnelle

5 gestes liés.

- `repondre-aux-objections` *(dcg:5, dcg-rse:6 ; 2 blocs nommés)*
- `commenter-une-trajectoire-esg` *(dcg-rse:6 ; 2 blocs nommés)*
- `construire-une-serie` *(dcg-rse:6 ; 2 blocs nommés)*
- `assumer-une-erreur` *(dcg:5 ; 3 blocs nommés)*
- `ecrire-une-note` *(dcg:5 ; 3 blocs nommés)*

#### UE7 · Management des organisations

11 gestes liés.

- `decider-avec-le-risque` *(dcg-rse:5 ; 1 blocs nommés)*
- `parties-prenantes` *(dcg-rse:5 ; 1 blocs nommés)*
- `reputation-ou-finance` *(dcg-rse:5 ; 1 blocs nommés)*
- `capital-d-image` *(dcg-rse:2, dcg-rse:4 ; 2 blocs nommés)*
- `depense-ou-engagement` *(dcg-rse:1, dcg-rse:2 ; 2 blocs nommés)*
- `effets-differes-d-un-engagement` *(dcg-rse:3, dcg-rse:4 ; 2 blocs nommés)*
- `budget-et-hypotheses` *(dcg-rse:4 ; 2 blocs nommés)*
- `comparer-des-fournisseurs` *(dcg-rse:3 ; 2 blocs nommés)*
- `empreinte-d-une-decision` *(dcg-rse:1 ; 2 blocs nommés)*
- `juger-un-investissement` *(dcg-rse:3 ; 2 blocs nommés)*
- `lire-un-indice-esg` *(dcg-rse:1 ; 2 blocs nommés)*

