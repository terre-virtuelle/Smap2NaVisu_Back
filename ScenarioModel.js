const fs = require('fs');

class ScenarioModel {
    constructor(datas) {
        for (var data of Object.entries(datas)) {
            this[data[0]] = data[1];
        }
    }

    getScenario() {
        return {origin: this.origin, date: this.date, bbox: this.bbox, questions: this.questions}
    }

    formatForRes(){
        this.questions = this.questions.map((question) => {
            if (question.responses){
                question.responses.Images = this.formatImagesForRes(question.responses.Images);
                question.responses.Videos = this.formatVideosForRes(question.responses.Videos);
            }
            return question;
        } )
    }

    formatImagesForRes(imagesArray){
        return  imagesArray.map(image => {
            const image_in_base64 = fs.readFileSync(image.path, 'base64');
            // we must get the extension of file
            const fileExt = image.path.split('.')[1]
            image.file = 'data:image/' + fileExt + ';base64,' + image_in_base64;
            delete image.path
            return image;
        })
    }

    formatVideosForRes(videosArray){
        return  videosArray.map(video => {
            const video_in_base64 = fs.readFileSync(video.path, 'base64');
            // we must get the extension of file
            const fileExt = video.path.split('.')[1]
            video.file = 'data:image/' + fileExt + ';base64,' + video_in_base64;
            delete video.path
            return video;
        })
    }

    save(fileName) {
        this.mainDirectoryName = 'data/scenarios/' + fileName;
        this.checkDirectory();
         this.saveQuestions();
        const jsonContent = JSON.stringify(this.getScenario());
        const fullPath = this.mainDirectoryName + '/' + fileName + '.json';
        fs.writeFileSync(fullPath, jsonContent, 'utf8');
    }

    checkDirectory() {
        if (!fs.existsSync(this.mainDirectoryName)) {
            fs.mkdirSync(this.mainDirectoryName, {recursive: true});
            fs.mkdirSync(this.mainDirectoryName + '/images');
            fs.mkdirSync(this.mainDirectoryName + '/videos');
        }
    }

    saveQuestions() {
            this.questions = this.questions.map((question) => {
                if (question.responses) {
                    question.responses.Images =  this.saveImages(question.responses.Images);
                    question.responses.Videos =  this.saveVideos(question.responses.Videos);
                }
                return question;
            } )
    }

    saveImages(imagesArray) {
        let imgIndex = 1;
        return imagesArray.map( (image) => {
            let base64Array = image.file.split(';base64,');
            const type = base64Array[0].split('data:image/')[1];
            const imageName = 'img' + imgIndex
            const path = this.mainDirectoryName + '/images/' + imageName + '.' + type;
            fs.writeFileSync(path, base64Array[1], {encoding: 'base64'});
            delete image.file;
            imgIndex++;
            return {path: path, ...image}
        });
    }

    saveVideos(VideosArray) {
        let videoIndex = 1;
        return  VideosArray.map((video) => {
            let base64Array = video.file.split(';base64,');
            const type = base64Array[0].split('data:video/')[1];
            const videoName = 'video' + videoIndex
            const path = this.mainDirectoryName + '/videos/' + videoName + '.' + type;
            fs.writeFileSync(path, base64Array[1], {encoding: 'base64'});
            delete video.file;
            videoIndex++;
            return {path: path, ...video}
        });
    }


}

module.exports = ScenarioModel
