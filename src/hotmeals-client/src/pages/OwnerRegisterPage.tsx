import React, { Fragment } from "react";
import AccountEditor from "../shared/AccountEditor";
import * as api from "../util/api";
import * as ui from "../util/ui";

const OwnerRegisterPage = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Register as a new restaurant owner
            </h3>
            <AccountEditor isRegistration={true} isRestaurantOwner={true} />
        </Fragment>
    );
});
export default OwnerRegisterPage;
