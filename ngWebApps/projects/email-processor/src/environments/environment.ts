// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    token_url: 'https://192.168.168.2:9992/',
    token_callback: window.location.origin + '/#/token_callback',

    auth: {
        // authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        // userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        // logOutUrl: 'https://westfieldinvestment.wfi.local/oauth/log_out/azuread',
        // loadTokenUrl: 'https://westfieldinvestment.wfi.local/oauth/load_token',

        authUrl: 'https://192.168.168.2:9993/authenticate/azuread',
        userUrl: 'https://192.168.168.2:9993/user_info/azuread',
        logOutUrl: 'https://192.168.168.2:9993/log_out/azuread',
        loadTokenUrl: 'https://192.168.168.2:9993/load_token',

        redirect: window.location.origin + '/#/callback',
        loginUrl: window.location.origin + '/#/login',
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
