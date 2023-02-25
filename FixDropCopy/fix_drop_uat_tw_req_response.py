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
import wfifix.FIX44 as protocol
from wfifix.message import FIXContext
from wfifix.engine import thread_safe

from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc2.mqserver import MQServerMixIn
from mqrpc2.mqserver import route
from mqrpc2.mqclient import MQClientEngine

from fixlibs.wfijournaler import WFIJournalerClient
from fix_mq_engine import FixMqEngine

from logger import logger, streamHandler
from operation.email_func import send_mail


class Side(Enum):
    buy = 1
    sell = 2


class State(Enum):
    Start = 1
    Success = 2
    Failed = 3


def handle_msg_async(handler, session, msg):
    subject_tmplt = """
Error occurred during handling the following message:
handler: {handler}
error: {error}

message: {msg}
"""

    def fn(session, msg):
        try:
            handler(session, msg)
        except Exception as e:
            logger.exception(e)
            try:
                t_date = dt.datetime.now()
                title = t_date.strftime(
                    '[FIX Handle Message Error UAT Env] %Y-%m-%d, handler: ') + \
                    handler.__name__
                subject = subject_tmplt.format(
                    handler=handler.__name__, msg=repr(msg),
                    error=repr(e))
                send_mail(
                    ["chong.liu@westfieldinvestment.com",],
                    [""],
                    title,
                    subject)
            except Exception as e:
                logger.exception(e)

    threading.Thread(target=fn, args=(session, msg)).start()


def send_ioi_async(fix_engine, ioi):
    subject_tmplt = """
Error occurred during sending the following ioi message:
error: {error}

message: {msg}
"""

    def fn(ioi):
        try:
            ioi['response_info'] = {
                'host': 'wfiubuntu01.wfi.local',
                'virtual_host': '/fix_uat',
                'queue': 'trade_web_uat',
                'route': '/respond_ioi',
            }
            with fix_engine.signal_engine.connect() as con:
                con.call('/handle_ioi', ioi)
        except Exception as e:
            logger.exception(e)
            try:
                t_date = dt.datetime.now()
                title = t_date.strftime(
                    '[FIX Send IOI Error UAT Env] %Y-%m-%d')
                subject = subject_tmplt.format(
                    msg=repr(ioi), error=repr(e))
                send_mail(
                    ["chong.liu@westfieldinvestment.com",],
                    [""],
                    title,
                    subject)
            except Exception as e:
                logger.exception(e)

    threading.Thread(target=fn, args=(ioi, )).start()


