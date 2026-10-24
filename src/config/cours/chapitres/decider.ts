import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord, accordPluriel, pronom } from "../accords";
import type { Cas } from "../cas";
import { ECART_DE_PRIX, prixRejoues, sousTraitance, type Variante } from "../decision";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DÉCIDER, PRIX, FABRIQUER OU ACHETER (contrôle de gestion, palier 4).
 *
 * La dernière marche du parcours : décider en comparant ce qui change. L'élève prévoit à la
 * main l'effet d'un prix plus haut ou plus bas (à volume constant, puis le volume qu'il
 * faudrait), et l'arène rejoue le trimestre aux trois prix (`decision.ts`) : la demande
 * répond, le plan de production borne. Chez NOVA, la seule entreprise de l'arène qui ait
 * un sous-traitant, il décide aussi de fabriquer ou d'acheter une commande au-delà de sa
 * capacité. Décision du propriétaire : la sous-traitance reste propre à NOVA.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${Math.round(t * 100)} %`;
const LIBELLES = [`Prix −${pct(ECART_DE_PRIX)}`, "Prix du trimestre", `Prix +${pct(ECART_DE_PRIX)}`] as const;

const base = (c: Cas) => prixRejoues(c.code)[1]!;
const baisse = (c: Cas) => prixRejoues(c.code)[0]!;

/** Ce qu'il faudrait vendre au prix baissé pour garder la marge du trimestre. */
export function volumeNecessaire(c: Cas) {
  const b = base(c);
  const margeUnitaire = auCentime(b.marge / b.quantite);
  const margeBaissee = auCentime(margeUnitaire - b.prix * ECART_DE_PRIX);
  return { margeUnitaire, margeBaissee, quantite: Math.ceil(b.marge / margeBaissee - 1e-9) };
}

/** Le meilleur des trois prix joués par l'arène, au résultat d'exploitation. */
export function meilleurPrix(c: Cas): Variante {
  return [...prixRejoues(c.code)].sort((a, b) => b.resultat - a.resultat)[0]!;
}

/** La commande de NOVA : la capacité restante, et une demi-fois plus. */
export function commandeDeNova(c: Cas) {
  const s = sousTraitance(c.code)!;
  const b = base(c);
  const restante = Math.max(0, b.capacite - b.production);
  const commande = Math.round((restante * 1.5) / 100) * 100;
  const fabriquee = Math.min(restante, commande);
  const soustraitee = commande - fabriquee;
  const margeFabriquee = auCentime(b.prix - s.coutVariableUnitaire);
  const margeSousTraitee = auCentime(b.prix - s.coutUnitaire);
  return {
    ...s,
    prix: b.prix,
    restante,
    commande,
    fabriquee,
    soustraitee,
    margeFabriquee,
    margeSousTraitee,
    gain: auCentime(fabriquee * margeFabriquee + soustraitee * margeSousTraitee),
  };
}

function tableauDesPrix(c: Cas) {
  const v = prixRejoues(c.code);
  const ligne = (libelle: string, f: (x: Variante) => string) => ({ libelle, valeurs: v.map(f) });
  return {
    titre: `Le premier trimestre de ${c.entreprise}, rejoué par l'arène à trois prix`,
    colonnes: LIBELLES,
    lignes: [
      ligne("Prix moyen", (x) => eur(x.prix)),
      ligne(`Ventes (${c.unites})`, (x) => qte(x.quantite)),
      ligne("Demande non servie", (x) => qte(x.perdues)),
      ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
      ligne("Marge sur coût variable", (x) => eur(x.marge)),
      ligne("Résultat d'exploitation", (x) => eur(x.resultat)),
    ],
  };
}

