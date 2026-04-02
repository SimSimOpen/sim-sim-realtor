import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { UploadFromComputer } from '../upload-from-computer';
import { SelectMethod } from '../select-method';
import { UploadFromMobile } from '../upload-from-mobile';
import { CommonModule } from '@angular/common';
import { amenitiesList } from '../../../shared/common-functions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../shared/services/product.service';
import { OnlyNumbers } from '../../../shared/utils/only-numbers';
import { MoneyFormatDirective } from '../../../shared/utils/money-format.directive';
import { AreaFormatDirective } from '../../../shared/utils/area-format.directive ';
import { LocationService } from '../../../shared/services/location.service';
import { District, Place, Region } from '../../../shared/models/properties';
import {
  ListingStatus,
  OccupancyStatus,
  OfferType,
  PropertyCategory,
  PropertyType,
} from '../../../shared/enums/PropertyStatus';
import { Common } from '../../../shared/common';
import { UploadedFiles } from '../uploaded-files';

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
export class AddEditProperty implements OnChanges {
  @Output() closeModal = new EventEmitter<any>();
  @Output() updatePropertiesList = new EventEmitter<any>();
  @Input() editProperty: boolean = false;
  @Input() editingProperty: any = null;
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
  places: { available: boolean; list: Place[] } = {
    available: false,
    list: [],
  };

  propertyForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private locationService: LocationService,
    private ctr: ChangeDetectorRef,
    public common: Common,
  ) {
    this.propertyForm = this.fb.group({
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
    });
    this.fetchRegions();
    this.fetchDistricts(11);
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['editProperty']) {
      if (this.editingProperty) {
        this.propertyForm.patchValue({
          id: this.editingProperty.id,
          title: this.editingProperty.title,
          description: this.editingProperty.description,
          price: this.editingProperty.price,
          numberOfRooms: this.editingProperty.numberOfRooms,
          area: this.editingProperty.area,
          floor: this.editingProperty.floor,
          totalFloors: this.editingProperty.totalFloors,
          offerType: this.editingProperty.offerType,
          category: this.editingProperty.category,
          type: this.editingProperty.type,
          listingStatus: this.editingProperty.listingStatus,
          occupancyStatus: this.editingProperty.occupancyStatus,
          location: {
            country: 'Uzbekistan',
            address: (this.editingProperty.location as any[])[3] || '',
          },
          amenities: {
            parking: this.editingProperty.amenities?.parking || false,
            garden: this.editingProperty.amenities?.garden || false,
            swimmingPool: this.editingProperty.amenities?.swimmingPool || false,
            gym: this.editingProperty.amenities?.gym || false,
            security: this.editingProperty.amenities?.security || false,
            elevator: this.editingProperty.amenities?.elevator || false,
            washingMachine: this.editingProperty.amenities?.washingMachine || false,
            airConditioning: this.editingProperty.amenities?.airConditioning || false,
            internet: this.editingProperty.amenities?.internet || false,
            refrigerator: this.editingProperty.amenities?.refrigerator || false,
            dishwasher: this.editingProperty.amenities?.dishwasher || false,
            microwave: this.editingProperty.amenities?.microwave || false,
            parkingSpace: this.editingProperty.amenities?.parkingSpace || false,
            tv: this.editingProperty.amenities?.tv || false,
            satellite: this.editingProperty.amenities?.satellite || false,
            furniture: this.editingProperty.amenities?.furniture || false,
          },
        });
        this.selectRegion((this.editingProperty.location as any[])[0]);
        this.selectDistrict((this.editingProperty.location as any[])[1]);
        this.ctr.detectChanges();
      } else {
        this.resetForm;
        this.steps = 1;
        this.selectMethod = '';
        this.ctr.detectChanges();
      }
    }
  }
  get filteredOccupancyStatuses(): string[] {
    const offerType = this.propertyForm.get('offerType')?.value;

    return this.occupancyStatuses.filter((status) => {
      if (offerType === 'FOR_RENT' && status === 'SOLD') return false;
      if (offerType === 'FOR_SALE' && status === 'RENTED') return false;
      return true;
    });
  }

  get resetForm() {
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
    const regionId = this.regions.find((r) => r.name_en === region)?.id;
    this.propertyForm.patchValue({
      location: {
        region_id: regionId,
      },
    });
  }

  selectDistrict(district: string) {
    console.log('District is', district);
    return this.fetchDistricts(this.propertyForm.value.location.region_id).add(() => {
      const districtId = this.districts.list.find((d) => d.name_en === district)?.id;
      this.propertyForm.patchValue({
        location: {
          district_id: districtId,
        },
      });
      this.selectPlace((this.editingProperty.location as any[])[2]);
    });
  }

  selectPlace(place: string) {
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

  uploadProperty() {
    const areaValue = String(this.propertyForm.value.area ?? '').replace(/[^0-9.]/g, '');
    const priceValue = String(this.propertyForm.value.price ?? '').replace(/,/g, '');
    this.propertyForm.patchValue({
      area: areaValue,
      price: priceValue,
    });
    this.productService.updateProperty(this.propertyForm.value).subscribe({
      next: (response) => {
        console.log('Property updated successfully:', response);
        this.updatePropertiesList.emit();
        this.resetForm;
        this.steps = 1;
        this.selectMethod = '';
        this.closeModal.emit();
      },
      error: (error) => {
        console.error('Error uploading property:', error);
      },
    });
  }

  updatePropertyId(id: number) {
    this.propertyForm.patchValue({ id });
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
    this.steps = 2;
  }
  previousStep() {
    this.steps = 1;
  }
}
