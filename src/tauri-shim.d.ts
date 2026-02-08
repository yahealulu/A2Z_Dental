// Optional Tauri APIs - shim for build when @tauri-apps is not installed
declare module '@tauri-apps/api/tauri' {
  export function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}
declare module '@tauri-apps/api/fs' {
  export enum BaseDirectory { AppData = 1 }
  export function createDir(path: string, options?: { dir?: BaseDirectory; recursive?: boolean }): Promise<void>;
  export function exists(path: string, options?: { dir?: BaseDirectory }): Promise<boolean>;
  export function writeFile(path: string, contents: Uint8Array, options?: { dir?: BaseDirectory }): Promise<void>;
  export function readBinaryFile(path: string, options?: { dir?: BaseDirectory }): Promise<Uint8Array>;
  export function removeFile(path: string, options?: { dir?: BaseDirectory }): Promise<void>;
}
declare module '@tauri-apps/api/path' {
  export function join(...paths: string[]): Promise<string>;
}
