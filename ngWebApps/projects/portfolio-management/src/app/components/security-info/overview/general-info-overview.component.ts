import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMarketDataSource } from '@app/models/marketDataSource';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { MarketDataService } from '@app/services/market-data.service';
import { SearchItem, SecurityService } from '@app/services/security.service';
import { Subscription, of, BehaviorSubject, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NavConfig, utils } from 'shared-library';

import * as d3 from 'd3';
import { TradingRecords } from '@app/models/tradingRecords';
import { DataFrame } from '@app/models/marketData';
import { LinesConfig, NaviConfig } from '@components/plot-chart/plot-chart.component';


@Component({
    selector: 'app-security-general-info-overview',
    templateUrl: './general-info-overview.component.html',
    styleUrls: ['./general-info-overview.component.scss'],
})
export class GeneralInfoOverviewComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public subscription = new Subscription();
    public tradingRecs: TradingRecords;
    public pltDataSource = new BehaviorSubject<any>(null);
    public secAttrData: any = null;
    public secRtgs: any[];
    public secPrices: { [sid: number]: any } = {};
    public historyData: DataFrame = new DataFrame('t_date', []);
    public secInfo: Security;

    @Input() updateOnResize = false;

    public _plotLinesConfig: LinesConfig[] = [
        { klass: 'bond_px', field: 'bond_px', axis: 'yaxis', show_tooltip: true, color: this.plotColor(0) },
    ];


    public plotYaxes = {
        yaxis: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'bond_px',
            domain_margin: 0.2,
            anchor: 'right',
            ticketSizeInner: function () { return this.plotWidth },
            ticketSizeOuter: () => 0,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: function () { return this.plotWidth },
        },
    };

    public navigator: NaviConfig = {
        index: 't_date',
        field: 'bond_px',
        fmt: d3.timeFormat("%b '%y"),
        tooltipfmt: d3.timeFormat('%Y-%m-%d'),
        domainfmt: d3.timeFormat('%Y-%m-%d'),
        scale: d3.scaleTime()
    }

    public plotLinesConfig = [];

    public highLightConfig = [];

    public tagsConfig = [
        { field: 'trading_rec', axis: 'yaxis', line_anchor: 'bond_px', klass: 'trading_rec' }
    ]


    constructor(
        private cdf: ChangeDetectorRef,
        private evt: EventService,
        private securityDataSvs: SecurityService,
        private marketDataSvs: MarketDataService,
    ) {
    }

    ngOnInit(): void {
        this.subscription.add(this.evt.selectSecurity$.pipe(
            switchMap(sid => {
                this.loading$.next(false);
                this.errMsg = "";
                return from((async (): Promise<[sid: number, data: any[]]> => {
                    this.loading$.next(true);
                    if (sid != null) {
                        try {
                            let data = await Promise.all([
                                this.securityDataSvs.getSecurityData(sid),
                                this.marketDataSvs.getSecurityTrdingRecords(sid, null),
                                this.marketDataSvs.getSecurityPriceHist(sid),
                                this.marketDataSvs.getSecurityAttr(sid),
                                this.marketDataSvs.getSecurityRtg(sid),
                                this.marketDataSvs.getSecurityCurrentPx(sid),
                            ]);

                            return [sid, data];
                        } catch (err) {
                            this.errMsg = utils.errMsg(err);
                            return null;
                        }
                    } else {
                        this.errMsg = 'choose a security';
                        return null;
                    }

                })());
            })
        ).subscribe(
            async (result: [sid: number, data: any[]]) => {
                try {
                    if (result == null) {
                        this.loading$.next(false);
                        return;
                    }
                    let [sid, data] = result;
                    this.secInfo = data[0];
                    this.tradingRecs = data[1];
                    this.secAttrData = data[3];
                    let priceHist = data[2];
                    this.secRtgs = data[4] || [];
                    this.secPrices = data[5] || {};

                    priceHist.data.forEach(x => { x['t_date'] = new Date(x['t_date']) });
                    priceHist.columns = [sid];

                    let dataHist = priceHist.toListData();
                    dataHist['t_date'] = dataHist['t_date'].map(x => new Date(x));
                    this._plotLinesConfig = [
                        { klass: 'bond_px', field: sid, axis: 'yaxis', show_tooltip: true, color: this.plotColor(0) },
                    ];
                    this.navigator.field = sid;
                    // dataHist['bond_px'] = dataHist[sid];

                    let dataHistory = this.configHighLight(sid, dataHist);
                    dataHistory['trading_rec'] = this.tradingRecs == null ? [] : this.tradingRecs.records;
                    this.pltDataSource.next(dataHistory);
                } catch (err) {
                    this.errMsg = utils.errMsg(err);
                    console.error(err);
                }
                this.loading$.next(false);
            }
        ));
    }

    ngAfterViewInit() {
        // console.log('enter here')
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    plotColor(i: number) {
        return d3.schemeCategory10[i];
    }


    configHighLight(sid: number, histData: any) {
        if (this.tradingRecs == null) {
            this.plotLinesConfig = this._plotLinesConfig;
            this.cdf.detectChanges();
            return histData;
        }

        let price = histData[sid];
        let date = histData['t_date'];
        let highlightPeriods = this.tradingRecs.records
            .filter(x => x['positionSize'] != 0);

        highlightPeriods.forEach(period => {
            if (!period.price) {
                try {
                    let dateIndx = date.filter(x => x >= period.tradeDt)[0];
                    period.price = price[date.indexOf(dateIndx)];
                } catch (err) {
                    console.error(err);
                }
            }

        });

        let highlightData = highlightPeriods
            .map(period => {
                return price.map((px: number, i: number) => {
                    if ((date[i] < period.start) || ((period.end != null) && (date[i] > period.end))) {
                        return null
                    }
                    return px
                })
            });

        this.highLightConfig = highlightPeriods.map((period: any, i: number) => {
            histData['hld-period-' + i] = highlightData[i];
            return {
                klass: 'hld-period ' + (period['positionSize'] > 0 ? 'positive' : 'negative'),
                field: 'hld-period-' + i,
                axis: 'yaxis',
                show_tooltip: false,
                color: null,
            }
        });

        this.plotLinesConfig = this._plotLinesConfig.concat(this.highLightConfig);
        this.cdf.detectChanges();
        return histData;
    }

}
