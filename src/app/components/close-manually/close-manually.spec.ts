import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseManually } from './close-manually';

describe('CloseManually', () => {
  let component: CloseManually;
  let fixture: ComponentFixture<CloseManually>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloseManually]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloseManually);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
