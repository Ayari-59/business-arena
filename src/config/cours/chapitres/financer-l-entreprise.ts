import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { ENDETTEMENT_MAXIMAL } from "../financement";
import type { Chapitre } from "../types";
import { bilanFonctionnel } from "./bilan-fonctionnel";
import { rentabilite } from "./rentabilite";
import { soldesDeGestion } from "./soldes-intermediaires";

/**
 * CHAPITRE : FINANCER L'ENTREPRISE (Bac STMG, gestion et finance, palier 1).
 *
 * Pour acheter un nouvel équipement, l'entreprise a trois sources : ce que son activité dégage
 * (l'autofinancement, mesuré par la capacité d'autofinancement), un emprunt, ou un apport de ses
 * associés. Le chapitre calcule la capacité d'autofinancement de l'année, voit si elle suffit,
 * chiffre ce que coûterait un emprunt et ce qu'il ferait à l'endettement, puis choisit.
 *
 * L'équipement est celui que le cas achète à la création (son prix au catalogue de l'arène) ; la
 * capacité d'autofinancement, celle des soldes de gestion ; le bilan, celui du 31 décembre ; le
 * taux, celui de l'emprunt de l'entreprise. Le seuil d'endettement raisonnable est posé et
 * justifié dans `financement.ts`.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Financement = "autofinancement" | "emprunt" | "apport";

/** L'équipement à financer, ce que l'entreprise dégage, et ce que coûterait de l'emprunter. */
export function financer(c: Cas) {
  const s = soldesDeGestion(c);
  const f = bilanFonctionnel(c).fin;
  const montant = c.immobilisation.ht;
  const caf = s.cafAdditive;
  const interets = auCentime(montant * c.pret.tauxAnnuel);
  const endettementAvant = auCentieme(f.emprunts / f.capitauxPropres);
  const endettementApres = auCentieme((f.emprunts + montant) / f.capitauxPropres);
  const choix: Financement = caf >= montant ? "autofinancement" : endettementApres <= ENDETTEMENT_MAXIMAL ? "emprunt" : "apport";
  return {
    equipement: c.immobilisation.designation,
    montant,
    resultatNet: s.resultatNet,
    dotation: s.dotation,
    caf,
    capitauxPropres: f.capitauxPropres,
    emprunts: f.emprunts,
    tauxDeLEmprunt: auDixieme(c.pret.tauxAnnuel * 100),
    interets,
    endettementAvant,
    endettementApres,
    maximal: ENDETTEMENT_MAXIMAL,
    // La rentabilité de l'activité, celle du chapitre « La rentabilité » : un emprunt n'enrichit
    // les associés que si l'activité rapporte plus que l'emprunt ne coûte.
    economique: rentabilite(c).economique,
    choix,
  };
}

