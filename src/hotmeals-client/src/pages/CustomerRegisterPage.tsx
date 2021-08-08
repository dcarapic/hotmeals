import React, { Fragment } from "react";
import AccountEditor from "../shared/AccountEditor";

const RegisterCustomerPage = () => {
    return (
        <Fragment>
            <h3 className="text-center p-2">
               Register as a new customer
            </h3>
            <AccountEditor />
        </Fragment>
    );
};
export default RegisterCustomerPage;
