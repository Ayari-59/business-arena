import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ATELIERS } from "../src/config/ateliers";
import { formationParCode, publicDeLAtelier } from "../src/config/formations";
import {
  ECARTES,
  blocsAtteints,
  blocsDeLaFormation,
  correspondanceDeLaFormation,
  formationsAdossees,
  gestesDeLAtelier,
} from "../src/config/correspondance";

/**
 * LE RAPPORT DE LA CORRESPONDANCE : ce que la déduction donne, et par où
 * commencer à élaguer.
 *
 *   npx tsx scripts/correspondance-referentiels.ts            (afficher)
 *   npx tsx scripts/correspondance-referentiels.ts --ecrire   (mettre docs/ à jour)
 */

export const DESTINATION = join("docs", "correspondance-referentiels.md");

/** Le sigle d'une formation, ou son code si le registre ne la connaît pas. */
const sigle = (code: string) => formationParCode(code)?.sigle ?? code;

export function rapportDeCorrespondance(): string {
  const diplomes = formationsAdossees();
  const tous = [...diplomes.keys()].flatMap((d) =>
    correspondanceDeLaFormation(d).map((l) => ({ ...l, diplome: d })),
  );
  const parAmbiguite = new Map<number, number>();
  for (const l of tous) {
    parAmbiguite.set(
      l.blocsDeLaSeance,
      (parAmbiguite.get(l.blocsDeLaSeance) ?? 0) + 1,
    );
  }

  const l: string[] = [];
  l.push("# Correspondance geste ↔ référentiel — déduite, à élaguer");
  l.push("");
  l.push(
    "Engendré par `npx tsx scripts/correspondance-referentiels.ts --ecrire`.",
  );
  l.push(
    "Ne pas le corriger à la main : il se réécrit depuis `src/config/correspondance.ts`.",
  );
  l.push("");
  l.push(
    "Aucune ligne n'a été écrite. Une séance nomme déjà les blocs du référentiel qu'elle",
    "mobilise et, depuis le socle, les gestes qu'elle fait travailler : leur coexistence",
    "dans une même séance est le lien. Rien n'est branché, ni les ateliers ni la page des",
    "parcours.",
    "",
  );
  l.push(`| | |`, `| --- | --- |`);
  l.push(`| formations | ${diplomes.size} |`);
  l.push(`| liens déduits | ${tous.length} |`);
  l.push(`| liens écartés à la main | ${ECARTES.length} |`);
  l.push("");

  l.push("## Par où élaguer", "");
  l.push(
    "Un lien est un CANDIDAT : deux choses présentes dans la même séance ne se servent pas",
    "forcément l'une l'autre. Compter les séances témoins ne trie rien, car chaque séance",
    "est une combinaison unique et la plupart des liens n'en ont qu'une. Ce qui trie, c'est",
    "le nombre de blocs que nommait cette séance : si elle n'en nommait qu'un, tout ce",
    "qu'elle fait travailler sert ce bloc sans discussion ; si elle en nommait quatre, le",
    "geste en sert un ou deux et la coexistence ne dit pas lesquels.",
    "",
    "Le tri reste modeste, et il faut le savoir avant de s'y fier : la grande masse vient de",
    "séances à deux blocs, donc à une chance sur deux.",
    "",
  );
  l.push(
    "| blocs nommés par la meilleure séance témoin | liens | ce que ça vaut |",
  );
  l.push("| --- | --- | --- |");
  const valeur: Record<number, string> = {
    1: "certain : la séance ne nommait que ce bloc",
    2: "une chance sur deux",
    3: "une chance sur trois",
    4: "une chance sur quatre, à relire en premier",
  };
  for (const n of [...parAmbiguite.keys()].sort((a, b) => a - b)) {
    l.push(`| ${n} | ${parAmbiguite.get(n)} | ${valeur[n] ?? "à relire"} |`);
  }
  l.push("");

  const faibles = tous.filter((x) => x.blocsDeLaSeance >= 3);
  l.push(`### Les ${faibles.length} liens les plus douteux`, "");
  for (const x of faibles) {
    l.push(
      `- **${sigle(x.diplome)}** · \`${x.geste}\` → ${x.referentiel} ` +
        `*(séance ${x.temoins.join(", ")}, qui nommait ${x.blocsDeLaSeance} blocs)*`,
    );
  }
  l.push("");

  l.push("## Ce que la table ouvrirait", "");
  l.push(
    "Aujourd'hui un atelier sert un diplôme et un seul, parce que ses séances nomment les",
    "blocs dans le vocabulaire de ce diplôme. Avec la table, un atelier atteint tout",
    "diplôme dont les blocs sont liés aux gestes qu'il travaille. ATTEINDRE N'EST PAS",
    "COUVRIR : un bloc est atteint dès qu'un seul geste le touche, c'est un plancher.",
    "",
  );
  l.push("| atelier | ses formations | ce qu'il atteindrait ailleurs |");
  l.push("| --- | --- | --- |");
  for (const a of ATELIERS) {
    const mes = gestesDeLAtelier(a.code);
    const ailleurs = [...diplomes.keys()]
      .filter((d) => !a.formations.includes(d))
      .map((d) => ({
        d,
        n: blocsAtteints(mes, d).length,
        t: blocsDeLaFormation(d).length,
      }))
      .filter((x) => x.n > 0)
      .sort((x, y) => y.n / y.t - x.n / x.t)
      .map((x) => `${sigle(x.d)} ${x.n}/${x.t}`);
    l.push(
      `| ${a.titre} | ${publicDeLAtelier(a) || "aucune"} | ${ailleurs.join(" · ") || "rien"} |`,
    );
  }
  l.push("");

  if (ECARTES.length) {
    l.push(`## Liens écartés à la main (${ECARTES.length})`, "");
    for (const e of ECARTES) {
      l.push(
        `- **${sigle(e.formation)}** · \`${e.geste}\` → ${e.referentiel}`,
        `  ${e.raison}`,
      );
    }
    l.push("");
  }

  l.push("## La table, diplôme par diplôme", "");
  for (const [diplome] of diplomes) {
    l.push(`### ${formationParCode(diplome)?.nom ?? diplome}`, "");
    const liens = correspondanceDeLaFormation(diplome);
    for (const bloc of blocsDeLaFormation(diplome)) {
      const siens = liens.filter((x) => x.referentiel === bloc);
      l.push(`#### ${bloc}`, "", `${siens.length} gestes liés.`, "");
      for (const x of siens) {
        l.push(
          `- \`${x.geste}\` *(${x.temoins.join(", ")} ; ${x.blocsDeLaSeance} blocs nommés)*`,
        );
      }
      l.push("");
    }
  }
  return l.join("\n");
}

if (process.argv[1]?.endsWith("correspondance-referentiels.ts")) {
  const rapport = rapportDeCorrespondance();
  if (process.argv.includes("--ecrire")) {
    writeFileSync(DESTINATION, `${rapport}\n`, "utf8");
    console.log(`écrit : ${DESTINATION}`);
  } else {
    console.log(rapport);
  }
}
