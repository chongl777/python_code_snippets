import datetime as dt

import simplejson as json
import pandas as pd
import numpy as np

from books.security import Security
from books.analytics import BondAnalytic
from books import Dir


def json_default(o):
    if isinstance(o, (dt.date, dt.datetime, pd.Timestamp)):
        try:
            return o.strftime('%Y-%m-%dT%H:%M:%S')
        except:
            # return o.isoformat()
            return 'NaT'
    if isinstance(o, (np.int64, np.int32)):
        return int(o)
    if isinstance(o, Security):
        return o.to_dict()

    if isinstance(o, float):
        if o in [np.inf]:
            return None

    if isinstance(o, Dir):
        return o.value

    if isinstance(o, BondAnalytic):
        return None

    if isinstance(o, (np.bool_)):
        return bool(o)


class JSON:
    @staticmethod
    def dumps(x, default=json_default, ignore_nan=True, stringify_keys=False):
        x = JSON.stringify_keys(x) if stringify_keys else x
        return json.dumps(x, default=default, ignore_nan=ignore_nan)

    @staticmethod
    def loads(x):
        return json.loads(x)

    @staticmethod
    def stringify_keys(d):
        """Convert a dict's keys to strings if they are not."""
        if isinstance(d, (list, tuple)):
            return [JSON.stringify_keys(x) for x in d]

        elif isinstance(d, dict):
            for key in d.keys():

                # check inner dict
                if isinstance(d[key], (dict, list, tuple)):
                    value = JSON.stringify_keys(d[key])
                else:
                    value = d[key]

                # convert nonstring to string if needed
                if not isinstance(key, (str, int, bool)):
                    try:
                        d[str(key)] = value
                    except Exception:
                        try:
                            d[repr(key)] = value
                        except Exception:
                            raise

                    # delete old key
                    del d[key]
                else:
                    d[key] = value
        return d
