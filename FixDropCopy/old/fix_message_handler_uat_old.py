from six import iteritems, itervalues
import logging
import threading
import simplejson as json
import datetime as dt
import pprint
import time
from collections import OrderedDict
import uuid

import pandas as pd
import numpy as np

import sqlalchemy as sa
from sqlalchemy.orm import (
    scoped_session, sessionmaker, mapper)
from sqlalchemy.ext.automap import automap_base

from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqclient import MQClient, MQClientEngine
from mqrpc3.mqserver import route, broadcast
from sqlutil.engines import engine
from books.security import Security

from logger import getLogger
from wfifix.client_control import FixClientControl
from watchlists.emc_rvs_watchlist import WatchlistManager
from libs.watchlist_utils import (
    strftime, to_datetime, to_date, send_watchlist_matched_notification)
import libs.ioi_utils as ioi_utils


def test_watch_list(t_date, con):
    size = 100
    iois = pd.DataFrame(
        [dict(ioi.items()) for ioi in ioi_utils.today_iois(
            pd.to_datetime('2020-08-19 12:00:00'),
            engine)]).iloc[:size].groupby('IOIID').first().reset_index()
    size = min(size, len(iois))
    long = int(len(iois) / 2)

    wl = wl_mgr.watchlist()
    ids_map = wl_mgr.ids_map().to_frame('security_id') \
        .reset_index().set_index('security_id')['id'] \
        .groupby(level=0).first().to_dict()

    wl['isin'] = wl['security_id'].map(lambda x: ids_map.get(x, None))

    iois.loc[:long, 'SecurityID'] = (list(wl['isin'].values) * 100)[:(long+1)]
    iois.loc[long:, 'SecurityID'] = (list(wl['isin'].values) * 100)[:(size - long)]
    iois['Side'].iloc[:long] = '1'
    iois['Side'].iloc[long:] = '2'

    iois['ValidUntilTime'] = iois.reset_index().apply(
        lambda x: dt.datetime.now() + dt.timedelta(
            seconds=(1+x['level_0'])*10), axis=1)
    iois['IOIResponseTime'] = iois.reset_index().apply(
        lambda x: x['IOIResponseTime'] and dt.datetime.now() + dt.timedelta(
            seconds=(1+x['level_0'])*10), axis=1)
    iois['IOITransType'] = 'N'
    iois = iois.to_dict(orient='records')
    return {ioi['IOIID']: ioi for ioi in iois}


def response_ioi_order(ioi, logger):
    response_info = ioi['response_info']
    with MQClient(
            queue=response_info['queue'],
            host=response_info['host'],
            virtual_host=response_info['virtual_host']) as con:
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        clordid = uuid.uuid4().hex
        qty = float(ioi['IOIQty'])
        con.call(
            '/respond_ioi', ioi,
            {'Price': 105, 'OrderQty': qty,
             'OrdType': 2, 'PriceType': 1,
             'ClOrdID': clordid,
             'TransactTime': utcnow,
             'Side': {'1': '2', '2': '1'}[ioi['Side']],
             'PartyID': 'chong.liu@westfieldinvestment.com'})
        logger.info('wait for 10 sec, replace order')
        time.sleep(10)
        new_clordid = uuid.uuid4().hex

        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        con.call(
            '/replace_ioi_order', ioi,
            {'Price': 104.55, 'OrderQty': qty/2,
             'OrdType': 2, 'PriceType': 1,
             'OrigClOrdID': clordid,
             'ClOrdID': new_clordid,
             'TransactTime': utcnow,
             'Side': {'1': '2', '2': '1'}[ioi['Side']],
             'PartyID': 'chong.liu@westfieldinvestment.com'})

        logger.info('wait for 10 sec, cancel order')
        time.sleep(10)

        new_clordid2 = uuid.uuid4().hex
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        con.call(
            '/cancel_ioi_order', ioi,
            {'Price': 104.55, 'OrderQty': qty,
             'OrdType': 2, 'PriceType': 1,
             'OrigClOrdID': clordid,
             'ClOrdID': new_clordid,
             'TransactTime': utcnow,
             'Side': {'1': '2', '2': '1'}[ioi['Side']]})


