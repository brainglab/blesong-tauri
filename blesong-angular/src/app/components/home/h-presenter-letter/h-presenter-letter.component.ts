import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RealtimeModel } from 'src/app/models/realtime.model';
import { TemplateModel } from 'src/app/models/template.model';
import { MqttService } from 'src/app/services/mqtt.service';
import gsap from 'gsap';

@Component({
  selector: 'app-h-presenter-letter',
  templateUrl: './h-presenter-letter.component.html'
})
export class HPresenterLetterComponent implements OnInit, AfterViewInit, OnDestroy {

  private subscription: Subscription;
  public message: string;

  private mTopicName = 'blesong';
  private mMessage = 'Hola MQTT!';

  mTemplate: TemplateModel = new TemplateModel();
  mRealtime: RealtimeModel = new RealtimeModel();

  @ViewChild('animatedText', { static: false }) animatedText!: ElementRef;

  constructor(private mMqttService: MqttService) {

    this.mRealtime.song_array = [];
    this.mRealtime.song_slide_selected = 0;

    this.subscription = this.mMqttService.messageReceived$.subscribe(({ topic, message }) => {
      let mObject = JSON.parse(message);
      this.animateTextOut().then(() => {
        this.mRealtime.song_array = mObject.song_array;
        this.mRealtime.song_slide_selected = mObject.song_slide_selected;
        this.animateTextIn();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    gsap.killTweensOf('.animated-text');
  }

  ngOnInit() {
    // Remover la clase bg-white del body al iniciar el componente
    document.body.classList.remove('bg-white');

    // Nos suscribimos al tópico cuando se inicia el componente
    this.mMqttService.subscribe(this.mTopicName);
  }

  ngAfterViewInit(): void {
    this.animateText();
  }

  animateText(): void {
    this.animateTextIn();
  }

  async animateTextIn(): Promise<void> {
    try {
      // Animación espectacular con múltiples efectos combinados
      gsap.fromTo(
        '.animated-text',
        {
          scale: 0.5,
          opacity: 0,
          rotationY: 180,
          skewX: 45,
          y: 200,
          filter: 'blur(20px)'
        },
        {
          scale: 1,
          opacity: 1,
          rotationY: 0,
          skewX: 0,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          ease: "elastic.out(1.2, 0.4)",
          transformOrigin: "center center",
          stagger: {
            amount: 0.4,
            from: "center"
          },
          onComplete: () => {
            // Efecto de brillo y escala pulsante
            gsap.to('.animated-text', {
              scale: 1.1,
              textShadow: "0 0 20px rgba(255,255,255,0.8)",
              yoyo: true,
              repeat: 1,
              duration: 0.4,
              ease: "power2.inOut",
              onComplete: () => {
                // Efecto de ondulación final
                gsap.to('.animated-text', {
                  letterSpacing: "5px",
                  yoyo: true,
                  duration: 0.6,
                  ease: "sine.inOut"
                });
              }
            });
          }
        }
      );
    } catch (error) {
      console.error("Error al animar el texto:", error);
    }
  }

  animateTextOut(): Promise<void> {
    return new Promise((resolve) => {
      gsap.to('.animated-text', {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: resolve
      });
    });
  }

  // Método para enviar un mensaje
  enviarMensaje() {
    this.mMqttService.publish(this.mTopicName, this.mMessage);
  }



}
