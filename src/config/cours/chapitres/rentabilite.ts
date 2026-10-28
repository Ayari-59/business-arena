import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, bilanDuLycee, compteDuLycee, exerciceDe } from "../monde/comptes-du-lycee";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA RENTABILITÉ (Bac STMG, gestion et finance, palier 1).
 *
 * Un bénéfice ne dit rien seul : 50 000 € sont beaucoup pour 100 000 € engagés, peu pour dix
 * millions. La rentabilité rapporte ce que l'entreprise gagne à l'argent engagé pour le gagner :
 * celui des associés (rentabilité financière), et tout ce que l'activité mobilise (rentabilité
 * économique). Le chapitre les compare au taux de l'emprunt de l'entreprise, puis fait l'expérience :
 * un curseur sur les enceintes vendues (en dessous de combien l'activité rapporte-t-elle moins que
 * l'emprunt ne coûte ?) et un laboratoire de l'effet de levier (remplacer une partie de l'argent des
 * associés par un emprunt : le défi, une rentabilité financière d'au moins 50 %, et le risque qui
 * vient avec).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA, son compte de résultat et
 * son bilan du 31 décembre rangés pour le lycée (monde/comptes-du-lycee.ts), et le taux de son
 * emprunt (le contrat de la fiche). Les capitaux investis sont l'actif économique du supérieur
 * (l-effet-de-levier.ts : immobilisations nettes + besoin en fonds de roulement), le besoin étant
 * celui du bilan fonctionnel de la clôture ; la rentabilité économique se prend ici avant impôt,
 * le supérieur la prend après, et le chapitre le dit. HYPOTHÈSE du laboratoire : l'argent
 * repris par les associés est emprunté au taux de l'emprunt de la fiche, pour toute l'année, et les
 * capitaux investis ne bougent pas avec les ventes.
 */

/** Les bornes du curseur des enceintes vendues dans l'année. */
export const ENCEINTES_DU_CURSEUR = { min: 15_000, max: 26_000 } as const;

/** Les leviers du laboratoire : l'argent des associés remplacé par un emprunt, en euros, et les ventes, en %. */
export const LEVIERS_DE_LA_RENTABILITE = {
  emprunt: { min: 0, max: 150_000, pas: 10_000 },
  ventes: { min: -20, max: 20, pas: 5 },
} as const;

/** Le défi du laboratoire : une rentabilité financière d'au moins 50 %. */
export const RENTABILITE_DU_DEFI = 50;

/** La solution que montre la correction : 80 000 € repris par les associés et empruntés, les mêmes ventes. */
export const SOLUTION_DE_LA_RENTABILITE = { emprunt: 80_000, ventes: 0 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les deux rentabilités de l'année, et le taux de l'emprunt auquel les comparer. */
export function rentabilite(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const k = compteDuLycee(f);
  const b = bilanDuLycee(f);
  const capitauxInvestis = auCentime(b.poste("equipement") + b.besoin);
  return {
    f,
    k,
    entreprise: f.entreprise,
    resultatNet: k.resultatNet,
    resultatExploitation: k.resultatDActivite,
    capitauxPropres: b.capitauxPropres,
    immobilisations: b.poste("equipement"),
    bfr: b.besoin,
    capitauxInvestis,
    financiere: auDixieme((k.resultatNet / b.capitauxPropres) * 100),
    economique: auDixieme((k.resultatDActivite / capitauxInvestis) * 100),
    tauxDeLEmprunt: auDixieme(f.pret.tauxAnnuel * 100),
  };
}

export type Rentabilite = ReturnType<typeof rentabilite>;

/** Ce que coûteraient les capitaux investis s'ils étaient tous empruntés au taux de l'emprunt. */
const coutDesCapitauxInvestis = (r: Rentabilite) => auCentime(r.capitauxInvestis * r.f.pret.tauxAnnuel);

/** Le résultat de l'activité pour un nombre d'enceintes, les autres charges inchangées. */
const activitePour = (r: Rentabilite, q: number) => auCentime(r.resultatExploitation + (r.k.prix - r.k.coutVariable) * (q - r.k.quantiteDeLaFiche));

/** Les enceintes en dessous desquelles l'activité rapporte moins que l'emprunt ne coûte. */
export function enceintesAuTauxDeLEmprunt(r: Rentabilite) {
  return Math.ceil(r.k.quantiteDeLaFiche - (r.resultatExploitation - coutDesCapitauxInvestis(r)) / (r.k.prix - r.k.coutVariable) - 1e-9);
}

/** Une position du laboratoire : l'argent des associés remplacé par un emprunt, et les ventes. */
export function levierDuLaboratoire(r: Rentabilite, p: Readonly<Record<string, number>>) {
  const k = compteDuLycee(r.f, { quantite: Math.round(r.k.quantiteDeLaFiche * (1 + p.ventes! / 100)), interetsEnPlus: auCentime(p.emprunt! * r.f.pret.tauxAnnuel) });
  const capitauxPropres = auCentime(r.capitauxPropres - p.emprunt! + (k.resultatNet - r.resultatNet));
  return {
    k,
    capitauxPropres,
    financiere: auDixieme((k.resultatNet / capitauxPropres) * 100),
    economique: auDixieme((k.resultatDActivite / r.capitauxInvestis) * 100),
  };
}

export const RENTABILITE: Chapitre = {
  code: "rentabilite",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
  ],
  titre: "La rentabilité",
  accroche:
    "Un bénéfice ne dit rien seul : il faut le rapporter à l'argent engagé pour le gagner. Ce que rapporte l'argent des associés, ce que rapporte l'activité, et ce que coûte un euro emprunté.",
  objectifs: [
    "Distinguer bénéfice et rentabilité",
    "Calculer la rentabilité financière",
    "Calculer les capitaux investis et la rentabilité économique",
    "Comparer une rentabilité au taux d'un emprunt",
    "Voir l'effet de levier de l'emprunt, et son risque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "la rentabilité se lit ici sur le premier exercice de NOVA dans la simulation du cours, son compte de résultat et son bilan ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que rapporte l'argent engagé",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const r = rentabilite(c);
        return [
          `Sur l'année, ${r.entreprise} ${r.resultatNet >= 0 ? `gagne ${eur(r.resultatNet)}` : `perd ${eur(-r.resultatNet)}`}. Est-ce beaucoup ? Tout dépend de l'argent qu'il a fallu engager : les associés ont ${eur(r.capitauxPropres)} dans l'entreprise, leur apport et le bénéfice de l'année, et l'activité mobilise sa ligne de montage et l'argent qui attend chez les clients et dans le stock.`,
          "La rentabilité rapporte ce que l'on gagne à ce que l'on a engagé. Elle permet de comparer des entreprises de toutes tailles, et de dire si l'argent est bien placé.",
        ];
      },
      tableau: (c) => {
        const r = rentabilite(c);
        return {
          titre: "Les chiffres de l'année",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat net (après le financement et l'impôt)", valeurs: [eur(r.resultatNet)] },
            { libelle: "Résultat de l'activité (avant le financement et l'impôt)", valeurs: [eur(r.resultatExploitation)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(r.capitauxPropres)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(r.immobilisations)] },
            { libelle: "Besoin en fonds de roulement (stock et créances, moins dettes du cycle)", valeurs: [eur(r.bfr)] },
          ],
        };
      },
      repere: () => "Rentabilité financière = résultat net ÷ capitaux propres. Rentabilité économique = résultat de l'activité ÷ capitaux investis (équipement + besoin en fonds de roulement).",
    },
    {
      id: "calcul",
      type: "montants",
      titre: "Les deux rentabilités",
      notions: ["profitability_vs_return"],
      question: (c) =>
        `Calculez la rentabilité financière ${dE(rentabilite(c).entreprise)} (résultat net ÷ capitaux propres × 100), les capitaux investis (équipement + besoin en fonds de roulement), puis la rentabilité économique (résultat de l'activité ÷ capitaux investis × 100). Les pourcentages au dixième.`,
      champs: (c) => {
        const r = rentabilite(c);
        return [
          { libelle: "Rentabilité financière (%)", attendu: r.financiere, calcul: `${eur(r.resultatNet)} ÷ ${eur(r.capitauxPropres)} × 100 = ${pct(r.financiere)}`, tolerance: 0.1 },
          { libelle: "Capitaux investis", attendu: r.capitauxInvestis, calcul: `${eur(r.immobilisations)} ${r.bfr < 0 ? `− ${eur(-r.bfr)}` : `+ ${eur(r.bfr)}`} = ${eur(r.capitauxInvestis)}`, tolerance: 1 },
          { libelle: "Rentabilité économique (%)", attendu: r.economique, calcul: `${eur(r.resultatExploitation)} ÷ ${eur(r.capitauxInvestis)} × 100 = ${pct(r.economique)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = rentabilite(c);
        return [
          `Pour 100 € laissés par les associés, ${r.entreprise} ${r.financiere >= 0 ? `a gagné ${pct(r.financiere).replace(" %", " €")}` : `a perdu ${pct(-r.financiere).replace(" %", " €")}`} cette année. Pour 100 € mobilisés par l'activité, elle ${r.economique >= 0 ? `en a tiré ${pct(r.economique).replace(" %", " €")}` : `en a perdu ${pct(-r.economique).replace(" %", " €")}`} avant le financement et l'impôt.`,
          // Au-delà de 100 %, l'activité rapporte en un an plus que tout ce qu'elle mobilise.
          r.resultatExploitation > r.capitauxInvestis
            ? "En un an, l'activité rapporte plus que tout ce qu'elle mobilise : ses capitaux investis sont faibles, une seule ligne de montage et un besoin en fonds de roulement réduit, parce que les particuliers paient à la commande. Le reste de l'argent des associés dort en banque et sur le compte à terme : il ne travaille pas pour l'activité."
            : "La première intéresse les associés ; la seconde juge l'activité elle-même, quelle que soit la façon dont elle est financée.",
          "Les capitaux investis sont ce que le supérieur appelle l'actif économique : l'équipement net et le besoin en fonds de roulement du bilan fonctionnel. Le supérieur prend ensuite le résultat de l'activité après impôt ; au lycée, on le prend avant.",
        ];
      },
    },
    {
      id: "associes",
      type: "choix",
      titre: "Pour les associés",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `La banque prête à ${r.entreprise} au taux de ${pct(r.tauxDeLEmprunt)} par an : c'est ce que gagne un prêteur, avec peu de risque. Les associés, eux, ont obtenu ${pct(r.financiere)}. Que leur dire ?`;
      },
      options: (c) => {
        const r = rentabilite(c);
        const mieux = r.financiere > r.tauxDeLEmprunt;
        return [
          {
            texte: "Leur argent rapporte plus que s'ils l'avaient prêté",
            juste: mieux,
            retour: mieux
              ? `Oui : ${pct(r.financiere)} contre ${pct(r.tauxDeLEmprunt)}. Ils prennent plus de risques qu'un prêteur, et cette année ils en sont récompensés.`
              : `Non : ${pct(r.financiere)}, c'est moins que les ${pct(r.tauxDeLEmprunt)} d'un prêteur.`,
          },
          {
            texte: "Leur argent rapporte moins que s'ils l'avaient prêté",
            juste: !mieux,
            retour: !mieux
              ? `Oui : ${pct(r.financiere)} contre ${pct(r.tauxDeLEmprunt)} pour un prêteur, qui prend moins de risques. Une année ne suffit pas à juger, mais si cela dure, les associés chercheront à placer leur argent ailleurs.`
              : `Non : ${pct(r.financiere)}, c'est plus que les ${pct(r.tauxDeLEmprunt)} d'un prêteur.`,
          },
          {
            texte: "On ne peut pas comparer une rentabilité et un taux d'intérêt",
            juste: false,
            retour: "Si : l'une et l'autre disent ce que rapportent 100 € engagés pendant un an. C'est la comparaison que fait tout investisseur.",
          },
        ];
      },
    },
    {
      id: "emprunter",
      type: "choix",
      titre: "Emprunter pour investir",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `${r.entreprise} envisage d'emprunter à ${pct(r.tauxDeLEmprunt)} pour développer son activité, qui rapporte aujourd'hui ${pct(r.economique)} des capitaux investis. Si ce rendement se maintient, l'emprunt est-il une bonne idée ?`;
      },
      options: (c) => {
        const r = rentabilite(c);
        const bon = r.economique > r.tauxDeLEmprunt;
        return [
          {
            texte: "Oui : chaque euro investi rapporte plus qu'il ne coûte",
            juste: bon,
            retour: bon
              ? `Oui : l'euro emprunté coûte ${pct(r.tauxDeLEmprunt)} et l'activité en rapporte ${pct(r.economique)}. La différence revient aux associés : c'est l'intérêt de s'endetter quand l'activité est rentable.`
              : `Non : l'activité rapporte ${pct(r.economique)}, moins que les ${pct(r.tauxDeLEmprunt)} de l'emprunt.`,
          },
          {
            texte: "Non : chaque euro emprunté coûterait plus qu'il ne rapporte",
            juste: !bon,
            retour: !bon
              ? `Oui : l'activité rapporte ${pct(r.economique)}, l'emprunt coûte ${pct(r.tauxDeLEmprunt)}. ${r.economique > 0 ? "Chaque euro emprunté réduirait le bénéfice des associés : il faut d'abord rendre l'activité plus rentable." : "Emprunter creuserait les pertes : il faut d'abord rendre l'activité rentable."}`
              : `Non : l'activité rapporte ${pct(r.economique)}, plus que les ${pct(r.tauxDeLEmprunt)} de l'emprunt.`,
          },
          {
            texte: "Toujours : emprunter permet de grandir",
            juste: false,
            retour: "Non : grandir avec de l'argent emprunté ne rapporte que si l'activité rapporte plus que l'emprunt ne coûte. Sinon, l'entreprise grandit en perdant davantage.",
          },
        ];
      },
    },
    {
      id: "l-activite-face-a-l-emprunt",
      type: "curseur",
      titre: "L'activité face au coût de l'emprunt",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `Et si les ventes baissaient ? Faites varier les enceintes vendues dans l'année (les capitaux investis, ${eur(r.capitauxInvestis)}, ne bougent pas). Une droite donne le résultat de l'activité, l'autre ce que coûteraient les capitaux investis s'ils étaient empruntés à ${pct(r.tauxDeLEmprunt)}. Placez le curseur sur le plus petit nombre d'enceintes où la rentabilité économique atteint au moins le taux de l'emprunt, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes vendues dans l'année", unite: "enceintes" }),
      cible: (c) => ({ attendu: enceintesAuTauxDeLEmprunt(rentabilite(c)), min: ENCEINTES_DU_CURSEUR.min, max: ENCEINTES_DU_CURSEUR.max }),
      zones: ["L'activité rapporte plus que l'emprunt ne coûte", "L'emprunt coûte plus que l'activité ne rapporte"],
      rates: () => ({
        dessous: "À cette position, l'activité rapporte moins que l'emprunt ne coûterait : la rentabilité économique est sous le taux.",
        dessus: "Avec moins d'enceintes, la rentabilité économique dépasse encore le taux : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer la quantité",
      lecture: (c, q) => {
        const r = rentabilite(c);
        const a = activitePour(r, q);
        return [
          { libelle: "Résultat de l'activité", montant: a },
          { libelle: "Coût des capitaux investis au taux de l'emprunt", montant: coutDesCapitauxInvestis(r) },
          { libelle: "Rentabilité économique (%)", montant: auDixieme((a / r.capitauxInvestis) * 100), fort: true },
        ];
      },
      droites: (c) => {
        const r = rentabilite(c);
        return { produit: (q) => activitePour(r, q), cout: () => coutDesCapitauxInvestis(r), libelles: ["Résultat de l'activité", "Coût au taux de l'emprunt"] };
      },
      explication: (c) => {
        const r = rentabilite(c);
        const q = enceintesAuTauxDeLEmprunt(r);
        return [
          `Il suffit de ${qte(q)} enceintes pour que l'activité rapporte au moins ${pct(r.tauxDeLEmprunt)} de ce qu'elle mobilise. ${r.entreprise} en a vendu ${qte(r.k.quantite)} : emprunter pour l'activité reste rentable tant que les ventes ne tombent pas sous ce seuil.`,
          "Ce n'est pas le bénéfice qui décide s'il faut emprunter : c'est la comparaison entre ce que rapporte l'activité et ce que coûte l'argent.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-levier",
      type: "simulation",
      titre: "Le laboratoire de l'effet de levier",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const r = rentabilite(c);
        return `Les associés pourraient reprendre une partie de leur argent (un dividende exceptionnel) et ${r.entreprise} l'emprunterait à la banque, à ${pct(r.tauxDeLEmprunt)} sur toute l'année. Faites varier cet emprunt et les enceintes vendues : les intérêts, l'impôt, le résultat et les capitaux propres se refont. Relevez le défi, puis regardez ce qui se passe quand les ventes baissent.`;
      },
      leviers: () => [
        { code: "emprunt", libelle: "Argent des associés remplacé par un emprunt", unite: "€", ...LEVIERS_DE_LA_RENTABILITE.emprunt, depart: 0 },
        { code: "ventes", libelle: "Enceintes vendues, par rapport à l'année", unite: "%", ...LEVIERS_DE_LA_RENTABILITE.ventes, depart: 0 },
      ],
      lecture: (c, p) => {
        const r = rentabilite(c);
        const x = levierDuLaboratoire(r, p);
        return [
          { libelle: "Intérêts de l'emprunt", montant: x.k.ligne("interets"), reference: r.k.ligne("interets") },
          { libelle: "Résultat net", montant: x.k.resultatNet, reference: r.resultatNet },
          { libelle: "Capitaux propres", montant: x.capitauxPropres, reference: r.capitauxPropres },
          { libelle: "Rentabilité économique", montant: x.economique, unite: "%", reference: r.economique },
          { libelle: "Rentabilité financière", montant: x.financiere, unite: "%", reference: r.financiere, fort: true },
        ];
      },
      graphique: (c) => {
        const r = rentabilite(c);
        return {
          levier: "emprunt",
          courbes: [{ libelle: "Rentabilité financière", valeur: (p) => levierDuLaboratoire(r, p).financiere }],
          unite: "%",
        };
      },
      defi: (c) => {
        const r = rentabilite(c);
        return {
          consigne: `Portez la rentabilité financière à ${pct(RENTABILITE_DU_DEFI)} au moins.`,
          atteint: (p) => levierDuLaboratoire(r, p).financiere >= RENTABILITE_DU_DEFI,
          indice: (p) => {
            const x = levierDuLaboratoire(r, p);
            return `La rentabilité financière est de ${pct(x.financiere)}. Le résultat bouge peu quand on emprunte ; ce sont les capitaux propres qui baissent. Que se passe-t-il quand le même bénéfice se rapporte à moins d'argent des associés ?`;
          },
          solution: SOLUTION_DE_LA_RENTABILITE,
        };
      },
      explication: (c, p) => {
        const r = rentabilite(c);
        const x = levierDuLaboratoire(r, p);
        const bas = levierDuLaboratoire(r, { ...p, ventes: LEVIERS_DE_LA_RENTABILITE.ventes.min });
        const basSans = levierDuLaboratoire(r, { emprunt: 0, ventes: LEVIERS_DE_LA_RENTABILITE.ventes.min });
        return [
          `Défi relevé : avec ${eur(p.emprunt!)} empruntés à la place des associés, le résultat net passe à ${eur(x.k.resultatNet)} et les capitaux propres à ${eur(x.capitauxPropres)} : la rentabilité financière monte à ${pct(x.financiere)}. L'activité rapporte bien plus que les ${pct(r.tauxDeLEmprunt)} de l'emprunt : chaque euro emprunté enrichit les associés. C'est l'effet de levier.`,
          `Le levier joue aussi dans l'autre sens : si les ventes baissaient de ${pct(-LEVIERS_DE_LA_RENTABILITE.ventes.min)}, la rentabilité financière tomberait à ${pct(bas.financiere)} avec cet emprunt, contre ${pct(basSans.financiere)} sans lui, et les intérêts resteraient à payer. S'endetter rend les associés plus riches quand tout va bien, plus exposés quand l'activité faiblit.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const r = rentabilite(c);
        return [
          `Chez ${r.entreprise}, la rentabilité financière est de ${pct(r.financiere)} et la rentabilité économique de ${pct(r.economique)}, pour un emprunt à ${pct(r.tauxDeLEmprunt)}.`,
          "Le bénéfice dit combien l'entreprise gagne ; la rentabilité dit si c'est beaucoup pour l'argent engagé. Et comparer la rentabilité de l'activité au coût de l'emprunt dit si s'endetter pour grandir enrichit les associés, ou les appauvrit. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Emprunter pour investir est rentable si la rentabilité économique dépasse le taux de l'emprunt : c'est l'effet de levier.",
    },
  ],
};
