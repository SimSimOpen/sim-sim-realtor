import { Component, computed, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YandexMapComponent } from '../../add-edit-property-models/yandex-map';
import { ServiceItem } from '../../../shared/models/services';
import { PriceMode, ServiceKind } from '../../../shared/enums/Services';
import { Common } from '../../../shared/common';
import { GlobalService } from '../../../shared/services/global.service';
import { EnvironmentTs } from '../../../environments/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { TranslationKey } from '../../../shared/i18n/translations';
import { I18nService } from '../../../shared/i18n/i18n.service';

@Component({
  selector: 'app-view-services',
  imports: [CommonModule, YandexMapComponent, TranslatePipe],
  templateUrl: './view-services.html',
  styleUrl: '../../view-property-models/view-property/view-property.scss',
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class ViewServices {
  readonly item = input.required<ServiceItem>();
  @Output() closeModal = new EventEmitter<void>();

  public common = inject(Common);
  private global = inject(GlobalService);
  private i18n = inject(I18nService);

  /** Lightbox state, mirroring the property modal so every product zooms the same way. */
  selectedImageIndex: number | null = null;
  allImages: string[] = [];

  /** Cover first, then the rest in upload order; a services listing may have none at all. */
  readonly images = computed(() => {
    const medias = this.item().medias ?? [];
    const sorted = [...medias.filter((m) => m.isCoverImage), ...medias.filter((m) => !m.isCoverImage)];
    return sorted.length
      ? sorted.map((m) => m.mediaUrl)
      : [`${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`];
  });
  readonly selected = signal(0);

  readonly name = computed(() => this.item().title || `#${this.item().id}`);

  readonly address = computed(() =>
    [...this.item().location].reverse().filter(Boolean).join(', '),
  );

  /** Someone needing a service reads the amount as their budget. */
  readonly isSeeking = computed(() => this.item().kind === ServiceKind.SEEKING);

  readonly kindClasses = computed(() =>
    this.isSeeking()
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-blue-50 text-blue-700 border-blue-200',
  );

  /** "$500", "$40 /hr" or "Negotiable" (also when there is no price at all). */
  readonly priceLabel = computed(() => {
    const i = this.item();
    if (i.price == null || i.priceMode === PriceMode.NEGOTIABLE) return this.i18n.t('services.negotiable');
    const amount = `$${i.price.toLocaleString(this.i18n.lang())}`;
    return i.priceMode === PriceMode.HOURLY ? `${amount} ${this.i18n.t('services.perHour')}` : amount;
  });

  readonly priceCaption = computed<TranslationKey>(() =>
    this.isSeeking() ? 'services.budget' : 'services.price',
  );

  readonly specs = computed<{ label: TranslationKey; value: string }[]>(() => {
    const i = this.item();
    const f = (v: string | null) => this.common.formatEnum(v);
    const rows: { label: TranslationKey; value: string | null }[] = [
      { label: 'services.kind', value: f(i.kind) },
      { label: 'services.category', value: f(i.category) },
      { label: 'services.priceMode', value: i.price != null ? f(i.priceMode) : null },
      { label: this.priceCaption(), value: this.priceLabel() },
    ];
    return rows.filter((r): r is { label: TranslationKey; value: string } => !!r.value);
  });

  get hasPoint(): boolean {
    return this.item().latitude != null && this.item().longitude != null;
  }

  prev() {
    this.selected.update((i) => (i - 1 + this.images().length) % this.images().length);
  }

  next() {
    this.selected.update((i) => (i + 1) % this.images().length);
  }

  openLightbox(index: number) {
    this.allImages = this.images();
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

  /** Arrow keys walk the lightbox; Escape closes it (the modal itself stays open). */
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
