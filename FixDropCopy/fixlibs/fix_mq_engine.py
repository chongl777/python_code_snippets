# import gevent.monkeyo
# gevent.monkey.patch_socket()

import threading
import sys
import ssl
from datetime import datetime
import logging
import time
import json

from wfifix.client_engine import ClientEngine
from wfifix.engine import thread_safe
from wfifix.event import TimerEventRegistration
import wfifix.FIX44 as protocol
from wfifix.message import FIXContext

# from sqlutil.sql_operation import update_table
from mqrpc2.mqserver import MQServerMixIn
from mqrpc2.mqserver import route


def default_handle_msg(fn, session, msg):
    fn(session, msg)


class FixMqEngine(ClientEngine, MQServerMixIn):
    def __init__(
            self, targetCompId, senderCompId, protocol,
            journaler, mq_queue, mq_host, mq_virtual_host,
            socket_ctx=None, logger=logging, handle_msg=None):
        self.__logger = logger
        ClientEngine.__init__(
            self, targetCompId, senderCompId, protocol, journaler,
            socket_ctx=socket_ctx, logger=logger)
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
        self.__logger.info("Logged in")

    def run(self, address, port):
        self.__logger.info('--------------- start server ----------------')
        try:
            threading.Thread(
                target=MQServerMixIn.run, args=(self, True),
                daemon=True
            ).start()
            ClientEngine.run(self, address, port)
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
    def onRollOverSession(self):
        def fn():
            try:
                self.__logger.info('roll over trade web session')
                self.client.disconnectAndRollOverSession()
                self.__logger.info('roll over successfully')
            except Exception as err:
                self.__logger.exception(err)
                self.__logger.error("exit program")
                sys.exit()
        self.client.add_callback_threadsafe(fn)
        return "roll over successfully"

    @thread_safe
    def sendMsg(self, msg, connectionHandler):
        return connectionHandler.sendMsg(msg)

    def handle_cancel_txn(self, connectionHandler, msg):
        self.__logger.info('on Cancel Txn: ' + str(msg))
        try:
            protocol = connectionHandler.codec.protocol
            txn = protocol.messages.Messages.translate_msg(msg)
            session = connectionHandler.session
            self.handle_msg(self.client.cancelTxn, session, txn)
            return txn
        except Exception as e:
            self.__logger.error("Cancel Txn failed: "+repr(e))
            raise(e)

    def handle_correct_txn(self, connectionHandler, msg):
        self.__logger.info('on Correct Txn: ' + str(msg))
        try:
            protocol = connectionHandler.codec.protocol
            session = connectionHandler.session
            txn = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(self.client.correctTxn, session, txn)
            return txn
        except Exception as e:
            self.__logger.error("Correct Txn failed:"+repr(e))
            raise(e)

    def handle_ioi(self, connectionHandler, msg):
        self.__logger.info('on IOI:' + str(msg))
        try:
            protocol = connectionHandler.codec.protocol
            session = connectionHandler.session
            ioi = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(self.client.handleIOI, session, ioi)
            return ioi
        except Exception as e:
            self.__logger.error("Handle IOI failed " + repr(e))
            self.__logger.exception(e)
            raise(e)

    def handle_txn(self, connectionHandler, msg):
        self.__logger.info('on Transaction: ' + str(msg))

        try:
            session = connectionHandler.session
            protocol = connectionHandler.codec.protocol
            txn = protocol.messages.Messages.translate_msg(msg)

            self.handle_msg(self.client.handleTxn, session, txn)
            return txn
        except Exception as e:
            self.__logger.error("Transaction failed "+repr(e))
            self.__logger.exception(e)
            raise(e)

    def handle_reject(self, connectionHandler, msg):
        self.__logger.info('Order Rejected: ' + str(msg))
        try:
            session = connectionHandler.session
            order = protocol.messages.Messages.translate_msg(msg)
            self.handle_msg(self.client.handleReject, session, order)
            return order
        except Exception as e:
            self.__logger.error("Handle Reject failed "+repr(e))
            self.__logger.exception(e)
            raise(e)
