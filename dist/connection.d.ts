import type { API } from "./types";
export declare const TYPE_MESSAGE = "message";
export declare const TYPE_RESPONSE = "response";
export declare const TYPE_SET_INTERFACE = "set-interface";
export declare const TYPE_SERVICE_MESSAGE = "service-message";
export interface ConnectionOptions {
    allowedSenderOrigin?: string;
}
declare class Connection {
    incrementalID: number;
    options: ConnectionOptions;
    postMessage: typeof window.postMessage;
    remote: API;
    serviceMethods: API;
    localApi: API;
    callbacks: {
        [key: string]: {
            successCallback: Function;
            failureCallback: Function;
        };
    };
    remoteMethodsWaitPromise: Promise<void>;
    _resolveRemoteMethodsPromise: null | (() => void);
    constructor(postMessage: typeof window.postMessage, registerOnMessageListener: (listener: (e: MessageEvent) => void) => void, options?: ConnectionOptions);
    /**
       * Listens to remote messages. Calls local method if it is called outside or call stored callback if it is response.
       * @param e - onMessage event
       */
    onMessageListener(e: MessageEvent): void;
    postMessageToOtherSide(dataToPost: any): void;
    /**
       * Sets remote interface methods
       * @param remote - hash with keys of remote API methods. Values is ignored
       */
    setInterface(remoteMethods: API): void;
    setLocalApi(api: API): Promise<API>;
    setServiceMethods(api: API): void;
    /**
       * Calls local method
       * @param methodName
       * @param args
       * @returns {Promise.<*>|string}
       */
    callLocalApi(methodName: string, args: any[]): Promise<any>;
    /**
       * Calls local method registered as "service method"
       * @param methodName
       * @param args
       * @returns {Promise.<*>}
       */
    callLocalServiceMethod(methodName: string, args: any[]): Promise<any>;
    /**
       * Wraps remote method with callback storing code
       * @param methodName - method to wrap
       * @returns {Function} - function to call as remote API interface
       */
    createMethodWrapper(methodName: string): (...args: any[]) => Promise<unknown>;
    /**
       * Calls other side with arguments provided
       * @param id
       * @param methodName
       * @param args
       */
    callRemoteMethod(methodName: string, ...args: any[]): Promise<unknown>;
    /**
       * Calls remote service method
       * @param methodName
       * @param args
       * @returns {*}
       */
    callRemoteServiceMethod(methodName: string, ...args: any[]): Promise<unknown>;
    /**
       * Respond to remote call
       * @param id - remote call ID
       * @param result - result to pass to calling function
       */
    responseOtherSide(id: string, result?: any, success?: boolean): void;
    registerCallback(successCallback: Function, failureCallback: Function): string;
    /**
       * Calls and delete stored callback
       * @param id - call id
       * @param success - was call successful
       * @param result - result of remote call
       */
    popCallback(id: string, success: boolean, result: any): void;
}
export default Connection;
