import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { gammeDuMois, type CompteDuPortefeuille } from "../gamme";
import { PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE, PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE, SEUILS_ABC } from "../negociation";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE PORTEFEUILLE CLIENTS, LA MÉTHODE ABC (BTS NDRC, palier 4).
 *
 * Le commercial n'a pas le temps de traiter tous ses comptes de la même façon : il les classe
 * par le chiffre d'affaires qu'ils font, du plus gros au plus petit, et coupe le portefeuille
 * en trois classes. Le chapitre fait le classement, mesure la concentration (la loi des 20/80
 * se vérifie-t-elle ?), le confronte à la marge, et décide de ce qu'on fait de chaque classe.
 *
 * L'arène ne suit pas de client un par un : les comptes du chapitre sont les clientèles de
 * chaque référence de la gamme (chaque référence a les siennes), sur le premier trimestre en
 * gamme ramené à un mois (`gammeDuMois`). Les seuils de la méthode, et le nombre de comptes
 * sous lequel elle ne dit rien, sont posés dans `negociation.ts`.
 */

/** Les entreprises dont la gamme compte assez de comptes pour un classement en trois classes. */
export const PORTEFEUILLES = ["boutique", "bistrot", "ecommerce"] as const;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export type Classe = "A" | "B" | "C";

export interface CompteClasse extends CompteDuPortefeuille {
  rang: number;
  part: number;
  cumul: number;
  classe: Classe;
}

/** Le portefeuille classé par chiffre d'affaires, et ce que pèse chaque classe. */
export function portefeuilleABC(c: Cas) {
  const g = gammeDuMois(c.code)!;
  const tries = [...g.comptes].sort((a, b) => b.chiffreDAffaires - a.chiffreDAffaires);
  const total = tries.reduce((t, k) => t + k.chiffreDAffaires, 0);
  let cumule = 0;
  const comptes: CompteClasse[] = tries.map((k, i) => {
    cumule += k.chiffreDAffaires;
    const cumul = auDixieme((cumule / total) * 100);
    const classe: Classe = i === 0 || cumul <= SEUILS_ABC.a ? "A" : cumul <= SEUILS_ABC.b ? "B" : "C";
    return { ...k, rang: i + 1, part: auDixieme((k.chiffreDAffaires / total) * 100), cumul, classe };
  });
  const de = (x: Classe) => comptes.filter((k) => k.classe === x);
  const enA = de("A");
  const caEnA = enA.reduce((t, k) => t + k.chiffreDAffaires, 0);
  const margeTotale = comptes.reduce((t, k) => t + k.marge, 0);
  const parMarge = [...comptes].sort((a, b) => b.marge - a.marge);
  return {
    libelle: g.libelle,
    comptes,
    total,
    premier: comptes[0]!,
    troisPremiers: auDixieme((comptes.slice(0, 3).reduce((t, k) => t + k.chiffreDAffaires, 0) / total) * 100),
    classes: { A: enA, B: de("B"), C: de("C") },
    nombreEnA: enA.length,
    partDesComptesEnA: auDixieme((enA.length / comptes.length) * 100),
    partDuCaEnA: auDixieme((caEnA / total) * 100),
    margeTotale,
    enTeteParMarge: parMarge[0]!,
    deuxiemeParMarge: parMarge[1]!,
    seuils: SEUILS_ABC,
  };
}

const nomDuCompte = (k: CompteDuPortefeuille) => k.nom;

