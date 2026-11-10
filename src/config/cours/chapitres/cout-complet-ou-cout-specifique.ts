import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CHARGES_COMMUNES, COMMANDE_DES_HOTELS, ENTREPRISES_DES_COUTS_DE_LA_GAMME, commandeDesHotels, gammeDuMois, heuresLibres, referenceDuMois, resultatSans } from "../monde/couts-de-la-gamme-au-lycee";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : COÛT COMPLET OU COÛT SPÉCIFIQUE, CE QUE COÛTE CHAQUE PRODUIT (Bac STMG, gestion et finance de
 * terminale, thème 3, question 3.4 : « Qu'apporte l'analyse des coûts à la prise de décision ? » ; et
 * l'enseignement commun, thème 1, question 1.3, le contrôle des coûts, cité en second).
 *
 * La version lycée des coûts (décision du propriétaire, novembre 2026) : les chapitres du contrôle de
 * gestion (« Coût complet et centres d'analyse », « Coût par produit », « Décider : prix, fabriquer ou
 * acheter ») raisonnent avec les outils du BTS. Celui-ci lit le mois en gamme de NOVA en quelques
 * gestes : les charges directes et indirectes, le coût complet et le résultat de la One, le coût
 * partiel (la marge sur coût variable, avec le seuil de rentabilité du chapitre « Assez vendre pour ne
 * rien perdre »), le coût spécifique et la marge sur coûts spécifiques, qui disent qu'abandonner la One
 * coûterait cher, puis le coût marginal d'une commande supplémentaire au curseur, et les intérêts et
 * limites de chaque méthode.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/couts-de-la-gamme-au-lycee.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");

function laGamme(c: Cas): TableauDeDonnees {
  const g = gammeDuMois();
  return {
    titre: `Le mois en gamme de ${c.entreprise}`,
    colonnes: g.parReference.map((r) => r.nom),
    lignes: [
      { libelle: "Enceintes vendues", valeurs: g.parReference.map((r) => qte(r.quantite)) },
      { libelle: "Chiffre d'affaires", valeurs: g.parReference.map((r) => eur(r.chiffreDAffaires)) },
      { libelle: "Coûts variables (composants, emballage, transport)", valeurs: g.parReference.map((r) => eur(r.variables)) },
      { libelle: "Publicité de la référence", valeurs: g.parReference.map((r) => eur(r.publicite)) },
      { libelle: "Charges communes imputées (aux heures-machine)", valeurs: g.parReference.map((r) => eur(r.imputees)) },
    ],
  };
}

export const COUT_COMPLET_OU_COUT_SPECIFIQUE: Chapitre = {
  code: "cout-complet-ou-cout-specifique",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 3 · Accompagner la prise de décision", "STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Coût complet ou coût spécifique : ce que coûte chaque produit",
  accroche:
    "La One semble perdre de l'argent quand on lui compte sa part du loyer et des salaires. Faut-il l'arrêter ? Trois façons de calculer un coût, et ce que chacune dit, puis le prix d'une commande de plus.",
  objectifs: [
    "Distinguer les charges directes et indirectes, variables et fixes",
    "Calculer un coût complet et le résultat d'un produit",
    "Calculer une marge sur coût variable et une marge sur coûts spécifiques",
    "Juger une commande supplémentaire par son coût marginal",
    "Choisir la méthode de coût selon la décision",
  ],
  libre: false,
  prerequis: ["assez-vendre-pour-ne-rien-perdre"],
  entreprises: {
    codes: ENTREPRISES_DES_COUTS_DE_LA_GAMME,
    pourquoi: "ce chapitre lit le mois en gamme de NOVA, dont le cours tient les trois références et les charges communes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un coût, une somme de charges",
      tableau: laGamme,
      texte: (c) => [
        `${c.entreprise} vend ses enceintes en gamme : la Go, la One et la Studio. Chacune a ses charges propres (ses composants, sa publicité) ; d'autres servent les trois à la fois (le loyer, les salaires, l'entretien et l'usure des lignes).`,
        "Un coût est une somme de charges. Lesquelles retenir dépend de la décision à prendre : aucune méthode ne vaut pour tout. Aucune organisation n'échappe au suivi de ses coûts.",
      ],
      repere: () => "Charge directe : propre à un produit. Charge indirecte (commune) : partagée entre plusieurs produits. Charge variable : suit l'activité. Charge fixe : ne bouge pas avec elle.",
    },
    {
      id: "les-charges",
      objectifs: [0],
      type: "tri",
      titre: "Ranger les charges",
      question: () => "Rangez chaque charge du mois.",
      categories: [
        { code: "directe-variable", libelle: "Directe et variable" },
        { code: "directe-fixe", libelle: "Directe et fixe (spécifique)" },
        { code: "commune", libelle: "Indirecte (commune)" },
      ],
      elements: () => {
        const go = referenceDuMois("go");
        const studio = referenceDuMois("studio");
        return [
          { libelle: "Les composants des Go vendues", montant: go.variables, categorie: "directe-variable", pourquoi: "Propres à la Go, et une Go de plus en demande d'autres." },
          { libelle: "La publicité de la Studio", montant: studio.publicite, categorie: "directe-fixe", pourquoi: "Propre à la Studio, mais la même quel que soit le nombre vendu : une charge spécifique." },
          { libelle: "Le loyer du local", montant: CHARGES_COMMUNES.loyer, categorie: "commune", pourquoi: "Le local sert les trois références : une charge commune." },
          { libelle: "L'usure des lignes de montage", montant: CHARGES_COMMUNES.usure, categorie: "commune", pourquoi: "Les lignes montent les trois références." },
        ];
      },
      relance: "La charge est-elle propre à une référence ? Si oui, suit-elle le nombre vendu ? Sinon, elle est commune.",
      explication: () => ["Les charges directes se rattachent sans calcul à un produit ; les charges communes doivent être réparties par une clé, ici les heures-machine : c'est ce qui rend le coût complet discutable."],
    },
    {
      id: "le-cout-complet-de-la-one",
      objectifs: [1],
      type: "montants",
      titre: "Le coût complet de la One",
      tableau: laGamme,
      question: () => "Calculez le coût complet de la One (coûts variables, publicité et charges communes imputées), puis son résultat.",
      champs: () => {
        const r = referenceDuMois("one");
        return [
          { libelle: "Coût complet de la One", attendu: r.coutComplet, calcul: `${eur(r.variables)} + ${eur(r.publicite)} + ${eur(r.imputees)} = ${eur(r.coutComplet)}` },
          { libelle: "Résultat de la One", attendu: r.resultat, calcul: `${eur(r.chiffreDAffaires)} − ${eur(r.coutComplet)} = ${eur(r.resultat)}` },
        ];
      },
      explication: () => {
        const r = referenceDuMois("one");
        const g = gammeDuMois();
        return [`En coût complet, la One perd ${eur(-r.resultat)} dans le mois, alors que la gamme gagne ${eur(g.resultat)}. Le coût complet donne la rentabilité de chaque produit, à condition que la clé de répartition soit juste.`];
      },
    },
    {
      id: "arreter-la-one",
      objectifs: [1],
      type: "choix",
      titre: "Arrêter la One ?",
      question: () => "Un associé propose d'arrêter la One, puisqu'elle perd de l'argent en coût complet. Le résultat du mois serait-il meilleur ?",
      options: () => [
        {
          texte: "Pas sûr : sa part du loyer et des salaires resterait à payer",
          juste: true,
          retour: "Oui : les charges communes ne partent pas avec la One. Le coût complet ne dit pas ce que son arrêt ferait gagner ou perdre : il faut un autre calcul.",
        },
        {
          texte: "Oui : sans la One, le mois gagnerait la perte qu'elle fait en coût complet",
          juste: false,
          retour: "Non : ce serait vrai si toutes ses charges disparaissaient avec elle. Le loyer et les salaires, eux, restent.",
        },
        {
          texte: "Oui, et il faudrait aussi arrêter la Go, qui gagne peu",
          juste: false,
          retour: "Non : on ne juge pas un produit sur son résultat en coût complet seul. Les charges communes resteraient à payer.",
        },
      ],
    },
    {
      id: "le-cout-partiel",
      type: "lecture",
      titre: "Le coût partiel : variable ou fixe",
      texte: () => [
        "Le coût partiel ne retient que les charges variables. Ce que chaque produit laisse une fois ses charges variables payées, c'est sa marge sur coût variable : elle sert à payer les charges fixes, et ce qui reste fait le résultat de toute l'entreprise.",
        "C'est la logique du seuil de rentabilité, vue en première (« Assez vendre pour ne rien perdre ») : on ne demande plus si chaque produit est rentable seul, mais si l'ensemble couvre ses charges fixes.",
      ],
      repere: () => "Marge sur coût variable = chiffre d'affaires − charges variables.",
    },
    {
      id: "les-marges",
      objectifs: [2],
      type: "montants",
      titre: "Marge sur coût variable, marge sur coûts spécifiques",
      tableau: laGamme,
      question: () => "Calculez, pour la One, la marge sur coût variable, puis la marge sur coûts spécifiques (la marge sur coût variable moins sa publicité, sa seule charge fixe propre).",
      champs: () => {
        const r = referenceDuMois("one");
        return [
          { libelle: "Marge sur coût variable de la One", attendu: r.margeSurCoutVariable, calcul: `${eur(r.chiffreDAffaires)} − ${eur(r.variables)} = ${eur(r.margeSurCoutVariable)}` },
          { libelle: "Marge sur coûts spécifiques de la One", attendu: r.margeSpecifique, calcul: `${eur(r.margeSurCoutVariable)} − ${eur(r.publicite)} = ${eur(r.margeSpecifique)}` },
        ];
      },
      explication: () => {
        const r = referenceDuMois("one");
        return [`La One laisse ${eur(r.margeSpecifique)} une fois payées toutes ses charges propres : c'est sa contribution aux charges communes. Le coût spécifique impute à chaque produit ses charges fixes directes, et seulement elles.`];
      },
    },
    {
      id: "sans-la-one",
      objectifs: [2],
      type: "montants",
      titre: "Le mois sans la One",
      question: () => "Si NOVA arrêtait la One, elle perdrait sa marge sur coûts spécifiques, et garderait les charges communes. Calculez le résultat du mois sans la One.",
      champs: () => {
        const g = gammeDuMois();
        const r = referenceDuMois("one");
        return [{ libelle: "Résultat du mois sans la One", attendu: resultatSans("one"), calcul: `${eur(g.resultat)} − ${eur(r.margeSpecifique)} = ${eur(resultatSans("one"))}` }];
      },
      explication: () => {
        const g = gammeDuMois();
        return [`Sans la One, le mois passerait d'un bénéfice de ${eur(g.resultat)} à une perte de ${eur(-resultatSans("one"))}. Une référence dont la marge sur coûts spécifiques est positive aide à payer les charges communes : il faut la garder.`];
      },
    },
    {
      id: "la-commande-supplementaire",
      type: "lecture",
      titre: "Une commande de plus : le coût marginal",
      texte: () => {
        const k = commandeDesHotels();
        return [
          `Une chaîne d'hôtels demande ${qte(k.enceintes)} enceintes One, livrées par un transport dédié de ${eur(k.transport)}. Les lignes ont ${qte(heuresLibres())} heures-machine libres dans le mois ; la commande en demande ${qte(k.heures)}.`,
          "Les charges communes sont déjà payées par les ventes habituelles : la commande ne les fait pas monter. Ce qu'elle coûte, c'est son coût marginal, le coût des unités de plus : leurs charges variables, et le transport qu'elle seule demande.",
        ];
      },
      repere: () => "Coût marginal d'une commande = ce qu'elle ajoute aux charges. Elle améliore le résultat si son prix dépasse son coût marginal.",
    },
    {
      id: "le-prix-plancher",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix plus bas acceptable",
      question: () => {
        const k = commandeDesHotels();
        return `Faites varier le prix d'une enceinte de la commande : une droite donne ce que les hôtels paieraient pour les ${qte(k.enceintes)} enceintes, l'autre son coût marginal (${eur(k.coutVariable)} de coût variable par enceinte et ${eur(k.transport)} de transport). Placez le curseur sur le plus petit prix, à l'euro, qui ne fait rien perdre.`;
      },
      cible: () => ({ attendu: commandeDesHotels().prixPlancher, min: 30, max: 60 }),
      grandeur: () => ({ libelle: "Prix d'une enceinte de la commande", unite: "€" }),
      rates: () => ({ dessous: "À ce prix, la commande coûte plus qu'elle ne rapporte.", dessus: "La commande gagne, mais un prix plus bas ne ferait-il encore rien perdre ?" }),
      zones: ["La commande gagne", "La commande perd"],
      montrer: "Montrer le prix plancher",
      lecture: (_c, p) => {
        const k = commandeDesHotels(p);
        return [
          { libelle: "Ce que paient les hôtels", montant: k.recette },
          { libelle: "Coût marginal de la commande", montant: k.coutMarginal },
          { libelle: "Ce que la commande laisse", montant: k.gain, fort: true },
        ];
      },
      droites: () => {
        const k = commandeDesHotels();
        return { produit: (p) => p * k.enceintes, cout: () => k.coutMarginal, libelles: ["Ce que paient les hôtels", "Coût marginal"] };
      },
      explication: () => {
        const k = commandeDesHotels();
        return [`Le coût marginal est de ${eur(k.coutMarginalUnitaire)} par enceinte : à ${eur(k.prixPlancher)}, la commande laisse ${eur(commandeDesHotels(k.prixPlancher).gain)}, à ${eur(k.prixPlancher - 1)} elle ferait perdre. Ce prix est bien sous le coût complet de la One : peu importe, ses charges communes sont déjà payées.`];
      },
    },
    {
      id: "accepter-la-commande",
      objectifs: [3],
      type: "montants",
      titre: "Au prix proposé",
      question: () => `Les hôtels proposent ${eur(COMMANDE_DES_HOTELS.prixPropose)} l'enceinte. Calculez ce qu'ils paieraient, le coût marginal de la commande, puis ce qu'elle ajoute au résultat du mois.`,
      champs: () => {
        const k = commandeDesHotels();
        return [
          { libelle: "Ce que paient les hôtels", attendu: k.recette, calcul: `${qte(k.enceintes)} × ${eur(k.prix)} = ${eur(k.recette)}` },
          { libelle: "Coût marginal de la commande", attendu: k.coutMarginal, calcul: `${qte(k.enceintes)} × ${eur(k.coutVariable)} + ${eur(k.transport)} = ${eur(k.coutMarginal)}` },
          { libelle: "Ce qu'elle ajoute au résultat", attendu: k.gain, calcul: `${eur(k.recette)} − ${eur(k.coutMarginal)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => {
        const k = commandeDesHotels();
        return [`La commande ajoute ${eur(k.gain)} : elle s'accepte, tant qu'elle tient dans les heures libres et qu'elle ne pousse pas les clients habituels à demander le même prix.`];
      },
    },
    {
      id: "quelle-methode",
      objectifs: [4],
      type: "tri",
      titre: "À chaque décision sa méthode",
      question: () => "Rangez chaque question selon la méthode de coût qui y répond le mieux.",
      categories: [
        { code: "complet", libelle: "Coût complet" },
        { code: "specifique", libelle: "Coût spécifique" },
        { code: "marginal", libelle: "Coût marginal" },
      ],
      elements: () => [
        { libelle: "Fixer un prix catalogue qui paie, à terme, toutes les charges d'une référence", montant: 0, categorie: "complet", pourquoi: "Le coût complet compte toutes les charges : il dit le prix qui couvre tout, dans un environnement stable." },
        { libelle: "Décider de garder ou d'arrêter une référence", montant: 0, categorie: "specifique", pourquoi: "La marge sur coûts spécifiques dit ce que l'arrêt ferait perdre." },
        { libelle: "Accepter ou non une commande de plus, à un prix réduit", montant: 0, categorie: "marginal", pourquoi: "Seules comptent les charges que la commande ajoute : le coût marginal." },
      ],
      relance: "La décision porte-t-elle sur le prix qui couvre tout, sur l'existence d'un produit, ou sur quelques unités de plus ?",
      explication: () => ["Le coût complet suppose un environnement stable et une clé de répartition juste ; le coût spécifique s'est développé quand l'environnement est devenu plus instable. Chaque méthode a ses intérêts et ses limites : on la choisit selon la décision."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const r = referenceDuMois("one");
        const k = commandeDesHotels();
        return [
          `En coût complet, la One de ${c.entreprise} perd ${eur(-r.resultat)} ; sa marge sur coûts spécifiques, ${eur(r.margeSpecifique)}, dit pourtant qu'il faut la garder. Une commande de plus s'accepte au-dessus de son coût marginal : ${eur(k.prixPlancher)} l'enceinte, loin du coût complet.`,
          "Dans l'arène, l'écran d'analyse des coûts sépare les charges variables des charges fixes : c'est la base de la marge sur coût variable et du seuil de chaque tour.",
        ];
      },
      repere: () => "Coût complet : toutes les charges. Marge sur coûts spécifiques = marge sur coût variable − charges fixes directes. Coût marginal : ce qu'ajoutent les unités de plus.",
    },
  ],
};

