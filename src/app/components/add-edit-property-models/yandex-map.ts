import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { YandexMapsLoaderService } from '../../shared/services/yandex-maps-loader.service';

import { TranslatePipe } from '../../shared/i18n/translate.pipe';
/** Waits for the address to stop changing (e.g. while a form is being filled in) before geocoding. */
const GEOCODE_DEBOUNCE_MS = 400;
/** Zoom that frames one Tashkent district. */
const DISTRICT_ZOOM = 12;

@Component({
  selector: 'app-yandex-map',
  imports: [TranslatePipe],
  template: `<div class="relative w-full my-4 aspect-video">
    <div
      class="border border-gray-400 rounded-2xl overflow-hidden w-full h-full"
      #mapContainer
    ></div>
    @if (error()) {
      <div
        class="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-500 text-center px-6"
      >
        {{ error()! | t }}
      </div>
    }
  </div>`,
})
export class YandexMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude = 41.2995;
  @Input() longitude = 69.2401;
  @Input() zoom = 13;
  @Input() address = '';
  @Input() selectable = false; // enables click/drag to pick
  @Output() picked = new EventEmitter<{ latitude: number; longitude: number }>();
  @Input() useSavedPoint = false; // true when the form already holds saved coordinates
  /** Pan-only override: recenters the viewport without geocoding or moving the marker. */
  @Input() center?: { lon: number; lat: number };
  private locked = false; // ignore address-driven geocoding until the user picks

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLElement>;

  readonly error = signal<string | null>(null);

  private lastPicked?: { lat: number; lon: number };
  private loader = inject(YandexMapsLoaderService);
  private ymaps: any;
  private mapInstance: any;
  private markerElement: any;
  private geocodeTimer?: ReturnType<typeof setTimeout>;
  /** Incremented per geocode so a slow, outdated response can't move the marker back. */
  private geocodeRequestId = 0;
  private destroyed = false;

  async ngAfterViewInit() {
    try {
      this.ymaps = await this.loader.load();
    } catch (err) {
      console.error(err);
      this.error.set('map.unavailable');
      return;
    }
    if (this.destroyed) return;
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.mapInstance) return;
    if (changes['center'] && this.center) {
      this.setCenter(this.center.lon, this.center.lat, DISTRICT_ZOOM);
      return;
    }
    if (this.locked && changes['address'] && !changes['latitude'] && !changes['longitude']) return;
    if (changes['address'] || changes['latitude'] || changes['longitude']) {
      if (this.isLastPick(this.longitude, this.latitude) && !changes['address']) return;
      this.locate();
    }
  }

  private isLastPick(lon: number, lat: number): boolean {
    const p = this.lastPicked;
    return !!p && Math.abs(p.lon - lon) < 1e-6 && Math.abs(p.lat - lat) < 1e-6;
  }

  private initMap() {
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapListener } = this.ymaps;

    this.mapInstance = new YMap(this.mapContainer.nativeElement, {
      location: {
        center: [this.longitude, this.latitude],
        zoom: this.zoom,
      },
    });

    this.mapInstance.addChild(new YMapDefaultSchemeLayer());
    this.mapInstance.addChild(new YMapDefaultFeaturesLayer());

    if (this.selectable) {
      this.mapInstance.addChild(
        new YMapListener({
          layer: 'any',
          onClick: (_object: any, event: any) => {
            const [lon, lat] = event.coordinates;
            this.pick(lon, lat);
          },
        }),
      );
    }
    if (this.useSavedPoint) {
      this.locked = true;
      this.showPoint(this.longitude, this.latitude);
    } else {
      this.locate();
    }
  }

  private pick(lon: number, lat: number) {
    this.locked = false;
    this.lastPicked = { lon, lat };
    this.placeMarker(lon, lat);
    this.picked.emit({ latitude: lat, longitude: lon });
  }

  private locate() {
    clearTimeout(this.geocodeTimer);
    if (this.hasAddress()) {
      this.geocodeTimer = setTimeout(() => this.geocodeAddress(this.address), GEOCODE_DEBOUNCE_MS);
    } else if (this.latitude && this.longitude) {
      this.showPoint(this.longitude, this.latitude);
    }
  }

  private hasAddress(): boolean {
    return !!this.address && this.address.trim() !== '' && this.address !== 'null';
  }

  private showPoint(lon: number, lat: number) {
    this.setCenter(lon, lat, 15);
    this.placeMarker(lon, lat);
  }

  private createMarkerElement(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      width: 28px;
      height: 28px;
      background: #e63b3b;
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      cursor: pointer;
    `;
    return el;
  }

  private placeMarker(lon: number, lat: number) {
    const { YMapMarker } = this.ymaps;

    if (this.markerElement) {
      this.mapInstance.removeChild(this.markerElement);
    }

    this.markerElement = new YMapMarker(
      {
        coordinates: [lon, lat],
        anchor: [0.5, 1],
        draggable: this.selectable,
        onDragEnd: (coords: [number, number]) => this.pick(coords[0], coords[1]),
      },
      this.createMarkerElement(),
    );

    this.mapInstance.addChild(this.markerElement);
  }

  private setCenter(lon: number, lat: number, zoom?: number) {
    if (!this.mapInstance) return;
    this.mapInstance.update({
      location: {
        center: [lon, lat],
        zoom: zoom ?? this.zoom,
        duration: 300,
      },
    });
  }

  /**
   * Uses the JS API's own search, which runs on the same key as the map. The separate Geocoder
   * HTTP API (geocode-maps.yandex.ru) needs its own key, and the map key is rejected there.
   */
  private async geocodeAddress(address: string) {
    const requestId = ++this.geocodeRequestId;
    try {
      const results = await this.ymaps.search({ text: address, limit: 1 });
      if (requestId !== this.geocodeRequestId || this.destroyed) return;

      const coordinates = results?.[0]?.geometry?.coordinates;
      if (!coordinates) return;
      const [lon, lat] = coordinates;
      this.showPoint(lon, lat);

      if (this.selectable) {
        this.lastPicked = { lon, lat };
        this.picked.emit({ latitude: lat, longitude: lon });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
    clearTimeout(this.geocodeTimer);
    this.mapInstance?.destroy?.();
  }
}
