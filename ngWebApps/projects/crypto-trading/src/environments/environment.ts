// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    version: '0.1',
    auth: {
        authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        tokenUrl: 'https://westfieldinvestment.wfi.local/oauth/access_token/azuread',
        logOutUrl: 'https://westfieldinvestment.wfi.local/oauth/log_out/azuread',
        loadTokenUrl: 'https://westfieldinvestment.wfi.local/oauth/load_token',

        redirect: window.location.origin + window.location.pathname + '#/callback',
        loginUrl: window.location.origin + window.location.pathname + '#/login',
    },
    msg_queue_config: {
        url: 'wss://10.92.1.8:15673/ws',
        login: 'wfi',
        host: '/crypto_uat',
        passcode: 'Westfield1234!',
        time_out: 1 * 60 * 1000,
    },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
