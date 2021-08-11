import React, { Fragment } from "react";
import { withMessageContainer } from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const OwnerAccountPage = withMessageContainer(() => {
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