class DropFIX(FixMqEngine):
    def __init__(
            self, targetCompId, senderCompId, protocol,
            journaler, mq_queue, mq_host, mq_virtual_host,
            signal_engine, socket_ctx=None,
            logger=logging, handle_msg=None):
        FixMqEngine.__init__(
            self,
            targetCompId=targetCompId, senderCompId=senderCompId,
            protocol=protocol, journaler=journaler,
            mq_queue=mq_queue, mq_host=mq_host,
            mq_virtual_host=mq_virtual_host,
            socket_ctx=socket_ctx, logger=logger,
            handle_msg=handle_msg)
        self.__logger = logger
        self.signal_engine = signal_engine

    def onLogin(self, connectionHandler, msg):
        self.__logger.info("Logged in")
        # msgGenerator = TimerEventRegistration(
        #     lambda type, closure: self.sendOrders(closure),
        #     5, connectionHandler)
        # self.eventManager.registerHandler(msgGenerator)
        # self.ordered = False

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

    @thread_safe
    def sendMsg(self, msg, connectionHandler):
        return connectionHandler.sendMsg(msg)

    @route('/send_order')
    def sendOrders(self, order_info):
        connectionHandler = self.client.connections[0]
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
                order.setField(protocol.fixtags.ClOrdID,
                               ord.get('ClOrdID', self.client.getClOrdID()))
                order.setField(protocol.fixtags.ListSeqNo, ++i)
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return 1

    @route('/add_to_watch_list')
    def addToWatchList(self, pos_info):
        connectionHandler = self.client.connections[0]
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
                order.setField(protocol.fixtags.ClOrdID,
                               ord.get('ClOrdID', self.client.getClOrdID()))
                order.setField(protocol.fixtags.ListSeqNo, ++i)
                order.setField(protocol.fixtags.Uncommitted, 'Y')
                # order.setField('23505', 'Y')
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return True

    @route('/respond_ioi')
    def responseIOI(self, ioi_info, resp_info):
        connectionHandler = self.client.connections[0]
        codec = connectionHandler.codec
        session = connectionHandler.session
        protocol = codec.protocol
        tags = protocol.fixtags
        import pdb; pdb.set_trace()
        order_info = ioi_info
        msg = protocol.messages.Messages.new_order()
        msg.setField(tags.ClOrdID, self.client.getClOrdID(session))
        msg.setField(tags.IOIID, ioi_info['IOIID'])
        msg.setField(tags.Side, ioi_info['Side'])
        msg.setField(tags.OrderQty, resp_info['Qty'])
        msg.setField(tags.TransactTime, ioi_info['TransactTime'])

        msg.setField(tags.Price, resp_info['Price'])
        msg.setField(tags.Symbol, ioi_info['Symbol'])
        msg.setField(tags.SecurityID, ioi_info['SecurityID'])
        msg.setField(tags.SecurityIDSource, ioi_info['SecurityIDSource'])
        msg.setField(tags.OrdType, '2')
        msg.setField(tags.PriceType, '1')
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return True

    @route('/response_to_ioi')
    def responseToIOI(self, ioi, price):
        connectionHandler = self.client.connections[0]
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
                order.setField(protocol.fixtags.ClOrdID,
                               ord.get('ClOrdID', self.client.getClOrdID()))
                order.setField(protocol.fixtags.ListSeqNo, ++i)
                order.setField(protocol.fixtags.Uncommitted, 'Y')
                # order.setField('23505', 'Y')
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return True

    def sendOrders(self, connectionHandler):
        if self.ordered:
            return

        codec = connectionHandler.codec
        protocol = codec.protocol

        msg = protocol.messages.Messages.new_orders()
        # msg.setField('6630', datetime.utcnow().strftime(
        #     "TestList_%Y%m%d_%H:%M:%S:%f"))
        msg.setField(protocol.fixtags.ListID, datetime.now().strftime(
            "TestListOrder_%Y%m%d_%H:%M:%S"))
        msg.setField(protocol.fixtags.BidType, 1)

        party = FIXContext()
        party.setField(
            protocol.fixtags.RootPartyID, "chong.liu@westfieldinvestment.com")
        party.setField(protocol.fixtags.RootPartyIDSource, 'C')
        party.setField(protocol.fixtags.RootPartyRole, '11')
        msg.addRepeatingGroup(protocol.fixtags.NoRootParty, party)

        order = FIXContext()
        order.setField(protocol.fixtags.ClOrdID, self.client.getClOrdID())
        order.setField(protocol.fixtags.ListSeqNo, 1)
        order.setField(protocol.fixtags.Side, Side.buy.value)
        order.setField(protocol.fixtags.OrderQty, 3000000)
        order.setField(protocol.fixtags.Symbol, "[N/A]")
        order.setField(protocol.fixtags.SecurityID, "268787AJ7")
        order.setField(protocol.fixtags.SecurityIDSource, 1)
        # msg.setField(protocol.fixtags.Price, "90")
        # msg.setField(protocol.fixtags.HandlInst, "X")
        order.setField(protocol.fixtags.OrdType, 1)
        order.setField(protocol.fixtags.SettlType, 0)
        # msg.setField(protocol.fixtags.ExDestination, "XLON")
        order.setField(protocol.fixtags.PriceType, 1)
        order.setField(protocol.fixtags.Text, 'send test order uat')

        party = FIXContext()
        party.setField(protocol.fixtags.PartyID,
                       "chong.liu@westfieldinvestment.com")
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(protocol.fixtags.PartyIDSource, 'C')

        # order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)

        msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        order = FIXContext()
        order.setField(protocol.fixtags.ClOrdID, self.client.getClOrdID())
        order.setField(protocol.fixtags.ListSeqNo, 1)
        order.setField(protocol.fixtags.Side, Side.sell.value)
        order.setField(protocol.fixtags.OrderQty, 2000000)
        order.setField(protocol.fixtags.Symbol, "[N/A]")
        order.setField(protocol.fixtags.SecurityID, "458204AQ7")
        order.setField(protocol.fixtags.SecurityIDSource, 1)
        # msg.setField(protocol.fixtags.Price, "90")
        # msg.setField(protocol.fixtags.HandlInst, "X")
        order.setField(protocol.fixtags.OrdType, 1)
        order.setField(protocol.fixtags.SettlType, 0)
        order.setField(protocol.fixtags.Text, 'test text')
        # msg.setField(protocol.fixtags.ExDestination, "XLON")
        order.setField(protocol.fixtags.PriceType, 1)
        party = FIXContext()
        party.setField(protocol.fixtags.PartyID,
                       "chong.liu@westfieldinvestment.com")
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(protocol.fixtags.PartyIDSource, 'C')
        # order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)

        # msg.setField(protocol.fixtags.Currency, "GBP")
        # msg.setField(protocol.fixtags.TargetLocationID, 'Ticket')
        # msg.setField(
        #     protocol.fixtags.TransactTime,
        #     datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
        msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)
        msg.setField(protocol.fixtags.TotNoOrders, 1)

        self.sendMsg(msg, connectionHandler)

        self.__logger.info("sent orders:" + str(msg))
        self.ordered = True

    def sendOrder(self, connectionHandler):
        if self.ordered:
            return
        clOrdID = self.client.getClOrdID()
        codec = connectionHandler.codec
        protocol = codec.protocol

        msg = protocol.messages.Messages.new_order()
        msg.setField(protocol.fixtags.ClOrdID, str(clOrdID))

        msg.setField(protocol.fixtags.Price, "90")
        msg.setField(protocol.fixtags.OrderQty, 2000)
        msg.setField(protocol.fixtags.SecurityID, "268787AJ7")
        msg.setField(protocol.fixtags.Symbol, "[N/A]")
        msg.setField(protocol.fixtags.SecurityIDSource, 1)
        # msg.setField(protocol.fixtags.HandlInst, "X")
        msg.setField(protocol.fixtags.OrdType, 1)
        msg.setField(protocol.fixtags.SettlType, 0)
        # msg.setField(protocol.fixtags.ExDestination, "XLON")
        msg.setField(protocol.fixtags.Side, Side.buy.value)
        msg.setField(protocol.fixtags.PriceType, 1)
        # msg.setField(protocol.fixtags.Currency, "GBP")
        # msg.setField(protocol.fixtags.TargetLocationID, 'Ticket')
        msg.setField(
            protocol.fixtags.TransactTime,
            datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])

        msg.setField('6630', datetime.utcnow().strftime(
            "TestList_%Y%m%d_%H:%M:%S:%f"))

        party = FIXContext()
        party.setField(protocol.fixtags.PartyID,
                       "chong.liu@westfieldinvestment.com")
        party.setField(protocol.fixtags.PartyRole, 11)
        party.setField(protocol.fixtags.PartyIDSource, 'C')

        msg.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)

        # msg.setField(protocol.fixtags.NoPartyIDs, 1)
        # msg.setField(protocol.fixtags.PartyID,
        #              "chong.liu@westfieldinvestment.com")
        # msg.setField(protocol.fixtags.PartyRole, 11)
        # msg.setField(protocol.fixtags.PartyIDSource, 'C')

        self.sendMsg(msg, connectionHandler)

        side = Side(int(msg.getField(codec.protocol.fixtags.Side)))
        self.__logger.info(
            "---> [%s] %s: %s %s %s@%s" %
            (protocol.msgtype.msgTypeToName(msg.msgType),
             msg.getField(codec.protocol.fixtags.ClOrdID),
             msg.getField(codec.protocol.fixtags.SecurityID),
             side.name, msg.getField(codec.protocol.fixtags.OrderQty),
             msg.getField(codec.protocol.fixtags.Price)))
        self.ordered = True

    def handle_txn(self, connectionHandler, msg):
        try:
            txn = FixMqEngine.handle_txn(self, connectionHandler, msg)
        except Exception as e:
            self.__logger.excpetion(e)

    def handle_ioi(self, connectionHandler, msg):
        try:
            ioi = FixMqEngine.handle_ioi(self, connectionHandler, msg)
            send_ioi_async(self, ioi)
        except Exception as e:
            self.__logger.excpetion(e)


