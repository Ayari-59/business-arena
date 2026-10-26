import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { tableauDeBord } from "../../tableau-de-bord";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD » : RÉGLER LE VOYANT DE SÉCURITÉ
 * (contrôle de gestion, palier 4).
 *
 * Le dirigeant veut un voyant pour l'an prochain : il doit s'allumer dès que l'indice de
 * sécurité de l'année passe sous un niveau qu'il fixe. Il demande sous quel chiffre
 * d'affaires annuel le voyant s'allumera. L'élève refait seul les calculs du chapitre, sur
 * l'année entière cette fois (taux de marge, seuil de rentabilité, indice de sécurité),
 * puis le chiffre d'affaires qui donne l'indice voulu, et rend sa réponse.
 *
 * Le cas est neuf par sa question : le chapitre lit les indicateurs trimestre par
 * trimestre ; ici, on les calcule pour l'année, et on règle le voyant sur un niveau
 * d'indice. Les quatre trimestres sont ceux du tableau de bord du chapitre
 * (`tableauDeBord`) ; le taux de marge et les charges fixes de l'année sont supposés
 * tenir l'an prochain.
 */

/**
 * Le niveau du voyant : un indice de sécurité de 15 %, la marge qu'un dirigeant prudent
 * garde pour encaisser une mauvaise saison sans passer sous le seuil.
 */
export const INDICE_DU_VOYANT = 0.15;

