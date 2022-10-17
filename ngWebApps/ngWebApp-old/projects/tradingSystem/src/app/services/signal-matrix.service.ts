import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpControllerService } from './http-controller.service';


export class MatrixData {
    public signalData: number[][] = [];
    public x_axis: number[];
    public y_axis: number[];

    constructor(private data: any[]) {
        this.x_axis = [... new Set(this.data.map(x => x['signal_1']))].sort((x, y) => x - y);
        this.y_axis = [... new Set(this.data.map(x => x['signal_2']))].sort((x, y) => x - y);
        this.signalData = this.x_axis.map(x => this.y_axis.map(x => null));

        for (let datum of this.data) {
            let i = datum['signal_1'] == -1 ? 0 : datum['signal_1'];
            let j = datum['signal_2'] == -1 ? 0 : datum['signal_2'];
            this.signalData[i][j] = datum['signal_strength'];
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class SignalMatrixService {

    private matrixCache: { [matrix_id: number]: MatrixData } = {};
    public loadingMatrix$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public loadingMeta$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    public loading$: Observable<boolean>;
    public signalMeta: any[];
    public matrixMeta: any[];

    constructor(private httpService: HttpControllerService) {
        this.loading$ = merge(
            this.loadingMatrix$, this.loadingMeta$).pipe(
                map(() => {
                    console.log(this.loadingMatrix$.getValue(), this.loadingMeta$.getValue())
                    return this.loadingMatrix$.getValue() || this.loadingMeta$.getValue();
                }),
            );
        this.loadMatrixMeta();
    }

    ngOnDestroy() {
        console.log('signal-mat ngOnDestroy: cleaning up...');
    }


    public async reload(): Promise<void> {
        this.matrixCache = {};
        await this.loadMatrixMeta();
    }

    public async loadMatrixMeta(): Promise<void> {
        try {
            this.loadingMeta$.next(true);
            let resp = await this.httpService.loadSignalMatrixMeta();
            this.signalMeta = resp['signal_meta'];
            this.matrixMeta = resp['matrix_meta'];

            this.loadingMeta$.next(false);
        } catch (err) {
            this.loadingMeta$.error(err);
            throwError(err);
        } finally {
            this.loadingMeta$.next(false);
        }
    }

    public async getMatrixData(matrix_id: number): Promise<MatrixData> {
        try {
            this.loadingMatrix$.next(true);
            if (!(matrix_id in this.matrixCache)) {
                let data = await this.httpService.loadSignalMatrix(matrix_id);
                this.matrixCache[matrix_id] = new MatrixData(data)
            }
            return this.matrixCache[matrix_id]
        } catch (err) {
            throwError(err);
        } finally {
            this.loadingMatrix$.next(false);
        }
    }
}
