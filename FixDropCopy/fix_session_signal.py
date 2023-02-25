import json
from datetime import datetime
import logging
from mqrpc2.mqclient import MQClient, MQClientEngine
from wfifix.client_control import FixClientControl


def send_orders_tw(msq, list_id, orders, users):
    try:
        for ord in orders:
            ord['symbol'] = '[N/A]'

        order_info = {
            'ListID': list_id,
            'Emails': users,
            'Orders': orders
        }
        msq.call('/send_order', json.dumps(order_info))

    except Exception as e:
        raise(e)


def main1():
    # with MQClient(virtual_host='/fix_uat') as mq:
    #     msg = mq.call('/shut_down')

    list_id = datetime.now().strftime(
        "Test_%Y%m%d_%H:%M:%S")

    orders = [
        {'sid': 'US27890GAB68', 'qty': 1000000, 'id_source': 4},
        # {'sid': 'US428040CT42', 'qty': 123000, 'id_source': 4},
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

    # aa = sched_rollover_session_tw(logging)
    with FixClientControl(
            queue='trade_web_uat', virtual_host='/fix_uat') as ctrl:
        aa = ctrl.send_watch_list(list_id, orders, users)
        aa = ctrl.send_orders(list_id, orders, users)
        ctrl.rollover_session()

    # with MQClient(queue='trade_web_uat_rfq', virtual_host='/fix_uat') as client:
    #     dd = client.call('/shut_down')


def fn(client):
    dd = client.call_without_response('/test')


def fn2():
    with MQClient(queue='fix_msg_handle_queue', virtual_host='/fix_uat') as client:
        client.call_without_response('/test')

def fn3(client):
    with client:
        client.call_without_response('/test')


def main():
    # main()
    import threading
    from utils.timer import Timer
    import time
    ts = []
    with MQClient(queue='fix_msg_handle_queue', virtual_host='/fix_uat') as client:
        with Timer('test speed'):
            for i in range(100):
                # time.sleep(30)
                dd = client.call('/test')
                print(dd)


def main1():
    import threading
    from utils.timer import Timer
    ts = []
    with Timer('tt'):
        for i in range(100):
            t = threading.Thread(target=fn2)
            ts.append(t)
            t.start()

        for t in ts:
            t.join()
    print('finished')


def main3():
    import threading
    from utils.timer import Timer
    import time
    ts = []
    with Timer('tt'):
        with MQClient(queue='fix_msg_handle_queue', virtual_host='/fix_uat') as client:
            for i in range(100):
                t = threading.Thread(target=fn, args=(client,))
                ts.append(t)
                t.start()
            for t in ts:
                t.join()
    print('finished')


def main4():
    import threading
    from utils.timer import Timer
    import time
    ts = []
    client = MQClient(queue='fix_msg_handle_queue', virtual_host='/fix_uat')
    with Timer('tt'):
        for i in range(2):
            t = threading.Thread(target=fn3, args=(client,))
            ts.append(t)
            t.start()
        for t in ts:
            t.join()
    print('finished')


def fn4(mqengine):
    with mqengine.connect() as client:
        dd = client.call_without_response('/test')


def main5():
    import threading
    from utils.timer import Timer
    import time
    ts = []
    mqengine = MQClientEngine(
        queue='fix_msg_handle_queue', virtual_host='/fix_uat')
    with Timer('tt'):
        for i in range(10):
            t = threading.Thread(target=fn4, args=(mqengine,))
            ts.append(t)
            t.start()
        for t in ts:
            t.join()
    print('finished')


if __name__ == '__main__':
    main5()
