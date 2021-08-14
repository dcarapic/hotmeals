import React, { Fragment } from "react";
import * as ui from "../util/ui";
import { AccountEditor, AccountEditorType } from "../shared/AccountEditor";

const CustomerRegisterPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Register as a new customer</h3>
            <AccountEditor type={AccountEditorType.CustomerRegistration} />
        </Fragment>
    );
});
export default CustomerRegisterPage;
