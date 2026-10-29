import { ChangeDetectorRef, Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SelectMethod } from '../../add-edit-property-models/select-method';
import { UploadFromComputer } from '../../add-edit-property-models/upload-from-computer';
import { UploadFromMobile } from '../../add-edit-property-models/upload-from-mobile';
import { UploadedFiles } from '../../add-edit-property-models/uploaded-files';
import { RichTextEditor } from '../../add-edit-property-models/rich-text-editor';
import { YandexMapComponent } from '../../add-edit-property-models/yandex-map';
import { MoneyFormatDirective } from '../../../shared/utils/money-format.directive';
import { ServicesApiService } from '../../../shared/services/services/services-api.service';
import { ProductStateService } from '../../../shared/services/product/state/product-state.service';
import { LocationService } from '../../../shared/services/location.service';
import { ServiceItem, ServiceRequest } from '../../../shared/models/services';
import { District, Place, Property, Region } from '../../../shared/models/properties';
import { ListingStatus } from '../../../shared/enums/PropertyStatus';
import { PriceMode, ServiceCategory, ServiceKind } from '../../../shared/enums/Services';
import { DISTRICT_CENTERS } from '../../../shared/constants/district-centers';
import { Common } from '../../../shared/common';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { I18nService } from '../../../shared/i18n/i18n.service';
import { TranslationKey } from '../../../shared/i18n/translations';

const DEFAULT_POINT = { latitude: 41.2995, longitude: 69.2401 };

