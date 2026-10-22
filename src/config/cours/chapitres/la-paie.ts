import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { dateDuCours as date } from "../dates";
import { paieDuMois, TAUX_DE_LA_PAIE } from "../paie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA PAIE (comptabilité générale, palier 3).
 *
 * Le même mois de janvier que le chapitre pilote, la même équipe, le même brut : cette
 * fois, la paie se lit comme un bulletin. Un salarié demande un acompte au milieu du
 * mois ; les cotisations se partagent entre l'URSSAF et la caisse de retraite
 * complémentaire ; l'impôt sur le revenu est prélevé à la source et reversé à l'État.
 * L'élève passe chaque écriture, range ce qui coûte à l'entreprise et ce qui se retient
 * sur le salaire, puis règle les trois destinataires le 15 février.
 *
 * Le chapitre ne suit que la paie : son journal ne porte ni les apports ni les ventes, et
 * le compte de banque n'y montre que ce que la paie fait sortir.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const T = TAUX_DE_LA_PAIE;

export const LA_PAIE: Chapitre = {
  code: "la-paie",
  parcours: "comptabilite-generale",
  palier: 3,
  titre: "La paie",
  accroche:
    "Le bulletin de paie ligne par ligne : l'acompte, les cotisations organisme par organisme, le prélèvement à la source, et ce que chacun attend le mois suivant.",
  objectifs: [
    "Lire un bulletin de paie : brut, cotisations, net avant impôt, prélèvement à la source, net à payer",
    "Enregistrer un acompte, puis le reprendre sur la paie",
    "Répartir les cotisations entre l'URSSAF et la caisse de retraite complémentaire",
    "Distinguer ce qui coûte à l'entreprise de ce qui se retient sur le salaire",
    "Régler les organismes sociaux et l'État le mois suivant",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Derrière le salaire",
      notions: ["fixed_costs"],
      texte: (c) => [
        `En janvier, les ${qte(c.personnel.effectif)} salariés de ${c.entreprise} ont gagné ${eur(c.personnel.brut)} bruts. Le premier chapitre a passé la paie en trois écritures : les salaires, les cotisations patronales, le virement du net.`,
        "Un bulletin de paie en dit plus. Les cotisations ne vont pas toutes au même endroit : l'URSSAF recouvre la sécurité sociale, la CSG et l'assurance chômage ; la caisse de retraite complémentaire perçoit sa part. L'impôt sur le revenu du salarié est prélevé par l'employeur, qui le reverse à l'État. Et un salarié peut avoir reçu un acompte en cours de mois.",
        "Ce chapitre ne suit que la paie : le journal ne porte que ses écritures, et la banque n'y montre que ce que la paie fait sortir.",
      ],
      repere: () =>
        "L'entreprise est un intermédiaire : elle retient sur le salaire ce que le salarié doit aux organismes et à l'État, et le leur reverse. Seuls le brut et les cotisations patronales sont ses charges.",
    },
    {
      id: "acompte",
      type: "ecriture",
      titre: "L'acompte du 15 janvier",
      notions: ["payment_terms"],
      evenement: (c) => {
        const p = paieDuMois(c);
        return `Le ${date(p.jourAcompte)}, un salarié demande un acompte sur son salaire de janvier, pour la quinzaine déjà travaillée. ${c.entreprise} lui vire ${eur(p.acompte)}.`;
      },
      ecriture: (c) => {
        const p = paieDuMois(c);
        return {
          date: date(p.jourAcompte),
          libelle: "Acompte sur salaire de janvier",
          lignes: [
            { role: "l'avance faite au salarié", compte: "425", sens: "debit", montant: p.acompte, indice: "le montant de l'acompte" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.acompte, indice: "le montant de l'acompte" },
          ],
        };
      },
      indices: () => [
        "Ce n'est pas encore une charge : le salaire de janvier n'est pas arrêté. L'entreprise avance de l'argent au salarié, qui le lui doit en attendant : une créance sur le personnel, en classe 4.",
        "Le compte des avances et acomptes au personnel est voisin de celui des rémunérations dues : 42.",
      ],
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `L'acompte de ${eur(p.acompte)} est une créance sur le salarié, au débit du 425. Il ne coûte rien de plus : il sera retenu sur le salaire de fin de mois, qui en sera diminué d'autant.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "bulletin",
      type: "montants",
      titre: "Le bulletin de janvier",
      notions: ["fixed_costs"],
      question: (c) => {
        const p = paieDuMois(c);
        return `Le récapitulatif des bulletins de janvier : ${eur(p.brut)} bruts. Cotisations salariales : URSSAF ${pct(T.salarial.urssaf)} du brut, retraite complémentaire ${pct(T.salarial.retraite)}. Le net imposable, calculé par le logiciel de paie, est de ${eur(p.netImposable)}, et le taux moyen de prélèvement à la source transmis par l'administration est de ${pct(p.tauxPas)}. Calculez le bulletin jusqu'au net à payer, sans oublier l'acompte de ${eur(p.acompte)} déjà versé.`;
      },
      champs: (c) => {
        const p = paieDuMois(c);
        return [
          { libelle: "Cotisations salariales URSSAF", attendu: p.urssafSalariale, calcul: `${eur(p.brut)} × ${pct(T.salarial.urssaf)} = ${eur(p.urssafSalariale)}` },
          { libelle: "Cotisations salariales de retraite complémentaire", attendu: p.retraiteSalariale, calcul: `${eur(p.brut)} × ${pct(T.salarial.retraite)} = ${eur(p.retraiteSalariale)}` },
          {
            libelle: "Net avant impôt",
            attendu: p.netAvantImpot,
            calcul: `${eur(p.brut)} − ${eur(p.urssafSalariale)} − ${eur(p.retraiteSalariale)} = ${eur(p.netAvantImpot)}`,
          },
          { libelle: "Prélèvement à la source", attendu: p.pas, calcul: `${eur(p.netImposable)} × ${pct(p.tauxPas)} = ${eur(p.pas)}` },
          {
            libelle: "Net à payer en fin de mois",
            attendu: p.netAPayer,
            calcul: `${eur(p.netAvantImpot)} − ${eur(p.pas)} − ${eur(p.acompte)} = ${eur(p.netAPayer)}`,
          },
        ];
      },
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `Le net imposable (${eur(p.netImposable)}) dépasse le net avant impôt (${eur(p.netAvantImpot)}) : une part de la CSG et la CRDS, ${eur(p.csgNonDeductible)}, sont retenues sur le salaire mais l'impôt ne les déduit pas. Le prélèvement se calcule donc sur un peu plus que ce que le salarié touche.`,
          `Le prélèvement à la source n'est pas une cotisation : c'est l'impôt du salarié, que l'entreprise collecte pour l'État. L'acompte, lui, a déjà été versé : il se retranche du net.`,
        ];
      },
    },
    {
      id: "paie",
      type: "ecriture",
      titre: "La paie de janvier",
      notions: ["fixed_costs"],
      evenement: (c) => {
        const p = paieDuMois(c);
        return `Le ${date(p.date)}, le journal de paie de janvier est arrêté. Passez l'écriture des salaires : le brut, et chacun de ceux à qui il revient.`;
      },
      piece: (c) => {
        const p = paieDuMois(c);
        return {
          nature: "Journal de paie de janvier",
          de: c.entreprise,
          a: `Ses ${qte(p.effectif)} salariés`,
          date: date(p.date),
          lignes: [
            { libelle: "Salaires bruts", montant: p.brut },
            { libelle: `Cotisations salariales URSSAF (${pct(T.salarial.urssaf)})`, montant: p.urssafSalariale },
            { libelle: `Cotisations salariales de retraite complémentaire (${pct(T.salarial.retraite)})`, montant: p.retraiteSalariale },
            { libelle: `Prélèvement à la source (${pct(p.tauxPas)} du net imposable)`, montant: p.pas },
            { libelle: `Acompte versé le ${date(p.jourAcompte)}`, montant: p.acompte },
          ],
          totaux: [
            { libelle: "Net avant impôt", montant: p.netAvantImpot },
            { libelle: "Net à payer", montant: p.netAPayer, fort: true },
          ],
        };
      },
      ecriture: (c) => {
        const p = paieDuMois(c);
        return {
          date: date(p.date),
          libelle: "Salaires de janvier",
          lignes: [
            { role: "les salaires bruts", compte: "641", sens: "debit", montant: p.brut, indice: "le total des salaires bruts" },
            { role: "les cotisations salariales dues à l'URSSAF", compte: "431", sens: "credit", montant: p.urssafSalariale, indice: "la part URSSAF retenue sur le brut" },
            { role: "les cotisations salariales dues à la caisse de retraite", compte: "437", sens: "credit", montant: p.retraiteSalariale, indice: "la part de retraite complémentaire retenue sur le brut" },
            { role: "l'impôt prélevé à la source, dû à l'État", compte: "442", sens: "credit", montant: p.pas, indice: "le prélèvement à la source du bulletin" },
            { role: "l'acompte repris sur le salaire", compte: "425", sens: "credit", montant: p.acompte, indice: "l'acompte du 15 janvier" },
            { role: "le net à payer aux salariés", compte: "421", sens: "credit", montant: p.netAPayer, indice: "le net à payer en fin de mois" },
          ],
        };
      },
      indices: () => [
        "Une seule ligne au débit : la charge, le salaire brut. Tout le reste est au crédit : ce que l'entreprise doit, et à qui.",
        "Au crédit : l'URSSAF (431), la caisse de retraite (437, les autres organismes sociaux), l'État pour l'impôt prélevé (442), les salariés pour le net (421), et l'acompte, qui solde la créance du 425.",
      ],
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `La charge reste le brut, ${eur(p.brut)}, au débit du 641, comme dans le premier chapitre. Ce qui change, c'est le crédit : cinq destinataires au lieu de deux.`,
          `L'acompte est repris au crédit du 425 : la créance sur le salarié est soldée, et il ne reste à lui virer que ${eur(p.netAPayer)} au total.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "cotisations-patronales",
      type: "ecriture",
      titre: "Les cotisations patronales",
      notions: ["fixed_costs"],
      evenement: (c) => {
        const p = paieDuMois(c);
        return `Le même jour, l'entreprise enregistre ses propres cotisations sur les salaires de janvier : URSSAF ${pct(T.patronal.urssaf)} du brut, soit ${eur(p.urssafPatronale)}, et retraite complémentaire ${pct(T.patronal.retraite)}, soit ${eur(p.retraitePatronale)}.`;
      },
      ecriture: (c) => {
        const p = paieDuMois(c);
        return {
          date: date(p.date),
          libelle: "Cotisations patronales de janvier",
          lignes: [
            { role: "les cotisations patronales", compte: "645", sens: "debit", montant: p.cotisationsPatronales, indice: "les deux parts patronales réunies" },
            { role: "la part due à l'URSSAF", compte: "431", sens: "credit", montant: p.urssafPatronale, indice: "la part patronale URSSAF" },
            { role: "la part due à la caisse de retraite", compte: "437", sens: "credit", montant: p.retraitePatronale, indice: "la part patronale de retraite complémentaire" },
          ],
        };
      },
      indices: () => [
        "Une charge de l'entreprise, à côté des salaires : les charges de sécurité sociale et de prévoyance, en un seul montant au débit.",
        "Au crédit, deux dettes : l'URSSAF et la caisse de retraite, chacune pour sa part.",
      ],
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `${eur(p.cotisationsPatronales)} de charges en plus du brut, au débit du 645. Les comptes 431 et 437 réunissent maintenant les parts salariales et patronales : l'URSSAF attend ${eur(p.urssaf)}, la caisse de retraite ${eur(p.retraite)}.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "qui-supporte",
      type: "tri",
      titre: "Qui supporte quoi",
      notions: ["fixed_costs"],
      question: () => "Chaque montant de la paie, rangez-le : une charge que l'entreprise paie en plus du salaire, ou une somme retenue sur le salaire du salarié.",
      categories: [
        { code: "charge", libelle: "À la charge de l'entreprise" },
        { code: "retenue", libelle: "Retenu sur le salaire" },
      ],
      elements: (c) => {
        const p = paieDuMois(c);
        return [
          { libelle: "Cotisations salariales URSSAF", montant: p.urssafSalariale, categorie: "retenue", pourquoi: "Salariales : elles se prennent sur le brut, l'entreprise ne fait que les reverser." },
          { libelle: "Cotisations patronales URSSAF", montant: p.urssafPatronale, categorie: "charge", pourquoi: "Patronales : l'entreprise les paie en plus du brut, compte 645." },
          { libelle: "Prélèvement à la source", montant: p.pas, categorie: "retenue", pourquoi: "C'est l'impôt du salarié : l'entreprise le collecte pour l'État, il ne lui coûte rien." },
          { libelle: "Retraite complémentaire, part patronale", montant: p.retraitePatronale, categorie: "charge", pourquoi: "Patronale : une charge de l'entreprise, en plus du brut." },
          { libelle: "Acompte du 15 janvier", montant: p.acompte, categorie: "retenue", pourquoi: "Le salarié l'a déjà reçu : il se retient sur ce qui lui reste dû." },
          { libelle: "Retraite complémentaire, part salariale", montant: p.retraiteSalariale, categorie: "retenue", pourquoi: "Salariale : elle se prend sur le brut." },
        ];
      },
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `Retenu sur le salaire : ${eur(p.brut - p.netAPayer)}, soit l'écart entre le brut (${eur(p.brut)}) et le net à payer (${eur(p.netAPayer)}). Rien de tout cela n'est une charge de plus pour l'entreprise : c'est une part du brut qu'elle verse à d'autres que le salarié.`,
          `En plus du salaire : ${eur(p.cotisationsPatronales)} de cotisations patronales. C'est la seule charge que la paie ajoute au brut.`,
        ];
      },
    },
    {
      id: "versement-salaires",
      type: "ecriture",
      titre: "Le versement des salaires",
      notions: ["payment_terms"],
      evenement: (c) => {
        const p = paieDuMois(c);
        return `Le ${date(p.date)}, ${c.entreprise} vire aux salariés leur net à payer : ${eur(p.netAPayer)}.`;
      },
      ecriture: (c) => {
        const p = paieDuMois(c);
        return {
          date: date(p.date),
          libelle: "Virement des salaires nets",
          lignes: [
            { role: "la dette envers les salariés qui s'éteint", compte: "421", sens: "debit", montant: p.netAPayer, indice: "le net à payer" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.netAPayer, indice: "le net à payer" },
          ],
        };
      },
      indices: () => ["La dette envers les salariés disparaît : le compte 421 passe au débit.", "La banque paie."],
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `Les salariés sont payés : ${eur(p.acompte)} le ${date(p.jourAcompte)}, ${eur(p.netAPayer)} aujourd'hui. Restent dus l'URSSAF, la caisse de retraite et l'État, jusqu'au ${date(p.dateUrssaf)}.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "cout-du-personnel",
      type: "choix",
      titre: "Le coût du personnel",
      notions: ["fixed_costs", "income_statement"],
      question: (c) => `Que coûte le personnel de janvier à ${c.entreprise}, dans son compte de résultat ?`,
      options: (c) => {
        const p = paieDuMois(c);
        return [
          {
            texte: `${eur(p.netAPayer + p.acompte)} : ce que les salariés ont reçu, acompte compris.`,
            juste: false,
            retour: "C'est ce que la banque leur a versé. L'entreprise paie aussi, pour eux, les cotisations salariales et l'impôt prélevé, puis ses propres cotisations.",
          },
          {
            texte: `${eur(p.cout + p.pas)} : le brut, les cotisations patronales et le prélèvement à la source.`,
            juste: false,
            retour: "Le prélèvement à la source fait déjà partie du brut : c'est l'impôt du salarié, retenu sur son salaire. Le compter en plus le compterait deux fois.",
          },
          {
            texte: `${eur(p.cout)} : le brut et les cotisations patronales.`,
            juste: true,
            retour: "C'est cela : 641 et 645 réunis, le même coût que dans le premier chapitre. Le détail du bulletin change à qui l'argent va, pas ce que le personnel coûte.",
          },
        ];
      },
      vue: "resultat",
    },
    {
      id: "fevrier",
      type: "lecture",
      titre: "Le 15 février",
      notions: ["payment_terms"],
      texte: (c) => {
        const p = paieDuMois(c);
        return [
          `Chaque mois, l'entreprise déclare la paie du mois précédent dans une seule déclaration, la déclaration sociale nominative (DSN). Pour une entreprise de moins de cinquante salariés, elle se dépose au plus tard le ${date(p.dateUrssaf)}, et les cotisations se paient à cette échéance.`,
          `L'URSSAF attend ${eur(p.urssaf)}, la caisse de retraite complémentaire ${eur(p.retraite)}, l'État ${eur(p.pas)} de prélèvement à la source. L'administration fiscale prélève ce dernier quelques jours après la déclaration ; le cours le règle le même jour que les cotisations, pour n'en faire qu'une écriture.`,
        ];
      },
    },
    {
      id: "reglement-organismes",
      type: "ecriture",
      titre: "Les organismes et l'État sont payés",
      notions: ["payment_terms"],
      evenement: (c) => {
        const p = paieDuMois(c);
        return `Le ${date(p.dateUrssaf)}, ${c.entreprise} règle ce que la paie de janvier laissait à payer : l'URSSAF, la caisse de retraite complémentaire et le prélèvement à la source, ${eur(p.totalFevrier)} en tout.`;
      },
      ecriture: (c) => {
        const p = paieDuMois(c);
        return {
          date: date(p.dateUrssaf),
          libelle: "Cotisations et prélèvement à la source de janvier",
          lignes: [
            { role: "la dette envers l'URSSAF qui s'éteint", compte: "431", sens: "debit", montant: p.urssaf, indice: "les parts salariale et patronale URSSAF réunies" },
            { role: "la dette envers la caisse de retraite qui s'éteint", compte: "437", sens: "debit", montant: p.retraite, indice: "les deux parts de retraite complémentaire réunies" },
            { role: "la dette envers l'État qui s'éteint", compte: "442", sens: "debit", montant: p.pas, indice: "le prélèvement à la source de janvier" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: p.totalFevrier, indice: "les trois dettes réunies" },
          ],
        };
      },
      indices: () => [
        "Trois dettes s'éteignent : chacune passe au débit, pour le solde qu'elle porte.",
        "Une seule sortie de banque, au crédit, pour le total.",
      ],
      explication: (c) => {
        const p = paieDuMois(c);
        return [
          `Les comptes de la paie sont soldés. La paie de janvier a fait sortir de la banque ${eur(p.acompte + p.netAPayer + p.totalFevrier)} : le brut et les cotisations patronales, en trois fois et à quatre destinataires.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["fixed_costs", "payment_terms"],
      texte: (c) => {
        const p = paieDuMois(c);
        return [
          `Vous avez tenu la paie de janvier de ${c.entreprise} comme un gestionnaire de paie : l'acompte, le journal de paie, les cotisations patronales, le virement des nets, et le règlement des organismes et de l'État.`,
          `Le personnel coûte ${eur(p.cout)} à l'entreprise ; les salariés en reçoivent ${eur(p.acompte + p.netAPayer)}. L'écart n'est pas perdu : il finance la sécurité sociale, la retraite, l'assurance chômage, et règle l'impôt des salariés.`,
        ];
      },
      repere: () =>
        "Une seule charge au débit, le brut, et autant de dettes au crédit qu'il y a de destinataires. Le net, le prélèvement et l'acompte changent à qui l'entreprise paie, jamais ce que le personnel lui coûte.",
    },
  ],
};
