import argparse
import json
from datetime import datetime
import logging
from wfifix.client_control import FixClientControl


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--queue', '-queue', default='/trade_web_uat_rfq')
    parser.add_argument('--connection_name', '-con', default=None)
    args_parsed = parser.parse_args()
    # import pdb;pdb.set_trace()
    # aa = sched_rollover_session_tw(logging)
    with FixClientControl(
            queue=args_parsed.queue, virtual_host='/fix_uat') as ctrl:
        try:
            print('rolling over queue', args_parsed.queue)
            msg = ctrl.rollover_session(args_parsed.connection_name)
            print(msg)
        except Exception as e:
            print(e)
