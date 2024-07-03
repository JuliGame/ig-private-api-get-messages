import { promisify } from 'util';
import { writeFile, readFile, exists } from 'fs';
import {
   IgApiClientExt,
   IgApiClientFbns,
   withFbns,
} from "instagram_mqtt";

import {Cookie, CookieJar, MemoryCookieStore} from 'tough-cookie';

import {
    AccountRepositoryLoginResponseRootObject, DirectThreadFeedResponse,
    IgApiClient,
    IgLoginTwoFactorRequiredError,
    IgResponseError
} from "instagram-private-api";

// import Bluebird = require('bluebird');
// @ts-ignore
import Bluebird from 'bluebird';
import {AccountRepository} from "instagram-private-api/dist/repositories/account.repository";
import {DirectInboxFeedResponseThreadsItem} from "instagram-private-api/dist/responses";

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

const { IG_USERNAME = '', IG_PASSWORD = '' } = process.env;

(async () => {
    const ig: IgApiClientFbns = withFbns(new IgApiClient());
    ig.state.generateDevice(IG_USERNAME+"2");

    // this will set the auth and the cookies for instagram
    // await readState(ig);

    // const cookies: { [key: string]: string } = {"mid":"ZiwrawALAAFVPgeKIEi6OsVX_1Cc","csrftoken":"eKQBiipCky0Gayh7a3jR2t2mWxFI5baD","ds_user_id":"5436538838","wd":"648x991"}
    // for (const key in cookies) {
    //     const value: string = cookies[key] as string;
    //
    //     const cookie = new Cookie({
    //         key: key,
    //         value: value,
    //         domain: 'instagram.com', // Set domain if applicable
    //         path: '/', // Set path if applicable
    //         httpOnly: true, // Whether the cookie is HTTP only
    //         secure: true // Whether the cookie is secure (HTTPS only)
    //     });
    //
    //     ig.state.cookieStore.putCookie(cookie, (err) => {
    //         if (err) {
    //             console.error('Error adding cookie:', err);
    //         } else {
    //            console.log('Cookie added successfully');
    //         }
    //     });
    //
    //     // const cookieoptions : SetCookieOptions = {
    //     //     http: true,
    //     //     secure: true,
    //     //     now: new Date(),
    //     //     ignoreError: true
    //     // }
    //
    //     ig.state.cookieJar.setCookie(cookie, 'https://instagram.com');
    // }

    ig.state.authorization = "Bearer IGT:2:eyJkc191c2VyX2lkIjoiNTQzNjUzODgzOCIsInNlc3Npb25pZCI6IjU0MzY1Mzg4MzglM0FzbHQ2cGxZMWJQOWZ2QyUzQTI0JTNBQVlkcVJGNG9pcmliZHJUNkh1ckdwZXJZM19aR0NMU1gwRTNMS0ttZHpRIn0="

    console.log("headers", ig.request.getDefaultHeaders())

    console.log("_csrftoken", ig.state.cookieCsrfToken);
    console.log("uuid", ig.state.uuid);
    console.log("cookieUserId", ig.state.cookieUserId);



    // const [thread] = await ig.feed.directInbox().records();
    // console.log(thread);
    //
    // directThread(options: Pick<DirectInboxFeedResponseThreadsItem, 'thread_id' | 'oldest_cursor'>, seqId?: number): DirectThreadFeed;
    // const directThread = ig.feed.directThread({thread_id: thread.threadId, oldest_cursor: ""});
    // directThread.items().then((items) => {
    //     console.log("items", items);
    // });
    // console.log("thread", directThread);

    const { body } = await ig.request.send<DirectThreadFeedResponse>({
      url: `/api/v1/direct_v2/threads/340282366841710301244259381505871168428/`,
      qs: {
        visual_message_return_type: 'unseen',
        cursor: 0,
        direction: 'older',
        seq_id: 0,
        limit: 10,
      },
    });
    // console.log("headers", body.headers);
    console.log("body", body);
    // console.log("items", body.thread.items);

    // you received a notification
    ig.fbns.on('push', logEvent('push'));

    // the client received auth data
    // the listener has to be added before connecting
    ig.fbns.on('auth', async auth => {
       // logs the auth
       logEvent('auth')(auth);

       //saves the auth
       await saveState(ig);
    });

    // 'error' is emitted whenever the client experiences a fatal error
    ig.fbns.on('error', logEvent('error'));
    // 'warning' is emitted whenever the client errors but the connection isn't affected
    ig.fbns.on('warning', logEvent('warning'));

    // this sends the connect packet to the server and starts the connection
    // the promise will resolve once the client is fully connected (once /push/register/ is received)
    // await ig.fbns.connect();
    //
    // you can pass in an object with socks proxy options to use this proxy
    // await ig.fbns.connect({socksOptions: {host: '...', port: 12345, type: 4}});
})();

// @ts-ignore
async function saveState(ig: IgApiClientExt) {
   return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
}

// @ts-ignore
async function readState(ig: IgApiClientExt) {
   if (!(await existsAsync('state.json'))) return;
   await ig.importState(await readFileAsync('state.json', { encoding: 'utf8' }));
}

// @ts-ignore
async function loginToInstagram(ig: IgApiClientExt) {
   ig.request.end$.subscribe(() => saveState(ig));
   await ig.account.login(IG_USERNAME, IG_PASSWORD);
}

/**
 * A wrapper function to log to the console
 * @param name
 * @returns {(data) => void}
 */
// @ts-ignore
function logEvent(name: string) {
   return (data: any) => console.log(name, data);
}
