# import gevent.monkey
# gevent.monkey.patch_socket()

import threading
import sys
import ssl
from enum import Enum
import logging

import pandas as pd
import numpy as np
from pandas.tseries.offsets import BDay

# from sqlutil.engines import engine_fix as dbengine_fix
from sqlutil.engines import engine
# from sqlutil.sql_operation import update_table
from mqrpc2.mqserver import MQServerMixIn
from mqrpc2.mqserver import route

import fixengine.FIX42 as protocol

from logger import logger, streamHandler
from fixlibs.fix_journaler import WFIJournalerClient
from fixlibs.fix_mq_engine_multicon import FixMqEngine


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

    def handle_txn(self, connectionHandler, msg):
        try:
            txn = FixMqEngine.handle_txn(self, connectionHandler, msg)
            send_txn_async(self, txn)
        except Exception as e:
            connectionHandler.logger.excpetion(e)


def main():
    import os
    logger.setLevel(logging.INFO)
    streamHandler.setFormatter(logging.Formatter(
        '%(asctime)s %(name)-8s %(levelname)-7s: %(message)s'))

    keyfile = "./pem_prod/key.pem"
    certfile = "./pem_prod/cert.pem"
    ca_certs = "./pem_prod/CACerts.pem"

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    ctx.verify_mode = ssl.CERT_REQUIRED
    ctx.load_verify_locations(os.path.abspath(ca_certs))
    ctx.load_cert_chain(os.path.abspath(certfile), os.path.abspath(keyfile))

    with DropFIX(
            protocol=protocol,
            mq_queue='bbg_fix_prod',
            journaler=WFIJournalerClient(engine, logger),
            mq_host='wfiubuntu01.wfi.local', mq_virtual_host='/fix',
            socket_ctx=ctx, handle_msg=handle_msg_async,
            logger=logger,
    ) as client_engine:
        try:
            client_engine.client.add_connection(
                name='exec_rpt',
                host='69.191.198.4', port=8228, protocol=protocol,
                targetCompId="BLPDROP", senderCompId="WESTFIELDDRP",
                stateless=False, logger=logger1)
            client_engine.run()
        except Exception as e:
            logger.error(e)
        except SystemExit as e:
            client.logger.error(e)

    logger.info("All done... shutting down")


if __name__ == '__main__':
    main()
