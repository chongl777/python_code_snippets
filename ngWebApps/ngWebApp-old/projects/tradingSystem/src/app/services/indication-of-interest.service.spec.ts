import { TestBed } from '@angular/core/testing';

import { IndicationOfInterestDataSource } from './indication-of-interest.service';

describe('IndicationOfInterestDataSource', () => {
    let service: IndicationOfInterestDataSource;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IndicationOfInterestDataSource);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
