import React, { Fragment } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const OwnerAccountPage = ui.withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Account settings
            </h3>
            <AccountEditor isRegistration={false} isRestaurantOwner={true} />
        </Fragment>
    );
});
export default OwnerAccountPage;
