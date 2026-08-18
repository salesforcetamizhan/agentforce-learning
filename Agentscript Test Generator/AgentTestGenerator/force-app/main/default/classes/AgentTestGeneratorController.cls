public with sharing class AgentTestGeneratorController {

    @AuraEnabled
    public static String generateTestCases(String agentScript) {

        if (String.isBlank(agentScript)) {
            throw new AuraHandledException(
                'Please paste the Agent Script before generating test cases.'
            );
        }

        ConnectApi.WrappedValue scriptValue =
            new ConnectApi.WrappedValue();

        scriptValue.value = agentScript;

        Map<String, ConnectApi.WrappedValue> inputParams =
            new Map<String, ConnectApi.WrappedValue>{
                'Input:AgentScript' => scriptValue
            };

        ConnectApi.EinsteinPromptTemplateGenerationsInput input =
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();

        input.additionalConfig =
            new ConnectApi.EinsteinLlmAdditionalConfigInput();

        input.additionalConfig.applicationName =
            'PromptBuilderPreview';

        input.isPreview = false;
        input.inputParams = inputParams;

        try {

            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation output =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    'AgentScript_TestGenerator_CSV',
                    input
                );

            if (output == null ||
                output.generations == null ||
                output.generations.isEmpty()) {

                throw new AuraHandledException(
                    'No test cases were generated.'
                );
            }

            return output.generations[0].text;

        } catch (ConnectApi.ConnectApiException ex) {

            throw new AuraHandledException(
                'Prompt Template execution failed: ' +
                ex.getMessage()
            );

        } catch (Exception ex) {

            throw new AuraHandledException(
                'Unable to generate test cases: ' +
                ex.getMessage()
            );
        }
    }
    
@AuraEnabled
    public static Id createCsvFile(String csvContent) {

        if (String.isBlank(csvContent)) {
            throw new AuraHandledException(
                'CSV content is empty.'
            );
        }

        try {

            ContentVersion file = new ContentVersion();

            file.Title =
                'Agentforce_Testing_Center_Test_Cases_' +
                Datetime.now().format('yyyyMMdd_HHmmss');

            file.PathOnClient =
                'Agentforce_Testing_Center_Test_Cases.csv';

            file.VersionData = Blob.valueOf(csvContent);

            file.ContentLocation = 'S';

            insert file;

            return file.Id;

        } catch (Exception ex) {

            throw new AuraHandledException(
                'Unable to create CSV file: ' +
                ex.getMessage()
            );
        }
    }
}