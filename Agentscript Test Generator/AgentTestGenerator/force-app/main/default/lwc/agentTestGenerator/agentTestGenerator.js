import { LightningElement } from 'lwc';
import generateTestCases from '@salesforce/apex/AgentTestGeneratorController.generateTestCases';
import createCsvFile from '@salesforce/apex/AgentTestGeneratorController.createCsvFile';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    {
        label: 'Utterance',
        fieldName: 'utterance',
        wrapText: true
    },
    {
        label: 'Expected Subagent',
        fieldName: 'expectedSubagent',
        wrapText: true
    },
    {
        label: 'Expected Actions',
        fieldName: 'expectedActions',
        wrapText: true
    },
    {
        label: 'Expected Response',
        fieldName: 'expectedResponse',
        wrapText: true
    }
];

export default class AgentScriptTestGenerator extends LightningElement {

    agentScript = '';
    rows = [];
    columns = COLUMNS;
    isLoading = false;

    handleChange(event) {
        this.agentScript = event.target.value;
    }

    async generate() {

        if (!this.agentScript?.trim()) {
            return;
        }

        this.isLoading = true;

        try {

            const result = await generateTestCases({
                agentScript: this.agentScript
            });

            const cleanJson = result
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim();

            const data = JSON.parse(cleanJson);

            this.rows = data.map((item, index) => ({
                id: index + 1,
                utterance: item.utterance,
                expectedSubagent: item.expectedSubagent,
                expectedActions:
                    this.formatActions(item.expectedActions),
                expectedResponse: item.expectedResponse
            }));

        } catch (error) {

            console.error(error);

        } finally {
            this.isLoading = false;
        }
    }

    formatActions(actions) {

        if (!Array.isArray(actions)) {
            return actions || '';
        }

        return '[' +
            actions
                .map(action => `'${action}'`)
                .join(', ') +
            ']';
    }

   async downloadCsv() {

    try {

        if (!this.rows || this.rows.length === 0) {
            this.showToast(
                'No Data',
                'There are no test cases to download.',
                'warning'
            );
            return;
        }

        const headers = [
            'Utterance',
            'Expected Subagent',
            'Expected Actions',
            'Expected Response'
        ];

        const csvRows = [];

        // Header
        csvRows.push(
            headers
                .map(header => this.escapeCsv(header))
                .join(',')
        );

        // Data
        this.rows.forEach(row => {

            csvRows.push([
                row.utterance,
                row.expectedSubagent,
                row.expectedActions,
                row.expectedResponse
            ]
                .map(value => this.escapeCsv(value))
                .join(',')
            );

        });

        const csvContent = csvRows.join('\r\n');

        // Create Salesforce File
        const contentVersionId = await createCsvFile({
            csvContent: csvContent
        });

        // Salesforce File download URL
        const downloadUrl =
            '/sfc/servlet.shepherd/version/download/' +
            contentVersionId;

        window.open(downloadUrl, '_blank');

    } catch (error) {

        console.error(
            'CSV Download Error:',
            error
        );

        this.showToast(
            'Download Failed',
            this.getErrorMessage(error),
            'error'
        );
    }
}

    escapeCsv(value) {

    if (value === null || value === undefined) {
        return '""';
    }

    return '"' +
        String(value)
            .replace(/"/g, '""') +
        '"';
}

clearAll() {
    this.agentScript = '';
    this.rows = [];
    this.csvContent = '';

    // Reset textarea
    const textarea = this.template.querySelector(
        'textarea'
    );

    if (textarea) {
        textarea.value = '';
    }
}

getErrorMessage(error) {

    if (error?.body?.message) {
        return error.body.message;
    }

    if (error?.message) {
        return error.message;
    }

    return 'An unexpected error occurred.';
}

showToast(title, message, variant) {

    this.dispatchEvent(
        new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        })
    );
}

}