import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Observable, Subject } from 'rxjs';
import {
    finalize, take, timeout, map, delay,
    takeWhile, takeUntil, filter, endWith
} from 'rxjs/operators';

import { RxStompService, RxStompRPCService } from '@stomp/ng2-stompjs';


export class MsgClient {
    time_out: number;
    durable: string;
    msg_queue: string;
    rxStompRPCService: RxStompRPCService;

    constructor(
        private rxStompService: RxStompService,
        config: { msgQueue: string, timeOut: number, durable: string }
    ) {
        this.rxStompRPCService = new RxStompRPCService(this.rxStompService);
        this.msg_queue = config.msgQueue;
        this.time_out = config.timeOut;
        this.durable = config.durable || "true";
    }

    rpc(route: string, ...args: any[]): Observable<any> {
        return this.rxStompRPCService.rpc({
            destination: '/queue/' + this.msg_queue,
            headers: {
                "route": route,
                "auto-delete": "true",
                "exclusive": "false",
                'durable': this.durable,
                "content-type": "text/plain",
            },
            body: JSON.stringify({ args: args })
        }).pipe(
            timeout(this.time_out),
            map((msg) => {
                let resp = JSON.parse(msg.body);
                if (resp.status_code == 200) {
                    return resp.payload;
                } else {
                    throw new Error(resp.payload);
                }
            })
        )
    }

    stream_timeout(route: string, time_out: number, ...args: any[]): any {
        let total_message = null;
        let current_message = 0;
        let resps = [];
        // let _time_out = time_out || this.time_out;
        // let stop$ = new Subject();
        return this.rxStompRPCService.stream({
            destination: '/queue/' + this.msg_queue,
            headers: {
                "route": route,
                "auto-delete": "true",
                'durable': this.durable,
                "exclusive": "false",
                "content-type": "text/plain",
            },
            body: JSON.stringify({ args: args })
        }).pipe(
            timeout(time_out),
            map((msg) => {
                resps.push(msg);

                let resp = JSON.parse(msg.body);

                if (![200, 201].includes(resp.status_code)) {
                    throw new Error(resp.payload);
                }

                if (resp.status_code == 201) {
                    current_message++;
                } else if (resp.status_code == 200) {
                    total_message = resp.payload.total_message;
                    // console.log("total_message", total_message, current_message);
                }
                // if (current_message === total_message) {
                //     setTimeout(() => stop$.next(), 0);
                // }
                return resp;
            }),
            takeWhile(() => {
                // console.log('current_message', current_message, total_message);
                return current_message !== total_message;
            }, true),
            filter((resp) => {
                return resp.status_code == 201;
            }),
            map((resp) => {
                return resp.payload;
            }),
            finalize(() => {
                // console.log(resps);
                // console.log("final_total_message", total_message, current_message);
            })
        )
    }

    stream(route: string, ...args: any[]): any {
        return this.stream_timeout(route, this.time_out, ...args);
    }

    call(route: string, ...args: any[]): Observable<any> {
        let reply_to: string = uuid();
        this.rxStompService.publish({
            destination: '/queue/' + this.msg_queue,
            headers: {
                "reply-to": reply_to,
                "route": route,
                "auto-delete": "true",
                'durable': "true",
                "content-type": "text/plain",
            },
            body: JSON.stringify({ args: args }),
        })

        let replyWatch$ = this.rxStompService
            .watch('/queue/' + reply_to, { 'auto-delete': 'true' })
            .pipe(
                timeout(this.time_out),
                take(1),
                finalize(() => {
                    response$.complete();
                    replyWatch$.unsubscribe();
                })
            ).subscribe({
                next: (response) => {
                    // console.log(response);
                    try {
                        let resp = JSON.parse(response.body);
                        if (resp['status_code'] == 200) {
                            response$.next(resp.payload);
                        } else {
                            let error = new Error(resp.payload);
                            response$.error(error);
                        }
                    } catch (error) {
                        response$.error(error);
                    }
                },
                error: (error) => {
                    // console.log(error);
                    response$.error(error);
                },
            });

        let response$ = new Subject<string>();

        return response$
    }

