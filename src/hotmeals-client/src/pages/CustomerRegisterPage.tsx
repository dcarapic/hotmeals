import React, { Fragment } from "react";
import * as ui from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const CustomerRegisterPage = ui.withAlertMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Register as a new customer
            </h3>
            <AccountEditor isRegistration={true} isRestaurantOwner={false} />
        </Fragment>
    );
});
export default CustomerRegisterPage;
