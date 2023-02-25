# import gevent.monkey
# gevent.monkey.patch_socket()

import threading
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
import gevent

from wfifix.client_engine import ClientEngine
from wfifix.engine import thread_safe
from wfifix.event import TimerEventRegistration
import wfifix.FIX44 as protocol
from wfifix.message import FIXContext

from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc.mqserver import MQServerMixIn
from mqrpc.mqserver import route
from patterns.synchronization import Synchronization

from fixlibs.wfijournaler import WFIJournalerClient

from logger import logger, streamHandler


class Side(Enum):
    buy = 1
    sell = 2


class State(Enum):
    Start = 1
    Success = 2
    Failed = 3


class DropFIX(ClientEngine, MQServerMixIn):
    def __init__(
            self, targetCompId, senderCompId, protocol,
            journaler, mq_host, mq_virtual_host,
            socket_ctx=None, logger=logging):
        self.__logger = logger
        ClientEngine.__init__(
            self, targetCompId, senderCompId, protocol, journaler,
            socket_ctx=socket_ctx, logger=logger)
        MQServerMixIn.__init__(self, mq_host, mq_virtual_host)
        self.clOrdID = 9

    def onLogin(self, connectionHandler, msg):
        self.__logger.info("Logged in")
        # msgGenerator = TimerEventRegistration(
        #     lambda type, closure: self.sendOrders(closure),
        #     5, connectionHandler)
        # self.eventManager.registerHandler(msgGenerator)
        # self.ordered = False

    def run(self, address, port):
        # MQServer.run(self)
        self.__logger.info('--------------- start server ----------------')
        threading.Thread(
            target=MQServerMixIn.run, args=(self, True),
            daemon=True
        ).start()
        ClientEngine.run(self, address, port)

    def stop(self):
        ClientEngine.stop(self)
        MQServerMixIn.stop(self)
        self.__logger.info('--------stop--------')

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

    @route('/roll_over_session_tw_r')
    def onRollOverSession(self):
        def fn():
            try:
                self.__logger.info('roll over trade web session')
                self.client.disconnectAndRollOverSession()
                self.__logger.info('roll over successfully')
            except Exception as err:
                self.__logger.error(err)
                self.__logger.error("exit program")
                sys.exit()
        self.client.add_callback_threadsafe(fn)
        return "roll over successfully"

    @thread_safe
    def sendMsg(self, msg, connectionHandler):
        return connectionHandler.sendMsg(msg)

    @route('/send_order_to_tw_r')
    def sendOrdersToTW(self, order_info):
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

    @route('/add_to_watch_list_r')
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

    # def run(self, address, port):
    #     Thread(target=MQServer.run, args=(self, )).start()
    #     ClientEngine.run(self, address, port)

    def additional_attrs(self, connectionHandler, msg):
        protocol = connectionHandler.codec.protocol
        res = {}
        res['Session'] = connectionHandler.session.key
        tt = pd.to_datetime(
                msg.get(protocol.fixtags.TransactTime, float('NaN')))
        st = pd.to_datetime(
            msg.get(protocol.fixtags.SendingTime, float('NaN')))
        stt = pd.to_datetime(
            msg.get(protocol.fixtags.SettlDate, float('NaN')))

        res['TransactTime'] = tt if pd.isnull(tt) else \
            tt.tz_localize('utc').tz_convert('US/Eastern').replace(
                tzinfo=None)
        res['SendingTime'] = st if pd.isnull(st) else \
            st.tz_localize('utc').tz_convert('US/Eastern').replace(
                tzinfo=None)
        res['SettlDate'] = stt

        res['AssetSwapSpread'] = float(msg.get('6623', np.nan))
        res['BenchmarkYield'] = float(msg.get('6622', np.nan))
        res['Ispread'] = float(msg.get('6624', np.nan))
        res['Zspread'] = float(msg.get('6625', np.nan))
        res['TradingSystemID'] = msg.get('6731')
        return res

    def handle_cancel_txn(self, connectionHandler, msg):
        self.__logger.info('on Cancel Txn: ' + str(msg))
        try:
            protocol = connectionHandler.codec.protocol
            self.client.cancelTxn(msg.get(
                protocol.fixtags.ExecRefID))
            res = protocol.messages.Messages.process_execution_rpt(msg)
            res.update(self.additional_attrs(connectionHandler, msg))

            df = pd.DataFrame(res, index=[0])

            with engine.connect() as conn:
                df.to_sql(
                    'tbl_fix_execution_report', conn,
                    schema='fix', if_exists='append', index=False)

        except Exception as e:
            self.__logger.error("Cancel Txn failed: "+repr(e))
            raise(e)

    def handle_correct_txn(self, connectionHandler, msg):
        self.__logger.info('on Correct Txn: ' + str(msg))
        try:
            protocol = connectionHandler.codec.protocol
            self.client.cancelTxn(msg.get(
                protocol.fixtags.ExecRefID))
            res = protocol.messages.Messages.process_execution_rpt(msg)
            res.update(self.additional_attrs(connectionHandler, msg))

            df = pd.DataFrame(res, index=[0])

            with engine.connect() as conn:
                df.to_sql(
                    'tbl_fix_execution_report', conn,
                    schema='fix', if_exists='append', index=False)

        except Exception as e:
            self.__logger.error("Correct Txn failed:"+repr(e))
            raise(e)

    def handle_txn(self, connectionHandler, msg):
        self.__logger.info('on Transaction: ' + str(msg))

        try:
            protocol = connectionHandler.codec.protocol
            res = protocol.messages.Messages.process_execution_rpt(msg)
            res.update(self.additional_attrs(connectionHandler, msg))

            df = pd.DataFrame(res, index=[0])

            with engine.connect() as conn:
                df.to_sql(
                    'tbl_fix_execution_report', conn,
                    schema='fix', if_exists='append', index=False)
        except Exception as e:
            self.__logger.error("Transaction failed "+repr(e))
            raise(e)

    def handle_reject(self, connectionHandler, msg):
        self.__logger.info('Order Rejected: ' + str(msg))


def main():
    logger.setLevel(logging.DEBUG)
    # logger.setLevel(logging.ERROR)
    streamHandler.setFormatter(logging.Formatter(
        '%(asctime)s %(threadName)s %(filename)-20s:%(funcName)-20s'
        ' %(levelname)-7s: %(message)s'))

    with DropFIX(
            targetCompId="TRADEWEB",
            senderCompId="WESTFIXTWD",
            protocol=protocol,
            journaler=WFIJournalerClient(engine, logger),
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix_uat',
            logger=logger,
    ) as client:
        try:
            client.debug = True
            client.run('wfiubuntu01.wfi.local', 6001)
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client.logger.error(e)
        except SystemExit as e:
            client.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
