import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { bilanFonctionnel } from "./bilan-fonctionnel";

/**
 * CHAPITRE : FONDS DE ROULEMENT, BESOIN EN FONDS DE ROULEMENT ET TRÉSORERIE (Bac STMG, gestion
 * et finance, palier 1).
 *
 * Le bilan lu comme une histoire d'argent : les ressources durables (capitaux propres et
 * emprunts) paient d'abord l'équipement ; ce qui reste, le fonds de roulement, finance le cycle
 * de tous les jours, qui immobilise de l'argent chez les clients et dans les stocks (le besoin en
 * fonds de roulement). La différence est la trésorerie. Le chapitre calcule les trois, vérifie
 * qu'ils se tiennent, et cherche ce qui ferait monter la trésorerie.
 *
 * Le bilan du 31 décembre de l'arène, lu par le chapitre « Bilan fonctionnel » (`bilanFonctionnel`),
 * dont il reprend les grandeurs sous une forme simplifiée : capitaux propres plus emprunts, moins
 * équipement à sa valeur nette. Aucune hypothèse n'est ajoutée.
 */

const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le fonds de roulement, le besoin en fonds de roulement et la trésorerie du 31 décembre. */
export function fondsDeRoulement(c: Cas) {
  const b = bilanFonctionnel(c);
  const f = b.fin;
  const ressources = auCentime(f.capitauxPropres + f.emprunts);
  const frng = auCentime(ressources - f.immobilisationsNettes);
  const detteDeTva = f.tva > 0 ? f.tva : 0;
  const creanceDeTva = f.tva < 0 ? -f.tva : 0;
  const besoins = auCentime(f.stocks + f.creances + creanceDeTva);
  const dettesDuCycle = auCentime(f.fournisseurs + detteDeTva);
  const bfr = auCentime(besoins - dettesDuCycle);
  const disponible = auCentime(f.banque + f.placements);
  const tn = auCentime(disponible - f.decouvert);
  return { f, b, ressources, frng, besoins, dettesDuCycle, bfr, disponible, tn };
}

