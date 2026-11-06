import { auCentime } from "./amortissement";
import { affectationDeNova, augmentation } from "./capitaux-propres";

/**
 * LE MONDE DU BUREAU « L'ASSEMBLÉE DE JUIN » (la suite du chapitre « Les capitaux propres : constituer,
 * augmenter, affecter »).
 *
 * Tout vient du monde du chapitre (capitaux-propres.ts) : l'affectation du bénéfice de N, la version
 * unique du cours ; l'augmentation de capital du 30 juin N+1 ; ses frais, au montant donné, que le
 * chapitre présentait en variante et que le bureau retient (HYPOTHÈSE DU BUREAU : l'assemblée décide de
 * les imputer sur la prime). La proposition de l'actionnaire est celle du cas « Un dividende plus gros »,
 * que l'assemblée n'a pas suivie. Ce module ne fait qu'enchaîner : les capitaux propres après les deux
 * opérations et les frais, et ce que la banque a vu passer.
 * La garde tests/cours/bureau-l-assemblee-de-juin.test.ts refait chaque chiffre à la main.
 */

/** L'assemblée et l'augmentation, enchaînées. */
export function assembleeDeJuin() {
  const x = affectationDeNova();
  const a = augmentation();
  const sorties = auCentime(a.frais.paye + x.dividendes);
  return {
    /** Les capitaux propres après répartition, l'augmentation, puis les frais imputés sur la prime. */
    capitauxPropres: auCentime(a.capitauxPropresApres - a.frais.honoraires),
    sorties,
    tresorerie: auCentime(a.fonds - sorties),
  };
}