// « + 0 » : un arrondi à zéro ne s'écrit pas « -0,0 % ».
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const pct = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
/** Le niveau du voyant, sans décimale inutile : « 15 % ». */
const niveau = () => `${(INDICE_DU_VOYANT * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function reglerLeVoyant(c: Cas) {
  const t = tableauDeBord(c.code);
  const chiffreDAffaires = t.reduce((s, x) => s + x.chiffreDAffaires, 0);
  const marge = t.reduce((s, x) => s + x.marge, 0);
  const chargesFixes = t.reduce((s, x) => s + x.chargesFixes, 0);
  const tauxDeMarge = auDixieme((marge / chiffreDAffaires) * 100);
  // Comme au chapitre : le seuil sur les montants que l'élève lit, charges fixes ÷ taux de marge.
  const seuil = Math.round((chargesFixes * chiffreDAffaires) / marge);
  const indiceDeSecurite = auDixieme(((chiffreDAffaires - seuil) / chiffreDAffaires) * 100);
  // Le chiffre d'affaires dont l'indice vaut le niveau du voyant : (CA − seuil) ÷ CA = niveau.
  const cible = Math.round(seuil / (1 - INDICE_DU_VOYANT));
  return {
    trimestres: t,
    chiffreDAffaires,
    marge,
    chargesFixes,
    tauxDeMarge,
    seuil,
    indiceDeSecurite,
    moyenneDesIndices: auDixieme(t.reduce((s, x) => s + x.indiceDeSecurite, 0) / t.length),
    cible,
    parTrimestre: Math.round(cible / t.length),
    allume: chiffreDAffaires < cible,
    // Les erreurs classiques : majorer le seuil du niveau voulu, ou retirer ce niveau au chiffre d'affaires de l'année.
    seuilMajore: Math.round(seuil * (1 + INDICE_DU_VOYANT)),
    chiffreMinore: Math.round(chiffreDAffaires * (1 - INDICE_DU_VOYANT)),
    // Le taux de marge au dixième que l'élève emploie déplace le seuil d'environ un millième.
    toleranceDuSeuil: Math.max(2, Math.round(seuil * 0.003)),
    toleranceDeLaCible: Math.max(2, Math.round((seuil / (1 - INDICE_DU_VOYANT)) * 0.003)),
  };
}

export const REGLER_LE_VOYANT: Situation = {
  code: "regler-le-voyant",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord"],
  commanditaire: "Le dirigeant",
  titre: "Régler le voyant de sécurité",
  accroche:
    "Le dirigeant veut un voyant qui s'allume quand l'indice de sécurité de l'année passe sous le niveau qu'il fixe. Sous quel chiffre d'affaires s'allumera-t-il ?",
  objectifs: [
    "Calculer les indicateurs d'une année à partir de ses quatre trimestres",
    "Calculer le seuil de rentabilité et l'indice de sécurité de l'année",
    "Calculer le chiffre d'affaires qui donne un indice de sécurité voulu",
    "Rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => [
        `« Pour l'an prochain, je veux un voyant de plus au tableau de bord de ${c.entreprise} : il s'allume dès que l'indice de sécurité de l'année passe sous ${niveau()}. Avec le taux de marge et les charges fixes de cette année, sous quel chiffre d'affaires annuel s'allumera-t-il ? »`,
        "Pas de cours cette fois : vous avez les quatre trimestres de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = reglerLeVoyant(c);
        const ligne = (libelle: string, f: (x: (typeof r.trimestres)[number]) => string) => ({ libelle, valeurs: r.trimestres.map(f) });
        return {
          titre: `L'année trimestre par trimestre · ${c.entreprise}`,
          colonnes: TRIMESTRES.slice(0, r.trimestres.length),
          lignes: [
            ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
            ligne("Marge sur coût variable", (x) => eur(x.marge)),
            ligne("Charges fixes", (x) => eur(x.chargesFixes)),
            ligne("Indice de sécurité du trimestre", (x) => pct(x.indiceDeSecurite)),
          ],
        };
      },
      repere: () =>
        `À rendre : le taux de marge, le seuil et l'indice de sécurité de l'année, le chiffre d'affaires qui donne un indice de ${niveau()}, et votre réponse.`,
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Les indicateurs de l'année",
      notions: ["margin_rates", "breakeven", "safety_margin"],
      question: () =>
        "Additionnez les quatre trimestres. Calculez le chiffre d'affaires de l'année, son taux de marge sur coût variable (en %, au dixième), le seuil de rentabilité de l'année, puis l'indice de sécurité de l'année (en %, au dixième, négatif sous le seuil).",
      champs: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            libelle: "Chiffre d'affaires de l'année",
            attendu: r.chiffreDAffaires,
            tolerance: 1,
            calcul: `${r.trimestres.map((x) => eur(x.chiffreDAffaires)).join(" + ")} = ${eur(r.chiffreDAffaires)}`,
          },
          {
            libelle: "Taux de marge sur coût variable de l'année (%)",
            attendu: r.tauxDeMarge,
            tolerance: 0.1,
            calcul: `${eur(r.marge)} ÷ ${eur(r.chiffreDAffaires)} = ${pct(r.tauxDeMarge)}`,
          },
          {
            libelle: "Seuil de rentabilité de l'année",
            attendu: r.seuil,
            tolerance: r.toleranceDuSeuil,
            calcul: `${eur(r.chargesFixes)} ÷ ${pct(r.tauxDeMarge)} ≈ ${eur(r.seuil)}`,
          },
          {
            libelle: "Indice de sécurité de l'année (%)",
            attendu: r.indiceDeSecurite,
            tolerance: 0.2,
            calcul: `(${eur(r.chiffreDAffaires)} − ${eur(r.seuil)}) ÷ ${eur(r.chiffreDAffaires)} = ${pct(r.indiceDeSecurite)}`,
          },
        ];
      },
      explication: (c) => {
        const r = reglerLeVoyant(c);
        return [
          r.indiceDeSecurite >= 0
            ? `Sur l'année, ${c.entreprise} est au-dessus de son seuil : son chiffre d'affaires pourrait baisser de ${pct(r.indiceDeSecurite)} avant qu'elle ne perde de l'argent.`
            : `Sur l'année, ${c.entreprise} est sous son seuil : il lui aurait fallu ${pct(-r.indiceDeSecurite)} de chiffre d'affaires en plus pour ne pas perdre d'argent.`,
          `L'indice de l'année n'est pas la moyenne des quatre indices du tableau (${pct(r.moyenneDesIndices)}) : il se calcule sur les montants de l'année, où les gros trimestres pèsent plus que les petits.`,
        ];
      },
    },
    {
      id: "le-voyant",
      type: "montants",
      titre: "Le niveau du voyant",
      notions: ["safety_margin", "dashboard"],
      question: () =>
        `L'indice de sécurité vaut (chiffre d'affaires − seuil) ÷ chiffre d'affaires. Le seuil de l'année ne bouge pas. Pour quel chiffre d'affaires annuel l'indice vaut-il exactement ${niveau()} ? Combien cela fait-il par trimestre, en moyenne ?`,
      champs: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            libelle: `Chiffre d'affaires annuel pour un indice de ${niveau()}`,
            attendu: r.cible,
            tolerance: r.toleranceDeLaCible,
            calcul: `${eur(r.seuil)} ÷ (1 − ${niveau()}) ≈ ${eur(r.cible)}`,
          },
          {
            libelle: "Par trimestre, en moyenne",
            attendu: r.parTrimestre,
            tolerance: Math.ceil(r.toleranceDeLaCible / r.trimestres.length) + 1,
            calcul: `${eur(r.cible)} ÷ ${r.trimestres.length} ≈ ${eur(r.parTrimestre)}`,
          },
        ];
      },
      explication: (c) => {
        const r = reglerLeVoyant(c);
        return [
          r.allume
            ? `Avec ${eur(r.chiffreDAffaires)} cette année, le voyant serait déjà allumé : il manquerait ${eur(r.cible - r.chiffreDAffaires)} de chiffre d'affaires pour l'éteindre.`
            : `Avec ${eur(r.chiffreDAffaires)} cette année, le voyant resterait éteint : le chiffre d'affaires pourrait baisser de ${eur(r.chiffreDAffaires - r.cible)} avant qu'il ne s'allume.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            texte: `Le voyant s'allumera sous ${eur(r.cible)} de chiffre d'affaires annuel`,
            juste: true,
            retour: `Oui : à ${eur(r.cible)}, la marge de sécurité, ${eur(r.cible)} − ${eur(r.seuil)} = ${eur(r.cible - r.seuil)}, fait ${niveau()} du chiffre d'affaires. Le seuil se divise par (1 − ${niveau()}), parce que l'indice se rapporte au chiffre d'affaires, pas au seuil.`,
          },
          {
            texte: `Le voyant s'allumera sous ${eur(r.seuilMajore)} de chiffre d'affaires annuel, le seuil majoré de ${niveau()}`,
            juste: false,
            retour: `Non : à ${eur(r.seuilMajore)}, la marge de sécurité ferait ${niveau()} du seuil, mais seulement ${pct(auDixieme((1 - 1 / (1 + INDICE_DU_VOYANT)) * 100))} du chiffre d'affaires. L'indice se rapporte au chiffre d'affaires.`,
          },
          {
            texte: `Le voyant s'allumera sous ${eur(r.chiffreMinore)} de chiffre d'affaires annuel, ${niveau()} de moins que cette année`,
            juste: false,
            retour: `Non : le voyant dépend du seuil, ${eur(r.seuil)}, pas du chiffre d'affaires de cette année. Retirer ${niveau()} à ${eur(r.chiffreDAffaires)} ne dit rien de l'indice de sécurité.`,
          },
        ];
      },
    },
  ],
};
