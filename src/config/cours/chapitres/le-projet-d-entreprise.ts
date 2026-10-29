import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ENTREPRISES_DE_LA_DIRECTION, MOIS_DE_CHARGES_A_COUVRIR, PLACEMENTS_ESSAYES, projetDeNova, type Cote } from "../monde/direction-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE PROJET D'ENTREPRISE, DE L'IDÉE AUX MOYENS DE DÉMARRER (Seconde, option management
 * et gestion, palier 1).
 *
 * Ce qu'il faut pour lancer l'activité, et qui le paie. Le chapitre lit ce que NOVA a réuni au soir
 * du 6 janvier de sa première année, la ligne payée : la ligne de montage, la TVA payée dessus que
 * l'État rendra, l'argent placé sur un compte à terme et celui du compte courant (les besoins) ;
 * l'apport des associés et l'emprunt (les ressources). L'élève range chaque ligne, vérifie que les
 * deux totaux sont égaux, dit qui paie quoi, mesure combien de jours la trésorerie paie les charges
 * fixes sans aucune vente, puis cherche le plus petit apport qui garde trois mois de charges (le
 * curseur) et le plus gros placement qui laisse un mois de charges au compte courant (le laboratoire).
 *
 * Il ne passe aucune écriture : c'est la logique du projet, au niveau de la seconde. « De la
 * création au premier bilan » fait passer les écritures de cette même création.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : l'apport, l'emprunt, la ligne de
 * montage, le compte à terme (exercice-de-nova.ts) et les charges fixes d'un mois (nova-gestion.ts),
 * lus par monde/direction-de-nova.ts. Les trois mois de charges à couvrir sont une hypothèse du
 * cours, nommée là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le bilan d'ouverture de chaque entreprise de l'arène ; il lit
 * la création de NOVA : 230 000 € de besoins et de ressources, 65,2 % apportés par les associés,
 * 156 jours de charges fixes en trésorerie.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export interface LigneDuProjet {
  code: string;
  libelle: string;
  montant: number;
  cote: Cote;
  /** Pourquoi elle se range de ce côté : se lit après le tri. */
  pourquoi: string;
}

/** Ce que NOVA a réuni pour démarrer : ses besoins, ses ressources, et ce qu'ils disent (le cas de l'équipement de plus le reprend). */
export function moyensDeDepart(_c?: Cas, v: Parameters<typeof projetDeNova>[0] = {}) {
  const p = projetDeNova(v);
  const lignes: LigneDuProjet[] = [
    { code: "ligne", libelle: "Ligne de montage, hors taxes", montant: p.equipement, cote: "besoin", pourquoi: "Il faut de quoi fabriquer : c'est un besoin, que l'entreprise garde plusieurs années." },
    { code: "apport", libelle: "Apport des associés", montant: p.apport, cote: "ressource", pourquoi: "L'argent que les associés mettent dans le projet : une ressource, qu'ils ne reprennent pas comme on rembourse un prêt." },
    { code: "tva", libelle: "TVA payée sur la ligne, que l'État rendra", montant: p.tva, cote: "besoin", pourquoi: "L'État la rendra plus tard ; en attendant, il a fallu l'avancer : c'est un besoin." },
    { code: "emprunt", libelle: "Emprunt bancaire", montant: p.emprunt, cote: "ressource", pourquoi: "L'argent prêté par la banque : une ressource, qu'il faudra rembourser, avec des intérêts." },
    { code: "placement", libelle: "Argent placé sur un compte à terme", montant: p.placement, cote: "besoin", pourquoi: "Une réserve, placée pour rapporter un peu en attendant de servir : un besoin du projet, pas d'où vient l'argent." },
    { code: "compte-courant", libelle: "Argent sur le compte courant", montant: p.compteCourant, cote: "besoin", pourquoi: "L'argent qui paie les premières dépenses : c'est un besoin du projet, pas d'où vient l'argent." },
  ];
  const besoinsDuProjet = lignes.filter((l) => l.cote === "besoin");
  const ressourcesDuProjet = lignes.filter((l) => l.cote === "ressource");
  return {
    ...p,
    lignes,
    besoinsDuProjet,
    ressourcesDuProjet,
    partDesAssociesPct: auDixieme(p.partDesAssocies * 100),
    partDeLaBanquePct: auDixieme((p.emprunt / p.ressources) * 100),
    remboursementParTrimestre: Math.round((p.emprunt / p.trimestresDuPret) * 100) / 100,
    chargesParJourAuCentime: Math.round(p.chargesParJour * 100) / 100,
  };
}

