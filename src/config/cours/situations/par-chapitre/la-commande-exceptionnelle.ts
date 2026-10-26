import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../../scenarios/registry";
import { accord, accordPluriel } from "../../accords";
import { anneeJouee, type Cas } from "../../cas";
import { ENTREPRISES_DE_L_ORGANISATION, activiteDuTrimestre } from "../../chapitres/organiser-l-activite";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER L'ACTIVITÉ » : LA COMMANDE EXCEPTIONNELLE (Seconde,
 * option management et gestion, palier 1).
 *
 * Au premier trimestre, l'arène propose à l'entreprise une commande exceptionnelle (son pool
 * `orderOffers`, tiré à la graine du cours) : un volume ferme, à un prix imposé, à livrer dans le
 * trimestre. La direction demande si l'on peut la livrer en entier, et sinon, si un renfort
 * suffirait. L'élève refait les calculs du chapitre : la capacité de l'entreprise, la production
 * qu'il faudrait pour servir les clients habituels et la commande, ce qui reste pour la commande à
 * pleine capacité ; puis il rend sa réponse, en tenant compte du délai d'un renfort.
 *
 * Le cas est neuf par sa question : le chapitre dit ce qui a limité les ventes du trimestre ; le
 * cas demande si une commande de plus y tient. La règle est celle du moteur : la commande se sert
 * sur ce qui reste une fois les clients habituels servis (stock de départ et production du
 * trimestre). L'arène rejoue le trimestre, la commande acceptée, et la production portée à la
 * capacité quand celle qui était prévue ne suffit pas : ce qu'elle livre est le chiffre du cas.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "deja-prevue" | "en-produisant-plus" | "pas-en-entier";

/** La commande du premier trimestre, ce qu'il faudrait produire, et ce que l'arène en livre. */
export function commandeExceptionnelle(c: Cas) {
  const a = activiteDuTrimestre(c);
  const s = scenarioByCode(c.code).scenario;
  const { partie } = anneeJouee(c.code);
  const proposee = partie.rounds[0]!.results["joueur"]!.orderOffer!;
  const offre = s.orderOffers!.find((o) => o.code === proposee.code)!;
  const productionNecessaire = Math.max(0, a.demande + offre.units - a.stock);
  const livrable = Math.min(offre.units, Math.max(0, a.stock + a.capacite - a.demande));
  const verdict: Verdict =
    productionNecessaire <= a.production ? "deja-prevue" : productionNecessaire <= a.capacite ? "en-produisant-plus" : "pas-en-entier";
  // L'arène rejoue le trimestre, la commande acceptée ; la production portée à la capacité si celle
  // qui était prévue ne suffit pas.
  const rejoue = rejouerAvec(c.code, `organiser-l-activite:commande-${verdict === "deja-prevue" ? "prevue" : "a-pleine-capacite"}`, (tour, d) =>
    tour === 1 ? { ...d, acceptOrder: true, ...(verdict === "deja-prevue" ? {} : { productionPlan: a.capacite }) } : undefined,
  )[0]!;
  return {
    a,
    titre: offre.title,
    unites: offre.units,
    prix: offre.price,
    productionNecessaire,
    livrable,
    livreeParLArene: Math.round(rejoue.orderOffer?.delivered ?? 0),
    verdict,
  };
}

