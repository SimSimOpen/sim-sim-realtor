import { Component, computed, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YandexMapComponent } from '../../add-edit-property-models/yandex-map';
import { SecondHandItem } from '../../../shared/models/second-hand';
import { Common } from '../../../shared/common';
import { EnvironmentTs } from '../../../environments/environment';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { TranslationKey } from '../../../shared/i18n/translations';

@Component({
  selector: 'app-view-second-hand',
  imports: [CommonModule, YandexMapComponent, TranslatePipe],
  templateUrl: './view-second-hand.html',
  styleUrl: '../../add-edit-property-models/add-edit-property/add-edit-property.scss',
})
export class ViewSecondHand {
  readonly item = input.required<SecondHandItem>();
  @Output() closeModal = new EventEmitter<void>();

  public common = inject(Common);

  /** Cover first, then the rest in upload order. */
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

  readonly specs = computed<{ label: TranslationKey; value: string }[]>(() => {
    const i = this.item();
    const f = (v: string | null) => this.common.formatEnum(v);
    const rows: { label: TranslationKey; value: string | null }[] = [
      { label: 'secondHand.subCategory', value: f(i.subCategory) },
      { label: 'secondHand.condition', value: f(i.condition) },
    ];
    return rows.filter((r): r is { label: TranslationKey; value: string } => !!r.value);
  });

  get hasPoint(): boolean {
    return this.item().latitude != null && this.item().longitude != null;
  }
}
