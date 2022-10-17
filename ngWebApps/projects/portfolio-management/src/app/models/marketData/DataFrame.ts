export class DataFrame {
    public data: any[] = [];

    constructor(public index_name = null, public columns: any[]) {
    }

    public setData(data: any[]): DataFrame {
        this.data = data;
        return this;
    }

    get index(): any[] {
        return this.data.map(x => x[this.index_name]);
    }

    values(field: string): any[] {
        return this.data.map(x => x[field]);
    }

    toListData(): any {
        let res = {};
        res[this.index_name] = this.index;
        for (let x of this.columns) {
            res[x] = this.values(x);
        }
        return res;
    }

    join(df: DataFrame): DataFrame {
        let index = df.index.reduce((x, y) => x.add(y), new Set(this.index));
        let columns = Array.from(df.columns.reduce(
            (x, y) => x.add(y), new Set(this.columns)).values());

        let indexSort = Array.from(index.values()).sort((x: any, y: any) => x - y);
        let combinedData = indexSort.map(x => {
            let datum1 = this.data.filter(datum => datum[this.index_name] == x)[0] || {};
            let datum2 = df.data.filter(datum => datum[df.index_name] == x)[0] || {};

            let newData = Object.assign(datum1, datum2);
            return newData;
        });
        let rslt = (new DataFrame(this.index_name, columns)).setData(combinedData);
        return rslt;
    }
}
