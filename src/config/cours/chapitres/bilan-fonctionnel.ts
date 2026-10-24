import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { soldesDeGestion } from "./soldes-intermediaires";

/**
 * CHAPITRE : BILAN FONCTIONNEL ET BFR (comptabilité générale, palier 4).
 *
 * Le bilan de l'arène au 1er janvier et au 31 décembre de l'année du cours, relu par
 * fonction : ce qui finance l'entreprise durablement et ce qu'elle immobilise (le fonds de
 * roulement net global), ce que son exploitation retient (le besoin en fonds de roulement),
 * et ce qui reste en banque (la trésorerie nette, qui vaut l'un moins l'autre). Puis l'année :
 * la variation du fonds de roulement s'explique par la CAF du chapitre précédent, les
 * investissements et l'emprunt ; celle de la trésorerie, par les deux.
 *
 * UNE SEULE CONVENTION : l'arène ne garde des immobilisations que leur valeur nette. Le
 * chapitre prend celle du 1er janvier comme valeur brute, plus les investissements de
 * l'année ; les amortissements sont ceux de l'année. Le reste est le bilan de l'arène, au
 * centime : ses deux côtés s'égalent, au début comme à la fin de l'année.
 */

interface Masses {
  immobilisationsNettes: number;
  stocks: number;
  creances: number;
  /** TVA nette due à l'État (négative : un crédit de TVA). */
  tva: number;
  placements: number;
  banque: number;
  capitauxPropres: number;
  emprunts: number;
  fournisseurs: number;
  decouvert: number;
}

/** Le bilan de l'arène au 1er janvier et au 31 décembre, en grandes masses. */
function bilansDeLArene(code: string): { debut: Masses; fin: Masses } {
  const { partie, depart } = anneeJouee(code);
  const f = depart.finance;
  const b = partie.rounds[partie.rounds.length - 1]!.results["joueur"]!.balanceSheet;
  return {
    debut: {
      immobilisationsNettes: f.fixedAssetsNet,
      stocks: f.inventoryValue,
      creances: f.receivables,
      tva: 0,
      placements: 0,
      banque: f.cash,
      capitauxPropres: f.equity,
      emprunts: f.financialDebt,
      fournisseurs: f.payables,
      decouvert: f.overdraft,
    },
    fin: {
      immobilisationsNettes: auCentime(b.fixedAssetsNet + (b.goodwill ?? 0)),
      stocks: auCentime(b.inventoryValue),
      creances: auCentime(b.receivables),
      tva: auCentime(b.vatLiability ?? 0),
      placements: auCentime(b.shortTermInvestment ?? 0),
      banque: auCentime(b.cash),
      capitauxPropres: auCentime(b.equity),
      emprunts: auCentime(b.financialDebt),
      fournisseurs: auCentime(b.payables),
      decouvert: auCentime(b.overdraft),
    },
  };
}

/** Le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette d'un bilan. */
function fonctions(m: Masses, brut: number, amortissements: number) {
  const ressourcesStables = auCentime(m.capitauxPropres + amortissements + m.emprunts);
  const frng = auCentime(ressourcesStables - brut);
  const bfr = auCentime(m.stocks + m.creances - m.fournisseurs - m.tva);
  const tresorerieActive = auCentime(m.banque + m.placements);
  const tn = auCentime(tresorerieActive - m.decouvert);
  return { brut, amortissements, ressourcesStables, frng, bfr, tresorerieActive, tn };
}

