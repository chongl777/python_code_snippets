import logging

import pickle
from sqlutil.engines import engine
from wfifix.codec import Codec
import wfifix.FIX44 as protocol
from wfifix.session import FIXClientSession
from logger import logger, streamHandler

logger.setLevel(logging.DEBUG)
# logger.setLevel(logging.ERROR)
streamHandler.setFormatter(logging.Formatter(
    '%(asctime)s %(threadName)s %(filename)-20s:%(funcName)-20s'
    ' %(levelname)-7s: %(message)s'))



if __name__ == '__main__':
    # msg = engine.execute(
    #     'select msg from [fix].[message] where id = 1565798').fetchone()
    msg = engine.execute(
        'select msg from [fix].[message] where id = 3188116').fetchone()
    msgobj = pickle.loads(msg[0])
    codec = Codec(protocol)
    session = FIXClientSession(1204, 'TRADEWEB', 'WESTFIXPROD')

    msg_binary = codec.encode(msgobj, session)
    print(msg_binary[:1000])
