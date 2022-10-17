export const environment = {
    production: true,
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
