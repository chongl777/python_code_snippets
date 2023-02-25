import datetime as dt
from collections import OrderedDict


def load_iois(t_date, con):
    iois = con.execute(
        """SELECT * FROM fix.tbl_fix_ioi_report
        WHERE ValidUntilTime >= '{t_date}'
        AND ValidUntilTime < '{nxt_date}'
        ORDER BY TransactTime, SendingTime""".format(
            t_date=t_date.strftime('%Y-%m-%d'),
            nxt_date=(t_date+dt.timedelta(days=1)).strftime('%Y-%m-%d')
        ))

    return iois


def load_orders(t_date, sender, target, con):
    nxt_date=(t_date+dt.timedelta(days=1))
    sql = f"""
    SELECT distinct *
    FROM [fix].[fn_tbl_orders_report](
    '{target}', '{sender}',
    '{t_date.strftime('%Y-%m-%d')}',
    '{nxt_date.strftime('%Y-%m-%d')}')
    ORDER BY TransactTime ASC
    """
    return con.execute(sql)


def ioi_transform(ioi):
    ioi = {k: v for k, v in ioi.items()}
    if ioi['IOITransType'] == 'N':
        ioi['id'] = ioi['IOIID']
        ioi['ref_id'] = None
        return ioi
    if ioi['IOITransType'] in ['C', 'R']:
        ioi['id'] = ioi['IOIRefID']
        ioi['ref_id'] = ioi['IOIID']
    return ioi


def load_today_iois(t_date, con):
    return load_iois(t_date, con)
    # iois = load_iois(t_date, con)
    # unique_iois = {}

    # for ioi in iois:
    #     ioi = ioi_transform(ioi)
    #     ioi_ref = unique_iois.setdefault(ioi['id'], ioi)
    #     ioi_ref.update(ioi)
    #     # if ioi['ref_id']:
    #     #     unique_iois.setdefault(ioi['ref_id'], ioi_ref)

    # return unique_iois


def load_today_orders(self, t_date, target, sender, con):
    return load_orders(t_date, sender, target, con)


if __name__ == '__main__':
    import datetime as dt
    import pandas as pd
    from sqlutil.engines import engine
    from utils.timer import Timer
    with Timer(''):
        df = today_iois(dt.datetime.now(), engine)
        # df = pd.DataFrame(df)
