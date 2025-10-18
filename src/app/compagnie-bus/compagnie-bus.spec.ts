import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompagnieBus } from './compagnie-bus';

describe('CompagnieBus', () => {
  let component: CompagnieBus;
  let fixture: ComponentFixture<CompagnieBus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompagnieBus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompagnieBus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
