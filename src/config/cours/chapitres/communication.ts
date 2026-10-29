import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { communication as lireLaCampagne, grille, meilleurBudget, trimestreAuBudget, ventesPourPayer } from "../monde/economie-et-marketing";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : CE QUE RAPPORTE LA COMMUNICATION (Bac STMG, mercatique, palier 1).
 *
 * La publicité coûte tout de suite ; elle rapporte si elle fait vendre assez pour se payer. NOVA ne
 * fait pas de publicité ; une agence lui propose une campagne. Le chapitre lit ce que la campagne et
 * quatre autres budgets feraient vendre en un trimestre, calcule ce que coûte chaque vente gagnée et
 * ce que la campagne laisse une fois payée, cherche le meilleur budget, et explique pourquoi chaque
 * euro de plus rapporte de moins en moins. Puis l'expérience : un curseur (combien de ventes gagnées
 * paieraient la campagne ?) et un laboratoire (le budget qui laisse le meilleur résultat).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : un trimestre de l'année type du marché à trois
 * (monde/marche-a-trois.ts, monde/attractivite.ts), où la communication ajoute à l'image de NOVA ce
 * que dit la courbe de la fiche, et où SoundBox et Auris gardent leurs offres. HYPOTHÈSES DU
 * CHAPITRE : la campagne proposée, 4 000 € par trimestre ; les budgets essayés, de zéro au double.
 *
 * CE QUI A CHANGÉ. L'arène rejouait le premier trimestre à cinq budgets chez quatre entreprises ; le
 * chapitre se joue chez NOVA seule : la campagne de 4 000 € fait vendre 131 enceintes de plus, qui
 * laissent 2 751 € de marge. Elle ne se paie pas.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const COMMUNICATIONS: readonly string[] = ENTREPRISES_DU_MARCHE_DE_NOVA;

