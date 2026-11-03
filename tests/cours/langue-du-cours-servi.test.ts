import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import {
  espacesOrdinairesFautives,
  LEXIQUE_INTERDIT,
  phrasesLongues,
  tiretsAuMilieu,
  tutoiements,
} from "../helpers/textes-du-depot";

/**
 * LA LANGUE DU COURS SERVI (audit de la langue, novembre 2026, section 6). Le parcours de l'audit
 * (servir.ts) : chaque chapitre et chaque cas pratique, servi par `servirLeChapitre` dans chaque
 * entreprise où il se joue, et toutes les chaînes de l'objet servi, plus l'accroche, le
 * commanditaire et la raison du choix des entreprises. C'est ce que l'élève lit, nom de
 * l'entreprise et montants compris : une faute qui n'apparaît qu'à l'hôtel se voit ici.
 */

interface TexteServi {
  ou: string;
  chemin: string;
  texte: string;
}

/** Les clés de code : pas du texte lu. */
const CODES = new Set(["code", "id", "type", "compte", "levier", "vue", "categorie", "cle", "unite_code", "montrer"]);
/** Les données de calcul : le journal et les courbes se lisent ailleurs, étape par étape. */
const DONNEES = new Set(["journal", "ecrituresAvant", "xs", "series"]);

function parcourir(x: unknown, chemin: string, emettre: (chemin: string, t: string) => void): void {
  if (typeof x === "string") {
    if ((/[a-zA-Zéèà]{2}/.test(x) && /\s/.test(x)) || /^[A-ZÉ][a-zé]+/.test(x)) emettre(chemin, x);
    return;
  }
  if (Array.isArray(x)) return x.forEach((v, i) => parcourir(v, `${chemin}[${i}]`, emettre));
  if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) if (!CODES.has(k) && !DONNEES.has(k)) parcourir(v, chemin ? `${chemin}.${k}` : k, emettre);
}

let releve: TexteServi[] | null = null;
function textesDuCoursServi(): TexteServi[] {
  if (releve) return releve;
  const sortie: TexteServi[] = [];
  for (const ch of [...CHAPITRES, ...SITUATIONS]) {
    for (const entreprise of ch.entreprises?.codes ?? ENTREPRISES_DU_COURS) {
      const servi = servirLeChapitre(ch, casDeLEntreprise(entreprise));
      const ou = `${ch.code} @${entreprise}`;
      const emettre = (chemin: string, texte: string) => sortie.push({ ou, chemin, texte });
      emettre("accroche", ch.accroche ?? "");
      const commanditaire = (ch as { commanditaire?: unknown }).commanditaire;
      if (commanditaire) parcourir(commanditaire, "commanditaire", emettre);
      if (ch.entreprises?.pourquoi) emettre("entreprises.pourquoi", ch.entreprises.pourquoi);
      const { etapes, ...reste } = servi;
      parcourir(reste, "", emettre);
      etapes.forEach((e, i) => parcourir(e, `e${i + 1}:${e.id}`, emettre));
    }
  }
  releve = sortie;
  return sortie;
}

const E = "[\\s\\u00a0\\u202f]";
const lieu = (t: TexteServi) => `${t.ou} ${t.chemin}`;

