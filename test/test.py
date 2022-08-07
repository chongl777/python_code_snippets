from utils.timer import Timer

import pandas as pd
import numpy as np

df = pd.Series([1, 2, None, 1, 5, 6, None, None, 13, 45, None, None, None] * 100000)


def plan1(v):
    n = len(v)
    df_idx = np.arange(n)
    df_origin = df_idx.copy()
    df_idx[np.isnan(v)] = 0

    df_ffill_days = df_origin - np.maximum.accumulate(df_idx)
    return df_ffill_days


def plan2(df):
    res = np.zeros(len(df))
    ref_max = -1
    for i, x in enumerate(np.isnan(df)):
        if x:
            res[i] = i - ref_max
        else:
            ref_max = i
    return res


if __name__ == '__main__':
    with Timer('plan1'):
        rtn1 = plan1(df.values)
    with Timer('plan2'):
        rtn2 = plan2(df.values)
    print(np.sum(np.abs(rtn2 - rtn1)))
