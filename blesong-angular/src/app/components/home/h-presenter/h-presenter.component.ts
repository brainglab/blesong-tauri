import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { RealtimeModel } from 'src/app/models/realtime.model';
import { TemplateModel } from 'src/app/models/template.model';
import { MqttService } from 'src/app/services/mqtt.service';
import gsap from 'gsap';

@Component({
  selector: 'app-h-presenter',
  templateUrl: './h-presenter.component.html'
})
export class HPresenterComponent implements OnInit, AfterViewInit, OnDestroy {

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
    this.mTemplate = new TemplateModel();
    this.mTemplate.template_animation = 0;

    this.subscription = this.mMqttService.messageReceived$.subscribe(({ topic, message }) => {
      let mObject = JSON.parse(message);
      this.animateTextOut().then(() => {
        this.mRealtime.song_array = mObject.song_array;
        this.mRealtime.song_slide_selected = mObject.song_slide_selected;
        this.mTemplate = mObject.template;
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
      // 0: Suave, 1: Brillante, 2: Desvanecimiento, 3: Desvanecimiento con brillo, 4: Desvanecimiento con brillo y ondulación
      let mType = this.mTemplate.template_animation;
      switch (mType) {
        case 0:
          gsap.fromTo(
            '.animated-text',
            {
              opacity: 0,
              y: 20
            },
            {
              opacity: 1,
              y: 0,
              duration: 1.2,
              ease: "power2.out",
              // Comentario: Animación suave con fade in y ligero movimiento hacia arriba
              onComplete: () => {
                // Efecto sutil de brillo
                gsap.to('.animated-text', {
                  textShadow: "0 0 10px rgba(255,255,255,0.4)",
                  duration: 0.8,
                  yoyo: true,
                  repeat: 1,
                  ease: "power1.inOut"
                });
              }
            }
          );

          break;
        case 1:
          // Animación brillante con destello y escala
          gsap.fromTo(
            '.animated-text',
            {
              opacity: 0,
              scale: 0.8,
              filter: 'brightness(0.5)'
            },
            {
              opacity: 1,
              scale: 1,
              filter: 'brightness(1.5)',
              duration: 1,
              ease: "power2.out",
              onComplete: () => {
                gsap.to('.animated-text', {
                  textShadow: "0 0 20px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.6)",
                  filter: 'brightness(1.2)',
                  duration: 0.5,
                  yoyo: true,
                  repeat: -1
                });
              }
            }
          );
          break;

        case 2:
          // Animación de desvanecimiento simple
          gsap.fromTo(
            '.animated-text',
            {
              opacity: 0
            },
            {
              opacity: 1,
              duration: 2,
              ease: "power1.inOut"
            }
          );
          break;

        case 3:
          // Desvanecimiento con brillo pulsante
          gsap.fromTo(
            '.animated-text',
            {
              opacity: 0,
              filter: 'brightness(0.5)'
            },
            {
              opacity: 1,
              filter: 'brightness(1.2)',
              duration: 1.5,
              ease: "power2.inOut",
              onComplete: () => {
                gsap.to('.animated-text', {
                  filter: 'brightness(1.4)',
                  textShadow: "0 0 15px rgba(255,255,255,0.7)",
                  duration: 1,
                  yoyo: true,
                  repeat: -1
                });
              }
            }
          );
          break;

        case 4:
          // Desvanecimiento con brillo y efecto de onda
          gsap.fromTo(
            '.animated-text',
            {
              opacity: 0,
              filter: 'brightness(0.5)',
              skewX: 20
            },
            {
              opacity: 1,
              filter: 'brightness(1.3)',
              skewX: 0,
              duration: 1.5,
              ease: "elastic.out(1, 0.3)",
              onComplete: () => {
                gsap.to('.animated-text', {
                  filter: 'brightness(1.5)',
                  textShadow: "0 0 25px rgba(255,255,255,0.9)",
                  skewX: 2,
                  duration: 1.2,
                  yoyo: true,
                  repeat: -1,
                  ease: "sine.inOut"
                });
              }
            }
          );
          break;
        default:
          break;
      }

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