/** Le bilan fonctionnel de l'année : début, fin, et ce qui a bougé. */
export function bilanFonctionnel(c: Cas) {
  const { debut, fin } = bilansDeLArene(c.code);
  const s = soldesDeGestion(c);
  const investissements = auCentime(fin.immobilisationsNettes - debut.immobilisationsNettes + s.dotation);
  const brut = auCentime(debut.immobilisationsNettes + investissements);
  const avant = fonctions(debut, debut.immobilisationsNettes, 0);
  const apres = fonctions(fin, brut, s.dotation);
  const empruntNet = auCentime(fin.emprunts - debut.emprunts);
  return {
    debut,
    fin,
    avant,
    apres,
    investissements,
    caf: s.cafAdditive,
    empruntNet,
    variationFrng: auCentime(apres.frng - avant.frng),
    // L'impôt de la CAF est celui du cours, arrondi à l'euro ; les capitaux propres de l'arène
    // portent le sien, au centime : l'écart tient dans l'euro.
    arrondiDeLImpot: auCentime(apres.frng - avant.frng - (s.cafAdditive - investissements + empruntNet)),
    variationBfr: auCentime(apres.bfr - avant.bfr),
    variationTn: auCentime(apres.tn - avant.tn),
    ventes: s.ventes,
  };
}

/**
 * LE DÉLAI DES CLIENTS : les ventes de l'année restent les mêmes, seul change le délai que
 * l'entreprise accorde. Les créances du 31 décembre valent aujourd'hui `delaiActuel` jours de
 * ventes ; à un autre délai, elles changent dans la même proportion, et le besoin en fonds de
 * roulement avec elles. Le délai cherché est le plus long qui laisse la trésorerie à zéro ou
 * au-dessus.
 */
export function delaiDesClients(c: Cas) {
  const b = bilanFonctionnel(c);
  const delaiActuel = (b.fin.creances / b.ventes) * 360;
  const creancesA = (jours: number) => (b.fin.creances * jours) / delaiActuel;
  const bfrA = (jours: number) => b.apres.bfr - b.fin.creances + creancesA(jours);
  const maximum = (delaiActuel * (b.apres.frng - b.apres.bfr + b.fin.creances)) / b.fin.creances;
  const attendu = Math.floor(maximum + 1e-9);
  return {
    ...b,
    delaiActuel,
    creancesA,
    bfrA,
    attendu,
    max: Math.ceil(Math.max(attendu * 1.4, delaiActuel * 2, 30) / 10) * 10,
  };
}

/** Le bilan de l'arène, aux deux dates, tel que l'élève le lit. */
function bilanDeLAnnee(c: Cas): TableauDeDonnees {
  const { debut: d, fin: f } = bilanFonctionnel(c);
  const deux = (libelle: string, a: number, b: number) => ({ libelle, valeurs: [eur(a), eur(b)] });
  const lignes = [
    deux("Immobilisations (valeur nette)", d.immobilisationsNettes, f.immobilisationsNettes),
    deux("Stocks", d.stocks, f.stocks),
    deux("Créances clients", d.creances, f.creances),
  ];
  if (f.tva < 0) lignes.push(deux("Crédit de TVA", 0, -f.tva));
  if (f.placements > 0) lignes.push(deux("Placements", d.placements, f.placements));
  lignes.push(
    deux("Banque", d.banque, f.banque),
    deux("Capitaux propres (résultat compris)", d.capitauxPropres, f.capitauxPropres),
    deux("Emprunts", d.emprunts, f.emprunts),
    deux("Fournisseurs", d.fournisseurs, f.fournisseurs),
  );
  if (f.tva > 0) lignes.push(deux("TVA due à l'État", 0, f.tva));
  if (d.decouvert > 0 || f.decouvert > 0) lignes.push(deux("Découvert bancaire", d.decouvert, f.decouvert));
  return { titre: `Le bilan de ${c.entreprise} dans l'arène`, colonnes: ["1er janvier", "31 décembre"], lignes };
}

const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

