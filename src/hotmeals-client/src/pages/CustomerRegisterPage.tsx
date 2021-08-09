import React, { Fragment } from "react";
import { withAppErrorUI } from "../errorHandling";
import AccountEditor from "../shared/AccountEditor";

const RegisterCustomerPage = withAppErrorUI(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Register as a new customer
            </h3>
            <AccountEditor isRegistration={true} isRestaurantOwner={false} />
        </Fragment>
    );
});
export default RegisterCustomerPage;
