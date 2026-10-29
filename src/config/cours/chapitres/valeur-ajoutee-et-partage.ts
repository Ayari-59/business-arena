import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, compteDuLycee, type CompteDuLycee } from "../monde/comptes-du-lycee";
import type { Chapitre } from "../types";
import { compteDeResultat } from "./lire-le-compte-de-resultat";

/**
 * CHAPITRE : LA VALEUR AJOUTÉE ET SON PARTAGE (Bac STMG, gestion et finance, palier 1).
 *
 * Ce que l'entreprise crée par son travail : ce qu'elle produit, moins ce qu'elle a acheté à
 * d'autres entreprises pour le produire. Puis le partage de cette richesse entre ceux qui y ont
 * contribué : les salariés, les prêteurs, l'État, et l'entreprise elle-même, qui garde de quoi
 * renouveler son équipement et se développer. Puis l'expérience : un curseur sur les enceintes
 * vendues (combien faut-il en vendre pour que la richesse créée paie l'équipe ?), et un laboratoire
 * du partage (augmenter les salaires de 20 % en gardant à l'entreprise un tiers de la valeur ajoutée).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA, rangé en lignes du lycée
 * (monde/comptes-du-lycee.ts, `compteDuLycee`, le même que « Le compte de résultat »). NOVA ne
 * produit pas pour stocker : sa production est ses ventes. La simulation du cours ne verse pas de
 * dividendes : la part des associés reste dans l'entreprise, et le chapitre le dit. Les revenus du
 * compte à terme ne viennent pas de la valeur ajoutée : la part de l'entreprise est ce que la valeur
 * ajoutée laisse une fois payés les salariés, les prêteurs et l'État.
 */

/** Les bornes du curseur des enceintes vendues dans l'année. */
export const ENCEINTES_DU_CURSEUR = { min: 15_000, max: 26_000 } as const;

/** Les leviers du laboratoire : la hausse des salaires, en %, et les ventes, en % de celles de l'année. */
export const LEVIERS_DU_PARTAGE = {
  hausse: { min: 0, max: 20, pas: 1 },
  ventes: { min: -20, max: 20, pas: 5 },
} as const;

/** Le défi du laboratoire : 20 % de hausse des salaires, et l'entreprise qui garde au moins un tiers de la valeur ajoutée. */
export const HAUSSE_DU_DEFI = 20;
export const PART_GARDEE_DU_DEFI = 1 / 3;

