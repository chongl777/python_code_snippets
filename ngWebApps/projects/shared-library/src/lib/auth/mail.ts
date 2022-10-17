export type Recipient = { display: string, address: string };


export class Mail {
    constructor(
        public msg_id: string,
        public subject: string,
        public sender: Recipient,
        public created: Date,
        public to: Recipient[],
        public cc: Recipient[],
        public body: string,
        public isRead: boolean,
        public hasAttachments: boolean,
        public flagged: boolean,
        public attachments: { 'name': string, 'contentBytes': string }[],
    ) { }

    public get recipients() {
        return this.to.map(x => x.display).join("; ");
    }

    public get createdDate(): Date {
        return new Date(this.created.getFullYear(), this.created.getMonth(), this.created.getDate());
    }
}
