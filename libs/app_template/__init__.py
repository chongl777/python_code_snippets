import os
from datetime import datetime
import pickle
import json

from flask import Flask, jsonify, send_from_directory, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_session import Session


this_folder = os.path.dirname(os.path.abspath(__file__))
db = SQLAlchemy()
loginMgmr = LoginManager()


@loginMgmr.user_loader
def load_user(user_id):
    from .auth.models import User
    return User.query.get(int(user_id))


class InvalidUsage(Exception):
    status_code = 500

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        if isinstance(message, Exception):
            message = str(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


class AppCached(db.Model):
    __tablename__ = 'flask_cache'
    __bind_key__ = 'cache'
    # app_id = db.Column(db.Integer, primary_key=True)
    field = db.Column(db.String(120), primary_key=True)
    value = db.Column(db.LargeBinary, )
    last_update = db.Column(db.DateTime, )
    need_update = db.Column(db.Boolean)

    @staticmethod
    def create_cache(field, value):
        cache = AppCached(
            field=field, value=pickle.dumps(value),
            last_update=datetime.now(), need_update=False)
        db.session.add(cache)
        db.session.commit()
        return cache

    @staticmethod
    def update_cache(cache, value):
        cache.value = pickle.dumps(value)
        cache.need_update = False
        cache.last_update = datetime.now()
        db.session.commit()
        return cache


class AuthenticationError(Exception):
    pass


def create_app(name, config):
    app = Flask(
        name, template_folder=this_folder+"/templates",
        static_folder=this_folder+"/static")
    app.config.from_object(config)
    Session(app)

    # app.jinja_env.filters['os'] = os
    # @app.template_filter('os')
    # def fn(s):
    #     return os
    app.context_processor(lambda x=None: dict(os=os, json=json))

    db.init_app(app)
    if app.config['SQLALCHEMY_BINDS'] is None:
        app.config['SQLALCHEMY_BINDS'] = {'cache': 'sqlite:///:memory:'}

    with app.app_context():
        db.create_all(bind='cache')

    loginMgmr.init_app(app)

    # bootstrap.init_app(app)

    @app.before_first_request
    def activate_job():
        # loginMgmr.login_view = os.environ.get(
        #     'AUTH_LOGIN', url_for('auth.login', _external=True))
        # loginMgmr.refresh_view = os.environ.get(
        #     'AUTH_LOGIN_REFRESH',
        #     url_for('auth.login_refresh', _external=True))
        pass

    from .auth import bp as auth_bp
    from .auth import get_token_from_cache

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.get_token_from_cache = get_token_from_cache

    @app.errorhandler(InvalidUsage)
    def handle_invalid_usage(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.route('/favicon.ico')
    def favicon():
        return send_from_directory(
            os.path.join(this_folder, 'static/images'),
            'favicon.ico', mimetype='image/vnd.microsoft.icon')

    return app


def init_app(app):
    app.template_folder = this_folder+"/templates"
    app.static_folder = this_folder+"/static"
    Session(app)

    # app.jinja_env.filters['os'] = os
    # @app.template_filter('os')
    # def fn(s):
    #     return os
    app.context_processor(lambda x=None: dict(os=os, json=json))

    db.init_app(app)
    if app.config['SQLALCHEMY_BINDS'] is None:
        app.config['SQLALCHEMY_BINDS'] = {'cache': 'sqlite:///:memory:'}

    with app.app_context():
        db.create_all(bind='cache')

    loginMgmr.init_app(app)

    # bootstrap.init_app(app)

    @app.before_first_request
    def activate_job():
        loginMgmr.login_view = url_for('auth.login', _external=True)
        loginMgmr.refresh_view = url_for('auth.login_refresh', _external=True)
        # loginMgmr.login_view = os.environ.get(
        #     'AUTH_LOGIN', url_for('auth.login', _external=True))
        # loginMgmr.refresh_view = os.environ.get(
        #     'AUTH_LOGIN_REFRESH',
        #     url_for('auth.login_refresh', _external=True))

    from .auth import bp as auth_bp
    from .auth import get_token_from_cache

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.get_token_from_cache = get_token_from_cache

    @app.errorhandler(InvalidUsage)
    def handle_invalid_usage(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.exception(error)
        response = jsonify(str(error))
        response.status_code = 400
        return response

    @app.teardown_appcontext
    def teardown_appcontext(exception):
        if exception:
            db.session.rollback()
        try:
            db.session.commit()
        except Exception as e:
            app.logger.exception(e)

    # @app.teardown_request
    # def teardown_request_func(error=None):
    #     if error:
    #         "asdf"

    @app.route('/favicon.ico')
    def favicon():
        return send_from_directory(
            os.path.join(this_folder, 'static/images'),
            'favicon.ico', mimetype='image/vnd.microsoft.icon')

    return app