    // basically the same as subscription, but receive multiple chunk
    signal_subsscribe(exchange: string, route: string): Subject<any> {
        function concatenateMsg(messages: any[]) {
            messages.sort((x: any, y: any) => x.order - y.order);
            return messages.reduce<string>(
                (a: string, b: any) => {
                    return a + b.payload;
                }, '');
        }

        let Response = {};
        let watch$ = this.rxStompService
            .watch(`/exchange/${exchange}/${route}`)
            .pipe(
                finalize(() => {
                    watch$.unsubscribe();
                })
            ).subscribe({
                next: (response) => {
                    try {
                        let corr_id = response.headers["correlation-id"];
                        let resp = JSON.parse(response.body);
                        if (resp['status_code'] == 200) {
                            if (!(corr_id in Response)) {
                                Response[corr_id] = [];
                            }
                            Response[corr_id].push(resp);
                            if (Response[corr_id].length == resp.total_size) {
                                // subscription$.next(resp.payload);
                                let msg = concatenateMsg(Response[corr_id]);
                                delete Response[corr_id];
                                let result = JSON.parse(msg);
                                subscription$.next(result);
                            }
                        } else {
                            let error = new Error(resp.payload);
                            subscription$.error(error);
                        }
                    } catch (error) {
                        subscription$.error(error);
                    }
                },
                error: (error) => {
                    subscription$.error(error);
                },
            });
        let subscription$ = new Subject<any>();
        return subscription$;
    }

    subscription(exchange: string, route: string, headers?: any): Subject<any> {
        let watch$ = this.rxStompService
            .watch(
                `/exchange/${exchange}/${route}`,
                headers,
            )
            .pipe(
                finalize(() => {
                    watch$.unsubscribe();
                })
            ).subscribe({
                next: (response) => {
                    try {
                        let resp = JSON.parse(response.body);
                        if (resp['status_code'] == 200) {
                            subscription$.next(resp.payload);
                        } else {
                            let error = new Error(resp.payload);
                            subscription$.error(error);
                        }
                    } catch (error) {
                        subscription$.error(error);
                    }
                },
                error: (error) => {
                    subscription$.error(error);
                },
            });
        let subscription$ = new Subject<any>();
        return subscription$;
    }

    broadcast(exchange: string, route: string, msg: any): Promise<any> {
        return this.rxStompRPCService.rpc({
            destination: `/exchange/${exchange}/${route}`,
            headers: {
                "route": route,
                "auto-delete": "true",
                'durable': "true",
                "content-type": "text/plain",
            },
            body: JSON.stringify({ payload: msg, status_code: 200 }),
        }).toPromise();
    }

    topic_subscription(topic: string, route: string): Subject<any> {
        this.rxStompService
            .watch(
                `/topic/${topic}.${route}`
            ).subscribe({
                next: (response) => {
                    try {
                        let resp = JSON.parse(response.body);
                        if (resp['status_code'] == 200) {
                            subscription$.next(resp.payload);
                        } else {
                            let error = new Error(resp.payload);
                            subscription$.error(error);
                        }
                    } catch (error) {
                        subscription$.error(error);
                    }
                },
                error: (error) => {
                    subscription$.error(error);
                },
            });
        let subscription$ = new Subject<any>();
        return subscription$;
    }

    topic_broadcast(topic: string, route: string, msg: any): Promise<any> {
        return this.rxStompRPCService.rpc({
            destination: `/topic/${topic}.${route}`,
            headers: {
                "auto-delete": "true",
                'durable': "true",
                "content-type": "text/plain",
            },
            body: JSON.stringify({ payload: msg, status_code: 200 }),
        }).toPromise();
    }

    /*
    subscribe(exchange: string, route: string): Subject<any> {
        let watch$ = this.rxStompService
            .watch(`/exchange/${exchange}/${route}`)
            .pipe(
                finalize(() => {
                    watch$.unsubscribe();
                })
            ).subscribe({
                next: (response) => {
                    try {
                        let resp = JSON.parse(response.body);
                        if (resp['status_code'] == 200) {
                            subscription$.next(resp.payload);
                        } else {
                            let error = new Error(resp.payload);
                            subscription$.error(error);
                        }
                    } catch (error) {
                        subscription$.error(error);
                    }
                },
                error: (error) => {
                    subscription$.error(error);
                },
            });
        let subscription$ = new Subject<any>();
        return subscription$;
    }
    */
}
