export type VsCodeWebviewApi = {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

declare const acquireVsCodeApi: undefined | (() => VsCodeWebviewApi);

export function getVsCodeApi(): VsCodeWebviewApi | null {
  return typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;
}