def match_watchlist(wl_mgr, ioi, logger, send_email=False):
    sid = ioi.get('SecurityID', None)
    info = wl_mgr.check_if_in_watchlist(
        sid, {'1': '2', '2': '1'}[ioi['Side']])
    if info is None:
        return

    user_rating = float(ioi.get('UserRating', '0'))

    if (user_rating > 1):
        ioi['categories'] = info['watch_list'].get('categories')
        ioi['reasons'] = info['watch_list'].get('reasons')
        res = {'security_id': info['security_id'],
               'security_info': info.pop('security_info')}
        res.update({k: v for k, v in ioi.items()})
        res.update({'market_data': info})

        # res = {'security_id': info['security_id']}
        # res.update({k: v for k, v in ioi.items()})

        if send_email and (ioi['IOITransType'] == 'N'):
            logger.info('sending notification email')
            t = threading.Thread(
                target=send_watchlist_matched_notification,
                args=(info, ioi, 'UAT',
                      ['chong.liu@westfieldinvestment.com']),
                daemon=True)
            t.start()
            # t.join()
        return res
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


def ioi_date_convert(ioi):
    ioi['ValidUntilTime'] = to_datetime(ioi['ValidUntilTime'])
    ioi['SendingTime'] = to_datetime(ioi['SendingTime'])
    try:
        ioi['TransactTime'] = to_datetime(ioi['TransactTime'])
    except Exception as e:
        import pdb; pdb.set_trace()

    ioi['SettlDate'] = to_date(ioi['SettlDate'])
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
            self, mq_queue,
            host='wfiubuntu01.wfi.local', virtual_host='/fix', logger=logging, **kargs):
        MQServerMixIn.__init__(
            self, mq_queue, host=host,
            virtual_host=virtual_host,
            logger=logger, json=JSON, durable=True, **kargs)

        self.fix_control = FixClientControl(
                queue='trade_web_uat_multicon', virtual_host=virtual_host)

        # t_date = dt.datetime.now() - dt.timedelta(days=1)
        t_date = dt.datetime.now()
        t_date = pd.to_datetime('2020-09-04')
        self._todays_ioi = ioi_utils.today_iois(t_date, engine)
        self._matched_ioi = OrderedDict()
        self._orders = OrderedDict()
        self.wl_mgr = wl_mgr = WatchlistManager(engine, self.logger)

        self._ref_id = None
        self.debug = True
        self.wl_mgr.refresh_all()
        i = 0
        self.logger.info("check today's ioi")

        for ioi_id, ioi in self._todays_ioi.items():
            res = match_watchlist(self.wl_mgr, ioi, self.logger, False)
            if res:
                i += 1
                self._matched_ioi[ioi_id] = res
            if i > 20:
                return

    def upload_txn(self, txn):
        return txn

    def upload_ioi(self, ioi):
        threading.Thread(
            target=upload_ioi,
            args=(self, ioi, self.logger), daemon=True).start()

    # def response_ioi_order(self, ioi):
    #     threading.Thread(
    #         target=response_ioi_order,
    #         args=(ioi, self.logger), daemon=True).start()

    @route('/handle_cancel_txn')
    def handle_cancel_txn(self, txn):
        raise NotImplementedError("handle_cancel_txn not implemented")

    @route('/securities_info')
    def securities_info(self):
        self.logger.info('stream securities_info start')
        for sid in self.wl_mgr.unique_sids():
            data = self.wl_mgr.get_security_info(int(sid))
            yield data
            equity_sid = data.get('equity_sid', None)
            if equity_sid is not None:
                yield self.wl_mgr.get_security_info(int(equity_sid))
        self.logger.info('stream securities_info done')

    @route('/mkt_data')
    def mkt_data(self):
        self.logger.info('stream mkt_data start')
        for sid in self.wl_mgr.unique_sids():
            yield self.wl_mgr.get_mkt_data(int(sid))
        self.logger.info('stream mkt_data done')

    @route('/debug')
    def debug(self, debug):
        self.debug = debug

    @route('/update_watchlist')
    def update_watchlist(self, sids, valid):
        self.broadcast_reload('watchlist', True)
        wl_updates = self.wl_mgr.update_watchlist(sids, valid)
        for _, wi in wl_updates.iterrows():
            self.broadcast_watchlist(wi.to_dict())
        self.broadcast_reload('watchlist', False)

    @route('/portfolio_allocation')
    def portfolio_allocation(self):
        self.logger.info('stream portfolio allocation start')

        current_qty_txn = self.wl_mgr.get_current_qty_and_txn()
        for lot in current_qty_txn['pos']:
            yield {'content': lot, 'type': 'lot'}

        for txn in current_qty_txn['txn']:
            yield {'content': txn, 'type': 'txn'}

        self.logger.info('stream portfolio allocation done')

    @route('/todays_matched_ioi')
    def todays_matched_ioi(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        i = 0
        imax = 10

        for ioi in self._matched_ioi.values():
            i += 1
            # if i < imax and ioi['ValidUntilTime'] < dt.datetime.now():
            #     ioi['ValidUntilTime'] = dt.datetime.now() + dt.timedelta(
            #         seconds=(1+i)*50)
            #     ioi['IOITransType'] = 'N'
            yield ioi
        return

    @route('/todays_orders')
    def todays_orders(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        for ioi in self._orders.values():
            yield ioi
        return

    @route('/active_rfqs')
    def active_rfqs(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)

        iois = test_watch_list(dt.datetime.now(), engine)
        wl_iois = {}
        i = 0
        for ioi in iois.values():
            wl_ioi = match_watchlist(self.wl_mgr, ioi, self.logger, False)
            if wl_ioi:
                i += 1
                wl_iois[wl_ioi['IOIID']] = wl_ioi
                # yield wl_ioi

        res = json.dumps(
            wl_iois, default=json_default, ignore_nan=True)
        # with open('./data.json', 'w') as f:
        #     f.write(res)

        for ioi in wl_iois.values():
            yield ioi

        print('done', len(res))
        return

    @route('/watchlist')
    def watchlist(self):
        self.logger.info('stream watchlist start')
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        columns_include = [
            't_date', 'security_id', 'long_short', 'category', 'categories',
            'is_new', 'comments', 'sid_equity', 'reasons', 'valid']
        wl = self.wl_mgr.get_watchlist()[columns_include]
        for _, wi in wl.iterrows():
            yield wi.to_dict()
        self.logger.info('stream watchlist done')

    @route('/mktdata_update')
    def mktdata_update(self, data):
        self.logger.info('market data update!')
        processed_data = self.wl_mgr.update_mkt_data(data)
        for sid in processed_data:
            processed_data[sid].update({'security_id': sid})
            self.broadcast_mktdata(processed_data[sid])
        self.logger.info('done!')
        return

    @route('/send_orders')
    def send_orders(self, orderMsg):
        self.logger.info('send orders!')
        list_id = orderMsg.get('ListID', 'Default')
        orders = orderMsg.get('orders', [])
        users = [orderMsg['Email']]

        with self.fix_control as ctrl:
            ctrl.send_orders(list_id, orders, users)
        return True

    @route('/respond_ioi')
    def respond_ioi(self, orderMsg, user):
        with self.fix_control as ctrl:
            try:
                resp = ctrl.respond_ioi(orderMsg, user)
                self.logger.info('ioi order send ' + str(resp))
                self.record_new_order(resp)
                return resp
            except Exception:
                raise

    @route('/replace_order')
    def replace_order(self, orderMsg, user):
        with self.fix_control as ctrl:
            try:
                resp = ctrl.replace_order(orderMsg, user)
                self.logger.info('replace order send ' + str(resp))
                return resp
            except Exception:
                raise

    @route('/cancel_order')
    def cancel_order(self, orderMsg, user):
        with self.fix_control as ctrl:
            try:
                resp = ctrl.cancel_order(orderMsg, user)
                self.logger.info('cancel order send ' + str(resp))
                return resp
            except Exception:
                raise

    def record_new_order(self, order):
        order_id = order['ClOrdID']
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = order
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                if self._orders[order_id].get('OrdStatus', '0') == '0':
                    self._orders[order_id].update(order)

        order = self._orders[order_id]
        order['t_date'] = to_datetime(order['TransactTime'])
        self.broadcast_order(self._orders[order_id])

    def record_update_order(self, order):
        order_id = order['ClOrdID']
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = order
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                self._orders[order_id].update(order)

        order['t_date'] = to_datetime(order['TransactTime'])
        self.broadcast_order(self._orders[order_id])

    def record_cancel_order(self, order, order_id=None):
        order_id = order['ClOrdID']
        ref_order_id = order.get('OrigClOrdID', order['ClOrdID'])
        with self._lock:
            self._orders.pop(ref_order_id, {})
            order['t_date'] = to_datetime(order['TransactTime'])
            security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
            order['security_id'] = security_id
            self._orders[order_id] = order
        self.broadcast_cancel_order(self._orders[order_id])

    def record_replace_order(self, order, order_id=None, orig_order_id=None):
        orig_order_id = orig_order_id or order['OrigClOrdID']
        order_id = order_id or order['ClOrdID']
        with self._lock:
            orig_order = self._orders.pop(orig_order_id, {})
            orig_order.update(order)
            orig_order['t_date'] = to_datetime(orig_order['TransactTime'])
            security_id = self.wl_mgr.ids_map().get(orig_order['SecurityID'])
            orig_order['security_id'] = security_id
            self._orders[order_id] = orig_order

        self.broadcast_replace_order(self._orders[order_id])

    @broadcast(route='broadcast_order', exchange='trading_signal_exchange')
    def broadcast_order(self, order):
        self.logger.info(order)
        return order

    @broadcast(route='broadcast_replace_order', exchange='trading_signal_exchange')
    def broadcast_replace_order(self, order):
        return order

    @broadcast(route='broadcast_cancel_order', exchange='trading_signal_exchange')
    def broadcast_cancel_order(self, order):
        return order

    @route('/handle_correct_txn')
    def handle_correct_txn(self, txn):
        raise NotImplementedError("handle_correct_txn not implemented")

    @route('/handle_reject_order')
    def handle_reject_order(self, order):
        self.record_order(order)

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

    @route('/handle_txn')
    def handle_txn(self, txn):
        self.logger.info(str(txn))
        if txn.get('ExecType') == '0':
            order_id = txn['ClOrdID']
            self.record_new_order(txn)
        if txn.get('ExecType') == 'F':
            self.record_update_order(txn)

    @route('/handle_replace_order')
    def handle_replace_order(self, ord):
        orig_order_id = ord['OrigClOrdID']
        order_id = ord['ClOrdID']
        self.logger.info(str(ord))

        self.record_replace_order(
            ord, order_id=order_id, orig_order_id=orig_order_id)

    @route('/handle_cancel_order')
    def handle_cancel_order(self, ord):
        self.logger.info(str(ord))
        order_id = ord.get('OrigClOrdID', ord['ClOrdID'])
        self.record_cancel_order(ord, order_id)

    @route('/handle_ioi')
    def handle_ioi(self, ioi):
        try:
            self.logger.info(str(ioi))
            # self.response_ioi_order(ioi)
            ioi = ioi_date_convert(ioi)
            ioi = ioi_utils.ioi_transform(ioi)
            ioi_ref = self._todays_ioi.setdefault(ioi['id'], ioi)
            ioi_ref.update(ioi)
            res = match_watchlist(self.wl_mgr, ioi, self.logger, True)

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
    # signal_queue = 'trading_signal_queue'
    # signal_exchange = 'trading_signal_exchange'
    virtual_host = '/fix_uat'
    with FIXMessageHandler(
            mq_queue,
            virtual_host=virtual_host, logger=logger,
            prefetch_count=10) as msg_handler:
        try:
            msg_handler.run(threaded=True)
        except Exception as e:
            logger.exception(e)


if __name__ == '__main__':
    main()

    # from utils.timer import Timer
    # with Timer(''):
    #     match_watchlist(
    #         {'IOITransType': 'N',
    #          'ValidUntilTime': '2022-01-01 12:21:12',
    #          'SecurityID': 'US910047AJ87',
    #          'Side': '2', 'IOIQty': 1000, 'UserRating': '2.0', 'IOIID': 'asdf'},
    #         logging)

    # with Timer('2'):
    #     match_watchlist(
    #         {'IOITransType': 'N',
    #          'ValidUntilTime': '2022-01-01 12:21:12',
    #          'SecurityID': 'US910047AJ87',
    #          'Side': '1', 'IOIQty': 1000, 'UserRating': '2.0', 'IOIID': 'asdf'},
    #         logging)
