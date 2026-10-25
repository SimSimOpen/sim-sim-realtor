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
import { OnlyNumbers } from '../../../shared/utils/only-numbers';
import { MoneyFormatDirective } from '../../../shared/utils/money-format.directive';
import { CarApiService } from '../../../shared/services/car/car-api.service';
import { ProductStateService } from '../../../shared/services/product/state/product-state.service';
import { LocationService } from '../../../shared/services/location.service';
import { Car, CarBrand, CarRequest } from '../../../shared/models/cars';
import { District, Place, Property, Region } from '../../../shared/models/properties';
import { ListingStatus, OccupancyStatus, OfferType } from '../../../shared/enums/PropertyStatus';
import {
  CarBodyType,
  CarCondition,
  DriveType,
  FuelType,
  Transmission,
} from '../../../shared/enums/CarStatus';
import { DISTRICT_CENTERS } from '../../../shared/constants/district-centers';
import { Common } from '../../../shared/common';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { I18nService } from '../../../shared/i18n/i18n.service';

const MIN_PHOTOS_TO_PUBLISH = 3;
const DEFAULT_POINT = { latitude: 41.2995, longitude: 69.2401 };

@Component({
  selector: 'app-add-edit-car',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectMethod,
    UploadFromComputer,
    UploadFromMobile,
    UploadedFiles,
    RichTextEditor,
    YandexMapComponent,
    OnlyNumbers,
    MoneyFormatDirective,
    TranslatePipe,
  ],
  templateUrl: './add-edit-car.html',
  styleUrl: '../../add-edit-property-models/add-edit-property/add-edit-property.scss',
})
export class AddEditCar implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private carApi = inject(CarApiService);
  private productState = inject(ProductStateService);
  private locationService = inject(LocationService);
  private toastr = inject(ToastrService);
  private i18n = inject(I18nService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);

  /** Shared with the photo components: they upload into, and refresh, this slot. */
  editing = this.productState.editingProperty;

  readonly offerTypes = [OfferType.FOR_SALE, OfferType.FOR_RENT];
  readonly conditions = Object.values(CarCondition);
  readonly bodyTypes = Object.values(CarBodyType);
  readonly fuelTypes = Object.values(FuelType);
  readonly transmissions = Object.values(Transmission);
  readonly driveTypes = Object.values(DriveType);
  readonly maxYear = new Date().getFullYear() + 1;

  isEditing = false;
  steps: 1 | 2 = 1;
  selectMethod: 'computer' | 'mobile' | '' = '';
  saving = false;

  regions: Region[] = [];
  districts: District[] = [];
  places: Place[] = [];
  /** Brand/model catalog from the backend seed; empty until the request returns. */
  brands: CarBrand[] = [];
  readonly districtCenter = signal<{ lon: number; lat: number } | undefined>(undefined);
  readonly placeFocus = signal<string | undefined>(undefined);

  form = this.fb.group({
    title: [''],
    description: [''],
    price: [''],
    brand: [''],
    model: [''],
    year: [''],
    mileage: [''],
    engineVolume: [''],
    color: [''],
    customsCleared: [true],
    bodyType: [CarBodyType.SEDAN as string],
    fuelType: [FuelType.PETROL as string],
    transmission: [Transmission.AUTOMATIC as string],
    driveType: [DriveType.FWD as string],
    condition: [CarCondition.USED as string],
    offerType: [OfferType.FOR_SALE as string],
    occupancyStatus: [OccupancyStatus.AVAILABLE as string],
    ownerContact: [''],
    regionId: [null as number | null],
    districtId: [null as number | null],
    placeId: [null as number | null],
    address: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  ngOnInit() {
    const car = this.editing() as unknown as Car | null;
    this.isEditing = !!car?.id;
    if (car) this.fillForm(car);
    this.carApi.getBrands().subscribe((brands) => {
      this.brands = brands;
      this.ctr.detectChanges();
    });
    this.locationService.getRegions().subscribe((regions) => {
      this.regions = regions;
      const regionId = car?.regionId ?? (regions.length === 1 ? regions[0].id : null);
      if (regionId) {
        this.form.patchValue({ regionId });
        this.loadDistricts(regionId, car?.districtId ?? null, car?.placeId ?? null);
      }
      this.ctr.detectChanges();
    });
  }

  private fillForm(car: Car) {
    this.form.patchValue({
      title: car.title ?? '',
      description: car.description ?? '',
      price: car.price != null ? String(car.price) : '',
      brand: car.brand ?? '',
      model: car.model ?? '',
      year: car.year != null ? String(car.year) : '',
      mileage: car.mileage != null ? String(car.mileage) : '',
      engineVolume: car.engineVolume != null ? String(car.engineVolume) : '',
      color: car.color ?? '',
      customsCleared: car.customsCleared ?? true,
      bodyType: car.bodyType ?? CarBodyType.SEDAN,
      fuelType: car.fuelType ?? FuelType.PETROL,
      transmission: car.transmission ?? Transmission.AUTOMATIC,
      driveType: car.driveType ?? DriveType.FWD,
      condition: car.condition ?? CarCondition.USED,
      offerType: car.offerType ?? OfferType.FOR_SALE,
      occupancyStatus: car.occupancyStatus ?? OccupancyStatus.AVAILABLE,
      ownerContact: car.ownerContact ?? '',
      address: car.location?.[3] ?? '',
      latitude: car.latitude,
      longitude: car.longitude,
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

  /** Brand names for the dropdown; the current value is kept even if the catalog lacks it. */
  get brandNames(): string[] {
    const names = this.brands.map((b) => b.brand);
    const current = this.form.value.brand?.trim();
    if (current && !names.includes(current)) names.unshift(current);
    return names;
  }

  /** Models of the chosen brand; falls back to the free-text value while nothing is picked. */
  get modelNames(): string[] {
    const current = this.form.value.model?.trim();
    const brand = this.brands.find((b) => b.brand === this.form.value.brand?.trim());
    const names = brand ? [...brand.models] : [];
    if (current && !names.includes(current)) names.unshift(current);
    return names;
  }

  /** Changing brand clears the model, since models belong to one brand. */
  onBrandChange(value: string) {
    this.form.patchValue({ brand: value, model: '' });
    // Zoneless: rebuild the model <option> list right away instead of waiting for another event.
    this.ctr.detectChanges();
  }

  onModelChange(value: string) {
    this.form.patchValue({ model: value });
  }

  /**
   * Step 1 -> 2 stays locked until the car has the minimum photos, the same rule publish
   * enforces. Editing an existing car bypasses the gate so its details stay reachable.
   */
  get canContinue(): boolean {
    return this.isEditing || this.photoCount >= MIN_PHOTOS_TO_PUBLISH;
  }

  /** Occupancy options that make sense for the chosen offer type. */
  get occupancyStatuses(): string[] {
    const offerType = this.form.value.offerType;
    return Object.values(OccupancyStatus).filter(
      (s) =>
        !(offerType === OfferType.FOR_RENT && s === OccupancyStatus.SOLD) &&
        !(offerType === OfferType.FOR_SALE && s === OccupancyStatus.RENTED),
    );
  }

  setOfferType(type: OfferType) {
    this.form.patchValue({ offerType: type });
    if (!this.occupancyStatuses.includes(this.form.value.occupancyStatus ?? '')) {
      this.form.patchValue({ occupancyStatus: OccupancyStatus.AVAILABLE });
    }
  }

  changeMethod(method: 'computer' | 'mobile' | '') {
    this.selectMethod = method;
  }

  nextStep() {
    if (this.editing()?.id) {
      this.steps = 2;
      return;
    }
    // Photos can be added later, so a car may start as an empty draft.
    this.carApi.createDraft().subscribe({
      next: (car) => {
        this.productState.startEditing(car as unknown as Property);
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
    const v = this.form.value;
    if (!v.brand?.trim() || !v.model?.trim() || !v.year || !v.price) {
      this.toastr.error(this.i18n.t('cars.requiredFields'), this.i18n.t('common.error'));
      return;
    }
    this.carApi.getMediaCount(id).subscribe((count) => {
      if (count < MIN_PHOTOS_TO_PUBLISH) {
        this.toastr.error(this.i18n.t('addEdit.needPhotos'), this.i18n.t('common.error'));
        return;
      }
      this.submit(id, ListingStatus.ACTIVE);
    });
  }

  private submit(id: number, listingStatus: ListingStatus) {
    this.saving = true;
    this.carApi.update(id, this.toRequest(listingStatus)).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.i18n.t('cars.saved'));
        this.saved.emit();
        this.closeModal.emit();
      },
      error: () => {
        this.saving = false;
        this.toastr.error(this.i18n.t('cars.saveError'), this.i18n.t('common.error'));
      },
    });
  }

  private toRequest(listingStatus: ListingStatus): CarRequest {
    const v = this.form.getRawValue();
    const brand = v.brand?.trim() || null;
    const model = v.model?.trim() || null;
    const year = toNumber(v.year);
    return {
      // Listings without their own title are named after the car, e.g. "Chevrolet Cobalt 2022".
      title: v.title?.trim() || [brand, model, year].filter(Boolean).join(' ') || null,
      description: descriptionOrNull(v.description),
      price: toNumber(v.price),
      brand,
      model,
      year,
      mileage: toNumber(v.mileage),
      engineVolume: toNumber(v.engineVolume),
      color: v.color?.trim() || null,
      customsCleared: v.customsCleared,
      bodyType: v.bodyType as CarBodyType,
      fuelType: v.fuelType as FuelType,
      transmission: v.transmission as Transmission,
      driveType: v.driveType as DriveType,
      condition: v.condition as CarCondition,
      offerType: v.offerType as OfferType,
      occupancyStatus: v.occupancyStatus as OccupancyStatus,
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
