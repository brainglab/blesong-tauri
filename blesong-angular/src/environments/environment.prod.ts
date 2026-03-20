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
    endpoint: 'https://blesong.us-southeast-1.linodeobjects.com/blesong/',
  },
  mosquitto: {
    hostname: `${window.location.hostname}`,
    port: 1883,
    username: 'blesong',
    password: 'blesong',
  }
};