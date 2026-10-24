import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { ENDETTEMENT_MAXIMAL } from "../financement";
import { bilanFonctionnel } from "./bilan-fonctionnel";

/**
 * CHAPITRE : LE BILAN (Bac STMG, gestion et finance, palier 1).
 *
 * Le compte de résultat raconte une année ; le bilan est une photographie, au 31 décembre : ce
 * que l'entreprise possède (l'actif) et d'où vient l'argent qui l'a payé (le passif). Le chapitre
 * range les postes, vérifie que les deux côtés s'égalent, puis lit deux équilibres : ce que les
 * associés ont apporté face à ce qui est dû, et l'argent disponible face au découvert.
 *
 * Le bilan est celui de l'arène au 31 décembre de l'année jouée, en grandes masses, que le
 * chapitre « Bilan fonctionnel » vérifie au centime (`bilanFonctionnel`). Aucune hypothèse.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le bilan du 31 décembre, ses totaux et ses équilibres. */
export function bilanDeFinDAnnee(c: Cas) {
  const f = bilanFonctionnel(c).fin;
  // Une TVA négative est un crédit de TVA : l'État doit à l'entreprise, c'est un actif.
  const creanceDeTva = f.tva < 0 ? -f.tva : 0;
  const detteDeTva = f.tva > 0 ? f.tva : 0;
  const actif = auCentime(f.immobilisationsNettes + f.stocks + f.creances + creanceDeTva + f.placements + f.banque);
  const dettes = auCentime(f.emprunts + f.fournisseurs + detteDeTva + f.decouvert);
  const passif = auCentime(f.capitauxPropres + dettes);
  return {
    f,
    creanceDeTva,
    detteDeTva,
    actif,
    dettes,
    passif,
    disponible: auCentime(f.banque + f.placements),
    // Ce qu'il faut payer bientôt : les fournisseurs, la TVA due à l'État, le découvert.
    aCourtTerme: auCentime(f.fournisseurs + detteDeTva + f.decouvert),
    autonomie: auDixieme((f.capitauxPropres / passif) * 100),
    endettement: Math.round((f.emprunts / f.capitauxPropres) * 100) / 100,
  };
}

