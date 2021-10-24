function Recorder(stream) {
    const ws = new WebSocket("ws://182.140.140.35:8085/aWebsocket/transcribe");
    var sampleBits = 16; //输出采样数位 8, 16
    var sampleRate = 16000; //输出采样率
    var context = new AudioContext();
    var audioInput = context.createMediaStreamSource(stream);
    var recorder = context.createScriptProcessor(4096, 1, 1);
    var audioData = {
        size: 0, //录音文件长度
        buffer: [], //录音缓存
        inputSampleRate: 48000, //输入采样率
        inputSampleBits: 16, //输入采样数位 8, 16
        outputSampleRate: sampleRate, //输出采样数位
        oututSampleBits: sampleBits, //输出采样率
        clear: function() {
            this.buffer = [];
            this.size = 0;
        },
        input: function(data) {
            this.buffer.push(new Float32Array(data));
            this.size += data.length;
        },
        compress: function() {
            //合并压缩
            //合并
            var data = new Float32Array(this.size);
            var offset = 0;
            for (var i = 0; i < this.buffer.length; i++) {
                data.set(this.buffer[i], offset);
                offset += this.buffer[i].length;
            }
            //压缩
            var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
            var length = data.length / compression;
            var result = new Float32Array(length);
            var index = 0,
                j = 0;
            while (index < length) {
                result[index] = data[j];
                j += compression;
                index++;
            }
            return result;
        },
        //得到格式为pcm,采样率为16k,位深为16bit的音频文件
        encodePcm: function() {
            var sampleBits = 16;
            var inputSampleRate = 44100;
            var outputSampleRate = 16000;
            var bytes = this.compress(this.buffer, this.size, inputSampleRate, outputSampleRate);
            var dataLen = bytes.length * (sampleBits / 8);
            var buffer = new ArrayBuffer(dataLen); // For PCM , 浏览器无法播放pcm格式音频
            var data = new DataView(buffer);
            var offset = 0;
            data = this.reshapeData(sampleBits, offset, bytes, data);
            return new Blob([data], {
                type: "audio/pcm",
            });
        },
        //将音频信号转为16bit位深
        reshapeData: function(sampleBits, offset, bytes, data) {
            var s;
            for (var i = 0; i < bytes.length; i++, offset += sampleBits / 8) {
                s = Math.max(-1, Math.min(1, bytes[i]));
                data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            }
            return data;
        },
    };

    var sendData = function() {
        //对以获取的数据进行处理(分包)
        var reader = new FileReader();
        reader.onload = (e) => {
            var outbuffer = e.target.result;
            var arr = new Int8Array(outbuffer);
            if (arr.length > 0) {
                var tmparr = new Int8Array(1024);
                var j = 0;
                for (var i = 0; i < arr.byteLength; i++) {
                    tmparr[j++] = arr[i];
                    if ((i + 1) % 1024 == 0) {
                        ws.send(tmparr);
                        // console.log(tmparr);
                        if (arr.byteLength - i - 1 >= 1024) {
                            tmparr = new Int8Array(1024);
                        } else {
                            tmparr = new Int8Array(arr.byteLength - i - 1);
                        }
                        j = 0;
                    }
                    if (i + 1 == arr.byteLength && (i + 1) % 1024 != 0) {
                        ws.send(tmparr);
                        // console.log(tmparr);
                    }
                }
            }
        };
        reader.readAsArrayBuffer(audioData.encodePcm());
        audioData.clear(); //每次发送完成则清理掉旧数据
    };

    this.start = function() {
        audioInput.connect(recorder);
        recorder.connect(context.destination);
    };

    this.stop = function() {
        recorder.disconnect();
    };

    this.getBlob = function() {
        return audioData.encodePcm();
    };

    this.clear = function() {
        audioData.clear();
    };

    recorder.onaudioprocess = function(e) {
        //音频采集
        var inputBuffer = e.inputBuffer.getChannelData(0);
        audioData.input(inputBuffer);
        sendData();
    };
}
export { Recorder };