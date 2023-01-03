import pandas as pd


def fn_cde(x: int):
    return x * 2


def abc(x: int):
    if x == 1:
        b = fn_cde(x)
    else:
        b = fn_cde(2 * x)

    return b


class ABC:
    a: int
    b: str

    def __init__(self):
        self.a = 1
        self.b = 2
