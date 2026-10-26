import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { masseSalariale } from "../../chapitres/effectif-et-masse-salariale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EFFECTIF ET LA MASSE SALARIALE » : L'AUGMENTATION GÉNÉRALE
 * (Bac STMG, ressources humaines, palier 1).
 *
 * La négociation annuelle aboutit à une augmentation générale des salaires. La direction
 * veut savoir ce qu'elle ajoute à la masse salariale, ce qu'elle fait au taux de frais de
 * personnel si les ventes ne bougent pas, et combien il faudrait vendre pour garder le taux
 * d'aujourd'hui. L'élève refait seul les calculs du chapitre : le coût annuel d'un salarié,
 * la masse salariale, le taux de frais de personnel, avant et après l'augmentation, puis
 * les ventes qui gardent le taux.
 *
 * Le cas est neuf par sa question : le chapitre mesure le poids du personnel tel qu'il est,
 * le cas prévoit celui de l'an prochain avec des salaires plus hauts, sans embauche.
 * L'effectif, le coût d'un salarié et les ventes de l'année sont ceux du chapitre
 * (`masseSalariale`).
 */

/**
 * L'augmentation générale des salaires : 3 %, l'ordre de grandeur des augmentations que
 * fixent les négociations annuelles dans les petites entreprises. Elle s'applique au
 * salaire brut, donc aux cotisations patronales qui en dépendent : tout le coût du
 * personnel monte de 3 %.
 */
export const AUGMENTATION_GENERALE = 0.03;

/** Les trimestres d'une année de l'arène, comme au chapitre. */
const TRIMESTRES_PAR_AN = 4;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function augmentationGenerale(c: Cas) {
  const m = masseSalariale(c);
  const masseApres = auCentime(m.masse * (1 + AUGMENTATION_GENERALE));
  const tauxApres = auDixieme((masseApres / m.ventes) * 100);
  // Garder le même taux, c'est faire monter les ventes au même rythme que la masse salariale.
  const ventesNecessaires = auCentime(m.ventes * (1 + AUGMENTATION_GENERALE));
  // L'élève qui divise par le taux arrondi au dixième trouve un peu autrement : on l'admet.
  const avecLeTauxArrondi = masseApres / (m.tauxDeFraisDePersonnel / 100);
  return {
    m,
    masseApres,
    hausseDeLaMasse: auCentime(masseApres - m.masse),
    tauxApres,
    pointsEnPlus: auDixieme(tauxApres - m.tauxDeFraisDePersonnel),
    ventesNecessaires,
    ventesEnPlus: auCentime(ventesNecessaires - m.ventes),
    toleranceVentes: Math.ceil(Math.abs(ventesNecessaires - avecLeTauxArrondi)) + 1,
  };
}

