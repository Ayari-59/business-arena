-- LES OFFRES DE L'ARÈNE, DÉCISIONS DU PROPRIÉTAIRE D'OCTOBRE 2026 :
--   « cours inclus » : le cours et ses cas pratiques s'écrivent sur les cartes Classe,
--   Programme et Campus ;
--   « une classe max 35 élèves » : la carte Classe le dit (la règle est dans le code,
--   services/acces.service.ts) ;
--   « examen individuel inclus dans campus » : le module « examen » quitte Programme ;
--   « 1 de 1 a 3 » : la Découverte ouvre en solo les niveaux 1 à 3 de toutes les
--   entreprises, la règle par défaut (config/vitrine-solo.ts), quel qu'en soit le réglage.
--
-- Le catalogue se lit en base (/admin/offres) : changer config/tarifs.ts ne suffit pas.
-- Les textes ne se remplacent que s'ils sont encore ceux que la migration 0041 a versés :
-- une carte réécrite dans /admin/offres reste telle quelle. Les licences déjà vendues ne
-- changent pas : elles portent ce qui a été vendu.
-- classe
UPDATE "catalogue_offres"
   SET "inclus" = '["Une entreprise au choix parmi les {entreprises}, et un niveau au choix de {niveaux}, fixés pour l''année.","Autant de parties que vous voulez dans l''année avec ce paramétrage, une à la fois.","Une classe de {elevesParClasse} élèves au plus, dans une partie comme dans le cours.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.","Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.","Un concours à la place d''une partie, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb, "updated_at" = now()
 WHERE "code" = 'classe'
   AND "inclus" = '["Une entreprise au choix parmi les {entreprises}, et un niveau au choix de {niveaux}, fixés pour l''année.","Autant de parties que vous voulez dans l''année avec ce paramétrage, une à la fois.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Les ateliers clés en main qui se jouent avec cette entreprise et ce niveau, avec déroulé, corrigés et dossier enseignant.","Un concours à la place d''une partie, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb;
--> statement-breakpoint
-- programme
UPDATE "catalogue_offres"
   SET "inclus" = '["Une entreprise au choix parmi les {entreprises}, choisie à l''achat, à tous les niveaux, de {niveaux}.","Toutes les promotions et tous les groupes du programme, plusieurs parties en même temps.","L''équipe pédagogique et les intervenants du programme, référent compris, au nombre fixé au devis.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.","Les ateliers clés en main de cette entreprise, avec déroulé, corrigés et dossier enseignant.","Les concours et le classement à l''IPG, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb, "updated_at" = now()
 WHERE "code" = 'programme'
   AND "inclus" = '["Une entreprise au choix parmi les {entreprises}, choisie à l''achat, à tous les niveaux, de {niveaux}.","Toutes les promotions et tous les groupes du programme, plusieurs parties en même temps.","L''équipe pédagogique et les intervenants du programme, au nombre fixé au devis.","Les parties de classe : les étudiants rejoignent par un code, sans compte ni e-mail, en équipes, entreprises en concurrence.","Le suivi : tableau de bord, observation, maîtrise des notions, révélation et projection en cours, relevé de notes exportable en tableur.","Les ateliers clés en main de cette entreprise, avec déroulé, corrigés et dossier enseignant.","Les concours et le classement à l''IPG, si l''entreprise choisie est {entrepriseDesConcours} : les concours se jouent avec elle."]'::jsonb;
--> statement-breakpoint
-- campus
UPDATE "catalogue_offres"
   SET "inclus" = '["Les {entreprises} entreprises, à tous les niveaux, dans tous les programmes.","Des groupes, des enseignants et des intervenants sans limite.","Le cours : tous les chapitres et leurs cas pratiques, suivis en classe chapitre par chapitre, calculatrice comprise.","Les {ateliers} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont {ateliersReferentiel} adossés au référentiel d''un diplôme ({diplomes}).","Les concours et le classement à l''IPG.","L''examen individuel : une partie solo notée sur une grille fixe, la même pour tous les candidats.","Un référent qui gère les accès.","Une facture au nom de l''école.","Une licence par année scolaire, du {debutAnneeScolaire} au {finAnneeScolaire}."]'::jsonb, "updated_at" = now()
 WHERE "code" = 'campus'
   AND "inclus" = '["Les {entreprises} entreprises, à tous les niveaux, dans tous les programmes.","Des groupes, des enseignants et des intervenants sans limite.","Les {ateliers} ateliers clés en main, avec déroulé, corrigés et dossier enseignant, dont {ateliersReferentiel} adossés au référentiel d''un diplôme ({diplomes}).","Les concours et le classement à l''IPG.","Un référent qui gère les accès.","Une facture au nom de l''école.","Une licence par année scolaire, du {debutAnneeScolaire} au {finAnneeScolaire}."]'::jsonb;
--> statement-breakpoint
UPDATE "catalogue_offres"
   SET "modules" = COALESCE(
         (SELECT jsonb_agg(m ORDER BY i) FROM jsonb_array_elements("modules") WITH ORDINALITY AS t(m, i) WHERE m ->> 'module' <> 'examen'),
         '[]'::jsonb),
       "updated_at" = now()
 WHERE "code" = 'programme'
   AND "modules" @> '[{"module": "examen"}]'::jsonb;
--> statement-breakpoint
UPDATE "catalogue_reglages"
   SET "valeur" = jsonb_set("valeur", '{solo}', '{"active": true, "entrepriseOuverte": "", "niveauMaxAutres": 3}'::jsonb),
       "updated_at" = now()
 WHERE "cle" = 'decouverte';
