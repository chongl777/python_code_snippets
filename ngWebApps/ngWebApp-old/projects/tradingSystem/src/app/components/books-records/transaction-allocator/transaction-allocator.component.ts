import {
    Component, OnInit, ViewChild, AfterViewInit, Input, Output, EventEmitter,
    ChangeDetectorRef, TemplateRef, OnDestroy, ChangeDetectionStrategy, ElementRef
} from '@angular/core';
import { BehaviorSubject, of, merge, Observable, Subscription, throwError } from 'rxjs';

import { Security } from '@app/models/security';
import { StrategyLot, TaxLot, TradeTicket } from '@app/models/tradeTicket';
import { EventService } from '@app/services/event.service';
import { FundsService, FundsDataService } from '@app/services/funds.service';
import { Fund } from '@app/models/fund';
import { map, mapTo, startWith, switchMap } from 'rxjs/operators';
import { AVAILABLE_STAGS, TradeTicketsService } from '@app/services/trade-tickets.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { DialogWindowComponent } from '@app/components/dialog-window/dialog-window.component';
import { MatDialog } from '@angular/material/dialog';
import { SettingComponent } from './setting.component';
import { CacheableObject, CacheValuesService } from '@app/services/cache-values.service';

import * as commons from '@app/models/commons';


class FundTradesAllocator {
    // taxLotDataSource: MatTableDataSource<TaxLot>;
    lastOne: boolean = false;
    initialized: boolean = false;
    taxLotDataSource: TaxLot[] = [];
    straLotDataSource: StrategyLot[] = [];
    taxLotColumns = ['FundID', 'CreateDt', 'LotID', 'Account', 'CostBasis', 'Quantity', 'AllocatedQty', 'DeleteLot'];
    straLotColumns = ['FundID', 'sLevel1', 'sLevel2', 'sLevel3', 'AllocatedQty', 'DeleteLot'];
    _settleAcct: string = null;

    get settleAcct(): string {
        return this._settleAcct;
    }

    set settleAcct(val: string) {
        if (this._settleAcct != val) {
            this._settleAcct = val;
            this.setAllocateQty(this._allocatedQty);
        }
    }

    get allocatedStraQty(): number {
        return this.straLotDataSource.reduce(
            (sumVal: number, currentLot: StrategyLot) => {
                return sumVal + (currentLot.allocatedQty || 0);
            }, 0);
    }

    _allocatedQty: number;
    get allocatedQty(): number {
        // console.log('get allocated');
        return this._allocatedQty;
        // return this.taxLotDataSource.reduce(
        //     (sumVal: number, currentLot: TaxLot) => {
        //         return sumVal + (currentLot.allocatedQty || 0);
        //     }, 0);
    }

    set allocatedQty(val: number) {
        // console.log('get allocated');
        this.ticket.dirty = true;
        let currentVal = this.allocatedQty;
        if (currentVal == val) {
            return;
        }
        this.setAllocateQty(val);
    }

    setAllocateQty(val: number): void {
        this._allocatedQty = val;
        if (this.settleAcct == null) {
            return;
        }

        if (val != 0) {
            if (this.ticket.getStraLots(this.fund.fundID).length == 0) {
                let firstLot = this.ticket.addStrategyLots(this.fund.fundID);
                firstLot.sLevel1 = this.fundSetting.sLevel1;
                firstLot.sLevel2 = this.fundSetting.sLevel2;
                firstLot.sLevel3 = this.fundSetting.sLevel3;
            }

            let allStraLots = this.ticket.getStraLots(this.fund.fundID);
            if (allStraLots.length == 1) {
                let firstLot = allStraLots[0];
                firstLot.allocatedQty = val;
            }
        } else {
            this.ticket.removeStrategyLots(this.fund.fundID);
        }

        this.taxLotDataSource.map(x => x.allocatedQty = null);
        for (let lot of this.taxLotDataSource.filter(x => !x.newLot && (x.acct == this.settleAcct))) {
            if (val * lot.quantity < 0) {
                lot.allocatedQty = (Math.abs(val) > Math.abs(lot.quantity)) ? -lot.quantity : val;
                val = val - lot.allocatedQty
            } else {
                lot.allocatedQty = null;
            }
        }
        if ((val != 0) && (val != null)) {
            let newLot = this.ticket.getNewLot(this.fund.fundID, this.settleAcct);
            newLot.allocatedQty = val;
        } else {
            this.ticket.removeNewLot(this.fund.fundID);
        }
    }

