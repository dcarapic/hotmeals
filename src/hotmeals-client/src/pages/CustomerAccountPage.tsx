import React, { Fragment } from "react";
import * as ui from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const CustomerAccountPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Account settings
            </h3>
            <AccountEditor isRegistration={false} isRestaurantOwner={false} />
        </Fragment>
    );
});
export default CustomerAccountPage;
