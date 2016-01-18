import Connection from '../lib/connection';

describe('Connection', function () {
    const ID = 'foo-bar';

    beforeEach(function () {
        this.localApi = sinon.stub({
            testLocalMethod: () => {
            }
        });

        this.registerOnMessageListener = (listener) => {
            this.callMessageListener = listener;
        };
        this.postMessage = sinon.stub();
    });

    it('should init onnection', function () {
        let conn = new Connection(ID, this.postMessage, this.registerOnMessageListener);
        conn.should.be.defined;
    });

    it('Should do nothing if connection ID doesnt match', function () {
        let conn = new Connection(ID, this.postMessage, this.registerOnMessageListener);
        sinon.spy(conn, 'callLocalApi');

        this.callMessageListener({
            data: {
                connectionId: 'not-match',
                callId: 'fake-call-id',
                type: 'message',
                methodName: 'testLocalMethod',
                arguments: []
            }
        });
        conn.callLocalApi.should.not.have.been.called;
    });

    it('should call remote and wait for response', function (done) {
        let conn = new Connection(ID, this.postMessage, this.registerOnMessageListener);
        conn.setInterface({testMethod: null});

        conn.remote.testMethod('test', 123)
            .then(res => {
                res.should.eql({foo: 'bar'});
                done();
            });


        //Emulate response
        this.callMessageListener({
            data: {
                connectionId: ID,
                callId: this.postMessage.getCall(0).args[0].callId,
                type: 'response',
                success: true,
                result: {foo: 'bar'}
            }
        });
    });

    it('should call local API on remote call', function (done) {
        //First notify connection that localApi was registered on other side
        const conn = new Connection(ID, this.postMessage, this.registerOnMessageListener);
        sinon.stub(conn, 'registerCallback', (resolve) => resolve());

        conn.setLocalApi(this.localApi)
            .then(() => {

                this.callMessageListener({
                    data: {
                        connectionId: ID,
                        callId: 'fake-call-id',
                        type: 'message',
                        methodName: 'testLocalMethod',
                        arguments: [{foo: 'bar'}, 123]
                    }
                });
            })
            .then(() => {
                conn.localApi.testLocalMethod.should.have.been.calledWith({foo: 'bar'}, 123);
                done();
            });


    });

    it('should response to remote call', function (done) {
        const conn = new Connection(ID, this.postMessage, this.registerOnMessageListener);
        sinon.stub(conn, 'registerCallback', (resolve) => resolve());

        this.localApi.testLocalMethod.returns({fake: 'response'});

        conn.setLocalApi(this.localApi)
            .then(() => {
                this.callMessageListener({
                    data: {
                        connectionId: ID,
                        callId: 'fake-call-id',
                        type: 'message',
                        methodName: 'testLocalMethod',
                        arguments: []
                    }
                });
            })
            .then(() => {
                setTimeout(() => {
                    this.postMessage.should.have.been.calledWith({
                        connectionId: ID,
                        callId: "fake-call-id",
                        result: {fake: 'response'},
                        success: true,
                        type: "response"
                    }, '*');
                    done();
                }, 10);
            });
    });
});