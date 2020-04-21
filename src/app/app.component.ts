import { Component, OnInit } from '@angular/core';
import { ButtplugClient, ButtplugEmbeddedClientConnector, ButtplugClientDevice } from "buttplug";



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    config = {
       minLevel: 4,
       maxLevel: 20,
       minOnTime: 0,
       maxOnTime: 5 * 60,
       minOffTime: 0,
       maxOffTime: 25 * 60,
       minLevelTime: 1,
       maxLevelTime: 10,
       sound: '',
       skipProbability: 0
    }

    client: ButtplugClient;
    device: ButtplugClientDevice;

    ngOnInit() {
	this.connect();
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    async sleep(time: number) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    async clickFind(e) {
         console.log('clickButton');
         await this.client.StartScanning();
         console.log('started scanning');
    }

    async clickVibrate(e) {
        await this.vibrate(this.config.minLevel / 100);
    }

    async clickStop(e) {
         await this.stop();
    }

    async clickStart(e) {
         while (true) {
             await this.onPhase();
             await this.offPhase();
         }
    }

    async playSound() {
         if (this.config.sound) {
             let audio = new Audio(this.config.sound);
             audio.play();
             return new Promise((resolve) => audio.onended = resolve);
         }
    }

    async onPhase() {
        console.log('onPhase');
        await this.playSound();

        if (this.config.skipProbability > 0) {
            let nothing = this.getRandomInt(0, this.config.skipProbability);
            if (nothing == 0) {
                console.log('onPhase skipped');
                return;
            }
        }

        let onPhaseTime = this.getRandomInt(this.config.minOnTime, this.config.maxOnTime);
        console.log('onPhase Begin', onPhaseTime);
        let start = Date.now();
        while (start + onPhaseTime * 1000 > Date.now()) {
           let levelPhaseTime = this.getRandomInt(this.config.minLevelTime, this.config.maxLevelTime);
           let level = this.getRandomInt(this.config.minLevel, this.config.maxLevel);

           console.log('      level Begin', levelPhaseTime, level);
           await this.vibrate(level / 100);
           await this.sleep(levelPhaseTime * 1000);

           console.log('      level End', levelPhaseTime, level);
        }
        await this.stop();
        console.log('onPhase End', onPhaseTime);
    }

    async vibrate(level) {
        if (this.device) {
           await this.device.SendVibrateCmd(level);
        }
    }

    async stop() {
        if (this.device) {
           await this.device.SendStopDeviceCmd();
        }
    }

    async offPhase() {
        let waitTime = this.getRandomInt(this.config.minOffTime, this.config.maxOffTime);
        console.log('offPhase Begin', waitTime);
        await this.sleep(waitTime * 1000);
        console.log('offPhase End', waitTime);
    }

    async connect() {
        console.log('ngOnInit');
        this.client = new ButtplugClient("Client");
	console.log('ngOnInit - new ButtplugClient', this.client);

        await this.client.Connect(new ButtplugEmbeddedClientConnector());
	console.log('ngOnInit - connect', this.client, this.client.Connected);

        this.client.addListener("deviceadded", (device: ButtplugClientDevice) => {
           this.onDeviceAdded(device)
        });
    	this.client.addListener("deviceremoved", this.onDeviceRemoved);
    	this.client.addListener("scanningfinished", this.onScanningFinished);
        console.log('devices known on connect', this.client.Devices );
    }

    async onDeviceAdded(device: ButtplugClientDevice) {
        this.device = device;
        console.log('DeviceAdded', device, new Date() );

        await device.SendVibrateCmd(0.05);
        await this.sleep(1000);
        await device.SendStopDeviceCmd();
    }

    async onDeviceRemoved(device: ButtplugClientDevice) {
        console.log('DeviceRemoved', device, new Date() );
	this.device = null;
    }

    async onScanningFinished() {
        console.log('ScanningFinished');
    }
}
