import io
import uuid
import os
import asyncio
import msal
import json
import requests

from flask import Blueprint, flash, send_file
from flask import session, current_app, make_response
from flask import render_template, redirect, url_for, request
from flask_login import current_user, login_user, logout_user
# from flask_login import login_required
from werkzeug.urls import url_parse
from .models import User
from .forms import LoginForm

from auth.oauth import OAuthSignIn


bp = Blueprint(
    'auth', __name__,
    template_folder=os.path.dirname(os.path.abspath(__file__))+"/templates/",
    static_folder=os.path.dirname(os.path.abspath(__file__))+"/../static")


@bp.route('authenticate_user', methods=['GET', 'POST'])
def authenticate_user():
    token_cache = requests.data.get('token_cache', None)
    if token_cache is None:
        return None
    token = parase_token(token_cache)


@bp.route('/login', methods=['GET', 'POST'])
def login():
    token = get_token_from_cache()
    next_page = request.args.get('next', url_for('index', _external=True))
    if current_user.is_authenticated and token is not None:
        return redirect(next_page)

    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', category="login-failed")
            return redirect(url_for('auth.login', _external=True,
                                    next=next_page))

        # flash(user.initial, category="login-name")
        login_user(user, remember=form.remember_me.data)
        return redirect(next_page)

    return render_template(
        'login.html', title='Sign In', form=form, next=next_page)


@bp.route('/login_refresh', methods=['GET', 'POST'])
def login_refresh():
    next_page = request.args.get('next', url_for('index', _external=True))
    form = LoginForm()

    if form.validate_on_submit():
        user = User.query.filter_by(email=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', category="login-failed")
            return redirect(url_for('auth.login', _external=True,
                                    next=next_page))

        # flash(user.initial, category="login-name")
        login_user(user, remember=form.remember_me.data)
        return redirect(next_page)

    return render_template(
        'login.html', title='Sign In', form=form, next=next_page)


@bp.route('/close', methods=['GET', 'POST'])
def close():
    return render_template(
        'close.html', title='Close')


@bp.route('/signature/<user_id>.png', methods=['GET'])
def signature(user_id):
    user = User.query.filter_by(id=user_id).first()
    return send_file(io.BytesIO(user.signature_file), mimetype='image/gif')


@bp.route('/upload_sig', methods=['POST'])
def upload_sig():
    from .models import db
    binary = request.files['signature'].stream.read()
    user = User.query.filter_by(id=current_user.id).first()
    # user = User.query.filter_by(id=28).first()

    user.signature_file = binary
    db.session.commit()
    return ''


# @bp.route('/authenticate/<provider>', methods=['GET', 'POST'])
# def authenticate(provider):
#     state = session['state'] = str(uuid.uuid4())
#     credential = current_app.config['LOGIN_CREDENTIAL'][provider]
#     oauth = OAuthSignIn.get_provider(provider, credential)
#     next_page = request.args.get('next', '/index')
#     session['next_page'] = next_page
#     return oauth.authorize(state)


@bp.route('/authenticate/<provider>')
def authenticate(provider):
    authUrl = f'https://westfieldinvestment.wfi.local/oauth/authenticate/{provider}'
    # authUrl = f'https://192.168.168.2:9993/authenticate/{provider}'
    callback_uri = url_for('.oauth_callback', _external=True)

    next_page = request.args.get('next', '/index')
    session['redirect_page'] = next_page
    session['provider'] = provider

    uri = f"""{authUrl}?scope=sharepoint_scope&next={callback_uri}"""
    resp = make_response(redirect(uri))
    # resp.set_cookie('session', session.sid)
    return resp


@bp.route('/oauth_callback', methods=['GET', 'POST'])
def oauth_callback():
    state = request.args.get('state', None)
    session_id = request.args.get('session')

    assert state is not None, 'state is missing'
    resp = requests.get(
        'https://westfieldinvestment.wfi.local/oauth/load_token',
        # 'https://192.168.168.2:9993/load_token',
        params={'state': state},
        cookies={'session': session_id}, verify=False)

    if resp.status_code != 200:
        flash('Authentication failed. ' + resp.reason)
        return redirect(url_for('index'))
    cache = msal.SerializableTokenCache()
    cache.deserialize(resp.text)
    _save_cache(cache)

    access_token = cache.find('AccessToken')[0]['secret']
    az_username = cache.find('Account')[0]['username']

    # token = get_token_from_cache()
    # user_info = get_user_info(token['access_token'])
    user = User.query.filter_by(az_username=az_username).first()
    if not user:
        flask('User not created')
        redirect(url_for('index'))
    login_user(user, True)

    return redirect(session.get('redirect_page', '/index'))


@bp.route('/logout')
def logout():
    session.clear()
    logout_user()
    return redirect(url_for('index', _external=True))


@bp.route('/user')
def user():
    return render_template(
        'profile.html', title='Profile')


def _load_cache():
    cache = msal.SerializableTokenCache()
    if session.get("token_cache"):
        cache.deserialize(session["token_cache"])
    return cache


def _save_cache(cache):
    session["token_cache"] = cache.serialize()


def get_token_from_cache(cache=None):
    cache = cache or _load_cache()  # This web app maintains one cache per session
    if 'provider' not in session:
        return None
    provider = session['provider']
    credential = current_app.config['LOGIN_CREDENTIAL'][provider]
    oauth = OAuthSignIn.get_provider(provider, credential)
    return oauth.get_token_from_cache(cache)


def parase_token(token_cache):
    cache = msal.SerializableTokenCache()
    cache.deserialize(token_cache)

    if 'provider' not in session:
        return None
    provider = session['provider']
    credential = current_app.config['LOGIN_CREDENTIAL'][provider]
    oauth = OAuthSignIn.get_provider(provider, credential)
    return oauth.get_token_from_cache(cache)


def get_user_info(access_token):
    from settings.sp_settings import ctx_auth_sp360
    from office365.runtime.auth.oauth_token_provider import OAuthTokenProvider
    from office365.sharepoint.client_context import ClientContext
    try:
        ctx_auth_sp360.acquire_token(provider=OAuthTokenProvider(
            {'access_token': access_token}))
        ctx = ClientContext(ctx_auth_sp360.url, ctx_auth_sp360)
        user = ctx.web.current_user
        ctx.load(user)
        ctx.execute_query()
        return user
    except Exception as err:
        raise err
