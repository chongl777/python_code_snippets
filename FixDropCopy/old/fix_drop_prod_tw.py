# import gevent.monkey
# gevent.monkey.patch_socket()

import logging
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
from mqrpc2.mqserver import MQServerMixIn
from mqrpc2.mqserver import route
from mqrpc2.mqclient import MQClientEngine
from patterns.synchronization import Synchronization

import wfifix.FIX44 as protocol
from wfifix.client_engine import ClientEngine
from wfifix.message import FIXContext
from wfifix.engine import thread_safe

from libs.wfijournaler import WFIJournalerClient
from fix_mq_engine import FixMqEngine

from logger import logger, streamHandler
from operation.email_func import send_mail


def handle_msg_async(handler, session, msg):
    subject_tmplt = """
Error occurred during handling the following message:
handler: {handler}
message: {msg}
error: {error}
"""

    def fn(session, msg):
        try:
            handler(session, msg)
        except Exception as e:
            logger.exception(e)
            try:
                t_date = dt.datetime.now()
                title = t_date.strftime(
                    '[FIX Handle Message Error-Prod Env] %Y-%m-%d, handler: ') + \
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


class Side(Enum):
    buy = 1
    sell = 2


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

    @route('/send_order')
    def sendOrdersToTW(self, order_info):
        connectionHandler = self.client.connections[0]
        session = connectionHandler.session
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
                               ord.get('ClOrdID', self.client.getClOrdID(session)))
                i += 1
                order.setField(protocol.fixtags.ListSeqNo, i)
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return True

    @route('/add_to_watch_list')
    def addToWatchList(self, pos_info):
        connectionHandler = self.client.connections[0]
        session = connectionHandler.session
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
                    ord.get('ClOrdID', self.client.getClOrdID(session)))
                i += 1
                order.setField(protocol.fixtags.ListSeqNo, i)
                order.setField(protocol.fixtags.Uncommitted, 'Y')
                for tag in ord.keys():
                    order.setField(getattr(protocol.fixtags, tag), ord[tag])

                order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
                msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

        msg.setField(protocol.fixtags.TotNoOrders, len(order_info['Orders']))
        self.sendMsg(msg, connectionHandler)
        self.__logger.info("sent orders:" + str(msg))
        return True

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
            self.__logger.error("Cancel Txn failed!")
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
            self.__logger.error("Correct Txn failed!")
            raise(e)

    def handle_reject(self, connectionHandler, msg):
        self.__logger.info('Order Rejected: ' + str(msg))

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
            self.__logger.error("Transaction failed")
            raise(e)


def main():
    # logger.setLevel(logging.DEBUG)
    logger.setLevel(logging.INFO)
    streamHandler.setFormatter(logging.Formatter(
        '%(asctime)s %(threadName)s %(filename)-20s:%(funcName)-20s'
        ' %(levelname)-7s: %(message)s'))

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix',
        logger=logger)

    with DropFIX(
            targetCompId="TRADEWEB",
            senderCompId="WESTFIXPROD",
            protocol=protocol,
            mq_queue='tradeweb_fix_prod',
            journaler=WFIJournalerClient(engine, logger),
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix',
            signal_engine=signal_engine,
            logger=logger, handle_msg=handle_msg_async,
    ) as client:
        try:
            # signal.signal(signal.SIGTERM, client.stop)
            # signal.signal(signal.SIGINT, client.stop)
            client.run('wfiubuntu01.wfi.local', 6000)
            # client.run('127.0.0.1', 9000)
        except Exception as e:
            client.logger.error(e)
        except SystemExit as e:
            client.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
