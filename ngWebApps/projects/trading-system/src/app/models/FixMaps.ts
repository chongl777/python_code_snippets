export const STATUS_MAP = {
    '0': 'New',
    '1': 'Partially filled',
    '2': 'Filled',
    '3': 'Done for day',
    '4': 'Canceled',
    '5': 'Replaced (Removed/Replaced)',
    '6': 'Pending Cancel',
    '7': 'Stopped',
    '8': 'Rejected',
    '9': 'Suspended',
    'A': 'Pending New',
    'B': 'Calculated',
    'C': 'Expired',
    'D': 'Accepted for bidding',
    'E': 'Pending Replace',
}

export const ORDER_TYPE_MAP = {
    '1': 'Market',
    '2': 'Limit',
    '3': 'Stop',
    '4': 'Stop limit',
    '6': 'With or without',
    '7': 'Limit or better (Deprecated)',
    '8': 'Limit with or without',
    '9': 'On basis',
    'D': 'Previously quoted',
    'E': 'Previously indicated',
    'G': 'Forex - Swap',
    'I': 'Funari (Limit Day Order with unexecuted portion handled as Market On Close. e.g. Japan)',
    'J': 'Market If Touched (MIT)',
    'K': 'Market with Leftover as Limit (market order then unexecuted quantity becomes limit order at last price)',
    'L': 'Previous Fund Valuation Point (Historic pricing) (for CIV)',
    'M': 'Next Fund Valuation Point (Forward pricing) (for CIV)',
    'P': 'Pegged',
}

export const PRICE_TYPE_MAP = {
    '1': 'Price',
    '2': 'Per unit',
    '3': 'Fixed amount (absolute value)',
    '4': 'Discount',
    '5': 'Premium',
    '6': 'Spread',
    '7': 'TED Price',
    '8': 'TED Yield',
    '9': 'Yield',
    '10': 'Fixed cabinet trade price',
    '11': 'Variable cabinet trade price',
    '13': 'Product ticks in halfs',
    '14': 'Product ticks in fourths',
    '15': 'Product ticks in eights',
    '16': 'Product ticks in sixteenths',
    '17': 'Product ticks in thirty-seconds',
    '18': 'Product ticks in sixty-forths',
    '19': 'Product ticks in one-twenty-eights',
}


export const NAME_MAPPING = {
    'EMC': 'TS',
    'EMCST': 'TSs',
    'RVS': 'VS',
    'RVS2': 'VS2',
    'ERH': 'TVS',
    'FA': 'FA',
}

export const SIGNAL_ID_2_NAME = {
    1: 'TS',
    3: 'VS',
    7: 'VS2',
    10: 'TSs',
}
