from math import exp, sqrt
from numba import njit
import numpy as np
from typing import List
from copy import deepcopy
from financepy.models import finite_difference as fd

from ...utils.date import Date
from ...utils.error import FinError
from ...utils.frequency import annual_frequency, FrequencyTypes
from ...utils.math import test_monotonicity
from ...utils.global_vars import gDaysInYear
from ...utils.day_count import DayCount, DayCountTypes
from ...utils.helpers import label_to_string, check_argument_types

from ...utils.schedule import Schedule
from ...utils.calendar import CalendarTypes
from ...utils.calendar import BusDayAdjustTypes
from ...utils.calendar import DateGenRuleTypes

from ...market.curves.discount_curve import DiscountCurve
from ...market.curves.interpolator import InterpTypes, _uinterpolate


def value_pde(
        bond,
        settlement_date: Date,
        stock_price: float,
        stock_volatility: float,
        dividend_dates: List[Date],
        dividend_yields: List[float],
        discount_curve: DiscountCurve,
        credit_spread: float,
        recovery_rate: float = 0.40,
        num_samples: int = 4000):

    if stock_price <= 0.0:
        stock_price = 1e-10  # Avoid overflows in delta calc

    if stock_volatility <= 0.0:
        stock_volatility = 1e-10  # Avoid overflows in delta calc

    bond._calculate_coupon_dates(settlement_date)
    tmat = (bond._maturity_date - settlement_date) / gDaysInYear
    if tmat <= 0.0:
        raise FinError("Maturity must not be on or before the value date.")

    dividend_times = []
    for dt in dividend_dates:
        dividend_time = (dt - settlement_date) / gDaysInYear
        dividend_times.append(dividend_time)

    dividend_times = np.array(dividend_times)
    dividend_yields = np.array(dividend_yields)

    # We include time zero in the coupon times and flows
    coupon_times = [0.0]
    coupon_flows = [0.0]
    cpn = bond._coupon / bond._frequency
    for dt in bond._coupon_dates[1:]:
        flow_time = (dt - settlement_date) / gDaysInYear
        coupon_times.append(flow_time)
        coupon_flows.append(cpn)

    coupon_times = np.array(coupon_times)
    coupon_flows = np.array(coupon_flows)

    call_times = []
    for dt in bond._call_dates:
        call_time = (dt - settlement_date) / gDaysInYear
        call_times.append(call_time)
    call_times = np.array(call_times)
    call_prices = np.array(bond._call_prices)

    put_times = []
    for dt in bond._put_dates:
        put_time = (dt - settlement_date) / gDaysInYear
        put_times.append(put_time)
    put_times = np.array(put_times)
    put_prices = np.array(bond._put_prices)

    # If it's before today it starts today
    tconv = (bond._start_convert_date - settlement_date) / gDaysInYear
    tconv = max(tconv, 0.0)

    res = convert_finite_difference(
        stock_price, stock_volatility, tmat,
        coupon_times, coupon_flows,
        dividend_times, dividend_yields,
        call_times, call_prices,
        put_times, put_prices,
        tconv, bond._conversion_ratio, bond._par,
        credit_spread / (1.0 - recovery_rate),
        recovery_rate,
        discount_curve,
        num_samples=num_samples
    )
    return res


