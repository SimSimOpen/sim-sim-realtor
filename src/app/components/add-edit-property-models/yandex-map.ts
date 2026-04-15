import {
  Component,
  ElementRef,
  Input,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  Inject,
} from '@angular/core';

// Declare globals for YMaps3
declare const ymaps3: any;

@Component({
  selector: 'app-yandex-map',
  template: `<div #mapContainer style="width: 100%; height: 400px;"></div>`,
})
export class YandexMapComponent implements AfterViewInit, OnDestroy {
  @Input() latitude = 41.2995;
  @Input() longitude = 69.2401;
  @Input() zoom = 13;
  @Input() address = '';

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private mapInstance: any;

  ngAfterViewInit() {
    this.waitForYmaps3().then(() => this.initMap());
  }

  private waitForYmaps3(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof ymaps3 !== 'undefined' && ymaps3.ready) {
        console.log('YMAPS3:', ymaps3);
        ymaps3.ready.then(() => {
          console.log('YMap API ready');
          resolve();
        });
      } else {
        const interval = setInterval(() => {
          if (typeof ymaps3 !== 'undefined' && ymaps3.ready) {
            clearInterval(interval);
            ymaps3.ready.then(() => {
              console.log('YMap API ready');
              resolve();
            });
          }
        }, 100);
      }
    });
  }

  private initMap() {
    const { YMap, YMapDefaultSchemeLayer } = ymaps3;

    this.mapInstance = new YMap(this.mapContainer.nativeElement, {
      location: {
        center: [this.longitude, this.latitude],
        zoom: this.zoom,
      },
    });

    const layer = new YMapDefaultSchemeLayer();
    this.mapInstance.addChild(layer);

    if (this.latitude && this.longitude) {
      this.setCenter(this.longitude, this.latitude, 15);
    }

    if (this.address && this.address.trim() !== '' && this.address !== 'null') {
      this.geocodeAddress(this.address);
    }
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
      { duration: 300 }, // optional smooth animation
    );
  }

  private geocodeAddress(address: string) {
    // YMaps3 does not bundle geocoder; you must use Yandex Geocoder API over HTTP
    const geocoderUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=d274a689-ee61-43ea-83ff-333ac18efed4&format=json&geocode=${encodeURIComponent(
      address,
    )}`;

    fetch(geocoderUrl)
      .then((response) => response.json())
      .then((data) => {
        const feature = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
        if (!feature) return;

        const pointStr = feature.Point.pos; // "lon lat"
        const [lonStr, latStr] = pointStr.split(' ');
        const lon = parseFloat(lonStr);
        const lat = parseFloat(latStr);

        this.setCenter(lon, lat, 15);
      })
      .catch((err) => console.error('Geocoding error:', err));
  }

  ngOnDestroy() {
    this.mapInstance?.destroy?.();
  }
}