const additionne = (ls: readonly LigneDuProjet[]) => ls.map((l) => eur(l.montant)).join(" + ");

export const LE_PROJET_D_ENTREPRISE: Chapitre = {
  code: "le-projet-d-entreprise",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · S'engager et entreprendre, de l'intention à la création"],
  titre: "Le projet d'entreprise : de l'idée aux moyens de démarrer",
  accroche:
    "Avant de vendre quoi que ce soit, il faut réunir des moyens : des équipements, de l'argent sur le compte, une réserve. Ce qu'il faut pour démarrer, combien, et qui le paie.",
  objectifs: [
    "Distinguer les besoins d'un projet et ses ressources",
    "Vérifier qu'un projet est équilibré : les ressources couvrent les besoins",
    "Dire qui finance le projet : les associés, la banque",
    "Mesurer combien de temps la trésorerie de départ tient sans aucune vente",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_DIRECTION,
    pourquoi: "ce chapitre lit la création de NOVA, dont le cours tient l'apport, l'emprunt, la ligne de montage et les premières charges.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une idée, et de quoi la lancer",
      notions: ["balance_sheet"],
      texte: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Les associés de ${c.entreprise} lancent leur entreprise pour fabriquer des enceintes. Avant de vendre la première, ils ont dû réunir des moyens.`,
          "Une entreprise qui démarre a des besoins : des équipements pour travailler, de l'argent sur son compte pour payer les premières dépenses, parfois une réserve. Ces besoins se paient avec des ressources : l'argent apporté par les associés, et celui que prête la banque.",
          `Voici ce que ${c.entreprise} a réuni au soir du ${m.dateDuPlacement.jour} janvier, la ligne de montage payée et une réserve placée sur un compte à terme.`,
        ];
      },
      tableau: (c) => {
        const m = moyensDeDepart(c);
        return { titre: `Les moyens réunis par ${c.entreprise} pour démarrer`, colonnes: ["Montant"], lignes: m.lignes.map((l) => ({ libelle: l.libelle, valeurs: [eur(l.montant)] })) };
      },
      repere: () => "Les besoins, c'est ce qu'il faut pour démarrer. Les ressources, c'est d'où vient l'argent qui les paie.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Besoin ou ressource",
      notions: ["balance_sheet"],
      question: () => "Rangez chaque ligne : est-ce un besoin de l'entreprise (ce qu'elle a et qui lui sert), ou une ressource (d'où vient l'argent qui le paie) ?",
      categories: [
        { code: "besoin", libelle: "Un besoin" },
        { code: "ressource", libelle: "Une ressource" },
      ],
      elements: (c) => moyensDeDepart(c).lignes.map((l) => ({ libelle: l.libelle, montant: l.montant, categorie: l.cote, pourquoi: l.pourquoi })),
      explication: () => [
        "Les besoins disent à quoi sert l'argent ; les ressources disent qui l'a fourni. L'argent sur les comptes se range parmi les besoins : en avoir est un moyen de démarrer, qu'il a fallu financer comme le reste.",
      ],
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "Les deux totaux",
      notions: ["balance_sheet"],
      question: (c) => `Calculez le total des besoins ${dE(c.entreprise)}, puis le total de ses ressources.`,
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Total des besoins", attendu: m.besoins, calcul: `${additionne(m.besoinsDuProjet)} = ${eur(m.besoins)}`, tolerance: 1 },
          { libelle: "Total des ressources", attendu: m.ressources, calcul: `${additionne(m.ressourcesDuProjet)} = ${eur(m.ressources)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Les deux totaux sont égaux : ${eur(m.besoins)}. Chaque euro dont ${c.entreprise} a besoin vient de quelque part. Un projet est équilibré quand ses ressources couvrent tous ses besoins : il manquerait sinon de l'argent pour démarrer.`,
        ];
      },
    },
    {
      id: "qui-paie",
      type: "montants",
      titre: "Qui paie quoi",
      notions: ["balance_sheet", "loan_schedule"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Calculez la part des ressources apportée par les associés, puis celle prêtée par la banque, en pourcentage au dixième. ${c.entreprise} rembourse ${eur(m.remboursementParTrimestre)} de son emprunt chaque trimestre : calculez en combien de trimestres il sera remboursé.`;
      },
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Part apportée par les associés (%)", attendu: m.partDesAssociesPct, calcul: `${eur(m.apport)} ÷ ${eur(m.ressources)} × 100 = ${pct(m.partDesAssociesPct)}`, tolerance: 0.1 },
          { libelle: "Part prêtée par la banque (%)", attendu: m.partDeLaBanquePct, calcul: `${eur(m.emprunt)} ÷ ${eur(m.ressources)} × 100 = ${pct(m.partDeLaBanquePct)}`, tolerance: 0.1 },
          { libelle: "Trimestres pour rembourser l'emprunt", attendu: m.trimestresDuPret, calcul: `${eur(m.emprunt)} ÷ ${eur(m.remboursementParTrimestre)} = ${qte(m.trimestresDuPret)}` },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        return [
          m.partDesAssociesPct >= m.partDeLaBanquePct
            ? `Les associés apportent ${pct(m.partDesAssociesPct)} des ressources, plus que la banque : ce sont eux qui portent d'abord le projet.`
            : `La banque prête ${pct(m.partDeLaBanquePct)} des ressources, plus que ce qu'apportent les associés : le projet dépend beaucoup de son prêteur.`,
          `L'emprunt se rembourse en ${qte(m.trimestresDuPret)} trimestres, soit ${qte(m.trimestresDuPret / m.echeancesParAn)} ans, et la banque demande en plus des intérêts : ${pct(auDixieme(m.tauxDuPret * 100))} par an. Les apports, eux, ne se remboursent pas : les associés espèrent en retour une part des bénéfices.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "Combien de temps tient la trésorerie",
      notions: ["net_treasury", "fixed_costs"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Chaque mois, ${c.entreprise} paie ${eur(m.loyer)} de loyer et ${eur(m.personnel)} de salaires et de cotisations, que l'entreprise vende ou non : ce sont ses charges fixes à payer. Un mois compte ${qte(m.joursParMois)} jours. Calculez les charges fixes du mois, celles d'une journée (au centime), puis le nombre de jours que la trésorerie de départ (le compte à terme et le compte courant) paie sans aucune vente (au jour inférieur).`;
      },
      champs: (c) => {
        const m = moyensDeDepart(c);
        return [
          { libelle: "Charges fixes du mois", attendu: m.chargesDuMois, calcul: `${eur(m.loyer)} + ${eur(m.personnel)} = ${eur(m.chargesDuMois)}` },
          { libelle: "Charges fixes d'une journée", attendu: m.chargesParJourAuCentime, calcul: `${eur(m.chargesDuMois)} ÷ ${qte(m.joursParMois)} = ${eur(m.chargesParJourAuCentime)}`, tolerance: 0.01 },
          { libelle: "Jours payés par la trésorerie de départ", attendu: m.jours, calcul: `${eur(m.tresorerie)} ÷ ${eur(m.chargesParJourAuCentime)} = ${qte(m.jours)} jours`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Sans aucune vente, la trésorerie ${dE(c.entreprise)} paierait ${qte(m.jours)} jours de charges fixes, sans compter les achats de composants. Mais l'argent placé n'est disponible qu'à l'échéance du compte à terme : le compte courant seul n'en paie que ${qte(m.joursDuCompteCourant)}. Les ventes doivent rentrer vite.`,
        ];
      },
    },
    {
      id: "le-plus-petit-apport",
      type: "curseur",
      titre: "Le plus petit apport",
      notions: ["net_treasury", "balance_sheet"],
      sens: "plus-petite",
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Les associés auraient-ils pu apporter moins ? Ils veulent garder en trésorerie de quoi payer ${MOIS_DE_CHARGES_A_COUVRIR} mois de charges fixes, l'emprunt et la ligne restant les mêmes. Faites varier l'apport : une droite donne la trésorerie de départ, l'autre ${MOIS_DE_CHARGES_A_COUVRIR} mois de charges fixes (${eur(m.aCouvrir)}). Placez le curseur sur le plus petit apport, à l'euro, qui les garde.`;
      },
      grandeur: () => ({ libelle: "Apport des associés", unite: "€" }),
      cible: () => ({ attendu: moyensDeDepart().apportMinimal, max: 200_000 }),
      zones: ["La trésorerie garde les charges à couvrir", "La trésorerie ne les garde pas"],
      rates: () => ({ dessous: "Avec cet apport, la trésorerie ne garde pas les charges à couvrir.", dessus: "Cet apport suffit, mais un plus petit aussi : cherchez le plus petit." }),
      montrer: "Montrer l'apport",
      lecture: (_c, apport) => {
        const m = moyensDeDepart(undefined, { apport });
        return [
          { libelle: "Trésorerie de départ", montant: m.tresorerie, fort: true },
          { libelle: `Charges fixes de ${MOIS_DE_CHARGES_A_COUVRIR} mois`, montant: m.aCouvrir },
          { libelle: "Part apportée par les associés (%)", montant: m.partDesAssociesPct },
        ];
      },
      droites: () => ({ produit: (apport) => projetDeNova({ apport }).tresorerie, cout: () => projetDeNova().aCouvrir, libelles: ["Trésorerie de départ", "Charges à couvrir"] }),
      explication: (c) => {
        const m = moyensDeDepart(c);
        const juste = moyensDeDepart(c, { apport: m.apportMinimal });
        return [
          `Avec ${eur(m.apportMinimal)} d'apport, la trésorerie de départ serait de ${eur(juste.tresorerie)}, juste ${MOIS_DE_CHARGES_A_COUVRIR} mois de charges fixes. Les associés de ${c.entreprise} ont apporté ${eur(m.apport)} : de quoi garder aussi une réserve pour la suite.`,
          `Mais avec un apport plus petit, la banque porterait une plus grande part du projet : ${pct(juste.partDeLaBanquePct)} au lieu de ${pct(m.partDeLaBanquePct)}. Un banquier prête plus volontiers à des associés qui engagent leur propre argent.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-reserve",
      type: "simulation",
      titre: "Placer la réserve",
      notions: ["net_treasury"],
      question: (c) => {
        const m = moyensDeDepart(c);
        return `Le ${m.dateDuPlacement.jour} janvier, ${c.entreprise} place une réserve sur un compte à terme, qui rapporte des intérêts mais n'est disponible qu'à son échéance. Faites varier le montant placé, et regardez ce qui reste sur le compte courant pour payer les charges fixes, ${eur(m.chargesDuMois)} par mois.`;
      },
      leviers: () => [{ code: "placement", libelle: "Montant placé", unite: "€", ...PLACEMENTS_ESSAYES, depart: moyensDeDepart().placement }],
      lecture: (_c, p) => {
        const m = moyensDeDepart(undefined, { placement: p.placement! });
        const d = moyensDeDepart();
        return [
          { libelle: "Reste sur le compte courant", montant: m.compteCourant, reference: d.compteCourant, fort: true },
          { libelle: "Jours de charges fixes que paie le compte courant", montant: m.joursDuCompteCourant, unite: "jours", reference: d.joursDuCompteCourant },
          { libelle: "Charges fixes d'un mois", montant: m.chargesDuMois },
        ];
      },
      defi: () => {
        const juste = moyensDeDepart().placementMaximal;
        return {
          consigne: `Trouvez le plus gros placement, de ${qte(PLACEMENTS_ESSAYES.pas)} en ${qte(PLACEMENTS_ESSAYES.pas)} €, qui laisse au moins un mois de charges fixes sur le compte courant.`,
          atteint: (p) => p.placement === juste,
          indice: (p) => {
            const m = moyensDeDepart(undefined, { placement: p.placement! });
            return m.compteCourant < m.chargesDuMois
              ? `Il ne reste que ${eur(m.compteCourant)} sur le compte courant : moins d'un mois de charges fixes.`
              : `Il reste ${eur(m.compteCourant)} sur le compte courant, plus d'un mois de charges : pouvez-vous placer davantage ?`;
          },
          solution: { placement: juste },
        };
      },
      explication: (c, p) => {
        const m = moyensDeDepart(c, { placement: p.placement! });
        const d = moyensDeDepart(c);
        return [
          `Défi relevé : en plaçant ${eur(p.placement!)}, ${c.entreprise} garde ${eur(m.compteCourant)} sur son compte courant, un mois de charges fixes. En plaçant ${eur(d.placement)}, comme elle l'a fait, il ne lui reste que ${eur(d.compteCourant)} : ce sont ses premières ventes qui paient le loyer et les salaires des premiers mois.`,
          "Placer de l'argent rapporte, mais immobilise : une entreprise qui démarre garde de quoi payer ses charges en attendant que les ventes rentrent.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "net_treasury"],
      texte: (c) => {
        const m = moyensDeDepart(c);
        return [
          `Pour démarrer, ${c.entreprise} a réuni ${eur(m.ressources)} : une ligne de montage, la TVA avancée sur elle, et ${eur(m.tresorerie)} de trésorerie. Les associés en ont apporté ${pct(m.partDesAssociesPct)}, la banque en a prêté ${pct(m.partDeLaBanquePct)}.`,
          "Un projet d'entreprise se prépare en deux colonnes : ce qu'il faut (les besoins) et qui le paie (les ressources). Les deux totaux sont égaux. Et il faut garder assez de trésorerie disponible pour tenir jusqu'à ce que les ventes rapportent.",
        ];
      },
      repere: () => "Total des besoins = total des ressources. Part des associés = apports ÷ total des ressources × 100.",
    },
  ],
};
