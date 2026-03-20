import { Injectable, OnDestroy } from '@angular/core';
import mqtt from 'mqtt';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MqttService implements OnDestroy {

  private client: mqtt.MqttClient | null = null;
  private brokerUrl = environment.broker.url;
  private mqttOptions = {
    username: environment.broker.username,
    password: environment.broker.password,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
  };

  private mMessageReceived = new Subject<{ topic: string, message: string }>();
  public messageReceived$ = this.mMessageReceived.asObservable();

  constructor() {
    this.connect();
  }

  ngOnDestroy(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  private connect(): void {
    this.client = mqtt.connect(this.brokerUrl, this.mqttOptions);

    this.client.on('connect', () => {
      console.log('Conectado al broker MQTT');
    });

    this.client.on('error', (error) => {
      console.error('Error en la conexión MQTT:', error);
    });

    this.client.on('offline', () => {
      console.warn('MQTT client offline');
    });

    this.client.on('message', (topic, message) => {
      this.mMessageReceived.next({
        topic: topic,
        message: message.toString()
      });
    });
  }

  public subscribe(topic: string): void {
    if (this.client) {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error('Error al suscribirse:', error);
        } else {
          console.log(`Suscrito al tópico: ${topic}`);
        }
      });
    }
  }

  public publish(topic: string, message: string): void {
    if (this.client) {
      this.client.publish(topic, message, (error) => {
        if (error) {
          console.error('Error al publicar:', error);
        } else {
          console.log(`Mensaje publicado en el tópico ${topic}: ${message}`);
        }
      });
    }
  }
}