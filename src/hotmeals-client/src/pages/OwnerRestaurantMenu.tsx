import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useAppErrorUI, withAppErrorUI } from "../util/errorHandling";

const OwnerRestaurantMenu = withAppErrorUI(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Restaurant menu</h3>
            <Col className="d-grid">
                Restaurant menu
            </Col>
        </Fragment>
    );
});
export default OwnerRestaurantMenu;
