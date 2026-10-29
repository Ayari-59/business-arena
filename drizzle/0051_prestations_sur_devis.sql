-- LES PRESTATIONS HUMAINES SUR DEVIS, ET LE GUIDE DE DÉBRIEF TIRÉ DU REGISTRE DES FICHES
-- (audit P0-1 et P1-11, décisions du propriétaire d'octobre 2026) :
--   « Cohorte animée » : la taille de la cohorte, la demi-journée de lancement et le débrief
--   animé à distance ne sont plus annoncés comme inclus, mais sur devis ;
--   « Organisme de formation » : le nombre du guide de débrief est celui des fiches
--   (variable {fiches}, config/episodes/fiches), et non plus celui des épisodes.
--
-- Le catalogue se lit en base (/admin/offres) : changer config/tarifs.ts ne suffit pas.
-- Les formules ne se remplacent que si elles sont encore celles que la migration 0041 a
-- versées : une carte réécrite dans /admin/offres reste telle quelle. Rejouable.
UPDATE "catalogue_offres"
   SET "formules" = '[{"nom":"Parcours manager","inclus":["Les {episodes} épisodes, en autonomie.","Le profil décisionnel, et la recommandation du prochain épisode.","Sans compte à créer : un code de cohorte pour entrer, un code de reprise pour changer d''appareil."]},{"nom":"Cohorte animée","inclus":["Les épisodes choisis pour la cohorte, et un code de cohorte.","La vue de l''animateur.","Sur devis : une cohorte de {managers} managers et de {episodesMin} à {episodesMax} épisodes, une demi-journée de lancement, un débrief animé à distance."]},{"nom":"Organisme de formation","inclus":["Des animateurs sans limite, des cohortes à volonté.","Le guide de débrief des {fiches} épisodes."]}]'::jsonb,
       "updated_at" = now()
 WHERE "code" = 'entreprise'
   AND "formules" = '[{"nom":"Parcours manager","inclus":["Les {episodes} épisodes, en autonomie.","Le profil décisionnel, et la recommandation du prochain épisode.","Sans compte à créer : un code de cohorte pour entrer, un code de reprise pour changer d''appareil."]},{"nom":"Cohorte animée","inclus":["{managers} managers, {episodesMin} à {episodesMax} épisodes choisis, un code de cohorte.","La vue de l''animateur.","Une demi-journée de lancement, et un débrief animé à distance."]},{"nom":"Organisme de formation","inclus":["Des animateurs sans limite, des cohortes à volonté.","Le guide de débrief des {episodes} épisodes."]}]'::jsonb;
