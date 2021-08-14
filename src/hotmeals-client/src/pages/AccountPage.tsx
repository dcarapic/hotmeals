import React, { Fragment } from "react";
import * as ui from "../util/ui";
import {AccountEditor, AccountEditorType} from "../shared/AccountEditor";

const AccountPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Your settings
            </h3>
            <AccountEditor type={AccountEditorType.AccountSettings} />
        </Fragment>
    );
});
export default AccountPage;
