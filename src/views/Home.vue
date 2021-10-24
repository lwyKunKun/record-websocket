<template>
  <div class="home">
    <div class="record">
      <input @click="start" type="button" value="录音" />
      <input @click="stop" type="button" value="停止" />
    </div>
    <div class="text-container">
      <transition name="slide" mode="out-in">
        <div :key="text.id">
          <p>{{ text.key }}</p>
          <p>{{ text.value }}</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { Recorder } from '@/assets/js/test.js'

export default {
  name: "Home",
  components: {
  },
  data () {
    return {
      number: 0,
      ws: null, //实现WebSocket 
      record: null, //多媒体对象，用来处理音频
      arr: [{}],
      timer: null,
    }
  },
  mounted () {
  },
  computed: {
    text () {
      if (this.arr.length !== this.number) {
        return {
          id: this.number,
          key: this.arr[this.number].src,
          value: this.arr[this.number].dst
        }
      } else {
        return {}
      }
    }
  },
  methods: {
    start () {//开始
      this.initAudio();
      this.startMove();

    },
    stop () {//结束
      if (this.ws) {
        this.ws.close();
        this.record.stop();
        console.log('关闭对讲以及WebSocket');
      }
    },
    initRecord (rec) {//初始化录音
      this.record = rec;
    },
    initAudio () {//判断浏览是否开启麦克风权限
      const that = this;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      if (!navigator.getUserMedia) {
        alert('浏览器不支持音频输入');
      } else {
        navigator.getUserMedia({
          audio: true,
        },
          function (mediaStream) {
            that.initRecord(new Recorder(mediaStream));
            console.log('开始对讲');
            that.useWebSocket();
          },
          function (error) {
            console.log(error);
            switch (error.message || error.name) {
              case 'PERMISSION_DENIED':
              case 'PermissionDeniedError':
                console.info('用户拒绝提供信息。');
                break;
              case 'NOT_SUPPORTED_ERROR':
              case 'NotSupportedError':
                console.info('浏览器不支持硬件设备。');
                break;
              case 'MANDATORY_UNSATISFIED_ERROR':
              case 'MandatoryUnsatisfiedError':
                console.info('无法发现指定的硬件设备。');
                break;
              default:
                console.info('无法打开麦克风。异常信息:' + (error.code || error.name));
                break;
            }
          }
        )
      }

    },
    useWebSocket () {//使用webscoket
      const that = this;
      this.ws = new WebSocket("ws://182.140.140.36:8085/aWebsocket/transcribe");
      this.ws.binaryType = 'arraybuffer'; //传输的是 ArrayBuffer 类型的数据
      this.ws.onopen = function () {
        console.log('握手成功');
        if (that.ws.readyState === 1) { //ws进入连接状态，则每隔500毫秒发送一包数据
          console.log('这里是连接状态');
          that.record.start();
        }
      };

      this.ws.onmessage = function (e) {
        let jsonData = JSON.parse(e.data)
        that.arr.push({ ...jsonData })
        console.log(that.arr, 'that.arr');



      }

      this.ws.onerror = function (err) {
        console.info(err)
      }


    },
    startMove () {
      this.timer = setTimeout(() => {
        if (this.number === this.arr.length - 1) {
          this.number = 0;
        } else {
          this.number += 1;
        }
      }, 1000); // 滚动不需要停顿则将2000改成动画持续时间

    },
    clearMove () {
      clearTimeout(this.timer)
    },








  },
  watch: {
    arr: {
      handler (val) {
        this.arr = val;
        this.startMove();
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.text-container {
  width: 100%;
  height: 100px;
  border: 1px solid #eee;
  color: #000;
  div {
    margin-top: 30px;
  }
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s linear;
}
.slide-leave-to {
  transform: translateY(-20px);
}
.slide-enter {
  transform: translateY(20px);
}
</style>
