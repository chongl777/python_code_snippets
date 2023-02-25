    def unique_sids(self):
        sec_orders = set(
            [x.get('security_id') for x in self._orders.values()
             if x.get('security_id') is not None])
        return sec_orders


    # def response_ioi_order(self, ioi):
    #     threading.Thread(
    #         target=response_ioi_order,
    #         args=(ioi, self.logger), daemon=True).start()
    def match_watchlist(self, ioi, send_email=False):
        sid = ioi.get('SecurityID', None)
        info = self.wl_mgr.check_if_in_watchlist(
            sid, {'1': '2', '2': '1'}[ioi['Side']])
        if info is None:
            return

        user_rating = float(ioi.get('UserRating', '0'))

        if (user_rating > 1):
            ioi['categories'] = info['watch_list'].get('categories')
            ioi['reasons'] = info['watch_list'].get('reasons')
            res = {'security_id': info['security_id'],
                   'security_info': info['security_info'],
                   'market_data': info['market_data']}

            res.update({k: v for k, v in ioi.items()})

            # res = {'security_id': info['security_id']}
            # res.update({k: v for k, v in ioi.items()})

            if SEND_EMAIL and send_email and (ioi['IOITransType'] in ['N', 'R']):
                self.logger.info('sending notification email')
                t = threading.Thread(
                    target=send_watchlist_matched_notification,
                    args=(info, ioi, 'UAT',
                          ['chong.liu@westfieldinvestment.com']),
                    daemon=True)
                t.start()
                # t.join()
            return res
        return None

    @route('/test_ioi')
    def test_ioi(self, ioi):
        sid = ioi.get('SecurityID', None)
        info = self.wl_mgr.check_if_in_watchlist(
            sid, {'1': '2', '2': '1'}[ioi['Side']])
        if info is None:
            return

        ioi['categories'] = info['watch_list'].get('categories')
        ioi['reasons'] = info['watch_list'].get('reasons')
        res = {'security_id': info['security_id'],
               'security_info': info['security_info'],
               'market_data': info['market_data']}

        res.update({k: v for k, v in ioi.items()})
        self.broadcast_ioi(res)
        return res

    @route('/refresh_message_handler')
    def refresh_message_handler(self):
        self.logger.info('---- start refresh the server -----')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S start refresh all...')
        t_date = dt.datetime.now()
        self.logger.info("refresh watch list")

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S refresh watchlist...')
        self.wl_mgr.refresh_all()

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broadcast security info...')
        self.broadcast_securities_info()

        self.logger.info("load today's order")
        yield dt.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S reload today's order...")
        self.process_orders(
            fix_dbutils.load_today_orders(
                self, t_date, 'WESTFIXPROD', 'TRADEWEB', engine))

        self.logger.info("load today's ioi")
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
        self.logger.info('------------- done -------------')

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
            '%Y-%m-%d %H:%M:%S refresh watchlist done!')
        self.broadcast_watchlist()

    @route('/reload_mkt_data')
    def reload_mkt_data(self):
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
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S reload market data...')
        self.wl_mgr.refresh_trading_signal()

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broad cast market data...')
        res = []
        for sid in self.wl_mgr.unique_sids():
            data = self.wl_mgr.get_mkt_data(int(sid))
            res.append(data)
        self.broadcast_mktdata(res)

        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S broad cast market data done!')

    @route('/test')
    def test(self):
        self.broadcast_portfolio_allocation()
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S test start...')
        self.logger.info('test start!')
        time.sleep(2)
        self.logger.info('done!')
        yield dt.datetime.now().strftime(
            '%Y-%m-%d %H:%M:%S test done!')

    def load_securities_info(self):
        for sid in self.wl_mgr.unique_sids():
            sec_info = self.wl_mgr.get_security_info(int(sid))
            equity_sid = sec_info.get('equity_sid', None)
            if equity_sid is not None:
                self.wl_mgr.get_security_info(int(equity_sid))

    @route('/securities_info')
    def securities_info(self):
        self.logger.info('stream securities_info start')
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
        self.logger.info('stream securities_info done')

    @route('/add_security')
    def add_security(self, security_id):
        self.wl_mgr.add_security(security_id)
        self.broadcast_securities_info([security_id])
        mktdata = self.wl_mgr.get_mkt_data(int(security_id))
        self.broadcast_mktdata([mktdata])
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
        self.logger.info('stream mkt_data start')

        unique_sids = self.wl_mgr.unique_sids()
        self.logger.info('unique_sids ' + str(len(unique_sids)))

        for sids in chunks(unique_sids, CHUNK_SIZE):
            data = []
            for sid in sids:
                data.append(self.wl_mgr.get_mkt_data(int(sid)))
            yield data

        unique_eq_sids = self.wl_mgr.unique_eq_sids()
        self.logger.info('unique_eq_sids ' + str(len(unique_eq_sids)))
        for sids in chunks(unique_eq_sids, CHUNK_SIZE):
            data = []
            for sid in sids:
                data.append(self.wl_mgr.get_mkt_data(int(sid)))
            yield data

        self.logger.info('stream mkt_data done')

    @route('/mkt_data_old')
    def mkt_data_old(self):
        self.logger.info('stream mkt_data start')
        for sid in self.wl_mgr.unique_sids():
            yield self.wl_mgr.get_mkt_data(int(sid))
        self.logger.info('stream mkt_data done')

    @route('/debug')
    def debug(self, debug):
        self.debug = debug
        if debug:
            self.logger.setLevel(logging.DEBUG)
        else:
            self.logger.setLevel(logging.INFO)

    @route('/update_watchlist')
    def update_watchlist(self, sids, valid):
        wl_updates = self.wl_mgr.update_watchlist(sids, valid)
        self.broadcast_watchlist()

    @route('/portfolio_allocation')
    def portfolio_allocation(self):
        self.logger.info('stream portfolio allocation start')
        CHUNK_SIZE = 5

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

    # @route_bigsize('/portfolio_allocation_bigsize')
    # def portfolio_allocation_bigsize(self):
    #     self.logger.info('stream portfolio allocation start')
    #     CHUNK_SIZE = 5

    #     current_qty_txn = self.wl_mgr.get_current_qty_and_txn()
    #     data = []
    #     for lot in current_qty_txn['pos']:
    #         data.append({'content': lot, 'type': 'lot'})

    #     for txn in current_qty_txn['txn']:
    #         data.append({'content': txn, 'type': 'txn'})

    #     data.append(
    #         {'content': current_qty_txn['pos_date'], 'type': 'pos_date'})
    #     data.append(
    #         {'content': current_qty_txn['ref_date'], 'type': 'ref_date'})

    #     self.logger.info('stream portfolio allocation done')
    #     return data

    @route('/matched_iois')
    def matched_iois(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        i = 0
        imax = 10

        for ioi in list(self._matched_iois.values()):
            # i += 1
            # if 'security_id' not in ioi:
            #     import pdb; pdb.set_trace()

            # if i < imax and ioi['ValidUntilTime'] < dt.datetime.now():
            #     ioi['ValidUntilTime'] = dt.datetime.now() + dt.timedelta(
            #         seconds=(1+i)*50)
            #     ioi['IOIResponseTime'] = dt.datetime.now() + dt.timedelta(
            #         seconds=(1+i)*30)
            #     ioi['IOITransType'] = 'N'
            yield ioi
        return

    @route('/watchlist')
    def watchlist(self):
        self.logger.info('stream watchlist start')
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        # columns_include = [
        #     't_date', 'security_id', 'long_short', 'category', 'categories',
        #     'is_new', 'comments', 'sid_equity', 'reasons', 'valid']
        wl = self.wl_mgr.get_watchlist()

        for wi_chunk in chunks(wl.iterrows(), CHUNK_SIZE):
            data = []
            for _, wi in wi_chunk:
                data.append(wi.to_dict())
            yield data
        self.logger.info('stream watchlist done')

    @route('/mktdata_update')
    def mktdata_update(self, data):
        # self.logger.info('market data update!')
        self.logger.debug('mktdata_update')
        processed_data = self.wl_mgr.update_mkt_data(data)
        res = []
        for sid in processed_data:
            processed_data[sid].update({'security_id': sid})
            res.append(processed_data[sid])
        self.broadcast_mktdata(res)
        self.logger.debug('done!')

    @broadcast(route='broadcast_mktdata', exchange='trading_signal_exchange')
    def broadcast_mktdata(self, mktdata):
        # self.logger.info('broad cast:' + str(mktdata))
        CHUNK_SIZE = 30
        for mktdatum in chunks(mktdata, CHUNK_SIZE):
            yield mktdatum

    @broadcast_bigsize(route='broadcast_watchlist', exchange='trading_signal_exchange')
    def broadcast_watchlist(self):
        # columns_include = [
        #     't_date', 'security_id', 'long_short', 'category', 'categories',
        #     'is_new', 'comments', 'sid_equity', 'reasons', 'valid']
        wl = self.wl_mgr.get_watchlist().to_dict(orient='record')
        return wl

    @broadcast(route='broadcast_reload', exchange='trading_signal_exchange')
    def broadcast_reload(self, component, value):
        return component, value, dt.datetime.now()

    @route('/reload_portfolio')
    def reload_portfolio(self):
        # self.logger.info('market data update!')
        self.logger.info('reload_portfolio')
        self.broadcast_portfolio_allocation()
        self.logger.info('done')

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


def main():
    logger = getLogger(
        'fix_msg_handler',
        '%(asctime)s %(name)-12s %(threadName)-10s %(levelname)-6s %(funcName)-17s: %(message)s'
    )
    logger.setLevel(logging.DEBUG)

    mq_queue = 'fix_msg_handle_queue'
    # signal_queue = 'trading_signal_queue'
    # signal_exchange = 'trading_signal_exchange'
    virtual_host = '/fix_uat'
    with FIXMessageHandler(
            mq_queue,
            host='wfiubuntu01.wfi.local',
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
