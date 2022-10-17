import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatTableExpandableComponent } from './mat-table-expandable.component';

describe('MatTableExpandableComponent', () => {
  let component: MatTableExpandableComponent;
  let fixture: ComponentFixture<MatTableExpandableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatTableExpandableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatTableExpandableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