/** La solution que montre la correction : la hausse de 20 %, et 5 % d'enceintes vendues en plus. */
export const SOLUTION_DU_PARTAGE = { hausse: 20, ventes: 5 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le nom de chaque part, au laboratoire. */
const LIBELLE_DE_LA_PART: Readonly<Record<string, string>> = {
  salaries: "Part des salariés",
  preteurs: "Part des prêteurs",
  etat: "Part de l'État",
  entreprise: "Part de l'entreprise",
};

/** Le partage de la valeur ajoutée d'une année du lycée. */
function partage(k: CompteDuLycee) {
  const va = k.valeurAjoutee;
  const entreprise = auCentime(va - k.personnel - k.financement - k.impot);
  const part = (x: number) => auDixieme((x / va) * 100);
  const parts = [
    { code: "salaries", nom: "Les salariés", montant: k.personnel, part: part(k.personnel), quoi: "les salaires et les cotisations" },
    { code: "preteurs", nom: "Les prêteurs", montant: k.financement, part: part(k.financement), quoi: "les intérêts de l'emprunt et les escomptes" },
    { code: "etat", nom: "L'État", montant: k.impot, part: part(k.impot), quoi: "l'impôt sur les bénéfices" },
    { code: "entreprise", nom: "L'entreprise elle-même", montant: entreprise, part: part(entreprise), quoi: "ce qu'elle garde pour remplacer sa ligne, couvrir ses risques et se développer" },
  ];
  return { va, entreprise, parts, partGardee: entreprise / va };
}

/** La valeur ajoutée de l'année et ses parts. */
export function valeurAjoutee(c: Pick<Cas, "code">) {
  const k = compteDeResultat(c);
  const p = partage(k);
  return {
    k,
    consommations: k.consommations,
    ...p,
    tauxDeValeurAjoutee: auDixieme((p.va / k.ventes) * 100),
    premiere: p.parts.reduce((a, b) => (b.montant > a.montant ? b : a)),
  };
}

export type ValeurAjoutee = ReturnType<typeof valeurAjoutee>;

/** Les enceintes à partir desquelles la valeur ajoutée paie le personnel. */
export function enceintesQuiPaientLEquipe(v: ValeurAjoutee) {
  return Math.ceil(v.k.quantiteDeLaFiche - (v.va - v.k.personnel) / v.k.margeParEnceinte - 1e-9);
}

/** La valeur ajoutée pour un nombre d'enceintes : chaque enceinte en plus laisse son prix moins ses consommations. */
const vaPour = (v: ValeurAjoutee, q: number) => auCentime(v.va + v.k.margeParEnceinte * (q - v.k.quantiteDeLaFiche));

/** Une position du laboratoire : la hausse des salaires et les ventes, en %. */
export function partageDuLaboratoire(v: ValeurAjoutee, p: Readonly<Record<string, number>>) {
  const k = compteDuLycee(v.k.f, { hausseDesSalaires: p.hausse! / 100, quantite: Math.round(v.k.quantiteDeLaFiche * (1 + p.ventes! / 100)) });
  return { k, ...partage(k) };
}

export const VALEUR_AJOUTEE: Chapitre = {
  code: "valeur-ajoutee-et-partage",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?",
  ],
  titre: "La valeur ajoutée et son partage",
  accroche:
    "Ce que l'entreprise crée vraiment, une fois retiré ce qu'elle a acheté à d'autres. Et qui en profite : les salariés, les prêteurs, l'État, l'entreprise elle-même.",
  objectifs: [
    "Distinguer la production et les consommations venues d'autres entreprises",
    "Calculer la valeur ajoutée et le taux de valeur ajoutée",
    "Calculer le partage de la valeur ajoutée",
    "Interpréter ce partage, et voir ce qui le fait bouger",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "la valeur ajoutée se lit ici sur le premier exercice de NOVA dans la simulation du cours, celui du chapitre « Le compte de résultat » ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que l'entreprise crée",
      notions: ["income_statement"],
      texte: (c) => {
        const v = valeurAjoutee(c);
        return [
          `En vendant ${eur(v.k.ventes)} d'enceintes dans l'année, ${v.k.entreprise} n'a pas créé ${eur(v.k.ventes)} de richesse : une partie de ce prix paie ce qu'elle a acheté à d'autres entreprises (les composants, l'emballage, le transport, l'énergie, le local, l'assurance). Cette part, ce sont les consommations ; la richesse que d'autres ont créée.`,
          `${v.k.entreprise} fabrique ce qu'elle vend, sans garder d'enceintes en stock : sa production de l'année est ses ventes. Ce qui reste, une fois les consommations retirées, est la valeur ajoutée : la richesse que l'entreprise a créée elle-même, par le travail de son équipe et l'usage de sa ligne.`,
        ];
      },
      tableau: (c) => {
        const v = valeurAjoutee(c);
        return {
          titre: "La production et les consommations de l'année",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Production de l'année (les ventes d'enceintes)", valeurs: [eur(v.k.ventes)] },
            ...v.k.lignes.filter((l) => l.consommation).map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })),
          ],
        };
      },
      repere: () => "Valeur ajoutée = production − consommations venues d'autres entreprises.",
    },
    {
      id: "va",
      objectifs: [0, 1],
      type: "montants",
      titre: "La valeur ajoutée",
      notions: ["income_statement"],
      question: (c) => `Calculez le total des consommations venues d'autres entreprises, la valeur ajoutée ${dE(valeurAjoutee(c).k.entreprise)}, puis le taux de valeur ajoutée (valeur ajoutée ÷ ventes × 100), au dixième.`,
      champs: (c) => {
        const v = valeurAjoutee(c);
        const conso = v.k.lignes.filter((l) => l.consommation).map((l) => eur(l.montant));
        return [
          { libelle: "Consommations", attendu: v.consommations, calcul: `${conso.join(" + ")} = ${eur(v.consommations)}`, tolerance: 1 },
          { libelle: "Valeur ajoutée", attendu: v.va, calcul: `${eur(v.k.ventes)} − ${eur(v.consommations)} = ${eur(v.va)}`, tolerance: 2 },
          { libelle: "Taux de valeur ajoutée (%)", attendu: v.tauxDeValeurAjoutee, calcul: `${eur(v.va)} ÷ ${eur(v.k.ventes)} × 100 = ${pct(v.tauxDeValeurAjoutee)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const v = valeurAjoutee(c);
        return [
          `Sur 100 € de ventes, ${v.k.entreprise} crée ${pct(v.tauxDeValeurAjoutee).replace(" %", " €")} de richesse ; le reste paie le travail d'autres entreprises, d'abord ses fournisseurs de composants. Un fabricant qui assemble des pièces achetées a souvent un taux faible ; une entreprise de services, dont la richesse est le travail de son équipe, un taux élevé.`,
        ];
      },
    },
    {
      id: "partage",
      objectifs: [2],
      type: "montants",
      titre: "Le partage de la valeur ajoutée",
      notions: ["income_statement"],
      tableau: (c) => {
        const v = valeurAjoutee(c);
        return {
          titre: "Qui reçoit la valeur ajoutée",
          colonnes: ["Montant"],
          lignes: v.parts.map((p) => ({ libelle: `${p.nom} (${p.quoi})`, valeurs: [eur(p.montant)] })),
        };
      },
      question: (c) => {
        const v = valeurAjoutee(c);
        return `La valeur ajoutée de ${eur(v.va)} se partage entre ceux qui ont contribué à la créer. Calculez la part des salariés et celle de l'entreprise elle-même, en pourcentage de la valeur ajoutée, au dixième.`;
      },
      champs: (c) => {
        const v = valeurAjoutee(c);
        const salaries = v.parts[0]!;
        const entreprise = v.parts[3]!;
        return [
          { libelle: "Part des salariés (%)", attendu: salaries.part, calcul: `${eur(salaries.montant)} ÷ ${eur(v.va)} × 100 = ${pct(salaries.part)}`, tolerance: 0.1 },
          { libelle: "Part de l'entreprise (%)", attendu: entreprise.part, calcul: `${eur(entreprise.montant)} ÷ ${eur(v.va)} × 100 = ${pct(entreprise.part)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const v = valeurAjoutee(c);
        const entreprise = v.parts[3]!;
        return [
          entreprise.montant >= 0 && v.k.resultatNet >= 0
            ? `L'entreprise garde ${pct(entreprise.part)} de la richesse qu'elle crée : de quoi remplacer sa ligne usée, couvrir les risques de l'année et financer sa croissance. La simulation du cours ne verse pas de dividendes aux associés : leur part reste dans l'entreprise.`
            : `La part de l'entreprise n'est que de ${pct(entreprise.part)} : elle ne garde presque rien pour remplacer son équipement ni pour se développer.`,
          `Ce qu'elle garde se retrouve dans son compte de résultat : l'usure et les risques de l'année (${eur(v.k.dotations)}) et le résultat (${eur(v.k.resultatNet)}), moins les revenus du compte à terme (${eur(v.k.produitsFinanciers)}), qui ne viennent pas de son activité.`,
        ];
      },
    },
    {
      id: "premiere-part",
      objectifs: [3],
      type: "choix",
      titre: "La plus grosse part",
      notions: ["income_statement", "productivity"],
      question: (c) => `Qui reçoit la plus grosse part de la valeur ajoutée ${dE(valeurAjoutee(c).k.entreprise)} ?`,
      options: (c) => {
        const v = valeurAjoutee(c);
        return v.parts.map((p) => ({
          texte: p.nom,
          juste: p.code === v.premiere.code,
          retour:
            p.code === v.premiere.code
              ? `Oui : ${eur(p.montant)}, soit ${pct(p.part)} de la valeur ajoutée. ${p.code === "salaries" ? "C'est le cas de la plupart des entreprises : la richesse créée paie d'abord le travail qui la crée." : "C'est rare : d'ordinaire, les salariés reçoivent la plus grosse part."}`
              : `Non : ${eur(p.montant)}, soit ${pct(p.part)}, contre ${pct(v.premiere.part)} pour « ${v.premiere.nom} ».`,
        }));
      },
    },
    {
      id: "la-richesse-qui-paie-l-equipe",
      objectifs: [3],
      type: "curseur",
      titre: "La richesse qui paie l'équipe",
      notions: ["income_statement", "productivity"],
      question: (c) => {
        const v = valeurAjoutee(c);
        return `La valeur ajoutée paie d'abord les salariés. Faites varier les enceintes vendues dans l'année : chacune ajoute ${eur(v.k.prix)} à la production et ${eur(v.k.coutVariable)} aux consommations (composants, emballage, transport, énergie) ; le local et l'assurance ne bougent pas, ni le personnel (${eur(v.k.personnel)}). Placez le curseur sur le plus petit nombre d'enceintes où la valeur ajoutée paie toute l'équipe, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes vendues dans l'année", unite: "enceintes" }),
      cible: (c) => ({ attendu: enceintesQuiPaientLEquipe(valeurAjoutee(c)), min: ENCEINTES_DU_CURSEUR.min, max: ENCEINTES_DU_CURSEUR.max }),
      zones: ["La valeur ajoutée paie l'équipe", "La valeur ajoutée ne suffit pas"],
      rates: () => ({
        dessous: "À cette position, la valeur ajoutée ne suffit pas à payer les salaires et les cotisations.",
        dessus: "Avec moins d'enceintes, la valeur ajoutée paie encore l'équipe : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer la quantité",
      lecture: (c, q) => {
        const v = valeurAjoutee(c);
        const va = vaPour(v, q);
        return [
          { libelle: "Valeur ajoutée", montant: va },
          { libelle: "Personnel (salaires et cotisations)", montant: v.k.personnel },
          { libelle: "Ce qui reste aux prêteurs, à l'État et à l'entreprise", montant: auCentime(va - v.k.personnel), fort: true },
        ];
      },
      droites: (c) => {
        const v = valeurAjoutee(c);
        return { produit: (q) => vaPour(v, q), cout: () => v.k.personnel, libelles: ["Valeur ajoutée", "Personnel"] };
      },
      explication: (c) => {
        const v = valeurAjoutee(c);
        const q = enceintesQuiPaientLEquipe(v);
        return [
          `Il faut ${qte(q)} enceintes pour que la richesse créée paie toute l'équipe. ${v.k.entreprise} en a vendu ${qte(v.k.quantite)} : au-delà de ${qte(q)}, chaque enceinte laisse ${eur(v.k.margeParEnceinte)} à partager entre les prêteurs, l'État et l'entreprise.`,
          "Le partage dépend donc de la richesse créée : quand l'activité baisse, la part des salariés grandit d'elle-même, parce que les salaires ne baissent pas avec les ventes.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-partage",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du partage",
      notions: ["income_statement", "pay_and_motivation"],
      question: (c) => {
        const v = valeurAjoutee(c);
        return `L'équipe demande une hausse des salaires. Faites varier la hausse (salaires et cotisations) et les enceintes vendues : la valeur ajoutée, l'impôt et le résultat se refont, et le partage avec eux. Aujourd'hui, ${v.k.entreprise} garde ${pct(v.parts[3]!.part)} de sa valeur ajoutée. Relevez le défi.`;
      },
      leviers: () => [
        { code: "hausse", libelle: "Hausse des salaires et des cotisations", unite: "%", ...LEVIERS_DU_PARTAGE.hausse, depart: 0 },
        { code: "ventes", libelle: "Enceintes vendues, par rapport à l'année", unite: "%", ...LEVIERS_DU_PARTAGE.ventes, depart: 0 },
      ],
      lecture: (c, p) => {
        const v = valeurAjoutee(c);
        const x = partageDuLaboratoire(v, p);
        return [
          { libelle: "Valeur ajoutée", montant: x.va, reference: v.va },
          ...x.parts.map((q, i) => ({ libelle: LIBELLE_DE_LA_PART[q.code]!, montant: q.part, unite: "%", reference: v.parts[i]!.part })),
          { libelle: "Ce que garde l'entreprise", montant: x.entreprise, reference: v.entreprise, fort: true },
        ];
      },
      graphique: (c) => {
        const v = valeurAjoutee(c);
        return {
          levier: "hausse",
          courbes: [
            { libelle: "Part des salariés", valeur: (p) => partageDuLaboratoire(v, p).parts[0]!.part },
            { libelle: "Part de l'entreprise", valeur: (p) => partageDuLaboratoire(v, p).parts[3]!.part },
          ],
          unite: "%",
        };
      },
      defi: (c) => {
        const v = valeurAjoutee(c);
        return {
          consigne: `Accordez une hausse de ${pct(HAUSSE_DU_DEFI)} des salaires, en gardant à l'entreprise au moins un tiers de la valeur ajoutée.`,
          atteint: (p) => p.hausse! >= HAUSSE_DU_DEFI && partageDuLaboratoire(v, p).partGardee >= PART_GARDEE_DU_DEFI,
          indice: (p) => {
            const x = partageDuLaboratoire(v, p);
            return p.hausse! < HAUSSE_DU_DEFI
              ? `La hausse n'est que de ${pct(p.hausse!)} : le défi en demande ${pct(HAUSSE_DU_DEFI)}.`
              : `L'entreprise ne garde que ${pct(auDixieme(x.partGardee * 100))} de la valeur ajoutée. Pour payer la hausse sans prendre sur sa part, il faut créer plus de richesse.`;
          },
          solution: SOLUTION_DU_PARTAGE,
        };
      },
      explication: (c, p) => {
        const v = valeurAjoutee(c);
        const x = partageDuLaboratoire(v, p);
        return [
          `Défi relevé : avec ${pct(p.hausse!)} de hausse et ${qte(x.k.quantite)} enceintes vendues, la valeur ajoutée est de ${eur(x.va)} ; les salariés en reçoivent ${pct(x.parts[0]!.part)}, l'entreprise en garde ${pct(auDixieme(x.partGardee * 100))}.`,
          "À richesse égale, ce que l'un reçoit de plus, un autre le perd : la hausse des salaires réduit d'abord la part de l'entreprise, et celle de l'État avec l'impôt. Pour augmenter les salaires sans s'appauvrir, l'entreprise doit créer plus de valeur : vendre plus, ou consommer moins pour produire autant.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement"],
      texte: (c) => {
        const v = valeurAjoutee(c);
        return [
          `Sur l'année, ${v.k.entreprise} crée ${eur(v.va)} de valeur ajoutée, soit ${pct(v.tauxDeValeurAjoutee)} de ses ventes. Les salariés en reçoivent ${pct(v.parts[0]!.part)}, l'entreprise en garde ${pct(v.parts[3]!.part)}.`,
          "La valeur ajoutée mesure la richesse créée, pas le profit. Son partage dit qui en profite : un partage où l'entreprise ne garde rien l'empêche d'investir, un partage où elle garde tout se fait au détriment des salariés. C'est un enjeu de gestion, et un enjeu social. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Valeur ajoutée = salariés (personnel) + prêteurs (intérêts) + État (impôt) + entreprise (ce qu'elle garde).",
    },
  ],
};
