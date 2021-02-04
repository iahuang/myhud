/* A version of ServerInterface designed to run the webapp as static-only (i.e.) no hosting server */

async function asyncConstant<T>(value: T): Promise<T> {
    return new Promise((resolve)=>{
        resolve(value);
    });
}

export default class HeadlessServerInterface  {
    async amILoggedIn() {
        return asyncConstant(true);
    }

    async nowPlaying() {
        return asyncConstant(null);
    }

    async nextHeadline() {
        return asyncConstant("...");
    }
}