
// Express
const express = require('express');
const app = express();

//Random Number
const rn = require('random-number');

// FS extra
var fs = require('fs-extra');

// FS Copy File Sync
const copyFileSync = require('fs-copy-file-sync');

// Fluent FFMpeg
var ffmpeg = require('fluent-ffmpeg');
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

// UUID
const uuidv4 = require('uuid/v4');

var numOfFrames = 224;

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


    for(let frame = 0; frame <= (numOfFrames-1); frame++) {

        let paddedId = ''+frame;
        while( paddedId.length < 3) {
            paddedId = '0'+paddedId;
        }

        let variationsFrameDir = __dirname +'/variations/'+ paddedId +'/';
        let folderFiles = [];

        fs.readdirSync(variationsFrameDir).forEach(file => {
            if ( !file.startsWith('.') ) {
                folderFiles.push(file);
            }
        });

        var randFile = folderFiles[Math.floor( Math.random() * folderFiles.length )];
        copyFileSync(variationsFrameDir + randFile, __dirname +'/selected-variations/frame'+ paddedId +'.jpg')
    }

    var command = ffmpeg();

    command
        .addInput('./selected-variations/frame%03d.jpg')
        .inputFPS(8)
        .output('./vid/video.mp4')
        .outputFPS(8)
        .input('./mp3/horizons.mp3')
        .run();

    res.send();
    
}

// RECEIVE IMAGE AS STRING AND SAVE IT AS FILE
const saveVariation = (req,res) => {
    
    var idFrame = req.query.frame; // ID of the source frame
    var img = req.query.image; // Base 64 encoded variation
    var randName = uuidv4(); // random file name
    var fileName = __dirname + '/variations/'+ idFrame +'/'+ randName +'.jpg';
    
    var data = img.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFile(fileName, buf, function(err){
		if (err) throw err;
		res.send(fileName);
    });
}


app.get('/get-random-frames', getRandomFrames);
app.get('/generate-video', generateVideo);
app.get('/save-variation', saveVariation);


/*
const createFakeVariations = (req,res) => {
    for(var i = 0; i <= 223; i++){

        let paddedId = ''+i;
        while( paddedId.length < 3) {
            paddedId = '0'+paddedId;
        }

        let src = __dirname +'/frames/frame'+ paddedId +'.jpg';
        let destDir = __dirname +'/variations/'+ paddedId +'/frame'+ paddedId +'.jpg';
        copyFileSync(src, destDir);
    }
    res.send();
}
app.get('/fakeit', createFakeVariations);
*/