export const L_AUGMENTATION_GENERALE: Situation = {
  code: "l-augmentation-generale",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["effectif-et-masse-salariale"],
  commanditaire: "La direction",
  titre: "L'augmentation générale des salaires",
  accroche:
    "La négociation annuelle fixe une augmentation générale de 3 %. Ce qu'elle ajoute à la masse salariale, ce qu'elle fait au taux de frais de personnel, et ce qu'il faudrait vendre pour le garder.",
  objectifs: [
    "Calculer le coût annuel d'un salarié et la masse salariale",
    "Calculer le taux de frais de personnel avant et après une augmentation",
    "Calculer les ventes qui gardent le même taux de frais de personnel",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« La négociation annuelle s'est conclue sur une augmentation générale de ${pct(AUGMENTATION_GENERALE * 100)} de tous les salaires, sans embauche. Avant de l'annoncer à l'équipe, je veux savoir ce qu'elle ajoute à notre masse salariale, ce que devient notre taux de frais de personnel si les ventes ne bougent pas, et combien ${c.entreprise} devrait vendre pour garder le taux d'aujourd'hui. »`,
        "Pas de cours cette fois : vous avez les chiffres du personnel et de l'année, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
      ],
      tableau: (c) => {
        const { m } = augmentationGenerale(c);
        return {
          titre: `Le personnel et l'année ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Effectif", valeurs: [`${qte(m.effectif)} salariés`] },
            { libelle: "Coût d'un salarié par trimestre (brut et cotisations patronales)", valeurs: [eur(m.coutTrimestriel)] },
            { libelle: "Ventes de l'année", valeurs: [eur(m.ventes)] },
            { libelle: "Augmentation générale des salaires", valeurs: [pct(AUGMENTATION_GENERALE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la masse salariale et le taux de frais de personnel d'aujourd'hui, les mêmes après l'augmentation, les ventes qui gardent le taux, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La masse salariale d'aujourd'hui",
      notions: ["payroll"],
      question: () =>
        "Calculez le coût annuel d'un salarié, la masse salariale de l'année, puis le taux de frais de personnel (masse salariale ÷ ventes × 100), en pourcentage au dixième.",
      champs: (c) => {
        const { m } = augmentationGenerale(c);
        return [
          { libelle: "Coût annuel d'un salarié", attendu: m.coutAnnuel, tolerance: 1, calcul: `${eur(m.coutTrimestriel)} × ${TRIMESTRES_PAR_AN} trimestres = ${eur(m.coutAnnuel)}` },
          { libelle: "Masse salariale de l'année", attendu: m.masse, tolerance: 1, calcul: `${eur(m.coutAnnuel)} × ${qte(m.effectif)} salariés = ${eur(m.masse)}` },
          { libelle: "Taux de frais de personnel (%)", attendu: m.tauxDeFraisDePersonnel, tolerance: 0.1, calcul: `${eur(m.masse)} ÷ ${eur(m.ventes)} × 100 = ${pct(m.tauxDeFraisDePersonnel)}` },
        ];
      },
      explication: (c) => {
        const { m } = augmentationGenerale(c);
        return [
          `Aujourd'hui, sur 100 € de ventes, ${c.entreprise} en consacre ${pct(m.tauxDeFraisDePersonnel).replace(" %", " €")} à son personnel.`,
        ];
      },
    },
    {
      id: "apres-l-augmentation",
      type: "montants",
      titre: "Après l'augmentation",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        "Calculez la masse salariale après l'augmentation, ce qu'elle coûte de plus sur l'année, puis le taux de frais de personnel si les ventes restent les mêmes, en pourcentage au dixième.",
      champs: (c) => {
        const r = augmentationGenerale(c);
        return [
          { libelle: "Masse salariale après l'augmentation", attendu: r.masseApres, tolerance: 1, calcul: `${eur(r.m.masse)} × (1 + ${pct(AUGMENTATION_GENERALE * 100)}) = ${eur(r.masseApres)}` },
          { libelle: "Coût en plus sur l'année", attendu: r.hausseDeLaMasse, tolerance: 1, calcul: `${eur(r.masseApres)} − ${eur(r.m.masse)} = ${eur(r.hausseDeLaMasse)}` },
          { libelle: "Taux de frais de personnel à ventes égales (%)", attendu: r.tauxApres, tolerance: 0.1, calcul: `${eur(r.masseApres)} ÷ ${eur(r.m.ventes)} × 100 = ${pct(r.tauxApres)}` },
        ];
      },
      explication: (c) => {
        const r = augmentationGenerale(c);
        return [
          `L'augmentation coûte ${eur(r.hausseDeLaMasse)} de plus sur l'année. Si les ventes ne suivent pas, le taux de frais de personnel passe de ${pct(r.m.tauxDeFraisDePersonnel)} à ${pct(r.tauxApres)} : ${qte(r.pointsEnPlus)} point${r.pointsEnPlus >= 2 ? "s" : ""} de plus, pas ${qte(AUGMENTATION_GENERALE * 100)}. Les salaires montent de ${pct(AUGMENTATION_GENERALE * 100)}, le taux monte de ${pct(AUGMENTATION_GENERALE * 100)} de sa propre valeur.`,
        ];
      },
    },
    {
      id: "ventes-necessaires",
      type: "montants",
      titre: "Les ventes qui gardent le taux",
      notions: ["payroll", "productivity"],
      question: () =>
        "Pour garder le taux de frais de personnel d'aujourd'hui, quelles ventes faudrait-il sur l'année (masse salariale après l'augmentation ÷ taux d'aujourd'hui) ? Combien est-ce de plus que les ventes de cette année ?",
      champs: (c) => {
        const r = augmentationGenerale(c);
        return [
          { libelle: "Ventes nécessaires", attendu: r.ventesNecessaires, tolerance: r.toleranceVentes, calcul: `${eur(r.masseApres)} ÷ ${pct(r.m.tauxDeFraisDePersonnel)} ≈ ${eur(r.m.ventes)} × (1 + ${pct(AUGMENTATION_GENERALE * 100)}) = ${eur(r.ventesNecessaires)}` },
          { libelle: "Ventes en plus", attendu: r.ventesEnPlus, tolerance: r.toleranceVentes, calcul: `${eur(r.ventesNecessaires)} − ${eur(r.m.ventes)} = ${eur(r.ventesEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = augmentationGenerale(c);
        return [
          `Pour que le personnel ne pèse pas plus lourd, les ventes ${dE(c.entreprise)} doivent monter au même rythme que les salaires : ${eur(r.ventesEnPlus)} de plus sur l'année. Une augmentation générale se finance par des ventes, ou par une meilleure productivité de l'équipe.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = augmentationGenerale(c);
        const t = r.m.tauxDeFraisDePersonnel;
        return [
          {
            texte: `Il faudra ${eur(r.ventesEnPlus)} de ventes en plus pour garder notre taux`,
            juste: true,
            retour: `Oui : la masse salariale passe à ${eur(r.masseApres)}. Pour qu'elle pèse toujours ${pct(t)} des ventes, il faut ${eur(r.ventesNecessaires)} de ventes, ${eur(r.ventesEnPlus)} de plus qu'aujourd'hui.`,
          },
          {
            texte: `Notre taux de frais de personnel passerait de ${pct(t)} à ${pct(auDixieme(t + AUGMENTATION_GENERALE * 100))}`,
            juste: false,
            retour: `Non : c'est ajouter ${qte(AUGMENTATION_GENERALE * 100)} points au taux, alors que la masse salariale monte de ${pct(AUGMENTATION_GENERALE * 100)} d'elle-même. À ventes égales, le taux passe à ${pct(r.tauxApres)}.`,
          },
          {
            texte: `Il suffira de ${eur(r.hausseDeLaMasse)} de ventes en plus pour garder notre taux`,
            juste: false,
            retour: `Non : pour garder le taux, les ${eur(r.hausseDeLaMasse)} de salaires en plus ne doivent peser que ${pct(t)} des ventes en plus. Il en faut donc ${eur(r.hausseDeLaMasse)} ÷ ${pct(t)}, environ ${eur(r.ventesEnPlus)} : ${pct(AUGMENTATION_GENERALE * 100)} des ventes, comme la masse.`,
          },
          {
            texte: "Rien ne change pour notre taux tant que l'effectif ne bouge pas",
            juste: false,
            retour: `Non : sans embauche, chaque salarié coûte ${pct(AUGMENTATION_GENERALE * 100)} de plus. La masse salariale monte de ${eur(r.hausseDeLaMasse)}, et le taux avec elle si les ventes ne suivent pas.`,
          },
        ];
      },
    },
  ],
};
