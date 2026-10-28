import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { bilanDeFinDAnnee, tableauDuBilan } from "../../chapitres/lire-le-bilan";
import { auCentime } from "../../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE } from "../../monde/comptes-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BILAN » : L'INVESTISSEUSE AU CAPITAL
 * (Bac STMG, gestion et finance, palier 1).
 *
 * Une investisseuse propose d'entrer au capital en apportant de l'argent frais. La
 * gérante veut savoir, avant de la recevoir, ce que cet apport changerait au bilan du
 * 31 décembre : ce qui bouge et ce qui ne bouge pas, le nouveau total, la part des
 * capitaux propres dans le financement, la trésorerie. L'élève refait seul les calculs
 * du chapitre (le total du bilan, la part des capitaux propres, l'argent disponible face
 * au découvert) sur un bilan qui change.
 *
 * Le cas est neuf par sa question : le chapitre lit le bilan tel qu'il est, le cas y
 * passe une opération. Le bilan est celui du chapitre (`bilanDeFinDAnnee`), au 31 décembre du
 * premier exercice de NOVA dans le monde du cours. L'apport arrive sur le compte en banque : il
 * comble d'abord le découvert, s'il y en a un.
 */

/**
 * La part des capitaux propres que l'investisseuse détiendrait après son apport : 20 %,
 * une participation minoritaire comme en prennent les investisseurs individuels dans une
 * petite entreprise, assez pour peser sans prendre la main. Son apport vaut donc le quart
 * des capitaux propres d'aujourd'hui, arrondi à la centaine d'euros.
 */
export const PART_DE_L_INVESTISSEUSE = 0.2;

/** Un montant, le signe moins typographique : « −582,38 € ». */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCent = (x: number) => Math.round(x / 100) * 100;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function investisseuseAuCapital(c: Pick<Cas, "code">) {
  const b = bilanDeFinDAnnee(c);
  const apport = auCent((b.capitauxPropres * PART_DE_L_INVESTISSEUSE) / (1 - PART_DE_L_INVESTISSEUSE));
  // L'argent arrive en banque : il rembourse d'abord le découvert, le reste grossit le compte.
  const comble = Math.min(apport, b.decouvert);
  const capitauxPropresApres = auCentime(b.capitauxPropres + apport);
  const total = auCentime(b.passif + apport - comble);
  const decouvertApres = auCentime(b.decouvert - comble);
  const disponible = auCentime(b.disponible + apport - comble);
  return {
    ...b,
    apport,
    comble,
    capitauxPropresApres,
    total,
    decouvertApres,
    disponibleApres: disponible,
    tresorerieAvant: b.tresorerie,
    tresorerieApres: auCentime(disponible - decouvertApres),
    autonomieApres: auDixieme((capitauxPropresApres / total) * 100),
    // L'erreur classique : grossir les capitaux propres sans grossir le total du bilan.
    sansLeTotal: auDixieme((capitauxPropresApres / b.passif) * 100),
  };
}

