import { TestBed } from '@angular/core/testing';

import { SignalMatrixService } from './signal-matrix.service';

describe('SignalMatrixService', () => {
  let service: SignalMatrixService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalMatrixService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
