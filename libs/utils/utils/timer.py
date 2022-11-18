import time
from functools import wraps


class Timer(object):
    level = 0

    def __init__(self, txt):
        self._s_time = None
        self._txt = txt
        self._duration = 0

    def __enter__(self):
        Timer.level += 1
        self._duration = 0
        print('  '*(Timer.level-1) + 'start timing '+self._txt)
        self._s_time = time.time()

    def __exit__(self, *args, **kargs):
        self._duration = time.time() - self._s_time
        print(
            '  '*(Timer.level-1) +
            (self._txt + ": %f") % self._duration)
        Timer.level -= 1

    def __call__(self, f):
        @wraps(f)
        def fn(*args, **kargs):
            with self:
                return f(*args, **kargs)

        return fn


if __name__ == '__main__':
    with Timer('test') as t:
        a = [i for i in range(10000000)]