export const FONDS_DE_ROULEMENT: Chapitre = {
  code: "fonds-de-roulement-et-tresorerie",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 4 · Temps et risque",
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "STMG Thème 3 · Accompagner la prise de décision",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
  ],
  titre: "Fonds de roulement, besoin en fonds de roulement et trésorerie",
  accroche:
    "Les ressources durables paient l'équipement ; ce qui reste finance le quotidien, qui immobilise de l'argent chez les clients et dans les stocks. La différence, c'est la trésorerie.",
  objectifs: [
    "Calculer le fonds de roulement",
    "Calculer le besoin en fonds de roulement",
    "Calculer la trésorerie et vérifier l'équilibre fonds de roulement, besoin, trésorerie",
    "Expliquer ce qui fait monter ou baisser la trésorerie",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le bilan, une histoire d'argent",
      notions: ["frng", "bfr", "net_treasury"],
      texte: (c) => [
        `Le bilan ${dE(c.entreprise)} se lit aussi comme une histoire d'argent. Les ressources durables, celles qui restent dans l'entreprise des années (ce que les associés ont laissé, les emprunts), paient d'abord ce qui dure : l'équipement. Ce qui reste, c'est le fonds de roulement.`,
        "Le quotidien, lui, immobilise de l'argent : les clients qui n'ont pas encore payé, les stocks pas encore vendus. Les fournisseurs, qui n'ont pas encore été payés, en financent une partie. Ce qui reste à financer, c'est le besoin en fonds de roulement. Et ce que le fonds de roulement ne couvre pas, la banque l'avance : c'est la trésorerie, positive ou négative.",
      ],
      tableau: (c) => {
        const k = fondsDeRoulement(c);
        const f = k.f;
        return {
          titre: `Le bilan ${dE(c.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Capitaux propres", valeurs: [eur(f.capitauxPropres)] },
            { libelle: "Emprunts", valeurs: [eur(f.emprunts)] },
            { libelle: "Équipement (valeur nette)", valeurs: [eur(f.immobilisationsNettes)] },
            { libelle: "Stocks", valeurs: [eur(f.stocks)] },
            { libelle: "Créances sur les clients", valeurs: [eur(f.creances)] },
            ...(f.tva !== 0 ? [{ libelle: f.tva > 0 ? "TVA due à l'État" : "TVA à récupérer", valeurs: [eur(Math.abs(f.tva))] }] : []),
            { libelle: "Dettes envers les fournisseurs", valeurs: [eur(f.fournisseurs)] },
            { libelle: "Banque et placements", valeurs: [eur(k.disponible)] },
            { libelle: "Découvert bancaire", valeurs: [eur(f.decouvert)] },
          ],
        };
      },
      repere: () => "Fonds de roulement − besoin en fonds de roulement = trésorerie.",
    },
    {
      id: "frng",
      type: "montants",
      titre: "Le fonds de roulement",
      notions: ["frng"],
      question: () => "Calculez les ressources durables (capitaux propres + emprunts), puis le fonds de roulement : ce qui reste une fois l'équipement payé.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Ressources durables", attendu: k.ressources, calcul: `${eur(k.f.capitauxPropres)} + ${eur(k.f.emprunts)} = ${eur(k.ressources)}`, tolerance: 1 },
          { libelle: "Fonds de roulement", attendu: k.frng, calcul: `${eur(k.ressources)} − ${eur(k.f.immobilisationsNettes)} = ${eur(k.frng)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          k.frng >= 0
            ? `Une fois son équipement payé, ${c.entreprise} garde ${eur(k.frng)} de ressources durables pour financer son quotidien.`
            : `Les ressources durables ne paient même pas tout l'équipement : il manque ${eur(-k.frng)}, que le quotidien doit financer. C'est une situation fragile.`,
        ];
      },
    },
    {
      id: "bfr",
      type: "montants",
      titre: "Le besoin en fonds de roulement",
      notions: ["bfr"],
      question: () => "Calculez ce que le cycle immobilise (stocks, créances sur les clients, TVA à récupérer), ce que financent les dettes du cycle (fournisseurs, TVA due), puis le besoin en fonds de roulement.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Ce que le cycle immobilise", attendu: k.besoins, calcul: `stocks + créances${k.f.tva < 0 ? " + TVA à récupérer" : ""} = ${eur(k.besoins)}`, tolerance: 1 },
          { libelle: "Dettes du cycle", attendu: k.dettesDuCycle, calcul: `fournisseurs${k.f.tva > 0 ? " + TVA due" : ""} = ${eur(k.dettesDuCycle)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfr, calcul: `${eur(k.besoins)} − ${eur(k.dettesDuCycle)} = ${eur(k.bfr)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          k.bfr >= 0
            ? `Le quotidien ${dE(c.entreprise)} immobilise ${eur(k.bfr)} : de l'argent qui attend chez les clients et dans les stocks, une fois déduit ce que les fournisseurs avancent.`
            : `Le besoin est négatif : ${k.f.tva > 0 ? "les fournisseurs et l'État financent" : "les fournisseurs financent"} plus que ce qui attend chez les clients et dans les stocks. Le quotidien apporte de l'argent au lieu d'en consommer, comme dans le commerce en ligne où le client paie à la commande.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "La trésorerie",
      notions: ["net_treasury"],
      question: () => "Calculez la trésorerie par le bilan (banque et placements moins découvert), puis vérifiez-la par la différence entre le fonds de roulement et le besoin en fonds de roulement.",
      champs: (c) => {
        const k = fondsDeRoulement(c);
        return [
          { libelle: "Trésorerie (banque − découvert)", attendu: k.tn, calcul: `${eur(k.disponible)} − ${eur(k.f.decouvert)} = ${eur(k.tn)}`, tolerance: 1 },
          { libelle: "Fonds de roulement − besoin", attendu: auCentime(k.frng - k.bfr), calcul: `${eur(k.frng)} ${k.bfr < 0 ? `+ ${eur(-k.bfr)}` : `− ${eur(k.bfr)}`} = ${eur(auCentime(k.frng - k.bfr))}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = fondsDeRoulement(c);
        return [
          // Les postes du bilan sont arrondis au centime, un par un : les deux calculs peuvent différer d'un centime.
          `Les deux calculs donnent ${eur(k.tn)}${auCentime(k.frng - k.bfr) !== k.tn ? ", au centime d'arrondi près" : ""} : la trésorerie est ce que le fonds de roulement laisse une fois le besoin du quotidien financé. ${k.tn >= 0 ? "Le fonds de roulement couvre le besoin, et il reste de l'argent en banque." : "Le fonds de roulement ne couvre pas le besoin : la banque avance la différence, par le découvert."}`,
        ];
      },
    },
    {
      id: "clients",
      type: "choix",
      titre: "Si les clients payaient plus vite",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: (c) => {
        const k = fondsDeRoulement(c);
        return `Au 31 décembre, les clients ${dE(c.entreprise)} lui doivent ${eur(k.f.creances)}. S'ils payaient plus vite, que deviendrait sa trésorerie, toutes choses égales par ailleurs ?`;
      },
      options: (c) => {
        const k = fondsDeRoulement(c);
        return [
          {
            texte: "Elle monterait : le besoin en fonds de roulement baisserait",
            juste: true,
            retour: `Oui : chaque euro encaissé plus tôt sort des créances et entre en banque. Le besoin en fonds de roulement baisse d'autant, et la trésorerie monte, sans que le fonds de roulement ait bougé. Ici, les créances pèsent ${eur(k.f.creances)} sur les ${eur(k.besoins)} que le cycle immobilise : un levier ${k.tn < 0 ? "pour sortir du découvert" : "pour renforcer la trésorerie"}.`,
          },
          {
            texte: "Elle ne bougerait pas : le résultat ne change pas",
            juste: false,
            retour: "Non : le résultat ne change pas, c'est vrai, mais l'argent arrive plus tôt. La trésorerie ne dépend pas que du résultat : elle dépend aussi du moment où l'on encaisse et où l'on paie.",
          },
          {
            texte: "Elle baisserait : le fonds de roulement baisserait",
            juste: false,
            retour: "Non : le fonds de roulement dépend des capitaux propres, des emprunts et de l'équipement ; les délais des clients n'y touchent pas. Ils jouent sur le besoin en fonds de roulement.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["frng", "bfr", "net_treasury"],
      texte: (c) => {
        const k = fondsDeRoulement(c);
        return [
          `Au 31 décembre, ${c.entreprise} a un fonds de roulement de ${eur(k.frng)}, un besoin en fonds de roulement de ${eur(k.bfr)}, et donc une trésorerie de ${eur(k.tn)}.`,
          "Pour améliorer sa trésorerie, une entreprise a deux leviers : augmenter son fonds de roulement (un apport des associés, un emprunt, des bénéfices laissés dans l'entreprise), ou réduire son besoin (des clients qui paient plus vite, moins de stock, des fournisseurs payés plus tard).",
        ];
      },
      repere: () => "Fonds de roulement = ressources durables − équipement. Besoin en fonds de roulement = stocks + créances − dettes du cycle. Trésorerie = fonds de roulement − besoin.",
    },
  ],
};
