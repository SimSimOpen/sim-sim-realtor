import { Component, ElementRef, Input, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';

declare const ymaps: any;

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
  private map: any;

  ngAfterViewInit() {
    this.waitForYmaps().then(() => this.initMap());
  }

  private waitForYmaps(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof this.ymaps !== 'undefined') {
        this.ymaps.ready(resolve);
      } else {
        const interval = setInterval(() => {
          if (typeof this.ymaps !== 'undefined') {
            clearInterval(interval);
            this.ymaps.ready(resolve);
          }
        }, 100);
      }
    });
  }

  private initMap() {
    this.map = new ymaps.Map(this.mapContainer.nativeElement, {
      center: [this.latitude, this.longitude],
      zoom: this.zoom,
      controls: ['zoomControl', 'fullscreenControl'],
    });

    if (this.latitude && this.longitude) {
      const placemark = new ymaps.Placemark(
        [this.latitude, this.longitude],
        { balloonContent: this.address || 'Property Location' },
        { preset: 'islands#blueDotIcon' },
      );
      this.map.geoObjects.add(placemark);
    }

    // Geocode only if address is a real string
    if (this.address && this.address.trim() !== '' && this.address !== 'null') {
      this.geocodeAddress(this.address);
    }
  }

  geocodeAddress(address: string) {
    // ymaps is guaranteed to be ready here since initMap() runs after waitForYmaps()
    ymaps.geocode(address).then((result: any) => {
      const firstResult = result.geoObjects.get(0);
      if (!firstResult) return;

      const coords = firstResult.geometry.getCoordinates();
      if (coords) {
        this.map.setCenter(coords, 15);
        // Update placemark position too
        this.map.geoObjects.removeAll();
        const placemark = new ymaps.Placemark(
          coords,
          { balloonContent: address },
          { preset: 'islands#blueDotIcon' },
        );
        this.map.geoObjects.add(placemark);
      }
    });
  }

  private get ymaps(): any {
    return (window as any)['ymaps'];
  }

  ngOnDestroy() {
    this.map?.destroy();
  }
}
