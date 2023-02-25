import datetime as dt
from six import iteritems, itervalues

import simplejson as json
import pandas as pd
import numpy as np

from books.security import Security
from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqclient import MQClient, MQClientEngine
from mqrpc3.mqserver import route, broadcast, broadcast_bigsize


class JSON:
    @staticmethod
    def dumps(x):
        return json.dumps(x, default=json_default, ignore_nan=True)

    @staticmethod
    def loads(x):
        return json.loads(x)


def update_attr(new, orig):
    for k, v in iteritems(orig):
        if k not in new:
            new[k] = v
    return new


def strftime(t):
    try:
        return t.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return ''


def to_datetime(t, local='US/Eastern'):
    try:
        return pd.to_datetime(t).tz_localize(
            'utc').tz_convert(local).replace(tzinfo=None)
    except Exception:
        return None


def to_date(t):
    try:
        return pd.to_datetime(t).date()
    except Exception:
        return None


def json_default(o):
    if isinstance(o, (dt.date, dt.datetime, pd.Timestamp)):
        try:
            return o.strftime('%Y-%m-%dT%H:%M:%S')
        except:
            # return o.isoformat()
            return 'NaT'
    if isinstance(o, np.int64):
        return int(o)
    if isinstance(o, Security):
        return o.to_dict()
