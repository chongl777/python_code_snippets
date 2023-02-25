from six import iteritems
import logging
import threading
import json
import datetime as dt
import pprint
from collections import OrderedDict

import numpy as np
import simplejson as json

from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqclient import MQClient, MQClientEngine
from mqrpc3.mqserver import route, broadcast
from sqlutil.engines import engine
from books.security import Security

from logger import getLogger
from watchlists.emc_rvs_watchlist import WatchlistManager
import libs.ioi_utils as ioi_utils
from libs.watchlist_utils import (
    strftime, to_datetime, send_watchlist_matched_notification)


wl_mgr = WatchlistManager(engine)


def response_ioi_order(ioi):
    response_info = ioi['response_info']
    with MQClient(
            queue=response_info['queue'],
            host=response_info['host'],
            virtual_host=response_info['virtual_host']) as con:
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')

        con.call(
            response_info['route'], ioi,
            {'Price': 105, 'OrderQty': ioi['IOIQty'],
             'OrdType': 2, 'PriceType': 1,
             'TransactTime': utcnow,
             'Side': {'1': '2', '2': '1'}[ioi['Side']],
             'PartyID': 'chong.liu@westfieldinvestment.com'})



def match_watchlist(ioi, logger, send_email=False):
    sid = ioi.get('SecurityID', None)
    info = wl_mgr.check_if_in_watchlist(
        sid, {'1': '2', '2': '1'}[ioi['Side']])

    user_rating = float(ioi.get('UserRating', '0'))
    ioi_qty = float(ioi.get('IOIQty', '0'))
    if info is None:
        return

    logger.info(
        ('checking condition, ioi_qty: '
         '{ioi_qty}, user_rating: {rtg}, transType: {transType}').format(
             ioi_qty=ioi_qty, rtg=user_rating, transType=ioi['IOITransType']))

    if (user_rating > 1):
        ioi['categories'] = info['watch_list'].get('categories')
        ioi['reasons'] = info['watch_list'].get('reasons')
        res = {'security_id': info['security_id'],
               'security_info': info.pop('security_info')}
        res.update({k: v for k, v in ioi.items()})
        res.update({'market_data': info})

        if send_email and (ioi['IOITransType'] == 'N'):
            logger.info('sending notification email')

            t = threading.Thread(
                target=send_watchlist_matched_notification,
                args=(info, ioi, 'PROD'), daemon=True)
            t.start()
        return res
    return None


def json_default(o):
    import pandas as pd
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


def ioi_date_convert(ioi):
    ioi['ValidUntilTime'] = to_datetime(ioi['ValidUntilTime'])
    ioi['SendingTime'] = to_datetime(ioi['SendingTime'])
    ioi['TransactTime'] = to_datetime(ioi['TransactTime'])
    ioi['IOIResponseTime'] = to_datetime(ioi.get('IOIResponseTime'))
    return ioi


class JSON:
    @staticmethod
    def dumps(x):
        return json.dumps(x, default=json_default, ignore_nan=True)

    @staticmethod
    def loads(x):
        return json.loads(x)


