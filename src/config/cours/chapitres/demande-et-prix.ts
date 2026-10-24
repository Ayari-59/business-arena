import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ECART_DE_PRIX, prixRejoues } from "../decision";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA DEMANDE RÉPOND AU PRIX (Bac STMG, mercatique, palier 1).
 *
 * Quand le prix monte, la demande baisse : de combien ? L'élasticité de la demande au prix le
 * dit en un nombre. Le chapitre la calcule sur le premier trimestre de l'arène, rejoué à un prix
 * plus bas et à un prix plus haut, dit si la demande est élastique, et en tire ce qu'une hausse
 * de prix fait au chiffre d'affaires que la demande apporterait.
 *
 * La demande est celle que le marché adresse à l'entreprise dans chaque trimestre rejoué (les
 * ventes, et celles que l'entreprise n'a pas pu servir) ; l'écart de prix est celui que l'arène
 * rejoue (`decision.ts`). Aucune hypothèse n'est ajoutée.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La demande aux trois prix rejoués, et ce qu'en dit l'élasticité. */
export function demandeEtPrix(c: Cas) {
  const [bas, base, haut] = prixRejoues(c.code).map((v) => ({ prix: v.prix, demande: v.quantite + v.perdues }));
  const variationDemande = auDixieme((haut!.demande / base!.demande - 1) * 100);
  const variationPrix = auDixieme((haut!.prix / base!.prix - 1) * 100);
  const elasticite = auCentieme(variationDemande / variationPrix);
  const caAvant = Math.round(base!.demande * base!.prix);
  const caApres = Math.round(haut!.demande * haut!.prix);
  return {
    bas: bas!,
    base: base!,
    haut: haut!,
    ecart: Math.round(ECART_DE_PRIX * 100),
    variationDemande,
    variationPrix,
    elasticite,
    elastique: Math.abs(elasticite) > 1,
    caAvant,
    caApres,
    variationCa: auDixieme((caApres / caAvant - 1) * 100),
    gagneDemandeEnBaissant: auDixieme((bas!.demande / base!.demande - 1) * 100),
  };
}

