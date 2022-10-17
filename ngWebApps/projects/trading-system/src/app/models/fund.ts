import { Serializable } from './serializable';


export class Fund implements Serializable<Fund> {
    public fundName: string;

    constructor(public readonly fundID: number) {
        this.fundID = fundID;
    }

    deserialize(json: any): Fund {
        this.fundName = json['fund_name'];
        return this;
    }
}
