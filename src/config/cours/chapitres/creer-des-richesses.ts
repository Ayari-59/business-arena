import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { type Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DU_MARCHE,
  STRATEGIES_DE_LA_RICHESSE,
  richesseDuMarche,
  strategieQuiCreeLePlus,
  tauxDeLImpotDuMarche,
  valeurAjouteeDeNova,
  ventesQuiPaientLesSalaires,
  type ComptesDUneEnseigne,
} from "../monde/gestion-et-information";
import { strategieDe } from "../monde/attractivite";
import type { CodeDeStrategie } from "../monde/marche-a-trois";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CRÉER DES RICHESSES ET LES MESURER (Seconde, sciences économiques et sociales,
 * palier 1).
 *
 * Le regard de l'économiste de seconde sur la production : une entreprise crée de la richesse
 * quand ce qu'elle produit vaut plus que ce qu'elle a acheté à d'autres entreprises pour le
 * produire. Le chapitre lit les comptes d'une année : la production (le chiffre d'affaires), les
 * consommations intermédiaires (les achats et les services extérieurs), la valeur ajoutée de
 * l'entreprise ; puis celle de ses deux concurrents, et leur somme, la richesse créée par tout le
 * marché : l'idée du PIB, à l'échelle d'un marché. Enfin, ce que la valeur ajoutée rémunère : les
 * salaires, les impôts et le profit. Un curseur (combien d'enceintes vendre pour que la valeur
 * ajoutée paie les salaires ?) et un laboratoire (quelle offre de NOVA crée le plus de richesse ?).
 *
 * Il ne double pas « La valeur ajoutée et son partage » (bac STMG, gestion et finance), qui
 * calcule le taux de valeur ajoutée de l'entreprise et la part de chacun de ses partenaires. Ici,
 * l'objet est la mesure de la richesse : ce qui se compte, ce qui ne se compte pas deux fois, et
 * l'addition des valeurs ajoutées de tout un marché.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur le marché à trois (NOVA, SoundBox
 * et Auris, l'année type de marche-a-trois.ts) : le chiffre d'affaires et les coûts variables de
 * chaque enseigne, ses budgets (qualité, communication, RSE), ses charges fixes et son résultat. Ce
 * que les charges fixes paient (personnel, loyer et frais, usure de l'équipement), l'impôt à 25 %,
 * et l'absence d'intérêts sont dits dans monde/gestion-et-information.ts.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait l'année de l'arène dans neuf entreprises, et leurs deux
 * premiers concurrents. Chez NOVA, la valeur ajoutée est maintenant de 243 368 €, sur un marché qui
 * en crée 1 082 968 € (le marché à trois de 19 148 enceintes par trimestre).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const POURQUOI_LA_RICHESSE =
  "ce chapitre suit NOVA sur le marché qu'elle partage avec SoundBox et Auris, dont le cours tient les comptes de l'année.";

const marche = () => richesseDuMarche(FICHE_DU_MARCHE);
const NOMS_DES_STRATEGIES: Record<string, string> = { milieu: "L'offre d'aujourd'hui", couts: "Moins chère, plus simple", differenciation: "Plus chère, plus soignée" };

/** Les lignes des comptes d'une enseigne : les consommations intermédiaires, puis le partage de la valeur ajoutée. */
export function lignesDesComptes(v: ComptesDUneEnseigne) {
  return [
    { code: "achats", libelle: "Achats pour produire (composants, emballage, transport, énergie)", montant: v.achats, categorie: "ci", pourquoi: "Ce que chaque enceinte demande d'acheter à des fournisseurs, et qui disparaît dans la production : une consommation intermédiaire." },
    { code: "budgets", libelle: "Qualité, publicité et engagements achetés", montant: v.budgets, categorie: "ci", pourquoi: "Des services achetés à d'autres entreprises (essais, agences, médias) : une consommation intermédiaire." },
    { code: "loyer", libelle: "Loyer et frais de structure", montant: v.loyerEtFrais, categorie: "ci", pourquoi: "Le local, l'énergie du bâtiment, l'assurance : des services achetés à d'autres. Une consommation intermédiaire." },
    { code: "salaires", libelle: "Salaires et charges du personnel", montant: v.salaires, categorie: "partage", pourquoi: "La rémunération du travail de l'équipe, qui crée la richesse : une part de la valeur ajoutée." },
    { code: "impot", libelle: "Impôt sur les bénéfices", montant: v.impot, categorie: "partage", pourquoi: "Ce que l'État prélève sur la richesse créée, pour financer ses services : une part de la valeur ajoutée." },
  ].filter((l) => l.montant > 0);
}

const CATEGORIES = [
  { code: "ci", libelle: "Consommation intermédiaire" },
  { code: "partage", libelle: "Partage de la valeur ajoutée" },
] as const;

function tableauDesComptes(c: Cas): TableauDeDonnees {
  const n = marche().nova;
  return {
    titre: `Les comptes de l'année ${dE(c.entreprise)}`,
    colonnes: ["Montant"],
    lignes: [{ libelle: `Production (${qte(n.ventes)} ${c.unites} vendues)`, valeurs: [eur(n.production)] }, ...lignesDesComptes(n).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] }))],
  };
}

