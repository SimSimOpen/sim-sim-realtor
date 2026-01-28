import { Component } from '@angular/core';
import { Common } from '../../shared/common';
import { BaseModalComponent } from '../../components/modal/baseModal';
import { propertiesList } from '../../shared/common-functions';
import { ModalComponent } from '../../components/modal/modal.component';
import { AddProperty } from '../../components/add-property-models/add-property/add-property';

@Component({
  selector: 'app-dashboard',
  imports: [ModalComponent, AddProperty],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard extends BaseModalComponent {
  isAddPropertyModalVisible: boolean = false;

  constructor(public common: Common) {
    super();
  }

  recentProperties = propertiesList;

  override openModal(): void {
    this.isAddPropertyModalVisible = true;
  }

  override closeModal(): void {
    this.isAddPropertyModalVisible = false;
  }
}
