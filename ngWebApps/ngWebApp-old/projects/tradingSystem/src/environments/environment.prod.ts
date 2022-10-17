export const environment = {
    production: true,
    version: 'v0.2.0',

    msg_queue_config: {
        url: 'wss://10.92.1.8:15673/ws',
        fix_host: '/fix',
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

        // userUrl: 'https://localhost:5550/user_info/azuread',

        redirect: window.location.origin + window.location.pathname + '#/callback',
        loginUrl: window.location.origin + window.location.pathname + '#/login',
    },
    util: {
        downloadUrl: 'https://westfieldinvestment.wfi.local/oauth/utils/download_file',
    },
    urls: {
        downloadUrl: 'https://westfieldinvestment.wfi.local/oauth/utils/download_file',
        booking_url: 'https://westfieldinvestment.wfi.local/workstation/',
        pfmgmt_url: 'https://westfieldinvestment.wfi.local/pfmgmt/api/',
    },
    default_timeout: 1 * 60 * 1000,
    order_dialog_height: 750,
};
