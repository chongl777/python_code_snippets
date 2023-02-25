# import gevent.monkey
# gevent.monkey.patch_socket()

import sys
import threading
import ssl
from enum import Enum
from datetime import datetime
import json
import signal

import pandas as pd
import numpy as np

# from sqlutil.engines import engine_fix as dbengine_fix
from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqserver import route
from mqrpc3.mqclient import MQClientEngine

import wfifix.FIX44 as protocol
from wfifix.client_engine import ClientEngine
from wfifix.message import FIXContext
from wfifix.engine import thread_safe

from fixlibs.fix_journaler import FIXJournalerClient
from fixlibs.fix_mq_engine_multicon import FixMqEngine
from fixlibs.msg_handler_async import MsgHandler

import logging
from logger import getLogger, EmailLoggingHandler


env = 'PROD'
email_receivers = ['chong.liu@westfieldinvestment.com']


class Side(Enum):
    buy = 1
    sell = 2


MSG_HANDLER = MsgHandler(
    env, {
        'host': 'wfiubuntu01.wfi.local',
        'virtual_host': '/fix',
        'queue': 'trade_web_exec_rpt_retail',
    }, email_receivers=email_receivers)



class DropFIX(FixMqEngine):
    def __init__(
            self, journaler, mq_queue, mq_host, mq_virtual_host,
            signal_engine, socket_ctx=None,
            logger=logging, handle_msg=None):
        FixMqEngine.__init__(
            self, journaler=journaler,
            mq_queue=mq_queue, mq_host=mq_host,
            mq_virtual_host=mq_virtual_host,
            socket_ctx=socket_ctx, logger=logger,
            handle_msg=handle_msg)
        self.__logger = logger
        self.signal_engine = signal_engine

    @thread_safe
    @route('/shut_down')
    def shut_down(self):
        self.__logger.info("system shut down")
        raise SystemExit('shut down')

    def handle_txn(self, connectionHandler, msg):
        try:
            txn = super().handle_txn(connectionHandler, msg)
            MSG_HANDLER.send_txn_async(self, txn)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_cancel_txn(self, connectionHandler, msg):
        try:
            super().handle_cancel_txn(connectionHandler, msg)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_correct_txn(self, connectionHandler, msg):
        try:
            super().handle_correct_txn(connectionHandler, msg)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_new_order(self, connectionHandler, msg):
        try:
            order = super().handle_new_order(connectionHandler, msg)
            MSG_HANDLER.send_new_order_async(self, order)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_cancel_order(self, connectionHandler, msg):
        try:
            order = super().handle_cancel_order(connectionHandler, msg)
            MSG_HANDLER.send_cancel_order_async(self, order)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_order_cancel_reject(self, connectionHandler, msg):
        try:
            order = super().handle_order_cancel_reject(connectionHandler, msg)
            MSG_HANDLER.send_order_cancel_reject_async(self, order)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_replace_order(self, connectionHandler, msg):
        try:
            order = super().handle_replace_order(connectionHandler, msg)
            MSG_HANDLER.send_replace_order_async(self, order)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_order_reject(self, connectionHandler, msg):
        try:
            order = super().handle_order_reject(connectionHandler, msg)
            MSG_HANDLER.send_reject_order_async(self, order)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_ioi(self, connectionHandler, msg):
        e = NotImplementedError("handle_ioi not implemented")
        connectionHandler.logger.critical(e)
        raise(e)


def main():
    # logger.setLevel(logging.DEBUG)

    # log_level = logging.DEBUG
    log_level = logging.INFO
    log_format = '%(asctime)s %(name)-12s %(threadName)s ' + \
        '%(filename)-20s:%(funcName)-20s %(levelname)-7s: %(message)s'
    logger = getLogger('fix_engine', log_format)
    logger.setLevel(log_level)
    MSG_HANDLER.logger = logger

    email_logging_handler = EmailLoggingHandler(
        env, email_receivers, 'EXEC_RPT')
    email_logging_handler.setLevel(logging.CRITICAL)
    email_logging_handler.setFormatter(logging.Formatter(log_format))

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix',
        logger=logger, durable=True)

    with DropFIX(
            journaler=FIXJournalerClient(engine, logger),
            mq_queue='tradeweb_fix_prod_retail',
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix',
            signal_engine=signal_engine,
            handle_msg=MSG_HANDLER.handle_msg_async,
            logger=logger,
    ) as client_engine:
        try:
            logger1 = getLogger('exec_rtp_con', log_format)
            logger1.setLevel(log_level)
            logger1.addHandler(email_logging_handler)

            client_engine.client.add_connection(
                name='exec_rtp_con',
                host='wfiubuntu01.wfi.local', port=6000, protocol=protocol,
                targetCompId="TRADEWEB", senderCompId="WESTFIXTWD",
                stateless=False, logger=logger1)

            client_engine.run()
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client_engine.logger.error(e)
        except SystemExit as e:
            client_engine.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
