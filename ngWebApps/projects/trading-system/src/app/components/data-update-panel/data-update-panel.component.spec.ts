import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataUpdatePanelComponent } from './data-update-panel.component';

describe('DataUpdatePanelComponent', () => {
  let component: DataUpdatePanelComponent;
  let fixture: ComponentFixture<DataUpdatePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataUpdatePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataUpdatePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
