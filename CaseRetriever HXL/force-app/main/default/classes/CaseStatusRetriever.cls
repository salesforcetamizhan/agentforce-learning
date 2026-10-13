global without sharing class CaseStatusRetriever {

    global class CaseInfo {
        @InvocableVariable(
            label='Case Number'
            description='The Salesforce Case number'
        )
        global String caseNumber;

        @InvocableVariable(
            label='Subject'
            description='The subject of the Case'
        )
        global String subject;

        @InvocableVariable(
            label='Status'
            description='Current status of the Case'
        )
        global String status;

        @InvocableVariable(
            label='Priority'
            description='Priority of the Case'
        )
        global String priority;
    }

    @InvocableMethod(
        label='Retrieve Cases by Status'
        description='Retrieve Salesforce Cases based on their status, such as New, Working, or Closed.'
    )
    global static List<CaseInfo> getCasesByStatus(
        List<String> caseStatuses
    ) {
        List<CaseInfo> results = new List<CaseInfo>();

        if (caseStatuses == null || caseStatuses.isEmpty()
            || String.isBlank(caseStatuses[0])) {
            return results;
        }

        List<Case> cases = [
            SELECT CaseNumber, Subject, Status, Priority
            FROM Case
            WHERE Status = :caseStatuses[0]
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 100
        ];

        for (Case c : cases) {
            CaseInfo result = new CaseInfo();
            result.caseNumber = c.CaseNumber;
            result.subject = c.Subject;
            result.status = c.Status;
            result.priority = c.Priority;

            results.add(result);
        }

        return results;
    }
}