import { ChangeDetectorRef, Component } from '@angular/core';
import { Common } from '../../shared/common';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { propertiesList } from '../../shared/common-functions';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditProperty } from '../../components/add-edit-property-models/add-edit-property/add-edit-property';
import { ProductService } from '../../shared/services/product.service';
import { Property } from '../../shared/models/properties';
import { EnvironmentTs } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { ViewProperty } from '../../components/view-property-models/view-property/view-property';

@Component({
  selector: 'app-dashboard',
  imports: [ModalComponent, AddEditProperty, CommonModule, ViewProperty],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard extends BaseModalComponent {
  isAddPropertyModalVisible: boolean = false;
  page: number = 0;
  size: number = 5;
  sort: string = 'id,desc';
  isViewPropertyModalVisible: boolean = false;
  selectedProperty: Property | null = null;

  constructor(
    public common: Common,
    private productService: ProductService,
    private ctr: ChangeDetectorRef,
  ) {
    super();
    this.fetchAllProperties();
  }

  recentProperties = propertiesList;

  fetchAllProperties() {
    this.productService.getAgentsProperties(this.page, this.size, this.sort).subscribe({
      next: (properties) => {
        this.recentProperties = properties.content.map((property) => {
          const publishedDate = (property as any)['updatedAt'];
          property.dateListed = publishedDate;
          property.address = (property as any)['location'][3]
            ? (property as any)['location'][3]
            : 'No address';
          return property;
        });
        this.ctr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching properties:', error);
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
    this.isViewPropertyModalVisible = false;
    this.selectedProperty = null;
  }
  openViewPropertyModal(property: Property): void {
    this.selectedProperty = property;
    this.isViewPropertyModalVisible = true;
  }
}
