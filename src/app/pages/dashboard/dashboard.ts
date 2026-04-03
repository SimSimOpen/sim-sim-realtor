import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Common } from '../../shared/common';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { propertiesList } from '../../shared/common-functions';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditProperty } from '../../components/add-edit-property-models/add-edit-property/add-edit-property';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { Property } from '../../shared/models/properties';
import { EnvironmentTs } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { ViewProperty } from '../../components/view-property-models/view-property/view-property';
import { PaginationService } from '../../shared/services/pagination.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-dashboard',
  imports: [ModalComponent, AddEditProperty, CommonModule, ViewProperty],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard extends BaseModalComponent {
  isAddPropertyModalVisible: boolean = false;
  isViewPropertyModalVisible: boolean = false;

  public common = inject(Common);
  private productApiService = inject(ProductApiService);
  private productStateService = inject(ProductStateService);

  private ctr = inject(ChangeDetectorRef);
  public pagination = inject(PaginationService);

  ngOnInit() {
    this.fetchAllProperties();
  }

  recentProperties = propertiesList;

  fetchAllProperties() {
    this.productApiService
      .getAgentsProperties(this.pagination.page, this.pagination.size, this.pagination.sort)
      .subscribe({
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
    this.productStateService.clearEditing();
  }
  openViewPropertyModal(property: Property): void {
    this.productStateService.startEditing(property);
    this.isViewPropertyModalVisible = true;
  }
}
