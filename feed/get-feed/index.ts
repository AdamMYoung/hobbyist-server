import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { withAuth } from "../utils/authUtils";

const httpTrigger: AzureFunction = withAuth([], null, async function (context: Context, req: HttpRequest, token): Promise<void> {
    
    

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: "responseMessage"
    };

}};

export default httpTrigger;