export const PORTEFEUILLE_ABC: Chapitre = {
  code: "portefeuille-abc",
  parcours: "ndrc",
  palier: 4,
  blocs: [
    "BTS NDRC Bloc 1 · Relation client et négociation-vente",
    "Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale",
    "BUT TC · Manager la relation client",
    "BUT GACO · Assurer le développement des affaires, de la prospection à la fidélisation",
  ],
  titre: "Le portefeuille clients : la méthode ABC",
  accroche:
    "Tous les comptes ne pèsent pas le même poids. Les classer, mesurer ce que pèsent les plus gros, les confronter à la marge, et décider du temps que chacun mérite.",
  objectifs: [
    "Classer un portefeuille par chiffre d'affaires décroissant",
    "Calculer les parts et les parts cumulées",
    "Répartir les comptes en classes A, B et C",
    "Mesurer la concentration d'un portefeuille",
    "Confronter le classement à la marge, et adapter le traitement de chaque classe",
  ],
  libre: false,
  entreprises: {
    codes: PORTEFEUILLES,
    pourquoi: "ce chapitre classe un portefeuille d'au moins huit comptes, et seules les gammes les plus larges de l'arène en ont autant.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un portefeuille à classer",
      notions: ["customer_portfolio"],
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Dans l'arène, ${c.entreprise} vend ${p.libelle}, et chaque référence a ses propres clientèles. Ce sont les comptes de son portefeuille : ${qte(p.comptes.length)} comptes, qui font ensemble ${eur(p.total)} de chiffre d'affaires dans le mois.`,
          "Le tableau les range déjà du plus gros au plus petit : c'est la première étape de la méthode ABC. Reste à mesurer ce que pèse chacun, et ce que pèsent les premiers ensemble.",
          "L'arène ne suit pas de client un par un : un vrai portefeuille compte des dizaines ou des centaines de clients, et la méthode est la même.",
        ];
      },
      tableau: (c) => {
        const p = portefeuilleABC(c);
        return {
          titre: `Les comptes de ${c.entreprise} en un mois, par chiffre d'affaires décroissant`,
          colonnes: ["Chiffre d'affaires"],
          lignes: p.comptes.map((k) => ({ libelle: `${qte(k.rang)}. ${k.nom}`, valeurs: [eur(k.chiffreDAffaires)] })),
        };
      },
      repere: () => "Part d'un compte = son chiffre d'affaires ÷ le total. Part cumulée = la somme des parts, du premier compte jusqu'à lui.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "Ce que pèsent les premiers",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Le portefeuille fait ${eur(p.total)} dans le mois. Calculez la part du premier compte (${p.premier.nom}, ${eur(p.premier.chiffreDAffaires)}), puis la part cumulée des trois premiers, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const p = portefeuilleABC(c);
        const trois = p.comptes.slice(0, 3);
        return [
          { libelle: "Part du premier compte (%)", attendu: p.premier.part, calcul: `${eur(p.premier.chiffreDAffaires)} ÷ ${eur(p.total)} × 100 = ${pct(p.premier.part)}`, tolerance: 0.1 },
          {
            libelle: "Part cumulée des trois premiers (%)",
            attendu: p.troisPremiers,
            calcul: `(${trois.map((k) => eur(k.chiffreDAffaires)).join(" + ")}) ÷ ${eur(p.total)} × 100 = ${pct(p.troisPremiers)}`,
            tolerance: 0.2,
          },
        ];
      },
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [`Les trois premiers comptes sur ${qte(p.comptes.length)} font ${pct(p.troisPremiers)} du chiffre d'affaires. C'est la question de la méthode : combien de comptes faut-il pour faire l'essentiel des ventes ?`];
      },
    },
    {
      id: "classer",
      type: "tri",
      titre: "Les trois classes",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Rangez chaque compte dans sa classe : A pour les comptes qui font ensemble les premiers ${qte(p.seuils.a)} % du chiffre d'affaires, B pour ceux qui mènent la part cumulée jusqu'à ${qte(p.seuils.b)} %, C pour le reste. Calculez les parts cumulées dans l'ordre du tableau.`;
      },
      categories: [
        { code: "A", libelle: "Classe A" },
        { code: "B", libelle: "Classe B" },
        { code: "C", libelle: "Classe C" },
      ],
      elements: (c) =>
        portefeuilleABC(c).comptes.map((k) => ({
          libelle: nomDuCompte(k),
          montant: k.chiffreDAffaires,
          categorie: k.classe,
          pourquoi: `Part cumulée jusqu'à ce compte : ${pct(k.cumul)}.`,
        })),
      explication: (c) => {
        const p = portefeuilleABC(c);
        return [
          `${qte(p.classes.A.length)} comptes en A, ${qte(p.classes.B.length)} en B, ${qte(p.classes.C.length)} en C. Le compte qui fait passer la part cumulée au-delà d'un seuil appartient à la classe suivante.`,
        ];
      },
    },
    {
      id: "classement",
      type: "lecture",
      titre: "Le portefeuille classé",
      notions: ["customer_portfolio"],
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `La classe A réunit ${qte(p.nombreEnA)} comptes sur ${qte(p.comptes.length)}, et ${pct(p.partDuCaEnA)} du chiffre d'affaires. La classe C, ${qte(p.classes.C.length)} comptes, n'en fait que ${pct(auDixieme(100 - (p.classes.B.at(-1)?.cumul ?? p.classes.A.at(-1)!.cumul)))}.`,
        ];
      },
      tableau: (c) => {
        const p = portefeuilleABC(c);
        return {
          titre: "Le classement ABC",
          colonnes: ["Chiffre d'affaires", "Part", "Part cumulée", "Classe"],
          lignes: p.comptes.map((k) => ({ libelle: k.nom, valeurs: [eur(k.chiffreDAffaires), pct(k.part), pct(k.cumul), k.classe] })),
        };
      },
    },
    {
      id: "concentration",
      type: "choix",
      titre: "Un portefeuille concentré ?",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `On dit souvent que 20 % des clients font 80 % du chiffre d'affaires. Chez ${c.entreprise}, ${pct(p.partDesComptesEnA)} des comptes font ${pct(p.partDuCaEnA)} des ventes. Que dire de son portefeuille ?`;
      },
      options: (c) => {
        const p = portefeuilleABC(c);
        const concentre = p.partDesComptesEnA <= PART_DES_COMPTES_D_UN_PORTEFEUILLE_CONCENTRE;
        return [
          {
            texte: "Il est concentré : quelques comptes font l'essentiel des ventes",
            juste: concentre,
            retour: concentre
              ? `Oui : ${pct(p.partDesComptesEnA)} des comptes font ${pct(p.partDuCaEnA)} du chiffre d'affaires, près des 20/80. Perdre un compte A serait un coup dur : c'est le risque d'un portefeuille concentré.`
              : `Non : il faut ${pct(p.partDesComptesEnA)} des comptes, et non 20 %, pour faire ${pct(p.partDuCaEnA)} des ventes.`,
          },
          {
            texte: "Il est peu concentré : les ventes se répartissent sur beaucoup de comptes",
            juste: !concentre,
            retour: concentre
              ? `Non : ${pct(p.partDesComptesEnA)} des comptes suffisent à faire ${pct(p.partDuCaEnA)} des ventes.`
              : `Oui : il faut ${pct(p.partDesComptesEnA)} des comptes pour faire ${pct(p.partDuCaEnA)} des ventes, loin des 20/80. ${p.premier.part >= PART_D_UN_COMPTE_QUI_FAIT_COURIR_UN_RISQUE ? `Attention pourtant : le premier compte, « ${p.premier.nom} », pèse à lui seul ${pct(p.premier.part)} des ventes ; le perdre coûterait cher.` : "Aucun compte ne pèse assez pour mettre l'entreprise en danger s'il part ; en revanche, chaque compte demande du temps pour un chiffre modeste."}`,
          },
          {
            texte: "La loi des 20/80 se vérifie toujours, il suffit de bien compter",
            juste: false,
            retour: "Non : les 20/80 sont un ordre de grandeur souvent observé, pas une loi. Chaque portefeuille se mesure, et la méthode ABC sert justement à cette mesure.",
          },
        ];
      },
    },
    {
      id: "marge",
      type: "choix",
      titre: "Le classement par la marge",
      notions: ["customer_portfolio", "contribution_margin"],
      tableau: (c) => {
        const p = portefeuilleABC(c);
        return {
          titre: "Chiffre d'affaires et marge de chaque compte",
          colonnes: ["Chiffre d'affaires", "Marge", "Classe"],
          lignes: p.comptes.map((k) => ({ libelle: k.nom, valeurs: [eur(k.chiffreDAffaires), eur(k.marge), k.classe] })),
        };
      },
      question: (c) => `Le tableau donne aussi la marge de chaque compte : le chiffre d'affaires moins le coût variable des unités vendues, et la commission quand un partenaire en prend une. Le compte « ${portefeuilleABC(c).enTeteParMarge.nom} » laisse le plus de marge. Lequel arrive deuxième ?`,
      options: (c) => {
        const p = portefeuilleABC(c);
        const d = p.deuxiemeParMarge;
        const autres = p.comptes.filter((k) => k.code !== p.enTeteParMarge.code);
        const candidats = [...new Map([...autres.slice(0, 3), d].map((k) => [k.code, k])).values()];
        return candidats.map((k) => ({
          texte: k.nom,
          juste: k.code === d.code,
          retour:
            k.code === d.code
              ? `Oui : ${eur(k.marge)} de marge, ${k.rang === 2 ? "et il est aussi deuxième par le chiffre d'affaires" : `alors qu'il n'est que ${qte(k.rang)}e par le chiffre d'affaires : il vend moins, mais chaque vente lui laisse davantage`}. Classer par le chiffre d'affaires dit qui achète le plus ; classer par la marge dit qui rapporte le plus. Le commercial regarde les deux.`
              : `Non : ${eur(k.marge)} de marge, contre ${eur(d.marge)} pour le compte « ${d.nom} ».`,
        }));
      },
    },
    {
      id: "traiter",
      type: "choix",
      titre: "Que faire des comptes C ?",
      notions: ["customer_portfolio"],
      question: (c) => {
        const p = portefeuilleABC(c);
        return `Les ${qte(p.classes.C.length)} comptes de la classe C font peu de chiffre d'affaires. Que fait le commercial de ${c.entreprise} ?`;
      },
      options: () => [
        {
          texte: "Il les sert à moindre coût : offre standard, contact à distance, sans visite",
          juste: true,
          retour: "Oui : un compte C ne justifie pas le temps d'un compte A, mais il rapporte. On le sert par des moyens peu coûteux (le site, le téléphone, une offre standard) et on repère ceux qui pourraient grandir.",
        },
        {
          texte: "Il les abandonne, pour se concentrer sur les comptes A",
          juste: false,
          retour: "Non : les comptes C rapportent une marge, et certains seront les comptes B de demain. Les abandonner, c'est renoncer à cette marge pour un temps gagné qu'on peut obtenir autrement, en les servant à distance.",
        },
        {
          texte: "Il leur consacre autant de temps qu'aux comptes A, par équité",
          juste: false,
          retour: "Non : le temps du commercial est rare. Le même temps passé sur un compte A, qui pèse bien plus, rapporte bien davantage. La méthode ABC sert à répartir ce temps.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_portfolio"],
      texte: (c) => {
        const p = portefeuilleABC(c);
        return [
          `Chez ${c.entreprise}, ${qte(p.nombreEnA)} comptes sur ${qte(p.comptes.length)} font ${pct(p.partDuCaEnA)} des ventes : ce sont les comptes à visiter, à suivre de près, à ne pas perdre. Les comptes C se servent à distance, à moindre coût.`,
          "Le classement par le chiffre d'affaires ne suffit pas : un gros compte peut peu rapporter, un compte moyen beaucoup. Et un classement est une photographie : il se refait chaque période, parce que les comptes changent de classe.",
        ];
      },
      repere: () => `Méthode ABC : trier par chiffre d'affaires décroissant, cumuler les parts, couper à ${SEUILS_ABC.a} % (A) et ${SEUILS_ABC.b} % (B), le reste en C.`,
    },
  ],
};
