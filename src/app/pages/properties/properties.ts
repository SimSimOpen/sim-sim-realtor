import { Component } from '@angular/core';
import { propertiesList } from '../../shared/common-functions';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddProperty } from '../../components/add-property-models/add-property/add-property';

@Component({
  selector: 'app-properties',
  imports: [ModalComponent, AddProperty],
  templateUrl: './properties.html',
  styleUrl: './properties.scss',
})
export class Properties extends BaseModalComponent {
  isAddPropertyModalVisible: boolean = false;

  constructor() {
    super();
  }

  propertiesList = propertiesList;
  override openModal(): void {
    this.isAddPropertyModalVisible = true;
  }

  override closeModal(): void {
    this.isAddPropertyModalVisible = false;
  }
}