export const LIRE_LE_BILAN: Chapitre = {
  code: "lire-le-bilan",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  titre: "Le bilan : ce que l'entreprise possède et ce qu'elle doit",
  accroche:
    "Une photographie au 31 décembre : d'un côté ce que l'entreprise possède, de l'autre d'où vient l'argent qui l'a payé. Les deux côtés sont toujours égaux, et c'est ce qui les rend parlants.",
  objectifs: [
    "Distinguer l'actif et le passif",
    "Ranger les postes du bilan",
    "Vérifier l'équilibre du bilan",
    "Mesurer la part des capitaux propres dans le financement",
    "Comparer l'argent disponible et le découvert",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une photographie au 31 décembre",
      notions: ["balance_sheet"],
      texte: (c) => [
        `Le compte de résultat racontait l'année ${dE(c.entreprise)} ; le bilan la fige au 31 décembre. À gauche, l'actif : ce que l'entreprise possède (son équipement, ce que ses clients lui doivent, son argent en banque). À droite, le passif : d'où vient l'argent qui a tout payé (ce que les associés ont apporté et laissé dans l'entreprise, ce qu'elle doit à la banque et à ses fournisseurs).`,
        "Chaque euro possédé a été financé par quelqu'un : les deux côtés sont donc toujours égaux.",
      ],
      repere: () => "Actif = ce que l'entreprise possède. Passif = capitaux propres + dettes. Actif = passif.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Actif ou passif",
      notions: ["balance_sheet"],
      question: () => "Rangez chaque poste du bilan : ce que l'entreprise possède (actif), ou d'où vient l'argent qui l'a payé (passif).",
      categories: [
        { code: "actif", libelle: "Actif" },
        { code: "passif", libelle: "Passif" },
      ],
      elements: (c) => {
        const b = bilanDeFinDAnnee(c);
        const f = b.f;
        const el = [
          { libelle: "Équipement (valeur nette)", montant: f.immobilisationsNettes, categorie: "actif", pourquoi: "L'entreprise le possède et s'en sert pour produire ou servir." },
          { libelle: "Créances sur les clients", montant: f.creances, categorie: "actif", pourquoi: "De l'argent que les clients doivent : l'entreprise le possède, même s'il n'est pas encore encaissé." },
          { libelle: "Capitaux propres", montant: f.capitauxPropres, categorie: "passif", pourquoi: "L'argent apporté par les associés et les bénéfices laissés dans l'entreprise : une ressource, pas un bien." },
          { libelle: "Emprunts", montant: f.emprunts, categorie: "passif", pourquoi: "L'argent prêté par la banque, qu'il faudra rendre : une dette." },
          { libelle: "Dettes envers les fournisseurs", montant: f.fournisseurs, categorie: "passif", pourquoi: "Des achats pas encore payés : une dette." },
        ];
        if (f.stocks > 0) el.splice(1, 0, { libelle: "Stocks", montant: f.stocks, categorie: "actif", pourquoi: "Des marchandises ou des produits que l'entreprise possède, en attente d'être vendus." });
        if (f.banque > 0) el.splice(3, 0, { libelle: "Banque", montant: f.banque, categorie: "actif", pourquoi: "L'argent disponible sur le compte : l'entreprise le possède." });
        if (f.decouvert > 0) el.push({ libelle: "Découvert bancaire", montant: f.decouvert, categorie: "passif", pourquoi: "La banque avance de l'argent au-delà du solde : une dette à court terme." });
        return el;
      },
      explication: () => [
        "Un piège classique : les capitaux propres ne sont pas de l'argent en caisse. Ils disent d'où vient une partie du financement ; ce que cet argent est devenu (de l'équipement, des stocks, de la trésorerie) se lit à l'actif.",
      ],
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "L'équilibre du bilan",
      notions: ["balance_sheet"],
      tableau: (c) => {
        const b = bilanDeFinDAnnee(c);
        const f = b.f;
        const lignes = [
          { libelle: "Équipement (valeur nette)", valeurs: [eur(f.immobilisationsNettes), ""] },
          ...(f.stocks > 0 ? [{ libelle: "Stocks", valeurs: [eur(f.stocks), ""] }] : []),
          { libelle: "Créances sur les clients", valeurs: [eur(f.creances), ""] },
          ...(b.creanceDeTva > 0 ? [{ libelle: "TVA à récupérer", valeurs: [eur(b.creanceDeTva), ""] }] : []),
          ...(f.placements > 0 ? [{ libelle: "Placements", valeurs: [eur(f.placements), ""] }] : []),
          { libelle: "Banque", valeurs: [eur(f.banque), ""] },
          { libelle: "Capitaux propres", valeurs: ["", eur(f.capitauxPropres)] },
          { libelle: "Emprunts", valeurs: ["", eur(f.emprunts)] },
          { libelle: "Dettes envers les fournisseurs", valeurs: ["", eur(f.fournisseurs)] },
          ...(b.detteDeTva > 0 ? [{ libelle: "TVA due à l'État", valeurs: ["", eur(b.detteDeTva)] }] : []),
          ...(f.decouvert > 0 ? [{ libelle: "Découvert bancaire", valeurs: ["", eur(f.decouvert)] }] : []),
        ];
        return { titre: `Le bilan ${dE(c.entreprise)} au 31 décembre`, colonnes: ["Actif", "Passif"], lignes };
      },
      question: () => "Calculez le total de l'actif, le total des dettes, puis le total du passif (capitaux propres plus dettes).",
      champs: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          { libelle: "Total de l'actif", attendu: b.actif, calcul: `somme des postes de l'actif = ${eur(b.actif)}`, tolerance: 1 },
          { libelle: "Total des dettes", attendu: b.dettes, calcul: `somme des dettes = ${eur(b.dettes)}`, tolerance: 1 },
          { libelle: "Total du passif", attendu: b.passif, calcul: `${eur(b.f.capitauxPropres)} + ${eur(b.dettes)} = ${eur(b.passif)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const b = bilanDeFinDAnnee(c);
        // Les postes sont arrondis au centime, un par un : leurs sommes peuvent différer d'un centime.
        const arrondi = auCentime(b.actif) !== auCentime(b.passif) ? ", au centime d'arrondi près" : "";
        return [`Actif et passif valent ${eur(b.actif)}${arrondi} : tout ce que possède ${c.entreprise} a été financé, par ses associés ou par ses créanciers. Si les deux totaux ne s'égalent pas, c'est qu'un poste a été oublié ou mal rangé.`];
      },
    },
    {
      id: "autonomie",
      type: "montants",
      titre: "Qui finance l'entreprise",
      notions: ["balance_sheet"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Les capitaux propres ${dE(c.entreprise)} valent ${eur(b.f.capitauxPropres)}, ses emprunts ${eur(b.f.emprunts)}. Calculez la part des capitaux propres dans le total du passif, en pourcentage au dixième, puis le rapport emprunts ÷ capitaux propres, au centième.`;
      },
      champs: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          { libelle: "Part des capitaux propres (%)", attendu: b.autonomie, calcul: `${eur(b.f.capitauxPropres)} ÷ ${eur(b.passif)} × 100 = ${pct(b.autonomie)}`, tolerance: 0.1 },
          { libelle: "Emprunts ÷ capitaux propres", attendu: b.endettement, calcul: `${eur(b.f.emprunts)} ÷ ${eur(b.f.capitauxPropres)} = ${b.endettement.toLocaleString("fr-FR")}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Les associés financent ${pct(b.autonomie)} de ce que possède ${c.entreprise}. Pour un euro apporté par eux, la banque en a prêté ${b.endettement.toLocaleString("fr-FR")} : ${b.endettement <= ENDETTEMENT_MAXIMAL ? "l'entreprise reste maîtresse de son financement, et un nouvel emprunt reste à sa portée." : "l'entreprise dépend de sa banque plus que de ses associés, et un nouvel emprunt sera plus difficile à obtenir."}`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "choix",
      titre: "L'argent disponible",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Au 31 décembre, ${c.entreprise} a ${eur(b.disponible)} en banque et en placements, et ${eur(b.f.decouvert)} de découvert. Que dit son bilan de sa trésorerie ?`;
      },
      options: (c) => {
        const b = bilanDeFinDAnnee(c);
        const tendue = b.f.decouvert > b.disponible;
        return [
          {
            texte: "Elle a plus d'argent disponible que de découvert : sa trésorerie est positive",
            juste: !tendue,
            retour: !tendue
              ? `Oui : ${eur(b.disponible)} disponibles${b.f.decouvert > 0 ? ` pour ${eur(b.f.decouvert)} de découvert` : ", sans découvert"}. ${b.disponible >= b.aCourtTerme ? `Avec ce qu'elle a en banque, elle pourrait régler toutes ses dettes à court terme (${eur(b.aCourtTerme)} : fournisseurs, TVA due, découvert) sans attendre ses clients.` : `Ses dettes à court terme (${eur(b.aCourtTerme)} : fournisseurs, TVA due, découvert) dépassent pourtant ce qu'elle a en banque : pour les régler, elle compte sur ce que ses clients lui doivent.`}`
              : `Non : son découvert (${eur(b.f.decouvert)}) dépasse ce qu'elle a en banque (${eur(b.disponible)}).`,
          },
          {
            texte: "Son découvert dépasse son argent disponible : sa trésorerie est négative",
            juste: tendue,
            retour: tendue
              ? `Oui : ${eur(b.f.decouvert)} de découvert pour ${eur(b.disponible)} disponibles. La banque finance son quotidien : c'est cher, et cela ne peut pas durer.`
              : `Non : elle a ${eur(b.disponible)} disponibles, plus que son découvert.`,
          },
          {
            texte: "Ses capitaux propres sont son argent disponible",
            juste: false,
            retour: `Non : les capitaux propres (${eur(b.f.capitauxPropres)}) disent qui a financé l'entreprise, pas ce qu'il reste en caisse. L'argent disponible se lit à l'actif, à la ligne banque.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet"],
      texte: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Au 31 décembre, ${c.entreprise} possède ${eur(b.actif)} de biens et de créances, financés à ${pct(b.autonomie)} par ses associés et pour le reste par ses dettes.`,
          "Le bilan ne dit pas si l'année a été bonne : c'est le rôle du compte de résultat. Il dit ce que l'entreprise possède, qui l'a financée, et si elle peut faire face à ses dettes. Le résultat de l'année, lui, vient grossir ou réduire les capitaux propres.",
        ];
      },
      repere: () => "Bilan : actif (ce que l'entreprise possède) = passif (capitaux propres + dettes). Autonomie financière = capitaux propres ÷ total du passif.",
    },
  ],
};
