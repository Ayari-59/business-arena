import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ATELIERS } from "../src/config/ateliers";
import { GESTES, SOCLE } from "../src/config/competences";

/**
 * LE RAPPORT DU SOCLE : ce qu'il rassemble, et ce qu'il a laissé dehors.
 *
 * Un socle se juge sur ce qu'il OUBLIE, pas sur ce qu'il contient. Une phrase
 * d'atelier qu'aucun geste ne reprend est une compétence qui disparaîtrait à
 * la migration sans que rien ne le signale : c'est la seule faute qui coûte
 * vraiment quelque chose, donc elle vient en premier.
 *
 * LE RAPPORT EST ÉCRIT, PAS SEULEMENT AFFICHÉ. Un socle s'arbitre à plusieurs,
 * en lisant côte à côte l'énoncé proposé et les phrases qu'il remplace ; cela
 * ne se fait pas dans un terminal. Il est donc engendré dans docs/, et un test
 * vérifie qu'il n'a pas vieilli — un rapport périmé dirait le contraire de la
 * donnée, ce qui est pire que pas de rapport.
 *
 *   npx tsx scripts/socle-des-competences.ts            (afficher)
 *   npx tsx scripts/socle-des-competences.ts --ecrire   (mettre docs/ à jour)
 */

export const DESTINATION = join("docs", "socle-des-competences.md");

type Phrase = { cle: string; texte: string };

function corpus(): Map<string, Phrase> {
  const m = new Map<string, Phrase>();
  for (const a of ATELIERS) {
    for (const s of a.seances) {
      s.competences.forEach((texte, i) => {
        const cle = `${a.code}:${s.numero}:${i}`;
        m.set(cle, { cle, texte });
      });
    }
  }
  return m;
}

export function rapportDuSocle(): string {
  const PAR_CLE = corpus();
  const pris = new Map<string, string[]>();
  for (const g of GESTES)
    for (const o of g.origines) pris.set(o, [...(pris.get(o) ?? []), g.code]);

  const introuvables = [...pris.keys()].filter((c) => !PAR_CLE.has(c));
  const doubles = [...pris.entries()].filter(([, g]) => g.length > 1);
  const oubliees = [...PAR_CLE.values()].filter((p) => !pris.has(p.cle));
  const diplomeDe = new Map(ATELIERS.map((a) => [a.code, a.diplome]));

  const l: string[] = [];
  l.push("# Socle de compétences — proposition à arbitrer");
  l.push("");
  l.push("Engendré par `npx tsx scripts/socle-des-competences.ts --ecrire`.");
  l.push(
    "Ne pas le corriger à la main : il se réécrit depuis `src/config/competences.ts`.",
  );
  l.push("");
  l.push("| | |");
  l.push("| --- | --- |");
  l.push(`| familles | ${SOCLE.length} |`);
  l.push(`| gestes | ${GESTES.length} |`);
  l.push(
    `| phrases d'atelier | ${PAR_CLE.size} dans ${ATELIERS.length} ateliers |`,
  );
  l.push(`| reprises par un geste | ${PAR_CLE.size - oubliees.length} |`);
  l.push(`| laissées de côté | ${oubliees.length} |`);
  l.push("");

  if (introuvables.length) {
    l.push(`## Coordonnées qui ne désignent rien (${introuvables.length})`, "");
    for (const c of introuvables) l.push(`- \`${c}\``);
    l.push("");
  }
  if (doubles.length) {
    l.push(`## Phrases reprises par deux gestes (${doubles.length})`, "");
    for (const [c, g] of doubles) l.push(`- \`${c}\` → ${g.join(", ")}`);
    l.push("");
  }
  if (oubliees.length) {
    l.push(`## Phrases qu'aucun geste ne reprend (${oubliees.length})`, "");
    for (const p of oubliees) l.push(`- \`${p.cle}\` ${p.texte}`);
    l.push("");
  }

  const doutes = GESTES.filter((g) => g.doute);
  if (doutes.length) {
    l.push(
      `## Là où le regroupement demande un arbitrage (${doutes.length})`,
      "",
    );
    l.push(
      "Un indice de ressemblance lexicale a été essayé, puis retiré : il signalait quarante",
      "gestes sur soixante-treize, dont des regroupements manifestement justes — « rayon vide »",
      "et « surstock » ne partagent aucun mot et désignent le même acte. Il mesurait le",
      "vocabulaire, pas le sens. Restent les doutes écrits à la main, qui sont les seuls",
      "endroits où un arbitrage est demandé.",
      "",
    );
    for (const g of doutes) {
      l.push(`### \`${g.code}\``, "", g.doute!, "");
      for (const o of g.origines)
        l.push(`- \`${o}\` ${PAR_CLE.get(o)?.texte ?? "— introuvable —"}`);
      l.push("");
    }
  }

  const arbitres = GESTES.filter((g) => g.arbitrage);
  if (arbitres.length) {
    l.push(`## Ce qui a été tranché, et pourquoi (${arbitres.length})`, "");
    l.push(
      "Ces phrases auraient pu fonder un geste à elles seules. Elles sont restées dans un",
      "geste plus large, et le choix est écrit : sans trace, la question se reposera dans six",
      "mois et sera tranchée dans l'autre sens, sans que personne ne sache qu'elle avait déjà",
      "été examinée.",
      "",
    );
    for (const g of arbitres) {
      l.push(`### \`${g.code}\``, "", g.arbitrage!, "");
      for (const o of g.origines)
        l.push(`- \`${o}\` ${PAR_CLE.get(o)?.texte ?? "— introuvable —"}`);
      l.push("");
    }
  }

  l.push("## Le socle, famille par famille", "");
  for (const f of SOCLE) {
    l.push(`### ${f.nom}`, "", `*${f.propos}*`, "");
    for (const g of f.gestes) {
      const dips = new Set(
        g.origines.map((o) => diplomeDe.get(o.split(":")[0]!)).filter(Boolean),
      );
      l.push(`#### \`${g.code}\``, "");
      l.push(`> ${g.enonce}`, "");
      l.push(`${g.origines.length} phrases, ${dips.size} diplômes.`, "");
      for (const o of g.origines) {
        l.push(`- \`${o}\` ${PAR_CLE.get(o)?.texte ?? "— introuvable —"}`);
      }
      l.push("");
    }
  }
  return l.join("\n");
}

if (process.argv[1]?.endsWith("socle-des-competences.ts")) {
  const rapport = rapportDuSocle();
  if (process.argv.includes("--ecrire")) {
    writeFileSync(DESTINATION, `${rapport}\n`, "utf8");
    console.log(`écrit : ${DESTINATION}`);
  } else {
    console.log(rapport);
  }
}
