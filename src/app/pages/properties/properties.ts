import { ChangeDetectorRef, Component } from '@angular/core';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddProperty } from '../../components/add-property-models/add-property/add-property';
import { Property } from '../../shared/models/properties';
import { ProductService } from '../../shared/services/product.service';
import { ToastrService } from 'ngx-toastr';
import { EnvironmentTs } from '../../environments/environment';
import { Common } from '../../shared/common';

@Component({
  selector: 'app-properties',
  imports: [ModalComponent, AddProperty],
  templateUrl: './properties.html',
  styleUrl: './properties.scss',
})
export class Properties extends BaseModalComponent {
  isAddPropertyModalVisible: boolean = false;

  properties: Property[] = [];
  page: number = 0;
  size: number = 10;
  sort: string = 'id,desc';

  constructor(
    private productService: ProductService,
    private toast: ToastrService,
    private ctr: ChangeDetectorRef,
    public common: Common,
  ) {
    super();
  }
  ngOnInit() {
    this.fetchAllProperties();
  }

  fetchAllProperties() {
    this.productService.getAllProperties(this.page, this.size, this.sort).subscribe({
      next: (properties) => {
        this.properties = properties.content.map((property) => {
          const place = (property as any)['location'][0];
          const district = (property as any)['location'][1];
          const region = (property as any)['location'][2];
          return { ...property, place, district, region };
        });
        this.ctr.detectChanges();
      },
      error: () => {
        this.toast.error('Error fetching properties', 'Error');
      },
    });
  }

  deleteProperty(id: any) {
    this.productService.deleteProduct(id).subscribe({
      next: (res) => {
        this.toast.info('Property was deleted!', 'Info');
        this.fetchAllProperties();
        this.ctr.detectChanges();
      },
      error: () => {
        this.toast.error('Error fetching properties', 'Error');
      },
    });
  }

  getPropertiesCoverImage(property: Property) {
    var defaultPath = `${EnvironmentTs.MEDIA_URL}/real-estate-media/default/house.png`;
    if (property.medias && property.medias.length > 0) {
      const coverImage = property.medias.find((media) => media.isCoverImage === true);
      return coverImage ? coverImage.mediaUrl : defaultPath;
    }
    return defaultPath;
  }

  override openModal(): void {
    this.isAddPropertyModalVisible = true;
  }

  override closeModal(): void {
    this.isAddPropertyModalVisible = false;
  }
}