/** Les bornes du curseur (les ventes gagnées) et du laboratoire (le budget, par 1 000 €). */
const VENTES_DU_CURSEUR = { min: 0, max: 400 } as const;
const BUDGETS_DU_LABORATOIRE = { min: 0, max: 8_000, pas: 1_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const f = (c: Cas) => mercatiqueDe(c);

/** Les cinq budgets essayés, et ce que la campagne proposée rapporte. */
export const communication = (c: Cas) => lireLaCampagne(f(c));

/** Le budget du laboratoire : celui de la grille qui laisse le meilleur résultat du trimestre. */
export const budgetDuLaboratoire = (c: Cas) => meilleurBudget(f(c), grille(BUDGETS_DU_LABORATOIRE.min, BUDGETS_DU_LABORATOIRE.max, BUDGETS_DU_LABORATOIRE.pas));

export const COMMUNICATION: Chapitre = {
  code: "ce-que-rapporte-la-communication",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 3 · La communication de l'offre", "BUT TC · Communiquer l'offre commerciale"],
  titre: "Ce que rapporte la communication",
  accroche:
    "La publicité coûte tout de suite, et ne rapporte que si elle fait vendre assez. Combien coûte chaque vente gagnée, et jusqu'où vaut-il la peine de dépenser ?",
  objectifs: [
    "Mesurer les ventes qu'apporte une campagne",
    "Calculer le coût d'une vente gagnée par la communication",
    "Calculer ce que rapporte une campagne une fois payée",
    "Choisir un budget de communication",
    "Expliquer pourquoi chaque euro de plus rapporte de moins en moins",
  ],
  libre: false,
  entreprises: { codes: COMMUNICATIONS, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Cinq budgets pour un même trimestre",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const k = communication(c);
        return [
          `${c.entreprise} ne fait pas de publicité : ses clients la trouvent en ligne et par le bouche-à-oreille. Une agence lui propose une campagne de ${eur(k.jouee.budget)} par trimestre. Sur son marché, face à SoundBox et Auris, la publicité rend l'enceinte plus connue et plus attirante.`,
          "Le tableau dit ce que chaque budget ferait vendre en un trimestre, sans rien changer d'autre (ni le prix, ni la qualité, ni les concurrents), la marge que laissent ces ventes, et le résultat du trimestre une fois la publicité payée.",
        ];
      },
      tableau: (c) => {
        const k = communication(c);
        return {
          titre: "Un trimestre, à cinq budgets de communication",
          colonnes: k.budgets.map((b) => eur(b.budget)),
          lignes: [
            { libelle: `Ventes (${c.unites})`, valeurs: k.budgets.map((b) => qte(b.ventes)) },
            { libelle: "Marge sur les ventes", valeurs: k.budgets.map((b) => eur(b.marge)) },
            { libelle: "Résultat du trimestre", valeurs: k.budgets.map((b) => eur(b.resultat)) },
          ],
        };
      },
      repere: () => "Coût d'une vente gagnée = budget de communication ÷ ventes en plus. Une campagne rapporte si la marge en plus dépasse son budget.",
    },
    {
      id: "rentabilite",
      type: "montants",
      titre: "Ce que rapporte la campagne",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = communication(c);
        return `Comparez le trimestre sans communication et le trimestre avec la campagne de l'agence (${eur(k.jouee.budget)}). Calculez les ventes en plus, le coût de chaque vente gagnée, puis ce que la campagne laisse une fois payée (marge en plus moins budget, négatif si elle coûte plus qu'elle ne rapporte).`;
      },
      champs: (c) => {
        const k = communication(c);
        return [
          { libelle: "Ventes en plus", attendu: k.ventesEnPlus, calcul: `${qte(k.jouee.ventes)} − ${qte(k.sans.ventes)} = ${qte(k.ventesEnPlus)}` },
          { libelle: "Coût d'une vente gagnée", attendu: k.coutParVente, calcul: `${eur(k.jouee.budget)} ÷ ${qte(k.ventesEnPlus)} = ${eur(k.coutParVente)}` },
          { libelle: "Gain de la campagne", attendu: k.gain, calcul: `(${eur(k.jouee.marge)} − ${eur(k.sans.marge)}) − ${eur(k.jouee.budget)} = ${eur(k.gain)}` },
        ];
      },
      explication: (c) => {
        const k = communication(c);
        return [
          k.gain > 0
            ? `La campagne fait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} chacune en publicité ; leur marge paie la campagne et laisse ${eur(k.gain)} de plus.`
            : `La campagne fait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} chacune en publicité. Mais une enceinte ne laisse que ${eur(k.margeUnitaire)} de marge : la campagne coûte plus qu'elle ne rapporte, ${eur(-k.gain)} de perte.`,
        ];
      },
    },
    {
      id: "ce-qu-il-faudrait-vendre",
      type: "curseur",
      titre: "Ce qu'il faudrait vendre pour payer la campagne",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = communication(c);
        return `Chaque ${c.unite} vendue en plus laisse ${eur(k.margeUnitaire)} de marge. Faites varier les ventes que la campagne ferait gagner : une droite donne la marge qu'elles laissent, l'autre le budget de ${eur(k.jouee.budget)}. Placez le curseur sur le plus petit nombre de ventes gagnées qui paie la campagne, puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes gagnées dans le trimestre", unite: c.unites }),
      cible: (c) => ({ attendu: ventesPourPayer(f(c), communication(c).jouee.budget), ...VENTES_DU_CURSEUR }),
      zones: ["La campagne se paie", "La campagne coûte plus qu'elle ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu de ventes gagnées, la marge ne paie pas la campagne.",
        dessus: "Ces ventes paient la campagne, mais moins suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les ventes",
      lecture: (c, q) => {
        const k = communication(c);
        return [
          { libelle: "Marge des ventes gagnées", montant: q * k.margeUnitaire, fort: true },
          { libelle: "Budget de la campagne", montant: k.jouee.budget },
          { libelle: "Ce que la campagne laisse", montant: q * k.margeUnitaire - k.jouee.budget },
        ];
      },
      droites: (c) => {
        const k = communication(c);
        return { produit: (q) => q * k.margeUnitaire, cout: () => k.jouee.budget, libelles: ["Marge des ventes gagnées", "Budget de la campagne"] };
      },
      explication: (c) => {
        const k = communication(c);
        const q = ventesPourPayer(f(c), k.jouee.budget);
        return [
          `Il faudrait ${qte(q)} ventes gagnées : ${qte(q)} × ${eur(k.margeUnitaire)} = ${eur(q * k.margeUnitaire)}, assez pour payer ${eur(k.jouee.budget)}. La campagne n'en fait gagner que ${qte(k.ventesEnPlus)}.`,
          "Une campagne se juge sur la marge des ventes qu'elle apporte, jamais sur leur chiffre d'affaires.",
        ];
      },
    },
    {
      id: "meilleur-budget",
      type: "choix",
      titre: "Le meilleur budget",
      notions: ["customer_acquisition_cost"],
      question: (c) => `Parmi les cinq budgets, lequel donne à ${c.entreprise} le meilleur résultat du trimestre ?`,
      options: (c) => {
        const k = communication(c);
        return k.budgets.map((b) => ({
          texte: b.budget === 0 ? "Aucune campagne" : eur(b.budget),
          juste: b.facteur === k.meilleur.facteur,
          retour:
            b.facteur === k.meilleur.facteur
              ? `Oui : ${eur(b.resultat)} de résultat, le meilleur des cinq. ${b.budget === 0 ? "Ici, chaque euro de publicité rapporte moins qu'il ne coûte : ne pas communiquer est le meilleur choix." : "C'est le budget au-delà duquel un euro de plus ne se paie plus."}`
              : `Non : ${eur(b.resultat)} de résultat, contre ${eur(k.meilleur.resultat)} à ${eur(k.meilleur.budget)}.`,
        }));
      },
    },
    {
      id: "rendements",
      type: "choix",
      titre: "Pourquoi chaque euro rapporte moins",
      notions: ["customer_acquisition_cost", "capacity"],
      question: (c) => `D'un budget à l'autre, les ventes ${dE(c.entreprise)} montent de moins en moins. Pourquoi ?`,
      options: (c) => {
        const k = communication(c);
        return [
          {
            texte: "L'entreprise ne peut plus servir davantage de clients",
            juste: k.plafond,
            retour: k.plafond ? `Oui : aux deux plus gros budgets, les ventes ne bougent plus. ${c.entreprise} a atteint ce qu'elle peut servir.` : `Non : sa ligne pourrait servir bien plus ; au plus gros budget, elle vend encore ${qte(k.budgets.at(-1)!.ventes)} ${c.unites}, moins que ce qu'elle peut monter.`,
          },
          {
            texte: "Les clients les plus faciles à convaincre l'ont déjà été",
            juste: !k.plafond,
            retour: !k.plafond
              ? "Oui : la première publicité touche les clients prêts à acheter ; chaque euro de plus va chercher des clients plus difficiles, et en convainc moins. C'est ce qu'on appelle des rendements décroissants."
              : "Pas seulement : ici, l'entreprise ne peut plus servir davantage de clients.",
          },
          { texte: "La publicité finit par faire fuir les clients", juste: false, retour: "Non : les ventes ne baissent jamais quand le budget monte ; elles montent de moins en moins." },
        ];
      },
    },
    {
      id: "le-laboratoire-du-budget",
      type: "simulation",
      titre: "Le laboratoire du budget",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => `Faites varier le budget de communication du trimestre, par ${eur(BUDGETS_DU_LABORATOIRE.pas)}, en partant de la campagne de l'agence, ${eur(communication(c).jouee.budget)}. Le tableau donne les ventes, leur marge et le résultat du trimestre. Relevez le défi.`,
      leviers: (c) => [{ code: "budget", libelle: "Budget de communication du trimestre", unite: "€", ...BUDGETS_DU_LABORATOIRE, depart: communication(c).jouee.budget }],
      lecture: (c, p) => {
        const t = trimestreAuBudget(f(c), p.budget!);
        const d = trimestreAuBudget(f(c), communication(c).jouee.budget);
        return [
          { libelle: "Ventes du trimestre", montant: t.ventes, unite: c.unites, reference: d.ventes },
          { libelle: "Marge sur les ventes", montant: t.marge, reference: d.marge },
          { libelle: "Résultat du trimestre", montant: t.resultat, reference: d.resultat, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "budget",
        courbes: [
          { libelle: "Marge en plus des ventes gagnées", valeur: (p) => trimestreAuBudget(f(c), p.budget!).marge - communication(c).sans.marge },
          { libelle: "Budget de communication", valeur: (p) => p.budget! },
        ],
      }),
      defi: (c) => {
        const juste = budgetDuLaboratoire(c);
        return {
          consigne: "Trouvez le budget qui laisse le meilleur résultat du trimestre.",
          atteint: (p) => p.budget === juste.budget,
          indice: (p) => {
            const t = trimestreAuBudget(f(c), p.budget!);
            return `À ${eur(t.budget)}, le résultat est de ${eur(t.resultat)}. Comparez ce que le dernier palier de budget coûte et la marge des ventes qu'il ajoute.`;
          },
          solution: { budget: juste.budget },
        };
      },
      explication: (c, p) => {
        const t = trimestreAuBudget(f(c), p.budget!);
        const k = communication(c);
        return [
          `Défi relevé : à ${eur(t.budget)}, le trimestre laisse ${eur(t.resultat)}. ${t.budget === 0 ? `Même le premier palier de ${eur(BUDGETS_DU_LABORATOIRE.pas)} fait vendre trop peu : ses ventes gagnées laissent moins de marge qu'il ne coûte.` : "Au-delà, chaque euro ajouté rapporte moins qu'il ne coûte."}`,
          `Une campagne ne se paie que si une vente gagnée coûte moins que la marge qu'elle laisse : ici ${eur(k.margeUnitaire)} par ${c.unite}. Le bon budget peut être zéro.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const k = communication(c);
        return [
          `Chez ${c.entreprise}, la campagne de l'agence ferait vendre ${qte(k.ventesEnPlus)} ${c.unites} de plus, à ${eur(k.coutParVente)} chacune, et le meilleur des cinq budgets est ${eur(k.meilleur.budget)}.`,
          "Une campagne se juge sur ce qu'elle fait vendre en plus, pas sur ce qu'elle coûte seule ni sur les ventes totales. Et chaque euro de plus rapporte moins que le précédent : le bon budget est celui au-delà duquel un euro de publicité ne se paie plus.",
          "Une vraie campagne se suit aussi en personnes touchées, en clics, en coût pour mille contacts. Dans l'arène, faites varier votre budget marketing d'un tour à l'autre, et comptez ce que chaque vente gagnée vous a coûté.",
        ];
      },
      repere: () => "Une communication est rentable si la marge des ventes qu'elle apporte dépasse son coût.",
    },
  ],
};
