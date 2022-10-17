// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    version: 'v1.0.3',
    msg_queue_config: {
        url: 'wss://10.92.1.8:15673/ws',
        // url: 'wss://wfiubuntu01.wfi.local:15673/ws',

        // fix_host: '/fix_uat',
        fix_host: '/fix',
        booking_host: '/workstation',
        // booking_host: '/test',
        login: 'wfi',
        passcode: 'Westfield1234!',
        time_out: 1 * 60 * 1000,
        msg_queue: 'fix_msg_handle_queue',
    },
    auth: {
        authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        logOutUrl: 'https://westfieldinvestment.wfi.local/oauth/log_out/azuread',
        emailUrl: 'https://westfieldinvestment.wfi.local/oauth/utils',

        // authUrl: 'https://192.168.168.2:9993/authenticate/azuread',
        // userUrl: 'https://192.168.168.2:9993/user_info/azuread',
        // logOutUrl: 'https://192.168.168.2:9993/log_out/azuread',
        // emailUrl: 'https://192.168.168.2:9993/utils',

        redirect: window.location.origin + '/#/callback',
        loginUrl: window.location.origin + '/#/login',
    },
    util: {
        downloadUrl: 'https://wfiubuntu01.wfi.local/test/utils/download_file',
    },
    urls: {
        // downloadUrl: 'https://westfieldinvestment.wfi.local/oauth/utils/download_file',
        popup_url: 'https://localhost:4211/#/',
        security_url: 'https://localhost:4211/#/security',
        booking_url: 'https://westfieldinvestment.wfi.local/workstation/',
        // booking_url: 'https://192.168.168.2:9998/',
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
