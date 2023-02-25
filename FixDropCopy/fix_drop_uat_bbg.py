import sys
import ssl
from enum import Enum

import pandas as pd
import numpy as np
from pandas.tseries.offsets import BDay
import gevent

from sqlutil.engines import engine_fix as dbengine_fix
from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc.mqserver import MQServer
from mqrpc.mqserver import route
from patterns.synchronization import Synchronization

from wfifix.client_engine import ClientEngine
import wfifix.FIX42 as protocol
from fixlibs.wfijournaler import WFIJournaler

from fixlibs.select_connection_gevent import SelectConnection

from logger import logger
import logging


class Side(Enum):
    buy = 1
    sell = 2


class DropFIX(ClientEngine, MQServer):
    def __init__(
            self, targetCompId, senderCompId, protocol,
            journaler, mq_host, mq_virtual_host, socket_ctx=None,
            logger=logging.getLogger(__name__)):
        self.__logger = logger
        ClientEngine.__init__(
            self, targetCompId, senderCompId, protocol,
            journaler, socket_ctx, logger=logger)
        MQServer.__init__(
            self, mq_host, mq_virtual_host, SelectConnection)
        Synchronization.__init__(self)

    @route('/roll_over_session_bbg')
    def onRollOverSession(self):
        try:
            self.__logger.info('roll over trade web session')
            self.client.disconnectAndRollOverSession()
            return "roll over success"
        except Exception as err:
            self.__logger.error(err)
            self.__logger.error("exit program")
            exit()

    # def run(self, address, port):
    #     Thread(target=MQServer.run, args=(self, )).start()
    #     ClientEngine.run(self, address, port)

    def run(self, address, port):
        # MQServer.run(self)
        self.__logger.info('--------------- start server ----------------')
        gevent.joinall([
            gevent.spawn(MQServer.run, self),
            gevent.spawn(ClientEngine.run, self, address, port),
        ])

    def onExecutionReport(self, connectionHandler, msg):
        self.__logger.info('on Execution: ' + str(msg))

        try:
            codec = connectionHandler.codec
            protocol = codec.protocol
            res = {}
            res['SenderCompID'] = msg.get(protocol.fixtags.SenderCompID)
            res['TargetCompID'] = msg.get(protocol.fixtags.TargetCompID)
            res['MsgSeqNum'] = msg.get(protocol.fixtags.MsgSeqNum)
            res['ExecType'] = msg.get(protocol.fixtags.ExecType)
            res['OrderID'] = msg.get(protocol.fixtags.OrderID)
            res['ExecID'] = msg.get(protocol.fixtags.ExecID)
            res['Session'] = connectionHandler.session.key

            tt = pd.to_datetime(
                msg.get(protocol.fixtags.TransactTime, np.nan))
            st = pd.to_datetime(
                msg.get(protocol.fixtags.SendingTime, np.nan))

            res['TransactTime'] = tt if pd.isnull(tt) else \
                tt.tz_localize('utc').tz_convert('US/Eastern').replace(
                    tzinfo=None)

            res['SendingTime'] = st if pd.isnull(st) else \
                st.tz_localize('utc').tz_convert('US/Eastern').replace(
                    tzinfo=None)

            res['SettlDate'] = tt if pd.isnull(tt) else \
                tt.normalize() + BDay(2)

            res['Symbol'] = msg.get(protocol.fixtags.Symbol)
            res['SecurityID'] = msg.get(protocol.fixtags.SecurityID)
            res['SecurityIDSource'] = msg.get(
                protocol.fixtags.SecurityIDSource, np.nan)

            res['SecurityExchange'] = msg.get(
                protocol.fixtags.SecurityExchange)
            res['LastMkt'] = msg.get(protocol.fixtags.LastMkt)

            res['OrdType'] = msg.get(protocol.fixtags.OrdType)
            res['OrdStatus'] = msg.get(protocol.fixtags.OrdStatus)

            res['Side'] = msg.get(protocol.fixtags.Side)
            res['OrderQty'] = float(msg.get(protocol.fixtags.OrderQty, np.nan))
            res['LeavesQty'] = float(
                msg.get(protocol.fixtags.LeavesQty, np.nan))
            res['LastQty'] = float(msg.get(protocol.fixtags.LastQty, np.nan))
            res['CumQty'] = float(msg.get(protocol.fixtags.CumQty, np.nan))

            res['LastPx'] = float(msg.get(protocol.fixtags.LastPx, np.nan))
            res['AvgPx'] = float(msg.get(protocol.fixtags.AvgPx, np.nan))
            res['Price'] = float(msg.get(protocol.fixtags.Price, np.nan))
            res['Currency'] = msg.get(protocol.fixtags.Currency)

            res['ClOrdID'] = msg.get(protocol.fixtags.ClOrdID)

            res['Commission'] = float(
                msg.get(protocol.fixtags.Commission, np.nan))
            res['CommType'] = msg.get(protocol.fixtags.CommType)

            res['ExecBroker'] = msg.get(protocol.fixtags.ExecBroker)
            res['Rule80A'] = msg.get(protocol.fixtags.Rule80A)
            res['ExecInst'] = msg.get(protocol.fixtags.ExecInst)

            res['ExecTransType'] = msg.get(protocol.fixtags.ExecTransType)
            res['HandlInst'] = msg.get(protocol.fixtags.HandlInst)

            res['TimeInForce'] = msg.get(protocol.fixtags.TimeInForce)
            res['LastCapacity'] = msg.get(protocol.fixtags.LastCapacity)
            res['Text'] = msg.get(protocol.fixtags.Text)

            df = pd.DataFrame(res, index=[0])

            with engine.connect() as conn:
                df.to_sql(
                    'tbl_fix_execution_report', conn,
                    schema='fix', if_exists='append', index=False)
        except Exception as e:
            self.__logger.error("update failed "+repr(e))
            raise(e)


def main():
    import os
    logger.setLevel(logging.DEBUG)

    keyfile = "./pem_uat/key.pem"
    certfile = "./pem_uat/cert.pem"
    ca_certs = "./pem_uat/CACerts.pem"

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.load_verify_locations(os.path.abspath(ca_certs))
    ctx.load_cert_chain(os.path.abspath(certfile), os.path.abspath(keyfile))

    with DropFIX(
            targetCompId="BLPDROPUAT",
            senderCompId="WESTFIELDDRP",
            protocol=protocol,
            journaler=WFIJournaler(engine, logger),
            socket_ctx=ctx) as client:
        client.run('69.191.198.34', 8228)

    logging.info("All done... shutting down")


if __name__ == '__main__':
    # import pandas as pd
    # with engine_fix.connect() as conn:
    #     data = pd.read_sql(
    #         """
    #         select * from dbo.message
    #         """, conn)
    #     pickle.loads(data.ix[0, 'msg'])
    main()
