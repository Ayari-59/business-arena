import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LA FEUILLE DE DÉCISION N'EST PLUS UN FORMULAIRE D'ADMINISTRATION.
 *
 * Mesuré sur l'arène, sur ordinateur, avant d'y toucher : le prix — la décision
 * qui commande tout le tour — avait EXACTEMENT le champ d'une case facultative.
 * Même intitulé de 12 px en capitales grises, même cadre de 14 px que « Budget
 * RSE ». À côté, rien ne rappelait ce qu'on avait pratiqué au tour d'avant. Les
 * budgets se saisissaient un par un, leur somme n'apparaissant qu'au
 * récapitulatif de la dernière étape, c'est-à-dire après l'arbitrage. Et les
 * cinq options ponctuelles — assurance, études, commande, dividende,
 * trésorerie — étaient dépliées en permanence, à pousser le prix hors de
 * l'écran.
 *
 * Trois règles en sortent, et ce test les tient :
 *   1. LES DÉCISIONS MAJEURES D'ABORD, en grand, avec leur repère.
 *   2. LES BUDGETS GROUPÉS, avec leur total, lu du formulaire.
 *   3. LES OPTIONS PONCTUELLES REPLIÉES, et ce qu'elles portent annoncé.
 *
 * Et une règle de la charte : sur cette feuille, l'orange est au BOUTON de
 * l'étape. Un champ, un libellé, un repère ou une valeur ne le prennent jamais.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const FORMULAIRE = lire("components/decision-form.tsx");
const ENGAGEMENT = lire("components/engagement-du-tour.tsx");
const ARENE = lire("app/arena/[gameId]/page.tsx");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");

/** Le code, sans les commentaires : eux racontent ce qu'il y avait avant. */
const codeDe = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("les décisions majeures passent devant", () => {
  it("les ventes estimées, le prix et le volume sont majeurs, le reste non", () => {
    // `majeur` n'est pas un réglage d'apparence qu'on saupoudre : s'il est sur
    // tout, il n'est sur rien. TROIS champs en mono-produit, pas plus — les
    // ventes estimées ont rejoint le prix et le volume, parce qu'elles sont la
    // PREMIÈRE question du tour (« combien pensez-vous vendre ? ») et qu'elles
    // commandent la lecture des deux autres. Elles prennent donc leur
    // grammaire, sans la diluer.
    expect(FORMULAIRE).toContain("function ChampMajeur(");
    const majeurs = FORMULAIRE.match(/\bmajeur$/gm) ?? [];
    expect(
      majeurs.length,
      "trois champs majeurs : les ventes estimées, le prix et le volume",
    ).toBe(3);
    for (const champ of ['name="price"', 'name="productionPlan"']) {
      const i = FORMULAIRE.indexOf(`<Field ${champ}`);
      expect(i, `${champ} introuvable`).toBeGreaterThan(-1);
      const balise = FORMULAIRE.slice(i, FORMULAIRE.indexOf("/>", i));
      expect(balise, `${champ} n'est pas un champ majeur`).toContain("majeur");
    }
    // Le champ des ventes estimées porte un nom CONSTRUIT (la référence) : on
    // le reconnaît à son helper, et il est majeur comme les deux autres. La
    // recherche part du nom et REMONTE à sa balise : l'indentation du fichier
    // ne doit pas décider si la garde tient.
    const nom = FORMULAIRE.indexOf("name={champDesVentesEstimees(codeMonoProduit)}");
    expect(nom, "le champ mono des ventes estimées introuvable").toBeGreaterThan(-1);
    const balise = FORMULAIRE.lastIndexOf("<Field", nom);
    expect(FORMULAIRE.slice(balise, FORMULAIRE.indexOf("/>", nom))).toContain("majeur");
  });

  it("les ventes estimées viennent AVANT le prix et le volume", () => {
    // L'ordre de la feuille est l'ordre du raisonnement : ce qu'on croit
    // vendre, puis le prix et le volume qui s'y accordent. L'inverse — poser le
    // volume puis demander ce qu'on vendra — faisait de l'estimation un
    // contrôle après coup.
    const estime = FORMULAIRE.indexOf("name={champDesVentesEstimees(codeMonoProduit)}");
    const prix = FORMULAIRE.indexOf('<Field name="price"');
    const volume = FORMULAIRE.indexOf('<Field name="productionPlan"');
    expect(estime).toBeGreaterThan(-1);
    expect(estime).toBeLessThan(prix);
    expect(estime).toBeLessThan(volume);
    // En gamme, la ligne « Ventes estimées » précède celle du prix dans la
    // matrice des références.
    const ligneEstimee = FORMULAIRE.indexOf('cle: "ventesEstimees"');
    const lignePrix = FORMULAIRE.indexOf('cle: "price"');
    expect(ligneEstimee).toBeGreaterThan(-1);
    expect(ligneEstimee).toBeLessThan(lignePrix);
  });

  it("le chiffre d'un champ majeur est entre 24 et 32 px, et tabulaire", () => {
    const bloc = FORMULAIRE.slice(
      FORMULAIRE.indexOf("function ChampMajeur("),
      FORMULAIRE.indexOf("function Field("),
    );
    // text-3xl = 30 px. Un chiffre de décision ne se lit pas en 14.
    expect(bloc).toMatch(/text-3xl/);
    expect(bloc).toContain("tabular-nums");
    // L'intitulé passe à l'encre, en lettres ordinaires : plus de capitales
    // grises de 12 px au-dessus de la décision n°1.
    // (Lot 6E : un cran plus fort encore, slate-50, pour un champ modifiable.)
    expect(bloc).toMatch(/text-base font-semibold text-slate-50/);
    expect(bloc).not.toMatch(/uppercase/);
  });

  it("en gamme, le prix et le volume de chaque référence se lisent en 24 px", () => {
    expect(FORMULAIRE).toMatch(
      /const majeur = \(nom: string\) => nom === "price" \|\| nom === "productionPlan"/,
    );
    expect(FORMULAIRE).toMatch(/majeur\(nom\) \? "text-2xl font-bold text-slate-50"/);
    // Et leur intitulé de ligne passe à l'encre dans la matrice.
    expect(FORMULAIRE).toMatch(
      /l\.majeure\s*\n?\s*\?\s*"py-1\.5 pr-2 text-left align-middle text-sm font-semibold/,
    );
  });
});

