import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Etablisement } from './etablisement';

describe('Etablisement', () => {
  let component: Etablisement;
  let fixture: ComponentFixture<Etablisement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Etablisement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Etablisement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
