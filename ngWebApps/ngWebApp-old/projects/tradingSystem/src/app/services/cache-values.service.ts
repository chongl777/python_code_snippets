import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';


export class CacheableObject {

    data = {};
    constructor(
        private cacheValuesService: CacheValuesService,
        private key: string, private fields: string[]) { }

    public save() {
        this.cacheValuesService.save(this.key, this.data);
    }

    public save_from(obj: any) {
        for (let field of this.fields) {
            this.data[field] = obj[field];
        }
        this.save();
    }

    public load(cookie: string) {
        try {
            this.data = JSON.parse(cookie);
        } catch {
            this.data = {};
        }

        for (let field of this.fields) {

            Object.defineProperty(this, field, {
                get: () => { return this.data[field]; },
                set: (value: any) => {
                    if (this.data[field] !== value) {
                        this.data[field] = value;
                        this.save();
                    }
                },
            });
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class CacheValuesService {

    constructor(private cookieService: CookieService) {
    }

    public createCachable(key: string, fields: string[]): CacheableObject {
        let cookie = this.cookieService.get(key);
        let data = new CacheableObject(this, key, fields);
        data.load(cookie || '{}');
        return data;
    }

    public save(key: string, data: any) {
        this.cookieService.set(key, JSON.stringify(data), 365);
    }
}
