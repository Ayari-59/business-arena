import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_VENTES, PRIX_DU_CURSEUR, tableauDesVentes, ventesEtMarge } from "../../chapitres/les-ecarts-sur-ventes-et-marge";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ÉCARTS SUR CHIFFRE D'AFFAIRES ET SUR MARGE » : L'OBJECTIF DU
 * COMMERCIAL (contrôle de gestion, palier 4).
 *
 * La direction avait fixé au commercial un objectif de chiffre d'affaires : celui du budget. Il
 * annonce l'avoir tenu, à 400 € près. Avant son entretien, elle veut savoir ce que ses ventes ont
 * fait à la marge. L'élève refait seul le chemin du chapitre : l'écart sur chiffre d'affaires et
 * ses deux parts, l'écart sur prix modèle par modèle, l'écart sur marge à la marge préétablie, puis
 * l'écart sur volume croisé en quantité globale et composition. La réponse demande un jugement :
 * l'objectif est tenu, mais c'était le mauvais objectif. Un curseur sur le prix de la Nomade montre,
 * avant la réponse, qu'un prix pouvait tenir l'objectif de chiffre d'affaires sans tenir la marge.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `ventesEtMarge`, sur l'usine de NOVA. Convention : un écart est le réel
 * moins le prévu ; sur un chiffre d'affaires ou une marge, positif est favorable.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const auCentime = (x: number) => Math.round(x * 100) / 100;
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

export type Verdict = "tenu-sans-la-marge" | "tenu";

/** Les chiffres du cas, et le verdict : l'objectif de chiffre d'affaires a-t-il tenu la marge ? */
export function objectifDuCommercial(c: Pick<Cas, "code">) {
  const x = ventesEtMarge(c);
  // Le modèle dont l'écart sur prix pèse le plus, en valeur absolue.
  const prixLePlusLourd = x.parModele.reduce((a, b) => (Math.abs(b.prix) > Math.abs(a.prix) ? b : a));
  const verdict: Verdict = x.ecartSurMarge < 0 ? "tenu-sans-la-marge" : "tenu";
  return { x, prixLePlusLourd, verdict };
}

