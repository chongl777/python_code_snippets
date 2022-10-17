import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoiOrderComponent } from './ioi-order.component';

describe('IoiOrderComponent', () => {
  let component: IoiOrderComponent;
  let fixture: ComponentFixture<IoiOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IoiOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IoiOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
