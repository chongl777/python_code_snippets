// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    version: 'v0.0.3 dev',
    msg_queue_config: {
        url: 'wss://10.92.1.8:15673/ws',
        fix_host: '/fix_uat',
        // fix_host: '/fix',
        // booking_host: '/test',
        booking_host: '/workstation',
        login: 'wfi',
        passcode: 'Westfield1234!',
        time_out: 1 * 60 * 1000,
        msg_queue: 'fix_msg_handle_queue',
    },
    auth: {
        authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        tokenUrl: 'https://westfieldinvestment.wfi.local/oauth/access_token/azuread',

        // userUrl: 'https://wfiubuntu01.wfi.local/test/user_info/azuread',
        // authUrl: 'https://wfiubuntu01.wfi.local/test/authenticate/azuread',
        // tokenUrl: 'https://wfiubuntu01.wfi.local/test/access_token/azuread',

        redirect: window.location.origin + '/#/callback',
        loginUrl: window.location.origin + '/#/login',
    },
    util: {
        downloadUrl: 'https://westfieldinvestment.wfi.local/oauth/utils/download_file',
    },
    urls: {
        downloadUrl: 'https://westfieldinvestment.wfi.local/oauth/utils/download_file',
        // booking_url: 'https://192.168.168.2:9991/',
        booking_url: 'https://westfieldinvestment.wfi.local/workstation/',
        pfmgmt_url: 'https://westfieldinvestment.wfi.local/pfmgmt/api/',
        // pfmgmt_url: 'https://192.168.168.2:9992/api/',
    },
    default_timeout: 1 * 30 * 1000,
    order_dialog_height: 750,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
