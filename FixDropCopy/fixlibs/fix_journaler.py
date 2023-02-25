from six import iteritems
import logging
import pymssql
import pickle
import uuid
import json

import sqlalchemy as sa
from sqlalchemy import Table, MetaData
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.automap import automap_base
import pandas as pd

from fixengine.journaler import Journaler
from fixengine.connection import MessageDirection
from fixengine.session import FIXClientSession
from fixengine.error import DuplicateSeqNoError


def sqltype_convert(v, sql_type):
    if isinstance(v, list):
        v = json.dumps(v)
    if isinstance(sql_type, sa.sql.sqltypes.Numeric):
        try:
            return float(v)
        except Exception:
            return float('NaN')
    elif isinstance(sql_type, sa.sql.sqltypes.Integer):
        try:
            return int(v)
        except Exception:
            return None
    elif isinstance(sql_type, sa.sql.sqltypes.String):
        return v
    elif isinstance(sql_type, sa.sql.sqltypes.Unicode):
        return v
    elif isinstance(sql_type, sa.dialects.mssql.base.BIT) or \
         isinstance(sql_type, sa.sql.sqltypes.Boolean):
        try:
            return bool(v)
        except Exception as e:
            return None
    elif isinstance(sql_type, sa.sql.sqltypes.DateTime):
        try:
            return pd.to_datetime(v).tz_localize(
                'utc').tz_convert('US/Eastern').replace(tzinfo=None)
        except Exception as e:
            return None
    elif isinstance(sql_type, sa.sql.sqltypes.Date):
        try:
            return pd.to_datetime(v).date()
        except Exception:
            return None
    else:
        return v


