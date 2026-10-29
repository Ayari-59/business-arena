-- LE COURS SELON L'OFFRE (décision du propriétaire, octobre 2026 ; la règle :
-- services/cours.service.ts, coursOuvert) : la Découverte ouvre le seul chapitre libre,
-- Classe les chapitres du parcours de la classe, Programme ceux des parcours de ses classes,
-- Campus tous les chapitres. Les cartes le disent (config/tarifs.ts, LE_COURS_PAR_OFFRE).
--
-- Le catalogue se lit en base (/admin/offres) : changer config/tarifs.ts ne suffit pas.
-- Seule la ligne du cours versée par la migration 0049 est remplacée : une carte réécrite
-- dans /admin/offres reste telle quelle. Rejouable.
UPDATE "catalogue_offres"
   SET "inclus" = replace("inclus"::text,
         'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.',
         'Le cours : les chapitres du parcours de la classe et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.')::jsonb,
       "updated_at" = now()
 WHERE "code" = 'classe'
   AND "inclus" ? 'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = replace("inclus"::text,
         'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.',
         'Le cours : les chapitres des parcours de vos classes et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.')::jsonb,
       "updated_at" = now()
 WHERE "code" = 'programme'
   AND "inclus" ? 'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = replace("inclus"::text,
         'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.',
         'Le cours : tous les chapitres de tous les parcours et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.')::jsonb,
       "updated_at" = now()
 WHERE "code" = 'campus'
   AND "inclus" ? 'Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = "inclus" || '["Le premier chapitre du cours et son cas pratique, en libre accès."]'::jsonb,
       "updated_at" = now()
 WHERE "code" = 'decouverte'
   AND jsonb_typeof("inclus") = 'array'
   AND NOT ("inclus" ? 'Le premier chapitre du cours et son cas pratique, en libre accès.');
