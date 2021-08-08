import React, { Fragment } from "react";
import AccountEditor from "../shared/AccountEditor";

const CustomerAccountPage = () => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Account settings
            </h3>
            <AccountEditor />
        </Fragment>
    );
};
export default CustomerAccountPage;
