import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugMsgComponent } from './debug-msg.component';

describe('DebugMsgComponent', () => {
  let component: DebugMsgComponent;
  let fixture: ComponentFixture<DebugMsgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DebugMsgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DebugMsgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
