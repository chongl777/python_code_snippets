import sys
import os
import datetime as dt
import logging
from logging.handlers import RotatingFileHandler
from logging import Handler

from operation.email_func import send_mail


subject_tmplt = """
Error occurred in FIX engine:
{msg}
"""


class EmailLoggingHandler(Handler):
    """
    A handler class which writes logging records, appropriately formatted,
    to a stream. Note that this class does not close the stream, as
    sys.stdout or sys.stderr may be used.
    """

    terminator = '\n'

    def __init__(self, env, email_receivers, tag="default"):
        """
        Initialize the handler.
        """
        self._env = env
        self.email_receivers = email_receivers
        self.tag = tag
        Handler.__init__(self)

    def emit(self, record):
        try:
            t_date = dt.datetime.now()
            title = t_date.strftime(
                f'[{self._env}][FIX Error] [{self.tag}] %Y-%m-%d')
            subject = subject_tmplt.format(
                msg=self.format(record))
            send_mail(
                self.email_receivers,
                [""],
                title,
                subject)

        except Exception:
            self.handleError(record)

    def close(self):
        pass


logFormatter = logging.Formatter(
    '%(asctime)s %(module)-20s %(funcName)-20s '
    '%(name)-8s %(levelname)-7s: %(message)s')

# WFIAPPLOGFOLDER = os.environ.get('WFIAPPLOGFOLDER', '/logs/fixmsg/')
# LOGFILE = WFIAPPLOGFOLDER + '/fix.log'

# if not os.path.exists(os.path.dirname(LOGFILE)):
#     os.makedirs(os.path.dirname(LOGFILE))

# file_handler = RotatingFileHandler(
#     LOGFILE, maxBytes=10240000,
#     backupCount=10)
# file_handler.setFormatter(logFormatter)
# file_handler.setLevel(logging.DEBUG)

streamHandler = logging.StreamHandler(sys.stdout)
streamHandler.setFormatter(logFormatter)
streamHandler.setLevel(logging.DEBUG)
# logging.root.addHandler(streamHandler)

# logger = logging.getLogger('FixEngine')
# logger.addHandler(file_handler)
# logger.addHandler(streamHandler)
# logger.setLevel(logging.INFO)


def getLogger(name, logFormatter):
    if name in logging.Logger.manager.loggerDict:
        return logging.getLogger(name)
    logger = logging.getLogger(name)
    logger.propagate = False
    streamHandler = logging.StreamHandler(sys.stdout)
    streamHandler.setFormatter(logging.Formatter(logFormatter))
    logger.addHandler(streamHandler)
    return logger


if __name__ == '__main__':
    logger = logging.getLogger('pika.callback')
    logging.root.setLevel(logging.DEBUG)
