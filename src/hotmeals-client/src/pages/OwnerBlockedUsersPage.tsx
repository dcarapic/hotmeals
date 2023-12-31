import React, { Fragment, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";
import { Alert, Button, Col, Row } from "react-bootstrap";
import Loading from "../shared/Loading";
import BlockedUserUpdater, { BlockedUserUpdateType } from "../shared/BlockedUserUpdater";
import { useAbortableLoad } from "../util/abortable";

const OwnerBlockedUsersPage = ui.withAlertMessageContainer(() => {
    const msgs = ui.useAlertMessageService();

    const [loading, setLoading] = useState(true);
    const [blockedUsers, setBlockedUsers] = useState<model.BlockedUserDTO[]>([]);
    const [userToUnblock, setUserToUnblock] = useState<model.BlockedUserDTO | null>(null);

    useAbortableLoad(
        async (signal) => {
            msgs.clearMessage();
            setLoading(true);
            let response = await api.blockedUsersFetchAll(signal);
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
        },
        [msgs]
    );

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
                <div className="w-50 mx-auto">
                    <Loading showLabel />
                </div>
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
                <BlockedUserUpdater
                    type={BlockedUserUpdateType.UnblockUser}
                    userEmail={userToUnblock.email}
                    onCancel={onUnblockCanceled}
                    onBlockChanged={onUnblocked}
                />
            )}
        </Fragment>
    );
});
export default OwnerBlockedUsersPage;

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
                    {props.blockedUser.addressCityZip} {props.blockedUser.addressCity}
                    <br />
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
