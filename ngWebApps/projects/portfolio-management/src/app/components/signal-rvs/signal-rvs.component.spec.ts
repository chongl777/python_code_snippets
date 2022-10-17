import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalEMCComponent } from './signal-emc.component';

describe('SignalEMCComponent', () => {
  let component: SignalEMCComponent;
  let fixture: ComponentFixture<SignalEMCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignalEMCComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignalEMCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