class FIXMessageHandler(MQServerMixIn):
    def __init__(
            self, mq_queue, host='wfiubuntu01.wfi.local',
            virtual_host='/fix', logger=logging, **kargs):
        MQServerMixIn.__init__(
            self, mq_queue,
            host=host, virtual_host=virtual_host,
            logger=logger, json=JSON, durable=True, **kargs)

        t_date = dt.datetime.now()
        self._todays_ioi = ioi_utils.today_iois(t_date, engine)
        self._matched_ioi = OrderedDict()
        self._ref_id = None

        wl_mgr.refresh_all()

        for ioi_id, ioi in self._todays_ioi.items():
            res = match_watchlist(ioi, self.logger, False)
            if res:
                self._matched_ioi[ioi_id] = res

    def upload_txn(self, txn):
        return txn

    @route('/securities_info')
    def securities_info(self):
        for sid in wl_mgr.unique_sids():
            yield wl_mgr.get_security_info(int(sid))
        return

    @route('/mkt_data')
    def mkt_data(self):
        for sid in wl_mgr.unique_sids():
            yield wl_mgr.get_mkt_data(int(sid))

    @route('/send_orders')
    def send_orders(self, orderMsg):
        self.logger.info('send orders!')
        from wfifix.client_control import FixClientControl

        list_id = orderMsg.get('ListID', 'Default')
        orders = orderMsg.get('orders', [])
        users = [orderMsg['Email']]
        with FixClientControl(
                queue='trade_web_exec_rpt',
                virtual_host='/fix') as ctrl:
            ctrl.send_orders(list_id, orders, users)
        self.logger.info('send orders done!')

    @route('/todays_matched_ioi')
    def todays_matched_ioi(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        for ioi in self._matched_ioi.values():
            yield ioi
        return

    @route('/mktdata_update')
    def mktdata_update(self, data):
        processed_data = wl_mgr.update_mkt_data(data)
        for sid in processed_data:
            processed_data[sid].update({'security_id': sid})
            self.logger.info('sending update:' + str(processed_data[sid]))
            self.broadcast_mktdata(processed_data[sid])
        return

    @route('/watchlist')
    def watchlist(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        columns_include = [
            't_date', 'security_id', 'long_short', 'category', 'categories',
            'is_new', 'comments', 'sid_equity', 'reasons', 'valid']
        wl = wl_mgr.get_watchlist()[columns_include]

        for _, wi in wl.iterrows():
            yield wi.to_dict()
        return

    @route('/update_watchlist')
    def update_watchlist(self, sids, valid):
        self.broadcast_reload('watchlist', True)
        wl_updates = wl_mgr.update_watchlist(sids, valid)
        for _, wi in wl_updates.iterrows():
            self.broadcast_watchlist(wi.to_dict())
        self.broadcast_reload('watchlist', False)


    @route('/portfolio_allocation')
    def portfolio_allocation(self):
        current_qty_txn = wl_mgr.get_current_qty_and_txn()
        for lot in current_qty_txn['pos']:
            yield {'content': lot, 'type': 'lot'}

        for txn in current_qty_txn['txn']:
            yield {'content': txn, 'type': 'txn'}

    @route('/handle_cancel_txn')
    def handle_cancel_txn(self, txn):
        raise NotImplementedError("handle_cancel_txn not implemented")

    @broadcast(route='broadcast_ioi', exchange='trading_signal_exchange')
    def broadcast_ioi(self, ioi):
        return ioi

    @broadcast(route='broadcast_mktdata', exchange='trading_signal_exchange')
    def broadcast_mktdata(self, mktdata):
        self.logger.info('broad cast:' + str(mktdata))
        return mktdata

    @broadcast(route='broadcast_watchlist', exchange='trading_signal_exchange')
    def broadcast_watchlist(self, wl):
        return wl

    @broadcast(route='broadcast_reload', exchange='trading_signal_exchange')
    def broadcast_reload(self, component, value):
        return component, value, dt.datetime.now()

    @route('/handle_correct_txn')
    def handle_correct_txn(self, txn):
        raise NotImplementedError("handle_correct_txn not implemented")

    @route('/handle_txn')
    def handle_txn(self, txn):
        self.logger.info(str(txn))

    @route('/handle_reject')
    def handle_reject(self, order):
        raise NotImplementedError("handle_reject not implemented")

    @route('/handle_ioi')
    def handle_ioi(self, ioi):
        try:
            self.logger.info(str(ioi))
            # self.response_ioi_order(ioi)
            ioi = ioi_date_convert(ioi)
            ioi = ioi_utils.ioi_transform(ioi)
            ioi_ref = self._todays_ioi.setdefault(ioi['id'], ioi)
            ioi_ref.update(ioi)
            res = match_watchlist(ioi, self.logger, True)

            if res:
                self._ref_id = ioi['id']
                self._matched_ioi.setdefault(ioi['id'], res).update(res)
                self.broadcast_ioi(res)
            # if (ioi['IOITransType'] == 'C'):
            #     self.broadcast_ioi({'ioi': ioi})

            return 'done!'
        except Exception as e:
            self.logger.exception(e)
            raise(e)


def main():
    logger = getLogger(
        'fix_msg_handler',
        '%(asctime)s %(name)-12s %(threadName)-10s %(levelname)-6s %(funcName)-15s: %(message)s'
    )
    logger.setLevel(logging.INFO)

    mq_queue = 'fix_msg_handle_queue'
    virtual_host = '/fix'

    with FIXMessageHandler(
            mq_queue, virtual_host=virtual_host, logger=logger,
            prefetch_count=10) as msg_handler:
        try:
            msg_handler.run(threaded=True)
        except Exception as e:
            logger.exception(e)


if __name__ == '__main__':
    main()
