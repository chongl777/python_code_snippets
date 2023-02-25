import threading
import datetime as dt
import sys
import ssl
from enum import Enum
from datetime import datetime
import logging
import time
import json
import signal

import pandas as pd
import numpy as np
from pandas.tseries.offsets import BDay
import fixengine.FIX44 as protocol
from fixengine.message import FIXContext
from fixengine.engine import thread_safe

from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqserver import route
from mqrpc3.mqclient import MQClientEngine

from fixlibs.fix_journaler import FIXJournalerClient
from fixlibs.fix_mq_engine_multicon import FixMqEngine
from fixlibs.msg_handler_async import MsgHandler

from logger import getLogger, EmailLoggingHandler
from operation.email_func import send_mail


env = 'PROD'
HOSTIP = 'wfiubuntu01'
email_receivers = ['chong.liu@westfieldinvestment.com']
MSG_HANDLER = MsgHandler(
    env, {
        'host': HOSTIP,
        'virtual_host': '/fix',
        'queue': 'trade_web_exec_rpt',
    }, email_receivers=email_receivers)


class Side(Enum):
    buy = 1
    sell = 2


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

    def handle_ioi(self, connectionHandler, msg):
        try:
            ioi = super().handle_ioi(connectionHandler, msg)
            MSG_HANDLER.send_ioi_async(self, ioi)
        except Exception as e:
            connectionHandler.logger.critical(e)

    def handle_txn(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_cancel_txn(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_correct_txn(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_new_order(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_cancel_order(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_order_cancel_reject(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_replace_order(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))

    def handle_order_reject(self, connectionHandler, msg):
        connectionHandler.logger.critical(NotImplementedError("Not implemented"))


def main():
    log_level = logging.INFO
    log_format = '%(asctime)s %(name)-12s %(threadName)s ' + \
        '%(filename)-20s:%(funcName)-20s %(levelname)-7s: %(message)s'
    logger = getLogger('fix_engine', log_format)
    logger.setLevel(log_level)
    MSG_HANDLER.logger = logger

    email_logging_handler = EmailLoggingHandler(
        env, email_receivers, 'TW_IOI')
    email_logging_handler.setLevel(logging.CRITICAL)
    email_logging_handler.setFormatter(logging.Formatter(log_format))

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix',
        logger=logger, durable=True)

    with DropFIX(
            journaler=FIXJournalerClient(engine, logger),
            mq_queue='trade_web_ioi',
            mq_host=HOSTIP, mq_virtual_host='/fix',
            signal_engine=signal_engine, logger=logger,
            handle_msg=MSG_HANDLER.handle_msg_async,
    ) as client_engine:
        try:
            logger1 = getLogger('exec_rtp_con', log_format)
            logger1.setLevel(log_level)
            logger1.addHandler(email_logging_handler)

            client_engine.client.add_connection(
                name='ioi_con',
                host=HOSTIP, port=6004, protocol=protocol,
                targetCompId="TRADEWEBIOI", senderCompId="WESTPRODIOI",
                stateless=True, logger=logger1)

            # logger2 = getLogger(
            #     'ioi_con',
            #     '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
            #     ' %(levelname)-7s: %(message)s'
            # )
            # logger2.setLevel(log_level)

            # client_engine.client.add_connection(
            #     name='ioi_con',
            #     host='10.92.1.8', port=6002, protocol=protocol,
            #     targetCompId="TRADEWEBIOI", senderCompId="WESTIOI",
            #     logger=logger2)
            client_engine.run()
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client_engine.logger.error(e)
        except SystemExit as e:
            client_engine.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
