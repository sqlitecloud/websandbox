(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Websandbox"] = factory();
	else
		root["Websandbox"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ lib_frame)
});

;// CONCATENATED MODULE: ./lib/connection.ts
const TYPE_MESSAGE = 'message';
const TYPE_RESPONSE = 'response';
const TYPE_SET_INTERFACE = 'set-interface';
const TYPE_SERVICE_MESSAGE = 'service-message';
// @ts-expect-error this is IE11 obsolete check. It is not typed
const isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
const defaultOptions = {
    //Will not affect IE11 because there sandboxed iframe has not 'null' origin
    //but base URL of iframe's src
    allowedSenderOrigin: undefined
};
class Connection {
    constructor(postMessage, registerOnMessageListener, options = {}) {
        this.remote = {};
        this.serviceMethods = {};
        this.localApi = {};
        this.callbacks = {};
        this._resolveRemoteMethodsPromise = null;
        this.options = Object.assign(Object.assign({}, defaultOptions), options);
        //Random number between 0 and 100000
        this.incrementalID = Math.floor(Math.random() * 100000);
        this.postMessage = postMessage;
        this.remoteMethodsWaitPromise = new Promise(resolve => {
            this._resolveRemoteMethodsPromise = resolve;
        });
        registerOnMessageListener((e) => this.onMessageListener(e));
    }
    /**
       * Listens to remote messages. Calls local method if it is called outside or call stored callback if it is response.
       * @param e - onMessage event
       */
    onMessageListener(e) {
        const data = e.data;
        const { allowedSenderOrigin } = this.options;
        if (allowedSenderOrigin && e.origin !== allowedSenderOrigin && !isIE11) {
            return;
        }
        if (data.type === TYPE_RESPONSE) {
            this.popCallback(data.callId, data.success, data.result);
        }
        else if (data.type === TYPE_MESSAGE) {
            this
                .callLocalApi(data.methodName, data.arguments)
                .then(res => this.responseOtherSide(data.callId, res))
                .catch(err => this.responseOtherSide(data.callId, err, false));
        }
        else if (data.type === TYPE_SET_INTERFACE) {
            this.setInterface(data.apiMethods);
            this.responseOtherSide(data.callId);
        }
        else if (data.type === TYPE_SERVICE_MESSAGE) {
            this
                .callLocalServiceMethod(data.methodName, data.arguments)
                .then(res => this.responseOtherSide(data.callId, res))
                .catch(err => this.responseOtherSide(data.callId, err, false));
        }
    }
    postMessageToOtherSide(dataToPost) {
        this.postMessage(dataToPost, '*');
    }
    /**
       * Sets remote interface methods
       * @param remote - hash with keys of remote API methods. Values is ignored
       */
    setInterface(remoteMethods) {
        var _a;
        this.remote = {};
        remoteMethods.forEach((key) => this.remote[key] = this.createMethodWrapper(key));
        (_a = this._resolveRemoteMethodsPromise) === null || _a === void 0 ? void 0 : _a.call(this);
    }
    setLocalApi(api) {
        return new Promise((resolve, reject) => {
            const id = this.registerCallback(resolve, reject);
            this.postMessageToOtherSide({
                callId: id,
                apiMethods: Object.keys(api),
                type: TYPE_SET_INTERFACE
            });
        }).then(() => this.localApi = api);
    }
    setServiceMethods(api) {
        this.serviceMethods = api;
    }
    /**
       * Calls local method
       * @param methodName
       * @param args
       * @returns {Promise.<*>|string}
       */
    callLocalApi(methodName, args) {
        return Promise.resolve(this.localApi[methodName](...args));
    }
    /**
       * Calls local method registered as "service method"
       * @param methodName
       * @param args
       * @returns {Promise.<*>}
       */
    callLocalServiceMethod(methodName, args) {
        if (!this.serviceMethods[methodName]) {
            throw new Error(`Serivce method ${methodName} is not registered`);
        }
        return Promise.resolve(this.serviceMethods[methodName](...args));
    }
    /**
       * Wraps remote method with callback storing code
       * @param methodName - method to wrap
       * @returns {Function} - function to call as remote API interface
       */
    createMethodWrapper(methodName) {
        return (...args) => {
            return this.callRemoteMethod(methodName, ...args);
        };
    }
    /**
       * Calls other side with arguments provided
       * @param id
       * @param methodName
       * @param args
       */
    callRemoteMethod(methodName, ...args) {
        return new Promise((resolve, reject) => {
            const id = this.registerCallback(resolve, reject);
            this.postMessageToOtherSide({
                callId: id,
                methodName: methodName,
                type: TYPE_MESSAGE,
                arguments: args
            });
        });
    }
    /**
       * Calls remote service method
       * @param methodName
       * @param args
       * @returns {*}
       */
    callRemoteServiceMethod(methodName, ...args) {
        return new Promise((resolve, reject) => {
            const id = this.registerCallback(resolve, reject);
            this.postMessageToOtherSide({
                callId: id,
                methodName: methodName,
                type: TYPE_SERVICE_MESSAGE,
                arguments: args
            });
        });
    }
    /**
       * Respond to remote call
       * @param id - remote call ID
       * @param result - result to pass to calling function
       */
    responseOtherSide(id, result, success = true) {
        if (result instanceof Error) {
            // Error could be non-serializable, so we copy properties manually
            result = [...Object.keys(result), 'message'].reduce((acc, it) => {
                acc[it] = result[it];
                return acc;
            }, {});
        }
        const doPost = () => this.postMessage({
            callId: id,
            type: TYPE_RESPONSE,
            success,
            result
        }, '*');
        try {
            doPost();
        }
        catch (err) {
            console.error('Failed to post response, recovering...', err); // eslint-disable-line no-console
            if (err instanceof DOMException) {
                result = JSON.parse(JSON.stringify(result));
                doPost();
            }
        }
    }
    /*
       * Stores callbacks to call later when remote call will be answered
       */
    registerCallback(successCallback, failureCallback) {
        const id = (++this.incrementalID).toString();
        this.callbacks[id] = { successCallback, failureCallback };
        return id;
    }
    /**
       * Calls and delete stored callback
       * @param id - call id
       * @param success - was call successful
       * @param result - result of remote call
       */
    popCallback(id, success, result) {
        if (success) {
            this.callbacks[id].successCallback(result);
        }
        else {
            this.callbacks[id].failureCallback(result);
        }
        delete this.callbacks[id];
    }
}
/* harmony default export */ const connection = (Connection);

