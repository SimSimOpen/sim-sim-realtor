import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { UploadFromComputer } from '../upload-from-computer';
import { SelectMethod } from '../select-method';
import { UploadFromMobile } from '../upload-from-mobile';
import { CommonModule } from '@angular/common';
import { amenitiesList } from '../../../shared/common-functions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductApiService } from '../../../shared/services/product/state/product-api.service';
import { OnlyNumbers } from '../../../shared/utils/only-numbers';
import { MoneyFormatDirective } from '../../../shared/utils/money-format.directive';
import { AreaFormatDirective } from '../../../shared/utils/area-format.directive ';
import { LocationService } from '../../../shared/services/location.service';
import { District, Place, Property, Region } from '../../../shared/models/properties';
import {
  ListingStatus,
  OccupancyStatus,
  OfferType,
  PropertyCategory,
  PropertyType,
} from '../../../shared/enums/PropertyStatus';
import { Common } from '../../../shared/common';
import { UploadedFiles } from '../uploaded-files';
import { Toast, ToastrService } from 'ngx-toastr';
import { ProductStateService } from '../../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-add-edit-property',
  imports: [
    UploadFromComputer,
    UploadFromMobile,
    SelectMethod,
    CommonModule,
    ReactiveFormsModule,
    OnlyNumbers,
    MoneyFormatDirective,
    AreaFormatDirective,
    UploadedFiles,
  ],
  templateUrl: './add-edit-property.html',
  styleUrl: './add-edit-property.scss',
})
export class AddEditProperty {
  @Output() closeModal = new EventEmitter<void>();
  @Output() updatePropertiesList = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productApiService = inject(ProductApiService);
  private productStateService = inject(ProductStateService);
  private locationService = inject(LocationService);
  private ctr = inject(ChangeDetectorRef);
  public common = inject(Common);
  private toastr = inject(ToastrService);

  editingProperty = this.productStateService.editingProperty;

  selectMethod: 'computer' | 'mobile' | '' = '';
  continueDetailsDisabled: boolean = true;
  steps: 1 | 2 = 1;
  amenities = amenitiesList;
  regions: Region[] = [];
  offerTypes = Object.values(OfferType).reverse();
  categories = Object.values(PropertyCategory);
  types = Object.values(PropertyType);
  listingStatuses = Object.values(ListingStatus);
  occupancyStatuses = Object.values(OccupancyStatus);
  districts: { available: boolean; list: District[] } = {
    available: false,
    list: [],
  };
  isEditingProperty = false;
  places: { available: boolean; list: Place[] } = {
    available: false,
    list: [],
  };

  propertyForm: FormGroup = this.buildForm();

  ngOnInit() {
    const property = this.editingProperty();

    if (property) {
      this.fillForm(property);
      this.continueDetailsDisabled = true;
      this.locationService.getRegions().subscribe({
        next: (regions) => {
          this.regions = regions;
          this.selectRegion((property as any)?.location[0]);
          this.selectDistrict((property as any)?.location[1]);
        },
      });
      this.isEditingProperty = true;
    } else {
      this.resetForm();
      this.steps = 1;
      this.selectMethod = '';
      this.fetchRegions();
      this.fetchDistricts(11);
      this.isEditingProperty = false;
    }
  }

  private buildForm() {
    return (this.propertyForm = this.fb.group({
      id: [null],
      title: [''],
      description: [''],
      price: [''],
      numberOfRooms: [''],
      area: [''],
      floor: [''],
      totalFloors: [''],
      offerType: [OfferType.FOR_RENT],
      category: [PropertyCategory.RESIDENTIAL],
      type: [PropertyType.APARTMENT],
      listingStatus: [ListingStatus.DRAFT],
      occupancyStatus: [OccupancyStatus.AVAILABLE],
      location: this.fb.group({
        country: ['Uzbekistan'],
        region_id: [11],
        district_id: [null],
        place_id: [null],
        address: [''],
      }),
      address: [''],
      amenities: this.fb.group({
        parking: [false],
        garden: [false],
        swimmingPool: [false],
        gym: [false],
        security: [false],
        elevator: [false],
        washingMachine: [false],
        airConditioning: [false],
        internet: [false],
        refrigerator: [false],
        dishwasher: [false],
        microwave: [false],
        parkingSpace: [false],
        tv: [false],
        satellite: [false],
        furniture: [false],
      }),
    }));
  }

