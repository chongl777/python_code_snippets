import {
    trigger, state, style, transition, sequence,
    animate, group, query, stagger, keyframes
} from '@angular/animations';


export function SlideInOutAnimation() {
    return trigger('slideInOut', [
        state('*', style({
            'transform': 'translateY(0)',
        })),
        transition((fromState, toState) => {
            return (fromState != 'void') && (toState != 'void');
        }, [
            animate('0.4s', keyframes([
                style({
                    opacity: 0,
                    transform: 'translateY(-100%)',
                    offset: 0,
                }),
                style({
                    opacity: 0.5,
                    transform: 'translateY(0%)',
                    offset: 0.9
                })
            ]))
        ]),
    ])
}


export function BlinkAnimation() {
    return trigger('blink', [
        state('*', style({
            'opacity': '1',
        })),
        transition('* => *', [
            animate('0.5s ease-in', keyframes([
                style({ opacity: 0.0, offset: 0 }),
                style({ opacity: 0.5, offset: 0.5 })
            ]))
        ]),
    ])
}

export function ExpandedAnimation() {
    return trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition(
            'void => expanded', [
            style({ height: 0, opacity: 0 }),
            animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
        ]),
        transition('* => void', [
            animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                style({ height: "*" }),
                style({ height: 0 })
            ]))
        ]),
        transition('collapsed <=> expanded', [
            animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
        ]),
    ]);
}

export function ShowHideAnimation() {
    return trigger('showHide', [
        transition(
            'dynamic => void', [
            group([
                animate(
                    '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ height: "*", opacity: 1, background: "red" }),
                        style({ height: 0, opacity: 0, "line-height": "0px" })
                    ])),
                query(
                    '*',
                    animate(
                        '500ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                            style({ "font-size": "*", "height": "*", "line-height": "*" }),
                            style({ "font-size": "0px", "height": "0px", "line-height": "0px" })
                        ])),
                    { optional: true },
                )
            ])
        ]),
        transition(
            'void => dynamic', [
            // 'static => dynamic', [
            group([
                animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                    style({
                        height: "0px", opacity: 0, "font-size": "0px", "line-height": "0px",
                        // transform: "scale(1, 0)"
                    }),
                    style({
                        height: "*", opacity: 1, "line-height": "*",
                        // transform: "scale(1, 1)"
                    }),
                ])),
                query(
                    '*',
                    animate(
                        '500ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                            style({ "font-size": "0px", "height": "0px", "line-height": "0px" }),
                            style({ "font-size": "*", "height": "*", "line-height": "*" }),
                        ])),
                    { optional: true },
                )
            ])
        ]),
    ]);
}

export function ShowAnimation() {
    return trigger('showAni', [
        transition(
            ':enter', [
            animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                style({ opacity: 0 }),
                style({ opacity: 1 }),
            ]))
        ]),
    ]);
}

export function ExpandCollapseAnimation() {
    return trigger('ExpandCollapse', [
        state('collapse', style({
            height: 0, opacity: 0, "line-height": "0px", display: 'none',
        })),
        state('expand', style({
            height: "*", opacity: 1, "line-height": "*",
        })),
        transition(
            //'expand => collapse', [
            'expand => collapse', [
            group([
                animate(
                    '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ height: "*", opacity: 1, }),
                        style({ height: 0, opacity: 0, "line-height": "0px" })
                    ])),
                query(
                    '*',
                    animate(
                        '500ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                            style({ "font-size": "*", "height": "*", "line-height": "*" }),
                            style({ "font-size": "0px", "height": "0px", "line-height": "0px" })
                        ])),
                    { optional: true },
                )
            ])
        ]),
        transition(
            '* => expand', [
            // 'static => dynamic', [
            group([
                animate(
                    '500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                    keyframes([
                        style({ height: 0, opacity: 0, display: 'table-row' }),
                        style({ height: "*", opacity: 1, "line-height": "*", }),
                    ])),
                query(
                    '*',
                    animate(
                        '500ms cubic-bezier(0.4, 0.0, 0.2, 1)', keyframes([
                            style({ "font-size": "0px", "height": "0px", "line-height": "0px" }),
                            style({ "font-size": "*", "height": "*", "line-height": "*" }),
                        ])),
                    { optional: true },
                )
            ])
        ]),
    ]);
}

export function ECAnimation() {
    return trigger('ExpandCollapse', [
        transition(':enter', [
            style({ transform: 'translateX(100%)', opacity: 0 }),
            animate(
                '500ms',
                style({
                    transform: 'translateX(0)',
                    opacity: 1,
                    'overflow-x': 'hidden'
                })
            )
        ]),
        transition(':leave', [
            style({ transform: 'translateX(0)', opacity: 1 }),
            animate('500ms', style({ transform: 'translateX(100%)', opacity: 0 }))
        ])
    ]);
}