function tableauDuMarche(): TableauDeDonnees {
  const k = marche();
  return {
    titre: "La production et les consommations des enseignes, sur l'année",
    colonnes: k.enseignes.map((v) => v.nom),
    lignes: [
      { libelle: "Production (chiffre d'affaires)", valeurs: k.enseignes.map((v) => eur(v.production)) },
      { libelle: "Consommations intermédiaires", valeurs: k.enseignes.map((v) => eur(v.consommations)) },
    ],
  };
}

function tableauDuPartage(): TableauDeDonnees {
  const k = marche();
  return {
    titre: "Ce que la valeur ajoutée de chaque enseigne rémunère, sur l'année",
    colonnes: k.enseignes.map((v) => v.nom),
    lignes: [
      { libelle: "Valeur ajoutée", valeurs: k.enseignes.map((v) => eur(v.valeurAjoutee)) },
      { libelle: "Salaires et charges du personnel", valeurs: k.enseignes.map((v) => eur(v.salaires)) },
      { libelle: "Impôt sur les bénéfices", valeurs: k.enseignes.map((v) => eur(v.impot)) },
    ],
  };
}

function tableauDesBenefices(): TableauDeDonnees {
  const k = marche();
  return {
    titre: "La richesse créée et le bénéfice de chaque enseigne, sur l'année",
    colonnes: k.enseignes.map((v) => v.nom),
    lignes: [
      { libelle: "Valeur ajoutée", valeurs: k.enseignes.map((v) => eur(v.valeurAjoutee)) },
      { libelle: "Bénéfice de l'année", valeurs: k.enseignes.map((v) => eur(v.benefice)) },
    ],
  };
}

const offreEcrite = (code: CodeDeStrategie) => {
  const s = strategieDe(FICHE_DU_MARCHE, code);
  return `${NOMS_DES_STRATEGIES[code]} (${eur(s.prix)})`;
};

