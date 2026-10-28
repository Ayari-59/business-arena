import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_TABLEAU_DE_BORD, ficheDe } from "../../chapitres/tableau-de-bord";
import { investissementDeLaFiche, tableauDeBord } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD » : RÉGLER LE VOYANT DE SÉCURITÉ
 * (contrôle de gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA (monde/nova-gestion.ts)
 * et le tableau de bord du modèle du cours (monde/couts-et-budgets.ts).
 *
 * Le dirigeant veut un voyant pour le prochain semestre : il doit s'allumer dès que l'indice de
 * sécurité du semestre passe sous un niveau qu'il fixe. Il demande sous quel chiffre d'affaires le
 * voyant s'allumera, et si ce voyant lui dira tout. L'élève refait seul les calculs du chapitre, sur
 * le semestre entier cette fois (taux de marge, seuil de rentabilité, indice de sécurité), trouve au
 * curseur les ventes du semestre où le voyant s'allume, calcule à rebours le chiffre d'affaires qui
 * donne l'indice voulu, puis juge ce que le voyant ne voit pas : un investissement qui laisse l'indice
 * au-dessus du niveau et met pourtant la trésorerie à découvert.
 *
 * Le cas est neuf par sa question : le chapitre lit les indicateurs mois par mois ; ici, on les
 * calcule pour le semestre, et on règle le voyant sur un niveau d'indice. Le taux de marge et les
 * charges fixes du semestre sont supposés tenir au suivant.
 */

/**
 * Le niveau du voyant : un indice de sécurité de 15 % sur le semestre, la marge qu'un dirigeant
 * prudent garde pour encaisser une mauvaise saison sans passer sous le seuil.
 */
export const INDICE_DU_VOYANT = 0.15;

/** Les bornes du curseur des ventes du semestre, en enceintes. */
export const VENTES_DU_SEMESTRE_AU_CURSEUR = { min: 10_000, max: 11_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
// « + 0 » : un arrondi à zéro ne s'écrit pas « −0,0 % ».
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const pct = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Le niveau du voyant, sans décimale inutile : « 15 % ». */
const niveau = () => `${(INDICE_DU_VOYANT * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

/** Les chiffres de la réponse, calculés une fois du cas. */
export function reglerLeVoyant(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBord(f);
  const s = t.semestre;
  const prix = f.moisDeReference.prix;
  const tauxDeMarge = auDixieme(s.tauxDeMarge * 100);
  const indiceDeSecurite = auDixieme(s.indiceDeSecurite * 100);
  // Le chiffre d'affaires dont l'indice vaut le niveau du voyant : (CA − seuil) ÷ CA = niveau.
  const cible = auCentime(s.seuil / (1 - INDICE_DU_VOYANT));
  const inv = investissementDeLaFiche(f);
  const avecLeBanc = tableauDeBord(f, { investissement: inv }).semestre;
  return {
    f,
    mois: t.mois,
    chiffreDAffaires: s.chiffreDAffaires,
    marge: s.marge,
    chargesFixes: s.chargesFixes,
    tauxDeMarge,
    seuil: s.seuil,
    indiceDeSecurite,
    moyenneDesIndices: auDixieme((t.mois.reduce((x, m) => x + m.indiceDeSecurite, 0) / t.mois.length) * 100),
    prix,
    cible,
    parMois: auCentime(cible / t.mois.length),
    margeDeSecurite: auCentime(cible - s.seuil),
    /** Les ventes du semestre sous lesquelles le voyant s'allume, à l'enceinte supérieure. */
    enceintes: Math.ceil(s.seuil / (1 - INDICE_DU_VOYANT) / prix - 1e-9),
    allume: s.chiffreDAffaires < cible,
    // Les erreurs classiques : majorer le seuil du niveau voulu, ou retirer ce niveau au chiffre d'affaires du semestre.
    seuilMajore: auCentime(s.seuil * (1 + INDICE_DU_VOYANT)),
    chiffreMinore: auCentime(s.chiffreDAffaires * (1 - INDICE_DU_VOYANT)),
    // Le taux de marge au dixième que l'élève emploie déplace le seuil d'environ un millième.
    toleranceDuSeuil: Math.max(2, Math.round(s.seuil * 0.003)),
    toleranceDeLaCible: Math.max(2, Math.round(cible * 0.003)),
    // Le banc de mesure, au mois de la fiche (février) : l'indice du semestre, et la trésorerie la plus basse.
    inv,
    usureDuBanc: auCentime(avecLeBanc.chargesFixes - s.chargesFixes),
    indiceAvecLeBanc: auDixieme(avecLeBanc.indiceDeSecurite * 100),
    tresorerieAvecLeBanc: avecLeBanc.tresoreriePlusBasse,
    voyantAvecLeBanc: avecLeBanc.indiceDeSecurite < INDICE_DU_VOYANT,
    moisDuBanc: f.semestre.mois[inv.mois]!.nom,
  };
}

export const REGLER_LE_VOYANT: Situation = {
  code: "regler-le-voyant",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord"],
  commanditaire: "Le dirigeant",
  titre: "Régler le voyant de sécurité",
  accroche:
    "Le dirigeant veut un voyant qui s'allume quand l'indice de sécurité du semestre passe sous le niveau qu'il fixe. Sous quel chiffre d'affaires s'allumera-t-il, et lui dira-t-il tout ?",
  objectifs: [
    "Calculer les indicateurs d'un semestre à partir de ses mois",
    "Calculer le seuil de rentabilité et l'indice de sécurité du semestre",
    "Calculer à rebours le chiffre d'affaires qui donne un indice de sécurité voulu",
    "Juger ce qu'un voyant ne voit pas, et rédiger une réponse chiffrée au dirigeant",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_BORD,
    pourquoi: "ce cas reprend le chapitre « Le tableau de bord », qui se lit sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const r = reglerLeVoyant(c);
        return [
          `« Pour le prochain semestre, je veux un voyant de plus au tableau de bord de ${r.f.entreprise} : il s'allume dès que l'indice de sécurité du semestre passe sous ${niveau()}. Avec le taux de marge et les charges fixes de ce semestre, sous quel chiffre d'affaires semestriel s'allumera-t-il ? Et me dira-t-il tout ce que je dois surveiller ? »`,
          `Pas de cours cette fois : vous avez les ${r.mois.length} mois du semestre, et la méthode est celle du chapitre. À vous de l'enchaîner.`,
        ];
      },
      tableau: (c) => {
        const r = reglerLeVoyant(c);
        const ligne = (libelle: string, v: (m: (typeof r.mois)[number]) => string) => ({ libelle, valeurs: r.mois.map(v) });
        return {
          titre: `Le semestre mois par mois · ${r.f.entreprise}`,
          colonnes: r.mois.map((m) => majuscule(m.nom)),
          lignes: [
            ligne("Chiffre d'affaires", (m) => eur(m.chiffreDAffaires)),
            ligne("Marge sur coût variable", (m) => eur(m.marge)),
            ligne("Charges fixes", (m) => eur(m.chargesFixes)),
            ligne("Indice de sécurité du mois", (m) => pct(auDixieme(m.indiceDeSecurite * 100))),
            ligne("Trésorerie de fin de mois", (m) => eur(m.tresorerie)),
          ],
        };
      },
      repere: () =>
        `À rendre : le taux de marge, le seuil et l'indice de sécurité du semestre, le chiffre d'affaires qui donne un indice de ${niveau()}, ce que le voyant ne voit pas, et votre réponse.`,
    },
    {
      id: "le-semestre",
      type: "montants",
      titre: "Les indicateurs du semestre",
      notions: ["margin_rates", "breakeven", "safety_margin"],
      question: (c) =>
        `Additionnez les ${reglerLeVoyant(c).mois.length} mois. Calculez le chiffre d'affaires du semestre, son taux de marge sur coût variable (en %, au dixième), le seuil de rentabilité du semestre, puis l'indice de sécurité du semestre (en %, au dixième, négatif sous le seuil).`,
      champs: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            libelle: "Chiffre d'affaires du semestre",
            attendu: r.chiffreDAffaires,
            tolerance: 1,
            calcul: `${r.mois.map((m) => eur(m.chiffreDAffaires)).join(" + ")} = ${eur(r.chiffreDAffaires)}`,
          },
          {
            libelle: "Taux de marge sur coût variable du semestre (%)",
            attendu: r.tauxDeMarge,
            tolerance: 0.1,
            calcul: `${eur(r.marge)} ÷ ${eur(r.chiffreDAffaires)} = ${pct(r.tauxDeMarge)}`,
          },
          {
            libelle: "Seuil de rentabilité du semestre",
            attendu: r.seuil,
            tolerance: r.toleranceDuSeuil,
            calcul: `${eur(r.chargesFixes)} ÷ ${pct(r.tauxDeMarge)} ≈ ${eur(r.seuil)}`,
          },
          {
            libelle: "Indice de sécurité du semestre (%)",
            attendu: r.indiceDeSecurite,
            tolerance: 0.2,
            calcul: `(${eur(r.chiffreDAffaires)} − ${eur(r.seuil)}) ÷ ${eur(r.chiffreDAffaires)} = ${pct(r.indiceDeSecurite)}`,
          },
        ];
      },
      explication: (c) => {
        const r = reglerLeVoyant(c);
        return [
          r.indiceDeSecurite >= 0
            ? `Sur le semestre, ${r.f.entreprise} est au-dessus de son seuil : son chiffre d'affaires pourrait baisser de ${pct(r.indiceDeSecurite)} avant qu'elle ne perde de l'argent.`
            : `Sur le semestre, ${r.f.entreprise} est sous son seuil : il lui aurait fallu ${pct(-r.indiceDeSecurite)} de chiffre d'affaires en plus pour ne pas perdre d'argent.`,
          `L'indice du semestre n'est pas la moyenne des ${r.mois.length} indices du tableau (${pct(r.moyenneDesIndices)}) : il se calcule sur les montants du semestre, où les gros mois pèsent plus que les petits.`,
        ];
      },
    },
    {
      id: "le-voyant-au-curseur",
      type: "curseur",
      titre: "Le voyant, au curseur",
      notions: ["safety_margin", "dashboard"],
      question: (c) => {
        const r = reglerLeVoyant(c);
        return `Faites varier les enceintes vendues sur le semestre, de ${qte(VENTES_DU_SEMESTRE_AU_CURSEUR.min)} à ${qte(VENTES_DU_SEMESTRE_AU_CURSEUR.max)}, à ${eur(r.prix)} HT. Une droite donne la marge de sécurité du semestre (le chiffre d'affaires moins le seuil), l'autre ${niveau()} du chiffre d'affaires. Placez le curseur sur le plus petit nombre d'enceintes où le voyant reste éteint, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes vendues sur le semestre", unite: "enceintes" }),
      cible: (c) => {
        const r = reglerLeVoyant(c);
        return { attendu: r.enceintes, min: VENTES_DU_SEMESTRE_AU_CURSEUR.min, max: VENTES_DU_SEMESTRE_AU_CURSEUR.max };
      },
      zones: ["Voyant éteint", "Voyant allumé"],
      rates: () => ({
        dessous: `À cette position, l'indice du semestre est sous ${niveau()} : le voyant est allumé.`,
        dessus: "Avec moins d'enceintes, le voyant reste encore éteint : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer le niveau du voyant",
      lecture: (c, q) => {
        const r = reglerLeVoyant(c);
        const ca = auCentime(q * r.prix);
        return [
          { libelle: "Chiffre d'affaires du semestre", montant: ca },
          { libelle: "Marge de sécurité", montant: auCentime(ca - r.seuil) },
          { libelle: `${niveau()} du chiffre d'affaires`, montant: auCentime(ca * INDICE_DU_VOYANT), fort: true },
        ];
      },
      droites: (c) => {
        const r = reglerLeVoyant(c);
        return { produit: (q) => q * r.prix - r.seuil, cout: (q) => q * r.prix * INDICE_DU_VOYANT, libelles: ["Marge de sécurité", `${niveau()} du chiffre d'affaires`] };
      },
      explication: (c) => {
        const r = reglerLeVoyant(c);
        return [
          `Le voyant s'allume sous ${qte(r.enceintes)} enceintes sur le semestre. Ce semestre en a vendu ${qte(r.mois.reduce((x, m) => x + m.quantite, 0))} : il resterait éteint. Il reste à traduire ce nombre en chiffre d'affaires, comme le dirigeant le demande.`,
        ];
      },
    },
    {
      id: "le-voyant",
      type: "montants",
      titre: "Le niveau du voyant",
      notions: ["safety_margin", "dashboard"],
      question: () =>
        `L'indice de sécurité vaut (chiffre d'affaires − seuil) ÷ chiffre d'affaires, et le seuil du semestre ne bouge pas. Pour quel chiffre d'affaires semestriel l'indice vaut-il exactement ${niveau()} ? Combien cela fait-il par mois, en moyenne, et quelle marge de sécurité ce chiffre d'affaires laisse-t-il ?`,
      champs: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            libelle: `Chiffre d'affaires semestriel pour un indice de ${niveau()}`,
            attendu: r.cible,
            tolerance: r.toleranceDeLaCible,
            calcul: `${eur(r.seuil)} ÷ (1 − ${niveau()}) ≈ ${eur(r.cible)}`,
          },
          {
            libelle: "Par mois, en moyenne",
            attendu: r.parMois,
            tolerance: Math.ceil(r.toleranceDeLaCible / r.mois.length) + 1,
            calcul: `${eur(r.cible)} ÷ ${r.mois.length} ≈ ${eur(r.parMois)}`,
          },
          {
            libelle: "Marge de sécurité à ce chiffre d'affaires",
            attendu: r.margeDeSecurite,
            tolerance: r.toleranceDeLaCible,
            calcul: `${eur(r.cible)} − ${eur(r.seuil)} = ${eur(r.margeDeSecurite)}, soit ${niveau()} de ${eur(r.cible)}`,
          },
        ];
      },
      explication: (c) => {
        const r = reglerLeVoyant(c);
        return [
          r.allume
            ? `Avec ${eur(r.chiffreDAffaires)} ce semestre, le voyant serait déjà allumé : il manquerait ${eur(auCentime(r.cible - r.chiffreDAffaires))} de chiffre d'affaires pour l'éteindre.`
            : `Avec ${eur(r.chiffreDAffaires)} ce semestre, le voyant resterait éteint : le chiffre d'affaires pourrait baisser de ${eur(auCentime(r.chiffreDAffaires - r.cible))} avant qu'il ne s'allume, sous ${qte(r.enceintes)} enceintes vendues sur le semestre.`,
        ];
      },
    },
    {
      id: "ce-que-le-voyant-ne-voit-pas",
      type: "choix",
      titre: "Ce que le voyant ne voit pas",
      notions: ["dashboard", "net_treasury"],
      question: (c) => {
        const r = reglerLeVoyant(c);
        return `Le dirigeant envisage aussi d'acheter en ${r.moisDuBanc} un banc de mesure, ${eur(r.inv.montantHt)} HT, amorti ${eur(auCentime(r.inv.montantHt / r.f.semestre.investissement.dureeDAmortissementMois))} par mois. Sur ce semestre, le nouveau voyant se serait-il allumé, et qu'en conclure ?`;
      },
      options: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            texte: `${r.voyantAvecLeBanc ? "Oui" : "Non"} : l'indice reste à ${pct(r.indiceAvecLeBanc)}, mais ${r.moisDuBanc} finit à découvert`,
            juste: !r.voyantAvecLeBanc && r.tresorerieAvecLeBanc < 0,
            retour: `Oui. Le banc ne pèse sur le résultat que par son usure, ${eur(r.usureDuBanc)} sur le semestre : l'indice passe de ${pct(r.indiceDeSecurite)} à ${pct(r.indiceAvecLeBanc)}. Mais il sort d'un coup, TVA comprise, et la trésorerie tombe à ${eur(r.tresorerieAvecLeBanc)}. Un voyant sur l'indice surveille la rentabilité, pas l'argent : il lui faut le voyant de trésorerie à côté.`,
          },
          {
            texte: `Oui : l'investissement fait passer l'indice du semestre sous ${niveau()}`,
            juste: r.voyantAvecLeBanc,
            retour: `Non : l'indice ne perd que l'usure du banc, et reste à ${pct(r.indiceAvecLeBanc)}. C'est la trésorerie qui souffre : ${enBanque(r.tresorerieAvecLeBanc)} au plus bas.`,
          },
          {
            texte: `Non : le semestre reste au-dessus de ${niveau()}, donc l'achat est sans risque`,
            juste: false,
            retour: `Non : un indice au-dessus de ${niveau()} dit que le semestre est rentable, pas qu'il a de l'argent. Avec le banc, la trésorerie la plus basse est de ${eur(r.tresorerieAvecLeBanc)}.`,
          },
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const r = reglerLeVoyant(c);
        return [
          {
            texte: `Sous ${eur(r.cible)} par semestre ; et gardez à côté le voyant de trésorerie`,
            juste: true,
            retour: `Oui : à ${eur(r.cible)}, la marge de sécurité, ${eur(r.cible)} − ${eur(r.seuil)} = ${eur(r.margeDeSecurite)}, fait ${niveau()} du chiffre d'affaires. Le seuil se divise par (1 − ${niveau()}), parce que l'indice se rapporte au chiffre d'affaires, pas au seuil. Et ce voyant ne voit que la rentabilité : le banc ${dE(r.moisDuBanc)} le laisserait éteint, la trésorerie à découvert.`,
          },
          {
            texte: `Sous ${eur(r.seuilMajore)} par semestre, le seuil majoré de ${niveau()} ; il suffit à tout surveiller`,
            juste: false,
            retour: `Non : à ${eur(r.seuilMajore)}, la marge de sécurité ferait ${niveau()} du seuil, mais seulement ${pct(auDixieme((1 - 1 / (1 + INDICE_DU_VOYANT)) * 100))} du chiffre d'affaires. L'indice se rapporte au chiffre d'affaires. Et un voyant sur l'indice ne voit pas la trésorerie.`,
          },
          {
            texte: `Sous ${eur(r.chiffreMinore)} par semestre, ${niveau()} de moins que ce semestre ; il suffit à tout surveiller`,
            juste: false,
            retour: `Non : le voyant dépend du seuil, ${eur(r.seuil)}, pas du chiffre d'affaires de ce semestre. Retirer ${niveau()} à ${eur(r.chiffreDAffaires)} ne dit rien de l'indice de sécurité. Et un voyant sur l'indice ne voit pas la trésorerie.`,
          },
        ];
      },
    },
  ],
};
