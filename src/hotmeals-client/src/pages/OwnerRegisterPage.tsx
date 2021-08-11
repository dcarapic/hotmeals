import React, { Fragment } from "react";
import { withMessageContainer } from "../util/ui";
import AccountEditor from "../shared/AccountEditor";

const OwnerRegisterPage = withMessageContainer(() => {
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
