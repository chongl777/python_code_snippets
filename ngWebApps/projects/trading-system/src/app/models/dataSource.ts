
export const PRIORITY = {
    0: 0,
    4: 1,
    1: 2,
    2: 3,
    19: 4,
};


class GenericData<T> {
    private source_code: number;
    private _data: { [date: string]: T } = {};
    public latest_data: T;
    public prev_data: T;

    constructor(source_code: number) {
        this.source_code = source_code;
    }

    public process_data(date: string, data: any): void {
        this._data[date] = {
            date: new Date(date + "T00:00:00"), ...data,
            t_date: new Date(data['t_date']),
            source_code: this.source_code
        };
    }

    update(): void {
        let array = this.to_array();
        array.sort((x, y) => y['t_date'] - x['t_date']);
        this.latest_data = array[0];

        let prev_date = new Date();
        prev_date.setDate(prev_date.getDate() - 1);
        prev_date.setHours(23);
        prev_date.setMinutes(59);
        this.prev_data = array.filter(x => x['t_date'] <= prev_date)[0];
    }

    public to_array(): T[] {
        return Object.values(this._data);
    }
}

class MultiSrcDataSource<T>{
    protected _data: { [source_code: number]: GenericData<T> } = {};
    public composite: T;
    public prev_composite: T;

    public process_data(source_code: number, data: any): void {
        if (!this._data.hasOwnProperty(data)) {
            this._data[source_code] = new GenericData(source_code);
        }
        Object.keys(data).forEach(x => this._data[source_code].process_data(x, data[x]));
        this._data[source_code].update();
    }

    public to_array(): any[] {
        return Object.values(this._data).map(x => x.to_array()).reduce((x, y) => x.concat(y));
    }

    public update_composite(): void {
        let array = Object.values(this._data);
        if (array.length == 0) {
            return;
        }
        let data = array.map(x => x.to_array()).reduce((x, y) => x.concat(y));
        data.sort((x, y) => {
            let c = y['date'] - x['date'];
            if (c != 0) {
                return c
            }
            else {
                return x['priority'] - y['priority'];
            }
        });

        this.composite = data[0];
        let prev_date = new Date();
        prev_date.setDate(prev_date.getDate() - 1);
        prev_date.setHours(23);
        prev_date.setMinutes(59);

        this.prev_composite = data.filter(x => x['date'] <= prev_date)[0];
    }

    public get_latest_data_with_diff(source_code: number, field: string): any {
        try {
            let latest = this._data[source_code].latest_data || {};
            let prev = this._data[source_code].prev_data;
            try {
                latest['diff'] = latest[field] - prev[field];
            } catch (err) {
                latest['diff'] = 0;
            }
            return latest || {};
        } catch (err) {
            return {};
        }
    }
}

export class PriceDataSource<T> extends MultiSrcDataSource<T> {
    processData(json: Object): void {
        let sources = Object.keys(json)
        if (sources.length > 0) {
            sources.forEach(x => this.process_data(parseInt(x), json[x]));
            // if (Object.values(Object.values(json)[0])[0]['security_id'] == 22295) {
            //     console.log(sources[0]);
            // }
            this.update_composite();
        }
    }

    public get_latest_data(source_code: number): any {
        return this.get_latest_data_with_diff(source_code, 'price');
        // try {

        //     let latest = this._data[source_code].latest_data;
        //     let prev = this._data[source_code].prev_data;
        //     try {
        //         latest['diff'] = latest['price'] - prev['price'];
        //     } catch (err) {
        //         latest['diff'] = 0;
        //     }
        //     return latest
        // } catch (err) {
        //     return {};
        // }
    }

    public update_composite(): void {
        let array = Object.values(this._data);
        if (array.length == 0) {
            return;
        }
        let data = array.map(x => x.to_array()).reduce((x, y) => x.concat(y));

        data.forEach(x => x['priority'] = PRIORITY[x['source_code']])
        data.sort((x, y) => {
            let c = y['date'] - x['date'];
            if (c != 0) {
                return c
            }
            else {
                return x['priority'] - y['priority'];
            }
        });

        this.composite = data[0];
        let prev_date = new Date();
        prev_date.setDate(prev_date.getDate() - 1);
        prev_date.setHours(23);
        prev_date.setMinutes(59);

        this.prev_composite = data.filter(x => x['date'] <= prev_date)[0];
    }

    get composite_price(): any {
        return this.composite || {};
    }

    get composite_diff(): number {
        // console.log(this);
        // if (this.composite['security_id'] == 192) {
        //     console.log(this);
        // }

        try {
            return this.composite['price'] - this.prev_composite['price'];
        } catch (err) {
            return null;
        }
    }
}


export class YieldDataSource {
    public ytw = new MultiSrcDataSource();
    public ytm = new MultiSrcDataSource();
    public ytf = new MultiSrcDataSource();

    constructor() {
    }

    processData(json: Object): void {
        if (json.hasOwnProperty('ytm')) {
            Object.keys(json['ytm']).forEach(x => this.ytm.process_data(parseInt(x), json['ytm'][x]));
            this.ytm.update_composite();
        }

        if (json.hasOwnProperty('ytw')) {
            Object.keys(json['ytw']).forEach(x => this.ytw.process_data(parseInt(x), json['ytw'][x]));
            this.ytw.update_composite();
        }

        if (json.hasOwnProperty('ytf')) {
            Object.keys(json['ytf']).forEach(x => this.ytf.process_data(parseInt(x), json['ytf'][x]));
            this.ytf.update_composite();
        }
    }

    public get_latest_ytw(source_code: number): any {
        return this.ytw.get_latest_data_with_diff(source_code, 'yld');
    }

    get composite_ytm(): any {
        return this.ytm.composite || {};
    }

    get composite_ytw(): any {
        return this.ytw.composite || {};
    }

    get composite_ytf(): any {
        return this.ytf.composite || {};
    }

    get composite_ytw_diff(): number {
        try {
            return this.composite_ytw['yld'] - this.ytw.prev_composite['yld'];
        } catch (err) {
            return null;
        }
    }
}
