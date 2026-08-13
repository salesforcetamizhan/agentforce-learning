public with sharing class ParseAgentResponseAction {

    public class Request {
        @InvocableVariable(required=true)
        public String agentResponse;
    }

    public class Response {
        @InvocableVariable
        public String message;

        @InvocableVariable
        public String feedbackId;

        @InvocableVariable
        public Boolean isContentSafe;

        @InvocableVariable
        public String type;
    }

    // Wrapper classes matching the JSON structure
    public class AgentResponse {
        public String type;
        public InformValue value;
    }

    public class InformValue {
        public List<Object> result;
        public String feedbackId;
        public String message;
        public Boolean isContentSafe;
        public List<Object> citedReferences;
    }

    @InvocableMethod(label='Parse Agent Response')
    public static List<Response> parseResponse(List<Request> requests) {
        List<Response> responses = new List<Response>();

        for (Request req : requests) {
            Response res = new Response();

            if (String.isBlank(req.agentResponse)) {
                res.message = 'No response received.';
                responses.add(res);
                continue;
            }

            try {
                AgentResponse agentResponse =
                    (AgentResponse)JSON.deserialize(
                        req.agentResponse,
                        AgentResponse.class
                    );

                if (agentResponse != null) {
                    res.type = agentResponse.type;

                    if (agentResponse.value != null) {
                        res.message = agentResponse.value.message;
                        res.feedbackId = agentResponse.value.feedbackId;
                        res.isContentSafe = agentResponse.value.isContentSafe;
                    }
                }
            } catch (Exception ex) {
                res.message = 'Unable to parse agent response: ' + ex.getMessage();
            }

            responses.add(res);
        }

        return responses;
    }
}