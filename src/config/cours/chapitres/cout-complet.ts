import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../accords";
import type { Cas } from "../cas";
import {
  ASSIETTE_D_APPROVISIONNEMENT,
  ASSIETTE_DE_DISTRIBUTION,
  CENTRES,
  REPARTITION_PRIMAIRE,
  REPARTITION_SECONDAIRE,
  type CodeDeCentre,
} from "../centres";
import type { Chapitre } from "../types";
import { chiffresDeGestion } from "./seuil-de-rentabilite";

/**
 * CHAPITRE : COÛT COMPLET ET CENTRES D'ANALYSE (contrôle de gestion, palier 3).
 *
 * Le même mois de janvier que « Le seuil de rentabilité », vu cette fois par la méthode
 * des coûts complets. Les charges ne se rangent plus en variables et fixes, mais en
 * directes (elles se rattachent au produit sans calcul) et indirectes (il faut les
 * répartir). L'élève répartit les charges indirectes entre quatre centres, puis le centre
 * administration sur les trois autres, calcule le coût de chaque unité d'œuvre, et
 * remonte la chaîne des coûts : coût d'achat, coût de production, coût de revient. Le
 * résultat analytique retrouve, au centime près, le résultat du seuil de rentabilité :
 * deux méthodes, un seul résultat. Il finit sur le piège du coût complet, une commande à
 * un prix sous ce coût mais au-dessus du coût variable.
 *
 * Les charges sont celles de l'arène ; les clés de répartition sont celles du cours
 * (`centres.ts`) : l'arène ne découpe pas ses charges par centre.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const PRINCIPAUX = ["approvisionnement", "production", "distribution"] as const;
/** La commande supplémentaire de la dernière question : une part des ventes du mois. */
const PART_DE_LA_COMMANDE = 0.1;

const libelleDe = (code: CodeDeCentre) => CENTRES.find((c) => c.code === code)!.libelle;

/** Les coûts du mois, de la répartition au résultat analytique. */
export function coutComplet(c: Cas) {
  const g = chiffresDeGestion(c);
  const matieres = auCentime(g.quantite * g.matiereParUnite);
  const autres = auCentime(g.quantite * g.autresParUnite);
  const charges = { loyer: c.loyer.montant, personnel: c.personnel.cout, amortissement: g.amortissement };
  const indirectes = auCentime(charges.loyer + charges.personnel + charges.amortissement);
  // La répartition primaire, centre par centre ; la distribution prend le reste, pour que
  // les arrondis ne perdent pas un centime.
  const partDe = (centre: CodeDeCentre) =>
    auCentime(
      (Object.keys(charges) as (keyof typeof charges)[]).reduce((t, k) => t + charges[k] * REPARTITION_PRIMAIRE[k][centre], 0),
    );
  const primaire: Record<CodeDeCentre, number> = {
    administration: partDe("administration"),
    approvisionnement: partDe("approvisionnement"),
    production: partDe("production"),
    distribution: 0,
  };
  primaire.distribution = auCentime(indirectes - primaire.administration - primaire.approvisionnement - primaire.production);
  const recu = (centre: Exclude<CodeDeCentre, "administration">) => auCentime(primaire.administration * REPARTITION_SECONDAIRE[centre]);
  const final = {
    approvisionnement: auCentime(primaire.approvisionnement + recu("approvisionnement")),
    production: auCentime(primaire.production + recu("production")),
    distribution: 0,
  };
  final.distribution = auCentime(indirectes - final.approvisionnement - final.production);
  const centainesDAchats = matieres / ASSIETTE_D_APPROVISIONNEMENT;
  const centaines = g.chiffreDAffaires / ASSIETTE_DE_DISTRIBUTION;
  const uo = {
    approvisionnement: final.approvisionnement / centainesDAchats,
    production: final.production / g.quantite,
    distribution: final.distribution / centaines,
  };
  const coutDAchat = auCentime(matieres + final.approvisionnement);
  const coutDeProduction = auCentime(coutDAchat + autres + final.production);
  const coutDeRevient = auCentime(coutDeProduction + final.distribution);
  const resultat = auCentime(g.chiffreDAffaires - coutDeRevient);
  const coutDeRevientUnitaire = coutDeRevient / g.quantite;
  const commande = Math.max(1, Math.round(g.quantite * PART_DE_LA_COMMANDE));
  const prixDeLaCommande = Math.round((g.coutVariableUnitaire + coutDeRevientUnitaire) / 2);
  return {
    ...g,
    matieres,
    autres,
    charges,
    indirectes,
    primaire,
    recu,
    final,
    centainesDAchats,
    centaines,
    uo,
    coutDAchat,
    coutDeProduction,
    coutDeRevient,
    coutDeRevientUnitaire,
    resultat,
    commande,
    prixDeLaCommande,
    gainDeLaCommande: auCentime(commande * (prixDeLaCommande - g.coutVariableUnitaire)),
  };
}

