import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { bilanFonctionnel } from "../../chapitres/bilan-fonctionnel";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « BILAN FONCTIONNEL ET BFR » : VENDRE PLUS, FINANCER PLUS
 * (comptabilité générale, palier 4).
 *
 * Le directeur commercial vise une forte hausse des ventes l'an prochain. Le directeur
 * financier veut savoir, avant de valider le plan, ce que la croissance fera au besoin en
 * fonds de roulement, et ce qu'il restera en trésorerie si le fonds de roulement ne bouge
 * pas. L'élève refait seul le bilan fonctionnel du chapitre (fonds de roulement net global,
 * besoin en fonds de roulement, trésorerie nette), exprime le besoin en jours de ventes,
 * puis le fait grandir avec les ventes.
 *
 * Le cas est neuf par sa question : le chapitre lit le bilan de l'année et fait varier le
 * délai des clients ; le cas garde les délais et fait varier le volume. Le besoin suit les
 * ventes à délais constants : les créances, les dettes d'exploitation et le stock grossissent
 * dans la même proportion. Le bilan est celui du chapitre (`bilanFonctionnel`).
 */

/**
 * La hausse des ventes visée : 20 %, une année de forte croissance pour une petite
 * entreprise, celle d'un nouveau client important ou d'une nouvelle clientèle. Assez pour
 * que l'effet sur le besoin en fonds de roulement se voie.
 */
export const CROISSANCE_DES_VENTES = 0.2;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** Un nombre de jours, accordé : « 1 jour », « 8 jours ». */
const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function croissance(c: Cas) {
  const b = bilanFonctionnel(c);
  const bfr = auCentime(b.apres.bfr * (1 + CROISSANCE_DES_VENTES));
  const tn = auCentime(b.apres.frng - bfr);
  return {
    ...b,
    jours: Math.round((b.apres.bfr / b.ventes) * 360),
    ventesApres: auCentime(b.ventes * (1 + CROISSANCE_DES_VENTES)),
    bfrApres: bfr,
    variation: auCentime(bfr - b.apres.bfr),
    tnApres: tn,
    // L'erreur classique : croire que la trésorerie grandit comme les ventes.
    tnCommeLesVentes: auCentime(b.apres.tn * (1 + CROISSANCE_DES_VENTES)),
  };
}

/** Le bilan du 31 décembre et les ventes de l'année : ce que l'élève a sous les yeux. */
function documents(c: Cas): TableauDeDonnees {
  const r = croissance(c);
  const f = r.fin;
  const ligne = (libelle: string, x: number) => ({ libelle, valeurs: [eur(x)] });
  const lignes = [
    ligne("Ventes de l'année", r.ventes),
    ligne("Immobilisations, valeur brute (valeur du 1er janvier et investissements)", r.apres.brut),
    ligne("Amortissements de l'année", r.apres.amortissements),
    ligne("Stocks", f.stocks),
    ligne("Créances clients", f.creances),
  ];
  if (f.tva < 0) lignes.push(ligne("Crédit de TVA", -f.tva));
  if (f.placements > 0) lignes.push(ligne("Placements", f.placements));
  lignes.push(ligne("Banque", f.banque), ligne("Capitaux propres (résultat compris)", f.capitauxPropres), ligne("Emprunts", f.emprunts), ligne("Fournisseurs", f.fournisseurs));
  if (f.tva > 0) lignes.push(ligne("TVA due à l'État", f.tva));
  if (f.decouvert > 0) lignes.push(ligne("Découvert bancaire", f.decouvert));
  lignes.push({ libelle: "Hausse des ventes visée", valeurs: [pct(CROISSANCE_DES_VENTES * 100)] });
  return { titre: `Le bilan ${dE(c.entreprise)} au 31 décembre`, colonnes: ["Montant"], lignes };
}

