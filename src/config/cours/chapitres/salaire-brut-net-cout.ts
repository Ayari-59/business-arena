import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  COUT_MAXIMAL_D_UN_POSTE,
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  ENVELOPPE_DE_LA_HAUSSE,
  FICHE_RH,
  HAUSSES_DU_NET_ESSAYEES,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  coutDUnBrut,
  hausseDansLEnveloppe,
  hausseDuNet,
  paieDUnOperateur,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DU SALAIRE BRUT AU COÛT POUR L'ENTREPRISE (Bac STMG, ressources humaines, palier 1).
 *
 * Trois montants pour un même salaire : le brut, que le contrat fixe ; le net, que le salarié
 * reçoit, une fois retenues ses cotisations ; le coût, que l'entreprise paie, cotisations patronales
 * comprises. Le chapitre les calcule pour un opérateur de NOVA, mesure ce que coûte vraiment une
 * hausse du net, puis fait chercher le plus haut brut qu'un budget de poste permet (le curseur) et
 * la plus forte hausse qui tient dans une enveloppe (le laboratoire).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : la paie de janvier (7 500 € bruts pour
 * 4 salariés) et les taux de cotisations (22 % et 42 %) sont ceux de l'exercice de NOVA et du
 * chapitre « La paie » du supérieur ; le bulletin se calcule par monde/paie.ts
 * (monde/ressources-humaines-de-nova.ts). Le net s'entend avant le prélèvement à la source.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait la paie du cas de chaque entreprise de l'arène ; il lit
 * maintenant celle de NOVA : 1 875 € bruts, 1 462,50 € nets, 2 662,50 € de coût par opérateur.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le plus haut brut que le curseur propose, en euros par mois. */
const BRUT_MAXIMAL_DU_CURSEUR = 2_200;

/** La paie d'un opérateur en janvier, et ce que coûte une hausse de son net (le cas de la prime la reprend). */
export function salaire(_c?: Cas) {
  const p = paieDUnOperateur();
  return { ...p, hausseDuNet: p.hausse.net, hausseDuBrut: p.hausse.brut, hausseDuCout: p.hausse.cout };
}

