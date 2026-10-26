import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { Property } from '../../../shared/models/properties';
import { CommonModule } from '@angular/common';
import { Common } from '../../../shared/common';
import { EnvironmentTs } from '../../../environments/environment';
import { ListingStatus, OfferType } from '../../../shared/enums/PropertyStatus';
import { AboutAgent } from '../view-property-agent';
import { AboutProperty } from '../view-property-about';
import { ProductStateService } from '../../../shared/services/product/state/product-state.service';
import { YandexMapComponent } from '../../add-edit-property-models/yandex-map';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { GlobalService } from '../../../shared/services/global.service';

@Component({
  selector: 'app-view-property',
  imports: [CommonModule, AboutAgent, AboutProperty, YandexMapComponent, TranslatePipe],
  templateUrl: './view-property.html',
  styleUrl: './view-property.scss',
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class ViewProperty {
  @Output() closeModal = new EventEmitter<any>();

  @ViewChild('scrollContainer') set scrollContainer(el: ElementRef<HTMLDivElement>) {
    if (el) {
      this._scrollContainer = el;
      this.attachScrollListener(el.nativeElement);
    } else {
      this.removeScrollListener();
      this.arrow = 'down'; // reset arrow
    }
  }
  arrow: 'down' | 'up' = 'down';
  private _scrollContainer?: ElementRef<HTMLDivElement>;
  private scrollListener?: () => void; // store reference
  hasScroll: boolean = false;

  selectedImageIndex: number | null = null;
  allImages: string[] = [];

  private productStateService = inject(ProductStateService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);
  private global = inject(GlobalService);

  /** Phone carousel position; the wide layout keeps the fixed hero plus thumbnail rail. */
  readonly selected = signal(0);

  property = computed(() => this.productStateService.editingProperty() as Property);

  private attachScrollListener(container: HTMLDivElement) {
    this.removeScrollListener();

    setTimeout(() => {
      this.hasScroll = container.scrollHeight > container.clientHeight;
      this.ctr.detectChanges();
    }, 200);

    this.scrollListener = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      this.arrow = isAtBottom ? 'up' : 'down';
      this.ctr.detectChanges();
    };

    container.addEventListener('scroll', this.scrollListener);
    setTimeout(() => this.ctr.detectChanges(), 100);
  }
  private removeScrollListener() {
    if (this._scrollContainer && this.scrollListener) {
      this._scrollContainer.nativeElement.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = undefined;
    }
  }

  get selectedProperty() {
    if (!this.property()) return null;
    const place = (this.property() as any)['location'][0];
    const district = (this.property() as any)['location'][1];
    const region = (this.property() as any)['location'][2];
    const address = (this.property() as any)['location'][3];
    const publishedDate = (this.property() as any)['updatedAt'];
    return { ...this.property(), place, district, region, address, dateListed: publishedDate };
  }
  get fullAddresForMap(): string {
    if (!this.property() || !(this.property() as any)['location']) return 'Tashkent, Uzbekistan';
    const place = (this.property() as any)['location'][0];
    const district = (this.property() as any)['location'][1];
    const region = (this.property() as any)['location'][2];
    const address = (this.property() as any)['location'][3];
    return [address, place, district, region].filter(Boolean).join(', ');
  }

  get propertiesCoverImage() {
    var property = this.selectedProperty;
    var defaultPath = `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
    if (property?.medias && property.medias.length > 0) {
      const coverImage = property.medias.find((media) => media.isCoverImage === true);
      return coverImage ? coverImage.mediaUrl : defaultPath;
    }
    return defaultPath;
  }

  /** Cover first, then the rest in upload order — the same list the lightbox walks. */
  get images(): string[] {
    const medias = this.selectedProperty?.medias ?? [];
    const sorted = [
      ...medias.filter((media) => media.isCoverImage),
      ...medias.filter((media) => !media.isCoverImage),
    ];
    return sorted.length
      ? sorted.map((media) => media.mediaUrl)
      : [`${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`];
  }

  /** Position of a rail thumbnail inside the cover-first `images` list. */
  lightboxIndexOf(mediaUrl?: string): number {
    const index = mediaUrl ? this.images.indexOf(mediaUrl) : -1;
    return index < 0 ? 0 : index;
  }

  prev() {
    this.selected.update((i) => (i - 1 + this.images.length) % this.images.length);
  }

  next() {
    this.selected.update((i) => (i + 1) % this.images.length);
  }

  get isRent() {
    return this.selectedProperty?.offerType === OfferType.FOR_RENT;
  }
  get isPublished() {
    return this.selectedProperty?.listingStatus === ListingStatus.ACTIVE;
  }
  get mapLatitude(): number {
    return this.property()?.latitude ?? 41.2995;
  }

  get mapLongitude(): number {
    return this.property()?.longitude ?? 69.2401;
  }

  get hasSavedPoint(): boolean {
    const p = this.property();
    return p?.latitude != null && p?.longitude != null;
  }

  ngOnDestroy() {
    this.removeScrollListener();
  }

  openLightbox(index: number) {
    // The lightbox walks the same cover-first list as the carousel and the hero image.
    this.allImages = this.images;
    this.selectedImageIndex = index;
    document.body.style.overflow = 'hidden';
    this.global.ProductImageOpened = true;
  }

  closeLightbox() {
    this.selectedImageIndex = null;
    this.allImages = [];
    document.body.style.overflow = '';
    this.global.ProductImageOpened = false;
  }

  prevImage(event: MouseEvent) {
    event.stopPropagation();
    if (this.selectedImageIndex !== null && this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
    } else {
      this.selectedImageIndex = this.allImages.length - 1; // wrap around
    }
  }

  nextImage(event: MouseEvent) {
    event.stopPropagation();
    if (this.selectedImageIndex !== null && this.selectedImageIndex < this.allImages.length - 1) {
      this.selectedImageIndex++;
    } else {
      this.selectedImageIndex = 0; // wrap around
    }
  }

  get selectedImage(): string | null {
    if (this.selectedImageIndex === null) return null;
    return this.allImages[this.selectedImageIndex] ?? null;
  }

  /** Keyboard navigation for the lightbox; Escape closes the zoom, not the modal. */
  handleKeydown(event: Event) {
    if (!(event instanceof KeyboardEvent) || this.selectedImageIndex === null) return;
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextImage(new MouseEvent('click', { bubbles: true }));
        break;
      case 'ArrowLeft':
        this.prevImage(new MouseEvent('click', { bubbles: true }));
        break;
    }
  }
}
