declare module "write-excel-file" {
  export type Row = Array<{
    value?: string | number | boolean | Date | null;
    type?: Function;
    fontWeight?: "normal" | "bold";
  }>;

  export interface Workbook {
    toBlob(): Promise<Blob>;
  }

  function writeXlsxFile(rows: unknown[]): Workbook;
  export default writeXlsxFile;
}

declare module "write-excel-file/browser" {
  export type Row = Array<{
    value?: string | number | boolean | Date | null;
    type?: Function;
    fontWeight?: "normal" | "bold";
  }>;

  export interface Workbook {
    toBlob(): Promise<Blob>;
  }

  function writeXlsxFile(rows: unknown[]): Workbook;
  export default writeXlsxFile;
}
