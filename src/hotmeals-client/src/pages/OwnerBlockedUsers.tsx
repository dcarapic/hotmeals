import React, { Fragment } from "react";
import { Col } from "react-bootstrap";
import { useMessageService, withMessageContainer } from "../util/ui";

const OwnerBlockedUsers = withMessageContainer(() => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Blocked users</h3>
            <Col className="d-grid">
                Blocked users
            </Col>
        </Fragment>
    );
});
export default OwnerBlockedUsers;
