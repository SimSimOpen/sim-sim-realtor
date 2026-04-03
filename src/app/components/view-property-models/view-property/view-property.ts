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
  ViewChild,
} from '@angular/core';
import { Property } from '../../../shared/models/properties';
import { CommonModule } from '@angular/common';
import { EnvironmentTs } from '../../../environments/environment';
import { ListingStatus, OfferType } from '../../../shared/enums/PropertyStatus';
import { AboutAgent } from '../view-property-agent';
import { AboutProperty } from '../view-property-about';
import { ProductStateService } from '../../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-view-property',
  imports: [CommonModule, AboutAgent, AboutProperty],
  templateUrl: './view-property.html',
  styleUrl: './view-property.scss',
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

  private productStateService = inject(ProductStateService);
  private ctr = inject(ChangeDetectorRef);

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
    const publishedDate = (this.property() as any)['updatedAt'];
    return { ...this.property(), place, district, region, dateListed: publishedDate };
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
  get isRent() {
    return this.selectedProperty?.offerType === OfferType.FOR_RENT;
  }
  get isPublished() {
    return this.selectedProperty?.listingStatus === ListingStatus.ACTIVE;
  }

  ngOnDestroy() {
    this.removeScrollListener();
  }
}