    addStrategyAllocation(): void {
        this.ticket.addStrategyLots(this.fund.fundID);
    }

    delStrategyLot(lot: StrategyLot): void {
        this.ticket.removeStrategyLot(this.fund.fundID, lot);
    }

    onChangingTaxLotAllocation(): void {
        this.recalcTaxLotAllocation();
    }

    recalcTaxLotAllocation(): void {
        this._allocatedQty = this.taxLotDataSource.reduce(
            (sumVal: number, currentLot: TaxLot) => {
                return sumVal + (currentLot.allocatedQty || 0);
            }, 0);

    }

    get currentQuanty(): number {
        return this.taxLotDataSource.reduce(
            (sumVal: number, currentLot: TaxLot) => {
                return sumVal + (currentLot.quantity || 0);
            }, 0);
    }

    balanceQty(): void {
        this.fnBalance(this);
    }

    balanceStraLotQty(lot: StrategyLot): void {
        let totalQty = this.straLotDataSource.filter((x) => x != lot).reduce(
            (accumulator, currentAllocator) => accumulator + (currentAllocator.allocatedQty || 0), 0)
        lot.allocatedQty = this.allocatedQty - totalQty;
    }

    maxTaxLotQty(lot: TaxLot): void {
        lot.allocatedQty = -lot.quantity;
    }

    get confirmed(): boolean {
        return this.ticket && this.ticket.confirmed;
    }

    constructor(public ticket: TradeTicket, public fund: Fund,
        private fundSetting: any, public fnBalance: (fundAllocator: FundTradesAllocator) => void) {

        if (this.ticket == null) {
            return null;
        }
        // this.taxLotDataSource = new MatTableDataSource<TaxLot>([]);

        this.ticket.taxLots$.subscribe((data: TaxLot[]) => {
            this.taxLotDataSource = data.filter((x) => x.fundID == this.fund.fundID);

            let allocated = this.taxLotDataSource.filter(x => x.allocatedQty)
            if (allocated.length > 0) {
                this._settleAcct = allocated[0].acct;
            }

            if (this.confirmed) {
                this.taxLotColumns = ['FundID', 'LotID', 'Account', 'AllocatedQty', 'DeleteLot'];
                this.recalcTaxLotAllocation();
                return;
            } else {
                this.taxLotColumns = ['FundID', 'CreateDt', 'LotID', 'Account', 'CostBasis', 'Quantity', 'AllocatedQty', 'DeleteLot'];
            }

            if (!this.initialized) {
                this.initialized = true;
                if (this.lastOne) {
                    this.balanceQty();
                } else {
                    if (this.ticket.security.secType == 'Corporate Bond') {
                        this.setAllocateQty(
                            Math.round(this.ticket.quantity * fundSetting.defaultAlloc / 1000) * 1000);
                    } else {
                        this.setAllocateQty(
                            Math.round(this.ticket.quantity * fundSetting.defaultAlloc));
                    }
                }
            }
        });

        this.ticket.straLots$.subscribe((data: StrategyLot[]) => {
            this.straLotDataSource = data.filter((x) => x.fundID == this.fund.fundID);
        });
    }

    availableSTags: { tag1: string, tag2: string, tag3: string }[];

    availableSTags1(lot: StrategyLot) {
        return [...new Set(AVAILABLE_STAGS.map(x => x.tag1))];
    }

    availableSTags2(lot: StrategyLot) {
        return [...new Set(AVAILABLE_STAGS.filter(x => x.tag1 == lot.sLevel1).map(x => x.tag2))];
    }

