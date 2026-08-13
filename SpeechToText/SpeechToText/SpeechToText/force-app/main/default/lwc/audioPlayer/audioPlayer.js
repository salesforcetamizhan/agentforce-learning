import { LightningElement, api } from 'lwc';

export default class AudioPlayer extends LightningElement {

    // Flow Inputs
    @api contentVersionId;
    @api downloadUrl;

    // Optional
    @api mimeType = 'audio/webm';

    get audioUrl() {
        if (this.downloadUrl) {
            return this.downloadUrl;
        }

        if (this.contentVersionId) {
            return `/sfc/servlet.shepherd/version/download/${this.contentVersionId}`;
        }

        return null;
    }
}