describe("le repère du tour passé est une donnée, et il ne s'invente pas", () => {
  it("il vient de la vue de partie : historique des ventes, résultat par référence", () => {
    // Aucun chiffre écrit à la main : le prix pratiqué et le volume vendu sont
    // ceux que la partie a enregistrés.
    expect(ARENE).toContain("view.salesHistory.rounds.at(-1)");
    expect(ARENE).toMatch(/tourPasse:\s*\(\(\) => \{/);
    expect(ARENE).toContain("tourPasseParReference");
    // Les repères servent aussi sur ordinateur : ils étaient servis au seul
    // téléphone, alors que le défaut était sur ordinateur.
    expect(ARENE).not.toMatch(/reperes=\{\s*telephone\s*\?/);
  });

  it("au premier tour il n'y a rien à rappeler : la ligne ne paraît pas", () => {
    // Jamais « 0 € pratiqué » : le repère est `undefined` sans tour résolu, et
    // le composant ne rend alors aucune ligne.
    expect(FORMULAIRE).toMatch(/tourPasse && tourPasse\.prix !== null/);
    expect(FORMULAIRE).toMatch(/tourPasse && tourPasse\.volume !== null/);
    expect(FORMULAIRE).toMatch(/\{repere \? \(/);
  });

  it("c'est de la donnée : bleu donnée, ni vert ni rouge, jamais l'orange", () => {
    const reperes = [...FORMULAIRE.matchAll(/data-repere-du-tour-passe[\s\S]{0,180}/g)].map(
      (m) => m[0],
    );
    expect(reperes.length, "les deux repères : mono-produit et gamme").toBeGreaterThanOrEqual(2);
    for (const r of reperes) {
      expect(r, `repère sans la teinte de donnée : ${r.slice(0, 90)}`).toContain(
        "text-[var(--donnee)]",
      );
      expect(r).not.toMatch(/text-(?:amber|emerald|red|rose)-\d/);
    }
  });
});

describe("les budgets sont groupés, avec leur total", () => {
  it("le total vient d'engagement-du-tour, lu sur le formulaire", () => {
    expect(FORMULAIRE).toContain("function TotalDesBudgets(");
    expect(FORMULAIRE).toContain("{formatEuro(engagement.total)}");
    // Deux emplacements : les budgets du tour (mono) et ceux de l'entreprise (gamme).
    expect((FORMULAIRE.match(/<TotalDesBudgets engagement=\{engagement\} \/>/g) ?? []).length).toBe(
      2,
    );
  });

  it("sur ordinateur, l'engagement est relu à chaque frappe et dès l'arrivée", () => {
    // Sans quoi le total resterait vide jusqu'à la première modification, et un
    // repli annoncerait « aucune » alors qu'une valeur reconduite l'habite.
    expect(FORMULAIRE).toContain("if (derniere || !modeCartes) relireLEngagement();");
    expect(FORMULAIRE).toMatch(
      /useEffect\(\(\) => \{\s*\n?\s*if \(!modeCartes\) relireLEngagement\(\);/,
    );
  });
});

describe("les options ponctuelles sont repliées, et elles le disent", () => {
  const OPTIONS = ["commande", "assurance", "etudes", "dividende", "mobilisation"];

  it("chacune prend le repli du lot 3B, fermé, avec ce qu'elle porte", () => {
    // Lot P5 : le formulaire importe aussi le chevron commun des replis.
    expect(FORMULAIRE).toMatch(/import \{ Chevron, Repliable \} from "@\/components\/repliable"/);
    const famille = FORMULAIRE.slice(
      FORMULAIRE.indexOf("function Family("),
      FORMULAIRE.indexOf("export function DecisionForm("),
    );
    expect(famille).toContain("<Repliable");
    // `Repliable` est fermé par défaut. LOT 6D, décision du propriétaire : un
    // volet qui est le seul contenu décisionnel de son étape (trésorerie,
    // assurance, information, dividende) arrive ouvert, par `deplie`, faux par
    // défaut ; aucune autre ouverture n'est passée (voir volets-deplies.test.ts).
    expect(famille).toMatch(/deplie = false,/);
    const ouvertures = [...famille.matchAll(/<Repliable[\s\S]{0,400}?ouvert=\{([^}]*)\}/g)].map(
      (m) => m[1],
    );
    expect(ouvertures).toEqual(["deplie"]);
    for (const cle of OPTIONS) {
      expect(FORMULAIRE, `option « ${cle} » non repliée`).toContain(`quoiDeLOption("${cle}")`);
    }
  });

  it("le compte des options est annoncé sur le résumé d'engagement", () => {
    expect(ENGAGEMENT).toContain("lireLesOptionsPonctuelles");
    expect(ENGAGEMENT).toContain("Options ponctuelles");
    expect(ENGAGEMENT).toMatch(/engagée\$\{options\.length > 1 \? "s" : ""\}/);
  });

  it("une option repliée qui ne porte rien le dit, plutôt que de se taire", () => {
    expect(FORMULAIRE).toMatch(/if \(dedans\.length === 0\) return "aucune";/);
  });

  it("la commande exceptionnelle ne passe plus devant le prix", () => {
    // Elle ouvrait l'étape « Vendre » : la première chose qu'on lisait sur la
    // feuille était une option qu'on refuse neuf fois sur dix.
    const etape = FORMULAIRE.slice(FORMULAIRE.indexOf('data-etape={idx("vendre")}'));
    const commande = etape.indexOf('carte="commande"');
    const ventes = etape.indexOf('carte={["prix", "volume"]}');
    const references = etape.indexOf("<GammeReference");
    expect(commande).toBeGreaterThan(-1);
    expect(commande, "la commande vient après le prix et le volume").toBeGreaterThan(ventes);
    expect(commande, "la commande vient après les références de la gamme").toBeGreaterThan(
      references,
    );
  });
});

describe("sur la feuille, l'orange est au bouton de l'étape", () => {
  /*
   * LOT 6E, CHANGEMENT DE CHARTE. Cette garde vérifiait que l'étape courante
   * portait un « filet orange plein » : l'orange disait alors aussi « où je
   * suis ». Il ne dit plus que l'action ; la navigation passe à la teinte du
   * métier. La garde est DÉPLACÉE, pas desserrée : elle exige la piste à la
   * teinte du métier, et refuse tout orange sur l'étape en cours.
   */
  it("l'étape courante est une position : la piste s'allume à la teinte du métier, jamais à l'orange", () => {
    const code = codeDe(FORMULAIRE);
    const piste = code.slice(
      code.indexOf('aria-label="Étapes de décision"'),
      code.indexOf('data-etape={idx("vendre")}'),
    );
    expect(piste).toContain("piste-segment");
    expect(piste).toMatch(/data-etat=\{actif \? "courante" : fait \? "parcourue" : "a-venir"\}/);
    expect(piste).toContain("var(--metier");
    expect(piste, "l'étape en cours ne lit plus l'orange").not.toMatch(/amber|accent-plein|orange/);
    expect(code, "plus d'aplat dilué d'orange sur l'onglet d'étape").not.toContain(
      "bg-amber-400/10 text-amber-200",
    );
    // La piste s'allume au métier, dans la feuille : « parcourue » et « courante ».
    expect(CSS).toMatch(/\.piste-segment\[data-etat="parcourue"\] \{\s*background-color: var\(--metier/);
    expect(CSS).toMatch(/\.piste-segment\[data-etat="courante"\] \{[^}]*var\(--metier/);
  });

  it("le compteur de la piste compte les étapes PARCOURUES, pas des étapes « décidées »", () => {
    // Toutes les décisions ont une valeur proposée : « 5 / 7 décidées » mentirait.
    const code = codeDe(FORMULAIRE);
    expect(code).toMatch(/\{vues\.size\}<\/strong> \/ \{total\}/);
    expect(code).toContain("parcourue{vues.size > 1");
    expect(code).not.toMatch(/décidées?\b[^"]*\/ ?\{total\}/);
  });

  it("« Suivant » dit où il mène, et « Valider et simuler » est le grand bouton orange", () => {
    const code = codeDe(FORMULAIRE);
    expect(code).toMatch(/`Suivant\$\{etapesVisibles\[courante \+ 1\] \? ` : \$\{META\[etapesVisibles\[courante \+ 1\]!\]!\.titre\}` : ""\}`/);
    // Avancer : plein mais neutre, jamais l'aplat orange.
    const suivant = code.slice(code.indexOf('key="suivant"'), code.indexOf('key="suivant"') + 900);
    expect(code).toMatch(/bouton\(\{ variante: "secondaire", taille: "l" \}\)\} bouton-suite active:scale/);
    // Valider : le grand bouton plein.
    expect(code).toMatch(/aplat\(`\$\{bouton\(\{ taille: "l" \}\)\} bouton-valider`\)/);
    expect(suivant).not.toContain("bouton-valider");
  });

  it("aucune valeur chiffrée de la feuille n'est en orange", () => {
    const code = codeDe(FORMULAIRE) + codeDe(ENGAGEMENT);
    // `text-amber-200/300` étaient portés par le total des budgets, la marge par
    // unité et le chiffrage d'un financement : ce sont des valeurs, donc de
    // l'information (charte : « une valeur chiffrée n'est jamais l'orange »).
    const fautes = code.match(/text-amber-(?:200|300)\b[^"`]*/g) ?? [];
    expect(fautes, `valeurs en orange : ${fautes.join(" · ")}`).toEqual([]);
  });

  it("le résumé d'engagement est une information, pas une action", () => {
    expect(ENGAGEMENT).toContain("encadre-neutre");
    expect(codeDe(ENGAGEMENT)).not.toMatch(/bg-amber-400\/5|border-amber-400\/25/);
  });
});

describe("un repli fermé n'est pas vide : il est rangé", () => {
  it("l'option ponctuelle garde un bord plein, et se marque ouverte", () => {
    expect(CSS).toContain(".option-ponctuelle[open]");
    const bloc = CSS.slice(CSS.indexOf(".option-ponctuelle[open]"));
    expect(bloc.slice(0, bloc.indexOf("}"))).not.toContain("dashed");
  });
});