def convert_finite_difference(
        spot_price, volatility, tmat,
        coupon_times, coupon_flows,
        dividend_times, dividend_yields,
        call_times, call_prices,
        put_times, put_prices,
        tconv, conv_ratio, face_amount, hazard_rate, recovery_rate,
        discount_curve, num_time_steps=None, num_samples=4000,
        num_std=5, theta=0.5,
):
    h_ = hazard_rate
    std = volatility * (tmat ** 0.5)
    xu = num_std * std
    xl = -xu
    d_x = (xu - xl) / max(1, num_samples)
    num_samples = 1 if num_samples <= 0 or xl == xu else num_samples + 1

    # define grid
    s = spot_price * np.exp(xl + d_x * np.arange(0, num_samples))
    num_steps = num_time_steps or num_samples // 2
    t_vec = np.unique(
        list(np.linspace(0.0, tmat, num_steps)) +
        list(coupon_times) + list(dividend_times),
    )

    # coupon flow
    flow_vec = np.zeros(len(t_vec))
    flow_idx = np.searchsorted(t_vec, coupon_times)
    flow_vec[flow_idx] = coupon_flows

    # dividend flow
    dvd_yield_vec = np.zeros(len(t_vec))
    dvd_idx = np.searchsorted(t_vec, dividend_times)
    dvd_yield_vec[dvd_idx] = dividend_yields

    convValue = s * conv_ratio
    var = (s ** 2) * (volatility ** 2 - h_)

    # interest rate
    r_vec = np.zeros(len(t_vec))
    r_vec[1:] = (-np.diff(np.log(discount_curve._df(t_vec)))) / np.diff(t_vec)

    # Initialise implicit and explicit matricies
    rtn = solve_pde(
        s, t_vec, convValue, flow_vec, dvd_yield_vec,
        h_, recovery_rate, face_amount, var,
        theta=theta, rate=r_vec)

    return {
        'stock_price': s,
        'conv_price': rtn['conv_price'],
        'straight_bond': rtn['sb_price']
    }


# @njit(fastmath=True, cache=True)
def solve_pde(s, t_vec, convValue, flow_vec, dvd_yield_vec, h_, rr_, face_amount, var,
              theta, rate):
    flow_last = flow_vec[-1]
    bulletPV = (1.0 + flow_last) * face_amount
    # payoff = np.atleast_2d(np.max(
    #     [bulletPV*np.ones(len(convValue)), convValue], 0
    # ))
    res = np.atleast_2d(np.max(
        [bulletPV*np.ones(len(convValue)), convValue], 0
    ))
    bulletPV_vec = np.atleast_2d(np.ones(len(s)) * bulletPV)

    Ai = np.array([])
    Ae = np.array([])

    const = h_ * rr_ * face_amount
    zeros = np.zeros(len(res))

    for i in range(len(t_vec)-1, 1, -1):
        dt = t_vec[i] - t_vec[i-1]
        r_ = rate[i]
        mu =  (r_ + h_) * s
        r_vec = zeros + r_

        # theta scheme
        # V(t+dt) - V(t) + (1-theta)*dt*A*V(t+dt) + theta*dt*A*V(t) + h*R*N = 0
        # [1-theta dt A] V(t) = [1 + (1-theta) dt A] V(t+dt) + h*R*N
        # Where A = -(r+h) + (r+h)*s d/dx + 1/2 var d2/dx2
        # Ae = [1 + (1-theta) dt A]
        # Ai = [1 - theta dt A]
        Ae = fd.calculate_fd_matrix(
            s, r_vec + h_, mu, var, dt, 1 - theta)

        Ai = fd.calculate_fd_matrix(
            s, r_vec + h_, mu, var, -dt, theta)

        res = fd.fd_roll_backwards_v2(res, theta, Ai=Ai, Ae=Ae, const=const * dt)

        if i < len(t_vec) - 1:
            # res[0] += flow_vec[i] * face_amount * exp(-(h_+r_)*dt)
            res[0] += flow_vec[i] * face_amount

        idx = res[0] < convValue
        res[0][idx] = convValue[idx]

        bulletPV_vec = fd.fd_roll_backwards_v2(bulletPV_vec, theta, Ai=Ai, Ae=Ae, const=const*dt)
        if i < len(t_vec) - 1:
            bulletPV_vec += flow_vec[i] * face_amount * exp(-(h_+r_)*dt)
            # bulletPV_vec += flow_vec[i] * face_amount

        # adjust for dividend
        if (dvd_yield := dvd_yield_vec[i]) > 0:
            s_adj = s * (1 - dvd_yield)
            res[0] = np.interp(s_adj, s, res[0])
    return {'conv_price': res, 'sb_price': bulletPV_vec}