def main():
    logger.setLevel(logging.DEBUG)
    # logger.setLevel(logging.CRITICAL)
    streamHandler.setFormatter(logging.Formatter(
        '%(asctime)s %(threadName)s %(filename)-20s:%(funcName)-20s'
        ' %(levelname)-7s: %(message)s'))

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix_uat',
        logger=logger)

    with DropFIX(
            targetCompId="TRADEWEBIOI",
            senderCompId="WESTIOI",
            protocol=protocol,
            journaler=WFIJournalerClient(engine, logger),
            mq_queue='trade_web_uat_ioi',
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix_uat',
            signal_engine=signal_engine, logger=logger,
            # handle_msg=handle_msg_async,
    ) as client:
        try:
            client.debug = True
            client.run('wfiubuntu01.wfi.local', 6002)
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client.logger.exception(e)
        except KeyboardInterrupt as e:
            client.logger.error('KeyboardInterrupt')

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
    # msg_handle_queue='fix_msg_handle_queue'
    # mq_host='10.92.1.8'
    # mq_virtual_host='/fix_uat'
    # msg_handler = MQClient(
    #     msg_handle_queue, host=mq_host, virtual_host=mq_virtual_host)
    # with msg_handler:
    #     aa = msg_handler.call('/handle_ioi', ioi={})
