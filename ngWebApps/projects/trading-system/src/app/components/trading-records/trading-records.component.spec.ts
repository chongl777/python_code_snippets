import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingRecordsComponent } from './trading-records.component';

describe('TradingRecordsComponent', () => {
  let component: TradingRecordsComponent;
  let fixture: ComponentFixture<TradingRecordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TradingRecordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradingRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
