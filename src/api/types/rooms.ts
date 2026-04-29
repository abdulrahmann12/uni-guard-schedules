import type { ISOInstant, SortDirection, UUID } from "./api";

export type RoomType = "SMALL" | "MEDIUM" | "LARGE";

export interface RoomsQuery {
  page?: number;
  size?: number;
  sortBy?: "id" | "name" | "capacity" | "type" | "minInvigilators";
  direction?: SortDirection;
  type?: RoomType;
  name?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface RoomRequest {
  name: string;
  capacity: number;
  type: RoomType;
  minInvigilators: number;
}

export interface Room {
  id: UUID;
  name: string;
  capacity: number;
  type: RoomType;
  minInvigilators: number;
  active: boolean;
  createdAt: ISOInstant;
  updatedAt: ISOInstant;
}