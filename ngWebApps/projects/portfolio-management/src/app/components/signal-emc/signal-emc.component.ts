import { ChangeDetectorRef, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { EventService } from '@services/event.service';
import { MarketDataService } from '@services/market-data.service';
import { EMC } from '@models/marketData/index';
import { BehaviorSubject, from, Subscription } from 'rxjs';
import { utils } from 'shared-library';
import * as d3 from 'd3';
import { Security } from '@app/models/security';
import { SecurityService } from '@app/services/security.service';
import { PlotChartComponent } from '@components/plot-chart/plot-chart.component';
import { TradingRecords } from '@app/models/tradingRecords';
import { switchMap } from 'rxjs/operators';


@Component({
    selector: 'app-signal-emc',
    templateUrl: './signal-emc.component.html',
    styleUrls: ['./signal-emc.component.scss']
})
export class SignalEMCComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public errMsg: string = '';
    public pltDataSource = new BehaviorSubject<any>(null);
    private subscription = new Subscription();

    public sigData: EMC;
    public secInfo: Security;
    public tradingRecs: TradingRecords;
    public get TimeUnit() {
        return this.signalSrc == 10 ? 'W' : 'M'
    }

    public plotYaxes = {
        yaxis1: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'signal',
            domain_margin: 0.2,
            anchor: 'left',
            ticketSizeInner: () => 5,
            ticketSizeOuter: () => 0,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: () => 0,
        },
        yaxis2: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'score',
            anchor: 'left',
            ticketSizeInner: () => 5,
            ticketSizeOuter: () => 0,
            domain_margin: 0.2,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: () => 35,
        },
        yaxis3: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'bond_px',
            anchor: 'right',
            ticketSizeInner: function () { return this.plotWidth - 35 },
            ticketSizeOuter: () => 0,
            domain_margin: 0.5,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: function () { return this.plotWidth - 35 },
        },
        yaxis4: {
            fields: [],
            fmt: (x) => { return d3.format(',.2f')(x) },
            text: 'eq_px',
            anchor: 'right',
            ticketSizeInner: () => { return 5 },
            ticketSizeOuter: () => 0,
            domain_margin: 0.5,
            tooltipfmt: (x) => { return d3.format(',.2f')(x) },
            scale: d3.scaleLinear(),
            transform: null,
            pos: function () { return this.plotWidth },
        }
    }

    @Input('signalSrc') signalSrc: number = 1;
    @Input('updateOnResize') updateOnResize = true;
    @ViewChild('plotChart', { static: true }) plotChart: PlotChartComponent;

    public _plotLinesConfig = [
        { klass: 'bond_px', field: 'bond_px', axis: 'yaxis3', show_tooltip: true, color: this.plotColor(0) },
        { klass: 'eq_px', field: 'equity_px', axis: 'yaxis4', show_tooltip: true, color: this.plotColor(1) },
        { klass: 'signal', field: 'signal', axis: 'yaxis1', show_tooltip: true, color: this.plotColor(2) },
        { klass: 'score', field: 'score', axis: 'yaxis2', show_tooltip: true, color: this.plotColor(3) }
    ];

    public plotLinesConfig = [];

    public highLightConfig = [];

    public tagsConfig = [
        { field: 'trading_rec', axis: 'yaxis3', line_anchor: 'bond_px', klass: 'trading_rec' }
    ]

    constructor(
        private evt: EventService,
        private marketDataSvs: MarketDataService,
        private securityDataSvs: SecurityService,
        private cdf: ChangeDetectorRef,
    ) {
    }

    ngOnInit(): void {
        this.subscribeToEvent();
        let tEnd = new Date();
        let tStart = new Date(tEnd);
        tStart.setMonth(tEnd.getMonth() - 6);
        this.plotChart.setXaxisStartEnd(tStart, tEnd);
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    subscribeToEvent(): void {
        this.subscription.add(this.evt.selectSecurity$.pipe(
            switchMap(sid => {
                this.loading$.next(false);
                this.errMsg = "";
                return from((async () => {
                    this.loading$.next(true);
                    if (sid != null) {
                        try {
                            let data = await Promise.all([
                                this.marketDataSvs.getSignalData<EMC>(sid, this.signalSrc),
                                this.securityDataSvs.getSecurityData(sid),
                                this.marketDataSvs.getSecurityTrdingRecords(sid, null),
                            ]);
                            return data;
                        } catch (err) {
                            this.errMsg = utils.errMsg(err);
                            return null
                        }
                    } else {
                        this.errMsg = 'sid cannot be null';
                        return null;
                    }
                })());
            })
        ).subscribe(
            async (data: any[]) => {
                if (data == null) {
                    this.loading$.next(false);
                    return;
                }
                try {
                    this.sigData = data[0];
                    this.secInfo = data[1];
                    this.tradingRecs = data[2];
                    this.configHighLight();

                    let histData = Object.assign({}, this.sigData.historyData);

                    histData['trading_rec'] = this.tradingRecs == null ? [] : this.tradingRecs.records;
                    this.pltDataSource.next(histData);
                } catch (err) {
                    this.errMsg = utils.errMsg(err);
                    console.error(err);
                }
                this.loading$.next(false);
            }
        ));
    }

    plotColor(i: number) {
        return d3.schemeCategory10[i];
    }

    configHighLight() {
        if (this.tradingRecs == null) {
            this.plotLinesConfig = this._plotLinesConfig;
            this.cdf.detectChanges();
            return;
        }

        let price = this.sigData.historyData['bond_px'];
        let date = this.sigData.historyData['t_date'];
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
            this.sigData.historyData['hld-period-' + i] = highlightData[i];
            return {
                klass: 'hld-period ' + (period['positionSize'] > 0 ? 'positive' : 'negative'),
                field: 'hld-period-' + i,
                axis: 'yaxis3',
                show_tooltip: false,
                color: null,
            }
        });

        this.plotLinesConfig = this._plotLinesConfig.concat(this.highLightConfig);
        this.cdf.detectChanges();
    }
}
