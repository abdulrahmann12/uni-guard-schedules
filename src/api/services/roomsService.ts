import type {
  BackendPaginatedResponse,
  NormalizedPaginatedResponse,
  Room,
  RoomRequest,
  RoomsQuery,
  ServiceResponse,
  UUID,
} from "../types";
import { normalizePaginatedResponse } from "../utils/pagination";
import { performRequest } from "../utils/request";

const ROOMS_ENDPOINT = "/api/rooms";

async function getRooms(
  params?: RoomsQuery,
): Promise<ServiceResponse<NormalizedPaginatedResponse<Room>>> {
  return performRequest<BackendPaginatedResponse<Room>, NormalizedPaginatedResponse<Room>>(
    {
      url: ROOMS_ENDPOINT,
      method: "GET",
      params,
    },
    normalizePaginatedResponse,
  );
}

async function createRoom(payload: RoomRequest): Promise<ServiceResponse<Room>> {
  return performRequest<Room>({
    url: ROOMS_ENDPOINT,
    method: "POST",
    data: payload,
  });
}

async function updateRoom(id: UUID, payload: RoomRequest): Promise<ServiceResponse<Room>> {
  return performRequest<Room>({
    url: `${ROOMS_ENDPOINT}/${id}`,
    method: "PUT",
    data: payload,
  });
}

async function deleteRoom(id: UUID): Promise<ServiceResponse<null>> {
  return performRequest<unknown, null>(
    {
      url: `${ROOMS_ENDPOINT}/${id}`,
      method: "DELETE",
    },
    () => null,
  );
}

export const roomsService = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
};