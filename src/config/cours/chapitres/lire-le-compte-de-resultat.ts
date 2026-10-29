import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, compteDuLycee, exerciceDe } from "../monde/comptes-du-lycee";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COMPTE DE RÉSULTAT (Bac STMG, gestion et finance, palier 1).
 *
 * Ce que l'année a rapporté : les produits, les charges, et ce qui reste entre les deux. Le
 * chapitre lit le compte de résultat du premier exercice de NOVA, range les charges selon leur
 * nature (celles de l'activité, celles du financement, l'impôt), calcule le résultat et ce qu'il
 * représente sur cent euros de ventes, compare le résultat de l'activité à celui de l'année, puis
 * fait bouger les ventes : un curseur sur les enceintes vendues (à partir de combien l'activité
 * gagne-t-elle de l'argent ?) et un laboratoire du prix et des ventes (le défi : un taux de
 * résultat d'au moins 8 %).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : l'exercice de NOVA de la fiche figée
 * (monde/exercice-de-nova.ts), clôturé par le modèle du cours et rangé en lignes du lycée
 * (monde/comptes-du-lycee.ts, `compteDuLycee`) : les mêmes chiffres que « Soldes intermédiaires
 * de gestion », au centime. Les hypothèses des variantes sont celles du modèle (une enceinte de
 * plus coûte ses composants et ses autres coûts variables, rien d'autre) ; celles du chapitre, les
 * constantes ci-dessous.
 */

/** Les bornes du curseur des enceintes vendues dans l'année. */
export const ENCEINTES_DU_CURSEUR = { min: 15_000, max: 26_000 } as const;

/** Les leviers du laboratoire : le prix de l'enceinte, en euros, et les ventes, en % de celles de l'année. */
export const LEVIERS_DU_COMPTE = {
  prix: { min: 55, max: 65, pas: 1 },
  ventes: { min: -20, max: 20, pas: 5 },
} as const;

/** Le défi du laboratoire : un résultat net d'au moins 8 % des ventes. */
export const TAUX_DU_DEFI = 0.08;

/** La solution que montre la correction : l'enceinte à 62 €, le premier prix qui relève le défi, les mêmes ventes. */
export const SOLUTION_DU_COMPTE = { prix: 62, ventes: 0 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Pourquoi chaque charge a sa nature, dit à l'élève au tri. */
const POURQUOI: Readonly<Record<string, string>> = {
  composants: "Ce qu'il faut acheter pour fabriquer les enceintes : c'est l'activité.",
  emballage: "Emballer, transporter et faire tourner la chaîne : c'est l'activité.",
  loyer: "Le local où l'on fabrique : il permet l'activité.",
  assurance: "Assurer le local et la ligne : une charge de l'activité.",
  personnel: "Les salaires de l'équipe qui fait tourner l'entreprise.",
  usure: "La ligne s'use en servant l'activité : sa perte de valeur est une charge de l'activité.",
  risques: "Un client qui ne paiera qu'en partie, un litige probable : des risques nés de l'activité.",
  interets: "Le prix de l'argent prêté par la banque : c'est le financement, pas l'activité.",
  escompte: "Une remise accordée au client qui paie plus tôt : le prix de l'argent reçu d'avance, donc le financement.",
  impot: "L'État prélève une part du bénéfice de l'année.",
};

/** Le compte de résultat de l'année, ses totaux et ses taux. */
export function compteDeResultat(c: Pick<Cas, "code">) {
  const k = compteDuLycee(exerciceDe(c.code));
  return {
    ...k,
    tauxDeResultat: auDixieme(k.tauxDeResultat * 100),
    partDuPersonnel: auDixieme((k.personnel / k.charges) * 100),
    benefice: k.resultatNet >= 0,
    /** Ce que laisse une enceinte de plus, une fois ses coûts variables payés : son prix moins son coût variable. */
    margeParEnceinte: auCentime(k.prix - k.coutVariable),
  };
}

export type CompteDeResultat = ReturnType<typeof compteDeResultat>;

/** Les enceintes à partir desquelles l'activité ne perd plus d'argent, les autres charges inchangées. */
export function seuilDeLActivite(k: CompteDeResultat) {
  return Math.ceil(k.quantiteDeLaFiche - k.resultatDActivite / k.margeParEnceinte - 1e-9);
}

/** Les charges de l'activité pour un nombre d'enceintes : celles de l'année, plus ou moins les coûts variables. */
const chargesDeLActivite = (k: CompteDeResultat, q: number) => auCentime(k.activite + k.coutVariable * (q - k.quantiteDeLaFiche));

/** Une position du laboratoire : le prix, et les ventes en % de celles de l'année. */
export function compteDuLaboratoire(k: CompteDeResultat, p: Readonly<Record<string, number>>) {
  return compteDuLycee(k.f, { prix: p.prix!, quantite: Math.round(k.quantiteDeLaFiche * (1 + p.ventes! / 100)) });
}

/** Le compte de résultat de l'année, ligne par ligne : les produits, puis les charges retranchées. */
export function tableauDuCompte(c: Pick<Cas, "code">, titre?: string): TableauDeDonnees {
  const k = compteDeResultat(c);
  return {
    titre: titre ?? `Le premier exercice ${dE(k.entreprise)} dans la simulation du cours`,
    colonnes: ["Montant"],
    lignes: k.lignes.map((l) => ({ libelle: l.libelle, valeurs: [l.nature === "produit" ? eur(l.montant) : `− ${eur(l.montant)}`] })),
  };
}

export const LIRE_LE_COMPTE_DE_RESULTAT: Chapitre = {
  code: "lire-le-compte-de-resultat",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
    "2de MG · Évaluer et évoluer, du pilotage aux développements numériques",
    "2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?",
  ],
  titre: "Le compte de résultat : ce que l'année a rapporté",
  accroche:
    "Les produits d'un côté, les charges de l'autre, et ce qui reste entre les deux : le résultat. Lire l'année d'une entreprise, dire ce qu'elle gagne sur cent euros de ventes, et voir ce que changent ses ventes et son prix.",
  objectifs: [
    "Distinguer produits et charges",
    "Ranger les charges selon leur nature : activité, financement, impôt",
    "Calculer le résultat de l'année",
    "Calculer et interpréter un taux de résultat",
    "Distinguer le résultat de l'activité et le résultat de l'année",
    "Mesurer ce que les ventes et le prix changent au résultat",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le compte de résultat se lit ici sur le premier exercice de NOVA dans la simulation du cours, tenu en comptabilité de la création à la clôture ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année d'activité",
      notions: ["income_statement"],
      texte: (c) => {
        const k = compteDeResultat(c);
        return [
          `Le compte de résultat raconte une année : ce que l'entreprise a gagné (les produits) et ce que cela lui a coûté (les charges). Voici le premier exercice ${dE(k.entreprise)}, qui fabrique des enceintes, dans la simulation du cours.`,
          `Les produits sont surtout les ventes : ${eur(k.ventes)}, ${qte(k.quantite)} enceintes à ${eur(k.prix)}. S'y ajoutent les revenus de son compte à terme, ${eur(k.produitsFinanciers)}. Les charges sont de trois natures : celles de l'activité (composants, personnel, loyer, usure de la ligne...), celles du financement (les intérêts de l'emprunt, les escomptes) et l'impôt sur les bénéfices.`,
        ];
      },
      tableau: (c) => tableauDuCompte(c),
      repere: () => "Résultat = produits − charges. Positif, c'est un bénéfice ; négatif, une perte.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "La nature des charges",
      notions: ["income_statement"],
      question: () => "Rangez chaque charge selon sa nature : elle vient de l'activité de l'entreprise, de son financement, ou c'est l'impôt sur les bénéfices.",
      categories: [
        { code: "exploitation", libelle: "Activité" },
        { code: "financiere", libelle: "Financement" },
        { code: "impot", libelle: "Impôt" },
      ],
      elements: (c) => {
        const k = compteDeResultat(c);
        const categorie = { activite: "exploitation", financement: "financiere", impot: "impot" } as const;
        return k.lignes
          .filter((l) => l.nature !== "produit" && l.montant > 0)
          .map((l) => ({ libelle: l.libelle, montant: l.montant, categorie: categorie[l.nature as keyof typeof categorie], pourquoi: POURQUOI[l.code]! }));
      },
      explication: () => [
        "Les distinguer, c'est savoir d'où vient le résultat : de l'activité elle-même, ou de la façon dont l'entreprise est financée.",
      ],
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Le résultat de l'année",
      notions: ["income_statement", "revenue"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Calculez le total des produits (les ventes et les revenus du compte à terme), le total des charges (activité ${eur(k.activite)}, financement ${eur(k.financement)}, impôt ${eur(k.impot)}), puis le résultat de l'année ${dE(k.entreprise)}.`;
      },
      champs: (c) => {
        const k = compteDeResultat(c);
        return [
          { libelle: "Total des produits", attendu: k.produits, calcul: `${eur(k.ventes)} + ${eur(k.produitsFinanciers)} = ${eur(k.produits)}`, tolerance: 1 },
          { libelle: "Total des charges", attendu: k.charges, calcul: `${eur(k.activite)} + ${eur(k.financement)} + ${eur(k.impot)} = ${eur(k.charges)}`, tolerance: 1 },
          { libelle: "Résultat de l'année", attendu: k.resultatNet, calcul: `${eur(k.produits)} − ${eur(k.charges)} = ${eur(k.resultatNet)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = compteDeResultat(c);
        return [
          k.benefice
            ? `${k.entreprise} termine l'année sur un bénéfice de ${eur(k.resultatNet)} : ses produits ont couvert toutes ses charges, et il en reste.`
            : `${k.entreprise} termine l'année sur une perte de ${eur(-k.resultatNet)} : ses produits n'ont pas couvert toutes ses charges.`,
          "C'est le résultat de la clôture de l'exercice, au centime : celui que le chapitre « Soldes intermédiaires de gestion » lit solde par solde.",
        ];
      },
    },
    {
      id: "taux",
      type: "montants",
      titre: "Sur cent euros de ventes",
      notions: ["income_statement", "margin_rates"],
      question: (c) =>
        `Pour comparer des entreprises de tailles différentes, on rapporte le résultat aux ventes. Calculez le taux de résultat ${dE(compteDeResultat(c).entreprise)} (résultat ÷ ventes × 100), puis la part du personnel dans ses charges, en pourcentage au dixième.`,
      champs: (c) => {
        const k = compteDeResultat(c);
        return [
          { libelle: "Taux de résultat (%)", attendu: k.tauxDeResultat, calcul: `${eur(k.resultatNet)} ÷ ${eur(k.ventes)} × 100 = ${pct(k.tauxDeResultat)}`, tolerance: 0.1 },
          { libelle: "Part du personnel dans les charges (%)", attendu: k.partDuPersonnel, calcul: `${eur(k.personnel)} ÷ ${eur(k.charges)} × 100 = ${pct(k.partDuPersonnel)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = compteDeResultat(c);
        return [
          k.benefice
            ? `Sur 100 € de ventes, ${k.entreprise} garde ${pct(k.tauxDeResultat).replace(" %", " €")} de bénéfice. Le reste a payé ses charges, dont le personnel, qui en représente ${pct(k.partDuPersonnel)} : chez un fabricant, ce sont les composants et les autres achats qui pèsent le plus.`
            : `Sur 100 € de ventes, ${k.entreprise} perd ${pct(-k.tauxDeResultat).replace(" %", " €")}. Le personnel représente ${pct(k.partDuPersonnel)} de ses charges.`,
        ];
      },
    },
    {
      id: "activite-ou-financement",
      type: "choix",
      titre: "L'activité ou le financement",
      notions: ["income_statement"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Avant le financement et l'impôt, l'activité seule ${dE(k.entreprise)} dégage ${eur(k.resultatDActivite)} (les ventes moins les charges de l'activité). Que dit ce chiffre ?`;
      },
      options: (c) => {
        const k = compteDeResultat(c);
        const activiteRentable = k.resultatDActivite > 0;
        return [
          {
            texte: "L'activité est rentable : ce sont le financement et l'impôt qui réduisent le résultat",
            juste: activiteRentable,
            retour: activiteRentable
              ? `Oui : l'activité dégage ${eur(k.resultatDActivite)}. Le financement (${eur(k.financement)} de charges, en partie couvertes par les ${eur(k.produitsFinanciers)} du compte à terme) et l'impôt (${eur(k.impot)}) en prennent une part, et il reste ${eur(k.resultatNet)}.`
              : `Non : l'activité elle-même perd ${eur(-k.resultatDActivite)}, avant même le financement et l'impôt.`,
          },
          {
            texte: "L'activité elle-même perd de l'argent : le problème n'est pas le financement",
            juste: !activiteRentable,
            retour: !activiteRentable
              ? `Oui : avant le financement, l'activité perd déjà ${eur(-k.resultatDActivite)}. Ce sont les ventes et les charges de l'activité qu'il faut revoir.`
              : `Non : l'activité dégage ${eur(k.resultatDActivite)} avant le financement et l'impôt.`,
          },
          {
            texte: "On ne peut rien dire sans le bilan",
            juste: false,
            retour: "Non : le compte de résultat suffit pour séparer ce que gagne l'activité de ce que coûte le financement. Le bilan, lui, dira ce que l'entreprise possède, et ce qu'elle doit.",
          },
        ];
      },
    },
    {
      id: "le-seuil-de-l-activite",
      type: "curseur",
      titre: "Combien d'enceintes pour gagner de l'argent",
      notions: ["income_statement", "breakeven"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Et si ${k.entreprise} avait vendu moins ? Faites varier les enceintes vendues dans l'année. Chaque enceinte rapporte ${eur(k.prix)} et coûte ${eur(k.coutVariable)} de composants, d'emballage, de transport et d'énergie ; le loyer, le personnel, l'assurance et l'usure de la ligne ne bougent pas. Placez le curseur sur le plus petit nombre d'enceintes où l'activité ne perd pas d'argent, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes vendues dans l'année", unite: "enceintes" }),
      cible: (c) => {
        const k = compteDeResultat(c);
        return { attendu: seuilDeLActivite(k), min: ENCEINTES_DU_CURSEUR.min, max: ENCEINTES_DU_CURSEUR.max };
      },
      zones: ["L'activité gagne de l'argent", "L'activité perd de l'argent"],
      rates: () => ({
        dessous: "À cette position, les charges de l'activité dépassent les ventes : l'activité perd de l'argent.",
        dessus: "Avec moins d'enceintes, l'activité gagne encore de l'argent : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, q) => {
        const k = compteDeResultat(c);
        const ventes = auCentime(q * k.prix);
        const charges = chargesDeLActivite(k, q);
        return [
          { libelle: "Ventes de l'année", montant: ventes },
          { libelle: "Charges de l'activité", montant: charges },
          { libelle: "Résultat de l'activité", montant: auCentime(ventes - charges), fort: true },
        ];
      },
      droites: (c) => {
        const k = compteDeResultat(c);
        return {
          produit: (q) => q * k.prix,
          cout: (q) => chargesDeLActivite(k, q),
          libelles: ["Ventes", "Charges de l'activité"],
        };
      },
      explication: (c) => {
        const k = compteDeResultat(c);
        const seuil = seuilDeLActivite(k);
        return [
          `Il faut ${qte(seuil)} enceintes pour que l'activité ne perde plus d'argent. ${k.entreprise} en a vendu ${qte(k.quantite)} : ${qte(k.quantite - seuil)} de plus, et chacune a laissé ${eur(k.margeParEnceinte)} une fois ses coûts variables payés.`,
          "Les charges qui ne bougent pas avec les ventes (le loyer, le personnel, l'usure de la ligne) se paient quelle que soit l'année : c'est pourquoi une baisse des ventes pèse si vite sur le résultat.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-compte",
      type: "simulation",
      titre: "Le laboratoire du prix et des ventes",
      notions: ["income_statement", "margin_rates"],
      question: (c) => {
        const k = compteDeResultat(c);
        return `Faites varier le prix de l'enceinte et les enceintes vendues. Le compte de résultat se refait : les ventes, les coûts variables des enceintes, l'impôt ; le reste ne bouge pas, et le cours suppose que le prix ne change pas le nombre d'enceintes vendues. Aujourd'hui, le taux de résultat ${dE(k.entreprise)} est de ${pct(k.tauxDeResultat)}. Relevez le défi.`;
      },
      leviers: (c) => {
        const k = compteDeResultat(c);
        return [
          { code: "prix", libelle: "Prix de l'enceinte, hors taxes", unite: "€", ...LEVIERS_DU_COMPTE.prix, depart: k.prix },
          { code: "ventes", libelle: "Enceintes vendues, par rapport à l'année", unite: "%", ...LEVIERS_DU_COMPTE.ventes, depart: 0 },
        ];
      },
      lecture: (c, p) => {
        const k = compteDeResultat(c);
        const x = compteDuLaboratoire(k, p);
        return [
          { libelle: "Enceintes vendues", montant: x.quantite, unite: "enceintes", reference: k.quantite },
          { libelle: "Ventes de l'année", montant: x.ventes, reference: k.ventes },
          { libelle: "Charges de l'activité", montant: x.activite, reference: k.activite },
          { libelle: "Résultat de l'activité", montant: x.resultatDActivite, reference: k.resultatDActivite },
          { libelle: "Impôt sur les bénéfices", montant: x.impot, reference: k.impot },
          { libelle: "Résultat net", montant: x.resultatNet, reference: k.resultatNet, fort: true },
          { libelle: "Taux de résultat", montant: auDixieme(x.tauxDeResultat * 100), unite: "%", reference: k.tauxDeResultat },
        ];
      },
      graphique: (c) => {
        const k = compteDeResultat(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "Résultat de l'activité", valeur: (p) => compteDuLaboratoire(k, p).resultatDActivite },
            { libelle: "Résultat net", valeur: (p) => compteDuLaboratoire(k, p).resultatNet },
          ],
        };
      },
      defi: (c) => {
        const k = compteDeResultat(c);
        return {
          consigne: `Portez le taux de résultat à ${pct(TAUX_DU_DEFI * 100)} au moins.`,
          atteint: (p) => compteDuLaboratoire(k, p).tauxDeResultat >= TAUX_DU_DEFI,
          indice: (p) => {
            const x = compteDuLaboratoire(k, p);
            return `Le taux de résultat est de ${pct(auDixieme(x.tauxDeResultat * 100))}. Un euro de plus sur le prix rapporte un euro par enceinte vendue, sans aucune charge en plus ; une enceinte de plus ne rapporte que ce qui reste après ses coûts variables.`;
          },
          solution: SOLUTION_DU_COMPTE,
        };
      },
      explication: (c, p) => {
        const k = compteDeResultat(c);
        const x = compteDuLaboratoire(k, p);
        return [
          `Défi relevé : ${qte(x.quantite)} enceintes à ${eur(x.prix)} donnent un résultat net de ${eur(x.resultatNet)}, soit ${pct(auDixieme(x.tauxDeResultat * 100))} des ventes.`,
          `Le prix agit fort : chaque euro de plus par enceinte va tout entier au résultat de l'activité, ${eur(x.quantite)} de plus sur l'année, dont l'impôt reprend une part. Mais un client qui trouve l'enceinte trop chère peut ne pas l'acheter : c'est la question de la mercatique, que ce laboratoire laisse de côté.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["income_statement"],
      texte: (c) => {
        const k = compteDeResultat(c);
        return [
          `Sur l'année, ${k.entreprise} a réalisé ${eur(k.ventes)} de ventes et ${k.benefice ? `un bénéfice de ${eur(k.resultatNet)}` : `une perte de ${eur(-k.resultatNet)}`}, soit ${pct(k.tauxDeResultat)} de ses ventes. Son activité ne perd plus d'argent dès ${qte(seuilDeLActivite(k))} enceintes.`,
          "Le compte de résultat dit si l'entreprise gagne de l'argent, et d'où vient ce qu'elle gagne ou perd : de son activité, de son financement, de l'impôt. Il ne dit pas si elle a de l'argent en caisse : c'est la trésorerie, une autre question. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Compte de résultat : produits − charges = résultat. Taux de résultat = résultat ÷ chiffre d'affaires × 100.",
    },
  ],
};
