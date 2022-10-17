export const environment = {
    production: true,
    //token_url: window.location.origin + window.location.pathname,
    token_url: './',
    token_callback: window.location.origin + window.location.pathname + '#/token_callback',
    auth: {
        authUrl: 'https://westfieldinvestment.wfi.local/oauth/authenticate/azuread',
        userUrl: 'https://westfieldinvestment.wfi.local/oauth/user_info/azuread',
        tokenUrl: 'https://westfieldinvestment.wfi.local/oauth/access_token/azuread',
        logOutUrl: 'https://westfieldinvestment.wfi.local/oauth/log_out/azuread',
        loadTokenUrl: 'https://westfieldinvestment.wfi.local/oauth/load_token',

        redirect: window.location.origin + window.location.pathname + '#/callback',
        loginUrl: window.location.origin + window.location.pathname + '#/login',
    },
};
