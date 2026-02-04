import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileCameraUpload } from './mobile-camera-upload';

describe('MobileCameraUpload', () => {
  let component: MobileCameraUpload;
  let fixture: ComponentFixture<MobileCameraUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileCameraUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileCameraUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
