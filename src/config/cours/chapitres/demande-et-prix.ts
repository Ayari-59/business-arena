import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { coutVariable, demandeEtPrix as lireLaDemande, grille, meilleurPrix, prixDeNova, trimestreAuPrix } from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA DEMANDE RÉPOND AU PRIX (Bac STMG, mercatique, palier 1).
 *
 * Quand le prix monte, la demande baisse : de combien ? L'élasticité de la demande au prix le dit en
 * un nombre. Le chapitre la calcule sur le premier trimestre de NOVA, à un prix plus bas et à un prix
 * plus haut, dit si la demande est élastique, et en tire ce qu'une hausse de prix fait au chiffre
 * d'affaires. Puis l'expérience, sur la marge : un curseur (jusqu'où monter le prix sans perdre de
 * marge ?) et un laboratoire (le prix, à l'euro, qui en laisse le plus).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/economie-et-marketing.ts) : la droite de demande du
 * trimestre de nova-gestion.ts (16 755 − 203 × prix, à l'enceinte inférieure), l'écart de prix de
 * 10 %, le prix de 59 €, le coût variable de 38 €, la ligne de 7 000 enceintes par trimestre.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le premier trimestre rejoué par l'arène chez toutes les
 * entreprises ; il se joue chez NOVA seule, sur la droite de la fiche : 5 975, 4 778 et 3 580
 * enceintes demandées à 53,10 €, 59 € et 64,90 €, une élasticité de −2,51.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_DEMANDE: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** Les bornes du curseur et du laboratoire : le prix, à l'euro. */
const PRIX_DU_CURSEUR = { min: 59, max: 75 } as const;
const PRIX_DU_LABORATOIRE = { min: 54, max: 70, pas: 1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

const f = (c: Cas) => mercatiqueDe(c);

/** La demande aux trois prix, et ce qu'en dit l'élasticité. */
export const demandeEtPrix = (c: Cas) => lireLaDemande(f(c));

/** Le prix le plus haut, à l'euro, qui laisse au moins la marge du trimestre au prix de NOVA. */
export function prixLePlusHautSansPerte(c: Cas) {
  const aujourdhui = trimestreAuPrix(f(c), prixDeNova(f(c))).marge;
  let p = prixDeNova(f(c));
  while (trimestreAuPrix(f(c), p + 1).marge >= aujourdhui - 1e-9) p++;
  return p;
}

/** Le prix du laboratoire : celui de la grille qui laisse la plus grande marge. */
export const prixDuLaboratoire = (c: Cas) => meilleurPrix(f(c), grille(PRIX_DU_LABORATOIRE.min, PRIX_DU_LABORATOIRE.max, PRIX_DU_LABORATOIRE.pas));

export const DEMANDE_ET_PRIX: Chapitre = {
  code: "demande-et-prix",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre", "2de SES · Comment se forment les prix sur un marché ?", "BUT TC · Conduire les actions marketing"],
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
  entreprises: { codes: ENTREPRISES_DE_LA_DEMANDE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois prix pour un même trimestre",
      notions: ["price_elasticity"],
      texte: (c) => {
        const d = demandeEtPrix(c);
        return [
          `${c.entreprise} vend son enceinte ${eur(d.base.prix)}. Qu'auraient demandé ses clients, au premier trimestre, ${qte(d.ecart)} % moins cher, ou ${qte(d.ecart)} % plus cher ? Seul le prix change ; la qualité, la publicité et les concurrents restent les mêmes.`,
          `Le tableau donne la demande à chaque prix, en ${c.unites} : ce que les clients voulaient acheter, que l'entreprise ait pu les servir ou non.`,
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
        return [`Une élasticité de ${qte(d.elasticite)} : quand le prix monte de 1 %, la demande baisse d'environ ${qte(Math.abs(d.elasticite))} %. Elle est négative parce que prix et demande vont en sens contraire.`];
      },
    },
    {
      id: "elastique",
      type: "choix",
      titre: "Élastique ou peu élastique",
      notions: ["price_elasticity"],
      question: (c) => `Avec une élasticité de ${qte(demandeEtPrix(c).elasticite)}, comment qualifier la demande adressée à ${c.entreprise} ?`,
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
              ? `Oui : ${qte(d.elasticite)}, moins de 1 en valeur absolue.`
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
            : `Le chiffre d'affaires baisse de ${pct(Math.abs(d.variationCa))} : chaque vente rapporte plus, mais il y en a trop de moins. C'est ce que fait une hausse de prix quand la demande est élastique.`,
        ];
      },
    },
    {
      id: "baisser",
      type: "choix",
      titre: "Et si l'on baissait le prix ?",
      notions: ["price_elasticity"],
      question: (c) => `Au prix ${qte(demandeEtPrix(c).ecart)} % moins cher, la demande monte de ${pct(demandeEtPrix(c).gagneDemandeEnBaissant)}. Une baisse de prix est-elle une bonne idée pour ${c.entreprise} ?`,
      options: (c) => {
        const d = demandeEtPrix(c);
        return [
          {
            texte: "Seulement si l'entreprise peut servir les clients en plus, et que chaque vente reste rentable",
            juste: true,
            retour: `Oui : ${pct(d.gagneDemandeEnBaissant)} de demande en plus ne rapporte que si l'entreprise peut produire ces enceintes, et si le prix baissé couvre encore ses coûts. Sinon, elle vend la même chose moins cher.`,
          },
          { texte: "Toujours : plus de demande, c'est toujours plus de chiffre d'affaires", juste: false, retour: "Non : une demande qu'on ne peut pas servir ne rapporte rien, et chaque vente rapporte moins. Une baisse de prix se décide en regardant la capacité et les coûts, pas seulement la demande." },
          { texte: "Jamais : baisser son prix fait toujours perdre de l'argent", juste: false, retour: `Non : quand la demande est élastique et que l'entreprise peut servir les clients en plus, une baisse peut faire monter le chiffre d'affaires. Ici, elle apporterait ${pct(d.gagneDemandeEnBaissant)} de demande.` },
        ];
      },
    },
    {
      id: "jusqu-ou-monter",
      type: "curseur",
      titre: "Jusqu'où monter sans perdre de marge",
      notions: ["price_elasticity", "contribution_margin"],
      question: (c) => {
        const t = trimestreAuPrix(f(c), prixDeNova(f(c)));
        return `La hausse fait baisser le chiffre d'affaires ; mais elle fait aussi fabriquer moins, et chaque enceinte coûte ${eur(coutVariable(f(c)))}. À ${eur(t.prix)}, le trimestre laisse ${eur(t.marge)} de marge sur coût variable, si toute la demande est servie. Faites varier le prix, à l'euro : une courbe donne la marge du trimestre à ce prix, l'autre celle d'aujourd'hui. Placez le curseur sur le prix le plus haut qui garde au moins la marge d'aujourd'hui, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de l'enceinte", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prixLePlusHautSansPerte(c), ...PRIX_DU_CURSEUR }),
      zones: ["La marge est gardée", "La marge baisse"],
      rates: () => ({
        dessous: "À ce prix, la marge est gardée, mais un prix plus haut la garderait encore : cherchez le plus haut.",
        dessus: "À ce prix, les clients perdus coûtent plus que ce que chaque vente rapporte de plus : la marge baisse.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, q) => {
        const t = trimestreAuPrix(f(c), q);
        return [
          { libelle: "Chiffre d'affaires du trimestre", montant: t.chiffreDAffaires },
          { libelle: "Marge du trimestre à ce prix", montant: t.marge, fort: true },
          { libelle: "Marge du trimestre aujourd'hui", montant: trimestreAuPrix(f(c), prixDeNova(f(c))).marge },
        ];
      },
      droites: (c) => ({ produit: (q) => trimestreAuPrix(f(c), q).marge, cout: () => trimestreAuPrix(f(c), prixDeNova(f(c))).marge, libelles: ["Marge à ce prix", "Marge d'aujourd'hui"] }),
      explication: (c) => {
        const p = prixLePlusHautSansPerte(c);
        const a = trimestreAuPrix(f(c), p);
        const b = trimestreAuPrix(f(c), p + 1);
        return [
          `À ${eur(p)}, ${qte(a.demande)} ${c.unites} laissent ${eur(a.marge)} de marge, au moins autant qu'aujourd'hui, pour un chiffre d'affaires plus bas. À ${eur(p + 1)}, ${qte(b.demande)} ${c.unites} ne laissent que ${eur(b.marge)}.`,
          "Une demande élastique fait baisser le chiffre d'affaires quand le prix monte ; la marge, elle, peut tenir, parce que chaque vente perdue est aussi un coût évité.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-prix",
      type: "simulation",
      titre: "Le laboratoire du prix",
      notions: ["price_elasticity", "contribution_margin"],
      question: (c) => `Faites varier le prix de l'enceinte, à l'euro. Le tableau donne la demande du trimestre, servie dans la limite de la ligne, son chiffre d'affaires et sa marge sur coût variable (le prix moins ${eur(coutVariable(f(c)))}, fois les ventes). Relevez le défi.`,
      leviers: (c) => [{ code: "prix", libelle: "Prix de l'enceinte", unite: "€", ...PRIX_DU_LABORATOIRE, depart: prixDeNova(f(c)) }],
      lecture: (c, p) => {
        const t = trimestreAuPrix(f(c), p.prix!);
        const d = trimestreAuPrix(f(c), prixDeNova(f(c)));
        return [
          { libelle: "Ventes du trimestre", montant: t.ventes, unite: c.unites, reference: d.ventes },
          { libelle: "Chiffre d'affaires", montant: t.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Marge sur coût variable", montant: t.marge, reference: d.marge, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "prix",
        courbes: [
          { libelle: "Chiffre d'affaires", valeur: (p) => trimestreAuPrix(f(c), p.prix!).chiffreDAffaires },
          { libelle: "Marge sur coût variable", valeur: (p) => trimestreAuPrix(f(c), p.prix!).marge },
        ],
      }),
      defi: (c) => {
        const juste = prixDuLaboratoire(c);
        return {
          consigne: "Trouvez le prix, à l'euro, qui laisse la plus grande marge sur coût variable au trimestre.",
          atteint: (p) => p.prix === juste.prix,
          indice: (p) => {
            const t = trimestreAuPrix(f(c), p.prix!);
            return trimestreAuPrix(f(c), p.prix! + 1).marge > t.marge
              ? `À ${eur(t.prix)}, la marge est de ${eur(t.marge)} : un euro de plus en laisserait davantage.`
              : `À ${eur(t.prix)}, la marge est de ${eur(t.marge)} : un euro de moins en laisserait-il davantage ?`;
          },
          solution: { prix: juste.prix },
        };
      },
      explication: (c, p) => {
        const t = trimestreAuPrix(f(c), p.prix!);
        const d = trimestreAuPrix(f(c), prixDeNova(f(c)));
        return [
          `Défi relevé : à ${eur(t.prix)}, ${qte(t.ventes)} ${c.unites} laissent ${eur(t.marge)} de marge, ${eur(t.marge - d.marge)} de plus qu'à ${eur(d.prix)}, pour un chiffre d'affaires de ${eur(t.chiffreDAffaires)} au lieu de ${eur(d.chiffreDAffaires)}.`,
          "Le prix qui fait le plus de chiffre d'affaires n'est pas celui qui laisse le plus de marge : le mercaticien regarde les deux.",
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
          `Avant de toucher à un prix, le mercaticien regarde donc l'élasticité, puis la marge : une demande élastique pousse à la prudence sur les hausses, mais le prix qui laisse le plus de marge à ${c.entreprise} n'est pas forcément le plus bas. Dans l'arène, montez votre prix d'un tour à l'autre et calculez votre élasticité.`,
        ];
      },
      repere: () => "Pour une petite variation de prix : élasticité inférieure à −1, demande élastique, une hausse de prix fait baisser le chiffre d'affaires ; entre −1 et 0, demande peu élastique, une hausse le fait monter.",
    },
  ],
};
