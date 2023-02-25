import threading
import logging
import datetime as dt

from operation.email_func import send_mail


class MsgHandler(object):
    def __init__(self, env, logger=logging,
                 response_info={}, email_receivers=None):
        self._env = env
        self.logger = logger
        self.response_info = response_info
        self.email_receivers = email_receivers or [
            'chong.liu@westfieldinvestment.com']

    def handle_msg_async(self, handler, msg):
        subject_tmplt = """
Error occurred during handling the following message:
handler: {handler}
message: {msg}
error: {error}
"""
        def fn(msg):
            try:
                handler(msg)
            except Exception as e:
                self.handle_error(msg, e)
                self.logger.exception(e)
                try:
                    t_date = dt.datetime.now()
                    title = t_date.strftime(
                        f'[{self._env}]'+
                        '[FIX Handle Message Error] %Y-%m-%d,'+
                        f' handler: {handler.__name__}')
                    subject = subject_tmplt.format(
                        handler=handler.__name__, msg=repr(msg),
                        error=repr(e))
                    send_mail(
                        self.email_receivers,
                        [""],
                        title,
                        subject)
                except Exception as e:
                    self.logger.exception(e)

        threading.Thread(target=fn, args=(msg,)).start()

    def handle_error(self, msg, e):
        subject_tmplt = """
    Error occurred during sending the following message:
    error: {error}

    message: {msg}
    """
        self.logger.exception(e)
        try:
            t_date = dt.datetime.now()
            title = t_date.strftime(
                f'[{self._env}]'+
                '[FIX Send Msg Error] %Y-%m-%d')
            subject = subject_tmplt.format(
                msg=repr(msg), error=repr(e))
            send_mail(
                self.email_receivers,
                [""],
                title,
                subject)
        except Exception as e:
            self.logger.critical(e)

    def send_ioi_async(self, fix_engine, ioi):
        def fn(ioi):
            try:
                ioi['response_info'] = self.response_info
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_ioi', ioi)
            except Exception as e:
                self.handle_error(ioi, e)

        threading.Thread(target=fn, args=(ioi,)).start()

    def send_txn_async(self, fix_engine, txn):
        def fn(txn):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_txn', txn)
            except Exception as e:
                self.handle_error(txn, e)
        threading.Thread(target=fn, args=(txn,)).start()

    def send_new_order_async(self, fix_engine, ord):
        def fn(ord):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_new_order', ord)
            except Exception as e:
                self.handle_error(ord, e)
        threading.Thread(target=fn, args=(ord,)).start()

    def send_cancel_order_async(self, fix_engine, ord):
        def fn(ord):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_cancel_order', ord)
            except Exception as e:
                self.handle_error(ord, e)

        threading.Thread(target=fn, args=(ord,)).start()

    def send_order_cancel_reject_async(self, fix_engine, ord):
        def fn(ord):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_order_cancel_reject', ord)
            except Exception as e:
                self.handle_error(ord, e)

        threading.Thread(target=fn, args=(ord,)).start()

    def send_replace_order_async(self, fix_engine, ord):
        def fn(ord):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_replace_order', ord)
            except Exception as e:
                self.handle_error(ord, e)

        threading.Thread(target=fn, args=(ord,)).start()

    def send_reject_order_async(self, fix_engine, order):
        def fn(ord):
            try:
                with fix_engine.signal_engine.connect() as con:
                    con.call('/handle_reject_order', order)
            except Exception as e:
                self.handle_error(ord, e)

        threading.Thread(target=fn, args=(order,)).start()
