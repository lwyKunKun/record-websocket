import Recorder from "./recorder";
export default class Record {
    constructor(config) {
        this.config = config;
    }
    startRecord(param) {
        let self = this;
        try {
            Recorder.get((rec) => {
                self.recorder = rec;
                self.recorder.start();
                param.success("record successfully!");
            }, this.config);
        } catch (e) {
            param.error("record failed!" + e);
        }
    }
    getBlob(param) {
        let self = this;
        try {
            let blobData = self.recorder.getBlob();
            param.success(blobData);
        } catch (e) {
            param.error("获取语音文件 failed!" + e);
        }
    }
    stopRecord(param) {
        let self = this;
        try {
            self.recorder.stop();
            param.success("record stop");
        } catch (e) {
            param.error("record stop failed!" + e);
        }
    }
    play(audio) {
        console.log("start play record now.");
        let self = this;
        try {
            self.recorder.play(audio);
            console.log("play successfully.");
        } catch (e) {
            console.log("play record failed!" + e);
        }
    }
    clear(param) {
        let self = this;
        try {
            self.recorder.clear();
            param.success("record clear");
        } catch (e) {
            param.error("record clear failed!" + e);
        }
    }
}