// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

function resolveServerHost(): string {
  if (typeof window === 'undefined') return '127.0.0.1';
  const { hostname, protocol } = window.location;
  // Inside the Tauri webview the page is loaded from `http://tauri.localhost`
  // (Windows/Android) or `tauri://localhost` (macOS/Linux). Neither can reach
  // the embedded HTTP/MQTT servers on port 8080/8081 — they listen on
  // 0.0.0.0, so we redirect to loopback explicitly.
  if (protocol === 'tauri:' || hostname === 'tauri.localhost') {
    return '127.0.0.1';
  }
  return hostname;
}

const host = resolveServerHost();

export const environment = {
  app: {
    name: "Blesong",
    version: "2.1.2",
  },
  production: false,
  apiUrl: `http://${host}:8080/api`,
  broker: {
    url: `ws://${host}:8081/`,
  },
};
