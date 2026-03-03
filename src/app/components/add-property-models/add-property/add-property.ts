import { Component, EventEmitter, Output } from '@angular/core';
import { UploadFromComputer } from '../upload-from-computer';
import { SelectMethod } from '../select-method';
import { UploadFromMobile } from '../upload-from-mobile';
import { CommonModule } from '@angular/common';
import { amenitiesList } from '../../../shared/common-functions';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../shared/services/product.service';

@Component({
  selector: 'app-add-property',
  imports: [UploadFromComputer, UploadFromMobile, SelectMethod, CommonModule, ReactiveFormsModule],
  templateUrl: './add-property.html',
  styleUrl: './add-property.scss',
})
export class AddProperty {
  @Output() closeModal = new EventEmitter<any>();
  @Output() updatePropertiesList = new EventEmitter<any>();
  selectMethod: 'computer' | 'mobile' | '' = '';
  continueDetailsDisabled: boolean = true;
  steps: 1 | 2 = 1;
  amenities = amenitiesList;

  propertyForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
  ) {
    this.propertyForm = this.fb.group({
      id: [null],
      title: [''],
      description: [''],
      price: [''],
      numberOfRoom: [''],
      area: [''],
      address: [''],
      amenities: [[]],
    });
  }

  changeMethod(method: 'computer' | 'mobile' | '') {
    this.selectMethod = method;
    this.enableContinueDetails();
  }

  uploadProperty() {
    this.productService.updateProperty(this.propertyForm.value).subscribe({
      next: (response) => {
        console.log('Property updated successfully:', response);
        this.updatePropertiesList.emit();
        this.propertyForm.reset();
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
