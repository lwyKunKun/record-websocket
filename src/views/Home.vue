<template>
  <div class="home">
    <div class="record">
      <input @click="startBtn" type="button" value="录音" />
      <input @click="stopRecord" type="button" value="停止" />
      <input @click="play" type="button" value="播放" />
      <div class="record-play" v-show="isFinished">
        <h2>Current voice player is:</h2>
        <audio controls autoplay></audio>
      </div>
    </div>
  </div>
</template>

<script>

import Record from "@/assets/js/record-sdk.js";

const recorder = new Record({
  sampleRate: 16000,

});

export default {
  name: "Home",
  components: {
  },
  data () {
    return {
      isFinished: false,
      audio: "",
      recorder: recorder,
      timer: null,
      websock: null,

    }
  },
  methods: {
    startBtn () {//开始录音btn
      this.isFinished = false;
      this.initWebscoket();

    },
    startRecord () {
      this.recorder.startRecord({
        success: res => {
          console.log("开始录音成功.");
        },
        error: err => {
          console.log("开始录音失败.");
        }
      });

    },
    getBlob () {
      let blob
      this.recorder.getBlob({
        success: res => {
          console.log(res, 'res文件');
          blob = res;
        },
        error: err => {
          console.log(err, 'err');
        }
      });

      return blob

    },
    stopRecord () {
      this.isFinished = false;
      this.recorder.stopRecord({
        success: res => {
          console.log("停止录音成功.");
        },
        error: err => {
          console.log("停止录音失败.");
        }
      });
      clearInterval(this.timer)

    },
    play () {
      console.log("开始播放录音");
      this.isFinished = true;
      this.audio = document.querySelector("audio");
      this.recorder.play(this.audio);
    },
    clear () {
      this.recorder.clear({
        success: res => {
          console.log(res, '清除成功');
        },
        error: err => {
          console.log(err, '清除失败');
        }
      });

    },
    initWebscoket () {
      const ws = `ws://182.140.140.35:8085/Websocket/display`;
      this.websock = new WebSocket(ws)
      this.websock.binaryType = 'arraybuffer'; //传输的是 ArrayBuffer 类型的数据
      this.websock.onopen = this.websocketonopen();
      this.websock.onmessage = this.websocketonmessage;
      this.websock.onerror = this.websocketonerror;
      this.websock.onclose = this.websocketclose;
    },
    websocketonopen () {//连接建立之后执行send方法发送数据
      this.timer = setInterval(() => {
        if (this.websock.readyState === 1) {//ws进入连接状态，则每隔500毫秒发送一包数据
          this.startRecord();
          console.log("#######################send Blob start ##############################");
          this.getBlob()
          //   this.websock.send(this.getBlob());    //发送音频数据
          console.log("#######################send Blob end ##############################");
          this.clear();	//每次发送完成则清理掉旧数据
        }
      }, 4000);  //每隔4000ms发送一次，定时器

    },
    websocketonmessage (e) {//数据接收
      console.log(e, 'event');

    },
    websocketonerror () {//连接建立失败重连
      this.initWebSocket();
    },
    websocketclose (e) {  //断开连接
      console.log('断开连接', e);
    },

  }
};
</script>

<style lang="scss" scoped>
</style>
