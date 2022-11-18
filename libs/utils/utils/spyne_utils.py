#!/usr/bin/env python
# encoding: utf8

from functools import wraps
from spyne.model.primitive import (
    Unicode, Integer, DateTime, Boolean, Double)
from spyne.model.complex import ComplexModel
from spyne.model.complex import Iterable, Array
from spyne import (rpc, srpc)
import pandas as pd
import numpy as np

_f_template = '''
class {klss}(ComplexModel):
    _type_info = typ_info
@rpc(*args, _returns=Iterable({klss}))
@wraps(f)
def f1({a}):
    for x in f({a}):
        yield x.to_complex({klss})
'''

_f_template_srpc = '''
class {klss}(ComplexModel):
    _type_info = typ_info
@srpc(*args, _returns=Iterable({klss}))
@wraps(f)
def f1({a}):
    for x in f({a}):
        yield x.to_complex({klss})
'''


def type_convert(typename):
    if np.issubdtype(typename, np.int):
        return Integer
    elif np.issubdtype(typename, np.float):
        return Double
    elif (np.issubdtype(typename, np.str) or
          np.issubdtype(typename, np.unicode)):
        return Unicode
    elif np.issubdtype(typename, np.datetime64):
        return DateTime
    elif typename == np.object:
        return Unicode
    elif typename == np.bool:
        return Boolean
    else:
        return Unicode


def to_complex_df(df, T):
    # T._type_info = security_list.dtypes.map(type_convert).to_dict()

    def row_to_complex(row):
        return T(**row.dropna().to_dict())

    res = []

    for _, x in df.iterrows():
        res.append(row_to_complex(x))
    return res


def to_complex_series(sr, T):
    # T._type_info = security_list.dtypes.map(type_convert).to_dict()

    def row_to_complex(row):
        return T(**row.dropna().to_dict())

    return row_to_complex(sr)


def dynamic_table(func, *args):

    def wrapper(f):
        # res_test = f()

        argcount = f.__code__.co_argcount
        params = f.__code__.co_varnames[:argcount]
        typ_info = func().dtypes.map(type_convert).to_dict()

        _f_definition = _f_template.format(
            a=','.join(params), klss='Cls_'+f.__name__)
        namespace = {'ComplexModel': ComplexModel,
                     'typ_info': typ_info,
                     'Array': Array, 'args': args,
                     'rpc': rpc,
                     'wraps': wraps, 'f': f, 'Iterable': Iterable}
        exec(_f_definition, namespace)
        # return spyne.srpc(*args, _returns=Array(Record))(wraps(f)(f1))
        return namespace['f1']
    return wrapper


def sdynamic_table(func, *args):

    def wrapper(f):
        # res_test = f()

        argcount = f.__code__.co_argcount
        params = f.__code__.co_varnames[:argcount]
        typ_info = func().dtypes.map(type_convert).to_dict()

        _f_definition = _f_template_srpc.format(
            a=','.join(params), klss='Cls_'+f.__name__)

        namespace = {'ComplexModel': ComplexModel,
                     'typ_info': typ_info,
                     'Array': Array, 'args': args,
                     'srpc': srpc,
                     'wraps': wraps, 'f': f, 'Iterable': Iterable}
        exec(_f_definition, namespace)
        # return spyne.srpc(*args, _returns=Array(Record))(wraps(f)(f1))
        return namespace['f1']
    return wrapper


pd.DataFrame.to_complex = to_complex_df
pd.Series.to_complex = to_complex_series