@Component({
  selector: 'app-add-edit-services',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectMethod,
    UploadFromComputer,
    UploadFromMobile,
    UploadedFiles,
    RichTextEditor,
    YandexMapComponent,
    MoneyFormatDirective,
    TranslatePipe,
  ],
  templateUrl: './add-edit-services.html',
  styleUrl: '../../add-edit-property-models/add-edit-property/add-edit-property.scss',
})
export class AddEditServices implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private itemApi = inject(ServicesApiService);
  private productState = inject(ProductStateService);
  private locationService = inject(LocationService);
  private toastr = inject(ToastrService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);

  /** Shared with the photo components: they upload into, and refresh, this slot. */
  editing = this.productState.editingProperty;

  /** Services is two-sided: the poster either supplies the service or needs one. */
  readonly kinds = Object.values(ServiceKind);
  readonly categories = Object.values(ServiceCategory);
  readonly priceModes = Object.values(PriceMode);
  readonly seeking = ServiceKind.SEEKING;

  isEditing = false;
  steps: 1 | 2 = 1;
  selectMethod: 'computer' | 'mobile' | '' = '';
  saving = false;

  regions: Region[] = [];
  districts: District[] = [];
  places: Place[] = [];
  readonly districtCenter = signal<{ lon: number; lat: number } | undefined>(undefined);
  readonly placeFocus = signal<string | undefined>(undefined);

  form = this.fb.group({
    title: [''],
    description: [''],
    price: [''],
    priceMode: [PriceMode.FIXED as string],
    category: [ServiceCategory.OTHER as string],
    kind: [ServiceKind.OFFERING as string],
    ownerContact: [''],
    regionId: [null as number | null],
    districtId: [null as number | null],
    placeId: [null as number | null],
    address: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit() {
    const item = this.editing() as unknown as ServiceItem | null;
    this.isEditing = !!item?.id;
    if (item) this.fillForm(item);
    this.locationService.getRegions().subscribe((regions) => {
      this.regions = regions;
      const regionId = item?.regionId ?? (regions.length === 1 ? regions[0].id : null);
      if (regionId) {
        this.form.patchValue({ regionId });
        this.loadDistricts(regionId, item?.districtId ?? null, item?.placeId ?? null);
      }
      this.ctr.detectChanges();
    });
  }

  private fillForm(item: ServiceItem) {
    this.form.patchValue({
      title: item.title ?? '',
      description: item.description ?? '',
      price: item.price != null ? String(item.price) : '',
      priceMode: item.priceMode ?? PriceMode.FIXED,
      category: item.category ?? ServiceCategory.OTHER,
      kind: item.kind ?? ServiceKind.OFFERING,
      ownerContact: item.ownerContact ?? '',
      address: item.location?.[3] ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
    });
  }

  private loadDistricts(regionId: number, districtId: number | null, placeId: number | null) {
    this.locationService.getDistrictsByRegion(regionId).subscribe((districts) => {
      this.districts = districts;
      if (districtId) {
        this.form.patchValue({ districtId });
        this.loadPlaces(districtId, placeId);
      }
      this.ctr.detectChanges();
    });
  }

  private loadPlaces(districtId: number, placeId: number | null) {
    this.locationService.getPlacesByDistrict(districtId).subscribe((places) => {
      this.places = places;
      if (placeId) this.form.patchValue({ placeId });
      this.ctr.detectChanges();
    });
  }

  onRegionChange(value: string) {
    const regionId = Number(value) || null;
    this.form.patchValue({ regionId, districtId: null, placeId: null });
    this.districts = [];
    this.places = [];
    if (regionId) this.loadDistricts(regionId, null, null);
  }

  onDistrictChange(value: string) {
    const districtId = Number(value) || null;
    this.form.patchValue({ districtId, placeId: null });
    this.places = [];
    this.placeFocus.set(undefined);
    this.districtCenter.set(districtId ? DISTRICT_CENTERS[districtId] : undefined);
    if (districtId) this.loadPlaces(districtId, null);
  }

  onPlaceChange(value: string) {
    const placeId = Number(value) || null;
    this.form.patchValue({ placeId });
    const place = this.places.find((p) => p.id === placeId);
    if (!place) return;
    const district = this.districts.find((d) => d.id === this.form.value.districtId);
    const region = this.regions.find((r) => r.id === this.form.value.regionId);
    this.placeFocus.set([place.name_en, district?.name_en, region?.name_en].filter(Boolean).join(', '));
  }

  onPicked(point: { latitude: number; longitude: number }) {
    this.form.patchValue(point);
  }

  get mapAddress(): string {
    const v = this.form.value;
    return [
      'Uzbekistan',
      this.regions.find((r) => r.id === v.regionId)?.name_en,
      this.districts.find((d) => d.id === v.districtId)?.name_en,
      this.places.find((p) => p.id === v.placeId)?.name_en,
      v.address,
    ]
      .filter(Boolean)
      .join(', ');
  }

  get mapPoint() {
    const { latitude, longitude } = this.form.value;
    return latitude != null && longitude != null ? { latitude, longitude } : null;
  }

  get photoCount(): number {
    return this.editing()?.medias?.length ?? 0;
  }

  get isSeeking(): boolean {
    return this.form.value.kind === ServiceKind.SEEKING;
  }

  /** A SEEKING listing's amount is the poster's budget, so the field says so. */
  get priceCaption(): TranslationKey {
    return this.isSeeking ? 'services.budget' : 'services.price';
  }

  /** Short explainer under each side of the two-sided picker. */
  kindHint(kind: ServiceKind): string {
    return this.i18n.t(
      kind === ServiceKind.SEEKING ? 'services.kindSeekingHint' : 'services.kindOfferingHint',
    );
  }

  changeMethod(method: 'computer' | 'mobile' | '') {
    this.selectMethod = method;
  }

  nextStep() {
    if (this.editing()?.id) {
      this.steps = 2;
      return;
    }
    // Photos can be added later, so a listing may start as an empty draft.
    this.itemApi.createDraft().subscribe({
      next: (item) => {
        this.productState.startEditing(item as unknown as Property);
        this.steps = 2;
        this.ctr.detectChanges();
      },
      error: () => this.toastr.error(this.i18n.t('upload.draftError'), this.i18n.t('common.error')),
    });
  }

  previousStep() {
    this.steps = 1;
  }

  save(action: 'draft' | 'publish') {
    const id = this.editing()?.id;
    if (!id || this.saving) return;
    if (action === 'draft') {
      this.submit(id, ListingStatus.DRAFT);
      return;
    }
    // Only the title is required: the price may be left out and reads as "Negotiable".
    if (!this.form.value.title?.trim()) {
      this.toastr.error(this.i18n.t('services.requiredFields'), this.i18n.t('common.error'));
      return;
    }
    this.submit(id, ListingStatus.ACTIVE);
  }

  private submit(id: number, listingStatus: ListingStatus) {
    this.saving = true;
    this.itemApi.update(id, this.toRequest(listingStatus)).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.i18n.t('services.saved'));
        this.saved.emit();
        this.closeModal.emit();
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.i18n.t('services.saveError'), this.i18n.t('common.error'));
      },
    });
  }

  private toRequest(listingStatus: ListingStatus): ServiceRequest {
    const v = this.form.getRawValue();
    return {
      title: v.title?.trim() || null,
      description: descriptionOrNull(v.description),
      price: toNumber(v.price),
      priceMode: v.priceMode as PriceMode,
      category: v.category as ServiceCategory,
      kind: v.kind as ServiceKind,
      listingStatus,
      ownerContact: v.ownerContact?.trim() || null,
      regionId: v.regionId,
      districtId: v.districtId,
      placeId: v.placeId,
      address: v.address?.trim() || null,
      latitude: v.latitude,
      longitude: v.longitude,
    };
  }

  protected readonly defaultPoint = DEFAULT_POINT;
}

/** "12,500" / "1.6" / "" -> number or null. */
function toNumber(value: string | null | undefined): number | null {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The editor emits `<p></p>` when nothing was typed; store null instead of tag-only markup. */
function descriptionOrNull(html: string | null | undefined): string | null {
  const value = html?.trim();
  if (!value) return null;
  const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text ? value : null;
}
