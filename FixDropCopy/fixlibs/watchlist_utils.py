import pandas as pd
from operation.email_func import send_mail


def strftime(t):
    try:
        return t.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return ''


def to_datetime(t, local='US/Eastern'):
    try:
        return pd.to_datetime(t).tz_localize(
            'utc').tz_convert(local).replace(tzinfo=None)
    except Exception:
        return None


def to_date(t):
    try:
        return pd.to_datetime(t).date()
    except Exception:
        return None


def send_watchlist_matched_notification(
        info, ioi, env, emails=['research@westfieldinvestment.com']):
    style_tmplt = """
<style type="text/css">
    table#container_table table {
      width: 600px;
      border-collapse: collapse;
      border: 1px solid;
      padding: 2px;
    }

    table#info_table {
      color: steelblue;
    }

    table#short_cost {
      color: #FF0000;
    }

    table#short_cost tr.odd {
      background-color: #FFCCCC;
    }

    table#info_table tr td.OWIC {
      color: red;
    }

    table#info_table tr td.BWIC {
      color: green;
    }

    table#info_table tr.odd {
       background-color: #CCE7FF;
    }

</style>
"""

    subject_tmplt = """Tradeweb has an inquiry matching our EMC-RVS watchlist
{style}
<br/>
<br/>
<table id="container_table">
<tbody>
<tr><td>
  <table id="info_table">
    <thead><tr>
      <th style="width:250px"></th>
      <th style="width:350px"></th>
    </tr></thead>
    <tbody>
      {wl_details}
    </tbody>
  </table>
</td></tr>
<tr><td>
  <table id="short_cost">
    <thead><tr>
      <th style="width:250px"></th>
      <th style="width:350px"></th>
    </tr></thead>
    <tbody>
       {short_info}
    </tbody>
  </table>
</td></tr>
<tr><td>
  <table id="mkt price">
    <thead><tr>
      <th style="width:250px"></th>
      <th style="width:150px"></th>
      <th style="width:200px"></th>
    </tr></thead>
    <tbody>
       {mkt_px}
    </tbody>
  </table>
</td></tr>
</tbody>
</table>
<br/>
IOIID: {IOIID}
"""
    try:
        info = {k: info[k] for k in info}
        ioi = {k: ioi[k] for k in ioi if k not in info}
        px = info['mkt_px']

        due_time = to_datetime(ioi['ValidUntilTime']).strftime('%H:%M:%S')
        rfq_type = {'1': 'OWIC', '2': 'BWIC'}[ioi['Side']]

        mkt_data = {}
        mkt_data['cap_iq_px'] = px.get(19, {}).get('price')
        mkt_data['cap_iq_t_date'] = strftime(px.get(19, {}).get('t_date'))

        mkt_data['bval_px'] = px.get(2, {}).get('price')
        mkt_data['bval_t_date'] = strftime(px.get(2, {}).get('t_date'))

        mkt_data['finra_px'] = px.get(4, {}).get('price')
        mkt_data['finra_t_date'] = strftime(px.get(4 ,{}).get('t_date'))

        title = ("[{env}]Matching EMC-RVS watchlist, {rfq_type}, {security}, "
                 "IOI Quantity: {ioi_qty}, "
                 "valid ultil {t_date}, rating: {rating}").format(
                     env=env,
                     rfq_type=rfq_type,
                     security=info['watch_list']['Bond_Des'],
                     ioi_qty=ioi['IOIQty'],
                     t_date=due_time,
                     rating=ioi['UserRating'])

        wl_details = f"""
          <tr class="even">
              <td>&nbsp; Watchlist Date</td>
              <td>&nbsp; {info['watch_list']['t_date']}</td>
          </tr>
          <tr class="odd">
              <td>&nbsp; SecurityID</td>
              <td>&nbsp; {info['security_id']}</td>
          </tr>
          <tr class="even">
              <td class="{rfq_type}">&nbsp; {rfq_type} Qty(MM)</td>
              <td class="{rfq_type}">&nbsp; {float(ioi['IOIQty']) / 1e6: ,.3f}</td>
          </tr>
          <tr class="odd"><td>&nbsp; Reason To Trade</td>
             <td>&nbsp; [{ioi['categories']}] {ioi['reasons']}</td>
          </tr>
          <tr class="even"><td>&nbsp; Name</td>
              <td>&nbsp; {info['watch_list']['Bond_Des']}</td>
          </tr>
          <tr class="odd"><td>&nbsp; EMC/RVS</td>
              <td>&nbsp;
                 {info['emc_score'].get('emc_score', 'Null')} | {info['rvs_score'].get('rvs_score', 'Null')}
              </td></tr>
          <tr class="even"><td colspan="2">&nbsp;</td></tr>
          <tr class="even">
              <td colspan="2">&nbsp;</td>
          </tr>
          <tr class="odd">
              <td>&nbsp;Industry Level 1</td>
              <td>&nbsp; {info['watch_list']['industry_level_1']}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;Industry Level 2</td>
              <td>&nbsp; {info['watch_list']['industry_level_2']}</td>
          </tr>
          <tr class="odd">
              <td>&nbsp;Lien</td>
              <td>&nbsp; </td>
          </tr>
          <tr class="even">
              <td>&nbsp;Amount Outstanding (MM)</td>
              <td>&nbsp; {info['watch_list']['amt_outstanding']: ,.0f}</td>
          </tr>
          <tr class="odd">
              <td>&nbsp;Company total Debt (MMM)</td>
              <td>&nbsp;{info['rvs_score'].get('total_debt', 0)/1e3: ,.3f}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;Equity Market Cap (MM)</td>
              <td>&nbsp; {info['rvs_score'].get('eqt_mktcap', 0):,.0f}</td>
          </tr>
          <tr class="odd">
              <td>&nbsp; Company Leverage</td>
              <td>&nbsp; {info['rvs_score']['leverage']:,.1f}</td>
          </tr>
        """

        short_info = f"""
          <tr class="odd">
              <td>&nbsp;Short Status</td>
              <td>&nbsp; {info['short_info'].get('status')}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;Fee</td><td>&nbsp; {info['short_info'].get('rate/fee', 0):.2f}</td>
          </tr>
          <tr class="odd">
              <td>&nbsp;Allocated Qty (MM)</td>
              <td>&nbsp;{info['short_info'].get('quantity_filled', 0)/1e6:,.1f}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;Short Allocated Date</td>
              <td>&nbsp; {info['short_info'].get('short_allocated_date')}</td>
          </tr>
        """

        mkt_px = f"""
          <tr class="odd">
              <td>&nbsp;BBG Bval Price</td>
              <td>&nbsp; {mkt_data.get('bval_px', 'null')}</td>
              <td>&nbsp; {mkt_data.get('bval_t_date', '')}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;Finra Price</td>
              <td>&nbsp; {mkt_data.get('finra_px', 'null')}</td>
              <td>&nbsp; {mkt_data.get('finra_t_date')}</td>
          </tr>
          <tr class="even">
              <td>&nbsp;CapIQ Price</td>
              <td>&nbsp; {mkt_data.get('cap_iq_px')}</td>
              <td>&nbsp; {mkt_data.get('cap_iq_t_date')}</td>
          </tr>
        """
        subject = subject_tmplt.format(
            wl_details=wl_details, short_info=short_info,
            mkt_px=mkt_px, style=style_tmplt, IOIID=ioi['IOIID'])

        send_mail(
            emails,
            [""],
            title,
            subject, None, subtype='html',)
    except Exception as e:
        raise(e)
