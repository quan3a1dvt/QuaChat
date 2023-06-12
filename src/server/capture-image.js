const ffmpeg = require('ffmpeg');

function captureImageFromVideo(videoFilePath, outputFilePath) {
  try {

    const process = new ffmpeg(videoFilePath);

    process.then((video) => {
      video.fnExtractFrameToJPG(outputFilePath, {
        number: 1,
        file_name: outputFilePath
      }, (error, files) => {
        if (!error) {
          console.log(`Image captured and saved to ${outputFilePath}`);
        } else {
          console.error('Error capturing image:', error);
        }
      });
    }).catch((error) => {
      console.error('Error processing video:', error);
    });
  } catch (error) {
    console.error('Error creating ffmpeg process:', error);
  }
  
}
module.exports = {
  captureImageFromVideo
};