export const DECIDER: Chapitre = {
  code: "decider-prix-fabriquer-acheter",
  parcours: "controle-de-gestion",
  palier: 4,
  titre: "Décider : prix, fabriquer ou acheter",
  accroche:
    "Monter ou baisser son prix, fabriquer ou faire fabriquer : prévoir ce qui change, puis laisser l'arène jouer la décision.",
  objectifs: [
    "Prévoir l'effet d'un changement de prix sur la marge, à volume constant",
    "Calculer le volume qu'une baisse de prix oblige à vendre",
    "Confronter la prévision à ce que l'arène joue, et dire ce qui a borné les ventes",
    "Décider de fabriquer ou de sous-traiter selon la capacité et le coût de chaque unité",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Décider, c'est comparer ce qui change",
      notions: ["contribution_margin", "price_elasticity"],
      texte: (c) => {
        const b = base(c);
        return [
          `Au premier trimestre, ${c.entreprise} a vendu ${qte(b.quantite)} ${c.unites} à ${eur(b.prix)} en moyenne : ${eur(b.chiffreDAffaires)} de chiffre d'affaires, ${eur(b.marge)} de marge sur coût variable, ${eur(b.resultat)} de résultat d'exploitation.`,
          `Le dirigeant hésite : monter son prix de ${pct(ECART_DE_PRIX)}, ou le baisser d'autant ? Une décision se juge à ce qu'elle change : les charges fixes ne bougent pas, la marge, si. Vous allez prévoir, puis l'arène rejouera le trimestre aux trois prix, avec les mêmes concurrents et le même plan de production.`,
        ];
      },
      repere: () =>
        "Une décision se juge à ses effets différentiels : ce qu'elle ajoute, ce qu'elle retire. Les charges qui ne changent pas n'entrent pas dans le calcul.",
    },
    {
      id: "volume-constant",
      type: "montants",
      titre: "Si les ventes ne bougeaient pas",
      notions: ["contribution_margin"],
      question: () =>
        `Supposez d'abord que le volume ne bouge pas : seul le prix change. Quelle serait la marge sur coût variable à +${pct(ECART_DE_PRIX)}, puis à −${pct(ECART_DE_PRIX)} ?`,
      champs: (c) => {
        const b = base(c);
        const ecart = Math.round(b.chiffreDAffaires * ECART_DE_PRIX);
        return [
          {
            libelle: `Marge à +${pct(ECART_DE_PRIX)}, à volume constant`,
            attendu: b.marge + ecart,
            calcul: `${eur(b.marge)} + ${pct(ECART_DE_PRIX)} × ${eur(b.chiffreDAffaires)} = ${eur(b.marge + ecart)}`,
            tolerance: 2,
          },
          {
            libelle: `Marge à −${pct(ECART_DE_PRIX)}, à volume constant`,
            attendu: b.marge - ecart,
            calcul: `${eur(b.marge)} − ${pct(ECART_DE_PRIX)} × ${eur(b.chiffreDAffaires)} = ${eur(b.marge - ecart)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const b = base(c);
        return [
          `À volume constant, ${pct(ECART_DE_PRIX)} de prix déplacent ${eur(Math.round(b.chiffreDAffaires * ECART_DE_PRIX))} de marge, tout droit au résultat : le coût variable de chaque unité ne change pas. Mais le volume, lui, bouge : c'est toute la question.`,
        ];
      },
    },
    {
      id: "volume-necessaire",
      type: "montants",
      titre: "Ce qu'une baisse oblige à vendre",
      notions: ["contribution_margin", "breakeven"],
      question: (c) => {
        const b = base(c);
        return `À −${pct(ECART_DE_PRIX)}, chaque ${c.unite} rapporte moins. Calculez la marge par ${c.unite} au prix baissé : la marge unitaire du trimestre moins ${pct(ECART_DE_PRIX)} de ${eur(b.prix)}.`;
      },
      champs: (c) => {
        const b = base(c);
        const v = volumeNecessaire(c);
        return [
          {
            libelle: `Marge par ${c.unite} au prix baissé`,
            attendu: v.margeBaissee,
            calcul: `${eur(v.margeUnitaire)} − ${pct(ECART_DE_PRIX)} × ${eur(b.prix)} = ${eur(v.margeBaissee)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const v = volumeNecessaire(c);
        return [`Chaque ${c.unite} ${accord(c, "vendu")} au prix baissé ne laisse plus que ${eur(v.margeBaissee)}, au lieu de ${eur(v.margeUnitaire)}. Combien faut-il en vendre pour s'y retrouver ?`];
      },
    },
    {
      id: "volume-au-curseur",
      type: "curseur",
      titre: "Le volume qu'il faudrait",
      notions: ["contribution_margin", "price_elasticity"],
      question: (c) => {
        const b = base(c);
        return `Faites varier les ventes du trimestre au prix baissé. Placez le curseur sur la plus petite quantité qui garde au moins la marge du trimestre, ${eur(b.marge)}.`;
      },
      grandeur: (c) => ({ libelle: "Ventes du trimestre au prix baissé", unite: c.unites }),
      cible: (c) => {
        const b = base(c);
        const v = volumeNecessaire(c);
        return { attendu: v.quantite, min: Math.floor(b.quantite / 10) * 10, max: Math.ceil((v.quantite * 1.3) / 10) * 10 };
      },
      lecture: (c, q) => {
        const b = base(c);
        const v = volumeNecessaire(c);
        const marge = auCentime(q * v.margeBaissee);
        return [
          { libelle: `Marge par ${c.unite} au prix baissé`, montant: v.margeBaissee },
          { libelle: "Marge au prix baissé", montant: marge },
          { libelle: "Marge du trimestre, au prix actuel", montant: b.marge },
          { libelle: "Écart", montant: auCentime(marge - b.marge), fort: true },
        ];
      },
      droites: (c) => {
        const b = base(c);
        const v = volumeNecessaire(c);
        return { produit: (q) => q * v.margeBaissee, cout: () => b.marge, libelles: ["Marge au prix baissé", "Marge du trimestre"] };
      },
      zones: ["Marge gardée", "Marge perdue"],
      rates: () => ({
        dessous: "À ce volume, la baisse de prix fait perdre de la marge.",
        dessus: "Moins de ventes suffiraient encore : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer le volume",
      explication: (c) => {
        const b = base(c);
        const v = volumeNecessaire(c);
        return [
          `Pour ${pct(ECART_DE_PRIX)} de prix en moins, il faut vendre ${pct(v.quantite / b.quantite - 1)} de plus : ${qte(v.quantite)} ${c.unites} au lieu de ${qte(b.quantite)}. Une baisse de prix se paie en volume, et le volume a ses limites : la demande, et ce que l'on produit.`,
        ];
      },
    },
    {
      id: "l-arene-joue",
      type: "lecture",
      titre: "L'arène joue les trois prix",
      notions: ["price_elasticity"],
      tableau: tableauDesPrix,
      texte: (c) => {
        const [bas, , haut] = prixRejoues(c.code);
        const v = volumeNecessaire(c);
        return [
          `L'arène a rejoué le trimestre de ${c.entreprise} aux trois prix. À −${pct(ECART_DE_PRIX)}, elle vend ${qte(bas!.quantite)} ${c.unites} (il en aurait fallu ${qte(v.quantite)} pour garder la marge) ; à +${pct(ECART_DE_PRIX)}, ${qte(haut!.quantite)}.`,
          "La demande non servie, ce sont les clients venus acheter que le plan de production n'a pas pu servir : quand elle grossit, c'est le plan, pas le prix, qui borne les ventes.",
        ];
      },
    },
    {
      id: "meilleur-prix",
      type: "choix",
      titre: "Le meilleur prix",
      notions: ["price_elasticity", "contribution_margin"],
      tableau: tableauDesPrix,
      question: (c) => `Des trois prix joués par l'arène, lequel donne à ${c.entreprise} le meilleur résultat d'exploitation ?`,
      options: (c) => {
        const m = meilleurPrix(c);
        return prixRejoues(c.code).map((x, i) => ({
          texte: `${LIBELLES[i]} (${eur(x.prix)})`,
          juste: x.facteur === m.facteur,
          retour:
            x.facteur === m.facteur
              ? `Oui : ${eur(x.resultat)} de résultat d'exploitation, le meilleur des trois. ${x.facteur < 1 ? "La demande a suivi la baisse assez fort pour la payer." : x.facteur > 1 ? "Les clients perdus coûtent moins que ce que rapportent les autres, payés plus cher." : "Ni la hausse ni la baisse ne font mieux : le prix du trimestre était bien placé."}`
              : `${eur(x.resultat)} de résultat d'exploitation, pour ${eur(m.resultat)} au meilleur des trois.`,
        }));
      },
    },
    {
      id: "ce-qui-borne",
      type: "choix",
      titre: "Ce qui borne les ventes",
      notions: ["price_elasticity", "capacity"],
      tableau: tableauDesPrix,
      question: (c) => {
        const b = base(c);
        const bas = baisse(c);
        return `À −${pct(ECART_DE_PRIX)}, les ventes passent de ${qte(b.quantite)} à ${qte(bas.quantite)} ${c.unites}. Qu'est-ce qui les a bornées ?`;
      },
      options: (c) => {
        const bas = baisse(c);
        const plan = bas.perdues > 0;
        return [
          {
            texte: "Le plan de production : le marché demandait plus que ce qui était produit.",
            juste: plan,
            retour: plan
              ? `Oui : ${qte(bas.perdues)} ${c.unites} ${accordPluriel(c, "demandé")} n'ont pas été ${accordPluriel(c, "servi")}. Baisser le prix sans produire plus, c'est vendre moins cher les mêmes unités.`
              : "Non : toute la demande a été servie, rien n'est resté sur la table.",
          },
          {
            texte: "La demande : les clients n'achètent pas autant de plus que la baisse l'exigerait.",
            juste: !plan,
            retour: !plan
              ? "Oui : toute la demande a été servie, et elle n'a pas assez grandi. C'est l'élasticité de la demande au prix : chez ces clients, elle ne suffit pas à payer la baisse."
              : `Non : la demande était là, ${qte(bas.perdues)} ${c.unites} n'ont pas été ${accordPluriel(c, "servi")} faute de production.`,
          },
          {
            texte: "Les concurrents, qui ont baissé leurs prix en même temps.",
            juste: false,
            retour: "Les concurrents ont joué le même trimestre que d'habitude : seul le prix de l'entreprise a changé.",
          },
        ];
      },
    },
    {
      id: "fabriquer-ou-acheter",
      type: "montants",
      titre: "Fabriquer ou acheter",
      notions: ["contribution_margin", "capacity"],
      si: (c) => sousTraitance(c.code) !== null,
      question: (c) => {
        const k = commandeDeNova(c);
        const b = base(c);
        return `${c.entreprise} peut produire ${qte(b.capacite)} ${c.unites} par trimestre ; elle en a produit ${qte(b.production)}. ${accord(c, "Un")} ${c.unite} ${accord(c, "fabriqué")} lui coûte ${eur(k.coutVariableUnitaire)} de coûts variables ; son sous-traitant le livre fini à ${eur(k.coutUnitaire)}. Calculez la capacité restante, puis la marge d'${accord(c, "un")} ${c.unite} ${accord(c, "vendu")} ${eur(k.prix)}, ${accord(c, "fabriqué")}, puis ${accord(c, "sous-traité")}.`;
      },
      champs: (c) => {
        const k = commandeDeNova(c);
        const b = base(c);
        return [
          {
            libelle: "Capacité restante du trimestre",
            attendu: k.restante,
            calcul: `${qte(b.capacite)} − ${qte(b.production)} = ${qte(k.restante)} ${c.unites}`,
            tolerance: 0,
          },
          {
            libelle: `Marge d'${accord(c, "un")} ${c.unite} ${accord(c, "fabriqué")}`,
            attendu: k.margeFabriquee,
            calcul: `${eur(k.prix)} − ${eur(k.coutVariableUnitaire)} = ${eur(k.margeFabriquee)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Marge d'${accord(c, "un")} ${c.unite} ${accord(c, "sous-traité")}`,
            attendu: k.margeSousTraitee,
            calcul: `${eur(k.prix)} − ${eur(k.coutUnitaire)} = ${eur(k.margeSousTraitee)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: () => [
        "Les charges fixes ne comptent pas : le local, l'équipe et les machines sont payés qu'on fabrique ou non. Ce qui départage, c'est le coût de chaque unité de plus : son coût variable si on la fabrique, le prix du sous-traitant si on l'achète.",
      ],
    },
    {
      id: "la-commande",
      type: "choix",
      titre: "La commande au-delà de la capacité",
      notions: ["contribution_margin", "capacity"],
      si: (c) => sousTraitance(c.code) !== null,
      question: (c) => {
        const k = commandeDeNova(c);
        return `Un client commande ${qte(k.commande)} ${c.unites} de plus ce trimestre, au prix de ${eur(k.prix)}. Il reste de quoi en fabriquer ${qte(k.restante)}. Que fait ${c.entreprise} ?`;
      },
      options: (c) => {
        const k = commandeDeNova(c);
        return [
          {
            texte: `Elle fabrique ${qte(k.fabriquee)} ${c.unites} et fait sous-traiter les ${qte(k.soustraitee)} autres.`,
            juste: true,
            retour: `Oui : ${qte(k.fabriquee)} × ${eur(k.margeFabriquee)} + ${qte(k.soustraitee)} × ${eur(k.margeSousTraitee)} = ${eur(k.gain)} de marge en plus. Fabriquer d'abord, parce que c'est moins cher tant qu'il reste de la capacité ; sous-traiter ensuite, parce qu'une unité sous-traitée rapporte encore ${eur(k.margeSousTraitee)}.`,
          },
          {
            texte: "Elle fait tout sous-traiter : c'est plus simple.",
            juste: false,
            retour: `Chaque ${c.unite} ${accord(c, "sous-traité")} alors qu'${pronom(c)} pouvait être ${accord(c, "fabriqué")} coûte ${eur(k.coutUnitaire - k.coutVariableUnitaire)} de marge : ${eur(k.fabriquee * (k.coutUnitaire - k.coutVariableUnitaire))} perdus sur la commande.`,
          },
          {
            texte: "Elle n'accepte que ce qu'elle peut fabriquer : sous-traiter rapporte trop peu.",
            juste: false,
            retour: `${accord(c, "Un")} ${c.unite} ${accord(c, "sous-traité")} rapporte encore ${eur(k.margeSousTraitee)} : refuser les ${qte(k.soustraitee)} ${accordPluriel(c, "dernier")}, c'est laisser ${eur(k.soustraitee * k.margeSousTraitee)} de marge, et un client mécontent.`,
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["contribution_margin", "price_elasticity"],
      texte: (c) => {
        const m = meilleurPrix(c);
        return [
          `Vous avez prévu l'effet d'un prix sur la marge, puis vu l'arène le jouer : pour ${c.entreprise}, le meilleur des trois prix donne ${eur(m.resultat)} de résultat d'exploitation au trimestre.`,
          "Décider, c'est comparer ce qui change : la marge de chaque unité, le volume que le marché accepte, la capacité qui borne. Dans l'arène, chaque tour est une décision de ce genre ; vous savez maintenant la calculer avant de la prendre.",
        ];
      },
      repere: () =>
        "Volume à vendre après une baisse de prix = marge à garder ÷ nouvelle marge unitaire. Fabriquer ou acheter : comparer le coût variable de l'unité fabriquée au prix du sous-traitant, dans la limite de la capacité.",
    },
  ],
};