  private fillForm(property: any): void {
    this.propertyForm.patchValue({
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      numberOfRooms: property.numberOfRooms,
      area: property.area,
      floor: property.floor,
      totalFloors: property.totalFloors,
      offerType: property.offerType,
      category: property.category,
      type: property.type,
      listingStatus: property.listingStatus,
      occupancyStatus: property.occupancyStatus,
      location: {
        country: 'Uzbekistan',
        address: (property.location as any[])[3] || '',
      },
      amenities: {
        parking: property.amenities?.parking || false,
        garden: property.amenities?.garden || false,
        swimmingPool: property.amenities?.swimmingPool || false,
        gym: property.amenities?.gym || false,
        security: property.amenities?.security || false,
        elevator: property.amenities?.elevator || false,
        washingMachine: property.amenities?.washingMachine || false,
        airConditioning: property.amenities?.airConditioning || false,
        internet: property.amenities?.internet || false,
        refrigerator: property.amenities?.refrigerator || false,
        dishwasher: property.amenities?.dishwasher || false,
        microwave: property.amenities?.microwave || false,
        parkingSpace: property.amenities?.parkingSpace || false,
        tv: property.amenities?.tv || false,
        satellite: property.amenities?.satellite || false,
        furniture: property.amenities?.furniture || false,
      },
    });
  }

  get filteredOccupancyStatuses(): string[] {
    const offerType = this.propertyForm.get('offerType')?.value;

    return this.occupancyStatuses.filter((status) => {
      if (offerType === 'FOR_RENT' && status === 'SOLD') return false;
      if (offerType === 'FOR_SALE' && status === 'RENTED') return false;
      return true;
    });
  }

  resetForm(): void {
    this.propertyForm = this.buildForm();
    this.steps = 1;
    this.selectMethod = '';
    this.productStateService.clearEditing();
  }

  changeMethod(method: 'computer' | 'mobile' | '') {
    this.selectMethod = method;
    this.enableContinueDetails();
  }

  fetchRegions() {
    this.locationService.getRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.ctr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching regions:', error);
      },
    });
  }

  selectRegion(region: string) {
    console.log('Region is', region);
    if (!region) return;
    const regionId = this.regions.find((r) => r.name_en === region)?.id;
    this.propertyForm.patchValue({
      location: {
        region_id: regionId,
      },
    });
  }

  selectDistrict(district: string) {
    console.log('District is', district);
    if (!district) return;
    return this.fetchDistricts(this.propertyForm.value.location.region_id).add(() => {
      const districtId = this.districts.list.find((d) => d.name_en === district)?.id;
      this.propertyForm.patchValue({
        location: {
          district_id: districtId,
        },
      });
      this.selectPlace((this.editingProperty() as any)?.location[2]);
    });
  }

  selectPlace(place: string) {
    if (!place) return;
    console.log('Place is', place);
    return this.fetchPlaces(this.propertyForm.value.location.district_id).add(() => {
      const placeId = this.places.list.find((p) => p.name_en === place)?.id;
      this.propertyForm.patchValue({
        location: {
          place_id: placeId,
        },
      });
    });
  }

  fetchDistricts($event: any | number) {
    const regionId = typeof $event === 'number' ? $event : $event.target.value;
    return this.locationService.getDistrictsByRegion(regionId).subscribe({
      next: (districts) => {
        this.districts = { available: true, list: districts };
        this.ctr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching districts:', error);
      },
    });
  }

  fetchPlaces($event: any | number) {
    const districtId = typeof $event === 'number' ? $event : $event.target.value;
    return this.locationService.getPlacesByDistrict(districtId).subscribe({
      next: (places) => {
        this.places = { available: true, list: places };
        this.ctr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching places:', error);
      },
    });
  }

  uploadProperty(action: 'publish' | 'draft') {
    const areaValue = String(this.propertyForm.value.area ?? '').replace(/[^0-9.]/g, '');
    const priceValue = String(this.propertyForm.value.price ?? '').replace(/,/g, '');
    this.propertyForm.patchValue({
      area: areaValue,
      price: priceValue,
    });
    if (action === 'draft') {
      this.propertyForm.patchValue({
        listingStatus: ListingStatus.DRAFT,
      });
      this.processUpload();
      return;
    }
    if (action === 'publish') {
      this.productApiService.getMediaCount(this.propertyForm.value.id).subscribe({
        next: (count) => {
          if (count < 3) {
            this.toastr.error('Please upload at least 3 images to publish the property.', 'Error', {
              timeOut: 3000,
            });
            return;
          }
          this.propertyForm.patchValue({
            listingStatus: ListingStatus.ACTIVE,
            occupancyStatus: OccupancyStatus.AVAILABLE,
          });
          this.processUpload();
        },
      });
    }
  }
  processUpload() {
    this.productStateService.updateEditing(this.propertyForm.value);
    this.productApiService.updateProperty(this.propertyForm.value).subscribe({
      next: () => {
        this.resetForm();
        this.closeModal.emit();
        this.updatePropertiesList.emit();
      },
      error: (error) => {
        console.error('Error uploading property:', error);
      },
    });
  }

  onClose() {
    this.closeModal.emit();
  }
  enableContinueDetails() {
    this.continueDetailsDisabled = false;
  }
  disableContinueDetails() {
    this.continueDetailsDisabled = true;
  }
  nextStep() {
    this.propertyForm.patchValue({
      id: this.editingProperty()?.id,
    });
    this.steps = 2;
  }
  previousStep() {
    this.steps = 1;
  }
}
