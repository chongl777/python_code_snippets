import json
from datetime import datetime
import logging
from mqrpc.mqclient import MQClient
from wfifix.client_control import FixClientControl


def sched_rollover_session_bbg(logger, config={}):
    logger.info("roll over bbg fix copy session...")
    try:
        with MQClient(virtual_host='/fix_uat') as mq:
            msg = mq.call('/roll_over_session_bbg')
        logger.info(msg)
    except Exception:
        logger.info("message failed...")


def sched_rollover_session_tw(logger, config={}):
    logger.info("roll over trade web fix copy session...")
    try:
        with MQClient(virtual_host='/fix_uat') as mq:
            msg = mq.call('/roll_over_session_tw')
        logger.info(msg)
        return msg
    except Exception:
        logger.info("message failed...")


def sched_rollover_session_tw_r(logger, config={}):
    logger.info("roll over trade web fix copy session...")
    try:
        with MQClient(virtual_host='/fix_uat') as mq:
            msg = mq.call('/roll_over_session_tw_r')
        logger.info(msg)
        return msg
    except Exception:
        logger.info("message failed...")


def send_orders_tw(msq, list_id, orders, users):
    try:
        for ord in orders:
            ord['symbol'] = '[N/A]'

        order_info = {
            'ListID': list_id,
            'Emails': users,
            'Orders': orders
        }
        msq.call('/send_order_to_tw', json.dumps(order_info))

    except Exception as e:
        raise(e)


if __name__ == '__main__':
    with MQClient(virtual_host='/fix_uat') as mq:
        msg = mq.call('/shut_down')

    list_id = datetime.now().strftime(
        "Test_%Y%m%d_%H:%M:%S")

    orders = [
        {'sid': 'US27890GAB68', 'qty': 1000000, 'id_source': 4},
        {'sid': 'US428040CT42', 'qty': 123000, 'id_source': 4},
        {'sid': 'US35905AAA79', 'qty': 10000, 'id_source': 4},
        # {'sid': 'US82671AAA16', 'qty': 30000, 'id_source': 4},
        # {'sid': '458204AQ7', 'qty': -123000, 'id_source': 1},
        # {'sid': '268787AJ7', 'qty': 30000, 'id_source': 1},
    ]

    orders = [
        {'sid': 'US27890GAB68', 'qty': 1000000, 'id_source': 4,
         'tgt_px': 100, 'notes': 'test', 'dir': 'B/S'},
        {'sid': 'US35905AAA79', 'qty': 10000, 'id_source': 4,
         'tgt_px': 100, 'notes': 'test', 'dir': 'B'},
    ]

    users = [
        'chong.liu@westfieldinvestment.com',
        # 'ren.gao@westfieldinvestment.com'
        # 'derek.song@westfieldinvestment.com'
    ]

    with MQClient(virtual_host='/fix_uat') as mq:
        msg = mq.call('/test2')

    # aa = sched_rollover_session_tw(logging)
    with FixClientControl(virtual_host='/fix_uat') as ctrl:
        # aa = ctrl.send_watch_list(list_id, orders, users)
        # aa = ctrl.send_orders_tw(list_id, orders, users)
        ctrl.rollover_session_tw_r()
