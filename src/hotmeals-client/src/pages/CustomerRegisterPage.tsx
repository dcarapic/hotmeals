import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const CustomerRegisterPage = ui.withMessageContainer(() => {
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