export const L_INVESTISSEUSE_AU_CAPITAL: Situation = {
  code: "l-investisseuse-au-capital",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["lire-le-bilan"],
  commanditaire: "La gérante",
  titre: "L'investisseuse au capital",
  accroche:
    "Une investisseuse propose d'apporter de l'argent frais et d'entrer au capital. Avant de la recevoir, la gérante veut savoir ce que cet apport changerait au bilan.",
  objectifs: [
    "Calculer le total du bilan et la part des capitaux propres",
    "Dire quels postes un apport en argent fait bouger",
    "Refaire le bilan après l'apport : total, part des capitaux propres, trésorerie",
    "Rédiger une réponse chiffrée à la gérante",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le bilan du premier exercice de NOVA dans la simulation du cours, celui du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          `« Une investisseuse propose d'apporter ${eur(r.apport)} à ${r.entreprise}, versés sur notre compte en banque, pour détenir environ ${pct(PART_DE_L_INVESTISSEUSE * 100)} de nos capitaux propres. Avant de la recevoir, dites-moi ce que cet apport changerait à notre bilan du 31 décembre : son total, la part que les associés financent, et notre trésorerie. »`,
          "Pas de cours cette fois : vous avez le bilan, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => tableauDuBilan(investisseuseAuCapital(c)),
      repere: () =>
        "À rendre : le total du bilan et la part des capitaux propres aujourd'hui, les postes que l'apport fait bouger, le bilan après l'apport, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Le bilan d'aujourd'hui",
      notions: ["balance_sheet"],
      question: () =>
        "Commencez par le bilan tel qu'il est : son total (celui du passif, capitaux propres plus dettes), puis la part des capitaux propres dans ce total, en pourcentage au dixième.",
      champs: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          { libelle: "Total du bilan", attendu: r.passif, calcul: `${eur(r.capitauxPropres)} + ${eur(r.dettes)} de dettes = ${eur(r.passif)}`, tolerance: 1 },
          { libelle: "Part des capitaux propres (%)", attendu: r.partDesAssocies, calcul: `${eur(r.capitauxPropres)} ÷ ${eur(r.passif)} × 100 = ${pct(r.partDesAssocies)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          `Aujourd'hui, les associés financent ${pct(r.partDesAssocies)} de ce que possède ${r.entreprise} ; les dettes, le reste.`,
        ];
      },
    },
    {
      id: "ce-qui-bouge",
      type: "tri",
      titre: "Ce que l'apport fait bouger",
      notions: ["balance_sheet"],
      question: () =>
        "L'apport arrive en argent sur le compte en banque. Rangez chaque poste : l'apport le change, ou il ne le change pas.",
      categories: [
        { code: "change", libelle: "Change" },
        { code: "reste", libelle: "Ne change pas" },
      ],
      elements: (c) => {
        const r = investisseuseAuCapital(c);
        const el = [
          { libelle: "Capitaux propres", montant: r.capitauxPropres, categorie: "change", pourquoi: `L'investisseuse devient associée : son apport, ${eur(r.apport)}, s'ajoute aux capitaux propres.` },
          r.comble < r.apport
            ? { libelle: "Banque", montant: r.poste("banque"), categorie: "change", pourquoi: "L'argent apporté arrive sur le compte : l'apport s'inscrit au passif, dans les capitaux propres, et à l'actif, en banque." }
            : { libelle: "Banque", montant: r.poste("banque"), categorie: "reste", pourquoi: `L'apport, ${eur(r.apport)}, ne suffit qu'à combler une partie du découvert : le compte reste sans argent disponible.` },
          { libelle: "Équipement (valeur nette)", montant: r.poste("equipement"), categorie: "reste", pourquoi: "Rien n'est acheté : l'apport reste en argent tant qu'il n'est pas dépensé." },
          { libelle: "Compte à terme", montant: r.poste("placement"), categorie: "reste", pourquoi: "L'argent déjà placé reste bloqué jusqu'à son échéance : l'apport arrive sur le compte courant." },
          { libelle: "Emprunt", montant: r.poste("emprunt"), categorie: "reste", pourquoi: "Un apport n'est pas un prêt, et il ne rembourse pas l'emprunt, qui suit son échéancier." },
          { libelle: "Dettes envers les fournisseurs", montant: r.poste("fournisseurs"), categorie: "reste", pourquoi: "Les fournisseurs seront payés à leur échéance, apport ou non." },
        ];
        if (r.decouvert > 0) {
          el.push({ libelle: "Découvert bancaire", montant: r.decouvert, categorie: "change", pourquoi: `L'argent arrive sur un compte à découvert : il en rembourse d'abord ${eur(r.comble)}.` });
        }
        return el;
      },
      explication: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          r.comble > 0
            ? `Un apport touche les deux côtés du bilan : au passif les capitaux propres, à l'actif l'argent reçu. Ici, une partie de cet argent rembourse le découvert, une dette : le total grossit de ${eur(r.apport)} moins les ${eur(r.comble)} de découvert remboursés.`
            : `Un apport touche les deux côtés du bilan : ${eur(r.apport)} de plus au passif, dans les capitaux propres, et ${eur(r.apport)} de plus à l'actif, en banque. Le bilan reste équilibré.`,
        ];
      },
    },
    {
      id: "apres-l-apport",
      type: "montants",
      titre: "Le bilan après l'apport",
      notions: ["balance_sheet", "net_treasury"],
      question: () =>
        "Refaites le bilan après l'apport : les capitaux propres, le total du bilan, la part des capitaux propres (au dixième), puis la trésorerie (banque moins découvert).",
      champs: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          { libelle: "Capitaux propres après l'apport", attendu: r.capitauxPropresApres, calcul: `${eur(r.capitauxPropres)} + ${eur(r.apport)} = ${eur(r.capitauxPropresApres)}` },
          {
            libelle: "Total du bilan après l'apport",
            attendu: r.total,
            calcul: r.comble > 0 ? `${eur(r.passif)} + ${eur(r.apport)} − ${eur(r.comble)} de découvert remboursé = ${eur(r.total)}` : `${eur(r.passif)} + ${eur(r.apport)} = ${eur(r.total)}`,
            tolerance: 1,
          },
          { libelle: "Part des capitaux propres (%)", attendu: r.autonomieApres, calcul: `${eur(r.capitauxPropresApres)} ÷ ${eur(r.total)} × 100 = ${pct(r.autonomieApres)}`, tolerance: 0.1 },
          { libelle: "Trésorerie après l'apport", attendu: r.tresorerieApres, calcul: `${eur(r.disponibleApres)} − ${eur(r.decouvertApres)} = ${eur(r.tresorerieApres)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          `La part des associés passerait de ${pct(r.partDesAssocies)} à ${pct(r.autonomieApres)} : ${r.entreprise} dépendrait moins de ses créanciers.`,
          r.tresorerieAvant < 0
            ? `La trésorerie passerait de ${eur(r.tresorerieAvant)} à ${eur(r.tresorerieApres)} : l'apport ${r.tresorerieApres >= 0 ? "sort l'entreprise du découvert" : "réduit le découvert sans l'effacer"}.`
            : `La trésorerie passerait de ${eur(r.tresorerieAvant)} à ${eur(r.tresorerieApres)} : tant qu'il n'est pas dépensé, l'apport attend en banque.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const r = investisseuseAuCapital(c);
        return [
          {
            texte: `Les associés financeraient ${pct(r.autonomieApres)} du bilan, contre ${pct(r.partDesAssocies)} aujourd'hui`,
            juste: true,
            retour: `Oui : ${eur(r.capitauxPropresApres)} de capitaux propres pour un total de ${eur(r.total)}. ${r.comble > 0 ? `L'apport grossit les capitaux propres ; à l'actif, il comble le découvert, puis grossit la banque : le total monte de ${eur(auCentime(r.total - r.passif))}.` : "L'apport grossit les capitaux propres, mais aussi l'argent en banque : le total grossit avec eux."}`,
          },
          {
            texte: `Les associés financeraient ${pct(r.sansLeTotal)} du bilan : l'apport grossit les capitaux propres, pas le total`,
            juste: false,
            retour: `Non : ${pct(r.sansLeTotal)}, c'est ${eur(r.capitauxPropresApres)} rapportés à l'ancien total, ${eur(r.passif)}. Mais l'argent apporté entre aussi à l'actif : le nouveau total est de ${eur(r.total)}.`,
          },
          {
            texte: "Rien ne changerait au bilan tant que l'argent de l'investisseuse n'est pas dépensé",
            juste: false,
            retour: `Non : dès qu'il arrive, l'apport s'inscrit au bilan, ${eur(r.apport)} de capitaux propres au passif et autant d'argent reçu à l'actif.`,
          },
          {
            texte: `Nos capitaux propres deviendraient de l'argent disponible : ${eur(r.capitauxPropresApres)} en banque`,
            juste: false,
            retour: `Non : les capitaux propres disent qui finance l'entreprise, pas ce qu'elle a en caisse. Après l'apport, la trésorerie serait de ${eur(r.tresorerieApres)}.`,
          },
        ];
      },
    },
  ],
};
