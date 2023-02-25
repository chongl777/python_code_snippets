from six import iteritems
import logging
import threading
import json
import datetime as dt
import pprint
from collections import OrderedDict

import numpy as np

from wfifix.client_control import FixClientControl
from sqlutil.engines import engine
from books.security import Security

from fixlibs.fix_handlers import (
    MQServerMixIn, route, broadcast, broadcast_bigsize,
    strftime, to_datetime, to_date, JSON)
from fixlibs.fix_handlers.fix_mixin_order_handler import FIXOrderHandlerMixIn
from fixlibs.fix_handlers.fix_mixin_ioi_handler import FIXIOIHandlerMixIn

from logger import getLogger
from watchlists.emc_rvs_watchlist import WatchlistManager
import fixlibs.fix_dbutils as fix_dbutils
from fixlibs.watchlist_utils import (
    strftime, to_datetime, send_watchlist_matched_notification)


def chunks(lst, n):
    lst = list(lst)
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


CHUNK_SIZE = 20
SEND_EMAIL = False


class FIXMessageHandler(FIXOrderHandlerMixIn,
                        FIXIOIHandlerMixIn, MQServerMixIn):
    def __init__(
            self, mq_queue,
            virtual_host='/fix', logger=logging, **kargs):
        logger.info('-------- starting the server ------------')

        MQServerMixIn.__init__(
            self, mq_queue,
            virtual_host=virtual_host,
            logger=logger, json=JSON, durable=True, **kargs)

        FIXOrderHandlerMixIn.__init__(
            self, order_ctx=FixClientControl(
                queue='trade_web_exec_rpt',
                virtual_host=virtual_host))
        FIXIOIHandlerMixIn.__init__(self)

        t_date = dt.datetime.now()
        self.wl_mgr = WatchlistManager(engine, self.logger)
        sids = self.unique_sids()
        self.wl_mgr.set_unique_sids(sids)
        self.wl_mgr.refresh_all(False)

        self.process_orders(
            fix_dbutils.load_today_orders(
                self, t_date, 'WESTFIXPROD', 'TRADEWEB', engine))

        self.process_iois(
            fix_dbutils.load_today_iois(t_date, engine))

    def unique_sids(self):
        sec_orders = set(
            [x.get('security_id') for x in self._orders.values()
             if x.get('security_id') is not None])
        return sec_orders

    def match_watchlist(self, ioi, send_email=False):
        sid = ioi.get('SecurityID', None)
        info = self.wl_mgr.check_if_in_watchlist(
            sid, {'1': '2', '2': '1'}[ioi['Side']])

        user_rating = float(ioi.get('UserRating', '0'))
        ioi_qty = float(ioi.get('IOIQty', '0'))
        if info is None:
            return

        # self.logger.info(
        #     ('checking condition, ioi_qty: '
        #      '{ioi_qty}, user_rating: {rtg}, transType: {transType}').format(
        #          ioi_qty=ioi_qty, rtg=user_rating, transType=ioi['IOITransType']))

        if (user_rating > 1):
            ioi['categories'] = info['watch_list'].get('categories')
            ioi['reasons'] = info['watch_list'].get('reasons')
            res = {'security_id': info['security_id'],
                   'security_info': info['security_info'],
                   'market_data': info['market_data']}

            res.update({k: v for k, v in ioi.items()})

            if SEND_EMAIL and send_email and (ioi['IOITransType'] == 'N'):
                self.logger.info('sending notification email')
                t = threading.Thread(
                    target=send_watchlist_matched_notification,
                    args=(info, ioi, 'PROD'), daemon=True)
                t.start()
            return res
        return None

    @route('/refresh_message_handler')
    def refresh_message_handler(self):
        self.logger.info('---- start refresh the server -----')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S start refresh all...')
        t_date = dt.datetime.now()
        self.logger.info("refresh watch list")

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S start refresh watchlist...')
        self.wl_mgr.refresh_all()

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broadcast security info...')
        self.broadcast_securities_info()

        self.logger.info("start load today's order")
        yield dt.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S reload today's order...")
        self.process_orders(
            fix_dbutils.load_today_orders(
                self, t_date, 'WESTFIXPROD', 'TRADEWEB', engine))

        self.logger.info("start load today's ioi")
        yield dt.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S reload today's ioi...")
        self.process_iois(
            fix_dbutils.load_today_iois(t_date, engine))

        self.logger.info("reload market data")
        yield dt.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S reload market data...")
        for sid in self.wl_mgr.unique_sids():
            self.wl_mgr.get_mkt_data(int(sid))
        self.logger.info("done")
        yield dt.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S done...")

        self.broadcast_portfolio_allocation()
        self.broadcast_watchlist()

    @route('/debug')
    def debug(self, debug):
        if debug:
            self.logger.setLevel(logging.DEBUG)
        else:
            self.logger.setLevel(logging.INFO)

    @route('/refresh_portfolio')
    def refresh_portfolio(self):
        self.logger.info('refresh portfolio allocation')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S refresh portfolio allocation...')
        self.wl_mgr.refresh_position_qty()
        self.logger.info('done!')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S refresh portfolio done!')
        self.broadcast_portfolio_allocation()

    @route('/refresh_watchlist')
    def refresh_watchlist(self):
        self.logger.info('refresh watchlist')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S refresh watchlist...')
        self.wl_mgr.refresh_watchlist()
        self.broadcast_securities_info()
        self.logger.info('done!')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S refresh watchlist done!!')
        self.broadcast_watchlist()

    @route('/reload_mkt_data')
    def reload_mkt_data(self):
        self.logger.info('reload mkt data')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S reload market data...')
        self.wl_mgr.refresh_mkt_data()

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broad cast market data...')
        res = []
        for sid in self.wl_mgr.unique_sids():
            data = self.wl_mgr.get_mkt_data(int(sid))
            res.append(data)
        self.broadcast_mktdata(res)

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broad cast market data done!')

    @route('/reload_trading_signal')
    def reload_trading_signal(self):
        try:
            self.logger.info('reload trading signal')
            yield dt.datetime.now().strftime(
                '%Y-%m-%d %H:%M:%S reload trading signal...')
            self.wl_mgr.refresh_trading_signal()

            yield dt.datetime.now().strftime(
                '%Y-%m-%d %H:%M:%S broad cast trading signal...')
            res = []
            for sid in self.wl_mgr.unique_sids():
                data = self.wl_mgr.get_mkt_data(int(sid))
                res.append(data)
            self.broadcast_mktdata(res)

            yield dt.datetime.now().strftime(
                '%Y-%m-%d %H:%M:%S broad cast trading signal done!')
            self.logger.info('reload trading signal done')
        except Exception as e:
            self.logger.exception(e)

    @route('/securities_info')
    def securities_info(self):
        for sids in chunks(self.wl_mgr.unique_sids(), CHUNK_SIZE):
            data = []
            for sid in sids:
                sec_info = self.wl_mgr.get_security_info(int(sid))
                data.append(sec_info)

                equity_sid = sec_info.get('equity_sid', None)
                if equity_sid is not None:
                    data.append(
                        self.wl_mgr.get_security_info(int(equity_sid)))
            yield data
        return

    @route('/add_security')
    def add_security(self, security_id):
        self.wl_mgr.add_security(security_id)
        self.broadcast_securities_info([security_id])
        self.logger.info(f"""security {security_id} added""")

    @broadcast_bigsize(route='broadcast_securities_info',
                        exchange='trading_signal_exchange')
    def broadcast_securities_info(self, sids=None):
        self.logger.info('broadcast securities_info start')
        data = []
        sids = sids or self.wl_mgr.unique_sids()
        for sid in sids:
            sec_info = self.wl_mgr.get_security_info(int(sid))
            data.append(sec_info)

            equity_sid = sec_info.get('equity_sid', None)
            if equity_sid is not None:
                data.append(
                    self.wl_mgr.get_security_info(int(equity_sid)))
        self.logger.info('broadcast securities_info done')
        return data

    @route('/funds_info')
    def funds_info(self):
        self.logger.info('stream funds_info start...')
        for fids in chunks(self.wl_mgr.unique_funds_ids(), CHUNK_SIZE):
            data = []
            for fid in fids:
                fund_info = self.wl_mgr.get_fund_info(int(fid))
                data.append(fund_info)
            yield data
        self.logger.info('stream funds_info done !')

    @route('/mkt_data')
    def mkt_data(self):
        CHUNK_SIZE = 15
        self.logger.info('stream mkt_data start')
        unique_sids = self.wl_mgr.unique_sids()
        for sids in chunks(unique_sids, CHUNK_SIZE):
            data = []
            for sid in sids:
                data.append(self.wl_mgr.get_mkt_data(int(sid)))
            yield data

        unique_eq_sids = self.wl_mgr.unique_eq_sids()
        for sids in chunks(unique_eq_sids, CHUNK_SIZE):
            data = []
            for sid in sids:
                data.append(self.wl_mgr.get_mkt_data(int(sid)))
            yield data

        self.logger.info('stream mkt_data done')

    @route('/mktdata_update')
    def mktdata_update(self, data):
        processed_data = self.wl_mgr.update_mkt_data(data)
        res = []
        for sid in processed_data:
            processed_data[sid].update({'security_id': sid})
            res.append(processed_data[sid])
        self.broadcast_mktdata(res)

    @route('/watchlist')
    def watchlist(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        wl = self.wl_mgr.get_watchlist()

        for wi_chunk in chunks(wl.iterrows(), CHUNK_SIZE):
            data = []
            for _, wi in wi_chunk:
                data.append(wi.to_dict())
            yield data

    @route('/update_watchlist')
    def update_watchlist(self, sids, valid):
        wl_updates = self.wl_mgr.update_watchlist(sids, valid)
        self.broadcast_watchlist()

    @route('/portfolio_allocation')
    def portfolio_allocation(self):
        self.logger.info('stream portfolio allocation start')
        current_qty_txn = self.wl_mgr.get_current_qty_and_txn()
        for lots in chunks(current_qty_txn['pos'], CHUNK_SIZE):
            data = []
            for lot in lots:
                data.append({'content': lot, 'type': 'lot'})
            yield data

        for txns in chunks(current_qty_txn['txn'], CHUNK_SIZE):
            data = []
            for txn in txns:
                data.append({'content': txn, 'type': 'txn'})
            yield data

        yield [
            {'content': current_qty_txn['pos_date'], 'type': 'pos_date'},
            {'content': current_qty_txn['ref_date'], 'type': 'ref_date'}]

        self.logger.info('stream portfolio allocation done')

    @broadcast(route='broadcast_mktdata', exchange='trading_signal_exchange')
    def broadcast_mktdata(self, mktdata):
        # self.logger.info('broad cast:' + str(mktdata))
        CHUNK_SIZE = 30
        for mktdatum in chunks(mktdata, CHUNK_SIZE):
            yield mktdatum

    @broadcast_bigsize(route='broadcast_watchlist', exchange='trading_signal_exchange')
    def broadcast_watchlist(self):
        wl = self.wl_mgr.get_watchlist().to_dict(orient='record')
        return wl

    @route('/reload_portfolio')
    def reload_portfolio(self):
        # self.logger.info('market data update!')
        self.logger.debug('reload_portfolio')
        self.broadcast_portfolio_allocation()
        self.logger.debug('done')

    @broadcast_bigsize(route='broadcast_portfolio_allocation',
                       exchange='trading_signal_exchange')
    def broadcast_portfolio_allocation(self):
        reslt = []
        current_qty_txn = self.wl_mgr.get_current_qty_and_txn()
        for lot in current_qty_txn['pos']:
            reslt.append({'content': lot, 'type': 'lot'})

        for txn in current_qty_txn['txn']:
            reslt.append({'content': txn, 'type': 'txn'})

        reslt.append(
            {'content': current_qty_txn['pos_date'], 'type': 'pos_date'})
        reslt.append(
            {'content': current_qty_txn['ref_date'], 'type': 'ref_date'})
        return reslt

    @broadcast(route='broadcast_reload', exchange='trading_signal_exchange')
    def broadcast_reload(self, component, value):
        return component, value, dt.datetime.now()


def main():
    logger = getLogger(
        'fix_msg_handler',
        '%(asctime)s %(name)-12s %(threadName)-10s %(levelname)-6s'
        ' %(funcName)-17s: %(message)s (at %(filename)s)'
    )
    logger.setLevel(logging.INFO)
    # logger.setLevel(logging.DEBUG)

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
