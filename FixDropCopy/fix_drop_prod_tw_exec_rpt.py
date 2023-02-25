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
email_receivers = ['chong.liu@westfieldinvestment.com']
HOSTIP = 'wfiubuntu01'
MSG_HANDLER = MsgHandler(
    env, {
        'host': HOSTIP,
        'virtual_host': '/fix',
        'queue': 'trade_web_exec_rpt',
        'route': '/respond_ioi',
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

    @route('/respond_ioi')
    def respondIOI(self, order_info):
        self.__logger.info(order_info)
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        tags = protocol.fixtags
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        msg = protocol.messages.Messages.new_order()

        msg.setField(
            tags.ClOrdID,
            order_info.get('ClOrdID', connectionHandler.getClOrdID()))

        msg.setField(tags.IOIID, order_info['IOIID'])
        msg.setField(tags.Side, order_info['Side'])
        msg.setField(tags.OrderQty, order_info['OrderQty'])
        msg.setField(
            tags.TransactTime, order_info.get('TransactTime', utcnow))

        msg.setField(tags.Price, order_info['Price'])
        msg.setField(tags.Symbol, order_info.get('Symbol', '[N/A]'))
        msg.setField(tags.SecurityID, order_info['SecurityID'])
        msg.setField(tags.SecurityIDSource, order_info['SecurityIDSource'])

        msg.setField(tags.SettlDate, order_info['SettlDate'])
        msg.setField(tags.OrdType, order_info['OrdType'])
        msg.setField(tags.PriceType, order_info['PriceType'])

        party = FIXContext()
        party.setField(tags.PartyID, order_info['PartyID'])
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(tags.PartyIDSource, 'C')

        msg.addRepeatingGroup(tags.NoPartyIDs, party)
        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

    @route('/send_order')
    def sendOrder(self, order_info):
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        tags = protocol.fixtags
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        msg = protocol.messages.Messages.new_order()

        msg.setField(
            tags.ClOrdID,
            order_info.get('ClOrdID', connectionHandler.getClOrdID()))

        msg.setField(tags.Side, order_info['Side'])
        msg.setField(tags.OrderQty, order_info['OrderQty'])
        msg.setField(
            tags.TransactTime, order_info.get('TransactTime', utcnow))

        msg.setField(tags.Price, order_info['Price'])
        msg.setField(tags.Symbol, order_info.get('Symbol', '[N/A]'))
        msg.setField(tags.SecurityID, order_info['SecurityID'])
        msg.setField(tags.SecurityIDSource, order_info['SecurityIDSource'])

        msg.setField(tags.OrdType, order_info['OrdType'])
        msg.setField(tags.PriceType, order_info['PriceType'])

        if order_info.get('IOIID'):
            msg.setField(tags.IOIID, order_info['IOIID'])
            msg.setField(tags.SettlDate, order_info['SettlDate'])

        party = FIXContext()
        party.setField(tags.PartyID, order_info['PartyID'])
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(tags.PartyIDSource, 'C')

        msg.addRepeatingGroup(tags.NoPartyIDs, party)
        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

    @route('/replace_order')
    def replaceOrder(self, order_info):
        self.__logger.info(order_info)
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        tags = protocol.fixtags
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        msg = protocol.messages.Messages.order_replac_request()

        msg.setField(tags.OrigClOrdID, order_info['OrigClOrdID'])
        msg.setField(tags.ClOrdID,
                     order_info.get('ClOrdID', connectionHandler.getClOrdID()))

        if order_info.get('IOIID'):
            msg.setField(tags.IOIID, order_info['IOIID'])

        msg.setField(tags.Side, order_info['Side'])
        msg.setField(tags.OrderQty, order_info['OrderQty'])
        msg.setField(
            tags.TransactTime, order_info.get('TransactTime', utcnow))

        msg.setField(tags.Price, order_info['Price'])
        msg.setField(tags.Symbol, order_info.get('Symbol', '[N/A]'))
        msg.setField(tags.SecurityID, order_info['SecurityID'])
        msg.setField(tags.SecurityIDSource, order_info['SecurityIDSource'])

        msg.setField(tags.SettlDate, order_info['SettlDate'])
        msg.setField(tags.OrdType, order_info['OrdType'])
        msg.setField(tags.PriceType, order_info['PriceType'])

        party = FIXContext()
        party.setField(tags.PartyID, order_info['PartyID'])
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(tags.PartyIDSource, 'C')

        msg.addRepeatingGroup(tags.NoPartyIDs, party)
        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent replace orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

    @route('/cancel_order')
    def cacnelOrder(self, order_info):
        self.__logger.info(order_info)
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        tags = protocol.fixtags
        utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        msg = protocol.messages.Messages.order_cancel_request()

        msg.setField(tags.OrigClOrdID, order_info['OrigClOrdID'])
        msg.setField(tags.ClOrdID,
                     order_info.get('ClOrdID', connectionHandler.getClOrdID()))

        msg.setField(
            tags.TransactTime, order_info.get('TransactTime', utcnow))

        msg.setField(tags.Side, order_info['Side'])
        msg.setField(tags.OrderQty, order_info['OrderQty'])

        # msg.setField(tags.Price, resp_info['Price'])
        msg.setField(tags.Symbol, order_info.get('Symbol', '[N/A]'))
        msg.setField(tags.SecurityID, order_info['SecurityID'])
        msg.setField(tags.SecurityIDSource, order_info['SecurityIDSource'])

        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("cancel orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

    @route('/send_orders')
    def sendOrders(self, order_info):
        self.__logger.info(order_info)
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        order_info = json.loads(order_info)
        msg = protocol.messages.Messages.new_orders()
        msg.setField(protocol.fixtags.ListID, order_info['ListID'])
        msg.setField(protocol.fixtags.BidType, 1)
        parties = []
        for email in order_info['Emails']:
            party = FIXContext()
            party.setField(protocol.fixtags.PartyID, email)
            party.setField(protocol.fixtags.PartyRole, 11)
            party.setField(protocol.fixtags.PartyIDSource, 'C')
            parties.append(party)

        i = 0
        for ord in order_info['Orders']:
            for party in parties:
                order = FIXContext()
                order.setField(
                    protocol.fixtags.ClOrdID,
                    ord.get('ClOrdID', connectionHandler.getClOrdID()))
                order.setField(protocol.fixtags.ListSeqNo, ++i)
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

    @route('/add_to_watch_list')
    def addToWatchList(self, pos_info):
        connectionHandler = self.client.get_connection('exec_rtp_con')
        codec = connectionHandler.codec
        protocol = codec.protocol
        order_info = json.loads(pos_info)
        msg = protocol.messages.Messages.new_orders()
        msg.setField(protocol.fixtags.ListID, order_info['ListID'])
        msg.setField(protocol.fixtags.BidType, 1)

        parties = []
        for email in order_info['Emails']:
            party = FIXContext()
            party.setField(protocol.fixtags.PartyID, email)
            party.setField(protocol.fixtags.PartyRole, 11)
            party.setField(protocol.fixtags.PartyIDSource, 'C')
            parties.append(party)

        i = 0
        for ord in order_info['Orders']:
            for party in parties:
                order = FIXContext()
                order.setField(
                    protocol.fixtags.ClOrdID,
                    ord.get('ClOrdID', connectionHandler.getClOrdID()))
                order.setField(protocol.fixtags.ListSeqNo, ++i)
                order.setField(protocol.fixtags.Uncommitted, 'Y')
                # order.setField('23505', 'Y')
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        msg = self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        msg_dict = protocol.messages.Messages.translate_msg(msg)
        return msg_dict

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
    # log_level = logging.INFO
    log_level = logging.DEBUG
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
            mq_queue='trade_web_exec_rpt',
            mq_host=HOSTIP, mq_virtual_host='/fix',
            signal_engine=signal_engine, logger=logger,
            handle_msg=MSG_HANDLER.handle_msg_async,
    ) as client_engine:
        try:
            logger1 = getLogger('exec_rtp_con', log_format)
            logger1.setLevel(log_level)
            logger1.addHandler(email_logging_handler)

            client_engine.client.add_connection(
                name='exec_rtp_con',
                host=HOSTIP, port=6000, protocol=protocol,
                targetCompId="TRADEWEB", senderCompId="WESTFIXPROD",
                stateless=False, logger=logger1)

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