export const SALAIRE_BRUT_NET_COUT: Chapitre = {
  code: "salaire-brut-net-cout",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "Bac pro AGORA Bloc 3 · Administrer le personnel",
    "BTS SAM Bloc 3 · Collaboration à la gestion des ressources humaines",
    "BUT GACO · Participer au pilotage RH de l'organisation",
    "BUT GEA · Gérer l'administration du personnel",
  ],
  titre: "Du salaire brut au coût pour l'entreprise",
  accroche:
    "Un même salaire, trois montants : le brut du contrat, le net que reçoit le salarié, le coût que paie l'entreprise. Et ce que coûte vraiment une augmentation du net.",
  objectifs: [
    "Distinguer salaire brut, salaire net et coût employeur",
    "Calculer les cotisations salariales et le salaire net",
    "Calculer les cotisations patronales et le coût pour l'entreprise",
    "Mesurer ce que coûte une augmentation du salaire net",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois montants pour un salaire",
      notions: ["payroll"],
      texte: (c) => {
        const s = salaire(c);
        return [
          `En janvier, ${c.entreprise} verse ${eur(s.brutDeLEquipe)} de salaires bruts à ses ${s.effectif} opérateurs, autant à chacun. Le brut est le salaire du contrat ; ce n'est ni ce que le salarié reçoit, ni ce que l'entreprise paie. Pour un temps plein, il ne peut pas être inférieur au SMIC, ${eur(s.smic)} bruts par mois.`,
          `Sur le brut, des cotisations salariales sont retenues (${pct(s.tauxSalarial)} du brut) : elles financent la sécurité sociale, l'assurance chômage et la retraite du salarié. Ce qui reste est le salaire net. L'entreprise, elle, paie en plus des cotisations patronales (${pct(s.tauxPatronal)} du brut) : le brut et ces cotisations font le coût du salarié.`,
          "Ces taux sont des ordres de grandeur pour un salarié non cadre du secteur privé, avant les allègements que la loi accorde sur les bas salaires. Près du SMIC, comme ici, la réduction générale des cotisations patronales est forte : le vrai coût employeur est nettement plus bas que celui calculé, et le cours le surestime donc. Le net s'entend ici avant l'impôt sur le revenu, que l'entreprise prélève à la source pour l'État.",
        ];
      },
      tableau: (c) => {
        const s = salaire(c);
        return {
          titre: `La paie de janvier ${dE(c.entreprise)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Salaires bruts de l'équipe", valeurs: [eur(s.brutDeLEquipe)] },
            { libelle: "Opérateurs payés", valeurs: [String(s.effectif)] },
            { libelle: "Taux des cotisations salariales", valeurs: [pct(s.tauxSalarial)] },
            { libelle: "Taux des cotisations patronales", valeurs: [pct(s.tauxPatronal)] },
          ],
        };
      },
      repere: () => "Net = brut − cotisations salariales. Coût pour l'entreprise = brut + cotisations patronales.",
    },
    {
      id: "net",
      type: "montants",
      titre: "Ce que reçoit le salarié",
      notions: ["payroll"],
      question: (c) => {
        const s = salaire(c);
        return `Calculez le salaire brut d'un opérateur en janvier (${eur(s.brutDeLEquipe)} pour ${s.effectif} opérateurs), ses cotisations salariales (${pct(s.tauxSalarial)} du brut), puis son salaire net.`;
      },
      champs: (c) => {
        const s = salaire(c);
        return [
          { libelle: "Salaire brut d'un opérateur", attendu: s.brut, calcul: `${eur(s.brutDeLEquipe)} ÷ ${s.effectif} = ${eur(s.brut)}`, tolerance: 1 },
          { libelle: "Cotisations salariales", attendu: s.salariales, calcul: `${eur(s.brut)} × ${pct(s.tauxSalarial)} = ${eur(s.salariales)}`, tolerance: 1 },
          { libelle: "Salaire net", attendu: s.net, calcul: `${eur(s.brut)} − ${eur(s.salariales)} = ${eur(s.net)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const s = salaire(c);
        return [`Sur un brut de ${eur(s.brut)}, l'opérateur reçoit ${eur(s.net)}. Les ${eur(s.salariales)} retenus ne sont pas perdus pour lui : ils financent sa protection sociale et sa future retraite.`];
      },
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que paie l'entreprise",
      notions: ["payroll"],
      question: (c) => {
        const s = salaire(c);
        return `Calculez les cotisations patronales sur ce salaire (${pct(s.tauxPatronal)} du brut), le coût de l'opérateur pour l'entreprise, puis ce que l'entreprise paie pour 100 € de salaire net (coût ÷ net × 100, au centime).`;
      },
      champs: (c) => {
        const s = salaire(c);
        return [
          { libelle: "Cotisations patronales", attendu: s.patronales, calcul: `${eur(s.brut)} × ${pct(s.tauxPatronal)} = ${eur(s.patronales)}`, tolerance: 1 },
          { libelle: "Coût pour l'entreprise", attendu: s.cout, calcul: `${eur(s.brut)} + ${eur(s.patronales)} = ${eur(s.cout)}`, tolerance: 1 },
          { libelle: "Coût pour 100 € de net", attendu: s.coutPour100DeNet, calcul: `${eur(s.cout)} ÷ ${eur(s.net)} × 100 = ${eur(s.coutPour100DeNet)}`, tolerance: 0.5 },
        ];
      },
      explication: (c) => {
        const s = salaire(c);
        return [
          `Pour que son opérateur reçoive ${eur(s.net)}, ${c.entreprise} paie ${eur(s.cout)} : pour 100 € de net, elle en débourse ${eur(s.coutPour100DeNet)}. L'écart, ce sont les cotisations sociales : c'est pourquoi le coût du travail dépasse de loin le salaire que reçoit le salarié.`,
        ];
      },
    },
    {
      id: "augmentation",
      type: "choix",
      titre: "Une augmentation du net",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) => `Un opérateur ${dE(c.entreprise)} demande ${eur(salaire(c).hausseDuNet)} nets de plus par mois. Combien cette augmentation coûterait-elle de plus à l'entreprise, chaque mois ?`,
      options: (c) => {
        const s = salaire(c);
        return [
          {
            texte: eur(s.hausseDuCout),
            juste: true,
            retour: `Oui : pour ${eur(s.hausseDuNet)} de net en plus, le brut doit monter de ${eur(s.hausseDuNet)} ÷ (1 − ${pct(s.tauxSalarial)}) = ${eur(s.hausseDuBrut)}, et l'entreprise paie ses cotisations sur ce brut : ${eur(s.hausseDuBrut)} × (1 + ${pct(s.tauxPatronal)}) = ${eur(s.hausseDuCout)}.`,
          },
          {
            texte: `${eur(s.hausseDuNet)}, ce que reçoit le salarié`,
            juste: false,
            retour: `Non : ${eur(s.hausseDuNet)} est ce que le salarié recevrait de plus. Pour les lui verser, il faut monter son brut davantage, et payer les cotisations patronales en plus : ${eur(s.hausseDuCout)} en tout.`,
          },
          {
            texte: `${eur(s.hausseDuNet * (1 + s.tauxPatronal))}, le net et les cotisations patronales`,
            juste: false,
            retour: `Non : c'est oublier les cotisations salariales. Le brut doit d'abord monter de ${eur(s.hausseDuBrut)} pour que le net monte de ${eur(s.hausseDuNet)} ; les cotisations patronales s'ajoutent à ce brut : ${eur(s.hausseDuCout)} en tout.`,
          },
        ];
      },
    },
    {
      id: "le-brut-du-poste",
      type: "curseur",
      titre: "Le plus haut brut d'un poste",
      notions: ["payroll"],
      sens: "plus-grande",
      question: (c) =>
        `${c.entreprise} envisage un cinquième opérateur, et la gérante fixe le coût du poste à ${eur(COUT_MAXIMAL_D_UN_POSTE)} par mois au plus, cotisations patronales comprises. Faites varier le salaire brut offert : une droite donne ce budget, l'autre le coût du poste. Placez le curseur sur le plus haut brut, à l'euro, que le budget permet.`,
      grandeur: () => ({ libelle: "Salaire brut offert, par mois", unite: "€" }),
      cible: () => ({ attendu: salaire().brutMaximalDuPoste, min: FICHE_RH.operateurs.salaireBrutMensuel, max: BRUT_MAXIMAL_DU_CURSEUR }),
      zones: ["Le budget paie le poste", "Le poste dépasse le budget"],
      rates: () => ({ dessous: "Le budget paie ce brut, mais il en paierait un plus haut : cherchez le plus haut.", dessus: "À ce brut, le poste coûte plus que le budget." }),
      montrer: "Montrer le brut",
      lecture: (_c, brut) => [
        { libelle: "Cotisations patronales", montant: Math.round((coutDUnBrut(brut) - brut) * 100) / 100 },
        { libelle: "Coût du poste pour l'entreprise", montant: coutDUnBrut(brut), fort: true },
        { libelle: "Budget du poste", montant: COUT_MAXIMAL_D_UN_POSTE },
      ],
      droites: () => ({ produit: () => COUT_MAXIMAL_D_UN_POSTE, cout: (brut) => coutDUnBrut(brut), libelles: ["Budget du poste", "Coût du poste"] }),
      explication: (c) => {
        const s = salaire(c);
        const b = s.brutMaximalDuPoste;
        return [
          `À ${eur(b)} bruts, le poste coûte ${eur(coutDUnBrut(b))} : le budget le paie. À ${eur(b + 1)}, il coûterait ${eur(coutDUnBrut(b + 1))}, au-delà de ${eur(COUT_MAXIMAL_D_UN_POSTE)}.`,
          `Un budget de poste se divise par 1 + ${pct(s.tauxPatronal)} pour trouver le brut : un salaire se promet sur ce qu'il reste du budget une fois les cotisations patronales payées.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-hausse",
      type: "simulation",
      titre: "Une hausse dans l'enveloppe",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) =>
        `La gérante ${dE(c.entreprise)} accepte qu'une hausse coûte au plus ${eur(ENVELOPPE_DE_LA_HAUSSE)} de plus par mois et par opérateur. Faites varier la hausse du net, et regardez ce qu'elle demande de brut et ce qu'elle coûte à l'entreprise.`,
      leviers: () => [{ code: "net", libelle: "Hausse du net, par mois", unite: "€", ...HAUSSES_DU_NET_ESSAYEES, depart: salaire().hausseDuNet }],
      lecture: (_c, p) => {
        const h = hausseDuNet(p.net!);
        const d = hausseDuNet(salaire().hausseDuNet);
        return [
          { libelle: "Hausse du brut", montant: h.brut, reference: d.brut },
          { libelle: "Hausse du coût pour l'entreprise", montant: h.cout, reference: d.cout, fort: true },
          { libelle: "Ce qui reste dans l'enveloppe", montant: Math.round((ENVELOPPE_DE_LA_HAUSSE - h.cout) * 100) / 100, effet: true },
        ];
      },
      defi: () => {
        const juste = hausseDansLEnveloppe();
        return {
          consigne: `Trouvez la plus forte hausse du net, de ${HAUSSES_DU_NET_ESSAYEES.pas} en ${HAUSSES_DU_NET_ESSAYEES.pas} €, qui tient dans l'enveloppe.`,
          atteint: (p) => p.net === juste,
          indice: (p) =>
            hausseDuNet(p.net!).cout > ENVELOPPE_DE_LA_HAUSSE
              ? `À ${eur(p.net!)} nets, la hausse coûte ${eur(hausseDuNet(p.net!).cout)} : c'est plus que l'enveloppe.`
              : `À ${eur(p.net!)} nets, la hausse tient dans l'enveloppe : pouvez-vous donner plus ?`,
          solution: { net: juste },
        };
      },
      explication: (c, p) => {
        const h = hausseDuNet(p.net!);
        const s = salaire(c);
        return [
          `Défi relevé : ${eur(p.net!)} nets de plus demandent ${eur(h.brut)} de brut et coûtent ${eur(h.cout)} par mois, dans l'enveloppe de ${eur(ENVELOPPE_DE_LA_HAUSSE)}. Les ${eur(s.hausseDuNet)} demandés en coûteraient ${eur(s.hausseDuCout)}.`,
          `Chaque euro net coûte ${eur(s.coutPour100DeNet / 100)} à l'entreprise : une enveloppe se divise par ce coefficient avant de se promettre en net.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const s = salaire(c);
        return [
          `Chez ${c.entreprise}, un opérateur payé ${eur(s.brut)} bruts reçoit ${eur(s.net)} nets et coûte ${eur(s.cout)} à l'entreprise. Une hausse de ${eur(s.hausseDuNet)} nets lui coûte ${eur(s.hausseDuCout)}.`,
          "Négocier un salaire, c'est parler de trois montants à la fois : le salarié pense au net, le contrat écrit le brut, et l'entreprise décide sur le coût.",
        ];
      },
      repere: () => "Hausse du coût = hausse du net ÷ (1 − taux salarial) × (1 + taux patronal).",
    },
  ],
};
