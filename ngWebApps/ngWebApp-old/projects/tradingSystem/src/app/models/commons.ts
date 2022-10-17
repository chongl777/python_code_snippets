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
    if (error.error) {
        return errMsg(error.error)
    } else {
        return error.message;
    }
}
