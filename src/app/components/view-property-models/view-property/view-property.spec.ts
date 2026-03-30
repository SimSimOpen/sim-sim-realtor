import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewProperty } from './view-property';

describe('ViewProperty', () => {
  let component: ViewProperty;
  let fixture: ComponentFixture<ViewProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewProperty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
