// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  app: {
    name: "Blesong",
  },
  production: false,
  apiUrl: `http://${window.location.hostname}:8080/api`,
  broker: {
    url: `ws://${window.location.hostname}:8081/`,
    username: 'blesong',
    password: 'blesong',
  },
  file: {
    endpoint: `https://blesong.us-southeast-1.linodeobjects.com/blesong/`,
  },
  mosquitto: {
    hostname: `${window.location.hostname}`,
    port: 1883,
    username: 'blesong',
    password: 'blesong',
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.