export const L_OBJECTIF_DU_COMMERCIAL: Situation = {
  code: "l-objectif-du-commercial",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-ecarts-sur-ventes-et-marge"],
  commanditaire: "La direction",
  titre: "L'objectif du commercial",
  accroche:
    "Le commercial avait un objectif de chiffre d'affaires, et il annonce l'avoir tenu. Avant son entretien, la direction veut savoir ce que ses ventes ont fait à la marge.",
  objectifs: [
    "Décomposer l'écart sur chiffre d'affaires en écart sur prix, modèle par modèle, et écart sur quantités",
    "Calculer l'écart sur marge à la marge préétablie",
    "Croiser l'écart sur volume, la quantité globale et la composition des ventes",
    "Juger un objectif de chiffre d'affaires, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_VENTES,
    pourquoi: "ce cas reprend le chapitre « Les écarts sur chiffre d'affaires et sur marge », qui se calcule à la marge préétablie de l'usine du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDesVentes,
      texte: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          `« Nous avions fixé à notre commercial un objectif de chiffre d'affaires pour le trimestre : celui du budget, ${eur(x.caPrevu)}. Il a fait ${eur(x.caReel)}, et il annonce l'avoir tenu, à ${eur(Math.abs(x.ecartDeCa))} près. Je le reçois pour son entretien. Avant, je veux savoir ce que ses ventes ont fait à notre marge, et si l'objectif que nous lui avions donné était le bon. »`,
          "Pas de cours cette fois : vous avez les ventes prévues et réelles, et la fiche de coût préétabli. La méthode est celle du chapitre, à vous de l'enchaîner.",
        ];
      },
      repere: () =>
        "À rendre : l'écart sur chiffre d'affaires et ses parts, l'écart sur marge à la marge préétablie, l'écart sur volume et ses deux parts, et votre réponse. Un écart, c'est le réel moins le prévu ; sur une vente ou une marge, positif est favorable.",
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "L'écart sur chiffre d'affaires",
      notions: ["volume_price_variance", "revenue"],
      question: (c) => {
        const { x } = objectifDuCommercial(c);
        const [a, b] = x.parModele;
        return `Calculez l'écart sur prix de la ${a!.nom}, celui de la ${b!.nom}, puis l'écart sur quantités, et vérifiez qu'ils font l'écart sur chiffre d'affaires. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `Écart sur prix de la ${m.nom}`,
            attendu: m.prix,
            calcul: `(${eur(m.pr)} − ${eur(m.pp)}) × ${qte(m.qr)} = ${eur(m.prix)}`,
          })),
          {
            libelle: "Écart sur quantités",
            attendu: x.quantitesSurCa,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(m.qp)}) × ${eur(m.pp)}`).join(" + ")} = ${eur(x.quantitesSurCa)}`,
          },
        ];
      },
      explication: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          `${x.parModele.map((m) => entre(m.prix)).join(" + ")} + ${entre(x.quantitesSurCa)} = ${eur(x.ecartDeCa)} : l'écart sur chiffre d'affaires. Le commercial a vendu plus de ${x.parModele[1]!.nom} et moins de ${x.parModele[0]!.nom}, et pas aux prix du budget.`,
        ];
      },
    },
    {
      id: "la-marge",
      type: "montants",
      titre: "L'écart sur marge",
      notions: ["contribution_margin", "standard_costing"],
      question: () =>
        "Les coûts de production ne sont pas l'affaire du commercial : jugez ses ventes à la marge préétablie. Calculez la marge préétablie prévue, la marge réelle au coût préétabli, puis l'écart sur marge. Négatif pour un écart défavorable.",
      champs: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          {
            libelle: "Marge préétablie prévue",
            attendu: x.margePrevue,
            calcul: `${x.parModele.map((m) => `${qte(m.qp)} × (${eur(m.pp)} − ${eur(m.coutPreetabli)})`).join(" + ")} = ${eur(x.margePrevue)}`,
          },
          {
            libelle: "Marge réelle au coût préétabli",
            attendu: x.margeReelle,
            calcul: `${x.parModele.map((m) => `${qte(m.qr)} × (${eur(m.pr)} − ${eur(m.coutPreetabli)})`).join(" + ")} = ${eur(x.margeReelle)}`,
          },
          { libelle: "Écart sur marge", attendu: x.ecartSurMarge, calcul: `${eur(x.margeReelle)} − ${eur(x.margePrevue)} = ${eur(x.ecartSurMarge)}` },
        ];
      },
      explication: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          `Le chiffre d'affaires est à ${eur(x.ecartDeCa)} du budget, la marge à ${eur(x.ecartSurMarge)}. L'écart sur prix, ${eur(x.prix)}, passe tout entier dans la marge ; les quantités n'y ajoutent que ${eur(x.volume)}.`,
        ];
      },
    },
    {
      id: "le-volume",
      type: "montants",
      titre: "Ce que cache le volume",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () =>
        "Calculez l'écart sur volume à la marge préétablie, puis partagez-le en écart sur quantité globale et écart sur composition des ventes. Négatif pour un écart défavorable.",
      champs: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          {
            libelle: "Écart sur volume",
            attendu: x.volume,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(m.qp)}) × ${eur(m.margePreetablie)}`).join(" + ")} = ${eur(x.volume)}`,
          },
          {
            libelle: "Écart sur quantité globale",
            attendu: x.quantiteGlobale,
            calcul: `(${qte(x.qTotaleReelle)} − ${qte(x.qTotalePrevue)}) × (${eur(x.margePrevue)} ÷ ${qte(x.qTotalePrevue)}) = (${qte(x.qTotaleReelle)} − ${qte(x.qTotalePrevue)}) × ${eur(x.margeMoyennePrevue)} = ${eur(x.quantiteGlobale)}`,
          },
          {
            libelle: "Écart sur composition des ventes",
            attendu: x.composition,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(m.auMixPrevu)}) × ${eur(m.margePreetablie)}`).join(" + ")} = ${eur(x.composition)}`,
          },
        ];
      },
      explication: (c) => {
        const { x } = objectifDuCommercial(c);
        return [
          `${eur(x.quantiteGlobale)} + ${entre(x.composition)} = ${eur(x.volume)} : les deux lectures du volume concordent. L'usine a vendu ${qte(Math.abs(x.ecartDeQuantiteTotale))} enceintes de moins que prévu ; le glissement vers la ${x.parModele[1]!.nom}, plus margée, a presque tout compensé.`,
        ];
      },
    },
    {
      id: "le-prix-qui-tenait",
      type: "curseur",
      titre: "Le prix qui tenait la marge",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const { x } = objectifDuCommercial(c);
        const [a] = x.parModele;
        return `Les quantités vendues restent celles du trimestre. Faites varier le prix réel de la ${a!.nom} et regardez le chiffre d'affaires et la marge réagir. Placez le curseur sur le plus petit prix qui tient la marge prévue, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Prix de la ${objectifDuCommercial(c).x.parModele[0]!.nom}`, unite: "€" }),
      cible: (c) => {
        const { x } = objectifDuCommercial(c);
        return { attendu: x.prixQuiTientLaMarge, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max };
      },
      zones: ["Marge prévue tenue", "Marge prévue manquée"],
      rates: () => ({
        dessous: "À ce prix, la marge du trimestre reste sous la marge prévue.",
        dessus: "Un prix plus bas tient encore la marge prévue : cherchez le plus petit.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, p) => {
        const { x } = objectifDuCommercial(c);
        const [a, b] = x.parModele;
        const marge = auCentime(a!.qr * (p - a!.coutPreetabli) + b!.margeReelle);
        return [
          { libelle: "Écart sur chiffre d'affaires", montant: auCentime(a!.qr * p + b!.caReel - x.caPrevu) },
          { libelle: "Écart sur marge", montant: auCentime(marge - x.margePrevue), fort: true },
        ];
      },
      droites: (c) => {
        const { x } = objectifDuCommercial(c);
        const [a, b] = x.parModele;
        return {
          produit: (p) => a!.qr * (p - a!.coutPreetabli) + b!.margeReelle,
          cout: () => x.margePrevue,
          libelles: ["Marge du trimestre, au coût préétabli", "Marge prévue"],
        };
      },
      explication: (c) => {
        const { x } = objectifDuCommercial(c);
        const [a] = x.parModele;
        return [
          `L'objectif de chiffre d'affaires était tenu dès ${eur(x.prixQuiTientLeChiffre)} la ${a!.nom} ; la marge prévue demandait ${eur(x.prixQuiTientLaMarge)}. Entre les deux, le commercial dépasse son objectif tout en faisant perdre de la marge : l'objectif mesurait autre chose que ce qu'il fallait tenir.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () => "Quelle réponse rendez-vous à la direction avant l'entretien ?",
      options: (c) => {
        const { x, prixLePlusLourd: p, verdict } = objectifDuCommercial(c);
        const chiffres = `Écart sur marge ${eur(x.ecartSurMarge)} : prix ${eur(x.prix)} (dont ${eur(p.prix)} sur la ${p.nom}), quantité globale ${eur(x.quantiteGlobale)}, composition ${eur(x.composition)}.`;
        return [
          {
            texte: `Objectif tenu, mais il coûte ${eur(Math.abs(x.ecartSurMarge))} de marge : il faut le fixer en marge`,
            juste: verdict === "tenu-sans-la-marge",
            retour:
              verdict === "tenu-sans-la-marge"
                ? `Oui. ${chiffres} Un objectif de chiffre d'affaires peut se tenir en cédant sur les prix : il ne protège pas la marge. Le commercial répond des prix et de la composition ; la quantité globale tient aussi au marché. Les causes, l'entretien les dira : les écarts disent où chercher.`
                : `Non. ${chiffres}`,
          },
          {
            texte: `Objectif tenu : ${eur(Math.abs(x.ecartDeCa))} sur ${eur(x.caPrevu)}, c'est négligeable, et les quantités ont rapporté ${eur(x.quantitesSurCa)}`,
            juste: verdict === "tenu",
            retour:
              verdict === "tenu"
                ? `Oui. ${chiffres}`
                : `Non : un écart global faible cache deux écarts forts, et les quantités se jugent à la marge, pas au prix : elles font ${eur(x.volume)}, pas ${eur(x.quantitesSurCa)}. ${chiffres}`,
          },
          {
            texte: `Ses ventes ont amélioré la marge : le mix lui fait gagner ${eur(Math.abs(x.composition))}, la prime est méritée`,
            juste: false,
            retour: `Non : le mix ne se lit pas seul. Il compense ${eur(x.quantiteGlobale)} de quantité globale, et l'écart sur prix (${eur(x.prix)}) emporte le reste. ${chiffres}`,
          },
          {
            texte: `La marge ne perd que ${eur(Math.abs(x.volume))} sur le volume : ses ventes n'y sont presque pour rien`,
            juste: false,
            retour: `Non : c'est oublier que l'écart sur prix de vente est un écart sur marge, et qu'il revient au commercial. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
