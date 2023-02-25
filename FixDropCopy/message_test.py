from datetime import datetime
import datetime as dt
import simplejson as json

import numpy as np
import pandas as pd
from pandas.tseries.offsets import BDay

import wfifix.FIX42 as protocol
from wfifix.connection import MessageDirection
from wfifix.session import FIXSession
from sqlutil.engines import engine
from mqrpc3.mqclient import MQClient, MQClientEngine


def json_default(o):
    if isinstance(o, (dt.date, dt.datetime, pd.Timestamp)):
        try:
            return o.strftime('%Y-%m-%dT%H:%M:%S')
        except:
            # return o.isoformat()
            return 'NaT'
    if isinstance(o, np.int64):
        return int(o)


class JSON:
    @staticmethod
    def dumps(x):

        return json.dumps(x, default=json_default, ignore_nan=True)

    @staticmethod
    def loads(x):
        return json.loads(x)


def get_msg(session, msg):
    res = {}
    res['Session'] = session
    res['SenderCompID'] = msg.get(protocol.fixtags.SenderCompID)
    res['TargetCompID'] = msg.get(protocol.fixtags.TargetCompID)
    res['MsgSeqNum'] = msg.get(protocol.fixtags.MsgSeqNum)
    res['ExecType'] = msg.get(protocol.fixtags.ExecType)
    res['OrderID'] = msg.get(protocol.fixtags.OrderID)
    res['ExecID'] = msg.get(protocol.fixtags.ExecID)

    tt = pd.to_datetime(
        msg.get(protocol.fixtags.TransactTime, np.nan))
    st = pd.to_datetime(
        msg.get(protocol.fixtags.SendingTime, np.nan))

    res['TransactTime'] = tt if pd.isnull(tt) else \
        tt.tz_localize('utc').tz_convert('US/Eastern').replace(tzinfo=None)

    res['SendingTime'] = st if pd.isnull(st) else \
        st.tz_localize('utc').tz_convert('US/Eastern').replace(tzinfo=None)

    res['SettlDate'] = tt if pd.isnull(tt) else \
        tt.normalize() + BDay(2)

    res['Symbol'] = msg.get(protocol.fixtags.Symbol)
    res['SecurityID'] = msg.get(protocol.fixtags.SecurityID)
    res['SecurityIDSource'] = msg.get(
        protocol.fixtags.SecurityIDSource, np.nan)

    res['SecurityExchange'] = msg.get(protocol.fixtags.SecurityExchange)
    res['LastMkt'] = msg.get(protocol.fixtags.LastMkt)

    res['OrdType'] = msg.get(protocol.fixtags.OrdType)
    res['OrdStatus'] = msg.get(protocol.fixtags.OrdStatus)

    res['Side'] = msg.get(protocol.fixtags.Side)
    res['OrderQty'] = float(msg.get(protocol.fixtags.OrderQty, np.nan))
    res['LeavesQty'] = float(msg.get(protocol.fixtags.LeavesQty, np.nan))
    res['LastQty'] = float(msg.get(protocol.fixtags.LastQty, np.nan))
    res['CumQty'] = float(msg.get(protocol.fixtags.CumQty, np.nan))

    res['LastPx'] = float(msg.get(protocol.fixtags.LastPx, np.nan))
    res['AvgPx'] = float(msg.get(protocol.fixtags.AvgPx, np.nan))
    res['Price'] = float(msg.get(protocol.fixtags.Price, np.nan))
    res['Currency'] = msg.get(protocol.fixtags.Currency)

    res['ClOrdID'] = msg.get(protocol.fixtags.ClOrdID)

    res['Commission'] = float(msg.get(protocol.fixtags.Commission, np.nan))
    res['CommType'] = msg.get(protocol.fixtags.CommType)

    res['ExecBroker'] = msg.get(protocol.fixtags.ExecBroker)
    res['Rule80A'] = msg.get(protocol.fixtags.Rule80A)
    res['ExecInst'] = msg.get(protocol.fixtags.ExecInst)

    res['ExecTransType'] = msg.get(protocol.fixtags.ExecTransType)
    res['HandlInst'] = msg.get(protocol.fixtags.HandlInst)

    res['TimeInForce'] = msg.get(protocol.fixtags.TimeInForce)
    res['LastCapacity'] = msg.get(protocol.fixtags.LastCapacity)
    res['Text'] = msg.get(protocol.fixtags.Text)

    try:
        df = pd.DataFrame(res, index=[0])
        with engine.connect() as conn:
            df.to_sql(
                'tbl_fix_execution_report', conn,
                schema='fix', if_exists='append', index=False)
    except Exception as e:
        print("update failed "+repr(e))
    return res


def test_message(session):
    from wfifix.codec import Codec
    import wfifix.FIX44 as protocol

    codec = Codec(protocol)
    msg = codec.protocol.messages.Messages.heartbeat()
    msg = codec.protocol.messages.Messages.resend_request(
        10, 0)
    text = codec.encode(msg, session)
    return text.replace('\x01', '|')


def test_mktdata():
    mq_queue = 'fix_msg_handle_queue'
    virtual_host = '/fix_uat'

    with MQClient(
            queue=mq_queue, durable=True, json=JSON,
            virtual_host=virtual_host) as con:
        con.call(
            '/mktdata_update',
            {
                19426: {
                    'mkt_px':{
                        '4': {
                            'price': '{:0.2f}'.format(np.random.random() * 100),
                            # 'price': '114.875',
                            't_date': dt.datetime.now(),
                        }
                    }
                },
                1670: {
                    'mkt_px':{
                        '4': {
                            'price': '{:0.2f}'.format(np.random.random() * 100),
                            # 'price': '114.875',
                            't_date': dt.datetime.now(),
                        }
                    }
                }
            })
        con.logger.info('done')
    print('don')


def test():
    mq_queue = 'fix_msg_handle_queue'
    virtual_host = '/fix_uat'

    with MQClient(
            queue=mq_queue, durable=True, json=JSON,
            host='wfiubuntu01.wfi.local',
            virtual_host=virtual_host) as con:
        con.call(
            '/test')
        con.logger.info('done')
    print('don')



if __name__ == '__main__':
    test()
    # test_mktdata()
    # from sqlutil.engines import engine_fix

    # session = FIXSession(127, 'TRADEWEB', 'WESTFIXDEMO')
    # import pdb; pdb.set_trace()
    # text = test_message(session)

    # journaler = WFIJournaler(engine_fix)

    # msg = journaler.recoverMsgs(
    #     session, MessageDirection.INBOUND, 44, 44)[0]

    # aa = get_msg(session.key, msg)
