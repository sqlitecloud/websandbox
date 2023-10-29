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
/******/ 	var __webpack_modules__ = ({

/***/ 35:
/***/ ((module) => {

module.exports = "/******/ (() => { // webpackBootstrap\n/******/ \t\"use strict\";\nvar __webpack_exports__ = {};\n\n// UNUSED EXPORTS: default\n\n;// CONCATENATED MODULE: ./lib/connection.ts\nconst TYPE_MESSAGE = 'message';\nconst TYPE_RESPONSE = 'response';\nconst TYPE_SET_INTERFACE = 'set-interface';\nconst TYPE_SERVICE_MESSAGE = 'service-message';\n// @ts-expect-error this is IE11 obsolete check. It is not typed\nconst isIE11 = !!window.MSInputMethodContext && !!document.documentMode;\nconst defaultOptions = {\n    //Will not affect IE11 because there sandboxed iframe has not 'null' origin\n    //but base URL of iframe's src\n    allowedSenderOrigin: undefined\n};\nclass Connection {\n    constructor(postMessage, registerOnMessageListener, options = {}) {\n        this.remote = {};\n        this.serviceMethods = {};\n        this.localApi = {};\n        this.callbacks = {};\n        this._resolveRemoteMethodsPromise = null;\n        this.options = Object.assign(Object.assign({}, defaultOptions), options);\n        //Random number between 0 and 100000\n        this.incrementalID = Math.floor(Math.random() * 100000);\n        this.postMessage = postMessage;\n        this.remoteMethodsWaitPromise = new Promise(resolve => {\n            this._resolveRemoteMethodsPromise = resolve;\n        });\n        registerOnMessageListener((e) => this.onMessageListener(e));\n    }\n    /**\n       * Listens to remote messages. Calls local method if it is called outside or call stored callback if it is response.\n       * @param e - onMessage event\n       */\n    onMessageListener(e) {\n        const data = e.data;\n        const { allowedSenderOrigin } = this.options;\n        if (allowedSenderOrigin && e.origin !== allowedSenderOrigin && !isIE11) {\n            return;\n        }\n        if (data.type === TYPE_RESPONSE) {\n            this.popCallback(data.callId, data.success, data.result);\n        }\n        else if (data.type === TYPE_MESSAGE) {\n            this\n                .callLocalApi(data.methodName, data.arguments)\n                .then(res => this.responseOtherSide(data.callId, res))\n                .catch(err => this.responseOtherSide(data.callId, err, false));\n        }\n        else if (data.type === TYPE_SET_INTERFACE) {\n            this.setInterface(data.apiMethods);\n            this.responseOtherSide(data.callId);\n        }\n        else if (data.type === TYPE_SERVICE_MESSAGE) {\n            this\n                .callLocalServiceMethod(data.methodName, data.arguments)\n                .then(res => this.responseOtherSide(data.callId, res))\n                .catch(err => this.responseOtherSide(data.callId, err, false));\n        }\n    }\n    postMessageToOtherSide(dataToPost) {\n        this.postMessage(dataToPost, '*');\n    }\n    /**\n       * Sets remote interface methods\n       * @param remote - hash with keys of remote API methods. Values is ignored\n       */\n    setInterface(remoteMethods) {\n        var _a;\n        this.remote = {};\n        remoteMethods.forEach((key) => this.remote[key] = this.createMethodWrapper(key));\n        (_a = this._resolveRemoteMethodsPromise) === null || _a === void 0 ? void 0 : _a.call(this);\n    }\n    setLocalApi(api) {\n        return new Promise((resolve, reject) => {\n            const id = this.registerCallback(resolve, reject);\n            this.postMessageToOtherSide({\n                callId: id,\n                apiMethods: Object.keys(api),\n                type: TYPE_SET_INTERFACE\n            });\n        }).then(() => this.localApi = api);\n    }\n    setServiceMethods(api) {\n        this.serviceMethods = api;\n    }\n    /**\n       * Calls local method\n       * @param methodName\n       * @param args\n       * @returns {Promise.<*>|string}\n       */\n    callLocalApi(methodName, args) {\n        return Promise.resolve(this.localApi[methodName](...args));\n    }\n    /**\n       * Calls local method registered as \"service method\"\n       * @param methodName\n       * @param args\n       * @returns {Promise.<*>}\n       */\n    callLocalServiceMethod(methodName, args) {\n        if (!this.serviceMethods[methodName]) {\n            throw new Error(`Serivce method ${methodName} is not registered`);\n        }\n        return Promise.resolve(this.serviceMethods[methodName](...args));\n    }\n    /**\n       * Wraps remote method with callback storing code\n       * @param methodName - method to wrap\n       * @returns {Function} - function to call as remote API interface\n       */\n    createMethodWrapper(methodName) {\n        return (...args) => {\n            return this.callRemoteMethod(methodName, ...args);\n        };\n    }\n    /**\n       * Calls other side with arguments provided\n       * @param id\n       * @param methodName\n       * @param args\n       */\n    callRemoteMethod(methodName, ...args) {\n        return new Promise((resolve, reject) => {\n            const id = this.registerCallback(resolve, reject);\n            this.postMessageToOtherSide({\n                callId: id,\n                methodName: methodName,\n                type: TYPE_MESSAGE,\n                arguments: args\n            });\n        });\n    }\n    /**\n       * Calls remote service method\n       * @param methodName\n       * @param args\n       * @returns {*}\n       */\n    callRemoteServiceMethod(methodName, ...args) {\n        return new Promise((resolve, reject) => {\n            const id = this.registerCallback(resolve, reject);\n            this.postMessageToOtherSide({\n                callId: id,\n                methodName: methodName,\n                type: TYPE_SERVICE_MESSAGE,\n                arguments: args\n            });\n        });\n    }\n    /**\n       * Respond to remote call\n       * @param id - remote call ID\n       * @param result - result to pass to calling function\n       */\n    responseOtherSide(id, result, success = true) {\n        if (result instanceof Error) {\n            // Error could be non-serializable, so we copy properties manually\n            result = [...Object.keys(result), 'message'].reduce((acc, it) => {\n                acc[it] = result[it];\n                return acc;\n            }, {});\n        }\n        const doPost = () => this.postMessage({\n            callId: id,\n            type: TYPE_RESPONSE,\n            success,\n            result\n        }, '*');\n        try {\n            doPost();\n        }\n        catch (err) {\n            console.error('Failed to post response, recovering...', err); // eslint-disable-line no-console\n            if (err instanceof DOMException) {\n                result = JSON.parse(JSON.stringify(result));\n                doPost();\n            }\n        }\n    }\n    /*\n       * Stores callbacks to call later when remote call will be answered\n       */\n    registerCallback(successCallback, failureCallback) {\n        const id = (++this.incrementalID).toString();\n        this.callbacks[id] = { successCallback, failureCallback };\n        return id;\n    }\n    /**\n       * Calls and delete stored callback\n       * @param id - call id\n       * @param success - was call successful\n       * @param result - result of remote call\n       */\n    popCallback(id, success, result) {\n        if (success) {\n            this.callbacks[id].successCallback(result);\n        }\n        else {\n            this.callbacks[id].failureCallback(result);\n        }\n        delete this.callbacks[id];\n    }\n}\n/* harmony default export */ const connection = (Connection);\n\n;// CONCATENATED MODULE: ./node_modules/ts-loader/index.js??ruleSet[1].rules[0]!./lib/frame.ts\n\nclass Frame {\n    constructor() {\n        this.connection = new connection(window.parent.postMessage.bind(window.parent), listener => {\n            window.addEventListener('message', listener);\n        });\n        this.connection.setServiceMethods({\n            runCode: (code) => this.runCode(code),\n            importScript: (path) => this.importScript(path),\n            injectStyle: (style) => this.injectStyle(style),\n            importStyle: (path) => this.importStyle(path)\n        });\n        this.connection.callRemoteServiceMethod('iframeInitialized');\n    }\n    /**\n       * Creates script tag with passed code and attaches it. Runs synchronous\n       * @param code\n       */\n    runCode(code) {\n        const scriptTag = document.createElement('script');\n        scriptTag.innerHTML = code;\n        document.getElementsByTagName('head')[0].appendChild(scriptTag);\n    }\n    importScript(scriptUrl) {\n        const scriptTag = document.createElement('script');\n        scriptTag.src = scriptUrl;\n        document.getElementsByTagName('head')[0].appendChild(scriptTag);\n        return new Promise(resolve => scriptTag.onload = () => resolve());\n    }\n    injectStyle(style) {\n        const styleTag = document.createElement('style');\n        styleTag.innerHTML = style;\n        document.getElementsByTagName('head')[0].appendChild(styleTag);\n    }\n    importStyle(styleUrl) {\n        const linkTag = document.createElement('link');\n        linkTag.rel = 'stylesheet';\n        linkTag.href = styleUrl;\n        document.getElementsByTagName('head')[0].appendChild(linkTag);\n    }\n}\nconst Websandbox = new Frame();\n// @ts-expect-error we explicitly export library to global namespace because\n// Webpack won't do it for us when this file is loaded via code-loader\nwindow.Websandbox = Websandbox;\n/* harmony default export */ const ts_loader_ruleSet_1_rules_0_lib_frame = ((/* unused pure expression or super */ null && (Websandbox)));\n\n/******/ })()\n;\n//# sourceMappingURL=compile-loader-file-name.js.map"

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  BaseOptions: () => (/* binding */ BaseOptions),
  "default": () => (/* binding */ websandbox)
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

// EXTERNAL MODULE: ./node_modules/compile-code-loader/index.js!./lib/frame.ts
var index_js_lib_frame = __webpack_require__(35);
var frame_default = /*#__PURE__*/__webpack_require__.n(index_js_lib_frame);
;// CONCATENATED MODULE: ./lib/websandbox.ts

// @ts-expect-error loader-based input

const BaseOptions = {
    frameContainer: 'body',
    frameClassName: 'websandbox__frame',
    frameSrc: null,
    frameContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body></body>
</html>
  `,
    codeToRunBeforeInit: null,
    initialStyles: null,
    baseUrl: null,
    allowPointerLock: false,
    allowFullScreen: false,
    sandboxAdditionalAttributes: ''
};
class Websandbox {
    /**
     * Creates sandbox instancea
     * @param localApi Api of this side. Will be available for sandboxed code as remoteApi
     * @param options Options of created sandbox
     */
    static create(localApi, options = {}) {
        return new Websandbox(localApi, options);
    }
    /**
     * {Constructor}
     * @param localApi
     * @param options
     */
    constructor(localApi, options) {
        this.connection = null;
        this.removeMessageListener = () => { };
        this.validateOptions(options);
        this.options = Object.assign(Object.assign({}, BaseOptions), options);
        this.iframe = this.createIframe();
        this.promise = new Promise(resolve => {
            this.connection = new connection(this.iframe.contentWindow.postMessage.bind(this.iframe.contentWindow), listener => {
                const sourceCheckListener = (event) => {
                    if (event.source !== this.iframe.contentWindow) {
                        return;
                    }
                    return listener(event);
                };
                window.addEventListener('message', sourceCheckListener);
                this.removeMessageListener = () => window.removeEventListener('message', sourceCheckListener);
            }, { allowedSenderOrigin: 'null' });
            this.connection.setServiceMethods({
                iframeInitialized: () => {
                    return this.connection
                        .setLocalApi(localApi)
                        .then(() => resolve(this));
                }
            });
        });
    }
    validateOptions(options) {
        var _a;
        if (options.frameSrc && (options.frameContent || options.initialStyles || options.baseUrl || options.codeToRunBeforeInit)) {
            throw new Error('You can not set both "frameSrc" and any of frameContent,initialStyles,baseUrl,codeToRunBeforeInit options');
        }
        if ('frameContent' in options && !((_a = options.frameContent) === null || _a === void 0 ? void 0 : _a.includes('<head>'))) {
            throw new Error('Websandbox: iFrame content must have "<head>" tag.');
        }
    }
    _prepareFrameContent(options) {
        var _a, _b;
        let frameContent = (_b = (_a = options.frameContent) === null || _a === void 0 ? void 0 : _a.replace('<head>', `<head>\n<script>${(frame_default())}</script>`)) !== null && _b !== void 0 ? _b : '';
        if (options.initialStyles) {
            frameContent = frameContent
                .replace('</head>', `<style>${options.initialStyles}</style>\n</head>`);
        }
        if (options.baseUrl) {
            frameContent = frameContent
                .replace('<head>', `<head>\n<base href="${options.baseUrl}"/>`);
        }
        if (options.codeToRunBeforeInit) {
            frameContent = frameContent
                .replace('</head>', `<script>${options.codeToRunBeforeInit}</script>\n</head>`);
        }
        return frameContent;
    }
    createIframe() {
        var _a;
        const containerSelector = this.options.frameContainer;
        const container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;
        if (!container) {
            throw new Error('Websandbox: Cannot find container for sandbox ' + container);
        }
        const frame = document.createElement('iframe');
        // @ts-expect-error typings error
        frame.sandbox = `allow-scripts ${this.options.sandboxAdditionalAttributes}`;
        frame.allow = `${this.options.allowAdditionalAttributes}`;
        frame.className = (_a = this.options.frameClassName) !== null && _a !== void 0 ? _a : '';
        if (this.options.allowFullScreen) {
            frame.allowFullscreen = true;
        }
        if (this.options.frameSrc) {
            frame.src = this.options.frameSrc;
            container.appendChild(frame);
            return frame;
        }
        frame.setAttribute('srcdoc', this._prepareFrameContent(this.options));
        container.appendChild(frame);
        return frame;
    }
    destroy() {
        this.iframe.remove();
        this.removeMessageListener();
    }
    _runCode(code) {
        return this.connection.callRemoteServiceMethod('runCode', code);
    }
    _runFunction(fn) {
        return this._runCode(`(${fn.toString()})()`);
    }
    run(codeOrFunction) {
        if (codeOrFunction.name) {
            return this._runFunction(codeOrFunction);
        }
        return this._runCode(codeOrFunction);
    }
    importScript(path) {
        return this.connection.callRemoteServiceMethod('importScript', path);
    }
    injectStyle(style) {
        return this.connection.callRemoteServiceMethod('injectStyle', style);
    }
}
/* harmony default export */ const websandbox = (Websandbox);

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=websandbox.js.map