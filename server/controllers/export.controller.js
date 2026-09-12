import { buildActivityReport, generateXlsxBuffer, generatePdfBuffer } from "../services/export.service.js";

export async function getExport(req, res) {
  try {
    const report = await buildActivityReport(req.query);

    if (report.format === "xlsx") {
      const buffer = generateXlsxBuffer(report);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${report.filenameBase}.xlsx"`);
      return res.send(buffer);
    }

    const buffer = await generatePdfBuffer(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${report.filenameBase}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error("Activity export error:", error);
    if (!res.headersSent) {
      res.status(error.status || 500).json({ message: error.status ? error.message : "Could not export resort activities." });
    }
  }
}