export const LA_COMMANDE_EXCEPTIONNELLE: Situation = {
  code: "la-commande-exceptionnelle",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["organiser-l-activite"],
  commanditaire: "La direction",
  titre: "La commande exceptionnelle",
  accroche:
    "Un client propose une grosse commande, à livrer dans le trimestre, en plus des clients habituels. Peut-on la livrer en entier, et sinon, un renfort arriverait-il à temps ?",
  objectifs: [
    "Calculer la capacité de l'entreprise",
    "Calculer la production qu'il faut pour servir tous les clients",
    "Dire ce qui reste pour une commande de plus, à pleine capacité",
    "Répondre à la direction en tenant compte des délais",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION,
    pourquoi:
      "ce cas compte ce qu'une équipe et ses équipements font d'un seul produit en un trimestre : la boutique vend une gamme d'articles qui ne demandent pas le même temps de travail, et la salle de sport garde ses adhérents d'un trimestre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La commande proposée",
      texte: (c) => {
        const k = commandeExceptionnelle(c);
        return [
          `« Une commande exceptionnelle nous arrive : ${k.titre}. Il faudrait livrer ${qte(k.unites)} ${c.unites} ce trimestre, à ${eur(k.prix)} par ${c.unite}, en plus de nos clients habituels. Pouvons-nous la livrer en entier ? Et sinon, faut-il embaucher ou acheter un équipement ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. Les clients habituels passent d'abord : la commande se sert sur ce qui reste.",
        ];
      },
      tableau: (c) => {
        const k = commandeExceptionnelle(c);
        const a = k.a;
        return {
          titre: `Le premier trimestre ${dE(c.entreprise)}, et la commande`,
          colonnes: [c.unites.charAt(0).toUpperCase() + c.unites.slice(1)],
          lignes: [
            { libelle: "Capacité des équipements", valeurs: [qte(a.outil)] },
            { libelle: "Capacité de l'équipe", valeurs: [qte(a.equipe)] },
            ...(a.stock > 0 ? [{ libelle: "Stock de départ", valeurs: [qte(a.stock)] }] : []),
            { libelle: "Production prévue", valeurs: [qte(a.production)] },
            { libelle: "Demande des clients habituels", valeurs: [qte(a.demande)] },
            { libelle: "Commande proposée", valeurs: [qte(k.unites)] },
          ],
        };
      },
      repere: () => "À rendre : la production qu'il faudrait, ce qui reste pour la commande à pleine capacité, et votre réponse.",
    },
    {
      id: "ce-qui-reste",
      type: "montants",
      titre: "Ce qui reste pour la commande",
      notions: ["capacity"],
      question: (c) =>
        `Calculez la capacité de l'entreprise, la production qu'il faudrait pour servir les clients habituels et la commande (${c.unites}, stock de départ déduit), puis ce qui reste pour la commande si l'entreprise produit à pleine capacité (sans dépasser la commande ; zéro s'il ne reste rien).`,
      champs: (c) => {
        const k = commandeExceptionnelle(c);
        const a = k.a;
        const reste = a.stock + a.capacite - a.demande;
        const avecStock = a.stock > 0 ? ` − ${qte(a.stock)}` : "";
        return [
          { libelle: "Capacité de l'entreprise", attendu: a.capacite, calcul: `la plus petite de ${qte(a.outil)} et ${qte(a.equipe)} : ${qte(a.capacite)}` },
          { libelle: "Production pour tout servir", attendu: k.productionNecessaire, calcul: `${qte(a.demande)} + ${qte(k.unites)}${avecStock} = ${qte(k.productionNecessaire)}` },
          {
            libelle: "Reste pour la commande",
            attendu: k.livrable,
            calcul:
              reste <= 0
                ? `${a.stock > 0 ? `${qte(a.stock)} + ` : ""}${qte(a.capacite)} − ${qte(a.demande)} : il ne reste rien`
                : reste >= k.unites
                  ? `${a.stock > 0 ? `${qte(a.stock)} + ` : ""}${qte(a.capacite)} − ${qte(a.demande)} = ${qte(reste)}, plus que la commande : ${qte(k.unites)}`
                  : `${a.stock > 0 ? `${qte(a.stock)} + ` : ""}${qte(a.capacite)} − ${qte(a.demande)} = ${qte(k.livrable)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = commandeExceptionnelle(c);
        const plan = k.verdict === "deja-prevue" ? "la commande acceptée, la production telle qu'elle était prévue" : "la commande acceptée et la production portée à la capacité";
        return [
          k.livreeParLArene > 0
            ? `L'arène rejoue le trimestre, ${plan} : ${c.entreprise} en livre ${qte(k.livreeParLArene)} sur ${qte(k.unites)}.`
            : `L'arène rejoue le trimestre, ${plan} : ${c.entreprise} n'en livre ${accord(c, "aucun")}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["capacity"],
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const k = commandeExceptionnelle(c);
        const a = k.a;
        return [
          {
            texte: "La livrer en entier, sans rien produire de plus que prévu",
            juste: k.verdict === "deja-prevue",
            retour:
              k.verdict === "deja-prevue"
                ? `Oui : pour servir les clients habituels et la commande, il faut produire ${qte(k.productionNecessaire)} ${c.unites}, et la production prévue en fait déjà ${qte(a.production)}.`
                : `Non : il faudrait produire ${qte(k.productionNecessaire)} ${c.unites}, et la production prévue n'en fait que ${qte(a.production)}.`,
          },
          {
            texte: "La livrer en entier, en produisant plus, sans dépasser la capacité",
            juste: k.verdict === "en-produisant-plus",
            retour:
              k.verdict === "en-produisant-plus"
                ? `Oui : il faut produire ${qte(k.productionNecessaire)} ${c.unites}, plus que les ${qte(a.production)} ${accordPluriel(c, "prévu")}, mais moins que la capacité de ${qte(a.capacite)}. Il suffit de prévoir plus, ce trimestre même.`
                : k.verdict === "deja-prevue"
                  ? "Non : inutile de produire plus, la production prévue suffit déjà."
                  : `Non : il faudrait produire ${qte(k.productionNecessaire)} ${c.unites}, plus que la capacité de ${qte(a.capacite)}.`,
          },
          {
            texte: "Prévenir le client que l'on ne pourra pas tout livrer ce trimestre",
            juste: k.verdict === "pas-en-entier",
            retour:
              k.verdict === "pas-en-entier"
                ? `Oui : même à pleine capacité, ${k.livrable > 0 ? `${accordPluriel(c, "seul")} ${qte(k.livrable)} ${c.unites} pourraient être ${accordPluriel(c, "livré")}, sur ${qte(k.unites)}` : `il ne reste rien pour les ${qte(k.unites)} ${c.unites} de la commande`}. Un salarié ou un équipement décidé maintenant n'arriverait qu'au trimestre suivant : trop tard pour cette commande.`
                : `Non : ${c.entreprise} peut livrer les ${qte(k.unites)} ${c.unites} ce trimestre.`,
          },
          {
            texte: "Tout livrer en embauchant dès maintenant un salarié, qui produira dès ce trimestre",
            juste: false,
            retour: "Non : un salarié embauché maintenant n'arrive qu'au trimestre suivant, et un équipement acheté aussi. Ce trimestre, l'entreprise ne compte que sur l'équipe et les équipements qu'elle a.",
          },
        ];
      },
    },
  ],
};