    availableSTags3(lot: StrategyLot) {
        return AVAILABLE_STAGS.filter(x => (x.tag1 == lot.sLevel1) && (x.tag2 == lot.sLevel2)).map(x => x.tag3);
    }

    get isvalid() {
        if ((this.settleAcct == null) && this.allocatedQty) {
            this.invalidMessage = 'Choose account to settle';
            return false;
        }

        if (!this.confirmed) {
            for (let lot of this.taxLotDataSource) {
                if (!lot.isValid) {
                    this.invalidMessage = `tax lot ${lot.lotID} allocated quantity exceed available quantity!`;
                    return false;
                }
            }
        }

        for (let lot of this.straLotDataSource) {
            if (!lot.isValid) {
                this.invalidMessage = `strategy lot need fill in sLevel!`;
                return false;
            }
        }

        if (this.allocatedStraQty != this.allocatedQty) {
            this.invalidMessage = "Strategy lot allocated quantity must equity tax lot allocated quantity";
            return false;
        }
        return true;
    }

    _invalidMessage: string = ''
    get invalidMessage() {
        return this._invalidMessage;
    }

    set invalidMessage(val: string) {
        this._invalidMessage = val;
    }

}


@Component({
    selector: 'app-transaction-allocator',
    templateUrl: './transaction-allocator.component.html',
    styleUrls: ['./transaction-allocator.component.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionAllocatorComponent implements OnInit {
    @Input() ticket: TradeTicket;

    errMsg: string = '';
    subscription = new Subscription();
    loading$ = new BehaviorSubject<boolean>(true);
    fundsDataService: FundsDataService;
    funds: Fund[];
    fundAllocators: FundTradesAllocator[];
    settings: CacheableObject;

    constructor(
        private fundService: FundsService,
        public tradeTicketService: TradeTicketsService,
        private _cdr: ChangeDetectorRef,
        public matDialog: MatDialog,
        public _ref: ElementRef,
        private eventService: EventService,
        private cacheValuesService: CacheValuesService,
    ) {
        this.fundsDataService = new FundsDataService(this.fundService);
        this.settings = this.cacheValuesService.createCachable(
            'trade-allocation', ['fundsSettings']);
    }

    ngOnInit(): void {
        this.subscription.add(this.fundsDataService.funds$.subscribe({
            next: (funds: Fund[]) => {
                this.funds = funds;
                this.validateCookieSettings();
                this._cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errMsg = error.message;
            }
        }));

        this.eventService.selectedTradeTicket$.pipe(
            switchMap((ticket: TradeTicket) => {
                this.errMsg = '';
                this.loading$.next(true);
                if (!ticket) {
                    this.ticket = null;
                    return of(null);
                }
                this.ticket = ticket;
                this._cdr.detectChanges();
                if (this.ticket.tradeID) {
                    return of(this.ticket);
                }
                if (!this.ticket.lotQueried) {
                    return this.tradeTicketService.loadLots(this.ticket)
                        .then(() => {
                            return this.ticket;
                        })
                        .catch((error: any) => {
                            try {
                                this.errMsg = error.error.message;
                            } catch {
                                this.errMsg = error.message;
                            }
                            return null;
                        });
                }
                return of(this.ticket);
            })).subscribe({
                next: (ticket: TradeTicket) => {
                    this.loading$.next(false);

                    if (!ticket) {
                        this.ticket = null;
                        return null;
                    }

                    this.fundAllocators = this.funds.map(
                        (fund: Fund) => {
                            let allocator = new FundTradesAllocator(
                                this.ticket, fund, this.settings['fundsSettings'][fund.fundID],
                                (x: FundTradesAllocator) => this.balanceQty(x));
                            return allocator;
                        });

                    if (this.fundAllocators.length > 0) {
                        this.fundAllocators[this.fundAllocators.length - 1].lastOne = true;
                    }

                    this._cdr.detectChanges();
                },
                error: (error: any) => {
                    this.loading$.next(false);
                    console.error(error);
                    try {
                        this.errMsg = error.error.message;
                    } catch {
                        this.errMsg = error.message;
                    }
                }
            });

        this.subscription.add(merge(
            this.fundsDataService.loading$).pipe(
                map(() => {
                    let funds_loading = this.fundsDataService.loading$.getValue();
                    return funds_loading;
                }),
                startWith(true),
            ).subscribe((val: boolean) => this.loading$.next(val)));
        this._cdr.detectChanges();
    }

    validateCookieSettings(): void {
        let fundSetting = this.settings['fundsSettings'] = this.settings['fundsSettings'] || {};
        for (let fund of this.funds) {
            if (!(fund.fundID in fundSetting)) {
                fundSetting[fund.fundID] = { fundName: fund.fundName, fundID: fund.fundID }
            }
        }
        this.settings.save();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    async submitTrade(): Promise<any> {
        try {
            this.loading$.next(true);
            this._cdr.detectChanges();

            let msg = await this.tradeTicketService.submitTicket(this.ticket);
            this.loading$.next(false);
            alert(msg);
            this.eventService.selectedTradeTicket$.next(null);
        } catch (err) {
            this.loading$.next(false);
            alert(`trade submiting failed! ${commons.errMsg(err)}`);
            console.error(err);
        } finally {
            this._cdr.detectChanges();
        }
    }

    invalidTrade(): void {
        this.tradeTicketService.invalidateTicket(this.ticket);
        this.eventService.selectedTradeTicket$.next(null);
    }

    async cancelTransaction(): Promise<any> {
        try {
            this.loading$.next(true);
            this._cdr.detectChanges();

            let msg = await this.tradeTicketService.cancelTransaction(this.ticket);
            this.loading$.next(false);
            alert(msg);
        } catch (err) {
            this.loading$.next(false);
            alert(`trade submiting failed! ${commons.errMsg(err)}`);
            console.error(err);
        } finally {
            this._cdr.detectChanges();
        }
    }

    async deleteTransaction(): Promise<any> {
        try {
            this.tradeTicketService.loading_transaction$.next(true);
            let msg = await this.tradeTicketService.deleteTransaction(this.ticket);
            this.tradeTicketService.loading_transaction$.next(false);
            alert(msg);

        } catch (err) {
            this.loading$.next(false);
            alert(`trade delete failed! ${commons.errMsg(err)}`);
            console.error(err);
        } finally {
            this._cdr.detectChanges();
        }
    }

    updateTransaction(): void {
    }

    balanceQty(fundAllocator: FundTradesAllocator) {
        let totalQty = this.fundAllocators.filter((x) => x != fundAllocator).reduce(
            (accumulator, currentAllocator) => accumulator + (currentAllocator.allocatedQty || 0), 0)
        fundAllocator.setAllocateQty(this.ticket.quantity - totalQty);
    }

    OpenSettingDialog() {
        this.subscription.add(
            DialogWindowComponent
                .OpenSetting(
                    this.matDialog,
                    SettingComponent,
                    this.settings['fundsSettings'])
                .subscribe((data) => this.updateSetting(data))
        );
    }

    updateSetting(data: any) {
        this.settings.save_from(data);
    }

    get totalAllocatedQty() {
        return this.fundAllocators.reduce((accumulator, current) => accumulator + (current.allocatedQty || 0), 0);
    }

    get isvalid(): boolean {
        let [valid, msg] = this.ticket.validity();
        if (!valid) {
            this.invalidMessage = msg;
            return false;
        }

        for (let allocator of this.fundAllocators) {
            if (!allocator.isvalid) {
                this.invalidMessage = '';
                return false
            }
        }
        if (this.totalAllocatedQty != this.ticket.quantity) {
            this.invalidMessage = 'Not all trade quantities are allocated!'
            return false;
        }
        return true;
    }

    _invalidMessage: string = ''
    get invalidMessage() {
        return this._invalidMessage;
    }

    set invalidMessage(val: string) {
        this._invalidMessage = val;
        // this._cdr.detectChanges();
    }
}
