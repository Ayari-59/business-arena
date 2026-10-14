-- LE NOM QUE L'ENSEIGNANT DONNE À SA PARTIE.
--
-- La liste des parties affichait six fois « NOVA », avec la même icône et la
-- même allure : rien ne disait laquelle était celle de la seconde 3, laquelle
-- attendait une clôture, laquelle était finie. Le nom est facultatif — une
-- partie sans nom garde celui de son scénario — et ne sert qu'à la retrouver :
-- ni les élèves ni le classement ne le voient.
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "label" text;
