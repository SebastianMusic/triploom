import * as XLSX from "npm:xlsx";

export function jsonToSpreadsheetBase64(
	data: Record<string, unknown>[],
	sheetName = "Sheet1",
): string {
	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, sheetName);
	return XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
}
