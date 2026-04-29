import type { BulkDuplicateStrategy, BulkTemplateDownload, BulkUploadResult, ServiceResponse } from "../types";
import { ApiError } from "../types";
import { apiClient } from "../client";
import { normalizeApiError } from "../utils/errorHandler";
import { performRequest } from "../utils/request";
import { createErrorResponse, createSuccessResponse } from "../utils/serviceResponse";

const BULK_ENDPOINT = "/api/bulk";
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function extractFileName(contentDisposition?: string, fallbackFileName = "bulk-template.xlsx"): string {
  if (!contentDisposition) {
    return fallbackFileName;
  }

  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);
  if (!match?.[1]) {
    return fallbackFileName;
  }

  return decodeURIComponent(match[1].replace(/"/g, "").trim());
}

async function downloadTemplate(
  resource: "persons" | "rooms",
  fallbackFileName: string,
): Promise<ServiceResponse<BulkTemplateDownload>> {
  try {
    const response = await apiClient.get<Blob>(`${BULK_ENDPOINT}/${resource}/template`, {
      responseType: "blob",
      timeout: 60000,
      headers: {
        Accept: XLSX_CONTENT_TYPE,
      },
    });

    return createSuccessResponse({
      blob: response.data,
      fileName: extractFileName(response.headers["content-disposition"], fallbackFileName),
    });
  } catch (error) {
    const apiError = error instanceof ApiError ? error : normalizeApiError(error);
    return createErrorResponse(apiError);
  }
}

async function uploadFile(
  resource: "persons" | "rooms",
  file: File,
  duplicateStrategy: BulkDuplicateStrategy,
): Promise<ServiceResponse<BulkUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);

  return performRequest<BulkUploadResult>(
    {
      url: `${BULK_ENDPOINT}/${resource}/upload`,
      method: "POST",
      params: {
        duplicateStrategy,
      },
      data: formData,
      timeout: 120000,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    },
  );
}

async function uploadPersons(file: File, duplicateStrategy: BulkDuplicateStrategy): Promise<ServiceResponse<BulkUploadResult>> {
  return uploadFile("persons", file, duplicateStrategy);
}

async function uploadRooms(file: File, duplicateStrategy: BulkDuplicateStrategy): Promise<ServiceResponse<BulkUploadResult>> {
  return uploadFile("rooms", file, duplicateStrategy);
}

async function downloadPersonsTemplate(): Promise<ServiceResponse<BulkTemplateDownload>> {
  return downloadTemplate("persons", "persons-bulk-upload-template.xlsx");
}

async function downloadRoomsTemplate(): Promise<ServiceResponse<BulkTemplateDownload>> {
  return downloadTemplate("rooms", "rooms-bulk-upload-template.xlsx");
}

export const bulkUploadService = {
  uploadPersons,
  uploadRooms,
  downloadPersonsTemplate,
  downloadRoomsTemplate,
};