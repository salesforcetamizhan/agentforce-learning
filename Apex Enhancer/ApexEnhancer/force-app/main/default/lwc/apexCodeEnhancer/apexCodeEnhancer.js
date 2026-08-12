import { LightningElement } from 'lwc';
import enhanceApexCode from '@salesforce/apex/ApexCodeEnhancerController.enhanceApexCode';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ApexCodeEnhancer extends LightningElement {

    apexCode = '';

    enhancedCode = '';

    summary = '';

    changes = [];

    issues = [];

    originalLines = [];

    enhancedLines = [];

    isLoading = false;

    get hasResult() {
        return !!this.enhancedCode;
    }

    get hasChanges() {
        return this.changes && this.changes.length > 0;
    }

    get hasIssues() {
        return this.issues && this.issues.length > 0;
    }

    handleCodeChange(event) {
        this.apexCode = event.target.value;
    }

    async handleEnhance() {

        if (!this.apexCode || !this.apexCode.trim()) {

            this.showToast(
                'Missing Apex Code',
                'Please paste an Apex class first.',
                'warning'
            );

            return;
        }

        this.isLoading = true;

        try {

            const response = await enhanceApexCode({
                apexCode: this.apexCode
            });

            this.processResponse(response);

            this.showToast(
                'Success',
                'Apex code enhanced successfully.',
                'success'
            );

        } catch (error) {

            let message = 'Unable to enhance Apex code.';

            if (error?.body?.message) {
                message = error.body.message;
            }

            this.showToast(
                'Error',
                message,
                'error'
            );

        } finally {

            this.isLoading = false;
        }
    }

    processResponse(response) {

        let result;

        try {

            /*
             * Prompt Builder should return JSON.
             *
             * Some responses can contain markdown fences,
             * so remove them defensively.
             */

            let cleaned = response
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();

            result = JSON.parse(cleaned);

        } catch (error) {

            /*
             * Fallback if the model returns plain code.
             */

            result = {
                enhancedCode: response,
                summary: 'The Apex code was enhanced.',
                changes: [],
                issues: []
            };
        }

        this.enhancedCode =
            result.enhancedCode || '';

        this.summary =
            result.summary || '';

        this.changes =
            (result.changes || []).map(
                (change, index) => ({
                    id: index,
                    category: change.category || 'General',
                    description: change.description || ''
                })
            );

        this.issues =
            (result.issues || []).map(
                (issue, index) => ({
                    id: index,
                    text:
                        typeof issue === 'string'
                            ? issue
                            : issue.description || ''
                })
            );

        /*
         * Generate visual diff.
         */

        this.generateDiff();
    }

    generateDiff() {

        const original =
            this.apexCode.split('\n');

        const enhanced =
            this.enhancedCode.split('\n');

        const max =
            Math.max(
                original.length,
                enhanced.length
            );

        const originalLines = [];
        const enhancedLines = [];

        for (let i = 0; i < max; i++) {

            const originalText =
                original[i];

            const enhancedText =
                enhanced[i];

            if (originalText === enhancedText) {

                originalLines.push({
                    id: `o-${i}`,
                    lineNumber: i + 1,
                    text: originalText || '',
                    cssClass: 'code-line unchanged'
                });

                enhancedLines.push({
                    id: `e-${i}`,
                    lineNumber: i + 1,
                    text: enhancedText || '',
                    cssClass: 'code-line unchanged'
                });

            } else {

                if (originalText !== undefined) {

                    originalLines.push({
                        id: `o-${i}`,
                        lineNumber: i + 1,
                        text: originalText,
                        cssClass: 'code-line removed'
                    });

                } else {

                    originalLines.push({
                        id: `o-${i}`,
                        lineNumber: '',
                        text: '',
                        cssClass: 'code-line empty'
                    });
                }

                if (enhancedText !== undefined) {

                    enhancedLines.push({
                        id: `e-${i}`,
                        lineNumber: i + 1,
                        text: enhancedText,
                        cssClass: 'code-line added'
                    });

                } else {

                    enhancedLines.push({
                        id: `e-${i}`,
                        lineNumber: '',
                        text: '',
                        cssClass: 'code-line empty'
                    });
                }
            }
        }

        this.originalLines = originalLines;
        this.enhancedLines = enhancedLines;
    }

    async handleCopy() {

        try {

            await navigator.clipboard.writeText(
                this.enhancedCode
            );

            this.showToast(
                'Copied',
                'Enhanced Apex code copied to clipboard.',
                'success'
            );

        } catch (error) {

            this.showToast(
                'Copy Failed',
                'Unable to copy the code.',
                'error'
            );
        }
    }

    handleClear() {

        this.apexCode = '';
        this.enhancedCode = '';
        this.summary = '';
        this.changes = [];
        this.issues = [];
        this.originalLines = [];
        this.enhancedLines = [];
    }

    showToast(title, message, variant) {

        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}