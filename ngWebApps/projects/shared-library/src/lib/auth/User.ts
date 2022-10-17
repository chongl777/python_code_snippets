export class User {
    id: number;
    email: string;
    username: string = 'Anonymous';
    initial: string;
    az_username: string;
    email_signature: string;

    public constructor(profile?: Partial<User>) {
        if (profile) {
            Object.assign(this, profile);
        } else {
            this.initial = 'N/A';
        }
    }
}
