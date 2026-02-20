export type languageType = "javascript" | "python";
export interface userType {
  id: string;
  role: string;
}
export interface codeInfoType {
  language: languageType;
  code: string;
}