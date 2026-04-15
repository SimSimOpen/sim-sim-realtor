import { Component, ElementRef, Input, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';

declare const ymaps3: any;

@Component({
  selector: 'app-yandex-map',
  template: `<div
    class="border border-gray-400 rounded-2xl p-2 w-full h-full my-4 aspect-video"
    #mapContainer
  ></div>`,
})
export class YandexMapComponent implements AfterViewInit, OnDestroy {
  @Input() latitude = 41.2995;
  @Input() longitude = 69.2401;
  @Input() zoom = 13;
  @Input() address = '';

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private mapInstance: any;
  private markerElement: any;

  ngAfterViewInit() {
    this.waitForYmaps3().then(() => this.initMap());
  }

  private waitForYmaps3(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof ymaps3 !== 'undefined' && ymaps3.ready) {
        ymaps3.ready.then(() => resolve());
      } else {
        const interval = setInterval(() => {
          if (typeof ymaps3 !== 'undefined' && ymaps3.ready) {
            clearInterval(interval);
            ymaps3.ready.then(() => resolve());
          }
        }, 100);
      }
    });
  }

  private initMap() {
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3; // ← add this

    this.mapInstance = new YMap(this.mapContainer.nativeElement, {
      location: {
        center: [this.longitude, this.latitude],
        zoom: this.zoom,
      },
    });

    this.mapInstance.addChild(new YMapDefaultSchemeLayer());
    this.mapInstance.addChild(new YMapDefaultFeaturesLayer()); // ← add this

    if (this.address && this.address.trim() !== '' && this.address !== 'null') {
      this.geocodeAddress(this.address);
    } else if (this.latitude && this.longitude) {
      this.setCenter(this.longitude, this.latitude, 15);
      this.placeMarker(this.longitude, this.latitude);
    }
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
    const { YMapMarker } = ymaps3;

    // Remove existing marker if any
    if (this.markerElement) {
      this.mapInstance.removeChild(this.markerElement);
    }

    const markerEl = this.createMarkerElement();

    this.markerElement = new YMapMarker(
      {
        coordinates: [lon, lat],
        anchor: [0.5, 1], // bottom-center of the pin tip
      },
      markerEl,
    );

    this.mapInstance.addChild(this.markerElement);
  }

  private setCenter(lon: number, lat: number, zoom?: number) {
    if (!this.mapInstance) return;
    this.mapInstance.update(
      {
        location: {
          center: [lon, lat],
          zoom: zoom ?? this.zoom,
        },
      },
      { duration: 300 },
    );
  }

  private geocodeAddress(address: string) {
    const geocoderUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=d274a689-ee61-43ea-83ff-333ac18efed4&format=json&geocode=${encodeURIComponent(address)}`;

    fetch(geocoderUrl)
      .then((r) => r.json())
      .then((data) => {
        const feature = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
        if (!feature) return;

        const [lonStr, latStr] = feature.Point.pos.split(' ');
        const lon = parseFloat(lonStr);
        const lat = parseFloat(latStr);

        this.setCenter(lon, lat, 15);
        this.placeMarker(lon, lat); // ← place marker at geocoded location
      })
      .catch((err) => console.error('Geocoding error:', err));
  }

  ngOnDestroy() {
    this.mapInstance?.destroy?.();
  }
}
