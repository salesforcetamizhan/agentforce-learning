import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveFile from '@salesforce/apex/FileUploadController.saveFile';

export default class AudioRecorder extends LightningElement {
    @track audioURL = '';
    @track isRecording = false;
    @track error = '';
    @track base64Audio = '';

    @api recordId;
    @api contentVersionId;


    mediaRecorder;
    stream;
    chunks = [];

    handleMicClick() {
        if (this.isRecording) {
            this.stopRecording();
        } else if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            this.startRecording();
        }
    }
   get recordButtonClass() {
    return this.isRecording
        ? 'record-btn recording'
        : 'record-btn';
}

get recordTitle() {
    return this.isRecording
        ? 'Stop Recording'
        : 'Start Recording';
}

get disableSaveButton() {
    return this.isRecording || !this.base64Audio;
}

    startRecording() {
        this.error = '';

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                this.stream = stream;

                this.mediaRecorder = new MediaRecorder(stream);
                this.chunks = [];

                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        this.chunks.push(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.chunks, {
                        type: 'audio/webm'
                    });

                    // Release previous URL if it exists
                    if (this.audioURL) {
                        URL.revokeObjectURL(this.audioURL);
                    }

                    this.audioURL = URL.createObjectURL(blob);

                    const reader = new FileReader();

                    reader.onload = () => {
                        this.base64Audio = reader.result.split(',')[1];
                    };

                    reader.onerror = () => {
                        this.error = 'Unable to process recorded audio.';
                    };

                    reader.readAsDataURL(blob);
                };

                this.mediaRecorder.start();
                this.isRecording = true;
            })
            .catch((error) => {
                console.error(error);

                this.error = 'Unable to access microphone. Please allow microphone permission.';
                this.isRecording = false;
            });
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.isRecording = false;
    }

    saveAudio() {
        if (!this.base64Audio) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No Recording',
                    message: 'Please record audio before saving.',
                    variant: 'warning'
                })
            );
            return;
        }

        saveFile({
            base64Data: this.base64Audio,
            fileName: `Recording-${Date.now()}.webm`,
            recId: this.recordId
        })
            .then((contentVersionId) => {

                this.contentVersionId = contentVersionId;
                console.log(' this.contentVersionId   '+contentVersionId)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Audio file saved successfully!',
                        variant: 'success'
                    })
                );

                // Reset component after successful save
                this.base64Audio = '';
                this.chunks = [];

                if (this.audioURL) {
                    URL.revokeObjectURL(this.audioURL);
                }

                this.audioURL = '';
            })
            .catch((error) => {
                console.error(error);

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to save audio file.',
                        variant: 'error'
                    })
                );
            });
    }

    disconnectedCallback() {
        // Clean up microphone if component is removed
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
        }
    }
}