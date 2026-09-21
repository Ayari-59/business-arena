import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { DIFFICULTY_PRESETS, QUIZ_MODES } from "@/config/difficulty";
import { MISSED_POLICY_LABELS, MISSED_POLICY_HELP } from "@/config/missed-situation";
import { BPI_V2_DIMENSIONS, V2_DIMENSION_LABELS, scoringWeightsV2 } from "@/scoring/bpi";
import { champsOuverts } from "@/config/duree-du-tour";
import { manuel, type FaitsDuManuel } from "@/config/manuel";

const ref = SCENARIOS[0]!;
const poids = scoringWeightsV2(ref.scenario.scoring);
const hints = ref.situations[0]?.hints ?? [];

const faits: FaitsDuManuel = {
  scenarios: SCENARIOS.map((s) => ({ nom: s.shortName ?? s.title, secteur: SECTOR_LABELS[s.sector], accroche: s.tagline })),
  niveaux: DIFFICULTY_PRESETS.map((p) => ({ rang: p.level, nom: p.name, accroche: p.tagline, champs: champsOuverts(p.decisions) })),
  dimensions: BPI_V2_DIMENSIONS.map((d) => ({ nom: V2_DIMENSION_LABELS[d], poids: poids[d] })),
  scenarioDesPoids: ref.shortName ?? ref.title,
  modesDeQuestions: QUIZ_MODES.map((m) => ({ nom: m.name, aide: m.help })),
  situationsManquees: (Object.keys(MISSED_POLICY_LABELS) as (keyof typeof MISSED_POLICY_LABELS)[]).map((k) => ({ nom: MISSED_POLICY_LABELS[k], aide: MISSED_POLICY_HELP[k] })),
  scoreRestantParIndice: hints.map((_, i) => Math.max(0.2, 1 - hints.slice(0, i + 1).reduce((t, h) => t + h.costRatio, 0))),
  adresse: "www.business-arena.fr/join",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

describe("capture", () => {
  it("écrit", () => {
    const chapitres = manuel(faits);
    const bloc = (b: ReturnType<typeof manuel>[0]["blocs"][0]) => {
      if (b.type === "texte") return `<p class="bloc">${esc(b.texte ?? "")}</p>`;
      if (b.type === "encadre") return `<div class="encadre"><b>${esc(b.titre ?? "")}</b> ${esc(b.texte ?? "")}</div>`;
      if (b.type === "liste") return `${b.titre ? `<p class="bloc-titre">${esc(b.titre)}</p>` : ""}<ul>${(b.items ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      return `<p class="bloc-titre">${esc(b.titre ?? "")}</p><table><thead><tr>${(b.colonnes ?? []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${(b.lignes ?? []).map((l) => `<tr>${l.map((c, i) => `<td${i === 0 ? ' class="p"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    };
    const corps = chapitres
      .map((c, i) => `<section><h2>${i + 1}. ${esc(c.titre)}</h2><p class="chapeau">${esc(c.chapeau)}</p>${c.blocs.map(bloc).join("")}</section>`)
      .join("");
    writeFileSync(
      "/tmp/man/page.html",
      `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
      body{margin:0;background:#fff;color:#0f172a;font-family:system-ui,sans-serif}
      .manuel{max-width:180mm;margin:0 auto;padding:14mm 16mm}
      h1{font-size:24pt;line-height:1.1;margin:4px 0 0}
      .kicker{font-size:8.5pt;letter-spacing:.2em;text-transform:uppercase;margin:0;color:#b45309}
      .chapeau-doc{font-size:10.5pt;line-height:1.55;margin:8px 0 0;color:#475569}
      .sommaire{margin-top:8mm;font-size:10pt;line-height:1.7;color:#334155}
      section{margin-top:9mm}
      h2{font-size:14pt;margin:0}
      .chapeau{font-size:9.5pt;line-height:1.5;margin:2mm 0 0;color:#64748b}
      p.bloc{font-size:10pt;line-height:1.55;margin:3.5mm 0 0;color:#334155}
      .bloc-titre{font-size:9pt;letter-spacing:.1em;text-transform:uppercase;margin:5mm 0 1.5mm;color:#64748b}
      ul{margin:2mm 0 0;padding-left:5mm;font-size:10pt;line-height:1.5;color:#334155}
      li{margin-top:1.8mm}
      table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-top:1mm}
      th{text-align:left;font-size:8.5pt;text-transform:uppercase;letter-spacing:.06em;padding:1.5mm 2mm 1.5mm 0;color:#64748b;border-bottom:1px solid #cbd5e1}
      td{padding:1.6mm 2mm 1.6mm 0;vertical-align:top;line-height:1.4;color:#334155;border-bottom:1px solid #e2e8f0}
      td.p{font-weight:500;color:#0f172a}
      .encadre{margin-top:4mm;padding:3mm 4mm;font-size:9.5pt;line-height:1.5;border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;color:#334155}
      </style></head><body><article class="manuel">
      <p class="kicker">Business Arena</p><h1>Manuel de l'enseignant</h1>
      <p class="chapeau-doc">Tout ce qu'il faut savoir avant la première séance, et le recours quand quelque chose se passe mal. Les listes, les niveaux, les poids de l'indice et les barèmes de ce manuel sont lus de l'application au moment où vous l'imprimez.</p>
      <nav class="sommaire"><ol>${chapitres.map((c) => `<li>${esc(c.titre)}</li>`).join("")}</ol></nav>
      ${corps}</article></body></html>`,
    );
  });
});