export const FINANCER_L_ENTREPRISE: Chapitre = {
  code: "financer-l-entreprise",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 4 · Temps et risque",
    "STMG Thème 3 · Accompagner la prise de décision",
    "BUT GACO · Entreprendre dans un contexte de reprise ou de création d'organisation",
  ],
  titre: "Financer l'entreprise : autofinancement ou emprunt",
  accroche:
    "Un nouvel équipement à payer : avec ce que l'activité dégage, avec l'argent de la banque, ou avec celui des associés ? Ce que chaque solution coûte, et ce qu'elle change.",
  objectifs: [
    "Calculer la capacité d'autofinancement",
    "Dire si l'entreprise peut s'autofinancer",
    "Chiffrer le coût d'un emprunt et son effet sur l'endettement",
    "Choisir un mode de financement",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois façons de payer",
      notions: ["frng"],
      texte: (c) => {
        const k = financer(c);
        return [
          `${c.entreprise} veut acheter un équipement de plus, du même modèle que son premier : « ${k.equipement} », ${eur(k.montant)} hors taxes. Trois sources peuvent le payer.`,
          "L'autofinancement : l'argent que l'activité a dégagé dans l'année et que l'entreprise garde. L'emprunt : l'argent de la banque, à rembourser avec des intérêts. L'apport : de l'argent nouveau mis par les associés, qui deviennent plus engagés dans l'entreprise.",
        ];
      },
      repere: () => "Capacité d'autofinancement = résultat net + dotations aux amortissements (une charge qui ne fait sortir aucun argent).",
    },
    {
      id: "caf",
      type: "montants",
      titre: "La capacité d'autofinancement",
      notions: ["frng", "income_statement"],
      question: (c) => {
        const k = financer(c);
        return `Le résultat net ${dE(c.entreprise)} est de ${eur(k.resultatNet)}, et l'usure de son équipement (l'amortissement) a coûté ${eur(k.dotation)}, une charge qui ne fait sortir aucun argent. Calculez sa capacité d'autofinancement.`;
      },
      champs: (c) => {
        const k = financer(c);
        return [{ libelle: "Capacité d'autofinancement", attendu: k.caf, calcul: `${eur(k.resultatNet)} + ${eur(k.dotation)} = ${eur(k.caf)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const k = financer(c);
        return [
          k.caf >= 0
            ? `Sur l'année, l'activité ${dE(c.entreprise)} a dégagé ${eur(k.caf)} : c'est l'argent dont elle dispose pour investir, rembourser ses emprunts ou renforcer sa trésorerie.`
            : `La capacité d'autofinancement est négative : ${eur(k.caf)}. Même sans compter l'usure de l'équipement, l'activité a consommé de l'argent au lieu d'en dégager.`,
        ];
      },
    },
    {
      id: "suffit",
      type: "choix",
      titre: "L'autofinancement suffit-il ?",
      notions: ["frng"],
      question: (c) => {
        const k = financer(c);
        return `L'équipement coûte ${eur(k.montant)} ; la capacité d'autofinancement de l'année est de ${eur(k.caf)}. ${c.entreprise} peut-elle le payer avec ce que son activité dégage ?`;
      },
      options: (c) => {
        const k = financer(c);
        const oui = k.caf >= k.montant;
        return [
          {
            texte: "Oui : sa capacité d'autofinancement couvre le prix",
            juste: oui,
            retour: oui
              ? `Oui : ${eur(k.caf)} pour ${eur(k.montant)}. L'entreprise peut s'autofinancer : elle n'a pas à s'endetter davantage, et ne paie pas d'intérêts de plus.`
              : `Non : ${eur(k.caf)} ne suffisent pas pour ${eur(k.montant)}.`,
          },
          {
            texte: "Non : il lui faut une autre source",
            juste: !oui,
            retour: !oui
              ? `Oui : ${k.caf > 0 ? `${eur(k.caf)} ne couvrent pas les ${eur(k.montant)} de l'équipement` : "l'activité n'a rien dégagé cette année"}. Il faut emprunter, ou demander un apport aux associés.`
              : `Non : ${eur(k.caf)}, c'est plus que les ${eur(k.montant)} de l'équipement.`,
          },
          {
            texte: "Oui, s'il lui reste des capitaux propres",
            juste: false,
            retour: `Non : les capitaux propres (${eur(k.capitauxPropres)}) ne sont pas de l'argent disponible ; ils disent qui a financé ce que l'entreprise possède déjà. Ce qu'elle peut dépenser vient de ce que l'activité dégage : la capacité d'autofinancement.`,
          },
        ];
      },
    },
    {
      id: "emprunt",
      type: "montants",
      titre: "Ce que coûterait un emprunt",
      notions: ["frng", "balance_sheet"],
      question: (c) => {
        const k = financer(c);
        return `Si ${c.entreprise} empruntait les ${eur(k.montant)} au taux de ${pct(k.tauxDeLEmprunt)} par an, combien paierait-elle d'intérêts la première année ? Ses emprunts sont aujourd'hui de ${eur(k.emprunts)} pour ${eur(k.capitauxPropres)} de capitaux propres : calculez le rapport emprunts ÷ capitaux propres avant et après ce nouvel emprunt, au centième.`;
      },
      champs: (c) => {
        const k = financer(c);
        return [
          { libelle: "Intérêts de la première année", attendu: k.interets, calcul: `${eur(k.montant)} × ${pct(k.tauxDeLEmprunt)} = ${eur(k.interets)}` },
          { libelle: "Endettement avant", attendu: k.endettementAvant, calcul: `${eur(k.emprunts)} ÷ ${eur(k.capitauxPropres)} = ${qte(k.endettementAvant)}`, tolerance: 0.01 },
          { libelle: "Endettement après", attendu: k.endettementApres, calcul: `(${eur(k.emprunts)} + ${eur(k.montant)}) ÷ ${eur(k.capitauxPropres)} = ${qte(k.endettementApres)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = financer(c);
        return [
          `L'emprunt coûterait ${eur(k.interets)} d'intérêts la première année, un peu moins ensuite à mesure qu'il se rembourse. Il porterait l'endettement à ${qte(k.endettementApres)} : ${k.endettementApres <= k.maximal ? "les emprunts resteraient au plus égaux aux capitaux propres, ce que les banques jugent raisonnable." : "les emprunts dépasseraient les capitaux propres, et une banque demanderait d'abord un apport des associés."}`,
        ];
      },
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Choisir le financement",
      notions: ["frng", "balance_sheet"],
      question: (c) => `Au vu de ces chiffres, comment ${c.entreprise} devrait-elle financer son nouvel équipement ?`,
      options: (c) => {
        const k = financer(c);
        const options: { code: Financement; texte: string; oui: string }[] = [
          {
            code: "autofinancement",
            texte: "Par autofinancement",
            oui: `Oui : sa capacité d'autofinancement (${eur(k.caf)}) couvre les ${eur(k.montant)}. Elle garde son indépendance et ne paie aucun intérêt ; elle pourra emprunter plus tard, pour un projet plus gros.`,
          },
          {
            code: "emprunt",
            texte: "Par un emprunt",
            oui: `Oui : son activité ne dégage pas assez pour payer seule (${eur(k.caf)}), mais son endettement resterait raisonnable (${qte(k.endettementApres)}). L'emprunt coûte ${eur(k.interets)} d'intérêts la première année, et laisse aux associés tout le capital.${k.economique <= k.tauxDeLEmprunt ? ` Reste que son activité rapporte ${pct(k.economique)} de ce qu'elle mobilise, ${k.economique > 0 ? "moins que les" : "face aux"} ${pct(k.tauxDeLEmprunt)} de l'emprunt : l'équipement n'enrichira les associés que s'il rend l'activité plus rentable.` : ""}`,
          },
          {
            code: "apport",
            texte: "Par un apport des associés",
            oui: `Oui : l'activité ne dégage pas assez (${eur(k.caf)}), et un emprunt porterait l'endettement à ${qte(k.endettementApres)}, au-delà de la règle de prudence des banques. Un apport renforce les capitaux propres, et rendra un emprunt possible plus tard.`,
          },
        ];
        return options.map((o) => ({
          texte: o.texte,
          juste: o.code === k.choix,
          retour:
            o.code === k.choix
              ? o.oui
              : o.code === "autofinancement"
                ? `Non : sa capacité d'autofinancement (${eur(k.caf)}) ne couvre pas les ${eur(k.montant)}.`
                : o.code === "emprunt"
                  ? k.choix === "autofinancement"
                    ? `Pas nécessaire : l'activité dégage assez pour payer sans s'endetter ni payer d'intérêts.`
                    : `Non : l'endettement passerait à ${qte(k.endettementApres)}, au-delà de ce qu'une banque juge raisonnable.`
                  : `Pas nécessaire : ${k.choix === "autofinancement" ? "l'activité dégage assez pour payer seule" : "un emprunt reste raisonnable"}, sans demander d'argent nouveau aux associés.`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["frng"],
      texte: (c) => {
        const k = financer(c);
        const mot = { autofinancement: "par autofinancement", emprunt: "par un emprunt", apport: "par un apport des associés" }[k.choix];
        return [
          `${c.entreprise} dégage ${eur(k.caf)} de capacité d'autofinancement dans l'année ; pour un équipement de ${eur(k.montant)}, elle le financerait ${mot}.`,
          "Le choix d'un financement dépend de ce que l'activité dégage, de ce que coûte l'argent emprunté, et de l'équilibre entre ce que les associés apportent et ce que l'entreprise doit. Une entreprise trop endettée perd sa liberté ; une entreprise qui n'emprunte jamais grandit moins vite.",
        ];
      },
      repere: () => "Autofinancement si la capacité d'autofinancement suffit ; emprunt si l'endettement reste raisonnable ; sinon, apport des associés.",
    },
  ],
};
