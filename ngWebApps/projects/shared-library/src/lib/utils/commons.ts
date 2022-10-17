export async function waitUntil(condition: any, time_out: number): Promise<any> {
    let start_time = (new Date()).getTime();
    while (!condition()) {
        await (new Promise(resolve => setTimeout(resolve, 100)));
        // console.log('wait retry');
        if (((new Date()).getTime() - start_time) > time_out) {
            condition();
            throw new Error("time out");
            // error(new Error('time out'));
        }
    }
}


export function errMsg(error: any): string {
    if (typeof (error) == 'string') {
        return error || "unknown error";
    }
    if (error.error) {
        return errMsg(error.error)
    } else {
        return error.message || "unknown error";
    }
}


export function groupby<T, GroupT extends { groupName: string, children: (T | GroupT)[] }>(
    securities: (T | GroupT)[], groupBy: string[],
    GroupCls: { new(groupname: string): GroupT }
): GroupT[] {

    let res = new Map<string, (T | GroupT)[]>();

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
        let gSec = new GroupCls(key);
        if (groupBy.length == 0) {
            gSec.children = securities;
        } else {
            gSec.children = this.groupby(securities, groupBy);
        }
        res2.push(gSec);
    }

    return res2;
}
