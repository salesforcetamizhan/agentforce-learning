public with sharing class ApexCodeEnhancerController {

    @AuraEnabled
    public static String enhanceApexCode(String apexCode) {

        if (String.isBlank(apexCode)) {
            throw new AuraHandledException(
                'Please provide an Apex class to enhance.'
            );
        }

        if (apexCode.length() > 100000) {
            throw new AuraHandledException(
                'The Apex class is too large. Please provide a smaller class.'
            );
        }

        try {

            /*
             * Create Prompt Builder input
             */
            ConnectApi.WrappedValue apexCodeValue =
                new ConnectApi.WrappedValue();

            apexCodeValue.value = apexCode;

            Map<String, ConnectApi.WrappedValue> inputParams =
                new Map<String, ConnectApi.WrappedValue>();

            inputParams.put(
                'Input:apexCode',
                apexCodeValue
            );

            /*
             * Configure Prompt Builder invocation
             */
            ConnectApi.EinsteinPromptTemplateGenerationsInput templateInput =
                new ConnectApi.EinsteinPromptTemplateGenerationsInput();

            templateInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
            templateInput.additionalConfig.applicationName = 'PromptBuilderPreview';
            templateInput.isPreview = false;
            templateInput.inputParams = inputParams;

            /*
             * Invoke Prompt Builder
             */
            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation output =
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    'Apex_Code_Enhancer',
                    templateInput
                );

            if (output == null ||
                output.generations == null ||
                output.generations.isEmpty()) {

                throw new AuraHandledException(
                    'No response was returned from the Apex Code Enhancer.'
                );
            }

            return output.generations[0].text;

        } catch (Exception e) {

            throw new AuraHandledException(
                'Unable to enhance Apex code: ' + e.getMessage()
            );
        }
    }
}