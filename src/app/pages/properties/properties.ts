import { ChangeDetectorRef, Component } from '@angular/core';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddProperty } from '../../components/add-property-models/add-property/add-property';
import { Property } from '../../shared/models/properties';
import { ProductService } from '../../shared/services/product.service';

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
    private ctr: ChangeDetectorRef,
  ) {
    super();
  }
  ngOnInit() {
    this.fetchAllProperties();
  }

  fetchAllProperties() {
    this.productService.getAllProperties(this.page, this.size, this.sort).subscribe({
      next: (properties) => {
        this.properties = properties.content;
        this.ctr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching properties:', error);
      },
    });
  }

  getPropertiesCoverImage(property: Property) {
    if (property.medias && property.medias.length > 0) {
      const coverImage = property.medias.find((media) => media.isCoverImage === true);
      return coverImage ? coverImage.mediaUrl : null;
    }
    return null;
  }

  override openModal(): void {
    this.isAddPropertyModalVisible = true;
  }

  override closeModal(): void {
    this.isAddPropertyModalVisible = false;
  }
}