export const VENDRE_PLUS_FINANCER_PLUS: Situation = {
  code: "vendre-plus-financer-plus",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["bilan-fonctionnel-et-bfr"],
  commanditaire: "Le directeur financier",
  titre: "Vendre plus, financer plus",
  accroche:
    "Le directeur commercial vise une forte hausse des ventes. Avant de valider le plan, le directeur financier veut savoir ce qu'elle fera au besoin en fonds de roulement, et à la trésorerie.",
  objectifs: [
    "Calculer le fonds de roulement net global, le besoin en fonds de roulement et la trésorerie nette",
    "Distinguer les postes qui suivent le volume des ventes de ceux qui n'en dépendent pas",
    "Exprimer le besoin en fonds de roulement en jours de ventes",
    "Prévoir le besoin en fonds de roulement et la trésorerie d'une croissance",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      tableau: documents,
      texte: (c) => [
        `« Le directeur commercial vise ${pct(CROISSANCE_DES_VENTES * 100)} de ventes en plus l'an prochain, aux mêmes conditions de paiement. Avant de valider son plan, je veux savoir de combien la croissance ferait grossir le besoin en fonds de roulement ${dE(c.entreprise)}, et ce qu'il resterait en trésorerie si notre fonds de roulement ne bougeait pas. »`,
        "Pas de cours cette fois : vous avez le bilan du 31 décembre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      repere: () =>
        "À rendre : le fonds de roulement net global, le besoin en fonds de roulement et la trésorerie nette du 31 décembre, les postes qui suivent les ventes, le besoin en jours de ventes, le besoin et la trésorerie après la croissance, et votre réponse.",
    },
    {
      id: "au-31-decembre",
      type: "montants",
      titre: "Le bilan fonctionnel du 31 décembre",
      notions: ["frng", "bfr", "net_treasury"],
      tableau: documents,
      question: () =>
        "Commencez par le bilan fonctionnel du 31 décembre : le fonds de roulement net global (capitaux propres, amortissements et emprunts, moins les immobilisations brutes), le besoin en fonds de roulement, puis la trésorerie nette.",
      champs: (c) => {
        const r = croissance(c);
        const tva = r.fin.tva !== 0 ? ` ${r.fin.tva > 0 ? "−" : "+"} ${eur(Math.abs(r.fin.tva))}` : "";
        return [
          { libelle: "Fonds de roulement net global", attendu: r.apres.frng, calcul: `${eur(r.fin.capitauxPropres)} + ${eur(r.apres.amortissements)} + ${eur(r.fin.emprunts)} − ${eur(r.apres.brut)} = ${eur(r.apres.frng)}`, tolerance: 1 },
          { libelle: "Besoin en fonds de roulement", attendu: r.apres.bfr, calcul: `${eur(r.fin.stocks)} + ${eur(r.fin.creances)} − ${eur(r.fin.fournisseurs)}${tva} = ${eur(r.apres.bfr)}`, tolerance: 1 },
          { libelle: "Trésorerie nette", attendu: r.apres.tn, calcul: `${eur(r.apres.frng)} ${r.apres.bfr < 0 ? `+ ${eur(-r.apres.bfr)}` : `− ${eur(r.apres.bfr)}`} = ${eur(r.apres.tn)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = croissance(c);
        return [
          r.apres.bfr >= 0
            ? r.apres.tn >= 0
              ? `Au 31 décembre, l'exploitation ${dE(c.entreprise)} retient ${eur(r.apres.bfr)}, financés par le fonds de roulement, qui laisse ${eur(r.apres.tn)} de trésorerie.`
              : `Au 31 décembre, l'exploitation ${dE(c.entreprise)} retient ${eur(r.apres.bfr)}, que le fonds de roulement ne couvre pas : le découvert comble l'écart, et la trésorerie nette est de ${eur(r.apres.tn)}.`
            : `Au 31 décembre, l'exploitation ${dE(c.entreprise)} dégage une ressource de ${eur(-r.apres.bfr)} : ${r.fin.tva > 0 ? "les fournisseurs et l'État financent" : "les fournisseurs financent"} plus que ce que retiennent les clients et les stocks.`,
        ];
      },
    },
    {
      id: "ce-qui-suit-les-ventes",
      type: "tri",
      titre: "Ce qui suit les ventes",
      notions: ["bfr", "frng"],
      question: () =>
        "Les ventes augmentent, les délais de paiement restent les mêmes. Rangez chaque poste : il grossit avec le volume des ventes, ou il n'en dépend pas.",
      categories: [
        { code: "suit", libelle: "Suit les ventes" },
        { code: "fixe", libelle: "N'en dépend pas" },
      ],
      elements: (c) => {
        const r = croissance(c);
        const f = r.fin;
        const el = [
          { libelle: "Créances clients", montant: f.creances, categorie: "suit", pourquoi: "Plus de ventes au même délai, ce sont plus de factures qui attendent d'être payées." },
          { libelle: "Fournisseurs", montant: f.fournisseurs, categorie: "suit", pourquoi: "Plus de ventes demandent plus d'achats, payés au même délai : la dette grossit avec eux." },
          { libelle: "Emprunts", montant: f.emprunts, categorie: "fixe", pourquoi: "L'emprunt suit son échéancier, pas les ventes : il ne grossit que si l'on emprunte à nouveau." },
          { libelle: "Immobilisations, valeur brute", montant: r.apres.brut, categorie: "fixe", pourquoi: "Les équipements ne changent que si l'on investit : c'est une décision, pas un effet des ventes." },
        ];
        if (f.stocks > 0) el.splice(1, 0, { libelle: "Stocks", montant: f.stocks, categorie: "suit", pourquoi: "Pour vendre plus sans rupture, il faut un stock à la mesure des ventes." });
        if (f.tva > 0) el.splice(2, 0, { libelle: "TVA due à l'État", montant: f.tva, categorie: "suit", pourquoi: "La TVA collectée grossit avec les ventes, et la dette envers l'État avec elle." });
        return el;
      },
      explication: () => [
        "Le besoin en fonds de roulement est fait des postes qui suivent les ventes : il grandit avec l'activité. Le fonds de roulement est fait de ceux qui n'en dépendent pas : il ne bouge que par décision (un emprunt, un apport, un investissement) ou par les bénéfices gardés.",
      ],
    },
    {
      id: "avec-la-croissance",
      type: "montants",
      titre: "Le besoin d'une année de croissance",
      notions: ["bfr", "net_treasury", "payment_terms"],
      question: () =>
        "Exprimez le besoin en fonds de roulement en jours de ventes (besoin ÷ ventes × 360, au jour près). À délais constants, ce nombre de jours ne change pas : le besoin grandit dans la même proportion que les ventes. Quel serait-il l'an prochain ? Et quelle trésorerie nette, si le fonds de roulement ne bouge pas ?",
      champs: (c) => {
        const r = croissance(c);
        return [
          { libelle: "Besoin en fonds de roulement (jours de ventes)", attendu: r.jours, calcul: `${eur(r.apres.bfr)} ÷ ${eur(r.ventes)} × 360 ≈ ${jours(r.jours)}`, tolerance: 1 },
          {
            libelle: "Besoin en fonds de roulement après la croissance",
            attendu: r.bfrApres,
            calcul: `${eur(r.apres.bfr)} × (1 + ${pct(CROISSANCE_DES_VENTES * 100)}) = ${eur(r.bfrApres)}, soit les mêmes jours sur ${eur(r.ventesApres)} de ventes`,
            tolerance: 1,
          },
          {
            libelle: "Trésorerie nette après la croissance",
            attendu: r.tnApres,
            calcul: `${eur(r.apres.frng)} ${r.bfrApres < 0 ? `+ ${eur(-r.bfrApres)}` : `− ${eur(r.bfrApres)}`} = ${eur(r.tnApres)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = croissance(c);
        return [
          r.variation >= 0
            ? `La croissance immobilise ${eur(r.variation)} de plus dans l'exploitation : de l'argent avancé aux clients avant d'être encaissé. Sans nouveau financement, c'est la trésorerie qui le paie : elle passerait de ${eur(r.apres.tn)} à ${eur(r.tnApres)}.`
            : `Chez ${c.entreprise}, le besoin est négatif : la croissance grossit la ressource que l'exploitation dégage, de ${eur(-r.variation)}. La trésorerie passerait de ${eur(r.apres.tn)} à ${eur(r.tnApres)}.`,
          r.tnApres < 0
            ? `${c.entreprise} ${r.apres.tn < 0 ? "s'enfoncerait dans le découvert" : "tomberait à découvert"} : c'est l'effet ciseaux, une croissance qui manque d'argent faute d'un fonds de roulement à sa mesure.`
            : r.variation >= 0
              ? `Le fonds de roulement suffit à porter la croissance : la trésorerie baisse, mais reste au-dessus de zéro.`
              : "Ici, la croissance n'a pas besoin d'être financée : elle apporte de l'argent, parce que les clients paient avant que les fournisseurs soient payés.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = croissance(c);
        return [
          {
            texte: `Le besoin passerait à ${eur(r.bfrApres)}, et la trésorerie nette à ${eur(r.tnApres)}`,
            juste: true,
            retour: `Oui : à délais constants, le besoin reste de ${jours(r.jours)} de ventes, et grandit avec elles, de ${eur(r.apres.bfr)} à ${eur(r.bfrApres)}. Le fonds de roulement, ${eur(r.apres.frng)}, ne bouge pas : la trésorerie est la différence.`,
          },
          {
            texte: `La trésorerie nette passerait à ${eur(r.tnCommeLesVentes)} : elle grandit comme les ventes`,
            juste: false,
            retour: `Non : la trésorerie n'est pas proportionnelle aux ventes. Elle est le fonds de roulement moins le besoin : ${eur(r.apres.frng)} ${r.bfrApres < 0 ? `+ ${eur(-r.bfrApres)}` : `− ${eur(r.bfrApres)}`}, soit ${eur(r.tnApres)}.`,
          },
          {
            texte: `Le besoin resterait de ${eur(r.apres.bfr)} : il ne dépend que des délais de paiement, qui ne changent pas`,
            juste: false,
            retour: `Non : à délais constants, c'est le besoin en jours de ventes qui reste le même, ${jours(r.jours)}. Plus de ventes, ce sont plus de créances et plus de dettes d'exploitation : le besoin passe à ${eur(r.bfrApres)}.`,
          },
          {
            texte: "La trésorerie ne bougerait pas : le fonds de roulement finance la croissance tout seul",
            juste: false,
            retour: `Non : le fonds de roulement ne grossit pas avec les ventes. Le besoin, lui, grossit : la trésorerie passerait de ${eur(r.apres.tn)} à ${eur(r.tnApres)}.`,
          },
        ];
      },
    },
  ],
};