export const CREER_DES_RICHESSES: Chapitre = {
  code: "creer-des-richesses",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?"],
  titre: "Créer des richesses et les mesurer",
  accroche:
    "Une entreprise qui vend pour un million d'euros n'a pas créé un million de richesse : une part de ce prix paie ce que d'autres ont produit. Mesurer la valeur ajoutée d'une entreprise, puis celle de tout son marché.",
  objectifs: [
    "Distinguer la production et les consommations intermédiaires",
    "Calculer la valeur ajoutée d'une entreprise",
    "Additionner les valeurs ajoutées d'un marché, comme le PIB le fait pour un pays",
    "Dire ce que la valeur ajoutée rémunère : salaires, impôts et profit",
    "Voir qu'une offre plus soignée peut créer plus de richesse en vendant moins",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_LA_RICHESSE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Produire, c'est créer des richesses",
      notions: ["revenue", "income_statement"],
      tableau: tableauDesComptes,
      texte: (c) => {
        const n = marche().nova;
        return [
          `Dans l'année, ${c.entreprise} a vendu pour ${eur(n.production)} : c'est sa production, mesurée par son chiffre d'affaires. Mais pour produire, elle a acheté à d'autres entreprises des biens et des services qui ont disparu dans sa production : les composants, l'emballage, le transport et l'énergie, les services de qualité, le loyer. Ce sont ses consommations intermédiaires.`,
          "Ces consommations sont des richesses que d'autres entreprises ont créées. La richesse que l'entreprise crée elle-même, par le travail de son équipe et son équipement, est ce qui reste : sa valeur ajoutée. Elle sert ensuite à payer ceux qui ont aidé à la créer.",
        ];
      },
      repere: () => "Valeur ajoutée = production − consommations intermédiaires.",
    },
    {
      id: "ranger",
      objectifs: [0],
      type: "tri",
      titre: "Acheté à d'autres, ou partagé",
      notions: ["income_statement"],
      question: () =>
        "Rangez chaque ligne des comptes : c'est une consommation intermédiaire (un bien ou un service acheté à une autre entreprise et utilisé pour produire), ou une part de la valeur ajoutée versée à ceux qui ont aidé à la créer.",
      categories: CATEGORIES,
      elements: () => lignesDesComptes(marche().nova).map(({ libelle, montant, categorie, pourquoi }) => ({ libelle, montant, categorie, pourquoi })),
      explication: () => [
        "Les consommations intermédiaires se retirent de la production : elles sont la richesse d'autres entreprises. Les salaires et l'impôt, eux, ne s'en retirent pas : ils sont payés avec la richesse que l'entreprise a créée.",
      ],
    },
    {
      id: "valeur-ajoutee",
      objectifs: [1],
      type: "montants",
      titre: "La valeur ajoutée de l'entreprise",
      notions: ["income_statement", "revenue"],
      tableau: tableauDesComptes,
      question: (c) => `Calculez les consommations intermédiaires ${dE(c.entreprise)} sur l'année, puis sa valeur ajoutée.`,
      champs: (c) => {
        const n = marche().nova;
        const ci = lignesDesComptes(n).filter((l) => l.categorie === "ci");
        return [
          { libelle: "Consommations intermédiaires", attendu: n.consommations, calcul: `${ci.map((l) => eur(l.montant)).join(" + ")} = ${eur(n.consommations)}` },
          { libelle: `Valeur ajoutée ${dE(c.entreprise)}`, attendu: n.valeurAjoutee, calcul: `${eur(n.production)} − ${eur(n.consommations)} = ${eur(n.valeurAjoutee)}` },
        ];
      },
      explication: (c) => {
        const n = marche().nova;
        return [
          `Sur ${eur(n.production)} de ventes, ${c.entreprise} a créé ${eur(n.valeurAjoutee)} de richesse, soit ${pct(auDixieme((n.valeurAjoutee / n.production) * 100))} de sa production. Le reste, ${eur(n.consommations)}, paie la production d'autres entreprises.`,
        ];
      },
    },
    {
      id: "valeur-du-marche",
      objectifs: [2],
      type: "montants",
      titre: "La richesse créée par tout le marché",
      notions: ["income_statement", "revenue"],
      tableau: tableauDuMarche,
      question: (c) => {
        const k = marche();
        const [a, b] = k.concurrents;
        return `${c.entreprise} n'est pas seule sur son marché. Calculez la valeur ajoutée ${dE(a.nom)} et celle ${dE(b.nom)}, puis la valeur ajoutée du marché : la somme des valeurs ajoutées des enseignes (celle ${dE(c.entreprise)} est de ${eur(k.nova.valeurAjoutee)}).`;
      },
      champs: () => {
        const k = marche();
        const [a, b] = k.concurrents;
        return [
          { libelle: `Valeur ajoutée ${dE(a.nom)}`, attendu: a.valeurAjoutee, calcul: `${eur(a.production)} − ${eur(a.consommations)} = ${eur(a.valeurAjoutee)}` },
          { libelle: `Valeur ajoutée ${dE(b.nom)}`, attendu: b.valeurAjoutee, calcul: `${eur(b.production)} − ${eur(b.consommations)} = ${eur(b.valeurAjoutee)}` },
          { libelle: "Valeur ajoutée du marché", attendu: k.valeurAjoutee, calcul: `${k.enseignes.map((v) => eur(v.valeurAjoutee)).join(" + ")} = ${eur(k.valeurAjoutee)}` },
        ];
      },
      explication: () => [
        `Le marché a créé ${eur(marche().valeurAjoutee)} de richesse dans l'année. Un pays mesure sa production de la même façon : le produit intérieur brut (PIB) est la somme des valeurs ajoutées de tous ceux qui produisent sur son territoire.`,
      ],
    },
    {
      id: "sans-double-compte",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi additionner les valeurs ajoutées",
      notions: ["income_statement"],
      question: () => "Pour mesurer la richesse créée par le marché, pourquoi additionner les valeurs ajoutées plutôt que les chiffres d'affaires ?",
      options: () => {
        const k = marche();
        return [
          {
            texte: "Pour ne pas compter deux fois ce que d'autres entreprises ont produit",
            juste: true,
            retour: `Oui : les trois chiffres d'affaires font ${eur(k.production)}, mais ${eur(k.consommations)} paient des biens et des services produits par d'autres entreprises, les fournisseurs, qui comptent déjà cette richesse dans leur propre valeur ajoutée. Additionner les chiffres d'affaires la compterait deux fois.`,
          },
          {
            texte: "Parce que la valeur ajoutée est toujours plus grande que le chiffre d'affaires",
            juste: false,
            retour: `Non : c'est l'inverse. La valeur ajoutée du marché, ${eur(k.valeurAjoutee)}, est plus petite que ses chiffres d'affaires réunis, ${eur(k.production)} : on en a retiré les consommations intermédiaires.`,
          },
          {
            texte: "Parce que le chiffre d'affaires ne compte que les ventes au comptant",
            juste: false,
            retour: `Non : le chiffre d'affaires compte toutes les ventes de l'année. S'il ne mesure pas la richesse créée, c'est qu'il comprend les ${eur(k.consommations)} de consommations intermédiaires, déjà comptées chez les fournisseurs.`,
          },
        ];
      },
    },
    {
      id: "qui-cree-le-plus",
      objectifs: [2],
      type: "choix",
      titre: "Qui crée le plus de richesse",
      notions: ["income_statement", "revenue"],
      tableau: tableauDuMarche,
      question: () => "Laquelle des enseignes crée le plus de richesse dans l'année ?",
      options: () => {
        const k = marche();
        const g = k.plusGrandeValeur;
        const ch = k.plusGrosChiffre;
        return k.enseignes.map((v) => ({
          texte: v.nom,
          juste: v.code === g.code,
          retour:
            v.code === g.code
              ? `Oui : ${eur(g.valeurAjoutee)} de valeur ajoutée. ${g.code === ch.code ? `C'est aussi le plus gros chiffre d'affaires du marché, ${eur(g.production)} : elle vend beaucoup, et ses grandes séries lui coûtent peu par enceinte.` : `Pourtant, c'est ${ch.nom} qui vend le plus, ${eur(ch.production)}.`}`
              : `Non : ${v.nom} crée ${eur(v.valeurAjoutee)}, contre ${eur(g.valeurAjoutee)} pour ${g.nom}.`,
        }));
      },
    },
    {
      id: "partage",
      objectifs: [3],
      type: "montants",
      titre: "Ce que la valeur ajoutée rémunère",
      notions: ["payroll", "income_statement"],
      tableau: tableauDuPartage,
      question: (c) =>
        `La valeur ajoutée paie ceux qui ont aidé à la créer : les salariés (salaires), l'État (impôts), et l'entreprise elle-même (le profit, ce qui reste). Calculez le profit ${dE(c.entreprise)}, puis les salaires versés par les enseignes, et la part des salaires dans la valeur ajoutée du marché, au dixième.`,
      champs: (c) => {
        const k = marche();
        const n = k.nova;
        return [
          { libelle: `Profit ${dE(c.entreprise)}`, attendu: n.profit, calcul: `${eur(n.valeurAjoutee)} − ${eur(n.salaires)} − ${eur(n.impot)} = ${eur(n.profit)}` },
          { libelle: "Salaires versés par les enseignes", attendu: k.salaires, calcul: `${k.enseignes.map((v) => eur(v.salaires)).join(" + ")} = ${eur(k.salaires)}` },
          { libelle: "Part des salaires dans la valeur ajoutée du marché (%)", attendu: k.partDesSalaires, calcul: `${eur(k.salaires)} ÷ ${eur(k.valeurAjoutee)} × 100 = ${pct(k.partDesSalaires)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = marche();
        const n = k.nova;
        return [
          `${c.entreprise} garde ${eur(n.profit)} de profit : son bénéfice de l'année, ${eur(n.benefice)}, et de quoi remplacer sa ligne de montage usée, ${eur(n.amortissement)}. L'impôt est de ${pct(tauxDeLImpotDuMarche() * 100)} du résultat ; aucune des enseignes n'a d'emprunt à rémunérer dans cette année.`,
          `Sur le marché, ${pct(k.partDesSalaires)} de la richesse créée paie le travail. ${k.partDesSalaires > 50 ? "Les salaires en sont la plus grosse part : la richesse créée paie d'abord le travail qui la crée." : "Le travail en reçoit moins de la moitié : le profit et les impôts se partagent le reste."}`,
        ];
      },
    },
    {
      id: "richesse-et-benefice",
      objectifs: [3],
      type: "choix",
      titre: "Créer de la richesse, faire un bénéfice",
      notions: ["income_statement"],
      tableau: tableauDesBenefices,
      question: () => "Laquelle de ces phrases est juste pour le marché, cette année ?",
      options: () => {
        const k = marche();
        const tous = k.enPerte.length === 0;
        const faits = tous
          ? `les enseignes créent de la richesse (${k.enseignes.map((v) => eur(v.valeurAjoutee)).join(", ")}) et finissent l'année en bénéfice. Mais le bénéfice n'est qu'une petite part de la richesse créée : chez ${k.nova.nom}, ${eur(k.nova.benefice)} sur ${eur(k.nova.valeurAjoutee)}.`
          : `${k.enPerte.map((v) => v.nom).join(" et ")} finit en perte, et crée pourtant de la richesse.`;
        return [
          tous
            ? { texte: "Chaque enseigne crée de la richesse, et toutes finissent en bénéfice", juste: true, retour: `Oui : ${faits}` }
            : { texte: "Une enseigne peut finir en perte et créer pourtant de la richesse", juste: true, retour: `Oui : ${faits}` },
          { texte: "Une enseigne en perte ne crée aucune richesse", juste: false, retour: `Non : une perte ne dit pas qu'aucune richesse n'est créée. ${tous ? `Ici, ${faits}` : faits}` },
          { texte: "La valeur ajoutée d'une enseigne est son bénéfice", juste: false, retour: `Non : la valeur ajoutée paie d'abord les salaires et l'impôt. Le bénéfice est ce qui reste, une fois l'usure de l'équipement mise de côté : ${faits}` },
        ];
      },
    },
    {
      id: "la-richesse-qui-paie-les-salaires",
      objectifs: [3],
      type: "curseur",
      titre: "Assez de richesse pour payer l'équipe",
      notions: ["payroll", "income_statement"],
      question: (c) => {
        const n = marche().nova;
        return `Chaque ${c.unite} vendue ajoute ${eur(Math.round(((n.production - n.achats) / n.ventes) * 100) / 100)} à la valeur ajoutée ${dE(c.entreprise)} ; le loyer et ses budgets, ${eur(n.loyerEtFrais + n.budgets)}, s'en retirent quelles que soient ses ventes. Faites varier les ${c.unites} vendues dans l'année, et placez le curseur sur le plus petit nombre pour lequel sa valeur ajoutée paie les salaires de son équipe, ${eur(n.salaires)}.`;
      },
      grandeur: (c) => ({ libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} vendues dans l'année`, unite: c.unites }),
      cible: () => ({ attendu: ventesQuiPaientLesSalaires(), min: 10_000, max: 30_000 }),
      zones: ["La valeur ajoutée paie les salaires", "La valeur ajoutée ne paie pas les salaires"],
      montrer: "Montrer le nombre",
      lecture: (_c, q) => [
        { libelle: "Valeur ajoutée", montant: valeurAjouteeDeNova(FICHE_DU_MARCHE, q), fort: true },
        { libelle: "Salaires et charges du personnel", montant: marche().nova.salaires },
      ],
      droites: () => ({ produit: (q) => valeurAjouteeDeNova(FICHE_DU_MARCHE, q), cout: () => marche().nova.salaires, libelles: ["Valeur ajoutée", "Salaires"] }),
      explication: (c) => {
        const q = ventesQuiPaientLesSalaires();
        const n = marche().nova;
        return [
          `Il faut ${qte(q)} ${c.unites} : la valeur ajoutée atteint ${eur(valeurAjouteeDeNova(FICHE_DU_MARCHE, q))}, de quoi payer les ${eur(n.salaires)} de salaires. ${c.entreprise} en vend ${qte(n.ventes)} : ce qu'elle crée au-delà paie l'impôt, l'usure de sa ligne et son bénéfice.`,
          "Sous ce nombre, l'entreprise ne crée pas assez de richesse pour payer le travail qui la produit.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-richesse",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la richesse",
      notions: ["income_statement", "revenue"],
      question: (c) =>
        `${c.entreprise} peut changer d'offre : une enceinte plus simple et moins chère, ou plus soignée et plus chère. Les clients choisissent entre les enseignes, et les ventes de chacune bougent. Choisissez l'offre ${dE(c.entreprise)}, et regardez sa production, ses consommations et sa valeur ajoutée.`,
      leviers: () => [
        {
          code: "offre",
          libelle: "L'offre de NOVA",
          unite: "",
          min: 0,
          max: STRATEGIES_DE_LA_RICHESSE.length - 1,
          pas: 1,
          depart: 0,
          choix: STRATEGIES_DE_LA_RICHESSE.map((s, i) => ({ valeur: i, libelle: offreEcrite(s) })),
        },
      ],
      lecture: (_c, p) => {
        const n = richesseDuMarche(FICHE_DU_MARCHE, STRATEGIES_DE_LA_RICHESSE[p.offre!]!).nova;
        const d = marche().nova;
        return [
          { libelle: "Enceintes vendues", montant: n.ventes, unite: "enceintes", reference: d.ventes },
          { libelle: "Production", montant: n.production, reference: d.production },
          { libelle: "Consommations intermédiaires", montant: n.consommations, reference: d.consommations },
          { libelle: "Valeur ajoutée", montant: n.valeurAjoutee, reference: d.valeurAjoutee, fort: true },
        ];
      },
      defi: () => {
        const juste = STRATEGIES_DE_LA_RICHESSE.indexOf(strategieQuiCreeLePlus());
        return {
          consigne: "Trouvez l'offre avec laquelle NOVA crée le plus de valeur ajoutée.",
          atteint: (p) => p.offre === juste,
          indice: (p) => {
            const n = richesseDuMarche(FICHE_DU_MARCHE, STRATEGIES_DE_LA_RICHESSE[p.offre!]!).nova;
            return `Avec cette offre, NOVA vend ${qte(n.ventes)} enceintes et crée ${eur(n.valeurAjoutee)}. Une autre offre crée-t-elle plus ?`;
          },
          solution: { offre: juste },
        };
      },
      explication: (c, p) => {
        const n = richesseDuMarche(FICHE_DU_MARCHE, STRATEGIES_DE_LA_RICHESSE[p.offre!]!).nova;
        const d = marche().nova;
        return [
          `Défi relevé : avec l'offre la plus soignée, ${c.entreprise} vend ${qte(n.ventes)} ${c.unites}, moins qu'aujourd'hui (${qte(d.ventes)}), mais crée ${eur(n.valeurAjoutee)} de valeur ajoutée, contre ${eur(d.valeurAjoutee)}.`,
          "Créer de la richesse, ce n'est pas vendre le plus d'unités : c'est produire ce que les clients paient plus cher que ce qu'il a fallu acheter à d'autres.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement", "payroll"],
      texte: (c) => {
        const k = marche();
        return [
          `Dans l'année, ${c.entreprise} produit ${eur(k.nova.production)} et crée ${eur(k.nova.valeurAjoutee)} de valeur ajoutée. Avec SoundBox et Auris, le marché crée ${eur(k.valeurAjoutee)} de richesse, dont ${pct(k.partDesSalaires)} paient les salaires.`,
          "Mesurer la richesse créée, c'est retirer de la production ce que d'autres ont produit : les consommations intermédiaires. Additionner les valeurs ajoutées de tous les producteurs donne la richesse d'un marché, et pour un pays le PIB. Dans l'arène, les comptes de votre entreprise se lisent de la même façon.",
        ];
      },
      repere: () => "Valeur ajoutée = production − consommations intermédiaires. PIB = somme des valeurs ajoutées. Valeur ajoutée = salaires + impôts + profit.",
    },
  ],
};