;// CONCATENATED MODULE: ./lib/frame.ts

class Frame {
    constructor() {
        this.connection = new connection(window.parent.postMessage.bind(window.parent), listener => {
            window.addEventListener('message', listener);
        });
        this.connection.setServiceMethods({
            runCode: (code) => this.runCode(code),
            importScript: (path) => this.importScript(path),
            injectStyle: (style) => this.injectStyle(style),
            importStyle: (path) => this.importStyle(path)
        });
        this.connection.callRemoteServiceMethod('iframeInitialized');
    }
    /**
       * Creates script tag with passed code and attaches it. Runs synchronous
       * @param code
       */
    runCode(code) {
        const scriptTag = document.createElement('script');
        scriptTag.innerHTML = code;
        document.getElementsByTagName('head')[0].appendChild(scriptTag);
    }
    importScript(scriptUrl) {
        const scriptTag = document.createElement('script');
        scriptTag.src = scriptUrl;
        document.getElementsByTagName('head')[0].appendChild(scriptTag);
        return new Promise(resolve => scriptTag.onload = () => resolve());
    }
    injectStyle(style) {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = style;
        document.getElementsByTagName('head')[0].appendChild(styleTag);
    }
    importStyle(styleUrl) {
        const linkTag = document.createElement('link');
        linkTag.rel = 'stylesheet';
        linkTag.href = styleUrl;
        document.getElementsByTagName('head')[0].appendChild(linkTag);
    }
}
const Websandbox = new Frame();
// @ts-expect-error we explicitly export library to global namespace because
// Webpack won't do it for us when this file is loaded via code-loader
window.Websandbox = Websandbox;
/* harmony default export */ const lib_frame = (Websandbox);

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=frame.js.map