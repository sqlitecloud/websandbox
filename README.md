# Websandbox [![Build Status](https://github.com/jetbrains/websandbox/actions/workflows/github-actions.yml/badge.svg)](https://github.com/jetbrains/websandbox/actions/workflows/github-actions.yml) ![JetBrains Official](https://camo.githubusercontent.com/b044da88664180ea9ad36112161507223610b3bd229f10a67e47145edf94a8f5/68747470733a2f2f6a622e67672f6261646765732f6f6666696369616c2d706c61737469632e737667)

Websandbox library provides a way to execute unsafe js code inside HTML5 sandbox - iframe with sandbox attribute.
It is usable to host user provided widgets and similar cases.

Working example: [http://jetbrains.github.io/websandbox](http://jetbrains.github.io/websandbox).

## Simple usage (see [examples folder](examples) to more information): 

```js
import Sandbox from 'websandbox';

Sandbox.create({}).promise
    .then(function(sandbox) {
        sandbox.run('console.log("Hello from sandbox!")');
    });
```

## Function run (will be stringified and called inside sandbox)

Function **should** has "name" property to be able to run.

```js
import Sandbox from 'websandbox';

var localApi = {
    testApiFn: function (message) {
        console.log('Host function called from iframe with: ' + message);
    }
};

Sandbox.create(localApi).promise
    .then(function(sandbox) {
        sandbox.run(function functionName() {
            Websandbox.connection.remote.testApiFn("some argument");
        });
    });
```

## Communication with sandboxed code
```js
import Sandbox from 'websandbox';

var localApi = {
    testApiFn: function (message) {
        console.log('Host function called from iframe with: ' + message);
    }
};

const sandbox = Sandbox.create(localApi, {frameContainer: '.iframe__container', frameClassName: 'simple__iframe'});
sandbox.promise
    .then(() => {
        console.log('Sandbox is created. Trying to run code inside');

        return sandbox.run(`
            console.info("Sandboxed code initialized successfully");
            var title = document.createElement('h3');
            title.innerHTML = "Content is generated from the sandbox";
            document.body.appendChild(title);
            Websandbox.connection.remote.testApiFn("some argument");

            Websandbox.connection.setLocalApi({
                sandboxedMethod: function(message) {
                    console.info('sandboxedMethod called successfully:', message);
                    return 'this is sandboxedMethod result';
                }
            });
        `);
    })
    .then(() => console.log('Code has been ran'))
    .then(() => {
        console.log('Calling sandboxedMethod...');
        return sandbox.connection.remote.sandboxedMethod('hello from host');
    })
    .then(res => console.log('Call was successful:', res));
```

## Import styles

```js
import Sandbox from 'websandbox';

Sandbox.create({}).promise
    .then(function(sandbox) {
        sandbox.injectStyle(`
            html, body {
                background-color: blue;
            }
        `);
    });
```
