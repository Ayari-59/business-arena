-- IPG (indice de performance globale, version 3) : la responsabilité
-- sociétale entre dans l'indice, à la place de la rentabilité (doublon de la
-- performance économique). Migration rétro-compatible : nouvelle valeur
-- d'enum ; les tours déjà scorés gardent leur dimension « profitability ».
ALTER TYPE "score_dimension" ADD VALUE IF NOT EXISTS 'rse';
