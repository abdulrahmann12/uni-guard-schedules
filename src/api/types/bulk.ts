export type BulkDuplicateStrategy = "AUTO_RENAME" | "SKIP_DUPLICATES";

export interface BulkUploadError {
  row: number;
  message: string;
}

export interface BulkUploadResult {
  successCount: number;
  failedCount: number;
  errors: BulkUploadError[];
}

export interface BulkTemplateDownload {
  blob: Blob;
  fileName: string;
}