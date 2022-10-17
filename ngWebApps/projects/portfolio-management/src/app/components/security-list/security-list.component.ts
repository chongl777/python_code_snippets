import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Security } from '@app/models/security';
import { EventService } from '@app/services/event.service';
import { SecurityService } from '@app/services/security.service';
import { ExpandCollapseAnimation } from '@app/animations/app.animations';
import { BehaviorSubject, Subscription } from 'rxjs';
import { utils } from 'shared-library';


interface ListedSecurity extends Security {
    show: Boolean;
}


@Component({
    selector: 'app-security-list',
    templateUrl: './security-list.component.html',
    styleUrls: ['./security-list.component.scss'],
    animations: [
        ExpandCollapseAnimation(),
    ]
})
export class SecurityListComponent implements OnInit {
    public loading$ = new BehaviorSubject<boolean>(false);
    public dataSource = new MatTableDataSource<GenericSecurity>();
    public selectedSecurity: Security;
    private securities: ListedSecurity[];
    public subscription = new Subscription();
    public errMsg: string = '';
    public columnsToDisplay = ['SID', 'Security', 'Outstanding', 'CorpLevel']
    public currentPID: number = null;
    constructor(
        private securityDataSvs: SecurityService,
        private evt: EventService,
        private router: Router,
        private route: ActivatedRoute,
    ) {
        this.subscription.add(this.evt.filterCompany$.subscribe(
            (pid: number) => {
                if (pid != null) {
                    this.securities.forEach(security => {
                        if (security.parents.includes(pid)) {
                            security.show = true;
                        } else {
                            security.show = false;
                        }
                    });
                }
            }
        ));

        this.subscription.add(this.evt.selectSecurity$.subscribe(
            async (sid: number) => {
                if (sid != null) {
                    try {
                        this.loading$.next(true);
                        this.selectedSecurity = await this.securityDataSvs.getSecurityData(sid);

                        if (this.currentPID != this.selectedSecurity.ultimateParentID) {
                            this.currentPID = this.selectedSecurity.ultimateParentID;
                            this.securities = await this.securityDataSvs.allSecuritiesInParent(
                                this.selectedSecurity.ultimateParentID) as ListedSecurity[];
                            this.securities.forEach(x => x.show = true);
                            let group = this.groupby(this.securities, ['group_name']);
                            this.dataSource.data = group;
                        }
                        this.loading$.next(false);
                    } catch (err) {
                        this.loading$.next(false);
                        this.errMsg = utils.errMsg(err);
                    }
                }
            }));

        this.subscription.add(this.evt.selectCompany$.subscribe(
            async (pid: number) => {
                if (pid != null) {
                    try {
                        this.loading$.next(true);
                        let securities = await this.securityDataSvs.allSecuritiesInParent(pid)
                        this.selectedSecurity = securities && securities[0];
                        let group = this.groupby(securities, ['group_name']);
                        this.dataSource.data = group;
                        this.loading$.next(false);
                    } catch (err) {
                        this.loading$.next(false);
                        this.errMsg = utils.errMsg(err);
                    }
                }
            }));
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    onSelectSecurity(security: Security) {
        this.router.navigate(
            ['.'], { relativeTo: this.route, queryParams: { sid: security.securityID } });
    }

    groupby(securities: GenericSecurity[], groupBy: string[]): GenericSecurity[] {

        let res = new Map<string, GenericSecurity[]>();

        let groupField = groupBy[0]
        groupBy = groupBy.slice(1);
        for (let sec of securities) {
            let groupValue = sec[groupField];
            if (res.has(groupValue)) {
                res.get(groupValue).push(sec);
            } else {
                res.set(groupValue, [sec]);
            }
        }

        let res2 = [];
        for (let [key, securities] of res) {
            let gSec = new GroupSecurity(key);
            gSec.expanded = true;
            if (groupBy.length == 0) {
                gSec.children = securities;
            } else {
                gSec.children = this.groupby(securities, groupBy);
            }
            res2.push(gSec);
        }

        return res2;
    }

    rowClassFn(item: any) {
        return 'level-' + item.level;// + ((item.show != null) ? (item.show ? ' expand' : ' collapse') : '');
    }

    rowAnimation(item: ListedSecurity): string {
        if (item.show == null) {
            return "static";
        }
        if (!item.show) {
            return 'collapse';
        }
        return 'expand';
    }
}


class GroupSecurity {
    public expanded = false;
    private _children: GenericSecurity[];
    private _level = null;

    constructor(public groupName: string) {
        this._children = [];
    }

    get securityID(): string {
        return this.groupName;
    }

    get description(): string {
        return "";
    }

    get children(): GenericSecurity[] {
        return this._children;
    }

    set children(value: GenericSecurity[]) {
        this._children = value;
    }

    get corpLevel(): string {
        return "";
    }

    get level(): number {
        if (this._level == null) {
            this._level = this.children[0].level + 1;
        }
        return this._level;
    }
}

type GenericSecurity = GroupSecurity | Security;