export const DEMANDE_ET_PRIX: Chapitre = {
  code: "demande-et-prix",
  parcours: "stmg",
  palier: 1,
  titre: "La demande répond au prix",
  accroche:
    "Quand le prix monte, la demande baisse. De combien ? L'élasticité le dit en un nombre, et dit si une hausse de prix fera gagner ou perdre du chiffre d'affaires.",
  objectifs: [
    "Calculer un taux de variation de la demande et du prix",
    "Calculer l'élasticité de la demande au prix",
    "Dire si une demande est élastique ou peu élastique",
    "Prévoir l'effet d'une hausse de prix sur le chiffre d'affaires",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois prix pour un même trimestre",
      notions: ["price_elasticity"],
      texte: (c) => {
        const d = demandeEtPrix(c);
        return [
          `L'arène a rejoué le premier trimestre ${dE(c.entreprise)} trois fois : au prix pratiqué, ${qte(d.ecart)} % moins cher, et ${qte(d.ecart)} % plus cher. Seul le prix change ; la qualité, la publicité et les concurrents restent les mêmes.`,
          `Le tableau donne la demande que le marché lui a adressée à chaque prix, en ${c.unites} : ce que les clients voulaient acheter, que l'entreprise ait pu les servir ou non.`,
        ];
      },
      tableau: (c) => {
        const d = demandeEtPrix(c);
        return {
          titre: "La demande aux trois prix",
          colonnes: [`${qte(d.ecart)} % moins cher`, "Prix pratiqué", `${qte(d.ecart)} % plus cher`],
          lignes: [
            { libelle: "Prix", valeurs: [eur(d.bas.prix), eur(d.base.prix), eur(d.haut.prix)] },
            { libelle: `Demande (${c.unites})`, valeurs: [qte(d.bas.demande), qte(d.base.demande), qte(d.haut.demande)] },
          ],
        };
      },
      repere: () => "Élasticité de la demande au prix = taux de variation de la demande ÷ taux de variation du prix.",
    },
    {
      id: "elasticite",
      type: "montants",
      titre: "L'élasticité de la demande",
      notions: ["price_elasticity"],
      question: (c) => {
        const d = demandeEtPrix(c);
        return `Du prix pratiqué (${eur(d.base.prix)}) au prix ${qte(d.ecart)} % plus cher (${eur(d.haut.prix)}), la demande passe de ${qte(d.base.demande)} à ${qte(d.haut.demande)}. Calculez le taux de variation du prix et celui de la demande, en pourcentage au dixième, puis l'élasticité de la demande au prix, au centième.`;
      },
      champs: (c) => {
        const d = demandeEtPrix(c);
        return [
          { libelle: "Variation du prix (%)", attendu: d.variationPrix, calcul: `(${eur(d.haut.prix)} ÷ ${eur(d.base.prix)} − 1) × 100 = ${pct(d.variationPrix)}`, tolerance: 0.1 },
          { libelle: "Variation de la demande (%)", attendu: d.variationDemande, calcul: `(${qte(d.haut.demande)} ÷ ${qte(d.base.demande)} − 1) × 100 = ${pct(d.variationDemande)}`, tolerance: 0.1 },
          { libelle: "Élasticité", attendu: d.elasticite, calcul: `${qte(d.variationDemande)} ÷ ${qte(d.variationPrix)} = ${qte(d.elasticite)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const d = demandeEtPrix(c);
        return [
          `Une élasticité de ${qte(d.elasticite)} : quand le prix monte de 1 %, la demande baisse d'environ ${qte(Math.abs(d.elasticite))} %. Elle est négative parce que prix et demande vont en sens contraire.`,
        ];
      },
    },
    {
      id: "elastique",
      type: "choix",
      titre: "Élastique ou peu élastique",
      notions: ["price_elasticity"],
      question: (c) => {
        const d = demandeEtPrix(c);
        return `Avec une élasticité de ${qte(d.elasticite)}, comment qualifier la demande adressée à ${c.entreprise} ?`;
      },
      options: (c) => {
        const d = demandeEtPrix(c);
        return [
          {
            texte: "Élastique : elle baisse plus que le prix ne monte",
            juste: d.elastique,
            retour: d.elastique
              ? `Oui : ${qte(d.elasticite)}, au-delà de 1 en valeur absolue. Une hausse de ${pct(d.variationPrix)} fait perdre ${pct(Math.abs(d.variationDemande))} de la demande : les clients comparent, et partent vite quand le prix monte.`
              : `Non : ${qte(d.elasticite)}, moins de 1 en valeur absolue. La demande baisse moins que le prix ne monte.`,
          },
          {
            texte: "Peu élastique : elle baisse moins que le prix ne monte",
            juste: !d.elastique,
            retour: !d.elastique
              ? `Oui : ${qte(d.elasticite)}, moins de 1 en valeur absolue. Une hausse de ${pct(d.variationPrix)} ne fait perdre que ${pct(Math.abs(d.variationDemande))} de la demande : les clients tiennent à l'offre, et acceptent de payer plus.`
              : `Non : ${qte(d.elasticite)}, au-delà de 1 en valeur absolue. La demande baisse plus que le prix ne monte.`,
          },
          {
            texte: "Elle ne réagit pas au prix",
            juste: false,
            retour: `Non : la demande passe de ${qte(d.base.demande)} à ${qte(d.haut.demande)} quand le prix monte de ${pct(d.variationPrix)}. Elle réagit, plus ou moins fort selon les clients.`,
          },
        ];
      },
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "Ce que la hausse fait au chiffre d'affaires",
      notions: ["price_elasticity", "revenue"],
      question: (c) => {
        const d = demandeEtPrix(c);
        return `Si ${c.entreprise} servait toute la demande, quel chiffre d'affaires ferait-elle au prix pratiqué (${qte(d.base.demande)} × ${eur(d.base.prix)}), puis au prix ${qte(d.ecart)} % plus cher (${qte(d.haut.demande)} × ${eur(d.haut.prix)}) ? Calculez ensuite la variation, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const d = demandeEtPrix(c);
        return [
          { libelle: "Chiffre d'affaires au prix pratiqué", attendu: d.caAvant, calcul: `${qte(d.base.demande)} × ${eur(d.base.prix)} = ${eur(d.caAvant)}`, tolerance: 2 },
          { libelle: "Chiffre d'affaires au prix plus cher", attendu: d.caApres, calcul: `${qte(d.haut.demande)} × ${eur(d.haut.prix)} = ${eur(d.caApres)}`, tolerance: 2 },
          { libelle: "Variation du chiffre d'affaires (%)", attendu: d.variationCa, calcul: `(${eur(d.caApres)} ÷ ${eur(d.caAvant)} − 1) × 100 = ${pct(d.variationCa)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const d = demandeEtPrix(c);
        return [
          d.variationCa >= 0
            ? `Le chiffre d'affaires monte de ${pct(d.variationCa)} : il y a moins de ventes, mais chacune rapporte assez de plus pour compenser. C'est ce que fait une hausse de prix quand la demande est peu élastique.`
            : d.elastique
              ? `Le chiffre d'affaires baisse de ${pct(Math.abs(d.variationCa))} : chaque vente rapporte plus, mais il y en a trop de moins. C'est ce que fait une hausse de prix quand la demande est élastique.`
              : `Le chiffre d'affaires baisse à peine, de ${pct(Math.abs(d.variationCa))} : la demande est peu élastique, mais tout juste. Sur une hausse de ${pct(d.variationPrix)}, les ventes perdues compensent presque exactement ce que chaque vente rapporte de plus. La règle de l'élasticité vaut pour de petites variations de prix ; sur une grande, il faut refaire le calcul.`,
        ];
      },
    },
    {
      id: "baisser",
      type: "choix",
      titre: "Et si l'on baissait le prix ?",
      notions: ["price_elasticity"],
      question: (c) => {
        const d = demandeEtPrix(c);
        return `Au prix ${qte(d.ecart)} % moins cher, la demande monte de ${pct(d.gagneDemandeEnBaissant)}. Une baisse de prix est-elle une bonne idée pour ${c.entreprise} ?`;
      },
      options: (c) => {
        const d = demandeEtPrix(c);
        return [
          {
            texte: "Seulement si l'entreprise peut servir les clients en plus, et que chaque vente reste rentable",
            juste: true,
            retour: `Oui : ${pct(d.gagneDemandeEnBaissant)} de demande en plus ne rapporte que si l'entreprise peut produire ou accueillir ces clients, et si le prix baissé couvre encore ses coûts. Sinon, elle vend la même chose moins cher.`,
          },
          {
            texte: "Toujours : plus de demande, c'est toujours plus de chiffre d'affaires",
            juste: false,
            retour: "Non : une demande qu'on ne peut pas servir ne rapporte rien, et chaque vente rapporte moins. Une baisse de prix se décide en regardant la capacité et les coûts, pas seulement la demande.",
          },
          {
            texte: "Jamais : baisser son prix fait toujours perdre de l'argent",
            juste: false,
            retour: `Non : quand la demande est élastique et que l'entreprise peut servir les clients en plus, une baisse peut faire monter le chiffre d'affaires. Ici, elle apporterait ${pct(d.gagneDemandeEnBaissant)} de demande.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["price_elasticity"],
      texte: (c) => {
        const d = demandeEtPrix(c);
        return [
          `Chez ${c.entreprise}, l'élasticité de la demande au prix vaut ${qte(d.elasticite)} : la demande est ${d.elastique ? "élastique" : "peu élastique"}, et une hausse de ${pct(d.variationPrix)} ${d.variationCa < 0 ? "ferait baisser" : "ferait monter"} de ${pct(Math.abs(d.variationCa))} le chiffre d'affaires que la demande apporterait.`,
          "Avant de toucher à un prix, le mercaticien regarde donc l'élasticité : une demande élastique pousse à la prudence sur les hausses, une demande peu élastique laisse de la marge pour monter.",
        ];
      },
      repere: () => "Pour une petite variation de prix : élasticité inférieure à −1, demande élastique, une hausse de prix fait baisser le chiffre d'affaires ; entre −1 et 0, demande peu élastique, une hausse le fait monter.",
    },
  ],
};
