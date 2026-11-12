-- LE CATALOGUE EN BASE ALIGNÉ SUR LE CODE (décision du propriétaire, 11 novembre 2026 ; audit de
-- l'offre du même jour, section 9). Quatre textes de /tarifs différaient de la grille de
-- config/tarifs.ts : la base gardait ce que les migrations 0041 et 0053 y avaient versé, et la page que
-- les CGV rendent contractuelle les contredisait. Le propriétaire a donné son accord pour les aligner
-- par le déploiement :
--   · le nom de l'offre gratuite, « Découverte », devient « Essai gratuit » ;
--   · la ligne du cours de l'offre gratuite : un chapitre libre par diplôme ;
--   · la ligne du cours de Classe : la règle du code (un parcours de la liste, le même pour toutes les
--     classes, fixé au devis ou par la première classe créée sous la licence ; autant de classes que
--     voulu, de {elevesParClasse} élèves au plus) ;
--   · la ligne des ateliers de Classe : les combinaisons sans atelier, que le devis dit.
--
-- RIEN DE CE QUE LE PROPRIÉTAIRE A RÉDIGÉ N'EST ÉCRASÉ : chaque texte n'est remplacé que là où l'ancien
-- est encore en place, élément pour élément de la liste ; une carte réécrite dans /admin/offres reste
-- telle quelle. Les licences déjà vendues ne changent pas : elles portent ce qui a été vendu. Rejouable.
UPDATE "catalogue_offres"
   SET "nom" = 'Essai gratuit',
       "updated_at" = now()
 WHERE "code" = 'decouverte'
   AND "nom" = 'Découverte';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = (
         SELECT jsonb_agg(
                  CASE WHEN e = to_jsonb('Le premier chapitre du cours et son cas pratique, en libre accès.'::text)
                       THEN to_jsonb('Un chapitre libre par diplôme et son cas pratique, en libre accès.'::text)
                       ELSE e END
                  ORDER BY i)
           FROM jsonb_array_elements("inclus") WITH ORDINALITY AS t(e, i)),
       "updated_at" = now()
 WHERE "code" = 'decouverte'
   AND jsonb_typeof("inclus") = 'array'
   AND "inclus" ? 'Le premier chapitre du cours et son cas pratique, en libre accès.';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = (
         SELECT jsonb_agg(
                  CASE WHEN e = to_jsonb('Le cours : les chapitres du parcours de la classe et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.'::text)
                       THEN to_jsonb('Le cours : les chapitres d''un parcours de la liste (le cours d''un diplôme ou une matière) et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise. Le même parcours pour toutes vos classes, fixé au devis ou par votre première classe créée sous la licence ; autant de classes que vous voulez, de {elevesParClasse} élèves au plus.'::text)
                       ELSE e END
                  ORDER BY i)
           FROM jsonb_array_elements("inclus") WITH ORDINALITY AS t(e, i)),
       "updated_at" = now()
 WHERE "code" = 'classe'
   AND jsonb_typeof("inclus") = 'array'
   AND "inclus" ? 'Le cours : les chapitres du parcours de la classe et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.';
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "inclus" = (
         SELECT jsonb_agg(
                  CASE WHEN e = to_jsonb('Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.'::text)
                       THEN to_jsonb('Les ateliers clés en main écrits pour cette entreprise et ce niveau, ou à un niveau près, avec déroulé, corrigés et dossier enseignant. Certaines combinaisons n''en ont aucun : le formulaire de devis dit lesquels votre choix comprend.'::text)
                       ELSE e END
                  ORDER BY i)
           FROM jsonb_array_elements("inclus") WITH ORDINALITY AS t(e, i)),
       "updated_at" = now()
 WHERE "code" = 'classe'
   AND jsonb_typeof("inclus") = 'array'
   AND "inclus" ? 'Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.';