const cles = (k: keyof typeof REPARTITION_PRIMAIRE) =>
  CENTRES.map((c) => `${c.libelle.toLowerCase()} ${pct(REPARTITION_PRIMAIRE[k][c.code])}`).join(", ");

export const COUT_COMPLET: Chapitre = {
  code: "cout-complet",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
  ],
  titre: "Coût complet et centres d'analyse",
  accroche:
    "Le même mois que le seuil de rentabilité, par l'autre méthode : chaque charge suivie jusqu'au produit, du coût d'achat au coût de revient.",
  objectifs: [
    "Distinguer les charges directes et indirectes",
    "Répartir les charges indirectes entre les centres d'analyse, puis le centre auxiliaire",
    "Calculer le coût d'une unité d'œuvre",
    "Remonter la chaîne des coûts : coût d'achat, coût de production, coût de revient",
    "Calculer le résultat analytique, et voir ce que le coût complet ne dit pas",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une autre façon de compter",
      notions: ["full_unit_cost"],
      texte: (c) => {
        const k = coutComplet(c);
        return [
          `Dans « Le seuil de rentabilité », les charges de ${c.entreprise} se rangeaient en variables et fixes, pour savoir combien vendre. Cette fois, on veut savoir ce que coûte, tout compris, ${accord(c, "chacun")} des ${qte(k.quantite)} ${c.unites} ${accordPluriel(c, "vendu")} en janvier.`,
          "La méthode des coûts complets range les charges autrement. Les charges directes se rattachent au produit sans calcul : les achats qu'il consomme. Les charges indirectes servent à toute l'entreprise : il faut les répartir, par des centres d'analyse, avant de les imputer aux produits.",
          "Les charges sont celles de l'arène ; les clés de répartition, que l'arène ne connaît pas, sont celles du cours.",
        ];
      },
      repere: () =>
        "Coût d'achat (achats et approvisionnement), coût de production (coût d'achat, autres charges directes et production), coût de revient (coût de production et distribution) : chaque étage ajoute ses charges.",
    },
    {
      id: "directes-ou-indirectes",
      type: "tri",
      titre: "Directes ou indirectes",
      notions: ["full_unit_cost"],
      question: () => "Rangez les charges du mois : directes, ou indirectes ?",
      categories: [
        { code: "directe", libelle: "Directe" },
        { code: "indirecte", libelle: "Indirecte" },
      ],
      elements: (c) => {
        const k = coutComplet(c);
        return [
          { libelle: "Achats consommés", montant: k.matieres, categorie: "directe", pourquoi: `${eur(k.matiereParUnite)} par ${c.unite} : ils se rattachent au produit sans calcul.` },
          { libelle: "Loyer", montant: k.charges.loyer, categorie: "indirecte", pourquoi: "Le local sert à toute l'entreprise : il faut le répartir." },
          {
            libelle: `Autres coûts par ${c.unite} (${c.gestion.autresCoutsVariables})`,
            montant: k.autres,
            categorie: "directe",
            pourquoi: "Ils se comptent unité par unité : directs.",
          },
          {
            libelle: "Personnel",
            montant: k.charges.personnel,
            categorie: "indirecte",
            pourquoi: "Ici, l'équipe travaille pour toute l'entreprise : on la répartit par centre. Un ouvrier attaché à un seul produit serait une charge directe (la main-d'œuvre directe).",
          },
          { libelle: "Usure de l'équipement", montant: k.charges.amortissement, categorie: "indirecte", pourquoi: "L'équipement sert à toute la production : il se répartit." },
        ];
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [`${eur(k.indirectes)} de charges indirectes à répartir. Ici, les charges directes sont aussi les variables, et les indirectes les fixes ; ce n'est pas une règle. Un local réservé à un seul produit serait une charge directe, et fixe.`];
      },
    },
    {
      id: "repartition-primaire",
      type: "montants",
      titre: "La répartition primaire",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutComplet(c);
        return `Répartissez les charges indirectes entre les quatre centres. Loyer ${eur(k.charges.loyer)} : ${cles("loyer")}. Personnel ${eur(k.charges.personnel)} : ${cles("personnel")}. Usure de l'équipement ${eur(k.charges.amortissement)} : ${cles("amortissement")}.`;
      },
      champs: (c) => {
        const k = coutComplet(c);
        return CENTRES.map((centre) => ({
          libelle: `Centre ${centre.libelle.toLowerCase()}`,
          attendu: k.primaire[centre.code],
          calcul: `${(["loyer", "personnel", "amortissement"] as const)
            .map((n) => `${eur(k.charges[n])} × ${pct(REPARTITION_PRIMAIRE[n][centre.code])}`)
            .join(" + ")} = ${eur(k.primaire[centre.code])}`,
          tolerance: 0.05,
        }));
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [`Les quatre centres réunis font ${eur(k.indirectes)} : rien ne se perd, tout est rangé. Le centre administration ne produit rien que l'on vende : il est auxiliaire, et se répartit à son tour.`];
      },
    },
    {
      id: "repartition-secondaire",
      type: "montants",
      titre: "La répartition secondaire",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutComplet(c);
        return `Le centre administration (${eur(k.primaire.administration)}) se répartit sur les centres principaux : ${PRINCIPAUX.map((p) => `${libelleDe(p).toLowerCase()} ${pct(REPARTITION_SECONDAIRE[p])}`).join(", ")}. Calculez le total de chaque centre principal.`;
      },
      champs: (c) => {
        const k = coutComplet(c);
        return PRINCIPAUX.map((p) => ({
          libelle: `Total du centre ${libelleDe(p).toLowerCase()}`,
          attendu: k.final[p],
          calcul: `${eur(k.primaire[p])} + ${eur(k.primaire.administration)} × ${pct(REPARTITION_SECONDAIRE[p])} = ${eur(k.final[p])}`,
          tolerance: 0.05,
        }));
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [`Toutes les charges indirectes, ${eur(k.indirectes)}, sont maintenant dans les trois centres qui servent le produit : l'acheter, le produire, le vendre.`];
      },
    },
    {
      id: "unites-d-oeuvre",
      type: "montants",
      titre: "Le coût des unités d'œuvre",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutComplet(c);
        return `Chaque centre a son unité d'œuvre, ce qui mesure son activité. Approvisionnement : ${eur(ASSIETTE_D_APPROVISIONNEMENT)} d'achats (${eur(k.matieres)} ce mois). Production : une unité produite (${qte(k.quantite)} ${c.unites}). Distribution : ${eur(ASSIETTE_DE_DISTRIBUTION)} de chiffre d'affaires (${eur(k.chiffreDAffaires)} ce mois). Calculez le coût de chaque unité d'œuvre.`;
      },
      champs: (c) => {
        const k = coutComplet(c);
        return [
          {
            libelle: `Approvisionnement : coût pour ${ASSIETTE_D_APPROVISIONNEMENT} € d'achats`,
            attendu: auCentime(k.uo.approvisionnement),
            calcul: `${eur(k.final.approvisionnement)} ÷ ${qte(auCentime(k.centainesDAchats))} = ${eur(auCentime(k.uo.approvisionnement))}`,
            tolerance: 0.01,
          },
          {
            libelle: "Production : coût d'une unité",
            attendu: auCentime(k.uo.production),
            calcul: `${eur(k.final.production)} ÷ ${qte(k.quantite)} = ${eur(auCentime(k.uo.production))}`,
            tolerance: 0.01,
          },
          {
            libelle: `Distribution : coût pour ${ASSIETTE_DE_DISTRIBUTION} € de chiffre d'affaires`,
            attendu: auCentime(k.uo.distribution),
            calcul: `${eur(k.final.distribution)} ÷ ${qte(auCentime(k.centaines))} = ${eur(auCentime(k.uo.distribution))}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [
          "Le coût de l'unité d'œuvre est le prix d'un peu d'activité du centre. Il sert à imputer à chaque produit ce qu'il a consommé : à une seule référence comme ici, tout ; à une gamme, sa part.",
          ...(k.uo.approvisionnement > ASSIETTE_D_APPROVISIONNEMENT
            ? [
                `Chez ${c.entreprise}, acheter ${eur(ASSIETTE_D_APPROVISIONNEMENT)} coûte ${eur(auCentime(k.uo.approvisionnement))} : le centre coûte plus que ce qu'il achète. Les clés du cours conviennent à une entreprise qui achète beaucoup ; pour un métier qui achète peu, le contrôleur de gestion choisirait d'autres clés. Les clés sont une décision, pas un fait.`,
              ]
            : []),
        ];
      },
    },
    {
      id: "chaine-des-couts",
      type: "montants",
      titre: "La chaîne des coûts",
      notions: ["full_unit_cost"],
      question: (c) => {
        const k = coutComplet(c);
        return `Remontez la chaîne des coûts du mois. Achats ${eur(k.matieres)}, autres charges directes ${eur(k.autres)} ; centres : approvisionnement ${eur(k.final.approvisionnement)}, production ${eur(k.final.production)}, distribution ${eur(k.final.distribution)}.`;
      },
      champs: (c) => {
        const k = coutComplet(c);
        return [
          { libelle: "Coût d'achat", attendu: k.coutDAchat, calcul: `${eur(k.matieres)} + ${eur(k.final.approvisionnement)} = ${eur(k.coutDAchat)}`, tolerance: 0.05 },
          {
            libelle: "Coût de production",
            attendu: k.coutDeProduction,
            calcul: `${eur(k.coutDAchat)} + ${eur(k.autres)} + ${eur(k.final.production)} = ${eur(k.coutDeProduction)}`,
            tolerance: 0.05,
          },
          { libelle: "Coût de revient", attendu: k.coutDeRevient, calcul: `${eur(k.coutDeProduction)} + ${eur(k.final.distribution)} = ${eur(k.coutDeRevient)}`, tolerance: 0.05 },
          {
            libelle: "Coût de revient d'une unité",
            attendu: auCentime(k.coutDeRevientUnitaire),
            calcul: `${eur(k.coutDeRevient)} ÷ ${qte(k.quantite)} = ${eur(auCentime(k.coutDeRevientUnitaire))}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [
          `Chaque ${c.unite} ${accord(c, "vendu")} coûte ${eur(auCentime(k.coutDeRevientUnitaire))} tout compris, pour un prix moyen de ${eur(k.prixMoyen)}. ${k.prixMoyen >= k.coutDeRevientUnitaire ? "Le prix couvre le coût complet." : "Le prix ne couvre pas le coût complet."}`,
        ];
      },
    },
    {
      id: "resultat-analytique",
      type: "montants",
      titre: "Le résultat analytique",
      notions: ["full_unit_cost"],
      question: (c) => `Le chiffre d'affaires du mois est de ${eur(coutComplet(c).chiffreDAffaires)}. Quel est le résultat analytique ?`,
      champs: (c) => {
        const k = coutComplet(c);
        return [
          {
            libelle: "Résultat analytique du mois",
            attendu: k.resultat,
            calcul: `${eur(k.chiffreDAffaires)} − ${eur(k.coutDeRevient)} = ${eur(k.resultat)}`,
            tolerance: 0.05,
          },
        ];
      },
      explication: (c) => {
        const k = coutComplet(c);
        return [
          k.resultat >= 0
            ? `${c.entreprise} gagne ${eur(k.resultat)} en janvier.`
            : `${c.entreprise} perd ${eur(-k.resultat)} en janvier.`,
        ];
      },
    },
    {
      id: "meme-resultat",
      type: "choix",
      titre: "Deux méthodes, un résultat",
      notions: ["full_unit_cost", "breakeven"],
      question: (c) => {
        const k = coutComplet(c);
        return `Dans « Le seuil de rentabilité », le compte de résultat différentiel du même mois donnait ${eur(k.resultat)}. Le coût complet donne le même chiffre. Pourquoi ?`;
      },
      options: () => [
        {
          texte: "Parce que les deux méthodes rangent les mêmes charges autrement : le total ne change pas.",
          juste: true,
          retour:
            "C'est cela. Variables et fixes, ou directes et indirectes : ce sont deux lectures des mêmes charges. Le résultat est le même ; ce qui change, c'est ce que chaque méthode permet de voir : le seuil d'un côté, le coût de chaque étage de l'autre.",
        },
        {
          texte: "C'est une coïncidence de ce mois-ci.",
          juste: false,
          retour: "Ce n'est pas un hasard : quand toutes les charges sont incorporées, les deux méthodes retrouvent le même résultat, tous les mois.",
        },
        {
          texte: "Parce que les clés de répartition ont été choisies pour.",
          juste: false,
          retour: "Changez les clés : les coûts de chaque centre bougent, le résultat non. Les clés déplacent les charges entre les centres, elles ne les font pas disparaître.",
        },
      ],
    },
    {
      id: "commande",
      type: "choix",
      titre: "Une commande sous le coût complet",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const k = coutComplet(c);
        return `Un client propose d'acheter ${qte(k.commande)} ${c.unites} de plus ce mois-ci, à ${eur(k.prixDeLaCommande)} l'unité : moins que le coût de revient (${eur(auCentime(k.coutDeRevientUnitaire))}), plus que le coût variable (${eur(k.coutVariableUnitaire)}). ${c.entreprise} peut les servir sans rien ajouter à ses charges fixes. Faut-il accepter ?`;
      },
      options: (c) => {
        const k = coutComplet(c);
        return [
          {
            texte: "Non : vendre sous le coût de revient fait perdre de l'argent.",
            juste: false,
            retour: `C'est le piège du coût complet. Le coût de revient unitaire contient une part de charges fixes, que l'entreprise paie de toute façon. La commande ne coûte que ses charges variables : elle rapporte ${eur(k.gainDeLaCommande)}.`,
          },
          {
            texte: `Oui : chaque unité rapporte sa marge sur coût variable, ${eur(auCentime(k.prixDeLaCommande - k.coutVariableUnitaire))}, et les charges fixes ne bougent pas.`,
            juste: true,
            retour: `Oui : ${qte(k.commande)} × ${eur(auCentime(k.prixDeLaCommande - k.coutVariableUnitaire))} = ${eur(k.gainDeLaCommande)} de résultat en plus. À une condition : que ce prix ne devienne pas celui de tous les clients, sans quoi les charges fixes ne seraient plus couvertes.`,
          },
          {
            texte: "Seulement si le client paie comptant.",
            juste: false,
            retour: "Le délai de paiement compte pour la trésorerie, pas pour le résultat de la commande : c'est la marge sur coût variable qui décide.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["full_unit_cost"],
      texte: (c) => {
        const k = coutComplet(c);
        return [
          `Vous avez calculé le coût complet de ${c.entreprise} en janvier : la répartition des charges indirectes, les unités d'œuvre, la chaîne des coûts, et un coût de revient de ${eur(auCentime(k.coutDeRevientUnitaire))} par ${c.unite}.`,
          "Le coût complet dit ce que coûte un produit, tout compris : il sert à fixer un prix durable et à comparer des produits. La marge sur coût variable dit ce que rapporte une vente de plus : elle sert à décider. Le palier suivant les réunit, quand l'entreprise vend plusieurs produits.",
        ];
      },
      repere: () =>
        "Charges directes au produit, charges indirectes par les centres puis les unités d'œuvre. Le coût complet pour fixer un prix durable, la marge sur coût variable pour décider d'une vente de plus.",
    },
  ],
};
