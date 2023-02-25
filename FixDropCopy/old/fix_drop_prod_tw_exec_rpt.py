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

from logger import getLogger
from operation.email_func import send_mail


class Side(Enum):
    buy = 1
    sell = 2


def handle_msg_async(handler, msg):
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
            logger.exception(e)
            try:
                t_date = dt.datetime.now()
                title = t_date.strftime(
                    '[PROD][FIX Handle Message Error] %Y-%m-%d, handler: ') + \
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

    threading.Thread(target=fn, args=(msg,)).start()


def send_ioi_async(fix_engine, ioi):
    subject_tmplt = """
IOI message should not be send to this engine
message: {msg}
"""

    def fn(ioi):
        try:
            t_date = dt.datetime.now()
            title = t_date.strftime(
                '[PROD][FIX ioi Message Error] %Y-%m-%d')
            subject = subject_tmplt.format(
                msg=repr(msg))
            send_mail(
                ["chong.liu@westfieldinvestment.com",],
                [""],
                title,
                subject)
        except Exception as e:
            logger.exception(e)

    threading.Thread(target=fn, args=(ioi,)).start()


def send_txn_async(fix_engine, txn):
    subject_tmplt = """
Error occurred during sending the following ExceReport message:
error: {error}

message: {msg}
"""
    def fn(txn):
        try:
            with fix_engine.signal_engine.connect() as con:
                con.call('/handle_txn', txn)
        except Exception as e:
            logger.exception(e)
            try:
                t_date = dt.datetime.now()
                title = t_date.strftime(
                    '[PROD][FIX Send ExceRpt Error] %Y-%m-%d')
                subject = subject_tmplt.format(
                    msg=repr(txn), error=repr(e))
                send_mail(
                    ["chong.liu@westfieldinvestment.com",],
                    [""],
                    title,
                    subject)
            except Exception as e:
                logger.exception(e)

    threading.Thread(target=fn, args=(txn,)).start()


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
    def responseIOI(self, ioi_info, resp_info):
        self.__logger('not implemented yet')
        # connectionHandler = self.client.get_connection('exec_rtp_con')
        # codec = connectionHandler.codec
        # protocol = codec.protocol
        # tags = protocol.fixtags
        # order_info = ioi_info
        # utcnow = dt.datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')
        # msg = protocol.messages.Messages.new_order()

        # msg.setField(tags.ClOrdID,
        #              resp_info.get('ClOrdID', connectionHandler.getClOrdID()))

        # msg.setField(tags.IOIID, ioi_info['IOIID'])
        # msg.setField(tags.Side, resp_info['Side'])
        # msg.setField(tags.OrderQty, resp_info['OrderQty'])
        # msg.setField(
        #     tags.TransactTime, resp_info.get('TransactTime', utcnow))

        # msg.setField(tags.Price, resp_info['Price'])
        # msg.setField(tags.Symbol, ioi_info.get('Symbol', '[N/A]'))
        # msg.setField(tags.SecurityID, ioi_info['SecurityID'])
        # msg.setField(tags.SecurityIDSource, ioi_info['SecurityIDSource'])

        # msg.setField(tags.SettlDate, ioi_info['SettlDate'])
        # msg.setField(tags.OrdType, resp_info['OrdType'])
        # msg.setField(tags.PriceType, resp_info['PriceType'])

        # party = FIXContext()
        # party.setField(tags.PartyID, resp_info['PartyID'])
        # party.setField(protocol.fixtags.PartyRole, 11)
        # party.setField(tags.PartyIDSource, 'C')

        # msg.addRepeatingGroup(tags.NoPartyIDs, party)
        # self.sendMsg(msg, connectionHandler)
        # connectionHandler.logger.info("sent orders:" + str(msg))
        return True

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
            send_txn_async(self, txn)
        except Exception as e:
            connectionHandler.logger.excpetion(e)

    def handle_ioi(self, connectionHandler, msg):
        try:
            # ioi = connectionHandler.handle_ioi(self, connectionHandler, msg)
            ioi = FixMqEngine.handle_ioi(self, connectionHandler, msg)
            send_ioi_async(self, ioi)
        except Exception as e:
            connectionHandler.logger.exception(e)

def main():
    log_level = logging.INFO
    # log_level = logging.DEBUG
    logger = getLogger(
        'fix_engine',
        '%(asctime)s %(name)-12s %(threadName)s %(filename)-20s:%(funcName)-20s'
        ' %(levelname)-7s: %(message)s'
    )
    logger.setLevel(log_level)

    signal_engine = MQClientEngine(
        'fix_msg_handle_queue', virtual_host='/fix',
        logger=logger, durable=True)

    with DropFIX(
            journaler=WFIJournalerClient(engine, logger),
            mq_queue='trade_web_exec_rpt',
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix',
            signal_engine=signal_engine, logger=logger,
            handle_msg=handle_msg_async,
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
                host='wfiubuntu01.wfi.local', port=6000, protocol=protocol,
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
