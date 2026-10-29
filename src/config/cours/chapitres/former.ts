import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { MOIS_PAR_TRIMESTRE } from "../monde/nova-capacite";
import {
  COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR,
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  MINUTES_ESSAYEES,
  MINUTES_GAGNEES_PAR_LE_STAGE,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  formationDeNPlus1,
  formationQuiRapporteLePlus,
  recrutementDeNPlus1,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : FORMER POUR ÊTRE PLUS EFFICACE (Bac STMG, ressources humaines, palier 1).
 *
 * La formation coûte tout de suite et rapporte ensuite : des opérateurs mieux formés montent une
 * enceinte en moins de temps, et l'équipe en monte davantage. Le chapitre mesure ce qu'un stage fait
 * gagner quand l'équipe est le goulot, ce qu'il coûte, le compare à une embauche, puis cherche le
 * plus haut prix que le stage vaut (le curseur) et la formation qui rapporte le plus (le
 * laboratoire : au-delà de ce que la ligne peut monter, une minute de plus ne rapporte plus rien).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur l'année N + 1 : la demande, les
 * 4 opérateurs (150 heures de montage par mois sur 151,67 payées, 0,25 heure par enceinte), le cinquième poste manuel (1 750
 * enceintes de plus par trimestre), la marge d'une enceinte et l'embauche à comparer sont ceux de
 * nova-capacite.ts et du chapitre « Recruter » (monde/ressources-humaines-de-nova.ts). Le cinquième
 * poste installé sans embauche, le prix d'une minute gagnée et le stage sont des hypothèses du
 * cours, nommées là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène avec un budget de formation, dont le
 * moteur tirait un gain de productivité ; il chiffre maintenant un stage chez NOVA : 3 200 €,
 * 800 enceintes de plus, 13 600 € gagnés dans l'année.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const minutes = (m: number) => `${qte(m)} minute${m > 1 ? "s" : ""}`;

/** Le stage du chapitre, et l'embauche à laquelle le comparer (le cas du budget doublé le reprend). */
export function formation(_c?: Cas, minutesApres?: number) {
  const duDepart = formationDeNPlus1(MINUTES_ESSAYEES[0]).minutesDuDepart;
  const f = formationDeNPlus1(minutesApres ?? duDepart - MINUTES_GAGNEES_PAR_LE_STAGE);
  const embauche = recrutementDeNPlus1({ poste: 1, embauche: 1 });
  const posteSeul = recrutementDeNPlus1({ poste: 1, embauche: 0 });
  const enceintesDeLEmbauche = embauche.joue.production - posteSeul.joue.production;
  return {
    ...f,
    embauche,
    enceintesDeLEmbauche,
    coutDeLEmbauche: embauche.coutDeLaRecrue,
    coutParEnceinteFormee: f.enceintesEnPlus > 0 ? Math.round((f.cout / f.enceintesEnPlus) * 100) / 100 : 0,
    coutParEnceinteEmbauche: enceintesDeLEmbauche > 0 ? Math.round((embauche.coutDeLaRecrue / enceintesDeLEmbauche) * 100) / 100 : 0,
    /** Le plus haut coût du stage par opérateur, à l'euro, que la marge gagnée paie encore. */
    coutMaximalParOperateur: Math.floor(f.margeEnPlus / f.operateurs + 1e-9),
  };
}

export const FORMER: Chapitre = {
  code: "former",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  titre: "Former pour être plus efficace",
  accroche:
    "La formation coûte tout de suite et rapporte ensuite. Ce qu'un stage fait gagner quand l'équipe est le goulot, ce qu'il coûte, et la comparaison avec une embauche.",
  objectifs: [
    "Mesurer la capacité qu'une formation fait gagner",
    "Calculer ce qu'une formation rapporte, une fois payée",
    "Comparer former et recruter pour obtenir plus de travail",
    "Expliquer pourquoi une formation ne paie que si le travail manque",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Investir dans les compétences",
      notions: ["training", "productivity"],
      texte: (c) => {
        const f = formation(c);
        return [
          `En N + 1, ${c.entreprise} ajoute un cinquième poste à sa ligne : elle peut monter ${qte(f.capaciteDeLOutil)} ${c.unites} par trimestre. Mais ses ${f.operateurs} opérateurs n'en montent que ${qte(f.equipeDuDepart)} : c'est maintenant l'équipe qui borne la production.`,
          `Le fabricant de la ligne propose un stage : chaque opérateur monterait une enceinte en ${minutes(f.minutes)} au lieu de ${minutes(f.minutesDuDepart)}. Chaque minute gagnée coûte ${eur(COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR)} par opérateur, payés en janvier ; le gain dure tant que les opérateurs restent.`,
          "Former ses salariés n'est pas qu'un choix de gestion : l'employeur doit les adapter à leur poste et maintenir leur capacité à occuper un emploi, et faire avec chacun, tous les deux ans, un entretien professionnel sur ses perspectives et ses formations.",
        ];
      },
      tableau: (c) => {
        const f = formation(c);
        return {
          titre: `L'atelier ${dE(c.entreprise)} en N + 1`,
          colonnes: ["Sans le stage", "Avec le stage"],
          lignes: [
            { libelle: "Minutes pour monter une enceinte", valeurs: [qte(f.minutesDuDepart), qte(f.minutes)] },
            { libelle: "Heures de montage d'un opérateur par mois", valeurs: [qte(f.heuresParMois), qte(f.heuresParMois)] },
            { libelle: `Capacité de la ligne par trimestre (${c.unites})`, valeurs: [qte(f.capaciteDeLOutil), qte(f.capaciteDeLOutil)] },
            { libelle: "Demande prévue par trimestre", valeurs: [f.joue.trimestres.map((t) => qte(t.demande)).join(" · "), f.joue.trimestres.map((t) => qte(t.demande)).join(" · ")] },
          ],
        };
      },
      repere: () => "Enceintes d'un opérateur par mois = minutes de travail du mois ÷ minutes d'une enceinte.",
    },
    {
      id: "gain",
      objectifs: [0],
      type: "montants",
      titre: "Ce que le stage fait gagner",
      notions: ["training", "productivity"],
      question: (c) => {
        const f = formation(c);
        return `Après le stage, combien d'${c.unites} un opérateur monte-t-il par mois (${qte(f.heuresParMois)} heures, soit ${qte(f.heuresParMois * 60)} minutes, divisées par ${qte(f.minutes)}, à l'unité inférieure) ? Combien l'équipe de ${f.operateurs} en monte-t-elle par trimestre ? Combien d'enceintes de plus l'année vend-elle, et quelle marge, à ${eur(f.marge)} l'enceinte ?`;
      },
      champs: (c) => {
        const f = formation(c);
        return [
          { libelle: `Par opérateur et par mois (${c.unites})`, attendu: f.parMois, calcul: `${qte(f.heuresParMois * 60)} ÷ ${qte(f.minutes)} = ${qte(f.parMois)}`, tolerance: 0 },
          { libelle: `Capacité de l'équipe par trimestre (${c.unites})`, attendu: f.equipe, calcul: `${qte(f.parMois)} × ${f.operateurs} × ${MOIS_PAR_TRIMESTRE} = ${qte(f.equipe)}`, tolerance: 0 },
          { libelle: `Ventes en plus dans l'année (${c.unites})`, attendu: f.enceintesEnPlus, calcul: `${qte(f.joue.production)} − ${qte(f.sansFormation.production)} = ${qte(f.enceintesEnPlus)}`, tolerance: 0 },
          { libelle: "Marge gagnée", attendu: f.margeEnPlus, calcul: `${qte(f.enceintesEnPlus)} × ${eur(f.marge)} = ${eur(f.margeEnPlus)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const f = formation(c);
        return [
          `Avec le stage, l'équipe monte ${qte(f.equipe)} ${c.unites} par trimestre au lieu de ${qte(f.equipeDuDepart)} : au printemps et à Noël, toute la demande est servie. Les ${qte(f.enceintesEnPlus)} ${c.unites} de plus laissent ${eur(f.margeEnPlus)} de marge.`,
        ];
      },
    },
    {
      id: "cout",
      objectifs: [1],
      type: "montants",
      titre: "Ce que le stage coûte et rapporte",
      notions: ["training"],
      question: () => "Calculez le coût du stage pour toute l'équipe, puis ce qu'il rapporte dans l'année, une fois payé (marge gagnée moins coût du stage).",
      champs: (c) => {
        const f = formation(c);
        return [
          { libelle: "Coût du stage", attendu: f.cout, calcul: `${f.minutesGagnees} × ${eur(COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR)} × ${f.operateurs} = ${eur(f.cout)}`, tolerance: 1 },
          { libelle: "Ce que le stage rapporte dans l'année", attendu: f.gain, calcul: `${eur(f.margeEnPlus)} − ${eur(f.cout)} = ${eur(f.gain)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const f = formation(c);
        return [
          f.gain > 0
            ? `Le stage se paie dès la première année : ${eur(f.gain)} de plus au résultat. Et le gain ne s'arrête pas avec l'année : tant que l'équipe reste, elle monte plus vite.`
            : `Le stage ne se paie pas dans l'année : il coûte ${eur(-f.gain)} de plus qu'il ne rapporte.`,
        ];
      },
    },
    {
      id: "comparer",
      objectifs: [2],
      type: "choix",
      titre: "Former ou recruter",
      notions: ["training", "payroll"],
      tableau: (c) => {
        const f = formation(c);
        return {
          titre: "Deux façons de servir la demande, avec le cinquième poste",
          colonnes: ["Former", "Recruter"],
          lignes: [
            { libelle: "Ce que cela coûte dans l'année", valeurs: [eur(f.cout), eur(f.coutDeLEmbauche)] },
            { libelle: `Ventes en plus (${c.unites})`, valeurs: [qte(f.enceintesEnPlus), qte(f.enceintesDeLEmbauche)] },
            { libelle: "Coût par enceinte gagnée", valeurs: [eur(f.coutParEnceinteFormee), eur(f.coutParEnceinteEmbauche)] },
          ],
        };
      },
      question: (c) => `Pour servir la demande avec le cinquième poste, ${c.entreprise} peut former ses opérateurs ou recruter. Que retenir ?`,
      options: (c) => {
        const f = formation(c);
        const former = f.coutParEnceinteFormee < f.coutParEnceinteEmbauche;
        return [
          {
            texte: "Former : le même gain, pour bien moins cher",
            juste: former,
            retour: former
              ? `Oui : le stage fait vendre ${qte(f.enceintesEnPlus)} ${c.unites} de plus pour ${eur(f.cout)}, une recrue ${qte(f.enceintesDeLEmbauche)} pour ${eur(f.coutDeLEmbauche)}. Recruter apporterait de la capacité en trop : la ligne ne peut pas monter plus que la demande.`
              : `Non : ici, chaque enceinte gagnée coûte ${eur(f.coutParEnceinteFormee)} en formant, ${eur(f.coutParEnceinteEmbauche)} en recrutant.`,
          },
          {
            texte: "Recruter : une recrue apporte plus de capacité qu'un stage",
            juste: !former,
            retour: !former
              ? `Oui : chaque enceinte gagnée coûte ${eur(f.coutParEnceinteEmbauche)} en recrutant, ${eur(f.coutParEnceinteFormee)} en formant.`
              : `Non : la recrue apporte bien plus de capacité, mais la demande ne la remplit pas. Elle fait vendre ${qte(f.enceintesDeLEmbauche)} ${c.unites} de plus, autant que le stage, pour ${eur(f.coutDeLEmbauche)}.`,
          },
          {
            texte: "Les deux se valent : chacun fait monter la capacité de l'équipe",
            juste: false,
            retour: `Non : une capacité ne vaut que par les ventes qu'elle permet. Le stage et la recrue font vendre autant, mais pas au même prix : ${eur(f.cout)} contre ${eur(f.coutDeLEmbauche)}.`,
          },
        ];
      },
    },
    {
      id: "le-prix-du-stage",
      objectifs: [1],
      type: "curseur",
      titre: "Le plus haut prix du stage",
      notions: ["training", "contribution_margin"],
      sens: "plus-grande",
      question: (c) => {
        const f = formation(c);
        return `Le fabricant pourrait demander plus cher. Faites varier le prix du stage par opérateur : une droite donne la marge que le stage fait gagner dans l'année, l'autre ce qu'il coûterait pour les ${f.operateurs} opérateurs. Placez le curseur sur le plus haut prix, à l'euro, que la marge paie encore.`;
      },
      grandeur: () => ({ libelle: "Prix du stage par opérateur", unite: "€" }),
      cible: () => ({ attendu: formation().coutMaximalParOperateur, max: 6_000 }),
      zones: ["Le stage se paie dans l'année", "Le stage coûte plus qu'il ne rapporte"],
      rates: () => ({ dessous: "À ce prix, le stage se paie, mais il se paierait plus cher aussi : cherchez le plus haut prix.", dessus: "À ce prix, le stage coûte plus que la marge qu'il fait gagner." }),
      montrer: "Montrer le prix",
      lecture: (_c, prix) => {
        const f = formation();
        return [
          { libelle: "Marge gagnée dans l'année", montant: f.margeEnPlus },
          { libelle: "Coût du stage pour l'équipe", montant: prix * f.operateurs, fort: true },
        ];
      },
      droites: () => {
        const f = formation();
        return { produit: () => f.margeEnPlus, cout: (prix) => prix * f.operateurs, libelles: ["Marge gagnée", "Coût du stage"] };
      },
      explication: (c) => {
        const f = formation(c);
        const p = f.coutMaximalParOperateur;
        return [
          `Jusqu'à ${eur(p)} par opérateur, soit ${eur(p * f.operateurs)} pour l'équipe, le stage se paie dans l'année ; au-delà, il coûte plus que les ${eur(f.margeEnPlus)} qu'il fait gagner. Au prix proposé, ${eur(f.coutParOperateur)}, il laisse de la marge.`,
          "Et l'année suivante, le gain revient sans rien payer de plus : une formation se juge aussi sur plusieurs années.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-stage",
      objectifs: [3],
      type: "simulation",
      titre: "La formation qui rapporte le plus",
      notions: ["training", "capacity"],
      question: (c) =>
        `Le fabricant propose plusieurs stages : plus il fait gagner de minutes, plus il coûte (${eur(COUT_D_UNE_MINUTE_GAGNEE_PAR_OPERATEUR)} par minute et par opérateur). Choisissez le temps de montage visé, et regardez les ${c.unites} de plus et ce que le stage rapporte, une fois payé.`,
      leviers: (c) => {
        const d = formation(c);
        return [
          {
            code: "minutes",
            libelle: "Minutes pour monter une enceinte",
            unite: "min",
            min: Math.min(...MINUTES_ESSAYEES),
            max: Math.max(...MINUTES_ESSAYEES),
            pas: 1,
            depart: d.minutesDuDepart,
            choix: MINUTES_ESSAYEES.map((m) => ({ valeur: m, libelle: m === d.minutesDuDepart ? `${minutes(m)}, sans stage` : minutes(m) })),
          },
        ];
      },
      lecture: (_c, p) => {
        const f = formationDeNPlus1(p.minutes!);
        return [
          { libelle: "Capacité de l'équipe par trimestre", montant: f.equipe, unite: "enceintes", reference: f.equipeDuDepart },
          { libelle: "Enceintes refusées dans l'année", montant: f.refusees, unite: "enceintes", reference: f.sansFormation.refusees },
          { libelle: "Marge gagnée", montant: f.margeEnPlus },
          { libelle: "Coût du stage", montant: f.cout },
          { libelle: "Ce que le stage rapporte, une fois payé", montant: f.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = formationQuiRapporteLePlus();
        return {
          consigne: "Trouvez le stage qui rapporte le plus dans l'année, une fois payé.",
          atteint: (p) => p.minutes === juste,
          indice: (p) => {
            const f = formationDeNPlus1(p.minutes!);
            return f.refusees > 0
              ? `À ${minutes(p.minutes!)}, l'équipe refuse encore ${qte(f.refusees)} enceintes : un stage plus poussé ferait vendre davantage.`
              : `À ${minutes(p.minutes!)}, toute la demande est servie : chaque minute de plus se paie sans rien faire vendre.`;
          },
          solution: { minutes: juste },
        };
      },
      explication: (c, p) => {
        const f = formationDeNPlus1(p.minutes!);
        const plus = formationDeNPlus1(p.minutes! - 1);
        return [
          `Défi relevé : à ${minutes(p.minutes!)}, toute la demande est servie et le stage rapporte ${eur(f.gain)}, une fois payé. À ${minutes(p.minutes! - 1)}, l'équipe monterait ${qte(plus.equipe)} ${c.unites}, mais la ligne et la demande n'en prendraient pas une de plus : le stage rapporterait ${eur(plus.gain)}.`,
          "Une formation ne paie que tant que le travail gagné trouve des clients : au-delà, elle n'est plus qu'une dépense.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["training"],
      texte: (c) => {
        const f = formation(c);
        return [
          `Chez ${c.entreprise}, un stage de ${eur(f.cout)} fait vendre ${qte(f.enceintesEnPlus)} ${c.unites} de plus et rapporte ${eur(f.gain)} dès l'année N + 1 ; une recrue en ferait vendre autant pour ${eur(f.coutDeLEmbauche)}.`,
          "Former et recruter répondent à la même question : obtenir plus de travail. La formation coûte souvent moins et développe les compétences de ceux qui sont là ; le recrutement apporte davantage d'un coup. L'une comme l'autre ne paie que si le travail manquait.",
        ];
      },
      repere: () => "Une formation se paie si la marge des ventes qu'elle permet dépasse son coût ; elle ne rapporte que si le travail gagné trouve des clients.",
    },
  ],
};
