from six import iteritems, itervalues
import logging
from collections import OrderedDict
import datetime as dt

from . import update_attr, strftime, to_datetime, to_date, route, broadcast


class FIXOrdersHandlerMixIn(object):
    def __init__(
            self, order_ctx,
            logger=logging, **kargs):
        self.order_ctx = order_ctx
        self._orders = OrderedDict()

    @route('/todays_orders')
    def todays_orders(self):
        # iois = rfq_utils.active_iois(dt.datetime.now(), engine)
        for ioi in self._orders.values():
            yield ioi
        return

    @route('/handle_cancel_txn')
    def handle_cancel_txn(self, txn):
        raise NotImplementedError("handle_cancel_txn not implemented")

    @route('/send_orders')
    def send_orders(self, orderMsg):
        self.logger.debug('sending orders...')
        list_id = orderMsg.get('ListID', 'Default')
        orders = orderMsg.get('orders', [])
        users = [orderMsg['Email']]

        with self.order_ctx.with_time_out(50) as ctrl:
            try:
                ctrl.send_orders(list_id, orders, users)
            except Exception as e:
                self.logger.exception(e)
        return True

    @route('/respond_ioi')
    def respond_ioi(self, orderMsg, user):
        self.logger.debug('responding ioi: '+str(orderMsg))
        self.change_order_status(orderMsg, True, broadcast=True)
        try:
            with self.order_ctx.with_time_out(50) as ctrl:
                order = ctrl.respond_ioi(orderMsg, user)
                self.logger.info('ioi order send ' + str(order))
                self.record_new_order_unconfirmed(order)
                return order
        except Exception as e:
            self.logger.exception(e)
            self.change_order_status(orderMsg, False, broadcast=True)
            raise(e)

    @route('/replace_order')
    def replace_order(self, orderMsg, user):
        self.logger.debug('replacing order send ' + str(orderMsg))
        self.change_order_status(orderMsg, True, broadcast=True)

        try:
            with self.order_ctx.with_time_out(50) as ctrl:
                order = ctrl.replace_order(orderMsg, user)
                self.record_new_order_unconfirmed(order)
                self.logger.info('replace order send ' + str(order))
                return order
        except Exception as e:
            self.logger.exception(e)
            self.change_order_status(orderMsg, False, broadcast=True)
            raise(e)

    @route('/cancel_order')
    def cancel_order(self, orderMsg, user):
        self.logger.debug('canceling order send ' + str(orderMsg))
        self.change_order_status(orderMsg, True, broadcast=True)
        try:
            with self.order_ctx.with_time_out(50) as ctrl:
                order = ctrl.cancel_order(orderMsg, user)
                # self.record_new_order_unconfirmed(order)
                self.logger.debug('cancel order send ' + str(order))
                return order
        except Exception as e:
            self.logger.exception(e)
            self.change_order_status(orderMsg, False, broadcast=True)
            raise(e)

    def change_order_status(self, order, loading, broadcast=False):
        if order.get('IOIID'):
            ioi_id = order.get('IOIID')
            self.change_ioi_status(ioi_id, loading, broadcast)

        order['loading'] = loading

        order_id = order.get('ClOrdID')
        orig_order_id = order.get('OrigClOrdID')

        if order_id is not None:
            order_saved = self._orders.get(order_id)
            if order_saved:
                order_saved['loading'] = loading
            if broadcast:
                return self.broadcast_order_status(order_id, loading)

        if orig_order_id is not None:
            order_saved = self._orders.get(orig_order_id)
            if order_saved:
                order_saved['loading'] = loading
            if broadcast:
                return self.broadcast_order_status(orig_order_id, loading)

    @broadcast(route='broadcast_order_status', exchange='trading_signal_exchange')
    def broadcast_order_status(self, order_id, loading):
        self.logger.info('order_status' + str(order_id) + " " + str(loading))
        return order_id, loading

    def change_ioi_status(self, ioi_id, loading, broadcast=False):
        ioi = self._todays_ioi.get(ioi_id)
        if ioi:
            ioi['loading'] = loading

        if broadcast:
            self.broadcast_ioi_status(ioi_id, loading)

    @broadcast(route='broadcast_ioi_status', exchange='trading_signal_exchange')
    def broadcast_ioi_status(self, ioi_id, loading):
        self.logger.info(str(ioi_id) + " " + str(loading))
        return ioi_id, loading

    @broadcast(route='broadcast_order_update', exchange='trading_signal_exchange')
    def broadcast_order_update(self, order):
        self.logger.info(order)
        return order

    @broadcast(route='broadcast_new_order', exchange='trading_signal_exchange')
    def broadcast_new_order(self, order):
        self.logger.info(order)
        return order

    @broadcast(route='broadcast_replace_order', exchange='trading_signal_exchange')
    def broadcast_replace_order(self, order):
        return order

    @broadcast(route='broadcast_cancel_order', exchange='trading_signal_exchange')
    def broadcast_cancel_order(self, order):
        return order

    @broadcast(route='broadcast_order_cancel_reject', exchange='trading_signal_exchange')
    def broadcast_order_cancel_reject(self, order):
        return order

    @route('/handle_correct_txn')
    def handle_correct_txn(self, txn):
        raise NotImplementedError("handle_correct_txn not implemented")

    @route('/handle_reject_order')
    def handle_reject_order(self, order):
        self.change_order_status(order, False)
        self.record_update_order(order)

    @route('/handle_txn')
    def handle_txn(self, txn):
        if txn.get('Uncommitted', None) == 'Y':
            return

        self.logger.info(str(txn))
        if txn.get('ExecType') == 'F':
            self.record_txn(txn)
        else:
            self.logger.error(
                'unknown ExecType ' + txn.get('ExecType')+ ' txn:'+
                str(txn))

    @route('/handle_new_order')
    def handle_new_order(self, order):
        if order.get('Uncommitted', None) == 'Y':
            return

        self.logger.info(str(order))
        self.change_order_status(order, False)
        self.record_new_order(order)

    @route('/handle_replace_order')
    def handle_replace_order(self, order):
        self.logger.info(str(order))
        self.change_order_status(order, False)
        self.record_replace_order(order)

    @route('/handle_cancel_order')
    def handle_cancel_order(self, order):
        self.logger.info(str(order))
        self.change_order_status(order, False)
        self.record_cancel_order(order)

    @route('/handle_order_cancel_reject')
    def handle_order_cancel_reject(self, order):
        self.logger.info(str(order))
        self.change_order_status(order, False)
        self.record_order_cancel_reject(order)

    def record_new_order(self, order, broadcast=True):
        order_id = order['ClOrdID']
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = order
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                if self._orders[order_id].get('OrdStatus', '0') == '0':
                    update_attr(self._orders[order_id], order)

        order = self._orders[order_id]
        order['t_date'] = to_datetime(order['TransactTime'])

        if broadcast:
            self.broadcast_new_order(self._orders[order_id])

    def record_new_order_unconfirmed(self, order):
        order_id = order['ClOrdID']
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = order
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                return

    def record_update_order(self, order, broadcast=True):
        order_id = order['ClOrdID']
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = order
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                self._orders[order_id].update(order)

        order['t_date'] = to_datetime(order['TransactTime'])
        if broadcast:
            self.broadcast_order_update(self._orders[order_id])

    def record_txn(self, txn, broadcast=True):
        order_id = txn.get('ClOrdID')
        if order_id is None:
            return

        txn['t_date'] = to_datetime(txn['TransactTime'])
        with self._lock:
            if order_id not in self._orders:
                self._orders[order_id] = txn
                security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
                order['security_id'] = security_id
            else:
                self._orders[order_id].update(txn)

        if broadcast:
            self.broadcast_order_update(self._orders[order_id])

    def record_cancel_order(self, order, broadcast=True):
        ref_order_id = order.get('OrigClOrdID', order['ClOrdID'])

        with self._lock:
            security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
            order['security_id'] = security_id

            order_saved = self._orders.get(ref_order_id, {})
            order_saved.update(
                {k: v for k, v in iteritems(order)
                 if k not in ['ClOrdID', 'OrigClOrdID']})
        if broadcast:
            self.broadcast_cancel_order(order)

    def record_order_cancel_reject(self, order, broadcast=True):
        with self._lock:
            orig_order_id = order.get('OrigClOrdID')
            order_saved = self._orders.get(orig_order_id, {})
            order_saved['Text'] = order['Text']

        if broadcast:
            self.broadcast_order_cancel_reject(order)

    def record_replace_order(self, order, broadcast=True):
        orig_order_id = order['OrigClOrdID']
        order_id = order['ClOrdID']

        with self._lock:
            self._orders.pop(orig_order_id, {})
            order['t_date'] = to_datetime(order['TransactTime'])
            security_id = self.wl_mgr.ids_map().get(order['SecurityID'])
            order['security_id'] = security_id
            order_saved = self._orders[order_id]
            order_saved.update(order)

        if broadcast:
            self.broadcast_replace_order(order_saved)
