# import gevent.monkeyo
# gevent.monkey.patch_socket()

import threading
import sys
import ssl
from datetime import datetime
import logging
import time
import json
import copy as cp
from abc import ABC, abstractmethod


from fixengine.client_engine import ClientEngine
from fixengine.engine import thread_safe
from fixengine.event import TimerEventRegistration
import fixengine.FIX44 as protocol
from fixengine.message import FIXContext

# from sqlutil.sql_operation import update_table
from mqrpc3.mqserver import MQServerMixIn
from mqrpc3.mqserver import route


def default_handle_msg(fn, msg):
    fn(msg)


class FixMqEngine(ClientEngine, MQServerMixIn):
    def __init__(
            self, journaler, mq_queue, mq_host, mq_virtual_host,
            socket_ctx=None, logger=logging, handle_msg=None):
        self.__logger = logger
        ClientEngine.__init__(
            self, journaler, socket_ctx=socket_ctx, logger=logger)
        MQServerMixIn.__init__(
            self, mq_queue, exchange='signal_exchange',
            host=mq_host, virtual_host=mq_virtual_host)
        self.handle_msg = handle_msg or default_handle_msg

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, type, value, traceback):
        self.stop()
        ClientEngine.close(self)
        MQServerMixIn.thread_safe_close(self)

    def connect(self):
        MQServerMixIn.connect(self)
        ClientEngine.connect(self)

    def onLogin(self, connectionHandler, msg):
        connectionHandler.logger.info(
            "Logged in to " + str(connectionHandler.address()))

    def run(self):
        self.__logger.info('--------------- start server ----------------')
        try:
            threading.Thread(
                target=MQServerMixIn.run, args=(self, True),
                daemon=True
            ).start()
            ClientEngine.run(self)
        except Exception as e:
            raise(e)

    @thread_safe
    def close(self):
        self.stop()
        ClientEngine.close(self)
        MQServerMixIn.thread_safe_close(self)

    def stop(self):
        ClientEngine.stop(self)
        MQServerMixIn.stop(self)
        self.__logger.info('--------stop--------')

    @route('/roll_over_session')
    def onRollOverSession(self, connection_name=None):
        def fn():
            try:
                self.__logger.info(
                    'roll over session: '+
                    ('all' if connection_name is None else connection_name) +
                    ' connection')
                self.client.disconnectAndRollOverSession(connection_name)
                self.__logger.info(
                    'roll over successfully: '+
                    ('all' if connection_name is None else connection_name) +
                    ' connection')
            except Exception as err:
                self.__logger.critical(err)
                self.__logger.error("exit program")
                sys.exit()
        self.client.add_callback_threadsafe(fn)
        return "roll over successfully"

    @thread_safe
    def sendMsg(self, msg, connectionHandler):
        return connectionHandler.sendMsg(msg)

    @abstractmethod
    def handle_cancel_txn(self, connectionHandler, msg):
        connectionHandler.logger.info('on Cancel Txn: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        txn = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleCancelTxn, cp.copy(txn))
        return txn

    @abstractmethod
    def handle_correct_txn(self, connectionHandler, msg):
        connectionHandler.logger.info('on Correct Txn: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        txn = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleCorrectTxn, cp.copy(txn))
        return txn

    @abstractmethod
    def handle_new_order(self, connectionHandler, msg):
        connectionHandler.logger.info('on New Order: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        order = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleNewOrd, cp.copy(order))
        return order

    @abstractmethod
    def handle_cancel_order(self, connectionHandler, msg):
        connectionHandler.logger.info('on Cancel Order: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        order = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleCancelOrd, cp.copy(order))
        return order

    @abstractmethod
    def handle_order_cancel_reject(self, connectionHandler, msg):
        connectionHandler.logger.info('on Cancel Order Reject: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        order = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleCancelOrdReject, cp.copy(order))
        return order

    @abstractmethod
    def handle_replace_order(self, connectionHandler, msg):
        connectionHandler.logger.info('on Replace Order: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        order = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleReplaceOrd, cp.copy(order))
        return order

    @abstractmethod
    def handle_ioi(self, connectionHandler, msg):
        connectionHandler.logger.info('on IOI:' + str(msg))
        protocol = connectionHandler.codec.protocol
        ioi = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleIOI, cp.copy(ioi))
        return ioi

    @abstractmethod
    def handle_txn(self, connectionHandler, msg):
        connectionHandler.logger.info('on Transaction: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        txn = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleTxn, cp.copy(txn))
        return txn

    @abstractmethod
    def handle_order_reject(self, connectionHandler, msg):
        connectionHandler.logger.info('Order Rejected: ' + str(msg))
        protocol = connectionHandler.codec.protocol
        order = protocol.messages.Messages.translate_msg(msg)
        self.handle_msg(connectionHandler.handleOrderReject, cp.copy(order))
        return order

    def new_order_outbound(self, connectionHandler, msg):
        try:
            protocol = connectionHandler.codec.protocol
            order = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(connectionHandler.newOrderOutbound, cp.copy(order))
            return order
        except Exception as e:
            connectionHandler.logger.critical(e)
            raise(e)

    def order_replace_outbound(self, connectionHandler, msg):
        try:
            protocol = connectionHandler.codec.protocol
            order = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(connectionHandler.orderReplaceOutbound, cp.copy(order))
            return order
        except Exception as e:
            connectionHandler.logger.critical(e)
            raise(e)

    def new_order_list_outbound(self, connectionHandler, msg):
        try:
            protocol = connectionHandler.codec.protocol
            order = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(connectionHandler.newOrderListOutbound, cp.copy(order))
            return order
        except Exception as e:
            connectionHandler.logger.critical(e)
            raise(e)
