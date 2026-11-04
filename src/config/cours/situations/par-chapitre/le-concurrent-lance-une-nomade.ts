import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_COUT_CIBLE } from "../../chapitres/cout-cible-et-couts-caches";
import { auCentime } from "../../monde/amortissement";
import { LA_GO, MARGE_CIBLE_DE_LA_GO, PRIX_DU_CONCURRENT, analyseDeLaValeur, coutCibleAuPrix } from "../../monde/valeur-et-couts-caches";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT CIBLE, ANALYSE DE LA VALEUR ET COÛTS CACHÉS » : LE CONCURRENT LANCE
 * UNE NOMADE (contrôle de gestion, palier 4).
 *
 * SoundBox lance une enceinte nomade à 32 € (PRIX_DU_CONCURRENT, monde/valeur-et-couts-caches.ts) ; le
 * marché de la Go s'y aligne. La direction garde sa marge de 15 €. L'élève recalcule le coût cible,
 * l'écart de la Go lancée (19 €), la cible de chaque fonction, et choisit où trouver l'économie. Comme
 * son chapitre, le cas se joue dans le monde du cours : `coutCibleAuPrix` calcule chaque chiffre.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");

/** Les chiffres du cas : le coût cible au prix du concurrent, et ce que donnerait une baisse prise sur la seule batterie. */
export function nomadeDuConcurrent(c: Pick<Cas, "code">) {
  void c;
  const k = coutCibleAuPrix(PRIX_DU_CONCURRENT);
  const fonction = (code: string) => k.parFonction.find((x) => x.code === code)!;
  const toutSurLaBatterie = analyseDeLaValeur(k.parFonction.map((x) => (x.code === "autonomie" ? auCentime(x.coutRetenu - k.ecartDuRetenu) : x.coutRetenu)));
  return { k, fonction, toutSurLaBatterie, batterie: toutSurLaBatterie.parFonction.find((x) => x.code === "autonomie")! };
}

