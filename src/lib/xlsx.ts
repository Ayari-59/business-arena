import ExcelJS from "exceljs";
import type { CelluleSpec, ClasseurSpec, Format, Style } from "@/config/ateliers/cockpit";

/**
 * Le rendu d'un classeur spécifié en fichier .xlsx.
 *
 * La spécification (feuilles, lignes, cellules à valeur ou à formule) est
 * pure et testée ailleurs ; ce module ne fait que la peindre : formats de
 * nombre à la française, cases de saisie en jaune, calculs en gris, titres
 * en gras. Il ne décide de rien.
 */

const FORMATS: Record<Format, string> = {
  euro: '#,##0 "€";-#,##0 "€"',
  unites: "#,##0",
  pct: "0 %",
  coef: "0.00",
  texte: "@",
};

const SAISIE = "FFFFF3B0";
const CALCUL = "FFE8EAEE";

function peindre(cell: ExcelJS.Cell, spec: CelluleSpec): void {
  if (spec.f) cell.value = { formula: spec.f };
  else if (spec.v !== undefined && spec.v !== null) cell.value = spec.v;
  if (spec.format && spec.format !== "texte") cell.numFmt = FORMATS[spec.format];
  const style: Style = spec.style ?? "normal";
  switch (style) {
    case "titre":
      cell.font = { bold: true, size: 14 };
      break;
    case "section":
      cell.font = { bold: true, color: { argb: "FF7A5F14" } };
      break;
    case "entete":
      cell.font = { bold: true };
      cell.border = { bottom: { style: "thin" } };
      cell.alignment = { horizontal: "center", wrapText: true };
      break;
    case "saisie":
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SAISIE } };
      cell.border = { top: { style: "hair" }, bottom: { style: "hair" }, left: { style: "hair" }, right: { style: "hair" } };
      break;
    case "calcul":
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CALCUL } };
      cell.font = { italic: true, color: { argb: "FF334155" } };
      break;
    case "note":
      cell.font = { italic: true, color: { argb: "FF64748B" } };
      cell.alignment = { wrapText: false };
      break;
    default:
      break;
  }
}

export async function rendreClasseur(spec: ClasseurSpec): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Business Arena";
  wb.created = new Date(0);
  wb.modified = new Date(0);
  for (const feuille of spec.feuilles) {
    const ws = wb.addWorksheet(feuille.nom, { views: [{ state: "frozen", xSplit: 1, ySplit: 0 }] });
    feuille.largeurs.forEach((largeur, i) => {
      ws.getColumn(i + 1).width = largeur;
    });
    feuille.lignes.forEach((ligne, r) => {
      ligne.forEach((cellule, c) => {
        if (cellule.v === undefined && cellule.f === undefined && !cellule.style) return;
        peindre(ws.getCell(r + 1, c + 1), cellule);
      });
    });
  }
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
