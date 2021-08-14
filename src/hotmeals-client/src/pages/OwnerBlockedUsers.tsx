import React, { Fragment, useEffect, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Loading from "../shared/Loading";
import BlockedUserUnblocker from "../shared/BlockedUserUnblocker";

const BlockedUserList = (props: { blockedUsers: model.BlockedUserDTO[]; onDelete?: (email: string) => void }) => {
    return (
        <Fragment>
            {props.blockedUsers.map((mi, i) => {
                return (
                    <Fragment key={mi.email}>
                        {i > 0 && <hr />}
                        <BlockedUserListItem blockedUser={mi} onDelete={props.onDelete} />
                    </Fragment>
                );
            })}
        </Fragment>
    );
};
const BlockedUserListItem = (props: { blockedUser: model.BlockedUserDTO; onDelete?: (email: string) => void }) => {
    return (
        <Row className="d-grid">
            <Col>{props.blockedUser.email}</Col>
            <Col>
                <i>
                    {props.blockedUser.addressCityZip} {props.blockedUser.addressCity}<br/>
                    {props.blockedUser.addressStreet}
                </i>
            </Col>
            <Col>
                <Button
                    size="sm"
                    className="me-1 mb-1"
                    variant="warning"
                    onClick={() => props.onDelete && props.onDelete(props.blockedUser.email)}>
                    Unblock user
                </Button>
            </Col>
        </Row>
    );
};

const OwnerBlockedUsers = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();
    const abort = ui.useAbortable();

    const [loading, setLoading] = useState(true);
    const [blockedUsers, setBlockedUsers] = useState<model.BlockedUserDTO[]>([]);
    const [userToUnblock, setUserToUnblock] = useState<model.BlockedUserDTO | null>(null);

    const loadBlockedUsers = async () => {
        msgs.clearMessage();
        setLoading(true);
        let response = await api.blockedUsersFetchAll(abort);
        if (response.isAborted) return;
        setLoading(false);
        msgs.setMessageFromResponse(response);
        if (response.ok && response.result) {
            console.log(JSON.stringify(response.result.blockedUsers));
            setBlockedUsers(response.result.blockedUsers);
        } else {
            setLoading(false);
            setBlockedUsers([]);
        }
    };

    useEffect(() => {
        loadBlockedUsers();
    }, []);

    const deleteBlockedUser = (email: string) => {
        let r = blockedUsers.find((x) => x.email === email);
        setUserToUnblock(r!);
    };

    const onUnblockCanceled = () => setUserToUnblock(null);
    const onUnblocked = () => {
        // Remove the menu item
        let copy = [...blockedUsers];
        copy.splice(copy.indexOf(userToUnblock!), 1);
        // Clear deleted menu item, this will hide the dialog
        setUserToUnblock(null);
        setBlockedUsers(copy);
    };

    return (
        <Fragment>
            <h3 className="text-center p-2">Your blocked users</h3>
            {loading && (
                <Row className="justify-content-center">
                    <Col xs="3">
                        <Loading showLabel />
                    </Col>
                </Row>
            )}
            {!loading && (
                <Fragment>
                    <BlockedUserList blockedUsers={blockedUsers} onDelete={deleteBlockedUser} />
                    <Alert show={blockedUsers.length === 0} variant="primary">
                        🎂 Congratulations 🎂. You have not blocked any users!
                    </Alert>
                </Fragment>
            )}
            {userToUnblock && (
                <BlockedUserUnblocker blockedUser={userToUnblock} onCancel={onUnblockCanceled} onUnblocked={onUnblocked} />
            )}
        </Fragment>
    );
});
export default OwnerBlockedUsers;
