import { Component, EventEmitter, Output } from '@angular/core';
import { UploadFromComputer } from '../upload-from-computer';
import { SelectMethod } from '../select-method';
import { UploadFromMobile } from '../upload-from-mobile';
import { CommonModule } from '@angular/common';
import { amenitiesList } from '../../../shared/common-functions';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-property',
  imports: [UploadFromComputer, UploadFromMobile, SelectMethod, CommonModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.scss',
})
export class AddProperty {
  @Output() closeModal = new EventEmitter<any>();
  selectMethod: 'computer' | 'mobile' | '' = '';
  continueDetailsDisabled: boolean = true;
  steps: 1 | 2 = 1;
  amenities = amenitiesList;

  propertyForm: FormGroup;
  constructor(private fb: FormBuilder) {
    this.propertyForm = this.fb.group({
      id: [null],
      title: [''],
      description: [''],
      price: [''],
      address: [''],
      bedrooms: [''],
      bathrooms: [''],
      area: [''],
      amenities: [[]],
    });
  }

  changeMethod(method: 'computer' | 'mobile' | '') {
    this.selectMethod = method;
    this.enableContinueDetails();
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
