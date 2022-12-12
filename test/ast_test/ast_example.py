import pandas as pd


def fn_cde(x):
    return x * 2


def abc(x):
    if x == 1:
        b = fn_cde(x)
    else:
        b = fn_cde(2 * x)

    return b
