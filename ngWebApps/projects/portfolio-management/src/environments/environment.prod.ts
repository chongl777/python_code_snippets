export const environment = {
    production: true,

    urls: {
        trading_signal_url: "https://westfieldinvestment.wfi.local/pfmgmt/sec_signal",
        sec_info_url: "https://westfieldinvestment.wfi.local/pfmgmt/sec_profile",
    },

    msg_queue_config: {
        url: 'wss://10.92.1.8:15673/ws',
        login: 'wfi',
        event_host: '/fix',
        passcode: 'Westfield1234!',
        time_out: 1 * 60,
    },

    auth: {
        authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        tokenUrl: 'https://westfieldinvestment.wfi.local/oauth/access_token/azuread',
        logOutUrl: 'https://westfieldinvestment.wfi.local/oauth/log_out/azuread',
        loadTokenUrl: 'https://westfieldinvestment.wfi.local/oauth/load_token',

        redirect: window.location.origin + window.location.pathname + '#/callback',
        loginUrl: window.location.origin + window.location.pathname + '#/login',
    },
    version: '1.0',
};
