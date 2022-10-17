import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioLookthroughComponent } from './portfolio-lookthrough.component';

describe('PortfolioLookthroughComponent', () => {
  let component: PortfolioLookthroughComponent;
  let fixture: ComponentFixture<PortfolioLookthroughComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortfolioLookthroughComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortfolioLookthroughComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
