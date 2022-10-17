import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoiStatusComponent } from './ioi-status.component';

describe('IoiStatusComponent', () => {
  let component: IoiStatusComponent;
  let fixture: ComponentFixture<IoiStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IoiStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IoiStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
