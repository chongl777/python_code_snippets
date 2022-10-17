import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoiListComponent } from './ioi-list.component';

describe('IoiListComponent', () => {
  let component: IoiListComponent;
  let fixture: ComponentFixture<IoiListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IoiListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IoiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