export const BILAN_FONCTIONNEL: Chapitre = {
  code: "bilan-fonctionnel-et-bfr",
  parcours: "comptabilite-generale",
  palier: 4,
  titre: "Bilan fonctionnel et BFR",
  accroche:
    "Le bilan de l'arène relu par fonction : ce qui finance durablement l'entreprise, ce que son exploitation retient, ce qui reste en banque. Et pourquoi la trésorerie vaut toujours l'un moins l'autre.",
  objectifs: [
    "Reclasser un bilan par fonction : financement, exploitation, trésorerie",
    "Calculer le fonds de roulement net global, le besoin en fonds de roulement et la trésorerie nette",
    "Vérifier que la trésorerie nette égale le fonds de roulement moins le besoin en fonds de roulement",
    "Expliquer la variation de la trésorerie sur l'année par la CAF, l'emprunt et le BFR",
    "Nommer les leviers qui réduisent le besoin en fonds de roulement",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le bilan, relu par fonction",
      notions: ["balance_sheet"],
      tableau: bilanDeLAnnee,
      texte: (c) => [
        `Voici le bilan de ${c.entreprise} dans l'arène, au début et à la fin de l'année que vous avez clôturée. Le bilan comptable range ce que l'entreprise possède et ce qu'elle doit ; le bilan fonctionnel les range par fonction.`,
        "Trois étages. En haut, le cycle d'investissement et de financement : les équipements, et les ressources qui restent longtemps (les capitaux propres, les emprunts, les amortissements). Au milieu, le cycle d'exploitation : les stocks, les clients, les fournisseurs. En bas, la trésorerie : la banque, et le découvert.",
        "L'arène ne garde des équipements que leur valeur nette : le cours prend celle du 1er janvier comme valeur brute, et les amortissements de l'année comme amortissements. Le reste est le bilan de l'arène, au centime.",
      ],
      repere: () =>
        "Fonds de roulement net global = ressources stables − emplois stables. Besoin en fonds de roulement = stocks + créances − dettes d'exploitation. Trésorerie nette = fonds de roulement − besoin en fonds de roulement.",
    },
    {
      id: "le-decouvert",
      type: "choix",
      titre: "Où va le découvert ?",
      notions: ["balance_sheet", "net_treasury"],
      question: () =>
        "Un découvert bancaire est une dette envers la banque, comme l'emprunt. Dans le bilan fonctionnel, où le range-t-on ?",
      options: () => [
        {
          texte: "En trésorerie passive : il se rembourse au jour le jour, il ne finance pas durablement l'entreprise.",
          juste: true,
          retour:
            "C'est cela. L'emprunt est une ressource stable : il se rembourse sur des années, selon un échéancier. Le découvert peut être réclamé du jour au lendemain : il se range avec la trésorerie, en négatif.",
        },
        {
          texte: "Avec les emprunts, dans les ressources stables : c'est une dette bancaire.",
          juste: false,
          retour: "C'est une dette bancaire, mais pas stable : la banque peut la réclamer à tout moment. La compter en ressource stable embellit le fonds de roulement.",
        },
        {
          texte: "Avec les fournisseurs, dans les dettes d'exploitation.",
          juste: false,
          retour: "Le découvert ne naît pas d'un achat : c'est un manque de trésorerie. Il se range avec elle.",
        },
      ],
    },
    {
      id: "frng",
      type: "montants",
      titre: "Le fonds de roulement net global",
      notions: ["frng"],
      tableau: bilanDeLAnnee,
      question: (c) => {
        const b = bilanFonctionnel(c);
        return `Au 31 décembre. Les emplois stables : les équipements à leur valeur brute, ${eur(b.apres.brut)} (la valeur du 1er janvier${b.investissements !== 0 ? `, plus ${eur(b.investissements)} d'investissements` : ", l'entreprise n'a pas investi dans l'année"}). Les ressources stables : les capitaux propres, les amortissements de l'année (${eur(b.apres.amortissements)}) et les emprunts. Calculez les ressources stables, puis le fonds de roulement net global.`;
      },
      champs: (c) => {
        const b = bilanFonctionnel(c);
        return [
          {
            libelle: "Ressources stables",
            attendu: b.apres.ressourcesStables,
            calcul: `${eur(b.fin.capitauxPropres)} + ${eur(b.apres.amortissements)} + ${eur(b.fin.emprunts)} = ${eur(b.apres.ressourcesStables)}`,
          },
          { libelle: "Fonds de roulement net global", attendu: b.apres.frng, calcul: `${eur(b.apres.ressourcesStables)} − ${eur(b.apres.brut)} = ${eur(b.apres.frng)}` },
        ];
      },
      explication: (c) => {
        const b = bilanFonctionnel(c);
        return [
          b.apres.frng >= 0
            ? `Les ressources stables couvrent les équipements, et il en reste ${eur(b.apres.frng)} pour financer l'exploitation.`
            : `Les ressources stables ne couvrent même pas les équipements : il manque ${eur(-b.apres.frng)}, que l'exploitation ou la banque doivent financer.`,
          "Les amortissements sont des ressources : la dotation est une charge qui ne sort pas de la banque, l'argent qu'elle représente est resté dans l'entreprise.",
        ];
      },
    },
    {
      id: "bfr",
      type: "montants",
      titre: "Le besoin en fonds de roulement",
      notions: ["bfr", "payment_terms"],
      tableau: bilanDeLAnnee,
      question: (c) => {
        const b = bilanFonctionnel(c);
        return `Au 31 décembre, l'exploitation retient ${eur(b.fin.stocks)} de stocks et ${eur(b.fin.creances)} chez les clients ; elle doit ${eur(b.fin.fournisseurs)} aux fournisseurs${b.fin.tva > 0 ? ` et ${eur(b.fin.tva)} de TVA à l'État` : b.fin.tva < 0 ? `, et l'État lui doit ${eur(-b.fin.tva)} de TVA` : ""}. Quel est le besoin en fonds de roulement ?`;
      },
      champs: (c) => {
        const b = bilanFonctionnel(c);
        const tva = b.fin.tva !== 0 ? ` ${b.fin.tva > 0 ? "−" : "+"} ${eur(Math.abs(b.fin.tva))}` : "";
        return [
          {
            libelle: "Besoin en fonds de roulement",
            attendu: b.apres.bfr,
            calcul: `${eur(b.fin.stocks)} + ${eur(b.fin.creances)} − ${eur(b.fin.fournisseurs)}${tva} = ${eur(b.apres.bfr)}`,
          },
        ];
      },
      explication: (c) => {
        const b = bilanFonctionnel(c);
        const jours = Math.round((b.apres.bfr / b.ventes) * 360);
        return [
          b.apres.bfr >= 0
            ? `L'exploitation de ${c.entreprise} immobilise ${eur(b.apres.bfr)} : de l'argent avancé aux clients et aux stocks, que les fournisseurs ne financent pas. C'est environ ${jours} jours de ventes.`
            : `Le besoin est négatif : les fournisseurs et l'État financent plus que ce que les clients et les stocks retiennent. L'exploitation de ${c.entreprise} dégage une ressource de ${eur(-b.apres.bfr)}.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "La trésorerie nette",
      notions: ["net_treasury"],
      question: (c) => {
        const b = bilanFonctionnel(c);
        return `Au 31 décembre, la banque porte ${eur(b.fin.banque)}${b.fin.placements > 0 ? `, les placements ${eur(b.fin.placements)}` : ""}${b.fin.decouvert > 0 ? `, le découvert ${eur(b.fin.decouvert)}` : ""}. Calculez la trésorerie nette, puis vérifiez-la par le fonds de roulement et le besoin en fonds de roulement.`;
      },
      champs: (c) => {
        const b = bilanFonctionnel(c);
        return [
          {
            libelle: "Trésorerie nette",
            attendu: b.apres.tn,
            calcul: `${eur(b.apres.tresorerieActive)}${b.fin.decouvert > 0 ? ` − ${eur(b.fin.decouvert)}` : ""} = ${eur(b.apres.tn)}`,
          },
          { libelle: "Fonds de roulement − besoin en fonds de roulement", attendu: b.apres.tn, calcul: `${eur(b.apres.frng)} − ${eur(b.apres.bfr)} = ${eur(b.apres.tn)}` },
        ];
      },
      explication: (c) => {
        const b = bilanFonctionnel(c);
        return [
          "Les deux calculs tombent sur le même chiffre, et c'est toujours le cas : le bilan s'équilibre, et la trésorerie est ce que le fonds de roulement laisse une fois le besoin financé.",
          b.apres.tn >= 0
            ? `${c.entreprise} finance son exploitation par ses ressources stables et garde ${eur(b.apres.tn)} en banque.`
            : `${c.entreprise} finance une partie de son exploitation par le découvert : ${eur(-b.apres.tn)}. C'est la situation la plus fragile, celle où la banque tient l'entreprise.`,
        ];
      },
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "Ce que l'année a changé",
      notions: ["frng", "bfr", "net_treasury"],
      question: (c) => {
        const b = bilanFonctionnel(c);
        return `Au 1er janvier, le fonds de roulement valait ${eur(b.avant.frng)}, le besoin en fonds de roulement ${eur(b.avant.bfr)}, la trésorerie nette ${eur(b.avant.tn)}. De combien chacun a-t-il varié dans l'année ?`;
      },
      champs: (c) => {
        const b = bilanFonctionnel(c);
        return [
          { libelle: "Variation du fonds de roulement", attendu: b.variationFrng, calcul: `${eur(b.apres.frng)} − ${eur(b.avant.frng)} = ${signe(b.variationFrng)}` },
          { libelle: "Variation du besoin en fonds de roulement", attendu: b.variationBfr, calcul: `${eur(b.apres.bfr)} − ${eur(b.avant.bfr)} = ${signe(b.variationBfr)}` },
          { libelle: "Variation de la trésorerie nette", attendu: b.variationTn, calcul: `${signe(b.variationFrng)} − (${signe(b.variationBfr)}) = ${signe(b.variationTn)}` },
        ];
      },
      explication: (c) => {
        const b = bilanFonctionnel(c);
        return [
          `Le fonds de roulement a bougé de ${signe(b.variationFrng)} : la CAF du chapitre précédent, ${eur(b.caf)}, ${b.investissements !== 0 ? `moins ${eur(b.investissements)} d'investissements, ` : ""}${b.empruntNet < 0 ? `moins ${eur(-b.empruntNet)} d'emprunt remboursé` : `plus ${eur(b.empruntNet)} d'emprunt nouveau`}${b.arrondiDeLImpot !== 0 ? `, à l'arrondi de l'impôt près (${eur(Math.abs(b.arrondiDeLImpot))})` : ""}.`,
          `La trésorerie a bougé de ${signe(b.variationTn)}, exactement ce que l'arène montre dans son tableau de trésorerie. Voilà l'écart entre la CAF et la trésorerie : l'emprunt, les investissements, et le besoin en fonds de roulement, qui a bougé de ${signe(b.variationBfr)}.`,
        ];
      },
    },
    {
      id: "delai-clients",
      type: "curseur",
      titre: "Le délai des clients",
      notions: ["bfr", "payment_terms"],
      question: (c) => {
        const d = delaiDesClients(c);
        return `Aujourd'hui, les clients de ${c.entreprise} paient en moyenne à ${Math.round(d.delaiActuel)} jours : les créances valent ce nombre de jours de ventes. Les ventes restant les mêmes, jusqu'à combien de jours ${c.entreprise} peut-elle faire crédit à ses clients sans tomber à découvert ? Placez le curseur sur le délai le plus long, au jour près.`;
      },
      grandeur: () => ({ libelle: "Délai accordé aux clients", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => {
        const d = delaiDesClients(c);
        return { attendu: d.attendu, max: d.max };
      },
      lecture: (c, jours) => {
        const d = delaiDesClients(c);
        const bfr = auCentime(d.bfrA(jours));
        return [
          { libelle: "Créances clients", montant: auCentime(d.creancesA(jours)) },
          { libelle: "Besoin en fonds de roulement", montant: bfr },
          { libelle: "Fonds de roulement", montant: d.apres.frng },
          { libelle: "Trésorerie nette", montant: auCentime(d.apres.frng - bfr), fort: true },
        ];
      },
      droites: (c) => {
        const d = delaiDesClients(c);
        return { produit: () => d.apres.frng, cout: (jours) => d.bfrA(jours), libelles: ["Fonds de roulement", "Besoin en fonds de roulement"] };
      },
      zones: ["Trésorerie positive", "Découvert"],
      rates: () => ({
        dessous: "Plus long, l'entreprise reste hors du découvert : cherchez le délai le plus long.",
        dessus: "À ce délai, la trésorerie passe sous zéro : l'entreprise est à découvert.",
      }),
      montrer: "Montrer le délai",
      explication: (c) => {
        const d = delaiDesClients(c);
        return [
          `Chaque jour de crédit de plus immobilise ${eur(auCentime(d.creancesA(1)))} chez les clients. Au-delà de ${d.attendu} jours, le besoin en fonds de roulement dépasse le fonds de roulement, et la banque doit combler l'écart.`,
          d.attendu >= d.delaiActuel
            ? `${c.entreprise} a de la marge : elle pourrait accorder ${Math.round(d.attendu - d.delaiActuel)} jours de plus avant le découvert.`
            : `${c.entreprise} accorde déjà plus que ce que son fonds de roulement finance : c'est pourquoi elle est à découvert.`,
        ];
      },
    },
    {
      id: "leviers",
      type: "choix",
      titre: "Réduire le besoin en fonds de roulement",
      notions: ["bfr", "payment_terms"],
      question: (c) => `${c.entreprise} veut libérer de la trésorerie sans emprunter. Laquelle de ces décisions réduit son besoin en fonds de roulement ?`,
      options: () => [
        {
          texte: "Faire payer les clients plus vite, ou obtenir des fournisseurs un délai plus long.",
          juste: true,
          retour:
            "C'est cela. Chaque jour de délai client en moins, chaque jour de délai fournisseur en plus, réduit l'argent que l'exploitation immobilise. Un stock plus bas fait de même. Dans l'arène, le délai des clients professionnels est celui de leur segment : leur part dans vos ventes pèse sur le besoin en fonds de roulement.",
        },
        {
          texte: "Augmenter le capital.",
          juste: false,
          retour: "Un apport augmente les ressources stables, donc le fonds de roulement, et la trésorerie. Il ne touche pas au besoin en fonds de roulement.",
        },
        {
          texte: "Augmenter les ventes à crédit, pour vendre davantage.",
          juste: false,
          retour: "Plus de ventes à crédit, ce sont plus de créances : le besoin en fonds de roulement grossit avec l'activité. C'est l'effet ciseaux d'une croissance mal financée.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet"],
      texte: (c) => {
        const b = bilanFonctionnel(c);
        return [
          `Vous avez relu le bilan de ${c.entreprise} par fonction : un fonds de roulement de ${eur(b.apres.frng)}, un besoin en fonds de roulement de ${eur(b.apres.bfr)}, une trésorerie nette de ${eur(b.apres.tn)} au 31 décembre.`,
          "Avec les soldes intermédiaires de gestion, vous avez les deux lectures de l'analyste : le compte de résultat dit si l'activité gagne de l'argent, le bilan fonctionnel dit si elle est bien financée. Une entreprise rentable peut manquer de trésorerie ; une entreprise en perte peut en avoir encore.",
        ];
      },
      repere: () =>
        "Trésorerie nette = fonds de roulement − besoin en fonds de roulement. Le fonds de roulement se nourrit de la CAF et des emprunts, et se consomme par les investissements et les remboursements ; le besoin en fonds de roulement grossit avec l'activité et les délais des clients.",
    },
  ],
};