export const LE_CONCURRENT_LANCE_UNE_NOMADE: Situation = {
  code: "le-concurrent-lance-une-nomade",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["cout-cible-et-couts-caches"],
  commanditaire: "La responsable commerciale",
  titre: "Le concurrent lance une nomade",
  accroche: "SoundBox lance une enceinte nomade à 32 €, et les clients de la Go s'y alignent. La direction garde sa marge : quel coût viser maintenant, et où le trouver ?",
  objectifs: [
    "Recalculer un coût cible quand le prix du marché baisse",
    "Répartir le nouveau coût cible entre les fonctions du produit",
    "Rendre une réponse qui garde l'équilibre entre le coût et la valeur de chaque fonction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COUT_CIBLE,
    pourquoi: "ce cas reprend le chapitre « Coût cible, analyse de la valeur et coûts cachés », qui se calcule sur la Go de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable commerciale",
      texte: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return [
          `« SoundBox vend sa nomade ${eur(k.prix)}. Nos clients ne paieront plus ${eur(LA_GO.prix)} pour la ${LA_GO.nom}. La direction veut garder ses ${eur(MARGE_CIBLE_DE_LA_GO)} de marge par Go : dites au bureau d'études ce qu'il doit trouver, et où. »`,
          "Pas de cours cette fois : vous avez les fonctions de la Go lancée et la méthode du chapitre.",
        ];
      },
      tableau: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return {
          titre: `Les fonctions de la ${LA_GO.nom} lancée`,
          colonnes: ["Poids pour les clients", "Coût retenu"],
          lignes: k.parFonction.map((x) => ({ libelle: x.libelle, valeurs: [`${(x.poids * 100).toLocaleString("fr-FR")} %`, eur(x.coutRetenu)] })),
        };
      },
      repere: () => "À rendre : le nouveau coût cible, l'écart à combler, la cible de chaque fonction, et votre réponse.",
    },
    {
      id: "le-nouveau-cout-cible",
      type: "montants",
      titre: "Le nouveau coût cible",
      notions: ["price_floor", "variable_costs"],
      question: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return `Au prix de ${eur(k.prix)}, avec ${eur(k.marge)} de marge visée, calculez le coût cible de la Go, l'écart entre la Go lancée (${eur(k.coutRetenu)}) et ce coût cible, puis la marge que laisserait la Go lancée à ce prix.`;
      },
      champs: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return [
          { libelle: "Nouveau coût cible", attendu: k.coutCible, calcul: `${eur(k.prix)} − ${eur(k.marge)} = ${eur(k.coutCible)}` },
          { libelle: "Écart à combler", attendu: k.ecartDuRetenu, calcul: `${eur(k.coutRetenu)} − ${eur(k.coutCible)} = ${eur(k.ecartDuRetenu)}` },
          { libelle: "Marge de la Go lancée à ce prix", attendu: k.margeDeLaGoLancee, calcul: `${eur(k.prix)} − ${eur(k.coutRetenu)} = ${eur(k.margeDeLaGoLancee)}` },
        ];
      },
      explication: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return [`Le prix a baissé de ${eur(auCentime(LA_GO.prix - k.prix))} : la marge visée ne bouge pas, c'est donc le coût qui doit baisser d'autant.`];
      },
    },
    {
      id: "par-fonction",
      type: "montants",
      titre: "La cible de chaque fonction",
      notions: ["variable_costs"],
      question: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return `Répartissez le coût cible de ${eur(k.coutCible)} entre les fonctions, selon leur poids pour les clients.`;
      },
      champs: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return k.parFonction.map((x) => ({ libelle: `Coût cible : ${x.libelle.toLowerCase()}`, attendu: x.cible, calcul: `${eur(k.coutCible)} × ${(x.poids * 100).toLocaleString("fr-FR")} % = ${eur(x.cible)}, soit ${eur(x.ecartDuRetenu)} sous le coût retenu` }));
      },
      explication: (c) => {
        const { k } = nomadeDuConcurrent(c);
        return [`Chaque fonction doit perdre la même part de son coût : ${k.parFonction.map((x) => eur(x.ecartDuRetenu)).join(", ")}. Leur somme refait l'écart, ${eur(k.ecartDuRetenu)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable commerciale",
      notions: ["price_floor", "variable_costs"],
      question: () => "Que dites-vous au bureau d'études ?",
      options: (c) => {
        const n = nomadeDuConcurrent(c);
        return [
          {
            texte: `Trouver ${eur(n.k.ecartDuRetenu)}, fonction par fonction`,
            juste: true,
            retour: `Oui. Après l'analyse de la valeur, chaque fonction de la Go coûte exactement ce qu'elle vaut pour les clients : chacune doit donc baisser à proportion, le son de ${eur(n.fonction("son").ecartDuRetenu)}, la batterie de ${eur(n.fonction("autonomie").ecartDuRetenu)}. La marge de ${eur(n.k.marge)} est gardée.`,
          },
          {
            texte: `Tout prendre sur la batterie, la deuxième fonction la plus chère`,
            juste: false,
            retour: `Non : à ${eur(n.batterie.cout)}, la batterie ne pèserait plus que ${(Math.round(n.batterie.part * 1000) / 10).toLocaleString("fr-FR")} % du coût pour ${(n.batterie.poids * 100).toLocaleString("fr-FR")} % de la valeur : une journée d'écoute ne tiendrait plus, et les clients le verraient.`,
          },
          {
            texte: `Ne rien changer et accepter ${eur(n.k.margeDeLaGoLancee)} de marge par Go`,
            juste: false,
            retour: `Non : la marge visée est celle que la direction demande à la Go pour payer sa part des charges communes. La baisser, c'est renoncer au coût cible au lieu de le chercher.`,
          },
          {
            texte: `Garder le prix de ${eur(LA_GO.prix)} : la Go est meilleure que la nomade de SoundBox`,
            juste: false,
            retour: "Non : le prix est celui que le marché accepte, pas celui que NOVA estime mériter. L'enquête de prix l'a montré : quelques euros au-dessus du marché font fuir une bonne part des acheteurs.",
          },
        ];
      },
    },
  ],
};
