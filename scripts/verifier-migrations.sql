-- ════════════════════════════════════════════════════════════════════════════
-- Que contient VRAIMENT la base, face aux six migrations absentes du journal ?
--
-- À coller dans l'éditeur SQL de Neon. STRICTEMENT EN LECTURE : que des SELECT
-- sur les catalogues système. Aucune table touchée, aucune migration jouée.
--
-- Contexte : six fichiers de drizzle/ ne figurent pas dans
-- drizzle/meta/_journal.json, donc `drizzle-kit migrate` ne les a jamais joués.
-- Reste à savoir si leurs colonnes sont là quand même (posées à la main) ou
-- absentes. La réponse décide de la suite, et le risque diffère :
--   • 0013, 0014, 0015, 0016 sont idempotentes (IF NOT EXISTS) → rejouables.
--   • 0017 et 0018 font ADD COLUMN NU → les rejouer sur une base qui a déjà ces
--     colonnes ÉCHOUE (« column already exists ») et interrompt la migration.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Les 17 objets attendus, un par ligne ────────────────────────────────
with attendu(migration, rejouable, objet, present) as (
  values
    ('0013_decision_source', 'oui', 'colonne decisions.decision_source', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'decisions' and column_name = 'decision_source')),

    ('0014_login_hardening', 'oui', 'colonne users.session_version', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'session_version')),
    ('0014_login_hardening', 'oui', 'table login_attempts', (
      select count(*) > 0 from information_schema.tables
      where table_schema = 'public' and table_name = 'login_attempts')),
    ('0014_login_hardening', 'oui', 'index login_attempts_email_idx', (
      select count(*) > 0 from pg_indexes
      where schemaname = 'public' and indexname = 'login_attempts_email_idx')),
    ('0014_login_hardening', 'oui', 'index login_attempts_ip_idx', (
      select count(*) > 0 from pg_indexes
      where schemaname = 'public' and indexname = 'login_attempts_ip_idx')),

    ('0015_bpi_v2', 'oui', 'valeur pilotage de l''enum score_dimension', (
      select count(*) > 0 from pg_type t join pg_enum e on e.enumtypid = t.oid
      where t.typname = 'score_dimension' and e.enumlabel = 'pilotage')),
    ('0015_bpi_v2', 'oui', 'colonne rounds.bpi_version', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'rounds' and column_name = 'bpi_version')),

    ('0016_scenario_definition', 'oui', 'colonne scenarios.definition', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'scenarios' and column_name = 'definition')),

    ('0017_previous_lester', 'NON', 'colonne competition_stages.starts_at', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competition_stages' and column_name = 'starts_at')),
    ('0017_previous_lester', 'NON', 'colonne competition_stages.ends_at', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competition_stages' and column_name = 'ends_at')),
    ('0017_previous_lester', 'NON', 'colonne games.opens_at', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'games' and column_name = 'opens_at')),
    ('0017_previous_lester', 'NON', 'colonne games.closes_at', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'games' and column_name = 'closes_at')),

    ('0018_public_competition_page', 'NON', 'colonne competitions.public_visible', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competitions' and column_name = 'public_visible')),
    ('0018_public_competition_page', 'NON', 'colonne competitions.tagline', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competitions' and column_name = 'tagline')),
    ('0018_public_competition_page', 'NON', 'colonne competitions.description', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competitions' and column_name = 'description')),
    ('0018_public_competition_page', 'NON', 'colonne competitions.organizer_label', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competitions' and column_name = 'organizer_label')),
    ('0018_public_competition_page', 'NON', 'colonne competitions.accent', (
      select count(*) > 0 from information_schema.columns
      where table_schema = 'public' and table_name = 'competitions' and column_name = 'accent'))
)
select
  migration,
  rejouable            as "rejouable sans risque",
  objet,
  case when present then 'présent' else '>>> MANQUANT' end as etat
from attendu
order by migration, objet;


-- ── 2. Le bilan par migration, en une ligne chacune ────────────────────────
-- (relancer ce bloc séparément : Neon n'exécute qu'une requête à la fois)
/*
with attendu(migration, rejouable, present) as (
  values
    ('0013_decision_source','oui',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='decisions' and column_name='decision_source')),
    ('0014_login_hardening','oui',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='users' and column_name='session_version')),
    ('0014_login_hardening','oui',(select count(*)>0 from information_schema.tables where table_schema='public' and table_name='login_attempts')),
    ('0014_login_hardening','oui',(select count(*)>0 from pg_indexes where schemaname='public' and indexname='login_attempts_email_idx')),
    ('0014_login_hardening','oui',(select count(*)>0 from pg_indexes where schemaname='public' and indexname='login_attempts_ip_idx')),
    ('0015_bpi_v2','oui',(select count(*)>0 from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname='score_dimension' and e.enumlabel='pilotage')),
    ('0015_bpi_v2','oui',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='rounds' and column_name='bpi_version')),
    ('0016_scenario_definition','oui',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='scenarios' and column_name='definition')),
    ('0017_previous_lester','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competition_stages' and column_name='starts_at')),
    ('0017_previous_lester','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competition_stages' and column_name='ends_at')),
    ('0017_previous_lester','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='games' and column_name='opens_at')),
    ('0017_previous_lester','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='games' and column_name='closes_at')),
    ('0018_public_competition_page','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competitions' and column_name='public_visible')),
    ('0018_public_competition_page','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competitions' and column_name='tagline')),
    ('0018_public_competition_page','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competitions' and column_name='description')),
    ('0018_public_competition_page','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competitions' and column_name='organizer_label')),
    ('0018_public_competition_page','NON',(select count(*)>0 from information_schema.columns where table_schema='public' and table_name='competitions' and column_name='accent'))
)
select
  migration,
  rejouable as "rejouable sans risque",
  count(*) filter (where present) || '/' || count(*) as objets_presents,
  case
    when count(*) filter (where present) = count(*) then 'DÉJÀ EN BASE'
    when count(*) filter (where present) = 0        then 'ABSENTE'
    else 'PARTIELLE — le cas le plus délicat'
  end as verdict
from attendu
group by migration, rejouable
order by migration;
*/


-- ── 3. Ce que drizzle croit avoir appliqué ─────────────────────────────────
-- Le journal du dépôt en compte 14 (0000 à 0012, plus 0013_add_learning_steps_tables).
-- Un écart ici dit qu'une autre main est passée.
/*
select
  count(*)                                                          as migrations_enregistrees,
  to_char(to_timestamp(min(created_at) / 1000), 'YYYY-MM-DD HH24:MI') as premiere,
  to_char(to_timestamp(max(created_at) / 1000), 'YYYY-MM-DD HH24:MI') as derniere
from drizzle.__drizzle_migrations;
*/
