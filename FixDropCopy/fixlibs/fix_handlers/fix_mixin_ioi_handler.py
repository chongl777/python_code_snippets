import logging

from six import iteritems, itervalues
from collections import OrderedDict
import datetime as dt
from abc import ABC, abstractmethod

from . import update_attr, strftime, to_datetime, to_date, route, broadcast


def ioi_date_convert(ioi):
    ioi['ValidUntilTime'] = to_datetime(ioi.get('ValidUntilTime'))
    ioi['SendingTime'] = to_datetime(ioi.get('SendingTime'))
    ioi['TransactTime'] = to_datetime(ioi.get('TransactTime'))

    ioi['SettlDate'] = to_date(ioi.get('SettlDate'))
    ioi['IOIResponseTime'] = to_datetime(ioi.get('IOIResponseTime'))

    return ioi


class FIXIOIHandlerMixIn(ABC):
    def __init__(self):
        self._iois = OrderedDict()
        self._matched_iois = OrderedDict()

    @broadcast(route='broadcast_ioi', exchange='trading_signal_exchange')
    def broadcast_ioi(self, ioi):
        return ioi

    @route('/handle_ioi')
    def handle_ioi(self, ioi):
        ioi = ioi_date_convert(ioi)
        try:
            self.logger.debug(str(ioi))
            # self.response_ioi_order(ioi)
            ioi = self.process_ioi(ioi, self._iois)
            res = self.match_watchlist(ioi, True)

            if res:
                self.process_ioi(res, self._matched_iois)
                self.broadcast_ioi(res)

            return 'done!'
        except Exception as e:
            self.logger.exception(e)
            raise(e)

    @route('/matched_iois')
    def matched_iois(self):
        for ioi in list(self._matched_iois.values()):
            yield ioi
        return

    def change_ioi_status(self, ioi_id, loading, broadcast=False):
        ioi = self._iois.get(ioi_id)
        if ioi:
            ioi['loading'] = loading

        if broadcast:
            self.broadcast_ioi_status(ioi_id, loading)

    @broadcast(route='broadcast_ioi_status', exchange='trading_signal_exchange')
    def broadcast_ioi_status(self, ioi_id, loading):
        self.logger.info(str(ioi_id) + " " + str(loading))
        return ioi_id, loading

    @abstractmethod
    def match_watchlist(self, ioi, send_email):
        pass

    def process_ioi(self, ioi, ioi_list):
        if ioi['IOITransType'] == 'N':
            ioi_ref = ioi_list.setdefault(ioi['IOIID'], ioi)
            ioi_ref.update(ioi)
        elif ioi['IOITransType'] == 'C':
            ioi_ref = ioi_list.setdefault(ioi['IOIRefID'], ioi)
            ioi_ref.update(ioi)
        elif ioi['IOITransType'] == 'R':
            ioi_ref = ioi_list.pop(ioi['IOIRefID'], ioi)
            ioi_ref = ioi_list.setdefault(ioi['IOIID'], ioi_ref)
            ioi_ref.update(ioi)

        return ioi

    def process_iois(self, iois):
        self._iois = OrderedDict()
        self._matched_iois = OrderedDict()

        for ioi in iois:
            ioi = {k: v for k, v in ioi.items() if v is not None}
            self.process_ioi(ioi, self._iois)
            res = self.match_watchlist(ioi, False)
            if res:
                self.process_ioi(res, self._matched_iois)
