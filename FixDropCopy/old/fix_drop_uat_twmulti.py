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

from libs.fix_journaler import WFIJournalerClient
from libs.fix_mq_engine_multicon import FixMqEngine
from libs.msg_handler_async import MsgHandler

from logger import getLogger
from operation.email_func import send_mail


MSG_HANDLER = MsgHandler(
    'UAT', {
        'host': 'wfiubuntu01.wfi.local',
        'virtual_host': '/fix_uat',
        'queue': 'trade_web_uat_multicon',
        'route': '/respond_ioi',
    })


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

    @route('/test')
    def test(self):
        state = State.Start

        def fn():
            nonlocal state
            print(threading.currentThread())
            time.sleep(3)
            state = State.Failed

        self.client.add_callback_threadsafe(fn)
        while state == State.Start:
            time.sleep(0)

        if state == State.Success:
            return "Successfully executed"
        else:
            raise Exception("test failed")

    @thread_safe
    @route('/test2')
    def test2(self):
        print(threading.currentThread())
        return "success"
        # return "Successfully executed"

    @thread_safe
    @route('/shut_down')
    def shut_down(self):
        self.__logger.info("system shut down")
        raise SystemExit('shut down')

    @route('/respond_ioi')
    def respondIOI(self, order_info):
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

    @route('/replace_order')
    def replaceOrder(self, order_info):
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

    @route('/send_order')
    def sendOrders(self, order_info):
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
        self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        return 1

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
        self.sendMsg(msg, connectionHandler)
        connectionHandler.logger.info("sent orders:" + str(msg))
        return True

    def handle_txn(self, connectionHandler, msg):
        try:
            txn = FixMqEngine.handle_txn(self, connectionHandler, msg)
            MSG_HANDLER.send_txn_async(self, txn)
        except Exception as e:
            connectionHandler.logger.excpetion(e)

    def handle_cancel_order(self, connectionHandler, msg):
        try:
            order = FixMqEngine.handle_cancel_order(self, connectionHandler, msg)
            MSG_HANDLER.send_cancel_ord_async(self, order)
        except Exception as e:
            connectionHandler.logger.excpetion(e)

    def handle_replace_order(self, connectionHandler, msg):
        try:
            order = FixMqEngine.handle_replace_order(self, connectionHandler, msg)
            MSG_HANDLER.send_replace_ord_async(self, order)
        except Exception as e:
            connectionHandler.logger.excpetion(e)

    def handle_reject(self, connectionHandler, msg):
        try:
            order = FixMqEngine.handle_reject(self, connectionHandler, msg)
            MSG_HANDLER.send_reject_order_async(self, order)
        except Exception as e:
            connectionHandler.logger.excpetion(e)

    def handle_ioi(self, connectionHandler, msg):
        try:
            print(msg)
            # ioi = connectionHandler.handle_ioi(self, connectionHandler, msg)
            ioi = FixMqEngine.handle_ioi(self, connectionHandler, msg)
            MSG_HANDLER.send_ioi_async(self, ioi)
        except Exception as e:
            connectionHandler.logger.exception(e)

def main():
    log_level = logging.DEBUG
    # log_level = logging.INFO
    # logger.setLevel(log_level)
    logger = getLogger(
        'fix_engine',
        '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
        ' %(levelname)-7s: %(message)s'
    )
    logger.setLevel(log_level)
    MSG_HANDLER.logger = logger

    # streamHandler.setFormatter(logging.Formatter(
    #     '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
    #     ' %(levelname)-7s: %(message)s'))

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix_uat',
        logger=logger, durable=True)

    with DropFIX(
            journaler=WFIJournalerClient(engine, logger),
            mq_queue='trade_web_uat_multicon',
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix_uat',
            signal_engine=signal_engine, logger=logger,
            handle_msg=MSG_HANDLER.handle_msg_async,
    ) as client_engine:
        try:
            logger1 = getLogger(
                'exec_rtp_con',
                '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
                ' %(levelname)-7s: %(message)s'
            )
            logger1.setLevel(log_level)

            client_engine.client.add_connection(
                name='exec_rtp_con',
                host='wfiubuntu01.wfi.local', port=6001, protocol=protocol,
                targetCompId="TRADEWEB", senderCompId="WESTFIXDEMO",
                stateless=False, logger=logger1)

            logger2 = getLogger(
                'ioi_con',
                '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
                ' %(levelname)-7s: %(message)s'
            )
            logger2.setLevel(log_level)

            client_engine.client.add_connection(
                name='ioi_con',
                host='wfiubuntu01.wfi.local', port=6002, protocol=protocol,
                targetCompId="TRADEWEBIOI", senderCompId="WESTIOI",
                stateless=True, logger=logger2)
            client_engine.run()
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client_engine.logger.error(e)
        except SystemExit as e:
            client_engine.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