describe("la langue du cours servi, dans chaque entreprise", () => {
  it("se relève : chaque chapitre et chaque cas, dans chaque entreprise", () => {
    expect(textesDuCoursServi().length).toBeGreaterThan(40_000);
  }, 240_000);

  it("1. aucun tiret au milieu d'une phrase", () => {
    const fautes = textesDuCoursServi().flatMap((t) => tiretsAuMilieu(t.texte).map((x) => `${lieu(t)} ${x}`));
    expect(fautes).toEqual([]);
  }, 240_000);

  it("2. le libellé d'une écriture n'a pas d'article nu : « Facture du groupe… », pas « Facture le groupe… »", () => {
    const re = new RegExp(`^(Facture|Règlement|Avoir|Commande)${E}(le|la|les)${E}|^(Facture|Règlement|Avoir|Commande)${E}l'`, "u");
    const fautes = textesDuCoursServi()
      .filter((t) => /libelle$/.test(t.chemin) && re.test(t.texte))
      .map((t) => `${lieu(t)} ${t.texte}`);
    expect(fautes).toEqual([]);
  }, 240_000);

  it("3. contractions et élisions : ni « de le client », ni « de ATLAS », ni « que il », ni « si il »", () => {
    const NOMS = "compte|résultat|bilan|prix|stock|chiffre|client|fournisseur|tour|marché|produit|coût|salaire|capital|mois|trimestre|chapitre|cas|seuil|budget|banque|entreprise|équipe|vente|marge|élève|joueur|classe|partie|niveau|secteur|groupe|comité|cabinet";
    const regles = [
      new RegExp(`(?<!\\p{L})(de|à)${E}(le|les)${E}(${NOMS})s?(?!\\p{L})`, "u"),
      new RegExp(`(?<!\\p{L})de${E}[AEIOUÉ][A-Z]`, "u"),
      new RegExp(`(?<!\\p{L})que${E}(il|ils|elle|elles|on|un|une)(?!\\p{L})`, "iu"),
      new RegExp(`(?<!\\p{L})si${E}ils?(?!\\p{L})`, "iu"),
    ];
    const fautes = textesDuCoursServi().flatMap((t) =>
      regles.flatMap((re) => {
        const m = re.exec(t.texte);
        return m ? [`${lieu(t)} ${t.texte.slice(Math.max(0, m.index - 25), m.index + m[0].length + 15)}`] : [];
      }),
    );
    expect(fautes).toEqual([]);
  }, 240_000);

  it("7. les insécables de la typographie française : avant « : ; ? ! », « € », « % », dans les « », entre les milliers", () => {
    // L'accroche, le commanditaire et la raison du choix ne sont pas dans l'objet servi : la page
    // du chapitre les rend, et sa typographie est celle des pages (components/typographie.ts).
    const HORS_DE_L_OBJET = /^(accroche|commanditaire|entreprises\.pourquoi)/;
    const fautes = textesDuCoursServi()
      .filter((t) => !HORS_DE_L_OBJET.test(t.chemin))
      .flatMap((t) => espacesOrdinairesFautives(t.texte).map((x) => `${lieu(t)} ${x}`));
    expect(fautes.slice(0, 20)).toEqual([]);
  }, 240_000);

  it("8. le cours vouvoie l'élève : aucun tutoiement hors citation", () => {
    const fautes = textesDuCoursServi().flatMap((t) => tutoiements(t.texte).map((x) => `${lieu(t)} ${x}`));
    expect(fautes).toEqual([]);
  }, 240_000);

  it("9. le lexique que la maison n'emploie plus", () => {
    // Le seul reste figé : « ... » dans une étape de lire-le-compte-de-resultat (audit, G11).
    const EXCEPTIONS: Record<string, string> = { "... (…)": "lire-le-compte-de-resultat" };
    for (const { mot, re } of LEXIQUE_INTERDIT) {
      const fautes = textesDuCoursServi()
        .filter((t) => re.test(t.texte) && !(EXCEPTIONS[mot] && t.ou.startsWith(`${EXCEPTIONS[mot]} `)))
        .map((t) => `${lieu(t)} ${t.texte.match(re)![0]}`);
      expect(fautes, mot).toEqual([]);
    }
  }, 240_000);

  it("10. phrases de plus de 40 mots : un plafond figé, qui empêche d'en ajouter", () => {
    // Garde informative : les longues phrases du cours (« Ce que la simulation suppose : … »,
    // les synthèses d'examen) restent à mettre en liste ; le plafond est leur nombre au
    // 3 novembre 2026, il ne monte pas. Quand on en raccourcit, on l'abaisse.
    const PLAFOND = 331;
    expect(phrasesLongues(textesDuCoursServi().map((t) => t.texte)).size).toBeLessThanOrEqual(PLAFOND);
  }, 240_000);
});
