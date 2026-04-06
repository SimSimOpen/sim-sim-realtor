import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddEditProperty } from '../../components/add-edit-property-models/add-edit-property/add-edit-property';
import { PropertiesStats, Property } from '../../shared/models/properties';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';
import { EnvironmentTs } from '../../environments/environment';
import { Common } from '../../shared/common';
import { PaginationService } from '../../shared/services/pagination.service';
import { CommonModule } from '@angular/common';
import { ListingStatus, PropertyType } from '../../shared/enums/PropertyStatus';
import { ViewProperty } from '../../components/view-property-models/view-property/view-property';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-properties',
  imports: [ModalComponent, AddEditProperty, CommonModule, ViewProperty],
  templateUrl: './properties.html',
  styleUrl: './properties.scss',
  providers: [PaginationService],
})
export class Properties extends BaseModalComponent {
  isAddEditPropertyModalVisible: boolean = false;
  isViewPropertyModalVisible: boolean = false;

  properties: Property[] = [];
  propertiesStats: PropertiesStats | null = null;

  private productApiService = inject(ProductApiService);
  private productStateService = inject(ProductStateService);
  private toast = inject(ToastrService);
  public common = inject(Common);
  public pagination = inject(PaginationService);
  private ctr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.fetchAllProperties();
    this.fetchPropertiesStats();
  }

  fetchAllProperties() {
    this.productApiService
      .getAgentsProperties(this.pagination.page, this.pagination.size, this.pagination.sort)
      .subscribe({
        next: (properties) => {
          this.pagination.totalCounts = properties.totalElements;
          this.pagination.totalPages = properties.totalPages;
          this.properties = properties.content.map((property) => {
            const place = (property as any)['location'][0];
            const district = (property as any)['location'][1];
            const region = (property as any)['location'][2];
            const publishedDate = (property as any)['updatedAt'];
            property.dateListed = publishedDate;
            return { ...property, place, district, region };
          });
          this.ctr.detectChanges();
        },
        error: () => {
          this.toast.error('Error fetching properties', 'Error');
        },
      });
  }
  fetchPropertiesStats() {
    this.productApiService.getPropertiesStats().subscribe({
      next: (stats) => {
        this.propertiesStats = stats;
      },
      error: () => {
        this.toast.error('Error fetching properties stats', 'Error');
      },
    });
  }

  deleteProperty(id: any) {
    this.productApiService.deleteProduct(id).subscribe({
      next: (res) => {
        this.toast.info('Property was deleted!', 'Info');
        this.fetchAllProperties();
        this.fetchPropertiesStats();
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
  get isEditingProperty() {
    return this.productStateService.editingProperty() !== null;
  }

  openAddPropertyModal(): void {
    this.isAddEditPropertyModalVisible = true;
  }
  editProperty(property: Property): void {
    this.productStateService.startEditing(property);
    this.isAddEditPropertyModalVisible = true;
  }
  openViewPropertyModal(property: Property): void {
    this.productStateService.startEditing(property);
    this.isViewPropertyModalVisible = true;
  }
  override closeModal(): void {
    this.isAddEditPropertyModalVisible = false;
    this.isViewPropertyModalVisible = false;
    this.productStateService.clearEditing();
  }
  get paginationRange() {
    var from = this.pagination.page * this.pagination.size + 1;
    var to = this.pagination.size * (this.pagination.page + 1);
    var totalProperties =
      this.pagination.totalCounts > this.pagination.size ? this.pagination.totalCounts : 'all';
    return { from: from, to: to, total: totalProperties };
  }
  prevPage() {
    if (this.pagination.prevPage()) this.fetchAllProperties();
  }
  nextPage() {
    if (this.pagination.nextPage()) this.fetchAllProperties();
  }
  publishedDate(property: Property) {
    if (property.listingStatus == ListingStatus.ACTIVE) return property.dateListed;
    return '';
  }

  get allStatuses() {
    return Object.values(ListingStatus);
  }
  get allTypes() {
    return Object.values(PropertyType);
  }
}
