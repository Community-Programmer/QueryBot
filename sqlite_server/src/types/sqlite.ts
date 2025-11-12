export interface QueryRequest {
  uuid: string;
  query: string;
}

export interface DatabaseTable {
  name: string;
  sql: string;
}

export interface UploadResponse {
  uuid: string;
}