import pysftp
import os
import sys


def ei_site():
    cnopts = pysftp.CnOpts()
    cnopts.hostkeys = None
    return pysftp.Connection(
        host="secureftp.gnetsys.com",
        username='westfield',
        port=22,
        password='w3stfie1d#GNS@2018!',
        cnopts=cnopts)


def bb_site():
    bb_private_key = os.environ['BB_PRIVATE_KEY']
    cnopts = pysftp.CnOpts()
    cnopts.hostkeys = None

    return pysftp.Connection(
        host="sftp.arcesium.com",
        username='westfield',
        port=2222,
        private_key=bb_private_key,
        private_key_pass='Westfield',
        cnopts=cnopts)
