import React, { Fragment } from "react";
import {AccountEditor, AccountEditorType} from "../shared/AccountEditor";
import * as ui from "../util/ui";

const OwnerRegisterPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Register as a new restaurant owner
            </h3>
            <AccountEditor type={AccountEditorType.OwnerRegistration} />
        </Fragment>
    );
});
export default OwnerRegisterPage;
