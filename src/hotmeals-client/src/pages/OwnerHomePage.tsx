import React, { Fragment } from "react";
import * as ui from "../util/ui";
import { Col } from "react-bootstrap";
import routes from "../routes";
import { RouterNavButton } from "../shared/RouterNav";

const OwnerHomePage = ui.withMessageContainer(() => {

    return (
        <Fragment>
            <h3 className="text-center p-2">Please select what you would like to do</h3>
            <Col className="d-grid">
                <RouterNavButton to={routes.ownerRestaurants} className="mb-3">Manage your restaurants</RouterNavButton>
                <RouterNavButton to={routes.ownerOrders} className="mb-3">Manage your orders</RouterNavButton>
                <RouterNavButton to={routes.ownerBlockedUsers} className="mb-3">Manage blocked customers</RouterNavButton>
            </Col>
        </Fragment>
    );
});
export default OwnerHomePage;
