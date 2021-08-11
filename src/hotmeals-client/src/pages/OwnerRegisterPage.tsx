import React, { Fragment } from "react";
import { withAppErrorUI } from "../errorHandling";
import AccountEditor from "../shared/AccountEditor";

const OwnerRegisterPage = withAppErrorUI(() => {
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
