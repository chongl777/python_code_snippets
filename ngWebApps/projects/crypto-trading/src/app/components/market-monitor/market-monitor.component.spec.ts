import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketMonitorComponent } from './market-monitor.component';

describe('MarketMonitorComponent', () => {
  let component: MarketMonitorComponent;
  let fixture: ComponentFixture<MarketMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketMonitorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
