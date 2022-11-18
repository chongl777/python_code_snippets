#!/usr/bin/env python
# encoding: utf8
# author: Chong Liu
import calendar
import logging
import pandas as pd
from datetime import datetime
logger = logging.getLogger('daycounter')


def daysOfYear(yr):
    if hasattr(yr, '__iter__'):
        return pd.np.array([daysOfYear(x) for x in yr])
    else:
        return 366 if calendar.isleap(yr) else 365


# day counter
class DayCounter(object):
    def __init__(self, imp):
        self._imp = imp

    def day_count(self, d1, d2, **kargs):
        return self._imp.day_count(d1, d2, **kargs)

    def year_fraction(self, d1, d2, **kargs):
        return self._imp.year_fraction(d1, d2, **kargs)


class Actual360(object):
    class Impl:
        @staticmethod
        def day_count(d1: datetime, d2: datetime, **kargs):
            return (d2-d1).days

        @staticmethod
        def year_fraction(d1: datetime, d2: datetime, **kargs):
            return Actual360.Impl.day_count(d1, d2) / 360.0

    class Impl_Array:
        @staticmethod
        def day_count(d1, d2, **kargs):
            return (d2-d1).dt.days

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Actual360.Impl_Array.day_count(d1, d2) / 360.0


class Actual365:
    class Impl:
        @staticmethod
        def day_count(d1, d2, **kargs):
            return (d2-d1).days

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Actual360.Impl.day_count(d1, d2) / 365.0

    class Impl_Array:
        @staticmethod
        def day_count(d1, d2, **kargs):
            return (d2-d1).dt.days

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Actual360.Impl_Array.day_count(d1, d2) / 365.0


class ActualActual:
    class Impl:
        @staticmethod
        def day_count(d1, d2, **kargs):
            return (d2-d1).days

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            if d1.year == d2.year:
                return Actual360.Impl.day_count(d1, d2) / daysOfYear(d1.year)
            else:
                flg = d2.year > d1.year
                d2_ref = datetime(d2.year + (0 if flg else 1), 1, 1)
                d1_ref = datetime(d1.year + (1 if flg else 0), 1, 1)
                return ActualActual.Impl.day_count(d1, d1_ref) / \
                    daysOfYear(d1.year) + \
                    ActualActual.Impl.day_count(d2_ref, d2) / \
                    daysOfYear(d2.year) + (d2.year - d1.year) - \
                    (1 if flg else -1)

    class Impl_Array:
        @staticmethod
        def day_count(d1, d2, **kargs):
            return (d2-d1).dt.days

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            res = pd.np.full(len(d1), pd.np.nan)
            for i, (dd1, dd2) in enumerate(zip(d1, d2)):
                res[i] = ActualActual.Impl.year_fraction(dd1, dd2)
            return res


class Thirty360:
    class US_Impl:
        @staticmethod
        def day_count(d1, d2, **kargs):
            dd1 = d1.day
            dd2 = d2.day
            mm1 = d1.month
            mm2 = d2.month
            yy1 = d1.year
            yy2 = d2.year
            if ((dd2 == 31) & (dd1 < 30)):
                dd2 = 1
                mm2 += 1

            return 360*(yy2-yy1) + 30*(mm2-mm1-1) + \
                max(0, 30-dd1) + min(30, dd2)

        @staticmethod
        def year_fraction(d1: datetime, d2: datetime, **kargs):
            return Thirty360.US_Impl.day_count(d1, d2)/360.0

    class US_Impl_Array:
        @staticmethod
        def day_count(d1, d2, **kargs):
            dd1 = d1.dt.day
            dd2 = d2.dt.day.copy()
            mm1 = d1.dt.month
            mm2 = d2.dt.month.copy()
            yy1 = d1.dt.year
            yy2 = d2.dt.year
            idx = (dd2 == 31) & (dd1 < 30)
            dd2[idx] = 1
            mm2[idx] += 1

            return 360*(yy2-yy1) + 30*(mm2-mm1-1) + \
                (30 - dd1).where(lambda x: x > 0, 0) + \
                dd2.where(lambda x: x <= 30, 30)

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Thirty360.US_Impl_Array.day_count(d1, d2)/360.0

    class EU_Impl:
        @staticmethod
        def day_count(d1, d2, **kargs):
            dd1 = d1.day
            dd2 = d2.day
            mm1 = d1.month
            mm2 = d2.month
            yy1 = d1.year
            yy2 = d2.year
            return 360*(yy2-yy1) + 30*(mm2-mm1-1) + \
                max(0, 30-dd1) + min(30, dd2)

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Thirty360.EU_Impl.day_count(d1, d2)/360.0

    class EU_Impl_Array(EU_Impl):
        @staticmethod
        def day_count(d1, d2, **kargs):
            dd1 = d1.dt.day
            dd2 = d2.dt.day.copy()
            mm1 = d1.dt.month
            mm2 = d2.dt.month.copy()
            yy1 = d1.dt.year
            yy2 = d2.dt.year
            return 360*(yy2-yy1) + 30*(mm2-mm1-1) + \
                (30 - dd1).where(lambda x: x > 0, 0) + \
                dd2.where(lambda x: x <= 30, 30)

        @staticmethod
        def year_fraction(d1, d2, **kargs):
            return Thirty360.EU_Impl_Array.day_count(d1, d2)/360.0


# convention helper
def convention(day_cnt):
    if day_cnt in [1]:
        return ActualActual.Impl
    elif day_cnt in [5, 14, 23]:
        return Thirty360.US_Impl
    elif day_cnt in [20]:
        return Thirty360.EU_Impl
    elif day_cnt in [2, 102]:
        return Actual360.Impl
    elif day_cnt in [3]:
        return Actual365.Impl
    else:
        logger.warn(
            __name__ + ': unrecognized daycounter ' + str(day_cnt) +
            ' default to US 30/360')
        return Thirty360.US_Impl


def aconvention(day_cnt):
    if day_cnt in [1]:
        return ActualActual.Impl_Array
    if day_cnt in [5, 14, 23]:
        return Thirty360.US_Impl_Array
    elif day_cnt in [20]:
        return Thirty360.EU_Impl_Array
    elif day_cnt in [2, 102]:
        return Actual360.Impl_Array
    elif day_cnt in [3]:
        return Actual365.Impl_Array
    else:
        logger.warn(
            __name__ + ': unrecognized daycounter ' + day_cnt +
            ' default to US 30/360')
        return Thirty360.US_Impl_Array
    raise('Unrecognized day counter')


if __name__ == '__main__':
    aa = convention(1)
    t1 = pd.to_datetime('1/1/2018')
    t2 = pd.to_datetime('3/1/2018')
    aa.year_fraction(t1, t2)
    array = aconvention(1)

    dat = pd.DataFrame(
        {'t1': [pd.to_datetime('1/1/2018'),
                pd.to_datetime('2/1/2018'),
                pd.to_datetime('1/1/2017')],
         't2': [pd.to_datetime('9/1/2018'),
                pd.to_datetime('2/1/2020'),
                pd.to_datetime('1/2/2015')]})
    array.year_fraction(dat['t1'], dat['t2'])