class FIXJournalerClient(Journaler):
    def __init__(self, engine=None, logger=logging):
        # self.conn = engine_session.raw_connection()
        # self.engine_records = engine_records
        # self.cursor = self.conn.cursor()
        self.engine = engine
        self.logger = logger

        self.metadata = sa.MetaData(bind=self.engine)
        self.metadata.reflect(schema='fix')
        self.session_factory = scoped_session(sessionmaker(bind=self.engine))

        Base = automap_base(metadata=self.metadata)
        Base.prepare()

        for name, tbl in Base.classes.items():
            setattr(self, name, tbl)

    def sessions(self):
        try:
            s = self.session_factory()
            sessions = []
            for sessionInfo in s.query(self.session).all():
                session = FIXClientSession(
                    sessionInfo.sessionId,
                    sessionInfo.targetCompId, sessionInfo.senderCompId)
                session.sndSeqNum = sessionInfo.outboundSeqNo
                session.nextExpectedMsgSeqNum = sessionInfo.inboundSeqNo + 1
                sessions.append(session)
            return sessions
        except Exception as e:
            self.logger.exception(e)

    def createSession(self, targetCompId, senderCompId):
        try:
            s = self.session_factory()
            session = self.session()
            session.targetCompId = targetCompId
            session.senderCompId = senderCompId
            s.add(session)
            s.commit()
            sessionId = session.sessionId
            return FIXClientSession(sessionId, targetCompId, senderCompId)
        except pymssql.IntegrityError as e:
            self.logger.exception(e)
            s.rollback()
            raise RuntimeError(
                "Session already exists for TargetCompId: %s SenderCompId: %s"
                % (targetCompId, senderCompId))

    def persistMsg(self, msg, session, direction):
        msgStr = pickle.dumps(msg)
        seqNo = msg["34"]
        try:
            s = self.session_factory()
            sessionDb = s.query(self.session).filter(
                (self.session.sessionId == session.key)).first()
            message = self.message()
            message.seqNo = seqNo
            message.session = session.key
            message.direction = direction.value
            if direction == MessageDirection.OUTBOUND:
                sessionDb.outboundSeqNo = seqNo
            elif direction == MessageDirection.INBOUND:
                sessionDb.inboundSeqNo = seqNo
            message.msg = msgStr
            message.msg_decoded = str(msg)
            s.add(message)
            s.commit()
        except pymssql.IntegrityError as e:
            self.logger.exception(e)
            s.rollback()
            raise DuplicateSeqNoError("%s is a duplicate" % (seqNo, ))

    def backMsg(self, msg, session, direction):
        msgStr = pickle.dumps(msg)
        seqNo = msg["34"]
        try:
            s = self.session_factory()
            message = self.message_backup()
            message.seqNo = seqNo
            message.session = session.key
            message.direction = direction.value
            message.msg = msgStr
            message.msg_decoded = str(msg)
            s.add(message)
            s.commit()
        except pymssql.IntegrityError as e:
            self.logger.exception(e)
            s.rollback()
            raise DuplicateSeqNoError("%s is a duplicate" % (seqNo, ))

    def recoverMsgs(self, session, direction, startSeqNo, endSeqNo):
        s = self.session_factory()
        messages = s.query(self.message).filter(
            (self.message.session == session.key) &
            (self.message.direction == direction.value) &
            (self.message.seqNo >= startSeqNo) &
            (self.message.seqNo <= endSeqNo)).all()

        msgs = []
        for msg in messages:
            msgs.append(pickle.loads(msg.msg))
        return msgs

    def getAllMsgs(self, sessions=[], direction=None):
        sql = "SELECT seqNo, msg, direction, session FROM fix.message"
        clauses = []
        args = []
        if sessions is not None and len(sessions) != 0:
            clauses.append(
                "session in (" + ','.join(['%s']*len(sessions)) + ")")
            args.extend(sessions)
        if direction is not None:
            clauses.append("direction = ?")
            args.append(direction.value)

        if clauses:
            sql = sql + " WHERE " + " AND ".join(clauses)

        sql = sql + " ORDER BY rowid"

        self.cursor.execute(sql, tuple(args))
        msgs = []
        for msg in self.cursor:
            msgs.append((msg[0], pickle.loads(msg[1]), msg[2], msg[3]))

        return msgs

    def rollOverSession(self, targetCompId, senderCompId):
        try:
            s = self.session_factory()
            session_old = s.query(self.session).filter(
                (self.session.senderCompId == senderCompId) &
                (self.session.targetCompId == targetCompId)).first()
            session_old.senderCompId = senderCompId + \
                '_old' + str(session_old.sessionId)

            session_new = self.session()
            session_new.targetCompId = targetCompId
            session_new.senderCompId = senderCompId

            s.commit()
        except Exception as err:
            self.logger.exception(err)
            s.rollback()
            raise(err)

    def invalidateSession(self, targetCompId, senderCompId):
        try:
            s = self.session_factory()
            session_old = s.query(self.session).filter(
                (self.session.senderCompId == senderCompId) &
                (self.session.targetCompId == targetCompId)).first()
            session_old.senderCompId = senderCompId + \
                '_old' + str(session_old.sessionId)
            s.commit()
        except Exception as err:
            self.logger.exception(err)
            s.rollback()
            raise(err)

    def getClOrdID(self, session, targetCompId, senderCompId):
        return uuid.uuid4().hex

    def getTxn(self, targetCompId, senderCompId, execID):
        s = self.session_factory()
        return self.__getTxn(
            targetCompId, senderCompId, execID, s)

    def __getTxn(self, session_id, targetCompId, senderCompId, execID, s):
        tbl = self.tbl_fix_execution_report
        return s.query(tbl).filter(
            (tbl.Session == session_id) &
            (tbl.TargetCompID == targetCompId) &
            (tbl.SenderCompID == senderCompId) &
            (tbl.ExecID == execID)).order_by(
                tbl.index.desc()).first()

    def handleCancelTxn(self, session, targetCompId, senderCompId, txn):
        s = self.session_factory()
        try:
            txn = self.__getTxn(
                session.key, targetCompId,
                senderCompId, txn['ExecRefID'], s)
            txn.isvalid = False
            s.commit()
            return txn
        except Exception as e:
            self.logger.exception(e)
            s.rollback()
            raise(e)

    def handleTxn(self, session, targetCompId, senderCompId, txn):
        s = self.session_factory()
        try:
            for party in txn.get('NoPartyIDs', []):
                if party['PartyRole'] == '1':
                    txn['ExecBrokerID'] = party['PartyID']
                    txn['ExecBrokerIDSource'] = party['PartyIDSource']
                elif party['PartyRole'] == '11':
                    txn['TraderID'] = party['PartyID']
                    txn['TraderIDSource'] = party['PartyIDSource']

            rc = self.tbl_fix_execution_report()
            setattr(rc, 'Session', session.key)
            for k, v in iteritems(txn):
                if hasattr(rc, k):
                    v = sqltype_convert(
                        v,
                        getattr(self.tbl_fix_execution_report, k).type)
                    setattr(rc, k, v)

            s.add(rc)
            s.commit()
            return txn
        except Exception as e:
            self.logger.exception(e)
            s.rollback()
            raise(e)

    def handleNewOrd(self, session, targetCompId, senderCompId, ord):
        self.handleTxn(session, targetCompId, senderCompId, ord)

    def handleCancelOrd(self, session, targetCompId, senderCompId, ord):
        self.handleTxn(session, targetCompId, senderCompId, ord)

    def handleCancelOrdReject(self, session, targetCompId, senderCompId, ord):
        pass

    def handleReplaceOrd(self, session, targetCompId, senderCompId, ord):
        self.handleTxn(session, targetCompId, senderCompId, ord)

    def handleCorrectTxn(self, session, targetCompId, senderCompId, txn):
        try:
            self.handleCancelTxn(session, targetCompId, senderCompId, txn)
            self.handleTxn(session, targetCompId, senderCompId, txn)
        except Exception as e:
            self.logger.exception(e)
            raise(e)

    def handleOrderReject(self, session, targetCompId, senderCompId, ord):
        self.handleTxn(session, targetCompId, senderCompId, ord)

    def handleIOI(self, session, targetCompId, senderCompId, ioi):
        s = self.session_factory()
        try:
            rc = self.tbl_fix_ioi_report()
            setattr(rc, 'Session', session.key)
            for k, v in iteritems(ioi):
                if hasattr(rc, k):
                    v = sqltype_convert(
                        v,
                        getattr(self.tbl_fix_ioi_report, k).type)
                    setattr(rc, k, v)

            s.add(rc)
            s.commit()
            return ioi
        except Exception as e:
            self.logger.exception(e)
            s.rollback()
            raise(e)

    def newOrderOutbound(self, session, targetCompId, senderCompId, ord):
        s = self.session_factory()
        try:
            rc = self.tbl_fix_execution_report()
            setattr(rc, 'Session', session.key)
            for k, v in iteritems(ord):
                if hasattr(rc, k):
                    v = sqltype_convert(
                        v,
                        getattr(self.tbl_fix_execution_report, k).type)
                    setattr(rc, k, v)

            s.add(rc)
            s.commit()
            return ord
        except Exception as e:
            self.logger.exception(e)
            s.rollback()
            raise(e)

    def orderReplaceOutbound(self, session, targetCompId, senderCompId, ord):
        self.newOrderOutbound(session, targetCompId, senderCompId, ord)

    def newOrderListOutbound(self, session, targetCompId, senderCompId, orders):
        for ord in orders.pop('NoOrders', []):
            ord.update(orders)
            self.newOrderOutbound(session, targetCompId, senderCompId, ord)


if __name__ == '__main__':
    from sqlutil.engines import engine
    import wfifix.FIX44 as protocol
    import pandas as pd
    from datetime import datetime
    import numpy as np
    from collections import OrderedDict
    session = FIXClientSession(6, 'BLPDROP', 'WESTFIELDDRP')
    journaler = WFIJournalerClient(engine)

    # msg = journaler.recoverMsgs(
    #     session, MessageDirection.INBOUND, 1594, 1594)
    # txn = journaler.cancelTxn(
    #     "WESTFIXDEMO", "TRADEWEB", "J430TWDXTR00227P2B1")
