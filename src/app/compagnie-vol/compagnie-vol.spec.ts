import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompagnieVol } from './compagnie-vol';

describe('CompagnieVol', () => {
  let component: CompagnieVol;
  let fixture: ComponentFixture<CompagnieVol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompagnieVol]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompagnieVol);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
