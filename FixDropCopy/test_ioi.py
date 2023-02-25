# import gevent.monkey
# gevent.monkey.patch_socket()

import sys
import ssl
from enum import Enum
from datetime import datetime
import logging

import pandas as pd
import numpy as np
import datetime as dt

from sqlutil.engines import engine_fix as dbengine_fix
from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc.mqserver import MQServer
from mqrpc.mqserver import route
from patterns.synchronization import Synchronization

from mqrpc3.mqclient import MQClientEngine


def json_default(o):
    if isinstance(o, (dt.date, dt.datetime, pd.Timestamp)):
        return o.isoformat()
    if isinstance(o, np.int64):
        return int(o)


class JSON:
    @staticmethod
    def dumps(x):
        import simplejson as json
        return json.dumps(x, default=json_default, ignore_nan=True)

    @staticmethod
    def loads(x):
        import simplejson as json
        return json.loads(x)


if __name__ == '__main__':
    logger = logging
    iois = ioi = pd.DataFrame(
        30 * [{'security_id': 20712, 'security_info': {'security_id': 20712, 'short_name': 'AUTOMATION TOOLI', 'security_name': 'ATACN 4 1/8 12/15/28', 'description': 'ATACN 4.125 12/15/28 144A', 'bbg_id': 'BN0711844', 'industry_code': 3714.0, 'day_cnt': 5.0, 'coupon': 4.125, 'issue_date': '2020-12-29T00:00:00', 'maturity': '2028-12-15T00:00:00', 'sinkable': 'N', 'callable': 'Y', 'putable': 'N', 'issue_price': 100.0, 'amt_issued': 350000000.0, 'multiplier': 1.0, 'undl_security_id': None, 'company_id': 126987.0, 'cntry_of_risk': 'CA', 'payment_rnk': 'Sr Unsecured', 'primary_xchg': None, 'ccy': 'USD', 'ccy_sid': 0.0, 'deal': 'AUTOMATION TOOLI', 'product_typ': 'Corporate Bond', 'product_code': 1, 'cusip': '001940AC9', 'isin': 'US001940AC98', 'finra_ticker': 'C955929', 'bbg_id_8_chr': 'BN071184', 'region': 'AMERICAS', 'isvalid': True, 'industry_level_1': 'Industrials', 'industry_level_2': 'Machinery Manufacturing', 'asset_class': 'Fixed Income', 'marketsegment': 'HY', 'liqscore': 5.0, 'ccy_id': 0, 'equity_sid': 10541, 'sec_evt': None}, 'market_data': {'security_id': 20712, 'mkt_px': {'1': {'t_date': '2021-07-23T00:00:00', 'price': 102.301, 'price_prev': 102.301}, '2': {'t_date': '2021-07-23T16:00:00', 'price': 102.301, 'price_prev': 102.301}, '19': {'t_date': '2021-07-23T00:00:00', 'price': 102.0, 'price_prev': 102.0}}, 'rvs_score': {}, 'rvs_score_new': {}, 'emc_score': {}, 'short_info': {}, 'fa_info': {'first_date': None, 'num_of_month_in_indx': None}, 'outstanding_amt': {'t_date': '2021-07-23T00:00:00', 'value': 350000000.0}, 'yield': {'ytf': {'t_date': '2021-07-23T00:00:00', 'yld': 0.04067443866888692, 'attr_id': 3, 'modified_dur': 2.2406336074515982, 'source_code': 19, 'priority': 13, 'date': '2021-07-23T00:00:00'}, 'ytm': {'t_date': '2021-07-23T00:00:00', 'yld': 0.03811122760813492, 'attr_id': 1, 'modified_dur': 6.301677120396251, 'source_code': 19, 'priority': 13, 'date': '2021-07-23T00:00:00'}, 'ytw': {'t_date': '2021-07-23T00:00:00', 'yld': 0.03777176344719081, 'attr_id': 2, 'modified_dur': 3.122372339909336, 'source_code': 19, 'priority': 13, 'date': '2021-07-23T00:00:00'}}, 'rtg': {'rtg': 'BB', 'rtg_rnk': 12, 'rtg_normal': 'BB', 'rtg_prev': None, 'rtg_date': '2020-12-23T00:00:00'}, 'factor': 1, 'intraday_ret': {'ret': None, 't_date': None}}, 'index': 2533646, 'Session': 1571661, 'BeginString': 'FIX.4.4', 'MsgSeqNum': 4448, 'SenderCompID': 'TRADEWEBIOI', 'SendingTime': '2021-07-22T14:13:12.703000', 'TargetCompID': 'WESTPRODIOI', 'Currency': 'USD', 'SecurityIDSource': '4', 'IOIID': 'A4', 'IOIRefID': None, 'IOIQty': 645000.0, 'IOITransType': 'N', 'SecurityID': 'US001940AC98', 'Side': '2', 'Symbol': '[N/A]', 'TimeInForce': 'A', 'TransactTime': '2021-07-22T14:13:12', 'ValidUntilTime': '2021-07-26T00:02:16.131592', 'SettlDate': '2021-07-26', 'NoIOIQualifiers': None, 'IOIQualifier': None, 'NoRoutingIDs': '[{"RoutingType": "5", "RoutingID": "sysapi9"}]', 'RoutingType': None, 'RoutingID': None, 'BenchmarkCurveCurrency': 'USD', 'BenchmarkCurveName': 'OTHER', 'PriceType': '1', 'NoPartyIDs': '[{"PartyID": "TW", "PartyIDSource": "B", "PartyRole": "6"}]', 'BenchmarkSecurityID': '91282CCK5', 'BenchmarkSecurityIDSource': '1', 'IOIResponseTime': '2021-07-26T00:12:16.131592', 'MListID': 'NY3127052.1', 'IOIType': '1', 'UserRating': 4, 'Counter': 'Y', 'categories': 'security in portfolio', 'reasons': 'security in portfolio'}])

    # iois = pd.read_sql("""
    # DECLARE @ioiid nvarchar(1000)
    # SET @ioiid = 'CORI_TW_D_BL_15__CORI210722A2ANY3127035_1_89700802_A_1'

    # SELECT *
    # FROM fix.tbl_fix_ioi_report_backup
    # WHERE IOIID = @ioiid
    # OR IOIRefID = @ioiid
    # OR IOIID = 'CORI_TW_D_BL_16__CORI210722A2ANY3127052_1_89747062_A_1'
    # """, engine)

    iois['SecurityID'] = 'US00081TAK43'
    iois['UserRating'] = 4
    iois['Side'] = '2'

    iois['ValidUntilTime'] = [dt.datetime.now() + dt.timedelta(minutes=x + 10)
                              for x in range(len(iois))]
    iois['IOIResponseTime'] = [dt.datetime.now() + dt.timedelta(minutes=x/3 + 0.2)
                              for x in range(len(iois))]
    iois = iois.append(iois)
    # iois = iois.append(iois)
    # iois = iois.append(iois)
    # iois = iois.append(iois)
    # iois = iois.append(iois)

    new = True

    if new:
        iois['IOIID']  = [f'A{x}' for x in range(len(iois['IOIID']))]
        iois['IOITransType'] = 'N'
    else:
        iois['IOIID']  = [f'A.{x}.{x}' for x in range(len(iois['IOIID']))]
        iois['IOITransType'] = 'C'
        iois['IOIRefID'] = [f'A{x}' for x in range(len(iois['IOIID']))]

    # ioi_asap = iois.iloc[0].copy()
    # ioi_n = iois.iloc[1].copy()
    # ioi_c = iois.iloc[2].copy()
    # ioi_n['IOIResponseTime'] = dt.datetime.now() + dt.timedelta(minutes=20)
    # ioi_r = iois.iloc[1].copy()
    # ioi_n['IOIResponseTime'] = dt.datetime.now() + dt.timedelta(seconds=120)
    # ioi_r['IOITransType'] = 'N'
    # ioi_r['IOIRefID'] = ioi_n['IOIID']

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix_uat',
        logger=logger, json=JSON, time_out=10, durable=True)


    with signal_engine.connect() as con:
        for ioi in iois.iloc[:].to_dict(orient='record'):
            aa = con.call('/test_ioi', ioi)
