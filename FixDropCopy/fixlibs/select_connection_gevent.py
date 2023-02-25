"""A connection adapter that tries to use the best polling method for the
platform pika is running on.

"""
import abc
import collections
import os
import logging
import socket
from gevent import select
import errno
import time
from collections import defaultdict
import threading

import pika.compat
from pika.compat import dictkeys

from pika.adapters.base_connection import BaseConnection
from pika.adapters.select_connection import _PollerBase
from pika.adapters.select_connection import IOLoop

LOGGER = logging.getLogger(__name__)

# One of select, epoll, kqueue or poll
SELECT_TYPE = None

# Use epoll's constants to keep life easy
READ = 0x0001
WRITE = 0x0004
ERROR = 0x0008


# Reason for this unconventional dict initialization is the fact that on some
# platforms select.error is an aliases for OSError. We don't want the lambda
# for select.error to win over one for OSError.
_SELECT_ERROR_CHECKERS = {}
if pika.compat.PY3:
    #InterruptedError is undefined in PY2
    #pylint: disable=E0602
    _SELECT_ERROR_CHECKERS[InterruptedError] = lambda e: True
_SELECT_ERROR_CHECKERS[select.error] = lambda e: e.args[0] == errno.EINTR
_SELECT_ERROR_CHECKERS[IOError] = lambda e: e.errno == errno.EINTR
_SELECT_ERROR_CHECKERS[OSError] = lambda e: e.errno == errno.EINTR


# We can reduce the number of elements in the list by looking at super-sub
# class relationship because only the most generic ones needs to be caught.
# For now the optimization is left out.
# Following is better but still incomplete.
#_SELECT_ERRORS = tuple(filter(lambda e: not isinstance(e, OSError),
#                              _SELECT_ERROR_CHECKERS.keys())
#                       + [OSError])
_SELECT_ERRORS = tuple(_SELECT_ERROR_CHECKERS.keys())


def _is_resumable(exc):
    ''' Check if caught exception represents EINTR error.
    :param exc: exception; must be one of classes in _SELECT_ERRORS '''
    checker = _SELECT_ERROR_CHECKERS.get(exc.__class__, None)
    if checker is not None:
        return checker(exc)
    else:
        return False


class GeventIOLoop(IOLoop):
    @staticmethod
    def _get_poller(get_wait_seconds, process_timeouts):
        poller = None

        kwargs = dict(get_wait_seconds=get_wait_seconds,
                      process_timeouts=process_timeouts)
        LOGGER.debug('Using GeventSelectPoller')
        poller = GeventSelectPoller(**kwargs)

        return poller


class SelectConnection(BaseConnection):
    """An asynchronous connection adapter that attempts to use the fastest
    event loop adapter for the given platform.

    """

    def __init__(self,  # pylint: disable=R0913
                 parameters=None,
                 on_open_callback=None,
                 on_open_error_callback=None,
                 on_close_callback=None,
                 stop_ioloop_on_close=True,
                 custom_ioloop=None):
        """Create a new instance of the Connection object.

        :param pika.connection.Parameters parameters: Connection parameters
        :param method on_open_callback: Method to call on connection open
        :param method on_open_error_callback: Called if the connection can't
            be established: on_open_error_callback(connection, str|exception)
        :param method on_close_callback: Called when the connection is closed:
            on_close_callback(connection, reason_code, reason_text)
        :param bool stop_ioloop_on_close: Call ioloop.stop() if disconnected
        :param custom_ioloop: Override using the global IOLoop in Tornado
        :raises: RuntimeError

        """
        ioloop = custom_ioloop or GeventIOLoop()
        super(SelectConnection, self).__init__(
            parameters, on_open_callback, on_open_error_callback,
            on_close_callback, ioloop, stop_ioloop_on_close)

    def _adapter_connect(self):
        """Connect to the RabbitMQ broker, returning True on success, False
        on failure.

        :rtype: bool

        """
        error = super(SelectConnection, self)._adapter_connect()
        if not error:
            self.ioloop.add_handler(self.socket.fileno(), self._handle_events,
                                    self.event_state)
        return error

    def _adapter_disconnect(self):
        """Disconnect from the RabbitMQ broker"""
        if self.socket:
            self.ioloop.remove_handler(self.socket.fileno())
        super(SelectConnection, self)._adapter_disconnect()


class GeventSelectPoller(_PollerBase):
    """Default behavior is to use Select since it's the widest supported and has
    all of the methods we need for child classes as well. One should only need
    to override the update_handler and start methods for additional types.

    """
    # if the poller uses MS specify 1000
    POLL_TIMEOUT_MULT = 1

    def poll(self):
        """Wait for events of interest on registered file descriptors until an
        event of interest occurs or next timer deadline or _MAX_POLL_TIMEOUT,
        whichever is sooner, and dispatch the corresponding event handlers.

        """
        while True:
            try:
                if (self._fd_events[READ] or self._fd_events[WRITE] or
                        self._fd_events[ERROR]):
                    read, write, error = select.select(
                        self._fd_events[READ], self._fd_events[WRITE],
                        self._fd_events[ERROR], self._get_max_wait())
                else:
                    # NOTE When called without any FDs, select fails on
                    # Windows with error 10022, 'An invalid argument was
                    # supplied'.
                    time.sleep(self._get_max_wait())
                    read, write, error = [], [], []
                break
            except _SELECT_ERRORS as error:
                if _is_resumable(error):
                    continue
                else:
                    raise

        # Build an event bit mask for each fileno we've received an event for

        fd_event_map = collections.defaultdict(int)
        for fd_set, evt in zip((read, write, error), (READ, WRITE, ERROR)):
            for fileno in fd_set:
                fd_event_map[fileno] |= evt

        self._dispatch_fd_events(fd_event_map)

    def _init_poller(self):
        """Notify the implementation to allocate the poller resource"""
        # It's a no op in SelectPoller
        pass

    def _uninit_poller(self):
        """Notify the implementation to release the poller resource"""
        # It's a no op in SelectPoller
        pass

    def _register_fd(self, fileno, events):
        """The base class invokes this method to notify the implementation to
        register the file descriptor with the polling object. The request must
        be ignored if the poller is not activated.

        :param int fileno: The file descriptor
        :param int events: The event mask using READ, WRITE, ERROR
        """
        # It's a no op in SelectPoller
        pass

    def _modify_fd_events(self, fileno, events, events_to_clear, events_to_set):
        """The base class invoikes this method to notify the implementation to
        modify an already registered file descriptor. The request must be
        ignored if the poller is not activated.

        :param int fileno: The file descriptor
        :param int events: absolute events (READ, WRITE, ERROR)
        :param int events_to_clear: The events to clear (READ, WRITE, ERROR)
        :param int events_to_set: The events to set (READ, WRITE, ERROR)
        """
        # It's a no op in SelectPoller
        pass

    def _unregister_fd(self, fileno, events_to_clear):
        """The base class invokes this method to notify the implementation to
        unregister the file descriptor being tracked by the polling object. The
        request must be ignored if the poller is not activated.

        :param int fileno: The file descriptor
        :param int events_to_clear: The events to clear (READ, WRITE, ERROR)
        """
        # It's a no op in SelectPoller
        pass
