import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentMain } from './agent-main';

describe('AgentMain', () => {
  let component: AgentMain;
  let fixture: ComponentFixture<AgentMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentMain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
