import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditProperty } from './add-edit-property';

describe('AddEditProperty', () => {
  let component: AddEditProperty;
  let fixture: ComponentFixture<AddEditProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditProperty],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
