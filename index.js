
// Express
const express = require('express');
const app = express();

//Random Number
const rn = require('random-number');

// FS extra
var fs = require('fs-extra');

// Kew
var Q = require('kew');

// Fluent FFMpeg
var ffmpeg = require('fluent-ffmpeg');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// ???
var framesArray = [];


// Start listening on port 3000
app.listen(3000, () => {
    console.log('server ready')
});

// GET THREE RANDOM INDEXES
const getRandomIndexes = (numberOfIndexes, maxIndex) => {
	randomIndexes = [];
	for(var i = 1; i <= numberOfIndexes; i++){
		var random;
		var wrong;
		do{
			wrong = false;
			var options = {
				min:  0,
				max:  maxIndex,
				integer: true
			}
			random = rn(options);
			// Check for already existing values
			for(var j in randomIndexes){
				if (random == randomIndexes[j]){
					wrong = true;
					break; // break for loop
				}
			}
		} while (wrong);
		randomIndexes.push(random);
	}
	return randomIndexes;
}

// CREATE THE ARRAY WITH ALL JSON FRAMES 
function getFrameArray(){
	return new Promise((resolve, reject) => {
		var framesArray = [];
		fs.readdir(__dirname + '/frames', (err, files)=> {
			if (err){
				console.log('can not read files: ' + err);
				reject(err);
			} else {
				for (var i in files) {
					var id = files[i].replace('.jpg','');
					var path = __dirname + '/frames' + '/' + files[i];
					if (files[i].startsWith('.')){
						continue;
					}
					framesArray.push({"id":id, "path": path});
				}
				resolve(framesArray);
			}
		});
	});
}

// GET ARRAY WITH 3 JSON ID + PATH
const getRandomFrames = (req,res) => {

	getFrameArray().then((allFrames) => {
		var maxIndex = allFrames.length;
		var randomIndexes = getRandomIndexes(3, maxIndex);
        console.log(randomIndexes);
		var randomFrames = [];
		for(var i = 0; i < randomIndexes.length; i++){
			randomFrames.push(allFrames[randomIndexes[i]]);
		}
		console.log(randomFrames);
		res.json(randomFrames);

	}).catch((error) => {
		console.log("errore"+ error);
	});

}

const generateVideo = (req,res) => {
    var command = ffmpeg();

    // Ci vorrebbe un loop che trova le variation e le aggiunge una ad una con addinput

    command
        .addInput('./frames/frame%03d.jpg')
        .inputFPS(8)
        .output('./vid/video.mp4')
        .outputFPS(8)
        .input('./mp3/horizons.mp3')
        .run();

    res.send();
}

app.get('/get-random-frames', getRandomFrames);
app.get('/generate-video', generateVideo);
//app.get('/save-variation', saveVariation);