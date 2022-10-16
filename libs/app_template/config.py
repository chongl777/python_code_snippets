import os
from sqlutil.engines import engine


class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = engine.url
    SQLALCHEMY_POOL_RECYCLE = 360
    SESSION_TYPE = "sqlalchemy"
    SESSION_SQLALCHEMY_TABLE = "flask_sessions"
    SESSION_FILE_DIR = os.environ.get('SESSION_FILE_DIR', './flask_session')

    LOGIN_CREDENTIAL = {
        'azuread': {
            'consumer_id': '06b7aa09-a2ef-4eed-b81e-6df3def2a939',
            'consumer_secret': 'CrsYP1oNO?EhLaCr8Xc7uNJl3C.oXi*.',
            'tenant_id': '6a387a97-a3e7-417b-9405-6a9bafd77f9c',
            'scope': [
                "https://westfieldinvestmentllc.sharepoint.com/.default"
            ]
        }
    }
