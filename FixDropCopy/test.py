# import gevent.monkey
# gevent.monkey.patch_socket()

import sys
import ssl
from enum import Enum
from datetime import datetime
import logging
import json

import pandas as pd
import numpy as np
from pandas.tseries.offsets import BDay
# import gevent

from wfifix.client_engine import ClientEngine
from wfifix.event import TimerEventRegistration
import wfifix.FIX44 as protocol
from wfifix.message import FIXContext
from wfifix.codec import Codec
from wfifix.session import FIXSession

from sqlutil.engines import engine_fix as dbengine_fix
from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc.mqserver import MQServer
from mqrpc.mqserver import route
from patterns.synchronization import Synchronization

from libs.wfijournaler import WFIJournalerClient
# from libs.select_connection_gevent import SelectConnection


class Side(Enum):
    buy = 1
    sell = 2


def test():
    codec = Codec(protocol)
    session = FIXSession('a', 'ef', 'dfe')
    msg = protocol.messages.Messages.new_orders()
    # msg.setField('6630', datetime.utcnow().strftime(
    #     "TestList_%Y%m%d_%H:%M:%S:%f"))
    msg.setField(protocol.fixtags.ListID, datetime.now().strftime(
        "TestListOrder_%Y%m%d_%H:%M:%S"))

    msg.setField(protocol.fixtags.BidType, 1)

    order = FIXContext()
    order.setField(protocol.fixtags.ClOrdID, "2asd")
    order.setField(protocol.fixtags.ListSeqNo, 1)
    order.setField(protocol.fixtags.Side, Side.buy.value)
    order.setField(protocol.fixtags.OrderQty, 3000000)
    order.setField(protocol.fixtags.Symbol, "[N/A]")
    order.setField(protocol.fixtags.SecurityID, "US983130AV78")
    order.setField(protocol.fixtags.SecurityIDSource, 4)
    # msg.setField(protocol.fixtags.Price, "90")
    # msg.setField(protocol.fixtags.HandlInst, "X")
    order.setField(protocol.fixtags.OrdType, 1)
    order.setField(protocol.fixtags.SettlType, 0)
    # msg.setField(protocol.fixtags.ExDestination, "XLON")
    order.setField(protocol.fixtags.PriceType, 1)
    party = FIXContext()
    party.setField(protocol.fixtags.PartyID,
                   "chong.liu@westfieldinvestment.com")
    party.setField(protocol.fixtags.PartyRole, 11)
    party.setField(protocol.fixtags.PartyIDSource, 'C')
    order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)
    msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)

    order = FIXContext()
    order.setField(protocol.fixtags.ClOrdID, '1asd')
    order.setField(protocol.fixtags.ListSeqNo, 2)
    order.setField(protocol.fixtags.Side, Side.sell.value)
    order.setField(protocol.fixtags.OrderQty, 2000000)
    order.setField(protocol.fixtags.Symbol, "[N/A]")
    order.setField(protocol.fixtags.SecurityID, "458204AQ7")
    order.setField(protocol.fixtags.SecurityIDSource, 1)
    # msg.setField(protocol.fixtags.Price, "90")
    # msg.setField(protocol.fixtags.HandlInst, "X")
    order.setField(protocol.fixtags.OrdType, 1)
    order.setField(protocol.fixtags.SettlType, 0)
    # msg.setField(protocol.fixtags.ExDestination, "XLON")
    order.setField(protocol.fixtags.PriceType, 1)
    party = FIXContext()
    party.setField(protocol.fixtags.PartyID,
                   "chong.liu@westfieldinvestment.com")
    party.setField(protocol.fixtags.PartyRole, 11)
    party.setField(protocol.fixtags.PartyIDSource, 'C')
    order.addRepeatingGroup(protocol.fixtags.NoPartyIDs, party)

    # msg.setField(protocol.fixtags.Currency, "GBP")
    # msg.setField(protocol.fixtags.TargetLocationID, 'Ticket')
    # msg.setField(
    #     protocol.fixtags.TransactTime,
    #     datetime.utcnow().strftime("%Y%m%d-%H:%M:%S.%f")[:-3])
    msg.addRepeatingGroup(protocol.fixtags.NoOrders, order)
    msg.setField(protocol.fixtags.TotNoOrders, 1)
    msg_encoded = codec.encode(msg, session).encode('utf-8')
    msg_encoded = b'8=FIX.4.4\x019=809\x0135=E\x0149=WESTFIXDEMO\x0156=TRADEWEB\x0134=25\x0152=20190806-18:46:52.922\x0166=Test\x01394=1\x0173=4\x0111=dc2987e4e6e34194b02b366a82b7f879\x0167=0\x0123505=Y\x0140=1\x0144=12\x0148=US639365AG06\x01423=1\x0158=test\x0154=1\x0155=[N/A]\x0163=0\x0138=1000000\x0122=4\x01453=1\x01448=chong.liu@westfieldinvestment.com\x01452=11\x01447=C\x0111=bd573f02a5ce449a8aed8319c7652570\x0167=0\x0123505=Y\x0140=1\x0144=12\x0148=US639365AG06\x01423=1\x0158=test\x0154=1\x0155=[N/A]\x0163=0\x0138=1000000\x0122=4\x01453=1\x01448=ren.gao@westfieldinvestment.com\x01452=11\x01447=C\x0111=f76a356e40de4aea83d9c23562ccbf83\x0167=0\x0123505=Y\x0140=1\x0144=23\x0148=US428040CT42\x01423=1\x0158=test\x0154=2\x0155=[N/A]\x0163=0\x0138=123000\x0122=4\x01453=1\x01448=chong.liu@westfieldinvestment.com\x01452=11\x01447=C\x0111=3b7b28595d414bf6920242a9748d90d7\x0167=0\x0123505=Y\x0140=1\x0144=23\x0148=US428040CT42\x01423=1\x0158=test\x0154=2\x0155=[N/A]\x0163=0\x0138=123000\x0122=4\x01453=1\x01448=ren.gao@westfieldinvestment.com\x01452=11\x01447=C\x0168=2\x0110=117\x01'

    import pdb; pdb.set_trace()
    msg_decoded = codec.decode(msg_encoded)
    return msg_decoded


def test2():
    import logging
    from logger import getLogger, EmailLoggingHandler
    email_receivers = ['chong.liu@westfieldinvestment.com']

    log_level = logging.INFO
    log_format = '%(asctime)s %(name)-12s %(threadName)s ' + \
        '%(filename)-20s:%(funcName)-20s %(levelname)-7s: %(message)s'

    email_logging_handler = EmailLoggingHandler('UAT', email_receivers)
    email_logging_handler.setLevel(logging.CRITICAL)
    email_logging_handler.setFormatter(logging.Formatter(log_format))

    logger1 = getLogger('exec_rtp_con', log_format)
    logger1.setLevel(log_level)
    logger1.addHandler(email_logging_handler)

    logger1.critical('test')

    return ''


if __name__ == '__main__':
    aa = test2()
