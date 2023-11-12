###############################################################################
# Copyright (C) 2018, 2019, 2020 Dominic O'Kane
###############################################################################

# TODO
import time
import numpy as np

import sys
sys.path.append("..")

from financepy.products.bonds.bond_convertible import BondConvertible
from financepy.products.bonds.bond_convertible_pde import value_pde
from financepy.utils.date import Date
from financepy.utils.frequency import FrequencyTypes
from financepy.utils.day_count import DayCountTypes
from financepy.market.curves.discount_curve_flat import DiscountCurveFlat

maturity_date = Date(15, 7, 2025)
coupon = 0.0575

freq_type = FrequencyTypes.SEMI_ANNUAL
# freq_type = FrequencyTypes.CONTINUOUS
start_convert_date = Date(31, 12, 2003)
conversion_ratio = 38.4615  # adjust for face

call_dates = [
    Date(20, 3, 2007),
    Date(15, 3, 2012),
    Date(15, 3, 2017)
]
call_price = 11000000 * 1e40
call_prices = np.array([call_price, call_price, call_price])
call_dates = [Date(20, 3, 2004),]
call_prices = [call_price]

put_dates = [
    Date(20, 3, 2007),
    Date(15, 3, 2012),
    Date(15, 3, 2017)
]
putPrice = 0
put_prices = np.array([putPrice, putPrice, putPrice])
put_dates = [Date(20, 3, 2004),]
put_prices = [putPrice]

accrualBasis = DayCountTypes.ACT_365F

bond = BondConvertible(maturity_date,
                       coupon,
                       freq_type,
                       start_convert_date,
                       conversion_ratio,
                       call_dates,
                       call_prices,
                       put_dates,
                       put_prices,
                       accrualBasis)

settlement_date = Date(31, 12, 2003)
stock_price = 28.5
stock_volatility = 0.970
dividend_dates = [Date(20, 3, 2007),
                  Date(15, 3, 2008),
                  Date(15, 3, 2009),
                  Date(15, 3, 2010),
                  Date(15, 3, 2011),
                  Date(15, 3, 2012),
                  Date(15, 3, 2013),
                  Date(15, 3, 2014),
                  Date(15, 3, 2015),
                  Date(15, 3, 2016),
                  Date(15, 3, 2017),
                  Date(15, 3, 2018),
                  Date(15, 3, 2019),
                  Date(15, 3, 2020),
                  Date(15, 3, 2021),
                  Date(15, 3, 2022)]

rate = 0.04
# rate = 0
discount_curve = DiscountCurveFlat(settlement_date,
                                   rate,
                                   FrequencyTypes.CONTINUOUS)
credit_spread = 0.02
# credit_spread = 0.0
recovery_rate = 0.40
# recovery_rate = 0.0


def test_convertible_pde():
    dividend_yields = np.ones(len(dividend_dates)) * 0.03

    num_steps_per_year = 5
    tic = time.perf_counter()

    res = value_pde(
        bond,
        settlement_date,
        stock_price,
        stock_volatility,
        dividend_dates,
        dividend_yields,
        discount_curve,
        credit_spread,
        recovery_rate,
        num_samples=20000)

    i = len(res['stock_price']) // 2

    cbprice = res['conv_price'][0][i]
    bond_price = res['straight_bond'][0][i]
    dxl = res['stock_price'][i+1]-res['stock_price'][i]
    dxu = res['stock_price'][i]-res['stock_price'][i-1]
    su = res['conv_price'][0][i+1]
    sl = res['conv_price'][0][i-1]
    s = cbprice

    gamma = (2/dxl * sl + 2/dxu * su - (2/dxl + 2/dxu)*s) / (dxl + dxu)
    delta = (su - sl) / (dxu+dxl)
    print({
        'cbprice': cbprice,
        'bond': bond_price,
        'delta': delta,
        'deltaUp': (su-s) / dxu,
        'deltaDn': (s-sl) / dxl,
        'gamma': gamma,
        'time_elapse': time.perf_counter()-tic
    })

    tic = time.perf_counter()
    num_steps_per_year = 500

    res_bm = bond.value(settlement_date,
                     stock_price,
                     stock_volatility,
                     dividend_dates,
                     dividend_yields,
                     discount_curve,
                     credit_spread,
                     recovery_rate,
                     num_steps_per_year)
    print('res_bm', res_bm, 'time_elapse', time.perf_counter()-tic)
    # assert round(res['cbprice'], 4) == 1096.1528
    # assert round(res['bond'], 4) == 1235.3434
    # assert res['delta'] == 0.0
    # assert round(res['gamma'], 4) == 0.1874
    # assert round(res['theta'], 4) == 0.4752


if __name__ == "__main__":
    test_convertible_pde()
