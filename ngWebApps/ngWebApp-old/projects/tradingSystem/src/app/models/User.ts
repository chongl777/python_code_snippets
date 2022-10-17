export class User {
    id: number;
    email: string;
    username: string = 'Anonymous';
    initial: string;

    public constructor(profile?: Partial<User>) {
        if (profile) {
            Object.assign(this, profile);
        } else {
            this.initial = 'N/A';
        }
    }
}
