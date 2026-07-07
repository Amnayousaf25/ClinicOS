export interface ApiResponse<T> {
  data: T;
}

export type PopulatedRef<T> = string | T | null | undefined;

export interface IdDocument {
  _id: string;
}
